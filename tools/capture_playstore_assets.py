import os
import time
from PIL import Image, ImageDraw, ImageFont
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def capture_screenshots():
    out_dir = r"C:\Projetos\RotorCalculator\Icons"
    os.makedirs(out_dir, exist_ok=True)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=430,932")
    chrome_options.add_argument("--hide-scrollbars")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    driver = webdriver.Chrome(options=chrome_options)
    try:
        url = "http://localhost:8088"
        print(f"Opening {url}...")
        driver.get(url)
        time.sleep(2)
        
        dev_frame = driver.find_element(By.ID, "deviceWrapper")
        
        # 1. Switch to RESULTS tab & take screenshot
        btn_res = driver.find_element(By.ID, "tabRes")
        btn_res.click()
        time.sleep(1)
        res_path = os.path.join(out_dir, "playstore_phone_1_results.png")
        dev_frame.screenshot(res_path)
        print(f"Saved: {res_path}")
        
        # 2. Open Sweep Modal
        driver.execute_script("openSweepModal()")
        time.sleep(1)
        sweep_path = os.path.join(out_dir, "playstore_phone_2_sweep.png")
        dev_frame.screenshot(sweep_path)
        print(f"Saved: {sweep_path}")
        
        # Close sweep modal
        driver.execute_script("closeSweepModal()")
        time.sleep(0.5)
        
        # 3. Switch to GEOMETRY tab
        btn_geom = driver.find_element(By.ID, "tabGeom")
        btn_geom.click()
        time.sleep(1)
        geom_path = os.path.join(out_dir, "playstore_phone_3_geometry.png")
        dev_frame.screenshot(geom_path)
        print(f"Saved: {geom_path}")
        
        # 4. Switch to CONDITIONS tab
        btn_cond = driver.find_element(By.ID, "tabCond")
        btn_cond.click()
        time.sleep(1)
        cond_path = os.path.join(out_dir, "playstore_phone_4_conditions.png")
        dev_frame.screenshot(cond_path)
        print(f"Saved: {cond_path}")
        
    finally:
        driver.quit()

def create_feature_graphic():
    out_dir = r"C:\Projetos\RotorCalculator\Icons"
    fg_path = os.path.join(out_dir, "feature_graphic_1024x500.png")
    
    width = 1024
    height = 500
    img = Image.new("RGB", (width, height), color="#07090E")
    draw = ImageDraw.Draw(img)
    
    # Subtle grid lines
    for x in range(0, width, 40):
        draw.line([(x, 0), (x, height)], fill="#0F172A", width=1)
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill="#0F172A", width=1)
        
    # Aero accents / glow line
    draw.line([(0, height - 4), (width, height - 4)], fill="#00E5FF", width=3)
    draw.line([(60, 60), (width - 60, 60)], fill="#1E293B", width=1)
    
    # Draw decorative telemetry boxes
    draw.rectangle([(50, 80), (320, 420)], outline="#00E5FF", width=1)
    draw.rectangle([(52, 82), (318, 418)], outline="#1E293B", width=1)
    
    # Load and paste icon
    icon_path = os.path.join(out_dir, "icon_512.png")
    if os.path.exists(icon_path):
        icon_img = Image.open(icon_path).convert("RGBA")
        icon_img = icon_img.resize((260, 260), Image.Resampling.LANCZOS)
        img.paste(icon_img, (55, 120), icon_img)
        
    # Text headers
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 52)
        font_sub = ImageFont.truetype("arial.ttf", 22)
        font_tag = ImageFont.truetype("arialbd.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_tag = ImageFont.load_default()
        
    # Title
    draw.text((360, 110), "ROTORCALCULATOR", fill="#F8FAFC", font=font_large)
    draw.text((364, 175), "AEROMECHANICS & BEMT FLIGHT DYNAMICS", fill="#00E5FF", font=font_tag)
    
    features = [
        "• Analytical zBET Engine (Wayne Johnson & Leishman)",
        "• 4 Harmonic Inflow Models (Uniform, Coleman, Drees)",
        "• Multi-Curve Parametric Sweeps vs Advance Ratio (μ)",
        "• Comprehensive Aerodynamic Telemetry: CT, CP, CQ, FoM, L/D",
        "• 24 Azimuthal × 16 Radial Gauss-Legendre Quadrature",
        "• Dark Stealth Cockpit UI & Instant CSV Export"
    ]
    
    cur_y = 215
    for feat in features:
        draw.text((364, cur_y), feat, fill="#94A3B8", font=font_sub)
        cur_y += 36
        
    img.save(fg_path, quality=95)
    print(f"Saved feature graphic: {fg_path} ({width}x{height})")

if __name__ == "__main__":
    capture_screenshots()
    create_feature_graphic()
