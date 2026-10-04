# RotorCalculator — Software Requirements

> **Status:** Binding baseline implementation specification for RotorCalculator across all versions.  
> **Physics reference:** `tools/zBET.py` and rotary-wing blade-element momentum theory.  
> **UI reference:** Disciplined, self-contained rotary-wing engineering visual design system.

Each requirement has a stable identifier. Screens are specified positively by the data and actions they present.

## 1. Product structure

- **ARCH-1** — RotorCalculator shall provide three primary tabs: **Geometry**, **Conditions**, and **Results**.
- **ARCH-2** — Geometry shall define the rotor/blade geometry and rotor aerodynamic definition.
- **ARCH-3** — Conditions shall define atmosphere, flight state, operating constraints, inflow model, and induced-power factor.
- **ARCH-4** — Results shall present dimensional performance, all aerodynamic coefficients, efficiency, inflow/wake, atmosphere, sectional flow diagnostics, and the complete solved operating state.
- **ARCH-5** — Normal calculator edits shall update dependent values and results immediately.
- **ARCH-6** — Symbols, signs, equations, and equivalent-input conversions shall follow standard rotary-wing Blade Element Theory (BET).
- **ARCH-7** — The UI shall use structured engineering rows with readable typography, explicit selectors, large mobile touch targets (minimum 48 dp), persistent settings, immediate recalculation feedback, tap-accessible contextual help, and a consistent aligned label/value/unit grid.

## 2. Geometry

### 2.1 Direct Geometry editor and active rotor

- **GEO-1** — Opening **Geometry** shall immediately show the complete editable rotor definition as a direct in-page rotor editor; editing shall not require opening a rotor row or a modal Geometry popup.
- **GEO-2** — Geometry shall reserve the top selector position for a persistent **Active Rotor** bar. The bar shall identify the current rotor at all times and visually indicate unsaved changes.
- **GEO-3** — Tapping the Active Rotor bar shall open the saved-rotor selector and shall also expose **NEW ROTOR**.
- **GEO-4** — NEW ROTOR shall create a uniquely named user rotor and make it the current inline geometry without changing tabs.
- **GEO-5** — The in-page editor shall contain **Blade Geometry**, **Planform Metrics**, and **Rotor Aerodynamics**.
- **GEO-6** — Geometry shall expose **SAVE**, **COPY**, and **DELETE** directly on the page. SAVE shall keep the editor open and shall immediately refresh the **Active Rotor** bar so the saved current rotor remains unambiguous.
- **GEO-7** — SAVE shall update the active rotor; COPY shall clone the current edited geometry under a unique name; DELETE shall require confirmation and shall be disabled when only one rotor remains.
- **GEO-8** — Selecting another rotor with unsaved edits or leaving the application shall offer Save, Discard, or Cancel. Unsaved edited values shall survive normal Activity recreation/orientation within the current app process.
- **GEO-9** — Restore Factory Presets shall restore shipped preset values while preserving unrelated user rotors.

### 2.2 Synchronized reference planform

All geometric parameters represent mutually coupled physical quantities. The fundamental basis consists of:
- rotor radius **R** [m];
- blade count **Nb** [–];
- root cutout **x0 = r0/R** [–];
- reference root chord **c_R** [m] at $x = r/R = 0$;
- tip chord **c_T** [m] at $x = 1$;
- taper ratio **c_T/c_R** [–];
- reference solidity **σ_REF** [–];
- actual solidity **σ_act** [–];
- thrust-weighted solidity **σ_TR** [–];
- blade reference aspect ratio **AR** [–];
- swept disk area **A_DISK = πR²** [m²];
- reference single-blade area **A_REF** [m²];
- actual single-blade area **A_act** [m²];
- root pitch **θ_R** [deg];
- tip pitch **θ_T** [deg];
- total blade twist **θ_twist = θ_T − θ_R** [deg];
- three-quarter pitch **θ_75** [deg].

The reference linear chord law is:

$$c(x) = c_R + (c_T - c_R)\,x, \quad 0 \le x \le 1$$

