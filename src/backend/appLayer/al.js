// Application layer – Express API over hive data (calls bl functions to send data to frontend)

import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Parse JSON request bodies.
app.use(express.json());

// Very simple CORS setup so the Vite dev server can call this API.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    // Short-circuit preflight requests.
    return res.sendStatus(204);
  }

  next();
});

const PORT = process.env.PORT || 3001;

// MOCK data
var hiveData = [];

// Very small in-memory "user database" for demo auth.
// Keys are emails, values are plain-text passwords.
// This keeps things extremely simple and avoids any real DB setup.
const users = new Map();

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
  // Handle both \r\n (Windows) and \n (Unix) line endings
  const parsedData = data.split(/\r?\n/).filter(line => line.trim() !== '');

  for (let i = 1; i < parsedData.length; i++) {
    if (parsedData[i].trim()) {
      hiveData.push(parsedData[i]);
    }
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
// Auth endpoints (very small, demo-only implementation)
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Body: { email, password }
 *
 * For this demo:
 * - Stores users in memory (Map)
 * - Rejects if the email already exists
 * - Returns a simple string token the frontend treats as a JWT
 */
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  if (users.has(email)) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  users.set(email, password);

  // In a real app this would be a signed JWT. For this dashboard,
  // the frontend only needs a string token, so we keep it simple.
  const token = `demo-token-${Date.now()}`;

  return res.status(201).json({ token });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * - Checks the in-memory user map
 * - Returns a new simple token when credentials are valid
 */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const storedPassword = users.get(email);
  if (!storedPassword || storedPassword !== password) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = `demo-token-${Date.now()}`;
  return res.json({ token });
});

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

// Check if this is the main module by comparing normalized file paths
const isMainModule = (() => {
  if (!process.argv[1]) return false;
  // Convert process.argv[1] to absolute path and normalize
  const mainModulePath = path.resolve(process.argv[1]);
  // Compare with current module's absolute path
  return path.resolve(__filename) === mainModulePath;
})();

if (isMainModule) {
  start().catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
}

export {
  app,
  init,
  measurementHandler,
  dayHandler,
  twoWeeksHandler,
  verifyHandler,
};