# RotorCalculator — Software Requirements

> **Status:** Binding baseline implementation specification for RotorCalculator across all versions.  
> **Physics reference:** `tools/zBET.py` and rotary-wing blade-element momentum theory.  
> **UI reference:** Disciplined, self-contained rotary-wing engineering visual design system.

Every requirement in this specification has a unique alphanumeric identifier. Requirements do not use bullet points. Each requirement statement is direct, concise, and written in Simplified Technical English (ASD-STE100).

---

## 1. Product Structure and Architecture

**ARCH-1** — RotorCalculator shall provide three primary tabs: **Geometry**, **Conditions**, and **Results**.

**ARCH-2** — Geometry shall define the rotor geometry, blade planform, and airfoil aerodynamic parameters.

**ARCH-3** — Conditions shall define atmospheric parameters, flight flow states, operating constraints, inflow model, and induced power factors.

**ARCH-4** — Results shall report dimensional performance, aerodynamic coefficients, rotor efficiency, wake state, sectional flow diagnostics, and solved operating trim states.

**ARCH-5** — Edits to any geometry or condition parameter shall recalculate dependent variables and aerodynamic results immediately.

**ARCH-6** — Aerodynamic equations, coordinate systems, and sign conventions shall follow standard rotary-wing Blade Element Theory (BET) and Momentum Theory.

**ARCH-7** — The user interface shall use structured engineering rows with high-contrast typography, explicit selectors, minimum 48 dp touch targets, persistent settings, tap-accessible contextual help, and an aligned label / value / unit grid.

**ARCH-8** — Both Android APK and Web application targets shall provide identical computational results, nomenclature, and interaction capabilities.

---

## 2. Geometry and Coupled Planform Controls

### 2.1 Direct In-Page Rotor Editor and Management

**GEO-1** — Opening the Geometry tab shall display the complete editable rotor definition immediately as a direct in-page rotor editor without opening intermediate dialogs.

**GEO-2** — Geometry shall present an active rotor selection bar at the top of the page. The bar shall identify the current rotor and show an unsaved modification indicator.

**GEO-3** — Tapping the active rotor bar shall open the saved-rotor selection modal and shall expose the **NEW ROTOR** action.

**GEO-4** — NEW ROTOR shall prompt for a unique rotor name, create a new rotor definition, and load it into the editor immediately.

**GEO-5** — The in-page editor shall organize parameters into four sections: Planform, Solidity & Areas, Blade Pitch, and Aerodynamics.

**GEO-6** — Geometry shall expose **SAVE**, **COPY**, and **DELETE** action buttons directly on the page.

**GEO-7** — SAVE shall persist current edits to internal application storage and clear the unsaved indicator. COPY shall duplicate the current geometry under an auto-generated unique name. DELETE shall remove the current rotor after user confirmation and shall be disabled when only one rotor exists.

**GEO-8** — Selecting another rotor or exiting the screen with unsaved edits shall display an unsaved changes modal offering Save, Discard, and Cancel options.

**GEO-9** — Restore Factory Presets shall restore all default rotor geometries while preserving user-created custom rotors.

### 2.2 Synchronized Planform Physics

All 14 geometric parameters represent mutually coupled physical quantities:
Rotor Radius $R$ [m], Blade Count $N_b$ [–], Root Cutout $x_0 = r_0 / R$ [–], Reference Root Chord $c_R$ [m], Tip Chord $c_T$ [m], Taper Ratio $c_T/c_R$ [–], Reference Solidity $\sigma_{\text{REF}}$ [–], Actual Solidity $\sigma_{\text{act}}$ [–], Thrust-Weighted Solidity $\sigma_{\text{TR}}$ [–], Aspect Ratio $AR$ [–], Swept Disk Area $A_{\text{DISK}} = \pi R^2$ [m²], Reference Blade Area $A_{\text{REF}}$ [m²], Actual Blade Area $A_{\text{act}}$ [m²], Root Pitch $\theta_R$ [deg], Tip Pitch $\theta_T$ [deg], Total Blade Twist $\theta_{\text{twist}}$ [deg], and Three-Quarter Pitch $\theta_{75}$ [deg].

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

**GEO-10** — Editing root chord $c_R$ or tip chord $c_T$ shall recalculate taper ratio $c_T/c_R$, aspect ratio $AR$, areas $A_{\text{REF}}$ and $A_{\text{act}}$, and solidities $\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$.

