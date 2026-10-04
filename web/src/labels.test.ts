import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_NOMENCLATURE,
  measureTextWidth,
  chooseLevel,
  fitLabelSize,
  formatSubscripts,
  getPlainLabel,
  getResponsiveInputLabel,
  getResultDisplayLabel,
  getRichLabelHtml,
  nextLevel,
  resultLabelHtml,
  resultPlainLabel,
} from "./labels";

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

  describe("Authoritative Multi-Level Fitting (RotorNames.bas Parity)", () => {
    it("formats PlainLabel according to level", () => {
      // Level 0: Full + Symbol
      expect(getPlainLabel("R", 0)).toBe("Rotor Radius R");
      expect(getPlainLabel("Nb", 0)).toBe("Blade Count N_b");
      expect(getPlainLabel("c0", 0)).toBe("Root Chord c_R");
      expect(getPlainLabel("sigmaRef", 0)).toBe("Reference Solidity σ_REF");
      expect(getPlainLabel("Ab", 0)).toBe("Reference Blade Area A_REF");
      expect(getPlainLabel("T", 0)).toBe("Thrust T");

      // Level 1: Short + Symbol
      expect(getPlainLabel("R", 1)).toBe("Radius R");
      expect(getPlainLabel("Nb", 1)).toBe("Blades N_b");
      expect(getPlainLabel("c0", 1)).toBe("Root Chord c_R");
      expect(getPlainLabel("sigmaRef", 1)).toBe("Reference Solidity σ_REF");
      expect(getPlainLabel("Ab", 1)).toBe("Reference Area A_REF");
      expect(getPlainLabel("T", 1)).toBe("Thrust T");

      // Level 2: Narrow caption + retained symbol
      expect(getPlainLabel("R", 2)).toBe("Radius R");
      expect(getPlainLabel("Nb", 2)).toBe("Blades N_b");
      expect(getPlainLabel("c0", 2)).toBe("Root Chord c_R");
      expect(getPlainLabel("sigmaRef", 2)).toBe("Ref. Solidity σ_REF");
      expect(getPlainLabel("Ab", 2)).toBe("Ref. Area A_REF");

      // Level 3: Abbreviation + Symbol
      expect(getPlainLabel("R", 3)).toBe("Radius R");
      expect(getPlainLabel("Nb", 3)).toBe("Blades N_b");
      expect(getPlainLabel("c0", 3)).toBe("Root Chord c_R");
      expect(getPlainLabel("sigmaRef", 3)).toBe("Ref. Solidity σ_REF");
      expect(getPlainLabel("Ab", 3)).toBe("Ref. Area A_REF");
      expect(getPlainLabel("AR", 3)).toBe("Aspect AR"); // distinct narrow caption

      // Level 4: Symbol only
      expect(getPlainLabel("R", 4)).toBe("R");
      expect(getPlainLabel("Nb", 4)).toBe("N_b");
      expect(getPlainLabel("c0", 4)).toBe("c_R");
      expect(getPlainLabel("c1", 4)).toBe("c_T");
      expect(getPlainLabel("sigmaRef", 4)).toBe("σ_REF");
      expect(getPlainLabel("Ab", 4)).toBe("A_REF");
      expect(getPlainLabel("T", 4)).toBe("T");
      expect(getPlainLabel("CT", 4)).toBe("C_T");
    });

    it("formats RichLabelHtml with HTML <sub> tags", () => {
      expect(getRichLabelHtml("c0", 4)).toBe("c<sub>R</sub>");
      expect(getRichLabelHtml("Nb", 4)).toBe("N<sub>b</sub>");
      expect(getRichLabelHtml("CT", 4)).toBe("C<sub>T</sub>");
      expect(getRichLabelHtml("sigmaRef", 4)).toBe("σ<sub>REF</sub>");
      expect(getRichLabelHtml("Ab", 4)).toBe("A<sub>REF</sub>");
      expect(getRichLabelHtml("c0", 3)).toBe("Root Chord c<sub>R</sub>");
      expect(getRichLabelHtml("mu", 4, " ⇄")).toBe("μ<sub>x</sub><span class=\"label-suffix\"> ⇄</span>");
    });

    it("follows the exact level progression order: 0 -> 1 -> 3 -> 2 -> 4 -> -1", () => {
      expect(nextLevel(0)).toBe(1);
      expect(nextLevel(1)).toBe(3);
      expect(nextLevel(3)).toBe(2);
      expect(nextLevel(2)).toBe(4);
      expect(nextLevel(4)).toBe(-1);
    });

    it("chooses appropriate level based on width and fits without wrapping", () => {
      const keys = ["R", "Nb", "c0", "c1", "sigmaRef", "thTwist"];
      // Generous tablet width (e.g. 350px column) fits level 0 (Full + Symbol)
      const tabletLevel = chooseLevel(keys, 350, 0);
      expect(tabletLevel).toBe(0);

      // Ordinary phone width (e.g. 160px column) fits level 1 or 3
      const phoneLevel = chooseLevel(keys, 160, 1);
      for (const key of keys) {
        expect(measureTextWidth(getPlainLabel(key, phoneLevel), 13)).toBeLessThanOrEqual(160);
      }

      // Extremely tight width (e.g. 40px column) falls back to level 4 (Symbol only)
      const tightLevel = chooseLevel(keys, 40, 1);
      expect(tightLevel).toBe(4);
    });

    it("computes fitted font size between minPx (13) and maxPx (15.5)", () => {
      const keys = ["R", "Nb", "c0"];
      const szWide = fitLabelSize(keys, 4, 300, 15.5, 13);
      expect(szWide).toBe(15.5);

      const szTight = fitLabelSize(keys, 1, 60, 15.5, 13);
      expect(szTight).toBeGreaterThanOrEqual(13);
      expect(szTight).toBeLessThanOrEqual(15.5);
    });

    it("formats braced and unbraced subscripts correctly", () => {
      expect(formatSubscripts("V_{z,tot}")).toBe("V<sub>z,tot</sub>");
      expect(formatSubscripts("α_{adv,75}")).toBe("α<sub>adv,75</sub>");
      expect(formatSubscripts("φ_{ret,75}")).toBe("φ<sub>ret,75</sub>");
      expect(formatSubscripts("C_T")).toBe("C<sub>T</sub>");
      expect(formatSubscripts("P_air")).toBe("P<sub>air</sub>");
      expect(formatSubscripts("H_0")).toBe("H<sub>0</sub>");
    });

    it("formats ResultPlainLabel according to levels 0, 1, 3, 4", () => {
      // Level 0: Full + Symbol
      expect(resultPlainLabel("Vztot", 0)).toBe("Total Axial Speed V_{z,tot}");
      expect(resultPlainLabel("T", 0)).toBe("Thrust T");
      expect(resultPlainLabel("Hi", 0)).toBe("Induced In-Plane Force H_i");
      expect(resultPlainLabel("Pair", 0)).toBe("Air Power P_air");

      // Level 1: Short + Symbol
      expect(resultPlainLabel("Vztot", 1)).toBe("Total Axial Speed V_{z,tot}");
      expect(resultPlainLabel("Hi", 1)).toBe("Induced In-Plane Force H_i");
      expect(resultPlainLabel("Pair", 1)).toBe("Air Power P_air");

      // Level 3: Abbreviation + Symbol
      expect(resultPlainLabel("Vztot", 3)).toBe("Axial Speed V_{z,tot}");
      expect(resultPlainLabel("Hi", 3)).toBe("Ind. In-Plane Force H_i");
      expect(resultPlainLabel("Pair", 3)).toBe("Air Power P_air");

      // Level 4: Symbol only
      expect(resultPlainLabel("Vztot", 4)).toBe("V_{z,tot}");
      expect(resultPlainLabel("Hi", 4)).toBe("H_i");
      expect(resultPlainLabel("Pair", 4)).toBe("P_air");
    });

    it("evaluates ResultLabelHtml through level sequence [0, 1, 3, 4]", () => {
      // Wide width allows full level 0
      const wide = resultLabelHtml("Vztot", 350, 15.5);
      expect(wide).toBe("Total Axial Speed V<sub>z,tot</sub>");

      // Extremely narrow width falls back to symbol (level 4)
      const narrow = resultLabelHtml("Vztot", 30, 15.5);
      expect(narrow).toBe("V<sub>z,tot</sub>");
    });
  });
});


