import { describe, expect, it } from "vitest";
import {
  calculate,
  createDefaultCondition,
  createDefaultGeometry,
  getBFactor,
  resolveSolidity,
  solveInflow,
  updateAtmosphere,
} from "./engine";
import { convertValue } from "./units";
import { runParameterSweep } from "./sweep";

describe("zBET Engine Numerical Physics", () => {
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
    expect(res.trimmedCollectiveDeg).toBeGreaterThan(8.0);
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
});
