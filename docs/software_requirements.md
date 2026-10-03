# RotorCalculator — Software Requirements

> **Status:** Binding implementation specification for RotorCalculator 1.24+ (versionCode 7)  
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

- **GEO-1** — Opening **Geometry** shall immediately show the complete editable rotor definition as a direct in-page rotor editor; editing shall not require opening a rotor row or a modal Geometry popup.
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
- geometric solidity **σgeom**;
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

`σgeom = Nb Sref,b / (πR²) = Nb / (π AR)`

Synchronization rules:
- **GEO-10** — Editing c0 or c1 shall recompute AR and σgeom.
- **GEO-11** — Editing radius shall scale c0 and c1 in direct proportion to R, preserving σgeom, AR, taper ratio, and c/R.
- **GEO-12** — Editing σgeom shall scale both chords by one common factor, preserve taper ratio, and recompute AR.
- **GEO-13** — Editing AR shall scale both chords by one common factor, preserve taper ratio, and recompute σgeom.
- **GEO-14** — Editing Nb shall update σgeom while preserving AR and both chords.
- **GEO-15** — Editing x0 shall preserve reference planform metrics and update actual-blade metrics and BET integration limits.
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
- actual blade area;
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
- **GEO-25** — Legacy rotors shall be migrated once while preserving the original actual-blade chord law.
- **GEO-26** — A legacy chord defined at x0 shall map to reference-axis c0 by:
  `c0 = c_root@x0 - (c1 - c_root@x0) x0 / (1 - x0)`.
- **GEO-27** — Migration tests shall verify the migrated law reproduces the legacy chord at x0.
- **GEO-28** — Geometry input display precision shall reflect the physical scale: ordinarily two decimals for rotor radius and aspect ratio, one for incidence, up to three for ordinary chords and three for root cutout, with additional places for small radii/chords and small dimensionless coefficients where rounding would hide useful variation. Formatting shall never round the stored SI geometry.
- **GEO-29** — Chord inputs retain millimeter-scale display detail where needed without forcing trailing third/fourth decimal zeros; display formatting never rounds or changes the canonical geometry.

## 3. Conditions

### 3.1 Atmosphere

- **COND-1** — Conditions shall contain **Altitude** [m] and **Temperature** [°C].
- **COND-2** — Density, pressure, and speed of sound shall be derived and reported in Results.

### 3.2 Horizontal flow

- **COND-3** — Horizontal Flow shall provide an explicit **μ / Vx** representation selector.
- **COND-4** — The selected representation shall be editable. Equivalent μ/Vx values shall be consolidated in Results, without a small secondary line under the input.
- **COND-5** — `μ = Vx / (ΩR)`.

### 3.3 Axial flow

- **COND-6** — Axial Flow shall provide an explicit **α / Vz / μz** representation selector.
- **COND-7** — The selected representation shall be editable. Equivalent α/Vz/μz values shall be consolidated in Results when mathematically defined, without a small secondary line under the input.
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
- **COND-28** — Collective trim must bracket the target using the residuals of the actual valid candidate states. An invalid-to-valid transition may not create a false sign change or a valid solution that misses its prescribed CT/thrust.

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

## 5. Universal plots and parameter sweep

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
- **LIB-2** — Export shall write the complete saved-rotor database to a portable, versioned text file or standard JSON file with explicit rotor count confirmation.
- **LIB-3** — Import shall validate schema, version, and numeric domains for both text and JSON formats before merge.
- **LIB-4** — Import shall report how many valid geometries were found before confirmation.
- **LIB-5** — Name conflicts shall explicitly support Rename, Replace, and Skip.
- **LIB-6** — Import shall preserve unrelated local rotors.
- **LIB-7** — Export shall use Android CREATE_DOCUMENT; import shall use OPEN_DOCUMENT.
- **LIB-8** — Restore Factory Presets shall restore factory definitions while preserving unrelated user rotors.

## 7. Settings and help

