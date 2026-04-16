/** Expected sensor transmission cadence and offline threshold. */
export const EXPECTED_READING_INTERVAL_MINUTES = 10;

/**
 * Mark hive as offline only after prolonged silence.
 * 30 min = 3 missed 10-minute readings.
 */
export const HIVE_OFFLINE_GRACE_MS = 30 * 60 * 1000;
