/**
 * zBET Pure Aerodynamic Engine for RotorCalculator (TypeScript)
 * Analytical and numerical Blade Element Theory (BET) + Momentum Theory solver.
 * References: Wayne Johnson (Rotorcraft Aeromechanics), Gordon Leishman (Principles of Helicopter Aerodynamics).
 */

export interface RotorGeometry {
  name: string;
  rpm: number;
  radius: number;
  liftSlope0: number; // [1/rad]
  rootCutout: number; // r0/R [0, 1)
  cd0: number; // 2D profile drag coefficient [-]
  solidityMode: "chords" | "sigma_geom" | "sigma_ref";
  sigmaRef: number;
  sigmaGeom: number;
  sigmaThrust: number;
  nBlades: number;
  chordRoot: number; // [m]
  chordTip: number; // [m]
  pitchMode: "constant" | "linear_twist";
  theta0: number; // collective pitch [rad]
  thetaRoot: number; // [rad]
  thetaTip: number; // [rad]
  tipLossMode: "none" | "fixed" | "sissingh";
  tipLossB: number; // tip-loss factor B [-]
  usePrandtlGlauert: boolean;
  nominalRpm?: number;
}

export interface FlightCondition {
  altitudeM: number;
  temperatureC: number;
  pressurePa: number;
  rho: number;
  speedOfSound: number;
  horizontalMode: "mu" | "vx";
  horizontalValue: number;
  axialMode: "alpha" | "vz" | "muz";
  axialValue: number;
  mu: number;
  muZ: number;
  inflowModel: "uniform" | "coleman_simple" | "coleman_feingold" | "drees";
  profileDragModel: "numerical_vectorial" | "analytical_vectorial" | "analytical_tangential";
  inducedTorqueModel: "energy_balance" | "analytical_bet";
  operatingPair:
    | "rpm_collective"
    | "rpm_ct"
    | "rpm_thrust"
    | "collective_ct"
    | "collective_thrust"
    | "ct_thrust";
  rpm: number;
  collectiveDeg: number;
  targetThrustN: number;
  targetCT: number;
  kInd: number;
  fxColeman: number;
  fyColeman: number;
}

export interface RotorResults {
  CT: number;
  CQ: number;
  CQi: number;
  CQ0: number;
  CH: number;
  CHi: number;
  CH0: number;
  CY: number;
  CMx: number;
  CMy: number;
  CPair: number;
  inflowLambda: number;
  inflowLambdaI: number;
  L_D_eff: number;
  FoM: number;
  thrustN: number;
  thrustKgf: number;
  thrustLbf: number;
  powerShaftW: number;
  powerShaftKW: number;
  powerShaftHP: number;
  torqueNm: number;
  torqueLbft: number;
  dragHN: number;
  sideForceYN: number;
  sideForceYLbf: number;
  rollMomentNm: number;
  rollMomentLbft: number;
  pitchMomentNm: number;
  pitchMomentLbft: number;
  tipSpeed: number;
  advancingTipMach: number;
  inflowKx: number;
  inflowKy: number;
  wakeSkewChiDeg: number;
  bFactor: number;
  effectiveLiftSlope: number;
  trimmedRPM: number;
  trimmedCollectiveDeg: number;
  trimmedTheta0Deg: number;
  operatingMu: number;
  operatingMuZ: number;
  operatingVx: number;
  operatingVz: number;
  operatingAlphaDeg: number;
  altitudeM: number;
  temperatureC: number;
  densityRho: number;
  pressurePa: number;
  speedOfSound: number;
  solutionValid: boolean;
  compressibilityWarning: boolean;
  compressibilityInvalid?: boolean;
  statusMessage: string;
  powerInducedKW: number;
  powerProfileKW: number;
  diskLoadingN_m2: number;
  powerLoadingN_kW: number;
  inducedVelocityM_s: number;
  CTs: number;
  aoaAdv25: number;
  aoaRet25: number;
  phiAdv25: number;
  phiRet25: number;
  aoaAdv50: number;
  aoaRet50: number;
  phiAdv50: number;
  phiRet50: number;
  aoaAdv75: number;
  aoaRet75: number;
  phiAdv75: number;
  phiRet75: number;
  aoaAdvTip: number;
  aoaRetTip: number;
  phiAdvTip: number;
  phiRetTip: number;
}

// 16-point and 24-point Gauss-Legendre quadrature nodes and weights
const GL_X16 = [
  -0.98940093499165, -0.94457502307323, -0.86563120238783, -0.755404408355,
  -0.61787624440264, -0.45801677765723, -0.28160355077926, -0.09501250983764,
   0.09501250983764,  0.28160355077926,  0.45801677765723,  0.61787624440264,
   0.755404408355,   0.86563120238783,  0.94457502307323,  0.98940093499165,
];

const GL_W16 = [
  0.02715245941175, 0.06225352393865, 0.09515851168249, 0.12462897125553,
  0.14959598881658, 0.169156519395,   0.18260341504492, 0.18945061045507,
  0.18945061045507, 0.18260341504492, 0.169156519395,   0.14959598881658,
  0.12462897125553, 0.09515851168249, 0.06225352393865, 0.02715245941175,
];

const GL_X24 = [
  -0.99518722, -0.974728556, -0.938274552, -0.886415527, -0.820001986, -0.7401241916,
  -0.6480936519, -0.5454214714, -0.4337935076, -0.3150426797, -0.1911188675, -0.0640568929,
   0.0640568929,  0.1911188675,  0.3150426797,  0.4337935076,  0.5454214714,  0.6480936519,
   0.7401241916,  0.820001986,   0.886415527,   0.938274552,   0.974728556,   0.99518722,
];

const GL_W24 = [
  0.0123412298, 0.0285313886, 0.0442774388, 0.0592985849, 0.0733464814, 0.0861901615,
  0.0976186521, 0.1074442701, 0.1155056681, 0.1216704729, 0.1258374563, 0.1279381953,
  0.1279381953, 0.1258374563, 0.1216704729, 0.1155056681, 0.1074442701, 0.0976186521,
  0.0861901615, 0.0733464814, 0.0592985849, 0.0442774388, 0.0285313886, 0.0123412298,
];

export function cloneGeometry(g: RotorGeometry): RotorGeometry {
  return { ...g, nominalRpm: g.nominalRpm ?? g.rpm };
}

export function cloneCondition(c: FlightCondition): FlightCondition {
  return { ...c };
}

export function createDefaultGeometry(): RotorGeometry {
  return resolveSolidity({
    name: "Sikorsky UH-60 Black Hawk",
    rpm: 258.0,
    nominalRpm: 258.0,
    radius: 8.18,
    liftSlope0: 5.73,
    rootCutout: 0.15,
    cd0: 0.0088,
    solidityMode: "chords",
    sigmaRef: 0.0825,
    sigmaGeom: 0.07,
    sigmaThrust: 0.075,
    nBlades: 4,
    chordRoot: 0.53,
    chordTip: 0.53,
    pitchMode: "linear_twist",
    theta0: 0.0,
    thetaRoot: (14.0 * Math.PI) / 180.0,
    thetaTip: (-4.0 * Math.PI) / 180.0,
    tipLossMode: "sissingh",
    tipLossB: 0.97,
    usePrandtlGlauert: true,
  });
}

