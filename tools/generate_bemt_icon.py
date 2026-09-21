import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def generate_bemt_icon(size=512):
    # Render at 4x for extreme antialiasing then downscale
    scale = 4
    dim = size * scale
    cx = dim / 2
    cy = dim / 2
    
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background rounded square / squircle
    bg_pad = 16 * scale
    r_corner = 90 * scale
    draw.rounded_rectangle(
        [(bg_pad, bg_pad), (dim - bg_pad, dim - bg_pad)],
        radius=r_corner,
        fill="#07090E",
        outline="#1E293B",
        width=int(3 * scale)
    )
    
    # Subtle inner border glow
    draw.rounded_rectangle(
        [(bg_pad + 4*scale, bg_pad + 4*scale), (dim - bg_pad - 4*scale, dim - bg_pad - 4*scale)],
        radius=r_corner - 4*scale,
        outline="#0E1726",
        width=int(2 * scale)
    )
    
    # Grid / Coordinate axes (azimuth lines)
    axis_col = "#1E293B"
    R_disc = 195 * scale
    r_hub = 42 * scale
    
    # 4 dashed reference crosshair lines
    for angle in [0, 90, 180, 270]:
        rad = math.radians(angle)
        x1 = cx + (r_hub + 10*scale) * math.cos(rad)
        y1 = cy + (r_hub + 10*scale) * math.sin(rad)
        x2 = cx + (R_disc - 10*scale) * math.cos(rad)
        y2 = cy + (R_disc - 10*scale) * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=axis_col, width=int(2 * scale))
        
    # Outer Tip-Path Circle (Rotor Disk)
    disc_col = "#0284C7"
    draw.ellipse(
        [(cx - R_disc, cy - R_disc), (cx + R_disc, cy + R_disc)],
        outline=disc_col,
        width=int(3.5 * scale)
    )
    
    # Faint outer perimeter ring
    R_outer = 205 * scale
    draw.ellipse(
        [(cx - R_outer, cy - R_outer), (cx + R_outer, cy + R_outer)],
        outline="#0F243A",
        width=int(1.5 * scale)
    )
    
    # Inner Root Cutout Circle (r0)
    r_cutout = 65 * scale
    draw.ellipse(
        [(cx - r_cutout, cy - r_cutout), (cx + r_cutout, cy + r_cutout)],
        outline="#334155",
        width=int(2 * scale)
    )
    
    # Hub center assembly
    draw.ellipse(
        [(cx - r_hub, cy - r_hub), (cx + r_hub, cy + r_hub)],
        fill="#0F172A",
        outline="#00E5FF",
        width=int(2.5 * scale)
    )
    draw.ellipse(
        [(cx - 18*scale, cy - 18*scale), (cx + 18*scale, cy + 18*scale)],
        fill="#1E293B",
        outline="#7DD3FC",
        width=int(2 * scale)
    )
    draw.ellipse(
        [(cx - 7*scale, cy - 7*scale), (cx + 7*scale, cy + 7*scale)],
        fill="#00E5FF"
    )
    
    # Rotor Blade (pointing towards ~20 degrees above horizontal for dynamic posture)
    blade_angle_deg = 25.0
    blade_rad = math.radians(blade_angle_deg)
    perp_rad = blade_rad + math.pi / 2
    
    # Opposing subtle ghost blades to emphasize rotorcraft disk
    for opp_angle in [blade_angle_deg + 90, blade_angle_deg + 180, blade_angle_deg + 270]:
        opp_rad = math.radians(opp_angle)
        ox1 = cx + r_cutout * math.cos(opp_rad)
        oy1 = cy + r_cutout * math.sin(opp_rad)
        ox2 = cx + (R_disc - 5*scale) * math.cos(opp_rad)
        oy2 = cy + (R_disc - 5*scale) * math.sin(opp_rad)
        draw.line([(ox1, oy1), (ox2, oy2)], fill="#1E293B", width=int(5 * scale))
    
    # Main Blade Geometry
    # Extends from r_cutout to R_disc
    chord_w = 28 * scale  # blade chord width
    
    # Blade polygon corners
    p1_x = cx + r_cutout * math.cos(blade_rad) - (chord_w*0.35) * math.cos(perp_rad)
    p1_y = cy + r_cutout * math.sin(blade_rad) - (chord_w*0.35) * math.sin(perp_rad)
    
    p2_x = cx + r_cutout * math.cos(blade_rad) + (chord_w*0.65) * math.cos(perp_rad)
    p2_y = cy + r_cutout * math.sin(blade_rad) + (chord_w*0.65) * math.sin(perp_rad)
    
    p3_x = cx + (R_disc - 3*scale) * math.cos(blade_rad) + (chord_w*0.55) * math.cos(perp_rad)
    p3_y = cy + (R_disc - 3*scale) * math.sin(blade_rad) + (chord_w*0.55) * math.sin(perp_rad)
    
    p4_x = cx + (R_disc - 3*scale) * math.cos(blade_rad) - (chord_w*0.30) * math.cos(perp_rad)
    p4_y = cy + (R_disc - 3*scale) * math.sin(blade_rad) - (chord_w*0.30) * math.sin(perp_rad)
    
    # Draw blade body (stealth charcoal with aero-cyan outline)
    blade_poly = [(p1_x, p1_y), (p2_x, p2_y), (p3_x, p3_y), (p4_x, p4_y)]
    draw.polygon(blade_poly, fill="#141E2D", outline="#0284C7")
    
    # Pitch axis centerline of the blade
    cl_x1 = cx + r_hub * math.cos(blade_rad)
    cl_y1 = cy + r_hub * math.sin(blade_rad)
    cl_x2 = cx + R_disc * math.cos(blade_rad)
    cl_y2 = cy + R_disc * math.sin(blade_rad)
    draw.line([(cl_x1, cl_y1), (cl_x2, cl_y2)], fill="#38BDF8", width=int(1.5 * scale))
    
    # Highlighted Blade Element (the classic dr element strip at r = 0.70 R)
    r_elem = R_disc * 0.70
    dr = 26 * scale  # width of element along span
    elem_chord = chord_w * 1.35  # chord segment
    
    # Element coordinates
    e_center_x = cx + r_elem * math.cos(blade_rad)
    e_center_y = cy + r_elem * math.sin(blade_rad)
    
    # 4 corners of the element strip
    e1_x = e_center_x - (dr/2)*math.cos(blade_rad) - (elem_chord*0.45)*math.cos(perp_rad)
    e1_y = e_center_y - (dr/2)*math.sin(blade_rad) - (elem_chord*0.45)*math.sin(perp_rad)
    
    e2_x = e_center_x - (dr/2)*math.cos(blade_rad) + (elem_chord*0.55)*math.cos(perp_rad)
    e2_y = e_center_y - (dr/2)*math.sin(blade_rad) + (elem_chord*0.55)*math.sin(perp_rad)
    
    e3_x = e_center_x + (dr/2)*math.cos(blade_rad) + (elem_chord*0.55)*math.cos(perp_rad)
    e3_y = e_center_y + (dr/2)*math.sin(blade_rad) + (elem_chord*0.55)*math.sin(perp_rad)
    
    e4_x = e_center_x + (dr/2)*math.cos(blade_rad) - (elem_chord*0.45)*math.cos(perp_rad)
    e4_y = e_center_y + (dr/2)*math.sin(blade_rad) - (elem_chord*0.45)*math.sin(perp_rad)
    
    elem_poly = [(e1_x, e1_y), (e2_x, e2_y), (e3_x, e3_y), (e4_x, e4_y)]
    draw.polygon(elem_poly, fill="#082F49", outline="#00E5FF")
    
    # Outline element with bold glowing Cyan
    draw.line([(e1_x, e1_y), (e2_x, e2_y), (e3_x, e3_y), (e4_x, e4_y), (e1_x, e1_y)], fill="#00E5FF", width=int(3 * scale))
    
    # Aerodynamic strip hash marks inside element (dr notation)
    draw.line([(e_center_x - (elem_chord*0.4)*math.cos(perp_rad), e_center_y - (elem_chord*0.4)*math.sin(perp_rad)),
               (e_center_x + (elem_chord*0.5)*math.cos(perp_rad), e_center_y + (elem_chord*0.5)*math.sin(perp_rad))],
              fill="#7DD3FC", width=int(2 * scale))
              
    # Curved Rotation Arrow (Omega / Azimuth psi) along disk tip
    arrow_center_angle = 120
    arc_box = [(cx - R_disc, cy - R_disc), (cx + R_disc, cy + R_disc)]
    draw.arc(arc_box, start=100, end=140, fill="#00E5FF", width=int(3.5 * scale))
    
    # Arrow head at angle 100 deg
    tip_ang = math.radians(100)
    tip_x = cx + R_disc * math.cos(tip_ang)
    tip_y = cy + R_disc * math.sin(tip_ang)
    # Tangent vector for counter-clockwise
    tang_x = -math.sin(tip_ang)
    tang_y = math.cos(tip_ang)
    norm_x = math.cos(tip_ang)
    norm_y = math.sin(tip_ang)
    
    h_len = 14 * scale
    h_w = 9 * scale
    arr_p1 = (tip_x, tip_y)
    arr_p2 = (tip_x - h_len * tang_x + h_w * norm_x, tip_y - h_len * tang_y + h_w * norm_y)
    arr_p3 = (tip_x - h_len * tang_x - h_w * norm_x, tip_y - h_len * tang_y - h_w * norm_y)
    draw.polygon([arr_p1, arr_p2, arr_p3], fill="#00E5FF")
    
    # Dimension label 'R' and 'dr'
    try:
        fnt = ImageFont.truetype("arialbd.ttf", int(20 * scale))
        fnt_sm = ImageFont.truetype("arialbd.ttf", int(15 * scale))
    except:
        fnt = ImageFont.load_default()
        fnt_sm = ImageFont.load_default()
        
    draw.text((cx - R_disc + 15*scale, cy - 20*scale), "R", fill="#38BDF8", font=fnt)
    draw.text((e_center_x + 12*scale, e_center_y - 25*scale), "dr", fill="#00E5FF", font=fnt_sm)
    
    # Downsample with high-quality Lanczos for crisp antialiasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    icons_dir = r"C:\Projetos\RotorCalculator\Icons"
    files_dir = r"C:\Projetos\RotorCalculator\Files"
    os.makedirs(icons_dir, exist_ok=True)
    os.makedirs(files_dir, exist_ok=True)
    
    sizes = {
        "icon_512.png": 512,
        "icon_192.png": 192,
        "icon_96.png": 96,
        "icon_72.png": 72,
        "icon_48.png": 48
    }
    
    img_512 = generate_bemt_icon(512)
    img_512.save(os.path.join(icons_dir, "icon_512.png"))
    # Save as main B4A launcher and app icon in Files/icon.png
    img_512.save(os.path.join(files_dir, "icon.png"))
    print("Saved 512x512 icon and Files/icon.png")
    
    for fname, sz in sizes.items():
        if sz == 512:
            continue
        resized = img_512.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(os.path.join(icons_dir, fname))
        print(f"Saved {fname} ({sz}x{sz})")
        
    print("All BEMT icons generated successfully!")

if __name__ == "__main__":
    main()
