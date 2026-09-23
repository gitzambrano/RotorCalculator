# RotorCalculator — Software Requirements

> **Status:** Binding implementation specification for RotorCalculator 1.20+  
> **Physics reference:** `tools/zBET.py` and the zBEMT reference-planform convention.  
> **UI reference:** AeroCalculator interaction principles, adapted where RotorCalculator can be clearer or more capable.

Each requirement has a stable identifier. Screens are specified positively by the data and actions they present.

## 1. Product structure

- **ARCH-1** — RotorCalculator shall provide three primary tabs: **Geometry**, **Conditions**, and **Results**.
- **ARCH-2** — Geometry shall define the rotor/blade geometry and rotor aerodynamic definition.
- **ARCH-3** — Conditions shall define atmosphere, flight state, operating constraints, inflow model, and induced-power factor.
- **ARCH-4** — Results shall present dimensional performance, all aerodynamic coefficients, efficiency, inflow/wake, atmosphere, and the complete solved operating state.
- **ARCH-5** — Normal calculator edits shall update dependent values and results immediately.
- **ARCH-6** — Symbols, signs, equations, and equivalent-input conversions shall follow zBET/zBEMT.
- **ARCH-7** — The UI shall use compact engineering rows, explicit selectors, large mobile touch targets, persistent settings, immediate feedback, and tap-accessible contextual help.

## 2. Geometry

### 2.1 In-page editor and rotor library

- **GEO-1** — Geometry shall be a complete in-page editor.
- **GEO-2** — A compact strip shall show **Loaded rotor: <name>** and an unsaved indicator when applicable.
- **GEO-3** — Geometry shall use consistent stacked panels: **Blade Geometry**, **Derived Geometry**, and **Rotor Aerodynamics**.
- **GEO-4** — The bottom action row shall contain **LOAD ROTOR**, **SAVE**, and **SAVE AS NEW**.
- **GEO-5** — LOAD ROTOR shall open the saved/factory rotor library and distinguish factory from user entries.
- **GEO-6** — SAVE shall update the currently loaded rotor.
- **GEO-7** — SAVE AS NEW shall create a uniquely named rotor.
- **GEO-8** — Loading another rotor with unsaved edits shall offer Save, Discard, or Cancel.
- **GEO-9** — Restore Factory Presets shall restore shipped preset values while preserving unrelated user rotors.

### 2.2 Synchronized reference planform

Editable inputs:
- radius **R** [m];
- blade count **Nb**;
- root cutout **x0 = r0/R**;
- reference root chord **c0** [m] at x = r/R = 0;
- tip chord **c1** [m] at x = 1;
- reference solidity **σref**;
- blade reference aspect ratio **AR**;
- root incidence **θroot** [deg];
- tip incidence **θtip** [deg].

The reference chord law is:

`c(x) = c0 + (c1 - c0) x,  0 ≤ x ≤ 1`

Reference single-blade area:

`Sref,b = R (c0 + c1) / 2`

Reference aspect ratio:

`AR = R² / Sref,b = 2R / (c0 + c1)`

Reference solidity:

`σref = Nb Sref,b / (πR²) = Nb / (π AR)`

Synchronization rules:
- **GEO-10** — Editing c0 or c1 shall recompute AR and σref.
- **GEO-11** — Editing radius shall scale c0 and c1 in direct proportion to R, preserving σref, AR, taper ratio, and c/R.
- **GEO-12** — Editing σref shall scale both chords by one common factor, preserve taper ratio, and recompute AR.
- **GEO-13** — Editing AR shall scale both chords by one common factor, preserve taper ratio, and recompute σref.
- **GEO-14** — Editing Nb shall update σref while preserving AR and both chords.
- **GEO-15** — Editing x0 shall preserve reference planform metrics and update active-span metrics and BET integration limits.
- **GEO-16** — Root and tip incidence define the baseline linear pitch law. Operating collective is one uniform increment Δθ:
  `θroot,op = θroot + Δθ`
  `θtip,op = θtip + Δθ`

