import { describe, expect, it } from "vitest";
import { createDefaultCondition, createDefaultGeometry } from "./engine";
import {
  buildSweepTableRows,
  generateSweepCSV,
  runParameterSweep,
  SWEEP_PARAMS,
  SWEEP_TRIM_MODES,
} from "./sweep";

describe("Sweep Engine & Output Parity", () => {
  const geom = createDefaultGeometry();
  const cond = createDefaultCondition();

  it("defines all 5 canonical sweep trim modes matching RotorPopups.bas", () => {
    expect(SWEEP_TRIM_MODES).toHaveLength(5);
    const keys = SWEEP_TRIM_MODES.map((m) => m.key);
    expect(keys).toEqual(["none", "coll_all", "rpm_all", "coll_hover", "rpm_hover"]);
  });

  it("uses en-dash (–) for dimensionless units across all parameters", () => {
    SWEEP_PARAMS.forEach((param) => {
      expect(param.unit).not.toBe("[-]");
      expect(param.unit).not.toBe("—");
      if (["CT", "CTs", "CP", "CQi", "CQ0", "CH", "CHi", "CH0", "CY", "CMx", "CMy", "CPair", "lambda", "lambda_i", "L_D_eff", "FoM", "Kx", "Ky", "Mat", "B", "Mu", "MuZ"].includes(param.key)) {
        expect(param.unit).toBe("–");
      }
    });
  });

  it("runs parameter sweep under all 5 trim modes without crashing", () => {
    for (const mode of SWEEP_TRIM_MODES) {
      const res = runParameterSweep(geom, cond, "CT", 0, 0.4, 10, undefined, mode.key);
      expect(res.curves).toHaveLength(1);
      expect(res.curves[0].points).toHaveLength(10);
      expect(res.curves[0].points[0].valid).toBe(true);
    }
  });

  it("builds wide table rows with curve columns and sticky headers", () => {
    const sweep = runParameterSweep(geom, cond, "PowerKW", 0, 0.4, 5, undefined, "none");
    const rows = buildSweepTableRows(sweep.curves, sweep.paramMeta, "mu", 0, false);
    expect(rows.length).toBe(6); // 1 header + 5 points
    expect(rows[0][0]).toBe("μ_x [–]");
    expect(rows[0].length).toBe(1 + sweep.curves.length); // mu + curves
    expect(rows[1][0]).toBe("0.000");
  });

  it("generates CSV matching B4A BuildSweepTableRows forCsv mode", () => {
    const sweep = runParameterSweep(geom, cond, "CT", 0, 0.4, 5, undefined, "coll_all");
    const csv = generateSweepCSV(sweep.curves, sweep.paramMeta, "mu", "coll_all");
    expect(csv).toContain("# RotorCalculator Parameter Sweep");
    expect(csv).toContain("mu [-]");
    expect(csv).toContain("C_T [–]");
  });
});
