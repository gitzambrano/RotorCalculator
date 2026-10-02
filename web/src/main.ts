import { QUICK_CONVERSIONS, quickConvert } from "./quick-converter";
import "./style.css";
import iconUrl from "./assets/icon.png";
import headerIconUrl from "./assets/icon_header.png";
import {
  activeBladeArea,
  calculate,
  cloneCondition,
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
  referenceAspectRatio,
  referenceBladeArea,
  alphaFromMuZ,
  resolveSolidity,
  scaleChordsToAspectRatio,
  scaleChordsToSigmaRef,
  scaleRadiusPreserveReference,
  setGeometryQuantity,
  taperRatio,
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
  importRotorsJSON,
  importRotorsUniversal,
  loadDraft,
  loadStoredRotors,
  resetToFactoryPresets,
  saveDraft,
  saveStoredRotors,
  setActiveRotorId,
  type StoredRotor,
} from "./storage";
import {
  convertValue,
  formatResultValue,
  formatInputValue,
  formatSig,
  UNIT_CHOICES,
  UNIT_TABLE,
} from "./units";
import {
  buildSweepTableRows,
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
  ABBREVIATIONS,
  CANONICAL_NOMENCLATURE,
  COND_KEYS,
  GEOM_KEYS,
  RES_KEYS,
  chooseLevel,
  fitLabelSize,
  formatDescriptionSymbol,
  formatSubscripts,
  getNomenclature,
  getPlainLabel,
  getResponsiveInputLabel,
  getResultDisplayLabel,
  getRichLabelHtml,
  measureTextWidth,
  resultLabelHtml,
  resultPlainLabel,
} from "./labels";

// Option Selector Interface
interface OptionItem {
  id: string;
  label: string;
  desc?: string;
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

// Restore saved condition session if available
let activeCond: FlightCondition = createDefaultCondition();
try {
  const savedCondJson = localStorage.getItem("rotorcalc_active_cond");
  if (savedCondJson) {
    activeCond = { ...activeCond, ...JSON.parse(savedCondJson) };
  }
} catch {
  // fallback to default
}

let activeResults: RotorResults = calculate(activeGeom, activeCond);

const savedPage = localStorage.getItem("rotor_current_page");
let currentPage: "geometry" | "conditions" | "results" = savedPage === "conditions" || savedPage === "results" ? savedPage : "geometry";
let currentTheme: "dark" | "light" | "midnight" =
  (localStorage.getItem("rotor_theme") as "dark" | "light" | "midnight") || "dark";
let unitSystem: "si" | "imperial" = (localStorage.getItem("rotor_units") as "si" | "imperial") || "si";
let extraPrecision: number = parseInt(localStorage.getItem("rotor_extra_precision") || "0", 10);
let angleFormat: "0/360" | "-180/180" = (localStorage.getItem("rotor_angle_format") as "0/360" | "-180/180") || "0/360";

// Preferred Output Units
let prefThrustUnit = localStorage.getItem("rotor_pref_thrust") || (unitSystem === "imperial" ? "lbf" : "N");
let prefPowerUnit = localStorage.getItem("rotor_pref_power") || (unitSystem === "imperial" ? "hp" : "kW");
let prefTorqueUnit = localStorage.getItem("rotor_pref_torque") || (unitSystem === "imperial" ? "lb·ft" : "N·m");
let prefSpeedUnit = localStorage.getItem("rotor_pref_speed") || (unitSystem === "imperial" ? "kt" : "m/s");
let prefPressureUnit = localStorage.getItem("rotor_pref_pressure") || "hPa";

// Sweep Modal State
let sweepSelectedParam = "CP";
let sweepMultiMode = Number(localStorage.getItem("rotor_sweep_family") ?? "4");
let sweepXAxisMode: "mu" | "vx" | "muLam" =
  (localStorage.getItem("rotor_sweep_xaxis") as "mu" | "vx" | "muLam") || "mu";
let sweepMaxMu = 0.4;
let sweepCrossX = -1;
let sweepLastPlotMeta = { plotLeft: 70, plotWidth: 400, xMax: 0.4 };
let sweepTableVisible = false;
let sweepTrimMode: SweepTrimModeKey = (localStorage.getItem("rotor_sweep_trim_mode") as SweepTrimModeKey) || "coll_all";
let plotPaletteIndex: number = parseInt(localStorage.getItem("rotor_plot_palette") || "0", 10);
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
let pendingImportList: StoredRotor[] = [];
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
            <span class="version-badge">v1.23</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="header-action-btn" id="btn-install-app" style="display: none;" title="Install RotorCalculator App" aria-label="Install App">📲 INSTALL</button>
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
      <button type="button" class="popup-menu-item menu-primary" data-action="about"><span class="menu-item-title">About</span><span class="menu-item-subtitle">Version and credits</span></button>
      <button type="button" class="popup-menu-item menu-primary" data-action="privacy"><span class="menu-item-title">Privacy</span><span class="menu-item-subtitle">Privacy policy</span></button>
      <button type="button" class="popup-menu-item menu-desktop-only" id="menu-item-install" data-action="install" style="display: none;">Install App</button>
      <div class="popup-menu-divider menu-desktop-only"></div>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="restore">Restore Factory Presets</button>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="export">Export Rotor Geometries</button>
      <button type="button" class="popup-menu-item menu-desktop-only" data-action="import">Import Rotor Geometries</button>
      <div class="popup-menu-divider menu-desktop-only"></div>
      <a class="popup-menu-item menu-desktop-only" href="mailto:flightdyn@gmail.com?subject=RotorCalculator%20Feedback" id="feedback-link">Send Feedback</a>
    </div>

    <div class="content-area" id="content-area">
      <!-- PAGE 0: GEOMETRY -->
      <section class="page active" id="page-geometry">
        <div class="active-rotor-bar" id="active-rotor-bar" title="Click to switch or manage rotors">
          <div>
            <div class="active-rotor-tag">ACTIVE ROTOR (CLICK TO SWITCH)</div>
            <div class="active-rotor-name" id="display-active-rotor-name">UH-60 Black Hawk</div>
          </div>
          <span style="font-size: 18px; color: var(--accent);">▾</span>
        </div>


        <div class="section-header">ROTOR</div>
        <div class="engineering-row rotor-name-row" hidden>
          <button class="row-label-btn" data-key="name" data-tip="Descriptive name of this rotor geometry." data-canonical="Rotor Name">Rotor Name</button>
          <input class="row-input" type="text" id="inp-rotor-name" value="" />
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
          <button class="row-label-btn" data-key="sigmaRef" data-tip="Blade area of the fictitious planform extended to rotation axis (x=0) over disk area." data-canonical="Geometric Solidity">Geom. Solidity</button>
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
          <button class="row-label-btn" data-key="A" data-tip="Total rotor disk swept area A = pi * R^2." data-canonical="Disk Area">Disk Area</button>
          <input class="row-input" type="number" step="any" id="drv-disk-area" />
          <button class="row-unit-btn" id="unit-disk-area">m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="Ab" data-tip="Planform area of one blade of the fictitious planform extended to rotation axis." data-canonical="Geometric Blade Area">Geometric Area</button>
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
          <button class="action-btn" id="btn-select-airfoil" style="height: 44px;">SC1095</button>
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
          <button class="action-btn" id="btn-tiploss-mode" style="height: 44px;">Sissingh</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="B" data-tip="Fixed tip loss factor B (active when tip loss is set to Fixed)." data-canonical="Tip Factor B">Tip Factor B</button>
          <div class="tip-factor-value">
            <input class="row-input" type="number" step="0.005" id="inp-tiploss-b" value="0.97" />
            <div class="row-derived-val" id="drv-tip-factor" hidden></div>
          </div>
          <button class="row-unit-btn" disabled>–</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="comp" data-tip="Prandtl-Glauert subsonic compressibility correction on blade lift slope." data-canonical="Compressibility">Compressibility</button>
          <button class="action-btn" id="btn-compressibility" style="height: 44px; color: var(--accent-green);">ON (PG)</button>
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
          <button class="row-label-btn" data-key="h" data-tip="Flight geometric/pressure altitude in ISA atmosphere." data-canonical="Altitude">Altitude</button>
          <input class="row-input" type="number" step="50" id="inp-altitude" value="0" />
          <button class="row-unit-btn" id="unit-altitude">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="T0" data-tip="Outside ambient air temperature." data-canonical="Temperature">Temperature</button>
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
          <button class="row-label-btn" data-key="trim" data-tip="Trim mode solver constraint: prescribe any two from RPM, Collective, CT, and Thrust." data-canonical="Trim Mode">Trim Mode</button>
          <button class="action-btn" id="btn-trim-mode" style="height: 44px;">RPM + Target CT</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row" id="row-operating-1">
          <button class="row-label-btn" id="lbl-operating-1" data-key="rpm" data-canonical="RPM">RPM</button>
          <input class="row-input" type="number" step="1" id="inp-operating-1" value="258" />
          <button class="row-unit-btn" id="unit-operating-1">rpm</button>
        </div>
        <div class="engineering-row" id="row-operating-2">
          <button class="row-label-btn" id="lbl-operating-2" data-key="CTtgt" data-canonical="Target CT">Target CT</button>
          <input class="row-input" type="number" step="0.0005" id="inp-operating-2" value="0.0065" />
          <button class="row-unit-btn" id="unit-operating-2">–</button>
        </div>

        <div class="section-header">AERODYNAMIC MODEL</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-key="inflow" data-tip="Inflow model formulation (Uniform, Coleman Simple, Coleman-Feingold, or Drees)." data-canonical="Inflow Model">Inflow Model</button>
          <button class="action-btn" id="btn-inflow-model" style="height: 44px;">Coleman-Feingold</button>
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
        <div class="results-header-actions" style="margin-bottom: 8px;">
          <button class="btn-open-sweep" id="btn-open-sweep" style="width: 100%; height: 48px; font-weight: 700; font-size: 15px; border-radius: 4px;">
            OPEN PARAMETER SWEEP
          </button>
        </div>

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
        <div class="result-row" data-key="vi"><button class="result-label" data-key="vi">Induced Velocity v<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
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

        <div class="section-header">INFLOW &amp; WAKE</div>
        <div class="result-row" data-key="lam"><button class="result-label" data-key="lam">Inflow Ratio λ</button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="lami"><button class="result-label" data-key="lami">Induced Inflow λ<sub>i</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="lamh"><button class="result-label" data-key="lamh">Hover Inflow λ<sub>h</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="muLam"><button class="result-label" data-key="muLam">Advance-Inflow μ/λ</button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Kx"><button class="result-label" data-key="Kx">Long. Gradient K<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Ky"><button class="result-label" data-key="Ky">Lateral Gradient K<sub>y</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="chi"><button class="result-label" data-key="chi">Wake Skew χ</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="Bres"><button class="result-label" data-key="Bres">Tip Factor B</button><div class="result-val">---</div><div class="result-unit">–</div></div>

        <div class="section-header">FLOW &amp; BLADE DIAGNOSTICS</div>
        <div class="result-row" data-key="Vztot"><button class="result-label" data-key="Vztot">Total Axial Speed V<sub>z,tot</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Vadv"><button class="result-label" data-key="Vadv">Advancing Speed V<sub>adv</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Vret"><button class="result-label" data-key="Vret">Retreating Speed V<sub>ret</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Mret"><button class="result-label" data-key="Mret">Retreating Mach M<sub>ret</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="aoaAdv75"><button class="result-label" data-key="aoaAdv75">Adv. AoA 75% α<sub>adv,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="aoaRet75"><button class="result-label" data-key="aoaRet75">Ret. AoA 75% α<sub>ret,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiAdv75"><button class="result-label" data-key="phiAdv75">Adv. Inflow 75% φ<sub>adv,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="phiRet75"><button class="result-label" data-key="phiRet75">Ret. Inflow 75% φ<sub>ret,75</sub></button><div class="result-val">---</div><div class="result-unit">deg</div></div>

