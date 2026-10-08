import {
  calculate,
  cloneCondition,
  cloneGeometry,
  derivedClBar,
  derivedLambdaH,
  derivedMuOverLambda,
  derivedOutput,
  derivedPc,
  derivedTc,
  referenceAspectRatio,
  resolveOperatingState,
  type FlightCondition,
  type RotorGeometry,
  type RotorResults,
} from "./engine";
import { formatSig } from "./units";

export interface SweepParamMeta {
  key: string;
  full: string;
  short: string;
  symbol: string;
  unit: string;
  digits: number;
  getValue: (res: RotorResults, geom: RotorGeometry) => number;
}

export const SWEEP_TRIM_MODES = [
  { key: "none", label: "No Trim (Fixed Controls)" },
  { key: "coll_all", label: "Trim Collective Δθ · Every Point" },
  { key: "rpm_all", label: "Trim Rotor Speed Ω · Every Point" },
  { key: "coll_hover", label: "Trim Collective Δθ · Hover Only" },
  { key: "rpm_hover", label: "Trim Rotor Speed Ω · Hover Only" },
] as const;

export type SweepTrimModeKey = (typeof SWEEP_TRIM_MODES)[number]["key"];

export const SWEEP_PARAMS: SweepParamMeta[] = [
  { key: "CT", full: "Thrust Coefficient", short: "Thrust Coeff", symbol: "C_T", unit: "–", digits: 6, getValue: (r) => r.CT },
  { key: "CTs", full: "Blade Loading", short: "Blade Loading", symbol: "C_T/σ", unit: "–", digits: 4, getValue: (r) => r.CTs || 0 },
  { key: "CP", full: "Torque Coefficient", short: "Torque Coeff", symbol: "C_Q", unit: "–", digits: 6, getValue: (r) => r.CQ },
  { key: "CQi", full: "Induced Torque Coefficient", short: "Induced Torque", symbol: "C_Qi", unit: "–", digits: 6, getValue: (r) => r.CQi },
  { key: "CQ0", full: "Profile Torque Coefficient", short: "Profile Torque", symbol: "C_Q0", unit: "–", digits: 6, getValue: (r) => r.CQ0 },
  { key: "CH", full: "In-Plane Force Coefficient", short: "In-Plane Coeff", symbol: "C_H", unit: "–", digits: 6, getValue: (r) => r.CH },
  { key: "CHi", full: "Induced In-Plane Coefficient", short: "Induced In-Plane", symbol: "C_Hi", unit: "–", digits: 6, getValue: (r) => r.CHi },
  { key: "CH0", full: "Profile In-Plane Coefficient", short: "Profile In-Plane", symbol: "C_H0", unit: "–", digits: 6, getValue: (r) => r.CH0 },
  { key: "CY", full: "Side Force Coefficient", short: "Side Force Coeff", symbol: "C_Y", unit: "–", digits: 6, getValue: (r) => r.CY },
  { key: "CMx", full: "Roll Moment Coefficient", short: "Roll Coeff", symbol: "C_Mx", unit: "–", digits: 6, getValue: (r) => r.CMx },
  { key: "CMy", full: "Pitch Moment Coefficient", short: "Pitch Coeff", symbol: "C_My", unit: "–", digits: 6, getValue: (r) => r.CMy },
  { key: "CPair", full: "Air Power Coefficient", short: "Air Power Coeff", symbol: "C_Pair", unit: "–", digits: 6, getValue: (r) => r.CPair },
  {
    key: "CLbar",
    full: "Mean Lift Coefficient",
    short: "Mean Lift",
    symbol: "C̄_L",
    unit: "–",
    digits: 4,
    getValue: (r, g) => derivedClBar(r, (g.sigmaThrust > 0 ? g.sigmaThrust : g.sigmaRef)),
  },
  { key: "vi", full: "Induced Velocity", short: "Induced Velocity", symbol: "v_i", unit: "m/s", digits: 2, getValue: (r) => derivedOutput(r, "vi") },
  { key: "Vztot", full: "Total Axial Speed", short: "Total Axial Speed", symbol: "V_{z,tot}", unit: "m/s", digits: 2, getValue: (r) => derivedOutput(r, "Vztot") },
  { key: "Vadv", full: "Advancing Speed", short: "Advancing Speed", symbol: "V_adv", unit: "m/s", digits: 2, getValue: (r) => derivedOutput(r, "Vadv") },
  { key: "Vret", full: "Retreating Speed", short: "Retreating Speed", symbol: "V_ret", unit: "m/s", digits: 2, getValue: (r) => derivedOutput(r, "Vret") },
  { key: "Mret", full: "Retreating Mach", short: "Retreating Mach", symbol: "M_ret", unit: "–", digits: 4, getValue: (r) => derivedOutput(r, "Mret") },
  { key: "aoaAdv25", full: "Advancing AoA 25%", short: "Adv. AoA 25%", symbol: "α_{adv,25}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaAdv25") },
  { key: "aoaRet25", full: "Retreating AoA 25%", short: "Ret. AoA 25%", symbol: "α_{ret,25}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaRet25") },
  { key: "phiAdv25", full: "Advancing Inflow Angle 25%", short: "Adv. Inflow 25%", symbol: "φ_{adv,25}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiAdv25") },
  { key: "phiRet25", full: "Retreating Inflow Angle 25%", short: "Ret. Inflow 25%", symbol: "φ_{ret,25}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiRet25") },
  { key: "aoaAdv50", full: "Advancing AoA 50%", short: "Adv. AoA 50%", symbol: "α_{adv,50}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaAdv50") },
  { key: "aoaRet50", full: "Retreating AoA 50%", short: "Ret. AoA 50%", symbol: "α_{ret,50}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaRet50") },
  { key: "phiAdv50", full: "Advancing Inflow Angle 50%", short: "Adv. Inflow 50%", symbol: "φ_{adv,50}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiAdv50") },
  { key: "phiRet50", full: "Retreating Inflow Angle 50%", short: "Ret. Inflow 50%", symbol: "φ_{ret,50}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiRet50") },
  { key: "aoaAdv75", full: "Advancing AoA 75%", short: "Adv. AoA 75%", symbol: "α_{adv,75}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaAdv75") },
  { key: "aoaRet75", full: "Retreating AoA 75%", short: "Ret. AoA 75%", symbol: "α_{ret,75}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaRet75") },
  { key: "phiAdv75", full: "Advancing Inflow Angle 75%", short: "Adv. Inflow 75%", symbol: "φ_{adv,75}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiAdv75") },
  { key: "phiRet75", full: "Retreating Inflow Angle 75%", short: "Ret. Inflow 75%", symbol: "φ_{ret,75}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiRet75") },
  { key: "aoaAdvTip", full: "Advancing AoA Tip", short: "Adv. AoA Tip", symbol: "α_{adv,tip}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaAdvTip") },
  { key: "aoaRetTip", full: "Retreating AoA Tip", short: "Ret. AoA Tip", symbol: "α_{ret,tip}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "aoaRetTip") },
  { key: "phiAdvTip", full: "Advancing Inflow Angle Tip", short: "Adv. Inflow Tip", symbol: "φ_{adv,tip}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiAdvTip") },
  { key: "phiRetTip", full: "Retreating Inflow Angle Tip", short: "Ret. Inflow Tip", symbol: "φ_{ret,tip}", unit: "deg", digits: 2, getValue: (r) => derivedOutput(r, "phiRetTip") },
  {
    key: "Tc",
    full: "Dynamic-Pressure Thrust Coefficient",
    short: "Dynamic-Pressure Thrust",
    symbol: "T_c",
    unit: "–",
    digits: 4,
    getValue: (r, g) => derivedTc(r, Math.PI * g.radius * g.radius),
  },
  {
    key: "Pc",
    full: "Dynamic-Pressure Power Coefficient",
    short: "Dynamic-Pressure Power",
    symbol: "P_c",
    unit: "–",
    digits: 4,
    getValue: (r, g) => derivedPc(r, Math.PI * g.radius * g.radius),
  },
  { key: "lambda", full: "Total Inflow Ratio", short: "Inflow Ratio", symbol: "λ", unit: "–", digits: 5, getValue: (r) => r.inflowLambda },
  { key: "lambda_i", full: "Induced Inflow Ratio", short: "Induced Inflow", symbol: "λ_i", unit: "–", digits: 5, getValue: (r) => r.inflowLambdaI },
  { key: "lamh", full: "Hover Inflow Ratio", short: "Hover Inflow", symbol: "λ_h", unit: "–", digits: 5, getValue: (r) => derivedLambdaH(r) },
  { key: "muLam", full: "Advance-to-Inflow Ratio", short: "Advance-Inflow", symbol: "μ/λ", unit: "–", digits: 4, getValue: (r) => derivedMuOverLambda(r) },
  { key: "L_D_eff", full: "Effective Lift-to-Drag Ratio", short: "Effective L/D", symbol: "(L/D)_e", unit: "–", digits: 2, getValue: (r) => r.L_D_eff },
  { key: "FoM", full: "Figure of Merit", short: "Figure of Merit", symbol: "FM", unit: "–", digits: 4, getValue: (r) => r.FoM },
  { key: "Kx", full: "Longitudinal Inflow Gradient", short: "Long. Gradient", symbol: "K_x", unit: "–", digits: 4, getValue: (r) => r.inflowKx },
  { key: "Ky", full: "Lateral Inflow Gradient", short: "Lat. Gradient", symbol: "K_y", unit: "–", digits: 4, getValue: (r) => r.inflowKy },
  { key: "chi", full: "Wake Skew Angle", short: "Wake Skew", symbol: "χ", unit: "deg", digits: 2, getValue: (r) => r.wakeSkewChiDeg },
  { key: "Mat", full: "Advancing Tip Mach Number", short: "Advancing Mach", symbol: "M_adv", unit: "–", digits: 4, getValue: (r) => r.advancingTipMach },
  { key: "PowerKW", full: "Shaft Power", short: "Power", symbol: "P", unit: "kW", digits: 2, getValue: (r) => r.powerShaftKW },
  { key: "PowerHP", full: "Shaft Power", short: "Power", symbol: "P", unit: "hp", digits: 2, getValue: (r) => r.powerShaftHP },
  { key: "ThrustN", full: "Thrust", short: "Thrust", symbol: "T", unit: "N", digits: 1, getValue: (r) => r.thrustN },
  { key: "ThrustKgf", full: "Thrust", short: "Thrust", symbol: "T", unit: "kgf", digits: 2, getValue: (r) => r.thrustKgf },
  { key: "TorqueNm", full: "Shaft Torque", short: "Torque", symbol: "Q", unit: "N·m", digits: 2, getValue: (r) => r.torqueNm },
  { key: "DragHN", full: "In-Plane Force", short: "In-Plane Force", symbol: "H", unit: "N", digits: 2, getValue: (r) => r.dragHN },
  {
    key: "PowerIndKW",
    full: "Induced Power",
    short: "Induced Power",
    symbol: "P_i",
    unit: "kW",
    digits: 2,
    getValue: (r, g) => (r.CQi * r.densityRho * (Math.PI * g.radius * g.radius) * Math.pow(r.tipSpeed, 3)) / 1000,
  },
  {
    key: "PowerProfKW",
    full: "Profile Power",
    short: "Profile Power",
    symbol: "P_0",
    unit: "kW",
    digits: 2,
    getValue: (r, g) => (r.CQ0 * r.densityRho * (Math.PI * g.radius * g.radius) * Math.pow(r.tipSpeed, 3)) / 1000,
  },
  {
    key: "PowerAirKW",
    full: "Air Power",
    short: "Air Power",
    symbol: "P_air",
    unit: "kW",
    digits: 2,
    getValue: (r, g) => (r.CPair * r.densityRho * (Math.PI * g.radius * g.radius) * Math.pow(r.tipSpeed, 3)) / 1000,
  },
  {
    key: "TorqueIndNm",
    full: "Induced Torque",
    short: "Induced Torque",
    symbol: "Q_i",
    unit: "N·m",
    digits: 2,
    getValue: (r, g) => {
      const rad = g.radius;
      return r.CQi * r.densityRho * Math.PI * rad * rad * r.tipSpeed * r.tipSpeed * rad;
    },
  },
  {
    key: "TorqueProfNm",
    full: "Profile Torque",
    short: "Profile Torque",
    symbol: "Q_0",
    unit: "N·m",
    digits: 2,
    getValue: (r, g) => {
      const rad = g.radius;
      return r.CQ0 * r.densityRho * Math.PI * rad * rad * r.tipSpeed * r.tipSpeed * rad;
    },
  },
  {
    key: "DragIndN",
    full: "Induced In-Plane Force",
    short: "Induced In-Plane",
    symbol: "H_i",
    unit: "N",
    digits: 2,
    getValue: (r, g) => r.CHi * r.densityRho * (Math.PI * g.radius * g.radius) * r.tipSpeed * r.tipSpeed,
  },
  {
    key: "DragProfN",
    full: "Profile In-Plane Force",
    short: "Profile In-Plane",
    symbol: "H_0",
    unit: "N",
    digits: 2,
    getValue: (r, g) => r.CH0 * r.densityRho * (Math.PI * g.radius * g.radius) * r.tipSpeed * r.tipSpeed,
  },
  { key: "B", full: "Tip-Loss Factor", short: "Tip Factor", symbol: "B", unit: "–", digits: 4, getValue: (r) => r.bFactor },
  { key: "TipSpeed", full: "Tip Speed", short: "Tip Speed", symbol: "ΩR", unit: "m/s", digits: 2, getValue: (r) => r.tipSpeed },
  { key: "RPM", full: "Rotor Speed", short: "Rotor Speed", symbol: "Ω", unit: "rpm", digits: 1, getValue: (r) => r.trimmedRPM },
  { key: "Collective", full: "Collective Pitch", short: "Collective", symbol: "Δθ", unit: "deg", digits: 2, getValue: (r) => r.trimmedCollectiveDeg },
  { key: "Mu", full: "Advance Ratio", short: "Advance Ratio", symbol: "μ_x", unit: "–", digits: 4, getValue: (r) => r.operatingMu },
  { key: "Vx", full: "Forward Airspeed", short: "Airspeed", symbol: "V_x", unit: "m/s", digits: 2, getValue: (r) => r.operatingVx },
  { key: "MuZ", full: "Axial Flow Ratio", short: "Axial Ratio", symbol: "μ_z", unit: "–", digits: 4, getValue: (r) => r.operatingMuZ },
  { key: "Vz", full: "Climb Speed", short: "Climb Speed", symbol: "V_z", unit: "m/s", digits: 2, getValue: (r) => r.operatingVz },
  { key: "Alpha", full: "Disk Angle of Attack", short: "Disk AoA", symbol: "α", unit: "deg", digits: 2, getValue: (r) => r.operatingAlphaDeg },
  { key: "Altitude", full: "Pressure Altitude", short: "Altitude", symbol: "H_p", unit: "m", digits: 1, getValue: (r) => r.altitudeM },
  { key: "Temperature", full: "Outside Air Temperature", short: "Temperature", symbol: "OAT", unit: "°C", digits: 1, getValue: (r) => r.temperatureC },
  { key: "Density", full: "Air Density", short: "Density", symbol: "ρ", unit: "kg/m³", digits: 4, getValue: (r) => r.densityRho },
  { key: "Pressure", full: "Ambient Pressure", short: "Pressure", symbol: "p", unit: "Pa", digits: 0, getValue: (r) => r.pressurePa },
  { key: "SoundSpeed", full: "Speed of Sound", short: "Sound Speed", symbol: "a", unit: "m/s", digits: 2, getValue: (r) => r.speedOfSound },
];

