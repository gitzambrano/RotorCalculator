B4A=true
Group=Default Group
ModulesStructureVersion=1
Type=StaticCode
Version=13
@EndOfDesignText@
' RotorPopups.bas — Technical Dialogs, Airfoil Database, and Universal μ-Sweep Canvas Plotting
' Supports full multi-curve sweeps across ALL aerodynamic and performance parameters vs advance ratio (μ).

Sub Process_Globals
	
	Type AirfoilData ( _
		Name As String, _
		Description As String, _
		A0 As Double, _
		Cd0 As Double, _
		ThicknessRatio As Double _
	)
	
	Public Airfoils As List
	
	' Complete catalog of ALL selectable parameters for μ-sweeps
	Public SweepParamKeys As List
	Public SweepParamLabels As List
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
	
	' Initializes ALL selectable output parameters for μ-sweeps
	If SweepParamKeys.IsInitialized = False Then
		SweepParamKeys.Initialize
		SweepParamLabels.Initialize
		
		AddSweepParam("CT", "CT — Thrust")
		AddSweepParam("CP", "CQ / CPshaft — Shaft Power")
		AddSweepParam("CQi", "CQi — Induced Torque")
		AddSweepParam("CQ0", "CQ0 — Profile Torque")
		AddSweepParam("CH", "CH — In-Plane Drag")
		AddSweepParam("CHi", "CHi — Induced Drag")
		AddSweepParam("CH0", "CH0 — Profile Drag")
		AddSweepParam("CY", "CY — Side Force")
		AddSweepParam("CMx", "CMx — Roll Moment")
		AddSweepParam("CMy", "CMy — Pitch Moment")
		AddSweepParam("CPair", "CPair — Air Power")
		AddSweepParam("lambda", "λ — Total Inflow")
		AddSweepParam("lambda_i", "λi — Induced Inflow")
		AddSweepParam("L_D_eff", "L/D eff — Rotor Efficiency")
		AddSweepParam("FoM", "FoM — Figure of Merit")
		AddSweepParam("Kx", "Kx — Longitudinal Inflow")
		AddSweepParam("Ky", "Ky — Lateral Inflow")
		AddSweepParam("chi", "χ — Wake Skew (°)")
		AddSweepParam("Mat", "Mat — Advancing Tip Mach")
		AddSweepParam("PowerKW", "Shaft Power (kW)")
		AddSweepParam("PowerHP", "Shaft Power (HP)")
		AddSweepParam("ThrustN", "Thrust (N)")
		AddSweepParam("ThrustKgf", "Thrust (kgf)")
		AddSweepParam("TorqueNm", "Torque (N·m)")
		AddSweepParam("DragHN", "In-Plane Drag (N)")
	End If
End Sub

Private Sub AddSweepParam(key As String, label As String)
	SweepParamKeys.Add(key)
	SweepParamLabels.Add(label)
End Sub

Private Sub SweepPlotTitle(paramKey As String) As String
	Select paramKey
		Case "CT": Return "CT — Thrust"
		Case "CP", "CQ": Return "CQ / CPshaft — Shaft Power"
		Case "CQi": Return "CQi — Induced Torque"
		Case "CQ0": Return "CQ0 — Profile Torque"
		Case "CH": Return "CH — In-Plane Drag"
		Case "CHi": Return "CHi — Induced Drag"
		Case "CH0": Return "CH0 — Profile Drag"
		Case "CY": Return "CY — Side Force"
		Case "CMx": Return "CMx — Roll Moment"
		Case "CMy": Return "CMy — Pitch Moment"
		Case "CPair": Return "CPair — Air Power"
		Case "lambda": Return "λ — Total Inflow"
		Case "lambda_i": Return "λi — Induced Inflow"
		Case "L_D_eff": Return "Effective L/D"
		Case "FoM": Return "Figure of Merit"
		Case "Kx": Return "Kx — Longitudinal Inflow"
		Case "Ky": Return "Ky — Lateral Inflow"
		Case "chi": Return "χ — Wake Skew (°)"
		Case "Mat": Return "Mat — Advancing Tip Mach"
		Case "PowerKW": Return "Shaft Power (kW)"
		Case "PowerHP": Return "Shaft Power (HP)"
		Case "ThrustN": Return "Thrust (N)"
		Case "ThrustKgf": Return "Thrust (kgf)"
		Case "TorqueNm": Return "Torque (N·m)"
		Case "DragHN": Return "In-Plane Drag H (N)"
		Case Else: Return paramKey
	End Select
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
		Case "ThrustN", "ThrustKgf": Return 0
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
		Case Else: Return res.CT
	End Select
