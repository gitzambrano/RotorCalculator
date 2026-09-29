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
- **ARCH-7** — The UI shall use AeroCalculator-style engineering rows with readable typography, explicit selectors, large mobile touch targets, persistent settings, immediate feedback, tap-accessible contextual help, and a consistent aligned label/value/unit grid.

## 2. Geometry

### 2.1 Direct Geometry editor and active rotor

- **GEO-1** — Opening **Geometry** shall immediately show the complete editable rotor definition; editing shall not require opening a rotor row or a modal Geometry popup.
- **GEO-2** — Geometry shall reserve the top selector position formerly occupied by NEW ROTOR for a persistent **Active Rotor** bar. The bar shall identify the current rotor at all times and visually indicate unsaved changes.
- **GEO-3** — Tapping the Active Rotor bar shall open the saved-rotor selector and shall also expose **NEW ROTOR**.
- **GEO-4** — NEW ROTOR shall create a uniquely named user rotor and make it the current inline geometry without changing tabs.
- **GEO-5** — The in-page editor shall contain **Blade Geometry**, **Derived Geometry**, and **Rotor Aerodynamics**.
- **GEO-6** — Geometry shall expose **SAVE**, **COPY**, and **DELETE** directly on the page. SAVE shall keep the editor open and shall immediately refresh the **Active Rotor** bar so the saved current rotor remains unambiguous.
- **GEO-7** — SAVE shall update the active rotor; COPY shall clone the current edited geometry under a unique name; DELETE shall require confirmation and shall be disabled when only one rotor remains.
- **GEO-8** — Selecting another rotor with unsaved edits or leaving the application shall offer Save, Discard, or Cancel. Unsaved edited values shall survive normal Activity recreation/orientation within the current app process.
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
- **GEO-23** — Every Geometry label shall be rendered as an AeroCalculator-style button/control, not passive text. Pressing it shall open the field help or the relevant variable/parameter selector. Every displayed Geometry unit shall also be rendered as a button/control; when alternate units exist it shall open the unit selector, and when the quantity is dimensionless or has only one valid unit it shall retain the same button alignment/style. Unit changes shall preserve the canonical SI value.

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
- **COND-25** — Conditions shall include induced-power factor **K_ind**. The same symbol/name shall be used consistently in Conditions, Results/help, plots, and documentation.
- **COND-26** — Profile drag shall always use **Numerical Vectorial** radial/azimuthal integration.
- **COND-27** — Every Conditions label shall be rendered as an AeroCalculator-style button/control, not passive text. Every displayed Conditions unit shall also be rendered as a button/control; when alternate units exist it shall open the unit selector, and otherwise it shall retain the same aligned button style. Horizontal and axial representation selection shall each use exactly one variable-selector button in the label column.

## 4. Results

Sections shall appear in this order:

1. **DIMENSIONAL PERFORMANCE**
2. **AERODYNAMIC COEFFICIENTS**
3. **EFFICIENCY**
4. **INFLOW & WAKE**
5. **OPERATING STATE & ATMOSPHERE**

- **RES-1** — Dimensional Performance shall contain thrust, shaft power, shaft torque, in-plane force, and other dimensional forces implemented by the engine.
- **RES-2** — Aerodynamic Coefficients shall keep all coefficients together: CT, CQ (= CPshaft), CQi, CQ0, CH, CHi, CH0, CY, CMx, CMy, and CPair. Result labels shall use one consistent symbol-first nomenclature, for example **CT — Thrust**, **CQ — Torque**, **CQi — Induced Torque**, **CQ0 — Profile Torque**, **CH — In-Plane**, **CY — Side Force**, **CMx — Roll Moment**, **CMy — Pitch Moment**, and **CPair — Air Power**.
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
- **PLOT-23** — Sweep/plot variable names shall derive from one canonical symbol-first catalog shared with Results. Unit-specific variants may append the unit in brackets, but shall not introduce an alternate physical name for the same quantity.
- **PLOT-24** — Plot title, tick labels, axis title, current-value footer, legend, selector controls, TABLE/CSV/PNG controls, and family-value dialogs shall remain readable on phones. The plot shall reserve enough margin/legend band for larger text rather than shrinking engineering text into caption-sized labels.
- **PLOT-25** — The responsive legend shall remain outside the data rectangle and shall increase its row spacing as needed to avoid overlap when text size increases.

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

- **UX-1** — Geometry and Conditions shall share one AeroCalculator-inspired three-column row system: **label / value / unit**. Column edges and row baselines shall align throughout each page.
- **UX-2** — Primary touch targets shall be approximately 48 dp high or larger. Input labels, editable values, units, and Results shall use legible mobile typography rather than compressed caption-sized text.
- **UX-3** — Mobile discovery shall be tap-first; no essential explanation shall require mouse hover.
- **UX-4** — Equivalent flow values shall remain readable on narrow phones without competing with the editable value.
- **UX-5** — Dark and Light themes shall provide equivalent hierarchy and contrast.
- **UX-6** — No value, unit, legend, label, or action shall clip at supported portrait widths.
- **UX-7** — Rotor identity shall appear in the Geometry Active Rotor bar; the global header shall show only the application identity and navigation.
- **UX-8** — Unsaved inline Geometry edits and sweep selections shall survive normal Activity recreation/orientation within the current app process.

