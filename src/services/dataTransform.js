import { DATA_OVERVIEW_DAYS } from "../config/readingsWindow.js";
import {
  getSyntheticExternalTempF,
  outsideTempFFromWeatherMap,
  WEATHER_TIMEZONE,
} from "./weather";

function localDateKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Maps API points to dashboard “readings” object (temperature already in °F from DB).
 * Packet loss stays null until the API adds fields.
 */
export function transformToFrontendFormat(apiData, connectionStatus = 'Connected') {
  const tempF = apiData.temperatureF;

  return {
    externalTemp: tempF,
    internalTemp: tempF,
    humidity: apiData.humidity ?? null,
    connectionStatus,
    packageLoss: null,
  };
}

/**
 * Rolling 24h window ending at `anchorEnd`, split into 24 equal one-hour bins (values °F).
 * Inside = mean hive temp per bin, or null when no readings (honest gaps).
 * Outside = Open-Meteo hourly when available, else synthetic from inside when inside exists.
 *
 * @param {Array<{ timestamp: string, temperatureF: number }>} points - merged samples
 * @param {Date|string|number} anchorEnd - latest reading time (window end)
 * @param {Map<string, number>|null} weatherByDateTime - °C from getHourlyOutsideTempsByDate
 * @param {function(number): number} cToF
 * @returns {Array<{ xLabel: string, internalTempF: number|null, externalTempF: number|null }>}
 */
export function buildRolling24HourChart(points, anchorEnd, weatherByDateTime, cToF) {
  const end = new Date(anchorEnd);
  if (Number.isNaN(end.getTime())) return [];

  const T = end.getTime();
  const b0 = T - 24 * 60 * 60 * 1000;
  const list = Array.isArray(points) ? points : [];

  const out = [];
  let prevCalDayNy = null;

  for (let i = 0; i < 24; i++) {
    const binStart = b0 + i * 60 * 60 * 1000;
    const binEnd = b0 + (i + 1) * 60 * 60 * 1000;

    const inBin = list.filter((p) => {
      const t = new Date(p.timestamp).getTime();
      if (Number.isNaN(t)) return false;
      if (i < 23) return t >= binStart && t < binEnd;
      return t >= binStart && t <= T;
    });

    let internalTempF = null;
    const temps = inBin
      .map((p) => p.temperatureF)
      .filter((v) => v != null && Number.isFinite(v));
    if (temps.length > 0) {
      internalTempF = Math.round(
        temps.reduce((a, b) => a + b, 0) / temps.length
      );
    }

    const binStartDate = new Date(binStart);
    let externalTempF = outsideTempFFromWeatherMap(
      weatherByDateTime,
      binStartDate,
      cToF
    );
    if (externalTempF == null && internalTempF != null) {
      externalTempF = getSyntheticExternalTempF(internalTempF, i);
    }

    const calDayNy = new Intl.DateTimeFormat('en-CA', {
      timeZone: WEATHER_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(binStartDate);
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: WEATHER_TIMEZONE,
      month: 'short',
      day: 'numeric',
    }).format(binStartDate);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: WEATHER_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
    }).format(binStartDate);
    const xLabel =
      calDayNy !== prevCalDayNy ? `${datePart}, ${timePart}` : timePart;
    prevCalDayNy = calDayNy;

    out.push({ xLabel, internalTempF, externalTempF });
  }

  // Append a true "current" point so the chart reaches the latest reading timestamp,
  // not just the start of the final hourly bin.
  const latestPoint = list
    .filter((p) => {
      const t = new Date(p.timestamp).getTime();
      return !Number.isNaN(t) && t >= b0 && t <= T;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .at(-1);

  if (latestPoint) {
    const latestInternal =
      Number.isFinite(latestPoint.temperatureF) ? Math.round(latestPoint.temperatureF) : null;
    let latestExternal = outsideTempFFromWeatherMap(
      weatherByDateTime,
      end,
      cToF
    );
    if (latestExternal == null && latestInternal != null) {
      latestExternal = getSyntheticExternalTempF(latestInternal, 23);
    }
    const nowLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: WEATHER_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
    }).format(end);
    out.push({ xLabel: `${nowLabel} (now)`, internalTempF: latestInternal, externalTempF: latestExternal });
  }

  return out;
}

