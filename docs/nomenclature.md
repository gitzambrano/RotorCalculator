# RotorCalculator — Canonical Nomenclature (binding)

Rules
1. Label format is **Description Symbol** (academic style): `Radius R`, `Thrust Coefficient CT`. Symbol always AFTER the description.
2. Title Case. **No periods** anywhere in labels (no `Ref.`, `Adv.`, `Coeff.`). Avoid abbreviations; the Short level uses fewer words, not truncated words.
3. Three levels, chosen **once per page** (never per row): the largest level for which **every** label of that page fits its label column at the current width/font scale.
   - **L (Full):** `Full Description Symbol`
   - **M (Short):** `Short Description Symbol`
   - **S (Narrow):** `Short Description` (symbol dropped). The symbol is never shown alone.
4. The help popup always shows `Full Description Symbol` + definition + equation + typical range + unit.
5. Units are never inside the label or the value string. Dimensionless unit column shows `–` (neutral, non-converting style) everywhere; `[-]` and `—` are retired.
6. Symbols use real subscripts rendered the same way everywhere (one helper). Plain-text form (CSV, accessibility) uses `_`: `C_T`, `θ_twist`.
7. The **collective pitch symbol is Δθ**; the **blade twist symbol is θ_twist**.

## Geometry
| Key | Full | Short | Symbol |
|---|---|---|---|
| name | Rotor Name | Name | – |
| R | Rotor Radius | Radius | R |
| Nb | Blade Count | Blades | N_b |
| x0 | Root Cutout | Cutout | x_0 |
| c0 | Root Chord | Root Chord | c_0 |
| c1 | Tip Chord | Tip Chord | c_1 |
| taper | Taper Ratio | Taper | c_1/c_0 |
| sigmaRef | Reference Solidity | Solidity | σ_ref |
| sigmaAct | Active-Span Solidity | Active Solidity | σ_act |
| sigmaT | Thrust-Weighted Solidity | Thrust Solidity | σ_T |
| AR | Aspect Ratio | Aspect Ratio | AR |
| A | Disk Area | Disk Area | A |
| Ab | Reference Blade Area | Blade Area | A_b |
| Aact | Active Blade Area | Active Area | A_act |
| thRoot | Root Pitch | Root Pitch | θ_root |
| thTip | Tip Pitch | Tip Pitch | θ_tip |
| thTwist | Total Blade Twist | Twist | θ_twist |
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
| CTtgt | Target Thrust Coefficient | Target Coefficient | C_T |
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
| CT | Thrust Coefficient | Thrust Coeff | C_T |
| CQ | Torque Coefficient | Torque Coeff | C_Q |
| CQi | Induced Torque Coefficient | Induced Torque | C_Qi |
| CQ0 | Profile Torque Coefficient | Profile Torque | C_Q0 |
| CH | In-Plane Force Coefficient | In-Plane Coeff | C_H |
| CHi | Induced In-Plane Coefficient | Induced In-Plane | C_Hi |
| CH0 | Profile In-Plane Coefficient | Profile In-Plane | C_H0 |
| CY | Side Force Coefficient | Side Force Coeff | C_Y |
| CMx | Roll Moment Coefficient | Roll Coeff | C_Mx |
| CMy | Pitch Moment Coefficient | Pitch Coeff | C_My |
| CPair | Air Power Coefficient | Air Power Coeff | C_Pair |
| CTs | Blade Loading | Blade Loading | C_T/σ |
| FM | Figure of Merit (hover only) | Figure of Merit | FM |
| LDe | Effective Lift-to-Drag Ratio | Effective L/D | (L/D)_e |
| lam | Total Inflow Ratio | Inflow Ratio | λ |
| lami | Induced Inflow Ratio | Induced Inflow | λ_i |
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

("Coeff", "Long", "Lat" are the only allowed abbreviations, Short level only, no period.)

## Sweep trim modes
| Key | Label |
|---|---|
| none | No Trim (Fixed Controls) |
| coll_all | Trim Collective Δθ · Every Point |
| rpm_all | Trim Rotor Speed Ω · Every Point |
| coll_hover | Trim Collective Δθ · Hover Only |
| rpm_hover | Trim Rotor Speed Ω · Hover Only |

Trim target is the Conditions target (CT or T). "Hover Only" solves the control at μ=0 and holds it fixed along the sweep. Shown as one dropdown in the sweep panel.