End Sub

' Renders a universal sweep plot with a reserved title/legend band.
' multiCurveMode: 0=inflow models, 1=alpha family, 2=Vz family, 3=mu_z family, 4=single active.
' xAxisMode: 0=mu, 1=Vx [m/s].
Public Sub DrawSweepPlot( _
	widthPx As Int, _
	heightPx As Int, _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	paramKey As String, _
	paramTitle As String, _
	multiCurveMode As Int, _
	maxMu As Double, _
	currentMu As Double, _
	activeAxialMode As String, _
	activeAxialValue As Double, _
	xAxisMode As Int, _
	lightTheme As Boolean _
) As Bitmap

	Dim bmp As Bitmap
	bmp.InitializeMutable(widthPx, heightPx)
	
	Dim cvs As Canvas
	cvs.Initialize2(bmp)
	
	Dim colBg As Int
	Dim colGrid As Int
	Dim colText As Int
	Dim colCurrentPoint As Int
	Dim colAccent As Int
	Dim colC1 As Int
	Dim colC2 As Int
	Dim colC3 As Int
	Dim colC4 As Int
	Dim colC5 As Int
	Dim colUniform As Int
	Dim colColemanSimple As Int
	Dim colColemanFG As Int
	Dim colDrees As Int
	If lightTheme Then
		colBg = 0xFFFFFFFF
		colGrid = 0xFFD9E1EA
		colText = 0xFF475467
		colCurrentPoint = 0xFFAA5A00
		colAccent = 0xFF007F95
		colC1 = 0xFF667085
		colC2 = 0xFF126A88
		colC3 = 0xFF007F95
		colC4 = 0xFF2596B2
		colC5 = 0xFF172033
		colUniform = 0xFF667085
		colColemanSimple = 0xFF2585A5
		colColemanFG = 0xFF007F95
		colDrees = 0xFF172033
	Else
		colBg = 0xFF10141C
		colGrid = 0xFF202A36
		colText = 0xFF8F9CAE
		colCurrentPoint = 0xFFFFB300
		colAccent = 0xFF00E5FF
		colC1 = 0xFF475569
		colC2 = 0xFF0284C7
		colC3 = 0xFF00E5FF
		colC4 = 0xFF7DD3FC
		colC5 = 0xFFE2E8F0
		colUniform = 0xFF64748B
		colColemanSimple = 0xFF38BDF8
		colColemanFG = 0xFF00E5FF
		colDrees = 0xFFBAE6FD
	End If
	
	cvs.DrawColor(colBg)
	
	' Margins in DIP
	Dim mLeft As Float = 64dip
	Dim mRight As Float = 24dip
	Dim mTop As Float = 60dip
	Dim mBottom As Float = 44dip
	
	Dim plotW As Float = widthPx - mLeft - mRight
	Dim plotH As Float = heightPx - mTop - mBottom
	
	If plotW <= 10 Or plotH <= 10 Then Return bmp
	Dim tipGeom As RotorGeometry = geom
	If cond.HoverTrimMode = "rpm" And cond.TargetThrustN > 0 Then
		tipGeom = zBETEngine.ResolveOperatingGeometry(geom, cond)
	End If
	Dim plotOmega As Double = tipGeom.RPM * (2.0 * cPI / 60.0)
	Dim plotVtip As Double = plotOmega * tipGeom.Radius
	If plotVtip < 1.0 Then plotVtip = 1.0
	
	' Advance ratio stations (25 points)
	Dim nPoints As Int = 25
	Dim muStep As Double = maxMu / (nPoints - 1)
	
	Dim nCurves As Int = 1
	If multiCurveMode == 0 Then
		nCurves = 4 ' 4 Inflow Models
	Else If multiCurveMode == 1 Then
		nCurves = 5 ' 5 Alphas
	Else If multiCurveMode == 2 Then
		nCurves = 5 ' 5 Vertical Speeds
	Else If multiCurveMode == 3 Then
		nCurves = 5 ' 5 imposed axial ratios
	Else
		nCurves = 1 ' Single active curve
	End If
	
	' Curves matrix
	Dim allCurves(nCurves, nPoints) As Double
	Dim validPoint(nCurves, nPoints) As Boolean
	Dim muPoints(nPoints) As Double
	
	Dim yMax As Double = -1e9
	Dim yMin As Double = 1e9
	Dim validCount As Int = 0
	
	For cIdx = 0 To nCurves - 1
		Dim tempCond As FlightCondition = zBETEngine.CloneCondition(cond)
		' Preserve exactly one axial representation; alpha, Vz and muz are alternatives.
		Dim curveAxialMode As String = activeAxialMode
		Dim curveAxialValue As Double = activeAxialValue
		
		If multiCurveMode == 0 Then
			Select Case cIdx
				Case 0: tempCond.InflowModel = "uniform"
				Case 1: tempCond.InflowModel = "coleman_simple"
				Case 2: tempCond.InflowModel = "coleman_feingold"
				Case 3: tempCond.InflowModel = "drees"
			End Select
		Else If multiCurveMode == 1 Then
			curveAxialMode = "alpha"
			Select Case cIdx
				Case 0: curveAxialValue = -10.0
				Case 1: curveAxialValue = -5.0
				Case 2: curveAxialValue = 0.0
				Case 3: curveAxialValue = 5.0
				Case 4: curveAxialValue = 10.0
			End Select
		Else If multiCurveMode == 2 Then
			curveAxialMode = "vz"
			Select Case cIdx
				Case 0: curveAxialValue = -10.0
				Case 1: curveAxialValue = -5.0
				Case 2: curveAxialValue = 0.0
				Case 3: curveAxialValue = 5.0
				Case 4: curveAxialValue = 10.0
			End Select
		Else If multiCurveMode == 3 Then
			curveAxialMode = "muz"
			Select Case cIdx
				Case 0: curveAxialValue = -0.05
				Case 1: curveAxialValue = -0.025
				Case 2: curveAxialValue = 0.0
				Case 3: curveAxialValue = 0.025
				Case 4: curveAxialValue = 0.05
			End Select
		End If
		
		For i = 0 To nPoints - 1
			Dim mu As Double = i * muStep
			muPoints(i) = mu
			tempCond.Mu = mu
			
			tempCond.MuZ = zBETEngine.ResolveMuZ(mu, curveAxialMode, curveAxialValue, plotVtip)
			
			Dim res As RotorResults = zBETEngine.Calculate(geom, tempCond)
			If res.SolutionValid Then
				Dim val As Double = ExtractParamValue(res, paramKey)
				allCurves(cIdx, i) = val
				validPoint(cIdx, i) = True
				validCount = validCount + 1
				If val > yMax Then yMax = val
				If val < yMin Then yMin = val
			Else
				validPoint(cIdx, i) = False
			End If
		Next
	Next
	
	' Include the live operating point in the vertical range so its marker is never clipped.
	Dim currentPointValid As Boolean = False
	Dim currentPointVal As Double = 0.0
	If currentMu >= 0.0 And currentMu <= maxMu Then
		Dim liveRes As RotorResults = zBETEngine.Calculate(geom, cond)
		If liveRes.SolutionValid Then
			currentPointVal = ExtractParamValue(liveRes, paramKey)
			currentPointValid = True
			If currentPointVal > yMax Then yMax = currentPointVal
			If currentPointVal < yMin Then yMin = currentPointVal
		End If
	End If
	
	' Auto-scaling vertical range with padding
	If validCount = 0 And currentPointValid = False Then
		cvs.DrawText("No valid operating points in this sweep.", widthPx * 0.5, heightPx * 0.5, Typeface.DEFAULT_BOLD, 13, colText, "CENTER")
		Return bmp
	End If
	If yMax == yMin Then
		yMax = yMax + 0.1
		yMin = yMin - 0.1
	End If
	Dim ySpan As Double = yMax - yMin
	yMax = yMax + 0.08 * ySpan
	yMin = yMin - 0.08 * ySpan
	
	' Border
	Dim rRect As Rect
	rRect.Initialize(mLeft, mTop, mLeft + plotW, mTop + plotH)
	cvs.DrawRect(rRect, colGrid, False, 1.5dip)
	
	' Y-Axis grid and numeric labels (5 divisions)
	For ig = 0 To 5
		Dim yG As Float = mTop + plotH - (ig / 5.0) * plotH
		cvs.DrawLine(mLeft, yG, mLeft + plotW, yG, colGrid, 1dip)
		Dim yValG As Double = yMin + (ig / 5.0) * (yMax - yMin)
		
		Dim txtY As String
		If Abs(yValG) < 0.01 And Abs(yValG) > 0 Then
			txtY = NumberFormat(yValG, 1, 5)
		Else If Abs(yValG) < 1.0 Then
			txtY = NumberFormat(yValG, 1, 4)
		Else If Abs(yValG) < 100.0 Then
			txtY = NumberFormat(yValG, 1, 2)
		Else
			txtY = NumberFormat(yValG, 1, 0)
		End If
		cvs.DrawText(txtY, mLeft - 6dip, yG + 4dip, Typeface.MONOSPACE, 10, colText, "RIGHT")
	Next
	
	' X-Axis grid and numeric labels (5 divisions)
	For jg = 0 To 5
		Dim muG As Double = (jg / 5.0) * maxMu
		Dim xG As Float = mLeft + (jg / 5.0) * plotW
		cvs.DrawLine(xG, mTop, xG, mTop + plotH, colGrid, 1dip)
		Dim xText As String
		If xAxisMode = 1 Then
			xText = NumberFormat2(muG * plotVtip, 1, 1, 1, False)
		Else
			xText = NumberFormat2(muG, 1, 2, 2, False)
		End If
		cvs.DrawText(xText, xG, mTop + plotH + 18dip, Typeface.MONOSPACE, 10, colText, "CENTER")
	Next
	
	' Title and X label. The legend occupies the reserved band below the title.
	Dim xAxisTitle As String = "Advance Ratio (μ)"
	If xAxisMode = 1 Then xAxisTitle = "Forward Speed Vx (m/s)"
	cvs.DrawText(SweepPlotTitle(paramKey), mLeft, 16dip, Typeface.DEFAULT_BOLD, 11, colAccent, "LEFT")
	cvs.DrawText(xAxisTitle, mLeft + plotW * 0.5, mTop + plotH + 34dip, Typeface.DEFAULT_BOLD, 11, colText, "CENTER")
	
	' Draw curves
	For cIdx = 0 To nCurves - 1
		Dim curveColor As Int = colAccent
		Dim strokeWidth As Float = 2.2dip
		
		If multiCurveMode == 0 Then
			Select Case cIdx
				Case 0: curveColor = colUniform
				Case 1: curveColor = colColemanSimple
				Case 2
					curveColor = colColemanFG
					strokeWidth = 3.0dip
				Case 3: curveColor = colDrees
			End Select
		Else If multiCurveMode == 1 Or multiCurveMode == 2 Or multiCurveMode == 3 Then
			Select Case cIdx
				Case 0: curveColor = colC1
				Case 1: curveColor = colC2
				Case 2
					curveColor = colC3
					strokeWidth = 3.0dip
				Case 3: curveColor = colC4
				Case 4: curveColor = colC5
			End Select
		Else
			curveColor = colAccent
			strokeWidth = 2.8dip
		End If
		
		For i = 0 To nPoints - 2
			If validPoint(cIdx, i) And validPoint(cIdx, i + 1) Then
				Dim x1 As Float = mLeft + (muPoints(i) / maxMu) * plotW
				Dim y1 As Float = mTop + plotH - ((allCurves(cIdx, i) - yMin) / (yMax - yMin)) * plotH
				Dim x2 As Float = mLeft + (muPoints(i + 1) / maxMu) * plotW
				Dim y2 As Float = mTop + plotH - ((allCurves(cIdx, i + 1) - yMin) / (yMax - yMin)) * plotH
				cvs.DrawLine(x1, y1, x2, y2, curveColor, strokeWidth)
			End If
		Next
	Next
	
	' Curve legends — reserved above plot rectangle so labels never cover data.
	Dim legendY As Float = 39dip
	If multiCurveMode == 0 Then
		Dim labels4() As String = Array As String("Uniform", "Coleman Simple", "Coleman-FG", "Drees")
		Dim cols4() As Int = Array As Int(colUniform, colColemanSimple, colColemanFG, colDrees)
		If plotW < 330dip Then
			' Two rows on narrow phones keep model names readable without overlap.
			Dim colW4 As Float = plotW / 2.0
			For k = 0 To 3
				Dim row4 As Int = Floor(k / 2)
				Dim col4 As Int = k Mod 2
				Dim lx4 As Float = mLeft + col4 * colW4
				Dim ly4 As Float = 33dip + row4 * 13dip
				cvs.DrawLine(lx4, ly4, lx4 + 9dip, ly4, cols4(k), 2.5dip)
				cvs.DrawText(labels4(k), lx4 + 12dip, ly4 + 4dip, Typeface.DEFAULT_BOLD, 7, cols4(k), "LEFT")
			Next
		Else
			Dim itemW4 As Float = plotW / 4.0
			For k = 0 To 3
				Dim lx4 As Float = mLeft + k * itemW4
				cvs.DrawLine(lx4, legendY, lx4 + 10dip, legendY, cols4(k), 2.5dip)
				cvs.DrawText(labels4(k), lx4 + 13dip, legendY + 4dip, Typeface.DEFAULT_BOLD, 8, cols4(k), "LEFT")
			Next
		End If
	Else If multiCurveMode == 1 Then
		Dim aLabels() As String = Array As String("-10°", "-5°", "0°", "+5°", "+10°")
		Dim aCols() As Int = Array As Int(colC1, colC2, colC3, colC4, colC5)
		Dim itemW5 As Float = plotW / 5.0
		For k = 0 To 4
			Dim lx5 As Float = mLeft + k * itemW5
			cvs.DrawLine(lx5, legendY, lx5 + 8dip, legendY, aCols(k), 2.5dip)
			cvs.DrawText(aLabels(k), lx5 + 10dip, legendY + 4dip, Typeface.DEFAULT_BOLD, 8, aCols(k), "LEFT")
		Next
	Else If multiCurveMode == 2 Then
		Dim vzLabels() As String = Array As String("-10", "-5", "0", "+5", "+10")
		Dim vzCols() As Int = Array As Int(colC1, colC2, colC3, colC4, colC5)
		Dim itemW5 As Float = plotW / 5.0
		For k = 0 To 4
			Dim lx5 As Float = mLeft + k * itemW5
			cvs.DrawLine(lx5, legendY, lx5 + 8dip, legendY, vzCols(k), 2.5dip)
			cvs.DrawText(vzLabels(k) & " m/s", lx5 + 10dip, legendY + 4dip, Typeface.DEFAULT_BOLD, 7, vzCols(k), "LEFT")
		Next
	Else If multiCurveMode == 3 Then
		Dim mzLabels() As String = Array As String("-0.050", "-0.025", "0", "+0.025", "+0.050")
		Dim mzCols() As Int = Array As Int(colC1, colC2, colC3, colC4, colC5)
		Dim itemW5 As Float = plotW / 5.0
		For k = 0 To 4
			Dim lx5 As Float = mLeft + k * itemW5
			cvs.DrawLine(lx5, legendY, lx5 + 8dip, legendY, mzCols(k), 2.5dip)
			cvs.DrawText(mzLabels(k), lx5 + 10dip, legendY + 4dip, Typeface.DEFAULT_BOLD, 7, mzCols(k), "LEFT")
		Next
	End If
	' Mark the active operating point.
	If currentPointValid Then
		Dim cx As Float = mLeft + (currentMu / maxMu) * plotW
		Dim cy As Float = mTop + plotH - ((currentPointVal - yMin) / (yMax - yMin)) * plotH
		cvs.DrawCircle(cx, cy, 5dip, colCurrentPoint, True, 1dip)
		cvs.DrawCircle(cx, cy, 9dip, colCurrentPoint, False, 1.5dip)
	End If
	
	Return bmp
End Sub
