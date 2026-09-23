# RotorCalculator — Software Requirements

> **Status:** Binding implementation specification for RotorCalculator 1.20+  
> **Physics reference:** `tools/zBET.py` and the zBEMT planform convention.  
> **UI reference:** AeroCalculator interaction principles, adapted where RotorCalculator can be clearer or more capable.

Each requirement has a stable identifier. Product screens are specified positively by the data and actions they present.

## 1. Product structure

- **ARCH-1** — RotorCalculator shall provide three primary tabs: **Geometry**, **Conditions**, and **Results**.
- **ARCH-2** — Geometry shall define the rotor and blade model.
- **ARCH-3** — Conditions shall define atmosphere, flight condition, RPM/collective/target constraints, inflow model, and induced-power factor.
- **ARCH-4** — Results shall present the solved aerodynamic, dimensional, atmospheric, and trim state.
- **ARCH-5** — Normal calculator edits shall update dependent values and results immediately.
- **ARCH-6** — Symbols, signs, equations, and equivalent-input conversions shall follow zBET/zBEMT.
- **ARCH-7** — The interface shall follow AeroCalculator principles: compact engineering rows, immediate feedback, explicit selectors, large mobile touch targets, persistent settings, and contextual help.

## 2. Geometry

### 2.1 Geometry editor and rotor library

- **GEO-1** — The Geometry tab shall be a complete in-page editor.
- **GEO-2** — A compact top strip shall show **Loaded rotor: <name>**.
- **GEO-3** — The editor shall contain two visually consistent stacked panels using the same row layout:
  1. **Blade Geometry**;
  2. **Rotor Aerodynamics**.
- **GEO-4** — The bottom action row shall contain **LOAD ROTOR**, **SAVE**, and **SAVE AS NEW**.
- **GEO-5** — **LOAD ROTOR** shall open the rotor library/preset selector.
- **GEO-6** — **SAVE** shall update the currently loaded local rotor.
- **GEO-7** — **SAVE AS NEW** shall create a new rotor with a unique name.
- **GEO-8** — If unsaved edits exist before loading another rotor, the user shall receive **Save / Discard / Cancel**.
- **GEO-9** — Factory presets shall be editable as local working definitions and recoverable through **Restore Factory Presets**.

### 2.2 Synchronized blade geometry

- **GEO-10** — Blade Geometry inputs shall include:
  - rotor radius (R) [m];
  - number of blades (N_b) [-];
  - root cutout (x_0=r_0/R) [-];
  - reference root chord (c_0) [m] at (r/R=0);
  - tip chord (c_1) [m] at (r/R=1);
  - reference solidity (sigma_{ref}) [-];
  - blade reference aspect ratio (AR) [-];
  - root incidence (	heta_{root}) [deg];
  - tip incidence (	heta_{tip}) [deg].
- **GEO-11** — The linear reference chord law shall be
  [
  c(x)=c_0+(c_1-c_0)x,qquad 0le xle1.
  ]
- **GEO-12** — Reference single-blade area shall be
  [
  S_{ref,b}=Rint_0^1c(x),dx=rac{R(c_0+c_1)}{2}.
  ]
- **GEO-13** — Reference aspect ratio shall be
  [
  AR=rac{R^2}{S_{ref,b}}=rac{2R}{c_0+c_1}.
  ]
- **GEO-14** — Reference solidity shall be
  [
  sigma_{ref}=rac{N_bS_{ref,b}}{pi R^2}=rac{N_b}{pi AR}.
  ]
- **GEO-15** — Editing (c_0) or (c_1) shall recompute (AR) and (sigma_{ref}).
- **GEO-16** — Editing radius shall preserve (sigma_{ref}), (AR), taper ratio, and normalized chord distribution by scaling (c_0) and (c_1) in direct proportion to (R).
- **GEO-17** — Editing (sigma_{ref}) shall scale both chords by one factor, preserving taper ratio, and shall recompute (AR=N_b/(pisigma_{ref})).
- **GEO-18** — Editing (AR) shall scale both chords by one factor, preserving taper ratio, and shall recompute (sigma_{ref}=N_b/(pi AR)).
- **GEO-19** — Editing (N_b) shall update (sigma_{ref}) while preserving (AR), (c_0), and (c_1).
- **GEO-20** — Editing (x_0) shall preserve the reference planform metrics and shall update active-span metrics and BET integration limits.
- **GEO-21** — Root and tip incidence define the baseline linear pitch law. Operating collective shall be a uniform increment (Delta	heta) added to both:
  [
  	heta_{root,op}=	heta_{root}+Delta	heta,qquad
  	heta_{tip,op}=	heta_{tip}+Delta	heta.
  ]