Reference single-blade area:

$$A_{\text{REF}} = \frac{R\,(c_R + c_T)}{2}$$

Reference aspect ratio:

$$AR = \frac{R^2}{A_{\text{REF}}} = \frac{2R}{c_R + c_T}$$

Reference solidity:

$$\sigma_{\text{REF}} = \frac{N_b\,A_{\text{REF}}}{\pi R^2} = \frac{N_b}{\pi\,AR}$$

Actual single-blade area:

$$A_{\text{act}} = R \int_{x_0}^1 c(x)\,dx = R\,(1 - x_0)\,\left[c_R + \frac{c_T - c_R}{2}\,(1 + x_0)\right]$$

Actual solidity:

$$\sigma_{\text{act}} = \frac{N_b\,A_{\text{act}}}{\pi R^2} = \frac{N_b}{\pi R} \int_{x_0}^1 c(x)\,dx$$

Thrust-weighted solidity:

$$\sigma_{\text{TR}} = 3 \int_{x_0}^1 x^2\,\sigma(x)\,dx = \frac{3 N_b}{\pi R} \int_{x_0}^1 x^2\,c(x)\,dx$$

Synchronization and cross-scaling rules:
- **GEO-10** — Editing root chord $c_R$ or tip chord $c_T$ shall recompute taper ratio $c_T/c_R$, aspect ratio $AR$, areas ($A_{\text{REF}}, A_{\text{act}}$), and solidities ($\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$).
- **GEO-11** — Editing rotor radius $R$ shall scale $c_R$ and $c_T$ in direct proportion to $R$, preserving $\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$, taper ratio, aspect ratio $AR$, and chord-to-radius ratios.
- **GEO-11a** — Editing swept disk area $A_{\text{DISK}}$ shall update rotor radius $R = \sqrt{A_{\text{DISK}} / \pi}$ and scale root and tip chords proportionally, preserving solidity, taper ratio, and aspect ratio.
- **GEO-12** — Editing reference solidity $\sigma_{\text{REF}}$ shall scale both chords by one common factor, preserve taper ratio and aspect ratio $AR$, and recompute blade areas.
- **GEO-12a** — Editing actual solidity $\sigma_{\text{act}}$ shall scale root and tip chords uniformly, preserving taper ratio and root cutout.
- **GEO-12b** — Editing thrust-weighted solidity $\sigma_{\text{TR}}$ shall scale root and tip chords by a common factor, preserving taper ratio.
- **GEO-13** — Editing aspect ratio $AR$ shall scale both chords by one common factor, preserve taper ratio, and recompute solidities and blade areas.
- **GEO-13a** — Editing reference blade area $A_{\text{REF}}$ shall scale both chords by the same factor, preserving taper ratio and aspect ratio.
- **GEO-13b** — Editing actual blade area $A_{\text{act}}$ shall scale root and tip chords uniformly, preserving taper ratio and root cutout.
- **GEO-13c** — Editing taper ratio $c_T/c_R$ shall hold root chord $c_R$ constant and update tip chord $c_T = \text{taper} \cdot c_R$, recomputing aspect ratio, solidities, and blade areas.
- **GEO-14** — Editing blade count $N_b$ shall update solidities ($\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$) while preserving $AR$, radius $R$, and chord dimensions.
- **GEO-15** — Editing root cutout $x_0$ shall preserve reference planform metrics ($c_R, c_T, \sigma_{\text{REF}}, AR, A_{\text{REF}}$) and update actual-blade metrics ($\sigma_{\text{act}}, A_{\text{act}}, \sigma_{\text{TR}}$) and BET radial integration limits.
- **GEO-16** — Root pitch $\theta_R$ and tip pitch $\theta_T$ define the baseline linear pitch law. Operating collective is one uniform increment $\Delta\theta$:
  $$\theta_{R,\text{op}} = \theta_R + \Delta\theta$$
  $$\theta_{T,\text{op}} = \theta_T + \Delta\theta$$
