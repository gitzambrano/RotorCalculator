B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorPopups.bas — Technical Dialogs, Airfoil Database, and Universal μₓ-Sweep Canvas Plotting
' Supports full multi-curve sweeps across ALL aerodynamic and performance parameters vs advance ratio (μₓ).

Sub Process_Globals
	
	Type AirfoilData ( _
		Name As String, _
		Description As String, _
		A0 As Double, _
		Cd0 As Double, _
		ThicknessRatio As Double _
	)
	
	Public Airfoils As List
	
	' Complete catalog of ALL selectable parameters for μₓ-sweeps
	Public SweepParamKeys As List
	' Last plot geometry (px / axis units) so the caller can map a touch x to an axis value.
	Public LastPlotLeft As Float
	Public LastPlotW As Float
	Public LastXMax As Double
	Public SweepParamLabels As List
	Private plotThemeIdx As Int = -1
	Private dpIdx As Int
	Private dpRem As Float
	Type SweepPoint (CurveLabel As String, Mu As Double, Vx As Double, AxialMode As String, AxialValue As Double, _
		MuZ As Double, InflowModel As String, Value As Double, Valid As Boolean, RPM As Double, _
		CollectiveDeg As Double, CT As Double, ThrustN As Double, MuLam As Double, _
		TorqueNm As Double, PowerKW As Double, PiKW As Double, P0KW As Double, PparKW As Double, _
		CQ As Double, CP As Double, CH As Double, FoM As Double, MachAdv As Double, MachRet As Double, _
		LambdaI As Double, Vz As Double)
End Sub

' Initializes the rotorcraft airfoil library and the complete parameter catalog
Public Sub Initialize
	If Airfoils.IsInitialized = False Then
		Airfoils.Initialize
		
		Dim af1 As AirfoilData
		af1.Initialize
		af1.Name = "NACA 0012"
		af1.Description = "Classical symmetric airfoil, standard rotorcraft benchmark."
		af1.A0 = 5.73
		af1.Cd0 = 0.0090
		af1.ThicknessRatio = 0.12
		Airfoils.Add(af1)
		
		Dim af2 As AirfoilData
		af2.Initialize
		af2.Name = "NACA 23012"
		af2.Description = "Low pitching moment (Cmo ~ 0), high maximum lift."
		af2.A0 = 5.85
		af2.Cd0 = 0.0085
		af2.ThicknessRatio = 0.12
		Airfoils.Add(af2)
		
		Dim af3 As AirfoilData
		af3.Initialize
		af3.Name = "Boeing Vertol VR-7"
		af3.Description = "Advanced transonic rotor section (CH-47 Chinook)."
		af3.A0 = 5.90
		af3.Cd0 = 0.0095
		af3.ThicknessRatio = 0.12
		Airfoils.Add(af3)
		
		Dim af4 As AirfoilData
		af4.Initialize
		af4.Name = "Sikorsky SC1095"
		af4.Description = "High-performance modern rotor section (UH-60 Black Hawk)."
		af4.A0 = 6.00
		af4.Cd0 = 0.0088
		af4.ThicknessRatio = 0.095
		Airfoils.Add(af4)
		
		Dim af5 As AirfoilData
		af5.Initialize
		af5.Name = "Clark Y"
		af5.Description = "Cambered section with flat bottom, popular in drones and props."
		af5.A0 = 5.65
		af5.Cd0 = 0.0100
		af5.ThicknessRatio = 0.117
		Airfoils.Add(af5)
		
		Dim af6 As AirfoilData
		af6.Initialize
		af6.Name = "Selig S8036"
		af6.Description = "Low-Reynolds number optimized section (eVTOL / Multirotor)."
		af6.A0 = 5.70
		af6.Cd0 = 0.0110
		af6.ThicknessRatio = 0.14
		Airfoils.Add(af6)
	End If
	
	' Initializes ALL selectable output parameters for μₓ-sweeps
	If SweepParamKeys.IsInitialized = False Then
		SweepParamKeys.Initialize
		SweepParamLabels.Initialize
		
		AddSweepParam("CT", SweepParamDisplayName("CT"))
		AddSweepParam("CTs", SweepParamDisplayName("CTs"))
		AddSweepParam("CP", SweepParamDisplayName("CP"))
		AddSweepParam("CQi", SweepParamDisplayName("CQi"))
		AddSweepParam("CQ0", SweepParamDisplayName("CQ0"))
		AddSweepParam("CH", SweepParamDisplayName("CH"))
		AddSweepParam("CHi", SweepParamDisplayName("CHi"))
		AddSweepParam("CH0", SweepParamDisplayName("CH0"))
		AddSweepParam("CY", SweepParamDisplayName("CY"))
		AddSweepParam("CMx", SweepParamDisplayName("CMx"))
		AddSweepParam("CMy", SweepParamDisplayName("CMy"))
		AddSweepParam("CPair", SweepParamDisplayName("CPair"))
		AddSweepParam("lambda", SweepParamDisplayName("lambda"))
		AddSweepParam("lambda_i", SweepParamDisplayName("lambda_i"))
		AddSweepParam("muLam", SweepParamDisplayName("muLam"))
		AddSweepParam("lamh", SweepParamDisplayName("lamh"))
		AddSweepParam("CLbar", SweepParamDisplayName("CLbar"))
		For Each outputKey As String In Array As String("vi", "Vztot", "Vadv", "Vret", "Mret", _
			"aoaAdv25", "aoaRet25", "aoaAdv50", "aoaRet50", "aoaAdv75", "aoaRet75", "aoaAdvTip", "aoaRetTip", _
			"phiAdv25", "phiRet25", "phiAdv50", "phiRet50", "phiAdv75", "phiRet75", "phiAdvTip", "phiRetTip")
			AddSweepParam(outputKey, SweepParamDisplayName(outputKey))
		Next
		AddSweepParam("Tc", SweepParamDisplayName("Tc"))
		AddSweepParam("Pc", SweepParamDisplayName("Pc"))
		AddSweepParam("L_D_eff", SweepParamDisplayName("L_D_eff"))
		AddSweepParam("FoM", SweepParamDisplayName("FoM"))
		AddSweepParam("Kx", SweepParamDisplayName("Kx"))
		AddSweepParam("Ky", SweepParamDisplayName("Ky"))
		AddSweepParam("chi", SweepParamDisplayName("chi"))
		AddSweepParam("Mat", SweepParamDisplayName("Mat"))
		AddSweepParam("PowerKW", SweepParamDisplayName("PowerKW"))
		AddSweepParam("PowerHP", SweepParamDisplayName("PowerHP"))
		AddSweepParam("ThrustN", SweepParamDisplayName("ThrustN"))
		AddSweepParam("ThrustKgf", SweepParamDisplayName("ThrustKgf"))
		AddSweepParam("TorqueNm", SweepParamDisplayName("TorqueNm"))
		AddSweepParam("DragHN", SweepParamDisplayName("DragHN"))
		AddSweepParam("PowerIndKW", SweepParamDisplayName("PowerIndKW"))
		AddSweepParam("PowerProfKW", SweepParamDisplayName("PowerProfKW"))
		AddSweepParam("PowerAirKW", SweepParamDisplayName("PowerAirKW"))
		AddSweepParam("TorqueIndNm", SweepParamDisplayName("TorqueIndNm"))
		AddSweepParam("TorqueProfNm", SweepParamDisplayName("TorqueProfNm"))
		AddSweepParam("DragIndN", SweepParamDisplayName("DragIndN"))
		AddSweepParam("DragProfN", SweepParamDisplayName("DragProfN"))
		AddSweepParam("B", SweepParamDisplayName("B"))
		AddSweepParam("TipSpeed", SweepParamDisplayName("TipSpeed"))
		AddSweepParam("RPM", SweepParamDisplayName("RPM"))
		AddSweepParam("Collective", SweepParamDisplayName("Collective"))
		AddSweepParam("Mu", SweepParamDisplayName("Mu"))
		AddSweepParam("Vx", SweepParamDisplayName("Vx"))
		AddSweepParam("MuZ", SweepParamDisplayName("MuZ"))
		AddSweepParam("Vz", SweepParamDisplayName("Vz"))
		AddSweepParam("Alpha", SweepParamDisplayName("Alpha"))
		AddSweepParam("Altitude", SweepParamDisplayName("Altitude"))
		AddSweepParam("Temperature", SweepParamDisplayName("Temperature"))
		AddSweepParam("Density", SweepParamDisplayName("Density"))
		AddSweepParam("Pressure", SweepParamDisplayName("Pressure"))
		AddSweepParam("SoundSpeed", SweepParamDisplayName("SoundSpeed"))
	End If
End Sub

' ---------------------------------------------------------------------------
' Parameter metadata (canonical names per docs/nomenclature.md)
' Returns Array(Full, Short, Symbol(plain, "_" subscripts), Unit)
' ---------------------------------------------------------------------------
Private Sub SweepNameKey(k As String) As String
	Select k
		Case "CP": Return "CQ"
		Case "lambda": Return "lam"
		Case "lambda_i": Return "lami"
		Case "L_D_eff": Return "LDe"
		Case "FoM": Return "FM"
		Case "Mat": Return "Madv"
		Case "PowerKW", "PowerHP": Return "P"
		Case "ThrustN", "ThrustKgf": Return "T"
		Case "TorqueNm": Return "Q"
		Case "DragHN": Return "H"
		Case "PowerIndKW": Return "Pi"
		Case "PowerProfKW": Return "P0"
		Case "PowerAirKW": Return "Pair"
		Case "TorqueIndNm": Return "Qi"
		Case "TorqueProfNm": Return "Q0"
		Case "DragIndN": Return "Hi"
		Case "DragProfN": Return "H0"
		Case "B": Return "Bres"
		Case "TipSpeed": Return "OmR"
		Case "RPM": Return "rpm"
		Case "Collective": Return "coll"
		Case "Mu": Return "mu"
		Case "MuZ": Return "muz"
		Case "Alpha": Return "alpha"
		Case "Altitude": Return "h"
		Case "Temperature": Return "T0"
		Case "Density": Return "rho"
		Case "Pressure": Return "p"
		Case "SoundSpeed": Return "a"
		Case Else: Return k
	End Select
End Sub

Private Sub SweepUnit(k As String) As String
	Select k
		Case "chi", "Collective", "Alpha", _
			"aoaAdv25", "aoaRet25", "aoaAdv50", "aoaRet50", "aoaAdv75", "aoaRet75", "aoaAdvTip", "aoaRetTip", _
			"phiAdv25", "phiRet25", "phiAdv50", "phiRet50", "phiAdv75", "phiRet75", "phiAdvTip", "phiRetTip": Return "deg"
		Case "PowerKW", "PowerIndKW", "PowerProfKW", "PowerAirKW": Return "kW"
		Case "PowerHP": Return "hp"
		Case "ThrustN", "DragHN", "DragIndN", "DragProfN": Return "N"
		Case "ThrustKgf": Return "kgf"
		Case "TorqueNm", "TorqueIndNm", "TorqueProfNm": Return "N" & Chr(183) & "m"
		Case "TipSpeed", "Vx", "Vz", "vi", "Vztot", "Vadv", "Vret", "SoundSpeed": Return "m/s"
		Case "RPM": Return "rpm"
		Case "Altitude": Return "m"
		Case "Temperature": Return Chr(176) & "C"
		Case "Density": Return "kg/m" & Chr(179)
		Case "Pressure": Return "Pa"
		Case Else: Return Chr(8211)
	End Select
End Sub

