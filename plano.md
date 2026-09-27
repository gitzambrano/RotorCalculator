# RotorCalculator — Implementation Plan

> **Authoritative specification:** `docs/software_requirements.md`  
> **Target:** RotorCalculator 1.20+  
> **Numerical reference:** `tools/zBET.py`  
> **UI reference:** AeroCalculator interaction principles, adapted for RotorCalculator.

### Visual system convergence with AeroCalculator

- [x] Treat AeroCalculator as the interaction grammar: stable engineering columns, direct selectors and predictable unit controls.
- [x] Replace painted clickable Labels with native Buttons for every Geometry/Conditions label and unit.
- [x] Keep every normal selector row on the same label/value/unit grid; preserve the unit-column footprint even when there is no convertible unit.
- [x] Make Derived Geometry visually read-only while preserving the exact column grid.
- [x] Redesign Results as quantity/value/unit columns and remove units from numerical strings.
- [x] Remove legacy UI naming indirection; use canonical zBET/zBEMT symbol-first names at source.
- [x] Add three-level responsive nomenclature: symbol, compact, full.
- [x] Raise section/status typography and preserve 48 dp targets rather than shrinking the interface.
- [x] Extend static QA for native controls/canonical names and runtime QA for alignment, result units, responsive labels and 130% font scale.
- [ ] Final gate: compile exact main, install, operate every screen and inspect real screenshots across the target matrix.

## 1. Final architecture

RotorCalculator has three primary tabs:

1. **Geometry** — complete in-page synchronized rotor editor.
2. **Conditions** — atmosphere, flight state, two prescribed operating constraints, inflow model, and Kind.
3. **Results** — dimensional performance, all coefficients together, efficiency, inflow/wake, solved operating state, and atmosphere.

Global menu: Settings, Quick Unit Converter, Physics & Equations, zBET/zBEMT Conventions, Restore Factory Presets, About.

## 2. Geometry

Geometry is a **direct in-page rotor editor**, following the AeroCalculator interaction model:
- entering the Geometry tab immediately exposes the complete editable geometry;
- a persistent **ACTIVE ROTOR** bar occupies the top selector position and shows the current rotor;
- tapping that bar selects any saved rotor or creates a **NEW ROTOR**;
- **SAVE / COPY / DELETE** remain visible on the Geometry page and SAVE does not close the editor;
- Blade Geometry, Derived Geometry, and Rotor Aerodynamics use one rigid three-column grid: **label / value / unit**;
- labels are tap-accessible help/selector surfaces; units are tap-accessible selectors when alternate units are valid;
- changing displayed units never changes the SI state passed to zBETEngine.

Unsaved edits survive normal Activity recreation/orientation. Selecting a different rotor or leaving with unsaved changes offers Save / Discard / Cancel. COPY clones the current edited geometry under a unique name. DELETE is confirmed and is disabled when only one rotor remains.
Authoritative planform:
`c(x)=c0+(c1-c0)x` from x=0 to 1.

Editing radius scales both chords proportionally, preserving σref, AR, taper and c/R. Editing c0/c1 recomputes σref/AR. Editing σref or AR scales both chords with constant taper. Blade-count changes σref only. Root cutout changes active-span metrics/integrals only.

Baseline root/tip incidence is stored in Geometry. Operating collective Δθ is added equally to both incidences.

Saved rotors use a versioned schema. Legacy chord-at-cutout data is migrated explicitly. Import validation occurs before sanitization/clamping.

## 3. Conditions and six operating pairs

Atmosphere inputs:
- Altitude
- Temperature

Equivalent flow inputs:
- Horizontal: μ or Vx
- Axial: α, Vz, or μz

Conventions:
- +Vz = positive climb rate, relative wind from above;
- +μz = positive downward relative flow;
- +α = wind from below;
- μz = Vz/(ΩR) = -μ tan(α).

Linked operating quantities:
- RPM
- collective Δθ
- CT
- Thrust

Selectable prescribed pairs:
1. RPM + Collective
2. RPM + CT
3. RPM + Thrust
4. Collective + CT
5. Collective + Thrust
6. CT + Thrust

The solver computes the remaining two at the current forward/axial flight condition. Dimensional Vx/Vz are re-nondimensionalized at each candidate RPM.

Conditions also contains:
- Inflow Model
- Kind

Profile drag is always Numerical Vectorial.

## 4. Results

Section order:
- DIMENSIONAL PERFORMANCE
- AERODYNAMIC COEFFICIENTS
- EFFICIENCY
- INFLOW & WAKE
- OPERATING STATE & ATMOSPHERE

All aerodynamic coefficients remain together.

Operating State & Atmosphere explicitly shows:
- solved RPM;
- collective Δθ;
- solved CT;
- solved thrust;
- μ, Vx, μz, Vz, α;
- tip speed, tip Mach, advancing-tip Mach;
- altitude, temperature, density, pressure, speed of sound;
- solution/model status.

## 5. Universal plots

