import { describe, expect, it } from "vitest";
import { calculate, createDefaultCondition, createDefaultGeometry, updateAtmosphere, type FlightCondition } from "./engine";
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

describe("Sweep uses the real geometry and the active atmosphere", () => {
  const geom = createDefaultGeometry();
  const base = { ...createDefaultCondition(), operatingPair: "rpm_collective" as const, collectiveDeg: 8 };

  it("shows the operating marker at the Vx-equivalent mu of the real radius", () => {
    const sweep = runParameterSweep(geom, { ...base, horizontalMode: "vx", horizontalValue: 10 }, "Mu", 0, 0.4, 5);
    const vtip = (258 * 2 * Math.PI) / 60 * 8.18;
    expect(sweep.currentOpPoint?.mu).toBeCloseTo(10 / vtip, 9);
    expect(sweep.currentOpPoint?.vx).toBeCloseTo(10, 9);
  });

  it("uses the geometry radius for dimensional sweep outputs (induced + profile power = shaft power)", () => {
    const small = { ...geom, radius: 5, chordRoot: 0.3, chordTip: 0.3 };
    const pi = runParameterSweep(small, base, "PowerIndKW", 0, 0.3, 4).curves[0].points;
    const p0 = runParameterSweep(small, base, "PowerProfKW", 0, 0.3, 4).curves[0].points;
    const total = runParameterSweep(small, base, "PowerKW", 0, 0.3, 4).curves[0].points;
    for (let i = 0; i < total.length; i++) {
      expect(total[i].valid).toBe(true);
      expect(pi[i].val + p0[i].val).toBeCloseTo(total[i].val, 6);
    }
  });

  it("recomputes density, pressure and speed of sound at altitude != 0 (updateAtmosphere)", () => {
    const sea = updateAtmosphere(base, 0, 15);
    const high = updateAtmosphere(base, 3000, -4.5);
    const get = (cond: FlightCondition, key: string) => runParameterSweep(geom, cond, key, 0, 0.2, 3).curves[0].points[0].val;
    expect(get(high, "Altitude")).toBe(3000);
    expect(get(high, "Temperature")).toBeCloseTo(-4.5, 12);
    expect(get(high, "Density")).toBeCloseTo(high.rho, 12);
    expect(get(high, "Pressure")).toBeCloseTo(high.pressurePa, 6);
    expect(get(high, "SoundSpeed")).toBeCloseTo(high.speedOfSound, 9);
    expect(get(high, "Density")).toBeLessThan(get(sea, "Density") * 0.8);
    // Fixed controls: thrust follows the lower density.
    expect(get(high, "ThrustN")).toBeLessThan(get(sea, "ThrustN") * 0.95);
  });

  it("sweeps a rpm + collective pair against the current thrust, not a stale default CT target", () => {
    const live = calculate(geom, base);
    const sweep = runParameterSweep(geom, base, "ThrustN", 0, 0.2, 3, undefined, "coll_all");
    expect(sweep.curves[0].points[0].valid).toBe(true);
    expect(sweep.curves[0].points[0].thrustN).toBeCloseTo(live.thrustN, 0);
  });

  it("drops samples above the supported mu range of 0.60", () => {
    const sweep = runParameterSweep(geom, base, "CT", 0, 0.8, 9);
    const points = sweep.curves[0].points;
    expect(points[points.length - 1].mu).toBeCloseTo(0.8, 12);
    expect(points[points.length - 1].valid).toBe(true);
    expect(isSweepPointUsable(points[points.length - 1], "mu")).toBe(false);
    expect(isSweepPointUsable(points[6], "mu")).toBe(true); // mu = 0.6
  });
});