export function createDefaultCondition(): FlightCondition {
  const c: FlightCondition = {
    altitudeM: 0.0,
    temperatureC: 15.0,
    pressurePa: 101325.0,
    rho: 1.225,
    speedOfSound: 340.3,
    horizontalMode: "mu",
    horizontalValue: 0.0,
    axialMode: "alpha",
    axialValue: 0.0,
    mu: 0.0,
    muZ: 0.0,
    inflowModel: "coleman_feingold",
    profileDragModel: "numerical_vectorial",
    inducedTorqueModel: "energy_balance",
    operatingPair: "rpm_ct",
    rpm: 258.0,
    collectiveDeg: 0.0,
    targetThrustN: 70000.0,
    targetCT: 0.0065,
    kInd: 1.15,
    fxColeman: 1.0,
    fyColeman: 1.0,
  };
  return updateAtmosphere(c, 0.0, 15.0);
}

export function updateAtmosphere(cond: FlightCondition, altM: number, tempC: number): FlightCondition {
  // Match the shipped Android atmosphere adapter (Main.UpdateAtmosphere).
  // This retains its rounded tropospheric constants and supported input range.
  const h = Math.max(-500, Math.min(11000, altM));
  const temperatureC = Math.max(-80, Math.min(60, tempC));
  const c = { ...cond, altitudeM: h, temperatureC };
  const lapse = 0.0065;
  const t0 = 288.15;
  const p0 = 101325.0;
  const rGas = 287.058;
  const gamma = 1.4;

  const p = p0 * Math.pow(Math.max(0.05, 1.0 - (lapse * h) / t0), 5.2561);
  const tKelvin = temperatureC + 273.15;
  const rho = p / (rGas * tKelvin);
  const a = Math.sqrt(gamma * rGas * tKelvin);

  c.pressurePa = p;
  c.rho = rho;
  c.speedOfSound = a;
  return c;
}

export function resolveSolidity(geom: RotorGeometry): RotorGeometry {
  const g = { ...geom };
  g.radius = Math.max(0.02, Math.min(50.0, g.radius));
  g.rpm = Math.max(1.0, Math.min(30000.0, g.rpm));
  if (!g.nominalRpm || g.nominalRpm <= 0) g.nominalRpm = g.rpm;
  g.nominalRpm = Math.max(1.0, Math.min(30000.0, g.nominalRpm));
  g.nBlades = Math.max(1, Math.min(16, Math.floor(g.nBlades)));
  g.rootCutout = Math.max(0.0, Math.min(0.95, g.rootCutout));
  g.chordRoot = Math.max(0.0001, Math.min(2.0 * g.radius, g.chordRoot));
  g.chordTip = Math.max(0.0001, Math.min(2.0 * g.radius, g.chordTip));
  g.liftSlope0 = Math.max(0.1, Math.min(10.0, g.liftSlope0));
  g.cd0 = Math.max(0.0, Math.min(0.5, g.cd0));

  if (g.tipLossB <= g.rootCutout || g.tipLossB > 1.0) g.tipLossB = 0.97;
  if (g.tipLossB <= g.rootCutout) g.tipLossB = Math.min(1.0, g.rootCutout + 0.01);

  const x0 = g.rootCutout;
  const nb = g.nBlades;
  const rad = g.radius;

  if (g.solidityMode === "chords") {
    const s0 = (nb * g.chordRoot) / (Math.PI * rad);
    const s1 = (nb * (g.chordTip - g.chordRoot)) / (Math.PI * rad);
    g.sigmaRef = s0 + 0.5 * s1;
    g.sigmaGeom = s0 * (1.0 - x0) + 0.5 * s1 * (1.0 - x0 * x0);
    g.sigmaThrust = 3.0 * ((s0 * (1.0 - Math.pow(x0, 3))) / 3.0 + (s1 * (1.0 - Math.pow(x0, 4))) / 4.0);
  } else if (g.solidityMode === "sigma_geom") {
    g.sigmaRef = g.sigmaGeom / (1.0 - x0);
    g.sigmaThrust = (1.0 - Math.pow(x0, 3)) * g.sigmaRef;
    g.chordRoot = (g.sigmaRef * Math.PI * rad) / nb;
    g.chordTip = g.chordRoot;
  } else {
    g.sigmaGeom = (1.0 - x0) * g.sigmaRef;
    g.sigmaThrust = (1.0 - Math.pow(x0, 3)) * g.sigmaRef;
    g.chordRoot = (g.sigmaRef * Math.PI * rad) / nb;
    g.chordTip = g.chordRoot;
  }
  return g;
}

export function referenceBladeArea(geom: RotorGeometry): number {
  return (geom.radius * (geom.chordRoot + geom.chordTip)) / 2.0;
}

export function activeBladeArea(geom: RotorGeometry): number {
  const x0 = geom.rootCutout;
  const c0 = geom.chordRoot;
  const c1 = geom.chordTip;
  const integral = c0 * (1.0 - x0) + 0.5 * (c1 - c0) * (1.0 - x0 * x0);
  return geom.radius * integral;
}

export function referenceAspectRatio(geom: RotorGeometry): number {
  const area = referenceBladeArea(geom);
  if (area <= 1.0e-12) return 0.0;
  return (geom.radius * geom.radius) / area;
}

export function taperRatio(geom: RotorGeometry): number {
  if (Math.abs(geom.chordRoot) < 1.0e-12) return 0.0;
  return geom.chordTip / geom.chordRoot;
}

export function scaleRadiusPreserveReference(geom: RotorGeometry, newRadius: number): RotorGeometry {
  const g = cloneGeometry(geom);
  const oldRadius = Math.max(0.02, g.radius);
  newRadius = Math.max(0.02, Math.min(50.0, newRadius));
  const scale = newRadius / oldRadius;
  g.radius = newRadius;
  g.chordRoot = g.chordRoot * scale;
  g.chordTip = g.chordTip * scale;
  g.solidityMode = "chords";
  return resolveSolidity(g);
}

export function scaleChordsToSigmaRef(geom: RotorGeometry, targetSigma: number): RotorGeometry {
  const g = resolveSolidity(cloneGeometry(geom));
  targetSigma = Math.max(1.0e-5, Math.min(1.0, targetSigma));
  if (g.sigmaRef <= 1.0e-12) return g;
  const scale = targetSigma / g.sigmaRef;
  g.chordRoot = g.chordRoot * scale;
  g.chordTip = g.chordTip * scale;
  g.solidityMode = "chords";
  return resolveSolidity(g);
}

export function scaleChordsToAspectRatio(geom: RotorGeometry, targetAR: number): RotorGeometry {
  const g = resolveSolidity(cloneGeometry(geom));
  targetAR = Math.max(0.1, Math.min(1000.0, targetAR));
  const currentAR = referenceAspectRatio(g);
  if (currentAR <= 1.0e-12) return g;
  const scale = currentAR / targetAR;
  g.chordRoot = g.chordRoot * scale;
  g.chordTip = g.chordTip * scale;
  g.solidityMode = "chords";
  return resolveSolidity(g);
}

