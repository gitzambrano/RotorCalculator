import operatingReference from "./operating-reference.json";
import referenceMatrix from "./engine-reference.json";
import { describe, expect, it } from "vitest";
import {
  alphaFromMuZ,
  calculate,
  createDefaultCondition,
  createDefaultGeometry,
  getBFactor,
  referenceAspectRatio,
  resolveSolidity,
  scaleChordsToAspectRatio,
  scaleChordsToSigmaRef,
  scaleRadiusPreserveReference,
  solveInflow,
  updateAtmosphere,
  type FlightCondition,
  type RotorGeometry,
} from "./engine";
import { convertValue } from "./units";
import { runParameterSweep } from "./sweep";

describe("zBET Engine Numerical Physics", () => {
  it("matches 200 Python reference cases, including the compiled B4A matrix and PG", () => {
    const fields: Record<string, string> = { lambda: "inflowLambda", lambda_i: "inflowLambdaI" };
    for (const row of referenceMatrix) {
      const g = { ...createDefaultGeometry(), rpm: 430, nominalRpm: 430, radius: 5, chordRoot: .30, chordTip: .22, cd0: .009, thetaRoot: 12 * Math.PI / 180, thetaTip: 2 * Math.PI / 180, tipLossMode: "fixed" as const, tipLossB: .97, usePrandtlGlauert: row.pg };
      const c = { ...createDefaultCondition(), rho: 1.225, speedOfSound: 340.3, rpm: 430, collectiveDeg: 4, operatingPair: "rpm_collective" as const, horizontalValue: row.mu, axialMode: "muz" as const, axialValue: row.z, inflowModel: row.model as "uniform" };
      const r = calculate(g,c);
      expect(r.solutionValid).toBe(true);
      for (const [key, target] of Object.entries(row.expected)) {
        const actual = (r as unknown as Record<string, number>)[fields[key] || key];
        expect(Math.abs(actual - target), `${row.pg}/${row.mu}/${row.z}/${row.model}/${key}`).toBeLessThanOrEqual(2e-9 + 2e-7 * Math.abs(target));
      }
    }
  });
  it("matches the 18 compiled B4A operating-pair reference cases", () => {
    for (const row of operatingReference) {
      const g = { ...createDefaultGeometry(), rpm: 430, nominalRpm: 430, radius: 5, chordRoot: .30, chordTip: .22, cd0: .009, thetaRoot: 12 * Math.PI / 180, thetaTip: 2 * Math.PI / 180, tipLossMode: "fixed" as const, tipLossB: .97, usePrandtlGlauert: true };
      const c = { ...createDefaultCondition(), rho: 1.225, speedOfSound: 340.3, rpm: 430, collectiveDeg: 4, operatingPair: row.pair as "rpm_collective", targetCT: row.ct, targetThrustN: row.thrust, horizontalValue: row.mu, axialMode: "muz" as const, axialValue: row.z };
      const r = calculate(g,c);
      expect(r.solutionValid).toBe(true);
      expect(Math.abs(r.trimmedRPM - row.rpm)).toBeLessThan(.1 + 2e-4 * row.rpm);
      expect(Math.abs(r.trimmedCollectiveDeg - row.collective)).toBeLessThan(2e-4);
      for (const [key, target] of Object.entries(row.expected)) {
        const field = key === "lambda" ? "inflowLambda" : key === "lambda_i" ? "inflowLambdaI" : key;
        expect(Math.abs((r as unknown as Record<string, number>)[field] - target), `${row.pair}/${row.mu}/${row.z}/${key}`).toBeLessThanOrEqual(2e-8 + 3e-6 * Math.abs(target));
      }
    }
  });
  it("matches the shipped Android tropospheric atmosphere adapter", () => {
    for (const [altitude, temperature] of [[0, 15], [3000, -4.5], [11000, -56.5], [20000, -100], [-1000, 80]]) {
      const h = Math.max(-500, Math.min(11000, altitude));
      const t = Math.max(-80, Math.min(60, temperature)) + 273.15;
      const pressure = 101325 * Math.max(0.05, 1 - 0.0065 * h / 288.15) ** 5.2561;
      const c = updateAtmosphere(createDefaultCondition(), altitude, temperature);
      expect(c.altitudeM).toBe(h);
      expect(c.pressurePa).toBeCloseTo(pressure, 9);
      expect(c.rho).toBeCloseTo(pressure / (287.058 * t), 12);
      expect(c.speedOfSound).toBeCloseTo(Math.sqrt(1.4 * 287.058 * t), 10);
    }
  });
  it("resolves planform geometry and solidities accurately", () => {
    const geom = createDefaultGeometry();
    const resolved = resolveSolidity(geom);

    expect(resolved.radius).toBeCloseTo(8.18, 2);
    expect(resolved.nBlades).toBe(4);
    expect(resolved.rootCutout).toBeCloseTo(0.15, 2);
    expect(resolved.sigmaRef).toBeGreaterThan(0.07);
    expect(resolved.sigmaRef).toBeLessThan(0.09);
    expect(resolved.sigmaGeom).toBeGreaterThan(0.06);
    expect(resolved.sigmaGeom).toBeLessThan(resolved.sigmaRef);
    expect(resolved.sigmaThrust).toBeGreaterThan(resolved.sigmaGeom);
  });

  it("updates standard atmosphere according to ISA equations", () => {
    const cond = createDefaultCondition();
    const seaLevel = updateAtmosphere(cond, 0, 15);
    expect(seaLevel.pressurePa).toBeCloseTo(101325, 0);
    expect(seaLevel.rho).toBeCloseTo(1.225, 3);
    expect(seaLevel.speedOfSound).toBeCloseTo(340.3, 1);

    const highAlt = updateAtmosphere(cond, 3000, -4.5);
    expect(highAlt.pressurePa).toBeLessThan(101325);
    expect(highAlt.pressurePa).toBeGreaterThan(70000);
    expect(highAlt.rho).toBeLessThan(1.225);
  });

  it("solves inflow in hover momentum equilibrium", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();
    const lambdaI = solveInflow(0.0, 0.0, geom, cond, 0.97);

    expect(lambdaI).toBeGreaterThan(0.01);
    expect(lambdaI).toBeLessThan(0.08);
  });

  it("converges UH-60 hover trim with target CT = 0.0065", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();
    cond.operatingPair = "rpm_ct";
    cond.targetCT = 0.0065;

    const res = calculate(geom, cond);
    expect(res.solutionValid).toBe(true);
    expect(res.CT).toBeCloseTo(0.0065, 4);
    expect(res.thrustN).toBeGreaterThan(50000);
    expect(res.thrustN).toBeLessThan(90000);
    expect(res.trimmedRPM).toBeCloseTo(258, 0);
    expect(res.trimmedCollectiveDeg).toBeCloseTo(7.906888, 5);
    expect(res.trimmedCollectiveDeg).toBeLessThan(18.0);
    expect(res.bFactor).toBeGreaterThan(0.95);
    expect(res.bFactor).toBeLessThan(1.0);
    expect(res.powerShaftKW).toBeGreaterThan(500);
    expect(res.powerShaftKW).toBeLessThan(3500);
    expect(res.FoM).toBeGreaterThan(0.5);
    expect(res.FoM).toBeLessThan(0.9);
  });

  it("handles Sissingh tip loss factor dynamically", () => {
    const geom = createDefaultGeometry();
    geom.tipLossMode = "sissingh";
    const bHover = getBFactor(geom, 0.0065);
    expect(bHover).toBeCloseTo(1.0 - Math.sqrt(2 * 0.0065) / 4, 3);
    expect(bHover).toBeLessThan(1.0);
    expect(bHover).toBeGreaterThan(0.96);
  });

  it("generates parameter sweeps smoothly across advance ratios", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();
    const { curves, currentOpPoint } = runParameterSweep(geom, cond, "CT", 0, 0.4, 11);

    expect(curves.length).toBe(1);
    expect(curves[0].points.length).toBe(11);
    expect(curves[0].points[0].mu).toBe(0.0);
    expect(curves[0].points[10].mu).toBeCloseTo(0.4, 2);
    expect(curves[0].points.every((pt) => pt.valid)).toBe(true);
    expect(currentOpPoint).not.toBeNull();
  });

  it("converts units accurately across systems", () => {
    expect(convertValue(1, "m", "ft")).toBeCloseTo(3.28084, 4);
    expect(convertValue(100, "kt", "m/s")).toBeCloseTo(51.4444, 3);
    expect(convertValue(1000, "N", "lbf")).toBeCloseTo(224.809, 2);
    expect(convertValue(100, "kW", "hp")).toBeCloseTo(134.102, 2);
    expect(convertValue(101325, "Pa", "hPa")).toBeCloseTo(1013.25, 2);
  });

  it("scales radius while preserving reference solidity and aspect ratio", () => {
    const geom = createDefaultGeometry();
    const origSigma = geom.sigmaRef;
    const scaled = scaleRadiusPreserveReference(geom, 10.0);

    expect(scaled.radius).toBeCloseTo(10.0, 3);
    expect(scaled.sigmaRef).toBeCloseTo(origSigma, 4);
    expect(scaled.chordRoot).toBeCloseTo((geom.chordRoot * 10.0) / geom.radius, 4);
    expect(scaled.chordTip).toBeCloseTo((geom.chordTip * 10.0) / geom.radius, 4);
  });

  it("scales chords to match target solidity and aspect ratio", () => {
    const geom = createDefaultGeometry();
    const targetSigma = 0.10;
    const scaledSigma = scaleChordsToSigmaRef(geom, targetSigma);
    expect(scaledSigma.sigmaRef).toBeCloseTo(0.10, 4);

    const targetAR = 12.0;
    const scaledAR = scaleChordsToAspectRatio(geom, targetAR);
    expect(referenceAspectRatio(scaledAR)).toBeCloseTo(12.0, 2);
  });

  it("solves trim across all 6 operating pairs", () => {
    const geom = createDefaultGeometry();
    const cond = createDefaultCondition();

    // 1. rpm_collective
    cond.operatingPair = "rpm_collective";
    cond.rpm = 258;
    cond.collectiveDeg = 12.5;
    const res1 = calculate(geom, cond);
    expect(res1.solutionValid).toBe(true);
    expect(res1.trimmedRPM).toBeCloseTo(258, 0);
    expect(res1.trimmedCollectiveDeg).toBeCloseTo(12.5, 1);
    expect(res1.thrustN).toBeGreaterThan(0);

    // 2. rpm_ct
    cond.operatingPair = "rpm_ct";
    cond.targetCT = 0.0065;
    const res2 = calculate(geom, cond);
    expect(res2.solutionValid).toBe(true);
    expect(res2.CT).toBeCloseTo(0.0065, 4);

    // 3. rpm_thrust
    cond.operatingPair = "rpm_thrust";
    cond.targetThrustN = 70000;
    const res3 = calculate(geom, cond);
    expect(res3.solutionValid).toBe(true);
    expect(res3.thrustN).toBeCloseTo(70000, -1);

    // 4. collective_thrust
    cond.operatingPair = "collective_thrust";
    cond.collectiveDeg = 12.0;
    cond.targetThrustN = 65000;
    const res4 = calculate(geom, cond);
    expect(res4.solutionValid).toBe(true);
    expect(res4.thrustN).toBeCloseTo(65000, -1);
    expect(res4.trimmedRPM).toBeGreaterThan(100);

    // 5. ct_thrust
    cond.operatingPair = "ct_thrust";
    cond.targetCT = 0.0065;
    cond.targetThrustN = 70000;
    const res5 = calculate(geom, cond);
    expect(res5.solutionValid).toBe(true);
    expect(res5.CT).toBeCloseTo(0.0065, 4);
    expect(res5.thrustN).toBeCloseTo(70000, -1);
  });
});

