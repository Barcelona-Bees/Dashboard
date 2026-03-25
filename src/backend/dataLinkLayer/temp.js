import { query } from "./dbutils.js";

function normalizeRow(row) {
  return {
    hiveId: Number(row.hiveid),
    timestamp: new Date(row.timestamp).toISOString(),
    temperatureC: Number(row.temperature_c),
    humidity: Number(row.humidity),
  };
}

export async function getLatestMeasurement(hiveId) {
  const result = await query(
    `
      SELECT
        t.hiveid,
        t.timestamp,
        t.reading AS temperature_c,
        COALESCE(h.reading, 0) AS humidity
      FROM temperature t
      LEFT JOIN humidity h
        ON h.hiveid = t.hiveid
       AND h.timestamp = t.timestamp
      WHERE t.hiveid = $1
      ORDER BY t.timestamp DESC
      LIMIT 1
    `,
    [hiveId],
  );

  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function getMeasurementByTimestamp(hiveId, timestamp) {
  const result = await query(
    `
      SELECT
        t.hiveid,
        t.timestamp,
        t.reading AS temperature_c,
        COALESCE(h.reading, 0) AS humidity
      FROM temperature t
      LEFT JOIN humidity h
        ON h.hiveid = t.hiveid
       AND h.timestamp = t.timestamp
      WHERE t.hiveid = $1
      AND t.timestamp = $2::timestamptz
      LIMIT 1
    `,
    [hiveId, timestamp],
  );

  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function getMeasurementsBetween(hiveId, startTime, endTime) {
  const result = await query(
    `
      SELECT
        t.hiveid,
        t.timestamp,
        t.reading AS temperature_c,
        COALESCE(h.reading, 0) AS humidity
      FROM temperature t
      LEFT JOIN humidity h
        ON h.hiveid = t.hiveid
       AND h.timestamp = t.timestamp
      WHERE t.hiveid = $1
      AND t.timestamp BETWEEN $2::timestamptz AND $3::timestamptz
      ORDER BY t.timestamp ASC
    `,
    [hiveId, startTime, endTime],
  );

  return result.rows.map(normalizeRow);
}
