/**
 * Contextual Help SVG Illustrations
 * Extracted and adapted from technical documentation (physics_help_base.html)
 * Self-contained vector diagrams illustrating helicopter rotor aerodynamics.
 */

const COMMON_SVG_STYLE = `<style>
  text { font-family: 'RotorRoboto', Roboto, system-ui, -apple-system, sans-serif; fill: var(--text-main, #E6EDF3); }
  .mt { fill: var(--text-muted, #9AA8B8); }
  .ac { fill: var(--accent, #00E5FF); }
  .gn { fill: var(--accent-green, #00E676); }
  .wr { fill: var(--accent-amber, #FFB300); }
  .rd { fill: var(--accent-red, #FF6B6B); }
  .it { font-style: italic; }
  .sm { font-size: 11px; }
  .bd { font-weight: 700; }
  .ln { stroke: var(--text-main, #E6EDF3); stroke-width: 1.6; fill: none; }
  .tn { stroke: var(--text-muted, #9AA8B8); stroke-width: 1; fill: none; }
  .ds { stroke: var(--text-muted, #9AA8B8); stroke-width: 1.2; stroke-dasharray: 5 4; fill: none; }
  .sa { stroke: var(--accent, #00E5FF); stroke-width: 2.2; fill: none; }
  .sg { stroke: var(--accent-green, #00E676); stroke-width: 2.2; fill: none; }
  .sw { stroke: var(--accent-amber, #FFB300); stroke-width: 2.2; fill: none; }
  .sr { stroke: var(--accent-red, #FF6B6B); stroke-width: 2.2; fill: none; }
  .fl { fill: var(--card-bg, #0A0E15); stroke: var(--border, #1E2738); stroke-width: 1.2; }
  .fa { fill: var(--accent, #00E5FF); fill-opacity: 0.18; stroke: var(--accent, #00E5FF); stroke-width: 1.2; }
  .mk-t { fill: var(--text-main, #E6EDF3); }
  .mk-a { fill: var(--accent, #00E5FF); }
  .mk-g { fill: var(--accent-green, #00E676); }
  .mk-w { fill: var(--accent-amber, #FFB300); }
  .mk-r { fill: var(--accent-red, #FF6B6B); }
  .mk-m { fill: var(--text-muted, #9AA8B8); }
</style>`;

/** Figure 1: Hub axes, rotation direction, azimuth, and advancing/retreating sides */
const SVG_AZIMUTH = `<svg viewBox="0 0 360 330" role="img" aria-label="Top view of the rotor disk with axes and azimuth" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f1_t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-t" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f1_a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-a" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f1_g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-g" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f1_w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-w" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f1_r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-r" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f1_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<circle class="fl" cx="180" cy="170" r="104"/>
<line class="ds" x1="180" y1="48" x2="180" y2="292"/>
<line class="ds" x1="58" y1="170" x2="302" y2="170"/>
<line class="sa" x1="180" y1="170" x2="180" y2="30" marker-end="url(#f1_a)"/>
<line class="sa" x1="180" y1="170" x2="320" y2="170" marker-end="url(#f1_a)"/>
<text class="ac bd" x="188" y="30">+X forward</text>
<text class="ac bd" x="264" y="160">+Y right</text>
<circle class="ln" cx="180" cy="170" r="6"/>
<path class="ln" d="M176 166L184 174M184 166L176 174"/>
<text class="mt sm" x="190" y="192">+Z into the page (down)</text>
<path class="sw" d="M268 112A104 104 0 0 0 236 80" marker-end="url(#f1_w)"/>
<text class="wr bd" x="282" y="86">Ω</text>
<text class="wr sm" x="274" y="104">rotation:</text>
<text class="wr sm" x="274" y="118">counter-</text>
<text class="wr sm" x="274" y="132">clockwise</text>
<line class="sg" x1="180" y1="170" x2="253" y2="243" stroke-width="5"/>
<path class="tn" d="M180 222A52 52 0 0 0 217 207"/>
<text class="gn bd" x="196" y="238">ψ</text>
<text class="mt sm" x="180" y="316" style="text-anchor:middle">ψ = 0°  tail</text>
<text class="mt sm" x="300" y="218" style="text-anchor:middle">ψ = 90°</text>
<text class="mt sm" x="300" y="233" style="text-anchor:middle">advancing</text>
<text class="mt sm" x="170" y="44" style="text-anchor:end">ψ = 180°  nose</text>
<text class="mt sm" x="60" y="218" style="text-anchor:middle">ψ = 270°</text>
<text class="mt sm" x="60" y="233" style="text-anchor:middle">retreating</text>
<line class="sr" x1="22" y1="60" x2="22" y2="124" marker-end="url(#f1_r)"/>
<text class="rd bd" x="32" y="82">V<tspan baseline-shift="-3" font-size="72%">x</tspan></text>
<text class="rd sm" x="32" y="102">relative</text>
<text class="rd sm" x="32" y="116">wind</text>
</svg>`;

