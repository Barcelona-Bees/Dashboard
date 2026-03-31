/**
 * Beehive API client — browser `fetch` to Express in src/backend/appLayer/al.js.
 * Base URL: VITE_API_BASE (build-time) so production can point at the VM host:port.
 * Paths match the server: /temp/*, /Humidity/*, `/events/readings` (SSE after uploads).
 * Temperature values are treated as °F at the dashboard layer (matches DB `reading` for this project).
 */

function defaultApiBase() {
  // Prefer same-origin in production (frontend is served by the same Express app).
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  // Fallback for tests / non-browser contexts.
  return "http://localhost:3001";
}

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  defaultApiBase();

// Build-time flag (Vite replaces import.meta.env.* with literals in production builds).
// Keeping this expression simple allows bundlers to remove the SSE code when disabled.
const DISABLE_SSE = (() => {
  const raw = (import.meta.env?.VITE_DISABLE_SSE ?? "").toString().toLowerCase();
  return raw === "1" || raw === "true";
})();

/**
 * Normalized row for charts/KPIs. `temperatureF` matches DB column `reading`
 * (stored as Fahrenheit per your sensor pipeline).
 */
function measurementRows(json) {
  const raw = json?.measurement;
  if (!raw) return [];
  if (Array.isArray(raw.rows)) return raw.rows;
  if (Array.isArray(raw)) return raw;
  return [];
}

/** GET helper: surfaces Express `{ error: "..." }` body in the thrown message for easier debugging (400 vs 500). */
async function fetchMeasurementJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody.error ? ` — ${errBody.error}` : "";
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`GET ${path} failed: ${response.status}${detail}`);
  }
  return response.json();
}

function rowToPoint(row, humidity) {
  const ts = row.timestamp;
  const reading = row.reading;
  return {
    timestamp: ts instanceof Date ? ts.toISOString() : String(ts),
    temperatureF: reading != null ? parseFloat(reading) : NaN,
    humidity: humidity != null && !Number.isNaN(humidity) ? humidity : null,
  };
}

/** Match humidity samples to temp rows by exact timestamp (ms) or nearest within 10 minutes. */
function mergeHumidityOntoTempRows(tempRows, humidityRows) {
  const humByMs = new Map();
  for (const h of humidityRows) {
    const ms = new Date(h.timestamp).getTime();
    if (!Number.isNaN(ms)) humByMs.set(ms, parseFloat(h.reading));
  }
  return tempRows.map((row) => {
    const ms = new Date(row.timestamp).getTime();
    let humidity = Number.isNaN(ms) ? null : humByMs.get(ms);
    if (humidity == null && !Number.isNaN(ms)) {
      let best = null;
      let bestDelta = Infinity;
      for (const [hms, val] of humByMs) {
        const d = Math.abs(hms - ms);
        if (d <= 10 * 60 * 1000 && d < bestDelta) {
          bestDelta = d;
          best = val;
        }
      }
      humidity = best != null && !Number.isNaN(best) ? best : null;
    }
    return rowToPoint(row, humidity);
  });
}

/** If the merged series has no humidity but /Humidity/measurement/latest exists, attach it to the last point for KPI/gauges. */
async function enrichLatestHumidity(points) {
  if (points.length === 0) return points;
  const last = points[points.length - 1];
  if (last.humidity != null) return points;
  try {
    const j = await fetchMeasurementJson("/Humidity/measurement/latest");
    const h = j.measurement != null ? parseFloat(j.measurement) : null;
    if (h == null || Number.isNaN(h)) return points;
    const next = [...points];
    next[next.length - 1] = { ...last, humidity: h };
    return next;
  } catch {
    return points;
  }
}

async function fetchTempAndHumidityRows(tempPath, humidityPath) {
  const tempJson = await fetchMeasurementJson(tempPath);
  const tempRows = measurementRows(tempJson);
  let humRows = [];
  try {
    const humJson = await fetchMeasurementJson(humidityPath);
    humRows = measurementRows(humJson);
  } catch {
    // Humidity table may be empty or endpoint down — still show temperature-only series.
    humRows = [];
  }
  let merged = mergeHumidityOntoTempRows(tempRows, humRows);
  merged = await enrichLatestHumidity(merged);
  return merged;
}

/**
 * Primary integration: temperature (+ humidity when available) for the default hive.
 * Shape aligns with a generic readings contract: hiveId, reading (numeric), timestamp, humidity.
 *
 * @param {number} hiveId Reserved for when the backend accepts ?hiveId=; currently ignored (server uses hive 1).
 */
export async function getReadings(hiveId = 1) {
  const points = await fetchTempAndHumidityRows(
    "/temp/twoweeks",
    "/Humidity/twoweeks"
  );
  return points.map((p) => ({
    hiveId,
    reading: p.temperatureF,
    timestamp: p.timestamp,
    humidity: p.humidity,
  }));
}

/**
 * Latest merged sample, or null when there are no rows in range (empty Temperature table).
 * Returns null instead of throwing so the UI can show an empty state instead of a fake "server down" error.
 */
export async function getCurrentReading() {
  const points = await fetchTempAndHumidityRows(
    "/temp/twoweeks",
    "/Humidity/twoweeks"
  );
  if (points.length === 0) {
    return null;
  }
  return points[points.length - 1];
}

/**
 * Latest temp + humidity from `/measurement/latest` (true latest rows), not the last point of twoweeks merge.
 * Shape matches merged points: `{ temperatureF, humidity, timestamp }` for `transformToFrontendFormat`.
 */
export async function getCurrentReadingAlt() {
  try {
    const t = await fetchMeasurementJson("/temp/measurement/latest");
    if (t.measurement == null) return null;
    const temperatureF = parseFloat(t.measurement);
    if (Number.isNaN(temperatureF)) return null;

    let hum = null;
    try {
      const h = await fetchMeasurementJson("/Humidity/measurement/latest");
      if (h.measurement != null) {
        const v = parseFloat(h.measurement);
        if (!Number.isNaN(v)) hum = v;
      }
    } catch {
      /* humidity optional */
    }

    const ts =
      t.timestamp != null
        ? t.timestamp instanceof Date
          ? t.timestamp.toISOString()
          : String(t.timestamp)
        : null;

    return { temperatureF, humidity: hum, timestamp: ts };
  } catch {
    return null;
  }
}

/** Refetch when the server inserts a reading (opens `EventSource` to `${API_BASE}/events/readings`). */
export function subscribeReadingUpdates(onUpdate) {
  if (DISABLE_SSE) {
    return () => {};
  }
  if (typeof EventSource === "undefined") {
    return () => {};
  }
  const es = new EventSource(`${API_BASE}/events/readings`);
  es.addEventListener("reading", () => {
    onUpdate();
  });
  return () => {
    es.close();
  };
}

export async function getTwoWeeksData() {
  return fetchTempAndHumidityRows("/temp/twoweeks", "/Humidity/twoweeks");
}

export async function getDayData(date) {
  const dt = `${date}T12:00:00`;
  const q = `?datetime=${encodeURIComponent(dt)}`;
  return fetchTempAndHumidityRows(`/temp/day${q}`, `/Humidity/day${q}`);
}

export async function getMeasurement(datetime) {
  const response = await fetch(
    `${API_BASE}/temp/measurement?datetime=${encodeURIComponent(datetime)}`
  );
  if (!response.ok) {
    throw new Error(`GET /temp/measurement failed: ${response.status}`);
  }
  const json = await response.json();
  const reading = json.measurement;
  return {
    timestamp: datetime,
    temperatureF: reading != null ? parseFloat(reading) : NaN,
    humidity: null,
  };
}