' Returns Array(Full, Short, Symbol(plain, "_" subscripts), Unit). All names come from RotorNames (single source).
Private Sub SweepInfo(k As String) As String()
	Dim nk As String = SweepNameKey(k)
	Dim u As String = SweepUnit(k)
	If k = "TorqueNm" Or k = "TorqueIndNm" Or k = "TorqueProfNm" Then u = "N" & Chr(183) & "m"
	If RotorNames.HasKey(nk) Then Return Array As String(RotorNames.FullName(nk), RotorNames.ShortName(nk), RotorNames.Symbol(nk), u)
	Return Array As String(k, k, k, u)
End Sub

Public Sub SweepParamFullName(key As String) As String
	Dim i() As String = SweepInfo(key)
	Return i(0)
End Sub

Public Sub SweepParamShortName(key As String) As String
	Dim i() As String = SweepInfo(key)
	Return i(1)
End Sub

' Plain-text symbol with "_" subscripts (CSV / accessibility).
Public Sub SweepParamSymbol(key As String) As String
	Dim i() As String = SweepInfo(key)
	Return i(2)
End Sub

' Unit text; dimensionless = en dash.
Public Sub SweepParamUnit(key As String) As String
	Dim i() As String = SweepInfo(key)
	Return i(3)
End Sub

' Symbol with real subscripts where the glyphs exist (digits, x, i, e, o, a); otherwise unchanged.
' Draws text where "_xyz" segments become a smaller lowered subscript (canvas has no spans).
Private Sub DrawRichText(cvs As Canvas, text As String, x As Float, y As Float, face As Typeface, fs As Float, col As Int, align As String)
	Dim m As Matcher = Regex.Matcher("_\{([^}]+)\}|_([A-Za-z0-9]+)", text)
	Dim segs As List
	segs.Initialize
	Dim prev As Int = 0
	Do While m.Find
		If m.GetStart(0) > prev Then segs.Add(Array As Object(text.SubString2(prev, m.GetStart(0)), False))
		Dim subText As String = m.Group(1)
		If subText = Null Then subText = m.Group(2)
		segs.Add(Array As Object(subText, True))
		prev = m.GetEnd(0)
	Loop
	If prev < text.Length Then segs.Add(Array As Object(text.SubString(prev), False))
	Dim total As Float = 0
	For i = 0 To segs.Size - 1
		Dim sg() As Object = segs.Get(i)
		Dim isSub As Boolean = sg(1)
		Dim sz As Float = fs
		If isSub Then sz = fs * 0.72
		total = total + cvs.MeasureStringWidth(sg(0), face, sz)
	Next
	Dim cx As Float = x
	If align = "CENTER" Then cx = x - total / 2
	If align = "RIGHT" Then cx = x - total
	For j = 0 To segs.Size - 1
		Dim sg2() As Object = segs.Get(j)
		Dim isSub2 As Boolean = sg2(1)
		Dim sz2 As Float = fs
		Dim dy As Float = 0
		If isSub2 Then
			sz2 = fs * 0.72
			dy = fs * 0.22 * 1dip
		End If
		cvs.DrawText(sg2(0), cx, y + dy, face, sz2, col, "LEFT")
		cx = cx + cvs.MeasureStringWidth(sg2(0), face, sz2)
	Next
End Sub

Public Sub PrettySymbol(sym As String) As String
	Dim p As Int = sym.IndexOf("_")
	If p < 0 Then Return sym
	Dim tail As String = sym.SubString(p + 1)
	Dim plainSet As String = "0123456789xieoa"
	Dim subSet As String = Chr(8320) & Chr(8321) & Chr(8322) & Chr(8323) & Chr(8324) & Chr(8325) & Chr(8326) & Chr(8327) & Chr(8328) & Chr(8329) & Chr(8339) & Chr(7522) & Chr(8337) & Chr(8338) & Chr(8336)
	Dim sb As StringBuilder
	sb.Initialize
	For i = 0 To tail.Length - 1
		Dim ch As String = tail.SubString2(i, i + 1)
		Dim ix As Int = plainSet.IndexOf(ch)
		If ix < 0 Then Return sym
		sb.Append(subSet.SubString2(ix, ix + 1))
	Next
	Return sym.SubString2(0, p) & sb.ToString
End Sub

' Spinner label: Full name + symbol.
Private Sub SweepParamDisplayName(paramKey As String) As String
	Return SweepParamFullName(paramKey) & " " & PrettySymbol(SweepParamSymbol(paramKey))
End Sub

Private Sub AddSweepParam(key As String, label As String)
	SweepParamKeys.Add(key)
	SweepParamLabels.Add(label)
End Sub

Public Sub SweepParamDigits(paramKey As String) As Int
	Select paramKey
		Case "CT": Return 5
		Case "CTs": Return 4
		Case "CP", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair": Return 6
		Case "lambda", "lambda_i", "lamh": Return 5
		Case "muLam", "CLbar": Return 3
		Case "Tc", "Pc": Return 4
		Case "L_D_eff": Return 2
		Case "FoM": Return 4
		Case "Kx", "Ky": Return 3
		Case "chi": Return 1
		Case "Mat": Return 3
		Case "PowerKW", "PowerHP", "TorqueNm", "DragHN", "PowerIndKW", "PowerProfKW", "PowerAirKW", "TorqueIndNm", "TorqueProfNm", "DragIndN", "DragProfN": Return 1
		Case "ThrustN", "ThrustKgf", "RPM", "Altitude": Return 0
		Case "B", "Mu", "MuZ", "Density": Return 4
		Case "Collective", "Alpha": Return 2
		Case "TipSpeed", "Vx", "Vz", "Temperature", "SoundSpeed": Return 1
		Case "Pressure": Return 0
		Case Else: Return 5
	End Select
End Sub

' Legacy extractor (no blade-loading support: needs sigma).
' sigma = thrust-weighted solidity, used only by "CTs" (CT/sigma).
Public Sub ExtractParamValueS(res As RotorResults, paramKey As String, sigma As Double, area As Double) As Double
	Select Case paramKey
		Case "CT": Return res.CT
		Case "CTs"
			If sigma > 0 Then Return res.CT / sigma
			Return 0
		Case "CP", "CQ": Return res.CQ
		Case "CQi": Return res.CQi
		Case "CQ0": Return res.CQ0
		Case "CH": Return res.CH
		Case "CHi": Return res.CHi
		Case "CH0": Return res.CH0
		Case "CY": Return res.CY
		Case "CMx": Return res.CMx
		Case "CMy": Return res.CMy
		Case "CPair": Return res.CPair
		Case "lambda": Return res.InflowLambda
		Case "lambda_i": Return res.InflowLambdaI
		Case "muLam": Return zBETEngine.DerivedMuOverLambda(res)
		Case "lamh": Return zBETEngine.DerivedLambdaH(res)
		Case "CLbar": Return zBETEngine.DerivedClBar(res, sigma)
		Case "vi", "Vztot", "Vadv", "Vret", "Mret", _
			"aoaAdv25", "aoaRet25", "aoaAdv50", "aoaRet50", "aoaAdv75", "aoaRet75", "aoaAdvTip", "aoaRetTip", _
			"phiAdv25", "phiRet25", "phiAdv50", "phiRet50", "phiAdv75", "phiRet75", "phiAdvTip", "phiRetTip": Return zBETEngine.DerivedOutput(res, paramKey)
		Case "Tc": Return zBETEngine.DerivedTc(res, area)
		Case "Pc": Return zBETEngine.DerivedPc(res, area)
		Case "L_D_eff": Return res.L_D_eff
		Case "FoM": Return res.FoM
		Case "Kx": Return res.InflowKx
		Case "Ky": Return res.InflowKy
		Case "chi": Return res.WakeSkewChiDeg
		Case "Mat": Return res.AdvancingTipMach
		Case "PowerKW": Return res.PowerShaftKW
		Case "PowerHP": Return res.PowerShaftHP
		Case "ThrustN": Return res.ThrustN
		Case "ThrustKgf": Return res.ThrustKgf
		Case "TorqueNm": Return res.TorqueNm
		Case "DragHN": Return res.DragHN
		Case "DragIndN": Return res.CHi * res.DensityRho * area * res.TipSpeed * res.TipSpeed
		Case "DragProfN": Return res.CH0 * res.DensityRho * area * res.TipSpeed * res.TipSpeed
		Case "TorqueIndNm": Return res.CQi * res.DensityRho * area * res.TipSpeed * res.TipSpeed * Sqrt(area / 3.141592653589793)
		Case "TorqueProfNm": Return res.CQ0 * res.DensityRho * area * res.TipSpeed * res.TipSpeed * Sqrt(area / 3.141592653589793)
		Case "PowerIndKW": Return res.CQi * res.DensityRho * area * Power(res.TipSpeed, 3) / 1000
		Case "PowerProfKW": Return res.CQ0 * res.DensityRho * area * Power(res.TipSpeed, 3) / 1000
		Case "PowerAirKW": Return res.CPair * res.DensityRho * area * Power(res.TipSpeed, 3) / 1000
		Case "B": Return res.BFactor
		Case "TipSpeed": Return res.TipSpeed
		Case "RPM": Return res.TrimmedRPM
		Case "Collective": Return res.TrimmedCollectiveDeg
		Case "Mu": Return res.OperatingMu
		Case "Vx": Return res.OperatingVx
		Case "MuZ": Return res.OperatingMuZ
		Case "Vz": Return res.OperatingVz
		Case "Alpha": Return res.OperatingAlphaDeg
		Case "Altitude": Return res.AltitudeM
		Case "Temperature": Return res.TemperatureC
		Case "Density": Return res.DensityRho
		Case "Pressure": Return res.PressurePa
		Case "SoundSpeed": Return res.SpeedOfSound
		Case Else: Return res.CT
	End Select
End Sub

Private Sub GeomArea(geom As RotorGeometry) As Double
	Return zBETEngine.RotorArea(geom)
End Sub

Private Sub GeomSigma(geom As RotorGeometry) As Double
	Dim g As RotorGeometry = zBETEngine.ResolveSolidity(zBETEngine.CloneGeometry(geom))
	If g.SigmaThrust > 0 Then Return g.SigmaThrust
	Return g.SigmaRef
End Sub

' ---------------------------------------------------------------------------
' Trim modes
' ---------------------------------------------------------------------------
Public Sub SweepTrimModeKeys As List
	Return Array("none", "coll_all", "rpm_all", "coll_hover", "rpm_hover")
End Sub

Public Sub SweepTrimModeLabel(key As String) As String
	Dim dot As String = " " & Chr(183) & " "
	Select key
		Case "coll_all": Return "Trim Collective " & Chr(916) & Chr(952) & dot & "Every Point"
		Case "rpm_all": Return "Trim Rotor Speed " & Chr(937) & dot & "Every Point"
		Case "coll_hover": Return "Trim Collective " & Chr(916) & Chr(952) & dot & "Hover Only"
		Case "rpm_hover": Return "Trim Rotor Speed " & Chr(937) & dot & "Hover Only"
		Case Else: Return "No Trim (Fixed Controls)"
	End Select
End Sub

' Sets the operating pair so that collective (rpmTrim=False) or RPM (rpmTrim=True) is solved to the target.
Private Sub ApplyTrimPair(c As FlightCondition, rpmTrim As Boolean, kind As String, tgt As Double, baseRPM As Double, baseColl As Double)
	c.RPM = baseRPM
	c.CollectiveDeg = baseColl
	If rpmTrim Then
		c.OperatingPair = "collective_" & kind
	Else
		c.OperatingPair = "rpm_" & kind
	End If
	If kind = "ct" Then
		c.TargetCT = tgt
	Else
		c.TargetThrustN = tgt
	End If
