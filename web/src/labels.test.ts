import { describe, expect, it } from "vitest";
import { getResponsiveInputLabel, getResultDisplayLabel } from "./labels";

describe("Mobile Responsive Labels (B4A Parity)", () => {
  describe("ResultDisplayLabel", () => {
    it("shortens to single symbol on mobile screens (width <= 360px)", () => {
      expect(getResultDisplayLabel("T — Thrust", 360)).toBe("T");
      expect(getResultDisplayLabel("Pshaft — Shaft Power", 360)).toBe("Pshaft");
      expect(getResultDisplayLabel("Q — Shaft Torque", 360)).toBe("Q");
      expect(getResultDisplayLabel("H — In-Plane Force", 360)).toBe("H");
      expect(getResultDisplayLabel("Y — Side Force", 360)).toBe("Y");
      expect(getResultDisplayLabel("Mx — Roll Moment", 360)).toBe("Mx");
      expect(getResultDisplayLabel("My — Pitch Moment", 360)).toBe("My");
      expect(getResultDisplayLabel("CT — Thrust Coeff", 360)).toBe("CT");
      expect(getResultDisplayLabel("CQ — Torque Coeff", 360)).toBe("CQ");
      expect(getResultDisplayLabel("CQ,i — Induced Coeff", 360)).toBe("CQ,i");
      expect(getResultDisplayLabel("CQ,0 — Profile Coeff", 360)).toBe("CQ,0");
      expect(getResultDisplayLabel("CH — In-Plane Coeff", 360)).toBe("CH");
      expect(getResultDisplayLabel("CH,i — Induced H", 360)).toBe("CH,i");
      expect(getResultDisplayLabel("CH,0 — Profile H", 360)).toBe("CH,0");
      expect(getResultDisplayLabel("CY — Side Force Coeff", 360)).toBe("CY");
      expect(getResultDisplayLabel("CMx — Roll Moment Coeff", 360)).toBe("CMx");
      expect(getResultDisplayLabel("CMy — Pitch Moment Coeff", 360)).toBe("CMy");
      expect(getResultDisplayLabel("CP,air — Air Power Coeff", 360)).toBe("CP,air");
      expect(getResultDisplayLabel("FM — Figure of Merit", 360)).toBe("FM");
      expect(getResultDisplayLabel("(L/D)eff — Effective L/D", 360)).toBe("(L/D)eff");
      expect(getResultDisplayLabel("λ — Total Inflow", 360)).toBe("λ");
      expect(getResultDisplayLabel("λi — Induced Inflow", 360)).toBe("λi");
      expect(getResultDisplayLabel("Kx — Longitudinal Inflow", 360)).toBe("Kx");
      expect(getResultDisplayLabel("Ky — Lateral Inflow", 360)).toBe("Ky");
      expect(getResultDisplayLabel("χ — Wake Skew Angle", 360)).toBe("χ");
      expect(getResultDisplayLabel("B — Tip-Loss Factor", 360)).toBe("B");
      expect(getResultDisplayLabel("RPM — Solved Speed", 360)).toBe("RPM");
      expect(getResultDisplayLabel("θ0 — Solved Collective", 360)).toBe("θ0");
      expect(getResultDisplayLabel("μx — Advance Ratio", 360)).toBe("μx");
      expect(getResultDisplayLabel("Vx — Airspeed", 360)).toBe("Vx");
      expect(getResultDisplayLabel("μz — Axial Ratio", 360)).toBe("μz");
      expect(getResultDisplayLabel("Vz — Climb Speed", 360)).toBe("Vz");
      expect(getResultDisplayLabel("α — Angle of Attack", 360)).toBe("α");
      expect(getResultDisplayLabel("ΩR — Tip Speed", 360)).toBe("ΩR");
      expect(getResultDisplayLabel("Mtip — Tip Mach", 360)).toBe("Mtip");
      expect(getResultDisplayLabel("Madv — Advancing Mach", 360)).toBe("Madv");
      expect(getResultDisplayLabel("h — Altitude", 360)).toBe("h");
      expect(getResultDisplayLabel("Tamb — Temperature", 360)).toBe("Tamb");
      expect(getResultDisplayLabel("ρ — Air Density", 360)).toBe("ρ");
      expect(getResultDisplayLabel("p — Ambient Pressure", 360)).toBe("p");
      expect(getResultDisplayLabel("a — Speed of Sound", 360)).toBe("a");
    });

    it("uses compact engineering names on mid-width screens (width <= 430px)", () => {
      expect(getResultDisplayLabel("Pshaft — Shaft Power", 400)).toBe("Pshaft — Power");
      expect(getResultDisplayLabel("CT — Thrust Coeff", 400)).toBe("CT — Thrust");
      expect(getResultDisplayLabel("CQ — Torque Coeff", 400)).toBe("CQ — Torque");
      expect(getResultDisplayLabel("CQ,i — Induced Coeff", 400)).toBe("CQ,i — Induced");
      expect(getResultDisplayLabel("CP,air — Air Power Coeff", 400)).toBe("CP,air — Power");
      expect(getResultDisplayLabel("FM — Figure of Merit", 400)).toBe("FM — Merit");
    });

    it("preserves full canonical label on desktop / tablet screens (width > 430px)", () => {
      expect(getResultDisplayLabel("Pshaft — Shaft Power", 768)).toBe("Pshaft — Shaft Power");
      expect(getResultDisplayLabel("CT — Thrust Coeff", 768)).toBe("CT — Thrust Coeff");
    });
  });

  describe("InputDisplayLabel", () => {
    it("shortens input labels to standard symbols on mobile (width <= 360px)", () => {
      expect(getResponsiveInputLabel("Radius R", 360)).toBe("R");
      expect(getResponsiveInputLabel("Blade Count", 360)).toBe("Nb");
      expect(getResponsiveInputLabel("Root Cutout", 360)).toBe("r₀/R");
      expect(getResponsiveInputLabel("Root Chord c0", 360)).toBe("Chord c₀");
      expect(getResponsiveInputLabel("Tip Chord c1", 360)).toBe("Chord c₁");
      expect(getResponsiveInputLabel("Aspect Ratio", 360)).toBe("AR");
      expect(getResponsiveInputLabel("Total Twist", 360)).toBe("Δθ");
      expect(getResponsiveInputLabel("Taper Ratio", 360)).toBe("c₁/c₀");
      expect(getResponsiveInputLabel("Temperature", 360)).toBe("Tamb");
      expect(getResponsiveInputLabel("Target Thrust", 360)).toBe("Target T");
      expect(getResponsiveInputLabel("Compressibility", 360)).toBe("Comp.");
      expect(getResponsiveInputLabel("Inflow Model", 360)).toBe("Inflow");
      expect(getResponsiveInputLabel("Profile Drag", 360)).toBe("Drag");
    });

    it("preserves readable labels on desktop (width > 430px)", () => {
      expect(getResponsiveInputLabel("Radius R", 800)).toBe("Radius R");
      expect(getResponsiveInputLabel("Blade Count", 800)).toBe("Blade Count");
      expect(getResponsiveInputLabel("Temperature", 800)).toBe("Temperature");
    });
  });
});
