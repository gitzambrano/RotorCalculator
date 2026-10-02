"""Exercise the web Conditions controls in a real Chromium browser.

Run against an already-running Vite dev server, normally:
    python tools/check_web_condition_flows.py --url http://127.0.0.1:8082/
"""
from __future__ import annotations

import argparse
import json
import math
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError, sync_playwright


PAIRS = {
    "RPM + Collective Δθ": ("rpm", "coll"),
    "RPM + Target CT": ("rpm", "CTtgt"),
    "RPM + Target Thrust": ("rpm", "Ttgt"),
    "Collective Δθ + Target CT": ("coll", "CTtgt"),
    "Collective Δθ + Target Thrust": ("coll", "Ttgt"),
    "Target CT + Target Thrust": ("CTtgt", "Ttgt"),
}


def check(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)
    print(f"PASS {message}")


def choose(page: Page, button: str, label: str) -> None:
    page.locator(button).click()
    page.locator("#modal-options-selector.open").wait_for()
    page.locator("#options-selector-list .option-item").filter(has_text=label).first.click()
    page.locator("#modal-options-selector.open").wait_for(state="detached")


def value(page: Page, selector: str) -> float:
    raw = page.locator(selector).input_value().strip().replace(",", ".")
    return float(raw)


def close_back(page: Page) -> None:
    page.evaluate("history.back()")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8082/")
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        context = browser.new_context(viewport={"width": 393, "height": 852}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
        page.on("console", lambda message: errors.append(f"console error: {message.text}") if message.type == "error" else None)
        page.goto(args.url, wait_until="networkidle")
        page.locator('.tab-btn[data-page="conditions"]').click()

        # All six operating pairs are selected through the actual picker and must
        # update the two canonical input keys.
        for label, keys in PAIRS.items():
            choose(page, "#btn-trim-mode", label)
            got = (page.locator("#lbl-operating-1").get_attribute("data-key"), page.locator("#lbl-operating-2").get_attribute("data-key"))
            check(got == keys, f"operating pair {label}: {got}")

        # Set a representable flow, make the trim invalid, and cycle every flow
        # representation. The converted values should preserve the same flow.
        page.locator("#inp-horiz-val").fill("0.15")
        page.locator("#inp-horiz-val").dispatch_event("input")
        choose(page, "#btn-toggle-axial-mode", "Axial Ratio μz")
        page.locator("#inp-axial-val").fill("0.04")
        page.locator("#inp-axial-val").dispatch_event("input")
        choose(page, "#btn-trim-mode", "Target CT + Target Thrust")
        page.locator("#inp-operating-1").fill("-1")
        page.locator("#inp-operating-1").dispatch_event("input")
        page.wait_for_timeout(250)
        check(float(page.evaluate("JSON.parse(localStorage.getItem('rotorcalc_active_cond')).targetCT")) < 0, "invalid-trim target is stored")

        choose(page, "#btn-toggle-horiz-mode", "Airspeed Vx")
        vx = value(page, "#inp-horiz-val")
        choose(page, "#btn-toggle-horiz-mode", "Advance Ratio μx")
        mu_back = value(page, "#inp-horiz-val")
        check(math.isfinite(vx) and vx > 10 and abs(mu_back - 0.15) < 0.003, f"invalid-trim μ↔Vx preserves flow (Vx={vx:.4g}, μ={mu_back:.4g})")

        choose(page, "#btn-toggle-axial-mode", "Climb Speed Vz")
        vz = value(page, "#inp-axial-val")
        choose(page, "#btn-toggle-axial-mode", "Axial Ratio μz")
        muz_back = value(page, "#inp-axial-val")
        check(math.isfinite(vz) and abs(muz_back - 0.04) < 0.001, f"invalid-trim μz↔Vz preserves flow (Vz={vz:.4g}, μz={muz_back:.4g})")

        choose(page, "#btn-toggle-axial-mode", "Angle of Attack α")
        alpha = value(page, "#inp-axial-val")
        choose(page, "#btn-toggle-axial-mode", "Axial Ratio μz")
        muz_alpha_back = value(page, "#inp-axial-val")
        check(math.isfinite(alpha) and abs(muz_alpha_back - 0.04) < 0.001, f"invalid-trim μz↔α preserves flow (α={alpha:.4g}°, μz={muz_alpha_back:.4g})")

        # Exercise every inflow and tip-loss option plus both PG states.
        for label in ("Uniform", "Coleman Simple", "Coleman-Feingold", "Drees"):
            choose(page, "#btn-inflow-model", label)
            check(label.split("-")[0] in page.locator("#btn-inflow-model").inner_text(), f"inflow selection {label}")
        page.locator('.tab-btn[data-page="geometry"]').click()
        for label, expected in (("None", "NONE"), ("Fixed B", "FIXED B"), ("Sissingh", "SISSINGH")):
            choose(page, "#btn-tiploss-mode", label)
            check(expected in page.locator("#btn-tiploss-mode").inner_text(), f"tip-loss selection {label}")
        choose(page, "#btn-compressibility", "Off")
        check(page.locator("#btn-compressibility").inner_text() == "OFF", "Prandtl-Glauert off")
        choose(page, "#btn-compressibility", "On (Prandtl-Glauert)")
        check("ON" in page.locator("#btn-compressibility").inner_text(), "Prandtl-Glauert on")

        # Reload must restore the saved page and condition session.
        page.locator('.tab-btn[data-page="conditions"]').click()
        page.locator('.tab-btn[data-page="results"]').click()
        page.wait_for_function("localStorage.getItem('rotor_current_page') === 'results'")
        saved_cond = page.evaluate("JSON.parse(localStorage.getItem('rotorcalc_active_cond'))")
        check(bool(saved_cond), "condition session is stored before reload")
        page.reload(wait_until="networkidle")
        check("active" in (page.locator("#page-results").get_attribute("class") or ""), "reload restores Results page")
        restored_cond = page.evaluate("JSON.parse(localStorage.getItem('rotorcalc_active_cond'))")
        check(restored_cond.get("operatingPair") == saved_cond.get("operatingPair") and restored_cond.get("inflowModel") == saved_cond.get("inflowModel"), "reload preserves operating pair and inflow")

        # Back closes the picker first while retaining Results, then traverses
        # Results -> Conditions -> Geometry.
        page.locator('button.result-label').first.click()
        page.locator("#modal-result-tooltip.open").wait_for()
        close_back(page)
        page.wait_for_function("!document.querySelector('#modal-result-tooltip').classList.contains('open')")
        check("active" in (page.locator("#page-results").get_attribute("class") or ""), "browser Back closes popup before changing page")
        close_back(page)
        page.wait_for_function("document.querySelector('#page-conditions').classList.contains('active')")
        check(True, "browser Back navigates Results → Conditions")
        close_back(page)
        page.wait_for_function("document.querySelector('#page-geometry').classList.contains('active')")
        check(True, "browser Back navigates Conditions → Geometry")

        check(not errors, "browser console/page has no errors: " + json.dumps(errors))
        browser.close()
    print("All requested web Conditions browser checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, PlaywrightTimeoutError) as error:
        print(f"FAIL {error}", file=sys.stderr)
        raise SystemExit(1)
