# RotorCalculator — Software Requirements

> **Status:** DRAFT FOR REVIEW  
> **Target:** RotorCalculator 1.20+  
> **Primary references:** `tools/zBET.py`, zBEMT planform conventions, and this document.  
> After approval, this document becomes the binding product/UI specification. Implementation details in older plans or source comments that conflict with it must be updated.

Each requirement has a stable identifier. Requirements use normative language: **shall**, **must**, or **shall not**.

## 1. Product architecture

- **ARCH-1** — RotorCalculator shall provide three primary tabs: **Geometry**, **Conditions**, and **Results**.
- **ARCH-2** — Geometry shall define the rotor/blade model. Conditions shall define the operating state, including RPM and trim targets. Results shall contain computed outputs only.
- **ARCH-3** — RPM shall **not** be classified or presented as rotor geometry.
- **ARCH-4** — Every numerical change that defines the current case shall update dependent values and results immediately; a separate RUN button shall not be required for the normal calculator workflow.
- **ARCH-5** — Equivalent representations of the same physical input shall be mutually exclusive. The application shall never silently add equivalent representations together.
- **ARCH-6** — The user-facing convention, symbols, equations, and signs shall remain consistent with zBET and zBEMT.
- **ARCH-7** — The application shall preserve the AeroCalculator interaction principles: compact technical forms, immediate feedback, clear selectors, persistent settings, large touch targets, and contextual help accessible on mobile.

## 2. Geometry

### 2.1 Geometry-tab layout

- **GEO-1** — The Geometry tab shall be a complete editor. A rotor list shall not be the primary Geometry screen and geometry editing shall not require opening a geometry popup.
- **GEO-2** — The top of the Geometry tab shall contain a compact strip:
  **Loaded rotor: <rotor name>**.
- **GEO-3** — The bottom of the Geometry editor shall expose:
  **LOAD ROTOR**, **SAVE**, and **SAVE AS NEW**.
- **GEO-4** — **LOAD ROTOR** shall open the rotor library/preset selector without replacing the Geometry editor itself.
- **GEO-5** — **SAVE** shall overwrite the currently loaded local rotor definition.
- **GEO-6** — **SAVE AS NEW** shall create a new local rotor definition and require a unique name.
- **GEO-7** — If unsaved Geometry changes exist when loading another rotor, the app shall offer Save, Discard, or Cancel.
- **GEO-8** — Factory presets shall be locally editable. The global menu shall provide **Restore Factory Presets**.
- **GEO-9** — The rotor name shall not appear in the global app header.

### 2.2 Authoritative planform inputs

The synchronized planform shall follow the zBEMT reference-planform convention.

- **GEO-10** — Editable planform inputs shall include:
  - rotor radius (R) [m];
  - number of blades (N_b) [-];
  - root cutout (x_0=r_0/R) [-];
  - reference root chord (c_0) [m] at (r/R=0);
  - tip chord (c_1) [m] at (r/R=1);
  - reference solidity (sigma_{ref}) [-];
  - blade reference aspect ratio (AR) [-].
- **GEO-11** — RPM shall not appear in this Geometry input group.
- **GEO-12** — For a linear reference planform,
  [
  c(x)=c_0+(c_1-c_0)x,qquad 0le xle1.
  ]
- **GEO-13** — The reference single-blade planform area shall be
  [
  S_{ref,b}=Rint_0^1 c(x),dx
           =rac{R(c_0+c_1)}{2}.
  ]
- **GEO-14** — Reference aspect ratio shall follow the zBEMT definition
  [
  AR=rac{R^2}{S_{ref,b}}
    =rac{2R}{c_0+c_1}.
  ]
- **GEO-15** — Reference solidity shall be
  [
  sigma_{ref}=rac{N_bS_{ref,b}}{pi R^2}
              =rac{N_b}{pi AR}.
  ]
