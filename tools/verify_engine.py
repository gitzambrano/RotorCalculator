#!/usr/bin/env python3
"""Offline numerical and source-contract verification for RotorCalculator.

This harness intentionally does not depend on GitHub Actions. It exercises a
100-point deterministic matrix with the Python zBET reference implementation
and verifies that the B4A source still contains the governing equations and
state-safety contracts used by the Android application.

A compiled B4A APK remains the final integration target; source-contract tests
must never be described as compiled B4A/Python numerical equivalence.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
ROOT = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))

import zBET


def verify_b4a_source_contract() -> None:
    src = (ROOT / "zBETEngine.bas").read_text(encoding="utf-8")
    required = [
        "Dim trimmedGeom As RotorGeometry = CloneGeometry(geom)",
        "Public Sub SanitizeCondition",
        "Public Sub ResolveMuZ",
        'Case "alpha"',
        'Case "vz"',
        'Case "muz"',
        "Return -mu * Tan(axialValue * cPI / 180.0)",
        "Return axialValue / vtip",
        "geom.RootCutout = Max(0.0, Min(0.95, geom.RootCutout))",
        "If f_lo < 0.0 Then Return -1.0",
        "If f_hi > 0.0 Then Return -1.0",
        "res.SolutionValid = True",
        "res.CompressibilityWarning = False",
        "0.5 * a * (t_mom(2) + 0.5 * mu * mu * t_mom(0)",
        "2.0 * (b_val * b_val) * mid * Sqrt(mu * mu + lam_mid * lam_mid)",
        "cond.KInd * lambda_i * ct_val + cond.MuZ * ct_val - cond.Mu * res.CHi",
        "res.CPair = cond.KInd * lambda_i * ct_val + cond.MuZ * ct_val + res.CQ0 + cond.Mu * res.CH0",
    ]
    # Calculate uses a sanitized clone named c, so accept the same energy
    # equations in their sanitized-variable form.
    aliases = {
        "cond.KInd * lambda_i * ct_val + cond.MuZ * ct_val - cond.Mu * res.CHi":
            "c.KInd * lambda_i * ct_val + c.MuZ * ct_val - c.Mu * res.CHi",
        "res.CPair = cond.KInd * lambda_i * ct_val + cond.MuZ * ct_val + res.CQ0 + cond.Mu * res.CH0":
            "res.CPair = c.KInd * lambda_i * ct_val + c.MuZ * ct_val + res.CQ0 + c.Mu * res.CH0",
    }
    missing = []
    for token in required:
        if token not in src and aliases.get(token, "") not in src:
            missing.append(token)
    if missing:
        raise AssertionError("B4A source contract missing: " + " | ".join(missing))


def run_reference_matrix() -> tuple[int, float]:
    geom = zBET.DEFAULT_GEOMETRY
    trimmed_geom, pitch = zBET.trim_hover(
        geom,
        hover_trim_mode="collective",
        pitch_mode="constant",
        ct_hover_target=0.0065,
    )

    mus = [0.00, 0.05, 0.15, 0.25, 0.35]
    mu_z_values = [-0.02, -0.01, 0.00, 0.01, 0.02]
    models = ["uniform", "coleman_simple", "coleman_feingold", "drees"]
    profile_models = [
        "analytical_tangential",
        "analytical_vectorial",
        "numerical_vectorial",
    ]

    passed = 0
    max_momentum_residual = 0.0
    case_index = 0
    for mu in mus:
        for mu_z in mu_z_values:
            for model in models:
                profile = profile_models[case_index % len(profile_models)]
                case_index += 1
                out = zBET.coefficients(
                    mu=mu,
                    mu_z=mu_z,
                    pitch_input=pitch,
                    geometry=trimmed_geom,
                    model=model,
                    profile_drag_model=profile,
                    induced_torque_model="energy_balance",
                )
                for key in ("CT", "CQ", "CQi", "CQ0", "CH", "CY", "CMx", "CMy", "CPair", "lambda", "lambda_i"):
                    if not math.isfinite(out[key]):
                        raise AssertionError(f"non-finite {key} at mu={mu}, mu_z={mu_z}, model={model}")
                if out["lambda_i"] < 0.0:
                    raise AssertionError("negative induced inflow")
                if out["CT"] <= 0.0:
                    raise AssertionError("non-positive thrust in reference matrix")

                b = trimmed_geom.b_factor()
                momentum_ct = (
                    2.0
                    * b
                    * b
                    * out["lambda_i"]
                    * math.sqrt(mu * mu + out["lambda"] * out["lambda"])
                )
                residual = abs(out["CT"] - momentum_ct)
                max_momentum_residual = max(max_momentum_residual, residual)
                if residual > 2e-10:
                    raise AssertionError(
                        f"momentum closure residual={residual:.3e} at "
                        f"mu={mu}, mu_z={mu_z}, model={model}"
                    )
                passed += 1

    if passed != 100:
        raise AssertionError(f"expected exactly 100 reference cases, got {passed}")
    return passed, max_momentum_residual


def verify_presets() -> int:
    presets = [
        ("UH-60", 8.18, 258.0, 4, 0.53, 0.0070),
        ("Bell 206", 5.08, 394.0, 2, 0.33, 0.0055),
        ("Bo 105", 4.92, 424.0, 4, 0.27, 0.0060),
        ("R44", 5.03, 400.0, 2, 0.25, 0.0050),
        ("DJI Matrice", 0.27, 4800.0, 2, 0.035, 0.0110),
        ("eVTOL", 1.40, 1800.0, 5, 0.11, 0.0080),
    ]
    for name, radius, rpm, blades, chord, target_ct in presets:
        sol = zBET.resolve_solidity(
            "chords",
            radius=radius,
            chord_root=chord,
            chord_tip=chord,
            n_blades=blades,
        )
        geom = zBET.Geometry(rpm, radius, 5.73, 0.12, 0.009, sol)
        trimmed_geom, pitch = zBET.trim_hover(
            geom,
            hover_trim_mode="collective",
            pitch_mode="constant",
            ct_hover_target=target_ct,
        )
        out = zBET.coefficients(
            0.15,
            0.0,
            pitch,
            trimmed_geom,
            "coleman_feingold",
            profile_drag_model="numerical_vectorial",
        )
        if not (out["CT"] > 0.0 and out["CQ"] > 0.0 and out["lambda_i"] > 0.0):
            raise AssertionError(f"preset failed physical sanity: {name}")
    return len(presets)


def verify_axial_representations() -> None:
    geom = zBET.DEFAULT_GEOMETRY
    for mu in (0.05, 0.15, 0.30, 0.45):
        for alpha_deg in (-10.0, -5.0, 0.0, 5.0, 10.0):
            mu_z_alpha, _ = zBET.axial_condition(mu, alpha_deg, "alpha", geom)
            vz = mu_z_alpha * geom.vtip
            mu_z_vz, _ = zBET.axial_condition(mu, vz, "w", geom)
            mu_z_direct, _ = zBET.axial_condition(mu, mu_z_alpha, "mu_z", geom)
            if not math.isclose(mu_z_alpha, mu_z_vz, rel_tol=0.0, abs_tol=1e-14):
                raise AssertionError("alpha/Vz axial representations diverged")
            if not math.isclose(mu_z_alpha, mu_z_direct, rel_tol=0.0, abs_tol=1e-14):
                raise AssertionError("alpha/mu_z axial representations diverged")
    # Canonical sign: positive alpha => stream from below => negative imposed mu_z.
    mu_z_positive_alpha, _ = zBET.axial_condition(0.2, 5.0, "alpha", geom)
    if not mu_z_positive_alpha < 0.0:
        raise AssertionError("positive alpha must produce negative mu_z")


def main() -> None:
    print("=" * 72)
    print("RotorCalculator offline verification")
    print("=" * 72)
    verify_b4a_source_contract()
    print("PASS: B4A source contract")
    verify_axial_representations()
    print("PASS: alpha / Vz / mu_z representation equivalence")
    count, residual = run_reference_matrix()
    print(f"PASS: deterministic reference matrix {count}/100")
    print(f"PASS: max momentum-closure residual = {residual:.3e}")
    presets = verify_presets()
    print(f"PASS: preset sanity {presets}/{presets}")
    print("=" * 72)
    print("All offline engine/source verification gates passed.")


if __name__ == "__main__":
    main()
