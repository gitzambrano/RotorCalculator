from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_engine_clones_geometry_before_trim():
    src = text("zBETEngine.bas")
    assert "Dim trimmedGeom As RotorGeometry = CloneGeometry(geom)" in src
    assert "Dim trimmedGeom As RotorGeometry = geom" not in src


def test_sweep_and_table_clone_flight_condition():
    popup = text("RotorPopups.bas")
    main = text("RotorCalculator.b4a")
    assert "Dim tempCond As FlightCondition = zBETEngine.CloneCondition(cond)" in popup
    assert "Dim tempCond As FlightCondition = cond" not in popup
    assert "Dim tempCond As FlightCondition = zBETEngine.CloneCondition(ActiveCond)" in main
    assert "Dim tempCond As FlightCondition = ActiveCond" not in main


def test_duplicate_uses_storage_clone_path():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert "RotorStorage.DuplicateRotor(RotorStorage.ActiveIndex)" in main
    assert "clone.Name = src.Name" in storage
    assert "clone.Radius = src.Radius" in storage
    assert "clone.TipLossMode = src.TipLossMode" in storage


def test_geometry_is_list_with_contextual_popup_not_header_selector():
    main = text("RotorCalculator.b4a")
    assert "Private Sub RefreshRotorList" in main
    assert "Sub pnlRotorTap_Click" in main
    assert "Private Sub OpenGeometryPopup" in main
    assert 'btnCopy.Text = "COPY ROTOR"' in main
    assert "spnRotorSelect" not in main
    assert "lblRotorNameHeader" not in main


def test_sweep_spinner_selected_text_is_legible():
    main = text("RotorCalculator.b4a")
    assert "spnSweepParam.TextColor = ColorTitleText" in main


def test_qa_checks_state_purity_and_real_geometry_popup():
    qa = text("tools/ci_ui_qa.sh")
    assert 'grep -qi "ACTIVE" "$OUT/11-sweep.json"' in qa
    assert "09-geometry-after-rotation" in qa
    assert "02-geometry-popup-top.png" in qa
    assert "safe_screencap" in qa


def test_popup_back_navigation_uses_explicit_state_flags():
    main = text("RotorCalculator.b4a")
    assert "Private GeometryPopupOpen As Boolean = False" in main
    assert "Private SweepPopupOpen As Boolean = False" in main
    assert "If GeometryPopupOpen Then" in main
    assert "If SweepPopupOpen Then" in main
    assert ".Parent = root" not in main


def test_active_rotor_selection_is_persisted():
    storage = text("RotorStorage.bas")
    assert 'ACTIVE_INDEX_FILENAME As String = "active_rotor.txt"' in storage
    assert "Private Sub LoadActiveIndex" in storage
    assert "Private Sub SaveActiveIndex" in storage
    assert "SetActiveRotor(index As Int)" in storage
    assert "SaveActiveIndex" in storage


def test_qa_rejects_corrupt_frames_and_checks_process_liveness():
    qa = text("tools/ci_ui_qa.sh")
    assert "check_dark_png.py" in qa
    assert "assert_app_alive" in qa
    assert "06b-after-sweep-back" in qa


def test_sweep_footer_is_compact_and_explicit():
    main = text("RotorCalculator.b4a")
    assert 'lblSweepCurrentVal.Text = "ACTIVE · μ="' in main
    assert '" · Vx="' in main
    assert '" m/s · μz="' in main
    assert 'btnTable.Text = "TABLE"' in main
    assert 'btnCsv.Text = "CSV"' in main
    assert 'btnPng.Text = "PNG"' in main


def test_functional_smoke_verifies_active_rotor_after_cold_restart():
    qa = text("tools/ci_ui_qa.sh")
    assert "06b-list-after-cold-restart" in qa
    assert "ACTIVE badge is not on copied rotor row after cold restart" in qa


