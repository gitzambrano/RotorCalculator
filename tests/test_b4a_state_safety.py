from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_geometry_is_rotor_library_with_contextual_editor():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert '"ROTOR LIBRARY"' in main
    assert '"Tap a rotor to select it and open its geometry."' in main
    assert 'CreateRowButton("NEW ROTOR", "btnNewRotor")' in main
    assert "Private Sub OpenGeometryPopup" in main
    assert "Private GeometryPopupOpen As Boolean = False" in main
    assert '"BLADE GEOMETRY"' in main
    assert '"DERIVED GEOMETRY"' in main
    assert '"ROTOR AERODYNAMICS"' in main
    assert 'Dim copyPos As Int = lowerName.IndexOf(" copy")' in main
    assert 'compactLandscape As Boolean = (ld = 1 And root.Width <= 700dip)' in main
    assert 'btnSweepMultiModel.Text = "Models (4)"' in main
    assert 'btnSweepTrimHover.Text = "HOVER ✓"' in main
    assert 'btnSweepMaxMu.Text = "μ " & NumberFormat2' in main
    assert 'shortName = shortName & " (Copy)"' in main
    assert 'Dim copySuffix As String = fullName.SubString(copyPos + 1).Trim' in main
    assert "Public Sub MakeCopyName(SourceName As String) As String" in storage
    assert 'g.Name = MakeCopyName(g.Name)' in storage
    assert 'CreateRowButton("SAVE", "btnGeometrySave")' in main
    assert 'CreateRowButton("COPY", "btnGeometryCopy")' in main
    assert 'CreateRowButton("DELETE", "btnGeometryDelete")' in main
    assert 'CreateRowButton("LOAD ROTOR", "btnLoadRotor")' not in main
    assert 'CreateRowButton("SAVE AS NEW", "btnSaveAsNewRotor")' not in main
    assert 'lblAppTitle.Text = "RotorCalculator"' in main
    assert "lblAppTitle.Text = ActiveGeom.Name" not in main


def test_geometry_exposes_all_authoritative_inputs():
    main = text("RotorCalculator.b4a")
    for label in (
        "Radius R",
        "Blade Count",
        "Root Cutout",
        "Root Chord c0",
        "Tip Chord c1",
        "Reference Solidity",
        "Aspect Ratio",
        "Root Incidence",
        "Tip Incidence",
    ):
        assert f'"{label}"' in main


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
    main = text("RotorCalculator.b4a")
    assert "Public Sub ScaleRadiusPreserveReference" in engine
    assert "Dim scale As Double = newRadius / oldRadius" in engine
    assert "g.ChordRoot = g.ChordRoot * scale" in engine
    assert "g.ChordTip = g.ChordTip * scale" in engine
    assert "zBETEngine.ScaleRadiusPreserveReference(ActiveGeom, newR)" in main


def test_sigma_and_aspect_ratio_edits_scale_both_chords():
    engine = text("zBETEngine.bas")
    main = text("RotorCalculator.b4a")
    assert "Public Sub ScaleChordsToSigmaRef" in engine
    assert "Public Sub ScaleChordsToAspectRatio" in engine
    assert "g.ChordRoot = g.ChordRoot * scale" in engine
    assert "g.ChordTip = g.ChordTip * scale" in engine
    assert "zBETEngine.ScaleChordsToSigmaRef" in main
    assert "zBETEngine.ScaleChordsToAspectRatio" in main


def test_geometry_derived_metrics_are_visible():
    main = text("RotorCalculator.b4a")
    for label in (
        "Geometric Solidity",
        "Thrust Solidity",
        "Taper Ratio",
        "Disk Area",
        "Reference Blade Area",
        "Active Blade Area",
        "Total Twist",
    ):
        assert f'"{label}"' in main
    assert "zBETEngine.ReferenceBladeArea" in main
    assert "zBETEngine.ActiveBladeArea" in main
    assert "zBETEngine.TaperRatio" in main


def test_rotor_aerodynamics_share_geometry_panel_language():
    main = text("RotorCalculator.b4a")
    assert '"ROTOR AERODYNAMICS"' in main
    assert '"Airfoil"' in main
    assert '"Lift Slope a0"' in main
    assert '"Profile Cd0"' in main
    assert '"Tip Loss"' in main
    assert '"Fixed Tip Factor B"' in main
    assert '"Compressibility"' in main
    assert 'options.Add("Sissingh")' in main