End Sub

' ---------------------------------------------------------------------------
' Curves
' ---------------------------------------------------------------------------
Public Sub SweepPointsPerCurve As Int
	Return 25
End Sub

' Returns the number of visible curves for the selected family.
Public Sub SweepCurveCount(multiCurveMode As Int, familyValues As List) As Int
	If multiCurveMode = 0 Then Return 4
	If multiCurveMode >= 1 And multiCurveMode <= 3 Then
		If familyValues.IsInitialized And familyValues.Size > 0 Then Return familyValues.Size
		Return 1
	End If
	Return 1
End Sub

Private Sub SweepFamilyLabel(multiCurveMode As Int, curveIndex As Int, familyValue As Double) As String
	If multiCurveMode = 0 Then
		Select curveIndex
			Case 0: Return "Uniform"
			Case 1: Return "Coleman"
			Case 2: Return "Coleman-FG"
			Case Else: Return "Drees"
		End Select
	Else If multiCurveMode = 1 Then
		If familyValue = Floor(familyValue) Then
			Return Chr(945) & "=" & NumberFormat2(familyValue, 1, 0, 0, False) & Chr(176)
		Else
			Return Chr(945) & "=" & FmtNum(familyValue, 1) & Chr(176)
		End If
	Else If multiCurveMode = 2 Then
		Return "Vz=" & FmtNum(familyValue, 1) & " m/s"
	Else If multiCurveMode = 3 Then
		Return Chr(956) & "z=" & FmtNum(familyValue, 3)
	End If
	Return "Active"
End Sub

' ---------------------------------------------------------------------------
' Palettes: 0 Aero, 1 Colorblind Safe (Okabe-Ito), 2 Print
' ---------------------------------------------------------------------------
Public Sub PlotPaletteCount As Int
	Return 3
End Sub

Public Sub PlotPaletteName(i As Int) As String
	Select i
		Case 1: Return "Colorblind Safe"
		Case 2: Return "Print"
		Case Else: Return "Aero"
	End Select
End Sub

' 0 = Dark, 1 = Light, 2 = Midnight Blue. Midnight behaves like dark with a navy background.
' When never called, the lightTheme boolean passed to DrawSweepPlot decides (Dark/Light).
Public Sub SetPlotThemeIndex(i As Int)
	plotThemeIdx = i
End Sub

Public Sub PlotColor(paletteIndex As Int, curveIndex As Int, lightTheme As Boolean) As Int
	Dim idx As Int = curveIndex Mod 8
	Select paletteIndex
		Case 1
			If lightTheme Then
				Dim a() As Int = Array As Int(0xFF0072B2, 0xFFB06E00, 0xFF009E73, 0xFFD55E00, 0xFF3A9AD0, 0xFFCC79A7, 0xFF7A6A00, 0xFF000000)
				Return a(idx)
			Else
				Dim b() As Int = Array As Int(0xFF56B4E9, 0xFFE69F00, 0xFF009E73, 0xFFF0E442, 0xFFD55E00, 0xFFCC79A7, 0xFF3A8BD0, 0xFFFFFFFF)
				Return b(idx)
			End If
		Case 2
			If lightTheme Then
				Dim c() As Int = Array As Int(0xFF000000, 0xFFB00020, 0xFF0033A0, 0xFF1B7A1B, 0xFF6A1B9A, 0xFF8C4A00, 0xFF006064, 0xFF555555)
				Return c(idx)
			Else
				Dim d() As Int = Array As Int(0xFFFFFFFF, 0xFFFF6B6B, 0xFF6CB2FF, 0xFF5BE37D, 0xFFD39BFF, 0xFFFFB04A, 0xFF4DD0E1, 0xFFBDBDBD)
				Return d(idx)
			End If
		Case Else
			If lightTheme Then
				Dim e() As Int = Array As Int(0xFF007F95, 0xFFB45309, 0xFFC026A3, 0xFF4D7C0F, 0xFF2563EB, 0xFFBE123C, 0xFF7C3AED, 0xFF334155)
				Return e(idx)
			Else
				Dim f() As Int = Array As Int(0xFF00E5FF, 0xFFFFB300, 0xFFFF4DD2, 0xFFA3E635, 0xFF60A5FA, 0xFFFB7185, 0xFFC4B5FD, 0xFFE2E8F0)
				Return f(idx)
			End If
	End Select
End Sub

' Dash pattern per curve index (idx Mod 4 = 0 is solid and handled separately).
Private Sub DashPattern(curveIndex As Int) As Float()
	Select curveIndex Mod 4
		Case 1: Return Array As Float(9dip, 5dip)
		Case 2: Return Array As Float(2dip, 4dip)
		Case Else: Return Array As Float(10dip, 4dip, 2dip, 4dip)
	End Select
End Sub

Private Sub DrawPatterned(cvs As Canvas, x1 As Float, y1 As Float, x2 As Float, y2 As Float, col As Int, stroke As Float, pat() As Float)
	Dim dx As Float = x2 - x1
	Dim dy As Float = y2 - y1
	Dim segLen As Float = Sqrt(dx * dx + dy * dy)
	If segLen < 0.01 Then Return
	Dim pos As Float = 0
	Dim guard As Int = 0
	Do While pos < segLen And guard < 500
		guard = guard + 1
		Dim stepLen As Float = Min(dpRem, segLen - pos)
		If dpIdx Mod 2 = 0 Then
			cvs.DrawLine(x1 + dx * pos / segLen, y1 + dy * pos / segLen, x1 + dx * (pos + stepLen) / segLen, y1 + dy * (pos + stepLen) / segLen, col, stroke)
		End If
		pos = pos + stepLen
		dpRem = dpRem - stepLen
		If dpRem <= 0.001 Then
			dpIdx = (dpIdx + 1) Mod pat.Length
			dpRem = Max(1dip, pat(dpIdx))
		End If
	Loop
End Sub

Private Sub DrawMarker(cvs As Canvas, shape As Int, x As Float, y As Float, r As Float, col As Int)
	Select shape Mod 4
		Case 0
			cvs.DrawCircle(x, y, r, col, True, 1dip)
		Case 1
			Dim rc As Rect
			rc.Initialize(x - r, y - r, x + r, y + r)
			cvs.DrawRect(rc, col, True, 1dip)
		Case 2
			Dim tp As Path
			tp.Initialize(x, y - r * 1.2)
			tp.LineTo(x + r * 1.1, y + r * 0.9)
			tp.LineTo(x - r * 1.1, y + r * 0.9)
			tp.LineTo(x, y - r * 1.2)
			cvs.DrawPath(tp, col, True, 1dip)
		Case Else
			Dim dp As Path
			dp.Initialize(x, y - r * 1.3)
			dp.LineTo(x + r * 1.1, y)
			dp.LineTo(x, y + r * 1.3)
			dp.LineTo(x - r * 1.1, y)
			dp.LineTo(x, y - r * 1.3)
			cvs.DrawPath(dp, col, True, 1dip)
	End Select
End Sub

' ---------------------------------------------------------------------------
' Number formatting and nice ticks
' ---------------------------------------------------------------------------
' Fixed-decimal formatting that never prints negative zero.
Private Sub FmtNum(v As Double, dec As Int) As String
	dec = Max(0, Min(8, dec))
	Dim s As String = NumberFormat2(v, 1, dec, dec, False)
	If s.StartsWith("-") Then
		Dim allZero As Boolean = True
		For i = 1 To s.Length - 1
			Dim ch As String = s.SubString2(i, i + 1)
			If ch <> "0" And ch <> "." And ch <> "," Then allZero = False
		Next
		If allZero Then s = s.SubString(1)
	End If
	Return s
End Sub

' False for NaN / infinity / sentinel values.
Private Sub IsNum(v As Double) As Boolean
	Return v > -1.0e300 And v < 1.0e300
End Sub

' 1-2-5 step for the requested raw step size.
Private Sub NiceStep(raw As Double) As Double
	If raw <= 0 Then Return 1
	Dim mag As Double = Power(10, Floor(Logarithm(raw, 10)))
	Dim f As Double = raw / mag
	If f <= 1.5 Then
		Return mag
	Else If f <= 3.5 Then
		Return 2 * mag
	Else If f <= 7.5 Then
		Return 5 * mag
	End If
	Return 10 * mag
End Sub

Private Sub StepDecimals(stepV As Double) As Int
	Return Max(0, -Floor(Logarithm(stepV, 10) + 0.000001))
End Sub

Private Sub SuperInt(e As Int) As String
	Dim digs As String = Chr(8304) & Chr(185) & Chr(178) & Chr(179) & Chr(8308) & Chr(8309) & Chr(8310) & Chr(8311) & Chr(8312) & Chr(8313)
	Dim s As String = NumberFormat2(Abs(e), 1, 0, 0, False)
	Dim sb As StringBuilder
	sb.Initialize
	If e < 0 Then sb.Append(Chr(8315))
	For i = 0 To s.Length - 1
		Dim dg As Int = s.SubString2(i, i + 1)
		sb.Append(digs.SubString2(dg, dg + 1))
	Next
	Return sb.ToString
End Sub

