/**
 * alerts.js – Rule-based alerts from readings and thresholds
 *
 * `computeAlerts` / `computeAlertsAt` use the latest reading only (current snapshot).
 * `collectAlertsFromPoints` walks historical merged samples for dashboard history.
 */
import { THRESHOLDS_F, findRangeForValue } from "../config/thresholds";
import { HIVE_OFFLINE_GRACE_MS } from "../config/connectivity";
import { transformToFrontendFormat } from "./dataTransform";

/** Rolling window for the Alerts screen (days). */
export const ALERT_HISTORY_DAYS = 30;

/** Page size for paginated alert lists (Home “today”, Notifications history). */
export const ALERTS_PAGE_SIZE = 15;

/** Shared alert list filters for notifications-style views. */
export const ALERT_FILTER_OPTIONS = [
  { value: "all", label: "All notifications" },
  { value: "critical", label: "Critical only" },
  { value: "warning", label: "Warnings only" },
  { value: "connectivity", label: "Connectivity" },
  { value: "temperature", label: "Temperature" },
  { value: "humidity", label: "Humidity" },
];

/**
 * Filter alerts by high-level notification category.
 * @param {Array<{ severity?: string, type?: string }>} alerts
 * @param {string} filterValue
 */
export function filterAlertsByNotification(alerts, filterValue) {
  if (!Array.isArray(alerts) || alerts.length === 0) return [];
  if (!filterValue || filterValue === "all") return alerts;

  return alerts.filter((a) => {
    const severity = String(a?.severity ?? "").toLowerCase();
    const type = String(a?.type ?? "").toUpperCase();

    if (filterValue === "critical") return severity === "critical";
    if (filterValue === "warning") return severity === "warning";
    if (filterValue === "connectivity") return type === "HIVE_STATUS";
    if (filterValue === "temperature") return type === "HIVE_TEMP";
    if (filterValue === "humidity") return type === "HUMIDITY";
    return true;
  });
}

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
 * Connectivity alert when no new reading arrived within grace threshold.
 * @param {Date|string|number|null|undefined} latestReadingAt
 * @param {Date} [now]
 */
export function buildHiveOfflineAlert(latestReadingAt, now = new Date()) {
  if (!latestReadingAt) return null;
  const latest = latestReadingAt instanceof Date ? latestReadingAt : new Date(latestReadingAt);
  const nowMs = now.getTime();
  const latestMs = latest.getTime();
  if (Number.isNaN(nowMs) || Number.isNaN(latestMs)) return null;

  const ageMs = nowMs - latestMs;
  if (ageMs <= HIVE_OFFLINE_GRACE_MS) return null;

  const missingMinutes = Math.max(0, Math.round(ageMs / (60 * 1000)));
  return {
    id: `HIVE_STATUS-${nowMs}`,
    type: "HIVE_STATUS",
    text: `Hive disconnected: no readings for ${missingMinutes} minutes (last reading ${formatAlertTime(latest)}).`,
    severity: "critical",
    metric: "connectivity",
    time: formatAlertTime(now),
  };
}

/**
 * Retroactive connectivity alerts from historical reading gaps.
 * Emits one alert per outage gap (> grace) and one ongoing alert if currently offline.
 *
 * @param {Array<{ timestamp: string }>} points
 * @param {Date} [now]
 * @returns {Array<object>} Newest first; includes `readingAt` for sorting/filtering.
 */
export function collectConnectivityGapAlerts(points, now = new Date()) {
  if (!Array.isArray(points) || points.length === 0) return [];

  const sorted = [...points]
    .map((p) => ({ ...p, _ms: new Date(p.timestamp).getTime() }))
    .filter((p) => !Number.isNaN(p._ms))
    .sort((a, b) => a._ms - b._ms);
  if (sorted.length === 0) return [];

  const out = [];
  const graceMs = HIVE_OFFLINE_GRACE_MS;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const gapMs = cur._ms - prev._ms;
    if (gapMs <= graceMs) continue;

    const downAt = prev._ms + graceMs;
    const durationMin = Math.max(1, Math.round((cur._ms - downAt) / (60 * 1000)));
    const recoveredAt = new Date(cur._ms);
    const downDate = new Date(downAt);

    out.push({
      id: `HIVE_STATUS-GAP-${downAt}`,
      type: "HIVE_STATUS",
      text: `Hive disconnected for ${durationMin} minutes. Reconnected at ${formatAlertTime(recoveredAt)}.`,
      severity: "critical",
      metric: "connectivity",
      time: formatAlertTime(downDate),
      readingAt: downDate.toISOString(),
    });
  }

  const ongoing = buildHiveOfflineAlert(sorted[sorted.length - 1].timestamp, now);
  if (ongoing) {
    out.push({
      ...ongoing,
      id: `HIVE_STATUS-ONGOING-${new Date(now).getTime()}`,
      readingAt: new Date(now).toISOString(),
    });
  }

  out.sort((a, b) => new Date(b.readingAt).getTime() - new Date(a.readingAt).getTime());
  return out;
}

function alertSignatureByMetric(alerts) {
  const out = new Map();
  for (const a of alerts) {
    out.set(a.metric, `${a.type}|${a.severity}|${a.text}`);
  }
  return out;
}

/**
 * Merged points: `{ timestamp, temperatureF, humidity }[]` (same shape as API merge).
 * Emits alert history on state changes, not on every repeated sample in the same alert band.
 * @param {Array<{ timestamp: string, temperatureF: number, humidity: number|null }>} points
 * @returns {Array<object>} Newest first; includes `readingAt` (ISO timestamp string).
 */
export function collectAlertsFromPoints(points) {
  if (!points || points.length === 0) return [];

  const ordered = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const out = [];
  const prevByMetric = new Map();

  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    const readings = transformToFrontendFormat(p);
    const at = new Date(p.timestamp);
    const rowAlerts = computeAlertsAt(readings, at);
    const currentByMetric = alertSignatureByMetric(rowAlerts);

    for (const a of rowAlerts) {
      const prevSig = prevByMetric.get(a.metric) ?? null;
      const nextSig = currentByMetric.get(a.metric) ?? null;
      if (prevSig === nextSig) continue;
      out.push({
        ...a,
        id: `${a.id}-r${i}`,
        readingAt: typeof p.timestamp === "string" ? p.timestamp : String(p.timestamp),
      });
    }

    prevByMetric.clear();
    for (const [metric, sig] of currentByMetric) {
      prevByMetric.set(metric, sig);
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