### 2.3 Derived blade geometry

- **GEO-22** — Read-only derived geometry shall show:
  - geometric solidity (sigma_{geom});
  - thrust-weighted solidity (sigma_{thrust});
  - taper ratio (c_1/c_0);
  - disk area (A=pi R^2);
  - reference single-blade area (S_{ref,b});
  - active blade area over (x_0le xle1);
  - total twist (	heta_{tip}-	heta_{root}).
- **GEO-23** — Geometric solidity shall use active physical blade area:
  [
  sigma_{geom}=rac{N_b}{pi R}int_{x_0}^{1}c(x),dx.
  ]
- **GEO-24** — Thrust-weighted solidity shall follow zBET:
  [
  sigma_{thrust}=3int_{x_0}^{1}x^2sigma(x),dx,qquad
  sigma(x)=rac{N_bc(x)}{pi R}.
  ]

### 2.4 Rotor Aerodynamics panel

- **GEO-25** — Rotor Aerodynamics shall use the same row/panel visual language as Blade Geometry.
- **GEO-26** — Inputs shall include:
  - airfoil preset;
  - lift-curve slope (a_0) [rad⁻¹];
  - (C_{d0});
  - tip-loss model;
  - fixed (B) when Fixed-B tip loss is selected;
  - Prandtl-Glauert compressibility toggle.
- **GEO-27** — Tip-loss choices shall be **None**, **Fixed B**, and **Sissingh**.
- **GEO-28** — Selecting an airfoil preset may populate (a_0) and (C_{d0}), while keeping both numerical values visible and editable.
- **GEO-29** — Every Geometry row shall expose mobile-accessible contextual help.

### 2.5 Saved-rotor migration

- **GEO-30** — Saved rotor data shall use an explicit schema/version marker.
- **GEO-31** — Legacy saved rotors shall be migrated once while preserving their original active-span chord law at the saved root cutout.
- **GEO-32** — For a legacy root chord defined at (x_0), the reference-axis chord shall be reconstructed as
  [
  c_0=c_{root@x_0}-rac{(c_1-c_{root@x_0})x_0}{1-x_0}.
  ]
- **GEO-33** — Migration tests shall confirm that the migrated law reproduces the original chord at (x_0).

## 3. Conditions

### 3.1 Atmosphere

- **COND-1** — Conditions shall include **Altitude** [m] and **Temperature** [°C].
- **COND-2** — Atmospheric outputs shall be derived from these inputs and reported in Results.

### 3.2 Horizontal flow

- **COND-3** — Horizontal Flow shall provide a representation selector **(mu) / (V_x)**.
- **COND-4** — The selected representation shall be editable and the equivalent representation shall be visible as a derived value.
- **COND-5** — The conversion shall be
  [
  mu=rac{V_x}{Omega R}.
  ]

### 3.3 Axial flow

- **COND-6** — Axial Flow shall provide a representation selector **(alpha) / (V_z) / (mu_z)**.
- **COND-7** — The selected representation shall be editable and the other equivalent representations shall be shown as derived values when defined.
- **COND-8** — The sign convention shall be:
  - (+V_z): positive climb rate, with relative wind from above the rotor and through the disk;
  - (+mu_z): the corresponding positive downward relative flow through the disk;
  - (+alpha): relative wind arriving from below the rotor disk.
- **COND-9** — The equivalent-input relations shall be
  [
  mu_z=-mu	analpha,qquad
  mu_z=rac{V_z}{Omega R}.
  ]
- **COND-10** — At zero forward speed, dimensional axial flow shall be specified through (V_z) or (mu_z).

### 3.4 Operating constraint pair: RPM, collective, CT, thrust

The operating state contains four linked quantities:
**RPM**, **collective increment (Delta	heta)**, **(C_T)**, and **Thrust**.
The user prescribes any two; RotorCalculator solves the other two at the selected atmosphere and flight condition.

- **COND-11** — **Operating Inputs** shall offer these six explicit pairs:
  1. **RPM + Collective**;
  2. **RPM + CT**;
  3. **RPM + Thrust**;
  4. **Collective + CT**;
  5. **Collective + Thrust**;
  6. **CT + Thrust**.
