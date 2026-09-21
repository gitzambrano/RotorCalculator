#!/usr/bin/env bash
set -euo pipefail

APK="ci-apk/RotorCalculator-ci.apk"
test -f "$APK"
adb install -r "$APK"

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

  adb exec-out screencap -p > "$OUT/01-geometry-top.png"
  python /tmp/ui_node.py "$OUT/01-geometry-top.xml" > "$OUT/01-geometry-top.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb exec-out screencap -p > "$OUT/02-geometry-bottom.png"
  python /tmp/ui_node.py "$OUT/02-geometry-bottom.xml" > "$OUT/02-geometry-bottom.json"

  python /tmp/tap_text.py CONDITIONS
  sleep 1
  adb exec-out screencap -p > "$OUT/03-conditions-top.png"
  python /tmp/ui_node.py "$OUT/03-conditions-top.xml" > "$OUT/03-conditions-top.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/3)) 300 || true
  adb exec-out screencap -p > "$OUT/04-conditions-bottom.png"
  python /tmp/ui_node.py "$OUT/04-conditions-bottom.xml" > "$OUT/04-conditions-bottom.json"

  python /tmp/tap_text.py RESULTS
  sleep 1
  adb exec-out screencap -p > "$OUT/05-results-top.png"
  python /tmp/ui_node.py "$OUT/05-results-top.xml" > "$OUT/05-results-top.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb exec-out screencap -p > "$OUT/06-results-mid.png"
  python /tmp/ui_node.py "$OUT/06-results-mid.xml" > "$OUT/06-results-mid.json"

  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb shell input swipe $((W/2)) $((H*4/5)) $((W/2)) $((H/4)) 300 || true
  adb exec-out screencap -p > "$OUT/07-results-bottom.png"
  python /tmp/ui_node.py "$OUT/07-results-bottom.xml" > "$OUT/07-results-bottom.json"

  adb shell input swipe $((W/2)) $((H/4)) $((W/2)) $((H*9/10)) 250 || true
  adb shell input swipe $((W/2)) $((H/4)) $((W/2)) $((H*9/10)) 250 || true
  adb shell input swipe $((W/2)) $((H/4)) $((W/2)) $((H*9/10)) 250 || true
  python /tmp/tap_text.py "OPEN PARAMETER SWEEP"
  sleep 1
  adb exec-out screencap -p > "$OUT/08-sweep.png"
  python /tmp/ui_node.py "$OUT/08-sweep.xml" > "$OUT/08-sweep.json"

  python /tmp/check_bounds.py "$OUT/01-geometry-top.png" "$OUT"
  adb shell am force-stop flightdyn.rotorcalculator
}