// ---------------------------------------------------------------------------
// Operating contract: Vx/Vz equivalence, clamps, validity warnings, atmosphere
// ---------------------------------------------------------------------------
describe("Operating contract (Android / Python parity)", () => {
  const refGeom = (pg = true, mode: "fixed" | "sissingh" | "none" = "fixed") => ({
    ...createDefaultGeometry(), rpm: 430, nominalRpm: 430, radius: 5, chordRoot: .30, chordTip: .22, cd0: .009,
    thetaRoot: 12 * Math.PI / 180, thetaTip: 2 * Math.PI / 180, tipLossMode: mode, tipLossB: .97, usePrandtlGlauert: pg,
  });
  const refCond = (patch: Partial<FlightCondition> = {}): FlightCondition => ({
    ...createDefaultCondition(), rho: 1.225, speedOfSound: 340.3, rpm: 430, collectiveDeg: 4,
    operatingPair: "rpm_collective", axialMode: "muz", axialValue: 0, ...patch,
  });
  const uh60Cond = (patch: Partial<FlightCondition> = {}): FlightCondition => ({
    ...createDefaultCondition(), operatingPair: "rpm_collective", collectiveDeg: 8, ...patch,
  });

  it("resolves Vx with the real rotor radius (UH-60, Vx 10 m/s gives mu 0.04525, not 0.074)", () => {
    const g = createDefaultGeometry();
    const vtip = 258 * 2 * Math.PI / 60 * 8.18;
    const byVx = calculate(g, uh60Cond({ horizontalMode: "vx", horizontalValue: 10 }));
    const byMu = calculate(g, uh60Cond({ horizontalMode: "mu", horizontalValue: 10 / vtip }));
    expect(byVx.operatingMu).toBeCloseTo(0.0452479, 6);
    expect(byVx.operatingVx).toBeCloseTo(10, 9);
    for (const key of ["CT", "CQ", "CH", "CY", "CMx", "powerShaftW", "thrustN", "inflowLambdaI"] as const) {
      expect(byVx[key], key).toBeCloseTo(byMu[key], 12);
    }
    expect(byVx.validityWarning).toBe("");
  });

  it("resolves Vz and alpha with the real radius and gives the same result as the mu-equivalent condition", () => {
    const g = createDefaultGeometry();
    const vtip = 258 * 2 * Math.PI / 60 * 8.18;
    const byVz = calculate(g, uh60Cond({ horizontalValue: 0.1, axialMode: "vz", axialValue: 2 }));
    const byMuZ = calculate(g, uh60Cond({ horizontalValue: 0.1, axialMode: "muz", axialValue: 2 / vtip }));
    expect(byVz.operatingVz).toBeCloseTo(2, 9);
    expect(byVz.operatingMuZ).toBeCloseTo(2 / vtip, 12);
    expect(byVz.CT).toBeCloseTo(byMuZ.CT, 12);
    const byAlpha = calculate(g, uh60Cond({ horizontalValue: 0.1, axialMode: "alpha", axialValue: 5 }));
    expect(byAlpha.operatingMuZ).toBeCloseTo(-0.1 * Math.tan(5 * Math.PI / 180), 12);
    expect(byAlpha.operatingAlphaDeg).toBeCloseTo(5, 9);
  });

  it("keeps Vx constant while RPM is trimmed (collective + thrust)", () => {
    const g = createDefaultGeometry();
    const base = calculate(g, uh60Cond({ horizontalMode: "vx", horizontalValue: 40 }));
    const trimmed = calculate(g, uh60Cond({ horizontalMode: "vx", horizontalValue: 40, operatingPair: "collective_thrust", targetThrustN: base.thrustN }));
    expect(trimmed.solutionValid).toBe(true);
    expect(trimmed.trimmedRPM).toBeGreaterThan(200);
    expect(trimmed.operatingVx).toBeCloseTo(40, 6);
    expect(trimmed.operatingMu).toBeCloseTo(40 / trimmed.tipSpeed, 9);
  });

  it("limits mu to [-0.60, 0.60] and reports the value used", () => {
    const g = refGeom();
    const edgeHi = calculate(g, refCond({ horizontalValue: 0.6 }));
    expect(edgeHi.operatingMu).toBe(0.6);
    expect(edgeHi.validityWarning).toBe("");
    const over = calculate(g, refCond({ horizontalValue: 0.61 }));
    expect(over.operatingMu).toBe(0.6);
    expect(over.CT).toBeCloseTo(edgeHi.CT, 14);
    expect(over.validityWarning).toBe("Input limited: μx = 0.60");
    const edgeLo = calculate(g, refCond({ horizontalValue: -0.6 }));
    expect(edgeLo.operatingMu).toBe(-0.6);
    expect(edgeLo.validityWarning).toBe("");
    const under = calculate(g, refCond({ horizontalValue: -0.7 }));
    expect(under.operatingMu).toBe(-0.6);
    expect(under.validityWarning).toBe("Input limited: μx = -0.60");
    const viaVx = calculate(g, refCond({ horizontalMode: "vx", horizontalValue: 1000 }));
    expect(viaVx.operatingMu).toBe(0.6);
    expect(viaVx.validityWarning).toContain("μx = 0.60");
  });

  it("does not turn negative mu into hover (matches tools/zBET.py)", () => {
    const g = refGeom();
    const expected = { // zBET.coefficients(mu=-0.2, mu_z=0.01, coleman_feingold, energy_balance)
      CT: 0.007893741413390514, CQ: 0.0003206346616288673, CH: -0.00013288757955442994, lambda_i: 0.020730621807888386,
    };
    const r = calculate(g, refCond({ horizontalValue: -0.2, axialValue: 0.01, inflowModel: "coleman_feingold", kInd: 1.15 }));
    expect(r.solutionValid).toBe(true);
    expect(r.operatingMu).toBe(-0.2);
    expect(Math.abs(r.CT - expected.CT)).toBeLessThanOrEqual(2e-9 + 2e-7 * expected.CT);
    expect(Math.abs(r.CQ - expected.CQ)).toBeLessThanOrEqual(2e-9 + 2e-7 * expected.CQ);
    expect(Math.abs(r.CH - expected.CH)).toBeLessThanOrEqual(2e-9 + 2e-7 * Math.abs(expected.CH));
    expect(Math.abs(r.inflowLambdaI - expected.lambda_i)).toBeLessThanOrEqual(2e-9 + 2e-7 * expected.lambda_i);
    const hover = calculate(g, refCond({ horizontalValue: 0, axialValue: 0.01 }));
    expect(Math.abs(r.CT - hover.CT)).toBeGreaterThan(1e-5);
  });

  it("limits muZ to [-0.5, 0.5]; alpha = 90 deg cannot give an unbounded CT", () => {
    const g = refGeom();
    const edge = calculate(g, refCond({ axialValue: 0.5 }));
    expect(edge.operatingMuZ).toBe(0.5);
    expect(edge.validityWarning).toBe("");
    const over = calculate(g, refCond({ axialValue: 0.51 }));
    expect(over.operatingMuZ).toBe(0.5);
    expect(over.validityWarning).toBe("Input limited: μz = 0.50");
    const under = calculate(g, refCond({ axialValue: -0.51 }));
    expect(under.operatingMuZ).toBe(-0.5);
    expect(under.validityWarning).toContain("μz = -0.50");
    const vertical = calculate(g, refCond({ horizontalValue: 0.2, axialMode: "alpha", axialValue: 90 }));
    expect(Math.abs(vertical.operatingMuZ)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(vertical.CT)).toBeLessThan(1);
    expect(vertical.validityWarning).toContain("μz = -0.50");
  });

  it("limits k_ind to [1, 3], Coleman f_x/f_y to +-5, and collective to +-60 deg", () => {
    const g = refGeom();
    const k1 = calculate(g, refCond({ kInd: 1 }));
    const kLow = calculate(g, refCond({ kInd: 0.5 }));
    expect(kLow.powerShaftW).toBeCloseTo(k1.powerShaftW, 6);
    expect(kLow.validityWarning).toBe("Input limited: k_ind = 1.00");
    expect(k1.validityWarning).toBe("");
    const k3 = calculate(g, refCond({ kInd: 3 }));
    const kHigh = calculate(g, refCond({ kInd: 3.5 }));
    expect(kHigh.powerShaftW).toBeCloseTo(k3.powerShaftW, 6);
    expect(kHigh.validityWarning).toBe("Input limited: k_ind = 3.00");

    const c5 = refCond({ horizontalValue: 0.2, inflowModel: "coleman_feingold", fxColeman: 5, fyColeman: -5 });
    const edge = calculate(g, c5);
    const over = calculate(g, { ...c5, fxColeman: 6, fyColeman: -6 });
    expect(edge.validityWarning).toBe("");
    expect(over.CT).toBeCloseTo(edge.CT, 14);
    expect(over.validityWarning).toBe("Input limited: f_x = 5.00; f_y = -5.00");

    const coll60 = calculate(g, refCond({ collectiveDeg: 60 }));
    const coll70 = calculate(g, refCond({ collectiveDeg: 70 }));
    expect(coll60.validityWarning).toBe("");
    expect(coll70.CT).toBeCloseTo(coll60.CT, 14);
    expect(coll70.trimmedCollectiveDeg).toBe(60);
    expect(coll70.validityWarning).toBe("Input limited: Δθ = 60.0");
  });

  it("limits density and speed of sound so Mach and thrust stay finite and positive", () => {
    const g = refGeom();
    const r = calculate(g, refCond({ rho: -1, speedOfSound: 0 }));
    expect(r.densityRho).toBe(0.01);
    expect(r.speedOfSound).toBe(100);
    expect(Number.isFinite(r.advancingTipMach)).toBe(true);
    expect(r.thrustN).toBeGreaterThan(0);
    expect(r.validityWarning).toBe("Input limited: ρ = 0.010; speed of sound = 100.0");
    const hi = calculate(g, refCond({ rho: 9, speedOfSound: 900 }));
    expect(hi.densityRho).toBe(5);
    expect(hi.speedOfSound).toBe(500);
    const edge = calculate(g, refCond({ rho: 0.01, speedOfSound: 500 }));
    expect(edge.validityWarning).toBe("");
  });

  it("names every limited geometry input and keeps the solution valid", () => {
    const base = refGeom(false, "none");
    const cond = refCond();
    expect(calculate(base, cond).validityWarning).toBe("");
    const cases: [Partial<RotorGeometry>, string][] = [
      [{ radius: 0 }, "R = 0.02"],
      [{ nBlades: 0 }, "N_b = 1"],
      [{ chordRoot: 0 }, "c_R = 0.0001"],
      [{ chordTip: -1 }, "c_T = 0.0001"],
      [{ rootCutout: 1.2 }, "x_0 = 0.95"],
      [{ rootCutout: -0.1 }, "x_0 = 0.00"],
      [{ cd0: -0.01 }, "C_d0 = 0.0000"],
      [{ liftSlope0: 20 }, "a_0 = 10.00"],
      [{ liftSlope0: 0 }, "a_0 = 0.10"],
      [{ tipLossMode: "fixed", tipLossB: 1.5 }, "B = 1.000"],
      [{ tipLossMode: "fixed", tipLossB: 0.05 }, "B = 0.160"],
    ];
    for (const [patch, text] of cases) {
      const r = calculate({ ...base, ...patch }, cond);
      expect(r.validityWarning.startsWith("Input limited: "), text).toBe(true);
      expect(r.validityWarning, text).toContain(text);
      expect(r.solutionValid, text).toBe(true);
    }
    expect(calculate({ ...base, radius: 0, nBlades: 0 }, cond).validityWarning).toContain("R = 0.02; N_b = 1");
    expect(calculate(base, refCond({ operatingPair: "rpm_collective", rpm: 0 })).validityWarning).toBe("Input limited: Ω = 1");
  });

  it("reports vortex ring / windmill region and stays silent in normal flight", () => {
    const g = createDefaultGeometry();
    const ring = "Outside model validity: vortex ring state / windmill region";
    const climb = calculate(g, uh60Cond({ axialMode: "muz", axialValue: 0.02 }));
    expect(climb.validityWarning).toBe("");
    const mild = calculate(g, uh60Cond({ axialMode: "muz", axialValue: -0.01, collectiveDeg: 8 }));
    expect(mild.inflowLambda).toBeGreaterThan(0);
    expect(mild.powerShaftW).toBeGreaterThan(0);
    expect(mild.validityWarning).toBe("");
    const deep = calculate(g, uh60Cond({ axialMode: "muz", axialValue: -0.2, collectiveDeg: 0 }));
    expect(deep.solutionValid).toBe(true);
    expect(deep.inflowLambda < 0 || deep.powerShaftW < 0).toBe(true);
    expect(deep.validityWarning).toBe(ring);
    const limited = calculate(g, uh60Cond({ axialMode: "muz", axialValue: -0.7, collectiveDeg: 0 }));
    expect(limited.validityWarning).toBe(`Input limited: μz = -0.50. ${ring}`);
  });

  it("uses a clear status message when the root cutout limit blocks the trim", () => {
    const g = { ...createDefaultGeometry(), rootCutout: 0.95, tipLossMode: "sissingh" as const };
    const r = calculate(g, createDefaultCondition());
    expect(r.solutionValid).toBe(false);
    expect(r.statusMessage).toContain("Root cutout x_0 is at the 0.95 limit");
  });

  it("clamps the tip-loss factor B like tools/zBET.py (not a reset to 0.97)", () => {
    // zBET.Geometry.b_factor: fixed 1.5 -> 1.0; fixed 0.05 -> x0 + 0.01 = 0.16; Sissingh floor x0 + 0.01.
    const g = refGeom(false, "fixed");
    expect(resolveSolidity({ ...g, tipLossB: 1.5 }).tipLossB).toBe(1.0);
    expect(resolveSolidity({ ...g, tipLossB: 0.05 }).tipLossB).toBeCloseTo(0.16, 14);
    expect(resolveSolidity({ ...g, tipLossB: 0.15 }).tipLossB).toBeCloseTo(0.16, 14);
    expect(resolveSolidity({ ...g, tipLossB: 0.97 }).tipLossB).toBe(0.97);
    expect(getBFactor({ ...g, tipLossB: 1.5 }, 0)).toBe(1.0);
    expect(getBFactor({ ...g, tipLossB: 0.05 }, 0)).toBeCloseTo(0.16, 14);
    const sis = { ...refGeom(false, "sissingh"), nBlades: 1 };
    expect(getBFactor(sis, 5)).toBeCloseTo(0.16, 14); // 1 - sqrt(10) < 0; the old floor was 0.5
    expect(getBFactor({ ...sis, nBlades: 4 }, 0.2)).toBeCloseTo(0.841886116991581, 12);
    expect(getBFactor({ ...sis, nBlades: 4 }, 5)).toBeCloseTo(0.20943058495790512, 12);
    const wide = calculate({ ...g, tipLossB: 1.5 }, refCond());
    const one = calculate({ ...g, tipLossB: 1.0 }, refCond());
    expect(wide.bFactor).toBe(1.0);
    expect(wide.CT).toBeCloseTo(one.CT, 14);
  });

  it("matches the Python analytical_bet induced torque (direct BET integral)", () => {
    const g = refGeom();
    // zBET.coefficients(..., induced_torque_model='analytical_bet', k_ind=1.15)
    const cases = [
      { mu: 0.15, z: 0.01, CQi: 0.00020762594824080686, CQ: 0.0002775069806505884, CQenergy: 0.0003331429189967529 },
      { mu: -0.2, z: 0.01, CQi: 0.0001934049951326077, CQ: 0.0002650598535948249, CQenergy: 0.0003206346616288673 },
    ];
    for (const row of cases) {
      const base = refCond({ horizontalValue: row.mu, axialValue: row.z, inflowModel: "coleman_feingold", kInd: 1.15 });
      const bet = calculate(g, { ...base, inducedTorqueModel: "analytical_bet" });
      const energy = calculate(g, { ...base, inducedTorqueModel: "energy_balance" });
      expect(Math.abs(bet.CQi - row.CQi)).toBeLessThanOrEqual(1e-12 + 2e-7 * row.CQi);
      expect(Math.abs(bet.CQ - row.CQ)).toBeLessThanOrEqual(1e-12 + 2e-7 * row.CQ);
      expect(Math.abs(energy.CQ - row.CQenergy)).toBeLessThanOrEqual(1e-12 + 2e-7 * row.CQenergy);
      expect(bet.CT).toBeCloseTo(energy.CT, 14);
    }
  });

  it("round-trips alpha for forward and rearward flight", () => {
    for (const mu of [0.2, -0.2]) {
      const r = calculate(refGeom(), refCond({ horizontalValue: mu, axialMode: "alpha", axialValue: 5 }));
      expect(r.operatingAlphaDeg).toBeCloseTo(5, 9);
      expect(alphaFromMuZ(mu, -mu * Math.tan(5 * Math.PI / 180))).toBeCloseTo(5, 9);
    }
    expect(alphaFromMuZ(0, 0.1)).toBe(0);
  });

  it("recomputes density and speed of sound for altitude != 0 through updateAtmosphere", () => {
    const g = refGeom(false, "fixed"); // no PG: CT is independent of density, so T scales with rho
    const sea = updateAtmosphere(refCond(), 0, 15);
    const high = updateAtmosphere(refCond(), 3000, -4.5);
    expect(high.altitudeM).toBe(3000);
    expect(high.rho).toBeLessThan(sea.rho * 0.8);
    expect(high.speedOfSound).toBeLessThan(sea.speedOfSound);
    const rSea = calculate(g, sea);
    const rHigh = calculate(g, high);
    expect(rHigh.CT).toBeCloseTo(rSea.CT, 12);
    expect(rHigh.thrustN / rSea.thrustN).toBeCloseTo(high.rho / sea.rho, 10);
    expect(rHigh.densityRho).toBeCloseTo(high.rho, 12);
    expect(rHigh.altitudeM).toBe(3000);
    expect(rHigh.advancingTipMach).toBeGreaterThan(rSea.advancingTipMach);
    // A condition that changed altitude without updateAtmosphere keeps the sea-level density.
    const stale = calculate(g, { ...sea, altitudeM: 3000 });
    expect(stale.densityRho).toBeCloseTo(sea.rho, 12);
  });
});
