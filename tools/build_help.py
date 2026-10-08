"""Generate Files/physics_help{,_light,_midnight,_sepia}.html and privacy_policy{_light,_midnight,_sepia}.html from tools/help_src/physics_help_base.html.
Adds: floating Top button, "Find a symbol" index with filter. Run: python tools/build_help.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "tools/help_src/physics_help_base.html").read_text(encoding="utf-8")

THEMES = {
 "": ("dark", None),
 "_light": ("light", "--bg:#F4F7FA;--card:#FFFFFF;--card2:#E8F0F7;--text:#0F1A24;--muted:#4A5B6C;--accent:#0E7490;--green:#047857;--line:#CBD5E1;--warn:#B45309;--fill:#DCEAF5;--red:#B91C1C"),
 "_sepia": ("light", "--bg:#FAF6EE;--card:#EFE8DC;--card2:#EBE3D5;--text:#2D2319;--muted:#5A4D3D;--accent:#7A4E22;--green:#3F6B2F;--line:#DDD2C0;--warn:#8A5A00;--fill:#E8DCC6;--red:#A32A2A"),
 "_midnight": ("dark", "--bg:#0D1B2A;--card:#13263B;--card2:#1B3350;--text:#E3ECF6;--muted:#9FB3C8;--accent:#5CC8FF;--green:#4ADE9A;--line:#2A4361;--warn:#FBBF24;--fill:#1E3A5A;--red:#FB7185"),
}

# slugify h3 headings lacking an id so the index can link to them
def slug(t):
    t = re.sub(r"<[^>]+>", "", t)
    return "s-" + re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
def add_h3_ids(m):
    return '<h3 id="%s">%s</h3>' % (slug(m.group(1)), m.group(1))
src = re.sub(r"<h3>(.*?)</h3>", add_h3_ids, src)

# (symbol label as HTML, search text, target id)
IDX = [
 ("&mu;<sub>x</sub> advance ratio","mu advance ratio vx","cond"),
 ("&mu;<sub>z</sub> axial flow ratio","mu z axial vz","cond"),
 ("&alpha; disk angle of attack","alpha angle of attack","conv"),
 ("&lambda; total inflow","lambda inflow","inflow"),
 ("&lambda;<sub>i</sub> induced inflow","lambda i induced","inflow"),
 ("&sigma; solidity","sigma solidity","geom"),
 ("&Omega; rotor speed","omega rpm rotor speed","cond"),
 ("&rho; air density","rho density atmosphere","cond"),
 ("a<sub>0</sub> lift-curve slope","a0 lift curve slope","geom"),
 ("C<sub>d0</sub> profile drag","cd0 drag profile","geom"),
 ("&theta;<sub>0</sub> collective","theta collective trim","s-collective"),
 ("&theta;<sub>tw</sub> twist","twist theta","geom"),
 ("x<sub>0</sub> root cutout","x0 root cutout","geom"),
 ("N<sub>b</sub> blades","nb blades","geom"),
 ("B tip-loss factor","b tip loss prandtl sissingh","s-tip-loss"),
 ("k<sub>ind</sub> induced power factor","kind kappa induced power","s-induced-power-factor"),
 ("C<sub>T</sub> thrust coefficient","ct thrust","s-thrust-coefficient-ct"),
 ("C<sub>Q</sub> torque coefficient","cq torque","s-in-plane-force-ch-and-torque-cq"),
 ("C<sub>Q0</sub> profile torque","cq0 profile torque","s-profile-in-plane-force-ch0-and-torque-cq0"),
 ("C<sub>Qi</sub> induced torque","cqi induced torque","s-induced-torque-cqi-energy-balance"),
 ("C<sub>H</sub> in-plane force","ch h-force in plane","s-in-plane-force-ch-and-torque-cq"),
 ("C<sub>Y</sub> side force","cy side force","s-side-force-cy-and-hub-moments-cmx-cmy"),
 ("C<sub>Mx</sub>, C<sub>My</sub> hub moments","cmx cmy moment hub","s-side-force-cy-and-hub-moments-cmx-cmy"),
 ("C<sub>Pair</sub> air power","cpair power","s-air-power-coefficient-cpair"),
 ("V<sub>z,tot</sub> total axial speed","vztot total axial speed vz vi","out"),
 ("V<sub>adv</sub> advancing speed","vadv advancing speed","out"),
 ("V<sub>ret</sub> retreating speed","vret retreating speed","out"),
 ("M<sub>ret</sub> retreating Mach","mret retreating mach","out"),
 ("&alpha;<sub>adv,75</sub> advancing AoA","aoa advancing angle of attack 75","out"),
 ("&alpha;<sub>ret,75</sub> retreating AoA","aoa retreating angle of attack 75","out"),
 ("&phi;<sub>adv,75</sub> advancing inflow angle","phi advancing inflow angle 75","out"),
 ("&phi;<sub>ret,75</sub> retreating inflow angle","phi retreating inflow angle 75","out"),
 ("Flow & blade diagnostics","diagnostics flow blade aoa phi","s-flow-and-blade-diagnostics"),
 ("Prandtl-Glauert compressibility","prandtl glauert mach compressibility","s-compressibility-prandtl-glauert"),
 ("Radial moments","moments radial","s-radial-moments"),
 ("Non-uniform inflow (Drees, Coleman)","drees coleman non uniform","s-non-uniform-inflow"),
 ("Momentum closure","momentum glauert","s-total-inflow-and-momentum-closure"),
 ("Trim (thrust / C<sub>T</sub>)","trim target","trim"),
 ("Sweep trim modes","sweep","s-sweep-trim-modes"),
 ("Sign conventions","sign convention","s-forces-moments-signs"),
 ("Normalization","normalization","s-normalization"),
 ("Derived outputs","outputs power figure of merit","out"),
 ("Model scope and limits","scope limits validity assumptions","scope"),
 ("References","references","ref"),
]
ids = set(re.findall(r'id="([^"]+)"', src))
rows = [e for e in IDX if e[2] in ids]
rows.sort(key=lambda e: re.sub(r"<[^>]+>|&[a-z]+;", "", e[0]).lower())
items = "".join('<li data-k="%s"><a href="#%s">%s</a></li>' % ((e[0] + " " + e[1]).lower().replace('"', ""), e[2], e[0]) for e in rows)

CSS = """
.totop{position:fixed;right:14px;bottom:14px;z-index:9;min-width:48px;min-height:48px;padding:0 16px;display:flex;align-items:center;justify-content:center;border-radius:24px;background:var(--accent);color:var(--bg);font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.4)}
main{overflow-x:hidden}
"""
JS = ("<script>(function(){"
      "var t=document.querySelector('.totop');if(!t){t=document.createElement('a');t.className='totop';t.href='#top';t.textContent='↑ Top';document.body.appendChild(t);}"
      "function tg(){t.style.display=(window.pageYOffset||document.documentElement.scrollTop)>500?'flex':'none';}"
      "window.addEventListener('scroll',tg);tg();})();</script>")

for suffix, (scheme, root_vars) in THEMES.items():
    h = src
    if root_vars:
        h = re.sub(r":root\{[^}]*\}", ":root{" + root_vars + "}", h, count=1)
    h = re.sub(r'(<meta name="color-scheme" content=")[a-z ]+"', r'\g<1>%s"' % scheme, h)
    h = h.replace("</style>", CSS + "</style>", 1)
    h = h.replace("</body>", JS + "</body>", 1)
    filename = "physics_help%s.html" % suffix
    for dest_dir in ["Files", "docs", "web/public"]:
        (root / dest_dir / filename).write_text(h, encoding="utf-8")
    print("wrote %s to Files, docs, and web/public" % filename)

# Privacy policy theme variants. Source: privacy_policy.html (dark) in Files/. Variants differ in colors only.
PRIVACY = {
 "_light": ("#f7fafc", "#172c3a", "#006d7a"),
 "_midnight": ("#0D1B2A", "#E3ECF6", "#5CC8FF"),
 "_sepia": ("#FAF6EE", "#2D2319", "#7A4E22"),
}
base = (root / "Files/privacy_policy.html").read_text(encoding="utf-8")
for suffix, (bg, fg, h2) in PRIVACY.items():
    if suffix == "_light" and (root / "Files/privacy_policy_light.html").exists():
        continue  # keep the existing hand-maintained light page
    h = base.replace("background:#0d121b;color:#e7eff7", "background:%s;color:%s" % (bg, fg), 1)
    h = h.replace("h2{font-size:19px;color:#00cbdc}", "h2{font-size:19px;color:%s}" % h2, 1)
    assert h != base
    filename = "privacy_policy%s.html" % suffix
    for dest_dir in ["Files", "docs", "web/public"]:
        (root / dest_dir / filename).write_text(h, encoding="utf-8")
    print("wrote %s to Files, docs, and web/public" % filename)
