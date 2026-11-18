# Kit additions for wave 2

Backlog M4, the wave-2 counterpart of 2.6 (architect). Inputs: `specs/shelf.md`, `specs/cabinet.md`, `specs/desk.md`,
`specs/bed.md`, the wave-1 rulings in `specs/_kit-additions.md` (R1–R7, all still in force), the current `src/core/`
(`rng`, `color`, `palette`, `patterns`, `geometry`, `layout`, `supports`, `materials`, `merge`, `item`), the
generator-local helpers in `src/furniture/{table,sofa,bench}` and `plan/07-backlog.md` (M4, deferred issues).

The file has three parts:

1. **Cross-spec rulings** W1–W9. They are already applied to the four specs (each spec ends with an "Architect review").
2. **Helper list** in implementation order, deduplicated across the specs.
3. **Implementation checklist**, including the wave-1 regression check for promotions.

Every new core helper gets a unit test (`tests/unit/core-helpers.test.js`, or a new `fronts.test.js`, `fill.test.js`,
`soft.test.js`) and a row in the furniture-kit skill's helper catalogue in the same PR.

---

## Part 1: Cross-spec rulings

### W1. Second cycled group: `kind` is a group, not a style (cabinet)

**Ruling: approved as designed.** The cabinet keeps `style` = design language (midcentury, shaker, industrial, modern)
and adds a rerollable `kind` group (sideboard, dresser, nightstand, tv) right after it, cycled like R1 styles.

Why:
- Both axes are silhouettes at grid distance: kind sets the proportions, style sets the base (raised legs, plinth,
  skirt, metal frame). The "styles are silhouettes" rule holds for both.
- "Same piece in another style" and "same style, another piece" are both one ⟳ press. Palette and finish streams are
  untouched by either.
- The wave-4 ensembles need to ask for a *specific piece* (a nightstand for the bedroom set, a sideboard for the dining
  set). A `kind` field that does not depend on the style stream makes that a pin on one group, not a hunt through styles.

Contract additions:
- `rollCycle(g, groupId, weights)` (helper A1) cycles any group like `rollStyle`. `rollStyle(g, s)` becomes
  `rollCycle(g, 'style', s)` with byte-identical streams.
- A definition may declare `kinds: { id: weight }`. The distribution test checks it like `styles` (±4 pp over 2,000
  seeds at re-roll 0). At most **one** extra cycled group per type; any other group uses `g.roll`.
- No other wave-2 type needs `rollCycle`: the desk's support layouts and the bed's mattress sizes are ordinary picks
  inside `base` / `size`, which own continuous fields and so change on every re-roll anyway.

### W2. `cell.spacingZ` lands in wave 2, opt-in, for low deep-less types only

R4 reserved the field for wave 2. **Ruling: add `cell.spacingZ` (optional, defaults to `spacing`).**

| Type | spacing × spacingZ | Max x / z footprint | Why |
|---|---|---|---|
| shelf | 1.8 × 1.8 (square) | 1.60 × 0.62 | Items are up to 2.1 m tall. Tighter rows hide the shelf behind. |
| cabinet | 2.3 × 1.5 | 2.00 × 0.60 | 0.6 m deep pieces in 2.3 m rows left 1.7 m of bare floor per row. 1.5 keeps tall chests (1.4 m) from hiding the row behind at the default camera. |
| desk | 2.1 × 1.6 | 1.80 × 0.82 | Standing desks reach 1.18 m (+ riser). |
| bed | 2.6 × 2.6 (square) | 2.35 × 2.38 | Beds are near-square in plan. |

Scope (not core, so not in Part 2): `src/app/grid.js` (cell centres), `src/app/main.js` (floor size and camera framing
use `max(gridSize·spacing, gridSize·spacingZ)`), `tests/helpers/invariants.js` (fits-cell checks x against
`spacing − 0.1` and z against `spacingZ − 0.1`), the furniture-kit contract table, `plan/02`. The All view ignores it
(it packs measured footprints). Owner: ui-engineer (grid, camera) + test-engineer (fits-cell). Fallback if it slips:
square cells; every spec fits them.

### W3. Budgets: no exceptions for fills and soft goods