/**
 * Fully coupled planform editing (reference planform c(x)=c0+(c1-c0)x)
 * Keys (SI, rad): R, Nb, x0, c0, c1, taper, sigmaRef, sigmaAct, sigmaT, AR, A, Ab, Aact,
 * thRoot, thTip, thTwist, th75
 */
export function getGeometryQuantity(geom: RotorGeometry, key: string): number {
  const g = resolveSolidity(cloneGeometry(geom));
  switch (key) {
    case "R":
      return g.radius;
    case "Nb":
      return g.nBlades;
    case "x0":
      return g.rootCutout;
    case "c0":
      return g.chordRoot;
    case "c1":
      return g.chordTip;
    case "taper":
      return taperRatio(g);
    case "sigmaRef":
      return g.sigmaRef;
    case "sigmaAct":
      return g.sigmaGeom;
    case "sigmaT":
      return g.sigmaThrust;
    case "AR":
      return referenceAspectRatio(g);
    case "A":
      return Math.PI * g.radius * g.radius;
    case "Ab":
      return referenceBladeArea(g);
    case "Aact":
      return activeBladeArea(g);
    case "thRoot":
      return g.thetaRoot;
    case "thTip":
      return g.thetaTip;
    case "thTwist":
      return g.thetaTip - g.thetaRoot;
    case "th75":
      return g.thetaRoot + (g.thetaTip - g.thetaRoot) * 0.75;
    default:
      return 0.0;
  }
}

/**
 * Returns a clamped, solidity-resolved CLONE; the caller's geometry is never mutated.
 */
export function setGeometryQuantity(geom: RotorGeometry, key: string, value: number): RotorGeometry {
  const g = resolveSolidity(cloneGeometry(geom));
  g.solidityMode = "chords";
  let cur = 0.0;
  let scale = 1.0;
  let mean = 0.0;
  switch (key) {
    case "R":
    case "A": {
      const newR = key === "A" ? Math.sqrt(Math.max(0.0, value) / Math.PI) : value;
      return scaleRadiusPreserveReference(g, newR);
    }
    case "Nb":
      g.nBlades = Math.max(1, Math.min(16, Math.round(value)));
      break;
    case "x0":
      g.rootCutout = Math.max(0.0, Math.min(0.95, value));
      break;
    case "c0":
      g.chordRoot = value;
      break;
    case "c1":
      g.chordTip = value;
      break;
    case "taper": {
      const t = Math.max(0.01, Math.min(10.0, value));
      const cm = 0.5 * (g.chordRoot + g.chordTip);
      g.chordRoot = (2.0 * cm) / (1.0 + t);
      g.chordTip = t * g.chordRoot;
      break;
    }
    case "sigmaRef":
    case "sigmaAct":
    case "sigmaT":
    case "AR":
    case "Ab":
    case "Aact": {
      cur = getGeometryQuantity(g, key);
      if (cur <= 1.0e-12 || value <= 0.0) return g;
      scale = key === "AR" ? cur / value : value / cur;
      g.chordRoot = g.chordRoot * scale;
      g.chordTip = g.chordTip * scale;
      break;
    }
    case "thRoot":
      g.thetaRoot = value;
      break;
    case "thTip":
      g.thetaTip = value;
      break;
    case "thTwist": {
      mean = 0.5 * (g.thetaRoot + g.thetaTip);
      g.thetaRoot = mean - 0.5 * value;
      g.thetaTip = mean + 0.5 * value;
      break;
    }
    case "th75": {
      const sh = value - (g.thetaRoot + (g.thetaTip - g.thetaRoot) * 0.75);
      g.thetaRoot += sh;
      g.thetaTip += sh;
      break;
    }
  }
  g.thetaRoot = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, g.thetaRoot));
  g.thetaTip = Math.max(-Math.PI / 2.0, Math.min(Math.PI / 2.0, g.thetaTip));
  if (key === "thRoot" || key === "thTip" || key === "thTwist" || key === "th75") {
    g.pitchMode = "linear_twist";
    g.theta0 = 0.5 * (g.thetaRoot + g.thetaTip);
  }
  return resolveSolidity(g);
}

export function getSolidityCoeffs(geom: RotorGeometry): [number, number] {
  const nb = geom.nBlades;
  const rad = geom.radius;
  const s0 = (nb * geom.chordRoot) / (Math.PI * rad);
  const s1 = (nb * (geom.chordTip - geom.chordRoot)) / (Math.PI * rad);
  return [s0, s1];
}

export function localSolidity(geom: RotorGeometry, x: number): number {
  const [s0, s1] = getSolidityCoeffs(geom);
  return s0 + s1 * x;
}

export function getPitchCoeffs(geom: RotorGeometry): [number, number] {
  if (geom.pitchMode === "constant") {
    return [geom.theta0, 0.0];
  }
  const x0 = geom.rootCutout;
  const dx = Math.max(1e-6, 1.0 - x0);
  const tTw = geom.thetaTip - geom.thetaRoot;
  const t0 = geom.thetaRoot - (tTw * x0) / dx;
  const t1 = tTw / dx;
  return [t0, t1];
}

export function radialIntegralsJ(x0: number, b: number): number[] {
  const j = new Array(7).fill(0);
  for (let m = 0; m <= 6; m++) {
    j[m] = (Math.pow(b, m + 1) - Math.pow(x0, m + 1)) / (m + 1);
  }
  return j;
}

export function radialMoments(geom: RotorGeometry, b: number): [number[], number[], number[]] {
  const x0 = geom.rootCutout;
  const j = radialIntegralsJ(x0, b);
  const [s0, s1] = getSolidityCoeffs(geom);
  const iMom = new Array(7).fill(0);
  for (let m = 0; m <= 5; m++) {
    iMom[m] = s0 * j[m] + s1 * j[m + 1];
  }
  const [t0, t1] = getPitchCoeffs(geom);
  const p0 = s0 * t0;
  const p1 = s0 * t1 + s1 * t0;
  const p2 = s1 * t1;

  const tMom = new Array(7).fill(0);
  for (let m = 0; m <= 5; m++) {
    tMom[m] = p0 * j[m] + p1 * j[m + 1] + p2 * j[m + 2];
  }
  return [j, iMom, tMom];
}

export function getBFactor(geom: RotorGeometry, ct: number): number {
  if (geom.tipLossMode === "none") return 1.0;
  if (geom.tipLossMode === "fixed") return geom.tipLossB;
  if (geom.tipLossMode === "sissingh") {
    if (ct <= 0) return 1.0;
    const b = 1.0 - Math.sqrt(2.0 * ct) / geom.nBlades;
    return Math.max(0.5, Math.min(1.0, b));
  }
  return 1.0;
}

