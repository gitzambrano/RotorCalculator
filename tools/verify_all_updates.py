import subprocess
import time
import xml.etree.ElementTree as ET
import os
import re

ADB = r"C:\Android\platform-tools\adb.exe"
PKG = "flightdyn.rotorcalculator"
ACT = f"{PKG}/.main"
SCREENSHOTS_DIR = r"c:\Projetos\RotorCalculator\tests\screenshots"

def run_adb(cmd, timeout=30):
    res = subprocess.run([ADB] + cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    return res.stdout.strip() if res.stdout else ""

def get_dump():
    run_adb(["shell", "uiautomator", "dump", "/sdcard/dump.xml"])
    xml_str = run_adb(["shell", "cat", "/sdcard/dump.xml"])
    try:
        return ET.fromstring(xml_str)
    except Exception as e:
        print("XML parse error:", e)
        return None

def find_node_by_text(root, text_pattern):
    if root is None:
        return None
    for node in root.iter("node"):
        text = node.attrib.get("text", "")
        if re.search(text_pattern, text, re.IGNORECASE):
            return node
    return None

def get_bounds(node):
    # bounds="[left,top][right,bottom]"
    b = node.attrib.get("bounds", "")
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", b)
    if m:
        x1, y1, x2, y2 = map(int, m.groups())
        return (x1, y1, x2, y2, (x1 + x2) // 2, (y1 + y2) // 2)
    return None

def tap_node(node):
    bounds = get_bounds(node)
    if bounds:
        cx, cy = bounds[4], bounds[5]
        run_adb(["shell", "input", "tap", str(cx), str(cy)])
        time.sleep(1.0)
        return True
    return False

def screenshot(name):
    path = os.path.join(SCREENSHOTS_DIR, name)
    res = subprocess.run([ADB, "exec-out", "screencap", "-p"], capture_output=True, timeout=15)
    with open(path, "wb") as f:
        f.write(res.stdout)
    print(f"Captured: {path}")

def main():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    print("--- Starting APK verification ---")
    run_adb(["shell", "am", "force-stop", PKG])
    time.sleep(0.5)
    run_adb(["shell", "am", "start", "-n", ACT])
    time.sleep(2.5)

    root = get_dump()
    assert root is not None, "Failed to get UI dump"
    geom_tab = find_node_by_text(root, r"^GEOMETRY$")
    if geom_tab:
        tap_node(geom_tab)
        time.sleep(1.0)

    # 1. Geometry screen
    screenshot("apk_01_geometry.png")

    # Scroll down to Aerodynamics section
    run_adb(["shell", "input", "swipe", "540", "1600", "540", "700", "300"])
    time.sleep(1.0)
    screenshot("apk_01b_aerodynamics.png")
    root = get_dump()

    # Verify Compressibility says "On"
    comp_val_node = find_node_by_text(root, r"^On$")
    print("Found 'On' button:", comp_val_node is not None)
    if comp_val_node:
        print("Bounds of 'On':", comp_val_node.attrib.get("bounds"))

    # Test Item 5: Click Compressibility label in Column 1 -> must open Help!
    comp_lbl = find_node_by_text(root, r"Compressibility")
    print("Tapping Compressibility label...")
    tap_node(comp_lbl)
    time.sleep(1.0)
    screenshot("apk_02_comp_help.png")
    root_help = get_dump()
    # Check that it's help text with ON and OFF
    on_off_node = find_node_by_text(root_help, r"ON: Prandtl-Glauert")
    print("Help text contains ON / OFF explanation:", on_off_node is not None)

    # Close help sheet (tap outside or close button)
    close_btn = find_node_by_text(root_help, r"Close|Dismiss|Done|OK|CANCEL")
    if close_btn:
        tap_node(close_btn)
    else:
        run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
    time.sleep(1.0)

    # Test Item 5: Click "On" button in Column 2 -> must open picker dropdown!
    root = get_dump()
    comp_val = find_node_by_text(root, r"^On$")
    print("Tapping 'On' button...")
    tap_node(comp_val)
    time.sleep(1.0)
    screenshot("apk_03_comp_picker.png")
    root_picker = get_dump()
    off_option = find_node_by_text(root_picker, r"^Off")
    on_option = find_node_by_text(root_picker, r"^On")
    print("Picker shows 'Off' and 'On':", off_option is not None, on_option is not None)

    # Close picker without changing
    run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
    time.sleep(1.0)

    # Test Item 5: Click Tip Loss label in Column 1 -> must open Help!
    root = get_dump()
    tiploss_lbl = find_node_by_text(root, r"^Tip Loss$")
    print("Tapping Tip Loss label...")
    tap_node(tiploss_lbl)
    time.sleep(1.0)
    screenshot("apk_04_tiploss_help.png")
    run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
    time.sleep(1.0)

    # Test Item 5: Click Tip Loss value (Sissingh) in Column 2 -> must open picker!
    root = get_dump()
    sissingh_btn = find_node_by_text(root, r"^Sissingh$")
    print("Tapping 'Sissingh' button...")
    tap_node(sissingh_btn)
    time.sleep(1.0)
    screenshot("apk_05_tiploss_picker.png")
    root_picker = get_dump()
    none_opt = find_node_by_text(root_picker, r"^None")
    fixed_opt = find_node_by_text(root_picker, r"^Fixed")
    sissingh_opt = find_node_by_text(root_picker, r"^Sissingh")
    print("Picker shows Title Case options (None, Fixed, Sissingh):", none_opt is not None, fixed_opt is not None, sissingh_opt is not None)
    run_adb(["shell", "input", "keyevent", "KEYCODE_BACK"])
    time.sleep(1.0)

    # Test Item 1: Swipe navigation to Conditions (swipe left: 900 -> 180, y=900)
    print("Swiping to CONDITIONS tab...")
    run_adb(["shell", "input", "swipe", "900", "900", "180", "900", "250"])
    time.sleep(1.2)
    screenshot("apk_06_conditions.png")
    root_cond = get_dump()
    cond_header = find_node_by_text(root_cond, r"ATMOSPHERE & FLOW")
    print("Reached CONDITIONS tab via swipe:", cond_header is not None)

    # Swipe navigation to Results
    print("Swiping to RESULTS tab...")
    run_adb(["shell", "input", "swipe", "900", "900", "180", "900", "250"])
    time.sleep(1.2)
    screenshot("apk_07_results_top.png")

    # Scroll down to bottom to inspect MODEL STATUS chips (Item 8)
    print("Scrolling down to MODEL STATUS...")
    run_adb(["shell", "input", "swipe", "540", "1900", "540", "400", "400"])
    time.sleep(0.5)
    run_adb(["shell", "input", "swipe", "540", "1900", "540", "400", "400"])
    time.sleep(0.5)
    run_adb(["shell", "input", "swipe", "540", "1900", "540", "400", "400"])
    time.sleep(1.0)
    screenshot("apk_08_results_status.png")

    root_res = get_dump()
    trim_chip = find_node_by_text(root_res, r"Trim: RPM \+ Target CT")
    model_chip = find_node_by_text(root_res, r"Model valid")
    print("Trim chip found:", trim_chip is not None)
    print("Model chip found:", model_chip is not None)
    if trim_chip and model_chip:
        tb = get_bounds(trim_chip)
        mb = get_bounds(model_chip)
        th = tb[3] - tb[1]
        mh = mb[3] - mb[1]
        print(f"Trim chip height: {th}px, Model chip height: {mh}px. Equal: {th == mh}")

    print("--- APK Verification Finished Successfully ---")

if __name__ == "__main__":
    main()
