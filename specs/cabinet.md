# Cabinet spec

## Summary
The cabinet family: a box on a base, with a face made of drawers, doors and open cells. One type, `cabinet`,
covers four **kinds** of piece: sideboard, dresser (low dresser or tall chest), nightstand and TV unit. Four
**styles** give each kind a design language: mid-century, shaker, industrial and modern. It is fun to generate
because the face is a small puzzle: the same 1.6 m carcass can be "doors | drawers | doors", "drawer band over four
doors" or "drawers | open niche | drawers", and each answer reads at once at grid distance. Seeds differ along four
axes the eye picks up:
- **Kind (proportion):** long and low (sideboard, TV unit), tall and narrow (tall chest), small cube (nightstand).
- **Base language:** splayed tapered legs, recessed plinth, arched skirt, bun feet, slab ends, metal frame, hairpins.
- **Face grid:** the layout of drawers, doors and open cells, with gaps, reveals and graduated drawer heights.
- **Hardware:** knobs, bars, cup pulls, cut-outs, wooden lips, leather tabs, or none.

**Decision: `style` is the design language; `kind` is a second rerollable group right after it.** Both are cycled
like R1 styles (a new kit helper `rollCycle`, see New helpers). Kind does not read style and style does not read
kind, so:
- ⟳ Style gives "the same piece in another style": a walnut mid-century sideboard becomes a shaker sideboard of the
  same relative size, colourway kept.
- ⟳ Kind gives "the same style, another piece": a shaker sideboard becomes a shaker nightstand.
- `S` (shape) re-proportions the piece; `C` (palette) recolours it.

Making the kinds the `styles` would fit the "styles are silhouettes" rule a little better. But the plan names the
styles mid-century / shaker / industrial, the panel reads better as "Style: shaker · Kind: dresser", and the language
axis is also a silhouette axis here: legs, plinth, skirt and frame all read at 45 m. See open question 1.

