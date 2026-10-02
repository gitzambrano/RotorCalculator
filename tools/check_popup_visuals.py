"""Capture mobile web popup states for visual comparison with APK captures."""
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path("output/playwright")
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = os.environ.get("ROTOR_WEB_BASE_URL", "http://127.0.0.1:8080")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 393, "height": 852}, device_scale_factor=1)
    page.goto(BASE_URL, wait_until="networkidle")
    page.evaluate("localStorage.setItem('rotor_theme', 'dark')")
    page.reload(wait_until="networkidle")

    def settle():
        page.wait_for_timeout(700)

    page.locator("#btn-main-menu").click()
    settle()
    page.screenshot(path=str(OUT / "dark-393-menu-web.png"))
    page.locator('[data-action="units"]').click()
    settle()
    print("converter rect", page.locator("#modal-unit-converter .modal-card").evaluate("el => el.getBoundingClientRect().toJSON()"))
    page.screenshot(path=str(OUT / "dark-393-converter-web.png"))
    page.locator('[data-close="modal-unit-converter"]').click()
    settle()

    page.locator("#btn-main-menu").click()
    settle()
    page.locator('[data-action="help"]').click()
    settle()
    page.screenshot(path=str(OUT / "dark-393-manual-web.png"))
    page.locator('[data-close="modal-help"]').click()
    settle()

    page.locator("[data-page='conditions']").click()
    settle()
    page.locator("#btn-main-menu").click()
    settle()
    page.locator('[data-action="settings"]').click()
    settle()
    page.screenshot(path=str(OUT / "dark-393-settings-web.png"))
    page.locator('[data-close="modal-settings"]').click()
    settle()

    page.locator("#btn-inflow-model").click()
    settle()
    page.screenshot(path=str(OUT / "dark-393-picker-web.png"))
    page.locator('#modal-options-selector .modal-close-btn').click()
    settle()
    page.locator('.row-label-btn[data-key="h"]').click()
    settle()
    page.screenshot(path=str(OUT / "dark-393-altitude-help-web.png"))
    browser.close()