**GEO-11** — Editing rotor radius $R$ shall scale root chord $c_R$ and tip chord $c_T$ in direct proportion to $R$, preserving $\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$, taper ratio, aspect ratio $AR$, and chord-to-radius ratios.

**GEO-11a** — Editing swept disk area $A_{\text{DISK}}$ shall update rotor radius $R = \sqrt{A_{\text{DISK}} / \pi}$ and scale root and tip chords proportionally, preserving solidity, taper ratio, and aspect ratio.

**GEO-12** — Editing reference solidity $\sigma_{\text{REF}}$ shall scale both chords by a common factor, preserve taper ratio and aspect ratio $AR$, and recalculate blade areas.

**GEO-12a** — Editing actual solidity $\sigma_{\text{act}}$ shall scale root and tip chords uniformly, preserving taper ratio and root cutout.

**GEO-12b** — Editing thrust-weighted solidity $\sigma_{\text{TR}}$ shall scale root and tip chords by a common factor, preserving taper ratio.

**GEO-13** — Editing aspect ratio $AR$ shall scale both chords by a common factor, preserve taper ratio, and recalculate solidities and blade areas.

**GEO-13a** — Editing reference blade area $A_{\text{REF}}$ shall scale both chords by a common factor, preserving taper ratio and aspect ratio.

**GEO-13b** — Editing actual blade area $A_{\text{act}}$ shall scale root and tip chords uniformly, preserving taper ratio and root cutout.

**GEO-13c** — Editing taper ratio $c_T/c_R$ shall hold root chord $c_R$ constant and adjust tip chord $c_T = \text{taper} \cdot c_R$, recalculating aspect ratio, solidities, and blade areas.

**GEO-14** — Editing blade count $N_b$ shall recalculate solidities $\sigma_{\text{REF}}, \sigma_{\text{act}}, \sigma_{\text{TR}}$ while preserving aspect ratio, radius, and chord dimensions.

**GEO-15** — Editing root cutout $x_0$ shall preserve reference metrics ($c_R, c_T, \sigma_{\text{REF}}, AR, A_{\text{REF}}$) and update actual blade metrics ($\sigma_{\text{act}}, A_{\text{act}}, \sigma_{\text{TR}}$) and radial integration boundaries.

**GEO-16** — Root pitch $\theta_R$ and tip pitch $\theta_T$ shall define the baseline blade pitch law. Operating collective pitch shall apply a uniform angular increment $\Delta\theta$ across the blade:
$$\theta_{R,\text{op}} = \theta_R + \Delta\theta, \quad \theta_{T,\text{op}} = \theta_T + \Delta\theta$$

**GEO-16a** — Editing total blade twist $\theta_{\text{twist}}$ shall update tip pitch $\theta_T = \theta_R + \theta_{\text{twist}}$, holding root pitch $\theta_R$ constant.

**GEO-16b** — Editing three-quarter pitch $\theta_{75}$ shall adjust root pitch $\theta_R$ and tip pitch $\theta_T$ by a uniform offset, preserving total blade twist $\theta_{\text{twist}}$.

### 2.3 Interactive Input Controls

**GEO-17** — Geometry shall contain zero passive read-only outputs. Every displayed geometric parameter shall be an interactive input control that updates bidirectionally.

**GEO-18** — Any parameter modification shall update dependent values and recalculate aerodynamic performance in real time.

### 2.4 Rotor Aerodynamics

**GEO-19** — Rotor Aerodynamics shall follow the canonical three-column row structure: Column 1 (Label Button), Column 2 (Value / Selector), and Column 3 (Unit Button).

**GEO-20** — Aerodynamic inputs shall include Airfoil preset, Lift-curve slope $a_0$ [rad⁻¹], Profile drag coefficient $C_{d0}$ [–], Tip-loss model, Tip factor $B$ [–], and Prandtl-Glauert compressibility toggle.

**GEO-21** — Tip-loss choices shall include **None** ($B = 1.0$), **Fixed B** ($B = 0.97$), and **Sissingh** ($B = 1 - \sqrt{2 C_T}/N_b$).

**GEO-22** — Selecting an airfoil preset shall update lift-curve slope $a_0$ and profile drag $C_{d0}$ to standard literature values while allowing custom user overrides.

**GEO-23** — Tapping Column 1 shall open contextual physics documentation. Tapping Column 2 shall edit numeric values or open selection modals. Tapping Column 3 shall open unit conversion pickers.