' ---------------------------------------------------------------------------
' Dataset
' ---------------------------------------------------------------------------
' Builds the single authoritative dataset used by plot, table and CSV (curve-major, 25 points per curve).
' trimMode: none | coll_all | rpm_all | coll_hover | rpm_hover (see SweepTrimModeKeys).
Public Sub BuildSweepSamples( _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	paramKey As String, _
	multiCurveMode As Int, _
	maxMu As Double, _
	familyValues As List, _
	trimMode As String _
) As List
	Dim samples As List
	samples.Initialize
	Dim nPoints As Int = SweepPointsPerCurve
	Dim nCurves As Int = SweepCurveCount(multiCurveMode, familyValues)
	Dim sigma As Double = GeomSigma(geom)
	Dim area As Double = GeomArea(geom)

	' Baseline operating point of the active condition.
	Dim live As RotorResults = zBETEngine.Calculate(geom, cond)
	Dim baseRPM As Double = cond.RPM
	Dim baseColl As Double = cond.CollectiveDeg
	If live.SolutionValid Then
		baseRPM = live.TrimmedRPM
		baseColl = live.TrimmedCollectiveDeg
	End If

	' Thrust target: Conditions target (CT or T); fall back to current thrust.
	Dim pair As String = cond.OperatingPair
	Dim collKind As String = "thrust"
	Dim collTgt As Double = 0
	If pair.Contains("ct") And cond.TargetCT > 0 Then
		collKind = "ct"
		collTgt = cond.TargetCT
	Else If pair.Contains("thrust") And cond.TargetThrustN > 0 Then
		collKind = "thrust"
		collTgt = cond.TargetThrustN
	Else If live.SolutionValid Then
		collKind = "thrust"
		collTgt = live.ThrustN
	End If
	' RPM trim: prefer a dimensional (thrust) target; CT-only is non-unique when collective is fixed.
	Dim rpmKind As String = collKind
	Dim rpmTgt As Double = collTgt
	If collKind = "ct" And live.SolutionValid And live.CT > 0 Then
		rpmKind = "thrust"
		rpmTgt = collTgt * live.ThrustN / live.CT
	End If
	Dim trimOK As Boolean = collTgt > 0

	Dim isHover As Boolean = (trimMode = "coll_hover" Or trimMode = "rpm_hover")
	Dim rpmTrim As Boolean = (trimMode = "rpm_all" Or trimMode = "rpm_hover")
	Dim fixedValid As Boolean = True
	Dim fixedRPM As Double = baseRPM
	Dim fixedColl As Double = baseColl
	If isHover Then
		fixedValid = False
		If trimOK Then
			Dim hc As FlightCondition = zBETEngine.CloneCondition(cond)
			hc.HorizontalMode = "mu"
			hc.HorizontalValue = 0.0
			hc.AxialMode = "muz"
			hc.AxialValue = 0.0
			If rpmTrim Then
				ApplyTrimPair(hc, True, rpmKind, rpmTgt, baseRPM, baseColl)
			Else
				ApplyTrimPair(hc, False, collKind, collTgt, baseRPM, baseColl)
			End If
			Dim hs() As Object = zBETEngine.ResolveOperatingState(geom, hc)
			Dim hStatus As String = hs(2)
			If hStatus = "VALID" Then
				Dim sh As FlightCondition = hs(1)
				fixedRPM = sh.RPM
				fixedColl = sh.CollectiveDeg
				fixedValid = True
			End If
		End If
	End If

	For curveIndex = 0 To nCurves - 1
		Dim familyValue As Double = 0.0
		If multiCurveMode >= 1 And multiCurveMode <= 3 And familyValues.IsInitialized And familyValues.Size > curveIndex Then
			familyValue = familyValues.Get(curveIndex)
		End If
		Dim curveLabel As String = SweepFamilyLabel(multiCurveMode, curveIndex, familyValue)
		For pointIndex = 0 To nPoints - 1
			Dim tempCond As FlightCondition = zBETEngine.CloneCondition(cond)
			Dim muValue As Double = pointIndex * maxMu / (nPoints - 1)
			tempCond.HorizontalMode = "mu"
			tempCond.HorizontalValue = muValue

			If multiCurveMode = 0 Then
				Select curveIndex
					Case 0: tempCond.InflowModel = "uniform"
					Case 1: tempCond.InflowModel = "coleman_simple"
					Case 2: tempCond.InflowModel = "coleman_feingold"
					Case 3: tempCond.InflowModel = "drees"
				End Select
			Else If multiCurveMode = 1 Then
				tempCond.AxialMode = "alpha"
				tempCond.AxialValue = familyValue
			Else If multiCurveMode = 2 Then
				tempCond.AxialMode = "vz"
				tempCond.AxialValue = familyValue
			Else If multiCurveMode = 3 Then
				tempCond.AxialMode = "muz"
				tempCond.AxialValue = familyValue
			End If

			Dim point As SweepPoint
			point.Initialize
			point.CurveLabel = curveLabel
			point.Mu = muValue
			point.AxialMode = tempCond.AxialMode
			point.AxialValue = tempCond.AxialValue
			point.InflowModel = tempCond.InflowModel

			Dim skip As Boolean = False
			Select trimMode
				Case "coll_all"
					If trimOK Then ApplyTrimPair(tempCond, False, collKind, collTgt, baseRPM, baseColl) Else skip = True
				Case "rpm_all"
					If trimOK Then ApplyTrimPair(tempCond, True, rpmKind, rpmTgt, baseRPM, baseColl) Else skip = True
				Case "coll_hover", "rpm_hover"
					If fixedValid Then
						tempCond.OperatingPair = "rpm_collective"
						tempCond.RPM = fixedRPM
						tempCond.CollectiveDeg = fixedColl
					Else
						skip = True
					End If
				Case Else
					If live.SolutionValid Then
						tempCond.OperatingPair = "rpm_collective"
						tempCond.RPM = baseRPM
						tempCond.CollectiveDeg = baseColl
					End If
			End Select
			If skip Then
				point.Valid = False
				samples.Add(point)
				Continue
			End If

			Dim result As RotorResults = zBETEngine.Calculate(geom, tempCond)
			point.Valid = result.SolutionValid
			If result.SolutionValid Then
				point.Vx = result.OperatingVx
				point.MuZ = result.OperatingMuZ
				point.Value = ExtractParamValueS(result, paramKey, sigma, area)
				point.MuLam = zBETEngine.DerivedMuOverLambda(result)
				point.RPM = result.TrimmedRPM
				point.CollectiveDeg = result.TrimmedCollectiveDeg
				point.CT = result.CT
				point.ThrustN = result.ThrustN
				point.TorqueNm = result.TorqueNm
				point.PowerKW = result.PowerShaftW / 1000.0
				Dim vtip3 As Double = result.TipSpeed * result.TipSpeed * result.TipSpeed
				Dim pDenom As Double = result.DensityRho * area * vtip3 / 1000.0
				point.PiKW = result.CQi * pDenom
				point.P0KW = result.CQ0 * pDenom
				point.PparKW = result.CPair * pDenom
				point.CQ = result.CQ
				point.CP = result.CQ ' In rotorcraft conventions CQ = CP
				point.CH = result.CH
				point.FoM = result.FoM
				point.MachAdv = result.AdvancingTipMach
				point.MachRet = (1.0 - result.OperatingMu) * result.TipSpeed / Max(1.0, result.SpeedOfSound)
				point.LambdaI = result.InflowLambdaI
				point.Vz = result.OperatingVz
			End If
			samples.Add(point)
		Next
	Next
	Return samples
End Sub

' ---------------------------------------------------------------------------
' Readout / table helpers
' ---------------------------------------------------------------------------
Private Sub PointX(p As SweepPoint, xAxisMode As Int) As Double
	If xAxisMode = 1 Then Return p.Vx
	If xAxisMode = 2 Then Return p.MuLam
	Return p.Mu
End Sub

' Point usable on the current X axis: valid solution, finite value, finite (and for mu/lambda, non-negative) x.
Private Sub XOk(p As SweepPoint, xAxisMode As Int) As Boolean
	If p.Valid = False Then Return False
	If p.Mu > 0.6001 Then Return False ' engine clamps mu to +-0.60 (zBET.py); points beyond are not a solution
	If IsNum(p.Value) = False Then Return False
	Dim x As Double = PointX(p, xAxisMode)
	If IsNum(x) = False Then Return False
	If xAxisMode = 2 And x < 0 Then Return False
	Return True
End Sub

' Sample indices of one curve that are usable on the X axis, sorted by ascending x.
Private Sub CurveOrder(samples As List, curveIndex As Int, xAxisMode As Int) As List
	Dim n As Int = SweepPointsPerCurve
	Dim ord As List
	ord.Initialize
	For i = 0 To n - 1
		Dim idx As Int = curveIndex * n + i
		If idx >= samples.Size Then Exit
		Dim p As SweepPoint = samples.Get(idx)
		If XOk(p, xAxisMode) = False Then Continue
		Dim x As Double = PointX(p, xAxisMode)
		Dim pos As Int = ord.Size
		Do While pos > 0
			Dim q As SweepPoint = samples.Get(ord.Get(pos - 1))
			If PointX(q, xAxisMode) <= x Then Exit
			pos = pos - 1
		Loop
		ord.InsertAt(pos, idx)
	Next
	Return ord
End Sub

' Index (into samples) of the valid point of the given curve closest to xValue; -1 if none.
Public Sub SweepNearestIndex(samples As List, curveIndex As Int, xAxisMode As Int, xValue As Double) As Int
	Dim n As Int = SweepPointsPerCurve
	Dim best As Int = -1
	Dim bestD As Double = 1.0e300
	For i = 0 To n - 1
		Dim idx As Int = curveIndex * n + i
		If idx >= samples.Size Then Exit
		Dim p As SweepPoint = samples.Get(idx)
		If XOk(p, xAxisMode) Then
			Dim dd As Double = Abs(PointX(p, xAxisMode) - xValue)
			If dd < bestD Then
				bestD = dd
				best = idx
			End If
		End If
	Next
	Return best
End Sub

' Multi-line text: header with x value, then one line per curve with the nearest point value.
Public Sub SweepReadout(samples As List, paramKey As String, xAxisMode As Int, xValue As Double, extraPrecision As Int) As String
	Dim n As Int = SweepPointsPerCurve
	Dim nCurves As Int = Max(1, samples.Size / n)
	Dim dig As Int = SweepParamDigits(paramKey) + Max(0, Min(1, extraPrecision))
	Dim xKey As String = "Mu"
	Dim xDig As Int = 3
	If xAxisMode = 1 Then
		xKey = "Vx"
		xDig = 1
	Else If xAxisMode = 2 Then
		xKey = "muLam"
		xDig = 2
	End If
	Dim unit As String = SweepParamUnit(paramKey)
	If unit = Chr(8211) Then unit = "" Else unit = " " & unit
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append(PrettySymbol(SweepParamSymbol(xKey))).Append(" = ").Append(FmtNum(xValue, xDig))
	Dim xu As String = SweepParamUnit(xKey)
	If xu <> Chr(8211) Then sb.Append(" ").Append(xu)
	For c = 0 To nCurves - 1
		Dim ix As Int = SweepNearestIndex(samples, c, xAxisMode, xValue)
		Dim lbl As String = ""
		If c * n < samples.Size Then
			Dim p0 As SweepPoint = samples.Get(c * n)
			lbl = p0.CurveLabel
		End If
		sb.Append(CRLF).Append(lbl).Append(": ")
		If ix < 0 Then
			sb.Append(Chr(8211))
		Else
			Dim p As SweepPoint = samples.Get(ix)
			sb.Append(FmtNum(p.Value, dig)).Append(unit)
		End If
	Next
	Return sb.ToString
End Sub

' Number of leading x columns in BuildSweepTableRows: 1 (mu) or 2 (mu, Vx of curve 0).
Public Sub SweepTableXCols(xAxisMode As Int) As Int
	If xAxisMode >= 1 Then Return 2
	Return 1
End Sub

' WIDE table: List of String() rows. Row 0 = headers (with units). One row per x grid point.
' Columns: mu [, Vx of first curve when xAxisMode=1], then one column per curve.
' forCsv: plain "_" symbols, "." decimals, "-" for n/a and dimensionless.
Public Sub BuildSweepTableRows(samples As List, paramKey As String, xAxisMode As Int, extraPrecision As Int, forCsv As Boolean) As List
	Dim rows As List
	rows.Initialize
	Dim n As Int = SweepPointsPerCurve
	Dim nCurves As Int = Max(1, samples.Size / n)
	Dim xc As Int = SweepTableXCols(xAxisMode)
	Dim dig As Int = SweepParamDigits(paramKey) + Max(0, Min(1, extraPrecision))
	Dim na As String = Chr(8211)
	If forCsv Then na = "-"
	Dim hdr(xc + nCurves) As String
	hdr(0) = SymText("Mu", forCsv) & HdrUnit("Mu", na, forCsv)
	If xc = 2 Then
		Dim x2Key As String = "Vx"
		If xAxisMode = 2 Then x2Key = "muLam"
		hdr(1) = SymText(x2Key, forCsv) & HdrUnit(x2Key, na, forCsv)
	End If
	For c = 0 To nCurves - 1
		Dim lbl As String = ""
		If c * n < samples.Size Then
			Dim p0 As SweepPoint = samples.Get(c * n)
			lbl = p0.CurveLabel
		End If
		hdr(xc + c) = lbl & " " & SymText(paramKey, forCsv) & HdrUnit(paramKey, na, forCsv)
	Next
	rows.Add(hdr)
	For i = 0 To n - 1
		Dim row(xc + nCurves) As String
		Dim pf As SweepPoint = samples.Get(i)
		row(0) = TblNum(pf.Mu, 3, forCsv)
		If xc = 2 Then
			If xAxisMode = 2 Then
				If XOk(pf, 2) Then row(1) = TblNum(pf.MuLam, 3, forCsv) Else row(1) = na
			Else If pf.Valid Then
				row(1) = TblNum(pf.Vx, 1, forCsv)
			Else
				row(1) = na
			End If
		End If
		For c = 0 To nCurves - 1
			Dim idx As Int = c * n + i
			row(xc + c) = na
			If idx < samples.Size Then
				Dim p As SweepPoint = samples.Get(idx)
				If p.Valid And IsNum(p.Value) Then row(xc + c) = TblNum(p.Value, dig, forCsv)
			End If
		Next
		rows.Add(row)
	Next
	Return rows
