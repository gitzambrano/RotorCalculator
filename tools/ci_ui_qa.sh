#!/usr/bin/env bash
set -euo pipefail
export PYTHONIOENCODING=utf-8

APK="${1:-${APK:-ci-apk/RotorCalculator-ci.apk}}"
command -v adb >/dev/null
command -v python3 >/dev/null
test -f "$APK"
mkdir -p qa-results

cat > /tmp/ui_node.py <<'PY'
import subprocess, sys, xml.etree.ElementTree as ET, re, json, os, time
out = sys.argv[1]
remote=f"/sdcard/rotor-ui-{os.getpid()}.xml"
for attempt in range(4):
    subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
    dump=subprocess.run(["adb","shell","uiautomator","dump",remote],capture_output=True,text=True)
    pull=subprocess.run(["adb","pull",remote,out],capture_output=True,text=True)
    if pull.returncode == 0: break
    time.sleep(0.4)
else:
    raise SystemExit("Unable to obtain a fresh Android UI hierarchy: "+dump.stderr.strip())
subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
root = ET.parse(out).getroot()
ET.ElementTree(root).write("/tmp/rotor-last-ui.xml",encoding="utf-8")
def bounds(s):
    m=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",s or "")
    return tuple(map(int,m.groups())) if m else None
nodes=[]
for n in root.iter("node"):
    text=(n.attrib.get("text") or "").strip()
    desc=(n.attrib.get("content-desc") or "").strip()
    if text or desc:
        nodes.append({
          "text":text, "desc":desc, "bounds":bounds(n.attrib.get("bounds")),
          "clickable":n.attrib.get("clickable"), "enabled":n.attrib.get("enabled")
        })
print(json.dumps(nodes,ensure_ascii=False,indent=2))
PY

cat > /tmp/tap_text.py <<'PY'
import subprocess, sys, xml.etree.ElementTree as ET, re, tempfile, os, time
needle=sys.argv[1].strip().lower()
xml=tempfile.NamedTemporaryFile(delete=False,suffix=".xml").name
remote=f"/sdcard/rotor-ui-{os.getpid()}.xml"
for attempt in range(4):
    subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
    dump=subprocess.run(["adb","shell","uiautomator","dump",remote],capture_output=True,text=True)
    pull=subprocess.run(["adb","pull",remote,xml],capture_output=True,text=True)
    if pull.returncode == 0: break
    time.sleep(0.4)
else:
    raise SystemExit("Unable to obtain a fresh Android UI hierarchy: "+dump.stderr.strip())
subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
root=ET.parse(xml).getroot()
ET.ElementTree(root).write("/tmp/rotor-last-ui.xml",encoding="utf-8")
candidates=[]
for order,n in enumerate(root.iter("node")):
    text=(n.attrib.get("text") or "").strip()
    desc=(n.attrib.get("content-desc") or "").strip()
    values=[v for v in (text,desc) if v]
    if not values:
        continue
    m=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",n.attrib.get("bounds",""))
    if not m:
        continue
    x1,y1,x2,y2=map(int,m.groups())
    if x2<=x1 or y2<=y1:
        continue
    exact=any(v.lower()==needle for v in values)
    partial=any(needle in v.lower() for v in values)
    if not partial:
        continue
    clickable=n.attrib.get("clickable","false")=="true"
    enabled=n.attrib.get("enabled","true")!="false"
    if not enabled:
        continue
    priority=(0 if exact and clickable else 1 if exact else 2 if clickable else 3)
    candidates.append((priority,order,x1,y1,x2,y2,text,desc))
