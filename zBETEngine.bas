B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' zBETEngine.bas — Motor Aerodinâmico Puro zBET para B4A
' Implementação fiel e analítica da Teoria do Elemento de Pá (BET) e Teoria do Momentum
' Referências: Wayne Johnson (Rotorcraft Aeromechanics) & Gordon Leishman (Principles of Helicopter Aerodynamics)

Sub Process_Globals
	
	' Tipos de Dados Estruturados do Sistema
	Type RotorGeometry ( _
		Name As String, _
		RPM As Double, _
		Radius As Double, _
		LiftSlope0 As Double, _
		RootCutout As Double, _
		Cd0 As Double, _
		SolidityMode As String, _
		SigmaRef As Double, _
		SigmaGeom As Double, _
		SigmaThrust As Double, _
		NBlades As Int, _
		ChordRoot As Double, _
		ChordTip As Double, _
		PitchMode As String, _
		Theta0 As Double, _
		ThetaRoot As Double, _
		ThetaTip As Double, _
		TipLossMode As String, _
		TipLossB As Double, _
		UsePrandtlGlauert As Boolean, _
		NominalRPM As Double)
	
	Type FlightCondition ( _
		AltitudeM As Double, _
		TemperatureC As Double, _
		PressurePa As Double, _
		Rho As Double, _
		SpeedOfSound As Double, _
		HorizontalMode As String, _
		HorizontalValue As Double, _
		AxialMode As String, _
		AxialValue As Double, _
		Mu As Double, _
		MuZ As Double, _
		InflowModel As String, _
		ProfileDragModel As String, _
		InducedTorqueModel As String, _
		OperatingPair As String, _
		RPM As Double, _
		CollectiveDeg As Double, _
		TargetThrustN As Double, _
		TargetCT As Double, _
		KInd As Double, _
		FxColeman As Double, _
		FyColeman As Double)
	
	Type RotorResults (AoAAdv75 As Double, AoARet75 As Double, PhiAdv75 As Double, PhiRet75 As Double, _
		AoAAdv25 As Double, AoARet25 As Double, PhiAdv25 As Double, PhiRet25 As Double, _
		AoAAdv50 As Double, AoARet50 As Double, PhiAdv50 As Double, PhiRet50 As Double, _
		AoAAdvTip As Double, AoARetTip As Double, PhiAdvTip As Double, PhiRetTip As Double, _
		CT As Double, CQ As Double, CQi As Double, CQ0 As Double, CH As Double, CHi As Double, CH0 As Double, CY As Double, _
		CMx As Double, CMy As Double, CPair As Double, InflowLambda As Double, InflowLambdaI As Double, L_D_eff As Double, FoM As Double, _
		ThrustN As Double, ThrustKgf As Double, ThrustLbf As Double, PowerShaftW As Double, PowerShaftKW As Double, PowerShaftHP As Double, _
		TorqueNm As Double, TorqueLbft As Double, DragHN As Double, SideForceYN As Double, SideForceYLbf As Double, _
		RollMomentNm As Double, RollMomentLbft As Double, PitchMomentNm As Double, PitchMomentLbft As Double, TipSpeed As Double, _
		AdvancingTipMach As Double, InflowKx As Double, InflowKy As Double, WakeSkewChiDeg As Double, BFactor As Double, _
		EffectiveLiftSlope As Double, TrimmedRPM As Double, TrimmedCollectiveDeg As Double, TrimmedTheta0Deg As Double, _
		OperatingMu As Double, OperatingMuZ As Double, OperatingVx As Double, OperatingVz As Double, OperatingAlphaDeg As Double, _
		AltitudeM As Double, TemperatureC As Double, DensityRho As Double, PressurePa As Double, SpeedOfSound As Double, _
		SolutionValid As Boolean, CompressibilityWarning As Boolean, CompressibilityInvalid As Boolean, StatusMessage As String, ValidityWarning As String)

	' Nós e pesos de quadratura de Gauss-Legendre (16 nós radiais, 24 nós azimutais)
	Private GL_X16() As Double
	Private GL_W16() As Double
	Private GL_X24() As Double
	Private GL_W24() As Double
	Private InitializedGL As Boolean = False
	
End Sub

' Inicializa tabelas de quadratura de Gauss-Legendre
Private Sub InitGaussQuadrature
	If InitializedGL Then Return
	
	GL_X16 = Array As Double( _
		-0.98940093499165, -0.94457502307323, -0.86563120238783, -0.75540440835500, _
		-0.61787624440264, -0.45801677765723, -0.28160355077926, -0.09501250983764, _
		 0.09501250983764,  0.28160355077926,  0.45801677765723,  0.61787624440264, _
		 0.75540440835500,  0.86563120238783,  0.94457502307323,  0.98940093499165)
		 
	GL_W16 = Array As Double( _
		0.02715245941175, 0.06225352393865, 0.09515851168249, 0.12462897125553, _
		0.14959598881658, 0.16915651939500, 0.18260341504492, 0.18945061045507, _
		0.18945061045507, 0.18260341504492, 0.16915651939500, 0.14959598881658, _
		0.12462897125553, 0.09515851168249, 0.06225352393865, 0.02715245941175)
		
	GL_X24 = Array As Double( _
		-0.9951872200, -0.9747285560, -0.9382745520, -0.8864155270, -0.8200019860, -0.7401241916, _
		-0.6480936519, -0.5454214714, -0.4337935076, -0.3150426797, -0.1911188675, -0.0640568929, _
		 0.0640568929,  0.1911188675,  0.3150426797,  0.4337935076,  0.5454214714,  0.6480936519, _
		 0.7401241916,  0.8200019860,  0.8864155270,  0.9382745520,  0.9747285560,  0.9951872200)
		 
	GL_W24 = Array As Double( _
		0.0123412298, 0.0285313886, 0.0442774388, 0.0592985849, 0.0733464814, 0.0861901615, _
		0.0976186521, 0.1074442701, 0.1155056681, 0.1216704729, 0.1258374563, 0.1279381953, _
		0.1279381953, 0.1258374563, 0.1216704729, 0.1155056681, 0.1074442701, 0.0976186521, _
		0.0861901615, 0.0733464814, 0.0592985849, 0.0442774388, 0.0285313886, 0.0123412298)
		
	InitializedGL = True
End Sub

' Cria uma geometria padrão calibrada
Public Sub CreateDefaultGeometry As RotorGeometry
	Dim g As RotorGeometry
	g.Initialize
	g.Name = "Padrão zBET"
	g.RPM = 390.0
	g.Radius = 5.5
	g.LiftSlope0 = 5.73
	g.RootCutout = 0.15
	g.Cd0 = 0.009
	g.SolidityMode = "sigma_ref"
	g.SigmaRef = 0.075
	g.NBlades = 4
	g.ChordRoot = 0.324
	g.ChordTip = 0.324
	g.PitchMode = "constant"
	g.Theta0 = 0.0
	g.ThetaRoot = 12.0 * cPI / 180.0
	g.ThetaTip = 4.0 * cPI / 180.0
	g.TipLossMode = "none"
	g.TipLossB = 0.97
	g.UsePrandtlGlauert = False
	g.NominalRPM = 390.0
	Return ResolveSolidity(g)
End Sub

' Cria uma condição de voo padrão calibrada
Public Sub CreateDefaultCondition As FlightCondition
	Dim c As FlightCondition
	c.Initialize
	c.AltitudeM = 0.0
	c.TemperatureC = 15.0
	c.PressurePa = 101325.0
	c.Rho = 1.225
	c.SpeedOfSound = 340.3
	c.HorizontalMode = "mu"
	c.HorizontalValue = 0.0
	c.AxialMode = "alpha"
	c.AxialValue = 0.0
	c.Mu = 0.0
	c.MuZ = 0.0
	c.InflowModel = "coleman_feingold"
	c.ProfileDragModel = "numerical_vectorial"
	c.InducedTorqueModel = "energy_balance"
	c.OperatingPair = "rpm_ct"
	c.RPM = 390.0
	c.CollectiveDeg = 0.0
	c.TargetCT = 0.0065
	c.TargetThrustN = 0.0
	c.KInd = 1.15
	c.FxColeman = 1.0
	c.FyColeman = 1.0
	Return c
End Sub

' Custom B4A Types are reference objects. These helpers create independent values
' so calculations and sweeps never mutate the caller's operating state.
Public Sub CloneGeometry(src As RotorGeometry) As RotorGeometry
	Dim dst As RotorGeometry
	dst.Initialize
	dst.Name = src.Name
	dst.RPM = src.RPM
	dst.Radius = src.Radius
	dst.LiftSlope0 = src.LiftSlope0
	dst.RootCutout = src.RootCutout
	dst.Cd0 = src.Cd0
	dst.SolidityMode = src.SolidityMode
	dst.SigmaRef = src.SigmaRef
	dst.SigmaGeom = src.SigmaGeom
	dst.SigmaThrust = src.SigmaThrust
	dst.NBlades = src.NBlades
	dst.ChordRoot = src.ChordRoot
	dst.ChordTip = src.ChordTip
	dst.PitchMode = src.PitchMode
	dst.Theta0 = src.Theta0
	dst.ThetaRoot = src.ThetaRoot
	dst.ThetaTip = src.ThetaTip
	dst.TipLossMode = src.TipLossMode
	dst.TipLossB = src.TipLossB
	dst.UsePrandtlGlauert = src.UsePrandtlGlauert
	dst.NominalRPM = src.NominalRPM
	Return dst
