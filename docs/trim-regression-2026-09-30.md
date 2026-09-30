# Compiled-engine collective trim regression

## Evidence before correction

On September 30, 2026, a local B4A build was executed through its unchanged compiled engine class. The 100-point direct operating matrix matched the Python reference, but the new operating-pair regression failed:

```text
Compiled rpm_ct at mu=0 / muz=0:
B4A CT = 0.00002041029603422908
Python CT = 0.005056636701147783
```

The case uses R=5 m, RPM=430, four blades, x0=0.15, c0=0.30 m, c1=0.22 m, a0=5.73 rad^-1, Cd0=0.009, root/tip incidence 12/2 degrees, collective increment 4 degrees, fixed B=0.97, Prandtl–Glauert ON, Coleman–Feingold inflow, Numerical Vectorial profile drag, K_ind=1.15, rho=1.225 kg/m³ and sound speed=340.3 m/s. The RPM + CT target is the CT from the prescribed RPM + collective baseline.

## Cause and correction

`SolveCollective` skips invalid candidate states. When the scan first entered a pair of valid states, `fLo` could still contain its initial zero rather than the previous candidate's residual. Zero was then treated as a sign change, creating a false bracket. Bisection could converge to that bracket's boundary and report a valid solution without meeting the target.

The correction assigns `fLo` from the actual previous valid candidate before checking each pair. Aerodynamic equations, quadrature, inflow models, corrections, and physical conventions are unchanged.

The reference is the residual bracketing implemented in `tools/zBET.py`, `solve_operating_pair` / `bracket_bisect_collective`. The existing theory in `docs/zBET-documentation.md` continues to govern the aerodynamic model.

## Regression gate

Run `python tools/verify_compiled_engine.py` after a real local B4A build. It executes the compiled B4A engine, checks 100 direct operating cases with 14 outputs each, exercises all six operating pairs in hover, forward flight and nonzero axial flow, and verifies the default RPM + CT trim meets its target.

Direct coefficient comparison tolerance is `2e-9 + 2e-7 * abs(reference)`. Operating-pair coefficient tolerance is `2e-8` absolute / `3e-6` relative, with RPM tolerance `0.1 rpm` absolute / `2e-4` relative and collective tolerance `2e-4 degrees`. The default CT target must close to `2e-9` absolute. These tolerances account for the engine's rounded quadrature constants and iterative solver stopping criteria.