/** Figure 2: Rotor shaft reference frame, disk AoA α, free stream, and sign conventions */
const SVG_SHAFT_SIGNS = `<svg viewBox="0 0 360 300" role="img" aria-label="Side view with free stream, disk plane, angle of attack and forces" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f2_t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-t" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f2_a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-a" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f2_g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-g" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f2_w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-w" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f2_r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-r" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f2_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<text class="mt sm" x="12" y="20">side view: forward = right, down = +Z</text>
<line class="ds" x1="40" y1="150" x2="330" y2="150"/>
<line class="ln" x1="60" y1="182" x2="300" y2="118" stroke-width="3"/>
<text class="mt sm" x="300" y="108" style="text-anchor:end">disk plane</text>
<path class="tn" d="M244 150A64 64 0 0 0 241 138"/>
<text class="wr bd" x="252" y="146">α</text>
<circle class="ln" cx="180" cy="150" r="4"/>
<line class="sa" x1="180" y1="150" x2="161" y2="78" marker-end="url(#f2_a)"/>
<text class="ac bd" x="166" y="70">T</text>
<line class="sr" x1="180" y1="150" x2="120" y2="166" marker-end="url(#f2_r)"/>
<text class="rd bd" x="112" y="190">H</text>
<line class="sg" x1="226" y1="104" x2="226" y2="178" marker-end="url(#f2_g)"/>
<text class="gn bd" x="234" y="192">v<tspan baseline-shift="-3" font-size="72%">i</tspan></text>
<line class="sw" x1="318" y1="214" x2="226" y2="214" marker-end="url(#f2_w)"/>
<text class="wr bd" x="290" y="206">V<tspan baseline-shift="-3" font-size="72%">∞</tspan></text>
<line class="tn" x1="318" y1="214" x2="231" y2="238" marker-end="url(#f2_m)"/>
<line class="tn" x1="231" y1="238" x2="227" y2="216" marker-end="url(#f2_m)"/>
<text class="mt sm" x="290" y="246">V<tspan baseline-shift="-3" font-size="72%">x</tspan> = V cos α</text>
<text class="mt sm" x="30" y="238">−V<tspan baseline-shift="-3" font-size="72%">z</tspan> = V sin α: for α &gt; 0, the</text>
<text class="mt sm" x="30" y="254">axial flow is directed upward</text>
<text class="mt sm" x="30" y="270">(upflow), yielding negative V<tspan baseline-shift="-3" font-size="72%">z</tspan> and μ<tspan baseline-shift="-3" font-size="72%">z</tspan>.</text>
<line class="tn" x1="322" y1="50" x2="322" y2="88" marker-end="url(#f2_m)"/>
<text class="mt sm" x="300" y="58">+Z</text>
<line class="tn" x1="262" y1="44" x2="304" y2="44" marker-end="url(#f2_m)"/>
<text class="mt sm" x="276" y="36">+X</text>
<text class="mt sm" x="334" y="140" style="text-anchor:end">nose</text>
</svg>`;

