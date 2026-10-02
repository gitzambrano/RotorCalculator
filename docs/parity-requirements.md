# APK / web parity requirements and evidence

Audit baseline: source commit `6a1a233`, with subsequent local corrections on 2026-10-02. The Android source is `RotorCalculator.b4a`, `RotorPopups.bas`, `RotorStorage.bas`, `RotorNames.bas`, and `zBETEngine.bas`. Source inventory is evidence of implementation coverage, not proof of interactive, numerical, or visual equivalence. A compiled APK and the built web must be exercised for that proof.

## Function inventory

| Area | APK evidence | Web evidence | Source coverage / required interactive check |
| --- | --- | --- | --- |
| Three pages | `BuildUnifiedHeader`, `ShowPage`, tab handlers | `activatePage`, `.tab-btn` | Geometry, Conditions and Results present. Verify page restoration, modal back/close and scroll behavior. |
| Geometry inputs | `BuildGeometryEditorContent`, `edtGeom_TextChanged` | `bindInputListeners`, `setGeometryQuantity`, `refreshInputPresentation` | Nominal speed; R, Nb, cutout, c0/c1, taper, AR; reference/actual/thrust solidity; disk/reference/actual blade areas; root/tip pitch and twist; lift slope, Cd0 and fixed B present. Verify each bidirectional geometry edit plus chosen-unit conversion. |
| Airfoils | six `RotorPopups.Airfoils` plus Custom | `AIRFOILS`, `refreshAirfoilDisplay`, picker | NACA 0012, NACA 23012, Boeing Vertol VR-7, Sikorsky SC1095, Clark Y, Selig S8036 and Custom present. Coefficients match source. |
| Tip loss / compressibility | `btnTipLoss_Click`, `btnCompressibility_Click`, `RefreshTipFactorRow` | selectors and `renderDerivedGeometry` | None, Fixed B, Sissingh and PG on/off present. Non-fixed B must show calculated read-only value. |
| Rotor library | active bar, New, Rename, Save, Copy, Delete | rotor manager and geometry actions | CRUD and persistent active identity present. Verify naming dialog, 32-character constraint, duplicate name behavior and cancellation; draft must not overwrite saved geometry. |
| Presets | `CreateDefaultPresets` | `getFactoryPresets` | Six presets present. DJI/eVTOL root chord precision restored to exact Android values; regression verifies original active-span law and text backup roundtrip. |
| Restore presets | `RestoreFactoryPresets` | `resetToFactoryPresets`, restore action | Factory values restored while custom/renamed rotors and active identity survive. Tested in storage regression. |
| Geometry import/export | SAF text version 3, legacy parser, rename/replace/skip | file import, text backup v3, JSON compatibility, conflict modal | APK-compatible text format and legacy imports present. Verify conflict modes, dirty draft prompt, cancellation, export/reimport and actual mobile/desktop downloads. Web additionally accepts JSON. |
| Conditions atmosphere | altitude/temperature | atmosphere inputs | Present. Verify unit selection and display after reload; engine uses SI. |
| Alternative flow inputs | mu/Vx and alpha/Vz/muz selectors | horizontal/axial selectors | Present. Verify state preservation when operating trim is invalid; alpha is unavailable for zero forward speed with nonzero axial flow. Alternatives must never be summed. |
| Operating constraints | six `btnOperatingPair_Click` pairs | trim picker and two operating inputs | RPM+collective, RPM+CT, RPM+thrust, collective+CT, collective+thrust, CT+thrust all present. Verify seeds, cancellation, all unit conversions and solved state. |
| Inflow and drag | uniform/Coleman simple/Coleman-Feingold/Drees; fixed numerical-vectorial help | same four inflow choices, drag help button | Present. Drag is informational in APK, not a user-selectable physical model. |
| Results | `ResKeys` | `.result-row[data-key]` | Exact set comparison: 65 APK rows, 65 web rows; no missing or extra keys. Quantity/value/unit columns and contextual help require UI verification. |
| Parameter sweep / legacy polar handler | `btnViewPolarPlot_Click` opens parameter sweep | `initSweepModal`, `runParameterSweep` | The APK does not expose a separate polar chart; the legacy handler name refers to the sweep dialog. |
| Sweep quantities | `SweepParamKeys` | `SWEEP_PARAMS` | Exact set comparison: all 61 keys match. Catalogue covers coefficients, inflow, diagnostics, forces, torque, power, operating state and atmosphere. |
| Sweep curves | Models, alpha set, Vz set, muz set, Active | same five families (different internal numeric mapping) | All families present, 25 samples per curve. One-value custom family fixed; regression for all three physical families. |
| Sweep custom values | 1–9 comma-separated values; alpha strictly ±89, Vz ±200, muz ±0.50 | corresponding parser/range guard | Present. Verify one/nine values, duplicates, finite values, rejected empty/nonfinite/out-of-range tokens and Cancel. |
| Sweep trim / axes / range | five trim strategies; mu/Vx/mu-lambda; 0.3/0.4/0.5/0.6 | same options | Present. Verify fixed controls disable trim and selected family survives reopening. |
| Sweep marker / data ordering | `XOk`, `CurveOrder`, `LiveOnCurve` | `isSweepPointUsable`, `orderedSweepPoints`, `visibleSweepMarker` | Native gates now applied: finite supported points, negative mu/lambda rejected, sorted selected X axis, invalid gaps preserved, marker within requested mu range and 1% interpolated curve-span tolerance. Regression covers these rules. Browser plot inspection still required. |
| Sweep table / CSV / PNG | `BuildSweepTableRows`, SAF CSV/PNG | table rendering, CSV Blob and PNG canvas download | Present. Verify downloaded contents and image. Table/CSV formatting differences remain subject to review (see below). |
| Settings | 3 themes, SI/Imperial outputs, +1 decimal, 3 palettes | same settings | Present. Verify persistence and state preservation. Input defaults remain SI; output setting changes result presentation. |
| Quick converter | 14 forward/reverse modes and Swap | quantity/from/to selectors | Coverage requires all native pairs, including mm/in, and Swap. Source audit identified missing mm/in and Swap; root implementation underway. |
| Physics manual | dark/light/midnight HTML | corresponding public HTML/iframe | SHA-256 matches for all three original manual assets. Verify anchors, hyperlinks, scroll and popup opening in actual build. |
| About / Privacy | About dialog; native privacy HTML | About / inline Privacy modal | Both actions present. Privacy text is shorter/different on web; validate intended platform-specific content. |
| Web additions | not applicable | install PWA; downloadable offline ZIP | Verify install availability, download, extraction, offline use and export/import from the extracted application. |

