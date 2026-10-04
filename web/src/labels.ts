/**
 * Canonical Nomenclature and Responsive Label System (B4A Parity)
 * Authoritative specifications: docs/nomenclature.md & RotorNames.bas
 */

import { APK_NOMENCLATURE } from "./apk-nomenclature";

export interface NomenclatureEntry {
  key: string;
  full: string;
  short: string;
  sym: string;
  unit: string;
  body: string;
  eq: string;
  range: string;
}

export const CANONICAL_NOMENCLATURE: Record<string, NomenclatureEntry> = {
  // Geometry
  name: {
    key: "name",
    full: "Rotor Name",
    short: "Name",
    sym: "",
    unit: "",
    body: "Identifier of the saved rotor. It appears in the rotor list and in exports.",
    eq: "",
    range: "",
  },
  rpmNom: {
    key: "rpmNom",
    full: "Rotor Speed",
    short: "Rotor Speed",
    sym: "Ω_nom",
    unit: "rpm",
    body: "Design rotor speed stored with the rotor. It seeds the Conditions page.",
    eq: "Ω = 2π·rpm / 60",
    range: "",
  },
  R: {
    key: "R",
    full: "Rotor Radius",
    short: "Radius",
    sym: "R",
    unit: "m",
    body: "Distance from the rotation axis to the blade tip. Sets the disk area and the tip speed.",
    eq: "A = πR²",
    range: "0.05 m (small drone) to 12 m (heavy helicopter)",
  },
  Nb: {
    key: "Nb",
    full: "Blade Count",
    short: "Blades",
    sym: "N_b",
    unit: "–",
    body: "Number of identical blades. Input. Chords are not changed, so adding a blade raises every solidity in proportion. Also enters the Sissingh tip factor.",
    eq: "σ_REF = N_b·(c_R + c_T) / (2πR)",
    range: "2 to 8",
  },
  x0: {
    key: "x0",
    full: "Root Cutout",
    short: "Root Cutout",
    sym: "x_0",
    unit: "–",
    body: "Inboard radial station x = r/R where aerodynamic loading starts. Input. The load integrals run from x_0 to the tip, so no lift or drag is produced inboard. Changing it keeps chords and σ_REF; the active area, σ_act and σ_TR change. The pitch law is anchored at x_0.",
    eq: "x_0 = r_root / R",
    range: "0.05 to 0.30",
  },
  c0: {
    key: "c0",
    full: "Root Chord",
    short: "Root Chord",
    sym: "c_R",
    unit: "m",
    body: "Chord of the fictitious planform at the rotation axis (x = 0), found by extending the linear chord law inward. The real blade starts at the cutout, so this is not the chord there. Input; changing it changes σ_REF, A_REF, AR and taper.",
    eq: "c(x) = c_R + (c_T − c_R)·x",
    range: "0.02 to 0.8 m",
  },
  c1: {
    key: "c1",
    full: "Tip Chord",
    short: "Tip Chord",
    sym: "c_T",
    unit: "m",
    body: "Chord at the blade tip (x = 1). Equal to c_R for a rectangular blade. Input; changing it changes σ_REF, A_REF, AR and taper.",
    eq: "c(x) = c_R + (c_T − c_R)·x",
    range: "0.02 to 0.8 m",
  },
  taper: {
    key: "taper",
    full: "Taper Ratio",
    short: "Taper",
    sym: "c_T/c_R",
    unit: "–",
    body: "Tip chord over axis chord. Derived from c_R and c_T; 1 is a rectangular blade. Editing it keeps the mean chord, hence σ_REF: c_R = 2c_m / (1 + taper) and c_T = taper·c_R, with c_m = (c_R + c_T)/2.",
    eq: "taper = c_T / c_R",
    range: "0.3 to 1.0",
  },
  sigmaRef: {
    key: "sigmaRef",
    full: "Reference Solidity",
    short: "Reference Solidity",
    sym: "σ_REF",
    unit: "–",
    body: "Blade area of the fictitious planform extended to the rotation axis (x = 0), over disk area. This is the reference solidity the analytical equations use. Derived from N_b, c_R, c_T and R; editing it scales both chords by the same factor and keeps taper.",
    eq: "σ_REF = N_b·A_REF / A",
    range: "0.05 to 0.15",
  },
  sigmaAct: {
    key: "sigmaAct",
    full: "Actual Solidity",
    short: "Actual Solidity",
    sym: "σ_act",
    unit: "–",
    body: "Actual (real) blade area, from the root cutout x_0 to the tip, over disk area. Derived; editing it scales both chords uniformly. Information only: the cutout already enters the equations through the integration limit.",
    eq: "σ_act = N_b·A_act / A",
    range: "0.05 to 0.15",
  },
  sigmaT: {
    key: "sigmaT",
    full: "Thrust-Weighted Solidity",
    short: "Thrust Solidity",
    sym: "σ_TR",
    unit: "–",
    body: "Solidity weighted by the radial thrust distribution, which grows as x². Derived; editing it scales both chords. Used to normalize blade loading C_T/σ and the mean lift coefficient.",
    eq: "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1",
    range: "0.05 to 0.15",
  },
  AR: {
    key: "AR",
    full: "Aspect Ratio",
    short: "Aspect Ratio",
    sym: "AR",
    unit: "–",
    body: "Blade radius squared over reference blade area, which equals R over the mean chord. Derived. Editing it scales both chords by AR_old / AR_new, keeping R and taper.",
    eq: "AR = R² / A_REF = 2R / (c_R + c_T)",
    range: "6 to 25",
  },
  A: {
    key: "A",
    full: "Disk Area",
    short: "Disk Area",
    sym: "A",
    unit: "m²",
    body: "Area swept by the blades. Derived from R. Editing it changes R to the square root of A/π and scales the chords with R.",
    eq: "A = πR²",
    range: "",
  },
  Ab: {
    key: "Ab",
    full: "Reference Blade Area",
    short: "Reference Area",
    sym: "A_REF",
    unit: "m²",
    body: "Planform area of one blade of the fictitious planform extended to the rotation axis (x = 0), not only the real blade. Reference blade area derived from the chords; editing it scales both chords.",
    eq: "A_REF = ∫ c dr, 0 to R = R·(c_R + c_T)/2",
    range: "",
  },
  Aact: {
    key: "Aact",
    full: "Actual Blade Area",
    short: "Actual Area",
    sym: "A_act",
    unit: "m²",
    body: "Actual (real) planform area of one blade, from the root cutout x_0 to the tip. Derived; editing it scales both chords.",
    eq: "A_act = ∫ c dr, x_0R to R",
    range: "",
  },
  thRoot: {
    key: "thRoot",
    full: "Root Pitch",
    short: "Root Pitch",
    sym: "θ_R",
    unit: "deg",
    body: "Geometric blade pitch angle at the root station, before collective. Linked to tip pitch through the total twist.",
    eq: "θ_twist = θ_T − θ_R",
    range: "",
  },
  thTip: {
    key: "thTip",
    full: "Tip Pitch",
    short: "Tip Pitch",
    sym: "θ_T",
    unit: "deg",
    body: "Geometric blade pitch angle at the tip station, before collective. Linked to root pitch through the total twist.",
    eq: "θ_twist = θ_T − θ_R",
    range: "",
  },
  thTwist: {
    key: "thTwist",
    full: "Total Blade Twist",
    short: "Twist",
    sym: "θ_twist",
    unit: "deg",
    body: "Pitch change from root to tip, linear along the span. Negative twist (nose-down toward the tip) evens out the inflow and improves hover efficiency.",
    eq: "θ_twist = θ_tip − θ_root",
    range: "-20° to 0° (typical -8° to -14°)",
  },
  airfoil: {
    key: "airfoil",
    full: "Airfoil Section",
    short: "Airfoil",
    sym: "",
    unit: "–",
    body: "Blade section from the airfoil database. It provides the lift-curve slope and the profile drag coefficient.",
    eq: "C_l = a_0·α,  C_d = C_d0",
    range: "",
  },
  a0: {
    key: "a0",
    full: "Lift-Curve Slope",
    short: "Lift Slope",
    sym: "a_0",
    unit: "1/rad",
    body: "Section lift per radian of angle of attack. Thin-airfoil theory gives 2π, real blade sections give less.",
    eq: "C_l = a_0 (α − α_0)",
    range: "5.0 to 6.3 per rad",
  },
  Cd0: {
    key: "Cd0",
    full: "Profile Drag Coefficient",
    short: "Profile Drag",
    sym: "C_d0",
    unit: "–",
    body: "Constant section drag coefficient at low angle of attack. Drives the profile power.",
    eq: "C_d = C_d0",
    range: "0.006 to 0.012",
  },
  tipModel: {
    key: "tipModel",
    full: "Tip-Loss Model",
    short: "Tip Loss",
    sym: "",
    unit: "–",
    body: "How the loss of lift near the blade tip is modeled. None integrates the loading to the tip. Fixed cuts the loading at a user factor B. Sissingh derives B from the thrust coefficient.",
    eq: "x_max = B",
    range: "",
  },
  B: {
    key: "B",
    full: "Tip-Loss Factor",
    short: "Tip Factor",
    sym: "B",
    unit: "–",
    body: "Radial station beyond which the blade carries no lift. 1 means no tip loss. In Sissingh mode it is calculated, in Fixed mode you set it.",
    eq: "Sissingh: B = 1 − √(2C_T) / N_b",
    range: "0.92 to 1.00",
  },
  comp: {
    key: "comp",
    full: "Compressibility Correction",
    short: "Compressibility",
    sym: "",
    unit: "–",
    body: "Off keeps the lift-curve slope constant. Prandtl-Glauert raises it with the local Mach number (evaluated at 0.75R, capped at M = 0.85).",
    eq: "a = a_0 / √(1 − M²)",
    range: "",
  },

  // Conditions
  h: {
    key: "h",
    full: "Pressure Altitude",
    short: "Altitude",
    sym: "h",
    unit: "m",
    body: "Altitude in the International Standard Atmosphere. Sets pressure, density and speed of sound together with temperature.",
    eq: "ρ = p / (R_gas·T_amb)",
    range: "0 to 6000 m",
  },
  T0: {
    key: "T0",
    full: "Ambient Temperature",
    short: "Temperature",
    sym: "T_amb",
    unit: "°C",
    body: "Static air temperature at the rotor. Used with altitude pressure to get air density.",
    eq: "ρ = p / (R_gas·T_amb)",
    range: "-40 to 50 °C",
  },
  mu: {
    key: "mu",
    full: "Advance Ratio",
    short: "Advance Ratio",
    sym: "μ_x",
    unit: "–",
    body: "Forward speed along the disk plane divided by tip speed. 0 is hover. One of two equivalent ways to enter horizontal flow.",
    eq: "μ_x = V_x / (ΩR)",
    range: "0 to 0.5",
  },
  Vx: {
    key: "Vx",
    full: "Forward Airspeed",
    short: "Airspeed",
    sym: "V_x",
    unit: "m/s",
    body: "Airspeed component in the rotor disk plane. Alternative to the advance ratio.",
    eq: "V_x = μ_x·ΩR",
    range: "0 to 100 m/s",
  },
  alpha: {
    key: "alpha",
    full: "Disk Angle of Attack",
    short: "Disk AoA",
    sym: "α",
    unit: "deg",
    body: "Angle between oncoming flow and the rotor disk. Positive when relative flow is upward through the disk, tilting the disk aft and increasing thrust.",
    eq: "μ_z = −μ_x·tan α",
    range: "-20° to 20°",
  },
  Vz: {
    key: "Vz",
    full: "Climb Speed",
    short: "Climb Speed",
    sym: "V_z",
    unit: "m/s",
    body: "Axial component of airspeed along the rotor shaft (+Z axis). Positive when relative flow is downward through the disk.",
    eq: "V_z = μ_z·ΩR",
    range: "-10 to 10 m/s",
  },
  muz: {
    key: "muz",
    full: "Axial Flow Ratio",
    short: "Axial Ratio",
    sym: "μ_z",
    unit: "–",
    body: "Non-dimensional axial flow ratio along the rotor shaft, V_z / (ΩR). Positive when relative flow is downward through the disk.",
    eq: "μ_z = V_z / (ΩR) = −μ_x·tan α",
    range: "-0.1 to 0.1",
  },
  trim: {
    key: "trim",
    full: "Trim Mode",
    short: "Trim",
    sym: "",
    unit: "–",
    body: "Chooses how the operating point is solved. None uses the typed collective and speed. Collective trim finds Δθ for the target. Speed trim finds Ω for the target.",
    eq: "T(Δθ, Ω) = T_target",
    range: "",
  },
  rpm: {
    key: "rpm",
    full: "Rotor Speed",
    short: "Rotor Speed",
    sym: "Ω",
    unit: "rpm",
    body: "Rotor rotation rate. Sets the tip speed and the dynamic pressure scale.",
    eq: "ΩR = 2π·rpm·R / 60",
    range: "",
  },
  coll: {
    key: "coll",
    full: "Collective Pitch",
    short: "Collective",
    sym: "Δθ",
    unit: "deg",
    body: "Pitch change applied equally to all blade stations, added to the geometric pitch. Solved automatically when collective trim is on.",
    eq: "θ(x) = θ_root + θ_twist·(x − x_0)/(1 − x_0) + Δθ",
    range: "0° to 20°",
  },
  Ttgt: {
    key: "Ttgt",
    full: "Target Thrust",
    short: "Target Thrust",
    sym: "T",
    unit: "N",
    body: "Thrust the trim must reach. Exclusive with the target thrust coefficient.",
    eq: "T = C_T·ρ·A·(ΩR)²",
    range: "",
  },
  CTtgt: {
    key: "CTtgt",
    full: "Target Thrust Coefficient",
    short: "Target",
    sym: "C_T",
    unit: "–",
    body: "Thrust coefficient the trim must reach. Exclusive with the target thrust.",
    eq: "C_T = T / [ρA(ΩR)²]",
    range: "0.002 to 0.015",
  },
  inflow: {
    key: "inflow",
    full: "Inflow Model",
    short: "Inflow",
    sym: "",
    unit: "–",
    body: "How the induced velocity varies over the disk in forward flight. Uniform is momentum theory. The Coleman and Drees models add a longitudinal and lateral gradient tied to wake skew.",
    eq: "λ_i(x,ψ) = λ_i0 (1 + K_x x cosψ + K_y x sinψ)",
    range: "",
  },
  kind: {
    key: "kind",
    full: "Induced Power Factor",
    short: "Induced Factor",
    sym: "k_ind",
    unit: "–",
    body: "Factor on ideal induced power that accounts for non-uniform inflow and tip losses. 1 is the ideal rotor.",
    eq: "P_i = k_ind·T·v_i",
    range: "1.05 to 1.30",
  },
  drag: {
    key: "drag",
    full: "Profile Drag Integration",
    short: "Drag Integration",
    sym: "",
    unit: "–",
    body: "Method used to integrate the section profile drag over the disk. Numerical integrates blade and azimuth by quadrature.",
    eq: "dD = ½ρ U² c C_d0 dr",
    range: "",
  },

  // Results
  T: {
    key: "T",
    full: "Thrust",
    short: "Thrust",
    sym: "T",
    unit: "N",
    body: "Rotor force along the shaft axis.",
    eq: "T = C_T·ρ·A·(ΩR)²",
    range: "",
  },
  P: {
    key: "P",
    full: "Shaft Power",
    short: "Power",
    sym: "P",
    unit: "W",
    body: "Mechanical power at the rotor shaft.",
    eq: "P = Q·Ω = C_Q·ρ·A·(ΩR)³",
    range: "",
  },
  Pi: {
    key: "Pi",
    full: "Induced Power",
    short: "Induced Power",
    sym: "P_i",
    unit: "W",
    body: "Power spent producing thrust, with the induced power factor applied.",
    eq: "P_i = k_ind·T·v_i",
    range: "",
  },
  P0: {
    key: "P0",
    full: "Profile Power",
    short: "Profile Power",
    sym: "P_0",
    unit: "W",
    body: "Power spent overcoming blade section drag.",
    eq: "P_0 = C_Q0·ρ·A·(ΩR)³",
    range: "",
  },
  Q: {
    key: "Q",
    full: "Shaft Torque",
    short: "Torque",
    sym: "Q",
    unit: "N·m",
    body: "Torque about the rotor shaft.",
    eq: "Q = C_Q·ρ·A·(ΩR)²·R",
    range: "",
  },
  H: {
    key: "H",
    full: "In-Plane Force",
    short: "In-Plane Force",
    sym: "H",
    unit: "N",
    body: "Rotor force in the disk plane, along the flow direction (drag-like). Rigid hub, no flapping.",
    eq: "H = C_H·ρ·A·(ΩR)²",
    range: "",
  },
  Y: {
    key: "Y",
    full: "Side Force",
    short: "Side Force",
    sym: "Y",
    unit: "N",
    body: "Rotor force in the disk plane, perpendicular to the flow. Rigid hub, no flapping.",
    eq: "Y = C_Y·ρ·A·(ΩR)²",
    range: "",
  },
  Mx: {
    key: "Mx",
    full: "Roll Moment",
    short: "Roll Moment",
    sym: "M_x",
    unit: "N·m",
    body: "Hub moment about the longitudinal axis. Rigid hub, no flapping, so the full moment goes into the hub.",
    eq: "M_x = C_Mx·ρ·A·(ΩR)²·R",
    range: "",
  },
  My: {
    key: "My",
    full: "Pitch Moment",
    short: "Pitch Moment",
    sym: "M_y",
    unit: "N·m",
    body: "Hub moment about the lateral axis. Rigid hub, no flapping, so the full moment goes into the hub.",
    eq: "M_y = C_My·ρ·A·(ΩR)²·R",
    range: "",
  },
  Qi: {
    key: "Qi",
    full: "Induced Torque",
    short: "Induced Torque",
    sym: "Q_i",
    unit: "N·m",
    body: "Induced part of the shaft torque, from the induced torque coefficient. Q_i·Ω equals the induced power P_i.",
    eq: "Q_i = C_Qi·ρ·A·(ΩR)²·R",
    range: "",
  },
  Q0: {
    key: "Q0",
    full: "Profile Torque",
    short: "Profile Torque",
    sym: "Q_0",
    unit: "N·m",
    body: "Profile-drag part of the shaft torque, from the integrated profile torque coefficient. Q_0·Ω equals the profile power P_0.",
    eq: "Q_0 = C_Q0·ρ·A·(ΩR)²·R",
    range: "",
  },
  Hi: {
    key: "Hi",
    full: "Induced In-Plane Force",
    short: "Induced In-Plane Force",
    sym: "H_i",
    unit: "N",
    body: "Induced part of the in-plane force, from the backward tilt of the lift vector.",
    eq: "H_i = C_Hi·ρ·A·(ΩR)²",
    range: "",
  },
  H0: {
    key: "H0",
    full: "Profile In-Plane Force",
    short: "Profile In-Plane Force",
    sym: "H_0",
    unit: "N",
    body: "Profile-drag part of the in-plane force, integrated numerically. H = H_i + H_0.",
    eq: "H_0 = C_H0·ρ·A·(ΩR)²",
    range: "",
  },
  Pair: {
    key: "Pair",
    full: "Air Power",
    short: "Air Power",
    sym: "P_air",
    unit: "W",
    body: "Power delivered to the air. The engine computes C_Pair from the energy balance: induced, climb and profile terms plus the profile translational work μ·C_H0. It equals the shaft power plus the work of the in-plane force, P + μ·H·ΩR, so it differs from the shaft power P in forward flight.",
    eq: "P_air = C_Pair·ρ·A·(ΩR)³ = P + μ·H·ΩR",
    range: "",
  },
  DL: {
    key: "DL",
    full: "Disk Loading",
    short: "Disk Loading",
    sym: "T/A",
    unit: "N/m²",
    body: "Thrust per unit disk area. Low disk loading means efficient hover.",
    eq: "DL = T / A",
    range: "50 to 500 N/m² (helicopters)",
  },
  PL: {
    key: "PL",
    full: "Power Loading",
    short: "Power Loading",
    sym: "T/P",
    unit: "N/W",
    body: "Thrust produced per unit of shaft power.",
    eq: "PL = T / P",
    range: "0.05 to 0.15 N/W",
  },
  vi: {
    key: "vi",
    full: "Induced Speed",
    short: "Induced Speed",
    sym: "V_i",
    unit: "m/s",
    body: "Mean momentum induced downwash velocity: v_i = λ_i·ΩR. Positive when induced flow is downward through the disk.",
    eq: "v_i = λ_i·ΩR",
    range: "",
  },
  CT: {
    key: "CT",
    full: "Thrust Coefficient",
    short: "Thrust Coeff.",
    sym: "C_T",
    unit: "–",
    body: "Thrust made non-dimensional by disk area and tip speed.",
    eq: "C_T = T / [ρA(ΩR)²]",
    range: "0.002 to 0.015",
  },
  CQ: {
    key: "CQ",
    full: "Torque Coefficient",
    short: "Torque Coeff.",
    sym: "C_Q",
    unit: "–",
    body: "Torque non-dimensionalized by ρA(ΩR)²R. Equals the power coefficient C_P.",
    eq: "C_Q = Q / [ρA(ΩR)²R] = C_Qi + C_Q0",
    range: "",
  },
  CQi: {
    key: "CQi",
    full: "Induced Torque Coefficient",
    short: "Ind. Torque Coeff.",
    sym: "C_Qi",
    unit: "–",
    body: "Induced part of the torque coefficient.",
    eq: "C_Qi = k_ind·λ_i·C_T",
    range: "",
  },
  CQ0: {
    key: "CQ0",
    full: "Profile Torque Coefficient",
    short: "Prof. Torque Coeff.",
    sym: "C_Q0",
    unit: "–",
    body: "Profile-drag part of the torque coefficient.",
    eq: "C_Q = C_Qi + C_Q0",
    range: "",
  },
  CH: {
    key: "CH",
    full: "In-Plane Force Coefficient",
    short: "In-Plane Coeff.",
    sym: "C_H",
    unit: "–",
    body: "In-plane (drag-like) force coefficient. Sum of induced and profile parts.",
    eq: "C_H = C_Hi + C_H0",
    range: "",
  },
  CHi: {
    key: "CHi",
    full: "Induced In-Plane Force Coefficient",
    short: "Ind. In-Plane Coeff.",
    sym: "C_Hi",
    unit: "–",
    body: "Induced part of the in-plane force coefficient, from the tilt of the lift vector.",
    eq: "C_H = C_Hi + C_H0",
    range: "",
  },
  CH0: {
    key: "CH0",
    full: "Profile In-Plane Force Coefficient",
    short: "Prof. In-Plane Coeff.",
    sym: "C_H0",
    unit: "–",
    body: "Profile-drag part of the in-plane force coefficient.",
    eq: "C_H = C_Hi + C_H0",
    range: "",
  },
  CY: {
    key: "CY",
    full: "Side Force Coefficient",
    short: "Side Force",
    sym: "C_Y",
    unit: "–",
    body: "Side force made non-dimensional like thrust.",
    eq: "C_Y = Y / [ρA(ΩR)²]",
    range: "",
  },
  CMx: {
    key: "CMx",
    full: "Roll Moment Coefficient",
    short: "Roll Moment",
    sym: "C_Mx",
    unit: "–",
    body: "Roll hub moment made non-dimensional. Rigid hub, no flapping.",
    eq: "C_Mx = M_x / [ρA(ΩR)²R]",
    range: "",
  },
  CMy: {
    key: "CMy",
    full: "Pitch Moment Coefficient",
    short: "Pitch Moment",
    sym: "C_My",
    unit: "–",
    body: "Pitch hub moment made non-dimensional. Rigid hub, no flapping.",
    eq: "C_My = M_y / [ρA(ΩR)²R]",
    range: "",
  },
  CPair: {
    key: "CPair",
    full: "Air Power Coefficient",
    short: "Air Power",
    sym: "C_Pair",
    unit: "–",
    body: "Power coefficient from the energy balance: induced, climb and profile terms.",
    eq: "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_P0",
    range: "",
  },
  CLbar: {
    key: "CLbar",
    full: "Mean Lift Coefficient",
    short: "Mean Lift Coefficient",
    sym: "C̄_L",
    unit: "–",
    body: "Average section lift coefficient over the disk that carries the thrust, from the blade loading. A quick stall margin check against the section C_l,max.",
    eq: "C̄_L = 6·C_T / σ_TR",
    range: "0.3 to 0.7",
  },
  Tc: {
    key: "Tc",
    full: "Dynamic Thrust Coefficient",
    short: "Dynamic Thrust Coeff",
    sym: "T_c",
    unit: "–",
    body: "Thrust over the dynamic pressure of the free stream times disk area. Useful when the rotor is treated like a propeller or a lifting surface moving at V. Undefined in hover.",
    eq: "T_c = T / (½ρV²A) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)",
    range: "",
  },
  Pc: {
    key: "Pc",
    full: "Dynamic Power Coefficient",
    short: "Dynamic Power Coeff",
    sym: "P_c",
    unit: "–",
    body: "Shaft power over ½ρV³A for the free-stream speed V. Undefined in hover.",
    eq: "P_c = P / (½ρV³A) = 2C_P / μ_∞³,  V = √(V_x² + V_z²)",
    range: "",
  },
  CTs: {
    key: "CTs",
    full: "Blade Loading",
    short: "Blade Loading",
    sym: "C_T/σ_TR",
    unit: "–",
    body: "Thrust coefficient per unit solidity. Indicates how hard the blades work; stall limits it near 0.12 to 0.15.",
    eq: "C_T / σ",
    range: "0.05 to 0.12",
  },
  FM: {
    key: "FM",
    full: "Figure of Merit (hover only)",
    short: "Figure of Merit",
    sym: "FM",
    unit: "–",
    body: "Ratio of ideal to actual hover power. Defined only in hover; forward flight uses effective L/D instead.",
    eq: "FM = C_T^1.5 / (√2·C_P)",
    range: "0.55 to 0.80",
  },
  LDe: {
    key: "LDe",
    full: "Effective Lift/Drag Ratio",
    short: "Eff. Lift/Drag",
    sym: "(L/D)_e",
    unit: "–",
    body: "Rotor lift times speed over power in forward flight. Zero in hover.",
    eq: "(L/D)_e = μ·C_T / C_Pair",
    range: "4 to 10",
  },
  lam: {
    key: "lam",
    full: "Total Inflow Ratio",
    short: "Inflow Ratio",
    sym: "λ",
    unit: "–",
    body: "Total rotor inflow ratio normal to the disk (+Z axis): λ = μ_z + λ_i. Positive when total flow is downward through the disk.",
    eq: "λ = μ_z + λ_i",
    range: "",
  },
  lami: {
    key: "lami",
    full: "Induced Inflow Ratio",
    short: "Induced Inflow",
    sym: "λ_i",
    unit: "–",
    body: "Non-dimensional induced velocity ratio: λ_i = v_i / (ΩR). Positive when induced flow is downward through the disk. Solved iteratively to balance blade-element thrust with actuator disk momentum flux.",
    eq: "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)",
    range: "0.03 to 0.08 (hover)",
  },
  lamh: {
    key: "lamh",
    full: "Hover Inflow Ratio",
    short: "Hover Inflow",
    sym: "λ_h",
    unit: "–",
    body: "Induced inflow ratio an ideal rotor would have in hover at the current thrust coefficient. Reference scale for the inflow: λ_i / λ_h shows how far forward or axial flow has relieved the induced velocity.",
    eq: "λ_h = √(C_T / 2)",
    range: "0.03 to 0.08",
  },
  muLam: {
    key: "muLam",
    full: "Advance-to-Inflow Ratio",
    short: "Advance/Inflow",
    sym: "μ/λ",
    unit: "–",
    body: "In-plane flow over total axial inflow. Zero in hover and growing as the wake skews toward the disk plane. It sets the wake skew angle that drives the inflow gradients.",
    eq: "μ/λ = μ_x / (μ_z + λ_i)",
    range: "0 to 20",
  },
  Kx: {
    key: "Kx",
    full: "Longitudinal Inflow Gradient",
    short: "Long. Gradient",
    sym: "K_x",
    unit: "–",
    body: "Fore-aft slope of the induced inflow over the disk, set by the inflow model and wake skew.",
    eq: "Coleman: K_x = tan(χ/2)",
    range: "",
  },
  Ky: {
    key: "Ky",
    full: "Lateral Inflow Gradient",
    short: "Lat. Gradient",
    sym: "K_y",
    unit: "–",
    body: "Side-to-side slope of the induced inflow over the disk.",
    eq: "Drees: K_y = −2μ",
    range: "",
  },
  chi: {
    key: "chi",
    full: "Wake Skew Angle",
    short: "Wake Skew",
    sym: "χ",
    unit: "deg",
    body: "Angle of the wake from the shaft axis. 0° is hover, close to 90° at high speed.",
    eq: "χ = atan(μ / λ)",
    range: "0° to 90°",
  },
  Bres: {
    key: "Bres",
    full: "Tip-Loss Factor",
    short: "Tip Factor",
    sym: "B",
    unit: "–",
    body: "Tip-loss factor used in this solution.",
    eq: "Sissingh: B = 1 − √(2C_T) / N_b",
    range: "0.92 to 1.00",
  },
  OmR: {
    key: "OmR",
    full: "Tip Speed",
    short: "Tip Speed",
    sym: "ΩR",
    unit: "m/s",
    body: "Speed of the blade tip in hover.",
    eq: "ΩR = 2π·rpm·R / 60",
    range: "150 to 250 m/s (helicopters)",
  },
  Mtip: {
    key: "Mtip",
    full: "Tip Mach",
    short: "Tip Mach",
    sym: "M_tip",
    unit: "–",
    body: "Tip speed over local speed of sound.",
    eq: "M_tip = ΩR / a",
    range: "0.4 to 0.7",
  },
  Madv: {
    key: "Madv",
    full: "Advancing Tip Mach",
    short: "Adv. Mach",
    sym: "M_adv",
    unit: "–",
    body: "Mach number of the advancing blade tip. Compressibility effects start near 0.8 to 0.9.",
    eq: "M_adv = (ΩR + V_x) / a",
    range: "up to 0.9",
  },
  rho: {
    key: "rho",
    full: "Air Density",
    short: "Density",
    sym: "ρ",
    unit: "kg/m³",
    body: "Air density from the standard atmosphere and the temperature entered.",
    eq: "ρ = p / (R_gas·T_amb)",
    range: "0.9 to 1.225 kg/m³",
  },
  p: {
    key: "p",
    full: "Ambient Pressure",
    short: "Pressure",
    sym: "p",
    unit: "Pa",
    body: "Static pressure at the pressure altitude.",
    eq: "p = p_0 (1 − L·h / T_0)^5.256",
    range: "",
  },
  a: {
    key: "a",
    full: "Speed of Sound",
    short: "Sound Speed",
    sym: "a",
    unit: "m/s",
    body: "Local speed of sound at the ambient temperature.",
    eq: "a = √(γ·R_gas·T_amb)",
    range: "",
  },
  Vztot: {
    key: "Vztot",
    full: "Total Axial Speed",
    short: "Total Axial Speed",
    sym: "V_{z,tot}",
    unit: "m/s",
    body: "Total flow velocity through the rotor disk: V_{z,tot} = V_z + v_i = λ·ΩR. Positive when total flow is downward through the disk.",
    eq: "V_{z,tot} = V_z + v_i = λ ΩR",
    range: "",
  },
  Vadv: {
    key: "Vadv",
    full: "Advancing Speed",
    short: "Advancing Speed",
    sym: "V_adv",
    unit: "m/s",
    body: "Tangential relative speed at the advancing blade tip, r/R = 1 and ψ = 90°. Excludes the axial component.",
    eq: "V_adv = ΩR + V_x",
    range: "",
  },
  Vret: {
    key: "Vret",
    full: "Retreating Speed",
    short: "Retreating Speed",
    sym: "V_ret",
    unit: "m/s",
    body: "Signed tangential relative speed at the retreating blade tip, r/R = 1 and ψ = 270°. Excludes the axial component.",
    eq: "V_ret = ΩR − V_x",
    range: "",
  },
  Mret: {
    key: "Mret",
    full: "Retreating Mach",
    short: "Retreating Mach",
    sym: "M_ret",
    unit: "–",
    body: "Magnitude of retreating tip tangential speed divided by sound speed. Same tangential convention as Advancing Mach.",
    eq: "M_ret = |ΩR − V_x| / a",
    range: "",
  },
  aoaAdv25: {
    key: "aoaAdv25",
    full: "Advancing AoA 25%",
    short: "Adv. AoA 25%",
    sym: "α_{adv,25}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.25 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.",
    eq: "α_s = θ(0.25) − φ",
    range: "",
  },
  aoaRet25: {
    key: "aoaRet25",
    full: "Retreating AoA 25%",
    short: "Ret. AoA 25%",
    sym: "α_{ret,25}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.25 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.",
    eq: "α_s = θ(0.25) − φ",
    range: "",
  },
  phiAdv25: {
    key: "phiAdv25",
    full: "Advancing Inflow Angle 25%",
    short: "Adv. Inflow 25%",
    sym: "φ_{adv,25}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.25 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  phiRet25: {
    key: "phiRet25",
    full: "Retreating Inflow Angle 25%",
    short: "Ret. Inflow 25%",
    sym: "φ_{ret,25}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.25 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  aoaAdv50: {
    key: "aoaAdv50",
    full: "Advancing AoA 50%",
    short: "Adv. AoA 50%",
    sym: "α_{adv,50}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.50 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.",
    eq: "α_s = θ(0.50) − φ",
    range: "",
  },
  aoaRet50: {
    key: "aoaRet50",
    full: "Retreating AoA 50%",
    short: "Ret. AoA 50%",
    sym: "α_{ret,50}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.50 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.",
    eq: "α_s = θ(0.50) − φ",
    range: "",
  },
  phiAdv50: {
    key: "phiAdv50",
    full: "Advancing Inflow Angle 50%",
    short: "Adv. Inflow 50%",
    sym: "φ_{adv,50}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.50 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  phiRet50: {
    key: "phiRet50",
    full: "Retreating Inflow Angle 50%",
    short: "Ret. Inflow 50%",
    sym: "φ_{ret,50}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.50 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  aoaAdv75: {
    key: "aoaAdv75",
    full: "Advancing AoA 75%",
    short: "Adv. AoA 75%",
    sym: "α_{adv,75}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.75 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.",
    eq: "α_s = θ(0.75) − φ",
    range: "",
  },
  aoaRet75: {
    key: "aoaRet75",
    full: "Retreating AoA 75%",
    short: "Ret. AoA 75%",
    sym: "α_{ret,75}",
    unit: "deg",
    body: "Blade-section angle of attack at r/R = 0.75 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.",
    eq: "α_s = θ(0.75) − φ",
    range: "",
  },
  phiAdv75: {
    key: "phiAdv75",
    full: "Advancing Inflow Angle 75%",
    short: "Adv. Inflow 75%",
    sym: "φ_{adv,75}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.75 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  phiRet75: {
    key: "phiRet75",
    full: "Retreating Inflow Angle 75%",
    short: "Ret. Inflow 75%",
    sym: "φ_{ret,75}",
    unit: "deg",
    body: "Local inflow angle at r/R = 0.75 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  aoaAdvTip: {
    key: "aoaAdvTip",
    full: "Advancing AoA Tip",
    short: "Adv. AoA Tip",
    sym: "α_{adv,tip}",
    unit: "deg",
    body: "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.",
    eq: "α_s = θ(1.0) − φ",
    range: "",
  },
  aoaRetTip: {
    key: "aoaRetTip",
    full: "Retreating AoA Tip",
    short: "Ret. AoA Tip",
    sym: "α_{ret,tip}",
    unit: "deg",
    body: "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.",
    eq: "α_s = θ(1.0) − φ",
    range: "",
  },
  phiAdvTip: {
    key: "phiAdvTip",
    full: "Advancing Inflow Angle Tip",
    short: "Adv. Inflow Tip",
    sym: "φ_{adv,tip}",
    unit: "deg",
    body: "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
  phiRetTip: {
    key: "phiRetTip",
    full: "Retreating Inflow Angle Tip",
    short: "Ret. Inflow Tip",
    sym: "φ_{ret,tip}",
    unit: "deg",
    body: "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.",
    eq: "φ = atan2(u_P, u_T)",
    range: "",
  },
};

/**
 * Format string replacing underscores with HTML subscripts (e.g. C_T -> C<sub>T</sub>, V_{z,tot} -> V<sub>z,tot</sub>)
 */
export function formatSubscripts(text: string): string {
  if (!text) return "";
  return text.replace(/_\{([^}]+)\}|_([A-Za-z0-9]+)/g, (_, g1, g2) => `<sub>${g1 || g2}</sub>`);
}