- **GEO-16** — Editing (c_0), (c_1), or (R) shall immediately recompute (AR) and (sigma_{ref}).
- **GEO-17** — Editing (sigma_{ref}) shall scale (c_0) and (c_1) by one common factor, preserving taper ratio (c_1/c_0), and shall recompute (AR=N_b/(pisigma_{ref})).
- **GEO-18** — Editing (AR) shall scale (c_0) and (c_1) by one common factor, preserving taper ratio, and shall recompute (sigma_{ref}=N_b/(pi AR)).
- **GEO-19** — Editing (N_b) shall change (sigma_{ref}) but shall not change (AR), (c_0), or (c_1).
- **GEO-20** — Editing root cutout (x_0) shall not change reference (AR), reference (sigma_{ref}), (c_0), or (c_1).
- **GEO-21** — Root cutout shall affect only active-span/physical metrics and BET integration limits.

### 2.3 Derived geometry

- **GEO-22** — The Geometry tab shall show, as read-only derived outputs:
  - (sigma_{geom});
  - (sigma_{thrust});
  - taper ratio (c_1/c_0);
  - disk area (A=pi R^2);
  - reference single-blade area (S_{ref,b});
  - active physical blade area from (x_0) to 1.
- **GEO-23** — Geometric solidity shall use only physical blade area on the active span:
  [
  sigma_{geom}=
  rac{N_b}{pi R}int_{x_0}^{1}c(x),dx.
  ]
- **GEO-24** — Thrust-weighted solidity shall follow zBET:
  [
  sigma_{thrust}
  =3int_{x_0}^{1}x^2sigma(x),dx,qquad
  sigma(x)=rac{N_bc(x)}{pi R}.
  ]
- **GEO-25** — Derived fields shall never be editable simultaneously with their authoritative source in a way that creates an over-constrained geometry.

### 2.4 Rotor aerodynamic definition

- **GEO-26** — The rotor definition shall retain the airfoil/section aerodynamic inputs required by zBET: lift-curve slope (a_0), profile drag (C_{d0}), airfoil preset, tip-loss model, and compressibility option.
- **GEO-27** — Tip-loss choices shall be **None**, **Fixed B**, and **Sissingh**.
- **GEO-28** — Sissingh shall be presented only as a tip-loss model, never as an inflow model.
- **GEO-29** — Airfoil selection may populate (a_0) and (C_{d0}), but those numerical fields shall remain inspectable.
- **GEO-30** — All Geometry labels shall have mobile-accessible contextual help.

### 2.5 Migration of existing saved rotors

- **GEO-31** — Existing saved rotors shall be migrated explicitly; the migration shall not silently alter their original active-span chord distribution at the saved root cutout.
- **GEO-32** — Legacy `ChordRoot`, currently defined at (x_0), shall be converted to the new reference-axis chord:
  [
  c_0=
  c_{root@x_0}
  -rac{(c_1-c_{root@x_0})x_0}{1-x_0}.
  ]
- **GEO-33** — After migration, evaluating the new reference law at the original (x_0) shall reproduce the legacy root-cutout chord within numerical tolerance.
- **GEO-34** — Legacy constant-chord `sigma_ref` and `sigma_geom` definitions shall be converted without changing the original blade law at the migration point.
- **GEO-35** — The persisted rotor format shall carry a schema/version identifier so migration is performed once and is testable.

## 3. Conditions and operating modes

### 3.1 Atmosphere

- **COND-1** — Conditions shall contain altitude and temperature.
- **COND-2** — Density (ho), ambient pressure (p), and speed of sound (a) shall be derived consistently from the selected atmospheric inputs and shown as derived information/results.
- **COND-3** — Atmosphere edits shall immediately update dimensional/nondimensional conversions and results.

### 3.2 Horizontal-flow input

- **COND-4** — Horizontal flow shall have a selector with exactly two equivalent input representations:
  **(mu)** and **(V_x)**.
- **COND-5** — Only the selected horizontal representation shall be editable.
- **COND-6** — The non-selected representation shall remain visible as a read-only derived value.
- **COND-7** — The relation shall be
  [
  mu=rac{V_x}{Omega R}.
  ]
