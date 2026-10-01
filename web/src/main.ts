import "./style.css";
import iconUrl from "./assets/icon.png";
import {
  calculate,
  cloneCondition,
  cloneGeometry,
  createDefaultCondition,
  createDefaultGeometry,
  resolveSolidity,
  type FlightCondition,
  type RotorGeometry,
  type RotorResults,
} from "./engine";
import {
  getActiveRotorId,
  getFactoryPresets,
  importRotorsJSON,
  loadStoredRotors,
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

// Sweep Modal State
let sweepSelectedParam = "CP";
let sweepMultiMode = 0;
let sweepXAxisMode: "mu" | "vx" = "mu";
let sweepMaxMu = 0.4;
let sweepTableVisible = false;

// Initialize Root App DOM
const app = document.getElementById("app");
if (!app) throw new Error("Missing #app root container");

app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div class="brand-row">
        <img class="brand-icon" src="${iconUrl}" alt="RotorCalculator Icon" />
        <div class="brand-title">
          RotorCalculator
          <span class="version-badge">v1.22</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="btn-header-unit" title="Unit Converter">⇄</button>
          <button class="icon-btn" id="btn-header-help" title="Physics Help">?</button>
          <button class="icon-btn" id="btn-header-settings" title="Settings">⚙</button>
        </div>
      </div>
      <nav class="tabs-nav" aria-label="Calculator sections">
        <button class="tab-btn active" data-page="geometry">GEOMETRY</button>
        <button class="tab-btn" data-page="conditions">CONDITIONS</button>
        <button class="tab-btn" data-page="results">RESULTS</button>
        <div class="tab-indicator" id="tab-indicator"></div>
      </nav>
    </header>

    <div class="content-area" id="content-area">
      <!-- PAGE 0: GEOMETRY -->
      <section class="page active" id="page-geometry">
        <div class="active-rotor-bar" id="active-rotor-bar">
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
          <button class="row-label-btn" data-tip="Reference blade solidity Nb*c_mean / (pi*R).">Ref. Solidity</button>
          <input class="row-input" type="number" step="0.001" id="inp-sigma-ref" value="0.0825" />
          <button class="row-unit-btn" disabled>[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Blade aspect ratio R / c_mean.">Aspect Ratio</button>
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
          <button class="row-unit-btn" disabled>m²</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Active lifting planform area of all blades combined.">Active Blade Area</button>
          <div class="row-derived-val" id="drv-blade-area">14.74</div>
          <button class="row-unit-btn" disabled>m²</button>
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
          <button class="row-label-btn" id="btn-toggle-horiz-mode" title="Toggle between advance ratio mu and forward airspeed Vx">μx ▾</button>
          <input class="row-input" type="number" step="0.01" id="inp-horiz-val" value="0.00" />
          <button class="row-unit-btn" id="unit-horiz-val">[-]</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="btn-toggle-axial-mode" title="Toggle between inflow angle alpha, climb speed Vz, and axial ratio muz">α ▾</button>
          <input class="row-input" type="number" step="0.5" id="inp-axial-val" value="0.0" />
          <button class="row-unit-btn" id="unit-axial-val">deg</button>
        </div>

        <div class="section-header">Operating Constraints</div>
        <div class="engineering-row">
          <button class="row-label-btn" data-tip="Trim mode solver constraint: Manual Collective, Target Thrust, or Target CT.">Trim Mode</button>
          <button class="action-btn" id="btn-trim-mode" style="height: 44px;">Target CT</button>
          <button class="row-unit-btn" disabled>—</button>
        </div>
        <div class="engineering-row">
          <button class="row-label-btn" id="lbl-operating-1">RPM</button>
          <input class="row-input" type="number" step="1" id="inp-operating-1" value="258" />
          <button class="row-unit-btn" id="unit-operating-1">rpm</button>
        </div>
        <div class="engineering-row">
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
              <select class="sweep-select" id="sweep-select-family">
                <option value="0">Single Curve (Active)</option>
                <option value="1">α Family (-10° to +10°)</option>
                <option value="2">Vz Family (-10 to +10 m/s)</option>
                <option value="3">μz Family (-0.05 to +0.05)</option>
                <option value="4">Inflow Models Family</option>
              </select>
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
                <option value="Speed">Speed & Velocity</option>
                <option value="Thrust">Force & Thrust</option>
                <option value="Power">Power</option>
                <option value="Torque">Torque & Moment</option>
                <option value="Radius">Length & Chord</option>
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
          <div class="modal-title">CALCULATOR SETTINGS</div>
          <button class="modal-close-btn" data-close="modal-settings">×</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 15px; font-weight: 700;">Theme</div>
                <div style="font-size: 12px; color: var(--text-muted);">Dark Stealth Cockpit or Light Technical</div>
              </div>
              <button class="action-btn" id="btn-setting-theme" style="width: 110px;">${currentTheme === "dark" ? "DARK" : "LIGHT"}</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 15px; font-weight: 700;">Units Presentation</div>
                <div style="font-size: 12px; color: var(--text-muted);">Default presentation units for outputs</div>
              </div>
              <button class="action-btn" id="btn-setting-units" style="width: 110px;">${unitSystem === "si" ? "SI (METRIC)" : "IMPERIAL"}</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 15px; font-weight: 700;">Display Precision</div>
                <div style="font-size: 12px; color: var(--text-muted);">Standard decimal digits or +1 Extra</div>
              </div>
              <button class="action-btn" id="btn-setting-precision" style="width: 110px;">${extraPrecision === 1 ? "+1 DECIMAL" : "STANDARD"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: HELP -->
    <div class="modal-overlay" id="modal-help">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">THEORETICAL MODEL & EQUATIONS</div>
          <button class="modal-close-btn" data-close="modal-help">×</button>
        </div>
        <div class="modal-body" style="font-size: 13.5px; line-height: 1.6; color: var(--text-main);">
          <h3 style="color: var(--accent); margin-bottom: 8px;">zBET Blade Element Theory</h3>
          <p style="margin-bottom: 12px;">RotorCalculator implements high-fidelity Blade Element Theory (BET) numerically coupled with Momentum Theory for rotary wings and propellers.</p>
          <h4 style="color: var(--accent-green); margin-bottom: 6px;">1. Inflow Equation</h4>
          <p style="margin-bottom: 12px; font-family: monospace; background: var(--header-bg); padding: 8px; border-radius: 6px;">
            λi = CT / [2 * B² * √(μ² + (μz + λi)²)]
          </p>
          <h4 style="color: var(--accent-green); margin-bottom: 6px;">2. Thrust & Torque Coefficients</h4>
          <p style="margin-bottom: 12px; font-family: monospace; background: var(--header-bg); padding: 8px; border-radius: 6px;">
            CT = (a₀ / 2) * [θ₂ + ½ μ² θ₀ - λ i₁ - ½ μ λ₁s i₁]<br>
            CQ = CQ,i + CQ,0<br>
            CQ,i = k_ind * λi * CT + μz * CT - μ * CH,i
          </p>
          <h4 style="color: var(--accent-green); margin-bottom: 6px;">3. Sign Conventions</h4>
          <p style="margin-bottom: 12px;">
            • Advance ratio: μ = Vx / (ΩR) ≥ 0<br>
            • Disk Angle of attack: α &gt; 0 indicates wind blowing from below (nose-up pitch).<br>
            • Climb velocity: Vz &gt; 0 is vertical descent / climb flow convention.
          </p>
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
  const btn = byId<HTMLButtonElement>("btn-setting-theme");
  if (btn) btn.textContent = currentTheme === "dark" ? "DARK" : "LIGHT";
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
  byId("drv-disk-area").textContent = formatResultValue(diskArea, 1, extraPrecision);
  const bladeArea = activeGeom.nBlades * 0.5 * (activeGeom.chordRoot + activeGeom.chordTip) * activeGeom.radius * (1 - activeGeom.rootCutout);
  byId("drv-blade-area").textContent = formatResultValue(bladeArea, 2, extraPrecision);
  const twist = ((activeGeom.thetaTip - activeGeom.thetaRoot) * 180) / Math.PI;
  byId("drv-twist").textContent = `${formatResultValue(twist, 1, extraPrecision)}°`;
}

function renderResults(): void {
  const r = activeResults;
  const isImp = unitSystem === "imperial";

  // Badges
  const badgeModel = byId("badge-model-status");
  const txtModel = byId("txt-model-status");
  txtModel.textContent = r.solutionValid ? (r.compressibilityWarning ? "CAUTION" : "CONVERGED") : "INVALID";
  badgeModel.className = `status-pill ${r.solutionValid ? (r.compressibilityWarning ? "warning" : "") : "error"}`;

  const summary = byId("txt-solution-summary");
  summary.textContent = `θ0 = ${r.trimmedCollectiveDeg.toFixed(1)}° | RPM = ${r.trimmedRPM.toFixed(0)}`;

  // Dimensional values (convert to imperial if requested)
  const thrust = isImp ? r.thrustLbf : r.thrustN;
  byId("res-thrust").textContent = formatResultValue(thrust, isImp ? 0 : 0, extraPrecision);
  byId("unit-res-thrust").textContent = isImp ? "lbf" : "N";

  const power = isImp ? r.powerShaftHP : r.powerShaftKW;
  byId("res-power").textContent = formatResultValue(power, 1, extraPrecision);
  byId("unit-res-power").textContent = isImp ? "hp" : "kW";

  const torque = isImp ? r.torqueLbft : r.torqueNm;
  byId("res-torque").textContent = formatResultValue(torque, 1, extraPrecision);
  byId("unit-res-torque").textContent = isImp ? "lb·ft" : "N·m";

  const dragH = isImp ? r.dragHN * 0.224808943 : r.dragHN;
  byId("res-drag-h").textContent = formatResultValue(dragH, 1, extraPrecision);
  byId("unit-res-drag-h").textContent = isImp ? "lbf" : "N";

  const sideY = isImp ? r.sideForceYLbf : r.sideForceYN;
  byId("res-side-y").textContent = formatResultValue(sideY, 1, extraPrecision);
  byId("unit-res-side-y").textContent = isImp ? "lbf" : "N";

  const rollMx = isImp ? r.rollMomentLbft : r.rollMomentNm;
  byId("res-roll-mx").textContent = formatResultValue(rollMx, 1, extraPrecision);
  byId("unit-res-roll-mx").textContent = isImp ? "lb·ft" : "N·m";

  const pitchMy = isImp ? r.pitchMomentLbft : r.pitchMomentNm;
  byId("res-pitch-my").textContent = formatResultValue(pitchMy, 1, extraPrecision);
  byId("unit-res-pitch-my").textContent = isImp ? "lb·ft" : "N·m";

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
  byId("res-op-vx").textContent = formatResultValue(isImp ? r.operatingVx * 1.94384449 : r.operatingVx, 1, extraPrecision);
  byId("unit-res-vx").textContent = isImp ? "kt" : "m/s";

  byId("res-op-muz").textContent = formatResultValue(r.operatingMuZ, 4, extraPrecision);
  byId("res-op-vz").textContent = formatResultValue(isImp ? r.operatingVz * 196.85 : r.operatingVz, 2, extraPrecision);
  byId("unit-res-vz").textContent = isImp ? "ft/min" : "m/s";

  byId("res-op-alpha").textContent = formatResultValue(r.operatingAlphaDeg, 2, extraPrecision);
  byId("res-op-vtip").textContent = formatResultValue(isImp ? r.tipSpeed * 3.28084 : r.tipSpeed, 1, extraPrecision);
  byId("unit-res-vtip").textContent = isImp ? "ft/s" : "m/s";

  byId("res-op-mtip").textContent = formatResultValue(r.tipSpeed / r.speedOfSound, 3, extraPrecision);
  byId("res-op-madv").textContent = formatResultValue(r.advancingTipMach, 3, extraPrecision);

  byId("res-op-alt").textContent = formatResultValue(isImp ? r.altitudeM * 3.28084 : r.altitudeM, 0, extraPrecision);
  byId("unit-res-alt").textContent = isImp ? "ft" : "m";

  byId("res-op-temp").textContent = formatResultValue(isImp ? r.temperatureC * 1.8 + 32 : r.temperatureC, 1, extraPrecision);
  byId("res-op-rho").textContent = formatResultValue(r.densityRho, 4, extraPrecision);
  byId("res-op-pres").textContent = formatResultValue(r.pressurePa / 100, 1, extraPrecision);
  byId("res-op-sound").textContent = formatResultValue(isImp ? r.speedOfSound * 3.28084 : r.speedOfSound, 1, extraPrecision);
  byId("unit-res-sound").textContent = isImp ? "ft/s" : "m/s";
}

// Load Rotor Data into Inputs
function loadRotorToUI(rotor: StoredRotor): void {
  currentRotor = rotor;
  activeGeom = cloneGeometry(rotor.geom);
  byId("display-active-rotor-name").textContent = rotor.name;
  byId<HTMLInputElement>("inp-rotor-name").value = rotor.name;
  byId<HTMLInputElement>("inp-radius").value = activeGeom.radius.toString();
  byId<HTMLInputElement>("inp-nblades").value = activeGeom.nBlades.toString();
  byId<HTMLInputElement>("inp-cutout").value = activeGeom.rootCutout.toString();
  byId<HTMLInputElement>("inp-chord-root").value = activeGeom.chordRoot.toString();
  byId<HTMLInputElement>("inp-chord-tip").value = activeGeom.chordTip.toString();
  byId<HTMLInputElement>("inp-sigma-ref").value = activeGeom.sigmaRef.toFixed(4);
  byId<HTMLInputElement>("inp-aspect-ratio").value = (activeGeom.radius / activeGeom.chordRoot).toFixed(1);
  byId<HTMLInputElement>("inp-theta-root").value = ((activeGeom.thetaRoot * 180) / Math.PI).toFixed(1);
  byId<HTMLInputElement>("inp-theta-tip").value = ((activeGeom.thetaTip * 180) / Math.PI).toFixed(1);
  byId<HTMLInputElement>("inp-lift-slope").value = activeGeom.liftSlope0.toString();
  byId<HTMLInputElement>("inp-cd0").value = activeGeom.cd0.toString();
  byId<HTMLButtonElement>("btn-tiploss-mode").textContent = activeGeom.tipLossMode.toUpperCase();
  byId<HTMLInputElement>("inp-tiploss-b").value = activeGeom.tipLossB.toString();
  byId<HTMLButtonElement>("btn-compressibility").textContent = activeGeom.usePrandtlGlauert ? "ON (PG)" : "OFF";
  byId<HTMLButtonElement>("btn-compressibility").style.color = activeGeom.usePrandtlGlauert ? "var(--accent-green)" : "var(--text-muted)";
  recalculate();
}

function bindInputListeners(): void {
  // Geometry Inputs
  const onGeomChange = () => {
    activeGeom.name = byId<HTMLInputElement>("inp-rotor-name").value.trim() || "Custom Rotor";
    activeGeom.radius = parseFloat(byId<HTMLInputElement>("inp-radius").value) || 5.0;
    activeGeom.nBlades = parseInt(byId<HTMLInputElement>("inp-nblades").value, 10) || 4;
    activeGeom.rootCutout = parseFloat(byId<HTMLInputElement>("inp-cutout").value) || 0.15;
    activeGeom.chordRoot = parseFloat(byId<HTMLInputElement>("inp-chord-root").value) || 0.3;
    activeGeom.chordTip = parseFloat(byId<HTMLInputElement>("inp-chord-tip").value) || 0.3;
    const tRoot = parseFloat(byId<HTMLInputElement>("inp-theta-root").value) || 0;
    const tTip = parseFloat(byId<HTMLInputElement>("inp-theta-tip").value) || 0;
    activeGeom.thetaRoot = (tRoot * Math.PI) / 180;
    activeGeom.thetaTip = (tTip * Math.PI) / 180;
    activeGeom.liftSlope0 = parseFloat(byId<HTMLInputElement>("inp-lift-slope").value) || 5.73;
    activeGeom.cd0 = parseFloat(byId<HTMLInputElement>("inp-cd0").value) || 0.009;
    activeGeom.tipLossB = parseFloat(byId<HTMLInputElement>("inp-tiploss-b").value) || 0.97;
    byId("display-active-rotor-name").textContent = activeGeom.name;
    recalculate();
  };

  [
    "inp-rotor-name",
    "inp-radius",
    "inp-nblades",
    "inp-cutout",
    "inp-chord-root",
    "inp-chord-tip",
    "inp-theta-root",
    "inp-theta-tip",
    "inp-lift-slope",
    "inp-cd0",
    "inp-tiploss-b",
  ].forEach((id) => byId(id).addEventListener("input", onGeomChange));

  // Condition Inputs
  const onCondChange = () => {
    activeCond.altitudeM = parseFloat(byId<HTMLInputElement>("inp-altitude").value) || 0;
    activeCond.temperatureC = parseFloat(byId<HTMLInputElement>("inp-temperature").value) || 15;
    activeCond.horizontalValue = parseFloat(byId<HTMLInputElement>("inp-horiz-val").value) || 0;
    activeCond.axialValue = parseFloat(byId<HTMLInputElement>("inp-axial-val").value) || 0;
    activeCond.rpm = parseFloat(byId<HTMLInputElement>("inp-operating-1").value) || 258;
    const op2Val = parseFloat(byId<HTMLInputElement>("inp-operating-2").value) || 0;
    if (activeCond.operatingPair === "rpm_ct") {
      activeCond.targetCT = op2Val;
    } else if (activeCond.operatingPair === "rpm_thrust") {
      activeCond.targetThrustN = op2Val;
    } else {
      activeCond.collectiveDeg = op2Val;
    }
    activeCond.kInd = parseFloat(byId<HTMLInputElement>("inp-kind").value) || 1.15;
    recalculate();
  };

  [
    "inp-altitude",
    "inp-temperature",
    "inp-horiz-val",
    "inp-axial-val",
    "inp-operating-1",
    "inp-operating-2",
    "inp-kind",
  ].forEach((id) => byId(id).addEventListener("input", onCondChange));
}

// Dialog Controls
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

  byId("btn-header-settings").addEventListener("click", () => openModal("modal-settings"));
  byId("btn-header-help").addEventListener("click", () => openModal("modal-help"));
  byId("btn-header-unit").addEventListener("click", () => {
    populateConverterUnits();
    openModal("modal-unit-converter");
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
      setActiveRotorId(rotor.id);
      loadRotorToUI(rotor);
      closeModal("modal-rotor-manager");
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

// Rotor Actions (Save, Copy, Delete, New, Import, Export)
function bindRotorActionButtons(): void {
  byId("btn-geom-save").addEventListener("click", () => {
    currentRotor.name = activeGeom.name;
    currentRotor.geom = cloneGeometry(activeGeom);
    saveStoredRotors(storedRotors);
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
      if (imported && imported.length > 0) {
        storedRotors = imported;
        saveStoredRotors(storedRotors);
        loadRotorToUI(storedRotors[0]);
        setActiveRotorId(storedRotors[0].id);
        renderRotorManagerList();
        alert(`Successfully imported ${imported.length} rotor geometries.`);
      } else {
        alert("Failed to parse rotor geometries JSON.");
      }
    };
    reader.readAsText(file);
  });
}

// Toggles & Selection Modals (Horizontal flow, Axial flow, Trim mode, Airfoil, Tip loss)
function bindSelectorButtons(): void {
  // Horizontal Flow Toggle
  byId("btn-toggle-horiz-mode").addEventListener("click", () => {
    if (activeCond.horizontalMode === "mu") {
      activeCond.horizontalMode = "vx";
      activeCond.horizontalValue = activeResults.operatingVx;
      byId("btn-toggle-horiz-mode").textContent = "Vx ▾";
      byId("unit-horiz-val").textContent = unitSystem === "imperial" ? "kt" : "m/s";
    } else {
      activeCond.horizontalMode = "mu";
      activeCond.horizontalValue = activeResults.operatingMu;
      byId("btn-toggle-horiz-mode").textContent = "μx ▾";
      byId("unit-horiz-val").textContent = "[-]";
    }
    byId<HTMLInputElement>("inp-horiz-val").value = activeCond.horizontalValue.toFixed(2);
    recalculate();
  });

  // Axial Flow Toggle (alpha -> vz -> muz)
  byId("btn-toggle-axial-mode").addEventListener("click", () => {
    if (activeCond.axialMode === "alpha") {
      activeCond.axialMode = "vz";
      activeCond.axialValue = activeResults.operatingVz;
      byId("btn-toggle-axial-mode").textContent = "Vz ▾";
      byId("unit-axial-val").textContent = unitSystem === "imperial" ? "ft/min" : "m/s";
    } else if (activeCond.axialMode === "vz") {
      activeCond.axialMode = "muz";
      activeCond.axialValue = activeResults.operatingMuZ;
      byId("btn-toggle-axial-mode").textContent = "μz ▾";
      byId("unit-axial-val").textContent = "[-]";
    } else {
      activeCond.axialMode = "alpha";
      activeCond.axialValue = activeResults.operatingAlphaDeg;
      byId("btn-toggle-axial-mode").textContent = "α ▾";
      byId("unit-axial-val").textContent = "deg";
    }
    byId<HTMLInputElement>("inp-axial-val").value = activeCond.axialValue.toFixed(1);
    recalculate();
  });

  // Trim Mode Toggle
  byId("btn-trim-mode").addEventListener("click", () => {
    const modes: FlightCondition["operatingPair"][] = ["rpm_ct", "rpm_thrust", "rpm_collective"];
    const labels = ["Target CT", "Target Thrust", "Manual Collective"];
    const currentIdx = modes.indexOf(activeCond.operatingPair);
    const nextIdx = (currentIdx + 1) % modes.length;
    activeCond.operatingPair = modes[nextIdx];
    byId("btn-trim-mode").textContent = labels[nextIdx];

    if (activeCond.operatingPair === "rpm_ct") {
      byId("lbl-operating-2").textContent = "Target CT";
      byId<HTMLInputElement>("inp-operating-2").value = (activeCond.targetCT || 0.0065).toString();
      byId("unit-operating-2").textContent = "[-]";
    } else if (activeCond.operatingPair === "rpm_thrust") {
      byId("lbl-operating-2").textContent = "Target Thrust";
      byId<HTMLInputElement>("inp-operating-2").value = (activeCond.targetThrustN || 45000).toString();
      byId("unit-operating-2").textContent = unitSystem === "imperial" ? "lbf" : "N";
    } else {
      byId("lbl-operating-2").textContent = "Collective θ0";
      byId<HTMLInputElement>("inp-operating-2").value = (activeCond.collectiveDeg || 12).toString();
      byId("unit-operating-2").textContent = "deg";
    }
    recalculate();
  });

  // Tip Loss Mode Toggle
  byId("btn-tiploss-mode").addEventListener("click", () => {
    const modes: RotorGeometry["tipLossMode"][] = ["none", "fixed", "sissingh"];
    const curIdx = modes.indexOf(activeGeom.tipLossMode);
    const nextIdx = (curIdx + 1) % modes.length;
    activeGeom.tipLossMode = modes[nextIdx];
    byId("btn-tiploss-mode").textContent = activeGeom.tipLossMode.toUpperCase();
    recalculate();
  });

  // Compressibility Toggle
  byId("btn-compressibility").addEventListener("click", () => {
    activeGeom.usePrandtlGlauert = !activeGeom.usePrandtlGlauert;
    byId("btn-compressibility").textContent = activeGeom.usePrandtlGlauert ? "ON (PG)" : "OFF";
    byId("btn-compressibility").style.color = activeGeom.usePrandtlGlauert ? "var(--accent-green)" : "var(--text-muted)";
    recalculate();
  });

  // Inflow Model Toggle
  byId("btn-inflow-model").addEventListener("click", () => {
    const models: FlightCondition["inflowModel"][] = ["uniform", "coleman_simple", "coleman_feingold", "drees"];
    const labels = ["Uniform", "Coleman Simple", "Coleman-Feingold", "Drees"];
    const curIdx = models.indexOf(activeCond.inflowModel);
    const nextIdx = (curIdx + 1) % models.length;
    activeCond.inflowModel = models[nextIdx];
    byId("btn-inflow-model").textContent = labels[nextIdx];
    recalculate();
  });

  // Airfoil Selection Button
  byId("btn-select-airfoil").addEventListener("click", () => {
    const airfoils = [
      { name: "NACA 0012", a0: 5.73, cd0: 0.009 },
      { name: "NACA 23012", a0: 5.85, cd0: 0.0085 },
      { name: "VR-7", a0: 5.9, cd0: 0.0095 },
      { name: "SC1095", a0: 6.0, cd0: 0.0088 },
      { name: "Clark Y", a0: 5.65, cd0: 0.01 },
      { name: "Selig S8036", a0: 5.7, cd0: 0.011 },
    ];
    const choice = prompt(
      `Select Airfoil:\n1. NACA 0012\n2. NACA 23012\n3. VR-7\n4. SC1095\n5. Clark Y\n6. Selig S8036\nEnter number (1-6):`,
      "4"
    );
    const idx = parseInt(choice || "", 10) - 1;
    if (idx >= 0 && idx < airfoils.length) {
      const selected = airfoils[idx];
      activeGeom.liftSlope0 = selected.a0;
      activeGeom.cd0 = selected.cd0;
      byId("btn-select-airfoil").textContent = selected.name;
      byId<HTMLInputElement>("inp-lift-slope").value = selected.a0.toString();
      byId<HTMLInputElement>("inp-cd0").value = selected.cd0.toString();
      recalculate();
    }
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

  const updateSweepPlot = () => {
    sweepSelectedParam = selectParam.value;
    sweepMultiMode = parseInt(byId<HTMLSelectElement>("sweep-select-family").value, 10);
    sweepXAxisMode = byId<HTMLSelectElement>("sweep-select-xaxis").value as "mu" | "vx";
    sweepMaxMu = parseFloat(byId<HTMLSelectElement>("sweep-select-maxmu").value) || 0.4;

    const { curves, currentOpPoint } = runParameterSweep(
      activeGeom,
      activeCond,
      sweepSelectedParam,
      sweepMultiMode,
      sweepMaxMu,
      25
    );

    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
    drawSweepCanvas(canvas, curves, currentOpPoint, sweepXAxisMode, meta, currentTheme);

    // Update Table if visible
    if (sweepTableVisible) {
      renderSweepTable(curves, meta);
    }
  };

  selectParam.onchange = updateSweepPlot;
  byId("sweep-select-family").onchange = updateSweepPlot;
  byId("sweep-select-xaxis").onchange = updateSweepPlot;
  byId("sweep-select-maxmu").onchange = updateSweepPlot;

  // Toggle Table
  byId("btn-sweep-toggle-table").onclick = () => {
    sweepTableVisible = !sweepTableVisible;
    byId("sweep-table-container").style.display = sweepTableVisible ? "block" : "none";
    byId("btn-sweep-toggle-table").textContent = sweepTableVisible ? "HIDE TABLE" : "SHOW TABLE";
    if (sweepTableVisible) updateSweepPlot();
  };

  // Export CSV
  byId("btn-sweep-export-csv").onclick = () => {
    const { curves } = runParameterSweep(activeGeom, activeCond, sweepSelectedParam, sweepMultiMode, sweepMaxMu, 25);
    const meta = SWEEP_PARAMS.find((p) => p.key === sweepSelectedParam) || SWEEP_PARAMS[0];
    const csv = generateSweepCSV(curves, sweepXAxisMode, meta);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotorcalculator_sweep_${sweepSelectedParam}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PNG
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
  let html = `<table style="width: 100%; border-collapse: collapse; text-align: right;"><thead style="position: sticky; top: 0; background: var(--header-bg); border-bottom: 1px solid var(--border);"><tr><th style="padding: 6px 10px; text-align: left;">${xCol}</th>`;
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

    // Minimum swipe threshold & horizontal velocity check
    if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        // Swiped Left -> Move forward
        if (currentPage === "geometry") activatePage("conditions", "left");
        else if (currentPage === "conditions") activatePage("results", "left");
      } else {
        // Swiped Right -> Move back
        if (currentPage === "results") activatePage("conditions", "right");
        else if (currentPage === "conditions") activatePage("geometry", "right");
      }
    }
  }, { passive: true });
}

// Settings Toggle Listeners
function bindSettingsListeners(): void {
  byId("btn-setting-theme").addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("rotor_theme", currentTheme);
    applyTheme();
  });

  byId("btn-setting-units").addEventListener("click", () => {
    unitSystem = unitSystem === "si" ? "imperial" : "si";
    localStorage.setItem("rotor_units", unitSystem);
    byId("btn-setting-units").textContent = unitSystem === "si" ? "SI (METRIC)" : "IMPERIAL";
    renderResults();
  });

  byId("btn-setting-precision").addEventListener("click", () => {
    extraPrecision = extraPrecision === 0 ? 1 : 0;
    localStorage.setItem("rotor_extra_precision", extraPrecision.toString());
    byId("btn-setting-precision").textContent = extraPrecision === 1 ? "+1 DECIMAL" : "STANDARD";
    renderDerivedGeometry();
    renderResults();
  });
}

// Tooltip Popover on Result Rows
function initTooltips(): void {
  const popover = byId("tooltip-popover");
  document.querySelectorAll<HTMLElement>("[data-tip]").forEach((el) => {
    el.addEventListener("mouseenter", (e) => {
      const tip = el.dataset.tip;
      if (!tip) return;
      popover.textContent = tip;
      popover.classList.add("visible");
      const rect = el.getBoundingClientRect();
      popover.style.left = `${Math.min(window.innerWidth - 250, rect.left)}px`;
      popover.style.top = `${rect.bottom + 6}px`;
    });
    el.addEventListener("mouseleave", () => {
      popover.classList.remove("visible");
    });
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
  bindSettingsListeners();
  initSwipeNavigation();
  initTooltips();

  document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.page as "geometry" | "conditions" | "results";
      if (target) activatePage(target);
    });
  });

  // Handle Window Resize for responsive layout & canvas
  window.addEventListener("resize", () => {
    updateTabIndicator();
  });
}

initApp();
