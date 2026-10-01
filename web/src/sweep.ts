import {
  calculate,
  cloneCondition,
  cloneGeometry,
  type FlightCondition,
  type RotorGeometry,
  type RotorResults,
} from "./engine";

export interface SweepParamMeta {
  key: string;
  label: string;
  unit: string;
  getValue: (res: RotorResults) => number;
}

export const SWEEP_PARAMS: SweepParamMeta[] = [
  { key: "CT", label: "CT — Thrust Coeff", unit: "[-]", getValue: (r) => r.CT },
  { key: "CP", label: "CP / CQ — Power/Torque Coeff", unit: "[-]", getValue: (r) => r.CQ },
  { key: "CQi", label: "CQ,i — Induced Torque Coeff", unit: "[-]", getValue: (r) => r.CQi },
  { key: "CQ0", label: "CQ,0 — Profile Torque Coeff", unit: "[-]", getValue: (r) => r.CQ0 },
  { key: "CH", label: "CH — Total In-Plane Drag", unit: "[-]", getValue: (r) => r.CH },
  { key: "CHi", label: "CH,i — Induced In-Plane Drag", unit: "[-]", getValue: (r) => r.CHi },
  { key: "CH0", label: "CH,0 — Profile In-Plane Drag", unit: "[-]", getValue: (r) => r.CH0 },
  { key: "CY", label: "CY — Side Force Coeff", unit: "[-]", getValue: (r) => r.CY },
  { key: "CMx", label: "CMx — Roll Moment Coeff", unit: "[-]", getValue: (r) => r.CMx },
  { key: "CMy", label: "CMy — Pitch Moment Coeff", unit: "[-]", getValue: (r) => r.CMy },
  { key: "CPair", label: "CP,air — Air Power Coeff", unit: "[-]", getValue: (r) => r.CPair },
  { key: "lambda", label: "λ — Total Inflow", unit: "[-]", getValue: (r) => r.inflowLambda },
  { key: "lambda_i", label: "λi — Induced Inflow", unit: "[-]", getValue: (r) => r.inflowLambdaI },
  { key: "L_D_eff", label: "(L/D)eff — Effective L/D", unit: "[-]", getValue: (r) => r.L_D_eff },
  { key: "FoM", label: "FM — Figure of Merit", unit: "[-]", getValue: (r) => r.FoM },
  { key: "Kx", label: "Kx — Longitudinal Inflow Grad", unit: "[-]", getValue: (r) => r.inflowKx },
  { key: "Ky", label: "Ky — Lateral Inflow Grad", unit: "[-]", getValue: (r) => r.inflowKy },
  { key: "chi", label: "χ — Wake Skew Angle", unit: "deg", getValue: (r) => r.wakeSkewChiDeg },
  { key: "Mat", label: "Madv — Advancing Tip Mach", unit: "[-]", getValue: (r) => r.advancingTipMach },
  { key: "PowerKW", label: "Pshaft — Shaft Power (kW)", unit: "kW", getValue: (r) => r.powerShaftKW },
  { key: "PowerHP", label: "Pshaft — Shaft Power (hp)", unit: "hp", getValue: (r) => r.powerShaftHP },
  { key: "ThrustN", label: "T — Thrust (N)", unit: "N", getValue: (r) => r.thrustN },
  { key: "ThrustKgf", label: "T — Thrust (kgf)", unit: "kgf", getValue: (r) => r.thrustKgf },
  { key: "TorqueNm", label: "Q — Torque (N·m)", unit: "N·m", getValue: (r) => r.torqueNm },
  { key: "DragHN", label: "H — In-Plane Force (N)", unit: "N", getValue: (r) => r.dragHN },
  { key: "B", label: "B — Tip-Loss Factor", unit: "[-]", getValue: (r) => r.bFactor },
];

export interface SweepCurvePoint {
  mu: number;
  vx: number;
  val: number;
  valid: boolean;
}

export interface SweepCurve {
  label: string;
  color: string;
  points: SweepCurvePoint[];
}

const PALETTE = [
  "#00E5FF", // Cyan (Primary)
  "#00E676", // Emerald
  "#FFB300", // Amber
  "#FF4081", // Pink
  "#E040FB", // Purple
  "#76FF03", // Lime
];

