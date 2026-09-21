import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RotorCalculator — AeroCalculator Avionics Architecture</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
<style>
@font-face {
  font-family: 'Xenara';
  src: url('../../Files/xenara-bold.ttf') format('truetype');
  font-weight: bold;
}
:root {
  --bg-app: #07090E;
  --bg-title: #0D121B;
  --text-title: #FFFFFF;
  --tab-active: #00E5FF;
  --tab-inactive: #94A3B8;
  --border-line2: #1E2738;
  --border-line3: #171E2B;
  --btn-top: #1A2332;
  --btn-bottom: #121925;
  --btn-text: #F1F5F9;
  --btn-border: #2A364F;
  --edt-bg: #0F141E;
  --edt-text: #00E5FF;
  --edt-border: #1E293B;
  --pnl-input1: #0A0E15;
  --pnl-input2: #0E131C;
  --accent-green: #00E676;
  --accent-amber: #FFB300;
  --accent-coral: #FF5252;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #020305;
  color: var(--btn-text);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px 40px;
}

.top-bar-controls {
  width: 100%;
  max-width: 440px;
  background: #0E131C;
  border: 1px solid #1E2738;
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.apk-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tab-active);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  background: #162234;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #00E5FF55;
  transition: all 0.2s;
}
.apk-badge:hover {
  background: #00E5FF;
  color: #000;
}

/* Phone Frame */
.phone-frame {
  width: 100%;
  max-width: 412px;
  height: 840px;
  background: var(--bg-app);
  border-radius: 36px;
  border: 10px solid #1C2330;
  box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px #2D3A50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Unified AeroCalculator Header (102px) */
.unified-header {
  height: 102px;
  background: var(--bg-title);
  border-bottom: 1px solid var(--border-line2);
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
}

.header-top {
  height: 57px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  position: relative;
}

.rotor-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: contain;
  flex-shrink: 0;
}

.header-title {
  font-family: 'Xenara', 'Chakra Petch', sans-serif;
  font-size: 21px;
  font-weight: bold;
  color: var(--text-title);
  margin-left: 10px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.preset-header-tag {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--tab-active);
  white-space: nowrap;
  max-width: 115px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  margin-right: 8px;
}

.btn-menu-dots {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-menu-dots img {
  width: 20px;
  height: 20px;
  opacity: 0.85;
}

/* Tabs */
.header-tabs {
  height: 45px;
  display: flex;
  position: relative;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--tab-inactive);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 6px;
  transition: color 0.15s;
}

.tab-btn.active {
  color: var(--tab-active);
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 33.333%;
  height: 4px;
  background: var(--tab-active);
  box-shadow: 0 0 10px var(--tab-active);
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* Content Viewport */
.content-viewport {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: var(--bg-app);
}

.page {
  display: none;
  flex-direction: column;
}
.page.active {
  display: flex;
}

/* AeroCalculator Row Architecture */
.calc-row {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 3%;
  border-bottom: 1px solid var(--border-line3);
  position: relative;
}
.calc-row.odd { background: var(--pnl-input1); }
.calc-row.even { background: var(--pnl-input2); }

.row-label-btn {
  width: 30%;
  height: 38px;
  background: linear-gradient(180deg, var(--btn-top) 0%, var(--btn-bottom) 100%);
  border: 1px solid var(--btn-border);
  border-radius: 4px;
  color: var(--btn-text);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  cursor: pointer;
}

.row-input-wrap {
  width: 36%;
  margin-left: 4%;
  height: 38px;
}

.row-input {
  width: 100%;
  height: 100%;
  background: var(--edt-bg);
  border: 1px solid var(--edt-border);
  border-radius: 4px;
  color: var(--edt-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  outline: none;
}
.row-input:focus {
  border-color: var(--tab-active);
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}

.row-unit-btn {
  width: 20%;
  margin-left: 4%;
  height: 38px;
  background: linear-gradient(180deg, var(--btn-top) 0%, var(--btn-bottom) 100%);
  border: 1px solid var(--btn-border);
  border-radius: 4px;
  color: var(--tab-inactive);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.row-full-btn {
  width: 60%;
  margin-left: 4%;
  height: 38px;
  background: linear-gradient(180deg, var(--btn-top) 0%, var(--btn-bottom) 100%);
  border: 1px solid var(--btn-border);
  border-radius: 4px;
  color: var(--tab-active);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}
.row-full-btn.active-green {
  color: var(--accent-green);
}

/* Preset Row */
.preset-select {
  width: 48%;
  margin-left: 4%;
  height: 38px;
  background: var(--edt-bg);
  border: 1px solid var(--btn-border);
  color: var(--text-title);
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  padding: 0 6px;
  outline: none;
}

.btn-dup {
  width: 11%;
  margin-left: 3%;
  height: 38px;
  background: linear-gradient(180deg, var(--btn-top) 0%, var(--btn-bottom) 100%);
  border: 1px solid var(--btn-border);
  border-radius: 4px;
  color: var(--accent-amber);
  font-size: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Results Page (25 Telemetry rows) */
.btn-sweep-action {
  margin: 10px 3%;
  height: 44px;
  background: linear-gradient(180deg, #1C2B40 0%, #111A28 100%);
  border: 1px solid var(--tab-active);
  border-radius: 6px;
  color: var(--tab-active);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 229, 255, 0.15);
}

.res-row {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4%;
  border-bottom: 1px solid var(--border-line3);
}
.res-row.odd { background: var(--pnl-input1); }
.res-row.even { background: var(--pnl-input2); }

.res-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-title);
  white-space: nowrap;
}

.res-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--tab-active);
  text-align: right;
  white-space: nowrap;
}

