# RotorCalculator — Canonical Nomenclature (binding)

The single source is `RotorNames.bas` (labels, symbols, help text); this file mirrors it. Physics definitions live in the in-app Physics Manual (`Files/physics_help.html`).

## Rules
1. Label format is **Description Symbol** (academic style): `Radius R`, `Thrust Coefficient C_T`. The symbol always comes AFTER the description.
2. Title Case. **No periods** anywhere in labels. No abbreviations of the word *Coefficient* (there is no `Coeff`, with one exception: `Tc` and `Pc` use `Coeff` at Short, S and A levels because otherwise they would read like dimensional thrust and power); the Short level uses fewer words, not truncated words. `Long` and `Lat` remain the only allowed truncations (Inflow Gradient rows, Short level).
3. Five input levels, chosen **once per page**. Result labels choose a fitting level per row: the first level, in the order L, M, A, S, symbol, for which **every** label of that page fits on **one line** of its label column at the current width and font scale (text may shrink to 13 sp first). A label button never wraps. Symbols are kept as long as possible, so A comes before S.
   - **L (Full):** `Full Description Symbol`
   - **M (Short):** `Short Description Symbol`
   - **A (Abbreviated):** `Abbreviation Symbol`, one abbreviation per key (table below, no periods)
   - **S (Narrow):** `Narrow Description Symbol` (symbol retained)
   - **Symbol only:** last resort
4. **Coefficient rule.** Every coefficient follows the same pattern at every level:
   - Full: `<Name> Coefficient <Symbol>` — `Thrust Coefficient C_T`, `Induced Torque Coefficient C_Qi`, `Profile In-Plane Force Coefficient C_H0`.
   - Short: the same without the word *Coefficient* — `Thrust C_T`, `Induced Torque C_Qi`, `Profile In-Plane C_H0`.
   - Narrow: the short name alone — `Thrust`, `Induced Torque`, `Profile In-Plane`.
   The same pattern applies to sweep labels, which are built from the same keys.
5. The help popup always shows `Full Description Symbol` + definition (including how the value is obtained) + equation + typical range + unit.
6. Units are never inside the label or the value string. A dimensionless unit column shows `–` (neutral, non-converting style) everywhere.
7. Symbols use real subscripts rendered the same way everywhere (one helper). Plain-text form (CSV, accessibility) uses `_`: `C_T`, `θ_twist`, `C̄_L`.
8. The **collective pitch symbol is Δθ**; the **blade twist symbol is θ_twist**.
9. Root Cutout x_0 keeps the same name (`Root Cutout`) at the Full and Short levels.

## Geometry
| Key | Full | Short | Symbol |
|---|---|---|---|
| name | Rotor Name | Name | – |
| R | Rotor Radius | Radius | R |
| Nb | Blade Count | Blades | N_b |
| x0 | Root Cutout | Root Cutout | x_0 |
| c0 | Root Chord | Root Chord | c_R |
| c1 | Tip Chord | Tip Chord | c_T |
| taper | Taper Ratio | Taper | c_T/c_R |
| sigmaRef | Reference Solidity | Reference Solidity | σ_REF |
| sigmaAct | Actual Solidity | Actual Solidity | σ_act |
| sigmaT | Thrust-Weighted Solidity | Thrust Solidity | σ_TR |
| AR | Aspect Ratio | Aspect Ratio | AR |
| A | Disk Area | Disk Area | A_DISK |
| Ab | Reference Blade Area | Reference Area | A_REF |
| Aact | Actual Blade Area | Actual Area | A_act |
| thRoot | Root Pitch | Root Pitch | θ_R |
| thTip | Tip Pitch | Tip Pitch | θ_T |
| thTwist | Total Blade Twist | Twist | θ_twist |
| th75 | Three-Quarter Pitch | Pitch 75% | θ_75 |
| airfoil | Airfoil Section | Airfoil | – |
| a0 | Lift-Curve Slope | Lift Slope | a_0 |
| Cd0 | Profile Drag Coefficient | Profile Drag | C_d0 |
| tipModel | Tip-Loss Model | Tip Loss | – |
| B | Tip-Loss Factor | Tip Factor | B |
| comp | Compressibility Correction | Compressibility | – |
| rpmNom | Rotor Speed | Rotor Speed | Ω_nom |

