import { describe, it, expect } from "vitest";
import { getHelpSvg } from "./help-illustrations";

describe("help-illustrations", () => {
  it("returns blade planform SVG for planform keys", () => {
    const keys = ["R", "x0", "c0", "c1", "taper", "Ab", "Aact", "sigmaRef", "sigmaAct", "sigmaT", "AR"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("c<tspan baseline-shift=\"-3\" font-size=\"72%\">R</tspan>");
    }
  });

  it("returns pitch and twist SVG for pitch/twist keys", () => {
    const keys = ["thRoot", "thTip", "thTwist", "th75", "theta75", "coll"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("θ");
      expect(svg).toContain("Δθ");
    }
  });

  it("returns disk azimuth SVG for in-plane and advancing/retreating keys", () => {
    const keys = ["mu", "Vx", "Vadv", "Vret", "Madv", "Mret", "psi"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("advancing");
      expect(svg).toContain("retreating");
    }
  });

  it("returns shaft frame SVG for AoA, climb, and axial velocity keys", () => {
    const keys = ["alpha", "Vz", "muz", "Vztot"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("disk plane");
      expect(svg).toContain("α");
    }
  });

  it("returns wake skew SVG for wake skew keys", () => {
    const keys = ["chi", "muLam"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("Wake skew angle");
    }
  });

  it("returns inflow distribution SVG for inflow keys", () => {
    const keys = ["inflow", "Kx", "Ky", "lam", "lami", "vi", "lamh"];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("Induced inflow distribution");
    }
  });

  it("returns velocity triangle SVG for blade element kinematics and AoA/phi keys", () => {
    const keys = [
      "aoaAdv25", "aoaRet25", "aoaAdv50", "aoaRet50", "aoaAdv75", "aoaRet75",
      "phiAdv25", "phiRet25", "phiAdv50", "phiRet50", "phiAdv75", "phiRet75",
      "CLbar", "a0"
    ];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeTruthy();
      expect(svg).toContain("<svg");
      expect(svg).toContain("Velocity triangle at a blade section");
    }
  });

  it("returns null for non-diagram keys and unknown keys", () => {
    const keys = ["trim", "name", "Nb", "h", "T0", "T", "P", "Q", "unknownKey", ""];
    for (const key of keys) {
      const svg = getHelpSvg(key);
      expect(svg).toBeNull();
    }
  });
});
