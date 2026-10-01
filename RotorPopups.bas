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
	Public SweepParamLabels As List
	Type SweepPoint (CurveLabel As String, Mu As Double, Vx As Double, AxialMode As String, AxialValue As Double, _
		MuZ As Double, InflowModel As String, Value As Double, Valid As Boolean, RPM As Double, _
		CollectiveDeg As Double, CT As Double, ThrustN As Double)
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

Private Sub SweepParamDisplayName(paramKey As String) As String
	Select paramKey
		Case "CT": Return "CT — Thrust Coeff"
		Case "CP", "CQ": Return "CQ — Torque Coeff"
		Case "CQi": Return "CQ,i — Induced Coeff"
		Case "CQ0": Return "CQ,0 — Profile Coeff"
		Case "CH": Return "CH — In-Plane"
		Case "CHi": Return "CH,i — Induced H"
		Case "CH0": Return "CH,0 — Profile H"
		Case "CY": Return "CY — Side Force"
		Case "CMx": Return "CMx — Roll Moment"
		Case "CMy": Return "CMy — Pitch Moment"
		Case "CPair": Return "CP,air — Air Power"
		Case "lambda": Return "λ — Total Inflow"
		Case "lambda_i": Return "λi — Induced Inflow"
		Case "L_D_eff": Return "(L/D)eff — Effective L/D"
		Case "FoM": Return "FM — Figure of Merit"
		Case "Kx": Return "Kx — Longitudinal Inflow"
		Case "Ky": Return "Ky — Lateral Inflow"
		Case "chi": Return "χ — Wake Skew Angle [deg]"
		Case "Mat": Return "Madv — Advancing Mach"
		Case "PowerKW": Return "Pshaft — Shaft Power [kW]"
		Case "PowerHP": Return "Pshaft — Shaft Power [hp]"
		Case "ThrustN": Return "T — Thrust [N]"
		Case "ThrustKgf": Return "T — Thrust [kgf]"
		Case "TorqueNm": Return "Q — Shaft Torque [N·m]"
		Case "DragHN": Return "H — In-Plane Force [N]"
		Case "B": Return "B — Tip-Loss Factor"
		Case "TipSpeed": Return "ΩR — Tip Speed [m/s]"
		Case "RPM": Return "RPM — Solved Speed"
		Case "Collective": Return "Δθ — Collective Increment [deg]"
		Case "Mu": Return "μₓ — Advance Ratio"
		Case "Vx": Return "Vx — Airspeed [m/s]"
		Case "MuZ": Return "μz — Axial Ratio"
		Case "Vz": Return "Vz — Climb Speed [m/s]"
		Case "Alpha": Return "α — Angle of Attack [deg]"
		Case "Altitude": Return "h — Altitude [m]"
		Case "Temperature": Return "Tamb — Temperature [°C]"
		Case "Density": Return "ρ — Air Density [kg/m³]"
		Case "Pressure": Return "p — Ambient Pressure [Pa]"
		Case "SoundSpeed": Return "a — Speed of Sound [m/s]"
		Case Else: Return paramKey
	End Select
End Sub

Private Sub AddSweepParam(key As String, label As String)
	SweepParamKeys.Add(key)
	SweepParamLabels.Add(label)
End Sub

Private Sub SweepPlotTitle(paramKey As String) As String
	Return SweepParamDisplayName(paramKey)
End Sub

Public Sub SweepParamDigits(paramKey As String) As Int
	Select paramKey
		Case "CT": Return 5
		Case "CP", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair": Return 6
		Case "lambda", "lambda_i": Return 5
		Case "L_D_eff": Return 2
		Case "FoM": Return 4
		Case "Kx", "Ky": Return 3
		Case "chi": Return 1
		Case "Mat": Return 3
		Case "PowerKW", "PowerHP", "TorqueNm", "DragHN": Return 1
		Case "ThrustN", "ThrustKgf", "RPM", "Altitude": Return 0
		Case "B", "Mu", "MuZ", "Density": Return 4
		Case "Collective", "Alpha": Return 2
		Case "TipSpeed", "Vx", "Vz", "Temperature", "SoundSpeed": Return 1
		Case "Pressure": Return 0
		Case Else: Return 5
	End Select
End Sub

