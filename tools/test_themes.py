import os
import sys
import time
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ADB = r"C:\Android\platform-tools\adb.exe"
OUT_DIR = Path(__file__).resolve().parent.parent / "scratch" / "human_eval"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def adb(*args):
    return subprocess.run([ADB, "-s", os.environ.get("ANDROID_SERIAL", "emulator-5554"), *args], capture_output=True, text=True, errors="replace").stdout.strip()

def tap(x, y):
    adb("shell", "input", "tap", str(int(x)), str(int(y)))
    time.sleep(0.7)

def dump_and_find(text_sub):
    temp_ui = OUT_DIR / "temp_ui.xml"
    adb("shell", "uiautomator", "dump", "/data/local/tmp/ui.xml")
    adb("pull", "/data/local/tmp/ui.xml", str(temp_ui))
    tree = ET.parse(str(temp_ui))
    import re
    for elem in tree.iter("node"):
        txt = elem.attrib.get("text", "")
        if text_sub in txt:
            bounds = elem.attrib.get("bounds", "")
            m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                return (x1 + x2) // 2, (y1 + y2) // 2
    return None

def click_text(text_sub):
    pos = dump_and_find(text_sub)
    if pos:
        tap(pos[0], pos[1])
        return True
    return False

def screenshot(name):
    path = OUT_DIR / f"{name}.png"
    adb("shell", "screencap", "-p", "/data/local/tmp/screen.png")
    adb("pull", "/data/local/tmp/screen.png", str(path))
    print(f"Captured: {name}.png ({path.stat().st_size} bytes)")

print("Testing Light and Midnight Blue themes...")

# 1. Switch to Light Theme
click_text("⋮")
time.sleep(0.6)
click_text("Settings")
time.sleep(0.8)
# Click the theme button (currently showing 'DARK')
click_text("DARK")
time.sleep(0.6)
# Select Light
click_text("Light")
time.sleep(1.2)
screenshot("50_light_settings_active")
# Close settings (tap '×' or Back)
click_text("×")
time.sleep(0.6)

# Captures in Light Theme
click_text("GEOMETRY")
screenshot("51_light_geom_top")
click_text("CONDITIONS")
screenshot("52_light_cond_top")
click_text("RESULTS")
screenshot("53_light_res_top")
if click_text("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("54_light_sweep_plot")
    click_text("×")
    time.sleep(0.6)

# 2. Switch to Midnight Blue Theme
click_text("⋮")
time.sleep(0.6)
click_text("Settings")
time.sleep(0.8)
click_text("LIGHT")
time.sleep(0.6)
click_text("Midnight Blue")
time.sleep(1.2)
screenshot("55_midnight_settings_active")
click_text("×")
time.sleep(0.6)

# Captures in Midnight Blue
click_text("GEOMETRY")
screenshot("56_midnight_geom_top")
click_text("CONDITIONS")
screenshot("57_midnight_cond_top")
click_text("RESULTS")
screenshot("58_midnight_res_top")
if click_text("OPEN PARAMETER SWEEP"):
    time.sleep(1.0)
    screenshot("59_midnight_sweep_plot")
    click_text("×")
    time.sleep(0.6)

# 3. Restore to Dark Theme
click_text("⋮")
time.sleep(0.6)
click_text("Settings")
time.sleep(0.8)
click_text("MIDNIGHT")
time.sleep(0.6)
click_text("Dark")
time.sleep(1.2)
click_text("×")
time.sleep(0.6)

print("Theme testing completed successfully!")
