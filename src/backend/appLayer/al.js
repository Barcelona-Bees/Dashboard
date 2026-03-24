// Application layer – Express API over hive data (calls bl functions to send data to frontend)

import express from "express";
import { getCustomRange } from "../dataLinkLayer/temp.js";
import { isValidDate, isValidHive, isNum } from "../busLayer/utils.js";

const app = express();

function round(date) {
    const ms = 10 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / ms) * ms);
}

/**
 * Gets data from a single timestamp.
 *
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get('/measurement', (req, res) => {
    const timestamp = new Date(req.query.datetime);

    if (!isValidDate(timestamp) || dateOutOfRange(timestamp)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    const measurement = getTemperatureValue(timestamp);
    return res.status(200).json({ measurement });
});

/**
 * Gets most recent timestamp of data.
 *
 * @returns json
 */
app.get('/measurement/latest', (req, res) => {
    const timestamp = round(new Date());

    if (!isValidDate(timestamp) || dateOutOfRange(timestamp)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    const measurement = getTemperatureValue(timestamp);
    return res.status(200).json({ measurement });
});

/**
 * Gets all the data from a 24 hour period.
 *
 * @param datetime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get('/day', (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;

    const today = new Date(req.query.datetime);
    const yesterday = new Date(today - dayInMS);

    if (!isValidDate(today)) {
        return res.status(400).json({ error: 'Invalid date' });
    }

    if (isValidDate(yesterday) || dateOutOfRange(yesterday)) {
        const startDate = getStartDate();
        return res.status(200).json({ measurement: getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: getCustomRange(today, yesterday) });
});

/**
 * Gets the past week of data.
 *
 * @returns json
 */
app.get('/week', (req, res) => {
    const dayInMS = 1000 * 60 * 60 * 24;

    const today = new Date(req.query.datetime);
    const yesterday = new Date(today - dayInMS);

    if (!isValidDate(today)) {
        return res.status(400).json({ error: 'Invalid date' });
    }

    if (isValidDate(yesterday) || dateOutOfRange(yesterday)) {
        const startDate = getStartDate();
        return res.status(200).json({ measurement: getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: getCustomRange(today, yesterday) });
});

/**
 * Gets the past two weeks of data.
 *
 * @returns json
 */
app.get('/twoweeks', (req, res) => {
    const twoWeeksInMS = 1000 * 60 * 60 * 24 * 14;

    const today = round(new Date());
    const twoWeeks = new Date(today - twoWeeksInMS);

    if (!isValidDate(today) || dateOutOfRange(today)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    if (!isValidDate(twoWeeks) || dateOutOfRange(twoWeeks)) {
        const startDate = getStartDate();
        return res.status(200).json({ measurement: getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: getCustomRange(today, twoWeeks) });
});

/**
 * Gets a custom range of data.
 *
 * @param startTime Datetime as a string: 2026-01-07T23:50:00
 * @param endTime Datetime as a string: 2026-01-14T23:50:00
 * @returns json
 */
app.get('/range', (req, res) => {
    const start = new Date(req.query.start);
    const end = new Date(req.query.end);

    if (!isValidDate(start) || dateOutOfRange(start)) {
        return res.status(400).json({ error: 'Invalid or out-of-range start date' });
    }

    if (!isValidDate(end) || dateOutOfRange(end)) {
        const startDate = getStartDate();
        return res.status(200).json({ measurement: getCustomRange(start, startDate) });
    }

    return res.status(200).json({ measurement: getCustomRange(start, end) });
});

app.post('/upload', (req, res) => {
    const { hiveID, timestamp, key, temperature } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'Invalid Key' });
    }
    if (!isValidHive(hiveID)) {
        return res.status(400).json({ error: 'hiveID is invalid' });
    }
    if (!bl.isValidDate(timestamp)) {
        return res.status(400).json({ error: 'timestamp is invalid' });
    }
    if (!isNum(temperature)) {
        return res.status(400).json({ error: 'temperature is not a number' });
    }

    try {
        insertTemp(hiveID, temperature, timestamp);
    } catch (e) {
        return res.status(500).json({ error: '' + e });
    }

    return res.status(200).json({ success: true });
});