/** Figure 3a: Blade planform top view from rotation axis to tip */
const SVG_PLANFORM = `<svg viewBox="0 0 430 222" role="img" aria-label="Blade planform seen from above, from the rotation axis to the tip" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f3a_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<polygon class="fl" points="56,60 120,64 120,136 56,140" stroke-dasharray="4 3"/>
<polygon class="fa" points="120,64 376,80 376,120 120,136"/>
<line class="ds" x1="56" y1="44" x2="56" y2="160"/>
<line class="ds" x1="120" y1="44" x2="120" y2="160"/>
<text class="mt sm" x="56" y="30" style="text-anchor:middle">axis</text>
<text class="mt sm" x="120" y="30" style="text-anchor:middle">x<tspan baseline-shift="-3" font-size="72%">0</tspan></text>
<text class="mt sm" x="376" y="30" style="text-anchor:middle">tip</text>
<line class="tn" x1="40" y1="60" x2="40" y2="140" marker-start="url(#f3a_m)" marker-end="url(#f3a_m)"/>
<text class="ac bd" x="32" y="104" style="text-anchor:end">c<tspan baseline-shift="-3" font-size="72%">R</tspan></text>
<line class="tn" x1="394" y1="80" x2="394" y2="120" marker-start="url(#f3a_m)" marker-end="url(#f3a_m)"/>
<text class="ac bd" x="400" y="104">c<tspan baseline-shift="-3" font-size="72%">T</tspan></text>
<text class="mt sm" x="88" y="94" style="text-anchor:middle">fictitious</text>
<text class="mt sm" x="88" y="110" style="text-anchor:middle">extension</text>
<text class="bd" x="250" y="106" style="text-anchor:middle">A<tspan baseline-shift="-3" font-size="72%">act</tspan> (lifting)</text>
<line class="tn" x1="56" y1="172" x2="120" y2="172" marker-start="url(#f3a_m)" marker-end="url(#f3a_m)"/>
<text class="mt sm" x="88" y="188" style="text-anchor:middle">x<tspan baseline-shift="-3" font-size="72%">0</tspan>·R</text>
<line class="tn" x1="56" y1="200" x2="376" y2="200" marker-start="url(#f3a_m)" marker-end="url(#f3a_m)"/>
<text class="bd" x="216" y="216" style="text-anchor:middle">R</text>
</svg>`;

/** Figure 3b: Linear blade pitch distribution with twist and collective */
const SVG_TWIST = `<svg viewBox="0 0 430 240" role="img" aria-label="Linear blade pitch distribution with twist and collective" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f3b_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f3a_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<line class="tn" x1="56" y1="60" x2="56" y2="206"/>
<line class="tn" x1="56" y1="206" x2="390" y2="206"/>
<text class="mt sm" x="62" y="66">θ</text>
<text class="mt sm" x="390" y="224" style="text-anchor:end">x</text>
<text class="mt sm" x="56" y="224" style="text-anchor:middle">0</text>
<text class="mt sm" x="120" y="224" style="text-anchor:middle">x<tspan baseline-shift="-3" font-size="72%">0</tspan></text>
<text class="mt sm" x="376" y="224" style="text-anchor:middle">1</text>
<line class="ds" x1="120" y1="206" x2="120" y2="96"/>
<line class="ds" x1="376" y1="206" x2="376" y2="96"/>
<line class="ds" x1="120" y1="158" x2="376" y2="158"/>
<line class="ds" x1="120" y1="128" x2="376" y2="153"/>
<line class="sw" x1="120" y1="158" x2="376" y2="183"/>
<line class="tn" x1="104" y1="128" x2="104" y2="158" marker-start="url(#f3b_m)" marker-end="url(#f3b_m)"/>
<text class="mt sm" x="98" y="147" style="text-anchor:end">Δθ</text>
<line class="tn" x1="396" y1="158" x2="396" y2="183" marker-start="url(#f3b_m)" marker-end="url(#f3b_m)"/>
<text class="mt sm" x="402" y="174">θ<tspan baseline-shift="-3" font-size="72%">twist</tspan></text>
<circle class="mk-w" cx="120" cy="158" r="4"/>
<text class="wr bd" x="128" y="150">θ<tspan baseline-shift="-3" font-size="72%">R</tspan></text>
<circle class="mk-w" cx="376" cy="183" r="4"/>
<text class="wr bd" x="368" y="200" style="text-anchor:end">θ<tspan baseline-shift="-3" font-size="72%">T</tspan></text>
<circle class="mk-g" cx="312" cy="177" r="4"/>
<text class="gn bd" x="312" y="168" style="text-anchor:middle">θ<tspan baseline-shift="-3" font-size="72%">75</tspan></text>
<line class="sw" x1="250" y1="34" x2="280" y2="34"/>
<text class="mt sm" x="286" y="38">baseline twist distribution</text>
<line class="ds" x1="250" y1="54" x2="280" y2="54"/>
<text class="mt sm" x="286" y="58">operating pitch with collective Δθ</text>
</svg>`;