### 2.3 Derived geometry

Read-only outputs shall include:
- geometric solidity **σgeom**;
- thrust-weighted solidity **σthrust**;
- taper ratio **c1/c0**;
- disk area **A = πR²**;
- reference single-blade area;
- active blade area;
- total twist **θtip − θroot**.

Definitions:
- **GEO-17** — `σgeom = Nb/(πR) ∫[x0..1] c(x) dx`.
- **GEO-18** — `σthrust = 3 ∫[x0..1] x² σ(x) dx`, where `σ(x)=Nb c(x)/(πR)`.

### 2.4 Rotor Aerodynamics

- **GEO-19** — Rotor Aerodynamics shall use the same row/panel language as Blade Geometry.
- **GEO-20** — Inputs shall include airfoil preset, lift-curve slope a0 [rad⁻¹], Cd0, tip-loss model, fixed B when applicable, and Prandtl-Glauert toggle.
- **GEO-21** — Tip-loss choices shall be **None**, **Fixed B**, and **Sissingh**.
- **GEO-22** — Selecting an airfoil preset may populate a0 and Cd0 while leaving both values visible.
- **GEO-23** — Every Geometry row shall expose tap-accessible contextual help.

### 2.5 Persistence and migration

- **GEO-24** — Saved rotor data shall carry an explicit schema version.
- **GEO-25** — Legacy rotors shall be migrated once while preserving the original active-span chord law.
- **GEO-26** — A legacy chord defined at x0 shall map to reference-axis c0 by:
  `c0 = c_root@x0 - (c1 - c_root@x0) x0 / (1 - x0)`.
- **GEO-27** — Migration tests shall verify the migrated law reproduces the legacy chord at x0.

## 3. Conditions

### 3.1 Atmosphere

- **COND-1** — Conditions shall contain **Altitude** [m] and **Temperature** [°C].
- **COND-2** — Density, pressure, and speed of sound shall be derived and reported in Results.

### 3.2 Horizontal flow

- **COND-3** — Horizontal Flow shall provide an explicit **μ / Vx** representation selector.
- **COND-4** — The selected representation shall be editable and the equivalent representation shall remain visible as a derived value.
- **COND-5** — `μ = Vx / (ΩR)`.

### 3.3 Axial flow

- **COND-6** — Axial Flow shall provide an explicit **α / Vz / μz** representation selector.
- **COND-7** — The selected representation shall be editable and equivalent representations shall remain visible when mathematically defined.
- **COND-8** — **+Vz** means positive climb rate; the relative wind arrives from above and flows downward through the disk.
- **COND-9** — **+μz** is the corresponding positive downward relative-flow ratio.
- **COND-10** — **+α** means relative wind arriving from below the rotor disk.
- **COND-11** — `μz = Vz/(ΩR)` and `μz = -μ tan(α)`.
- **COND-12** — At zero forward speed, nonzero axial flow shall be entered through Vz or μz.

### 3.4 Operating constraints

The operating state contains four linked quantities:
**RPM**, **collective increment Δθ**, **CT**, and **Thrust**.

The user prescribes any two; RotorCalculator solves the remaining two at the current atmosphere and flight state.

- **COND-13** — Operating Inputs shall expose six pairs:
  1. **RPM + Collective**
  2. **RPM + CT**
  3. **RPM + Thrust**
  4. **Collective + CT**
  5. **Collective + Thrust**
  6. **CT + Thrust**
