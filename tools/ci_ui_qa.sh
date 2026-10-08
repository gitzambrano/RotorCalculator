#!/usr/bin/env bash
set -euo pipefail
export PYTHONIOENCODING=utf-8

APK="${1:-${APK:-ci-apk/RotorCalculator-ci.apk}}"
command -v adb >/dev/null
command -v python3 >/dev/null
test -f "$APK"
QA_ROOT="${QA_ROOT:-scratch/qa-results}"
mkdir -p "$QA_ROOT"

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

cat > /tmp/tap_rotor_bar.py <<'PY'
import subprocess, xml.etree.ElementTree as ET, re, tempfile, os, time, sys
xml=tempfile.NamedTemporaryFile(delete=False,suffix=".xml").name
remote=f"/sdcard/rotor-ui-{os.getpid()}.xml"
for attempt in range(4):
    subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
    subprocess.run(["adb","shell","uiautomator","dump",remote],capture_output=True,text=True)
    if subprocess.run(["adb","pull",remote,xml],capture_output=True,text=True).returncode==0: break
    time.sleep(0.4)
else:
    raise SystemExit("Unable to obtain a fresh Android UI hierarchy")
subprocess.run(["adb","shell","rm","-f",remote],stdout=subprocess.DEVNULL)
root=ET.parse(xml).getroot()
ET.ElementTree(root).write("/tmp/rotor-last-ui.xml",encoding="utf-8")
best=None
for n in root.iter("node"):
    if (n.attrib.get("text") or "").strip()!="▾": continue
    m=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",n.attrib.get("bounds",""))
    if not m: continue
    x1,y1,x2,y2=map(int,m.groups())
    if best is None or y1<best[1]: best=(x1,y1,x2,y2)