## Source findings requiring closure

These are findings from the inventory snapshot; the root task may subsequently correct them. Replace pending status only after verifying the final source and exercising the behavior.

- Quick converter: native mm/in conversions and one-click Swap were missing from web. Native converter has 14 modes; web additionally has torque/pressure/density categories.
- Radius input picker: web list has m/ft/in; native also permits cm/mm.
- COPY: native asks the new rotor name and allows cancellation before creating; web originally creates immediately with generated name.
- Rename: native edits the active draft, rejects a duplicate and truncates to 32 characters; web originally auto-saves and silently chooses a unique name.
- Current page: native restores saved page; web originally always starts Geometry.
- Invalid trim and flow variable changes: native derives fallback representation at current rotor speed; web originally reads empty result fields and can zero the flow.
- Back handling: native closes the top popup, then navigates Results→Conditions→Geometry. Web Escape originally only closes the menu; browser back integration needs a deliberate platform-equivalent behavior.
- Sweep table: native mu/lambda X values use three decimals; web uses two. Native CSV dimensionless units use ASCII `[-]`, whereas web result headers currently include `[–]`. These are export-format differences, not missing data columns.
- Privacy: native opens full privacy HTML; web uses an inline browser-storage-specific summary. Review expected content separately from numerical functionality.

## Validation evidence and outstanding gates

The targeted regression run after the local preset/family/plot fixes passed 22 tests in `storage.test.ts` and `sweep.test.ts`. The previous full web suite passed 40 tests before these additional regressions. TypeScript checking passed after the plot changes. Run the final full suite/build after integrating root edits.

Source inspection and TypeScript tests do not prove B4A↔web numerical equivalence. Keep the local compiled B4A engine execution gate, Python reference matrix and existing source contracts. No aerodynamic equations were changed by this audit.

Pending interactive matrix: each rotor preset; all geometry edits and units; all six operating pairs; all alternative flow modes; invalid trim fallback; all inflow/tip/PG choices; every Results row/help; all 61 sweep quantities, five families, five trim modes, three axes, four ranges and custom bounds; CSV/PNG/text download and reimport; restore/draft/session persistence; converter forward/reverse pairs and Swap; themes/precision/palettes; PWA/offline download. Visual matrix remains 320/360/393/412/600/768 dp portrait, representative phone/tablet landscape and 130% font scale. Do not mark this matrix passed from source alone.
