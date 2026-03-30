const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  "http://localhost:3001";

const DEFAULT_HUMIDITY = 60;

function measurementRows(json) {
  const raw = json?.measurement;
  if (!raw) return [];
  if (Array.isArray(raw.rows)) return raw.rows;
  if (Array.isArray(raw)) return raw;
  return [];
}

function rowToPoint(row) {
  const ts = row.timestamp;
  const reading = row.reading;
  return {
    timestamp: ts instanceof Date ? ts.toISOString() : String(ts),
    temperatureC: reading != null ? parseFloat(reading) : NaN,
    humidity: DEFAULT_HUMIDITY,
  };
}

/**
 * Fetches the most recent reading (current state)
 * Uses the latest row from two-weeks data
 */
export async function getCurrentReading() {
  const response = await fetch(`${API_BASE}/twoweeks`);
  if (!response.ok) {
    throw new Error(`GET /twoweeks failed: ${response.status}`);
  }
  const json = await response.json();
  const rows = measurementRows(json);
  if (rows.length === 0) {
    throw new Error("No data available");
  }
  const latest = rows[rows.length - 1];
  return rowToPoint(latest);
}

/**
 * Fetches all data for a specific day
 */
export async function getDayData(date) {
  const dt = `${date}T12:00:00`;
  const response = await fetch(
    `${API_BASE}/day?datetime=${encodeURIComponent(dt)}`
  );
  if (!response.ok) {
    throw new Error(`GET /day failed: ${response.status}`);
  }
  const json = await response.json();
  return measurementRows(json).map(rowToPoint);
}

/**
 * Fetches past two weeks of data
 */
export async function getTwoWeeksData() {
  const response = await fetch(`${API_BASE}/twoweeks`);
  if (!response.ok) {
    throw new Error(`GET /twoweeks failed: ${response.status}`);
  }
  const json = await response.json();
  return measurementRows(json).map(rowToPoint);
}

/**
 * Fetches a single measurement by datetime
 */
export async function getMeasurement(datetime) {
  const response = await fetch(
    `${API_BASE}/measurement?datetime=${encodeURIComponent(datetime)}`
  );
  if (!response.ok) {
    throw new Error(`GET /measurement failed: ${response.status}`);
  }
  const json = await response.json();
  const reading = json.measurement;
  return {
    timestamp: datetime,
    temperatureC: reading != null ? parseFloat(reading) : NaN,
    humidity: DEFAULT_HUMIDITY,
  };
}
