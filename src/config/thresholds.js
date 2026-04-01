/**
 * thresholds.js (Fahrenheit-first)
 *
 * These ranges drive:
 * - Gauge band colors (green/yellow/red)
 * - Value status color
 *
 * Later, we can add a unit switch (F/C) without changing component layouts.
 */
export const THRESHOLDS_F = {
  internalTempF: {
    min: 70,
    max: 110,
    ranges: [
      { from: 70, to: 86, color: "yellow", label: "low" },
      { from: 86, to: 91, color: "yellow", label: "approaching" },
      { from: 91, to: 97, color: "green",  label: "ideal" },
      { from: 97, to: 100, color: "yellow", label: "warm" },
      { from: 100, to: 110, color: "red",   label: "too hot" },
    ],
  },

  externalTempF: {
    min: -10,
    max: 110,
    ranges: [
      { from: -10, to: 32, color: "yellow", label: "cold" },
      { from: 32, to: 50, color: "yellow", label: "cool" },
      { from: 50, to: 95, color: "green",  label: "good" },
      { from: 95, to: 104, color: "yellow", label: "hot" },
      { from: 104, to: 110, color: "red",  label: "extreme" },
    ],
  },

  humidityPct: {
    min: 0,
    max: 100,
    ranges: [
      { from: 0,  to: 30, color: "red",    label: "very low" },
      { from: 30, to: 40, color: "yellow", label: "low" },
      { from: 40, to: 80, color: "green",  label: "good" },
      { from: 80, to: 90, color: "yellow", label: "high" },
      { from: 90, to: 100, color: "red",   label: "very high" },
    ],
  },

};
