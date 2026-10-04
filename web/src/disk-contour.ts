import {
  localPitch, localSolidity,
  type RotorGeometry, type FlightCondition, type RotorResults,
  cloneGeometry
} from "./engine";

export const DISK_CONTOUR_PARAMS = [
  { key: "aoa", label: "Angle of Attack α", unit: "deg" },
  { key: "phi", label: "Inflow Angle φ", unit: "deg" },
  { key: "cl", label: "Lift Coefficient Cl", unit: "–" },
  { key: "cd", label: "Drag Coefficient Cd", unit: "–" },
  { key: "lambda_total", label: "Total Inflow Ratio λ", unit: "–" },
  { key: "lambda_i", label: "Induced Inflow Ratio λi", unit: "–" },
  { key: "vi", label: "Induced Velocity vi", unit: "m/s" },
  { key: "up_vel", label: "Total Axial Velocity uP", unit: "m/s" },
  { key: "ut_vel", label: "Tangential Velocity uT", unit: "m/s" },
  { key: "fn_span", label: "Section Normal Force dFN/dr", unit: "N/m" },
  { key: "ft_span", label: "Section In-Plane Force dFT/dr", unit: "N/m" },
  { key: "mach", label: "Local Mach Number M", unit: "–" },
  { key: "dCTdx", label: "Section Thrust Loading dCT/dx", unit: "–" },
  { key: "dyn_press", label: "Dynamic Pressure q", unit: "Pa" },
];

export interface DiskContourData {
  rStations: number[];
  psiStations: number[];
  values: number[][]; // values[ir][ipsi]
}

export function computeDiskContourData(
  geom: RotorGeometry,
  cond: FlightCondition,
  res: RotorResults,
  variable: string
): DiskContourData {
  const numR = 30;
  const numPsi = 72;
  
  const rMin = Math.max(geom.rootCutout, 0.05);
  const rMax = 1.0;
  
  const rStations: number[] = [];
  for (let i = 0; i < numR; i++) {
    rStations.push(rMin + (rMax - rMin) * i / (numR - 1));
  }
  
  const psiStations: number[] = [];
  for (let j = 0; j < numPsi; j++) {
    psiStations.push((2 * Math.PI * j) / numPsi);
  }
  
  const values: number[][] = [];
  
  const mu = res.operatingMu;
  const lambda_total = res.inflowLambda;
  const lambda_i = res.inflowLambdaI;
  const Kx = res.inflowKx;
  const Ky = res.inflowKy;
  const a = res.effectiveLiftSlope;
  const vtip = Math.max(1.0, res.tipSpeed);
  const rho = cond.rho;
  const speedOfSound = Math.max(1.0, cond.speedOfSound);
  
  // Apply trimmed collective to geometry
  const trimmedGeom = cloneGeometry(geom);
  const delta = (res.trimmedCollectiveDeg || 0) * Math.PI / 180;
  trimmedGeom.thetaRoot += delta;
  trimmedGeom.thetaTip += delta;
  trimmedGeom.theta0 += delta;
  
  for (let i = 0; i < numR; i++) {
    const r = rStations[i];
    const sigma = localSolidity(trimmedGeom, r);
    const theta_rad = localPitch(trimmedGeom, r);
    const theta_deg = theta_rad * 180 / Math.PI;
    
    // Local blade chord
    const spanFrac = (r - geom.rootCutout) / Math.max(1e-6, 1.0 - geom.rootCutout);
    const chord = geom.chordRoot + (geom.chordTip - geom.chordRoot) * Math.max(0, Math.min(1, spanFrac));
    
    const row: number[] = [];
    for (let j = 0; j < numPsi; j++) {
      const psi = psiStations[j];
      
      const uT = r + mu * Math.sin(psi);
      const uP = lambda_total + r * (Kx * Math.cos(psi) + Ky * Math.sin(psi)) * lambda_i;
      const uR = mu * Math.cos(psi);
      
      const lambda_i_local = lambda_i * (1 + r * (Kx * Math.cos(psi) + Ky * Math.sin(psi)));
      const vi_dim = lambda_i_local * vtip;
      const ut_dim = uT * vtip;
      const up_dim = uP * vtip;
      const W_dim = Math.sqrt(uT * uT + uR * uR + uP * uP) * vtip;
      const q = 0.5 * rho * W_dim * W_dim;
      const mach = W_dim / speedOfSound;
      
      let phi_rad: number;
      let phi_deg: number;
      let alpha_deg: number;
      let cl: number;

      if (uT > 0) {
        // Normal attached forward flow
        phi_rad = Math.atan2(uP, uT);
        phi_deg = Math.max(-10, Math.min(25, phi_rad * 180 / Math.PI));
        alpha_deg = theta_deg - (phi_rad * 180 / Math.PI);
        const alpha_rad = alpha_deg * Math.PI / 180;
        // Linear lift curve with physical static stall bounds
        cl = Math.max(-1.2, Math.min(1.4, a * alpha_rad));
      } else {
        // Reverse flow region (uT <= 0: flow approaches from trailing edge)
        const phi_rev = Math.atan2(uP, Math.max(1e-4, -uT));
        phi_deg = Math.max(-10, Math.min(25, phi_rev * 180 / Math.PI));
        phi_rad = phi_rev;
        // Inverted profile geometric angle of attack clamped to physical stall bounds
        alpha_deg = Math.max(-15, Math.min(25, -(theta_deg + phi_deg)));
        const alpha_rad = alpha_deg * Math.PI / 180;
        // Separated flat-plate polar for reverse flow
        cl = Math.max(-0.8, Math.min(0.8, -Math.sin(2 * alpha_rad)));
      }
      alpha_deg = Math.max(-15, Math.min(25, alpha_deg));
      const cd = geom.cd0;
      
      // Section forces per unit span
      const dL = q * chord * cl;
      const dD = q * chord * cd;
      const dFn = dL * Math.cos(phi_rad) - dD * Math.sin(phi_rad);
      const dFt = dL * Math.sin(phi_rad) + dD * Math.cos(phi_rad);
      
      // Dimensionless thrust loading
      const dCTdx = 0.5 * sigma * (cl * Math.cos(phi_rad) - cd * Math.sin(phi_rad)) * (uT * uT + uR * uR + uP * uP);
      
      let val = 0;
      if (variable === "aoa") val = alpha_deg;
      else if (variable === "phi") val = phi_deg;
      else if (variable === "cl") val = cl;
      else if (variable === "cd") val = cd;
      else if (variable === "lambda_total" || variable === "lambda_local") val = uP;
      else if (variable === "lambda_i") val = lambda_i_local;
      else if (variable === "vi") val = vi_dim;
      else if (variable === "up_vel") val = up_dim;
      else if (variable === "ut_vel" || variable === "uT") val = ut_dim;
      else if (variable === "fn_span") val = dFn;
      else if (variable === "ft_span") val = dFt;
      else if (variable === "mach") val = mach;
      else if (variable === "dCTdx") val = dCTdx;
      else if (variable === "dyn_press") val = q;
      
      row.push(val);
    }
    values.push(row);
  }
  
  return { rStations, psiStations, values };
}

