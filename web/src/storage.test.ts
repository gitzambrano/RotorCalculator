import { describe, it, expect } from "vitest";
import {
  getFactoryPresets,
  exportRotorsJSON,
  exportRotorsDatabaseText,
  parseDatabaseText,
  importRotorsJSON,
  importRotorsUniversal,
} from "./storage";

describe("Rotor Storage & Import/Export Parity", () => {
  it("exports and imports JSON format correctly", () => {
    const presets = getFactoryPresets();
    const jsonStr = exportRotorsJSON(presets);
    expect(jsonStr).toContain("ROTORCALCULATOR_GEOMETRIES");
    const imported = importRotorsJSON(jsonStr);
    expect(imported).not.toBeNull();
    expect(imported?.length).toBe(presets.length);
    expect(imported?.[0].name).toBe("Sikorsky UH-60 Black Hawk");
  });

  it("exports APK-compatible database text format correctly", () => {
    const presets = getFactoryPresets();
    const dbText = exportRotorsDatabaseText(presets);
    expect(dbText.startsWith("ROTORCALCULATOR_GEOMETRIES|3\n")).toBe(true);
    expect(dbText).toContain("R|Sikorsky UH-60 Black Hawk|8.18|4|0.15|");
  });

  it("parses APK v2 database text correctly", () => {
    const testTxt = `ROTORCALCULATOR_GEOMETRIES|2
R|Sikorsky UH-60 Black Hawk|8.18|4|0.15|0.53|0.53|0.24434609527920614|-0.06981317007977318|5.73|0.0088|sissingh|0.97|1
R|Bell 206 JetRanger|5.08|2|0.12|0.33|0.33|0.20943951023931953|0.03490658503988659|5.73|0.009|fixed|0.97|0
`;
    const parsed = parseDatabaseText(testTxt);
    expect(parsed).not.toBeNull();
    expect(parsed?.length).toBe(2);
    expect(parsed?.[0].name).toBe("Sikorsky UH-60 Black Hawk");
    expect(parsed?.[0].geom.radius).toBe(8.18);
    expect(parsed?.[0].geom.nBlades).toBe(4);
    expect(parsed?.[0].geom.tipLossMode).toBe("sissingh");
    expect(parsed?.[0].geom.usePrandtlGlauert).toBe(true);

    expect(parsed?.[1].name).toBe("Bell 206 JetRanger");
    expect(parsed?.[1].geom.radius).toBe(5.08);
    expect(parsed?.[1].geom.usePrandtlGlauert).toBe(false);
  });

  it("universal importer transparently handles both JSON and APK TXT", () => {
    const presets = getFactoryPresets();
    const jsonStr = exportRotorsJSON(presets);
    const dbText = exportRotorsDatabaseText(presets);

    const fromJson = importRotorsUniversal(jsonStr);
    const fromTxt = importRotorsUniversal(dbText);

    expect(fromJson).not.toBeNull();
    expect(fromTxt).not.toBeNull();
    expect(fromJson?.length).toBe(presets.length);
    expect(fromTxt?.length).toBe(presets.length);
    expect(fromJson?.[0].name).toBe(fromTxt?.[0].name);
  });
});
