/**
 * alerts.js – Rule-based alerts from readings and thresholds
 *
 * `computeAlerts` / `computeAlertsAt` use the latest reading only (current snapshot).
 * `collectAlertsFromPoints` walks historical merged samples for dashboard history.
 */
import { THRESHOLDS_F, findRangeForValue } from "../config/thresholds";
import { transformToFrontendFormat } from "./dataTransform";

/** Rolling window for the Alerts screen (days). */
export const ALERT_HISTORY_DAYS = 30;

/** Page size for paginated alert lists (Home “today”, Notifications history). */
export const ALERTS_PAGE_SIZE = 15;

function formatAlertTime(date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Alerts for a single reading at a specific time (historical or “now”).
 * @param {Object} readings - { internalTemp, externalTemp, humidity }
 * @param {Date|string|number} atDate - when this sample occurred
 * @returns {Array<{ id: string, type: string, text: string, severity: string, metric: string, time: string }>}
 */
export function computeAlertsAt(readings, atDate) {
  if (!readings) return [];

  const at = atDate instanceof Date ? atDate : new Date(atDate);
  const t = at.getTime();
  const timeStr = formatAlertTime(at);
  const alerts = [];

  const internalR = findRangeForValue(readings.internalTemp, THRESHOLDS_F.internalTempF.ranges);
  if (internalR && internalR.color !== "green") {
    alerts.push({
      id: `HIVE_TEMP-${t}`,
      type: "HIVE_TEMP",
      text: `Inside hive temperature is ${internalR.label} (${readings.internalTemp.toFixed(1)}°F).`,
      severity: internalR.color === "red" ? "critical" : "warning",
      metric: "internalTemp",
      time: timeStr,
    });
  }

  if (readings.humidity != null && !Number.isNaN(readings.humidity)) {
    const humidityR = findRangeForValue(readings.humidity, THRESHOLDS_F.humidityPct.ranges);
    if (humidityR && humidityR.color !== "green") {
      alerts.push({
        id: `HUMIDITY-${t}`,
        type: "HUMIDITY",
        text: `Humidity is ${humidityR.label} (${readings.humidity}%).`,
        severity: humidityR.color === "red" ? "critical" : "warning",
        metric: "humidity",
        time: timeStr,
      });
    }
  }

  return alerts;
}

/**
 * Current snapshot only (single “now” timestamp).
 * @param {Object} readings
 */
export function computeAlerts(readings) {
  return computeAlertsAt(readings, new Date());
}

/**
 * Merged points: `{ timestamp, temperatureF, humidity }[]` (same shape as API merge).
 * @param {Array<{ timestamp: string, temperatureF: number, humidity: number|null }>} points
 * @returns {Array<object>} Newest first; includes `readingAt` (ISO timestamp string).
 */
export function collectAlertsFromPoints(points) {
  if (!points || points.length === 0) return [];

  const out = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const readings = transformToFrontendFormat(p);
    const at = new Date(p.timestamp);
    const rowAlerts = computeAlertsAt(readings, at);
    for (const a of rowAlerts) {
      out.push({
        ...a,
        id: `${a.id}-r${i}`,
        readingAt: typeof p.timestamp === "string" ? p.timestamp : String(p.timestamp),
      });
    }
  }

  out.sort((a, b) => {
    const ta = new Date(a.readingAt).getTime();
    const tb = new Date(b.readingAt).getTime();
    return tb - ta;
  });
  return out;
}

/**
 * Local calendar day filter (browser timezone).
 * @param {Array<{ timestamp: string }>} points
 * @param {Date} [dayRef] defaults to today
 */
export function filterPointsInLocalCalendarDay(points, dayRef = new Date()) {
  const start = new Date(dayRef);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dayRef);
  end.setHours(23, 59, 59, 999);

  return points.filter((p) => {
    const d = new Date(p.timestamp);
    return !Number.isNaN(d.getTime()) && d >= start && d <= end;
  });
}