def test_geometry_edits_are_explicitly_saved_and_contextual_actions_are_local():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert "GeometryDirty = True" in main
    assert "Private Sub SaveCurrentRotor" in main
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
    assert "SCHEMA_VERSION As Int = 2" in storage
    assert "Private Sub ParseLegacyRotor" in storage
    assert "g.ChordRoot = oldRoot - (tip - oldRoot) * g.RootCutout / (1.0 - g.RootCutout)" in storage
    assert "Public Sub ExportDatabaseText" in storage
    assert "Public Sub ParseDatabaseText" in storage


def test_conditions_present_atmosphere_and_equivalent_flow_inputs():
    main = text("RotorCalculator.b4a")
    assert '"ATMOSPHERE & FLOW"' in main
    assert '"Altitude"' in main
    assert '"Temperature"' in main
    assert '"Horizontal Flow"' in main
    assert '"Axial Flow"' in main
    assert 'btnHorizontalInput.Text = "μ"' in main
    assert 'btnHorizontalInput.Text = "Vx"' in main
    assert 'btnAxialInput.Text = "α"' in main
    assert 'btnAxialInput.Text = "Vz"' in main
    assert 'btnAxialInput.Text = "μz"' in main
    assert "lblHorizontalDerived" in main
    assert "lblAxialDerived" in main


def test_axial_sign_convention_matches_requirements():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert "Return -mu * Tan(axialValue * cPI / 180.0)" in engine
    assert "Return axialValue / vtip" in engine
    assert '"+Vz means positive climb rate' in main
    assert '"+α means relative wind arriving from below' in main
    assert '"Vz > 0: positive climb rate, relative wind from above."' in main


def test_conditions_expose_all_six_operating_pairs():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    pairs = (
        ("rpm_collective", "RPM + Collective"),
        ("rpm_ct", "RPM + CT"),
        ("rpm_thrust", "RPM + Thrust"),
        ("collective_ct", "Collective + CT"),
        ("collective_thrust", "Collective + Thrust"),
        ("ct_thrust", "CT + Thrust"),
    )
    for key, label in pairs:
        assert f'"{key}"' in engine
        assert f'"{label}"' in main


def test_only_two_operating_inputs_are_presented_for_selected_pair():
    main = text("RotorCalculator.b4a")
    assert "Private lblOperatingInput1 As Label" in main
    assert "Private lblOperatingInput2 As Label" in main
    assert "Private edtOperatingInput1 As EditText" in main
    assert "Private edtOperatingInput2 As EditText" in main
    assert "Private Sub PairInputName" in main
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
    assert 'lblDragFixed.Text = "Numerical Vectorial"' in main
    assert "btnProfileDragModel" not in main
    assert 'c.ProfileDragModel = "numerical_vectorial"' in engine
    assert 'ProfileDrag(c.Mu, c.MuZ, g, "numerical_vectorial")' in engine


def test_kind_is_condition_input():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert '"Induced Factor Kind"' in main
    assert "Sub edtKInd_TextChanged" in main
    assert "ActiveCond.KInd = ClampD" in main
    assert "c.KInd = Max(1.0, Min(3.0, c.KInd))" in engine


def test_results_group_all_coefficients_together():
    main = text("RotorCalculator.b4a")
    assert '"AERODYNAMIC COEFFICIENTS"' in main
    expected = {
        7: "ActiveRes.CT",
        8: "ActiveRes.CQ",
        9: "ActiveRes.CQi",
        10: "ActiveRes.CQ0",
        11: "ActiveRes.CH",
        12: "ActiveRes.CHi",
        13: "ActiveRes.CH0",
        14: "ActiveRes.CY",
        15: "ActiveRes.CMx",
        16: "ActiveRes.CMy",
        17: "ActiveRes.CPair",
    }
    for index, source in expected.items():
        assert f"lblResults({index}).Text = FormatOutputValue({source}" in main


def test_results_include_operating_solution_and_atmosphere():
    main = text("RotorCalculator.b4a")
    engine = text("zBETEngine.bas")
    assert '"OPERATING STATE & ATMOSPHERE"' in main
    assert "ActiveRes.TrimmedRPM" in main
    assert "ActiveRes.TrimmedCollectiveDeg" in main
    assert "ActiveRes.OperatingMu" in main
    assert "ActiveRes.OperatingVx" in main
    assert "ActiveRes.OperatingMuZ" in main
    assert "ActiveRes.OperatingVz" in main
    assert "ActiveRes.OperatingAlphaDeg" in main
    assert "ActiveRes.Density" in main
    assert "ActiveRes.PressurePa" in main
    assert "ActiveRes.SpeedOfSound" in main
    assert "res.TrimmedCollectiveDeg = c.CollectiveDeg" in engine