## Real-world references and dimensions
| Dimension | Range | Source |
|---|---|---|
| Sideboard length | 1.22–1.83 m typical, 1.5–1.8 m for average dining rooms; we use 1.2–2.0 | [Belleze sideboard dimensions](https://belleze.com/blogs/news/sideboard-dimensions-guide), [Designing Idea sideboard dimensions](https://designingidea.com/sideboard-dimensions) |
| Sideboard height | 0.76–0.91 m (0.75–0.90 m metric guides, sized to sit near a 0.75 m table) | [Belleze](https://belleze.com/blogs/news/sideboard-dimensions-guide), [Designing Idea](https://designingidea.com/sideboard-dimensions) |
| Sideboard depth | 0.41–0.51 m (hallway pieces 0.30–0.35) | [Belleze](https://belleze.com/blogs/news/sideboard-dimensions-guide), [Swyft sideboard buying guide](https://swyfthome.com/blogs/lifestyle/sideboard-buying-guide) |
| Dresser (low) | h 0.76–0.91 m, w 0.76–1.52 m, d 0.41–0.56 m | [Designing Idea dresser dimensions](https://designingidea.com/dresser-dimensions), [Bassett standard furniture dimensions](https://www.bassettfurniture.com/blog/standard-furniture-dimensions.aspx) |
| Chest of drawers (tall) | h 0.76–1.32 m (some to 1.5), w 0.71–1.07 m, d 0.38–0.51 m | [Designing Idea](https://designingidea.com/dresser-dimensions), [Hunker: understanding dresser dimensions](https://www.hunker.com/12518008/understanding-dresser-dimensions) |
| Nightstand | h 0.58–0.71 m (level with the mattress top or a little above), w 0.53–0.71 m, d 0.38–0.51 m; low platform beds need lower ones | [Wayfair nightstand dimensions](https://www.wayfair.ca/sca/ideas-and-advice/guides/nightstand-dimensions-how-to-choose-the-right-nightstand-size-for-your-bedroom-T12032), [Nectar nightstand height](https://www.nectarsleep.com/posts/nightstand-height) |
| TV unit / media console | h 0.51–0.76 m (low-profile 0.45–0.60), d 0.38–0.51 m, w ≈ 1.5 m for 55–65" TVs | [Tribesigns TV stand height](https://tribesigns.com/blogs/furniture-knowledge/tv-stand-height), [TV stand sizes guide](https://thesize-net.pages.dev/tv-stands) |
| Knob diameter | 25–32 mm under 0.30 m fronts, 32–35 mm to 0.61 m, 35–38 mm to 0.76 m; above 0.76 m use two knobs or a pull | [DK Hardware placement and sizing](https://www.dkhardware.com/blog/cabinet-hardware-placement-sizing-guide/amp/) |
| Pull length | About 1/3 of the front width | [Schoolhouse: choosing cabinet hardware](https://www.schoolhouse.com/blogs/how-to/how-to-choose-the-perfect-cabinet-hardware) |
| Two pulls | Fronts wider than about 0.76 m (30") get two pulls or one long pull; two pulls go at the quarter points | [DK Hardware](https://www.dkhardware.com/blog/cabinet-hardware-placement-sizing-guide/amp/), [Plank Hardware placement guide](https://plankhardware.com/blogs/tea-break/where-to-place-cabinet-hardware-guide) |
| Door handle position | On the stile on the opening side, about 50–75 mm from the edge; near the top of a door you reach down to | [KraftMaid knob and pull placement](https://www.kraftmaid.com/kraftmaid/cabinet-hardware-placement-knobs-and-pulls-guide/), [San Diego Hardware guide](https://sandiegohardware.com/blogs/resources/the-ultimate-guide-for-cabinet-hardware-placement-and-sizing) |
| Bar pull sizes | Hole spacing in 32 mm steps: 96, 128, 160, 192, 224, 256, 320 mm; projection 25–35 mm | Industry 32 mm system (designer knowledge; matches the ⅓ rule above for 0.3–1.0 m fronts) |
| Drawer front heights | 0.09–0.30 m; the top drawer is the smallest, lower drawers graduate by about 10–20 % each | Designer estimate from period dressers and the dresser guides above |
| Door width | 0.25–0.60 m per leaf; wider bays get a pair | Designer estimate (hinge and sag limits for overlay doors) |
| Gaps and reveals | Real overlay gaps 2–3 mm; inset reveals 2–3 mm. **We draw 3–6 mm (modern up to 8 mm)** so the grid reads at item distance | Designer estimate; stylised on purpose |
| Base heights | Plinth / toe-kick 0.05–0.10 m; mid-century sideboard legs 0.15–0.30 m; bun feet 0.05–0.09 m | Designer estimate from product listings |

## Styles
Style weights sum to 1.00. Kinds have their own weights (see the `kind` group): sideboard 0.30, dresser 0.28,
nightstand 0.22, tv 0.20.

### midcentury (weight 0.30)
- Silhouette: a crisp, thin-topped box raised high on four or six splayed, tapered round legs, so you see a band of
  floor under it. The face is slab fronts with continuous horizontal grain, often asymmetric (drawers on one side,
  doors on the other). Pulls are carved wooden lips or small brass knobs; doors sometimes have cane panels.
- Parts: carcass, thin top (flush or ≤ 12 mm overhang), legs (`legs` or `frameLegs` with a rail frame), slab
  fronts, optional cane inserts in framed doors, lip / knob / bar / cut-out / tab hardware.

### shaker (weight 0.26)
- Silhouette: a solid box under a thick top that overhangs on three sides, on an arched skirt, bun feet, square
  tapered legs or a plinth. Inset fronts sit inside a visible face frame; doors are framed (stiles, rails, recessed
  centre panel). Round wooden knobs.
- Parts: carcass, thick overhanging top, `skirt` / `bun` / `legs` (4-sided, tapered) / `plinth` base, inset face
  frame members, framed doors, slab or framed drawers, knobs (cup and bar pulls less often).

### industrial (weight 0.20)
- Silhouette: a thick wooden top on a visible black or steel frame (corner posts to the floor, side rails, sometimes
  an X brace) or on hairpin legs. Often a lower open shelf or open cells, perforated metal doors, many small drawers
  (apothecary). Cup pulls and bar pulls.
- Parts: carcass, thick top, `metalFrame` / `hairpin` / metal `legs` base, optional bottom shelf in the frame, slab
  or metal fronts, perforated inserts, cup / bar / tab hardware.

### modern (weight 0.24)
- Silhouette: a monolithic box that seems to float: a deep recessed plinth (shadow line), slab ends running to the
  floor, or slim legs. Flush top, wide shadow gaps, handleless fronts (cut-outs, top grooves, push) or slim bars.
  Painted lacquer or pale wood, sometimes one accent colour on the fronts.
- Parts: carcass, flush top, `plinth` / `panelEnds` / slim `legs` base, slab fronts, cut-out / groove / bar / tab /
  none hardware.

### Kinds (shape language inside every style)
| Kind | Forms | Silhouette rule (kept by the height and width windows) |
|---|---|---|
| sideboard | `sideboard` | 1.2–2.0 m long, 0.68–0.90 m high; length ≥ 1.6 × height |
| dresser | `lowDresser` (60 %), `tallChest` (40 %) | low: 0.9–1.6 m wide, 0.74–0.95 m high, drawers only or mostly; tall: 0.7–1.0 m wide, 1.05–1.40 m high |
| nightstand | `nightstand` | 0.40–0.60 m wide, 0.50–0.68 m high; never wider than 0.6, never as wide as a dresser (≥ 0.7) |
| tv | `tv` | 1.2–2.0 m long, 0.40–0.60 m high; length ≥ 2.5 × height; always at least one open cell or flap row in 80 % of templates |

## Parameters
Units are meters. "U(a, b)" = uniform. "pick{…}" = weighted pick (`weightedPick`). All fields are present on every
seed; unused fields get neutral values (`0`, `false`, `null`, `'none'`).

**Draw rule (as in the table spec):** each group draws all its random values in a fixed order, unconditionally, then
maps them through the style/kind tables and clamps. So re-rolling `shape` keeps the same front template and the same
hardware; re-rolling `style` keeps the same relative proportions.

Style codes in the tables below: mc = midcentury, sh = shaker, in = industrial, mo = modern.

### style
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| style | midcentury, shaker, industrial, modern | `rollStyle(g, styles)`: pick{.30, .26, .20, .24} at re-roll 0 (R1) | — | style |

### kind
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| kind | sideboard, dresser, nightstand, tv | `rollCycle(g, 'kind', KINDS)`: pick{.30, .28, .22, .20} at re-roll 0; re-roll k visits every other kind once (new helper) | — | kind |

### shape (reads style, kind)
Draws, in order: uForm, uWidth, uHeight, uDepth, uPanel, uTopT, uTopOver, uTopEdge (8 draws).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| form | sideboard, lowDresser, tallChest, nightstand, tv | dresser: pick{lowDresser .6, tallChest .4}; others = kind | kind | shape |
| width (x, carcass outer incl. frame posts) | sideboard 1.20–1.95; lowDresser 0.90–1.60; tallChest 0.70–1.00; nightstand 0.40–0.60; tv 1.20–1.95 | U, then clamp `width + 2·topOverhang ≤ 2.0` | form, topOverhang | shape |
| height (floor to top surface) | sideboard 0.72–0.90 (mc 0.68–0.82); lowDresser 0.74–0.95; tallChest 1.05–1.40; nightstand 0.50–0.68; tv 0.40–0.60 (mc/mo 0.40–0.52) | U, then clamp sideboard `width ≥ 1.6·height`, tv `width ≥ 2.5·height` | form, style, width | shape |
| depth (back to front face of the fronts) | sideboard 0.40–0.50; low/tall dresser 0.42–0.52; nightstand 0.35–0.45; tv 0.38–0.48; clamp ≤ 0.9 × width | U, then clamp | form, width | shape |
| panel (carcass board thickness) | mc/sh/mo 0.016–0.022; in 0.020–0.028 | U | style | shape |
| topThickness | mc 0.016–0.025; sh 0.022–0.032; in 0.030–0.050; mo 0.016–0.022 | U | style | shape |
| topOverhang (front and both ends; never at the back) | mc 0–0.012; sh 0.015–0.035; in 0.010–0.030; mo 0 | U | style | shape |
| topEdge | 0.003–0.008, through `edgeRadius` | U | topThickness | shape |

### base (reads style, kind, shape)
Draws, in order: uKind, uLegH, uLegT, uSides, uTaper, uSplay, uInsetX, uInsetZ, uApron, uPlinth, uCut, uCutH, uBun,
uPost, uBrace, uShelf, uShelfH (17 draws).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| baseKind | legs, frameLegs, plinth, skirt, bun, panelEnds, metalFrame, hairpin | mc pick{legs .55, frameLegs .25, plinth .10, panelEnds .10}; sh {legs .35, skirt .30, bun .20, plinth .15}; in {metalFrame .55, hairpin .25, legs .20}; mo {plinth .45, panelEnds .30, legs .25}. tallChest: hairpin → metalFrame, legs with `legHeight > 0.15` clamp. | style, form | base |
| legCount | 0, 4, 6 (R6) | legs / frameLegs / hairpin: 6 when width > 1.5, else 4; all other kinds 0 | baseKind, width | base |
| legHeight (clear height under the carcass; the base's top, `fp.top`) | legs / frameLegs: sideboard 0.15–0.30, tv 0.12–0.25, nightstand 0.12–0.26, lowDresser 0.10–0.22, tallChest 0.08–0.15; hairpin 0.18–0.32; metalFrame 0.10–0.25; plinth 0.05–0.10; skirt 0.07–0.14; bun 0.05–0.09; panelEnds 0.06–0.15. Clamp `≤ 0.4 × height` and body height `height − legHeight − topThickness ≥` body min (sideboard 0.45, lowDresser 0.55, tallChest 0.85, nightstand 0.26, tv 0.24) | U, then clamp | baseKind, form, height, topThickness | base |
| legThickness (top diameter) | mc 0.030–0.045; sh 0.035–0.050; in 0.020–0.032 (hairpin: rod 0.010–0.014); mo 0.020–0.032 | U | style, baseKind | base |
| legSides | mc pick{8 .5, 6 .3, 4 .2}; sh 4; in 4; mo 8; hairpin 6 | pick / fixed | style, baseKind | base |
| legTaper | mc 0.50–0.70; sh 0.60–0.80; in 1; mo 0.70–1.0; hairpin 1 | U | style | base |
| legSplay | mc legs: U(0.010, 0.040), clamp `≤ 0.2 × legHeight` (θ ≤ 11°) and `≤ legInsetX`; everything else 0 | U, then clamp | style, baseKind, legHeight | base |
| legInsetX | legs: 0.03–0.10; frameLegs 0.06–0.15; hairpin 0.05–0.10; clamp `≤ 0.15 × width` | U, then clamp | baseKind, width | base |
| legInsetZ | 0.03–0.06 | U | — | base |
| apronHeight | frameLegs: 0.030–0.050 (rail frame under the carcass, top at `legHeight`); else 0 | U | baseKind | base |
| plinthInset (front and ends; back 0) | plinth 0.020–0.050 (mo 0.035–0.060, a real shadow line); else 0 | U | baseKind, style | base |
| skirtCut | arch, notch (skirt only, else `'none'`) | pick{.6, .4} | baseKind | base |
| skirtCutHeight | 0.6–0.85 × legHeight | U | legHeight | base |
| skirtFoot (foot width at each end) | 0.06–0.10, clamp so `cutWidth = width − 2·skirtFoot ≤ 0.6 × width` is honoured by `endPanelShape` | U | width | base |
| bunRadius | 0.030–0.045 | U | — | base |
| endCut | none, notch (panelEnds only) | pick{.6, .4} | baseKind | base |
| postSize | metalFrame 0.025–0.040; else 0 | U | baseKind | base |
| sideBrace | none, x (metalFrame only) | pick{.7, .3} | baseKind | base |
| bottomShelf | metalFrame with legHeight ≥ 0.15: chance 0.5; else false | chance | baseKind, legHeight | base |
| bottomShelfHeight | 0.04–0.08 | U | bottomShelf | base |

### fronts (reads style, kind, shape, base)
Draws, in order: uTemplate, uConstruction, uGap, uEdge, uFrame, uThick, uBevel, uDoorStyle, uDrawerStyle, uGrain,
uA, uB, uC, uD, uE, uF (16 draws). `uA…uF` are the template slots (see Templates below).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| template | one id from the (form, style) table below | pick | form, style | fronts |
| plan | the front plan tree (JSON, below), template + slot values | derived | template, uA…uF | fronts |
| construction | overlay, inset | mc pick{.9, .1}; sh {.25, .75}; in {.7, .3}; mo overlay | style | fronts |
| gap (between overlay fronts) | 0.003–0.006; mo 0.004–0.008 | U | style | fronts |
| edge (overlay front edge to carcass outline) | full overlay 0.001–0.003 (mc, mo); half overlay 0.006–0.012 (in, sh-overlay) | U | style | fronts |
| reveal (inset front to opening) | 0.002–0.003 (kept ≤ 3 mm so `connected` holds) | U (from uGap) | construction | fronts |
| frameWidth (inset face-frame members; overlay open-cell dividers) | 0.016–0.025, ≥ panel | U | panel | fronts |
| frontThickness | 0.018–0.022 | U | — | fronts |
| frontBevel | 0.003–0.005 (≥ 0.003 so the gap line reads as a bevel highlight) | U | — | fronts |
| doorStyle | slab, framed, insert | mc pick{slab .7, insert .2, framed .1}; sh {framed .85, slab .15}; in {slab .5, insert .3, framed .2}; mo slab | style | fronts |
| insertKind | none, cane, perforated | derived: insert → mc cane, in perforated; else none | doorStyle, style | fronts |
| drawerStyle | slab, framed (framed only applied to drawers ≥ 0.15 m high) | sh pick{slab .7, framed .3}; others slab | style | fronts |
| doorFrameWidth (stile / rail of framed and insert doors) | 0.045–0.070, clamp per door `≤ 0.2 × min(w, h)` at build | U | — | fronts |
| grainMode | continuous (every front grain x), classic (drawers x, doors y) | mc pick{.7, .3}; mo {.5, .5}; sh, in classic | style | fronts |
| hasFronts | true unless the plan has no drawer or door leaf (NS4, TV4) | derived | plan | fronts |

#### Templates (front plans per form and style)
Notation: `x[ … | … ]` splits along x (bays), `y[ … / … ]` along y (rows, top first). Leaves: `Dn` a stack of n
drawers (graduated), `D×a` a row of a drawers side by side, `P` a door leaf (1 or 2 doors by width), `F` a flap
(door hinged at the bottom), `Os` an open cell with s shelves. Child weights in parentheses; `@m` is a fixed size in
meters. Slots: uA ratio, uB stack count, uC bay/across count, uD graduation, uE shelves, uF asymmetric split.

| Form | Id | Plan | Slots | mc | sh | in | mo |
|---|---|---|---|---|---|---|---|
| sideboard | SB1 | `x[P(1) \| Dn(r) \| P(1)]`, symmetric | r = U(0.6, 1.0); n = 3–4 | .25 | .30 | .10 | .15 |
| sideboard | SB2 | `y[D×k @0.16–0.22 / x[P \| … \| P] k bays]` drawer band over doors | k = 2–4 (≤ floor(width / 0.38)) | .15 | .35 | .15 | .10 |
| sideboard | SB3 | `x[P \| … \| P]` k equal bays | k = 3–4 | .25 | .15 | .10 | .30 |
| sideboard | SB4 | `x[Dn(f) \| P(1 − f)]`, asymmetric, side from uF | f = U(0.35, 0.5); n = 3–4 | .25 | .05 | .10 | .15 |
| sideboard | SB5 | `x[P(1) \| O1(r) \| P(1)]`, symmetric | r = U(0.7, 1.2) | .10 | .15 | .25 | .20 |
| sideboard | SB6 | `y[D×k (0.45–0.6) / O1]` drawers over an open shelf | k = 2–4 | 0 | 0 | .30 | .10 |
| tv | TV1 | `x[P(1) \| O0–1(r) \| P(1)]`, symmetric | r = U(0.8, 1.4); s = 0–1 | .25 | .30 | .15 | .25 |
| tv | TV2 | `x[F \| … \| F]` k flaps | k = 2–4 | .20 | .15 | .10 | .30 |
| tv | TV3 | `y[O0 (0.40–0.55) / D×k]` open shelf over a drawer row | k = 2–4 | .25 | .20 | .15 | .15 |
| tv | TV4 | `x[y[O / O] \| … ]` k open bays with a mid shelf (no fronts) | k = 2–3 | .05 | .05 | .40 | .05 |
| tv | TV5 | `x[Dn(1) \| O0(r) \| Dn(1)]`, symmetric | r = U(0.8, 1.4); n = 2 | .25 | .30 | .20 | .25 |
| lowDresser | LD1 | `x[Dn \| Dn]`, symmetric | n = 3–4; g graduated | .25 | .20 | .20 | .35 |
| lowDresser | LD2 | `x[Dn \| Dn \| Dn]`, symmetric | n = 3–4 | .30 | .15 | .25 | .25 |
| lowDresser | LD3 | `y[D×2 @first / Dn]` "two over n" (full-width drawers) | n = 2–3 | .15 | .45 | .15 | .10 |
| lowDresser | LD4 | `x[Dn(f) \| P(1 − f)]`, asymmetric | f = U(0.4, 0.6); n = 3–4 | .30 | .20 | .10 | .30 |
| lowDresser | LD5 | `x[Dn \| … \| Dn]` apothecary grid, small drawers | k = 3–4 columns, n = 3–4 | 0 | 0 | .30 | 0 |
| tallChest | TC1 | `Dn` one graduated column | n = 4–6 | .35 | .30 | .30 | .50 |
| tallChest | TC2 | `y[D×2 @first / Dn]` | n = 3–4 | .35 | .50 | .20 | .30 |
| tallChest | TC3 | `y[P (0.35–0.5) / Dn]` doors over drawers | n = 2–3 | .30 | .20 | .10 | .20 |
| tallChest | TC4 | `x[Dn \| Dn]` tool-chest columns | n = 5–6 | 0 | 0 | .40 | 0 |
| nightstand | NS1 | `y[D1 (0.35–0.5) / O0–1]` drawer over an open cell | s = 0–1 | .40 | .30 | .25 | .30 |
| nightstand | NS2 | `y[D1 (0.3–0.4) / P]` drawer over a door | — | .15 | .35 | .15 | .15 |
| nightstand | NS3 | `Dn` | n = 2–3 | .40 | .35 | .20 | .45 |
| nightstand | NS4 | `y[O / O]` open shelves only (no fronts) | — | .05 | 0 | .40 | .10 |

Every (form, style) column sums to 1.00. `D×2 @first` means the first row's height equals the first drawer height
the stack below would give (so "two over n" lines up with the graduation).

**Graduation `g`** (uD), ratio of each drawer to the one above: sh and lowDresser/tallChest U(1.08, 1.22); mc U(1.0,
1.12); in and mo 1.0 (equal drawers).

### hardware (reads style, fronts; `appliesTo: p.hasFronts`)
Draws, in order: uKind, uSize, uScale, uVPos, uDoorInset, uDoorDrop, uLip (7 draws). Neutral values when
`hasFronts` is false (`drawerHandle: 'none'`, sizes 0).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| drawerHandle | knob, bar, cup, cutout, groove, lip, tab, none | mc pick{lip .35, knob .20, bar .15, cutout .15, tab .15}; sh {knob .65, cup .20, bar .15}; in {cup .40, bar .35, knob .15, tab .10}; mo {cutout .25, groove .25, bar .25, tab .15, none .10} | style | hardware |
| doorHandle | same set | derived: knob → knob, bar → bar (vertical), cup → bar (vertical), cutout → cutout (vertical slot), groove → groove (on the opening edge), lip → lip (vertical, opening edge), tab → tab, none → none | drawerHandle | hardware |
| knobDiameter | 0.025–0.038 | U | — | hardware |
| barLength | ⅓ of the front width × U(0.75, 1.2), snapped to 32 mm steps, clamp 0.096–0.320 (computed per front at build from `barScale`) | derived | barScale | hardware |
| barScale | 0.75–1.2 | U | — | hardware |
| barProfile | round, square | in square .6, others round | style | hardware |
| projection | knob 0.022–0.030; bar 0.025–0.035; cup 0.020–0.026; tab 0.010–0.014; lip 0.012–0.020 | U (uScale) | drawerHandle | hardware |
| cupWidth | 0.076–0.096 | U | — | hardware |
| cutoutWidth / cutoutHeight | 0.08–0.12 / 0.025–0.035 | U | — | hardware |
| lipFraction (lip width ÷ front width) | mc pick{full 1.0 .5, U(0.35, 0.7) .5} | pick, U | — | hardware |
| tabLength | 0.045–0.070 | U | — | hardware |
| vPos (drawers) | centre, top | knob / bar / cup / tab: pick{.8, .2}; cutout / groove / lip: top | drawerHandle | hardware |
| doorInset (handle centre to the opening edge) | 0.035–0.060 | U | — | hardware |
| doorDrop (top of handle below the door top) | 0.05–0.10 | U | — | hardware |

### palette (`appliesTo`: something is painted, i.e. bodyFinish, frontFinish or baseFinish uses paint/accent)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| paint | hex | `paintColor(r)` (3 draws) | — | palette |
| accent | hex | `accentColor(r, paint)` (3 draws) | — | palette |

Same arrangement as the table (its architect note 1): `appliesTo` reads `finish` fields, so `paint`/`accent` stay
drawn on every seed, and `bodyColor`/`frontColor`/`baseColor` must not depend on them unless something is painted.

### finish (reads style, base, fronts, hardware, palette)
Draws, in order: uBody, uFront, uTop, wood (3 via `pickWood(r, { weights: WOOD_BIAS[style] })`), uGrain, stone (pick +
l jitter, 2), uHw, uHwJitter, leather (3 via `pickLeather`), uBase, uSheen, uInsert (17 draws, all unconditional).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| bodyFinish | wood, painted | mc pick{.85, .15}; sh {.45, .55}; in {.8, .2}; mo {.45, .55} | style | finish |
| frontFinish | match, painted, accent, metal | mc {match .75, painted .25 (only when body wood)}; sh {match .85, accent .15}; in {match .5, metal .5}; mo {match .5, accent .3, painted .2 (only when body wood)} | style, bodyFinish | finish |
| topFinish | match, wood, stone | painted body: sh {wood .7, match .3}, others {match .8, wood .2}; wood body: mc/mo sideboard and tv {match .85, stone .15}, else match | style, form, bodyFinish | finish |
| woodName | `WOODS` name, or null when nothing is wood | `pickWood(r, { weights: WOOD_BIAS[style] })`; always drawn. `WOOD_BIAS` (cabinet-local): mc {walnut .45, honey .20, oak .15, cherry .10, mahogany .10}; sh {oak .35, cherry .35, honey .15, walnut .10, mahogany .05}; in {walnut .30, oak .30, mahogany .20, honey .20}; mo {oak .35, birch .35, walnut .20, honey .10} | style | finish |
| leatherName | `LEATHERS` name (tan, cognac, chocolate, oxblood, bottle green); used only by `tab` handles | `pickLeather(r)`; always drawn | — | finish |
| grain | fine, plain, bold, or `'none'` when nothing is wood | pick{.45, .45, .10} (fronts are small: no bold on nightstands) | form | finish |
| stoneName | `STONE_TONES` name or null | pick + l ± 0.03; always drawn | topFinish | finish |
| hardwareFinish | brass, black, metal, white, wood, leather, front, none | knob / bar / cup: mc pick{brass .35, wood .25, black .2, metal .2}; sh {wood .55, black .2, brass .15, white .1}; in {black .5, metal .4, brass .1}; mo {metal .35, black .35, brass .2, white .1}. Forced: lip → wood (= front material when fronts are wood, else brass); cutout / groove → `front` (no part); tab → leather; none → none | style, drawerHandle | finish |
| baseFinish | body, wood, black, metal, brassTip, paint | legs / frameLegs: mc {body .7, black .3}; sh {body .8, paint .2}; in {black .6, metal .4}; mo {black .5, body .5}. plinth / skirt / bun / panelEnds → body. metalFrame / hairpin → black .6 / metal .4. Never white on the floor (stool lesson). | style, baseKind, bodyFinish | finish |
| paintSheen (roughness for painted roles) | 0.45–0.80 | U | — | finish |
| bodyColor / frontColor / topColor / hardwareColor / baseColor / insertColor | hex or null | derived (below) | all of the above, palette | finish |
| roles | `{ body, front, top, hardware, base, insert }` → role key (`'body'`, `'front'`, `'hardware'`, `'top'`, …) | derived by the role merge below | colours | finish |

**Colour derivation (all through the pickers):** wood = `pickWood` swatch (`hsl` of it); painted = `palette.paint`;
accent = `palette.accent`; stone = `STONE_TONES` (+ the table's stone pattern); metal fronts and frames =
`FRAME_COLORS.black` / `FRAME_COLORS.metal`; brass = `capSaturation(0.11, 0.42 ± 0.04, 0.50 ± 0.03)`; white ceramic =
`FRAME_COLORS.white`; leather = the `pickLeather` swatch (core `LEATHERS`, each tone calm by test); cane
insert = `capSaturation(0.11, 0.32, 0.70 ± 0.04)` with holes `harmoniousSecondary(cane, 'dark')`; perforated insert =
the front/frame metal with holes `shade(metal, −0.25)`. Lip handles on painted fronts use brass.

**Role merge (≤ 4 materials, R5).** Collect the distinct (colour, finish kind, pattern) keys in this priority order:
body, front, hardware, then the "fourth slot" candidates top > insert > base. Parts that share a key share one
material instance. If more than 4 keys remain, fold in this order until ≤ 4: base → body when wooden, else → hardware
(take the hardware colour and finish); insert → front (`insertColor = null`, the insert panel uses the front
material); top → body (`topFinish` becomes `match`). Wood knobs and lips on wood fronts always share the front
material. Store the result in `roles` so `build` creates exactly one material per distinct key.

## Re-roll groups
| Order | Group | Owns (`fields`) | Reads | Visibly changes |
|---|---|---|---|---|
| 1 | style (`rollStyle`) | style | — | base language, top, front construction, hardware, finish mix; ⟳ cycles the other styles |
| 2 | kind (`rollCycle`) | kind | — | proportions and the whole face; ⟳ cycles the other kinds |
| 3 | shape | form, width, height, depth, panel, topThickness, topOverhang, topEdge | style, kind | size, proportions, top slab |
| 4 | base | baseKind, legCount, legHeight, legThickness, legSides, legTaper, legSplay, legInsetX, legInsetZ, apronHeight, plinthInset, skirtCut, skirtCutHeight, skirtFoot, bunRadius, endCut, postSize, sideBrace, bottomShelf, bottomShelfHeight | style, kind, shape | legs / plinth / skirt / feet / frame; body height (the face re-fits) |
| 5 | fronts | template, plan, construction, gap, edge, reveal, frameWidth, frontThickness, frontBevel, doorStyle, insertKind, drawerStyle, doorFrameWidth, grainMode, hasFronts | style, kind, shape, base | the face grid, overlay vs inset, door style |
| 6 | hardware (`appliesTo: hasFronts`) | drawerHandle, doorHandle, knobDiameter, barScale, barProfile, projection, cupWidth, cutoutWidth, cutoutHeight, lipFraction, tabLength, vPos, doorInset, doorDrop | style, fronts | handles and knobs |
| 7 | palette (`appliesTo`: something painted) | paint, accent | — | painted / accent colours only |
| 8 | finish | bodyFinish, frontFinish, topFinish, woodName, leatherName, grain, stoneName, hardwareFinish, baseFinish, paintSheen, bodyColor, frontColor, topColor, hardwareColor, baseColor, insertColor, roles | style, base, fronts, hardware, palette | wood / paint / stone, hardware metal, two-tone fronts |

Notes:
- Groups only read earlier groups. `kind` and `style` are independent, so each ⟳ keeps the other.
- `fronts` stores the **plan** (template + slot values), not rectangles. The solver is pure and runs in `build`, so
  re-rolling `shape` or `base` re-fits the same plan to the new face (counts may drop through the solver's degrade
  rules; that is a re-fit, not a new draw).
- `hardware` neutral values: when `hasFronts` is false (NS4, TV4) the fields are `'none'` / 0, and `fronts` decides
  that, so R2's neutral-value rule holds.
- Change rate: every rerollable group owns a continuous field (width, legHeight, gap, barScale/knobDiameter, paint,
  paintSheen), so the rate is ≈ 100 %. `style` and `kind` cycle (100 %). No `CHANGE_RATE_OVERRIDES` entry.
- Shortcuts: `S` → `shape`, `C` → `palette` (`shortcutGroups` finds both by id).
- Distribution tests: `styles` as usual; the test-engineer adds the same ±4 pp check for `definition.kinds` at
  re-roll 0, and for `form` within dressers.

## Kit reuse map
Coordinates: item centred on x and z; `zF = depth/2` is the front face plane of the fronts, the back is at
`−depth/2`. Overlay: carcass front edges at `zF − frontThickness`, fronts occupy [`zF − t`, `zF`]. Inset: carcass
and face-frame front edges at `zF`, fronts occupy [`zF − t − 0.001`, `zF − 0.001`]. Body spans y from `legHeight`
(base top) to `height − topThickness`.

| Part | Helper | Notes |
|---|---|---|
| Top | `puffy(width + 2·overhang, topThickness, depth + overhang, topEdge, mats.top, 3)` | Back flush with the carcass back. `grainAlong(top, 'x')` (near-square nightstand tops would otherwise flip). |
| Carcass sides, bottom, back | core `buildCarcass({ width, depth, y0: legHeight, y1: height − topThickness, panel, back, construction, frontThickness, edge }, mats.body)` (wave-2 kit C5) | Side, bottom and back `beam`s (44 tris each; grain along each beam). Returns the face `field` for `solveFronts`. No top: the cabinet's own `puffy` top caps it. `panelEnds` passes no sides and builds the slab ends instead. |
| Fronts, handles, face-frame members, open-cell dividers / shelves, backers | core `buildFronts(layout, opts, hw, mats)` (C6) | One call per face. Members: `depth: 'face'` → 0.02 deep; `'full'` → carcass inner depth. Backers: front face at the back face of the fronts, so every front touches something (`connected`) and gaps / cut-outs show a recess, not the back panel. |
| Slab fronts | `extrudeProfile(rectOutline, frontThickness, frontBevel, 'front')` | 44 tris (4-point outline, 2 bevel segments, quarter-round edge on all four sides, square corners in the face). `grainAlong(front, grainMode/kind)`. |
| Slab front with a cut-out handle | `extrudeProfile(shapeWithHole, …, 'front')` | Hole = stadium slot (8–12 points) or a top-edge half-moon notch in the outline. About 150 tris. |
| Framed / insert doors and framed drawers | 4 × `beam` (stiles full height, rails between) + recessed centre panel `extrudeProfile` (set back 0.006) | ≈ 220 tris; beams carry their own grain (stiles y, rails x). The insert panel takes the insert material (cane / perforated `dots`). |
| Handles | core `buildHandle` (C3) via `planHandles` (C2), called by `buildFronts` | Back face on the front face plane. |
| Splayed / tapered legs (4 or 6) | `buildLegs(legObject, mats, fp)` with `fp.anchors = rowAnchors(width, depth, legCount / 2, legInsetX, legInsetZ)` | Explicit leg object (R6); `fp.top = legHeight`. Only from the `legs` / `frameLegs` branches. |
| Leg rail frame (frameLegs) | `legLines` + `buildApron(lines, { top: legHeight, height: apronHeight, thickness: 0.02 }, mats.base)` | Rails meet splayed legs via `pointOnLeg`. |
| Plinth | `puffy(width − 2·inset, legHeight + 0.002, depth − frontThickness − inset, 0.006, mats.base, 2)` | Back flush; `grainAlong(…, 'x')`. |
| Arched / notched skirt | `endPanelShape(width, legHeight, { cut: skirtCut, cutWidth, cutHeight })` → `extrudeProfile('front')`; side skirts the same with `'side'` | 3 panels, ≈ 120 tris each. |
| Bun feet | core `buildFeet(anchors, { kind: 'bun', height: legHeight, radius: bunRadius }, mats.base)` (B2, promoted from the sofa) | Anchors from `rowAnchors(width, depth, 2, legInsetX, legInsetZ)`. |
| Slab ends (panelEnds) | `endPanelShape(depth, height − topThickness, { cut: endCut })` → `extrudeProfile('side')` | The ends replace the carcass sides; the bottom sits at `legHeight`. |
| Metal frame | `beam` posts (4, full height to under the top), side rails top and bottom, optional `x` brace (2 slanted `beam`s per side), optional bottom shelf (`beam` slab) | ≈ 10–14 beams, ≈ 0.5k tris. Industrial square sections. |
| Hairpin legs | 2 `strut`s per leg (6 sides, r 0.005–0.007) from a mounting plate (`beam`) to one floor point | Splay θ ≤ 15° per rod. |
| Front grid | core `solveFronts(p.plan, field, opts)` (C1) | Pure; called in `build` with the params' plan. |
| Wood | `kit.materials.wood(swatch, { grain, seed })` | One wood per item; fronts share it when `frontFinish` is match, so grain runs on across fronts (continuous in item space). |
| Paint | `kit.materials.solid(hex, paintSheen)` | |
| Stone top | as the table (`STONE_TONES`, its stone pattern) | |
| Metal / brass / black hardware and frames | `kit.materials.frame(hex, 'metal' / finish)` | |
| Cane / perforated insert | `kit.materials.pattern({ kind: 'dots', layout: 'grid', spacing, size, colors })` | Cane: spacing 0.010–0.014, size 0.28; perforated: spacing 0.008–0.012, size 0.25, metalness 0.6. Architect: `dots` is final for wave 2; a `cane` kind is deferred (all 8 shader programs are taken). |

## New helpers requested
| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| `rollCycle` (rng) → **approved, A1** | `rollCycle(g, groupId, weights)`; `rollStyle(g, s)` becomes `rollCycle(g, 'style', s)` with identical streams (`${seed}/${groupId}/0`, `${seed}/${groupId}/order`) | A second cycled group (`kind`) with a 100 % change rate. | desk (kind: writing / pedestal), bed (size), shelf |
| `solveFronts` (new `src/core/fronts.js`) → **approved, C1** (+ `grade`, per-call options, `maxDoorH`) | `solveFronts(plan, field, opts) → layout` (spec below) | The face layout for every box with drawers and doors. | desk pedestals, wardrobe, bed drawers, kitchen later |
| `handleSlots` (fronts.js) → **approved, C2** (+ `planHandles`, file-drawer rule) | `handleSlots(front, hw) → [{ x, y, axis, length }]` | Placement rules shared by every front user. | desk, wardrobe |
| `frontPanel` (fronts.js) → **approved, C4** | `frontPanel(front, { thickness, bevel, style: 'slab'\|'framed'\|'insert', frameWidth, cut }, mats) → Group` | Slab, framed and insert fronts and cut-outs in one place, with grain set. | desk, wardrobe, bed |
| `buildHandle` + `HANDLE_KINDS` (new `src/core/handles.js`) → **approved, C3** (+ desk `ring`) | `buildHandle(kind, slot, opts, mat) → Group`; `HANDLE_KINDS[kind] = { tris, part: true\|false }` | The handle library (below). | desk, wardrobe, lamps (knobs), bed |
| `buildFeet` → `supports.js` → **approved, B2** | `buildFeet(anchors, { kind, height, radius, edge, sides }, mat)` | Second user (bun feet). | bed |
| `pickWood(r, { weights })` (color) → **approved, A2** | optional per-name weights, still exactly 3 draws | mid-century leans walnut / teak, shaker oak / cherry, modern ash / oak. Without it, uniform. | every wood type |
| `LEATHERS` (palette or color) → **approved, A2** (`color.js`, 5 tones + `pickLeather`) | `{ name, h, s, l }` × 3: tan, cognac, chocolate; every tone passes `colourIsCalm` | Leather tabs; later sofa straps, chair seats. | sofa, chair, bench |
| `cane` pattern kind (optional) → **deferred** (dots) | `{ kind: 'cane', spacing, strand }`: octagonal open weave | `dots` grid approximates cane. A real kind would be the 9th program (the budget says 8 max). | chair seats, headboards, bench |

### `solveFronts`: the front-layout solver
**Scope.** Pure and deterministic: no rng, no THREE objects. The random part is the **plan**, drawn in `generateParams`
(fronts group). `build` calls `solveFronts(p.plan, field, opts)` and turns the result into parts. The same plan always
gives the same layout for the same field, and a re-fit to a new field is smooth.

**Plan (JSON, stored in params).** A tree of at most 3 levels.

| Node | Fields |
|---|---|
| split | `{ split: 'x' \| 'y', children: [Node], weights: [w…] or sizes, symmetric: bool }`. A child may have a fixed `size` in meters instead of a weight; fixed sizes are taken first, weights share the rest. |
| drawers leaf | `{ leaf: 'drawers', count: n, across: a, grade: g }`: a × n drawers; `count` stacks along y (top first), `across` side by side. |
| doors leaf | `{ leaf: 'doors', hinge: 'auto' \| 'left' \| 'right' \| 'bottom' }`. 1 or 2 leaves by width; `'bottom'` = flap. |
| open leaf | `{ leaf: 'open', shelves: s }` |

**Field.** `{ x0, x1, y0, y1, z }` in item space: the face to fill. Overlay: the carcass outline shrunk by `edge`
(top edge at the underside of the top). Inset: the opening inside the carcass panels (sides, bottom, top board).

**Options.**

| Option | Default | Meaning |
|---|---|---|
| `construction` | `'overlay'` | `'inset'` puts a face-frame member of `frameWidth` at every split line and `reveal` around each front |
| `gap` | 0.004 | separator between overlay fronts |
| `frameWidth` | 0.02 | inset members; overlay dividers next to open cells |
| `reveal` | 0.0025 | inset front to opening |
| `minDrawerH` / `maxDrawerH` | 0.09 / 0.30 | front height limits |
| `minDrawerW` / `maxDrawerW` | 0.22 / 1.00 | wider drawer leaves split `across` automatically |
| `minDoorW` / `maxDoorW` | 0.22 / 0.60 | wider door leaves become a pair |
| `minOpenW` / `minOpenH` | 0.18 / 0.12 | open cell limits |
| `maxDoorH` | `Infinity` | doors taller than this split into a stacked pair (wardrobe; added by the architect, unused by the cabinet) |
| `maxFronts` | 16 | budget cap (drawers + door leaves) |
| `grainMode` | `'classic'` | sets each front's `grain` (`continuous`: all `'x'`; `classic`: drawers `'x'`, doors `'y'`, flaps `'x'`) |

**Algorithm.**
1. **Separator.** For a split with n children, `sep = inset ? frameWidth : gap`, except that an overlay separator next
   to an open child is `frameWidth` (a real divider or shelf). `available = span − Σ sep`.
2. **Sizes.** Fixed-size children get `clamp(size, childMin, childMax)`. The rest share what is left in proportion to
   their weights. Then water-fill: any child below its minimum is pinned at the minimum and the others are rescaled;
   repeat until stable (at most n passes). Child minimums come from their subtree (a drawer stack of n needs
   `n·minDrawerH + (n − 1)·sep`; a door leaf `minDoorW`; open `minOpenW/H`).
3. **Leaves.**
   - Drawers: `n' = clamp(n, ceil((H + sep)/(maxDrawerH + sep)), floor((H + sep)/(minDrawerH + sep)))`; heights
     top → bottom `h_i = h_0·g^i` with Σ h_i = H − (n' − 1)·sep. If `h_last > maxDrawerH` or `h_0 < minDrawerH`, lower g
     towards 1 until both hold. `across' = max(a, ceil(W / maxDrawerW))`, then reduce while `W/a' < minDrawerW`.
   - Doors: 1 leaf if `W ≤ maxDoorW`, else 2 (a pair meeting at the bay centre). A door wider than `2·maxDoorW` is
     allowed up to 0.7 m per leaf and sets `stats.wideDoors`. `hinge: 'auto'`: a single door hinges on the side away
     from x = 0 (centred doors: left); a pair hinges outward. Flaps hinge `'bottom'`.
   - Open: `s' = min(s, floor(H / minOpenH) − 1)` evenly spaced shelves.
4. **Symmetry.** In a `symmetric` split, sizes are computed for the left half and mirrored, and hinges mirror too.
   Template weights are palindromic by construction.
5. **Rectangles.** Overlay: leaf cells tile the field with `sep` between them; each front rect = its cell. Inset: each
   cell is an opening; the front rect = the opening shrunk by `reveal` on every side; one member per split line,
   spanning the node's perpendicular extent.
6. **Degrade (deterministic, in this order, until the minimums fit and fronts ≤ `maxFronts`).** (a) reduce counts:
   stack n, across a, shelves s, bay count k; (b) collapse a split: symmetric → drop the outermost pair (merge their
   weight into the neighbours); asymmetric → drop the last child; (c) fallback to one leaf (nightstand: `Dn` with n = 2;
   others: a doors leaf). `stats.degraded = 'none' | 'counts' | 'collapsed' | 'fallback'`.

**Output.**

| Field | Contents |
|---|---|
| `fronts` | `[{ kind: 'drawer' \| 'door' \| 'flap', x0, x1, y0, y1, z0, z1, hinge, grain, bay, row, index }]`; z from the construction |
| `open` | `[{ x0, x1, y0, y1, shelves: [y…] }]` |
| `members` | `[{ axis: 'x' \| 'y', x0, x1, y0, y1, depth: 'face' \| 'full' }]`: inset face frame and dividers; `full` where an open cell borders it |
| `closed` | `[{ x0, x1, y0, y1 }]`: backer regions, one per contiguous closed run in a bay |
| `stats` | `{ drawers, doors, open, fronts, degraded, symmetric, wideDoors }` (for describe and tests) |

**Solver invariants (unit tests in `tests/unit/fronts.test.js`, over every template × 4 styles × 200 random fields).**
Fronts and open cells are disjoint and inside the field; every separator is ≥ `sep − 1e-6`; drawer heights stay in
[min, max]; door leaves ≤ 0.6 m unless `wideDoors`; fronts ≤ 16; symmetric plans mirror about x = 0 within 1 mm;
the same input gives deep-equal output; a field change of 1 mm changes no counts unless a limit is crossed.

### `handleSlots`: placement rules
| Front | Count | Position | Axis |
|---|---|---|---|
| drawer, knob / cup / tab / cutout | 2 when `w > 0.70` (at x = ±w/4 from the centre), else 1 (centre) | `vPos` centre: `yc`; top: `y1 − max(0.025, min(0.06, 0.3·h))` | x |
| drawer, bar | 2 when `w > 0.96` (quarter points), else 1; length = `barScale·w/3` snapped to 32 mm, clamped 0.096–0.32 and ≤ w/2 − 0.02 when 2 | as above | x |
| drawer, lip / groove | 1, width `lipFraction·w` (groove: full width) | on the top edge | x |
| door (side-hinged) | 1, on the opening side: x = `x1 − doorInset` (hinge left) or `x0 + doorInset` | bar / lip / cutout: top of the handle at `y1 − doorDrop`; knob / cup / tab: centre at `y1 − doorDrop`; doors shorter than 0.30 m: centre | bar, lip, cutout, groove: y; knob: — |
| flap (hinge bottom) | as a drawer | top edge | x |
| none | 0 | — | — |

Fit rules: every handle footprint stays inside its front shrunk by 0.008; a bar that does not fit is shortened to
the next 32 mm step, then down to 0.064; a knob shrinks to `0.6·h` (min 0.018); a cut-out needs `h ≥ 0.09`, else
that front uses `groove`. **Budget fallback:** if the item's handle triangles (from `HANDLE_KINDS`) would exceed 2.2k,
drawers use one handle each.

### `buildHandle`: the handle library
Every handle is built facing +z with its back face on the slot's z (the front face), so it touches the front
(`connected`). All curved edges have ≥ 2 facets (R3).

| Kind | Geometry | Size | Tris (each) | Material |
|---|---|---|---|---|
| knob | `latheSolid`, 8 sides, 5-point profile (stem, neck, domed head); shaker wood knobs a fuller mushroom | ⌀ 0.025–0.038, projection 0.022–0.030 | ≈ 96 | hardware, or front when wood |
| bar | round: 1 horizontal `strut` (6 sides) + 2 `strut` posts; square (industrial): 1 `beam` + 2 `beam` posts | ⌀ / section 0.010–0.014, length 0.064–0.32, projection 0.025–0.035 | 72 round / 132 square | hardware |
| cup | `extrudeProfile('side')` of a C-shaped hood section (8 points, open side up), width along x | width 0.076–0.096, height 0.03–0.04 | ≈ 90 | hardware |
| cutout | no part: a stadium-slot hole (drawers) or half-moon notch (top edge) in the front outline via `frontPanel({ cut })` | 0.08–0.12 × 0.025–0.035 | +≈ 110 on the front | front (the backer shows behind) |
| groove | no extra material: the front is shortened by 0.02–0.025 at the top; the backer, set 0.012 deeper, reads as a channel | full width | 0 | — |
| lip | one `beam` along the top edge with a large radius (0.4 × thickness), projecting 0.012–0.020, its top flush with the front's top | `lipFraction·w` × 0.02–0.03 | 44 | front wood, else brass |
| tab | 2 `beam`s: a short strap hanging forward from a fixing point (a V loop), 0.004 thick | 0.020–0.030 wide × 0.045–0.07 long | 88 | leather |
| none | — | — | 0 | — |

## Failure modes and guards
| Failure | Guard | Test |
|---|---|---|
| Item floats | Every floor part (legs, plinth, skirt, bun, slab ends, frame posts, hairpin rods) has its bottom face at y = 0; no floor-reaching tubes. Splayed legs θ ≤ 11° (sink ≤ 5 mm). | grounded (parts + merged) |
| Floating fronts or handles | Fronts' back faces touch the carcass edges (overlay) or the backers (inset, reveal ≤ 3 mm, so bbox contact holds within `CONTACT_GAP`); handles sit on the front face; cut-outs and grooves have a backer behind | connected |
| Fronts overlap each other or the carcass | The solver's disjoint / inside-field invariants; inset members and fronts come from the same split lines | `fronts.test.js`; type check: front rects ⊆ face field |
| Handles collide or hang over a front edge | `handleSlots` fit rules (footprint ⊆ front − 0.008); two handles at quarter points only above 0.70 m | type check: handle bbox x/y ⊆ its front's rect |
| Door pair with handles on the hinge side | `hinge: 'auto'` (outward pairs, single doors away from centre); handles always on the opening side | unit test on `handleSlots` |
| Drawers too thin or too tall, doors too wide | Solver limits 0.09–0.30 m, doors ≤ 0.60 m (pair above), degrade order | `fronts.test.js` |
| Cut-out bigger than its front | width ≤ 0.6·w, height ≤ 0.4·h, needs h ≥ 0.09, else groove | unit test |
| Tipping (tall chest on legs, nightstand on hairpins) | tallChest: no hairpin, legs ≤ 0.15 m and `legInsetX ≤ 0.10`; `legHeight ≤ 0.4 × height`; foot contact hull = leg anchors (inside the carcass footprint) | stable |
| Spindly long sideboard | 6 legs above 1.5 m (`rowAnchors` 3 per row); wood legs ≥ 0.03 m | param range test |
| Legs poke out past the top | `legSplay ≤ legInsetX`; anchors inset; hairpin rods splay inward in x | type check: base plan bbox ⊆ top plan bbox |
| Kinds blur (TV vs sideboard, nightstand vs dresser) | Height windows: tv ≤ 0.60, sideboard ≥ 0.68; nightstand width ≤ 0.60, dresser ≥ 0.70; `width ≥ 1.6·height` (sideboard), `≥ 2.5·height` (tv); TV templates favour open niches and flaps | type check: height / width window per form; snapshot |
| Styles blur | Base kind tables keep each style's signature (mc raised legs ≥ 0.12 m in 80 %; sh overhang ≥ 15 mm; in visible metal; mo plinth inset ≥ 35 mm or slab ends) | snapshot review per style |
| Handleless face unreadable | `none` only 10 % of modern; modern gaps ≥ 4 mm; front bevel ≥ 3 mm (the gap reads as a bevel highlight under flat shading) | snapshot |
| Same colour fronts and body read as one block | Bevel + backer recess; `frontFinish` painted / accent options; shaker inset frames | snapshot |
| Grain stripes the wrong way / flips between seeds | `grainAlong` explicit on top (x), sides (y), fronts (`front.grain`), plinth (x); beams carry their own axis | snapshot; patterns board |
| Z-fighting | Top sits on the sides (no shared face); backers are inside openings; framed-door panels set back 0.006; plinth recessed; overlay fronts are proud of the carcass edges | snapshot |
| Too many triangles | ≤ 16 fronts; handle budget fallback; beams for every bar; one `puffy` 3 (the top) | budget report: p95 ≤ 4.5k, max ≤ 6k |
| Too many draw calls | Role merge to ≤ 4 keys | type check: distinct materials ≤ 4 |
| Loud colours | Every colour through the pickers; brass and leather through `capSaturation`; cane / perforated holes tonal (`harmoniousSecondary 'dark'`, `shade`) | colour-calm (500 seeds) |
| White legs vanish on the floor (wave-1 stool lesson) | `baseFinish` never white | param test |
| Item bigger than its cell | `width + 2·topOverhang ≤ 2.0`; depth + overhang + handle projection ≤ 0.6 | fitsCell |
| Off-centre | Carcass centred in x; asymmetric templates are still inside ±width/2 | `centredInX` |

Proposed `TYPE_RULES.cabinet`: `maxSize { width: 2.0, height: 1.42, depth: 0.6 }`; checks `centredInX`,
`frontsInField`, `handlesOnFronts`, `formWindow` (height / width window per form), `materialsAtMost4`,
`baseUnderTop`.

### Budget estimate (worst case per style)
| Style | Parts → tris | Total |
|---|---|---|
| midcentury (sideboard SB4, 6 legs, frame) | top 588 + carcass 5 × 44 + backers 2 × 44 + 4 fronts × 44 + 3 drawers × 44 + 2 insert doors × 220 + 7 lips/knobs × ≤ 96 + 6 legs × ~60 + apron 4 × 44 | ≈ 2.4k |
| shaker (low dresser LD3, inset, framed drawers, knobs) | top 588 + carcass 220 + face frame 6 × 44 + 5 fronts × 220 + 8 knobs × 96 + skirt 3 × 120 | ≈ 3.3k |
| industrial (apothecary LD5 4 × 4, cup pulls, frame) | top 588 + carcass 6 × 44 + backers 4 × 44 + 16 fronts × 44 + 16 cups × 90 + frame 14 × 44 | ≈ 3.8k |
| modern (sideboard SB3, cut-outs, plinth) | top 588 + carcass 220 + backer 44 + 4 cut-out doors × 150 + plinth 300 | ≈ 1.8k |

## describe() rows
| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `Mid-century`, `Shaker`, `Industrial`, `Modern` |
| kind | Kind | `Sideboard`, `Dresser`, `Tall chest`, `Nightstand`, `TV unit` (dresser shows its form) |
| shape | Size | `160 × 45 cm` |
| shape | Height | `78 cm` |
| shape | Top | `2 cm · 2 cm overhang` / `flush` |
| base | Base | `6 legs · splayed`, `legs + rail frame`, `plinth`, `arched skirt`, `bun feet`, `slab ends`, `metal frame · X brace`, `hairpin legs` (words from `baseKind`) |
| base | Clearance | `22 cm` |
| fronts | Layout | `3 drawers · 2 doors · 1 open` (from `stats`) |
| fronts | Fronts | `overlay` / `inset` · `slab` / `framed` / `cane` / `perforated` |
| hardware | Handles | `brass knobs`, `wooden lips`, `cup pulls`, `cut-outs`, `leather tabs`, `push to open` |
| palette | Colours | `{ swatches: [paint, accent] }` (only when the group applies) |
| finish | Body | `walnut (fine grain)`, `painted sage` |
| finish | Fronts | `match`, `painted`, `accent`, `black metal` |
| finish | Top | `match`, `oak`, `white marble` |
| — | swatches | `[bodyColor, frontColor if different, topColor if different, hardwareColor]` |

## Grid cell
spacing: 2.3 m, **spacingZ: 1.5 m** (architect, W2), gridSize: 9 (81 items).
- **Driver:** the longest top is 2.0 m (sideboard / TV width 1.95 + overhang, clamped). Fits-cell limit is 2.2 m, so
  0.2 m of headroom, the same as the table.
- **Depth:** at most 0.6 m including handles. `spacingZ` 1.5 leaves 0.9 m of fits-cell headroom in z and keeps 1.4 m
  tall chests from hiding the row behind at the default camera (check in the snapshot).
- **Small kinds:** nightstands (0.4–0.6 m) look small in a 2.3 m cell, like side tables do. Accepted.
- **All view:** `mixWeight` 1 (W8); the All view packs measured footprints and ignores `spacingZ`.
- **Budget:** ~2.5k tris median × 81 ≈ 0.2M tris for a full grid, trivial.

## Open questions
1. ~~**Kind vs style.**~~ I made the design language the `style` and the piece a second rerollable `kind` group cycled
   by a new `rollCycle` helper. The alternative is kinds as styles (sideboard / dresser / nightstand / tv) with the
   language in the shape group, closer to the "styles are silhouettes" rule but losing "same piece, other style".
   Which do you want?
   **Architect:** kind as a second cycled group (W1). It also lets the wave-4 ensembles pin a piece (bedroom →
   nightstand) without searching styles. Listed for the human gate because it adds a second cycling ⟳.
2. **A fourth style.** The plan lists mid-century, shaker and industrial. I added `modern` (handleless, plinth, slab
   ends) because it is the most common look today and a very different silhouette. Keep it, or swap it for
   campaign (brass corners), art deco (rounded ends), or rattan / boho?
   **Architect (recommendation):** keep `modern`: plinth shadow line and slab ends are a distinct silhouette, and the
   handleless face exercises `cutout` / `groove`. Campaign and deco can come with the wardrobe wave.
3. ~~**Cane.**~~ Approximate it with the `dots` pattern (grid layout, dark holes on a rattan ground), or add a real
   `cane` pattern kind as the 9th shader program (the budget says 8 kinds max)?
   **Architect:** `dots` (grid) in wave 2; `cane` deferred to a pattern-budget review.
4. ~~**Non-square cells.**~~ Cabinets are ≤ 0.6 m deep in a 2.3 m square cell. Should the architect enable
   `cell.spacingZ` (R4 reserved it for wave 2) for cabinets and beds now?
   **Architect:** yes for cabinets (2.3 × 1.5) and desks; beds and shelves stay square (W2).
5. ~~**Exaggerated gaps.**~~ Real gaps are 2–3 mm; I draw 3–8 mm so the face reads at item distance. OK, or keep real?
   **Architect:** approved (the inset `reveal` stays ≤ 3 mm for `connected`).
6. ~~**Ajar drawers / doors.**~~ One drawer slightly open or one door ajar in a few seeds adds a lot of charm but brings
   intersection and `connected` work (drawer boxes inside). Wanted for this wave, or later?
   **Architect:** later (needs drawer boxes and an intersection allow-list).
7. ~~**Sliding doors, tambour and glass vitrines.**~~ Left out: sliders need two z-tracks, tambour needs many slats, and
   glass needs the `glass` role (+1 draw call). Defer to the wardrobe wave?
   **Architect:** deferred to the wardrobe wave.
8. ~~**Wave-3 decoration slots.**~~ Should params expose the top surface (and open-cell floors) as placement rects now, so
   lamps and plants can sit on cabinets later?
   **Architect:** not in params. Add a pure cabinet-local `surfaces(p)` returning the shared `Surface` records (top and
   open-cell floors, W5) now, so a later wave can fill them with `buildDecor`. Open cells stay empty in wave 2 (a
   decor role would push some seeds to 5 materials).
9. ~~**Wood bias per style**~~ (`pickWood` weights: walnut / teak for mid-century, oak / cherry for shaker). Worth the
   small core change, or stay uniform?
   **Architect:** approved (A2, `pickWood(r, { weights })`); weights in `WOOD_BIAS` above.
10. ~~**`fronts.js` scope.**~~ The solver, slot rules, `frontPanel` and the handle library are specified for the cabinet
    but should serve the desk (pedestal = one `Dn` bay) and the wardrobe (tall door pairs, ≤ 2.1 m doors need a
    `maxDoorH` option). Should the architect build those options in now?
    **Architect:** yes: per-call options (the desk's drawer limits), `grade` on drawer leaves and `maxDoorH` are in C1;
    `buildCarcass` (C5) and `buildFronts` (C6) serve both users.

## Architect review (wave 2, M4)

**Verdict: approved with edits.** A thorough spec: the face-grid solver is the right abstraction, the templates sum to
1.00 per (form, style), the draw rule keeps re-fits smooth, and the role merge keeps every seed at ≤ 4 materials. The
solver, slot rules, front panel and handle library become the shared core `fronts.js` / `handles.js` that the desk
also uses. Final names, signatures and order are in `specs/_kit-additions-wave2.md`.

Changes (applied above):
1. **Kind stays a group (W1).** `rollCycle` is approved (A1); the definition declares `kinds` and the test-engineer adds
   its ±4 pp distribution check. At most one extra cycled group per type.
2. **Carcass from core `buildCarcass` (C5)**, fronts / handles / members / backers from core `buildFronts` (C6), the
   grid from `solveFronts` (C1, with `grade`, per-call options and a new `maxDoorH` option for the wardrobe). The
   cabinet's own top, base and slab ends stay in the generator (`buildCarcass` has no top and can skip its sides for
   `panelEnds`).
3. **Bun feet** from the promoted core `buildFeet` (B2) with the new signature.
4. **Leather** is the core `LEATHERS` / `pickLeather` (A2, 5 tones). The finish group draws it on every seed (3 more
   draws, 17 in total) and owns the new `leatherName` field.
5. **Wood bias** via `pickWood(r, { weights })` (A2) with a cabinet-local `WOOD_BIAS` per style. The WOODS set has no
   teak or ash: `honey` stands in for teak and `birch` for ash.
6. **Cane** stays the `dots` grid (no 9th shader program in wave 2).
7. **Grid:** `spacingZ` 1.5 (W2).
8. Open questions 1, 3–10 answered inline; 2 has a recommendation.

Notes for the generator-engineer:
- The `ring` handle kind exists in the shared library (for the desk); the cabinet does not roll it.
- File-drawer rule in `handleSlots` (C2): drawers taller than 0.24 m with `vPos: 'centre'` place the handle at
  `y1 − h/3`. Graduated bottom drawers of 0.25–0.30 m get this; it matches period dressers.
- Wide tops (sideboard and tv, up to 2.0 m) show the deferred "pinstripe on wide tops" issue with `fine` grain. Use
  grain weights {fine .25, plain .55, bold .20} for those forms and keep `grainAlong(top, 'x')`.
- `palette.appliesTo` reads finish fields (as on the table): keep `paint` / `accent` drawn on every seed.
- Expose `surfaces(p)` (cabinet-local, pure, shared `Surface` records, W5) for later decor; do not store it in params.
