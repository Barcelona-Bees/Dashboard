/**
 * Outside temperature for the "inside vs outside" chart and the Outside hero box.
 *
 * Flow:
 * 1. getHourlyOutsideTempsByDate(lat, lon) calls Open-Meteo Forecast API with past_days=1,
 *    returning hourly temps for yesterday + today. Default location: RIT campus, Rochester, NY.
 * 2. buildExternalTempFMapForDate(dateStr, weatherMap, cToF) filters that to one day and
 *    converts to °F, keyed by "0:00".."23:00".
 * 3. HomeScreen uses that map for the chart and for currentOutsideTempF (hero). If the
 *    chart date is not in the API response (e.g. demo data from 2026), we use
 *    getSyntheticExternalTempF() so the two lines and hero values still differ.
 */

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/** Default location: RIT campus, Rochester, NY */
const DEFAULT_LAT = 43.0848;
const DEFAULT_LON = -77.6799;

/**
 * Fetches hourly outside temperature for the last 2 days (yesterday + today)
 * so we can align with chart data by date.
 *
 * @returns {Promise<Map<string, number>>} Map keyed by "YYYY-MM-DD" + " " + "H:00" (e.g. "2025-02-24 14:00") -> temperature in Celsius
 */
export async function getHourlyOutsideTempsByDate(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m',
    past_days: 1,
  });
  const url = `${OPEN_METEO_BASE}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather API ${res.status}`);
  }
  const data = await res.json();
  if (!data.hourly || !Array.isArray(data.hourly.time)) {
    throw new Error('Invalid weather response');
  }

  const map = new Map();
  const times = data.hourly.time;
  const temps = data.hourly.temperature_2m || [];

  for (let i = 0; i < times.length; i++) {
    const iso = times[i]; // e.g. "2025-02-24T14:00"
    const tempC = temps[i] != null ? Number(temps[i]) : null;
    if (tempC == null || Number.isNaN(tempC)) continue;
    const [datePart, timePart] = iso.split('T');
    const hourNum = timePart ? parseInt(timePart.slice(0, 2), 10) : 0;
    const hourLabel = `${hourNum}:00`; // "0:00", "14:00" to match chart labels
    const key = `${datePart} ${hourLabel}`;
    map.set(key, tempC);
  }
  return map;
}

/**
 * Build a map from hour label ("0:00", "1:00", ...) to outside temp in °F for a given date.
 * Uses real weather when available for that date; otherwise returns null (caller can use synthetic).
 *
 * @param {string} dateStr - Date in YYYY-MM-DD (from backend chart data)
 * @param {Map<string, number>} weatherByDateTime - Result from getHourlyOutsideTempsByDate()
 * @param {function(number): number} cToF - Celsius to Fahrenheit converter
 * @returns {Object.<string, number>} { "0:00": 45, "1:00": 44, ... } in °F, or empty if no data for that date
 */
export function buildExternalTempFMapForDate(dateStr, weatherByDateTime, cToF) {
  const out = {};
  for (let h = 0; h < 24; h++) {
    const hourLabel = `${h}:00`;
    const key = `${dateStr} ${hourLabel}`;
    const tempC = weatherByDateTime.get(key);
    if (tempC != null && !Number.isNaN(tempC)) {
      out[hourLabel] = cToF(tempC);
    }
  }
  return out;
}

/**
 * Synthetic outside temp when we have no weather API data for the chart date
 * (e.g. demo data from 2026). Returns a plausible offset so the two chart lines differ.
 *
 * @param {number} internalTempF - Inside hive temp for that point
 * @param {number} hourIndex - 0..23
 * @returns {number} Outside temp in °F
 */
export function getSyntheticExternalTempF(internalTempF, hourIndex) {
  const offset = 5 + Math.sin((hourIndex / 24) * Math.PI * 2) * 2;
  return Number((internalTempF - offset).toFixed(1));
}
