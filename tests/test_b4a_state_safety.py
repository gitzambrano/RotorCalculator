from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_geometry_is_direct_editor_with_active_rotor_selector():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    start = main.index("Private Sub BuildPageGeom")
    build_geom = main[start:main.index("End Sub", start)]
    assert "BuildGeometryEditorContent" in build_geom
    assert 'btnActiveRotor.Initialize("btnActiveRotor")' in main
    assert '"ROTOR LIBRARY"' not in main
    assert 'items.Add(Chr(65291) & " New Rotor|Create a custom rotor")' in main
    for section in ('"PLANFORM"', '"SOLIDITY & AREAS"', '"BLADE PITCH"', '"AERODYNAMICS"'):
        assert section in main
    assert 'MakeActionButton("SAVE", "btnGeometrySave"' in main
    assert 'MakeActionButton("COPY", "btnGeometryCopy"' in main
    assert 'MakeActionButton("DELETE", "btnGeometryDelete"' in main
    assert "Public Sub MakeCopyName(SourceName As String) As String" in storage
    assert "RotorStorage.AddRotor(copyGeom)" in main
    assert "RotorStorage.DeleteRotor(RotorStorage.ActiveIndex)" in main
    assert '"Unsaved Geometry"' in main


def test_geometry_exposes_all_authoritative_inputs():
    main = text("RotorCalculator.b4a")
    names = text("RotorNames.bas")
    start = main.index("Private Sub BuildGeometryEditorContent")
    editor = main[start:main.index("End Sub", start)]
    for key in ("rpmNom", "R", "Nb", "x0", "c0", "c1", "taper", "AR", "sigmaRef",
                "sigmaAct", "sigmaT", "A", "Ab", "Aact", "thRoot", "thTip", "thTwist",
                "airfoil", "a0", "Cd0", "tipModel", "B", "comp"):
        assert f'"{key}"' in editor
        assert f'Add("{key}"' in names
    # The Name row is gone: the active-rotor bar shows the name and the rotor sheet renames it.
    assert 'Add("name"' in names and '"name"' not in editor
    for full in ("Rotor Radius", "Blade Count", "Root Cutout", "Root Chord", "Tip Chord",
                 "Geometric Solidity", "Aspect Ratio", "Root Pitch", "Tip Pitch"):
        assert f'"{full}"' in names


def test_geometry_reference_planform_equations_match_zbemt():
    engine = text("zBETEngine.bas")
    assert "ChordRoot is the reference-axis chord c0 at x=0" in engine
    assert "nb * geom.ChordRoot / (cPI * rad)" in engine
    assert "nb * (geom.ChordTip - geom.ChordRoot) / (cPI * rad)" in engine
    assert "geom.SigmaRef = s0 + 0.5 * s1" in engine
    assert "geom.SigmaGeom = s0 * (1.0 - x0) + 0.5 * s1 * (1.0 - x0 * x0)" in engine
    assert "Public Sub ReferenceAspectRatio" in engine
    assert "Return geom.Radius * geom.Radius / area" in engine


def test_radius_change_preserves_reference_planform_shape_and_solidity():
    engine = text("zBETEngine.bas")
    assert "Public Sub ScaleRadiusPreserveReference" in engine
    assert "Dim scale As Double = newRadius / oldRadius" in engine
    assert "g.ChordRoot = g.ChordRoot * scale" in engine
    assert "g.ChordTip = g.ChordTip * scale" in engine
    assert "ScaleRadiusPreserveReference(" in engine[engine.index("Public Sub SetGeometryQuantity"):]


def test_sigma_and_aspect_ratio_edits_scale_both_chords():
    engine = text("zBETEngine.bas")
    main = text("RotorCalculator.b4a")
    assert "Public Sub ScaleChordsToSigmaRef" in engine
    assert "Public Sub ScaleChordsToAspectRatio" in engine
    assert "g.ChordRoot = g.ChordRoot * scale" in engine
    assert "g.ChordTip = g.ChordTip * scale" in engine
    setter = engine[engine.index("Public Sub SetGeometryQuantity"):]
    assert 'Case "sigmaRef", "sigmaAct", "sigmaT", "AR", "Ab", "Aact"' in setter
    assert "scale = cur / value" in setter  # AR edit scales both chords inversely
    assert "scale = value / cur" in setter  # solidity and area edits scale both chords
    assert "zBETEngine.SetGeometryQuantity(ActiveGeom, key, si)" in main


def test_geometry_derived_metrics_are_visible():
    names = text("RotorNames.bas")
    engine = text("zBETEngine.bas")
    for full in ("Geometric Solidity", "Actual Solidity", "Thrust-Weighted Solidity", "Taper Ratio",
                 "Disk Area", "Geometric Blade Area", "Actual Blade Area", "Total Blade Twist"):
        assert f'"{full}"' in names
    for sub in ("ReferenceBladeArea", "ActiveBladeArea", "TaperRatio"):
        assert f"Public Sub {sub}" in engine


def test_rotor_aerodynamics_share_geometry_panel_language():
    main = text("RotorCalculator.b4a")
    names = text("RotorNames.bas")
    assert '"AERODYNAMICS"' in main
    for key in ("airfoil", "a0", "Cd0", "tipModel", "B", "comp"):
        assert f'"{key}"' in main
    for full in ("Airfoil Section", "Lift-Curve Slope", "Profile Drag Coefficient", "Tip-Loss Model",
                 "Tip-Loss Factor", "Compressibility Correction"):
        assert f'"{full}"' in names
    for tip in ("tip_none", "tip_fixed", "tip_sissingh"):
        assert f'Add("{tip}"' in names