// Guard the visible nomenclature against drift from the installed Android source.
describe("Current APK nomenclature source", () => {
  it("shares every input/result caption and responsive fallback with RotorNames.bas", () => {
    const source = readFileSync(new URL("../../RotorNames.bas", import.meta.url), "utf8");
    const entries = [...source.matchAll(/^\s*Add\("([^"\n]+)", "([^"\n]*)", "([^"\n]*)", "([^"\n]*)"/gm)];
    const base = source.match(/Dim ab\(\) As String = Array As String\(([^\n]+)\)/)![1];
    const values = [...base.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    const abbr: Record<string, string> = {};
    const narrow: Record<string, string> = {};
    const minimum: Record<string, string> = {};
    for (let i = 0; i < values.length; i += 2) abbr[values[i]] = values[i + 1];
    for (const m of source.matchAll(/(abbr|narrowNames|minimumNames)\.Put\("([^"]+)", "([^"]+)"\)/g)) {
      ({ abbr, narrowNames: narrow, minimumNames: minimum })[m[1] as "abbr" | "narrowNames" | "minimumNames"][m[2]] = m[3];
    }
    let compared = 0;
    for (const [, key, full, short, sym] of entries) {
      if (!CANONICAL_NOMENCLATURE[key]) continue;
      compared++;
      expect(CANONICAL_NOMENCLATURE[key], key).toMatchObject({ full, short, sym });
      const captions = [full, short, narrow[key] || abbr[key] || short, abbr[key] || short];
      for (const level of [0, 1, 2, 3, 4]) {
        const caption = captions[level];
        const expected = level === 4 ? sym || minimum[key] || abbr[key] || short
          : !sym || (level >= 2 && caption === sym) ? caption : `${caption} ${sym}`;
        expect(getPlainLabel(key, level), `${key} level ${level}`).toBe(expected);
      }
    }
    expect(compared).toBeGreaterThan(90);
  });
});
