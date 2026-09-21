#!/usr/bin/env python3
import os
import shutil
from PIL import Image

src_img = r"C:\Users\gusta\.gemini\antigravity\brain\78912c1f-8d2d-4bd5-8720-df0e29d8e926\rotor_calculator_icon_1789946805957.jpg"
base_dir = r"c:\Projetos\RotorCalculator"

icons_dir = os.path.join(base_dir, "Icons")
files_dir = os.path.join(base_dir, "Files")

os.makedirs(icons_dir, exist_ok=True)
os.makedirs(files_dir, exist_ok=True)

if os.path.exists(src_img):
    shutil.copy(src_img, os.path.join(icons_dir, "rotor_calculator_icon.jpg"))
    img = Image.open(src_img)
    
    # Save standard resolutions
    sizes = [
        (512, os.path.join(icons_dir, "icon_512.png")),
        (192, os.path.join(icons_dir, "icon_192.png")),
        (96, os.path.join(files_dir, "icon.png")),
        (96, os.path.join(icons_dir, "icon_96.png")),
        (72, os.path.join(icons_dir, "icon_72.png")),
        (48, os.path.join(icons_dir, "icon_48.png")),
    ]
    
    for s, path in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(path, format="PNG")
        print(f"Generated: {path} ({s}x{s})")
else:
    print(f"Source image not found: {src_img}")
