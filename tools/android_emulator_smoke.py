#!/usr/bin/env python3
"""Native Android UI acceptance smoke for an ephemeral-key QA APK.

Runs ONLY against a disposable emulator. No Google Play key and no network
application traffic required. Saves actual device screenshots for inspection.
"""
from __future__ import annotations
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scratch" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)


def adb(*args: str, timeout: int = 45) -> str:
    p = subprocess.run(["adb", *args], text=True, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT, timeout=timeout, check=False)
    if p.returncode:
        raise RuntimeError(f"adb {' '.join(args)} failed ({p.returncode}): {p.stdout}")
    return p.stdout


def capture(name: str) -> list[dict[str, str]]:
    adb("shell", "uiautomator", "dump", "/sdcard/window.xml", timeout=90)
    xml = adb("shell", "cat", "/sdcard/window.xml", timeout=30)
    (OUT / (name + ".xml")).write_text(xml, encoding="utf-8")
    image = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True,
                           timeout=40, check=True).stdout
    (OUT / (name + ".png")).write_bytes(image)
    return [e.attrib for e in ET.fromstring(xml).iter("node")]


def matches(nodes: list[dict[str, str]], text: str, contains: bool = False) -> list[dict[str, str]]:
    return [n for n in nodes if
            (text.lower() in n.get("text", "").lower() if contains
             else n.get("text", "").strip().lower() == text.lower())]


def tap_node(node: dict[str, str]) -> None:
    bounds = node.get("bounds", "")
    m = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
    if not m:
        raise AssertionError(f"Cannot determine target bounds: {node}")
    x1, y1, x2, y2 = map(int, m.groups())
    if x2 <= x1 or y2 <= y1:
        raise AssertionError(f"Invalid touch target bounds: {bounds}")
    adb("shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2))


def main(apk: str) -> None:
    print(adb("install", "-r", apk, timeout=160), flush=True)
    adb("shell", "am", "force-stop", "flightdyn.rotorcalculator")
    launch = adb("shell", "monkey", "-p", "flightdyn.rotorcalculator", "-c",
                 "android.intent.category.LAUNCHER", "1", timeout=60)
    print("Launch:", launch.splitlines()[-3:], flush=True)
    time.sleep(4)
    home = capture("android-home")
    results_tab = matches(home, "RESULTS")
    assert results_tab, f"No RESULTS tab in Android accessibility tree. Visible text: {[x.get('text') for x in home if x.get('text')]}"
    tap_node(results_tab[0])
    time.sleep(1)
    results = capture("android-results")
    assert matches(results, "FORCES"), "Results page missing FORCES section after tab navigation."
    forces = matches(results, "N")
    assert forces, "No force unit N is accessible on the Results page."
    # Native clickable labels keep their original button-free appearance.
    clickable = [node for node in forces if node.get("clickable") == "true"]
    target = (clickable or forces)[0]
    tap_node(target)
    time.sleep(1)
    picker = capture("android-unit-picker")
    kgf = matches(picker, "kgf")
    assert kgf, f"Force picker lacks kgf. Visible: {[n.get('text') for n in picker if n.get('text')]}"
    tap_node(kgf[0])
    time.sleep(1)
    changed = capture("android-kgf-selected")
    assert matches(changed, "kgf"), "Selected unit kgf is not reflected immediately in Results."
    print("PASS native Android: launch, tabs, results, N -> kgf picker, immediate label change", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python tools/android_emulator_smoke.py path/to/qa.apk")
    main(sys.argv[1])
