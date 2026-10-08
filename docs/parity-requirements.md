# APK and Web Parity Requirements and Verification

Audit baseline: **RotorCalculator 1.32 (versionCode 17)**.
The Android source implementation consists of `RotorCalculator.b4a`, `RotorPopups.bas`, `RotorStorage.bas`, `RotorNames.bas`, and `zBETEngine.bas`.
The Web application implementation resides in `web/src/` (`engine.ts`, `storage.ts`, `labels.ts`, `main.ts`, `sweep.ts`, `disk-contour.ts`, `help-illustrations.ts`).
Both platforms target 1:1 functional, mathematical, and interaction parity. Release claims require the automated source gates and source-matched runtime QA defined below.

---

## 1. Functional Inventory and Parity Matrix

| System Area | Android APK Implementation | Web Application Implementation | Functional Parity Requirements |
| :--- | :--- | :--- | :--- |
| **Three Primary Pages** | `BuildUnifiedHeader`, `ShowPage`, tab click handlers | `activatePage`, `.tab-btn` click listeners | Geometry, Conditions, and Results pages are present. State preservation, back navigation, and smooth vertical scrolling are identical. |
| **Bidirectional Geometry** | `BuildGeometryEditorContent`, `edtGeom_TextChanged` | `bindInputListeners`, `setGeometryQuantity`, `refreshInputPresentation` | All 14 geometric parameters are editable in real time: $R$, $N_b$, $x_0$, $c_R$, $c_T$, $c_T/c_R$, $\sigma_{\text{REF}}$, $\sigma_{\text{act}}$, $\sigma_{\text{TR}}$, $\text{AR}$, $A_{\text{DISK}}$, $A_{\text{REF}}$, $A_{\text{act}}$, $\theta_R$, $\theta_T$, $\theta_{\text{twist}}$, $\theta_{75}$, $a_0$, $C_{d0}$, $B$, and $\Omega_{\text{nom}}$. Unit pickers convert values immediately. |
| **Airfoil Database** | Six standard airfoils in `RotorPopups.Airfoils` plus Custom | `AIRFOILS` catalog, `refreshAirfoilDisplay`, picker modal | NACA 0012, NACA 23012, Boeing Vertol VR-7, Sikorsky SC1095, Clark Y, Selig S8036, and Custom are present. Lift-curve slope ($a_0$) and profile drag ($C_{d0}$) values match exactly. |
| **Tip Loss & Compressibility** | `btnTipLoss_Click`, `btnCompressibility_Click`, `RefreshTipFactorRow` | Selectors and `renderDerivedGeometry` | Tip loss (None, Fixed factor, Sissingh) and Prandtl-Glauert compressibility (On/Off) are identical. Calculated $B$ factor displays as read-only for dynamic modes. |
| **Rotor Management** | Active rotor bar, New, Rename, Save, Copy, Delete | Active rotor dropdown, CRUD action buttons | Local persistence, active rotor selection, and 32-character name validation are enforced. Dirty draft modifications prompt for save or cancel. |
| **Factory Presets** | `CreateDefaultPresets` | `getFactoryPresets` | Six factory presets are present: UH-60 Black Hawk, Bell 206 JetRanger, Bo 105, Robinson R44, DJI Matrice 300, and Generic eVTOL. Geometries and chord dimensions match exactly. |
| **Preset Restoration** | `RestoreFactoryPresets` | `resetToFactoryPresets` | Restores default factory parameters while preserving user-created custom rotors and active rotor selection. |
| **Geometry Import & Export** | Version 3 text backup, legacy chord parser, conflict dialog | Version 3 text parser, JSON import/export, conflict dialog | Supports text (`.txt`) and JSON (`.json`) interchange. Conflict workflows (Rename, Replace, Skip) resolve identical rotor names identically. |
| **Atmospheric Conditions** | Pressure altitude ($h$), ambient temperature ($T_0$) | Altitude and temperature input controls | Calculates standard ISA density ($\rho$), speed of sound ($a$), and ambient pressure ($p$). Preserves selected units across reloads. |
| **Flight Flow Alternatives** | $\mu_x$ or $V_x$; $\alpha$, $V_z$, or $\mu_z$ selectors | Horizontal and axial flow mode buttons | Mutually exclusive flow inputs convert instantaneously. Zero forward speed locks angle of attack $\alpha$ to prevent mathematical division by zero. |
| **Operating Trim Pairs** | Six operating modes in `btnOperatingPair_Click` | Six operating modes in trim selector | $\Omega + \Delta\theta$, $\Omega + C_T$, $\Omega + T$, $\Delta\theta + \Omega R$, $T + \Omega R$, and $C_T + \Omega R$ are present. Numerical convergence and trim tolerances match across platforms. |
| **Inflow Models** | Uniform, Coleman, Coleman-Feingold (NDARC), Drees | Uniform, Coleman, Coleman-Feingold (NDARC), Drees | Harmonic inflow gradients ($K_x, K_y$) and wake skew angle ($\chi$) match to analytical machine precision. |
| **Results Display** | 65 canonical result rows across 9 sections | 65 canonical result rows across 9 sections | Key-by-key parity across all 65 quantities. Three-column formatting (Symbol-first quantity \| Value \| Unit) is strictly preserved. |
| **Parameter Sweeps** | Modal sweep dialog with multi-curve canvas | Responsive sweep dialog with Canvas rendering | Full multi-curve parametric sweeps across all 61 output quantities. Plots support tap readouts, three palette modes, CSV export, and single / batch PNG export ("EXPORT ALL PNG"). |
| **Sweep Trim Strategies** | Five sweep trim modes | Five sweep trim modes | No Trim, Trimmed Collective (Every Point), Trimmed Rotor Speed (Every Point), Fixed Collective (Hover Only), Fixed Rotor Speed (Hover Only). |
| **Rotor Disk Contour Plots** | `OpenDiskContourPopup`, `DrawDiskContourPlot` | `showDiskContourModal`, `drawDiskContour` | 14 aerodynamic distributions across azimuth and span, including $dC_T/dx$ and dynamic pressure $q$. Invalid operating points display a neutral invalid-state canvas and disable export. Continuous bilinear interpolation, radial guides, quadrant axes, cardinal azimuth annotations, two-significant-figure colorbar labels, single PNG export, and true 14-file batch export are required on both platforms. Android uses one SAF destination-directory selection for the batch. |
| **Contextual Help Illustrations** | Inline vector diagrams in offline help popups | `getHelpSvg` responsive inline SVG illustrations | Visual SVG schematics for blade planform ($R, x_0, c_0, c_1$), twist/pitch ($\theta_R, \theta_T, \theta_{\text{twist}}$), rotor disk orientation, shaft reference frame ($\alpha, V_z$), inflow distribution, and velocity triangle. |
| **Visual Themes** | 4 complete themes: Default Dark, Light, Midnight Blue, Sepia | 4 complete themes: Default Dark, Light, Midnight Blue, Sepia | Full color-palette parity. Theme changes preserve calculations, inputs, and navigation state. |
| **Engineering Unit Converter**| 14 physical conversion modes with Swap button | 14 physical conversion modes with Swap button | Exact mathematical conversion factors across length, velocity, rotational speed, mass, force, pressure, torque, power, and disk loading. |
| **Offline Physics Manual** | Embedded MathML HTML (`physics_help*.html`) | Bundled offline MathML HTML pages | Matches equation for equation, symbol for symbol, and sign rule for sign rule. |
| **About and Privacy Dialogs** | Native themed modal dialogs | Responsive in-app modal sheets | Content, licenses, contact information, and privacy policy match word for word. |

