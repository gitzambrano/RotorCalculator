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
  adb shell pidof flightdyn.rotorcalculator > "$OUT/pid.txt"
  test -s "$OUT/pid.txt"

  safe_screencap "$OUT/01-rotor-list.png"
  python /tmp/ui_node.py "$OUT/01-rotor-list.xml" > "$OUT/01-rotor-list.json"

  # Prove that the rotor list itself remains scrollable on the shortest landscape/phone layouts.
  for _ in 1 2 3 4 5; do
    adb shell input swipe $((W/2)) $((H*3/5)) $((W/2)) $((H/4)) 220 || true
  done
  python /tmp/ui_node.py "$OUT/01b-rotor-list-bottom.xml" > "$OUT/01b-rotor-list-bottom.json"
  grep -qi "eVTOL Conceptual Rotor" "$OUT/01b-rotor-list-bottom.json"
  # Relaunch instead of trying to reverse an arbitrary ScrollView offset. This
  # resets the list deterministically on every aspect ratio and also exercises
  # cold-resume persistence before opening the active rotor.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 1
  assert_app_alive
  python /tmp/ui_node.py "$OUT/01c-rotor-list-after-relaunch.xml" > "$OUT/01c-rotor-list-after-relaunch.json"
  grep -qi "Sikorsky UH-60 Black Hawk" "$OUT/01c-rotor-list-after-relaunch.json"

  python /tmp/tap_text.py "Sikorsky UH-60 Black Hawk"
  sleep 1
  safe_screencap "$OUT/02-geometry-popup-top.png"
  python /tmp/ui_node.py "$OUT/02-geometry-popup-top.xml" > "$OUT/02-geometry-popup-top.json"

  for _ in 1 2 3 4 5; do
    adb shell input swipe $((W/2)) $((H*3/5)) $((W/2)) $((H/4)) 300 || true
    sleep 0.2
  done
  safe_screencap "$OUT/03-geometry-popup-bottom.png"
  python /tmp/ui_node.py "$OUT/03-geometry-popup-bottom.xml" > "$OUT/03-geometry-popup-bottom.json"
  # The compact label intentionally abbreviates "Compressibility"; the control text is invariant.
  grep -qi "Prandtl-Glauert" "$OUT/03-geometry-popup-bottom.json"

  adb shell input keyevent 4
  sleep 1
  python /tmp/tap_text.py CONDITIONS
  sleep 1
  safe_screencap "$OUT/04-conditions-top.png"
  python /tmp/ui_node.py "$OUT/04-conditions-top.xml" > "$OUT/04-conditions-top.json"

  for _ in 1 2 3 4 5; do
    adb shell input swipe $((W/2)) $((H*3/5)) $((W/2)) $((H/4)) 300 || true
    sleep 0.2
  done
  safe_screencap "$OUT/05-conditions-bottom.png"
  python /tmp/ui_node.py "$OUT/05-conditions-bottom.xml" > "$OUT/05-conditions-bottom.json"
  grep -qi "Target CT" "$OUT/05-conditions-bottom.json"

  python /tmp/tap_text.py RESULTS
  sleep 1
  safe_screencap "$OUT/06-results-top.png"
  python /tmp/ui_node.py "$OUT/06-results-top.xml" > "$OUT/06-results-top.json"

  python /tmp/tap_text.py "OPEN PARAMETER SWEEP"
  sleep 1
  safe_screencap "$OUT/09-sweep.png"
  python /tmp/ui_node.py "$OUT/09-sweep.xml" > "$OUT/09-sweep.json"
  adb shell input keyevent 4
  sleep 1
  assert_app_alive
  python /tmp/ui_node.py "$OUT/06b-after-sweep-back.xml" > "$OUT/06b-after-sweep-back.json"
  grep -qi "RESULTS" "$OUT/06b-after-sweep-back.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  safe_screencap "$OUT/07-results-mid.png"
  python /tmp/ui_node.py "$OUT/07-results-mid.xml" > "$OUT/07-results-mid.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  safe_screencap "$OUT/08-results-bottom.png"
  python /tmp/ui_node.py "$OUT/08-results-bottom.xml" > "$OUT/08-results-bottom.json"
  grep -Eqi "Sound Speed|Speed of Sound" "$OUT/08-results-bottom.json"

  python /tmp/check_bounds.py "$OUT/01-rotor-list.png" "$OUT"
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

  python /tmp/tap_text.py "Sikorsky UH-60 Black Hawk"
  sleep 1
  safe_screencap "$OUT/01-geometry-open.png"
  python /tmp/tap_text.py "COPY ROTOR"
  sleep 1
  python /tmp/ui_node.py "$OUT/02-after-copy.xml" > "$OUT/02-after-copy.json"
  grep -qi "(Copy)" "$OUT/02-after-copy.json"
  safe_screencap "$OUT/02-after-copy.png"

  python /tmp/tap_text.py "Sissingh: ON"
  sleep 1
  python /tmp/tap_text.py "Fixed B"
  sleep 1
  python /tmp/ui_node.py "$OUT/03-fixed-tip-loss.xml" > "$OUT/03-fixed-tip-loss.json"
  grep -qi "Fixed B=0.97" "$OUT/03-fixed-tip-loss.json"

  tap_text_scrolling "Prandtl-Glauert: ON" 873 393
  sleep 1
  python /tmp/ui_node.py "$OUT/04-compress-off.xml" > "$OUT/04-compress-off.json"
  grep -qi "Prandtl-Glauert: OFF" "$OUT/04-compress-off.json"

  tap_text_scrolling "Custom Section" 873 393
  sleep 1
  python /tmp/tap_text.py "NACA 0012"
  sleep 1
  python /tmp/ui_node.py "$OUT/05-airfoil.xml" > "$OUT/05-airfoil.json"
  grep -qi "NACA 0012" "$OUT/05-airfoil.json"
  safe_screencap "$OUT/05-airfoil.png"

  adb shell input keyevent 4
  sleep 1
  python /tmp/ui_node.py "$OUT/06-list-with-copy.xml" > "$OUT/06-list-with-copy.json"
  grep -qi "(Copy)" "$OUT/06-list-with-copy.json"
  safe_screencap "$OUT/06-list-with-copy.png"

  # Cold restart: the copied rotor must remain the active selection.
  adb shell am force-stop flightdyn.rotorcalculator
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 2
  python /tmp/ui_node.py "$OUT/06b-list-after-cold-restart.xml" > "$OUT/06b-list-after-cold-restart.json"
  python3 - "$OUT/06b-list-after-cold-restart.json" <<'PY'