/** Figure 4a: Wake skew angle χ, side view */
const SVG_WAKE_SKEW = `<svg viewBox="0 0 360 190" role="img" aria-label="Wake skew angle, side view" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f4a_t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-t" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f4a_a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-a" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f4a_g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-g" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f4a_w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-w" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f4a_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<text class="mt sm bd" x="12" y="24">Wake skew angle, side view</text>
<line class="ln" x1="30" y1="64" x2="178" y2="64" stroke-width="3"/>
<text class="mt sm" x="34" y="54">disk</text>
<line class="ds" x1="104" y1="64" x2="104" y2="170"/>
<text class="mt sm" x="110" y="168">shaft axis</text>
<circle class="mk-t" cx="104" cy="64" r="3.5"/>
<line class="sg" x1="104" y1="64" x2="104" y2="134" marker-end="url(#f4a_g)"/>
<text class="gn bd" x="112" y="104">λ</text>
<line class="sw" x1="104" y1="64" x2="50" y2="64" marker-end="url(#f4a_w)"/>
<text class="wr bd" x="70" y="82">μ</text>
<line class="sa" x1="104" y1="64" x2="50" y2="134" marker-end="url(#f4a_a)"/>
<text class="ac bd" x="18" y="152">wake</text>
<line class="tn" x1="50" y1="64" x2="50" y2="134"/>
<line class="tn" x1="50" y1="134" x2="104" y2="134"/>
<path class="tn" d="M104 108A44 44 0 0 1 84 102"/>
<text class="ac bd" x="82" y="124">χ</text>
<text class="sm" x="196" y="94">χ = atan(μ/λ) for λ &gt; 0</text>
<text class="mt sm" x="196" y="116">0° in hover,</text>
<text class="mt sm" x="196" y="134">toward 90° at high μ</text>
</svg>`;

/** Figure 4b: First-harmonic induced inflow distribution over the rotor disk */
const SVG_INFLOW_DIST = `<svg viewBox="0 0 360 270" role="img" aria-label="First-harmonic induced inflow distribution over the disk, top view" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <linearGradient id="f4b_g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--accent, #00E5FF);stop-opacity:.08"/>
    <stop offset="1" style="stop-color:var(--accent, #00E5FF);stop-opacity:.7"/>
  </linearGradient>
</defs>
<text class="mt sm bd" x="12" y="24">Induced inflow distribution over the disk, top view</text>
<text class="mt sm" x="180" y="52" style="text-anchor:middle">nose (ψ = 180°)</text>
<circle cx="180" cy="126" r="56" fill="url(#f4b_g)" stroke="var(--border, #1E2738)" stroke-width="1.5"/>
<line class="ds" x1="180" y1="60" x2="180" y2="192"/>
<line class="ds" x1="114" y1="126" x2="246" y2="126"/>
<text class="mt sm" x="180" y="208" style="text-anchor:middle">tail (ψ = 0°)</text>
<text class="mt sm" x="254" y="130">advancing</text>
<text class="mt sm" x="106" y="130" style="text-anchor:end">retreating</text>
<text class="mt sm" x="180" y="234" style="text-anchor:middle">K<tspan baseline-shift="-3" font-size="72%">x</tspan> &gt; 0: increased induced downwash at the aft disk</text>
<text class="mt sm" x="180" y="254" style="text-anchor:middle">K<tspan baseline-shift="-3" font-size="72%">y</tspan> &lt; 0: increased induced downwash on the retreating side</text>
</svg>`;

