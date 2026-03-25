import { createHandlers } from "../appLayer/al.js";

function createMockResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

function buildStore() {
  const rows = [
    { timestamp: "2026-03-13T00:00:00.000Z", temperatureC: 18.1, humidity: 55 },
    { timestamp: "2026-03-13T12:00:00.000Z", temperatureC: 19.4, humidity: 58 },
    { timestamp: "2026-03-14T23:50:00.000Z", temperatureC: 20.2, humidity: 61 },
  ];

  return {
    async getLatestMeasurement() {
      return rows.at(-1);
    },
    async getMeasurementByTimestamp(_hiveId, timestamp) {
      return rows.find((row) => row.timestamp === timestamp) ?? null;
    },
    async getMeasurementsBetween(_hiveId, start, end) {
      return rows.filter((row) => row.timestamp >= start && row.timestamp <= end);
    },
  };
}

describe("backend application routes", () => {
  test("GET /measurement/latest returns the latest measurement", async () => {
    const handlers = createHandlers(buildStore());
    const res = createMockResponse();

    await handlers.latestMeasurementHandler({ query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({
      timestamp: "2026-03-14T23:50:00.000Z",
      temperatureC: 20.2,
      humidity: 61,
    });
  });

  test("GET /day/:date returns rows for that day", async () => {
    const handlers = createHandlers(buildStore());
    const res = createMockResponse();

    await handlers.dayHandler({ params: { date: "2026-03-14" }, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({
      date: "2026-03-14",
      data: [["2026-03-14T23:50:00.000Z", "20.2", "61"]],
    });
  });

  test("GET /two-weeks returns normalized data rows", async () => {
    const handlers = createHandlers(buildStore());
    const res = createMockResponse();

    await handlers.twoWeeksHandler({ query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.data).toEqual([
      ["2026-03-13T00:00:00.000Z", "18.1", "55"],
      ["2026-03-13T12:00:00.000Z", "19.4", "58"],
      ["2026-03-14T23:50:00.000Z", "20.2", "61"],
    ]);
  });

  test("GET /measurement/:datetime validates bad input", async () => {
    const handlers = createHandlers(buildStore());
    const res = createMockResponse();

    await handlers.measurementHandler({ params: { datetime: "not-a-date" }, query: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.payload.error).toMatch(/valid ISO datetime/i);
  });
});