- **COND-8** — (+V_x) shall mean forward in-plane flow.

### 3.3 Axial-flow input

- **COND-9** — Axial flow shall have a selector with exactly three equivalent representations:
  **rotor angle of attack (alpha)**, **axial velocity (V_z)**, and **(mu_z)**.
- **COND-10** — Only the selected axial representation shall be editable.
- **COND-11** — The other two axial representations shall remain visible as read-only derived values when mathematically defined.
- **COND-12** — The zBET/zBEMT sign convention shall be:
  - (+z) downward through the rotor disk;
  - (+V_z) downward through the disk;
  - (+mu_z) downward;
  - (alpha>0) means the free stream arrives from below the disk.
- **COND-13** — The conversion equations shall be
  [
  mu_z=-mu	analpha
  ]
  for angle input,
  [
  mu_z=rac{V_z}{Omega R}
  ]
  for dimensional axial-speed input, and direct assignment for (mu_z) input.
- **COND-14** — (alpha), (V_z), and (mu_z) shall never be summed as independent axial contributions.
- **COND-15** — At (V_x=0), nonzero axial flow shall require (V_z) or (mu_z); the UI shall explain why (alpha) alone is not a unique nonzero axial-flow representation.

### 3.4 RPM, pitch, trim, and target modes

RPM is an operating condition. The UI shall expose the same logical modes as zBET.

- **COND-16** — Conditions shall contain **Trim Mode** with:
  1. **Manual / Prescribed** (`none`);
  2. **Collective Trim** (`collective`);
  3. **RPM Trim** (`rpm`).
- **COND-17** — Conditions shall contain **Pitch Mode** with:
  **Constant** and **Linear Twist**.
- **COND-18** — In **Manual / Prescribed** mode:
  - RPM shall be editable;
  - pitch shall be editable;
  - no CT/thrust target shall control the solver;
  - thrust and (C_T) shall be outputs.
- **COND-19** — In **Collective Trim** mode:
  - RPM shall be editable and fixed during trim;
  - the user shall choose target type **(C_T)** or **Thrust**;
  - only the selected target shall be editable;
  - collective pitch shall be solved;
  - for linear twist, the total twist (	heta_{tip}-	heta_{root}) shall remain constant while the pitch distribution is shifted.
- **COND-20** — In **RPM Trim** mode:
  - pitch/twist shall be editable and fixed during trim;
  - target **Thrust [N]** shall be editable;
  - RPM shall be a derived solved value and shall not be editable;
  - (C_T) shall be a result, not an RPM-trim target.
- **COND-21** — The UI shall not offer RPM-to-(C_T) as a trim mode.
- **COND-22** — When target type is (C_T), target Thrust shall be shown only as a derived equivalent using the current fixed RPM and atmosphere.
- **COND-23** — When target type is Thrust in Collective Trim, target (C_T) shall be shown as the derived equivalent.
- **COND-24** — Changing trim mode shall immediately update which controls are editable, derived, hidden, or disabled.
- **COND-25** — A target that is not applicable to the selected trim mode shall not remain active in solver state.
- **COND-26** — The resolved post-trim RPM and collective shall be visible in Results.
- **COND-27** — Any (V_xleftrightarrowmu), (V_zleftrightarrowmu_z), Mach, or dimensional conversion that depends on (Omega R) shall use the **resolved operating RPM** when RPM Trim is active.

### 3.5 Model selectors

- **COND-28** — Inflow Model shall be an explicit selector containing:
  **Uniform**, **Coleman Simple**, **Coleman-Feingold**, and **Drees**.
- **COND-29** — Profile Drag Model shall be an explicit selector containing:
  **Analytical Tangential**, **Analytical Vectorial**, and **Numerical Vectorial**.
- **COND-30** — Hidden cycling through model choices shall not be used.
- **COND-31** — Each selector and each field label shall expose a concise popup helper with its physical meaning, governing relation, sign convention, and units.
- **COND-32** — On mobile, tapping the selector itself may show a one-line convention hint after selection, but this shall not block continued editing.

