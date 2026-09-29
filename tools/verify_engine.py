#!/usr/bin/env python3
"""Offline numerical and source-contract verification for RotorCalculator.

This harness does not use GitHub Actions. It verifies the Python reference
numerically and locks the governing B4A source contracts. A compiled B4A APK
remains the final integration/release target.
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
ROOT = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))

import zBET


def verify_b4a_source_contract() -> None:
    src = (ROOT / "zBETEngine.bas").read_text(encoding="utf-8")
    required = [
        "Public Sub ResolveOperatingState",
        "Private Sub SolveCollective",
        "Private Sub SolveRPM",
        "Return CalculateCoreResolvedMode(g, c, False)",
        "If FullResults = False Then",
        "Private Sub ApplyOperatingGeometry",
        "Public Sub ResolveConditionAtRPM",
        'Case "rpm_collective"',
        'Case "rpm_ct"',
        'Case "rpm_thrust"',
        'Case "collective_ct"',
        'Case "collective_thrust"',
        'Case "ct_thrust"',
        "g.ThetaRoot = baseGeom.ThetaRoot + dtheta",
        "g.ThetaTip = baseGeom.ThetaTip + dtheta",
        'If c.HorizontalMode = "vx" Then',
        "c.Mu = Max(-0.60, Min(0.60, c.HorizontalValue / vtip))",
        "ResolveMuZ(c.Mu, c.AxialMode, c.AxialValue, vtip)",
        'ProfileDrag(c.Mu, c.MuZ, g, "numerical_vectorial")',
        "c.KInd = Max(1.0, Min(3.0, c.KInd))",
        "nb * geom.ChordRoot / (cPI * rad)",
        "nb * (geom.ChordTip - geom.ChordRoot) / (cPI * rad)",
        "geom.SigmaRef = s0 + 0.5 * s1",
        "Public Sub ScaleRadiusPreserveReference",
        "Public Sub ScaleChordsToSigmaRef",
        "Public Sub ScaleChordsToAspectRatio",
        "If f_lo < 0.0 Then Return -1.0",
        "If f_hi > 0.0 Then Return -1.0",
        "Sqrt(0.75 * 0.75 + 0.5 * mu * mu)",
        "If mEff > 0.85 Then mEff = 0.85",
        "Dim cpFoM As Double = c.KInd * idealHoverPower + res.CQ0",
        "For iter_tip = 1 To 8",
        "res.TrimmedRPM = g.RPM",
        "res.TrimmedCollectiveDeg = c.CollectiveDeg",
        "res.OperatingVx = c.Mu * vtip",
        "res.OperatingVz = c.MuZ * vtip",
    ]
    missing = [token for token in required if token not in src]
    if missing:
        raise AssertionError("B4A source contract missing: " + " | ".join(missing))


def verify_ui_source_contract() -> None:
    """Lock the current Android architecture without requiring B4A or an emulator."""
    main = (ROOT / "RotorCalculator.b4a").read_text(encoding="utf-8")
    storage = (ROOT / "RotorStorage.bas").read_text(encoding="utf-8")
    plan = (ROOT / "plano.md").read_text(encoding="utf-8").lower()
    requirements = (ROOT / "docs" / "software_requirements.md").read_text(
        encoding="utf-8"
    ).lower()

    required_main = [
        'btnActiveRotor.Initialize("btnActiveRotor")',
        'options.Add("＋ NEW ROTOR")',
        "BuildGeometryEditorContent",
        'CreateRowButton("SAVE", "btnGeometrySave")',
        'CreateRowButton("COPY", "btnGeometryCopy")',
        'CreateRowButton("DELETE", "btnGeometryDelete")',
        '"BLADE GEOMETRY"',
        '"DERIVED GEOMETRY"',
        '"ROTOR AERODYNAMICS"',
        'lowerName.Contains(" copy")',
        'shortName = shortName & " (Copy)"',
        'Dim copySuffix As String = fullName.SubString(copyPos + 1).Trim',
        "rotor identity and actions share one 50dip band",
        'lblResultStatus.SingleLine = True',
        '"STATUS · PG CAUTION · Mat≥0.80"',
        'compactLandscape As Boolean = (ld = 1 And root.Width <= 700dip)',
        'btnSweepMultiModel.Text = "Models (4)"',
        'btnSweepTrimHover.Text = "HOVER ONLY ✓"',
        "Private lblResults(43) As Label",
        "Private lblResultUnits(43) As Label",
        '"DIMENSIONAL PERFORMANCE"',
        '"AERODYNAMIC COEFFICIENTS"',
        '"EFFICIENCY"',
        '"INFLOW & WAKE"',
        '"OPERATING STATE & ATMOSPHERE"',
        'btnTable.Initialize("btnSweepTable")',
        'btnCsv.Initialize("btnSweepExportCsv")',
        'btnPng.Initialize("btnSweepExportPng")',
        "SweepSamplesCache = RotorPopups.BuildSweepSamples",
        "Private Sub BuildSweepCsv As String",
    ]
    missing = [token for token in required_main if token not in main]
    if missing:
        raise AssertionError("Android UI contract missing: " + " | ".join(missing))

    forbidden_main = [
        'CreateRowButton("LOAD ROTOR", "btnLoadRotor")',
        'CreateRowButton("SAVE AS NEW", "btnSaveAsNewRotor")',
        "Private lblLoadedRotor As Label",
        '"ROTOR LIBRARY"',
        "Private Sub OpenGeometryPopup",
        "Public GeometryEditorRequested As Boolean = False",
        "Sub rotorRow_Click",
        "UiContentW = scvGeom.Width",
        '"CQ / CPshaft — Shaft Power"',
    ]
    stale = [token for token in forbidden_main if token in main]
    if stale:
        raise AssertionError("Obsolete Geometry UI returned: " + " | ".join(stale))

    required_storage = [
        "Public Sub SetActiveRotor",
        "Public Sub UpdateRotor",
        "Public Sub AddRotor",
        "Public Sub MakeCopyName",
        "Public Sub DeleteRotor",
        "Public Sub RestoreFactoryPresets",
        "Public Sub ExportDatabaseText",
        "Public Sub ParseDatabaseText",
        "Public Sub MergeImportedRotors",
    ]
    missing = [token for token in required_storage if token not in storage]
    if missing:
        raise AssertionError("Rotor storage contract missing: " + " | ".join(missing))

    for token in ("direct in-page rotor editor", "active rotor", "six operating pairs", "universal plots"):
        if token not in plan:
            raise AssertionError(f"plan contract missing: {token}")
    for token in ("active rotor", "**geo-6**", "**ux-9**", "**ux-29**", "**qa-9**"):
        if token not in requirements:
            raise AssertionError(f"requirements contract missing: {token}")

    # Every Results row must receive a value through the authoritative value/unit cell helper.
    assigned = {int(x) for x in re.findall(r"SetResultCell\((\d+),", main)}
    expected = set(range(43))
    if assigned != expected:
        missing_indices = sorted(expected - assigned)
        extra_indices = sorted(assigned - expected)
        raise AssertionError(
            f"Results index coverage mismatch: missing={missing_indices}, extra={extra_indices}"
        )

    # Cheap structural sanity: no duplicate Sub names in the edited Android main.
    sub_names = [
        name.lower()
        for name in re.findall(
            r"(?im)^\s*(?:public\s+|private\s+)?sub\s+([a-z0-9_]+)", main
        )
    ]
    duplicates = sorted({name for name in sub_names if sub_names.count(name) > 1})
    if duplicates:
        raise AssertionError("Duplicate B4A Sub names: " + ", ".join(duplicates))


def make_geometry(*, rpm=430.0, radius=5.0, blades=4, c0=0.30, c1=0.22,
                  x0=0.15, pg=True, tip_loss="fixed"):
    sol = zBET.resolve_solidity(
        "chords",
        radius=radius,
        chord_root=c0,
        chord_tip=c1,
        n_blades=blades,
        root_cutout=x0,
    )
    return zBET.Geometry(
        rpm,
        radius,
        5.73,
        x0,
        0.009,
        sol,
        speed_of_sound=340.3,
        use_prandtl_glauert=pg,
        tip_loss_mode=tip_loss,
        tip_loss_b=0.97,
    )


def verify_reference_planform() -> None:
    radius = 5.0
    blades = 4
    c0 = 0.30
    c1 = 0.20
    sigma_ref_expected = blades * 0.5 * (c0 + c1) / (math.pi * radius)
    for x0 in (0.0, 0.10, 0.25, 0.40):
        sol = zBET.resolve_solidity(
            "chords",
            radius=radius,
            chord_root=c0,
            chord_tip=c1,
            n_blades=blades,
            root_cutout=x0,
        )
        if not math.isclose(sol.sigma_ref, sigma_ref_expected, rel_tol=0, abs_tol=1e-14):
            raise AssertionError("reference solidity changed with root cutout")
        expected_geom = blades / (math.pi * radius) * (
            c0 * (1.0 - x0)
            + 0.5 * (c1 - c0) * (1.0 - x0 * x0)
        )
        if not math.isclose(sol.sigma_geom, expected_geom, rel_tol=0, abs_tol=1e-14):
            raise AssertionError("active geometric solidity mismatch")


def verify_axial_representations() -> None:
    geom = make_geometry()
    for mu in (0.05, 0.15, 0.30, 0.45):
        for alpha_deg in (-10.0, -5.0, 0.0, 5.0, 10.0):
            muz_a, _ = zBET.axial_condition(mu, alpha_deg, "alpha", geom)
            vz = muz_a * geom.vtip
            muz_v, _ = zBET.axial_condition(mu, vz, "w", geom)
            muz_d, _ = zBET.axial_condition(mu, muz_a, "mu_z", geom)
            if not math.isclose(muz_a, muz_v, rel_tol=0, abs_tol=1e-14):
                raise AssertionError("alpha/Vz representation mismatch")
            if not math.isclose(muz_a, muz_d, rel_tol=0, abs_tol=1e-14):
                raise AssertionError("alpha/muz representation mismatch")
    if not zBET.axial_condition(0.2, 5.0, "alpha", geom)[0] < 0.0:
        raise AssertionError("positive alpha must produce negative muz")
    if not zBET.axial_condition(0.2, 5.0, "w", geom)[0] > 0.0:
        raise AssertionError("positive climb Vz must produce positive muz")


def verify_operating_pairs() -> None:
    geom = make_geometry()
    common = dict(
        theta_root_deg=12.0,
        theta_tip_deg=2.0,
        horizontal_mode="vx",
        horizontal_value=45.0,
        axial_mode="vz",
        axial_value=3.0,
        inflow_model="coleman_feingold",
        k_ind=1.15,
    )
    known_rpm = 430.0
    known_collective = 4.0
    baseline = zBET.solve_operating_pair(
        geom,
        pair="rpm_collective",
        rpm=known_rpm,
        collective_deg=known_collective,
        target_ct=0.0,
        target_thrust_n=0.0,
        **common,
    )
    target_ct = baseline["CT"]
    target_thrust = baseline["T_N"]

    seeds = {
        "rpm_collective": (known_rpm, known_collective),
        "rpm_ct": (known_rpm, 0.0),
        "rpm_thrust": (known_rpm, 0.0),
        "collective_thrust": (300.0, known_collective),
        "ct_thrust": (300.0, 0.0),
    }
    for pair, (rpm_seed, coll_seed) in seeds.items():
        solved = zBET.solve_operating_pair(
            geom,
            pair=pair,
            rpm=rpm_seed,
            collective_deg=coll_seed,
            target_ct=target_ct,
            target_thrust_n=target_thrust,
            **common,
        )
        if not math.isclose(solved["CT"], target_ct, rel_tol=2e-5, abs_tol=2e-8):
            raise AssertionError(f"{pair}: CT mismatch")
        if not math.isclose(solved["T_N"], target_thrust, rel_tol=2e-5, abs_tol=1e-3):
            raise AssertionError(f"{pair}: thrust mismatch")
        if not math.isclose(solved["rpm"], known_rpm, rel_tol=2e-4, abs_tol=0.1):
            raise AssertionError(f"{pair}: RPM mismatch")
        if not math.isclose(solved["collective_deg"], known_collective, rel_tol=0, abs_tol=2e-3):
            raise AssertionError(f"{pair}: collective mismatch")
        if not math.isclose(solved["Vx_m_s"], 45.0, rel_tol=0, abs_tol=1e-10):
            raise AssertionError(f"{pair}: Vx did not stay dimensional")
        if not math.isclose(solved["Vz_m_s"], 3.0, rel_tol=0, abs_tol=1e-10):
            raise AssertionError(f"{pair}: Vz did not stay dimensional")

    try:
        zBET.solve_operating_pair(
            geom,
            pair="collective_ct",
            rpm=known_rpm,
            collective_deg=known_collective,
            target_ct=target_ct,
            target_thrust_n=target_thrust,
            **common,
        )
    except ValueError as exc:
        if "non-unique" not in str(exc):
            raise
    else:
        raise AssertionError("Collective + CT must reject the multi-root reference state")

    hover_common = dict(
        theta_root_deg=12.0,
        theta_tip_deg=2.0,
        horizontal_mode="mu",
        horizontal_value=0.0,
        axial_mode="muz",
        axial_value=0.0,
        inflow_model="uniform",
        k_ind=1.15,
    )
    hover = zBET.solve_operating_pair(
        geom,
        pair="rpm_collective",
        rpm=known_rpm,
        collective_deg=known_collective,
        target_ct=0.0,
        target_thrust_n=0.0,
        **hover_common,
    )
    unique = zBET.solve_operating_pair(
        geom,
        pair="collective_ct",
        rpm=known_rpm,
        collective_deg=known_collective,
        target_ct=hover["CT"],
        target_thrust_n=hover["T_N"],
        **hover_common,
    )
    if not math.isclose(unique["rpm"], known_rpm, rel_tol=2e-4, abs_tol=0.1):
        raise AssertionError("Collective + CT unique hover RPM mismatch")


def verify_reference_matrix() -> tuple[int, float]:
    geom = make_geometry(pg=False, tip_loss="fixed")
    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    mus = [0.00, 0.05, 0.15, 0.25, 0.35]
    mu_z_values = [-0.02, -0.01, 0.00, 0.01, 0.02]
    models = ["uniform", "coleman_simple", "coleman_feingold", "drees"]

    passed = 0
    max_residual = 0.0
    for mu in mus:
        for mu_z in mu_z_values:
            for model in models:
                out = zBET.coefficients(
                    mu=mu,
                    mu_z=mu_z,
                    pitch_input=pitch,
                    geometry=geom,
                    model=model,
                    profile_drag_model="numerical_vectorial",
                    induced_torque_model="energy_balance",
                    k_ind=1.15,
                )
                for key in (
                    "CT", "CQ", "CQi", "CQ0", "CH", "CHi", "CH0", "CY",
                    "CMx", "CMy", "CPair", "lambda", "lambda_i", "FoM",
                ):
                    if not math.isfinite(out[key]):
                        raise AssertionError(f"non-finite {key}: mu={mu}, muz={mu_z}, model={model}")
                if out["lambda_i"] < 0.0 or out["CT"] <= 0.0:
                    raise AssertionError("non-physical reference matrix point")

                b = out["B_tip_loss"]
                momentum_ct = (
                    2.0 * b * b * out["lambda_i"]
                    * math.sqrt(mu * mu + out["lambda"] * out["lambda"])
                )
                residual = abs(out["CT"] - momentum_ct)
                max_residual = max(max_residual, residual)
                if residual > 2e-10:
                    raise AssertionError(f"momentum closure residual={residual:.3e}")
                passed += 1

    if passed != 100:
        raise AssertionError(f"expected 100 points, got {passed}")
    return passed, max_residual


def verify_reference_corrections() -> None:
    geom = make_geometry(pg=True, tip_loss="sissingh")
    mu = 0.30
    m_eff = geom.tip_mach * math.sqrt(0.75 * 0.75 + 0.5 * mu * mu)
    m_eff = min(m_eff, 0.85)
    expected_a = geom.lift_curve_slope / math.sqrt(max(0.01, 1.0 - m_eff * m_eff))
    if not math.isclose(geom.lift_slope(mu), expected_a, rel_tol=0, abs_tol=1e-14):
        raise AssertionError("Prandtl-Glauert mismatch")

    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    out = zBET.coefficients(
        0.20, 0.0, pitch, geom, "coleman_feingold",
        profile_drag_model="numerical_vectorial", k_ind=1.15,
    )
    expected_b = geom.b_factor(ct=out["CT"])
    if not math.isclose(out["B_tip_loss"], expected_b, rel_tol=0, abs_tol=2e-8):
        raise AssertionError("Sissingh B/CT did not converge")

    ideal = out["CT"] ** 1.5 / math.sqrt(2.0)
    expected_fom = ideal / (1.15 * ideal + out["CQ0"])
    if not math.isclose(out["FoM"], expected_fom, rel_tol=0, abs_tol=1e-13):
        raise AssertionError("FoM / Kind mismatch")


def main() -> None:
    print("=" * 72)
    print("RotorCalculator offline verification")
    print("=" * 72)
    verify_b4a_source_contract()
    print("PASS: B4A engine source contract")
    verify_ui_source_contract()
    print("PASS: Android UI/storage/docs source contract")
    verify_reference_planform()
    print("PASS: zBEMT reference-planform metrics")
    verify_axial_representations()
    print("PASS: alpha / Vz / muz representations and signs")
    verify_operating_pairs()
    print("PASS: all six operating pairs, including Collective + CT uniqueness")
    verify_reference_corrections()
    print("PASS: PG / Sissingh / FoM reference corrections")
    count, residual = verify_reference_matrix()
    print(f"PASS: numerical-vectorial reference matrix {count}/100")
    print(f"PASS: max momentum-closure residual = {residual:.3e}")
    print("=" * 72)
    print("All offline reference/source verification gates passed.")


if __name__ == "__main__":
    main()
