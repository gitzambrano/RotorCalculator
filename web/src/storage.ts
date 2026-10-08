import { cloneGeometry, resolveSolidity, type RotorGeometry } from "./engine";

export interface StoredRotor {
  id: string;
  name: string;
  geom: RotorGeometry;
}

const STORAGE_KEY = "rotorcalculator_rotors_v2";
const ACTIVE_ID_KEY = "rotorcalculator_active_rotor_id";
const BACKUP_KEY = "rotorcalculator_rotors_v2_backup";
export const MAX_ROTOR_NAME_LENGTH = 32;

// ---------------------------------------------------------------------------
// Safe storage: every access is guarded, with an in-memory fallback so the
// application keeps working when localStorage is blocked or full.
// ---------------------------------------------------------------------------
const memoryStore = new Map<string, string>();

/** Read a stored string. Returns null when the key does not exist. */
export function safeGet(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value !== null && value !== undefined) return value;
  } catch {
    // fall through to memory
  }
  return memoryStore.has(key) ? (memoryStore.get(key) as string) : null;
}

/** Write a string. Returns true when the value reached persistent storage. */
export function safeSet(key: string, value: string): boolean {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Storage write failed for ${key}:`, err);
    return false;
  }
}

export function safeRemove(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Remove control characters, delimiters and markup characters from a rotor name. */
export function sanitizeRotorName(name: unknown, fallback = "Imported Rotor"): string {
  const text = typeof name === "string" ? name : name == null ? "" : String(name);
  const clean = text
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\|/g, "/")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ROTOR_NAME_LENGTH)
    .trim();
  return clean || fallback;
}

/** Make names unique inside one list (case-insensitive) by appending a counter. */
export function dedupeRotorNames(list: StoredRotor[]): StoredRotor[] {
  const seen = new Set<string>();
  for (const rotor of list) {
    const base = sanitizeRotorName(rotor.name);
    let candidate = base;
    let counter = 2;
    while (seen.has(candidate.toLowerCase())) {
      const suffix = ` ${counter++}`;
      candidate = `${base.slice(0, MAX_ROTOR_NAME_LENGTH - suffix.length).trim()}${suffix}`;
    }
    seen.add(candidate.toLowerCase());
    rotor.name = candidate;
    rotor.geom = { ...rotor.geom, name: candidate };
  }
  return list;
}

export type ImportConflictDecision = "rename" | "replace" | "skip";

export interface ImportResolution {
  /** New library list. The input list is not changed. */
  rotors: StoredRotor[];
  /** First imported (or replaced) rotor as it exists in the new list. */
  first: StoredRotor | undefined;
  added: number;
  replaced: number;
  skipped: number;
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Return a name that is not in `taken` (case-insensitive). Adds " (Imported)", then " (2)", " (3)", ... */
export function uniqueImportedName(name: string, taken: Set<string>): string {
  let candidate = name;
  let counter = 1;
  while (taken.has(nameKey(candidate))) {
    const tail = ` (${counter === 1 ? "Imported" : counter})`;
    candidate = `${name.slice(0, MAX_ROTOR_NAME_LENGTH - tail.length).trim()}${tail}`;
    counter++;
  }
  return candidate;
}

/**
 * Merge imported rotors into the library. `decisions[i]` is the choice for imported[i]
 * when its name already exists. Rotors without a name conflict import unchanged.
 * A conflict without a decision is renamed, so no rotor is lost or replaced by accident.
 */
export function resolveImportConflicts(
  existing: StoredRotor[],
  imported: StoredRotor[],
  decisions: ReadonlyArray<ImportConflictDecision | undefined>,
  makeId: () => string = () => `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
): ImportResolution {
  const rotors = existing.slice();
  const taken = new Set(rotors.map((r) => nameKey(r.name)));
  let first: StoredRotor | undefined;
  let added = 0;
  let replaced = 0;
  let skipped = 0;
  imported.forEach((imp, i) => {
    const matchIdx = rotors.findIndex((r) => nameKey(r.name) === nameKey(imp.name));
    if (matchIdx < 0) {
      const rotor: StoredRotor = { id: makeId(), name: imp.name, geom: cloneGeometry({ ...imp.geom, name: imp.name }) };
      rotors.push(rotor);
      taken.add(nameKey(rotor.name));
      first = first || rotor;
      added++;
      return;
    }
    const decision = decisions[i] ?? "rename";
    if (decision === "skip") {
      skipped++;
    } else if (decision === "replace") {
      const rotor: StoredRotor = { id: rotors[matchIdx].id, name: imp.name, geom: cloneGeometry({ ...imp.geom, name: imp.name }) };
      rotors[matchIdx] = rotor;
      first = first || rotor;
      replaced++;
    } else {
      const name = uniqueImportedName(imp.name, taken);
      const rotor: StoredRotor = { id: makeId(), name, geom: cloneGeometry({ ...imp.geom, name }) };
      rotors.push(rotor);
      taken.add(nameKey(name));
      first = first || rotor;
      added++;
    }
  });
  return { rotors, first, added, replaced, skipped };
}

