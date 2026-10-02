"""Export the native APK label/button catalog from B4A sources; no emulator."""
from pathlib import Path
import re, csv, html, json

ROOT = Path(__file__).resolve().parent.parent
names = (ROOT / "RotorNames.bas").read_text(encoding="utf-8-sig")
main = (ROOT / "RotorCalculator.b4a").read_text(encoding="utf-8-sig")
entries = re.findall(r'^\s*Add\("([\w]+)", "([^"]*)", "([^"]*)", "([^"]*)"', names, re.M)
assert entries
array = re.search(r'Dim ab\(\).*?Array As String\((.*?)\)\n', names, re.S)
values = re.findall(r'"([^"]*)"', array.group(1))
abbreviations = dict(zip(values[::2], values[1::2]))
abbreviations.update(re.findall(r'abbr.Put\("([^"]+)", "([^"]*)"\)', names))

narrow_names = dict(re.findall(r'narrowNames.Put\("([^"\n]+)", "([^"\n]*)"\)', names))
minimum_names = dict(re.findall(r'minimumNames.Put\("([^"\n]+)", "([^"\n]*)"\)', names))

def page_keys(var):
    block = re.search(re.escape(var) + r'.AddAll\(Array As String\((.*?)\)\)', main, re.S)
    return set(re.findall(r'"([^"]*)"', block.group(1)))

pages = {"Geometry": page_keys("GeomKeys"), "Conditions": page_keys("CondKeys"), "Results": page_keys("ResKeys")}
rows = []
for key, full, short, symbol in entries:
    locations = [p for p, keys in pages.items() if key in keys]
    locations = locations or ["Opções / ações / help"]
    abbr = abbreviations.get(key, short)
    def label(caption):
        return caption if not symbol or caption == symbol else caption + " " + symbol
    # Narrow captions preserve an intermediate name before symbol-only mode.
    narrow = label(narrow_names.get(key, abbr))
    rows.append([" / ".join(locations), key, "Canônico", label(full), label(short), label(abbr), narrow, symbol or minimum_names.get(key, abbr), "RotorNames.bas"])

def fixed(location, key, caption, origin="RotorCalculator.b4a", mode="Fixo"):
    rows.append([location,key,mode,caption,caption,caption,"Não usado",caption,origin])

# Actual captions outside the canonical quantity table. These controls have no
# abbreviation ladder; preserve their source text rather than inventing variants.
for filename in ("RotorCalculator.b4a", "clsSheet.bas"):
    source = (ROOT / filename).read_text(encoding="utf-8-sig")
    current = ""
    for number, line in enumerate(source.splitlines(), 1):
        sub = re.match(r'\s*(?:Private |Public )?Sub (\w+)', line)
        if sub: current = sub.group(1)
        match = re.match(r'\s*([\w()]+)\.Text\s*=\s*"([^"]*)"(.*)', line)
        if match:
            control, caption, tail = match.groups()
            if control.startswith(("edt", "mEdt")) or not caption: continue
            if tail.strip() and not tail.strip().startswith("'"):
                caption += " ⟨conteúdo variável⟩"
            fixed(current, control, caption, f"{filename}:{number}", "Fixo" if not tail.strip() else "Template")
        # Section headers and setting titles/subtitles are native labels too.
        for match in re.finditer(r'AddSectionHeader\([^\n]*?,\s*"([^"]*)"\)',line):
            fixed(current,"Section Header",match.group(1),f"{filename}:{number}")
        if "AddSettingsRow(" in line:
            strings = re.findall(r'"([^"]*)"', line)
            if len(strings) >= 3:
                fixed("Settings",strings[-1]+" title",strings[0],f"{filename}:{number}")
                fixed("Settings",strings[-1]+" subtitle",strings[1],f"{filename}:{number}")
        if re.search(r'sheet.Show(?:Choice\w*|Input|Confirm|Message|Menu)\("',line):
            caption = re.search(r'sheet.Show\w+\("([^"]+)"',line).group(1)
            fixed(current,"Dialog Title",caption,f"{filename}:{number}")
        match = re.search(r'MakeActionButton\("([^"]+)",\s*"([^"]+)"',line)
        if match:fixed("Geometry",match.group(2),match.group(1),f"{filename}:{number}")
        # Menus, family selectors, and theme choices: caption + optional sublabel.
        match = re.search(r'(?:items|options|modes)\.Add\("([^"]+)"',line)
        if match:
            parts = match.group(1).split("|",1)
            fixed(current,"Option",parts[0],f"{filename}:{number}")
            if len(parts)>1:fixed(current,"Option Help",parts[1],f"{filename}:{number}")

