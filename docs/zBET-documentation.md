# Rotor Calculator — Theory, Implementation, and Model Scope

## 1. Purpose

**Rotor Calculator** is a fast, semi-empirical Blade Element Theory (BET) rotor solver designed for conceptual design, parametric sweeps, and preliminary performance studies.

The implementation combines:

- analytical radial moments for the main blade-element loads;
- global momentum theory for mean induced velocity;
- first-harmonic inflow-gradient models;
- selectable profile-drag formulations;
- selectable direct-BET or energy-balance induced torque; and
- an energy balance for the reported air-power coefficient $C_{Pair}$.

The implementation is deliberately lighter than a comprehensive rotorcraft analysis. It does **not** solve blade dynamics, cyclic trim, nonlinear airfoil tables, dynamic stall, or a local momentum equation at each annulus.

### 1.1 Literature basis

The formulation has been checked against:

- Wayne Johnson, *Rotorcraft Aeromechanics*, especially Chapter 6 (forward-flight section forces, rotor forces, and power), Chapter 7 (performance), and the profile-power discussion in Section 6.23.
- J. Gordon Leishman, *Principles of Helicopter Aerodynamics*, especially Chapter 3 (blade-element analysis) and Chapter 5 (helicopter performance).

Both references distinguish the **general blade-element force integration** from the **closed-form formulas obtained after simplifying assumptions**. Johnson also shows that force-balance and energy-balance methods are equivalent when built from the same assumptions and load model.

### 1.2 Aerodynamic model selectors

Rotor Calculator exposes two independent selectors.

**Induced shaft torque**

- `analytical_bet`: compute $C_{Qi}$ from the direct BET torque integral.
- `energy_balance`: infer $C_{Qi}$ by reversing the energy balance. The direct induced-torque integral is not evaluated in this mode:

$$
\boxed{
C_{Qi}
=
K_{\mathrm{ind}}\lambda_iC_T
+
\mu_zC_T
-
\mu C_{Hi}
}.
$$

The default is `energy_balance`.

**Profile drag**

- `analytical_tangential`: tangential-only closed-form $C_{H0}$ and $C_{Q0}$.
- `analytical_vectorial`: low-order vectorial closed form.
- `numerical_vectorial`: direct radial/azimuthal vector quadrature.

The default is `numerical_vectorial`.

$K_{\mathrm{ind}}$ is used only by energy-balance quantities: the `energy_balance` torque closure, $C_{Pair}$, and hover figure of merit. It is not inserted into the direct BET torque integral.

---

## 2. Coordinate System and Sign Conventions

### 2.1 Hub axes

The hub-centered Cartesian axes are:

- $+x$: forward.
- $+y$: right (starboard).
- $+z$: downward through the rotor disk.

Positive thrust acts upward, therefore along $-z$.

### 2.2 Rotor azimuth and rotation

Viewed from above, the rotor rotates counter-clockwise. The advancing side is the right side of the disk.

The local nondimensional tangential velocity is

$$
u_T = x + \mu \sin\psi,
$$

where

$$
x = \frac{r}{R},
$$

$$
\mu = \frac{V_x}{\Omega R}.
$$

Here $V_x > 0$ is the forward in-plane free-stream velocity.

At $\psi = 90°$:

$$
u_T = x + \mu.
$$

At $\psi = 270°$:

$$
u_T = x - \mu.
$$

The in-plane radial velocity used by the profile quadrature is

$$
u_R = \mu\cos\psi.
$$

### 2.3 Axial flow

The total mean inflow used by the analytical lift model is

$$
\lambda = \mu_z + \lambda_i,
$$

where $\lambda_i \ge 0$ is induced downwash in the $+z$ direction.

The code and UI convention is:

- $V_z > 0$: imposed relative flow is downward through the disk.
- $\mu_z = V_z / (\Omega R)$, so $\mu_z > 0$ is also downward.
- Rotor angle of attack $\alpha > 0$ means the free stream arrives from below the disk.

Therefore, when the axial state is prescribed by angle:

$$
\mu_z = -\mu\tan\alpha.
$$

The three inputs $\alpha$, $V_z$, and $\mu_z$ are **alternative representations of the same axial operating condition**. They are not additive. Likewise, $V_x$ and $\mu$ are alternative horizontal representations linked by $\mu = V_x / (\Omega R)$.

At $V_x = 0$, use $V_z$ or $\mu_z$ to specify a nonzero axial condition, because $\alpha$ alone is not unique at zero advance ratio.

