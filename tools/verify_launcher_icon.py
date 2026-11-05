#!/usr/bin/env python3
"""Block a release when its actual APK/AAB launcher pixels are not the Play Store icon."""
from __future__ import annotations

import argparse
from io import BytesIO
import json
import re
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
import zlib
from pathlib import Path
from prepare_launcher_icon import make_foreground

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def fail(message: str) -> None:
    raise AssertionError(message)


def pixels(blob: bytes) -> tuple[tuple[int, int], bytes]:
    """Decode 8-bit RGB/RGBA/indexed PNG, including lossless AAPT recompression."""
    if not blob.startswith(PNG_SIG):
        fail("Launcher asset is not PNG")
    pos, idats, palette, alpha = 8, [], b"", b""
    while pos < len(blob):
        length = struct.unpack_from(">I", blob, pos)[0]
        kind = blob[pos + 4:pos + 8]
        data = blob[pos + 8:pos + 8 + length]
        if len(data) != length or pos + 12 + length > len(blob):
            fail("Truncated PNG")
        if kind == b"IHDR":
            w, h, depth, ctype, comp, filt, interlace = struct.unpack(">IIBBBBB", data)
            if depth != 8 or ctype not in (2, 3, 6) or interlace != 0:
                fail(f"Unsupported launcher PNG: depth={depth} type={ctype} interlace={interlace}")
        elif kind == b"PLTE":
            palette = data
        elif kind == b"tRNS":
            alpha = data
        elif kind == b"IDAT":
            idats.append(data)
        elif kind == b"IEND":
            break
        pos += length + 12
    if not idats:
        fail("PNG has no pixel data")
    channels = {2: 3, 3: 1, 6: 4}[ctype]
    raw = zlib.decompress(b"".join(idats))
    stride = w * channels
    if len(raw) != h * (stride + 1):
        fail("Unexpected PNG decompressed size")
    out, prev, offset = bytearray(), bytearray(stride), 0
    for _ in range(h):
        filter_type = raw[offset]
        offset += 1
        row = bytearray(raw[offset:offset + stride])
        offset += stride
        for i in range(stride):
            a = row[i - channels] if i >= channels else 0
            b = prev[i]
            c = prev[i - channels] if i >= channels else 0
            if filter_type == 0:
                correction = 0
            elif filter_type == 1:
                correction = a
            elif filter_type == 2:
                correction = b
            elif filter_type == 3:
                correction = (a + b) // 2
            elif filter_type == 4:
                p = a + b - c
                da, db, dc = abs(p - a), abs(p - b), abs(p - c)
                correction = a if da <= db and da <= dc else b if db <= dc else c
            else:
                fail(f"Unsupported PNG filter {filter_type}")
            row[i] = (row[i] + correction) & 255
        if ctype == 6:
            out.extend(row)
        elif ctype == 2:
            for i in range(0, len(row), 3):
                out.extend(row[i:i + 3])
                out.append(255)
        else:
            for idx in row:
                base = idx * 3
                if base + 3 > len(palette):
                    fail("Invalid PNG palette index")
                out.extend(palette[base:base + 3])
                out.append(alpha[idx] if idx < len(alpha) else 255)
        prev = row
    return (w, h), bytes(out)


