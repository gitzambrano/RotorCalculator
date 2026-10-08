import os
import sys
import time
import re
import json
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

# Force UTF-8 on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ADB = r"C:\Android\platform-tools\adb.exe"
OUT_DIR = Path(__file__).resolve().parent.parent / "scratch" / "human_eval"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def adb(*args, check=True):
    cmd = [ADB, "-s", os.environ.get("ANDROID_SERIAL", "emulator-5554"), *args]
    res = subprocess.run(cmd, capture_output=True, encoding="utf-8", errors="replace", check=check)
    return (res.stdout or "").strip()

def get_screen_size():
    out = adb("shell", "wm", "size")
    matches = re.findall(r"(\d+)x(\d+)", out)
    if matches:
        return int(matches[-1][0]), int(matches[-1][1])
    return 1080, 2400

def tap(x, y):
    adb("shell", "input", "tap", str(int(x)), str(int(y)))
    time.sleep(0.7)

def scroll_down():
    w, h = get_screen_size()
    cx = w // 2
    adb("shell", "input", "swipe", str(cx), str(int(h * 0.72)), str(cx), str(int(h * 0.28)), "350")
    time.sleep(0.6)

def scroll_up():
    w, h = get_screen_size()
    cx = w // 2
    adb("shell", "input", "swipe", str(cx), str(int(h * 0.28)), str(cx), str(int(h * 0.72)), "350")
    time.sleep(0.6)

def dump_ui():
    adb("shell", "uiautomator", "dump", "/data/local/tmp/ui.xml")
    adb("pull", "/data/local/tmp/ui.xml", "scratch/temp_ui.xml")
    tree = ET.parse("scratch/temp_ui.xml")
    nodes = []
    for elem in tree.iter("node"):
        bounds_str = elem.attrib.get("bounds", "")
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            nodes.append({
                "text": elem.attrib.get("text", ""),
                "desc": elem.attrib.get("content-desc", ""),
                "cls": elem.attrib.get("class", ""),
                "bounds": (x1, y1, x2, y2),
                "center": (cx, cy)
            })
    return nodes

def find_node(text_sub, nodes=None):
    if nodes is None:
        nodes = dump_ui()
    for n in nodes:
        if text_sub in n["text"] or text_sub in n["desc"]:
            return n
    return None

def click_node(text_sub, timeout=3.0):
    start = time.time()
    while time.time() - start < timeout:
        nodes = dump_ui()
        n = find_node(text_sub, nodes)
        if n:
            tap(n["center"][0], n["center"][1])
            return True
        time.sleep(0.4)
    print(f"Warning: could not find node containing '{text_sub}'")
    return False

def screenshot(name):
    path = OUT_DIR / f"{name}.png"
    adb("shell", "screencap", "-p", "/data/local/tmp/screen.png")
    adb("pull", "/data/local/tmp/screen.png", str(path))
    size = path.stat().st_size if path.exists() else 0
    print(f"Captured: {name}.png ({size} bytes)")
    return path

def set_config(density=440, font_scale=1.0, orientation=0):
    adb("shell", "settings", "put", "system", "font_scale", str(font_scale))
    if density:
        adb("shell", "wm", "density", str(density))
    else:
        adb("shell", "wm", "density", "reset")
    adb("shell", "settings", "put", "system", "accelerometer_rotation", "0")
    adb("shell", "settings", "put", "system", "user_rotation", str(orientation))
    time.sleep(1.0)
    # Restart app to cleanly adapt to new configuration
    adb("shell", "am", "force-stop", "flightdyn.rotorcalculator")
    time.sleep(0.5)
    adb("shell", "am", "start", "-n", "flightdyn.rotorcalculator/.main")
    time.sleep(1.5)

print("Starting Human Walkthrough Evaluation...")

# ==============================================================================
# SCENARIO 1: MODERN PHONE (393dp, DARK THEME - DEFAULT)
# ==============================================================================
print("\n--- Running Scenario 1: Modern Phone, Dark Theme, Interactive Exploration ---")
set_config(density=440, font_scale=1.0, orientation=0)

# 1.1 Geometry top
screenshot("01_modern_dark_geom_top")

# 1.2 Change active rotor: tap active rotor bar (first row or text 'UH-60A')
if click_node("UH-60A"):
    screenshot("02_modern_rotor_picker")
    # Pick Bell 206
    click_node("Bell 206")
    time.sleep(1.0)
    screenshot("03_modern_bell206_loaded")

# 1.3 Contextual Help: tap 'Aspect' or 'AR'
scroll_up()
if click_node("Aspect"):
    screenshot("04_modern_aspect_help_popup")
    # Dismiss popup by tapping Close '×' or near top right
    click_node("×") or adb("shell", "input", "keyevent", "4") # Back key
    time.sleep(0.5)

# 1.4 Switch to Conditions Tab
click_node("CONDITIONS")
screenshot("05_modern_cond_top")

# 1.5 Change Inflow Model
if click_node("Coleman FG") or click_node("Inflow"):
    screenshot("06_modern_inflow_picker")
    click_node("Drees")
    time.sleep(0.5)
    screenshot("07_modern_inflow_drees_selected")

# 1.6 Switch horizontal/axial variable representations
click_node("μx") or click_node("Vx")
time.sleep(0.5)
click_node("α") or click_node("Vz") or click_node("μz")
time.sleep(0.5)
screenshot("08_modern_cond_flow_toggled")

# 1.7 Switch to Results Tab
click_node("RESULTS")
screenshot("09_modern_res_top")
scroll_down()
screenshot("10_modern_res_middle")
scroll_down()
screenshot("11_modern_res_bottom")