### 2.4 Rotor loads

The nondimensional coefficients are

$$
C_T = \frac{T}{\rho A (\Omega R)^2},
$$

$$
C_H = \frac{H}{\rho A (\Omega R)^2},
$$

$$
C_Y = \frac{Y}{\rho A (\Omega R)^2},
$$

$$
C_Q = \frac{Q}{\rho A (\Omega R)^2 R},
$$

$$
C_{Mx} = \frac{M_x}{\rho A (\Omega R)^2 R},
$$

$$
C_{My} = \frac{M_y}{\rho A (\Omega R)^2 R},
$$

with

$$
A = \pi R^2.
$$

Sign conventions:

- $C_T > 0$: upward rotor thrust.
- $C_H > 0$: aft rotor drag.
- $C_Y > 0$: force toward starboard.
- $C_Q > 0$: positive shaft-torque magnitude required to power the rotor.
- $C_{Mx} > 0$: right wing down.
- $C_{My} > 0$: nose up.

---

## 3. Blade Geometry, Solidity, and Pitch

The lifting span starts at

$$
x_0 = \frac{r_0}{R}.
$$

For a linear chord distribution:

$$
c(x) = c_{\mathrm{root}}
+ \left(c_{\mathrm{tip}} - c_{\mathrm{root}}\right)
\frac{x - x_0}{1 - x_0}.
$$

The local rotor solidity is

$$
\sigma(x) = \frac{N c(x)}{\pi R} = s_0 + s_1 x.
$$

### 3.1 Reference solidity

The reference solidity extrapolates the chord line to the hub:

$$
\sigma_{\mathrm{ref}}
=
\int_0^1 \sigma(x)\,dx
=
s_0 + \frac{s_1}{2}.
$$

For a rectangular blade:

$$
\sigma_{\mathrm{ref}} = \frac{Nc}{\pi R}.
$$

### 3.2 Physical geometric solidity

The actual blade area begins at the root cutout:

$$
\sigma_{\mathrm{geom}}
=
\int_{x_0}^1 \sigma(x)\,dx.
$$

For a rectangular blade:

$$
\sigma_{\mathrm{geom}}
=
(1 - x_0)\,\sigma_{\mathrm{ref}}.
$$

### 3.3 Thrust-weighted solidity

Rotor Calculator also reports

$$
\sigma_{\mathrm{thrust}}
=
3\int_{x_0}^1 \sigma(x)\,x^2\,dx.
$$

For a rectangular blade:

$$
\sigma_{\mathrm{thrust}}
=
(1 - x_0^3)\,\sigma_{\mathrm{ref}}.
$$

### 3.4 Why the BET equations use local solidity

The section force is proportional to local chord. Therefore the BET integrands are naturally scaled by

$$
\sigma(x) = \frac{N c(x)}{\pi R}.
$$

The root cutout is already represented by the integration limits. Replacing local solidity by the physical-area solidity inside an integral that already begins at $x_0$ would apply the root-cutout penalty twice.

### 3.5 Pitch

For constant pitch:

$$
\theta(x) = \theta_0.
$$

For linear twist:

$$
\theta(x) = t_0 + t_1 x.
$$

Collective trim shifts the complete pitch distribution by a constant and preserves the specified twist.

---

## 4. Inflow Models

The local induced-flow model is

$$
\lambda_d(x,\psi)
=
\lambda
+
x\left(
\lambda_{1c}\cos\psi
+
\lambda_{1s}\sin\psi
\right),
$$

with

$$
\lambda_{1c} = K_x \lambda_i,
$$

$$
\lambda_{1s} = K_y \lambda_i.
$$

The wake-skew helper used by the code is

$$
\tan\frac{\chi}{2}
=
\frac{\mu}
{\sqrt{\mu^2 + \lambda^2} + |\lambda|}.
$$

### 4.1 Uniform

$$
K_x = 0,
$$

$$
K_y = 0.
$$

### 4.2 Coleman

$$
K_x = \tan\frac{\chi}{2},
$$

$$
K_y = 0.
$$

### 4.3 Coleman-Feingold / NDARC form

$$
K_x
=
f_x \frac{15\pi}{32}
\tan\frac{\chi}{2},
$$

$$
K_y = -2 f_y \mu.
$$

### 4.4 Drees

$$
K_x
=
\frac{4}{3}
\left(1 - 1.8\mu^2\right)
\tan\frac{\chi}{2},
$$

$$
K_y = -2\mu.
$$

### 4.5 Mean momentum closure