import json,sys
nodes=json.load(open(sys.argv[1],encoding="utf-8"))
copies=[n for n in nodes if "(Copy)" in n.get("text","") and n.get("bounds")]
active=[n for n in nodes if n.get("text")=="ACTIVE" and n.get("bounds")]
if not copies or not active:
    raise SystemExit("copy or ACTIVE badge missing after cold restart")
def cy(n):
    b=n["bounds"]; return (b[1]+b[3])/2
if min(abs(cy(c)-cy(a)) for c in copies for a in active) > 28:
    raise SystemExit("ACTIVE badge is not on copied rotor row after cold restart")
PY
  safe_screencap "$OUT/06b-list-after-cold-restart.png"

  python /tmp/tap_text.py CONDITIONS
  sleep 1
  python /tmp/tap_text.py "Coleman-Feingold"
  sleep 1
  python /tmp/tap_text.py "Numerical Vectorial"
  sleep 1
  python /tmp/tap_text.py "Collective to CT"
  sleep 1
  python /tmp/tap_text.py "Manual Pitch"
  sleep 1
  python /tmp/ui_node.py "$OUT/07-condition-models.xml" > "$OUT/07-condition-models.json"
  grep -qi "Drees Linear" "$OUT/07-condition-models.json"
  grep -qi "Analytical Tangential" "$OUT/07-condition-models.json"
  grep -qi "Collective to CT" "$OUT/07-condition-models.json"

  # Force a real live portrait -> landscape resize, not only a rotation flag.
  adb shell settings put system user_rotation 1
  adb shell wm size 873x393
  sleep 2
  # First prove that the activity actually resized to landscape.
  safe_screencap "$OUT/08-rotated.png"
  python3 - "$OUT/08-rotated.png" <<'PY'
import struct,sys
with open(sys.argv[1],"rb") as f:
    h=f.read(24)
w,hh=struct.unpack(">II",h[16:24])
if w <= hh:
    raise SystemExit(f"live rotation did not produce landscape dimensions: {w}x{hh}")
PY
  # A real resize rebuilds the page at scroll position zero. Verify each
  # persisted selection while scrolling in small increments; a single final
  # viewport cannot contain all three controls on a short landscape phone.
  assert_text_scrolling_down "$OUT" "Drees Linear" 873 393 "08b-inflow"
  assert_text_scrolling_down "$OUT" "Analytical Tangential" 873 393 "08c-profile"
  assert_text_scrolling_down "$OUT" "Collective to CT" 873 393 "08d-trim"
  python /tmp/ui_node.py "$OUT/08e-rotated-models-final.xml" > "$OUT/08e-rotated-models-final.json"
  adb shell wm size 393x873
  adb shell settings put system user_rotation 0
  sleep 2

  python /tmp/tap_text.py GEOMETRY
  sleep 1
  grep -qi "(Copy)" <(python /tmp/ui_node.py "$OUT/09-geometry-after-rotation.xml")
  python /tmp/tap_text.py RESULTS
  sleep 1
  adb shell input tap 369 28
  sleep 1
  python /tmp/tap_text.py "Toggle Result Units"
  sleep 1
  python /tmp/ui_node.py "$OUT/10-results-imperial.xml" > "$OUT/10-results-imperial.json"
  grep -qi "lbf" "$OUT/10-results-imperial.json"
  grep -qi "HP" "$OUT/10-results-imperial.json"
  if grep -Eq '"text": "-0([°"]|$)' "$OUT/10-results-imperial.json"; then
    echo "Display-only negative zero found in Results" >&2
    exit 1
  fi
  safe_screencap "$OUT/10-results-imperial.png"

  python /tmp/tap_text.py "OPEN PARAMETER SWEEP"
  sleep 2
  python /tmp/ui_node.py "$OUT/11-sweep.xml" > "$OUT/11-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/11-sweep.json"
  grep -qi "Operating μ = 0.00" "$OUT/11-sweep.json"
  safe_screencap "$OUT/11-sweep.png"
  adb shell input keyevent 4
  sleep 1
  assert_app_alive
  python /tmp/ui_node.py "$OUT/11b-after-sweep-back.xml" > "$OUT/11b-after-sweep-back.json"
  grep -qi "RESULTS" "$OUT/11b-after-sweep-back.json"

  python /tmp/tap_text.py GEOMETRY
  sleep 1
  python /tmp/tap_text.py "Sikorsky UH-60 Black Hawk (Copy)"
  sleep 1
  python /tmp/tap_text.py DELETE
  sleep 1
  python /tmp/tap_text.py DELETE
  sleep 1
  python /tmp/ui_node.py "$OUT/12-after-delete.xml" > "$OUT/12-after-delete.json"
  if grep -qi "(Copy)" "$OUT/12-after-delete.json"; then return 1; fi
  safe_screencap "$OUT/12-after-delete.png"
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