- **SET-1** — Settings shall contain Theme (Dark/Light/Midnight), Result Units (SI/Imperial), Output Format (Standard/+1 Decimal), Import Geometries, and Export Geometries.
- **SET-2** — Theme, units, and precision shall persist across restart.
- **SET-3** — The global menu shall expose Settings, Quick Unit Converter, Physics & Equations, zBET/zBEMT Conventions, Restore Factory Presets, Install App (Web), and About.
- **SET-4** — Physics & Equations shall work fully offline and describe the implemented equations, operating pairs, plot behavior, conventions, and limitations.

## 8. Visual/mobile requirements

- **UX-1** — Geometry and Conditions shall share one AeroCalculator-inspired three-column row system: **label / value / unit**. Column edges and row baselines shall align throughout each page.
- **UX-2** — Primary touch targets shall be approximately 48 dp high or larger. Input labels, editable values, units, and Results shall use legible mobile typography rather than compressed caption-sized text.
- **UX-3** — Mobile discovery shall be tap-first; no essential explanation shall require mouse hover.
- **UX-4** — Conditions shall show only the selected flow input in each form row; Results shall show the complete equivalent flow state with readable quantity/value/unit columns.
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
- **UX-19** — Input and output nomenclature shall use the zBET/zBEMT symbols consistently across Geometry, Conditions, Results, plots, help, and exported tables, as fixed by `docs/nomenclature.md`. The **collective pitch symbol is Δθ** and the **blade twist symbol is θ_twist**. Established symbols such as **R, Nb, x0, c0, c1, σgeom, AR, θroot, θtip, θ_twist, a0, Cd0, k_ind, μx, Vx, α, Vz, μz, Δθ, CT, CQ, CQi, CQ0, CH, CY, CMx, CMy, CPair, λ, λi, Kx, Ky, χ, B** shall not be replaced by inconsistent ad-hoc abbreviations. Naming rules: labels are **Description Symbol** (symbol after description), Title Case, no periods, no unit inside label or value; three levels (Full, Short, Narrow without symbol) chosen once per page, never per row; dimensionless unit column shows `–`; plain-text symbols use `_` (C_T, θ_twist).
- **UX-19a** — Geometry action buttons (SAVE / COPY / DELETE) sit at the end of the Geometry page, after the editor rows.
- **UX-19b** — Sweep trim is one dropdown: No Trim (Fixed Controls), Trim Collective Δθ · Every Point, Trim Rotor Speed Ω · Every Point, Trim Collective Δθ · Hover Only, Trim Rotor Speed Ω · Hover Only. The trim target is the Conditions target (CT or T).
- **UX-19c** — Sweep plots offer three selectable colour palettes; plots are static with a tap readout.
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
- **UX-33** — Rotor Name is textual metadata rather than a physical scalar. On the narrowest phone layouts its editable row shall grow vertically and wrap the full name at a legible size while retaining the same column grid and touch geometry.
- **UX-34** — Every input, result and action shall be understandable to an engineer opening the app for the first time. Compact on-screen wording may use established symbols, but shall not make a quantity or action ambiguous. Symbols including σgeom, K_ind, μz, CPair and χ shall have short, accessible contextual explanations stating the physical meaning and the convention used here.
- **UX-35** — Tapping any row label in Column 1 shall open comprehensive contextual help. Tapping a selectable parameter in Column 2 (Airfoil, Tip Loss, Compressibility, Trim Condition, Inflow Model) shall open the dedicated selection modal sheet. Tapping a unit control in Column 3 with alternatives shall open its unit selector. A single-unit or dimensionless unit button retains the grid footprint, displaying an invariant dash (`–`).
- **UX-36** — Main screens shall favor short rows and contextual help over permanent descriptive paragraphs. Important actions shall be visible in the app, without requiring external documentation or trial and error to discover them.
- **UX-37** — Every popup/dialog shall have a contextual title, self-explanatory options, a clear indication of the current selection where applicable, and a working Cancel path. A popup shall exist only when it serves a current user action; obsolete popup flows shall be removed.
- **UX-38** — Engineering indices shall use clear mathematical typography when the platform can render them legibly (for example x₀, c₀, c₁, a₀ and inverse units such as rad⁻¹). Mathematical meaning and font legibility take precedence over decorating every symbol. Results shall reserve enough width for long numerical values and units such as slug/ft³ at 320 dp with 130% font scale.
- **UX-39** — Android system-bar and display-cutout insets define the usable viewport, including Android 16 edge-to-edge enforcement. Headers, controls, plots and footers must remain outside system bars after rotation or Activity recreation; no IME library or runtime permission is used for layout.
- **UX-40** — Privacy Policy is available from the global menu in both themes, offline. The public store policy and in-app policy describe the same local storage and user-controlled Android file-provider behavior.
- **UX-41** — Atmosphere fields use the names Altitude and Temperature. The operating-pair selector is named Trim Condition. Horizontal advance ratio uses μₓ consistently in inputs, results, plots, contextual help and visible exports; internal SI state and engine conventions remain unchanged. Use full engineering names wherever they fit and reflow these labels before reducing type size.
- **UX-42** — Flow quantities use the canonical names μₓ — Advance Ratio, α — AoA, Vx — Airspeed and Vz — Climb Speed. Selector buttons show the name alongside the symbol where width permits; compact symbols retain directly accessible, named selector options. The existing positive axial-flow convention remains explicit in contextual help.
- **UX-43** — Reference may be abbreviated as Ref. in visible area and solidity labels. Contextual help retains the complete physical definition.