        <div class="section-header">STATE &amp; ATMOSPHERE</div>
        <div class="result-row" data-key="rpm"><button class="result-label" data-key="rpm">Rotor Speed Ω</button><div class="result-val">---</div><div class="result-unit">rpm</div></div>
        <div class="result-row" data-key="coll"><button class="result-label" data-key="coll">Collective Δθ</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="mu"><button class="result-label" data-key="mu">Advance Ratio μ<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vx"><button class="result-label" data-key="Vx">Airspeed V<sub>x</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="muz"><button class="result-label" data-key="muz">Axial Ratio μ<sub>z</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Vz"><button class="result-label" data-key="Vz">Climb Speed V<sub>z</sub></button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="alpha"><button class="result-label" data-key="alpha">Disk AoA α</button><div class="result-val">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-key="OmR"><button class="result-label" data-key="OmR">Tip Speed ΩR</button><div class="result-val">---</div><div class="result-unit">m/s</div></div>
        <div class="result-row" data-key="Mtip"><button class="result-label" data-key="Mtip">Tip Mach M<sub>tip</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="Madv"><button class="result-label" data-key="Madv">Advancing Mach M<sub>adv</sub></button><div class="result-val">---</div><div class="result-unit">–</div></div>
        <div class="result-row" data-key="h"><button class="result-label" data-key="h">Altitude h</button><div class="result-val">---</div><div class="result-unit">m</div></div>
        <div class="result-row" data-key="T0"><button class="result-label" data-key="T0">Temperature T<sub>amb</sub></button><div class="result-val">---</div><div class="result-unit">°C</div></div>
        <div class="result-row" data-key="rho"><button class="result-label" data-key="rho">Density ρ</button><div class="result-val">---</div><div class="result-unit">kg/m³</div></div>
        <div class="result-row" data-key="p"><button class="result-label" data-key="p">Pressure p</button><div class="result-val">---</div><div class="result-unit">hPa</div></div>
        <div class="result-row" data-key="a"><button class="result-label" data-key="a">Sound Speed a</button><div class="result-val">---</div><div class="result-unit">m/s</div></div>

        <div class="section-header">MODEL STATUS</div>
        <div class="result-status-block" style="padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;">
          <button class="status-chip-btn" id="badge-solution-summary" type="button" style="width: 100%; min-height: 48px; border-radius: 12px; border: 1px solid var(--accent); background: rgba(0,229,255,0.08); color: var(--accent); font-weight: 700; font-size: 14.5px; text-align: left; padding: 10px 14px; cursor: pointer;">
            <span id="txt-solution-summary">Trim Mode</span>
          </button>
          <button class="status-chip-btn" id="badge-model-status" type="button" style="width: 100%; min-height: 52px; border-radius: 12px; border: 1px solid var(--accent-green); background: rgba(0,230,118,0.08); color: var(--accent-green); font-weight: 700; font-size: 14px; text-align: left; padding: 10px 14px; cursor: pointer;">
            <span id="txt-model-status">Model valid</span>
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
          <button class="action-btn" data-close="modal-options-selector" style="width: 100%; height: 44px;">CANCEL</button>
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
                <button class="action-btn" id="btn-sweep-values" style="display: none; flex-shrink: 0; height: 38px; padding: 0 10px; font-size: 11.5px; font-weight: 700; color: var(--accent);">VALUES</button>
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
            <div id="sweep-current-val" style="padding: 8px 12px; background: var(--bg-input-card, var(--card-bg)); border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--accent); border: 1px solid var(--border);">Active point: invalid operating point</div>
            <div id="sweep-readout" style="padding: 8px 12px; background: var(--bg-input-card, var(--card-bg)); border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--text-main); border: 1px solid var(--border); white-space: pre-line;">Tap or drag on the plot to read the curve values.</div>
          </div>

          <div id="sweep-table-container" style="display: none; max-height: 200px; overflow: auto; margin-bottom: 12px; font-size: 12px; border: 1px solid var(--border); border-radius: 6px;"></div>
        </div>
          <div class="sweep-footer-actions">
            <button class="action-btn" id="btn-sweep-toggle-table" style="height: 38px;">SHOW TABLE</button>
            <button class="action-btn" id="btn-sweep-export-csv" style="height: 38px;">EXPORT CSV</button>
            <button class="action-btn" id="btn-sweep-export-png" style="height: 38px;">EXPORT PNG</button>
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
          <p id="sweep-values-hint" style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 12px;">Enter comma-separated numerical values for the curve family.</p>
          <input class="row-input" id="inp-sweep-values" type="text" style="width: 100%; height: 42px; margin-bottom: 16px; font-family: monospace; font-size: 14px; text-align: left;" />
          <div style="display: flex; gap: 8px;">
            <button class="action-btn" id="btn-sweep-values-save" style="flex: 1; height: 42px; color: var(--accent); font-weight: 700;">APPLY VALUES</button>
            <button class="action-btn" id="btn-sweep-values-cancel" style="height: 42px;">CANCEL</button>
          </div>
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
          <p id="unsaved-confirm-msg" style="margin-bottom: 20px; font-size: 14.5px; line-height: 1.5; color: var(--text-main);">Geometry has unsaved changes. Save them before continuing?</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="action-btn" id="btn-unsaved-save" style="height: 42px; font-weight: 700; color: var(--accent-green);">SAVE CHANGES</button>
            <button class="action-btn" id="btn-unsaved-discard" style="height: 42px; font-weight: 700; color: var(--accent-red);">DISCARD CHANGES</button>
            <button class="action-btn" id="btn-unsaved-cancel" style="height: 42px; font-weight: 600;">CANCEL</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: IMPORT CONFLICT RESOLUTION -->
    <div class="modal-overlay" id="modal-import-conflict">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <div class="modal-title">Import Geometries</div>
          <button class="modal-close-btn" data-close="modal-import-conflict">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <p id="import-conflict-msg" style="margin-bottom: 16px; font-size: 14px; line-height: 1.5; color: var(--text-main);"></p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="action-btn" id="btn-import-rename" style="height: 42px; font-weight: 700; color: var(--accent);">RENAME (Keep both with unique names)</button>
            <button class="action-btn" id="btn-import-replace" style="height: 42px; font-weight: 700; color: var(--accent-amber);">REPLACE (Overwrite local rotors)</button>
            <button class="action-btn" id="btn-import-skip" style="height: 42px; font-weight: 700; color: var(--accent-red);">SKIP (Keep local rotors unchanged)</button>
            <button class="action-btn" id="btn-import-cancel" style="height: 38px;">CANCEL IMPORT</button>
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
          <div id="result-tooltip-desc" style="font-size: 14px; line-height: 1.6; color: var(--text-main); margin-bottom: 14px;"></div>
          <div id="result-tooltip-eq-box" style="display: none; background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.25); border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: 13.5px; color: var(--accent); margin-bottom: 12px; word-break: break-all;"></div>
          <div id="result-tooltip-range-box" style="display: none; font-size: 13.5px; margin-bottom: 10px;">
            <span style="font-weight: 700; color: var(--accent-green);">Typical range: </span>
            <span id="result-tooltip-range-text" style="color: var(--text-main);"></span>
          </div>
          <div id="result-tooltip-unit-box" style="display: none; font-size: 13.5px; margin-bottom: 16px;">
            <span style="font-weight: 700; color: var(--accent-amber);">Unit: </span>
            <span id="result-tooltip-unit-text" style="color: var(--text-main);"></span>
          </div>
          <button class="action-btn" id="btn-result-tooltip-open-help" style="width: 100%; height: 42px; font-weight: 700; color: var(--accent);">OPEN FULL PHYSICS &amp; EQUATIONS GUIDE</button>
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
            <div id="quick-converter-result" aria-live="polite">1.3410 hp</div>
          </div>
          <details class="advanced-converter"><summary>More unit conversions</summary>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Quantity Category</label>
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
                <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">From</label>
                <select class="sweep-select" id="converter-from" style="width: 100%; margin-top: 4px;"></select>
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">To</label>
                <select class="sweep-select" id="converter-to" style="width: 100%; margin-top: 4px;"></select>
              </div>
            </div>
            <div>
              <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Value</label>
              <input class="row-input" type="number" id="converter-input-val" value="100" style="width: 100%; margin-top: 4px; text-align: left;" />
            </div>
            <div style="padding: 16px; background: var(--header-bg); border: 1px solid var(--border); border-radius: 8px; text-align: center;">
              <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">CONVERTED RESULT</div>
              <div style="font-size: 24px; font-weight: 800; color: var(--accent); margin-top: 4px;" id="converter-result-val">---</div>
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
          <div class="modal-title" style="letter-spacing: 0.08em; font-size: 16px;">SETTINGS</div>
          <button class="modal-close-btn" data-close="modal-settings">×</button>
        </div>
        <div class="modal-body" style="padding: 12px 18px 24px; overflow-y: auto;">
          <div class="settings-form-grid">
            <div class="settings-section-hdr">DISPLAY</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-title">Theme</div>
                <div class="settings-row-sub">Dark, Light or Midnight Blue</div>
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
                <div class="settings-row-sub">Example: 0.0699 → 0.06993 with +1 decimal</div>
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
              <div class="settings-row-info"><div class="settings-row-title">Android App 1.23</div><div class="settings-row-sub">Download the verified Android APK</div></div>
              <a class="settings-btn" href="https://gitzambrano.github.io/RotorCalculator/RotorCalculator-1.23.apk" download="RotorCalculator-1.23.apk">APK</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: HELP (Full Offline Engineering Manual Viewer) -->
    <div class="modal-overlay" id="modal-help">
      <div class="modal-card modal-help-card">
        <div class="help-modal-header">
          <div class="modal-title" style="letter-spacing: 0.08em; font-size: 16px;">PHYSICS &amp; EQUATIONS</div>
          <div class="help-modal-actions">
            <a class="help-btn-open-tab" id="btn-help-open-tab" href="./physics_help.html" target="_blank" rel="noopener noreferrer" title="Open manual in new browser tab">
              <span>↗</span> OPEN IN TAB
            </a>
            <button class="modal-close-btn" data-close="modal-help">×</button>
          </div>
        </div>
        <div class="help-iframe-container">
          <iframe id="help-iframe" class="help-iframe" src="./physics_help.html" title="RotorCalculator Physics Manual"></iframe>
        </div>
      </div>
    </div>

    <!-- MODAL: ABOUT -->
    <div class="modal-overlay" id="modal-about">
      <div class="modal-card" style="width: min(100%, 420px); text-align: center;">
        <div class="modal-header">
          <div class="modal-title">ABOUT ROTORCALCULATOR</div>
          <button class="modal-close-btn" data-close="modal-about">×</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <img src="${iconUrl}" alt="RotorCalculator" style="width: 64px; height: 64px; border-radius: 12px; margin-bottom: 12px;" />
          <h2 style="font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 4px;">RotorCalculator</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">High-Precision Blade Element Theory (zBET)</p>
          <p style="font-size: 14px; margin-bottom: 6px;">Version 1.23 (Web &amp; PWA Edition)</p>
          <p style="font-size: 13px; color: var(--text-dim); margin-bottom: 20px;">Gustavo José Zambrano</p>
          <button class="action-btn" data-close="modal-about" style="width: 100%; height: 42px;">OK</button>
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
        <div class="modal-body" style="font-size: 13.5px; line-height: 1.6;">
          <h3 style="color: var(--accent); margin-bottom: 8px;">100% Offline &amp; Private</h3>
          <p style="margin-bottom: 12px;">RotorCalculator runs entirely client-side in your web browser. No telemetry, analytics, personal information, or flight geometry data is collected, stored, or transmitted to external servers.</p>
          <h3 style="color: var(--accent); margin-bottom: 8px;">Local Storage</h3>
          <p style="margin-bottom: 12px;">Saved rotor configurations and user preferences are retained purely in your device's browser localStorage. You can export or clear your saved data at any time.</p>
          <button class="action-btn" data-close="modal-privacy" style="width: 100%; height: 42px; margin-top: 14px;">CLOSE</button>
        </div>
      </div>
    </div>

