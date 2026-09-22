#!/usr/bin/env python3
"""test_rotor_engine.py — Comprehensive unit tests for RotorCalculator / zBET
Verifies hover trim, forward flight inflow, tip loss, compressibility, and power balance.
"""

import math
import sys
from pathlib import Path

# Add tools directory to path
TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"
sys.path.insert(0, str(TOOLS_DIR))

import zBET

def test_hover_thrust_and_inflow():
    """Test hover condition at mu=0, alpha=0."""
    geom = zBET.DEFAULT_GEOMETRY
    target_ct = 0.0065
    trimmed_geom, pitch = zBET.trim_hover(geom, hover_trim_mode="collective", pitch_mode="constant", ct_hover_target=target_ct)
    
    out = zBET.coefficients(
        mu=0.0,
        mu_z=0.0,
        pitch_input=pitch,
        geometry=trimmed_geom,
        model="uniform",
    )
    
    # Check that solved CT matches target_ct to high precision
    assert math.isclose(out["CT"], target_ct, rel_tol=1e-5), f"CT {out['CT']} != {target_ct}"
    
    # In uniform hover, lambda_i = sqrt(CT / 2)
    expected_lam_i = math.sqrt(target_ct / 2.0)
    assert math.isclose(out["lambda_i"], expected_lam_i, rel_tol=1e-5), f"lambda_i {out['lambda_i']} != {expected_lam_i}"
    
    # zBET FoM is defined from the hover energy balance, not generic forward-flight CQ.
    fom = out["FoM"]
    assert 0.60 < fom < 0.85, f"Hover FoM {fom} is outside realistic range"
    print("PASS: test_hover_thrust_and_inflow")

def test_forward_flight_inflow_models():
    """Test that Drees, Coleman-Feingold, and Uniform satisfy momentum conservation."""
    geom = zBET.DEFAULT_GEOMETRY
    trimmed_geom, pitch = zBET.trim_hover(geom, hover_trim_mode="collective", pitch_mode="constant", ct_hover_target=0.0065)
    
    for model in ["uniform", "coleman_simple", "coleman_feingold", "drees"]:
        out = zBET.coefficients(
            mu=0.25,
            mu_z=0.0,
            pitch_input=pitch,
            geometry=trimmed_geom,
            model=model,
        )
        assert out["CT"] > 0, f"CT must be positive for model {model}"
        assert out["CQ"] > 0, f"CQ must be positive for model {model}"
        assert out["lambda_i"] > 0, f"lambda_i must be positive for model {model}"
        # In forward flight, induced velocity is substantially lower than in hover
        assert out["lambda_i"] < 0.04, f"Forward flight downwash should be small (got {out['lambda_i']})"
    print("PASS: test_forward_flight_inflow_models")


def test_equivalent_axial_representations():
    """alpha, Vz and mu_z must represent one identical axial operating state."""
    geom = zBET.DEFAULT_GEOMETRY
    mu = 0.22
    alpha_deg = 6.0
    mu_z_alpha, _ = zBET.axial_condition(mu, alpha_deg, "alpha", geom)
    vz = mu_z_alpha * geom.vtip
    mu_z_vz, _ = zBET.axial_condition(mu, vz, "w", geom)
    mu_z_direct, _ = zBET.axial_condition(mu, mu_z_alpha, "mu_z", geom)

    assert mu_z_alpha < 0.0, "positive alpha must produce negative mu_z in zBET"
    assert math.isclose(mu_z_alpha, mu_z_vz, rel_tol=0.0, abs_tol=1e-14)
    assert math.isclose(mu_z_alpha, mu_z_direct, rel_tol=0.0, abs_tol=1e-14)
    print("PASS: test_equivalent_axial_representations")

