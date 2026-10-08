
export function triggerHapticFeedback(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
    } catch {}
  }
}

import { QUICK_CONVERSIONS, quickConvert } from "./quick-converter";
import { renderEquationMathML } from "./math-renderer";
import { getHelpSvg } from "./help-illustrations";
import { computeDiskContourData, drawDiskContour, DISK_CONTOUR_PARAMS } from "./disk-contour";
import "./style.css";
import headerIconUrl from "./assets/icon_header.png";
import {
  calculate,
  cloneGeometry,
  createDefaultCondition,
  createDefaultGeometry,
  derivedClBar,
  derivedLambdaH,
  derivedMuOverLambda,
  derivedOutput,
  derivedPc,
  derivedTc,
  getGeometryQuantity,
  alphaFromMuZ,
  OPERATING_LIMITS,
  sanitizeCondition,
  updateAtmosphere,
  resolveSolidity,
  setGeometryQuantity,
  type FlightCondition,
  type RotorGeometry,
  type RotorResults,
} from "./engine";
import {
  clearDraft,
  exportRotorsDatabaseText,
  exportRotorsJSON,
  getActiveRotorId,
  getFactoryPresets,
  hasDraft,
  importRotorsUniversal,
  loadDraft,
  loadStoredRotors,
  MAX_ROTOR_NAME_LENGTH,
  resetToFactoryPresets,
  resolveImportConflicts,
  type ImportConflictDecision,
  safeGet,
  safeSet,
  sanitizeRotorName,
  saveDraft,
  saveStoredRotors,
  setActiveRotorId,
  type StoredRotor,
} from "./storage";
import {
  convertValue,
  formatInputValue,
  formatSig,
  formatFixed,
  formatNumberList,
  parseNumberList,
  UNIT_CHOICES,
  UNIT_TABLE,
} from "./units";
import {
  drawSweepCanvas,
  generateSweepCSV,
  getSweepReadoutText,
  renderSweepTableHtml,
  runParameterSweep,
  SWEEP_PARAMS,
  SWEEP_TRIM_MODES,
  type SweepTrimModeKey,
} from "./sweep";
import {
  COND_KEYS,
  GEOM_KEYS,
  chooseLevel,
  fitLabelSize,
  formatDescriptionSymbol,
  formatSubscripts,
  getNomenclature,
  getRichLabelHtml,
  measureTextWidth,
  resultLabelHtml,
} from "./labels";

// Option Selector Interface
interface OptionItem {
  id: string;
  label: string;
  desc?: string;
  /** Label and description are trusted markup written in this file (subscripts). */
  html?: boolean;
}

const AIRFOILS: { id: string; name: string; a0: number; cd0: number; desc: string }[] = [
    { id: "naca0012", name: "NACA 0012", a0: 5.73, cd0: 0.009, desc: "Symmetrical classical benchmark rotor airfoil" },
    { id: "naca23012", name: "NACA 23012", a0: 5.85, cd0: 0.0085, desc: "Moderate camber, low profile pitching moment" },
    { id: "vr7", name: "Boeing Vertol VR-7", a0: 5.9, cd0: 0.0095, desc: "High transonic drag-divergence Boeing Vertol section" },
    { id: "sc1095", name: "Sikorsky SC1095", a0: 6.0, cd0: 0.0088, desc: "Sikorsky advanced main rotor high-lift airfoil" },
    { id: "clarky", name: "Clark Y", a0: 5.65, cd0: 0.01, desc: "Flat-bottom high efficiency propeller section" },
    { id: "selig8036", name: "Selig S8036", a0: 5.7, cd0: 0.011, desc: "Low Reynolds number optimized UAV/drone airfoil" },
  ];

function refreshAirfoilName(): void {
  const match = AIRFOILS.find(af => Math.abs(af.a0 - activeGeom.liftSlope0) < 0.001 && Math.abs(af.cd0 - activeGeom.cd0) < 0.00001);
  byId("btn-select-airfoil").textContent = match?.name || "Custom";
}

// State Management
let storedRotors: StoredRotor[] = loadStoredRotors();
let activeRotorId: string = getActiveRotorId();
let currentRotor: StoredRotor =
  storedRotors.find((r) => r.id === activeRotorId) || storedRotors[0] || getFactoryPresets()[0];
let activeGeom: RotorGeometry = cloneGeometry(currentRotor.geom);

// Restore draft geometry if available
if (hasDraft()) {
  const draft = loadDraft();
  if (draft && draft.geom && (draft.baseId === currentRotor.id || draft.baseId === "active")) {
    activeGeom = draft.geom;
  }
}

/** Merge a saved condition into the defaults, accepting only known keys with matching types. */
function mergeCondition(base: FlightCondition, saved: unknown): FlightCondition {
  if (!saved || typeof saved !== "object") return base;
  const out: Record<string, unknown> = { ...base };
  const ref = base as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    if (!(key in ref)) continue;
    if (typeof value !== typeof ref[key]) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    out[key] = value;
  }
  const merged = sanitizeCondition(out as unknown as FlightCondition);
  const models = ["uniform", "coleman_simple", "coleman_feingold", "drees"];
  if (!models.includes(merged.inflowModel)) merged.inflowModel = base.inflowModel;
  const pairs = ["rpm_collective", "rpm_ct", "rpm_thrust", "collective_ct", "collective_thrust", "ct_thrust"];
  if (!pairs.includes(merged.operatingPair)) merged.operatingPair = base.operatingPair;
  return merged;
}

// Restore saved condition session if available
let activeCond: FlightCondition = createDefaultCondition();
try {
  const savedCondJson = safeGet("rotorcalc_active_cond");
  if (savedCondJson) activeCond = mergeCondition(activeCond, JSON.parse(savedCondJson));
  else if (currentRotor.name === "DJI Matrice 300 Drone") {
    activeCond.operatingPair = "rpm_collective";
    activeCond.collectiveDeg = 0;
  }
} catch {
  // fallback to default
}
// Derive density, pressure and sound speed from the restored altitude and temperature.
activeCond = updateAtmosphere(activeCond, activeCond.altitudeM, activeCond.temperatureC);

let activeResults: RotorResults = calculate(activeGeom, activeCond);

function storedChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = safeGet(key);
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
function storedUnit(key: string, allowed: readonly string[], fallback: string): string {
  const value = safeGet(key);
  return value !== null && allowed.includes(value) && value in UNIT_TABLE ? value : fallback;
}
function storedInt(key: string, min: number, max: number, fallback: number): number {
  const value = Number.parseInt(safeGet(key) ?? "", 10);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

const savedPage = safeGet("rotor_current_page");
let currentPage: "geometry" | "conditions" | "results" = savedPage === "conditions" || savedPage === "results" ? savedPage : "geometry";
let currentTheme: "dark" | "light" | "midnight" | "sepia" = storedChoice("rotor_theme", ["dark", "light", "midnight", "sepia"] as const, "dark");
let unitSystem: "si" | "imperial" = storedChoice("rotor_units", ["si", "imperial"] as const, "si");
let extraPrecision: number = storedInt("rotor_extra_precision", -1, 1, 0);

// Preferred Output Units
let prefThrustUnit = storedUnit("rotor_pref_thrust", ["N", "kN", "lbf", "kgf"], unitSystem === "imperial" ? "lbf" : "N");
let prefSpeedUnit = storedUnit("rotor_pref_speed", ["m/s", "kt", "km/h", "mph", "ft/s"], unitSystem === "imperial" ? "kt" : "m/s");

// Sweep Modal State
let sweepSelectedParam = "CP";
let sweepMultiMode = storedInt("rotor_sweep_family", 0, 4, 4);
let sweepXAxisMode: "mu" | "vx" | "muLam" = storedChoice("rotor_sweep_xaxis", ["mu", "vx", "muLam"] as const, "mu");
let sweepMaxMu = 0.4;
let sweepCrossX = -1;
let sweepLastPlotMeta = { plotLeft: 70, plotWidth: 400, xMax: 0.4 };
let sweepTableVisible = false;
let sweepTrimMode: SweepTrimModeKey = (() => {
  const value = safeGet("rotor_sweep_trim_mode");
  return SWEEP_TRIM_MODES.some((mode) => mode.key === value) ? (value as SweepTrimModeKey) : "coll_all";
})();
let plotPaletteIndex: number = storedInt("rotor_plot_palette", 0, 2, 0);
const sweepCustomValues: Record<number, number[]> = {
  1: [-10, -5, 0, 5, 10],
  2: [-10, -5, 0, 5, 10],
  3: [-0.05, -0.025, 0, 0.025, 0.05],
};
let sweepUpdateFn: (() => void) | null = null;

// Flags & Dialog State
let isInternalSync = false;
let isGeometryDirty = hasDraft();
let pendingUnsavedAction: (() => void) | null = null;
let deferredInstallPrompt: any = null;

// Initialize Root App DOM
const app = document.getElementById("app");
if (!app) throw new Error("Missing #app root container");

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div class="brand-row">
        <div class="brand-left">
          <img class="brand-icon" src="${headerIconUrl}" alt="RotorCalculator Icon" />
          <div class="brand-title">
            RotorCalculator
            <span class="version-badge">v1.32</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="btn-install-app" style="display: none;" title="Install RotorCalculator App" aria-label="Install App">📥</button>
          <button class="icon-btn" id="btn-main-menu" aria-label="More options" title="More options">⋮</button>
        </div>
      </div>
      <nav class="tabs-nav" aria-label="Calculator sections">
        <button class="tab-btn active" data-page="geometry">GEOMETRY</button>
        <button class="tab-btn" data-page="conditions">CONDITIONS</button>
        <button class="tab-btn" data-page="results">RESULTS</button>
        <div class="tab-indicator" id="tab-indicator"></div>
      </nav>
    </header>

    <!-- 3-Dot Popup Menu -->
    <div class="menu-backdrop" id="main-menu-backdrop" hidden></div>
    <div class="popup-menu" id="main-popup-menu" hidden>
      <div class="menu-sheet-header"><span>Menu</span><button type="button" class="modal-close-btn" id="btn-menu-close" aria-label="Close menu">×</button></div>
      <button type="button" class="popup-menu-item menu-primary" data-action="help"><span class="menu-item-title">Physics &amp; Equations</span><span class="menu-item-subtitle">Theory, equations and notation</span></button>
      <button type="button" class="popup-menu-item menu-primary" data-action="units"><span class="menu-item-title">Unit Converter</span><span class="menu-item-subtitle">Quick engineering conversions</span></button>
      <button type="button" class="popup-menu-item menu-primary" data-action="settings"><span class="menu-item-title">Settings</span><span class="menu-item-subtitle">Display, plots and rotor data</span></button>
      <button type="button" class="popup-menu-item menu-primary" id="menu-item-install" data-action="install"><span class="menu-item-title">Install App</span><span class="menu-item-subtitle">Add to home screen or desktop</span></button>
      <button type="button" class="popup-menu-item menu-primary" data-action="about"><span class="menu-item-title">About</span><span class="menu-item-subtitle">Version and credits</span></button>
      <button type="button" class="popup-menu-item menu-primary" data-action="privacy"><span class="menu-item-title">Privacy</span><span class="menu-item-subtitle">Privacy policy</span></button>
      <div class="popup-menu-divider menu-desktop-only"></div>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="restore">Restore Factory Presets</button>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="export">Export Rotor Geometries</button>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="import">Import Rotor Geometries</button>
      <div class="popup-menu-divider menu-desktop-only"></div>
      <a class="popup-menu-item menu-desktop-only" href="mailto:flightdyn@gmail.com?subject=RotorCalculator%20Feedback" id="feedback-link">Send Feedback</a>
    </div>

    <div class="content-area" id="content-area" tabindex="-1">
      <!-- PAGE 0: GEOMETRY -->
      <section class="page active" id="page-geometry">
        <div class="active-rotor-bar" id="active-rotor-bar" role="button" tabindex="0" aria-label="Active rotor. Open the rotor list" title="Click to switch or manage rotors">
          <div>
            <div class="active-rotor-tag">ACTIVE ROTOR (CLICK TO SWITCH)</div>
            <div class="active-rotor-name" id="display-active-rotor-name">UH-60 Black Hawk</div>
          </div>
          <span style="font-size: 1.125rem; color: var(--accent);">▾</span>
        </div>


        <div class="section-header">ROTOR</div>
        <div class="engineering-row rotor-name-row" hidden>
          <button class="row-label-btn" data-key="name" data-tip="Descriptive name of this rotor geometry." data-canonical="Rotor Name">Rotor Name</button>
          <input class="row-input" type="text" id="inp-rotor-name" value="" maxlength="32" />
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="rpmNom" data-tip="Design rotor speed stored with the rotor. It seeds the Conditions page." data-canonical="Nominal Speed Ω_nom">Nominal Speed Ω_nom</button>
          <input class="row-input" type="number" step="1" id="inp-rpm-nom" value="258" />
          <button class="row-unit-btn" id="unit-rpm-nom">rpm</button>
        </div>

        <div class="section-header">PLANFORM</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="R" data-tip="Rotor radius measured from shaft axis to blade tip." data-canonical="Radius R">Radius R</button>
          <input class="row-input" type="number" step="0.01" id="inp-radius" value="8.18" />
          <button class="row-unit-btn" id="unit-radius">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="Nb" data-tip="Total number of main rotor blades." data-canonical="Blade Count">Blade Count</button>
          <input class="row-input" type="number" step="1" id="inp-nblades" value="4" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="x0" data-tip="Non-dimensional radial station r0/R where the active lifting blade starts." data-canonical="Root Cutout">Root Cutout</button>
          <input class="row-input" type="number" step="0.01" id="inp-cutout" value="0.15" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="c0" data-tip="Blade chord extrapolated to the rotational shaft center." data-canonical="Root Chord c0">Root Chord c0</button>
          <input class="row-input" type="number" step="0.001" id="inp-chord-root" value="0.53" />
          <button class="row-unit-btn" id="unit-chord-root">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="c1" data-tip="Blade chord at physical tip station r/R = 1.0." data-canonical="Tip Chord c1">Tip Chord c1</button>
          <input class="row-input" type="number" step="0.001" id="inp-chord-tip" value="0.53" />
          <button class="row-unit-btn" id="unit-chord-tip">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="taper" data-tip="Ratio of tip chord c1 to root chord c0." data-canonical="Taper Ratio">Taper Ratio</button>
          <input class="row-input" type="number" step="any" id="drv-taper" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="AR" data-tip="Blade aspect ratio R / c_mean. Editing scales chords to match." data-canonical="Aspect Ratio">Aspect Ratio</button>
          <input class="row-input" type="number" step="0.1" id="inp-aspect-ratio" value="15.4" />
          <button class="row-unit-btn" disabled>–</button>
        </div>

        <div class="section-header">SOLIDITY &amp; AREAS</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="sigmaRef" data-tip="Blade area of the fictitious planform extended to rotation axis (x=0) over disk area. Reference solidity used by the analytical equations." data-canonical="Reference Solidity">Ref. Solidity</button>
          <input class="row-input" type="number" step="0.0001" id="inp-sigma-ref" value="0.0825" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="sigmaAct" data-tip="Actual (real) blade area from root cutout to tip over disk area." data-canonical="Actual Solidity">Actual Solidity</button>
          <input class="row-input" type="number" step="any" id="drv-sigma-geom" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="sigmaT" data-tip="Thrust-weighted solidity according to Wayne Johnson BET formulation." data-canonical="Thrust Solidity">Thrust Solidity</button>
          <input class="row-input" type="number" step="any" id="drv-sigma-thrust" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="A" data-tip="Total swept disk area of the rotor: A_DISK = pi * R^2." data-canonical="Disk Area">Disk Area</button>
          <input class="row-input" type="number" step="any" id="drv-disk-area" />
          <button class="row-unit-btn" id="unit-disk-area">m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="Ab" data-tip="Planform area of one blade of the fictitious planform extended to rotation axis (x=0). Reference blade area derived from chords." data-canonical="Reference Blade Area">Reference Area</button>
          <input class="row-input" type="number" step="any" id="drv-blade-area-ref" />
          <button class="row-unit-btn" id="unit-blade-area-ref">m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="Aact" data-tip="Actual (real) planform area of one blade from root cutout to tip." data-canonical="Actual Blade Area">Actual Area</button>
          <input class="row-input" type="number" step="any" id="drv-blade-area" />
          <button class="row-unit-btn" id="unit-blade-area">m²</button>
        </div>

        <div class="section-header">BLADE PITCH</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="thRoot" data-tip="Aerodynamic incidence angle at cutout station r0." data-canonical="Root Pitch">Root Pitch</button>
          <input class="row-input" type="number" step="0.1" id="inp-theta-root" value="14.0" />
          <button class="row-unit-btn" id="unit-theta-root">deg</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="thTip" data-tip="Aerodynamic incidence angle at blade tip station r=R." data-canonical="Tip Pitch">Tip Pitch</button>
          <input class="row-input" type="number" step="0.1" id="inp-theta-tip" value="-4.0" />
          <button class="row-unit-btn" id="unit-theta-tip">deg</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="thTwist" data-tip="Total built-in geometric twist (tip pitch minus root pitch)." data-canonical="Total Twist">Total Twist</button>
          <input class="row-input" type="number" step="any" id="drv-twist" />
          <button class="row-unit-btn" id="unit-twist">deg</button>
        </div>

        <div class="section-header">AERODYNAMICS</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="airfoil" data-tip="Select aerodynamic airfoil polar section." data-canonical="Airfoil">Airfoil</button>
          <button class="action-btn" id="btn-select-airfoil">SC1095</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="a0" data-tip="2D lift curve slope a0 (typically 5.7 to 6.0 rad^-1)." data-canonical="Lift Slope a0">Lift Slope a0</button>
          <input class="row-input" type="number" step="0.01" id="inp-lift-slope" value="5.73" />
          <button class="row-unit-btn" id="unit-lift-slope">rad⁻¹</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="Cd0" data-tip="2D zero-lift profile drag coefficient cd0." data-canonical="Profile cd0">Profile cd0</button>
          <input class="row-input" type="number" step="0.0001" id="inp-cd0" value="0.0088" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="tipModel" data-tip="Tip-loss model (none, fixed factor B, or Sissingh momentum coupling)." data-canonical="Tip Loss">Tip Loss</button>
          <button class="action-btn" id="btn-tiploss-mode">Sissingh</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="B" data-tip="Fixed tip loss factor B (active when tip loss is set to Fixed)." data-canonical="Tip Factor B">Tip Factor B</button>
          <div class="tip-factor-value">
            <input class="row-input" type="number" step="0.005" id="inp-tiploss-b" value="0.97" />
            <input class="row-input" type="text" id="drv-tip-factor" readonly style="display: none;" />
          </div>
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="comp" data-tip="Prandtl-Glauert subsonic compressibility correction on blade lift slope." data-canonical="Compressibility">Compressibility</button>
          <button class="action-btn" id="btn-compressibility">On</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>

        <div class="rotor-actions-row">
          <button class="action-btn save" id="btn-geom-save">SAVE</button>
          <button class="action-btn copy" id="btn-geom-copy">COPY</button>
          <button class="action-btn delete" id="btn-geom-delete">DELETE</button>
        </div>
      </section>

      <!-- PAGE 1: CONDITIONS -->
      <section class="page" id="page-conditions">
        <div class="section-header">ATMOSPHERE &amp; FLOW</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="h" data-tip="Pressure altitude H_p in the ISA atmosphere." data-canonical="Altitude">Altitude</button>
          <input class="row-input" type="number" step="50" id="inp-altitude" value="0" />
          <button class="row-unit-btn" id="unit-altitude">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="T0" data-tip="Outside air temperature (OAT)." data-canonical="Temperature">Temperature</button>
          <input class="row-input" type="number" step="1" id="inp-temperature" value="15" />
          <button class="row-unit-btn" id="unit-temperature">°C</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="btn-toggle-horiz-mode" data-key="mu" title="Click to choose between advance ratio mu and forward airspeed Vx">μ_x ⇄</button>
          <input class="row-input" type="number" step="0.01" id="inp-horiz-val" value="0.00" />
          <button class="row-unit-btn" id="unit-horiz-val">–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="btn-toggle-axial-mode" data-key="alpha" title="Click to choose between inflow angle alpha, climb speed Vz, and axial ratio muz">α ⇄</button>
          <input class="row-input" type="number" step="0.5" id="inp-axial-val" value="0.0" />
          <button class="row-unit-btn" id="unit-axial-val">deg</button>
        </div>

        <div class="section-header">OPERATING CONSTRAINTS</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="trim" data-tip="Trim mode solver constraint: prescribe any two from RPM, Collective, CT, and Thrust." data-canonical="Trim">Trim</button>
          <button class="action-btn" id="btn-trim-mode">Ω + C<sub>T</sub></button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row" id="row-operating-1">
          <button class="row-label-btn" id="lbl-operating-1" data-key="rpm" data-canonical="RPM">RPM</button>
          <input class="row-input" type="number" step="1" id="inp-operating-1" value="258" />
          <button class="row-unit-btn" id="unit-operating-1">rpm</button>
        </div>
        <div class="engineering-row" id="row-operating-2">
          <button class="row-label-btn" id="lbl-operating-2" data-key="CTtgt" data-canonical="Target C_T">Target C<sub>T</sub></button>
          <input class="row-input" type="number" step="0.0005" id="inp-operating-2" value="0.0065" />
          <button class="row-unit-btn" id="unit-operating-2">–</button>
        </div>

        <div class="section-header">AERODYNAMIC MODEL</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="inflow" data-tip="Inflow model formulation (Uniform, Coleman, Coleman-Feingold, or Drees)." data-canonical="Inflow Model">Inflow Model</button>
          <button class="action-btn" id="btn-inflow-model">Coleman-Feingold</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="kind" data-tip="Empirical induced power factor k_ind used in energy balance (default 1.15).">Induced Factor kind</button>
          <input class="row-input" type="number" step="0.01" id="inp-kind" value="1.15" />
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="drag" data-tip="Vectorial 2D Gauss-Legendre quadrature along radial blade stations and azimuth." data-canonical="Profile Drag">Profile Drag</button>
          <button class="action-btn" id="btn-drag-info">Numerical Vectorial</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
      </section>

      <!-- PAGE 2: RESULTS -->
      <section class="page" id="page-results">
        <div class="results-header-actions" style="display: flex; flex-direction: row; gap: 8px; margin: 0 12px 8px;">
          <button class="btn-open-sweep" id="btn-open-sweep" style="flex: 1;">
            PARAMETER SWEEP
          </button>
          <button class="btn-open-sweep" id="btn-open-disk-contour" style="flex: 1;">
            DISK CONTOUR
          </button>
        </div>

        <div class="results-banner ok" id="results-banner" role="status" hidden></div>

        <div class="section-header">FORCES</div>
        <div class="result-row" data-key="T"><button class="result-label" data-key="T">Thrust T</button><div class="result-val">---</div><div class="result-unit">N</div></div>
        <div class="result-row" data-key="H"><button class="result-label" data-key="H">In-Plane Force H</button><div class="result-val">---</div><div class="result-unit">N</div></div>
        <div class="result-row" data-key="Hi"><button class="result-label" data-key="Hi">Induced In-Plane H<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">N</div></div>
        <div class="result-row" data-key="H0"><button class="result-label" data-key="H0">Profile In-Plane H<sub>0</sub></button><div class="result-val">---</div><div class="result-unit">N</div></div>
        <div class="result-row" data-key="Y"><button class="result-label" data-key="Y">Side Force Y</button><div class="result-val">---</div><div class="result-unit">N</div></div>

        <div class="section-header">TORQUES &amp; MOMENTS</div>
        <div class="result-row" data-key="Q"><button class="result-label" data-key="Q">Shaft Torque Q</button><div class="result-val">---</div><div class="result-unit">N·m</div></div>
        <div class="result-row" data-key="Qi"><button class="result-label" data-key="Qi">Induced Torque Q<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">N·m</div></div>
        <div class="result-row" data-key="Q0"><button class="result-label" data-key="Q0">Profile Torque Q<sub>0</sub></button><div class="result-val">---</div><div class="result-unit">N·m</div></div>
        <div class="result-row" data-key="Mx"><button class="result-label" data-key="Mx">Roll Moment M<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">N·m</div></div>
        <div class="result-row" data-key="My"><button class="result-label" data-key="My">Pitch Moment M<sub>y</sub></button><div class="result-val">---</div><div class="result-unit">N·m</div></div>

        <div class="section-header">POWER</div>
        <div class="result-row" data-key="P"><button class="result-label" data-key="P">Shaft Power P</button><div class="result-val">---</div><div class="result-unit">kW</div></div>
        <div class="result-row" data-key="Pi"><button class="result-label" data-key="Pi">Induced Power P<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">kW</div></div>
        <div class="result-row" data-key="P0"><button class="result-label" data-key="P0">Profile Power P<sub>0</sub></button><div class="result-val">---</div><div class="result-unit">kW</div></div>
        <div class="result-row" data-key="Pair"><button class="result-label" data-key="Pair">Air Power P<sub>air</sub></button><div class="result-val">---</div><div class="result-unit">kW</div></div>

        <div class="section-header">LOADING &amp; EFFICIENCY</div>
        <div class="result-row" data-key="DL"><button class="result-label" data-key="DL">Disk Loading DL</button><div class="result-val">---</div><div class="result-unit">N/m²</div></div>
        <div class="result-row" data-key="PL"><button class="result-label" data-key="PL">Power Loading PL</button><div class="result-val">---</div><div class="result-unit">N/kW</div></div>
        <div class="result-row" data-key="CTs"><button class="result-label" data-key="CTs">Blade Loading C<sub>T</sub>/σ<sub>TR</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="FM"><button class="result-label" data-key="FM">Figure of Merit FM</button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="LDe"><button class="result-label" data-key="LDe">Effective L/D (L/D)<sub>e</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>

        <div class="section-header">AERODYNAMIC COEFFICIENTS</div>
        <div class="result-row" data-key="CT"><button class="result-label" data-key="CT">Thrust Coeff C<sub>T</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CQ"><button class="result-label" data-key="CQ">Torque Coeff C<sub>Q</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CQi"><button class="result-label" data-key="CQi">Induced Torque C<sub>Qi</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CQ0"><button class="result-label" data-key="CQ0">Profile Torque C<sub>Q0</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CH"><button class="result-label" data-key="CH">In-Plane Coeff C<sub>H</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CHi"><button class="result-label" data-key="CHi">Induced In-Plane C<sub>Hi</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CH0"><button class="result-label" data-key="CH0">Profile In-Plane C<sub>H0</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CY"><button class="result-label" data-key="CY">Side Force Coeff C<sub>Y</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CMx"><button class="result-label" data-key="CMx">Roll Moment Coeff C<sub>Mx</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CMy"><button class="result-label" data-key="CMy">Pitch Moment Coeff C<sub>My</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CPair"><button class="result-label" data-key="CPair">Air Power Coeff C<sub>Pair</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="CLbar"><button class="result-label" data-key="CLbar">Mean Lift C̄<sub>L</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Tc"><button class="result-label" data-key="Tc">Dyn Thrust T<sub>c</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Pc"><button class="result-label" data-key="Pc">Dyn Power P<sub>c</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>

        <div class="section-header">INFLOW &amp; AXIAL FLOW</div>
        <div class="result-row" data-key="lam"><button class="result-label" data-key="lam">Inflow Ratio λ</button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="lami"><button class="result-label" data-key="lami">Induced Inflow λ<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="lamh"><button class="result-label" data-key="lamh">Hover Inflow λ<sub>h</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="vi"><button class="result-label" data-key="vi">Induced Velocity v<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Vztot"><button class="result-label" data-key="Vztot">Total Axial Speed V<sub>z,tot</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="muz"><button class="result-label" data-key="muz">Axial Ratio μ<sub>z</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vz"><button class="result-label" data-key="Vz">Climb Speed V<sub>z</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="alpha"><button class="result-label" data-key="alpha">Disk AoA α</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="muLam"><button class="result-label" data-key="muLam">Advance-Inflow μ/λ</button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Kx"><button class="result-label" data-key="Kx">Long. Gradient K<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Ky"><button class="result-label" data-key="Ky">Lat. Gradient K<sub>y</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="chi"><button class="result-label" data-key="chi">Wake Skew χ</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="Bres"><button class="result-label" data-key="Bres">Tip Factor B</button><div class="result-val">---</div><div class="result-unit">–</div></div>

        <div class="section-header">FLOW &amp; BLADE DIAGNOSTICS</div>
        <div class="result-row" data-key="mu"><button class="result-label" data-key="mu">Advance Ratio μ<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vx"><button class="result-label" data-key="Vx">Airspeed V<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="OmR"><button class="result-label" data-key="OmR">Tip Speed ΩR</button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Mtip"><button class="result-label" data-key="Mtip">Tip Mach M<sub>tip</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vadv"><button class="result-label" data-key="Vadv">Advancing Speed V<sub>adv</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Madv"><button class="result-label" data-key="Madv">Advancing Mach M<sub>adv</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vret"><button class="result-label" data-key="Vret">Retreating Speed V<sub>ret</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Mret"><button class="result-label" data-key="Mret">Retreating Mach M<sub>ret</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="aoaAdv25"><button class="result-label" data-key="aoaAdv25">Adv. AoA 25% α<sub>adv,25</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaRet25"><button class="result-label" data-key="aoaRet25">Ret. AoA 25% α<sub>ret,25</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaAdv50"><button class="result-label" data-key="aoaAdv50">Adv. AoA 50% α<sub>adv,50</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaRet50"><button class="result-label" data-key="aoaRet50">Ret. AoA 50% α<sub>ret,50</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaAdv75"><button class="result-label" data-key="aoaAdv75">Adv. AoA 75% α<sub>adv,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaRet75"><button class="result-label" data-key="aoaRet75">Ret. AoA 75% α<sub>ret,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaAdvTip"><button class="result-label" data-key="aoaAdvTip">Adv. AoA Tip α<sub>adv,tip</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaRetTip"><button class="result-label" data-key="aoaRetTip">Ret. AoA Tip α<sub>ret,tip</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiAdv25"><button class="result-label" data-key="phiAdv25">Adv. Inflow 25% φ<sub>adv,25</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiRet25"><button class="result-label" data-key="phiRet25">Ret. Inflow 25% φ<sub>ret,25</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiAdv50"><button class="result-label" data-key="phiAdv50">Adv. Inflow 50% φ<sub>adv,50</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiRet50"><button class="result-label" data-key="phiRet50">Ret. Inflow 50% φ<sub>ret,50</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiAdv75"><button class="result-label" data-key="phiAdv75">Adv. Inflow 75% φ<sub>adv,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiRet75"><button class="result-label" data-key="phiRet75">Ret. Inflow 75% φ<sub>ret,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiAdvTip"><button class="result-label" data-key="phiAdvTip">Adv. Inflow Tip φ<sub>adv,tip</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiRetTip"><button class="result-label" data-key="phiRetTip">Ret. Inflow Tip φ<sub>ret,tip</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>

        <div class="section-header">STATE &amp; ATMOSPHERE</div>
        <div class="result-row" data-key="rpm"><button class="result-label" data-key="rpm">Rotor Speed Ω</button><div class="result-val">---</div><div class="result-unit">rpm</div></div>
        <div class="result-row" data-key="coll"><button class="result-label" data-key="coll">Collective Δθ</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="h"><button class="result-label" data-key="h">Altitude H<sub>p</sub></button><div class="result-val">---</div><div class="result-unit">m</div></div>
        <div class="result-row" data-key="T0"><button class="result-label" data-key="T0">Temperature OAT</button><div class="result-val">---</div><div class="result-unit">°C</div></div>
        <div class="result-row" data-key="rho"><button class="result-label" data-key="rho">Density ρ</button><div class="result-val">---</div><div class="result-unit">kg/m³</div></div>
        <div class="result-row" data-key="p"><button class="result-label" data-key="p">Pressure p</button><div class="result-val">---</div><div class="result-unit">hPa</div></div>
        <div class="result-row" data-key="a"><button class="result-label" data-key="a">Sound Speed a</button><div class="result-val">---</div><div class="result-unit">m/s</div></div>

        <div class="section-header">MODEL STATUS</div>
        <div class="result-status-block" style="padding: 6px 12px; display: flex; flex-direction: column; gap: 8px;">
          <button class="status-chip-btn" id="badge-solution-summary" type="button">
            <span id="txt-solution-summary">Trim Mode</span>
          </button>
          <button class="status-chip-btn" id="badge-model-status" type="button">
            <span id="txt-model-status">Model Valid</span>
          </button>
        </div>
      </section>
    </div>

    <!-- MODAL: OPTION SELECTOR (DROP-DOWN MODAL) -->
    <div class="modal-overlay" id="modal-options-selector">
      <div class="modal-card options-modal-card">
        <div class="modal-header">
          <div class="modal-title" id="options-selector-title">Select Option</div>
          <button class="modal-close-btn" data-close="modal-options-selector">×</button>
        </div>
        <div class="modal-body">
          <div class="options-list" id="options-selector-list"></div>
          <button class="action-btn" data-close="modal-options-selector" style="width: 100%; height: 48px;">CANCEL</button>
        </div>
      </div>
    </div>

    <!-- MODAL: ROTOR MANAGER -->
    <div class="modal-overlay" id="modal-rotor-manager">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">SAVED ROTORS LIBRARY</div>
          <button class="modal-close-btn" data-close="modal-rotor-manager">×</button>
        </div>
        <div class="modal-body">
          <div class="rotor-manager-list" id="rotor-manager-list"></div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="action-btn" id="btn-manager-new" style="flex: 2; color: var(--accent-green);">+ NEW ROTOR</button>
            <button class="action-btn" id="btn-manager-import" style="flex: 1;">IMPORT</button>
            <button class="action-btn" id="btn-manager-export" style="flex: 1;">EXPORT</button>
          </div>
          <input type="file" id="file-import-input" accept=".txt,.json,application/json,text/plain" style="display: none;" />
        </div>
      </div>
    </div>

    <!-- MODAL: PARAMETER SWEEP -->
    <div class="modal-overlay" id="modal-sweep">
      <div class="modal-card sweep-modal-card">
        <div class="modal-header">
          <div class="modal-title">ADVANCE RATIO (μx) PARAMETER SWEEP</div>
          <button class="modal-close-btn" data-close="modal-sweep">×</button>
        </div>
        <div class="modal-body">
          <div class="sweep-controls-grid">
            <div class="sweep-control-group">
              <label>Parameter (Y-Axis)</label>
              <select class="sweep-select" id="sweep-select-param"></select>
            </div>
            <div class="sweep-control-group">
              <label>Multi-Curve Family</label>
              <div style="display: flex; gap: 6px;">
                <select class="sweep-select" id="sweep-select-family" style="flex: 1; min-width: 0;">
                  <option value="0">Single Curve (Active)</option>
                  <option value="1">α Family (-10° to +10°)</option>
                  <option value="2">Vz Family (-10 to +10 m/s)</option>
                  <option value="3">μz Family (-0.05 to +0.05)</option>
                  <option value="4" selected>Inflow Models Family</option>
                </select>
                <button class="action-btn" id="btn-sweep-values" style="display: none; flex-shrink: 0; height: 48px; padding: 0 10px; font-size: 0.7188rem; font-weight: 700; color: var(--accent);">VALUES</button>
              </div>
            </div>
            <div class="sweep-control-group">
              <label>X-Axis Scale</label>
              <select class="sweep-select" id="sweep-select-xaxis">
                <option value="mu">Advance Ratio μx [-]</option>
                <option value="vx">Airspeed Vx [m/s]</option>
                <option value="muLam">Advance-to-Inflow Ratio μ/λ [–]</option>
              </select>
            </div>
            <div class="sweep-control-group">
              <label>Sweep Range</label>
              <select class="sweep-select" id="sweep-select-maxmu">
                <option value="0.3">μ_x max = 0.30</option>
                <option value="0.4" selected>μ_x max = 0.40</option>
                <option value="0.5">μ_x max = 0.50</option>
                <option value="0.6">μ_x max = 0.60</option>
              </select>
            </div>
            <div class="sweep-control-group" id="sweep-group-trim-mode">
              <label>Sweep Trim</label>
              <select class="sweep-select" id="sweep-select-trim-mode">
                <option value="none">No Trim (Fixed Controls)</option>
                <option value="coll_all">Trim Collective Δθ · Every Point</option>
                <option value="rpm_all">Trim Rotor Speed Ω · Every Point</option>
                <option value="coll_hover">Trim Collective Δθ · Hover Only</option>
                <option value="rpm_hover">Trim Rotor Speed Ω · Hover Only</option>
              </select>
            </div>
          </div>

          <div class="sweep-canvas-wrapper">
            <canvas class="sweep-canvas" id="sweep-canvas"></canvas>
          </div>

          <div class="sweep-info-cards" style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; margin-bottom: 8px;">
            <div id="sweep-current-val" style="padding: 8px 12px; background: var(--bg-input-card, var(--card-bg)); border-radius: 6px; font-size: 0.8125rem; font-weight: 600; color: var(--accent); border: 1px solid var(--border);">Active point: invalid operating point</div>
            <div id="sweep-readout" style="padding: 8px 12px; background: var(--bg-input-card, var(--card-bg)); border-radius: 6px; font-size: 0.8125rem; font-weight: 500; color: var(--text-main); border: 1px solid var(--border); white-space: pre-line;">Tap or drag on the plot to read the curve values.</div>
          </div>

          <div id="sweep-table-container" style="display: none; max-height: 200px; overflow: auto; margin-bottom: 12px; font-size: 0.75rem; border: 1px solid var(--border); border-radius: 6px;"></div>
        </div>
          <div class="sweep-footer-actions">
            <button class="action-btn" id="btn-sweep-toggle-table" style="height: 48px;">SHOW TABLE</button>
            <button class="action-btn" id="btn-sweep-export-csv" style="height: 48px;">EXPORT CSV</button>
            <button class="action-btn" id="btn-sweep-export-png" style="height: 48px;">EXPORT PNG</button>
            <button class="action-btn" id="btn-sweep-export-all-png" style="height: 48px;">EXPORT ALL PNG</button>
          </div>
      </div>
    </div>

    <!-- MODAL: SWEEP CUSTOM VALUES -->
    <div class="modal-overlay" id="modal-sweep-values">
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <div class="modal-title">Edit Curve Family Values</div>
          <button class="modal-close-btn" data-close="modal-sweep-values">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <p id="sweep-values-hint" style="font-size: 0.8438rem; color: var(--text-muted); margin-bottom: 12px;">Enter values for the curve family. Separate values with semicolons or spaces. A comma is a decimal mark.</p>
          <input class="row-input" id="inp-sweep-values" type="text" aria-label="Curve family values" aria-describedby="sweep-values-hint sweep-values-error" style="width: 100%; height: 48px; margin-bottom: 8px; font-family: monospace; font-size: 0.875rem; text-align: left;" />
          <div class="field-error" id="sweep-values-error" role="alert" hidden></div>
          <div style="height: 8px;"></div>
          <div style="display: flex; gap: 8px;">
            <button class="action-btn" id="btn-sweep-values-save" style="flex: 1; height: 48px; color: var(--accent); font-weight: 700;">APPLY VALUES</button>
            <button class="action-btn" id="btn-sweep-values-cancel" style="height: 48px;">CANCEL</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: DISK CONTOUR -->
    <div class="modal-overlay" id="modal-disk-contour">
      <div class="modal-card sweep-modal-card">
        <div class="modal-header">
          <div class="modal-title">ROTOR DISK CONTOUR</div>
          <button class="modal-close-btn" data-close="modal-disk-contour">×</button>
        </div>
        <div class="modal-body">
          <div class="sweep-controls-grid" style="grid-template-columns: 1fr;">
            <div class="sweep-control-group">
              <label>Parameter</label>
              <select class="sweep-select" id="disk-contour-variable"></select>
            </div>
          </div>

          <div class="disk-contour-canvas-wrapper" style="display: flex; justify-content: center; align-items: center; width: 100%; margin: 6px 0;">
            <canvas id="disk-contour-canvas" width="500" height="500" style="width: 100%; max-width: 500px; height: auto; aspect-ratio: 1 / 1; border: 1px solid var(--border); border-radius: 4px; background-color: var(--card-bg);"></canvas>
          </div>

          <div class="sweep-info-cards" style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px; margin-bottom: 8px;">
            <div id="disk-contour-val" style="padding: 8px 12px; background: var(--bg-input-card, var(--card-bg)); border-radius: 6px; font-size: 0.8125rem; font-weight: 600; color: var(--accent); border: 1px solid var(--border);">Active condition summary</div>
          </div>
        </div>
        <div class="sweep-footer-actions">
          <button class="action-btn" id="btn-disk-contour-export-png">EXPORT PNG</button>
          <button class="action-btn" id="btn-disk-contour-export-all-png">EXPORT ALL PNG</button>
        </div>
      </div>
    </div>

    <!-- MODAL: UNSAVED CHANGES CONFIRMATION -->
    <div class="modal-overlay" id="modal-unsaved-confirm">
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <div class="modal-title" style="color: #FFB300;">Unsaved Geometry Changes</div>
          <button class="modal-close-btn" data-close="modal-unsaved-confirm">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <p id="unsaved-confirm-msg" style="margin-bottom: 20px; font-size: 0.9062rem; line-height: 1.5; color: var(--text-main);">Geometry has unsaved changes. Save them before continuing?</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="action-btn" id="btn-unsaved-save" style="height: 48px; font-weight: 700; color: var(--accent-green);">SAVE CHANGES</button>
            <button class="action-btn" id="btn-unsaved-discard" style="height: 48px; font-weight: 700; color: var(--accent-red);">DISCARD CHANGES</button>
            <button class="action-btn" id="btn-unsaved-cancel" style="height: 48px; font-weight: 600;">CANCEL</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: CONTEXTUAL HELP & TOOLTIP -->
    <div class="modal-overlay" id="modal-result-tooltip">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <div class="modal-title" id="result-tooltip-title">About • Parameter</div>
          <button class="modal-close-btn" data-close="modal-result-tooltip">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <div id="result-tooltip-desc" style="font-size: 0.875rem; line-height: 1.6; color: var(--text-main); margin-bottom: 14px;"></div>
          <div id="result-tooltip-svg-box" style="display: none;"></div>
          <div id="result-tooltip-eq-box" style="display: none;"></div>
          <div id="result-tooltip-range-box" style="display: none; font-size: 0.8438rem; margin-bottom: 10px;">
            <span style="font-weight: 700; color: var(--accent-green);">Typical range: </span>
            <span id="result-tooltip-range-text" style="color: var(--text-main);"></span>
          </div>
          <div id="result-tooltip-unit-box" style="display: none; font-size: 0.8438rem; margin-bottom: 16px;">
            <span style="font-weight: 700; color: var(--accent-amber);">Unit: </span>
            <span id="result-tooltip-unit-text" style="color: var(--text-main);"></span>
          </div>
          <button class="action-btn" id="btn-result-tooltip-open-help" style="width: 100%; height: 48px; font-weight: 700; color: var(--accent);">OPEN FULL PHYSICS &amp; EQUATIONS GUIDE</button>
        </div>
      </div>
    </div>

    <!-- MODAL: UNIT CONVERTER -->
    <div class="modal-overlay" id="modal-unit-converter">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">QUICK UNIT CONVERTER</div>
          <button class="modal-close-btn" data-close="modal-unit-converter">×</button>
        </div>
        <div class="modal-body">
          <div class="quick-converter">
            <div class="quick-caption">CONVERSION</div>
            <div class="quick-mode-row"><button class="action-btn" id="quick-converter-mode">kW → hp ▾</button><button class="action-btn" id="quick-converter-swap" aria-label="Swap conversion direction">⇄</button></div>
            <label class="quick-caption" id="quick-converter-label" for="quick-converter-input">VALUE IN kW</label>
            <input class="row-input" type="number" id="quick-converter-input" value="1" inputmode="decimal">
            <div id="quick-converter-result" aria-live="polite">1.341 hp</div>
          </div>
          <details class="advanced-converter"><summary>More unit conversions</summary>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Quantity Category</label>
              <select class="sweep-select" id="converter-category" style="width: 100%; margin-top: 4px;">
                <option value="Speed">Speed &amp; Velocity</option>
                <option value="Thrust">Force &amp; Thrust</option>
                <option value="Power">Power</option>
                <option value="Torque">Torque &amp; Moment</option>
                <option value="Radius">Length &amp; Chord</option>
                <option value="Pressure">Pressure</option>
                <option value="Density">Fluid Density</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">From</label>
                <select class="sweep-select" id="converter-from" style="width: 100%; margin-top: 4px;"></select>
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">To</label>
                <select class="sweep-select" id="converter-to" style="width: 100%; margin-top: 4px;"></select>
              </div>
            </div>
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Value</label>
              <input class="row-input" type="number" id="converter-input-val" aria-label="Value to convert" value="100" style="width: 100%; margin-top: 4px; text-align: left;" />
            </div>
            <div style="padding: 16px; background: var(--header-bg); border: 1px solid var(--border); border-radius: 8px; text-align: center;">
              <div style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">CONVERTED RESULT</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent); margin-top: 4px;" id="converter-result-val">---</div>
            </div>
          </div>
          </details>
        </div>
      </div>
    </div>

    <!-- MODAL: SETTINGS -->
    <div class="modal-overlay" id="modal-settings">
      <div class="modal-card" style="width: min(94vw, 540px); max-height: 90vh;">
        <div class="modal-header">
          <div class="modal-title" style="letter-spacing: 0.08em; font-size: 1rem;">SETTINGS</div>
          <button class="modal-close-btn" data-close="modal-settings">×</button>
        </div>
        <div class="modal-body" style="padding: 12px 18px 24px; overflow-y: auto;">
          <div class="settings-form-grid">
            <div class="settings-section-hdr">DISPLAY</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Theme</div>
                <div class="settings-row-sub">Dark, Light, Midnight Blue or Sepia</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-theme">DARK</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Result Units (Outputs Only)</div>
                <div class="settings-row-sub">SI or Imperial for results; input rows keep their own units</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-units">SI</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Number Format</div>
                <div class="settings-row-sub">Cycle between -1 decimal, standard, and +1 decimal</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-precision">STANDARD</button>
            </div>
            <div class="settings-section-hdr">PLOTS</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Palette</div>
                <div class="settings-row-sub">Sweep curve colors</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-palette">AERO</button>
            </div>

            <div class="settings-section-hdr">ROTOR DATA</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Import Geometries</div>
                <div class="settings-row-sub">Restore or merge a shared backup</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-import">IMPORT</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Export Geometries</div>
                <div class="settings-row-sub">Backup all saved rotor geometries</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-export">EXPORT</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Restore Factory Presets</div>
                <div class="settings-row-sub">Custom rotors are preserved</div>
              </div>
              <button type="button" class="settings-btn" id="btn-setting-restore" style="color: var(--accent-amber);">RESTORE</button>
            </div>
            <div class="settings-section-hdr">WEB APP</div>
            <div class="settings-row" id="row-install-pwa">
              <div class="settings-row-info">
                <div class="settings-row-title">Install Web App</div>
                <div class="settings-row-sub">Add RotorCalculator to home screen / desktop</div>
              </div>
              <button type="button" class="settings-btn" id="btn-install-pwa" style="color: var(--accent-green);">INSTALL</button>
            </div>

            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Download Web App</div>
                <div class="settings-row-sub">Offline ZIP with calculator and physics manuals</div>
              </div>
              <a class="settings-btn" href="./rotorcalculator-offline.zip" download="rotorcalculator-offline.zip">DOWNLOAD</a>
            </div>
            <div class="settings-row">
              <div class="settings-row-info"><div class="settings-row-title">Android App 1.32</div><div class="settings-row-sub">Install the verified production Android build</div></div>
              <a class="settings-btn" href="https://play.google.com/store/apps/details?id=flightdyn.rotorcalculator" target="_blank" rel="noopener">PLAY</a>
            </div>
            <div class="settings-row" style="margin-top: 12px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 14px;">
              <button type="button" class="action-btn" data-close="modal-settings" style="height: 48px; min-width: 120px; font-weight: 700; border-radius: 8px; font-size: 0.9375rem;">CLOSE</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: HELP (Full Offline Engineering Manual Viewer) -->
    <div class="modal-overlay" id="modal-help">
      <div class="modal-card modal-help-card">
        <div class="help-modal-header">
          <div class="modal-title" style="letter-spacing: 0.08em; font-size: 1rem;">PHYSICS &amp; EQUATIONS</div>
          <div class="help-modal-actions">
            <a class="help-btn-open-tab" id="btn-help-open-tab" href="./physics_help.html" target="_blank" rel="noopener noreferrer" title="Open manual in new browser tab">
              <span>↗</span> OPEN IN TAB
            </a>
            <button class="modal-close-btn" data-close="modal-help">×</button>
          </div>
        </div>
        <div class="help-iframe-container">
          <iframe id="help-iframe" class="help-iframe" src="" title="RotorCalculator Physics Manual"></iframe>
        </div>
      </div>
    </div>

    <!-- MODAL: ABOUT -->
    <div class="modal-overlay" id="modal-about">
      <div class="modal-card" style="width: min(100%, 420px); text-align: center;">
        <div class="modal-header">
          <div class="modal-title">About RotorCalculator</div>
          <button class="modal-close-btn" data-close="modal-about">×</button>
        </div>
        <div class="modal-body about-body">
          <p>RotorCalculator v1.32</p>
          <p>Rotor performance calculator based on analytical blade-element theory.</p>
          <p>Developed by Gustavo Zambrano</p>
          <button class="action-btn" data-close="modal-about" style="width: 100%; height: 48px;">OK</button>
        </div>
      </div>
    </div>

    <!-- MODAL: PRIVACY -->
    <div class="modal-overlay" id="modal-privacy">
      <div class="modal-card" style="width: min(100%, 540px);">
        <div class="modal-header">
          <div class="modal-title">PRIVACY POLICY</div>
          <button class="modal-close-btn" data-close="modal-privacy">×</button>
        </div>
        <div class="modal-body privacy-body">
          <iframe id="privacy-iframe" title="RotorCalculator Privacy Policy"></iframe>
        </div>
      </div>
    </div>

    <div class="app-toast" id="app-toast" role="status" aria-live="polite"></div>
    <div class="tooltip-popover" id="tooltip-popover" role="tooltip"></div>
  </main>
`;

// Helper Element Selectors
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const HELP_ASSETS: Record<string, string> = {
  dark: "./physics_help.html",
  light: "./physics_help_light.html",
  midnight: "./physics_help_midnight.html",
  sepia: "./physics_help_sepia.html",
};
const PRIVACY_ASSETS: Record<string, string> = {
  dark: "./privacy_policy.html",
  light: "./privacy_policy_light.html",
  midnight: "./privacy_policy_midnight.html",
  sepia: "./privacy_policy_sepia.html",
};
function helpAssetForTheme(): string {
  return HELP_ASSETS[currentTheme] || HELP_ASSETS.dark;
}

export function openPhysicsHelp(anchor?: string): void {
  const iframe = byId<HTMLIFrameElement>("help-iframe");
  const openTabBtn = byId<HTMLAnchorElement>("btn-help-open-tab");
  const asset = helpAssetForTheme();

  const urlWithAnchor = anchor ? `${asset}#${anchor}` : asset;
  if (iframe && iframe.src !== urlWithAnchor) {
    iframe.src = urlWithAnchor;
  }
  if (openTabBtn) {
    openTabBtn.href = urlWithAnchor;
  }
  openModal("modal-help");
}

