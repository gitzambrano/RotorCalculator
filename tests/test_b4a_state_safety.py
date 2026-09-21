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


def test_duplicate_does_not_alias_active_geometry():
    main = text("RotorCalculator.b4a")
    assert "Dim copyG As RotorGeometry = zBETEngine.CloneGeometry(ActiveGeom)" in main
    assert "Dim copyG As RotorGeometry = ActiveGeom" not in main


def test_selected_spinner_text_is_explicitly_legible():
    main = text("RotorCalculator.b4a")
    assert "spnRotorSelect.TextColor = ColorTitleText" in main
    assert "spnSweepParam.TextColor = ColorTitleText" in main


def test_qa_checks_sweep_state_purity():
    qa = text("tools/ci_ui_qa.sh")
    assert 'grep -qi "Operating μ=0.00"' in qa
    assert "10b-geometry-after-rotation" in qa