export interface SweepPointData {
  curveLabel: string;
  mu: number;
  vx: number;
  muLam: number;
  val: number;
  valid: boolean;
  rpm: number;
  collectiveDeg: number;
  ct: number;
  thrustN: number;
  torqueNm?: number;
  powerKW?: number;
  piKW?: number;
  p0KW?: number;
  pparKW?: number;
  cq?: number;
  cp?: number;
  ch?: number;
  fom?: number;
  machAdv?: number;
  machRet?: number;
  lambdaI?: number;
  muZ?: number;
  vz?: number;
}

export interface SweepCurve {
  label: string;
  color: string;
  points: SweepPointData[];
}

export const PLOT_PALETTES = [
  {
    name: "Aero",
    light: ["#007F95", "#B45309", "#C026A3", "#4D7C0F", "#2563EB", "#BE123C", "#7C3AED", "#334155"],
    dark: ["#00E5FF", "#FFB300", "#FF4DD2", "#A3E635", "#60A5FA", "#FB7185", "#C4B5FD", "#E2E8F0"],
  },
  {
    name: "Colorblind Safe",
    light: ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#3A9AD0", "#CC79A7", "#9A8700", "#000000"],
    dark: ["#56B4E9", "#E69F00", "#009E73", "#F0E442", "#D55E00", "#CC79A7", "#3A8BD0", "#FFFFFF"],
  },
  {
    name: "Print",
    light: ["#000000", "#B00020", "#0033A0", "#1B7A1B", "#6A1B9A", "#8C4A00", "#006064", "#555555"],
    dark: ["#FFFFFF", "#FF6B6B", "#6CB2FF", "#5BE37D", "#D39BFF", "#FFB04A", "#4DD0E1", "#BDBDBD"],
  },
] as const;