Object.assign(CANONICAL_NOMENCLATURE, APK_NOMENCLATURE);

export function getNomenclature(key: string): NomenclatureEntry | undefined {
  if (CANONICAL_NOMENCLATURE[key]) return CANONICAL_NOMENCLATURE[key];

  // Try matching by common aliases
  const lower = key.toLowerCase();
  for (const entry of Object.values(CANONICAL_NOMENCLATURE)) {
    if (
      entry.key.toLowerCase() === lower ||
      entry.full.toLowerCase() === lower ||
      entry.short.toLowerCase() === lower ||
      entry.sym.toLowerCase() === lower
    ) {
      return entry;
    }
  }
  return undefined;
}

export function formatDescriptionSymbol(key: string, level: "L" | "M" | "S"): string {
  const item = getNomenclature(key);
  if (!item) return key;

  const desc = level === "L" ? item.full : item.short;
  if (level === "S" || !item.sym || item.sym === "–") {
    return desc;
  }
  return `${desc} ${item.sym}`;
}

export function getResponsiveInputLabel(fullText: string, width: number): string {
  if (width <= 360) {
    switch (fullText) {
      case "Rotor Name": return "Name";
      case "Nominal Speed":
      case "Nominal Rotor Speed":
      case "Nominal Speed Ω_nom": return "Ω_nom";
      case "Radius R": return "R";
      case "Blade Count": return "Nb";
      case "Root Cutout": return "r₀/R";
      case "Root Chord":
      case "Root Chord c0": return "Chord c₀";
      case "Tip Chord":
      case "Tip Chord c1": return "Chord c₁";
      case "Reference Solidity":
      case "Ref. Solidity":
      case "Geometric Solidity":
      case "Geom. Solidity": return "Ref. Solidity";
      case "Actual Solidity": return "Actual Solidity";
      case "Thrust Solidity": return "Thrust Solidity";
      case "Disk Area": return "A";
      case "Reference Blade Area":
      case "Reference Area":
      case "Ref. Area":
      case "Geometric Blade Area":
      case "Geometric Area": return "Ab";
      case "Actual Blade Area":
      case "Actual Area":
      case "Active Blade Area": return "Aact";
      case "Total Twist": return "Δθ";
      case "Taper Ratio": return "c₁/c₀";
      case "Aspect Ratio": return "AR";
      case "Lift Slope a0": return "a₀";
      case "Profile cd0":
      case "Profile Cd0": return "cd₀";
      case "Tip Factor B":
      case "Fixed Tip Factor B": return "Factor B";
      case "Altitude": return "Altitude";
      case "Temperature": return "Tamb";
      case "Trim Mode":
      case "Trim":
      case "Trim Condition": return "Trim";
      case "Collective Δθ": return "Δθ";
      case "Target CT":
      case "Target":
      case "Target C_T": return "Target C_T";
      case "Target Thrust": return "Target T";
      case "Induced Factor kind":
      case "K_ind": return "kind";
      case "Inflow Model": return "Inflow";
      case "Compressibility": return "Comp.";
      case "Profile Drag": return "Drag";
      default: return fullText;
    }
  }
  if (width <= 430) {
    switch (fullText) {
      case "Rotor Name": return "Name";
      case "Nominal Speed":
      case "Nominal Rotor Speed":
      case "Nominal Speed Ω_nom": return "Nominal Speed Ω_nom";
      case "Blade Count": return "Blade Count Nb";
      case "Root Cutout": return "Cutout r₀/R";
      case "Root Chord":
      case "Root Chord c0": return "Root Chord c₀";
      case "Tip Chord":
      case "Tip Chord c1": return "Tip Chord c₁";
      case "Reference Solidity":
      case "Ref. Solidity":
      case "Geometric Solidity":
      case "Geom. Solidity": return "Ref. Solidity";
      case "Aspect Ratio": return "AR";
      case "Root Pitch":
      case "Root Incidence": return "Root Pitch";
      case "Tip Pitch":
      case "Tip Incidence": return "Tip Pitch";
      case "Actual Solidity": return "Actual Solidity";
      case "Thrust Solidity": return "Thrust Solidity";
      case "Reference Blade Area":
      case "Reference Area":
      case "Ref. Area":
      case "Geometric Blade Area":
      case "Geometric Area": return "Ref Blade Ab";
      case "Actual Blade Area":
      case "Actual Area":
      case "Active Blade Area": return "Active Aact";
      case "Total Twist": return "Total Twist Δθ";
      case "Taper Ratio": return "Taper c₁/c₀";
      case "Lift Slope a0": return "Lift Slope a₀";
      case "Profile cd0":
      case "Profile Cd0": return "Profile cd₀";
      case "Tip Factor B":
      case "Fixed Tip Factor B": return "Tip Factor B";
      case "Temperature": return "Temperature";
      case "Trim Mode":
      case "Trim":
      case "Trim Condition": return "Trim";
      case "Collective Δθ": return "Collective Δθ";
      case "Target CT":
      case "Target":
      case "Target C_T": return "Target C_T";
      case "Target Thrust": return "Target Thrust T";
      case "Induced Factor kind":
      case "K_ind": return "Induced kind";
      case "Inflow Model": return "Inflow";
      case "Compressibility": return "Compress.";
      default: return fullText;
    }
  }
  return fullText;
}

