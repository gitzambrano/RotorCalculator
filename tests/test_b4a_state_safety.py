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
    assert 'grep -qi "Operating μ = 0.00"' in qa
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


def test_sweep_footer_is_unambiguous_and_fixed_precision():
    main = text("RotorCalculator.b4a")
    assert 'lblSweepCurrentVal.Text = "Operating μ = "' in main
    assert "NumberFormat2(ActiveCond.Mu, 1, 2, 2, False)" in main
    assert '"Operating μ="' not in main


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


def test_results_normalize_display_only_negative_zero():
    main = text("RotorCalculator.b4a")
    assert "Private Sub FormatResultValue(Value As Double, FractionDigits As Int) As String" in main
    assert "If Abs(Value) < (0.5 / scale) Then Value = 0" in main
    assert "lblResults(10).Text = FormatResultValue(ActiveRes.CY, 6)" in main
    assert "lblResults(12).Text = FormatResultValue(ActiveRes.CMx, 6)" in main
    assert "lblResults(18).Text = FormatResultValue(ActiveRes.InflowKy, 3)" in main


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
    assert "If Abs(nextB - b_val) < 1e-8 Then" in src


def test_ui_clamps_user_inputs_before_recalculation():
    main = text("RotorCalculator.b4a")
    assert "ActiveGeom.RootCutout = ClampD" in main
    assert "ActiveGeom.NBlades = Max(1, Min(16" in main
    assert "ConditionAltitudeM = ClampD" in main
    assert "ConditionTemperatureC = ClampD" in main
    assert "ActiveCond.Mu = ClampD" in main
    assert "Sub edtGeom_FocusChanged" in main
    assert "Sub edtCond_FocusChanged" in main


def test_sweep_recomputes_axial_flow_for_every_mu():
    popup = text("RotorPopups.bas")
    main = text("RotorCalculator.b4a")
    assert "activeAlphaDeg As Double" in popup
    assert "activeVzRate As Double" in popup
    assert "tempCond.MuZ = -mu * Tan(alphaDeg * cPI / 180.0) + (vzRate / vtip)" in popup
    assert "tempCond.MuZ = -mu * Tan(ConditionShaftTiltDeg * cPI / 180.0) + (ConditionClimbRateMs / vtip)" in main


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
    assert 'Case "collective"' in main
    assert 'Case "rpm"' in main
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
    assert "Base64 is encoding, not encryption" in agents


def test_visible_geometry_parameterization_is_authoritative_and_names_are_safe():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert 'ActiveGeom.SolidityMode = "chords"' in main
    assert 'g.SolidityMode = "chords"' in storage
    assert 'g.PitchMode = "linear_twist"' in storage
    assert 'newName = newName.Replace("|", "/").Replace(CR, " ").Replace(LF, " ")' in main
    assert 'shortName = shortName.SubString2(0, 21) & "…"' in main