export const PALETTE = PLOT_PALETTES[0].dark;

function applyTrimPair(
  c: FlightCondition,
  rpmTrim: boolean,
  kind: "ct" | "thrust",
  tgt: number,
  baseRPM: number,
  baseColl: number
): void {
  c.rpm = baseRPM;
  c.collectiveDeg = baseColl;
  c.operatingPair = rpmTrim
    ? kind === "ct"
      ? "collective_ct"
      : "collective_thrust"
    : kind === "ct"
    ? "rpm_ct"
    : "rpm_thrust";
  if (kind === "ct") {
    c.targetCT = tgt;
  } else {
    c.targetThrustN = tgt;
  }
}

export function runParameterSweep(
  geom: RotorGeometry,
  baseCond: FlightCondition,
  selectedParamKey: string,
  multiMode: number, // 0=Inflow models, 1=Alpha, 2=Vz, 3=MuZ, 4=Single
  maxMu = 0.4,
  numSteps = 25,
  customFamilyValues?: number[],
  trimMode: SweepTrimModeKey = "none",
  paletteIndex = 0,
  theme: "dark" | "light" | "midnight" | "sepia" = "dark"
): {
  curves: SweepCurve[];
  currentOpPoint: { mu: number; vx: number; muLam?: number; val: number } | null;
  paramMeta: SweepParamMeta;
} {
  const meta = SWEEP_PARAMS.find((p) => p.key === selectedParamKey) || SWEEP_PARAMS[0];
  const curves: SweepCurve[] = [];

  // Baseline operating point of active condition
  const live = calculate(geom, baseCond);
  let baseRPM = baseCond.rpm;
  let baseColl = baseCond.collectiveDeg;
  if (live.solutionValid) {
    baseRPM = live.trimmedRPM;
    baseColl = live.trimmedCollectiveDeg;
  }

  // Thrust target: Conditions target (CT or T); fall back to current thrust
  // Match whole tokens: "collective" contains the letters "ct" but is not a CT target.
  const pairTokens = baseCond.operatingPair.split("_");
  let collKind: "ct" | "thrust" = "thrust";
  let collTgt = 0;
  if (pairTokens.includes("ct") && baseCond.targetCT && baseCond.targetCT > 0) {
    collKind = "ct";
    collTgt = baseCond.targetCT;
  } else if (pairTokens.includes("thrust") && baseCond.targetThrustN && baseCond.targetThrustN > 0) {
    collKind = "thrust";
    collTgt = baseCond.targetThrustN;
  } else if (live.solutionValid) {
    collKind = "thrust";
    collTgt = live.thrustN;
  }

  let rpmKind = collKind;
  let rpmTgt = collTgt;
  if (collKind === "ct" && live.solutionValid && live.CT > 0) {
    rpmKind = "thrust";
    rpmTgt = (collTgt * live.thrustN) / live.CT;
  }
  const trimOK = collTgt > 0;

  const isHover = trimMode === "coll_hover" || trimMode === "rpm_hover";
  const rpmTrim = trimMode === "rpm_all" || trimMode === "rpm_hover";
  let fixedValid = true;
  let fixedRPM = baseRPM;
  let fixedColl = baseColl;

  if (isHover) {
    fixedValid = false;
    if (trimOK) {
      const hc = cloneCondition(baseCond);
      hc.horizontalMode = "mu";
      hc.horizontalValue = 0.0;
      hc.axialMode = "muz";
      hc.axialValue = 0.0;
      if (rpmTrim) {
        applyTrimPair(hc, true, rpmKind, rpmTgt, baseRPM, baseColl);
      } else {
        applyTrimPair(hc, false, collKind, collTgt, baseRPM, baseColl);
      }
      const [_, sh, hStatus] = resolveOperatingState(geom, hc);
      if (hStatus === "VALID") {
        fixedRPM = sh.rpm;
        fixedColl = sh.collectiveDeg;
        fixedValid = true;
      }
    }
  }

  let familyConfigs: { label: string; patch: Partial<FlightCondition> }[] = [];

  if (multiMode === 1) {
    // Alpha Family
    const alphas = customFamilyValues && customFamilyValues.length >= 1 ? customFamilyValues : [-10, -5, 0, 5, 10];
    familyConfigs = alphas.map((a) => ({
      label: `α=${Number.isInteger(a) ? a : Number(a.toFixed(4))}°`,
      patch: { axialMode: "alpha", axialValue: a },
    }));
  } else if (multiMode === 2) {
    // Vz Family
    const vzs = customFamilyValues && customFamilyValues.length >= 1 ? customFamilyValues : [-10, -5, 0, 5, 10];
    familyConfigs = vzs.map((v) => ({
      label: `Vz = ${v > 0 ? "+" : ""}${v} m/s`,
      patch: { axialMode: "vz", axialValue: v },
    }));
  } else if (multiMode === 3) {
    // MuZ Family
    const muzs = customFamilyValues && customFamilyValues.length >= 1 ? customFamilyValues : [-0.05, -0.025, 0, 0.025, 0.05];
    familyConfigs = muzs.map((m) => ({
      label: `μz = ${m > 0 ? "+" : ""}${m.toFixed(3)}`,
      patch: { axialMode: "muz", axialValue: m },
    }));
  } else if (multiMode === 4) {
    // Inflow Model Family
    familyConfigs = [
      { label: "Uniform", patch: { inflowModel: "uniform" } },
      { label: "Coleman", patch: { inflowModel: "coleman_simple" } },
      { label: "Coleman-Feingold", patch: { inflowModel: "coleman_feingold" } },
      { label: "Drees", patch: { inflowModel: "drees" } },
    ];
  } else {
    // Single Curve (Active Condition)
    familyConfigs = [
      {
        label: "Active Condition",
        patch: {},
      },
    ];
  }

  const dMu = maxMu / Math.max(1, numSteps - 1);
  const pal = PLOT_PALETTES[paletteIndex % PLOT_PALETTES.length] || PLOT_PALETTES[0];
  const colors = theme === "light" || theme === "sepia" ? pal.light : pal.dark;

  familyConfigs.forEach((cfg, idx) => {
    const points: SweepPointData[] = [];
    for (let step = 0; step < numSteps; step++) {
      const muTarget = step * dMu;
      const c = cloneCondition(baseCond);
      Object.assign(c, cfg.patch);
      c.horizontalMode = "mu";
      c.horizontalValue = muTarget;

      let skip = false;
      switch (trimMode) {
        case "coll_all":
          if (trimOK) applyTrimPair(c, false, collKind, collTgt, baseRPM, baseColl);
          else skip = true;
          break;
        case "rpm_all":
          if (trimOK) applyTrimPair(c, true, rpmKind, rpmTgt, baseRPM, baseColl);
          else skip = true;
          break;
        case "coll_hover":
        case "rpm_hover":
          if (fixedValid) {
            c.operatingPair = "rpm_collective";
            c.rpm = fixedRPM;
            c.collectiveDeg = fixedColl;
          } else {
            skip = true;
          }
          break;
        default: // "none"
          if (live.solutionValid) {
            c.operatingPair = "rpm_collective";
            c.rpm = baseRPM;
            c.collectiveDeg = baseColl;
          }
          break;
      }

      if (skip) {
        points.push({
          curveLabel: cfg.label,
          mu: muTarget,
          vx: 0,
          muLam: 0,
          val: 0,
          valid: false,
          rpm: c.rpm,
          collectiveDeg: c.collectiveDeg,
          ct: 0,
          thrustN: 0,
        });
        continue;
      }

      const res = calculate(geom, c);
      const val = res.solutionValid ? meta.getValue(res, geom) : 0;
      const muLam = res.solutionValid ? derivedMuOverLambda(res) : 0;
      const vtip3 = Math.pow(res.tipSpeed, 3);
      const diskArea = Math.PI * geom.radius * geom.radius;
      const pDenom = (res.densityRho * diskArea * vtip3) / 1000;
      points.push({
        curveLabel: cfg.label,
        mu: muTarget,
        vx: res.operatingVx,
        muLam: Number.isFinite(muLam) ? muLam : 0,
        val: Number.isFinite(val) ? val : 0,
        valid: res.solutionValid && Number.isFinite(val),
        rpm: res.trimmedRPM,
        collectiveDeg: res.trimmedCollectiveDeg,
        ct: res.CT,
        thrustN: res.thrustN,
        torqueNm: res.torqueNm,
        powerKW: res.powerShaftW / 1000,
        piKW: res.CQi * pDenom,
        p0KW: res.CQ0 * pDenom,
        pparKW: res.CPair * pDenom,
        cq: res.CQ,
        cp: res.CQ,
        ch: res.CH,
        fom: res.FoM,
        machAdv: res.advancingTipMach,
        machRet: ((1 - res.operatingMu) * res.tipSpeed) / Math.max(1, res.speedOfSound),
        lambdaI: res.inflowLambdaI,
        muZ: res.operatingMuZ,
        vz: res.operatingVz,
      });
    }

    curves.push({
      label: cfg.label,
      color: colors[idx % colors.length],
      points,
    });
  });

  // Calculate current operating point
  let currentOpPoint = null;
  if (live.solutionValid && Number.isFinite(meta.getValue(live, geom))) {
    const liveVal = meta.getValue(live, geom);
    const liveMuLam = derivedMuOverLambda(live);
    currentOpPoint = {
      mu: live.operatingMu,
      vx: live.operatingVx,
      muLam: Number.isFinite(liveMuLam) ? liveMuLam : 0,
      val: Number.isFinite(liveVal) ? liveVal : 0,
    };
  }

  return { curves, currentOpPoint, paramMeta: meta };
}

