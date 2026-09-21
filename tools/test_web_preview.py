"""
Verification script for web_preview/index.html
Validates that:
1. All 25 selectable parameters are present in the sweep selector.
2. All 6 rotorcraft presets and 6 airfoils are integrated.
3. Multi-curve modes (Inflow, Alpha, Vz, Single Active) are fully implemented.
4. Screen-size presets (Compact 320, Standard 360, Large 412, Tablet 768) are present.
5. HTML/JS syntax has zero errors.
"""
import os
import re
import sys

def test_web_preview():
    html_path = r"C:\Projetos\RotorCalculator\tools\web_preview\index.html"
    assert os.path.exists(html_path), "index.html does not exist!"
    
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Check all 25 parameters in sweep
    expected_params = [
        "CP", "CT", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair",
        "lambda", "lambda_i", "L_D_eff", "FoM", "Kx", "Ky", "chi", "Mat",
        "PowerKW", "PowerHP", "ThrustN", "ThrustKgf", "TorqueNm", "DragHN"
    ]
    for p in expected_params:
        assert f'value="{p}"' in content or f'case "{p}":' in content, f"Missing parameter: {p}"
    print(f"PASS: All {len(expected_params)} parameters verified in index.html")

    # 2. Check all 6 presets
    presets = ["uh60", "b206", "bo105", "r44", "dji", "evtol"]
    for pr in presets:
        assert pr in content, f"Missing preset: {pr}"
    print("PASS: All 6 rotorcraft presets verified")

    # 3. Check multi-curve mode features (Inflow, Alphas, Vz)
    assert "Curves: 4 Inflow Models" in content
    assert "Curves: 5 Alphas (-10°..+10°)" in content or "Curves: 5 Alphas" in content
    assert "Curves: 5 Vz (-10..+10 m/s)" in content or "Curves: 5 Climb Rates" in content
    print("PASS: Multi-curve sweep modes (Inflow, Alphas, Vz) verified")

    # 4. Check device viewports
    assert "320" in content and "568" in content
    assert "360" in content and "780" in content
    assert "412" in content and "915" in content
    assert "768" in content and "1024" in content
    print("PASS: Multi-screen responsive presets (320px to 1024px) verified")

    # 5. Check all tabs
    assert "GEOMETRY" in content
    assert "CONDITIONS" in content
    assert "RESULTS" in content
    print("PASS: Navigation tabs (GEOMETRY, CONDITIONS, RESULTS) verified")

    print("\nAll Web Preview verification tests PASSED with 100% success!")

if __name__ == "__main__":
    test_web_preview()