End Sub

' Canonical zBET / zBEMT flight-condition convention:
'   +x / Vx is forward in-plane flow; μ = Vx/(ΩR)
'   +z / Vz is downward through the rotor disk
'   μz = Vz/(ΩR) when Vz is specified directly
'   rotor angle of attack α is positive when the stream arrives from below,
'   therefore μz = -μ tan(α).
Public Sub ResolveMuZ(mu As Double, axialMode As String, axialValue As Double, vtip As Double) As Double
	Select axialMode.ToLowerCase
		Case "alpha"
			Return -mu * Tan(axialValue * cPI / 180.0)
		Case "vz"
			If Abs(vtip) < 1e-12 Then Return 0.0
			Return axialValue / vtip
		Case "muz"
			Return axialValue
		Case Else
			Return axialValue
	End Select
End Sub

Public Sub AlphaFromMuZ(mu As Double, muZ As Double) As Double
	' -ATan(muZ / mu) equals -ATan2(muZ * Sgn(mu), Abs(mu)): alpha stays in (-90, 90) for mu < 0 too.
	If Abs(mu) < 1e-9 Then Return 0.0
	Return -ATan(muZ / mu) * 180.0 / cPI
End Sub

Public Sub VzFromMuZ(muZ As Double, vtip As Double) As Double
	Return muZ * vtip
End Sub

Public Sub CloneCondition(src As FlightCondition) As FlightCondition
	Dim dst As FlightCondition
	dst.Initialize
	dst.AltitudeM = src.AltitudeM
	dst.TemperatureC = src.TemperatureC
	dst.PressurePa = src.PressurePa
	dst.Rho = src.Rho
	dst.SpeedOfSound = src.SpeedOfSound
	dst.HorizontalMode = src.HorizontalMode
	dst.HorizontalValue = src.HorizontalValue
	dst.AxialMode = src.AxialMode
	dst.AxialValue = src.AxialValue
	dst.Mu = src.Mu
	dst.MuZ = src.MuZ
	dst.InflowModel = src.InflowModel
	dst.ProfileDragModel = "numerical_vectorial"
	dst.InducedTorqueModel = src.InducedTorqueModel
	dst.OperatingPair = src.OperatingPair
	dst.RPM = src.RPM
	dst.CollectiveDeg = src.CollectiveDeg
	dst.TargetThrustN = src.TargetThrustN
	dst.TargetCT = src.TargetCT
	dst.KInd = src.KInd
	dst.FxColeman = src.FxColeman
	dst.FyColeman = src.FyColeman
	Return dst
End Sub

' Returns a safe condition copy without mutating caller state.
Public Sub SanitizeCondition(src As FlightCondition) As FlightCondition
	Dim c As FlightCondition = CloneCondition(src)
	c.AltitudeM = Max(-500.0, Min(11000.0, c.AltitudeM))
	c.TemperatureC = Max(-80.0, Min(60.0, c.TemperatureC))
	c.PressurePa = Max(1000.0, Min(120000.0, c.PressurePa))
	c.Rho = Max(0.01, Min(5.0, c.Rho))
	c.SpeedOfSound = Max(100.0, Min(500.0, c.SpeedOfSound))
	c.RPM = Max(1.0, Min(30000.0, c.RPM))
	c.CollectiveDeg = Max(-60.0, Min(60.0, c.CollectiveDeg))
	c.Mu = Max(-0.60, Min(0.60, c.Mu))
	c.MuZ = Max(-0.50, Min(0.50, c.MuZ))
	c.TargetThrustN = Max(0.0, Min(1.0e8, c.TargetThrustN))
	c.TargetCT = Max(0.0, Min(0.20, c.TargetCT))
	c.KInd = Max(1.0, Min(3.0, c.KInd))
	c.FxColeman = Max(-5.0, Min(5.0, c.FxColeman))
	c.FyColeman = Max(-5.0, Min(5.0, c.FyColeman))
	If c.HorizontalMode <> "mu" And c.HorizontalMode <> "vx" Then c.HorizontalMode = "mu"
	If c.AxialMode <> "alpha" And c.AxialMode <> "vz" And c.AxialMode <> "muz" Then c.AxialMode = "alpha"
	If c.InflowModel <> "uniform" And c.InflowModel <> "coleman_simple" And c.InflowModel <> "coleman_feingold" And c.InflowModel <> "drees" Then c.InflowModel = "coleman_feingold"
	c.ProfileDragModel = "numerical_vectorial"
	If c.InducedTorqueModel <> "energy_balance" And c.InducedTorqueModel <> "analytical_bet" Then c.InducedTorqueModel = "energy_balance"
	If c.OperatingPair <> "rpm_collective" And c.OperatingPair <> "rpm_ct" And c.OperatingPair <> "rpm_thrust" And c.OperatingPair <> "collective_ct" And c.OperatingPair <> "collective_thrust" And c.OperatingPair <> "ct_thrust" Then c.OperatingPair = "rpm_ct"
	Return c
End Sub

' ---------------------------------------------------------------------------
' Input limit notes (parity with inputLimitNotes in web/src/engine.ts).
' Returns "" when no input is limited. Otherwise returns a short STE message,
' for example "Input limited: μx = 0.60". Pass the raw geometry/condition and
' the operating RPM that resolves Vx and Vz.
' ---------------------------------------------------------------------------
Private Sub LimitedItem(items As List, label As String, raw As Double, lo As Double, hi As Double, digits As Int)
	If raw < lo Or raw > hi Then
		items.Add(label & " = " & NumberFormat2(Max(lo, Min(hi, raw)), 1, digits, digits, False))
	End If
End Sub

Public Sub InputLimitNotes(geom As RotorGeometry, cond As FlightCondition, rpm As Double) As String
	Dim items As List
	items.Initialize
	
	' Geometry (see ResolveSolidity)
	Dim radius As Double = Max(0.02, Min(50.0, geom.Radius))
	Dim x0 As Double = Max(0.0, Min(0.95, geom.RootCutout))
	LimitedItem(items, "R", geom.Radius, 0.02, 50.0, 2)
	LimitedItem(items, "N_b", geom.NBlades, 1, 16, 0)
	LimitedItem(items, "x_0", geom.RootCutout, 0.0, 0.95, 2)
	If geom.SolidityMode = "chords" Then
		LimitedItem(items, "c_R", geom.ChordRoot, 0.0001, 2.0 * radius, 4)
		LimitedItem(items, "c_T", geom.ChordTip, 0.0001, 2.0 * radius, 4)
	End If
	LimitedItem(items, "a_0", geom.LiftSlope0, 0.1, 10.0, 2)
	LimitedItem(items, "C_d0", geom.Cd0, 0.0, 0.5, 4)
	If geom.TipLossMode = "fixed" Then LimitedItem(items, "B", geom.TipLossB, x0 + 0.01, 1.0, 3)
	
	' Atmosphere and engine settings (see SanitizeCondition)
	LimitedItem(items, "altitude", cond.AltitudeM, -500.0, 11000.0, 0)
	LimitedItem(items, "temperature", cond.TemperatureC, -80.0, 60.0, 0)
	LimitedItem(items, "pressure", cond.PressurePa, 1000.0, 120000.0, 0)
	LimitedItem(items, Chr(961), cond.Rho, 0.01, 5.0, 3)
	LimitedItem(items, "speed of sound", cond.SpeedOfSound, 100.0, 500.0, 1)
	Dim pair() As String = Regex.Split("_", cond.OperatingPair)
	Dim usesRPM As Boolean = (pair(0) = "rpm")
	Dim usesCollective As Boolean = False
	Dim usesCT As Boolean = False
	Dim usesThrust As Boolean = False
	For Each token As String In pair
		If token = "collective" Then usesCollective = True
		If token = "ct" Then usesCT = True
		If token = "thrust" Then usesThrust = True
	Next
	If usesRPM Then LimitedItem(items, Chr(937), cond.RPM, 1.0, 30000.0, 0)
	If usesCollective Then LimitedItem(items, Chr(916) & Chr(952), cond.CollectiveDeg, -60.0, 60.0, 1)
	If usesCT Then LimitedItem(items, "C_T target", cond.TargetCT, 0.0, 0.20, 4)
	If usesThrust Then LimitedItem(items, "T target", cond.TargetThrustN, 0.0, 1.0e8, 0)
	LimitedItem(items, "k_ind", cond.KInd, 1.0, 3.0, 2)
	If cond.InflowModel = "coleman_feingold" Then
		LimitedItem(items, "f_x", cond.FxColeman, -5.0, 5.0, 2)
		LimitedItem(items, "f_y", cond.FyColeman, -5.0, 5.0, 2)
	End If
	
	' Flight kinematics at the operating RPM (see ResolveConditionAtRPM)
	Dim vtip As Double = Max(1.0e-9, Max(1.0, Min(30000.0, rpm)) * 2.0 * cPI / 60.0 * radius)
	Dim rawMu As Double = cond.HorizontalValue
	If cond.HorizontalMode = "vx" Then rawMu = cond.HorizontalValue / vtip
	LimitedItem(items, Chr(956) & "x", rawMu, -0.60, 0.60, 2)
	Dim mu As Double = Max(-0.60, Min(0.60, rawMu))
	Dim axialMode As String = cond.AxialMode
	If axialMode <> "alpha" And axialMode <> "vz" And axialMode <> "muz" Then axialMode = "alpha"
	LimitedItem(items, Chr(956) & "z", ResolveMuZ(mu, axialMode, cond.AxialValue, vtip), -0.50, 0.50, 2)
	
	If items.Size = 0 Then Return ""
	Dim sb As StringBuilder
	sb.Initialize
	sb.Append("Input limited: ")
	For i = 0 To items.Size - 1
		If i > 0 Then sb.Append("; ")
		Dim item As String = items.Get(i)
		sb.Append(item)
	Next
	Return sb.ToString
