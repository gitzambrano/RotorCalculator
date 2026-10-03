import json
import sys
from pathlib import Path

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INSP_DIR = Path(__file__).resolve().parent.parent / "scratch" / "eval_screens"
data = json.loads((INSP_DIR / "nodes_inspection.json").read_text(encoding="utf-8"))

out_lines = []
out_lines.append("=== CONFIGURATIONS CAPTURED ===")
for cfg, screens in data.items():
    out_lines.append(f"Config: {cfg}, Screens: {list(screens.keys())}")

out_lines.append("\n=== CHECKING MULTILINE TEXTS IN BUTTONS AND LABELS ===")
multilines = []
for cfg, screens in data.items():
    for scr, nodes in screens.items():
        for n in nodes:
            txt = n.get('text', '')
            if '\n' in txt:
                multilines.append((cfg, scr, n['class'], txt.replace('\n', ' [NL] '), n['bounds']))

out_lines.append(f"Total multiline elements found: {len(multilines)}")
for m in multilines:
    out_lines.append(f"[{m[0]} | {m[1]}] {m[2]}: \"{m[3]}\" bounds={m[4]}")

out_lines.append("\n=== LABELS PER CONFIGURATION ===")
for cfg, screens in data.items():
    out_lines.append(f"\n=======================================================")
    out_lines.append(f"CONFIGURATION: {cfg}")
    out_lines.append(f"=======================================================")
    for scr, nodes in screens.items():
        out_lines.append(f"  --- Screen: {scr} ---")
        for n in nodes:
            txt = n.get('text', '')
            cls = n.get('class', '').split('.')[-1]
            b = n.get('bounds', [0,0,0,0])
            w = b[2] - b[0]
            h = b[3] - b[1]
            out_lines.append(f"    [{cls}] ({w}x{h}px) \"{txt}\"")

report_txt = "\n".join(out_lines)
Path(INSP_DIR / "inspection_report.txt").write_text(report_txt, encoding="utf-8")
print(f"Report written to inspection_report.txt ({len(report_txt)} chars)")
