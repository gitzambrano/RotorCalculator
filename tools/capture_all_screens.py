import os
import sys
import time
import json
import re
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
PACKAGE = "flightdyn.rotorcalculator"
OUT_DIR = Path(__file__).resolve().parent.parent / "scratch" / "eval_screens"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def run_adb(*args, check=True):
    cmd = [ADB, "-s", "emulator-5554", *args]
    res = subprocess.run(cmd, capture_output=True, encoding="utf-8", errors="replace", check=check)
    return (res.stdout or "").strip()

def get_screen_size():
    out = run_adb("shell", "wm", "size")
    matches = re.findall(r"(\d+)x(\d+)", out)
    if matches:
        return int(matches[-1][0]), int(matches[-1][1])
    return 1080, 2400

def collapse_statusbar():
    run_adb("shell", "cmd", "statusbar", "collapse", check=False)

def tap(x, y):
    collapse_statusbar()
    run_adb("shell", "input", "tap", str(int(x)), str(int(y)))
    time.sleep(0.7)

def keyevent(code):
    run_adb("shell", "input", "keyevent", str(code))
    time.sleep(0.5)

def scroll_down():
    w, h = get_screen_size()
    cx = w // 2
    y1 = int(h * 0.75)
    y2 = int(h * 0.28)
    run_adb("shell", "input", "swipe", str(cx), str(y1), str(cx), str(y2), "400")
    time.sleep(0.7)

def scroll_up():
    w, h = get_screen_size()
    cx = w // 2
    y1 = int(h * 0.28)
    y2 = int(h * 0.75)
    run_adb("shell", "input", "swipe", str(cx), str(y1), str(cx), str(y2), "400")
    time.sleep(0.7)

def dump_nodes():
    xml_path = "/sdcard/dump.xml"
    run_adb("shell", "uiautomator", "dump", xml_path, check=False)
    xml_content = run_adb("shell", "cat", xml_path, check=False)
    try:
        root = ET.fromstring(xml_content)
    except Exception:
        return []
    nodes = []
    for n in root.iter("node"):
        text = (n.attrib.get("text") or "").strip()
        desc = (n.attrib.get("content-desc") or "").strip()
        bounds_str = n.attrib.get("bounds", "")
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
        bounds = tuple(map(int, m.groups())) if m else (0,0,0,0)
        clickable = n.attrib.get("clickable") == "true"
        cls = n.attrib.get("class", "")
        if text or desc:
            nodes.append({
                "text": text,
                "desc": desc,
                "bounds": bounds,
                "clickable": clickable,
                "class": cls
            })
    return nodes

def find_node(text_exact=None, text_contains=None):
    nodes = dump_nodes()
    for n in nodes:
        if text_exact and (n["text"].strip().lower() == text_exact.strip().lower() or n["desc"].strip().lower() == text_exact.strip().lower()):
            return n
        if text_contains and (text_contains.strip().lower() in n["text"].strip().lower() or text_contains.strip().lower() in n["desc"].strip().lower()):
            return n
    return None

def tap_node(node):
    if not node:
        return False
    b = node["bounds"]
    cx = (b[0] + b[2]) // 2
    cy = (b[1] + b[3]) // 2
    tap(cx, cy)
    return True

def tap_text(text_exact=None, text_contains=None):
    n = find_node(text_exact, text_contains)
    if n:
        return tap_node(n)
    return False

def screencap(save_name):
    collapse_statusbar()
    target = OUT_DIR / save_name
    cmd = [ADB, "-s", "emulator-5554", "exec-out", "screencap", "-p"]
    res = subprocess.run(cmd, capture_output=True)
    target.write_bytes(res.stdout)
    print(f"Captured: {save_name} ({len(res.stdout)} bytes)")

CONFIGS = [
    {"name": "compact_320dp", "density": "540", "font": "1.0", "rot": "0"},
    {"name": "standard_360dp", "density": "480", "font": "1.0", "rot": "0"},
    {"name": "modern_393dp", "density": "440", "font": "1.0", "rot": "0"},
    {"name": "large_412dp", "density": "420", "font": "1.0", "rot": "0"},
    {"name": "tablet_600dp", "density": "288", "font": "1.0", "rot": "0"},
    {"name": "tablet_768dp", "density": "225", "font": "1.0", "rot": "0"},
    {"name": "font130_393dp", "density": "440", "font": "1.3", "rot": "0"},
    {"name": "landscape_phone", "density": "440", "font": "1.0", "rot": "1"},
]

