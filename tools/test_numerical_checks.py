import math
import subprocess
import json
from pathlib import Path

# Run Node to compute UH-60 hover with web engine
node_script = """
import { calculate, createDefaultGeometry, createDefaultCondition } from './web/src/engine.js';

const geom = createDefaultGeometry(); // UH-60
const cond = createDefaultCondition();
cond.operatingPair = 'rpm_ct';
cond.targetCT = 0.0065;

const res = calculate(geom, cond);
console.log(JSON.stringify({
    CT: res.CT,
    thrustN: res.thrustN,
    powerShaftKW: res.powerShaftKW,
    torqueNm: res.torqueNm,
    FoM: res.FoM,
    lambda: res.lambda,
    lambdaI: res.lambdaI,
    CQ0: res.CQ0,
    CQi: res.CQi,
    bFactor: res.bFactor,
    trimmedCollectiveDeg: res.trimmedCollectiveDeg,
    trimmedRPM: res.trimmedRPM
}));
"""

# Let's test via Playwright evaluate directly in browser on the live GitHub Pages site
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://gitzambrano.github.io/RotorCalculator/")
    
    # Extract calculated values directly from DOM for UH-60 default
    page.wait_for_selector(".app-shell")
    page.click('button[data-page="results"]')
    
    thrust_str = page.inner_text("#res-thrust")
    power_str = page.inner_text("#res-power")
    torque_str = page.inner_text("#res-torque")
    ct_str = page.inner_text("#res-ct")
    cq_str = page.inner_text("#res-cq")
    fom_str = page.inner_text("#res-fom")
    lambda_str = page.inner_text("#res-lambda")
    lambdai_str = page.inner_text("#res-lambdai")
    b_str = page.inner_text("#res-bfactor")
    coll_str = page.inner_text("#res-coll")
    rpm_str = page.inner_text("#res-rpm")
    
    print("=== LIVE GITHUB PAGES UH-60 HOVER OUTPUTS ===")
    print(f"Thrust: {thrust_str} N")
    print(f"Power: {power_str} kW")
    print(f"Torque: {torque_str} N.m")
    print(f"CT: {ct_str}")
    print(f"CQ: {cq_str}")
    print(f"Figure of Merit: {fom_str}")
    print(f"Lambda: {lambda_str}")
    print(f"Lambda_i: {lambdai_str}")
    print(f"B factor: {b_str}")
    print(f"Collective: {coll_str} deg")
    print(f"RPM: {rpm_str} rpm")
    
    # Sanity checks
    thrust = float(thrust_str.replace(",", ""))
    power = float(power_str.replace(",", ""))
    ct = float(ct_str)
    cq = float(cq_str)
    fom = float(fom_str)
    coll = float(coll_str)
    rpm = float(rpm_str)
    
    assert 80000 < thrust < 83000, f"Thrust out of bounds: {thrust}"
    assert 1400 < power < 1550, f"Power out of bounds: {power}"
    assert 0.0064 < ct < 0.0066, f"CT out of bounds: {ct}"
    assert 0.00045 < cq < 0.00060, f"CQ out of bounds: {cq}"
    assert 0.65 < fom < 0.85, f"FoM out of bounds: {fom}"
    assert 11.0 < coll < 14.0, f"Collective out of bounds: {coll}"
    assert 257 < rpm < 259, f"RPM out of bounds: {rpm}"
    
    print(">>> NUMERICAL INTEGRITY VALIDATED! <<<")
    browser.close()
