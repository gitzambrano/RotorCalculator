import os

def create_aerocalculator_style_b4a():
    b4a_content = """﻿Type=Activity
Version=13.7
@EndOfDesignText@
#Region  Activity Attributes 
	#FullScreen: False
	#IncludeTitle: False
#End Region

#Region  Project Attributes 
	#ApplicationLabel: RotorCalculator
	#VersionCode: 1
	#VersionName: 1.0.0
	#SupportedOrientations: portrait
	#CanInstallToExternalStorage: True
#End Region

Sub Process_Globals
	
	' Production Signing & Permissions
	Private rp As RuntimePermissions
	
	' Theme Colors (AeroCalculator Cockpit Stealth Palette)
	Public ColorPnlTitle As Int = 0xFF0D121B     ' Dark Stealth Cockpit Header
	Public ColorTitleText As Int = 0xFFFFFFFF    ' Crisp White Title
	Public ColorPnlLine As Int = 0xFF00E5FF      ' Active Aero Cyan Indicator
	Public ColorPnlLine2 As Int = 0xFF1E2738     ' Header Hairline Divider
	Public ColorPnlLine3 As Int = 0xFF171E2B     ' Row Divider
	Public ColorBut3 As Int = 0x00000000         ' Transparent Tab Button
	Public ColorBut4 As Int = 0x00000000         ' Transparent Tab Button
	Public ColorButText2 As Int = 0xFF94A3B8     ' Unselected Tab Text (Slate)
	Public ColorButText3 As Int = 0xFF00E5FF     ' Active Tab Text (Cyan)
	Public ColorBut1 As Int = 0xFF1A2332         ' Button Gradient Top
	Public ColorBut2 As Int = 0xFF121925         ' Button Gradient Bottom
	Public ColorButText1 As Int = 0xFFF1F5F9     ' Button Text Main
	Public ColorEdt As Int = 0xFF0F141E          ' Edit Box Background
	Public ColorEdtText As Int = 0xFF00E5FF      ' Edit Text Cyan
	Public ColorEdtHint As Int = 0xFF64748B      ' Edit Hint Slate
	Public ColorPnlInput1 As Int = 0xFF0A0E15    ' Row 1 Background
	Public ColorPnlInput2 As Int = 0xFF0E131C    ' Row 2 Background
	Public ColorPnlInput3 As Int = 0xFF0A0E15    ' Output Row 1
	Public ColorPnlInput4 As Int = 0xFF0E131C    ' Output Row 2
	Public ColorPnlInput5 As Int = 0xFF07090E    ' Page Background
	Public ColorAccentCyan As Int = 0xFF00E5FF   ' Cyan Accent
	Public ColorAccentGreen As Int = 0xFF00E676  ' Emerald Accent
	Public ColorAccentAmber As Int = 0xFFFFB300  ' Amber Accent
	
	' Aerodynamic Global State
	Public ActiveGeom As RotorGeometry
	Public ActiveCond As FlightCondition
	Public ActiveRes As RotorResults
	
	' Navigation & Scaling
	Public sc As Double = 1.0
	Public ld As Int = 0
	Public CurrentPage As Int = 0
	Public UnitSystem As Int = 0 ' 0=Metric (SI), 1=Imperial

End Sub

Sub Globals
	
	' Safe Insets Root & ViewPager
	Private root As Panel
	Private imeInsets As IME
	Private container As AHPageContainer
	Private pager As AHViewPager
	
	' Unified Header (Title + Tabs)
	Private pnltitle As Panel
	Private btnTabGeom As Button
	Private btnTabCond As Button
	Private btnTabRes As Button
	Private line As Panel
	Private lblAppTitle As Label
	Private lblRotorNameHeader As Label
	
	' Page 0: Geometry Views
	Private pnlBack0 As Panel
	Private scvGeom As ScrollView
	Private spnRotorSelect As Spinner
	Private edtRadius As EditText
	Private edtRPM As EditText
	Private edtNBlades As EditText
	Private edtRootCutout As EditText
	Private edtChordRoot As EditText
	Private edtChordTip As EditText
	Private edtThetaRoot As EditText
	Private edtThetaTip As EditText
	Private edtLiftSlope As EditText
	Private edtCd0 As EditText
	Private btnSelectAirfoil As Button
	Private btnTipLoss As Button
	Private btnCompressibility As Button
	
	' Page 1: Conditions Views
	Private pnlBack1 As Panel
	Private scvCond As ScrollView
	Private edtAltitude As EditText
	Private edtTemperature As EditText
	Private edtAdvanceMu As EditText
	Private edtSpeedKmh As EditText
	Private edtShaftTiltAlpha As EditText
	Private edtClimbRateW As EditText
	Private btnInflowModel As Button
	Private btnProfileDragModel As Button
	Private btnHoverTrimMode As Button
	Private edtTargetThrust As EditText
	Private edtTargetCT As EditText
	
	' Page 2: Results Views
	Private pnlBack2 As Panel
	Private scvRes As ScrollView
	Private btnViewPolarPlot As Button
	Private lblResults(25) As Label
	
	' Multi-Parameter μ-Sweep Popup
	Private pnlSweepPopup As Panel
	Private spnSweepParam As Spinner
	Private btnSweepMultiModel As Button
	Private btnSweepMaxMu As Button
	Private ivSweepPlot As ImageView
	Private lblSweepCurrentVal As Label
	Private SweepMultiMode As Int = 0
	Private SweepMaxMuVal As Double = 0.40
	Private SweepParamSelectedKey As String = "CP"
	Private SweepParamSelectedLabel As String = "CP / CQ — Rotor Power / Shaft Torque"
	
	Private UpdatingUI As Boolean = False

End Sub

Sub Activity_Create(FirstTime As Boolean)
	
	' Initialize Independent Sub-Modules
	If FirstTime Then
		RotorStorage.Initialize(rp)
		RotorPopups.Initialize
		ActiveGeom = RotorStorage.GetActiveRotor
		ActiveCond = zBETEngine.CreateDefaultCondition
	End If
	
	' Safe area root
	imeInsets.Initialize("imeInsets")
	root.Initialize("")
	Dim Content As Rect = imeInsets.GetContentRect
	Dim rL As Int = Content.Left
	Dim rT As Int = Content.Top
	Dim rW As Int = Content.Width
	Dim rH As Int = Content.Height
	If rW <= 0 Then rW = 100%x
	If rH <= 0 Then rH = 100%y
	Activity.AddView(root, rL, rT, rW, rH)
	imeInsets.UpdatePercentageReference(root.Width, root.Height)
	
	' AeroCalculator Scaling Formula
	Dim hh, yy As Double
	Dim ib As Int = 6dip
	Dim tb As Int = 40dip
	Dim PanelNb As Int = 14
	hh = 102dip + PanelNb * (ib * 2 + tb) + PanelNb * 1dip + 1dip
	yy = root.Height
	sc = yy / hh
	If sc < 1 Then sc = 1
	If root.Width > root.Height Then ld = 1 Else ld = 0
	
	' Initialize Pager Container
	container.Initialize
	
	' Build Pages
	BuildPageGeom
	container.AddPage(pnlBack0, "Geometry")
	
	BuildPageCond
	container.AddPage(pnlBack1, "Conditions")
	
	BuildPageRes
	container.AddPage(pnlBack2, "Results")
	
	' Add Pager to Root
	pager.Initialize2(container, "pager")
	root.AddView(pager, 0, 102dip * sc, root.Width, root.Height - 102dip * sc)
	
	' Build Unified Header
	BuildUnifiedHeader
	
	' Populate UI & Run Initial Calculation
	LoadRotorDataToFields(ActiveGeom)
	RecalculateRotor
	
	' Set initial page
	pager.GotoPage(0, False)
	
End Sub

Sub Activity_Resume
	pager.GotoPage(CurrentPage, False)
End Sub

Sub Activity_Pause (UserClosed As Boolean)
End Sub

' ====================================================================
' UNIFIED HEADER (AeroCalculator Style)
' ====================================================================
Private Sub BuildUnifiedHeader
	pnltitle.Initialize("pnltitle")
	root.AddView(pnltitle, 0, 0, root.Width, 102dip * sc)
	pnltitle.Color = ColorPnlTitle
	
	' 1. Left Stylized BEMT Rotor Icon
	Dim img1 As ImageView
	Dim bmpImage1 As Bitmap
	bmpImage1.Initialize(File.DirAssets, "icon.png")
	img1.Initialize("")
	img1.Bitmap = bmpImage1
	img1.Gravity = Gravity.FILL
	pnltitle.AddView(img1, 3%x, 8dip * sc, 38dip * sc, 38dip * sc)
	
	' 2. 3-Dot Menu Button
	Dim pnlTransparent As Panel
	pnlTransparent.Initialize("btnMenu")
	pnlTransparent.Color = Colors.Transparent
	pnltitle.AddView(pnlTransparent, root.Width - 45dip * sc, 0, 45dip * sc, 52dip * sc)
	Dim img2 As ImageView
	Dim bmpImage2 As Bitmap
	bmpImage2.Initialize(File.DirAssets, "android-3-dot-menu.png")
	img2.Initialize("btnMenu")
	img2.Bitmap = bmpImage2
	img2.Gravity = Gravity.FILL
	pnlTransparent.AddView(img2, (pnlTransparent.Width - 22dip * sc) / 2, 14dip * sc, 22dip * sc, 22dip * sc)
	
	' 3. App Title in Xenara-Bold.ttf
	lblAppTitle.Initialize("")
	lblAppTitle.TextSize = 20 * sc
	If sc > 1.2 Then lblAppTitle.TextSize = 22 * sc
	lblAppTitle.TextColor = ColorTitleText
	lblAppTitle.Gravity = Gravity.CENTER_VERTICAL
	lblAppTitle.Text = "RotorCalculator"
	Try
		lblAppTitle.Typeface = Typeface.LoadFromAssets("xenara-bold.ttf")
	Catch
		lblAppTitle.Typeface = Typeface.DEFAULT_BOLD
	End Try
	pnltitle.AddView(lblAppTitle, 3%x + 44dip * sc, 6dip * sc, root.Width - 180dip * sc, 42dip * sc)
	
	' 4. Sub-Label with Active Rotor Preset Name
	lblRotorNameHeader.Initialize("")
	lblRotorNameHeader.Text = ActiveGeom.Name
	lblRotorNameHeader.TextColor = ColorAccentCyan
	lblRotorNameHeader.TextSize = 11 * sc
	lblRotorNameHeader.Gravity = Gravity.CENTER_VERTICAL + Gravity.RIGHT
	pnltitle.AddView(lblRotorNameHeader, root.Width - 180dip * sc, 8dip * sc, 130dip * sc, 38dip * sc)
	
	' 5. Tab Buttons directly inside pnltitle
	Dim tabW As Int = root.Width / 3
	
	btnTabGeom.Initialize("btnTabGeom")
	pnltitle.AddView(btnTabGeom, 0, 57dip * sc, tabW, 45dip * sc)
	btnTabGeom.Text = "GEOMETRY"
	btnTabGeom.TextSize = 13 * sc
	btnTabGeom.Typeface = Typeface.DEFAULT_BOLD
	btnTabGeom.Background = ButtonGradient2(Array As Int(ColorBut3, ColorBut4))
	btnTabGeom.TextColor = ColorButText3
	btnTabGeom.Gravity = Gravity.CENTER
	btnTabGeom.Padding = Array As Int (0, 0, 0, 7dip * sc)
	
	btnTabCond.Initialize("btnTabCond")
	pnltitle.AddView(btnTabCond, tabW, 57dip * sc, tabW, 45dip * sc)
	btnTabCond.Text = "CONDITIONS"
	btnTabCond.TextSize = 13 * sc
	btnTabCond.Typeface = Typeface.DEFAULT_BOLD
	btnTabCond.Background = ButtonGradient2(Array As Int(ColorBut3, ColorBut4))
	btnTabCond.TextColor = ColorButText2
	btnTabCond.Gravity = Gravity.CENTER
	btnTabCond.Padding = Array As Int (0, 0, 0, 7dip * sc)
	
	btnTabRes.Initialize("btnTabRes")
	pnltitle.AddView(btnTabRes, tabW * 2, 57dip * sc, root.Width - tabW * 2, 45dip * sc)
	btnTabRes.Text = "RESULTS"
	btnTabRes.TextSize = 13 * sc
	btnTabRes.Typeface = Typeface.DEFAULT_BOLD
	btnTabRes.Background = ButtonGradient2(Array As Int(ColorBut3, ColorBut4))
	btnTabRes.TextColor = ColorButText2
	btnTabRes.Gravity = Gravity.CENTER
	btnTabRes.Padding = Array As Int (0, 0, 0, 7dip * sc)
	
	' 6. Divider Line between title bar and pager
	Dim line2 As Panel
	line2.Initialize("line2")
	pnltitle.AddView(line2, 0, (102dip - 1dip) * sc, root.Width, 1dip * sc)
	line2.Color = ColorPnlLine2
	line2.Elevation = 5dip
	
	' 7. Sliding Cyan Tab Indicator
	line.Initialize("line")
	pnltitle.AddView(line, 0, (101dip - 4dip) * sc, tabW, 4dip * sc)
	line.Color = ColorPnlLine
	line.Elevation = 5dip
End Sub

' ====================================================================
' PAGE 0: GEOMETRY (AeroCalculator Row-by-Row Layout)
' ====================================================================
Private Sub BuildPageGeom
	pnlBack0.Initialize("")
	pnlBack0.Color = ColorPnlInput5
	scvGeom.Initialize(2500)
	pnlBack0.AddView(scvGeom, 0, 0, root.Width, root.Height - 102dip * sc)
	
	Dim ib As Int = 6dip
	Dim tb As Int = 40dip
	Dim rowH As Int = (ib * 2 + tb) * sc
	Dim PanelNb As Int = 14
	
	Dim j As Int
	For j = 0 To PanelNb - 1
		Dim pnlInput As Panel
		Dim pnlline As Panel
		pnlInput.Initialize("pnlInput")
		pnlline.Initialize("pnlline")
		
		scvGeom.Panel.AddView(pnlInput, 0, j * (rowH + 1dip), root.Width, rowH)
		scvGeom.Panel.AddView(pnlline, 0, (j + 1) * (rowH + 1dip) - 1dip, root.Width, 1dip * sc)
		pnlline.Color = ColorPnlLine3
		
		If (j Mod 2) = 1 Then
			pnlInput.Color = ColorPnlInput1
		Else
			pnlInput.Color = ColorPnlInput2
		End If
		
		Select j
			Case 0
				' Row 0: Preset Selector
				Dim btnP As Button = CreateRowButton("Rotor Preset", "btnPresetClick")
				pnlInput.AddView(btnP, 3%x, ib * sc, 30%x, tb * sc)
				
				Dim pnlSpn As Panel: pnlSpn.Initialize("")
				pnlSpn.Background = ButtonGradient(Array As Int(ColorEdt, ColorEdt), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(pnlSpn, 37%x, ib * sc, 45%x, tb * sc)
				
				spnRotorSelect.Initialize("spnRotorSelect")
				spnRotorSelect.DropdownBackgroundColor = ColorPnlTitle
				spnRotorSelect.DropdownTextColor = ColorTitleText
				pnlSpn.AddView(spnRotorSelect, 0, 0, pnlSpn.Width, pnlSpn.Height)
				RefreshRotorSpinner
				
				Dim btnDup As Button = CreateRowButton("⧉", "btnRotorDup")
				pnlInput.AddView(btnDup, 85%x, ib * sc, 12%x, tb * sc)
				
			Case 1
				edtRadius = AddFullInputRow(pnlInput, ib, tb, "Radius R", "5.50", "m", "edtGeom_TextChanged")
			Case 2
				edtRPM = AddFullInputRow(pnlInput, ib, tb, "Rotor RPM", "390.0", "RPM", "edtGeom_TextChanged")
			Case 3
				edtNBlades = AddFullInputRow(pnlInput, ib, tb, "Blade Count", "4", "blades", "edtGeom_TextChanged")
			Case 4
				edtRootCutout = AddFullInputRow(pnlInput, ib, tb, "Root Cutout", "0.15", "r0/R", "edtGeom_TextChanged")
			Case 5
				edtChordRoot = AddFullInputRow(pnlInput, ib, tb, "Root Chord", "0.324", "m", "edtGeom_TextChanged")
			Case 6
				edtChordTip = AddFullInputRow(pnlInput, ib, tb, "Tip Chord", "0.324", "m", "edtGeom_TextChanged")
			Case 7
				edtThetaRoot = AddFullInputRow(pnlInput, ib, tb, "θ Root Pitch", "12.0", "deg", "edtGeom_TextChanged")
			Case 8
				edtThetaTip = AddFullInputRow(pnlInput, ib, tb, "θ Tip Pitch", "4.0", "deg", "edtGeom_TextChanged")
			Case 9
				edtLiftSlope = AddFullInputRow(pnlInput, ib, tb, "Lift Slope a0", "5.73", "1/rad", "edtGeom_TextChanged")
			Case 10
				edtCd0 = AddFullInputRow(pnlInput, ib, tb, "Profile Cd0", "0.0090", "coef", "edtGeom_TextChanged")
			Case 11
				Dim btnAfLbl As Button = CreateRowButton("Airfoil", "btnAirfoilLbl")
				pnlInput.AddView(btnAfLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnSelectAirfoil.Initialize("btnSelectAirfoil")
				btnSelectAirfoil.Text = "NACA 0012 (Library...)"
				btnSelectAirfoil.TextSize = 13 * sc
				btnSelectAirfoil.TextColor = ColorAccentCyan
				btnSelectAirfoil.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnSelectAirfoil, 37%x, ib * sc, 60%x, tb * sc)
			Case 12
				Dim btnTLbl As Button = CreateRowButton("Tip Loss", "btnTLbl")
				pnlInput.AddView(btnTLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnTipLoss.Initialize("btnTipLoss")
				btnTipLoss.Text = "Sissingh: ON"
				btnTipLoss.TextSize = 13 * sc
				btnTipLoss.TextColor = ColorAccentGreen
				btnTipLoss.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnTipLoss, 37%x, ib * sc, 60%x, tb * sc)
			Case 13
				Dim btnCLbl As Button = CreateRowButton("Compress.", "btnCLbl")
				pnlInput.AddView(btnCLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnCompressibility.Initialize("btnCompressibility")
				btnCompressibility.Text = "Prandtl-Glauert: ON"
				btnCompressibility.TextSize = 13 * sc
				btnCompressibility.TextColor = ColorAccentGreen
				btnCompressibility.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnCompressibility, 37%x, ib * sc, 60%x, tb * sc)
		End Select
	Next
	
	scvGeom.Panel.Height = PanelNb * (rowH + 1dip) + 20dip
End Sub

' ====================================================================
' PAGE 1: CONDITIONS (AeroCalculator Row-by-Row Layout)
' ====================================================================
Private Sub BuildPageCond
	pnlBack1.Initialize("")
	pnlBack1.Color = ColorPnlInput5
	scvCond.Initialize(2500)
	pnlBack1.AddView(scvCond, 0, 0, root.Width, root.Height - 102dip * sc)
	
	Dim ib As Int = 6dip
	Dim tb As Int = 40dip
	Dim rowH As Int = (ib * 2 + tb) * sc
	Dim PanelNb As Int = 11
	
	Dim j As Int
	For j = 0 To PanelNb - 1
		Dim pnlInput As Panel
		Dim pnlline As Panel
		pnlInput.Initialize("pnlInput")
		pnlline.Initialize("pnlline")
		
		scvCond.Panel.AddView(pnlInput, 0, j * (rowH + 1dip), root.Width, rowH)
		scvCond.Panel.AddView(pnlline, 0, (j + 1) * (rowH + 1dip) - 1dip, root.Width, 1dip * sc)
		pnlline.Color = ColorPnlLine3
		
		If (j Mod 2) = 1 Then
			pnlInput.Color = ColorPnlInput1
		Else
			pnlInput.Color = ColorPnlInput2
		End If
		
		Select j
			Case 0
				edtAltitude = AddFullInputRow(pnlInput, ib, tb, "Altitude", "0", "m", "edtCond_TextChanged")
			Case 1
				edtTemperature = AddFullInputRow(pnlInput, ib, tb, "Temperature", "15.0", "°C", "edtCond_TextChanged")
			Case 2
				edtAdvanceMu = AddFullInputRow(pnlInput, ib, tb, "Advance (μ)", "0.00", "μ", "edtCond_TextChanged")
			Case 3
				edtSpeedKmh = AddFullInputRow(pnlInput, ib, tb, "Flight Speed", "0.0", "km/h", "edtSpeedKmh_TextChanged")
			Case 4
				edtShaftTiltAlpha = AddFullInputRow(pnlInput, ib, tb, "Shaft Tilt (α)", "0.0", "deg", "edtCond_TextChanged")
			Case 5
				edtClimbRateW = AddFullInputRow(pnlInput, ib, tb, "Climb Rate", "0.0", "m/s", "edtClimbRate_TextChanged")
			Case 6
				Dim btnInflowLbl As Button = CreateRowButton("Inflow Model", "btnInflowLbl")
				pnlInput.AddView(btnInflowLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnInflowModel.Initialize("btnInflowModel")
				btnInflowModel.Text = "Coleman-Feingold"
				btnInflowModel.TextSize = 13 * sc
				btnInflowModel.TextColor = ColorAccentCyan
				btnInflowModel.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnInflowModel, 37%x, ib * sc, 60%x, tb * sc)
			Case 7
				Dim btnDragLbl As Button = CreateRowButton("Profile Drag", "btnDragLbl")
				pnlInput.AddView(btnDragLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnProfileDragModel.Initialize("btnProfileDragModel")
				btnProfileDragModel.Text = "Numerical Vectorial"
				btnProfileDragModel.TextSize = 13 * sc
				btnProfileDragModel.TextColor = ColorTitleText
				btnProfileDragModel.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnProfileDragModel, 37%x, ib * sc, 60%x, tb * sc)
			Case 8
				Dim btnTrimLbl As Button = CreateRowButton("Hover Trim", "btnTrimLbl")
				pnlInput.AddView(btnTrimLbl, 3%x, ib * sc, 30%x, tb * sc)
				btnHoverTrimMode.Initialize("btnHoverTrimMode")
				btnHoverTrimMode.Text = "Collective to Target"
				btnHoverTrimMode.TextSize = 13 * sc
				btnHoverTrimMode.TextColor = ColorAccentGreen
				btnHoverTrimMode.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
				pnlInput.AddView(btnHoverTrimMode, 37%x, ib * sc, 60%x, tb * sc)
			Case 9
				edtTargetThrust = AddFullInputRow(pnlInput, ib, tb, "Target Thrust", "25000", "N", "edtCond_TextChanged")
			Case 10
				edtTargetCT = AddFullInputRow(pnlInput, ib, tb, "Target CT", "0.00650", "coef", "edtCond_TextChanged")
		End Select
	Next
	
	scvCond.Panel.Height = PanelNb * (rowH + 1dip) + 20dip
End Sub

' ====================================================================
' PAGE 2: RESULTS / OUTPUTS (AeroCalculator scvMain2 Architecture)
' ====================================================================
Private Sub BuildPageRes
	pnlBack2.Initialize("")
	pnlBack2.Color = ColorPnlInput5
	scvRes.Initialize(2500)
	pnlBack2.AddView(scvRes, 0, 0, root.Width, root.Height - 102dip * sc)
	
	Dim PanelNb1 As Int = 26 ' 1 Action button + 25 Telemetry rows
	Dim PanelHeight1 As Int = 42dip * sc
	
	' 1. Top Action Button: Open Multi-Parameter μ-Sweep
	btnViewPolarPlot.Initialize("btnViewPolarPlot")
	btnViewPolarPlot.Text = "📈 OPEN MULTI-PARAMETER SWEEP (μ)"
	btnViewPolarPlot.TextSize = 14 * sc
	btnViewPolarPlot.Typeface = Typeface.DEFAULT_BOLD
	btnViewPolarPlot.TextColor = ColorAccentCyan
	btnViewPolarPlot.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
	scvRes.Panel.AddView(btnViewPolarPlot, 3%x, 8dip * sc, 94%x, 46dip * sc)
	
	Dim startY As Int = 60dip * sc
	
	Dim outputLabels As List
	outputLabels.Initialize2(Array As String( _
		"Total Thrust (T)", _
		"Thrust Coef (CT)", _
		"Shaft Power (P)", _
		"Power Coef (CP)", _
		"Total Torque (Q)", _
		"Torque Coef (CQ)", _
		"Induced Torque (CQi)", _
		"Profile Drag Torque (CQ0)", _
		"In-Plane Drag (H)", _
		"In-Plane Coef (CH)", _
		"Side Force Coef (CY)", _
		"Pitch Moment Coef (CMy)", _
		"Roll Moment Coef (CMx)", _
		"Figure of Merit (FoM)", _
		"Effective L/D Ratio", _
		"Total Inflow Ratio (λ)", _
		"Induced Inflow Ratio (λi)", _
		"Longitudinal Inflow (Kx)", _
		"Lateral Inflow (Ky)", _
		"Wake Skew Angle (χ)", _
		"Tip Mach (Hover)", _
		"Advancing Tip Mach (Mat)", _
		"Air Density (ρ)", _
		"Ambient Pressure (p)", _
		"Speed of Sound (a)" _
	))
	
	Dim i As Int
	For i = 0 To outputLabels.Size - 1
		Dim pnltest As Panel
		Dim pnlline As Panel
		pnltest.Initialize("")
		pnlline.Initialize("")
		
		Dim curY As Int = startY + i * PanelHeight1
		scvRes.Panel.AddView(pnltest, 0, curY, root.Width, PanelHeight1)
		scvRes.Panel.AddView(pnlline, 0, curY + PanelHeight1 - 1dip, root.Width, 1dip * sc)
		pnlline.Color = ColorPnlLine3
		
		If (i Mod 2) = 1 Then
			pnltest.Color = ColorPnlInput3
		Else
			pnltest.Color = ColorPnlInput4
		End If
		
		Dim lblVar As Label
		lblVar.Initialize("")
		pnltest.AddView(lblVar, 4%x, 0, 52%x, PanelHeight1)
		lblVar.Text = outputLabels.Get(i)
		lblVar.TextSize = 13 * sc
		lblVar.Typeface = Typeface.DEFAULT_BOLD
		lblVar.TextColor = ColorTitleText
		lblVar.Gravity = Bit.Or(Gravity.CENTER_VERTICAL, Gravity.LEFT)
		
		lblResults(i).Initialize("")
		pnltest.AddView(lblResults(i), 56%x, 0, 40%x, PanelHeight1)
		lblResults(i).Text = "---"
		lblResults(i).TextSize = 13 * sc
		lblResults(i).Typeface = Typeface.DEFAULT_BOLD
		lblResults(i).TextColor = ColorAccentCyan
		lblResults(i).Gravity = Bit.Or(Gravity.CENTER_VERTICAL, Gravity.RIGHT)
	Next
	
	scvRes.Panel.Height = startY + (outputLabels.Size * PanelHeight1) + 20dip
End Sub

' Helper to create 30%x | 36%x | 20%x standard input rows
Private Sub AddFullInputRow(pnl As Panel, ib As Int, tb As Int, lblText As String, defVal As String, unitText As String, evtName As String) As EditText
	Dim btn As Button = CreateRowButton(lblText, "")
	pnl.AddView(btn, 3%x, ib * sc, 30%x, tb * sc)
	
	Dim edt As EditText
	edt.Initialize(evtName)
	edt.Text = defVal
	edt.TextSize = 14 * sc
	edt.TextColor = ColorEdtText
	edt.Color = ColorEdt
	edt.HintColor = ColorEdtHint
	edt.Gravity = Bit.Or(Gravity.CENTER_VERTICAL, Gravity.CENTER_HORIZONTAL)
	edt.InputType = edt.INPUT_TYPE_DECIMAL_NUMBERS
	edt.ForceDoneButton = True
	pnl.AddView(edt, 37%x, ib * sc, 36%x, tb * sc)
	
	Dim btnUnit As Button = CreateRowButton(unitText, "")
	btnUnit.TextColor = ColorButText2
	pnl.AddView(btnUnit, 77%x, ib * sc, 20%x, tb * sc)
	
	Return edt
End Sub

Private Sub CreateRowButton(txt As String, evt As String) As Button
	Dim btn As Button
	btn.Initialize(evt)
	btn.Text = txt
	btn.TextSize = 13 * sc
	btn.Typeface = Typeface.DEFAULT_BOLD
	btn.TextColor = ColorButText1
	btn.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
	btn.Gravity = Gravity.CENTER
	Return btn
End Sub

' ====================================================================
' AEROCALCULATOR GRADIENTS & DRAWABLES
' ====================================================================
Sub ButtonGradient(ColorList() As Int, ColorList2() As Int) As StateListDrawable
	Dim gdwEnabled As GradientDrawable
	gdwEnabled.Initialize("TOP_BOTTOM", ColorList)
	gdwEnabled.CornerRadius = 4dip
	Dim gdwPressed As GradientDrawable
	gdwPressed.Initialize("BOTTOM_TOP", ColorList2)
	gdwPressed.CornerRadius = 6dip
	Dim gdwDisabled As GradientDrawable
	gdwDisabled.Initialize("TOP_BOTTOM", Array As Int(Colors.LightGray, Colors.DarkGray))
	gdwDisabled.CornerRadius = 4dip
	Dim stdGradient As StateListDrawable
	stdGradient.Initialize
	stdGradient.AddState2(Array As Int(stdGradient.State_enabled, -stdGradient.State_Pressed), gdwEnabled)
	stdGradient.AddState(stdGradient.State_Pressed, gdwPressed)
	stdGradient.AddState(stdGradient.State_Disabled, gdwDisabled)
	Return stdGradient
End Sub

Sub ButtonGradient2(ColorList() As Int) As StateListDrawable
	Dim gdwEnabled As GradientDrawable
	gdwEnabled.Initialize("TOP_BOTTOM", ColorList)
	gdwEnabled.CornerRadius = 4dip
	Dim gdwPressed As GradientDrawable
	gdwPressed.Initialize("TOP_BOTTOM", ColorList)
	gdwPressed.CornerRadius = 12dip
	Dim gdwDisabled As GradientDrawable
	gdwDisabled.Initialize("TOP_BOTTOM", Array As Int(Colors.LightGray, Colors.DarkGray))
	gdwDisabled.CornerRadius = 4dip
	Dim stdGradient As StateListDrawable
	stdGradient.Initialize
	stdGradient.AddState2(Array As Int(stdGradient.State_enabled, -stdGradient.State_Pressed), gdwEnabled)
	stdGradient.AddState(stdGradient.State_Pressed, gdwPressed)
	stdGradient.AddState(stdGradient.State_Disabled, gdwDisabled)
	Return stdGradient
End Sub

' ====================================================================
' NAVIGATION & PAGER EVENTS
' ====================================================================
Sub pager_PageChanged (Position As Int)
	CurrentPage = Position
	Dim tabW As Int = root.Width / 3
	line.SetLayoutAnimated(150, Position * tabW, (101dip - 4dip) * sc, tabW, 4dip * sc)
	
	btnTabGeom.TextColor = ColorButText2
	btnTabCond.TextColor = ColorButText2
	btnTabRes.TextColor = ColorButText2
	
	Select Position
		Case 0
			btnTabGeom.TextColor = ColorButText3
		Case 1
			btnTabCond.TextColor = ColorButText3
		Case 2
			btnTabRes.TextColor = ColorButText3
			Dim HideK As IME: HideK.Initialize(""): HideK.HideKeyboard
			RecalculateRotor
	End Select
End Sub

Sub btnTabGeom_Click
	pager.CurrentPage = 0
End Sub

Sub btnTabCond_Click
	pager.CurrentPage = 1
End Sub

Sub btnTabRes_Click
	pager.CurrentPage = 2
End Sub

' ====================================================================
' AERODYNAMIC CALCULATION & TELEMETRY MAPPING
' ====================================================================
Public Sub RecalculateRotor
	If UpdatingUI Then Return
	
	ActiveRes = zBETEngine.Calculate(ActiveGeom, ActiveCond)
	
	' Populate 25 Results Rows
	lblResults(0).Text = NumberFormat(ActiveRes.ThrustN, 1, 0) & " N (" & NumberFormat(ActiveRes.ThrustKgf, 1, 0) & " kgf)"
	lblResults(1).Text = NumberFormat(ActiveRes.CT, 1, 5)
	lblResults(2).Text = NumberFormat(ActiveRes.PowerShaftKW, 1, 1) & " kW (" & NumberFormat(ActiveRes.PowerShaftHP, 1, 1) & " HP)"
	lblResults(3).Text = NumberFormat(ActiveRes.CQ, 1, 6)
	lblResults(4).Text = NumberFormat(ActiveRes.TorqueNm, 1, 1) & " N·m"
	lblResults(5).Text = NumberFormat(ActiveRes.CQ, 1, 6)
	lblResults(6).Text = NumberFormat(ActiveRes.CQi, 1, 6)
	lblResults(7).Text = NumberFormat(ActiveRes.CQ0, 1, 6)
	lblResults(8).Text = NumberFormat(ActiveRes.HForceN, 1, 1) & " N"
	lblResults(9).Text = NumberFormat(ActiveRes.CH, 1, 6)
	lblResults(10).Text = NumberFormat(ActiveRes.CY, 1, 6)
	lblResults(11).Text = NumberFormat(ActiveRes.CMy, 1, 6)
	lblResults(12).Text = NumberFormat(ActiveRes.CMx, 1, 6)
	lblResults(13).Text = NumberFormat(ActiveRes.FoM, 1, 4)
	lblResults(14).Text = NumberFormat(ActiveRes.L_D_eff, 1, 2)
	lblResults(15).Text = NumberFormat(ActiveRes.InflowLambda, 1, 5)
	lblResults(16).Text = NumberFormat(ActiveRes.InflowLambdaI, 1, 5)
	lblResults(17).Text = NumberFormat(ActiveRes.InflowKx, 1, 3)
	lblResults(18).Text = NumberFormat(ActiveRes.InflowKy, 1, 3)
	lblResults(19).Text = NumberFormat(ActiveRes.WakeSkewChiDeg, 1, 1) & "°"
	lblResults(20).Text = NumberFormat(ActiveRes.TipMachHover, 1, 3)
	lblResults(21).Text = NumberFormat(ActiveRes.AdvancingTipMach, 1, 3)
	lblResults(22).Text = NumberFormat(ActiveCond.Rho, 1, 4) & " kg/m³"
	lblResults(23).Text = NumberFormat(ActiveCond.PressureHPa, 1, 1) & " hPa"
	lblResults(24).Text = NumberFormat(ActiveCond.SpeedOfSound, 1, 1) & " m/s"
End Sub

Public Sub LoadRotorDataToFields(geom As RotorGeometry)
	UpdatingUI = True
	edtRadius.Text = NumberFormat(geom.Radius, 1, 2)
	edtRPM.Text = NumberFormat(geom.RPM, 1, 1)
	edtNBlades.Text = geom.NBlades
	edtRootCutout.Text = NumberFormat(geom.RootCutout, 1, 3)
	edtChordRoot.Text = NumberFormat(geom.ChordRoot, 1, 4)
	edtChordTip.Text = NumberFormat(geom.ChordTip, 1, 4)
	edtThetaRoot.Text = NumberFormat(geom.ThetaRootDeg, 1, 2)
	edtThetaTip.Text = NumberFormat(geom.ThetaTipDeg, 1, 2)
	edtLiftSlope.Text = NumberFormat(geom.LiftSlope0, 1, 2)
	edtCd0.Text = NumberFormat(geom.Cd0, 1, 4)
	lblRotorNameHeader.Text = geom.Name
	UpdatingUI = False
End Sub

Private Sub RefreshRotorSpinner
	spnRotorSelect.Clear
	For i = 0 To RotorStorage.PresetKeys.Size - 1
		spnRotorSelect.Add(RotorStorage.PresetNames.Get(i))
	Next
End Sub

Sub spnRotorSelect_ItemClick(Position As Int, Value As Object)
	If Position >= 0 And Position < RotorStorage.PresetKeys.Size Then
		Dim key As String = RotorStorage.PresetKeys.Get(Position)
		ActiveGeom = RotorStorage.GetPreset(key)
		LoadRotorDataToFields(ActiveGeom)
		RecalculateRotor
	End If
End Sub

Sub btnRotorDup_Click
	Dim newName As String = InputBox("Enter duplicate rotor preset name:", "Duplicate Preset", ActiveGeom.Name & " Copy")
	If newName <> "" Then
		Dim key As String = "custom_" & DateTime.Now
		ActiveGeom.Name = newName
		RotorStorage.SavePreset(key, ActiveGeom)
		RefreshRotorSpinner
		ToastMessageShow("Preset duplicated!", False)
	End If
End Sub

Sub btnSelectAirfoil_Click
	Dim options As List: options.Initialize
	For i = 0 To RotorPopups.Airfoils.Size - 1
		Dim af As AirfoilData = RotorPopups.Airfoils.Get(i)
		options.Add(af.Name & " (a0=" & af.A0 & ", Cd0=" & af.Cd0 & ")")
	Next
	Dim resIndex As Int = InputList(options, "Select Airfoil Section:", -1)
	If resIndex >= 0 Then
		Dim selAf As AirfoilData = RotorPopups.Airfoils.Get(resIndex)
		ActiveGeom.LiftSlope0 = selAf.A0
		ActiveGeom.Cd0 = selAf.Cd0
		edtLiftSlope.Text = NumberFormat(selAf.A0, 1, 2)
		edtCd0.Text = NumberFormat(selAf.Cd0, 1, 4)
		btnSelectAirfoil.Text = selAf.Name
		RecalculateRotor
	End If
End Sub

Sub btnTipLoss_Click
	ActiveGeom.TipLossEnabled = Not(ActiveGeom.TipLossEnabled)
	If ActiveGeom.TipLossEnabled Then
		btnTipLoss.Text = "Sissingh: ON"
		btnTipLoss.TextColor = ColorAccentGreen
	Else
		btnTipLoss.Text = "Sissingh: OFF"
		btnTipLoss.TextColor = ColorButText2
	End If
	RecalculateRotor
End Sub

Sub btnCompressibility_Click
	ActiveGeom.CompressibilityEnabled = Not(ActiveGeom.CompressibilityEnabled)
	If ActiveGeom.CompressibilityEnabled Then
		btnCompressibility.Text = "Prandtl-Glauert: ON"
		btnCompressibility.TextColor = ColorAccentGreen
	Else
		btnCompressibility.Text = "Prandtl-Glauert: OFF"
		btnCompressibility.TextColor = ColorButText2
	End If
	RecalculateRotor
End Sub

Sub btnInflowModel_Click
	If ActiveCond.InflowModel = "uniform" Then
		ActiveCond.InflowModel = "coleman_simple"
		btnInflowModel.Text = "Coleman Simple"
	Else If ActiveCond.InflowModel = "coleman_simple" Then
		ActiveCond.InflowModel = "coleman_feingold"
		btnInflowModel.Text = "Coleman-Feingold"
	Else If ActiveCond.InflowModel = "coleman_feingold" Then
		ActiveCond.InflowModel = "drees"
		btnInflowModel.Text = "Drees Linear"
	Else
		ActiveCond.InflowModel = "uniform"
		btnInflowModel.Text = "Uniform Benchmark"
	End If
	RecalculateRotor
End Sub

Sub btnProfileDragModel_Click
	If ActiveCond.ProfileDragModel = "analytical_tangential" Then
		ActiveCond.ProfileDragModel = "analytical_vectorial"
		btnProfileDragModel.Text = "Analytical Vectorial"
	Else If ActiveCond.ProfileDragModel = "analytical_vectorial" Then
		ActiveCond.ProfileDragModel = "numerical_vectorial"
		btnProfileDragModel.Text = "Numerical Vectorial"
	Else
		ActiveCond.ProfileDragModel = "analytical_tangential"
		btnProfileDragModel.Text = "Analytical Tangential"
	End If
	RecalculateRotor
End Sub

Sub btnHoverTrimMode_Click
	If ActiveCond.HoverTrimMode = "none" Then
		ActiveCond.HoverTrimMode = "collective_pitch"
		btnHoverTrimMode.Text = "Collective to Target"
		btnHoverTrimMode.TextColor = ColorAccentGreen
	Else
		ActiveCond.HoverTrimMode = "none"
		btnHoverTrimMode.Text = "Manual Pitch"
		btnHoverTrimMode.TextColor = ColorButText2
	End If
	RecalculateRotor
End Sub

Sub edtGeom_TextChanged (Old As String, New As String)
	If UpdatingUI Then Return
	ActiveGeom.Radius = ParseDoubleDef(edtRadius.Text, ActiveGeom.Radius)
	ActiveGeom.RPM = ParseDoubleDef(edtRPM.Text, ActiveGeom.RPM)
	ActiveGeom.NBlades = ParseIntDef(edtNBlades.Text, ActiveGeom.NBlades)
	ActiveGeom.RootCutout = ParseDoubleDef(edtRootCutout.Text, ActiveGeom.RootCutout)
	ActiveGeom.ChordRoot = ParseDoubleDef(edtChordRoot.Text, ActiveGeom.ChordRoot)
	ActiveGeom.ChordTip = ParseDoubleDef(edtChordTip.Text, ActiveGeom.ChordTip)
	ActiveGeom.ThetaRootDeg = ParseDoubleDef(edtThetaRoot.Text, ActiveGeom.ThetaRootDeg)
	ActiveGeom.ThetaTipDeg = ParseDoubleDef(edtThetaTip.Text, ActiveGeom.ThetaTipDeg)
	ActiveGeom.LiftSlope0 = ParseDoubleDef(edtLiftSlope.Text, ActiveGeom.LiftSlope0)
	ActiveGeom.Cd0 = ParseDoubleDef(edtCd0.Text, ActiveGeom.Cd0)
	RecalculateRotor
End Sub

Sub edtCond_TextChanged (Old As String, New As String)
	If UpdatingUI Then Return
	ActiveCond.AltitudeM = ParseDoubleDef(edtAltitude.Text, ActiveCond.AltitudeM)
	ActiveCond.TemperatureC = ParseDoubleDef(edtTemperature.Text, ActiveCond.TemperatureC)
	ActiveCond.Mu = ParseDoubleDef(edtAdvanceMu.Text, ActiveCond.Mu)
	ActiveCond.ShaftTiltDeg = ParseDoubleDef(edtShaftTiltAlpha.Text, ActiveCond.ShaftTiltDeg)
	ActiveCond.TargetThrustN = ParseDoubleDef(edtTargetThrust.Text, ActiveCond.TargetThrustN)
	ActiveCond.TargetCT = ParseDoubleDef(edtTargetCT.Text, ActiveCond.TargetCT)
	
	' Sync forward flight speed in km/h
	Dim omega As Double = ActiveGeom.RPM * (cPI / 30.0)
	Dim vtip As Double = omega * ActiveGeom.Radius
	If vtip > 0 Then
		Dim vKmh As Double = ActiveCond.Mu * vtip * 3.6
		UpdatingUI = True
		edtSpeedKmh.Text = NumberFormat(vKmh, 1, 1)
		UpdatingUI = False
	End If
	RecalculateRotor
End Sub

Sub edtSpeedKmh_TextChanged (Old As String, New As String)
	If UpdatingUI Then Return
	Dim vKmh As Double = ParseDoubleDef(edtSpeedKmh.Text, 0)
	Dim vMs As Double = vKmh / 3.6
	Dim omega As Double = ActiveGeom.RPM * (cPI / 30.0)
	Dim vtip As Double = omega * ActiveGeom.Radius
	If vtip > 0 Then
		UpdatingUI = True
		ActiveCond.Mu = vMs / vtip
		edtAdvanceMu.Text = NumberFormat(ActiveCond.Mu, 1, 3)
		UpdatingUI = False
		RecalculateRotor
	End If
End Sub

Sub edtClimbRate_TextChanged (Old As String, New As String)
	If UpdatingUI Then Return
	Dim w As Double = ParseDoubleDef(edtClimbRateW.Text, 0)
	Dim omega As Double = ActiveGeom.RPM * (cPI / 30.0)
	Dim vtip As Double = omega * ActiveGeom.Radius
	If vtip > 0 Then
		UpdatingUI = True
		ActiveCond.MuZ = w / vtip
		UpdatingUI = False
		RecalculateRotor
	End If
End Sub

' ====================================================================
' SWEEP POPUP (Multi-Parameter μ-Sweep)
' ====================================================================
Sub btnViewPolarPlot_Click
	pnlSweepPopup.Initialize("pnlSweepPopup")
	pnlSweepPopup.Color = 0xFA0A0E15
	Activity.AddView(pnlSweepPopup, 0, 0, 100%x, 100%y)
	pnlSweepPopup.BringToFront
	
	Dim topBarH As Int = 48dip * sc
	Dim pnlHeader As Panel: pnlHeader.Initialize("")
	pnlHeader.Color = ColorPnlTitle
	pnlSweepPopup.AddView(pnlHeader, 0, 0, 100%x, topBarH)
	
	Dim lblTitle As Label: lblTitle.Initialize("")
	lblTitle.Text = "📈 MULTI-PARAMETER SWEEP vs μ"
	lblTitle.TextColor = ColorAccentCyan
	lblTitle.TextSize = 14 * sc
	lblTitle.Typeface = Typeface.DEFAULT_BOLD
	lblTitle.Gravity = Gravity.CENTER_VERTICAL
	pnlHeader.AddView(lblTitle, 12dip, 0, 100%x - 60dip, topBarH)
	
	Dim btnClose As Button: btnClose.Initialize("btnCloseSweepPlot")
	btnClose.Text = "✕"
	btnClose.TextColor = 0xFFFF5252
	btnClose.TextSize = 18 * sc
	btnClose.Color = Colors.Transparent
	pnlHeader.AddView(btnClose, 100%x - 45dip, 0, 40dip, topBarH)
	
	Dim pnlControls As Panel: pnlControls.Initialize("")
	pnlControls.Color = ColorPnlInput2
	pnlSweepPopup.AddView(pnlControls, 0, topBarH, 100%x, 88dip * sc)
	
	Dim lblParamH As Label: lblParamH.Initialize("")
	lblParamH.Text = "SELECT PARAMETER (Y-AXIS):"
	lblParamH.TextColor = ColorButText2
	lblParamH.TextSize = 11 * sc
	lblParamH.Typeface = Typeface.DEFAULT_BOLD
	pnlControls.AddView(lblParamH, 12dip, 4dip, 100%x - 24dip, 16dip * sc)
	
	spnSweepParam.Initialize("spnSweepParam")
	spnSweepParam.DropdownBackgroundColor = ColorPnlTitle
	spnSweepParam.DropdownTextColor = ColorTitleText
	pnlControls.AddView(spnSweepParam, 12dip, 22dip * sc, 100%x - 24dip, 34dip * sc)
	
	spnSweepParam.Clear
	For i = 0 To RotorPopups.SweepParamLabels.Size - 1
		spnSweepParam.Add(RotorPopups.SweepParamLabels.Get(i))
	Next
	
	Dim curIdx As Int = 0
	For i = 0 To RotorPopups.SweepParamKeys.Size - 1
		If RotorPopups.SweepParamKeys.Get(i) = SweepParamSelectedKey Then
			curIdx = i
			Exit
		End If
	Next
	spnSweepParam.SelectedIndex = curIdx
	
	btnSweepMultiModel.Initialize("btnSweepMultiModel")
	UpdateSweepMultiButtonText
	btnSweepMultiModel.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
	btnSweepMultiModel.TextSize = 11 * sc
	pnlControls.AddView(btnSweepMultiModel, 12dip, 58dip * sc, (100%x - 30dip) * 0.60, 26dip * sc)
	
	btnSweepMaxMu.Initialize("btnSweepMaxMu")
	btnSweepMaxMu.Text = "μ max: " & NumberFormat(SweepMaxMuVal, 1, 2)
	btnSweepMaxMu.TextColor = ColorAccentAmber
	btnSweepMaxMu.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
	btnSweepMaxMu.TextSize = 11 * sc
	pnlControls.AddView(btnSweepMaxMu, 18dip + (100%x - 30dip) * 0.60, 58dip * sc, (100%x - 30dip) * 0.40, 26dip * sc)
	
	Dim plotTop As Int = topBarH + 90dip * sc
	Dim plotW As Int = 100%x - 16dip
	Dim plotH As Int = 100%y - plotTop - 52dip * sc
	
	ivSweepPlot.Initialize("")
	pnlSweepPopup.AddView(ivSweepPlot, 8dip, plotTop, plotW, plotH)
	
	Dim pnlFooter As Panel: pnlFooter.Initialize("")
	pnlFooter.Color = ColorPnlTitle
	pnlSweepPopup.AddView(pnlFooter, 0, 100%y - 50dip * sc, 100%x, 50dip * sc)
	
	lblSweepCurrentVal.Initialize("")
	lblSweepCurrentVal.TextColor = ColorAccentAmber
	lblSweepCurrentVal.TextSize = 12 * sc
	lblSweepCurrentVal.Typeface = Typeface.DEFAULT_BOLD
	lblSweepCurrentVal.Gravity = Gravity.CENTER_VERTICAL
	pnlFooter.AddView(lblSweepCurrentVal, 12dip, 0, 100%x - 140dip, 50dip * sc)
	
	Dim btnTable As Button: btnTable.Initialize("btnSweepTable")
	btnTable.Text = "📋 TABLE"
	btnTable.TextColor = ColorAccentCyan
	btnTable.Background = ButtonGradient(Array As Int(ColorBut1, ColorBut2), Array As Int(ColorBut1, ColorPnlTitle))
	btnTable.TextSize = 12 * sc
	btnTable.Typeface = Typeface.DEFAULT_BOLD
	pnlFooter.AddView(btnTable, 100%x - 130dip, 6dip * sc, 120dip, 38dip * sc)
	
	UpdateSweepPlotView
End Sub

Sub spnSweepParam_ItemClick(Position As Int, Value As Object)
	If Position >= 0 And Position < RotorPopups.SweepParamKeys.Size Then
		SweepParamSelectedKey = RotorPopups.SweepParamKeys.Get(Position)
		SweepParamSelectedLabel = RotorPopups.SweepParamLabels.Get(Position)
		UpdateSweepPlotView
	End If
End Sub

Sub btnSweepMultiModel_Click
	SweepMultiMode = (SweepMultiMode + 1) Mod 4
	UpdateSweepMultiButtonText
	UpdateSweepPlotView
End Sub

Private Sub UpdateSweepMultiButtonText
	Select SweepMultiMode
		Case 0
			btnSweepMultiModel.Text = "Curves: 4 Inflow Models"
			btnSweepMultiModel.TextColor = ColorAccentCyan
		Case 1
			btnSweepMultiModel.Text = "Curves: 5 Alphas (-10°..+10°)"
			btnSweepMultiModel.TextColor = ColorAccentCyan
		Case 2
			btnSweepMultiModel.Text = "Curves: 5 Vz (-10..+10 m/s)"
			btnSweepMultiModel.TextColor = ColorAccentCyan
		Case 3
			btnSweepMultiModel.Text = "Curves: Single Active"
			btnSweepMultiModel.TextColor = ColorButText2
	End Select
End Sub

Sub btnSweepMaxMu_Click
	If SweepMaxMuVal < 0.45 Then
		SweepMaxMuVal = 0.50
	Else
		SweepMaxMuVal = 0.40
	End If
	btnSweepMaxMu.Text = "μ max: " & NumberFormat(SweepMaxMuVal, 1, 2)
	UpdateSweepPlotView
End Sub

Sub btnCloseSweepPlot_Click
	pnlSweepPopup.RemoveView
End Sub

Sub UpdateSweepPlotView
	If ivSweepPlot.IsInitialized = False Then Return
	Dim plotW As Int = ivSweepPlot.Width
	Dim plotH As Int = ivSweepPlot.Height
	If plotW <= 10 Then plotW = 100%x - 16dip
	If plotH <= 10 Then plotH = 300dip
	
	Dim bmp As Bitmap = RotorPopups.DrawSweepPlot( _
		ActiveGeom, ActiveCond, SweepParamSelectedKey, SweepParamSelectedLabel, _
		plotW, plotH, SweepMaxMuVal, SweepMultiMode)
	ivSweepPlot.Bitmap = bmp
	
	Dim curVal As Double = RotorPopups.ExtractParamValue(ActiveRes, SweepParamSelectedKey)
	lblSweepCurrentVal.Text = "Operating μ=" & NumberFormat(ActiveCond.Mu, 1, 2) & ": " & NumberFormat(curVal, 1, 5)
End Sub

Sub btnSweepTable_Click
	Dim sb As StringBuilder: sb.Initialize
	sb.Append("Advance Ratio (μ)").Append(TAB).Append(SweepParamSelectedKey).Append(CRLF)
	sb.Append("----------------------------------------").Append(CRLF)
	
	Dim tempCond As FlightCondition = ActiveCond
	For i = 0 To 10
		Dim mu As Double = i * (SweepMaxMuVal / 10.0)
		tempCond.Mu = mu
		Dim res As RotorResults = zBETEngine.Calculate(ActiveGeom, tempCond)
		Dim v As Double = RotorPopups.ExtractParamValue(res, SweepParamSelectedKey)
		sb.Append(NumberFormat(mu, 1, 2)).Append(TAB).Append(TAB).Append(NumberFormat(v, 1, 5)).Append(CRLF)
	Next
	
	Msgbox(sb.ToString, "Data Table: " & SweepParamSelectedKey)
End Sub

Sub btnMenu_Click
	Dim options As List: options.Initialize
	If UnitSystem = 0 Then
		options.Add("Unit System: Metric (SI)")
	Else
		options.Add("Unit System: Imperial")
	End If
	options.Add("Reset to Factory Presets")
	options.Add("zBET Conventions & Physical Axes")
	options.Add("About RotorCalculator")
	
	Dim res As Int = InputList(options, "Settings & Tools", -1)
	If res = 0 Then
		UnitSystem = 1 - UnitSystem
		ToastMessageShow("Unit toggled!", False)
		RecalculateRotor
	Else If res = 1 Then
		RotorStorage.ResetToDefaults
		RefreshRotorSpinner
		ActiveGeom = RotorStorage.GetActiveRotor
		LoadRotorDataToFields(ActiveGeom)
		RecalculateRotor
		ToastMessageShow("Factory presets restored!", False)
	Else If res = 2 Then
		Msgbox("zBET Coordinate Conventions:" & CRLF & CRLF & _
			"+x: Forward (aircraft nose)" & CRLF & _
			"+y: Starboard (right wing)" & CRLF & _
			"+z: Downward through rotor disk" & CRLF & CRLF & _
			"Thrust acts upward (-z)." & CRLF & _
			"Shaft torque Q > 0 powers CCW rotor." & CRLF & _
			"Advance ratio: μ = V / (ΩR)" & CRLF & _
			"Axial flow: μz = -μ·tan(α)" & CRLF & _
			"Mean downwash inflow: λ = μz + λi", "zBET Conventions")
	Else If res = 3 Then
		Msgbox("RotorCalculator v1.0.0" & CRLF & CRLF & _
			"High-Fidelity Helicopter & Rotorcraft Aeromechanics Calculator for Android." & CRLF & CRLF & _
			"Engineered on rigorous Blade Element & Momentum Theory (zBET), following Wayne Johnson & J. Gordon Leishman.", "About")
	End If
End Sub

' Parsing Utilities
Private Sub ParseDoubleDef(txt As String, defVal As Double) As Double
	If txt = "" Or txt = "-" Or txt = "." Then Return defVal
	Try
		Return txt
	Catch
		Return defVal
	End Try
End Sub

Private Sub ParseIntDef(txt As String, defVal As Int) As Int
	If txt = "" Then Return defVal
	Try
		Return txt
	Catch
		Return defVal
	End Try
End Sub
"""
    with open(r"C:\Projetos\RotorCalculator\RotorCalculator.b4a", "w", encoding="utf-8") as f:
        f.write(b4a_content)
    print("RotorCalculator.b4a written with authentic AeroCalculator architecture!")

if __name__ == "__main__":
    create_aerocalculator_style_b4a()