export function getFactoryPresets(): StoredRotor[] {
  return [
    {
      id: "preset-uh60",
      name: "Sikorsky UH-60 Black Hawk",
      geom: resolveSolidity({
        name: "Sikorsky UH-60 Black Hawk",
        rpm: 258.0,
        nominalRpm: 258.0,
        radius: 8.18,
        liftSlope0: 5.73,
        rootCutout: 0.15,
        cd0: 0.0088,
        solidityMode: "chords",
        sigmaRef: 0.0825,
        sigmaGeom: 0.07,
        sigmaThrust: 0.075,
        nBlades: 4,
        chordRoot: 0.53,
        chordTip: 0.53,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (14.0 * Math.PI) / 180.0,
        thetaTip: (-4.0 * Math.PI) / 180.0,
        tipLossMode: "sissingh",
        tipLossB: 0.97,
        usePrandtlGlauert: true,
      }),
    },
    {
      id: "preset-b206",
      name: "Bell 206 JetRanger",
      geom: resolveSolidity({
        name: "Bell 206 JetRanger",
        rpm: 394.0,
        nominalRpm: 394.0,
        radius: 5.08,
        liftSlope0: 5.73,
        rootCutout: 0.12,
        cd0: 0.009,
        solidityMode: "chords",
        sigmaRef: 0.0414,
        sigmaGeom: 0.036,
        sigmaThrust: 0.04,
        nBlades: 2,
        chordRoot: 0.33,
        chordTip: 0.33,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (12.0 * Math.PI) / 180.0,
        thetaTip: (2.0 * Math.PI) / 180.0,
        tipLossMode: "fixed",
        tipLossB: 0.97,
        usePrandtlGlauert: true,
      }),
    },
    {
      id: "preset-bo105",
      name: "Eurocopter Bo 105",
      geom: resolveSolidity({
        name: "Eurocopter Bo 105",
        rpm: 424.0,
        nominalRpm: 424.0,
        radius: 4.92,
        liftSlope0: 5.73,
        rootCutout: 0.14,
        cd0: 0.0092,
        solidityMode: "chords",
        sigmaRef: 0.07,
        sigmaGeom: 0.06,
        sigmaThrust: 0.067,
        nBlades: 4,
        chordRoot: 0.27,
        chordTip: 0.27,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (11.0 * Math.PI) / 180.0,
        thetaTip: (3.0 * Math.PI) / 180.0,
        tipLossMode: "sissingh",
        tipLossB: 0.97,
        usePrandtlGlauert: true,
      }),
    },
    {
      id: "preset-r44",
      name: "Robinson R44",
      geom: resolveSolidity({
        name: "Robinson R44",
        rpm: 408.0,
        nominalRpm: 408.0,
        radius: 5.03,
        liftSlope0: 5.73,
        rootCutout: 0.1,
        cd0: 0.009,
        solidityMode: "chords",
        sigmaRef: 0.0316,
        sigmaGeom: 0.028,
        sigmaThrust: 0.031,
        nBlades: 2,
        chordRoot: 0.254,
        chordTip: 0.269,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (10.0 * Math.PI) / 180.0,
        thetaTip: (4.0 * Math.PI) / 180.0,
        tipLossMode: "fixed",
        tipLossB: 0.97,
        usePrandtlGlauert: true,
      }),
    },
    {
      id: "preset-dji",
      name: "DJI Matrice 300 Drone",
      geom: resolveSolidity({
        name: "DJI Matrice 300 Drone",
        rpm: 5300.0,
        nominalRpm: 5300.0,
        radius: 0.267,
        liftSlope0: 5.65,
        rootCutout: 0.1,
        cd0: 0.012,
        solidityMode: "chords",
        sigmaRef: 0.08,
        sigmaGeom: 0.072,
        sigmaThrust: 0.078,
        nBlades: 2,
        chordRoot: 0.0472222222,
        chordTip: 0.025,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (25.0 * Math.PI) / 180.0,
        thetaTip: (6.25 * Math.PI) / 180.0,
        tipLossMode: "sissingh",
        tipLossB: 0.97,
        usePrandtlGlauert: false,
      }),
    },
    {
      id: "preset-evtol",
      name: "eVTOL Conceptual Rotor",
      geom: resolveSolidity({
        name: "eVTOL Conceptual Rotor",
        rpm: 1160.0,
        nominalRpm: 1160.0,
        radius: 1.4,
        liftSlope0: 5.85,
        rootCutout: 0.15,
        cd0: 0.0095,
        solidityMode: "chords",
        sigmaRef: 0.13,
        sigmaGeom: 0.11,
        sigmaThrust: 0.125,
        nBlades: 5,
        chordRoot: 0.1488235294,
        chordTip: 0.09,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (18.0 * Math.PI) / 180.0,
        thetaTip: (4.0 * Math.PI) / 180.0,
        tipLossMode: "sissingh",
        tipLossB: 0.97,
        usePrandtlGlauert: true,
      }),
    },
  ];
}