def test_ui_tap_helper_prefers_exact_clickable_controls():
    wf = text(".github/workflows/frontend-source-qa.yml")
    assert "Exact clickable controls win" in wf
    assert "priority=(0 if exact and clickable else" in wf
    assert "candidates.sort(key=lambda c:(c[0],c[1]))" in wf


def test_github_qa_is_manual_only_and_never_handles_release_keys():
    wf = text(".github/workflows/frontend-source-qa.yml")
    assert "workflow_dispatch:" in wf
    assert "\n  push:" not in wf
    assert "promote-release:" not in wf
    assert "RotorCalculator_Signed.apk" not in wf
    assert "key_aero_calc.keystore" not in wf
    assert "ci-build/RotorCalculator-ci.apk" in wf


def test_results_use_variable_specific_precision_and_normalize_negative_zero():
    main = text("RotorCalculator.b4a")
    assert "Private Sub FormatOutputValue(Value As Double, BaseDigits As Int) As String" in main
    assert "BaseDigits + ExtraPrecision" in main
    assert "If Abs(Value) < (0.5 / scale) Then Value = 0" in main
    assert "lblResults(10).Text = FormatOutputValue(ActiveRes.CY, 6)" in main
    assert "lblResults(14).Text = FormatOutputValue(ActiveRes.L_D_eff, 2)" in main
    assert "lblResults(21).Text = FormatOutputValue(ActiveRes.AdvancingTipMach, 3)" in main


def test_geometry_matrix_captures_true_bottom_controls():
    qa = text("tools/ci_ui_qa.sh")
    assert 'grep -qi "Prandtl-Glauert" "$OUT/03-geometry-popup-bottom.json"' in qa
    assert "for _ in 1 2 3 4 5; do" in qa


def test_responsive_matrix_proves_scrollable_content_reaches_true_bottom():
    qa = text("tools/ci_ui_qa.sh")
    assert 'grep -qi "eVTOL Conceptual Rotor" "$OUT/01b-rotor-list-bottom.json"' in qa
    assert 'grep -qi "Target CT" "$OUT/05-conditions-bottom.json"' in qa
    assert 'grep -Eqi "Sound Speed|Speed of Sound" "$OUT/08-results-bottom.json"' in qa


def test_live_resize_state_gate_scrolls_incrementally():
    qa = text("tools/ci_ui_qa.sh")
    assert "assert_text_scrolling_down" in qa
    assert '"Drees Linear" 873 393 "08b-inflow"' in qa
    assert '"Analytical Tangential" 873 393 "08c-profile"' in qa
    assert '"Collective to Thrust" 873 393 "08d-trim"' in qa


def test_engine_defensively_guards_mathematical_domains():
    src = text("zBETEngine.bas")
    assert "geom.RootCutout = Max(0.0, Min(0.95, geom.RootCutout))" in src
    assert "geom.NBlades = Max(1, Min(16, geom.NBlades))" in src
    assert "Public Sub SanitizeCondition" in src
    assert "If f_lo < 0.0 Then Return -1.0" in src
    assert "If f_hi > 0.0 Then Return -1.0" in src
    assert "SolutionValid As Boolean" in src
    assert "CompressibilityWarning As Boolean" in src
    assert "If lam_hover < 0 Then Return Array(trimmedGeom)" in src
    assert "For iter_tip = 1 To 8" in src
    assert "Dim deltaB As Double = Abs(nextB - b_val)" in src
    assert "If deltaB < 1e-8 Then Exit" in src


def test_ui_clamps_user_inputs_before_recalculation():
    main = text("RotorCalculator.b4a")
    assert "ActiveGeom.RootCutout = ClampD" in main
    assert "ActiveGeom.NBlades = Max(1, Min(16" in main
    assert "ConditionAltitudeM = ClampD" in main
    assert "ConditionTemperatureC = ClampD" in main
    assert "ConditionHorizontalValue = ClampD" in main
    assert "ActiveCond.Mu = ConditionHorizontalValue / vtip" in main
    assert "Sub edtGeom_FocusChanged" in main
    assert "Sub edtCond_FocusChanged" in main