    <div class="tooltip-popover" id="tooltip-popover" role="tooltip"></div>
  </main>
`;

// Helper Element Selectors
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function openPhysicsHelp(anchor?: string): void {
  const iframe = byId<HTMLIFrameElement>("help-iframe");
  const openTabBtn = byId<HTMLAnchorElement>("btn-help-open-tab");
  let asset = "./physics_help.html";
  if (currentTheme === "light") {
    asset = "./physics_help_light.html";
  } else if (currentTheme === "midnight") {
    asset = "./physics_help_midnight.html";
  }

  const urlWithAnchor = anchor ? `${asset}#${anchor}` : asset;
  if (iframe) {
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
      currentTheme === "light" ? "#006978" : currentTheme === "midnight" ? "#0B1730" : "#0D121B"
    );
  }
  const iframe = byId<HTMLIFrameElement>("help-iframe");
  const openTabBtn = byId<HTMLAnchorElement>("btn-help-open-tab");
  if (iframe && iframe.src) {
    const curHash = iframe.src.includes("#") ? iframe.src.split("#")[1] : "";
    let asset = "./physics_help.html";
    if (currentTheme === "light") asset = "./physics_help_light.html";
    else if (currentTheme === "midnight") asset = "./physics_help_midnight.html";
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
  const longPairs: Record<string, string> = {
    rpm_collective: "RPM + Collective", rpm_ct: "RPM + Target CT", rpm_thrust: "RPM + Target Thrust",
    collective_ct: "Collective + Target CT", collective_thrust: "Collective + Target Thrust", ct_thrust: "Target CT + Target Thrust",
  };
  byId("btn-trim-mode").innerHTML = formatSubscripts((mobile ? pairs : longPairs)[activeCond.operatingPair]);
  const inflows: Record<string, string> = { uniform: "Uniform", coleman_simple: "Coleman Simple", coleman_feingold: mobile ? "Coleman-FG" : "Coleman-Feingold", drees: "Drees" };
  byId("btn-inflow-model").textContent = inflows[activeCond.inflowModel];
  byId("btn-drag-info").textContent = mobile ? "Num. Vec." : "Numerical Vectorial";
  document.querySelectorAll<HTMLElement>(".engineering-row > .action-btn").forEach(el => {
    el.style.fontSize = "16px";
    let size = 16;
    while (el.scrollWidth > el.clientWidth && size > 13) el.style.fontSize = `${--size}px`;
  });
}

