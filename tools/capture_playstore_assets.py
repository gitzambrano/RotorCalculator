"""Capture real screenshots of the installed, validated release APK on an emulator.
Resets disposable emulator data; never captures the web prototype.
"""
import argparse
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

PACKAGE = 'flightdyn.rotorcalculator'


def adb(*args, binary=False):
    return subprocess.check_output(['adb', *args], text=not binary)


def tap(text):
    remote = '/sdcard/rotor-store-ui.xml'
    adb('shell', 'rm', '-f', remote)
    adb('shell', 'uiautomator', 'dump', remote)
    root = ET.fromstring(adb('shell', 'cat', remote))
    for node in root.iter('node'):
        if node.get('text', '').strip() == text:
            x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds')))
            adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
            time.sleep(.7)
            return
    raise RuntimeError(f'Visible control not found: {text}')


def capture(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(('GEOMETRY', 'CONDITIONS', 'RESULTS'), 1):
        tap(name)
        (folder / f'{index:02d}-{name.lower()}.png').write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
    tap('CONDITIONS')
    tap('OPEN PARAMETER SWEEP')
    (folder / '04-sweep.png').write_bytes(adb('exec-out', 'screencap', '-p', binary=True))
    adb('shell', 'input', 'keyevent', '4')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reset-emulator-data', action='store_true', required=True)
    parser.parse_args()
    if 'emulator-' not in adb('get-serialno'):
        raise RuntimeError('This workflow requires a disposable emulator')
    try:
        adb('shell', 'pm', 'clear', PACKAGE)
        adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0')
        adb('shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0')
        for folder, size, density, rotation in (
            ('phone-screenshots', '1080x1920', '480', '0'),
            ('tablet-screenshots', '1920x1080', '320', '1'),
        ):
            adb('shell', 'am', 'force-stop', PACKAGE)
            adb('shell', 'wm', 'size', size)
            adb('shell', 'wm', 'density', density)
            adb('shell', 'settings', 'put', 'system', 'user_rotation', rotation)
            adb('shell', 'monkey', '-p', PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
            time.sleep(2)
            capture(Path(__file__).resolve().parents[1] / 'store' / folder)
    finally:
        adb('shell', 'wm', 'size', 'reset')
        adb('shell', 'wm', 'density', 'reset')
        adb('shell', 'settings', 'put', 'system', 'user_rotation', '0')


if __name__ == '__main__':
    main()
