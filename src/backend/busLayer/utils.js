export function parseHiveId(value) {
  const raw = value ?? "1";
  const hiveId = Number(raw);

  if (!Number.isInteger(hiveId) || hiveId <= 0) {
    throw new Error("hiveId must be a positive integer");
  }

  return hiveId;
}

export function assertIsoDate(value, label = "date") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be in YYYY-MM-DD format`);
  }

  return value;
}

export function assertIsoDateTime(value, label = "datetime") {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} must be a valid ISO datetime`);
  }

  return date.toISOString();
}
