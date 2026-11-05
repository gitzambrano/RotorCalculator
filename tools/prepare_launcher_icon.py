#!/usr/bin/env python3
"""Create B4A launcher resources from the two canonical 512x512 icon images."""
from __future__ import annotations
import argparse
import shutil
import struct
from pathlib import Path

BACKGROUND_XML = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="rotor_launcher_background">#101827</color>
</resources>
'''

def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()[:24]
    if len(data) != 24 or not data.startswith(b"\x89PNG\r\n\x1a\n") or data[12:16] != b"IHDR":
        raise ValueError(f"Not a PNG: {path}")
    return struct.unpack(">II", data[16:24])

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    root = args.root.resolve()
    official = root / "store/icon.png"
    maskable = root / "web/public/icon-maskable-512.png"
    for path in (official, maskable):
        if png_size(path) != (512, 512):
            raise ValueError(f"Expected 512x512 canonical artwork: {path}")
    resources = (
        (official, root / "icon/mipmap/ic_launcher.png"),
        (maskable, root / "icon/mipmap/foreground.png"),
        (maskable, root / "icon/mipmap-xxxhdpi/foreground.png"),
    )
    for source, target in resources:
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or source.read_bytes() != target.read_bytes():
            shutil.copyfile(source, target)
        print(f"Launcher resource: {target.relative_to(root)}")
    xml = root / "icon/values/rotor_launcher_background.xml"
    xml.parent.mkdir(parents=True, exist_ok=True)
    if not xml.exists() or xml.read_text(encoding="utf-8") != BACKGROUND_XML:
        xml.write_text(BACKGROUND_XML, encoding="utf-8", newline="\n")
    print(f"Launcher resource: {xml.relative_to(root)}")

if __name__ == "__main__":
    main()
