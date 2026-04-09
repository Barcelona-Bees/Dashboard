// Application layer – Express API over hive data (calls bl functions to send data to frontend)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getStartTime, testPasskey } from "../dataLinkLayer/hiveUtils.js";
import {
    getCustomRangeTemperature,
    getLatestTemperatureReading,
    getTempMeasurement,
    insertTemp,
} from "../dataLinkLayer/temp.js";
import {
    getCustomRangeHumidity,
    getLatestHumidityReading,
    getHumidityMeasurement,
    insertHumidity
} from "../dataLinkLayer/humidity.js";
import { isValidDateValue, toNumericReading } from "../busLayer/utils.js";
// Startup DB check (see dbutils.verifyDatabaseConnection) — keeps PR behavior: no silent half-running server.
import { verifyDatabaseConnection } from "../dataLinkLayer/dbutils.js";

// Checks if the server should be started based on what starts it
function shouldStartHttpServer() {
    // Never auto-listen under Jest.
    if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === "test") return false;
    // PM2 always sets pm_id for managed processes.
    if (process.env.pm_id != null) return true;
    // Direct invocation: node .../al.js
    const argv1 = process.argv?.[1];
    if (argv1 && path.resolve(argv1) === path.resolve(fileURLToPath(import.meta.url))) {
        return true;
    }
    // Default: behave like an app entrypoint.
    return true;
}

const shouldStartServer = shouldStartHttpServer();

const app = express();
const DEFAULT_HIVE_ID = 1;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(((req, res, next) =>{
    console.log(req.path);
    next();
}));

app.use(express.json());

/** App Platform / load balancers: cheap liveness check (no DB hit). */
app.get("/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: true });
});

const readingStreamClients = new Set();

function notifyReadingStreamClients() {
    const dead = [];
    for (const clientRes of readingStreamClients) {
        try {
            clientRes.write("event: reading\ndata: {}\n\n");
        } catch {
            dead.push(clientRes);
        }
    }
    for (const r of dead) {
        readingStreamClients.delete(r);
    }
}

app.get("/events/readings", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
    }
    readingStreamClients.add(res);
    res.write("event: connected\ndata: {}\n\n");
    const ping = setInterval(() => {
        try {
            res.write(": ping\n\n");
        } catch {
            clearInterval(ping);
            readingStreamClients.delete(res);
        }
    }, 45_000);
    req.on("close", () => {
        clearInterval(ping);
        readingStreamClients.delete(res);
    });
});

function round(date) {
    const ms = 10 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / ms) * ms);
}

/**
 * Lower bound for valid queries: Hive.startDate (pg may return startdate / startDate keys).
 * Future dates are treated as invalid metadata so `dateOutOfRange(today)` does not return true
 * (that used to yield HTTP 400 on /temp/twoweeks and broke the dashboard with no data).
 *
 * Cached briefly: same value is read many times per request (`dateOutOfRange`) and across
 * concurrent GETs; start date rarely changes, so this cuts repeated DB round-trips on the VM.
 */
const HIVE_START_CACHE_MS = 60_000;
let hiveStartCache = { hiveId: /** @type {number|null} */ (null), expiresAt: 0, value: /** @type {Date|null} */ (null) };

async function getHiveStartDate(hiveID = DEFAULT_HIVE_ID) {
    const now = Date.now();
    if (
        hiveStartCache.hiveId === hiveID &&
        hiveStartCache.value != null &&
        now < hiveStartCache.expiresAt
    ) {
        return hiveStartCache.value;
    }
    const row = await getStartTime(hiveID);
    const raw = row?.startdate ?? row?.startDate;
    let d;
    if (!raw) {
        d = new Date(0);
    } else {
        d = new Date(raw);
        if (Number.isNaN(d.getTime())) d = new Date(0);
        else if (d.getTime() > Date.now()) d = new Date(0);
    }
    hiveStartCache = { hiveId: hiveID, expiresAt: now + HIVE_START_CACHE_MS, value: d };
    return d;
}

async function dateOutOfRange(d) {
    if (d.getTime() > Date.now()) return true;
    const start = await getHiveStartDate(DEFAULT_HIVE_ID);
    return d.getTime() < start.getTime();
}

/**
 * Gets data from a single timestamp.
 *
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/temp/measurement", async (req, res) => {
    const datetime = req.query.datetime;
    
    const timestamp = new Date(datetime);

    let timeOf = timestamp.getTime()/1000;

    if (!isValidDateValue(timestamp) || (await dateOutOfRange(timestamp))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    const result = await getTempMeasurement(DEFAULT_HIVE_ID, timeOf);

    const measurement = result.rows?.[0]?.reading ?? null;
    return res.status(200).json({ measurement });
});

/**
 * Gets the most recent temperature reading for the hive (latest row by timestamp).
 *
 * @returns json
 */