### 8.1 Binding AeroCalculator interaction contract

The following requirements are mandatory and take precedence over older Geometry-library/popup patterns.

- **UX-9** — **Geometry shall open directly as the editable rotor definition.** The user shall not have to open, tap, or select a rotor merely to see or edit Geometry.
- **UX-10** — The top of Geometry shall contain one persistent **Active Rotor** bar in the selector position. After SAVE, this bar shall continue to show the current saved rotor. Pressing the bar shall select another saved rotor or create a NEW ROTOR.
- **UX-11** — Typography in Geometry, Conditions, and Results shall be comparable in visual size/readability to AeroCalculator. Primary editable values shall use approximately **16 sp or larger**, primary labels/results approximately **15 sp or larger**, units approximately **14 sp or larger**, and section headings approximately **12 sp or larger**, subject only to responsive scaling that does not make them visually smaller than the AeroCalculator reference at the same phone width.
- **UX-12** — Geometry and Conditions shall use one rigid three-column form grid: **label button | value field | unit button**. All label controls shall share the same left/right column edges, all editable/value fields shall share the same left/right column edges, and all unit controls shall share the same left/right column edges throughout the page.
- **UX-13** — Rows shall also be vertically aligned: within each row the label button, value field, and unit button shall share the same baseline/vertical center and control height. No individual field may drift horizontally or vertically relative to the common grid.
- **UX-14** — Geometry shall apply the same **label button | value field | unit button** alignment to Blade Geometry, Derived Geometry, and Rotor Aerodynamics. Derived/read-only values shall occupy the same value column as editable fields.
- **UX-15** — **Horizontal Flow shall use one and only one variable-selector button** in the label column. Pressing it shall choose between **μ** and **Vx**; the selected variable shall remain in that same button, with its value in the common value column and its unit in the common unit-button column.
- **UX-16** — **Axial Flow shall use one and only one variable-selector button** in the label column. Pressing it shall choose between **α**, **Vz**, and **μz**; the selected variable shall remain in that same button, with its value in the common value column and its unit in the common unit-button column.
- **UX-17** — Every label in Geometry and Conditions shall be a visible button/control as in AeroCalculator. It shall provide field help or, where the label represents a selectable variable/model, open the relevant selector. Passive text styled differently from the other label controls shall not be used for normal form rows.
- **UX-18** — Every unit in Geometry and Conditions shall occupy the unit-button column and use the same button/control styling as AeroCalculator. Pressing a unit with valid alternatives shall open a unit selector and convert only the displayed value; the canonical calculation value shall remain unchanged. Dimensionless/single-unit quantities shall retain the same aligned unit-control footprint.
- **UX-19** — Input and output nomenclature shall use the zBET/zBEMT symbols consistently across Geometry, Conditions, Results, plots, help, and exported tables. Established symbols such as **R, Nb, x0, c0, c1, σref, AR, θroot, θtip, a0, Cd0, K_ind, μ, Vx, α, Vz, μz, CT, CQ, CQi, CQ0, CH, CY, CMx, CMy, CPair, λ, λi, Kx, Ky, χ, B** shall not be replaced by inconsistent ad-hoc abbreviations.
- **UX-20** — Results shall use a consistent symbol-first naming pattern and readable font size. The same physical quantity shall not appear under conflicting names such as a mixture of “Coef”, “Coefficient”, unexplained abbreviations, or different symbols in different screens.
- **UX-21** — Clickable Geometry/Conditions labels and units shall be native actionable controls with normal pressed/focus feedback; a passive Label styled to imitate a button does not satisfy this requirement.
- **UX-22** — Selector rows such as Airfoil, Tip Loss, Compressibility, Operating Inputs, Inflow Model and fixed Profile Drag presentation shall preserve the same label/value/unit column boundaries as numeric rows. Rows without a convertible physical unit shall retain a neutral unit-column control/placeholder rather than widening the value selector into a different grid.
- **UX-23** — Derived Geometry shall preserve the common columns but its value cell shall have an unmistakable read-only treatment and shall not visually compete with editable Geometry values.
- **UX-24** — Results shall use three independently aligned columns: **symbol-first quantity | numerical value | unit**. The unit shall never be concatenated to the numeric value string.
- **UX-25** — Responsive nomenclature shall use three levels: symbol/very compact on narrow phones, compact engineering terminology on ordinary phones, and full terminology on larger widths. Symbols and physical meaning shall remain invariant.
- **UX-26** — Canonical UI names shall be authored once. The implementation shall not create rows with deprecated names and translate them later solely for display. The canonical symbol/name shall be shared by Results, tooltips, plots, tables, CSV and QA.
- **UX-27** — Visual hierarchy shall distinguish editable, selectable, derived/read-only and status information. Derived/read-only values shall be visually quieter than editable values, while primary actions and current-rotor identity shall remain immediately discoverable.
- **UX-28** — The UI shall prefer scrolling over shrinking text or touch targets. Normal engineering labels, values, units and Results shall remain approximately 15–16 sp on phone layouts; critical status/section text shall remain comfortably readable and shall not use 10–11 sp caption sizing.
- **UX-29** — Geometry shall use the same centered maximum content width as Active Rotor, Conditions and Results on screens wider than the phone layout. The form grid shall not expand to full tablet width beneath a narrower Active Rotor/action block.
- **UX-30** — In landscape, Geometry shall reduce non-engineering chrome before reducing text or touch targets. Active Rotor and SAVE/COPY/DELETE shall share one compact horizontal band when sufficient width exists, preserving approximately 48 dp action targets.
- **UX-31** — At 320 dp width with Android font scale 130%, status and Sweep controls shall use responsive compact wording/reflow rather than clipped text or smaller fonts. Result status shall remain single-line and Sweep range, hover-trim and active-state text shall fit their assigned controls.
- **UX-32** — Normal label and unit controls shall remain visibly actionable but shall be visually subordinate to editable values and model/action selectors. Derived Geometry shall use a quieter read-only treatment while retaining aligned actionable help/unit controls.
- **UX-33** — Rotor Name is textual metadata rather than a physical scalar. On the narrowest phone layouts its editable text may use a slightly more compact responsive text size while retaining the same row grid and touch geometry.

