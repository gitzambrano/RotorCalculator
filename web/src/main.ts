import "./style.css";
import iconUrl from "./assets/icon.png";
import {
  calculate,
  cloneCondition,
  cloneGeometry,
  createDefaultCondition,
  createDefaultGeometry,
  referenceAspectRatio,
  referenceBladeArea,
  resolveSolidity,
  scaleChordsToAspectRatio,
  scaleChordsToSigmaRef,
  scaleRadiusPreserveReference,
  type FlightCondition,
  type RotorGeometry,
  type RotorResults,
} from "./engine";
import {
  getActiveRotorId,
  getFactoryPresets,
  importRotorsJSON,
  loadStoredRotors,
  resetToFactoryPresets,
  saveStoredRotors,
  setActiveRotorId,
  type StoredRotor,
} from "./storage";
import {
  convertValue,
  formatResultValue,
  UNIT_CHOICES,
  UNIT_TABLE,
} from "./units";
import {
  drawSweepCanvas,
  generateSweepCSV,
  runParameterSweep,
  SWEEP_PARAMS,
} from "./sweep";

// Option Selector Interface
interface OptionItem {
  id: string;
  label: string;
  desc?: string;
}

// State Management
let storedRotors: StoredRotor[] = loadStoredRotors();
let activeRotorId: string = getActiveRotorId();
let currentRotor: StoredRotor =
  storedRotors.find((r) => r.id === activeRotorId) || storedRotors[0] || getFactoryPresets()[0];
let activeGeom: RotorGeometry = cloneGeometry(currentRotor.geom);
let activeCond: FlightCondition = createDefaultCondition();
let activeResults: RotorResults = calculate(activeGeom, activeCond);

let currentPage: "geometry" | "conditions" | "results" = "geometry";
let currentTheme: "dark" | "light" = (localStorage.getItem("rotor_theme") as "dark" | "light") || "dark";
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
let sweepMultiMode = 0;
let sweepXAxisMode: "mu" | "vx" = "mu";
let sweepMaxMu = 0.4;
let sweepTableVisible = false;
let sweepHoverTrim = false;
const sweepCustomValues: Record<number, number[]> = {
  1: [-10, -5, 0, 5, 10],
  2: [-10, -5, 0, 5, 10],
  3: [-0.05, -0.025, 0, 0.025, 0.05],
};

// Flags & Dialog State
let isInternalSync = false;
let isGeometryDirty = false;
let pendingUnsavedAction: (() => void) | null = null;
let pendingImportList: StoredRotor[] = [];