/**
 * Builds wide table rows: row 0 = headers with units; row 1..N = grid points.
 * Columns: mu [, Vx or mu/lambda], followed by one column per curve.
 */
export function buildSweepTableRows(
  curves: SweepCurve[],
  paramMeta: SweepParamMeta,
  xAxisMode: "mu" | "vx" | "muLam",
  extraPrecision = 0,
  forCsv = false
): string[][] {
  if (curves.length === 0 || curves[0].points.length === 0) return [];

  const nPoints = curves[0].points.length;
  const nCurves = curves.length;
  const xc = xAxisMode === "mu" ? 1 : 2;
  const na = forCsv ? "-" : "–";
  const dig = Math.max(0, paramMeta.digits + Math.min(1, Math.max(0, extraPrecision)));

  const sym = paramMeta.symbol;
  const unitStr = paramMeta.unit && paramMeta.unit !== "–" ? ` [${paramMeta.unit}]` : (forCsv ? " [-]" : "");

  const hdr: string[] = [];
  hdr[0] = forCsv ? "μ_x [-]" : "μ_x";
  if (xAxisMode === "vx") {
    hdr[1] = "V_x [m/s]";
  } else if (xAxisMode === "muLam") {
    hdr[1] = forCsv ? "μ/λ [-]" : "μ/λ";
  }
  for (let c = 0; c < nCurves; c++) {
    const lbl = curves[c].label;
    hdr[xc + c] = `${lbl} ${sym}${unitStr}`;
  }

  const rows: string[][] = [hdr];

  for (let i = 0; i < nPoints; i++) {
    const row: string[] = [];
    const p0 = curves[0].points[i];
    row[0] = p0.mu.toFixed(3);
    if (xAxisMode === "vx") {
      row[1] = p0.valid ? p0.vx.toFixed(1) : na;
    } else if (xAxisMode === "muLam") {
      row[1] = isSweepPointUsable(p0, "muLam") ? p0.muLam.toFixed(3) : na;
    }
    for (let c = 0; c < nCurves; c++) {
      const pt = curves[c].points[i];
      if (pt && pt.valid) {
        if (Math.abs(pt.val) >= 1000) {
          row[xc + c] = forCsv ? pt.val.toFixed(dig) : pt.val.toLocaleString("en-US", { maximumFractionDigits: dig });
        } else {
          row[xc + c] = pt.val.toFixed(dig);
        }
      } else {
        row[xc + c] = na;
      }
    }
    rows.push(row);
  }

  return rows;
}