### 2.5 Storage and Formatting

**GEO-24** — Saved rotor geometries shall use schema version 3 (`SCHEMA_VERSION = 3`) with backward compatibility for legacy geometry definitions.

**GEO-25** — Rotor names shall contain a maximum of 32 characters and shall reject duplicate names.

**GEO-26** — Display formatting shall not round stored SI values. Precision settings shall apply only to presented text strings.

**GEO-27** — The application shall persist unsaved drafts during screen orientation changes or theme modifications.

---

## 3. Flight Conditions and Operating Constraints

### 3.1 Atmospheric Conditions

**COND-1** — Atmospheric inputs shall include Pressure Altitude $h$ [m] and Ambient Temperature $T_0$ [°C].

**COND-2** — Air density $\rho$, ambient pressure $p$, and speed of sound $a$ shall be calculated using the ISA 1976 atmospheric standard.

### 3.2 Horizontal Flight Flow

**COND-3** — Horizontal Flow shall provide an explicit representation selector toggling between Advance Ratio $\mu_x$ and Forward Airspeed $V_x$.

**COND-4** — Editing either $\mu_x$ or $V_x$ shall update the alternate parameter via the relation $\mu_x = V_x / (\Omega R)$.

**COND-5** — Forward flight flow shall satisfy $\mu_x \ge 0$ and $V_x \ge 0$.

### 3.3 Axial Flight Flow

**COND-6** — Axial Flow shall provide an explicit representation selector choosing among Disk AoA $\alpha$, Climb Speed $V_z$, and Axial Flow Ratio $\mu_z$.

**COND-7** — Selection among $\alpha$, $V_z$, and $\mu_z$ shall be mutually exclusive. The application shall not sum alternate axial flow inputs.

**COND-8** — Climb Speed $V_z > 0$ shall define positive climb where relative airflow flows downward through the rotor disk.

**COND-9** — Axial Flow Ratio $\mu_z = V_z / (\Omega R)$ shall define the dimensionless downward relative flow ratio.

**COND-10** — Disk Angle of Attack $\alpha > 0$ shall define positive tilt where free-stream airflow arrives from below the rotor disk.

**COND-11** — In forward flight, axial flow ratio shall satisfy $\mu_z = -\mu_x \tan\alpha$.

**COND-12** — At zero forward speed ($\mu_x = 0$), angle of attack $\alpha$ shall be locked, and axial flow shall be entered through $V_z$ or $\mu_z$.

### 3.4 Operating Pairs and Trimming

The operating state couples four core quantities: Rotor Speed $\Omega$ (RPM), Collective Pitch Increment $\Delta\theta$, Target Thrust Coefficient $C_T$, and Target Thrust $T$. The user prescribes two quantities, and RotorCalculator solves the remaining two.

**COND-13** — Conditions shall provide six operating pairs:
1. **RPM + Collective** ($\Omega + \Delta\theta$)
2. **RPM + CT** ($\Omega + C_T$)
3. **RPM + Thrust** ($\Omega + T$)
4. **Collective + CT** ($\Delta\theta + C_T$)
5. **Collective + Thrust** ($\Delta\theta + T$)
6. **CT + Thrust** ($C_T + T$)

**COND-14** — Only the two parameters belonging to the active operating pair shall be editable.

**COND-15** — Operating pair **RPM + Collective** shall prescribe operating rotor speed and collective pitch directly without numerical iteration.

**COND-16** — Operating pair **RPM + CT** shall solve collective pitch $\Delta\theta$ to achieve target $C_T$ via bisection.

**COND-17** — Operating pair **RPM + Thrust** shall solve collective pitch $\Delta\theta$ to achieve target thrust $T$ via bisection.

**COND-18** — Operating pair **Collective + CT** shall solve rotor speed $\Omega$ when a unique aerodynamic solution exists; otherwise it shall display a non-unique state warning.

**COND-19** — Operating pair **Collective + Thrust** shall solve rotor speed $\Omega$ via analytical scaling and bisection.

**COND-20** — Operating pair **CT + Thrust** shall calculate rotor speed analytically via tip speed $\Omega R = \sqrt{T / (\rho\,A_{\text{DISK}}\,C_T)}$ and solve collective pitch $\Delta\theta$ via bisection.

**COND-21** — Aerodynamic trimming shall evaluate at current flight conditions, including hover, axial climb, descent, and forward flight.