export function updateResponsiveLabels(): void {
  refreshSelectorCaptions();
  const shell = document.querySelector<HTMLElement>(".app-shell");
  const shellW = shell?.clientWidth || window.innerWidth;
  const isDesktop = window.innerWidth >= 768;
  const startLevel = shellW >= 600 ? 0 : 1;
  const fontScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--engineering-font-scale")) || 1;
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
  localStorage.setItem("rotor_current_page", page);
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
function showOptionPicker(
  title: string,
  options: OptionItem[],
  currentSelectedId: string,
  onSelect: (id: string) => void
): void {
  byId("options-selector-title").textContent = title;
  const list = byId("options-selector-list");
  list.innerHTML = "";
  options.forEach((opt) => {
    const item = document.createElement("div");
    const isSel = opt.id === currentSelectedId;
    item.className = `option-item ${isSel ? "selected" : ""}`;
    item.innerHTML = `
      <div class="option-text-group">
        <div class="option-label">${opt.label}</div>
        ${opt.desc ? `<div class="option-desc">${opt.desc}</div>` : ""}
      </div>
      <div class="option-radio">
        <div class="option-radio-inner"></div>
      </div>
    `;
    item.addEventListener("click", () => {
      closeModal("modal-options-selector");
      onSelect(opt.id);
    });
    list.appendChild(item);
  });
  openModal("modal-options-selector");
}

// Recalculate & Render UI
function recalculate(): void {
  activeCond.altitudeM = Math.max(-500, Math.min(11000, activeCond.altitudeM));
  activeCond.temperatureC = Math.max(-80, Math.min(60, activeCond.temperatureC));
  localStorage.setItem("rotorcalc_active_cond", JSON.stringify(activeCond));
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
    field.value = formatInputValue(key, base ? convertValue(value, base, unit) : value, unit);
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

function renderDerivedGeometry(): void {
  const tipInput = byId<HTMLInputElement>("inp-tiploss-b");
  const tipReadOnly = byId("drv-tip-factor");
  const fixedTip = activeGeom.tipLossMode === "fixed";
  tipInput.style.display = fixedTip ? "" : "none";
  tipReadOnly.style.display = fixedTip ? "none" : "flex";
  tipReadOnly.textContent = (activeGeom.tipLossMode === "none" ? 1 : activeResults.solutionValid ? activeResults.bFactor : activeGeom.tipLossB).toFixed(4 + extraPrecision);
  const fields: [string, string, string | null, string, number][] = [
    ["drv-taper", "taper", null, "", 3],
    ["drv-sigma-geom", "sigmaAct", null, "", 4],
    ["drv-sigma-thrust", "sigmaT", null, "", 4],
    ["drv-disk-area", "A", "unit-disk-area", "m²", 1],
    ["drv-blade-area-ref", "Ab", "unit-blade-area-ref", "m²", 2],
    ["drv-blade-area", "Aact", "unit-blade-area", "m²", 2],
    ["drv-twist", "thTwist", "unit-twist", "rad", 1],
  ];
  fields.forEach(([id, key, unitId, canonicalUnit, digits]) => {
    const input = byId<HTMLInputElement>(id);
    if (document.activeElement === input) return;
    const unit = unitId ? byId(unitId).textContent?.trim() || canonicalUnit : canonicalUnit;
    input.value = convertValue(getGeometryQuantity(activeGeom, key), canonicalUnit, unit).toFixed(digits + extraPrecision);
  });
}

function renderResults(): void {
  const r = activeResults;

  // Status & Trim Chips (matching APK UpdateStatusChips & PairChipText 1:1)
  const tipMach = r.speedOfSound > 0 ? r.tipSpeed / r.speedOfSound : 0.0;
  let statusTxt = "";
  let statusColor = "var(--accent-green)";
  let statusBg = "rgba(0, 230, 118, 0.08)";
  let statusBorder = "rgba(0, 230, 118, 0.4)";

  if (r.compressibilityInvalid) {
    statusColor = "var(--accent-red)";
    statusBg = "rgba(255, 23, 68, 0.08)";
    statusBorder = "rgba(255, 23, 68, 0.4)";
    statusTxt = `Advancing tip Mach M_adv = ${formatSig(r.advancingTipMach, 3)} — Prandtl-Glauert invalid`;
  } else if (!r.solutionValid) {
    statusColor = "var(--accent-red)";
    statusBg = "rgba(255, 23, 68, 0.08)";
    statusBorder = "rgba(255, 23, 68, 0.4)";
    statusTxt = "Invalid operating point";
    const sm = (r.statusMessage || "").replace("INVALID: ", "").replace("INVALID:", "").trim();
    if (sm && !sm.includes("could not be trimmed")) {
      statusTxt += ` — ${sm}`;
    }
  } else if (r.advancingTipMach >= 0.9) {
    statusColor = "var(--accent-amber)";
    statusBg = "rgba(255, 179, 0, 0.08)";
    statusBorder = "rgba(255, 179, 0, 0.4)";
    statusTxt = `Advancing tip Mach M_adv = ${formatSig(r.advancingTipMach, 3)} — compressibility caution`;
  } else if (tipMach >= 0.8 || r.compressibilityWarning) {
    statusColor = "var(--accent-amber)";
    statusBg = "rgba(255, 179, 0, 0.08)";
    statusBorder = "rgba(255, 179, 0, 0.4)";
    statusTxt = `Tip Mach M_tip = ${formatSig(tipMach, 3)} — compressibility caution`;
  } else {
    statusTxt = `Model valid — M_tip = ${formatSig(tipMach, 3)}, M_adv = ${formatSig(r.advancingTipMach, 3)}`;
  }

  const badgeModel = byId("badge-model-status");
  const txtModel = byId("txt-model-status");
  if (txtModel) txtModel.innerHTML = formatSubscripts(statusTxt);
  if (badgeModel) {
    badgeModel.style.color = statusColor;
    badgeModel.style.background = statusBg;
    badgeModel.style.borderColor = statusBorder;
  }

  const pairKey = activeCond.operatingPair;
  const pairChipLabels: Record<string, string> = {
    rpm_collective: "RPM + Δθ",
    rpm_ct: "RPM + C_T",
    rpm_thrust: "RPM + T",
    collective_ct: "Δθ + C_T",
    collective_thrust: "Δθ + T",
    ct_thrust: "C_T + T",
  };
  const pairTxt = pairChipLabels[pairKey] || pairKey;
  const badgeTrim = byId("badge-solution-summary");
  const txtTrim = byId("txt-solution-summary");
  if (txtTrim) {
    if (r.solutionValid) {
      txtTrim.innerHTML = formatSubscripts(`Trim: ${pairTxt}`);
      if (badgeTrim) {
        badgeTrim.style.color = "var(--accent)";
        badgeTrim.style.background = "rgba(0, 229, 255, 0.08)";
        badgeTrim.style.borderColor = "rgba(0, 229, 255, 0.4)";
      }
    } else {
      txtTrim.innerHTML = formatSubscripts(`Trim: ${pairTxt} — no solution`);
      if (badgeTrim) {
        badgeTrim.style.color = "var(--accent-red)";
        badgeTrim.style.background = "rgba(255, 23, 68, 0.08)";
        badgeTrim.style.borderColor = "rgba(255, 23, 68, 0.4)";
      }
    }
  }

  const imp = unitSystem === "imperial";
  document.querySelectorAll<HTMLElement>("#page-results .result-row[data-key]").forEach((row) => {
    const key = row.dataset.key;
    if (!key) return;
    const valEl = row.querySelector<HTMLElement>(".result-val");
    const unitEl = row.querySelector<HTMLElement>(".result-unit");
    if (valEl) {
      valEl.textContent = resTextFor(key, r, activeGeom, imp, extraPrecision);
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
    case "aoaAdv75":
    case "aoaRet75":
    case "phiAdv75":
    case "phiRet75":
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
  const sg = 4 + extraPrec;
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
      break;
    case "P":
      v = imp ? r.powerShaftHP : r.powerShaftKW;
      break;
    case "Pi":
      v = (r.CQi * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      break;
    case "P0":
      v = (r.CQ0 * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      break;
    case "Pair":
      v = (r.CPair * r.densityRho * area * omR * omR * omR) / 1000.0;
      if (imp) v = v * 1.34102209;
      break;
    case "Qi":
      v = r.CQi * r.densityRho * area * omR * omR * geom.radius;
      if (imp) v = v * 0.737562149;
      break;
    case "Q0":
      v = r.CQ0 * r.densityRho * area * omR * omR * geom.radius;
      if (imp) v = v * 0.737562149;
      break;
    case "Hi":
      v = r.CHi * r.densityRho * area * omR * omR;
      if (imp) v = v * 0.224808943;
      break;
    case "H0":
      v = r.CH0 * r.densityRho * area * omR * omR;
      if (imp) v = v * 0.224808943;
      break;
    case "Q":
      v = imp ? r.torqueLbft : r.torqueNm;
      break;
    case "H":
      v = imp ? r.dragHN * 0.224808943 : r.dragHN;
      break;
    case "Y":
      v = imp ? r.sideForceYLbf : r.sideForceYN;
      break;
    case "Mx":
      v = imp ? r.rollMomentLbft : r.rollMomentNm;
      break;
    case "My":
      v = imp ? r.pitchMomentLbft : r.pitchMomentNm;
      break;
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
      break;
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
      v = r.L_D_eff;
      break;
    case "CT":
      v = r.CT;
      break;
    case "CQ":
      v = r.CQ;
      break;
    case "CQi":
      v = r.CQi;
      break;
    case "CQ0":
      v = r.CQ0;
      break;
    case "CH":
      v = r.CH;
      break;
    case "CHi":
      v = r.CHi;
      break;
    case "CH0":
      v = r.CH0;
      break;
    case "CY":
      v = r.CY;
      break;
    case "CMx":
      v = r.CMx;
      break;
    case "CMy":
      v = r.CMy;
      break;
    case "CPair":
      v = r.CPair;
      break;
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
      break;
    case "Mret":
    case "aoaAdv75":
    case "aoaRet75":
    case "phiAdv75":
    case "phiRet75":
      v = derivedOutput(r, key);
      break;
    case "Tc":
      v = derivedTc(r, area);
      break;
    case "Pc":
      v = derivedPc(r, area);
      break;
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
      break;
    case "Bres":
      v = r.bFactor;
      break;
    case "rpm":
      v = r.trimmedRPM;
      break;
    case "coll":
      v = r.trimmedCollectiveDeg;
      break;
    case "mu":
      v = r.operatingMu;
      break;
    case "muz":
      v = r.operatingMuZ;
      break;
    case "alpha":
      v = r.operatingAlphaDeg;
      break;
    case "Vx":
      v = r.operatingVx;
      if (imp) v = v * ft;
      break;
    case "Vz":
      v = r.operatingVz;
      if (imp) v = v * ft;
      break;
    case "OmR":
      v = omR;
      if (imp) v = v * ft;
      break;
    case "a":
      v = r.speedOfSound;
      if (imp) v = v * ft;
      break;
    case "Mtip":
      if (r.speedOfSound <= 0) return "---";
      v = omR / r.speedOfSound;
      break;
    case "Madv":
      v = r.advancingTipMach;
      break;
    case "T0":
      v = r.temperatureC;
      if (imp) v = (v * 9.0) / 5.0 + 32.0;
      break;
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
  byId("result-tooltip-desc").textContent = nom.body || `Engineering quantity for ${nom.full}.`;

  const eqBox = byId("result-tooltip-eq-box");
  if (nom.eq) {
    eqBox.textContent = nom.eq;
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
        "Tip Mach is at or above 0.80, or advancing-tip Mach is at or above 0.90.\n\nThe calculation remains finite, but the linear Prandtl-Glauert approximation is outside its preferred range."
      );
    } else {
      showContextualHelpCustom(
        "Model Status",
        "Valid operating point. Tip Mach and advancing-tip Mach are inside the preferred range."
      );
    }
  });

  byId("badge-solution-summary")?.addEventListener("click", () => {
    showContextualHelpCustom(
      "Operating Solution",
      "The operating solution always reports all four linked quantities: Ω, collective Δθ, C_T and thrust T.\n\nYou prescribe any two in Conditions. RotorCalculator solves the remaining two at the current forward/axial flight condition."
    );
  });

  byId("btn-result-tooltip-open-help")?.addEventListener("click", () => {
    closeModal("modal-result-tooltip");
    openPhysicsHelp();
  });
}

// Operating Controls Setup
function refreshConditionFields(): void {
  byId<HTMLInputElement>("inp-altitude").value = convertValue(activeCond.altitudeM, "m", byId("unit-altitude").textContent?.trim() || "m").toString();
  byId<HTMLInputElement>("inp-temperature").value = convertValue(activeCond.temperatureC, "°C", byId("unit-temperature").textContent?.trim() || "°C").toString();
  byId<HTMLInputElement>("inp-kind").value = activeCond.kInd.toString();
  const horizontalKey = activeCond.horizontalMode === "vx" ? "Vx" : "mu";
  byId("btn-toggle-horiz-mode").dataset.key = horizontalKey;
  byId("unit-horiz-val").textContent = horizontalKey === "Vx" ? "m/s" : "–";
  byId<HTMLInputElement>("inp-horiz-val").value = activeCond.horizontalValue.toString();
  const axialKey = activeCond.axialMode === "vz" ? "Vz" : activeCond.axialMode === "muz" ? "muz" : "alpha";
  byId("btn-toggle-axial-mode").dataset.key = axialKey;
  byId("unit-axial-val").textContent = axialKey === "Vz" ? "m/s" : axialKey === "alpha" ? "deg" : "–";
  byId<HTMLInputElement>("inp-axial-val").value = activeCond.axialValue.toString();
  const inflowLabels: Record<string, string> = { uniform: "Uniform", coleman_simple: "Coleman Simple", coleman_feingold: "Coleman-Feingold", drees: "Drees" };
  byId("btn-inflow-model").textContent = inflowLabels[activeCond.inflowModel] || activeCond.inflowModel;
  refreshOperatingControls();
}

function refreshOperatingControls(): void {
  const pair = activeCond.operatingPair;
  const p1 = byId<HTMLInputElement>("inp-operating-1");
  const p2 = byId<HTMLInputElement>("inp-operating-2");
  const l1 = byId("lbl-operating-1");
  const l2 = byId("lbl-operating-2");
  const u1 = byId("unit-operating-1");
  const u2 = byId("unit-operating-2");

  const btnTrim = byId("btn-trim-mode");
  const pairLabels: Record<string, string> = {
    rpm_collective: "RPM + Collective",
    rpm_ct: "RPM + Target CT",
    rpm_thrust: "RPM + Target Thrust",
    collective_ct: "Collective + Target CT",
    collective_thrust: "Collective + Target Thrust",
    ct_thrust: "Target CT + Target Thrust",
  };
  btnTrim.textContent = pairLabels[pair] || "RPM + Target CT";

  const thrustUnit = prefThrustUnit;

  if (pair === "rpm_collective") {
    l1.dataset.key = "rpm";
    l1.dataset.canonical = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.dataset.key = "coll";
    l2.dataset.canonical = "Collective Δθ";
    u2.textContent = "deg";
    p2.value = activeCond.collectiveDeg.toFixed(2);
  } else if (pair === "rpm_ct") {
    l1.dataset.key = "rpm";
    l1.dataset.canonical = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.dataset.key = "CTtgt";
    l2.dataset.canonical = "Target CT";
    u2.textContent = "–";
    p2.value = activeCond.targetCT.toFixed(5);
  } else if (pair === "rpm_thrust") {
    l1.dataset.key = "rpm";
    l1.dataset.canonical = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.dataset.key = "Ttgt";
    l2.dataset.canonical = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  } else if (pair === "collective_ct") {
    l1.dataset.key = "coll";
    l1.dataset.canonical = "Collective Δθ";
    u1.textContent = "deg";
    p1.value = activeCond.collectiveDeg.toFixed(2);

    l2.dataset.key = "CTtgt";
    l2.dataset.canonical = "Target CT";
    u2.textContent = "–";
    p2.value = activeCond.targetCT.toFixed(5);
  } else if (pair === "collective_thrust") {
    l1.dataset.key = "coll";
    l1.dataset.canonical = "Collective Δθ";
    u1.textContent = "deg";
    p1.value = activeCond.collectiveDeg.toFixed(2);

    l2.dataset.key = "Ttgt";
    l2.dataset.canonical = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  } else if (pair === "ct_thrust") {
    l1.dataset.key = "CTtgt";
    l1.dataset.canonical = "Target CT";
    u1.textContent = "–";
    p1.value = activeCond.targetCT.toFixed(5);

    l2.dataset.key = "Ttgt";
    l2.dataset.canonical = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  }
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
    bar.innerHTML = `${escapeHTML(activeGeom.name)} <span style="color: #FFB300; font-weight: bold; margin-left: 6px;">• * UNSAVED</span>`;
  } else {
    bar.textContent = currentRotor.name;
  }
}

function markGeometryDirty(): void {
  saveDraft(activeGeom, currentRotor.id);
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

// Load Rotor Data into Inputs
// Load Rotor Data into Inputs
function loadRotorToUI(rotor: StoredRotor, preserveCondition = false): void {
  const nominalRpm = rotor.geom.nominalRpm ?? rotor.geom.rpm;
  if (!preserveCondition && nominalRpm > 0) activeCond.rpm = nominalRpm;
  currentRotor = rotor;
  activeGeom = cloneGeometry(rotor.geom);
  isInternalSync = true;
  isGeometryDirty = false;
  updateActiveRotorBar();

  byId<HTMLInputElement>("inp-rotor-name").value = rotor.name;
  byId<HTMLInputElement>("inp-rpm-nom").value = convertValue(activeGeom.nominalRpm || activeGeom.rpm || 258, "rpm", byId("unit-rpm-nom").textContent?.trim() || "rpm").toFixed(2);

  const rUnit = byId("unit-radius")?.textContent?.trim() || "m";
  byId<HTMLInputElement>("inp-radius").value = convertValue(activeGeom.radius, "m", rUnit).toFixed(2);
  byId<HTMLInputElement>("inp-nblades").value = activeGeom.nBlades.toString();
  byId<HTMLInputElement>("inp-cutout").value = activeGeom.rootCutout.toString();

  const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
  byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);

  const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
  byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);

  byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
  byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);

  const thRootUnit = byId("unit-theta-root")?.textContent?.trim() || "deg";
  const degRoot = (activeGeom.thetaRoot * 180) / Math.PI;
  byId<HTMLInputElement>("inp-theta-root").value = convertValue(degRoot, "deg", thRootUnit).toFixed(1);

  const thTipUnit = byId("unit-theta-tip")?.textContent?.trim() || "deg";
  const degTip = (activeGeom.thetaTip * 180) / Math.PI;
  byId<HTMLInputElement>("inp-theta-tip").value = convertValue(degTip, "deg", thTipUnit).toFixed(1);

  const a0Unit = byId("unit-lift-slope")?.textContent?.trim() || "rad⁻¹";
  byId<HTMLInputElement>("inp-lift-slope").value = convertValue(activeGeom.liftSlope0, "rad⁻¹", a0Unit).toFixed(2);

  byId<HTMLInputElement>("inp-cd0").value = activeGeom.cd0.toString();

  const tipModes: Record<string, string> = { none: "NONE", fixed: "FIXED B", sissingh: "SISSINGH" };
  byId<HTMLButtonElement>("btn-tiploss-mode").textContent = tipModes[activeGeom.tipLossMode] || "SISSINGH";
  byId<HTMLInputElement>("inp-tiploss-b").value = activeGeom.tipLossB.toString();

  byId<HTMLButtonElement>("btn-compressibility").textContent = activeGeom.usePrandtlGlauert ? "ON (PG)" : "OFF";
  byId<HTMLButtonElement>("btn-compressibility").style.color = activeGeom.usePrandtlGlauert ? "var(--accent-green)" : "var(--text-muted)";

  refreshAirfoilName();
  refreshOperatingControls();
  recalculate();
  isInternalSync = false;
}

function refreshGeomFields(skipKey?: string): void {
  const rUnit = byId("unit-radius")?.textContent?.trim() || "m";
  const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
  const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
  const thRootUnit = byId("unit-theta-root")?.textContent?.trim() || "deg";
  const thTipUnit = byId("unit-theta-tip")?.textContent?.trim() || "deg";

  if (skipKey !== "R") byId<HTMLInputElement>("inp-radius").value = convertValue(activeGeom.radius, "m", rUnit).toFixed(2);
  if (skipKey !== "Nb") byId<HTMLInputElement>("inp-nblades").value = activeGeom.nBlades.toString();
  if (skipKey !== "x0") byId<HTMLInputElement>("inp-cutout").value = activeGeom.rootCutout.toString();
  if (skipKey !== "c0") byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);
  if (skipKey !== "c1") byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);
  if (skipKey !== "sigmaRef") byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
  if (skipKey !== "AR") byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);
  if (skipKey !== "thRoot") {
    const degRoot = (activeGeom.thetaRoot * 180) / Math.PI;
    byId<HTMLInputElement>("inp-theta-root").value = convertValue(degRoot, "deg", thRootUnit).toFixed(1);
  }
  if (skipKey !== "thTip") {
    const degTip = (activeGeom.thetaTip * 180) / Math.PI;
    byId<HTMLInputElement>("inp-theta-tip").value = convertValue(degTip, "deg", thTipUnit).toFixed(1);
  }

  renderDerivedGeometry();
}