explicit = [
 ("Settings","Theme","DARK / LIGHT / MIDNIGHT BLUE"),
 ("Settings","Units","SI / IMPERIAL"),
 ("Settings","Precision","STANDARD / +1 DECIMAL"),
 ("Settings","Palette","⟨PlotPaletteName⟩"),
 ("Geometry","Active Rotor","⟨nome do rotor salvo⟩"),
 ("Geometry","Airfoil","⟨nome do perfil⟩ / Custom"),
 ("Geometry","Tip-Loss Selection","None / Fixed / Sissingh"),
 ("Geometry","Compressibility Selection","Off / Prandtl-Glauert"),
 ("Conditions","Inflow Selection","Uniform / Coleman Simple / Coleman-Feingold / Drees"),
 ("Conditions","Operating Pair","Ω + Δθ / Ω + C_T / Ω + T / Δθ + C_T / Δθ + T / C_T + T"),
 ("Sweep","Y-Axis Button","⟨nome completo do resultado⟩ ⟨símbolo⟩ ▾"),
 ("Sweep","Family Button","Curves ↵ Models / α Set / Vz Set / μz Set / Active ▾"),
 ("Sweep","X-Axis Button","X axis ↵ μ_x / V_x / μ/λ ▾"),
 ("Sweep","Range Button","Range ↵ ≤ ⟨limite⟩ ▾"),
 ("Sweep","Trim Button","Trim ↵ Fixed / Δθ All / Ω All / Δθ Hover / Ω Hover / None ▾"),
 ("Sweep","Table Title","⟨nome completo do resultado⟩ ⟨símbolo⟩"),
 ("Sweep","Readouts","⟨ponto ativo / cursor / estado do cálculo⟩"),
 ("Results","Numeric Value","⟨valor formatado⟩ / –"),
 ("Results","Trim Status","Trim: ⟨par prescrito⟩ / no solution"),
 ("Results","Model Status","⟨validade, Mach e avisos do modelo⟩"),
 ("Dialog","Action Buttons","Save / Discard / Cancel / Restore / Import / Rename / Copy / Delete / OK"),
 ("Dialog","Help Labels","Typical range / Unit"),
 ("Dialog","Choice Content","⟨opção primária⟩ / ⟨descrição secundária⟩"),
 ("Converter","Mode Button","⟨conversão selecionada⟩ ▾"),
 ("Converter","Input Label","VALUE IN ⟨unidade⟩"),
 ("Converter","Result Label","⟨valor convertido⟩ ⟨unidade⟩"),
]
for p,k,c in explicit: fixed(p,k,c,mode="Fixo / variável")
for caption in ("kW → hp","hp → kW","N → kgf","kgf → N","N → lbf","lbf → N","km/h → kt","kt → km/h","km/h → m/s","m/s → km/h","m → ft","ft → m","mm → in","in → mm"):
    fixed("Converter","Conversion Option",caption)

# All unit buttons are symbols selected from the real unit-option arrays.
unit_block = main.split("Private Sub UnitChoices",1)[-1] if "Private Sub UnitChoices" in main else ""
unit_block = unit_block.split("End Sub",1)[0]
units = set()
for line in unit_block.splitlines():
    if "Array As String" in line:
        units.update(re.findall(r'"([^"]*)"',line))
fixed("Geometry / Conditions / Results","Unit Controls"," / ".join(sorted(units)) or "⟨unidade selecionada⟩ / –",mode="Unidade")

seen=set();unique=[]
for row in rows:
    signature=tuple(row[:-1])
    if signature not in seen:seen.add(signature);unique.append(row)