export function runParameterSweep(
  geom: RotorGeometry,
  baseCond: FlightCondition,
  selectedParamKey: string,
  multiMode: number, // 0=Single, 1=Alpha, 2=Vz, 3=MuZ, 4=Inflow
  maxMu = 0.4,
  numSteps = 21,
  customFamilyValues?: number[],
  hoverTrimOnly = false
): { curves: SweepCurve[]; currentOpPoint: { mu: number; vx: number; val: number } | null } {
  const meta = SWEEP_PARAMS.find((p) => p.key === selectedParamKey) || SWEEP_PARAMS[0];
  const curves: SweepCurve[] = [];

  let familyConfigs: { label: string; patch: Partial<FlightCondition> }[] = [];

  if (multiMode === 1) {
    // Alpha Family
    const alphas = customFamilyValues && customFamilyValues.length >= 2 ? customFamilyValues : [-10, -5, 0, 5, 10];
    familyConfigs = alphas.map((a) => ({
      label: `α = ${a > 0 ? "+" : ""}${a}°`,
      patch: { axialMode: "alpha", axialValue: a },
    }));
  } else if (multiMode === 2) {
    // Vz Family
    const vzs = customFamilyValues && customFamilyValues.length >= 2 ? customFamilyValues : [-10, -5, 0, 5, 10];
    familyConfigs = vzs.map((v) => ({
      label: `Vz = ${v > 0 ? "+" : ""}${v} m/s`,
      patch: { axialMode: "vz", axialValue: v },
    }));
  } else if (multiMode === 3) {
    // MuZ Family
    const muzs = customFamilyValues && customFamilyValues.length >= 2 ? customFamilyValues : [-0.05, -0.025, 0, 0.025, 0.05];
    familyConfigs = muzs.map((m) => ({
      label: `μz = ${m > 0 ? "+" : ""}${m.toFixed(3)}`,
      patch: { axialMode: "muz", axialValue: m },
    }));
  } else if (multiMode === 4) {
    // Inflow Model Family
    const models: FlightCondition["inflowModel"][] = [
      "uniform",
      "coleman_simple",
      "coleman_feingold",
      "drees",
    ];
    familyConfigs = models.map((m) => ({
      label: m.replace("_", " ").toUpperCase(),
      patch: { inflowModel: m },
    }));
  } else {
    familyConfigs = [
      {
        label: "Active Condition",
        patch: {},
      },
    ];
  }

  // Pre-solve hover state if hoverTrimOnly is active
  let lockedRPM: number | null = null;
  let lockedCollectiveDeg: number | null = null;
  if (hoverTrimOnly && baseCond.operatingPair !== "rpm_collective") {
    const hoverCond = cloneCondition(baseCond);
    hoverCond.horizontalMode = "mu";
    hoverCond.horizontalValue = 0;
    hoverCond.axialMode = "muz";
    hoverCond.axialValue = 0;
    const hoverRes = calculate(geom, hoverCond);
    if (hoverRes.solutionValid) {
      lockedRPM = hoverRes.trimmedRPM;
      lockedCollectiveDeg = hoverRes.trimmedCollectiveDeg;
    }
  }

  const dMu = maxMu / Math.max(1, numSteps - 1);

  familyConfigs.forEach((cfg, idx) => {
    const points: SweepCurvePoint[] = [];
    for (let step = 0; step < numSteps; step++) {
      const muTarget = step * dMu;
      const c = cloneCondition(baseCond);
      Object.assign(c, cfg.patch);
      c.horizontalMode = "mu";
      c.horizontalValue = muTarget;

      if (lockedRPM !== null && lockedCollectiveDeg !== null) {
        c.operatingPair = "rpm_collective";
        c.rpm = lockedRPM;
        c.collectiveDeg = lockedCollectiveDeg;
      }

      const res = calculate(geom, c);
      const val = res.solutionValid ? meta.getValue(res) : 0;
      points.push({
        mu: muTarget,
        vx: res.operatingVx,
        val,
        valid: res.solutionValid,
      });
    }

    curves.push({
      label: cfg.label,
      color: PALETTE[idx % PALETTE.length],
      points,
    });
  });

  // Calculate current operating point
  const currentRes = calculate(geom, baseCond);
  let currentOpPoint = null;
  if (currentRes.solutionValid) {
    currentOpPoint = {
      mu: currentRes.operatingMu,
      vx: currentRes.operatingVx,
      val: meta.getValue(currentRes),
    };
  }

  return { curves, currentOpPoint };
}

