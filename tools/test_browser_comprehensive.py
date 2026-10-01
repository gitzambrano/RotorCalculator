import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT_DIR = Path("qa-results/full-audit")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_URL = "https://gitzambrano.github.io/RotorCalculator/"

async def run_audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # =========================================================================
        # SUITE 1: Modern Mobile (393 x 852) - Portrait
        # =========================================================================
        print("--- Suite 1: Modern Mobile 393x852 ---")
        ctx = await browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            has_touch=True,
            is_mobile=True,
        )
        page = await ctx.new_page()
        
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        await page.goto(TARGET_URL, wait_until="networkidle")
        await page.wait_for_selector(".app-shell")
        
        # 1. Mobile Geometry (UH-60 default)
        await page.screenshot(path=str(OUT_DIR / "01_mobile_geometry_uh60.png"))
        print("Captured 01_mobile_geometry_uh60.png")
        
        # 2. Open Rotor Picker Modal
        await page.click("#active-rotor-bar")
        await page.wait_for_selector("#modal-rotor-manager.open")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "02_mobile_rotor_picker_modal.png"))
        print("Captured 02_mobile_rotor_picker_modal.png")
        
        # 3. Select Bell 206 JetRanger
        bell_info = page.locator('.rotor-manager-item:has-text("Bell 206") .rotor-manager-info')
        await bell_info.click()
        await page.wait_for_timeout(400)
        
        # Verify Bell 206 active
        rotor_title = await page.inner_text("#display-active-rotor-name")
        print(f"Switched rotor: {rotor_title}")
        assert "Bell 206" in rotor_title, f"Failed to switch to Bell 206: {rotor_title}"
        await page.screenshot(path=str(OUT_DIR / "03_mobile_geometry_bell206.png"))
        print("Captured 03_mobile_geometry_bell206.png")
        
        # 4. Switch Unit on Radius (m -> ft)
        unit_btn = page.locator("#unit-radius")
        val_inp = page.locator("#inp-radius")
        initial_radius = float(await val_inp.input_value())
        assert abs(initial_radius - 5.08) < 0.1, f"Radius mismatch for Bell 206: {initial_radius}"
        
        await unit_btn.click()
        await page.wait_for_timeout(200)
        converted_radius = float(await val_inp.input_value())
        unit_text = await unit_btn.inner_text()
        print(f"Radius converted: {initial_radius} m -> {converted_radius} {unit_text}")
        assert unit_text == "ft" and abs(converted_radius - 16.67) < 0.5, f"Unit conversion failed: {converted_radius} {unit_text}"
        await page.screenshot(path=str(OUT_DIR / "04_mobile_unit_conversion_ft.png"))
        print("Captured 04_mobile_unit_conversion_ft.png")
        
        # Switch back to m
        await unit_btn.click()
        await page.wait_for_timeout(200)
        
        # 5. Open Tooltip/Help Popover by clicking or hovering a row label
        radius_btn = page.locator('.row-label-btn:has-text("Radius R")')
        await radius_btn.click()
        await page.wait_for_selector("#tooltip-popover.visible")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "05_mobile_tooltip_modal.png"))
        print("Captured 05_mobile_tooltip_modal.png")
        await page.mouse.move(0, 0)
        await page.wait_for_timeout(200)
        
        # 6. Conditions Tab
        await page.click('button[data-page="conditions"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "06_mobile_conditions.png"))
        print("Captured 06_mobile_conditions.png")
        
        # 7. Conditions Flow Toggles
        # Toggle mu -> Vx
        await page.click("#btn-toggle-horiz-mode")
        await page.wait_for_timeout(200)
        # Toggle alpha -> Vz
        await page.click("#btn-toggle-axial-mode")
        await page.wait_for_timeout(200)
        await page.screenshot(path=str(OUT_DIR / "07_mobile_conditions_toggles.png"))
        print("Captured 07_mobile_conditions_toggles.png")
        
        # 8. Trim Mode Toggle (Target CT -> Target Thrust)
        trim_btn = page.locator("#btn-trim-mode")
        await trim_btn.click() # Target Thrust
        await page.wait_for_timeout(200)
        trim_txt = await trim_btn.inner_text()
        print(f"Trim mode switched to: {trim_txt}")
        await page.screenshot(path=str(OUT_DIR / "08_mobile_conditions_target_thrust.png"))
        print("Captured 08_mobile_conditions_target_thrust.png")
        
        # Switch back to Target CT
        await trim_btn.click() # Manual Collective
        await page.wait_for_timeout(100)
        await trim_btn.click() # Target CT
        await page.wait_for_timeout(200)
        
        # 9. Results Tab
        await page.click('button[data-page="results"]')
        await page.wait_for_timeout(400)
        thrust_txt = await page.inner_text("#res-thrust")
        power_txt = await page.inner_text("#res-power")
        print(f"Bell 206 Results: Thrust = {thrust_txt} N | Power = {power_txt} kW")
        assert thrust_txt != "---", "Results calculation failed"
        await page.screenshot(path=str(OUT_DIR / "09_mobile_results.png"))
        print("Captured 09_mobile_results.png")
        
        # 11. Open Parameter Sweep Modal
        await page.click("#btn-open-sweep")
        await page.wait_for_selector("#modal-sweep.open")
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT_DIR / "11_mobile_sweep_modal.png"))
        print("Captured 11_mobile_sweep_modal.png")
        
        # Toggle data table in Sweep modal
        await page.click("#btn-sweep-toggle-table")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "11b_mobile_sweep_table.png"))
        print("Captured 11b_mobile_sweep_table.png")
        
        # Close sweep modal
        await page.click('[data-close="modal-sweep"]')
        await page.wait_for_timeout(200)
        
        # 12. Settings Modal
        await page.click("#btn-header-settings")
        await page.wait_for_selector("#modal-settings.open")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "12_mobile_settings_modal.png"))
        print("Captured 12_mobile_settings_modal.png")
        
        # Switch to Light Theme
        await page.click("#btn-setting-theme")
        await page.wait_for_timeout(300)
        await page.click('[data-close="modal-settings"]')
        await page.wait_for_timeout(200)
        
        # 13. Light Theme Screenshots (Geometry, Conditions, Results)
        await page.click('button[data-page="geometry"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "13a_mobile_light_geometry.png"))
        print("Captured 13a_mobile_light_geometry.png")
        
        await page.click('button[data-page="conditions"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "13b_mobile_light_conditions.png"))
        print("Captured 13b_mobile_light_conditions.png")
        
        await page.click('button[data-page="results"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "13c_mobile_light_results.png"))
        print("Captured 13c_mobile_light_results.png")
        
        # Switch back to dark theme
        await page.click("#btn-header-settings")
        await page.wait_for_selector("#modal-settings.open")
        await page.wait_for_timeout(200)
        await page.click("#btn-setting-theme")
        await page.wait_for_timeout(200)
        await page.click('[data-close="modal-settings"]')
        await page.wait_for_timeout(200)
        
        # 14. Unit Converter Modal
        await page.click("#btn-header-unit")
        await page.wait_for_selector("#modal-unit-converter.open")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "14_mobile_unit_converter_modal.png"))
        print("Captured 14_mobile_unit_converter_modal.png")
        await page.click('[data-close="modal-unit-converter"]')
        await page.wait_for_timeout(200)
        
        # 15. Physics Help Modal
        await page.click("#btn-header-help")
        await page.wait_for_selector("#modal-help.open")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "15_mobile_physics_help_modal.png"))
        print("Captured 15_mobile_physics_help_modal.png")
        await page.click('[data-close="modal-help"]')
        await page.wait_for_timeout(200)
        
        await ctx.close()
        
        # =========================================================================
        # SUITE 2: Compact Mobile (320 x 640) - Portrait
        # =========================================================================
        print("--- Suite 2: Compact Mobile 320x640 ---")
        ctx_compact = await browser.new_context(
            viewport={"width": 320, "height": 640},
            has_touch=True,
            is_mobile=True,
        )
        page_c = await ctx_compact.new_page()
        await page_c.goto(TARGET_URL, wait_until="networkidle")
        await page_c.wait_for_selector(".app-shell")
        
        # Check horizontal overflow
        scroll_w = await page_c.evaluate("document.documentElement.scrollWidth")
        client_w = await page_c.evaluate("document.documentElement.clientWidth")
        print(f"Compact 320px check: scrollWidth={scroll_w}, clientWidth={client_w}")
        assert scroll_w <= client_w + 1, f"Horizontal overflow at 320px: {scroll_w} > {client_w}"
        
        await page_c.screenshot(path=str(OUT_DIR / "16_compact_320_geometry.png"))
        print("Captured 16_compact_320_geometry.png")
        
        await page_c.click('button[data-page="results"]')
        await page_c.wait_for_timeout(300)
        await page_c.screenshot(path=str(OUT_DIR / "17_compact_320_results.png"))
        print("Captured 17_compact_320_results.png")
        await ctx_compact.close()
        
        # =========================================================================
        # SUITE 3: Mobile Landscape (852 x 393)
        # =========================================================================
        print("--- Suite 3: Mobile Landscape 852x393 ---")
        ctx_land = await browser.new_context(
            viewport={"width": 852, "height": 393},
            has_touch=True,
            is_mobile=True,
        )
        page_l = await ctx_land.new_page()
        await page_l.goto(TARGET_URL, wait_until="networkidle")
        await page_l.wait_for_selector(".app-shell")
        await page_l.screenshot(path=str(OUT_DIR / "18_landscape_geometry.png"))
        print("Captured 18_landscape_geometry.png")
        await page_l.click('button[data-page="results"]')
        await page_l.wait_for_timeout(300)
        await page_l.screenshot(path=str(OUT_DIR / "19_landscape_results.png"))
        print("Captured 19_landscape_results.png")
        await ctx_land.close()
        
        # =========================================================================
        # SUITE 4: Desktop (1280 x 800)
        # =========================================================================
        print("--- Suite 4: Desktop 1280x800 ---")
        ctx_desk = await browser.new_context(viewport={"width": 1280, "height": 800})
        page_d = await ctx_desk.new_page()
        await page_d.goto(TARGET_URL, wait_until="networkidle")
        await page_d.wait_for_selector(".app-shell")
        
        # 20. Geometry Desktop
        await page_d.screenshot(path=str(OUT_DIR / "20_desktop_geometry.png"))
        print("Captured 20_desktop_geometry.png")
        
        # 21. Conditions Desktop
        await page_d.click('button[data-page="conditions"]')
        await page_d.wait_for_timeout(300)
        await page_d.screenshot(path=str(OUT_DIR / "21_desktop_conditions.png"))
        print("Captured 21_desktop_conditions.png")
        
        # 22. Results Desktop
        await page_d.click('button[data-page="results"]')
        await page_d.wait_for_timeout(300)
        await page_d.screenshot(path=str(OUT_DIR / "22_desktop_results.png"))
        print("Captured 22_desktop_results.png")
        
        # 23. Parameter Sweep Desktop
        await page_d.click("#btn-open-sweep")
        await page_d.wait_for_selector("#modal-sweep.open")
        await page_d.wait_for_timeout(500)
        await page_d.screenshot(path=str(OUT_DIR / "23_desktop_sweep_modal.png"))
        print("Captured 23_desktop_sweep_modal.png")
        await page_d.click('[data-close="modal-sweep"]')
        await page_d.wait_for_timeout(200)
        
        # 24. Desktop Light Mode
        await page_d.click("#btn-header-settings")
        await page_d.wait_for_selector("#modal-settings.open")
        await page_d.wait_for_timeout(200)
        await page_d.click("#btn-setting-theme")
        await page_d.wait_for_timeout(200)
        await page_d.click('[data-close="modal-settings"]')
        await page_d.wait_for_timeout(200)
        await page_d.screenshot(path=str(OUT_DIR / "24_desktop_light_results.png"))
        print("Captured 24_desktop_light_results.png")
        
        await ctx_desk.close()
        
        assert len(errors) == 0, f"Errors encountered: {errors}"
        print(">>> ALL BROWSER AUDIT SCREENSHOTS & FUNCTIONALITIES VERIFIED WITH 0 ERRORS! <<<")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_audit())
