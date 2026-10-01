"""RotorCalculator icon generator (PIL, 4x supersampling).

Outputs Icons/*, Objects/res adaptive + legacy resources, store/icon.png and
qa-results/icon_preview.png.  Run: python tools/generate_icon.py
"""
from __future__ import annotations

import math
import os
import stat
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SS = 4
CYAN, CYAN_D, CYAN_L = (34, 211, 238), (10, 110, 150), (190, 248, 255)
AMBER = (255, 176, 32)
BG1, BG2 = (22, 38, 58), (6, 9, 14)


def bg_gradient(n):
    im = Image.new("RGB", (n, n))
    px = im.load()
    for y in range(n):
        for x in range(n):
            t = min(1.0, math.hypot(x - n * .35, y - n * .30) / n)
            px[x, y] = tuple(int(BG1[i] + (BG2[i] - BG1[i]) * t) for i in range(3))
    return im


def blade_poly(cx, cy, R, rot, r_a, r_b, steps=24):
    """Tapered, swept blade between radial fractions r_a..r_b of R."""
    left, right = [], []
    for i in range(steps + 1):
        f = r_a + (r_b - r_a) * i / steps
        k = max(0.0, (f - .10) / .90)
        half = (0.140 - 0.068 * k) * R          # half chord: root -> tip taper
        a = rot - 0.32 * k * k                   # trailing sweep
        r = f * R
        ux, uy = math.cos(a), math.sin(a)        # radial
        nx, ny = -uy, ux                         # normal
        cxp, cyp = cx + r * ux, cy + r * uy
        left.append((cxp + nx * half * 0.75, cyp + ny * half * 0.75))   # leading edge
        right.append((cxp - nx * half * 1.25, cyp - ny * half * 1.25))  # trailing edge
    return left + right[::-1]


