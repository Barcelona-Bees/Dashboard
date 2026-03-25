// Application layer – Express API over hive data (calls bl functions to send data to frontend)

import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getData, insertData, runDirectSQLwithPrepared } from "../dataLinkLayer/dbutils.js";

/** True when this file is the process entrypoint (not when Jest or another module imports it). */
const isMainModule =
    Boolean(process.argv[1]) &&
    path.resolve(fileURLToPath(import.meta.url)) ===
        path.resolve(process.argv[1]);

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

app.use(express.json());

function round(date) {
    const ms = 10 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / ms) * ms);
}

function isValidDateValue(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}

function isNum(data) {
    return typeof data === "number";
}

async function isValidHive(id) {
    const data = await getData("hive", ["hiveID"], { hiveID: id });
    return (data.rows?.length ?? 0) > 0;
}

async function getHiveStartDate(hiveID = DEFAULT_HIVE_ID) {
    const data = await getData("hive", ["startdate"], { hiveID });
    const row = data.rows?.[0];
    if (!row?.startdate) return new Date(0);
    return new Date(row.startdate);
}

async function dateOutOfRange(d) {
    if (d.getTime() > Date.now()) return true;
    const start = await getHiveStartDate(DEFAULT_HIVE_ID);
    return d.getTime() < start.getTime();
}

async function getCustomRange(hiveID, startDate, endDate) {
    const sql =
        "SELECT timestamp, reading FROM Temperature WHERE hiveID = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC";
    return await runDirectSQLwithPrepared(sql, [hiveID, startDate, endDate]);
}

async function getTemperatureValue(timestamp, hiveID = DEFAULT_HIVE_ID) {
    const sql =
        "SELECT reading FROM Temperature WHERE hiveID = $1 AND timestamp = $2 LIMIT 1";
    const r = await runDirectSQLwithPrepared(sql, [hiveID, timestamp]);
    return r.rows?.[0]?.reading ?? null;
}

/**
 * Gets data from a single timestamp.
 *
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/measurement", async (req, res) => {
    const timestamp = new Date(req.query.datetime);

    if (!isValidDateValue(timestamp) || (await dateOutOfRange(timestamp))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    const measurement = await getTemperatureValue(timestamp);
    return res.status(200).json({ measurement });
});

/**
 * Gets most recent timestamp of data.
 *
 * @returns json
 */
app.get("/measurement/latest", async (req, res) => {
    const timestamp = round(new Date());

    if (!isValidDateValue(timestamp) || (await dateOutOfRange(timestamp))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    const measurement = await getTemperatureValue(timestamp);
    return res.status(200).json({ measurement });
});

/**
 * Gets all the data from a 24 hour period.
 *
 * @param datetime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get("/day", async (req, res) => {
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
        const measurement = await getCustomRange(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRange(
        DEFAULT_HIVE_ID,
        yesterday,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets the past week of data.
 *
 * @returns json
 */
app.get("/week", async (req, res) => {
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
        const measurement = await getCustomRange(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRange(
        DEFAULT_HIVE_ID,
        yesterday,
        today
    );
    return res.status(200).json({ measurement });
});

/**
 * Gets the past two weeks of data.
 *
 * @returns json
 */
app.get("/twoweeks", async (req, res) => {
    const twoWeeksInMS = 1000 * 60 * 60 * 24 * 14;

    const today = round(new Date());
    const twoWeeks = new Date(today - twoWeeksInMS);

    if (!isValidDateValue(today) || (await dateOutOfRange(today))) {
        return res.status(400).json({ error: "Invalid or out-of-range date" });
    }

    if (!isValidDateValue(twoWeeks) || (await dateOutOfRange(twoWeeks))) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const measurement = await getCustomRange(
            DEFAULT_HIVE_ID,
            startDate,
            today
        );
        return res.status(200).json({ measurement });
    }

    const measurement = await getCustomRange(
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
app.get("/range", async (req, res) => {
    const start = new Date(req.query.start);
    const end = new Date(req.query.end);

    if (!isValidDateValue(start) || (await dateOutOfRange(start))) {
        return res.status(400).json({ error: "Invalid or out-of-range start date" });
    }

    if (!isValidDateValue(end) || (await dateOutOfRange(end))) {
        const startDate = await getHiveStartDate(DEFAULT_HIVE_ID);
        const lo = new Date(Math.min(startDate.getTime(), start.getTime()));
        const hi = new Date(Math.max(startDate.getTime(), start.getTime()));
        const measurement = await getCustomRange(DEFAULT_HIVE_ID, lo, hi);
        return res.status(200).json({ measurement });
    }

    const lo = new Date(Math.min(start.getTime(), end.getTime()));
    const hi = new Date(Math.max(start.getTime(), end.getTime()));
    const measurement = await getCustomRange(DEFAULT_HIVE_ID, lo, hi);
    return res.status(200).json({ measurement });
});

app.post("/upload", async (req, res) => {
    const { hiveID, timestamp, key, temperature } = req.body;

    if (!key) {
        return res.status(400).json({ error: "Invalid Key" });
    }
    if (!(await isValidHive(hiveID))) {
        return res.status(400).json({ error: "hiveID is invalid" });
    }
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (!isValidDateValue(ts)) {
        return res.status(400).json({ error: "timestamp is invalid" });
    }
    if (!isNum(temperature)) {
        return res.status(400).json({ error: "temperature is not a number" });
    }

    try {
        await insertData("Temperature", {
            hiveID,
            reading: temperature,
            timestamp: ts,
        });
    } catch (e) {
        return res.status(500).json({ error: "" + e });
    }

    return res.status(200).json({ success: true });
});

const PORT = Number(process.env.PORT) || 3001;

export { app };

if (isMainModule) {
    const server = app.listen(PORT);

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
        const host = typeof addr === "object" && addr ? addr.address : "localhost";
        const port = typeof addr === "object" && addr ? addr.port : PORT;
        console.log(`Backend listening on http://${host === "::" ? "localhost" : host}:${port}`);
    });
}
