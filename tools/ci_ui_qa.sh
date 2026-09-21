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
  python /tmp/tap_text.py "OPEN MULTI-PARAMETER"
  sleep 1
  adb exec-out screencap -p > "$OUT/08-sweep.png"
  python /tmp/ui_node.py "$OUT/08-sweep.xml" > "$OUT/08-sweep.json"

  python /tmp/check_bounds.py "$SIZE" "$OUT"
  adb shell am force-stop flightdyn.rotorcalculator
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

adb shell settings put system font_scale 1.0
adb shell wm size reset
adb shell wm density reset