function applyTheme(): void {
  document.documentElement.dataset.theme = currentTheme;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute(
      "content",
      currentTheme === "sepia" ? "#EFE8DC" : currentTheme === "light" ? "#006978" : currentTheme === "midnight" ? "#0B1730" : "#0D121B"
    );
  }
  const helpModal = byId("modal-help");
  const iframe = byId<HTMLIFrameElement>("help-iframe");
  const openTabBtn = byId<HTMLAnchorElement>("btn-help-open-tab");
  if (helpModal && helpModal.classList.contains("open") && iframe && iframe.src) {
    const curHash = iframe.src.includes("#") ? iframe.src.split("#")[1] : "";
    const asset = helpAssetForTheme();
    const urlWithAnchor = curHash ? `${asset}#${curHash}` : asset;
    iframe.src = urlWithAnchor;
    if (openTabBtn) openTabBtn.href = urlWithAnchor;
  }
}

function updateTabIndicator(): void {
  const ind = byId("tab-indicator");
  if (!ind) return;
  const idx = currentPage === "geometry" ? 0 : currentPage === "conditions" ? 1 : 2;
  ind.style.transform = `translateX(${idx * 100}%)`;
}

function refreshSelectorCaptions(): void {
  const mobile = (document.querySelector<HTMLElement>(".app-shell")?.clientWidth || innerWidth) < 600;
  const pairs: Record<string, string> = {
    rpm_collective: "Ω + Δθ", rpm_ct: "Ω + C_T", rpm_thrust: "Ω + T",
    collective_ct: "Δθ + C_T", collective_thrust: "Δθ + T", ct_thrust: "C_T + T",
  };
  byId("btn-trim-mode").innerHTML = formatSubscripts(pairs[activeCond.operatingPair] || "Ω + C_T");
  const inflows: Record<string, string> = { uniform: "Uniform", coleman_simple: "Coleman", coleman_feingold: mobile ? "Coleman FG" : "Coleman-Feingold", drees: "Drees" };
  byId("btn-inflow-model").textContent = inflows[activeCond.inflowModel];
  byId("btn-drag-info").textContent = mobile ? "Num. Vec." : "Numerical Vectorial";
  document.querySelectorAll<HTMLElement>(".engineering-row > .action-btn").forEach(el => {
    el.style.fontSize = "1rem";
    let size = 16;
    while (el.scrollWidth > el.clientWidth && size > 13) el.style.fontSize = `${--size / 16}rem`;
  });
}

export function updateResponsiveLabels(): void {
  refreshSelectorCaptions();
  const shell = document.querySelector<HTMLElement>(".app-shell");
  const shellW = shell?.clientWidth || window.innerWidth;
  const isDesktop = window.innerWidth >= 768;
  const startLevel = shellW >= 600 ? 0 : 1;
  // Browser text scaling changes the root font size. Keep the fitted label sizes in step with it.
  const rootScale = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
  const fontScale = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--engineering-font-scale")) || 1) * rootScale;
  const labelSize = (isDesktop ? 16 : shellW <= 340 ? 14.4 : shellW <= 380 ? 15.2 : 16) * fontScale;
  const minLabelSize = 13 * fontScale;
  document.querySelectorAll<HTMLElement>(".row-input, .row-derived-val, .row-unit-btn, .result-val, .result-unit").forEach(el => { el.style.fontSize = `${labelSize}px`; });
  const inset = (el: HTMLElement | null): number => {
    if (!el) return 0;
    const style = getComputedStyle(el);
    return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  };
  // A hidden page has zero measured width. The pages share the input grid;
  // otherwise calculate its tracks with the same dimensions as the CSS.
  const pageWidth = (id: string): number => {
    const page = byId(id);
    return shellW - inset(page);
  };
  const fallbackInputWidth = (id: string): number => {
    const rowInset = isDesktop ? (window.innerWidth >= 1440 ? 48 : window.innerWidth >= 1024 ? 36 : 28) : 16;
    const contentW = pageWidth(id) - rowInset;
    if (isDesktop) return (contentW - 24) * (window.innerWidth >= 1024 ? 0.48 : 0.46);
    const inner = contentW - 8;
    return inner - inner * 0.32 - Math.max(56, inner * 0.19);
  };
  const inputWidth = (id: string): number => {
    const sample = document.querySelector<HTMLElement>(`#${id} .row-label-btn`);
    return Math.max(1, (sample && sample.clientWidth > 0 ? sample.clientWidth : fallbackInputWidth(id)) - inset(sample));
  };
  const geomColW = inputWidth("page-geometry");
  const condColW = inputWidth("page-conditions");
  // Reserve the switch glyph so flow labels fit at the same size as every row.
  const condFitW = condColW - measureTextWidth(" ⇄", labelSize);
  const geomLevel = chooseLevel(GEOM_KEYS, geomColW / fontScale, startLevel);
  const condLevel = chooseLevel(COND_KEYS, condFitW / fontScale, startLevel);
  const geomLblSp = fitLabelSize(GEOM_KEYS, geomLevel, geomColW, labelSize, minLabelSize);
  const condLblSp = fitLabelSize(COND_KEYS, condLevel, condFitW, labelSize, minLabelSize);

  document.querySelectorAll<HTMLButtonElement>("#page-geometry .row-label-btn[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;
    btn.innerHTML = getRichLabelHtml(key, geomLevel);
    btn.style.fontSize = `${geomLblSp}px`;
  });
  document.querySelectorAll<HTMLButtonElement>("#page-conditions .row-label-btn[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;
    const switching = ["mu", "Vx", "alpha", "Vz", "muz"].includes(key);
    btn.innerHTML = getRichLabelHtml(key, condLevel, switching ? " ⇄" : "");
    btn.style.fontSize = `${condLblSp}px`;
  });
  for (const id of ["lbl-operating-1", "lbl-operating-2"]) {
    const label = byId(id);
    if (label?.dataset.key) {
      label.innerHTML = getRichLabelHtml(label.dataset.key, condLevel);
      label.style.fontSize = `${condLblSp}px`;
    }
  }
  document.querySelectorAll<HTMLElement>(".result-row[data-key]").forEach((row) => {
    const key = row.dataset.key;
    const label = row.querySelector<HTMLElement>(".result-label");
    if (!key || !label) return;
    const contentW = pageWidth("page-results") - inset(row);
    const fraction = isDesktop && window.innerWidth >= 1024 ? 0.48 : 0.46;
    const fallback = (contentW - (isDesktop ? 24 : 0)) * fraction;
    const width = (label.clientWidth || fallback) - inset(label);
    label.innerHTML = resultLabelHtml(key, width, labelSize);
    label.style.fontSize = `${labelSize}px`;
  });
}

function activatePage(page: "geometry" | "conditions" | "results", swipeDir?: "left" | "right", historyMode: "push" | "replace" | "none" = "push"): void {
  const pageChanged = page !== currentPage;
  currentPage = page;
  safeSet("rotor_current_page", page);
  if (historyMode !== "none") {
    const state = { rotorCalculator: true, page };
    if (historyMode === "replace" || !pageChanged) history.replaceState(state, "");
    else history.pushState(state, "");
  }
  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  document.querySelectorAll<HTMLElement>(".page").forEach((p) => {
    p.classList.toggle("active", p.id === `page-${page}`);
    p.classList.remove("swipe-in-left", "swipe-in-right");
  });

  const contentArea = document.querySelector<HTMLElement>(".content-area");
  if (contentArea) contentArea.scrollTop = 0;

  const activeEl = byId(`page-${page}`);
  if (activeEl && swipeDir) {
    activeEl.classList.add(swipeDir === "left" ? "swipe-in-left" : "swipe-in-right");
    setTimeout(() => activeEl.classList.remove("swipe-in-left", "swipe-in-right"), 200);
  }
  updateTabIndicator();
  updateResponsiveLabels();
}

// Option Selector Modal
// Labels and descriptions are plain text. Only strings written in this file may set `html`.
function showOptionPicker(
  title: string,
  options: OptionItem[],
  currentSelectedId: string,
  onSelect: (id: string) => void
): void {
  byId("options-selector-title").textContent = title;
  const list = byId("options-selector-list");
  list.innerHTML = "";
  list.setAttribute("role", "radiogroup");
  list.setAttribute("aria-label", title);
  options.forEach((opt) => {
    const item = document.createElement("button");
    item.type = "button";
    const isSel = opt.id === currentSelectedId;
    item.className = `option-item${isSel ? " selected" : ""}`;
    item.dataset.optionId = opt.id;
    item.setAttribute("role", "radio");
    item.setAttribute("aria-checked", String(isSel));

    const group = document.createElement("span");
    group.className = "option-text-group";
    const label = document.createElement("span");
    label.className = "option-label";
    if (opt.html) label.innerHTML = opt.label;
    else label.textContent = opt.label;
    group.append(label);
    if (opt.desc) {
      const desc = document.createElement("span");
      desc.className = "option-desc";
      if (opt.html) desc.innerHTML = opt.desc;
      else desc.textContent = opt.desc;
      group.append(desc);
    }
    const radio = document.createElement("span");
    radio.className = "option-radio";
    radio.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.className = "option-radio-inner";
    radio.append(inner);
    item.append(group, radio);

    item.addEventListener("click", () => {
      closeModal("modal-options-selector");
      onSelect(opt.id);
    });
    list.appendChild(item);
  });
  openModal(
    "modal-options-selector",
    list.querySelector<HTMLElement>(".option-item.selected") || list.querySelector<HTMLElement>(".option-item")
  );
}

/** Mark option rows from this file as trusted markup (subscripts). */
function trustedOptions(options: OptionItem[]): OptionItem[] {
  return options.map((opt) => ({ ...opt, html: true }));
}

// Inline field feedback: a small message under a row ("Limited to 50 m.").
function rowHintFor(inputId: string, create: boolean): HTMLElement | null {
  const input = document.getElementById(inputId);
  const row = input?.closest<HTMLElement>(".engineering-row");
  if (!row) return null;
  let hint = row.querySelector<HTMLElement>(":scope > .row-hint");
  if (!hint && create) {
    hint = document.createElement("div");
    hint.className = "row-hint";
    hint.id = `hint-${inputId}`;
    hint.setAttribute("role", "status");
    hint.hidden = true;
    row.append(hint);
  }
  return hint;
}

function showFieldHint(inputId: string, message: string): void {
  const hint = rowHintFor(inputId, true);
  if (!hint) return;
  hint.textContent = message;
  hint.hidden = false;
  const input = document.getElementById(inputId);
  input?.setAttribute("aria-describedby", [hint.id, input.dataset.unitId].filter(Boolean).join(" "));
}

function clearFieldHint(inputId: string): void {
  const hint = rowHintFor(inputId, false);
  if (!hint) return;
  hint.hidden = true;
  hint.textContent = "";
}

function clearAllFieldHints(): void {
  document.querySelectorAll<HTMLElement>(".row-hint").forEach((hint) => {
    hint.hidden = true;
    hint.textContent = "";
  });
}

/**
 * Limit a value (in `baseUnit`) to a range. Shows "Limited to X" in the row of
 * `inputId` when the value moved, and clears the message otherwise.
 */
function limitValue(
  inputId: string,
  key: string,
  value: number,
  range: readonly number[],
  baseUnit: string,
  unitBtnId?: string
): number {
  const clamped = Math.max(range[0], Math.min(range[1], value));
  if (clamped !== value) {
    const unit = unitBtnId ? byId(unitBtnId)?.textContent?.trim() || baseUnit : baseUnit;
    const shown = formatInputValue(key, convertValue(clamped, baseUnit, unit), unit);
    const unitText = unit && unit !== "–" && unit !== "—" ? ` ${unit}` : "";
    showFieldHint(inputId, `Limited to ${shown}${unitText}.`);
  } else {
    clearFieldHint(inputId);
  }
  return clamped;
}

// Toast and storage warnings
let toastTimer: number | undefined;
function showToast(message: string, action?: { label: string; onClick: () => void }, durationMs = 4000): void {
  const el = document.getElementById("app-toast");
  if (!el) return;
  el.textContent = "";
  const text = document.createElement("span");
  text.className = "app-toast-text";
  text.textContent = message;
  el.appendChild(text);
  el.classList.toggle("has-action", !!action);
  if (action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "app-toast-action";
    btn.id = "btn-toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      window.clearTimeout(toastTimer);
      el.classList.remove("visible");
      action.onClick();
    });
    el.appendChild(btn);
  }
  el.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove("visible"), durationMs);
}

const UNDO_DELETE_MS = 7000;

/** Remove a rotor and offer a 7-second UNDO that restores it at its index and active state. */
function deleteRotorWithUndo(rotor: StoredRotor): void {
  const index = storedRotors.findIndex((r) => r.id === rotor.id);
  if (index < 0) return;
  const wasActive = currentRotor.id === rotor.id;
  storedRotors = storedRotors.filter((r) => r.id !== rotor.id);
  if (!saveStoredRotors(storedRotors)) reportStorageFailure();
  if (wasActive) activateRotor(storedRotors[0]);
  renderRotorManagerList();
  showToast(`Deleted "${rotor.name}".`, {
    label: "UNDO",
    onClick: () => {
      if (storedRotors.some((r) => r.id === rotor.id)) return;
      storedRotors.splice(Math.min(index, storedRotors.length), 0, rotor);
      if (!saveStoredRotors(storedRotors)) reportStorageFailure();
      if (wasActive) activateRotor(rotor);
      renderRotorManagerList();
    },
  }, UNDO_DELETE_MS);
}

let storageWarned = false;
function reportStorageFailure(): void {
  if (storageWarned) return;
  storageWarned = true;
  showToast("Browser storage is full or blocked. Changes stay in this session only.");
}

// Recalculate & Render UI
function recalculate(): void {
  if (!Number.isFinite(activeCond.altitudeM)) activeCond.altitudeM = 0;
  if (!Number.isFinite(activeCond.temperatureC)) activeCond.temperatureC = 15;
  // Altitude and temperature define rho, p and a. Derive them before every solve.
  activeCond = updateAtmosphere(activeCond, activeCond.altitudeM, activeCond.temperatureC);
  if (!safeSet("rotorcalc_active_cond", JSON.stringify(activeCond))) reportStorageFailure();
  activeGeom = resolveSolidity(activeGeom);
  activeResults = calculate(activeGeom, activeCond);
  renderDerivedGeometry();
  renderResults();
  refreshInputPresentation();
}

