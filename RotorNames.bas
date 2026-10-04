B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorNames.bas - canonical nomenclature (docs/nomenclature.md) + help texts. No visible views.
' Levels: 0 = L Full Description Symbol, 1 = M Short Description Symbol, 2 = S Narrow Description, 3 = A Abbreviated Description Symbol, 4 = symbol only.
' Fit order (symbols are kept as long as possible): L, M, A, S, symbol. A label never wraps: one level per page, text shrinks to 13sp first.
' (old line) Coefficients: Full = Name Coefficient Symbol, Short = Name Symbol.
' Symbols use "_" for subscripts in plain text; RichLabel renders real subscripts one single way.

Sub Process_Globals
	Private tbl As Map
	Private abbr As Map
	Private narrowNames As Map
	Private minimumNames As Map
End Sub

' Fields per key: 0 full, 1 short, 2 symbol ("" = none), 3 unit hint, 4 body, 5 equation, 6 typical range
Private Sub Add(key As String, full As String, shrt As String, sym As String, unit As String, body As String, eq As String, rng As String)
	tbl.Put(key, Array As String(full, shrt, sym, unit, body, eq, rng))
End Sub

Private Sub Ensure
	If tbl.IsInitialized Then Return
	tbl.Initialize
	abbr.Initialize
	narrowNames.Initialize
	minimumNames.Initialize
	Dim ab() As String = Array As String("R", "Radius", "Nb", "Blades", "x0", "Root Cutout", "c0", "Root Chord", "c1", "Tip Chord", "taper", "Taper", "sigmaRef", "Ref. Solidity", "sigmaAct", "Act. Solidity", "sigmaT", "Thrust Solidity", "AR", "Aspect Ratio", "A", "Disk Area", "Ab", "Ref. Area", "Aact", "Act. Area", "thRoot", "Root Pitch", "thTip", "Tip Pitch", "thTwist", "Twist", "th75", "Pitch 75%", "a0", "Lift Slope", "Cd0", "Prof. Drag", "B", "Tip Factor", "rpmNom", "Nom Speed", "h", "Altitude", "T0", "Temperature", "mu", "Adv. Ratio", "Vx", "Airspeed", "alpha", "Disk AoA", "Vz", "Climb Speed", "muz", "Axial Ratio", "rpm", "Rotor Speed", "coll", "Collective", "Ttgt", "Target Thrust", "CTtgt", "Target", "kind", "Ind. Factor", "T", "Thrust", "P", "Power", "Pi", "Ind. Power", "P0", "Prof. Power", "Q", "Torque", "H", "In-Plane Force", "Y", "Side Force", "Mx", "Roll Moment", "My", "Pitch Moment", "DL", "Disk Loading", "PL", "Power Loading", "vi", "Ind. Speed", "CT", "Thrust Coeff.", "CQ", "Torque Coeff.", "CQi", "Ind. Torque Coeff.", "CQ0", "Prof. Torque Coeff.", "CH", "In-Plane Coeff.", "CHi", "Ind. In-Plane Coeff.", "CH0", "Prof. In-Plane Coeff.", "CY", "Side Force", "CMx", "Roll Moment", "CMy", "Pitch Moment", "CPair", "Air Power", "CTs", "Blade Loading", "CLbar", "Mean Lift", "FM", "FM", "LDe", "Eff. Lift/Drag", "lam", "Inflow Ratio", "lami", "Ind. Inflow", "lamh", "Hover Inflow", "muLam", "Advance-Inflow", "Tc", "Dyn Thrust Coeff", "Pc", "Dyn Power Coeff", "Mtip", "Tip Mach", "Madv", "Adv. Mach", "OmR", "Tip Speed", "rho", "Density", "p", "Pressure", "a", "Sound Speed", "Bres", "Tip Factor", "chi", "Wake Skew", "Qi", "Ind. Torque", "Q0", "Prof. Torque", "Hi", "Ind. In-Plane", "H0", "Prof. In-Plane", "Pair", "Air Power")
	For i = 0 To ab.Length - 2 Step 2
		abbr.Put(ab(i), ab(i + 1))
	Next
	' APK responsive overrides: names always precede symbols.
	abbr.Put("AR", "Aspect")
	narrowNames.Put("AR", "Aspect")
	abbr.Put("CTtgt", "Target")
	narrowNames.Put("CTtgt", "Target")
	abbr.Put("CTs", "Blade Load")
	narrowNames.Put("CTs", "Blade Load")
	abbr.Put("sigmaT", "Thr. Solidity")
	abbr.Put("comp", "Compres.")
	abbr.Put("drag", "Integration")
	abbr.Put("LDe", "Eff. L/D")
	narrowNames.Put("LDe", "Eff. L/D")
	abbr.Put("rpmNom", "Rot. Speed")
	abbr.Put("rpm", "Rot. Speed")
	abbr.Put("muLam", "Advance/Inflow")
	narrowNames.Put("T0", "Temp.")
	minimumNames.Put("comp", "Comp.")
	minimumNames.Put("drag", "Integ.")
	' Responsive fallbacks: if Coeff. does not fit, fall back to base name before pure symbol
	abbr.Put("CT", "Thrust")
	narrowNames.Put("CT", "Thrust")
	abbr.Put("CQ", "Torque")
	narrowNames.Put("CQ", "Torque")
	abbr.Put("CQi", "Ind. Torque")
	narrowNames.Put("CQi", "Ind. Torque")
	abbr.Put("CQ0", "Prof. Torque")
	narrowNames.Put("CQ0", "Prof. Torque")
	abbr.Put("CH", "In-Plane")
	narrowNames.Put("CH", "In-Plane")
	abbr.Put("CHi", "Ind. In-Plane")
	narrowNames.Put("CHi", "Ind. In-Plane")
	abbr.Put("CH0", "Prof. In-Plane")
	narrowNames.Put("CH0", "Prof. In-Plane")
	' Keep a caption without Force between the abbreviated force name and symbol.
	abbr.Put("Hi", "Ind. In-Plane Force")
	abbr.Put("H0", "Prof. In-Plane Force")
	narrowNames.Put("Hi", "Ind. In-Plane")
	narrowNames.Put("H0", "Prof. In-Plane")
	' Exception: only Tc and Pc use the short form "Coeff", to tell them apart from dimensional thrust and power.
	' Coefficient naming rule: Full = "<Name> Coefficient <Symbol>", Short = "<Name> <Symbol>" (the word Coefficient is dropped, never abbreviated).
	' ---------------- Geometry ----------------
	Add("name", "Rotor Name", "Name", "", "", "Identifier of the saved rotor. It appears in the rotor list, in exports, and in the active-rotor bar.", "", "")
	Add("R", "Rotor Radius", "Radius", "R", "m", "Distance from the rotation axis to the blade tip. Defines swept disk area A_DISK and tip speed ΩR." & CRLF & CRLF & "Editing this value rescales both root and tip chords by the same factor, preserving solidity, taper ratio, and aspect ratio.", "A_DISK = πR²,  ΩR = 2π·rpm·R / 60", "0.05 m (small drone) to 12 m (heavy helicopter)")
	Add("Nb", "Blade Count", "Blades", "N_b", "-", "Number of identical blades around the rotor hub." & CRLF & CRLF & "Editing this value scales solidity in direct proportion because blade chords remain fixed." & CRLF & CRLF & "Blade count also enters the Sissingh tip-loss factor.", "σ_REF = N_b·(c_R + c_T) / (2πR)", "2 to 8")
	Add("x0", "Root Cutout", "Root Cutout", "x_0", "-", "Inboard non-dimensional radial station x = r/R where aerodynamic blade loading starts. Aerodynamic integration runs from x_0 to the tip, producing zero lift and profile drag inboard." & CRLF & CRLF & "Editing this value keeps root and tip chords and reference solidity σ_REF unchanged. Actual blade area A_act, actual solidity σ_act, and thrust-weighted solidity σ_TR update accordingly." & CRLF & CRLF & "The blade pitch distribution is anchored at x_0.", "x_0 = r_root / R", "0.05 to 0.30")
	Add("c0", "Root Chord", "Root Chord", "c_R", "m", "Chord of the fictitious linear planform at the rotation axis (x = 0), obtained by extending the linear chord distribution inward. The physical blade begins at root cutout station x_0, so this is not the physical chord at the cutout." & CRLF & CRLF & "Editing this value recalculates reference blade area A_REF, reference solidity σ_REF, aspect ratio AR, and taper ratio.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("c1", "Tip Chord", "Tip Chord", "c_T", "m", "Chord at the blade tip (x = 1). Equal to root chord c_R for a rectangular blade." & CRLF & CRLF & "Editing this value recalculates reference blade area A_REF, reference solidity σ_REF, aspect ratio AR, and taper ratio.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("taper", "Taper Ratio", "Taper", "c_T/c_R", "-", "Ratio of tip chord to axis chord: taper = c_T / c_R. A taper ratio of 1.0 represents a rectangular blade." & CRLF & CRLF & "Editing this value preserves the mean chord c_m = (c_R + c_T)/2 and reference solidity σ_REF, updating root chord c_R and tip chord c_T proportionally.", "taper = c_T / c_R", "0.3 to 1.0")
	Add("sigmaRef", "Reference Solidity", "Reference Solidity", "σ_REF", "-", "Total reference blade area of all blades extended to the rotation axis (x = 0), divided by swept disk area A_DISK. This is the reference solidity used in the analytical aerodynamic equations." & CRLF & CRLF & "Editing this value scales root and tip chords by the same factor, preserving taper ratio and aspect ratio.", "σ_REF = N_b·A_REF / A_DISK", "0.05 to 0.15")
	Add("sigmaAct", "Actual Solidity", "Actual Solidity", "σ_act", "-", "Actual physical blade area from root cutout station x_0 to the blade tip, divided by swept disk area A_DISK. Informational quantity, because root cutout effects enter the equations directly through the lower integration limit." & CRLF & CRLF & "Editing this value scales root and tip chords uniformly, preserving taper ratio.", "σ_act = N_b·A_act / A_DISK", "0.05 to 0.15")
	Add("sigmaT", "Thrust-Weighted Solidity", "Thrust Solidity", "σ_TR", "-", "Blade solidity weighted by radial dynamic pressure weighting x², reflecting where rotor thrust is predominantly generated along the blade span. Used to evaluate blade loading C_T/σ_TR and mean lift coefficient C̄_L." & CRLF & CRLF & "Editing this value scales root and tip chords uniformly, preserving taper ratio.", "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1", "0.05 to 0.15")
	Add("AR", "Aspect Ratio", "Aspect Ratio", "AR", "-", "Rotor blade aspect ratio, defined as rotor radius squared over reference blade area: AR = R² / A_REF = 2R / (c_R + c_T)." & CRLF & CRLF & "Editing this value scales root and tip chords by AR_old / AR_new, preserving rotor radius R and taper ratio.", "AR = R² / A_REF = 2R / (c_R + c_T)", "6 to 25")
	Add("A", "Disk Area", "Disk Area", "A_DISK", "m²", "Total swept disk area of the rotor: A_DISK = πR²." & CRLF & CRLF & "Editing this value updates rotor radius R to √(A_DISK / π) and scales root and tip chords proportionally, preserving solidity and taper ratio.", "A_DISK = πR²", "")
	Add("Ab", "Reference Blade Area", "Reference Area", "A_REF", "m²", "Planform area of one blade of the fictitious linear planform extended to the rotation axis (x = 0): A_REF = R·(c_R + c_T) / 2. This reference blade area defines reference solidity σ_REF." & CRLF & CRLF & "Editing this value scales root and tip chords by the same factor, preserving taper ratio and rotor radius R.", "A_REF = ∫ c dr, 0 to R = R·(c_R + c_T)/2", "")
	Add("Aact", "Actual Blade Area", "Actual Area", "A_act", "m²", "Actual physical planform area of one blade, integrated from root cutout station x_0 to the blade tip: A_act = R·(1 − x_0)·(c_root + c_T) / 2." & CRLF & CRLF & "Editing this value scales root and tip chords by the same factor, preserving taper ratio.", "A_act = ∫ c dr, x_0R to R", "")
	Add("thRoot", "Root Pitch", "Root Pitch", "θ_R", "°", "Geometric blade pitch angle at the root cutout station x_0, before collective pitch is applied." & CRLF & CRLF & "Editing this value updates total blade twist θ_twist while keeping tip pitch θ_T unchanged.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "")
	Add("thTip", "Tip Pitch", "Tip Pitch", "θ_T", "°", "Geometric blade pitch angle at the blade tip (x = 1), before collective pitch is applied." & CRLF & CRLF & "Editing this value updates total blade twist θ_twist while keeping root pitch θ_R unchanged.", "θ_twist = θ_T − θ_R", "")
	Add("thTwist", "Total Blade Twist", "Twist", "θ_twist", "°", "Linear pitch variation along the blade span, from root cutout station x_0 to the blade tip: θ_twist = θ_T − θ_R." & CRLF & CRLF & "Editing this value preserves the mean pitch (θ_R + θ_T)/2 and splits the pitch variation equally between root and tip." & CRLF & CRLF & "Negative twist produces a more uniform induced inflow distribution across the rotor disk and improves hover efficiency.", "θ_twist = θ_T − θ_R", "-20° to 0° (typical -8° to -14°)")
	Add("th75", "Three-Quarter Pitch", "Pitch 75%", "θ_75", "°", "Reference blade pitch angle at 75% radial station (r/R = 0.75), the standard reference station for linearly twisted helicopter blades: θ_75 = θ_R + 0.75·θ_twist." & CRLF & CRLF & "Editing this value translates the entire blade pitch distribution uniformly, preserving total twist θ_twist.", "θ_75 = θ_R + 0.75·θ_twist", "")
	Add("airfoil", "Airfoil Section", "Airfoil", "", "", "Blade aerodynamic section from the database, defining lift-curve slope a_0 and zero-lift profile drag coefficient C_d0." & CRLF & CRLF & "Select Custom to specify independent aerodynamic section characteristics.", "C_l = a_0·α_e,  C_d = C_d0", "")
	Add("a0", "Lift-Curve Slope", "Lift Slope", "a_0", "1/rad", "Two-dimensional blade section lift-curve slope dC_l/dα in linear unstalled flight. Thin-airfoil theory predicts 2π rad⁻¹ (≈ 6.28 rad⁻¹); real rotor airfoils typically exhibit 5.7 to 6.0 rad⁻¹." & CRLF & CRLF & "Subsonic compressibility scales this value via the Prandtl-Glauert rule when enabled.", "C_l = a_0·α_e", "5.0 to 6.3 per rad")
	Add("Cd0", "Profile Drag Coefficient", "Profile Drag", "C_d0", "-", "Equivalent zero-lift profile drag coefficient of the blade section, assumed uniform across the rotor disk." & CRLF & CRLF & "Determines profile torque Q_0 and profile in-plane force H_0.", "C_d = C_d0", "0.008 to 0.012")
	Add("tipModel", "Tip-Loss Model", "Tip Loss", "", "", "Tip-loss formulation modeling finite-blade lift reduction near the blade tip:" & CRLF & CRLF & "• None: Integrates blade loading across the full span to the physical tip (x = 1.0)." & CRLF & CRLF & "• Fixed: Truncates lift integration at a prescribed radial station B." & CRLF & CRLF & "• Sissingh: Computes effective factor B iteratively from operating thrust coefficient C_T and blade count N_b.", "lift integrated from x_0 to B", "")
	Add("B", "Tip-Loss Factor", "Tip Factor", "B", "-", "Non-dimensional radial station (r/R) beyond which blade aerodynamic lift is zero due to tip vortex relief. A factor of 1.0 indicates no tip loss." & CRLF & CRLF & "Effective actuator disk momentum area is scaled by B².", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("comp", "Compressibility Correction", "Compressibility", "", "", "ON: Prandtl-Glauert compressibility correction enabled. Scales the 2D lift-curve slope with the representative blade Mach number at 0.75R: a = a_0 / √(1 − M²), capped at M = 0.85. Increases thrust and power requirements as tip Mach increases. Valid for subsonic flow (M_adv < 1.0)." & CRLF & CRLF & "OFF: Incompressible aerodynamics (M = 0 baseline). Lift-curve slope remains constant at a_0 along the entire blade radius regardless of tip Mach number.", "a = a_0 / √(1 − M²)", "M_adv < 1.0")
	Add("rpmNom", "Rotor Speed", "Rotor Speed", "Ω_nom", "rpm", "Nominal design rotational speed stored with the rotor definition. Seeds the initial rotor speed on the Conditions page.", "Ω = 2π·rpm / 60", "")
	' ---------------- Conditions ----------------
	Add("h", "Pressure Altitude", "Altitude", "h", "m", "Pressure altitude in the International Standard Atmosphere (ISA), determining ambient static pressure p." & CRLF & CRLF & "Air density ρ is calculated from p and ambient temperature T_amb using the ideal gas law.", "p = 101325·(1 − 0.0065·h / 288.15)^{5.2559}", "0 to 6000 m")
	Add("T0", "Ambient Temperature", "Temperature", "T_amb", "°C", "Ambient static air temperature. Specified independently of altitude to model non-standard atmospheric conditions (e.g. hot-and-high)." & CRLF & CRLF & "Determines ambient air density ρ and local speed of sound a.", "ρ = p / (287.058·T),  a = √(1.4·287.058·T),  T in kelvin", "-40 to 50 °C")
	Add("mu", "Advance Ratio", "Advance Ratio", "μ_x", "-", "Advance ratio in the rotor disk plane (tip-path plane), defined as in-plane free-stream airspeed over tip speed: μ_x = V_x / (ΩR)." & CRLF & CRLF & "Static hover corresponds to μ_x = 0.", "μ_x = V_x / (ΩR)", "0 to 0.5")
	Add("Vx", "Forward Airspeed", "Airspeed", "V_x", "m/s", "Component of the free-stream airspeed parallel to the rotor disk plane. Alternative to the advance ratio: μ_x = V_x / (ΩR).", "V_x = μ_x·ΩR", "0 to 100 m/s")
	Add("alpha", "Disk Angle of Attack", "Disk AoA", "α", "°", "Angle between oncoming flow and the rotor disk. Positive when relative flow is upward through the disk, tilting the disk aft and increasing thrust.", "μ_z = −μ_x·tan α", "-20° to 20°")
	Add("Vz", "Climb Speed", "Climb Speed", "V_z", "m/s", "Axial component of airspeed along the rotor shaft (+Z axis). Positive when relative flow is downward through the disk.", "V_z = μ_z·ΩR", "-10 to 10 m/s")
	Add("muz", "Axial Flow Ratio", "Axial Ratio", "μ_z", "-", "Non-dimensional axial flow ratio along the rotor shaft, V_z / (ΩR). Positive when relative flow is downward through the disk.", "μ_z = V_z / (ΩR) = −μ_x·tan α", "-0.1 to 0.1")
	Add("trim", "Trim Mode", "Trim", "", "–", "Rotor equilibrium couples four operational variables: rotor speed Ω, collective pitch Δθ, thrust coefficient C_T, and rotor thrust T." & CRLF & CRLF & "Prescribe two variables as constraints. The solver calculates the remaining two variables from blade-element momentum equilibrium across the specified forward and axial flight conditions.", "T = C_T·ρ·A_DISK·(ΩR)²", "")
	Add("rpm", "Rotor Speed", "Rotor Speed", "Ω", "rpm", "Rotational speed of the rotor hub. Determines tip speed ΩR, dynamic pressure, and blade Mach numbers. Solved by the trim algorithm when not prescribed.", "ΩR = 2π·rpm·R / 60", "")
	Add("coll", "Collective Pitch", "Collective", "Δθ", "°", "Collective pitch increment added uniformly along the blade span to the baseline geometric twist distribution. Solved by bisection equilibrium when not prescribed.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "0° to 20°")
	Add("Ttgt", "Target Thrust", "Target Thrust", "T", "N", "Target rotor thrust constraint enforced during equilibrium trim solution. Paired with one other prescribed operating variable.", "T = C_T·ρ·A_DISK·(ΩR)²", "")
	Add("CTtgt", "Target Thrust Coefficient", "Target", "C_T", "-", "Target thrust coefficient constraint enforced during equilibrium trim solution. Paired with collective pitch Δθ, rotor speed Ω, or target thrust T.", "C_T = T / [ρ·A_DISK·(ΩR)²]", "0.002 to 0.015")
	Add("inflow", "Inflow Model", "Inflow", "", "", "How the induced velocity is distributed across the rotor disk:" & CRLF & CRLF & "• Uniform: Constant induced inflow across the entire disk from momentum theory. No gradients (K_x = K_y = 0); no hub moments or side force." & CRLF & CRLF & "• Coleman: Adds a longitudinal inflow gradient K_x = tan(χ/2) based on the wake skew angle χ. Lateral gradient is zero." & CRLF & CRLF & "• Coleman-Feingold (NDARC): Longitudinal gradient with factor 15π/32 on tan(χ/2), plus a lateral inflow gradient K_y = −2μ." & CRLF & CRLF & "• Drees: Speed-dependent longitudinal gradient K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2) and lateral gradient K_y = −2μ. Classic helicopter reference.", "λ_d(x,ψ) = λ + λ_i·x·(K_x·cosψ + K_y·sinψ)", "")
	Add("kind", "Induced Power Factor", "Induced Factor", "k_ind", "-", "Empirical induced power correction factor accounting for non-uniform downwash, tip losses, and wake swirl. Ideal momentum theory corresponds to k_ind = 1.0." & CRLF & CRLF & "Scales the ideal induced torque in the energy balance: C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi.", "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi", "1.05 to 1.30")
	Add("drag", "Profile Drag Integration", "Drag Integration", "", "", "Integration formulation for profile drag power over the rotor disk:" & CRLF & CRLF & "• Tangential: Closed form retaining only in-plane tangential velocity u_T. Fast, least detailed." & CRLF & CRLF & "• Vectorial: Closed form including radial and axial velocities." & CRLF & CRLF & "• Numerical: Evaluates total resultant velocity W via Gauss-Legendre quadrature (16 radial × 24 azimuth stations). Reference method.", "dD = ½ρ W² c C_d0 dr", "")
	' ---------------- Results ----------------
	Add("T", "Thrust", "Thrust", "T", "N", "Total aerodynamic force along the rotor shaft axis, positive upward along −Z. Evaluated from the thrust coefficient as T = C_T·ρ·A_DISK·(ΩR)².", "T = C_T·ρ·A_DISK·(ΩR)²", "")
	Add("P", "Shaft Power", "Power", "P", "W", "Total mechanical shaft power required to drive the rotor: P = Q·Ω." & CRLF & CRLF & "Decomposed via energy balance into induced power P_i and profile power P_0.", "P = Q·Ω = C_Q·ρ·A_DISK·(ΩR)³", "")
	Add("Pi", "Induced Power", "Induced Power", "P_i", "W", "Shaft power required to generate rotor thrust and support climb/propulsive work. Derived from the induced torque coefficient C_Qi through the blade-element energy balance.", "P_i = C_Qi·ρ·A_DISK·(ΩR)³", "")
	Add("P0", "Profile Power", "Profile Power", "P_0", "W", "Shaft power dissipated by section profile drag over the rotor disk. Derived from the integrated profile torque coefficient C_Q0.", "P_0 = C_Q0·ρ·A_DISK·(ΩR)³", "")
	Add("Q", "Shaft Torque", "Torque", "Q", "N·m", "Aerodynamic shaft torque opposing rotor rotation. Sum of induced torque Q_i and profile torque Q_0: Q = C_Q·ρ·A_DISK·(ΩR)²·R.", "Q = C_Q·ρ·A_DISK·(ΩR)²·R", "")
	Add("H", "In-Plane Force", "In-Plane Force", "H", "N", "In-plane rotor force component parallel to the in-plane free stream, positive aft (opposing flight direction). Rigid-rotor formulation; equals the total longitudinal hub force.", "H = C_H·ρ·A_DISK·(ΩR)²", "")
	Add("Y", "Side Force", "Side Force", "Y", "N", "In-plane rotor force component perpendicular to the in-plane free stream, positive toward the advancing side (right side for counter-clockwise rotation). Zero under axisymmetric uniform inflow.", "Y = C_Y·ρ·A_DISK·(ΩR)²", "")
	Add("Mx", "Roll Moment", "Roll Moment", "M_x", "N·m", "Aerodynamic roll moment about the rotor hub, positive advancing side down (right-wing down). Transmitted directly to the shaft in a rigid-rotor model without flapping hinges.", "M_x = C_Mx·ρ·A_DISK·(ΩR)²·R", "")
	Add("My", "Pitch Moment", "Pitch Moment", "M_y", "N·m", "Aerodynamic pitching moment about the rotor hub, positive nose-up. Transmitted directly to the shaft in a rigid-rotor model; non-zero only with asymmetric longitudinal inflow gradients.", "M_y = C_My·ρ·A_DISK·(ΩR)²·R", "")
	Add("DL", "Disk Loading", "Disk Loading", "T/A_DISK", "N/m²", "Rotor thrust per unit swept disk area: DL = T / A_DISK." & CRLF & CRLF & "Lower disk loading reduces momentum induced velocity and improves hover power efficiency.", "DL = T / A_DISK", "50 to 500 N/m² (helicopters)")
	Add("PL", "Power Loading", "Power Loading", "T/P", "N/W", "Rotor thrust produced per unit shaft power: PL = T / P." & CRLF & CRLF & "Classical measure of rotor lifting efficiency per unit installed engine power.", "PL = T / P", "0.05 to 0.15 N/W")
	Add("Vztot", "Total Axial Speed", "Total Axial Speed", "V_{z,tot}", "m/s", "Total flow velocity through the rotor disk: V_{z,tot} = V_z + v_i = λ·ΩR. Positive when total flow is downward through the disk.", "V_{z,tot} = V_z + v_i = λ ΩR", "")
	abbr.Put("Vztot", "Axial Speed")
	Add("Vadv", "Advancing Speed", "Advancing Speed", "V_adv", "m/s", "Tangential relative speed at the advancing blade tip, r/R = 1 and ψ = 90°. Excludes the axial component.", "V_adv = ΩR + V_x", "")
	abbr.Put("Vadv", "Adv. Speed")
	Add("Vret", "Retreating Speed", "Retreating Speed", "V_ret", "m/s", "Signed tangential relative speed at the retreating blade tip, r/R = 1 and ψ = 270°. Excludes the axial component.", "V_ret = ΩR − V_x", "")
	abbr.Put("Vret", "Ret. Speed")
	Add("Mret", "Retreating Mach", "Retreating Mach", "M_ret", "-", "Magnitude of retreating tip tangential speed divided by sound speed. Same tangential convention as Advancing Mach.", "M_ret = |ΩR − V_x| / a", "")
	abbr.Put("Mret", "Ret. Mach")
	Add("aoaAdv25", "Advancing AoA 25%", "Adv. AoA 25%", "α_{adv,25}", "deg", "Blade-section angle of attack at r/R = 0.25 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.", "α_s = θ(0.25) − φ", "")
	abbr.Put("aoaAdv25", "Adv. AoA 25")
	Add("aoaRet25", "Retreating AoA 25%", "Ret. AoA 25%", "α_{ret,25}", "deg", "Blade-section angle of attack at r/R = 0.25 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.", "α_s = θ(0.25) − φ", "")
	abbr.Put("aoaRet25", "Ret. AoA 25")
	Add("phiAdv25", "Advancing Inflow Angle 25%", "Adv. Inflow 25%", "φ_{adv,25}", "deg", "Local inflow angle at r/R = 0.25 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiAdv25", "Adv. Inflow 25")
	Add("phiRet25", "Retreating Inflow Angle 25%", "Ret. Inflow 25%", "φ_{ret,25}", "deg", "Local inflow angle at r/R = 0.25 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiRet25", "Ret. Inflow 25")

	Add("aoaAdv50", "Advancing AoA 50%", "Adv. AoA 50%", "α_{adv,50}", "deg", "Blade-section angle of attack at r/R = 0.50 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable inside the root cutout or in reverse flow.", "α_s = θ(0.50) − φ", "")
	abbr.Put("aoaAdv50", "Adv. AoA 50")
	Add("aoaRet50", "Retreating AoA 50%", "Ret. AoA 50%", "α_{ret,50}", "deg", "Blade-section angle of attack at r/R = 0.50 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable inside the root cutout or in reverse flow.", "α_s = θ(0.50) − φ", "")
	abbr.Put("aoaRet50", "Ret. AoA 50")
	Add("phiAdv50", "Advancing Inflow Angle 50%", "Adv. Inflow 50%", "φ_{adv,50}", "deg", "Local inflow angle at r/R = 0.50 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiAdv50", "Adv. Inflow 50")
	Add("phiRet50", "Retreating Inflow Angle 50%", "Ret. Inflow 50%", "φ_{ret,50}", "deg", "Local inflow angle at r/R = 0.50 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable inside the root cutout or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiRet50", "Ret. Inflow 50")

	Add("aoaAdv75", "Advancing AoA 75%", "Adv. AoA 75%", "α_{adv,75}", "deg", "Blade-section angle of attack at r/R = 0.75 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.", "α_s = θ(0.75) − φ", "")
	abbr.Put("aoaAdv75", "Adv. AoA 75")
	Add("aoaRet75", "Retreating AoA 75%", "Ret. AoA 75%", "α_{ret,75}", "deg", "Blade-section angle of attack at r/R = 0.75 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.", "α_s = θ(0.75) − φ", "")
	abbr.Put("aoaRet75", "Ret. AoA 75")
	Add("phiAdv75", "Advancing Inflow Angle 75%", "Adv. Inflow 75%", "φ_{adv,75}", "deg", "Local inflow angle at r/R = 0.75 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiAdv75", "Adv. Inflow 75")
	Add("phiRet75", "Retreating Inflow Angle 75%", "Ret. Inflow 75%", "φ_{ret,75}", "deg", "Local inflow angle at r/R = 0.75 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiRet75", "Ret. Inflow 75")

	Add("aoaAdvTip", "Advancing AoA Tip", "Adv. AoA Tip", "α_{adv,tip}", "deg", "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.", "α_s = θ(1.0) − φ", "")
	abbr.Put("aoaAdvTip", "Adv. AoA Tip")
	Add("aoaRetTip", "Retreating AoA Tip", "Ret. AoA Tip", "α_{ret,tip}", "deg", "Blade-section angle of attack at the blade tip (r/R = 1.0) and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.", "α_s = θ(1.0) − φ", "")
	abbr.Put("aoaRetTip", "Ret. AoA Tip")
	Add("phiAdvTip", "Advancing Inflow Angle Tip", "Adv. Inflow Tip", "φ_{adv,tip}", "deg", "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiAdvTip", "Adv. Inflow Tip")
	Add("phiRetTip", "Retreating Inflow Angle Tip", "Ret. Inflow Tip", "φ_{ret,tip}", "deg", "Local inflow angle at the blade tip (r/R = 1.0) and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiRetTip", "Ret. Inflow Tip")
	Add("vi", "Induced Speed", "Induced Speed", "V_i", "m/s", "Mean momentum induced downwash velocity: v_i = λ_i·ΩR. Positive when induced flow is downward through the disk.", "v_i = λ_i·ΩR", "")
	Add("CT", "Thrust Coefficient", "Thrust Coeff.", "C_T", "-", "Non-dimensional rotor thrust coefficient: C_T = T / [ρ·A_DISK·(ΩR)²]." & CRLF & CRLF & "Computed from spanwise blade-element integration in equilibrium with actuator disk momentum theory.", "C_T = T / [ρ·A_DISK·(ΩR)²]", "0.002 to 0.015")
	Add("CQ", "Torque Coefficient", "Torque Coeff.", "C_Q", "-", "Non-dimensional rotor shaft torque coefficient: C_Q = Q / [ρ·A_DISK·(ΩR)²·R]." & CRLF & CRLF & "Identically equals the rotor power coefficient C_P.", "C_Q = Q / [ρ·A_DISK·(ΩR)²·R] = C_Qi + C_Q0 = C_P", "")
	Add("CQi", "Induced Torque Coefficient", "Ind. Torque Coeff.", "C_Qi", "-", "Induced and axial-flight component of the torque coefficient from global energy conservation: C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi.", "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi", "")
	Add("Qi", "Induced Torque", "Induced Torque", "Q_i", "N·m", "Induced shaft torque component, evaluated from the induced torque coefficient: Q_i = C_Qi·ρ·A_DISK·(ΩR)²·R. Q_i·Ω equals induced power P_i.", "Q_i = C_Qi·ρ·A_DISK·(ΩR)²·R", "")
	Add("Q0", "Profile Torque", "Profile Torque", "Q_0", "N·m", "Profile drag shaft torque component, evaluated from the integrated profile torque coefficient: Q_0 = C_Q0·ρ·A_DISK·(ΩR)²·R. Q_0·Ω equals profile power P_0.", "Q_0 = C_Q0·ρ·A_DISK·(ΩR)²·R", "")
	Add("Hi", "Induced In-Plane Force", "Induced In-Plane Force", "H_i", "N", "Induced component of the in-plane hub force, resulting from the rearward tilt of the section lift vectors by local inflow: H_i = C_Hi·ρ·A_DISK·(ΩR)².", "H_i = C_Hi·ρ·A_DISK·(ΩR)²", "")
	Add("H0", "Profile In-Plane Force", "Profile In-Plane Force", "H_0", "N", "Profile drag component of the in-plane hub force, integrated over the rotor disk: H_0 = C_H0·ρ·A_DISK·(ΩR)². Total in-plane force is H = H_i + H_0.", "H_0 = C_H0·ρ·A_DISK·(ΩR)²", "")
	Add("Pair", "Air Power", "Air Power", "P_air", "W", "Total aerodynamic rate of work delivered to the airflow: P_air = P + μ·H·ΩR." & CRLF & CRLF & "Sum of shaft power and propulsive work of the in-plane hub force.", "P_air = C_Pair·ρ·A_DISK·(ΩR)³ = P + μ·H·ΩR", "")
	Add("CQ0", "Profile Torque Coefficient", "Prof. Torque Coeff.", "C_Q0", "-", "Profile drag component of the rotor torque coefficient, integrated over blade span and azimuth using the local resultant velocity.", "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π", "")
	Add("CH", "In-Plane Force Coefficient", "In-Plane Coeff.", "C_H", "-", "Total in-plane hub force coefficient, positive rearward (drag direction): C_H = C_Hi + C_H0.", "C_H = C_Hi + C_H0", "")
	Add("CHi", "Induced In-Plane Force Coefficient", "Ind. In-Plane Coeff.", "C_Hi", "-", "Induced component of the in-plane force coefficient, resulting from the rearward tilt of section lift vectors by the local inflow angle.", "C_Hi = (a/4)·[λ·μ·Θ_0 + λ_1s·(Θ_2 − 2λ·I_1)]", "")
	Add("CH0", "Profile In-Plane Force Coefficient", "Prof. In-Plane Coeff.", "C_H0", "-", "Profile drag component of the in-plane force coefficient, integrated over blade radius and azimuth using the local relative velocity.", "C_H0 = ∬ (σ·C_d0/2)·W·(x·sinψ + μ) dx dψ / 2π", "")
	Add("CY", "Side Force Coefficient", "Side Force", "C_Y", "-", "Side force coefficient directed toward the advancing blade (+Y). Arises from longitudinal inflow asymmetry across the rotor disk.", "C_Y = −(a/4)·K_x·λ_i·(Θ_2 − 2λ·I_1)", "")
	Add("CMx", "Roll Moment Coefficient", "Roll Moment", "C_Mx", "-", "Non-dimensional hub rolling moment coefficient, positive advancing side down. Evaluated for a rigid rotor without flapping hinges.", "C_Mx = −(a·μ/2)·(Θ_2 − ½λ·I_1) + (a/4)·λ_1s·I_3", "")
	Add("CMy", "Pitch Moment Coefficient", "Pitch Moment", "C_My", "-", "Non-dimensional hub pitching moment coefficient, positive nose-up. Evaluated for a rigid rotor; driven by the longitudinal inflow gradient K_x.", "C_My = (a/4)·K_x·λ_i·I_3", "")
	Add("CPair", "Air Power Coefficient", "Air Power", "C_Pair", "-", "Total air power coefficient from energy conservation: C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0 = C_P + μ·C_H.", "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0", "")
	Add("CTs", "Blade Loading", "Blade Loading", "C_T/σ_TR", "-", "Rotor blade loading coefficient: C_T / σ_TR. Characterizes mean aerodynamic lift demand per blade. Blade stall typically limits maximum values to 0.12–0.15.", "C_T / σ_TR", "0.05 to 0.12")
	Add("CLbar", "Mean Lift Coefficient", "Mean Lift Coefficient", "C̄_L", "-", "Mean rotor blade lift coefficient, evaluated from thrust-weighted blade loading: C̄_L = 6·C_T / σ_TR. Provides stall margin comparison against airfoil C_l,max.", "C̄_L = 6·C_T / σ_TR", "0.3 to 0.7")
	Add("FM", "Figure of Merit (hover only)", "Figure of Merit", "FM", "-", "Rotor Figure of Merit in hover, defined as the ratio of ideal minimum induced power to actual shaft power: FM = (C_T^{1.5} / √2) / C_P.", "FM = (C_T^{1.5}/√2) / (k_ind·C_T^{1.5}/√2 + C_Q0)", "0.55 to 0.80")
	Add("LDe", "Effective Lift/Drag Ratio", "Eff. Lift/Drag", "(L/D)_e", "-", "Effective rotor lift-to-drag ratio in translational flight: (L/D)_e = V_x·T / P_air = μ·C_T / C_Pair. Measure of cruise aerodynamic transport efficiency.", "(L/D)_e = μ·C_T / C_Pair", "4 to 10")
	Add("lam", "Total Inflow Ratio", "Inflow Ratio", "λ", "-", "Total rotor inflow ratio normal to the disk (+Z axis): λ = μ_z + λ_i. Positive when total flow is downward through the disk.", "λ = μ_z + λ_i", "")
	Add("lami", "Induced Inflow Ratio", "Induced Inflow", "λ_i", "-", "Non-dimensional induced velocity ratio: λ_i = v_i / (ΩR). Positive when induced flow is downward through the disk. Solved iteratively to balance blade-element thrust with actuator disk momentum flux.", "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)", "0.03 to 0.08 (hover)")
	Add("lamh", "Hover Inflow Ratio", "Hover Inflow", "λ_h", "-", "Ideal hover induced inflow ratio from momentum theory: λ_h = √(C_T / 2). Serves as aerodynamic normalization reference for forward and axial flight inflow.", "λ_h = √(C_T / 2)", "0.03 to 0.08")
	Add("muLam", "Advance-to-Inflow Ratio", "Advance/Inflow", "μ/λ", "-", "Advance-to-inflow ratio: μ_x / λ. Characterizes rotor wake inclination relative to the shaft axis and governs wake skew angle χ.", "μ/λ = μ_x / (μ_z + λ_i)", "0 to 20")
	Add("Tc", "Dynamic Thrust Coefficient", "Dynamic Thrust Coeff", "T_c", "-", "Dynamic thrust coefficient based on free-stream dynamic pressure: T_c = T / (½ρV_∞²A_DISK) = 2C_T / μ_∞²." & CRLF & CRLF & "Undefined in static hover (V_∞ = 0).", "T_c = T / (½ρV²A_DISK) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)", "")
	Add("Pc", "Dynamic Power Coefficient", "Dynamic Power Coeff", "P_c", "-", "Dynamic power coefficient based on free-stream dynamic pressure: P_c = P / (½ρV_∞³A_DISK) = 2C_P / μ_∞³." & CRLF & CRLF & "Undefined in static hover (V_∞ = 0).", "P_c = P / (½ρV³A_DISK) = 2C_P / μ_∞²,  V = √(V_x² + V_z²)", "")
	Add("Kx", "Longitudinal Inflow Gradient", "Long. Gradient", "K_x", "-", "Longitudinal induced inflow gradient parameter. Produces increased induced downwash over the aft portion of the rotor disk: λ_i(x, ψ) = λ_i·(1 + K_x·x·cosψ).", "Coleman: K_x = tan(χ/2)", "")
	Add("Ky", "Lateral Inflow Gradient", "Lat. Gradient", "K_y", "-", "Lateral induced inflow gradient parameter. Accounts for lateral downwash asymmetry between advancing and retreating sides: λ_i(x, ψ) = λ_i·(1 + K_y·x·sinψ).", "Drees: K_y = −2μ", "")
	Add("chi", "Wake Skew Angle", "Wake Skew", "χ", "°", "Rotor wake skew angle relative to the shaft axis (+Z downward). Approaches 0° in axial climb/hover and 90° in high-speed forward flight.", "tan(χ/2) = μ / (√(μ² + λ²) + |λ|)", "0° to 90°")
	Add("Bres", "Tip-Loss Factor", "Tip Factor", "B", "-", "Effective blade tip-loss factor B applied in the aerodynamic solution. Prescribed directly in Fixed mode, or converged iteratively in Sissingh mode.", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("OmR", "Tip Speed", "Tip Speed", "ΩR", "m/s", "Speed of the blade tip relative to the hub.", "ΩR = 2π·rpm·R / 60", "150 to 250 m/s (helicopters)")
	Add("Mtip", "Tip Mach", "Tip Mach", "M_tip", "-", "Tip speed over local speed of sound.", "M_tip = ΩR / a", "0.4 to 0.7")
	Add("Madv", "Advancing Tip Mach", "Adv. Mach", "M_adv", "-", "Mach number of the advancing blade tip: M_adv = ΩR·(1 + μ_x) / a." & CRLF & CRLF & "Compressibility effects start near 0.8 to 0.9. Prandtl-Glauert is not valid at or above 1.0.", "M_adv = ΩR·(1 + μ_x) / a", "up to 0.9")
	Add("rho", "Air Density", "Density", "ρ", "kg/m³", "Air density from the standard-atmosphere pressure and the temperature entered.", "ρ = p / (287.058·T)", "0.9 to 1.225 kg/m³")
	Add("p", "Ambient Pressure", "Pressure", "p", "Pa", "Static pressure at the pressure altitude, from the standard atmosphere.", "p = 101325·(1 − 0.0065·h / 288.15)^{5.2559}", "")
	Add("a", "Speed of Sound", "Sound Speed", "a", "m/s", "Local speed of sound at the ambient temperature.", "a = √(1.4·287.058·T)", "")
	' ---------------- Option help: tip loss ----------------
	Add("tip_none", "Tip Loss None", "None", "B", "", "No tip-loss correction. Aerodynamic blade loading is integrated across the full span to x = 1.0 (optimistic bound).", "B = 1", "")
	Add("tip_fixed", "Tip Loss Fixed", "Fixed", "B", "", "Fixed tip-loss station B specified in geometry. Radial blade integration cuts off at station B, neglecting tip vortex relief outboard.", "B = typed value", "0.92 to 0.98")
	Add("tip_sissingh", "Tip Loss Sissingh", "Sissingh", "B", "", "Semi-empirical tip-loss factor calculated from blade count and operating thrust coefficient: B = 1 − √(2C_T) / N_b, solved iteratively.", "B = 1 − √(2C_T) / N_b", "")
	' ---------------- compressibility ----------------
	Add("comp_off", "Compressibility Off", "Off", "", "", "Incompressible flow assumption (M = 0). Blade section lift-curve slope remains constant at the nominal incompressible value a_0.", "a = a_0", "")
	Add("comp_pg", "Prandtl-Glauert", "On", "", "", "Prandtl-Glauert subsonic compressibility correction. Scales 2D lift-curve slope using effective Mach number at 0.75R: a = a_0 / √(1 − M_eff²), capped at M = 0.85.", "a = a_0 / √(1 − M_eff²),  M_eff = M_tip·√(0.75² + μ²/2)", "")
	' ---------------- inflow models ----------------
	Add("inflow_uniform", "Uniform Inflow", "Uniform", "", "", "Classical actuator disk momentum theory with uniform induced downwash across the rotor disk (K_x = K_y = 0). Produces zero hub pitching moment and side force.", "K_x = K_y = 0", "")
	Add("inflow_coleman_simple", "Coleman", "Coleman", "", "", "Coleman (1945) first-harmonic inflow model with longitudinal gradient K_x = tan(χ/2) derived from wake skew angle χ. Lateral gradient is zero (K_y = 0).", "K_x = tan(χ/2),  K_y = 0", "")
	Add("inflow_coleman_feingold", "Coleman-Feingold (NDARC)", "Coleman-FG", "", "", "Coleman-Feingold harmonic inflow model (NDARC standard). Longitudinal gradient K_x = (15π/32)·tan(χ/2) and lateral gradient K_y = −2μ.", "K_x = (15π/32)·tan(χ/2),  K_y = −2μ", "")
	Add("inflow_drees", "Drees", "Drees", "", "", "Drees (1949) harmonic inflow model. Incorporates advance-ratio dependent longitudinal gradient K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2) and lateral gradient K_y = −2μ.", "K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2),  K_y = −2μ", "")
	' ---------------- trim modes ----------------
	Add("trim_none", "Trim None", "None", "", "", "Uses the typed collective pitch and rotor speed as they are.", "", "")
	Add("trim_collective", "Trim Collective", "Collective", "Δθ", "", "Solves the collective pitch so the result matches the target thrust or thrust coefficient at the prescribed rotor speed.", "T(Δθ) = T_target", "")
	Add("trim_rpm", "Trim Rotor Speed", "Rotor Speed", "Ω", "", "Solves the rotor speed so the result matches the target, with the collective held.", "T(Ω) = T_target", "")
	Add("rpm_collective", "Prescribe Speed & Collective", "Ω + Δθ", "Ω, Δθ", "", "Operating state with rotor speed Ω and collective pitch Δθ prescribed directly. Solves thrust coefficient C_T and thrust T directly.", "T = C_T·ρ·A_DISK·(ΩR)²", "")
	Add("rpm_ct", "Prescribe Speed & Target C_T", "Ω + C_T", "Ω, C_T", "", "Operating state with rotor speed Ω and thrust coefficient C_T prescribed. Solves collective pitch Δθ by bisection until BET thrust matches target C_T, then computes T.", "C_T,BET(Δθ) = C_T,target", "")
	Add("rpm_thrust", "Prescribe Speed & Target Thrust", "Ω + T", "Ω, T", "", "Operating state with rotor speed Ω and dimensional thrust T prescribed. Solves collective pitch Δθ by bisection until thrust matches target T.", "T(Δθ) = T_target", "")
	Add("collective_ct", "Prescribe Collective & Target C_T", "Δθ + C_T", "Δθ, C_T", "", "Operating state with collective pitch Δθ and thrust coefficient C_T prescribed. Solves rotor speed Ω by bisection, then computes thrust T.", "Ω from C_T(Ω) = C_T,target", "")
	Add("collective_thrust", "Prescribe Collective & Target Thrust", "Δθ + T", "Δθ, T", "", "Operating state with collective pitch Δθ and dimensional thrust T prescribed. Solves rotor speed Ω by bisection, then computes thrust coefficient C_T.", "Ω from T(Ω) = T_target", "")
	Add("ct_thrust", "Prescribe Target C_T & Target Thrust", "C_T + T", "C_T, T", "", "Operating state with thrust coefficient C_T and dimensional thrust T prescribed. Solves tip speed ΩR directly from dynamic pressure, then solves collective Δθ by bisection.", "ΩR = √(T / [ρ·A_DISK·C_T])", "")
	' ---------------- drag integration ----------------
	Add("drag_tangential", "Analytical Tangential", "Tangential", "", "", "Closed form using only the tangential velocity component. Fast, least detailed.", "U_T = x + μ·sinψ", "")
	Add("drag_vectorial", "Analytical Vectorial", "Vectorial", "", "", "Closed form using the full relative velocity vector.", "W² = u_T² + u_R² + μ_z²", "")
	Add("drag_numerical", "Numerical Vectorial", "Num. Vec.", "", "", "Gauss-Legendre quadrature over blade radius (16 points) and azimuth (24 points) with the full relative velocity. Reference method.", "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π", "")
	' ---------------- sweep trim modes ----------------
	Add("sw_none", "No Trim (Fixed Controls)", "No Trim", "", "", "Collective and speed are held at the Conditions values for every point of the sweep.", "", "")
	Add("sw_coll_all", "Trim Collective Δθ · Every Point", "Collective Every Point", "", "", "Re-solves the collective at every sweep point so the target thrust or thrust coefficient is held.", "Δθ(μ) from T = T_target", "")
	Add("sw_rpm_all", "Trim Rotor Speed Ω · Every Point", "Speed Every Point", "", "", "Re-solves the rotor speed at every sweep point so the target thrust is held.", "Ω(μ) from T = T_target", "")
	Add("sw_coll_hover", "Trim Collective Δθ · Hover Only", "Collective Hover Only", "", "", "Solves the collective once at μ = 0 and holds it fixed along the sweep, so thrust varies with speed.", "Δθ from T(μ=0) = T_target", "")
	Add("sw_rpm_hover", "Trim Rotor Speed Ω · Hover Only", "Speed Hover Only", "", "", "Solves the rotor speed once at μ = 0 and holds it fixed along the sweep, so thrust varies with speed.", "Ω from T(μ=0) = T_target", "")
	' ---------------- actions ----------------
	Add("save", "Save Rotor", "Save", "", "", "Stores the current geometry under its name in the app private storage. The page stays open.", "", "")
	Add("copy", "Copy Rotor", "Copy", "", "", "Creates an independent duplicate of the active rotor that you can edit freely.", "", "")
	Add("delete", "Delete Rotor", "Delete", "", "", "Removes the saved rotor from storage. This cannot be undone.", "", "")
	Add("newRotor", "New Rotor", "New", "", "", "Starts a new custom rotor from default values.", "", "")
	Add("activeRotor", "Active Rotor", "Active Rotor", "", "", "The rotor used for all calculations. Tap to pick another saved rotor or create one.", "", "")
	Add("sweep", "Advance Ratio Sweep", "Sweep", "", "", "Computes the selected quantities over a range of advance ratio or forward airspeed, using the current geometry and conditions.", "", "")
	Add("table", "Sweep Table", "Table", "", "", "Shows the sweep values as a numeric table.", "", "")
	Add("csv", "Export CSV", "CSV", "", "", "Saves the sweep data as a CSV file in a location you choose. No storage permission needed.", "", "")
	Add("png", "Export PNG", "PNG", "", "", "Saves the sweep plot as an image in a location you choose. No storage permission needed.", "", "")
	Add("palette", "Plot Palette", "Palette", "", "", "Color scheme used for the sweep curves.", "", "")
	Add("sweepTrim", "Sweep Trim", "Sweep Trim", "", "", "Chooses which control, if any, is re-solved along the sweep to hold the target thrust or thrust coefficient. Hover only solves it once at μ = 0.", "", "")
	Add("xAxis", "Sweep Axis", "Axis", "", "", "Horizontal axis of the sweep: advance ratio μ_x or forward airspeed V_x. The sweep is always computed in μ_x; V_x is shown through the tip speed.", "μ_x = V_x / (ΩR)", "")
	Add("xAxis_mu", "Advance Ratio", "Advance Ratio", "μ_x", "-", "Sweep X axis in advance ratio. Independent of rotor speed, so curves from different speeds line up.", "μ_x = V_x / (ΩR)", "0 to 0.5")
	Add("xAxis_Vx", "Forward Airspeed", "Airspeed", "V_x", "m/s", "Sweep X axis in forward airspeed. Each μ_x point is converted with the tip speed of that curve, so curves at different rotor speeds spread differently.", "V_x = μ_x·ΩR", "0 to 100 m/s")
	Add("tabGeom", "Geometry Page", "Geometry", "", "", "Edit the rotor planform, solidity, blade pitch and section aerodynamics. Every quantity is an input; the others update as you type.", "", "")
	Add("tabCond", "Conditions Page", "Conditions", "", "", "Set the atmosphere, flow state, trim mode and inflow model used for the calculation.", "", "")
	Add("tabRes", "Results Page", "Results", "", "", "Solved forces, power, coefficients, inflow and Mach numbers at the current operating point.", "", "")
	Add("family", "Curve Family", "Family", "", "", "Repeats the sweep for several values of one parameter, drawing one curve per value.", "", "")
End Sub

Private Sub Fld(key As String) As String()
	Ensure
	If tbl.ContainsKey(key) Then Return tbl.Get(key)
	Return Array As String(key, key, "", "", "", "", "")
End Sub

Public Sub HasKey(key As String) As Boolean
	Ensure
	Return tbl.ContainsKey(key)
End Sub
Public Sub FullName(key As String) As String
	Return Fld(key)(0)
End Sub
Public Sub ShortName(key As String) As String
	Return Fld(key)(1)
End Sub
' Plain-text symbol with "_" subscripts ("" if the quantity has no symbol)
Public Sub Symbol(key As String) As String
	Return Fld(key)(2)
End Sub
Public Sub UnitHint(key As String) As String
	Return Fld(key)(3)
End Sub
Public Sub HelpBody(key As String) As String
	Return Fld(key)(4)
End Sub
Public Sub HelpEquation(key As String) As String
	Return Fld(key)(5)
End Sub
Public Sub HelpRange(key As String) As String
	Return Fld(key)(6)
End Sub

' Level 0 = Full + Symbol, 1 = Short + Symbol, 2 = Narrow + Symbol, 3 = Abbreviation + Symbol, 4 = Symbol only
Public Sub PlainLabel(key As String, level As Int) As String
	Dim f() As String = Fld(key)
	Dim s As String = f(2)
	Select level
		Case 0
			If s.Length = 0 Then Return f(0)
			Return f(0) & " " & s
		Case 1
			If s.Length = 0 Then Return f(1)
			Return f(1) & " " & s
		Case 2
			Dim narrow As String = NarrowName(key)
			If narrow = s Then Return narrow
			If s.Length > 0 Then Return narrow & " " & s
			Return narrow
		Case 3
			Dim a As String = Abbreviation(key)
			If s.Length = 0 Or a = s Then Return a
			Return a & " " & s
		Case Else
			If s.Length > 0 Then Return s
			Return MinimumName(key)
	End Select
End Sub

Public Sub ResultPlainLabel(key As String, level As Int) As String
	Dim sym As String = Symbol(key)
	Dim caption As String = FullName(key)
	If level = 1 Then caption = ShortName(key)
	If level = 3 Then caption = Abbreviation(key)
	If level = 2 Then caption = NarrowName(key)
	If level = 4 Then
		If sym.Length > 0 Then Return sym
		Return MinimumName(key)
	End If
	If sym.Length = 0 Then Return caption
	Return caption & " " & sym
End Sub

' Choose at normal engineering size, preserving the symbol and the shared row grid.
Public Sub ResultLabel(key As String, widthPx As Int, textSp As Float) As CSBuilder
	For Each level As Int In Array As Int(0, 1, 3, 2, 4)
		Dim caption As String = ResultPlainLabel(key, level)
		If MeasureText(caption, textSp) <= widthPx Then Return RichText(caption)
	Next
	Return RichText(Symbol(key))
End Sub

Public Sub NarrowName(key As String) As String
	Ensure
	If narrowNames.ContainsKey(key) Then Return narrowNames.Get(key)
	Return Abbreviation(key)
End Sub

Public Sub MinimumName(key As String) As String
	Ensure
	If minimumNames.ContainsKey(key) Then Return minimumNames.Get(key)
	Return Abbreviation(key)
End Sub

Public Sub Abbreviation(key As String) As String
	Ensure
	If abbr.ContainsKey(key) Then Return abbr.Get(key)
	Return Fld(key)(1)
End Sub

' Next level to try after "level" (fit order L, M, A, S, symbol); -1 after the last.
Public Sub NextLevel(level As Int) As Int
	Select level
		Case 0: Return 1
		Case 1: Return 3
		Case 3: Return 2
		Case 2: Return 4
	End Select
	Return -1
End Sub

' Label with real subscripts (same rendering for every symbol in the app)
Public Sub RichLabel(key As String, level As Int) As CSBuilder
	Return RichText(PlainLabel(key, level))
End Sub

' Renders X_abc as X with a lowered, smaller abc; X^abc as X with a raised, smaller abc.
Public Sub RichText(text As String) As CSBuilder
	Dim cs As CSBuilder
	cs.Initialize
	Dim m As Matcher = Regex.Matcher("(_\{([^}]+)\}|_([A-Za-z0-9]+))|(\^\{([^}]+)\}|\^([0-9]+(?:\.[0-9]+)?|[A-Za-z0-9]+))", text)
	Dim prev As Int = 0
	Do While m.Find
		cs.Append(text.SubString2(prev, m.GetStart(0)))
		If m.Group(1) <> Null Then
			Dim subText As String = m.Group(2)
			If subText = Null Then subText = m.Group(3)
			cs.VerticalAlign(2dip).RelativeSize(0.72).Append(subText).Pop.Pop
		Else
			Dim supText As String = m.Group(5)
			If supText = Null Then supText = m.Group(6)
			cs.VerticalAlign(-4dip).RelativeSize(0.72).Append(supText).Pop.Pop
		End If
		prev = m.GetEnd(0)
	Loop
	cs.Append(text.SubString(prev))
	Return cs
End Sub

Private Sub MeasureText(text As String, textSizeSp As Float) As Float
	Dim bmp As Bitmap
	bmp.InitializeMutable(4, 4)
	Dim cv As Canvas
	cv.Initialize2(bmp)
	Dim size As Float = textSizeSp * FontScale
	Dim total As Float = 0
	Dim prev As Int = 0
	Dim m As Matcher = Regex.Matcher("(_\{([^}]+)\}|_([A-Za-z0-9]+))|(\^\{([^}]+)\}|\^([0-9]+(?:\.[0-9]+)?|[A-Za-z0-9]+))", text)
	Do While m.Find
		total = total + cv.MeasureStringWidth(text.SubString2(prev, m.GetStart(0)), Typeface.DEFAULT_BOLD, size)
		Dim childText As String = m.Group(2)
		If childText = Null Then childText = m.Group(3)
		If childText = Null Then childText = m.Group(5)
		If childText = Null Then childText = m.Group(6)
		total = total + cv.MeasureStringWidth(childText, Typeface.DEFAULT_BOLD, size * 0.72)
		prev = m.GetEnd(0)
	Loop
	Return total + cv.MeasureStringWidth(text.SubString(prev), Typeface.DEFAULT_BOLD, size)
End Sub

' Canvas text sizes honour density but not the user's font scale; real TextViews honour both.
Private Sub FontScale As Float
	Try
		Dim res As JavaObject
		res.InitializeStatic("android.content.res.Resources")
		Dim cfg As JavaObject = res.RunMethodJO("getSystem", Null).RunMethodJO("getConfiguration", Null)
		Dim f As Float = cfg.GetField("fontScale")
		If f >= 0.5 And f <= 3 Then Return f
	Catch
	End Try
	Return 1
End Sub

' Largest text size (sp) <= maxSp, not below minSp, at which text fits one line in widthPx.
Public Sub FitTextSize(text As String, maxSp As Float, minSp As Float, widthPx As Int) As Float
	Dim sp As Float = maxSp
	Do While sp > minSp And MeasureText(text, sp) > widthPx
		sp = sp - 0.5
	Loop
	Return Max(sp, minSp)
End Sub

' True when text wraps (word boundaries) into at most maxLines lines of widthPx.
Private Sub FitsLines(text As String, widthPx As Int, textSizeSp As Float, maxLines As Int) As Boolean
	Dim words() As String = Regex.Split(" ", text)
	Dim lines As Int = 1
	Dim cur As String = ""
	For Each w As String In words
		If MeasureText(w, textSizeSp) > widthPx Then Return False
		Dim t As String = w
		If cur.Length > 0 Then t = cur & " " & w
		If MeasureText(t, textSizeSp) <= widthPx Then
			cur = t
		Else
			lines = lines + 1
			If lines > maxLines Then Return False
			cur = w
		End If
	Next
	Return True
End Sub

' First level (fit order L, M, A, S, symbol) at which ALL labels fit on ONE line of availableWidthPx at the 13sp floor.
Public Sub ChooseLevel(keys As List, availableWidthPx As Int, textSizeSp As Float, startLevel As Int) As Int
	Dim level As Int = startLevel
	Do While level >= 0
		Dim ok As Boolean = True
		For Each k As String In keys
			If MeasureText(PlainLabel(k, level), 13) > availableWidthPx Then
				ok = False
				Exit
			End If
		Next
		If ok Then Return level
		If NextLevel(level) < 0 Then Exit
		level = NextLevel(level)
	Loop
	Return 4
End Sub

' Largest size in [minSp, maxSp] at which every label of the chosen level fits on one line.
Public Sub FitLabelSize(keys As List, level As Int, availableWidthPx As Int, maxSp As Float, minSp As Float) As Float
	Dim sp As Float = maxSp
	Do While sp > minSp
		Dim ok As Boolean = True
		For Each k As String In keys
			If MeasureText(PlainLabel(k, level), sp) > availableWidthPx Then
				ok = False
				Exit
			End If
		Next
		If ok Then Return sp
		sp = sp - 0.5
	Loop
	Return minSp
End Sub

' Largest size in [minSp, maxSp] at which the longest word / hyphen segment fits widthPx (no mid-word breaks).
Public Sub FitWordSize(text As String, maxSp As Float, minSp As Float, widthPx As Int) As Float
	Dim parts() As String = Regex.Split("[ \-]", text)
	Dim sp As Float = maxSp
	Do While sp > minSp
		Dim ok As Boolean = True
		For Each w As String In parts
			If MeasureText(w, sp) > widthPx Then
				ok = False
				Exit
			End If
		Next
		If ok Then Return sp
		sp = sp - 0.5
	Loop
	Return minSp
End Sub

' ---------------------------------------------------------------- touch feedback helpers
' Wraps the view's current background in a RippleDrawable (API 21+), keeping the existing
' gradient / state-list drawable as the ripple content. Safe no-op on failure.
Public Sub AddRipple(v As View, rippleColor As Int)
	Try
		Dim ph As Phone
		If ph.SdkVersion < 21 Then Return
		Dim jo As JavaObject = v
		Dim cur As Object = jo.RunMethod("getBackground", Null)
		Dim csl As JavaObject
		csl.InitializeStatic("android.content.res.ColorStateList")
		Dim cs As Object = csl.RunMethod("valueOf", Array(rippleColor))
		Dim rd As JavaObject
		rd.InitializeNewInstance("android.graphics.drawable.RippleDrawable", Array(cs, cur, Null))
		jo.RunMethod("setBackground", Array(rd))
	Catch
		Log("Ripple skipped: " & LastException.Message)
	End Try
End Sub

' Light haptic tick (HapticFeedbackConstants.VIRTUAL_KEY = 1); needs no VIBRATE permission.
Public Sub Haptic(v As View)
	Try
		Dim jo As JavaObject = v
		jo.RunMethod("performHapticFeedback", Array(1))
	Catch
		Log("Haptic skipped: " & LastException.Message)
	End Try
End Sub

' RichText plus a subtly coloured suffix glyph (e.g. the toggle hint on switchable rows).
Public Sub RichTextSuffix(text As String, suffix As String, col As Int) As CSBuilder
	Dim cs As CSBuilder
	cs.Initialize
	Dim m As Matcher = Regex.Matcher("_\{([^}]+)\}|_([A-Za-z0-9]+)", text)
	Dim prev As Int = 0
	Do While m.Find
		cs.Append(text.SubString2(prev, m.GetStart(0)))
		Dim subText As String = m.Group(1)
		If subText = Null Then subText = m.Group(2)
		cs.VerticalAlign(2dip).RelativeSize(0.72).Append(subText).Pop.Pop
		prev = m.GetEnd(0)
	Loop
	cs.Append(text.SubString(prev))
	cs.Color(col).Append(suffix).Pop
	Return cs
End Sub