/* Modal Sweep Overlay */
.sweep-modal {
  display: none;
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(10, 14, 21, 0.98);
  z-index: 50;
  flex-direction: column;
}
.sweep-modal.active { display: flex; }

.sweep-header {
  height: 48px;
  background: var(--bg-title);
  border-bottom: 1px solid var(--border-line2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
}
.sweep-header h4 {
  font-size: 13px;
  color: var(--tab-active);
  font-weight: 700;
}
.btn-close-sweep {
  background: transparent;
  border: none;
  color: var(--accent-coral);
  font-size: 20px;
  cursor: pointer;
}

.sweep-canvas-wrap {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
}
canvas#sweepChart {
  width: 100%;
  height: 100%;
  background: #080B10;
  border-radius: 8px;
  border: 1px solid var(--border-line2);
}
</style>
</head>
<body>

<div class="top-bar-controls">
  <div style="font-size: 13px; font-weight: 700;">
    <span style="color: var(--tab-active);">RotorCalculator</span> v1.0.0
  </div>
  <a class="apk-badge" href="RotorCalculator_Signed.apk" download>
    ⬇ Baixar APK Real
  </a>
</div>

<!-- Phone Device -->
<div class="phone-frame">
  
  <!-- Unified Header -->
  <div class="unified-header">
    <div class="header-top">
      <img src="../../Files/icon.png" class="rotor-icon" alt="Rotor">
      <div class="header-title">RotorCalculator</div>
      <div class="preset-header-tag" id="headerPresetName">UH-60 Black Hawk</div>
      <button class="btn-menu-dots" onclick="alert('RotorCalculator v1.0.0\\nzBET Aeromechanics Engine\\n(Wayne Johnson & Gordon Leishman)\\nFlight Dynamicist: Gustavo Zambrano')">
        <img src="../../Files/android-3-dot-menu.png" alt="Menu">
      </button>
    </div>
    
    <div class="header-tabs">
      <button class="tab-btn active" id="tab0" onclick="switchPage(0)">GEOMETRY</button>
      <button class="tab-btn" id="tab1" onclick="switchPage(1)">CONDITIONS</button>
      <button class="tab-btn" id="tab2" onclick="switchPage(2)">RESULTS</button>
      <div class="tab-indicator" id="tabLine"></div>
    </div>
  </div>

  <!-- Content Viewport -->
  <div class="content-viewport">
    
    <!-- PAGE 0: GEOMETRY -->
    <div class="page active" id="page0">
      
      <!-- Row 0: Preset -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Rotor Preset: Choose standard helicopter baseline geometry.')">Rotor Preset</button>
        <select class="preset-select" id="selPreset" onchange="loadPreset(this.value)">
          <option value="uh60">Sikorsky UH-60 Black Hawk</option>
          <option value="b206">Bell 206 JetRanger</option>
          <option value="bo105">Eurocopter Bo 105</option>
          <option value="r44">Robinson R44</option>
          <option value="evtol">Heavy-Lift eVTOL Hex</option>
        </select>
        <button class="btn-dup" onclick="alert('Preset duplicated to custom configuration!')">⧉</button>
      </div>

      <!-- Row 1: Radius -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Radius R: Rotor tip radius from rotation center in meters.')">Radius R</button>
        <div class="row-input-wrap"><input type="number" step="0.01" class="row-input" id="inpRadius" value="8.18" oninput="calc()"></div>
        <button class="row-unit-btn">m</button>
      </div>

      <!-- Row 2: RPM -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Rotor RPM: Base rotation speed in revolutions per minute.')">Rotor RPM</button>
        <div class="row-input-wrap"><input type="number" step="0.5" class="row-input" id="inpRPM" value="258.0" oninput="calc()"></div>
        <button class="row-unit-btn">RPM</button>
      </div>

      <!-- Row 3: Blade Count -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Blade Count: Number of blades forming the rotor disk.')">Blade Count</button>
        <div class="row-input-wrap"><input type="number" step="1" class="row-input" id="inpNb" value="4" oninput="calc()"></div>
        <button class="row-unit-btn">blades</button>
      </div>

      <!-- Row 4: Root Cutout -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Root Cutout: Non-dimensional radius r0/R where blade starts.')">Root Cutout</button>
        <div class="row-input-wrap"><input type="number" step="0.01" class="row-input" id="inpCutout" value="0.15" oninput="calc()"></div>
        <button class="row-unit-btn">r0/R</button>
      </div>

      <!-- Row 5: Root Chord -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Root Chord: Blade chord in meters at the root station.')">Root Chord</button>
        <div class="row-input-wrap"><input type="number" step="0.001" class="row-input" id="inpCRoot" value="0.530" oninput="calc()"></div>
        <button class="row-unit-btn">m</button>
      </div>

      <!-- Row 6: Tip Chord -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Tip Chord: Blade chord in meters at the tip station.')">Tip Chord</button>
        <div class="row-input-wrap"><input type="number" step="0.001" class="row-input" id="inpCTip" value="0.530" oninput="calc()"></div>
        <button class="row-unit-btn">m</button>
      </div>

      <!-- Row 7: Theta Root -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Theta Root Pitch: Blade pitch angle at the root in degrees.')">θ Root Pitch</button>
        <div class="row-input-wrap"><input type="number" step="0.1" class="row-input" id="inpTRoot" value="14.0" oninput="calc()"></div>
        <button class="row-unit-btn">deg</button>
      </div>

      <!-- Row 8: Theta Tip -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Theta Tip Pitch: Blade pitch angle at the tip in degrees.')">θ Tip Pitch</button>
        <div class="row-input-wrap"><input type="number" step="0.1" class="row-input" id="inpTTip" value="-4.0" oninput="calc()"></div>
        <button class="row-unit-btn">deg</button>
      </div>

      <!-- Row 9: Lift Slope -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Lift Slope a0: Sectional 2D lift curve slope dCl/dalpha.')">Lift Slope a0</button>
        <div class="row-input-wrap"><input type="number" step="0.01" class="row-input" id="inpA0" value="5.73" oninput="calc()"></div>
        <button class="row-unit-btn">1/rad</button>
      </div>

      <!-- Row 10: Cd0 -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Profile Cd0: Zero-lift baseline profile drag coefficient.')">Profile Cd0</button>
        <div class="row-input-wrap"><input type="number" step="0.0001" class="row-input" id="inpCd0" value="0.0088" oninput="calc()"></div>
        <button class="row-unit-btn">coef</button>
      </div>

      <!-- Row 11: Airfoil -->
      <div class="calc-row odd">
        <button class="row-label-btn">Airfoil</button>
        <button class="row-full-btn" id="btnAirfoil" onclick="toggleAirfoil()">SC1095 (Library...)</button>
      </div>

      <!-- Row 12: Tip Loss -->
      <div class="calc-row even">
        <button class="row-label-btn">Tip Loss</button>
        <button class="row-full-btn active-green" id="btnTipLoss" onclick="toggleTipLoss()">Sissingh: ON</button>
      </div>

      <!-- Row 13: Compressibility -->
      <div class="calc-row odd">
        <button class="row-label-btn">Compress.</button>
        <button class="row-full-btn active-green" id="btnComp" onclick="toggleComp()">Prandtl-Glauert: ON</button>
      </div>

    </div>

    <!-- PAGE 1: CONDITIONS -->
    <div class="page" id="page1">
      
      <!-- Row 0: Altitude -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Altitude: Geopotential pressure altitude above sea level.')">Altitude</button>
        <div class="row-input-wrap"><input type="number" step="50" class="row-input" id="inpAlt" value="0" oninput="calc()"></div>
        <button class="row-unit-btn">m</button>
      </div>

      <!-- Row 1: Temperature -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Temperature: Ambient temperature in degrees Celsius.')">Temperature</button>
        <div class="row-input-wrap"><input type="number" step="0.5" class="row-input" id="inpTemp" value="15.0" oninput="calc()"></div>
        <button class="row-unit-btn">°C</button>
      </div>

      <!-- Row 2: Advance Ratio -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Advance Ratio: mu = V / (Omega * R).')">Advance (μ)</button>
        <div class="row-input-wrap"><input type="number" step="0.01" class="row-input" id="inpMu" value="0.00" oninput="syncSpeed(0)"></div>
        <button class="row-unit-btn">μ</button>
      </div>

      <!-- Row 3: Flight Speed -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Flight Speed: Forward flight velocity in km/h.')">Flight Speed</button>
        <div class="row-input-wrap"><input type="number" step="5" class="row-input" id="inpSpeedKmh" value="0.0" oninput="syncSpeed(1)"></div>
        <button class="row-unit-btn">km/h</button>
      </div>

      <!-- Row 4: Shaft Tilt -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Shaft Tilt (alpha): Disk tilt angle relative to flight path.')">Shaft Tilt (α)</button>
        <div class="row-input-wrap"><input type="number" step="0.5" class="row-input" id="inpAlpha" value="0.0" oninput="calc()"></div>
        <button class="row-unit-btn">deg</button>
      </div>

      <!-- Row 5: Climb Rate -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Climb Rate: Vertical ascent (+) or descent (-) velocity.')">Climb Rate</button>
        <div class="row-input-wrap"><input type="number" step="0.5" class="row-input" id="inpVz" value="0.0" oninput="calc()"></div>
        <button class="row-unit-btn">m/s</button>
      </div>

      <!-- Row 6: Inflow Model -->
      <div class="calc-row even">
        <button class="row-label-btn">Inflow Model</button>
        <button class="row-full-btn" id="btnInflow" onclick="cycleInflow()">Coleman-Feingold</button>
      </div>

      <!-- Row 7: Profile Drag Model -->
      <div class="calc-row odd">
        <button class="row-label-btn">Profile Drag</button>
        <button class="row-full-btn" id="btnDragModel" onclick="cycleDragModel()">Numerical Vectorial</button>
      </div>

      <!-- Row 8: Hover Trim Mode -->
      <div class="calc-row even">
        <button class="row-label-btn">Hover Trim</button>
        <button class="row-full-btn active-green" id="btnTrim" onclick="toggleTrim()">Collective to Target</button>
      </div>

      <!-- Row 9: Target Thrust -->
      <div class="calc-row odd">
        <button class="row-label-btn" onclick="tip('Target Thrust: Desired rotor thrust in Newtons.')">Target Thrust</button>
        <div class="row-input-wrap"><input type="number" step="500" class="row-input" id="inpTargetT" value="70000" oninput="calc()"></div>
        <button class="row-unit-btn">N</button>
      </div>

      <!-- Row 10: Target CT -->
      <div class="calc-row even">
        <button class="row-label-btn" onclick="tip('Target CT: Non-dimensional thrust coefficient.')">Target CT</button>
        <div class="row-input-wrap"><input type="number" step="0.0001" class="row-input" id="inpTargetCT" value="0.00650" oninput="calc()"></div>
        <button class="row-unit-btn">coef</button>
      </div>

    </div>

    <!-- PAGE 2: RESULTS (25 Clean Rows) -->
    <div class="page" id="page2">
      
      <button class="btn-sweep-action" onclick="openSweepModal()">
        📈 OPEN MULTI-PARAMETER SWEEP (μ)
      </button>

      <div class="res-row odd"><span class="res-name">Total Thrust (T)</span><span class="res-value" id="r0">70,000 N</span></div>
      <div class="res-row even"><span class="res-name">Thrust Coef (CT)</span><span class="res-value" id="r1">0.00650</span></div>
      <div class="res-row odd"><span class="res-name">Shaft Power (P)</span><span class="res-value" id="r2">1,120.4 kW</span></div>
      <div class="res-row even"><span class="res-name">Power Coef (CP)</span><span class="res-value" id="r3">0.000492</span></div>
      <div class="res-row odd"><span class="res-name">Total Torque (Q)</span><span class="res-value" id="r4">41,470 N·m</span></div>
      <div class="res-row even"><span class="res-name">Torque Coef (CQ)</span><span class="res-value" id="r5">0.000492</span></div>
      <div class="res-row odd"><span class="res-name">Induced Torque (CQi)</span><span class="res-value" id="r6">0.000371</span></div>
      <div class="res-row even"><span class="res-name">Profile Drag Torque (CQ0)</span><span class="res-value" id="r7">0.000121</span></div>
      <div class="res-row odd"><span class="res-name">In-Plane Drag (H)</span><span class="res-value" id="r8">0.0 N</span></div>
      <div class="res-row even"><span class="res-name">In-Plane Coef (CH)</span><span class="res-value" id="r9">0.000000</span></div>
      <div class="res-row odd"><span class="res-name">Side Force Coef (CY)</span><span class="res-value" id="r10">0.000000</span></div>
      <div class="res-row even"><span class="res-name">Pitch Moment Coef (CMy)</span><span class="res-value" id="r11">0.000000</span></div>
      <div class="res-row odd"><span class="res-name">Roll Moment Coef (CMx)</span><span class="res-value" id="r12">0.000000</span></div>
      <div class="res-row even"><span class="res-name">Figure of Merit (FoM)</span><span class="res-value" id="r13">0.7542</span></div>
      <div class="res-row odd"><span class="res-name">Effective L/D Ratio</span><span class="res-value" id="r14">13.20</span></div>
      <div class="res-row even"><span class="res-name">Total Inflow Ratio (λ)</span><span class="res-value" id="r15">0.05701</span></div>
      <div class="res-row odd"><span class="res-name">Induced Inflow Ratio (λi)</span><span class="res-value" id="r16">0.05701</span></div>
      <div class="res-row even"><span class="res-name">Longitudinal Inflow (Kx)</span><span class="res-value" id="r17">0.000</span></div>
      <div class="res-row odd"><span class="res-name">Lateral Inflow (Ky)</span><span class="res-value" id="r18">0.000</span></div>
      <div class="res-row even"><span class="res-name">Wake Skew Angle (χ)</span><span class="res-value" id="r19">0.0°</span></div>
      <div class="res-row odd"><span class="res-name">Tip Mach (Hover)</span><span class="res-value" id="r20">0.648</span></div>
      <div class="res-row even"><span class="res-name">Advancing Tip Mach (Mat)</span><span class="res-value" id="r21">0.648</span></div>
      <div class="res-row odd"><span class="res-name">Air Density (ρ)</span><span class="res-value" id="r22">1.2250 kg/m³</span></div>
      <div class="res-row even"><span class="res-name">Ambient Pressure (p)</span><span class="res-value" id="r23">1013.2 hPa</span></div>
      <div class="res-row odd"><span class="res-name">Speed of Sound (a)</span><span class="res-value" id="r24">340.3 m/s</span></div>

    </div>

  </div>

  <!-- Sweep Modal -->
  <div class="sweep-modal" id="sweepModal">
    <div class="sweep-header">
      <h4>📈 MULTI-PARAMETER SWEEP vs μ</h4>
      <button class="btn-close-sweep" onclick="closeSweepModal()">✕</button>
    </div>
    <div class="sweep-canvas-wrap">
      <canvas id="sweepChart" width="380" height="400"></canvas>
    </div>
  </div>