The per-item budget from `plan/02` stays: **≤ 6k triangles, ≤ 4 draw calls, ≤ 4 ms median build**. No type gets the
`≤ 6` draw-call allowance (no glass, no emissive in wave 2).

- **Shelf contents** are budgeted *by construction*: the layout stops adding items when `frameTrisMax(style) + used +
  next > 5800` (spec rule 7). `frameTrisMax` per style is held by a unit test against the built frame.
- **Desk props** take a fixed allowance of **700 tris** (laptop slab 44 + 4 books × 28 + cup ≈ 80 + inlay 44 ≈ 280, with room for a riser stack).
- **Bed soft goods** are ≤ 2.75k by the spec's table; `drapeSheet` asserts ≤ 900 tris per call, `pillow` costs
  `4·grid² + 8·grid`.
- **Cabinet** handles fall back to one handle per drawer above 2.2k handle triangles (spec rule).
- Every type's `TYPE_RULES` budget check runs over 500 seeds (p95 ≤ 4.5k is a target, not a gate; max ≤ 6k is a gate).

### W4. Material roles: a vertex-colour role counts like any other

R5 still holds: **≤ 4 material roles per item**, listed in the spec with the item-wide maximum.

- The new `materials.vertexColor()` material is **one role** (`decor`). At most one per item. It carries every small
  multi-coloured part (books, objects, bins, laptop, pen cup, desk inlay). Shader patterns cannot decorate it: accepted.
- `mergeByMaterial` keeps `color` only on meshes whose material has `vertexColors = true` and fills a missing `color`
  with white (helper A3). No other material may receive a `color` attribute.
- Vertex colours go through the pickers like any other colour, and the calm test reads them (K8, test-engineer).
- Bed: 4 roles (frame, bedding, duvet, accent). No 5th role for wood feet (bed open question 1: keep 4).

### W5. Decor on surfaces: one shared approach (shelf contents, desk props, later cabinet tops)

The three specs asked for the same thing three ways. **Ruling:**

1. **Surfaces.** Each type exposes a generator-local pure function returning
   `Surface = { id, x0, x1, y, clear, zBack, zFront, back: bool }` in item space (`back` = something to lean a picture
   frame against). Shelf: `bays(p)`. Desk: `propZones(p)`. Cabinet: `surfaces(p)` (top and open cells; exposed now,
   filled in a later wave).
2. **Records, not meshes, in one vocabulary** (core, `fill.js`): book `b`, stack `s`, `vase`, `bowl`, `orb`, `cup`,
   `box`, `slab` (laptop, tray), `frame`, `bin`, and the reserved `plant` (no geometry yet; layouts never emit it in
   wave 2). Each record carries `x` (left edge from `x0`), optional `z` (centre offset, default: centred in depth),
   sizes, `yaw`, `lean` and a colour index `c`.
