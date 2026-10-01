import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT_DIR = Path("qa-results/web-screens")
OUT_DIR.mkdir(parents=True, exist_ok=True)

async def run_visual_audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # Test 1: Mobile Portrait (393 x 851)
        mobile_context = await browser.new_context(
            viewport={"width": 393, "height": 851},
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            has_touch=True,
            is_mobile=True,
        )
        page = await mobile_context.new_page()
        await page.goto("http://localhost:8080/")
        await page.wait_for_selector(".app-shell")
        
        # Check no horizontal overflow
        scroll_width = await page.evaluate("document.documentElement.scrollWidth")
        client_width = await page.evaluate("document.documentElement.clientWidth")
        assert scroll_width <= client_width + 1, f"Horizontal overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}"
        print(f"PASS: Mobile 393px width fits viewport cleanly (scrollWidth={scroll_width}, clientWidth={client_width})")
        
        # Capture Geometry
        await page.screenshot(path=str(OUT_DIR / "01-mobile-geometry.png"))
        
        # Switch to Conditions
        await page.click('button[data-page="conditions"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT_DIR / "02-mobile-conditions.png"))
        
        # Switch to Results
        await page.click('button[data-page="results"]')
        await page.wait_for_timeout(300)
        
        # Check thrust value is populated
        thrust_txt = await page.inner_text("#res-thrust")
        assert thrust_txt != "---" and int(thrust_txt.replace(",", "")) > 40000, f"Thrust not computed: {thrust_txt}"
        print(f"PASS: Results computed cleanly (Thrust = {thrust_txt} N)")
        await page.screenshot(path=str(OUT_DIR / "03-mobile-results.png"))
        
        # Open Parameter Sweep Modal
        await page.click("#btn-open-sweep")
        await page.wait_for_selector("#modal-sweep.open")
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT_DIR / "04-mobile-sweep-modal.png"))
        
        # Close modal
        await page.click('[data-close="modal-sweep"]')
        await page.wait_for_timeout(300)
        
        # Test 2: Compact Mobile (320 x 640)
        compact_context = await browser.new_context(
            viewport={"width": 320, "height": 640},
            has_touch=True,
            is_mobile=True,
        )
        compact_page = await compact_context.new_page()
        await compact_page.goto("http://localhost:8080/")
        await compact_page.wait_for_selector(".app-shell")
        compact_scroll_w = await compact_page.evaluate("document.documentElement.scrollWidth")
        compact_client_w = await compact_page.evaluate("document.documentElement.clientWidth")
        assert compact_scroll_w <= compact_client_w + 1, f"Compact overflow: scrollWidth={compact_scroll_w}, clientWidth={compact_client_w}"
        print(f"PASS: Ultra-compact 320px fits viewport cleanly (scrollWidth={compact_scroll_w})")
        await compact_page.screenshot(path=str(OUT_DIR / "05-compact-320px.png"))
        
        # Test 3: Desktop Viewport (1280 x 800)
        desktop_context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            is_mobile=False,
        )
        desktop_page = await desktop_context.new_page()
        await desktop_page.goto("http://localhost:8080/")
        await desktop_page.wait_for_selector(".app-shell")
        await desktop_page.screenshot(path=str(OUT_DIR / "06-desktop-geometry.png"))
        
        # Desktop open rotor manager
        await desktop_page.click("#active-rotor-bar")
        await desktop_page.wait_for_selector("#modal-rotor-manager.open")
        await desktop_page.wait_for_timeout(300)
        await desktop_page.screenshot(path=str(OUT_DIR / "07-desktop-rotor-manager.png"))
        await desktop_page.click('[data-close="modal-rotor-manager"]')
        
        # Desktop Results & Sweep
        await desktop_page.click('button[data-page="results"]')
        await desktop_page.wait_for_timeout(300)
        await desktop_page.screenshot(path=str(OUT_DIR / "08-desktop-results.png"))
        
        await desktop_page.click("#btn-open-sweep")
        await desktop_page.wait_for_selector("#modal-sweep.open")
        await desktop_page.wait_for_timeout(500)
        await desktop_page.screenshot(path=str(OUT_DIR / "09-desktop-sweep-modal.png"))
        
        await browser.close()
        print("PASS: All visual and interactive audits completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_visual_audit())