def test_sweep_uses_one_canonical_axial_representation_per_curve():
    popup = text("RotorPopups.bas")
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert "activeAxialMode As String" in popup
    assert "activeAxialValue As Double" in popup
    assert "zBETEngine.ResolveMuZ(mu, curveAxialMode, curveAxialValue, plotVtip)" in popup
    assert "zBETEngine.ResolveMuZ(mu, AxialInputMode, ConditionAxialValue, vtip)" in main
    assert 'Case "alpha"' in engine
    assert 'Case "vz"' in engine
    assert 'Case "muz"' in engine
    assert "Return -mu * Tan(axialValue * cPI / 180.0)" in engine
    assert "Return axialValue / vtip" in engine


def test_geometry_crud_is_complete_and_row_regions_do_not_overlap():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert 'btnNewRotor.Text = "+ NEW ROTOR"' in main
    assert "Sub btnNewRotor_Click" in main
    assert "Public Sub CreateNewRotor As Int" in storage
    assert "edtRotorName" in main
    assert "row.AddView(lblName, 16dip, 6dip, listW - 128dip, 30dip)" in main
    assert "row.AddView(lblActive, listW - 112dip, 10dip, 64dip, 22dip)" in main
    assert "row.AddView(lblArrow, listW - 44dip, 10dip, 36dip, 48dip)" in main


def test_all_three_trim_modes_are_exposed():
    main = text("RotorCalculator.b4a")
    assert 'options.Add("Manual Pitch — no trim")' in main
    assert 'options.Add("Collective to Target — fixed RPM")' in main
    assert 'options.Add("RPM to Thrust — fixed pitch")' in main
    assert 'Case 0: ActiveCond.HoverTrimMode = "none"' in main
    assert 'Case 1: ActiveCond.HoverTrimMode = "collective"' in main
    assert 'Case 2: ActiveCond.HoverTrimMode = "rpm"' in main
    assert 'btnHoverTrimMode.Text = "RPM to Thrust"' in main
    assert "Private Sub DefaultRPMTargetThrust As Double" in main
    assert 'btnHoverTrimMode.Text = "Manual Pitch"' in main


def test_results_expose_validity_and_pg_domain_warning():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert 'lblResultStatus.Text = "MODEL STATUS · VALID"' in main
    assert "ActiveRes.SolutionValid = False" in main
    assert "ActiveRes.CompressibilityWarning" in main
    assert "res.AdvancingTipMach >= 0.80" in engine


def test_inflow_help_and_unit_converter_are_real_features():
    main = text("RotorCalculator.b4a")
    assert '"Quick Unit Converter"' in main
    assert "Private Sub OpenUnitConverter" in main
    assert '"kW → hp"' in main
    assert '"N → kgf"' in main
    assert '"km/h → kt"' in main
    assert '"m → ft"' in main
    assert '"mm → in"' in main
    assert 'Msgbox("Uniform: uniform induced velocity' in main


def test_signing_secrets_are_externalized():
    build = text("tools/b4a_build.ps1")
    ignore = text(".gitignore")
    agents = text("AGENTS.md")
    assert "$env:B4A_KEY_FILE" in build
    assert "$env:B4A_KEY_PASSWORD" in build
    assert "Key/*.keystore" in ignore
    assert "service_account" in ignore
    assert "Base64" in agents
    assert "não é criptografia" in agents


def test_visible_geometry_parameterization_is_authoritative_and_names_are_safe():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert 'ActiveGeom.SolidityMode = "chords"' in main
    assert 'g.SolidityMode = "chords"' in storage
    assert 'g.PitchMode = "linear_twist"' in storage
    assert 'newName = newName.Replace("|", "/").Replace(CR, " ").Replace(LF, " ")' in main
    assert 'shortName = shortName.SubString2(0, 21) & "…"' in main