## 9. Verification/release

- **QA-1** — Geometry tests shall verify radius scaling, AR, σgeom, σact, σthrust, and taper preservation.
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
- **QA-26** — Audit every Geometry and Conditions input, variable/model selector, unit control, derived value and action, plus every Results coefficient and Sweep control, as a first-time engineer would. Verify that the visible wording or tap-accessible help explains its meaning and that tapping it produces the expected action without prior code knowledge.
- **QA-27** — For every reachable popup/dialog, record the opening action and verify its title, option wording, selected state, Cancel behavior, unit/model terminology and continuing purpose. Also identify non-selector labels that still lack contextual help.
- **QA-28** — Inspect the flow input rows for redundant small equivalent-value text, inspect Geometry displayed precision and legible indices, and verify long Results values/units and Sweep titles/tick labels at 320 dp with 130% font scale.

- **QA-29** — Inspect status/navigation-bar separation in portrait and landscape and verify the Privacy Policy menu action in both themes.

- **QA-30** — Run the locally compiled B4A engine against the Python reference, including all six operating pairs in hover, forward flight and nonzero axial flow, plus default RPM + CT target closure. Tolerances and the invalid-to-valid collective-bracket regression are documented in `docs/trim-regression-2026-09-30.md`.


## APK 1.23 — result diagnostics

Native APK only: versionCode 6. Add total axial speed V_{z,tot}, advancing/retreating tip tangential speed, retreating tip Mach and section AoA/inflow angles at 75% radius. Preserve Climb Speed V_z. Adv./Ret. abbreviations are allowed; result symbols remain present with native subscripts, one line without truncation. Section diagnostics use final trimmed geometry and prescribed inflow; no changes to integrated rotor loads. Local QA evidence is recorded in qa-results.

APK output labels put the symbol after the name, as explicitly requested. Compact V_{z,tot} caption is Axial Speed. Width measurement includes the real 72% subscript size and system font scale.


Latest APK label correction: omit Section in full AoA names; abbreviated names are Adv. AoA, Ret. AoA, Adv. Inflow, Ret. Inflow. Minimum is symbol-only. See docs/apk-label-catalog.md for all canonical and fixed control captions. Emulator validation is performed only when explicitly requested by the user; this overrides automatic emulator QA for routine edits.


### APK — nomes aprovados e nível intermediário de forças (2026-10-01)