app.get("/temp/measurement/latest", async (req, res) => {
    try {
        const result = await getLatestTemperatureReading(DEFAULT_HIVE_ID);
        const measurement = result.rows?.[0]?.reading ?? null;
        const timestamp = result.rows?.[0]?.timestamp ?? null;
        return res.status(200).json({ measurement, timestamp });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
});

/**
 * Gets all the data from a 24 hour period.
 *
 * @param datetime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/temp/day", async (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;

    const today = new Date(req.query.datetime);
    const yesterday = new Date(today - dayInMS);

    if (!isValidDateValue(today)) {
        return res.status(400).json({ error: "Invalid date" });
    }

    if (
        !isValidDateValue(yesterday) ||
        (await dateOutOfRange(yesterday))
    ) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeTemperature(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeTemperature(
        DEFAULT_HIVE_ID,
        yesterday,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets roughly the past 7 days of data ending at datetime (same window logic as /day, but 7 days).
 *
 * @param datetime Datetime as a string: 2026-01-14
 * @returns json
 */
app.get("/temp/week", async (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;
    const weekInMS = 7 * dayInMS;

    const today = new Date(req.query.datetime);
    const weekAgo = new Date(today - weekInMS);

    if (!isValidDateValue(today)) {
        return res.status(400).json({ error: "Invalid date" });
    }

    if (
        !isValidDateValue(weekAgo) ||
        (await dateOutOfRange(weekAgo))
    ) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeTemperature(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeTemperature(
        DEFAULT_HIVE_ID,
        weekAgo,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets the past two weeks of data.
 *
 * @returns json
 */
app.get("/temp/twoweeks", async (req, res) => {
    const twoWeeksInMS = 1000 * 60 * 60 * 24 * 14;

    const today = round(new Date());
    const twoWeeks = new Date(today - twoWeeksInMS);

    if (!isValidDateValue(today) || (await dateOutOfRange(today))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    if (!isValidDateValue(twoWeeks) || (await dateOutOfRange(twoWeeks))) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeTemperature(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeTemperature(
        DEFAULT_HIVE_ID,
        twoWeeks,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets a custom range of data.
 *
 * @param startTime Datetime as a string: 2026-01-07T23:50:00
 * @param endTime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/temp/range", async (req, res) => {
    // replaces %3A with :
    const startParam = req.query.start;
    const endParam = req.query.end;

    const startTime = startParam.replaceAll("%3A",":");
    const endTime = endParam.replaceAll("%3A",":");
    
    let start = new Date(startTime);
    const end = new Date(endTime);

    //tests to see if date is out of range and if it is put it to the hive start date
    if (await dateOutOfRange(start)){
        start = await getHiveStartDate(DEFAULT_HIVE_ID);
    }

    if (!isValidDateValue(start)) {
        return res.status(400).json({ error: "Invalid or out-of-range start date" });
    }

    if (!isValidDateValue(end)) {
        return res.status(400).json({ error: "Invalid end date" });
    }

    if (await dateOutOfRange(end)) {
        const hiveStart = await getHiveStartDate(DEFAULT_HIVE_ID);
        const now = new Date();
        let endClamped = end;
        if (end.getTime() > now.getTime()) {
            endClamped = now;
        } else if (end.getTime() < hiveStart.getTime()) {
            endClamped = hiveStart;
        }

        const lo = new Date(Math.min(start.getTime(), endClamped.getTime()));
        const hi = new Date(Math.max(start.getTime(), endClamped.getTime()));
        const measurement = await getCustomRangeTemperature(DEFAULT_HIVE_ID, lo, hi);
        return res.status(200).json({ measurement });
    }
    
    const lo = new Date(Math.min(start.getTime(), end.getTime()));
    const hi = new Date(Math.max(start.getTime(), end.getTime()));
    const measurement = await getCustomRangeTemperature(DEFAULT_HIVE_ID, lo, hi);
    return res.status(200).json({ measurement });
});

app.post("/upload/temp", async (req, res) => {
    const { reading, timestamp, passkey } = req.body;

    if (!passkey) {
        return res.status(400).json({ error: "Invalid passkey" });
    }
    const hiveID = await testPasskey(passkey);
    if (hiveID === -1) {
        return res.status(400).json({ error: "Invalid passkey" });
    }
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (!isValidDateValue(ts)) {
        return res.status(400).json({ error: "timestamp is invalid" });
    }
    const readingNum = toNumericReading(reading);
    if (readingNum === null) {
        return res.status(400).json({ error: "reading is not a number" });
    }

    try {
        await insertTemp(hiveID, readingNum, ts);
    } catch (e) {
        return res.status(500).json({ error: "" + e });
    }

    notifyReadingStreamClients();
    return res.status(200).json({ success: true });
});

// ========================== HUMIDITY ================================

/**
 * Gets data from a single timestamp.
 *
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/Humidity/measurement", async (req, res) => {
    const datetime = req.query.datetime;
    
    const timestamp = new Date(datetime);

    let timeOf = timestamp.getTime()/1000;

    if (!isValidDateValue(timestamp) || (await dateOutOfRange(timestamp))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    const result = await getHumidityMeasurement(DEFAULT_HIVE_ID, timeOf);

    const measurement = result.rows?.[0]?.reading ?? null;
    return res.status(200).json({ measurement });
});

/**
 * Gets the most recent Humidity reading for the hive (latest row by timestamp).
 *
 * @returns json
 */
app.get("/Humidity/measurement/latest", async (req, res) => {
    try {
        const result = await getLatestHumidityReading(DEFAULT_HIVE_ID);
        const measurement = result.rows?.[0]?.reading ?? null;
        return res.status(200).json({ measurement });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
});

/**
 * Gets all the data from a 24 hour period.
 *
 * @param datetime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/Humidity/day", async (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;

    const today = new Date(req.query.datetime);
    const yesterday = new Date(today - dayInMS);

    if (!isValidDateValue(today)) {
        return res.status(400).json({ error: "Invalid date" });
    }

    if (
        !isValidDateValue(yesterday) ||
        (await dateOutOfRange(yesterday))
    ) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeHumidity(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeHumidity(
        DEFAULT_HIVE_ID,
        yesterday,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets roughly the past 7 days of data ending at datetime (same window logic as /day, but 7 days).
 *
 * @returns json
 */
app.get("/Humidity/week", async (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;
    const weekInMS = 7 * dayInMS;

    const today = new Date(req.query.datetime);
    const weekAgo = new Date(today - weekInMS);

    if (!isValidDateValue(today)) {
        return res.status(400).json({ error: "Invalid date" });
    }

    if (
        !isValidDateValue(weekAgo) ||
        (await dateOutOfRange(weekAgo))
    ) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeHumidity(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeHumidity(
        DEFAULT_HIVE_ID,
        weekAgo,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets the past two weeks of data.
 *
 * @returns json
 */
app.get("/Humidity/twoweeks", async (req, res) => {
    const twoWeeksInMS = 1000 * 60 * 60 * 24 * 14;

    const today = round(new Date());
    const twoWeeks = new Date(today - twoWeeksInMS);

    if (!isValidDateValue(today) || (await dateOutOfRange(today))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    if (!isValidDateValue(twoWeeks) || (await dateOutOfRange(twoWeeks))) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRangeHumidity(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRangeHumidity(
        DEFAULT_HIVE_ID,
        twoWeeks,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets a custom range of data.
 *
 * @param startTime Datetime as a string: 2026-01-07T23:50:00
 * @param endTime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/Humidity/range", async (req, res) => {
        // replaces %3A with :
        const startParam = req.query.start;
        const endParam = req.query.end;

        const startTime = startParam.replaceAll("%3A",":");
        const endTime = endParam.replaceAll("%3A",":");

        let start = new Date(startTime);
        const end = new Date(endTime);

        //tests to see if date is out of range and if it is put it to the hive start date
        if (await dateOutOfRange(start)){
            start = await getHiveStartDate(DEFAULT_HIVE_ID);
        }


    if (!isValidDateValue(start)) {
        return res.status(400).json({ error: "Invalid or out-of-range start date" });
    }

    if (!isValidDateValue(end)) {
        return res.status(400).json({ error: "Invalid end date" });
    }

    if (await dateOutOfRange(end)) {
        const hiveStart = await getHiveStartDate(DEFAULT_HIVE_ID);
        const now = new Date();
        let endClamped = end;
        if (end.getTime() > now.getTime()) {
            endClamped = now;
        } else if (end.getTime() < hiveStart.getTime()) {
            endClamped = hiveStart;
        }
        const lo = new Date(Math.min(start.getTime(), endClamped.getTime()));
        const hi = new Date(Math.max(start.getTime(), endClamped.getTime()));
        const measurement = await getCustomRangeHumidity(DEFAULT_HIVE_ID, lo, hi);
        return res.status(200).json({ measurement });
    }

    const lo = new Date(Math.min(start.getTime(), end.getTime()));
    const hi = new Date(Math.max(start.getTime(), end.getTime()));
    const measurement = await getCustomRangeHumidity(DEFAULT_HIVE_ID, lo, hi);
    return res.status(200).json({ measurement });
});

app.post("/upload/Humidity", async (req, res) => {
    const { reading, timestamp, passkey } = req.body;

    if (!passkey) {
        return res.status(400).json({ error: "Invalid passkey" });
    }
    const hiveID = await testPasskey(passkey);
    if (hiveID === -1) {
        return res.status(400).json({ error: "Invalid passkey" });
    }
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (!isValidDateValue(ts)) {
        return res.status(400).json({ error: "timestamp is invalid" });
    }
    const readingNum = toNumericReading(reading);
    if (readingNum === null) {
        return res.status(400).json({ error: "reading is not a number" });
    }

    try {
        await insertHumidity(hiveID, readingNum, ts);
    } catch (e) {
        return res.status(500).json({ error: "" + e });
    }

    notifyReadingStreamClients();
    return res.status(200).json({ success: true });
});


app.post("/uploadall/", async (req, res) => {
    // TTN / LoRaWAN webhook: { uplink_message: { decoded_payload: { ... } } }
    // Demo script & direct clients: { temp, humidity, timestamp, passkey } at top level
    const data =
        req.body?.uplink_message?.decoded_payload ??
        (req.body &&
        typeof req.body.temp !== "undefined" &&
        typeof req.body.humidity !== "undefined"
            ? req.body
            : null);

    if (!data || typeof data !== "object") {
        return res.status(400).json({
            error:
                "Invalid body: expected uplink_message.decoded_payload (TTN) or flat temp/humidity/timestamp/passkey",
        });
    }

    const { temp, humidity, timestamp, passkey } = data;

    if (!passkey) {
        return res.status(200).json({ error: " Passkey is not present" });
    }
    const hiveID = await testPasskey(passkey);
    if (hiveID === -1) {
        return res.status(200).json({ error: "Invalid passkey match" });
    }
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (!isValidDateValue(ts)) {
        return res.status(200).json({ error: "timestamp is invalid" });
    }
    const tempNum = toNumericReading(temp);
    if (tempNum === null) {
        return res.status(200).json({ error: "temperarutre is not a number" });
    }

    const humNum = toNumericReading(humidity);
    if (humNum === null) {
        return res.status(200).json({ error: "humidity is not a number" });
    }

    try {
        await insertTemp(hiveID, tempNum, ts);
        await insertHumidity(hiveID, humNum, ts);
    } catch (e) {
        return res.status(500).json({ error: "" + e });
    }

    notifyReadingStreamClients();
    return res.status(200).json({ success: true });
});

//Serves the frontend
const distDir = path.resolve(process.cwd(), "dist");
const indexHtmlPath = path.join(distDir, "index.html");
app.use(express.static(distDir));
function sendIndexHtml(res) {
    if (!fs.existsSync(indexHtmlPath)) {
        return res
            .status(404)
            .type("text/plain")
            .send(`Missing frontend build: ${indexHtmlPath}\nRun: npm run build`);
    }
    return res.sendFile(indexHtmlPath, (err) => {
        if (err) {
            // Ensure the request never hangs if sendFile errors.
            if (!res.headersSent) {
                res.status(500).type("text/plain").send(String(err));
            } else {
                res.end();
            }
        }
    });
}

app.get("/", (req, res) => sendIndexHtml(res));
app.get(/.*/, (req, res) => sendIndexHtml(res));

const PORT = Number(process.env.PORT) || 3000;

export { app };

if (shouldStartServer) {
    (async () => {
        // Start listening first. (Under PM2 we saw the DB preflight can hang, leaving the process "online"
        // but with no open port and resulting in 503s from upstream.)
        const server = app.listen(PORT, "0.0.0.0");

        // Disable keep-alive at the Node layer when requested. This pairs with FORCE_CONNECTION_CLOSE
        // to work around strict proxies that only allow one concurrent connection per client.

        server.once("error", (err) => {
            console.error("Failed to start server:", err.message);
            if (err.code === "EADDRINUSE") {
                console.error(
                    `Port ${PORT} is already in use (another dev:backend or app is running). Stop that process or set a different port, e.g. PORT=3002 npm run dev:backend`
                );
            }
            process.exit(1);
        });

        server.once("listening", () => {
            const addr = server.address();
            const host =
                typeof addr === "object" && addr ? addr.address : "localhost";
            const port = typeof addr === "object" && addr ? addr.port : PORT;
            console.log(
                `Backend listening on http://${host === "::" ? "localhost" : host}:${port}`
            );
        });

        // Run DB connectivity check in the background and log the result.
        // If Postgres is down, the server stays up (static frontend still works) and API calls will error normally.
        try {
            const dbCheck = await verifyDatabaseConnection();
            if (!dbCheck.ok) {
                console.error("[db] Cannot connect to PostgreSQL:", dbCheck.message);
            } else {
                console.log(
                    "[db] OK —",
                    process.env.PGUSER || "student",
                    "@",
                    process.env.PGHOST || "localhost",
                    "/",
                    process.env.PGDATABASE || "siteinfo"
                );
            }
        } catch (e) {
            console.error("[db] Preflight threw:", String(e));
        }
    })();
}