export function getResultDisplayLabel(canonical: string, width: number): string {
  if (width <= 360) {
    const cut = canonical.indexOf(" — ");
    if (cut > 0) return canonical.substring(0, cut);
    // Also handle format "Description Symbol"
    const entry = getNomenclature(canonical);
    if (entry && entry.sym && entry.sym !== "–") {
      return entry.sym.replace(/_/g, "");
    }
    return canonical;
  }
  if (width <= 430) {
    switch (canonical) {
      case "μx — Advance Ratio": return "μx — Adv. Ratio";
      case "Pshaft — Shaft Power": return "Pshaft — Power";
      case "CT — Thrust Coeff": return "CT — Thrust";
      case "CQ — Torque Coeff": return "CQ — Torque";
      case "CQ,i — Induced Coeff": return "CQ,i — Induced";
      case "CQ,0 — Profile Coeff": return "CQ,0 — Profile";
      case "CH,i — Induced H": return "CH,i — Induced";
      case "CH,0 — Profile H": return "CH,0 — Profile";
      case "CP,air — Air Power":
      case "CP,air — Air Power Coeff": return "CP,air — Power";
      case "FM — Figure of Merit": return "FM — Merit";
      case "(L/D)eff — Effective L/D": return "(L/D)eff";
      case "Kx — Longitudinal Inflow": return "Kx — Long. Inflow";
      case "Ky — Lateral Inflow": return "Ky — Lat. Inflow";
      case "χ — Wake Skew Angle": return "χ — Wake Skew";
      case "RPM — Solved Speed": return "RPM — Solved";
      case "θ0 — Solved Collective": return "θ0 — Solved";
      case "Δθ — Collective Increment": return "Δθ — Collective";
      case "CT — Trimmed": return "CT — Trimmed";
      case "T — Trimmed Thrust": return "T — Trimmed";
      case "α — Angle of Attack": return "α — AoA";
      case "Mtip — Tip Mach": return "Mtip — Mach";
      case "Madv — Advancing Mach": return "Madv — Adv. Mach";
      case "h — Altitude": return "h — Altitude";
      case "Tamb — Temperature": return "Tamb — Temp.";
      default: return canonical;
    }
  }
  return canonical;
}