- **GEO-16a** — Editing total blade twist $\theta_{\text{twist}}$ shall update tip pitch $\theta_T = \theta_R + \theta_{\text{twist}}$, holding root pitch $\theta_R$ constant.
- **GEO-16b** — Editing three-quarter pitch $\theta_{75}$ shall adjust both root pitch $\theta_R$ and tip pitch $\theta_T$ by a uniform constant offset, preserving total blade twist $\theta_{\text{twist}}$.

### 2.3 Bidirectionally Coupled Geometric Controls

- **GEO-17** — There are no passive read-only geometric outputs; every geometric parameter displayed in Geometry (radius, chords, solidities, areas, twist, pitch angles) shall be an interactive, editable control that propagates updates bidirectionally in real time.
- **GEO-18** — Any direct input modification shall immediately refresh all dependent geometric quantities and trigger real-time recalculation of the aerodynamic solution and Results.

### 2.4 Rotor Aerodynamics

- **GEO-19** — Rotor Aerodynamics shall use the same canonical three-column row structure as Blade Geometry.
- **GEO-20** — Inputs shall include airfoil preset, lift-curve slope $a_0$ [rad⁻¹], profile drag coefficient $C_{d0}$ [–], tip-loss model, fixed tip factor $B$ when applicable, and Prandtl-Glauert compressibility toggle.
- **GEO-21** — Tip-loss choices shall be **None**, **Fixed B**, and **Sissingh**.
- **GEO-22** — Selecting an airfoil preset may populate $a_0$ and $C_{d0}$ while leaving both values fully visible and editable.
- **GEO-23** — Every Geometry label shall be rendered as a clickable button control, not passive text. Pressing it shall open comprehensive contextual help or the relevant parameter selector. Every displayed Geometry unit shall also be rendered as a button control; when alternate units exist it shall open the unit selector, and when the quantity is dimensionless or has only one valid unit it shall retain the same button alignment and style. Unit changes shall preserve the canonical SI value.

### 2.5 Persistence and Storage

- **GEO-24** — Saved rotor data shall carry an explicit schema version (currently `SCHEMA_VERSION = 3`).
- **GEO-28** — Geometry input display precision shall reflect the physical scale: ordinarily two decimals for rotor radius and aspect ratio, one for pitch angles, up to three for ordinary chords and root cutout, with additional places for small radii/chords and small dimensionless coefficients where rounding would hide useful variation. Formatting shall never round the stored SI geometry.
- **GEO-29** — Chord inputs retain millimeter-scale display detail where needed without forcing trailing third/fourth decimal zeros; display formatting never rounds or changes the canonical geometry.

## 3. Conditions

### 3.1 Atmosphere

- **COND-1** — Conditions shall contain **Altitude** [m] and **Temperature** [°C].
- **COND-2** — Density $\rho$, ambient pressure $p$, and speed of sound $a$ shall be derived via the 1976 US Standard Atmosphere / ISA formulation and reported in Results.

### 3.2 Horizontal flow

- **COND-3** — Horizontal Flow shall provide an explicit **μ_x / Vx** representation selector.
- **COND-4** — The selected representation shall be editable. Equivalent $\mu_x$ / $V_x$ values shall be consolidated in Results, without a small secondary line under the input.
- **COND-5** — $\mu_x = V_x / (\Omega R)$.

### 3.3 Axial flow

- **COND-6** — Axial Flow shall provide an explicit **α / Vz / μz** representation selector.
- **COND-7** — The selected representation shall be editable. Equivalent $\alpha / V_z / \mu_z$ values shall be consolidated in Results when mathematically defined, without a small secondary line under the input.
- **COND-8** — **+Vz** means positive climb rate; the relative wind arrives from above and flows downward through the disk.
- **COND-9** — **+μz** is the corresponding positive downward relative-flow ratio: $\mu_z = V_z / (\Omega R)$.
- **COND-10** — **+α** means disk angle of attack with relative wind arriving from below the rotor disk.
- **COND-11** — $\mu_z = - \mu_x \tan\alpha$.
- **COND-12** — At zero forward speed ($\mu_x = 0$), nonzero axial flow shall be entered through $V_z$ or $\mu_z$.

