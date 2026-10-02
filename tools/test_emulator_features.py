import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ADB = r"C:\Android\platform-tools\adb.exe"
DEVICE = "emulator-5554"

def adb(*args, check=True):
    cmd = [ADB, "-s", DEVICE, *args]
    res = subprocess.run(cmd, capture_output=True, text=True, errors="replace", check=check)
    return res.stdout.strip()

def dump_ui():
    adb("shell", "uiautomator", "dump", "/sdcard/window_dump.xml")
    xml_str = adb("shell", "cat", "/sdcard/window_dump.xml")
    m = re.search(r"(<hierarchy.*?</hierarchy>)", xml_str, re.DOTALL)
    if m:
        xml_clean = m.group(1)
    else:
        xml_clean = xml_str[xml_str.find("<hierarchy"):xml_str.rfind("</hierarchy>") + 12]
    return ET.fromstring(xml_clean)

def find_node(root, text=None, class_name=None):
    for node in root.iter("node"):
        if text is not None and node.attrib.get("text") == text:
            return node
        if class_name is not None and node.attrib.get("class") == class_name:
            return node
    return None

def find_nodes_by_text(root, text_regex):
    matches = []
    r = re.compile(text_regex)
    for node in root.iter("node"):
        txt = node.attrib.get("text", "")
        if r.search(txt):
            matches.append(node)
    return matches

