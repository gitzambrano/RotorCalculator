# AGENTS.md — Working Rules and Governance for RotorCalculator

This document defines the core principles, engineering standards, aerodynamic governance, and development workflow for **RotorCalculator** across both the Android B4A ecosystem and the Web application.

---

## 1. Source of Truth and Aerodynamic Governance

1. **Theoretical Foundation**:
   - Rotor physics, coordinate conventions, and aerodynamic equations follow `docs/zBET-documentation.md`, based on standard rotary-wing literature:
     - Wayne Johnson, *Rotorcraft Aeromechanics* (Chapters 6 and 7).
     - J. Gordon Leishman, *Principles of Helicopter Aerodynamics* (Chapters 3 and 5).
     - W. Z. Stepniewski and C. N. Keys, *Rotary-Wing Aerodynamics*.
2. **Precedence of Technical Decisions**:
   - (1) Peer-reviewed rotary-wing aerodynamic literature;
   - (2) Python reference implementation (`tools/zBET.py`);
   - (3) Formal software requirements (`docs/software_requirements.md`);
   - (4) Numerical golden test cases in `tests/`.
3. **No Unjustified Physical Modifications**:
   - Every change to inflow equations, radial moments, drag models, or compressibility/tip-loss corrections (Prandtl-Glauert, Sissingh, Drees, Coleman) requires explicit technical justification and verification against the numerical reference matrix.
4. **Simplified Technical English (STE)**:
   - All user-facing documentation, physics manuals (`physics_help*.html`), contextual help dialogs, and diagnostic messages shall follow Simplified Technical English (STE) principles (ASD-STE100):
     - Use active voice and affirmative constructions.
     - State only one technical command or fact per sentence.
     - Keep sentences short, concise, and direct.
     - Use approved, consistent terminology without conversational filler or ambiguous abbreviations.
     - Maintain exact alignment with canonical symbols defined in `docs/nomenclature.md`.

---

## 2. Software Architecture (Clean Boundary)

RotorCalculator strictly separates computational logic from user interface across both Android and Web implementations:

$$\text{GUI / Input Controls} \longrightarrow \text{Validation \& SI Conversion} \longrightarrow \text{zBETEngine (Pure)} \longrightarrow \text{Formatting} \longrightarrow \text{GUI / Display}$$

### 2.1 Engine Rules (`zBETEngine.bas` & `web/src/engine.ts`):
- **Strict Isolation**: The calculation engine does not reference UI components, sensors, DOM elements, or platform-specific APIs.
- **Standardized SI Interface**: The engine accepts only fundamental SI units (kg/m³, m/s, rad, rad/s, N, N·m, W) or dimensionless parameters ($\mu, \mu_z, \alpha, \lambda, \sigma, C_T, C_Q$).
- **Structured Output**: The engine returns an immutable data structure containing all calculated dimensionless coefficients and dimensional performance quantities.
- **Portability**: The core engine compiles and executes identically in automated test harnesses (Python, Vitest, B4J) without code modifications.

### 2.2 Storage Layer (`RotorStorage.bas` & `web/src/storage.ts`):
- Manage saved geometries autonomously within internal application storage (`File.DirInternal` or `localStorage`), without requiring external runtime permissions.
- Support standard factory presets (UH-60, Bell 206, Bo 105, R44, DJI Drone) and custom rotor definitions with full CRUD operations (Create, Read, Update, Duplicate, Delete).
- Support portable backup and sharing via both text files (`.txt`) and structured JSON (`.json`) with validation of rotor counts and conflict-resolution workflows (Rename, Replace, Skip).

### 2.3 Cross-Platform Parity (APK & Web):
- The Web application (`web/`) is an equal first-class target with 1:1 mobile interaction parity to the native Android APK.
- All nomenclature, equations, unit conversions, theme color palettes, and contextual help descriptions must remain synchronized across both targets.
- Use `tools/build_help.py` to generate and update all help mirrors (`Files/`, `docs/`, and `web/public/`) simultaneously.

---

## 3. Human Interface and Visual Design System

1. **AeroCalculator Interaction Reference**:
   - RotorCalculator inherits the disciplined engineering grammar of AeroCalculator: aligned columns, high-contrast themes, explicit unit surfaces, and immediate recalculation upon input change.