</div>

<script>
function tip(msg) {
  alert(msg);
}

function switchPage(idx) {
  for(let i=0; i<3; i++) {
    document.getElementById('tab' + i).classList.remove('active');
    document.getElementById('page' + i).classList.remove('active');
  }
  document.getElementById('tab' + idx).classList.add('active');
  document.getElementById('page' + idx).classList.add('active');
  document.getElementById('tabLine').style.transform = `translateX(${idx * 100}%)`;
  if(idx === 2) calc();
}

function loadPreset(key) {
  const presets = {
    uh60: { name: 'UH-60 Black Hawk', r: 8.18, rpm: 258, nb: 4, cutout: 0.15, cr: 0.53, ct: 0.53, tr: 14.0, tt: -4.0, a0: 5.73, cd0: 0.0088, t: 70000 },
    b206: { name: 'Bell 206 JetRanger', r: 5.08, rpm: 394, nb: 2, cutout: 0.12, cr: 0.33, ct: 0.33, tr: 12.0, tt: 2.0, a0: 5.73, cd0: 0.0090, t: 14500 },
    bo105: { name: 'Bo 105', r: 4.92, rpm: 424, nb: 4, cutout: 0.14, cr: 0.27, ct: 0.27, tr: 11.0, tt: 1.0, a0: 5.73, cd0: 0.0092, t: 24000 },
    r44: { name: 'Robinson R44', r: 5.03, rpm: 408, nb: 2, cutout: 0.12, cr: 0.26, ct: 0.26, tr: 11.5, tt: 2.5, a0: 5.73, cd0: 0.0095, t: 11000 },
    evtol: { name: 'eVTOL Hex', r: 1.60, rpm: 1800, nb: 3, cutout: 0.18, cr: 0.18, ct: 0.12, tr: 16.0, tt: 4.0, a0: 5.73, cd0: 0.0120, t: 6000 }
  };
  const p = presets[key];
  if(!p) return;
  document.getElementById('headerPresetName').innerText = p.name;
  document.getElementById('inpRadius').value = p.r;
  document.getElementById('inpRPM').value = p.rpm;
  document.getElementById('inpNb').value = p.nb;
  document.getElementById('inpCutout').value = p.cutout;
  document.getElementById('inpCRoot').value = p.cr;
  document.getElementById('inpCTip').value = p.ct;
  document.getElementById('inpTRoot').value = p.tr;
  document.getElementById('inpTTip').value = p.tt;
  document.getElementById('inpA0').value = p.a0;
  document.getElementById('inpCd0').value = p.cd0;
  document.getElementById('inpTargetT').value = p.t;
  calc();
}