End Sub

Private Sub JoinWarnings(a As String, b As String) As String
	If a.Length = 0 Then Return b
	If b.Length = 0 Then Return a
	Return a & ". " & b
End Sub

' Resolve e unifica as três definições de solidez
Public Sub ResolveSolidity(geom As RotorGeometry) As RotorGeometry
	' Defensive domain guards. UI validates too, but the engine must remain safe when called directly.
	geom.Radius = Max(0.02, Min(50.0, geom.Radius))
	geom.RPM = Max(1.0, Min(30000.0, geom.RPM))
	If geom.NominalRPM <= 0.0 Then geom.NominalRPM = geom.RPM
	geom.NominalRPM = Max(1.0, Min(30000.0, geom.NominalRPM))
	geom.NBlades = Max(1, Min(16, geom.NBlades))
	geom.RootCutout = Max(0.0, Min(0.95, geom.RootCutout))
	geom.ChordRoot = Max(0.0001, Min(2.0 * geom.Radius, geom.ChordRoot))
	geom.ChordTip = Max(0.0001, Min(2.0 * geom.Radius, geom.ChordTip))
	geom.LiftSlope0 = Max(0.1, Min(10.0, geom.LiftSlope0))
	geom.Cd0 = Max(0.0, Min(0.5, geom.Cd0))
	' Same clamp as tools/zBET.py Geometry.b_factor: B in [x0 + 0.01, 1.0].
	geom.TipLossB = Max(geom.RootCutout + 0.01, Min(1.0, geom.TipLossB))
	If geom.SolidityMode <> "chords" And geom.SolidityMode <> "sigma_geom" And geom.SolidityMode <> "sigma_ref" Then geom.SolidityMode = "chords"
	If geom.PitchMode <> "constant" And geom.PitchMode <> "linear_twist" Then geom.PitchMode = "linear_twist"
	If geom.TipLossMode <> "none" And geom.TipLossMode <> "fixed" And geom.TipLossMode <> "sissingh" Then geom.TipLossMode = "none"
	Dim x0 As Double = geom.RootCutout
	Dim nb As Int = geom.NBlades
	Dim rad As Double = geom.Radius
	
	If geom.SolidityMode = "chords" Then
		' ChordRoot is the reference-axis chord c0 at x=0; ChordTip is c1 at x=1.
		Dim s0 As Double = nb * geom.ChordRoot / (cPI * rad)
		Dim s1 As Double = nb * (geom.ChordTip - geom.ChordRoot) / (cPI * rad)
		geom.SigmaRef = s0 + 0.5 * s1
		geom.SigmaGeom = s0 * (1.0 - x0) + 0.5 * s1 * (1.0 - x0 * x0)
		geom.SigmaThrust = 3.0 * (s0 * (1.0 - Power(x0, 3)) / 3.0 + s1 * (1.0 - Power(x0, 4)) / 4.0)
	Else If geom.SolidityMode = "sigma_geom" Then
		geom.SigmaRef = geom.SigmaGeom / (1.0 - x0)
		geom.SigmaThrust = (1.0 - Power(x0, 3)) * geom.SigmaRef
		geom.ChordRoot = geom.SigmaRef * cPI * rad / nb
		geom.ChordTip = geom.ChordRoot
	Else ' sigma_ref padrão
		geom.SigmaGeom = (1.0 - x0) * geom.SigmaRef
		geom.SigmaThrust = (1.0 - Power(x0, 3)) * geom.SigmaRef
		geom.ChordRoot = geom.SigmaRef * cPI * rad / nb
		geom.ChordTip = geom.ChordRoot
	End If
	Return geom
End Sub

' Obtém os coeficientes lineares da solidez s0 e s1: sigma(x) = s0 + s1 * x
Public Sub GetSolidityCoeffs(geom As RotorGeometry) As Double()
	' Reference planform is linear from x=0 to x=1.
	Dim s0 As Double = geom.NBlades * geom.ChordRoot / (cPI * geom.Radius)
	Dim s1 As Double = geom.NBlades * (geom.ChordTip - geom.ChordRoot) / (cPI * geom.Radius)
	Return Array As Double(s0, s1)
End Sub

Public Sub ReferenceBladeArea(geom As RotorGeometry) As Double
	Return 0.5 * geom.Radius * (geom.ChordRoot + geom.ChordTip)
End Sub

Public Sub ActiveBladeArea(geom As RotorGeometry) As Double
	Dim x0 As Double = geom.RootCutout
	Dim c0 As Double = geom.ChordRoot
	Dim c1 As Double = geom.ChordTip
	Dim integral As Double = c0 * (1.0 - x0) + 0.5 * (c1 - c0) * (1.0 - x0 * x0)
	Return geom.Radius * integral
End Sub

Public Sub ReferenceAspectRatio(geom As RotorGeometry) As Double
	Dim area As Double = ReferenceBladeArea(geom)
	If area <= 1.0e-12 Then Return 0.0
	Return geom.Radius * geom.Radius / area
End Sub

Public Sub TaperRatio(geom As RotorGeometry) As Double
	If Abs(geom.ChordRoot) < 1.0e-12 Then Return 0.0
	Return geom.ChordTip / geom.ChordRoot
End Sub

Public Sub ScaleRadiusPreserveReference(geom As RotorGeometry, newRadius As Double) As RotorGeometry
	Dim g As RotorGeometry = CloneGeometry(geom)
	Dim oldRadius As Double = Max(0.02, g.Radius)
	newRadius = Max(0.02, Min(50.0, newRadius))
	Dim scale As Double = newRadius / oldRadius
	g.Radius = newRadius
	g.ChordRoot = g.ChordRoot * scale
	g.ChordTip = g.ChordTip * scale
	g.SolidityMode = "chords"
	Return ResolveSolidity(g)
End Sub

Public Sub ScaleChordsToSigmaRef(geom As RotorGeometry, targetSigma As Double) As RotorGeometry
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	targetSigma = Max(1.0e-5, Min(1.0, targetSigma))
	If g.SigmaRef <= 1.0e-12 Then Return g
	Dim scale As Double = targetSigma / g.SigmaRef
	g.ChordRoot = g.ChordRoot * scale
	g.ChordTip = g.ChordTip * scale
	g.SolidityMode = "chords"
	Return ResolveSolidity(g)
End Sub

Public Sub ScaleChordsToAspectRatio(geom As RotorGeometry, targetAR As Double) As RotorGeometry
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	targetAR = Max(0.1, Min(1000.0, targetAR))
	Dim currentAR As Double = ReferenceAspectRatio(g)
	If currentAR <= 1.0e-12 Then Return g
	Dim scale As Double = currentAR / targetAR
	g.ChordRoot = g.ChordRoot * scale
	g.ChordTip = g.ChordTip * scale
	g.SolidityMode = "chords"
	Return ResolveSolidity(g)
End Sub

' ---- Fully coupled planform editing (reference planform c(x)=c0+(c1-c0)x) ----
' Keys (SI, rad): R, Nb, x0, c0, c1, taper, sigmaRef, sigmaAct, sigmaT, AR, A, Ab, Aact,
' thRoot, thTip, thTwist, th75
Public Sub GetGeometryQuantity(geom As RotorGeometry, key As String) As Double
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	Select key
		Case "R"
			Return g.Radius
		Case "Nb"
			Return g.NBlades
		Case "x0"
			Return g.RootCutout
		Case "c0"
			Return g.ChordRoot
		Case "c1"
			Return g.ChordTip
		Case "taper"
			Return TaperRatio(g)
		Case "sigmaRef"
			Return g.SigmaRef
		Case "sigmaAct"
			Return g.SigmaGeom
		Case "sigmaT"
			Return g.SigmaThrust
		Case "AR"
			Return ReferenceAspectRatio(g)
		Case "A"
			Return cPI * g.Radius * g.Radius
		Case "Ab"
			Return ReferenceBladeArea(g)
		Case "Aact"
			Return ActiveBladeArea(g)
		Case "thRoot"
			Return g.ThetaRoot
		Case "thTip"
			Return g.ThetaTip
		Case "thTwist"
			Return g.ThetaTip - g.ThetaRoot
		Case "th75"
			Return g.ThetaRoot + (g.ThetaTip - g.ThetaRoot) * 0.75
	End Select
	Return 0.0
End Sub