function backupRawStore(raw: string): void {
  if (safeGet(BACKUP_KEY) === raw) return;
  safeSet(BACKUP_KEY, raw);
}

/**
 * Load saved rotors. Malformed entries are skipped, valid entries are kept,
 * and an unreadable store is never overwritten (the raw value is backed up).
 */
export function loadStoredRotors(): StoredRotor[] {
  const raw = safeGet(STORAGE_KEY);
  if (raw === null || raw === "") {
    const presets = getFactoryPresets();
    saveStoredRotors(presets);
    return presets;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn("Saved rotors are unreadable; keeping a backup and using presets:", err);
    backupRawStore(raw);
    return getFactoryPresets();
  }
  if (!Array.isArray(parsed)) {
    backupRawStore(raw);
    return getFactoryPresets();
  }
  if (parsed.length === 0) {
    const presets = getFactoryPresets();
    saveStoredRotors(presets);
    return presets;
  }
  const valid: StoredRotor[] = [];
  const usedIds = new Set<string>();
  let skipped = 0;
  for (const item of parsed as unknown[]) {
    const rotor = coerceStoredRotor(item);
    if (!rotor) {
      skipped++;
      continue;
    }
    if (usedIds.has(rotor.id)) rotor.id = `${rotor.id}-${usedIds.size}-${Math.random().toString(36).substring(2, 6)}`;
    usedIds.add(rotor.id);
    valid.push(rotor);
  }
  if (valid.length === 0) {
    backupRawStore(raw);
    return getFactoryPresets();
  }
  if (skipped > 0) {
    backupRawStore(raw);
    saveStoredRotors(valid);
  }
  return valid;
}