## 4. Results

- **RES-1** — Results shall be grouped by engineering meaning, not by implementation order.
- **RES-2** — The section order shall be:
  1. **DIMENSIONAL PERFORMANCE**;
  2. **AERODYNAMIC COEFFICIENTS**;
  3. **EFFICIENCY**;
  4. **INFLOW & WAKE**;
  5. **OPERATING STATE**.
- **RES-3** — **DIMENSIONAL PERFORMANCE** shall contain dimensional thrust, shaft power, shaft torque, and dimensional rotor forces available from the engine.
- **RES-4** — **AERODYNAMIC COEFFICIENTS** shall place **all aerodynamic coefficients together**, including:
  [
  C_T, C_Q(=C_{P,shaft}), C_{Qi}, C_{Q0},  C_H, C_{Hi}, C_{H0}, C_Y, C_{Mx}, C_{My}, C_{P,air}.
  ]
- **RES-5** — No coefficient listed in RES-4 shall be separated into a different result section merely because it corresponds to thrust, torque, force, moment, or power.
- **RES-6** — **EFFICIENCY** shall contain (FoM) and ((L/D)_{eff}).
- **RES-7** — **INFLOW & WAKE** shall contain (lambda), (lambda_i), (K_x), (K_y), wake-skew angle (chi), and tip-loss factor (B).
- **RES-8** — **OPERATING STATE** shall contain model status, resolved RPM, resolved collective/pitch state, tip speed, tip Mach, advancing-tip Mach, density, pressure, and speed of sound.
- **RES-9** — Invalid operating points shall show an explicit invalid status and shall not present placeholder zeros as valid aerodynamic results.
- **RES-10** — The Prandtl-Glauert model-range caution shall remain explicit.
- **RES-11** — Greek symbols shall use real Unicode glyphs. Subscripts shall use proper Unicode when available; otherwise the app shall use an unambiguous technical fallback such as `CQi`, never a visually false symbol.
- **RES-12** — Result precision shall be variable-specific.
- **RES-13** — The **+1 Decimal** setting shall add exactly one decimal place to each variable's baseline precision.
- **RES-14** — Every result label shall open contextual help explaining its physical definition and equation.

## 5. Parameter plots and sweeps

The plot tool shall retain the broad engineering functionality of the original RotorCalculator sweep while keeping the cleaner current visual treatment.

### 5.1 Plot variable and axes

- **PLOT-1** — The user shall be able to plot **any scalar numerical result variable against (mu)**.
- **PLOT-2** — The selectable Y-variable catalog shall derive from the same result metadata used by Results so a result cannot silently exist in Results but be unavailable to Plot.
- **PLOT-3** — At minimum the plot catalog shall include all dimensional performance outputs, every aerodynamic coefficient in RES-4, efficiency metrics, inflow/wake outputs, Mach outputs, tip-loss factor, tip speed, and resolved operating quantities that are meaningful over a (mu) sweep.
- **PLOT-4** — The primary X-axis shall be advance ratio (mu).
- **PLOT-5** — The user may switch the equivalent X-axis display to (V_x) [m/s].
- **PLOT-6** — (V_x) axis values shall use the operating (Omega R), including resolved RPM when RPM Trim is active.
- **PLOT-7** — Axis labels shall always include the correct symbol and unit.
- **PLOT-8** — The Y-axis shall autoscale from valid plotted samples and shall include the active operating point when applicable.

### 5.2 Curve families

- **PLOT-9** — The plot shall support **Single Active Condition** and multi-curve families.
- **PLOT-10** — The curve-family selector shall include:
  - **Inflow Models**: Uniform, Coleman Simple, Coleman-Feingold, Drees;
  - **(alpha) Family**;
  - **(V_z) Family**;
  - **(mu_z) Family**;
  - **Active Only**.
