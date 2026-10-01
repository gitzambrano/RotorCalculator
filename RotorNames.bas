B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorNames.bas - canonical nomenclature (docs/nomenclature.md) + help texts. No visible views.
' Levels: 0 = L "Full Description Symbol", 1 = M "Short Description Symbol", 2 = S "Short Description".
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
	' ---------------- Geometry ----------------
	Add("name", "Rotor Name", "Name", "", "", "Identifier of the saved rotor. It appears in the rotor list and in exports.", "", "")
	Add("R", "Rotor Radius", "Radius", "R", "m", "Distance from the rotation axis to the blade tip. Sets the disk area and the tip speed.", "A = πR²", "0.05 m (small drone) to 12 m (heavy helicopter)")
	Add("Nb", "Blade Count", "Blades", "N_b", "-", "Number of identical blades. Together with chord it sets the rotor solidity.", "σ = N_b·c / (πR)", "2 to 8")
	Add("x0", "Root Cutout", "Cutout", "x_0", "-", "Inboard radial station x = r/R where aerodynamic loading starts. Inboard of it the blade produces no load.", "x_0 = r_root / R", "0.05 to 0.30")
	Add("c0", "Root Chord", "Root Chord", "c_0", "m", "Blade chord at the root cutout. Chord varies linearly to the tip chord.", "c(x) linear from c_0 to c_1", "0.02 to 0.8 m")
	Add("c1", "Tip Chord", "Tip Chord", "c_1", "m", "Blade chord at the tip. Equal to the root chord for a rectangular blade.", "c(x) linear from c_0 to c_1", "0.02 to 0.8 m")
	Add("taper", "Taper Ratio", "Taper", "c_1/c_0", "-", "Tip chord divided by root chord. 1 means a rectangular blade.", "taper = c_1 / c_0", "0.3 to 1.0")
	Add("sigmaRef", "Reference Solidity", "Solidity", "σ_ref", "-", "Total blade area over disk area, using the reference blade area.", "σ_ref = N_b·A_b / A", "0.05 to 0.15")
	Add("sigmaAct", "Active-Span Solidity", "Active Solidity", "σ_act", "-", "Blade area over disk area counting only the active span from root cutout to tip.", "σ_act = N_b·A_act / A", "0.05 to 0.15")
	Add("sigmaT", "Thrust-Weighted Solidity", "Thrust Solidity", "σ_T", "-", "Solidity weighted by the radial thrust distribution, which grows as r². Used to compute blade loading in hover.", "σ_T = 3 ∫ σ(x) x² dx", "0.05 to 0.15")
	Add("AR", "Aspect Ratio", "Aspect Ratio", "AR", "-", "Blade radius over mean chord. High aspect ratio gives slender blades.", "AR = R / c_mean", "6 to 25")
	Add("A", "Disk Area", "Disk Area", "A", "m²", "Area swept by the blades.", "A = πR²", "")
	Add("Ab", "Reference Blade Area", "Blade Area", "A_b", "m²", "Planform area of one blade over the full radius.", "A_b = ∫ c dr, 0 to R", "")
	Add("Aact", "Active Blade Area", "Active Area", "A_act", "m²", "Planform area of one blade over the active span only, from root cutout to tip.", "A_act = ∫ c dr, x_0R to R", "")
	Add("thRoot", "Root Pitch", "Root Pitch", "θ_root", "°", "Geometric blade pitch angle at the root station, before collective. Linked to tip pitch through the total twist.", "θ_twist = θ_tip − θ_root", "")
	Add("thTip", "Tip Pitch", "Tip Pitch", "θ_tip", "°", "Geometric blade pitch angle at the tip station, before collective. Linked to root pitch through the total twist.", "θ_twist = θ_tip − θ_root", "")
	Add("thTwist", "Total Blade Twist", "Twist", "θ_twist", "°", "Pitch change from root to tip, linear along the span. Negative twist (nose-down toward the tip) evens out the inflow and improves hover efficiency.", "θ_twist = θ_tip − θ_root", "-20° to 0° (typical -8° to -14°)")
	Add("airfoil", "Airfoil Section", "Airfoil", "", "", "Blade section from the airfoil database. It provides the lift-curve slope and the profile drag coefficient. Choose Custom to type your own values.", "C_l = a_0·α,  C_d = C_d0", "")
	Add("a0", "Lift-Curve Slope", "Lift Slope", "a_0", "1/rad", "Section lift per radian of angle of attack. Thin-airfoil theory gives 2π, real blade sections give less.", "C_l = a_0 (α − α_0)", "5.0 to 6.3 per rad")
	Add("Cd0", "Profile Drag Coefficient", "Profile Drag", "C_d0", "-", "Constant section drag coefficient at low angle of attack. Drives the profile power.", "C_d = C_d0", "0.006 to 0.012")
	Add("tipModel", "Tip-Loss Model", "Tip Loss", "", "", "How the loss of lift near the blade tip is modeled. None integrates the loading to the tip. Fixed cuts the loading at a user factor B. Sissingh derives B from the thrust coefficient.", "x_max = B", "")
	Add("B", "Tip-Loss Factor", "Tip Factor", "B", "-", "Radial station beyond which the blade carries no lift. 1 means no tip loss. In Sissingh mode it is calculated, in Fixed mode you set it.", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("comp", "Compressibility Correction", "Compressibility", "", "", "Off keeps the lift-curve slope constant. Prandtl-Glauert raises it with the local Mach number (evaluated at 0.75R, capped at M = 0.85).", "a = a_0 / √(1 − M²)", "")
	Add("rpmNom", "Nominal Rotor Speed", "Nominal Speed", "Ω_nom", "rpm", "Design rotor speed stored with the rotor. It seeds the Conditions page.", "Ω = 2π·rpm / 60", "")
	' ---------------- Conditions ----------------
	Add("h", "Pressure Altitude", "Altitude", "h", "m", "Altitude in the International Standard Atmosphere. Sets pressure, density and speed of sound together with temperature.", "ρ = p / (R_gas·T_amb)", "0 to 6000 m")
	Add("T0", "Ambient Temperature", "Temperature", "T_amb", "°C", "Static air temperature at the rotor. Used with altitude pressure to get air density.", "ρ = p / (R_gas·T_amb)", "-40 to 50 °C")
	Add("mu", "Advance Ratio", "Advance Ratio", "μ_x", "-", "Forward speed along the disk plane divided by tip speed. 0 is hover. One of two equivalent ways to enter horizontal flow.", "μ_x = V_x / (ΩR)", "0 to 0.5")
	Add("Vx", "Forward Airspeed", "Airspeed", "V_x", "m/s", "Airspeed component in the rotor disk plane. Alternative to the advance ratio.", "V_x = μ_x·ΩR", "0 to 100 m/s")
	Add("alpha", "Disk Angle of Attack", "Disk AoA", "α", "°", "Angle between the flow and the disk plane. Positive when the flow arrives from below the disk. One of three alternative axial-flow inputs.", "tan α = −V_z / V_x", "-20° to 20°")
	Add("Vz", "Climb Speed", "Climb Speed", "V_z", "m/s", "Axial speed through the disk. Positive is downward flow through the disk, that is climb. Alternative axial-flow input.", "V_z = μ_z·ΩR", "-10 to 10 m/s")
	Add("muz", "Axial Flow Ratio", "Axial Ratio", "μ_z", "-", "Axial speed divided by tip speed, positive down through the disk. Alternative axial-flow input.", "μ_z = V_z / (ΩR)", "-0.1 to 0.1")
	Add("trim", "Trim Mode", "Trim", "", "", "Chooses how the operating point is solved. None uses the typed collective and speed. Collective trim finds Δθ for the target. Speed trim finds Ω for the target.", "T(Δθ, Ω) = T_target", "")
	Add("rpm", "Rotor Speed", "Rotor Speed", "Ω", "rpm", "Rotor rotation rate. Sets the tip speed and the dynamic pressure scale.", "ΩR = 2π·rpm·R / 60", "")
	Add("coll", "Collective Pitch", "Collective", "Δθ", "°", "Pitch change applied equally to all blade stations, added to the geometric pitch. Solved automatically when collective trim is on.", "θ(x) = θ_root + θ_twist·(x − x_0)/(1 − x_0) + Δθ", "0° to 20°")
	Add("Ttgt", "Target Thrust", "Target Thrust", "T", "N", "Thrust the trim must reach. Exclusive with the target thrust coefficient.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("CTtgt", "Target Thrust Coefficient", "Target Coefficient", "C_T", "-", "Thrust coefficient the trim must reach. Exclusive with the target thrust.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("inflow", "Inflow Model", "Inflow", "", "", "How the induced velocity varies over the disk in forward flight. Uniform is momentum theory. The Coleman and Drees models add a longitudinal (and lateral) gradient tied to the wake skew angle.", "λ_i(x,ψ) = λ_i0 (1 + K_x x cosψ + K_y x sinψ)", "")
	Add("kind", "Induced Power Factor", "Induced Factor", "k_ind", "-", "Factor on ideal induced power that accounts for non-uniform inflow and tip losses. 1 is the ideal rotor.", "P_i = k_ind·T·v_i", "1.05 to 1.30")
	Add("drag", "Profile Drag Integration", "Drag Integration", "", "", "Method used to integrate the section profile drag over the disk. Tangential counts only the in-plane velocity. Vectorial uses the full relative velocity. Numerical integrates blade and azimuth by quadrature.", "dD = ½ρ U² c C_d0 dr", "")
	' ---------------- Results ----------------
	Add("T", "Thrust", "Thrust", "T", "N", "Rotor force along the shaft axis.", "T = C_T·ρ·A·(ΩR)²", "")
	Add("P", "Shaft Power", "Power", "P", "W", "Mechanical power at the rotor shaft.", "P = Q·Ω = C_Q·ρ·A·(ΩR)³", "")
	Add("Pi", "Induced Power", "Induced Power", "P_i", "W", "Power spent producing thrust, with the induced power factor applied.", "P_i = k_ind·T·v_i", "")
	Add("P0", "Profile Power", "Profile Power", "P_0", "W", "Power spent overcoming blade section drag.", "P_0 = C_Q0·ρ·A·(ΩR)³", "")
	Add("Q", "Shaft Torque", "Torque", "Q", "N·m", "Torque about the rotor shaft.", "Q = C_Q·ρ·A·(ΩR)²·R", "")
	Add("H", "In-Plane Force", "In-Plane Force", "H", "N", "Rotor force in the disk plane, along the flow direction (drag-like). Rigid hub, no flapping.", "H = C_H·ρ·A·(ΩR)²", "")
	Add("Y", "Side Force", "Side Force", "Y", "N", "Rotor force in the disk plane, perpendicular to the flow. Rigid hub, no flapping.", "Y = C_Y·ρ·A·(ΩR)²", "")
	Add("Mx", "Roll Moment", "Roll Moment", "M_x", "N·m", "Hub moment about the longitudinal axis. Rigid hub, no flapping, so the full moment goes into the hub.", "M_x = C_Mx·ρ·A·(ΩR)²·R", "")
	Add("My", "Pitch Moment", "Pitch Moment", "M_y", "N·m", "Hub moment about the lateral axis. Rigid hub, no flapping, so the full moment goes into the hub.", "M_y = C_My·ρ·A·(ΩR)²·R", "")
	Add("DL", "Disk Loading", "Disk Loading", "T/A", "N/m²", "Thrust per unit disk area. Low disk loading means efficient hover.", "DL = T / A", "50 to 500 N/m² (helicopters)")
	Add("PL", "Power Loading", "Power Loading", "T/P", "N/W", "Thrust produced per unit of shaft power.", "PL = T / P", "0.05 to 0.15 N/W")
	Add("vi", "Induced Velocity", "Induced Velocity", "v_i", "m/s", "Mean velocity added to the air through the disk.", "v_i = λ_i·ΩR", "")
	Add("CT", "Thrust Coefficient", "Thrust Coeff", "C_T", "-", "Thrust made non-dimensional by disk area and tip speed.", "C_T = T / [ρA(ΩR)²]", "0.002 to 0.015")
	Add("CQ", "Torque Coefficient", "Torque Coeff", "C_Q", "-", "Torque non-dimensionalized by ρA(ΩR)²R. Equals the power coefficient C_P.", "C_Q = Q / [ρA(ΩR)²R] = C_Qi + C_Q0", "")
	Add("CQi", "Induced Torque Coefficient", "Induced Torque", "C_Qi", "-", "Induced part of the torque coefficient.", "C_Qi = k_ind·λ_i·C_T", "")
	Add("CQ0", "Profile Torque Coefficient", "Profile Torque", "C_Q0", "-", "Profile-drag part of the torque coefficient.", "C_Q = C_Qi + C_Q0", "")
	Add("CH", "In-Plane Force Coefficient", "In-Plane Coeff", "C_H", "-", "In-plane (drag-like) force coefficient. Sum of induced and profile parts.", "C_H = C_Hi + C_H0", "")
	Add("CHi", "Induced In-Plane Coefficient", "Induced In-Plane", "C_Hi", "-", "Induced part of the in-plane force coefficient, from the tilt of the lift vector.", "C_H = C_Hi + C_H0", "")
	Add("CH0", "Profile In-Plane Coefficient", "Profile In-Plane", "C_H0", "-", "Profile-drag part of the in-plane force coefficient.", "C_H = C_Hi + C_H0", "")
	Add("CY", "Side Force Coefficient", "Side Force Coeff", "C_Y", "-", "Side force made non-dimensional like thrust.", "C_Y = Y / [ρA(ΩR)²]", "")
	Add("CMx", "Roll Moment Coefficient", "Roll Coeff", "C_Mx", "-", "Roll hub moment made non-dimensional. Rigid hub, no flapping.", "C_Mx = M_x / [ρA(ΩR)²R]", "")
	Add("CMy", "Pitch Moment Coefficient", "Pitch Coeff", "C_My", "-", "Pitch hub moment made non-dimensional. Rigid hub, no flapping.", "C_My = M_y / [ρA(ΩR)²R]", "")
	Add("CPair", "Air Power Coefficient", "Air Power Coeff", "C_Pair", "-", "Power coefficient from the energy balance: induced, climb and profile terms.", "C_Pair = k_ind·λ_i·C_T + μ_z·C_T + C_P0", "")
	Add("CTs", "Blade Loading", "Blade Loading", "C_T/σ", "-", "Thrust coefficient per unit solidity. Indicates how hard the blades work; stall limits it near 0.12 to 0.15.", "C_T / σ", "0.05 to 0.12")
	Add("FM", "Figure of Merit (hover only)", "Figure of Merit", "FM", "-", "Ratio of ideal to actual hover power. Defined only in hover; forward flight uses effective L/D instead.", "FM = C_T^1.5 / (√2·C_P)", "0.55 to 0.80")
	Add("LDe", "Effective Lift-to-Drag Ratio", "Effective L/D", "(L/D)_e", "-", "Rotor lift times speed over power in forward flight. Zero in hover.", "(L/D)_e = μ·C_T / C_Pair", "4 to 10")
	Add("lam", "Total Inflow Ratio", "Inflow Ratio", "λ", "-", "Total flow through the disk normal to it, made non-dimensional by tip speed. Includes axial flow and the induced part.", "λ = μ_z + λ_i", "")
	Add("lami", "Induced Inflow Ratio", "Induced Inflow", "λ_i", "-", "Induced velocity over tip speed. In hover, λ_i = √(C_T/2).", "λ_i = λ_h² / √(μ² + λ²)", "0.03 to 0.08 (hover)")
	Add("Kx", "Longitudinal Inflow Gradient", "Long Gradient", "K_x", "-", "Fore-aft slope of the induced inflow over the disk, set by the inflow model and wake skew.", "Coleman: K_x = tan(χ/2)", "")
	Add("Ky", "Lateral Inflow Gradient", "Lat Gradient", "K_y", "-", "Side-to-side slope of the induced inflow over the disk.", "Drees: K_y = −2μ", "")
	Add("chi", "Wake Skew Angle", "Wake Skew", "χ", "°", "Angle of the wake from the shaft axis. 0° is hover, close to 90° at high speed.", "χ = atan(μ / λ)", "0° to 90°")
	Add("Bres", "Tip-Loss Factor", "Tip Factor", "B", "-", "Tip-loss factor used in this solution.", "Sissingh: B = 1 − √(2C_T) / N_b", "0.92 to 1.00")
	Add("OmR", "Tip Speed", "Tip Speed", "ΩR", "m/s", "Speed of the blade tip in hover.", "ΩR = 2π·rpm·R / 60", "150 to 250 m/s (helicopters)")
	Add("Mtip", "Hover Tip Mach Number", "Tip Mach", "M_tip", "-", "Tip speed over local speed of sound.", "M_tip = ΩR / a", "0.4 to 0.7")
	Add("Madv", "Advancing Tip Mach Number", "Advancing Mach", "M_adv", "-", "Mach number of the advancing blade tip. Compressibility effects start near 0.8 to 0.9.", "M_adv = (ΩR + V_x) / a", "up to 0.9")
	Add("rho", "Air Density", "Density", "ρ", "kg/m³", "Air density from the standard atmosphere and the temperature entered.", "ρ = p / (R_gas·T_amb)", "0.9 to 1.225 kg/m³")
	Add("p", "Ambient Pressure", "Pressure", "p", "Pa", "Static pressure at the pressure altitude.", "p = p_0 (1 − L·h / T_0)^5.256", "")
	Add("a", "Speed of Sound", "Sound Speed", "a", "m/s", "Local speed of sound at the ambient temperature.", "a = √(γ·R_gas·T_amb)", "")
	' ---------------- Option help: tip loss ----------------
	Add("tip_none", "Tip Loss None", "None", "B", "", "No tip loss. Blade loading is integrated all the way to the tip, which is optimistic.", "B = 1", "")
	Add("tip_fixed", "Tip Loss Fixed", "Fixed", "B", "", "Uses the tip-loss factor B typed in Geometry, for example the value a preset specifies. It is not the same as off.", "B = typed value", "0.92 to 0.98")
	Add("tip_sissingh", "Tip Loss Sissingh", "Sissingh", "B", "", "Computes B from the thrust coefficient and the blade count, iterating with the thrust.", "B = 1 − √(2C_T) / N_b", "")
	' ---------------- compressibility ----------------
	Add("comp_off", "Compressibility Off", "Off", "", "", "Lift-curve slope stays constant at a_0.", "a = a_0", "")
	Add("comp_pg", "Prandtl-Glauert", "Prandtl-Glauert", "", "", "Corrects the lift-curve slope for subsonic compressibility using the effective Mach number near 0.75R, capped at 0.85.", "a = a_0 / √(1 − M²)", "")
	' ---------------- inflow models ----------------
	Add("inflow_uniform", "Uniform Inflow", "Uniform", "", "", "Momentum theory: one induced velocity for the whole disk. No gradients.", "K_x = K_y = 0", "")
	Add("inflow_coleman_simple", "Coleman Simple", "Coleman Simple", "", "", "Longitudinal inflow gradient from the wake skew angle (Coleman 1945). No lateral gradient.", "K_x = tan(χ/2), K_y = 0", "")
	Add("inflow_coleman_feingold", "Coleman-Feingold (NDARC)", "Coleman-Feingold", "", "", "NDARC form of the Coleman model with a longitudinal factor 15π/32 and a lateral gradient.", "K_x = (15π/32)·tan(χ/2), K_y = −2μ", "")
	Add("inflow_drees", "Drees", "Drees", "", "", "Drees (1949) gradients, with a speed-dependent longitudinal term and a lateral gradient.", "K_x = (4/3)(1 − 1.8μ²)·tan(χ/2), K_y = −2μ", "")
	' ---------------- trim modes ----------------
	Add("trim_none", "Trim None", "None", "", "", "Uses the typed collective pitch and rotor speed as they are.", "", "")
	Add("trim_collective", "Trim Collective", "Collective", "Δθ", "", "Solves the collective pitch so the result matches the target thrust or thrust coefficient.", "T(Δθ) = T_target", "")
	Add("trim_rpm", "Trim Rotor Speed", "Rotor Speed", "Ω", "", "Solves the rotor speed so the result matches the target, with the collective held.", "T(Ω) = T_target", "")
	' ---------------- drag integration ----------------
	Add("drag_tangential", "Analytical Tangential", "Tangential", "", "", "Closed form using only the tangential velocity component. Fast, least detailed.", "U ≈ ΩR (x + μ sinψ)", "")
	Add("drag_vectorial", "Analytical Vectorial", "Vectorial", "", "", "Closed form using the full in-plane velocity vector.", "U² = U_T² + U_P²", "")
	Add("drag_numerical", "Numerical Vectorial", "Numerical", "", "", "Gauss-Legendre quadrature over blade radius and azimuth with the full relative velocity. Reference method.", "C_Q0 = ∬ (σ C_d0 / 2) U² x dx dψ", "")
	' ---------------- sweep trim modes ----------------
	Add("sw_none", "No Trim (Fixed Controls)", "No Trim", "", "", "Collective and speed are held at the Conditions values for every point of the sweep.", "", "")
	Add("sw_coll_all", "Trim Collective Δθ · Every Point", "Collective Every Point", "", "", "Re-solves collective at every sweep point so the target thrust is held.", "T(Δθ) = T_target at each μ", "")
	Add("sw_rpm_all", "Trim Rotor Speed Ω · Every Point", "Speed Every Point", "", "", "Re-solves rotor speed at every sweep point so the target thrust is held.", "T(Ω) = T_target at each μ", "")
	Add("sw_coll_hover", "Trim Collective Δθ · Hover Only", "Collective Hover Only", "", "", "Solves collective once at μ = 0 and holds it fixed along the sweep.", "Δθ from T(Δθ, μ=0) = T_target", "")
	Add("sw_rpm_hover", "Trim Rotor Speed Ω · Hover Only", "Speed Hover Only", "", "", "Solves rotor speed once at μ = 0 and holds it fixed along the sweep.", "Ω from T(Ω, μ=0) = T_target", "")
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
	Add("xAxis", "Sweep Axis", "Axis", "", "", "Horizontal axis of the sweep: advance ratio μ or forward airspeed V_x.", "μ_x = V_x / (ΩR)", "")
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