function onGeomParamInput(key: string, valSI: number): void {
  if (isInternalSync) return;
  isInternalSync = true;
  activeGeom = setGeometryQuantity(activeGeom, key, valSI);
  saveDraft(activeGeom, currentRotor.id);
  markGeometryDirty();
  refreshGeomFields(key);
  recalculate();
  isInternalSync = false;
}

// Bidirectional Input Listeners & Cross-Updating
function bindInputListeners(): void {
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
    byId<HTMLInputElement>(id).addEventListener("input", () => {
      const value = Number.parseFloat(byId<HTMLInputElement>(id).value);
      if (!Number.isFinite(value) || (key !== "thTwist" && value <= 0)) return;
      const unit = unitId ? byId(unitId).textContent?.trim() || canonicalUnit : canonicalUnit;
      onGeomParamInput(key, convertValue(value, unit, canonicalUnit));
    });
    byId(id).addEventListener("blur", renderDerivedGeometry);
  });
  // Planform inputs with mutual cross-updating
  byId("inp-radius").addEventListener("input", () => {
    const rUnit = byId("unit-radius")?.textContent?.trim() || "m";
    const rVal = parseFloat(byId<HTMLInputElement>("inp-radius").value);
    if (rVal > 0) {
      const rSI = convertValue(rVal, rUnit, "m");
      onGeomParamInput("R", rSI);
    }
  });

  byId("inp-nblades").addEventListener("input", () => {
    const nb = parseInt(byId<HTMLInputElement>("inp-nblades").value, 10);
    if (nb > 0) onGeomParamInput("Nb", nb);
  });

  byId("inp-cutout").addEventListener("input", () => {
    const x0 = parseFloat(byId<HTMLInputElement>("inp-cutout").value);
    if (x0 >= 0) onGeomParamInput("x0", x0);
  });

  byId("inp-chord-root").addEventListener("input", () => {
    const unit = byId("unit-chord-root")?.textContent?.trim() || "m";
    const val = parseFloat(byId<HTMLInputElement>("inp-chord-root").value);
    if (val > 0) onGeomParamInput("c0", convertValue(val, unit, "m"));
  });

  byId("inp-chord-tip").addEventListener("input", () => {
    const unit = byId("unit-chord-tip")?.textContent?.trim() || "m";
    const val = parseFloat(byId<HTMLInputElement>("inp-chord-tip").value);
    if (val > 0) onGeomParamInput("c1", convertValue(val, unit, "m"));
  });

  byId("inp-sigma-ref").addEventListener("input", () => {
    const s = parseFloat(byId<HTMLInputElement>("inp-sigma-ref").value);
    if (s > 0) onGeomParamInput("sigmaRef", s);
  });

  byId("inp-aspect-ratio").addEventListener("input", () => {
    const ar = parseFloat(byId<HTMLInputElement>("inp-aspect-ratio").value);
    if (ar > 0) onGeomParamInput("AR", ar);
  });

  byId("inp-theta-root").addEventListener("input", () => {
    const unit = byId("unit-theta-root")?.textContent?.trim() || "deg";
    const val = parseFloat(byId<HTMLInputElement>("inp-theta-root").value) || 0;
    const deg = convertValue(val, unit, "deg");
    onGeomParamInput("thRoot", (deg * Math.PI) / 180);
  });

  byId("inp-theta-tip").addEventListener("input", () => {
    const unit = byId("unit-theta-tip")?.textContent?.trim() || "deg";
    const val = parseFloat(byId<HTMLInputElement>("inp-theta-tip").value) || 0;
    const deg = convertValue(val, unit, "deg");
    onGeomParamInput("thTip", (deg * Math.PI) / 180);
  });

  byId("inp-rpm-nom").addEventListener("input", () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-rpm-nom").value);
    if (val > 0) {
      const rpm = convertValue(val, byId("unit-rpm-nom").textContent?.trim() || "rpm", "rpm");
      activeGeom.nominalRpm = rpm;
      activeGeom.rpm = rpm;
      saveDraft(activeGeom, currentRotor.id);
      markGeometryDirty();
    }
  });

  byId("inp-rotor-name").addEventListener("input", () => {
    activeGeom.name = byId<HTMLInputElement>("inp-rotor-name").value.trim() || "Custom Rotor";
    saveDraft(activeGeom, currentRotor.id);
    markGeometryDirty();
  });

  byId("inp-lift-slope").addEventListener("input", () => {
    const unit = byId("unit-lift-slope")?.textContent?.trim() || "rad⁻¹";
    const val = parseFloat(byId<HTMLInputElement>("inp-lift-slope").value) || 5.73;
    activeGeom.liftSlope0 = convertValue(val, unit, "rad⁻¹");
    saveDraft(activeGeom, currentRotor.id);
    markGeometryDirty();
    recalculate();
  });

  byId("inp-cd0").addEventListener("input", () => {
    const value = Number.parseFloat(byId<HTMLInputElement>("inp-cd0").value);
    if (!Number.isFinite(value) || value < 0) return;
    activeGeom.cd0 = value;
    saveDraft(activeGeom, currentRotor.id);
    markGeometryDirty();
    recalculate();
  });

  byId("inp-tiploss-b").addEventListener("input", () => {
    activeGeom.tipLossB = parseFloat(byId<HTMLInputElement>("inp-tiploss-b").value) || 0.97;
    saveDraft(activeGeom, currentRotor.id);
    markGeometryDirty();
    recalculate();
  });

  // Condition Inputs
  const saveActiveCondSession = () => {
    try {
      localStorage.setItem("rotorcalc_active_cond", JSON.stringify(activeCond));
    } catch {
      // ignore
    }
  };

  byId("inp-altitude").addEventListener("input", () => {
    const unit = byId("unit-altitude")?.textContent?.trim() || "m";
    const val = parseFloat(byId<HTMLInputElement>("inp-altitude").value) || 0;
    activeCond.altitudeM = convertValue(val, unit, "m");
    saveActiveCondSession();
    recalculate();
  });

  byId("inp-temperature").addEventListener("input", () => {
    const unit = byId("unit-temperature")?.textContent?.trim() || "°C";
    const val = Number.parseFloat(byId<HTMLInputElement>("inp-temperature").value);
    activeCond.temperatureC = convertValue(val, unit, "°C");
    saveActiveCondSession();
    recalculate();
  });

  byId("inp-horiz-val").addEventListener("input", () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-horiz-val").value) || 0;
    if (activeCond.horizontalMode === "vx") {
      const unit = byId("unit-horiz-val")?.textContent?.trim() || "m/s";
      activeCond.horizontalValue = convertValue(val, unit, "m/s");
    } else {
      activeCond.horizontalValue = val;
    }
    saveActiveCondSession();
    recalculate();
  });

  byId("inp-axial-val").addEventListener("input", () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-axial-val").value) || 0;
    if (activeCond.axialMode === "vz") {
      const unit = byId("unit-axial-val")?.textContent?.trim() || "m/s";
      activeCond.axialValue = convertValue(val, unit, "m/s");
    } else if (activeCond.axialMode === "alpha") {
      activeCond.axialValue = convertValue(val, byId("unit-axial-val").textContent?.trim() || "deg", "deg");
    } else {
      activeCond.axialValue = val;
    }
    saveActiveCondSession();
    recalculate();
  });

  byId("inp-kind").addEventListener("input", () => {
    activeCond.kInd = parseFloat(byId<HTMLInputElement>("inp-kind").value) || 1.15;
    saveActiveCondSession();
    recalculate();
  });

  // Operating Pair Inputs (1 and 2)
  const onOperatingInput1 = () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-operating-1").value) || 0;
    const pair = activeCond.operatingPair;
    if (pair === "rpm_collective" || pair === "rpm_ct" || pair === "rpm_thrust") {
      activeCond.rpm = convertValue(val, byId("unit-operating-1").textContent?.trim() || "rpm", "rpm");
    } else if (pair === "collective_ct" || pair === "collective_thrust") {
      activeCond.collectiveDeg = convertValue(val, byId("unit-operating-1").textContent?.trim() || "deg", "deg");
    } else if (pair === "ct_thrust") {
      activeCond.targetCT = val;
    }
    saveActiveCondSession();
    recalculate();
  };

  const onOperatingInput2 = () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-operating-2").value) || 0;
    const pair = activeCond.operatingPair;
    if (pair === "rpm_collective") {
      activeCond.collectiveDeg = convertValue(val, byId("unit-operating-2").textContent?.trim() || "deg", "deg");
    } else if (pair === "rpm_ct" || pair === "collective_ct") {
      activeCond.targetCT = val;
    } else if (pair === "rpm_thrust" || pair === "collective_thrust" || pair === "ct_thrust") {
      const unit = byId("unit-operating-2")?.textContent?.trim() || "N";
      activeCond.targetThrustN = convertValue(val, unit, "N");
    }
    saveActiveCondSession();
    recalculate();
  };

  byId("inp-operating-1").addEventListener("input", onOperatingInput1);
  byId("inp-operating-2").addEventListener("input", onOperatingInput2);
}

// Modal Control Helpers
function openModal(id: string): void {
  const modal = byId(id);
  if (!modal) return;
  const top = Math.max(100, ...Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"))
    .map(el => Number.parseInt(getComputedStyle(el).zIndex, 10) || 100));
  modal.style.zIndex = `${top + 1}`;
  modal.classList.add("open");
}

