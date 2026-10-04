// Generated from RotorNames.bas by scripts/sync-nomenclature.mjs.
export const APK_NOMENCLATURE = {
  "name": {
    "key": "name",
    "full": "Rotor Name",
    "short": "Name",
    "sym": "",
    "unit": "",
    "body": "Identifier of the saved rotor. It appears in the rotor list, in exports, and in the active-rotor bar.",
    "eq": "",
    "range": ""
  },
  "R": {
    "key": "R",
    "full": "Rotor Radius",
    "short": "Radius",
    "sym": "R",
    "unit": "m",
    "body": "Distance from the rotation axis to the blade tip. Defines swept disk area A_DISK and tip speed ΩR.\n\nEditing this value rescales both root and tip chords by the same factor, preserving solidity, taper ratio, and aspect ratio.",
    "eq": "A_DISK = πR²,  ΩR = 2π·rpm·R / 60",
    "range": "0.05 m (small drone) to 12 m (heavy helicopter)"
  },
  "Nb": {
    "key": "Nb",
    "full": "Blade Count",
    "short": "Blades",
    "sym": "N_b",
    "unit": "–",
    "body": "Number of identical blades around the rotor hub.\n\nEditing this value scales solidity in direct proportion because blade chords remain fixed.\n\nBlade count also enters the Sissingh tip-loss factor.",
    "eq": "σ_REF = N_b·(c_R + c_T) / (2πR)",
    "range": "2 to 8"
  },
  "x0": {
    "key": "x0",
    "full": "Root Cutout",
    "short": "Root Cutout",
    "sym": "x_0",
    "unit": "–",
    "body": "Inboard non-dimensional radial station x = r/R where aerodynamic blade loading starts. Aerodynamic integration runs from x_0 to the tip, producing zero lift and profile drag inboard.\n\nEditing this value keeps root and tip chords and reference solidity σ_REF unchanged. Actual blade area A_act, actual solidity σ_act, and thrust-weighted solidity σ_TR update accordingly.\n\nThe blade pitch distribution is anchored at x_0.",
    "eq": "x_0 = r_root / R",
    "range": "0.05 to 0.30"
  },
  "c0": {
    "key": "c0",
    "full": "Root Chord",
    "short": "Root Chord",
    "sym": "c_R",
    "unit": "m",
    "body": "Chord of the fictitious linear planform at the rotation axis (x = 0), obtained by extending the linear chord distribution inward. The physical blade begins at root cutout station x_0, so this is not the physical chord at the cutout.\n\nEditing this value recalculates reference blade area A_REF, reference solidity σ_REF, aspect ratio AR, and taper ratio.",
    "eq": "c(x) = c_R + (c_T − c_R)·x",
    "range": "0.02 to 0.8 m"
  },
  "c1": {
    "key": "c1",
    "full": "Tip Chord",
    "short": "Tip Chord",
    "sym": "c_T",
    "unit": "m",
    "body": "Chord at the blade tip (x = 1). Equal to root chord c_R for a rectangular blade.\n\nEditing this value recalculates reference blade area A_REF, reference solidity σ_REF, aspect ratio AR, and taper ratio.",
    "eq": "c(x) = c_R + (c_T − c_R)·x",
    "range": "0.02 to 0.8 m"
  },
  "taper": {
    "key": "taper",
    "full": "Taper Ratio",
    "short": "Taper",
    "sym": "c_T/c_R",
    "unit": "–",
    "body": "Ratio of tip chord to axis chord: taper = c_T / c_R. A taper ratio of 1.0 represents a rectangular blade.\n\nEditing this value preserves the mean chord c_m = (c_R + c_T)/2 and reference solidity σ_REF, updating root chord c_R and tip chord c_T proportionally.",
    "eq": "taper = c_T / c_R",
    "range": "0.3 to 1.0"
  },
  "sigmaRef": {
    "key": "sigmaRef",
    "full": "Reference Solidity",
    "short": "Reference Solidity",
    "sym": "σ_REF",
    "unit": "–",
    "body": "Total reference blade area of all blades extended to the rotation axis (x = 0), divided by swept disk area A_DISK. This is the reference solidity used in the analytical aerodynamic equations.\n\nEditing this value scales root and tip chords by the same factor, preserving taper ratio and aspect ratio.",
    "eq": "σ_REF = N_b·A_REF / A_DISK",
    "range": "0.05 to 0.15"
  },
  "sigmaAct": {
    "key": "sigmaAct",
    "full": "Actual Solidity",
    "short": "Actual Solidity",
    "sym": "σ_act",
    "unit": "–",
    "body": "Actual physical blade area from root cutout station x_0 to the blade tip, divided by swept disk area A_DISK. Informational quantity, because root cutout effects enter the equations directly through the lower integration limit.\n\nEditing this value scales root and tip chords uniformly, preserving taper ratio.",
    "eq": "σ_act = N_b·A_act / A_DISK",
    "range": "0.05 to 0.15"
  },
  "sigmaT": {
    "key": "sigmaT",
    "full": "Thrust-Weighted Solidity",
    "short": "Thrust Solidity",
    "sym": "σ_TR",
    "unit": "–",
    "body": "Blade solidity weighted by radial dynamic pressure weighting x², reflecting where rotor thrust is predominantly generated along the blade span. Used to evaluate blade loading C_T/σ_TR and mean lift coefficient C̄_L.\n\nEditing this value scales root and tip chords uniformly, preserving taper ratio.",
    "eq": "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1",
    "range": "0.05 to 0.15"
  },
  "AR": {
    "key": "AR",
    "full": "Aspect Ratio",
    "short": "Aspect Ratio",
    "sym": "AR",
    "unit": "–",
    "body": "Rotor blade aspect ratio, defined as rotor radius squared over reference blade area: AR = R² / A_REF = 2R / (c_R + c_T).\n\nEditing this value scales root and tip chords by AR_old / AR_new, preserving rotor radius R and taper ratio.",
    "eq": "AR = R² / A_REF = 2R / (c_R + c_T)",
    "range": "6 to 25"
  },
  "A": {
    "key": "A",
    "full": "Disk Area",
    "short": "Disk Area",
    "sym": "A_DISK",
    "unit": "m²",
    "body": "Total swept disk area of the rotor: A_DISK = πR².\n\nEditing this value updates rotor radius R to √(A_DISK / π) and scales root and tip chords proportionally, preserving solidity and taper ratio.",
    "eq": "A_DISK = πR²",
    "range": ""
  },
  "Ab": {
    "key": "Ab",
    "full": "Reference Blade Area",
    "short": "Reference Area",
    "sym": "A_REF",
    "unit": "m²",
    "body": "Planform area of one blade of the fictitious linear planform extended to the rotation axis (x = 0): A_REF = R·(c_R + c_T) / 2. This reference blade area defines reference solidity σ_REF.\n\nEditing this value scales root and tip chords by the same factor, preserving taper ratio and rotor radius R.",
    "eq": "A_REF = ∫ c dr, 0 to R = R·(c_R + c_T)/2",
    "range": ""
  },
  "Aact": {
    "key": "Aact",
    "full": "Actual Blade Area",
    "short": "Actual Area",
    "sym": "A_act",
    "unit": "m²",
    "body": "Actual physical planform area of one blade, integrated from root cutout station x_0 to the blade tip: A_act = R·(1 − x_0)·(c_root + c_T) / 2.\n\nEditing this value scales root and tip chords by the same factor, preserving taper ratio.",
    "eq": "A_act = ∫ c dr, x_0R to R",
    "range": ""
  },
  "thRoot": {
    "key": "thRoot",
    "full": "Root Pitch",
    "short": "Root Pitch",
    "sym": "θ_R",
    "unit": "°",
    "body": "Geometric blade pitch angle at the root cutout station x_0, before collective pitch is applied.\n\nEditing this value updates total blade twist θ_twist while keeping tip pitch θ_T unchanged.",
    "eq": "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ",
    "range": ""
  },
  "thTip": {
    "key": "thTip",
    "full": "Tip Pitch",
    "short": "Tip Pitch",
    "sym": "θ_T",
    "unit": "°",
    "body": "Geometric blade pitch angle at the blade tip (x = 1), before collective pitch is applied.\n\nEditing this value updates total blade twist θ_twist while keeping root pitch θ_R unchanged.",
    "eq": "θ_twist = θ_T − θ_R",
    "range": ""
  },
  "thTwist": {
    "key": "thTwist",
    "full": "Total Blade Twist",
    "short": "Twist",
    "sym": "θ_twist",
    "unit": "°",
    "body": "Linear pitch variation along the blade span, from root cutout station x_0 to the blade tip: θ_twist = θ_T − θ_R.\n\nEditing this value preserves the mean pitch (θ_R + θ_T)/2 and splits the pitch variation equally between root and tip.\n\nNegative twist produces a more uniform induced inflow distribution across the rotor disk and improves hover efficiency.",
    "eq": "θ_twist = θ_T − θ_R",
    "range": "-20° to 0° (typical -8° to -14°)"
  },
  "th75": {
    "key": "th75",
    "full": "Three-Quarter Pitch",
    "short": "Pitch 75%",
    "sym": "θ_75",
    "unit": "°",
    "body": "Reference blade pitch angle at 75% radial station (r/R = 0.75), the standard reference station for linearly twisted helicopter blades: θ_75 = θ_R + 0.75·θ_twist.\n\nEditing this value translates the entire blade pitch distribution uniformly, preserving total twist θ_twist.",
    "eq": "θ_75 = θ_R + 0.75·θ_twist",
    "range": ""
  },
  "airfoil": {
    "key": "airfoil",
    "full": "Airfoil Section",
    "short": "Airfoil",
    "sym": "",
    "unit": "",
    "body": "Blade aerodynamic section from the database, defining lift-curve slope a_0 and zero-lift profile drag coefficient C_d0.\n\nSelect Custom to specify independent aerodynamic section characteristics.",
    "eq": "C_l = a_0·α_e,  C_d = C_d0",
    "range": ""
  },
  "a0": {
    "key": "a0",
    "full": "Lift-Curve Slope",
    "short": "Lift Slope",
    "sym": "a_0",
    "unit": "1/rad",
    "body": "Two-dimensional blade section lift-curve slope dC_l/dα in linear unstalled flight. Thin-airfoil theory predicts 2π rad⁻¹ (≈ 6.28 rad⁻¹); real rotor airfoils typically exhibit 5.7 to 6.0 rad⁻¹.\n\nSubsonic compressibility scales this value via the Prandtl-Glauert rule when enabled.",
    "eq": "C_l = a_0·α_e",
    "range": "5.0 to 6.3 per rad"
  },
  "Cd0": {
    "key": "Cd0",
    "full": "Profile Drag Coefficient",
    "short": "Profile Drag",
    "sym": "C_d0",
    "unit": "–",
    "body": "Equivalent zero-lift profile drag coefficient of the blade section, assumed uniform across the rotor disk.\n\nDetermines profile torque Q_0 and profile in-plane force H_0.",
    "eq": "C_d = C_d0",
    "range": "0.008 to 0.012"
  },
  "tipModel": {
    "key": "tipModel",
    "full": "Tip-Loss Model",
    "short": "Tip Loss",
    "sym": "",
    "unit": "",
    "body": "Tip-loss formulation modeling finite-blade lift reduction near the blade tip:\n\n• None: Integrates blade loading across the full span to the physical tip (x = 1.0).\n\n• Fixed: Truncates lift integration at a prescribed radial station B.\n\n• Sissingh: Computes effective factor B iteratively from operating thrust coefficient C_T and blade count N_b.",
    "eq": "lift integrated from x_0 to B",
    "range": ""
  },
  "B": {
    "key": "B",
    "full": "Tip-Loss Factor",
    "short": "Tip Factor",
    "sym": "B",
    "unit": "–",
    "body": "Non-dimensional radial station (r/R) beyond which blade aerodynamic lift is zero due to tip vortex relief. A factor of 1.0 indicates no tip loss.\n\nEffective actuator disk momentum area is scaled by B².",
    "eq": "Sissingh: B = 1 − √(2C_T) / N_b",
    "range": "0.92 to 1.00"
  },
  "comp": {
    "key": "comp",
    "full": "Compressibility Correction",
    "short": "Compressibility",
    "sym": "",
    "unit": "",
    "body": "ON: Prandtl-Glauert compressibility correction enabled. Scales the 2D lift-curve slope with the representative blade Mach number at 0.75R: a = a_0 / √(1 − M²), capped at M = 0.85. Increases thrust and power requirements as tip Mach increases. Valid for subsonic flow (M_adv < 1.0).\n\nOFF: Incompressible aerodynamics (M = 0 baseline). Lift-curve slope remains constant at a_0 along the entire blade radius regardless of tip Mach number.",
    "eq": "a = a_0 / √(1 − M²)",
    "range": "M_adv < 1.0"
  },
  "rpmNom": {
    "key": "rpmNom",
    "full": "Rotor Speed",
    "short": "Rotor Speed",
    "sym": "Ω_nom",
    "unit": "rpm",
    "body": "Nominal design rotational speed stored with the rotor definition. Seeds the initial rotor speed on the Conditions page.",
    "eq": "Ω = 2π·rpm / 60",
    "range": ""
  },
  "h": {
    "key": "h",
    "full": "Pressure Altitude",
    "short": "Altitude",
    "sym": "h",
    "unit": "m",
    "body": "Pressure altitude in the International Standard Atmosphere (ISA), determining ambient static pressure p.\n\nAir density ρ is calculated from p and ambient temperature T_amb using the ideal gas law.",
    "eq": "p = 101325·(1 − 0.0065·h / 288.15)^{5.2559}",
    "range": "0 to 6000 m"
  },
  "T0": {
    "key": "T0",
    "full": "Ambient Temperature",
    "short": "Temperature",
    "sym": "T_amb",
    "unit": "°C",
    "body": "Ambient static air temperature. Specified independently of altitude to model non-standard atmospheric conditions (e.g. hot-and-high).\n\nDetermines ambient air density ρ and local speed of sound a.",
    "eq": "ρ = p / (287.058·T),  a = √(1.4·287.058·T),  T in kelvin",
    "range": "-40 to 50 °C"
  },
  "mu": {
    "key": "mu",
    "full": "Advance Ratio",
    "short": "Advance Ratio",
    "sym": "μ_x",
    "unit": "–",
    "body": "Advance ratio in the rotor disk plane (tip-path plane), defined as in-plane free-stream airspeed over tip speed: μ_x = V_x / (ΩR).\n\nStatic hover corresponds to μ_x = 0.",
    "eq": "μ_x = V_x / (ΩR)",
    "range": "0 to 0.5"
  },
  "Vx": {
    "key": "Vx",
    "full": "Forward Airspeed",
    "short": "Airspeed",
    "sym": "V_x",
    "unit": "m/s",
    "body": "Component of the free-stream airspeed parallel to the rotor disk plane. Alternative to the advance ratio: μ_x = V_x / (ΩR).",
    "eq": "V_x = μ_x·ΩR",
    "range": "0 to 100 m/s"
  },
  "alpha": {
    "key": "alpha",
    "full": "Disk Angle of Attack",
    "short": "Disk AoA",
    "sym": "α",
    "unit": "°",
    "body": "Angle between oncoming flow and the rotor disk. Positive when relative flow is upward through the disk, tilting the disk aft and increasing thrust.",
    "eq": "μ_z = −μ_x·tan α",
    "range": "-20° to 20°"
  },
  "Vz": {
    "key": "Vz",
    "full": "Climb Speed",
    "short": "Climb Speed",
    "sym": "V_z",
    "unit": "m/s",
    "body": "Axial component of airspeed along the rotor shaft (+Z axis). Positive when relative flow is downward through the disk.",
    "eq": "V_z = μ_z·ΩR",
    "range": "-10 to 10 m/s"
  },
  "muz": {
    "key": "muz",
    "full": "Axial Flow Ratio",
    "short": "Axial Ratio",
    "sym": "μ_z",
    "unit": "–",
    "body": "Non-dimensional axial flow ratio along the rotor shaft, V_z / (ΩR). Positive when relative flow is downward through the disk.",
    "eq": "μ_z = V_z / (ΩR) = −μ_x·tan α",
    "range": "-0.1 to 0.1"
  },
  "trim": {
    "key": "trim",
    "full": "Trim Mode",
    "short": "Trim",
    "sym": "",
    "unit": "–",
    "body": "Rotor equilibrium couples four operational variables: rotor speed Ω, collective pitch Δθ, thrust coefficient C_T, and rotor thrust T.\n\nPrescribe two variables as constraints. The solver calculates the remaining two variables from blade-element momentum equilibrium across the specified forward and axial flight conditions.",
    "eq": "T = C_T·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "rpm": {
    "key": "rpm",
    "full": "Rotor Speed",
    "short": "Rotor Speed",
    "sym": "Ω",
    "unit": "rpm",
    "body": "Rotational speed of the rotor hub. Determines tip speed ΩR, dynamic pressure, and blade Mach numbers. Solved by the trim algorithm when not prescribed.",
    "eq": "ΩR = 2π·rpm·R / 60",
    "range": ""
  },
  "coll": {
    "key": "coll",
    "full": "Collective Pitch",
    "short": "Collective",
    "sym": "Δθ",
    "unit": "°",
    "body": "Collective pitch increment added uniformly along the blade span to the baseline geometric twist distribution. Solved by bisection equilibrium when not prescribed.",
    "eq": "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ",
    "range": "0° to 20°"
  },
  "Ttgt": {
    "key": "Ttgt",
    "full": "Target Thrust",
    "short": "Target Thrust",
    "sym": "T",
    "unit": "N",
    "body": "Target rotor thrust constraint enforced during equilibrium trim solution. Paired with one other prescribed operating variable.",
    "eq": "T = C_T·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "CTtgt": {
    "key": "CTtgt",
    "full": "Target Thrust Coefficient",
    "short": "Target",
    "sym": "C_T",
    "unit": "–",
    "body": "Target thrust coefficient constraint enforced during equilibrium trim solution. Paired with collective pitch Δθ, rotor speed Ω, or target thrust T.",
    "eq": "C_T = T / [ρ·A_DISK·(ΩR)²]",
    "range": "0.002 to 0.015"
  },
  "inflow": {
    "key": "inflow",
    "full": "Inflow Model",
    "short": "Inflow",
    "sym": "",
    "unit": "",
    "body": "How the induced velocity is distributed across the rotor disk:\n\n• Uniform: Constant induced inflow across the entire disk from momentum theory. No gradients (K_x = K_y = 0); no hub moments or side force.\n\n• Coleman: Adds a longitudinal inflow gradient K_x = tan(χ/2) based on the wake skew angle χ. Lateral gradient is zero.\n\n• Coleman-Feingold (NDARC): Longitudinal gradient with factor 15π/32 on tan(χ/2), plus a lateral inflow gradient K_y = −2μ.\n\n• Drees: Speed-dependent longitudinal gradient K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2) and lateral gradient K_y = −2μ. Classic helicopter reference.",
    "eq": "λ_d(x,ψ) = λ + λ_i·x·(K_x·cosψ + K_y·sinψ)",
    "range": ""
  },
  "kind": {
    "key": "kind",
    "full": "Induced Power Factor",
    "short": "Induced Factor",
    "sym": "k_ind",
    "unit": "–",
    "body": "Empirical induced power correction factor accounting for non-uniform downwash, tip losses, and wake swirl. Ideal momentum theory corresponds to k_ind = 1.0.\n\nScales the ideal induced torque in the energy balance: C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi.",
    "eq": "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi",
    "range": "1.05 to 1.30"
  },
  "drag": {
    "key": "drag",
    "full": "Profile Drag Integration",
    "short": "Drag Integration",
    "sym": "",
    "unit": "",
    "body": "Integration formulation for profile drag power over the rotor disk:\n\n• Tangential: Closed form retaining only in-plane tangential velocity u_T. Fast, least detailed.\n\n• Vectorial: Closed form including radial and axial velocities.\n\n• Numerical: Evaluates total resultant velocity W via Gauss-Legendre quadrature (16 radial × 24 azimuth stations). Reference method.",
    "eq": "dD = ½ρ W² c C_d0 dr",
    "range": ""
  },
  "T": {
    "key": "T",
    "full": "Thrust",
    "short": "Thrust",
    "sym": "T",
    "unit": "N",
    "body": "Total aerodynamic force along the rotor shaft axis, positive upward along −Z. Evaluated from the thrust coefficient as T = C_T·ρ·A_DISK·(ΩR)².",
    "eq": "T = C_T·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "P": {
    "key": "P",
    "full": "Shaft Power",
    "short": "Power",
    "sym": "P",
    "unit": "W",
    "body": "Total mechanical shaft power required to drive the rotor: P = Q·Ω.\n\nDecomposed via energy balance into induced power P_i and profile power P_0.",
    "eq": "P = Q·Ω = C_Q·ρ·A_DISK·(ΩR)³",
    "range": ""
  },
  "Pi": {
    "key": "Pi",
    "full": "Induced Power",
    "short": "Induced Power",
    "sym": "P_i",
    "unit": "W",
    "body": "Shaft power required to generate rotor thrust and support climb/propulsive work. Derived from the induced torque coefficient C_Qi through the blade-element energy balance.",
    "eq": "P_i = C_Qi·ρ·A_DISK·(ΩR)³",
    "range": ""
  },
  "P0": {
    "key": "P0",
    "full": "Profile Power",
    "short": "Profile Power",
    "sym": "P_0",
    "unit": "W",
    "body": "Shaft power dissipated by section profile drag over the rotor disk. Derived from the integrated profile torque coefficient C_Q0.",
    "eq": "P_0 = C_Q0·ρ·A_DISK·(ΩR)³",
    "range": ""
  },
  "Q": {
    "key": "Q",
    "full": "Shaft Torque",
    "short": "Torque",
    "sym": "Q",
    "unit": "N·m",
    "body": "Aerodynamic shaft torque opposing rotor rotation. Sum of induced torque Q_i and profile torque Q_0: Q = C_Q·ρ·A_DISK·(ΩR)²·R.",
    "eq": "Q = C_Q·ρ·A_DISK·(ΩR)²·R",
    "range": ""
  },
  "H": {
    "key": "H",
    "full": "In-Plane Force",
    "short": "In-Plane Force",
    "sym": "H",
    "unit": "N",
    "body": "In-plane rotor force component parallel to the in-plane free stream, positive aft (opposing flight direction). Rigid-rotor formulation; equals the total longitudinal hub force.",
    "eq": "H = C_H·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "Y": {
    "key": "Y",
    "full": "Side Force",
    "short": "Side Force",
    "sym": "Y",
    "unit": "N",
    "body": "In-plane rotor force component perpendicular to the in-plane free stream, positive toward the advancing side (right side for counter-clockwise rotation). Zero under axisymmetric uniform inflow.",
    "eq": "Y = C_Y·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "Mx": {
    "key": "Mx",
    "full": "Roll Moment",
    "short": "Roll Moment",
    "sym": "M_x",
    "unit": "N·m",
    "body": "Aerodynamic roll moment about the rotor hub, positive advancing side down (right-wing down). Transmitted directly to the shaft in a rigid-rotor model without flapping hinges.",
    "eq": "M_x = C_Mx·ρ·A_DISK·(ΩR)²·R",
    "range": ""
  },
  "My": {
    "key": "My",
    "full": "Pitch Moment",
    "short": "Pitch Moment",
    "sym": "M_y",
    "unit": "N·m",
    "body": "Aerodynamic pitching moment about the rotor hub, positive nose-up. Transmitted directly to the shaft in a rigid-rotor model; non-zero only with asymmetric longitudinal inflow gradients.",
    "eq": "M_y = C_My·ρ·A_DISK·(ΩR)²·R",
    "range": ""
  },
  "DL": {
    "key": "DL",
    "full": "Disk Loading",
    "short": "Disk Loading",
    "sym": "T/A_DISK",
    "unit": "N/m²",
    "body": "Rotor thrust per unit swept disk area: DL = T / A_DISK.\n\nLower disk loading reduces momentum induced velocity and improves hover power efficiency.",
    "eq": "DL = T / A_DISK",
    "range": "50 to 500 N/m² (helicopters)"
  },
  "PL": {
    "key": "PL",
    "full": "Power Loading",
    "short": "Power Loading",
    "sym": "T/P",
    "unit": "N/W",
    "body": "Rotor thrust produced per unit shaft power: PL = T / P.\n\nClassical measure of rotor lifting efficiency per unit installed engine power.",
    "eq": "PL = T / P",
    "range": "0.05 to 0.15 N/W"
  },
  "Vztot": {
    "key": "Vztot",
    "full": "Total Axial Speed",
    "short": "Total Axial Speed",
    "sym": "V_{z,tot}",
    "unit": "m/s",
    "body": "Total flow velocity through the rotor disk: V_{z,tot} = V_z + v_i = λ·ΩR. Positive when total flow is downward through the disk.",
    "eq": "V_{z,tot} = V_z + v_i = λ ΩR",
    "range": ""
  },
  "Vadv": {
    "key": "Vadv",
    "full": "Advancing Speed",
    "short": "Advancing Speed",
    "sym": "V_adv",
    "unit": "m/s",
    "body": "Tangential relative speed at the advancing blade tip, r/R = 1 and ψ = 90°. Excludes the axial component.",
    "eq": "V_adv = ΩR + V_x",
    "range": ""
  },
  "Vret": {
    "key": "Vret",
    "full": "Retreating Speed",
    "short": "Retreating Speed",
    "sym": "V_ret",
    "unit": "m/s",
    "body": "Signed tangential relative speed at the retreating blade tip, r/R = 1 and ψ = 270°. Excludes the axial component.",
    "eq": "V_ret = ΩR − V_x",
    "range": ""
  },
  "Mret": {
    "key": "Mret",
    "full": "Retreating Mach",
    "short": "Retreating Mach",
    "sym": "M_ret",
    "unit": "–",
    "body": "Magnitude of retreating tip tangential speed divided by sound speed. Same tangential convention as Advancing Mach.",
    "eq": "M_ret = |ΩR − V_x| / a",
    "range": ""
  },
  "aoaAdv25": {
    "key": "aoaAdv25",
    "full": "Advancing AoA 25%",
    "short": "Adv. AoA 25%",
    "sym": "α_{adv,25}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.25 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.",
    "eq": "α_s = θ(0.25) − φ",
    "range": ""
  },
  "aoaRet25": {
    "key": "aoaRet25",
    "full": "Retreating AoA 25%",
    "short": "Ret. AoA 25%",
    "sym": "α_{ret,25}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.25 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.",
    "eq": "α_s = θ(0.25) − φ",
    "range": ""
  },
  "phiAdv25": {
    "key": "phiAdv25",
    "full": "Advancing Inflow Angle 25%",
    "short": "Adv. Inflow 25%",
    "sym": "φ_{adv,25}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.25 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "phiRet25": {
    "key": "phiRet25",
    "full": "Retreating Inflow Angle 25%",
    "short": "Ret. Inflow 25%",
    "sym": "φ_{ret,25}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.25 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "aoaAdv50": {
    "key": "aoaAdv50",
    "full": "Advancing AoA 50%",
    "short": "Adv. AoA 50%",
    "sym": "α_{adv,50}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.50 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.",
    "eq": "α_s = θ(0.50) − φ",
    "range": ""
  },
  "aoaRet50": {
    "key": "aoaRet50",
    "full": "Retreating AoA 50%",
    "short": "Ret. AoA 50%",
    "sym": "α_{ret,50}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.50 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.",
    "eq": "α_s = θ(0.50) − φ",
    "range": ""
  },
  "phiAdv50": {
    "key": "phiAdv50",
    "full": "Advancing Inflow Angle 50%",
    "short": "Adv. Inflow 50%",
    "sym": "φ_{adv,50}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.50 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "phiRet50": {
    "key": "phiRet50",
    "full": "Retreating Inflow Angle 50%",
    "short": "Ret. Inflow 50%",
    "sym": "φ_{ret,50}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.50 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "aoaAdv75": {
    "key": "aoaAdv75",
    "full": "Advancing AoA 75%",
    "short": "Adv. AoA 75%",
    "sym": "α_{adv,75}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.75 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.",
    "eq": "α_s = θ(0.75) − φ",
    "range": ""
  },
  "aoaRet75": {
    "key": "aoaRet75",
    "full": "Retreating AoA 75%",
    "short": "Ret. AoA 75%",
    "sym": "α_{ret,75}",
    "unit": "deg",
    "body": "Blade-section angle of attack at r/R = 0.75 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.",
    "eq": "α_s = θ(0.75) − φ",
    "range": ""
  },
  "phiAdv75": {
    "key": "phiAdv75",
    "full": "Advancing Inflow Angle 75%",
    "short": "Adv. Inflow 75%",
    "sym": "φ_{adv,75}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.75 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "phiRet75": {
    "key": "phiRet75",
    "full": "Retreating Inflow Angle 75%",
    "short": "Ret. Inflow 75%",
    "sym": "φ_{ret,75}",
    "unit": "deg",
    "body": "Local inflow angle at r/R = 0.75 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "aoaAdvTip": {
    "key": "aoaAdvTip",
    "full": "Advancing AoA Tip",
    "short": "Adv. AoA Tip",
    "sym": "α_{adv,tip}",
    "unit": "deg",
    "body": "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.",
    "eq": "α_s = θ(1.0) − φ",
    "range": ""
  },
  "aoaRetTip": {
    "key": "aoaRetTip",
    "full": "Retreating AoA Tip",
    "short": "Ret. AoA Tip",
    "sym": "α_{ret,tip}",
    "unit": "deg",
    "body": "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.",
    "eq": "α_s = θ(1.0) − φ",
    "range": ""
  },
  "phiAdvTip": {
    "key": "phiAdvTip",
    "full": "Advancing Inflow Angle Tip",
    "short": "Adv. Inflow Tip",
    "sym": "φ_{adv,tip}",
    "unit": "deg",
    "body": "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "phiRetTip": {
    "key": "phiRetTip",
    "full": "Retreating Inflow Angle Tip",
    "short": "Ret. Inflow Tip",
    "sym": "φ_{ret,tip}",
    "unit": "deg",
    "body": "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.",
    "eq": "φ = atan2(u_P, u_T)",
    "range": ""
  },
  "vi": {
    "key": "vi",
    "full": "Induced Speed",
    "short": "Induced Speed",
    "sym": "V_i",
    "unit": "m/s",
    "body": "Mean momentum induced downwash velocity: v_i = λ_i·ΩR. Positive when induced flow is downward through the disk.",
    "eq": "v_i = λ_i·ΩR",
    "range": ""
  },
  "CT": {
    "key": "CT",
    "full": "Thrust Coefficient",
    "short": "Thrust Coeff.",
    "sym": "C_T",
    "unit": "–",
    "body": "Non-dimensional rotor thrust coefficient: C_T = T / [ρ·A_DISK·(ΩR)²].\n\nComputed from spanwise blade-element integration in equilibrium with actuator disk momentum theory.",
    "eq": "C_T = T / [ρ·A_DISK·(ΩR)²]",
    "range": "0.002 to 0.015"
  },
  "CQ": {
    "key": "CQ",
    "full": "Torque Coefficient",
    "short": "Torque Coeff.",
    "sym": "C_Q",
    "unit": "–",
    "body": "Non-dimensional rotor shaft torque coefficient: C_Q = Q / [ρ·A_DISK·(ΩR)²·R].\n\nIdentically equals the rotor power coefficient C_P.",
    "eq": "C_Q = Q / [ρ·A_DISK·(ΩR)²·R] = C_Qi + C_Q0 = C_P",
    "range": ""
  },
  "CQi": {
    "key": "CQi",
    "full": "Induced Torque Coefficient",
    "short": "Ind. Torque Coeff.",
    "sym": "C_Qi",
    "unit": "–",
    "body": "Induced and axial-flight component of the torque coefficient from global energy conservation: C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi.",
    "eq": "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi",
    "range": ""
  },
  "Qi": {
    "key": "Qi",
    "full": "Induced Torque",
    "short": "Induced Torque",
    "sym": "Q_i",
    "unit": "N·m",
    "body": "Induced shaft torque component, evaluated from the induced torque coefficient: Q_i = C_Qi·ρ·A_DISK·(ΩR)²·R. Q_i·Ω equals induced power P_i.",
    "eq": "Q_i = C_Qi·ρ·A_DISK·(ΩR)²·R",
    "range": ""
  },
  "Q0": {
    "key": "Q0",
    "full": "Profile Torque",
    "short": "Profile Torque",
    "sym": "Q_0",
    "unit": "N·m",
    "body": "Profile drag shaft torque component, evaluated from the integrated profile torque coefficient: Q_0 = C_Q0·ρ·A_DISK·(ΩR)²·R. Q_0·Ω equals profile power P_0.",
    "eq": "Q_0 = C_Q0·ρ·A_DISK·(ΩR)²·R",
    "range": ""
  },
  "Hi": {
    "key": "Hi",
    "full": "Induced In-Plane Force",
    "short": "Induced In-Plane Force",
    "sym": "H_i",
    "unit": "N",
    "body": "Induced component of the in-plane hub force, resulting from the rearward tilt of the section lift vectors by local inflow: H_i = C_Hi·ρ·A_DISK·(ΩR)².",
    "eq": "H_i = C_Hi·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "H0": {
    "key": "H0",
    "full": "Profile In-Plane Force",
    "short": "Profile In-Plane Force",
    "sym": "H_0",
    "unit": "N",
    "body": "Profile drag component of the in-plane hub force, integrated over the rotor disk: H_0 = C_H0·ρ·A_DISK·(ΩR)². Total in-plane force is H = H_i + H_0.",
    "eq": "H_0 = C_H0·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "Pair": {
    "key": "Pair",
    "full": "Air Power",
    "short": "Air Power",
    "sym": "P_air",
    "unit": "W",
    "body": "Total aerodynamic rate of work delivered to the airflow: P_air = P + μ·H·ΩR.\n\nSum of shaft power and propulsive work of the in-plane hub force.",
    "eq": "P_air = C_Pair·ρ·A_DISK·(ΩR)³ = P + μ·H·ΩR",
    "range": ""
  },
  "CQ0": {
    "key": "CQ0",
    "full": "Profile Torque Coefficient",
    "short": "Prof. Torque Coeff.",
    "sym": "C_Q0",
    "unit": "–",
    "body": "Profile drag component of the rotor torque coefficient, integrated over blade span and azimuth using the local resultant velocity.",
    "eq": "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π",
    "range": ""
  },
  "CH": {
    "key": "CH",
    "full": "In-Plane Force Coefficient",
    "short": "In-Plane Coeff.",
    "sym": "C_H",
    "unit": "–",
    "body": "Total in-plane hub force coefficient, positive rearward (drag direction): C_H = C_Hi + C_H0.",
    "eq": "C_H = C_Hi + C_H0",
    "range": ""
  },
  "CHi": {
    "key": "CHi",
    "full": "Induced In-Plane Force Coefficient",
    "short": "Ind. In-Plane Coeff.",
    "sym": "C_Hi",
    "unit": "–",
    "body": "Induced component of the in-plane force coefficient, resulting from the rearward tilt of section lift vectors by the local inflow angle.",
    "eq": "C_Hi = (a/4)·[λ·μ·Θ_0 + λ_1s·(Θ_2 − 2λ·I_1)]",
    "range": ""
  },
  "CH0": {
    "key": "CH0",
    "full": "Profile In-Plane Force Coefficient",
    "short": "Prof. In-Plane Coeff.",
    "sym": "C_H0",
    "unit": "–",
    "body": "Profile drag component of the in-plane force coefficient, integrated over blade radius and azimuth using the local relative velocity.",
    "eq": "C_H0 = ∬ (σ·C_d0/2)·W·(x·sinψ + μ) dx dψ / 2π",
    "range": ""
  },
  "CY": {
    "key": "CY",
    "full": "Side Force Coefficient",
    "short": "Side Force",
    "sym": "C_Y",
    "unit": "–",
    "body": "Side force coefficient directed toward the advancing blade (+Y). Arises from longitudinal inflow asymmetry across the rotor disk.",
    "eq": "C_Y = −(a/4)·K_x·λ_i·(Θ_2 − 2λ·I_1)",
    "range": ""
  },
  "CMx": {
    "key": "CMx",
    "full": "Roll Moment Coefficient",
    "short": "Roll Moment",
    "sym": "C_Mx",
    "unit": "–",
    "body": "Non-dimensional hub rolling moment coefficient, positive advancing side down. Evaluated for a rigid rotor without flapping hinges.",
    "eq": "C_Mx = −(a·μ/2)·(Θ_2 − ½λ·I_1) + (a/4)·λ_1s·I_3",
    "range": ""
  },
  "CMy": {
    "key": "CMy",
    "full": "Pitch Moment Coefficient",
    "short": "Pitch Moment",
    "sym": "C_My",
    "unit": "–",
    "body": "Non-dimensional hub pitching moment coefficient, positive nose-up. Evaluated for a rigid rotor; driven by the longitudinal inflow gradient K_x.",
    "eq": "C_My = (a/4)·K_x·λ_i·I_3",
    "range": ""
  },
  "CPair": {
    "key": "CPair",
    "full": "Air Power Coefficient",
    "short": "Air Power",
    "sym": "C_Pair",
    "unit": "–",
    "body": "Total air power coefficient from energy conservation: C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0 = C_P + μ·C_H.",
    "eq": "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0",
    "range": ""
  },
  "CTs": {
    "key": "CTs",
    "full": "Blade Loading",
    "short": "Blade Loading",
    "sym": "C_T/σ_TR",
    "unit": "–",
    "body": "Rotor blade loading coefficient: C_T / σ_TR. Characterizes mean aerodynamic lift demand per blade. Blade stall typically limits maximum values to 0.12–0.15.",
    "eq": "C_T / σ_TR",
    "range": "0.05 to 0.12"
  },
  "CLbar": {
    "key": "CLbar",
    "full": "Mean Lift Coefficient",
    "short": "Mean Lift Coefficient",
    "sym": "C̄_L",
    "unit": "–",
    "body": "Mean rotor blade lift coefficient, evaluated from thrust-weighted blade loading: C̄_L = 6·C_T / σ_TR. Provides stall margin comparison against airfoil C_l,max.",
    "eq": "C̄_L = 6·C_T / σ_TR",
    "range": "0.3 to 0.7"
  },
  "FM": {
    "key": "FM",
    "full": "Figure of Merit (hover only)",
    "short": "Figure of Merit",
    "sym": "FM",
    "unit": "–",
    "body": "Rotor Figure of Merit in hover, defined as the ratio of ideal minimum induced power to actual shaft power: FM = (C_T^{1.5} / √2) / C_P.",
    "eq": "FM = (C_T^{1.5}/√2) / (k_ind·C_T^{1.5}/√2 + C_Q0)",
    "range": "0.55 to 0.80"
  },
  "LDe": {
    "key": "LDe",
    "full": "Effective Lift/Drag Ratio",
    "short": "Eff. Lift/Drag",
    "sym": "(L/D)_e",
    "unit": "–",
    "body": "Effective rotor lift-to-drag ratio in translational flight: (L/D)_e = V_x·T / P_air = μ·C_T / C_Pair. Measure of cruise aerodynamic transport efficiency.",
    "eq": "(L/D)_e = μ·C_T / C_Pair",
    "range": "4 to 10"
  },
  "lam": {
    "key": "lam",
    "full": "Total Inflow Ratio",
    "short": "Inflow Ratio",
    "sym": "λ",
    "unit": "–",
    "body": "Total rotor inflow ratio normal to the disk (+Z axis): λ = μ_z + λ_i. Positive when total flow is downward through the disk.",
    "eq": "λ = μ_z + λ_i",
    "range": ""
  },
  "lami": {
    "key": "lami",
    "full": "Induced Inflow Ratio",
    "short": "Induced Inflow",
    "sym": "λ_i",
    "unit": "–",
    "body": "Non-dimensional induced velocity ratio: λ_i = v_i / (ΩR). Positive when induced flow is downward through the disk. Solved iteratively to balance blade-element thrust with actuator disk momentum flux.",
    "eq": "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)",
    "range": "0.03 to 0.08 (hover)"
  },
  "lamh": {
    "key": "lamh",
    "full": "Hover Inflow Ratio",
    "short": "Hover Inflow",
    "sym": "λ_h",
    "unit": "–",
    "body": "Ideal hover induced inflow ratio from momentum theory: λ_h = √(C_T / 2). Serves as aerodynamic normalization reference for forward and axial flight inflow.",
    "eq": "λ_h = √(C_T / 2)",
    "range": "0.03 to 0.08"
  },
  "muLam": {
    "key": "muLam",
    "full": "Advance-to-Inflow Ratio",
    "short": "Advance/Inflow",
    "sym": "μ/λ",
    "unit": "–",
    "body": "Advance-to-inflow ratio: μ_x / λ. Characterizes rotor wake inclination relative to the shaft axis and governs wake skew angle χ.",
    "eq": "μ/λ = μ_x / (μ_z + λ_i)",
    "range": "0 to 20"
  },
  "Tc": {
    "key": "Tc",
    "full": "Dynamic Thrust Coefficient",
    "short": "Dynamic Thrust Coeff",
    "sym": "T_c",
    "unit": "–",
    "body": "Dynamic thrust coefficient based on free-stream dynamic pressure: T_c = T / (½ρV_∞²A_DISK) = 2C_T / μ_∞².\n\nUndefined in static hover (V_∞ = 0).",
    "eq": "T_c = T / (½ρV²A_DISK) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)",
    "range": ""
  },
  "Pc": {
    "key": "Pc",
    "full": "Dynamic Power Coefficient",
    "short": "Dynamic Power Coeff",
    "sym": "P_c",
    "unit": "–",
    "body": "Dynamic power coefficient based on free-stream dynamic pressure: P_c = P / (½ρV_∞³A_DISK) = 2C_P / μ_∞³.\n\nUndefined in static hover (V_∞ = 0).",
    "eq": "P_c = P / (½ρV³A_DISK) = 2C_P / μ_∞²,  V = √(V_x² + V_z²)",
    "range": ""
  },
  "Kx": {
    "key": "Kx",
    "full": "Longitudinal Inflow Gradient",
    "short": "Long. Gradient",
    "sym": "K_x",
    "unit": "–",
    "body": "Longitudinal induced inflow gradient parameter. Produces increased induced downwash over the aft portion of the rotor disk: λ_i(x, ψ) = λ_i·(1 + K_x·x·cosψ).",
    "eq": "Coleman: K_x = tan(χ/2)",
    "range": ""
  },
  "Ky": {
    "key": "Ky",
    "full": "Lateral Inflow Gradient",
    "short": "Lat. Gradient",
    "sym": "K_y",
    "unit": "–",
    "body": "Lateral induced inflow gradient parameter. Accounts for lateral downwash asymmetry between advancing and retreating sides: λ_i(x, ψ) = λ_i·(1 + K_y·x·sinψ).",
    "eq": "Drees: K_y = −2μ",
    "range": ""
  },
  "chi": {
    "key": "chi",
    "full": "Wake Skew Angle",
    "short": "Wake Skew",
    "sym": "χ",
    "unit": "°",
    "body": "Rotor wake skew angle relative to the shaft axis (+Z downward). Approaches 0° in axial climb/hover and 90° in high-speed forward flight.",
    "eq": "tan(χ/2) = μ / (√(μ² + λ²) + |λ|)",
    "range": "0° to 90°"
  },
  "Bres": {
    "key": "Bres",
    "full": "Tip-Loss Factor",
    "short": "Tip Factor",
    "sym": "B",
    "unit": "–",
    "body": "Effective blade tip-loss factor B applied in the aerodynamic solution. Prescribed directly in Fixed mode, or converged iteratively in Sissingh mode.",
    "eq": "Sissingh: B = 1 − √(2C_T) / N_b",
    "range": "0.92 to 1.00"
  },
  "OmR": {
    "key": "OmR",
    "full": "Tip Speed",
    "short": "Tip Speed",
    "sym": "ΩR",
    "unit": "m/s",
    "body": "Speed of the blade tip relative to the hub.",
    "eq": "ΩR = 2π·rpm·R / 60",
    "range": "150 to 250 m/s (helicopters)"
  },
  "Mtip": {
    "key": "Mtip",
    "full": "Tip Mach",
    "short": "Tip Mach",
    "sym": "M_tip",
    "unit": "–",
    "body": "Tip speed over local speed of sound.",
    "eq": "M_tip = ΩR / a",
    "range": "0.4 to 0.7"
  },
  "Madv": {
    "key": "Madv",
    "full": "Advancing Tip Mach",
    "short": "Adv. Mach",
    "sym": "M_adv",
    "unit": "–",
    "body": "Mach number of the advancing blade tip: M_adv = ΩR·(1 + μ_x) / a.\n\nCompressibility effects start near 0.8 to 0.9. Prandtl-Glauert is not valid at or above 1.0.",
    "eq": "M_adv = ΩR·(1 + μ_x) / a",
    "range": "up to 0.9"
  },
  "rho": {
    "key": "rho",
    "full": "Air Density",
    "short": "Density",
    "sym": "ρ",
    "unit": "kg/m³",
    "body": "Air density from the standard-atmosphere pressure and the temperature entered.",
    "eq": "ρ = p / (287.058·T)",
    "range": "0.9 to 1.225 kg/m³"
  },
  "p": {
    "key": "p",
    "full": "Ambient Pressure",
    "short": "Pressure",
    "sym": "p",
    "unit": "Pa",
    "body": "Static pressure at the pressure altitude, from the standard atmosphere.",
    "eq": "p = 101325·(1 − 0.0065·h / 288.15)^{5.2559}",
    "range": ""
  },
  "a": {
    "key": "a",
    "full": "Speed of Sound",
    "short": "Sound Speed",
    "sym": "a",
    "unit": "m/s",
    "body": "Local speed of sound at the ambient temperature.",
    "eq": "a = √(1.4·287.058·T)",
    "range": ""
  },
  "tip_none": {
    "key": "tip_none",
    "full": "Tip Loss None",
    "short": "None",
    "sym": "B",
    "unit": "",
    "body": "No tip-loss correction. Aerodynamic blade loading is integrated across the full span to x = 1.0 (optimistic bound).",
    "eq": "B = 1",
    "range": ""
  },
  "tip_fixed": {
    "key": "tip_fixed",
    "full": "Tip Loss Fixed",
    "short": "Fixed",
    "sym": "B",
    "unit": "",
    "body": "Fixed tip-loss station B specified in geometry. Radial blade integration cuts off at station B, neglecting tip vortex relief outboard.",
    "eq": "B = typed value",
    "range": "0.92 to 0.98"
  },
  "tip_sissingh": {
    "key": "tip_sissingh",
    "full": "Tip Loss Sissingh",
    "short": "Sissingh",
    "sym": "B",
    "unit": "",
    "body": "Semi-empirical tip-loss factor calculated from blade count and operating thrust coefficient: B = 1 − √(2C_T) / N_b, solved iteratively.",
    "eq": "B = 1 − √(2C_T) / N_b",
    "range": ""
  },
  "comp_off": {
    "key": "comp_off",
    "full": "Compressibility Off",
    "short": "Off",
    "sym": "",
    "unit": "",
    "body": "Incompressible flow assumption (M = 0). Blade section lift-curve slope remains constant at the nominal incompressible value a_0.",
    "eq": "a = a_0",
    "range": ""
  },
  "comp_pg": {
    "key": "comp_pg",
    "full": "Prandtl-Glauert",
    "short": "On",
    "sym": "",
    "unit": "",
    "body": "Prandtl-Glauert subsonic compressibility correction. Scales 2D lift-curve slope using effective Mach number at 0.75R: a = a_0 / √(1 − M_eff²), capped at M = 0.85.",
    "eq": "a = a_0 / √(1 − M_eff²),  M_eff = M_tip·√(0.75² + μ²/2)",
    "range": ""
  },
  "inflow_uniform": {
    "key": "inflow_uniform",
    "full": "Uniform Inflow",
    "short": "Uniform",
    "sym": "",
    "unit": "",
    "body": "Classical actuator disk momentum theory with uniform induced downwash across the rotor disk (K_x = K_y = 0). Produces zero hub pitching moment and side force.",
    "eq": "K_x = K_y = 0",
    "range": ""
  },
  "inflow_coleman_simple": {
    "key": "inflow_coleman_simple",
    "full": "Coleman",
    "short": "Coleman",
    "sym": "",
    "unit": "",
    "body": "Coleman (1945) first-harmonic inflow model with longitudinal gradient K_x = tan(χ/2) derived from wake skew angle χ. Lateral gradient is zero (K_y = 0).",
    "eq": "K_x = tan(χ/2),  K_y = 0",
    "range": ""
  },
  "inflow_coleman_feingold": {
    "key": "inflow_coleman_feingold",
    "full": "Coleman-Feingold (NDARC)",
    "short": "Coleman-FG",
    "sym": "",
    "unit": "",
    "body": "Coleman-Feingold harmonic inflow model (NDARC standard). Longitudinal gradient K_x = (15π/32)·tan(χ/2) and lateral gradient K_y = −2μ.",
    "eq": "K_x = (15π/32)·tan(χ/2),  K_y = −2μ",
    "range": ""
  },
  "inflow_drees": {
    "key": "inflow_drees",
    "full": "Drees",
    "short": "Drees",
    "sym": "",
    "unit": "",
    "body": "Drees (1949) harmonic inflow model. Incorporates advance-ratio dependent longitudinal gradient K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2) and lateral gradient K_y = −2μ.",
    "eq": "K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2),  K_y = −2μ",
    "range": ""
  },
  "trim_none": {
    "key": "trim_none",
    "full": "Trim None",
    "short": "None",
    "sym": "",
    "unit": "",
    "body": "Uses the typed collective pitch and rotor speed as they are.",
    "eq": "",
    "range": ""
  },
  "trim_collective": {
    "key": "trim_collective",
    "full": "Trim Collective",
    "short": "Collective",
    "sym": "Δθ",
    "unit": "",
    "body": "Solves the collective pitch so the result matches the target thrust or thrust coefficient at the prescribed rotor speed.",
    "eq": "T(Δθ) = T_target",
    "range": ""
  },
  "trim_rpm": {
    "key": "trim_rpm",
    "full": "Trim Rotor Speed",
    "short": "Rotor Speed",
    "sym": "Ω",
    "unit": "",
    "body": "Solves the rotor speed so the result matches the target, with the collective held.",
    "eq": "T(Ω) = T_target",
    "range": ""
  },
  "rpm_collective": {
    "key": "rpm_collective",
    "full": "Prescribe Speed & Collective",
    "short": "Ω + Δθ",
    "sym": "Ω, Δθ",
    "unit": "",
    "body": "Operating state with rotor speed Ω and collective pitch Δθ prescribed directly. Solves thrust coefficient C_T and thrust T directly.",
    "eq": "T = C_T·ρ·A_DISK·(ΩR)²",
    "range": ""
  },
  "rpm_ct": {
    "key": "rpm_ct",
    "full": "Prescribe Speed & Target C_T",
    "short": "Ω + C_T",
    "sym": "Ω, C_T",
    "unit": "",
    "body": "Operating state with rotor speed Ω and thrust coefficient C_T prescribed. Solves collective pitch Δθ by bisection until BET thrust matches target C_T, then computes T.",
    "eq": "C_T,BET(Δθ) = C_T,target",
    "range": ""
  },
  "rpm_thrust": {
    "key": "rpm_thrust",
    "full": "Prescribe Speed & Target Thrust",
    "short": "Ω + T",
    "sym": "Ω, T",
    "unit": "",
    "body": "Operating state with rotor speed Ω and dimensional thrust T prescribed. Solves collective pitch Δθ by bisection until thrust matches target T.",
    "eq": "T(Δθ) = T_target",
    "range": ""
  },
  "collective_ct": {
    "key": "collective_ct",
    "full": "Prescribe Collective & Target C_T",
    "short": "Δθ + C_T",
    "sym": "Δθ, C_T",
    "unit": "",
    "body": "Operating state with collective pitch Δθ and thrust coefficient C_T prescribed. Solves rotor speed Ω by bisection, then computes thrust T.",
    "eq": "Ω from C_T(Ω) = C_T,target",
    "range": ""
  },
  "collective_thrust": {
    "key": "collective_thrust",
    "full": "Prescribe Collective & Target Thrust",
    "short": "Δθ + T",
    "sym": "Δθ, T",
    "unit": "",
    "body": "Operating state with collective pitch Δθ and dimensional thrust T prescribed. Solves rotor speed Ω by bisection, then computes thrust coefficient C_T.",
    "eq": "Ω from T(Ω) = T_target",
    "range": ""
  },
  "ct_thrust": {
    "key": "ct_thrust",
    "full": "Prescribe Target C_T & Target Thrust",
    "short": "C_T + T",
    "sym": "C_T, T",
    "unit": "",
    "body": "Operating state with thrust coefficient C_T and dimensional thrust T prescribed. Solves tip speed ΩR directly from dynamic pressure, then solves collective Δθ by bisection.",
    "eq": "ΩR = √(T / [ρ·A_DISK·C_T])",
    "range": ""
  },
  "drag_tangential": {
    "key": "drag_tangential",
    "full": "Analytical Tangential",
    "short": "Tangential",
    "sym": "",
    "unit": "",
    "body": "Closed form using only the tangential velocity component. Fast, least detailed.",
    "eq": "U_T = x + μ·sinψ",
    "range": ""
  },
  "drag_vectorial": {
    "key": "drag_vectorial",
    "full": "Analytical Vectorial",
    "short": "Vectorial",
    "sym": "",
    "unit": "",
    "body": "Closed form using the full relative velocity vector.",
    "eq": "W² = u_T² + u_R² + μ_z²",
    "range": ""
  },
  "drag_numerical": {
    "key": "drag_numerical",
    "full": "Numerical Vectorial",
    "short": "Num. Vec.",
    "sym": "",
    "unit": "",
    "body": "Gauss-Legendre quadrature over blade radius (16 points) and azimuth (24 points) with the full relative velocity. Reference method.",
    "eq": "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π",
    "range": ""
  },
  "sw_none": {
    "key": "sw_none",
    "full": "No Trim (Fixed Controls)",
    "short": "No Trim",
    "sym": "",
    "unit": "",
    "body": "Collective and speed are held at the Conditions values for every point of the sweep.",
    "eq": "",
    "range": ""
  },
  "sw_coll_all": {
    "key": "sw_coll_all",
    "full": "Trim Collective Δθ · Every Point",
    "short": "Collective Every Point",
    "sym": "",
    "unit": "",
    "body": "Re-solves the collective at every sweep point so the target thrust or thrust coefficient is held.",
    "eq": "Δθ(μ) from T = T_target",
    "range": ""
  },
  "sw_rpm_all": {
    "key": "sw_rpm_all",
    "full": "Trim Rotor Speed Ω · Every Point",
    "short": "Speed Every Point",
    "sym": "",
    "unit": "",
    "body": "Re-solves the rotor speed at every sweep point so the target thrust is held.",
    "eq": "Ω(μ) from T = T_target",
    "range": ""
  },
  "sw_coll_hover": {
    "key": "sw_coll_hover",
    "full": "Trim Collective Δθ · Hover Only",
    "short": "Collective Hover Only",
    "sym": "",
    "unit": "",
    "body": "Solves the collective once at μ = 0 and holds it fixed along the sweep, so thrust varies with speed.",
    "eq": "Δθ from T(μ=0) = T_target",
    "range": ""
  },
  "sw_rpm_hover": {
    "key": "sw_rpm_hover",
    "full": "Trim Rotor Speed Ω · Hover Only",
    "short": "Speed Hover Only",
    "sym": "",
    "unit": "",
    "body": "Solves the rotor speed once at μ = 0 and holds it fixed along the sweep, so thrust varies with speed.",
    "eq": "Ω from T(μ=0) = T_target",
    "range": ""
  },
  "save": {
    "key": "save",
    "full": "Save Rotor",
    "short": "Save",
    "sym": "",
    "unit": "",
    "body": "Stores the current geometry under its name in the app private storage. The page stays open.",
    "eq": "",
    "range": ""
  },
  "copy": {
    "key": "copy",
    "full": "Copy Rotor",
    "short": "Copy",
    "sym": "",
    "unit": "",
    "body": "Creates an independent duplicate of the active rotor that you can edit freely.",
    "eq": "",
    "range": ""
  },
  "delete": {
    "key": "delete",
    "full": "Delete Rotor",
    "short": "Delete",
    "sym": "",
    "unit": "",
    "body": "Removes the saved rotor from storage. This cannot be undone.",
    "eq": "",
    "range": ""
  },
  "newRotor": {
    "key": "newRotor",
    "full": "New Rotor",
    "short": "New",
    "sym": "",
    "unit": "",
    "body": "Starts a new custom rotor from default values.",
    "eq": "",
    "range": ""
  },
  "activeRotor": {
    "key": "activeRotor",
    "full": "Active Rotor",
    "short": "Active Rotor",
    "sym": "",
    "unit": "",
    "body": "The rotor used for all calculations. Tap to pick another saved rotor or create one.",
    "eq": "",
    "range": ""
  },
  "sweep": {
    "key": "sweep",
    "full": "Advance Ratio Sweep",
    "short": "Sweep",
    "sym": "",
    "unit": "",
    "body": "Computes the selected quantities over a range of advance ratio or forward airspeed, using the current geometry and conditions.",
    "eq": "",
    "range": ""
  },
  "table": {
    "key": "table",
    "full": "Sweep Table",
    "short": "Table",
    "sym": "",
    "unit": "",
    "body": "Shows the sweep values as a numeric table.",
    "eq": "",
    "range": ""
  },
  "csv": {
    "key": "csv",
    "full": "Export CSV",
    "short": "CSV",
    "sym": "",
    "unit": "",
    "body": "Saves the sweep data as a CSV file in a location you choose. No storage permission needed.",
    "eq": "",
    "range": ""
  },
  "png": {
    "key": "png",
    "full": "Export PNG",
    "short": "PNG",
    "sym": "",
    "unit": "",
    "body": "Saves the sweep plot as an image in a location you choose. No storage permission needed.",
    "eq": "",
    "range": ""
  },
  "palette": {
    "key": "palette",
    "full": "Plot Palette",
    "short": "Palette",
    "sym": "",
    "unit": "",
    "body": "Color scheme used for the sweep curves.",
    "eq": "",
    "range": ""
  },
  "sweepTrim": {
    "key": "sweepTrim",
    "full": "Sweep Trim",
    "short": "Sweep Trim",
    "sym": "",
    "unit": "",
    "body": "Chooses which control, if any, is re-solved along the sweep to hold the target thrust or thrust coefficient. Hover only solves it once at μ = 0.",
    "eq": "",
    "range": ""
  },
  "xAxis": {
    "key": "xAxis",
    "full": "Sweep Axis",
    "short": "Axis",
    "sym": "",
    "unit": "",
    "body": "Horizontal axis of the sweep: advance ratio μ_x or forward airspeed V_x. The sweep is always computed in μ_x; V_x is shown through the tip speed.",
    "eq": "μ_x = V_x / (ΩR)",
    "range": ""
  },
  "xAxis_mu": {
    "key": "xAxis_mu",
    "full": "Advance Ratio",
    "short": "Advance Ratio",
    "sym": "μ_x",
    "unit": "–",
    "body": "Sweep X axis in advance ratio. Independent of rotor speed, so curves from different speeds line up.",
    "eq": "μ_x = V_x / (ΩR)",
    "range": "0 to 0.5"
  },
  "xAxis_Vx": {
    "key": "xAxis_Vx",
    "full": "Forward Airspeed",
    "short": "Airspeed",
    "sym": "V_x",
    "unit": "m/s",
    "body": "Sweep X axis in forward airspeed. Each μ_x point is converted with the tip speed of that curve, so curves at different rotor speeds spread differently.",
    "eq": "V_x = μ_x·ΩR",
    "range": "0 to 100 m/s"
  },
  "tabGeom": {
    "key": "tabGeom",
    "full": "Geometry Page",
    "short": "Geometry",
    "sym": "",
    "unit": "",
    "body": "Edit the rotor planform, solidity, blade pitch and section aerodynamics. Every quantity is an input; the others update as you type.",
    "eq": "",
    "range": ""
  },
  "tabCond": {
    "key": "tabCond",
    "full": "Conditions Page",
    "short": "Conditions",
    "sym": "",
    "unit": "",
    "body": "Set the atmosphere, flow state, trim mode and inflow model used for the calculation.",
    "eq": "",
    "range": ""
  },
  "tabRes": {
    "key": "tabRes",
    "full": "Results Page",
    "short": "Results",
    "sym": "",
    "unit": "",
    "body": "Solved forces, power, coefficients, inflow and Mach numbers at the current operating point.",
    "eq": "",
    "range": ""
  },
  "family": {
    "key": "family",
    "full": "Curve Family",
    "short": "Family",
    "sym": "",
    "unit": "",
    "body": "Repeats the sweep for several values of one parameter, drawing one curve per value.",
    "eq": "",
    "range": ""
  }
};
