import { assertIsoDate, assertIsoDateTime, parseHiveId } from "../busLayer/utils.js";

describe("backend validation helpers", () => {
  test("parseHiveId defaults to hive 1", () => {
    expect(parseHiveId(undefined)).toBe(1);
  });

  test("parseHiveId rejects invalid values", () => {
    expect(() => parseHiveId("abc")).toThrow(/positive integer/i);
  });

  test("assertIsoDate accepts YYYY-MM-DD", () => {
    expect(assertIsoDate("2026-03-25")).toBe("2026-03-25");
  });

  test("assertIsoDateTime normalizes valid ISO datetimes", () => {
    expect(assertIsoDateTime("2026-03-25T15:30:00Z")).toBe("2026-03-25T15:30:00.000Z");
  });
});
