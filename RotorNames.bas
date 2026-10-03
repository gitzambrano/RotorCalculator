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
	Dim ab() As String = Array As String("R", "Radius", "Nb", "Blades", "x0", "Root Cutout", "c0", "Root Chord", "c1", "Tip Chord", "taper", "Taper", "sigmaRef", "Geom. Solidity", "sigmaAct", "Act. Solidity", "sigmaT", "Thrust Solidity", "AR", "Aspect Ratio", "A", "Disk Area", "Ab", "Geom. Area", "Aact", "Act. Area", "thRoot", "Root Pitch", "thTip", "Tip Pitch", "thTwist", "Twist", "th75", "Pitch 75%", "a0", "Lift Slope", "Cd0", "Prof. Drag", "B", "Tip Factor", "rpmNom", "Nom Speed", "h", "Altitude", "T0", "Temperature", "mu", "Adv. Ratio", "Vx", "Airspeed", "alpha", "Disk AoA", "Vz", "Climb Speed", "muz", "Axial Ratio", "rpm", "Rotor Speed", "coll", "Collective", "Ttgt", "Target Thrust", "CTtgt", "Target", "kind", "Ind. Factor", "T", "Thrust", "P", "Power", "Pi", "Ind. Power", "P0", "Prof. Power", "Q", "Torque", "H", "In-Plane Force", "Y", "Side Force", "Mx", "Roll Moment", "My", "Pitch Moment", "DL", "Disk Loading", "PL", "Power Loading", "vi", "Ind. Speed", "CT", "Thrust Coeff.", "CQ", "Torque Coeff.", "CQi", "Ind. Torque Coeff.", "CQ0", "Prof. Torque Coeff.", "CH", "In-Plane Coeff.", "CHi", "Ind. In-Plane Coeff.", "CH0", "Prof. In-Plane Coeff.", "CY", "Side Force", "CMx", "Roll Moment", "CMy", "Pitch Moment", "CPair", "Air Power", "CTs", "Blade Loading", "CLbar", "Mean Lift", "FM", "FM", "LDe", "Eff. Lift/Drag", "lam", "Inflow Ratio", "lami", "Ind. Inflow", "lamh", "Hover Inflow", "muLam", "Advance-Inflow", "Tc", "Dyn Thrust Coeff", "Pc", "Dyn Power Coeff", "Mtip", "Tip Mach", "Madv", "Adv. Mach", "OmR", "Tip Speed", "rho", "Density", "p", "Pressure", "a", "Sound Speed", "Bres", "Tip Factor", "chi", "Wake Skew", "Qi", "Ind. Torque", "Q0", "Prof. Torque", "Hi", "Ind. In-Plane", "H0", "Prof. In-Plane", "Pair", "Air Power")
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
	Add("name", "Rotor Name", "Name", "", "", "Identifier of the saved rotor. It appears in the rotor list, in exports and in the active-rotor bar.", "", "")
	Add("R", "Rotor Radius", "Radius", "R", "m", "Distance from the rotation axis to the blade tip. Input. It sets the disk area and the tip speed. Editing R rescales both chords by the same factor, so solidity, taper and aspect ratio are preserved.", "A = πR²,  ΩR = 2π·rpm·R / 60", "0.05 m (small drone) to 12 m (heavy helicopter)")
	Add("Nb", "Blade Count", "Blades", "N_b", "-", "Number of identical blades. Input. Chords are not changed, so adding a blade raises every solidity in proportion. Also enters the Sissingh tip factor.", "σ_geom = N_b·(c_R + c_T) / (2πR)", "2 to 8")
	Add("x0", "Root Cutout", "Root Cutout", "x_0", "-", "Inboard radial station x = r/R where aerodynamic loading starts. Input. The load integrals run from x_0 to the tip, so no lift or drag is produced inboard. Changing it keeps chords and σ_geom; the active area, σ_act and σ_TR change. The pitch law is anchored at x_0.", "x_0 = r_root / R", "0.05 to 0.30")
	Add("c0", "Root Chord", "Root Chord", "c_R", "m", "Chord of the fictitious planform at the rotation axis (x = 0), found by extending the linear chord law inward. The real blade starts at the cutout, so this is not the chord there. Input; changing it changes σ_geom, A_geom, AR and taper.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("c1", "Tip Chord", "Tip Chord", "c_T", "m", "Chord at the blade tip (x = 1). Equal to c_R for a rectangular blade. Input; changing it changes σ_geom, A_geom, AR and taper.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("taper", "Taper Ratio", "Taper", "c_T/c_R", "-", "Tip chord over axis chord. Derived from c_R and c_T; 1 is a rectangular blade. Editing it keeps the mean chord, hence σ_geom: c_R = 2c_m / (1 + taper) and c_T = taper·c_R, with c_m = (c_R + c_T)/2.", "taper = c_T / c_R", "0.3 to 1.0")
	Add("sigmaRef", "Geometric Solidity", "Geometric Solidity", "σ_geom", "-", "Blade area of the fictitious planform extended to the rotation axis (x = 0), over disk area. This is the solidity the analytical equations use. Derived from N_b, c_R, c_T and R; editing it scales both chords by the same factor and keeps taper.", "σ_geom = N_b·A_geom / A", "0.05 to 0.15")
	Add("sigmaAct", "Actual Solidity", "Actual Solidity", "σ_act", "-", "Actual (real) blade area, from the root cutout x_0 to the tip, over disk area. Derived; editing it scales both chords uniformly. Information only: the cutout already enters the equations through the integration limit.", "σ_act = N_b·A_act / A", "0.05 to 0.15")
	Add("sigmaT", "Thrust-Weighted Solidity", "Thrust Solidity", "σ_TR", "-", "Solidity weighted by the radial thrust distribution, which grows as x². Derived; editing it scales both chords. Used to normalize blade loading C_T/σ and the mean lift coefficient.", "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1", "0.05 to 0.15")
	Add("AR", "Aspect Ratio", "Aspect Ratio", "AR", "-", "Blade radius squared over geometric blade area, which equals R over the mean chord. Derived. Editing it scales both chords by AR_old / AR_new, keeping R and taper.", "AR = R² / A_geom = 2R / (c_R + c_T)", "6 to 25")
	Add("A", "Disk Area", "Disk Area", "A", "m²", "Area swept by the blades. Derived from R. Editing it changes R to the square root of A/π and scales the chords with R.", "A = πR²", "")
	Add("Ab", "Geometric Blade Area", "Geometric Area", "A_geom", "m²", "Planform area of one blade of the fictitious planform extended to the rotation axis (x = 0), not only the real blade. Derived from the chords; editing it scales both chords.", "A_geom = ∫ c dr, 0 to R = R·(c_R + c_T)/2", "")
	Add("Aact", "Actual Blade Area", "Actual Area", "A_act", "m²", "Actual (real) planform area of one blade, from the root cutout x_0 to the tip. Derived; editing it scales both chords.", "A_act = ∫ c dr, x_0R to R", "")
	Add("thRoot", "Root Pitch", "Root Pitch", "θ_R", "°", "Geometric blade pitch at the root cutout station, before collective. Input. Editing it changes the twist; the tip pitch is kept.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "")
	Add("thTip", "Tip Pitch", "Tip Pitch", "θ_T", "°", "Geometric blade pitch at the tip, before collective. Input. Editing it changes the twist; the root pitch is kept.", "θ_twist = θ_T − θ_R", "")
	Add("thTwist", "Total Blade Twist", "Twist", "θ_twist", "°", "Pitch change from root to tip, linear along the span. Derived. Editing it keeps the mean pitch (θ_R + θ_T)/2 and splits the change equally between root and tip. Negative twist evens out the inflow and improves hover efficiency.", "θ_twist = θ_T − θ_R", "-20° to 0° (typical -8° to -14°)")
	Add("th75", "Three-Quarter Pitch", "Pitch 75%", "θ_75", "°", "Pitch at 75% of the way from root to tip, the usual reference pitch of a twisted blade. Derived. Editing it shifts root and tip pitch together and keeps the twist. It equals the pitch at station x = 0.75 only when the cutout is zero.", "θ_75 = θ_R + 0.75·θ_twist", "")
	Add("airfoil", "Airfoil Section", "Airfoil", "", "", "Blade section from the airfoil database. It supplies the lift-curve slope a_0 and the profile drag coefficient C_d0. Choose Custom to type your own values.", "C_l = a_0·α_e,  C_d = C_d0", "")
	Add("a0", "Lift-Curve Slope", "Lift Slope", "a_0", "1/rad", "Section lift per radian of effective angle of attack, assumed linear with no stall. Thin-airfoil theory gives 2π, real sections give less. With Prandtl-Glauert on, the effective slope a is larger.", "C_l = a_0·α_e", "5.0 to 6.3 per rad")
	Add("Cd0", "Profile Drag Coefficient", "Profile Drag", "C_d0", "-", "Constant section drag coefficient used everywhere on the disk. Treat it as a mean equivalent value for the lift range of the rotor, above the minimum drag of the section. It drives the profile torque and in-plane force.", "C_d = C_d0", "0.008 to 0.012")
	Add("tipModel", "Tip-Loss Model", "Tip Loss", "", "", "How the loss of lift near the blade tip is modeled. None integrates the loading to the tip. Fixed cuts it at the factor B you type. Sissingh computes B from the thrust coefficient and blade count.", "lift integrated from x_0 to B", "")
	Add("B", "Tip-Loss Factor", "Tip Factor", "B", "-", "Radial station beyond which the blade carries no lift. 1 means no loss. In Fixed mode you type it (never below x_0 + 0.01); in Sissingh mode it is solved together with C_T. The momentum disk area is scaled by B².", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("comp", "Compressibility Correction", "Compressibility", "", "", "ON: Prandtl-Glauert compressibility correction enabled. Scales the 2D lift-curve slope with the representative blade Mach number at 0.75R: a = a_0 / √(1 − M²), capped at M = 0.85. Increases thrust and power requirements as tip Mach increases. Valid for subsonic flow (M_adv < 1.0)." & CRLF & CRLF & "OFF: Incompressible aerodynamics (M = 0 baseline). Lift-curve slope remains constant at a_0 along the entire blade radius regardless of tip Mach number.", "a = a_0 / √(1 − M²)", "M_adv < 1.0")
	Add("rpmNom", "Rotor Speed", "Rotor Speed", "Ω_nom", "rpm", "Design rotor speed stored with the rotor. It only seeds the rotor speed on the Conditions page.", "Ω = 2π·rpm / 60", "")
	' ---------------- Conditions ----------------
	Add("h", "Pressure Altitude", "Altitude", "h", "m", "Altitude in the International Standard Atmosphere. It sets the static pressure; density follows from that pressure and the temperature you enter.", "p = 101325·(1 − 0.0065·h / 288.15)^5.2561", "0 to 6000 m")
	Add("T0", "Ambient Temperature", "Temperature", "T_amb", "°C", "Static air temperature at the rotor. It is typed independently of altitude, so hot-and-high or cold days are possible. Sets density and speed of sound together with p.", "ρ = p / (287.058·T),  a = √(1.4·287.058·T),  T in kelvin", "-40 to 50 °C")
	Add("mu", "Advance Ratio", "Advance Ratio", "μ_x", "-", "Airspeed component in the disk plane over tip speed. 0 is hover. One of two equivalent ways to enter horizontal flow.", "μ_x = V_x / (ΩR)", "0 to 0.5")
	Add("Vx", "Forward Airspeed", "Airspeed", "V_x", "m/s", "Airspeed component in the rotor disk plane. Alternative to the advance ratio; the engine uses μ_x = V_x / (ΩR).", "V_x = μ_x·ΩR", "0 to 100 m/s")
	Add("alpha", "Disk Angle of Attack", "Disk AoA", "α", "°", "Angle between the free stream and the disk plane. Positive when the flow arrives from below the disk (nose-up disk), which lowers the inflow and raises thrust. One of three alternative axial-flow inputs.", "μ_z = −μ_x·tan α", "-20° to 20°")
	Add("Vz", "Climb Speed", "Climb Speed", "V_z", "m/s", "Axial speed of the air through the disk, positive downward, which is a climb. Alternative axial-flow input; negative values are descent.", "V_z = μ_z·ΩR", "-10 to 10 m/s")
	Add("muz", "Axial Flow Ratio", "Axial Ratio", "μ_z", "-", "Axial speed over tip speed, positive downward through the disk. It adds to the induced inflow in the total inflow. Alternative axial-flow input.", "μ_z = V_z / (ΩR) = −μ_x·tan α", "-0.1 to 0.1")
	Add("trim", "Trim Mode", "Trim", "", "–", "Rotor equilibrium couples four operational variables: rotor speed Ω, collective pitch Δθ, thrust coefficient C_T, and rotor thrust T. Prescribe two variables as constraints. The solver calculates the remaining two variables from blade-element momentum equilibrium across the specified forward and axial flight conditions.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("rpm", "Rotor Speed", "Rotor Speed", "Ω", "rpm", "Rotor rotation rate. It sets tip speed, dynamic pressure and, through Mach, the compressibility correction. Solved when it is not one of the two prescribed variables.", "ΩR = 2π·rpm·R / 60", "")
	Add("coll", "Collective Pitch", "Collective", "Δθ", "°", "Pitch increment applied equally to every blade station and added to the geometric pitch. Solved by bisection when it is not prescribed.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "0° to 20°")
	Add("Ttgt", "Target Thrust", "Target Thrust", "T", "N", "Thrust the trim must reach. Used together with one other prescribed variable.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("CTtgt", "Target Thrust Coefficient", "Target", "C_T", "-", "Thrust coefficient the trim must reach. With Δθ prescribed it fixes Ω; with Ω prescribed it fixes Δθ. With thrust T it fixes Ω directly.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("inflow", "Inflow Model", "Inflow", "", "", "How the induced velocity is distributed across the rotor disk:" & CRLF & CRLF & "• Uniform: Constant induced inflow across the entire disk from momentum theory. No gradients (K_x = K_y = 0); no hub moments or side force." & CRLF & CRLF & "• Coleman: Adds a longitudinal inflow gradient K_x = tan(χ/2) based on the wake skew angle χ. Lateral gradient is zero." & CRLF & CRLF & "• Coleman-Feingold (NDARC): Longitudinal gradient with factor 15π/32 on tan(χ/2), plus a lateral inflow gradient K_y = −2μ." & CRLF & CRLF & "• Drees: Speed-dependent longitudinal gradient K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2) and lateral gradient K_y = −2μ. Classic helicopter reference.", "λ_d(x,ψ) = λ + λ_i·x·(K_x·cosψ + K_y·sinψ)", "")
	Add("kind", "Induced Power Factor", "Induced Factor", "k_ind", "-", "Factor on ideal induced power that accounts for non-uniform inflow and tip losses. It is an input to the energy-balance torque, air power and figure of merit; it does not change thrust. 1 is the ideal rotor.", "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi", "1.05 to 1.30")
	Add("drag", "Profile Drag Integration", "Drag Integration", "", "", "Method used to integrate the section profile drag over the disk. Tangential counts only the in-plane tangential velocity. Vectorial uses the full relative velocity in closed form. Numerical uses Gauss-Legendre quadrature (16 radial by 24 azimuth points), the reference method.", "dD = ½ρ W² c C_d0 dr", "")
	' ---------------- Results ----------------
	Add("T", "Thrust", "Thrust", "T", "N", "Rotor force along the shaft axis, positive up. Computed from the thrust coefficient.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("P", "Shaft Power", "Power", "P", "W", "Mechanical power at the rotor shaft: torque times rotor speed. Equals the sum of induced and profile power.", "P = Q·Ω = C_Q·ρ·A·(ΩR)³", "")
	Add("Pi", "Induced Power", "Induced Power", "P_i", "W", "Shaft power attributed to producing thrust. Taken from the induced torque coefficient, which by the energy balance includes the induced term k_ind·λ_i·C_T, the climb term μ_z·C_T and minus the propulsive term μ·C_Hi.", "P_i = C_Qi·ρ·A·(ΩR)³", "")
	Add("P0", "Profile Power", "Profile Power", "P_0", "W", "Shaft power spent overcoming blade section drag, from the integrated profile torque.", "P_0 = C_Q0·ρ·A·(ΩR)³", "")
	Add("Q", "Shaft Torque", "Torque", "Q", "N·m", "Torque about the rotor shaft, induced plus profile.", "Q = C_Q·ρ·A·(ΩR)²·R", "")
	Add("H", "In-Plane Force", "In-Plane Force", "H", "N", "Rotor force in the disk plane along the flow direction, positive aft (drag-like). Rigid hub, no flapping, so it is the full hub force.", "H = C_H·ρ·A·(ΩR)²", "")
	Add("Y", "Side Force", "Side Force", "Y", "N", "Rotor force in the disk plane perpendicular to the flow, positive to the right (advancing side). Zero with uniform inflow.", "Y = C_Y·ρ·A·(ΩR)²", "")
	Add("Mx", "Roll Moment", "Roll Moment", "M_x", "N·m", "Hub moment about the longitudinal axis, positive advancing side down. Rigid hub, no flapping, so the full moment goes into the hub.", "M_x = C_Mx·ρ·A·(ΩR)²·R", "")
	Add("My", "Pitch Moment", "Pitch Moment", "M_y", "N·m", "Hub moment about the lateral axis, positive nose up. Rigid hub, no flapping. Zero with uniform inflow.", "M_y = C_My·ρ·A·(ΩR)²·R", "")
	Add("DL", "Disk Loading", "Disk Loading", "T/A", "N/m²", "Thrust per unit disk area. Low disk loading means efficient hover.", "DL = T / A", "50 to 500 N/m² (helicopters)")
	Add("PL", "Power Loading", "Power Loading", "T/P", "N/W", "Thrust produced per unit of shaft power.", "PL = T / P", "0.05 to 0.15 N/W")
	Add("Vztot", "Total Axial Speed", "Total Axial Speed", "V_{z,tot}", "m/s", "Mean total normal flow through the disk, positive downward. Sum of imposed climb flow and mean induced flow. Not the free-stream magnitude used by dynamic coefficients.", "V_{z,tot} = V_z + V_i = λ ΩR", "")
	abbr.Put("Vztot", "Axial Speed")
	Add("Vadv", "Advancing Speed", "Advancing Speed", "V_adv", "m/s", "Tangential relative speed at the advancing blade tip, r/R = 1 and ψ = 90°. Excludes the axial component.", "V_adv = ΩR + V_x", "")
	abbr.Put("Vadv", "Adv. Speed")
	Add("Vret", "Retreating Speed", "Retreating Speed", "V_ret", "m/s", "Signed tangential relative speed at the retreating blade tip, r/R = 1 and ψ = 270°. Excludes the axial component.", "V_ret = ΩR − V_x", "")
	abbr.Put("Vret", "Ret. Speed")
	Add("Mret", "Retreating Mach", "Retreating Mach", "M_ret", "-", "Magnitude of retreating tip tangential speed divided by sound speed. Same tangential convention as Advancing Mach.", "M_ret = |ΩR − V_x| / a", "")
	abbr.Put("Mret", "Ret. Mach")
	Add("aoaAdv75", "Advancing AoA 75%", "Adv. AoA 75%", "α_{adv,75}", "deg", "Blade-section angle of attack at r/R = 0.75 and ψ = 90°, from final trimmed pitch and prescribed local inflow. Diagnostic of the rigid-blade model, without cyclic trim, flapping or stall prediction. Unavailable outside the active span or in reverse flow.", "α_s = θ(0.75) − φ", "")
	abbr.Put("aoaAdv75", "Adv. AoA")
	Add("aoaRet75", "Retreating AoA 75%", "Ret. AoA 75%", "α_{ret,75}", "deg", "Blade-section angle of attack at r/R = 0.75 and ψ = 270°, from final trimmed pitch and prescribed local inflow. Diagnostic only; does not predict retreating blade stall. Unavailable outside the active span or in reverse flow.", "α_s = θ(0.75) − φ", "")
	abbr.Put("aoaRet75", "Ret. AoA")
	Add("phiAdv75", "Advancing Inflow Angle 75%", "Adv. Inflow 75%", "φ_{adv,75}", "deg", "Local inflow angle at r/R = 0.75 and ψ = 90°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiAdv75", "Adv. Inflow")
	Add("phiRet75", "Retreating Inflow Angle 75%", "Ret. Inflow 75%", "φ_{ret,75}", "deg", "Local inflow angle at r/R = 0.75 and ψ = 270°, with first-harmonic induced-flow gradients. Unavailable outside the active span or when tangential speed is nonpositive.", "φ = atan2(u_P, u_T)", "")
	abbr.Put("phiRet75", "Ret. Inflow")
	Add("vi", "Induced Speed", "Induced Speed", "V_i", "m/s", "Mean velocity added to the air through the disk. Solved from the momentum balance with the blade-element thrust.", "v_i = λ_i·ΩR", "")
	Add("CT", "Thrust Coefficient", "Thrust Coeff.", "C_T", "-", "Thrust made non-dimensional by disk area and tip speed. Computed from the blade-element integral with the solved inflow; it equals the momentum thrust.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("CQ", "Torque Coefficient", "Torque Coeff.", "C_Q", "-", "Torque made non-dimensional by ρA(ΩR)²R. Equals the shaft power coefficient C_P.", "C_Q = Q / [ρA(ΩR)²R] = C_Qi + C_Q0 = C_P", "")
	Add("CQi", "Induced Torque Coefficient", "Ind. Torque Coeff.", "C_Qi", "-", "Induced part of the torque coefficient, obtained from the energy balance with the induced power factor.", "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi", "")
	Add("Qi", "Induced Torque", "Induced Torque", "Q_i", "N·m", "Induced part of the shaft torque, from the induced torque coefficient. Q_i·Ω equals the induced power P_i.", "Q_i = C_Qi·ρ·A·(ΩR)²·R", "")
	Add("Q0", "Profile Torque", "Profile Torque", "Q_0", "N·m", "Profile-drag part of the shaft torque, from the integrated profile torque coefficient. Q_0·Ω equals the profile power P_0.", "Q_0 = C_Q0·ρ·A·(ΩR)²·R", "")
	Add("Hi", "Induced In-Plane Force", "Induced In-Plane Force", "H_i", "N", "Induced part of the in-plane force, from the backward tilt of the lift vector.", "H_i = C_Hi·ρ·A·(ΩR)²", "")
	Add("H0", "Profile In-Plane Force", "Profile In-Plane Force", "H_0", "N", "Profile-drag part of the in-plane force, integrated numerically. H = H_i + H_0.", "H_0 = C_H0·ρ·A·(ΩR)²", "")
	Add("Pair", "Air Power", "Air Power", "P_air", "W", "Power delivered to the air. The engine computes C_Pair from the energy balance: induced, climb and profile terms plus the profile translational work μ·C_H0. It equals the shaft power plus the work of the in-plane force, P + μ·H·ΩR, so it differs from the shaft power P in forward flight.", "P_air = C_Pair·ρ·A·(ΩR)³ = P + μ·H·ΩR", "")
	Add("CQ0", "Profile Torque Coefficient", "Prof. Torque Coeff.", "C_Q0", "-", "Profile-drag part of the torque coefficient, integrated numerically over blade and azimuth with the full relative velocity.", "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π", "")
	Add("CH", "In-Plane Force Coefficient", "In-Plane Coeff.", "C_H", "-", "In-plane force coefficient, positive aft. Sum of induced and profile parts.", "C_H = C_Hi + C_H0", "")
	Add("CHi", "Induced In-Plane Force Coefficient", "Ind. In-Plane Coeff.", "C_Hi", "-", "Induced part of the in-plane force, from the backward tilt of the lift vector by the inflow angle. Analytical blade-element result.", "C_Hi = (a/4)·[λ·μ·Θ_0 + λ_1s·(Θ_2 − 2λ·I_1)]", "")
	Add("CH0", "Profile In-Plane Force Coefficient", "Prof. In-Plane Coeff.", "C_H0", "-", "Profile-drag part of the in-plane force, integrated numerically. About 3/8·σ·C_d0·μ for small μ.", "C_H0 = ∬ (σ·C_d0/2)·W·(x·sinψ + μ) dx dψ / 2π", "")
	Add("CY", "Side Force Coefficient", "Side Force", "C_Y", "-", "Side force made non-dimensional like thrust. Non-zero only when the inflow model has a longitudinal gradient K_x.", "C_Y = −(a/4)·K_x·λ_i·(Θ_2 − 2λ·I_1)", "")
	Add("CMx", "Roll Moment Coefficient", "Roll Moment", "C_Mx", "-", "Roll hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping.", "C_Mx = −(a·μ/2)·(Θ_2 − ½λ·I_1) + (a/4)·λ_1s·I_3", "")
	Add("CMy", "Pitch Moment Coefficient", "Pitch Moment", "C_My", "-", "Pitch hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping. Non-zero only when K_x is not zero.", "C_My = (a/4)·K_x·λ_i·I_3", "")
	Add("CPair", "Air Power Coefficient", "Air Power", "C_Pair", "-", "Power given to the air, from the energy balance: induced, climb and profile terms, including the profile translational work μ·C_H0.", "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0", "")
	Add("CTs", "Blade Loading", "Blade Loading", "C_T/σ_TR", "-", "Thrust coefficient per unit thrust-weighted solidity. Indicates how hard the blades work; stall limits it near 0.12 to 0.15.", "C_T / σ_TR", "0.05 to 0.12")
	Add("CLbar", "Mean Lift Coefficient", "Mean Lift Coefficient", "C̄_L", "-", "Average section lift coefficient over the disk that carries the thrust, from the blade loading. A quick stall margin check against the section C_l,max.", "C̄_L = 6·C_T / σ_TR", "0.3 to 0.7")
	Add("FM", "Figure of Merit (hover only)", "Figure of Merit", "FM", "-", "Ideal hover power over actual hover power, using the induced power factor and the profile torque. Shown only in hover; forward flight uses effective L/D.", "FM = (C_T^1.5/√2) / (k_ind·C_T^1.5/√2 + C_Q0)", "0.55 to 0.80")
	Add("LDe", "Effective Lift/Drag Ratio", "Eff. Lift/Drag", "(L/D)_e", "-", "Rotor lift times forward speed over air power. Zero in hover.", "(L/D)_e = μ·C_T / C_Pair", "4 to 10")
	Add("lam", "Total Inflow Ratio", "Inflow Ratio", "λ", "-", "Total flow through the disk normal to it, over tip speed: the axial free-stream component plus the induced part.", "λ = μ_z + λ_i", "")
	Add("lami", "Induced Inflow Ratio", "Induced Inflow", "λ_i", "-", "Induced velocity over tip speed. Found by bisection so that the blade-element thrust equals the momentum thrust. In ideal hover it is √(C_T/2).", "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)", "0.03 to 0.08 (hover)")
	Add("lamh", "Hover Inflow Ratio", "Hover Inflow", "λ_h", "-", "Induced inflow ratio an ideal rotor would have in hover at the current thrust coefficient. Reference scale for the inflow: λ_i / λ_h shows how far forward or axial flow has relieved the induced velocity.", "λ_h = √(C_T / 2)", "0.03 to 0.08")
	Add("muLam", "Advance-to-Inflow Ratio", "Advance/Inflow", "μ/λ", "-", "In-plane flow over total axial inflow. Zero in hover and growing as the wake skews toward the disk plane. It sets the wake skew angle that drives the inflow gradients.", "μ/λ = μ_x / (μ_z + λ_i)", "0 to 20")
	Add("Tc", "Dynamic Thrust Coefficient", "Dynamic Thrust Coeff", "T_c", "-", "Thrust over the dynamic pressure of the free stream times disk area, T_c = T / (½ρV∞²A). Useful when the rotor is treated like a propeller or a lifting surface moving at V. Undefined in hover.", "T_c = T / (½ρV²A) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)", "")
	Add("Pc", "Dynamic Power Coefficient", "Dynamic Power Coeff", "P_c", "-", "Shaft power over ½ρV∞³A for the free-stream speed V∞, P_c = P / (½ρV∞³A). Undefined in hover.", "P_c = P / (½ρV³A) = 2C_P / μ_∞³,  V = √(V_x² + V_z²)", "")
	Add("Kx", "Longitudinal Inflow Gradient", "Long. Gradient", "K_x", "-", "Fore-aft slope of the induced inflow over the disk, as a multiple of λ_i. Set by the inflow model from the wake skew angle; zero for uniform inflow.", "Coleman: K_x = tan(χ/2)", "")
	Add("Ky", "Lateral Inflow Gradient", "Lat. Gradient", "K_y", "-", "Side-to-side slope of the induced inflow over the disk, as a multiple of λ_i. Zero for uniform and Coleman; −2μ for Coleman-Feingold and Drees.", "Drees: K_y = −2μ", "")
	Add("chi", "Wake Skew Angle", "Wake Skew", "χ", "°", "Angle of the wake from the shaft axis. 0° is hover, close to 90° at high speed.", "tan(χ/2) = μ / (√(μ² + λ²) + |λ|)", "0° to 90°")
	Add("Bres", "Tip-Loss Factor", "Tip Factor", "B", "-", "Tip-loss factor used in this solution. Equals the typed value in Fixed mode and the converged value in Sissingh mode.", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("OmR", "Tip Speed", "Tip Speed", "ΩR", "m/s", "Speed of the blade tip relative to the hub.", "ΩR = 2π·rpm·R / 60", "150 to 250 m/s (helicopters)")
	Add("Mtip", "Tip Mach", "Tip Mach", "M_tip", "-", "Tip speed over local speed of sound.", "M_tip = ΩR / a", "0.4 to 0.7")
	Add("Madv", "Advancing Tip Mach", "Adv. Mach", "M_adv", "-", "Mach number of the advancing blade tip. Compressibility effects start near 0.8 to 0.9; Prandtl-Glauert is not valid at or above 1.", "M_adv = ΩR·(1 + μ_x) / a", "up to 0.9")
	Add("rho", "Air Density", "Density", "ρ", "kg/m³", "Air density from the standard-atmosphere pressure and the temperature entered.", "ρ = p / (287.058·T)", "0.9 to 1.225 kg/m³")
	Add("p", "Ambient Pressure", "Pressure", "p", "Pa", "Static pressure at the pressure altitude, from the standard atmosphere.", "p = 101325·(1 − 0.0065·h / 288.15)^5.2561", "")
	Add("a", "Speed of Sound", "Sound Speed", "a", "m/s", "Local speed of sound at the ambient temperature.", "a = √(1.4·287.058·T)", "")
	' ---------------- Option help: tip loss ----------------
	Add("tip_none", "Tip Loss None", "None", "B", "", "No tip loss. Blade loading is integrated all the way to the tip, which is optimistic.", "B = 1", "")
	Add("tip_fixed", "Tip Loss Fixed", "Fixed", "B", "", "Uses the tip-loss factor B typed in Geometry, for example the value a preset specifies. It is not the same as off.", "B = typed value", "0.92 to 0.98")
	Add("tip_sissingh", "Tip Loss Sissingh", "Sissingh", "B", "", "Computes B from the thrust coefficient and the blade count, iterating with the thrust until B stops changing.", "B = 1 − √(2C_T) / N_b", "")
	' ---------------- compressibility ----------------
	Add("comp_off", "Compressibility Off", "Off", "", "", "Lift-curve slope stays constant at a_0.", "a = a_0", "")
	Add("comp_pg", "Prandtl-Glauert", "On", "", "", "Corrects the lift-curve slope for subsonic compressibility using the Mach number near 0.75R, capped at 0.85. A caution appears from M_adv = 0.8; the result is invalid at M_adv = 1.", "a = a_0 / √(1 − M_eff²),  M_eff = M_tip·√(0.75² + μ²/2)", "")
	' ---------------- inflow models ----------------
	Add("inflow_uniform", "Uniform Inflow", "Uniform", "", "", "Momentum theory: one induced velocity for the whole disk. No gradients, so there is no side force or pitch moment.", "K_x = K_y = 0", "")
	Add("inflow_coleman_simple", "Coleman", "Coleman", "", "", "Longitudinal inflow gradient from the wake skew angle (Coleman 1945). No lateral gradient.", "K_x = tan(χ/2),  K_y = 0", "")
	Add("inflow_coleman_feingold", "Coleman-Feingold (NDARC)", "Coleman-FG", "", "", "NDARC form of the Coleman model with the factor 15π/32 on the longitudinal gradient and a lateral gradient.", "K_x = (15π/32)·tan(χ/2),  K_y = −2μ", "")
	Add("inflow_drees", "Drees", "Drees", "", "", "Drees (1949) gradients, with a speed-dependent longitudinal term and a lateral gradient.", "K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2),  K_y = −2μ", "")
	' ---------------- trim modes ----------------
	Add("trim_none", "Trim None", "None", "", "", "Uses the typed collective pitch and rotor speed as they are.", "", "")
	Add("trim_collective", "Trim Collective", "Collective", "Δθ", "", "Solves the collective pitch so the result matches the target thrust or thrust coefficient at the prescribed rotor speed.", "T(Δθ) = T_target", "")
	Add("trim_rpm", "Trim Rotor Speed", "Rotor Speed", "Ω", "", "Solves the rotor speed so the result matches the target, with the collective held.", "T(Ω) = T_target", "")
	Add("rpm_collective", "Prescribe Speed & Collective", "Ω + Δθ", "Ω, Δθ", "", "Operating state with rotor speed Ω and collective pitch Δθ prescribed directly. Solves thrust coefficient C_T and thrust T directly.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("rpm_ct", "Prescribe Speed & Target C_T", "Ω + C_T", "Ω, C_T", "", "Operating state with rotor speed Ω and thrust coefficient C_T prescribed. Solves collective pitch Δθ by bisection until BET thrust matches target C_T, then computes T.", "C_T,BET(Δθ) = C_T,target", "")
	Add("rpm_thrust", "Prescribe Speed & Target Thrust", "Ω + T", "Ω, T", "", "Operating state with rotor speed Ω and dimensional thrust T prescribed. Solves collective pitch Δθ by bisection until thrust matches target T.", "T(Δθ) = T_target", "")
	Add("collective_ct", "Prescribe Collective & Target C_T", "Δθ + C_T", "Δθ, C_T", "", "Operating state with collective pitch Δθ and thrust coefficient C_T prescribed. Solves rotor speed Ω by bisection, then computes thrust T.", "Ω from C_T(Ω) = C_T,target", "")
	Add("collective_thrust", "Prescribe Collective & Target Thrust", "Δθ + T", "Δθ, T", "", "Operating state with collective pitch Δθ and dimensional thrust T prescribed. Solves rotor speed Ω by bisection, then computes thrust coefficient C_T.", "Ω from T(Ω) = T_target", "")
	Add("ct_thrust", "Prescribe Target C_T & Target Thrust", "C_T + T", "C_T, T", "", "Operating state with thrust coefficient C_T and dimensional thrust T prescribed. Solves tip speed ΩR directly from dynamic pressure, then solves collective Δθ by bisection.", "ΩR = √(T / [ρ·A·C_T])", "")
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
	Dim m As Matcher = Regex.Matcher("(_\{([^}]+)\}|_([A-Za-z0-9]+))|(\^\{([^}]+)\}|\^([A-Za-z0-9]+))", text)
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
	Dim m As Matcher = Regex.Matcher("(_\{([^}]+)\}|_([A-Za-z0-9]+))|(\^\{([^}]+)\}|\^([A-Za-z0-9]+))", text)
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
