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
  resolveImportConflicts,
  type ImportConflictDecision,
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


describe("Factory geometry matches Android definitions", () => {
  it("preserves the original DJI and eVTOL active-span chord law through an APK-compatible backup", () => {
    const presets = getFactoryPresets();
    const imported = parseDatabaseText(exportRotorsDatabaseText(presets))!;
    const drone = imported.find((rotor) => rotor.name === "DJI Matrice 300 Drone")!.geom;
    const evtol = imported.find((rotor) => rotor.name === "eVTOL Conceptual Rotor")!.geom;
    expect(drone.chordRoot).toBe(0.0472222222);
    expect(evtol.chordRoot).toBe(0.1488235294);
    expect(drone.chordRoot + (drone.chordTip - drone.chordRoot) * drone.rootCutout).toBeCloseTo(0.045, 10);
    expect(evtol.chordRoot + (evtol.chordTip - evtol.chordRoot) * evtol.rootCutout).toBeCloseTo(0.14, 10);
  });
});

describe("Safe storage and per-entry validation", () => {
  const values = new Map<string, string>();
  beforeEach(() => {
    values.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  it("keeps valid rotors and skips malformed entries without wiping the library", async () => {
    const { loadStoredRotors } = await import("./storage");
    const presets = getFactoryPresets();
    const custom = { id: "custom-1", name: "Mine", geom: { ...presets[0].geom, name: "Mine" } };
    const broken = { id: "custom-2", name: "Broken" };
    const bad = { id: "custom-3", name: "Bad", geom: { radius: -4 } };
    values.set("rotorcalculator_rotors_v2", JSON.stringify([custom, broken, bad, null, 7]));
    const loaded = loadStoredRotors();
    expect(loaded.map((r) => r.id)).toEqual(["custom-1"]);
    // The raw store is backed up before the cleaned list replaces it.
    expect(values.get("rotorcalculator_rotors_v2_backup")).toContain("custom-3");
  });

  it("does not overwrite an unreadable store", async () => {
    const { loadStoredRotors } = await import("./storage");
    values.set("rotorcalculator_rotors_v2", "{not json");
    const loaded = loadStoredRotors();
    expect(loaded.length).toBe(getFactoryPresets().length);
    expect(values.get("rotorcalculator_rotors_v2")).toBe("{not json");
    expect(values.get("rotorcalculator_rotors_v2_backup")).toBe("{not json");
  });

  it("reports a failed write and falls back to memory", async () => {
    const { saveStoredRotors, safeGet, safeSet } = await import("./storage");
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("quota"); },
      removeItem: () => { throw new Error("blocked"); },
    });
    expect(saveStoredRotors(getFactoryPresets())).toBe(false);
    expect(safeSet("unit_test_key", "value")).toBe(false);
    expect(safeGet("unit_test_key")).toBe("value");
  });

  it("sanitizes names and makes names unique inside one import", () => {
    const preset = getFactoryPresets()[0];
    const a = { ...preset, name: "Rotor <b>X</b>|\nTwo" };
    const b = { ...preset, name: "Rotor" };
    const c = { ...preset, name: "rotor" };
    const imported = importRotorsJSON(JSON.stringify([a, b, c]))!;
    expect(imported[0].name).toBe("Rotor bX/b/ Two");
    expect(imported[0].name).not.toMatch(/[<>|\n]/);
    expect(imported[1].name).toBe("Rotor");
    expect(imported[2].name).toBe("rotor 2");
    expect(imported.every((r) => r.name === r.geom.name)).toBe(true);
  });

  it("limits imported names to 32 characters", () => {
    const preset = getFactoryPresets()[0];
    const imported = importRotorsJSON(JSON.stringify([{ ...preset, name: "N".repeat(80) }]))!;
    expect(imported[0].name.length).toBe(32);
  });
});

describe("Per-item import conflict resolution", () => {
  const mk = (id: string, name: string, radius = 5) => {
    const preset = getFactoryPresets()[0];
    return { id, name, geom: { ...preset.geom, name, radius } };
  };
  const existing = [mk("a", "Alpha", 1), mk("b", "Beta", 2)];

  it("imports non-conflicting rotors without a decision", () => {
    const r = resolveImportConflicts(existing, [mk("x", "Gamma")], [undefined]);
    expect(r.rotors.map((x) => x.name)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(r.added).toBe(1);
    expect(r.first?.name).toBe("Gamma");
    expect(existing).toHaveLength(2);
  });

  it("applies a different decision to each conflict", () => {
    const imported = [mk("1", "alpha", 9), mk("2", "Beta", 9), mk("3", "Delta", 9)];
    const decisions: (ImportConflictDecision | undefined)[] = ["replace", "skip", undefined];
    const r = resolveImportConflicts(existing, imported, decisions);
    expect(r.rotors.map((x) => x.name)).toEqual(["alpha", "Beta", "Delta"]);
    expect(r.rotors[0].id).toBe("a");
    expect(r.rotors[0].geom.radius).toBe(9);
    expect(r.rotors[1].geom.radius).toBe(2);
    expect(r).toMatchObject({ added: 1, replaced: 1, skipped: 1 });
    expect(r.first?.id).toBe("a");
  });

  it("renames with a unique name and keeps both rotors", () => {
    const r = resolveImportConflicts(existing, [mk("1", "Alpha", 9), mk("2", "Alpha", 8)], ["rename", "rename"]);
    expect(r.rotors.map((x) => x.name)).toEqual(["Alpha", "Beta", "Alpha (Imported)", "Alpha (2)"]);
    expect(r.rotors.every((x) => x.name === x.geom.name)).toBe(true);
    expect(r.first?.name).toBe("Alpha (Imported)");
  });

  it("makes no change when every conflict is skipped", () => {
    const r = resolveImportConflicts(existing, [mk("1", "Alpha"), mk("2", "Beta")], ["skip", "skip"]);
    expect(r.rotors).toEqual(existing);
    expect(r.first).toBeUndefined();
    expect(r.skipped).toBe(2);
  });

  it("limits renamed names to 32 characters", () => {
    const long = "N".repeat(32);
    const r = resolveImportConflicts([mk("a", long)], [mk("1", long)], ["rename"]);
    expect(r.rotors[1].name.length).toBeLessThanOrEqual(32);
    expect(r.rotors[1].name).not.toBe(long);
  });
});