def test_geometry_edits_are_explicitly_saved_and_contextual_actions_are_local():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert "GeometryDirty = Not(GeomEqual(ActiveGeom, saved))" in main
    assert "Sub SaveCurrentRotor" in main
    assert "RotorStorage.UpdateRotor(RotorStorage.ActiveIndex, ActiveGeom)" in main
    assert "Sub btnGeometrySave_Click" in main
    assert "Sub btnGeometryCopy_Click" in main
    assert "Sub btnGeometryDelete_Click" in main
    assert "RotorStorage.AddRotor(copyGeom)" in main
    assert "RotorStorage.DeleteRotor(RotorStorage.ActiveIndex)" in main
    assert "Public Sub DuplicateRotor" in storage
    assert "Public Sub DeleteRotor" in storage
    assert '"Unsaved Geometry"' in main


def test_geometry_storage_is_versioned_and_migrates_legacy_chord_definition():
    storage = text("RotorStorage.bas")
    assert 'SCHEMA_TAG As String = "ROTORCALCULATOR_GEOMETRIES"' in storage
    assert "SCHEMA_VERSION As Int = 3" in storage
    assert "Private Sub ParseLegacyRotor" in storage
    assert "g.ChordRoot = oldRoot - (tip - oldRoot) * g.RootCutout / (1.0 - g.RootCutout)" in storage
    assert "Public Sub ExportDatabaseText" in storage
    assert "Public Sub ParseDatabaseText" in storage


def test_conditions_present_atmosphere_and_equivalent_flow_inputs():
    main = text("RotorCalculator.b4a")
    names = text("RotorNames.bas")
    assert '"ATMOSPHERE & FLOW"' in main
    start = main.index("Private Sub BuildPageCond")
    cond = main[start:main.index("End Sub", start)]
    for key in ("h", "T0", "mu", "Vx", "alpha", "Vz", "muz"):
        assert f'"{key}"' in cond
        assert f'Add("{key}"' in names
    # one variable button per flow row (mu/Vx and alpha/Vz/muz alternatives, never summed)
    assert 'BuildRow(scvCond, y, "hflow", HKey' in cond
    assert 'BuildRow(scvCond, y, "aflow", AKey' in cond
    assert 'btnHorizontalInput = RowLbl.Get("hflow")' in cond
    assert 'btnAxialInput = RowLbl.Get("aflow")' in cond
    assert "lblHorizontalDerived" not in main
    assert "lblAxialDerived" not in main
    for full in ("Pressure Altitude", "Ambient Temperature", "Advance Ratio", "Forward Airspeed",
                 "Disk Angle of Attack", "Climb Speed", "Axial Flow Ratio"):
        assert f'"{full}"' in names


def test_geometry_and_conditions_use_aerocalculator_row_contract():
    main = text("RotorCalculator.b4a")
    assert "Private Sub BuildRow(" in main
    assert "Private Sub CreateRowLabel(rowId As String, key As String, level As Int) As Button" in main
    assert "Private Sub CreateUnitButton(rowId As String, key As String) As Button" in main
    assert "Sub rowLbl_Click" in main
    assert "Sub unitRow_Click" in main
    assert "Dim u As Button = Sender" in main
    assert "Dim b As Button = Sender" in main
    assert "Private Sub UnitChoices" in main
    # label button | value | unit button on one shared three-column geometry
    assert "Private Sub ComputeColumns" in main
    assert "ColUnitW = Max(56dip, inner * 19 / 100)" in main
    assert "ColLblW = inner - ColValW - ColUnitW" in main
    assert "ColValW = inner * 32 / 100" in main
    assert "pnl.AddView(lbl, ColLblX, cy, ColLblW, ch)" in main
    assert "pnl.AddView(v, ColValX, cy, ColValW, ch)" in main
    assert "pnl.AddView(u, ColUnitX, cy, ColUnitW, ch)" in main
    # nomenclature: one level per page chosen from RotorNames
    assert "RotorNames.ChooseLevel(GeomKeys" in main
    assert "RotorNames.ChooseLevel(CondKeys" in main
    assert "RotorNames.RichLabel(key, level)" in main


def test_visual_audit_fixes_tablet_landscape_and_scaled_text():
    main = text("RotorCalculator.b4a")
    assert "UiContentW = scvGeom.Width" not in main
    assert "Private Sub GridRowH As Int" in main
    assert "Private Sub TextSp As Float" in main
    assert "Return 16 * sc" in main
    # scrolling instead of shrinking: row height is fixed and large enough for two text lines
    assert "Return 58dip" in main
    # derived rows are visibly read-only (flat label, not an EditText)
    assert "Private Sub CreateReadOnlyValue" in main
    assert "l.TextColor = ColorButText2" in main
    # themed sheets replace system dialogs
    assert "Msgbox" not in main
    assert "InputList" not in main
    assert "As Spinner" not in main


def test_axial_sign_convention_matches_requirements():
    engine = text("zBETEngine.bas")
    names = text("RotorNames.bas")
    assert "Return -mu * Tan(axialValue * cPI / 180.0)" in engine
    assert "Return axialValue / vtip" in engine
    vz = names[names.index('Add("Vz"'):names.index('Add("muz"')]
    assert "downward" in vz.lower()
    alpha = names[names.index('Add("alpha"'):names.index('Add("Vz"')]
    assert "below" in alpha.lower()


def test_conditions_expose_all_six_operating_pairs():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    pairs = (
        ("rpm_collective", "RPM + Δθ"),
        ("rpm_ct", "RPM + C_T"),
        ("rpm_thrust", "RPM + T"),
        ("collective_ct", "Δθ + C_T"),
        ("collective_thrust", "Δθ + T"),
        ("ct_thrust", "C_T + T"),
    )
    for key, label in pairs:
        assert f'"{key}"' in engine
        assert f'Case "{key}"' in main
        assert f'"{label}"' in main