export function renderSweepTableHtml(
  curves: SweepCurve[],
  paramMeta: SweepParamMeta,
  xAxisMode: "mu" | "vx" | "muLam",
  trimMode: SweepTrimModeKey,
  extraPrecision = 0,
  theme: "dark" | "light" | "midnight" | "sepia" = "dark"
): string {
  const bg = theme === "sepia" ? "#FAF6EE" : theme === "midnight" ? "#0f1d3a" : theme === "light" ? "#ffffff" : "#10141c";
  const fg = theme === "sepia" ? "#2D2319" : theme === "light" ? "#172033" : "#f1f5f9";
  const grid = theme === "sepia" ? "#DDD2C0" : theme === "midnight" ? "#263b63" : theme === "light" ? "#d5dce6" : "#273244";
  const hintCol = theme === "sepia" ? "#7A6E5F" : theme === "midnight" ? "#9db2d6" : theme === "light" ? "#5a6678" : "#94a3b8";

  const rows = buildSweepTableRows(curves, paramMeta, xAxisMode, extraPrecision, false);
  if (rows.length === 0) return "<p>No sweep data</p>";

  const strategy = SWEEP_TRIM_MODES.find((m) => m.key === trimMode)?.label || "No Trim";
  const cols = rows[0].length;
  const xc = xAxisMode === "mu" ? 1 : 2;

  let html = `
    <div style="height: 100%; display: flex; flex-direction: column; background: ${bg}; color: ${fg}; font-family: 'RotorRoboto', Roboto, sans-serif; font-size: 14px;">
      <div style="padding: 10px 14px; font-size: 13px; color: ${hintCol}; border-bottom: 1px solid ${grid}; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${strategy}</strong></span>
        ${cols > xc + 1 ? `<span style="font-size: 12px;">x columns stay frozen ↔</span>` : ""}
      </div>
      <div style="flex: 1; overflow: auto;">
        <table style="border-collapse: separate; border-spacing: 0; width: 100%; white-space: nowrap;">
          <thead>
            <tr>`;

  // Render headers
  rows[0].forEach((cell, idx) => {
    const formatted = cell.replace(/_([A-Za-z0-9]+)/g, "<sub>$1</sub>");
    const isFirst = idx === 0;
    const isSecond = idx === 1 && xc >= 2;
    const isBorderRight = idx === xc - 1;
    let stickyStyle = "";
    if (isFirst) {
      stickyStyle = "position: sticky; left: 0; z-index: 3; min-width: 84px; width: 84px;";
    } else if (isSecond) {
      stickyStyle = "position: sticky; left: 84px; z-index: 3; min-width: 96px; width: 96px;";
    } else {
      stickyStyle = "position: sticky; top: 0; z-index: 2;";
    }
    const borderStyle = isBorderRight ? `border-right: 2px solid ${hintCol};` : `border-right: 1px solid ${grid};`;

    html += `
      <th style="padding: 10px 14px; border-bottom: 2px solid ${grid}; ${borderStyle} text-align: ${isFirst ? "left" : "right"}; background: ${bg}; ${stickyStyle} font-weight: 700;">
        ${formatted}
      </th>`;
  });
  html += `</tr></thead><tbody>`;

  // Render body rows
  for (let r = 1; r < rows.length; r++) {
    html += `<tr>`;
    rows[r].forEach((cell, idx) => {
      const isFirst = idx === 0;
      const isSecond = idx === 1 && xc >= 2;
      const isBorderRight = idx === xc - 1;
      let stickyStyle = "";
      if (isFirst) {
        stickyStyle = "position: sticky; left: 0; z-index: 1; font-weight: 700; min-width: 84px; width: 84px;";
      } else if (isSecond) {
        stickyStyle = "position: sticky; left: 84px; z-index: 1; font-weight: 700; min-width: 96px; width: 96px;";
      }
      const borderStyle = isBorderRight ? `border-right: 2px solid ${hintCol};` : `border-right: 1px solid ${grid};`;

      html += `
        <td style="padding: 9px 14px; border-bottom: 1px solid ${grid}; ${borderStyle} text-align: ${isFirst ? "left" : "right"}; background: ${bg}; ${stickyStyle}">
          ${cell}
        </td>`;
    });
    html += `</tr>`;
  }

  html += `</tbody></table></div></div>`;
  return html;
}

export function generateSweepCSV(
  curves: SweepCurve[],
  paramMeta: SweepParamMeta,
  xAxisMode: "mu" | "vx" | "muLam",
  trimMode: SweepTrimModeKey,
  extraPrecision = 0
): string {
  const rows = buildSweepTableRows(curves, paramMeta, xAxisMode, extraPrecision, true);
  const strategy = SWEEP_TRIM_MODES.find((m) => m.key === trimMode)?.label || "No Trim";

  const lines = [
    `# RotorCalculator Parameter Sweep`,
    `# Parameter: ${paramMeta.full} (${paramMeta.symbol})`,
    `# Trim Mode: ${strategy}`,
  ];

  for (const r of rows) {
    const escaped = r.map((cell) => {
      if (cell.includes(",") || cell.includes('"') || cell.includes(" ")) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    lines.push(escaped.join(","));
  }

  return lines.join("\r\n");
}

export function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  if (f <= 1.5) return mag;
  if (f <= 3.5) return 2 * mag;
  if (f <= 7.5) return 5 * mag;
  return 10 * mag;
}

export function stepDecimals(stepV: number): number {
  return Math.max(0, -Math.floor(Math.log10(stepV) + 0.000001));
}

/** Render canonical subscript symbols and scientific exponents on canvas. */
function drawRichCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.save();
  const font = ctx.font;
  const size = Number(font.match(/([\d.]+)px/)?.[1]) || 13;
  const small = font.replace(/[\d.]+px/, `${size * .72}px`);
  const runs: { text: string; font: string; dy: number; width: number }[] = [];
  let offset = 0;
  const add = (part: string, f: string, dy: number) => { ctx.font = f; runs.push({ text: part, font: f, dy, width: ctx.measureText(part).width }); };
  for (const match of text.matchAll(/([_^])(-?[A-Za-z0-9]+)/g)) {
    add(text.slice(offset, match.index), font, 0);
    add(match[2], small, match[1] === "_" ? size * .3 : -size * .3);
    offset = match.index! + match[0].length;
  }
  add(text.slice(offset), font, 0);
  const width = runs.reduce((n, run) => n + run.width, 0);
  if (ctx.textAlign === "center") x -= width / 2;
  else if (ctx.textAlign === "right" || ctx.textAlign === "end") x -= width;
  ctx.textAlign = "left";
  for (const run of runs) { ctx.font = run.font; ctx.fillText(run.text, x, y + run.dy); x += run.width; }
  ctx.restore();
}

export type SweepXAxis = "mu" | "vx" | "muLam";
type OperatingMarker = { mu: number; vx: number; muLam?: number; val: number };

export function sweepPointX(point: { mu: number; vx: number; muLam?: number }, axis: SweepXAxis): number {
  return axis === "vx" ? point.vx : axis === "muLam" ? point.muLam ?? NaN : point.mu;
}

/** RotorPopups.XOk: the chosen axis must describe a finite, supported solution. */
export function isSweepPointUsable(point: SweepPointData, axis: SweepXAxis): boolean {
  const x = sweepPointX(point, axis);
  return point.valid && point.mu <= 0.6001 && Number.isFinite(point.val) && Number.isFinite(x) && (axis !== "muLam" || x >= 0);
}

