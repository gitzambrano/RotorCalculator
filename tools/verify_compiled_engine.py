"""Run the locally compiled B4A engine class against the 100-point reference.

Requires a completed local B4A build, JDK 19 and the configured Android SDK.
The only JVM shim is Android Handler's unused constructor: the pure engine
does not schedule Android work. All engine bytecode and B4A math remain intact.
This gate complements Android APK interactions; it does not replace them.
"""
from __future__ import annotations

import os
import math
from pathlib import Path
import subprocess
import tempfile

import zBET
from verify_engine import ROOT, make_geometry

JAVA = Path(os.environ.get("JAVA_HOME", "C:/java/jdk-19.0.2")) / "bin"
LIB = Path(os.environ.get("B4A_LIBRARIES", "C:/Program Files/Anywhere Software/B4A/Libraries"))
ANDROID = Path(os.environ.get("B4A_ANDROID_JAR", "C:/Android/platforms/android-36/android.jar"))
FIELDS = {"CT": "CT", "CQ": "CQ", "CQi": "CQi", "CQ0": "CQ0", "CH": "CH", "CHi": "CHi", "CH0": "CH0", "CY": "CY", "CMx": "CMx", "CMy": "CMy", "CPair": "CPair", "InflowLambda": "lambda", "InflowLambdaI": "lambda_i", "FoM": "FoM"}