export function getLiftSlope(geom: RotorGeometry, mu: number, soundSpeed: number): number {
  if (!geom.usePrandtlGlauert || soundSpeed <= 1) return geom.liftSlope0;
  const vtip = geom.rpm * 2 * Math.PI / 60 * geom.radius;
  const effectiveMach = Math.min(0.85, vtip / soundSpeed * Math.sqrt(0.75 ** 2 + 0.5 * mu ** 2));
  return geom.liftSlope0 / Math.sqrt(Math.max(0.01, 1 - effectiveMach ** 2));
}

/** Canonical first-harmonic models: documentation §4 and compiled zBETEngine. */
export function inflowGradients(mu: number, lam: number, model: string, fx: number, fy: number): [number, number] {
  const denom = Math.sqrt(mu * mu + lam * lam) + Math.abs(lam);
  const tanHalf = denom > 1e-15 ? mu / denom : 0;
  switch (model) {
    case "coleman_simple": return [tanHalf, 0];
    case "coleman":
    case "coleman_feingold": return [fx * 15 * Math.PI / 32 * tanHalf, -fy * 2 * mu];
    case "drees": return [4 / 3 * (1 - 1.8 * mu * mu) * tanHalf, -2 * mu];
    default: return [0, 0];
  }
}

export function ctBet(
  mu: number,
  lam: number,
  lambda1s: number,
  iMom: number[],
  tMom: number[],
  a: number
): number {
  return (a / 2.0) * (tMom[2] + 0.5 * mu * mu * tMom[0] - lam * iMom[1] - 0.5 * mu * lambda1s * iMom[1]);
}

export function solveInflow(
  mu: number,
  muZ: number,
  geom: RotorGeometry,
  cond: FlightCondition,
  bVal: number
): number {
  const [, iMom, tMom] = radialMoments(geom, bVal);
  const liftSlope = getLiftSlope(geom, mu, cond.speedOfSound);

  let lo = 0.0;
  const lamLo = muZ + lo;
  const gradLo = inflowGradients(mu, lamLo, cond.inflowModel, cond.fxColeman, cond.fyColeman);
  const betLo = ctBet(mu, lamLo, gradLo[1] * lo, iMom, tMom, liftSlope);
  const momLo = 2.0 * (bVal * bVal) * lo * Math.sqrt(mu * mu + lamLo * lamLo);
  const fLo = betLo - momLo;

  if (fLo < 0.0) return -1.0;
  if (Math.abs(fLo) < 1e-14) return 0.0;

  let hi = 0.1;
  let fHi = 1.0;
  for (let iter = 1; iter <= 50; iter++) {
    const lamHi = muZ + hi;
    const gradHi = inflowGradients(mu, lamHi, cond.inflowModel, cond.fxColeman, cond.fyColeman);
    const betHi = ctBet(mu, lamHi, gradHi[1] * hi, iMom, tMom, liftSlope);
    const momHi = 2.0 * (bVal * bVal) * hi * Math.sqrt(mu * mu + lamHi * lamHi);
    fHi = betHi - momHi;
    if (fHi <= 0.0 || hi >= 100.0) break;
    hi = hi * 2.0;
  }
  if (fHi > 0.0) return -1.0;

  let currentLo = lo;
  let currentHi = hi;
  for (let iter = 1; iter <= 150; iter++) {
    const mid = 0.5 * (currentLo + currentHi);
    const lamMid = muZ + mid;
    const gradMid = inflowGradients(mu, lamMid, cond.inflowModel, cond.fxColeman, cond.fyColeman);
    const betMid = ctBet(mu, lamMid, gradMid[1] * mid, iMom, tMom, liftSlope);
    const momMid = 2.0 * (bVal * bVal) * mid * Math.sqrt(mu * mu + lamMid * lamMid);
    const fMid = betMid - momMid;

    if (Math.abs(fMid) < 1e-13 || currentHi - currentLo < 1e-13) return mid;
    if (fMid > 0.0) {
      currentLo = mid;
    } else {
      currentHi = mid;
    }
  }
  return 0.5 * (currentLo + currentHi);
}

export function profileDrag(
  mu: number,
  muZ: number,
  geom: RotorGeometry,
  model: string
): [number, number] {
  const x0 = geom.rootCutout;
  const j = radialIntegralsJ(x0, 1.0);
  const [s0, s1] = getSolidityCoeffs(geom);
  const i1 = s0 * j[1] + s1 * j[2];
  const i3 = s0 * j[3] + s1 * j[4];
  const cd0 = geom.cd0;

  if (model === "analytical_tangential") {
    const ch0 = (cd0 * mu * i1) / 2.0;
    const cq0 = (cd0 / 2.0) * (i3 + 0.5 * mu * mu * i1);
    return [ch0, cq0];
  }
  if (model === "analytical_vectorial") {
    const ch0 = 0.75 * cd0 * mu * i1;
    const cq0 = 0.5 * cd0 * (i3 + (0.75 * mu * mu + 0.5 * muZ * muZ) * i1);
    return [ch0, cq0];
  }

  // numerical_vectorial (2D Gauss-Legendre Quadrature)
  const halfR = 0.5 * (1.0 - x0);
  let ch0Sum = 0.0;
  let cq0Sum = 0.0;

  for (let ir = 0; ir < 16; ir++) {
    const rStation = halfR * (GL_X16[ir] + 1.0) + x0;
    const rWeight = halfR * GL_W16[ir];
    const sigR = localSolidity(geom, rStation);
    const factor = (sigR * cd0) / 2.0;

    for (let ip = 0; ip < 24; ip++) {
      const psi = Math.PI * (GL_X24[ip] + 1.0);
      const psiWeight = 0.5 * GL_W24[ip];
      const sinP = Math.sin(psi);
      const cosP = Math.cos(psi);
      const uT = rStation + mu * sinP;
      const uR = mu * cosP;
      const totalW = Math.sqrt(uT * uT + uR * uR + muZ * muZ);

      const dCH0 = factor * totalW * (uT * sinP + uR * cosP);
      const dCQ0 = factor * totalW * uT * rStation;

      ch0Sum += rWeight * psiWeight * dCH0;
      cq0Sum += rWeight * psiWeight * dCQ0;
    }
  }

  return [ch0Sum, cq0Sum];
}

export function sanitizeCondition(cond: FlightCondition): FlightCondition {
  const c = { ...cond };
  c.kInd = Math.max(0.5, Math.min(3.0, c.kInd));
  c.fxColeman = Math.max(0.0, Math.min(2.0, c.fxColeman));
  c.fyColeman = Math.max(0.0, Math.min(2.0, c.fyColeman));

  if (c.horizontalMode === "vx") {
    const omega = (c.rpm * 2.0 * Math.PI) / 60.0;
    const vtip = omega * 5.0; // fallback radius
    c.mu = vtip > 0 ? c.horizontalValue / vtip : 0.0;
  } else {
    c.mu = c.horizontalValue;
  }
  c.mu = Math.max(0.0, Math.min(0.8, c.mu));

  if (c.axialMode === "alpha") {
    const aRad = (c.axialValue * Math.PI) / 180.0;
    c.muZ = -c.mu * Math.tan(aRad);
  } else if (c.axialMode === "vz") {
    const omega = (c.rpm * 2.0 * Math.PI) / 60.0;
    const vtip = omega * 5.0;
    c.muZ = vtip > 0 ? c.axialValue / vtip : 0.0;
  } else {
    c.muZ = c.axialValue;
  }
  return c;
}