def test_only_two_operating_inputs_are_presented_for_selected_pair():
    main = text("RotorCalculator.b4a")
    assert "Private lblOperatingInput1 As Button" in main
    assert "Private lblOperatingInput2 As Button" in main
    assert "Private edtOperatingInput1 As EditText" in main
    assert "Private edtOperatingInput2 As EditText" in main
    assert "Private Sub PairKey(pair As String, position As Int) As String" in main
    assert 'SetRowKey("op1", k1, CondLevel)' in main
    assert 'SetRowKey("op2", k2, CondLevel)' in main
    assert "Sub edtOperatingInput_TextChanged" in main


def test_collective_is_uniform_delta_pitch():
    engine = text("zBETEngine.bas")
    assert "Dim dtheta As Double = collectiveDeg * cPI / 180.0" in engine
    assert "g.ThetaRoot = baseGeom.ThetaRoot + dtheta" in engine
    assert "g.ThetaTip = baseGeom.ThetaTip + dtheta" in engine
    assert "g.Theta0 = 0.5 * (g.ThetaRoot + g.ThetaTip)" in engine


def test_trim_is_at_current_flight_condition_and_candidate_rpm_recomputes_mu():
    engine = text("zBETEngine.bas")
    assert "Public Sub ResolveConditionAtRPM" in engine
    assert 'If c.HorizontalMode = "vx" Then' in engine
    assert "c.Mu = Max(-0.60, Min(0.60, c.HorizontalValue / vtip))" in engine
    assert "ResolveMuZ(c.Mu, c.AxialMode, c.AxialValue, vtip)" in engine
    assert "Private Sub CandidateResult" in engine
    assert "Private Sub SolveCollective" in engine
    assert "Private Sub SolveRPM" in engine


def test_numerical_vectorial_profile_drag_is_authoritative():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert 'btnDrag.Text = RotorNames.ShortName("drag_numerical")' in main
    assert "btnProfileDragModel" not in main
    assert 'c.ProfileDragModel = "numerical_vectorial"' in engine
    assert 'ProfileDrag(c.Mu, c.MuZ, g, "numerical_vectorial")' in engine


def test_kind_is_condition_input():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    names = text("RotorNames.bas")
    assert 'BuildRow(scvCond, y, "kind", "kind", "num", lv, "edtKInd")' in main
    assert 'Add("kind", "Induced Power Factor"' in names
    assert '"Induced Factor Kind"' not in main
    assert "Sub edtKInd_TextChanged" in main
    assert "ActiveCond.KInd = ClampD" in main
    assert "c.KInd = Max(1.0, Min(3.0, c.KInd))" in engine


RESULT_KEYS = (
    "T", "H", "Hi", "H0", "Y", "Q", "Qi", "Q0", "Mx", "My", "P", "Pi", "P0", "Pair",
    "DL", "PL", "vi", "CTs", "FM", "LDe",
    "CT", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair", "CLbar", "Tc", "Pc",
    "lam", "lami", "lamh", "muLam", "Kx", "Ky", "chi", "Bres",
    "Vztot", "Vadv", "Vret", "Mret", "aoaAdv75", "aoaRet75", "phiAdv75", "phiRet75",
    "rpm", "coll", "mu", "Vx", "muz", "Vz", "alpha", "OmR", "Mtip", "Madv",
    "h", "T0", "rho", "p", "a",
)


def result_keys_in_source(main):
    start = main.index("ResKeys.AddAll(Array As String(")
    block = main[start:main.index("))", start)]
    return re.findall(r'"([^"]+)"', block)