End Sub

' True when (x, v) lies on one of the curves (linear interpolation, tolerance 1% of the data span).
Private Sub LiveOnCurve(samples As List, nPoints As Int, nCurves As Int, xAxisMode As Int, x As Double, v As Double, yMin As Double, yMax As Double) As Boolean
	Dim span As Double = yMax - yMin
	If span < 1.0e-12 Then span = Max(1.0e-9, Abs(v) * 0.01)
	Dim tol As Double = 0.01 * span
	For c = 0 To nCurves - 1
		For i = 0 To nPoints - 2
			Dim p1 As SweepPoint = samples.Get(c * nPoints + i)
			Dim p2 As SweepPoint = samples.Get(c * nPoints + i + 1)
			If XOk(p1, xAxisMode) And XOk(p2, xAxisMode) Then
				Dim x1 As Double = PointX(p1, xAxisMode)
				Dim x2 As Double = PointX(p2, xAxisMode)
				If x >= Min(x1, x2) - 1.0e-9 And x <= Max(x1, x2) + 1.0e-9 Then
					Dim t As Double = 0
					If Abs(x2 - x1) > 1.0e-12 Then t = (x - x1) / (x2 - x1)
					If Abs(p1.Value + t * (p2.Value - p1.Value) - v) <= tol Then Return True
				End If
			End If
		Next
	Next
	Return False
End Sub

Private Sub SymText(key As String, plain As Boolean) As String
	If plain Then Return SweepParamSymbol(key)
	Return PrettySymbol(SweepParamSymbol(key))
End Sub

' Header unit suffix: CSV always carries [unit] ("-" if dimensionless); on screen dimensionless gets none.
Private Sub HdrUnit(key As String, dimless As String, forCsv As Boolean) As String
	If forCsv = False And SweepParamUnit(key) = Chr(8211) Then Return ""
	Return " [" & UnitText(key, dimless) & "]"
End Sub

Private Sub UnitText(key As String, dimless As String) As String
	Dim u As String = SweepParamUnit(key)
	If u = Chr(8211) Then Return dimless
	Return u
End Sub

Private Sub TblNum(v As Double, dec As Int, forCsv As Boolean) As String
	Dim s As String = FmtNum(v, dec)
	If forCsv Then s = s.Replace(",", ".")
	Return s
End Sub

' ---------------------------------------------------------------------------
' Plot
' ---------------------------------------------------------------------------
' Renders the dataset. xAxisMode: 0=mu, 1=Vx [m/s]. paletteIndex: 0..PlotPaletteCount-1.
' crossX: crosshair x (axis units); pass -1 (or any value outside 0..xMax) for none.
' Tip: at narrow widths give the plot a tall aspect (height >= ~0.95 * width) for a larger plot area.
Public Sub DrawSweepPlot( _
	widthPx As Int, _
	heightPx As Int, _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	paramKey As String, _
	multiCurveMode As Int, _
	maxMu As Double, _
	xAxisMode As Int, _
	lightTheme As Boolean, _
	extraPrecision As Int, _
	samples As List, _
	paletteIndex As Int, _
	crossX As Double _
) As Bitmap
	Dim bmp As Bitmap
	bmp.InitializeMutable(widthPx, heightPx)
	Dim cvs As Canvas
	cvs.Initialize2(bmp)

	Dim colBg As Int
	Dim colGrid As Int
	Dim colText As Int
	Dim colCurrent As Int
	Dim colAccent As Int
	Dim isSepia As Boolean = (plotThemeIdx = 3)
	Dim isMid As Boolean = (plotThemeIdx = 2)
	If plotThemeIdx = 1 Or isSepia Then lightTheme = True
	If plotThemeIdx = 0 Or isMid Then lightTheme = False
	If isSepia Then
		colBg = 0xFFFAF6EE
		colGrid = 0xFFDDD2C0
		colText = 0xFF2D2319
		colCurrent = 0xFF8C5A2B
		colAccent = 0xFF8C5A2B
	Else If lightTheme Then
		colBg = 0xFFFFFFFF
		colGrid = 0xFFD9E1EA
		colText = 0xFF344054
		colCurrent = 0xFFAA5A00
		colAccent = 0xFF007F95
	Else
		colBg = 0xFF10141C
		colGrid = 0xFF2A3544
		colText = 0xFFB4BFCE
		colCurrent = 0xFFFFB300
		colAccent = 0xFF00E5FF
		If isMid Then
			colBg = 0xFF0D1B2A
			colGrid = 0xFF2A4361
			colText = 0xFFB9CBE0
		End If
	End If
	cvs.DrawColor(colBg)

	Dim wDip As Float = widthPx / 1dip
	Dim fs As Float = 12
	If wDip >= 400 Then fs = 13
	If wDip >= 600 Then fs = 14
	Dim lineH As Float = (fs + 6) * 1dip
	Dim nPoints As Int = SweepPointsPerCurve
	Dim nCurves As Int = Max(1, samples.Size / nPoints)
	Dim padX As Float = 8dip
	If wDip < 400 Then padX = 6dip

	' --- Legend layout (own band above the plot) ---
	Dim itemWidths(nCurves) As Float
	Dim totalLegW As Float = padX
	For i = 0 To nCurves - 1
		Dim lp As SweepPoint = samples.Get(Min(samples.Size - 1, i * nPoints))
		itemWidths(i) = 28dip + cvs.MeasureStringWidth(lp.CurveLabel, Typeface.DEFAULT_BOLD, fs) + 12dip
		totalLegW = totalLegW + itemWidths(i)
	Next
	Dim fitsOneLine As Boolean = (totalLegW <= widthPx - padX)
	Dim maxOnRow0 As Int = Ceil(nCurves / 2.0)
	Dim legX(nCurves) As Float
	Dim legRow(nCurves) As Int
	Dim curX As Float = padX
	Dim curRow As Int = 0
	Dim countOnRow0 As Int = 0
	For i = 0 To nCurves - 1
		If (fitsOneLine = False And curRow = 0 And countOnRow0 >= maxOnRow0) Or (curX > padX And curX + itemWidths(i) > widthPx - padX) Then
			curRow = curRow + 1
			curX = padX
		End If
		legX(i) = curX
		legRow(i) = curRow
		curX = curX + itemWidths(i)
		If curRow = 0 Then countOnRow0 = countOnRow0 + 1
	Next
	Dim legendRows As Int = curRow + 1

	' --- Y data range ---
	Dim sigma As Double = GeomSigma(geom)
	Dim yMin As Double = 1.0e99
	Dim yMax As Double = -1.0e99
	Dim xMax As Double = 0.0
	Dim validCount As Int = 0
	For sampleIndex = 0 To samples.Size - 1
		Dim sample As SweepPoint = samples.Get(sampleIndex)
		If XOk(sample, xAxisMode) Then
			validCount = validCount + 1
			If sample.Value < yMin Then yMin = sample.Value
			If sample.Value > yMax Then yMax = sample.Value
			Dim xv As Double = PointX(sample, xAxisMode)
			If xv > xMax Then xMax = xv
		End If
	Next
	Dim liveRes As RotorResults = zBETEngine.Calculate(geom, cond)
	Dim liveValid As Boolean = liveRes.SolutionValid And liveRes.OperatingMu >= 0 And liveRes.OperatingMu <= maxMu
	Dim liveValue As Double = 0.0
	Dim liveX As Double = 0.0
	If liveValid Then
		liveValue = ExtractParamValueS(liveRes, paramKey, sigma, GeomArea(geom))
		liveX = liveRes.OperatingMu
		If xAxisMode = 1 Then liveX = liveRes.OperatingVx
		If xAxisMode = 2 Then liveX = zBETEngine.DerivedMuOverLambda(liveRes)
		If IsNum(liveX) = False Or IsNum(liveValue) = False Or liveX < 0 Then liveValid = False
		' The marker uses the live (conditions) trim; the curves use the sweep trim mode. Show the marker
		' only when it lies on a curve, so it never floats off the data it is compared with.
		If liveValid Then liveValid = LiveOnCurve(samples, nPoints, nCurves, xAxisMode, liveX, liveValue, yMin, yMax)
	End If
	If liveValid Then
		If liveValue < yMin Then yMin = liveValue
		If liveValue > yMax Then yMax = liveValue
		If liveX > xMax Then xMax = liveX
	End If
	If validCount = 0 And liveValid = False Then
		cvs.DrawText("No valid operating points in this sweep.", widthPx * 0.5, heightPx * 0.5, Typeface.DEFAULT_BOLD, fs, colText, "CENTER")
		Return bmp
	End If
	If xAxisMode = 0 Then xMax = maxMu
	If xMax <= 1.0e-12 Then xMax = 1.0
	' Vx and mu/lambda axes end at the largest valid finite point, rounded up to a nice step (no saturation).
	If xAxisMode <> 0 Then
		Dim xnStep As Double = NiceStep(xMax / 4)
		xMax = Ceil(xMax / xnStep - 0.0001) * xnStep
	End If

	' --- Y scaling and nice ticks ---
	Dim m As Double = Max(Abs(yMin), Abs(yMax))
	Dim sExp As Int = 0
	If m > 0 And m < 0.01 Then sExp = Floor(Logarithm(m, 10))
	If m >= 100000 Then sExp = Floor(Logarithm(m, 10))
	Dim yScale As Double = Power(10, sExp)
	Dim ys0 As Double = yMin / yScale
	Dim ys1 As Double = yMax / yScale
	If ys1 - ys0 < 0.000000001 * Max(1, Abs(ys1)) Then
		Dim padFlat As Double = Max(0.1, Abs(ys1) * 0.1)
		ys0 = ys0 - padFlat
		ys1 = ys1 + padFlat
	Else
		Dim yPad As Double = 0.04 * (ys1 - ys0)
		ys0 = ys0 - yPad
		ys1 = ys1 + yPad
	End If
	Dim yStep As Double = NiceStep((ys1 - ys0) / 5)
	Dim yLo As Double = Floor(ys0 / yStep) * yStep
	Dim yHi As Double = Ceil(ys1 / yStep) * yStep
	If yHi - yLo < yStep Then yHi = yLo + yStep
	Dim yTicks As Int = Round((yHi - yLo) / yStep)
	Dim yDec As Int = StepDecimals(yStep) + Max(0, Min(1, extraPrecision))

	' --- Axis titles ---
	Dim sy As String = PrettySymbol(SweepParamSymbol(paramKey))
	Dim unitY As String = SweepParamUnit(paramKey)
	Dim unitPart As String = ""
	If sExp <> 0 Then
		unitPart = Chr(215) & "10" & SuperInt(sExp)
		If unitY <> Chr(8211) Then unitPart = unitPart & " " & unitY
	Else If unitY <> Chr(8211) Then
		unitPart = unitY
	End If
	Dim tail As String = ""
	If unitPart <> "" Then tail = " [" & unitPart & "]"
	Dim yTitle As String = SweepParamFullName(paramKey) & " " & sy & tail
	If cvs.MeasureStringWidth(yTitle, Typeface.DEFAULT_BOLD, fs) > widthPx - 2 * padX Then yTitle = SweepParamShortName(paramKey) & " " & sy & tail
	If cvs.MeasureStringWidth(yTitle, Typeface.DEFAULT_BOLD, fs) > widthPx - 2 * padX Then yTitle = sy & tail
	Dim xKey As String = "Mu"
	If xAxisMode = 1 Then xKey = "Vx"
	If xAxisMode = 2 Then xKey = "muLam"
	Dim xu As String = SweepParamUnit(xKey)
	Dim xTail As String = ""
	If xu <> Chr(8211) Then xTail = " [" & xu & "]"
	Dim xTitle As String = SweepParamFullName(xKey) & " " & PrettySymbol(SweepParamSymbol(xKey)) & xTail

	' --- Margins ---
	Dim mLeft As Float = 30dip
	For k = 0 To yTicks
		Dim tw As Float = cvs.MeasureStringWidth(FmtNum(yLo + k * yStep, yDec), Typeface.MONOSPACE, fs)
		mLeft = Max(mLeft, tw + 10dip)
	Next
	Dim mRight As Float = 14dip
	If wDip < 400 Then mRight = 10dip
	Dim mTop As Float = lineH * 2.3 + 8dip
	Dim legGapTop As Float = lineH * 2.2 + 18dip
	Dim mBottom As Float = legGapTop + legendRows * lineH + 8dip
	Dim plotW As Float = widthPx - mLeft - mRight
	Dim plotH As Float = heightPx - mTop - mBottom
	If plotW <= 10 Or plotH <= 10 Then Return bmp

	' --- Title (top) and legend (below the X-axis title) ---
	DrawRichText(cvs, yTitle, padX, 22dip, Typeface.DEFAULT_BOLD, fs, colText, "LEFT")
	For i = 0 To nCurves - 1
		Dim ly As Float = mTop + plotH + legGapTop + legRow(i) * lineH + lineH * 0.5
		Dim lc As Int = PlotColor(paletteIndex, i, lightTheme)
		Dim lpt As SweepPoint = samples.Get(Min(samples.Size - 1, i * nPoints))
		cvs.DrawLine(legX(i), ly, legX(i) + 22dip, ly, lc, 2.5dip)
		cvs.DrawText(lpt.CurveLabel, legX(i) + 26dip, ly + fs * 0.35 * 1dip, Typeface.DEFAULT_BOLD, fs, lc, "LEFT")
	Next

	' --- Grid + tick labels ---
	Dim plotRect As Rect
	plotRect.Initialize(mLeft, mTop, mLeft + plotW, mTop + plotH)
	LastPlotLeft = mLeft
	LastPlotW = plotW
	LastXMax = xMax
	cvs.DrawRect(plotRect, colGrid, False, 1.5dip)
	For k = 0 To yTicks
		Dim tv As Double = yLo + k * yStep
		Dim gy As Float = mTop + plotH - (tv - yLo) / (yHi - yLo) * plotH
		cvs.DrawLine(mLeft, gy, mLeft + plotW, gy, colGrid, 1dip)
		cvs.DrawText(FmtNum(tv, yDec), mLeft - 5dip, gy + fs * 0.35 * 1dip, Typeface.MONOSPACE, fs, colText, "RIGHT")
	Next
	Dim xTarget As Double = 5
	If wDip < 400 Then xTarget = 4
	Dim xStep As Double = NiceStep(xMax / xTarget)
	Dim xDec As Int = StepDecimals(xStep)
	' Adaptive ticks: widen the step until the widest label fits in 0.8 x the tick spacing.
	Do While xTarget > 2
		Dim lblW As Float = cvs.MeasureStringWidth(FmtNum(xMax, xDec), Typeface.MONOSPACE, fs)
		If lblW <= 0.8 * (xStep / xMax * plotW) Then Exit
		xTarget = xTarget - 1
		xStep = NiceStep(xMax / xTarget)
		xDec = StepDecimals(xStep)
	Loop
	Dim xTickMax As Int = Floor(xMax / xStep + 0.0001)
	For k = 0 To xTickMax
		Dim gx As Float = mLeft + (k * xStep) / xMax * plotW
		cvs.DrawLine(gx, mTop, gx, mTop + plotH, colGrid, 1dip)
		Dim ax As String = "CENTER"
		Dim tickTxt As String = FmtNum(k * xStep, xDec)
		Dim tickX As Float = gx
		If k = 0 Then
			ax = "LEFT"
		Else
			' keep the label inside the bitmap (last tick sits near the right edge)
			Dim halfW As Float = cvs.MeasureStringWidth(tickTxt, Typeface.MONOSPACE, fs) / 2 + 2dip
			tickX = Max(halfW, Min(gx, widthPx - halfW))
		End If
		cvs.DrawText(tickTxt, tickX, mTop + plotH + lineH * 0.85, Typeface.MONOSPACE, fs, colText, ax)
	Next
	DrawRichText(cvs, xTitle, mLeft + plotW * 0.5, mTop + plotH + lineH * 1.85, Typeface.DEFAULT_BOLD, fs, colText, "CENTER")

	' --- Curves: distinct hue + dash pattern + marker every 4 points ---
	For curveIndex = 0 To nCurves - 1
		Dim curveColor As Int = PlotColor(paletteIndex, curveIndex, lightTheme)
		Dim stroke As Float = 2.4dip
		Dim pat() As Float = DashPattern(curveIndex)
		dpIdx = 0
		dpRem = pat(0)
		Dim ord As List = CurveOrder(samples, curveIndex, xAxisMode)
		For oi = 0 To ord.Size - 2
			Dim i1 As Int = ord.Get(oi)
			Dim i2 As Int = ord.Get(oi + 1)
			Dim p1 As SweepPoint = samples.Get(i1)
			Dim p2 As SweepPoint = samples.Get(i2)
			If xAxisMode = 2 Or i2 - i1 = 1 Then
				Dim x1 As Float = mLeft + PointX(p1, xAxisMode) / xMax * plotW
				Dim x2 As Float = mLeft + PointX(p2, xAxisMode) / xMax * plotW
				Dim y1 As Float = mTop + plotH - (p1.Value / yScale - yLo) / (yHi - yLo) * plotH
				Dim y2 As Float = mTop + plotH - (p2.Value / yScale - yLo) / (yHi - yLo) * plotH
				cvs.DrawLine(x1, y1, x2, y2, curveColor, stroke)
			Else
				dpIdx = 0
				dpRem = pat(0)
			End If
		Next
	Next

	' --- Crosshair ---
	If IsNum(crossX) And crossX >= 0 And crossX <= xMax Then
		Dim cx As Float = mLeft + crossX / xMax * plotW
		Dim cdash() As Float = Array As Float(6dip, 4dip)
		dpIdx = 0
		dpRem = cdash(0)
		DrawPatterned(cvs, cx, mTop, cx, mTop + plotH, colText, 1.2dip, cdash)
		For curveIndex = 0 To nCurves - 1
			Dim ni As Int = SweepNearestIndex(samples, curveIndex, xAxisMode, crossX)
			If ni >= 0 Then
				Dim pn As SweepPoint = samples.Get(ni)
				Dim nx As Float = mLeft + PointX(pn, xAxisMode) / xMax * plotW
				Dim ny As Float = mTop + plotH - (pn.Value / yScale - yLo) / (yHi - yLo) * plotH
				Dim cc As Int = PlotColor(paletteIndex, curveIndex, lightTheme)
				cvs.DrawCircle(nx, ny, 6dip, colBg, True, 1dip)
				cvs.DrawCircle(nx, ny, 6dip, cc, False, 2dip)
				cvs.DrawCircle(nx, ny, 2.5dip, cc, True, 1dip)
				Dim vTxt As String = FmtNum(pn.Value / yScale, yDec)
				Dim vw As Float = cvs.MeasureStringWidth(vTxt, Typeface.MONOSPACE, fs - 1)
				Dim vx As Float = nx + 9dip
				Dim vAlign As String = "LEFT"
				If vx + vw > mLeft + plotW Then
					vx = nx - 9dip
					vAlign = "RIGHT"
				End If
				Dim vy As Float = Max(mTop + fs * 1dip, Min(mTop + plotH - 2dip, ny - 7dip))
				cvs.DrawText(vTxt, vx + 1dip, vy + 1dip, Typeface.MONOSPACE, fs - 1, colBg, vAlign)
				cvs.DrawText(vTxt, vx, vy, Typeface.MONOSPACE, fs - 1, cc, vAlign)
			End If
		Next
	End If

	' --- Active operating point ---
	If liveValid Then
		Dim liveCx As Float = mLeft + liveX / xMax * plotW
		Dim liveCy As Float = mTop + plotH - (liveValue / yScale - yLo) / (yHi - yLo) * plotH
		cvs.DrawCircle(liveCx, liveCy, 5dip, colCurrent, True, 1dip)
		cvs.DrawCircle(liveCx, liveCy, 9dip, colCurrent, False, 1.5dip)
	End If
	Return bmp
