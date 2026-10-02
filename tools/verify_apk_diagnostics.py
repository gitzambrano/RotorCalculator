from pathlib import Path
import subprocess, tempfile, os
r=Path(__file__).resolve().parent.parent
java=Path('C:/java/jdk-19.0.2/bin')
source='''import flightdyn.rotorcalculator.zbetengine;
public class DiagnosticProbe {
static void close(double got,double wanted) {if(!Double.isFinite(got)||Math.abs(got-wanted)>1e-10)throw new AssertionError(got+" != "+wanted);}
public static void main(String[] args)throws Exception{
int count=0;
for(String model:new String[]{"uniform","coleman_simple","coleman_feingold","drees"})for(double mu:new double[]{0,.05,.15,.25,.35})for(double z:new double[]{-.02,-.01,0,.01,.02}){
var g=zbetengine._createdefaultgeometry(null);g.TipLossMode="fixed";g.TipLossB=.97;
var c=zbetengine._createdefaultcondition(null);c.OperatingPair="rpm_collective";c.RPM=430;c.CollectiveDeg=4;c.HorizontalMode="mu";c.HorizontalValue=mu;c.AxialMode="muz";c.AxialValue=z;c.InflowModel=model;
var out=zbetengine._calculate(null,g,c);if(!out.SolutionValid)throw new AssertionError(out.StatusMessage);
close(zbetengine._derivedoutput(null,out,"Vztot"),out.OperatingVz+out.InflowLambdaI*out.TipSpeed);
close(zbetengine._derivedoutput(null,out,"Vadv"),out.TipSpeed+out.OperatingVx);
close(zbetengine._derivedoutput(null,out,"Vret"),out.TipSpeed-out.OperatingVx);
close(zbetengine._derivedoutput(null,out,"Mret"),Math.abs(out.TipSpeed-out.OperatingVx)/out.SpeedOfSound);
double pitch=(g.ThetaRoot+(g.ThetaTip-g.ThetaRoot)*(.75-g.RootCutout)/(1-g.RootCutout))*180/Math.PI+out.TrimmedCollectiveDeg;
double adv=Math.atan2(out.InflowLambda+.75*out.InflowKy*out.InflowLambdaI,.75+out.OperatingMu)*180/Math.PI;
double ret=Math.atan2(out.InflowLambda-.75*out.InflowKy*out.InflowLambdaI,.75-out.OperatingMu)*180/Math.PI;
close(out.PhiAdv75,adv);close(out.PhiRet75,ret);close(out.AoAAdv75,pitch-adv);close(out.AoARet75,pitch-ret);
if(mu==0)close(out.AdvancingTipMach,out.TipSpeed/out.SpeedOfSound);
if(mu>0&&out.AdvancingTipMach==out.TipSpeed/out.SpeedOfSound)throw new AssertionError("Tip Mach unexpectedly equals advancing Mach");
count++;
}
var g=zbetengine._createdefaultgeometry(null);g.RootCutout=.8;var c=zbetengine._createdefaultcondition(null);c.OperatingPair="rpm_collective";c.CollectiveDeg=8;
var invalid=zbetengine._calculate(null,g,c);if(!Double.isNaN(invalid.PhiAdv75))throw new AssertionError("Inactive station not suppressed");
g.RootCutout=.15;g.TipLossMode="fixed";g.TipLossB=.7;invalid=zbetengine._calculate(null,g,c);if(!Double.isNaN(invalid.PhiRet75))throw new AssertionError("Tip-loss station not suppressed");
System.out.println("PASS: "+count+" compiled diagnostic cases; 1e-10 identity tolerance; inactive stations suppressed");
}}
'''
with tempfile.TemporaryDirectory(prefix='rotor-diagnostics-') as tmp:
    w=Path(tmp);(w/'android/os').mkdir(parents=True)
    (w/'android/os/Handler.java').write_text('package android.os; public class Handler { public Handler() {} }')
    (w/'DiagnosticProbe.java').write_text(source)
    cp=os.pathsep.join(map(str,[w,r/'Objects/bin/classes',Path('C:/Program Files/Anywhere Software/B4A/Libraries/Core.jar'),Path('C:/Program Files/Anywhere Software/B4A/Libraries/B4AShared.jar'),Path('C:/Android/platforms/android-36/android.jar')]))
    subprocess.run([str(java/'javac.exe'),'-cp',cp,'-d',str(w),str(w/'android/os/Handler.java'),str(w/'DiagnosticProbe.java')],check=True)
    subprocess.run([str(java/'java.exe'),'-cp',cp,'DiagnosticProbe'],check=True)
