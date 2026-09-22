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


def test_release_promotion_uses_same_run_artifact():
    wf = text(".github/workflows/frontend-source-qa.yml")
    assert "promote-release:" in wf
    assert "needs: [build-b4a, ui-qa]" in wf
    assert "RotorCalculator-b4a-build" in wf
    assert "verified-build/RotorCalculator_Signed.apk" in wf
    assert "createOrUpdateFileContents" in wf
    assert "contents: write" in wf
    assert "'RotorCalculator_Signed.apk'" in wf


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
    assert '"Collective to CT" 873 393 "08d-trim"' in qa