# 1.8 Open Parameter Sweep
scroll_up()
scroll_up()
if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.2)
    screenshot("12_modern_sweep_initial")
    
    # Tap on plot for crosshair inspection (center of plot area)
    w, h = get_screen_size()
    tap(w // 2, int(h * 0.42))
    time.sleep(0.5)
    screenshot("13_modern_sweep_crosshair_active")
    
    # Change multi-model family
    if click_node("Curves"):
        screenshot("14_modern_sweep_family_picker")
        click_node("α Set")
        time.sleep(0.8)
        screenshot("15_modern_sweep_alpha_set_plotted")
        
    # Open Sweep Table
    if click_node("TABLE"):
        time.sleep(1.0)
        screenshot("16_modern_sweep_table_view")
        # Dismiss table
        click_node("×") or adb("shell", "input", "keyevent", "4")
        time.sleep(0.5)
        
    # Close sweep dialog
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# ==============================================================================
# SCENARIO 2: LIGHT THEME (DAYLIGHT)
# ==============================================================================
print("\n--- Running Scenario 2: Light Theme Evaluation ---")
# Open 3-dots menu
click_node("⋮")
time.sleep(0.6)
screenshot("17_menu_options")
click_node("Settings")
time.sleep(0.8)
screenshot("18_settings_dialog_dark")

# Switch Theme to Light
click_node("Theme")
time.sleep(0.6)
screenshot("19_theme_picker")
click_node("Light")
time.sleep(1.5)
screenshot("20_settings_dialog_light")

# Close Settings
click_node("CLOSE") or click_node("×") or adb("shell", "input", "keyevent", "4")
time.sleep(0.5)

# Capture Main Tabs in Light Theme
click_node("GEOMETRY")
screenshot("21_light_geom_top")
scroll_down()
screenshot("22_light_geom_bottom")
scroll_up()

click_node("CONDITIONS")
screenshot("23_light_cond_top")

click_node("RESULTS")
screenshot("24_light_res_top")
scroll_down()
screenshot("25_light_res_middle")

# Sweep in Light Theme
scroll_up()
if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("26_light_sweep_plot")
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# ==============================================================================
# SCENARIO 3: MIDNIGHT BLUE THEME
# ==============================================================================
print("\n--- Running Scenario 3: Midnight Blue Theme Evaluation ---")
click_node("⋮")
time.sleep(0.6)
click_node("Settings")
time.sleep(0.8)
click_node("Theme")
time.sleep(0.6)
click_node("Midnight Blue")
time.sleep(1.5)
screenshot("27_settings_dialog_midnight")

click_node("CLOSE") or click_node("×") or adb("shell", "input", "keyevent", "4")
time.sleep(0.5)

click_node("GEOMETRY")
screenshot("28_midnight_geom_top")
click_node("CONDITIONS")
screenshot("29_midnight_cond_top")
click_node("RESULTS")
screenshot("30_midnight_res_top")

if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("31_midnight_sweep_plot")
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# Restore Dark Theme for subsequent device tests
click_node("⋮")
time.sleep(0.6)
click_node("Settings")
time.sleep(0.6)
click_node("Theme")
time.sleep(0.6)
click_node("Dark")
time.sleep(1.0)
click_node("CLOSE") or click_node("×") or adb("shell", "input", "keyevent", "4")
time.sleep(0.5)

# ==============================================================================
# SCENARIO 4: COMPACT PHONE (320dp)
# ==============================================================================
print("\n--- Running Scenario 4: Compact 320dp Evaluation ---")
set_config(density=540, font_scale=1.0, orientation=0)
click_node("GEOMETRY")
screenshot("32_compact_geom_top")
scroll_down()
screenshot("33_compact_geom_bottom")
scroll_up()

click_node("CONDITIONS")
screenshot("34_compact_cond_top")
scroll_down()
screenshot("35_compact_cond_bottom")
scroll_up()

click_node("RESULTS")
screenshot("36_compact_res_top")
scroll_down()
screenshot("37_compact_res_middle")

if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("38_compact_sweep_plot")
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# ==============================================================================
# SCENARIO 5: TABLET (600dp)
# ==============================================================================
print("\n--- Running Scenario 5: Tablet 600dp Evaluation ---")
set_config(density=288, font_scale=1.0, orientation=0)
click_node("GEOMETRY")
screenshot("39_tablet_geom")
click_node("CONDITIONS")
screenshot("40_tablet_cond")
click_node("RESULTS")
screenshot("41_tablet_res")
if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("42_tablet_sweep_plot")
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# ==============================================================================
# SCENARIO 6: LANDSCAPE PHONE (Horizontal orientation)
# ==============================================================================
print("\n--- Running Scenario 6: Landscape Phone Evaluation ---")
set_config(density=440, font_scale=1.0, orientation=1) # 90 degrees
click_node("GEOMETRY")
screenshot("43_landscape_geom")
click_node("CONDITIONS")
screenshot("44_landscape_cond")
click_node("RESULTS")
screenshot("45_landscape_res")

if click_node("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("46_landscape_sweep_plot")
    w, h = get_screen_size()
    tap(w // 2, int(h * 0.45))
    time.sleep(0.5)
    screenshot("47_landscape_sweep_crosshair")
    click_node("×") or adb("shell", "input", "keyevent", "4")
    time.sleep(0.5)

# Restore default configuration
print("\n--- Restoring emulator defaults ---")
adb("shell", "settings", "put", "system", "font_scale", "1.0")
adb("shell", "wm", "density", "reset")
adb("shell", "settings", "put", "system", "user_rotation", "0")
time.sleep(1.0)

print("\nHuman Walkthrough Evaluation finished successfully! All screenshots saved in scratch/human_eval/.")