/** Figure 5: Blade-element kinematics and section velocity triangle */
const SVG_VELOCITY_TRIANGLE = `<svg viewBox="0 0 360 312" role="img" aria-label="Velocity triangle at a blade section" xmlns="http://www.w3.org/2000/svg">
${COMMON_SVG_STYLE}
<defs>
  <marker id="f5_t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-t" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f5_a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-a" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f5_g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-g" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f5_w" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-w" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f5_r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-r" d="M0 0L10 5L0 10z"/></marker>
  <marker id="f5_m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk-m" d="M0 0L10 5L0 10z"/></marker>
</defs>
<text class="mt sm" x="12" y="20">Blade section viewed from root looking outboard; blade translates to the right</text>
<line class="ds" x1="20" y1="180" x2="340" y2="180"/>
<text class="mt sm" x="338" y="198" style="text-anchor:end">rotor plane</text>
<line class="ln" x1="50" y1="222" x2="218" y2="133" stroke-width="4"/>
<text class="bd" x="226" y="130">LE</text>
<text class="bd" x="24" y="234">TE</text>
<line class="sw" x1="270" y1="180" x2="136" y2="180" marker-end="url(#f5_w)"/>
<text class="wr sm" x="214" y="214" style="text-anchor:middle">u<tspan baseline-shift="-3" font-size="72%">T</tspan> = x + μ sin ψ</text>
<line class="sg" x1="270" y1="150" x2="270" y2="176" marker-end="url(#f5_g)"/>
<text class="gn bd" x="278" y="160">λ<tspan baseline-shift="-3" font-size="72%">d</tspan></text>
<text class="gn sm" x="278" y="176">downward</text>
<line class="sa" x1="270" y1="150" x2="138" y2="178" marker-end="url(#f5_a)"/>
<text class="ac bd" x="212" y="152">U</text>
<path class="tn" d="M250 180A120 120 0 0 0 247 168"/>
<text class="gn bd" x="224" y="176">φ</text>
<path class="tn" d="M174 180A44 44 0 0 0 169 159"/>
<text class="wr bd" x="180" y="176">θ</text>
<line class="sr" x1="130" y1="180" x2="110" y2="87" marker-end="url(#f5_r)"/>
<text class="rd bd" x="92" y="84">dL</text>
<line class="ds" x1="130" y1="180" x2="130" y2="90"/>
<text class="mt sm" x="136" y="104">dF<tspan baseline-shift="-3" font-size="72%">N</tspan></text>
<text class="mt sm" x="14" y="256">LE, TE: leading edge, trailing edge;  U: resultant section velocity</text>
<text class="mt sm" x="14" y="274">θ: blade pitch;  φ ≈ λ<tspan baseline-shift="-3" font-size="72%">d</tspan> / u<tspan baseline-shift="-3" font-size="72%">T</tspan>: inflow angle;  α<tspan baseline-shift="-3" font-size="72%">s</tspan> = θ − φ: section AoA;  C<tspan baseline-shift="-3" font-size="72%">l</tspan> = a α<tspan baseline-shift="-3" font-size="72%">s</tspan></text>
<text class="mt sm" x="14" y="292">dL ⟂ U: section lift;  dF<tspan baseline-shift="-3" font-size="72%">i</tspan> = dL·φ: induced drag element opposing blade rotation</text>
</svg>`;

/**
 * Returns an inline SVG string illustration for supported contextual help keys,
 * or null if no diagram is applicable for the key.
 *
 * @param key Canonical nomenclature parameter key
 */
export function getHelpSvg(key: string): string | null {
  if (!key) return null;
  const k = key.trim();

  // 1. Blade planform top view (hub to tip, chord distribution, cutout, solidity, aspect ratio)
  switch (k) {
    case "R":
    case "x0":
    case "c0":
    case "c1":
    case "taper":
    case "Ab":
    case "Aact":
    case "sigmaRef":
    case "sigmaAct":
    case "sigmaT":
    case "AR":
      return SVG_PLANFORM;

    // 2. Blade twist & pitch side view (linear twist, collective, 75% pitch)
    case "thRoot":
    case "thTip":
    case "thTwist":
    case "th75":
    case "theta75":
    case "coll":
      return SVG_TWIST;

    // 3. Rotor disk top view with rotation direction, advancing (ψ=90°) and retreating (ψ=270°) sides
    case "mu":
    case "Vx":
    case "Vadv":
    case "Vret":
    case "Madv":
    case "Mret":
    case "psi":
      return SVG_AZIMUTH;

    // 4. Rotor shaft reference frame & sign conventions (AoA α, climb speed Vz, axial ratio μz)
    case "alpha":
    case "Vz":
    case "muz":
    case "Vztot":
      return SVG_SHAFT_SIGNS;

    // 5. Wake skew angle side view
    case "chi":
    case "muLam":
      return SVG_WAKE_SKEW;

    // 6. Inflow model & distribution (first-harmonic gradients Kx, Ky, induced velocity)
    case "inflow":
    case "Kx":
    case "Ky":
    case "lam":
    case "lami":
    case "vi":
    case "lamh":
      return SVG_INFLOW_DIST;
  }

  // 7. Blade element velocity triangle & AoA vs inflow angle (aoa*, phi*, CLbar, a0)
  if (k.startsWith("aoa") || k.startsWith("phi") || k === "CLbar" || k === "a0") {
    return SVG_VELOCITY_TRIANGLE;
  }

  return null;
}
