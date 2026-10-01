/**
 * Responsive label mapping conforming strictly to the B4A APK design system.
 * Source authority: RotorCalculator.b4a (InputDisplayLabel & ResultDisplayLabel)
 */

export function getResponsiveInputLabel(fullText: string, width: number): string {
  if (width <= 360) {
    switch (fullText) {
      case "Rotor Name": return "Name";
      case "Radius R": return "R";
      case "Blade Count": return "Nb";
      case "Root Cutout": return "r₀/R";
      case "Root Chord c0": return "Chord c₀";
      case "Tip Chord c1": return "Chord c₁";
      case "Reference Solidity":
      case "Ref. Solidity": return "Ref. Solidity";
      case "Aspect Ratio": return "AR";
      case "Root Pitch":
      case "Root Incidence": return "Root Pitch";
      case "Tip Pitch":
      case "Tip Incidence": return "Tip Pitch";
      case "Geometric Solidity":
      case "Geom. Solidity": return "Geom. Solidity";
      case "Thrust Solidity": return "Thrust Solidity";
      case "Disk Area": return "A";
      case "Reference Blade Area": return "Ab";
      case "Active Blade Area": return "Aact";
      case "Total Twist": return "Δθ";
      case "Taper Ratio": return "c₁/c₀";
      case "Lift Slope a0": return "a₀";
      case "Profile cd0":
      case "Profile Cd0": return "cd₀";
      case "Tip Factor B":
      case "Fixed Tip Factor B": return "Factor B";
      case "Altitude": return "Altitude";
      case "Temperature": return "Tamb";
      case "Trim Mode":
      case "Trim Condition": return "Trim Mode";
      case "Collective Δθ": return "Δθ";
      case "Target CT": return "Target CT";
      case "Target Thrust": return "Target T";
      case "Induced Factor kind":
      case "K_ind": return "kind";
      case "Inflow Model": return "Inflow";
      case "Compressibility": return "Comp.";
      case "Profile Drag": return "Drag";
      default: return fullText;
    }
  }
  if (width <= 430) {
    switch (fullText) {
      case "Rotor Name": return "Name";
      case "Blade Count": return "Blade Count Nb";
      case "Root Cutout": return "Cutout r₀/R";
      case "Root Chord c0": return "Root Chord c₀";
      case "Tip Chord c1": return "Tip Chord c₁";
      case "Reference Solidity":
      case "Ref. Solidity": return "Ref. Solidity";
      case "Aspect Ratio": return "AR";
      case "Root Pitch":
      case "Root Incidence": return "Root Pitch";
      case "Tip Pitch":
      case "Tip Incidence": return "Tip Pitch";
      case "Geometric Solidity":
      case "Geom. Solidity": return "Geom. Solidity";
      case "Thrust Solidity": return "Thrust Solidity";
      case "Reference Blade Area": return "Ref Blade Ab";
      case "Active Blade Area": return "Active Aact";
      case "Total Twist": return "Total Twist Δθ";
      case "Taper Ratio": return "Taper c₁/c₀";
      case "Lift Slope a0": return "Lift Slope a₀";
      case "Profile cd0":
      case "Profile Cd0": return "Profile cd₀";
      case "Tip Factor B":
      case "Fixed Tip Factor B": return "Tip Factor B";
      case "Temperature": return "Temperature";
      case "Trim Mode":
      case "Trim Condition": return "Trim Mode";
      case "Collective Δθ": return "Collective Δθ";
      case "Target CT": return "Target CT";
      case "Target Thrust": return "Target Thrust T";
      case "Induced Factor kind":
      case "K_ind": return "Induced kind";
      case "Inflow Model": return "Inflow";
      case "Compressibility": return "Compress.";
      default: return fullText;
    }
  }
  return fullText;
}

export function getResultDisplayLabel(canonical: string, width: number): string {
  if (width <= 360) {
    const cut = canonical.indexOf(" — ");
    if (cut > 0) return canonical.substring(0, cut);
    return canonical;
  }
  if (width <= 430) {
    switch (canonical) {
      case "μx — Advance Ratio": return "μx — Adv. Ratio";
      case "Pshaft — Shaft Power": return "Pshaft — Power";
      case "CT — Thrust Coeff": return "CT — Thrust";
      case "CQ — Torque Coeff": return "CQ — Torque";
      case "CQ,i — Induced Coeff": return "CQ,i — Induced";
      case "CQ,0 — Profile Coeff": return "CQ,0 — Profile";
      case "CH,i — Induced H": return "CH,i — Induced";
      case "CH,0 — Profile H": return "CH,0 — Profile";
      case "CP,air — Air Power":
      case "CP,air — Air Power Coeff": return "CP,air — Power";
      case "FM — Figure of Merit": return "FM — Merit";
      case "(L/D)eff — Effective L/D": return "(L/D)eff";
      case "Kx — Longitudinal Inflow": return "Kx — Long. Inflow";
      case "Ky — Lateral Inflow": return "Ky — Lat. Inflow";
      case "χ — Wake Skew Angle": return "χ — Wake Skew";
      case "RPM — Solved Speed": return "RPM — Solved";
      case "θ0 — Solved Collective": return "θ0 — Solved";
      case "Δθ — Collective Increment": return "Δθ — Collective";
      case "CT — Trimmed": return "CT — Trimmed";
      case "T — Trimmed Thrust": return "T — Trimmed";
      case "α — Angle of Attack": return "α — AoA";
      case "Mtip — Tip Mach": return "Mtip — Mach";
      case "Madv — Advancing Mach": return "Madv — Adv. Mach";
      case "h — Altitude": return "h — Altitude";
      case "Tamb — Temperature": return "Tamb — Temp.";
      default: return canonical;
    }
  }
  return canonical;
}