export function alphaFromMuZ(mu: number, muZ: number): number {
  if (mu <= 1e-9) return 0.0;
  return (-Math.atan2(muZ, mu) * 180.0) / Math.PI;
}

function candidateResidual(
  baseGeom: RotorGeometry,
  sourceCond: FlightCondition,
  candidateRPM: number,
  candidateCollectiveDeg: number,
  targetKind: "ct" | "thrust",
  targetValue: number
): [number, boolean] {
  const delta = candidateCollectiveDeg * Math.PI / 180;
  const g = resolveSolidity({ ...baseGeom, rpm: candidateRPM, pitchMode: "linear_twist", thetaRoot: baseGeom.thetaRoot + delta, thetaTip: baseGeom.thetaTip + delta, theta0: .5 * (baseGeom.thetaRoot + baseGeom.thetaTip) + delta });

  const c = { ...sourceCond, rpm: candidateRPM, collectiveDeg: candidateCollectiveDeg };
  const res = calculateCoreResolvedMode(g, c, false);
  if (!res.solutionValid) return [0.0, false];

  const actual = targetKind === "ct" ? res.CT : res.thrustN;
  return [actual - targetValue, true];
}

export function solveCollective(
  baseGeom: RotorGeometry,
  sourceCond: FlightCondition,
  rpm: number,
  targetKind: "ct" | "thrust",
  targetValue: number
): [number, boolean] {
  let lo = -60.0;
  let hi = 60.0;
  let prevX = lo;
  let prevObj = candidateResidual(baseGeom, sourceCond, rpm, prevX, targetKind, targetValue);
  let found = false;
  let fLo = prevObj[1] ? prevObj[0] : 0.0;
  let fHi = 0.0;

  for (let i = 1; i <= 48; i++) {
    const x = lo + (i * (hi - lo)) / 48.0;
    const obj = candidateResidual(baseGeom, sourceCond, rpm, x, targetKind, targetValue);
    if (prevObj[1] && obj[1]) {
      fLo = prevObj[0];
      const f = obj[0];
      if (Math.abs(f) < 1e-10) return [x, true];
      if ((fLo <= 0 && f >= 0) || (fLo >= 0 && f <= 0)) {
        lo = prevX;
        hi = x;
        fHi = f;
        found = true;
        break;
      }
      fLo = f;
    }
    prevX = x;
    prevObj = obj;
  }

  if (!found) return [sourceCond.collectiveDeg, false];

  let curLo = lo;
  let curHi = hi;
  let curFLo = fLo;

  for (let iter = 1; iter <= 80; iter++) {
    const mid = 0.5 * (curLo + curHi);
    const midObj = candidateResidual(baseGeom, sourceCond, rpm, mid, targetKind, targetValue);
    if (!midObj[1]) return [sourceCond.collectiveDeg, false];
    const fm = midObj[0];
    if (Math.abs(fm) < 1e-9 || Math.abs(curHi - curLo) < 1e-8) return [mid, true];
    if ((curFLo <= 0 && fm >= 0) || (curFLo >= 0 && fm <= 0)) {
      curHi = mid;
    } else {
      curLo = mid;
      curFLo = fm;
    }
  }
  return [0.5 * (curLo + curHi), true];
}

function addDistinctRPMRoot(roots: number[], candidate: number): void {
  const tol = Math.max(0.05, 1.0e-5 * Math.max(1.0, Math.abs(candidate)));
  for (const existing of roots) {
    if (Math.abs(existing - candidate) <= tol) return;
  }
  roots.push(candidate);
}

function bisectRPMBracket(
  baseGeom: RotorGeometry,
  sourceCond: FlightCondition,
  collectiveDeg: number,
  targetKind: "ct" | "thrust",
  targetValue: number,
  lo: number,
  hi: number,
  fLo: number
): [number, boolean] {
  let curLo = lo;
  let curHi = hi;
  let curFLo = fLo;
  for (let iter = 1; iter <= 90; iter++) {
    const mid = 0.5 * (curLo + curHi);
    const midObj = candidateResidual(baseGeom, sourceCond, mid, collectiveDeg, targetKind, targetValue);
    if (!midObj[1]) return [sourceCond.rpm, false];
    const fm = midObj[0];
    if (Math.abs(fm) < 1.0e-9 || Math.abs(curHi - curLo) < 1.0e-7) return [mid, true];
    if ((curFLo <= 0 && fm >= 0) || (curFLo >= 0 && fm <= 0)) {
      curHi = mid;
    } else {
      curLo = mid;
      curFLo = fm;
    }
  }
  return [0.5 * (curLo + curHi), true];
}

function nearestRPMRoot(roots: number[], seedRPM: number): number {
  let best = roots[0];
  let bestDistance = Math.abs(best - seedRPM);
  for (let i = 1; i < roots.length; i++) {
    const candidate = roots[i];
    const dist = Math.abs(candidate - seedRPM);
    if (dist < bestDistance) {
      best = candidate;
      bestDistance = dist;
    }
  }
  return best;
}

export function solveRPM(
  baseGeom: RotorGeometry,
  sourceCond: FlightCondition,
  collectiveDeg: number,
  targetKind: "ct" | "thrust",
  targetValue: number
): [number, boolean, "none" | "unique" | "multiple"] {
  const roots: number[] = [];
  let prevRPM = 10.0;
  let prevObj = candidateResidual(baseGeom, sourceCond, prevRPM, collectiveDeg, targetKind, targetValue);
  let prevValid = prevObj[1];
  let prevF = 0.0;
  if (prevValid) {
    prevF = prevObj[0];
    if (Math.abs(prevF) < 1.0e-9) addDistinctRPMRoot(roots, prevRPM);
  }

  for (let i = 1; i <= 80; i++) {
    const rpmCandidate = 10.0 * Math.pow(3000.0, i / 80.0);
    const obj = candidateResidual(baseGeom, sourceCond, rpmCandidate, collectiveDeg, targetKind, targetValue);
    const currentValid = obj[1];
    if (currentValid) {
      const f = obj[0];
      if (Math.abs(f) < 1.0e-9) addDistinctRPMRoot(roots, rpmCandidate);
      if (prevValid && prevF * f < 0.0) {
        const bracket = bisectRPMBracket(baseGeom, sourceCond, collectiveDeg, targetKind, targetValue, prevRPM, rpmCandidate, prevF);
        if (bracket[1]) addDistinctRPMRoot(roots, bracket[0]);
      }
      prevF = f;
    }
    prevRPM = rpmCandidate;
    prevValid = currentValid;
  }

  if (roots.length === 0) return [sourceCond.rpm, false, "none"];
  if (targetKind === "ct" && roots.length !== 1) return [sourceCond.rpm, false, "multiple"];

  const selectedRPM = nearestRPMRoot(roots, sourceCond.rpm);
  const status: "unique" | "multiple" = roots.length > 1 ? "multiple" : "unique";
  return [selectedRPM, true, status];
}

