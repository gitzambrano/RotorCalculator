# RotorCalculator

**RotorCalculator** is an engineering aerodynamics calculator for helicopters, autogyros, and eVTOL rotorcraft. It is available as a native Android application built with Basic4android (B4A) and as a responsive browser application built with TypeScript and Vite. The analytical and numerical **zBET engine** solves Blade Element Theory (BET) equations coupled with Momentum Theory across hover and forward flight regimes.

Developed by Gustavo José Zambrano.

- **Web Application:** [Open RotorCalculator](https://gitzambrano.github.io/RotorCalculator/)
- **Google Play:** [RotorCalculator on Google Play](https://play.google.com/store/apps/details?id=flightdyn.rotorcalculator)
- **Production Target:** Version 1.28 (versionCode 11)

---

## Aerodynamic Capabilities

- **Blade Element Theory (BET):** Performs numerical integration over the blade radius with non-uniform chord distributions and linear blade twist.
- **Inflow Models:** Implements Uniform, Coleman, Coleman-Feingold (NDARC), and Drees first-harmonic inflow gradients ($K_x, K_y$) closed with Momentum Theory.
- **Tip-Loss Corrections:** Supports None ($B = 1.0$), Fixed factor ($B = 0.97$), and dynamic Sissingh coupling ($B = 1 - \sqrt{2 C_T}/N_b$).
- **Compressibility Corrections:** Applies Prandtl-Glauert subsonic correction to the blade lift-curve slope with advancing tip Mach ($M_{\text{adv}}$) monitoring.
- **Profile Drag Integration:** Uses 2D Gauss-Legendre quadrature (16 radial nodes, 24 azimuthal nodes) for exact numerical-vectorial profile drag ($C_{H0}, C_{Q0}$).
- **Flow Angle Conventions:**
  - Horizontal: Advance ratio $\mu_x \ge 0$ and forward airspeed $V_x$.
  - Axial: Disk angle of attack $\alpha$ ($\alpha > 0$ denotes wind arriving from below), vertical climb rate $V_z$, and vertical advance ratio $\mu_z$.
- **Operating Modes (Six Prescribed Pairs):**
  - Rotor Speed + Collective Pitch ($\Omega + \Delta\theta$)
  - Rotor Speed + Target Thrust ($\Omega + T$)
  - Rotor Speed + Target Thrust Coefficient ($\Omega + C_T$)
  - Collective Pitch + Tip Speed ($\Delta\theta + \Omega R$)
  - Target Thrust + Tip Speed ($T + \Omega R$)
  - Target Thrust Coefficient + Tip Speed ($C_T + \Omega R$)

---

## User Interface and Features

- **Canonical Three-Column Grid:** Maintains a disciplined layout across Geometry, Conditions, and Results:
  $$\textbf{Column 1 (Label Button)} \quad\vert\quad \textbf{Column 2 (Value / Selector)} \quad\vert\quad \textbf{Column 3 (Unit Button)}$$
- **Contextual Technical Help:** Tapping Column 1 opens an in-depth contextual help dialog with definitions, governing equations, typical ranges, and derivation details.
- **Bidirectionally Coupled Geometry:** All 14 geometric parameters are editable inputs in real time:
  - Changing Rotor Radius $R$ scales root and tip chords, preserving Reference Solidity $\sigma_{\text{REF}}$ and Aspect Ratio $\text{AR}$.
  - Changing Reference Solidity $\sigma_{\text{REF}}$, Actual Solidity $\sigma_{\text{act}}$, or Thrust-Weighted Solidity $\sigma_{\text{TR}}$ rescales chords while preserving Taper Ratio $c_T/c_R$.
  - Changing Reference Blade Area $A_{\text{REF}}$ or Actual Blade Area $A_{\text{act}}$ rescales chords accordingly.
  - Changing Taper Ratio $c_T/c_R$ adjusts root chord $c_R$ and tip chord $c_T$, preserving Reference Solidity $\sigma_{\text{REF}}$.
  - Changing Total Blade Twist $\theta_{\text{twist}}$ adjusts root pitch $\theta_R$ and tip pitch $\theta_T$, preserving mean blade pitch.
  - Disk Area $A_{\text{DISK}} = \pi R^2$ and Disk Loading $T/A_{\text{DISK}}$ update immediately with radius and thrust.
- **Nine Canonical Result Sections:**
  1. Primary Performance ($T, P, P_i, P_0, Q, H, Y, M_x, M_y$)
  2. Dimensionless Coefficients ($C_T, C_Q, C_{Qi}, C_{Q0}, C_H, C_{Hi}, C_{H0}, C_Y, C_{Mx}, C_{My}$)
  3. Power and Force Breakdown ($Q_i, Q_0, H_i, H_0, P_{\text{air}}, C_{Pair}$)
  4. Rotor Dynamics and Loading ($T/A_{\text{DISK}}, T/P, C_T/\sigma_{\text{TR}}, \bar{C}_L, \text{FM}, (L/D)_e$)
  5. Inflow and Wake State ($\lambda, \lambda_i, \lambda_h, \mu/\lambda, T_c, P_c, K_x, K_y, \chi, B$)
  6. Tip Kinematics and Mach ($\Omega R, M_{\text{tip}}, M_{\text{adv}}, M_{\text{ret}}, V_{\text{adv}}, V_{\text{ret}}, V_{z,\text{tot}}$)
  7. Section Diagnostics: 25% Radius ($\alpha_{\text{adv},25}, \alpha_{\text{ret},25}, \phi_{\text{adv},25}, \phi_{\text{ret},25}$)
  8. Section Diagnostics: 50% Radius ($\alpha_{\text{adv},50}, \alpha_{\text{ret},50}, \phi_{\text{adv},50}, \phi_{\text{ret},50}$)
  9. Section Diagnostics: 75% Radius and Tip ($\alpha_{\text{adv},75}, \alpha_{\text{ret},75}, \phi_{\text{adv},75}, \phi_{\text{ret},75}, \alpha_{\text{adv,tip}}, \alpha_{\text{ret,tip}}, \phi_{\text{adv,tip}}, \phi_{\text{ret,tip}}$)
- **Universal Parameter Sweeps:** Generates multi-curve parametric sweeps vs advance ratio ($\mu_x$) across all 61 output quantities:
  - Five curve families: Inflow Models, Constant $\alpha$ set, Constant $V_z$ set, Constant $\mu_z$ set, and Active Rotor.
  - Five trim modes: No Trim (Fixed Controls), Trimmed Collective (Every Point), Trimmed Rotor Speed (Every Point), Fixed Collective (Hover Only), Fixed Rotor Speed (Hover Only).
  - Interactive static plots with tap readouts, multi-theme palettes, and full CSV/PNG export.
- **Rotor Management and Storage:**
  - Built-in factory presets: UH-60 Black Hawk, Bell 206 JetRanger, Bo 105, Robinson R44, DJI Matrice 300, and Generic eVTOL.
  - Full CRUD operations: Create, Read, Update, Duplicate, and Delete custom rotors.
  - Versioned database backup and sharing via structured text files (`.txt`) and JSON (`.json`) with interactive conflict resolution (Rename, Replace, Skip).
- **Engineering Tools:**
  - Built-in engineering unit converter with 14 forward/reverse physical modes and Swap.
  - Bundled offline MathML physics manuals (`physics_help.html`, `physics_help_light.html`, `physics_help_midnight.html`).
- **Four High-Contrast Themes:** Default Dark, Light, Midnight Blue, and Sepia.

---

## Documentation

- **Software Requirements:** Refer to [`docs/software_requirements.md`](docs/software_requirements.md) for formal functional requirements and engineering specifications.
- **Coding Governance:** Refer to [`AGENTS.md`](AGENTS.md) for architectural rules, test gates, and design standards.
- **Canonical Nomenclature:** Refer to [`docs/nomenclature.md`](docs/nomenclature.md) for the binding list of symbols, descriptions, units, and abbreviations.
- **Aerodynamic Reference:** Refer to [`docs/zBET-documentation.md`](docs/zBET-documentation.md) for mathematical derivations and aerodynamic formulas.
- **Platform Parity:** Refer to [`docs/parity-requirements.md`](docs/parity-requirements.md) for Android APK and Web application equivalence audits.

---

## Repository Structure

```text
RotorCalculator.b4a         Main B4A project and Android application logic
zBETEngine.bas              Pure numerical zBET aerodynamic calculation engine
RotorStorage.bas            Rotor geometry database and file interchange
RotorPopups.bas             Airfoil database, technical popups, and sweep plotting
RotorNames.bas              Canonical nomenclature, symbol definitions, and help texts
Files/                      Android runtime assets, layouts, and offline manuals

web/                        TypeScript / Vite responsive browser application
docs/                       Technical documentation and GitHub Pages deployment
tests/                      Python and TypeScript numerical verification suites
tools/                      Automated verification scripts, build tools, and store uploaders
store/                      Google Play Store metadata, graphics, and release artifacts
```

---

## Verification and Quality Gates

All modifications must pass formal automated test suites:

1. **Physical Engine Verification:**
   ```bash
   python tools/verify_engine.py
   pytest tests
   ```
   Validates momentum balance closure ($|f(\lambda_i)| < 10^{-13}$), bidirectional coupling laws, and 100% of golden reference cases against `tools/zBET.py`.

2. **Web Application Test Suite:**
   ```bash
   npm --prefix web test
   npm --prefix web run build
   ```
   Validates numerical parity, storage contracts, and browser components.

3. **Android B4A Compilation:**
   Validates error-free compilation of `RotorCalculator.b4a` targeting Android 16 (API 36).

---

## License

RotorCalculator is licensed under the GNU General Public License v3.0. See [LICENSE.txt](LICENSE.txt).
Copyright © Gustavo José Zambrano.