**COND-22** — When trimming rotor speed $\Omega$ with forward airspeed $V_x$ specified, candidate iterations shall update advance ratio $\mu_x = V_x / (\Omega R)$ dynamically.

**COND-23** — The trim solver shall bracket candidate solutions within physically valid aerodynamic bounds without converging to divergent states.

### 3.5 Aerodynamic Inflow and Drag Models

**COND-24** — Inflow Model shall support **Uniform**, **Coleman**, **Coleman-Feingold** (NDARC), and **Drees**.

**COND-25** — Conditions shall expose Induced Power Factor $k_{\text{ind}}$ (default $1.15$).

**COND-26** — Profile drag shall be calculated using 2D Gauss-Legendre quadrature ($16 \times 24$ nodes) for numerical-vectorial integration ($C_{H0}, C_{Q0}$).

**COND-27** — Inflow equations shall couple with Momentum Theory and converge to a residual tolerance $|f(\lambda_i)| < 1.0 \times 10^{-12}$.

---

## 4. Results and Diagnostics

Results shall display 65 aerodynamic quantities organized into nine canonical sections:

Section 1: **MAIN PERFORMANCE** — Thrust $T$, Shaft Power $P$, Shaft Torque $Q$.  
Section 2: **IN-PLANE FORCES & MOMENTS** — In-Plane Force $H$, Side Force $Y$, Roll Moment $M_x$, Pitch Moment $M_y$.  
Section 3: **POWER BREAKDOWN** — Shaft Power $P$, Induced Power $P_i$, Profile Power $P_0$, Air Power $P_{\text{air}}$.  
Section 4: **LOADING & EFFICIENCY** — Disk Loading $T/A_{\text{DISK}}$, Power Loading $T/P$, Blade Loading $C_T/\sigma_{\text{TR}}$, Mean Lift Coefficient $\bar{C}_L$, Figure of Merit $\text{FM}$, Effective Lift-to-Drag Ratio $(L/D)_e$.  
Section 5: **AERODYNAMIC COEFFICIENTS** — Thrust Coefficient $C_T$, Torque Coefficient $C_Q$, Induced Torque $C_{Qi}$, Profile Torque $C_{Q0}$, In-Plane Force $C_H$, Induced In-Plane $C_{Hi}$, Profile In-Plane $C_{H0}$, Side Force $C_Y$, Roll Moment $C_{Mx}$, Pitch Moment $C_{My}$, Air Power $C_{\text{Pair}}$.  
Section 6: **TIP & FLOW VELOCITIES** — Advance Ratio $\mu_x$, Forward Airspeed $V_x$, Tip Speed $\Omega R$, Tip Mach $M_{\text{tip}}$, Advancing Tip Speed $V_{\text{adv}}$, Advancing Tip Mach $M_{\text{adv}}$, Retreating Tip Speed $V_{\text{ret}}$, Retreating Tip Mach $M_{\text{ret}}$, Total Axial Speed $V_{z,\text{tot}}$.  
Section 7: **SECTIONAL ANGLE OF ATTACK** — Local angle of attack evaluated on advancing ($\psi = 90^\circ$) and retreating ($\psi = 270^\circ$) blades across four radial stations: $\alpha_{\text{adv},25}, \alpha_{\text{ret},25}, \alpha_{\text{adv},50}, \alpha_{\text{ret},50}, \alpha_{\text{adv},75}, \alpha_{\text{ret},75}, \alpha_{\text{adv,tip}}, \alpha_{\text{ret,tip}}$.  
Section 8: **SECTIONAL INFLOW ANGLE** — Local inflow angle evaluated on advancing and retreating blades across four radial stations: $\phi_{\text{adv},25}, \phi_{\text{ret},25}, \phi_{\text{adv},50}, \phi_{\text{ret},50}, \phi_{\text{adv},75}, \phi_{\text{ret},75}, \phi_{\text{adv,tip}}, \phi_{\text{ret,tip}}$.  
Section 9: **ATMOSPHERE & INFLOW** — Rotor Speed $\Omega$, Collective Pitch $\Delta\theta$, Altitude $h$, Temperature $T_{\text{amb}}$, Density $\rho$, Pressure $p$, Sound Speed $a$, Induced Velocity $V_i$, Inflow Ratio $\lambda$, Induced Inflow $\lambda_i$, Hover Inflow $\lambda_h$, Advance-to-Inflow Ratio $\mu_x/\lambda$, Dynamic Tip Factor $B$, Wake Skew Angle $\chi$, Dynamic Thrust Coefficient $T_c$, Dynamic Power Coefficient $P_c$.