- **COND-14** — Only the selected pair shall be editable.
- **COND-15** — RPM + Collective directly prescribes the operating rotor.
- **COND-16** — RPM + CT solves collective.
- **COND-17** — RPM + Thrust solves collective.
- **COND-18** — Collective + CT solves RPM when the selected flight/model state provides a unique dimensional solution; otherwise Results shall report a clear non-unique/no-solution status.
- **COND-19** — Collective + Thrust solves RPM.
- **COND-20** — CT + Thrust solves RPM from dimensional scaling and collective from the aerodynamic target.
- **COND-21** — Trimming shall occur at the current flight condition, including forward flight and climb/descent.
- **COND-22** — Results shall report solved RPM, collective, CT, and thrust.
- **COND-23** — Vx↔μ, Vz↔μz, Mach, and dimensional conversions shall use the solved operating RPM.

### 3.5 Aerodynamic-model inputs

- **COND-24** — Inflow Model shall offer Uniform, Coleman Simple, Coleman-Feingold, and Drees.
- **COND-25** — Conditions shall include induced-power factor **Kind**.
- **COND-26** — Profile drag shall always use **Numerical Vectorial** radial/azimuthal integration.
- **COND-27** — Every selector/field shall expose concise contextual help with physical meaning, equation, sign convention, and units.

## 4. Results

Sections shall appear in this order:

1. **DIMENSIONAL PERFORMANCE**
2. **AERODYNAMIC COEFFICIENTS**
3. **EFFICIENCY**
4. **INFLOW & WAKE**
5. **OPERATING STATE & ATMOSPHERE**

- **RES-1** — Dimensional Performance shall contain thrust, shaft power, shaft torque, in-plane force, and other dimensional forces implemented by the engine.
- **RES-2** — Aerodynamic Coefficients shall keep all coefficients together: CT, CQ (= CPshaft), CQi, CQ0, CH, CHi, CH0, CY, CMx, CMy, and CPair.
- **RES-3** — Efficiency shall contain FoM and effective L/D.
- **RES-4** — Inflow & Wake shall contain λ, λi, Kx, Ky, wake-skew angle χ, and tip-loss factor B.
- **RES-5** — Operating State & Atmosphere shall explicitly show solved RPM, solved collective Δθ, solved CT, solved thrust, μ, Vx, μz, Vz, α, tip speed, tip Mach, advancing-tip Mach, altitude, temperature, density ρ, ambient pressure p, speed of sound a, and model/trim status.
- **RES-6** — Baseline output precision shall be variable-specific.
- **RES-7** — +1 Decimal shall add exactly one decimal place to each baseline format.
- **RES-8** — Invalid operating points shall be clearly identified and shall not display false zero values.
- **RES-9** — Every result row shall expose contextual physics/equation help.

## 5. Parameter plots

The plot tool shall combine the broad capability of the original sweep with the cleaner current presentation.

### 5.1 Variables and axes

- **PLOT-1** — Any scalar numerical Result shall be selectable as Y.
- **PLOT-2** — The Y catalog shall remain synchronized with Result metadata.
- **PLOT-3** — Primary X shall be μ, with an equivalent Vx [m/s] display option.
- **PLOT-4** — X range shall be user-selectable.
- **PLOT-5** — The active operating point shall be shown when inside range.

### 5.2 Curve families

- **PLOT-6** — Curve Family shall support Active Only, Inflow Models, α Family, Vz Family, and μz Family.
- **PLOT-7** — Defaults shall be:
  - α: -10, -5, 0, +5, +10 deg
  - Vz: -10, -5, 0, +5, +10 m/s
  - μz: -0.050, -0.025, 0, +0.025, +0.050
- **PLOT-8** — A compact **VALUES** button shall accept a comma-separated family list.
- **PLOT-9** — Custom family values shall be validated and retained for the session.
- **PLOT-10** — A family shall vary only its designated quantity.

### 5.3 Trim in plots

- **PLOT-11** — Whenever CT or Thrust participates in the selected operating pair, Plot shall show **Trim only in hover**.
- **PLOT-12** — OFF: solve the selected operating pair independently at each sweep point.
- **PLOT-13** — ON: solve once at hover (μ=0, μz=0), then hold that solved RPM and collective constant throughout the sweep.
- **PLOT-14** — TABLE and CSV shall state the trim strategy.