function closeModal(id: string): void {
  byId(id)?.classList.remove("open");
  byId(id)?.style.removeProperty("z-index");
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
    const openModals = Array.from(document.querySelectorAll<HTMLElement>(".modal-overlay.open"));
    const top = openModals.sort((a, b) => (Number.parseInt(getComputedStyle(b).zIndex, 10) || 100) - (Number.parseInt(getComputedStyle(a).zIndex, 10) || 100))[0];
    if (top) {
      closeModal(top.id);
      history.pushState({ rotorCalculator: true, page: currentPage }, "");
      return;
    }
    if (!isAppState(event.state)) return;
    const page = event.state.page;
    if (page === "geometry" || page === "conditions" || page === "results") activatePage(page, "right", "none");
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
        const asset = currentTheme === "light" ? "./privacy_policy_light.html" : "./privacy_policy.html";
        window.open(asset, "_blank", "noopener");
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
          byId("btn-select-airfoil").textContent = sel.name;
          byId<HTMLInputElement>("inp-lift-slope").value = convertValue(sel.a0, "rad⁻¹", byId("unit-lift-slope").textContent?.trim() || "rad⁻¹").toFixed(2);
          byId<HTMLInputElement>("inp-cd0").value = sel.cd0.toString();
          markGeometryDirty();
          recalculate();
        }
      }
    );
  });

  // 2. Trim Mode Modal (All 6 pairs)
  const trimModes: { id: FlightCondition["operatingPair"]; label: string; desc: string }[] = [
    { id: "rpm_ct", label: "RPM + Target CT", desc: "Prescribe RPM & Target CT; solves Collective Δθ and Thrust" },
    { id: "rpm_thrust", label: "RPM + Target Thrust", desc: "Prescribe RPM & Target Thrust; solves Collective Δθ and CT" },
    { id: "rpm_collective", label: "RPM + Collective Δθ", desc: "Prescribe RPM & Collective pitch increment; direct evaluation" },
    { id: "collective_ct", label: "Collective Δθ + Target CT", desc: "Prescribe Collective & CT; solves unique rotor RPM" },
    { id: "collective_thrust", label: "Collective Δθ + Target Thrust", desc: "Prescribe Collective & Thrust; solves rotor RPM and CT" },
    { id: "ct_thrust", label: "Target CT + Target Thrust", desc: "Prescribe Target CT & Thrust; solves both RPM and Collective" },
  ];

  byId("btn-trim-mode").addEventListener("click", () => {
    showOptionPicker(
      "Trim Mode · prescribe any two",
      trimModes,
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
    { id: "fixed", label: "Fixed B", desc: "Prescribed tip-loss factor entered in Tip Factor B" },
    { id: "sissingh", label: "Sissingh", desc: "Iterated thrust-dependent tip-loss factor: B = 1 - √(2CT)/Nb" },
  ];

  byId("btn-tiploss-mode").addEventListener("click", () => {
    showOptionPicker(
      "Tip-Loss Model",
      tipModes,
      activeGeom.tipLossMode,
      (modeId) => {
        activeGeom.tipLossMode = modeId as RotorGeometry["tipLossMode"];
        const labels: Record<string, string> = { none: "NONE", fixed: "FIXED B", sissingh: "SISSINGH" };
        byId("btn-tiploss-mode").textContent = labels[activeGeom.tipLossMode];
        markGeometryDirty();
        recalculate();
      }
    );
  });

  // 4. Compressibility Model Modal
  const compModes: { id: string; label: string; desc: string }[] = [
    { id: "off", label: "Off", desc: "No subsonic compressibility correction" },
    { id: "on", label: "On (Prandtl-Glauert)", desc: "Compressibility scaling on lift slope via effective Mach Meff" },
  ];

  byId("btn-compressibility").addEventListener("click", () => {
    showOptionPicker(
      "Compressibility Model",
      compModes,
      activeGeom.usePrandtlGlauert ? "on" : "off",
      (selId) => {
        activeGeom.usePrandtlGlauert = selId === "on";
        byId("btn-compressibility").textContent = activeGeom.usePrandtlGlauert ? "ON (PG)" : "OFF";
        byId("btn-compressibility").style.color = activeGeom.usePrandtlGlauert ? "var(--accent-green)" : "var(--text-muted)";
        markGeometryDirty();
        recalculate();
      }
    );
  });

  // 5. Inflow Model Modal
  const inflowModes: { id: FlightCondition["inflowModel"]; label: string; desc: string }[] = [
    { id: "uniform", label: "Uniform", desc: "Benchmark without first-harmonic gradients (Kx = 0, Ky = 0)" },
    { id: "coleman_simple", label: "Coleman Simple", desc: "Longitudinal gradient proportional to wake skew angle" },
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
          coleman_simple: "Coleman Simple",
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
        if (selId === "vx") {
          activeCond.horizontalMode = "vx";
          activeCond.horizontalValue = activeResults.solutionValid ? activeResults.operatingVx : nativeFallbackFlow().vx;
          byId("btn-toggle-horiz-mode").dataset.key = "Vx";
          byId("unit-horiz-val").textContent = prefSpeedUnit;
          byId<HTMLInputElement>("inp-horiz-val").value = convertValue(activeCond.horizontalValue, "m/s", prefSpeedUnit).toFixed(1);
        } else {
          activeCond.horizontalMode = "mu";
          activeCond.horizontalValue = activeResults.solutionValid ? activeResults.operatingMu : nativeFallbackFlow().mu;
          byId("btn-toggle-horiz-mode").dataset.key = "mu";
          byId("unit-horiz-val").textContent = "–";
          byId<HTMLInputElement>("inp-horiz-val").value = activeCond.horizontalValue.toFixed(3);
        }
        recalculate();
      }
    );
  });

  // 7. Axial Flow Representation Modal (alpha vs vz vs muz)
  const axialModes: { id: "alpha" | "vz" | "muz"; label: string; desc: string }[] = [
    { id: "alpha", label: "Angle of Attack α [deg]", desc: "Rotor disk angle of attack (α > 0 for climb/wind from below)" },
    { id: "vz", label: "Climb Speed Vz", desc: "Dimensional vertical velocity (Vz > 0 downward through disk)" },
    { id: "muz", label: "Axial Ratio μz [–]", desc: "Non-dimensional axial velocity Vz / (ΩR)" },
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
        if (selId === "alpha") {
          activeCond.axialValue = activeResults.solutionValid ? activeResults.operatingAlphaDeg : alphaFromMuZ(mu, muZ);
          byId("btn-toggle-axial-mode").dataset.key = "alpha";
          byId("unit-axial-val").textContent = "deg";
          byId<HTMLInputElement>("inp-axial-val").value = activeCond.axialValue.toFixed(1);
        } else if (selId === "vz") {
          activeCond.axialValue = activeResults.solutionValid ? activeResults.operatingVz : muZ * flow.vtip;
          byId("btn-toggle-axial-mode").dataset.key = "Vz";
          const vzUnit = unitSystem === "imperial" ? "ft/min" : "m/s";
          byId("unit-axial-val").textContent = vzUnit;
          byId<HTMLInputElement>("inp-axial-val").value = convertValue(activeCond.axialValue, "m/s", vzUnit).toFixed(2);
        } else {
          activeCond.axialValue = muZ;
          byId("btn-toggle-axial-mode").dataset.key = "muz";
          byId("unit-axial-val").textContent = "–";
          byId<HTMLInputElement>("inp-axial-val").value = activeCond.axialValue.toFixed(4);
        }
        recalculate();
      }
    );
  });
}