**RES-1** — Results shall preserve the dedicated three-column format: **symbol-first quantity | numerical value | unit**. Numerical values and unit strings shall remain strictly separated.

**RES-2** — Sectional Angle of Attack and Sectional Inflow Angle shall provide aerodynamic diagnostics at 25%, 50%, 75%, and 100% blade radius.

**RES-3** — Figure of Merit $\text{FM}$ shall evaluate only in hover ($\mu_x = 0, \mu_z = 0$). Outside hover, $\text{FM}$ shall display a neutral dash (`–`).

**RES-4** — Dynamic pressure coefficients $T_c$ and $P_c$ shall evaluate only with nonzero airspeed. In hover, $T_c$ and $P_c$ shall display `–`.

**RES-5** — Invalid or divergent flight states shall display neutral dashes or status banners rather than false numerical values.

**RES-6** — Output precision shall follow standard engineering resolution: 1–2 decimals for dimensional forces and power, and 4–6 decimals for dimensionless coefficients.

**RES-7** — Activating +1 Decimal in Settings shall append exactly one decimal digit across all formatted output values.

**RES-8** — Tapping any Results label button shall open comprehensive contextual help with mathematical definitions and governing equations.

**RES-9** — In Results, the Trim Condition banner and the Model Validity banner shall share equal vertical height (36–38 px), compact typography, and neutral styling across all themes.

---

## 5. Universal Plots and Parameter Sweeps

### 5.1 Sweep Variables and Coordinates

**PLOT-1** — The parameter sweep tool shall evaluate universal plots across advance ratio $\mu_x$.

**PLOT-2** — Any of the 61 scalar output quantities shall be selectable as the dependent variable (Y-axis).

**PLOT-3** — The horizontal axis (X-axis) shall support Advance Ratio $\mu_x$, Forward Airspeed $V_x$, and Advance-to-Inflow Ratio $\mu_x/\lambda$.

**PLOT-4** — Maximum sweep range shall provide user choices of $0.30$, $0.40$, $0.50$, and $0.60$.

**PLOT-5** — The active operating point shall be displayed as an interactive marker when within current plot bounds.

### 5.2 Curve Families

**PLOT-6** — The curve family selector shall support five families:
1. **Active Only** (single curve matching current flight condition)
2. **Inflow Models** (compares Uniform, Coleman, Coleman-Feingold, and Drees)
3. **α Family** (sweeps disk angle of attack: default −10°, −5°, 0°, +5°, +10°)
4. **Vz Family** (sweeps climb speed: default −10, −5, 0, +5, +10 m/s)
5. **μz Family** (sweeps axial flow ratio: default −0.050, −0.025, 0, +0.025, +0.050)

**PLOT-7** — Tapping **VALUES** shall allow entering custom comma-separated parameter lists (1 to 9 values).

**PLOT-8** — Custom values shall enforce range limits: $\alpha \in [-89^\circ, 89^\circ]$, $V_z \in [-200, 200]$ m/s, and $\mu_z \in [-0.50, 0.50]$.

**PLOT-9** — A curve family sweep shall vary only its selected parameter, holding all other flight conditions constant.

### 5.3 Sweep Trim Modes

**PLOT-10** — When target thrust or $C_T$ participates in the active operating pair, the parameter sweep shall support five sweep trim modes:
1. **No Trim (Fixed Controls)** — Holds collective $\Delta\theta$ and rotor speed $\Omega$ fixed.
2. **Trim Collective Δθ · Every Point** — Solves collective pitch $\Delta\theta$ at every advance ratio sample.
3. **Trim Rotor Speed Ω · Every Point** — Solves rotor speed $\Omega$ at every advance ratio sample.
4. **Trim Collective Δθ · Hover Only** — Solves collective pitch $\Delta\theta$ in hover (**Trim only in hover**) and holds it constant across the sweep.
5. **Trim Rotor Speed Ω · Hover Only** — Solves rotor speed $\Omega$ in hover (**Trim only in hover**) and holds it constant across the sweep.

**PLOT-11** — Operating pairs that prescribe both rotor speed and collective pitch shall lock sweep trim to No Trim.

### 5.4 Visualization and Data Export

**PLOT-12** — Plotted curves shall render as continuous solid lines with distinct palette colors.