def run_all():
    print(f"Screenshots directory: {OUT_DIR.resolve()}")
    inspection_data = {}

    try:
        for cfg in CONFIGS:
            name = cfg["name"]
            print(f"\n=======================================================")
            print(f"Applying configuration: {name} (density={cfg['density']}, font={cfg['font']}, rot={cfg['rot']})")
            print(f"=======================================================")
            
            run_adb("shell", "wm", "density", cfg["density"])
            run_adb("shell", "settings", "put", "system", "font_scale", cfg["font"])
            run_adb("shell", "settings", "put", "system", "accelerometer_rotation", "0")
            run_adb("shell", "settings", "put", "system", "user_rotation", cfg["rot"])
            
            # Restart app
            run_adb("shell", "am", "force-stop", PACKAGE)
            time.sleep(0.5)
            run_adb("shell", "am", "start", "-n", f"{PACKAGE}/.main")
            time.sleep(3.5)
            collapse_statusbar()
            
            w, h = get_screen_size()
            print(f"Screen size: {w}x{h}")
            
            cfg_data = {}

            # 1. GEOMETRY TOP
            tap_text(text_exact="GEOMETRY")
            time.sleep(0.5)
            screencap(f"{name}_01_geom_top.png")
            cfg_data["geom_top"] = dump_nodes()

            # 2. GEOMETRY BOTTOM
            scroll_down()
            screencap(f"{name}_02_geom_bottom.png")
            cfg_data["geom_bottom"] = dump_nodes()

            # Reset back to top of geometry
            scroll_up()
            time.sleep(0.5)

            # 3. ROTOR LIST POPUP (click active rotor button)
            rotor_btn = find_node(text_contains="ACTIVE ROTOR")
            if rotor_btn:
                tap_node(rotor_btn)
                time.sleep(0.8)
                screencap(f"{name}_03_rotor_popup.png")
                cfg_data["rotor_popup"] = dump_nodes()
                keyevent(4) # Dismiss popup
                time.sleep(0.6)

            # 4. CONDITIONS TAB
            tap_text(text_exact="CONDITIONS")
            time.sleep(0.8)
            screencap(f"{name}_04_cond_top.png")
            cfg_data["cond_top"] = dump_nodes()

            # 5. CONDITIONS BOTTOM
            scroll_down()
            screencap(f"{name}_05_cond_bottom.png")
            cfg_data["cond_bottom"] = dump_nodes()

            # 6. RESULTS TAB
            scroll_up()
            time.sleep(0.4)
            tap_text(text_exact="RESULTS")
            time.sleep(0.8)
            screencap(f"{name}_06_res_top.png")
            cfg_data["res_top"] = dump_nodes()

            # 7. RESULTS MIDDLE
            scroll_down()
            screencap(f"{name}_07_res_middle.png")
            cfg_data["res_middle"] = dump_nodes()

            # 8. RESULTS BOTTOM
            scroll_down()
            screencap(f"{name}_08_res_bottom.png")
            cfg_data["res_bottom"] = dump_nodes()

            # 9. PARAMETER SWEEP
            scroll_up()
            scroll_up()
            time.sleep(0.5)
            sweep_btn = find_node(text_contains="SWEEP")
            if sweep_btn:
                tap_node(sweep_btn)
                time.sleep(1.2)
                screencap(f"{name}_09_sweep.png")
                cfg_data["sweep"] = dump_nodes()
                keyevent(4) # Dismiss sweep popup
                time.sleep(0.6)

            inspection_data[name] = cfg_data

    finally:
        print("\n--- Restoring emulator defaults ---")
        run_adb("shell", "wm", "density", "reset")
        run_adb("shell", "settings", "put", "system", "font_scale", "1.0")
        run_adb("shell", "settings", "put", "system", "accelerometer_rotation", "0")
        run_adb("shell", "settings", "put", "system", "user_rotation", "0")
        run_adb("shell", "am", "force-stop", PACKAGE)
        run_adb("shell", "am", "start", "-n", f"{PACKAGE}/.main")
        print("Restoration complete.")

    with open(OUT_DIR / "nodes_inspection.json", "w", encoding="utf-8") as f:
        json.dump(inspection_data, f, ensure_ascii=False, indent=2)
    print(f"Inspection nodes JSON saved to: {OUT_DIR / 'nodes_inspection.json'}")

if __name__ == "__main__":
    run_all()
