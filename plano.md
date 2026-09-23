# RotorCalculator — Implementation Plan

> **Authoritative requirements:** `docs/software_requirements.md`  
> **Target source:** RotorCalculator 1.20+  
> **Numerical reference:** `tools/zBET.py`  
> **UI reference:** AeroCalculator interaction principles, adapted for RotorCalculator.

This plan describes implementation order. If this document conflicts with `docs/software_requirements.md`, the requirements document wins.

## 1. Final product architecture

RotorCalculator keeps three primary tabs:

1. **Geometry** — complete in-page rotor editor.
2. **Conditions** — atmosphere, flight condition, operating constraints, inflow model, and induced-power factor.
3. **Results** — dimensional performance, all aerodynamic coefficients grouped together, efficiency, inflow/wake, and operating state/atmosphere.

The global menu contains Settings, Physics & Equations, zBET/zBEMT Conventions, Quick Unit Converter, Restore Factory Presets, and About.

## 2. Geometry redesign

### 2.1 In-page editor

Replace the current rotor-list + geometry-popup workflow with one scrollable Geometry editor.

Top strip:

**Loaded rotor: <name>**

Panels, using the same aligned row design:

### Blade Geometry

Editable:
- Radius (R)
- Number of blades (N_b)
- Root cutout (x_0)
- Reference root chord (c_0)
- Tip chord (c_1)
- Reference solidity (sigma_{ref})
- Aspect ratio (AR)
- Root incidence (	heta_{root})
- Tip incidence (	heta_{tip})

Derived:
- (sigma_{geom})
- (sigma_{thrust})
- taper ratio
- disk area
- reference blade area
- active blade area
- total twist

Synchronization rules:
- Radius change scales both chords and preserves (sigma_{ref}), (AR), taper, and (c/R).
- Chord edits recompute (sigma_{ref}) and (AR).
- Editing (sigma_{ref}) or (AR) scales both chords while preserving taper.
- Blade-count change changes (sigma_{ref}), not (AR) or chords.
- Root cutout changes active-span metrics/integrals but not reference planform metrics.

### Rotor Aerodynamics

Editable:
- Airfoil preset
- (a_0)
- (C_{d0})
- Tip-loss mode
- Fixed (B) when applicable
- Prandtl-Glauert toggle

Bottom actions:

**LOAD ROTOR | SAVE | SAVE AS NEW**

Saved rotors use a versioned schema. Legacy chord-at-cutout data is migrated explicitly to the new reference-axis chord definition.

## 3. Conditions redesign

### 3.1 Atmosphere

Inputs:
- Altitude
- Temperature

Outputs such as density, pressure, and speed of sound move to Results.

### 3.2 Equivalent flow representations

Horizontal Flow:
- selector (mu) / (V_x)
- selected quantity editable
- equivalent quantity shown read-only

Axial Flow:
- selector (alpha) / (V_z) / (mu_z)
- selected quantity editable
- equivalents shown read-only
- (+V_z) = positive climb rate / relative wind from above
- (+alpha) = relative wind from below
- (mu_z=-mu	analpha)
- (mu_z=V_z/(Omega R))

### 3.3 Six operating-input pairs

The linked quantities are:

- RPM
- collective increment (Delta	heta)
- (C_T)
- Thrust

The user prescribes any two:

1. RPM + Collective
2. RPM + CT
3. RPM + Thrust
4. Collective + CT
5. Collective + Thrust
6. CT + Thrust

Only the selected pair is shown as editable inputs. The solver finds the remaining two at the current flight condition, including forward flight and climb/descent.

Collective is a uniform pitch offset:

[
	heta_{root,op}=	heta_{root}+Delta	heta,qquad
	heta_{tip,op}=	heta_{tip}+Delta	heta.
]

Conditions also contains:
- Inflow Model
- (K_{ind})

Profile drag is always Numerical Vectorial and is documented, not selectable.

## 4. Engine work

Refactor the B4A engine around one operating-state resolver:

1. Resolve atmosphere.
2. Resolve candidate RPM.
3. Convert the selected horizontal/axial representation at that RPM.
4. Add collective (Delta	heta) uniformly to root/tip incidence.
5. Solve the selected two-input constraint pair.
6. Evaluate the aerodynamic state.
7. Return the full solved state without mutating caller data.

