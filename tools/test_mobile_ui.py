import http.server
import socketserver
import threading
import os
import sys
from playwright.sync_api import sync_playwright

PORT = 8089
DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass  # suppress server log

def run():
    httpd = socketserver.TCPServer(("", PORT), Handler)
    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    print(f"Server started at http://localhost:{PORT}")

    screenshots_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "screenshots_mobile"))
    os.makedirs(screenshots_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Test on mobile device viewport (360 x 780, typical Android device)
        context = browser.new_context(
            viewport={"width": 360, "height": 780},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.goto(f"http://localhost:{PORT}/index.html")
        page.wait_for_selector(".app-shell")

        print("--- TEST 1: Stationarity of Header & Tabs ---")
        topbar = page.locator(".topbar")
        tab_bar = page.locator(".tabs-nav")

        # Geometry tab
        geom_topbar_box = topbar.bounding_box()
        geom_tabs_box = tab_bar.bounding_box()
        print(f"Geometry Topbar box: x={geom_topbar_box['x']}, y={geom_topbar_box['y']}, w={geom_topbar_box['width']}")
        print(f"Geometry TabBar box: x={geom_tabs_box['x']}, y={geom_tabs_box['y']}, w={geom_tabs_box['width']}")
        page.screenshot(path=os.path.join(screenshots_dir, "01_geometry.png"))

        # Switch to Conditions tab
        page.click("button[data-page='conditions']")
        page.wait_for_timeout(300)
        cond_topbar_box = topbar.bounding_box()
        cond_tabs_box = tab_bar.bounding_box()
        print(f"Conditions Topbar box: x={cond_topbar_box['x']}, y={cond_topbar_box['y']}, w={cond_topbar_box['width']}")
        print(f"Conditions TabBar box: x={cond_tabs_box['x']}, y={cond_tabs_box['y']}, w={cond_tabs_box['width']}")
        page.screenshot(path=os.path.join(screenshots_dir, "02_conditions.png"))

        assert abs(geom_topbar_box['x'] - cond_topbar_box['x']) < 0.1, "Topbar X shifted when switching to Conditions!"
        assert abs(geom_topbar_box['y'] - cond_topbar_box['y']) < 0.1, "Topbar Y shifted when switching to Conditions!"
        assert abs(geom_tabs_box['x'] - cond_tabs_box['x']) < 0.1, "TabBar X shifted when switching to Conditions!"
        assert abs(geom_tabs_box['y'] - cond_tabs_box['y']) < 0.1, "TabBar Y shifted when switching to Conditions!"

        # Switch to Results tab
        page.click("button[data-page='results']")
        page.wait_for_timeout(300)
        res_topbar_box = topbar.bounding_box()
        res_tabs_box = tab_bar.bounding_box()
        print(f"Results Topbar box: x={res_topbar_box['x']}, y={res_topbar_box['y']}, w={res_topbar_box['width']}")
        print(f"Results TabBar box: x={res_tabs_box['x']}, y={res_tabs_box['y']}, w={res_tabs_box['width']}")
        page.screenshot(path=os.path.join(screenshots_dir, "03_results.png"))

        assert abs(geom_topbar_box['x'] - res_topbar_box['x']) < 0.1, "Topbar X shifted when switching to Results!"
        assert abs(geom_topbar_box['y'] - res_topbar_box['y']) < 0.1, "Topbar Y shifted when switching to Results!"
        assert abs(geom_tabs_box['x'] - res_tabs_box['x']) < 0.1, "TabBar X shifted when switching to Results!"
        assert abs(geom_tabs_box['y'] - res_tabs_box['y']) < 0.1, "TabBar Y shifted when switching to Results!"
        print("[PASS] Header & Tabs are 100% stationary across all tabs (0.0px shift)!")

        print("\n--- TEST 2: Button Typography & Centering ---")
        page.click("button[data-page='geometry']")
        page.wait_for_timeout(200)
        label_btn = page.locator(".row-label-btn").first
        text_align = label_btn.evaluate("el => window.getComputedStyle(el).textAlign")
        font_weight = label_btn.evaluate("el => window.getComputedStyle(el).fontWeight")
        font_size = label_btn.evaluate("el => window.getComputedStyle(el).fontSize")
        justify = label_btn.evaluate("el => window.getComputedStyle(el).justifyContent")
        print(f"Row label button style: textAlign={text_align}, justifyContent={justify}, fontWeight={font_weight}, fontSize={font_size}")
        assert text_align == "center", f"Expected textAlign center, got {text_align}"
        assert justify == "center", f"Expected justifyContent center, got {justify}"
        assert int(font_weight) >= 700, f"Expected bold font weight >= 700, got {font_weight}"
        print("[PASS] Buttons have centered text and bold APK typography!")

        print("\n--- TEST 3: Options Popup Picker Sizing ---")
        page.click("button[data-page='conditions']")
        page.wait_for_timeout(200)
        # Click trim mode button to open options modal
        page.click("#btn-trim-mode")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(screenshots_dir, "04_options_modal.png"))
        modal_card = page.locator(".options-modal-card")
        modal_box = modal_card.bounding_box()
        print(f"Options Modal box: w={modal_box['width']}, h={modal_box['height']}, y={modal_box['y']}")
        assert modal_box['height'] <= 700, "Options modal is too tall!"
        cancel_btn = page.locator("#modal-options-selector button.action-btn")
        cancel_box = cancel_btn.bounding_box()
        print(f"Cancel button box: y={cancel_box['y']}, h={cancel_box['height']}")
        assert cancel_box['y'] + cancel_box['height'] <= 780, "Cancel button is pushed below screen!"
        print("[PASS] Options modal fits comfortably inside mobile viewport with Cancel fully visible!")
        # Close modal
        cancel_btn.click()
        page.wait_for_timeout(200)

        print("\n--- TEST 4: Results Tab Single-Row Layout & Symbol Labels ---")
        page.click("button[data-page='results']")
        page.wait_for_timeout(300)
        result_rows = page.locator(".result-row").all()
        print(f"Total result rows rendered: {len(result_rows)}")
        assert len(result_rows) >= 30, "Missing result rows!"

        truncated_count = 0
        multi_line_count = 0
        for i, row in enumerate(result_rows):
            lbl_el = row.locator(".result-label")
            txt = lbl_el.text_content().strip()
            box = row.bounding_box()
            height = box['height']
            if height > 52:
                multi_line_count += 1
                print(f"Row {i} ('{txt}') height is multi-line: {height}px")
            if "..." in txt or "…" in txt:
                truncated_count += 1
                print(f"Row {i} ('{txt}') is truncated with ellipsis!")

        assert multi_line_count == 0, f"Found {multi_line_count} rows that wrapped into multiple lines!"
        assert truncated_count == 0, f"Found {truncated_count} rows with ellipsis truncation!"

        # Check sample labels on 360px viewport
        sample_power = page.locator(".result-row[data-param='PowerKW'] .result-label").text_content().strip()
        sample_cmy = page.locator(".result-row[data-param='CMy'] .result-label").first.text_content().strip()
        sample_ct = page.locator(".result-row[data-param='CT'] .result-label").text_content().strip()
        print(f"Sample mobile result labels: Power='{sample_power}', CMy='{sample_cmy}', CT='{sample_ct}'")
        assert sample_power == "Pshaft", f"Expected Pshaft, got {sample_power}"
        assert sample_cmy == "My", f"Expected My, got {sample_cmy}"
        assert sample_ct == "CT", f"Expected CT, got {sample_ct}"
        print("[PASS] Results rows fit on 1 line with clean symbol-first labels and no truncation!")

        browser.close()
    httpd.shutdown()
    print("\nALL 4 MOBILE PARITY TESTS PASSED ACCURATELY AND FULLY!")

if __name__ == "__main__":
    run()
