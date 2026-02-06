// Application layer – Express API over hive data (calls bl functions to send data to frontend)

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// MOCK data
var hiveData = [];

/**
 * Gets data from a single timestamp.
 *
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 * @returns [timestamp, temp, humidity]
 */
function getMeasurement(datetime) {
  let len = hiveData.length;
  for (let i = 0; i < len; i++) {
    let timestamp = hiveData[i];
    let ts = timestamp.split(",");
    if (ts[0] == datetime) {
      return ts;
    }
  }
  return [datetime, "0", "0"];
}

/**
 * Gets all the data from a day.
 *
 * @param date Date as a string: 2026-01-14
 * @returns [[timestamp, temp, humidity], ...]
 */
function getDay(date) {
  let len = hiveData.length;
  var data = [];
  for (let i = 0; i < len; i++) {
    let timestamp = hiveData[i];
    let ts = timestamp.split(",");
    let tsDate = ts[0].split("T");
    if (tsDate[0] == date) {
      data.push(ts);
    }
  }
  return data;
}

/**
 * Gets the past two weeks of data. (hardcoded to 1/14/26 for now)
 *
 * @returns [[timestamp, temp, humidity], ...]
 */
function getTwoWeeks() {
  const currentDatetime = "2026-01-14T23:50:00";
  const today = new Date(currentDatetime);

  const TEN_MINUTES_MS = 10 * 60 * 1000;
  const ENTRIES = 2016;

  const twoWeeks = new Date(today.getTime() - ENTRIES * TEN_MINUTES_MS);

  const data = [];

  for (let i = 0; i < hiveData.length; i++) {
    const tsString = hiveData[i].split(",")[0];
    const tsDate = new Date(tsString);

    // start inclusive, end exclusive
    if (tsDate > twoWeeks && tsDate <= today) {
      data.push(getMeasurement(tsString));
    }
  }

  return data;
}

async function readCSV() {
  const filePath = path.join(
    __dirname,
    "../../public/testData/beehive_measurements.csv"
  );
  const data = await fs.readFile(filePath, "utf-8");
  const parsedData = data.split("\r\n");

  for (let i = 1; i < parsedData.length; i++) {
    hiveData.push(parsedData[i]);
  }
}

/**
 * Initializes the data when reading from csv.
 * Always run this before trying to access data.
 */
async function init() {
  await readCSV();
}

function verifyCSV() {
  return hiveData;
}

// ---------------------------------------------------------------------------
// Express route handlers (exported for Jest tests)
// ---------------------------------------------------------------------------

/** GET /measurement/:datetime  e.g. 2026-01-14T23:50:00 */
function measurementHandler(req, res) {
  const [timestamp, temp, humidity] = getMeasurement(req.params.datetime);
  res.json({ timestamp, temp, humidity });
}

/** GET /day/:date  e.g. 2026-01-14 */
function dayHandler(req, res) {
  const data = getDay(req.params.date);
  res.json({ date: req.params.date, data });
}

/** GET /two-weeks */
function twoWeeksHandler(req, res) {
  const data = getTwoWeeks();
  res.json({ data });
}

/** GET /verify – debug (same as verifyCSV) */
function verifyHandler(req, res) {
  res.json({ hiveData });
}

app.get("/measurement/:datetime", measurementHandler);
app.get("/day/:date", dayHandler);
app.get("/two-weeks", twoWeeksHandler);
app.get("/verify", verifyHandler);

// ---------------------------------------------------------------------------
// Start server only when run directly (not when required by tests)
// ---------------------------------------------------------------------------

async function start() {
  await init();
  app.listen(PORT, () => {
    console.log(`Application layer API on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
}

module.exports = {
  app,
  init,
  measurementHandler,
  dayHandler,
  twoWeeksHandler,
  verifyHandler,
};
