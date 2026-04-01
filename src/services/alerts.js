/**
 * alerts.js – Rule-based alerts from current readings and thresholds
 *
 * Compares readings against THRESHOLDS_F ranges. When a value falls in
 * yellow or red (not green), we generate an alert. This drives:
 * - HomeScreen "Alerts" section
 * - AlertsScreen "Activity & alerts" list
 *
 * PR note: humidity / CO₂ rules are skipped when those values are null (no sensor data yet),
 * so we do not fabricate alerts from placeholder numbers.
 */
import { THRESHOLDS_F } from "../config/thresholds";

function findRange(value, ranges) {
  return ranges.find((r) => value >= r.from && value < r.to) ?? null;
}

/**
 * @param {Object} readings - { internalTemp, externalTemp, humidity, co2, batteryPct }
 * @returns {Array<{ id: string, type: string, text: string, severity: "warning"|"critical", metric: string }>}
 */
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
 * @param {Object} readings - { internalTemp, externalTemp, humidity, co2, batteryPct }
 * @returns {Array<{ id: string, type: string, text: string, severity: "warning"|"critical", metric: string, time: string }>}
 */
export function computeAlerts(readings) {
  if (!readings) return [];

  const alerts = [];
  const now = new Date();

  // Internal temp (hive temp – most critical for colony health)
  const internalR = findRange(readings.internalTemp, THRESHOLDS_F.internalTempF.ranges);
  if (internalR && internalR.color !== "green") {
    alerts.push({
      id: `temp-internal-${now.getTime()}`,
      type: "HIVE_TEMP",
      text: `Inside hive temperature is ${internalR.label} (${readings.internalTemp.toFixed(1)}°F).`,
      severity: internalR.color === "red" ? "critical" : "warning",
      metric: "internalTemp",
      time: formatAlertTime(now),
    });
  }

  // Humidity (skip when sensor/backend did not provide a value)
  if (readings.humidity != null && !Number.isNaN(readings.humidity)) {
    const humidityR = findRange(readings.humidity, THRESHOLDS_F.humidityPct.ranges);
    if (humidityR && humidityR.color !== "green") {
      alerts.push({
        id: `humidity-${now.getTime()}`,
        type: "HUMIDITY",
        text: `Humidity is ${humidityR.label} (${readings.humidity}%).`,
        severity: humidityR.color === "red" ? "critical" : "warning",
        metric: "humidity",
        time: formatAlertTime(now),
      });
    }
  }

  // CO2 — only when hardware reports it
  if (readings.co2 != null && !Number.isNaN(readings.co2)) {
    const co2R = findRange(readings.co2, THRESHOLDS_F.co2Pct.ranges);
    if (co2R && co2R.color !== "green") {
      alerts.push({
        id: `co2-${now.getTime()}`,
        type: "CO2",
        text: `CO₂ level is ${co2R.label} (${readings.co2.toFixed(2)}%).`,
        severity: co2R.color === "red" ? "critical" : "warning",
        metric: "co2",
        time: formatAlertTime(now),
      });
    }
  }

  // Battery (low / critical – not in thresholds, custom logic)
  if (readings.batteryPct != null) {
    if (readings.batteryPct <= 10) {
      alerts.push({
        id: `battery-${now.getTime()}`,
        type: "BATTERY",
        text: `Sensor battery critically low (${readings.batteryPct}%). Replace or charge soon.`,
        severity: "critical",
        metric: "battery",
        time: formatAlertTime(now),
      });
    } else if (readings.batteryPct <= 25) {
      alerts.push({
        id: `battery-${now.getTime()}`,
        type: "BATTERY",
        text: `Sensor battery low (${readings.batteryPct}%). Consider charging or replacing.`,
        severity: "warning",
        metric: "battery",
        time: formatAlertTime(now),
      });
    }
  }

  return alerts;
}