' Returns a clamped, solidity-resolved CLONE; the caller's geometry is never mutated.
Public Sub SetGeometryQuantity(geom As RotorGeometry, key As String, value As Double) As RotorGeometry
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	g.SolidityMode = "chords"
	Dim cur As Double = 0.0
	Dim scale As Double = 1.0
	Dim mean As Double
	Select key
		Case "R", "A"
			Dim newR As Double = value
			If key = "A" Then newR = Sqrt(Max(0.0, value) / cPI)
			Return ScaleRadiusPreserveReference(g, newR)
		Case "Nb"
			g.NBlades = Max(1, Min(16, Round(value)))
		Case "x0"
			g.RootCutout = Max(0.0, Min(0.95, value))
		Case "c0"
			g.ChordRoot = value
		Case "c1"
			g.ChordTip = value
		Case "taper"
			' keep sigmaRef: c0(1+t)/2 constant
			Dim t As Double = Max(0.01, Min(10.0, value))
			Dim cm As Double = 0.5 * (g.ChordRoot + g.ChordTip)
			g.ChordRoot = 2.0 * cm / (1.0 + t)
			g.ChordTip = t * g.ChordRoot
		Case "sigmaRef", "sigmaAct", "sigmaT", "AR", "Ab", "Aact"
			cur = GetGeometryQuantity(g, key)
			If cur <= 1.0e-12 Or value <= 0.0 Then Return g
			If key = "AR" Then
				scale = cur / value
			Else
				scale = value / cur
			End If
			g.ChordRoot = g.ChordRoot * scale
			g.ChordTip = g.ChordTip * scale
		Case "thRoot"
			g.ThetaRoot = value
		Case "thTip"
			g.ThetaTip = value
		Case "thTwist"
			mean = 0.5 * (g.ThetaRoot + g.ThetaTip)
			g.ThetaRoot = mean - 0.5 * value
			g.ThetaTip = mean + 0.5 * value
		Case "th75"
			Dim sh As Double = value - (g.ThetaRoot + (g.ThetaTip - g.ThetaRoot) * 0.75)
			g.ThetaRoot = g.ThetaRoot + sh
			g.ThetaTip = g.ThetaTip + sh
	End Select
	g.ThetaRoot = Max(-cPI / 2.0, Min(cPI / 2.0, g.ThetaRoot))
	g.ThetaTip = Max(-cPI / 2.0, Min(cPI / 2.0, g.ThetaTip))
	If key = "thRoot" Or key = "thTip" Or key = "thTwist" Or key = "th75" Then
		g.PitchMode = "linear_twist"
		g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
	End If
	Return ResolveSolidity(g)
End Sub

' Retorna a solidez local sigma(x)
Public Sub LocalSolidity(geom As RotorGeometry, x As Double) As Double
	Dim coeffs() As Double = GetSolidityCoeffs(geom)
	Return coeffs(0) + coeffs(1) * x
End Sub

' Obtém os coeficientes lineares do passo t0 e t1: theta(x) = t0 + t1 * x (em radianos)
Public Sub GetPitchCoeffs(geom As RotorGeometry) As Double()
	If geom.PitchMode = "constant" Then
		Return Array As Double(geom.Theta0, 0.0)
	End If
	Dim x0 As Double = geom.RootCutout
	Dim t1 As Double = (geom.ThetaTip - geom.ThetaRoot) / (1.0 - x0)
	Dim t0 As Double = geom.ThetaRoot - t1 * x0
	Return Array As Double(t0, t1)
End Sub

' Retorna o passo local theta(x) em radianos
Public Sub LocalPitch(geom As RotorGeometry, x As Double) As Double
	Dim coeffs() As Double = GetPitchCoeffs(geom)
	Return coeffs(0) + coeffs(1) * x
End Sub

' Fator de perda de ponta B de Prandtl/Sissingh
Public Sub GetBFactor(geom As RotorGeometry, ct As Double) As Double
	Dim x0 As Double = Max(0.0, Min(0.95, geom.RootCutout))
	If geom.TipLossMode = "none" Then Return 1.0
	If geom.TipLossMode = "fixed" Then Return Max(x0 + 0.01, Min(1.0, geom.TipLossB))
	If geom.TipLossMode = "sissingh" Then
		If ct <= 0 Then Return 1.0
		Dim nb As Int = Max(1, geom.NBlades)
		Dim b As Double = 1.0 - Sqrt(2.0 * ct) / nb
		Return Max(x0 + 0.01, Min(1.0, b))
	End If
	Return 1.0
End Sub

' Inclinação da curva de sustentação com correção de compressibilidade Prandtl-Glauert
Public Sub GetLiftSlope(geom As RotorGeometry, mu As Double, speedOfSound As Double) As Double
	If Not(geom.UsePrandtlGlauert) Then Return geom.LiftSlope0
	If speedOfSound <= 1.0 Then Return geom.LiftSlope0
	' Exact zBET reference definition: representative Mach at 75% radius.
	Dim omega As Double = geom.RPM * 2.0 * cPI / 60.0
	Dim vtip As Double = omega * geom.Radius
	Dim tipMach As Double = vtip / speedOfSound
	Dim mEff As Double = tipMach * Sqrt(0.75 * 0.75 + 0.5 * mu * mu)
	If mEff > 0.85 Then mEff = 0.85
	Return geom.LiftSlope0 / Sqrt(Max(0.01, 1.0 - mEff * mEff))
End Sub

' Calcula as integrais radiais puras J_n = integral_{x0}^B (x^n dx)
Public Sub RadialIntegralsJ(x0 As Double, b As Double) As Double()
	Dim j(8) As Double
	For n = 0 To 7
		j(n) = (Power(b, n + 1) - Power(x0, n + 1)) / (n + 1.0)
	Next
	Return j
End Sub

' Calcula os momentos radiais I_m (solidez) e T_m (solidez * passo)
Public Sub RadialMoments(geom As RotorGeometry, b As Double) As Object()
	Dim x0 As Double = geom.RootCutout
	Dim j() As Double = RadialIntegralsJ(x0, b)
	
	Dim s_coeffs() As Double = GetSolidityCoeffs(geom)
	Dim s0 As Double = s_coeffs(0)
	Dim s1 As Double = s_coeffs(1)
	
	Dim i_mom(6) As Double
	For m = 0 To 5
		i_mom(m) = s0 * j(m) + s1 * j(m + 1)
	Next
	
	Dim t_coeffs() As Double = GetPitchCoeffs(geom)
	Dim t0 As Double = t_coeffs(0)
	Dim t1 As Double = t_coeffs(1)
	
	Dim p0 As Double = s0 * t0
	Dim p1 As Double = s0 * t1 + s1 * t0
	Dim p2 As Double = s1 * t1
	
	Dim t_mom(6) As Double
	For m = 0 To 5
		t_mom(m) = p0 * j(m) + p1 * j(m + 1) + p2 * j(m + 2)
	Next
	
	Return Array(j, i_mom, t_mom)
End Sub

' Gradientes de influxo harmônico (Kx, Ky)
Public Sub InflowGradients(mu As Double, lam As Double, model As String, fx As Double, fy As Double) As Double()
	If model = "uniform" Then Return Array As Double(0.0, 0.0)
	
	Dim denom As Double = Sqrt(mu * mu + lam * lam) + Abs(lam)
	Dim tan_chi_half As Double = 0.0
	If denom > 1e-15 Then tan_chi_half = mu / denom
	
	Dim kx As Double = 0.0
	Dim ky As Double = 0.0
	If model = "coleman_simple" Then
		Return Array As Double(tan_chi_half, 0.0)
	Else If model = "coleman_feingold" Or model = "coleman" Then
		kx = fx * (15.0 * cPI / 32.0) * tan_chi_half
		ky = -fy * 2.0 * mu
		Return Array As Double(kx, ky)
	Else If model = "drees" Then
		kx = (4.0 / 3.0) * (1.0 - 1.8 * mu * mu) * tan_chi_half
		ky = -2.0 * mu
		Return Array As Double(kx, ky)
	End If
	
	Return Array As Double(0.0, 0.0)
End Sub

' Sustentação do BET analítica CT(lambda, lambda_1s)
Public Sub CT_BET(mu As Double, lam As Double, lambda_1s As Double, i_mom() As Double, t_mom() As Double, a As Double) As Double
	Return 0.5 * a * (t_mom(2) + 0.5 * mu * mu * t_mom(0) - (lam + 0.5 * mu * lambda_1s) * i_mom(1))
End Sub