// ====================================================================
// AUTHORITATIVE B4A MULTI-LEVEL FITTING SYSTEM (RotorNames.bas)
// ====================================================================

export const ABBREVIATIONS: Record<string, string> = {
  "R": "Radius",
  "Nb": "Blades",
  "x0": "Root Cutout",
  "c0": "Root Chord",
  "c1": "Tip Chord",
  "taper": "Taper",
  "sigmaRef": "Ref. Solidity",
  "sigmaAct": "Act. Solidity",
  "sigmaT": "Thr. Solidity",
  "AR": "Aspect",
  "A": "Disk Area",
  "Ab": "Ref. Area",
  "Aact": "Act. Area",
  "thRoot": "Root Pitch",
  "thTip": "Tip Pitch",
  "thTwist": "Twist",
  "th75": "Pitch 75%",
  "a0": "Lift Slope",
  "Cd0": "Prof. Drag",
  "B": "Tip Factor",
  "rpmNom": "Rot. Speed",
  "h": "Altitude",
  "T0": "Temperature",
  "mu": "Adv. Ratio",
  "Vx": "Airspeed",
  "alpha": "Disk AoA",
  "Vz": "Climb Speed",
  "muz": "Axial Ratio",
  "rpm": "Rot. Speed",
  "coll": "Collective",
  "Ttgt": "Target Thrust",
  "CTtgt": "Target",
  "kind": "Ind. Factor",
  "T": "Thrust",
  "P": "Power",
  "Pi": "Ind. Power",
  "P0": "Prof. Power",
  "Q": "Torque",
  "H": "In-Plane Force",
  "Y": "Side Force",
  "Mx": "Roll Moment",
  "My": "Pitch Moment",
  "DL": "Disk Loading",
  "PL": "Power Loading",
  "vi": "Ind. Speed",
  "CT": "Thrust",
  "CQ": "Torque",
  "CQi": "Ind. Torque",
  "CQ0": "Prof. Torque",
  "CH": "In-Plane",
  "CHi": "Ind. In-Plane",
  "CH0": "Prof. In-Plane",
  "CY": "Side Force",
  "CMx": "Roll Moment",
  "CMy": "Pitch Moment",
  "CPair": "Air Power",
  "CTs": "Blade Load",
  "CLbar": "Mean Lift",
  "FM": "FM",
  "LDe": "Eff. L/D",
  "lam": "Inflow Ratio",
  "lami": "Ind. Inflow",
  "lamh": "Hover Inflow",
  "muLam": "Advance/Inflow",
  "Tc": "Dyn Thrust Coeff",
  "Pc": "Dyn Power Coeff",
  "Mtip": "Tip Mach",
  "Madv": "Adv. Mach",
  "OmR": "Tip Speed",
  "rho": "Density",
  "p": "Pressure",
  "a": "Sound Speed",
  "Bres": "Tip Factor",
  "chi": "Wake Skew",
  "Qi": "Ind. Torque",
  "Q0": "Prof. Torque",
  "Hi": "Ind. In-Plane Force",
  "H0": "Prof. In-Plane Force",
  "Pair": "Air Power",
  "comp": "Compres.",
  "drag": "Integration",
  "Vztot": "Axial Speed",
  "Vadv": "Adv. Speed",
  "Vret": "Ret. Speed",
  "Mret": "Ret. Mach",
  "aoaAdv25": "Adv. AoA 25",
  "aoaRet25": "Ret. AoA 25",
  "phiAdv25": "Adv. Inflow 25",
  "phiRet25": "Ret. Inflow 25",
  "aoaAdv50": "Adv. AoA 50",
  "aoaRet50": "Ret. AoA 50",
  "phiAdv50": "Adv. Inflow 50",
  "phiRet50": "Ret. Inflow 50",
  "aoaAdv75": "Adv. AoA 75",
  "aoaRet75": "Ret. AoA 75",
  "phiAdv75": "Adv. Inflow 75",
  "phiRet75": "Ret. Inflow 75",
  "aoaAdvTip": "Adv. AoA Tip",
  "aoaRetTip": "Ret. AoA Tip",
  "phiAdvTip": "Adv. Inflow Tip",
  "phiRetTip": "Ret. Inflow Tip",
};

