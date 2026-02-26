import { celsiusToFahrenheit } from '../utils/conversions';

/**
 * Transforms backend API data into frontend format
 * Handles missing CO2 and internal temp (uses external temp for now)
 */
export function transformToFrontendFormat(apiData, connectionStatus = 'Stable') {
  const tempF = celsiusToFahrenheit(apiData.temperatureC);
  
  return {
    externalTemp: tempF,
    internalTemp: tempF, // TODO: Replace with actual internal temp when available
    co2: 0.5, // TODO: Replace with actual CO2 data when available
    humidity: apiData.humidity,
    connectionStatus,
    packageLoss: '< 1%', // TODO: Calculate from actual data
    batteryPct: apiData.batteryPct ?? 87, // TODO: Replace when sensor reports battery
  };
}

/**
 * Transforms chart data for 24-hour view
 * Groups data by hour and averages values
 */
export function transformTo24HourChart(data) {
  if (!data || data.length === 0) return [];
  
  // Group by hour
  const hourly = {};
  data.forEach(({ timestamp, temperatureC, humidity }) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const key = `${hour}:00`;
    
    if (!hourly[key]) {
      hourly[key] = { externalTemps: [], internalTemps: [], humidities: [] };
    }

    const externalF = celsiusToFahrenheit(temperatureC);
    // For now we only have one temperature from the backend.
    // Use the same value for internal until a true internal sensor is wired.
    const internalF = externalF;

    hourly[key].externalTemps.push(externalF);
    hourly[key].internalTemps.push(internalF);
    hourly[key].humidities.push(humidity);
  });
  
  // Average and format, sorted by hour
  return Object.entries(hourly)
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .map(([time, values]) => ({
      t: time,
      humidity: Math.round(
        values.humidities.reduce((a, b) => a + b, 0) / values.humidities.length
      ),
      externalTempF: Math.round(
        values.externalTemps.reduce((a, b) => a + b, 0) / values.externalTemps.length
      ),
      internalTempF: Math.round(
        values.internalTemps.reduce((a, b) => a + b, 0) / values.internalTemps.length
      ),
    }));
}

/**
 * Transforms chart data for 2-week view
 * Groups data by day and averages values
 */
export function transformTo2WeekChart(data) {
  if (!data || data.length === 0) return [];
  
  // Group by day
  const daily = {};
  data.forEach(({ timestamp, temperatureC }) => {
    const date = new Date(timestamp);
    const dayKey = date.toISOString().split('T')[0];
    
    if (!daily[dayKey]) {
      daily[dayKey] = [];
    }
    daily[dayKey].push(celsiusToFahrenheit(temperatureC));
  });
  
  // Average and format
  const days = Object.entries(daily).sort();
  return days.map(([dateStr, temps], idx) => ({
    d: `Day ${idx + 1}`,
    value: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
  }));
}