**PLOT-13** — Invalid sweep points shall produce visible line gaps rather than false zero values.

**PLOT-14** — The plot canvas shall support interactive touch crosshair probing with live $(X, Y)$ coordinate readouts.

**PLOT-15** — Tapping **TABLE** shall display tabulated numerical data corresponding to all plotted curves.

**PLOT-16** — Tapping **CSV** shall export current curve data with column headers, units, and active trim mode.

**PLOT-17** — Tapping **PNG** shall generate a high-resolution chart image including axes, labels, legend, and title.

**PLOT-17a** — Tapping **EXPORT ALL PNG** in parameter sweeps shall generate and export high-resolution chart images for all active curve variations.

**PLOT-18** — File exports shall use Android Storage Access Framework (SAF) on mobile and direct file downloads on Web.

### 5.5 Interactive Rotor Disk Contour Plots

**PLOT-19** — Results shall provide a prominent **DISK CONTOUR** action button opening the interactive full-screen rotor disk contour modal.

**PLOT-20** — The rotor disk contour plot shall evaluate 14 aerodynamic distributions across azimuth $\psi \in [0, 2\pi]$ and normalized radius $r/R \in [x_0, 1]$:
1. Angle of Attack $\alpha$ [deg]
2. Inflow Angle $\phi$ [deg]
3. Lift Coefficient $C_l$ [–]
4. Drag Coefficient $C_d$ [–]
5. Total Inflow Ratio $\lambda$ [–]
6. Induced Inflow Ratio $\lambda_i$ [–]
7. Induced Velocity $v_i$ [m/s]
8. Total Axial Velocity $u_P$ [m/s]
9. Tangential Velocity $u_T$ [m/s]
10. Section Normal Force $dF_N/dr$ [N/m]
11. Section In-Plane Force $dF_T/dr$ [N/m]
12. Local Mach Number $M$ [–]
13. Section Thrust Loading $dC_T/dx$ [–]
14. Dynamic Pressure $q$ [Pa]

**PLOT-21** — The contour renderer shall use continuous bilinear interpolation over the canvas pixel buffer to prevent discrete grid block artifacts.

**PLOT-22** — The disk canvas shall draw subtle dashed concentric radial guides at $0.25R$, $0.50R$, and $0.75R$ using a 4 dip dash and 3 dip gap pattern with low visual opacity.

**PLOT-23** — The disk canvas shall draw subtle dashed orthogonal quadrant axes ($0^\circ$–$180^\circ$ and $90^\circ$–$270^\circ$).

**PLOT-24** — The disk perimeter shall draw a crisp boundary circle at exactly $R = 1.0$ and an inner cutout circle at $r = x_0 R$.

**PLOT-25** — The disk canvas shall display cardinal flight orientation azimuth labels:
- Top: $180^\circ$ with **Fore** placed cleanly above the angle label.
- Bottom: $0^\circ$ with **Aft** placed below the angle label.
- Right: $90^\circ$ with **Adv.** (Advancing blade).
- Left: $270^\circ$ with **Ret.** (Retreating blade).
All azimuth annotations shall maintain safe clearances preventing edge clipping across mobile viewports.

**PLOT-26** — The contour viewer shall display a prominent horizontal Jet colormap bar beneath the rotor disk spanning 84% of canvas width with vertical percentile ticks at 0%, 25%, 50%, 75%, and 100%.

**PLOT-27** — The colorbar legend shall format min, mid, and max numeric values with strictly two significant figures, preserving trailing significant zeros and switching to scientific notation for numbers $\ge 1000$ or $< 0.01$.

**PLOT-28** — The contour modal shall provide an active flight condition banner indicating $\mu_x$, $V_x$, and $\mu_z$.

**PLOT-29** — The contour modal shall provide an **EXPORT PNG** button generating a standalone high-resolution image of the currently displayed variable with title, legend, and flight state banner.

**PLOT-30** — The contour modal shall provide an **EXPORT ALL PNG** action that exports all 14 aerodynamic distribution images in one batch operation. Android shall request one destination directory and write all 14 PNG files through SAF. Web shall download all 14 PNG files.

---

## 6. Rotor Storage, Library, and Data Interchange

**LIB-1** — Settings shall provide **Import Geometries** and **Export Geometries**.

**LIB-2** — Export shall write the saved rotor library to structured JSON (`.json`) or version 3 text (`.txt`) files.

