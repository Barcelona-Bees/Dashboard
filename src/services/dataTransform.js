/**
 * Maps API points to dashboard “readings” object (temperature already in °F from DB).
 * CO₂ / packet loss / battery stay null—no fake KPI numbers—so gauges show “—” until the API adds fields.
 */
export function transformToFrontendFormat(apiData, connectionStatus = 'Connected') {
  const tempF = apiData.temperatureF;

  return {
    externalTemp: tempF,
    internalTemp: tempF,
    co2: null,
    humidity: apiData.humidity ?? null,
    connectionStatus,
    packageLoss: null,
    batteryPct: null,
  };
}

/**
 * 24-hour chart: group merged samples by clock hour and average (values already °F).
 */
export function transformTo24HourChart(data) {
  if (!data || data.length === 0) return [];

  const hourly = {};
  data.forEach(({ timestamp, temperatureF, humidity }) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const key = `${hour}:00`;

    if (!hourly[key]) {
      hourly[key] = { externalTemps: [], internalTemps: [], humidities: [] };
    }

    const externalF = temperatureF;
    const internalF = temperatureF;

    hourly[key].externalTemps.push(externalF);
    hourly[key].internalTemps.push(internalF);
    if (humidity != null && !Number.isNaN(humidity)) {
      hourly[key].humidities.push(humidity);
    }
  });

  return Object.entries(hourly)
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .map(([time, values]) => {
      const nHum = values.humidities.length;
      const nExt = values.externalTemps.length;
      const nInt = values.internalTemps.length;
      return {
        t: time,
        humidity:
          nHum > 0
            ? Math.round(
                values.humidities.reduce((a, b) => a + b, 0) / nHum
              )
            : null,
        externalTempF: Math.round(
          values.externalTemps.reduce((a, b) => a + b, 0) / nExt
        ),
        internalTempF: Math.round(
          values.internalTemps.reduce((a, b) => a + b, 0) / nInt
        ),
      };
    });
}

/**
 * Two-week overview: one point per calendar day (avg temp °F).
 */
export function transformTo2WeekChart(data) {
  if (!data || data.length === 0) return [];

  const daily = {};
  data.forEach(({ timestamp, temperatureF }) => {
    const date = new Date(timestamp);
    const dayKey = date.toISOString().split('T')[0];

    if (!daily[dayKey]) {
      daily[dayKey] = [];
    }
    daily[dayKey].push(temperatureF);
  });

  const days = Object.entries(daily).sort();
  return days.map(([dateStr, temps], idx) => ({
    d: `Day ${idx + 1}`,
    value: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
    dateStr,
  }));
}