## Conditions
| Key | Full | Short | Symbol |
|---|---|---|---|
| h | Pressure Altitude | Altitude | H_p |
| T0 | Outside Air Temperature | Temperature | OAT |
| mu | Advance Ratio | Advance Ratio | μ_x |
| Vx | Forward Airspeed | Airspeed | V_x |
| alpha | Disk Angle of Attack | Disk AoA | α |
| Vz | Climb Speed | Climb Speed | V_z |
| muz | Axial Flow Ratio | Axial Ratio | μ_z |
| trim | Trim Mode | Trim | – |
| rpm | Rotor Speed | Rotor Speed | Ω |
| coll | Collective Pitch | Collective | Δθ |
| Ttgt | Target Thrust | Target Thrust | T |
| CTtgt | Target Thrust Coefficient | Target | C_T |
| inflow | Inflow Model | Inflow | – |
| kind | Induced Power Factor | Induced Factor | k_ind |
| drag | Profile Drag Integration | Drag Integration | – |

## Results
| Key | Full | Short | Symbol |
|---|---|---|---|
| T | Thrust | Thrust | T |
| P | Shaft Power | Power | P |
| Pi | Induced Power | Induced Power | P_i |
| P0 | Profile Power | Profile Power | P_0 |
| Q | Shaft Torque | Torque | Q |
| H | In-Plane Force | In-Plane Force | H |
| Y | Side Force | Side Force | Y |
| Mx | Roll Moment | Roll Moment | M_x |
| My | Pitch Moment | Pitch Moment | M_y |
| DL | Disk Loading | Disk Loading | T/A_DISK |
| PL | Power Loading | Power Loading | T/P |
| vi | Induced Speed | Induced Speed | V_i |
| CT | Thrust Coefficient | Thrust Coeff. | C_T |
| CQ | Torque Coefficient | Torque Coeff. | C_Q |
| CQi | Induced Torque Coefficient | Ind. Torque Coeff. | C_Qi |
| CQ0 | Profile Torque Coefficient | Prof. Torque Coeff. | C_Q0 |
| CH | In-Plane Force Coefficient | In-Plane Coeff. | C_H |
| CHi | Induced In-Plane Force Coefficient | Ind. In-Plane Coeff. | C_Hi |
| CH0 | Profile In-Plane Force Coefficient | Prof. In-Plane Coeff. | C_H0 |
| CY | Side Force Coefficient | Side Force | C_Y |
| CMx | Roll Moment Coefficient | Roll Moment | C_Mx |
| CMy | Pitch Moment Coefficient | Pitch Moment | C_My |
| Qi | Induced Torque | Induced Torque | Q_i |
| Q0 | Profile Torque | Profile Torque | Q_0 |
| Hi | Induced In-Plane Force | Induced In-Plane Force | H_i |
| H0 | Profile In-Plane Force | Profile In-Plane Force | H_0 |
| Pair | Air Power | Air Power | P_air |
| CPair | Air Power Coefficient | Air Power | C_Pair |
| CTs | Blade Loading | Blade Loading | C_T/σ_TR |
| CLbar | Mean Lift Coefficient | Mean Lift Coefficient | C̄_L |
| FM | Figure of Merit (hover only) | Figure of Merit | FM |
| LDe | Effective Lift/Drag Ratio | Eff. Lift/Drag | (L/D)_e |
| lam | Total Inflow Ratio | Inflow Ratio | λ |
| lami | Induced Inflow Ratio | Induced Inflow | λ_i |
| lamh | Hover Inflow Ratio | Hover Inflow | λ_h |
| muLam | Advance-to-Inflow Ratio | Advance/Inflow | μ/λ |
| Tc | Dynamic Thrust Coefficient | Dynamic Thrust Coeff | T_c |
| Pc | Dynamic Power Coefficient | Dynamic Power Coeff | P_c |
| Kx | Longitudinal Inflow Gradient | Long. Gradient | K_x |
| Ky | Lateral Inflow Gradient | Lat. Gradient | K_y |
| chi | Wake Skew Angle | Wake Skew | χ |
| Bres | Tip-Loss Factor | Tip Factor | B |
| OmR | Tip Speed | Tip Speed | ΩR |
| Mtip | Tip Mach | Tip Mach | M_tip |
| Madv | Advancing Tip Mach | Adv. Mach | M_adv |
| rho | Air Density | Density | ρ |
| p | Ambient Pressure | Pressure | p |
| a | Speed of Sound | Sound Speed | a |

