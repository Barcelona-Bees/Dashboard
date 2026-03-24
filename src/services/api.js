const API_BASE = 'http://localhost:3001';
import { getToken } from "./auth";

/**
 * Helper to add the Authorization header when we have a JWT.
 * If there is no token yet, we just return the headers unchanged.
 */
function withAuthHeaders(baseHeaders = {}) {
  const token = getToken();
  if (!token) return baseHeaders;
  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Fetches the most recent reading (current state)
 * Uses the latest timestamp from two-weeks data
 */
export async function getCurrentReading() {
  try {
    const response = await fetch(`${API_BASE}/two-weeks`, {
      headers: withAuthHeaders(),
    });
    const { data } = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No data available');
    }
    
    // Get the most recent entry (last in array)
    const latest = data[data.length - 1];
    const [timestamp, tempC, humidity] = latest;
    
    return {
      timestamp,
      temperatureC: parseFloat(tempC),
      humidity: parseFloat(humidity),
    };
  } catch (error) {
    console.error('Failed to fetch current reading:', error);
    throw error;
  }
}

/**
 * Fetches all data for a specific day
 */
export async function getDayData(date) {
  try {
    const response = await fetch(`${API_BASE}/day/${date}`, {
      headers: withAuthHeaders(),
    });
    const { data } = await response.json();
    return data.map(([timestamp, tempC, humidity]) => ({
      timestamp,
      temperatureC: parseFloat(tempC),
      humidity: parseFloat(humidity),
    }));
  } catch (error) {
    console.error('Failed to fetch day data:', error);
    throw error;
  }
}

/**
 * Fetches past two weeks of data
 */
export async function getTwoWeeksData() {
  try {
    const response = await fetch(`${API_BASE}/two-weeks`, {
      headers: withAuthHeaders(),
    });
    const { data } = await response.json();
    return data.map(([timestamp, tempC, humidity]) => ({
      timestamp,
      temperatureC: parseFloat(tempC),
      humidity: parseFloat(humidity),
    }));
  } catch (error) {
    console.error('Failed to fetch two weeks data:', error);
    throw error;
  }
}

/**
 * Fetches a single measurement by datetime
 */
export async function getMeasurement(datetime) {
  try {
    const response = await fetch(`${API_BASE}/measurement/${datetime}`, {
      headers: withAuthHeaders(),
    });
    const { timestamp, temp, humidity } = await response.json();
    return {
      timestamp,
      temperatureC: parseFloat(temp),
      humidity: parseFloat(humidity),
    };
  } catch (error) {
    console.error('Failed to fetch measurement:', error);
    throw error;
  }
}