export const NARROW_NAMES: Record<string, string> = {
  "AR": "Aspect",
  "CTtgt": "Target",
  "CTs": "Blade Load",
  "LDe": "Eff. L/D",
  "T0": "Temp.",
  "CT": "Thrust",
  "CQ": "Torque",
  "CQi": "Ind. Torque",
  "CQ0": "Prof. Torque",
  "CH": "In-Plane",
  "CHi": "Ind. In-Plane",
  "CH0": "Prof. In-Plane",
  "Hi": "Ind. In-Plane",
  "H0": "Prof. In-Plane",
};

export const MINIMUM_NAMES: Record<string, string> = {
  "comp": "Comp.",
  "drag": "Integ.",
};

export const GEOM_KEYS = [
  "rpmNom", "R", "Nb", "x0", "c0", "c1", "taper", "AR",
  "sigmaRef", "sigmaAct", "sigmaT", "A", "Ab", "Aact",
  "thRoot", "thTip", "thTwist", "airfoil", "a0", "Cd0",
  "tipModel", "B", "comp"
];

export const COND_KEYS = [
  "h", "T0", "mu", "Vx", "alpha", "Vz", "muz",
  "trim", "rpm", "coll", "CTtgt", "Ttgt", "inflow", "kind", "drag"
];

export const RES_KEYS = [
  "T", "H", "Hi", "H0", "Y",
  "Q", "Qi", "Q0", "Mx", "My",
  "P", "Pi", "P0", "Pair",
  "DL", "PL", "CTs", "FM", "LDe",
  "CT", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair", "CLbar", "Tc", "Pc",
  "lam", "lami", "lamh", "vi", "Vztot", "muz", "Vz", "alpha", "muLam", "Kx", "Ky", "chi", "Bres",
  "mu", "Vx", "OmR", "Mtip", "Vadv", "Madv", "Vret", "Mret",
  "aoaAdv25", "aoaRet25", "aoaAdv50", "aoaRet50", "aoaAdv75", "aoaRet75", "aoaAdvTip", "aoaRetTip",
  "phiAdv25", "phiRet25", "phiAdv50", "phiRet50", "phiAdv75", "phiRet75", "phiAdvTip", "phiRetTip",
  "rpm", "coll", "h", "T0", "rho", "p", "a"
];

