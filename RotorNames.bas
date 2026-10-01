B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorNames.bas - canonical nomenclature (docs/nomenclature.md) + help texts. No visible views.
' Levels: 0 = L Full Description Symbol, 1 = M Short Description Symbol, 2 = S Short Description. Coefficients: Full = Name Coefficient Symbol, Short = Name Symbol.
' Symbols use "_" for subscripts in plain text; RichLabel renders real subscripts one single way.

Sub Process_Globals
	Private tbl As Map
End Sub

' Fields per key: 0 full, 1 short, 2 symbol ("" = none), 3 unit hint, 4 body, 5 equation, 6 typical range
Private Sub Add(key As String, full As String, shrt As String, sym As String, unit As String, body As String, eq As String, rng As String)
	tbl.Put(key, Array As String(full, shrt, sym, unit, body, eq, rng))
End Sub

Private Sub Ensure
	If tbl.IsInitialized Then Return
	tbl.Initialize
	' Coefficient naming rule: Full = "<Name> Coefficient <Symbol>", Short = "<Name> <Symbol>" (the word Coefficient is dropped, never abbreviated).
	' ---------------- Geometry ----------------
	Add("name", "Rotor Name", "Name", "", "", "Identifier of the saved rotor. It appears in the rotor list, in exports and in the active-rotor bar.", "", "")
	Add("R", "Rotor Radius", "Radius", "R", "m", "Distance from the rotation axis to the blade tip. Input. It sets the disk area and the tip speed. Editing R rescales both chords by the same factor, so solidity, taper and aspect ratio are preserved.", "A = πR²,  ΩR = 2π·rpm·R / 60", "0.05 m (small drone) to 12 m (heavy helicopter)")
	Add("Nb", "Blade Count", "Blades", "N_b", "-", "Number of identical blades. Input. Chords are not changed, so adding a blade raises every solidity in proportion. Also enters the Sissingh tip factor.", "σ_ref = N_b·(c_R + c_T) / (2πR)", "2 to 8")
	Add("x0", "Root Cutout", "Root Cutout", "x_0", "-", "Inboard radial station x = r/R where aerodynamic loading starts. Input. The load integrals run from x_0 to the tip, so no lift or drag is produced inboard. Changing it keeps chords and σ_ref; the active area, σ_act and σ_TR change. The pitch law is anchored at x_0.", "x_0 = r_root / R", "0.05 to 0.30")
	Add("c0", "Root Chord", "Root Chord", "c_R", "m", "Chord of the reference planform at the rotation axis (x = 0), found by extending the linear chord law inward. It is not the chord at the cutout. Input; changing it changes σ_ref, A_b, AR and taper.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("c1", "Tip Chord", "Tip Chord", "c_T", "m", "Chord at the blade tip (x = 1). Equal to c_R for a rectangular blade. Input; changing it changes σ_ref, A_b, AR and taper.", "c(x) = c_R + (c_T − c_R)·x", "0.02 to 0.8 m")
	Add("taper", "Taper Ratio", "Taper", "c_T/c_R", "-", "Tip chord over axis chord. Derived from c_R and c_T; 1 is a rectangular blade. Editing it keeps the mean chord, hence σ_ref: c_R = 2c_m / (1 + taper) and c_T = taper·c_R, with c_m = (c_R + c_T)/2.", "taper = c_T / c_R", "0.3 to 1.0")
	Add("sigmaRef", "Reference Solidity", "Solidity", "σ_ref", "-", "Blade area of the reference planform (extended to the axis) over disk area. This is the solidity the analytical equations use. Derived from N_b, c_R, c_T and R; editing it scales both chords by the same factor and keeps taper.", "σ_ref = N_b·A_b / A", "0.05 to 0.15")
	Add("sigmaAct", "Active-Span Solidity", "Active Solidity", "σ_act", "-", "Physical blade area from the root cutout to the tip over disk area. Derived; editing it scales both chords uniformly. Information only: the cutout already enters the equations through the integration limit.", "σ_act = N_b·A_act / A", "0.05 to 0.15")
	Add("sigmaT", "Thrust-Weighted Solidity", "Thrust Solidity", "σ_TR", "-", "Solidity weighted by the radial thrust distribution, which grows as x². Derived; editing it scales both chords. Used to normalize blade loading C_T/σ and the mean lift coefficient.", "σ_TR = 3·∫ σ(x)·x² dx, x_0 to 1", "0.05 to 0.15")
	Add("AR", "Aspect Ratio", "Aspect Ratio", "AR", "-", "Blade radius squared over reference blade area, which equals R over the mean chord. Derived. Editing it scales both chords by AR_old / AR_new, keeping R and taper.", "AR = R² / A_b = 2R / (c_R + c_T)", "6 to 25")
	Add("A", "Disk Area", "Disk Area", "A", "m²", "Area swept by the blades. Derived from R. Editing it changes R to the square root of A/π and scales the chords with R.", "A = πR²", "")
	Add("Ab", "Reference Blade Area", "Blade Area", "A_b", "m²", "Planform area of one blade of the reference planform, extended to the axis. Derived from the chords; editing it scales both chords.", "A_b = ∫ c dr, 0 to R = R·(c_R + c_T)/2", "")
	Add("Aact", "Active Blade Area", "Active Area", "A_act", "m²", "Planform area of one blade from the root cutout to the tip. Derived; editing it scales both chords.", "A_act = ∫ c dr, x_0R to R", "")
	Add("thRoot", "Root Pitch", "Root Pitch", "θ_R", "°", "Geometric blade pitch at the root cutout station, before collective. Input. Editing it changes the twist; the tip pitch is kept.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "")
	Add("thTip", "Tip Pitch", "Tip Pitch", "θ_T", "°", "Geometric blade pitch at the tip, before collective. Input. Editing it changes the twist; the root pitch is kept.", "θ_twist = θ_T − θ_R", "")
	Add("thTwist", "Total Blade Twist", "Twist", "θ_twist", "°", "Pitch change from root to tip, linear along the span. Derived. Editing it keeps the mean pitch (θ_R + θ_T)/2 and splits the change equally between root and tip. Negative twist evens out the inflow and improves hover efficiency.", "θ_twist = θ_T − θ_R", "-20° to 0° (typical -8° to -14°)")
	Add("th75", "Three-Quarter Pitch", "Pitch 75%", "θ_75", "°", "Pitch at 75% of the way from root to tip, the usual reference pitch of a twisted blade. Derived. Editing it shifts root and tip pitch together and keeps the twist. It equals the pitch at station x = 0.75 only when the cutout is zero.", "θ_75 = θ_R + 0.75·θ_twist", "")
	Add("airfoil", "Airfoil Section", "Airfoil", "", "", "Blade section from the airfoil database. It supplies the lift-curve slope a_0 and the profile drag coefficient C_d0. Choose Custom to type your own values.", "C_l = a_0·α_e,  C_d = C_d0", "")
	Add("a0", "Lift-Curve Slope", "Lift Slope", "a_0", "1/rad", "Section lift per radian of effective angle of attack, assumed linear with no stall. Thin-airfoil theory gives 2π, real sections give less. With Prandtl-Glauert on, the effective slope a is larger.", "C_l = a_0·α_e", "5.0 to 6.3 per rad")
	Add("Cd0", "Profile Drag Coefficient", "Profile Drag", "C_d0", "-", "Constant section drag coefficient used everywhere on the disk. Treat it as a mean equivalent value for the lift range of the rotor, above the minimum drag of the section. It drives the profile torque and in-plane force.", "C_d = C_d0", "0.008 to 0.012")
	Add("tipModel", "Tip-Loss Model", "Tip Loss", "", "", "How the loss of lift near the blade tip is modeled. None integrates the loading to the tip. Fixed cuts it at the factor B you type. Sissingh computes B from the thrust coefficient and blade count.", "lift integrated from x_0 to B", "")
	Add("B", "Tip-Loss Factor", "Tip Factor", "B", "-", "Radial station beyond which the blade carries no lift. 1 means no loss. In Fixed mode you type it (never below x_0 + 0.01); in Sissingh mode it is solved together with C_T. The momentum disk area is scaled by B².", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("comp", "Compressibility Correction", "Compressibility", "", "", "Off keeps the lift-curve slope constant. Prandtl-Glauert raises it with a representative Mach number at about 0.75R (capped at 0.85). Reliable only while the advancing tip Mach number is below 1.", "a = a_0 / √(1 − M²)", "")
	Add("rpmNom", "Nominal Rotor Speed", "Nominal Speed", "Ω_nom", "rpm", "Design rotor speed stored with the rotor. It only seeds the rotor speed on the Conditions page.", "Ω = 2π·rpm / 60", "")
	' ---------------- Conditions ----------------
	Add("h", "Pressure Altitude", "Altitude", "h", "m", "Altitude in the International Standard Atmosphere. It sets the static pressure; density follows from that pressure and the temperature you enter.", "p = 101325·(1 − 0.0065·h / 288.15)^5.2561", "0 to 6000 m")
	Add("T0", "Ambient Temperature", "Temperature", "T_amb", "°C", "Static air temperature at the rotor. It is typed independently of altitude, so hot-and-high or cold days are possible. Sets density and speed of sound together with p.", "ρ = p / (287.058·T),  a = √(1.4·287.058·T),  T in kelvin", "-40 to 50 °C")
	Add("mu", "Advance Ratio", "Advance Ratio", "μ_x", "-", "Airspeed component in the disk plane over tip speed. 0 is hover. One of two equivalent ways to enter horizontal flow.", "μ_x = V_x / (ΩR)", "0 to 0.5")
	Add("Vx", "Forward Airspeed", "Airspeed", "V_x", "m/s", "Airspeed component in the rotor disk plane. Alternative to the advance ratio; the engine uses μ_x = V_x / (ΩR).", "V_x = μ_x·ΩR", "0 to 100 m/s")
	Add("alpha", "Disk Angle of Attack", "Disk AoA", "α", "°", "Angle between the free stream and the disk plane. Positive when the flow arrives from below the disk (nose-up disk), which lowers the inflow and raises thrust. One of three alternative axial-flow inputs.", "μ_z = −μ_x·tan α", "-20° to 20°")
	Add("Vz", "Climb Speed", "Climb Speed", "V_z", "m/s", "Axial speed of the air through the disk, positive downward, which is a climb. Alternative axial-flow input; negative values are descent.", "V_z = μ_z·ΩR", "-10 to 10 m/s")
	Add("muz", "Axial Flow Ratio", "Axial Ratio", "μ_z", "-", "Axial speed over tip speed, positive downward through the disk. It adds to the induced inflow in the total inflow. Alternative axial-flow input.", "μ_z = V_z / (ΩR) = −μ_x·tan α", "-0.1 to 0.1")
	Add("trim", "Trim Mode", "Trim", "", "", "The operating state has four linked variables: rotor speed Ω, collective Δθ, thrust coefficient C_T and thrust T. You prescribe any two and the engine solves the other two. Six pairs are available.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("rpm", "Rotor Speed", "Rotor Speed", "Ω", "rpm", "Rotor rotation rate. It sets tip speed, dynamic pressure and, through Mach, the compressibility correction. Solved when it is not one of the two prescribed variables.", "ΩR = 2π·rpm·R / 60", "")
	Add("coll", "Collective Pitch", "Collective", "Δθ", "°", "Pitch increment applied equally to every blade station and added to the geometric pitch. Solved by bisection when it is not prescribed.", "θ(x) = θ_R + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "0° to 20°")
	Add("Ttgt", "Target Thrust", "Target Thrust", "T", "N", "Thrust the trim must reach. Used together with one other prescribed variable.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("CTtgt", "Target Thrust Coefficient", "Target Thrust", "C_T", "-", "Thrust coefficient the trim must reach. With Δθ prescribed it fixes Ω; with Ω prescribed it fixes Δθ. With thrust T it fixes Ω directly.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("inflow", "Inflow Model", "Inflow", "", "", "How the induced velocity varies over the disk. Uniform is momentum theory. The Coleman models add a longitudinal gradient K_x tied to the wake skew angle; Coleman-Feingold and Drees also add a lateral gradient K_y. The mean induced velocity always comes from the momentum balance.", "λ_d(x,ψ) = λ + λ_i·x·(K_x·cosψ + K_y·sinψ)", "")
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
	Add("vi", "Induced Velocity", "Induced Velocity", "v_i", "m/s", "Mean velocity added to the air through the disk. Solved from the momentum balance with the blade-element thrust.", "v_i = λ_i·ΩR", "")
	Add("CT", "Thrust Coefficient", "Thrust", "C_T", "-", "Thrust made non-dimensional by disk area and tip speed. Computed from the blade-element integral with the solved inflow; it equals the momentum thrust.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("CQ", "Torque Coefficient", "Torque", "C_Q", "-", "Torque made non-dimensional by ρA(ΩR)²R. Equals the shaft power coefficient C_P.", "C_Q = Q / [ρA(ΩR)²R] = C_Qi + C_Q0 = C_P", "")
	Add("CQi", "Induced Torque Coefficient", "Induced Torque", "C_Qi", "-", "Induced part of the torque coefficient, obtained from the energy balance with the induced power factor.", "C_Qi = k_ind·λ_i·C_T + μ_z·C_T − μ·C_Hi", "")
	Add("CQ0", "Profile Torque Coefficient", "Profile Torque", "C_Q0", "-", "Profile-drag part of the torque coefficient, integrated numerically over blade and azimuth with the full relative velocity.", "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π", "")
	Add("CH", "In-Plane Force Coefficient", "In-Plane Force", "C_H", "-", "In-plane force coefficient, positive aft. Sum of induced and profile parts.", "C_H = C_Hi + C_H0", "")
	Add("CHi", "Induced In-Plane Force Coefficient", "Induced In-Plane", "C_Hi", "-", "Induced part of the in-plane force, from the backward tilt of the lift vector by the inflow angle. Analytical blade-element result.", "C_Hi = (a/4)·[λ·μ·Θ_0 + λ_1s·(Θ_2 − 2λ·I_1)]", "")
	Add("CH0", "Profile In-Plane Force Coefficient", "Profile In-Plane", "C_H0", "-", "Profile-drag part of the in-plane force, integrated numerically. About 3/8·σ·C_d0·μ for small μ.", "C_H0 = ∬ (σ·C_d0/2)·W·(x·sinψ + μ) dx dψ / 2π", "")
	Add("CY", "Side Force Coefficient", "Side Force", "C_Y", "-", "Side force made non-dimensional like thrust. Non-zero only when the inflow model has a longitudinal gradient K_x.", "C_Y = −(a/4)·K_x·λ_i·(Θ_2 − 2λ·I_1)", "")
	Add("CMx", "Roll Moment Coefficient", "Roll Moment", "C_Mx", "-", "Roll hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping.", "C_Mx = −(a·μ/2)·(Θ_2 − ½λ·I_1) + (a/4)·λ_1s·I_3", "")
	Add("CMy", "Pitch Moment Coefficient", "Pitch Moment", "C_My", "-", "Pitch hub moment made non-dimensional by ρA(ΩR)²R. Rigid hub, no flapping. Non-zero only when K_x is not zero.", "C_My = (a/4)·K_x·λ_i·I_3", "")
	Add("CPair", "Air Power Coefficient", "Air Power", "C_Pair", "-", "Power given to the air, from the energy balance: induced, climb and profile terms, including the profile translational work μ·C_H0.", "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_Q0 + μ·C_H0", "")
	Add("CTs", "Blade Loading", "Blade Loading", "C_T/σ_TR", "-", "Thrust coefficient per unit thrust-weighted solidity. Indicates how hard the blades work; stall limits it near 0.12 to 0.15.", "C_T / σ_TR", "0.05 to 0.12")
	Add("CLbar", "Mean Lift Coefficient", "Mean Lift", "C̄_L", "-", "Average section lift coefficient over the disk that carries the thrust, from the blade loading. A quick stall margin check against the section C_l,max.", "C̄_L = 6·C_T / σ_TR", "0.3 to 0.7")
	Add("FM", "Figure of Merit (hover only)", "Figure of Merit", "FM", "-", "Ideal hover power over actual hover power, using the induced power factor and the profile torque. Shown only in hover; forward flight uses effective L/D.", "FM = (C_T^1.5/√2) / (k_ind·C_T^1.5/√2 + C_Q0)", "0.55 to 0.80")
	Add("LDe", "Effective Lift-to-Drag Ratio", "Effective L/D", "(L/D)_e", "-", "Rotor lift times forward speed over air power. Zero in hover.", "(L/D)_e = μ·C_T / C_Pair", "4 to 10")
	Add("lam", "Total Inflow Ratio", "Inflow Ratio", "λ", "-", "Total flow through the disk normal to it, over tip speed: the axial free-stream component plus the induced part.", "λ = μ_z + λ_i", "")
	Add("lami", "Induced Inflow Ratio", "Induced Inflow", "λ_i", "-", "Induced velocity over tip speed. Found by bisection so that the blade-element thrust equals the momentum thrust. In ideal hover it is √(C_T/2).", "C_T,BET(λ) = 2·B²·λ_i·√(μ_x² + λ²)", "0.03 to 0.08 (hover)")
	Add("lamh", "Hover Inflow Ratio", "Hover Inflow", "λ_h", "-", "Induced inflow ratio an ideal rotor would have in hover at the current thrust coefficient. Reference scale for the inflow: λ_i / λ_h shows how far forward or axial flow has relieved the induced velocity.", "λ_h = √(C_T / 2)", "0.03 to 0.08")
	Add("muLam", "Advance-to-Inflow Ratio", "Advance-Inflow", "μ/λ", "-", "In-plane flow over total axial inflow. Zero in hover and growing as the wake skews toward the disk plane. It sets the wake skew angle that drives the inflow gradients.", "μ/λ = μ_x / (μ_z + λ_i)", "0 to 20")
	Add("Tc", "Dynamic-Pressure Thrust Coefficient", "Dynamic-Pressure Thrust", "T_c", "-", "Thrust over the dynamic pressure of the free stream times disk area. Useful when the rotor is treated like a propeller or a lifting surface moving at V. Undefined in hover.", "T_c = T / (½ρV²A) = 2C_T / μ_∞²,  V = √(V_x² + V_z²)", "")
	Add("Pc", "Dynamic-Pressure Power Coefficient", "Dynamic-Pressure Power", "P_c", "-", "Shaft power over ½ρV³A for the free-stream speed V. Undefined in hover.", "P_c = P / (½ρV³A) = 2C_P / μ_∞³,  V = √(V_x² + V_z²)", "")
	Add("Kx", "Longitudinal Inflow Gradient", "Long Gradient", "K_x", "-", "Fore-aft slope of the induced inflow over the disk, as a multiple of λ_i. Set by the inflow model from the wake skew angle; zero for uniform inflow.", "Coleman: K_x = tan(χ/2)", "")
	Add("Ky", "Lateral Inflow Gradient", "Lat Gradient", "K_y", "-", "Side-to-side slope of the induced inflow over the disk, as a multiple of λ_i. Zero for uniform and Coleman simple; −2μ for Coleman-Feingold and Drees.", "Drees: K_y = −2μ", "")
	Add("chi", "Wake Skew Angle", "Wake Skew", "χ", "°", "Angle of the wake from the shaft axis. 0° is hover, close to 90° at high speed.", "tan(χ/2) = μ / (√(μ² + λ²) + |λ|)", "0° to 90°")
	Add("Bres", "Tip-Loss Factor", "Tip Factor", "B", "-", "Tip-loss factor used in this solution. Equals the typed value in Fixed mode and the converged value in Sissingh mode.", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("OmR", "Tip Speed", "Tip Speed", "ΩR", "m/s", "Speed of the blade tip relative to the hub.", "ΩR = 2π·rpm·R / 60", "150 to 250 m/s (helicopters)")
	Add("Mtip", "Hover Tip Mach Number", "Tip Mach", "M_tip", "-", "Tip speed over local speed of sound.", "M_tip = ΩR / a", "0.4 to 0.7")
	Add("Madv", "Advancing Tip Mach Number", "Advancing Mach", "M_adv", "-", "Mach number of the advancing blade tip. Compressibility effects start near 0.8 to 0.9; Prandtl-Glauert is not valid at or above 1.", "M_adv = ΩR·(1 + μ_x) / a", "up to 0.9")
	Add("rho", "Air Density", "Density", "ρ", "kg/m³", "Air density from the standard-atmosphere pressure and the temperature entered.", "ρ = p / (287.058·T)", "0.9 to 1.225 kg/m³")
	Add("p", "Ambient Pressure", "Pressure", "p", "Pa", "Static pressure at the pressure altitude, from the standard atmosphere.", "p = 101325·(1 − 0.0065·h / 288.15)^5.2561", "")
	Add("a", "Speed of Sound", "Sound Speed", "a", "m/s", "Local speed of sound at the ambient temperature.", "a = √(1.4·287.058·T)", "")
	' ---------------- Option help: tip loss ----------------
	Add("tip_none", "Tip Loss None", "None", "B", "", "No tip loss. Blade loading is integrated all the way to the tip, which is optimistic.", "B = 1", "")
	Add("tip_fixed", "Tip Loss Fixed", "Fixed", "B", "", "Uses the tip-loss factor B typed in Geometry, for example the value a preset specifies. It is not the same as off.", "B = typed value", "0.92 to 0.98")
	Add("tip_sissingh", "Tip Loss Sissingh", "Sissingh", "B", "", "Computes B from the thrust coefficient and the blade count, iterating with the thrust until B stops changing.", "B = 1 − √(2C_T) / N_b", "")
	' ---------------- compressibility ----------------
	Add("comp_off", "Compressibility Off", "Off", "", "", "Lift-curve slope stays constant at a_0.", "a = a_0", "")
	Add("comp_pg", "Prandtl-Glauert", "Prandtl-Glauert", "", "", "Corrects the lift-curve slope for subsonic compressibility using the Mach number near 0.75R, capped at 0.85. A caution appears from M_adv = 0.8; the result is invalid at M_adv = 1.", "a = a_0 / √(1 − M_eff²),  M_eff = M_tip·√(0.75² + μ²/2)", "")
	' ---------------- inflow models ----------------
	Add("inflow_uniform", "Uniform Inflow", "Uniform", "", "", "Momentum theory: one induced velocity for the whole disk. No gradients, so there is no side force or pitch moment.", "K_x = K_y = 0", "")
	Add("inflow_coleman_simple", "Coleman Simple", "Coleman Simple", "", "", "Longitudinal inflow gradient from the wake skew angle (Coleman 1945). No lateral gradient.", "K_x = tan(χ/2),  K_y = 0", "")
	Add("inflow_coleman_feingold", "Coleman-Feingold (NDARC)", "Coleman-Feingold", "", "", "NDARC form of the Coleman model with the factor 15π/32 on the longitudinal gradient and a lateral gradient.", "K_x = (15π/32)·tan(χ/2),  K_y = −2μ", "")
	Add("inflow_drees", "Drees", "Drees", "", "", "Drees (1949) gradients, with a speed-dependent longitudinal term and a lateral gradient.", "K_x = (4/3)·(1 − 1.8μ²)·tan(χ/2),  K_y = −2μ", "")
	' ---------------- trim modes ----------------
	Add("trim_none", "Trim None", "None", "", "", "Uses the typed collective pitch and rotor speed as they are.", "", "")
	Add("trim_collective", "Trim Collective", "Collective", "Δθ", "", "Solves the collective pitch so the result matches the target thrust or thrust coefficient at the prescribed rotor speed.", "T(Δθ) = T_target", "")
	Add("trim_rpm", "Trim Rotor Speed", "Rotor Speed", "Ω", "", "Solves the rotor speed so the result matches the target, with the collective held.", "T(Ω) = T_target", "")
	' ---------------- drag integration ----------------
	Add("drag_tangential", "Analytical Tangential", "Tangential", "", "", "Closed form using only the tangential velocity component. Fast, least detailed.", "U_T = x + μ·sinψ", "")
	Add("drag_vectorial", "Analytical Vectorial", "Vectorial", "", "", "Closed form using the full relative velocity vector.", "W² = u_T² + u_R² + μ_z²", "")
	Add("drag_numerical", "Numerical Vectorial", "Numerical", "", "", "Gauss-Legendre quadrature over blade radius (16 points) and azimuth (24 points) with the full relative velocity. Reference method.", "C_Q0 = ∬ (σ·C_d0/2)·W·u_T·x dx dψ / 2π", "")
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

' Level 0 = Full Description Symbol, 1 = Short Description Symbol, 2 = Short Description
Public Sub PlainLabel(key As String, level As Int) As String
	Dim f() As String = Fld(key)
	Dim s As String = f(2)
	If level >= 2 Or s.Length = 0 Then
		If level = 0 Then Return f(0)
		Return f(1)
	End If
	If level = 0 Then Return f(0) & " " & s
	Return f(1) & " " & s
End Sub

' Label with real subscripts (same rendering for every symbol in the app)
Public Sub RichLabel(key As String, level As Int) As CSBuilder
	Return RichText(PlainLabel(key, level))
End Sub

' Renders X_abc as X with a lowered, smaller abc. Subscript = letters/digits after "_".
Public Sub RichText(text As String) As CSBuilder
	Dim cs As CSBuilder
	cs.Initialize
	Dim m As Matcher = Regex.Matcher("_([A-Za-z0-9]+)", text)
	Dim prev As Int = 0
	Do While m.Find
		cs.Append(text.SubString2(prev, m.GetStart(0)))
		cs.VerticalAlign(2dip).RelativeSize(0.72).Append(m.Group(1)).Pop.Pop
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
	Return cv.MeasureStringWidth(text.Replace("_", ""), Typeface.DEFAULT_BOLD, textSizeSp * FontScale)
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

' Returns the lowest level >= startLevel (0 = L, 1 = M, 2 = S) at which ALL labels fit in two lines
' of availableWidthPx (the real label width minus its padding) at the actual text size.
Public Sub ChooseLevel(keys As List, availableWidthPx As Int, textSizeSp As Float, startLevel As Int) As Int
	For level = startLevel To 1
		Dim ok As Boolean = True
		For Each k As String In keys
			If FitsLines(PlainLabel(k, level), availableWidthPx, textSizeSp, 2) = False Then
				ok = False
				Exit
			End If
		Next
		If ok Then Return level
	Next
	Return 2
End Sub

' Largest size in [minSp, maxSp] at which every label of the chosen level fits in two lines (no mid-word breaks).
Public Sub FitLabelSize(keys As List, level As Int, availableWidthPx As Int, maxSp As Float, minSp As Float) As Float
	Dim sp As Float = maxSp
	Do While sp > minSp
		Dim ok As Boolean = True
		For Each k As String In keys
			If FitsLines(PlainLabel(k, level), availableWidthPx, sp, 2) = False Then
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