function refreshInputPresentation(): void {
  const geometry: [string, string, string, string][] = [
    ["inp-rpm-nom", "rpmNom", "rpm", "unit-rpm-nom"], ["inp-radius", "R", "m", "unit-radius"],
    ["inp-nblades", "Nb", "", ""], ["inp-cutout", "x0", "", ""],
    ["inp-chord-root", "c0", "m", "unit-chord-root"], ["inp-chord-tip", "c1", "m", "unit-chord-tip"],
    ["drv-taper", "taper", "", ""], ["inp-aspect-ratio", "AR", "", ""],
    ["inp-sigma-ref", "sigmaRef", "", ""], ["drv-sigma-geom", "sigmaAct", "", ""], ["drv-sigma-thrust", "sigmaT", "", ""],
    ["drv-disk-area", "A", "m²", "unit-disk-area"], ["drv-blade-area-ref", "Ab", "m²", "unit-blade-area-ref"], ["drv-blade-area", "Aact", "m²", "unit-blade-area"],
    ["inp-theta-root", "thRoot", "rad", "unit-theta-root"], ["inp-theta-tip", "thTip", "rad", "unit-theta-tip"], ["drv-twist", "thTwist", "rad", "unit-twist"],
    ["inp-lift-slope", "a0", "rad⁻¹", "unit-lift-slope"], ["inp-cd0", "Cd0", "", ""], ["inp-tiploss-b", "B", "", ""],
  ];
  const display = (id: string, key: string, value: number, base: string, unitId: string) => {
    const field = byId<HTMLInputElement>(id);
    if (!field || document.activeElement === field) return;
    const unit = unitId ? byId(unitId).textContent?.trim() || base : base;
    field.value = formatInputValue(key, base ? convertValue(value, base, unit) : value, unit, extraPrecision);
  };
  const direct: Record<string, number> = { rpmNom: activeGeom.nominalRpm || activeGeom.rpm, a0: activeGeom.liftSlope0, Cd0: activeGeom.cd0, B: activeGeom.tipLossB };
  for (const [id, key, base, unitId] of geometry) display(id, key, key in direct ? direct[key] : getGeometryQuantity(activeGeom, key), base, unitId);
  display("inp-altitude", "h", activeCond.altitudeM, "m", "unit-altitude");
  display("inp-temperature", "T0", activeCond.temperatureC, "°C", "unit-temperature");
  display("inp-kind", "kind", activeCond.kInd, "", "");
  display("inp-horiz-val", activeCond.horizontalMode === "vx" ? "Vx" : "mu", activeCond.horizontalValue, activeCond.horizontalMode === "vx" ? "m/s" : "", "unit-horiz-val");
  display("inp-axial-val", activeCond.axialMode === "vz" ? "Vz" : activeCond.axialMode === "muz" ? "muz" : "alpha", activeCond.axialValue, activeCond.axialMode === "vz" ? "m/s" : activeCond.axialMode === "alpha" ? "deg" : "", "unit-axial-val");
  const pairKeys: Record<string, string[]> = { rpm_collective: ["rpm", "coll"], rpm_ct: ["rpm", "CTtgt"], rpm_thrust: ["rpm", "Ttgt"], collective_ct: ["coll", "CTtgt"], collective_thrust: ["coll", "Ttgt"], ct_thrust: ["CTtgt", "Ttgt"] };
  const values: Record<string, number> = { rpm: activeCond.rpm, coll: activeCond.collectiveDeg, CTtgt: activeCond.targetCT, Ttgt: activeCond.targetThrustN };
  pairKeys[activeCond.operatingPair].forEach((key, i) => display(`inp-operating-${i + 1}`, key, values[key], key === "rpm" ? "rpm" : key === "coll" ? "deg" : key === "Ttgt" ? "N" : "", `unit-operating-${i + 1}`));
}

/** Tip-factor cell. The other derived values are written by refreshInputPresentation. */
function renderDerivedGeometry(): void {
  const tipInput = byId<HTMLInputElement>("inp-tiploss-b");
  const tipReadOnly = byId<HTMLInputElement>("drv-tip-factor");
  const fixedTip = activeGeom.tipLossMode === "fixed";
  tipInput.style.display = fixedTip ? "" : "none";
  tipReadOnly.style.display = fixedTip ? "none" : "";
  tipReadOnly.value = (activeGeom.tipLossMode === "none" ? 1 : activeResults.solutionValid ? activeResults.bFactor : activeGeom.tipLossB).toFixed(4 + extraPrecision);
}

function renderResults(): void {
  const r = activeResults;

  // Status & Trim Chips (matching APK UpdateStatusChips & PairChipText 1:1)
  const tipMach = r.speedOfSound > 0 ? r.tipSpeed / r.speedOfSound : 0.0;
  type StatusLevel = "ok" | "warn" | "error";
  let level: StatusLevel = "ok";
  let statusTxt = "";
  const warning = (r.validityWarning || "").trim();

  if (r.compressibilityInvalid) {
    level = "error";
    statusTxt = `Advancing tip Mach M_adv = ${formatSig(r.advancingTipMach, 3)}. Prandtl-Glauert is invalid.`;
  } else if (!r.solutionValid) {
    level = "error";
    statusTxt = "Invalid operating point";
    const sm = (r.statusMessage || "").replace("INVALID: ", "").replace("INVALID:", "").trim();
    if (sm && !sm.includes("could not be trimmed")) {
      statusTxt += `: ${sm}`;
    } else {
      statusTxt += ": the selected constraints cannot be trimmed";
    }
  } else if (r.advancingTipMach >= 0.9) {
    level = "warn";
    statusTxt = `Advancing tip Mach M_adv = ${formatSig(r.advancingTipMach, 3)}: compressibility caution`;
  } else if (tipMach >= 0.8 || r.compressibilityWarning) {
    level = "warn";
    statusTxt = `Tip Mach M_tip = ${formatSig(tipMach, 3)}: compressibility caution`;
  } else {
    statusTxt = `Model Valid: M_tip = ${formatSig(tipMach, 3)}, M_adv = ${formatSig(r.advancingTipMach, 3)}`;
  }
  if (warning) {
    if (level === "ok") statusTxt = warning;
    else statusTxt += `\n${warning}`;
    if (level === "ok") level = "warn";
  }

  const chipColors: Record<StatusLevel, [string, string, string]> = {
    ok: ["var(--text-muted)", "var(--input-bg)", "var(--border)"],
    warn: ["var(--accent-amber)", "rgba(255, 179, 0, 0.1)", "rgba(255, 179, 0, 0.45)"],
    error: ["var(--accent-red)", "rgba(255, 23, 68, 0.08)", "rgba(255, 23, 68, 0.4)"],
  };
  const statusHtml = formatSubscripts(statusTxt).replace(/\n/g, "<br>");

  const badgeModel = byId("badge-model-status");
  const txtModel = byId("txt-model-status");
  if (txtModel) txtModel.innerHTML = statusHtml;
  if (badgeModel) {
    [badgeModel.style.color, badgeModel.style.background, badgeModel.style.borderColor] = chipColors[level];
    badgeModel.dataset.level = level;
  }

  // Banner above the results: says why the values are missing or limited.
  const banner = byId("results-banner");
  if (banner) {
    banner.hidden = level === "ok";
    banner.className = `results-banner ${level}`;
    banner.innerHTML = level === "ok" ? "" : statusHtml;
  }

  const pairKey = activeCond.operatingPair;
  const pairChipLabels: Record<string, string> = {
    rpm_collective: "Ω + Δθ",
    rpm_ct: "Ω + C_T",
    rpm_thrust: "Ω + T",
    collective_ct: "Δθ + C_T",
    collective_thrust: "Δθ + T",
    ct_thrust: "C_T + T",
  };
  const pairTxt = pairChipLabels[pairKey] || pairKey;
  const badgeTrim = byId("badge-solution-summary");
  const txtTrim = byId("txt-solution-summary");
  if (txtTrim) {
    const trimLevel: StatusLevel = r.solutionValid ? "ok" : "error";
    txtTrim.innerHTML = formatSubscripts(r.solutionValid ? `Trim: ${pairTxt}` : `Trim: ${pairTxt}: no solution`);
    if (badgeTrim) [badgeTrim.style.color, badgeTrim.style.background, badgeTrim.style.borderColor] = chipColors[trimLevel];
  }

  const imp = unitSystem === "imperial";
  document.querySelectorAll<HTMLElement>("#page-results .result-row[data-key]").forEach((row) => {
    const key = row.dataset.key;
    if (!key) return;
    const valEl = row.querySelector<HTMLElement>(".result-val");
    const unitEl = row.querySelector<HTMLElement>(".result-unit");
    if (valEl) {
      valEl.textContent = resTextFor(key, r, activeGeom, imp, extraPrecision);
      if (r.solutionValid && valEl.textContent === "---") {
        valEl.title = key === "FM" ? "Figure of merit applies to hover only." : "Not defined for this operating point.";
      } else {
        valEl.removeAttribute("title");
      }
    }
    if (unitEl) {
      unitEl.textContent = resUnitFor(key, imp);
    }
  });

  updateResponsiveLabels();
}

function resUnitFor(key: string, imp: boolean): string {
  if (key === "p") return imp ? "inHg" : "hPa";
  if (key === "h") return imp ? "ft" : "m";
  switch (key) {
    case "T":
    case "H":
    case "Hi":
    case "H0":
    case "Y":
      return imp ? "lbf" : "N";
    case "P":
    case "Pi":
    case "P0":
    case "Pair":
      return imp ? "hp" : "kW";
    case "Q":
    case "Qi":
    case "Q0":
    case "Mx":
    case "My":
      return imp ? "lbf·ft" : "N·m";
    case "DL":
      return imp ? "lbf/ft²" : "N/m²";
    case "PL":
      return imp ? "lbf/hp" : "N/kW";
    case "vi":
    case "OmR":
    case "Vx":
    case "Vz":
    case "Vztot":
    case "Vadv":
    case "Vret":
    case "a":
      return imp ? "ft/s" : "m/s";
    case "chi":
    case "alpha":
    case "coll":
    case "aoaAdv25":
    case "aoaRet25":
    case "phiAdv25":
    case "phiRet25":
    case "aoaAdv50":
    case "aoaRet50":
    case "phiAdv50":
    case "phiRet50":
    case "aoaAdv75":
    case "aoaRet75":
    case "phiAdv75":
    case "phiRet75":
    case "aoaAdvTip":
    case "aoaRetTip":
    case "phiAdvTip":
    case "phiRetTip":
      return "deg";
    case "rpm":
      return "rpm";
    case "T0":
      return imp ? "°F" : "°C";
    case "rho":
      return imp ? "slug/ft³" : "kg/m³";
    default:
      return "–";
  }
}