### 3.4 Operating constraints

The operating state contains four linked quantities:
**Rotor Speed Ω (RPM)**, **collective increment Δθ**, **Thrust Coefficient CT**, and **Dimensional Thrust T**.

The user prescribes any two; RotorCalculator solves the remaining two at the current atmosphere and flight state.

- **COND-13** — Operating Inputs shall expose six operating pairs:
  1. **RPM + Collective**
  2. **RPM + CT**
  3. **RPM + Thrust**
  4. **Collective + CT**
  5. **Collective + Thrust**
  6. **CT + Thrust**
- **COND-14** — Only the selected pair shall be editable.
- **COND-15** — RPM + Collective directly prescribes the operating rotor.
- **COND-16** — RPM + CT solves collective $\Delta\theta$ via bisection.
- **COND-17** — RPM + Thrust solves collective $\Delta\theta$ via bisection.
- **COND-18** — Collective + CT solves RPM when the selected flight/model state provides a unique dimensional solution; otherwise Results shall report a clear non-unique/no-solution status.
- **COND-19** — Collective + Thrust solves RPM via analytical scaling and bisection.
- **COND-20** — CT + Thrust solves RPM analytically via tip speed $\Omega R = \sqrt{T / (\rho\,A_{\text{DISK}}\,C_T)}$ and collective $\Delta\theta$ from the aerodynamic target.
- **COND-21** — Trimming shall occur at the current flight condition, including forward flight, climb, descent, and hover.
- **COND-22** — Results shall report solved RPM, collective $\Delta\theta$, $C_T$, and thrust $T$.
- **COND-23** — Conversions between $V_x \leftrightarrow \mu_x$, $V_z \leftrightarrow \mu_z$, tip Mach numbers, and dimensional quantities shall strictly use the solved operating RPM.

### 3.5 Aerodynamic-model inputs

- **COND-24** — Inflow Model shall offer **Uniform**, **Coleman**, **Coleman-Feingold**, and **Drees**.
- **COND-25** — Conditions shall include induced-power factor **k_ind**. The same symbol/name shall be used consistently across Conditions, Results, contextual help, plots, and documentation.
- **COND-26** — Profile drag shall use **Numerical Vectorial** radial/azimuthal integration ($16 \times 24$ quadrature).
- **COND-27** — Every Conditions label shall be rendered as a clickable button control, not passive text. Every displayed Conditions unit shall also be rendered as a button control; when alternate units exist it shall open the unit selector, and otherwise it shall retain the same aligned button style. Horizontal and axial representation selection shall each use exactly one variable-selector button in the label column.
- **COND-28** — Collective trim must bracket the target using the residuals of the actual valid candidate states. An invalid-to-valid transition may not create a false sign change or a valid solution that misses its prescribed $C_T$ or thrust.
- **COND-28a** — When evaluating trial trim candidates, if an intermediate candidate state produces non-physical inflow or divergence, the bisection search shall shrink brackets within physically bracketed bounds without converging to an invalid state.

## 4. Results

Results shall present quantities organized in exactly nine canonical sections:

1. **MAIN PERFORMANCE** — Thrust $T$, Shaft Power $P$, Shaft Torque $Q$.
2. **IN-PLANE FORCES & MOMENTS** — In-Plane Force $H$, Side Force $Y$, Roll Moment $M_x$, Pitch Moment $M_y$.
3. **POWER BREAKDOWN** — Shaft Power $P$, Induced Power $P_i$, Profile Power $P_0$, Air Power $P_{\text{air}}$.
4. **LOADING & EFFICIENCY** — Disk Loading $T/A_{\text{DISK}}$, Power Loading $T/P$, Blade Loading $C_T/\sigma_{\text{TR}}$, Figure of Merit $\text{FM}$, Effective Lift-to-Drag $(L/D)_e$.
5. **AERODYNAMIC COEFFICIENTS** — Thrust Coefficient $C_T$, Torque Coefficient $C_Q$, Induced Torque $C_{Qi}$, Profile Torque $C_{Q0}$, In-Plane Force $C_H$, Induced In-Plane $C_{Hi}$, Profile In-Plane $C_{H0}$, Side Force $C_Y$, Roll Moment $C_{Mx}$, Pitch Moment $C_{My}$, Air Power $C_{\text{Pair}}$, Mean Lift Coefficient $\overline{C}_L$.
6. **TIP & FLOW VELOCITIES** — Advance Ratio $\mu_x$, Forward Airspeed $V_x$, Tip Speed $\Omega R$, Tip Mach $M_{\text{tip}}$, Advancing Tip Speed $V_{\text{adv}}$, Advancing Tip Mach $M_{\text{adv}}$, Retreating Tip Speed $V_{\text{ret}}$, Retreating Tip Mach $M_{\text{ret}}$.
7. **SECTIONAL ANGLE OF ATTACK** — Advancing and retreating angle of attack evaluated at four radial stations ($r/R = 0.25, 0.50, 0.75, 1.0$): $\alpha_{\text{adv},25}, \alpha_{\text{ret},25}, \alpha_{\text{adv},50}, \alpha_{\text{ret},50}, \alpha_{\text{adv},75}, \alpha_{\text{ret},75}, \alpha_{\text{adv,tip}}, \alpha_{\text{ret,tip}}$.
8. **SECTIONAL INFLOW ANGLE** — Advancing and retreating local inflow angle evaluated at four radial stations ($r/R = 0.25, 0.50, 0.75, 1.0$): $\phi_{\text{adv},25}, \phi_{\text{ret},25}, \phi_{\text{adv},50}, \phi_{\text{ret},50}, \phi_{\text{adv},75}, \phi_{\text{ret},75}, \phi_{\text{adv,tip}}, \phi_{\text{ret,tip}}$.
9. **ATMOSPHERE & INFLOW** — Rotor Speed $\Omega$ (RPM), Collective Pitch $\Delta\theta$, Pressure Altitude $h$, Ambient Temperature $T_{\text{amb}}$, Density $\rho$, Ambient Pressure $p$, Speed of Sound $a$, Induced Velocity $V_i$, Inflow Ratio $\lambda$, Induced Inflow $\lambda_i$, Hover Inflow $\lambda_h$, Advance-Inflow Ratio $\mu_x/\lambda$, Tip Factor $B_{\text{res}}$, Wake Skew Angle $\chi$, Dynamic Thrust Coefficient $T_c$, Dynamic Power Coefficient $P_c$.

- **RES-1** — Results shall preserve the dedicated three-column format: **symbol-first quantity | numerical value | unit**. Numerical values and unit strings shall remain strictly separated.
- **RES-2** — Aerodynamic Coefficients shall keep all coefficients grouped under their canonical section with consistent symbol-first nomenclature.
- **RES-3** — Figure of Merit $\text{FM}$ is defined in pure hover ($\mu_x = 0, \mu_z = 0$); in forward flight or climb/descent it shall report zero or a neutral dash (`–`) and state hover-only applicability in contextual help.
- **RES-4** — Dynamic pressure coefficients $T_c$ and $P_c$ are normalized by free-stream dynamic pressure $\frac{1}{2}\rho V^2 A_{\text{DISK}}$ and are undefined at zero airspeed; in hover they shall display `–`.
- **RES-5** — Sectional AoA and inflow angles shall evaluate local kinematics using the trimmed collective pitch and the local induced inflow from the active model. Large negative or stalled values on the retreating blade at high advance ratios diagnose blade stall risk.
- **RES-6** — Baseline output precision shall be quantity-specific (e.g., 1 decimal for dimensional forces/power, 4–6 decimals for dimensionless coefficients).
- **RES-7** — +1 Decimal toggle in Settings shall add exactly one decimal place across all formatted quantities.
- **RES-8** — Invalid operating points shall be clearly identified and shall display neutral dashes or status banners rather than false zeros.
- **RES-9** — Every result row shall expose contextual physics and equation help upon tapping the label button.
- **RES-12** — In Results, the Trim Condition banner and the Model Validity banner shall share equal vertical height (36–38 px), compact typography, and neutral secondary styling across all themes.