**LIB-3** — Import shall validate file structure, schema version, and parameter boundaries before updating local storage.

**LIB-4** — Import shall display the count of discovered valid geometries before confirmation.

**LIB-5** — Name collisions during import shall provide conflict resolution options: **Rename**, **Replace**, or **Skip**.

**LIB-6** — Importing geometries shall preserve unrelated local rotors.

**LIB-7** — Storage operations shall use Android `CREATE_DOCUMENT` / `OPEN_DOCUMENT` SAF workflows on mobile and standard file dialogs on Web.

**LIB-8** — Factory presets shall include UH-60 Black Hawk, Bell 206 JetRanger, Bo 105, Robinson R44, DJI Matrice 300, and Generic eVTOL.

**LIB-9** — Restoring factory presets shall reset default definitions while preserving custom user rotors.

---

## 7. Settings and Offline Documentation

**SET-1** — Settings shall provide user preferences for:
- **Theme**: Default Dark, Light, Midnight Blue, Sepia
- **Result Units**: Metric (SI) / Imperial (US Customary)
- **Output Format**: Standard / +1 Decimal
- **Database Backup**: Import Geometries and Export Geometries

**SET-2** — User preferences shall persist across application restarts.

**SET-3** — The main menu shall provide Settings, Quick Unit Converter, Physics & Equations, Restore Factory Presets, Install App (Web), and About.

**SET-4** — Physics & Equations shall operate completely offline, displaying MathML equations and technical derivations (`physics_help.html`, `physics_help_light.html`, `physics_help_midnight.html`).

**SET-5** — The web application shall provide an install icon button in the header and support Progressive Web App (PWA) offline execution.

**SET-6** — The Quick Unit Converter shall provide 14 physical conversion modes with a Swap button.

---

## 8. Human Interface and Visual Design System

**UX-1** — Geometry and Conditions shall share one canonical three-column form grid: **label / value / unit** (Column 1: Label Button | Column 2: Value or Selector | Column 3: Unit Button). Column boundaries and row heights shall remain aligned across all rows.

**UX-2** — Minimum interactive touch target height shall be approximately 48 dp. Typography shall remain legible (15–16 sp for values and labels, 13–14 sp for units).

**UX-3** — All essential features, settings, and calculations shall be accessible via touch tap. No feature shall require mouse hover.

**UX-4** — Conditions shall display only the active representation in each row. Results shall consolidate complete flow representations.

**UX-5** — The application shall support four complete themes with equal visual hierarchy and high contrast: **Default Dark**, **Light**, **Midnight Blue**, and **Sepia**.

**UX-6** — No label, value, unit, legend, or button shall clip across supported screen widths (320 dp to 768 dp) or at 130% system font scale.

**UX-7** — Active rotor identity shall be displayed in the Geometry active rotor bar. The global header shall display application title and navigation actions.

**UX-8** — Unsaved geometry drafts and sweep settings shall survive Activity recreation, display rotation, or theme changes.

**UX-9** — Geometry shall open directly as the editable rotor definition without requiring opening a rotor row or modal popup to view or edit parameters.

**UX-10** — Column 1 (Label) is a clickable button that opens contextual technical documentation. Column 2 (Value) is an editable text field or modal selector. Column 3 (Unit) is a clickable button that opens unit pickers (or neutral `–` button for dimensionless parameters).

**UX-11** — Horizontal Flow shall use one selector button in Column 1 choosing between **μ_x** and **Vx**.

**UX-12** — Axial Flow shall use one selector button in Column 1 choosing among **α**, **Vz**, and **μz**.

**UX-13** — Symbols and nomenclature shall strictly follow `docs/nomenclature.md` (e.g., $A_{\text{DISK}}$ as `A_DISK`, $\sigma_{\text{REF}}$ as `sigmaRef`, $\theta_{\text{twist}}$ as `thTwist`, $T/A_{\text{DISK}}$ as `T/A_DISK`).

**UX-21** — Clickable Geometry/Conditions labels and units shall be native actionable button controls with pressed and focus feedback; a passive Label styled to imitate a button does not satisfy this requirement.

**UX-24** — Results shall use three aligned columns: **symbol-first quantity | numerical value | unit**. Numerical values and unit strings shall never be concatenated.

**UX-28** — The UI shall prefer vertical scrolling over shrinking text or touch targets. Normal engineering labels, values, units and Results shall remain approximately 15–16 sp on phone layouts; critical status/section text shall remain comfortably readable and shall not use 10–11 sp caption sizing.