/**
 * Level 0 = Full + Symbol
 * Level 1 = Short + Symbol
 * Level 2 = Short
 * Level 3 = Abbreviation + Symbol
 * Level 4 = Symbol only (or abbreviation if no symbol)
 */
export function getPlainLabel(key: string, level: number): string {
  const item = CANONICAL_NOMENCLATURE[key];
  if (!item) return key;
  const s = item.sym && item.sym !== "–" && item.sym !== "-" ? item.sym : "";
  switch (level) {
    case 0:
      return s ? `${item.full} ${s}` : item.full;
    case 1:
      return s ? `${item.short} ${s}` : item.short;
    case 2: {
      const narrow = NARROW_NAMES[key] || ABBREVIATIONS[key] || item.short;
      return !s || narrow === s ? narrow : `${narrow} ${s}`;
    }
    case 3: {
      const a = ABBREVIATIONS[key] || item.short;
      if (!s || a === s) return a;
      return `${a} ${s}`;
    }
    default:
      if (s) return s;
      return MINIMUM_NAMES[key] || ABBREVIATIONS[key] || item.short;
  }
}

/**
 * Result-specific plain label matching RotorNames.ResultPlainLabel
 */
export function resultPlainLabel(key: string, level: number): string {
  const item = CANONICAL_NOMENCLATURE[key];
  if (!item) return key;
  const sym = item.sym && item.sym !== "–" && item.sym !== "-" ? item.sym : "";
  let caption = item.full;
  if (level === 1) caption = item.short;
  if (level === 3) caption = ABBREVIATIONS[key] || item.short;
  if (level === 2) caption = NARROW_NAMES[key] || ABBREVIATIONS[key] || item.short;
  if (level === 4) return sym || MINIMUM_NAMES[key] || ABBREVIATIONS[key] || item.short;
  if (!sym) return caption;
  return `${caption} ${sym}`;
}

