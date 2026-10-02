# Web / Android parity audit — 2026-10-02

Reference: Android source commit `07447eb`, RotorCalculator 1.23 (versionCode 6), and the locally installed emulator APK. `Objects/RotorCalculator.apk` is ignored by Git and is not a tracked release artifact. Android source and rotor equations were not changed during this audit.

## Corrections

- Geometry follows Android ordering, footer actions, shared label/value/unit grid and responsive names. Seven coupled geometry quantities previously shown read-only are editable through the existing SI engine boundary. Tip factor B is editable only in Fixed mode; None/Sissingh show the actual calculated value.
- Desktop retains a wide layout, full engineering names where they fit, contextual hover/focus help and click popups. Selector labels open the same choices as their value controls; long press opens help. Mobile uses the Android compact selector captions.
- Draft geometry and condition sessions survive reload. Airfoil names reflect the current polar, including Custom. Switching to α cannot discard a nonzero axial flow at zero horizontal speed. Zero temperature and zero profile drag remain valid inputs.
- Length, area, angular-speed and angle unit conversions work in both directions. Converting presentation does not change the SI engine state.
- Restore Factory Presets preserves custom and renamed geometries. Import resolves unsaved edits, validates geometry, and assigns independent IDs. Copy/New/Save/import keep library and geometry names consistent. The manager supports renaming.
- Geometry TXT exchange remains compatible with Android. Sweep CSV and PNG download through the browser. Settings additionally offers an offline ZIP containing the calculator, assets and physics manuals. The extracted `index.html` works locally; installation uses the hosted HTTPS PWA.
- Web version now matches Android 1.23. All install buttons share one browser installation prompt. Development does not register a production cache worker.
- Popups opened inside Settings are stacked above their parent; previously theme/palette choices could be visible but unclickable. The full contextual help catalog is now generated directly from `RotorNames.bas` during the web build.

## Verification

- B4A compiled locally successfully. Python reference/source verification passed; compiled B4A matched the 100-case Python matrix and all six operating pairs. Compiled diagnostic identities passed 100 cases.
- Python suite: 76 tests. Web suite: 42 tests, including a source-based nomenclature parity guard and unit/storage regressions. TypeScript/Vite production build succeeded.
- Browser checks: draft and condition reload, editable geometry, desktop hover/click help, APK-format TXT export/import roundtrip, CSV/PNG downloads, ZIP integrity, extracted offline calculation, all three themes and service-worker offline reload. Touch tab swipes and manager drag reordering passed. No JavaScript exceptions were detected.
- Responsive browser captures: 320, 360, 393, 412, 600 and 768 portrait widths, phone/tablet landscape and 1920 desktop, at normal and 130% CSS scale (54 page captures). Horizontal document overflow and column overflow were checked. CSS scale is a browser stress check, not a claim of Android font-scale equivalence.
- Current Android screenshots and representative web captures were inspected visually. This is functional/layout parity work, not a pixel-diff certification across operating-system font rendering. Release distribution targets the hosted web app and GitHub release v1.23. Both contain the same verified Android APK and web version 1.23.
- The B4A validation build cleared the local APK. It was recovered from the installed 1.23 emulator package (728185 bytes); the local/device SHA-256 matches `6abfca194c0f7d200ded31f8add2629b4a820acb4847badb2e1646808bb86ef3`. A verified copy is distributed at `RotorCalculator-1.23.apk`; `release-1.23.json` records the Android source commit and SHA-256. The APK is excluded from the offline web ZIP and service-worker precache.

Local evidence: `output/playwright/` contains the screenshots, exported backups, CSV/PNG and downloaded ZIP. It is QA output, not release source.

## External UI comparison and final release validation

- The signed 1.23 APK was reinstalled locally. Every one of its 41 payload ZIP entries equals the locally compiled source payload; only signature META-INF entries are additional. Android source remains exactly `07447eb`.
- Actual emulator captures cover Dark, Light and Midnight at 320, 360, 393, 412, 600 and 768 dp, 320 dp with Android font scale 130%, and phone/tablet landscape. Geometry, Conditions, Results, Sweep and Menu are compared with the web in matching content viewports: 135 pairs. Failed/stale UI dumps were discarded and affected captures repeated.
- Web now bundles the Android Roboto font with its Apache 2.0 license, follows Android input precision, and uses a full-screen mobile Sweep with parameter selectors and visible TABLE/CSV/PNG footer actions. Default sweep family and collective trim match Android. Midnight menu/help/selection sheets use the native navy palette.
- Atmosphere preprocessing now matches Android UI constants and clamp limits; its numerical justification and explicit tolerances are documented in zBET-documentation.md. No rotor engine equation or Android source was changed.
- A geometry TXT backup exported by the actual APK through Android's document picker was imported by the browser; all five native geometries were accepted. The APK also read the browser-exported TXT and reached its import confirmation; that native import was cancelled to preserve the emulator library. The APK also saved actual CSV and PNG sweep files through Storage Access Framework; their contents/signatures were checked. Browser export/import, CSV/PNG, offline ZIP, desktop contextual help and persistent settings passed.
- Local comparison gallery: `qa-results/release-1.23/comparison/review.html` (ignored QA output). Platform rasterization, operating-system document pickers and the intentionally wider desktop presentation are not pixel-identical. These checks establish the tested behavior and reviewed layouts; they are not an assertion that every possible device or input is defect-free.