- **PLOT-11** — Default (alpha) family values shall be (-10,-5,0,+5,+10) deg.
- **PLOT-12** — Default (V_z) family values shall be (-10,-5,0,+5,+10) m/s.
- **PLOT-13** — Default (mu_z) family values shall be (-0.050,-0.025,0,+0.025,+0.050).
- **PLOT-14** — Family values shall be editable through a compact family-settings control without changing the live operating condition.
- **PLOT-15** — A family shall vary only its designated quantity. All non-varied operating inputs shall remain equal to the active condition.
- **PLOT-16** — (alpha), (V_z), and (mu_z) families shall use one axial representation at a time and shall never add equivalent axial inputs together.
- **PLOT-17** — Changing plot variable, family, family values, X-axis, or X-range shall redraw immediately without a RUN button.

### 5.3 Plot interaction and presentation

- **PLOT-18** — Plot controls shall be explicit dropdowns/buttons rather than hidden cycling.
- **PLOT-19** — Portrait layout shall keep controls compact and leave the majority of the screen height to the plot.
- **PLOT-20** — Landscape layout shall maximize plot area.
- **PLOT-21** — Multi-curve legends shall be complete, readable, and shall not cover the data region.
- **PLOT-22** — On narrow screens, legends may wrap to multiple rows or use compact labels, but no curve identity may be lost.
- **PLOT-23** — The active/reference curve or active operating point shall be visually distinguishable without making other curves unreadable.
- **PLOT-24** — Invalid samples shall create gaps/omissions; they shall not be drawn as zero.
- **PLOT-25** — Plot title, variable name, family, axes, and units shall remain understandable without opening help.
- **PLOT-26** — The Light and Dark themes shall both provide sufficient contrast for grid, curves, legends, active marker, and labels.
- **PLOT-27** — Reopening Plot during the same app session shall preserve the last Y-variable, family, family values, X-axis, and X-range.

### 5.4 Table and exports

- **PLOT-28** — **TABLE** shall display the numerical data for **all curves currently plotted**, not only the active condition.
- **PLOT-29** — Table headers shall identify curve/family value, X variable, (mu), (V_x), axial representation/value, model, selected Y variable, Y value, and validity status as applicable.
- **PLOT-30** — **CSV** shall export the exact sampled data used by the displayed plot, including every visible family curve and invalid-status records.
- **PLOT-31** — CSV shall use locale-independent decimal points.
- **PLOT-32** — **PNG** shall export the plot exactly as presented, including theme, axes, title, legend, and active marker.
- **PLOT-33** — CSV and PNG shall use Android Storage Access Framework / `ACTION_CREATE_DOCUMENT`; broad storage permission shall not be required.
- **PLOT-34** — Export cancellation or provider failure shall not crash the application.

## 6. Rotor library and persistence

- **LIB-1** — Factory rotors and user rotors shall be accessible from **LOAD ROTOR**.
- **LIB-2** — The library shall clearly distinguish factory presets from user-created rotors.
- **LIB-3** — The currently loaded rotor shall persist across app restart.
- **LIB-4** — SAVE shall persist the complete rotor definition required to reconstruct Geometry and default rotor-model settings.
- **LIB-5** — SAVE AS NEW shall never silently overwrite an existing rotor.
- **LIB-6** — Factory restoration shall restore factory values but shall not silently delete unrelated user-created rotors without explicit confirmation.
- **LIB-7** — Persistence shall support schema migration and shall retain a version marker.

## 7. Settings and help

- **SET-1** — Settings shall expose **Theme: Dark / Light**.
- **SET-2** — Settings shall expose **Result Units: SI / Imperial**.
- **SET-3** — Settings shall expose **Output Format: Standard / +1 Decimal**.
- **SET-4** — All settings shall persist across restart.
- **SET-5** — Changing theme shall preserve current rotor, conditions, selected tab, and unsaved edits.
- **SET-6** — The global menu shall expose **Physics & Equations**, **zBET / zBEMT Conventions**, **Quick Unit Converter**, **Restore Factory Presets**, and **About**.
- **SET-7** — Physics & Equations shall work offline.
- **SET-8** — The physics help shall document the same equations/sign conventions used by the engine and shall not list unsupported models as available choices.

