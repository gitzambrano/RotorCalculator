import { resolveSolidity, type RotorGeometry } from "./engine";

export interface StoredRotor {
  id: string;
  name: string;
  geom: RotorGeometry;
}

const STORAGE_KEY = "rotorcalculator_rotors_v2";
const ACTIVE_ID_KEY = "rotorcalculator_active_rotor_id";

export function getFactoryPresets(): StoredRotor[] {
  return [
    {
      id: "preset-uh60",
      name: "Sikorsky UH-60 Black Hawk",
      geom: resolveSolidity({
        name: "Sikorsky UH-60 Black Hawk",
        rpm: 258.0,
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
        rpm: 395.0,
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
        usePrandtlGlauert: false,
      }),
    },
    {
      id: "preset-bo105",
      name: "Eurocopter Bo 105",
      geom: resolveSolidity({
        name: "Eurocopter Bo 105",
        rpm: 424.0,
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
        rpm: 400.0,
        radius: 5.03,
        liftSlope0: 5.73,
        rootCutout: 0.1,
        cd0: 0.009,
        solidityMode: "chords",
        sigmaRef: 0.0316,
        sigmaGeom: 0.028,
        sigmaThrust: 0.031,
        nBlades: 2,
        chordRoot: 0.25,
        chordTip: 0.25,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (10.0 * Math.PI) / 180.0,
        thetaTip: (4.0 * Math.PI) / 180.0,
        tipLossMode: "fixed",
        tipLossB: 0.97,
        usePrandtlGlauert: false,
      }),
    },
    {
      id: "preset-dji",
      name: "DJI Matrice 300 Drone",
      geom: resolveSolidity({
        name: "DJI Matrice 300 Drone",
        rpm: 2800.0,
        radius: 0.27,
        liftSlope0: 5.65,
        rootCutout: 0.1,
        cd0: 0.012,
        solidityMode: "chords",
        sigmaRef: 0.08,
        sigmaGeom: 0.072,
        sigmaThrust: 0.078,
        nBlades: 2,
        chordRoot: 0.0472,
        chordTip: 0.025,
        pitchMode: "linear_twist",
        theta0: 0.0,
        thetaRoot: (16.0 * Math.PI) / 180.0,
        thetaTip: (4.0 * Math.PI) / 180.0,
        tipLossMode: "none",
        tipLossB: 1.0,
        usePrandtlGlauert: false,
      }),
    },
    {
      id: "preset-evtol",
      name: "eVTOL Conceptual Rotor",
      geom: resolveSolidity({
        name: "eVTOL Conceptual Rotor",
        rpm: 1200.0,
        radius: 1.4,
        liftSlope0: 5.85,
        rootCutout: 0.15,
        cd0: 0.0095,
        solidityMode: "chords",
        sigmaRef: 0.13,
        sigmaGeom: 0.11,
        sigmaThrust: 0.125,
        nBlades: 5,
        chordRoot: 0.1488,
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

export function loadStoredRotors(): StoredRotor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const presets = getFactoryPresets();
      saveStoredRotors(presets);
      return presets;
    }
    const parsed = JSON.parse(raw) as StoredRotor[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        ...item,
        geom: resolveSolidity(item.geom),
      }));
    }
  } catch (err) {
    console.warn("Failed to load rotors from storage, using presets:", err);
  }
  const presets = getFactoryPresets();
  saveStoredRotors(presets);
  return presets;
}

export function saveStoredRotors(rotors: StoredRotor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rotors));
  } catch (err) {
    console.error("Failed to save rotors to localStorage:", err);
  }
}

export function getActiveRotorId(): string {
  return localStorage.getItem(ACTIVE_ID_KEY) || "preset-uh60";
}

export function setActiveRotorId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
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

export function importRotorsJSON(jsonStr: string): StoredRotor[] | null {
  try {
    const data = JSON.parse(jsonStr);
    const list = Array.isArray(data) ? data : data.rotors;
    if (!Array.isArray(list) || list.length === 0) return null;

    const validated: StoredRotor[] = [];
    for (const item of list) {
      if (item && item.name && item.geom) {
        validated.push({
          id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: String(item.name).trim(),
          geom: resolveSolidity(item.geom),
        });
      }
    }
    return validated.length > 0 ? validated : null;
  } catch (err) {
    console.error("Failed to parse rotor JSON:", err);
    return null;
  }
}

export function resetToFactoryPresets(): StoredRotor[] {
  const presets = getFactoryPresets();
  saveStoredRotors(presets);
  setActiveRotorId(presets[0].id);
  return presets;
}