' Extracts the target parameter value from the results data structure
Public Sub ExtractParamValue(res As RotorResults, paramKey As String) As Double
	Select Case paramKey
		Case "CT": Return res.CT
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
			Case 1: Return "Coleman Simple"
			Case 2: Return "Coleman-FG"
			Case Else: Return "Drees"
		End Select
	Else If multiCurveMode = 1 Then
		Return "α=" & NumberFormat2(familyValue, 1, 1, 1, False) & "°"
	Else If multiCurveMode = 2 Then
		Return "Vz=" & NumberFormat2(familyValue, 1, 1, 1, False) & " m/s"
	Else If multiCurveMode = 3 Then
		Return "μz=" & NumberFormat2(familyValue, 1, 3, 3, False)
	End If
	Return "Active"
End Sub

Private Sub SweepCurveColor(curveIndex As Int, multiCurveMode As Int, lightTheme As Boolean) As Int
	If multiCurveMode = 0 Then
		If lightTheme Then
			Select curveIndex
				Case 0: Return 0xFF667085
				Case 1: Return 0xFF2585A5
				Case 2: Return 0xFF007F95
				Case Else: Return 0xFF172033
			End Select
		Else
			Select curveIndex
				Case 0: Return 0xFF64748B
				Case 1: Return 0xFF38BDF8
				Case 2: Return 0xFF00E5FF
				Case Else: Return 0xFFBAE6FD
			End Select
		End If
	End If
	Dim idx As Int = curveIndex Mod 9
	If lightTheme Then
		Dim lightCols() As Int = Array As Int(0xFF334155, 0xFF0369A1, 0xFF007F95, 0xFF047857, 0xFF7C3AED, 0xFFB45309, 0xFFBE123C, 0xFF475569, 0xFF0F766E)
		Return lightCols(idx)
	Else
		Dim darkCols() As Int = Array As Int(0xFF94A3B8, 0xFF38BDF8, 0xFF00E5FF, 0xFF34D399, 0xFFA78BFA, 0xFFFBBF24, 0xFFFB7185, 0xFFE2E8F0, 0xFF5EEAD4)
		Return darkCols(idx)
	End If
End Sub

Private Sub PairRequiresTrim(pair As String) As Boolean
	Return pair <> "rpm_collective"
End Sub

' Builds the single authoritative dataset used by plot, table and CSV.
Public Sub BuildSweepSamples( _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	paramKey As String, _
	multiCurveMode As Int, _
	maxMu As Double, _
	familyValues As List, _
	trimOnlyHover As Boolean _
) As List
	Dim samples As List
	samples.Initialize
	Dim nPoints As Int = 25
	Dim nCurves As Int = SweepCurveCount(multiCurveMode, familyValues)
	
	Dim fixedTrimValid As Boolean = False
	Dim fixedRPM As Double = cond.RPM
	Dim fixedCollective As Double = cond.CollectiveDeg
	If trimOnlyHover And PairRequiresTrim(cond.OperatingPair) Then
		Dim hoverCond As FlightCondition = zBETEngine.CloneCondition(cond)
		hoverCond.HorizontalMode = "mu"
		hoverCond.HorizontalValue = 0.0
		hoverCond.AxialMode = "muz"
		hoverCond.AxialValue = 0.0
		Dim hoverState() As Object = zBETEngine.ResolveOperatingState(geom, hoverCond)
		Dim hoverStatus As String = hoverState(2)
		If hoverStatus = "VALID" Then
			Dim solvedHover As FlightCondition = hoverState(1)
			fixedRPM = solvedHover.RPM
			fixedCollective = solvedHover.CollectiveDeg
			fixedTrimValid = True
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
			If trimOnlyHover And PairRequiresTrim(cond.OperatingPair) Then
				If fixedTrimValid Then
					tempCond.OperatingPair = "rpm_collective"
					tempCond.RPM = fixedRPM
					tempCond.CollectiveDeg = fixedCollective
				Else
					point.Valid = False
					samples.Add(point)
					Continue
				End If
			End If
			
			Dim result As RotorResults = zBETEngine.Calculate(geom, tempCond)
			point.Valid = result.SolutionValid
			If result.SolutionValid Then
				point.Vx = result.OperatingVx
				point.MuZ = result.OperatingMuZ
				point.Value = ExtractParamValue(result, paramKey)
				point.RPM = result.TrimmedRPM
				point.CollectiveDeg = result.TrimmedCollectiveDeg
				point.CT = result.CT
				point.ThrustN = result.ThrustN
			End If
			samples.Add(point)
		Next
	Next
	Return samples
End Sub

