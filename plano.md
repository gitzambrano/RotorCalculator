# RotorCalculator — Implementation Plan

> **Authoritative specification:** `docs/software_requirements.md`  
> **Target:** RotorCalculator 1.20+  
> **Numerical reference:** `tools/zBET.py`  
> **UI reference:** AeroCalculator interaction principles, adapted for RotorCalculator.

## 1. Final architecture

RotorCalculator has three primary tabs:

1. **Geometry** — complete in-page synchronized rotor editor.
2. **Conditions** — atmosphere, flight state, two prescribed operating constraints, inflow model, and Kind.
3. **Results** — dimensional performance, all coefficients together, efficiency, inflow/wake, solved operating state, and atmosphere.

Global menu: Settings, Quick Unit Converter, Physics & Equations, zBET/zBEMT Conventions, Restore Factory Presets, About.

## 2. Geometry

Geometry is a **rotor library** rather than a permanently open form:
- the tab shows all factory and user rotors in a compact list;
- the active rotor is visibly marked;
- tapping a rotor selects it, persists that selection, and opens its **Geometry popup**;
- **NEW ROTOR** creates a new user rotor and opens it immediately;
- the Geometry popup contains Blade Geometry, Derived Geometry, and Rotor Aerodynamics;
- contextual actions are **SAVE / COPY / DELETE** inside the popup;
- the global header never carries the rotor name.

Unsaved edits survive normal Activity recreation/orientation. Closing the editor or selecting a different rotor offers Save / Discard / Cancel. COPY clones the current edited geometry under a unique name. DELETE is confirmed and is disabled when only one rotor remains.

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
- rotor-library Geometry tab with synchronized contextual Geometry popup;
- persistent active-rotor selection and SAVE/COPY/DELETE/NEW workflows;
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

Remaining release work is verification/polish: source-contract gates, numerical tests, layout/contrast audit, offline-help synchronization, B4A compilation, installed-APK operation, and real screenshot review.