def test_results_group_all_coefficients_together():
    main = text("RotorCalculator.b4a")
    assert '"AERODYNAMIC COEFFICIENTS"' in main
    keys = result_keys_in_source(main)
    assert keys == list(RESULT_KEYS)
    coeff = keys[keys.index("CT"):keys.index("CPair") + 1]
    assert coeff == ["CT", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair"]
    for source in ("r.CT", "r.CQ", "r.CQi", "r.CQ0", "r.CH", "r.CHi", "r.CH0", "r.CY", "r.CMx", "r.CMy", "r.CPair"):
        assert source in main


def test_results_include_operating_solution_and_atmosphere():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert '"STATE & ATMOSPHERE"' in main
    for source in ("r.TrimmedRPM", "r.TrimmedCollectiveDeg", "r.OperatingMu", "r.OperatingVx",
                   "r.OperatingMuZ", "r.OperatingVz", "r.OperatingAlphaDeg", "r.DensityRho",
                   "r.PressurePa", "r.SpeedOfSound"):
        assert source in main
    keys = result_keys_in_source(main)
    # operating state shows rotor speed and collective pitch, never twist, and no duplicate trimmed rows
    assert "rpm" in keys and "coll" in keys
    assert "thTwist" not in keys
    assert len(keys) == len(set(keys))
    assert "res.TrimmedCollectiveDeg = c.CollectiveDeg" in engine


def test_sweep_uses_canonical_single_source_nomenclature_and_readable_plot_text():
    popups = text("RotorPopups.bas")
    assert "Private Sub SweepParamDisplayName" in popups
    assert "Return SweepParamFullName(paramKey) & " in popups
    assert 'AddSweepParam("RPM", SweepParamDisplayName("RPM"))' in popups
    assert 'Case "CP": Return "CQ"' in popups
    assert "RotorNames.FullName(nk)" in popups and "Coeff" not in popups
    assert '"CQ / CPshaft — Shaft Power"' not in popups
    assert "Typeface.MONOSPACE" in popups
    assert "Public Sub SweepReadout" in popups
    assert "Public Sub BuildSweepTableRows" in popups
    assert "Public LastPlotLeft As Float" in popups


def test_results_precision_is_variable_specific_plus_one():
    main = text("RotorCalculator.b4a")
    assert "Private Sub FormatSig(Value As Double, sig As Int) As String" in main
    assert "Dim sg As Int = 4 + ExtraPrecision" in main
    assert "If rounded = 0 Then Return " in main
    assert "Chr(0x200A)" in main or "Chr(0x202F)" in main or "Chr(160)" in main  # subtle thousands separator for |x| >= 1000
    assert "FormatOutputValue" not in main
    assert "FormatResultValue" not in main
    assert 'btnSettingPrecision.Text = "+1 DECIMAL"' in main


def test_settings_include_geometry_import_export():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert '"Import Geometries"' in main
    assert '"Export Geometries"' in main
    assert "Sub btnSettingImportGeometries_Click" in main
    assert "Sub btnSettingExportGeometries_Click" in main
    assert 'intent.Initialize("android.intent.action.OPEN_DOCUMENT", "")' in main
    assert 'intent.Initialize("android.intent.action.CREATE_DOCUMENT", "")' in main
    assert "RotorStorage.ExportDatabaseText" in main
    assert "RotorStorage.ParseDatabase" in main
    assert "RotorStorage.MergeImportedRotors" in main
    assert "Public Sub MergeImportedRotors" in storage


def test_import_conflicts_are_explicit():
    main = text("RotorCalculator.b4a")
    assert "Rename imported duplicates" in main
    assert "Replace same-name local geometries" in main
    assert "Skip same-name imported geometries" in main


def test_plot_catalog_contains_results_and_operating_scalars():
    popup = text("RotorPopups.bas")
    for key in (
        "CT", "CP", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy",
        "CPair", "lambda", "lambda_i", "L_D_eff", "FoM", "Kx", "Ky", "chi",
        "Mat", "PowerKW", "ThrustN", "TorqueNm", "DragHN", "B", "TipSpeed",
        "RPM", "Collective", "Mu", "Vx", "MuZ", "Vz", "Alpha", "Altitude",
        "Temperature", "Density", "Pressure", "SoundSpeed",
    ):
        assert f'AddSweepParam("{key}"' in popup


def test_plot_supports_custom_family_values():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert "Sub btnSweepValues_Click" in main
    assert "Edit Family Values" in main
    assert "Private Sub ParseSweepFamilyValues" in main
    assert "Enter 1–9 comma-separated values" in main
    assert "SweepAlphaValues" in main
    assert "SweepVzValues" in main
    assert "SweepMuZValues" in main
    assert "Public Sub SweepCurveCount" in popup


def test_plot_supports_hover_only_trim_and_per_point_trim():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    # trim is one themed dropdown with the five canonical modes; the old hover toggle is gone
    assert "btnSweepTrimHover" not in main
    assert "Sub btnSweepTrim_Click" in main
    assert "RotorPopups.SweepTrimModeKeys" in main
    assert "RotorPopups.SweepTrimModeLabel(k)" in main
    assert 'sheet.ShowChoice(RotorNames.PlainLabel("sweepTrim", 0)' in main
    assert "SweepTrimMode = keys.Get(idx)" in main
    assert 'm.Put("swtrim"' in main
    assert 'Return Array("none", "coll_all", "rpm_all", "coll_hover", "rpm_hover")' in popup
    assert 'trimMode = "coll_hover" Or trimMode = "rpm_hover"' in popup
    assert 'tempCond.OperatingPair = "rpm_collective"' in popup


def test_plot_table_csv_and_canvas_share_one_cached_dataset():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert "SweepSamplesCache = RotorPopups.BuildSweepSamples" in main
    assert "DrawSweepPlot" in main and "SweepSamplesCache" in main
    assert "RotorPopups.BuildSweepTableRows(SweepSamplesCache, SweepParamSelectedKey, SweepXAxisMode, ExtraPrecision, False)" in main
    assert "RotorPopups.BuildSweepTableRows(SweepSamplesCache, SweepParamSelectedKey, SweepXAxisMode, ExtraPrecision, True)" in main
    assert "position:sticky;top:0" in main and "position:sticky;left:0" in main
    assert "Private Sub BuildSweepCsv As String" in main
    assert "Public Sub BuildSweepSamples" in popup
    assert "Type SweepPoint" in popup


def test_plot_invalid_samples_are_not_drawn_as_zero():
    popup = text("RotorPopups.bas")
    assert "point.Valid = result.SolutionValid" in popup
    assert "XOk(p1, xAxisMode) And XOk(p2, xAxisMode)" in popup
    assert "CurveOrder(samples, curveIndex, xAxisMode)" in popup
    assert "No valid operating points in this sweep." in popup


def test_plot_uses_actual_solved_vx_for_vx_axis():
    popup = text("RotorPopups.bas")
    assert "point.Vx = result.OperatingVx" in popup
    assert "Private Sub PointX(p As SweepPoint, xAxisMode As Int) As Double" in popup
    assert "If xAxisMode = 1 Then Return p.Vx" in popup


def test_plot_exports_csv_png_with_saf():
    main = text("RotorCalculator.b4a")
    assert 'Wait For (SaveAs(input, "text/csv"' in main
    assert 'Wait For (SaveAs(input, "image/png"' in main
    assert 'bmp.WriteToStream(out, 100, "PNG")' in main
    assert "android.intent.action.CREATE_DOCUMENT" in main
    assert "RemovePermission (android.permission.WRITE_EXTERNAL_STORAGE)" in main
    assert "AddPermission(android.permission.READ_EXTERNAL_STORAGE" not in main


def test_themes_help_and_precision_remain_persistent():
    main = text("RotorCalculator.b4a")
    assert 'File.WriteMap(File.DirInternal, "ui_settings.txt", m)' in main
    assert 'Case 1: Return "LIGHT"' in main
    assert 'Case 2: Return "MIDNIGHT BLUE"' in main
    assert 'Return "DARK"' in main
    assert "File23=physics_help.html" in main
    assert "File24=physics_help_light.html" in main
    assert "File27=physics_help_midnight.html" in main
    assert "RotorPopups.SetPlotThemeIndex(ThemeMode)" in main


def test_engine_domain_guards_and_named_failure_status_remain():
    engine = text("zBETEngine.bas")
    assert "geom.RootCutout = Max(0.0, Min(0.95, geom.RootCutout))" in engine
    assert "geom.NBlades = Max(1, Min(16, geom.NBlades))" in engine
    assert "If f_lo < 0.0 Then Return -1.0" in engine
    assert "If f_hi > 0.0 Then Return -1.0" in engine
    assert '"INVALID: selected operating constraints could not be trimmed"' in engine
    assert "SolutionValid As Boolean" in engine


def test_pg_fom_and_sissingh_reference_contracts_remain():
    engine = text("zBETEngine.bas")
    assert "Sqrt(0.75 * 0.75 + 0.5 * mu * mu)" in engine
    assert "If mEff > 0.85 Then mEff = 0.85" in engine
    assert "Dim cpFoM As Double = c.KInd * idealHoverPower + res.CQ0" in engine
    assert "For iter_tip = 1 To 8" in engine


def test_reference_python_has_six_pair_solver_and_numerical_profile_drag():
    ref = text("tools/zBET.py")
    assert "def solve_operating_pair(" in ref
    for pair in (
        "rpm_collective", "rpm_ct", "rpm_thrust",
        "collective_ct", "collective_thrust", "ct_thrust",
    ):
        assert f'pair == "{pair}"' in ref
    assert 'profile_drag_model="numerical_vectorial"' in ref


def test_release_source_version_and_binary_hygiene():
    main = text("RotorCalculator.b4a")
    ignore = text(".gitignore")
    assert "#VersionCode: 8" in main
    assert "#VersionName: 1.25" in main
    # A local QA build must be allowed; release hygiene concerns tracked binaries.
    import subprocess
    tracked = subprocess.run(
        ["git", "ls-files", "--error-unmatch", "Objects/RotorCalculator.apk"],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert tracked.returncode != 0
    assert not (ROOT / "RotorCalculator_Signed.apk").exists()
    assert not (ROOT / "RotorCalculator_Signed.aab").exists()
    tracked_dex = subprocess.run(
        ["git", "ls-files", "--error-unmatch", "Objects/classes.dex"],
        cwd=ROOT, capture_output=True, text=True,
    )
    assert tracked_dex.returncode != 0
    assert "Objects/" in ignore.splitlines()


def test_github_qa_is_manual_by_default_and_release_signing_is_externalized():
    wf = text(".github/workflows/frontend-source-qa.yml")
    build = text("tools/b4a_build.ps1")
    assert "workflow_dispatch:" in wf
    # Temporary qa/* validation branches may add a push trigger to execute the
    # exact candidate source. Production branches must never be auto-triggered here.
    if "\n  push:" in wf:
        assert "qa/" in wf
        assert "- main" not in wf
        assert "- master" not in wf
    assert "promote-release:" not in wf
    assert "$env:B4A_KEY_FILE" in build
    assert "$env:B4A_KEY_PASSWORD" in build


def test_runtime_qa_matches_responsive_labels_and_dimensions():
    # The adb-driven runtime QA script keeps its generic helpers; label-specific expectations
    # now come from docs/nomenclature.md (RotorNames), so only the structure is locked here.
    qa = text("tools/ci_ui_qa.sh")
    assert "tap_text_scrolling() {" in qa
    assert "scroll_to_top() {" in qa
    assert 'APK="${1:-${APK:-ci-apk/RotorCalculator-ci.apk}}"' in qa
    assert "cat > /tmp/ui_node.py <<'PY'" in qa
    assert "cat > /tmp/tap_text.py <<'PY'" in qa
    assert "cat > /tmp/check_bounds.py <<'PY'" in qa
    assert qa.count('assert_document_picker "$OUT"') >= 4
    popup = text("RotorPopups.bas")
    sweep_keys = re.findall(r'AddSweepParam\("([^"]+)", SweepParamDisplayName\("([^"]+)"\)\)', popup)
    assert len(sweep_keys) == 52
    assert all(key == display_key for key, display_key in sweep_keys)
    assert len({key for key, _ in sweep_keys}) == 52


def test_requirements_are_authoritative_for_new_architecture():
    req = text("docs/software_requirements.md")
    assert "**RPM + Collective**" in req
    assert "**CT + Thrust**" in req
    assert "**Import Geometries**" in req
    assert "**Trim only in hover**" in req
    assert "six operating pairs" in req.lower()
    assert "universal plots" in req.lower()
    assert "direct in-page rotor editor" in req.lower()
    assert "active rotor" in req.lower()
    assert "label / value / unit" in req.lower()

def test_activity_recreation_preserves_unsaved_geometry_and_sweep_state():
    main = text("RotorCalculator.b4a")
    assert "Public GeometryDirty As Boolean = False" in main
    assert "ActiveGeom = RotorStorage.GetActiveRotor" in main
    assert "Else If CurrentPage = 0 And GeometryDirty Then" in main
    assert "RotorStorage.SaveDraft(ActiveGeom, RotorStorage.ActiveIndex)" in main
    assert "Public SweepMultiMode As Int = 0" in main
    assert 'Public SweepParamSelectedKey As String = "CP"' in main
    assert 'Public SweepTrimMode As String = "coll_all"' in main
    assert "Private GeometryDirty As Boolean" not in main
    assert "Private SweepMultiMode As Int" not in main


def test_factory_restore_preserves_user_rotors_and_active_selector():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert "Public Sub RestoreFactoryPresets" in storage
    assert "Rotors.Set(existing, zBETEngine.CloneGeometry(factoryGeom))" in storage
    assert "Rotors.Add(zBETEngine.CloneGeometry(factoryGeom))" in storage
    assert "RotorStorage.RestoreFactoryPresets" in main
    assert "RefreshActiveRotorBar" in main
    assert "custom rotors preserved" in main.lower()


def test_import_validates_domains_before_resolving_geometry():
    storage = text("RotorStorage.bas")
    assert "Private Sub IsImportedGeometryValid" in storage
    assert "If IsImportedGeometryValid(importedGeom) Then" in storage
    assert "imported.Add(zBETEngine.ResolveSolidity(importedGeom))" in storage
    parse_v2 = storage.index("Private Sub ParseV2Rotor")
    parse_db = storage.index("Public Sub ParseDatabaseText")
    assert "Return g" in storage[parse_v2:parse_db]


def test_results_show_four_operating_solution_variables_as_rows():
    main = text("RotorCalculator.b4a")
    names = text("RotorNames.bas")
    keys = result_keys_in_source(main)
    # rotor speed and collective pitch are results rows (C_T and T are already in the performance block)
    assert "rpm" in keys and "coll" in keys and "CT" in keys and "T" in keys
    assert 'Add("rpm", "Rotor Speed"' in names
    assert 'Add("coll", "Collective Pitch"' in names
    assert "Private lblResults(80) As Label" in main
    assert "Private lblResultUnits(80) As Label" in main
    assert "ResTextFor(ResKeys.Get(i))" in main
    assert '"RPM — Solved Speed"' not in main
    assert '"CT — Trimmed"' not in main


def test_premium_visual_contract_is_enforced_in_source():
    main = text("RotorCalculator.b4a")
    req = text("docs/software_requirements.md")
    # results: symbol-first quantity | value | unit, one nomenclature level per page
    assert "ResLevel = RotorNames.ChooseLevel(ResKeys, nameW - 10dip, TextSp, MinNameLevel)" in main
    assert "RotorNames.ResultLabel(k, nameW - 10dip, resLblSp)" in main
    assert "Dim nameW As Int = rowW * 46 / 100" in main
    assert "Dim valW As Int = rowW * 30 / 100" in main
    assert "ResUnitFor(k)" in main
    assert "Return Dash" in main
    assert '"[-]"' not in main
    # legacy hidden names must not come back
    for legacy in ('"Thrust Coef (CT)"', '"Torque Coef (CQ)"', '"Induced Factor Kind"',
                   "Sub EngineeringText", "Sub ResultDisplayLabel", "Sub ResultTooltip"):
        assert legacy not in main
    assert "**UX-21**" in req and "**UX-28**" in req
    assert "**QA-15**" in req and "**QA-19**" in req


def test_active_ui_avoids_caption_sized_engineering_controls():
    main = text("RotorCalculator.b4a")
    assert "lblMode.TextSize = 13 * sc" in main        # status chips
    assert "l.TextSize = 13 * sc" in main              # status chips
    assert "lblResults(i).TextSize = TextSp" in main  # result values
    assert "lbl.TextSize = resLblSp" in main
    assert "b.TextSize = 13 * sc" in main              # sweep selectors
    assert "btnSweepParam.TextSize = 14 * sc" in main
    assert "btnTable.TextSize = 14 * sc" in main
    assert "Dim btnH As Int = 52dip" in main
    assert "font-size:15px" in main                    # sweep table text


def test_flow_inputs_share_the_normal_row_and_equivalents_live_in_results():
    main = text("RotorCalculator.b4a")
    assert "flowRowH" not in main
    assert "AddFormRowPanelH" not in main
    assert "RefreshFlowDerivedLabels" not in main
    keys = result_keys_in_source(main)
    for key in ("mu", "Vx", "muz", "Vz", "alpha"):
        assert key in keys


def test_sweep_axis_and_range_are_explicit_selectors():
    main = text("RotorCalculator.b4a")
    assert "InputList" not in main
    assert 'sheet.ShowChoice(RotorNames.PlainLabel("xAxis", 0), options, SweepXAxisMode)' in main
    assert 'sheet.ShowChoice("Sweep Range", options, selected)' in main
    assert 'sheet.ShowChoice("Y-Axis Result", items, selected)' in main
    # two-row control grid: Y-axis selector, then four equal-width selectors
    assert 'btnSweepParam = NewSweepButton("btnSweepParam")' in main
    for name in ("btnSweepMultiModel", "btnSweepXAxis", "btnSweepMaxMu", "btnSweepTrim"):
        assert f'{name} = NewSweepButton("{name}")' in main
    assert "Dim bw As Int = (root.Width - 24dip - 3 * gap) / 4" in main
    assert "plotH = plotW * 95 / 100" in main
    assert "pnlSweepTouch_Touch" in main
    assert "RotorPopups.SweepReadout(" in main
    assert "PlotPalette, SweepCrossX" in main


def test_help_matches_six_pair_final_architecture():
    for path in ("Files/physics_help.html", "Files/physics_help_light.html"):
        help_text = text(path)
        assert "Ω, Δθ" in help_text
        assert "prescribed" in help_text
        assert "Hover Only" in help_text
        assert "T<sub>c</sub>" in help_text or "T_c" in help_text or "T<sub>c" in help_text


def test_themed_sheets_replace_every_system_dialog():
    main = text("RotorCalculator.b4a")
    for source in ("RotorCalculator.b4a", "RotorPopups.bas", "RotorStorage.bas", "clsSheet.bas", "RotorNames.bas"):
        src = text(source)
        for banned in ("Msgbox", "MsgboxAsync", "InputList", "InputBox", "As Spinner"):
            assert banned not in src
    assert 'sheet.ShowMessage("About RotorCalculator"' in main
    assert "Sub btnUnitMode_Click" in main
    assert "Sub btnUnitSwap_Click" in main
    assert "UnitModeIdx = Bit.Xor(UnitModeIdx, 1)" in main


def test_trim_residuals_use_loading_only_path():
    engine = text("zBETEngine.bas")
    ref = text("tools/zBET.py")
    assert "Return CalculateCoreResolvedMode(g, c, False)" in engine
    assert "If FullResults = False Then" in engine
    assert "res.ThrustN = ct_val * dynP" in engine
    assert "loading_only=True" in ref
    assert "if loading_only:" in ref


def test_collective_ct_nonunique_failure_is_explicit():
    engine = text("zBETEngine.bas")
    assert "Collective + CT is non-unique at this flight/model state" in engine
    assert 'If targetKind = "ct" And roots.Size <> 1 Then' in engine
    assert 'Return Array(sourceCond.RPM, False, "multiple")' in engine


def test_overflow_menu_is_themed_sheet_without_rspopupmenu():
    main = text("RotorCalculator.b4a")
    agents = text("AGENTS.md")
    assert "rspopupmenu" not in main.lower() and "RSPopupMenu" not in agents
    assert "NumberOfLibraries=3" in main
    start = main.index("Sub pnlMenuAnchor_Click")
    menu = main[start:main.index("End Sub", start)]
    order = [menu.index(t) for t in ("Physics & Equations", "Unit Converter", "Settings", "About", "Privacy")]
    assert order == sorted(order)
    assert "sheet.ShowMenu" in menu
    assert "Public Sub ShowMenu" in text("clsSheet.bas")


def test_settings_sections_and_rename_flow():
    main = text("RotorCalculator.b4a")
    for hdr in ('"DISPLAY"', '"PLOTS"', '"ROTOR DATA"'):
        assert f"AddSettingsHeader(scv.Panel, cardW, y, {hdr})" in main
    assert '"Result Units (Outputs Only)"' in main
    assert "0.0699 " in main and "0.06993" in main
    assert "btnSettingRestore" in main
    assert "ShowChoiceSwatches" in main
    assert "Rename Current Rotor" in main and "sheet.ShowInput(\"Rename Rotor\"" in main
    assert "SetFieldFocus(Sender, HasFocus)" in main
    assert "#ApplicationLabel: Rotor Calc" in main


def test_sweep_range_is_limited_to_engine_mu_limit():
    main = text("RotorCalculator.b4a")
    start = main.index("Sub btnSweepMaxMu_Click")
    block = main[start:main.index("End Sub", start)]
    assert "Array As Double(0.3, 0.4, 0.5, 0.6)" in block
    assert "0.8" not in block and "1.0)" not in block
    assert "model limit" in block
    assert "th:nth-child(" in main  # frozen x columns in the sweep table


def _nomenclature_keys():
    keys = set()
    for line in text("docs/nomenclature.md").splitlines():
        m = re.match(r"^\|\s*([A-Za-z][A-Za-z0-9_]*)\s*\|", line)
        if m and m.group(1) != "Key":
            keys.add(m.group(1))
    return keys


def test_nomenclature_md_matches_rotornames_keys():
    names_src = text("RotorNames.bas")
    names = set(re.findall(r'^\s*Add\("([A-Za-z0-9_]+)"', names_src, re.M))
    doc = _nomenclature_keys()
    assert names, "no RotorNames keys parsed"
    missing_in_bas = sorted(doc - names)
    missing_in_doc = sorted(names - doc)
    assert not missing_in_bas, f"keys in docs/nomenclature.md absent from RotorNames.bas: {missing_in_bas}"
    assert not missing_in_doc, f"RotorNames.bas keys absent from docs/nomenclature.md: {missing_in_doc}"


def test_sweep_name_keys_resolve_to_rotornames():
    names = set(re.findall(r'^\s*Add\("([A-Za-z0-9_]+)"', text("RotorNames.bas"), re.M))
    popups = text("RotorPopups.bas")
    start = popups.index("Private Sub SweepNameKey")
    block = popups[start:popups.index("End Sub", start)]
    targets = set(re.findall(r'Return "([A-Za-z0-9_]+)"', block))
    assert targets
    assert sorted(t for t in targets if t not in names) == []


def test_selector_values_share_the_editable_value_surface():
    main = text("RotorCalculator.b4a")
    sel = main.split("Private Sub CreateSelectorValue", 1)[1].split("End Sub", 1)[0]
    assert "ColorFieldFill" in sel and "ColorFieldBorder" in sel
    assert "btn.TextColor = ColorEdtText" in sel and "TextSp" in sel
    assert "CreateSelectorValue(rowId, evt)" in main
    for name in ("btnTipLoss", "btnCompressibility"):
        assert f"{name}.TextColor" not in main


def test_abbreviations_documented_and_labels_single_line():
    names = text("RotorNames.bas")
    doc = text("docs/nomenclature.md")
    m = re.search(r'Array As String\(("R", "Radius".*?)\)' + chr(10), names, re.S)
    vals = re.findall(r'"([^"]*)"', m.group(1))
    effective = dict(zip(vals[::2], vals[1::2]))
    effective.update(re.findall(r'abbr\.Put\("([^"]+)", "([^"]+)"\)', names))
    for k, v in effective.items():
        assert f"- `{k}`: {v}" in doc
        assert "." not in re.sub(r"\b(?:Adv|Act|Geom|Thr|Prof|Ind|Rot|Eff|Compres|Ret)\.", "", v)
    main = text("RotorCalculator.b4a")
    row = main.split("Private Sub CreateRowLabel", 1)[1].split("End Sub", 1)[0]
    assert "btn.SingleLine = True" in row and "SetTextLines(btn, 1)" in row


def test_unit_column_has_one_style_and_non_converting_units_open_help():
    main = text("RotorCalculator.b4a")
    sub = main.split("Private Sub StyleUnitButton", 1)[1].split("End Sub", 1)[0]
    assert "If u = Dash" not in sub and "ColorPnlInput5" not in sub
    assert "btn.TextColor = ColorButText2" in sub
    click = main.split("Sub unitRow_Click", 1)[1].split("End Sub", 1)[0]
    assert "ShowHelpFor(rid)" in click and "ToastMessageShow" not in click


def test_sound_speed_label_keeps_speed_at_every_level():
    names = text("RotorNames.bas")
    assert '"a", "Sound Speed"' in names and '"OmR", "Tip Speed"' in names
    assert '"Speed of Sound", "Sound Speed", "a"' in names


def test_dimensional_counterparts_exist_for_every_coefficient():
    main = text("RotorCalculator.b4a")
    names = text("RotorNames.bas")
    pops = text("RotorPopups.bas")
    for k, sym in (("Qi", "Q_i"), ("Q0", "Q_0"), ("Hi", "H_i"), ("H0", "H_0"), ("Pair", "P_air")):
        assert f'Add("{k}",' in names and f'"{sym}"' in names
        assert f'"{k}"' in main
    for sk in ("TorqueIndNm", "TorqueProfNm", "DragIndN", "DragProfN", "PowerIndKW", "PowerProfKW", "PowerAirKW"):
        assert f'AddSweepParam("{sk}"' in pops
    assert "FORCES" in main and "TORQUES & MOMENTS" in main and '"POWER"' in main
    assert "r.CQi * r.DensityRho * area * omR * omR * omR" in main  # P_i = Q_i * Omega


def _names_table():
    src = text("RotorNames.bas")
    tbl = {}
    for m in re.finditer(r'^\s*Add\("([A-Za-z0-9_]+)", "([^"]*)", "([^"]*)", "([^"]*)"', src, re.M):
        tbl[m.group(1)] = (m.group(2), m.group(3), m.group(4))
    am = re.search(r'Array As String\(("R", "Radius".*?)\)' + chr(10), src, re.S)
    vals = re.findall(r'"([^"]*)"', am.group(1))
    return tbl, dict(zip(vals[::2], vals[1::2]))


def _page_keys(main):
    geom = re.search(r'GeomKeys.AddAll\(Array As String\((.*?)\)\)', main, re.S).group(1)
    cond = re.search(r'CondKeys.AddAll\(Array As String\((.*?)\)\)', main, re.S).group(1)
    return {"geometry": re.findall(r'"([^"]+)"', geom), "conditions": re.findall(r'"([^"]+)"', cond),
            "results": result_keys_in_source(main)}


def test_no_ambiguous_labels_on_a_page_and_key_names_present():
    tbl, abbr = _names_table()
    main = text("RotorCalculator.b4a")
    for page, keys in _page_keys(main).items():
        seen_m, seen_a = {}, {}
        for k in keys:
            full, short, sym = tbl[k]
            m_label = f"{short} {sym}".strip()
            a = abbr.get(k, short)
            a_label = a if (not sym or a == sym) else f"{a} {sym}"
            assert m_label not in seen_m, f"{page}: M label {m_label!r} for {k} and {seen_m.get(m_label)}"
            assert a_label not in seen_a, f"{page}: A label {a_label!r} for {k} and {seen_a.get(a_label)}"
            seen_m[m_label] = k
            seen_a[a_label] = k
    assert tbl["h"][1] == "Altitude" and abbr["h"] == "Altitude"
    assert tbl["Mtip"][1] == "Tip Mach" and abbr["Mtip"] == "Tip Mach"
    assert tbl["Madv"][1] == "Adv. Mach" and abbr["Madv"] == "Adv. Mach"
    for k in ("a", "OmR"):
        assert "Speed" in abbr[k]


def test_coeff_word_only_for_dynamic_pressure_coefficients():
    src = text("RotorNames.bas")
    allowed = {"Tc", "Pc"}
    for m in re.finditer(r'^\s*Add\("([A-Za-z0-9_]+)", "([^"]*)", "([^"]*)"', src, re.M):
        has = "Coeff " in (m.group(2) + " ") or (m.group(3) + " ").find("Coeff ") >= 0
        assert has == (m.group(1) in allowed), m.group(1)
    assert '"Dynamic Thrust Coeff"' in src and '"Dyn Power Coeff"' in src
    assert "T_c = T / (½ρV∞²A)" in src


def test_apk_results_preserve_name_symbol_order_and_speed_caption():
    src = text("RotorNames.bas")
    result = src.split("Public Sub ResultPlainLabel", 1)[1].split("End Sub", 1)[0]
    assert 'Return caption & " " & sym' in result
    assert 'If level = 4 Then' in result
    assert 'If sym.Length > 0 Then Return sym' in result
    assert 'If level = 2 Then caption = NarrowName(key)' in result
    assert 'Array As Int(0, 1, 3, 2, 4)' in src
    assert 'narrowNames.Put("Hi", "Ind. In-Plane")' in src
    assert 'narrowNames.Put("H0", "Prof. In-Plane")' in src
    assert '"Speed " & sym' not in result
    assert 'abbr.Put("Vztot", "Axial Speed")' in src
    assert '"Adv. Speed"' in src and '"Ret. Speed"' in src
    assert '"V_{z,tot}"' in src and '"α_{adv,75}"' in src
    assert 'abbr.Put("aoaAdv75", "Adv. AoA")' in src
    assert 'abbr.Put("aoaRet75", "Ret. AoA")' in src
    assert 'abbr.Put("phiAdv75", "Adv. Inflow")' in src
    assert 'abbr.Put("phiRet75", "Ret. Inflow")' in src
    assert '"Advancing Section AoA 75%"' not in src