| Vztot | Total Axial Speed | Total Axial Speed | V_{z,tot} |
| Vadv | Advancing Speed | Advancing Speed | V_adv |
| Vret | Retreating Speed | Retreating Speed | V_ret |
| Mret | Retreating Mach | Retreating Mach | M_ret |
| aoaAdv25 | Advancing AoA 25% | Adv. AoA 25% | α_{adv,25} |
| aoaRet25 | Retreating AoA 25% | Ret. AoA 25% | α_{ret,25} |
| phiAdv25 | Advancing Inflow Angle 25% | Adv. Inflow 25% | φ_{adv,25} |
| phiRet25 | Retreating Inflow Angle 25% | Ret. Inflow 25% | φ_{ret,25} |
| aoaAdv50 | Advancing AoA 50% | Adv. AoA 50% | α_{adv,50} |
| aoaRet50 | Retreating AoA 50% | Ret. AoA 50% | α_{ret,50} |
| phiAdv50 | Advancing Inflow Angle 50% | Adv. Inflow 50% | φ_{adv,50} |
| phiRet50 | Retreating Inflow Angle 50% | Ret. Inflow 50% | φ_{ret,50} |
| aoaAdv75 | Advancing AoA 75% | Adv. AoA 75% | α_{adv,75} |
| aoaRet75 | Retreating AoA 75% | Ret. AoA 75% | α_{ret,75} |
| phiAdv75 | Advancing Inflow Angle 75% | Adv. Inflow 75% | φ_{adv,75} |
| phiRet75 | Retreating Inflow Angle 75% | Ret. Inflow 75% | φ_{ret,75} |
| aoaAdvTip | Advancing AoA Tip | Adv. AoA Tip | α_{adv,tip} |
| aoaRetTip | Retreating AoA Tip | Ret. AoA Tip | α_{ret,tip} |
| phiAdvTip | Advancing Inflow Angle Tip | Adv. Inflow Tip | φ_{adv,tip} |
| phiRetTip | Retreating Inflow Angle Tip | Ret. Inflow Tip | φ_{ret,tip} |

Dynamic-pressure coefficients (`Tc`, `Pc`) use the free-stream speed V = √(V_x² + V_z²) and are shown as – in hover. `CLbar` uses the thrust-weighted solidity σ_TR, like `CTs`.

## Option names (selectors)
| Key | Full | Short | Symbol |
|---|---|---|---|
| tip_none | Tip Loss None | None | B |
| tip_fixed | Tip Loss Fixed | Fixed | B |
| tip_sissingh | Tip Loss Sissingh | Sissingh | B |
| comp_off | Compressibility Off | Off | – |
| comp_pg | Prandtl-Glauert | Prandtl-Glauert | – |
| inflow_uniform | Uniform Inflow | Uniform | – |
| inflow_coleman_simple | Coleman | Coleman | – |
| inflow_coleman_feingold | Coleman-Feingold (NDARC) | Coleman FG | – |
| inflow_drees | Drees | Drees | – |
| drag_tangential | Analytical Tangential | Tangential | – |
| drag_vectorial | Analytical Vectorial | Vectorial | – |
| drag_numerical | Numerical Vectorial | Num. Vec. | – |
| trim_none | Trim None | None | – |
| trim_collective | Trim Collective | Collective | Δθ |
| trim_rpm | Trim Rotor Speed | Rotor Speed | Ω |

### Operating constraints

The six constraints prescribe two of rotor speed, collective, target thrust coefficient and target thrust. The remaining values are solved.

| Key | Full | Short | Symbol |
|---|---|---|---|
| rpm_collective | Prescribe Speed & Collective | Ω + Δθ | Ω, Δθ |
| rpm_ct | Prescribe Speed & Target C_T | Ω + C_T | Ω, C_T |
| rpm_thrust | Prescribe Speed & Target Thrust | Ω + T | Ω, T |
| collective_ct | Prescribe Collective & Target C_T | Δθ + C_T | Δθ, C_T |
| collective_thrust | Prescribe Collective & Target Thrust | Δθ + T | Δθ, T |
| ct_thrust | Prescribe Target C_T & Target Thrust | C_T + T | C_T, T |

## Sweep
| Key | Full | Short | Symbol |
|---|---|---|---|
| xAxis | Sweep Axis | Axis | – |
| xAxis_mu | Advance Ratio | Advance Ratio | μ_x |
| xAxis_Vx | Forward Airspeed | Airspeed | V_x |

Sweep trim modes (one dropdown in the sweep panel; trim target is the Conditions target C_T or T; Hover Only solves the control at μ = 0 and holds it fixed):

