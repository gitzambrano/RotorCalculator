#!/usr/bin/env bash
set -euo pipefail

APK="ci-apk/RotorCalculator-ci.apk"
test -f "$APK"
adb install -r "$APK"

safe_screencap() {
  local OUTFILE="$1"
  local attempt size
  for attempt in 1 2 3; do
    adb exec-out screencap -p > "$OUTFILE"
    size=$(stat -c%s "$OUTFILE")
    if [ "$size" -gt 8000 ]; then return 0; fi
    echo "Suspicious screenshot ($size bytes), retrying: $OUTFILE" >&2
    sleep 1
  done
  echo "Invalid/black screenshot after retries: $OUTFILE" >&2
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

  python /tmp/tap_text.py "Sikorsky UH-60 Black Hawk"
  sleep 1
  safe_screencap "$OUT/02-geometry-popup-top.png"
  python /tmp/ui_node.py "$OUT/02-geometry-popup-top.xml" > "$OUT/02-geometry-popup-top.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  safe_screencap "$OUT/03-geometry-popup-bottom.png"
  python /tmp/ui_node.py "$OUT/03-geometry-popup-bottom.xml" > "$OUT/03-geometry-popup-bottom.json"

  adb shell input keyevent 4
  sleep 1
  python /tmp/tap_text.py CONDITIONS
  sleep 1
  safe_screencap "$OUT/04-conditions-top.png"
  python /tmp/ui_node.py "$OUT/04-conditions-top.xml" > "$OUT/04-conditions-top.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  safe_screencap "$OUT/05-conditions-bottom.png"
  python /tmp/ui_node.py "$OUT/05-conditions-bottom.xml" > "$OUT/05-conditions-bottom.json"

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

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  safe_screencap "$OUT/07-results-mid.png"
  python /tmp/ui_node.py "$OUT/07-results-mid.xml" > "$OUT/07-results-mid.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  safe_screencap "$OUT/08-results-bottom.png"
  python /tmp/ui_node.py "$OUT/08-results-bottom.xml" > "$OUT/08-results-bottom.json"

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

  adb shell input swipe 196 760 196 430 250
  sleep 1
  python /tmp/tap_text.py "Prandtl-Glauert: ON"
  sleep 1
  python /tmp/ui_node.py "$OUT/04-compress-off.xml" > "$OUT/04-compress-off.json"
  grep -qi "Prandtl-Glauert: OFF" "$OUT/04-compress-off.json"

  python /tmp/tap_text.py "Custom Section"
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

  adb shell settings put system user_rotation 1
  sleep 2
  python /tmp/ui_node.py "$OUT/08-rotated.xml" > "$OUT/08-rotated.json"
  grep -qi "Drees Linear" "$OUT/08-rotated.json"
  safe_screencap "$OUT/08-rotated.png"
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
  safe_screencap "$OUT/10-results-imperial.png"

  python /tmp/tap_text.py "OPEN PARAMETER SWEEP"
  sleep 2
  python /tmp/ui_node.py "$OUT/11-sweep.xml" > "$OUT/11-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/11-sweep.json"
  grep -qi "Operating μ=0.00" "$OUT/11-sweep.json"
  safe_screencap "$OUT/11-sweep.png"
  adb shell input keyevent 4
  sleep 1

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