' Solucionador de influxo via bissecção de alta precisão
Public Sub SolveInflow(mu As Double, mu_z As Double, geom As RotorGeometry, cond As FlightCondition, b_val As Double) As Double
	Dim moments() As Object = RadialMoments(geom, b_val)
	Dim i_mom() As Double = moments(1)
	Dim t_mom() As Double = moments(2)
	Dim lift_slope As Double = GetLiftSlope(geom, mu, cond.SpeedOfSound)
	
	Dim lo As Double = 0.0
	Dim lam_lo As Double = mu_z + lo
	Dim grad_lo() As Double = InflowGradients(mu, lam_lo, cond.InflowModel, cond.FxColeman, cond.FyColeman)
	Dim bet_lo As Double = CT_BET(mu, lam_lo, grad_lo(1) * lo, i_mom, t_mom, lift_slope)
	Dim mom_lo As Double = 2.0 * (b_val * b_val) * lo * Sqrt(mu * mu + lam_lo * lam_lo)
	Dim f_lo As Double = bet_lo - mom_lo
	
	If f_lo < 0.0 Then Return -1.0
	If Abs(f_lo) < 1e-14 Then Return 0.0
	
	Dim hi As Double = 0.1
	Dim f_hi As Double = 1.0
	For iter_bracket = 1 To 50
		Dim lam_hi As Double = mu_z + hi
		Dim grad_hi() As Double = InflowGradients(mu, lam_hi, cond.InflowModel, cond.FxColeman, cond.FyColeman)
		Dim bet_hi As Double = CT_BET(mu, lam_hi, grad_hi(1) * hi, i_mom, t_mom, lift_slope)
		Dim mom_hi As Double = 2.0 * (b_val * b_val) * hi * Sqrt(mu * mu + lam_hi * lam_hi)
		f_hi = bet_hi - mom_hi
		If f_hi <= 0.0 Or hi >= 100.0 Then Exit
		hi = hi * 2.0
	Next
	If f_hi > 0.0 Then Return -1.0
	
	' Bissecção
	For iter_bisect = 1 To 150
		Dim mid As Double = 0.5 * (lo + hi)
		Dim lam_mid As Double = mu_z + mid
		Dim grad_mid() As Double = InflowGradients(mu, lam_mid, cond.InflowModel, cond.FxColeman, cond.FyColeman)
		Dim bet_mid As Double = CT_BET(mu, lam_mid, grad_mid(1) * mid, i_mom, t_mom, lift_slope)
		Dim mom_mid As Double = 2.0 * (b_val * b_val) * mid * Sqrt(mu * mu + lam_mid * lam_mid)
		Dim f_mid As Double = bet_mid - mom_mid
		
		If Abs(f_mid) < 1e-13 Or (hi - lo) < 1e-13 Then Return mid
		If f_mid > 0.0 Then
			lo = mid
		Else
			hi = mid
		End If
	Next
	Return 0.5 * (lo + hi)
End Sub

' Torque induzido via integral direta BET (analytical_bet)
Public Sub InducedTorqueBET(mu As Double, lam As Double, l1c As Double, l1s As Double, geom As RotorGeometry, b_val As Double, a As Double) As Double
	InitGaussQuadrature
	Dim x0 As Double = geom.RootCutout
	If b_val <= x0 Then Return 0.0
	
	Dim sum_val As Double = 0.0
	Dim half_span As Double = 0.5 * (b_val - x0)
	
	For i = 0 To 15
		Dim x As Double = half_span * (GL_X16(i) + 1.0) + x0
		Dim sig_x As Double = LocalSolidity(geom, x)
		Dim th_x As Double = LocalPitch(geom, x)
		Dim integrand As Double = 0.5 * sig_x * a * ( _
			(lam + 0.5 * mu * l1s) * th_x * x * x _
			- lam * lam * x _
			- 0.5 * (l1c * l1c + l1s * l1s) * Power(x, 3) _
		)
		sum_val = sum_val + half_span * GL_W16(i) * integrand
	Next
	Return sum_val
End Sub

' Coeficientes de arrasto de perfil CH0 e CQ0
Public Sub ProfileDrag(mu As Double, mu_z As Double, geom As RotorGeometry, model As String) As Double()
	Dim x0 As Double = geom.RootCutout
	Dim j() As Double = RadialIntegralsJ(x0, 1.0) ' Arrasto de perfil se estende até a ponta física x=1
	Dim s_coeffs() As Double = GetSolidityCoeffs(geom)
	Dim i1 As Double = s_coeffs(0) * j(1) + s_coeffs(1) * j(2)
	Dim i3 As Double = s_coeffs(0) * j(3) + s_coeffs(1) * j(4)
	Dim cd0 As Double = geom.Cd0
	
	Dim ch0 As Double = 0.0
	Dim cq0 As Double = 0.0
	If model = "analytical_tangential" Then
		ch0 = cd0 * mu * i1 / 2.0
		cq0 = cd0 / 2.0 * (i3 + 0.5 * mu * mu * i1)
		Return Array As Double(ch0, cq0)
	Else If model = "analytical_vectorial" Then
		ch0 = 0.75 * cd0 * mu * i1
		cq0 = 0.5 * cd0 * (i3 + (0.75 * mu * mu + 0.5 * mu_z * mu_z) * i1)
		Return Array As Double(ch0, cq0)
	End If
	
	' numerical_vectorial (Quadratura de Gauss-Legendre 2D)
	InitGaussQuadrature
	Dim half_r As Double = 0.5 * (1.0 - x0)
	Dim ch0_sum As Double = 0.0
	Dim cq0_sum As Double = 0.0
	
	For ir = 0 To 15
		Dim r_station As Double = half_r * (GL_X16(ir) + 1.0) + x0
		Dim r_weight As Double = half_r * GL_W16(ir)
		Dim sig_r As Double = LocalSolidity(geom, r_station)
		Dim factor As Double = sig_r * cd0 / 2.0
		
		For ip = 0 To 23
			Dim psi As Double = cPI * (GL_X24(ip) + 1.0)
			Dim psi_weight As Double = 0.5 * GL_W24(ip)
			
			Dim sin_p As Double = Sin(psi)
			Dim cos_p As Double = Cos(psi)
			Dim u_t As Double = r_station + mu * sin_p
			Dim u_r As Double = mu * cos_p
			Dim total_w As Double = Sqrt(u_t * u_t + u_r * u_r + mu_z * mu_z)
			
			Dim w_elem As Double = r_weight * psi_weight * factor * total_w
			ch0_sum = ch0_sum + w_elem * (r_station * sin_p + mu)
			cq0_sum = cq0_sum + w_elem * u_t * r_station
		Next
	Next
	
	Return Array As Double(ch0_sum, cq0_sum)
End Sub

' Applies the operating RPM and a uniform collective increment to the saved blade incidence law.
Private Sub ApplyOperatingGeometry(baseGeom As RotorGeometry, rpm As Double, collectiveDeg As Double) As RotorGeometry
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(baseGeom))
	g.RPM = Max(1.0, Min(30000.0, rpm))
	Dim dtheta As Double = collectiveDeg * cPI / 180.0
	g.PitchMode = "linear_twist"
	g.ThetaRoot = baseGeom.ThetaRoot + dtheta
	g.ThetaTip = baseGeom.ThetaTip + dtheta
	g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)
	Return ResolveSolidity(g)
End Sub

' Resolves the selected dimensional/nondimensional flight-condition representations
' using the candidate operating RPM. This makes RPM trim consistent with Vx and Vz inputs.
Public Sub ResolveConditionAtRPM(src As FlightCondition, geom As RotorGeometry) As FlightCondition
	Dim c As FlightCondition = SanitizeCondition(src)
	Dim omega As Double = geom.RPM * 2.0 * cPI / 60.0
	Dim vtip As Double = Max(1.0e-9, omega * geom.Radius)
	If c.HorizontalMode = "vx" Then
		c.Mu = Max(-0.60, Min(0.60, c.HorizontalValue / vtip))
	Else
		c.Mu = Max(-0.60, Min(0.60, c.HorizontalValue))
	End If
	c.MuZ = Max(-0.50, Min(0.50, ResolveMuZ(c.Mu, c.AxialMode, c.AxialValue, vtip)))
	c.RPM = geom.RPM
	Return c
End Sub

Private Sub CandidateResult(baseGeom As RotorGeometry, sourceCond As FlightCondition, rpm As Double, collectiveDeg As Double) As RotorResults
	Dim g As RotorGeometry = ApplyOperatingGeometry(baseGeom, rpm, collectiveDeg)
	Dim c As FlightCondition = ResolveConditionAtRPM(sourceCond, g)
	c.OperatingPair = "rpm_collective"
	c.RPM = g.RPM
	c.CollectiveDeg = collectiveDeg
	Return CalculateCoreResolvedMode(g, c, False)
End Sub

Private Sub CandidateResidual(baseGeom As RotorGeometry, sourceCond As FlightCondition, rpm As Double, collectiveDeg As Double, targetKind As String, targetValue As Double) As Object()
	Dim res As RotorResults = CandidateResult(baseGeom, sourceCond, rpm, collectiveDeg)
	If res.SolutionValid = False Then Return Array(0.0, False)
	Dim value As Double
	If targetKind = "thrust" Then
		value = res.ThrustN
	Else
		value = res.CT
	End If
	Return Array(value - targetValue, True)
End Sub