def test_conditions_group_equivalent_horizontal_and_axial_inputs():
    main = text("RotorCalculator.b4a")
    assert 'Public HorizontalInputMode As String = "mu"' in main
    assert 'Public AxialInputMode As String = "alpha"' in main
    assert 'btnHorizontalInput.Text = "μ"' in main
    assert 'btnHorizontalInput.Text = "Vx"' in main
    assert 'btnAxialInput.Text = "α"' in main
    assert 'btnAxialInput.Text = "Vz"' in main
    assert 'btnAxialInput.Text = "μz"' in main
    assert 'options.Add("μ — advance ratio = Vx/(ΩR)")' in main
    assert 'options.Add("α — rotor angle of attack [+ stream from below]")' in main
    assert "ConditionShaftTiltDeg" not in main
    assert "ConditionClimbRateMs" not in main


def test_axial_helper_explains_zbet_zbemt_signs_on_mobile():
    main = text("RotorCalculator.b4a")
    assert '"Horizontal Flow Convention"' in main
    assert '"Axial Flow Convention"' in main
    assert '"+z and +Vz are downward through the rotor disk."' in main
    assert '"Rotor angle of attack α is positive when the stream arrives from below."' in main
    assert '"α is undefined at Vx = 0 for nonzero axial flow. Use Vz or μz."' in main


def test_sweep_can_compare_alpha_vz_and_muz_families():
    popup = text("RotorPopups.bas")
    assert 'curveAxialMode = "alpha"' in popup
    assert 'curveAxialMode = "vz"' in popup
    assert 'curveAxialMode = "muz"' in popup
    assert 'Array As String("-0.050", "-0.025", "0", "+0.025", "+0.050")' in popup


def test_settings_persist_theme_units_and_aerocalculator_precision():
    main = text("RotorCalculator.b4a")
    assert 'Public ThemeMode As Int = 0' in main
    assert 'Public ExtraPrecision As Int = 0' in main
    assert 'File.WriteMap(File.DirInternal, "ui_settings.txt", m)' in main
    assert 'btnSettingTheme.Text = "LIGHT"' in main
    assert 'btnSettingTheme.Text = "DARK"' in main
    assert 'btnSettingPrecision.Text = "+1 DECIMAL"' in main
    assert 'btnSettingPrecision.Text = "STANDARD"' in main
    assert 'Private Sub RebuildApplicationUI' in main


def test_physics_help_is_offline_theme_aware_and_packaged():
    main = text("RotorCalculator.b4a")
    html = text("Files/physics_help.html")
    assert "File23=physics_help.html" in main
    assert "File24=physics_help_light.html" in main
    assert "NumberOfFiles=24" in main
    assert "Private wvHelp As WebView" in main
    assert 'helpAsset = "physics_help_light.html"' in main
    assert 'wvHelp.LoadUrl("file:///android_asset/" & helpAsset)' in main
    assert "μz = − μ tan(α)" in html
    assert "α, Vz and μz are three equivalent ways" in html
    assert "No dynamic stall" in html


def test_sweep_axis_selector_and_legends_are_nonintrusive():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert "Private SweepXAxisMode As Int = 0" in main
    assert 'btnSweepXAxis.Text = "X: μ"' in main
    assert 'btnSweepXAxis.Text = "X: Vx"' in main
    assert 'xAxisTitle = "Forward Speed Vx (m/s)"' in popup
    assert "Dim mTop As Float = 60dip" in popup
    assert "Curve legends — reserved above plot rectangle" in popup
    assert "Dim legendY As Float = 39dip" in popup
    assert "If lightTheme Then" in popup
    assert 'cvs.DrawText(SweepPlotTitle(paramKey), mLeft, 16dip' in popup


