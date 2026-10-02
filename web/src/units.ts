/**
 * Engineering Unit Conversion & Formatting System for RotorCalculator
 */

export type UnitCategory =
  | "length"
  | "speed"
  | "force"
  | "power"
  | "torque"
  | "angle"
  | "pressure"
  | "density"
  | "liftSlope"
  | "none";

export interface UnitConversion {
  fromSI: (val: number) => number;
  toSI: (val: number) => number;
}

export const UNIT_TABLE: Record<string, UnitConversion> = {
  // Length (base: m)
  m: { fromSI: (v) => v, toSI: (v) => v },
  ft: { fromSI: (v) => v * 3.2808399, toSI: (v) => v / 3.2808399 },
  in: { fromSI: (v) => v * 39.3700787, toSI: (v) => v / 39.3700787 },
  cm: { fromSI: (v) => v * 100, toSI: (v) => v / 100 },
  "m²": { fromSI: (v) => v, toSI: (v) => v },
  "ft²": { fromSI: (v) => v / 0.3048 ** 2, toSI: (v) => v * 0.3048 ** 2 },
  "in²": { fromSI: (v) => v / 0.0254 ** 2, toSI: (v) => v * 0.0254 ** 2 },
  "cm²": { fromSI: (v) => v * 10000, toSI: (v) => v / 10000 },
  "rad/s": { fromSI: (v) => v * Math.PI / 30, toSI: (v) => v * 30 / Math.PI },
  mm: { fromSI: (v) => v * 1000.0, toSI: (v) => v / 1000.0 },
  km: { fromSI: (v) => v / 1000.0, toSI: (v) => v * 1000.0 },

  // Speed (base: m/s)
  "m/s": { fromSI: (v) => v, toSI: (v) => v },
  kt: { fromSI: (v) => v * 1.94384449, toSI: (v) => v / 1.94384449 },
  "km/h": { fromSI: (v) => v * 3.6, toSI: (v) => v / 3.6 },
  "ft/s": { fromSI: (v) => v * 3.2808399, toSI: (v) => v / 3.2808399 },
  "ft/min": { fromSI: (v) => v * 196.850394, toSI: (v) => v / 196.850394 },
  mph: { fromSI: (v) => v * 2.23693629, toSI: (v) => v / 2.23693629 },

  // Force (base: N)
  N: { fromSI: (v) => v, toSI: (v) => v },
  lbf: { fromSI: (v) => v * 0.224808943, toSI: (v) => v / 0.224808943 },
  kgf: { fromSI: (v) => v / 9.80665, toSI: (v) => v * 9.80665 },
  kN: { fromSI: (v) => v / 1000.0, toSI: (v) => v * 1000.0 },

  // Power (base: W)
  W: { fromSI: (v) => v, toSI: (v) => v },
  kW: { fromSI: (v) => v / 1000.0, toSI: (v) => v * 1000.0 },
  hp: { fromSI: (v) => v / 745.699872, toSI: (v) => v * 745.699872 },

  // Torque (base: N·m)
  "N·m": { fromSI: (v) => v, toSI: (v) => v },
  "lb·ft": { fromSI: (v) => v * 0.737562149, toSI: (v) => v / 0.737562149 },
  "kgf·m": { fromSI: (v) => v / 9.80665, toSI: (v) => v * 9.80665 },

  // Angle (base: deg or rad)
  deg: { fromSI: (v) => v, toSI: (v) => v },
  rad: { fromSI: (v) => (v * Math.PI) / 180.0, toSI: (v) => (v * 180.0) / Math.PI },

  // Lift slope (base: rad⁻¹)
  "rad⁻¹": { fromSI: (v) => v, toSI: (v) => v },
  "deg⁻¹": { fromSI: (v) => (v * Math.PI) / 180.0, toSI: (v) => (v * 180.0) / Math.PI },

  // Pressure (base: Pa)
  Pa: { fromSI: (v) => v, toSI: (v) => v },
  hPa: { fromSI: (v) => v / 100.0, toSI: (v) => v * 100.0 },
  mbar: { fromSI: (v) => v / 100.0, toSI: (v) => v * 100.0 },
  psi: { fromSI: (v) => v * 0.0001450377, toSI: (v) => v / 0.0001450377 },
  atm: { fromSI: (v) => v / 101325.0, toSI: (v) => v * 101325.0 },
  mmHg: { fromSI: (v) => v * 0.0075006168, toSI: (v) => v / 0.0075006168 },

  // Temperature (base: °C)
  "°C": { fromSI: (v) => v, toSI: (v) => v },
  "°F": { fromSI: (v) => v * 1.8 + 32.0, toSI: (v) => (v - 32.0) / 1.8 },
  K: { fromSI: (v) => v + 273.15, toSI: (v) => v - 273.15 },

  // Density (base: kg/m³)
  "kg/m³": { fromSI: (v) => v, toSI: (v) => v },
  "slug/ft³": { fromSI: (v) => v * 0.00194032, toSI: (v) => v / 0.00194032 },
  "lb/ft³": { fromSI: (v) => v * 0.06242796, toSI: (v) => v / 0.06242796 },

  // Non-dimensional
  "–": { fromSI: (v) => v, toSI: (v) => v },
  "[-]": { fromSI: (v) => v, toSI: (v) => v },
  "r/R": { fromSI: (v) => v, toSI: (v) => v },
  rpm: { fromSI: (v) => v, toSI: (v) => v },
  "—": { fromSI: (v) => v, toSI: (v) => v },
};