End Sub


Public Sub BuildFullSweepCsv(geom As RotorGeometry, cond As FlightCondition, samples As List, extraPrecision As Int) As String
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append("# RotorCalculator Full Engineering Sweep Export").Append(CRLF)
	sb.Append("# Generated: ").Append(DateTime.Date(DateTime.Now)).Append(" ").Append(DateTime.Time(DateTime.Now)).Append(CRLF)
	sb.Append("#").Append(CRLF)
	sb.Append("# --- INPUT ROTOR GEOMETRY ---").Append(CRLF)
	sb.Append("# Rotor Name: ").Append(geom.Name).Append(CRLF)
	sb.Append("# Radius R [m]: ").Append(geom.Radius).Append(CRLF)
	sb.Append("# Blade Count Nb: ").Append(geom.NBlades).Append(CRLF)
	sb.Append("# Root Cutout (r/R): ").Append(geom.RootCutout).Append(CRLF)
	sb.Append("# Root Chord c0 [m]: ").Append(geom.ChordRoot).Append(CRLF)
	sb.Append("# Tip Chord c_tip [m]: ").Append(geom.ChordTip).Append(CRLF)
	sb.Append("# Reference Solidity sigma_REF: ").Append(geom.SigmaRef).Append(CRLF)
	sb.Append("# Linear Twist Root [deg]: ").Append(geom.ThetaRoot * 180.0 / cPI).Append(CRLF)
	sb.Append("# Linear Twist Tip [deg]: ").Append(geom.ThetaTip * 180.0 / cPI).Append(CRLF)
	sb.Append("# Lift Curve Slope a0 [1/rad]: ").Append(geom.LiftSlope0).Append(CRLF)
	sb.Append("# Profile Drag Cd0: ").Append(geom.Cd0).Append(CRLF)
	sb.Append("# Tip Loss Mode: ").Append(geom.TipLossMode).Append(CRLF)
	sb.Append("# Tip Loss Factor B: ").Append(geom.TipLossB).Append(CRLF)
	Dim pgText As String = "Off"
	If geom.UsePrandtlGlauert Then pgText = "On"
	sb.Append("# Compressibility Correction: ").Append(pgText).Append(CRLF)
	sb.Append("# Nominal RPM: ").Append(geom.NominalRPM).Append(CRLF)
	sb.Append("#").Append(CRLF)
	sb.Append("# --- INPUT FLIGHT CONDITIONS & ISA ATMOSPHERE ---").Append(CRLF)
	sb.Append("# Altitude [m]: ").Append(cond.AltitudeM).Append(CRLF)
	sb.Append("# Temperature [degC]: ").Append(cond.TemperatureC).Append(CRLF)
	sb.Append("# Air Density rho [kg/m3]: ").Append(cond.Rho).Append(CRLF)
	sb.Append("# Speed of Sound a [m/s]: ").Append(cond.SpeedOfSound).Append(CRLF)
	sb.Append("# Inflow Model: ").Append(cond.InflowModel).Append(CRLF)
	sb.Append("# Induced Power Factor kappa: ").Append(cond.KInd).Append(CRLF)
	sb.Append("# Operating Pair: ").Append(cond.OperatingPair).Append(CRLF)
	sb.Append("# Prescribed RPM: ").Append(cond.RPM).Append(CRLF)
	sb.Append("# Prescribed Collective [deg]: ").Append(cond.CollectiveDeg).Append(CRLF)
	sb.Append("#").Append(CRLF)
	sb.Append("# --- BASELINE OPERATING RESULTS ---").Append(CRLF)
	Dim baseRes As RotorResults = zBETEngine.Calculate(geom, cond)
	If baseRes.SolutionValid Then
		sb.Append("# Base Thrust T [N]: ").Append(baseRes.ThrustN).Append(CRLF)
		sb.Append("# Base Torque Q [N.m]: ").Append(baseRes.TorqueNm).Append(CRLF)
		sb.Append("# Base Total Power P [kW]: ").Append(baseRes.PowerShaftW / 1000.0).Append(CRLF)
		sb.Append("# Base CT: ").Append(baseRes.CT).Append(CRLF)
		sb.Append("# Base CQ: ").Append(baseRes.CQ).Append(CRLF)
		sb.Append("# Base CP: ").Append(baseRes.CQ).Append(CRLF)
		sb.Append("# Base FoM: ").Append(baseRes.FoM).Append(CRLF)
		sb.Append("# Base Tip Mach Adv: ").Append(baseRes.AdvancingTipMach).Append(CRLF)
		sb.Append("# Base Tip Mach Ret: ").Append((1.0 - baseRes.OperatingMu) * baseRes.TipSpeed / Max(1.0, baseRes.SpeedOfSound)).Append(CRLF)
	Else
		sb.Append("# Base Solution: Invalid / Out of Envelope").Append(CRLF)
	End If
	sb.Append("#").Append(CRLF)
	sb.Append("# --- SWEEP DATASET (ALL VARIABLES) ---").Append(CRLF)
	sb.Append("Curve,mu,Vx_ms,muZ,Vz_ms,RPM,Collective_deg,Thrust_N,Torque_Nm,Power_kW,Power_Induced_kW,Power_Profile_kW,Power_Parasite_kW,CT,CQ,CP,CH,FoM,Mach_tip_adv,Mach_tip_ret,Lambda_i,Valid").Append(CRLF)
	
	For i = 0 To samples.Size - 1
		Dim p As SweepPoint = samples.Get(i)
		sb.Append(CsvQPop(p.CurveLabel)).Append(",")
		sb.Append(TblNum(p.Mu, 3, True)).Append(",")
		sb.Append(TblNum(p.Vx, 2, True)).Append(",")
		sb.Append(TblNum(p.MuZ, 4, True)).Append(",")
		sb.Append(TblNum(p.Vz, 2, True)).Append(",")
		sb.Append(TblNum(p.RPM, 1, True)).Append(",")
		sb.Append(TblNum(p.CollectiveDeg, 2, True)).Append(",")
		sb.Append(TblNum(p.ThrustN, 2, True)).Append(",")
		sb.Append(TblNum(p.TorqueNm, 2, True)).Append(",")
		sb.Append(TblNum(p.PowerKW, 3, True)).Append(",")
		sb.Append(TblNum(p.PiKW, 3, True)).Append(",")
		sb.Append(TblNum(p.P0KW, 3, True)).Append(",")
		sb.Append(TblNum(p.PparKW, 3, True)).Append(",")
		sb.Append(TblNum(p.CT, 6, True)).Append(",")
		sb.Append(TblNum(p.CQ, 6, True)).Append(",")
		sb.Append(TblNum(p.CP, 6, True)).Append(",")
		sb.Append(TblNum(p.CH, 6, True)).Append(",")
		sb.Append(TblNum(p.FoM, 4, True)).Append(",")
		sb.Append(TblNum(p.MachAdv, 3, True)).Append(",")
		sb.Append(TblNum(p.MachRet, 3, True)).Append(",")
		sb.Append(TblNum(p.LambdaI, 5, True)).Append(",")
		If p.Valid Then sb.Append("1") Else sb.Append("0")
		sb.Append(CRLF)
	Next
	Return sb.ToString
