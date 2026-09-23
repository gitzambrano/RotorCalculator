#!/usr/bin/env python3
"""Numerical reference tests for RotorCalculator / tools/zBET.py."""

import math
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))

import zBET


def make_geometry(*, rpm=420.0, radius=5.0, blades=4, c0=0.30, c1=0.22,
                  x0=0.15, pg=False, tip_loss="fixed"):
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


def test_reference_planform_metrics_ignore_root_cutout_for_reference_area():
    radius = 5.0
    blades = 4
    c0 = 0.30
    c1 = 0.20
    expected_integral = 0.5 * (c0 + c1)
    expected_sigma_ref = blades * expected_integral / (math.pi * radius)
    expected_ar = radius / expected_integral

    for x0 in (0.0, 0.10, 0.20, 0.35):
        sol = zBET.resolve_solidity(
            "chords",
            radius=radius,
            chord_root=c0,
            chord_tip=c1,
            n_blades=blades,
            root_cutout=x0,
        )
        assert math.isclose(sol.sigma_ref, expected_sigma_ref, rel_tol=0, abs_tol=1e-14)
        assert math.isclose(radius / expected_integral, expected_ar, rel_tol=0, abs_tol=1e-14)
        expected_geom = blades / (math.pi * radius) * (
            c0 * (1.0 - x0)
            + 0.5 * (c1 - c0) * (1.0 - x0 * x0)
        )
        assert math.isclose(sol.sigma_geom, expected_geom, rel_tol=0, abs_tol=1e-14)
    print("PASS: reference planform metrics")


def test_radius_scaling_preserves_sigma_ar_and_taper():
    radius1 = 5.0
    radius2 = 7.5
    scale = radius2 / radius1
    c0, c1 = 0.30, 0.18
    blades = 4

    s1 = zBET.resolve_solidity(
        "chords", radius=radius1, chord_root=c0, chord_tip=c1,
        n_blades=blades, root_cutout=0.15
    )
    s2 = zBET.resolve_solidity(
        "chords", radius=radius2, chord_root=c0 * scale, chord_tip=c1 * scale,
        n_blades=blades, root_cutout=0.15
    )

    ar1 = 2.0 * radius1 / (c0 + c1)
    ar2 = 2.0 * radius2 / ((c0 + c1) * scale)
    assert math.isclose(s1.sigma_ref, s2.sigma_ref, rel_tol=0, abs_tol=1e-14)
    assert math.isclose(ar1, ar2, rel_tol=0, abs_tol=1e-14)
    assert math.isclose(c1 / c0, (c1 * scale) / (c0 * scale), rel_tol=0, abs_tol=1e-14)
    print("PASS: radius scaling invariants")


def test_equivalent_axial_representations_and_signs():
    geom = make_geometry()
    mu = 0.22
    alpha_deg = 6.0
    mu_z_alpha, _ = zBET.axial_condition(mu, alpha_deg, "alpha", geom)
    vz = mu_z_alpha * geom.vtip
    mu_z_vz, _ = zBET.axial_condition(mu, vz, "w", geom)
    mu_z_direct, _ = zBET.axial_condition(mu, mu_z_alpha, "mu_z", geom)

    assert mu_z_alpha < 0.0, "positive alpha (wind from below) must give negative mu_z"
    assert math.isclose(mu_z_alpha, mu_z_vz, rel_tol=0, abs_tol=1e-14)
    assert math.isclose(mu_z_alpha, mu_z_direct, rel_tol=0, abs_tol=1e-14)

    positive_climb_vz = 8.0
    mu_z_climb, _ = zBET.axial_condition(mu, positive_climb_vz, "w", geom)
    assert mu_z_climb > 0.0, "positive climb Vz must give positive downward relative-flow ratio"
    print("PASS: axial representations and signs")


def test_known_operating_state_and_all_six_pairs():
    """Generate one valid forward/climb state, then reconstruct it from every pair."""
    geom = make_geometry(rpm=430.0, pg=True, tip_loss="fixed")
    known_rpm = 430.0
    known_collective = 4.0
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

    cases = {
        "rpm_collective": dict(rpm=known_rpm, collective_deg=known_collective),
        "rpm_ct": dict(rpm=known_rpm, collective_deg=0.0),
        "rpm_thrust": dict(rpm=known_rpm, collective_deg=0.0),
        "collective_ct": dict(rpm=300.0, collective_deg=known_collective),
        "collective_thrust": dict(rpm=300.0, collective_deg=known_collective),
        "ct_thrust": dict(rpm=300.0, collective_deg=0.0),
    }

    for pair, seeds in cases.items():
        solved = zBET.solve_operating_pair(
            geom,
            pair=pair,
            rpm=seeds["rpm"],
            collective_deg=seeds["collective_deg"],
            target_ct=target_ct,
            target_thrust_n=target_thrust,
            **common,
        )
        assert math.isclose(solved["CT"], target_ct, rel_tol=2e-5, abs_tol=2e-8), pair
        assert math.isclose(solved["T_N"], target_thrust, rel_tol=2e-5, abs_tol=1e-3), pair
        assert math.isclose(solved["rpm"], known_rpm, rel_tol=2e-4, abs_tol=0.1), pair
        assert math.isclose(
            solved["collective_deg"], known_collective, rel_tol=0, abs_tol=2e-3
        ), pair
        # Vx/Vz dimensional inputs must remain fixed while mu/mu_z track solved RPM.
        assert math.isclose(solved["Vx_m_s"], 45.0, rel_tol=0, abs_tol=1e-10)
        assert math.isclose(solved["Vz_m_s"], 3.0, rel_tol=0, abs_tol=1e-10)
    print("PASS: all six operating pairs")