if not best: print("NOT_FOUND rotor bar"); sys.exit(2)
x1,y1,x2,y2=best
subprocess.run(["adb","shell","input","tap",str((x1+x2)//2),str((y1+y2)//2)],check=True)
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
    if grep -Eqi '"text": "(ROTOR|PLANFORM)"' "$OUTDIR/ready-$attempt.json"; then return 0; fi
    # The app restores the last page and scroll offset after relaunch.
    # Open the Geometry tab, then return toward the start of the form.
    if grep -Fq '"text": "GEOMETRY"' "$OUTDIR/ready-$attempt.json"; then
      python3 /tmp/tap_text.py "GEOMETRY" >/dev/null 2>&1 || true
      sleep 0.4
      python3 /tmp/scroll_step.py "$W" "$H" up
    fi
    sleep 0.3
  done
  echo "Geometry editor did not become ready" >&2
  return 1
}

# Opens the Active Rotor sheet from the fixed top bar (the first chevron on screen).
open_rotor_sheet() {
  python3 /tmp/tap_rotor_bar.py
  sleep 0.5
}

# Opens the header menu (three-dot button) and one of its entries.
# Optional W and H scroll the menu sheet, which is needed on short landscape screens.
open_menu_item() {
  python3 /tmp/tap_text.py "⋮"
  sleep 0.4
  if [ -n "${2:-}" ]; then tap_text_scrolling "$1" "$2" "$3"; else python3 /tmp/tap_text.py "$1"; fi
  sleep 0.6
}

# Closes the Settings page with its close button.
close_settings() {
  python3 /tmp/tap_text.py "×"
  sleep 0.5
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
# Start in the middle of the content column. A start at the screen edge triggers the Android back gesture.
x=(x1+x2)//2 if (x2-x1)<=620 else x1+(x2-x1-620)//2+5
step=max(48,(y2-y1)//3)
start=y2-64; end=max(y1+20,start-step)  # stay clear of the bottom gesture zone
if direction=='up': start,end=end,start
subprocess.run(['adb','shell','input','swipe',str(x),str(start),str(x),str(end),'450'],check=True)
PY

swipe_content() {
  local W="$1" H="$2" X
  # Keep the swipe away from the screen edge: an edge swipe triggers the Android back gesture.
  if (( W > 620 )); then X=$(((W-620)/2+5)); else X=$((W/2)); fi
  adb shell input swipe "$X" $((H*3/4)) "$X" $((H/2)) 450
}

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
  for attempt in $(seq 0 120); do
    python3 /tmp/ui_node.py /tmp/results-top-check.xml > /tmp/results-top-check.json
    if grep -Fqi 'PARAMETER SWEEP' /tmp/results-top-check.json; then return 0; fi
    if (( attempt == 120 )); then break; fi
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
  local GREP_FLAGS="${6:--Fqi}"
  local attempt
  # Each iteration dumps before moving. The 10%-viewport drag and long gesture
  # duration avoid fling, so even a short heading cannot be passed between dumps.
  # 80 steps cover at least eight full viewports on the smallest profile.
  # GREP_FLAGS is -Fqi (literal, default) or -Eqi (regular expression).
  for attempt in $(seq 0 80); do
    python3 /tmp/ui_node.py "$OUTDIR/$STEM-$attempt.xml" > "$OUTDIR/$STEM-$attempt.json"
    if grep "$GREP_FLAGS" -- "$TEXT" "$OUTDIR/$STEM-$attempt.json"; then
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
  local OUT="$QA_ROOT/${QA_THEME:-dark}/$NAME"
  mkdir -p "$OUT"
  local W="${SIZE%x*}"
  local H="${SIZE#*x}"
  local ROTOR_LABEL="Sikorsky UH-60 Black Hawk"
  # Result labels shorten to symbol-only text when the row is too narrow (130% font).
  local SOLVED_RPM_RE='"text": "(Rotor Speed )?Ω"'
  local SOUND_SPEED_RE='"text": "(Speed of Sound )?a"'

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
    # Menu > Settings > Theme sheet > Light. The theme persists across launches.
    open_menu_item "Settings"
    python3 /tmp/tap_text.py "DARK"
    sleep 0.5
    python3 /tmp/tap_text.py "Light"
    sleep 1.0
    python3 /tmp/tap_text.py "×"
    sleep 0.6
    QA_LIGHT_INITIALIZED=1
    wait_geometry_ready "$OUT" "$W" "$H"
  fi

  # Geometry opens directly in the editor; the active rotor is selected from the fixed top bar.
  safe_screencap "$OUT/01-geometry-editor-top.png"
  python3 /tmp/ui_node.py "$OUT/01-geometry-editor-top.xml" > "$OUT/01-geometry-editor-top.json"
  grep -Fqi "$ROTOR_LABEL" "$OUT/01-geometry-editor-top.json"
  grep -Fq '"text": "▾"' "$OUT/01-geometry-editor-top.json"
  grep -Eq '"text": "ROTOR"' "$OUT/01-geometry-editor-top.json"
  grep -Eq '"text": "PLANFORM"' "$OUT/01-geometry-editor-top.json"
  grep -Eq '"text": "(Rotor Speed )?Ωnom"' "$OUT/01-geometry-editor-top.json"

  assert_text_scrolling_down "$OUT" "SOLIDITY & AREAS" "$W" "$H" "02-geometry-derived"
  swipe_content "$W" "$H"
  sleep 0.2
  safe_screencap "$OUT/02-geometry-derived.png"
  assert_text_scrolling_down "$OUT" "BLADE PITCH" "$W" "$H" "02-geometry-pitch"
  assert_text_scrolling_down "$OUT" '"text": "AERODYNAMICS"' "$W" "$H" "02-geometry-aero"
  # SAVE / COPY / DELETE sit at the end of the Geometry form.
  assert_text_scrolling_down "$OUT" "DELETE" "$W" "$H" "02-geometry-actions"
  safe_screencap "$OUT/03-geometry-editor-bottom.png"
  python3 /tmp/ui_node.py "$OUT/03-geometry-editor-bottom.xml" > "$OUT/03-geometry-editor-bottom.json"
  grep -Fq '"text": "SAVE"' "$OUT/03-geometry-editor-bottom.json"
  grep -Fq '"text": "COPY"' "$OUT/03-geometry-editor-bottom.json"
  grep -Fq '"text": "DELETE"' "$OUT/03-geometry-editor-bottom.json"
  grep -Eqi "Tip[ -]Loss" "$OUT/03-geometry-editor-bottom.json"
  swipe_content "$W" "$H"
  sleep 0.2
  safe_screencap "$OUT/03b-geometry-aero-fields.png"

  python3 /tmp/tap_text.py CONDITIONS
  sleep 0.8
  safe_screencap "$OUT/03-conditions-top.png"
  python3 /tmp/ui_node.py "$OUT/03-conditions-top.xml" > "$OUT/03-conditions-top.json"
  grep -Fq '"text": "ATMOSPHERE & FLOW"' "$OUT/03-conditions-top.json"
  grep -Eq '"text": "((Advance Ratio |(Forward )?Airspeed )?(μ(x|ₓ)|Vx))' "$OUT/03-conditions-top.json"
  grep -Eq '"text": "((Disk (AoA|Angle of Attack) |Climb Speed |Axial (Flow )?Ratio )?(α|Vz|μz))' "$OUT/03-conditions-top.json"

  # Verify both lower Conditions sections independently. On short landscape
  # viewports the operating pair and the aerodynamic model cannot remain visible together.
  assert_text_scrolling_down "$OUT" "OPERATING CONSTRAINTS" "$W" "$H" "04-operating-constraints"
  assert_text_scrolling_down "$OUT" "Ω + CT" "$W" "$H" "04-operating-pair"
  assert_text_scrolling_down "$OUT" "AERODYNAMIC MODEL" "$W" "$H" "04-aero-model"
  assert_text_scrolling_down "$OUT" "Num. Vec." "$W" "$H" "04-profile-drag"
  swipe_content "$W" "$H"
  sleep 0.2
  safe_screencap "$OUT/04-conditions-bottom.png"
  python3 /tmp/ui_node.py "$OUT/04-conditions-bottom.xml" > "$OUT/04-conditions-bottom.json"
  grep -Fqi "Num. Vec." "$OUT/04-conditions-bottom.json"

  python3 /tmp/tap_text.py RESULTS
  sleep 0.8
  safe_screencap "$OUT/05-results-top.png"
  python3 /tmp/ui_node.py "$OUT/05-results-top.xml" > "$OUT/05-results-top.json"
  grep -Fq '"text": "FORCES"' "$OUT/05-results-top.json"
  grep -Fq '"text": "PARAMETER SWEEP"' "$OUT/05-results-top.json"
  grep -Fq '"text": "DISK CONTOUR"' "$OUT/05-results-top.json"

  assert_text_scrolling_down "$OUT" "TORQUES & MOMENTS" "$W" "$H" "05b-torques"
  assert_text_scrolling_down "$OUT" '"text": "POWER"' "$W" "$H" "05c-power"
  assert_text_scrolling_down "$OUT" "LOADING & EFFICIENCY" "$W" "$H" "05d-loading"
  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" "$W" "$H" "06-coefficients"
  swipe_content "$W" "$H"
  sleep 0.2
  safe_screencap "$OUT/06-results-middle.png"
  assert_text_scrolling_down "$OUT" "INFLOW & AXIAL FLOW" "$W" "$H" "06b-inflow"
  assert_text_scrolling_down "$OUT" "FLOW & BLADE DIAGNOSTICS" "$W" "$H" "06c-diagnostics"
  assert_text_scrolling_down "$OUT" "STATE & ATMOSPHERE" "$W" "$H" "07-operating-state"
  assert_text_scrolling_down "$OUT" "$SOLVED_RPM_RE" "$W" "$H" "08-solved-rpm" -Eqi
  assert_text_scrolling_down "$OUT" "$SOUND_SPEED_RE" "$W" "$H" "09-atmosphere-bottom" -Eqi
  assert_text_scrolling_down "$OUT" "MODEL STATUS" "$W" "$H" "09b-model-status"
  for _ in 1 2; do
    swipe_content "$W" "$H"
    sleep 0.12
  done
  safe_screencap "$OUT/09-results-bottom.png"

  # Reopen Results from the top and inspect the universal sweep.
  python3 /tmp/tap_text.py RESULTS || true
  sleep 0.3
  scroll_to_top "$W" "$H"
  tap_text_scrolling "PARAMETER SWEEP" "$W" "$H"
  sleep 1
  safe_screencap "$OUT/10-sweep.png"
  python3 /tmp/ui_node.py "$OUT/10-sweep.xml" > "$OUT/10-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/10-sweep.json"
  grep -Fq "Curves" "$OUT/10-sweep.json"
  grep -Fq "X axis" "$OUT/10-sweep.json"
  grep -Fq "Range" "$OUT/10-sweep.json"
  grep -Fq "Trim" "$OUT/10-sweep.json"
  grep -Fq '"text": "TABLE"' "$OUT/10-sweep.json"
  grep -Fq '"text": "CSV"' "$OUT/10-sweep.json"
  grep -Fq '"text": "PNG"' "$OUT/10-sweep.json"
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  # Inspect the rotor-disk contour modal on every viewport.
  python3 /tmp/tap_text.py RESULTS || true
  sleep 0.3
  scroll_to_top "$W" "$H"
  tap_text_scrolling "DISK CONTOUR" "$W" "$H"
  sleep 0.8
  safe_screencap "$OUT/11-disk-contour.png"
  python3 /tmp/ui_node.py "$OUT/11-disk-contour.xml" > "$OUT/11-disk-contour.json"
  grep -qi "ROTOR DISK CONTOUR" "$OUT/11-disk-contour.json"
  grep -qi "EXPORT PNG" "$OUT/11-disk-contour.json"
  grep -qi "EXPORT ALL PNG" "$OUT/11-disk-contour.json"
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  python3 /tmp/check_bounds.py "$OUT/01-geometry-editor-top.png" "$OUT"
  python3 /tmp/check_bounds.py "$OUT/03-geometry-editor-bottom.png" "$OUT"
  adb shell am force-stop flightdyn.rotorcalculator
}

functional_smoke() {
  local OUT="$QA_ROOT/functional-smoke"
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

  # Direct Geometry editor + Active Rotor sheet + New Rotor / Delete semantics.
  python3 /tmp/ui_node.py "$OUT/01-geometry-editor-top.xml" > "$OUT/01-geometry-editor-top.json"
  grep -Fqi "Sikorsky UH-60 Black Hawk" "$OUT/01-geometry-editor-top.json"
  grep -Fq '"text": "▾"' "$OUT/01-geometry-editor-top.json"
  open_rotor_sheet
  python3 /tmp/ui_node.py "$OUT/01a-rotor-sheet.xml" > "$OUT/01a-rotor-sheet.json"
  grep -Fq '"text": "Active Rotor"' "$OUT/01a-rotor-sheet.json"
  grep -Fqi "New Rotor" "$OUT/01a-rotor-sheet.json"
  grep -Fqi "Rename Current Rotor" "$OUT/01a-rotor-sheet.json"
  grep -Fq "Bell 206 JetRanger" "$OUT/01a-rotor-sheet.json"
  grep -Fq "eVTOL Conceptual Rotor" "$OUT/01a-rotor-sheet.json"
  grep -Fq '"text": "Preset"' "$OUT/01a-rotor-sheet.json"
  python3 /tmp/tap_text.py "New Rotor"
  sleep 0.6
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/01b-new-rotor.xml" > "$OUT/01b-new-rotor.json"
  grep -Fq '"text": "Custom Rotor"' "$OUT/01b-new-rotor.json"
  grep -Fq '"text": "PLANFORM"' "$OUT/01b-new-rotor.json"
  tap_text_scrolling "DELETE" 393 873
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/01b2-delete-confirm.xml" > "$OUT/01b2-delete-confirm.json"
  grep -Fq "Delete Rotor" "$OUT/01b2-delete-confirm.json"
  python3 /tmp/tap_text.py "Delete"
  sleep 0.6
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/01c-after-new-delete.xml" > "$OUT/01c-after-new-delete.json"
  ! grep -Fq '"text": "Custom Rotor"' "$OUT/01c-after-new-delete.json"
  grep -Fq '"text": "▾"' "$OUT/01c-after-new-delete.json"
  grep -Fq '"text": "UNDO"' "$OUT/01c-after-new-delete.json"

  open_rotor_sheet
  tap_text_scrolling "Sikorsky UH-60 Black Hawk" 393 873 up
  sleep 0.6
  wait_geometry_ready "$OUT" 393 873
  # Tip Loss and Airfoil: the label opens help, the value opens the choice sheet.
  tap_text_scrolling "Sissingh" 393 873
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/02-tip-loss-sheet.xml" > "$OUT/02-tip-loss-sheet.json"
  grep -Fq "Tip-Loss Model" "$OUT/02-tip-loss-sheet.json"
  python3 /tmp/tap_text.py "Fixed"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/02-fixed-b.xml" > "$OUT/02-fixed-b.json"
  grep -Fq '"text": "Fixed"' "$OUT/02-fixed-b.json"
  grep -Fq '"text": "UNSAVED"' "$OUT/02-fixed-b.json"

  tap_text_scrolling "Custom" 393 873
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/02a-airfoil-sheet.xml" > "$OUT/02a-airfoil-sheet.json"
  grep -Fq "Airfoil Section" "$OUT/02a-airfoil-sheet.json"
  python3 /tmp/tap_text.py "NACA 0012"
  sleep 0.6

  # SAVE on a factory preset asks first. Overwrite must persist the edits and keep the editor open.
  tap_text_scrolling "SAVE" 393 873
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/02a2-preset-guard.xml" > "$OUT/02a2-preset-guard.json"
  grep -Fq "Factory Preset" "$OUT/02a2-preset-guard.json"
  grep -Fq "Save as copy" "$OUT/02a2-preset-guard.json"
  grep -Fq "Overwrite preset" "$OUT/02a2-preset-guard.json"
  python3 /tmp/tap_text.py "Overwrite preset"
  sleep 0.7
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/02b-after-save-editor.xml" > "$OUT/02b-after-save-editor.json"
  grep -Fqi "Sikorsky UH-60 Black Hawk" "$OUT/02b-after-save-editor.json"
  ! grep -Fq '"text": "UNSAVED"' "$OUT/02b-after-save-editor.json"
  assert_text_scrolling_down "$OUT" '"text": "Fixed"' 393 873 "02c-saved-fixed-b"
  assert_text_scrolling_down "$OUT" '"text": "NACA 0012"' 393 873 "02d-saved-airfoil"

  tap_text_scrolling "COPY" 393 873
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/03-copy-dialog.xml" > "$OUT/03-copy-dialog.json"
  grep -Fq "Copy Rotor" "$OUT/03-copy-dialog.json"
  grep -Fq "Sikorsky UH-60 Black Hawk Copy" "$OUT/03-copy-dialog.json"
  python3 /tmp/tap_text.py "Copy"
  sleep 0.8
  wait_geometry_ready "$OUT" 393 873
  safe_screencap "$OUT/03-copied-rotor.png"
  python3 /tmp/ui_node.py "$OUT/03-copied-rotor.xml" > "$OUT/03-copied-rotor.json"
  grep -Fq '"text": "Sikorsky UH-60 Black Hawk Copy"' "$OUT/03-copied-rotor.json"

  # Copying a copy must produce Copy 2, never "Copy Copy".
  tap_text_scrolling "COPY" 393 873
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/03b-copy-dialog-2.xml" > "$OUT/03b-copy-dialog-2.json"
  grep -Fq "Copy 2" "$OUT/03b-copy-dialog-2.json"
  ! grep -Fq "Copy Copy" "$OUT/03b-copy-dialog-2.json"
  python3 /tmp/tap_text.py "Copy"
  sleep 0.8
  wait_geometry_ready "$OUT" 393 873
  safe_screencap "$OUT/03b-copied-rotor-2.png"
  python3 /tmp/ui_node.py "$OUT/03b-copied-rotor-2.xml" > "$OUT/03b-copied-rotor-2.json"
  grep -Fqi "Black Hawk Copy 2" "$OUT/03b-copied-rotor-2.json"
  ! grep -Fqi "Copy Copy" "$OUT/03b-copied-rotor-2.json"

  # Cold restart: the second copied rotor remains the active saved selection.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/04-after-restart.xml" > "$OUT/04-after-restart.json"
  grep -Fqi "Black Hawk Copy 2" "$OUT/04-after-restart.json"
  grep -Fq '"text": "▾"' "$OUT/04-after-restart.json"

  # Unsaved Geometry survives Activity recreation/orientation; Back asks, and Discard restores persisted data.
  tap_text_scrolling "Fixed" 393 873
  sleep 0.3
  python3 /tmp/tap_text.py "Sissingh"
  sleep 0.5
  adb shell settings put system user_rotation 1
  adb shell wm size 873x393
  sleep 2
  assert_app_alive
  wait_geometry_ready "$OUT" 873 393
  assert_text_scrolling_down "$OUT" '"text": "Sissingh"' 873 393 "04a-unsaved-sissingh"
  safe_screencap "$OUT/04b-geometry-unsaved-landscape.png"
  python3 /tmp/ui_node.py "$OUT/04b-geometry-unsaved-landscape.xml" > "$OUT/04b-geometry-unsaved-landscape.json"
  grep -Fq '"text": "Sissingh"' "$OUT/04b-geometry-unsaved-landscape.json"
  grep -Fq '"text": "UNSAVED"' "$OUT/04b-geometry-unsaved-landscape.json"
  adb shell wm size 393x873
  adb shell settings put system user_rotation 0
  sleep 1.5
  assert_app_alive
  adb shell input keyevent 4
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/04b2-unsaved-dialog.xml" > "$OUT/04b2-unsaved-dialog.json"
  grep -Fq "Unsaved Geometry" "$OUT/04b2-unsaved-dialog.json"
  grep -Fq '"text": "Cancel"' "$OUT/04b2-unsaved-dialog.json"
  python3 /tmp/tap_text.py "Discard"
  sleep 1.0
  # Discard leaves the app; a new launch must show the persisted rotor without UNSAVED.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/04c-after-discard.xml" > "$OUT/04c-after-discard.json"
  grep -Fqi "Black Hawk Copy 2" "$OUT/04c-after-discard.json"
  ! grep -Fq '"text": "UNSAVED"' "$OUT/04c-after-discard.json"
  assert_text_scrolling_down "$OUT" '"text": "Fixed"' 393 873 "04c2-discard-restored-fixed"

  # Global menu: entries, unit converter, physics help and about.
  python3 /tmp/tap_text.py "⋮"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/04c3-menu.xml" > "$OUT/04c3-menu.json"
  grep -Fqi "Physics & Equations" "$OUT/04c3-menu.json"
  grep -Fq "Unit Converter" "$OUT/04c3-menu.json"
  grep -Fq '"text": "Settings"' "$OUT/04c3-menu.json"
  grep -Fq '"text": "About"' "$OUT/04c3-menu.json"
  grep -Fq '"text": "Privacy"' "$OUT/04c3-menu.json"
  python3 /tmp/tap_text.py "×"
  sleep 0.3
  open_menu_item "Unit Converter"
  python3 /tmp/ui_node.py "$OUT/04d-unit-converter.xml" > "$OUT/04d-unit-converter.json"
  grep -qi "QUICK UNIT CONVERTER" "$OUT/04d-unit-converter.json"
  grep -qi "hp" "$OUT/04d-unit-converter.json"
  adb shell input keyevent 4
  sleep 0.3

  open_menu_item "Physics"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/04e-physics-help.xml" > "$OUT/04e-physics-help.json"
  grep -Fqi "PHYSICS & EQUATIONS" "$OUT/04e-physics-help.json"
  adb shell input keyevent 4
  sleep 0.3

  open_menu_item "About"
  python3 /tmp/ui_node.py "$OUT/04g-about.xml" > "$OUT/04g-about.json"
  grep -Fq "About RotorCalculator" "$OUT/04g-about.json"
  python3 /tmp/tap_text.py "OK"
  sleep 0.3

  # Factory presets are restored from Settings; custom rotors must remain.
  open_menu_item "Settings"
  python3 /tmp/tap_text.py "RESTORE"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/04h-restore-dialog.xml" > "$OUT/04h-restore-dialog.json"
  grep -Fq "Restore Factory Presets" "$OUT/04h-restore-dialog.json"
  grep -Fq "Restore now" "$OUT/04h-restore-dialog.json"
  grep -Fq "Export a backup first" "$OUT/04h-restore-dialog.json"
  python3 /tmp/tap_text.py "Restore now"
  sleep 0.8
  close_settings
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/04h-after-factory-restore.xml" > "$OUT/04h-after-factory-restore.json"
  grep -Fq '"text": "▾"' "$OUT/04h-after-factory-restore.json"
  open_rotor_sheet
  python3 /tmp/ui_node.py "$OUT/04h2-rotor-sheet.xml" > "$OUT/04h2-rotor-sheet.json"
  grep -Fqi "Black Hawk Copy 2" "$OUT/04h2-rotor-sheet.json"
  grep -Fq "Sikorsky UH-60 Black Hawk" "$OUT/04h2-rotor-sheet.json"
  python3 /tmp/tap_text.py "Cancel"
  sleep 0.4

  python3 /tmp/tap_text.py CONDITIONS
  sleep 0.8

  # Explicit equivalent-flow selectors: the label opens the selector sheet.
  python3 /tmp/tap_text.py "Advance Ratio"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/05-horizontal-sheet.xml" > "$OUT/05-horizontal-sheet.json"
  grep -Fq "Horizontal Flow Input" "$OUT/05-horizontal-sheet.json"
  python3 /tmp/tap_text.py "Forward Airspeed Vx"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/05-horizontal-vx.xml" > "$OUT/05-horizontal-vx.json"
  grep -Eq '"text": "Airspeed Vx' "$OUT/05-horizontal-vx.json"

  python3 /tmp/tap_text.py "Disk AoA"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/06-axial-sheet.xml" > "$OUT/06-axial-sheet.json"
  grep -Fq "Axial Flow Input" "$OUT/06-axial-sheet.json"
  python3 /tmp/tap_text.py "Climb Speed Vz"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/06-axial-vz.xml" > "$OUT/06-axial-vz.json"
  grep -Eq '"text": "Climb Speed Vz' "$OUT/06-axial-vz.json"
  python3 /tmp/tap_text.py "Climb Speed"
  sleep 0.4
  python3 /tmp/tap_text.py "Axial Flow Ratio μz"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/07-axial-muz.xml" > "$OUT/07-axial-muz.json"
  grep -Eq '"text": "Axial Ratio μz' "$OUT/07-axial-muz.json"

  # All six operating pairs are reachable from one explicit selector.
  tap_text_scrolling "Ω + CT" 393 873
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/07b-pair-sheet.xml" > "$OUT/07b-pair-sheet.json"
  grep -Fq "prescribe any two" "$OUT/07b-pair-sheet.json"
  python3 /tmp/tap_text.py "Cancel"
  sleep 0.3
  local pair_short="Ω + CT" pair_spec pair_item pair_new
  for pair_spec in \
    "Rotor Speed Ω + Collective Δθ|Ω + Δθ" \
    "Rotor Speed Ω + Target CT|Ω + CT" \
    "Rotor Speed Ω + Target Thrust T|Ω + T" \
    "Collective Δθ + Target CT|Δθ + CT" \
    "Collective Δθ + Target Thrust T|Δθ + T" \
    "Target CT + Target Thrust T|CT + T" \
    "Rotor Speed Ω + Target CT|Ω + CT"; do
    pair_item="${pair_spec%|*}"
    pair_new="${pair_spec#*|}"
    python3 /tmp/tap_text.py "$pair_short"
    sleep 0.4
    python3 /tmp/tap_text.py "$pair_item"
    sleep 0.6
    python3 /tmp/ui_node.py "$OUT/07c-pair.xml" > "$OUT/07c-pair.json"
    grep -Fq "\"text\": \"$pair_new\"" "$OUT/07c-pair.json"
    echo "Verified operating pair: $pair_item -> $pair_new"
    pair_short="$pair_new"
  done

  tap_text_scrolling "Coleman FG" 393 873
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/08-inflow-sheet.xml" > "$OUT/08-inflow-sheet.json"
  grep -Fq "Inflow Model" "$OUT/08-inflow-sheet.json"
  grep -Fq "Uniform Inflow" "$OUT/08-inflow-sheet.json"
  python3 /tmp/tap_text.py "Drees"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/08-models.xml" > "$OUT/08-models.json"
  grep -Fq '"text": "Drees"' "$OUT/08-models.json"
  grep -Fq '"text": "Num. Vec."' "$OUT/08-models.json"
  # The single drag-integration method opens its description.
  python3 /tmp/tap_text.py "Num. Vec."
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/08b-drag-help.xml" > "$OUT/08b-drag-help.json"
  grep -Fq "Numerical Vectorial" "$OUT/08b-drag-help.json"
  python3 /tmp/tap_text.py "×"
  sleep 0.3

  # Results exposes all coefficients together and the complete operating solution.
  python3 /tmp/tap_text.py RESULTS
  sleep 0.8
  assert_text_scrolling_down "$OUT" '"text": "Thrust T"' 393 873 "09-thrust"
  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" 393 873 "09-coefficients"
  assert_text_scrolling_down "$OUT" '"text": "Thrust Coefficient CT"' 393 873 "10-ct"
  assert_text_scrolling_down "$OUT" '"text": "Rotor Speed Ω"' 393 873 "11-solved-rpm"
  assert_text_scrolling_down "$OUT" '"text": "Collective Pitch Δθ"' 393 873 "12-solved-collective"
  assert_text_scrolling_down "$OUT" "MODEL STATUS" 393 873 "13-model-status"

  # Settings: exercise all persistent presentation options.
  open_menu_item "Settings"
  python3 /tmp/ui_node.py "$OUT/14-settings-dark.xml" > "$OUT/14-settings-dark.json"
  grep -Fq '"text": "SETTINGS"' "$OUT/14-settings-dark.json"
  grep -Fqi "Import Geometries" "$OUT/14-settings-dark.json"
  grep -Fqi "Export Geometries" "$OUT/14-settings-dark.json"
  grep -Fqi "Restore Factory Presets" "$OUT/14-settings-dark.json"
  grep -Fq '"text": "DARK"' "$OUT/14-settings-dark.json"
  grep -Fq '"text": "SI"' "$OUT/14-settings-dark.json"
  grep -Fq '"text": "STANDARD"' "$OUT/14-settings-dark.json"
  grep -Fq '"text": "Aero"' "$OUT/14-settings-dark.json"

  # SAF geometry backup/sharing must open the real Android document picker.
  python3 /tmp/tap_text.py "IMPORT"
  assert_document_picker "$OUT" "14e-import-picker" ""
  python3 /tmp/tap_text.py "EXPORT"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14f-export-format.xml" > "$OUT/14f-export-format.json"
  grep -Fq "JSON (.json)" "$OUT/14f-export-format.json"
  grep -Fq "Text (.txt)" "$OUT/14f-export-format.json"
  python3 /tmp/tap_text.py "JSON (.json)"
  assert_document_picker "$OUT" "14f-export-json-picker" "rotorcalculator_geometries.json"
  python3 /tmp/tap_text.py "EXPORT"
  sleep 0.5
  python3 /tmp/tap_text.py "Text (.txt)"
  assert_document_picker "$OUT" "14f-export-picker" "rotorcalculator_geometries.txt"

  # QA-6: perform a real geometry export/import round-trip through Android SAF.
  # A temporary user rotor is exported, deleted locally, imported back, then its
  # editable numeric fields are compared before/after to prove value preservation.
  close_settings
  wait_geometry_ready "$OUT" 393 873
  open_rotor_sheet
  python3 /tmp/tap_text.py "New Rotor"
  sleep 0.6
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/extract_edit_values.py "$OUT/14g-roundtrip-before-top.txt"
  for _ in 1 2 3 4 5 6; do
    adb shell input swipe 196 700 196 220 240 || true
    sleep 0.12
  done
  python3 /tmp/extract_edit_values.py "$OUT/14h-roundtrip-before-bottom.txt"
  tap_text_scrolling "SAVE" 393 873
  sleep 0.7
  adb shell rm -f /sdcard/Download/rotorcalculator_geometries.txt || true
  open_menu_item "Settings"
  python3 /tmp/tap_text.py "EXPORT"
  sleep 0.5
  python3 /tmp/tap_text.py "Text (.txt)"
  save_document_picker "$OUT" "14i-export-roundtrip" "rotorcalculator_geometries.txt"
  close_settings
  wait_geometry_ready "$OUT" 393 873
  tap_text_scrolling "DELETE" 393 873
  sleep 0.4
  python3 /tmp/tap_text.py "Delete"
  sleep 0.6
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/ui_node.py "$OUT/14j-after-roundtrip-delete.xml" > "$OUT/14j-after-roundtrip-delete.json"
  ! grep -Fq '"text": "Custom Rotor"' "$OUT/14j-after-roundtrip-delete.json"
  open_menu_item "Settings"
  python3 /tmp/tap_text.py "IMPORT"
  open_document_picker_file "rotorcalculator_geometries.txt"
  sleep 0.6
  python3 /tmp/ui_node.py "$OUT/14k-roundtrip-found.xml" > "$OUT/14k-roundtrip-found.json"
  grep -Fqi "valid geometries" "$OUT/14k-roundtrip-found.json"
  python3 /tmp/tap_text.py "Import"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/14k2-conflicts.xml" > "$OUT/14k2-conflicts.json"
  grep -Fq "Name Conflicts" "$OUT/14k2-conflicts.json"
  python3 /tmp/tap_text.py "Skip same-name imported geometries"
  sleep 0.8
  close_settings
  wait_geometry_ready "$OUT" 393 873
  open_rotor_sheet
  python3 /tmp/ui_node.py "$OUT/14l-roundtrip-restored.xml" > "$OUT/14l-roundtrip-restored.json"
  grep -Fq '"text": "Custom Rotor"' "$OUT/14l-roundtrip-restored.json"
  python3 /tmp/tap_text.py "Custom Rotor"
  sleep 0.5
  wait_geometry_ready "$OUT" 393 873
  python3 /tmp/extract_edit_values.py "$OUT/14m-roundtrip-after-top.txt"
  cmp "$OUT/14g-roundtrip-before-top.txt" "$OUT/14m-roundtrip-after-top.txt"
  for _ in 1 2 3 4 5 6; do
    adb shell input swipe 196 700 196 220 240 || true
    sleep 0.12
  done
  python3 /tmp/extract_edit_values.py "$OUT/14n-roundtrip-after-bottom.txt"
  cmp "$OUT/14h-roundtrip-before-bottom.txt" "$OUT/14n-roundtrip-after-bottom.txt"

  # QA-6: live import must reject malformed and syntactically valid out-of-domain files.
  printf '%s\n' 'not-a-rotorcalculator-database' | adb shell 'cat > /sdcard/Download/rotorcalculator_malformed.txt'
  printf '%s\n' 'ROTORCALCULATOR_GEOMETRIES|2' 'R|Out Of Domain|75|4|0.10|0.50|0.40|0.20|0.10|6.0|0.01|fixed|0.97|1' | adb shell 'cat > /sdcard/Download/rotorcalculator_out_of_domain.txt'
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/rotorcalculator_malformed.txt >/dev/null || true
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/rotorcalculator_out_of_domain.txt >/dev/null || true
  open_menu_item "Settings"
  python3 /tmp/tap_text.py "IMPORT"
  open_document_picker_file "rotorcalculator_malformed.txt"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14o-malformed-rejected.xml" > "$OUT/14o-malformed-rejected.json"
  grep -Fqi "No valid RotorCalculator geometries" "$OUT/14o-malformed-rejected.json"
  python3 /tmp/tap_text.py "OK"
  sleep 0.3
  python3 /tmp/tap_text.py "IMPORT"
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
  grep -Fq '"text": "IMPERIAL"' "$OUT/14a-settings-options.json"
  grep -Fq '"text": "+1 DECIMAL"' "$OUT/14a-settings-options.json"

  # Tapping the current DARK theme opens the theme sheet; Light rebuilds the UI.
  python3 /tmp/tap_text.py "DARK"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/14a2-theme-sheet.xml" > "$OUT/14a2-theme-sheet.json"
  grep -Fq "Midnight Blue" "$OUT/14a2-theme-sheet.json"
  grep -Fq "Sepia" "$OUT/14a2-theme-sheet.json"
  python3 /tmp/tap_text.py "Light"
  sleep 1.2
  assert_app_alive

  # The Settings page stays open and shows the live state.
  python3 /tmp/ui_node.py "$OUT/14c-settings-light.xml" > "$OUT/14c-settings-light.json"
  grep -Fq '"text": "LIGHT"' "$OUT/14c-settings-light.json"
  grep -Fq '"text": "IMPERIAL"' "$OUT/14c-settings-light.json"
  grep -Fq '"text": "+1 DECIMAL"' "$OUT/14c-settings-light.json"
  close_settings
  safe_screencap "$OUT/14b-portrait-light.png"

  # Cold restart must preserve theme, units and precision.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  open_menu_item "Settings"
  python3 /tmp/ui_node.py "$OUT/14d-settings-after-restart.xml" > "$OUT/14d-settings-after-restart.json"
  grep -Fq '"text": "LIGHT"' "$OUT/14d-settings-after-restart.json"
  grep -Fq '"text": "IMPERIAL"' "$OUT/14d-settings-after-restart.json"
  grep -Fq '"text": "+1 DECIMAL"' "$OUT/14d-settings-after-restart.json"
  close_settings

  # Universal sweep: Y output, curve family, family values, X axis, range, trim and exports.
  python3 /tmp/tap_text.py RESULTS
  sleep 0.3
  scroll_to_top 393 873
  tap_text_scrolling "PARAMETER SWEEP" 393 873
  sleep 1
  python3 /tmp/ui_node.py "$OUT/15-sweep.xml" > "$OUT/15-sweep.json"
  grep -Fq "Torque Coefficient CQ ▾" "$OUT/15-sweep.json"
  grep -Fq "Curves" "$OUT/15-sweep.json"
  grep -Fq "Models ▾" "$OUT/15-sweep.json"
  grep -Fq "X axis" "$OUT/15-sweep.json"
  grep -Fq "Range" "$OUT/15-sweep.json"
  grep -Fq "≤ 0.40 ▾" "$OUT/15-sweep.json"
  grep -Fq "Trim" "$OUT/15-sweep.json"
  grep -Fq "Δθ All ▾" "$OUT/15-sweep.json"
  grep -Fq "Active point" "$OUT/15-sweep.json"
  grep -Fq '"text": "TABLE"' "$OUT/15-sweep.json"
  grep -Fq '"text": "CSV"' "$OUT/15-sweep.json"
  grep -Fq '"text": "PNG"' "$OUT/15-sweep.json"
  safe_screencap "$OUT/15-sweep.png"

  # Plot export must reach the real CREATE_DOCUMENT picker, not just expose buttons.
  python3 /tmp/tap_text.py "CSV"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/15a0-csv-sheet.xml" > "$OUT/15a0-csv-sheet.json"
  grep -Fq "Current Chart CSV" "$OUT/15a0-csv-sheet.json"
  grep -Fq "Full Dataset CSV" "$OUT/15a0-csv-sheet.json"
  python3 /tmp/tap_text.py "Current Chart CSV"
  assert_document_picker "$OUT" "15a-csv-picker" "_sweep.csv"
  python3 /tmp/tap_text.py "CSV"
  sleep 0.5
  python3 /tmp/tap_text.py "Full Dataset CSV"
  assert_document_picker "$OUT" "15a2-csv-full-picker" ".csv"
  python3 /tmp/tap_text.py "PNG"
  assert_document_picker "$OUT" "15b-png-picker" "_sweep.png"

  # Trim sheet: every mode is reachable while a trim-requiring pair is active.
  python3 /tmp/tap_text.py "Δθ All ▾"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/15c-trim-sheet.xml" > "$OUT/15c-trim-sheet.json"
  grep -Fq "Sweep Trim" "$OUT/15c-trim-sheet.json"
  grep -Fq "No Trim (Fixed Controls)" "$OUT/15c-trim-sheet.json"
  python3 /tmp/tap_text.py "Trim Rotor Speed Ω · Hover Only"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/15c-trim-hover-on.xml" > "$OUT/15c-trim-hover-on.json"
  grep -Fq "Ω Hover ▾" "$OUT/15c-trim-hover-on.json"
  python3 /tmp/tap_text.py "Ω Hover ▾"
  sleep 0.4
  python3 /tmp/tap_text.py "No Trim (Fixed Controls)"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/15d-trim-none.xml" > "$OUT/15d-trim-none.json"
  grep -Fq "None ▾" "$OUT/15d-trim-none.json"
  python3 /tmp/tap_text.py "None ▾"
  sleep 0.4
  python3 /tmp/tap_text.py "Trim Collective Δθ · Every Point"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/15e-trim-default.xml" > "$OUT/15e-trim-default.json"
  grep -Fq "Δθ All ▾" "$OUT/15e-trim-default.json"

  python3 /tmp/tap_text.py "Models ▾"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/16-family-sheet.xml" > "$OUT/16-family-sheet.json"
  grep -Fq "Curve Family" "$OUT/16-family-sheet.json"
  grep -Fq "Inflow Models" "$OUT/16-family-sheet.json"
  python3 /tmp/tap_text.py "Rotor α Family"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/16-family-alpha.xml" > "$OUT/16-family-alpha.json"
  grep -Fq "α Set ▾" "$OUT/16-family-alpha.json"
  python3 /tmp/tap_text.py "α Set ▾"
  sleep 0.4
  python3 /tmp/tap_text.py "Edit Family Values…"
  sleep 0.4
  python3 /tmp/ui_node.py "$OUT/16-family-values.xml" > "$OUT/16-family-values.json"
  grep -Fq "α FAMILY VALUES" "$OUT/16-family-values.json"
  python3 /tmp/set_first_edit_text.py '1%s2%s4%s8'
  adb shell input keyevent 4
  sleep 0.2
  python3 /tmp/tap_text.py "APPLY"
  sleep 0.8
  python3 /tmp/ui_node.py "$OUT/16a-family-values-applied.xml" > "$OUT/16a-family-values-applied.json"
  ! grep -Fq "α FAMILY VALUES" "$OUT/16a-family-values-applied.json"
  grep -Fq "α Set ▾" "$OUT/16a-family-values-applied.json"
  # The table lists one column group per applied family value.
  python3 /tmp/tap_text.py "TABLE"
  sleep 0.8
  python3 /tmp/ui_node.py "$OUT/16b-family-table.xml" > "$OUT/16b-family-table.json"
  grep -Fq "α=1°" "$OUT/16b-family-table.json"
  grep -Fq "α=8°" "$OUT/16b-family-table.json"
  adb shell input keyevent 4
  sleep 0.4
  assert_app_alive

  # Every family selector must be reachable without crashing the sweep.
  python3 /tmp/tap_text.py "α Set ▾"
  sleep 0.3
  python3 /tmp/tap_text.py "Axial Vz Family"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/16c-vz-family.xml" > "$OUT/16c-vz-family.json"
  grep -Fq "Vz Set ▾" "$OUT/16c-vz-family.json"
  python3 /tmp/tap_text.py "Vz Set ▾"
  sleep 0.3
  python3 /tmp/tap_text.py "Axial μz Family"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/16d-muz-family.xml" > "$OUT/16d-muz-family.json"
  grep -Fq "μz Set ▾" "$OUT/16d-muz-family.json"
  python3 /tmp/tap_text.py "μz Set ▾"
  sleep 0.3
  python3 /tmp/tap_text.py "Active Only"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/16e-active-only.xml" > "$OUT/16e-active-only.json"
  grep -Fq "Active ▾" "$OUT/16e-active-only.json"
  assert_app_alive

  # QA-4: exercise sweep Y outputs of every group, not just the default CQ.
  # Active Only stays selected during this catalog walk so each selection is a single-curve solve.
  local current_y="Torque Coefficient CQ"
  local sweep_y_labels=(
    "Thrust Coefficient CT"
    "Blade Loading CT/σTR"
    "Induced Torque Coefficient CQi"
    "Profile Torque Coefficient CQ0"
    "In-Plane Force Coefficient CH"
    "Induced In-Plane Force Coefficient CHi"
    "Profile In-Plane Force Coefficient CH0"
    "Side Force Coefficient CY"
    "Roll Moment Coefficient CMx"
    "Pitch Moment Coefficient CMy"
    "Air Power Coefficient CPair"
    "Total Inflow Ratio λ"
    "Induced Inflow Ratio λᵢ"
    "Advance-to-Inflow Ratio μ/λ"
    "Hover Inflow Ratio λh"
    "Mean Lift Coefficient C̄L"
    "Induced Speed Vᵢ"
    "Total Axial Speed Vz,tot"
    "Advancing Speed Vadv"
    "Retreating Mach Mret"
    "Advancing AoA 25% αadv,25"
    "Retreating AoA Tip αret,tip"
    "Advancing Inflow Angle 50% φadv,50"
    "Retreating Inflow Angle Tip φret,tip"
    "Dynamic Thrust Coefficient Tc"
    "Dynamic Power Coefficient Pc"
    "Effective Lift/Drag Ratio (L/D)ₑ"
    "Figure of Merit (hover only) FM"
    "Longitudinal Inflow Gradient Kₓ"
    "Lateral Inflow Gradient Ky"
    "Wake Skew Angle χ"
    "Advancing Tip Mach Madv"
    "Shaft Power P"
    "Thrust T"
    "Shaft Torque Q"
    "In-Plane Force H"
    "Induced Power Pᵢ"
    "Profile Power P₀"
    "Air Power Pair"
    "Tip-Loss Factor B"
    "Tip Speed ΩR"
    "Rotor Speed Ω"
    "Collective Pitch Δθ"
    "Advance Ratio μₓ"
    "Forward Airspeed Vₓ"
    "Axial Flow Ratio μz"
    "Climb Speed Vz"
    "Disk Angle of Attack α"
    "Pressure Altitude Hp"
    "Outside Air Temperature OAT"
    "Air Density ρ"
    "Ambient Pressure p"
    "Speed of Sound a"
  )
  local target_y
  for target_y in "${sweep_y_labels[@]}"; do
    python3 /tmp/tap_text.py "$current_y ▾"
    sleep 0.2
    tap_text_scrolling "$target_y" 393 873
    sleep 0.35
    assert_app_alive
    python3 /tmp/ui_node.py "$OUT/16f-sweep-y-current.xml" > "$OUT/16f-sweep-y-current.json"
    grep -Fq "$target_y ▾" "$OUT/16f-sweep-y-current.json"
    echo "Verified sweep Y: $target_y"
    current_y="$target_y"
  done

  python3 /tmp/tap_text.py "μx ▾"
  sleep 0.3
  python3 /tmp/ui_node.py "$OUT/17-axis-sheet.xml" > "$OUT/17-axis-sheet.json"
  grep -Fq "Sweep Axis" "$OUT/17-axis-sheet.json"
  python3 /tmp/tap_text.py "Forward Airspeed Vx"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/17-axis-vx.xml" > "$OUT/17-axis-vx.json"
  grep -Fq 'X axis\nVx ▾' "$OUT/17-axis-vx.json"
  python3 /tmp/tap_text.py "≤ 0.40 ▾"
  sleep 0.3
  python3 /tmp/tap_text.py "μx max = 0.60"
  sleep 0.5
  python3 /tmp/ui_node.py "$OUT/17a-range.xml" > "$OUT/17a-range.json"
  grep -Fq "≤ 0.60 ▾" "$OUT/17a-range.json"
  python3 /tmp/tap_text.py "TABLE"
  sleep 0.7
  python3 /tmp/ui_node.py "$OUT/17-sweep-table.xml" > "$OUT/17-sweep-table.json"
  grep -Fq "x columns stay frozen" "$OUT/17-sweep-table.json"
  grep -Fq "Speed of Sound a" "$OUT/17-sweep-table.json"
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
  assert_text_scrolling_down "$OUT" "Ω + CT" 873 393 "18b-pair"
  assert_text_scrolling_down "$OUT" '"text": "Drees"' 873 393 "18c-inflow"

  # Switch back to DARK while still landscape and capture the same orientation.
  open_menu_item "Settings" 873 393
  tap_text_scrolling "LIGHT" 873 393
  sleep 0.5
  tap_text_scrolling "Dark" 873 393
  sleep 1.0
  assert_app_alive
  safe_screencap "$OUT/18d-landscape-dark.png"
  python3 /tmp/ui_node.py "$OUT/18d-landscape-dark.xml" > "$OUT/18d-landscape-dark.json"
  grep -Fq '"text": "DARK"' "$OUT/18d-landscape-dark.json"

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
