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
- [x] Keep Geometry on the same centered tablet content width as Active Rotor, Conditions and Results.
- [x] Compact Geometry chrome in landscape by sharing one Active Rotor/action band.
- [x] Add compact 320 dp / 130% wording for Result status and Sweep controls/footer without shrinking touch targets.
- [x] Reduce normal label/unit visual weight and make Derived Geometry visibly read-only.
- [x] Remove stale direct-Geometry contradictions from the offline verifier and make the Geometry runtime scroll assertion viewport-aware.
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

Editing radius scales both chords proportionally, preserving σgeom, AR, taper and c/R. Editing c0/c1 recomputes σgeom/AR. Editing σgeom or AR scales both chords with constant taper. Blade-count changes σgeom only. Root cutout changes active-span metrics/integrals only.

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
- Geometry action buttons (SAVE/COPY/DELETE) at the end of the Geometry page;
- canonical nomenclature per `docs/nomenclature.md` (Description Symbol labels; collective symbol Δθ, twist symbol θ_twist; Full/Short/Narrow levels chosen once per page);
- one sweep trim dropdown (No Trim, Collective/Rotor Speed x Every Point/Hover Only) and three plot palettes;
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


## 10. 2026-09-30 responsive-UI checkpoint

Implemented and committed in `main`:
- Geometry uses the same centered maximum content width as Active Rotor, Conditions and Results on wide screens;
- landscape Geometry puts Active Rotor and SAVE/COPY/DELETE in one compact horizontal band;
- 320 dp / 130% font-scale uses compact Result status and Sweep control/footer wording without shrinking touch targets;
- normal label/unit controls have lower visual weight and Derived Geometry is visibly read-only;
- the initial Sweep label is canonical (`CQ — Torque`);
- the offline verifier reflects the direct in-page Geometry architecture and rejects the removed popup/library architecture;
- source tests cover the screenshot-driven responsive fixes.

Validation already completed:
- numerical/reference regression passed;
- current B4A source compiled successfully and produced the APK;
- the APK installed and launched in the Android emulator.

Current blocker:
- the full Android UI matrix still stops in `tools/ci_ui_qa.sh` at the Geometry section check because the scroll helper can jump past the visible `ROTOR AERODYNAMICS` heading. This is a QA-harness failure, not an observed crash or numerical failure.

Remaining work before calling the frontend 5/5:
1. make the Geometry scroll assertion deterministic (small-step scroll / locate-before-tap) without weakening the check;
2. rerun the full APK interaction matrix from the exact current `main`;
3. review fresh screenshots at 320×568, 320×568 @130%, 360×780, 393×873, 412×915, 600×960, 768×1024, 915×412 and 1024×600;
4. specifically confirm tablet Geometry width, landscape Geometry chrome, 130% Result status, Sweep range/hover/footer, and Derived Geometry hierarchy;
5. only then apply any further visual changes found by the screenshots.

## 11. 2026-09-30 release completion work (local evidence)

Starting checkout: `c3d491b250f4c4b0ceae7acf1501868727ba7e7a`, on `main`, clean after remote fast-forward check.

Implemented during this audit:
- Context dialogs for Geometry/Conditions labels and Results; selectors open directly with context, selected choices and Cancel preserving state.
- Flow equivalents appear in Results, without redundant small captions in Conditions.
- Mathematical indices and inverse-angle units are rendered legibly; geometry precision follows physical scale and avoids gratuitous chord trailing zeros.
- Long rotor names wrap, SAVE has primary emphasis, tablet widths stay centered, landscape actions share a band, and Results retain separate value/unit columns.
- Android 16 system-bar/display-cutout insets are applied once to the usable root rectangle without IME; rebuilding preserves dirty state.
- Sweep control wording, legend columns and tick margins respond to available space and font scaling.
- Offline privacy policy and real Android store-capture automation replace reliance on web mockup screenshots.
- Publication tooling is adapted from AeroCalculator; upload key and API credentials are outside Git.

