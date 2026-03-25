const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the most recent reading (current state)
 * Uses the latest timestamp from two-weeks data
 */
export async function getCurrentReading() {
  try {
    const { timestamp, temperatureC, humidity } = await getJson("/measurement/latest");

    return {
      timestamp,
      temperatureC: parseFloat(temperatureC),
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
    const { data } = await getJson(`/day/${date}`);
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
    const { data } = await getJson("/two-weeks");
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
    const { timestamp, temperatureC, humidity } = await getJson(`/measurement/${datetime}`);
    return {
      timestamp,
      temperatureC: parseFloat(temperatureC),
      humidity: parseFloat(humidity),
    };
  } catch (error) {
    console.error('Failed to fetch measurement:', error);
    throw error;
  }
}
