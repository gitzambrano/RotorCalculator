import { describe, expect, it } from "vitest";
import { calculate, createDefaultCondition, createDefaultGeometry } from "./engine";
import { computeDiskContourData, DISK_CONTOUR_PARAMS } from "./disk-contour";

const EXPECTED_KEYS = [
  "aoa", "phi", "cl", "cd", "lambda_total", "lambda_i", "vi",
  "up_vel", "ut_vel", "fn_span", "ft_span", "mach", "dCTdx", "dyn_press",
];

describe("disk contour", () => {
  it("keeps the canonical 14-variable catalog", () => {
    expect(DISK_CONTOUR_PARAMS.map((p) => p.key)).toEqual(EXPECTED_KEYS);
    expect(DISK_CONTOUR_PARAMS.some((p) => /reynolds/i.test(p.label))).toBe(false);
  });

  it("computes a finite 30 x 72 field for every contour variable", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();
    const res = calculate(geom, cond);
    expect(res.solutionValid).toBe(true);
    for (const key of EXPECTED_KEYS) {
      const data = computeDiskContourData(geom, cond, res, key);
      expect(data.rStations).toHaveLength(30);
      expect(data.psiStations).toHaveLength(72);
      expect(data.values).toHaveLength(30);
      expect(data.values.every((row) => row.length === 72)).toBe(true);
      expect(data.values.flat().every(Number.isFinite)).toBe(true);
    }
  });

  it("rejects invalid operating solutions", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();
    const res = { ...calculate(geom, cond), solutionValid: false };
    expect(() => computeDiskContourData(geom, cond, res, "aoa")).toThrow(/valid operating point/i);
  });
});