## 5. Universal plots and parameter sweep

The parameter sweep tool shall evaluate rotor performance across advance ratio $\mu_x$ with multi-curve visualization and data export.

### 5.1 Variables and axes

- **PLOT-1** — Any scalar numerical Result shall be selectable as the dependent variable (Y-axis).
- **PLOT-2** — The Y-axis catalog shall remain synchronized with Result metadata.
- **PLOT-3** — Primary X-axis shall be advance ratio $\mu_x$, with an equivalent airspeed $V_x$ [m/s, km/h, kt] display option.
- **PLOT-4** — X-axis maximum range shall be user-selectable ($\mu_{\text{max}} = 0.20, 0.35, 0.50$ or custom).
- **PLOT-5** — The active operating point shall be indicated by an explicit marker when within range.

### 5.2 Curve families

- **PLOT-6** — Curve Family selector shall support:
  1. **Active Only** (single curve matching current flight state);
  2. **Inflow Models** (compares Uniform, Coleman, Coleman-Feingold, and Drees);
  3. **α Family** (sweeps disk angle of attack: default −10°, −5°, 0°, +5°, +10°);
  4. **Vz Family** (sweeps climb speed: default −10, −5, 0, +5, +10 m/s);
  5. **μz Family** (sweeps axial flow ratio: default −0.050, −0.025, 0, +0.025, +0.050).
- **PLOT-8** — A dedicated **VALUES** button shall allow custom comma-separated family parameters.
- **PLOT-9** — Custom family values shall be validated and retained for the application session.
- **PLOT-10** — A family sweep shall vary only its designated parameter, holding all other flight conditions fixed.

### 5.3 Sweep Trim Modes

- **PLOT-11** — Whenever CT or Thrust participates in the selected operating pair, the parameter sweep shall support hover-only trim options (**Trim only in hover**) alongside per-point trim and fixed controls:
  1. **No Trim (Fixed Controls)** — Holds collective $\Delta\theta$ and rotor speed $\Omega$ constant from Conditions. Thrust varies freely with $\mu_x$.
  2. **Trim Collective Δθ · Every Point** — Solves collective pitch $\Delta\theta$ at every $\mu_x$ sample to maintain the active target ($C_T$ or $T$).
  3. **Trim Rotor Speed Ω · Every Point** — Solves rotor speed $\Omega$ at every $\mu_x$ sample to maintain the active target.
  4. **Trim Collective Δθ · Hover Only** — Solves collective pitch $\Delta\theta$ once at $\mu_x = 0$ (**Trim only in hover**) and holds it constant across the sweep.
  5. **Trim Rotor Speed Ω · Hover Only** — Solves rotor speed $\Omega$ once at $\mu_x = 0$ (**Trim only in hover**) and holds it constant across the sweep.
- **PLOT-14** — Sweep tables, CSV, TXT, and JSON exports shall clearly state the active trim mode.

### 5.4 Presentation and Export

- **PLOT-15** — Sweep controls shall use explicit button selectors with haptic feedback.
- **PLOT-16** — Legends shall be complete, readable, responsive, and positioned outside the data grid.
- **PLOT-17** — Invalid samples shall produce visible curve gaps rather than false zero values.
- **PLOT-18** — TABLE view shall display all plotted curves with sample values matching the chart.
- **PLOT-19** — The sweep tool shall provide multi-format export:
  1. **Current Chart CSV / TXT** — Export of displayed curve values vs advance ratio;
  2. **Full Dataset CSV / JSON** — Complete rotor geometry, ISA atmospheric state, flight parameters, and all calculated aerodynamic variables per sample;
  3. **Chart PNG** — High-resolution image export with axes, legend, title, and theme styling.