For a given blade pitch, Rotor Calculator solves $\lambda_i$ from the intersection of analytical BET thrust and global momentum theory:

$$
C_T
=
2 B^2 \lambda_i
\sqrt{\mu^2 + \lambda^2}.
$$

This is a **global** closure. Rotor Calculator uses BET plus global momentum theory, not a multi-annulus BEMT solver.

---

## 5. Hover Trim

Hover trim is performed at $\mu = 0$ and $\mu_z = 0$.

### 5.1 Collective trim

With fixed RPM, the pitch distribution is shifted until the requested hover $C_T$ or dimensional thrust is reached.

### 5.2 RPM trim

With fixed pitch, RPM is adjusted using

$$
T = C_T \rho A (\Omega R)^2.
$$

Therefore

$$
\Omega
=
\frac{1}{R}
\sqrt{\frac{T}{\rho A C_T}}.
$$

### 5.3 No trim

With `HOVER_TRIM_MODE = "none"`, the specified RPM and pitch are used directly.

---

## 6. Aerodynamic Formulation

### 6.1 General blade-element reference model

The general section-level BET picture in Johnson and Leishman starts from the local relative velocity, section angle of attack, lift, and drag. In a two-dimensional blade section plane:

$$
U_{2D}
=
\sqrt{u_T^2 + u_P^2},
$$

$$
\phi
=
\tan^{-1}\left(\frac{u_P}{u_T}\right),
$$

$$
\alpha_s = \theta - \phi.
$$

The local lift and drag can then be resolved into normal and in-plane section forces:

$$
dF_z
=
dL\cos\phi - dD\sin\phi,
$$

$$
dF_x
=
dL\sin\phi + dD\cos\phi.
$$

A **fully integrated force-balance solver** would evaluate a common local aerodynamic state and consistently integrate the resulting forces for thrust, in-plane forces, torque, and hub moments over radius and azimuth.

Rotor Calculator does not currently expose a fully integrated force-balance model.

### 6.2 Analytical weighted moments

The principal load model applies the standard small-inflow-angle analytical reduction and evaluates the radial dependence exactly through weighted moments.

Define

$$
J_n
=
\int_{x_0}^{B} x^n\,dx
=
\frac{B^{n+1} - x_0^{n+1}}{n+1},
$$

$$
I_m
=
\int_{x_0}^{B} \sigma(x)\,x^m\,dx,
$$

$$
T_m
=
\int_{x_0}^{B} \sigma(x)\,\theta(x)\,x^m\,dx.
$$

Because $\sigma(x)$ and $\theta(x)$ are linear in $x$, these moments are evaluated analytically.

The implemented thrust coefficient is

$$
C_T
=
\frac{a}{2}
\left[
T_2
+
\frac{\mu^2}{2} T_0
-
\left(
\lambda
+
\frac{\mu \lambda_{1s}}{2}
\right) I_1
\right].
$$

The induced longitudinal force is

$$
C_{Hi}
=
\frac{a}{4}
\left[
\lambda \mu\, T_0
+
\lambda_{1s}
\left(
T_2 - 2\lambda I_1
\right)
\right].
$$

The side force is

$$
C_Y
=
-\frac{a \lambda_{1c}}{4}
\left(
T_2 - 2\lambda I_1
\right).
$$

The rolling moment is

$$
C_{Mx}
=
-\frac{a\mu}{2}
\left(
T_2 - \frac{\lambda I_1}{2}
\right)
+
\frac{a \lambda_{1s}}{4} I_3.
$$

The pitching moment is

$$
C_{My}
=
\frac{a \lambda_{1c}}{4} I_3.
$$

These expressions are independent of the profile-drag torque integration described below.

### 6.3 Profile-drag selector

All profile models return $C_{H0}$ and $C_{Q0}$.

#### Tangential analytical model

Neglecting the radial component of profile drag:

$$
\boxed{
C_{H0}^{\mathrm{tang}}
=
\frac{C_{d0}\,\mu}{2}\,I_1
}
$$

$$
\boxed{
C_{Q0}^{\mathrm{tang}}
=
\frac{C_{d0}}{2}
\left(
I_3 + \frac{\mu^2}{2}\,I_1
\right)
}
$$

For a rectangular blade without root cutout:

$$
C_{H0}^{\mathrm{tang}}
=
\frac{\sigma C_{d0}}{4}\,\mu,
$$

$$
C_{Q0}^{\mathrm{tang}}
=
\frac{\sigma C_{d0}}{8}(1 + \mu^2).
$$