def test_results_precision_is_variable_specific_plus_one():
    main = text("RotorCalculator.b4a")
    assert "Private Sub FormatOutputValue(Value As Double, BaseDigits As Int) As String" in main
    assert "BaseDigits + ExtraPrecision" in main
    assert "If Abs(Value) < (0.5 / scale) Then Value = 0" in main
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
    assert "RotorStorage.ParseDatabaseText" in main
    assert "RotorStorage.MergeImportedRotors" in main
    assert "Public Sub MergeImportedRotors" in storage


def test_import_conflicts_are_explicit():
    main = text("RotorCalculator.b4a")
    assert '"Rename imported duplicates"' in main
    assert '"Replace same-name local geometries"' in main
    assert '"Skip same-name imported geometries"' in main


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
    assert 'btnSweepValues.Text = "VALUES"' in main
    assert "Private Sub ParseSweepFamilyValues" in main
    assert "Enter 1–9 values separated by commas" in main
    assert "SweepAlphaValues" in main
    assert "SweepVzValues" in main
    assert "SweepMuZValues" in main
    assert "Public Sub SweepCurveCount" in popup


def test_plot_supports_hover_only_trim_and_per_point_trim():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert '"☑ TRIM ONLY HOVER"' in main
    assert '"☐ TRIM ONLY HOVER"' in main
    assert "SweepTrimOnlyHover = Not(SweepTrimOnlyHover)" in main
    assert "If trimOnlyHover And PairRequiresTrim(cond.OperatingPair) Then" in popup
    assert 'hoverCond.HorizontalMode = "mu"' in popup
    assert 'hoverCond.AxialMode = "muz"' in popup
    assert 'tempCond.OperatingPair = "rpm_collective"' in popup


def test_plot_table_csv_and_canvas_share_one_cached_dataset():
    main = text("RotorCalculator.b4a")
    popup = text("RotorPopups.bas")
    assert "SweepSamplesCache = RotorPopups.BuildSweepSamples" in main
    assert "DrawSweepPlot" in main and "SweepSamplesCache" in main
    assert "For rowIndex = 0 To SweepSamplesCache.Size - 1" in main
    assert "Private Sub BuildSweepCsv As String" in main
    assert "Public Sub BuildSweepSamples" in popup
    assert "Type SweepPoint" in popup


def test_plot_invalid_samples_are_not_drawn_as_zero():
    popup = text("RotorPopups.bas")
    assert "point.Valid = result.SolutionValid" in popup
    assert "If p1.Valid And p2.Valid Then" in popup
    assert "No valid operating points in this sweep." in popup


def test_plot_uses_actual_solved_vx_for_vx_axis():
    popup = text("RotorPopups.bas")
    assert "point.Vx = result.OperatingVx" in popup
    assert "If xAxisMode = 1 Then xv = sample.Vx" in popup
    assert "If xAxisMode = 1 Then" in popup
    assert "x1v = p1.Vx" in popup


def test_plot_exports_csv_png_with_saf():
    main = text("RotorCalculator.b4a")
    assert 'Wait For (SaveAs(input, "text/csv"' in main
    assert 'Wait For (SaveAs(input, "image/png"' in main
    assert 'bmp.WriteToStream(out, 100, "PNG")' in main
    assert "trim_strategy" in main
    assert "per_point_trim" in main
    assert "hover_trim_then_fixed" in main


def test_themes_help_and_precision_remain_persistent():
    main = text("RotorCalculator.b4a")
    assert 'File.WriteMap(File.DirInternal, "ui_settings.txt", m)' in main
    assert 'btnSettingTheme.Text = "LIGHT"' in main
    assert 'btnSettingTheme.Text = "DARK"' in main
    assert "File23=physics_help.html" in main
    assert "File24=physics_help_light.html" in main


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
    assert "#VersionCode: 3" in main
    assert "#VersionName: 1.20" in main
    assert not (ROOT / "Objects" / "RotorCalculator.apk").exists()
    assert not (ROOT / "RotorCalculator_Signed.apk").exists()
    assert not (ROOT / "RotorCalculator_Signed.aab").exists()
    assert not (ROOT / "Objects" / "classes.dex").exists()
    assert "Objects/*.apk" in ignore
    assert "Objects/*.dex" in ignore