3. **Variable-length layouts are regenerated, not stored.** Params hold the *recipe* (mood, colours, a `fillSeed`
   integer drawn in the decor group, an inset). `build` calls the pure layout with `createRng(\`${p.fillSeed}\`)` and
   the surfaces. Small fixed sets (the desk's laptop size, 2–4 book sizes) may stay in params as plain fields.
4. **One builder.** `buildDecor(records, surface, colours, mat)` writes a surface's records into one non-indexed
   vertex-coloured geometry and returns one `Mesh` per surface.
5. **Own group, last; on/off toggle earlier.** The decor group is the last group (shelf `contents`, desk `props`). An
   on/off toggle lives in an earlier group (desk `clutter` in `top`), so the decor group's change rate stays ~100 %.
6. **Shared invariants** (test-engineer): `decorSupported` (every record's bottom within 1 mm of its support) and
   `decorInside` (every decor vertex inside its surface box) in `tests/helpers/invariants.js`, used by shelf and desk.

**Why regenerate (shelf open question 10).** Stored `fill` reached ~12 kB per item, ~1 MB for a grid, and made every
param dump unreadable. A seeded layout keeps `build` a pure function of params: same params → same geometry, and no
entropy enters from outside. The rule "build has no randomness" is clarified, not dropped: **build may derive detail
from a seed that is a param owned by a group** (the bed's `wrinkleSeed` and every pattern's `seed: p.seed` already do
this). `generateParams` may run the same layout once to derive summary fields (`bookCount`, `objectCount`) for
`describe()`. The furniture-kit "Do / don't" list and `plan/02` get this sentence.

### W6. Promotions keep wave-1 output identical, proven by a geometry-hash check

Three wave-1 local helpers get second users and move to core (R7): table `turnedLeg` → `turnedPost`, sofa `buildFeet`
→ `buildFeet`, bench `buildFramedBack` → `buildFramedPanel`. `rollStyle` is refactored onto `rollCycle`, `buildTrestle`
gains an option and `mergeByMaterial` a colour rule. Stool, table, bench and sofa have no golden files, so:

- **Before/after geometry hash (required in the PR).** A script (`scripts/geometry-hash.mjs`, test-engineer) generates
  and builds seeds 1–200 of chair, stool, table, bench and sofa through `mergeByMaterial`, and hashes per item: the
  params JSON, and per merged mesh the material key plus the bytes of `position`, `normal`, `uv`, `grain`, and the
  triangle count. Run it on `main` before the change and after each promotion; the diff must be empty. Also run each
  type with `r=…style1…style4` re-roll maps (covers `rollCycle`).
- **Keep it.** Commit the output as `tests/golden/wave1-geometry-hashes.json` with an update script (like the chair's
  `update-geometry.mjs`). An intentional wave-1 look change regenerates it in the same PR, so drift is always visible.
- The wave-1 callers switch to the core helper in the same PR as the promotion; the local copy is deleted.

### W7. Soft goods are core; the sofa does not adopt the new pillow in wave 2

`src/core/soft.js` (`pillow`, `drapeSheet`) is approved as specified in `specs/bed.md`. **The sofa keeps its
`puffy` pillows in wave 2.** Switching changes every sofa's look and touches the deferred sofa pillow issues
(placement, sinking, edge-on), which need the sofa's own visual review. Schedule it as a separate sofa PR after the
bed's first visual review, with a before/after contact sheet for the human.

### W8. All view: per-type mix weights

`mix.js` picks each All slot with weight 1 per type. With 9 types, one in nine slots would be a 2.3 m bed. **Ruling:**
definitions may declare `mixWeight` (default 1). Wave 2 values: **bed 0.5**, sofa 0.75, all others 1. Adding four
types already reshuffles which type sits in each `type=all` slot, so old All links change anyway (note it in the PR);
`?type=<id>` links are unaffected. Owner: ui-engineer (`pickType` reads `definition.mixWeight ?? 1`).

### W9. Front vocabulary is shared (cabinet and desk)

Every front user speaks the cabinet's words:

| Concept | Field / values |
|---|---|
| Construction | `construction: 'overlay' \| 'inset'` |
| Gap between overlay fronts / inset reveal | `gap` (m) / `reveal` (m, ≤ 0.003 so `connected` holds) |
| Front look | `drawerStyle: 'slab' \| 'framed'` (framed only on drawers ≥ 0.15 m high), `doorStyle: 'slab' \| 'framed' \| 'insert'` |
| Handles | `HANDLE_KINDS`: `knob`, `bar`, `cup`, `ring`, `tab`, `lip`, `cutout`, `groove`, `none` |
| Plans | the solver's plan tree (`split` / `drawers` / `doors` / `open` nodes) |

The desk's `frontStyle` (slab / inset / shaker) becomes `construction` + `drawerStyle`; `reveal` becomes `gap`; the
`edge` handle becomes `groove`; `handlePairs` disappears (the slot rules decide). The cabinet's `ring` gap is filled by
the desk's request.

---

## Part 2: Helper list, in implementation order

Priority: **W2** = a wave-2 generator needs it. **Defer** = the spec has a working fallback (named), so the helper can
slip without blocking a generator. "Regression risk" covers the chair golden (byte-identical params and geometry plus
per-seed triangle counts) and the wave-1 hash check (W6).

### Phase A: core primitives (additive, or identity-checked)

| # | Helper | Module | Signature and behaviour | Users | Merges | Priority | Regression risk |
|---|---|---|---|---|---|---|---|
| A1 | `rollCycle` | `rng.js` | `rollCycle(g, groupId, weights)`: base = `weightedPick(createRng(\`${g.seed}/${groupId}/0\`), weights)`; n = `g.count(groupId)`; n = 0 → base; else `cycle = [...weightedShuffle(createRng(\`${g.seed}/${groupId}/order\`), others), base]`, return `cycle[(n − 1) mod len]`. `rollStyle(g, s) = rollCycle(g, 'style', s)`. Call outside `g.roll`, modern mode only. | cabinet (`kind`); every modern type via `rollStyle` | cabinet `rollCycle`; desk/bed/shelf "kind" mentions (not needed, W1) | W2 | Chair none (no `rollStyle`). Wave-1: `rollStyle` streams must be identical; W6 hash run with style re-roll maps 0–6. |
| A2 | `pickWood(r, { weights } = {})`, `LEATHERS`, `pickLeather(r)` | `color.js` | `pickWood`: without `weights`, today's code path unchanged (`r.pick`); with `weights` (`{ name: w }`, missing names 0), `weightedPick` replaces `r.pick`. Still exactly 3 draws. `LEATHERS`: `{ name, h, s, l }` × 5: tan, cognac, chocolate, oxblood, bottle green; every tone ± 0.03 l passes `colourIsCalm` (unit test). `pickLeather(r)`: 3 draws (pick, h ± 0.01, l ± 0.03), returns `{ name, h, s, l, hex }`. | cabinet (wood bias per style, leather tabs), desk (leather inlay), shelf/bed (`pickWood` unchanged) | cabinet `pickWood` weights, cabinet `LEATHERS`; desk's curated "leather" accent | W2 (`LEATHERS`); Defer for weights (fallback: uniform woods) | None: the no-weights path is the current code. |
| A3 | `materials.vertexColor({ roughness = 0.85 })` + `mergeByMaterial` colour rule | `materials.js`, `merge.js` | `MeshStandardMaterial({ color: '#ffffff', vertexColors: true, flatShading: true, roughness })`, `userData.role = 'decor'`. Merge: groups whose material has `vertexColors = false` delete `color` (like `grain`); in vertex-colour groups `fillMissingAttributes` fills a missing `color` with 1, not 0 (other attributes still zero-fill). | shelf, desk | shelf K1, K3 | W2 | Chair/wave-1: no part carries `color` today, so deleting it is a no-op. Unit test + W6 hash. |
| A4 | `paintVertices`, `bookGeometry`, `DECOR` | new `fill.js` | `paintVertices(geometry, colour)`: `colour` hex or `(localNormal) => hex`; writes a non-indexed `color` attribute (linear, via `Color.setHex`), per face; returns the (possibly new, non-indexed) geometry. `bookGeometry(w, h, d, spineRadius = min(0.004, w/3))`: book-space prism (x thickness centred, y from 0, z depth centred, spine at +z), 8-vertex section with two 2-step rounded spine corners and square page corners, 28 tris, non-indexed. `DECOR = { vase, bowl, orb, cup }`: unit `[[r, y], …]` lathe profiles for `latheSolid` (6–8 sides). | shelf, desk (books, cup), later cabinet tops, table centrepieces, wave-3 pots | shelf K2, K4, K7; desk "book helper from the filler", desk pen cup | W2 | None (new module). |
| A5 | `pillow` | new `soft.js` | `pillow(w, h, t, mat, { pinch = 0.5, waist = 0.03, grid = 6, flatBottom = false }) → Mesh`, exactly as `specs/bed.md` S2: bbox exactly `w × h × t`, closed, `4·grid² + 8·grid` tris, clamps `pinch ∈ [0, 0.8]`, `waist ∈ [0, 0.06]`, `grid ∈ [4, 8]`. | bed; sofa later (W7) | bed S2 | W2 | None. |
| A6 | `drapeSheet` | `soft.js` | `drapeSheet(opts) → { main, fold }` exactly as `specs/bed.md` S3 (options table, construction, guarantees). Asserts ≤ 900 tris per call. `wrinkle` jitter is a pure hash of (`seed`, vertex index). | bed (duvet, runner, bunk tuck); later tablecloths, bench throws | bed S3 | W2 (critical path for the bed; fallback for a late slip: tuck-only `puffy` duvet slab, which the bed spec must not ship with) | None. |
| A7 | `buildTrestle({ …, backRail = false })` | `supports.js` | Additive. `backRail: true` adds one `beam` along x between the two frames, directly under the cleats' rear ends: top face at `top − cleatHeight` (touching the cleat bottoms), z = `−(cleatLength/2 − beamWidth/2)`, section `beamWidth × beamWidth`. The existing low stretcher (`stretcher`) is independent. Replaces the desk's `stretcherZ` request: a stretcher moved off z = 0 would float beside an `I` post, while the cleat always reaches the back. | desk (trestle) | desk `stretcherZ` | Defer (fallback: low footrest stretcher only, box chance 0.5) | Table/bench trestles: default `false` builds nothing new. W6 hash. |

### Phase B: promotions (wave-1 callers switch; W6 hash check gates each one)

| # | Helper | Module | Signature and behaviour | Users | Merges | Priority | Regression risk |
|---|---|---|---|---|---|---|---|
| B1 | `turnedPost` | `supports.js` | `turnedPost({ height, thickness, blocks = [], finial = 0, sides = 8, profiles = [] }, mat) → Group`, built at x = z = 0 (caller positions the group). `blocks`: `[[y0, y1], …]` square `beam` blocks (`thickness` square, radius `min(0.006, 0.2·thickness)`). The turned segments fill the gaps between 0, the blocks and `height`; each segment is one `latheSolid` with the table's 9-point profile scaled to its length (R = 0.95·thickness/2), or the 5-point `'simple'` profile when `profiles[i] === 'simple'` (2·sides·6 tris). `finial > 0` adds a small lathe knob on top. `grainAlong(group, 'y')`. Table call: `turnedPost({ height: legHeight, thickness, blocks: [[legHeight − block, legHeight]] })` reproduces `turnedLeg` exactly. | table (legs), desk (writing turned legs), bed (four-poster posts) | table `turnedLeg`; desk "promote turnedLeg"; bed `turnedPost` | Defer (fallbacks: desk turned → tapered; bed turned → square) | **Medium**: table output must be identical (group transform vs mesh position, same profile maths). W6 hash on table seeds with `legStyle` turned. |
| B2 | `buildFeet` | `supports.js` | `buildFeet(anchors, { kind = 'bun', height, radius, edge = 0.6·radius, sides = 8 }, mat) → Mesh[]`. `bun`: `roundedDiscGeometry(radius, height, edge, sides)` centred at (x, height/2, z); `block`: vertical `beam` (`2·radius` square, 44 tris) from 0 to `height`. Each part `grainAlong(…, 'y')`. Sofa call: `buildFeet(anchors, { height: p.legHeight + OVERLAP, radius: p.legThickness / 2, edge: p.legThickness * 0.3 }, mats.frame)`. | sofa (bun), cabinet (bun), desk (pedestal feet) | sofa `buildFeet`; cabinet and desk promotion requests | W2 (trivial; fallback feet → plinth) | **Low**: pass `edge` explicitly so the float maths match. W6 hash on sofa `bun` seeds. |
| B3 | `buildFramedPanel` | `supports.js` | `buildFramedPanel({ width, postWidth, postDepth, postBottom = 0, postTop, rails: [{ y, height, thickness }], fill: { kind: 'slats' \| 'bars' \| 'none', count, from, to, thickness, width = null }, puff }, { frame, fill }) → Group`. Two `beam` posts at x = ±(width/2 − postWidth/2) from `postBottom` to `postTop`; one `beam` rail per entry between the post centres; fill between `from` and `to`: slats (vertical, pitch `innerW / count`, width `width ?? min(0.5·pitch, 0.05)`) or bars (horizontal via `splitSpan` with gap `0.14·(to − from)`, bar height `min(size, 0.05)`). Bench's `buildFramedBack` becomes a 6-line wrapper computing `railH` and the two rails, then is deleted. | bench (back), bed (slatted head/foot boards, bunk end fills, four-poster slats) | bench `buildFramedBack`; bed `buildFramedPanel` | W2 (fallback: bed builds its fills locally from `beam`s) | **Medium**: bench output must be identical. W6 hash on bench seeds with a framed back. |

### Phase C: assemblies

Fronts: one API in `src/core/fronts.js` (+ `src/core/handles.js` for the handle geometry), serving the cabinet's face
grids and the desk's pedestals, apron rows, hung boxes and centre drawers. The cabinet's solver is the core; the
desk's `layoutFronts(rect, rows)` is a special case of a plan (see "Desk plan shapes" below).

| # | Helper | Module | Signature and behaviour | Users | Merges | Priority | Regression risk |
|---|---|---|---|---|---|---|---|
| C1 | `solveFronts` | new `fronts.js` | `solveFronts(plan, field, opts) → { fronts, open, members, closed, stats }`, exactly the cabinet spec's plan tree, field, options, algorithm (separators, water-fill sizes, leaves, symmetry, rectangles, degrade) and output. Additions: drawers leaves accept `grade` (ratio top → bottom); every option is overridable per call (the desk passes its own drawer limits); new option `maxDoorH` (default `Infinity`; doors taller split into a stacked pair, for the wardrobe); `stats.handleSlots` is not part of the solver. Pure, no THREE. | cabinet, desk; later wardrobe, bed drawers, shelf cube fronts | cabinet `solveFronts`; desk `layoutFronts` | W2 | None. |
| C2 | `handleSlots`, `planHandles` | `fronts.js` | `handleSlots(front, hw) → [{ x, y, z, axis, length }]`: the cabinet's placement table and fit rules, plus one rule from the desk: a drawer taller than 0.24 m with `vPos = 'centre'` puts its handle at `y1 − h/3` (file drawers). `planHandles(layout, hw) → slots[]` applies it to every front and the 2.2k-tri budget fallback. `hw` = `normalizeHandle(hw)`: `{ kind, knobDiameter, barLength \| barScale, barProfile, projection, cupWidth, ringDiameter, cutoutWidth, cutoutHeight, lipFraction, tabLength, vPos, doorInset, doorDrop }`, missing fields from `HANDLE_DEFAULTS`; `size` is accepted as the kind's main dimension (knob/ring diameter, bar length, cup width, tab length). | cabinet, desk | cabinet `handleSlots`; desk handle anchors, `handlePairs`, `pairsAbove` | W2 | None. |
| C3 | `HANDLE_KINDS`, `buildHandle` | new `handles.js` | `buildHandle(slot, hw, mat) → Group` facing +z, back face on `slot.z`. Kinds and costs as the cabinet table (knob ≈ 96, bar 72/132, cup ≈ 90, lip 44, tab 88, cutout/groove/none 0) plus **`ring`** (desk): 6-sided lathe rosette + closed `tube` ring (10 segments × 4 sides), ≈ 140 tris, hanging in the front plane. `HANDLE_KINDS[kind] = { tris, part }`. | cabinet, desk; later lamps (knobs) | cabinet `buildHandle`; desk `buildHandles` | W2 (`ring`: Defer, fallback knob) | None. |
| C4 | `frontPanel` | `fronts.js` | `frontPanel(front, { thickness, bevel, style: 'slab' \| 'framed' \| 'insert', frameWidth, cut = null, groove = 0 }, { front, insert }) → Group`. Slab: `extrudeProfile` rect (44 tris); `cut`: stadium slot or top half-moon notch as a hole (≈ 150 tris); `groove`: the front is shortened by `groove` at the top. Framed/insert: 4 `beam`s + recessed centre panel set back 0.006 (≈ 220 tris); the insert panel takes `mats.insert`. Grain from `front.grain` (`grainAlong`). | cabinet, desk; later wardrobe, bed | cabinet `frontPanel`; desk `buildFronts` style variants | W2 (`cut`: Defer, fallback groove) | None. |
| C5 | `buildCarcass` | `fronts.js` | `buildCarcass({ width, depth, y0, y1, panel, back = 0.01, sides = true, bottom = true, construction = 'overlay', frontThickness, edge = 0.002, x = 0 }, mat) → { parts, field }`. Item frame: front of the fronts at z = depth/2, back at −depth/2. Two side `beam`s, an optional bottom `beam`, an optional back `beam` (`back = 0` → none); **no top** (every user caps it with its own top: the cabinet's `puffy` top, the desk top). Overlay: carcass front edges at `depth/2 − frontThickness`, `field` = outline shrunk by `edge`, `z` = that plane. Inset: front edges at `depth/2`, `field` = the opening inside sides and bottom, up to `y1`. Bases are separate (plinth, `buildFeet`, `buildLegs`). | cabinet (carcass), desk (floor pedestals, hung box, trestle/panel box) | desk `buildCarcass({ top: false })`; cabinet's inline carcass beams | W2 | None. |
| C6 | `buildFronts` | `fronts.js` | `buildFronts(layout, { thickness, bevel, drawerStyle, doorStyle, frameWidth, doorFrameWidth, members = true, backers = true, memberDepth }, hw, mats: { front, insert, hardware, carcass }) → Object3D[]`: one `frontPanel` per front (cut-outs and grooves from `hw.kind`), one `buildHandle` per `planHandles` slot, inset/divider `members` and `closed` backers as `beam`s. `backers: false` when something else already sits behind the fronts (the desk's apron rail). | cabinet, desk | desk `buildFronts` + `buildHandles` | W2 | None. |
| C7 | `layoutShelfContents`, `buildDecor` | `fill.js` | `layoutShelfContents(r, surfaces, { mood, coverCount, objectKinds, allowBins, allowFrames, budget, inset }) → records[][]` (one array per surface): the shelf spec's layout rules 1–7, all draws from `r` (the caller passes `createRng(String(p.fillSeed))`), every number mm-rounded so results are stable across platforms. `buildDecor(records, surface, colours, mat) → Mesh`: writes every record of a surface into one non-indexed geometry (`position`, `normal`, `color`) via typed arrays (no per-item `Mesh`), using `bookGeometry`, `DECOR` + `latheSolid`, `beam`-shaped boxes, slabs, frames and bins; `colours = { covers: [hex], pages: hex, objects: [hex] }`. `CONTENT_TRIS` exported for budgets. | shelf (layout + build), desk (build only, own zone layout) | shelf K5, K6; desk `buildDeskProps` geometry | W2 | None. |

#### Desk plan shapes (C1 input)

The desk derives its plans in `build` from params (a desk-local `deskPlans(p)`; plans are not stored, because they hold
no drawn slot values). Fields: `field` from `buildCarcass` (pedestals, boxes) or the rectangle given.

| Desk region | `plan` | Per-call `opts` |
|---|---|---|
| Apron drawer row (writing) | `{ leaf: 'drawers', count: 1, across: apronDrawers }` | `minDrawerH: 0.05, maxDrawerH: 0.12, minDrawerW: 0.22`, field = between the front legs' inner faces, y from apron bottom to `legHeight`, z = leg front face; `buildFronts(…, { backers: false, members: false })` (the front rail is the backer) |
| Floor pedestal `three` | `{ leaf: 'drawers', count: 3, grade: 1 }` | `maxDrawerH: 0.46, maxFronts: 6` |
| `graduated4` | `{ leaf: 'drawers', count: 4, grade: 1.15 }` | same |
| `boxFile` | `{ split: 'y', weights: [1, 2.1], children: [{ leaf: 'drawers', count: 1 }, { leaf: 'drawers', count: 1 }] }` | same |
| `twoBoxFile` | `{ split: 'y', weights: [2, 2.3], children: [{ leaf: 'drawers', count: 2 }, { leaf: 'drawers', count: 1 }] }` | same |
| `drawerDoor` | `{ split: 'y', weights: [1, 3.2], children: [{ leaf: 'drawers', count: 1 }, { leaf: 'doors', hinge: <pedestal side> }] }` | same; a left pedestal hinges `'left'` so the handle sits on the knee-hole side |
| Hung pedestal (2–3) / trestle or panel box (1) | `{ leaf: 'drawers', count: hungDrawers }` | `minDrawerH: 0.08, maxDrawerH: 0.20` |
| Centre drawer | `{ leaf: 'drawers', count: 1 }` | `minDrawerH: 0.05, maxDrawerH: 0.10, maxDrawerW: 1.0`, field between the pedestals' inner faces under the top |

### Generator-local (stay local in wave 2, per R7)

| Helper | Lives in | Promote when |
|---|---|---|
| `bays(p)`, `railOutline(p, side)`, `frameTris(p)` | shelf | `railOutline`: an easel or A-frame desk |
| `buildStandingFrame` | desk | a sit-stand table |
| `propZones(p)` + desk prop layout | desk | a second "still life on a top" user (cabinet tops, wave 3) |
| `surfaces(p)` | cabinet | wave 3 decor on cabinets |
| `archTopShape`, `scallopShape`, `buildLadder` | bed | wardrobe crowns (`archTopShape`), sofa channel backs (`scallopShape`), shelf library ladder (`buildLadder`) |
| `roundedPolygonShape`, `strokeShape`, stool diner ring | wave-1 owners | unchanged from wave 1 |

### Rejected, deferred or already covered

| Request | Decision |
|---|---|
| `cane` pattern kind (cabinet) | **Deferred.** The shader budget is 8 programs and all 8 are used (`wood`, `dots`, `floral`, `gingham`, `ticking`, `herringbone`, `terrazzo`, `linen`). Cane uses `dots` with `layout: 'grid'` (spacing 0.010–0.014, size 0.28, dark holes via `harmoniousSecondary(cane, 'dark')`). Revisit with a pattern-budget review in wave 3. |
| `buildTrestle({ stretcherZ })` (desk) | Replaced by A7 `backRail`. |
| Desk `layoutFronts`, `buildHandles`, `buildCarcass({ top })` | Merged into C1–C6. |
| Desk `buildDeskProps` in core | Geometry via C7 `buildDecor`; the zone layout stays desk-local. |
| `rollCycle` for desk/bed/shelf | Not needed (W1). |
| Sofa adopts `pillow` | Not in wave 2 (W7). |
| Mattress piping (bed) | Rejected, as the bed spec proposes. |
| Instancing books (shelf) | Rejected, merged (as the shelf spec argues). |
| Filler `fill` stored in params | Replaced by a regenerated layout (W5). |

---

## Part 3: Implementation checklist (M4 kit PR, architect)

1. Phase A in any order (A6 `drapeSheet` is the long pole: start it first), then B1–B3, each behind the W6 hash check,
   then C1 → C2/C3 → C4 → C5 → C6, and C7 after A3/A4.
2. Before B1: commit `scripts/geometry-hash.mjs` output from `main` as the baseline (`tests/golden/wave1-geometry-hashes.json`,
   test-engineer). After every promotion: chair golden byte-identical, wave-1 hashes identical.
3. Unit tests per helper: extents, grounded where relevant, triangle counts, determinism, closedness (`pillow`,
   `drapeSheet`), solver invariants over every cabinet template × 4 styles × 200 random fields and every desk plan
   shape (`tests/unit/fronts.test.js`), `rollStyle` ≡ `rollCycle(…, 'style', …)` for 2,000 seeds × counts 0–6,
   `pickWood` without weights ≡ the old code, every `LEATHERS` tone calm, merge colour rule (missing `color` → white;
   `color` dropped on non-vertex materials), `layoutShelfContents` same seed → same records.
4. Update the furniture-kit skill (module table, catalogue rows for every helper above, `kinds`, `mixWeight`,
   `cell.spacingZ`, the W4 role rule, the W5 decor rule and the "build may derive detail from a param seed" sentence)
   and `plan/02-architecture.md` (contract, budgets unchanged).
5. Hand off: `cell.spacingZ` and `mixWeight` (ui-engineer), fits-cell z check, `kinds` distribution test, K8 vertex
   colour calm test, `decorSupported` / `decorInside` invariants, the hash script (test-engineer).

---

## Decisions for the human gate (M4 ★)

Everything else above is an architect ruling. These need the product owner:

1. **Cabinet: `kind` as a second cycled group (W1)** — two cycling ⟳ buttons (Style, Kind) on one type, versus kinds
   as the styles. Recommended: the group.
2. **Decor layouts regenerated in build from a param seed (W5)** — a clarification of the "build has no randomness"
   contract (params ≈ 2 kB instead of ≈ 12 kB per shelf). Recommended: yes.
3. **Non-square cells (W2)** — cabinet 2.3 × 1.5 and desk 2.1 × 1.6; shelf and bed stay square. Recommended: yes;
   fallback is square cells.
4. **Style sets beyond the plan** — cabinet `modern` (4th style) and desk `panel` (5th style); bed metal bed and loft
   bunk deferred. Recommended: keep both additions.
5. **All view mix weights (W8)** — bed 0.5, sofa 0.75; `type=all` links reshuffle anyway when four types are added.
6. **Sofa keeps its old pillows in wave 2 (W7)** — the new lens `pillow` comes to the sofa in a separate PR with a
   before/after sheet.