' Renders the universal dataset. xAxisMode: 0=mu, 1=Vx [m/s].
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
	samples As List _
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
	If lightTheme Then
		colBg = 0xFFFFFFFF
		colGrid = 0xFFD9E1EA
		colText = 0xFF475467
		colCurrent = 0xFFAA5A00
		colAccent = 0xFF007F95
	Else
		colBg = 0xFF10141C
		colGrid = 0xFF202A36
		colText = 0xFF8F9CAE
		colCurrent = 0xFFFFB300
		colAccent = 0xFF00E5FF
	End If
	cvs.DrawColor(colBg)
	
	Dim nPoints As Int = 25
	Dim nCurves As Int = Max(1, samples.Size / nPoints)
	Dim legendCols As Int = nCurves
	If widthPx < 540dip Then
		If multiCurveMode = 0 Then
			legendCols = Min(2, nCurves)
		Else
			legendCols = Min(3, nCurves)
		End If
	Else If nCurves > 5 Then
		legendCols = Min(4, nCurves)
	End If
	If legendCols < 1 Then legendCols = 1
	Dim legendRows As Int = Ceil(nCurves / legendCols)
	Dim mLeft As Float = 64dip
	If widthPx < 390dip Then mLeft = 82dip
	Dim mRight As Float = 22dip
	Dim mTop As Float = 38dip + legendRows * 18dip
	Dim mBottom As Float = 44dip
	Dim plotW As Float = widthPx - mLeft - mRight
	Dim plotH As Float = heightPx - mTop - mBottom
	If plotW <= 10 Or plotH <= 10 Then Return bmp
	
	Dim yMin As Double = 1.0e99
	Dim yMax As Double = -1.0e99
	Dim xMax As Double = 0.0
	Dim validCount As Int = 0
	For sampleIndex = 0 To samples.Size - 1
		Dim sample As SweepPoint = samples.Get(sampleIndex)
		If sample.Valid Then
			validCount = validCount + 1
			If sample.Value < yMin Then yMin = sample.Value
			If sample.Value > yMax Then yMax = sample.Value
			Dim xv As Double = sample.Mu
			If xAxisMode = 1 Then xv = sample.Vx
			If xv > xMax Then xMax = xv
		End If
	Next
	
	Dim liveRes As RotorResults = zBETEngine.Calculate(geom, cond)
	Dim liveValid As Boolean = liveRes.SolutionValid And liveRes.OperatingMu >= 0 And liveRes.OperatingMu <= maxMu
	Dim liveValue As Double = 0.0
	Dim liveX As Double = 0.0
	If liveValid Then
		liveValue = ExtractParamValue(liveRes, paramKey)
		liveX = liveRes.OperatingMu
		If xAxisMode = 1 Then liveX = liveRes.OperatingVx
		If liveValue < yMin Then yMin = liveValue
		If liveValue > yMax Then yMax = liveValue
		If liveX > xMax Then xMax = liveX
	End If
	
	If validCount = 0 And liveValid = False Then
		cvs.DrawText("No valid operating points in this sweep.", widthPx * 0.5, heightPx * 0.5, Typeface.DEFAULT_BOLD, 13, colText, "CENTER")
		Return bmp
	End If
	If yMax <= yMin Then
		Dim padFlat As Double = Max(0.1, Abs(yMax) * 0.1)
		yMin = yMin - padFlat
		yMax = yMax + padFlat
	Else
		Dim yPad As Double = 0.08 * (yMax - yMin)
		yMin = yMin - yPad
		yMax = yMax + yPad
	End If
	If xAxisMode = 0 Then xMax = maxMu
	If xMax <= 1.0e-12 Then xMax = 1.0
	' Reserve actual rendered tick width, including Android font scaling.
	For tickIndex = 0 To 5
		Dim tickValue As Double = yMin + tickIndex / 5.0 * (yMax - yMin)
		Dim tickDigits As Int = SweepParamDigits(paramKey) + Max(0, Min(1, extraPrecision))
		Dim tickText As String = NumberFormat2(tickValue, 1, tickDigits, tickDigits, False)
		mLeft = Max(mLeft, cvs.MeasureStringWidth(tickText, Typeface.MONOSPACE, 12.5) + 12dip)
	Next
	plotW = widthPx - mLeft - mRight
	If plotW <= 10 Then Return bmp
	
	Dim plotRect As Rect
	plotRect.Initialize(mLeft, mTop, mLeft + plotW, mTop + plotH)
	cvs.DrawRect(plotRect, colGrid, False, 1.5dip)
	For gridY = 0 To 5
		Dim gy As Float = mTop + plotH - gridY / 5.0 * plotH
		cvs.DrawLine(mLeft, gy, mLeft + plotW, gy, colGrid, 1dip)
		Dim yGridValue As Double = yMin + gridY / 5.0 * (yMax - yMin)
		Dim yDigits As Int = SweepParamDigits(paramKey) + Max(0, Min(1, extraPrecision))
		Dim yText As String = NumberFormat2(yGridValue, 1, yDigits, yDigits, False)
		cvs.DrawText(yText, mLeft - 6dip, gy + 4dip, Typeface.MONOSPACE, 12.5, colText, "RIGHT")
	Next
	Dim xTickCount As Int = 5
	If widthPx < 390dip Then xTickCount = 4
	For gridX = 0 To xTickCount
		Dim gx As Float = mLeft + gridX / xTickCount * plotW
		cvs.DrawLine(gx, mTop, gx, mTop + plotH, colGrid, 1dip)
		Dim xGridValue As Double = gridX / xTickCount * xMax
		Dim xDigits As Int = 2
		If xAxisMode = 1 Then xDigits = 1
		cvs.DrawText(NumberFormat2(xGridValue, 1, xDigits, xDigits, False), gx, mTop + plotH + 18dip, Typeface.MONOSPACE, 12, colText, "CENTER")
	Next
	
	cvs.DrawText(SweepPlotTitle(paramKey), widthPx * 0.5, 16dip, Typeface.DEFAULT_BOLD, 13, colAccent, "CENTER")
	Dim xTitle As String = "Advance Ratio μₓ"
	If xAxisMode = 1 Then xTitle = "Airspeed Vx (m/s)"
	cvs.DrawText(xTitle, mLeft + plotW * 0.5, mTop + plotH + 34dip, Typeface.DEFAULT_BOLD, 12, colText, "CENTER")
	
	' Curves are stored curve-major, 25 samples per curve.
	For curveIndex = 0 To nCurves - 1
		Dim curveColor As Int = SweepCurveColor(curveIndex, multiCurveMode, lightTheme)
		Dim stroke As Float = 2.2dip
		If multiCurveMode = 4 Then stroke = 3.0dip
		For pointIndex = 0 To nPoints - 2
			Dim p1 As SweepPoint = samples.Get(curveIndex * nPoints + pointIndex)
			Dim p2 As SweepPoint = samples.Get(curveIndex * nPoints + pointIndex + 1)
			If p1.Valid And p2.Valid Then
				Dim x1v As Double = p1.Mu
				Dim x2v As Double = p2.Mu
				If xAxisMode = 1 Then
					x1v = p1.Vx
					x2v = p2.Vx
				End If
				Dim x1 As Float = mLeft + x1v / xMax * plotW
				Dim x2 As Float = mLeft + x2v / xMax * plotW
				Dim y1 As Float = mTop + plotH - (p1.Value - yMin) / (yMax - yMin) * plotH
				Dim y2 As Float = mTop + plotH - (p2.Value - yMin) / (yMax - yMin) * plotH
				cvs.DrawLine(x1, y1, x2, y2, curveColor, stroke)
			End If
		Next
	Next
	
	' Responsive legend occupies its own band, never the data rectangle.
	Dim legendCellW As Float = (widthPx - 24dip) / legendCols
	For legendIndex = 0 To nCurves - 1
		Dim legendRow As Int = Floor(legendIndex / legendCols)
		Dim legendCol As Int = legendIndex Mod legendCols
		Dim legendX As Float = 12dip + legendCol * legendCellW
		Dim legendY As Float = 33dip + legendRow * 18dip
		Dim legendPoint As SweepPoint = samples.Get(legendIndex * nPoints)
		Dim legendColor As Int = SweepCurveColor(legendIndex, multiCurveMode, lightTheme)
		cvs.DrawLine(legendX, legendY, legendX + 9dip, legendY, legendColor, 2.5dip)
		Dim legendSize As Float = 10.5
		If legendCols <= 2 Then legendSize = 11.5
		cvs.DrawText(legendPoint.CurveLabel, legendX + 12dip, legendY + 4dip, Typeface.DEFAULT_BOLD, legendSize, legendColor, "LEFT")
	Next
	
	If liveValid Then
		Dim liveCx As Float = mLeft + liveX / xMax * plotW
		Dim liveCy As Float = mTop + plotH - (liveValue - yMin) / (yMax - yMin) * plotH
		cvs.DrawCircle(liveCx, liveCy, 5dip, colCurrent, True, 1dip)
		cvs.DrawCircle(liveCx, liveCy, 9dip, colCurrent, False, 1.5dip)
	End If
	Return bmp
End Sub