/**
 * Result label HTML with subscripts matching RotorNames.ResultLabel (levels 0 -> 1 -> 3 -> 4)
 */
export function resultLabelHtml(key: string, widthPx: number, fontSizePx = 15.5): string {
  for (const level of [0, 1, 3, 2, 4]) {
    const caption = resultPlainLabel(key, level);
    if (measureTextWidth(caption, fontSizePx) <= widthPx) {
      return formatSubscripts(caption);
    }
  }
  const item = CANONICAL_NOMENCLATURE[key];
  const sym = item?.sym && item.sym !== "–" && item.sym !== "-" ? item.sym : (item?.short || key);
  return formatSubscripts(sym);
}

/**
 * Renders subscripts with real HTML <sub> tags
 */
export function getRichLabelHtml(key: string, level: number, suffix = ""): string {
  const plain = getPlainLabel(key, level);
  const formatted = formatSubscripts(plain);
  if (!suffix) return formatted;
  return `${formatted}<span class="label-suffix">${suffix}</span>`;
}

/**
 * Next level in the fit order: 0 (L) -> 1 (M) -> 3 (A) -> 2 (S) -> 4 (symbol)
 */
export function nextLevel(level: number): number {
  switch (level) {
    case 0: return 1;
    case 1: return 3;
    case 3: return 2;
    case 2: return 4;
    default: return -1;
  }
}