export function resolveOperatingState(
  geom: RotorGeometry,
  cond: FlightCondition
): [RotorGeometry, FlightCondition, string] {
  let baseGeom = resolveSolidity(cloneGeometry(geom));
  let c = sanitizeCondition(cond);
  let rpm = c.rpm;
  let collective = c.collectiveDeg;
  let ok = true;
  let status = "VALID";

  switch (c.operatingPair) {
    case "rpm_collective":
      break;
    case "rpm_ct": {
      if (c.targetCT <= 0) {
        ok = false;
        status = "INVALID: Target CT must be positive";
      } else {
        const [solColl, solOk] = solveCollective(baseGeom, c, rpm, "ct", c.targetCT);
        collective = solColl;
        ok = solOk;
      }
      break;
    }
    case "rpm_thrust": {
      if (c.targetThrustN <= 0) {
        ok = false;
        status = "INVALID: Target Thrust must be positive";
      } else {
        const [solColl, solOk] = solveCollective(baseGeom, c, rpm, "thrust", c.targetThrustN);
        collective = solColl;
        ok = solOk;
      }
      break;
    }
    case "collective_ct": {
      if (c.targetCT <= 0) {
        ok = false;
        status = "INVALID: Collective + CT target must be positive";
      } else if (c.horizontalMode === "mu" && c.axialMode !== "vz" && !baseGeom.usePrandtlGlauert) {
        ok = false;
        status = "INVALID: Collective + CT is non-unique at this flight/model state";
      } else {
        const [solRPM, solOk, rootStatus] = solveRPM(baseGeom, c, collective, "ct", c.targetCT);
        rpm = solRPM;
        ok = solOk;
        if (!ok) {
          status = rootStatus === "multiple"
            ? "INVALID: Collective + CT is non-unique at this flight/model state"
            : "INVALID: Collective + CT has no RPM solution at this flight/model state";
        }
      }
      break;
    }
    case "collective_thrust": {
      if (c.targetThrustN <= 0) {
        ok = false;
        status = "INVALID: Target Thrust must be positive";
      } else {
        const [solRPM, solOk] = solveRPM(baseGeom, c, collective, "thrust", c.targetThrustN);
        rpm = solRPM;
        ok = solOk;
      }
      break;
    }
    case "ct_thrust": {
      if (c.targetCT <= 0 || c.targetThrustN <= 0) {
        ok = false;
        status = "INVALID: Target CT and Target Thrust must be positive";
      } else {
        const area = Math.PI * baseGeom.radius * baseGeom.radius;
        const vtipReq = Math.sqrt(c.targetThrustN / (c.rho * area * c.targetCT));
        rpm = (vtipReq / baseGeom.radius) * 60.0 / (2.0 * Math.PI);
        if (rpm < 1.0 || rpm > 30000.0) {
          ok = false;
        } else {
          const [solColl, solOk] = solveCollective(baseGeom, c, rpm, "ct", c.targetCT);
          collective = solColl;
          ok = solOk;
        }
      }
      break;
    }
  }

  if (!ok && status === "VALID") {
    status = "INVALID: selected operating constraints could not be trimmed";
  }

  if (!ok) return [baseGeom, c, status];

  c.rpm = rpm;
  c.collectiveDeg = collective;
  baseGeom.rpm = rpm;

  const delta = collective * Math.PI / 180;
  baseGeom.pitchMode = "linear_twist";
  baseGeom.thetaRoot += delta;
  baseGeom.thetaTip += delta;
  baseGeom.theta0 = .5 * (baseGeom.thetaRoot + baseGeom.thetaTip);

  // Re-resolve mu and muZ with final RPM
  const omega = (rpm * 2.0 * Math.PI) / 60.0;
  const vtip = omega * baseGeom.radius;
  if (c.horizontalMode === "vx") {
    c.mu = vtip > 0 ? c.horizontalValue / vtip : 0.0;
  }
  if (c.axialMode === "vz") {
    c.muZ = vtip > 0 ? c.axialValue / vtip : 0.0;
  } else if (c.axialMode === "alpha") {
    const aRad = (c.axialValue * Math.PI) / 180.0;
    c.muZ = -c.mu * Math.tan(aRad);
  }

  return [baseGeom, c, "VALID"];
}

export function calculate(geom: RotorGeometry, cond: FlightCondition): RotorResults {
  const [resolvedGeom, resolvedCond, status] = resolveOperatingState(geom, cond);
  if (status !== "VALID") {
    const res = createEmptyResults();
    res.solutionValid = false;
    res.statusMessage = status;
    return res;
  }
  return calculateCoreResolvedMode(resolvedGeom, resolvedCond, true);
}

function createEmptyResults(): RotorResults {
  return {
    CT: 0, CQ: 0, CQi: 0, CQ0: 0, CH: 0, CHi: 0, CH0: 0, CY: 0, CMx: 0, CMy: 0, CPair: 0,
    inflowLambda: 0, inflowLambdaI: 0, L_D_eff: 0, FoM: 0,
    thrustN: 0, thrustKgf: 0, thrustLbf: 0,
    powerShaftW: 0, powerShaftKW: 0, powerShaftHP: 0,
    torqueNm: 0, torqueLbft: 0, dragHN: 0, sideForceYN: 0, sideForceYLbf: 0,
    rollMomentNm: 0, rollMomentLbft: 0, pitchMomentNm: 0, pitchMomentLbft: 0,
    tipSpeed: 0, advancingTipMach: 0, inflowKx: 0, inflowKy: 0, wakeSkewChiDeg: 0, bFactor: 1,
    effectiveLiftSlope: 0, trimmedRPM: 0, trimmedCollectiveDeg: 0, trimmedTheta0Deg: 0,
    operatingMu: 0, operatingMuZ: 0, operatingVx: 0, operatingVz: 0, operatingAlphaDeg: 0,
    altitudeM: 0, temperatureC: 0, densityRho: 0, pressurePa: 0, speedOfSound: 0,
    solutionValid: false, compressibilityWarning: false, statusMessage: "INIT",
    powerInducedKW: 0, powerProfileKW: 0, diskLoadingN_m2: 0, powerLoadingN_kW: 0,
    inducedVelocityM_s: 0, CTs: 0,
    aoaAdv25: 0, aoaRet25: 0, phiAdv25: 0, phiRet25: 0,
    aoaAdv50: 0, aoaRet50: 0, phiAdv50: 0, phiRet50: 0,
    aoaAdv75: 0, aoaRet75: 0, phiAdv75: 0, phiRet75: 0,
    aoaAdvTip: 0, aoaRetTip: 0, phiAdvTip: 0, phiRetTip: 0,
  };
}

