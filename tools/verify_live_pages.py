import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 393, "height": 852})
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        resp = await page.goto("https://gitzambrano.github.io/RotorCalculator/", wait_until="networkidle")
        print(f"HTTP Status: {resp.status}")
        
        assert await page.locator(".version-badge").inner_text() == "v1.23"
        title = await page.title()
        print(f"Page Title: {title}")
        
        await page.wait_for_selector(".app-shell")
        rotor_name = await page.inner_text("#display-active-rotor-name")
        print(f"Active Rotor: {rotor_name}")
        
        # Test Results calculation
        await page.click('button[data-page="results"]')
        await page.wait_for_timeout(500)
        thrust = await page.locator('.result-row[data-key="T"] .result-val').inner_text()
        power = await page.locator('.result-row[data-key="P"] .result-val').inner_text()
        print(f"Results Tab: Thrust = {thrust} N | Power = {power} kW")
        
        # Test Conditions Tab
        await page.click('button[data-page="conditions"]')
        await page.wait_for_timeout(300)
        altitude = await page.input_value("#inp-altitude")
        print(f"Conditions Tab: Altitude = {altitude}")
        
        # Test Sweep Modal
        await page.click('button[data-page="results"]')
        await page.click("#btn-open-sweep")
        await page.wait_for_selector("#modal-sweep.open")
        canvas = await page.is_visible("#sweep-canvas")
        print(f"Sweep Modal: Canvas visible = {canvas}")
        
        assert len(errors) == 0, f"Errors in browser: {errors}"
        print("ALL LIVE CHECKS PASSED SUCCESSFULLY!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