---

## 2. Verification and Quality Evidence

1. **Python Golden Reference Matrix:**
   - 100 benchmark flight cases executed via `python tools/verify_engine.py`.
   - 100% of cases passed with closed-form momentum balance closure ($|f(\lambda_i)| < 10^{-13}$).
   - The Python integration and static source-safety suites must pass via `pytest tests`.

2. **TypeScript Web Test Suite:**
   - The complete Vitest suite must pass via `npm --prefix web test`, including dedicated Disk Contour catalog, numerical-grid, and invalid-state coverage.
   - The suite verifies numerical equivalence, storage schema migrations, unit conversion algorithms, SVG illustration generation, and contour behavior.
   - Production bundle compiled cleanly via `npm --prefix web run build`.

3. **Compiled Engine Equivalence:**
   - Evaluated via `tools/verify_compiled_engine.py` across hover, axial climb, and high-speed forward flight regimes.
   - Maximum absolute error across all 14 core aerodynamic quantities remains below $1.0 \times 10^{-8}$.

4. **Interactive and Responsive Testing:**
   - Verified across mobile (320dp, 360dp, 393dp, 412dp), tablet (600dp, 768dp), desktop viewports, and 130% system font scale.
   - Confirmed smooth touch scrolling, three-column column alignments, and modal dialog behavior without clipping or layout distortion.
