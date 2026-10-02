import { describe, expect, it } from "vitest";
import { createDefaultCondition, createDefaultGeometry } from "./engine";
import {
  buildSweepTableRows,
  generateSweepCSV,
  runParameterSweep,
  SWEEP_PARAMS,
  SWEEP_TRIM_MODES,
  isSweepPointUsable,
  orderedSweepPoints,
  visibleSweepMarker,
  type SweepPointData,
} from "./sweep";

describe("Sweep Engine & Output Parity", () => {
  const geom = createDefaultGeometry();
  const cond = createDefaultCondition();

  it("defines all 5 canonical sweep trim modes matching RotorPopups.bas", () => {
    expect(SWEEP_TRIM_MODES).toHaveLength(5);
    const keys = SWEEP_TRIM_MODES.map((m) => m.key);
    expect(keys).toEqual(["none", "coll_all", "rpm_all", "coll_hover", "rpm_hover"]);
  });

  it("uses en-dash (–) for dimensionless units across all parameters", () => {
    SWEEP_PARAMS.forEach((param) => {
      expect(param.unit).not.toBe("[-]");
      expect(param.unit).not.toBe("—");
      if (["CT", "CTs", "CP", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair", "lambda", "lambda_i", "L_D_eff", "FoM", "Kx", "Ky", "Mat", "B", "Mu", "MuZ"].includes(param.key)) {
        expect(param.unit).toBe("–");
      }
    });
  });

  it("runs parameter sweep under all 5 trim modes without crashing", () => {
    for (const mode of SWEEP_TRIM_MODES) {
      const res = runParameterSweep(geom, cond, "CT", 0, 0.4, 10, undefined, mode.key);
      expect(res.curves).toHaveLength(1);
      expect(res.curves[0].points).toHaveLength(10);
      expect(res.curves[0].points[0].valid).toBe(true);
    }
  });

  it("builds wide table rows with curve columns and sticky headers", () => {
    const sweep = runParameterSweep(geom, cond, "PowerKW", 0, 0.4, 5, undefined, "none");
    const rows = buildSweepTableRows(sweep.curves, sweep.paramMeta, "mu", 0, false);
    expect(rows.length).toBe(6); // 1 header + 5 points
    expect(rows[0][0]).toBe("μ_x");
    expect(rows[0].length).toBe(1 + sweep.curves.length); // mu + curves
    expect(rows[1][0]).toBe("0.000");
  });

  it("generates CSV matching B4A BuildSweepTableRows forCsv mode", () => {
    const sweep = runParameterSweep(geom, cond, "CT", 0, 0.4, 5, undefined, "coll_all");
    const csv = generateSweepCSV(sweep.curves, sweep.paramMeta, "mu", "coll_all");
    expect(csv).toContain("# RotorCalculator Parameter Sweep");
    expect(csv).toContain("μ_x [-]");
    expect(csv).toContain("C_T [-]");
  });
});


describe("Single-value sweep family parity", () => {
  it.each([1, 2, 3])("uses one custom value for family %i instead of substituting the defaults", (family) => {
    const sweep = runParameterSweep(createDefaultGeometry(), createDefaultCondition(), "CT", family, 0.4, 5, [0.0123], "none");
    expect(sweep.curves).toHaveLength(1);
    expect(sweep.curves[0].points).toHaveLength(5);
    expect(sweep.curves[0].label).toContain(family === 3 ? "0.012" : "0.0123");
  });
});


describe("Native sweep plot domain and live-marker rules", () => {
  const point = (mu: number, value: number, valid = true, muLam = mu): SweepPointData => ({
    curveLabel: "Test", mu, vx: mu * 100, muLam, val: value, valid, rpm: 258, collectiveDeg: 0, ct: 0.0065, thrustN: 70000,
  });
  const curve = (points: SweepPointData[]) => ({ label: "Test", color: "#000000", points });

  it("excludes unsupported and nonfinite samples and negative μ/λ", () => {
    expect(isSweepPointUsable(point(0.61, 1), "mu")).toBe(false);
    expect(isSweepPointUsable(point(0.2, Infinity), "mu")).toBe(false);
    expect(isSweepPointUsable(point(0.2, 1, true, -2), "muLam")).toBe(false);
    expect(isSweepPointUsable(point(0.2, 1, true, 2), "muLam")).toBe(true);
  });

  it("sorts nonmonotonic axis values while retaining original indices for invalid gaps", () => {
    const points = [point(0, 0, true, 2), point(0.1, 1, false, 0), point(0.2, 2, true, 1), point(0.3, 3, true, 3)];
    expect(orderedSweepPoints(points, "muLam").map((item) => item.index)).toEqual([2, 0, 3]);
    expect(orderedSweepPoints(points, "mu").map((item) => item.index)).toEqual([0, 2, 3]);
  });

  it("never extends the requested μ range for an outside operating point", () => {
    const curves = [curve([point(0, 0), point(0.3, 3)])];
    expect(visibleSweepMarker(curves, { mu: 0.6, vx: 60, val: 6 }, "mu")).toBeNull();
  });

  it("only shows operating points within the exact native 1% curve-span tolerance", () => {
    const curves = [curve([point(0, 0), point(0.3, 3)])];
    const onCurve = { mu: 0.15, vx: 15, val: 1.5 };
    expect(visibleSweepMarker(curves, onCurve, "mu")).toBe(onCurve);
    expect(visibleSweepMarker(curves, { ...onCurve, val: 1.52 }, "mu")).not.toBeNull();
    expect(visibleSweepMarker(curves, { ...onCurve, val: 1.54 }, "mu")).toBeNull();
  });

  it("does not interpolate across invalid points", () => {
    const curves = [curve([point(0, 0), point(0.1, 1, false), point(0.2, 2)])];
    expect(visibleSweepMarker(curves, { mu: 0.1, vx: 10, val: 1 }, "mu")).toBeNull();
  });
});
