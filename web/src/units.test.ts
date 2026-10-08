import { describe, expect, it } from "vitest";
import { convertValue, formatInputValue, formatNumberList, parseNumberList } from "./units";

describe("Android input unit parity", () => {
  it("formats engineering inputs with the Android decimal limits", () => {
    expect(formatInputValue("rpmNom", 258, "rpm")).toBe("258");
    expect(formatInputValue("x0", 0.15)).toBe("0.150");
    expect(formatInputValue("mu", 0)).toBe("0.00");
    expect(formatInputValue("mu", 0, "", 1)).toBe("0.000");
    expect(formatInputValue("mu", 0, "", -1)).toBe("0.0");
    expect(formatInputValue("R", 8.18, "m")).toBe("8.18");
    expect(formatInputValue("c0", 0.53, "m")).toBe("0.53");
    expect(formatInputValue("T0", 15, "°C")).toBe("15.0");
    expect(formatInputValue("h", 0, "m")).toBe("0");
    expect(formatInputValue("alpha", 0, "deg")).toBe("0.0");
    expect(formatInputValue("CTtgt", 0.0065)).toBe("0.00650");
  });
  it("formats the lift slope a0 with unit-aware decimals", () => {
    expect(formatInputValue("a0", 5.73, "rad⁻¹")).toBe("5.73");
    expect(formatInputValue("a0", 5.7, "rad⁻¹")).toBe("5.70");
    expect(formatInputValue("a0", convertValue(5.73, "rad⁻¹", "deg⁻¹"), "deg⁻¹")).toBe("0.1000");
    expect(formatInputValue("a0", 0.0987, "deg⁻¹")).toBe("0.0987");
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

describe("Input formatting by unit", () => {
  it("shows altitude decimals that match the unit", () => {
    expect(formatInputValue("h", 1500, "m")).toBe("1500");
    expect(formatInputValue("h", 1000.5, "m")).toBe("1000.5");
    expect(formatInputValue("h", 1.5244, "km")).toBe("1.524");
    expect(formatInputValue("h", 0.3048, "km")).toBe("0.305");
  });
  it("shows pitch in radians with four decimals", () => {
    expect(formatInputValue("thRoot", 0.2443461, "rad")).toBe("0.2443");
    expect(formatInputValue("thRoot", 14, "deg")).toBe("14.0");
  });
});

describe("Number list parsing", () => {
  it("separates items with semicolons or spaces and accepts a decimal comma", () => {
    expect(parseNumberList("2,5")).toEqual([2.5]);
    expect(parseNumberList("2,5; 3 4.5")).toEqual([2.5, 3, 4.5]);
    expect(parseNumberList("-10; -5; 0; 5; 10")).toEqual([-10, -5, 0, 5, 10]);
  });
  it("rejects text, empty lists and partial numbers", () => {
    expect(parseNumberList("")).toBeNull();
    expect(parseNumberList("1; abc")).toBeNull();
    expect(parseNumberList("1e")).toBeNull();
    expect(parseNumberList("1,2,3")).toBeNull();
  });
  it("formats a list for editing and parses it back", () => {
    const text = formatNumberList([-0.05, 0, 0.05]);
    expect(parseNumberList(text)).toEqual([-0.05, 0, 0.05]);
  });
});