rows=unique
headers=["Área / uso","Chave / controle","Sistema","Completo L","Curto M","Abreviado A","Estreito S","Mínimo","Fonte"]
intro="""# Catálogo completo de labels e botões do APK

Tabela extraída das fontes B4A. Não utiliza o emulador nem altera a versão web.

- Results: **5 níveis** — L completo, M curto, A abreviado, S estreito, mínimo somente símbolo. S permite remover “Force” antes de chegar ao símbolo.
- Labels de Geometry/Conditions: **5 slots legados** — L, M, A, S, mínimo; S permite nomes mais curtos com símbolo. Os níveis podem ter textos iguais.
- Controles sem símbolo mantêm um caption curto no nível mínimo; um botão de ação não pode virar vazio.
- Botões de ação, valores de seletores, menus, headings e mensagens possuem captions fixos ou templates; não têm quatro versões responsivas. A repetição nas colunas abaixo registra esse fato.
- O símbolo vem **depois do nome**. Marcadores `_`/`_{...}` são renderizados como subscritos matemáticos no APK.
- `↵` registra uma quebra explícita já existente no controle; não é um modo de abreviação.
- Nomes e valores personalizados são templates: não existe uma lista finita de nomes de rotores ou valores numéricos.
- Parte da nomenclatura é utilizada no help ou em opções; não é necessariamente o texto do botão visível. Os captions reais desses botões também estão inventariados.
- A revisão dos nomes é documental nesta entrega. Testes em emulador só serão realizados mediante pedido explícito do usuário.

"""
def escape(s):return s.replace("|","\\|").replace("\n"," ↵ ")
md=intro+"\n| "+" | ".join(headers)+" |\n|"+"---|"*len(headers)+"\n"
md+=''.join('| '+' | '.join(escape(s) for s in row)+' |\n' for row in rows)
(ROOT/'docs/apk-label-catalog.md').write_text(md,encoding='utf-8')
with (ROOT/'docs/apk-label-catalog.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(headers);writer.writerows(rows)
def rich(s):
    s=html.escape(s)
    return re.sub(r'_\{([^}]+)\}|_([A-Za-z0-9]+)',lambda m:'<sub>'+next(g for g in m.groups() if g is not None)+'</sub>',s)
ths=''.join('<th>'+html.escape(h)+'</th>' for h in headers)
trs=''.join('<tr>'+''.join('<td>'+rich(c)+'</td>' for c in row)+'</tr>' for row in rows)
page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Labels do APK</title>
<style>body{font:15px system-ui;margin:24px;color:#14212f;background:#f5f7fa}h1{font-size:24px}input{padding:12px;width:min(500px,90%);font:inherit}table{border-collapse:collapse;background:white;min-width:1400px;width:100%}th,td{border:1px solid #cbd4df;padding:10px;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#19384d;color:white}tr:nth-child(even){background:#edf3f7}sub{font-size:.72em}main{overflow:auto;max-height:75vh;margin-top:16px}p{max-width:1000px}</style>
<h1>Catálogo completo — APK/B4A</h1><p>Nome seguido do símbolo, com subscritos. Results e Geometry/Conditions: cinco níveis; alguns repetem o mesmo texto. Captions fixos são repetidos nas colunas; ↵ indica uma quebra já existente no controle. Mínimo: somente símbolo quando houver um símbolo definido.</p>
<input id="q" placeholder="Filtrar por nome, símbolo, controle ou área" aria-label="Filtrar tabela"><p id="count"></p><main><table><thead><tr>'''+ths+'</tr></thead><tbody>'+trs+'''</tbody></table></main><script>const rows=[...document.querySelectorAll('tbody tr')];function filter(){const q=document.getElementById('q').value.toLowerCase();let n=0;rows.forEach(r=>{r.hidden=!r.textContent.toLowerCase().includes(q);if(!r.hidden)n++});document.getElementById('count').textContent=n+' de '+rows.length+' linhas'}document.getElementById('q').addEventListener('input',filter);filter()</script></html>'''
(ROOT/'docs/apk-label-catalog.html').write_text(page,encoding='utf-8')
print(json.dumps({"canonical_entries":len(entries),"total_rows":len(rows),"files":["docs/apk-label-catalog.md","docs/apk-label-catalog.csv","docs/apk-label-catalog.html"]},ensure_ascii=False))