End Sub

Private Sub CsvQPop(value As String) As String
	Return Chr(34) & value.Replace(Chr(34), Chr(34) & Chr(34)) & Chr(34)
End Sub

' ===========================================================================
' ROTOR DISK CONTOUR PLOT
' ===========================================================================

Public Sub DiskContourParamKeys As List
	Return Array As String("aoa", "phi", "cl", "cd", "lambda_total", "lambda_i", "vi", "up_vel", "ut_vel", "fn_span", "ft_span", "mach", "dCTdx", "dyn_press")
End Sub

Public Sub DiskContourParamLabel(key As String) As String
	Select key
		Case "aoa": Return "Angle of Attack " & Chr(945) & " [deg]"
		Case "phi": Return "Inflow Angle " & Chr(966) & " [deg]"
		Case "cl": Return "Lift Coefficient Cl [–]"
		Case "cd": Return "Drag Coefficient Cd [–]"
		Case "lambda_total": Return "Total Inflow Ratio " & Chr(955) & " [–]"
		Case "lambda_i": Return "Induced Inflow Ratio " & Chr(955) & "i [–]"
		Case "vi": Return "Induced Velocity vi [m/s]"
		Case "up_vel": Return "Total Axial Velocity uP [m/s]"
		Case "ut_vel": Return "Tangential Velocity uT [m/s]"
		Case "fn_span": Return "Section Normal Force dFN/dr [N/m]"
		Case "ft_span": Return "Section In-Plane Force dFT/dr [N/m]"
		Case "mach": Return "Local Mach Number M [–]"
		Case "dCTdx": Return "Section Thrust Loading dCT/dx [–]"
		Case "dyn_press": Return "Dynamic Pressure q [Pa]"
		Case Else: Return key
	End Select
End Sub

Private Sub CalcATan2(y As Double, x As Double) As Double
	Dim piVal As Double
	piVal = 3.141592653589793
	If x > 0 Then
		Return ATan(y / x)
	Else If x < 0 And y >= 0 Then
		Return ATan(y / x) + piVal
	Else If x < 0 And y < 0 Then
		Return ATan(y / x) - piVal
	Else If x = 0 And y > 0 Then
		Return piVal / 2.0
	Else If x = 0 And y < 0 Then
		Return -piVal / 2.0
	Else
		Return 0
	End If
End Sub

Private Sub GetJetColor(t As Double) As Int
	t = Max(0, Min(1, t))
	Dim r As Double
	Dim g As Double
	Dim b As Double
	If t < 0.125 Then
		r = 0: g = 0: b = 0.5 + 4.0 * t
	Else If t < 0.375 Then
		r = 0: g = 4.0 * (t - 0.125): b = 1.0
	Else If t < 0.625 Then
		r = 4.0 * (t - 0.375): g = 1.0: b = 1.0 - 4.0 * (t - 0.375)
	Else If t < 0.875 Then
		r = 1.0: g = 1.0 - 4.0 * (t - 0.625): b = 0
	Else
		r = 1.0 - 4.0 * (t - 0.875): g = 0: b = 0
	End If
	Dim ir As Int
	ir = Round(r * 255)
	Dim ig As Int
	ig = Round(g * 255)
	Dim ib As Int
	ib = Round(b * 255)
	Return Colors.ARGB(255, ir, ig, ib)
End Sub

Private Sub FmtColorbarValue(v As Double) As String
	If Abs(v) < 0.000001 Then Return "0"
	If Abs(v) >= 1000 Or (Abs(v) < 0.01 And Abs(v) > 0) Then
		Dim expVal As Int
		expVal = Floor(Logarithm(Abs(v), 10))
		Dim mant As Double
		mant = v / Power(10, expVal)
		Dim signStr As String
		signStr = "+"
		If expVal < 0 Then signStr = ""
		Return NumberFormat2(mant, 1, 2, 2, False) & "e" & signStr & expVal
	End If
	If Abs(v) >= 10 Then Return NumberFormat2(v, 1, 1, 1, False)
	Return NumberFormat2(v, 1, 3, 3, False)
End Sub