// Jet colormap interpolation
function getJetColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  let r = 0, g = 0, b = 0;
  if (t < 0.125) {
    r = 0; g = 0; b = 0.5 + 4 * t;
  } else if (t < 0.375) {
    r = 0; g = 4 * (t - 0.125); b = 1;
  } else if (t < 0.625) {
    r = 4 * (t - 0.375); g = 1; b = 1 - 4 * (t - 0.375);
  } else if (t < 0.875) {
    r = 1; g = 1 - 4 * (t - 0.625); b = 0;
  } else {
    r = 1 - 4 * (t - 0.875); g = 0; b = 0;
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function formatColorbarValue(v: number): string {
  if (Math.abs(v) < 1e-9) return "0";
  const abs = Math.abs(v);
  const exp0 = Math.floor(Math.log10(abs));
  const scale = Math.pow(10, 1 - exp0);
  const rounded = Math.round(v * scale) / scale;
  const absR = Math.abs(rounded);
  if (absR < 1e-9) return "0";
  const exp = Math.floor(Math.log10(absR));
  if (absR >= 1000 || absR < 0.01) {
    return rounded.toExponential(1);
  } else {
    const decs = Math.max(0, 1 - exp);
    const s = rounded.toFixed(decs);
    return s === "-0" || s === "-0.0" ? "0" : s;
  }
}

export function drawDiskContour(
  canvas: HTMLCanvasElement,
  data: DiskContourData,
  variableLabel: string,
  variableUnit: string,
  includeTitle: boolean = false
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  const style = getComputedStyle(document.documentElement);
  const bgColor = style.getPropertyValue("--card-bg").trim() || "#1e1e1e";
  const textColor = style.getPropertyValue("--text-main").trim() || "#ffffff";
  const gridColor = style.getPropertyValue("--border").trim() || "#444444";
  const mutedColor = style.getPropertyValue("--text-muted").trim() || "#888888";
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Find min/max for colormap
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < data.values.length; i++) {
    for (let j = 0; j < data.values[i].length; j++) {
      const v = data.values[i][j];
      if (!isNaN(v)) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
  }
  if (!isFinite(minVal) || !isFinite(maxVal)) {
    minVal = 0;
    maxVal = 1;
  } else if (minVal === maxVal) {
    maxVal = minVal + 1;
  }
  
  // Layout geometry: centered enlarged disk with horizontal colorbar below
  const centerX = Math.round(width / 2);
  const topSpace = includeTitle ? 54 : 36;
  const bottomSpace = 76;
  const sideSpace = 34;

  const availRadiusH = (width - 2 * sideSpace) / 2;
  const availRadiusV = (height - topSpace - bottomSpace) / 2;
  const maxRadius = Math.floor(Math.min(availRadiusH, availRadiusV, 195));
  const centerY = topSpace + maxRadius;
  
  // 1. Smooth continuous bilinear interpolation onto canvas pixel buffer
  const imgData = ctx.createImageData(width, height);
  const buf = new Uint32Array(imgData.data.buffer);
  
  // Precompute 256-level Jet colormap lookup table in 32-bit integer format (0xAABBGGRR)
  const lut = new Uint32Array(256);
  for (let k = 0; k < 256; k++) {
    const t = k / 255;
    let r = 0, g = 0, b = 0;
    if (t < 0.125) {
      r = 0; g = 0; b = 0.5 + 4 * t;
    } else if (t < 0.375) {
      r = 0; g = 4 * (t - 0.125); b = 1;
    } else if (t < 0.625) {
      r = 4 * (t - 0.375); g = 1; b = 1 - 4 * (t - 0.375);
    } else if (t < 0.875) {
      r = 1; g = 1 - 4 * (t - 0.625); b = 0;
    } else {
      r = 1 - 4 * (t - 0.875); g = 0; b = 0;
    }
    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    lut[k] = (255 << 24) | (B << 16) | (G << 8) | R;
  }
  
  const numR = data.rStations.length;
  const numPsi = data.psiStations.length;
  const rMin = data.rStations[0];
  const rMax = data.rStations[numR - 1];
  const rootR = rMin * maxRadius;
  const rMinPxSq = rootR * rootR;
  const rMaxPxSq = maxRadius * maxRadius;
  
  const invRRange = (numR - 1) / (rMax - rMin);
  const invValRange = 1 / (maxVal - minVal);
  const twoPi = 2 * Math.PI;
  const psiScale = numPsi / twoPi;
  
  const yStart = Math.max(0, centerY - maxRadius);
  const yEnd = Math.min(height, centerY + maxRadius + 1);
  const xStart = Math.max(0, centerX - maxRadius);
  const xEnd = Math.min(width, centerX + maxRadius + 1);
  
  for (let y = yStart; y < yEnd; y++) {
    const dy = y - centerY;
    const dySq = dy * dy;
    const rowOffset = y * width;
    
    for (let x = xStart; x < xEnd; x++) {
      const dx = x - centerX;
      const distSq = dx * dx + dySq;
      if (distSq < rMinPxSq || distSq > rMaxPxSq) continue;
      
      const dist = Math.sqrt(distSq);
      const r = dist / maxRadius;
      
      // Canvas angle: psi=0 at bottom, psi=90 right, psi=180 top, psi=270 left
      let a = Math.atan2(dy, dx);
      let psi = Math.PI / 2 - a;
      if (psi < 0) psi += twoPi;
      else if (psi >= twoPi) psi -= twoPi;
      
      const rIdxExact = (r - rMin) * invRRange;
      const i0 = Math.max(0, Math.min(numR - 2, Math.floor(rIdxExact)));
      const i1 = i0 + 1;
      const fr = rIdxExact - i0;
      
      const psiIdxExact = psi * psiScale;
      const j0 = Math.floor(psiIdxExact) % numPsi;
      const j1 = (j0 + 1) % numPsi;
      const fpsi = psiIdxExact - Math.floor(psiIdxExact);
      
      const v00 = data.values[i0][j0];
      const v10 = data.values[i1][j0];
      const v01 = data.values[i0][j1];
      const v11 = data.values[i1][j1];
      
      const v = (1 - fr) * ((1 - fpsi) * v00 + fpsi * v01) + fr * ((1 - fpsi) * v10 + fpsi * v11);
      let t = (v - minVal) * invValRange;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      
      const lutIdx = (t * 255) | 0;
      buf[rowOffset + x] = lut[lutIdx];
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  // Faint dashed black concentric radial circles: 0.25R, 0.50R, 0.75R (clear, subtle and discreet)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  [0.25, 0.5, 0.75].forEach(rNorm => {
    ctx.beginPath();
    ctx.arc(centerX, centerY, rNorm * maxRadius, 0, 2 * Math.PI);
    ctx.stroke();
  });
  
  // Faint dashed black quadrant axes (horizontal 90°-270° & vertical 0°-180°)
  ctx.beginPath();
  ctx.moveTo(centerX - maxRadius, centerY);
  ctx.lineTo(centerX + maxRadius, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - maxRadius);
  ctx.lineTo(centerX, centerY + maxRadius);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Outer perimeter (exactly at R = 1.0) - clean, fine solid black line
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Root cutout circle (clean inner boundary)
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rootR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Azimuth labels & flight orientation annotations:
  // Degrees: bold 14px textColor | Sub-label: bold 12px mutedColor ("Fore", "Aft", "Adv.", "Ret.")

  // TOP (180° - FORE)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = mutedColor;
  ctx.fillText("Fore", centerX, centerY - maxRadius - 22);
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("180°", centerX, centerY - maxRadius - 8);
  
  // BOTTOM (0° - AFT)
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("0°", centerX, centerY + maxRadius + 12);
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = mutedColor;
  ctx.fillText("Aft", centerX, centerY + maxRadius + 24);
  
  // RIGHT (90° - ADVANCING)
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("90°", centerX + maxRadius + 17, centerY - 8);
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = mutedColor;
  ctx.fillText("Adv.", centerX + maxRadius + 17, centerY + 10);
  
  // LEFT (270° - RETREATING: clean margins without clipping)
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = textColor;
  ctx.fillText("270°", centerX - maxRadius - 17, centerY - 8);
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = mutedColor;
  ctx.fillText("Ret.", centerX - maxRadius - 17, centerY + 10);
  
  // Prominent Horizontal Colorbar underneath the disk
  const cbWidth = Math.round(width * 0.84);
  const cbHeight = 16;
  const cbX = Math.round((width - cbWidth) / 2);
  const cbY = centerY + maxRadius + 38;
  
  const gradient = ctx.createLinearGradient(cbX, 0, cbX + cbWidth, 0);
  gradient.addColorStop(0, getJetColor(0));
  gradient.addColorStop(0.25, getJetColor(0.25));
  gradient.addColorStop(0.5, getJetColor(0.5));
  gradient.addColorStop(0.75, getJetColor(0.75));
  gradient.addColorStop(1, getJetColor(1));
  
  ctx.fillStyle = gradient;
  ctx.fillRect(cbX, cbY, cbWidth, cbHeight);
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(cbX, cbY, cbWidth, cbHeight);
  
  // Draw subtle vertical tick marks across the bar at 0%, 25%, 50%, 75%, 100%
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1.0].forEach(frac => {
    const tx = Math.round(cbX + frac * cbWidth);
    ctx.beginPath();
    ctx.moveTo(tx, cbY);
    ctx.lineTo(tx, cbY + cbHeight);
    ctx.stroke();
  });

  // Colorbar tick labels: strictly 2 significant figures (min on left, mid in center, max on right)
  const tickY = cbY + cbHeight + 4;
  ctx.fillStyle = textColor;
  ctx.font = "bold 12px monospace";
  ctx.textBaseline = "top";

  // Min tick (left)
  ctx.textAlign = "left";
  ctx.fillText(formatColorbarValue(minVal), cbX, tickY);
  
  // Mid tick (center)
  ctx.textAlign = "center";
  ctx.fillText(formatColorbarValue((maxVal + minVal) / 2), centerX, tickY);
  
  // Max tick (right)
  ctx.textAlign = "right";
  ctx.fillText(formatColorbarValue(maxVal), cbX + cbWidth, tickY);
  
  // Title on canvas: only displayed when requested (e.g. for standalone exported PNG)
  if (includeTitle) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = textColor;
    ctx.fillText(`${variableLabel} [${variableUnit}]`, width / 2, 12);
  }
}
