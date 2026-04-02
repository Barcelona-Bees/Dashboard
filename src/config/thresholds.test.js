import { describe, expect, test } from "@jest/globals";
import { findRangeForValue, THRESHOLDS_F } from "./thresholds.js";

describe("findRangeForValue", () => {
  test("internal 100°F maps to too hot (inclusive upper for last segment)", () => {
    const r = findRangeForValue(100, THRESHOLDS_F.internalTempF.ranges);
    expect(r?.label).toBe("too hot");
  });

  test("internal 93°F maps to brood nest band", () => {
    const r = findRangeForValue(93, THRESHOLDS_F.internalTempF.ranges);
    expect(r?.label).toBe("brood nest");
  });

  test("internal 50°F boundary maps to cold, not extreme cold", () => {
    const r = findRangeForValue(50, THRESHOLDS_F.internalTempF.ranges);
    expect(r?.label).toBe("cold");
  });

  test("humidity 100% maps to last band (very high)", () => {
    const r = findRangeForValue(100, THRESHOLDS_F.humidityPct.ranges);
    expect(r?.color).toBe("red");
    expect(r?.label).toBe("very high");
  });

  test("humidity 75% maps to elevated (not very high)", () => {
    const r = findRangeForValue(75, THRESHOLDS_F.humidityPct.ranges);
    expect(r?.label).toBe("elevated");
  });
});