export const UNIT_CHOICES: Record<string, string[]> = {
  Radius: ["m", "ft", "in"],
  "Root Chord": ["m", "ft", "in", "mm"],
  "Tip Chord": ["m", "ft", "in", "mm"],
  "Lift Slope": ["rad⁻¹", "deg⁻¹"],
  Altitude: ["m", "ft", "km"],
  Temperature: ["°C", "°F", "K"],
  "Horizontal Flow": ["–", "m/s", "kt", "km/h", "mph"],
  "Axial Flow": ["deg", "m/s", "ft/min", "–"],
  RPM: ["rpm", "rad/s"],
  "Target Thrust": ["N", "kN", "lbf", "kgf"],
  "Target CT": ["–"],
  Thrust: ["N", "kN", "lbf", "kgf"],
  Power: ["kW", "hp", "W"],
  Torque: ["N·m", "lb·ft", "kgf·m"],
  Speed: ["m/s", "kt", "km/h", "ft/s"],
  Pressure: ["hPa", "Pa", "mbar", "psi", "atm", "mmHg"],
  Density: ["kg/m³", "slug/ft³", "lb/ft³"],
};

export function convertValue(val: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit || !UNIT_TABLE[fromUnit] || !UNIT_TABLE[toUnit]) return val;
  const siVal = UNIT_TABLE[fromUnit].toSI(val);
  return UNIT_TABLE[toUnit].fromSI(siVal);
}

export function formatSig(value: number, sig: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > 1.0e15) return "–";
  const a = Math.abs(value);
  if (a < 1.0e-12) return "0";
  const mag = Math.floor(Math.log10(a));
  let dec = Math.max(0, Math.min(9, sig - 1 - mag));
  const scale = Math.pow(10, dec);
  const rounded = Math.round(a * scale) / scale;
  if (rounded === 0) return "0";
  const mag2 = Math.floor(Math.log10(rounded));
  if (mag2 > mag) dec = Math.max(0, Math.min(9, sig - 1 - mag2));
  const s = rounded.toFixed(dec);
  let ip = s;
  let fp = "";
  const dot = s.indexOf(".");
  if (dot >= 0) {
    ip = s.substring(0, dot);
    fp = s.substring(dot);
  }
  if (ip.length >= 5) {
    let spaced = "";
    for (let j = 0; j < ip.length; j++) {
      if (j > 0 && (ip.length - j) % 3 === 0) spaced += "\u00A0";
      spaced += ip[j];
    }
    ip = spaced;
  }
  if (value < 0) ip = "-" + ip;
  return ip + fp;
}

export function formatResultValue(val: number, decimals: number, extraPrecision = 0): string {
  if (!Number.isFinite(val)) return "–";
  if (Math.abs(val) < 1e-9 || Object.is(val, -0)) val = 0;
  const effectiveDecimals = decimals + extraPrecision;
  return val.toLocaleString("en-US", {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
    useGrouping: true,
  });
}

/** Android Main.FormatKey presentation, without locale-dependent input widgets. */
export function formatInputValue(key: string, value: number, unit = ""): string {
  if (!Number.isFinite(value)) return "";
  let digits: number;
  if (key === "Nb") digits = 0;
  else if (["x0", "taper", "B", "kind"].includes(key)) digits = 3;
  else if (["sigmaRef", "sigmaAct", "sigmaT", "Cd0", "mu", "muz"].includes(key)) digits = 4;
  else if (["AR", "a0", "T0"].includes(key)) digits = 2;
  else if (key === "CTtgt") digits = 5;
  else if (["rpm", "rpmNom", "Ttgt"].includes(key)) digits = 1;
  else if (["thRoot", "thTip", "thTwist", "coll", "alpha"].includes(key)) digits = unit === "rad" ? 4 : 2;
  else digits = Math.abs(value) >= 100 ? 1 : Math.abs(value) >= 10 ? 2 : Math.abs(value) >= 1 ? 3 : 4;
  let minimum = digits;
  if (["R", "c0", "c1", "h", "T0", "A", "Ab", "Aact", "Vx", "Vz"].includes(key)) minimum = Math.min(2, digits);
  if (["thRoot", "thTip", "thTwist", "coll", "alpha"].includes(key)) minimum = Math.min(1, digits);
  if (["rpm", "rpmNom", "Ttgt"].includes(key)) minimum = 0;
  if (Math.abs(value) < 0.5 / 10 ** digits) value = 0;
  let result = value.toFixed(digits);
  while (result.includes(".") && result.endsWith("0") && result.length - result.indexOf(".") - 1 > minimum) result = result.slice(0, -1);
  return result.endsWith(".") ? result.slice(0, -1) : result;
}