/** RotorPopups.CurveOrder retains original indices to avoid joining across invalid samples. */
export function orderedSweepPoints(points: SweepPointData[], axis: SweepXAxis): { point: SweepPointData; index: number }[] {
  return points.map((point, index) => ({ point, index })).filter(({ point }) => isSweepPointUsable(point, axis)).sort((a, b) => sweepPointX(a.point, axis) - sweepPointX(b.point, axis));
}

/** Exact native marker gate: requested μ range plus interpolated 1% curve-span tolerance. */
export function visibleSweepMarker(curves: SweepCurve[], marker: OperatingMarker | null, axis: SweepXAxis): OperatingMarker | null {
  if (!marker || !Number.isFinite(marker.val) || !Number.isFinite(sweepPointX(marker, axis)) || sweepPointX(marker, axis) < 0) return null;
  const allPoints = curves.flatMap((curve) => curve.points);
  const maxMu = Math.max(...allPoints.map((point) => point.mu));
  if (marker.mu < 0 || marker.mu > maxMu) return null;
  const usable = allPoints.filter((point) => isSweepPointUsable(point, axis));
  if (!usable.length) return null;
  let span = Math.max(...usable.map((point) => point.val)) - Math.min(...usable.map((point) => point.val));
  if (span < 1e-12) span = Math.max(1e-9, Math.abs(marker.val) * 0.01);
  const tolerance = 0.01 * span;
  const x = sweepPointX(marker, axis);
  for (const curve of curves) {
    for (let index = 0; index < curve.points.length - 1; index++) {
      const first = curve.points[index];
      const second = curve.points[index + 1];
      if (!isSweepPointUsable(first, axis) || !isSweepPointUsable(second, axis)) continue;
      const x1 = sweepPointX(first, axis);
      const x2 = sweepPointX(second, axis);
      if (x < Math.min(x1, x2) - 1e-9 || x > Math.max(x1, x2) + 1e-9) continue;
      const t = Math.abs(x2 - x1) > 1e-12 ? (x - x1) / (x2 - x1) : 0;
      if (Math.abs(first.val + t * (second.val - first.val) - marker.val) <= tolerance) return marker;
    }
  }
  return null;
}