Required trim paths:
- direct prescribed RPM + collective;
- collective solution at fixed RPM for CT;
- collective solution at fixed RPM for thrust;
- RPM solution at fixed collective for CT;
- RPM solution at fixed collective for thrust;
- CT + thrust solution for RPM plus collective.

All paths use the actual (mu,mu_z) corresponding to the current flight condition and candidate RPM.

## 5. Results redesign

Sections:

### DIMENSIONAL PERFORMANCE
- Thrust
- Shaft power
- Torque
- In-plane force and other dimensional forces implemented by the engine

### AERODYNAMIC COEFFICIENTS
All together:
- (C_T)
- (C_Q=C_{P,shaft})
- (C_{Qi})
- (C_{Q0})
- (C_H)
- (C_{Hi})
- (C_{H0})
- (C_Y)
- (C_{Mx})
- (C_{My})
- (C_{P,air})

### EFFICIENCY
- FoM
- effective L/D

### INFLOW & WAKE
- (lambda)
- (lambda_i)
- (K_x)
- (K_y)
- (chi)
- tip-loss factor (B)

### OPERATING STATE & ATMOSPHERE
- solved RPM
- solved collective
- solved CT
- solved thrust
- (mu,V_x,mu_z,V_z,alpha)
- tip speed
- tip Mach / advancing-tip Mach
- altitude
- temperature
- density
- pressure
- speed of sound
- solution/model status

All rows have variable-specific precision plus the global +1 Decimal option.

## 6. Plot redesign: old capability + current polish

Restore the original universal sweep philosophy:

- any scalar result can be Y;
- X is (mu), with (V_x) as equivalent display;
- family selector:
  - Active Only
  - Inflow Models
  - alpha family
  - Vz family
  - mu_z family
- clean current theme, auto-scaling, invalid gaps, active marker, non-intrusive legends.

Add:
- **VALUES** button for comma-separated custom family values;
- X-range control;
- session persistence of plot choices.

### Trim in plots

When CT or thrust is part of the selected operating-input pair, show:

**Trim only in hover**

OFF:
- retrim at every sweep point using that point's flight condition.

ON:
- trim once at hover;
- hold solved RPM and collective constant across the full sweep.

TABLE and CSV use the same complete sampled family dataset as the plot. TABLE therefore shows all plotted curves, not just the active curve.

## 7. Geometry backup and sharing

Settings gains:

- **Import Geometries**
- **Export Geometries**

Export writes the entire versioned rotor database to one portable text file through Android's document picker.

Import:
1. choose file;
2. validate schema and numeric ranges;
3. show number of valid geometries;
4. merge after confirmation;
5. resolve duplicate names explicitly;
6. leave unrelated local geometries untouched.

This is the RotorCalculator equivalent of AeroCalculator's airplane database interchange, implemented with modern Android document-provider APIs.

## 8. Help and settings

Settings:
- Dark / Light
- SI / Imperial
- Standard / +1 Decimal
- Import Geometries
- Export Geometries

Help:
- Physics & Equations offline HTML
- zBET/zBEMT conventions
- field-level popup help on all Geometry, Conditions, and Results rows

Mobile discovery is tap-first; no essential explanation depends on mouse hover.

## 9. Verification gates

Before release:

1. geometry synchronization equations and migration tests;
2. six operating-pair tests in hover, forward flight, and axial flow;
3. Numerical Vectorial profile drag only;
4. K_ind tests;
5. all coefficients grouped in Results;
6. every result available to Plot;
7. custom family VALUES;
8. trim-only-hover ON/OFF;
9. TABLE/CSV/PNG parity with plotted dataset;
10. geometry import/export round-trip;
11. Light/Dark portrait/landscape UI smoke;
12. compiled APK installed and operated manually;
13. screenshots reviewed before APK/AAB are treated as current.

## 10. Implementation status

The pre-existing 1.20 source already contains useful components that will be retained where compatible:
- zBET analytical engine;
- four inflow models;
- Numerical Vectorial profile drag;
- Sissingh convergence;
- Light/Dark themes;
- +1 Decimal;
- offline physics help;
- SAF CSV/PNG export;
- universal sweep Y-variable catalog;
- multi-curve sweep renderer.

The following are architectural changes and must be completed before release:
- in-page synchronized Geometry editor;
- RPM/collective/CT/thrust six-pair operating solver;
- Conditions redesign;
- Results regrouping;
- complete plot dataset/table architecture;
- editable family values;
- trim-only-hover plot behavior;
- geometry import/export;
- saved-rotor schema migration.
