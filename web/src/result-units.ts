/**
 * Result-only unit selection. Values come directly from the unrounded engine
 * state; never derive another unit from already formatted UI text.
 */
import {
  derivedOutput, type RotorGeometry, type RotorResults
} from "./engine";
import { UNIT_TABLE } from "./units";

type UnitKind = "force"|"moment"|"power"|"speed"|"angle"|"rpm"|"pressure"|"temperature"|"density"|"altitude"|"diskLoading"|"powerLoading";

const GROUPS: Record<UnitKind, readonly string[]> = {
  force: ["T","H","Hi","H0","Y","Tc"],
  moment: ["Q","Qi","Q0","Mx","My"],
  power: ["P","Pi","P0","Pair","Pc"],
  speed: ["vi","Vztot","Vz","Vx","OmR","Vadv","Vret","a"],
  angle: ["chi","alpha","coll","aoaAdv25","aoaRet25","aoaAdv50","aoaRet50","aoaAdv75","aoaRet75","aoaAdvTip","aoaRetTip","phiAdv25","phiRet25","phiAdv50","phiRet50","phiAdv75","phiRet75","phiAdvTip","phiRetTip"],
  rpm: ["rpm"],
  pressure: ["p"],
  temperature: ["T0"],
  density: ["rho"],
  altitude: ["h"],
  diskLoading: ["DL"],
  powerLoading: ["PL"],
};

const CHOICES: Record<UnitKind, readonly string[]> = {
  force: ["N","kN","kgf","lbf"],
  moment: ["N·m","kgf·m","lb·ft"],
  power: ["W","kW","MW","hp"],
  speed: ["m/s","ft/s","kt","km/h","mph","ft/min"],
  angle: ["deg","rad"],
  rpm: ["rpm","rad/s"],
  pressure: ["Pa","hPa","kPa","bar","mbar","inHg","psi","atm","mmHg"],
  temperature: ["°C","°F","K"],
  density: ["kg/m³","slug/ft³","lb/ft³"],
  altitude: ["m","ft","km"],
  diskLoading: ["N/m²","kN/m²","kgf/m²","lbf/ft²"],
  powerLoading: ["N/kW","N/W","kgf/kW","lbf/hp"],
};

export function resultKind(key: string): UnitKind | null {
  return (Object.keys(GROUPS) as UnitKind[]).find(kind => GROUPS[kind].includes(key)) ?? null;
}
export function resultUnitChoices(key: string): readonly string[] {
  const kind = resultKind(key);
  return kind ? CHOICES[kind] : [];
}
export function defaultResultUnit(key: string, system: "si"|"imperial"): string {
  const kind = resultKind(key);
  if (!kind) return "–";
  const imperial = system === "imperial";
  switch(kind) {
    case "force": return imperial ? "lbf" : "N";
    case "moment": return imperial ? "lb·ft" : "N·m";
    case "power": return imperial ? "hp" : "kW";
    case "speed": return imperial ? "ft/s" : "m/s";
    case "angle": return "deg";
    case "rpm": return "rpm";
    case "pressure": return imperial ? "inHg" : "hPa";
    case "temperature": return imperial ? "°F" : "°C";
    case "density": return imperial ? "slug/ft³" : "kg/m³";
    case "altitude": return imperial ? "ft" : "m";
    case "diskLoading": return imperial ? "lbf/ft²" : "N/m²";
    case "powerLoading": return imperial ? "lbf/hp" : "N/kW";
  }
}
export function resultUnit(key: string, system: "si"|"imperial", custom: Record<string,string>): string {
  const selected = custom[key];
  return selected && resultUnitChoices(key).includes(selected) ? selected : defaultResultUnit(key,system);
}
export function readResultUnitPreferences(raw: string | null): Record<string,string> {
  try {
    const data: unknown = JSON.parse(raw || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const out: Record<string,string> = {};
    for (const [k,v] of Object.entries(data)) if(typeof v === "string" && resultUnitChoices(k).includes(v)) out[k] = v;
    return out;
  } catch { return {}; }
}

/** Base SI per group: N, N m, W, m/s, degrees, rpm, Pa, °C,
 * kg/m³, m, N/m², and N/kW. */
export function canonicalResultValue(key:string, r:RotorResults, g:RotorGeometry): number|null {
  const kind = resultKind(key);
  if (!kind || !r.solutionValid) return null;
  const area = Math.PI * g.radius * g.radius;
  const q = r.densityRho * area * r.tipSpeed * r.tipSpeed;
  const powerScale = q * r.tipSpeed;
  switch (key) {
    case "T": return r.thrustN;
    case "H": return r.dragHN;
    case "Hi": return r.CHi * q;
    case "H0": return r.CH0 * q;
    case "Y": return r.sideForceYN;
    case "Tc": return r.CT * q;
    case "Q": return r.torqueNm;
    case "Qi": return r.CQi * q * g.radius;
    case "Q0": return r.CQ0 * q * g.radius;
    case "Mx": return r.rollMomentNm;
    case "My": return r.pitchMomentNm;
    case "P": return r.powerShaftW;
    case "Pi": return r.CQi * powerScale;
    case "P0": return r.CQ0 * powerScale;
    case "Pair": return r.CPair * powerScale;
    case "Pc": return r.CQ * powerScale;
    case "DL": return area > 0 ? r.thrustN / area : NaN;
    case "PL": return r.powerShaftKW > 0.000001 ? r.thrustN / r.powerShaftKW : NaN;
    case "vi": return r.inflowLambdaI * r.tipSpeed;
    case "Vx": return r.operatingVx;
    case "Vz": return r.operatingVz;
    case "OmR": return r.tipSpeed;
    case "a": return r.speedOfSound;
    case "rpm": return r.trimmedRPM;
    case "coll": return r.trimmedCollectiveDeg;
    case "alpha": return r.operatingAlphaDeg;
    case "chi": return r.wakeSkewChiDeg;
    case "T0": return r.temperatureC;
    case "rho": return r.densityRho;
    case "p": return r.pressurePa;
    case "h": return r.altitudeM;
    default:
      if (kind === "speed" || kind === "angle") return derivedOutput(r,key);
      return null;
  }
}
export function convertResultFromCanonical(key: string, canonical: number, unit: string): number {
  if(!resultUnitChoices(key).includes(unit)) throw new RangeError("Incompatible unit for "+key+": "+unit);
  const kind = resultKind(key);
  if (kind === "diskLoading") {
    switch(unit) {case "N/m²": return canonical; case "kN/m²": return canonical/1000; case "kgf/m²": return canonical/9.80665; case "lbf/ft²": return canonical * 0.020885434273;}
  }
  if (kind === "powerLoading") {
    switch(unit) {case "N/kW": return canonical; case "N/W": return canonical/1000; case "kgf/kW": return canonical/9.80665; case "lbf/hp": return canonical * 0.224808943/1.34102209;}
  }
  if(unit === "inHg") return canonical / 3386.389;
  if(unit === "kPa") return canonical / 1000;
  if(unit === "bar") return canonical / 100000;
  if(unit === "MW") return canonical / 1e6;
  return UNIT_TABLE[unit].fromSI(canonical);
}