A compiled-engine regression was discovered and fixed independently of UI work: invalid collective candidates could leave a zero residual that created a false bracket. See `docs/trim-regression-2026-09-30.md` and commit `310cd64`. No aerodynamic formula changed.

Evidence obtained locally so far:
- `python tools/verify_engine.py`: PASS, 100/100 numerical reference cases; maximum momentum closure residual 9.698e-14.
- `python -m pytest -q`: 62 passed.
- `python tools/verify_compiled_engine.py`: actual compiled B4A engine PASS, 100 cases × 14 outputs (maximum absolute difference 8.942e-09), all six operating pairs × three flow states, and default CT target closure.
- B4ABuilder 13.70 compiled the current source successfully against Android SDK 36.
- Real APK installs and interactions executed locally. Screenshots have revealed and driven fixes for name truncation, header overlap, narrow sweep wording, legend overlap and tick clipping.
- Full nine-profile harness remains in progress. Landscape inspection exposed a stale hierarchy used to calculate swipe bounds; the dump helper now updates the scroll geometry after every fresh dump. The ROTOR AERODYNAMICS assertion remains intact.

Play Console: RotorCalculator created as a free app in Flight Dyn. Privacy URL, sign-in access, ads, government/health/financial declarations, adult target audience and absence of Advertising ID are saved. Data safety is drafted. Content rating, listing, signed bundle, final local validation and review submission remain outstanding. No release has been published and no 5/5 score is claimed at this checkpoint.

## 12. 2026-10-01 Web Parity and Responsive Fitting Synchronization

- **Icon Parity**:
  - Synchronized new launcher and header icons generated by `tools/generate_icon.py` across `web/src/assets/icon.png`, `web/public/icon.png`, `web/src/assets/icon_header.png`, and `web/public/icon_header.png`.
  - Topbar brand icon displays `icon_header.png` matching APK's `bmpImage1.Initialize(File.DirAssets, "icon_header.png")`.
  - About modal displays high-resolution `icon.png` (512×512).