function coerceStoredRotor(item: unknown): StoredRotor | null {
  if (!item || typeof item !== "object") return null;
  const rec = item as Record<string, unknown>;
  if (!rec.geom || typeof rec.geom !== "object") return null;
  const geomIn = rec.geom as Record<string, unknown>;
  const name = sanitizeRotorName(rec.name ?? geomIn.name, "");
  if (!name) return null;
  const candidate = { ...(geomIn as unknown as RotorGeometry), name };
  const nominal = candidate.nominalRpm ?? candidate.rpm;
  if (!Number.isFinite(nominal) || nominal <= 0) return null;
  if (!isImportedGeometryValid(candidate)) return null;
  const id = typeof rec.id === "string" && rec.id.trim() ? rec.id : `restored-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    return { id, name, geom: resolveSolidity(candidate) };
  } catch {
    return null;
  }
}

/** Persist the rotor library. Returns false when the browser refuses the write. */
export function saveStoredRotors(rotors: StoredRotor[]): boolean {
  try {
    return safeSet(STORAGE_KEY, JSON.stringify(rotors));
  } catch (err) {
    console.error("Failed to serialize rotors:", err);
    return false;
  }
}

export function getActiveRotorId(): string {
  return safeGet(ACTIVE_ID_KEY) || "preset-uh60";
}

export function setActiveRotorId(id: string): boolean {
  return safeSet(ACTIVE_ID_KEY, id);
}

export function exportRotorsJSON(rotors: StoredRotor[]): string {
  return JSON.stringify(
    {
      schema: "ROTORCALCULATOR_GEOMETRIES",
      version: 2,
      exportedAt: new Date().toISOString(),
      rotors,
    },
    null,
    2
  );
}

export function defaultNominalRPM(radius: number): number {
  const vtip = radius > 1.0 ? 210.0 : 120.0;
  return (60.0 * vtip) / (2.0 * Math.PI * Math.max(0.02, radius));
}

export function exportRotorsDatabaseText(rotors: StoredRotor[]): string {
  const lines: string[] = ["ROTORCALCULATOR_GEOMETRIES|3"];
  for (const r of rotors) {
    const g = r.geom;
    const cleanName = sanitizeRotorName(r.name || g.name, "");
    const pg = g.usePrandtlGlauert ? "1" : "0";
    const nomRpm = g.nominalRpm && g.nominalRpm > 0 ? g.nominalRpm : g.rpm;
    lines.push(
      [
        "R",
        cleanName || "Custom Rotor",
        g.radius,
        g.nBlades,
        g.rootCutout,
        g.chordRoot,
        g.chordTip,
        g.thetaRoot,
        g.thetaTip,
        g.liftSlope0,
        g.cd0,
        g.tipLossMode || "fixed",
        g.tipLossB ?? 0.97,
        pg,
        nomRpm,
      ].join("|")
    );
  }
  return lines.join("\n") + "\n";
}

export function isImportedGeometryValid(g: RotorGeometry): boolean {
  if (!g.name || !g.name.trim()) return false;
  if (!Number.isFinite(g.radius) || g.radius < 0.02 || g.radius > 50.0) return false;
  if (!Number.isInteger(g.nBlades) || g.nBlades < 1 || g.nBlades > 16) return false;
  if (!Number.isFinite(g.rootCutout) || g.rootCutout < 0.0 || g.rootCutout > 0.95) return false;
  if (!Number.isFinite(g.chordRoot) || g.chordRoot <= 0.0 || g.chordRoot > 2.0 * g.radius) return false;
  if (!Number.isFinite(g.chordTip) || g.chordTip <= 0.0 || g.chordTip > 2.0 * g.radius) return false;
  if (!Number.isFinite(g.thetaRoot) || Math.abs(g.thetaRoot) > Math.PI / 2.0) return false;
  if (!Number.isFinite(g.thetaTip) || Math.abs(g.thetaTip) > Math.PI / 2.0) return false;
  if (!Number.isFinite(g.liftSlope0) || g.liftSlope0 < 0.1 || g.liftSlope0 > 10.0) return false;
  if (!Number.isFinite(g.cd0) || g.cd0 < 0.0 || g.cd0 > 0.5) return false;
  if (g.tipLossMode !== "none" && g.tipLossMode !== "fixed" && g.tipLossMode !== "sissingh") return false;
  if (g.tipLossMode === "fixed") {
    if (!Number.isFinite(g.tipLossB) || g.tipLossB <= g.rootCutout || g.tipLossB > 1.0) return false;
  }
  return true;
}

export function parseDatabaseText(text: string): StoredRotor[] | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let version = 0;
  const imported: StoredRotor[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("|");
    if (parts.length >= 2 && parts[0] === "ROTORCALCULATOR_GEOMETRIES") {
      version = parseInt(parts[1], 10) || 3;
    } else if ((version === 2 || version === 3) && parts.length >= 14 && parts[0] === "R") {
      try {
        const name = sanitizeRotorName(parts[1]);
        const radius = parseFloat(parts[2]);
        const nBlades = parseInt(parts[3], 10);
        const rootCutout = parseFloat(parts[4]);
        const chordRoot = parseFloat(parts[5]);
        const chordTip = parseFloat(parts[6]);
        const thetaRoot = parseFloat(parts[7]);
        const thetaTip = parseFloat(parts[8]);
        const liftSlope0 = parseFloat(parts[9]);
        const cd0 = parseFloat(parts[10]);
        const tipLossMode = (parts[11] as "none" | "fixed" | "sissingh") || "fixed";
        const tipLossB = parseFloat(parts[12]);
        const usePrandtlGlauert = parts[13] === "1";
        const nomRpm = parts.length >= 15 ? parseFloat(parts[14]) : defaultNominalRPM(radius);
        const validNomRpm = Number.isFinite(nomRpm) && nomRpm > 0 ? nomRpm : defaultNominalRPM(radius);

        const rawGeom: RotorGeometry = {
          name,
          radius,
          rpm: validNomRpm,
          nominalRpm: validNomRpm,
          nBlades,
          rootCutout,
          solidityMode: "chords",
          sigmaRef: 0.08,
          sigmaGeom: 0.07,
          sigmaThrust: 0.075,
          chordRoot,
          chordTip,
          pitchMode: "linear_twist",
          theta0: 0.5 * (thetaRoot + thetaTip),
          thetaRoot,
          thetaTip,
          liftSlope0,
          cd0,
          tipLossMode,
          tipLossB,
          usePrandtlGlauert,
        };

        if (isImportedGeometryValid(rawGeom)) {
          const resolved = resolveSolidity(rawGeom);
          imported.push({
            id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            name: resolved.name,
            geom: resolved,
          });
        }
      } catch (err) {
        console.warn(`Skipping invalid imported rotor line ${i}:`, err);
      }
    } else if (parts.length >= 18) {
      // Legacy v1 line format
      try {
        const name = sanitizeRotorName(parts[0]);
        const radius = parseFloat(parts[1]);
        const nBlades = parseInt(parts[3], 10);
        const rootCutout = parseFloat(parts[4]);
        const oldRoot = parseFloat(parts[9]);
        const tip = parseFloat(parts[10]);
        const chordRoot = rootCutout < 0.999 ? oldRoot - ((tip - oldRoot) * rootCutout) / (1.0 - rootCutout) : oldRoot;
        const chordTip = tip;
        const liftSlope0 = parseFloat(parts[11]);
        const cd0 = parseFloat(parts[12]);
        const thetaRoot = parseFloat(parts[15]);
        const thetaTip = parseFloat(parts[16]);
        const tipLossMode = (parts[17] as "none" | "fixed" | "sissingh") || "fixed";
        const tipLossB = parts.length >= 19 ? parseFloat(parts[18]) : 0.97;
        const usePrandtlGlauert = parts.length >= 20 ? parts[19] === "1" : false;
        const nomRpm = defaultNominalRPM(radius);

        const rawGeom: RotorGeometry = {
          name,
          radius,
          rpm: nomRpm,
          nominalRpm: nomRpm,
          nBlades,
          rootCutout,
          solidityMode: "chords",
          sigmaRef: 0.08,
          sigmaGeom: 0.07,
          sigmaThrust: 0.075,
          chordRoot,
          chordTip,
          pitchMode: "linear_twist",
          theta0: 0.5 * (thetaRoot + thetaTip),
          thetaRoot,
          thetaTip,
          liftSlope0,
          cd0,
          tipLossMode,
          tipLossB,
          usePrandtlGlauert,
        };

        if (isImportedGeometryValid(rawGeom)) {
          const resolved = resolveSolidity(rawGeom);
          imported.push({
            id: `imported-v1-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            name: resolved.name,
            geom: resolved,
          });
        }
      } catch (err) {
        console.warn(`Skipping invalid legacy rotor line ${i}:`, err);
      }
    }
  }

  return imported.length > 0 ? dedupeRotorNames(imported) : null;
}

