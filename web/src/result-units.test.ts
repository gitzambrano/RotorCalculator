import { describe, it, expect } from "vitest";
import { calculate, createDefaultCondition, createDefaultGeometry } from "./engine";
import {
  canonicalResultValue, convertResultFromCanonical, defaultResultUnit,
  readResultUnitPreferences, resultUnit, resultUnitChoices
} from "./result-units";

const geom = createDefaultGeometry();
const cond = { ...createDefaultCondition(), operatingPair: "rpm_collective" as const };
const result = calculate(geom, cond);

describe("independent result display units", () => {
  it("provides suitable unit families without changing dimensionless results", () => {
    expect(resultUnitChoices("T")).toEqual(["N","kN","kgf","lbf"]);
    expect(resultUnitChoices("DL")).toContain("kgf/m²");
    expect(resultUnitChoices("PL")).toContain("lbf/hp");
    expect(resultUnitChoices("p")).toContain("inHg");
    expect(resultUnitChoices("T0")).toContain("K");
    expect(resultUnitChoices("rho")).toContain("slug/ft³");
    expect(resultUnitChoices("rpm")).toEqual(["rpm","rad/s"]);
    expect(resultUnitChoices("alpha")).toEqual(["deg","rad"]);
    expect(resultUnitChoices("Vx")).toContain("kt");
    expect(resultUnitChoices("Tc")).toEqual([]);
    expect(resultUnitChoices("Pc")).toEqual([]);
    expect(resultUnitChoices("CT")).toEqual([]);
  });

  it("keeps prior SI and Imperial defaults, with independent overrides", () => {
    expect(defaultResultUnit("T","si")).toBe("N");
    expect(defaultResultUnit("T","imperial")).toBe("lbf");
    expect(defaultResultUnit("p","si")).toBe("hPa");
    expect(defaultResultUnit("p","imperial")).toBe("inHg");
    expect(defaultResultUnit("Q","imperial")).toBe("lbf·ft");
    expect(resultUnit("T","si",{T:"kgf",H:"lbf"})).toBe("kgf");
    expect(resultUnit("H","si",{T:"kgf",H:"lbf"})).toBe("lbf");
    expect(resultUnit("T","si",{T:"kt"})).toBe("N");
    expect(resultUnit("CT","si",{CT:"N"})).toBe("–");
  });

  it("loads only compatible stored preferences and treats corrupt JSON as empty", () => {
    expect(readResultUnitPreferences('{ "T":"kgf", "Q":"hp", "p":"psi", "CT":"N" }'))
      .toEqual({T:"kgf",p:"psi"});
    expect(readResultUnitPreferences("{")).toEqual({});
    expect(readResultUnitPreferences("[]")).toEqual({});
  });

  it("converts force, moment, power and loading without intermediate rounding", () => {
    expect(convertResultFromCanonical("T",9806.65,"kgf")).toBeCloseTo(1000,9);
    expect(convertResultFromCanonical("Q",9.80665,"kgf·m")).toBeCloseTo(1,9);
    expect(convertResultFromCanonical("P",745.699872,"hp")).toBeCloseTo(1,9);
    expect(convertResultFromCanonical("DL",9.80665,"kgf/m²")).toBeCloseTo(1,9);
    expect(convertResultFromCanonical("PL",1000,"N/W")).toBeCloseTo(1,9);
    expect(convertResultFromCanonical("PL",1000,"kgf/kW")).toBeCloseTo(101.9716213,5);
    expect(() => convertResultFromCanonical("T",20,"mph")).toThrow(RangeError);
  });

  it("converts speeds, rotor RPM, angles and atmosphere", () => {
    expect(convertResultFromCanonical("Vx",0.5144444444,"kt")).toBeCloseTo(1,4);
    expect(convertResultFromCanonical("Vz",1,"ft/min")).toBeCloseTo(196.850394,4);
    expect(convertResultFromCanonical("rpm",60,"rad/s")).toBeCloseTo(2*Math.PI,8);
    expect(convertResultFromCanonical("alpha",180,"rad")).toBeCloseTo(Math.PI,9);
    expect(convertResultFromCanonical("T0",0,"°F")).toBeCloseTo(32,9);
    expect(convertResultFromCanonical("T0",0,"K")).toBeCloseTo(273.15,9);
    expect(convertResultFromCanonical("p",101325,"inHg")).toBeCloseTo(29.921,2);
    expect(convertResultFromCanonical("p",101325,"bar")).toBeCloseTo(1.01325,9);
    expect(convertResultFromCanonical("h",304.8,"ft")).toBeCloseTo(1000,5);
    expect(convertResultFromCanonical("rho",1.225,"slug/ft³")).toBeCloseTo(0.0023769,6);
  });

  it("uses solved canonical results from the engine rather than displayed strings", () => {
    expect(result.solutionValid).toBe(true);
    expect(canonicalResultValue("T",result,geom)).toBeCloseTo(result.thrustN,7);
    expect(canonicalResultValue("Q",result,geom)).toBeCloseTo(result.torqueNm,7);
    expect(canonicalResultValue("P",result,geom)).toBeCloseTo(result.powerShaftW,7);
    expect(canonicalResultValue("p",result,geom)).toBeCloseTo(result.pressurePa,7);
    expect(canonicalResultValue("T0",result,geom)).toBeCloseTo(result.temperatureC,7);
    expect(canonicalResultValue("rpm",result,geom)).toBeCloseTo(result.trimmedRPM,7);
    expect(canonicalResultValue("CT",result,geom)).toBeNull();
  });
});