## 8. Numerical and physical consistency

- **PHY-1** — `tools/zBET.py` shall remain the numerical reference for the Android analytical model.
- **PHY-2** — The Android engine and reference shall use the same definitions for (mu), (mu_z), inflow gradients, Prandtl-Glauert correction, tip loss, induced/profile torque decomposition, air power, and (FoM).
- **PHY-3** — Sissingh (Bleftrightarrow C_T) coupling shall iterate to mutual consistency in both normal calculation and RPM trim.
- **PHY-4** — RPM Trim shall solve the same physical problem as zBET: fixed pitch/twist, target dimensional thrust, solved RPM.
- **PHY-5** — Collective Trim shall solve the same physical problem as zBET: fixed RPM, target (C_T) or dimensional thrust, solved collective.
- **PHY-6** — Manual mode shall prescribe RPM and pitch and shall not run hover trim.
- **PHY-7** — Caller geometry and condition state shall not be mutated by plot/sweep calculations.
- **PHY-8** — No UI conversion shall use nominal RPM when the solver uses a different resolved RPM.

## 9. Mobile usability

- **UX-1** — All primary touch targets shall be at least approximately 48 dp high.
- **UX-2** — Labels shall remain clickable to open detailed help.
- **UX-3** — Selecting a compact selector on mobile shall itself provide enough information to understand the available representations; a separate hover-only interaction shall never be required.
- **UX-4** — No label, selector, value, unit, legend, or action button shall overlap or clip on supported portrait widths.
- **UX-5** — Abbreviations may be used on narrow screens only when the full definition is available through the same control/help.
- **UX-6** — The global header shall remain uncluttered and shall not contain the rotor name.
- **UX-7** — Back shall close the topmost modal/tool before navigating away from the current primary tab.

## 10. Verification and release

- **QA-1** — Every requirement affecting numerical behavior shall have an automated reference or source-contract test.
- **QA-2** — Geometry synchronization tests shall independently verify the (AR), (sigma_{ref}), (sigma_{geom}), and (sigma_{thrust}) equations.
- **QA-3** — Migration tests shall prove that legacy saved rotors retain the same active-span chord law immediately after migration.
- **QA-4** — Condition tests shall exercise every horizontal representation, every axial representation, and every trim/target mode.
- **QA-5** — Results tests shall prove that all coefficient outputs are present in the single AERODYNAMIC COEFFICIENTS section.
- **QA-6** — Plot tests shall iterate through every selectable Y variable and every curve family and shall verify finite/invalid handling, legends, table data, CSV, and PNG.
- **QA-7** — UI smoke tests shall cover Dark/Light, portrait/landscape, cold restart, scroll reachability, and Back behavior.
- **QA-8** — The release APK shall be compiled from the exact approved main commit, installed, operated, and visually reviewed before being treated as current.
- **QA-9** — Stale APK/AAB/DEX artifacts shall not remain versioned as if they represented current source.
- **QA-10** — GitHub Actions may provide auxiliary QA but shall not replace local compiled-APK release validation.

## 11. Draft decisions to confirm before implementation

The following choices are proposed here so they can be explicitly accepted or changed before implementation:

1. **Pitch ownership:** pitch mode and operating pitch controls are placed in **Conditions**, because zBET treats them together with hover trim; Geometry stores planform and rotor aerodynamic definition.
2. **Linear-taper root chord:** `Root Chord` means the **reference chord at r/R = 0**, matching zBEMT. The physical chord at the root cutout is derived from the reference law.
3. **Plot families:** the legacy default families are preserved, but their numerical values become editable.
4. **Plot TABLE:** table output contains all displayed family curves rather than only the active curve.
5. **Factory preset edits:** SAVE may change the local copy of a factory preset; Restore Factory Presets recovers the shipped definitions.
