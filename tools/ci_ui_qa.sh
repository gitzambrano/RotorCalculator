#!/usr/bin/env bash
set -euo pipefail

APK="ci-apk/RotorCalculator-ci.apk"
test -f "$APK"
adb install -r "$APK"

cat > /tmp/check_dark_png.py <<'PY'
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
if mean < 5 or mean > 160 or std < 8:
    raise SystemExit(1)
PY

safe_screencap() {
  local OUTFILE="$1"
  local attempt size
  for attempt in 1 2 3; do
    adb exec-out screencap -p > "$OUTFILE"
    size=$(stat -c%s "$OUTFILE")
    if [ "$size" -gt 8000 ] && python3 /tmp/check_dark_png.py "$OUTFILE"; then return 0; fi
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

tap_text_scrolling() {
  local TEXT="$1"
  local H="$2"
  local W="$3"
  local attempt
  for attempt in 1 2 3 4; do
    if python /tmp/tap_text.py "$TEXT"; then return 0; fi
    adb shell input swipe $((W/2)) $((H*3/5)) $((W/2)) $((H/4)) 250 || true
    sleep 1
  done
  echo "Could not find text after scrolling: $TEXT" >&2
  return 1
}

assert_text_scrolling_down() {
  local OUTDIR="$1"
  local TEXT="$2"
  local W="$3"
  local H="$4"
  local STEM="$5"
  local attempt
  for attempt in 0 1 2 3 4 5 6; do
    python /tmp/ui_node.py "$OUTDIR/$STEM-$attempt.xml" > "$OUTDIR/$STEM-$attempt.json"
    if grep -Fqi "$TEXT" "$OUTDIR/$STEM-$attempt.json"; then
      echo "Verified after live resize: $TEXT"
      return 0
    fi
    adb shell input swipe $((W/2)) $((H*2/3)) $((W/2)) $((H/3)) 180 || true
    sleep 0.3
  done
  echo "Could not verify persisted text after scrolling: $TEXT" >&2
  return 1
}

capture_screen() {
  local NAME="$1" SIZE="$2" ROT="$3" FONT="$4"
  local OUT="qa-results/$NAME"
  mkdir -p "$OUT"
  local W="${SIZE%x*}"
  local H="${SIZE#*x}"

  adb shell wm size "$SIZE"
  adb shell wm density 160
  adb shell settings put system font_scale "$FONT"
  adb shell settings put system accelerometer_rotation 0
  adb shell settings put system user_rotation "$ROT"
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 2
  assert_app_alive

  # Geometry is the real in-page editor, not a list or popup.
  safe_screencap "$OUT/01-geometry-top.png"
  python /tmp/ui_node.py "$OUT/01-geometry-top.xml" > "$OUT/01-geometry-top.json"
  grep -qi "Loaded rotor:" "$OUT/01-geometry-top.json"
  grep -qi "BLADE GEOMETRY" "$OUT/01-geometry-top.json"

  for _ in 1 2 3 4 5 6; do
    adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 260 || true
    sleep 0.15
  done
  safe_screencap "$OUT/02-geometry-bottom.png"
  python /tmp/ui_node.py "$OUT/02-geometry-bottom.xml" > "$OUT/02-geometry-bottom.json"
  grep -qi "ROTOR AERODYNAMICS" "$OUT/02-geometry-bottom.json"
  grep -qi "LOAD ROTOR" "$OUT/02-geometry-bottom.json"
  grep -qi "SAVE AS NEW" "$OUT/02-geometry-bottom.json"

  python /tmp/tap_text.py CONDITIONS
  sleep 0.8
  safe_screencap "$OUT/03-conditions-top.png"
  python /tmp/ui_node.py "$OUT/03-conditions-top.xml" > "$OUT/03-conditions-top.json"
  grep -qi "Horizontal" "$OUT/03-conditions-top.json"
  grep -qi "Axial" "$OUT/03-conditions-top.json"

  for _ in 1 2 3 4; do
    adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 260 || true
    sleep 0.15
  done
  safe_screencap "$OUT/04-conditions-bottom.png"
  python /tmp/ui_node.py "$OUT/04-conditions-bottom.xml" > "$OUT/04-conditions-bottom.json"
  grep -qi "Operating" "$OUT/04-conditions-bottom.json"
  grep -qi "Numerical Vectorial" "$OUT/04-conditions-bottom.json"

  python /tmp/tap_text.py RESULTS
  sleep 0.8
  safe_screencap "$OUT/05-results-top.png"
  python /tmp/ui_node.py "$OUT/05-results-top.xml" > "$OUT/05-results-top.json"
  grep -qi "DIMENSIONAL PERFORMANCE" "$OUT/05-results-top.json"

  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" "$W" "$H" "06-coefficients"
  assert_text_scrolling_down "$OUT" "OPERATING STATE & ATMOSPHERE" "$W" "$H" "07-operating-state"
  assert_text_scrolling_down "$OUT" "Solved RPM" "$W" "$H" "08-solved-rpm"
  assert_text_scrolling_down "$OUT" "Sound Speed" "$W" "$H" "09-atmosphere-bottom"

  # Reopen Results from the top and inspect the universal sweep.
  python /tmp/tap_text.py RESULTS || true
  sleep 0.3
  tap_text_scrolling "OPEN PARAMETER SWEEP" "$W" "$H"
  sleep 1
  safe_screencap "$OUT/10-sweep.png"
  python /tmp/ui_node.py "$OUT/10-sweep.xml" > "$OUT/10-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/10-sweep.json"
  grep -qi "TABLE" "$OUT/10-sweep.json"
  grep -qi "CSV" "$OUT/10-sweep.json"
  grep -qi "PNG" "$OUT/10-sweep.json"
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  python /tmp/check_bounds.py "$OUT/01-geometry-top.png" "$OUT"
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

  # Geometry editor and explicit save semantics.
  python /tmp/ui_node.py "$OUT/01-geometry.xml" > "$OUT/01-geometry.json"
  grep -qi "Loaded rotor: Sikorsky UH-60 Black Hawk" "$OUT/01-geometry.json"
  tap_text_scrolling "ROTOR AERODYNAMICS" 393 873
  tap_text_scrolling "Sissingh" 393 873
  sleep 0.4
  python /tmp/tap_text.py "Fixed B"
  sleep 0.6
  python /tmp/ui_node.py "$OUT/02-fixed-b.xml" > "$OUT/02-fixed-b.json"
  grep -qi "Fixed B" "$OUT/02-fixed-b.json"

  tap_text_scrolling "Sikorsky SC1095" 393 873
  sleep 0.4
  python /tmp/tap_text.py "NACA 0012"
  sleep 0.6
  tap_text_scrolling "SAVE AS NEW" 393 873
  sleep 0.8
  safe_screencap "$OUT/03-saved-copy.png"
  python /tmp/ui_node.py "$OUT/03-saved-copy.xml" > "$OUT/03-saved-copy.json"
  grep -qi "Loaded rotor:" "$OUT/03-saved-copy.json"

  # Cold restart: the active saved rotor remains loaded.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1.5
  assert_app_alive
  python /tmp/ui_node.py "$OUT/04-after-restart.xml" > "$OUT/04-after-restart.json"
  grep -qi "Loaded rotor:" "$OUT/04-after-restart.json"

  python /tmp/tap_text.py CONDITIONS
  sleep 0.8

  # Explicit equivalent-flow selectors.
  python /tmp/tap_text.py "μ"
  sleep 0.3
  python /tmp/tap_text.py "Vx — forward speed"
  sleep 0.5
  python /tmp/ui_node.py "$OUT/05-horizontal-vx.xml" > "$OUT/05-horizontal-vx.json"
  grep -Eq '"text": "Vx"' "$OUT/05-horizontal-vx.json"

  python /tmp/tap_text.py "α"
  sleep 0.3
  python /tmp/tap_text.py "Vz — climb rate"
  sleep 0.5
  python /tmp/ui_node.py "$OUT/06-axial-vz.xml" > "$OUT/06-axial-vz.json"
  grep -Eq '"text": "Vz"' "$OUT/06-axial-vz.json"
  python /tmp/tap_text.py "Vz"
  sleep 0.3
  python /tmp/tap_text.py "μz — axial ratio"
  sleep 0.5
  python /tmp/ui_node.py "$OUT/07-axial-muz.xml" > "$OUT/07-axial-muz.json"
  grep -Eq '"text": "μz"' "$OUT/07-axial-muz.json"

  # All six operating pairs are reachable from one explicit selector.
  tap_text_scrolling "RPM + CT" 393 873
  sleep 0.3
  python /tmp/tap_text.py "RPM + Collective"
  sleep 0.4
  python /tmp/tap_text.py "RPM + Collective"
  sleep 0.3
  python /tmp/tap_text.py "RPM + Thrust"
  sleep 0.4
  python /tmp/tap_text.py "RPM + Thrust"
  sleep 0.3
  python /tmp/tap_text.py "Collective + CT"
  sleep 0.4
  python /tmp/tap_text.py "Collective + CT"
  sleep 0.3
  python /tmp/tap_text.py "Collective + Thrust"
  sleep 0.4
  python /tmp/tap_text.py "Collective + Thrust"
  sleep 0.3
  python /tmp/tap_text.py "CT + Thrust"
  sleep 0.4
  python /tmp/tap_text.py "CT + Thrust"
  sleep 0.3
  python /tmp/tap_text.py "RPM + CT"
  sleep 0.7

  tap_text_scrolling "Coleman-Feingold" 393 873
  sleep 0.3
  python /tmp/tap_text.py "Drees"
  sleep 0.5
  python /tmp/ui_node.py "$OUT/08-models.xml" > "$OUT/08-models.json"
  grep -qi "Drees" "$OUT/08-models.json"
  grep -qi "Numerical Vectorial" "$OUT/08-models.json"

  # Results exposes all coefficients together and the complete operating solution.
  python /tmp/tap_text.py RESULTS
  sleep 0.8
  assert_text_scrolling_down "$OUT" "AERODYNAMIC COEFFICIENTS" 393 873 "09-coefficients"
  assert_text_scrolling_down "$OUT" "Solved RPM" 393 873 "10-solved-rpm"
  assert_text_scrolling_down "$OUT" "Collective Δθ" 393 873 "11-solved-collective"
  assert_text_scrolling_down "$OUT" "Solved CT" 393 873 "12-solved-ct"
  assert_text_scrolling_down "$OUT" "Solved Thrust" 393 873 "13-solved-thrust"

  # Settings exposes backup/share controls and persistent presentation options.
  adb shell input tap 369 28
  sleep 0.4
  python /tmp/tap_text.py "Settings"
  sleep 0.5
  python /tmp/ui_node.py "$OUT/14-settings.xml" > "$OUT/14-settings.json"
  grep -qi "Import Geometries" "$OUT/14-settings.json"
  grep -qi "Export Geometries" "$OUT/14-settings.json"
  python /tmp/tap_text.py "STANDARD"
  sleep 0.3
  python /tmp/tap_text.py "DARK"
  sleep 1.2
  assert_app_alive

  # Universal sweep: explicit Y, family, VALUES, X axis/range, hover-only trim and exports.
  python /tmp/tap_text.py RESULTS
  sleep 0.3
  tap_text_scrolling "OPEN PARAMETER SWEEP" 393 873
  sleep 1
  python /tmp/ui_node.py "$OUT/15-sweep.xml" > "$OUT/15-sweep.json"
  grep -qi "VALUES" "$OUT/15-sweep.json"
  grep -qi "X · μ" "$OUT/15-sweep.json"
  grep -qi "μ MAX" "$OUT/15-sweep.json"
  grep -qi "TRIM ONLY HOVER" "$OUT/15-sweep.json"
  grep -qi "TABLE" "$OUT/15-sweep.json"
  grep -qi "CSV" "$OUT/15-sweep.json"
  grep -qi "PNG" "$OUT/15-sweep.json"
  safe_screencap "$OUT/15-sweep.png"

  python /tmp/tap_text.py "Inflow Models"
  sleep 0.3
  python /tmp/tap_text.py "Rotor α Family"
  sleep 0.5
  python /tmp/tap_text.py "VALUES"
  sleep 0.4
  python /tmp/ui_node.py "$OUT/16-family-values.xml" > "$OUT/16-family-values.json"
  grep -qi "FAMILY VALUES" "$OUT/16-family-values.json"
  python /tmp/tap_text.py "CANCEL"
  sleep 0.3

  python /tmp/tap_text.py "X · μ"
  sleep 0.3
  python /tmp/tap_text.py "Vx — forward speed"
  sleep 0.5
  python /tmp/tap_text.py "μ MAX"
  sleep 0.3
  python /tmp/tap_text.py "μ max = 0.60"
  sleep 0.5
  python /tmp/tap_text.py "TABLE"
  sleep 0.7
  python /tmp/ui_node.py "$OUT/17-sweep-table.xml" > "$OUT/17-sweep-table.json"
  grep -qi "SWEEP DATA" "$OUT/17-sweep-table.json"
  adb shell input keyevent 4
  adb shell input keyevent 4
  sleep 0.5
  assert_app_alive

  # Live resize/orientation must retain operating pair and session state.
  python /tmp/tap_text.py CONDITIONS
  sleep 0.5
  adb shell settings put system user_rotation 1
  adb shell wm size 873x393
  sleep 2
  safe_screencap "$OUT/18-landscape.png"
  python3 - "$OUT/18-landscape.png" <<'PY'
import struct,sys
with open(sys.argv[1],"rb") as f:
    h=f.read(24)
w,hh=struct.unpack(">II",h[16:24])
if w <= hh:
    raise SystemExit(f"live rotation did not produce landscape dimensions: {w}x{hh}")
PY
  assert_text_scrolling_down "$OUT" "RPM + CT" 873 393 "18b-pair"
  assert_text_scrolling_down "$OUT" "Drees" 873 393 "18c-inflow"

  adb shell wm size 393x873
  adb shell settings put system user_rotation 0
  sleep 1
  assert_app_alive
}

capture_screen compact-320x568 320x568 0 1.0
capture_screen compact-font130-320x568 320x568 0 1.3
capture_screen standard-360x780 360x780 0 1.0
capture_screen modern-393x873 393x873 0 1.0
capture_screen large-412x915 412x915 0 1.0
capture_screen tablet-small-600x960 600x960 0 1.0
capture_screen tablet-768x1024 768x1024 0 1.0
capture_screen landscape-phone-915x412 915x412 1 1.0
capture_screen landscape-tablet-1024x600 1024x600 1 1.0
functional_smoke
adb shell settings put system font_scale 1.0
adb shell wm size reset
adb shell wm density reset