export function calculateCoreResolvedMode(
  geom: RotorGeometry,
  cond: FlightCondition,
  fullResults: boolean
): RotorResults {
  const res = createEmptyResults();
  res.solutionValid = true;
  res.compressibilityWarning = false;
  res.statusMessage = "VALID";

  const c = sanitizeCondition(cond);
  const g = resolveSolidity(cloneGeometry(geom));

  const diskArea = Math.PI * g.radius * g.radius;
  const omega = (g.rpm * 2.0 * Math.PI) / 60.0;
  const vtip = omega * g.radius;
  const dynP = c.rho * diskArea * (vtip * vtip);

  res.tipSpeed = vtip;
  res.trimmedRPM = g.rpm;
  res.trimmedCollectiveDeg = c.collectiveDeg;
  res.trimmedTheta0Deg = (0.5 * (g.thetaRoot + g.thetaTip) * 180.0) / Math.PI;
  res.operatingMu = c.mu;
  res.operatingMuZ = c.muZ;
  res.operatingVx = c.mu * vtip;
  res.operatingVz = c.muZ * vtip;
  res.operatingAlphaDeg = alphaFromMuZ(c.mu, c.muZ);
  res.altitudeM = c.altitudeM;
  res.temperatureC = c.temperatureC;
  res.densityRho = c.rho;
  res.pressurePa = c.pressurePa;
  res.speedOfSound = c.speedOfSound;

  res.advancingTipMach = (vtip * (1.0 + c.mu)) / c.speedOfSound;
  res.effectiveLiftSlope = getLiftSlope(g, c.mu, c.speedOfSound);
  if (g.usePrandtlGlauert && res.advancingTipMach >= 0.8) {
    res.compressibilityWarning = true;
    if (res.advancingTipMach >= 1.0) res.compressibilityInvalid = true;
    res.statusMessage = "CAUTION: Prandtl-Glauert outside recommended Mat < 0.80 range";
  }

  let bVal = g.tipLossMode === "fixed" ? g.tipLossB : 1.0;
  if (g.tipLossMode === "sissingh") bVal = 0.97;

  let lambdaI = solveInflow(c.mu, c.muZ, g, c, bVal);
  if (lambdaI < 0) {
    res.solutionValid = false;
    res.statusMessage = "INVALID: no physical inflow root bracketed";
    return res;
  }
  let lambdaTotal = c.muZ + lambdaI;

  let [kx, ky] = inflowGradients(c.mu, lambdaTotal, c.inflowModel, c.fxColeman, c.fyColeman);
  let lambda1c = kx * lambdaI;
  let lambda1s = ky * lambdaI;

  res.inflowLambda = lambdaTotal;
  res.inflowLambdaI = lambdaI;
  res.inflowKx = kx;
  res.inflowKy = ky;

  let denomChi = Math.sqrt(c.mu * c.mu + lambdaTotal * lambdaTotal) + Math.abs(lambdaTotal);
  res.wakeSkewChiDeg = denomChi > 1e-15 ? (2.0 * Math.atan(c.mu / denomChi) * 180.0) / Math.PI : 0.0;

  let [, iMom, tMom] = radialMoments(g, bVal);
  let ctVal = ctBet(c.mu, lambdaTotal, lambda1s, iMom, tMom, res.effectiveLiftSlope);
  res.CT = ctVal;

  if (g.tipLossMode === "sissingh" && ctVal > 0) {
    for (let iter = 1; iter <= 8; iter++) {
      const nextB = getBFactor(g, ctVal);
      const deltaB = Math.abs(nextB - bVal);
      bVal = nextB;
      lambdaI = solveInflow(c.mu, c.muZ, g, c, bVal);
      if (lambdaI < 0) {
        res.solutionValid = false;
        res.statusMessage = "INVALID: no physical inflow root after tip-loss update";
        return res;
      }
      lambdaTotal = c.muZ + lambdaI;
      [kx, ky] = inflowGradients(c.mu, lambdaTotal, c.inflowModel, c.fxColeman, c.fyColeman);
      lambda1c = kx * lambdaI;
      lambda1s = ky * lambdaI;
      [, iMom, tMom] = radialMoments(g, bVal);
      ctVal = ctBet(c.mu, lambdaTotal, lambda1s, iMom, tMom, res.effectiveLiftSlope);
      res.CT = ctVal;
      if (deltaB < 1e-8) break;
    }
    res.inflowLambda = lambdaTotal;
    res.inflowLambdaI = lambdaI;
    res.inflowKx = kx;
    res.inflowKy = ky;
    denomChi = Math.sqrt(c.mu * c.mu + lambdaTotal * lambdaTotal) + Math.abs(lambdaTotal);
    res.wakeSkewChiDeg = denomChi > 1e-15 ? (2.0 * Math.atan(c.mu / denomChi) * 180.0) / Math.PI : 0.0;
  }
  res.bFactor = bVal;

  if (!fullResults) {
    res.thrustN = ctVal * dynP;
    res.thrustKgf = res.thrustN / 9.80665;
    res.thrustLbf = res.thrustN * 0.224808943;
    return res;
  }

  // Aerodynamic force and moment coefficients
  res.CHi = (res.effectiveLiftSlope / 4.0) * (
    lambdaTotal * c.mu * tMom[0] + lambda1s * (tMom[2] - 2.0 * lambdaTotal * iMom[1])
  );
  res.CY = -(res.effectiveLiftSlope * lambda1c / 4.0) * (tMom[2] - 2.0 * lambdaTotal * iMom[1]);

  res.CMx = -(res.effectiveLiftSlope * c.mu / 2.0) * (tMom[2] - 0.5 * lambdaTotal * iMom[1]) +
    (res.effectiveLiftSlope * lambda1s / 4.0) * iMom[3];
  res.CMy = (res.effectiveLiftSlope * lambda1c / 4.0) * iMom[3];

  // Profile drag (numerical_vectorial by default)
  const [ch0, cq0] = profileDrag(c.mu, c.muZ, g, "numerical_vectorial");
  res.CH0 = ch0;
  res.CQ0 = cq0;
  res.CH = res.CHi + res.CH0;

  // Induced torque and shaft power
  res.CQi = c.kInd * lambdaI * ctVal + c.muZ * ctVal - c.mu * res.CHi;
  res.CQ = res.CQi + res.CQ0;
  res.CPair = c.kInd * lambdaI * ctVal + c.muZ * ctVal + res.CQ0 + c.mu * res.CH0;

  if (res.CPair > 1e-9) {
    res.L_D_eff = (ctVal * c.mu) / res.CPair;
  } else {
    res.L_D_eff = 0.0;
  }

  const idealHoverPower = ctVal > 0 ? Math.pow(ctVal, 1.5) / Math.SQRT2 : 0.0;
  const cpFoM = c.kInd * idealHoverPower + res.CQ0;
  res.FoM = cpFoM > 1e-9 ? idealHoverPower / cpFoM : 0.0;

  // Dimensional quantities
  res.thrustN = ctVal * dynP;
  res.thrustKgf = res.thrustN / 9.80665;
  res.thrustLbf = res.thrustN * 0.224808943;

  res.dragHN = res.CH * dynP;
  res.sideForceYN = res.CY * dynP;
  res.sideForceYLbf = res.sideForceYN * 0.224808943;
  res.torqueNm = res.CQ * dynP * g.radius;
  res.torqueLbft = res.torqueNm * 0.737562149;
  res.rollMomentNm = res.CMx * dynP * g.radius;
  res.rollMomentLbft = res.rollMomentNm * 0.737562149;
  res.pitchMomentNm = res.CMy * dynP * g.radius;
  res.pitchMomentLbft = res.pitchMomentNm * 0.737562149;

  res.powerShaftW = res.torqueNm * omega;
  res.powerShaftKW = res.powerShaftW / 1000.0;
  res.powerShaftHP = res.powerShaftW / 745.699872;

  res.phiAdv25 = sectionPhi(g, res, 0.25, 1);
  res.phiRet25 = sectionPhi(g, res, 0.25, -1);
  const pitch25 = localPitch(g, 0.25) * (180.0 / Math.PI);
  res.aoaAdv25 = Number.isNaN(res.phiAdv25) ? NaN : pitch25 - res.phiAdv25;
  res.aoaRet25 = Number.isNaN(res.phiRet25) ? NaN : pitch25 - res.phiRet25;

  res.phiAdv50 = sectionPhi(g, res, 0.50, 1);
  res.phiRet50 = sectionPhi(g, res, 0.50, -1);
  const pitch50 = localPitch(g, 0.50) * (180.0 / Math.PI);
  res.aoaAdv50 = Number.isNaN(res.phiAdv50) ? NaN : pitch50 - res.phiAdv50;
  res.aoaRet50 = Number.isNaN(res.phiRet50) ? NaN : pitch50 - res.phiRet50;

  res.phiAdv75 = sectionPhi(g, res, 0.75, 1);
  res.phiRet75 = sectionPhi(g, res, 0.75, -1);
  const pitch75 = localPitch(g, 0.75) * (180.0 / Math.PI);
  res.aoaAdv75 = Number.isNaN(res.phiAdv75) ? NaN : pitch75 - res.phiAdv75;
  res.aoaRet75 = Number.isNaN(res.phiRet75) ? NaN : pitch75 - res.phiRet75;

  res.phiAdvTip = sectionPhi(g, res, 1.0, 1);
  res.phiRetTip = sectionPhi(g, res, 1.0, -1);
  const pitchTip = localPitch(g, 1.0) * (180.0 / Math.PI);
  res.aoaAdvTip = Number.isNaN(res.phiAdvTip) ? NaN : pitchTip - res.phiAdvTip;
  res.aoaRetTip = Number.isNaN(res.phiRetTip) ? NaN : pitchTip - res.phiRetTip;

  const cqRatio = Math.max(1e-12, Math.abs(res.CQ));
  res.powerInducedKW = (res.CQi / cqRatio) * res.powerShaftKW;
  res.powerProfileKW = (res.CQ0 / cqRatio) * res.powerShaftKW;
  res.diskLoadingN_m2 = res.thrustN / (Math.PI * g.radius * g.radius);
  res.powerLoadingN_kW = res.thrustN / Math.max(1e-6, res.powerShaftKW);
  res.inducedVelocityM_s = res.inflowLambdaI * vtip;
  res.CTs = res.CT / Math.max(1e-6, g.sigmaRef);

  return res;
}