Public Sub DrawDiskContourPlot( _
	widthPx As Int, _
	heightPx As Int, _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	res As RotorResults, _
	paramKey As String, _
	lightTheme As Boolean, _
	includeTitle As Boolean _
) As Bitmap
	Dim bmp As Bitmap
	bmp.InitializeMutable(widthPx, heightPx)
	Dim cvs As Canvas
	cvs.Initialize2(bmp)

	Dim colBg As Int
	Dim colGrid As Int
	Dim colText As Int
	Dim colMuted As Int
	Dim isSepia As Boolean
	isSepia = (plotThemeIdx = 3)
	Dim isMid As Boolean
	isMid = (plotThemeIdx = 2)
	If plotThemeIdx = 1 Or isSepia Then lightTheme = True
	If plotThemeIdx = 0 Or isMid Then lightTheme = False

	If isSepia Then
		colBg = 0xFFFAF6EE
		colGrid = 0xFFDDD2C0
		colText = 0xFF2D2319
		colMuted = 0xFF7D6B58
	Else If lightTheme Then
		colBg = 0xFFFFFFFF
		colGrid = 0xFFD9E1EA
		colText = 0xFF344054
		colMuted = 0xFF64748B
	Else
		colBg = 0xFF10141C
		colGrid = 0xFF2A3544
		colText = 0xFFB4BFCE
		colMuted = 0xFF64748B
		If isMid Then
			colBg = 0xFF0D1B2A
			colGrid = 0xFF2A4361
			colText = 0xFFB9CBE0
			colMuted = 0xFF7D95B3
		End If
	End If
	cvs.DrawColor(colBg)

	Dim piVal As Double
	piVal = 3.141592653589793
	Dim numR As Int
	numR = 30
	Dim numPsi As Int
	numPsi = 72
	Dim rMin As Double
	rMin = Max(geom.RootCutout, 0.05)
	Dim rMax As Double
	rMax = 1.0

	Dim rStations(30) As Double
	For i = 0 To numR - 1
		rStations(i) = rMin + (rMax - rMin) * i / (numR - 1)
	Next

	Dim psiStations(72) As Double
	For j = 0 To numPsi - 1
		psiStations(j) = (2.0 * piVal * j) / numPsi
	Next

	Dim mu As Double
	mu = res.OperatingMu
	Dim lambda_total As Double
	lambda_total = res.InflowLambda
	Dim lambda_i As Double
	lambda_i = res.InflowLambdaI
	Dim Kx As Double
	Kx = res.InflowKx
	Dim Ky As Double
	Ky = res.InflowKy
	Dim a As Double
	a = res.EffectiveLiftSlope
	If a <= 0.001 Then a = 5.73
	Dim vtip As Double
	vtip = Max(1.0, res.TipSpeed)
	Dim rho As Double
	rho = cond.Rho
	If rho <= 0.001 Then rho = 1.225
	Dim speedOfSound As Double
	speedOfSound = Max(1.0, cond.SpeedOfSound)
	If speedOfSound <= 10.0 Then speedOfSound = 340.0

	Dim trimmedGeom As RotorGeometry
	trimmedGeom = zBETEngine.CloneGeometry(geom)
	Dim delta As Double
	delta = res.TrimmedCollectiveDeg * piVal / 180.0
	trimmedGeom.ThetaRoot = trimmedGeom.ThetaRoot + delta
	trimmedGeom.ThetaTip = trimmedGeom.ThetaTip + delta
	trimmedGeom.Theta0 = trimmedGeom.Theta0 + delta

	Dim values(30, 72) As Double
	Dim minVal As Double
	minVal = 1e30
	Dim maxVal As Double
	maxVal = -1e30

	For i = 0 To numR - 1
		Dim r As Double
		r = rStations(i)
		Dim sigma As Double
		sigma = zBETEngine.LocalSolidity(trimmedGeom, r)
		Dim theta_rad As Double
		theta_rad = zBETEngine.LocalPitch(trimmedGeom, r)
		Dim theta_deg As Double
		theta_deg = theta_rad * 180.0 / piVal

		Dim spanFrac As Double
		spanFrac = (r - geom.RootCutout) / Max(0.000001, 1.0 - geom.RootCutout)
		spanFrac = Max(0, Min(1, spanFrac))
		Dim chord As Double
		chord = geom.ChordRoot + (geom.ChordTip - geom.ChordRoot) * spanFrac

		For j = 0 To numPsi - 1
			Dim psi As Double
			psi = psiStations(j)
			Dim uT As Double
			uT = r + mu * Sin(psi)
			Dim uP As Double
			uP = lambda_total + r * (Kx * Cos(psi) + Ky * Sin(psi)) * lambda_i
			Dim uR As Double
			uR = mu * Cos(psi)

			Dim lambda_i_local As Double
			lambda_i_local = lambda_i * (1.0 + r * (Kx * Cos(psi) + Ky * Sin(psi)))
			Dim vi_dim As Double
			vi_dim = lambda_i_local * vtip
			Dim ut_dim As Double
			ut_dim = uT * vtip
			Dim up_dim As Double
			up_dim = uP * vtip
			Dim W_dim As Double
			W_dim = Sqrt(uT * uT + uR * uR + uP * uP) * vtip
			Dim q As Double
			q = 0.5 * rho * W_dim * W_dim
			Dim mach As Double
			mach = W_dim / speedOfSound

			Dim phi_rad As Double
			Dim phi_deg As Double
			Dim alpha_deg As Double
			Dim cl As Double

			If uT > 0 Then
				phi_rad = CalcATan2(uP, uT)
				phi_deg = Max(-10, Min(25, phi_rad * 180.0 / piVal))
				alpha_deg = theta_deg - (phi_rad * 180.0 / piVal)
				Dim alpha_rad As Double
				alpha_rad = alpha_deg * piVal / 180.0
				cl = Max(-1.2, Min(1.4, a * alpha_rad))
			Else
				Dim phi_rev As Double
				phi_rev = CalcATan2(uP, Max(0.0001, -uT))
				phi_deg = Max(-10, Min(25, phi_rev * 180.0 / piVal))
				phi_rad = phi_rev
				alpha_deg = -(theta_deg + phi_deg)
				alpha_deg = Max(-15, Min(25, alpha_deg))
				Dim alpha_rad As Double
				alpha_rad = alpha_deg * piVal / 180.0
				cl = Max(-0.8, Min(0.8, -Sin(2.0 * alpha_rad)))
			End If
			alpha_deg = Max(-15, Min(25, alpha_deg))
			Dim cd As Double
			cd = geom.Cd0

			Dim dL As Double
			dL = q * chord * cl
			Dim dD As Double
			dD = q * chord * cd
			Dim dFn As Double
			dFn = dL * Cos(phi_rad) - dD * Sin(phi_rad)
			Dim dFt As Double
			dFt = dL * Sin(phi_rad) + dD * Cos(phi_rad)
			Dim dCTdx As Double
			dCTdx = 0.5 * sigma * (cl * Cos(phi_rad) - cd * Sin(phi_rad)) * (uT * uT + uR * uR + uP * uP)

			Dim val As Double
			val = 0
			Select paramKey
				Case "aoa": val = alpha_deg
				Case "phi": val = phi_deg
				Case "cl": val = cl
				Case "cd": val = cd
				Case "lambda_total": val = uP
				Case "lambda_i": val = lambda_i_local
				Case "vi": val = vi_dim
				Case "up_vel": val = up_dim
				Case "ut_vel": val = ut_dim
				Case "fn_span": val = dFn
				Case "ft_span": val = dFt
				Case "mach": val = mach
				Case "dCTdx": val = dCTdx
				Case "dyn_press": val = q
			End Select

			values(i, j) = val
			If val < minVal Then minVal = val
			If val > maxVal Then maxVal = val
		Next
	Next

	If minVal = maxVal Then maxVal = minVal + 1.0

	Dim centerX As Float
	centerX = Round(widthPx * 0.44)
	Dim centerY As Float
	centerY = Round(heightPx * 0.50)
	Dim maxRadius As Float
	maxRadius = Round(Min(155dip, (heightPx - 110dip) / 2))

	For i = 0 To numR - 2
		Dim r1Px As Float
		r1Px = rStations(i) * maxRadius
		Dim r2Px As Float
		r2Px = rStations(i + 1) * maxRadius

		For j = 0 To numPsi - 1
			Dim jNext As Int
			jNext = (j + 1) Mod numPsi
			Dim v1 As Double
			v1 = values(i, j)
			Dim v2 As Double
			v2 = values(i, jNext)
			Dim v3 As Double
			v3 = values(i + 1, j)
			Dim v4 As Double
			v4 = values(i + 1, jNext)
			Dim vAvg As Double
			vAvg = (v1 + v2 + v3 + v4) / 4.0
			Dim normV As Double
			normV = (vAvg - minVal) / (maxVal - minVal)
			Dim wedgeCol As Int
			wedgeCol = GetJetColor(normV)

			Dim a1 As Double
			a1 = piVal / 2.0 - psiStations(j)
			Dim a2 As Double
			a2 = piVal / 2.0 - psiStations(jNext)

			Dim x1a As Float
			x1a = centerX + r1Px * Cos(a1)
			Dim y1a As Float
			y1a = centerY - r1Px * Sin(a1)
			Dim x2a As Float
			x2a = centerX + r2Px * Cos(a1)
			Dim y2a As Float
			y2a = centerY - r2Px * Sin(a1)
			Dim x2b As Float
			x2b = centerX + r2Px * Cos(a2)
			Dim y2b As Float
			y2b = centerY - r2Px * Sin(a2)
			Dim x1b As Float
			x1b = centerX + r1Px * Cos(a2)
			Dim y1b As Float
			y1b = centerY - r1Px * Sin(a2)

			Dim poly As Path
			poly.Initialize(x1a, y1a)
			poly.LineTo(x2a, y2a)
			poly.LineTo(x2b, y2b)
			poly.LineTo(x1b, y1b)
			poly.LineTo(x1a, y1a)
			cvs.DrawPath(poly, wedgeCol, True, 1)
		Next
	Next

	Dim colGuide As Int
	colGuide = 0x99000000
	Dim dashPat() As Float = Array As Float(4dip, 3dip)
	Dim rNorms() As Float = Array As Float(0.25, 0.50, 0.75)
	For Each rn As Float In rNorms
		Dim rGuide As Float
		rGuide = rn * maxRadius
		Dim steps As Int
		steps = 48
		For k = 0 To steps - 1 Step 2
			Dim an1 As Double
			an1 = (2.0 * piVal * k) / steps
			Dim an2 As Double
			an2 = (2.0 * piVal * (k + 1)) / steps
			cvs.DrawLine(centerX + rGuide * Cos(an1), centerY - rGuide * Sin(an1), _
				centerX + rGuide * Cos(an2), centerY - rGuide * Sin(an2), colGuide, 1.2dip)
		Next
	Next

	DrawPatterned(cvs, centerX - maxRadius, centerY, centerX + maxRadius, centerY, colGuide, 1.2dip, dashPat)
	DrawPatterned(cvs, centerX, centerY - maxRadius, centerX, centerY + maxRadius, colGuide, 1.2dip, dashPat)

	cvs.DrawCircle(centerX, centerY, maxRadius, 0xFF000000, False, 1dip)

	Dim rootRPx As Float
	rootRPx = rStations(0) * maxRadius
	cvs.DrawCircle(centerX, centerY, rootRPx, colBg, True, 1dip)
	cvs.DrawCircle(centerX, centerY, rootRPx, 0xFF000000, False, 1dip)

	cvs.DrawText("Fore", centerX, centerY - maxRadius - 20dip, Typeface.DEFAULT, 10, colMuted, "CENTER")
	cvs.DrawText("180°", centerX, centerY - maxRadius - 6dip, Typeface.DEFAULT_BOLD, 12, colText, "CENTER")

	cvs.DrawText("0°", centerX, centerY + maxRadius + 14dip, Typeface.DEFAULT_BOLD, 12, colText, "CENTER")
	cvs.DrawText("Aft", centerX, centerY + maxRadius + 26dip, Typeface.DEFAULT, 10, colMuted, "CENTER")

	cvs.DrawText("90°", centerX + maxRadius + 24dip, centerY - 2dip, Typeface.DEFAULT_BOLD, 12, colText, "CENTER")
	cvs.DrawText("Adv.", centerX + maxRadius + 24dip, centerY + 12dip, Typeface.DEFAULT, 10, colMuted, "CENTER")

	cvs.DrawText("270°", centerX - maxRadius - 24dip, centerY - 2dip, Typeface.DEFAULT_BOLD, 12, colText, "CENTER")
	cvs.DrawText("Ret.", centerX - maxRadius - 24dip, centerY + 12dip, Typeface.DEFAULT, 10, colMuted, "CENTER")

	Dim cbX As Float
	cbX = widthPx - 68dip
	Dim cbY As Float
	cbY = centerY - maxRadius
	Dim cbW As Float
	cbW = 10dip
	Dim cbH As Float
	cbH = 2 * maxRadius
	Dim cbSteps As Int
	cbSteps = 50
	For s = 0 To cbSteps - 1
		Dim sy1 As Float
		sy1 = cbY + cbH - (cbH * (s + 1) / cbSteps)
		Dim sy2 As Float
		sy2 = cbY + cbH - (cbH * s / cbSteps)
		Dim sNorm As Double
		sNorm = (s + 0.5) / cbSteps
		Dim segCol As Int
		segCol = GetJetColor(sNorm)
		Dim segRect As Rect
		segRect.Initialize(cbX, sy1, cbX + cbW, sy2)
		cvs.DrawRect(segRect, segCol, True, 1)
	Next
	Dim cbBorder As Rect
	cbBorder.Initialize(cbX, cbY, cbX + cbW, cbY + cbH)
	cvs.DrawRect(cbBorder, colGrid, False, 1dip)

	cvs.DrawText(FmtColorbarValue(maxVal), cbX + cbW + 4dip, cbY + 8dip, Typeface.MONOSPACE, 10, colText, "LEFT")
	cvs.DrawText(FmtColorbarValue((maxVal + minVal) / 2.0), cbX + cbW + 4dip, cbY + cbH / 2.0 + 4dip, Typeface.MONOSPACE, 10, colText, "LEFT")
	cvs.DrawText(FmtColorbarValue(minVal), cbX + cbW + 4dip, cbY + cbH, Typeface.MONOSPACE, 10, colText, "LEFT")

	If includeTitle Then
		Dim tTitle As String
		tTitle = DiskContourParamLabel(paramKey)
		cvs.DrawText(tTitle, widthPx / 2.0, 20dip, Typeface.DEFAULT_BOLD, 13, colText, "CENTER")
	End If

	Return bmp
End Sub
