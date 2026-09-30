"""Generate the Play Store feature graphic from RotorCalculator's visual language.

Requires Pillow. The output is a 1024x500 opaque PNG, as required by Play.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "store" / "feature-graphic.png"
W, H = 1024, 500


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    path = Path("C:/Windows/Fonts") / name
    if not path.exists():
        path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(str(path), size)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    im = Image.new("RGB", (W, H))
    px = im.load()
    for y in range(H):
        for x in range(W):
            t = x / (W - 1)
            glow = max(0.0, 1.0 - math.hypot((x - 735) / 540, (y - 210) / 420))
            px[x, y] = (
                int(13 + 9 * t + 4 * glow),
                int(31 + 16 * t + 26 * glow),
                int(54 + 21 * t + 34 * glow),
            )

    d = ImageDraw.Draw(im)
    navy = (19, 64, 88)
    cyan = (0, 220, 238)
    cyan_soft = (80, 201, 222)
    white = (235, 248, 250)
    muted = (151, 188, 202)
    green = (88, 229, 173)

    # Restrained rotor construction lines echo the app icon without repeating it.
    cx, cy, radius = 746, 250, 182
    for r, color, width in ((218, navy, 2), (radius, cyan_soft, 3), (130, navy, 2), (41, cyan, 3)):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=width)
    for angle in (18, 108, 198, 288):
        a = math.radians(angle)
        inner, outer = 49, 174
        x1, y1 = cx + inner * math.cos(a), cy + inner * math.sin(a)
        x2, y2 = cx + outer * math.cos(a), cy + outer * math.sin(a)
        d.line((x1, y1, x2, y2), fill=(54, 131, 161), width=17)
        d.line((x1, y1, x2, y2), fill=(21, 75, 102), width=11)
    d.ellipse((cx - 15, cy - 15, cx + 15, cy + 15), fill=(18, 53, 78), outline=cyan, width=3)
    d.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill=white)

    # Small sweep trace gives the graphic an engineering rather than lifestyle cue.
    trace = [(600, 395), (630, 382), (665, 365), (700, 356), (735, 348),
             (770, 335), (805, 313), (840, 276), (876, 220), (910, 144)]
    d.line(trace, fill=green, width=4, joint="curve")
    d.ellipse((594, 389, 606, 401), fill=green)
    d.ellipse((904, 138, 916, 150), fill=green)

    d.rounded_rectangle((86, 88, 422, 97), radius=4, fill=cyan)
    d.text((85, 126), "RotorCalculator", font=font(52, True), fill=white)
    d.text((88, 209), "Rotor performance analysis", font=font(28), fill=muted)
    d.text((88, 258), "Geometry  ·  Conditions  ·  Results", font=font(22), fill=white)
    d.line((88, 331, 467, 331), fill=(58, 119, 143), width=2)
    d.text((88, 356), "Engineering inputs. Clear outputs.", font=font(22), fill=cyan_soft)
    im.save(OUTPUT, optimize=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