def test_sweep_exports_exact_plot_family_to_csv_and_png_without_storage_permission():
    main = text("RotorCalculator.b4a")
    assert 'Wait For (SaveAs(input, "text/csv"' in main
    assert 'Wait For (SaveAs(input, "image/png"' in main
    assert 'intent.Initialize("android.intent.action.CREATE_DOCUMENT", "")' in main
    assert "Private Sub BuildSweepCsv As String" in main
    assert 'sb.Append("curve,x_axis,x_value,mu,Vx_m_s,axial_mode,axial_input,mu_z,inflow_model,parameter,value,status")' in main
    assert "Dim nPoints As Int = 25" in main
    assert 'bmp.WriteToStream(out, 100, "PNG")' in main
    assert 'Return NumberFormat2(value, 1, digits, digits, False).Replace(",", ".")' in main
    assert "Library4=javaobject" in main


def test_sweep_table_precision_tracks_variable_and_global_precision_setting():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert "Public Sub SweepParamDigits(paramKey As String) As Int" in popup
    assert "RotorPopups.SweepParamDigits(SweepParamSelectedKey) + ExtraPrecision" in main


def test_selected_horizontal_representation_stays_authoritative_after_geometry_changes():
    main = text("RotorCalculator.b4a")
    assert "Public ConditionHorizontalValue As Double = 0.0" in main
    assert 'If HorizontalInputMode = "vx" Then' in main
    assert "ConditionHorizontalValue = ClampD(ConditionHorizontalValue, 0.0, 0.60 * vtip)" in main
    assert "ActiveCond.Mu = ConditionHorizontalValue / vtip" in main
    assert "ConditionHorizontalValue = ActiveCond.Mu * vtip" in main


def test_selected_axial_representation_stays_inside_engine_domain():
    main = text("RotorCalculator.b4a")
    assert 'If AxialInputMode = "vz" Then' in main
    assert "ConditionAxialValue = ClampD(ConditionAxialValue, -0.50 * vtip, 0.50 * vtip)" in main
    assert 'Else If AxialInputMode = "muz" Then' in main
    assert "ActiveCond.MuZ = ClampD(zBETEngine.ResolveMuZ" in main


def test_result_helpers_match_actual_power_based_metrics():
    main = text("RotorCalculator.b4a")
    assert "Power-based effective rotor L/D: (L/D)eff = μ·CT / CPair = T·Vx / Pair" in main
    assert "imposed axial-flow work" in main
    assert "derived from resultant aerodynamic forces" not in main


def test_export_handles_cancel_and_provider_failure_without_crashing():
    main = text("RotorCalculator.b4a")
    assert "If Args.Length > 1 And -1 = Args(0) Then" in main
    assert 'Log("Export failed: " & LastException.Message)' in main
    assert 'ToastMessageShow("CSV export canceled or failed."' in main
    assert 'ToastMessageShow("PNG export canceled or failed."' in main


def test_b4a_pg_and_fom_match_python_reference_definitions():
    engine = text("zBETEngine.bas")
    assert "Sqrt(0.75 * 0.75 + 0.5 * mu * mu)" in engine
    assert "If mEff > 0.85 Then mEff = 0.85" in engine
    assert "Sqrt(Max(0.01, 1.0 - mEff * mEff))" in engine
    assert "Dim cpFoM As Double = c.KInd * idealHoverPower + res.CQ0" in engine
    assert "res.FoM = idealHoverPower / cpFoM" in engine


def test_sissingh_is_iterated_in_performance_and_rpm_trim():
    engine = text("zBETEngine.bas")
    reference = text("tools/zBET.py")
    assert "For iter_tip = 1 To 8" in engine
    assert "For iter_trim_tip = 1 To 8" in engine
    assert 'geometry.tip_loss_mode == "sissingh"' in reference
    assert "def solve_at_b(b_current):" in reference
    assert "b_override=b_val" in reference
    assert '"B_tip_loss": b_val' in reference


def test_release_source_version_and_no_stale_tracked_binaries():
    main = text("RotorCalculator.b4a")
    assert "#VersionCode: 3" in main
    assert "#VersionName: 1.20" in main
    assert not (ROOT / "Objects" / "RotorCalculator.apk").exists()
    assert not (ROOT / "RotorCalculator_Signed.apk").exists()
    assert not (ROOT / "RotorCalculator_Signed.aab").exists()