| Key | Full | Short | Symbol |
|---|---|---|---|
| sw_none | No Trim (Fixed Controls) | No Trim | – |
| sw_coll_all | Trim Collective Δθ · Every Point | Collective Every Point | – |
| sw_rpm_all | Trim Rotor Speed Ω · Every Point | Speed Every Point | – |
| sw_coll_hover | Trim Collective Δθ · Hover Only | Collective Hover Only | – |
| sw_rpm_hover | Trim Rotor Speed Ω · Hover Only | Speed Hover Only | – |

## Actions and pages
| Key | Full | Short | Symbol |
|---|---|---|---|
| save | Save Rotor | Save | – |
| copy | Copy Rotor | Copy | – |
| delete | Delete Rotor | Delete | – |
| newRotor | New Rotor | New | – |
| activeRotor | Active Rotor | Active Rotor | – |
| sweep | Advance Ratio Sweep | Sweep | – |
| table | Sweep Table | Table | – |
| csv | Export CSV | CSV | – |
| png | Export PNG | PNG | – |
| palette | Plot Palette | Palette | – |
| sweepTrim | Sweep Trim | Sweep Trim | – |
| family | Curve Family | Family | – |
| tabGeom | Geometry Page | Geometry | – |
| tabCond | Conditions Page | Conditions | – |
| tabRes | Results Page | Results | – |

## Abbreviations (level A)

The effective APK abbreviation map includes its responsive overrides. Each caption retains its symbol, except when the minimum level is needed. Keys not listed use their short name.

- `R`: Radius
- `Nb`: Blades
- `x0`: Root Cutout
- `c0`: Root Chord
- `c1`: Tip Chord
- `taper`: Taper
- `sigmaRef`: Ref. Solidity
- `sigmaAct`: Act. Solidity
- `sigmaT`: Thr. Solidity
- `AR`: Aspect
- `A`: Disk Area
- `Ab`: Ref. Area
- `Aact`: Act. Area
- `thRoot`: Root Pitch
- `thTip`: Tip Pitch
- `thTwist`: Twist
- `th75`: Pitch 75%
- `a0`: Lift Slope
- `Cd0`: Prof. Drag
- `B`: Tip Factor
- `rpmNom`: Rot. Speed
- `h`: Altitude
- `T0`: Temperature
- `mu`: Adv. Ratio
- `Vx`: Airspeed
- `alpha`: Disk AoA
- `Vz`: Climb Speed
- `muz`: Axial Ratio
- `rpm`: Rot. Speed
- `coll`: Collective
- `Ttgt`: Target Thrust
- `CTtgt`: Target
- `kind`: Ind. Factor
- `T`: Thrust
- `P`: Power
- `Pi`: Ind. Power
- `P0`: Prof. Power
- `Q`: Torque
- `H`: In-Plane Force
- `Y`: Side Force
- `Mx`: Roll Moment
- `My`: Pitch Moment
- `DL`: Disk Loading
- `PL`: Power Loading
- `vi`: Ind. Speed
- `CT`: Thrust
- `CQ`: Torque
- `CQi`: Ind. Torque
- `CQ0`: Prof. Torque
- `CH`: In-Plane
- `CHi`: Ind. In-Plane
- `CH0`: Prof. In-Plane
- `CY`: Side Force
- `CMx`: Roll Moment
- `CMy`: Pitch Moment
- `CPair`: Air Power
- `CTs`: Blade Load
- `CLbar`: Mean Lift
- `FM`: FM
- `LDe`: Eff. L/D
- `lam`: Inflow Ratio
- `lami`: Ind. Inflow
- `lamh`: Hover Inflow
- `muLam`: Advance/Inflow
- `Tc`: Dyn Thrust Coeff
- `Pc`: Dyn Power Coeff
- `Mtip`: Tip Mach
- `Madv`: Adv. Mach
- `OmR`: Tip Speed
- `rho`: Density
- `p`: Pressure
- `a`: Sound Speed
- `Bres`: Tip Factor
- `chi`: Wake Skew
- `Qi`: Ind. Torque
- `Q0`: Prof. Torque
- `Hi`: Ind. In-Plane Force
- `H0`: Prof. In-Plane Force
- `Pair`: Air Power
- `comp`: Compres.
- `drag`: Integration
- `Vztot`: Axial Speed
- `Vadv`: Adv. Speed
- `Vret`: Ret. Speed
- `Mret`: Ret. Mach
- `aoaAdv25`: Adv. AoA 25
- `aoaRet25`: Ret. AoA 25
- `phiAdv25`: Adv. Inflow 25
- `phiRet25`: Ret. Inflow 25
- `aoaAdv50`: Adv. AoA 50
- `aoaRet50`: Ret. AoA 50
- `phiAdv50`: Adv. Inflow 50
- `phiRet50`: Ret. Inflow 50
- `aoaAdv75`: Adv. AoA 75
- `aoaRet75`: Ret. AoA 75
- `phiAdv75`: Adv. Inflow 75
- `phiRet75`: Ret. Inflow 75
- `aoaAdvTip`: Adv. AoA Tip
- `aoaRetTip`: Ret. AoA Tip
- `phiAdvTip`: Adv. Inflow Tip
- `phiRetTip`: Ret. Inflow Tip