def main() -> None:
    classes = ROOT / "Objects/bin/classes"
    if not (classes / "flightdyn/rotorcalculator/zbetengine.class").exists():
        raise SystemExit("Compile RotorCalculator locally with B4A first")
    with tempfile.TemporaryDirectory(prefix="rotor-compiled-engine-") as temporary:
        work = Path(temporary)
        shim = work / "android/os/Handler.java"
        shim.parent.mkdir(parents=True)
        shim.write_text("package android.os; public class Handler { public Handler() {} }", encoding="utf-8")
        probe = work / "EngineMatrix.java"
        probe.write_text('''import flightdyn.rotorcalculator.zbetengine;
public class EngineMatrix {
 public static void main(String[] args) throws Exception {
  String[] models={"uniform","coleman_simple","coleman_feingold","drees"};
  double[] mus={0,.05,.15,.25,.35}, zs={-.02,-.01,0,.01,.02};
  for(double mu:mus) for(double z:zs) for(String model:models) {
   var g=zbetengine._createdefaultgeometry(null);
   g.RPM=430; g.Radius=5; g.SolidityMode="chords"; g.ChordRoot=.30; g.ChordTip=.22;
   g.PitchMode="linear_twist"; g.ThetaTip=2*Math.PI/180; g.TipLossMode="fixed";
   g=zbetengine._resolvesolidity(null,g);
   var c=zbetengine._createdefaultcondition(null);
   c.OperatingPair="rpm_collective"; c.RPM=430; c.CollectiveDeg=4;
   c.HorizontalMode="mu"; c.HorizontalValue=mu; c.AxialMode="muz"; c.AxialValue=z;
   c.InflowModel=model;
   var r=zbetengine._calculate(null,g,c);
   System.out.print("CASE,"+mu+","+z+","+model);
   for(String name:args) System.out.print(","+r.getClass().getField(name).getDouble(r));
   System.out.println();
  }
  String[] pairs={"rpm_collective","rpm_ct","rpm_thrust","collective_ct","collective_thrust","ct_thrust"};
  for(double[] flow:new double[][]{{0,0},{.15,0},{.15,.01}}) {
   var g=zbetengine._createdefaultgeometry(null);
   g.RPM=430; g.Radius=5; g.SolidityMode="chords"; g.ChordRoot=.30; g.ChordTip=.22;
   g.PitchMode="linear_twist"; g.ThetaTip=2*Math.PI/180; g.TipLossMode="fixed"; g.UsePrandtlGlauert=true;
   g=zbetengine._resolvesolidity(null,g);
   var c=zbetengine._createdefaultcondition(null);
   c.OperatingPair="rpm_collective"; c.RPM=430; c.CollectiveDeg=4;
   c.HorizontalMode="mu"; c.HorizontalValue=flow[0]; c.AxialMode="muz"; c.AxialValue=flow[1];
   var baseline=zbetengine._calculate(null,g,c);
   for(String pair:pairs) {
    c.OperatingPair=pair; c.TargetCT=baseline.CT; c.TargetThrustN=baseline.ThrustN;
    var r=zbetengine._calculate(null,g,c);
    if(!r.SolutionValid) throw new AssertionError(pair+": "+r.StatusMessage);
    System.out.print("PAIR,"+flow[0]+","+flow[1]+","+pair);
    for(String name:args) System.out.print(","+r.getClass().getField(name).getDouble(r));
    System.out.println(","+r.TrimmedRPM+","+r.TrimmedCollectiveDeg);
   }
  }
  var dg=zbetengine._createdefaultgeometry(null);
  var dc=zbetengine._createdefaultcondition(null);
  var dr=zbetengine._calculate(null,dg,dc);
  System.out.println("TARGET,"+dr.SolutionValid+","+dc.TargetCT+","+dr.CT);
 }
}''', encoding="utf-8")
        cp = os.pathsep.join(map(str, (work, classes, LIB / "Core.jar", LIB / "B4AShared.jar", ANDROID)))
        subprocess.run([str(JAVA / "javac.exe"), "-cp", cp, "-d", str(work), str(shim), str(probe)], check=True)
        result = subprocess.run([str(JAVA / "java.exe"), "-cp", cp, "EngineMatrix", *FIELDS], check=True, capture_output=True, text=True)
    geometry = make_geometry(pg=False, tip_loss="fixed")
    pitch = zBET._operating_pitch(geometry, 12.0, 2.0, 4.0)
    count = 0
    pairs = 0
    largest = 0.0
    for line in result.stdout.splitlines():
        if line.startswith("TARGET,"):
            _, valid, target, actual = line.split(",")
            if valid != "true" or abs(float(actual) - float(target)) > 2e-9:
                raise AssertionError(f"Default RPM + CT trim did not meet target: {line}")
            continue
        if line.startswith("PAIR,"):
            _, mu, z, pair, *values = line.split(",")
            geom_pg = make_geometry(pg=True, tip_loss="fixed")
            pitch_pg = zBET._operating_pitch(geom_pg, 12.0, 2.0, 4.0)
            baseline = zBET.coefficients(mu=float(mu), mu_z=float(z), pitch_input=pitch_pg, geometry=geom_pg, model="coleman_feingold", profile_drag_model="numerical_vectorial", induced_torque_model="energy_balance", k_ind=1.15)
            solved = zBET.solve_operating_pair(geom_pg, pair=pair, rpm=430.0, collective_deg=4.0, target_ct=baseline["CT"], target_thrust_n=baseline["T_N"], theta_root_deg=12.0, theta_tip_deg=2.0, horizontal_mode="mu", horizontal_value=float(mu), axial_mode="muz", axial_value=float(z), inflow_model="coleman_feingold", k_ind=1.15)
            for field, raw in zip(FIELDS.values(), values[:len(FIELDS)], strict=True):
                if not math.isclose(float(raw), solved["results"][field], rel_tol=3e-6, abs_tol=2e-8):
                    raise AssertionError(f"Compiled {pair} at {mu}/{z}: {field}={raw}, Python={solved['results'][field]}")
            if not math.isclose(float(values[-2]), solved["rpm"], rel_tol=2e-4, abs_tol=.1):
                raise AssertionError(f"Compiled {pair} RPM mismatch")
            if abs(float(values[-1]) - solved["collective_deg"]) > 2e-4:
                raise AssertionError(f"Compiled {pair} collective mismatch")
            pairs += 1
            continue
        if not line.startswith("CASE,"):
            continue
        _, mu, z, model, *values = line.split(",")
        expected = zBET.coefficients(mu=float(mu), mu_z=float(z), pitch_input=pitch, geometry=geometry, model=model, profile_drag_model="numerical_vectorial", induced_torque_model="energy_balance", k_ind=1.15)
        for field, raw in zip(FIELDS.values(), values, strict=True):
            actual, reference = float(raw), expected[field]
            error = abs(actual - reference)
            largest = max(largest, error)
            tolerance = 2e-9 + 2e-7 * abs(reference)
            if error > tolerance:
                raise AssertionError(f"{mu}/{z}/{model} {field}: B4A={actual} Python={reference} error={error} tolerance={tolerance}")
        count += 1
    if count != 100:
        raise AssertionError(f"Expected 100 compiled-engine cases, received {count}")
    print(f"PASS: locally compiled B4A engine vs Python: {count}/100, 14 outputs per case; maximum absolute error {largest:.3e}")
    if pairs != 18:
        raise AssertionError(f"Expected 18 compiled operating-pair cases, received {pairs}")
    print("PASS: all six compiled operating pairs in hover, forward flight and axial flow; default CT trim meets its target")


if __name__ == "__main__":
    main()