const DRAFT_KEY = "rotorcalculator_geometry_draft";

export function hasDraft(): boolean {
  return safeGet(DRAFT_KEY) !== null;
}

/** Persist the unsaved geometry. Returns false when the browser refuses the write. */
export function saveDraft(geom: RotorGeometry, baseId: string = "active"): boolean {
  try {
    return safeSet(DRAFT_KEY, JSON.stringify({ geom, baseId }));
  } catch (err) {
    console.error("Failed to serialize draft:", err);
    return false;
  }
}

export function loadDraft(): { geom: RotorGeometry; baseId: string } | null {
  try {
    const raw = safeGet(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.geom && typeof parsed.geom === "object" && typeof parsed.baseId === "string") {
      const g = parsed.geom as RotorGeometry;
      if (!Number.isFinite(g.radius) || !Number.isFinite(g.rpm) || !Number.isFinite(g.chordRoot) || !Number.isFinite(g.chordTip)) return null;
      return { geom: resolveSolidity({ ...g, name: sanitizeRotorName(g.name, "Custom Rotor") }), baseId: parsed.baseId };
    }
  } catch (err) {
    console.warn("Failed to load draft:", err);
  }
  return null;
}

export function clearDraft(): void {
  safeRemove(DRAFT_KEY);
}

export function importRotorsJSON(jsonStr: string): StoredRotor[] | null {
  try {
    const data = JSON.parse(jsonStr);
    const list = Array.isArray(data) ? data : data.rotors;
    if (!Array.isArray(list) || list.length === 0) return null;

    const validated: StoredRotor[] = [];
    for (const item of list) {
      if (item && item.name && item.geom) {
        const name = sanitizeRotorName(item.name);
        const geom = { ...item.geom, name } as RotorGeometry;
        if (!isImportedGeometryValid(geom)) continue;
        const nominalRpm = geom.nominalRpm ?? geom.rpm;
        if (!Number.isFinite(nominalRpm) || nominalRpm <= 0) continue;
        geom.nominalRpm = nominalRpm;
        geom.rpm = nominalRpm;
        validated.push({
          id: `imported-json-${Date.now()}-${validated.length}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          geom: resolveSolidity(geom),
        });
      }
    }
    return validated.length > 0 ? dedupeRotorNames(validated) : null;
  } catch (err) {
    console.error("Failed to parse rotor JSON:", err);
    return null;
  }
}

/**
 * Universal importer: accepts either APK database format (ROTORCALCULATOR_GEOMETRIES|2)
 * or JSON export format from web.
 */
export function importRotorsUniversal(content: string): StoredRotor[] | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const jsonRes = importRotorsJSON(trimmed);
    if (jsonRes && jsonRes.length > 0) return jsonRes;
  }

  return parseDatabaseText(trimmed);
}

export function resetToFactoryPresets(): StoredRotor[] {
  const rotors = loadStoredRotors();
  for (const preset of getFactoryPresets()) {
    const index = rotors.findIndex((rotor) => rotor.name.trim().toLowerCase() === preset.name.toLowerCase());
    if (index >= 0) {
      rotors[index] = { ...preset, id: rotors[index].id };
    } else {
      // A renamed preset is a custom rotor and keeps its identity.
      if (rotors.some((rotor) => rotor.id === preset.id)) preset.id = `restored-${preset.id}-${Date.now()}`;
      rotors.push(preset);
    }
  }
  saveStoredRotors(rotors);
  if (!rotors.some((rotor) => rotor.id === getActiveRotorId())) setActiveRotorId(rotors[0].id);
  return rotors;
}