Private Sub SolveCollective(baseGeom As RotorGeometry, sourceCond As FlightCondition, rpm As Double, targetKind As String, targetValue As Double) As Object()
	Dim lo As Double = -60.0
	Dim hi As Double = 60.0
	Dim prevX As Double = lo
	Dim prevObj() As Object = CandidateResidual(baseGeom, sourceCond, rpm, prevX, targetKind, targetValue)
	Dim found As Boolean = False
	Dim fLo As Double = 0.0
	Dim fHi As Double = 0.0
	If prevObj(1) Then fLo = prevObj(0)
	For i = 1 To 48
		Dim x As Double = lo + i * (hi - lo) / 48.0
		Dim obj() As Object = CandidateResidual(baseGeom, sourceCond, rpm, x, targetKind, targetValue)
		If prevObj(1) And obj(1) Then
			' Rebind the residual to the actual previous valid sample. Invalid
			' candidates can precede the first valid pair in the scan.
			fLo = prevObj(0)
			Dim f As Double = obj(0)
			If Abs(f) < 1.0e-10 Then Return Array(x, True)
			If (fLo <= 0 And f >= 0) Or (fLo >= 0 And f <= 0) Then
				lo = prevX
				hi = x
				fHi = f
				found = True
				Exit
			End If
			fLo = f
		End If
		prevX = x
		prevObj = obj
	Next
	If found = False Then Return Array(sourceCond.CollectiveDeg, False)
	For iter = 1 To 80
		Dim mid As Double = 0.5 * (lo + hi)
		Dim midObj() As Object = CandidateResidual(baseGeom, sourceCond, rpm, mid, targetKind, targetValue)
		If midObj(1) = False Then Return Array(sourceCond.CollectiveDeg, False)
		Dim fm As Double = midObj(0)
		If Abs(fm) < 1.0e-9 Or Abs(hi - lo) < 1.0e-8 Then Return Array(mid, True)
		If (fLo <= 0 And fm >= 0) Or (fLo >= 0 And fm <= 0) Then
			hi = mid
			fHi = fm
		Else
			lo = mid
			fLo = fm
		End If
	Next
	Return Array(0.5 * (lo + hi), True)
End Sub

Private Sub AddDistinctRPMRoot(roots As List, candidate As Double)
	Dim tol As Double = Max(0.05, 1.0e-5 * Max(1.0, Abs(candidate)))
	For rootIndex = 0 To roots.Size - 1
		Dim existing As Double = roots.Get(rootIndex)
		If Abs(existing - candidate) <= tol Then Return
	Next
	roots.Add(candidate)
End Sub

Private Sub BisectRPMBracket(baseGeom As RotorGeometry, sourceCond As FlightCondition, collectiveDeg As Double, targetKind As String, targetValue As Double, lo As Double, hi As Double, fLo As Double) As Object()
	For iter = 1 To 90
		Dim mid As Double = 0.5 * (lo + hi)
		Dim midObj() As Object = CandidateResidual(baseGeom, sourceCond, mid, collectiveDeg, targetKind, targetValue)
		If midObj(1) = False Then Return Array(sourceCond.RPM, False)
		Dim fm As Double = midObj(0)
		If Abs(fm) < 1.0e-9 Or Abs(hi - lo) < 1.0e-7 Then Return Array(mid, True)
		If (fLo <= 0 And fm >= 0) Or (fLo >= 0 And fm <= 0) Then
			hi = mid
		Else
			lo = mid
			fLo = fm
		End If
	Next
	Return Array(0.5 * (lo + hi), True)
End Sub

Private Sub NearestRPMRoot(roots As List, seedRPM As Double) As Double
	Dim best As Double = roots.Get(0)
	Dim bestDistance As Double = Abs(best - seedRPM)
	For rootIndex = 1 To roots.Size - 1
		Dim candidate As Double = roots.Get(rootIndex)
		Dim distance As Double = Abs(candidate - seedRPM)
		If distance < bestDistance Then
			best = candidate
			bestDistance = distance
		End If
	Next
	Return best
End Sub

' Returns Array(rpm, success, root_status), where root_status is none | unique | multiple.
Private Sub SolveRPM(baseGeom As RotorGeometry, sourceCond As FlightCondition, collectiveDeg As Double, targetKind As String, targetValue As Double) As Object()
	Dim roots As List
	roots.Initialize
	Dim prevRPM As Double = 10.0
	Dim prevObj() As Object = CandidateResidual(baseGeom, sourceCond, prevRPM, collectiveDeg, targetKind, targetValue)
	Dim prevValid As Boolean = prevObj(1)
	Dim prevF As Double = 0.0
	If prevValid Then
		prevF = prevObj(0)
		If Abs(prevF) < 1.0e-9 Then AddDistinctRPMRoot(roots, prevRPM)
	End If
	
	For i = 1 To 80
		Dim rpmCandidate As Double = 10.0 * Power(3000.0, i / 80.0)
		Dim obj() As Object = CandidateResidual(baseGeom, sourceCond, rpmCandidate, collectiveDeg, targetKind, targetValue)
		Dim currentValid As Boolean = obj(1)
		If currentValid Then
			Dim f As Double = obj(0)
			If Abs(f) < 1.0e-9 Then AddDistinctRPMRoot(roots, rpmCandidate)
			If prevValid And prevF * f < 0.0 Then
				Dim bracket() As Object = BisectRPMBracket(baseGeom, sourceCond, collectiveDeg, targetKind, targetValue, prevRPM, rpmCandidate, prevF)
				If bracket(1) Then AddDistinctRPMRoot(roots, bracket(0))
			End If
			prevF = f
		End If
		prevRPM = rpmCandidate
		prevValid = currentValid
	Next
	
	If roots.Size = 0 Then Return Array(sourceCond.RPM, False, "none")
	If targetKind = "ct" And roots.Size <> 1 Then Return Array(sourceCond.RPM, False, "multiple")
	
	Dim selectedRPM As Double = NearestRPMRoot(roots, sourceCond.RPM)
	Dim status As String = "unique"
	If roots.Size > 1 Then status = "multiple"
	Return Array(selectedRPM, True, status)
End Sub

' Resolves the selected pair among RPM, collective, CT and thrust at the current flight condition.
' Returns Array(resolved geometry, resolved condition, status string).
Public Sub ResolveOperatingState(geom As RotorGeometry, cond As FlightCondition) As Object()
	Dim baseGeom As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	Dim c As FlightCondition = SanitizeCondition(cond)
	Dim rpm As Double = c.RPM
	Dim collective As Double = c.CollectiveDeg
	Dim ok As Boolean = True
	Dim status As String = "VALID"
	Select c.OperatingPair
		Case "rpm_collective"
			' Both operating variables are prescribed.
		Case "rpm_ct"
			If c.TargetCT <= 0 Then
				ok = False
			Else
				Dim scCT() As Object = SolveCollective(baseGeom, c, rpm, "ct", c.TargetCT)
				collective = scCT(0): ok = scCT(1)
			End If
		Case "rpm_thrust"
			If c.TargetThrustN <= 0 Then
				ok = False
			Else
				Dim scThrust() As Object = SolveCollective(baseGeom, c, rpm, "thrust", c.TargetThrustN)
				collective = scThrust(0): ok = scThrust(1)
			End If
		Case "collective_ct"
			If c.TargetCT <= 0 Then
				ok = False
				status = "INVALID: Collective + CT target must be positive"
			Else If c.HorizontalMode = "mu" And c.AxialMode <> "vz" And baseGeom.UsePrandtlGlauert = False Then
				' With only nondimensional flow inputs and no RPM-dependent compressibility,
				' CT is scale-free: collective + CT cannot determine a unique RPM.
				ok = False
				status = "INVALID: Collective + CT is non-unique at this flight/model state"
			Else
				Dim srCT() As Object = SolveRPM(baseGeom, c, collective, "ct", c.TargetCT)
				rpm = srCT(0): ok = srCT(1)
				If ok = False Then
					If srCT(2) = "multiple" Then
						status = "INVALID: Collective + CT is non-unique at this flight/model state"
					Else
						status = "INVALID: Collective + CT has no RPM solution at this flight/model state"
					End If
				End If
			End If
		Case "collective_thrust"
			If c.TargetThrustN <= 0 Then
				ok = False
			Else
				Dim srThrust() As Object = SolveRPM(baseGeom, c, collective, "thrust", c.TargetThrustN)
				rpm = srThrust(0): ok = srThrust(1)
			End If
		Case "ct_thrust"
			If c.TargetCT <= 0 Or c.TargetThrustN <= 0 Then
				ok = False
			Else
				Dim area As Double = cPI * baseGeom.Radius * baseGeom.Radius
				Dim vtipReq As Double = Sqrt(c.TargetThrustN / (c.Rho * area * c.TargetCT))
				rpm = vtipReq / baseGeom.Radius * 60.0 / (2.0 * cPI)
				If rpm < 1.0 Or rpm > 30000.0 Then
					ok = False
				Else
					Dim scBoth() As Object = SolveCollective(baseGeom, c, rpm, "ct", c.TargetCT)
					collective = scBoth(0): ok = scBoth(1)
				End If
			End If
		End Select
	If ok = False And status = "VALID" Then
		status = "INVALID: selected operating constraints could not be trimmed"
		If baseGeom.RootCutout >= 0.95 Then status = status & ". Root cutout x_0 is at the 0.95 limit"
	End If
	Dim resolvedGeom As RotorGeometry = ApplyOperatingGeometry(baseGeom, rpm, collective)
	Dim resolvedCond As FlightCondition = ResolveConditionAtRPM(c, resolvedGeom)
	resolvedCond.RPM = resolvedGeom.RPM
	resolvedCond.CollectiveDeg = collective
	Return Array(resolvedGeom, resolvedCond, status)
End Sub

Public Sub ResolveOperatingGeometry(geom As RotorGeometry, cond As FlightCondition) As RotorGeometry
	Dim state() As Object = ResolveOperatingState(geom, cond)
	Return state(0)
End Sub