- **PLOT-21** — File export shall use Android Storage Access Framework (SAF) on mobile and direct browser downloads on Web.
- **PLOT-26** — Plotted curves shall render as continuous solid lines with distinct palette colors.
- **PLOT-27** — Curves shall omit cluttering discrete marker dots along the lines while providing an active interactive touch crosshair probe with live $(X, Y)$ coordinate readout.
- **PLOT-28** — The plot canvas shall provide proper vertical clearance below buttons, centering the chart title cleanly above the grid.

## 6. Geometry backup and sharing

- **LIB-1** — Settings shall provide **Import Geometries** and **Export Geometries**.
- **LIB-2** — Export shall write the saved rotor database to a portable file in structured JSON (`.json`) or plain text (`.txt`) format.
- **LIB-3** — Import shall validate schema, version, and numeric parameter bounds before committing changes.
- **LIB-4** — Import shall report the count of discovered valid geometries before confirmation.
- **LIB-5** — Name collisions shall offer interactive conflict resolution: **Rename**, **Replace**, or **Skip**.
- **LIB-6** — Importing geometries shall preserve unrelated local rotors.
- **LIB-7** — Storage operations shall use Android `CREATE_DOCUMENT` / `OPEN_DOCUMENT` SAF workflows on mobile and File System API / file pickers on Web.
- **LIB-8** — Restore Factory Presets shall restore standard rotor definitions (UH-60, Bell 206, Bo 105, R44, DJI Drone) while preserving custom user rotors.

## 7. Settings and help

- **SET-1** — Settings shall provide:
  - **Theme**: Default Dark, Light, Midnight Blue, Sepia;
  - **Result Units**: SI Metric / Imperial US Customary;
  - **Output Format**: Standard / +1 Decimal;
  - **Import Geometries** and **Export Geometries**.
- **SET-2** — Theme, unit system, and precision preferences shall persist across application restarts.
- **SET-3** — The main menu shall provide Settings, Quick Unit Converter, Physics & Equations, Restore Factory Presets, Install App (Web), and About.
- **SET-4** — Physics & Equations shall operate 100% offline and provide comprehensive technical documentation with interactive MathML equations and SVG diagrams.
- **SET-5** — The web application shall provide an install icon button in the header adjacent to the main menu and support Progressive Web App (PWA) offline installation.

## 8. Visual and interaction design system