function resTextFor(
  key: string,
  r: RotorResults,
  geom: RotorGeometry,
  imp: boolean,
  extraPrec: number
): string {
  if (!r.solutionValid) return "---";
  const sg = Math.max(1, 4 + extraPrec);
  const ft = 3.280839895;
  const omR = r.tipSpeed;
  const area = Math.PI * geom.radius * geom.radius;
  let v = 0;

  if (key === "p") {
    v = imp ? r.pressurePa / 3386.389 : r.pressurePa / 100.0;
    return formatSig(v, sg);
  }
  if (key === "h") {
    v = r.altitudeM;
    if (imp) v = v * ft;
    return formatSig(v, sg);
  }

  switch (key) {
    case "T":
      v = imp ? r.thrustLbf : r.thrustN;
      return formatFixed(v, 1, extraPrec);
    case "P":
      v = imp ? r.powerShaftHP : r.powerShaftKW;
      return formatFixed(v, 1, extraPrec);
    case "Pi":
      v = (r.CQi * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      return formatFixed(v, 1, extraPrec);
    case "P0":
      v = (r.CQ0 * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      return formatFixed(v, 1, extraPrec);
    case "Pair":
      v = (r.CPair * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      return formatFixed(v, 1, extraPrec);
    case "Qi":
      v = r.CQi * r.densityRho * area * omR * omR * geom.radius;
      if (imp) v = v * 0.737562149;
      return formatFixed(v, 1, extraPrec);
    case "Q0":
      v = r.CQ0 * r.densityRho * area * omR * omR * geom.radius;
      if (imp) v = v * 0.737562149;
      return formatFixed(v, 1, extraPrec);
    case "Hi":
      v = r.CHi * r.densityRho * area * omR * omR;
      if (imp) v = v * 0.224808943;
      return formatFixed(v, 1, extraPrec);
    case "H0":
      v = r.CH0 * r.densityRho * area * omR * omR;
      if (imp) v = v * 0.224808943;
      return formatFixed(v, 1, extraPrec);
    case "Q":
      v = imp ? r.torqueLbft : r.torqueNm;
      return formatFixed(v, 1, extraPrec);
    case "H":
      v = imp ? r.dragHN * 0.224808943 : r.dragHN;
      return formatFixed(v, 1, extraPrec);
    case "Y":
      v = imp ? r.sideForceYLbf : r.sideForceYN;
      return formatFixed(v, 1, extraPrec);
    case "Mx":
      v = imp ? r.rollMomentLbft : r.rollMomentNm;
      return formatFixed(v, 1, extraPrec);
    case "My":
      v = imp ? r.pitchMomentLbft : r.pitchMomentNm;
      return formatFixed(v, 1, extraPrec);
    case "DL":
      if (area <= 0) return "---";
      v = r.thrustN / area;
      if (imp) v = v * 0.0208854342;
      break;
    case "PL":
      if (r.powerShaftKW <= 0.000001) return "---";
      v = r.thrustN / r.powerShaftKW;
      if (imp) v = (v * 0.224808943) / 1.34102209;
      break;
    case "vi":
      v = r.inflowLambdaI * omR;
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "CTs": {
      const sg2 = resolveSolidity(cloneGeometry(geom));
      let sigma = sg2.sigmaThrust;
      if (sigma <= 0) sigma = sg2.sigmaRef;
      if (sigma <= 0) return "---";
      v = r.CT / sigma;
      break;
    }
    case "FM":
      if (Math.abs(r.operatingMu) > 0.0005 || Math.abs(r.operatingMuZ) > 0.0005) return "---";
      v = r.FoM;
      break;
    case "LDe":
      return formatFixed(r.L_D_eff, 3, extraPrec);
    case "CT":
      v = r.CT;
      break;
    case "CQ":
      return formatFixed(r.CQ, 7, extraPrec);
    case "CQi":
      return formatFixed(r.CQi, 7, extraPrec);
    case "CQ0":
      return formatFixed(r.CQ0, 7, extraPrec);
    case "CH":
      return formatFixed(r.CH, 7, extraPrec);
    case "CHi":
      return formatFixed(r.CHi, 7, extraPrec);
    case "CH0":
      return formatFixed(r.CH0, 7, extraPrec);
    case "CY":
      return formatFixed(r.CY, 7, extraPrec);
    case "CMx":
      return formatFixed(r.CMx, 6, extraPrec);
    case "CMy":
      return formatFixed(r.CMy, 6, extraPrec);
    case "CPair":
      return formatFixed(r.CPair, 7, extraPrec);
    case "CLbar": {
      const sg3 = resolveSolidity(cloneGeometry(geom));
      let sigma3 = sg3.sigmaThrust;
      if (sigma3 <= 0) sigma3 = sg3.sigmaRef;
      v = derivedClBar(r, sigma3);
      break;
    }
    case "Vztot":
    case "Vadv":
    case "Vret":
      v = derivedOutput(r, key);
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "Mret":
      v = derivedOutput(r, key);
      return formatFixed(v, 3, extraPrec);
    case "aoaAdv25":
    case "aoaRet25":
    case "phiAdv25":
    case "phiRet25":
    case "aoaAdv50":
    case "aoaRet50":
    case "phiAdv50":
    case "phiRet50":
    case "aoaAdv75":
    case "aoaRet75":
    case "phiAdv75":
    case "phiRet75":
    case "aoaAdvTip":
    case "aoaRetTip":
    case "phiAdvTip":
    case "phiRetTip":
      v = derivedOutput(r, key);
      return formatFixed(v, 2, extraPrec);
    case "Tc":
      v = derivedTc(r, area);
      break;
    case "Pc":
      return formatFixed(derivedPc(r, area), 7, extraPrec);
    case "lamh":
      v = derivedLambdaH(r);
      break;
    case "muLam":
      v = derivedMuOverLambda(r);
      break;
    case "lam":
      v = r.inflowLambda;
      break;
    case "lami":
      v = r.inflowLambdaI;
      break;
    case "Kx":
      v = r.inflowKx;
      break;
    case "Ky":
      v = r.inflowKy;
      break;
    case "chi":
      v = r.wakeSkewChiDeg;
      return formatFixed(v, 2, extraPrec);
    case "Bres":
      v = r.bFactor;
      break;
    case "rpm":
      v = r.trimmedRPM;
      return formatFixed(v, 1, extraPrec);
    case "coll":
      v = r.trimmedCollectiveDeg;
      return formatFixed(v, 2, extraPrec);
    case "mu":
      v = r.operatingMu;
      break;
    case "muz":
      v = r.operatingMuZ;
      break;
    case "alpha":
      v = r.operatingAlphaDeg;
      return formatFixed(v, 2, extraPrec);
    case "Vx":
      v = r.operatingVx;
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "Vz":
      v = r.operatingVz;
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "OmR":
      v = omR;
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "a":
      v = r.speedOfSound;
      if (imp) v = v * ft;
      return formatFixed(v, 2, extraPrec);
    case "Mtip":
      if (r.speedOfSound <= 0) return "---";
      v = omR / r.speedOfSound;
      return formatFixed(v, 3, extraPrec);
    case "Madv":
      v = r.advancingTipMach;
      return formatFixed(v, 3, extraPrec);
    case "T0":
      v = r.temperatureC;
      if (imp) v = (v * 9.0) / 5.0 + 32.0;
      return formatFixed(v, 2, extraPrec);
    case "rho":
      v = r.densityRho;
      if (imp) v = v * 0.0019403203;
      break;
    default:
      return "---";
  }

  if (isNaN(v)) return "---";
  return formatSig(v, sg);
}

export function showContextualHelp(key: string): void {
  const nom = getNomenclature(key);
  if (!nom) return;
  const title = formatDescriptionSymbol(key, "L");
  byId("result-tooltip-title").innerHTML = title;
  byId("result-tooltip-desc").innerHTML = (nom.body || `Engineering quantity for ${nom.full}.`).replace(/\n/g, "<br>");

  const svgBox = byId("result-tooltip-svg-box");
  const svgContent = getHelpSvg(key);
  if (svgContent) {
    svgBox.innerHTML = svgContent;
    svgBox.style.display = "block";
  } else {
    svgBox.innerHTML = "";
    svgBox.style.display = "none";
  }

  const eqBox = byId("result-tooltip-eq-box");
  if (nom.eq) {
    eqBox.innerHTML = renderEquationMathML(key, nom.eq);
    eqBox.style.display = "block";
  } else {
    eqBox.style.display = "none";
  }

  const rangeBox = byId("result-tooltip-range-box");
  const rangeText = byId("result-tooltip-range-text");
  if (nom.range) {
    rangeText.textContent = nom.range;
    rangeBox.style.display = "block";
  } else {
    rangeBox.style.display = "none";
  }

  const unitBox = byId("result-tooltip-unit-box");
  const unitText = byId("result-tooltip-unit-text");
  if (nom.unit) {
    unitText.textContent = nom.unit === "–" ? "Dimensionless (–)" : nom.unit;
    unitBox.style.display = "block";
  } else {
    unitBox.style.display = "none";
  }

  openModal("modal-result-tooltip");
}

export function showContextualHelpCustom(title: string, message: string): void {
  byId("result-tooltip-title").innerHTML = title;
  byId("result-tooltip-desc").innerHTML = message.replace(/\n/g, "<br>");
  const svgBox = byId("result-tooltip-svg-box");
  if (svgBox) {
    svgBox.innerHTML = "";
    svgBox.style.display = "none";
  }
  byId("result-tooltip-eq-box").style.display = "none";
  byId("result-tooltip-range-box").style.display = "none";
  byId("result-tooltip-unit-box").style.display = "none";
  openModal("modal-result-tooltip");
}

function bindResultRowTooltips(): void {
  document.querySelectorAll<HTMLElement>(".result-row").forEach((row) => {
    row.addEventListener("click", () => {
      const key = row.dataset.key;
      if (key) showContextualHelp(key);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("button.result-label").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      if (key) showContextualHelp(key);
    });
  });

  byId("badge-model-status")?.addEventListener("click", () => {
    const r = activeResults;
    if (r.compressibilityInvalid) {
      showContextualHelpCustom(
        "Prandtl-Glauert Invalid",
        "The advancing-tip Mach number has reached or passed the Prandtl-Glauert singularity (M = 1).\n\nLower the rotor speed or the forward speed, or switch Compressibility to Off in Geometry."
      );
    } else if (!r.solutionValid) {
      showContextualHelpCustom(
        "Model Status",
        `${r.statusMessage || "Operating point failed to converge."}\n\nAdjust the prescribed operating pair, flight condition, or rotor definition.`
      );
    } else if (r.compressibilityWarning || r.advancingTipMach >= 0.9) {
      showContextualHelpCustom(
        "Compressibility Caution",
        `${r.validityWarning ? `${r.validityWarning}\n\n` : ""}Tip Mach is at or above 0.80, or advancing-tip Mach is at or above 0.90.\n\nThe calculation remains finite, but the linear Prandtl-Glauert approximation is outside its preferred range.`
      );
    } else {
      showContextualHelpCustom(
        "Model Status",
        `${r.validityWarning ? `${r.validityWarning}\n\n` : ""}Valid operating point. Tip Mach and advancing-tip Mach are inside the preferred range.`
      );
    }
  });

  byId("badge-solution-summary")?.addEventListener("click", () => {
    showContextualHelp("trim");
  });

  byId("btn-result-tooltip-open-help")?.addEventListener("click", () => {
    closeModal("modal-result-tooltip");
    openPhysicsHelp();
  });
}

// Operating Controls Setup
const SPEED_UNITS = ["m/s", "kt", "km/h", "mph", "ft/s"];
const CLIMB_UNITS = ["m/s", "ft/s", "kt", "km/h", "ft/min"];
const THRUST_UNITS = ["N", "kN", "lbf", "kgf"];

type OperatingKey = "rpm" | "coll" | "CTtgt" | "Ttgt";
const OPERATING_SLOTS: Record<FlightCondition["operatingPair"], [OperatingKey, OperatingKey]> = {
  rpm_collective: ["rpm", "coll"],
  rpm_ct: ["rpm", "CTtgt"],
  rpm_thrust: ["rpm", "Ttgt"],
  collective_ct: ["coll", "CTtgt"],
  collective_thrust: ["coll", "Ttgt"],
  ct_thrust: ["CTtgt", "Ttgt"],
};
const OPERATING_CANONICAL: Record<OperatingKey, string> = {
  rpm: "RPM",
  coll: "Collective Δθ",
  CTtgt: "Target C_T",
  Ttgt: "Target Thrust",
};

function operatingUnitChoices(key: OperatingKey | string | undefined): string[] {
  if (key === "rpm" || key === "rpmNom") return ["rpm", "rad/s"];
  if (key === "coll") return ["deg", "rad"];
  if (key === "Ttgt") return THRUST_UNITS;
  return [];
}

function refreshConditionFields(): void {
  const horizontalKey = activeCond.horizontalMode === "vx" ? "Vx" : "mu";
  byId("btn-toggle-horiz-mode").dataset.key = horizontalKey;
  const horizUnit = byId("unit-horiz-val");
  if (horizontalKey === "Vx") {
    if (!SPEED_UNITS.includes(horizUnit.textContent?.trim() || "")) horizUnit.textContent = prefSpeedUnit;
  } else {
    horizUnit.textContent = "–";
  }
  const axialKey = activeCond.axialMode === "vz" ? "Vz" : activeCond.axialMode === "muz" ? "muz" : "alpha";
  byId("btn-toggle-axial-mode").dataset.key = axialKey;
  const axialUnit = byId("unit-axial-val");
  const axialText = axialUnit.textContent?.trim() || "";
  if (axialKey === "Vz") {
    if (!CLIMB_UNITS.includes(axialText)) axialUnit.textContent = unitSystem === "imperial" ? "ft/min" : "m/s";
  } else if (axialKey === "alpha") {
    if (!["deg", "rad"].includes(axialText)) axialUnit.textContent = "deg";
  } else {
    axialUnit.textContent = "–";
  }
  const inflowLabels: Record<string, string> = { uniform: "Uniform", coleman_simple: "Coleman", coleman_feingold: "Coleman-Feingold", drees: "Drees" };
  byId("btn-inflow-model").textContent = inflowLabels[activeCond.inflowModel] || activeCond.inflowModel;
  refreshOperatingControls();
  refreshInputPresentation();
}

function refreshOperatingControls(): void {
  const slots = OPERATING_SLOTS[activeCond.operatingPair] || OPERATING_SLOTS.rpm_ct;
  slots.forEach((key, index) => {
    const label = byId(`lbl-operating-${index + 1}`);
    const unit = byId(`unit-operating-${index + 1}`);
    label.dataset.key = key;
    label.dataset.canonical = OPERATING_CANONICAL[key];
    const choices = operatingUnitChoices(key);
    const current = unit.textContent?.trim() || "";
    if (choices.length === 0) unit.textContent = "–";
    else if (!choices.includes(current)) unit.textContent = key === "Ttgt" && choices.includes(prefThrustUnit) ? prefThrustUnit : choices[0];
  });
  const pairs: Record<string, string> = {
    rpm_collective: "Ω + Δθ",
    rpm_ct: "Ω + C_T",
    rpm_thrust: "Ω + T",
    collective_ct: "Δθ + C_T",
    collective_thrust: "Δθ + T",
    ct_thrust: "C_T + T",
  };
  byId("btn-trim-mode").innerHTML = formatSubscripts(pairs[activeCond.operatingPair] || "Ω + C_T");
  updateResponsiveLabels();
}

function escapeHTML(str: string): string {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function updateActiveRotorBar(): void {
  const bar = byId("display-active-rotor-name");
  if (!bar) return;
  if (isGeometryDirty) {
    bar.innerHTML = `${escapeHTML(activeGeom.name)} <span class="unsaved-tag">• * UNSAVED</span>`;
  } else {
    bar.textContent = currentRotor.name;
  }
}

function markGeometryDirty(): void {
  if (!saveDraft(activeGeom, currentRotor.id)) reportStorageFailure();
  refreshAirfoilName();
  if (!isGeometryDirty) {
    isGeometryDirty = true;
    updateActiveRotorBar();
  }
}

function resolveUnsavedGeometry(actionText: string, onProceed: () => void): void {
  if (!isGeometryDirty) {
    onProceed();
    return;
  }
  pendingUnsavedAction = onProceed;
  byId("unsaved-confirm-msg").textContent = `Geometry has unsaved changes. Save them before ${actionText}?`;
  openModal("modal-unsaved-confirm");
}

const TIP_MODE_LABELS: Record<string, string> = { none: "None", fixed: "Fixed", sissingh: "Sissingh" };

function refreshGeometrySelectors(): void {
  byId<HTMLButtonElement>("btn-tiploss-mode").textContent = TIP_MODE_LABELS[activeGeom.tipLossMode] || "Sissingh";
  const comp = byId<HTMLButtonElement>("btn-compressibility");
  comp.textContent = activeGeom.usePrandtlGlauert ? "On" : "Off";
  comp.style.color = activeGeom.usePrandtlGlauert ? "var(--accent)" : "var(--text-muted)";
  refreshAirfoilName();
}

// Load Rotor Data into Inputs
// Save the previous trim settings while viewing the fixed-pitch DJI example.
let priorVariablePitchTrim: { pair: FlightCondition["operatingPair"]; collective: number } | null = null;
function loadRotorToUI(rotor: StoredRotor, preserveCondition = false): void {
  const nominalRpm = rotor.geom.nominalRpm ?? rotor.geom.rpm;
  if (!preserveCondition && nominalRpm > 0) activeCond.rpm = nominalRpm;
  if (!preserveCondition) {
    const enteringDJI = rotor.name === "DJI Matrice 300 Drone";
    const leavingDJI = currentRotor.name === "DJI Matrice 300 Drone" && !enteringDJI;
    if (enteringDJI) {
      if (currentRotor.name !== rotor.name) {
        priorVariablePitchTrim = { pair: activeCond.operatingPair, collective: activeCond.collectiveDeg };
      }
      // Fixed-pitch 2110 propeller: use RPM and zero collective offset to control thrust.
      activeCond.operatingPair = "rpm_collective";
      activeCond.collectiveDeg = 0;
    } else if (leavingDJI && priorVariablePitchTrim) {
      activeCond.operatingPair = priorVariablePitchTrim.pair;
      activeCond.collectiveDeg = priorVariablePitchTrim.collective;
      priorVariablePitchTrim = null;
    }
  }
  currentRotor = rotor;
  activeGeom = cloneGeometry(rotor.geom);
  isInternalSync = true;
  try {
    isGeometryDirty = false;
    updateActiveRotorBar();
    byId<HTMLInputElement>("inp-rotor-name").value = rotor.name;
    clearAllFieldHints();
    refreshGeometrySelectors();
    refreshOperatingControls();
    recalculate();
  } finally {
    isInternalSync = false;
  }
}

/** Make a rotor the active one. The previous draft belongs to another rotor, so remove it. */
function activateRotor(rotor: StoredRotor): void {
  clearDraft();
  setActiveRotorId(rotor.id);
  loadRotorToUI(rotor);
}

function onGeomParamInput(key: string, valSI: number): void {
  if (isInternalSync) return;
  isInternalSync = true;
  try {
    activeGeom = setGeometryQuantity(activeGeom, key, valSI);
    markGeometryDirty();
    recalculate();
  } finally {
    isInternalSync = false;
  }
}

// Bidirectional Input Listeners & Cross-Updating
function readNumber(id: string): number | null {
  const raw = byId<HTMLInputElement>(id).value.trim().replace(",", ".");
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function unitOf(id: string, fallback: string): string {
  return byId(id)?.textContent?.trim() || fallback;
}

function bindInputListeners(): void {
  const on = (id: string, handler: () => void) => byId(id).addEventListener("input", handler);

  const linkedGeometryInputs: [string, string, string | null, string][] = [
    ["drv-taper", "taper", null, ""],
    ["drv-sigma-geom", "sigmaAct", null, ""],
    ["drv-sigma-thrust", "sigmaT", null, ""],
    ["drv-disk-area", "A", "unit-disk-area", "m²"],
    ["drv-blade-area-ref", "Ab", "unit-blade-area-ref", "m²"],
    ["drv-blade-area", "Aact", "unit-blade-area", "m²"],
    ["drv-twist", "thTwist", "unit-twist", "rad"],
  ];
  linkedGeometryInputs.forEach(([id, key, unitId, canonicalUnit]) => {
    on(id, () => {
      const value = readNumber(id);
      if (value === null || (key !== "thTwist" && value <= 0)) return;
      const unit = unitId ? unitOf(unitId, canonicalUnit) : canonicalUnit;
      onGeomParamInput(key, convertValue(value, unit, canonicalUnit));
    });
    byId(id).addEventListener("blur", refreshInputPresentation);
  });

  // Planform inputs with mutual cross-updating
  on("inp-radius", () => {
    const value = readNumber("inp-radius");
    if (value === null || value <= 0) return;
    const si = convertValue(value, unitOf("unit-radius", "m"), "m");
    onGeomParamInput("R", limitValue("inp-radius", "R", si, [0.02, 50], "m", "unit-radius"));
  });

  on("inp-nblades", () => {
    const value = readNumber("inp-nblades");
    if (value === null) return;
    if (!Number.isInteger(value)) {
      showFieldHint("inp-nblades", "Enter a whole number from 1 to 16.");
      return;
    }
    onGeomParamInput("Nb", limitValue("inp-nblades", "Nb", value, [1, 16], ""));
  });

  on("inp-cutout", () => {
    const value = readNumber("inp-cutout");
    if (value === null || value < 0) return;
    onGeomParamInput("x0", limitValue("inp-cutout", "x0", value, [0, 0.95], ""));
  });

  on("inp-chord-root", () => {
    const value = readNumber("inp-chord-root");
    if (value === null || value <= 0) return;
    const si = convertValue(value, unitOf("unit-chord-root", "m"), "m");
    onGeomParamInput("c0", limitValue("inp-chord-root", "c0", si, [0.0001, 2 * activeGeom.radius], "m", "unit-chord-root"));
  });

  on("inp-chord-tip", () => {
    const value = readNumber("inp-chord-tip");
    if (value === null || value <= 0) return;
    const si = convertValue(value, unitOf("unit-chord-tip", "m"), "m");
    onGeomParamInput("c1", limitValue("inp-chord-tip", "c1", si, [0.0001, 2 * activeGeom.radius], "m", "unit-chord-tip"));
  });

  on("inp-sigma-ref", () => {
    const value = readNumber("inp-sigma-ref");
    if (value !== null && value > 0) onGeomParamInput("sigmaRef", value);
  });

  on("inp-aspect-ratio", () => {
    const value = readNumber("inp-aspect-ratio");
    if (value !== null && value > 0) onGeomParamInput("AR", value);
  });

  const bindPitch = (inputId: string, unitId: string, key: "thRoot" | "thTip") => {
    on(inputId, () => {
      const value = readNumber(inputId);
      if (value === null) return;
      const deg = limitValue(inputId, key, convertValue(value, unitOf(unitId, "deg"), "deg"), [-90, 90], "deg", unitId);
      onGeomParamInput(key, (deg * Math.PI) / 180);
    });
  };
  bindPitch("inp-theta-root", "unit-theta-root", "thRoot");
  bindPitch("inp-theta-tip", "unit-theta-tip", "thTip");

  // Nominal speed is stored with the rotor and seeds the Conditions page (same as Android).
  on("inp-rpm-nom", () => {
    const value = readNumber("inp-rpm-nom");
    if (value === null || value <= 0) return;
    const rpm = limitValue("inp-rpm-nom", "rpmNom", convertValue(value, unitOf("unit-rpm-nom", "rpm"), "rpm"), [1, 30000], "rpm", "unit-rpm-nom");
    activeGeom = { ...activeGeom, nominalRpm: rpm, rpm };
    markGeometryDirty();
    recalculate();
  });

  on("inp-rotor-name", () => {
    const name = sanitizeRotorName(byId<HTMLInputElement>("inp-rotor-name").value, "Custom Rotor");
    if (storedRotors.some((rotor) => rotor.id !== currentRotor.id && rotor.name.toLowerCase() === name.toLowerCase())) {
      showFieldHint("inp-rotor-name", `A rotor named ${name} already exists.`);
      return;
    }
    clearFieldHint("inp-rotor-name");
    activeGeom.name = name;
    markGeometryDirty();
    updateActiveRotorBar();
  });

  on("inp-lift-slope", () => {
    const value = readNumber("inp-lift-slope");
    if (value === null) return;
    const si = convertValue(value, unitOf("unit-lift-slope", "rad⁻¹"), "rad⁻¹");
    activeGeom.liftSlope0 = limitValue("inp-lift-slope", "a0", si, [0.1, 10], "rad⁻¹", "unit-lift-slope");
    markGeometryDirty();
    recalculate();
  });

  on("inp-cd0", () => {
    const value = readNumber("inp-cd0");
    if (value === null || value < 0) return;
    activeGeom.cd0 = limitValue("inp-cd0", "Cd0", value, [0, 0.5], "");
    markGeometryDirty();
    recalculate();
  });

  on("inp-tiploss-b", () => {
    const value = readNumber("inp-tiploss-b");
    if (value === null) return;
    activeGeom.tipLossB = limitValue("inp-tiploss-b", "B", value, [activeGeom.rootCutout + 0.01, 1], "");
    markGeometryDirty();
    recalculate();
  });

  // Condition Inputs
  on("inp-altitude", () => {
    const value = readNumber("inp-altitude");
    if (value === null) return;
    const si = convertValue(value, unitOf("unit-altitude", "m"), "m");
    activeCond.altitudeM = limitValue("inp-altitude", "h", si, OPERATING_LIMITS.altitudeM, "m", "unit-altitude");
    recalculate();
  });

  on("inp-temperature", () => {
    const value = readNumber("inp-temperature");
    if (value === null) return;
    const si = convertValue(value, unitOf("unit-temperature", "°C"), "°C");
    activeCond.temperatureC = limitValue("inp-temperature", "T0", si, OPERATING_LIMITS.temperatureC, "°C", "unit-temperature");
    recalculate();
  });

  on("inp-horiz-val", () => {
    const value = readNumber("inp-horiz-val");
    if (value === null) return;
    if (activeCond.horizontalMode === "vx") {
      activeCond.horizontalValue = convertValue(value, unitOf("unit-horiz-val", "m/s"), "m/s");
      clearFieldHint("inp-horiz-val");
    } else {
      activeCond.horizontalValue = limitValue("inp-horiz-val", "mu", value, OPERATING_LIMITS.mu, "");
    }
    recalculate();
  });

  on("inp-axial-val", () => {
    const value = readNumber("inp-axial-val");
    if (value === null) return;
    if (activeCond.axialMode === "vz") {
      activeCond.axialValue = convertValue(value, unitOf("unit-axial-val", "m/s"), "m/s");
      clearFieldHint("inp-axial-val");
    } else if (activeCond.axialMode === "alpha") {
      activeCond.axialValue = convertValue(value, unitOf("unit-axial-val", "deg"), "deg");
      clearFieldHint("inp-axial-val");
    } else {
      activeCond.axialValue = limitValue("inp-axial-val", "muz", value, OPERATING_LIMITS.muZ, "");
    }
    recalculate();
  });

  on("inp-kind", () => {
    const value = readNumber("inp-kind");
    if (value === null) return;
    activeCond.kInd = limitValue("inp-kind", "kind", value, OPERATING_LIMITS.kInd, "");
    recalculate();
  });

  // Operating Pair Inputs (1 and 2)
  const applyOperating = (slot: 0 | 1) => {
    const id = `inp-operating-${slot + 1}`;
    const unitId = `unit-operating-${slot + 1}`;
    const value = readNumber(id);
    if (value === null) return;
    const key = (OPERATING_SLOTS[activeCond.operatingPair] || OPERATING_SLOTS.rpm_ct)[slot];
    const unit = unitOf(unitId, "");
    const L = OPERATING_LIMITS;
    if (key === "rpm") activeCond.rpm = limitValue(id, "rpm", convertValue(value, unit, "rpm"), L.rpm, "rpm", unitId);
    else if (key === "coll") activeCond.collectiveDeg = limitValue(id, "coll", convertValue(value, unit, "deg"), L.collectiveDeg, "deg", unitId);
    else if (key === "CTtgt") activeCond.targetCT = limitValue(id, "CTtgt", value, L.targetCT, "");
    else activeCond.targetThrustN = limitValue(id, "Ttgt", convertValue(value, unit, "N"), L.targetThrustN, "N", unitId);
    recalculate();
  };
  on("inp-operating-1", () => applyOperating(0));
  on("inp-operating-2", () => applyOperating(1));
}

// Modal Control Helpers
const focusReturn = new Map<string, HTMLElement | null>();
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

function topOpenModal(): HTMLElement | null {
  const open = Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"));
  const zOf = (el: HTMLElement) => Number.parseInt(getComputedStyle(el).zIndex, 10) || 100;
  return open.sort((a, b) => zOf(b) - zOf(a))[0] || null;
}

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden"
  );
}

/** Give every modal dialog semantics: role, aria-modal and an accessible name. */
function initModalA11y(): void {
  document.querySelectorAll<HTMLElement>(".modal-overlay").forEach((overlay) => {
    const card = overlay.querySelector<HTMLElement>(".modal-card");
    if (!card) return;
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.tabIndex = -1;
    const title = card.querySelector<HTMLElement>(".modal-title");
    if (title) {
      if (!title.id) title.id = `${overlay.id}-title`;
      card.setAttribute("aria-labelledby", title.id);
    }
  });
  document.querySelectorAll<HTMLElement>(".modal-close-btn").forEach((btn) => {
    if (!btn.getAttribute("aria-label")) btn.setAttribute("aria-label", "Close");
  });
}

function openModal(id: string, initialFocus?: HTMLElement | null): void {
  const modal = byId(id);
  if (!modal) return;
  if (!modal.classList.contains("open")) {
    const active = document.activeElement;
    focusReturn.set(id, active instanceof HTMLElement && active !== document.body ? active : null);
  }
  const top = Math.max(100, ...Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"))
    .map(el => Number.parseInt(getComputedStyle(el).zIndex, 10) || 100));
  modal.style.zIndex = `${top + 1}`;
  modal.classList.add("open");
  const card = modal.querySelector<HTMLElement>(".modal-card");
  const target = initialFocus || card;
  // The overlay becomes visible immediately; focus on the next frame so the browser accepts it.
  window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
}

function closeModal(id: string): void {
  const modal = byId(id);
  if (!modal) return;
  modal.classList.remove("open");
  modal.style.removeProperty("z-index");
  const back = focusReturn.get(id);
  focusReturn.delete(id);
  if (back && document.contains(back) && back.getClientRects().length > 0) {
    back.focus({ preventScroll: true });
    return;
  }
  if (document.activeElement instanceof HTMLElement && modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  const ca = byId<HTMLElement>("content-area");
  if (ca && !document.querySelector(".modal-overlay.open")) {
    ca.focus?.({ preventScroll: true });
  }
}

/** Keep Tab inside the top modal and add arrow-key movement to option lists. */
function handleModalKeys(e: KeyboardEvent): void {
  const top = topOpenModal();
  if (!top) return;
  const target = e.target as HTMLElement | null;
  if (e.key === "Tab") {
    const items = visibleFocusables(top);
    const card = top.querySelector<HTMLElement>(".modal-card");
    if (items.length === 0) {
      e.preventDefault();
      card?.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const inside = !!target && top.contains(target);
    if (!inside) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && (target === first || target === card)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && target === last) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  if (target?.classList.contains("option-item") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
    const options = Array.from(top.querySelectorAll<HTMLElement>(".option-item"));
    const index = options.indexOf(target);
    let next = index;
    if (e.key === "ArrowDown") next = Math.min(options.length - 1, index + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (e.key === "Home") next = 0;
    else next = options.length - 1;
    e.preventDefault();
    options[next]?.focus();
  }
}

// In-app dialogs replace window.alert and window.confirm.
interface DialogButton {
  id: string;
  label: string;
  kind?: "primary" | "danger";
}
let dialogSeq = 0;

function showDialog(title: string, message: string, buttons: DialogButton[], dismissId: string | null = null): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = `modal-dialog-${++dialogSeq}`;
    const card = document.createElement("div");
    card.className = "modal-card app-dialog";
    card.setAttribute("role", "alertdialog");
    card.setAttribute("aria-modal", "true");
    card.tabIndex = -1;
    const header = document.createElement("div");
    header.className = "modal-header";
    const heading = document.createElement("div");
    heading.className = "modal-title";
    heading.id = `${overlay.id}-title`;
    heading.textContent = title;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "modal-close-btn";
    close.setAttribute("aria-label", "Close");
    close.textContent = "×";
    header.append(heading, close);
    const body = document.createElement("div");
    body.className = "modal-body app-dialog-body";
    const text = document.createElement("p");
    text.className = "app-dialog-message";
    text.id = `${overlay.id}-msg`;
    text.textContent = message;
    const actions = document.createElement("div");
    actions.className = "app-dialog-actions";
    card.setAttribute("aria-labelledby", heading.id);
    card.setAttribute("aria-describedby", text.id);
    let initial: HTMLElement | null = null;

    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("popstate", onBack);
      closeModal(overlay.id);
      overlay.remove();
      resolve(value);
    };
    const onBack = () => finish(dismissId);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish(dismissId);
      }
    };
    buttons.forEach((def) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `action-btn${def.kind === "primary" ? " dialog-primary" : def.kind === "danger" ? " delete" : ""}`;
      btn.textContent = def.label;
      btn.addEventListener("click", () => finish(def.id));
      actions.append(btn);
      if (!initial && def.kind !== "danger") initial = btn;
    });
    close.addEventListener("click", () => finish(dismissId));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(dismissId);
    });
    body.append(text, actions);
    card.append(header, body);
    overlay.append(card);
    document.body.append(overlay);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("popstate", onBack);
    openModal(overlay.id, initial || card);
  });
}

async function showNotice(title: string, message: string): Promise<void> {
  await showDialog(title, message, [{ id: "ok", label: "OK", kind: "primary" }], "ok");
}

async function showConfirm(title: string, message: string, confirmLabel: string, danger = false): Promise<boolean> {
  const choice = await showDialog(
    title,
    message,
    [
      { id: "cancel", label: "CANCEL" },
      { id: "yes", label: confirmLabel, kind: danger ? "danger" : "primary" },
    ],
    "cancel"
  );
  return choice === "yes";
}

function bindBrowserBackNavigation(): void {
  const isAppState = (state: unknown): state is { rotorCalculator: true; page?: string } =>
    !!state && typeof state === "object" && (state as { rotorCalculator?: unknown }).rotorCalculator === true;
  if (isAppState(history.state)) {
    history.replaceState({ ...history.state, rotorCalculator: true, page: currentPage }, "");
  } else {
    history.replaceState({ rotorCalculator: true, page: currentPage }, "");
    history.pushState({ rotorCalculator: true, page: currentPage, root: true }, "");
  }
  window.addEventListener("popstate", (event) => {
    if (!byId("main-popup-menu").hidden) {
      byId("btn-menu-close").click();
      history.pushState({ rotorCalculator: true, page: currentPage }, "");
      return;
    }
    const openModals = Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"));
    const top = openModals.sort((a, b) => (Number.parseInt(getComputedStyle(b).zIndex, 10) || 100) - (Number.parseInt(getComputedStyle(a).zIndex, 10) || 100))[0];
    if (top) {
      closeModal(top.id);
      history.pushState({ rotorCalculator: true, page: currentPage }, "");
      return;
    }
    if (!isAppState(event.state)) return;
    const page = currentPage === "results" ? "conditions" : currentPage === "conditions" ? "geometry" : event.state.page;
    if (page === "geometry" || page === "conditions" || page === "results") activatePage(page, "right", "replace");
  });
}

function nativeFallbackFlow(): { mu: number; muZ: number; vtip: number; vx: number } {
  const rpm = Math.max(1, Math.min(30000, activeCond.rpm));
  const radius = Math.max(0.02, activeGeom.radius);
  const vtip = rpm * Math.PI / 30 * radius;
  const mu = activeCond.horizontalMode === "vx" ? (vtip > 0 ? activeCond.horizontalValue / vtip : 0) : activeCond.horizontalValue;
  let muZ = 0;
  if (activeCond.axialMode === "vz") muZ = vtip > 0 ? activeCond.axialValue / vtip : 0;
  else if (activeCond.axialMode === "alpha") muZ = -mu * Math.tan(activeCond.axialValue * Math.PI / 180);
  else muZ = activeCond.axialValue;
  return { mu, muZ, vtip, vx: mu * vtip };
}