// ---------------------------------------------------------------------------
// Section diagnostics at radial stations (advancing/retreating; matching zBETEngine.bas)
// ---------------------------------------------------------------------------

export function localPitch(geom: RotorGeometry, x: number): number {
  const [t0, t1] = getPitchCoeffs(geom);
  return t0 + t1 * x;
}

export function sectionPhi(g: RotorGeometry, res: RotorResults, x: number, side: number): number {
  if (x < g.rootCutout) return NaN;
  if (x <= 0.75 && res.bFactor < x) return NaN;
  const ut = x + side * res.operatingMu;
  if (ut <= 1e-9) return NaN;
  const up = res.inflowLambda + x * side * res.inflowKy * res.inflowLambdaI;
  return Math.atan(up / ut) * (180.0 / Math.PI);
}

export function sectionPhi75(g: RotorGeometry, res: RotorResults, side: number): number {
  return sectionPhi(g, res, 0.75, side);
}

export function derivedOutput(res: RotorResults, key: string): number {
  switch (key) {
    case "vi":
      return res.inflowLambdaI * res.tipSpeed;
    case "Vztot":
      return res.inflowLambda * res.tipSpeed;
    case "Vadv":
      return res.tipSpeed + res.operatingVx;
    case "Vret":
      return res.tipSpeed - res.operatingVx;
    case "Mret":
      if (res.speedOfSound <= 0) return NaN;
      return Math.abs(res.tipSpeed - res.operatingVx) / res.speedOfSound;
    case "aoaAdv25":
      return res.aoaAdv25;
    case "aoaRet25":
      return res.aoaRet25;
    case "phiAdv25":
      return res.phiAdv25;
    case "phiRet25":
      return res.phiRet25;
    case "aoaAdv50":
      return res.aoaAdv50;
    case "aoaRet50":
      return res.aoaRet50;
    case "phiAdv50":
      return res.phiAdv50;
    case "phiRet50":
      return res.phiRet50;
    case "aoaAdv75":
      return res.aoaAdv75;
    case "aoaRet75":
      return res.aoaRet75;
    case "phiAdv75":
      return res.phiAdv75;
    case "phiRet75":
      return res.phiRet75;
    case "aoaAdvTip":
    case "aoaAdv100":
      return res.aoaAdvTip;
    case "aoaRetTip":
    case "aoaRet100":
      return res.aoaRetTip;
    case "phiAdvTip":
    case "phiAdv100":
      return res.phiAdvTip;
    case "phiRetTip":
    case "phiRet100":
      return res.phiRetTip;
    default:
      return NaN;
  }
}

// ---------------------------------------------------------------------------
// Derived output helpers (pure post-processing of RotorResults; matching zBETEngine.bas)
// Undefined values return NaN.
// ---------------------------------------------------------------------------

export function freestreamSpeed(res: RotorResults): number {
  return Math.sqrt(res.operatingVx * res.operatingVx + res.operatingVz * res.operatingVz);
}

export function derivedMuOverLambda(res: RotorResults): number {
  if (Math.abs(res.inflowLambda) < 0.0001) return NaN;
  return res.operatingMu / res.inflowLambda;
}

export function derivedTc(res: RotorResults, area: number): number {
  const v = freestreamSpeed(res);
  if (v < 0.01 || area <= 0 || res.densityRho <= 0) return NaN;
  return res.thrustN / (0.5 * res.densityRho * v * v * area);
}

export function derivedPc(res: RotorResults, area: number): number {
  const v = freestreamSpeed(res);
  if (v < 0.01 || area <= 0 || res.densityRho <= 0) return NaN;
  return res.powerShaftW / (0.5 * res.densityRho * v * v * v * area);
}

export function derivedLambdaH(res: RotorResults): number {
  if (res.CT < 0) return NaN;
  return Math.sqrt(res.CT / 2);
}

export function derivedClBar(res: RotorResults, sigma: number): number {
  if (sigma <= 0) return NaN;
  return (6 * res.CT) / sigma;
}
