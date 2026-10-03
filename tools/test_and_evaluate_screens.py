import os
import sys
import time
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ADB = r"C:\Android\platform-tools\adb.exe"
PACKAGE = "flightdyn.rotorcalculator"
OUT_DIR = Path(__file__).resolve().parent.parent / "scratch" / "eval-screenshots"
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
    time.sleep(0.6)

def scroll_down():
    w, h = get_screen_size()
    cx = w // 2
    y1 = int(h * 0.70)
    y2 = int(h * 0.35)
    run_adb("shell", "input", "swipe", str(cx), str(y1), str(cx), str(y2), "300")
    time.sleep(0.6)

def scroll_up():
    w, h = get_screen_size()
    cx = w // 2
    y1 = int(h * 0.35)
    y2 = int(h * 0.70)
    run_adb("shell", "input", "swipe", str(cx), str(y1), str(cx), str(y2), "300")
    time.sleep(0.6)

def get_nodes():
    collapse_statusbar()
    xml_path = "/sdcard/window_dump.xml"
    run_adb("shell", "rm", "-f", xml_path, check=False)
    run_adb("shell", "uiautomator", "dump", xml_path, check=False)
    xml_content = run_adb("shell", "cat", xml_path, check=False)
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
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
    nodes = get_nodes()
    for n in nodes:
        if text_exact and (n["text"].lower() == text_exact.lower() or n["desc"].lower() == text_exact.lower()):
            return n
        if text_contains and (text_contains.lower() in n["text"].lower() or text_contains.lower() in n["desc"].lower()):
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

def screencap(save_name):
    collapse_statusbar()
    target = OUT_DIR / save_name
    cmd = [ADB, "-s", "emulator-5554", "exec-out", "screencap", "-p"]
    res = subprocess.run(cmd, capture_output=True)
    target.write_bytes(res.stdout)
    print(f"Captured: {target}")

CONFIGS = [
    {"name": "compact_320dp", "size": "320x640", "density": "160", "font": "1.0", "rot": "0"},
    {"name": "standard_360dp", "size": "1080x2400", "density": "480", "font": "1.0", "rot": "0"},
    {"name": "modern_393dp", "size": "1080x2400", "density": "440", "font": "1.0", "rot": "0"},
    {"name": "font130_393dp", "size": "1080x2400", "density": "440", "font": "1.3", "rot": "0"},
    {"name": "tablet_768dp", "size": "1536x2048", "density": "320", "font": "1.0", "rot": "0"},
    {"name": "landscape_phone", "size": "2400x1080", "density": "440", "font": "1.0", "rot": "0"},
]

def run_test():
    all_extracted_texts = set()
    
    for cfg in CONFIGS:
        print(f"\n--- Testing Configuration: {cfg['name']} ---")
        run_adb("shell", "wm", "size", cfg["size"])
        run_adb("shell", "wm", "density", cfg["density"])
        run_adb("shell", "settings", "put", "system", "font_scale", cfg["font"])
        run_adb("shell", "settings", "put", "system", "user_rotation", cfg["rot"])
        run_adb("shell", "am", "force-stop", PACKAGE)
        run_adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1")
        time.sleep(3.5)
        collapse_statusbar()
        
        w, h = get_screen_size()
        
        # 1. Geometry Tab Top
        screencap(f"{cfg['name']}_01_geom_top.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        # Scroll Geometry down
        scroll_down()
        screencap(f"{cfg['name']}_02_geom_bottom.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        # 2. Conditions Tab
        cond_tab = find_node(text_exact="CONDITIONS") or find_node(text_contains="COND")
        if cond_tab:
            tap_node(cond_tab)
        else:
            tap(int(w * 0.50), int(h * 0.07))
        time.sleep(0.8)
        screencap(f"{cfg['name']}_03_cond_top.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        scroll_down()
        screencap(f"{cfg['name']}_04_cond_bottom.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        # 3. Results Tab
        res_tab = find_node(text_exact="RESULTS") or find_node(text_contains="RES")
        if res_tab:
            tap_node(res_tab)
        else:
            tap(int(w * 0.83), int(h * 0.07))
        time.sleep(0.8)
        screencap(f"{cfg['name']}_05_res_top.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        scroll_down()
        screencap(f"{cfg['name']}_06_res_middle.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        scroll_down()
        screencap(f"{cfg['name']}_07_res_bottom.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        # 4. Sweep Popup
        scroll_up()
        scroll_up()
        sweep_btn = find_node(text_contains="PARAMETER SWEEP") or find_node(text_contains="SWEEP")
        if sweep_btn:
            tap_node(sweep_btn)
        else:
            tap(int(w * 0.50), int(h * 0.12))
        time.sleep(1.0)
        screencap(f"{cfg['name']}_08_sweep.png")
        for n in get_nodes():
            if n["text"]: all_extracted_texts.add((n["text"], n["class"]))
            
        # close sweep popup
        run_adb("shell", "input", "keyevent", "4")
        time.sleep(0.5)

    # Restore default
    print("\n--- Restoring emulator to default (393x873, density 440, font 1.0, rot 0) ---")
    run_adb("shell", "wm", "size", "reset")
    run_adb("shell", "wm", "density", "reset")
    run_adb("shell", "settings", "put", "system", "font_scale", "1.0")
    run_adb("shell", "settings", "put", "system", "user_rotation", "0")
    run_adb("shell", "am", "force-stop", PACKAGE)
    run_adb("shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1")
    
    print("\n--- All Unique Extracted Texts: ---")
    for t, c in sorted(all_extracted_texts):
        print(f"[{c}] {t}")

if __name__ == "__main__":
    run_test()
