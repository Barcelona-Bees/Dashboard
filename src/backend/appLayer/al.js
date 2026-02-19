// Application layer – Express API over hive data (calls bl functions to send data to frontend)

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const dl = require("../dataLayer/dl.js");
const bl = require("../businessLayer/bl.js");

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

    if (!bl.isValidDate(timestamp) || bl.dateOutOfRange(timestamp)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    const measurement = dl.getTemperatureValue(timestamp);
    return res.status(200).json({ measurement });
});

/**
 * Gets most recent timestamp of data.
 *
 * @returns json
 */
app.get('/measurement/latest', (req, res) => {
    const timestamp = round(new Date());

    if (!bl.isValidDate(timestamp) || bl.dateOutOfRange(timestamp)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    const measurement = dl.getTemperatureValue(timestamp);
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

    if (!bl.isValidDate(today)) {
        return res.status(400).json({ error: 'Invalid date' });
    }

    if (bl.isValidDate(yesterday) || bl.dateOutOfRange(yesterday)) {
        const startDate = dl.getStartDate();
        return res.status(200).json({ measurement: dl.getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: dl.getCustomRange(today, yesterday) });
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

    if (!bl.isValidDate(today)) {
        return res.status(400).json({ error: 'Invalid date' });
    }

    if (bl.isValidDate(yesterday) || bl.dateOutOfRange(yesterday)) {
        const startDate = dl.getStartDate();
        return res.status(200).json({ measurement: dl.getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: dl.getCustomRange(today, yesterday) });
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

    if (!bl.isValidDate(today) || bl.dateOutOfRange(today)) {
        return res.status(400).json({ error: 'Invalid or out-of-range date' });
    }

    if (!bl.isValidDate(twoWeeks) || bl.dateOutOfRange(twoWeeks)) {
        const startDate = dl.getStartDate();
        return res.status(200).json({ measurement: dl.getCustomRange(today, startDate) });
    }

    return res.status(200).json({ measurement: dl.getCustomRange(today, twoWeeks) });
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

    if (!bl.isValidDate(start) || bl.dateOutOfRange(start)) {
        return res.status(400).json({ error: 'Invalid or out-of-range start date' });
    }

    if (!bl.isValidDate(end) || bl.dateOutOfRange(end)) {
        const startDate = dl.getStartDate();
        return res.status(200).json({ measurement: dl.getCustomRange(start, startDate) });
    }

    return res.status(200).json({ measurement: dl.getCustomRange(start, end) });
});