def get_bounds(node):
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.attrib["bounds"])
    if m:
        x1, y1, x2, y2 = map(int, m.groups())
        return (x1, y1, x2, y2), ((x1 + x2) // 2, (y1 + y2) // 2)
    return None, None

def tap_node(node):
    _, (cx, cy) = get_bounds(node)
    adb("shell", "input", "tap", str(cx), str(cy))
    time.sleep(0.8)

def test_features():
    print("=== RESTARTING APP FOR CLEAN TEST RUN ===")
    adb("shell", "am", "force-stop", "flightdyn.rotorcalculator")
    time.sleep(0.5)
    adb("shell", "am", "start", "-n", "flightdyn.rotorcalculator/.main")
    time.sleep(2.5)

    print("=== TEST 1: Check Tabs & Compressibility Button ===")
    root = dump_ui()
    geom_tab = find_node(root, text="GEOMETRY")
    assert geom_tab is not None, "GEOMETRY tab not found!"
    tap_node(geom_tab)
    time.sleep(1)

    # Scroll down to reveal Compressibility and Action rows
    adb("shell", "input", "swipe", "500", "1800", "500", "600", "300")
    time.sleep(1)

    root = dump_ui()
    # Check compressibility button
    comp_nodes = find_nodes_by_text(root, r"^(On|Off)$")
    print("Compressibility buttons found:", [n.attrib["text"] for n in comp_nodes])
    pg_nodes = find_nodes_by_text(root, r"Prandtl-Glauert")
    print("Prandtl-Glauert nodes on main geometry screen:", [n.attrib["text"] for n in pg_nodes])
    assert len(pg_nodes) == 0, f"Found Prandtl-Glauert on geometry button: {[n.attrib['text'] for n in pg_nodes]}"
    assert len(comp_nodes) > 0, "No 'On' or 'Off' button found on screen!"
    print("PASS: Compressibility button displays strictly 'On' or 'Off'!")

    # Scroll back up to the top
    adb("shell", "input", "swipe", "500", "600", "500", "1800", "300")
    time.sleep(1)

    print("\n=== TEST 2: Swipe Navigation ===")
    # Swipe Left (from right to left) -> should go from GEOMETRY to CONDITIONS
    adb("shell", "input", "swipe", "900", "500", "150", "500", "200")
    time.sleep(1.2)
    root = dump_ui()
    cond_input = find_nodes_by_text(root, r"(AIRSPEED|Trim Condition|Inflow Model|Advance Ratio|μ)")
    print("Conditions indicators found:", len(cond_input))
    assert len(cond_input) > 0, "Swipe left from GEOMETRY did not transition to CONDITIONS!"
    print("PASS: Swiping left transitioned from GEOMETRY to CONDITIONS!")

    # Swipe Left again -> should go to RESULTS
    adb("shell", "input", "swipe", "900", "500", "150", "500", "200")
    time.sleep(1.2)
    root = dump_ui()
    res_input = find_nodes_by_text(root, r"(OPEN PARAMETER SWEEP|Shaft Power|Thrust T|POWER|FORCES)")
    print("Results indicators found:", len(res_input))
    assert len(res_input) > 0, "Swipe left from CONDITIONS did not transition to RESULTS!"
    print("PASS: Swiping left transitioned from CONDITIONS to RESULTS!")

    # Swipe Right -> should go back to CONDITIONS
    adb("shell", "input", "swipe", "150", "500", "900", "500", "200")
    time.sleep(1.2)
    root = dump_ui()
    cond_input2 = find_nodes_by_text(root, r"(AIRSPEED|Trim Condition|Inflow Model|Advance Ratio|μ)")
    assert len(cond_input2) > 0, "Swipe right from RESULTS did not transition back to CONDITIONS!"
    print("PASS: Swiping right transitioned from RESULTS back to CONDITIONS!")

    # Swipe Right again -> should go back to GEOMETRY
    adb("shell", "input", "swipe", "150", "500", "900", "500", "200")
    time.sleep(1.2)
    root = dump_ui()
    geom_input = find_nodes_by_text(root, r"(Radius R|Blades Nb|Root Cutout|SAVE)")
    assert len(geom_input) > 0, "Swipe right from CONDITIONS did not transition back to GEOMETRY!"
    print("PASS: Swiping right transitioned from CONDITIONS back to GEOMETRY!")

    print("\n=== TEST 3: Settings Import/Export with JSON ===")
    root = dump_ui()
    menu_btn = find_nodes_by_text(root, r"⋮")
    if not menu_btn:
        for node in root.iter("node"):
            bounds, (cx, cy) = get_bounds(node)
            if bounds and cx > 900 and cy < 250 and node.attrib.get("clickable") == "true":
                menu_btn = [node]
                break
    assert len(menu_btn) > 0, "3-dot menu button not found!"
    tap_node(menu_btn[0])
    time.sleep(1)

    root = dump_ui()
    settings_opt = find_nodes_by_text(root, r"(Settings|Configuration)")
    assert len(settings_opt) > 0, "Settings option not found in menu!"
    tap_node(settings_opt[0])
    time.sleep(1)

    root = dump_ui()
    export_btn = find_nodes_by_text(root, r"EXPORT")
    assert len(export_btn) > 0, "EXPORT button not found in Settings!"
    tap_node(export_btn[0])
    time.sleep(1)

    root = dump_ui()
    json_opt = find_nodes_by_text(root, r"JSON")
    txt_opt = find_nodes_by_text(root, r"Text")
    print("Export format options found - JSON:", len(json_opt), "Text:", len(txt_opt))
    assert len(json_opt) > 0 and len(txt_opt) > 0, "Export format options (JSON / Text) not displayed!"
    print("PASS: Export options dialog displays JSON and Text format choices!")

    adb("shell", "input", "keyevent", "4") # KEYCODE_BACK
    time.sleep(0.8)
    adb("shell", "input", "keyevent", "4") # Close settings
    time.sleep(0.8)

    print("\n=== TEST 4: Sweep CSV Export with Choice ===")
    res_tab = find_node(dump_ui(), text="RESULTS")
    tap_node(res_tab)
    time.sleep(1)

    root = dump_ui()
    sweep_btn = find_nodes_by_text(root, r"OPEN PARAMETER SWEEP")
    assert len(sweep_btn) > 0, "OPEN PARAMETER SWEEP button not found!"
    tap_node(sweep_btn[0])
    time.sleep(1.5)

    root = dump_ui()
    export_csv = find_nodes_by_text(root, r"^(CSV|EXPORT CSV)$")
    assert len(export_csv) > 0, "CSV button not found in Sweep!"
    tap_node(export_csv[0])
    time.sleep(1)

    root = dump_ui()
    full_csv_opt = find_nodes_by_text(root, r"Full Dataset CSV")
    chart_csv_opt = find_nodes_by_text(root, r"Current Chart CSV")
    print("Sweep CSV export options found - Full:", len(full_csv_opt), "Chart:", len(chart_csv_opt))
    assert len(full_csv_opt) > 0 and len(chart_csv_opt) > 0, "Sweep CSV export options not displayed!"
    print("PASS: Sweep CSV export offers Current Chart CSV and Full Dataset CSV!")

    adb("shell", "input", "keyevent", "4") # dismiss dialog
    time.sleep(0.8)
    adb("shell", "input", "keyevent", "4") # close sweep popup
    time.sleep(0.8)

    print("\nALL EMULATOR TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_features()