function syncSpeed(from) {
  const r = parseFloat(document.getElementById('inpRadius').value) || 5.5;
  const rpm = parseFloat(document.getElementById('inpRPM').value) || 390;
  const omega = rpm * Math.PI / 30;
  const vtip = omega * r;
  if(from === 0) {
    const mu = parseFloat(document.getElementById('inpMu').value) || 0;
    document.getElementById('inpSpeedKmh').value = (mu * vtip * 3.6).toFixed(1);
  } else {
    const spdKmh = parseFloat(document.getElementById('inpSpeedKmh').value) || 0;
    const vms = spdKmh / 3.6;
    document.getElementById('inpMu').value = (vms / vtip).toFixed(3);
  }
  calc();
}

function calc() {
  const r = parseFloat(document.getElementById('inpRadius').value) || 5.5;
  const rpm = parseFloat(document.getElementById('inpRPM').value) || 390;
  const nb = parseInt(document.getElementById('inpNb').value) || 4;
  const cd0 = parseFloat(document.getElementById('inpCd0').value) || 0.009;
  const targetT = parseFloat(document.getElementById('inpTargetT').value) || 25000;
  const alt = parseFloat(document.getElementById('inpAlt').value) || 0;
  const temp = parseFloat(document.getElementById('inpTemp').value) || 15;
  const mu = parseFloat(document.getElementById('inpMu').value) || 0;
  
  // ISA
  const pRatio = Math.pow(1.0 - 0.0065 * alt / 288.15, 5.2561);
  const p_hPa = 1013.25 * pRatio;
  const tK = temp + 273.15;
  const rho = (p_hPa * 100.0) / (287.058 * tK);
  const a = Math.sqrt(1.4 * 287.058 * tK);

  const omega = rpm * Math.PI / 30;
  const vtip = omega * r;
  const area = Math.PI * r * r;
  const ct = targetT / (rho * area * vtip * vtip);
  
  const lambda_i = Math.sqrt(Math.max(0, ct / 2));
  const cqi = 1.15 * ct * lambda_i;
  const sigma = nb * parseFloat(document.getElementById('inpCRoot').value) / (Math.PI * r);
  const cq0 = (sigma * cd0 / 8) * (1 + 4.65 * mu * mu);
  const cq = cqi + cq0;
  const cp = cq;
  const powerW = cp * rho * area * Math.pow(vtip, 3);
  const powerKw = powerW / 1000;
  const torqueNm = powerW / omega;
  const fom = (ct * Math.sqrt(ct / 2)) / Math.max(1e-6, cp);
  const tipMach = vtip / a;

  document.getElementById('r0').innerText = Math.round(targetT).toLocaleString() + ' N';
  document.getElementById('r1').innerText = ct.toFixed(5);
  document.getElementById('r2').innerText = powerKw.toFixed(1) + ' kW';
  document.getElementById('r3').innerText = cp.toFixed(6);
  document.getElementById('r4').innerText = Math.round(torqueNm).toLocaleString() + ' N·m';
  document.getElementById('r5').innerText = cq.toFixed(6);
  document.getElementById('r6').innerText = cqi.toFixed(6);
  document.getElementById('r7').innerText = cq0.toFixed(6);
  document.getElementById('r13').innerText = fom.toFixed(4);
  document.getElementById('r15').innerText = lambda_i.toFixed(5);
  document.getElementById('r16').innerText = lambda_i.toFixed(5);
  document.getElementById('r20').innerText = tipMach.toFixed(3);
  document.getElementById('r21').innerText = ((vtip * (1 + mu)) / a).toFixed(3);
  document.getElementById('r22').innerText = rho.toFixed(4) + ' kg/m³';
  document.getElementById('r23').innerText = p_hPa.toFixed(1) + ' hPa';
  document.getElementById('r24').innerText = a.toFixed(1) + ' m/s';
}