let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

export function measureTextWidth(text: string, fontSizePx: number, fontWeight = "bold"): number {
  if (typeof document === "undefined") {
    // Fallback for SSR/testing environments without DOM
    return text.replace(/_\{([^}]+)\}|_([A-Za-z0-9]+)/g, "$1$2").length * fontSizePx * 0.62;
  }
  if (!measureCanvas) {
    measureCanvas = document.createElement("canvas");
    measureCtx = measureCanvas.getContext("2d");
  }
  if (!measureCtx) {
    return text.replace(/_\{([^}]+)\}|_([A-Za-z0-9]+)/g, "$1$2").length * fontSizePx * 0.62;
  }
  measureCtx.font = `${fontWeight} ${fontSizePx}px "RotorRoboto", Roboto, sans-serif`;
  const subRegex = /_\{([^}]+)\}|_([A-Za-z0-9]+)/g;
  let total = 0;
  let prev = 0;
  let match: RegExpExecArray | null;
  while ((match = subRegex.exec(text)) !== null) {
    const mainPart = text.slice(prev, match.index);
    if (mainPart) {
      measureCtx.font = `${fontWeight} ${fontSizePx}px "RotorRoboto", Roboto, sans-serif`;
      total += measureCtx.measureText(mainPart).width;
    }
    const subText = match[1] || match[2];
    measureCtx.font = `${fontWeight} ${fontSizePx * 0.72}px "RotorRoboto", Roboto, sans-serif`;
    total += measureCtx.measureText(subText).width;
    prev = match.index + match[0].length;
  }
  const remaining = text.slice(prev);
  if (remaining) {
    measureCtx.font = `${fontWeight} ${fontSizePx}px "RotorRoboto", Roboto, sans-serif`;
    total += measureCtx.measureText(remaining).width;
  }
  return total;
}

/**
 * First level (fit order L, M, A, S, symbol) at which ALL labels fit on ONE line of availableWidthPx at 13px floor
 */
export function chooseLevel(keys: string[], availableWidthPx: number, startLevel = 1): number {
  let level = startLevel;
  while (level >= 0) {
    let ok = true;
    for (const k of keys) {
      if (measureTextWidth(getPlainLabel(k, level), 13) > availableWidthPx) {
        ok = false;
        break;
      }
    }
    if (ok) return level;
    level = nextLevel(level);
  }
  return 4;
}

/**
 * Largest font size in [minPx, maxPx] at which every label of the chosen level fits on one line
 */
export function fitLabelSize(
  keys: string[],
  level: number,
  availableWidthPx: number,
  maxPx = 15.5,
  minPx = 13
): number {
  let sz = maxPx;
  while (sz > minPx) {
    let ok = true;
    for (const k of keys) {
      if (measureTextWidth(getPlainLabel(k, level), sz) > availableWidthPx) {
        ok = false;
        break;
      }
    }
    if (ok) return sz;
    sz -= 0.5;
  }
  return minPx;
}

