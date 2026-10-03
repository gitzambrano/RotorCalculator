// Generated from RotorNames.bas by scripts/sync-nomenclature.mjs.
export const APK_NOMENCLATURE = {
  "name": {
    "key": "name",
    "full": "Rotor Name",
    "short": "Name",
    "sym": "",
    "unit": "",
    "body": "Identifier of the saved rotor. It appears in the rotor list, in exports and in the active-rotor bar.",
    "eq": "",
    "range": ""
  },
  "R": {
    "key": "R",
    "full": "Rotor Radius",
    "short": "Radius",
    "sym": "R",
    "unit": "m",
    "body": "Distance from the rotation axis to the blade tip. Input. It sets the disk area and the tip speed. Editing R rescales both chords by the same factor, so solidity, taper and aspect ratio are preserved.",
    "eq": "A = πR²,  ΩR = 2π·rpm·R / 60",
    "range": "0.05 m (small drone) to 12 m (heavy helicopter)"
  },
  "Nb": {
    "key": "Nb",
    "full": "Blade Count",
    "short": "Blades",
    "sym": "N_b",
    "unit": "–",
    "body": "Number of identical blades. Input. Chords are not changed, so adding a blade raises every solidity in proportion. Also enters the Sissingh tip factor.",
    "eq": "σ_geom = N_b·(c_R + c_T) / (2πR)",
    "range": "2 to 8"
  },
  "x0": {
    "key": "x0",
    "full": "Root Cutout",
    "short": "Root Cutout",
    "sym": "x_0",
    "unit": "–",
    "body": "Inboard radial station x = r/R where aerodynamic loading starts. Input. The load integrals run from x_0 to the tip, so no lift or drag is produced inboard. Changing it keeps chords and σ_geom; the active area, σ_act and σ_TR change. The pitch law is anchored at x_0.",
    "eq": "x_0 = r_root / R",
    "range": "0.05 to 0.30"
  },
  "c0": {
    "key": "c0",
    "full": "Root Chord",
    "short": "Root Chord",
    "sym": "c_R",
    "unit": "m",
    "body": "Chord of the fictitious planform at the rotation axis (x = 0), found by extending the linear chord law inward. The real blade starts at the cutout, so this is not the chord there. Input; changing it changes σ_geom, A_geom, AR and taper.",
    "eq": "c(x) = c_R + (c_T − c_R)·x",
    "range": "0.02 to 0.8 m"
  },
  "c1": {
    "key": "c1",
    "full": "Tip Chord",
    "short": "Tip Chord",
    "sym": "c_T",
    "unit": "m",
    "body": "Chord at the blade tip (x = 1). Equal to c_R for a rectangular blade. Input; changing it changes σ_geom, A_geom, AR and taper.",
    "eq": "c(x) = c_R + (c_T − c_R)·x",
    "range": "0.02 to 0.8 m"
  },
  "taper": {
    "key": "taper",
    "full": "Taper Ratio",
    "short": "Taper",
    "sym": "c_T/c_R",
    "unit": "–",
    "body": "Tip chord over axis chord. Derived from c_R and c_T; 1 is a rectangular blade. Editing it keeps the mean chord, hence σ_geom: c_R = 2c_m / (1 + taper) and c_T = taper·c_R, with c_m = (c_R + c_T)/2.",
    "eq": "taper = c_T / c_R",
    "range": "0.3 to 1.0"
  },
  "sigmaRef": {
    "key": "sigmaRef",
    "full": "Geometric Solidity",
    "short": "Geometric Solidity",
    "sym": "σ_geom",
    "unit": "–",
    "body": "Blade area of the fictitious planform extended to the rotation axis (x = 0), over disk area. This is the solidity the analytical equations use. Derived from N_b, c_R, c_T and R; editing it scales both chords by the same factor and keeps taper.",
    "eq": "σ_geom = N_b·A_geom / A",
    "range": "0.05 to 0.15"
  },
  "sigmaAct": {
    "key": "sigmaAct",
    "full": "Actual Solidity",
    "short": "Actual Solidity",
    "sym": "σ_act",
    "unit": "–",
    "body": "Actual (real) blade area, from the root cutout x_0 to the tip, over disk area. Derived; editing it scales both chords uniformly. Information only: the cutout already enters the equations through the integration limit.",
    "eq": "σ_act = N_b·A_act / A",
    "range": "0.05 to 0.15"
  },
  "sigmaT": {
    "key": "sigmaT",
    "full": "Thrust-Weighted Solidity",
    "short": "Thrust Solidity",
    "sym": "σ_TR",
    "unit": "–",
    "body": "Solidity weighted by the radial thrust distribution, which grows as x². Derived; editing it scales both chords. Used to normalize blade loading C_T/σ and the mean lift coefficient.",
    "eq": "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1",
    "range": "0.05 to 0.15"
  },
  "AR": {
    "key": "AR",
    "full": "Aspect Ratio",
    "short": "Aspect Ratio",
    "sym": "AR",
    "unit": "–",
    "body": "Blade radius squared over geometric blade area, which equals R over the mean chord. Derived. Editing it scales both chords by AR_old / AR_new, keeping R and taper.",
    "eq": "AR = R² / A_geom = 2R / (c_R + c_T)",
    "range": "6 to 25"
  },
  "A": {
    "key": "A",
    "full": "Disk Area",
    "short": "Disk Area",
    "sym": "A",
    "unit": "m²",
    "body": "Area swept by the blades. Derived from R. Editing it changes R to the square root of A/π and scales the chords with R.",
    "eq": "A = πR²",
    "range": ""
  },
  "Ab": {
    "key": "Ab",
    "full": "Geometric Blade Area",
    "short": "Geometric Area",
    "sym": "A_geom",
    "unit": "m²",
    "body": "Planform area of one blade of the fictitious planform extended to the rotation axis (x = 0), not only the real blade. Derived from the chords; editing it scales both chords.",
    "eq": "A_geom = ∫ c dr, 0 to R = R·(c_R + c_T)/2",
    "range": ""
  },
  "Aact": {
    "key": "Aact",
    "full": "Actual Blade Area",
    "short": "Actual Area",
    "sym": "A_act",
    "unit": "m²",
    "body": "Actual (real) planform area of one blade, from the root cutout x_0 to the tip. Derived; editing it scales both chords.",
    "eq": "A_act = ∫ c dr, x_0R to R",
    "range": ""
  },
  "thRoot": {
    "key": "thRoot",
    "full": "Root Pitch",
    "short": "Root Pitch",
    "sym": "θ_R",
    "unit": "°",
    "body": "Geometric blade pitch at the root cutout station, before collective. Input. Editing it changes the twist; the tip pitch is kept.",
    "eq": "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ",
    "range": ""
  },
  "thTip": {
    "key": "thTip",
    "full": "Tip Pitch",
    "short": "Tip Pitch",
    "sym": "θ_T",
    "unit": "°",
    "body": "Geometric blade pitch at the tip, before collective. Input. Editing it changes the twist; the root pitch is kept.",
    "eq": "θ_twist = θ_T − θ_R",
    "range": ""
  },
  "thTwist": {
    "key": "thTwist",
    "full": "Total Blade Twist",
    "short": "Twist",
    "sym": "θ_twist",
    "unit": "°",
    "body": "Pitch change from root to tip, linear along the span. Derived. Editing it keeps the mean pitch (θ_R + θ_T)/2 and splits the change equally between root and tip. Negative twist evens out the inflow and improves hover efficiency.",
    "eq": "θ_twist = θ_T − θ_R",
    "range": "-20° to 0° (typical -8° to -14°)"
  },
  "th75": {
    "key": "th75",
    "full": "Three-Quarter Pitch",
    "short": "Pitch 75%",
    "sym": "θ_75",
    "unit": "°",
    "body": "Pitch at 75% of the way from root to tip, the usual reference pitch of a twisted blade. Derived. Editing it shifts root and tip pitch together and keeps the twist. It equals the pitch at station x = 0.75 only when the cutout is zero.",
    "eq": "θ_75 = θ_R + 0.75·θ_twist",
    "range": ""
  },
  "airfoil": {
    "key": "airfoil",
    "full": "Airfoil Section",
    "short": "Airfoil",
    "sym": "",
    "unit": "",
    "body": "Blade section from the airfoil database. It supplies the lift-curve slope a_0 and the profile drag coefficient C_d0. Choose Custom to type your own values.",
    "eq": "C_l = a_0·α_e,  C_d = C_d0",
    "range": ""
  },
  "a0": {
    "key": "a0",
    "full": "Lift-Curve Slope",
    "short": "Lift Slope",
    "sym": "a_0",
    "unit": "1/rad",
    "body": "Section lift per radian of effective angle of attack, assumed linear with no stall. Thin-airfoil theory gives 2π, real sections give less. With Prandtl-Glauert on, the effective slope a is larger.",
    "eq": "C_l = a_0·α_e",
    "range": "5.0 to 6.3 per rad"
  },
  "Cd0": {
    "key": "Cd0",
    "full": "Profile Drag Coefficient",
    "short": "Profile Drag",
    "sym": "C_d0",
    "unit": "–",
    "body": "Constant section drag coefficient used everywhere on the disk. Treat it as a mean equivalent value for the lift range of the rotor, above the minimum drag of the section. It drives the profile torque and in-plane force.",
    "eq": "C_d = C_d0",
    "range": "0.008 to 0.012"
  },
  "tipModel": {
    "key": "tipModel",
    "full": "Tip-Loss Model",
    "short": "Tip Loss",
    "sym": "",
    "unit": "",
    "body": "How the loss of lift near the blade tip is modeled. None integrates the loading to the tip. Fixed cuts it at the factor B you type. Sissingh computes B from the thrust coefficient and blade count.",
    "eq": "lift integrated from x_0 to B",
    "range": ""
  },
  "B": {
    "key": "B",
    "full": "Tip-Loss Factor",
    "short": "Tip Factor",
    "sym": "B",
    "unit": "–",
    "body": "Radial station beyond which the blade carries no lift. 1 means no loss. In Fixed mode you type it (never below x_0 + 0.01); in Sissingh mode it is solved together with C_T. The momentum disk area is scaled by B².",
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
    "body": "Design rotor speed stored with the rotor. It only seeds the rotor speed on the Conditions page.",
    "eq": "Ω = 2π·rpm / 60",
    "range": ""
  },
  "h": {
    "key": "h",
    "full": "Pressure Altitude",
    "short": "Altitude",
    "sym": "h",
    "unit": "m",
    "body": "Altitude in the International Standard Atmosphere. It sets the static pressure; density follows from that pressure and the temperature you enter.",
    "eq": "p = 101325·(1 − 0.0065·h / 288.15)^5.2561",
    "range": "0 to 6000 m"
  },
  "T0": {
    "key": "T0",
    "full": "Ambient Temperature",
    "short": "Temperature",
    "sym": "T_amb",
    "unit": "°C",
    "body": "Static air temperature at the rotor. It is typed independently of altitude, so hot-and-high or cold days are possible. Sets density and speed of sound together with p.",
    "eq": "ρ = p / (287.058·T),  a = √(1.4·287.058·T),  T in kelvin",
    "range": "-40 to 50 °C"
  },
  "mu": {
    "key": "mu",
    "full": "Advance Ratio",
    "short": "Advance Ratio",
    "sym": "μ_x",
    "unit": "–",
    "body": "Airspeed component in the disk plane over tip speed. 0 is hover. One of two equivalent ways to enter horizontal flow.",
    "eq": "μ_x = V_x / (ΩR)",
    "range": "0 to 0.5"
  },
  "Vx": {
    "key": "Vx",
    "full": "Forward Airspeed",
    "short": "Airspeed",
    "sym": "V_x",
    "unit": "m/s",
    "body": "Airspeed component in the rotor disk plane. Alternative to the advance ratio; the engine uses μ_x = V_x / (ΩR).",
    "eq": "V_x = μ_x·ΩR",
    "range": "0 to 100 m/s"
  },
  "alpha": {
    "key": "alpha",
    "full": "Disk Angle of Attack",
    "short": "Disk AoA",
    "sym": "α",
    "unit": "°",
    "body": "Angle between the free stream and the disk plane. Positive when the flow arrives from below the disk (nose-up disk), which lowers the inflow and raises thrust. One of three alternative axial-flow inputs.",
    "eq": "μ_z = −μ_x·tan α",
    "range": "-20° to 20°"
  },
  "Vz": {
    "key": "Vz",
    "full": "Climb Speed",
    "short": "Climb Speed",
    "sym": "V_z",
    "unit": "m/s",
    "body": "Axial speed of the air through the disk, positive downward, which is a climb. Alternative axial-flow input; negative values are descent.",
    "eq": "V_z = μ_z·ΩR",
    "range": "-10 to 10 m/s"
  },
  "muz": {
    "key": "muz",
    "full": "Axial Flow Ratio",
    "short": "Axial Ratio",
    "sym": "μ_z",
    "unit": "–",
    "body": "Axial speed over tip speed, positive downward through the disk. It adds to the induced inflow in the total inflow. Alternative axial-flow input.",
    "eq": "μ_z = V_z / (ΩR) = −μ_x·tan α",
    "range": "-0.1 to 0.1"
  },
  "trim": {
    "key": "trim",
    "full": "Trim Mode",
    "short": "Trim",
    "sym": "",
    "unit": "",
    "body": "The operating state has four linked variables: rotor speed Ω, collective Δθ, thrust coefficient C_T and thrust T. You prescribe any two and the engine solves the other two. Six pairs are available.",
    "eq": "T = C_T·ρ·A·(ΩR)²",
    "range": ""
  },
  "rpm": {
    "key": "rpm",
    "full": "Rotor Speed",
    "short": "Rotor Speed",
    "sym": "Ω",
    "unit": "rpm",
    "body": "Rotor rotation rate. It sets tip speed, dynamic pressure and, through Mach, the compressibility correction. Solved when it is not one of the two prescribed variables.",
    "eq": "ΩR = 2π·rpm·R / 60",
    "range": ""
  },
  "coll": {
    "key": "coll",
    "full": "Collective Pitch",
    "short": "Collective",
    "sym": "Δθ",
    "unit": "°",
    "body": "Pitch increment applied equally to every blade station and added to the geometric pitch. Solved by bisection when it is not prescribed.",
    "eq": "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ",
    "range": "0° to 20°"
  },
  "Ttgt": {
    "key": "Ttgt",
    "full": "Target Thrust",
    "short": "Target Thrust",
    "sym": "T",
    "unit": "N",
    "body": "Thrust the trim must reach. Used together with one other prescribed variable.",
    "eq": "T = C_T·ρ·A·(ΩR)²",
    "range": ""
  },
  "CTtgt": {
    "key": "CTtgt",
    "full": "Target Thrust Coefficient",
    "short": "Target CT",
    "sym": "C_T",
    "unit": "–",
    "body": "Thrust coefficient the trim must reach. With Δθ prescribed it fixes Ω; with Ω prescribed it fixes Δθ. With thrust T it fixes Ω directly.",
    "eq": "C_T = T / [ρA(ΩR)²]",
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
    "body": "Factor on ideal induced power that accounts for non-uniform inflow and tip losses. It is an input to the energy-balance torque, air power and figure of merit; it does not change thrust. 1 is the ideal rotor.",
    "eq": "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi",
    "range": "1.05 to 1.30"
  },
  "drag": {
    "key": "drag",
    "full": "Profile Drag Integration",
    "short": "Drag Integration",
    "sym": "",
    "unit": "",
    "body": "Method used to integrate the section profile drag over the disk. Tangential counts only the in-plane tangential velocity. Vectorial uses the full relative velocity in closed form. Numerical uses Gauss-Legendre quadrature (16 radial by 24 azimuth points), the reference method.",
    "eq": "dD = ½ρ W² c C_d0 dr",
    "range": ""
  },
  "T": {
    "key": "T",
    "full": "Thrust",
    "short": "Thrust",
    "sym": "T",
    "unit": "N",
    "body": "Rotor force along the shaft axis, positive up. Computed from the thrust coefficient.",
    "eq": "T = C_T·ρ·A·(ΩR)²",
    "range": ""
  },
  "P": {
    "key": "P",
    "full": "Shaft Power",
    "short": "Power",
    "sym": "P",
    "unit": "W",
    "body": "Mechanical power at the rotor shaft: torque times rotor speed. Equals the sum of induced and profile power.",
    "eq": "P = Q·Ω = C_Q·ρ·A·(ΩR)³",
    "range": ""
  },
  "Pi": {
    "key": "Pi",
    "full": "Induced Power",
    "short": "Induced Power",
    "sym": "P_i",
    "unit": "W",
    "body": "Shaft power attributed to producing thrust. Taken from the induced torque coefficient, which by the energy balance includes the induced term k_ind·λ_i·C_T, the climb term μ_z·C_T and minus the propulsive term μ·C_Hi.",
    "eq": "P_i = C_Qi·ρ·A·(ΩR)³",
    "range": ""
  },
  "P0": {
    "key": "P0",
    "full": "Profile Power",
    "short": "Profile Power",
    "sym": "P_0",
    "unit": "W",
    "body": "Shaft power spent overcoming blade section drag, from the integrated profile torque.",
    "eq": "P_0 = C_Q0·ρ·A·(ΩR)³",
    "range": ""
  },
  "Q": {
    "key": "Q",
    "full": "Shaft Torque",
    "short": "Torque",
    "sym": "Q",
    "unit": "N·m",
    "body": "Torque about the rotor shaft, induced plus profile.",
    "eq": "Q = C_Q·ρ·A·(ΩR)²·R",
    "range": ""
  },
  "H": {
    "key": "H",
    "full": "In-Plane Force",
    "short": "In-Plane Force",
    "sym": "H",
    "unit": "N",
    "body": "Rotor force in the disk plane along the flow direction, positive aft (drag-like). Rigid hub, no flapping, so it is the full hub force.",
    "eq": "H = C_H·ρ·A·(ΩR)²",
    "range": ""
  },
  "Y": {
    "key": "Y",
    "full": "Side Force",
    "short": "Side Force",
    "sym": "Y",
    "unit": "N",
    "body": "Rotor force in the disk plane perpendicular to the flow, positive to the right (advancing side). Zero with uniform inflow.",
    "eq": "Y = C_Y·ρ·A·(ΩR)²",
    "range": ""
  },
  "Mx": {
    "key": "Mx",
    "full": "Roll Moment",
    "short": "Roll Moment",
    "sym": "M_x",
    "unit": "N·m",
    "body": "Hub moment about the longitudinal axis, positive advancing side down. Rigid hub, no flapping, so the full moment goes into the hub.",
    "eq": "M_x = C_Mx·ρ·A·(ΩR)²·R",
    "range": ""
  },
  "My": {
    "key": "My",
    "full": "Pitch Moment",
    "short": "Pitch Moment",
    "sym": "M_y",
    "unit": "N·m",
    "body": "Hub moment about the lateral axis, positive nose up. Rigid hub, no flapping. Zero with uniform inflow.",
    "eq": "M_y = C_My·ρ·A·(ΩR)²·R",
    "range": ""
  },
  "DL": {
    "key": "DL",
    "full": "Disk Loading",
    "short": "Disk Loading",
    "sym": "T/A",
    "unit": "N/m²",
    "body": "Thrust per unit disk area. Low disk loading means efficient hover.",
    "eq": "DL = T / A",
    "range": "50 to 500 N/m² (helicopters)"
  },
  "PL": {
    "key": "PL",
    "full": "Power Loading",
    "short": "Power Loading",
    "sym": "T/P",
    "unit": "N/W",
    "body": "Thrust produced per unit of shaft power.",
    "eq": "PL = T / P",
    "range": "0.05 to 0.15 N/W"
  },
  "Vztot": {
    "key": "Vztot",
    "full": "Total Axial Speed",
    "short": "Total Axial Speed",
    "sym": "V_{z,tot}",
    "unit": "m/s",
    "body": "Mean total normal flow through the disk, positive downward. Sum of imposed climb flow and mean induced flow. Not the free-stream magnitude used by dynamic coefficients.",
    "eq": "V_{z,tot} = V_z + V_i = λ ΩR",
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
  "vi": {
    "key": "vi",
    "full": "Induced Speed",
    "short": "Induced Speed",
    "sym": "V_i",
    "unit": "m/s",
    "body": "Mean velocity added to the air through the disk. Solved from the momentum balance with the blade-element thrust.",
    "eq": "v_i = λ_i·ΩR",
    "range": ""
  },
  "CT": {
    "key": "CT",
    "full": "Thrust Coefficient",
    "short": "Thrust Coeff.",
    "sym": "C_T",
    "unit": "–",
    "body": "Thrust made non-dimensional by disk area and tip speed. Computed from the blade-element integral with the solved inflow; it equals the momentum thrust.",
    "eq": "C_T = T / [ρA(ΩR)²]",
    "range": "0.002 to 0.015"
  },
  "CQ": {
    "key": "CQ",
    "full": "Torque Coefficient",
    "short": "Torque Coeff.",
    "sym": "C_Q",
    "unit": "–",
    "body": "Torque made non-dimensional by ρA(ΩR)²R. Equals the shaft power coefficient C_P.",
    "eq": "C_Q = Q / [ρA(ΩR)²R] = C_Qi + C_Q0 = C_P",
    "range": ""
  },
  "CQi": {
    "key": "CQi",
    "full": "Induced Torque Coefficient",
    "short": "Ind. Torque Coeff.",
    "sym": "C_Qi",
    "unit": "–",
    "body": "Induced part of the torque coefficient, obtained from the energy balance with the induced power factor.",
    "eq": "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi",
    "range": ""
  },
  "Qi": {
    "key": "Qi",
    "full": "Induced Torque",
    "short": "Induced Torque",
    "sym": "Q_i",
    "unit": "N·m",
    "body": "Induced part of the shaft torque, from the induced torque coefficient. Q_i·Ω equals the induced power P_i.",
    "eq": "Q_i = C_Qi·ρ·A·(ΩR)²·R",
    "range": ""
  },
  "Q0": {
    "key": "Q0",
    "full": "Profile Torque",
    "short": "Profile Torque",
    "sym": "Q_0",
    "unit": "N·m",
    "body": "Profile-drag part of the shaft torque, from the integrated profile torque coefficient. Q_0·Ω equals the profile power P_0.",
    "eq": "Q_0 = C_Q0·ρ·A·(ΩR)²·R",
    "range": ""
  },
  "Hi": {
    "key": "Hi",
    "full": "Induced In-Plane Force",
    "short": "Induced In-Plane Force",
    "sym": "H_i",
    "unit": "N",
    "body": "Induced part of the in-plane force, from the backward tilt of the lift vector.",
    "eq": "H_i = C_Hi·ρ·A·(ΩR)²",
    "range": ""
  },
  "H0": {
    "key": "H0",
    "full": "Profile In-Plane Force",
    "short": "Profile In-Plane Force",
    "sym": "H_0",
    "unit": "N",
    "body": "Profile-drag part of the in-plane force, integrated numerically. H = H_i + H_0.",
    "eq": "H_0 = C_H0·ρ·A·(ΩR)²",
    "range": ""
  },
  "Pair": {
    "key": "Pair",
    "full": "Air Power",
    "short": "Air Power",
    "sym": "P_air",
    "unit": "W",
    "body": "Power delivered to the air. The engine computes C_Pair from the energy balance: induced, climb and profile terms plus the profile translational work μ·C_H0. It equals the shaft power plus the work of the in-plane force, P + μ·H·ΩR, so it differs from the shaft power P in forward flight.",
    "eq": "P_air = C_Pair·ρ·A·(ΩR)³ = P + μ·H·ΩR",
    "range": ""
  },
  "CQ0": {
    "key": "CQ0",
    "full": "Profile Torque Coefficient",
    "short": "Prof. Torque Coeff.",
    "sym": "C_Q0",
    "unit": "–",
    "body": "Profile-drag part of the torque coefficient, integrated numerically over blade and azimuth with the full relative velocity.",
    "eq": "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π",
    "range": ""
  },
  "CH": {
    "key": "CH",
    "full": "In-Plane Force Coefficient",
    "short": "In-Plane Coeff.",
    "sym": "C_H",
    "unit": "–",
    "body": "In-plane force coefficient, positive aft. Sum of induced and profile parts.",
    "eq": "C_H = C_Hi + C_H0",
    "range": ""
  },
  "CHi": {
    "key": "CHi",
    "full": "Induced In-Plane Force Coefficient",
    "short": "Ind. In-Plane Coeff.",
    "sym": "C_Hi",
    "unit": "–",
    "body": "Induced part of the in-plane force, from the backward tilt of the lift vector by the inflow angle. Analytical blade-element result.",
    "eq": "C_Hi = (a/4)·[λ·μ·Θ_0 + λ_1s·(Θ_2 − 2λ·I_1)]",
    "range": ""
  },
  "CH0": {
    "key": "CH0",
    "full": "Profile In-Plane Force Coefficient",
    "short": "Prof. In-Plane Coeff.",
    "sym": "C_H0",
    "unit": "–",
    "body": "Profile-drag part of the in-plane force, integrated numerically. About 3/8·σ·C_d0·μ for small μ.",
    "eq": "C_H0 = ∬ (σ·C_d0/2)·W·(x·sinψ + μ) dx dψ / 2π",
    "range": ""
  },
  "CY": {
    "key": "CY",
    "full": "Side Force Coefficient",
    "short": "Side Force",
    "sym": "C_Y",
    "unit": "–",
    "body": "Side force made non-dimensional like thrust. Non-zero only when the inflow model has a longitudinal gradient K_x.",
    "eq": "C_Y = −(a/4)·K_x·λ_i·(Θ_2 − 2λ·I_1)",
    "range": ""
  },
  "CMx": {
    "key": "CMx",
    "full": "Roll Moment Coefficient",
    "short": "Roll Moment",
    "sym": "C_Mx",
    "unit": "–",
    "body": "Roll hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping.",
    "eq": "C_Mx = −(a·μ/2)·(Θ_2 − ½λ·I_1) + (a/4)·λ_1s·I_3",
    "range": ""
  },
  "CMy": {
    "key": "CMy",
    "full": "Pitch Moment Coefficient",
    "short": "Pitch Moment",
    "sym": "C_My",
    "unit": "–",
    "body": "Pitch hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping. Non-zero only when K_x is not zero.",
    "eq": "C_My = (a/4)·K_x·λ_i·I_3",
    "range": ""
  },
  "CPair": {
    "key": "CPair",
    "full": "Air Power Coefficient",
    "short": "Air Power",
    "sym": "C_Pair",
    "unit": "–",
    "body": "Power given to the air, from the energy balance: induced, climb and profile terms, including the profile translational work μ·C_H0.",
    "eq": "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0",
    "range": ""
  },
  "CTs": {
    "key": "CTs",
    "full": "Blade Loading",
    "short": "Blade Loading",
    "sym": "C_T/σ_TR",
    "unit": "–",
    "body": "Thrust coefficient per unit thrust-weighted solidity. Indicates how hard the blades work; stall limits it near 0.12 to 0.15.",
    "eq": "C_T / σ_TR",
    "range": "0.05 to 0.12"
  },
  "CLbar": {
    "key": "CLbar",
    "full": "Mean Lift Coefficient",
    "short": "Mean Lift Coefficient",
    "sym": "C̄_L",
    "unit": "–",
    "body": "Average section lift coefficient over the disk that carries the thrust, from the blade loading. A quick stall margin check against the section C_l,max.",
    "eq": "C̄_L = 6·C_T / σ_TR",
    "range": "0.3 to 0.7"
  },
  "FM": {
    "key": "FM",
    "full": "Figure of Merit (hover only)",
    "short": "Figure of Merit",
    "sym": "FM",
    "unit": "–",
    "body": "Ideal hover power over actual hover power, using the induced power factor and the profile torque. Shown only in hover; forward flight uses effective L/D.",
    "eq": "FM = (C_T^1.5/√2) / (k_ind·C_T^1.5/√2 + C_Q0)",
    "range": "0.55 to 0.80"
  },
  "LDe": {
    "key": "LDe",
    "full": "Effective Lift/Drag Ratio",
    "short": "Eff. Lift/Drag",
    "sym": "(L/D)_e",
    "unit": "–",
    "body": "Rotor lift times forward speed over air power. Zero in hover.",
    "eq": "(L/D)_e = μ·C_T / C_Pair",
    "range": "4 to 10"
  },
  "lam": {
    "key": "lam",
    "full": "Total Inflow Ratio",
    "short": "Inflow Ratio",
    "sym": "λ",
    "unit": "–",
    "body": "Total flow through the disk normal to it, over tip speed: the axial free-stream component plus the induced part.",
    "eq": "λ = μ_z + λ_i",
    "range": ""
  },
  "lami": {
    "key": "lami",
    "full": "Induced Inflow Ratio",
    "short": "Induced Inflow",
    "sym": "λ_i",
    "unit": "–",
    "body": "Induced velocity over tip speed. Found by bisection so that the blade-element thrust equals the momentum thrust. In ideal hover it is √(C_T/2).",
    "eq": "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)",
    "range": "0.03 to 0.08 (hover)"
  },
  "lamh": {
    "key": "lamh",
    "full": "Hover Inflow Ratio",
    "short": "Hover Inflow",
    "sym": "λ_h",
    "unit": "–",
    "body": "Induced inflow ratio an ideal rotor would have in hover at the current thrust coefficient. Reference scale for the inflow: λ_i / λ_h shows how far forward or axial flow has relieved the induced velocity.",
    "eq": "λ_h = √(C_T / 2)",
    "range": "0.03 to 0.08"
  },
  "muLam": {
    "key": "muLam",
    "full": "Advance-to-Inflow Ratio",
    "short": "Advance/Inflow",
    "sym": "μ/λ",
    "unit": "–",
    "body": "In-plane flow over total axial inflow. Zero in hover and growing as the wake skews toward the disk plane. It sets the wake skew angle that drives the inflow gradients.",
    "eq": "μ/λ = μ_x / (μ_z + λ_i)",
    "range": "0 to 20"
  },
  "Tc": {
    "key": "Tc",
    "full": "Dynamic Thrust Coefficient",
    "short": "Dynamic Thrust Coeff",
    "sym": "T_c",
    "unit": "–",
    "body": "Thrust over the dynamic pressure of the free stream times disk area, T_c = T / (½ρV∞²A). Useful when the rotor is treated like a propeller or a lifting surface moving at V. Undefined in hover.",
    "eq": "T_c = T / (½ρV²A) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)",
    "range": ""
  },
  "Pc": {
    "key": "Pc",
    "full": "Dynamic Power Coefficient",
    "short": "Dynamic Power Coeff",
    "sym": "P_c",
    "unit": "–",
    "body": "Shaft power over ½ρV∞³A for the free-stream speed V∞, P_c = P / (½ρV∞³A). Undefined in hover.",
    "eq": "P_c = P / (½ρV³A) = 2C_P / μ_∞³,  V = √(V_x² + V_z²)",
    "range": ""
  },
  "Kx": {
    "key": "Kx",
    "full": "Longitudinal Inflow Gradient",
    "short": "Long Gradient",
    "sym": "K_x",
    "unit": "–",
    "body": "Fore-aft slope of the induced inflow over the disk, as a multiple of λ_i. Set by the inflow model from the wake skew angle; zero for uniform inflow.",
    "eq": "Coleman: K_x = tan(χ/2)",
    "range": ""
  },
  "Ky": {
    "key": "Ky",
    "full": "Lateral Inflow Gradient",
    "short": "Lat Gradient",
    "sym": "K_y",
    "unit": "–",
    "body": "Side-to-side slope of the induced inflow over the disk, as a multiple of λ_i. Zero for uniform and Coleman; −2μ for Coleman-Feingold and Drees.",
    "eq": "Drees: K_y = −2μ",
    "range": ""
  },
  "chi": {
    "key": "chi",
    "full": "Wake Skew Angle",
    "short": "Wake Skew",
    "sym": "χ",
    "unit": "°",
    "body": "Angle of the wake from the shaft axis. 0° is hover, close to 90° at high speed.",
    "eq": "tan(χ/2) = μ / (√(μ² + λ²) + |λ|)",
    "range": "0° to 90°"
  },
  "Bres": {
    "key": "Bres",
    "full": "Tip-Loss Factor",
    "short": "Tip Factor",
    "sym": "B",
    "unit": "–",
    "body": "Tip-loss factor used in this solution. Equals the typed value in Fixed mode and the converged value in Sissingh mode.",
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
    "body": "Mach number of the advancing blade tip. Compressibility effects start near 0.8 to 0.9; Prandtl-Glauert is not valid at or above 1.",
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
    "eq": "p = 101325·(1 − 0.0065·h / 288.15)^5.2561",
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
    "body": "No tip loss. Blade loading is integrated all the way to the tip, which is optimistic.",
    "eq": "B = 1",
    "range": ""
  },
  "tip_fixed": {
    "key": "tip_fixed",
    "full": "Tip Loss Fixed",
    "short": "Fixed",
    "sym": "B",
    "unit": "",
    "body": "Uses the tip-loss factor B typed in Geometry, for example the value a preset specifies. It is not the same as off.",
    "eq": "B = typed value",
    "range": "0.92 to 0.98"
  },
  "tip_sissingh": {
    "key": "tip_sissingh",
    "full": "Tip Loss Sissingh",
    "short": "Sissingh",
    "sym": "B",
    "unit": "",
    "body": "Computes B from the thrust coefficient and the blade count, iterating with the thrust until B stops changing.",
    "eq": "B = 1 − √(2C_T) / N_b",
    "range": ""
  },
  "comp_off": {
    "key": "comp_off",
    "full": "Compressibility Off",
    "short": "Off",
    "sym": "",
    "unit": "",
    "body": "Lift-curve slope stays constant at a_0.",
    "eq": "a = a_0",
    "range": ""
  },
  "comp_pg": {
    "key": "comp_pg",
    "full": "Prandtl-Glauert",
    "short": "On",
    "sym": "",
    "unit": "",
    "body": "Corrects the lift-curve slope for subsonic compressibility using the Mach number near 0.75R, capped at 0.85. A caution appears from M_adv = 0.8; the result is invalid at M_adv = 1.",
    "eq": "a = a_0 / √(1 − M_eff²),  M_eff = M_tip·√(0.75² + μ²/2)",
    "range": ""
  },
  "inflow_uniform": {
    "key": "inflow_uniform",
    "full": "Uniform Inflow",
    "short": "Uniform",
    "sym": "",
    "unit": "",
    "body": "Momentum theory: one induced velocity for the whole disk. No gradients, so there is no side force or pitch moment.",
    "eq": "K_x = K_y = 0",
    "range": ""
  },
  "inflow_coleman_simple": {
    "key": "inflow_coleman_simple",
    "full": "Coleman",
    "short": "Coleman",
    "sym": "",
    "unit": "",
    "body": "Longitudinal inflow gradient from the wake skew angle (Coleman 1945). No lateral gradient.",
    "eq": "K_x = tan(χ/2),  K_y = 0",
    "range": ""
  },
  "inflow_coleman_feingold": {
    "key": "inflow_coleman_feingold",
    "full": "Coleman-Feingold (NDARC)",
    "short": "Coleman-FG",
    "sym": "",
    "unit": "",
    "body": "NDARC form of the Coleman model with the factor 15π/32 on the longitudinal gradient and a lateral gradient.",
    "eq": "K_x = (15π/32)·tan(χ/2),  K_y = −2μ",
    "range": ""
  },
  "inflow_drees": {
    "key": "inflow_drees",
    "full": "Drees",
    "short": "Drees",
    "sym": "",
    "unit": "",
    "body": "Drees (1949) gradients, with a speed-dependent longitudinal term and a lateral gradient.",
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
    "eq": "T = C_T·ρ·A·(ΩR)²",
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
    "eq": "ΩR = √(T / [ρ·A·C_T])",
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