def check_sources(root: Path) -> None:
    content = (root / "RotorCalculator.b4a").read_text(encoding="utf-8-sig")
    required = (
        '#AdditionalRes: ../icon',
        'SetApplicationAttribute(android:icon, "@mipmap/ic_launcher")',
        'SetApplicationAttribute(android:roundIcon, "@mipmap/ic_launcher")',
        'CreateResource(mipmap-anydpi-v26, ic_launcher.xml,',
        '@color/rotor_launcher_background',
        '@mipmap/foreground',
    )
    for item in required:
        if item not in content:
            fail(f"B4A is missing adaptive launcher requirement: {item}")
    if 'SetApplicationAttribute(android:icon, "@drawable/icon")' in content:
        fail("Stale drawable icon is still declared as Android launcher")
    legacy = (root / "store/icon.png").read_bytes()
    if pixels(legacy)[0] != (512, 512):
        fail("Official Store launcher image must be 512x512")
    high, low = make_foreground(root / "Files/icon_header.png")
    if (root / "web/public/icon.png").read_bytes() != legacy:
        fail("Web and Play Store source icons diverged")
    if (root / "icon/mipmap/ic_launcher.png").read_bytes() != legacy:
        fail("Generated legacy launcher differs from official Store image")
    for relative, expected in (
        ("icon/mipmap/foreground.png", low),
        ("icon/mipmap-xxxhdpi/foreground.png", high),
    ):
        result = BytesIO()
        expected.save(result, format="PNG", optimize=True)
        if pixels((root / relative).read_bytes()) != pixels(result.getvalue()):
            fail(f"Generated adaptive layer is missing or stale: {relative}")
    color_file = root / "icon/values/rotor_launcher_background.xml"
    colors = ET.parse(color_file).getroot()
    if colors.find("color[@name='rotor_launcher_background']") is None:
        fail("Adaptive launcher background color is missing")
    version = re.search(r"#VersionName:\s*([\d.]+)", content)
    code = re.search(r"#VersionCode:\s*(\d+)", content)
    if not version or not code or int(code.group(1)) < 21:
        fail("Android versionCode must exceed published 1.35 (20)")
    meta = json.loads((root / f"docs/release-{version.group(1)}.json").read_text(encoding="utf-8"))
    web = json.loads((root / "web/package.json").read_text(encoding="utf-8"))
    if meta["versionCode"] != int(code.group(1)) or web["version"] != version.group(1) + ".0":
        fail("Release B4A/web/JSON versions do not match")
    print(f"PASS source launcher images and metadata: {version.group(1)} (code {code.group(1)})")


def check_archive(path: Path, root: Path, prefix: str) -> None:
    """Compare the compiled PNG pixels; AAPT2 appends -v4 to density folders."""
    targets = {
        "mipmap": ("ic_launcher.png", root / "store/icon.png"),
        "mipmap-xxxhdpi": ("foreground.png", root / "icon/mipmap-xxxhdpi/foreground.png"),
    }
    with zipfile.ZipFile(path) as zf:
        names = set(zf.namelist())
        icon_entries = sorted(n for n in names if n.startswith(f"{prefix}res/mipmap"))
        descriptor = f"{prefix}res/mipmap-anydpi-v26/ic_launcher.xml"
        if descriptor not in names:
            fail(f"{path.name}: missing adaptive launcher descriptor {descriptor}; found: {icon_entries}")
        for folder, (basename, expected_file) in targets.items():
            expression = re.compile(
                re.escape(f"{prefix}res/{folder}") + r"(?:-v\d+)?/" + re.escape(basename)
            )
            entries = sorted(n for n in icon_entries if expression.fullmatch(n))
            if len(entries) != 1:
                fail(
                    f"{path.name}: expected exactly one packaged {folder}/{basename}, "
                    f"found {entries}; mipmap entries: {icon_entries}"
                )
            entry = entries[0]
            if pixels(zf.read(entry)) != pixels(expected_file.read_bytes()):
                fail(f"{path.name}: wrong PACKAGED launcher pixels in {entry}")
            print(f"PASS {path.name}: {entry} decoded pixels match canonical artwork")
    print(f"PASS {path.name}: Android launcher and adaptive assets validated")


def check_aapt(apk: Path, aapt: Path) -> None:
    def output(*args: str) -> str:
        return subprocess.run([str(aapt), *args, str(apk)], text=True, capture_output=True,
                              check=True, encoding="utf-8", errors="replace").stdout
    badging = output("dump", "badging")
    if not re.search(r"application-icon-\d+:'res/mipmap", badging):
        fail("APK does not advertise a mipmap launcher icon")
    resources = output("dump", "resources")
    for name in ("mipmap/ic_launcher", "mipmap/foreground", "color/rotor_launcher_background"):
        if name not in resources:
            fail(f"aapt resources missing {name}")
    print(f"PASS {apk.name}: Android resource table points to adaptive mipmap icon")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--apk", type=Path)
    parser.add_argument("--aab", type=Path)
    parser.add_argument("--aapt", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    check_sources(root)
    if args.apk:
        check_archive(args.apk, root, "")
        if not args.aapt:
            parser.error("--aapt is required with --apk")
        check_aapt(args.apk, args.aapt)
    if args.aab:
        check_archive(args.aab, root, "base/")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, FileNotFoundError, ValueError, zipfile.BadZipFile, subprocess.CalledProcessError) as error:
        print(f"FAIL launcher verification: {error}", file=sys.stderr)
        sys.exit(1)