// Unit Buttons Binding with Modal Picker
function bindUnitButtons(): void {
  const configs = [
    {
      btnId: "unit-radius",
      fieldName: "Radius R",
      units: ["m", "ft", "in", "cm", "mm"],
      getSI: () => activeGeom.radius,
      setSI: (v: number) => {
        activeGeom = scaleRadiusPreserveReference(activeGeom, v);
      },
      updateUI: (val: number, u: string) => {
        byId<HTMLInputElement>("inp-radius").value = val.toFixed(2);
        const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
        const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
        byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);
        byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);
        byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
        byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);
      },
    },
    {
      btnId: "unit-chord-root",
      fieldName: "Root Chord c0",
      units: ["m", "ft", "in", "cm", "mm"],
      getSI: () => activeGeom.chordRoot,
      setSI: (v: number) => { activeGeom.chordRoot = v; activeGeom = resolveSolidity(activeGeom); },
      updateUI: (val: number) => {
        byId<HTMLInputElement>("inp-chord-root").value = val.toFixed(3);
        byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
        byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);
      },
    },
    {
      btnId: "unit-chord-tip",
      fieldName: "Tip Chord c1",
      units: ["m", "ft", "in", "cm", "mm"],
      getSI: () => activeGeom.chordTip,
      setSI: (v: number) => { activeGeom.chordTip = v; activeGeom = resolveSolidity(activeGeom); },
      updateUI: (val: number) => {
        byId<HTMLInputElement>("inp-chord-tip").value = val.toFixed(3);
        byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
        byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);
      },
    },
    {
      btnId: "unit-theta-root",
      fieldName: "Root Pitch",
      units: ["deg", "rad"],
      getSI: () => (activeGeom.thetaRoot * 180) / Math.PI,
      setSI: (v: number) => { activeGeom.thetaRoot = (v * Math.PI) / 180; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-theta-root").value = val.toFixed(1); },
    },
    {
      btnId: "unit-theta-tip",
      fieldName: "Tip Pitch",
      units: ["deg", "rad"],
      getSI: () => (activeGeom.thetaTip * 180) / Math.PI,
      setSI: (v: number) => { activeGeom.thetaTip = (v * Math.PI) / 180; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-theta-tip").value = val.toFixed(1); },
    },
    {
      btnId: "unit-twist",
      fieldName: "Total Twist",
      units: ["deg", "rad"],
      getSI: () => (activeGeom.thetaTip - activeGeom.thetaRoot) * 180 / Math.PI,
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
    {
      btnId: "unit-lift-slope",
      fieldName: "Lift Slope a0",
      units: ["rad⁻¹", "deg⁻¹"],
      getSI: () => activeGeom.liftSlope0,
      setSI: (v: number) => { activeGeom.liftSlope0 = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-lift-slope").value = val.toFixed(2); },
    },
    {
      btnId: "unit-altitude",
      fieldName: "Altitude",
      units: ["m", "ft", "km"],
      getSI: () => activeCond.altitudeM,
      setSI: (v: number) => { activeCond.altitudeM = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-altitude").value = val.toFixed(0); },
    },
    {
      btnId: "unit-temperature",
      fieldName: "Temperature",
      units: ["°C", "°F", "K"],
      getSI: () => activeCond.temperatureC,
      setSI: (v: number) => { activeCond.temperatureC = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-temperature").value = val.toFixed(1); },
    },
    {
      btnId: "unit-horiz-val",
      fieldName: "Horizontal Airspeed Vx",
      units: ["m/s", "kt", "km/h", "mph", "ft/s"],
      getSI: () => activeCond.horizontalValue,
      setSI: (v: number) => { activeCond.horizontalValue = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-horiz-val").value = val.toFixed(1); },
      onlyWhen: () => activeCond.horizontalMode === "vx",
    },
    {
      btnId: "unit-axial-val",
      fieldName: "Climb Speed Vz",
      units: ["m/s", "ft/s", "kt", "km/h", "ft/min"],
      getSI: () => activeCond.axialValue,
      setSI: (v: number) => { activeCond.axialValue = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-axial-val").value = val.toFixed(2); },
      onlyWhen: () => activeCond.axialMode === "vz",
    },
    {
      btnId: "unit-disk-area",
      fieldName: "Disk Area",
      units: ["m²", "ft²", "in²", "cm²"],
      getSI: () => Math.PI * activeGeom.radius * activeGeom.radius,
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
    {
      btnId: "unit-blade-area-ref",
      fieldName: "Reference Blade Area Ab",
      units: ["m²", "ft²", "in²", "cm²"],
      getSI: () => referenceBladeArea(activeGeom),
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
    {
      btnId: "unit-blade-area",
      fieldName: "Blade Area",
      units: ["m²", "ft²", "in²", "cm²"],
      getSI: () => referenceBladeArea(activeGeom) * activeGeom.nBlades * (1.0 - activeGeom.rootCutout),
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
  ];

  byId("btn-drag-info").addEventListener("click", () => showContextualHelp("drag_numerical"));
  ["unit-operating-1", "unit-operating-2", "unit-rpm-nom"].forEach((id) => {
    byId(id).addEventListener("click", () => {
      const key = id === "unit-rpm-nom" ? "rpmNom" : byId(id === "unit-operating-1" ? "lbl-operating-1" : "lbl-operating-2").dataset.key;
      const units = key === "rpm" || key === "rpmNom" ? ["rpm", "rad/s"] : key === "coll" ? ["deg", "rad"] : key === "Ttgt" ? ["N", "kN", "lbf"] : [];
      if (!units.length) return;
      showOptionPicker("Input Unit", units.map((unit) => ({ id: unit, label: unit })), byId(id).textContent?.trim() || units[0], (unit) => {
        byId(id).textContent = unit;
        const value = key === "rpmNom" ? activeGeom.nominalRpm || activeGeom.rpm : key === "rpm" ? activeCond.rpm : key === "coll" ? activeCond.collectiveDeg : activeCond.targetThrustN;
        byId<HTMLInputElement>(id === "unit-rpm-nom" ? "inp-rpm-nom" : id === "unit-operating-1" ? "inp-operating-1" : "inp-operating-2").value = convertValue(value, units[0], unit).toFixed(3);
      });
    });
  });
  byId("unit-axial-val").addEventListener("click", () => {
    if (activeCond.axialMode !== "alpha") return;
    showOptionPicker("Angle Unit", ["deg", "rad"].map((unit) => ({ id: unit, label: unit })), byId("unit-axial-val").textContent?.trim() || "deg", (unit) => {
      byId("unit-axial-val").textContent = unit;
      byId<HTMLInputElement>("inp-axial-val").value = convertValue(activeCond.axialValue, "deg", unit).toFixed(3);
    });
  });

  configs.forEach((cfg) => {
    const btn = document.getElementById(cfg.btnId) as HTMLButtonElement | null;
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (cfg.onlyWhen && !cfg.onlyWhen()) return;
      const curUnit = btn.textContent?.trim() || cfg.units[0];

      showOptionPicker(
        `Unit · ${cfg.fieldName}`,
        cfg.units.map((u) => ({ id: u, label: u })),
        curUnit,
        (selectedUnit) => {
          btn.textContent = selectedUnit;
          const si = cfg.getSI();
          const converted = convertValue(si, cfg.units[0], selectedUnit);
          cfg.updateUI(converted, selectedUnit);
          recalculate();
        }
      );
    });
  });
}

function promptRotorName(title: string, initial: string, positive: string): Promise<string | null> {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.id = "modal-name-input"; overlay.className = "modal-overlay";
    overlay.innerHTML = `<form class="modal-card rotor-name-dialog" role="dialog" aria-modal="true" aria-labelledby="name-dialog-title"><div class="modal-header"><div class="modal-title" id="name-dialog-title">${escapeHTML(title)}</div><button type="button" class="modal-close-btn">×</button></div><div class="modal-body"><label for="name-dialog-input">Name (max 32 characters)</label><input class="row-input" id="name-dialog-input" maxlength="32" autocomplete="off"><div class="name-dialog-actions"><button type="button" class="action-btn" id="name-dialog-cancel">Cancel</button><button type="submit" class="action-btn save">${escapeHTML(positive)}</button></div></div></form>`;
    document.body.append(overlay);
    const input = overlay.querySelector<HTMLInputElement>("input")!;
    input.value = initial.slice(0,32);
    const onBrowserBack = () => finish(null);
    const finish = (value: string | null) => { document.removeEventListener("keydown", escape, true); window.removeEventListener("popstate", onBrowserBack); closeModal(overlay.id); overlay.remove(); resolve(value); };
    const escape = (event: KeyboardEvent) => { if(event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); finish(null); } };
    overlay.querySelector("form")!.onsubmit = event => { event.preventDefault(); finish(input.value.replace(/\|/g,"/").replace(/[\r\n]+/g," ").trim().slice(0,32)); };
    overlay.querySelector<HTMLButtonElement>(".modal-close-btn")!.onclick = () => finish(null);
    overlay.querySelector<HTMLButtonElement>("#name-dialog-cancel")!.onclick = () => finish(null);
    overlay.onclick = event => { if(event.target === overlay) finish(null); };
    document.addEventListener("keydown", escape, true); window.addEventListener("popstate", onBrowserBack); openModal(overlay.id); input.focus(); input.select();
  });
}

async function renameActiveRotor(): Promise<void> {
  const name = await promptRotorName("Rename Rotor", activeGeom.name, "Rename");
  if (!name || name === activeGeom.name) return;
  if (storedRotors.some(rotor => rotor.id !== currentRotor.id && rotor.name.toLowerCase() === name.toLowerCase())) { alert(`A rotor named ${name} already exists.`); return; }
  activeGeom.name = name;
  byId<HTMLInputElement>("inp-rotor-name").value = name;
  markGeometryDirty(); updateActiveRotorBar();
}

async function copyRotorGeometry(geometry: RotorGeometry): Promise<void> {
  const base = geometry.name.replace(/ (?:\(copy\)|copy(?: \d+)?)$/i, "");
  const name = await promptRotorName("Copy Rotor", uniqueRotorName(`${base} Copy`), "Copy");
  if (!name) return;
  const copy: StoredRotor = { id: `custom-${Date.now()}`, name: uniqueRotorName(name), geom: cloneGeometry(geometry) };
  copy.geom.name = copy.name; clearDraft(); storedRotors.push(copy); saveStoredRotors(storedRotors); setActiveRotorId(copy.id); loadRotorToUI(copy); renderRotorManagerList(); closeModal("modal-rotor-manager");
}

function uniqueRotorName(base: string, exceptId?: string): string {
  const clean = base.replace(/\|/g, "/").replace(/[\r\n]+/g, " ").trim() || "Custom Rotor";
  let name = clean;
  let suffix = 2;
  while (storedRotors.some((rotor) => rotor.id !== exceptId && rotor.name.trim().toLowerCase() === name.toLowerCase())) {
    name = `${clean} ${suffix++}`;
  }
  return name;
}

function restoreFactoryRotors(): void {
  resolveUnsavedGeometry("restoring factory presets", () => {
    if (!confirm("Restore the shipped factory rotor definitions?\n\nCustom user rotors are preserved. Same-name factory presets are replaced by their original values.")) return;
    clearDraft();
    storedRotors = resetToFactoryPresets();
    loadRotorToUI(storedRotors.find((rotor) => rotor.id === getActiveRotorId()) || storedRotors[0]);
    alert("Factory presets restored; custom rotors preserved.");
  });
}

function downloadGeometriesBackup(): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const txt = exportRotorsDatabaseText(storedRotors);
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rotors_db_${dateStr}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Rotor Actions (Save, Copy, Delete, New, Import, Export)
function bindRotorActionButtons(): void {
  byId("btn-geom-save").addEventListener("click", () => {
    activeGeom.name = uniqueRotorName(activeGeom.name, currentRotor.id);
    currentRotor.name = activeGeom.name;
    currentRotor.geom = cloneGeometry(activeGeom);
    saveStoredRotors(storedRotors);
    clearDraft();
    isGeometryDirty = false;
    updateActiveRotorBar();
    const saveBtn = byId("btn-geom-save");
    saveBtn.textContent = "SAVED ✓";
    setTimeout(() => (saveBtn.textContent = "SAVE"), 1500);
  });

  byId("btn-geom-copy").addEventListener("click", () => { void copyRotorGeometry(activeGeom); });

  byId("btn-geom-delete").addEventListener("click", () => {
    if (storedRotors.length <= 1) {
      alert("Cannot delete the only remaining rotor.");
      return;
    }
    if (confirm(`Delete current rotor "${activeGeom.name}"?`)) {
      clearDraft();
      storedRotors = storedRotors.filter((r) => r.id !== currentRotor.id);
      saveStoredRotors(storedRotors);
      loadRotorToUI(storedRotors[0]);
      setActiveRotorId(storedRotors[0].id);
    }
  });

  byId("btn-manager-new").addEventListener("click", () => {
    resolveUnsavedGeometry("creating a new rotor", () => {
      clearDraft();
      const newRotor: StoredRotor = {
        id: `custom-${Date.now()}`,
        name: uniqueRotorName("Custom Rotor"),
        geom: createDefaultGeometry(),
      };
      newRotor.geom.name = newRotor.name;
      storedRotors.push(newRotor);
      saveStoredRotors(storedRotors);
      loadRotorToUI(newRotor);
      setActiveRotorId(newRotor.id);
      closeModal("modal-rotor-manager");
    });
  });

  byId("btn-manager-export").addEventListener("click", () => {
    downloadGeometriesBackup();
  });

  byId("btn-settings-export")?.addEventListener("click", () => {
    downloadGeometriesBackup();
  });

  byId("btn-manager-import").addEventListener("click", () => {
    byId<HTMLInputElement>("file-import-input").click();
  });

  byId("btn-settings-import")?.addEventListener("click", () => {
    byId<HTMLInputElement>("file-import-input").click();
  });

  byId<HTMLInputElement>("file-import-input").addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const imported = importRotorsUniversal(content);
      if (!imported || imported.length === 0) {
        alert("Failed to parse valid rotor geometries from file. Supported formats: RotorCalculator backup (.txt) or (.json).");
        return;
      }
      resolveUnsavedGeometry("importing geometries", () => {
        clearDraft();
      const conflicting = imported.filter((imp) =>
        storedRotors.some((loc) => loc.name.toLowerCase() === imp.name.toLowerCase())
      );
      if (conflicting.length === 0) {
        storedRotors.push(...imported);
        saveStoredRotors(storedRotors);
        loadRotorToUI(imported[0]);
        setActiveRotorId(imported[0].id);
        renderRotorManagerList();
        alert(`Successfully imported ${imported.length} rotor geometries.`);
      } else {
        pendingImportList = imported;
        byId("import-conflict-msg").innerHTML = `Found <strong>${imported.length} valid geometries</strong>.<br><br><strong>${conflicting.length} conflict(s)</strong> detected with existing local rotors:<br><em>${conflicting.map((c) => escapeHTML(c.name)).join(", ")}</em>.<br><br>How would you like to handle conflicting rotors?`;
        openModal("modal-import-conflict");
      }
      });
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = "";
  });

  // Modal: Unsaved Changes Confirm Listeners
  byId("btn-unsaved-save").addEventListener("click", () => {
    activeGeom.name = uniqueRotorName(activeGeom.name, currentRotor.id);
    currentRotor.name = activeGeom.name;
    currentRotor.geom = cloneGeometry(activeGeom);
    saveStoredRotors(storedRotors);
    clearDraft();
    isGeometryDirty = false;
    updateActiveRotorBar();
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

  // Modal: Import Conflict Resolution Listeners
  byId("btn-import-rename").addEventListener("click", () => {
    if (!pendingImportList.length) return;
    pendingImportList.forEach((imp) => {
      let candidateName = imp.name;
      let counter = 1;
      while (storedRotors.some((r) => r.name.toLowerCase() === candidateName.toLowerCase())) {
        candidateName = `${imp.name} (${counter === 1 ? "Imported" : counter})`;
        counter++;
      }
      storedRotors.push({
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: candidateName,
        geom: { ...cloneGeometry(imp.geom), name: candidateName },
      });
    });
    saveStoredRotors(storedRotors);
    loadRotorToUI(storedRotors[storedRotors.length - 1]);
    setActiveRotorId(storedRotors[storedRotors.length - 1].id);
    renderRotorManagerList();
    closeModal("modal-import-conflict");
    alert(`Successfully imported ${pendingImportList.length} rotor geometries with unique names.`);
    pendingImportList = [];
  });

  byId("btn-import-replace").addEventListener("click", () => {
    if (!pendingImportList.length) return;
    pendingImportList.forEach((imp) => {
      const matchIdx = storedRotors.findIndex((r) => r.name.toLowerCase() === imp.name.toLowerCase());
      if (matchIdx >= 0) {
        storedRotors[matchIdx] = {
          id: storedRotors[matchIdx].id,
          name: imp.name,
          geom: cloneGeometry(imp.geom),
        };
      } else {
        storedRotors.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: imp.name,
          geom: cloneGeometry(imp.geom),
        });
      }
    });
    saveStoredRotors(storedRotors);
    loadRotorToUI(storedRotors[0]);
    setActiveRotorId(storedRotors[0].id);
    renderRotorManagerList();
    closeModal("modal-import-conflict");
    alert(`Successfully imported ${pendingImportList.length} rotor geometries (replaced matching local rotors).`);
    pendingImportList = [];
  });

  byId("btn-import-skip").addEventListener("click", () => {
    if (!pendingImportList.length) return;
    let addedCount = 0;
    pendingImportList.forEach((imp) => {
      const exists = storedRotors.some((r) => r.name.toLowerCase() === imp.name.toLowerCase());
      if (!exists) {
        storedRotors.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: imp.name,
          geom: cloneGeometry(imp.geom),
        });
        addedCount++;
      }
    });
    saveStoredRotors(storedRotors);
    if (addedCount > 0) {
      loadRotorToUI(storedRotors[storedRotors.length - 1]);
      setActiveRotorId(storedRotors[storedRotors.length - 1].id);
    }
    renderRotorManagerList();
    closeModal("modal-import-conflict");
    alert(`Imported ${addedCount} new non-conflicting rotor(s). Conflicting local rotors were preserved.`);
    pendingImportList = [];
  });

  byId("btn-import-cancel").addEventListener("click", () => {
    pendingImportList = [];
    closeModal("modal-import-conflict");
  });
}