// Initialize Root App DOM
const app = document.getElementById("app");
if (!app) throw new Error("Missing #app root container");

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div class="brand-row">
        <div class="brand-left">
          <img class="brand-icon" src="${iconUrl}" alt="RotorCalculator Icon" />
          <div class="brand-title">
            RotorCalculator
            <span class="version-badge">v1.22</span>
          </div>
        </div>
        <div class="header-actions">
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
    <div class="popup-menu" id="main-popup-menu" hidden>
      <button type="button" class="popup-menu-item" data-action="settings">⚙️&nbsp;&nbsp;Settings</button>
      <button type="button" class="popup-menu-item" data-action="units">⇄&nbsp;&nbsp;Quick Unit Converter</button>
      <button type="button" class="popup-menu-item" data-action="help">📖&nbsp;&nbsp;Physics &amp; Equations</button>
      <div class="popup-menu-divider"></div>
      <button type="button" class="popup-menu-item" data-action="restore">↺&nbsp;&nbsp;Restore Factory Presets</button>
      <button type="button" class="popup-menu-item" data-action="export">⤓&nbsp;&nbsp;Export Rotor Geometries</button>
      <button type="button" class="popup-menu-item" data-action="import">⤒&nbsp;&nbsp;Import Rotor Geometries</button>
      <div class="popup-menu-divider"></div>
      <a class="popup-menu-item" href="mailto:flightdyn@gmail.com?subject=RotorCalculator%20Feedback" id="feedback-link">✉&nbsp;&nbsp;Send Feedback</a>
      <button type="button" class="popup-menu-item" data-action="about">ℹ&nbsp;&nbsp;About RotorCalculator</button>
      <button type="button" class="popup-menu-item" data-action="privacy">🔒&nbsp;&nbsp;Privacy Policy</button>
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

        <div class="rotor-actions-row">
          <button class="action-btn save" id="btn-geom-save">SAVE</button>
          <button class="action-btn copy" id="btn-geom-copy">COPY</button>
          <button class="action-btn delete" id="btn-geom-delete">DELETE</button>
        </div>

        <div class="section-header">Blade Geometry</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Descriptive name of this rotor geometry.">Rotor Name</button>
          <input class="row-input" type="text" id="inp-rotor-name" value="" />
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Rotor radius measured from shaft axis to blade tip.">Radius R</button>
          <input class="row-input" type="number" step="0.01" id="inp-radius" value="8.18" />
          <button class="row-unit-btn" id="unit-radius">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Total number of main rotor blades.">Blade Count</button>
          <input class="row-input" type="number" step="1" id="inp-nblades" value="4" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Non-dimensional radial station r0/R where the active lifting blade starts.">Root Cutout</button>
          <input class="row-input" type="number" step="0.01" id="inp-cutout" value="0.15" />
          <button class="row-unit-btn" disabled>r/R</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Blade chord extrapolated to the rotational shaft center.">Root Chord c0</button>
          <input class="row-input" type="number" step="0.001" id="inp-chord-root" value="0.53" />
          <button class="row-unit-btn" id="unit-chord-root">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Blade chord at physical tip station r/R = 1.0.">Tip Chord c1</button>
          <input class="row-input" type="number" step="0.001" id="inp-chord-tip" value="0.53" />
          <button class="row-unit-btn" id="unit-chord-tip">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Reference blade solidity Nb*c_mean / (pi*R). Editing scales chords to match.">Ref. Solidity</button>
          <input class="row-input" type="number" step="0.0001" id="inp-sigma-ref" value="0.0825" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Blade aspect ratio R / c_mean. Editing scales chords to match.">Aspect Ratio</button>
          <input class="row-input" type="number" step="0.1" id="inp-aspect-ratio" value="15.4" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Aerodynamic incidence angle at cutout station r0.">Root Pitch</button>
          <input class="row-input" type="number" step="0.1" id="inp-theta-root" value="14.0" />
          <button class="row-unit-btn" id="unit-theta-root">deg</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Aerodynamic incidence angle at blade tip station r=R.">Tip Pitch</button>
          <input class="row-input" type="number" step="0.1" id="inp-theta-tip" value="-4.0" />
          <button class="row-unit-btn" id="unit-theta-tip">deg</button>
        </div>

        <div class="section-header">Derived Geometry</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Geometric physical solidity: active lifting blade area divided by disk area.">Geom. Solidity</button>
          <div class="row-derived-val" id="drv-sigma-geom">0.0701</div>
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Thrust-weighted solidity according to Wayne Johnson BET formulation.">Thrust Solidity</button>
          <div class="row-derived-val" id="drv-sigma-thrust">0.0754</div>
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Ratio of tip chord c1 to root chord c0.">Taper Ratio</button>
          <div class="row-derived-val" id="drv-taper">1.000</div>
          <button class="row-unit-btn" disabled>c1/c0</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Total rotor disk swept area A = pi * R^2.">Disk Area</button>
          <div class="row-derived-val" id="drv-disk-area">210.2</div>
          <button class="row-unit-btn" id="unit-disk-area">m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Active lifting planform area of all blades combined.">Active Blade Area</button>
          <div class="row-derived-val" id="drv-blade-area">14.74</div>
          <button class="row-unit-btn" id="unit-blade-area">m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Total built-in geometric twist (tip pitch minus root pitch).">Total Twist</button>
          <div class="row-derived-val" id="drv-twist">-18.0°</div>
          <button class="row-unit-btn" disabled>deg</button>
        </div>

        <div class="section-header">Rotor Aerodynamics</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Select aerodynamic airfoil polar section.">Airfoil</button>
          <button class="action-btn" id="btn-select-airfoil" style="height: 44px;">SC1095</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="2D lift curve slope a0 (typically 5.7 to 6.0 rad^-1).">Lift Slope a0</button>
          <input class="row-input" type="number" step="0.01" id="inp-lift-slope" value="5.73" />
          <button class="row-unit-btn" id="unit-lift-slope">rad⁻¹</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="2D zero-lift profile drag coefficient cd0.">Profile cd0</button>
          <input class="row-input" type="number" step="0.0001" id="inp-cd0" value="0.0088" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Tip-loss model (none, fixed factor B, or Sissingh momentum coupling).">Tip Loss</button>
          <button class="action-btn" id="btn-tiploss-mode" style="height: 44px;">Sissingh</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Fixed tip loss factor B (active when tip loss is set to Fixed).">Tip Factor B</button>
          <input class="row-input" type="number" step="0.005" id="inp-tiploss-b" value="0.97" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Prandtl-Glauert subsonic compressibility correction on blade lift slope.">Compressibility</button>
          <button class="action-btn" id="btn-compressibility" style="height: 44px; color: var(--accent-green);">ON (PG)</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
      </section>

      <!-- PAGE 1: CONDITIONS -->
      <section class="page" id="page-conditions">
        <div class="section-header">Atmosphere & Flow</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Flight geometric/pressure altitude in ISA atmosphere.">Altitude</button>
          <input class="row-input" type="number" step="50" id="inp-altitude" value="0" />
          <button class="row-unit-btn" id="unit-altitude">m</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Outside ambient air temperature.">Temperature</button>
          <input class="row-input" type="number" step="1" id="inp-temperature" value="15" />
          <button class="row-unit-btn" id="unit-temperature">°C</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="btn-toggle-horiz-mode" title="Click to choose between advance ratio mu and forward airspeed Vx">μx ▾</button>
          <input class="row-input" type="number" step="0.01" id="inp-horiz-val" value="0.00" />
          <button class="row-unit-btn" id="unit-horiz-val">[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="btn-toggle-axial-mode" title="Click to choose between inflow angle alpha, climb speed Vz, and axial ratio muz">α ▾</button>
          <input class="row-input" type="number" step="0.5" id="inp-axial-val" value="0.0" />
          <button class="row-unit-btn" id="unit-axial-val">deg</button>
        </div>

        <div class="section-header">Operating Constraints</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Trim mode solver constraint: prescribe any two from RPM, Collective, CT, and Thrust.">Trim Mode</button>
          <button class="action-btn" id="btn-trim-mode" style="height: 44px;">RPM + Target CT</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row" id="row-operating-1">
          <button class="row-label-btn" id="lbl-operating-1">RPM</button>
          <input class="row-input" type="number" step="1" id="inp-operating-1" value="258" />
          <button class="row-unit-btn" id="unit-operating-1">rpm</button>
        </div>
        <div class="engineering-row" id="row-operating-2">
          <button class="row-label-btn" id="lbl-operating-2">Target CT</button>
          <input class="row-input" type="number" step="0.0005" id="inp-operating-2" value="0.0065" />
          <button class="row-unit-btn" id="unit-operating-2">[-]</button>
        </div>

        <div class="section-header">Aerodynamic Model</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Inflow model formulation (Uniform, Coleman Simple, Coleman-Feingold, or Drees).">Inflow Model</button>
          <button class="action-btn" id="btn-inflow-model" style="height: 44px;">Coleman-Feingold</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Empirical induced power factor k_ind used in energy balance (default 1.15).">Induced Factor kind</button>
          <input class="row-input" type="number" step="0.01" id="inp-kind" value="1.15" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Vectorial 2D Gauss-Legendre quadrature along radial blade stations and azimuth.">Profile Drag</button>
          <div class="row-derived-val" style="color: var(--accent); font-size: 14px;">Numerical Vectorial</div>
          <button class="row-unit-btn" disabled>—</button>
        </div>
      </section>

      <!-- PAGE 2: RESULTS -->
      <section class="page" id="page-results">
        <div class="results-header-actions">
          <button class="btn-open-sweep" id="btn-open-sweep">
            <span>📈</span> OPEN PARAMETER SWEEP
          </button>
          <div class="status-badges">
            <div class="status-pill" id="badge-model-status">
              <span>MODEL STATUS</span>
              <strong id="txt-model-status">CONVERGED</strong>
            </div>
            <div class="status-pill" id="badge-solution-summary">
              <span>OPERATING SOLUTION</span>
              <strong id="txt-solution-summary">θ0 = 12.3° | RPM = 258</strong>
            </div>
          </div>
        </div>

        <div class="section-header">Dimensional Performance</div>
        <div class="result-row" data-param="ThrustN"><div class="result-label">T — Thrust</div><div class="result-val" id="res-thrust">---</div><div class="result-unit" id="unit-res-thrust">N</div></div>
        <div class="result-row" data-param="PowerKW"><div class="result-label">Pshaft — Shaft Power</div><div class="result-val" id="res-power">---</div><div class="result-unit" id="unit-res-power">kW</div></div>
        <div class="result-row" data-param="TorqueNm"><div class="result-label">Q — Shaft Torque</div><div class="result-val" id="res-torque">---</div><div class="result-unit" id="unit-res-torque">N·m</div></div>
        <div class="result-row" data-param="DragHN"><div class="result-label">H — In-Plane Force</div><div class="result-val" id="res-drag-h">---</div><div class="result-unit" id="unit-res-drag-h">N</div></div>
        <div class="result-row" data-param="CY"><div class="result-label">Y — Side Force</div><div class="result-val" id="res-side-y">---</div><div class="result-unit" id="unit-res-side-y">N</div></div>
        <div class="result-row" data-param="CMx"><div class="result-label">Mx — Roll Moment</div><div class="result-val" id="res-roll-mx">---</div><div class="result-unit" id="unit-res-roll-mx">N·m</div></div>
        <div class="result-row" data-param="CMy"><div class="result-label">My — Pitch Moment</div><div class="result-val" id="res-pitch-my">---</div><div class="result-unit" id="unit-res-pitch-my">N·m</div></div>

        <div class="section-header">Aerodynamic Coefficients</div>
        <div class="result-row" data-param="CT"><div class="result-label">CT — Thrust Coeff</div><div class="result-val" id="res-ct">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CP"><div class="result-label">CQ — Torque Coeff</div><div class="result-val" id="res-cq">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CQi"><div class="result-label">CQ,i — Induced Coeff</div><div class="result-val" id="res-cqi">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CQ0"><div class="result-label">CQ,0 — Profile Coeff</div><div class="result-val" id="res-cq0">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CH"><div class="result-label">CH — In-Plane Coeff</div><div class="result-val" id="res-ch">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CHi"><div class="result-label">CH,i — Induced H</div><div class="result-val" id="res-chi">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CH0"><div class="result-label">CH,0 — Profile H</div><div class="result-val" id="res-ch0">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CY"><div class="result-label">CY — Side Force Coeff</div><div class="result-val" id="res-cy">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CMx"><div class="result-label">CMx — Roll Moment Coeff</div><div class="result-val" id="res-cmx">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CMy"><div class="result-label">CMy — Pitch Moment Coeff</div><div class="result-val" id="res-cmy">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="CPair"><div class="result-label">CP,air — Air Power Coeff</div><div class="result-val" id="res-cpair">---</div><div class="result-unit">[-]</div></div>

        <div class="section-header">Efficiency</div>
        <div class="result-row" data-param="FoM"><div class="result-label">FM — Figure of Merit</div><div class="result-val" id="res-fom">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="L_D_eff"><div class="result-label">(L/D)eff — Effective L/D</div><div class="result-val" id="res-ld-eff">---</div><div class="result-unit">[-]</div></div>

        <div class="section-header">Inflow & Wake</div>
        <div class="result-row" data-param="lambda"><div class="result-label">λ — Total Inflow</div><div class="result-val" id="res-lambda">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="lambda_i"><div class="result-label">λi — Induced Inflow</div><div class="result-val" id="res-lambdai">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="Kx"><div class="result-label">Kx — Longitudinal Inflow</div><div class="result-val" id="res-kx">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="Ky"><div class="result-label">Ky — Lateral Inflow</div><div class="result-val" id="res-ky">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row" data-param="chi"><div class="result-label">χ — Wake Skew Angle</div><div class="result-val" id="res-chi">---</div><div class="result-unit">deg</div></div>
        <div class="result-row" data-param="B"><div class="result-label">B — Tip-Loss Factor</div><div class="result-val" id="res-bfactor">---</div><div class="result-unit">[-]</div></div>

        <div class="section-header">Operating State & Atmosphere</div>
        <div class="result-row"><div class="result-label">RPM — Solved Speed</div><div class="result-val" id="res-rpm">---</div><div class="result-unit">rpm</div></div>
        <div class="result-row"><div class="result-label">θ0 — Solved Collective</div><div class="result-val" id="res-coll">---</div><div class="result-unit">deg</div></div>
        <div class="result-row"><div class="result-label">μx — Advance Ratio</div><div class="result-val" id="res-op-mu">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row"><div class="result-label">Vx — Airspeed</div><div class="result-val" id="res-op-vx">---</div><div class="result-unit" id="unit-res-vx">m/s</div></div>
        <div class="result-row"><div class="result-label">μz — Axial Ratio</div><div class="result-val" id="res-op-muz">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row"><div class="result-label">Vz — Climb Speed</div><div class="result-val" id="res-op-vz">---</div><div class="result-unit" id="unit-res-vz">m/s</div></div>
        <div class="result-row"><div class="result-label">α — Angle of Attack</div><div class="result-val" id="res-op-alpha">---</div><div class="result-unit">deg</div></div>
        <div class="result-row"><div class="result-label">ΩR — Tip Speed</div><div class="result-val" id="res-op-vtip">---</div><div class="result-unit" id="unit-res-vtip">m/s</div></div>
        <div class="result-row"><div class="result-label">Mtip — Tip Mach</div><div class="result-val" id="res-op-mtip">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row"><div class="result-label">Madv — Advancing Mach</div><div class="result-val" id="res-op-madv">---</div><div class="result-unit">[-]</div></div>
        <div class="result-row"><div class="result-label">h — Altitude</div><div class="result-val" id="res-op-alt">---</div><div class="result-unit" id="unit-res-alt">m</div></div>
        <div class="result-row"><div class="result-label">Tamb — Temperature</div><div class="result-val" id="res-op-temp">---</div><div class="result-unit">°C</div></div>
        <div class="result-row"><div class="result-label">ρ — Air Density</div><div class="result-val" id="res-op-rho">---</div><div class="result-unit">kg/m³</div></div>
        <div class="result-row"><div class="result-label">p — Ambient Pressure</div><div class="result-val" id="res-op-pres">---</div><div class="result-unit" id="unit-res-pres">hPa</div></div>
        <div class="result-row"><div class="result-label">a — Speed of Sound</div><div class="result-val" id="res-op-sound">---</div><div class="result-unit" id="unit-res-sound">m/s</div></div>
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
          <input type="file" id="file-import-input" accept=".json,application/json,text/plain" style="display: none;" />
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
                  <option value="4">Inflow Models Family</option>
                </select>
                <button class="action-btn" id="btn-sweep-values" style="display: none; flex-shrink: 0; height: 38px; padding: 0 10px; font-size: 11.5px; font-weight: 700; color: var(--accent);">VALUES</button>
              </div>
            </div>
            <div class="sweep-control-group">
              <label>X-Axis Scale</label>
              <select class="sweep-select" id="sweep-select-xaxis">
                <option value="mu">Advance Ratio μx [-]</option>
                <option value="vx">Airspeed Vx [m/s]</option>
              </select>
            </div>
            <div class="sweep-control-group">
              <label>Max μx Limit</label>
              <select class="sweep-select" id="sweep-select-maxmu">
                <option value="0.2">0.20 (Low Speed)</option>
                <option value="0.3">0.30 (Cruise)</option>
                <option value="0.4" selected>0.40 (High Speed)</option>
                <option value="0.5">0.50 (Extreme)</option>
              </select>
            </div>
            <div class="sweep-control-group" id="sweep-group-trim-hover" style="display: none;">
              <label>Hover Trim Strategy</label>
              <button class="action-btn" id="btn-sweep-trim-hover" style="height: 38px; font-size: 12px; font-weight: 700;">HOVER TRIM: OFF</button>
            </div>
          </div>

          <div class="sweep-canvas-wrapper">
            <canvas class="sweep-canvas" id="sweep-canvas"></canvas>
          </div>

          <div id="sweep-table-container" style="display: none; max-height: 200px; overflow: auto; margin-bottom: 12px; font-size: 12px; border: 1px solid var(--border); border-radius: 6px;"></div>

          <div class="sweep-footer-actions">
            <button class="action-btn" id="btn-sweep-toggle-table" style="height: 38px;">SHOW TABLE</button>
            <button class="action-btn" id="btn-sweep-export-csv" style="height: 38px;">EXPORT CSV</button>
            <button class="action-btn" id="btn-sweep-export-png" style="height: 38px;">EXPORT PNG</button>
          </div>
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

    <!-- MODAL: RESULT TOOLTIP -->
    <div class="modal-overlay" id="modal-result-tooltip">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <div class="modal-title" id="result-tooltip-title">About • Result</div>
          <button class="modal-close-btn" data-close="modal-result-tooltip">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <div id="result-tooltip-desc" style="font-size: 14px; line-height: 1.6; color: var(--text-main); margin-bottom: 20px;"></div>
          <button class="action-btn" id="btn-result-tooltip-open-help" style="width: 100%; height: 42px; font-weight: 700; color: var(--accent);">OPEN FULL PHYSICS & EQUATIONS GUIDE</button>
        </div>
      </div>
    </div>

    <!-- MODAL: UNIT CONVERTER -->
    <div class="modal-overlay" id="modal-unit-converter">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">ENGINEERING UNIT CONVERTER</div>
          <button class="modal-close-btn" data-close="modal-unit-converter">×</button>
        </div>
        <div class="modal-body">
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
        </div>
      </div>
    </div>

    <!-- MODAL: SETTINGS -->
    <div class="modal-overlay" id="modal-settings">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">SETTINGS</div>
          <button class="modal-close-btn" data-close="modal-settings">×</button>
        </div>
        <div class="modal-body">
          <div class="settings-form-grid">
            <div class="settings-section-title">Interface Options</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Theme</div>
                <div class="settings-row-sub">Dark Stealth Cockpit or Light Technical</div>
              </div>
              <select class="settings-select" id="setting-theme">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div class="settings-section-title">Output Units and Format</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Result Units System</div>
                <div class="settings-row-sub">Dimensional outputs display</div>
              </div>
              <select class="settings-select" id="setting-units-system">
                <option value="si">SI (Metric)</option>
                <option value="imperial">Imperial</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Output Format</div>
                <div class="settings-row-sub">Decimal precision for results</div>
              </div>
              <select class="settings-select" id="setting-precision">
                <option value="0">Standard</option>
                <option value="1">+1 Extra Decimal</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Angle Interval</div>
                <div class="settings-row-sub">Range representation for angles</div>
              </div>
              <select class="settings-select" id="setting-angle-format">
                <option value="0/360">0° to 360°</option>
                <option value="-180/180">-180° to +180°</option>
              </select>
            </div>

            <div class="settings-section-title">Preferred Dimensional Units</div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Thrust Unit</div>
              </div>
              <select class="settings-select" id="setting-thrust-unit">
                <option value="N">N</option>
                <option value="lbf">lbf</option>
                <option value="kgf">kgf</option>
                <option value="kN">kN</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Power Unit</div>
              </div>
              <select class="settings-select" id="setting-power-unit">
                <option value="kW">kW</option>
                <option value="hp">hp</option>
                <option value="W">W</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Torque Unit</div>
              </div>
              <select class="settings-select" id="setting-torque-unit">
                <option value="N·m">N·m</option>
                <option value="lb·ft">lb·ft</option>
                <option value="kgf·m">kgf·m</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Speed Unit</div>
              </div>
              <select class="settings-select" id="setting-speed-unit">
                <option value="m/s">m/s</option>
                <option value="kt">kt</option>
                <option value="km/h">km/h</option>
                <option value="mph">mph</option>
                <option value="ft/s">ft/s</option>
              </select>
            </div>
            <div class="settings-row">
              <div class="settings-row-info">
                <div class="settings-row-label">Pressure Unit</div>
              </div>
              <select class="settings-select" id="setting-pressure-unit">
                <option value="hPa">hPa</option>
                <option value="Pa">Pa</option>
                <option value="mbar">mbar</option>
                <option value="psi">psi</option>
                <option value="atm">atm</option>
                <option value="mmHg">mmHg</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 18px;">
              <button class="action-btn" id="btn-settings-reset" style="flex: 1; height: 44px; color: var(--accent-amber);">RESTORE DEFAULTS</button>
              <button class="action-btn" id="btn-settings-save" style="flex: 1; height: 44px; color: var(--accent-green);">SAVE SETTINGS</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: HELP -->
    <div class="modal-overlay" id="modal-help">
      <div class="modal-card" style="width: min(100%, 780px);">
        <div class="modal-header">
          <div class="modal-title">PHYSICS &amp; EQUATIONS REFERENCE</div>
          <button class="modal-close-btn" data-close="modal-help">×</button>
        </div>
        <div class="modal-body">
          <div class="help-content">
            <p class="lead" style="color: var(--text-muted); margin-bottom: 16px;">
              Offline aerodynamic and numerical reference for the Blade Element Theory (zBET) solver implemented in RotorCalculator.
            </p>

            <h2>1. Coordinate &amp; Sign Conventions</h2>
            <table class="help-table">
              <thead><tr><th>Quantity</th><th>Positive Meaning</th></tr></thead>
              <tbody>
                <tr><td><b>+x, Vx</b></td><td>Forward, in the rotor hub reference plane.</td></tr>
                <tr><td><b>+y</b></td><td>Starboard / right side of rotorcraft.</td></tr>
                <tr><td><b>+z</b></td><td>Downward through the rotor disk.</td></tr>
                <tr><td><b>Vz &gt; 0</b></td><td>Climb rate: relative wind arrives from above and flows downward.</td></tr>
                <tr><td><b>μz &gt; 0</b></td><td>Downward relative-flow ratio along +z.</td></tr>
                <tr><td><b>α &gt; 0</b></td><td>Angle of attack: relative wind arrives from below the disk.</td></tr>
                <tr><td><b>T &gt; 0</b></td><td>Upward rotor thrust, opposing +z.</td></tr>
                <tr><td><b>λi ≥ 0</b></td><td>Induced downwash velocity ratio in +z direction.</td></tr>
              </tbody>
            </table>
            <div class="eq">μ = Vx / (ΩR)</div>
            <div class="eq">μz = Vz / (ΩR) = −μ tan(α)</div>
            <div class="eq">λ = μz + λi</div>
            <div class="note"><b>Equivalent Inputs:</b> α, Vz, and μz describe the same axial flow state. They are alternative representations, not additive terms.</div>

            <h2>2. Reference Blade Geometry</h2>
            <p>Geometry uses a reference linear planform from the rotor axis to the tip. Root cutout defines where the active lifting blade begins without altering the reference chord law.</p>
            <div class="eq">c(x) = c0 + (c1 − c0)x, &nbsp; 0 ≤ x ≤ 1</div>
            <div class="eq">Sref,b = R (c0 + c1) / 2</div>
            <div class="eq">AR = R² / Sref,b = 2R / (c0 + c1)</div>
            <div class="eq">σref = Nb Sref,b / (πR²) = Nb / (π AR)</div>
            <div class="eq">σgeom = (Nb / πR) ∫[x0..1] c(x) dx</div>
            <div class="eq">σthrust = 3 ∫[x0..1] x² σ(x) dx</div>
            <p>Editing Radius scales c0 and c1 proportionally, preserving σref, AR, and taper. Editing σref or AR scales both chords accordingly.</p>

            <h2>3. Collective &amp; Operating Constraints (6 Trim Modes)</h2>
            <p>Operating collective is a uniform pitch increment applied along the blade:</p>
            <div class="eq">θroot,op = θroot + Δθ &nbsp;&nbsp;&nbsp; θtip,op = θtip + Δθ</div>
            <table class="help-table">
              <thead><tr><th>Prescribed Operating Pair</th><th>Solved Quantities</th></tr></thead>
              <tbody>
                <tr><td><b>RPM + Target CT</b></td><td>Collective Δθ and Thrust</td></tr>
                <tr><td><b>RPM + Target Thrust</b></td><td>Collective Δθ and CT</td></tr>
                <tr><td><b>RPM + Collective Δθ</b></td><td>Direct evaluation of CT and Thrust</td></tr>
                <tr><td><b>Collective Δθ + Target CT</b></td><td>RPM and Thrust (when uniquely determined)</td></tr>
                <tr><td><b>Collective Δθ + Target Thrust</b></td><td>RPM and CT</td></tr>
                <tr><td><b>Target CT + Target Thrust</b></td><td>RPM and Collective Δθ</td></tr>
              </tbody>
            </table>

            <h2>4. Mean Inflow &amp; Momentum Closure</h2>
            <div class="eq">CT,momentum = 2 B² λi √(μ² + λ²)</div>
            <div class="eq">CT,BET = CT,BET(μ, λ, pitch, geometry, inflow gradients)</div>
            <p>zBET solves λi ≥ 0 iteratively such that blade-element thrust and momentum theory are mutually consistent.</p>

            <h2>5. Inflow Gradient Models</h2>
            <table class="help-table">
              <thead><tr><th>Model</th><th>Formulation &amp; Harmonic Gradients</th></tr></thead>
              <tbody>
                <tr><td><b>Uniform</b></td><td>Benchmark without first-harmonic gradients (Kx = 0, Ky = 0).</td></tr>
                <tr><td><b>Coleman Simple</b></td><td>Longitudinal gradient based on wake skew χ: Kx = tan(χ/2).</td></tr>
                <tr><td><b>Coleman-Feingold</b></td><td>Longitudinal and lateral gradients with empirical factors.</td></tr>
                <tr><td><b>Drees</b></td><td>Classical formulation: Kx = (4/3) [1 - cos(χ) - 1.8 μ²] / sin(χ), Ky = -2 μ.</td></tr>
              </tbody>
            </table>
            <div class="eq">λd(x,ψ) = λ + x [λ1c cos(ψ) + λ1s sin(ψ)]</div>

            <h2>6. Profile Drag, Tip Loss &amp; Compressibility</h2>
            <h3>Profile Drag</h3>
            <p>RotorCalculator evaluates profile drag using high-precision <b>Numerical Vectorial</b> 24-point Gauss-Legendre quadrature in both radial and azimuthal directions.</p>
            <h3>Tip Loss</h3>
            <p>Available models: <b>None</b> (B=1.0), <b>Fixed B</b>, and <b>Sissingh</b> thrust-coupled:</p>
            <div class="eq">B(Sissingh) = 1 − √(2 CT) / Nb</div>
            <h3>Prandtl-Glauert Compressibility</h3>
            <div class="eq">Meff = (ΩR / asound) √(0.75² + 0.5 μ²)</div>
            <div class="eq">a(Meff) = a0 / √max(0.01, 1 − Meff²), &nbsp; Meff ≤ 0.85</div>

            <h2>7. Torque, Power &amp; Induced Factor (kind)</h2>
            <div class="eq">CQ = CQ,i + CQ,0</div>
            <div class="eq">Pshaft = Q Ω</div>
            <div class="eq">CQ,i = kind λi CT + μz CT − μ CH,i</div>
            <div class="eq">CP,air = kind λi CT + μz CT + CQ,0 + μ CH,0 = CQ + μ CH</div>
            <p><b>kind</b> is the empirical induced power factor entered in Conditions (default 1.15).</p>

            <h2>8. Efficiency Metrics</h2>
            <div class="eq">FoM = [CT^(3/2) / √2] / [kind CT^(3/2) / √2 + CQ,0]</div>
            <div class="eq">(L/D)eff = μ CT / CP,air</div>

            <h2>9. Parameter Sweeps</h2>
            <p>Any aerodynamic result can be plotted across advance ratio μx (or airspeed Vx). Supported multi-curve families include α, Vz, μz, and Inflow Models. Hover trim locking is available.</p>

            <h2>10. Summary of Aerodynamic Coefficients</h2>
            <table class="help-table">
              <thead><tr><th>Coefficient</th><th>Definition &amp; Normalization</th></tr></thead>
              <tbody>
                <tr><td><b>CT</b></td><td>T / [ρ A (ΩR)²]</td></tr>
                <tr><td><b>CQ, CPshaft</b></td><td>Q / [ρ A (ΩR)² R] = Pshaft / [ρ A (ΩR)³]</td></tr>
                <tr><td><b>CQ,i, CQ,0</b></td><td>Induced and profile torque coefficients</td></tr>
                <tr><td><b>CH, CH,i, CH,0</b></td><td>Total, induced, and profile longitudinal in-plane force coefficients</td></tr>
                <tr><td><b>CY</b></td><td>Lateral side force coefficient</td></tr>
                <tr><td><b>CMx, CMy</b></td><td>Hub roll and pitch moment coefficients</td></tr>
                <tr><td><b>CP,air</b></td><td>Air power coefficient CQ + μ CH</td></tr>
              </tbody>
            </table>

            <h2>11. Scope &amp; Applicable Regimes</h2>
            <ul>
              <li>Linear lift slope and baseline zero-lift drag coefficient cd0.</li>
              <li>Numerical integration over 0 ≤ r/R ≤ B and 0 ≤ ψ ≤ 2π.</li>
              <li>Ideal for conceptual design, eVTOL sizing, helicopter performance analysis, and educational simulation.</li>
            </ul>
          </div>
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
          <p style="font-size: 14px; margin-bottom: 6px;">Version 1.22 (Web &amp; PWA Edition)</p>
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

    <div class="tooltip-popover" id="tooltip-popover"></div>
  </main>
`;

// Helper Element Selectors
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function applyTheme(): void {
  document.documentElement.dataset.theme = currentTheme;
}

function updateTabIndicator(): void {
  const ind = byId("tab-indicator");
  if (!ind) return;
  const idx = currentPage === "geometry" ? 0 : currentPage === "conditions" ? 1 : 2;
  ind.style.transform = `translateX(${idx * 100}%)`;
}

function activatePage(page: "geometry" | "conditions" | "results", swipeDir?: "left" | "right"): void {
  currentPage = page;
  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  document.querySelectorAll<HTMLElement>(".page").forEach((p) => {
    p.classList.toggle("active", p.id === `page-${page}`);
    p.classList.remove("swipe-in-left", "swipe-in-right");
  });

  const activeEl = byId(`page-${page}`);
  if (activeEl && swipeDir) {
    activeEl.classList.add(swipeDir === "left" ? "swipe-in-left" : "swipe-in-right");
    setTimeout(() => activeEl.classList.remove("swipe-in-left", "swipe-in-right"), 200);
  }
  updateTabIndicator();
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
  activeGeom = resolveSolidity(activeGeom);
  activeResults = calculate(activeGeom, activeCond);
  renderDerivedGeometry();
  renderResults();
}

function renderDerivedGeometry(): void {
  byId("drv-sigma-geom").textContent = formatResultValue(activeGeom.sigmaGeom, 4, extraPrecision);
  byId("drv-sigma-thrust").textContent = formatResultValue(activeGeom.sigmaThrust, 4, extraPrecision);
  const taper = activeGeom.chordRoot > 0 ? activeGeom.chordTip / activeGeom.chordRoot : 1;
  byId("drv-taper").textContent = formatResultValue(taper, 3, extraPrecision);

  const diskArea = Math.PI * activeGeom.radius * activeGeom.radius;
  const diskAreaUnit = byId("unit-disk-area")?.textContent?.trim() || "m²";
  const diskAreaVal = convertValue(diskArea, "m²", diskAreaUnit);
  byId("drv-disk-area").textContent = formatResultValue(diskAreaVal, 1, extraPrecision);

  const bladeArea = referenceBladeArea(activeGeom) * activeGeom.nBlades * (1.0 - activeGeom.rootCutout);
  const bladeAreaUnit = byId("unit-blade-area")?.textContent?.trim() || "m²";
  const bladeAreaVal = convertValue(bladeArea, "m²", bladeAreaUnit);
  byId("drv-blade-area").textContent = formatResultValue(bladeAreaVal, 2, extraPrecision);

  const twist = ((activeGeom.thetaTip - activeGeom.thetaRoot) * 180) / Math.PI;
  byId("drv-twist").textContent = `${formatResultValue(twist, 1, extraPrecision)}°`;
}

function renderResults(): void {
  const r = activeResults;

  // Status Badges
  const badgeModel = byId("badge-model-status");
  const txtModel = byId("txt-model-status");
  txtModel.textContent = r.solutionValid ? (r.compressibilityWarning ? "CAUTION" : "CONVERGED") : "INVALID";
  badgeModel.className = `status-pill ${r.solutionValid ? (r.compressibilityWarning ? "warning" : "") : "error"}`;

  const summary = byId("txt-solution-summary");
  summary.textContent = `θ0 = ${r.trimmedCollectiveDeg.toFixed(1)}° | RPM = ${r.trimmedRPM.toFixed(0)}`;

  // Dimensional Performance
  const thrust = convertValue(r.thrustN, "N", prefThrustUnit);
  byId("res-thrust").textContent = formatResultValue(thrust, 0, extraPrecision);
  byId("unit-res-thrust").textContent = prefThrustUnit;

  const power = convertValue(r.powerShaftKW * 1000.0, "W", prefPowerUnit);
  byId("res-power").textContent = formatResultValue(power, 1, extraPrecision);
  byId("unit-res-power").textContent = prefPowerUnit;

  const torque = convertValue(r.torqueNm, "N·m", prefTorqueUnit);
  byId("res-torque").textContent = formatResultValue(torque, 1, extraPrecision);
  byId("unit-res-torque").textContent = prefTorqueUnit;

  const dragH = convertValue(r.dragHN, "N", prefThrustUnit);
  byId("res-drag-h").textContent = formatResultValue(dragH, 1, extraPrecision);
  byId("unit-res-drag-h").textContent = prefThrustUnit;

  const sideY = convertValue(r.sideForceYN, "N", prefThrustUnit);
  byId("res-side-y").textContent = formatResultValue(sideY, 1, extraPrecision);
  byId("unit-res-side-y").textContent = prefThrustUnit;

  const rollMx = convertValue(r.rollMomentNm, "N·m", prefTorqueUnit);
  byId("res-roll-mx").textContent = formatResultValue(rollMx, 1, extraPrecision);
  byId("unit-res-roll-mx").textContent = prefTorqueUnit;

  const pitchMy = convertValue(r.pitchMomentNm, "N·m", prefTorqueUnit);
  byId("res-pitch-my").textContent = formatResultValue(pitchMy, 1, extraPrecision);
  byId("unit-res-pitch-my").textContent = prefTorqueUnit;

  // Aerodynamic Coefficients
  byId("res-ct").textContent = formatResultValue(r.CT, 5, extraPrecision);
  byId("res-cq").textContent = formatResultValue(r.CQ, 6, extraPrecision);
  byId("res-cqi").textContent = formatResultValue(r.CQi, 6, extraPrecision);
  byId("res-cq0").textContent = formatResultValue(r.CQ0, 6, extraPrecision);
  byId("res-ch").textContent = formatResultValue(r.CH, 6, extraPrecision);
  byId("res-chi").textContent = formatResultValue(r.CHi, 6, extraPrecision);
  byId("res-ch0").textContent = formatResultValue(r.CH0, 6, extraPrecision);
  byId("res-cy").textContent = formatResultValue(r.CY, 6, extraPrecision);
  byId("res-cmx").textContent = formatResultValue(r.CMx, 6, extraPrecision);
  byId("res-cmy").textContent = formatResultValue(r.CMy, 6, extraPrecision);
  byId("res-cpair").textContent = formatResultValue(r.CPair, 6, extraPrecision);

  // Efficiency & Inflow
  byId("res-fom").textContent = formatResultValue(r.FoM, 3, extraPrecision);
  byId("res-ld-eff").textContent = formatResultValue(r.L_D_eff, 2, extraPrecision);
  byId("res-lambda").textContent = formatResultValue(r.inflowLambda, 5, extraPrecision);
  byId("res-lambdai").textContent = formatResultValue(r.inflowLambdaI, 5, extraPrecision);
  byId("res-kx").textContent = formatResultValue(r.inflowKx, 4, extraPrecision);
  byId("res-ky").textContent = formatResultValue(r.inflowKy, 4, extraPrecision);
  byId("res-chi").textContent = formatResultValue(r.wakeSkewChiDeg, 2, extraPrecision);
  byId("res-bfactor").textContent = formatResultValue(r.bFactor, 4, extraPrecision);

  // Operating State
  byId("res-rpm").textContent = formatResultValue(r.trimmedRPM, 1, extraPrecision);
  byId("res-coll").textContent = formatResultValue(r.trimmedCollectiveDeg, 2, extraPrecision);
  byId("res-op-mu").textContent = formatResultValue(r.operatingMu, 4, extraPrecision);

  const vx = convertValue(r.operatingVx, "m/s", prefSpeedUnit);
  byId("res-op-vx").textContent = formatResultValue(vx, 1, extraPrecision);
  byId("unit-res-vx").textContent = prefSpeedUnit;

  byId("res-op-muz").textContent = formatResultValue(r.operatingMuZ, 4, extraPrecision);

  const vzUnit = unitSystem === "imperial" ? "ft/min" : "m/s";
  const vz = convertValue(r.operatingVz, "m/s", vzUnit);
  byId("res-op-vz").textContent = formatResultValue(vz, 2, extraPrecision);
  byId("unit-res-vz").textContent = vzUnit;

  byId("res-op-alpha").textContent = formatResultValue(r.operatingAlphaDeg, 2, extraPrecision);

  const vtipUnit = unitSystem === "imperial" ? "ft/s" : "m/s";
  const vtip = convertValue(r.tipSpeed, "m/s", vtipUnit);
  byId("res-op-vtip").textContent = formatResultValue(vtip, 1, extraPrecision);
  byId("unit-res-vtip").textContent = vtipUnit;

  byId("res-op-mtip").textContent = formatResultValue(r.tipSpeed / r.speedOfSound, 3, extraPrecision);
  byId("res-op-madv").textContent = formatResultValue(r.advancingTipMach, 3, extraPrecision);

  const altUnit = unitSystem === "imperial" ? "ft" : "m";
  const alt = convertValue(r.altitudeM, "m", altUnit);
  byId("res-op-alt").textContent = formatResultValue(alt, 0, extraPrecision);
  byId("unit-res-alt").textContent = altUnit;

  const tempUnit = unitSystem === "imperial" ? "°F" : "°C";
  const temp = convertValue(r.temperatureC, "°C", tempUnit);
  byId("res-op-temp").textContent = formatResultValue(temp, 1, extraPrecision);

  byId("res-op-rho").textContent = formatResultValue(r.densityRho, 4, extraPrecision);

  const pres = convertValue(r.pressurePa, "Pa", prefPressureUnit);
  byId("res-op-pres").textContent = formatResultValue(pres, 1, extraPrecision);
  byId("unit-res-pres").textContent = prefPressureUnit;

  const aSound = convertValue(r.speedOfSound, "m/s", vtipUnit);
  byId("res-op-sound").textContent = formatResultValue(aSound, 1, extraPrecision);
  byId("unit-res-sound").textContent = vtipUnit;
}

// Result Contextual Physics & Equation Tooltips
const RESULT_TOOLTIPS: Record<string, string> = {
  "T — Thrust": "Solved dimensional rotor thrust T = ρ A (ΩR)² CT at the current flight condition.",
  "Pshaft — Shaft Power": "Mechanical shaft power P = ΩQ = ρ A (ΩR)³ CP, required to rotate the rotor against aerodynamic torque.",
  "Q — Shaft Torque": "Aerodynamic torque about the rotor shaft: Q = ρ A (ΩR)² R CQ.",
  "H — In-Plane Force": "Dimensional longitudinal in-plane force H resisting forward motion in forward flight.",
  "Y — Side Force": "Dimensional lateral rotor side force Y arising from aerodynamic asymmetry.",
  "Mx — Roll Moment": "Dimensional rotor rolling moment Mx about the longitudinal axis.",
  "My — Pitch Moment": "Dimensional rotor pitching moment My about the lateral axis.",
  "CT — Thrust Coeff": "CT = T / [ρ A (ΩR)²]. Non-dimensional rotor thrust coefficient normalized by rotor disk area and tip speed.",
  "CQ — Torque Coeff": "CQ = Q / [ρ A (ΩR)² R]. Non-dimensional rotor shaft torque coefficient, mathematically equal to shaft-power coefficient CPshaft.",
  "CQ,i — Induced Coeff": "Induced torque/power contribution CQ,i from induced downwash velocity across the rotor disk.",
  "CQ,0 — Profile Coeff": "Profile-drag torque contribution CQ,0 integrated using the Numerical Vectorial method over radial and azimuthal elements.",
  "CH — In-Plane": "Total longitudinal in-plane force coefficient: CH = CH,i + CH,0.",
  "CH,i — Induced H": "Induced contribution to longitudinal in-plane force coefficient.",
  "CH,0 — Profile H": "Numerical Vectorial profile-drag contribution to longitudinal in-plane force coefficient.",
  "CY — Side Force": "Non-dimensional rotor lateral side-force coefficient.",
  "CMx — Roll Moment": "Non-dimensional rotor rolling-moment coefficient about the x-axis.",
  "CMy — Pitch Moment": "Non-dimensional rotor pitching-moment coefficient about the y-axis.",
  "CP,air — Air Power": "Air-power coefficient from induced, axial-flow, profile, and translational aerodynamic energy terms.",
  "FM — Figure of Merit": "Hover aerodynamic efficiency: FoM = CT^(3/2) / [√2 CPshaft]. Ratio of ideal induced power to actual required shaft power.",
  "(L/D)eff — Effective L/D": "Effective rotor lift-to-drag ratio in forward flight: (L/D)eff = μx CT / CP,air = T Vx / Pair.",
  "λ — Total Inflow": "Total inflow ratio normal to the rotor disk: λ = μz + λi.",
  "λi — Induced Inflow": "Induced downwash inflow ratio through the disk: λi = vi / (ΩR).",
  "Kx — Longitudinal Inflow": "Longitudinal first-harmonic inflow-gradient coefficient (Drees / Coleman / Pitt-Peters).",
  "Ky — Lateral Inflow": "Lateral first-harmonic inflow-gradient coefficient.",
  "χ — Wake Skew Angle": "Wake-skew angle χ = tan⁻¹(μx / λ) measuring the angle between rotor shaft and wake trajectory.",
  "B — Tip-Loss Factor": "Effective aerodynamic blade tip radius factor B used to account for 3D tip-vortex lift reduction.",
  "RPM — Solved Speed": "Operating rotational speed in revolutions per minute, solved from the prescribed operating pair.",
  "Δθ — Solved Collective": "Solved uniform collective pitch increment Δθ added equally to baseline root and tip pitch.",
  "θ0 — Solved Collective": "Solved uniform collective pitch increment Δθ added equally to baseline root and tip pitch.",
  "μx — Advance Ratio": "Non-dimensional in-plane advance ratio: μx = Vx / (ΩR).",
  "Vx — Airspeed": "Dimensional forward in-plane flight speed: Vx = μx (ΩR).",
  "μz — Axial Ratio": "Non-dimensional axial flow ratio: μz = Vz / (ΩR). Positive indicates downward relative flow.",
  "Vz — Climb Speed": "Dimensional vertical flight speed: positive Vz indicates climb (relative wind from above).",
  "α — Angle of Attack": "Rotor disk angle of attack relative to oncoming velocity vector. Positive α indicates wind from below (μz = -μx tan α).",
  "ΩR — Tip Speed": "Rotational blade tip speed: ΩR = (2π RPM / 60) R.",
  "Mtip — Tip Mach": "Rotational hover tip Mach number: Mtip = ΩR / a.",
  "Madv — Advancing Mach": "Advancing blade tip Mach number at 90° azimuth: Madv = ΩR (1 + μx) / a.",
  "h — Altitude": "Pressure altitude used by the International Standard Atmosphere (ISA) model.",
  "Tamb — Temperature": "Ambient air temperature used to compute local air density and speed of sound.",
  "ρ — Air Density": "Ambient atmospheric mass density ρ [kg/m³ or slug/ft³] from the ISA model.",
  "p — Ambient Pressure": "Ambient static atmospheric pressure p from the ISA barometric formula.",
  "a — Speed of Sound": "Local speed of sound a = √(γ R_gas T) used for Mach and compressibility corrections.",
};

function bindResultRowTooltips(): void {
  document.querySelectorAll<HTMLElement>(".result-row").forEach((row) => {
    row.addEventListener("click", () => {
      const labelEl = row.querySelector(".result-label");
      const labelText = labelEl?.textContent?.trim() || "";
      const matched = Object.entries(RESULT_TOOLTIPS).find(([key]) => {
        return labelText.startsWith(key) || key.startsWith(labelText) || labelText.includes(key);
      });
      const title = matched ? matched[0] : labelText;
      const desc = matched ? matched[1] : `Computed aerodynamic or atmospheric metric for ${labelText}.`;

      byId("result-tooltip-title").textContent = `About • ${title}`;
      byId("result-tooltip-desc").textContent = desc;
      openModal("modal-result-tooltip");
    });
  });

  byId("btn-result-tooltip-open-help")?.addEventListener("click", () => {
    closeModal("modal-result-tooltip");
    openModal("modal-physics-help");
  });
}

// Operating Controls Setup
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
    l1.textContent = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.textContent = "Collective Δθ";
    u2.textContent = "deg";
    p2.value = activeCond.collectiveDeg.toFixed(2);
  } else if (pair === "rpm_ct") {
    l1.textContent = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.textContent = "Target CT";
    u2.textContent = "[-]";
    p2.value = activeCond.targetCT.toFixed(5);
  } else if (pair === "rpm_thrust") {
    l1.textContent = "RPM";
    u1.textContent = "rpm";
    p1.value = activeCond.rpm.toFixed(0);

    l2.textContent = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  } else if (pair === "collective_ct") {
    l1.textContent = "Collective Δθ";
    u1.textContent = "deg";
    p1.value = activeCond.collectiveDeg.toFixed(2);

    l2.textContent = "Target CT";
    u2.textContent = "[-]";
    p2.value = activeCond.targetCT.toFixed(5);
  } else if (pair === "collective_thrust") {
    l1.textContent = "Collective Δθ";
    u1.textContent = "deg";
    p1.value = activeCond.collectiveDeg.toFixed(2);

    l2.textContent = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  } else if (pair === "ct_thrust") {
    l1.textContent = "Target CT";
    u1.textContent = "[-]";
    p1.value = activeCond.targetCT.toFixed(5);

    l2.textContent = "Target Thrust";
    u2.textContent = thrustUnit;
    p2.value = convertValue(activeCond.targetThrustN || 45000, "N", thrustUnit).toFixed(0);
  }
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
    bar.innerHTML = `${escapeHTML(currentRotor.name)} <span style="color: #FFB300; font-weight: bold; margin-left: 6px;">• * UNSAVED</span>`;
  } else {
    bar.textContent = currentRotor.name;
  }
}

function markGeometryDirty(): void {
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
function loadRotorToUI(rotor: StoredRotor): void {
  currentRotor = rotor;
  activeGeom = cloneGeometry(rotor.geom);
  isInternalSync = true;
  isGeometryDirty = false;
  updateActiveRotorBar();

  byId<HTMLInputElement>("inp-rotor-name").value = rotor.name;

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

  refreshOperatingControls();
  recalculate();
  isInternalSync = false;
}

// Bidirectional Input Listeners & Cross-Updating
function bindInputListeners(): void {
  // 1. Radius R Change (scales chords to preserve Aspect Ratio & Solidity)
  byId("inp-radius").addEventListener("input", () => {
    if (isInternalSync) return;
    const rUnit = byId("unit-radius")?.textContent?.trim() || "m";
    const rVal = parseFloat(byId<HTMLInputElement>("inp-radius").value);
    if (rVal > 0) {
      isInternalSync = true;
      const rSI = convertValue(rVal, rUnit, "m");
      activeGeom = scaleRadiusPreserveReference(activeGeom, rSI);

      const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
      const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
      byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);
      byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);
      byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
      byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);

      markGeometryDirty();
      recalculate();
      isInternalSync = false;
    }
  });

  // 2. Chords, Blades, or Cutout Change (recalculates Solidity & Aspect Ratio)
  const onDirectPlanformChange = () => {
    if (isInternalSync) return;
    isInternalSync = true;
    const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
    const cRootVal = parseFloat(byId<HTMLInputElement>("inp-chord-root").value) || 0.3;
    activeGeom.chordRoot = convertValue(cRootVal, cRootUnit, "m");

    const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
    const cTipVal = parseFloat(byId<HTMLInputElement>("inp-chord-tip").value) || 0.3;
    activeGeom.chordTip = convertValue(cTipVal, cTipUnit, "m");

    activeGeom.nBlades = parseInt(byId<HTMLInputElement>("inp-nblades").value, 10) || 4;
    activeGeom.rootCutout = parseFloat(byId<HTMLInputElement>("inp-cutout").value) || 0.15;

    activeGeom.solidityMode = "chords";
    activeGeom = resolveSolidity(activeGeom);

    byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
    byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);

    markGeometryDirty();
    recalculate();
    isInternalSync = false;
  };

  ["inp-chord-root", "inp-chord-tip", "inp-nblades", "inp-cutout"].forEach((id) => {
    byId(id).addEventListener("input", onDirectPlanformChange);
  });

  // 3. Solidity Change (scales chords to match target sigma_ref)
  byId("inp-sigma-ref").addEventListener("input", () => {
    if (isInternalSync) return;
    const sVal = parseFloat(byId<HTMLInputElement>("inp-sigma-ref").value);
    if (sVal > 0) {
      isInternalSync = true;
      activeGeom = scaleChordsToSigmaRef(activeGeom, sVal);

      const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
      const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
      byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);
      byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);
      byId<HTMLInputElement>("inp-aspect-ratio").value = referenceAspectRatio(activeGeom).toFixed(2);

      markGeometryDirty();
      recalculate();
      isInternalSync = false;
    }
  });

  // 4. Aspect Ratio Change (scales chords to match target aspect ratio)
  byId("inp-aspect-ratio").addEventListener("input", () => {
    if (isInternalSync) return;
    const arVal = parseFloat(byId<HTMLInputElement>("inp-aspect-ratio").value);
    if (arVal > 0) {
      isInternalSync = true;
      activeGeom = scaleChordsToAspectRatio(activeGeom, arVal);

      const cRootUnit = byId("unit-chord-root")?.textContent?.trim() || "m";
      const cTipUnit = byId("unit-chord-tip")?.textContent?.trim() || "m";
      byId<HTMLInputElement>("inp-chord-root").value = convertValue(activeGeom.chordRoot, "m", cRootUnit).toFixed(3);
      byId<HTMLInputElement>("inp-chord-tip").value = convertValue(activeGeom.chordTip, "m", cTipUnit).toFixed(3);
      byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);

      markGeometryDirty();
      recalculate();
      isInternalSync = false;
    }
  });

  // Other Geometry inputs
  byId("inp-rotor-name").addEventListener("input", () => {
    activeGeom.name = byId<HTMLInputElement>("inp-rotor-name").value.trim() || "Custom Rotor";
    markGeometryDirty();
  });

  byId("inp-theta-root").addEventListener("input", () => {
    const unit = byId("unit-theta-root")?.textContent?.trim() || "deg";
    const val = parseFloat(byId<HTMLInputElement>("inp-theta-root").value) || 0;
    activeGeom.thetaRoot = (convertValue(val, unit, "deg") * Math.PI) / 180;
    markGeometryDirty();
    recalculate();
  });

  byId("inp-theta-tip").addEventListener("input", () => {
    const unit = byId("unit-theta-tip")?.textContent?.trim() || "deg";
    const val = parseFloat(byId<HTMLInputElement>("inp-theta-tip").value) || 0;
    activeGeom.thetaTip = (convertValue(val, unit, "deg") * Math.PI) / 180;
    markGeometryDirty();
    recalculate();
  });

  byId("inp-lift-slope").addEventListener("input", () => {
    const unit = byId("unit-lift-slope")?.textContent?.trim() || "rad⁻¹";
    const val = parseFloat(byId<HTMLInputElement>("inp-lift-slope").value) || 5.73;
    activeGeom.liftSlope0 = convertValue(val, unit, "rad⁻¹");
    markGeometryDirty();
    recalculate();
  });

  byId("inp-cd0").addEventListener("input", () => {
    activeGeom.cd0 = parseFloat(byId<HTMLInputElement>("inp-cd0").value) || 0.009;
    markGeometryDirty();
    recalculate();
  });

  byId("inp-tiploss-b").addEventListener("input", () => {
    activeGeom.tipLossB = parseFloat(byId<HTMLInputElement>("inp-tiploss-b").value) || 0.97;
    markGeometryDirty();
    recalculate();
  });

  // Condition Inputs
  byId("inp-altitude").addEventListener("input", () => {
    const unit = byId("unit-altitude")?.textContent?.trim() || "m";
    const val = parseFloat(byId<HTMLInputElement>("inp-altitude").value) || 0;
    activeCond.altitudeM = convertValue(val, unit, "m");
    recalculate();
  });

  byId("inp-temperature").addEventListener("input", () => {
    const unit = byId("unit-temperature")?.textContent?.trim() || "°C";
    const val = parseFloat(byId<HTMLInputElement>("inp-temperature").value) || 15;
    activeCond.temperatureC = convertValue(val, unit, "°C");
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
    recalculate();
  });

  byId("inp-axial-val").addEventListener("input", () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-axial-val").value) || 0;
    if (activeCond.axialMode === "vz") {
      const unit = byId("unit-axial-val")?.textContent?.trim() || "m/s";
      activeCond.axialValue = convertValue(val, unit, "m/s");
    } else {
      activeCond.axialValue = val;
    }
    recalculate();
  });

  byId("inp-kind").addEventListener("input", () => {
    activeCond.kInd = parseFloat(byId<HTMLInputElement>("inp-kind").value) || 1.15;
    recalculate();
  });

  // Operating Pair Inputs (1 and 2)
  const onOperatingInput1 = () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-operating-1").value) || 0;
    const pair = activeCond.operatingPair;
    if (pair === "rpm_collective" || pair === "rpm_ct" || pair === "rpm_thrust") {
      activeCond.rpm = val;
    } else if (pair === "collective_ct" || pair === "collective_thrust") {
      activeCond.collectiveDeg = val;
    } else if (pair === "ct_thrust") {
      activeCond.targetCT = val;
    }
    recalculate();
  };

  const onOperatingInput2 = () => {
    const val = parseFloat(byId<HTMLInputElement>("inp-operating-2").value) || 0;
    const pair = activeCond.operatingPair;
    if (pair === "rpm_collective") {
      activeCond.collectiveDeg = val;
    } else if (pair === "rpm_ct" || pair === "collective_ct") {
      activeCond.targetCT = val;
    } else if (pair === "rpm_thrust" || pair === "collective_thrust" || pair === "ct_thrust") {
      const unit = byId("unit-operating-2")?.textContent?.trim() || "N";
      activeCond.targetThrustN = convertValue(val, unit, "N");
    }
    recalculate();
  };

  byId("inp-operating-1").addEventListener("input", onOperatingInput1);
  byId("inp-operating-2").addEventListener("input", onOperatingInput2);
}

// Modal Control Helpers
function openModal(id: string): void {
  byId(id)?.classList.add("open");
}

function closeModal(id: string): void {
  byId(id)?.classList.remove("open");
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
      if (e.target === modal) modal.classList.remove("open");
    });
  });

  // Topbar 3-Dot Popup Menu Toggle
  const menuBtn = byId("btn-main-menu");
  const menu = byId("main-popup-menu");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !(e.target as HTMLElement)?.closest(".popup-menu") && e.target !== menuBtn) {
      menu.hidden = true;
    }
  });

  // Popup Menu Item Handlers
  menu.querySelectorAll<HTMLButtonElement>(".popup-menu-item[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      menu.hidden = true;
      const action = btn.dataset.action;
      if (action === "settings") {
        openModal("modal-settings");
      } else if (action === "units") {
        populateConverterUnits();
        openModal("modal-unit-converter");
      } else if (action === "help") {
        openModal("modal-help");
      } else if (action === "restore") {
        if (confirm("Restore factory rotor presets? Any unsaved edits will be reset.")) {
          storedRotors = resetToFactoryPresets();
          loadRotorToUI(storedRotors[0]);
          alert("Factory rotor presets restored successfully.");
        }
      } else if (action === "export") {
        byId<HTMLButtonElement>("btn-manager-export").click();
      } else if (action === "import") {
        byId<HTMLButtonElement>("btn-manager-import").click();
      } else if (action === "about") {
        openModal("modal-about");
      } else if (action === "privacy") {
        openModal("modal-privacy");
      }
    });
  });

  byId("active-rotor-bar").addEventListener("click", () => {
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
  const airfoils: { id: string; name: string; a0: number; cd0: number; desc: string }[] = [
    { id: "naca0012", name: "NACA 0012", a0: 5.73, cd0: 0.009, desc: "Symmetrical classical benchmark rotor airfoil" },
    { id: "naca23012", name: "NACA 23012", a0: 5.85, cd0: 0.0085, desc: "Moderate camber, low profile pitching moment" },
    { id: "vr7", name: "VR-7", a0: 5.9, cd0: 0.0095, desc: "High transonic drag-divergence Boeing Vertol section" },
    { id: "sc1095", name: "SC1095", a0: 6.0, cd0: 0.0088, desc: "Sikorsky advanced main rotor high-lift airfoil" },
    { id: "clarky", name: "Clark Y", a0: 5.65, cd0: 0.01, desc: "Flat-bottom high efficiency propeller section" },
    { id: "selig8036", name: "Selig S8036", a0: 5.7, cd0: 0.011, desc: "Low Reynolds number optimized UAV/drone airfoil" },
  ];

  byId("btn-select-airfoil").addEventListener("click", () => {
    const curA0 = activeGeom.liftSlope0;
    const curCd0 = activeGeom.cd0;
    let currentId = "sc1095";
    const match = airfoils.find((af) => Math.abs(af.a0 - curA0) < 0.05 && Math.abs(af.cd0 - curCd0) < 0.001);
    if (match) currentId = match.id;

    showOptionPicker(
      "Airfoil Section · sets a0 and Cd0",
      airfoils.map((af) => ({
        id: af.id,
        label: af.name,
        desc: `a0 = ${af.a0} rad⁻¹ · Cd0 = ${af.cd0} — ${af.desc}`,
      })),
      currentId,
      (selectedId) => {
        const sel = airfoils.find((af) => af.id === selectedId);
        if (sel) {
          activeGeom.liftSlope0 = sel.a0;
          activeGeom.cd0 = sel.cd0;
          byId("btn-select-airfoil").textContent = sel.name;
          byId<HTMLInputElement>("inp-lift-slope").value = sel.a0.toString();
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
          activeCond.targetCT = Math.max(1e-6, activeResults.CT);
          activeCond.targetThrustN = Math.max(1.0, activeResults.thrustN);
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
          activeCond.horizontalValue = activeResults.operatingVx;
          byId("btn-toggle-horiz-mode").textContent = "Vx ▾";
          byId("unit-horiz-val").textContent = prefSpeedUnit;
          byId<HTMLInputElement>("inp-horiz-val").value = convertValue(activeCond.horizontalValue, "m/s", prefSpeedUnit).toFixed(1);
        } else {
          activeCond.horizontalMode = "mu";
          activeCond.horizontalValue = activeResults.operatingMu;
          byId("btn-toggle-horiz-mode").textContent = "μx ▾";
          byId("unit-horiz-val").textContent = "[-]";
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
    { id: "muz", label: "Axial Ratio μz [-]", desc: "Non-dimensional axial velocity Vz / (ΩR)" },
  ];

  byId("btn-toggle-axial-mode").addEventListener("click", () => {
    showOptionPicker(
      "Axial Flow Representation",
      axialModes,
      activeCond.axialMode,
      (selId) => {
        activeCond.axialMode = selId as "alpha" | "vz" | "muz";
        if (selId === "alpha") {
          activeCond.axialValue = activeResults.operatingAlphaDeg;
          byId("btn-toggle-axial-mode").textContent = "α ▾";
          byId("unit-axial-val").textContent = "deg";
          byId<HTMLInputElement>("inp-axial-val").value = activeCond.axialValue.toFixed(1);
        } else if (selId === "vz") {
          activeCond.axialValue = activeResults.operatingVz;
          const vzUnit = unitSystem === "imperial" ? "ft/min" : "m/s";
          byId("btn-toggle-axial-mode").textContent = "Vz ▾";
          byId("unit-axial-val").textContent = vzUnit;
          byId<HTMLInputElement>("inp-axial-val").value = convertValue(activeCond.axialValue, "m/s", vzUnit).toFixed(2);
        } else {
          activeCond.axialValue = activeResults.operatingMuZ;
          byId("btn-toggle-axial-mode").textContent = "μz ▾";
          byId("unit-axial-val").textContent = "[-]";
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
      units: ["m", "ft", "in"],
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
      units: ["m", "ft", "in", "mm"],
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
      units: ["m", "ft", "in", "mm"],
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
      units: ["m/s", "ft/min", "km/h"],
      getSI: () => activeCond.axialValue,
      setSI: (v: number) => { activeCond.axialValue = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-axial-val").value = val.toFixed(2); },
      onlyWhen: () => activeCond.axialMode === "vz",
    },
    {
      btnId: "unit-operating-1",
      fieldName: "Operating Constraint 1",
      units: ["rpm", "rad/s"],
      getSI: () => activeCond.rpm,
      setSI: (v: number) => { activeCond.rpm = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-operating-1").value = val.toFixed(0); },
      onlyWhen: () => activeCond.operatingPair.startsWith("rpm_"),
    },
    {
      btnId: "unit-operating-2",
      fieldName: "Target Thrust",
      units: ["N", "lbf", "kN", "kgf"],
      getSI: () => activeCond.targetThrustN || 45000,
      setSI: (v: number) => { activeCond.targetThrustN = v; },
      updateUI: (val: number) => { byId<HTMLInputElement>("inp-operating-2").value = val.toFixed(0); },
      onlyWhen: () => activeCond.operatingPair.includes("thrust"),
    },
    {
      btnId: "unit-disk-area",
      fieldName: "Disk Area",
      units: ["m²", "ft²"],
      getSI: () => Math.PI * activeGeom.radius * activeGeom.radius,
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
    {
      btnId: "unit-blade-area",
      fieldName: "Blade Area",
      units: ["m²", "ft²"],
      getSI: () => referenceBladeArea(activeGeom) * activeGeom.nBlades * (1.0 - activeGeom.rootCutout),
      setSI: () => {},
      updateUI: () => renderDerivedGeometry(),
    },
  ];

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

// Rotor Actions (Save, Copy, Delete, New, Import, Export)
function bindRotorActionButtons(): void {
  byId("btn-geom-save").addEventListener("click", () => {
    currentRotor.name = activeGeom.name;
    currentRotor.geom = cloneGeometry(activeGeom);
    saveStoredRotors(storedRotors);
    isGeometryDirty = false;
    updateActiveRotorBar();
    const saveBtn = byId("btn-geom-save");
    saveBtn.textContent = "SAVED ✓";
    setTimeout(() => (saveBtn.textContent = "SAVE"), 1500);
  });

  byId("btn-geom-copy").addEventListener("click", () => {
    const copyRotor: StoredRotor = {
      id: `custom-${Date.now()}`,
      name: `${activeGeom.name} (Copy)`,
      geom: cloneGeometry(activeGeom),
    };
    storedRotors.push(copyRotor);
    saveStoredRotors(storedRotors);
    loadRotorToUI(copyRotor);
    setActiveRotorId(copyRotor.id);
  });

  byId("btn-geom-delete").addEventListener("click", () => {
    if (storedRotors.length <= 1) {
      alert("Cannot delete the only remaining rotor.");
      return;
    }
    if (confirm(`Delete current rotor "${activeGeom.name}"?`)) {
      storedRotors = storedRotors.filter((r) => r.id !== currentRotor.id);
      saveStoredRotors(storedRotors);
      loadRotorToUI(storedRotors[0]);
      setActiveRotorId(storedRotors[0].id);
    }
  });

  byId("btn-manager-new").addEventListener("click", () => {
    resolveUnsavedGeometry("creating a new rotor", () => {
      const newRotor: StoredRotor = {
        id: `custom-${Date.now()}`,
        name: `Custom Rotor ${storedRotors.length + 1}`,
        geom: createDefaultGeometry(),
      };
      storedRotors.push(newRotor);
      saveStoredRotors(storedRotors);
      loadRotorToUI(newRotor);
      setActiveRotorId(newRotor.id);
      closeModal("modal-rotor-manager");
    });
  });

  byId("btn-manager-export").addEventListener("click", () => {
    const jsonStr = JSON.stringify(storedRotors, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotorcalculator_geometries_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  byId("btn-manager-import").addEventListener("click", () => {
    byId<HTMLInputElement>("file-import-input").click();
  });

  byId<HTMLInputElement>("file-import-input").addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const imported = importRotorsJSON(content);
      if (!imported || imported.length === 0) {
        alert("Failed to parse valid rotor geometries from file.");
        return;
      }
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
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = "";
  });

  // Modal: Unsaved Changes Confirm Listeners
  byId("btn-unsaved-save").addEventListener("click", () => {
    currentRotor.name = activeGeom.name;
    currentRotor.geom = cloneGeometry(activeGeom);
    saveStoredRotors(storedRotors);
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
    isGeometryDirty = false;
    loadRotorToUI(currentRotor);
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
        geom: cloneGeometry(imp.geom),
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
        <div class="rotor-manager-name">${rotor.name}</div>
        <div class="rotor-manager-desc">R = ${rotor.geom.radius}m | Nb = ${rotor.geom.nBlades} | c = ${rotor.geom.chordRoot}m</div>
      </div>
      <div class="rotor-manager-actions">
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

    // Copy & Delete
    item.querySelector('[data-act="copy"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const duplicate: StoredRotor = {
        id: `custom-${Date.now()}`,
        name: `${rotor.name} (Copy)`,
        geom: cloneGeometry(rotor.geom),
      };
      storedRotors.push(duplicate);
      saveStoredRotors(storedRotors);
      renderRotorManagerList();
    });

    item.querySelector('[data-act="delete"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (storedRotors.length <= 1) return;
      if (confirm(`Delete rotor "${rotor.name}"?`)) {
        storedRotors = storedRotors.filter((r) => r.id !== rotor.id);
        if (currentRotor.id === rotor.id) {
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
    opt.textContent = `${p.label} [${p.unit}]`;
    if (p.key === sweepSelectedParam) opt.selected = true;
    selectParam.appendChild(opt);
  });

  const canvas = byId<HTMLCanvasElement>("sweep-canvas");
  const selectFamily = byId<HTMLSelectElement>("sweep-select-family");
  const btnValues = byId<HTMLButtonElement>("btn-sweep-values");
  const groupHover = byId("sweep-group-trim-hover");
  const btnTrimHover = byId<HTMLButtonElement>("btn-sweep-trim-hover");

  const syncSweepControlVisibilities = () => {
    const multi = parseInt(selectFamily.value, 10);
    btnValues.style.display = (multi === 1 || multi === 2 || multi === 3) ? "block" : "none";

    const participatesInTrim = activeCond.operatingPair !== "rpm_collective";
    groupHover.style.display = participatesInTrim ? "flex" : "none";
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
    const parts = raw.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    if (parts.length < 2) {
      alert("Please enter at least 2 distinct numerical values.");
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

  btnTrimHover.onclick = () => {
    sweepHoverTrim = !sweepHoverTrim;
    btnTrimHover.textContent = sweepHoverTrim ? "HOVER TRIM: ON" : "HOVER TRIM: OFF";
    btnTrimHover.style.color = sweepHoverTrim ? "var(--accent-green)" : "var(--text-main)";
    updateSweepPlot();
  };

  const updateSweepPlot = () => {
    syncSweepControlVisibilities();
    sweepSelectedParam = selectParam.value;
    sweepMultiMode = parseInt(selectFamily.value, 10);
    sweepXAxisMode = byId<HTMLSelectElement>("sweep-select-xaxis").value as "mu" | "vx";
    sweepMaxMu = parseFloat(byId<HTMLSelectElement>("sweep-select-maxmu").value) || 0.4;

    const { curves, currentOpPoint } = runParameterSweep(
      activeGeom,
      activeCond,
      sweepSelectedParam,
      sweepMultiMode,
      sweepMaxMu,
      25,
      sweepCustomValues[sweepMultiMode],
      sweepHoverTrim
    );

    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
    drawSweepCanvas(canvas, curves, currentOpPoint, sweepXAxisMode, meta, currentTheme);

    if (sweepTableVisible) {
      renderSweepTable(curves, meta);
    }
  };

  selectParam.onchange = updateSweepPlot;
  byId("sweep-select-family").onchange = updateSweepPlot;
  byId("sweep-select-xaxis").onchange = updateSweepPlot;
  byId("sweep-select-maxmu").onchange = updateSweepPlot;

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
      sweepHoverTrim
    );
    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
    const trimText = sweepHoverTrim ? "Hover Trim (Fixed RPM & Collective)" : "Point-by-Point Trim";
    const csv = generateSweepCSV(curves, sweepXAxisMode, meta, trimText);
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
  const xCol = sweepXAxisMode === "mu" ? "μ [-]" : "Vx [m/s]";
  const trimText = sweepHoverTrim ? "Hover Trim (Fixed RPM & Collective)" : "Point-by-Point Trim";
  let html = `
    <div style="padding: 6px 10px; font-size: 11.5px; color: var(--text-muted); background: var(--header-bg); border-bottom: 1px solid var(--border);">
      Trim Strategy: <strong style="color: var(--accent);">${trimText}</strong>
    </div>
    <table style="width: 100%; border-collapse: collapse; text-align: right;"><thead style="position: sticky; top: 0; background: var(--header-bg); border-bottom: 1px solid var(--border);"><tr><th style="padding: 6px 10px; text-align: left;">${xCol}</th>`;
  curves.forEach((c) => {
    html += `<th style="padding: 6px 10px; color: ${c.color};">${c.label}</th>`;
  });
  html += `</tr></thead><tbody>`;

  const numPts = curves[0]?.points.length || 0;
  for (let i = 0; i < numPts; i++) {
    const pt0 = curves[0].points[i];
    const xVal = sweepXAxisMode === "mu" ? pt0.mu.toFixed(3) : pt0.vx.toFixed(1);
    html += `<tr style="border-bottom: 1px solid var(--row-border);"><td style="padding: 4px 10px; text-align: left; font-weight: 700;">${xVal}</td>`;
    curves.forEach((c) => {
      const pt = c.points[i];
      html += `<td style="padding: 4px 10px;">${pt.valid ? pt.val.toPrecision(5) : "—"}</td>`;
    });
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Unit Converter Modal Logic
function populateConverterUnits(): void {
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

// Settings Modal Binding & Persistence
function bindSettingsListeners(): void {
  const selTheme = byId<HTMLSelectElement>("setting-theme");
  const selUnits = byId<HTMLSelectElement>("setting-units-system");
  const selPrec = byId<HTMLSelectElement>("setting-precision");
  const selAngle = byId<HTMLSelectElement>("setting-angle-format");
  const selThrust = byId<HTMLSelectElement>("setting-thrust-unit");
  const selPower = byId<HTMLSelectElement>("setting-power-unit");
  const selTorque = byId<HTMLSelectElement>("setting-torque-unit");
  const selSpeed = byId<HTMLSelectElement>("setting-speed-unit");
  const selPres = byId<HTMLSelectElement>("setting-pressure-unit");

  // Load current values
  const syncSettingsToUI = () => {
    selTheme.value = currentTheme;
    selUnits.value = unitSystem;
    selPrec.value = extraPrecision.toString();
    selAngle.value = angleFormat;
    selThrust.value = prefThrustUnit;
    selPower.value = prefPowerUnit;
    selTorque.value = prefTorqueUnit;
    selSpeed.value = prefSpeedUnit;
    selPres.value = prefPressureUnit;
  };
  syncSettingsToUI();

  byId("btn-settings-save").addEventListener("click", () => {
    currentTheme = selTheme.value as "dark" | "light";
    unitSystem = selUnits.value as "si" | "imperial";
    extraPrecision = parseInt(selPrec.value, 10);
    angleFormat = selAngle.value as "0/360" | "-180/180";
    prefThrustUnit = selThrust.value;
    prefPowerUnit = selPower.value;
    prefTorqueUnit = selTorque.value;
    prefSpeedUnit = selSpeed.value;
    prefPressureUnit = selPres.value;

    localStorage.setItem("rotor_theme", currentTheme);
    localStorage.setItem("rotor_units", unitSystem);
    localStorage.setItem("rotor_extra_precision", extraPrecision.toString());
    localStorage.setItem("rotor_angle_format", angleFormat);
    localStorage.setItem("rotor_pref_thrust", prefThrustUnit);
    localStorage.setItem("rotor_pref_power", prefPowerUnit);
    localStorage.setItem("rotor_pref_torque", prefTorqueUnit);
    localStorage.setItem("rotor_pref_speed", prefSpeedUnit);
    localStorage.setItem("rotor_pref_pressure", prefPressureUnit);

    applyTheme();
    refreshOperatingControls();
    recalculate();
    closeModal("modal-settings");
  });

  byId("btn-settings-reset").addEventListener("click", () => {
    if (confirm("Reset all settings to factory defaults?")) {
      currentTheme = "dark";
      unitSystem = "si";
      extraPrecision = 0;
      angleFormat = "0/360";
      prefThrustUnit = "N";
      prefPowerUnit = "kW";
      prefTorqueUnit = "N·m";
      prefSpeedUnit = "m/s";
      prefPressureUnit = "hPa";

      localStorage.removeItem("rotor_theme");
      localStorage.removeItem("rotor_units");
      localStorage.removeItem("rotor_extra_precision");
      localStorage.removeItem("rotor_angle_format");
      localStorage.removeItem("rotor_pref_thrust");
      localStorage.removeItem("rotor_pref_power");
      localStorage.removeItem("rotor_pref_torque");
      localStorage.removeItem("rotor_pref_speed");
      localStorage.removeItem("rotor_pref_pressure");

      syncSettingsToUI();
      applyTheme();
      refreshOperatingControls();
      recalculate();
      closeModal("modal-settings");
    }
  });
}

// Tooltip Popover on Engineering & Result Rows
function initTooltips(): void {
  const popover = byId("tooltip-popover");
  let hideTimer: number | null = null;
  document.querySelectorAll<HTMLElement>("[data-tip]").forEach((el) => {
    const show = () => {
      if (hideTimer) clearTimeout(hideTimer);
      const tip = el.dataset.tip;
      if (!tip) return;
      popover.textContent = tip;
      popover.classList.add("visible");
      const rect = el.getBoundingClientRect();
      popover.style.left = `${Math.max(12, Math.min(window.innerWidth - 260, rect.left))}px`;
      popover.style.top = `${rect.bottom + 6}px`;
    };
    const hide = () => {
      popover.classList.remove("visible");
    };
    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("click", () => {
      show();
      hideTimer = window.setTimeout(hide, 3500);
    });
  });

  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement)?.closest("[data-tip]") && e.target !== popover) {
      popover.classList.remove("visible");
    }
  });
}

// Bootstrap Application
function initApp(): void {
  applyTheme();
  loadRotorToUI(currentRotor);
  bindInputListeners();
  bindModalListeners();
  bindRotorActionButtons();
  bindSelectorButtons();
  bindUnitButtons();
  bindResultRowTooltips();
  bindSettingsListeners();
  initSwipeNavigation();
  initTooltips();

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
  });
}

initApp();