def test_collective_delta_preserves_twist():
    geom = make_geometry()
    pitch0 = zBET._operating_pitch(geom, 12.0, 2.0, 0.0)
    pitch5 = zBET._operating_pitch(geom, 12.0, 2.0, 5.0)
    twist0 = pitch0.theta_tip - pitch0.theta_root
    twist5 = pitch5.theta_tip - pitch5.theta_root
    assert math.isclose(twist0, twist5, rel_tol=0, abs_tol=1e-15)
    assert math.isclose(
        pitch5.theta_root - pitch0.theta_root, math.radians(5.0), rel_tol=0, abs_tol=1e-15
    )
    assert math.isclose(
        pitch5.theta_tip - pitch0.theta_tip, math.radians(5.0), rel_tol=0, abs_tol=1e-15
    )
    print("PASS: collective delta preserves twist")


def test_forward_flight_inflow_models():
    geom = make_geometry()
    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    for model in ["uniform", "coleman_simple", "coleman_feingold", "drees"]:
        out = zBET.coefficients(
            mu=0.25,
            mu_z=0.0,
            pitch_input=pitch,
            geometry=geom,
            model=model,
            profile_drag_model="numerical_vectorial",
        )
        assert out["CT"] > 0
        assert out["CQ"] > 0
        assert out["lambda_i"] > 0
    print("PASS: inflow models")


def test_prandtl_glauert_matches_reference_definition():
    geom = make_geometry(pg=True)
    mu = 0.30
    m_eff = geom.tip_mach * math.sqrt(0.75 * 0.75 + 0.5 * mu * mu)
    m_eff = min(m_eff, 0.85)
    expected = geom.lift_curve_slope / math.sqrt(max(0.01, 1.0 - m_eff * m_eff))
    assert math.isclose(geom.lift_slope(mu), expected, rel_tol=0, abs_tol=1e-14)
    print("PASS: Prandtl-Glauert")


def test_sissingh_tip_loss_is_self_consistent():
    geom = make_geometry(tip_loss="sissingh")
    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    out = zBET.coefficients(
        0.20,
        0.0,
        pitch,
        geom,
        "coleman_feingold",
        profile_drag_model="numerical_vectorial",
    )
    expected_b = geom.b_factor(ct=out["CT"])
    assert math.isclose(out["B_tip_loss"], expected_b, rel_tol=0, abs_tol=2e-8)
    assert geom.root_cutout < out["B_tip_loss"] <= 1.0
    print("PASS: Sissingh consistency")


def test_numerical_vectorial_profile_drag_is_finite():
    geom = make_geometry()
    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    for mu in (0.0, 0.1, 0.3, 0.5):
        for mu_z in (-0.05, 0.0, 0.05):
            out = zBET.coefficients(
                mu,
                mu_z,
                pitch,
                geom,
                "coleman_feingold",
                profile_drag_model="numerical_vectorial",
                k_ind=1.15,
            )
            for key in ("CQ0", "CH0", "CQ", "CH", "CPair"):
                assert math.isfinite(out[key]), (mu, mu_z, key)
    print("PASS: numerical-vectorial profile drag")


def test_fom_matches_kind_energy_balance():
    geom = make_geometry()
    pitch = zBET._operating_pitch(geom, 12.0, 2.0, 4.0)
    out = zBET.coefficients(
        0.0, 0.0, pitch, geom, "uniform",
        profile_drag_model="numerical_vectorial", k_ind=1.15
    )
    ideal = out["CT"] ** 1.5 / math.sqrt(2.0)
    expected = ideal / (1.15 * ideal + out["CQ0"])
    assert math.isclose(out["FoM"], expected, rel_tol=0, abs_tol=1e-13)
    print("PASS: FoM / Kind")


if __name__ == "__main__":
    print("Running RotorCalculator reference tests...")
    test_reference_planform_metrics_ignore_root_cutout_for_reference_area()
    test_radius_scaling_preserves_sigma_ar_and_taper()
    test_equivalent_axial_representations_and_signs()
    test_known_operating_state_and_all_six_pairs()
    test_collective_delta_preserves_twist()
    test_forward_flight_inflow_models()
    test_prandtl_glauert_matches_reference_definition()
    test_sissingh_tip_loss_is_self_consistent()
    test_numerical_vectorial_profile_drag_is_finite()
    test_fom_matches_kind_energy_balance()
    print("All RotorCalculator reference tests passed.")