#### Low-order vectorial analytical model

Retaining the leading vector corrections gives

$$
\boxed{
C_{H0}^{\mathrm{vec}}
=
\frac{3 C_{d0}\,\mu}{4}\,I_1
}
$$

$$
\boxed{
C_{Q0}^{\mathrm{vec}}
=
\frac{C_{d0}}{2}
\left[
I_3
+
\left(
\frac{3}{4}\mu^2 + \frac{1}{2}\mu_z^2
\right) I_1
\right]
}
$$

For a rectangular blade in edgewise flight without root cutout:

$$
C_{H0}^{\mathrm{vec}}
\simeq
\frac{3\sigma C_{d0}}{8}\,\mu,
$$

$$
C_{Q0}^{\mathrm{vec}}
\simeq
\frac{\sigma C_{d0}}{8}(1 + 1.5\mu^2).
$$

#### Numerical vectorial model

The numerical model evaluates

$$
\boxed{
C_{H0}
=
\frac{C_{d0}}{2}
\int_{x_0}^{1}
\sigma(x)
\left\langle
W(x\sin\psi + \mu)
\right\rangle_\psi dx
}
$$

$$
\boxed{
C_{Q0}
=
\frac{C_{d0}}{2}
\int_{x_0}^{1}
\sigma(x)
\left\langle
W u_T x
\right\rangle_\psi dx
}
$$

with

$$
u_T = x + \mu\sin\psi,
$$

$$
u_R = \mu\cos\psi,
$$

$$
W = \sqrt{u_T^2 + u_R^2 + \mu_z^2}.
$$

The physical blade span $x_0 \le x \le 1$ is used for profile drag.

### 6.4 Induced shaft torque selector

For `analytical_bet`, $C_{Qi}$ is obtained directly from the moment of the lift-induced in-plane force about the shaft:

$$
\boxed{
C_{Qi}^{\mathrm{BET}}
=
\frac{1}{2}
\int_{x_0}^{B}
\sigma(x)\,a
\left[
\left(\lambda + \frac{\mu \lambda_{1s}}{2}\right)
\theta(x)\,x^2
-
\lambda^2 x
-
\frac{\lambda_{1c}^2 + \lambda_{1s}^2}{2}\,x^3
\right] dx
}
$$

For `energy_balance`, the same shaft-torque component is inferred from the power balance:

$$
\boxed{
C_{Qi}^{\mathrm{EB}}
=
K_{\mathrm{ind}} \lambda_i C_T
+
\mu_z C_T
-
\mu C_{Hi}
}
$$

Thus $K_{\mathrm{ind}}$ appears in the energy-balance torque mode, but not in the direct BET torque mode.

### 6.5 Total shaft torque

$$
\boxed{C_Q = C_{Qi} + C_{Q0}}
$$

$C_Q$ always equals $C_{Qi} + C_{Q0}$. Which expression supplies each component is controlled by the two selectors above.

### 6.6 Scope of the mixed analytical/numerical formulation

Lift-induced loads remain analytical weighted-moment expressions. The profile quantities $C_{H0}$ and $C_{Q0}$ use the formulation selected by `PROFILE_DRAG_MODEL`: tangential analytical, vectorial analytical, or numerical vectorial.

---

## 7. Performance Metrics

### 7.1 Shaft power

$$
P_{\mathrm{shaft}} = Q \Omega.
$$

In coefficient form:

$$
C_{P,\mathrm{shaft}} = C_Q.
$$

No $\mu C_H$ term belongs to shaft power. $C_Q$ is the mechanical torque coefficient about the rotor axis.

### 7.2 Air power (CPair)

$C_{Pair}$ is always evaluated from the energy balance, independently of the selected induced-torque mode.

The induced-power contribution is

$$
\boxed{
C_{Pi} = K_{\mathrm{ind}} \lambda_i C_T
}
$$

The climb contribution is

$$
\boxed{
C_{Pc} = \mu_z C_T
}
$$

The profile-drag contribution relative to the air is

$$
\boxed{
C_{P0,\mathrm{air}} = C_{Q0} + \mu C_{H0}
}
$$

Therefore

$$
\boxed{
C_{Pair}
=
K_{\mathrm{ind}} \lambda_i C_T
+
\mu_z C_T
+
C_{Q0}
+
\mu C_{H0}
}
$$

There is no additional $+\mu C_{Hi}$ term in this expression.

In the `energy_balance` torque mode:

$$
C_{Qi}^{\mathrm{EB}}
=
K_{\mathrm{ind}} \lambda_i C_T
+
\mu_z C_T
-
\mu C_{Hi},
$$

so

$$
C_{Qi}^{\mathrm{EB}} + \mu C_{Hi}
=
K_{\mathrm{ind}} \lambda_i C_T + \mu_z C_T.
$$

Consequently, when `INDUCED_TORQUE_MODEL = "energy_balance"`:

$$
\boxed{
C_{Pair} = C_Q + \mu C_H
}
$$

because $C_Q = C_{Qi} + C_{Q0}$ and $C_H = C_{Hi} + C_{H0}$.

This identity is a consistency check. When `analytical_bet` is selected, $C_Q$ comes from the direct BET torque route while $C_{Pair}$ remains the energy-balance estimate, so the two routes are intentionally independent and need not be identical.

For a rectangular blade in edgewise flight, the low-order vectorial profile terms are

$$
C_{Q0}
\simeq
\frac{\sigma C_{d0}}{8}(1 + 1.5\mu^2),
$$

$$
C_{H0}
\simeq
\frac{3\sigma C_{d0}}{8}\,\mu.
$$

Hence

$$
C_{P0,\mathrm{air}}
= C_{Q0} + \mu C_{H0}
\simeq
\frac{\sigma C_{d0}}{8}
\left(1 + 1.5\mu^2 + 3\mu^2\right),
$$

and therefore

$$
\boxed{
C_{P0,\mathrm{air}}
\simeq
\frac{\sigma C_{d0}}{8}(1 + 4.5\mu^2)
}
$$

The $4.5\mu^2$ factor belongs to profile power relative to the air, not to $C_{Q0}$.

### 7.3 Effective rotor lift-to-drag ratio

For $\mu > 0$:

$$
\left(\frac{L}{D}\right)_{\mathrm{eff}}
=
\frac{\mu C_T}{C_{Pair}}.
$$

### 7.4 Operating geometry after trim

The UI reports the geometry actually used by the solver after trim through the result fields `TrimmedRPM` and `TrimmedTheta0Deg`.

When RPM trim is active, any dimensional flow representation that depends on tip speed must use the solved value of $\Omega R$:

$$
\mu = \frac{V_x}{\Omega_{\mathrm{trim}} R},
$$

$$
\mu_z = \frac{V_z}{\Omega_{\mathrm{trim}} R}.
$$

The same resolved tip speed is used for the sweep $V_x$ axis and Mach quantities. This avoids a mismatch where the UI would show a dimensional speed based on the nominal geometry while the aerodynamic calculation used a different trimmed RPM.

### 7.5 Hover figure of merit

The ideal hover power coefficient is

$$
C_{P,\mathrm{ideal}}
=
\frac{C_T^{3/2}}{\sqrt{2}}.
$$

The performance model uses

$$
C_{P,\mathrm{hover}}
=
K_{\mathrm{ind}}
\frac{C_T^{3/2}}{\sqrt{2}}
+
C_{Q0},
$$

so

$$
\boxed{
FoM
=
\frac{C_T^{3/2} / \sqrt{2}}
{K_{\mathrm{ind}}\,C_T^{3/2} / \sqrt{2} + C_{Q0}}
}
$$

This definition keeps $K_{\mathrm{ind}}$ in the hover energy balance even when the direct BET torque selector is used.

---

## 8. Engineering Corrections

### 8.1 Tip loss

Rotor Calculator can use an effective aerodynamic radius $B$ and integrate the **lift-induced analytical moments** from $x_0$ to $B$. Profile drag is integrated over the physical blade span $x_0$ to $1$, because the blade material still produces drag outside the effective lift radius.

The optional Sissingh-style relation is

$$
B
=
1 - \frac{\sqrt{2 C_T}}{N}.
$$

The momentum closure also uses the effective area factor $B^2$. For Sissingh mode, $B$, $C_T$, and the inflow solution are iterated to mutual consistency (up to eight updates with a $10^{-8}$ change criterion).

> This is an **effective-radius engineering approximation**. It should not be interpreted as a literal implementation of the full Prandtl finite-blade circulation/inflow correction.

### 8.2 Prandtl-Glauert lift-slope correction

If enabled, Rotor Calculator modifies the linear section lift-curve slope using a representative subsonic Mach number:

$$
M_{\mathrm{eff}}
=
\frac{\Omega R}{a_{\mathrm{sound}}}
\sqrt{0.75^2 + 0.5\mu^2},
$$

