import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

OUT_DIR = Path("qa-results/parity-audit")
OUT_DIR.mkdir(parents=True, exist_ok=True)

INDEX_PATH = Path("docs/index.html").resolve()
INDEX_URL = f"file:///{INDEX_PATH.as_posix()}"

async def main():
    print(f"Loading web app from: {INDEX_URL}")
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # -------------------------------------------------------------
        # SUITE 1: Desktop Viewport (1920 x 1080)
        # -------------------------------------------------------------
        print("\n=== SUITE 1: Desktop (1920x1080) ===")
        desk_ctx = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await desk_ctx.new_page()
        await page.goto(INDEX_URL)
        await page.wait_for_selector(".app-shell")
        await page.wait_for_timeout(400)

        # Verify Desktop Width
        shell_box = await page.locator(".app-shell").bounding_box()
        print(f"Desktop .app-shell width: {shell_box['width']:.1f}px (target >= 1200px)")
        assert shell_box["width"] >= 1200, f"App shell too narrow on 1920px desktop: {shell_box['width']}"

        # Verify Geometry labels on Desktop are Level 0 (Full Name + Symbol)
        geom_labels = [await el.text_content() for el in await page.locator("#page-geometry .row-label-btn").all()]
        print("Sample Desktop Geometry Labels:", [lbl.encode("ascii", "replace").decode() for lbl in geom_labels[:5]])
        assert any("Nominal Rotor Speed" in lbl or "Rotor Speed" in lbl for lbl in geom_labels), "Expected full label for rpmNom"
        assert any("Rotor Radius" in lbl or "Radius" in lbl for lbl in geom_labels), "Expected full label for Radius"

        # Verify that all buttons strictly have white-space: nowrap
        first_btn = page.locator("#page-geometry .row-label-btn").first
        ws = await first_btn.evaluate("el => window.getComputedStyle(el).whiteSpace")
        assert ws == "nowrap", f"Expected white-space: nowrap, got {ws}"

        await page.screenshot(path=str(OUT_DIR / "01_desktop_geometry.png"))

        # Desktop Conditions
        await page.click('button[data-page="conditions"]')
        await page.wait_for_timeout(300)
        cond_labels = await page.locator("#page-conditions .row-label-btn").all_inner_texts()
        print("Sample Desktop Conditions Labels:", [lbl.encode("ascii", "replace").decode() for lbl in cond_labels[:5]])
        await page.screenshot(path=str(OUT_DIR / "02_desktop_conditions.png"))

        # Desktop Results
        await page.click('button[data-page="results"]')
        await page.wait_for_timeout(300)
        res_labels = [await el.text_content() for el in await page.locator("#page-results .result-label").all()]
        print("Sample Desktop Results Labels:", [lbl.encode("ascii", "replace").decode() for lbl in res_labels[:5]])
        assert any("Total Axial Speed" in lbl for lbl in res_labels), "Expected full label for Vztot on desktop"
        assert any("Thrust" in lbl for lbl in res_labels), "Expected full label for Thrust"
        await page.screenshot(path=str(OUT_DIR / "03_desktop_results.png"))

        # Desktop Settings Modal
        await page.click("#btn-main-menu")
        await page.wait_for_selector('#main-popup-menu:not([hidden])')
        await page.click('.popup-menu-item[data-action="settings"]')
        await page.wait_for_selector("#modal-settings.open")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "04_desktop_settings_modal.png"))
        await page.click('[data-close="modal-settings"]')
        await page.wait_for_timeout(200)

        # Desktop Parameter Sweep Modal
        await page.click("#btn-open-sweep")
        await page.wait_for_selector("#modal-sweep.open")
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT_DIR / "05_desktop_sweep_modal.png"))
        await page.click('[data-close="modal-sweep"]')
        await page.wait_for_timeout(200)

        # -------------------------------------------------------------
        # SUITE 2: Standard Mobile Viewport (393 x 852)
        # -------------------------------------------------------------
        print("\n=== SUITE 2: Mobile (393x852) ===")
        mob_ctx = await browser.new_context(
            viewport={"width": 393, "height": 852},
            has_touch=True,
            is_mobile=True,
        )
        mob_page = await mob_ctx.new_page()
        await mob_page.goto(INDEX_URL)
        await mob_page.wait_for_selector(".app-shell")
        await mob_page.wait_for_timeout(400)

        # Check mobile scroll width (zero horizontal overflow)
        scroll_w = await mob_page.evaluate("document.documentElement.scrollWidth")
        client_w = await mob_page.evaluate("document.documentElement.clientWidth")
        assert scroll_w <= client_w + 1, f"Horizontal overflow on mobile: scrollWidth={scroll_w}, clientWidth={client_w}"
        print(f"Mobile 393px width fits cleanly (scrollWidth={scroll_w}, clientWidth={client_w})")

        # Mobile Geometry
        await mob_page.screenshot(path=str(OUT_DIR / "06_mobile_geometry.png"))

        # Mobile Conditions
        await mob_page.click('button[data-page="conditions"]')
        await mob_page.wait_for_timeout(300)
        await mob_page.screenshot(path=str(OUT_DIR / "07_mobile_conditions.png"))

        # Mobile Results
        await mob_page.click('button[data-page="results"]')
        await mob_page.wait_for_timeout(300)
        await mob_page.screenshot(path=str(OUT_DIR / "08_mobile_results.png"))

        # Mobile Sweep Modal
        await mob_page.click("#btn-open-sweep")
        await mob_page.wait_for_selector("#modal-sweep.open")
        await mob_page.wait_for_timeout(500)
        await mob_page.screenshot(path=str(OUT_DIR / "09_mobile_sweep_modal.png"))
        await mob_page.click('[data-close="modal-sweep"]')
        await mob_page.wait_for_timeout(200)

        # Mobile Settings Modal
        await mob_page.click("#btn-main-menu")
        await mob_page.wait_for_selector('#main-popup-menu:not([hidden])')
        await mob_page.click('.popup-menu-item[data-action="settings"]')
        await mob_page.wait_for_selector("#modal-settings.open")
        await mob_page.wait_for_timeout(300)
        await mob_page.screenshot(path=str(OUT_DIR / "10_mobile_settings_modal.png"))
        await mob_page.click('[data-close="modal-settings"]')
        await mob_page.wait_for_timeout(200)

        # -------------------------------------------------------------
        # SUITE 3: Ultra-Compact Mobile Viewport (320 x 640)
        # -------------------------------------------------------------
        print("\n=== SUITE 3: Ultra-Compact Mobile (320x640) ===")
        comp_ctx = await browser.new_context(
            viewport={"width": 320, "height": 640},
            has_touch=True,
            is_mobile=True,
        )
        comp_page = await comp_ctx.new_page()
        await comp_page.goto(INDEX_URL)
        await comp_page.wait_for_selector(".app-shell")
        await comp_page.wait_for_timeout(400)

        comp_scroll_w = await comp_page.evaluate("document.documentElement.scrollWidth")
        comp_client_w = await comp_page.evaluate("document.documentElement.clientWidth")
        assert comp_scroll_w <= comp_client_w + 1, f"Horizontal overflow on 320px: scrollWidth={comp_scroll_w}"
        print(f"Compact 320px width fits cleanly (scrollWidth={comp_scroll_w})")
        await comp_page.screenshot(path=str(OUT_DIR / "11_compact_320_geometry.png"))

        await comp_page.click('button[data-page="results"]')
        await comp_page.wait_for_timeout(300)
        await comp_page.screenshot(path=str(OUT_DIR / "12_compact_320_results.png"))

        await browser.close()
        print("\nAll Playwright visual & parity checks passed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