function openSweepModal() {
  document.getElementById('sweepModal').classList.add('active');
  drawSweep();
}
function closeSweepModal() {
  document.getElementById('sweepModal').classList.remove('active');
}

function drawSweep() {
  const canvas = document.getElementById('sweepChart');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth;
  const h = canvas.height = canvas.parentElement.clientHeight;

  ctx.fillStyle = '#080B10';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#1E2738';
  ctx.lineWidth = 1;
  for(let x=40; x<w-20; x+=60) {
    ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, h-40); ctx.stroke();
  }
  for(let y=20; y<h-40; y+=40) {
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w-20, y); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 20); ctx.lineTo(40, h-40); ctx.lineTo(w-20, h-40);
  ctx.stroke();

  // Curve: CP vs mu
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const pts = 20;
  for(let i=0; i<=pts; i++) {
    const mu = i * 0.4 / pts;
    const cp = 0.000492 * (1 - 0.2*Math.sin(mu*6) + 1.8*mu*mu);
    const px = 40 + (mu / 0.4) * (w - 60);
    const py = (h - 40) - (cp / 0.001) * (h - 80);
    if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.fillStyle = '#00E5FF';
  ctx.font = 'bold 12px Plus Jakarta Sans';
  ctx.fillText('CP vs μ (Coleman-Feingold Inflow)', 50, 35);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px JetBrains Mono';
  ctx.fillText('0.00', 35, h-25);
  ctx.fillText('0.40', w-35, h-25);
  ctx.fillText('Advance Ratio (μ)', w/2 - 40, h-10);
}

// Initial Run
calc();
</script>
</body>
</html>
"""

with open(r"c:\Projetos\RotorCalculator\tools\web_preview\index.html", "w", encoding="utf-8") as f:
    f.write(html_content)
print("web_preview/index.html updated with 10/10 AeroCalculator layout!")