- **Grid Proportions Parity (`ComputeColumns` / `BuildPageRes`)**:
  - Geometry and Conditions `.engineering-row` grid proportions updated to `48% 32% 18%` (2% gap) across all breakpoints, matching APK's `ColLblW` (48-49%), `ColValW` (32%), `ColUnitW` (18-19%). This frees 60% more horizontal width for row label buttons on mobile screens.
  - Results `.result-row` grid proportions updated to `43% 33% 22%` (2% gap), matching APK's `nameW` (42-43%), `valW` (33%), `unitW` (22-24%).
  - Added strict `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to row labels, unit buttons, action buttons, tab buttons, and result labels, preventing unwanted text wrapping.

- **Authoritative Multi-Level Label Fitting (`RotorNames.bas` Parity)**:
  - Implemented exact multi-level fitting algorithm:
    - Level 0 (L): Full Description + Symbol
    - Level 1 (M): Short Description + Symbol
    - Level 3 (A): Abbreviated Description + Symbol
    - Level 2 (S): Short Description only
    - Level 4: Symbol only
  - Fit order on overflow at 13px: `0 (L) -> 1 (M) -> 3 (A) -> 2 (S) -> 4 (symbol)`.
  - Dynamic font size scaling between 13px and 15.5px using Canvas text metrics with underscores stripped (`cv.MeasureStringWidth(text.Replace("_", ""))`).
  - Real HTML `<sub>` tags for subscript notation (`getRichLabelHtml`).
  - Fixed Results row key query (`data-key` instead of nonexistent `data-canonical`) so responsive labels update dynamically across all three tabs.
  - All tests (`npm --prefix web test`, `python tools/verify_engine.py`, `python tests/test_b4a_state_safety.py`) pass and `npm --prefix web run build` compiles cleanly to `docs/`.



## APK 1.23 — result diagnostics

Native APK only: versionCode 6. Add total axial speed V_{z,tot}, advancing/retreating tip tangential speed, retreating tip Mach and section AoA/inflow angles at 75% radius. Preserve Climb Speed V_z. Adv./Ret. abbreviations are allowed; result symbols remain present with native subscripts, one line without truncation. Section diagnostics use final trimmed geometry and prescribed inflow; no changes to integrated rotor loads. Local QA evidence is recorded in qa-results.

Labels always use name followed by symbol. Total Axial Speed may shorten to Axial Speed; The minimum level is symbol-only, per the latest explicit instruction. A 75% diagnostic uses Adv. AoA / Ret. AoA and Adv. Inflow / Ret. Inflow at abbreviated level, retaining its mathematical subscript. Compiled diagnostics are checked by `python tools/verify_apk_diagnostics.py`.


Latest APK label correction: omit Section in full AoA names; abbreviated names are Adv. AoA, Ret. AoA, Adv. Inflow, Ret. Inflow. Minimum is symbol-only. See docs/apk-label-catalog.md for all canonical and fixed control captions. Emulator validation is performed only when explicitly requested by the user; this overrides automatic emulator QA for routine edits.


### APK — nomes aprovados e nível intermediário de forças (2026-10-01)

- Ordem responsiva: L completo → M curto → A abreviado → S estreito → mínimo. Results agora também tenta S antes do símbolo.
- Símbolo sempre depois do nome, com subscritos; mínimo somente símbolo para grandezas com símbolo.
- sigmaT: A/S `Thr. Solidity σ_TR`; comp: A/S `Compres.`, mínimo `Comp.`.
- T0: S `Temp. T_amb`; drag: A/S `Integration`, mínimo `Integ.`.
- LDe: A/S `Eff. (L/D)_e`, sem duplicar a razão no nome.
- rpmNom: L/M `Rotor Speed Ω_nom`, A/S `Rot. Speed Ω_nom`; rpm: A/S `Rot. Speed Ω`.
- muLam: M/A/S `Advance/Inflow μ/λ`. Mtip: L `Tip Mach M_tip`; Madv: L `Advancing Tip Mach M_adv`. Sem “Number”.
- Induced Factor permanece como está.
- Hi/CHi: M `Induced In-Plane Force`, A `Ind. In-Plane Force`, S `Ind. In-Plane`; H0/CH0: M `Profile In-Plane Force`, A `Prof. In-Plane Force`, S `Prof. In-Plane`. Cada nível mantém seu símbolo após o nome.
- O ajuste mede a largura e remove “Force” no nível S quando necessário, antes de recorrer somente ao símbolo. A tabela completa é gerada em docs/apk-label-catalog.*.
- Testes no emulador somente mediante pedido explícito do usuário.


### Pontuação das abreviações do APK (2026-10-01)

Usar `Adv.`, `Act.`, `Geom.`, `Thr.`, `Prof.`, `Ind.`, `Rot.` e `Eff.` em todos os níveis abreviados. `Coeff` e `Dyn` permanecem sem ponto. Nomes completos e símbolos não mudam. O nível intermediário sem Force continua antes do símbolo.
# Auditoria de paridade web — 2026-10-02

Web alinhada ao Android 1.23: grid e nomes responsivos, edição de todas as grandezas de geometria, conversões SI, persistência de rascunhos/condições, CRUD e importação/exportação corrigidos, help desktop e download ZIP offline. Relatório e limites de validação: `docs/web-parity-audit.md`. Código Android preservado. Motor web corrigido para as equações governadas de influxo/PG e coletivo incremental; 200 casos dourados e 18 pares operacionais passam, e os CSVs reais APK/web coincidem. Pré-processamento atmosférico web alinhado às constantes e limites do APK, com tolerâncias documentadas. Distribuição 1.23 inclui APK validado, ZIP web offline e relatório de 135 pares de screenshots reais em três temas e nove configurações.