// Rotor Manager List with Desktop & Mobile Drag-and-Drop
function renderRotorManagerList(): void {
  const container = byId("rotor-manager-list");
  container.innerHTML = "";

  storedRotors.forEach((rotor, idx) => {
    const item = document.createElement("div");
    item.className = `rotor-manager-item ${rotor.id === currentRotor.id ? "active" : ""}`;
    item.draggable = true;
    item.dataset.rotorId = rotor.id;
    item.dataset.index = idx.toString();

    item.innerHTML = `
      <div class="rotor-drag-handle" title="Drag to reorder">⠿</div>
      <div class="rotor-manager-info">
        <div class="rotor-manager-name">${escapeHTML(rotor.name)}</div>
        <div class="rotor-manager-desc">R = ${rotor.geom.radius}m | Nb = ${rotor.geom.nBlades} | c = ${rotor.geom.chordRoot}m</div>
      </div>
      <div class="rotor-manager-actions">
        <button class="action-btn" style="height: 48px; padding: 0 8px;" data-act="rename" title="Rename rotor">EDIT</button>
        <button class="action-btn copy" style="height: 32px; padding: 0 8px;" data-act="copy">COPY</button>
        <button class="action-btn delete" style="height: 32px; padding: 0 8px;" data-act="delete" ${storedRotors.length <= 1 ? "disabled" : ""}>DEL</button>
      </div>
    `;

    // Click to select
    item.querySelector(".rotor-manager-info")?.addEventListener("click", () => {
      resolveUnsavedGeometry("switching the active rotor", () => {
        setActiveRotorId(rotor.id);
        loadRotorToUI(rotor);
        closeModal("modal-rotor-manager");
      });
    });

    item.querySelector('[data-act="rename"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const rename = () => { if(currentRotor.id !== rotor.id) { setActiveRotorId(rotor.id); loadRotorToUI(rotor); } closeModal("modal-rotor-manager"); void renameActiveRotor(); };
      if(currentRotor.id === rotor.id) rename(); else resolveUnsavedGeometry("switching rotors", rename);
    });
    item.querySelector('[data-act="copy"]')?.addEventListener("click", e => { e.stopPropagation(); void copyRotorGeometry(rotor.geom); });

    item.querySelector('[data-act="delete"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (storedRotors.length <= 1) return;
      if (confirm(`Delete rotor "${rotor.name}"?`)) {
        storedRotors = storedRotors.filter((r) => r.id !== rotor.id);
        if (currentRotor.id === rotor.id) {
          clearDraft();
          loadRotorToUI(storedRotors[0]);
          setActiveRotorId(storedRotors[0].id);
        }
        saveStoredRotors(storedRotors);
        renderRotorManagerList();
      }
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
        saveStoredRotors(storedRotors);
        renderRotorManagerList();
      }
    });

    // Touch pointer drag handle for mobile
    const handle = item.querySelector<HTMLElement>(".rotor-drag-handle");
    if (handle) {
      handle.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        const startY = e.clientY;
        const onPointerMove = (moveEvt: PointerEvent) => {
          const dy = moveEvt.clientY - startY;
          if (Math.abs(dy) > 40) {
            const shift = dy > 0 ? 1 : -1;
            const newIdx = idx + shift;
            if (newIdx >= 0 && newIdx < storedRotors.length) {
              const [moved] = storedRotors.splice(idx, 1);
              storedRotors.splice(newIdx, 0, moved);
              saveStoredRotors(storedRotors);
              renderRotorManagerList();
              window.removeEventListener("pointermove", onPointerMove);
            }
          }
        };
        const onPointerUp = () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
        };
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      });
    }

    container.appendChild(item);
  });
}

// Parameter Sweep Modal Setup
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
      localStorage.setItem("rotor_sweep_trim_mode", sweepTrimMode);
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

  btnValues.onclick = () => {
    const multi = parseInt(selectFamily.value, 10);
    const familyNames: Record<number, string> = {
      1: "Angle of Attack α [deg]",
      2: "Climb Speed Vz [m/s]",
      3: "Axial Flow Ratio μz [-]",
    };
    byId("sweep-values-hint").textContent = `Enter comma-separated values for ${familyNames[multi] || "Family"}:`;
    const cur = sweepCustomValues[multi] || [-10, -5, 0, 5, 10];
    byId<HTMLInputElement>("inp-sweep-values").value = cur.join(", ");
    openModal("modal-sweep-values");
  };

  byId("btn-sweep-values-save").onclick = () => {
    const multi = parseInt(selectFamily.value, 10);
    const raw = byId<HTMLInputElement>("inp-sweep-values").value;
    const parsed = raw.split(",").map((part) => Number(part.trim()));
    const parts = parsed;
    const limit = multi === 1 ? 89 : multi === 2 ? 200 : 0.5;
    if (raw.split(",").some((part) => !part.trim()) || parsed.some((value) => !Number.isFinite(value) || Math.abs(value) > limit || (multi === 1 && Math.abs(value) === limit)) || parts.length < 1 || parts.length > 9) {
      alert(`Enter 1–9 finite numbers within ±${limit}${multi === 1 ? " (exclusive)" : ""}.`);
      return;
    }
    parts.sort((a, b) => a - b);
    sweepCustomValues[multi] = parts;
    closeModal("modal-sweep-values");
    updateSweepPlot();
  };

  byId("btn-sweep-values-cancel").onclick = () => {
    closeModal("modal-sweep-values");
  };

  const selectXAxis = byId<HTMLSelectElement>("sweep-select-xaxis");
  if (selectXAxis) {
    selectXAxis.value = sweepXAxisMode;
  }

  const updateSweepPlot = () => {
    sweepUpdateFn = updateSweepPlot;
    syncSweepControlVisibilities();
    sweepSelectedParam = selectParam.value;
    sweepMultiMode = parseInt(selectFamily.value, 10);
    localStorage.setItem("rotor_sweep_family", String(sweepMultiMode));
    sweepXAxisMode = (byId<HTMLSelectElement>("sweep-select-xaxis").value as "mu" | "vx" | "muLam") || "mu";
    localStorage.setItem("rotor_sweep_xaxis", sweepXAxisMode);
    sweepMaxMu = parseFloat(byId<HTMLSelectElement>("sweep-select-maxmu").value) || 0.4;

    const { curves, currentOpPoint } = runParameterSweep(
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

    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
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
        if (id === "sweep-select-family" && sweepMultiMode >= 1 && sweepMultiMode <= 3) options.push({ id: "values", label: "Edit Family Values…", desc: "Comma-separated list for the selected family" });
        const title = select.closest(".sweep-control-group")!.querySelector("label")!.textContent || "Sweep";
        showOptionPicker(title, options, select.value, value => {
          if (value === "values") { byId("btn-sweep-values").click(); return; }
          select.value = value;
          select.dispatchEvent(new Event("change"));
        });
      };
    }
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

    // Active operating point card
    const curValEl = byId("sweep-current-val");
    if (curValEl) {
      if (activeResults.solutionValid) {
        curValEl.innerHTML = `<span>${formatSubscripts(`Active point: μ_x = ${formatSig(activeResults.operatingMu, 3)} · V_x = ${formatSig(activeResults.operatingVx, 3)} m/s · μ_z = ${formatSig(activeResults.operatingMuZ, 3)}`)}</span>`;
      } else {
        curValEl.textContent = "Active point: invalid operating point";
      }
    }

    // Readout card
    const readoutEl = byId("sweep-readout");
    if (readoutEl) {
      readoutEl.textContent = getSweepReadoutText(curves, meta, sweepXAxisMode, sweepCrossX, extraPrecision);
    }

    if (sweepTableVisible) {
      renderSweepTable(curves, meta);
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
      updateSweepPlot();
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
    if (sweepTableVisible) updateSweepPlot();
  };

  byId("btn-sweep-export-csv").onclick = () => {
    const { curves } = runParameterSweep(
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
    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
    const csv = generateSweepCSV(curves, meta, sweepXAxisMode, sweepTrimMode, extraPrecision);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotorcalculator_sweep_${sweepSelectedParam}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  byId("btn-sweep-export-png").onclick = () => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotorcalculator_sweep_${sweepSelectedParam}.png`;
    a.click();
  };

  updateSweepPlot();
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
    byId("quick-converter-result").textContent = `${quickConvert(Number.isFinite(value) ? value : 0, mode).toFixed(4)} ${to}`;
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
function initSwipeNavigation(): void {
  const area = byId("content-area");
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  area.addEventListener("touchstart", (e) => {
    if (document.querySelector(".modal-overlay.open")) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, { passive: true });

  area.addEventListener("touchend", (e) => {
    if (document.querySelector(".modal-overlay.open")) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    const dt = Date.now() - startTime;

    if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        if (currentPage === "geometry") activatePage("conditions", "left");
        else if (currentPage === "conditions") activatePage("results", "left");
      } else {
        if (currentPage === "results") activatePage("conditions", "right");
        else if (currentPage === "conditions") activatePage("geometry", "right");
      }
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
    btnPrec.textContent = extraPrecision === 1 ? "+1 DECIMAL" : "STANDARD";
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
    ];
    showOptionPicker("Theme", items, currentTheme, (selectedId) => {
      currentTheme = selectedId as "dark" | "light" | "midnight";
      localStorage.setItem("rotor_theme", currentTheme);
      applyTheme();
      refreshSettingsButtons();
      if (sweepUpdateFn) sweepUpdateFn();
    });
  });

  // 2. Units Button
  byId("btn-setting-units")?.addEventListener("click", () => {
    unitSystem = unitSystem === "si" ? "imperial" : "si";
    localStorage.setItem("rotor_units", unitSystem);
    refreshSettingsButtons();
    recalculate();
  });

  // 3. Precision Button
  byId("btn-setting-precision")?.addEventListener("click", () => {
    extraPrecision = extraPrecision === 1 ? 0 : 1;
    localStorage.setItem("rotor_extra_precision", extraPrecision.toString());
    refreshSettingsButtons();
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
      localStorage.setItem("rotor_plot_palette", plotPaletteIndex.toString());
      refreshSettingsButtons();
      if (sweepUpdateFn) sweepUpdateFn();
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
    downloadGeometriesBackup();
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
  const selectors: Record<string, string> = { airfoil: "btn-select-airfoil", tipModel: "btn-tiploss-mode", comp: "btn-compressibility", trim: "btn-trim-mode", inflow: "btn-inflow-model" };
  Object.entries(selectors).forEach(([key, id]) => document.querySelector(`.row-label-btn[data-key="${key}"]`)?.addEventListener("click", () => byId(id).click()));
  document.querySelectorAll<HTMLButtonElement>(".row-label-btn[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;
    if (["mu", "Vx", "alpha", "Vz", "muz", "airfoil", "tipModel", "comp", "trim", "inflow"].includes(key)) return;
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
        alert("To install RotorCalculator on iOS:\n1. Tap the Share button in Safari (box with arrow)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to install.");
      } else {
        alert("To install RotorCalculator as a standalone App:\nOpen your browser menu (⋮) and select 'Install app' or 'Add to Home screen'.");
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
  document.addEventListener("focusout", () => queueMicrotask(refreshInputPresentation));
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
