# RotorCalculator — Canonical Nomenclature (binding)

The single source is `RotorNames.bas` (labels, symbols, help text); this file mirrors it. Physics definitions live in the in-app Physics Manual (`Files/physics_help.html`).

## Rules
1. Label format is **Description Symbol** (academic style): `Radius R`, `Thrust Coefficient C_T`. The symbol always comes AFTER the description.
2. Title Case. **No periods** anywhere in labels. No abbreviations of the word *Coefficient* (there is no `Coeff`); the Short level uses fewer words, not truncated words. `Long` and `Lat` remain the only allowed truncations (Inflow Gradient rows, Short level).
3. Three levels, chosen **once per page** (never per row): the largest level for which **every** label of that page fits its label column at the current width and font scale.
   - **L (Full):** `Full Description Symbol`
   - **M (Short):** `Short Description Symbol`
   - **S (Narrow):** `Short Description` (symbol dropped). The symbol is never shown alone.
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
| sigmaRef | Reference Solidity | Solidity | σ_ref |
| sigmaAct | Active-Span Solidity | Active Solidity | σ_act |
| sigmaT | Thrust-Weighted Solidity | Thrust Solidity | σ_TR |
| AR | Aspect Ratio | Aspect Ratio | AR |
| A | Disk Area | Disk Area | A |
| Ab | Reference Blade Area | Blade Area | A_b |
| Aact | Active Blade Area | Active Area | A_act |
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
| rpmNom | Nominal Rotor Speed | Nominal Speed | Ω_nom |

## Conditions
| Key | Full | Short | Symbol |
|---|---|---|---|
| h | Pressure Altitude | Altitude | h |
| T0 | Ambient Temperature | Temperature | T_amb |
| mu | Advance Ratio | Advance Ratio | μ_x |
| Vx | Forward Airspeed | Airspeed | V_x |
| alpha | Disk Angle of Attack | Disk AoA | α |
| Vz | Climb Speed | Climb Speed | V_z |
| muz | Axial Flow Ratio | Axial Ratio | μ_z |
| trim | Trim Mode | Trim | – |
| rpm | Rotor Speed | Rotor Speed | Ω |
| coll | Collective Pitch | Collective | Δθ |
| Ttgt | Target Thrust | Target Thrust | T |
| CTtgt | Target Thrust Coefficient | Target Thrust | C_T |
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
| DL | Disk Loading | Disk Loading | T/A |
| PL | Power Loading | Power Loading | T/P |
| vi | Induced Velocity | Induced Velocity | v_i |
| CT | Thrust Coefficient | Thrust | C_T |
| CQ | Torque Coefficient | Torque | C_Q |
| CQi | Induced Torque Coefficient | Induced Torque | C_Qi |
| CQ0 | Profile Torque Coefficient | Profile Torque | C_Q0 |
| CH | In-Plane Force Coefficient | In-Plane Force | C_H |
| CHi | Induced In-Plane Force Coefficient | Induced In-Plane | C_Hi |
| CH0 | Profile In-Plane Force Coefficient | Profile In-Plane | C_H0 |
| CY | Side Force Coefficient | Side Force | C_Y |
| CMx | Roll Moment Coefficient | Roll Moment | C_Mx |
| CMy | Pitch Moment Coefficient | Pitch Moment | C_My |
| CPair | Air Power Coefficient | Air Power | C_Pair |
| CTs | Blade Loading | Blade Loading | C_T/σ_TR |
| CLbar | Mean Lift Coefficient | Mean Lift | C̄_L |
| FM | Figure of Merit (hover only) | Figure of Merit | FM |
| LDe | Effective Lift-to-Drag Ratio | Effective L/D | (L/D)_e |
| lam | Total Inflow Ratio | Inflow Ratio | λ |
| lami | Induced Inflow Ratio | Induced Inflow | λ_i |
| lamh | Hover Inflow Ratio | Hover Inflow | λ_h |
| muLam | Advance-to-Inflow Ratio | Advance-Inflow | μ/λ |
| Tc | Dynamic-Pressure Thrust Coefficient | Dynamic-Pressure Thrust | T_c |
| Pc | Dynamic-Pressure Power Coefficient | Dynamic-Pressure Power | P_c |
| Kx | Longitudinal Inflow Gradient | Long Gradient | K_x |
| Ky | Lateral Inflow Gradient | Lat Gradient | K_y |
| chi | Wake Skew Angle | Wake Skew | χ |
| Bres | Tip-Loss Factor | Tip Factor | B |
| OmR | Tip Speed | Tip Speed | ΩR |
| Mtip | Hover Tip Mach Number | Tip Mach | M_tip |
| Madv | Advancing Tip Mach Number | Advancing Mach | M_adv |
| rho | Air Density | Density | ρ |
| p | Ambient Pressure | Pressure | p |
| a | Speed of Sound | Sound Speed | a |

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
| inflow_coleman_simple | Coleman Simple | Coleman Simple | – |
| inflow_coleman_feingold | Coleman-Feingold (NDARC) | Coleman-Feingold | – |
| inflow_drees | Drees | Drees | – |
| drag_tangential | Analytical Tangential | Tangential | – |
| drag_vectorial | Analytical Vectorial | Vectorial | – |
| drag_numerical | Numerical Vectorial | Numerical | – |
| trim_none | Trim None | None | – |
| trim_collective | Trim Collective | Collective | Δθ |
| trim_rpm | Trim Rotor Speed | Rotor Speed | Ω |

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

