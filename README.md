# RotorCalculator

**RotorCalculator** is a comprehensive helicopter, rotorcraft, and eVTOL aerodynamics calculator available as an Android application built with **Basic4android (B4A)** and as a high-performance responsive browser application. Powered by the analytical and numerical **zBET engine**, it provides Blade Element Theory (BET) solutions coupled with Momentum Theory across hover and forward flight regimes.

Developed by Gustavo José Zambrano.

**Web application:** [Open RotorCalculator](https://gitzambrano.github.io/RotorCalculator/)

[![Web App](https://img.shields.io/badge/Web-RotorCalculator-00E5FF?logo=googlechrome&logoColor=white)](https://gitzambrano.github.io/RotorCalculator/)
[![Google Play](https://img.shields.io/badge/Google_Play-RotorCalculator-green?logo=googleplay&logoColor=white)](https://play.google.com/store/apps/details?id=flightdyn.rotorcalculator)

---

## Capabilities

- **Blade Element Theory (BET)**: Numerical integration over the blade radius with non-uniform chord distributions and non-linear or linear blade twist.
- **Inflow Models**: Uniform, Coleman, Coleman-Feingold, and Drees first-harmonic inflow gradients ($K_x, K_y$) closed with Momentum Theory.
- **Tip-Loss Corrections**: None ($B = 1.0$), Fixed factor ($B = 0.97$), and dynamic Sissingh coupling ($B = 1 - \sqrt{2 C_T}/N_b$).
- **Compressibility Corrections**: Prandtl-Glauert subsonic correction on lift curve slope with advancing tip Mach ($M_{\text{adv}}$) monitoring.
- **Profile Drag Integration**: 2D Gauss-Legendre quadrature (16 radial nodes, 24 azimuthal nodes) for exact numerical-vectorial profile drag ($C_{H0}, C_{Q0}$).
- **Operating Modes & Trim**:
  - Manual Collective pitch ($\theta_0$) with fixed RPM.
  - Automatic collective trimming to Target Thrust ($T$).
  - Automatic collective trimming to Target Thrust Coefficient ($C_T$).
  - Automatic RPM trim.
  - Sweep trim dropdown: No Trim, Collective or Rotor Speed trimmed at every point or at hover only.
- **Flow Angle Conventions**:
  - Horizontal: Advance ratio $\mu_x \ge 0$ and forward airspeed $V_x$.
  - Axial: Disk angle of attack $\alpha$ ($\alpha > 0$ denotes wind arriving from below), vertical climb rate $V_z$, and vertical advance ratio $\mu_z$.
- **Parameter Sweeps**: Full multi-curve parametric sweeps vs advance ratio ($\mu_x$) over dimensional and coefficient outputs. Plots are static with a tap readout, three selectable palettes, and CSV/PNG export.
- **Rotor Management**: Built-in factory presets (UH-60 Black Hawk, Bell 206 JetRanger, Bo 105, Robinson R44, DJI Matrice 300, eVTOL) with local persistence, custom create/duplicate/delete, and import/export of the versioned text geometry database (Settings).
- **Coupled Geometry Editing**: Every geometry quantity is editable; radius and solidity scale chords preserving $\sigma_{ref}$, taper keeps $\sigma_{ref}$, and $\theta_{twist}$ keeps mean pitch.
- **Help**: Long-press any label for contextual help; an offline physics manual (MathML) is bundled. Labels follow `docs/nomenclature.md`.

---

## Documentation

- **In-app help.** Open the Physics Manual from the help entry in the app for the offline Physics Manual (`Files/physics_help.html`, light and dark variants). It is self-contained: conventions and sign rules, every geometric parameter with its coupling rule, flight condition and ISA atmosphere, inflow models and tip loss, the analytical coefficient equations with a where-list for every symbol, derived outputs, trim modes, model limits and references.
- **Context help.** Long-press any label or unit in Geometry, Conditions, Results or the sweep panel for the definition, equation, typical range and how the value is obtained.
- **Nomenclature.** Every label, symbol and help text lives in `RotorNames.bas`; `docs/nomenclature.md` mirrors it. Coefficients follow one pattern: `Thrust Coefficient C_T` at the full level, `Thrust C_T` at the short level.
- **Engineering notes.** `docs/zBET-documentation.md` (numerical reference), `docs/software_requirements.md` and `AGENTS.md` (governance).

---

## Project Structure

```text
RotorCalculator.b4a         Main B4A project and Android application logic
zBETEngine.bas              Pure numerical zBET aerodynamic calculation engine
RotorStorage.bas            Rotor geometry database and file interchange
RotorPopups.bas             Airfoil database, technical popups and sweep plotting
Files/                      Android runtime assets and offline manuals
Icons/                      App launcher graphics and feature artwork

web/                        TypeScript / Vite responsive browser application
docs/                       GitHub Pages deployment and technical documentation
tests/                      Python and TypeScript numerical verification suites
tools/                      Automated verification scripts and build wrappers
AGENTS.md                   Coding governance and aerodynamic standards
```

---

## Verification and Quality Model

The physics and software boundaries are verified through:
1. **Engine Invariant Tests**: Closed-form momentum balance closure ($|f(\lambda_i)| < 10^{-13}$) and 100-case regression matrix against `tools/zBET.py`.
2. **TypeScript Web Verification**: Vitest unit suite validating identical numerical convergence on browser runtimes.
3. **Responsive UI QA**: Verified across mobile (320dp–412dp), tablet (600dp+), and desktop viewports.

Run the test suites locally:
```bash
python tools/verify_engine.py
npm --prefix web test
```

---

## License

RotorCalculator is licensed under the GNU General Public License v3.0. See [LICENSE.txt](LICENSE.txt). Copyright Gustavo José Zambrano.