function bindModalListeners(): void {
  initModalA11y();
  document.addEventListener("keydown", handleModalKeys);
  const rotorBar = byId("active-rotor-bar");
  rotorBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); rotorBar.click(); }
  });
  document.querySelectorAll<HTMLButtonElement>("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.close;
      if (target) closeModal(target);
    });
  });

  document.querySelectorAll<HTMLElement>(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // Topbar 3-Dot Popup Menu Toggle
  const menuBtn = byId("btn-main-menu");
  const menu = byId("main-popup-menu");
  const backdrop = byId("main-menu-backdrop");
  const setMenuOpen = (open: boolean) => {
    menu.hidden = !open;
    backdrop.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuOpen(menu.hidden);
  });
  byId("btn-menu-close").addEventListener("click", () => setMenuOpen(false));
  backdrop.addEventListener("click", () => setMenuOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!menu.hidden) { setMenuOpen(false); return; }
    const openModals = Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"));
    const top = openModals.sort((a, b) => (Number.parseInt(getComputedStyle(b).zIndex, 10) || 100) - (Number.parseInt(getComputedStyle(a).zIndex, 10) || 100))[0];
    if (top) { e.preventDefault(); closeModal(top.id); }
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !(e.target as HTMLElement)?.closest(".popup-menu") && e.target !== menuBtn) {
      setMenuOpen(false);
    }
  });

  // Popup Menu Item Handlers
  menu.querySelectorAll<HTMLButtonElement>(".popup-menu-item[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMenuOpen(false);
      const action = btn.dataset.action;
      if (action === "settings") {
        refreshSettingsButtons();
        openModal("modal-settings");
      } else if (action === "units") {
        populateConverterUnits();
        openModal("modal-unit-converter");
      } else if (action === "help") {
        openPhysicsHelp();
      } else if (action === "restore") {
        restoreFactoryRotors();
      } else if (action === "export") {
        byId<HTMLButtonElement>("btn-manager-export").click();
      } else if (action === "import") {
        byId<HTMLButtonElement>("btn-manager-import").click();
      } else if (action === "about") {
        openModal("modal-about");
      } else if (action === "privacy") {
        const asset = PRIVACY_ASSETS[currentTheme] || PRIVACY_ASSETS.dark;
        byId<HTMLIFrameElement>("privacy-iframe").src = asset;
        openModal("modal-privacy");
      }
    });
  });

  byId("active-rotor-bar").addEventListener("click", () => {
    if ((document.querySelector<HTMLElement>(".app-shell")?.clientWidth || innerWidth) < 600) {
      const choices = [
        ...storedRotors.map(rotor => ({ id: `rotor:${rotor.id}`, label: rotor.name, desc: rotor.id === currentRotor.id ? "Current rotor" : "Select saved rotor" })),
        { id: "new", label: "NEW ROTOR", desc: "Create a new rotor geometry" },
        { id: "rename", label: "RENAME CURRENT ROTOR", desc: activeGeom.name },
      ];
      showOptionPicker("Active Rotor", choices, `rotor:${currentRotor.id}`, id => {
        if (id === "new") { byId<HTMLButtonElement>("btn-manager-new").click(); return; }
        if (id === "rename") { void renameActiveRotor(); return; }
        const rotor = storedRotors.find(item => `rotor:${item.id}` === id);
        if (!rotor || rotor.id === currentRotor.id) return;
        resolveUnsavedGeometry("switching the active rotor", () => { setActiveRotorId(rotor.id); loadRotorToUI(rotor); });
      });
      return;
    }
    renderRotorManagerList();
    openModal("modal-rotor-manager");
  });

  byId("btn-open-sweep").addEventListener("click", () => {
    initSweepModal();
    openModal("modal-sweep");
  });
  
  byId("btn-open-disk-contour").addEventListener("click", openDiskContour);
}

// Selector Dropdown Buttons (Modal Option Selectors)
function bindSelectorButtons(): void {
  // 1. Airfoil Selection Modal


  byId("btn-select-airfoil").addEventListener("click", () => {
    const curA0 = activeGeom.liftSlope0;
    const curCd0 = activeGeom.cd0;
    let currentId = "custom";
    const match = AIRFOILS.find((af) => Math.abs(af.a0 - curA0) < 0.001 && Math.abs(af.cd0 - curCd0) < 0.00001);
    if (match) currentId = match.id;

    showOptionPicker(
      "Airfoil Section · sets a0 and Cd0",
      [...AIRFOILS.map((af) => ({
        id: af.id,
        label: af.name,
        desc: `a0 = ${af.a0} rad⁻¹ · Cd0 = ${af.cd0} — ${af.desc}`,
      })), { id: "custom", label: "Custom", desc: "Keep a₀ and Cd₀ as entered" }],
      currentId,
      (selectedId) => {
        const sel = AIRFOILS.find((af) => af.id === selectedId);
        if (sel) {
          activeGeom.liftSlope0 = sel.a0;
          activeGeom.cd0 = sel.cd0;
          markGeometryDirty();
          recalculate();
        }
      }
    );
  });

  // 2. Trim Mode Modal (All 6 pairs)
  const trimModes: { id: FlightCondition["operatingPair"]; label: string; desc: string }[] = [
    { id: "rpm_collective", label: "Rotor Speed Ω + Collective Δθ", desc: "Solves C<sub>T</sub> and T" },
    { id: "rpm_ct", label: "Rotor Speed Ω + Target C<sub>T</sub>", desc: "Solves Δθ and T" },
    { id: "rpm_thrust", label: "Rotor Speed Ω + Target Thrust T", desc: "Solves Δθ and C<sub>T</sub>" },
    { id: "collective_ct", label: "Collective Δθ + Target C<sub>T</sub>", desc: "Solves Ω and T" },
    { id: "collective_thrust", label: "Collective Δθ + Target Thrust T", desc: "Solves Ω and C<sub>T</sub>" },
    { id: "ct_thrust", label: "Target C<sub>T</sub> + Target Thrust T", desc: "Solves Ω and Δθ" },
  ];

  byId("btn-trim-mode").addEventListener("click", () => {
    showOptionPicker(
      "Trim Mode · prescribe any two",
      trustedOptions(trimModes),
      activeCond.operatingPair,
      (modeId) => {
        if (activeResults.solutionValid) {
          activeCond.rpm = activeResults.trimmedRPM;
          activeCond.collectiveDeg = activeResults.trimmedCollectiveDeg;
          activeCond.targetCT = Math.max(1e-8, activeResults.CT);
          activeCond.targetThrustN = Math.max(1e-6, activeResults.thrustN);
        }
        activeCond.operatingPair = modeId as FlightCondition["operatingPair"];
        refreshOperatingControls();
        recalculate();
      }
    );
  });

  // 3. Tip-Loss Model Modal
  const tipModes: { id: RotorGeometry["tipLossMode"]; label: string; desc: string }[] = [
    { id: "none", label: "None", desc: "Full aerodynamic span effective (B = 1.0)" },
    { id: "fixed", label: "Fixed", desc: "Prescribed tip-loss factor entered in Tip Factor B" },
    { id: "sissingh", label: "Sissingh", desc: "Iterated thrust-dependent tip-loss factor: B = 1 - √(2C<sub>T</sub>)/N<sub>b</sub>" },
  ];

  byId("btn-tiploss-mode").addEventListener("click", () => {
    showOptionPicker(
      "Tip-Loss Model",
      trustedOptions(tipModes),
      activeGeom.tipLossMode,
      (modeId) => {
        activeGeom.tipLossMode = modeId as RotorGeometry["tipLossMode"];
        refreshGeometrySelectors();
        markGeometryDirty();
        recalculate();
      }
    );
  });

  // 4. Compressibility Model Modal
  const compModes: { id: string; label: string; desc: string }[] = [
    { id: "off", label: "Off", desc: "No compressibility correction (M = 0 baseline)" },
    { id: "on", label: "On", desc: "Prandtl-Glauert subsonic compressibility correction" },
  ];

  byId("btn-compressibility").addEventListener("click", () => {
    showOptionPicker(
      "Compressibility Model",
      compModes,
      activeGeom.usePrandtlGlauert ? "on" : "off",
      (selId) => {
        activeGeom.usePrandtlGlauert = selId === "on";
        refreshGeometrySelectors();
        markGeometryDirty();
        recalculate();
      }
    );
  });

  // 5. Inflow Model Modal
  const inflowModes: { id: FlightCondition["inflowModel"]; label: string; desc: string }[] = [
    { id: "uniform", label: "Uniform", desc: "Benchmark without first-harmonic gradients (Kx = 0, Ky = 0)" },
    { id: "coleman_simple", label: "Coleman", desc: "Longitudinal gradient proportional to wake skew angle" },
    { id: "coleman_feingold", label: "Coleman-Feingold", desc: "Longitudinal and lateral gradients with empirical factors" },
    { id: "drees", label: "Drees", desc: "Classical forward-flight longitudinal & lateral formulation" },
  ];

  byId("btn-inflow-model").addEventListener("click", () => {
    showOptionPicker(
      "Inflow Model",
      inflowModes,
      activeCond.inflowModel,
      (selId) => {
        activeCond.inflowModel = selId as FlightCondition["inflowModel"];
        const labels: Record<string, string> = {
          uniform: "Uniform",
          coleman_simple: "Coleman",
          coleman_feingold: "Coleman-Feingold",
          drees: "Drees",
        };
        byId("btn-inflow-model").textContent = labels[activeCond.inflowModel];
        recalculate();
      }
    );
  });

  // 6. Horizontal Flow Representation Modal (mu vs Vx)
  const horizModes: { id: "mu" | "vx"; label: string; desc: string }[] = [
    { id: "mu", label: "Advance Ratio μx [-]", desc: "Non-dimensional forward speed Vx / (ΩR)" },
    { id: "vx", label: "Airspeed Vx", desc: "Dimensional horizontal forward speed" },
  ];

  byId("btn-toggle-horiz-mode").addEventListener("click", () => {
    showOptionPicker(
      "Horizontal Flow Representation",
      horizModes,
      activeCond.horizontalMode,
      (selId) => {
        const fallback = nativeFallbackFlow();
        if (selId === "vx") {
          activeCond.horizontalMode = "vx";
          activeCond.horizontalValue = activeResults.solutionValid ? activeResults.operatingVx : fallback.vx;
        } else {
          activeCond.horizontalMode = "mu";
          activeCond.horizontalValue = activeResults.solutionValid ? activeResults.operatingMu : fallback.mu;
        }
        byId("unit-horiz-val").textContent = selId === "vx" ? prefSpeedUnit : "–";
        byId("btn-toggle-horiz-mode").dataset.key = selId === "vx" ? "Vx" : "mu";
        clearFieldHint("inp-horiz-val");
        recalculate();
      }
    );
  });

  // 7. Axial Flow Representation Modal (alpha vs vz vs muz)
  const axialModes: { id: "alpha" | "vz" | "muz"; label: string; desc: string }[] = [
    { id: "alpha", label: "Angle of Attack α [deg]", desc: "Positive when relative flow is upward through the disk" },
    { id: "vz", label: "Climb Speed Vz", desc: "Positive when relative flow is downward through the disk" },
    { id: "muz", label: "Axial Ratio μz [–]", desc: "Vz / (ΩR). Positive when relative flow is downward through the disk" },
  ];

  byId("btn-toggle-axial-mode").addEventListener("click", () => {
    showOptionPicker(
      "Axial Flow Representation",
      axialModes,
      activeCond.axialMode,
      (selId) => {
        const flow = nativeFallbackFlow();
        const mu = activeResults.solutionValid ? activeResults.operatingMu : flow.mu;
        const muZ = activeResults.solutionValid ? activeResults.operatingMuZ : flow.muZ;
        if (selId === "alpha" && Math.abs(mu) < 1e-8 && Math.abs(muZ) > 1e-10) {
          showContextualHelpCustom("Axial Flow", "At zero horizontal speed, α cannot represent a nonzero axial flow. Keep Vz or μz, or set a nonzero horizontal speed first.");
          return;
        }
        activeCond.axialMode = selId as "alpha" | "vz" | "muz";
        const unitBtn = byId("unit-axial-val");
        if (selId === "alpha") {
          activeCond.axialValue = activeResults.solutionValid ? activeResults.operatingAlphaDeg : alphaFromMuZ(mu, muZ);
          byId("btn-toggle-axial-mode").dataset.key = "alpha";
          unitBtn.textContent = "deg";
        } else if (selId === "vz") {
          activeCond.axialValue = activeResults.solutionValid ? activeResults.operatingVz : muZ * flow.vtip;
          byId("btn-toggle-axial-mode").dataset.key = "Vz";
          unitBtn.textContent = unitSystem === "imperial" ? "ft/min" : "m/s";
        } else {
          activeCond.axialValue = muZ;
          byId("btn-toggle-axial-mode").dataset.key = "muz";
          unitBtn.textContent = "–";
        }
        clearFieldHint("inp-axial-val");
        recalculate();
      }
    );
  });
}

// Unit Buttons Binding with Modal Picker
// Picking a unit only changes how a value is shown. The model keeps SI values,
// so every field is redrawn from the model with the shared input formatter.
function bindUnitButtons(): void {
  const length = ["m", "ft", "in", "cm", "mm"];
  const area = ["m²", "ft²", "in²", "cm²"];
  const configs: { btnId: string; fieldName: string; units: string[] | (() => string[]); onlyWhen?: () => boolean }[] = [
    { btnId: "unit-radius", fieldName: "Radius R", units: length },
    { btnId: "unit-chord-root", fieldName: "Root Chord c0", units: length },
    { btnId: "unit-chord-tip", fieldName: "Tip Chord c1", units: length },
    { btnId: "unit-theta-root", fieldName: "Root Pitch", units: ["deg", "rad"] },
    { btnId: "unit-theta-tip", fieldName: "Tip Pitch", units: ["deg", "rad"] },
    { btnId: "unit-twist", fieldName: "Total Twist", units: ["deg", "rad"] },
    { btnId: "unit-lift-slope", fieldName: "Lift Slope a0", units: ["rad⁻¹", "deg⁻¹"] },
    { btnId: "unit-altitude", fieldName: "Altitude", units: ["m", "ft", "km"] },
    { btnId: "unit-temperature", fieldName: "Temperature", units: ["°C", "°F", "K"] },
    { btnId: "unit-horiz-val", fieldName: "Horizontal Airspeed Vx", units: SPEED_UNITS, onlyWhen: () => activeCond.horizontalMode === "vx" },
    {
      btnId: "unit-axial-val",
      fieldName: "Axial Flow",
      units: () => (activeCond.axialMode === "vz" ? CLIMB_UNITS : ["deg", "rad"]),
      onlyWhen: () => activeCond.axialMode !== "muz",
    },
    { btnId: "unit-disk-area", fieldName: "Disk Area", units: area },
    { btnId: "unit-blade-area-ref", fieldName: "Reference Blade Area Ab", units: area },
    { btnId: "unit-blade-area", fieldName: "Blade Area", units: area },
    { btnId: "unit-rpm-nom", fieldName: "Nominal Speed", units: ["rpm", "rad/s"] },
    {
      btnId: "unit-operating-1",
      fieldName: "Operating Value 1",
      units: () => operatingUnitChoices(byId("lbl-operating-1").dataset.key),
    },
    {
      btnId: "unit-operating-2",
      fieldName: "Operating Value 2",
      units: () => operatingUnitChoices(byId("lbl-operating-2").dataset.key),
    },
  ];

  byId("btn-drag-info").addEventListener("click", () => showContextualHelp("drag_numerical"));

  configs.forEach((cfg) => {
    const btn = document.getElementById(cfg.btnId) as HTMLButtonElement | null;
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (cfg.onlyWhen && !cfg.onlyWhen()) return;
      const units = typeof cfg.units === "function" ? cfg.units() : cfg.units;
      if (units.length === 0) return;
      const curUnit = btn.textContent?.trim() || units[0];
      showOptionPicker(
        `Unit · ${cfg.fieldName}`,
        units.map((u) => ({ id: u, label: u })),
        curUnit,
        (selectedUnit) => {
          btn.textContent = selectedUnit;
          if (THRUST_UNITS.includes(selectedUnit) && (cfg.btnId === "unit-operating-1" || cfg.btnId === "unit-operating-2")) {
            prefThrustUnit = selectedUnit;
          }
          const inputId = cfg.btnId.replace("unit-", "inp-");
          clearFieldHint(inputId);
          refreshInputPresentation();
        }
      );
    });
  });
}

function promptRotorName(
  title: string,
  initial: string,
  positive: string,
  validate?: (name: string) => string | null
): Promise<string | null> {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.id = "modal-name-input"; overlay.className = "modal-overlay";
    overlay.innerHTML = `<form class="modal-card rotor-name-dialog" role="dialog" aria-modal="true" aria-labelledby="name-dialog-title"><div class="modal-header"><div class="modal-title" id="name-dialog-title">${escapeHTML(title)}</div><button type="button" class="modal-close-btn" aria-label="Close">×</button></div><div class="modal-body"><label for="name-dialog-input">Name (max ${MAX_ROTOR_NAME_LENGTH} characters)</label><input class="row-input" id="name-dialog-input" maxlength="${MAX_ROTOR_NAME_LENGTH}" autocomplete="off" aria-describedby="name-dialog-error"><div class="field-error" id="name-dialog-error" role="alert" hidden></div><div class="name-dialog-actions"><button type="button" class="action-btn" id="name-dialog-cancel">Cancel</button><button type="submit" class="action-btn save">${escapeHTML(positive)}</button></div></div></form>`;
    document.body.append(overlay);
    const input = overlay.querySelector<HTMLInputElement>("input")!;
    const error = overlay.querySelector<HTMLElement>("#name-dialog-error")!;
    input.value = initial.slice(0, MAX_ROTOR_NAME_LENGTH);
    const onBrowserBack = () => finish(null);
    const finish = (value: string | null) => { document.removeEventListener("keydown", escape, true); window.removeEventListener("popstate", onBrowserBack); closeModal(overlay.id); overlay.remove(); resolve(value); };
    const escape = (event: KeyboardEvent) => { if(event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); finish(null); } };
    overlay.querySelector("form")!.onsubmit = event => {
      event.preventDefault();
      const name = sanitizeRotorName(input.value, "");
      const problem = !name ? "Enter a name." : validate ? validate(name) : null;
      if (problem) { error.textContent = problem; error.hidden = false; input.focus(); return; }
      finish(name);
    };
    input.addEventListener("input", () => { error.hidden = true; });
    overlay.querySelector<HTMLButtonElement>(".modal-close-btn")!.onclick = () => finish(null);
    overlay.querySelector<HTMLButtonElement>("#name-dialog-cancel")!.onclick = () => finish(null);
    overlay.onclick = event => { if(event.target === overlay) finish(null); };
    document.addEventListener("keydown", escape, true); window.addEventListener("popstate", onBrowserBack);
    openModal(overlay.id, input); input.select();
  });
}

function duplicateNameProblem(name: string, exceptId?: string): string | null {
  return storedRotors.some(rotor => rotor.id !== exceptId && rotor.name.trim().toLowerCase() === name.toLowerCase())
    ? `A rotor named ${name} already exists.`
    : null;
}

async function renameActiveRotor(): Promise<void> {
  const name = await promptRotorName("Rename Rotor", activeGeom.name, "Rename", n => duplicateNameProblem(n, currentRotor.id));
  if (!name || name === activeGeom.name) return;
  activeGeom.name = name;
  byId<HTMLInputElement>("inp-rotor-name").value = name;
  markGeometryDirty(); updateActiveRotorBar();
}

async function copyRotorGeometry(geometry: RotorGeometry): Promise<void> {
  const base = geometry.name.replace(/ (?:\(copy\)|copy(?: \d+)?)$/i, "");
  const name = await promptRotorName("Copy Rotor", uniqueRotorName(`${base} Copy`), "Copy", n => duplicateNameProblem(n));
  if (!name) return;
  const copy: StoredRotor = { id: `custom-${Date.now()}`, name: uniqueRotorName(name), geom: cloneGeometry(geometry) };
  copy.geom.name = copy.name;
  storedRotors.push(copy);
  if (!saveStoredRotors(storedRotors)) reportStorageFailure();
  activateRotor(copy);
  renderRotorManagerList();
  closeModal("modal-rotor-manager");
}

function uniqueRotorName(base: string, exceptId?: string): string {
  const clean = sanitizeRotorName(base, "Custom Rotor");
  const taken = (candidate: string) =>
    storedRotors.some((rotor) => rotor.id !== exceptId && rotor.name.trim().toLowerCase() === candidate.toLowerCase());
  let name = clean;
  let suffix = 2;
  while (taken(name)) {
    const tail = ` ${suffix++}`;
    name = `${clean.slice(0, MAX_ROTOR_NAME_LENGTH - tail.length).trim()}${tail}`;
  }
  return name;
}

function restoreFactoryRotors(): void {
  resolveUnsavedGeometry("restoring factory presets", () => {
    void (async () => {
      const choice = await showDialog(
        "Restore Factory Presets",
        "Factory rotors return to their original values.\nCustom rotors stay unchanged.\nExport a backup first to keep your current factory edits.",
        [
          { id: "backup", label: "EXPORT BACKUP, THEN RESTORE", kind: "primary" },
          { id: "restore", label: "RESTORE NOW", kind: "danger" },
          { id: "cancel", label: "CANCEL" },
        ],
        "cancel"
      );
      if (choice !== "backup" && choice !== "restore") return;
      if (choice === "backup") downloadGeometriesBackup("json");
      clearDraft();
      storedRotors = resetToFactoryPresets();
      if (!saveStoredRotors(storedRotors)) reportStorageFailure();
      loadRotorToUI(storedRotors.find((rotor) => rotor.id === getActiveRotorId()) || storedRotors[0]);
      renderRotorManagerList();
      showToast("Factory presets restored. Custom rotors are preserved.");
    })();
  });
}

// A short delay keeps the object URL valid until the browser starts the download.
function downloadHref(href: string, filename: string, revokeUrl = false): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    if (revokeUrl) URL.revokeObjectURL(href);
  }, 1000);
}

function downloadBlob(blob: Blob, filename: string): void {
  downloadHref(URL.createObjectURL(blob), filename, true);
}

