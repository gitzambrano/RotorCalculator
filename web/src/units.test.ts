import { describe, expect, it } from "vitest";
import { convertValue, formatInputValue } from "./units";

describe("Android input unit parity", () => {
  it("formats engineering inputs with the Android decimal limits", () => {
    expect(formatInputValue("rpmNom", 258, "rpm")).toBe("258");
    expect(formatInputValue("x0", 0.15)).toBe("0.150");
    expect(formatInputValue("mu", 0)).toBe("0.0000");
    expect(formatInputValue("R", 8.18, "m")).toBe("8.18");
    expect(formatInputValue("c0", 0.53, "m")).toBe("0.53");
    expect(formatInputValue("T0", 15, "°C")).toBe("15.00");
    expect(formatInputValue("alpha", 0, "deg")).toBe("0.0");
    expect(formatInputValue("CTtgt", 0.0065)).toBe("0.00650");
  });
  it("converts rotation speed between rpm and radians per second", () => {
    expect(convertValue(60, "rpm", "rad/s")).toBeCloseTo(2 * Math.PI, 12);
    expect(convertValue(2 * Math.PI, "rad/s", "rpm")).toBeCloseTo(60, 12);
  });
  it("converts every supported area unit without changing physical geometry", () => {
    expect(convertValue(1, "m²", "ft²")).toBeCloseTo(10.7639104167, 9);
    expect(convertValue(1, "m²", "cm²")).toBe(10000);
    expect(convertValue(1, "m²", "in²")).toBeCloseTo(1550.0031000062, 9);
    for (const unit of ["ft²", "in²", "cm²"]) {
      expect(convertValue(convertValue(3.14159, "m²", unit), unit, "m²")).toBeCloseTo(3.14159, 12);
    }
  });
  it("supports centimeters and radians for pitch", () => {
    expect(convertValue(1, "m", "cm")).toBe(100);
    expect(convertValue(Math.PI, "rad", "deg")).toBeCloseTo(180, 12);
  });
});