def rotor_layer(n, R_frac, mono=False):
    cx = cy = n / 2
    R = n * R_frac
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    # motion trail: fading arcs behind each blade tip
    trail = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    td = ImageDraw.Draw(trail)
    for b in range(4):
        base = 90 * b - 90 + 18
        for j in range(16):
            a1 = base - 24 - j * 3.0
            peak = 90 if mono else 150
            alpha = int(peak * (1 - j / 16) ** 1.6)
            col = (255, 255, 255, alpha) if mono else CYAN + (alpha,)
            rr = R * 0.90
            td.arc((cx - rr, cy - rr, cx + rr, cy + rr), a1 - 3.2, a1, fill=col, width=int(R * 0.07))
    out = Image.alpha_composite(out, trail)

    # radial tone for blades (lighter at root, deeper at tip)
    tone = Image.new("RGBA", (n, n), CYAN + (255,))
    gd = ImageDraw.Draw(tone)
    for i in range(48):
        f = 1.05 - i / 47 * 0.95
        t = max(0.0, min(1.0, (f - .1) / .9))
        col = tuple(int(CYAN_L[c] * (1 - t) * .25 + CYAN[c] * (1 - .35 * t) * (1 - (1 - t) * .25 * 0)
                        + CYAN_D[c] * .35 * t) for c in range(3))
        col = tuple(min(255, v) for v in col)
        gd.ellipse((cx - f * R, cy - f * R, cx + f * R, cy + f * R), fill=col + (255,))

    for b in range(4):
        rot = math.radians(90 * b - 90 + 18)
        poly = blade_poly(cx, cy, R, rot, 0.08, 1.0)
        m = Image.new("L", (n, n), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        if mono:
            w = Image.new("RGBA", (n, n), (255, 255, 255, 255))
        else:
            w = tone.copy()
        w.putalpha(m)
        out = Image.alpha_composite(out, w)
        d = ImageDraw.Draw(out)
        if not mono:
            lead = [p for p in poly[:25]]
            d.line(lead, fill=CYAN_L + (255,), width=max(2, int(R * .022)), joint="curve")
        if b == 0:  # BET identity: one highlighted blade element (dr)
            sp = blade_poly(cx, cy, R, rot, 0.55, 0.72, 8)
            s = Image.new("RGBA", (n, n), (0, 0, 0, 0))
            ImageDraw.Draw(s).polygon(sp, fill=(255, 255, 255, 120) if mono else AMBER + (255,))
            if mono:  # punch a clear gap instead so the strip reads as a cut-out
                cut = Image.new("L", (n, n), 0)
                ImageDraw.Draw(cut).polygon(sp, fill=255)
                a = out.getchannel("A")
                a.paste(0, mask=cut)
                out.putalpha(a)
                s = Image.new("RGBA", (n, n), (0, 0, 0, 0))
                ImageDraw.Draw(s).polygon(sp, fill=(255, 255, 255, 110))
            out = Image.alpha_composite(out, s)
    d = ImageDraw.Draw(out)
    hr = R * 0.17
    if mono:
        d.ellipse((cx - hr, cy - hr, cx + hr, cy + hr), fill=(255, 255, 255, 255))
    else:
        g = hr * 1.2
        d.ellipse((cx - g, cy - g, cx + g, cy + g), fill=(6, 9, 14, 255))
        d.ellipse((cx - hr, cy - hr, cx + hr, cy + hr), fill=CYAN_L + (255,))
        h2 = hr * .42
        d.ellipse((cx - h2, cy - h2, cx + h2, cy + h2), fill=(10, 20, 32, 255))
    return out


def down(im, n):
    return im.resize((n, n), Image.LANCZOS)


def full_icon(n, R_frac=0.40):
    big = n * SS
    base = bg_gradient(max(64, n)).resize((big, big), Image.BICUBIC).convert("RGBA")
    return down(Image.alpha_composite(base, rotor_layer(big, R_frac)), n).convert("RGB")


def adaptive(kind, n=432):
    if kind == "bg":
        return bg_gradient(n).convert("RGBA")
    return down(rotor_layer(n * SS, 0.30, mono=(kind == "mono")), n)  # tips well inside 66% zone


def rounded(im, r_frac=0.22):
    n = im.width
    m = Image.new("L", (n * SS, n * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, n * SS - 1, n * SS - 1), radius=int(n * SS * r_frac), fill=255)
    out = im.convert("RGBA")
    out.putalpha(m.resize((n, n), Image.LANCZOS))
    return out


def write_ro(img, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        os.chmod(path, stat.S_IWRITE)
    if isinstance(img, str):
        path.write_text(img, encoding="utf-8")
    else:
        img.save(path, optimize=True)
    os.chmod(path, stat.S_IREAD)


def mask_shape(n, shape):
    m = Image.new("L", (n * SS, n * SS), 0)
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse((0, 0, n * SS - 1, n * SS - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, n * SS - 1, n * SS - 1), radius=int(n * SS * .30), fill=255)
    return m.resize((n, n), Image.LANCZOS)


def masked(n, shape, wall):
    comp = Image.alpha_composite(adaptive("bg"), adaptive("fg"))
    s = int(n / 72 * 108)
    comp = comp.resize((s, s), Image.LANCZOS)
    o = (s - n) // 2
    comp = comp.crop((o, o, o + n, o + n))
    comp.putalpha(mask_shape(n, shape))
    tile = Image.new("RGBA", (n + 20, n + 20), wall + (255,))
    tile.alpha_composite(comp, (10, 10))
    return tile


def main():
    icons = ROOT / "Icons"
    i512 = full_icon(512)
    i512.save(icons / "icon_512.png", optimize=True)
    legacy = {}
    for s in (192, 96, 72, 48):
        legacy[s] = rounded(full_icon(s))
        legacy[s].save(icons / f"icon_{s}.png", optimize=True)
    res = ROOT / "Objects" / "res"
    for k, s in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        write_ro(rounded(full_icon(s)), res / f"drawable-{k}" / "icon.png")
    write_ro(rounded(full_icon(96)), res / "drawable" / "icon.png")
    layers = {k: adaptive(k) for k in ("fg", "bg", "mono")}
    for k, name in (("fg", "icon_fg"), ("bg", "icon_bg"), ("mono", "icon_mono")):
        write_ro(layers[k], res / "drawable-nodpi" / f"{name}.png")
        layers[k].save(icons / f"adaptive_{k}_432.png")
    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           '    <background android:drawable="@drawable/icon_bg"/>\n'
           '    <foreground android:drawable="@drawable/icon_fg"/>\n'
           '    <monochrome android:drawable="@drawable/icon_mono"/>\n'
           '</adaptive-icon>\n')
    write_ro(xml, res / "drawable-anydpi-v26" / "icon.xml")
    i512.save(ROOT / "store" / "icon.png", optimize=True)

    W, H = 1200, 900
    sheet = Image.new("RGB", (W, H), (30, 30, 34))
    sheet.paste(i512.resize((360, 360), Image.LANCZOS), (20, 20))
    x = 400
    for s in (192, 96, 48):
        sheet.paste(legacy[s], (x, 20), legacy[s])
        x += s + 24
    y = 400
    for wall in ((18, 24, 38), (236, 238, 242)):
        x = 20
        for shape in ("circle", "squircle"):
            for n in (192, 96, 48):
                t = masked(n, shape, wall)
                sheet.paste(t, (x, y))
                x += t.width + 8
        y += 240
    mm = Image.new("RGBA", (432, 432), (60, 60, 70, 255))
    mm.alpha_composite(layers["mono"])
    sheet.paste(mm.convert("RGB").resize((200, 200)), (980, 400))
    (ROOT / "qa-results").mkdir(exist_ok=True)
    sheet.save(ROOT / "qa-results" / "icon_preview.png")


if __name__ == "__main__":
    main()