functional_smoke() {
  local OUT="qa-results/functional-smoke"
  mkdir -p "$OUT"

  # Start from factory state on a representative phone.
  adb shell pm clear flightdyn.rotorcalculator >/dev/null
  adb shell wm size 393x873
  adb shell wm density 160
  adb shell settings put system font_scale 1.0
  adb shell settings put system accelerometer_rotation 0
  adb shell settings put system user_rotation 0
  adb shell monkey -p flightdyn.rotorcalculator -c android.intent.category.LAUNCHER 1 >/dev/null
  sleep 2
  adb shell pidof flightdyn.rotorcalculator > "$OUT/pid.txt"
  test -s "$OUT/pid.txt"

  # Factory geometry, duplicate/persistence, tip-loss model selection, compressibility and airfoil.
  python /tmp/tap_text.py "COPY"
  sleep 1
  python /tmp/ui_node.py "$OUT/01-after-copy.xml" > "$OUT/01-after-copy.json"
  grep -qi "(Copy)" "$OUT/01-after-copy.json"

  python /tmp/tap_text.py "Sissingh: ON"
  sleep 1
  python /tmp/tap_text.py "Fixed B"
  sleep 1
  python /tmp/ui_node.py "$OUT/02-fixed-tip-loss.xml" > "$OUT/02-fixed-tip-loss.json"
  grep -qi "Fixed B=0.97" "$OUT/02-fixed-tip-loss.json"

  python /tmp/tap_text.py "Prandtl-Glauert: ON"
  sleep 1
  python /tmp/ui_node.py "$OUT/03-compress-off.xml" > "$OUT/03-compress-off.json"
  grep -qi "Prandtl-Glauert: OFF" "$OUT/03-compress-off.json"

  python /tmp/tap_text.py "Custom Section"
  sleep 1
  python /tmp/tap_text.py "NACA 0012"
  sleep 1
  python /tmp/ui_node.py "$OUT/04-airfoil.xml" > "$OUT/04-airfoil.json"
  grep -qi "NACA 0012" "$OUT/04-airfoil.json"

  # Conditions/model controls and explicit trim state.
  python /tmp/tap_text.py "CONDITIONS"
  sleep 1
  python /tmp/ui_node.py "$OUT/05-conditions.xml" > "$OUT/05-conditions.json"
  grep -qi "Collective to CT" "$OUT/05-conditions.json"

  python /tmp/tap_text.py "Coleman-Feingold"
  sleep 1
  python /tmp/ui_node.py "$OUT/06-inflow-cycle.xml" > "$OUT/06-inflow-cycle.json"
  grep -qi "Drees Linear" "$OUT/06-inflow-cycle.json"

  python /tmp/tap_text.py "Numerical Vectorial"
  sleep 1
  python /tmp/ui_node.py "$OUT/07-drag-cycle.xml" > "$OUT/07-drag-cycle.json"
  grep -qi "Analytical Tangential" "$OUT/07-drag-cycle.json"

  python /tmp/tap_text.py "Collective to CT"
  sleep 1
  python /tmp/ui_node.py "$OUT/08-manual-trim.xml" > "$OUT/08-manual-trim.json"
  grep -qi "Manual Pitch" "$OUT/08-manual-trim.json"
  python /tmp/tap_text.py "Manual Pitch"
  sleep 1
  python /tmp/ui_node.py "$OUT/09-collective-trim.xml" > "$OUT/09-collective-trim.json"
  grep -qi "Collective to CT" "$OUT/09-collective-trim.json"

  # Rotation must preserve the active page and conditions/model state.
  adb shell settings put system user_rotation 1
  sleep 2
  python /tmp/ui_node.py "$OUT/10-rotated.xml" > "$OUT/10-rotated.json"
  grep -qi "CONDITIONS" "$OUT/10-rotated.json"
  grep -qi "Drees Linear" "$OUT/10-rotated.json"
  adb shell settings put system user_rotation 0
  sleep 2

  # Results must render and unit toggle must switch the dimensional outputs.
  python /tmp/tap_text.py "RESULTS"
  sleep 1
  python /tmp/ui_node.py "$OUT/11-results-si.xml" > "$OUT/11-results-si.json"
  grep -qi "kW" "$OUT/11-results-si.json"

  # Header menu anchor is the 48dp area at the upper-right of a 393dp viewport.
  adb shell input tap 369 28
  sleep 1
  python /tmp/tap_text.py "Toggle Result Units"
  sleep 1
  python /tmp/ui_node.py "$OUT/12-results-imperial.xml" > "$OUT/12-results-imperial.json"
  grep -qi "lbf" "$OUT/12-results-imperial.json"
  grep -qi "HP" "$OUT/12-results-imperial.json"

  # Sweep opens, renders, and closes using the Back key.
  python /tmp/tap_text.py "OPEN PARAMETER SWEEP"
  sleep 2
  adb exec-out screencap -p > "$OUT/13-sweep.png"
  python /tmp/ui_node.py "$OUT/13-sweep.xml" > "$OUT/13-sweep.json"
  grep -qi "PARAMETER SWEEP" "$OUT/13-sweep.json"
  adb shell input keyevent 4
  sleep 1
  python /tmp/ui_node.py "$OUT/14-after-sweep-back.xml" > "$OUT/14-after-sweep-back.json"
  grep -qi "RESULTS" "$OUT/14-after-sweep-back.json"

  # Delete the duplicated custom preset with confirmation.
  python /tmp/tap_text.py "GEOMETRY"
  sleep 1
  adb shell input tap 369 28
  sleep 1
  python /tmp/tap_text.py "Delete Active Rotor"
  sleep 1
  python /tmp/tap_text.py "DELETE"
  sleep 1
  python /tmp/ui_node.py "$OUT/15-after-delete.xml" > "$OUT/15-after-delete.json"
  if grep -qi "(Copy)" "$OUT/15-after-delete.json"; then
    echo "Duplicated rotor still visible after delete" >&2
    return 1
  fi

  adb exec-out screencap -p > "$OUT/16-final.png"
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