**UX-29** — Geometry shall use the same centered maximum content width as Active Rotor, Conditions and Results on screens wider than the phone layout. The form grid shall not expand to full tablet width beneath a narrower Active Rotor or action block.

**UX-44** — The application shall support horizontal swipe gestures across the three primary tabs (`GEOMETRY` $\longleftrightarrow$ `CONDITIONS` $\longleftrightarrow$ `RESULTS`) with velocity and diagonal angle thresholds to reject vertical scrolling conflicts.

**UX-45** — Interactive button clicks, label taps, and unit selections shall trigger 15 ms haptic feedback on Android devices.

**UX-53** — Contextual help dialogs shall separate independent facts and editing consequences into distinct paragraphs without semicolons in editing instructions.

**UX-54** — The About dialog shall present application version, conceptual description, and author credits.

**UX-55** — Contextual help modals shall provide responsive inline vector SVG diagram illustrations when opened for key rotary-wing parameters:
- Rotor Radius $R$ and blade planform geometry ($R, x_0, c_0, c_1, \text{taper}, A_b$).
- Blade pitch and linear twist distribution ($\theta_R, \theta_T, \theta_{\text{twist}}$).
- Rotor disk top view with rotation direction, forward airspeed $V_x$, advance ratio $\mu_x$, advancing ($90^\circ$) and retreating ($270^\circ$) velocities.
- Shaft coordinate reference frame and disk angle of attack $\alpha$, vertical climb speed $V_z$, and axial ratio $\mu_z$.
- Inflow distribution, wake skew angle $\chi$, and first-harmonic gradients ($K_x, K_y, \lambda, \lambda_i$).
- Blade element flow velocities and aerodynamic angles ($\alpha, \phi, u_P, u_T$).

**UX-56** — Inline SVG diagrams shall dynamically adapt their stroke, fill, and text colors to the active color theme (Default Dark, Light, Midnight Blue, Sepia) and scale to mobile screen widths without horizontal scrollbars.

---

## 9. Verification, Quality Assurance, and Release Gates

**QA-1** — Automated tests shall verify bidirectional geometry scaling, area calculations, solidities, and aspect ratio preservation.

**QA-2** — All six operating pairs shall be verified in hover, forward flight, and axial climb regimes against numerical reference matrices.

**QA-3** — Tests shall verify collective pitch trim bisection bracketing and non-uniqueness detection.

**QA-4** — Parameter sweep tests shall verify all 61 output variables, 5 curve families, custom values, and all 5 sweep trim modes.

**QA-5** — Sweep Chart, TABLE, CSV, and PNG exports shall share one authoritative sampled dataset.

**QA-6** — Geometry import and export workflows shall round-trip without numerical drift and reject invalid schemas.

**QA-7** — Restoring factory presets shall preserve custom user rotors.

**QA-8** — UI test suites shall verify all four themes (Dark, Light, Midnight Blue, Sepia), portrait and landscape orientations, and Activity recreation.

**QA-9** — Release APK and AAB binaries shall be built from the main commit with matching version codes and verified before distribution.

**QA-10** — Runtime QA shall verify the three-column grid alignment in Geometry and Conditions by checking x-positions and vertical centers across all rows.

**QA-11** — Runtime QA shall verify that every label and unit control is an actionable button opening help or unit pickers without modifying canonical SI state.

**QA-15** — Static QA shall verify that no normal label or unit control is implemented as a passive unclickable element.

**QA-19** — Visual inspection shall verify that no text clipping or horizontal overlap occurs at 320 dp width with 130% font scale.

**QA-21** — Parameter sweep charts shall be inspected across compact phone, standard phone, tablet, and landscape layouts.

**QA-26** — Verification walkthroughs shall confirm that every parameter label, selector, and unit displays clear contextual documentation.

**QA-30** — Physical consistency tests (`python tools/verify_engine.py`) shall maintain a 100% pass rate across all golden test cases.


**QA-31** — Disk Contour tests shall verify the exact 14-variable catalog, including Section Thrust Loading $dC_T/dx$.

**QA-32** — Disk Contour shall not render aerodynamic colors or enable PNG export when the operating solution is invalid.

**QA-33** — Disk Contour batch export shall verify that all 14 PNG files are produced. Android shall use one destination-directory selection for the complete batch.