Public Sub ResolveOperatingCondition(geom As RotorGeometry, cond As FlightCondition) As FlightCondition
	Dim state() As Object = ResolveOperatingState(geom, cond)
	Return state(1)
End Sub

Public Sub Calculate(geom As RotorGeometry, cond As FlightCondition) As RotorResults
	Dim state() As Object = ResolveOperatingState(geom, cond)
	Dim status As String = state(2)
	If status <> "VALID" Then
		Dim invalid As RotorResults
		invalid.Initialize
		invalid.SolutionValid = False
		invalid.StatusMessage = status
		Dim invalidGeom As RotorGeometry = state(0)
		invalid.ValidityWarning = InputLimitNotes(geom, cond, invalidGeom.RPM)
		Return invalid
	End If
	Dim g As RotorGeometry = state(0)
	Dim c As FlightCondition = state(1)
	Dim result As RotorResults = CalculateCoreResolved(g, c)
	result.ValidityWarning = JoinWarnings(InputLimitNotes(geom, cond, g.RPM), result.ValidityWarning)
	Return result
End Sub

' Núcleo aerodinâmico para geometria/condição já resolvidas.
Private Sub CalculateCoreResolved(geom As RotorGeometry, cond As FlightCondition) As RotorResults
	Return CalculateCoreResolvedMode(geom, cond, True)
End Sub

' FullResults=False is used only by trim residuals. It solves the identical
' inflow/CT/Sissingh loading state, then returns before profile drag/torque work.
Private Sub CalculateCoreResolvedMode(geom As RotorGeometry, cond As FlightCondition, FullResults As Boolean) As RotorResults
	Dim res As RotorResults
	res.Initialize
	res.SolutionValid = True
	res.CompressibilityWarning = False
	res.CompressibilityInvalid = False
	res.StatusMessage = "VALID"
	res.ValidityWarning = ""
	
	' Caller already supplied the resolved operating RPM, collective and kinematics.
	Dim c As FlightCondition = SanitizeCondition(cond)
	Dim g As RotorGeometry = ResolveSolidity(CloneGeometry(geom))
	
	' 2. Parâmetros Cinemáticos Globais
	Dim diskArea As Double = cPI * g.Radius * g.Radius
	Dim omega As Double = g.RPM * 2.0 * cPI / 60.0
	Dim vtip As Double = omega * g.Radius
	Dim dynP As Double = c.Rho * diskArea * (vtip * vtip)
	
	res.TipSpeed = vtip
	res.TrimmedRPM = g.RPM
	res.TrimmedCollectiveDeg = c.CollectiveDeg
	res.TrimmedTheta0Deg = 0.5 * (g.ThetaRoot + g.ThetaTip) * 180.0 / cPI
	res.OperatingMu = c.Mu
	res.OperatingMuZ = c.MuZ
	res.OperatingVx = c.Mu * vtip
	res.OperatingVz = c.MuZ * vtip
	res.OperatingAlphaDeg = AlphaFromMuZ(c.Mu, c.MuZ)
	res.AltitudeM = c.AltitudeM
	res.TemperatureC = c.TemperatureC
	res.DensityRho = c.Rho
	res.PressurePa = c.PressurePa
	res.SpeedOfSound = c.SpeedOfSound
	
	' Mach da pá avançante
	' The advancing blade sees Omega*r plus the in-plane flow speed |mu|*Omega*R in forward and rearward flight.
	res.AdvancingTipMach = vtip * (1.0 + Abs(c.Mu)) / c.SpeedOfSound
	res.EffectiveLiftSlope = GetLiftSlope(g, c.Mu, c.SpeedOfSound)
	If g.UsePrandtlGlauert And res.AdvancingTipMach >= 0.80 Then
		res.CompressibilityWarning = True
		If res.AdvancingTipMach >= 1.0 Then res.CompressibilityInvalid = True
		res.StatusMessage = "CAUTION: Prandtl-Glauert outside recommended Mat < 0.80 range"
	End If
	
	' 3. Determina fator de perda de ponta B iterativo
	Dim b_val As Double = 1.0
	If g.TipLossMode = "fixed" Then
		b_val = g.TipLossB
	Else If g.TipLossMode = "sissingh" Then
		' Estima CT inicial para obter B
		b_val = 0.97
	End If
	
	' 4. Resolve velocidade induzida lambda_i
	Dim lambda_i As Double = SolveInflow(c.Mu, c.MuZ, g, c, b_val)
	If lambda_i < 0 Then
		res.SolutionValid = False
		res.StatusMessage = "INVALID: no physical inflow root was bracketed"
		If g.RootCutout >= 0.95 Then res.StatusMessage = res.StatusMessage & ". Root cutout x_0 is at the 0.95 limit"
		Return res
	End If
	Dim lambda_total As Double = c.MuZ + lambda_i
	
	' 5. Gradientes de Influxo
	Dim grads() As Double = InflowGradients(c.Mu, lambda_total, c.InflowModel, c.FxColeman, c.FyColeman)
	Dim kx As Double = grads(0)
	Dim ky As Double = grads(1)
	Dim lambda_1c As Double = kx * lambda_i
	Dim lambda_1s As Double = ky * lambda_i
	
	res.InflowLambda = lambda_total
	res.InflowLambdaI = lambda_i
	res.InflowKx = kx
	res.InflowKy = ky
	
	' Ângulo de inclinação da esteira chi
	Dim denom_chi As Double = Sqrt(c.Mu * c.Mu + lambda_total * lambda_total) + Abs(lambda_total)
	If denom_chi > 1e-15 Then
		res.WakeSkewChiDeg = 2.0 * ATan(c.Mu / denom_chi) * 180.0 / cPI
	Else
		res.WakeSkewChiDeg = 0.0
	End If
	
	' 6. Momentos Radiais e Forças Aerodinâmicas BET
	Dim moments() As Object = RadialMoments(g, b_val)
	Dim i_mom() As Double = moments(1)
	Dim t_mom() As Double = moments(2)
	
	Dim ct_val As Double = CT_BET(c.Mu, lambda_total, lambda_1s, i_mom, t_mom, res.EffectiveLiftSlope)
	res.CT = ct_val
	
	' Sissingh requires B and CT to be mutually consistent. Iterate to convergence.
	If g.TipLossMode = "sissingh" And ct_val > 0 Then
		For iter_tip = 1 To 8
			Dim nextB As Double = GetBFactor(g, ct_val)
			Dim deltaB As Double = Abs(nextB - b_val)
			b_val = nextB
			lambda_i = SolveInflow(c.Mu, c.MuZ, g, c, b_val)
			If lambda_i < 0 Then
				res.SolutionValid = False
				res.StatusMessage = "INVALID: no physical inflow root after tip-loss update"
				If g.RootCutout >= 0.95 Then res.StatusMessage = res.StatusMessage & ". Root cutout x_0 is at the 0.95 limit"
				Return res
			End If
			lambda_total = c.MuZ + lambda_i
			grads = InflowGradients(c.Mu, lambda_total, c.InflowModel, c.FxColeman, c.FyColeman)
			kx = grads(0)
			ky = grads(1)
			lambda_1c = kx * lambda_i
			lambda_1s = ky * lambda_i
			moments = RadialMoments(g, b_val)
			i_mom = moments(1)
			t_mom = moments(2)
			ct_val = CT_BET(c.Mu, lambda_total, lambda_1s, i_mom, t_mom, res.EffectiveLiftSlope)
			res.CT = ct_val
			If deltaB < 1e-8 Then Exit
		Next
		res.InflowLambda = lambda_total
		res.InflowLambdaI = lambda_i
		res.InflowKx = kx
		res.InflowKy = ky
		' Wake skew must use the converged Sissingh inflow, not the pre-iteration value.
		denom_chi = Sqrt(c.Mu * c.Mu + lambda_total * lambda_total) + Abs(lambda_total)
		If denom_chi > 1e-15 Then
			res.WakeSkewChiDeg = 2.0 * ATan(c.Mu / denom_chi) * 180.0 / cPI
		Else
			res.WakeSkewChiDeg = 0.0
		End If
	End If
	res.BFactor = b_val
	If res.InflowLambda < 0.0 Then res.ValidityWarning = "Outside model validity: vortex ring state / windmill region"
	
	If FullResults = False Then
		' Trim residuals need only CT and dimensional thrust.
		res.ThrustN = ct_val * dynP
		res.ThrustKgf = res.ThrustN / 9.80665
		res.ThrustLbf = res.ThrustN * 0.224808943
		Return res
	End If
	
	' Força longitudinal induzida CHi
	res.CHi = (res.EffectiveLiftSlope / 4.0) * ( _
		lambda_total * c.Mu * t_mom(0) + lambda_1s * (t_mom(2) - 2.0 * lambda_total * i_mom(1)) _
	)
	
	' Força lateral CY
	res.CY = -(res.EffectiveLiftSlope * lambda_1c / 4.0) * (t_mom(2) - 2.0 * lambda_total * i_mom(1))
	
	' Momentos de rolamento e arfagem
	res.CMx = -(res.EffectiveLiftSlope * c.Mu / 2.0) * (t_mom(2) - 0.5 * lambda_total * i_mom(1)) + _
		(res.EffectiveLiftSlope * lambda_1s / 4.0) * i_mom(3)
	res.CMy = (res.EffectiveLiftSlope * lambda_1c / 4.0) * i_mom(3)
	
	' 7. Arrasto de Perfil (CH0, CQ0)
	Dim profDrag() As Double = ProfileDrag(c.Mu, c.MuZ, g, "numerical_vectorial")
	res.CH0 = profDrag(0)
	res.CQ0 = profDrag(1)
	res.CH = res.CHi + res.CH0
	
	' 8. Torque Induzido e Potência
	If c.InducedTorqueModel = "analytical_bet" Then
		res.CQi = InducedTorqueBET(c.Mu, lambda_total, lambda_1c, lambda_1s, g, b_val, res.EffectiveLiftSlope)
	Else ' energy_balance padrão
		res.CQi = c.KInd * lambda_i * ct_val + c.MuZ * ct_val - c.Mu * res.CHi
	End If
	
	res.CQ = res.CQi + res.CQ0
	
	' Potência do Ar (CPair) via balanço de energia
	res.CPair = c.KInd * lambda_i * ct_val + c.MuZ * ct_val + res.CQ0 + c.Mu * res.CH0
	
	' Eficiência L/D efetiva e Figura de Mérito
	If res.CPair > 1e-9 Then
		res.L_D_eff = ct_val * c.Mu / res.CPair
	Else
		res.L_D_eff = 0.0
	End If
	
	Dim idealHoverPower As Double = 0.0
	If ct_val > 0 Then idealHoverPower = Power(ct_val, 1.5) / Sqrt(2.0)
	Dim cpFoM As Double = c.KInd * idealHoverPower + res.CQ0
	If cpFoM > 1e-9 Then
		res.FoM = idealHoverPower / cpFoM
	Else
		res.FoM = 0.0
	End If
	
	' 9. Grandezas Dimensionais
	res.ThrustN = ct_val * dynP
	res.ThrustKgf = res.ThrustN / 9.80665
	res.ThrustLbf = res.ThrustN * 0.224808943
	
	res.DragHN = res.CH * dynP
	res.SideForceYN = res.CY * dynP
	res.SideForceYLbf = res.SideForceYN * 0.224808943
	res.TorqueNm = res.CQ * dynP * g.Radius
	res.TorqueLbft = res.TorqueNm * 0.737562149
	res.RollMomentNm = res.CMx * dynP * g.Radius
	res.RollMomentLbft = res.RollMomentNm * 0.737562149
	res.PitchMomentNm = res.CMy * dynP * g.Radius
	res.PitchMomentLbft = res.PitchMomentNm * 0.737562149
	
	res.PowerShaftW = res.TorqueNm * omega
	res.PowerShaftKW = res.PowerShaftW / 1000.0
	res.PowerShaftHP = res.PowerShaftW / 745.699872
	If c.MuZ < 0.0 And res.PowerShaftW < 0.0 Then res.ValidityWarning = "Outside model validity: vortex ring state / windmill region"
	res.PhiAdv25 = SectionPhi(g, res, 0.25, 1)
	res.PhiRet25 = SectionPhi(g, res, 0.25, -1)
	Dim pitch25 As Double = LocalPitch(g, 0.25) * 180.0 / cPI
	res.AoAAdv25 = pitch25 - res.PhiAdv25
	res.AoARet25 = pitch25 - res.PhiRet25

	res.PhiAdv50 = SectionPhi(g, res, 0.50, 1)
	res.PhiRet50 = SectionPhi(g, res, 0.50, -1)
	Dim pitch50 As Double = LocalPitch(g, 0.50) * 180.0 / cPI
	res.AoAAdv50 = pitch50 - res.PhiAdv50
	res.AoARet50 = pitch50 - res.PhiRet50

	res.PhiAdv75 = SectionPhi(g, res, 0.75, 1)
	res.PhiRet75 = SectionPhi(g, res, 0.75, -1)
	Dim pitch75 As Double = LocalPitch(g, 0.75) * 180.0 / cPI
	res.AoAAdv75 = pitch75 - res.PhiAdv75
	res.AoARet75 = pitch75 - res.PhiRet75

	res.PhiAdvTip = SectionPhi(g, res, 1.0, 1)
	res.PhiRetTip = SectionPhi(g, res, 1.0, -1)
	Dim pitchTip As Double = LocalPitch(g, 1.0) * 180.0 / cPI
	res.AoAAdvTip = pitchTip - res.PhiAdvTip
	res.AoARetTip = pitchTip - res.PhiRetTip
	
	Return res