## 9. Verification/release

- **QA-1** — Geometry tests shall verify radius scaling, AR, σref, σgeom, σthrust, and taper preservation.
- **QA-2** — All six operating pairs shall be tested in hover, forward flight, and nonzero axial flow.
- **QA-3** — Tests shall verify uniform collective Δθ and preserved twist.
- **QA-4** — Plot tests shall cover every Y variable, every family, custom family values, and both hover-only trim states.
- **QA-5** — Plot, TABLE, and CSV shall share one authoritative sampled dataset.
- **QA-6** — Geometry import/export shall round-trip without numeric/naming loss and reject out-of-domain data.
- **QA-7** — Factory restore shall preserve unrelated user rotors.
- **QA-8** — UI smoke tests shall cover Light/Dark, portrait/landscape, Activity recreation, Active Rotor selection, inline Geometry SAVE/COPY/DELETE/NEW, label/unit selectors, both flow-variable selectors, all six pairs, plot export, and help.
- **QA-9** — Release APK/AAB shall be built from the exact approved main commit, installed, operated, and visually reviewed before being considered current.
- **QA-10** — Runtime UI QA shall explicitly verify the three-column alignment in Geometry and Conditions by comparing the x-positions and vertical centers of label, value, and unit controls across multiple rows in portrait and landscape.
- **QA-11** — Runtime UI QA shall verify that every normal Geometry/Conditions label is an actionable button/control, every unit occupies the aligned unit-control column, and alternate-unit controls actually change displayed units without changing the canonical physical state.
- **QA-12** — Runtime UI QA shall verify that Horizontal Flow exposes a single μ/Vx selector button and Axial Flow exposes a single α/Vz/μz selector button, with no duplicated variable controls.
- **QA-13** — Runtime UI QA shall verify readable typography against the AeroCalculator reference and shall fail if normal inputs, labels, units, or Results regress to caption-sized/minuscule text.
- **QA-14** — Runtime/static QA shall verify the standardized symbol-first nomenclature in Results and the use of the same symbols across Conditions, plots, help, and exports.
- **QA-15** — Static QA shall fail if a normal clickable Geometry/Conditions label or unit is implemented as a passive Label rather than an actionable control.
- **QA-16** — Runtime QA shall verify that selector rows preserve the same label/value/unit x-boundaries as numeric rows and that derived values remain aligned without looking editable.
- **QA-17** — Runtime QA shall verify that Results render quantity, value and unit as three separate aligned cells, including SI/Imperial switching and invalid operating points.
- **QA-18** — Static QA shall reject deprecated UI source names when a canonical symbol-first name is defined. Runtime QA shall verify responsive naming at compact, standard-phone and tablet widths.
- **QA-19** — Visual review shall explicitly inspect information hierarchy, whitespace rhythm, press feedback, text clipping, font scale 130%, and portrait/landscape consistency rather than only checking that controls exist.
- **QA-20** — Static QA shall verify that Sweep labels and plot titles come from one canonical naming function and shall reject duplicated legacy label maps.
- **QA-21** — Runtime visual QA shall inspect the Parameter Sweep at compact phone, standard phone and landscape widths, including tick labels, axis/title text, legend spacing, footer values and export buttons.
- **QA-22** — Runtime visual QA shall compare Geometry content edges with the Active Rotor/action block at 600–768 dp portrait widths and fail visible full-width expansion of the form.
- **QA-23** — Runtime visual QA shall inspect Geometry at representative phone landscape sizes and verify that Active Rotor plus SAVE/COPY/DELETE do not consume a second full vertical band.
- **QA-24** — Runtime visual QA shall inspect 320×568 at 130% font scale and fail clipping/wrapping of Result status, Sweep range/hover controls, or the active Sweep footer.
- **QA-25** — Static/source QA shall reject reintroduction of the removed Geometry popup/library architecture and stale canonical sweep labels.