- Ordem responsiva: L completo → M curto → A abreviado → S estreito → mínimo. Results agora também tenta S antes do símbolo.
- Símbolo sempre depois do nome, com subscritos; mínimo somente símbolo para grandezas com símbolo.
- sigmaT: A/S `Thr. Solidity σ_TR`; comp: A/S `Compres.`, mínimo `Comp.`.
- T0: S `Temp. T_amb`; drag: A/S `Integration`, mínimo `Integ.`.
- LDe: A/S `Eff. (L/D)_e`, sem duplicar a razão no nome.
- rpmNom: L/M `Rotor Speed Ω_nom`, A/S `Rot. Speed Ω_nom`; rpm: A/S `Rot. Speed Ω`.
- muLam: M/A/S `Advance/Inflow μ/λ`. Mtip: L `Tip Mach M_tip`; Madv: L `Advancing Tip Mach M_adv`. Sem “Number”.
- Induced Factor permanece como está.
- Hi/CHi: M `Induced In-Plane Force`, A `Ind. In-Plane Force`, S `Ind. In-Plane`; H0/CH0: M `Profile In-Plane Force`, A `Prof. In-Plane Force`, S `Prof. In-Plane`. Cada nível mantém seu símbolo após o nome.
- O ajuste mede a largura e remove “Force” no nível S quando necessário, antes de recorrer somente ao símbolo. A tabela completa é gerada em docs/apk-label-catalog.*.
- Testes no emulador somente mediante pedido explícito do usuário.


### Pontuação das abreviações do APK (2026-10-01)

Usar `Adv.`, `Act.`, `Geom.`, `Thr.`, `Prof.`, `Ind.`, `Rot.` e `Eff.` em todos os níveis abreviados. `Coeff` e `Dyn` permanecem sem ponto. Nomes completos e símbolos não mudam. O nível intermediário sem Force continua antes do símbolo.

## 10. Release 1.24 Requirements (versionCode 7)

- **NAV-1 / UX-44** — Horizontal Swipe Navigation:
  - The application shall support horizontal swipe gestures across the three primary tabs: `GEOMETRY` $\longleftrightarrow$ `CONDITIONS` $\longleftrightarrow$ `RESULTS`.
  - The gesture recognizer shall use horizontal velocity and diagonal angle rejection to prevent accidental tab switching during vertical scrolling.
  - Active modal sheets, popups, and dialogs shall suppress swipe tab transitions while open.

- **UX-45** — Haptic Feedback:
  - All interactive buttons, clickable label controls (Column 1), and clickable unit controls (Column 3) shall trigger subtle 15ms haptic vibration upon touch.

- **PLOT-19b** — Full Engineering Dataset CSV Export:
  - The parameter sweep shall provide a modal export choice between:
    1. "Current Chart CSV" (plotted curve values vs advance ratio);
    2. "Full Dataset CSV" (complete rotor geometry inputs, ISA flight conditions, baseline operating point, and all 21 calculated aerodynamic variables per sample).

- **UX-46** — Title Case Typography and Compressibility Simplification:
  - Modal choice sheets, status toggles, and picker buttons shall use standardized Title Case typography (e.g., "On", "Off", "None", "Fixed", "Sissingh", "Uniform").
  - The compressibility control shall display strictly "On" or "Off", without the "P-G" or "Prandtl-Glauert" prefix in the button face.

- **UX-47** — Results Status Banner Equalization:
  - In Results, the Trim Condition banner and the Model Validity banner shall share equal vertical height (36–38px), compact typography, and neutral secondary styling across all themes.

- **UX-48** — Column 1 vs Column 2 Interaction Separation:
  - Column 1 (Label Button) touches shall strictly route to comprehensive contextual help (`ShowHelpFor` / `showContextualHelp`).
  - Column 2 (Value Button) touches for discrete parameters shall open the parameter selection modal sheet (Airfoil, Tip Loss, Compressibility, Inflow Model, Trim Condition).

- **PWA-1** — Web Application Installation:
  - The web application shall provide an install icon button (`📥`) in the header adjacent to the options menu.
  - The options menu shall expose an "Install App" action positioned immediately prior to "About".

- **LIB-9** — Multi-Format Geometry Sharing:
  - Geometry backup and sharing shall support both human-readable text (`.txt`) and structured JSON (`.json`) formats.
  - Import workflows shall report the count of discovered rotors and provide interactive conflict resolution (Rename, Replace, Skip).

- **THEME-1** — Three-Theme Parity:
  - Support Default Dark, Light, and Midnight themes with identical visual hierarchy, contrast compliance, and state preservation across all screens and offline manuals.