End Sub

' ---------------------------------------------------------------------------
' Derived output helpers (pure post-processing of RotorResults; no physics change).
' Undefined values are returned as NaN; callers test with a finite check and show an en dash.
' ---------------------------------------------------------------------------
Public Sub NaNValue As Double
	Dim z As Double = 0
	Return z / z
End Sub

Public Sub RotorArea(geom As RotorGeometry) As Double
	Return cPI * geom.Radius * geom.Radius
End Sub

' Free-stream speed V_inf = sqrt(Vx^2 + Vz^2) [m/s].
Public Sub FreestreamSpeed(res As RotorResults) As Double
	Return Sqrt(res.OperatingVx * res.OperatingVx + res.OperatingVz * res.OperatingVz)
End Sub

' mu_x / lambda; undefined when |lambda| is tiny.
Public Sub DerivedMuOverLambda(res As RotorResults) As Double
	If Abs(res.InflowLambda) < 0.0001 Then Return NaNValue
	Return res.OperatingMu / res.InflowLambda
End Sub

' Propulsive-style thrust coefficient T / (0.5 rho Vinf^2 A); undefined near hover.
Public Sub DerivedTc(res As RotorResults, area As Double) As Double
	Dim v As Double = FreestreamSpeed(res)
	If v < 0.01 Or area <= 0 Or res.DensityRho <= 0 Then Return NaNValue
	Return res.ThrustN / (0.5 * res.DensityRho * v * v * area)
End Sub

' Power coefficient P / (0.5 rho Vinf^3 A); undefined near hover.
Public Sub DerivedPc(res As RotorResults, area As Double) As Double
	Dim v As Double = FreestreamSpeed(res)
	If v < 0.01 Or area <= 0 Or res.DensityRho <= 0 Then Return NaNValue
	Return res.PowerShaftW / (0.5 * res.DensityRho * v * v * v * area)
End Sub

' Hover-equivalent induced inflow ratio sqrt(CT/2); undefined for CT < 0.
Public Sub DerivedLambdaH(res As RotorResults) As Double
	If res.CT < 0 Then Return NaNValue
	Return Sqrt(res.CT / 2)
End Sub

' Mean lift coefficient 6 CT / sigma (sigma = thrust-weighted solidity, same as CT/sigma).
Public Sub DerivedClBar(res As RotorResults, sigma As Double) As Double
	If sigma <= 0 Then Return NaNValue
	Return 6 * res.CT / sigma
End Sub

' Section diagnostic at radial station x, psi=90 (side=1) / 270 (side=-1) degrees. Normal forward flow only.
' Johnson/Leishman section kinematics; docs/zBET-documentation.md section 6.1.
Private Sub SectionPhi(g As RotorGeometry, res As RotorResults, x As Double, side As Double) As Double
	If x < g.RootCutout Then Return NaNValue
	If x <= 0.75 And res.BFactor < x Then Return NaNValue
	Dim ut As Double = x + side * res.OperatingMu
	If ut <= 1e-9 Then Return NaNValue
	Dim up As Double = res.InflowLambda + x * side * res.InflowKy * res.InflowLambdaI
	Return ATan(up / ut) * 180.0 / cPI
End Sub

Private Sub SectionPhi75(g As RotorGeometry, res As RotorResults, side As Double) As Double
	Return SectionPhi(g, res, 0.75, side)
End Sub

Public Sub DerivedOutput(res As RotorResults, key As String) As Double
	Select key
		Case "vi": Return res.InflowLambdaI * res.TipSpeed
		Case "Vztot": Return res.InflowLambda * res.TipSpeed
		Case "Vadv": Return res.TipSpeed + res.OperatingVx
		Case "Vret": Return res.TipSpeed - res.OperatingVx
		Case "Mret"
			If res.SpeedOfSound <= 0 Then Return NaNValue
			Return Abs(res.TipSpeed - res.OperatingVx) / res.SpeedOfSound
		Case "aoaAdv25": Return res.AoAAdv25
		Case "aoaRet25": Return res.AoARet25
		Case "phiAdv25": Return res.PhiAdv25
		Case "phiRet25": Return res.PhiRet25
		Case "aoaAdv50": Return res.AoAAdv50
		Case "aoaRet50": Return res.AoARet50
		Case "phiAdv50": Return res.PhiAdv50
		Case "phiRet50": Return res.PhiRet50
		Case "aoaAdv75": Return res.AoAAdv75
		Case "aoaRet75": Return res.AoARet75
		Case "phiAdv75": Return res.PhiAdv75
		Case "phiRet75": Return res.PhiRet75
		Case "aoaAdvTip", "aoaAdv100": Return res.AoAAdvTip
		Case "aoaRetTip", "aoaRet100": Return res.AoARetTip
		Case "phiAdvTip", "phiAdv100": Return res.PhiAdvTip
		Case "phiRetTip", "phiRet100": Return res.PhiRetTip
	End Select
	Return NaNValue
End Sub