export function drawSweepCanvas(
  canvas: HTMLCanvasElement,
  curves: SweepCurve[],
  currentOpPoint: { mu: number; vx: number; val: number } | null,
  xAxisMode: "mu" | "vx",
  paramMeta: SweepParamMeta,
  theme: "dark" | "light" = "dark",
  hoverCoord: { x: number; y: number } | null = null
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 360;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === "dark";
  const bgCol = isDark ? "#07090E" : "#F8FAFC";
  const gridCol = isDark ? "#171E2B" : "#E2E8F0";
  const textCol = isDark ? "#94A3B8" : "#475569";
  const titleCol = isDark ? "#00E5FF" : "#007F95";

  // Background
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, width, height);

  // Plot Margins
  const mLeft = 82;
  const mRight = 24;
  const mTop = 32;
  const mBottom = 48;
  const pWidth = width - mLeft - mRight;
  const pHeight = height - mTop - mBottom;

  // Determine Min & Max bounds
  let xMin = 0;
  let xMax = 0.01;
  let yMin = Infinity;
  let yMax = -Infinity;

  curves.forEach((c) => {
    c.points.forEach((pt) => {
      if (pt.valid) {
        const x = xAxisMode === "mu" ? pt.mu : pt.vx;
        if (x > xMax) xMax = x;
        if (pt.val < yMin) yMin = pt.val;
        if (pt.val > yMax) yMax = pt.val;
      }
    });
  });

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = 0;
    yMax = 1;
  } else {
    // Add 10% headroom
    const ySpan = yMax - yMin;
    yMin -= ySpan * 0.08;
    yMax += ySpan * 0.08;
  }

  // Draw Grid & Axes
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridCol;
  ctx.fillStyle = textCol;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const numYDivs = 5;
  for (let i = 0; i <= numYDivs; i++) {
    const yVal = yMin + (i * (yMax - yMin)) / numYDivs;
    const yPos = mTop + pHeight - (i * pHeight) / numYDivs;
    ctx.beginPath();
    ctx.moveTo(mLeft, yPos);
    ctx.lineTo(mLeft + pWidth, yPos);
    ctx.stroke();

    let label: string;
    if (Math.abs(yVal) < 0.005 && yVal !== 0) {
      label = yVal.toExponential(2);
    } else if (Math.abs(yVal) >= 1000) {
      label = yVal.toLocaleString("en-US", { maximumFractionDigits: 0 });
    } else {
      label = yVal.toPrecision(3);
    }
    ctx.fillText(label, mLeft - 8, yPos);
  }

  const numXDivs = 6;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i <= numXDivs; i++) {
    const xVal = xMin + (i * (xMax - xMin)) / numXDivs;
    const xPos = mLeft + (i * pWidth) / numXDivs;
    ctx.beginPath();
    ctx.moveTo(xPos, mTop);
    ctx.lineTo(xPos, mTop + pHeight);
    ctx.stroke();

    const label = xAxisMode === "mu" ? xVal.toFixed(2) : xVal.toFixed(0);
    ctx.fillText(label, xPos, mTop + pHeight + 8);
  }

  // Axis Labels
  ctx.fillStyle = titleCol;
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  const xLabel = xAxisMode === "mu" ? "Advance Ratio μ [-]" : "Airspeed Vx [m/s]";
  ctx.fillText(xLabel, mLeft + pWidth / 2, height - 16);

  ctx.save();
  ctx.translate(16, mTop + pHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${paramMeta.label} [${paramMeta.unit}]`, 0, 0);
  ctx.restore();

  // Plot Curves
  curves.forEach((c) => {
    ctx.beginPath();
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2.5;
    let started = false;

    c.points.forEach((pt) => {
      if (!pt.valid) return;
      const x = xAxisMode === "mu" ? pt.mu : pt.vx;
      const xPos = mLeft + ((x - xMin) / (xMax - xMin)) * pWidth;
      const yPos = mTop + pHeight - ((pt.val - yMin) / (yMax - yMin)) * pHeight;

      if (!started) {
        ctx.moveTo(xPos, yPos);
        started = true;
      } else {
        ctx.lineTo(xPos, yPos);
      }
    });
    ctx.stroke();
  });

  // Current Operating Point Indicator
  if (currentOpPoint) {
    const opX = xAxisMode === "mu" ? currentOpPoint.mu : currentOpPoint.vx;
    if (opX >= xMin && opX <= xMax) {
      const cx = mLeft + ((opX - xMin) / (xMax - xMin)) * pWidth;
      const cy = mTop + pHeight - ((currentOpPoint.val - yMin) / (yMax - yMin)) * pHeight;

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#FF1744";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 23, 68, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Draw Legend in Top Right
  if (curves.length > 1) {
    const legX = mLeft + pWidth - 140;
    let legY = mTop + 10;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    curves.forEach((c) => {
      ctx.fillStyle = c.color;
      ctx.fillRect(legX, legY - 4, 16, 8);
      ctx.fillStyle = textCol;
      ctx.fillText(c.label, legX + 22, legY);
      legY += 16;
    });
  }

  // Hover Tooltip inspection
  if (hoverCoord && hoverCoord.x >= mLeft && hoverCoord.x <= mLeft + pWidth) {
    const relX = (hoverCoord.x - mLeft) / pWidth;
    const xVal = xMin + relX * (xMax - xMin);

    // Vertical cursor line
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";
    ctx.moveTo(hoverCoord.x, mTop);
    ctx.lineTo(hoverCoord.x, mTop + pHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function generateSweepCSV(
  curves: SweepCurve[],
  xAxisMode: "mu" | "vx",
  paramMeta: SweepParamMeta,
  trimStrategy = "Point-by-Point"
): string {
  const xHeader = xAxisMode === "mu" ? "mu" : "Vx_mps";
  const headers = [xHeader, ...curves.map((c) => `"${c.label} (${paramMeta.unit})"` )];
  const rows: string[] = [
    `# RotorCalculator Parameter Sweep`,
    `# Trim Strategy: ${trimStrategy}`,
    headers.join(",")
  ];

  const numPts = curves[0]?.points.length || 0;
  for (let i = 0; i < numPts; i++) {
    const pt0 = curves[0].points[i];
    const xVal = xAxisMode === "mu" ? pt0.mu.toFixed(4) : pt0.vx.toFixed(2);
    const vals = curves.map((c) => (c.points[i]?.valid ? c.points[i].val.toPrecision(6) : "NaN"));
    rows.push([xVal, ...vals].join(","));
  }
  return rows.join("\r\n");
}