Preserve the original broad capability and the new visual polish:
- any scalar Result as Y;
- X = μ or equivalent Vx;
- selectable μ range;
- families: Active Only, Inflow Models, α, Vz, μz;
- VALUES button for custom comma-separated families;
- active marker;
- responsive non-overlapping legends;
- invalid gaps;
- Light/Dark rendering.

When CT or thrust is prescribed, **Trim only in hover**:
- OFF: retrim every sweep point;
- ON: solve once at hover, then hold solved RPM and collective.

Plot, TABLE and CSV use one cached authoritative dataset. PNG exports the rendered plot.

## 6. Geometry backup/sharing

Settings contains Import Geometries and Export Geometries.

Export writes the full versioned rotor database via Android CREATE_DOCUMENT.

Import:
1. choose file;
2. validate schema and numeric domains;
3. report valid count;
4. confirm;
5. choose Rename / Replace / Skip for conflicts;
6. merge without deleting unrelated local rotors.

Restore Factory Presets restores factory definitions while preserving user rotors.

## 7. Help/settings

Settings:
- Dark / Light
- SI / Imperial
- Standard / +1 Decimal
- Import Geometries
- Export Geometries

Help:
- offline Physics & Equations;
- zBET/zBEMT conventions;
- tap-accessible row/result explanations.

## 8. Verification gates

Before release:
1. geometry synchronization/migration tests;
2. six operating-pair tests in hover, forward flight and axial flow;
3. Numerical Vectorial-only profile drag;
4. Kind tests;
5. all coefficients grouped together;
6. explicit solved RPM/collective/CT/thrust Results;
7. universal plot catalog and all families;
8. custom family VALUES;
9. trim-only-hover ON/OFF;
10. plot/TABLE/CSV dataset parity;
11. PNG/CSV SAF export;
12. geometry import/export round-trip and malformed-input rejection;
13. factory restore preserving user rotors;
14. Dark/Light portrait/landscape/recreation UI smoke;
15. compiled APK installed and manually operated;
16. real screenshots reviewed before APK/AAB is treated as current.

## 9. Current source status

Implemented in main:
- direct in-page Geometry editor with a persistent Active Rotor selector;
- SAVE/COPY/DELETE/NEW workflows without a mandatory geometry popup;
- unsaved Geometry state preserved across normal Activity recreation;
- versioned rotor storage and migration;
- import/export geometry backup;
- six-pair operating solver;
- current-flight-condition trim;
- fixed Numerical Vectorial profile drag;
- Kind input;
- grouped Results with explicit trim solution;
- universal sweep Y catalog;
- multi-curve families and custom VALUES;
- hover-only trim option;
- shared plot/table/CSV dataset;
- PNG/CSV SAF export;
- Light/Dark and +1 Decimal;
- offline help framework.

Verification completed in source/reference:
- source-contract audit for the current Geometry / Conditions / Results architecture;
- numerical reference checks for geometry invariants, flow-sign conventions, inflow closure, corrections, and operating-pair behavior;
- explicit detection of non-unique **Collective + CT** RPM solutions, per COND-18;
- trim-residual fast path that preserves the authoritative CT/inflow solve while skipping unrelated profile/power work;
- static responsive-layout and event-handler audit, including aligned label/value/unit columns;
- Dark/Light offline-help synchronization;
- repository hygiene: only required B4A libraries remain and publishing/signing material stays outside Git.

Verification coverage strengthened on 2026-09-23:
- `tools/ci_ui_qa.sh` is now self-contained for its Python helpers and accepts an explicit local APK path;
- the runtime matrix now reaches the Android document picker for geometry import/export and sweep CSV/PNG export;
- both hover-only trim states and every sweep family selector are exercised;
- QA-4 automation now applies custom family VALUES and walks the complete 39-variable sweep-Y catalog, checking the selected output after every live change;
- QA-6 automation now performs a real Android-SAF geometry export/import round-trip, compares editable numeric fields before/after, verifies name restoration, and rejects both malformed and syntactically valid out-of-domain files;
- static QA cross-checks the runtime sweep list against the authoritative `RotorPopups.SweepParamLabels` catalog so the two cannot silently diverge;
- the numerical reference tests now include σgeom/σthrust radius-scaling invariants and all six operating-pair paths in hover, forward-flight, and nonzero-axial regimes.
These additions are committed but are not counted as passed until they are executed locally.

Remaining release / evidence gate:
1. execute the strengthened numerical/source test suite locally and resolve any new failure;
2. compile the exact approved `main` source with B4A locally;
3. install the resulting APK on an emulator/device;
4. execute the full `tools/ci_ui_qa.sh` interaction matrix locally (without GitHub Actions), including the direct Geometry editor, Active Rotor selector, selectable units, flow-variable selectors, the 39 Y variables, applied VALUES, SAF round-trip, invalid-import rejection and export flows;
5. review the real portrait/landscape and Light/Dark screenshots produced by that exact APK;
6. correct any runtime or visual issue found before calling the app 5/5 or publishing an APK/AAB.