function downloadGeometriesBackup(format: "json" | "txt" = "json"): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const isJson = format === "json";
  const content = isJson ? exportRotorsJSON(storedRotors) : exportRotorsDatabaseText(storedRotors);
  const mime = isJson ? "application/json;charset=utf-8" : "text/plain;charset=utf-8";
  const ext = isJson ? "json" : "txt";
  downloadBlob(new Blob([content], { type: mime }), `rotors_db_${dateStr}.${ext}`);
  showToast(`Exported ${storedRotors.length} rotor geometries (${ext.toUpperCase()}).`);
}

async function chooseExportFormat(): Promise<void> {
  const choice = await showDialog(
    "Export Geometries",
    "Choose the backup format.\nJSON works on web and Android.\nTXT is the classic Android format.",
    [
      { id: "json", label: "JSON (.json)", kind: "primary" },
      { id: "txt", label: "TXT (.txt)" },
      { id: "cancel", label: "CANCEL" },
    ],
    "cancel"
  );
  if (choice === "json" || choice === "txt") downloadGeometriesBackup(choice);
}

const IMPORT_PREVIEW_MAX_NAMES = 12;

/** Preview of an import file: up to 12 names, then the new and name-exists counts (names escaped in html). */
function buildImportPreview(list: StoredRotor[], existing: number): { text: string; html: string } {
  const shown = list.slice(0, IMPORT_PREVIEW_MAX_NAMES).map((r) => r.name);
  const more = list.length - shown.length;
  const counts = `${list.length - existing} new, ${existing} name exists.`;
  const head = `The file has ${list.length} rotor${list.length === 1 ? "" : "s"}.`;
  const moreText = more > 0 ? `\n+ ${more} more` : "";
  const text = `${head}\n${counts}\n\n${shown.join("\n")}${moreText}`;
  const html = `${escapeHTML(head)}<br><strong>${escapeHTML(counts)}</strong><br><br><em>${shown.map(escapeHTML).join("<br>")}${more > 0 ? `<br>+ ${more} more` : ""}</em>`;
  return { text, html };
}

const IMPORT_CONFLICT_CHOICES: { id: string; label: string; decision: ImportConflictDecision; all: boolean }[] = [
  { id: "rename", label: "RENAME", decision: "rename", all: false },
  { id: "replace", label: "REPLACE", decision: "replace", all: false },
  { id: "skip", label: "SKIP", decision: "skip", all: false },
  { id: "rename-all", label: "RENAME ALL REMAINING", decision: "rename", all: true },
  { id: "replace-all", label: "REPLACE ALL REMAINING", decision: "replace", all: true },
  { id: "skip-all", label: "SKIP ALL REMAINING", decision: "skip", all: true },
];

/** Preview, then one decision per conflicting rotor. Cancel at any point changes nothing. */
async function runImportFlow(imported: StoredRotor[]): Promise<void> {
  const exists = (r: StoredRotor) => storedRotors.some((loc) => loc.name.toLowerCase() === r.name.toLowerCase());
  const conflictCount = imported.filter(exists).length;
  const preview = buildImportPreview(imported, conflictCount);
  if (!(await showConfirm("Import Rotors", preview.text, "IMPORT"))) return;
  const decisions: (ImportConflictDecision | undefined)[] = [];
  let allDecision: ImportConflictDecision | null = null;
  for (let i = 0; i < imported.length; i++) {
    if (!exists(imported[i])) continue;
    if (allDecision) {
      decisions[i] = allDecision;
      continue;
    }
    const picked = await showDialog(
      "Name Conflict",
      `Rotor '${imported[i].name}' already exists.`,
      [
        ...IMPORT_CONFLICT_CHOICES.map((c) => ({ id: c.id, label: c.label, kind: c.id === "rename" ? ("primary" as const) : undefined })),
        { id: "cancel", label: "CANCEL IMPORT" },
      ],
      "cancel"
    );
    const choice = IMPORT_CONFLICT_CHOICES.find((c) => c.id === picked);
    if (!choice) {
      showToast("Import canceled. 0 geometries imported.");
      return;
    }
    decisions[i] = choice.decision;
    if (choice.all) allDecision = choice.decision;
  }
  const result = resolveImportConflicts(storedRotors, imported, decisions);
  storedRotors.splice(0, storedRotors.length, ...result.rotors);
  if (!saveStoredRotors(storedRotors)) reportStorageFailure();
  if (result.first) activateRotor(result.first);
  renderRotorManagerList();
  const count = result.added + result.replaced;
  showToast(`${count} of ${imported.length} rotor geometries imported.`);
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/** Save the active rotor under a unique name. Returns false when storage refuses the write. */
function commitActiveRotor(): boolean {
  const name = uniqueRotorName(activeGeom.name, currentRotor.id);
  const previousName = currentRotor.name;
  const previousGeom = currentRotor.geom;
  currentRotor.name = name;
  currentRotor.geom = cloneGeometry({ ...activeGeom, name });
  if (!saveStoredRotors(storedRotors)) {
    currentRotor.name = previousName;
    currentRotor.geom = previousGeom;
    return false;
  }
  activeGeom.name = name;
  clearDraft();
  isGeometryDirty = false;
  updateActiveRotorBar();
  return true;
}

const SAVE_FAILED_TEXT = "The browser did not save the rotor. Storage is full or blocked.\nExport a backup to keep your data.";

// Rotor Actions (Save, Copy, Delete, New, Import, Export)
function bindRotorActionButtons(): void {
  byId("btn-geom-save").addEventListener("click", () => {
    const saveBtn = byId("btn-geom-save");
    if (commitActiveRotor()) {
      saveBtn.textContent = "SAVED ✓";
      window.setTimeout(() => (saveBtn.textContent = "SAVE"), 1500);
    } else {
      saveBtn.textContent = "NOT SAVED";
      window.setTimeout(() => (saveBtn.textContent = "SAVE"), 2500);
      void showNotice("Save Failed", SAVE_FAILED_TEXT);
    }
  });

  byId("btn-geom-copy").addEventListener("click", () => {
    // Copying activates the copy, so unsaved edits need the same decision as the manager copy.
    resolveUnsavedGeometry("copying a rotor", () => { void copyRotorGeometry(activeGeom); });
  });

  byId("btn-geom-delete").addEventListener("click", () => {
    void (async () => {
      if (storedRotors.length <= 1) {
        await showNotice("Delete Rotor", "Cannot delete the only remaining rotor.");
        return;
      }
      if (await showConfirm("Delete Rotor", `Delete current rotor "${activeGeom.name}"?`, "DELETE", true)) {
        deleteRotorWithUndo(currentRotor);
      }
    })();
  });

  byId("btn-manager-new").addEventListener("click", () => {
    resolveUnsavedGeometry("creating a new rotor", () => {
      const newRotor: StoredRotor = {
        id: `custom-${Date.now()}`,
        name: uniqueRotorName("Custom Rotor"),
        geom: createDefaultGeometry(),
      };
      newRotor.geom.name = newRotor.name;
      storedRotors.push(newRotor);
      if (!saveStoredRotors(storedRotors)) reportStorageFailure();
      activateRotor(newRotor);
      renderRotorManagerList();
      closeModal("modal-rotor-manager");
    });
  });

  byId("btn-manager-export").addEventListener("click", () => { void chooseExportFormat(); });

  byId("btn-manager-import").addEventListener("click", () => {
    byId<HTMLInputElement>("file-import-input").click();
  });

  byId<HTMLInputElement>("file-import-input").addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      void showNotice("Import Failed", "File too large (limit 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => { void showNotice("Import Failed", "The browser could not read the file."); };
    reader.onload = (evt) => {
      const content = typeof evt.target?.result === "string" ? (evt.target.result as string) : "";
      const imported = importRotorsUniversal(content);
      if (!imported || imported.length === 0) {
        void showNotice("Import Failed", "The file has no valid rotor geometries.\nSupported formats: RotorCalculator backup (.txt) or (.json).");
        return;
      }
      resolveUnsavedGeometry("importing geometries", () => {
        void runImportFlow(imported);
      });
    };
    reader.readAsText(file);
  });

  // Modal: Unsaved Changes Confirm Listeners
  byId("btn-unsaved-save").addEventListener("click", () => {
    if (!commitActiveRotor()) {
      void showNotice("Save Failed", SAVE_FAILED_TEXT);
      return;
    }
    closeModal("modal-unsaved-confirm");
    if (pendingUnsavedAction) {
      const act = pendingUnsavedAction;
      pendingUnsavedAction = null;
      act();
    }
  });

  byId("btn-unsaved-discard").addEventListener("click", () => {
    clearDraft();
    isGeometryDirty = false;
    loadRotorToUI(currentRotor, true);
    closeModal("modal-unsaved-confirm");
    if (pendingUnsavedAction) {
      const act = pendingUnsavedAction;
      pendingUnsavedAction = null;
      act();
    }
  });

  byId("btn-unsaved-cancel").addEventListener("click", () => {
    pendingUnsavedAction = null;
    closeModal("modal-unsaved-confirm");
  });
}

function formatLengthForList(meters: number): string {
  const imperial = unitSystem === "imperial";
  const value = imperial ? convertValue(meters, "m", "ft") : meters;
  const text = formatSig(value, 3).replace(/ /g, "");
  const trimmed = text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
  return `${trimmed} ${imperial ? "ft" : "m"}`;
}

// Rotor Manager List with Desktop & Mobile Drag-and-Drop
function renderRotorManagerList(): void {
  const container = byId("rotor-manager-list");
  container.innerHTML = "";

  const persistOrderFromDom = () => {
    const ids = Array.from(container.children).map((el) => (el as HTMLElement).dataset.rotorId);
    storedRotors = ids.map((id) => storedRotors.find((r) => r.id === id)).filter((r): r is StoredRotor => !!r);
    if (!saveStoredRotors(storedRotors)) reportStorageFailure();
  };

  storedRotors.forEach((rotor, idx) => {
    const item = document.createElement("div");
    item.className = `rotor-manager-item ${rotor.id === currentRotor.id ? "active" : ""}`;
    item.draggable = true;
    item.dataset.rotorId = rotor.id;
    item.dataset.index = idx.toString();

    const g = rotor.geom;
    item.innerHTML = `
      <div class="rotor-drag-handle" title="Drag to reorder" aria-hidden="true">⠿</div>
      <div class="rotor-manager-info" role="button" tabindex="0" aria-label="Select rotor ${escapeHTML(rotor.name)}">
        <div class="rotor-manager-name">${escapeHTML(rotor.name)}</div>
        <div class="rotor-manager-desc">R = ${formatLengthForList(g.radius)} | Nb = ${g.nBlades} | c = ${formatLengthForList(g.chordRoot)}</div>
      </div>
      <div class="rotor-manager-actions">
        <button type="button" class="action-btn rotor-act-btn" data-act="rename" title="Rename rotor">EDIT</button>
        <button type="button" class="action-btn copy rotor-act-btn" data-act="copy">COPY</button>
        <button type="button" class="action-btn delete rotor-act-btn" data-act="delete" ${storedRotors.length <= 1 ? "disabled" : ""}>DEL</button>
      </div>
    `;

    // Click to select
    const info = item.querySelector<HTMLElement>(".rotor-manager-info");
    const select = () => {
      resolveUnsavedGeometry("switching the active rotor", () => {
        activateRotor(rotor);
        closeModal("modal-rotor-manager");
      });
    };
    info?.addEventListener("click", select);
    info?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
    });

    item.querySelector('[data-act="rename"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const rename = () => { if(currentRotor.id !== rotor.id) { activateRotor(rotor); } closeModal("modal-rotor-manager"); void renameActiveRotor(); };
      if(currentRotor.id === rotor.id) rename(); else resolveUnsavedGeometry("switching rotors", rename);
    });
    item.querySelector('[data-act="copy"]')?.addEventListener("click", e => {
      e.stopPropagation();
      // Copying activates the copy, so unsaved edits need the same decision as select, rename and new.
      resolveUnsavedGeometry("copying a rotor", () => { void copyRotorGeometry(rotor.geom); });
    });

    item.querySelector('[data-act="delete"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (storedRotors.length <= 1) return;
      void (async () => {
        if (!(await showConfirm("Delete Rotor", `Delete rotor "${rotor.name}"?`, "DELETE", true))) return;
        deleteRotorWithUndo(rotor);
      })();
    });

    // Drag-and-drop reorder events (HTML5 Drag & Drop)
    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", idx.toString());
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      const fromIdx = parseInt(e.dataTransfer?.getData("text/plain") || "-1", 10);
      const toIdx = idx;
      if (fromIdx >= 0 && fromIdx !== toIdx) {
        const [moved] = storedRotors.splice(fromIdx, 1);
        storedRotors.splice(toIdx, 0, moved);
        if (!saveStoredRotors(storedRotors)) reportStorageFailure();
        renderRotorManagerList();
      }
    });

    // Touch drag handle for mobile. The pointer stays captured by the handle, so the
    // gesture continues while the row moves in the list, and it ends on up or cancel.
    const handle = item.querySelector<HTMLElement>(".rotor-drag-handle");
    if (handle) {
      handle.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        e.preventDefault();
        const pointerId = e.pointerId;
        try { handle.setPointerCapture(pointerId); } catch { /* capture is optional */ }
        item.classList.add("dragging");
        item.draggable = false;
        const onMove = (moveEvt: PointerEvent) => {
          if (moveEvt.pointerId !== pointerId) return;
          const siblings = (Array.from(container.children) as HTMLElement[]).filter((el) => el !== item);
          const target = siblings.filter((el) => {
            const box = el.getBoundingClientRect();
            return moveEvt.clientY > box.top + box.height / 2;
          }).length;
          const current = Array.from(container.children).indexOf(item);
          if (target !== current) container.insertBefore(item, siblings[target] || null);
        };
        const end = (endEvt: PointerEvent) => {
          if (endEvt.pointerId !== pointerId) return;
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
          handle.removeEventListener("lostpointercapture", end);
          item.classList.remove("dragging");
          persistOrderFromDom();
          renderRotorManagerList();
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
        handle.addEventListener("lostpointercapture", end);
      });
    }

    container.appendChild(item);
  });
}

// Parameter Sweep Modal Setup
function isSweepOpen(): boolean {
  return byId("modal-sweep").classList.contains("open");
}

/** Re-run the sweep after a theme or palette change, only when its modal is visible. */
function refreshSweepIfOpen(): void {
  if (sweepUpdateFn && isSweepOpen()) sweepUpdateFn();
}

function initSweepModal(): void {
  const selectParam = byId<HTMLSelectElement>("sweep-select-param");
  selectParam.innerHTML = "";
  SWEEP_PARAMS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = `${p.short} ${p.symbol} [${p.unit}]`;
    if (p.key === sweepSelectedParam) opt.selected = true;
    selectParam.appendChild(opt);
  });

  const canvas = byId<HTMLCanvasElement>("sweep-canvas");
  const selectFamily = byId<HTMLSelectElement>("sweep-select-family");
  selectFamily.value = String(sweepMultiMode);
  const btnValues = byId<HTMLButtonElement>("btn-sweep-values");
  const selectTrim = byId<HTMLSelectElement>("sweep-select-trim-mode");

  // The curves are computed once per parameter change. Moving the crosshair only redraws them.
  let cache: { curves: ReturnType<typeof runParameterSweep>["curves"]; currentOpPoint: ReturnType<typeof runParameterSweep>["currentOpPoint"] } | null = null;
  let redrawFrame = 0;

  if (selectTrim) {
    selectTrim.innerHTML = "";
    SWEEP_TRIM_MODES.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.key;
      opt.textContent = m.label;
      if (m.key === sweepTrimMode) opt.selected = true;
      selectTrim.appendChild(opt);
    });
    const participatesInTrim = activeCond.operatingPair !== "rpm_collective";
    selectTrim.disabled = !participatesInTrim;
    selectTrim.onchange = () => {
      sweepTrimMode = selectTrim.value as SweepTrimModeKey;
      safeSet("rotor_sweep_trim_mode", sweepTrimMode);
      sweepCrossX = -1;
      updateSweepPlot();
    };
  }

  const syncSweepControlVisibilities = () => {
    const multi = parseInt(selectFamily.value, 10);
    btnValues.style.display = (multi === 1 || multi === 2 || multi === 3) ? "block" : "none";
    if (selectTrim) {
      selectTrim.disabled = activeCond.operatingPair === "rpm_collective";
    }
  };

  const familyNames: Record<number, string> = {
    1: "Angle of Attack α [deg]",
    2: "Climb Speed Vz [m/s]",
    3: "Axial Flow Ratio μz [-]",
  };
  const valuesError = byId("sweep-values-error");

  btnValues.onclick = () => {
    const multi = parseInt(selectFamily.value, 10);
    byId("sweep-values-hint").textContent = `Enter values for ${familyNames[multi] || "Family"}. Separate values with semicolons or spaces. A comma is a decimal mark.`;
    const cur = sweepCustomValues[multi] || [-10, -5, 0, 5, 10];
    byId<HTMLInputElement>("inp-sweep-values").value = formatNumberList(cur);
    valuesError.hidden = true;
    openModal("modal-sweep-values", byId("inp-sweep-values"));
  };

  byId("btn-sweep-values-save").onclick = () => {
    const multi = parseInt(selectFamily.value, 10);
    const parsed = parseNumberList(byId<HTMLInputElement>("inp-sweep-values").value);
    const limit = multi === 1 ? 89 : multi === 2 ? 200 : 0.5;
    const showError = (message: string) => {
      valuesError.textContent = message;
      valuesError.hidden = false;
    };
    if (!parsed || parsed.length < 1 || parsed.length > 9) {
      showError("Enter 1 to 9 numbers. Separate them with semicolons or spaces.");
      return;
    }
    if (parsed.some((value) => Math.abs(value) > limit || (multi === 1 && Math.abs(value) === limit))) {
      showError(`Each value must be within ±${limit}${multi === 1 ? " (not equal)" : ""}.`);
      return;
    }
    parsed.sort((a, b) => a - b);
    sweepCustomValues[multi] = parsed;
    closeModal("modal-sweep-values");
    updateSweepPlot();
  };
  byId("inp-sweep-values").oninput = () => { valuesError.hidden = true; };

  byId("btn-sweep-values-cancel").onclick = () => {
    closeModal("modal-sweep-values");
  };

  const selectXAxis = byId<HTMLSelectElement>("sweep-select-xaxis");
  if (selectXAxis) {
    selectXAxis.value = sweepXAxisMode;
  }

  const sweepMeta = () => SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];

  const computeSweep = () => {
    cache = runParameterSweep(
      activeGeom,
      activeCond,
      sweepSelectedParam,
      sweepMultiMode,
      sweepMaxMu,
      25,
      sweepCustomValues[sweepMultiMode],
      sweepTrimMode,
      plotPaletteIndex,
      currentTheme
    );
  };

  // Draw from the cached curves. Used for crosshair moves and after a recompute.
  const drawSweep = () => {
    if (!cache) return;
    const { curves, currentOpPoint } = cache;
    const meta = sweepMeta();
    sweepLastPlotMeta = drawSweepCanvas(
      canvas,
      curves,
      currentOpPoint,
      sweepXAxisMode,
      meta,
      currentTheme,
      null,
      sweepCrossX,
      extraPrecision
    );
    const readoutEl = byId("sweep-readout");
    if (readoutEl) {
      readoutEl.textContent = getSweepReadoutText(curves, meta, sweepXAxisMode, sweepCrossX, extraPrecision);
    }
  };

  const updateSweepPlot = () => {
    sweepUpdateFn = updateSweepPlot;
    syncSweepControlVisibilities();
    sweepSelectedParam = selectParam.value;
    sweepMultiMode = parseInt(selectFamily.value, 10);
    safeSet("rotor_sweep_family", String(sweepMultiMode));
    sweepXAxisMode = (byId<HTMLSelectElement>("sweep-select-xaxis").value as "mu" | "vx" | "muLam") || "mu";
    safeSet("rotor_sweep_xaxis", sweepXAxisMode);
    sweepMaxMu = parseFloat(byId<HTMLSelectElement>("sweep-select-maxmu").value) || 0.4;

    computeSweep();
    const meta = sweepMeta();
    const compact = window.innerWidth < 600 && window.innerHeight >= window.innerWidth;
    const separator = compact ? "<br>" : ": ";
    const controlCaption = (title: string, value: string) => formatSubscripts(`${title}${separator}${value} ▾`);
    const mobileControls: [string, string][] = [
      ["sweep-select-param", formatSubscripts(`${meta.full} ${meta.symbol} ▾`)],
      ["sweep-select-family", controlCaption("Curves", ["Active", "α Set", "Vz Set", "μ_z Set", "Models"][sweepMultiMode])],
      ["sweep-select-xaxis", controlCaption("X axis", { mu: "μ_x", vx: "V_x", muLam: "μ/λ" }[sweepXAxisMode])],
      ["sweep-select-maxmu", controlCaption("Range", `≤ ${sweepMaxMu.toFixed(2)}`)],
      ["sweep-select-trim-mode", controlCaption("Trim", activeCond.operatingPair === "rpm_collective" ? "Fixed" : { none: "None", coll_all: "Δθ All", rpm_all: "Ω All", coll_hover: "Δθ Hover", rpm_hover: "Ω Hover" }[sweepTrimMode])],
    ];
    for (const [id, caption] of mobileControls) {
      const select = byId<HTMLSelectElement>(id);
      let button = select.closest(".sweep-control-group")!.querySelector<HTMLButtonElement>(".sweep-mobile-selector");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "sweep-mobile-selector";
        select.closest(".sweep-control-group")!.append(button);
      }
      button.innerHTML = caption;
      button.disabled = select.disabled;
      button.onclick = () => {
        const options: OptionItem[] = Array.from(select.options).map(option => ({ id: option.value, label: option.textContent || "" }));
        if (id === "sweep-select-family" && sweepMultiMode >= 1 && sweepMultiMode <= 3) options.push({ id: "values", label: "Edit Family Values…", desc: "Semicolon-separated list for the selected family" });
        const title = select.closest(".sweep-control-group")!.querySelector("label")!.textContent || "Sweep";
        showOptionPicker(title, options, select.value, value => {
          if (value === "values") { byId("btn-sweep-values").click(); return; }
          select.value = value;
          select.dispatchEvent(new Event("change"));
        });
      };
    }

    // Active operating point card
    const curValEl = byId("sweep-current-val");
    if (curValEl) {
      if (activeResults.solutionValid) {
        curValEl.innerHTML = `<span>${formatSubscripts(`Active point: μ_x = ${formatSig(activeResults.operatingMu, 3)} · V_x = ${formatSig(activeResults.operatingVx, 3)} m/s · μ_z = ${formatSig(activeResults.operatingMuZ, 3)}`)}</span>`;
      } else {
        curValEl.textContent = "Active point: invalid operating point";
      }
    }

    drawSweep();

    if (sweepTableVisible && cache) {
      renderSweepTable(cache.curves, meta);
    }
  };

  const onParamChange = () => {
    sweepCrossX = -1;
    updateSweepPlot();
  };

  selectParam.onchange = onParamChange;
  byId("sweep-select-family").onchange = onParamChange;
  byId("sweep-select-xaxis").onchange = onParamChange;
  byId("sweep-select-maxmu").onchange = onParamChange;

  const handlePointer = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const { plotLeft, plotWidth, xMax } = sweepLastPlotMeta;
    if (plotWidth > 1 && xMax > 0) {
      const xv = ((x - plotLeft) / plotWidth) * xMax;
      sweepCrossX = Math.max(0, Math.min(xMax, xv));
      // At most one redraw per frame. The curves stay cached.
      if (!redrawFrame) {
        redrawFrame = window.requestAnimationFrame(() => {
          redrawFrame = 0;
          drawSweep();
        });
      }
    }
  };

  // Reopening Sweep replaces these handlers instead of accumulating closures.
  canvas.onmousemove = (e) => {
    if (e.buttons === 1) handlePointer(e.clientX);
  };
  canvas.onclick = (e) => {
    handlePointer(e.clientX);
  };
  canvas.ontouchstart = (e) => {
    if (e.touches.length > 0) handlePointer(e.touches[0].clientX);
  };
  canvas.ontouchmove = (e) => {
    if (e.touches.length > 0) handlePointer(e.touches[0].clientX);
  };

  byId("btn-sweep-toggle-table").onclick = () => {
    sweepTableVisible = !sweepTableVisible;
    byId("sweep-table-container").style.display = sweepTableVisible ? "block" : "none";
    byId("btn-sweep-toggle-table").textContent = sweepTableVisible ? "HIDE TABLE" : "SHOW TABLE";
    if (sweepTableVisible && cache) renderSweepTable(cache.curves, sweepMeta());
  };

  byId("btn-sweep-export-csv").onclick = () => {
    if (!cache) computeSweep();
    if (!cache) return;
    // The byte order mark lets spreadsheet programs read the Greek symbols.
    const csv = "﻿" + generateSweepCSV(cache.curves, sweepMeta(), sweepXAxisMode, sweepTrimMode, extraPrecision);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `rotorcalculator_sweep_${sweepSelectedParam}.csv`);
  };

  byId("btn-sweep-export-png").onclick = () => {
    downloadHref(canvas.toDataURL("image/png"), `rotorcalculator_sweep_${sweepSelectedParam}.png`);
  };

  byId("btn-sweep-export-all-png").onclick = () => {
    for (const p of SWEEP_PARAMS) {
      const { curves, currentOpPoint } = runParameterSweep(
        activeGeom, activeCond, p.key, sweepMultiMode, sweepMaxMu, 25,
        sweepCustomValues[sweepMultiMode], sweepTrimMode, plotPaletteIndex, currentTheme
      );
      drawSweepCanvas(canvas, curves, currentOpPoint, sweepXAxisMode, p, currentTheme, null, -1, extraPrecision);
      downloadHref(canvas.toDataURL("image/png"), `rotorcalculator_sweep_${p.key}.png`);
    }
    // Restore original plot
    drawSweep();
  };

  updateSweepPlot();
}

