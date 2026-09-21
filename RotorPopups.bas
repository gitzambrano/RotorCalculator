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
		
		AddSweepParam("CT", "CT — Rotor Thrust Coefficient")
		AddSweepParam("CP", "CP / CQ — Rotor Power / Shaft Torque Coefficient")
		AddSweepParam("CQi", "CQi — Induced Torque Coefficient")
		AddSweepParam("CQ0", "CQ0 — Profile Drag Torque Coefficient")
		AddSweepParam("CH", "CH — Total In-Plane Drag Coefficient (CHi + CH0)")
		AddSweepParam("CHi", "CHi — Induced In-Plane Drag Coefficient")
		AddSweepParam("CH0", "CH0 — Profile In-Plane Drag Coefficient")
		AddSweepParam("CY", "CY — Side Force Coefficient (Starboard)")
		AddSweepParam("CMx", "CMx — Rolling Moment Coefficient (Right Wing Down)")
		AddSweepParam("CMy", "CMy — Pitching Moment Coefficient (Nose Up)")
		AddSweepParam("CPair", "CPair — Air Power Coefficient (Energy Balance)")
		AddSweepParam("lambda", "λ — Total Mean Inflow Ratio (μz + λi)")
		AddSweepParam("lambda_i", "λi — Induced Downwash Inflow Ratio")
		AddSweepParam("L_D_eff", "L/D eff — Effective Rotor Lift-to-Drag Ratio")
		AddSweepParam("FoM", "FoM — Hover Figure of Merit")
		AddSweepParam("Kx", "Kx — Longitudinal Inflow Gradient Factor")
		AddSweepParam("Ky", "Ky — Lateral Inflow Gradient Factor")
		AddSweepParam("chi", "χ — Wake Skew Angle (°)")
		AddSweepParam("Mat", "Mat — Advancing Tip Mach Number")
		AddSweepParam("PowerKW", "Shaft Power P (kW)")
		AddSweepParam("PowerHP", "Shaft Power P (HP)")
		AddSweepParam("ThrustN", "Total Thrust T (N)")
		AddSweepParam("ThrustKgf", "Total Thrust T (kgf)")
		AddSweepParam("TorqueNm", "Shaft Torque Q (N·m)")
		AddSweepParam("DragHN", "In-Plane Drag H (N)")
	End If
End Sub

Private Sub AddSweepParam(key As String, label As String)
	SweepParamKeys.Add(key)
	SweepParamLabels.Add(label)
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

