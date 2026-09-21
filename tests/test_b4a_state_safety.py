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
    assert 'grep -qi "Operating μ=0.00"' in qa
    assert "09-geometry-after-rotation" in qa
    assert "02-geometry-popup-top.png" in qa
    assert "safe_screencap" in qa
