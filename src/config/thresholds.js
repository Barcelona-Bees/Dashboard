/**
 * thresholds.js (Fahrenheit-first)
 *
 * Ranges drive gauge band colors (green/yellow/red) and alert rules.
 *
 * Research basis (honey bees, Apis mellifera):
 * - Brood nest: bees maintain ~34–35 °C (~93–95 °F) in the brood area when rearing
 *   (thermoregulation; common in extension + peer summaries of colony temperature).
 * - In-hive sensors often sit above/beside the cluster, so readings vary by season and
 *   placement; mid-80s–mid-90s °F is common in active season; winter cluster edges read cooler.
 * - Heat stress: sustained high internal temps (often cited ~38 °C+ / ~100 °F+) warrant
 *   ventilation checks; exact limits depend on placement.
 * - Humidity: brood nest RH is often cited ~50–60% as comfortable; sustained very high RH
 *   increases condensation/mold risk in cold weather; very low RH is less common but
 *   worth flagging.
 *
 * These bands are practical dashboard defaults, not veterinary diagnoses.
 */

export const THRESHOLDS_F = {
  /**
   * Inside-hive air temperature (°F), same as DB `reading` / sensor in box.
   * Half-open matching except last segment (see findRangeForValue).
   */
  internalTempF: {
    min: 0,
    max: 120,
    ranges: [
      { from: 0, to: 50, color: "red", label: "extreme cold" },
      { from: 50, to: 64, color: "yellow", label: "cold" },
      { from: 64, to: 85, color: "yellow", label: "cool" },
      { from: 85, to: 92, color: "green", label: "good" },
      { from: 92, to: 96, color: "green", label: "brood nest" },
      { from: 96, to: 100, color: "yellow", label: "warm" },
      { from: 100, to: 120, color: "red", label: "too hot" },
    ],
  },

  externalTempF: {
    min: -10,
    max: 110,
    ranges: [
      { from: -10, to: 32, color: "yellow", label: "cold" },
      { from: 32, to: 50, color: "yellow", label: "cool" },
      { from: 50, to: 95, color: "green", label: "good" },
      { from: 95, to: 104, color: "yellow", label: "hot" },
      { from: 104, to: 110, color: "red", label: "extreme" },
    ],
  },

  /**
   * Relative humidity % inside hive (sensor).
   * Last band [85,100] is inclusive at 100.
   */
  humidityPct: {
    min: 0,
    max: 100,
    ranges: [
      { from: 0, to: 35, color: "red", label: "very dry" },
      { from: 35, to: 45, color: "yellow", label: "low" },
      { from: 45, to: 75, color: "green", label: "good" },
      { from: 75, to: 85, color: "yellow", label: "elevated" },
      { from: 85, to: 100, color: "red", label: "very high" },
    ],
  },
};

/**
 * Match a value to the first applicable band. Uses [from, to) for every segment except
 * the last, which is [from, to] so 100 % RH and 120 °F map correctly.
 * @param {number} value
 * @param {Array<{ from: number, to: number, color: string, label: string }>} ranges
 */
export function findRangeForValue(value, ranges) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const v = Number(value);
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const last = i === ranges.length - 1;
    if (v >= r.from && (last ? v <= r.to : v < r.to)) {
      return r;
    }
  }
  return null;
}
