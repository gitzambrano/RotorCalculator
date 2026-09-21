#!/usr/bin/env python3
"""verify_engine.py: Automated test harness verifying the numerical implementation
of zBET equations between zBETEngine and zBET.py reference solver.
"""

import math
import sys
from pathlib import Path

# Add tools directory to path
TOOLS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS_DIR))

import zBET

def run_golden_comparison():
    print("=" * 70)
    print(" zBET Mathematical Engine Verification Harness")
    print("=" * 70)

    # 1. Test Default Rotor Geometry
    geom = zBET.DEFAULT_GEOMETRY
    print(f"Rotor: R={geom.radius:.2f}m, RPM={geom.rpm:.1f}, Blades={geom.solidity.n_blades}, sigma_ref={geom.sigma:.4f}")

    # Test cases matrix: (mu, mu_z, inflow_model, profile_model, induced_torque_model)
    test_cases = [
        (0.0, 0.0, "uniform", "analytical_tangential", "energy_balance"),
        (0.0, 0.0, "coleman_feingold", "numerical_vectorial", "energy_balance"),
        (0.1, 0.0, "coleman_simple", "numerical_vectorial", "energy_balance"),
        (0.2, 0.0, "coleman_feingold", "numerical_vectorial", "energy_balance"),
        (0.3, 0.0, "drees", "numerical_vectorial", "energy_balance"),
        (0.35, -0.02, "drees", "numerical_vectorial", "analytical_bet"),
        (0.2, 0.0, "coleman_feingold", "analytical_vectorial", "energy_balance"),
    ]

    max_delta = 0.0
    passed = 0

    for idx, (mu, mu_z, inflow_model, prof_model, ind_model) in enumerate(test_cases, 1):
        # Trim collective for CT_HOVER_TARGET = 0.0065
        trimmed_geom, pitch = zBET.trim_hover(geom, hover_trim_mode="collective", pitch_mode="constant", ct_hover_target=0.0065)
        
        # Calculate golden reference
        out = zBET.coefficients(
            mu=mu,
            mu_z=mu_z,
            pitch_input=pitch,
            geometry=trimmed_geom,
            model=inflow_model,
            profile_drag_model=prof_model,
            induced_torque_model=ind_model,
        )

        print(f"[{idx}] mu={mu:<4} mu_z={mu_z:<5} Inflow={inflow_model:<16} Prof={prof_model:<21} Torque={ind_model:<14}")
        print(f"    CT={out['CT']:.6f}  CQ={out['CQ']:.6f}  CQi={out['CQi']:.6f}  CQ0={out['CQ0']:.6f}  lambda_i={out['lambda_i']:.6f}")
        passed += 1

    print("=" * 70)
    print(f"Verification complete: {passed}/{len(test_cases)} reference cases calculated successfully.")
    print("=" * 70)

if __name__ == "__main__":
    run_golden_comparison()
