#!/usr/bin/env python3
"""Generate legacy and adaptive Android launcher resources for B4A.

store/icon.png is the canonical Play Store image. The adaptive foreground
uses the same rotor emblem from Files/icon_header.png, centered transparently
within the Android 108dp layer and 72dp safe zone.
Android 13+ monochrome layer provides the native silhouette for Themed Icons.
Fallback drawables in Objects/res/drawable* are pre-populated to eliminate
any default B4A template icon injection.
"""
from __future__ import annotations

import argparse
import shutil
import struct
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is needed for Android icon generation: python -m pip install Pillow") from exc

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


def make_foreground(header: Path) -> tuple[Image.Image, Image.Image]:
    """Make 432px xxxhdpi and 108px baseline RGBA foregrounds."""
    with Image.open(header) as original:
        emblem = original.convert("RGBA")
    if emblem.getextrema()[3][0] == 255:
        raise ValueError("The rotor emblem must have a transparent background")
    emblem = emblem.resize((276, 276), Image.Resampling.LANCZOS)
    high = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    high.alpha_composite(emblem, (78, 78))
    low = high.resize((108, 108), Image.Resampling.LANCZOS)
    return high, low


def make_monochrome(high: Image.Image, low: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Make 432px xxxhdpi and 108px baseline monochrome layers for Android Themed Icons."""
    high_mono = Image.new("RGBA", high.size, (255, 255, 255, 255))
    high_mono.putalpha(high.getchannel("A"))
    low_mono = Image.new("RGBA", low.size, (255, 255, 255, 255))
    low_mono.putalpha(low.getchannel("A"))
    return high_mono, low_mono


def pre_populate_drawables(root: Path, official: Path) -> None:
    """Pre-populate Objects/res/drawable* so B4A never writes its default hdpi_icon."""
    densities = {
        "drawable": 96,
        "drawable-mdpi": 48,
        "drawable-hdpi": 72,
        "drawable-xhdpi": 96,
        "drawable-xxhdpi": 144,
        "drawable-xxxhdpi": 192,
    }
    with Image.open(official) as im:
        for folder, size in densities.items():
            dest = root / "Objects/res" / folder / "icon.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            resized = im.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(dest, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    root = args.root.resolve()
    official = root / "store/icon.png"
    header = root / "Files/icon_header.png"
    if png_size(official) != (512, 512) or png_size(header) != (192, 192):
        raise ValueError("Unexpected source launcher artwork dimensions")
    legacy = root / "icon/mipmap/ic_launcher.png"
    legacy.parent.mkdir(parents=True, exist_ok=True)
    if not legacy.exists() or legacy.read_bytes() != official.read_bytes():
        shutil.copyfile(official, legacy)
    print(f"Launcher resource: {legacy.relative_to(root)}")

    # Keep Files/icon.png aligned
    files_icon = root / "Files/icon.png"
    if not files_icon.exists() or files_icon.read_bytes() != official.read_bytes():
        shutil.copyfile(official, files_icon)
        print(f"Updated Files/icon.png from canonical store artwork")

    high, low = make_foreground(header)
    high_mono, low_mono = make_monochrome(high, low)

    for asset, path in (
        (high, root / "icon/mipmap-xxxhdpi/foreground.png"),
        (low, root / "icon/mipmap/foreground.png"),
        (high_mono, root / "icon/mipmap-xxxhdpi/monochrome.png"),
        (low_mono, root / "icon/mipmap/monochrome.png"),
    ):
        path.parent.mkdir(parents=True, exist_ok=True)
        asset.save(path, format="PNG", optimize=True)
        print(f"Launcher resource: {path.relative_to(root)}")

    xml = root / "icon/values/rotor_launcher_background.xml"
    xml.parent.mkdir(parents=True, exist_ok=True)
    if not xml.exists() or xml.read_text(encoding="utf-8") != BACKGROUND_XML:
        xml.write_text(BACKGROUND_XML, encoding="utf-8", newline="\n")
    print(f"Launcher resource: {xml.relative_to(root)}")

    pre_populate_drawables(root, official)
    print("Pre-populated Objects/res/drawable* with canonical rotor icons")


if __name__ == "__main__":
    main()
