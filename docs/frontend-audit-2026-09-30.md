# Frontend discoverability audit — 2026-09-30

This is a control inventory and review record, not a substitute for real APK tests.

| Group | Control class and expected interaction |
|---|---|
| Active Rotor | Selector: saved rotor list and NEW ROTOR; current selection visible |
| Name | Text input; label opens current full name and SAVE guidance |
| R, Nb, x₀, c₀, c₁, σref, AR, θroot, θtip | Numeric inputs; each label explains definition and geometry coupling |
| σgeom, σthrust, taper, disk/blade areas, twist | Read-only derived values in the same grid; labels explain definitions |
| Airfoil | Selector; options show section name, lift slope and profile drag |
| a₀, Cd₀ | Numeric section properties; contextual definitions |
| Tip Loss | Selector: None/full span, Fixed B/prescribed tip radius, Sissingh/thrust-dependent factor |
| B | Numeric only for Fixed B; contextual explanation of availability |
| Compressibility | Selector: Off or Prandtl–Glauert On |
| SAVE, COPY, DELETE | Actions; primary/secondary hierarchy and deletion confirmation |
| h, Tair | Numeric atmospheric inputs; pressure-altitude/temperature explanations and unit conversion |
| μ / Vx | One horizontal-flow selector; value and unit share canonical grid |
| α / Vz / μz | One axial-flow selector with explicit physical sign convention |
| Operating Inputs | Selector: exactly two prescribed inputs for each of six pairs |
| RPM, Δθ, CT, thrust | Numeric prescribed quantities; labels explain constraint meaning |
| K_ind | Numeric induced-power factor; contextual meaning and typical range |
| Inflow | Selector; named models and gradient descriptions |
| Profile Drag | Fixed Numerical Vectorial model; label explains quadrature |
| Results | Read-only quantity/value/unit rows; contextual definition for each output |
| Result status / operating solution | Status and solved-state explanation; flow equivalents consolidated here |
| Sweep Y | Result selector using the canonical result catalog and units |
| Sweep family / VALUES | Family selector and parameter/unit-specific custom-values dialog |
| Sweep X / range | μ or Vx representation selector and μ-domain limit selector |
| HOVER TRIM | Toggle; only hover is trimmed when enabled; selected state visible |
| Plot / legend / active marker | Derived visual outputs; shared data with TABLE/CSV/PNG |
| TABLE / CSV / PNG | Actions; table in app, file destination chosen through Android SAF |
| Settings | Persistent theme, unit system and extra result decimal |
| Geometry import/export | SAF actions; malformed/domain-invalid import rejected atomically |
| Factory restore | Action preserves user-created rotors |
| Help / Physics / Conventions / Privacy | Offline explanations, accessible from global menu |

Dialog review criteria: initiating control, clear title, technically meaningful options, current selected choice, Cancel retaining state, canonical model/unit names, and a reason to exist. Geometry opens in the editor; the removed library popup has not returned.

Real screenshot findings corrected during review: name truncation on intermediate widths; Android 16 system-bar overlap; narrow Sweep hover wording; four-column inflow legend overlap; Y tick text clipping at accessibility font scaling. The final screenshot score matrix is still pending the exact-revision release run.