- **UX-1** — Geometry and Conditions shall share one canonical three-column form grid: **label / value / unit** (Column 1: Label Button | Column 2: Value or Selector | Column 3: Unit Button). Column edges and row baselines shall align across every row on the page.
- **UX-2** — Minimum interactive touch targets shall be approximately 48 dp high. Typography shall remain comfortably legible (15–16 sp for values and labels, 13–14 sp for units).
- **UX-3** — Interaction shall be tap-first; no essential information or calculation requires mouse hover.
- **UX-4** — Conditions shall display only the active representation in each form row; Results shall consolidate the complete equivalent flow state.
- **UX-5** — The application shall support four complete themes with equal visual hierarchy, contrast compliance, and state preservation: **Default Dark**, **Light**, **Midnight Blue**, and **Sepia**.
- **UX-6** — No value, unit, legend, label, or action shall clip across supported screen widths (320 dp to 768 dp) or at 130% system font scale.
- **UX-7** — Current rotor identity shall appear in the Geometry Active Rotor bar; the global header shall display application identity and navigation.
- **UX-8** — Unsaved inline Geometry edits and sweep configuration shall survive normal Activity recreation, rotation, or theme switches.
- **UX-9** — Geometry shall open directly as the editable rotor definition without requiring opening a rotor row or modal popup to view or edit parameters.
- **UX-12** — Column 1 (Label) is a real clickable button that opens comprehensive contextual help. Column 2 (Value) is an editable numeric field or modal selector. Column 3 (Unit) is a clickable unit converter button (displaying `–` for dimensionless quantities).
- **UX-15** — Horizontal Flow shall use exactly one selector button in Column 1 choosing between **μ_x** and **Vx**.
- **UX-16** — Axial Flow shall use exactly one selector button in Column 1 choosing between **α**, **Vz**, and **μz**.
- **UX-19** — Symbols and nomenclature shall strictly follow `docs/nomenclature.md`. Plain-text symbols shall use underscore subscripts (e.g., $A_{\text{DISK}}$ as `A_DISK`, $\sigma_{\text{REF}}$ as `sigmaRef`, $\theta_{\text{twist}}$ as `thTwist`, $T/A_{\text{DISK}}$ as `T/A_DISK`).
- **UX-21** — Clickable Geometry/Conditions labels and units shall be native actionable button controls with normal pressed and focus feedback; a passive Label styled to imitate a button does not satisfy this requirement.
- **UX-24** — Results shall use three independently aligned columns: **symbol-first quantity | numerical value | unit**. Numerical values and unit strings shall never be concatenated.
- **UX-28** — The UI shall prefer vertical scrolling over shrinking text or touch targets. Normal engineering labels, values, units and Results shall remain approximately 15–16 sp on phone layouts; critical status/section text shall remain comfortably readable and shall not use 10–11 sp caption sizing.
- **UX-29** — Geometry shall use the same centered maximum content width as Active Rotor, Conditions and Results on screens wider than the phone layout. The form grid shall not expand to full tablet width beneath a narrower Active Rotor or action block.
- **UX-44** — The application shall support horizontal swipe gestures across the three primary tabs: `GEOMETRY` $\longleftrightarrow$ `CONDITIONS` $\longleftrightarrow$ `RESULTS` with velocity and diagonal angle thresholds to reject vertical scrolling conflicts.
- **UX-45** — All interactive buttons, label controls, and unit controls shall trigger subtle 15 ms haptic feedback on Android.
- **UX-53** — Contextual help dialogs shall separate independent facts and editing consequences into distinct paragraphs (`\n\n` in Web, `CRLF & CRLF` in B4A) without semicolons in editing instructions.
- **UX-54** — The About dialog shall present application version, conceptual description, and author credits without unnecessary literary citations.

## 9. Verification and Quality Assurance

- **QA-1** — Automated tests shall verify bidirectional geometry scaling, area calculations, solidities, and aspect ratio preservation.
- **QA-2** — All six operating pairs shall be verified in hover, forward flight, and nonzero axial flow against numerical reference matrices.
- **QA-3** — Tests shall verify collective pitch trim bisection bracketing and non-uniqueness handling.
- **QA-4** — Parameter sweep tests shall cover every Y variable, every family, custom family values, and all five sweep trim modes.
- **QA-5** — Chart, TABLE, CSV, TXT, and JSON exports shall share one authoritative sampled dataset.
- **QA-6** — Geometry import/export shall round-trip without precision loss and reject invalid or out-of-domain schemas.
- **QA-7** — Factory preset restoration shall preserve custom user rotors.
- **QA-8** — UI smoke tests shall verify all four themes (Dark, Light, Midnight Blue, Sepia), portrait and landscape orientations, and Activity recreation.
- **QA-9** — Release APK and AAB binaries shall be built from the main commit with matching version codes and verified before distribution.
- **QA-10** — Runtime UI QA shall verify the three-column alignment in Geometry and Conditions by checking x-positions and vertical centers across all rows.
- **QA-11** — Runtime UI QA shall verify that every label and unit control is an actionable button that opens help or unit pickers without altering canonical SI state.
- **QA-15** — Static QA shall verify that no normal label or unit control is implemented as a passive unclickable element.
- **QA-19** — Visual inspection shall verify that no text clipping or horizontal overlap occurs at 320 dp width with 130% font scale.
- **QA-21** — Parameter sweep charts shall be inspected at compact phone, standard phone, and landscape orientations.
- **QA-26** — First-time engineer walkthroughs shall verify that every parameter label, selector, and unit displays clear contextual documentation.
- **QA-30** — Physical consistency tests (`python tools/verify_engine.py`) shall maintain 100% pass rate across all golden test cases.