function openDiskContour() {
  const select = byId<HTMLSelectElement>("disk-contour-variable");
  select.innerHTML = "";
  DISK_CONTOUR_PARAMS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = `${p.label} [${p.unit}]`;
    select.appendChild(opt);
  });

  // The native select stays in the DOM as the value store. The app selector sheet replaces it on screen.
  let button = select.closest(".sweep-control-group")!.querySelector<HTMLButtonElement>(".sweep-mobile-selector");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "sweep-mobile-selector";
    select.closest(".sweep-control-group")!.append(button);
  }

  const updateMobileBtn = () => {
    const p = DISK_CONTOUR_PARAMS.find(item => item.key === select.value) || DISK_CONTOUR_PARAMS[0];
    if (button) button.innerHTML = formatSubscripts(`${p.label} [${p.unit}] ▾`);
  };

  button.onclick = () => {
    const options: OptionItem[] = DISK_CONTOUR_PARAMS.map(p => ({
      id: p.key,
      label: `${p.label} [${p.unit}]`
    }));
    showOptionPicker("Select Variable", options, select.value, value => {
      select.value = value;
      select.dispatchEvent(new Event("change"));
    });
  };

  const updateContour = () => {
    updateMobileBtn();
    const canvas = byId<HTMLCanvasElement>("disk-contour-canvas");
    const exportPng = byId<HTMLButtonElement>("btn-disk-contour-export-png");
    const exportAll = byId<HTMLButtonElement>("btn-disk-contour-export-all-png");

    if (!activeResults.solutionValid) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const style = getComputedStyle(document.documentElement);
        const bg = style.getPropertyValue("--card-bg").trim() || "#1e1e1e";
        const text = style.getPropertyValue("--text-main").trim() || "#ffffff";
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = text;
        ctx.font = "700 16px RotorRoboto, Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("INVALID OPERATING POINT", canvas.width / 2, canvas.height / 2);
      }
      byId("disk-contour-val").textContent = "Active point: invalid operating point";
      exportPng.disabled = true;
      exportAll.disabled = true;
      return;
    }

    exportPng.disabled = false;
    exportAll.disabled = false;
    const varKey = select.value;
    const meta = DISK_CONTOUR_PARAMS.find(p => p.key === varKey) || DISK_CONTOUR_PARAMS[0];
    const data = computeDiskContourData(activeGeom, activeCond, activeResults, varKey);
    drawDiskContour(canvas, data, meta.label, meta.unit, false);

    byId("disk-contour-val").innerHTML = `<span>${formatSubscripts(`Active point: μ_x = ${formatSig(activeResults.operatingMu, 3)} · V_x = ${formatSig(activeResults.operatingVx, 3)} m/s · μ_z = ${formatSig(activeResults.operatingMuZ, 3)}`)}</span>`;
  };

  select.onchange = updateContour;

  byId("btn-disk-contour-export-png").onclick = () => {
    if (!activeResults.solutionValid) return;
    const varKey = select.value;
    const meta = DISK_CONTOUR_PARAMS.find(p => p.key === varKey) || DISK_CONTOUR_PARAMS[0];
    const data = computeDiskContourData(activeGeom, activeCond, activeResults, varKey);
    const canvas = byId<HTMLCanvasElement>("disk-contour-canvas");
    drawDiskContour(canvas, data, meta.label, meta.unit, true);
    downloadHref(canvas.toDataURL("image/png"), `rotorcalculator_contour_${select.value}.png`);
    updateContour();
  };

  byId("btn-disk-contour-export-all-png").onclick = () => {
    if (!activeResults.solutionValid) return;
    const canvas = byId<HTMLCanvasElement>("disk-contour-canvas");
    for (const p of DISK_CONTOUR_PARAMS) {
      const data = computeDiskContourData(activeGeom, activeCond, activeResults, p.key);
      drawDiskContour(canvas, data, p.label, p.unit, true);
      downloadHref(canvas.toDataURL("image/png"), `rotorcalculator_contour_${p.key}.png`);
    }
    updateContour(); // restore
  };

  openModal("modal-disk-contour");
  // Small delay to ensure modal is visible for canvas drawing
  setTimeout(updateContour, 50);
}

function renderSweepTable(curves: any[], meta: any): void {
  const container = byId("sweep-table-container");
  if (!container) return;
  container.innerHTML = renderSweepTableHtml(curves, meta, sweepXAxisMode, sweepTrimMode, extraPrecision, currentTheme);
}

// Unit Converter Modal Logic
function populateConverterUnits(): void {
  let mode = 0;
  const input = byId<HTMLInputElement>("quick-converter-input");
  input.value = "1";
  const renderQuick = () => {
    const [from, to] = QUICK_CONVERSIONS[mode];
    byId("quick-converter-mode").textContent = `${from} → ${to} ▾`;
    byId("quick-converter-label").textContent = `VALUE IN ${from}`;
    const value = Number(input.value.replace(",", "."));
    byId("quick-converter-result").textContent = `${formatSig(quickConvert(Number.isFinite(value) ? value : 0, mode), 4)} ${to}`;
  };
  byId("quick-converter-mode").onclick = () => showOptionPicker("Quick Unit Converter", QUICK_CONVERSIONS.map(([from,to],i) => ({ id: String(i), label: `${from} → ${to}` })), String(mode), value => { mode = Number(value); renderQuick(); });
  byId("quick-converter-swap").onclick = () => { mode ^= 1; renderQuick(); };
  input.oninput = renderQuick;
  renderQuick();
  const catSelect = byId<HTMLSelectElement>("converter-category");
  const fromSelect = byId<HTMLSelectElement>("converter-from");
  const toSelect = byId<HTMLSelectElement>("converter-to");
  const inp = byId<HTMLInputElement>("converter-input-val");
  const res = byId("converter-result-val");

  const updateUnits = () => {
    const cat = catSelect.value;
    const units = UNIT_CHOICES[cat] || ["m", "ft"];
    fromSelect.innerHTML = "";
    toSelect.innerHTML = "";
    units.forEach((u, i) => {
      fromSelect.innerHTML += `<option value="${u}" ${i === 0 ? "selected" : ""}>${u}</option>`;
      toSelect.innerHTML += `<option value="${u}" ${i === 1 ? "selected" : ""}>${u}</option>`;
    });
    doConvert();
  };

  const doConvert = () => {
    const val = parseFloat(inp.value) || 0;
    const fromU = fromSelect.value;
    const toU = toSelect.value;
    const converted = convertValue(val, fromU, toU);
    res.textContent = `${converted.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${toU}`;
  };

  catSelect.onchange = updateUnits;
  fromSelect.onchange = doConvert;
  toSelect.onchange = doConvert;
  inp.oninput = doConvert;

  updateUnits();
}

// Touch Swipe Navigation
const SWIPE_IGNORE = 'canvas, input, textarea, select, [contenteditable=""], [contenteditable="true"], .options-list, iframe';

/** True when the touch starts inside a control or a container that scrolls sideways. */
function swipeShouldIgnore(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (target.closest(SWIPE_IGNORE)) return true;
  for (let el: HTMLElement | null = target; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
  }
  return false;
}

function initSwipeNavigation(): void {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let ignored = true;

  window.addEventListener("touchstart", (e) => {
    ignored = true;
    if (document.querySelector(".modal-overlay.open")) return;
    if (swipeShouldIgnore(e.target as HTMLElement | null)) return;
    if (e.touches.length === 1) {
      ignored = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    if (ignored) return;
    ignored = true;
    if (document.querySelector(".modal-overlay.open")) return;
    if (e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    const dt = Date.now() - startTime;

    if (dt < 650 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        triggerHapticFeedback();
        if (currentPage === "geometry") activatePage("conditions", "left");
        else if (currentPage === "conditions") activatePage("results", "left");
      } else {
        triggerHapticFeedback();
        if (currentPage === "results") activatePage("conditions", "right");
        else if (currentPage === "conditions") activatePage("geometry", "right");
      }
    }
  }, { passive: true });

  window.addEventListener("touchcancel", () => { ignored = true; }, { passive: true });
}

function initGlobalHaptic(): void {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("button, .row-label-btn, .row-unit-btn, .action-btn, .tab-btn, .icon-btn, .popup-menu-item, .modal-close-btn, .active-rotor-bar, .option-item")) {
      triggerHapticFeedback();
    }
  }, { passive: true });
}

// Settings Modal Binding & Persistence (B4A APK Architecture)
function refreshSettingsButtons(): void {
  const btnTheme = byId<HTMLButtonElement>("btn-setting-theme");
  if (btnTheme) {
    btnTheme.textContent = currentTheme === "midnight" ? "MIDNIGHT BLUE" : currentTheme.toUpperCase();
  }
  const btnUnits = byId<HTMLButtonElement>("btn-setting-units");
  if (btnUnits) {
    btnUnits.textContent = unitSystem === "imperial" ? "IMPERIAL" : "SI";
  }
  const btnPrec = byId<HTMLButtonElement>("btn-setting-precision");
  if (btnPrec) {
    if (extraPrecision === 1) {
      btnPrec.textContent = "+1 DECIMAL";
    } else if (extraPrecision === -1) {
      btnPrec.textContent = "-1 DECIMAL";
    } else {
      btnPrec.textContent = "STANDARD";
    }
  }
  const btnPalette = byId<HTMLButtonElement>("btn-setting-palette");
  if (btnPalette) {
    const palNames = ["AERO", "COLORBLIND SAFE", "PRINT"];
    btnPalette.textContent = palNames[plotPaletteIndex % palNames.length];
  }
}

function bindSettingsListeners(): void {
  refreshSettingsButtons();

  // 1. Theme Button
  byId("btn-setting-theme")?.addEventListener("click", () => {
    const items = [
      { id: "dark", label: "Dark", desc: "Cockpit stealth, high contrast" },
      { id: "light", label: "Light", desc: "Daylight, contrast tuned to 4.5:1 or better" },
      { id: "midnight", label: "Midnight Blue", desc: "Navy surfaces, cyan and amber accents" },
      { id: "sepia", label: "Sepia", desc: "Warm parchment, sober pastel tones" },
    ];
    showOptionPicker("Theme", items, currentTheme, (selectedId) => {
      currentTheme = selectedId as "dark" | "light" | "midnight" | "sepia";
      safeSet("rotor_theme", currentTheme);
      applyTheme();
      refreshSettingsButtons();
      refreshSweepIfOpen();
    });
  });

  // 2. Units Button
  byId("btn-setting-units")?.addEventListener("click", () => {
    unitSystem = unitSystem === "si" ? "imperial" : "si";
    safeSet("rotor_units", unitSystem);
    refreshSettingsButtons();
    recalculate();
  });

  // 3. Precision Button
  byId("btn-setting-precision")?.addEventListener("click", () => {
    if (extraPrecision === 0) extraPrecision = 1;
    else if (extraPrecision === 1) extraPrecision = -1;
    else extraPrecision = 0;
    safeSet("rotor_extra_precision", extraPrecision.toString());
    refreshSettingsButtons();
    refreshInputPresentation();
    recalculate();
  });

  // 4. Palette Button
  byId("btn-setting-palette")?.addEventListener("click", () => {
    const items = [
      { id: "0", label: "Aero", desc: "Vibrant technical contrast" },
      { id: "1", label: "Colorblind Safe", desc: "Okabe-Ito accessible palette" },
      { id: "2", label: "Print", desc: "High-contrast print palette" },
    ];
    showOptionPicker("Palette", items, plotPaletteIndex.toString(), (selectedId) => {
      plotPaletteIndex = parseInt(selectedId, 10);
      safeSet("rotor_plot_palette", plotPaletteIndex.toString());
      refreshSettingsButtons();
      refreshSweepIfOpen();
    });
  });

  // 5. Restore Factory Presets Button
  byId("btn-setting-restore")?.addEventListener("click", () => {
    restoreFactoryRotors();
  });

  // 6. Import Geometries Button
  byId("btn-setting-import")?.addEventListener("click", () => {
    byId<HTMLInputElement>("file-import-input")?.click();
  });

  // 7. Export Geometries Button
  byId("btn-setting-export")?.addEventListener("click", () => {
    void chooseExportFormat();
  });


}

// Tooltip Popover on Engineering & Result Rows
function initTooltips(): void {
  const popover = byId("tooltip-popover");
  const hide = () => popover.classList.remove("visible");
  document.querySelectorAll<HTMLElement>("[data-tip], .row-label-btn, .result-label, .row-unit-btn").forEach(el => {
    const show = () => {
      const key = el.dataset.key || el.closest<HTMLElement>("[data-key]")?.dataset.key || el.parentElement?.querySelector<HTMLElement>("[data-key]")?.dataset.key;
      const nom = key ? getNomenclature(key) : undefined;
      const text = nom ? `${nom.full}: ${nom.body}` : el.dataset.tip;
      if (!text) return;
      popover.textContent = text;
      popover.classList.add("visible");
      const rect = el.getBoundingClientRect();
      const box = popover.getBoundingClientRect();
      popover.style.left = `${Math.max(8, Math.min(window.innerWidth - box.width - 8, rect.left))}px`;
      popover.style.top = `${Math.max(8, rect.bottom + box.height + 8 > window.innerHeight ? rect.top - box.height - 8 : rect.bottom + 8)}px`;
    };
    el.addEventListener("mouseenter", () => { if (matchMedia("(hover: hover)").matches) show(); });
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    el.addEventListener("click", hide);
  });
  document.addEventListener("pointerdown", hide);
  document.querySelector(".content-area")?.addEventListener("scroll", hide);
}

function bindRowLabelHelp(): void {
  document.querySelectorAll<HTMLElement>(".row-label-btn, .row-unit-btn, .result-label").forEach(el => {
    let timer: number | undefined;
    let held = false;
    const cancel = () => window.clearTimeout(timer);
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      held = false;
      timer = window.setTimeout(() => {
        const key = el.dataset.key || el.parentElement?.querySelector<HTMLElement>("[data-key]")?.dataset.key;
        if (key) { held = true; showContextualHelp(key); }
      }, 550);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(name => el.addEventListener(name, cancel));
    el.addEventListener("click", e => { if (held) { e.preventDefault(); e.stopImmediatePropagation(); held = false; } }, true);
  });
  document.querySelectorAll<HTMLButtonElement>(".row-label-btn[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;
    if (["mu", "Vx", "alpha", "Vz", "muz"].includes(key)) return;
    btn.addEventListener("click", () => {
      showContextualHelp(key);
    });
  });

  byId("lbl-operating-1")?.addEventListener("click", () => {
    const k = byId("lbl-operating-1").dataset.key;
    if (k) showContextualHelp(k);
  });

  byId("lbl-operating-2")?.addEventListener("click", () => {
    const k = byId("lbl-operating-2").dataset.key;
    if (k) showContextualHelp(k);
  });
}

function initPwaInstall(): void {
  const btnInstall = byId("btn-install-app");
  const menuItemInstall = byId("menu-item-install");

  const triggerInstall = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        deferredInstallPrompt = null;
        if (btnInstall) btnInstall.style.display = "none";
        if (menuItemInstall) menuItemInstall.style.display = "none";
        byId("row-install-pwa").style.display = "none";
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        void showNotice("Install on iOS", "1. Tap the Share button in Safari.\n2. Scroll down and tap Add to Home Screen.\n3. Tap Add.");
      } else {
        void showNotice("Install App", "Open the browser menu.\nSelect Install app or Add to Home screen.");
      }
    }
  };

  btnInstall?.addEventListener("click", triggerInstall);
  menuItemInstall?.addEventListener("click", triggerInstall);
  byId("btn-install-pwa")?.addEventListener("click", triggerInstall);

  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (btnInstall) btnInstall.style.display = "inline-flex";
    if (menuItemInstall) menuItemInstall.style.display = "block";
    byId("row-install-pwa").style.display = "flex";
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (btnInstall) btnInstall.style.display = "none";
    if (menuItemInstall) menuItemInstall.style.display = "none";
        byId("row-install-pwa").style.display = "none";
  });
}

/** Tie each value field to its row label and unit button for assistive technology. */
function initFieldAria(): void {
  let n = 0;
  document.querySelectorAll<HTMLElement>(".engineering-row").forEach((row) => {
    const label = row.querySelector<HTMLElement>(".row-label-btn");
    const unit = row.querySelector<HTMLButtonElement>(".row-unit-btn");
    if (!label) return;
    if (!label.id) label.id = `row-label-${++n}`;
    if (unit && !unit.id) unit.id = `row-unit-${++n}`;
    const unitUseful = !!unit && !unit.disabled;
    row.querySelectorAll<HTMLElement>("input, .action-btn").forEach((field) => {
      field.setAttribute("aria-labelledby", label.id);
      if (field.tagName === "INPUT") {
        if (unitUseful && unit) {
          field.setAttribute("aria-describedby", unit.id);
          field.dataset.unitId = unit.id;
        }
      } else {
        field.setAttribute("aria-haspopup", "dialog");
      }
    });
  });
}

// Bootstrap Application
function initApp(): void {
  // Native number widgets localize decimals differently between browsers.
  // Use the Android text/decimal-input convention and keep partial edits local.
  document.querySelectorAll<HTMLInputElement>('input[type="number"]').forEach(input => {
    input.type = "text";
    input.inputMode = "decimal";
    input.dataset.numeric = "true";
  });
  document.addEventListener("input", event => {
    const input = event.target as HTMLInputElement;
    if (input.dataset.numeric !== "true") return;
    input.value = input.value.replace(/,/g, ".");
    if (!input.value.trim() || !Number.isFinite(Number(input.value))) event.stopImmediatePropagation();
  }, true);
  document.addEventListener("focusout", (event) => {
    const field = event.target as HTMLInputElement | null;
    if (field?.dataset?.numeric === "true" && !field.readOnly && field.id && field.closest(".engineering-row")) {
      const raw = field.value.trim().replace(",", ".");
      if (raw === "" || !Number.isFinite(Number(raw))) showFieldHint(field.id, "Enter a number. The previous value is restored.");
    }
    queueMicrotask(refreshInputPresentation);
  });
  initFieldAria();
  applyTheme();
  const draft = loadDraft();
  loadRotorToUI(currentRotor, true);
  if (draft && (draft.baseId === currentRotor.id || draft.baseId === "active")) {
    loadRotorToUI({ ...currentRotor, name: draft.geom.name, geom: draft.geom }, true);
    currentRotor = storedRotors.find((rotor) => rotor.id === currentRotor.id) || currentRotor;
    isGeometryDirty = true;
    saveDraft(activeGeom, currentRotor.id);
    updateActiveRotorBar();
  } else if (draft) {
    clearDraft();
  }
  refreshConditionFields();
  refreshInputPresentation();
  bindInputListeners();
  bindModalListeners();
  bindRotorActionButtons();
  bindSelectorButtons();
  bindUnitButtons();
  bindResultRowTooltips();
  bindRowLabelHelp();
  bindSettingsListeners();
  initSwipeNavigation();
  initGlobalHaptic();
  initTooltips();
  initPwaInstall();
  updateResponsiveLabels();
  document.fonts.ready.then(updateResponsiveLabels);
  activatePage(currentPage, undefined, "none");
  bindBrowserBackNavigation();

  if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // Service worker registration fallback
      });
    });
  }

  window.addEventListener("beforeunload", (e) => {
    if (isGeometryDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page as "geometry" | "conditions" | "results";
      if (target) activatePage(target);
    });
  });

  window.addEventListener("resize", () => {
    updateTabIndicator();
    updateResponsiveLabels();
  });
}

initApp();