/**
 * Exactly 14 points (see DATA_OVERVIEW_DAYS): one per local calendar day ending on the day of
 * `endInstant`. Averages samples per day; null when no readings (honest gaps for charts).
 */
export function build14DayOverviewSeries(points, endInstant = new Date()) {
  const end = endInstant instanceof Date ? endInstant : new Date(endInstant);
  const endDayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const dayKeys = [];
  for (let i = 0; i < DATA_OVERVIEW_DAYS; i++) {
    const d = new Date(endDayStart);
    d.setDate(endDayStart.getDate() - (DATA_OVERVIEW_DAYS - 1 - i));
    dayKeys.push(localDateKey(d));
  }

  const byDayTemps = Object.fromEntries(dayKeys.map((k) => [k, []]));
  const byDayHum = Object.fromEntries(dayKeys.map((k) => [k, []]));

  for (const p of points || []) {
    const k = localDateKey(new Date(p.timestamp));
    if (!byDayTemps[k]) continue;
    if (Number.isFinite(p.temperatureF)) byDayTemps[k].push(p.temperatureF);
    if (p.humidity != null && !Number.isNaN(p.humidity)) byDayHum[k].push(p.humidity);
  }

  return dayKeys.map((dateStr) => {
    const tArr = byDayTemps[dateStr];
    const hArr = byDayHum[dateStr];
    const temperature =
      tArr.length > 0
        ? Math.round(tArr.reduce((a, b) => a + b, 0) / tArr.length)
        : null;
    const humidity =
      hArr.length > 0
        ? Math.round(hArr.reduce((a, b) => a + b, 0) / hArr.length)
        : null;
    const labelDate = new Date(`${dateStr}T12:00:00`);
    const xLabel = labelDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return { xLabel, temperature, humidity, dateStr };
  });
}

/**
 * Linear interpolation between days with real averages; leading/trailing nulls use the nearest
 * known value. Same length as input. For chart display only — not for export/analytics.
 */
function interpolateNullableNumberSeries(values) {
  const n = values.length;
  const validIdx = [];
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v != null && Number.isFinite(v)) validIdx.push(i);
  }
  if (validIdx.length === 0) return values.map(() => null);
  const out = new Array(n);
  if (validIdx.length === 1) {
    const v = values[validIdx[0]];
    for (let i = 0; i < n; i++) out[i] = v;
    return out;
  }
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v != null && Number.isFinite(v)) {
      out[i] = v;
      continue;
    }
    let lo = -1;
    let hi = -1;
    for (const j of validIdx) {
      if (j < i) lo = j;
      if (j > i) {
        hi = j;
        break;
      }
    }
    if (lo === -1) out[i] = values[validIdx[0]];
    else if (hi === -1) out[i] = values[validIdx[validIdx.length - 1]];
    else {
      const t = (i - lo) / (hi - lo);
      out[i] = values[lo] + t * (values[hi] - values[lo]);
    }
  }
  return out.map((x) =>
    x != null && Number.isFinite(x) ? Math.round(x) : null
  );
}

/**
 * Adds `temperatureForChart` / `humidityForChart` so line charts span all 14 days continuously.
 */
export function withFourteenDayTrendOverlay(series) {
  if (!series?.length) return [];
  const temps = series.map((p) => p.temperature);
  const hums = series.map((p) => p.humidity);
  const tOut = interpolateNullableNumberSeries(temps);
  const hOut = interpolateNullableNumberSeries(hums);
  return series.map((p, i) => ({
    ...p,
    temperatureForChart: tOut[i],
    humidityForChart: hOut[i],
  }));
}