export function drawSweepCanvas(
  canvas: HTMLCanvasElement,
  curves: SweepCurve[],
  currentOpPoint: { mu: number; vx: number; muLam?: number; val: number } | null,
  xAxisMode: "mu" | "vx" | "muLam",
  paramMeta: SweepParamMeta,
  theme: "dark" | "light" | "midnight" | "sepia" = "dark",
  hoverCoord: { x: number; y: number } | null = null,
  crossX = -1,
  extraPrecision = 0
): { plotLeft: number; plotWidth: number; xMax: number } {
  currentOpPoint = visibleSweepMarker(curves, currentOpPoint, xAxisMode);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { plotLeft: 0, plotWidth: 0, xMax: 1 };

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 380;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isSepia = theme === "sepia";
  const isLight = theme === "light";
  const isMid = theme === "midnight";
  const bgCol = isSepia ? "#FAF6EE" : isLight ? "#FFFFFF" : isMid ? "#0D1B2A" : "#10141C";
  const gridCol = isSepia ? "#DDD2C0" : isLight ? "#D9E1EA" : isMid ? "#2A4361" : "#2A3544";
  const textCol = isSepia ? "#2D2319" : isLight ? "#344054" : isMid ? "#B9CBE0" : "#B4BFCE";
  const currentMarkerCol = isSepia ? "#8C5A2B" : isLight ? "#AA5A00" : "#FFB300";
  const titleCol = isSepia ? "#8C5A2B" : isLight ? "#007F95" : "#00E5FF";

  // Background
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, width, height);

  const getX = (pt: { mu: number; vx: number; muLam?: number }): number => {
    if (xAxisMode === "vx") return pt.vx;
    if (xAxisMode === "muLam") return pt.muLam ?? 0;
    return pt.mu;
  };

  // Determine Min & Max bounds
  let xMin = 0;
  let xMax = 0.01;
  let yMin = Infinity;
  let yMax = -Infinity;

  curves.forEach((c) => {
    c.points.forEach((pt) => {
      if (isSweepPointUsable(pt, xAxisMode)) {
        const x = getX(pt);
        if (x > xMax) xMax = x;
        if (pt.val < yMin) yMin = pt.val;
        if (pt.val > yMax) yMax = pt.val;
      }
    });
  });

  if (currentOpPoint && Number.isFinite(currentOpPoint.val)) {
    const opX = getX(currentOpPoint);
    if (opX >= 0) {
      if (currentOpPoint.val < yMin) yMin = currentOpPoint.val;
      if (currentOpPoint.val > yMax) yMax = currentOpPoint.val;
      if (opX > xMax) xMax = opX;
    }
  }

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = 0;
    yMax = 1;
  }

  if (xAxisMode !== "mu") {
    const xnStep = niceStep(xMax / 4);
    xMax = Math.ceil(xMax / xnStep - 0.0001) * xnStep;
  }
  if (xMax <= 1e-12) xMax = 1.0;

  // Nice Y-axis scaling
  const m = Math.max(Math.abs(yMin), Math.abs(yMax));
  let sExp = 0;
  if (m > 0 && m < 0.01) sExp = Math.floor(Math.log10(m));
  if (m >= 100000) sExp = Math.floor(Math.log10(m));
  const yScale = Math.pow(10, sExp);
  let ys0 = yMin / yScale;
  let ys1 = yMax / yScale;
  if (ys1 - ys0 < 1e-9 * Math.max(1, Math.abs(ys1))) {
    const padFlat = Math.max(0.1, Math.abs(ys1) * 0.1);
    ys0 -= padFlat;
    ys1 += padFlat;
  } else {
    const yPad = 0.04 * (ys1 - ys0);
    ys0 -= yPad;
    ys1 += yPad;
  }
  const yStep = niceStep((ys1 - ys0) / 5);
  const yLo = Math.floor(ys0 / yStep) * yStep;
  let yHi = Math.ceil(ys1 / yStep) * yStep;
  if (yHi - yLo < yStep) yHi = yLo + yStep;
  const yTicks = Math.round((yHi - yLo) / yStep);
  const yDec = stepDecimals(yStep) + Math.max(0, Math.min(1, extraPrecision));

  // Layout margins
  const mobilePlot = typeof window !== "undefined" && window.innerWidth < 768;
  const fs = mobilePlot ? 13 : width >= 600 ? 14 : width >= 400 ? 13 : 12;
  const lineH = fs + 6;
  const mLeft = mobilePlot ? 30 : 70;
  const mRight = mobilePlot ? 14 : 20;
  const mTop = mobilePlot ? 44 : Math.round(lineH * 2.3 + 8);
  const legendRows = Math.ceil(curves.length / 2);
  const mBottom = mobilePlot ? 82 : Math.round(lineH * 2.2 + 20 + (curves.length > 1 ? legendRows * lineH + 4 : 0));
  const pWidth = width - mLeft - mRight;
  const pHeight = height - mTop - mBottom;

  if (pWidth <= 10 || pHeight <= 10) {
    ctx.restore();
    return { plotLeft: mLeft, plotWidth: pWidth, xMax };
  }

  // Titles
  ctx.fillStyle = mobilePlot ? textCol : titleCol;
  ctx.font = `bold ${fs}px 'RotorRoboto', Roboto, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let unitPart = "";
  if (sExp !== 0) {
    unitPart = `×10^${sExp}` + (paramMeta.unit !== "–" ? ` ${paramMeta.unit}` : "");
  } else if (paramMeta.unit !== "–") {
    unitPart = paramMeta.unit;
  }
  const yTitle = `${paramMeta.full} ${paramMeta.symbol}${unitPart ? ` [${unitPart}]` : ""}`;
  drawRichCanvasText(ctx, yTitle, mobilePlot ? 8 : 10, mobilePlot ? 20 : 18);

  // Y-Grid & Ticks
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridCol;
  ctx.fillStyle = textCol;
  ctx.font = `${mobilePlot ? fs : fs - 1}px 'RotorRoboto', Roboto, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let k = 0; k <= yTicks; k++) {
    const tv = yLo + k * yStep;
    const gy = mTop + pHeight - ((tv - yLo) / (yHi - yLo)) * pHeight;
    ctx.beginPath();
    ctx.moveTo(mLeft, gy);
    ctx.lineTo(mLeft + pWidth, gy);
    ctx.stroke();

    const label = tv.toFixed(yDec);
    ctx.fillText(label, mLeft - 8, gy);
  }

  // X-Ticks
  const xTarget = width < 400 ? 4 : 5;
  const xStep = niceStep(xMax / xTarget);
  const xDec = stepDecimals(xStep);
  const xTickMax = Math.floor(xMax / xStep + 0.0001);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let k = 0; k <= xTickMax; k++) {
    const xv = k * xStep;
    const gx = mLeft + (xv / xMax) * pWidth;
    ctx.beginPath();
    ctx.moveTo(gx, mTop);
    ctx.lineTo(gx, mTop + pHeight);
    ctx.stroke();

    const tickTxt = xv.toFixed(xDec);
    ctx.fillText(tickTxt, gx, mTop + pHeight + 6);
  }

  // X-Axis Title
  ctx.fillStyle = textCol;
  ctx.font = `bold ${fs}px 'RotorRoboto', Roboto, sans-serif`;
  ctx.textAlign = "center";
  const xTitle =
    xAxisMode === "mu"
      ? mobilePlot ? "Advance Ratio μₓ" : "Advance Ratio μ_x [–]"
      : xAxisMode === "vx"
      ? "Forward Airspeed V_x [m/s]"
      : "Advance-to-Inflow Ratio μ/λ [–]";
  drawRichCanvasText(ctx, xTitle, mLeft + pWidth / 2, mTop + pHeight + (mobilePlot ? 16 : lineH * 1.6));

  // Plot Curves with solid lines
  curves.forEach((c) => {
    ctx.beginPath();
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([]);
    let started = false;

    let previousIndex = -1;
    orderedSweepPoints(c.points, xAxisMode).forEach(({ point: pt, index }) => {
      const x = getX(pt);
      const xPos = mLeft + (x / xMax) * pWidth;
      const yPos = mTop + pHeight - ((pt.val / yScale - yLo) / (yHi - yLo)) * pHeight;

      if (!started || (xAxisMode !== "muLam" && index - previousIndex !== 1)) {
        ctx.moveTo(xPos, yPos);
        started = true;
      } else {
        ctx.lineTo(xPos, yPos);
      }
      previousIndex = index;
    });
    ctx.stroke();
  });

  // Active Operating Point Marker
  if (currentOpPoint) {
    const opX = getX(currentOpPoint);
    if (opX >= 0 && opX <= xMax) {
      const cx = mLeft + (opX / xMax) * pWidth;
      const cy = mTop + pHeight - ((currentOpPoint.val / yScale - yLo) / (yHi - yLo)) * pHeight;

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = currentMarkerCol;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.strokeStyle = currentMarkerCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Crosshair Cursor Inspection (crossX or hoverCoord)
  const activeInspectionX =
    crossX >= 0
      ? crossX
      : hoverCoord && hoverCoord.x >= mLeft && hoverCoord.x <= mLeft + pWidth
      ? ((hoverCoord.x - mLeft) / pWidth) * xMax
      : -1;

  if (activeInspectionX >= 0 && activeInspectionX <= xMax) {
    const cx = mLeft + (activeInspectionX / xMax) * pWidth;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.2;
    ctx.moveTo(cx, mTop);
    ctx.lineTo(cx, mTop + pHeight);
    ctx.stroke();
    ctx.restore();

    curves.forEach((c) => {
      let bestPt: SweepPointData | null = null;
      let bestDist = Infinity;
      c.points.forEach((pt) => {
        if (!isSweepPointUsable(pt, xAxisMode)) return;
        const x = getX(pt);
        const d = Math.abs(x - activeInspectionX);
        if (d < bestDist) {
          bestDist = d;
          bestPt = pt;
        }
      });
      if (bestPt) {
        const nx = mLeft + (getX(bestPt) / xMax) * pWidth;
        const ny = mTop + pHeight - (((bestPt as SweepPointData).val / yScale - yLo) / (yHi - yLo)) * pHeight;

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = bgCol;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();

        const vTxt = formatSig((bestPt as SweepPointData).val / yScale, paramMeta.digits + extraPrecision);
        ctx.font = `bold ${fs - 2}px 'RotorRoboto', Roboto, sans-serif`;
        const vw = ctx.measureText(vTxt).width;
        let vx = nx + 9;
        let align: CanvasTextAlign = "left";
        if (vx + vw > mLeft + pWidth) {
          vx = nx - 9;
          align = "right";
        }
        ctx.textAlign = align;
        const vy = Math.max(mTop + fs, Math.min(mTop + pHeight - 4, ny - 6));
        ctx.fillStyle = bgCol;
        ctx.fillText(vTxt, vx + 1, vy + 1);
        ctx.fillStyle = c.color;
        ctx.fillText(vTxt, vx, vy);
      }
    });
  }

  // Legend Below Plot
  if (curves.length > 1) {
    const legendLeft = mobilePlot ? 8 : mLeft;
    ctx.font = `bold ${fs - 1}px 'RotorRoboto', Roboto, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const itemWidths: number[] = [];
    const itemLabels: string[] = [];
    let totalItemsW = 0;
    curves.forEach((c) => {
      const label = mobilePlot ? c.label.replace("Coleman-Feingold", "Coleman-FG") : c.label;
      itemLabels.push(label);
      const w = (mobilePlot ? 18 : 24) + ctx.measureText(label).width + (mobilePlot ? 10 : 16);
      itemWidths.push(w);
      totalItemsW += w;
    });

    const availW = width - mRight - legendLeft;
    const fitsOneLine = totalItemsW <= availW;
    const maxOnRow0 = Math.ceil(curves.length / 2);

    let curX = legendLeft;
    let curRow = 0;
    let countOnRow0 = 0;
    let curY = mTop + pHeight + (mobilePlot ? 46 : Math.round(lineH * 2.2 + 20));
    const rowStep = mobilePlot ? 18 : lineH + 2;

    curves.forEach((c, idx) => {
      const label = itemLabels[idx];
      const itemW = itemWidths[idx];

      if (
        (!fitsOneLine && curRow === 0 && countOnRow0 >= maxOnRow0) ||
        (curX > legendLeft && curX + itemW > width - mRight)
      ) {
        curRow++;
        curX = legendLeft;
        curY += rowStep;
      }

      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX + 18, curY);
      ctx.stroke();

      ctx.fillStyle = c.color;
      ctx.fillText(label, curX + (mobilePlot ? 22 : 26), curY);

      curX += itemW;
      if (curRow === 0) countOnRow0++;
    });
  }

  ctx.restore();
  return { plotLeft: mLeft, plotWidth: pWidth, xMax };
}

export function getSweepReadoutText(
  curves: SweepCurve[],
  paramMeta: SweepParamMeta,
  xAxisMode: "mu" | "vx" | "muLam",
  crossX: number,
  extraPrecision = 0
): string {
  if (crossX < 0 || curves.length === 0) {
    return "Tap or drag on the plot to read the curve values.";
  }
  const xSym = xAxisMode === "mu" ? "μ_x" : xAxisMode === "vx" ? "V_x" : "μ/λ";
  const xUnit = xAxisMode === "vx" ? " m/s" : "";
  const xDig = xAxisMode === "vx" ? 1 : xAxisMode === "muLam" ? 2 : 3;
  const xValStr = formatSig(crossX, xDig + 1);
  const pUnit = paramMeta.unit !== "–" ? ` ${paramMeta.unit}` : "";

  const lines = [`${xSym} = ${xValStr}${xUnit}`];
  curves.forEach((c) => {
    let bestPt: SweepPointData | null = null;
    let bestDist = Infinity;
    c.points.forEach((pt) => {
      if (!isSweepPointUsable(pt, xAxisMode)) return;
      const x = sweepPointX(pt, xAxisMode);
      const d = Math.abs(x - crossX);
      if (d < bestDist) {
        bestDist = d;
        bestPt = pt;
      }
    });
    if (bestPt) {
      const vStr = formatSig((bestPt as SweepPointData).val, paramMeta.digits + extraPrecision);
      lines.push(`${c.label}: ${vStr}${pUnit}`);
    } else {
      lines.push(`${c.label}: –`);
    }
  });
  return lines.join("\n");
}


export function generateFullSweepCSV(
  geom: RotorGeometry,
  cond: FlightCondition,
  curves: SweepCurve[],
  xAxisMode: "mu" | "vx" | "muLam",
  trimMode: SweepTrimModeKey,
  extraPrecision = 0
): string {
  const baseRes = calculate(geom, cond);
  const strategy = SWEEP_TRIM_MODES.find((m) => m.key === trimMode)?.label || "No Trim";
  const lines = [
    `# RotorCalculator Full Engineering Sweep Export`,
    `# Generated: ${new Date().toISOString()}`,
    `#`,
    `# --- INPUT ROTOR GEOMETRY ---`,
    `# Rotor Name: ${geom.name}`,
    `# Radius R [m]: ${geom.radius.toFixed(3)}`,
    `# Blade Count Nb: ${geom.nBlades}`,
    `# Root Cutout (r/R): ${geom.rootCutout.toFixed(3)}`,
    `# Root Chord c0 [m]: ${geom.chordRoot.toFixed(3)}`,
    `# Tip Chord c_tip [m]: ${geom.chordTip.toFixed(3)}`,
    `# Reference Solidity sigma_REF: ${geom.sigmaRef.toFixed(4)}`,
    `# Aspect Ratio: ${referenceAspectRatio(geom).toFixed(2)}`,
    `# Linear Twist Root [deg]: ${((geom.thetaRoot * 180) / Math.PI).toFixed(2)}`,
    `# Linear Twist Tip [deg]: ${((geom.thetaTip * 180) / Math.PI).toFixed(2)}`,
    `# Lift Curve Slope a0 [1/rad]: ${geom.liftSlope0.toFixed(2)}`,
    `# Profile Drag Cd0: ${geom.cd0.toFixed(4)}`,
    `# Tip Loss Mode: ${geom.tipLossMode}`,
    `# Tip Loss Factor B: ${geom.tipLossB.toFixed(3)}`,
    `# Compressibility Correction: ${geom.usePrandtlGlauert ? "On" : "Off"}`,
    `# Nominal RPM: ${geom.nominalRpm?.toFixed(1) ?? geom.rpm.toFixed(1)}`,
    `#`,
    `# --- INPUT FLIGHT CONDITIONS & ISA ATMOSPHERE ---`,
    `# Altitude [m]: ${cond.altitudeM.toFixed(1)}`,
    `# Temperature [degC]: ${cond.temperatureC.toFixed(1)}`,
    `# Air Density rho [kg/m3]: ${cond.rho.toFixed(4)}`,
    `# Speed of Sound a [m/s]: ${cond.speedOfSound.toFixed(2)}`,
    `# Inflow Model: ${cond.inflowModel}`,
    `# Induced Power Factor kappa: ${cond.kInd.toFixed(2)}`,
    `# Operating Pair: ${cond.operatingPair}`,
    `# Sweep Trim Mode: ${strategy}`,
    `#`,
    `# --- BASELINE OPERATING RESULTS ---`,
  ];

  if (baseRes.solutionValid) {
    lines.push(
      `# Base Thrust T [N]: ${baseRes.thrustN.toFixed(2)}`,
      `# Base Torque Q [N.m]: ${baseRes.torqueNm.toFixed(2)}`,
      `# Base Total Power P [kW]: ${(baseRes.powerShaftW / 1000).toFixed(3)}`,
      `# Base CT: ${baseRes.CT.toFixed(6)}`,
      `# Base CQ: ${baseRes.CQ.toFixed(6)}`,
      `# Base CP: ${baseRes.CQ.toFixed(6)}`,
      `# Base FoM: ${baseRes.FoM.toFixed(4)}`,
      `# Base Tip Mach Adv: ${baseRes.advancingTipMach.toFixed(3)}`,
      `# Base Tip Mach Ret: ${(((1 - baseRes.operatingMu) * baseRes.tipSpeed) / Math.max(1, baseRes.speedOfSound)).toFixed(3)}`
    );
  } else {
    lines.push(`# Base Solution: Invalid / Out of Envelope`);
  }

  lines.push(
    `#`,
    `# --- SWEEP DATASET (ALL VARIABLES) ---`,
    `Curve,mu,Vx_ms,muZ,Vz_ms,RPM,Collective_deg,Thrust_N,Torque_Nm,Power_kW,Power_Induced_kW,Power_Profile_kW,Power_Parasite_kW,CT,CQ,CP,CH,FoM,Mach_tip_adv,Mach_tip_ret,Lambda_i,Valid`
  );

  for (const curve of curves) {
    for (const p of curve.points) {
      const row = [
        `"${curve.label.replace(/"/g, '""')}"`,
        p.mu.toFixed(3),
        p.vx.toFixed(2),
        (p.muZ ?? 0).toFixed(4),
        (p.vz ?? 0).toFixed(2),
        p.rpm.toFixed(1),
        p.collectiveDeg.toFixed(2),
        p.thrustN.toFixed(2),
        (p.torqueNm ?? 0).toFixed(2),
        (p.powerKW ?? 0).toFixed(3),
        (p.piKW ?? 0).toFixed(3),
        (p.p0KW ?? 0).toFixed(3),
        (p.pparKW ?? 0).toFixed(3),
        p.ct.toFixed(6),
        (p.cq ?? 0).toFixed(6),
        (p.cp ?? 0).toFixed(6),
        (p.ch ?? 0).toFixed(6),
        (p.fom ?? 0).toFixed(4),
        (p.machAdv ?? 0).toFixed(3),
        (p.machRet ?? 0).toFixed(3),
        (p.lambdaI ?? 0).toFixed(5),
        p.valid ? "1" : "0",
      ];
      lines.push(row.join(","));
    }
  }

  return lines.join("\r\n");
}