### 5.4 Presentation/export

- **PLOT-15** — Plot controls shall use explicit selectors/buttons.
- **PLOT-16** — Legends shall be complete, readable, responsive, and outside the data region.
- **PLOT-17** — Invalid samples shall produce gaps, not false zeros.
- **PLOT-18** — TABLE shall contain all displayed curves and the same samples used by the plot.
- **PLOT-19** — CSV shall export the exact plotted dataset.
- **PLOT-20** — PNG shall export the displayed graph with theme, axes, title, legend, and active marker.
- **PLOT-21** — CSV/PNG shall use Android Storage Access Framework.
- **PLOT-22** — Plot selections and family values shall survive Activity recreation during the app session.

## 6. Geometry backup and sharing

- **LIB-1** — Settings shall provide **Import Geometries** and **Export Geometries**.
- **LIB-2** — Export shall write the complete saved-rotor database to a portable, versioned text file.
- **LIB-3** — Import shall validate schema and numeric domains before merge.
- **LIB-4** — Import shall report how many valid geometries were found before confirmation.
- **LIB-5** — Name conflicts shall explicitly support Rename, Replace, and Skip.
- **LIB-6** — Import shall preserve unrelated local rotors.
- **LIB-7** — Export shall use Android CREATE_DOCUMENT; import shall use OPEN_DOCUMENT.
- **LIB-8** — Restore Factory Presets shall restore factory definitions while preserving unrelated user rotors.

## 7. Settings and help

- **SET-1** — Settings shall contain Theme (Dark/Light), Result Units (SI/Imperial), Output Format (Standard/+1 Decimal), Import Geometries, and Export Geometries.
- **SET-2** — Theme, units, and precision shall persist across restart.
- **SET-3** — The global menu shall expose Settings, Quick Unit Converter, Physics & Equations, zBET/zBEMT Conventions, Restore Factory Presets, and About.
- **SET-4** — Physics & Equations shall work fully offline and describe the implemented equations, operating pairs, plot behavior, conventions, and limitations.

## 8. Visual/mobile requirements

- **UX-1** — Geometry and Conditions shall share one AeroCalculator-inspired row system with clear section headers and aligned controls.
- **UX-2** — Primary touch targets shall be approximately 48 dp high or larger.
- **UX-3** — Mobile discovery shall be tap-first; no essential explanation shall require mouse hover.
- **UX-4** — Equivalent flow values shall remain readable on narrow phones without competing with the editable value.
- **UX-5** — Dark and Light themes shall provide equivalent hierarchy and contrast.
- **UX-6** — No value, unit, legend, label, or action shall clip at supported portrait widths.
- **UX-7** — Rotor identity shall appear in Geometry's Loaded Rotor strip, while the global header stays compact.
- **UX-8** — Unsaved Geometry edits and sweep selections shall survive normal Activity recreation/orientation within the current app process.

## 9. Verification/release

- **QA-1** — Geometry tests shall verify radius scaling, AR, σref, σgeom, σthrust, and taper preservation.
- **QA-2** — All six operating pairs shall be tested in hover, forward flight, and nonzero axial flow.
- **QA-3** — Tests shall verify uniform collective Δθ and preserved twist.
- **QA-4** — Plot tests shall cover every Y variable, every family, custom family values, and both hover-only trim states.
- **QA-5** — Plot, TABLE, and CSV shall share one authoritative sampled dataset.
- **QA-6** — Geometry import/export shall round-trip without numeric/naming loss and reject out-of-domain data.
- **QA-7** — Factory restore shall preserve unrelated user rotors.
- **QA-8** — UI smoke tests shall cover Light/Dark, portrait/landscape, Activity recreation, geometry load/save, all six pairs, plot export, and help.
- **QA-9** — Release APK/AAB shall be built from the exact approved main commit, installed, operated, and visually reviewed before being considered current.
