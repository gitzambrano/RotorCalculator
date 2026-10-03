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
| Inflow and drag | uniform/Coleman/Coleman-Feingold/Drees; fixed numerical-vectorial help | same four inflow choices, drag help button | Present. Drag is informational in APK, not a user-selectable physical model. |
| Results | `ResKeys` | `.result-row[data-key]` | Exact set comparison: 65 APK rows, 65 web rows; no missing or extra keys. Quantity/value/unit columns and contextual help require UI verification. |
| Parameter sweep / legacy polar handler | `btnViewPolarPlot_Click` opens parameter sweep | `initSweepModal`, `runParameterSweep` | The APK does not expose a separate polar chart; the legacy handler name refers to the sweep dialog. |
| Sweep quantities | `SweepParamKeys` | `SWEEP_PARAMS` | Exact set comparison: all 61 keys match. Catalogue covers coefficients, inflow, diagnostics, forces, torque, power, operating state and atmosphere. |
| Sweep curves | Models, alpha set, Vz set, muz set, Active | same five families (different internal numeric mapping) | All families present, 25 samples per curve. One-value custom family fixed; regression for all three physical families. |
| Sweep custom values | 1–9 comma-separated values; alpha strictly ±89, Vz ±200, muz ±0.50 | corresponding parser/range guard | Present. Verify one/nine values, duplicates, finite values, rejected empty/nonfinite/out-of-range tokens and Cancel. |
| Sweep trim / axes / range | five trim strategies; mu/Vx/mu-lambda; 0.3/0.4/0.5/0.6 | same options | Present. Verify fixed controls disable trim and selected family survives reopening. |
| Sweep marker / data ordering | `XOk`, `CurveOrder`, `LiveOnCurve` | `isSweepPointUsable`, `orderedSweepPoints`, `visibleSweepMarker` | Native gates now applied: finite supported points, negative mu/lambda rejected, sorted selected X axis, invalid gaps preserved, marker within requested mu range and 1% interpolated curve-span tolerance. Regression covers these rules. Browser plot inspection still required. |
| Sweep table / CSV / PNG | `BuildSweepTableRows`, SAF CSV/PNG | table rendering, CSV Blob and PNG canvas download | Present. Verify downloaded contents and image. Table/CSV formatting differences remain subject to review (see below). |
| Settings | 3 themes, SI/Imperial outputs, +1 decimal, 3 palettes | same settings | Present. Verify persistence and state preservation. Input defaults remain SI; output setting changes result presentation. |
| Quick converter | 14 forward/reverse modes and Swap | quantity/from/to selectors | All 14 native modes, mm/in and Swap implemented and exercised in the browser. |
| Physics manual | dark/light/midnight HTML | corresponding public HTML/iframe | SHA-256 matches for all three original manual assets. Verify anchors, hyperlinks, scroll and popup opening in actual build. |
| About / Privacy | About dialog; native privacy HTML | About / inline Privacy modal | About now uses native wording/layout; Privacy opens the full themed HTML in-app. Three-theme real screenshot pairs captured. |
| Web additions | not applicable | install PWA; downloadable offline ZIP | Verify install availability, download, extraction, offline use and export/import from the extracted application. |

## Findings closed by this audit

- Native quick-converter coverage, mm/in and Swap added and exercised.
- Radius cm/mm picker options restored.
- COPY name prompt/cancellation and 32-character input added; cancellation and persistence exercised.
- Rename now modifies the active draft, checks duplicate names and limits input to 32 characters.
- Current page restoration exercised after reload.
- Invalid-trim flow conversion corrected and exercised across μ/Vx/α/Vz/μz.
- Escape and browser Back close the top popup; Back navigation exercised through Results→Conditions→Geometry.
- Native μ/λ table precision, ASCII dimensionless CSV units and scientific headers restored.
- Settings, About and full Privacy display corrected after additional real APK captures.

## Validation evidence and outstanding gates

Final integrated build and all 53 web tests passed. `verify_engine.py` and 76 Python tests passed. `verify_compiled_engine.py` executed the compiled B4A engine: 100/100 cases, 14 outputs per case, maximum absolute error 8.942e-09; all six operating pairs passed in three flow regimes.

`tools/check_web_complete_flows.py` exercised all 65 Results help dialogs, exported all 61 Sweep quantities, five families (including single custom values), three axes, all range controls, PNG, all 14 native quick conversions and Swap, copy cancellation/persistence and the mobile rotor picker. Download evidence is under ignored `qa-results/release-1.23/complete-flows/`.

`tools/check_web_condition_flows.py` exercised all six operating pair selectors, invalid-trim alternative flows, four inflow models, three tip-loss modes, PG on/off, reload persistence and browser Back through popup/Results/Conditions/Geometry. A real browser test caught an incorrect ordering in fallback μ→Vx conversion; the corrected test verifies μ=0.15 becomes Vx=33.15 m/s and returns to μ=0.15.

`tools/check_web_parity.py` passed draft/session persistence, editable geometry, desktop hover/click help, database text roundtrip, CSV/PNG/offline ZIP, three themes, offline HTML/PWA and 54 responsive page captures without JavaScript errors. Native converter and manual popup geometry was compared with actual emulator screenshots. These checks do not establish pixel identity for every popup.

Additional real APK review found Settings width/truncation and About/Privacy presentation differences. Settings now uses native mobile dimensions and complete labels; About uses the Android wording and dialog layout; Privacy opens the full themed document in an application modal. Static 400/700 Roboto instances derived from the emulator font are packaged for browser rendering. `tools/check_popup_parity.py` passed and produced 12 additional native/browser pairs (Settings, converter, About, Privacy × three themes). Native captures were repeated after reinstalling the unchanged validated APK on emulator-5580. Browser rasterization and system-button elevation still prevent a claim of pixel identity.

`tools/check_web_units_import.py` passed 37 geometry input-unit selections without changing the thrust result, all six factory preset selections and the four conflict actions Cancel/Skip/Replace/Rename. Replacement and renamed-copy database contents were checked, not only toast/modal visibility. The final public web also passed the complete catalog and 12-popup scripts after Pages deployment.

Source inspection and TypeScript tests do not prove B4A↔web numerical equivalence. Keep the local compiled B4A engine execution gate, Python reference matrix and existing source contracts. No aerodynamic equations were changed by this audit.

Additional exhaustive combinations not individually certified (the exercised subsets are listed above): each rotor preset; all geometry edits and units; all six operating pairs; all alternative flow modes; invalid trim fallback; all inflow/tip/PG choices; every Results row/help; all 61 sweep quantities, five families, five trim modes, three axes, four ranges and custom bounds; CSV/PNG/text download and reimport; restore/draft/session persistence; converter forward/reverse pairs and Swap; themes/precision/palettes; PWA/offline download. Visual matrix remains 320/360/393/412/600/768 dp portrait, representative phone/tablet landscape and 130% font scale. Do not mark this matrix passed from source alone.