if candidates:
    candidates.sort(key=lambda c:(c[0],c[1]))
    _,_,x1,y1,x2,y2,_,_=candidates[0]
    subprocess.run(["adb","shell","input","tap",str((x1+x2)//2),str((y1+y2)//2)],check=True)
    sys.exit(0)
print("NOT_FOUND",sys.argv[1]); sys.exit(2)
PY

cat > /tmp/set_first_edit_text.py <<'PY'
import subprocess, sys, xml.etree.ElementTree as ET, re, tempfile, os, time, time
value=sys.argv[1]
xml=tempfile.NamedTemporaryFile(delete=False,suffix='.xml').name
subprocess.run(['adb','shell','uiautomator','dump','/sdcard/window.xml'],check=False,stdout=subprocess.DEVNULL)
subprocess.run(['adb','pull','/sdcard/window.xml',xml],check=True,stdout=subprocess.DEVNULL)
root=ET.parse(xml).getroot()
ET.ElementTree(root).write("/tmp/rotor-last-ui.xml",encoding="utf-8")
target=None
for n in root.iter('node'):
    if n.attrib.get('class')!='android.widget.EditText' or n.attrib.get('enabled','true')=='false':
        continue
    m=re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',n.attrib.get('bounds',''))
    if m:
        target=tuple(map(int,m.groups())); break
if not target:
    raise SystemExit('No enabled EditText found')
x1,y1,x2,y2=target
subprocess.run(['adb','shell','input','tap',str((x1+x2)//2),str((y1+y2)//2)],check=True)
time.sleep(.15)
subprocess.run(['adb','shell','input','keyevent','123'],check=True)
subprocess.run(['adb','shell','input','keyevent'] + ['67'] * 96,check=True,stdout=subprocess.DEVNULL)
subprocess.run(['adb','shell','input','text',value],check=True)
PY

cat > /tmp/extract_edit_values.py <<'PY'
import subprocess, sys, xml.etree.ElementTree as ET, tempfile
out=sys.argv[1]
xml=tempfile.NamedTemporaryFile(delete=False,suffix='.xml').name
subprocess.run(['adb','shell','uiautomator','dump','/sdcard/window.xml'],check=False,stdout=subprocess.DEVNULL)
subprocess.run(['adb','pull','/sdcard/window.xml',xml],check=True,stdout=subprocess.DEVNULL)
root=ET.parse(xml).getroot()
ET.ElementTree(root).write("/tmp/rotor-last-ui.xml",encoding="utf-8")
vals=[]
for n in root.iter('node'):
    if n.attrib.get('class')=='android.widget.EditText' and n.attrib.get('enabled','true')!='false':
        vals.append(n.attrib.get('text',''))
open(out,'w',encoding='utf-8').write('\n'.join(vals)+'\n')
print('EditText values:', vals)
PY
cat > /tmp/check_bounds.py <<'PY'
import sys, json, glob, os, struct
png=sys.argv[1]
with open(png,"rb") as fh:
    header=fh.read(24)
if header[:8] != b"\x89PNG\r\n\x1a\n":
    raise SystemExit("Invalid PNG: "+png)
w,h=struct.unpack(">II",header[16:24])
issues=[]
snapshot_names=("01-geometry-editor-top.json","02-geometry-derived.json",
                "03-geometry-editor-bottom.json","03b-geometry-aero-fields.json",
                "03-conditions-top.json","04-conditions-bottom.json",
                "05-results-top.json","10-sweep.json")
for name in snapshot_names:
    jf=os.path.join(sys.argv[2],name)
    if not os.path.exists(jf): continue
    for n in json.load(open(jf,encoding="utf-8")):
        b=n.get("bounds")
        if not b: continue
        x1,y1,x2,y2=b
        if x1<0 or y1<0 or x2>w or y2>h or x2<=x1 or y2<=y1:
            issues.append({"file":os.path.basename(jf),"text":n.get("text"),"bounds":b})
json.dump(issues,open(os.path.join(sys.argv[2],"bounds-issues.json"),"w"),ensure_ascii=False,indent=2)
print("bounds issues:",len(issues))
if issues:
    print(json.dumps(issues[:30],ensure_ascii=False))
    sys.exit(1)
PY

adb install -r "$APK"
# Deterministic local QA: never inherit theme/unit/precision or rotor data from an older install.
adb shell pm clear flightdyn.rotorcalculator >/dev/null

cat > /tmp/check_ui_png.py <<'PY'
import sys,struct,zlib,math
p=sys.argv[1]
d=open(p,'rb').read()
if d[:8] != b"\x89PNG\r\n\x1a\n":
    raise SystemExit(2)
pos=8; w=h=ctype=None; ids=[]
while pos < len(d):
    n=struct.unpack(">I",d[pos:pos+4])[0]; typ=d[pos+4:pos+8]; payload=d[pos+8:pos+8+n]; pos += 12+n
    if typ==b'IHDR':
        w,h,depth,ctype,comp,filt,inter=struct.unpack(">IIBBBBB",payload)
        if depth!=8 or inter!=0 or ctype not in (2,6): raise SystemExit(2)
    elif typ==b'IDAT': ids.append(payload)
    elif typ==b'IEND': break
bpp=4 if ctype==6 else 3
raw=zlib.decompress(b''.join(ids)); stride=w*bpp
prev=bytearray(stride); vals=[]; off=0
def paeth(a,b,c):
    p=a+b-c; pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
    return a if pa<=pb and pa<=pc else (b if pb<=pc else c)
for y in range(h):
    f=raw[off]; off+=1; row=bytearray(raw[off:off+stride]); off+=stride
    for i in range(stride):
        a=row[i-bpp] if i>=bpp else 0; b=prev[i]; c=prev[i-bpp] if i>=bpp else 0
        if f==1: row[i]=(row[i]+a)&255
        elif f==2: row[i]=(row[i]+b)&255
        elif f==3: row[i]=(row[i]+((a+b)//2))&255
        elif f==4: row[i]=(row[i]+paeth(a,b,c))&255
    if y % max(1,h//40)==0:
        for x in range(0,w,max(1,w//60)):
            i=x*bpp
            vals.append((row[i]+row[i+1]+row[i+2])/3)
    prev=row
mean=sum(vals)/len(vals)
var=sum((v-mean)**2 for v in vals)/len(vals)
std=math.sqrt(var)
print(f"frame mean={mean:.1f} std={std:.1f}")
if mean < 4 or mean > 252 or std < 6:
    raise SystemExit(1)
PY

safe_screencap() {
  local OUTFILE="$1"
  local attempt size
  for attempt in 1 2 3; do
    adb exec-out screencap -p > "$OUTFILE"
    size=$(stat -c%s "$OUTFILE")
    if [ "$size" -gt 8000 ] && python3 /tmp/check_ui_png.py "$OUTFILE"; then return 0; fi
    echo "Suspicious screenshot ($size bytes), retrying: $OUTFILE" >&2
    sleep 1
  done
  echo "Invalid/corrupted screenshot after retries: $OUTFILE" >&2
  return 1
}

assert_app_alive() {
  if ! adb shell pidof flightdyn.rotorcalculator >/dev/null; then
    echo "RotorCalculator process is not alive" >&2
    adb logcat -d -t 250 | grep -E "FATAL EXCEPTION|flightdyn.rotorcalculator|AndroidRuntime" | tail -120 >&2 || true
    return 1
  fi
}

wait_geometry_ready() {
  local OUTDIR="$1" W="$2" H="$3" attempt
  for attempt in $(seq 1 20); do
    python3 /tmp/ui_node.py "$OUTDIR/ready-$attempt.xml" > "$OUTDIR/ready-$attempt.json"
    if grep -Fqi '"text": "BLADE GEOMETRY"' "$OUTDIR/ready-$attempt.json"; then return 0; fi
    # A prior Activity can restore Geometry's scroll offset after relaunch.
    # Return toward the start of the form, checking the heading each step.
    if grep -Fqi '"text": "ACTIVE ROTOR' "$OUTDIR/ready-$attempt.json"; then
    python3 /tmp/scroll_step.py "$W" "$H" up
    fi
    sleep 0.3
  done
  echo "Geometry editor did not become ready" >&2
  return 1
}

assert_document_picker() {
  local OUTDIR="$1"
  local STEM="$2"
  local EXPECTED="$3"
  sleep 0.7
  adb shell dumpsys window windows | grep -qi "documentsui"
  safe_screencap "$OUTDIR/$STEM.png"
  python3 /tmp/ui_node.py "$OUTDIR/$STEM.xml" > "$OUTDIR/$STEM.json"
  if [ -n "$EXPECTED" ]; then
    grep -Fqi "$EXPECTED" "$OUTDIR/$STEM.json"
  fi
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive
}

wait_for_app_foreground() {
  local attempt
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if adb shell dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" | grep -q "flightdyn.rotorcalculator"; then
      return 0
    fi
    sleep 0.35
  done
  echo "RotorCalculator did not regain foreground focus" >&2
  return 1
}

navigate_documents_downloads() {
  if python3 /tmp/tap_text.py "Show roots" >/dev/null 2>&1; then
    sleep 0.3
    tap_text_scrolling "Downloads" 393 873
    sleep 0.5
  fi
}

save_document_picker() {
  local OUTDIR="$1"
  local STEM="$2"
  local EXPECTED="$3"
  sleep 0.7
  adb shell dumpsys window windows | grep -qi "documentsui"
  navigate_documents_downloads
  safe_screencap "$OUTDIR/$STEM.png"
  python3 /tmp/ui_node.py "$OUTDIR/$STEM.xml" > "$OUTDIR/$STEM.json"
  grep -Fqi "$EXPECTED" "$OUTDIR/$STEM.json"
  python3 /tmp/tap_text.py "SAVE"
  sleep 0.7
  if adb shell dumpsys window windows | grep -qi "documentsui"; then
    python3 /tmp/tap_text.py "REPLACE" >/dev/null 2>&1 || true
  fi
  wait_for_app_foreground
  assert_app_alive
}

open_document_picker_file() {
  local FILENAME="$1"
  sleep 0.7
  adb shell dumpsys window windows | grep -qi "documentsui"
  navigate_documents_downloads
  tap_text_scrolling "$FILENAME" 393 873
  wait_for_app_foreground
  assert_app_alive
}

cat > /tmp/scroll_step.py <<'PY'
import re,subprocess,sys,xml.etree.ElementTree as ET
w,h=map(int,sys.argv[1:3]); direction=sys.argv[3]
views=[]
for n in ET.parse('/tmp/rotor-last-ui.xml').iter('node'):
    if n.get('class') in ('android.widget.ScrollView','android.widget.ListView'):
        b=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
        if len(b)==4 and b[3]>b[1]+50: views.append(b)
x1,y1,x2,y2=max(views,key=lambda b:(b[2]-b[0])*(b[3]-b[1])) if views else (0,int(h*.3),w,int(h*.9))
x=x1+max(0,(x2-x1-620)//2)+5
step=max(48,(y2-y1)//3)
start=y2-20; end=max(y1+20,start-step)
if direction=='up': start,end=end,start
subprocess.run(['adb','shell','input','swipe',str(x),str(start),str(x),str(end),'450'],check=True)
PY

tap_text_scrolling() {
  local TEXT="$1"
  local W="$2"
  local H="$3"
  local DIRECTION="${4:-down}"
  local attempt
  # Inspect each viewport before moving. A short, slow swipe avoids jumping
  # over a one-line target such as the Rotor Aerodynamics heading.
  for attempt in $(seq 0 80); do
    if python3 /tmp/tap_text.py "$TEXT"; then return 0; fi
    if (( attempt == 80 )); then break; fi
    python3 /tmp/scroll_step.py "$W" "$H" "$DIRECTION"
    sleep 0.12
  done
  echo "Could not find text after scrolling: $TEXT" >&2
  return 1
}

scroll_to_top() {
  local W="$1"
  local H="$2"
  local attempt
  # Results is several viewports tall in landscape. Verify its top action
  # instead of assuming a fixed swipe count is sufficient.
  for attempt in $(seq 0 32); do
    python3 /tmp/ui_node.py /tmp/results-top-check.xml > /tmp/results-top-check.json
    if grep -Fqi 'OPEN PARAMETER SWEEP' /tmp/results-top-check.json; then return 0; fi
    if (( attempt == 32 )); then break; fi
    python3 /tmp/scroll_step.py "$W" "$H" up
    sleep 0.12
  done
  echo "Could not return to Results top" >&2
  return 1
}

assert_text_scrolling_down() {
  local OUTDIR="$1"
  local TEXT="$2"
  local W="$3"
  local H="$4"
  local STEM="$5"
  local attempt
  # Each iteration dumps before moving. The 10%-viewport drag and long gesture
  # duration avoid fling, so even a short heading cannot be passed between dumps.
  # 80 steps cover at least eight full viewports on the smallest profile.
  for attempt in $(seq 0 80); do
    python3 /tmp/ui_node.py "$OUTDIR/$STEM-$attempt.xml" > "$OUTDIR/$STEM-$attempt.json"
    if grep -Fqi "$TEXT" "$OUTDIR/$STEM-$attempt.json"; then
      echo "Verified after scrolling: $TEXT"
      return 0
    fi
    if (( attempt == 80 )); then break; fi
    python3 /tmp/scroll_step.py "$W" "$H" down
    sleep 0.12
  done
  echo "Could not verify text after incremental scrolling: $TEXT" >&2
  return 1
}

capture_screen() {
  local NAME="$1" SIZE="$2" ROT="$3" FONT="$4"
  local OUT="qa-results/${QA_THEME:-dark}/$NAME"
  mkdir -p "$OUT"
  local W="${SIZE%x*}"
  local H="${SIZE#*x}"
  local ROTOR_LABEL="Sikorsky UH-60 Black Hawk"
  local SOLVED_RPM_LABEL="RPM — Solved Speed"
  local SOUND_SPEED_LABEL="a — Speed of Sound"
  if (( W <= 360 )); then
    SOLVED_RPM_LABEL='"text": "RPM"'
    SOUND_SPEED_LABEL='"text": "a"'
  elif (( W <= 430 )); then
    SOLVED_RPM_LABEL="RPM — Solved"
  fi
  if [ "$W" -le 430 ]; then ROTOR_LABEL="UH-60"; fi

  adb shell wm size "$SIZE"
  adb shell wm density 160
  adb shell settings put system font_scale "$FONT"
  adb shell settings put system accelerometer_rotation 0
  adb shell settings put system user_rotation "$ROT"
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 2
  assert_app_alive
  wait_geometry_ready "$OUT" "$W" "$H"

  if [[ "${QA_THEME:-dark}" == light && "${QA_LIGHT_INITIALIZED:-0}" == 0 ]]; then
    adb shell input tap $((W-24)) 52
    python3 /tmp/tap_text.py "Settings"
    python3 /tmp/tap_text.py "DARK"
    sleep 0.8
    QA_LIGHT_INITIALIZED=1
    wait_geometry_ready "$OUT" "$W" "$H"
  fi

  # Geometry opens directly in the editor; the active rotor is selected from the fixed top bar.
  safe_screencap "$OUT/01-geometry-editor-top.png"
  python3 /tmp/ui_node.py "$OUT/01-geometry-editor-top.xml" > "$OUT/01-geometry-editor-top.json"
  grep -qi "ACTIVE ROTOR" "$OUT/01-geometry-editor-top.json"
  grep -Fqi "$ROTOR_LABEL" "$OUT/01-geometry-editor-top.json"
  grep -qi "BLADE GEOMETRY" "$OUT/01-geometry-editor-top.json"
  grep -qi "SAVE" "$OUT/01-geometry-editor-top.json"
  grep -qi "COPY" "$OUT/01-geometry-editor-top.json"
  grep -qi "DELETE" "$OUT/01-geometry-editor-top.json"

  assert_text_scrolling_down "$OUT" "DERIVED GEOMETRY" "$W" "$H" "02-geometry-derived"
  adb shell input swipe $(((W>620?(W-620)/2:0)+5)) $((H*3/4)) $(((W>620?(W-620)/2:0)+5)) $((H/2)) 450
  sleep 0.2
  safe_screencap "$OUT/02-geometry-derived.png"
  assert_text_scrolling_down "$OUT" "ROTOR AERODYNAMICS" "$W" "$H" "02-geometry-aero"
  safe_screencap "$OUT/03-geometry-editor-bottom.png"
  python3 /tmp/ui_node.py "$OUT/03-geometry-editor-bottom.xml" > "$OUT/03-geometry-editor-bottom.json"
  grep -qi "ROTOR AERODYNAMICS" "$OUT/03-geometry-editor-bottom.json"
  adb shell input swipe $(((W>620?(W-620)/2:0)+5)) $((H*3/4)) $(((W>620?(W-620)/2:0)+5)) $((H/2)) 450
  sleep 0.2
  safe_screencap "$OUT/03b-geometry-aero-fields.png"

  python3 /tmp/tap_text.py CONDITIONS
  sleep 0.8
  safe_screencap "$OUT/03-conditions-top.png"
  python3 /tmp/ui_node.py "$OUT/03-conditions-top.xml" > "$OUT/03-conditions-top.json"
  grep -Eq '"text": "(μₓ|Vx)' "$OUT/03-conditions-top.json"
  grep -Eq '"text": "(α|Vz|μz)' "$OUT/03-conditions-top.json"

  # Verify both lower Conditions sections independently. On short landscape
  # viewports the operating pair and Profile Drag cannot remain visible together.
  assert_text_scrolling_down "$OUT" "RPM + CT" "$W" "$H" "04-operating-pair"
  assert_text_scrolling_down "$OUT" "Numerical Vectorial" "$W" "$H" "04-profile-drag"
  adb shell input swipe $(((W>620?(W-620)/2:0)+5)) $((H*3/4)) $(((W>620?(W-620)/2:0)+5)) $((H/2)) 450
  sleep 0.2
  safe_screencap "$OUT/04-conditions-bottom.png"
  python3 /tmp/ui_node.py "$OUT/04-conditions-bottom.xml" > "$OUT/04-conditions-bottom.json"
  grep -qi "Numerical Vectorial" "$OUT/04-conditions-bottom.json"

  python3 /tmp/tap_text.py RESULTS
  sleep 0.8
  safe_screencap "$OUT/05-results-top.png"
  python3 /tmp/ui_node.py "$OUT/05-results-top.xml" > "$OUT/05-results-top.json"
  grep -qi "DIMENSIONAL PERFORMANCE" "$OUT/05-results-top.json"

  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" "$W" "$H" "06-coefficients"
  adb shell input swipe $(((W>620?(W-620)/2:0)+5)) $((H*3/4)) $(((W>620?(W-620)/2:0)+5)) $((H/2)) 450
  sleep 0.2
  safe_screencap "$OUT/06-results-middle.png"
  assert_text_scrolling_down "$OUT" "OPERATING STATE & ATMOSPHERE" "$W" "$H" "07-operating-state"
  assert_text_scrolling_down "$OUT" "$SOLVED_RPM_LABEL" "$W" "$H" "08-solved-rpm"
  assert_text_scrolling_down "$OUT" "$SOUND_SPEED_LABEL" "$W" "$H" "09-atmosphere-bottom"
  for _ in 1 2; do
    adb shell input swipe $(((W>620?(W-620)/2:0)+5)) $((H*3/4)) $(((W>620?(W-620)/2:0)+5)) $((H/2)) 450
    sleep 0.12
  done
  safe_screencap "$OUT/09-results-bottom.png"

  # Reopen Results from the top and inspect the universal sweep.
  python3 /tmp/tap_text.py RESULTS || true
  sleep 0.3
  scroll_to_top "$W" "$H"
  tap_text_scrolling "OPEN PARAMETER SWEEP" "$W" "$H"
  sleep 1
  safe_screencap "$OUT/10-sweep.png"
  python3 /tmp/ui_node.py "$OUT/10-sweep.xml" > "$OUT/10-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/10-sweep.json"
  grep -qi "TABLE" "$OUT/10-sweep.json"
  grep -qi "CSV" "$OUT/10-sweep.json"
  grep -qi "PNG" "$OUT/10-sweep.json"
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  python3 /tmp/check_bounds.py "$OUT/01-geometry-editor-top.png" "$OUT"
  python3 /tmp/check_bounds.py "$OUT/03-geometry-editor-bottom.png" "$OUT"
  adb shell am force-stop flightdyn.rotorcalculator
}

functional_smoke() {
  local OUT="qa-results/functional-smoke"
  mkdir -p "$OUT"
  adb shell pm clear flightdyn.rotorcalculator >/dev/null
  adb shell wm size 393x873
  adb shell wm density 160
  adb shell settings put system font_scale 1.0
  adb shell settings put system accelerometer_rotation 0
  adb shell settings put system user_rotation 0
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 2
  assert_app_alive
  wait_geometry_ready "$OUT" 393 873

  # Direct Geometry editor + Active Rotor selector + NEW/DELETE semantics.
  python3 /tmp/ui_node.py "$OUT/01-geometry-editor-top.xml" > "$OUT/01-geometry-editor-top.json"
  grep -qi "ACTIVE ROTOR" "$OUT/01-geometry-editor-top.json"
  grep -qi "UH-60" "$OUT/01-geometry-editor-top.json"
  python3 /tmp/tap_text.py "ACTIVE ROTOR"
  sleep 0.3
  python3 /tmp/tap_text.py "NEW ROTOR"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/01b-new-rotor.xml" > "$OUT/01b-new-rotor.json"
  grep -qi "Custom Rotor" "$OUT/01b-new-rotor.json"
  grep -qi "BLADE GEOMETRY" "$OUT/01b-new-rotor.json"
  python3 /tmp/tap_text.py "DELETE"
  sleep 0.4
  python3 /tmp/tap_text.py "DELETE"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/01c-after-new-delete.xml" > "$OUT/01c-after-new-delete.json"
  grep -qi "ACTIVE ROTOR" "$OUT/01c-after-new-delete.json"

  python3 /tmp/tap_text.py "ACTIVE ROTOR"
  sleep 0.3
  tap_text_scrolling "UH-60" 393 873 up
  sleep 0.6
  tap_text_scrolling "ROTOR AERODYNAMICS" 393 873
  tap_text_scrolling "Tip Loss" 393 873
  sleep 0.4
  python3 /tmp/tap_text.py "Fixed B — prescribed effective tip radius"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/02-fixed-b.xml" > "$OUT/02-fixed-b.json"
  grep -qi "Fixed B" "$OUT/02-fixed-b.json"

  tap_text_scrolling "Airfoil" 393 873
  sleep 0.4
  python3 /tmp/tap_text.py "NACA 0012"
  sleep 0.6

  # SAVE must persist real edits while keeping the direct editor open.
  python3 /tmp/tap_text.py "SAVE"
  sleep 0.7
  python3 /tmp/ui_node.py "$OUT/02b-after-save-editor.xml" > "$OUT/02b-after-save-editor.json"
  grep -qi "ACTIVE ROTOR" "$OUT/02b-after-save-editor.json"
  grep -qi "UH-60" "$OUT/02b-after-save-editor.json"
  assert_text_scrolling_down "$OUT" "Fixed B" 393 873 "02c-saved-fixed-b"
  assert_text_scrolling_down "$OUT" "NACA 0012" 393 873 "02d-saved-airfoil"

  python3 /tmp/tap_text.py "COPY"
  sleep 0.8
  safe_screencap "$OUT/03-copied-rotor.png"
  python3 /tmp/ui_node.py "$OUT/03-copied-rotor.xml" > "$OUT/03-copied-rotor.json"
  grep -Fqi "UH-60 (Copy)" "$OUT/03-copied-rotor.json"

  # Copying a copy must produce Copy 2, never "Copy Copy".
  python3 /tmp/tap_text.py "COPY"
  sleep 0.8
  safe_screencap "$OUT/03b-copied-rotor-2.png"
  python3 /tmp/ui_node.py "$OUT/03b-copied-rotor-2.xml" > "$OUT/03b-copied-rotor-2.json"
  grep -Fqi "UH-60 (Copy 2)" "$OUT/03b-copied-rotor-2.json"
  ! grep -Fqi "Copy Copy" "$OUT/03b-copied-rotor-2.json"
  adb shell input keyevent 4
  sleep 0.4

  # Cold restart: the second copied rotor remains the active saved selection.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  python3 /tmp/ui_node.py "$OUT/04-after-restart.xml" > "$OUT/04-after-restart.json"
  grep -qi "ACTIVE ROTOR" "$OUT/04-after-restart.json"
  grep -Fqi "UH-60 (Copy 2)" "$OUT/04-after-restart.json"
  grep -qi "ACTIVE ROTOR" "$OUT/04-after-restart.json"

  # Unsaved Geometry survives Activity recreation/orientation and Discard restores persisted data.
  tap_text_scrolling "ROTOR AERODYNAMICS" 393 873
  tap_text_scrolling "Tip Loss" 393 873
  sleep 0.3
  python3 /tmp/tap_text.py "Sissingh — thrust-dependent tip factor"
  sleep 0.5
  adb shell settings put system user_rotation 1
  adb shell wm size 873x393
  sleep 2
  assert_app_alive
  wait_geometry_ready "$OUT" 873 393
  tap_text_scrolling "ROTOR AERODYNAMICS" 873 393
  tap_text_scrolling "Sissingh" 873 393
  adb shell input keyevent 4
  safe_screencap "$OUT/04b-geometry-unsaved-landscape.png"
  python3 /tmp/ui_node.py "$OUT/04b-geometry-unsaved-landscape.xml" > "$OUT/04b-geometry-unsaved-landscape.json"
  grep -qi "Sissingh" "$OUT/04b-geometry-unsaved-landscape.json"
  grep -qi "UNSAVED" "$OUT/04b-geometry-unsaved-landscape.json"
  adb shell wm size 393x873
  adb shell settings put system user_rotation 0
  sleep 1.5
  assert_app_alive
  adb shell input keyevent 4
  sleep 0.4
  python3 /tmp/tap_text.py "Discard"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/04c-after-discard.xml" > "$OUT/04c-after-discard.json"
  grep -qi "ACTIVE ROTOR" "$OUT/04c-after-discard.json"

  # Global menu: converter, help, about and factory restore.
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Quick Unit Converter"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/04d-unit-converter.xml" > "$OUT/04d-unit-converter.json"
  grep -qi "QUICK UNIT CONVERTER" "$OUT/04d-unit-converter.json"
  grep -qi "hp" "$OUT/04d-unit-converter.json"
  adb shell input keyevent 4
  sleep 0.3

  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Physics & Equations"
  sleep 0.8
  python3 /tmp/ui_node.py "$OUT/04e-physics-help.xml" > "$OUT/04e-physics-help.json"
  grep -qi "PHYSICS & EQUATIONS" "$OUT/04e-physics-help.json"
  adb shell input keyevent 4
  sleep 0.3


  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "About RotorCalculator"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/04g-about.xml" > "$OUT/04g-about.json"
  grep -qi "About RotorCalculator" "$OUT/04g-about.json"
  adb shell input keyevent 4
  sleep 0.3

  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Restore Factory Rotor Presets"
  sleep 0.5
  python3 /tmp/tap_text.py "RESTORE"
  sleep 0.8
  python3 /tmp/ui_node.py "$OUT/04h-after-factory-restore.xml" > "$OUT/04h-after-factory-restore.json"
  grep -qi "ACTIVE ROTOR" "$OUT/04h-after-factory-restore.json"
  grep -Fqi "UH-60 (Copy 2)" "$OUT/04h-after-factory-restore.json"

  python3 /tmp/tap_text.py CONDITIONS
  sleep 0.8

  # Explicit equivalent-flow selectors.
  python3 /tmp/tap_text.py "μₓ"
  sleep 0.3
  python3 /tmp/tap_text.py "Vx — airspeed"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/05-horizontal-vx.xml" > "$OUT/05-horizontal-vx.json"
  grep -Eq '"text": "Vx' "$OUT/05-horizontal-vx.json"

  python3 /tmp/tap_text.py "α"
  sleep 0.3
  python3 /tmp/tap_text.py "Vz — climb speed"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/06-axial-vz.xml" > "$OUT/06-axial-vz.json"
  grep -Eq '"text": "Vz' "$OUT/06-axial-vz.json"
  python3 /tmp/tap_text.py "Vz"
  sleep 0.3
  python3 /tmp/tap_text.py "μz — axial ratio"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/07-axial-muz.xml" > "$OUT/07-axial-muz.json"
  grep -Eq '"text": "μz' "$OUT/07-axial-muz.json"

  # All six operating pairs are reachable from one explicit selector.
  tap_text_scrolling "RPM + CT" 393 873
  sleep 0.3
  python3 /tmp/tap_text.py "RPM + Collective"
  sleep 0.4
  python3 /tmp/tap_text.py "RPM + Collective"
  sleep 0.3
  python3 /tmp/tap_text.py "RPM + Thrust"
  sleep 0.4
  python3 /tmp/tap_text.py "RPM + Thrust"
  sleep 0.3
  python3 /tmp/tap_text.py "Collective + CT"
  sleep 0.4
  python3 /tmp/tap_text.py "Collective + CT"
  sleep 0.3
  python3 /tmp/tap_text.py "Collective + Thrust"
  sleep 0.4
  python3 /tmp/tap_text.py "Collective + Thrust"
  sleep 0.3
  python3 /tmp/tap_text.py "CT + Thrust"
  sleep 0.4
  python3 /tmp/tap_text.py "CT + Thrust"
  sleep 0.3
  python3 /tmp/tap_text.py "RPM + CT"
  sleep 0.7

  tap_text_scrolling "Coleman-Feingold" 393 873
  sleep 0.3
  python3 /tmp/tap_text.py "Drees"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/08-models.xml" > "$OUT/08-models.json"
  grep -qi "Drees" "$OUT/08-models.json"
  grep -qi "Numerical Vectorial" "$OUT/08-models.json"

  # Results exposes all coefficients together and the complete operating solution.
  python3 /tmp/tap_text.py RESULTS
  sleep 0.8
  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" 393 873 "09-coefficients"
  assert_text_scrolling_down "$OUT" "RPM — Solved" 393 873 "10-solved-rpm"
  assert_text_scrolling_down "$OUT" "Δθ — Collective" 393 873 "11-solved-collective"
  assert_text_scrolling_down "$OUT" "CT — Solved" 393 873 "12-solved-ct"
  assert_text_scrolling_down "$OUT" "T — Solved" 393 873 "13-solved-thrust"

  # Settings: exercise all persistent presentation options.
  adb shell input tap 369 52
  sleep 0.4
  python3 /tmp/tap_text.py "Settings"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14-settings-dark.xml" > "$OUT/14-settings-dark.json"
  grep -qi "Import Geometries" "$OUT/14-settings-dark.json"
  grep -qi "Export Geometries" "$OUT/14-settings-dark.json"
  grep -qi "DARK" "$OUT/14-settings-dark.json"
  grep -qi "SI" "$OUT/14-settings-dark.json"
  grep -qi "STANDARD" "$OUT/14-settings-dark.json"

  # SAF geometry backup/sharing must open the real Android document picker.
  python3 /tmp/tap_text.py "Import Geometries"
  assert_document_picker "$OUT" "14e-import-picker" ""
  python3 /tmp/tap_text.py "Export Geometries"
  assert_document_picker "$OUT" "14f-export-picker" "rotorcalculator_geometries.txt"

  # QA-6: perform a real geometry export/import round-trip through Android SAF.
  # A temporary user rotor is exported, deleted locally, imported back, then its
  # editable numeric fields are compared before/after to prove value preservation.
  adb shell input keyevent 4
  sleep 0.4
  python3 /tmp/tap_text.py "ACTIVE ROTOR"
  sleep 0.3
  python3 /tmp/tap_text.py "NEW ROTOR"
  sleep 0.6
  python3 /tmp/extract_edit_values.py "$OUT/14g-roundtrip-before-top.txt"
  for _ in 1 2 3 4 5 6; do
    adb shell input swipe 196 700 196 220 240 || true
    sleep 0.12
  done
  python3 /tmp/extract_edit_values.py "$OUT/14h-roundtrip-before-bottom.txt"
  python3 /tmp/tap_text.py "SAVE"
  sleep 0.7
  adb shell rm -f /sdcard/Download/rotorcalculator_geometries.txt || true
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.4
  python3 /tmp/tap_text.py "Export Geometries"
  save_document_picker "$OUT" "14i-export-roundtrip" "rotorcalculator_geometries.txt"
  adb shell input keyevent 4
  sleep 0.4
  python3 /tmp/tap_text.py "Custom Rotor"
  sleep 0.5
  python3 /tmp/tap_text.py "DELETE"
  sleep 0.3
  python3 /tmp/tap_text.py "DELETE"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/14j-after-roundtrip-delete.xml" > "$OUT/14j-after-roundtrip-delete.json"
  ! grep -Fqi "Custom Rotor" "$OUT/14j-after-roundtrip-delete.json"
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.4
  python3 /tmp/tap_text.py "Import Geometries"
  open_document_picker_file "rotorcalculator_geometries.txt"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/14k-roundtrip-found.xml" > "$OUT/14k-roundtrip-found.json"
  grep -Fqi "valid geometries" "$OUT/14k-roundtrip-found.json"
  python3 /tmp/tap_text.py "IMPORT"
  sleep 0.4
  python3 /tmp/tap_text.py "Skip same-name imported geometries"
  sleep 0.8
  adb shell input keyevent 4
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/14l-roundtrip-restored.xml" > "$OUT/14l-roundtrip-restored.json"
  grep -qi "ACTIVE ROTOR" "$OUT/14l-roundtrip-restored.json"
  python3 /tmp/tap_text.py "ACTIVE ROTOR"
  sleep 0.3
  python3 /tmp/tap_text.py "Custom Rotor"
  sleep 0.5
  python3 /tmp/extract_edit_values.py "$OUT/14m-roundtrip-after-top.txt"
  cmp "$OUT/14g-roundtrip-before-top.txt" "$OUT/14m-roundtrip-after-top.txt"
  for _ in 1 2 3 4 5 6; do
    adb shell input swipe 196 700 196 220 240 || true
    sleep 0.12
  done
  python3 /tmp/extract_edit_values.py "$OUT/14n-roundtrip-after-bottom.txt"
  cmp "$OUT/14h-roundtrip-before-bottom.txt" "$OUT/14n-roundtrip-after-bottom.txt"
  adb shell input keyevent 4
  sleep 0.4

  # QA-6: live import must reject malformed and syntactically valid out-of-domain files.
  printf '%s\n' 'not-a-rotorcalculator-database' | adb shell 'cat > /sdcard/Download/rotorcalculator_malformed.txt'
  printf '%s\n' 'ROTORCALCULATOR_GEOMETRIES|2' 'R|Out Of Domain|75|4|0.10|0.50|0.40|0.20|0.10|6.0|0.01|fixed|0.97|1' | adb shell 'cat > /sdcard/Download/rotorcalculator_out_of_domain.txt'
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/rotorcalculator_malformed.txt >/dev/null || true
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/rotorcalculator_out_of_domain.txt >/dev/null || true
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.4
  python3 /tmp/tap_text.py "Import Geometries"
  open_document_picker_file "rotorcalculator_malformed.txt"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14o-malformed-rejected.xml" > "$OUT/14o-malformed-rejected.json"
  grep -Fqi "No valid RotorCalculator geometries" "$OUT/14o-malformed-rejected.json"
  python3 /tmp/tap_text.py "OK"
  sleep 0.3
  python3 /tmp/tap_text.py "Import Geometries"
  open_document_picker_file "rotorcalculator_out_of_domain.txt"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14p-domain-rejected.xml" > "$OUT/14p-domain-rejected.json"
  grep -Fqi "No valid RotorCalculator geometries" "$OUT/14p-domain-rejected.json"
  python3 /tmp/tap_text.py "OK"
  sleep 0.3

  python3 /tmp/tap_text.py "SI"
  sleep 0.3
  python3 /tmp/tap_text.py "STANDARD"
  sleep 0.3
  python3 /tmp/ui_node.py "$OUT/14a-settings-options.xml" > "$OUT/14a-settings-options.json"
  grep -qi "IMPERIAL" "$OUT/14a-settings-options.json"
  grep -qi "+1 DECIMAL" "$OUT/14a-settings-options.json"

  # Tapping the current DARK theme switches to LIGHT and rebuilds the UI.
  python3 /tmp/tap_text.py "DARK"
  sleep 1.2
  assert_app_alive
  safe_screencap "$OUT/14b-portrait-light.png"

  # Reopen Settings and verify the live state.
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14c-settings-light.xml" > "$OUT/14c-settings-light.json"
  grep -qi "LIGHT" "$OUT/14c-settings-light.json"
  grep -qi "IMPERIAL" "$OUT/14c-settings-light.json"
  grep -qi "+1 DECIMAL" "$OUT/14c-settings-light.json"
  adb shell input keyevent 4
  sleep 0.3

  # Cold restart must preserve theme, units and precision.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  adb shell input tap 369 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14d-settings-after-restart.xml" > "$OUT/14d-settings-after-restart.json"
  grep -qi "LIGHT" "$OUT/14d-settings-after-restart.json"
  grep -qi "IMPERIAL" "$OUT/14d-settings-after-restart.json"
  grep -qi "+1 DECIMAL" "$OUT/14d-settings-after-restart.json"
  adb shell input keyevent 4
  sleep 0.3

  # Universal sweep: explicit Y, family, VALUES, X axis/range, hover-only trim and exports.
  python3 /tmp/tap_text.py RESULTS
  sleep 0.3
  scroll_to_top 393 873
  tap_text_scrolling "OPEN PARAMETER SWEEP" 393 873
  sleep 1
  python3 /tmp/ui_node.py "$OUT/15-sweep.xml" > "$OUT/15-sweep.json"
  grep -qi "VALUES" "$OUT/15-sweep.json"
  grep -qi "X · μₓ" "$OUT/15-sweep.json"
  grep -qi "μₓ MAX" "$OUT/15-sweep.json"
  grep -qi "TRIM ONLY HOVER" "$OUT/15-sweep.json"
  grep -qi "TABLE" "$OUT/15-sweep.json"
  grep -qi "CSV" "$OUT/15-sweep.json"
  grep -qi "PNG" "$OUT/15-sweep.json"
  safe_screencap "$OUT/15-sweep.png"

  # Plot export must reach the real CREATE_DOCUMENT picker, not just expose buttons.
  python3 /tmp/tap_text.py "CSV"
  assert_document_picker "$OUT" "15a-csv-picker" ""
  python3 /tmp/tap_text.py "PNG"
  assert_document_picker "$OUT" "15b-png-picker" ""

  # Exercise both hover-only trim states while a trim-requiring pair is active.
  python3 /tmp/tap_text.py "TRIM ONLY HOVER"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/15c-trim-hover-on.xml" > "$OUT/15c-trim-hover-on.json"
  grep -Fqi "☑ TRIM ONLY HOVER" "$OUT/15c-trim-hover-on.json"
  python3 /tmp/tap_text.py "TRIM ONLY HOVER"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/15d-trim-hover-off.xml" > "$OUT/15d-trim-hover-off.json"
  grep -Fqi "☐ TRIM ONLY HOVER" "$OUT/15d-trim-hover-off.json"

  python3 /tmp/tap_text.py "Inflow Models"
  sleep 0.3
  python3 /tmp/tap_text.py "Rotor α Family"
  sleep 0.5
  python3 /tmp/tap_text.py "VALUES"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/16-family-values.xml" > "$OUT/16-family-values.json"
  grep -qi "FAMILY VALUES" "$OUT/16-family-values.json"
  python3 /tmp/set_first_edit_text.py "1,2,4,8"
  adb shell input keyevent 4
  sleep 0.2
  python3 /tmp/tap_text.py "APPLY"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/16a-family-values-applied.xml" > "$OUT/16a-family-values-applied.json"
  grep -Fqi "α Family (4)" "$OUT/16a-family-values-applied.json"

  # Every family selector must be reachable without crashing the sweep.
  python3 /tmp/tap_text.py "α Family"
  sleep 0.3
  python3 /tmp/tap_text.py "Axial Vz Family"
  sleep 0.5
  python3 /tmp/tap_text.py "Vz Family"
  sleep 0.3
  python3 /tmp/tap_text.py "Axial μz Family"
  sleep 0.5
  python3 /tmp/tap_text.py "μz Family"
  sleep 0.3
  python3 /tmp/tap_text.py "Active Only"
  sleep 0.5
  python3 /tmp/tap_text.py "Active Only"
  sleep 0.3
  python3 /tmp/tap_text.py "Inflow Models"
  sleep 0.5
  assert_app_alive

  # QA-4: exercise every available sweep Y output, not just the default CP.
  # Keep Active Only during this catalog walk so each selection is a single-curve solve.
  python3 /tmp/tap_text.py "Inflow Models"
  sleep 0.3
  python3 /tmp/tap_text.py "Active Only"
  sleep 0.5
  local current_y="CQ — Torque"
  local sweep_y_labels=(
    "CT — Thrust"
    "CQ — Torque"
    "CQi — Induced Torque"
    "CQ0 — Profile Torque"
    "CH — In-Plane"
    "CHi — Induced In-Plane"
    "CH0 — Profile In-Plane"
    "CY — Side Force"
    "CMx — Roll Moment"
    "CMy — Pitch Moment"
    "CPair — Air Power"
    "λ — Total Inflow"
    "λi — Induced Inflow"
    "L/D eff — Effective L/D"
    "FoM — Figure of Merit"
    "Kx — Longitudinal Inflow"
    "Ky — Lateral Inflow"
    "χ — Wake Skew Angle [deg]"
    "Mat — Advancing Tip Mach"
    "Pshaft — Shaft Power [kW]"
    "Pshaft — Shaft Power [hp]"
    "T — Thrust [N]"
    "T — Thrust [kgf]"
    "Q — Shaft Torque [N·m]"
    "H — In-Plane Force [N]"
    "B — Tip-Loss Factor"
    "ΩR — Tip Speed [m/s]"
    "RPM — Solved Speed"
    "Δθ — Collective Increment [deg]"
    "μₓ — Advance Ratio"
    "Vx — Airspeed [m/s]"
    "μz — Axial Ratio"
    "Vz — Climb Speed [m/s]"
    "α — AoA [deg]"
    "Altitude [m]"
    "Temperature [°C]"
    "ρ — Air Density [kg/m³]"
    "p — Ambient Pressure [Pa]"
    "a — Speed of Sound [m/s]"
  )
  local target_y
  for target_y in "${sweep_y_labels[@]}"; do
    python3 /tmp/tap_text.py "$current_y"
    sleep 0.2
    tap_text_scrolling "$target_y" 393 873
    sleep 0.35
    assert_app_alive
    python3 /tmp/ui_node.py "$OUT/16b-sweep-y-current.xml" > "$OUT/16b-sweep-y-current.json"
    grep -Fqi "$target_y" "$OUT/16b-sweep-y-current.json"
    echo "Verified sweep Y: $target_y"
    current_y="$target_y"
  done

  python3 /tmp/tap_text.py "X · μₓ"
  sleep 0.3
  python3 /tmp/tap_text.py "Vx — airspeed"
  sleep 0.5
  python3 /tmp/tap_text.py "μₓ MAX"
  sleep 0.3
  python3 /tmp/tap_text.py "μₓ max = 0.60"
  sleep 0.5
  python3 /tmp/tap_text.py "TABLE"
  sleep 0.7
  python3 /tmp/ui_node.py "$OUT/17-sweep-table.xml" > "$OUT/17-sweep-table.json"
  grep -qi "SWEEP DATA" "$OUT/17-sweep-table.json"
  adb shell input keyevent 4
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  # Live resize/orientation must retain operating pair and session state.
  python3 /tmp/tap_text.py CONDITIONS
  sleep 0.5
  adb shell settings put system user_rotation 1
  adb shell wm size 873x393
  sleep 2
  safe_screencap "$OUT/18-landscape-light.png"
  python3 - "$OUT/18-landscape-light.png" <<'PY'
import struct,sys
with open(sys.argv[1],"rb") as f:
    h=f.read(24)
w,hh=struct.unpack(">II",h[16:24])
if w <= hh:
    raise SystemExit(f"live rotation did not produce landscape dimensions: {w}x{hh}")
PY
  assert_text_scrolling_down "$OUT" "RPM + CT" 873 393 "18b-pair"
  assert_text_scrolling_down "$OUT" "Drees" 873 393 "18c-inflow"

  # Switch back to DARK while still landscape and capture the same orientation.
  adb shell input tap 849 52
  sleep 0.3
  python3 /tmp/tap_text.py "Settings"
  sleep 0.4
  python3 /tmp/tap_text.py "LIGHT"
  sleep 1.0
  assert_app_alive
  safe_screencap "$OUT/18d-landscape-dark.png"

  adb shell wm size 393x873
  adb shell settings put system user_rotation 0
  sleep 1
  assert_app_alive
}

if [[ "${QA_SKIP_COMPACT:-0}" != 1 ]]; then
  capture_screen compact-320x568 320x568 0 1.0
  capture_screen compact-font130-320x568 320x568 0 1.3
  capture_screen standard-360x780 360x780 0 1.0
fi
if [[ "${QA_SKIP_PORTRAIT:-0}" != 1 ]]; then
  capture_screen modern-393x873 393x873 0 1.0
  capture_screen large-412x915 412x915 0 1.0
  capture_screen tablet-small-600x960 600x960 0 1.0
  capture_screen tablet-768x1024 768x1024 0 1.0
fi
if [[ "${QA_SKIP_LANDSCAPE:-0}" != 1 ]]; then
  capture_screen landscape-phone-915x412 915x412 1 1.0
  capture_screen landscape-tablet-1024x600 1024x600 1 1.0
fi
if [[ "${QA_SKIP_FUNCTIONAL:-0}" != 1 ]]; then functional_smoke; fi
adb shell settings put system font_scale 1.0
adb shell wm size reset
adb shell wm density reset