- **COND-12** — Conditions shall show only the two editable quantities belonging to the selected pair, plus compact read-only derived previews when useful.
- **COND-13** — Collective shall mean a constant pitch increment (Delta	heta) along the blade, added equally to root and tip incidence.
- **COND-14** — **RPM + Collective** shall directly prescribe the operating rotor; (C_T) and Thrust are outputs.
- **COND-15** — **RPM + CT** shall hold RPM and target (C_T) and solve collective.
- **COND-16** — **RPM + Thrust** shall hold RPM and target dimensional thrust and solve collective.
- **COND-17** — **Collective + CT** shall hold collective and target (C_T) and solve RPM.
- **COND-18** — **Collective + Thrust** shall hold collective and target thrust and solve RPM.
- **COND-19** — **CT + Thrust** shall solve the RPM required by dimensional scaling and the collective required by the aerodynamic target.
- **COND-20** — Every trim solution shall be computed at the **current flight condition**, including forward flight and climb/descent, rather than being intrinsically a hover-only trim.
- **COND-21** — The solved RPM, collective, (C_T), and thrust shall all be reported in Results.
- **COND-22** — Dimensional/nondimensional flow conversions that depend on (Omega R) shall use the solved operating RPM.

### 3.5 Aerodynamic-model inputs

- **COND-23** — Conditions shall include the inflow-model selector:
  **Uniform**, **Coleman Simple**, **Coleman-Feingold**, **Drees**.
- **COND-24** — Conditions shall include induced-power factor **(K_{ind})**.
- **COND-25** — Profile drag shall always use the **Numerical Vectorial** formulation.
- **COND-26** — The Numerical Vectorial profile-drag model shall be documented in help rather than exposed as a user-selectable model.
- **COND-27** — Each selector/field shall open concise contextual help with definition, equation, sign convention, and units.

## 4. Results

- **RES-1** — Results shall use these sections in order:
  1. **DIMENSIONAL PERFORMANCE**;
  2. **AERODYNAMIC COEFFICIENTS**;
  3. **EFFICIENCY**;
  4. **INFLOW & WAKE**;
  5. **OPERATING STATE & ATMOSPHERE**.
- **RES-2** — DIMENSIONAL PERFORMANCE shall contain dimensional thrust, shaft power, shaft torque, in-plane force, and other dimensional forces available from the engine.
- **RES-3** — AERODYNAMIC COEFFICIENTS shall contain **all aerodynamic coefficients together**:
  [
  C_T, C_Q(=C_{P,shaft}), C_{Qi}, C_{Q0},  C_H, C_{Hi}, C_{H0}, C_Y, C_{Mx}, C_{My}, C_{P,air}.
  ]
- **RES-4** — EFFICIENCY shall contain (FoM) and ((L/D)_{eff}).
- **RES-5** — INFLOW & WAKE shall contain (lambda), (lambda_i), (K_x), (K_y), (chi), and tip-loss factor (B).
- **RES-6** — OPERATING STATE & ATMOSPHERE shall contain:
  - solved RPM;
  - solved collective (Delta	heta);
  - solved (C_T);
  - solved thrust;
  - operating (mu), (V_x), (mu_z), (V_z), and (alpha) where defined;
  - tip speed;
  - tip Mach and advancing-tip Mach;
  - altitude;
  - temperature;
  - density (ho);
  - ambient pressure (p);
  - speed of sound (a);
  - model/trim status.
- **RES-7** — Variable-specific baseline precision shall be used.
- **RES-8** — **+1 Decimal** shall add exactly one decimal place to every baseline output format.
- **RES-9** — Invalid operating points shall be clearly identified.
- **RES-10** — Every result row shall have contextual physics/equation help.

## 5. Parameter plots

The plot tool shall combine the **broad capability of the original sweep** with the **cleaner appearance of the current implementation**.

### 5.1 Variables and axes

- **PLOT-1** — Any scalar numerical result available in Results shall be selectable as the Y variable.
- **PLOT-2** — The Y-variable catalog shall derive from shared result metadata so Results and Plot remain synchronized.
- **PLOT-3** — The primary X variable shall be (mu), with an equivalent display option (V_x) [m/s].
- **PLOT-4** — The X range shall be user-selectable.
- **PLOT-5** — The active operating point shall be shown when it lies within the plotted range.

### 5.2 Curve families

- **PLOT-6** — Curve Family shall support:
  - **Active Only**;
  - **Inflow Models**;
  - **(alpha) Family**;
  - **(V_z) Family**;
  - **(mu_z) Family**.
- **PLOT-7** — Default family values shall preserve the useful legacy sets:
  - (alpha): (-10,-5,0,+5,+10) deg;
  - (V_z): (-10,-5,0,+5,+10) m/s;
  - (mu_z): (-0.050,-0.025,0,+0.025,+0.050).
- **PLOT-8** — A small **VALUES** button shall allow family values to be edited as a comma-separated list.
- **PLOT-9** — Edited family values shall be validated, normalized, and retained for the session.
- **PLOT-10** — A family shall vary only its designated quantity and shall preserve the remaining active condition.

### 5.3 Trim behavior in plots