def test_github_qa_is_manual_only_and_release_signing_is_externalized():
    wf = text(".github/workflows/frontend-source-qa.yml")
    build = text("tools/b4a_build.ps1")
    assert "workflow_dispatch:" in wf
    assert "\n  push:" not in wf
    assert "promote-release:" not in wf
    assert "$env:B4A_KEY_FILE" in build
    assert "$env:B4A_KEY_PASSWORD" in build


def test_requirements_and_plan_are_authoritative_for_new_architecture():
    req = text("docs/software_requirements.md")
    plan = text("plano.md")
    assert "**RPM + Collective**" in req
    assert "**CT + Thrust**" in req
    assert "**Import Geometries**" in req
    assert "**Trim only in hover**" in req
    assert "six operating pairs" in plan.lower()
    assert "universal plots" in plan.lower()
    assert "rotor library" in plan.lower()
    assert "geometry popup" in plan.lower()


def test_activity_recreation_preserves_unsaved_geometry_and_sweep_state():
    main = text("RotorCalculator.b4a")
    assert "Public GeometryDirty As Boolean = False" in main
    assert "Public GeometryEditorRequested As Boolean = False" in main
    assert "If CurrentPage = 0 And GeometryEditorRequested Then OpenGeometryPopup" in main
    assert "If idx = RotorStorage.ActiveIndex And GeometryDirty Then" in main
    assert "ActiveGeom = RotorStorage.GetActiveRotor" in main
    assert "Else If CurrentPage = 0 And GeometryDirty Then" in main
    assert "Public SweepMultiMode As Int = 0" in main
    assert 'Public SweepParamSelectedKey As String = "CP"' in main
    assert "Private GeometryDirty As Boolean" not in main
    assert "Private SweepMultiMode As Int" not in main


def test_factory_restore_preserves_user_rotors_and_library_marks_origin():
    main = text("RotorCalculator.b4a")
    storage = text("RotorStorage.bas")
    assert "Public Sub RestoreFactoryPresets" in storage
    assert "Rotors.Set(existing, zBETEngine.CloneGeometry(factoryGeom))" in storage
    assert "Rotors.Add(zBETEngine.CloneGeometry(factoryGeom))" in storage
    assert "RotorStorage.RestoreFactoryPresets" in main
    assert 'Dim kind As String = "USER"' in main
    assert 'kind = "FACTORY"' in main
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
    for label in ("Solved RPM", "Collective Increment (Δθ)", "Solved CT", "Solved Thrust"):
        assert f'"{label}"' in main
    assert "Private lblResults(43) As Label" in main
    assert "lblResults(26).Text = FormatOutputValue(ActiveRes.TrimmedRPM" in main
    assert "lblResults(27).Text = FormatOutputValue(ActiveRes.TrimmedCollectiveDeg" in main
    assert "lblResults(28).Text = FormatOutputValue(ActiveRes.CT" in main
    assert "lblResults(29).Text = FormatOutputValue(ActiveRes.ThrustN" in main


def test_flow_equivalents_get_dedicated_mobile_second_line():
    main = text("RotorCalculator.b4a")
    assert "Dim flowRowH As Int = 76dip" in main
    assert "Private Sub AddFormRowPanelH" in main
    assert "pnl.AddView(lblHorizontalDerived, pnl.Width*29/100, 52dip" in main
    assert "pnl.AddView(lblAxialDerived, pnl.Width*29/100, 52dip" in main


def test_sweep_axis_and_range_are_explicit_selectors():
    main = text("RotorCalculator.b4a")
    assert 'InputList(options, "Sweep X Axis", SweepXAxisMode)' in main
    assert 'InputList(options, "Sweep Range", selected)' in main
    assert 'btnSweepMaxMu.Text = "μ MAX "' in main


def test_help_matches_six_pair_final_architecture():
    for path in ("Files/physics_help.html", "Files/physics_help_light.html"):
        help_text = text(path)
        assert "RPM + Collective" in help_text
        assert "Collective + CT" in help_text
        assert "CT + Thrust" in help_text
        assert "Numerical Vectorial" in help_text
        assert "Trim only in hover" in help_text
        assert "Vz &gt; 0" in help_text


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