2. **Canonical Three-Column Grid**:
   - Geometry and Conditions share one rigid three-column row structure:
     $$\textbf{Column 1 (Label Button)} \quad\vert\quad \textbf{Column 2 (Value / Selector)} \quad\vert\quad \textbf{Column 3 (Unit Button)}$$
   - All three columns maintain identical left/right edges, control heights, and vertical centers across every row on the page.
   - Column 1 (Label) is a real clickable `Button`. Tapping Column 1 opens the comprehensive contextual help modal for that parameter.
   - Column 2 (Value) displays the editable numeric value or selector text. For selectable parameters (Airfoil, Tip Loss, Compressibility, Operating Pair, Inflow Model), tapping Column 2 opens the modal choice sheet.
   - Column 3 (Unit) is a real clickable `Button`. Tapping a convertible unit opens the unit picker; for dimensionless parameters, it maintains the neutral grid alignment (`–`).
3. **Results Presentation**:
   - Results use a dedicated three-column format: **symbol-first quantity | numerical value | unit**.
   - Numerical values and unit strings remain strictly separated.
4. **Theme Support**:
   - Support three complete themes with equal hierarchy and contrast: **Default Dark**, **Light**, and **Midnight**.
   - Theme changes preserve the entire calculation state and navigation history.
5. **Universal Responsiveness**:
   - The interface operates reliably across compact phones (320dp), standard phones (360dp to 412dp), landscape orientations, and tablets (600dp to 768dp), including 130% system font scale.
   - Minimum interactive touch targets are approximately 48dp. The interface prefers vertical scrolling over shrinking fonts or compressing touch controls.
6. **Gesture Navigation**:
   - Support horizontal swipe gestures across the three primary tabs: `GEOMETRY` $\longleftrightarrow$ `CONDITIONS` $\longleftrightarrow$ `RESULTS`.
   - Implement horizontal velocity and diagonal rejection thresholds to prevent conflicts with vertical scrolling.
7. **Haptic Feedback**:
   - Provide subtle haptic feedback vibration (15ms) on all interactive button clicks, label taps, and unit selections.

---

## 4. Key Management, Keystore, and Google Play

1. **Credentials Stored Outside Version Control**:
   - Keystores, PEPK encryption keys, passwords, and Google Cloud service account JSON keys shall never be committed to Git.
   - Store signing credentials in the git-ignored `Key/` directory or pass them via environment variables (`B4A_KEY_FILE`, `B4A_KEY_PASSWORD`, `B4A_KEY_ALIAS`).
   - The official production signing key for Google Play is `Key/rotorcalculator.keystore` (alias: `rotorcalculator`).
2. **Google Play Console Deployment**:
   - Increment `#VersionCode` (strictly increasing integer) and update `#VersionName` before building release packages.
   - Generate signed Android App Bundles (`.aab`) targeting Android 16 (API 36) with backward compatibility to Android 7.0+ (API 24+).
   - Use `tools/upload_playstore.py` with the service account key to validate and publish releases to the Google Play Developer API.

---

## 5. Verification, Testing, and Release Gates

Validation requirements are separated into two distinct operational gates:

### Gate 1: Routine Edits (Algorithms, Physics, Documentation, Build Scripts, Test Harnesses)
- Run the physical consistency script: `python tools/verify_engine.py` (100% of golden reference cases must pass).
- Run the web automated test suite: `npm test` inside `web/` (all unit and integration tests must pass).
- Verify clean compilation of the B4A project without compiler errors or null warnings.
- **Emulator execution, manual UI walkthroughs, and screenshot captures are NOT required for routine edits.**

### Gate 2: Visual Layout Changes and Formal Release Candidates
- Execute local emulator or physical device installation (`adb install`).
- Validate the 9 target screen configurations: 320dp, 360dp, 393dp, 412dp, 600dp, 768dp, landscape orientations, and 130% font scale.
- Perform interactive smoke tests: swipe navigation, modal pickers, theme switching, parameter sweeps, and file export via Storage Access Framework.
- Capture and visually inspect real PNG screenshots to verify that no clipping, misalignment, or font wrapping defects exist.
- **Gate 2 is executed only when the user explicitly requests visual verification or before publishing a formal production release.**

---

## 6. Release Artifact Hygiene

- The current production target is **RotorCalculator 1.26 (versionCode 9)**.
- Release delivery does not require creating or packaging ZIP files. Deliverables are committed source, verified release APK/AAB for Android, and GitHub Pages deployment for Web.
- Never retain an APK or AAB in the repository that was built from an older source commit.
- Commit a release APK/AAB only after compiling the exact main source commit locally and validating its build artifacts.
- GitHub Actions serves as an auxiliary CI validator; it does not promote binaries or bypass local engineering verification.