- **PLOT-11** — When the selected operating pair contains fixed (C_T) or fixed Thrust, Plot shall show a checkbox **Trim only in hover**.
- **PLOT-12** — With **Trim only in hover = OFF**, each sweep point shall solve the selected operating constraint pair at that point's flight condition.
- **PLOT-13** — With **Trim only in hover = ON**, RotorCalculator shall solve the selected constraints once at hover ((mu=0,mu_z=0)), then hold the resulting RPM and collective constant throughout the sweep.
- **PLOT-14** — CSV and TABLE shall state whether the sweep used per-point trim or hover-only fixed trim.

### 5.4 Presentation and export

- **PLOT-15** — Plot controls shall use explicit selectors/buttons.
- **PLOT-16** — Multi-curve legends shall remain outside the data region and shall preserve every curve identity.
- **PLOT-17** — Narrow screens may wrap legends over multiple rows.
- **PLOT-18** — Invalid samples shall produce gaps rather than false zeros.
- **PLOT-19** — TABLE shall contain **all currently plotted curves** and the same sampling grid as the plot.
- **PLOT-20** — CSV shall export the exact sampled plot dataset.
- **PLOT-21** — PNG shall export the displayed graph with title, axes, theme, active marker, and legend.
- **PLOT-22** — CSV/PNG shall use Android Storage Access Framework without broad storage permission.
- **PLOT-23** — Plot selections shall persist while the app remains open.

## 6. Rotor-library import/export

- **LIB-1** — Settings shall provide **Import Geometries** and **Export Geometries**.
- **LIB-2** — Export Geometries shall write the complete saved-rotor database to one portable, versioned text file suitable for backup or sharing.
- **LIB-3** — Import Geometries shall read that file and present the number of valid rotors before confirmation.
- **LIB-4** — Import shall merge imported rotors with the local database rather than silently deleting unrelated local rotors.
- **LIB-5** — Name conflicts shall be resolved explicitly by rename/replace/skip behavior; no unrelated rotor shall be overwritten silently.
- **LIB-6** — Import shall validate schema and numeric domains before committing any changes.
- **LIB-7** — Export shall use the Android document picker; import shall use the Android content picker/document provider.
- **LIB-8** — The interchange file shall preserve geometry, aerodynamic definition, schema version, and rotor names without loss of numeric precision.

## 7. Settings and help

- **SET-1** — Settings shall include:
  - Theme: **Dark / Light**;
  - Result Units: **SI / Imperial**;
  - Output Format: **Standard / +1 Decimal**;
  - **Import Geometries**;
  - **Export Geometries**.
- **SET-2** — Theme, units, and precision shall persist across restart.
- **SET-3** — The global menu shall expose Physics & Equations, zBET/zBEMT Conventions, Quick Unit Converter, Restore Factory Presets, Settings, and About.
- **SET-4** — Physics & Equations shall be fully offline and shall describe the implemented equations and limitations.

## 8. Visual and mobile requirements

- **UX-1** — Geometry and Conditions shall use a consistent AeroCalculator-inspired row system with clear section headers and aligned value/unit columns.
- **UX-2** — Primary touch targets shall be approximately 48 dp high or larger.
- **UX-3** — A selector tap on mobile shall be sufficient to reveal its alternatives; hover-only discovery shall never be required.
- **UX-4** — Labels shall also be tappable for detailed help.
- **UX-5** — Dark and Light themes shall provide equivalent hierarchy and contrast.
- **UX-6** — No value, unit, legend, label, or button shall clip at supported portrait widths.
- **UX-7** — The header shall remain compact; rotor identity is shown in Geometry's Loaded Rotor strip.

## 9. Verification and release

- **QA-1** — Geometry synchronization shall have independent tests for radius scaling, (AR), (sigma_{ref}), (sigma_{geom}), (sigma_{thrust}), and taper preservation.
- **QA-2** — All six operating-input pairs shall have numerical tests in hover, forward flight, and nonzero axial flow.
- **QA-3** — Tests shall verify that collective trim adds a constant (Delta	heta) to root and tip incidence.
- **QA-4** — Plot tests shall iterate through every Y variable, every family, custom family lists, and both trim-only-hover states.
- **QA-5** — TABLE, CSV, and plotted curves shall be generated from the same sampled data.
- **QA-6** — Geometry import/export shall round-trip without numeric or naming loss.
- **QA-7** — UI smoke tests shall cover Light/Dark, portrait/landscape, cold restart, geometry load/save, all six operating pairs, plot export, and help.
- **QA-8** — Release APK/AAB shall be built from the exact approved main commit, installed, operated, and visually reviewed before being considered current.
