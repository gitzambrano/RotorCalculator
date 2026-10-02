import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFactoryPresets,
  exportRotorsJSON,
  exportRotorsDatabaseText,
  parseDatabaseText,
  importRotorsJSON,
  importRotorsUniversal,
  saveStoredRotors,
  resetToFactoryPresets,
  setActiveRotorId,
  getActiveRotorId,
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


describe("Storage preservation and import validation", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  it("restores original factory values while preserving custom rotors and active identity", () => {
    const presets = getFactoryPresets();
    presets[0].geom.radius = 9;
    const custom = { id: "custom-active", name: "My rotor", geom: { ...presets[1].geom, name: "My rotor" } };
    saveStoredRotors([...presets, custom]);
    setActiveRotorId(custom.id);
    const restored = resetToFactoryPresets();
    expect(restored).toHaveLength(presets.length + 1);
    expect(restored.find((r) => r.id === custom.id)).toEqual(custom);
    expect(restored[0].geom.radius).toBe(getFactoryPresets()[0].geom.radius);
    expect(getActiveRotorId()).toBe(custom.id);
  });

  it("preserves renamed factory rotors without duplicating identity", () => {
    const presets = getFactoryPresets();
    presets[0].name = "My UH-60";
    presets[0].geom.name = presets[0].name;
    saveStoredRotors(presets);
    const restored = resetToFactoryPresets();
    expect(restored.some((r) => r.name === "My UH-60")).toBe(true);
    expect(restored.some((r) => r.name === getFactoryPresets()[0].name)).toBe(true);
    expect(new Set(restored.map((r) => r.id)).size).toBe(restored.length);
  });

  it("rejects invalid JSON geometry and makes imported identities independent", () => {
    const valid = getFactoryPresets()[0];
    const invalid = { ...valid, geom: { ...valid.geom, radius: -1 } };
    const missing = { ...valid, geom: { radius: 1 } };
    const imported = importRotorsJSON(JSON.stringify([invalid, missing, valid, valid]));
    expect(imported).toHaveLength(2);
    expect(imported![0].id).not.toBe(valid.id);
    expect(imported![0].id).not.toBe(imported![1].id);
  });

  it("exports the library name even for a previously inconsistent copied geometry", () => {
    const rotor = getFactoryPresets()[0];
    rotor.name = "Copied rotor";
    const imported = parseDatabaseText(exportRotorsDatabaseText([rotor]));
    expect(imported![0].name).toBe("Copied rotor");
    expect(imported![0].geom.name).toBe("Copied rotor");
  });
});
