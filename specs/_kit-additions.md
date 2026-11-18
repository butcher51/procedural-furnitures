# Kit additions for wave 1

Backlog 2.6 (architect). Inputs: `specs/stool.md`, `specs/table.md`, `specs/bench.md`, `specs/sofa.md`, the current
`src/core/`, and PR #4 (`chair-floor-and-budget`), which adds `puffy(…, segments = 3)` and `bentwoodFoot`. This file is
the input to backlog 2.8. It has two parts:

1. **Cross-spec rulings.** Decisions that apply to every type. They are already applied to the four specs (see each
   spec's "Architect review" section).
2. **Helper list.** The deduplicated new shared helpers, in implementation order.

2.8 starts after PR #4 is merged. Every helper below gets a unit test in `tests/unit/core-helpers.test.js` and a row in
the furniture-kit skill's helper catalogue.

---

## Part 1: Cross-spec rulings

### R1. Style is rerollable for modern types, and ⟳ steps through the other styles

The specs disagreed: the stool wanted a rerollable style that avoids the current one, while the table, bench and sofa
made style `rerollable: false`. **Ruling: every modern type makes `style` rerollable, through one kit helper.** The chair
stays `rerollable: false` (legacy stream, golden test).

Why: with independent group streams, a style re-roll is a real feature. Palette and pattern streams do not read style,
so the user gets the same colourway as a different style. The only obstacle was the change-rate test: a plain re-pick
returns the same style 18–22 % of the time. The helper removes that obstacle.

`rollStyle(g, styles)` in `src/core/rng.js`, defined in `createGroupedRng` terms (it only uses `g.seed` and `g.count`,
which `createGroupedRng` already exposes, so `createGroupedRng` itself does not change):

```
base  = weightedPick(createRng(`${g.seed}/style/0`), styles)      // identical to g.roll('style', r => weightedPick(r, styles))
n     = g.count('style')
if n == 0 → base
order = weightedShuffle(createRng(`${g.seed}/style/order`), styles without base)
cycle = [...order, base]
→ cycle[(n − 1) mod cycle.length]
```

- Re-roll 1 is never the base style (100 % change rate). Each ⟳ press shows a style not seen yet. After all the others,
  the next press returns to the base style.
- The first re-roll follows the weights (weighted shuffle), so rare styles stay rare.
- `${g.seed}/style/order` cannot collide with a count stream (counts are integers).
- Distribution tests run on n = 0, which is a plain weighted pick.
- Group definition: `{ id: 'style', label: 'Style', fields: ['style'] }` (no `rerollable: false`). In
  `generateParams`: `const style = rollStyle(g, definition.styles)`.

The isolation test already allows every group that (transitively) reads `style` to change.

### R2. Groups that do nothing for some styles: `appliesTo`

Two specs hit the same wall. The stool's footrest group is inert for milking and drum stools (30 % of seeds), so its
change rate would be about 70 %. The bench avoided a back group for the same reason. **Ruling: the group contract gains
an optional `appliesTo(params) → boolean`.**

- It is pure, reads only the item's params, and never affects generation.
- The panel hides the ⟳ button (and shows the section's rows as usual) when it returns false.
- The re-roll test measures the change rate only over seeds where it returns true. Isolation (no field outside the
  group and its readers changes) is still checked on every seed.
- A group with `appliesTo` must still give neutral values (`0`, `false`, `null`, `'none'`) for its fields when it does not
  apply, so the field set stays fixed and an inert re-roll changes nothing.

Users in wave 1: stool `footrest` (not milking, not drum), table `palette` (only when something is painted). Bench and
sofa do not need it.

### R3. Bevel segments: never fewer than 2 on a rounded edge

The low-poly-but-soft identity comes from rounded edges made of at least two facets. One segment is a chamfer and reads
as a hard box under flat shading.

| Part kind | Primitive | Segments |
|---|---|---|
| Hero soft parts: seats, tops, cushions, upholstered bodies, panels | `puffy` | 3 |
| Same, as an item-wide budget fallback (e.g. sofa `cushionSegments`) | `puffy` | 2, applied to every part of that role in the item, never mixed |
| Structural boxes that are not repeated bars (arm posts, back frames, plinths, runners) | `puffy` | 2 |
| Thin repeated bars: slats, back boards, rails, aprons, cleats, square stretchers, trestle members, arm boards | `beam` (new, H3) | 2 steps: rounded long edges, flat ends, about 44 tris |
| Plan and side extrusions | `extrudeUp`, `extrudeProfile` | 2 (as today) |
| `puffy` with 1 segment | — | not allowed |

This keeps the bench's 30-slat platform at about 1.3k triangles (30 × 44) instead of 3.2k at 1 segment or 9k at 2. The
chair keeps `puffy` with 2 segments on its slats (PR #4) because of the golden test.

Cylinders keep 4–12 sides. **Exception:** flat round tops and discs larger than ⌀ 0.8 m may use 16 sides (table
question 5). It costs about 50 triangles more.

### R4. Grid cells stay square; each type keeps its own spacing

`cell` does **not** gain separate x/z spacing in wave 1. Only the bench would gain (more items per row). Non-square cells
would touch the grid layout, floor helper, camera framing (`spacing / 1.7`), selection ring and the fits-cell invariant
for one type. Reconsider in wave 2, when beds and sideboards arrive (field name to reserve: `cell.spacingZ`, defaulting
to `spacing`).

Types do not share a spacing. The camera framing already scales with `spacing`, and the switcher regenerates the grid.
Wave 4 ensembles get their own cell.

| Type | spacing / gridSize | Fits-cell limit (spacing − 0.1) | Max x/z footprint | Headroom | Floor |
|---|---|---|---|---|---|
| stool | 1.2 / 25 | 1.10 | 0.62 (bar stool, 0.44 seat + 2 × 0.09 splay) | 0.48 | 30 m |
| table | 2.3 / 17 | 2.20 | 2.00 (trestle top) | 0.20 | 39 m |
| bench | 2.2 / 17 | 2.10 | 1.95 (clamped `overallX`) | 0.15 | 37 m |
| sofa | 2.8 / 15 | 2.70 | 2.55 × 1.90 (sectional) | 0.15 | 42 m |

All four pass. The table and the bench depend on their clamps (table: `topLength ≤ 2.0`, base inside the top; bench:
`overallX ≤ 1.95`). Both specs name those clamps as fits-cell guards.

### R5. Draw calls: at most 4 material roles; the sofa's accent pillows are allowed

The budget is ≤ 4 draw calls after merge (≤ 6 only with the future `glass`/`emissive` roles). **Ruling:** a spec may use
up to 4 material roles, as long as it lists them and the item-wide maximum. Parts that share a colour share one material
instance (`mergeByMaterial` groups by identity). The sofa's 4th role (`solid(accentColor)` for throw pillows) is
approved. It is optional per item (no pillows means 3 draws), and the accent is a large part of the sofa's charm.

| Type | Roles | Max draws |
|---|---|---|
| stool | pan surface, cushion surface, frame (drum: cushion, body, frame) | 3 |
| table | top surface (shelf reuses it), frame | 2 |
| bench | seat surface, frame, body (upholstered only) | 3 |
| sofa | cushion surface, body, frame, accent (pillows only) | 4 |

### R6. Leg parameter names and how they feed `buildLegs` / `legLines`

Any params that reach `buildLegs`, `legAnchors`, `legLines` or `buildStretchers` use these names and meanings:

| Field | Meaning |
|---|---|
| `legCount` | Number of struts that `buildLegs`/`legLines` make. **0 for supports built another way** (pedestal, trestle, panels, frames, plinth). Never 1 (that is the chair's pedestal branch). 2 only to ask for the sled branch on purpose. |
| `legThickness` | Top diameter (m). |
| `legSides` | Strut sides (4–8; 4 with the 45° phase reads square). |
| `legTaper` | Bottom radius ÷ top radius (≤ 1). |
| `legSplay` | Horizontal outward offset of the foot (m). Clamp so θ = atan(legSplay / legHeight) ≤ 19° (`legSplay ≤ 0.35 × legHeight`). The floor sink is `rBottom × sin θ`. |
| `legHeight` | Always equal to the `fp.top` that is passed in. Derived, except for short-feet styles where it is rolled and the body height derives from it. |
| `legInset` | Seat/top end to the leg axis at the top (m), used with `rowAnchors`. (The table's `overhang` is a different thing, a footprint shrink, and keeps its name.) |

- Build branches on the support kind (`baseKind`, `support`, `legStyle`, style) **before** calling `buildLegs`.
  `describe()` takes its words from the support kind, not from `legCount`.
- If the type's params lack a field that a branch reads (the sled branch reads `p.puff`), build passes an explicit leg
  object, e.g. `{ legCount, legThickness, legSides, legTaper, legSplay, puff: 0.006 }`. Never spread unrelated params
  into it.
- Stretcher and footrest kinds share one vocabulary: `'none' | 'ring' | 'perimeter' | 'h' | 'ends' | 'cross'`
  (lowercase). The stool's `box` becomes `perimeter` and the table's `H` becomes `h`.
- Tubes reaching the floor: since PR #4 they are allowed when closed with `bentwoodFoot`. No wave 1 spec needs one, and
  the specs' "no tube to the floor" guard stays.

### R7. Core or generator-local

A helper goes into `src/core` when at least two wave 1 types use it, or when it fixes a cross-type convention (RNG, UVs,
colours). Otherwise the generator keeps it in its own folder until a second user is scheduled, and the architect
promotes it then. This keeps 2.8 small and the chair golden untouched.

---

## Part 2: Helper list, in implementation order (backlog 2.8)

Priority: **W1** = wave 1 needs it. **Defer** = the spec has a working fallback; the helper can come later without
blocking a generator. "Chair risk" is about the chair golden tests (params and geometry, byte-identical, plus per-seed
triangle counts).

### Phase A: foundations (no chair code path touched)

| # | Helper | Module | Signature and behaviour | Used by | Merges | Priority | Chair risk |
|---|---|---|---|---|---|---|---|
| A1 | `weightedPick`, `weightedShuffle`, `rollStyle` | `rng.js` | `weightedPick(r, weights)`: `weights` is `{ id: w }` or `[[value, w], …]`. One `r.next()` draw, cumulative in insertion order. `weightedShuffle(r, weights)`: Efraimidis–Spirakis (`u^(1/w)` keys, one draw per entry, sorted descending). `rollStyle(g, styles)`: see R1. | all four | every spec's ad-hoc weighted picks; stool's "exclude current style" | W1 | none (the chair keeps its inline picks) |
| A2 | Group `appliesTo(params)` | contract (plan/02, skill), consumed by `src/app/panel.js` and `tests/unit/reroll.test.js` | See R2. `item.js` exports `groupApplies(definition, groupId, params)` (defaults to true). | stool, table | bench open question 3 alternative | W1 | none |
| A3 | `beam` | `geometry.js` | `beam(a, b, width, thickness, radius, mat, steps = 2) → Mesh`. A bar from `a` to `b` with a rounded-rectangle cross-section (corner radius via `edgeRadius`, `steps` facets per corner) and flat ends. Width runs along `normalize(dir × Y)` (along x when the bar is vertical); thickness runs along `width × dir`. So a horizontal bar along x has its width in z and its thickness in y. UVs in meters: u along the bar, v around it. About 44 tris at 2 steps. Non-indexed. | table, bench, stool (via A11/A12), all assemblies | table `beam`; bench "puffy segments 1" slats and bars | W1 | none |
| A4 | `splitSpan` | new `layout.js` | `splitSpan(start, end, count, gap) → [{ center, size }]`. Equal parts with `gap` between them; `size = (end − start − (count − 1)·gap) / count`, floored at 0.001. | sofa (cushions), bench (slats, back boards, garden back slats) | sofa `splitSpan`; bench inline slat maths | W1 | none |
| A5 | `extrudeProfile` | `geometry.js` | `extrudeProfile(outline, thickness, bevel, plane = 'side') → BufferGeometry`. `outline` is a `THREE.Shape` (holes allowed) or `Vector2[]`. `'side'`: outline in (z, y), extruded along x, centred on x = 0. `'front'`: outline in (x, y), extruded along z, centred on z = 0. `bevelSize = bevelThickness = bevel`, `bevelOffset = −bevel`, `bevelSegments = 2`, depth `thickness − 2·bevel`, so the outline extents are exact and the min y equals the outline's min y. Placed with a rotation (never a mirror, which would flip the normals). UVs in meters, like `extrudeUp`. | stool (slab panels), bench (slab ends, sled O-frames, park frames), sofa (slope arm, chaise head) | stool `panelFromShape`, bench `extrudeSide`, sofa `extrudeProfile` | W1 | none |
| A6 | `endPanelShape` | `geometry.js` | `endPanelShape(width, height, { cut = 'none', cutWidth = 0, cutHeight = 0, steps = 6 }) → Shape`. Outline in (u, y), u in ±width/2, y from 0 to height. Cut at the bottom centre: `'arch'` (half-ellipse), `'v'` (triangle), `'notch'` (rectangle). Clamps `cutWidth ≤ 0.6·width` and `cutHeight ≤ 0.9·height`, so each foot is ≥ 0.2·width. Feed it to `extrudeProfile`. | stool (slab), bench (slab ends) | missed by both designers: stool arch/notch panels, bench v/arch notched ends | W1 (fallback: plain panel, `cut: 'none'`) | none |
| A7 | `latheSolid` | `geometry.js` | `latheSolid(profile, sides) → BufferGeometry`. `profile` is `[[r, y], …]` from bottom to top. Axis points are added at both ends when r ≠ 0, so the solid is closed. y as given (start at 0 to stand on the floor). UVs normalised (u around, v along the profile). Tris ≈ 2·sides·(points + 1). | stool (spool/barrel drum), table (`turnedLeg`, local) | stool `latheSolid`; the lathe part of table `turnedLeg` | Defer (stool fallback: `drumProfile` straight only; table fallback: turned → tapered) | none |
| A8 | `boxProjectUVs` | `geometry.js` | `boxProjectUVs(geometry, unit = 1) → geometry`. Per triangle, project onto the plane of the face normal's dominant axis, in `unit` meters, so patterns tile per meter on any size. Works on non-indexed geometry (converts if indexed). Rule: every part that shares a material uses the same UV convention. | sofa (all cushions, body when patterned); available to bench upholstered | sofa `boxProjectUVs` | W1 for sofa (fallback in the sofa spec: force checker → horizontal stripes on cushions > 1.2 m) | none |
| A9 | Palette constants | `color.js` | `STONE_TONES`: white marble `{h .10, s .08, l .86}`, black marble `{h .60, s .05, l .18}`, travertine `{h .09, s .30, l .72}`, grey terrazzo `{h .08, s .04, l .62}`. `FRAME_COLORS = { black: '#2a2a2c', white: '#efefea', metal: '#a7abb0' }`. `secondaryColor(mode, hue)`: the chair's light/dark/complement/white formulas. `pickWood(r)` → `{ name, h, s, l }` with h ± 0.01 and l ± 0.05 jitter, in 3 draws (pick, h, l). | table (stone); all four (frame hexes, secondary modes, wood jitter) | table `STONE_TONES`; repeated hexes and formulas in all four specs (missed reuse) | W1 (trivial) | none (the chair keeps its inline copy) |

### Phase B: the leg system (the only phase that touches chair code paths)

| # | Helper | Module | Signature and behaviour | Used by | Merges | Priority | Chair risk |
|---|---|---|---|---|---|---|---|
| B1 | `rowAnchors` + `fp.anchors` | `supports.js` | `rowAnchors(length, depth, perRow, insetX, insetZ) → [[x, z], …]`. Two rows at z = ±(depth/2 − insetZ) with `perRow` (2–3) legs evenly spaced over ±(length/2 − insetX). **Perimeter order**: front row left → right, then back row right → left. `legAnchors(p, fp)` returns `fp.anchors` unchanged when it is present. | bench (4/6 legs), sofa (6 legs, sectional L corners) | bench `rowAnchors` + `fp.anchors`; sofa `fp.anchors` | W1 | **low**: one early return when the key is present. Golden must stay byte-identical. |
| B2 | `legLines` + `pointOnLeg` + `fp.splayAxes` | `supports.js` | `legLines(p, fp) → [{ top, bottom, rTop, rBottom }]` for `legCount ≥ 3` (empty array otherwise): the exact axes `buildLegs` builds. Splay direction: default radial, `Vector2(x, z).normalize() × legSplay` (today's maths, same operation order). With `fp.splayAxes = [sx, sz]`: `normalize(sign(x)·sx, sign(z)·sz) × legSplay`, so a leg at x = 0 splays in z only. `pointOnLeg(line, y) → Vector3`, linear along the axis. `buildLegs`' 3+ branch is refactored to build one `strut` per line. The 1- and 2-leg branches are untouched. | stool, table, bench (staked, platform), sofa (tapered) | stool `legLines`; table `legSegments` + `pointOnLeg`; bench `fp.splayAxes` | W1 | **HIGH**: refactors the code every legged chair runs. It must keep the same float operations in the same order. Gate: chair params and geometry golden byte-identical, plus per-seed triangle counts, before merge. |

### Phase C: assemblies built on A and B

| # | Helper | Module | Signature and behaviour | Used by | Merges | Priority | Chair risk |
|---|---|---|---|---|---|---|---|
| C1 | `buildStretchers` | `supports.js` | `buildStretchers(lines, kind, y, { radius, sides = 6, profile = 'round', stagger = 0 }, mat) → Group`. Lines in perimeter order (B1/`legAnchors` order). Endpoints are `pointOnLeg(line, y)`, so rail ends sit inside the legs. `'ring'`: closed `tube` through the points (6 sides, 32 segments, like the chair ring). `'perimeter'`: consecutive legs; rails running mostly along z are raised by `stagger`. `'h'`: the two end rails (outermost front/back pair at each x end) plus one centre rail along x between their midpoints. `'ends'`: the two end rails only. `'cross'`: each leg to (0, y, 0) plus a hub disc of radius 2.5·radius. `profile: 'round'` → `strut`; `'square'` → `beam` (2·radius square). `'h'`/`'ends'` need two rows (4 or 6 legs); params resolve the 3-leg fallback, and the helper asserts. | stool (footrest), table (stretchers), bench (staked end rails, garden H) | stool `legStretchers`; table `buildStretchers`; bench stretcher bars | W1 | none (additive) |
| C2 | `buildApron` | `supports.js` | `buildApron(lines, { top, height, thickness, setback = 0, edges = 'all' }, mat) → Group`. One `beam(a, b, thickness, height, …)` per consecutive pair of legs at y = top − height/2. Endpoints come from `pointOnLeg`, shifted inward by `setback`. `edges`: `'all'`, `'long'` (rails parallel to x) or `'short'`. | table (dining 85 %, coffee, side), bench (garden aprons and side rails) | table `buildApron`; bench garden aprons (missed reuse) | W1 | none |
| C3 | `buildPedestal` | `supports.js` | `buildPedestal({ top, base = 'disc', baseRadius, baseHeight, baseTaper = 0.5, columnRadius, columnSides = 10, sleeve = null, cap = null }, mat) → Group`. Bottom at y = 0; the cap top (or the column top) at `top`. Base kinds: `'disc'` (`roundedDiscGeometry`, rim 0.008), `'cone'` (`strut`, top radius `baseTaper × baseRadius`), `'cross'` (4 `beam` arms at 45°), `'tripod'` (3 `beam` arms: one towards −z, two at ±60° from +z, symmetric in x). Arms lie flat on y = 0. `sleeve: { radius, height }` is a wider lower column. `cap: { radius, height }` is a plate under the top (the café cap or the diner swivel hub). `buildLegs`' 1-leg branch does **not** delegate to it. | stool (diner), table (café) | stool `pedestalColumn`; table `buildPedestal` | W1 | none (the chair's n = 1 branch is left alone) |
| C4 | `buildTrestle` | `supports.js` | `buildTrestle({ length, depth, top, kind: 'I' \| 'A' \| 'X', inset, footLength, footHeight, beamWidth, postDepth, cleatHeight, cleatLength = 0.8·depth, stretcherHeight, stretcher = true }, mat) → Group`. Two frames at x = ±(length/2 − inset), built from `beam`s only: a foot on y = 0, posts (I: one post `beamWidth × postDepth`; A: two posts from the foot ends at z = ±0.38·footLength to ±0.2·cleatLength, plus a crossbar at `stretcherHeight`; X: two crossed beams from the foot ends to the cleat ends) and a cleat under `top`. One long stretcher along x at `stretcherHeight` (for X: at the crossing height). About 0.5k tris. | table (trestle), bench (plank `trestle` support) | table `buildTrestle`; bench trestle (which planned `buildLegs` n = 2: missed reuse) | W1 | none |

### Generator-local (not core in wave 1, per R7)

| Helper | Lives in | Notes | Promote when |
|---|---|---|---|
| `turnedLeg({ height, radius, blockHeight, sides = 8 }, mat) → Group` | `src/furniture/table/` | `beam` block plus `latheSolid` turning, bottom at y = 0, about 200 tris. Fallback without A7: turned → tapered. | stool, bed or chair turned legs |
| `strokeShape(points, width, { floor, miterLimit })` | `src/furniture/bench/` | Polyline to ribbon outline for park frames, fed to `extrudeProfile('side')`. Guard: curl radius ≥ stroke width (no self-intersection). Fallback: `angular` frames from `beam`s. | table or desk bent-steel bases, lamp arms |
| `buildFramedBack` | `src/furniture/bench/` | Lifted from the chair's `buildBackrest` with a bottom rail; bars via `beam`. The chair does **not** switch in wave 1. | bed headboards, or a chair rebuild with a planned golden update |
| `roundedPolygonShape(points, radius, steps = 3)` | `src/furniture/sofa/` | L body and plinth for `extrudeUp`. Fallback: two overlapping `puffy` boxes. | table rounded tops, rugs, corner shelves |
| `buildFeet` (bun/block) | `src/furniture/sofa/` | `roundedDiscGeometry` buns at the same anchors as the legs. | wave 2 cabinets and beds |
| Diner footrest ring + spokes, slab stretcher | `src/furniture/stool/` | Closed `tube` on a circle plus `strut` spokes; a `beam` between the panels. | floor lamp ring |

### Rejected or already done

| Request | Decision |
|---|---|
| `puffy(…, segments = 3)` (table, bench, sofa) | Done in PR #4. |
| `puffy` with 1 segment for slats (bench) | Rejected by R3. Use `beam`. |
| `floorFlush` on `buildLegs` (stool, optional) | Rejected. The splay clamp in R6 bounds the sink to ≤ 9.1 mm, inside `GROUND_MIN`, and it would change chair output. |
| `buildLegs` n = 1 delegating to `buildPedestal` (table) | Rejected for wave 1: it changes chair output. |
| Chair `buildBackrest` → `buildFramedBack` (bench open question 8) | Not in wave 1. |
| `legAnchors` n = 6 for long footprints (sofa) | Do not use: the rows misalign (see the bench spec's analysis). Use `rowAnchors(…, 3, …)` through `fp.anchors`. |

### 2.8 checklist

1. Phase A in any order, then B1, then B2 behind the golden gate, then C1–C4.
2. One unit test per helper: shape and extents, grounded where relevant, triangle count, determinism. For B2 also:
   `legLines` axes equal the struts `buildLegs` builds, for all chair seeds.
3. Update the furniture-kit skill (catalogue, R1–R7 conventions, `appliesTo` in the contract table) and
   `plan/02-architecture.md` (contract, rollStyle).
4. Hand the reroll test change (R2) to the test-engineer and the panel change (R2) to the ui-engineer (3.1).