with $M_{\mathrm{eff}}$ capped at $0.85$, and

$$
a(M)
=
\frac{a_0}
{\sqrt{\max(0.01,\;1 - M_{\mathrm{eff}}^2)}}.
$$

The reported advancing-tip Mach $M_{at} = \Omega R(1+\mu) / a_{\mathrm{sound}}$ is a separate operational caution metric. The representative Mach construction and cap are engineering approximations, not a local compressible-airfoil solution.

---

## 9. Assumptions and Limitations

The current implementation is intentionally compact. Important limitations are:

- Small-angle analytical treatment for the principal lift-induced rotor loads.
- Linear section lift curve.
- Constant $C_{D0}$ rather than an airfoil polar.
- No nonlinear stall or dynamic stall.
- No cyclic-pitch trim.
- No blade flapping solution in the aerodynamic load calculation.
- No elastic blade motion.
- No local annular momentum iteration.
- No full reverse-flow airfoil model.
- First-harmonic prescribed inflow gradients rather than a free wake.
- The vectorial profile integration uses constant $C_{D0}$; it does not include a local airfoil polar.
- The vectorial profile path uses imposed $\mu_z$ in its local speed magnitude rather than local induced normal velocity.
- Lift-induced loads remain analytical even when profile drag is numerical.

These limitations are compatible with the intended use as a rapid conceptual-analysis tool. Consider them before applying the code to high advance ratio, severe descent, stalled conditions, or detailed loads work.

---

## 10. Configuration Guide

### Geometry and atmosphere

- `RHO`: air density.
- `SPEED_OF_SOUND`: speed of sound.
- `RPM`: rotor speed.
- `R`: rotor radius.
- `R0_BAR`: root cutout.
- `A_LIFT`: linear lift-curve slope.
- `CD0`: constant profile drag coefficient.

### Solidity and planform

- `SOLIDITY_MODE = "sigma_ref"`: reference solidity input.
- `SOLIDITY_MODE = "sigma_geom"`: geometric solidity input.
- `SOLIDITY_MODE = "chords"`: chord-based input.

### Pitch and trim

- `PITCH_MODE = "constant"`: uniform pitch.
- `PITCH_MODE = "linear_twist"`: linear twist distribution.
- `HOVER_TRIM_MODE = "collective"`: adjust collective for target thrust.
- `HOVER_TRIM_MODE = "rpm"`: adjust RPM for target thrust.
- `HOVER_TRIM_MODE = "none"`: use specified RPM and pitch directly.

### Inflow

- `uniform`: no inflow gradient.
- `coleman_simple`: Coleman basic model.
- `coleman_feingold`: Coleman-Feingold / NDARC form.
- `drees`: Drees model.

### Torque and profile paths

- `INDUCED_TORQUE_MODEL = "analytical_bet"`: direct BET torque integral.
- `INDUCED_TORQUE_MODEL = "energy_balance"` (default): energy-balance closure.
- `PROFILE_DRAG_MODEL = "analytical_tangential"`: tangential-only closed form.
- `PROFILE_DRAG_MODEL = "analytical_vectorial"`: low-order vectorial closed form.
- `PROFILE_DRAG_MODEL = "numerical_vectorial"` (default): full numerical quadrature.
- `K_IND = 1.15` by default.

$K_{\mathrm{ind}}$ affects the energy-balance torque mode, $C_{Pair}$, and hover FoM. It does not modify the direct BET torque integral.

---

## 11. References

1. Wayne Johnson, *Rotorcraft Aeromechanics*, Cambridge University Press, 2013. See especially Chapter 6, including the section-force relations around Eqs. 6.39–6.46, rotor-force decomposition around Eqs. 6.71–6.76, and the power/energy-balance development around Eqs. 6.105–6.115; also Chapter 7 and Section 6.23.
2. J. Gordon Leishman, *Principles of Helicopter Aerodynamics*, Cambridge University Press. See especially Chapter 3, "Blade Element Analysis," and Chapter 5, "Basic Helicopter Performance."
3. Wayne Johnson, *NDARC — NASA Design and Analysis of Rotorcraft: Theory*, NASA/TP-2009-215402.
4. R. P. Coleman, A. M. Feingold, and C. W. Stempin, *Evaluation of the Induced-Velocity Field of an Idealized Helicopter Rotor*, NACA ARR L5E10, 1945.
5. J. M. Drees, "A Theory of Airflow Through Rotors and Its Application to Some Helicopter Problems," 1949.