## Result Output Presentation and Typography

Both the Android APK and Web application share identical nomenclature and responsive fitting. Desktop layouts offer additional space for full terminology.
Results use description-first labels with the symbol AFTER the name and native mathematical subscripts. Braced notation
such as V_{z,tot} and α_{adv,75} is rendered as a single complete subscript.
Each result chooses full, compact, abbreviated or symbol-only text at normal engineering
font size within the shared three-column grid; symbols are never dropped. Adv. and Ret.
are explicitly permitted abbreviations with periods. Inputs retain page-wide fitting.
V_z remains Climb Speed, positive downward relative flow through the disk.
V_{z,tot} is total mean axial speed, not free-stream magnitude.
Its compact caption is Axial Speed. The minimum level is only V_{z,tot}.
Advancing/Retreating Speed and Mach refer to tangential tip kinematics, excluding axial speed.
Section AoA and inflow angles are sampled at 75% radius and 90°/270° azimuth, not averaged.
They are unavailable outside the active span or in reverse flow and are model diagnostics,
not a stall or blade-dynamics prediction. Tip Mach and Advancing Mach coincide only at V_x=0.


### Canonical Label Formatting and Punctuation

Full AoA captions are Advancing AoA 75% and Retreating AoA 75%, without Section.
Abbreviated captions are Adv. AoA, Ret. AoA, Adv. Inflow and Ret. Inflow.
The minimum level is the symbol alone for quantities with a defined symbol.
Actions without a physical symbol retain a caption rather than disappearing.
All names are followed by the mathematical symbol; the symbol is never prefixed.
Full catalog: [apk-label-catalog.md](apk-label-catalog.md), with rendered HTML and CSV variants.
Regenerate using python tools/export_apk_label_catalog.py.


### Approved Intermediate Nomenclature Levels

- Responsive order: L (Full) → M (Short) → A (Abbreviated) → S (Narrow) → Minimum (Symbol only). Results also tests S before falling back to symbol-only.
- Symbol always follows the descriptive name with mathematical subscripts; minimum level is symbol-only for quantities with a symbol.
- sigmaT: A/S `Thr. Solidity σ_TR`; comp: A/S `Compres.`, minimum `Comp.`.
- T0: S `Temp. OAT`; drag: A/S `Integration`, minimum `Integ.`.
- LDe: A/S `Eff. (L/D)_e`, without repeating the ratio in the name.
- rpmNom: L/M `Rotor Speed Ω_nom`, A/S `Rot. Speed Ω_nom`; rpm: A/S `Rot. Speed Ω`.
- muLam: M/A/S `Advance/Inflow μ/λ`. Mtip: L `Tip Mach M_tip`; Madv: L `Advancing Tip Mach M_adv`. Omit "Number".
- Induced Factor remains unchanged.
- Hi/CHi: M `Induced In-Plane Force`, A `Ind. In-Plane Force`, S `Ind. In-Plane`; H0/CH0: M `Profile In-Plane Force`, A `Prof. In-Plane Force`, S `Prof. In-Plane`. Each level retains its symbol after the name.
- Label fitting measures text width and removes "Force" at the S level when required, before falling back to symbol-only.


### Abbreviation Punctuation Rules

Use `Ref.`, `Adv.`, `Act.`, `Thr.`, `Prof.`, `Ind.`, `Rot.` and `Eff.` across all abbreviated levels. The acronyms `Coeff` and `Dyn` do not take trailing periods. Full names and mathematical symbols do not change. The intermediate level omitting "Force" precedes symbol-only fallback.
