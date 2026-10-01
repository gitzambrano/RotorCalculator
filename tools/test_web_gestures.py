import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT_DIR = Path("qa-results/web-screens")
OUT_DIR.mkdir(parents=True, exist_ok=True)

async def run_full_suite():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # Test: Touch Swipe Navigation on Mobile
        mobile_context = await browser.new_context(
            viewport={"width": 393, "height": 851},
            user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36",
            has_touch=True,
            is_mobile=True,
        )
        page = await mobile_context.new_page()
        await page.goto("http://localhost:8080/")
        await page.wait_for_selector(".app-shell")
        
        # Initial: should be on Geometry
        active_tab = await page.inner_text(".tab-btn.active")
        assert active_tab == "GEOMETRY", f"Expected GEOMETRY, got {active_tab}"
        
        # Swipe Left to go to Conditions
        # Start at (300, 400) and drag to (50, 400)
        await page.touchscreen.tap(200, 300)
        # Dispatch touch swipe
        await page.evaluate("""() => {
            const el = document.getElementById('content-area');
            const touchStart = new Touch({ identifier: 1, target: el, clientX: 320, clientY: 400 });
            const touchEnd = new Touch({ identifier: 1, target: el, clientX: 60, clientY: 400 });
            el.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
            el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
        }""")
        await page.wait_for_timeout(350)
        
        active_tab2 = await page.inner_text(".tab-btn.active")
        assert active_tab2 == "CONDITIONS", f"Swipe left failed: expected CONDITIONS, got {active_tab2}"
        print("PASS: Touch swipe left from Geometry successfully transitioned to Conditions!")
        
        # Swipe Left again to go to Results
        await page.evaluate("""() => {
            const el = document.getElementById('content-area');
            const touchStart = new Touch({ identifier: 2, target: el, clientX: 320, clientY: 400 });
            const touchEnd = new Touch({ identifier: 2, target: el, clientX: 60, clientY: 400 });
            el.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
            el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
        }""")
        await page.wait_for_timeout(350)
        
        active_tab3 = await page.inner_text(".tab-btn.active")
        assert active_tab3 == "RESULTS", f"Swipe left failed: expected RESULTS, got {active_tab3}"
        print("PASS: Touch swipe left from Conditions successfully transitioned to Results!")
        
        # Swipe Right to go back to Conditions
        await page.evaluate("""() => {
            const el = document.getElementById('content-area');
            const touchStart = new Touch({ identifier: 3, target: el, clientX: 60, clientY: 400 });
            const touchEnd = new Touch({ identifier: 3, target: el, clientX: 320, clientY: 400 });
            el.dispatchEvent(new TouchEvent('touchstart', { touches: [touchStart], changedTouches: [touchStart] }));
            el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touchEnd] }));
        }""")
        await page.wait_for_timeout(350)
        active_tab4 = await page.inner_text(".tab-btn.active")
        assert active_tab4 == "CONDITIONS", f"Swipe right failed: expected CONDITIONS, got {active_tab4}"
        print("PASS: Touch swipe right from Results successfully transitioned back to Conditions!")
        
        # Test: Desktop Drag & Drop Reordering in Rotor Manager
        desktop_context = await browser.new_context(viewport={"width": 1280, "height": 800})
        d_page = await desktop_context.new_page()
        await d_page.goto("http://localhost:8080/")
        await d_page.wait_for_selector(".app-shell")
        
        # Open manager
        await d_page.click("#active-rotor-bar")
        await d_page.wait_for_selector("#modal-rotor-manager.open")
        
        # Initial order
        first_rotor_name = await d_page.inner_text(".rotor-manager-item:nth-child(1) .rotor-manager-name")
        assert "Sikorsky UH-60" in first_rotor_name, f"Unexpected first rotor: {first_rotor_name}"
        
        # Simulate drop event to reorder item 1 to item 0
        await d_page.evaluate("""() => {
            const items = document.querySelectorAll('.rotor-manager-item');
            const target = items[0];
            const dropEvent = new Event('drop', { bubbles: true });
            dropEvent.dataTransfer = {
                getData: () => '1' // Drag item 1 (Bell 206) to position 0
            };
            target.dispatchEvent(dropEvent);
        }""")
        await d_page.wait_for_timeout(200)
        
        new_first_name = await d_page.inner_text(".rotor-manager-item:nth-child(1) .rotor-manager-name")
        assert "Bell 206" in new_first_name, f"Expected Bell 206 at index 0 after drop, got {new_first_name}"
        print("PASS: Drag & Drop reordering in Rotor Manager successfully updated order!")
        
        await browser.close()
        print("ALL INTERACTION & GESTURE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    asyncio.run(run_full_suite())