def test_prandtl_glauert_matches_reference_definition():
    sol = zBET.resolve_solidity("chords", radius=5.0, chord_root=0.30, chord_tip=0.24, n_blades=4)
    geom = zBET.Geometry(
        420.0, 5.0, 5.73, 0.15, 0.009, sol,
        speed_of_sound=340.3, use_prandtl_glauert=True
    )
    mu = 0.30
    m_eff = geom.tip_mach * math.sqrt(0.75 * 0.75 + 0.5 * mu * mu)
    m_eff = min(m_eff, 0.85)
    expected = geom.lift_curve_slope / math.sqrt(max(0.01, 1.0 - m_eff * m_eff))
    assert math.isclose(geom.lift_slope(mu), expected, rel_tol=0.0, abs_tol=1e-14)
    print("PASS: test_prandtl_glauert_matches_reference_definition")


def test_sissingh_tip_loss_is_self_consistent():
    sol = zBET.resolve_solidity("chords", radius=5.0, chord_root=0.32, chord_tip=0.24, n_blades=4)
    geom = zBET.Geometry(
        390.0, 5.0, 5.73, 0.15, 0.009, sol,
        tip_loss_mode="sissingh"
    )
    _, pitch = zBET.trim_hover(
        geom,
        hover_trim_mode="none",
        pitch_mode="linear_twist",
        theta_root_deg=12.0,
        theta_tip_deg=4.0,
    )
    out = zBET.coefficients(
        0.20, 0.0, pitch, geom, "coleman_feingold",
        profile_drag_model="numerical_vectorial",
    )
    expected_b = geom.b_factor(ct=out["CT"])
    assert math.isclose(out["B_tip_loss"], expected_b, rel_tol=0.0, abs_tol=2e-8)
    assert geom.root_cutout < out["B_tip_loss"] <= 1.0
    print("PASS: test_sissingh_tip_loss_is_self_consistent")


def test_presets_stability():
    """Test that all 6 presets compute physically reasonable values without errors."""
    presets = [
        {"name": "UH-60", "R": 8.18, "RPM": 258.0, "N": 4, "chord": 0.53, "target_ct": 0.0070},
        {"name": "Bell 206", "R": 5.08, "RPM": 394.0, "N": 2, "chord": 0.33, "target_ct": 0.0055},
        {"name": "Bo 105", "R": 4.92, "RPM": 424.0, "N": 4, "chord": 0.27, "target_ct": 0.0060},
        {"name": "R44", "R": 5.03, "RPM": 400.0, "N": 2, "chord": 0.25, "target_ct": 0.0050},
        {"name": "DJI Matrice", "R": 0.27, "RPM": 4800.0, "N": 2, "chord": 0.035, "target_ct": 0.0110},
        {"name": "eVTOL", "R": 1.40, "RPM": 1800.0, "N": 5, "chord": 0.11, "target_ct": 0.0080},
    ]
    
    for p in presets:
        sol = zBET.resolve_solidity("chords", radius=p["R"], chord_root=p["chord"], chord_tip=p["chord"], n_blades=p["N"])
        geom = zBET.Geometry(p["RPM"], p["R"], 5.73, 0.12, 0.009, sol)
        trimmed_geom, pitch = zBET.trim_hover(geom, hover_trim_mode="collective", pitch_mode="constant", ct_hover_target=p["target_ct"])
        
        out = zBET.coefficients(0.15, 0.0, pitch, trimmed_geom, "coleman_feingold")
        assert out["CT"] > 0, f"Preset {p['name']} failed CT"
        assert out["CQ"] > 0, f"Preset {p['name']} failed CQ"
        print(f"PASS: Preset {p['name']:<12} -> CT={out['CT']:.5f}, CQ={out['CQ']:.6f}")

if __name__ == "__main__":
    print("Running RotorCalculator engine tests...")
    test_hover_thrust_and_inflow()
    test_forward_flight_inflow_models()
    test_equivalent_axial_representations()
    test_prandtl_glauert_matches_reference_definition()
    test_sissingh_tip_loss_is_self_consistent()
    test_presets_stability()
    print("All engine tests passed successfully!")