' Renders universal sweep plot of ANY parameter vs advance ratio (μ) with multi-curve comparison
' multiCurveMode: 0=4 Inflow Models, 1=5 Alphas (-10° to +10°), 2=5 Vertical Speeds (-10 to +10 m/s), 3=Single Active Curve
Public Sub DrawSweepPlot( _
	widthPx As Int, _
	heightPx As Int, _
	geom As RotorGeometry, _
	cond As FlightCondition, _
	paramKey As String, _
	paramTitle As String, _
	multiCurveMode As Int, _
	maxMu As Double, _
	currentMu As Double _
) As Bitmap

	Dim bmp As Bitmap
	bmp.InitializeMutable(widthPx, heightPx)
	
	Dim cvs As Canvas
	cvs.Initialize2(bmp)
	
	' Dark Cyber-Cockpit Palette
	Dim colBg As Int = 0xFF10141C
	Dim colGrid As Int = 0xFF202A36
	Dim colText As Int = 0xFF8F9CAE
	Dim colCurrentPoint As Int = 0xFFFFB300
	Dim colAccent As Int = 0xFF00E5FF
	' Refined Aero-Tonal Palette (Subtle accents, no multi-color rainbow)
	Dim colC1 As Int = 0xFF475569   ' Deep slate
	Dim colC2 As Int = 0xFF0284C7   ' Medium aero blue
	Dim colC3 As Int = 0xFF00E5FF   ' Electric cyan nominal
	Dim colC4 As Int = 0xFF7DD3FC   ' Ice cyan
	Dim colC5 As Int = 0xFFE2E8F0   ' Platinum white
	
	' Unified Inflow Model Colors
	Dim colUniform As Int = 0xFF64748B      ' Muted slate
	Dim colColemanSimple As Int = 0xFF38BDF8' Sky cyan
	Dim colColemanFG As Int = 0xFF00E5FF    ' Electric cyan primary
	Dim colDrees As Int = 0xFFBAE6FD        ' Light ice cyan
	
	cvs.DrawColor(colBg)
	
	' Margins in DIP
	Dim mLeft As Float = 64dip
	Dim mRight As Float = 24dip
	Dim mTop As Float = 38dip
	Dim mBottom As Float = 48dip
	
	Dim plotW As Float = widthPx - mLeft - mRight
	Dim plotH As Float = heightPx - mTop - mBottom
	
	If plotW <= 10 Or plotH <= 10 Then Return bmp
	
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
	Else
		nCurves = 1 ' Single active curve
	End If
	
	' Curves matrix
	Dim allCurves(nCurves, nPoints) As Double
	Dim muPoints(nPoints) As Double
	
	Dim yMax As Double = -1e9
	Dim yMin As Double = 1e9
	
	For cIdx = 0 To nCurves - 1
		Dim tempCond As FlightCondition = cond
		Dim alphaDeg As Double = 0.0
		Dim vzRate As Double = 0.0
		
		If multiCurveMode == 0 Then
			Select Case cIdx
				Case 0: tempCond.InflowModel = "uniform"
				Case 1: tempCond.InflowModel = "coleman_simple"
				Case 2: tempCond.InflowModel = "coleman_feingold"
				Case 3: tempCond.InflowModel = "drees"
			End Select
		Else If multiCurveMode == 1 Then
			' Alphas: -10, -5, 0, +5, +10 deg
			Select Case cIdx
				Case 0: alphaDeg = -10.0
				Case 1: alphaDeg = -5.0
				Case 2: alphaDeg = 0.0
				Case 3: alphaDeg = 5.0
				Case 4: alphaDeg = 10.0
			End Select
		Else If multiCurveMode == 2 Then
			' Vertical Speeds: -10, -5, 0, +5, +10 m/s
			Select Case cIdx
				Case 0: vzRate = -10.0
				Case 1: vzRate = -5.0
				Case 2: vzRate = 0.0
				Case 3: vzRate = 5.0
				Case 4: vzRate = 10.0
			End Select
		End If
		
		For i = 0 To nPoints - 1
			Dim mu As Double = i * muStep
			muPoints(i) = mu
			tempCond.Mu = mu
			
			If multiCurveMode == 1 Then
				tempCond.MuZ = -mu * Tan(alphaDeg * cPI / 180.0)
			Else If multiCurveMode == 2 Then
				Dim omega As Double = geom.RPM * (2.0 * cPI / 60.0)
				Dim vtip As Double = omega * geom.Radius
				If vtip < 1.0 Then vtip = 200.0
				tempCond.MuZ = vzRate / vtip
			End If
			
			Dim res As RotorResults = zBETEngine.Calculate(geom, tempCond)
			Dim val As Double = ExtractParamValue(res, paramKey)
			allCurves(cIdx, i) = val
			
			If val > yMax Then yMax = val
			If val < yMin Then yMin = val
		Next
	Next
	
	' Auto-scaling vertical range with padding
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
		cvs.DrawText(NumberFormat(muG, 1, 2), xG, mTop + plotH + 18dip, Typeface.MONOSPACE, 10, colText, "CENTER")
	Next
	
	' Axes title labels
	cvs.DrawText(paramTitle, mLeft, mTop - 12dip, Typeface.DEFAULT_BOLD, 11, colAccent, "LEFT")
	cvs.DrawText("Advance Ratio (μ)", mLeft + plotW * 0.5, mTop + plotH + 34dip, Typeface.DEFAULT_BOLD, 11, colText, "CENTER")
	
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
		Else If multiCurveMode == 1 Or multiCurveMode == 2 Then
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
			Dim x1 As Float = mLeft + (muPoints(i) / maxMu) * plotW
			Dim y1 As Float = mTop + plotH - ((allCurves(cIdx, i) - yMin) / (yMax - yMin)) * plotH
			Dim x2 As Float = mLeft + (muPoints(i + 1) / maxMu) * plotW
			Dim y2 As Float = mTop + plotH - ((allCurves(cIdx, i + 1) - yMin) / (yMax - yMin)) * plotH
			
			cvs.DrawLine(x1, y1, x2, y2, curveColor, strokeWidth)
		Next
	Next
	
	' Curve legends
	If multiCurveMode == 0 Then
		Dim legX As Float = mLeft + plotW - 195dip
		Dim legY As Float = mTop + 14dip
		cvs.DrawLine(legX, legY, legX + 14dip, legY, colUniform, 2dip)
		cvs.DrawText("Uniform", legX + 18dip, legY + 4dip, Typeface.DEFAULT, 9, colUniform, "LEFT")
		cvs.DrawLine(legX + 85dip, legY, legX + 99dip, legY, colColemanSimple, 2dip)
		cvs.DrawText("Coleman S.", legX + 103dip, legY + 4dip, Typeface.DEFAULT, 9, colColemanSimple, "LEFT")
		legY = legY + 14dip
		cvs.DrawLine(legX, legY, legX + 14dip, legY, colColemanFG, 3dip)
		cvs.DrawText("Coleman-FG", legX + 18dip, legY + 4dip, Typeface.DEFAULT_BOLD, 9, colColemanFG, "LEFT")
		cvs.DrawLine(legX + 85dip, legY, legX + 99dip, legY, colDrees, 2dip)
		cvs.DrawText("Drees", legX + 103dip, legY + 4dip, Typeface.DEFAULT, 9, colDrees, "LEFT")
	Else If multiCurveMode == 1 Then
		' Alphas legend: -10°, -5°, 0°, +5°, +10°
		Dim legX As Float = mLeft + 10dip
		Dim legY As Float = mTop + 14dip
		Dim aLabels() As String = Array As String("-10°", "-5°", "0°", "+5°", "+10°")
		Dim aCols() As Int = Array As Int(colC1, colC2, colC3, colC4, colC5)
		For k = 0 To 4
			Dim lx As Float = legX + k * 44dip
			cvs.DrawLine(lx, legY, lx + 12dip, legY, aCols(k), 2.5dip)
			cvs.DrawText(aLabels(k), lx + 15dip, legY + 4dip, Typeface.DEFAULT_BOLD, 9, aCols(k), "LEFT")
		Next
	Else If multiCurveMode == 2 Then
		' Vertical speed legend: -10, -5, 0, +5, +10 m/s
		Dim legX As Float = mLeft + 6dip
		Dim legY As Float = mTop + 14dip
		Dim vzLabels() As String = Array As String("-10m/s", "-5m/s", "0m/s", "+5m/s", "+10m/s")
		Dim vzCols() As Int = Array As Int(colC1, colC2, colC3, colC4, colC5)
		For k = 0 To 4
			Dim lx As Float = legX + k * 48dip
			cvs.DrawLine(lx, legY, lx + 10dip, legY, vzCols(k), 2.5dip)
			cvs.DrawText(vzLabels(k), lx + 13dip, legY + 4dip, Typeface.DEFAULT_BOLD, 8, vzCols(k), "LEFT")
		Next
	End If
	
	' Mark the active operating point
	If currentMu >= 0.0 And currentMu <= maxMu Then
		Dim curRes As RotorResults = zBETEngine.Calculate(geom, cond)
		Dim curVal As Double = ExtractParamValue(curRes, paramKey)
		
		Dim cx As Float = mLeft + (currentMu / maxMu) * plotW
		Dim cy As Float = mTop + plotH - ((curVal - yMin) / (yMax - yMin)) * plotH
		
		cvs.DrawCircle(cx, cy, 5dip, colCurrentPoint, True, 1dip)
		cvs.DrawCircle(cx, cy, 9dip, colCurrentPoint, False, 1.5dip)
		
		Dim lblPoint As String = "μ=" & NumberFormat(currentMu, 1, 2) & ": " & NumberFormat(curVal, 1, 4)
		cvs.DrawText(lblPoint, cx + 8dip, cy - 8dip, Typeface.DEFAULT_BOLD, 10, colCurrentPoint, "LEFT")
	End If
	
	Return bmp
End Sub
