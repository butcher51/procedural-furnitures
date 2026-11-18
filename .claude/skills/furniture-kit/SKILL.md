---
name: furniture-kit
description: Reference for building procedural furniture in this repo — coordinate conventions, the FurnitureDefinition contract, seeds and re-roll groups, the catalogue of geometry/support helpers, material roles, per-item budgets, and do/don't rules. Load before writing or reviewing any generator, spec or core helper.
---

# Furniture kit

Source of truth for architecture: `plan/02-architecture.md`. This skill is the condensed working reference; keep it in sync when `src/core` changes (the architect owns that).

## Where things live

| Path | Contents |
|---|---|
| `src/core/rng.js` | `hashString`, `mulberry32`, `createRng`, `createGroupedRng`, `weightedPick`, `weightedShuffle`, `rollCycle`, `rollStyle` |
| `src/core/color.js` | `hsl`, `WOOD_TONES` (chair, frozen), `WOODS`, `STONE_TONES`, `FRAME_COLORS`, `pickWood`, `LEATHERS`, `pickLeather` |
| `src/core/palette.js` | `oklch`, `chromaLimit`, `CHROMA_LIMITS`, `colourIsCalm`, `capSaturation`, `muted`, `LIGHTNESS_BOUNDS`, `fabricColor`, `FABRIC_MOODS`, `fabricHue`, `paintColor`, `PAINTS`, `accentColor`, `harmoniousSecondary`, `HARMONY_MODES`, `shade`, `swatch`, `hexToHsl` |
| `src/core/geometry.js` | `edgeRadius`, `puffy`, `strut`, `tube`, `roundedDiscGeometry`, `extrudeUp`, `superellipseShape`, `bendZ`, `bentBandGeometry`, `normalizeUVs`, `beam`, `extrudeProfile`, `endPanelShape`, `latheSolid`, `boxProjectUVs` |
| `src/core/layout.js` | `splitSpan` |
| `src/core/supports.js` | `legAnchors`, `rowAnchors`, `buildLegs`, `legLines`, `pointOnLeg`, `LEG_PROFILES`, `bentwoodFoot`, `buildCurvyLegs`, `buildStretchers`, `buildApron`, `buildPedestal`, `buildTrestle`, `turnedPost`, `buildFeet`, `buildFramedPanel` |
| `src/core/fronts.js` | Drawer / door faces: `FRONT_DEFAULTS`, `solveFronts`, `handleSlots`, `planHandles`, `HANDLE_BUDGET`, `frontPanel`, `buildCarcass`, `buildFronts` (pure solver, no THREE in `solveFronts` / `handleSlots`) |
| `src/core/handles.js` | Handle library: `HANDLE_KINDS`, `HANDLE_DEFAULTS`, `normalizeHandle`, `handleTris`, `buildHandle`, `RING_DROP` |
| `dev/fronts.html` | Fronts board: cabinet templates per form and style, desk pedestals / apron row / hung box, every handle kind. `node scripts/fronts-board.mjs [--out out/fronts-board.png] [--only TV] [--cols 3 --w 560 --h 420]`; fixtures in `tests/helpers/front-plans.js` |
| `scripts/geometry-hash.mjs` | W6 wave-1 regression gate: hashes params + merged geometry (per material: position, normal, uv, grain, color, tris) of chair/stool/table/bench/sofa seeds 1–200, each also with a re-roll map (style 0–6 + random groups). `--check` diffs against `tests/golden/wave1-geometry-hashes.json`; without it, rewrites the file (only for an intentional wave-1 look change, in the same PR). `tests/unit/wave1-geometry-hash.test.js` runs it in `npm test` |
| `src/core/materials.js` | `createMaterials({ textureFactory })`, `canvasPatternTexture`, ref-counted pattern texture cache |
| `src/core/patterns.js` | Shader patterns: `PATTERN_KINDS`, `PATTERN_KINDS_SPEC`, `WOOD_GRAINS`, `normalizePattern`, `patternMaterial`, `applyPattern`, `injectPattern`, `patternUniforms`, `patternColours`, `woodPattern`, `grainAlong`, `autoGrainAxis`, `writeGrain`, `writeAutoGrain`, `transformGrain`, `usesGrain` |
| `src/core/merge.js` | `groupParts`, `mergeByMaterial`, `fillMissingAttributes`, `disposeObject` |
| `dev/patterns.html` | Pattern board (every kind on boxes, cylinder, cushion, sofa block, wood bench/table/frame) at close-up, item and grid distance. `node scripts/pattern-board.mjs [--out out/pattern-board.png] [--parts 5]`; `--perf chair,sofa` measures full grids with and without patterns |
| `src/core/item.js` | `itemSeed`, `generateItem(def, sceneSeed, n, rerolls, dna)`, `buildItem(def, params, kit)`, `rerollableGroups`, `fixedGroups`, `groupApplies(def, groupId, params)`, `canRoll(def, groupId, params)`, `shortcutGroups(def)` (C/S key targets) |
| `src/core/kit.js` | `createKit({ textureFactory })` → `{ materials }` |
| `src/furniture/registry.js` | `register`, `get`, `has`, `list`; one import + `register()` line per type |
| `src/furniture/chair/` | Reference plugin: `index.js` (definition), `params.js`, `build.js` |

Generators import geometry/support helpers directly from `src/core/*`; `kit` carries what depends on the runtime (materials bound to a texture factory).

## Conventions

- Units are **meters**. Use real-world, ergonomic ranges (see the spec for the type).
- **y is up.** Items stand on **y = 0**, the **front faces +z**, items are **centred on x/z**.
- Back rests pivot on the rear edge of the seat (`pivot.rotation.x = -deg(backAngle)` tilts backwards).
- Low-poly, flat-shaded, soft bevels (R3: never fewer than 2 facets on a rounded edge):
  - hero soft parts (seats, tops, cushions, upholstered bodies, panels): `puffy` with 3 segments; an item-wide budget fallback may drop a whole role to 2, never mixed;
  - structural boxes that are not repeated bars (arm posts, back frames, plinths, runners): `puffy` with 2;
  - thin repeated bars (slats, back boards, rails, aprons, cleats, square stretchers, trestle members, arm boards): `beam` (2 steps, 44 tris);
  - `puffy` with 1 segment is not allowed. The chair keeps 2-segment `puffy` slats (golden test).
- Cylinders 4–12 sides; flat round tops and discs larger than ⌀ 0.8 m may use 16.
- Material roles (R5): at most 4 per item, listed in the spec with the item-wide maximum. Parts sharing a colour share one material instance.
- Grid cells are square (R4); each type keeps its own `cell.spacing`. `cell.spacingZ` is reserved for wave 2.
- Leg params (R6): `legCount` (0 for supports built another way, never 1 for new types, 2 only for the sled branch on purpose), `legThickness` (top diameter), `legSides` (4–8), `legTaper` (bottom ÷ top radius), `legSplay` (foot offset; clamp `legSplay ≤ 0.35 × legHeight`), `legHeight` (= `fp.top`), `legInset`. Branch on the support kind before calling `buildLegs`; pass an explicit leg object when the type lacks a field a branch reads. Stretcher/footrest kinds: `'none' | 'ring' | 'perimeter' | 'h' | 'ends' | 'cross'`.
- Core vs local (R7): a helper goes into `src/core` when two wave-1 types use it or it fixes a cross-type convention; otherwise it lives in the generator folder until the architect promotes it.

## FurnitureDefinition contract

```js
export default {
  id: 'table',
  label: 'Table',
  styles: { dining: 0.35, coffee: 0.25, side: 0.15, cafe: 0.15, trestle: 0.1 },
  cell: { spacing: 2.6, gridSize: 15 },
  plural: 'tables',
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    { id: 'shape', label: 'Shape', reads: ['style'], fields: ['topShape', 'height', 'hasShelf'] },
    { id: 'shelf', label: 'Shelf', reads: ['shape'], fields: ['shelfHeight'], appliesTo: (p) => p.hasShelf },
    { id: 'palette', label: 'Colours', fields: ['topColor'] },
    { id: 'finish', label: 'Finish', reads: ['palette'], fields: ['frameColor'] },
  ],
  generateParams(g, dna) {},
  build(params, kit) {},
  describe(params) {},
};
```

| Member | Contract |
|---|---|
| `styles` | Style id → roll weight. Tests check the observed distribution (±4 pp over 2,000 seeds). Modern types roll it with `const style = rollStyle(g, definition.styles)` and keep the `style` group rerollable (R1). The chair stays `rerollable: false`. |
| `cell` | Grid spacing (m) and grid size. Item x/z extent must be < `spacing − 0.1`. |
| `groups` | Groups in roll order. `fields`: the params the group owns (re-roll tests check isolation with it). `reads`: earlier groups whose results it uses. `rerollable: false` hides the ⟳ button and ignores rerolls. A group may read earlier groups, never later ones. `appliesTo(params) → boolean` is optional (R2): pure, reads only the final params, never affects generation. When it returns false the panel hides that group's ⟳ (rows still show), and the re-roll test skips the change rate for that seed but requires that a re-roll changes no field outside the group's own `fields`. If earlier groups decide that the group does not apply, give its fields neutral values (`0`, `false`, `null`, `'none'`). Call it through `groupApplies(def, id, params)`, or `canRoll(def, id, params)` (also requires `rerollable !== false`) from `item.js`. Steps back stay possible after a group stops applying. |
| `plural` | Loader text ("Generating tables…"). Defaults to `label + 's'`. |
| `itemSeed`, `legacyRng` | Chair only, for old links. New types omit both. |
| `generateParams(g, dna)` | Pure. All randomness via `g.roll(groupId, (r) => …)`. Returns JSON-serialisable data incl. `seed`, `type`, `style`. |
| `build(params, kit)` | Pure. Returns an array of `Object3D` parts in item space. No randomness. |
| `describe(params)` | `{ sections: [{ group, rows: [[label, value]] }], swatches: [hex] }`. `value` is a string or `{ swatches: [hex] }`. |

## Seeds and re-rolls

- Item seed: chair `${seed}-${n}` (n from 1, legacy); every other type `${seed}-${type}-${n}`.
- `createGroupedRng(itemSeed, rerolls, { legacy })` → `g.roll(groupId, fn)`.
  - Modern: each group draws from `createRng(`${itemSeed}/${groupId}/${rerolls[groupId] ?? 0}`)`.
  - Legacy (chair only): `fn` runs on the shared stream first so draws are unchanged; with a reroll it runs again on the group stream.
- URL: `?type=table&seed=abc&item=42&r=42.palette2.shape1~7.finish1`. Test flags: `view=single`, `anim=0`.

## RNG (`src/core/rng.js`)

`createRng(seed)` → `{ next(), range(min, max), int(min, max) /* inclusive */, pick(arr), chance(p) }`. `hashString` + `mulberry32`. Never use `Math.random`.

| Helper | Does | Gotcha |
|---|---|---|
| `weightedPick(r, weights)` | `weights` is `{ id: w }` or `[[value, w], …]`; one `r.next()`, cumulative in insertion order | Object keys come back as strings. Use it instead of ad-hoc threshold chains. |
| `weightedShuffle(r, weights)` | Every value once, ordered by Efraimidis–Spirakis keys (`u^(1/w)`, one draw per entry, descending) | Weight-0 entries go last (still one draw each). |
| `rollStyle(g, styles)` | Style for a modern grouped rng (R1). Re-roll 0 = `weightedPick` on the `style/0` stream (identical to `g.roll('style', (r) => weightedPick(r, styles))`). Re-rolls 1…k−1 visit every other style once, in a weighted-shuffle order from stream `${seed}/style/order`; re-roll k returns the base; then it cycles. | Call it outside `g.roll`, modern mode only. Re-roll 1 is never the base style, so the style change rate is 100 %. Implemented as `rollCycle(g, 'style', styles)` (identical streams). |
| `rollCycle(g, groupId, weights)` | Any group cycled like `rollStyle`: base from `${seed}/${groupId}/0`, cycle order from `${seed}/${groupId}/order` | W1: at most one extra cycled group per type (cabinet `kind`, declared as `definition.kinds`). Same rules as `rollStyle`: outside `g.roll`, modern mode. |

## Helper catalogue

| Helper | Makes | Gotcha |
|---|---|---|
| `hsl(h, s, l)` (color) | sRGB hex string | Inputs 0–1. New types never call it with drawn s/l: use the `palette.js` pickers (see Colour). |
| `WOOD_TONES` (color) | `{ name, h, s, l }` × 6 | Chair only, frozen for its golden params. New types use `WOODS` via `pickWood`. |
| `WOODS` (color) | `{ name, h, s, l }` × 6, same names and order as `WOOD_TONES`, lower saturation, cherry/mahogany browner | Every tone ± 0.04 l passes `colourIsCalm`; keep wood lifts (`l ± 0.04`) inside that. |
| `pickWood(r, { weights } = {})` (color) | `{ name, h, s, l }` from `WOODS` with h ± 0.01 and l ± 0.05 | Exactly 3 draws (pick, h, l). Draw it even when unused so the stream stays stable. Without `weights` it is the wave-1 code path (`r.pick`); `weights` = `{ name: w }` (missing names 0) switches the pick to `weightedPick`. `WOODS` has no teak/ash: use honey / birch. |
| `LEATHERS` / `pickLeather(r)` (color) | 5 tones `{ name, h, s, l }`: tan, cognac, chocolate, oxblood, bottle green / `{ name, h, s, l, hex }` | Exactly 3 draws (pick, h ± 0.01, l ± 0.03); every tone over the full jitter passes `colourIsCalm` (unit test). Leather tabs, inlays, later straps. |
| `STONE_TONES` (color) | `{ name, h, s, l }` × 4: white marble, black marble, travertine, grey terrazzo | Jitter l ±0.03. |
| `FRAME_COLORS` (color) | `{ black, white, metal }` hexes | The chair's frame hexes; don't invent new near-blacks. |
| `colourIsCalm(hex)` (palette) | `true` when OKLCH chroma ≤ `chromaLimit(hue)` | The enforced rubric: `tests/unit/colour-calm.test.js` checks every `#rrggbb` string in params and every material colour over 500 seeds per type. |
| `capSaturation(h, s, l)` / `muted(h, s, l)` (palette) | Swatch `{ h, s, l, hex }` / its hex, with l clamped to `LIGHTNESS_BOUNDS` [0.18, 0.9] and s lowered (binary search) until chroma ≤ 0.92 × limit | Hue-aware: green/cyan/blue/violet lose far more saturation than earth/rose. Never raises s. Use it for any derived colour you compute yourself. |
| `fabricColor(r, { mood = 'muted' })` (palette) | Calm fabric swatch; moods `neutral` / `muted` / `bold` (`FABRIC_MOODS`) | Exactly 3 draws (hue, s, l). Hue goes through `fabricHue`, which under-weights green and magenta. |
| `paintColor(r)` (palette) | `{ name, h, s, l, hex }` from the curated `PAINTS` (sage, olive, forest, slate blue, navy, powder blue, teal, dusty rose, oxblood, terracotta, ochre, cream, putty, charcoal, plum) | Exactly 3 draws (weighted pick, h ± 0.012, l ± 0.04). |
| `accentColor(r, base)` (palette) | Pillow / stripe / trim swatch related to `base` (`analogous`, muted `complement`, `warm` ochre–rust, or `tonal`) | Exactly 3 draws. Saturation follows the base band (0.18–0.4); lightness moves away from the base for contrast. |
| `harmoniousSecondary(primary, mode)` (palette) | Pattern secondary for `HARMONY_MODES` (`light`, `dark`, `complement`, `analogous`, `white`) | Pure, no draws. `complement` keeps s ≤ 0.9 × primary s (min 0.06, max 0.38), so a neutral primary gets a neutral complement. `primary` is any `{ h, s, l }`. |
| `shade(base, dl, sScale = 1)` (palette) | `base` lighter/darker (and optionally desaturated), capped | Use for body/plinth/frame "match" colours instead of `hsl(hue, s·0.85, l − 0.12)`. For a frame that must read against painted slats use a large `dl` (≥ 0.2) or a different source. |
| `swatch(hex)` / `hexToHsl(hex)` (palette) | `{ h, s, l, hex }` / `{ h, s, l }` from a hex | Lets you feed a fixed hex (e.g. a stone or frame colour) to `accentColor` / `harmoniousSecondary`. |
| `edgeRadius(r, w, h, d)` (geometry) | Clamped bevel radius | Always use it; RoundedBoxGeometry breaks when r ≥ half the thinnest side. |
| `puffy(w, h, d, r, mat, segments = 3)` (geometry) | Rounded box mesh centred on origin | Radius is clamped via `edgeRadius`. Geometry is non-indexed. Cost is 12·(2·segments+1)² triangles: 588 at 3, 300 at 2. Pass `segments` 2 for thin repeated bars (slats, rails) to stay under 6k. |
| `roundedDiscGeometry(radius, h, edge, sides)` | Lathe disc with rounded rim, centred on y | `sides` 6–12 keeps it low poly. |
| `strut(bottom, top, rTop, rBottom, sides, mat)` | Cylinder between two Vector3s | Rotated with a 45° phase so 4-sided legs look square-on. |
| `tube(points, radius, sides, mat, closed, segments)` | Centripetal Catmull-Rom tube | Ends are open. A tube ending at the floor floats by `radius` unless you close it, e.g. with `bentwoodFoot`. |
| `extrudeUp(shape, height, bevel)` | Beveled slab from a plan outline, bottom at y = 0 | Shape is in (x, −z). UVs are in meters → `normalizeUVs`. |
| `superellipseShape(hx, hz, exponent, steps)` | Plan outline | exponent 2 = ellipse, 4 = squircle, 10 ≈ rectangle. |
| `bentBandGeometry(w, h, t, bend)` | Vertical band curved in plan | Ends come forward by `bend`. |
| `normalizeUVs(geo, size)` | Rescales meter UVs | Needed so patterns tile like on boxes. |
| `beam(a, b, width, thickness, radius, mat, steps = 2)` (geometry) | Bar from Vector3 `a` to `b` with a rounded-rectangle section and flat ends; mesh positioned at the midpoint | Width runs along `normalize(dir × Y)` (x when vertical), thickness along `width × dir`: a bar along x has width in z and thickness in y. Extents are exact. 8·steps + 28 tris (44 at 2). Non-indexed; u along the bar, v around it, in meters. A slanted beam's corners reach `width/2·sin` past its end heights. |
| `splitSpan(start, end, count, gap)` (layout) | `[{ center, size }]`, equal parts with `gap` between | `size` is floored at 0.001; check it before using tiny spans. |
| `extrudeProfile(outline, thickness, bevel, plane = 'side')` (geometry) | Beveled slab from a `Shape` (holes allowed) or `Vector2[]` | `'side'`: outline in (z, y), thickness along x; `'front'`: outline in (x, y), thickness along z; centred on the extrusion axis. Outline extents are exact (`bevelOffset = −bevel`), so an outline from y = 0 stands on the floor. Place with rotations, never a negative scale. UVs in meters. |
| `endPanelShape(width, height, { cut, cutWidth, cutHeight, steps = 6 })` (geometry) | Panel outline in (u, y), u in ±width/2, y 0…height, with a bottom-centre cut `'none' | 'arch' | 'v' | 'notch'` | Clamps `cutWidth ≤ 0.6·width` and `cutHeight ≤ 0.9·height` (feet ≥ 0.2·width). Feed it to `extrudeProfile`. |
| `latheSolid(profile, sides)` (geometry) | Closed lathe solid from `[[r, y], …]` bottom → top | Adds axis points at the ends where r ≠ 0. Start at y = 0 to stand on the floor. Indexed; 2·sides·(points + 1) tris when both caps are added (incl. degenerate fan triangles). |
| `boxProjectUVs(geometry, unit = 1)` (geometry) | Per-triangle planar UVs on the dominant normal axis, in `unit` meters | Returns a new geometry (disposing the input) when the input is indexed: always use the return value, e.g. `mesh.geometry = boxProjectUVs(mesh.geometry)`. Every part sharing a material must use the same UV convention; with `unit = 1`, `surface({ scale })` means repeats per meter. |
| `legAnchors(p, fp)` (supports) | Leg top (x, z) list for 1–n legs | Uses `p.legCount`, `p.legThickness`; `fp = { width, depth, round?, exponent?, anchors? }`. Returns `fp.anchors` unchanged when present. Don't use n = 6 (rows misalign): use `rowAnchors`. |
| `rowAnchors(length, depth, perRow, insetX, insetZ)` (supports) | Two straight rows at z = ±(depth/2 − insetZ), `perRow` legs over ±(length/2 − insetX) | Perimeter order: front row left → right, then back row right → left. Pass it as `fp.anchors` and set `legCount` to its length. |
| `buildLegs(p, mats, fp)` (supports) | Legs: pedestal (1), sled runners (2), splayed struts (3+) | `fp.top` = y the legs hold up. The 3+ branch builds one `strut` per `legLines` entry. |
| `legLines(p, fp)` (supports) | `[{ top, bottom, rTop, rBottom }]`, the exact axes `buildLegs` builds for `legCount ≥ 3` | Empty for `legCount < 3`, even with `fp.anchors`. Radial splay by default; `fp.splayAxes = [sx, sz]` splays along `normalize(sign(x)·sx, sign(z)·sz)` (a leg at x = 0 splays in z only). Pass the same `fp` as to `buildLegs`. |
| `pointOnLeg(line, y)` (supports) | Point on a leg axis at height y | Linear. Use it for every rail, apron or shelf end so parts meet splayed legs. |
| `buildStretchers(lines, kind, y, { radius, sides = 6, profile = 'round', stagger = 0 }, mat)` (supports) | Rails between leg axes at y: `'none' | 'ring' | 'perimeter' | 'h' | 'ends' | 'cross'` | Lines in perimeter order. `ring` is a closed tube (32 segments). `perimeter` raises rails running mostly along z by `stagger`. `h`/`ends` throw unless ≥ 2 legs sit at z > 0 and ≥ 2 at z < 0: resolve 3-leg fallbacks in params. `cross` adds a hub disc (2.5·radius). `profile: 'square'` uses `beam` (44 tris per rail). |
| `buildApron(lines, { top, height, thickness, setback = 0, edges = 'all', radius = 0.004 }, mat)` (supports) | One `beam` per consecutive leg pair, top edge at `top` | `edges`: `'all'`, `'long'` (along x), `'short'`. `setback` moves each rail toward the centre. Two lines give one rail. |
| `buildPedestal({ top, base = 'disc', baseRadius, baseHeight, baseTaper = 0.5, columnRadius, columnSides = 10, sleeve, cap, armWidth = 1.6·columnRadius }, mat)` (supports) | Base (`disc`; `cone`; `cross`, 4 arms at 45°; `tripod`, one arm to −z and two at ±60° from +z), column, optional `sleeve { radius, height }` and `cap { radius, height }` | Bottom at y = 0; cap top (or column top) at `top`. Arms lie on the floor and reach `baseRadius`. `buildLegs`' 1-leg branch does not use it (chair golden). |
| `buildTrestle({ length, depth, top, kind, inset, footLength, footHeight, beamWidth, postDepth = beamWidth, cleatHeight, cleatLength = 0.8·depth, stretcherHeight, stretcher = true, backRail = false, radius = 0.006 }, mat)` (supports) | Two `beam` frames at x = ±(length/2 − inset) (foot, posts, cleat) plus one long stretcher at z = 0 | `kind` `'I'`: one `beamWidth × postDepth` post. `'A'`: two slanted posts (±0.38·footLength → ±0.2·cleatLength) and a crossbar at `stretcherHeight`. `'X'`: crossed beams; the stretcher sits at the crossing and `stretcherHeight` is ignored. Slanted ends are pulled in so corners stay within y 0…`top`. 308–484 tris. `backRail: true` adds one `beamWidth²` beam (+44) along x under the cleats' rear ends (top face at `top − cleatHeight`, z = −(cleatLength/2 − beamWidth/2)), independent of `stretcher`. |
| `turnedPost({ height, thickness, blocks = [], finial = 0, sides = 8, profiles = [] }, mat)` (supports) | `Group` at x = z = 0 (position the group): square `beam` blocks at each `[y0, y1]`, one `latheSolid` turning per gap between 0, the blocks and `height` | Turnings: the table's 9-point profile (R = 0.95·thickness/2, 2·sides·10 tris) or `profiles[i] === 'simple'` (5 points, 2·sides·6 tris), indexed per built turning bottom → top. Block radius `min(0.006, 0.2·thickness)`, 44 tris. `finial > 0` adds a 5-point knob from `height` to `height + finial`. Grain y. Table leg = `blocks: [[legHeight − block, legHeight]]` (W6-identical). |
| `buildFeet(anchors, { kind = 'bun', height, radius, edge = 0.6·radius, sides = 8 }, mat)` (supports) | `Mesh[]`, one per `[x, z]` anchor, standing on y = 0 | `bun`: `roundedDiscGeometry(radius, height, edge, sides)`, grain y. `block`: vertical `beam` 2·radius square, 44 tris. Pass `edge` explicitly when matching existing maths (the sofa passes `legThickness·0.3`). |
| `buildFramedPanel({ width, postWidth, postDepth, postBottom = 0, postTop, rails: [{ y, height, thickness }], fill: { kind: 'slats' \| 'bars' \| 'none', count, from, to, thickness, width = null }, puff }, { frame, fill })` (supports) | `Group` in its own frame (centred on x, z = 0): two posts at ±(width/2 − postWidth/2), one rail per entry (`y` = rail centre) between post centres, then the fill | Slats: vertical, pitch `innerW / count`, width `width ?? min(0.5·pitch, 0.05)`, y `from`…`to`. Bars: `splitSpan(from, to, count, 0.14·(to − from))`, bar height `min(size, 0.05)`. All `beam`s (44 tris each). Bench back = 2 rails + slats/bars (W6-identical). |
| `solveFronts(plan, field, opts) → { fronts, open, members, closed, face, stats }` (fronts) | Pure face-grid solver (cabinet spec): `plan` tree of `{ split: 'x' \| 'y', children, weights?, sizes?, symmetric? }` (child `size` in m = fixed) and leaves `{ leaf: 'drawers', count, across = 1, acrossTop, grade = 1 }`, `{ leaf: 'doors', hinge: 'auto' \| 'left' \| 'right' \| 'bottom' }`, `{ leaf: 'open', shelves }`; `field = { x0, x1, y0, y1, z }` | Options (`FRONT_DEFAULTS`, all per call): `construction`, `gap`, `frameWidth`, `reveal`, `thickness`, `min/maxDrawerH` (0.09/0.30), `min/maxDrawerW` (0.22/1.0), `min/maxDoorW` (0.22/0.6), `maxWideDoorW` 0.7, `minOpenW/H`, `maxDoorH` (∞; taller doors stack), `maxFronts` 16, `grainMode`, `fallback` leaf (nightstand: `{ leaf: 'drawers', count: 2 }`). `count` stacks rows top → bottom and is raised/lowered to fit the drawer limits; `grade` = height ratio to the row above; "D×2 @first / Dn" = `{ leaf: 'drawers', count: n + 1, acrossTop: 2 }`. Overlay separators are `gap`, `frameWidth` next to open cells (a `full`-depth member); inset puts a member on every split line. Fronts: `{ kind: 'drawer' \| 'door' \| 'flap', x0…y1, z0, z1, hinge, grain, leaf, bay, row, col, index }`. `stats.degraded`: `none` → `counts` → `collapsed` → `fallback`. Never mutates `plan`. Wider than `maxDrawerW` splits every row: pass `maxDrawerW` when a plan wants full-width drawers. |
| `handleSlots(front, hw) → [{ kind, x, y, z, axis, length, size, side? }]` / `planHandles(layout, hw)` (fronts) | Handle placement per front (cabinet table): pairs on drawers > 0.70 m (bars > 0.96 m) at the quarter points; doors on the opening side (`doorInset`, top at `doorDrop`, centred below 0.30 m); flaps like drawers at the top | Doors map `cup → bar` unless `hw.doorKind`. File drawers (> 0.24 m, `vPos: 'centre'`) put the handle at `y1 − h/3`. Fit: footprint inside the front − 8 mm (lips are flush with the edge), bars snap to 32 mm and shorten to 0.064, knobs shrink to 0.6·h, cut-outs need h ≥ 0.09 else `groove`. `planHandles` adds `front` (index) and drops to one handle per drawer above `HANDLE_BUDGET` 2.2k tris. |
| `HANDLE_KINDS`, `normalizeHandle(hw)`, `handleTris(kind, hw)`, `buildHandle(slot, hw, mat)` (handles) | `Group` facing +z with its back face on `slot.z` | Tris: knob 96, bar 72 round / 132 square, cup 92, ring 128 (6-sided rosette + 10×4 closed tube, hangs `RING_DROP`·⌀ tall), tab 88, lip 44, cutout / groove / none 0 (no part). `normalizeHandle` fills `HANDLE_DEFAULTS` and maps `size` to the kind's main dimension (knob/ring ⌀, bar length, cup width, tab length); `projection` defaults per kind. `cutoutShape: 'slot' \| 'notch'`. |
| `frontPanel(front, { thickness, bevel, style: 'slab' \| 'framed' \| 'insert', frameWidth, cut, groove, grooveSide }, { front, insert })` (fronts) | Front panel in item space, face at `front.z1` | Slab: 44 tris; `cut = { kind: 'slot' \| 'notch', x, y, width, height }` (stadium hole, vertical when taller than wide; or top half-moon) ≈ 100–150 tris. `groove` shortens the panel at `grooveSide` (`top`, or the door's opening side). Framed / insert: 4 beams + centre panel set back 6 mm (≈ 220 tris), `frameWidth ≤ 0.2·min(w, h)`; insert panel uses `mats.insert`. Grain from `front.grain`. |
| `buildCarcass({ width, depth, y0, y1, panel, back = 0.01, sides = true, bottom = true, construction = 'overlay', frontThickness = 0.02, edge = 0.002, x = 0, radius = 0.002 }, mat) → { parts, field, opening, innerDepth }` (fronts) | Side, bottom and back `beam`s (44 tris each), **never a top**; bases are separate | Fronts face at z = depth/2, back at −depth/2. Overlay: carcass edges at depth/2 − frontThickness, `field` = outline shrunk by `edge`. Inset: edges at depth/2, `field` = `opening` (inside sides and bottom, up to `y1`). `innerDepth` = face plane to the back panel (for full-depth members). |
| `buildFronts(layout, { thickness, bevel, drawerStyle, doorStyle, frameWidth, doorFrameWidth, members = true, backers = true, memberDepth = 0.02, fullDepth, backerThickness = 0.012, opening, shelfThickness = 0.018, groove = 0.022 }, hw, { front, insert, hardware, carcass }) → Object3D[]` (fronts) | One `frontPanel` per front, one `buildHandle` per `planHandles` slot, members, open-cell shelves and closed-region backers | Framed drawers only from 0.15 m high. Cut-outs on framed fronts become grooves. Backers sit right behind the fronts (`connected`) and are clipped to `opening` (pass `carcass.opening` so they never cut the side panels). `backers: false, members: false` when a rail already sits behind (desk apron). |
| `bentwoodFoot(path, radius, sides, mat)` (supports) | Ferrule foot from y = 0 up past the open end of a tube leg | `path` is the tube curve (`mesh.geometry.parameters.path`); the end centre must sit `radius` above the floor. 4·sides triangles. |
| `buildCurvyLegs(p, mats, fp)` (supports) | Bentwood legs (sabre/cabriole/bow) on ferrule feet + optional ring | Needs `p.legCurve`, `p.hasRing`, `p.ringHeight`. Feet stand on y = 0 exactly. |
| `mergeByMaterial(root)` (merge) | One mesh per material | Disposes source geometries; converts indexed → non-indexed. For wood-pattern materials it writes `writeAutoGrain` on parts without a `grain` attribute and rotates every `grain` into item space; for other materials it drops `grain`. Attributes only some parts carry are zero-filled (`fillMissingAttributes`). |
| `grainAlong(object, axis = 'auto')` (patterns) | Writes the per-vertex `grain` attribute (wood fibre direction) on every mesh under `object`; returns `object` | `axis` is `'x'`/`'y'`/`'z'`, `[x, y, z]` or a `Vector3` **in `object`'s own frame** (children get it converted into their frames). Call it on the part as built (after its rotation is set is fine, the axis is local), before `build` returns. `'auto'` = `autoGrainAxis`, tube tangents for `tube`. Gotchas: it mutates the geometry, so don't share one geometry between parts with different grain; square-ish slabs (seats, round tops) need an explicit axis because auto picks the longest bbox side; no need to call it for beams, struts and legs (auto is right). |
| `autoGrainAxis(geometry)` (patterns) | `Vector3`: `geometry.userData.grainAxis` when set (`beam` sets it to its direction), else the longest local bbox axis | Local frame of the geometry. |
| `fillMissingAttributes(geometries)` (merge) | Adds zero-filled attributes so `mergeGeometries` accepts mixed parts | Used by `mergeByMaterial`; a missing `uv` becomes (0, 0). |
| `disposeObject(root)` (merge) | Frees geometry, materials, maps | Call before dropping an item. |

## Materials

`kit.materials` (from `createMaterials`), all `MeshStandardMaterial` with `flatShading: true`:

- `surface({ color, secondary, pattern: 'solid'|'stripes'|'checker', scale, direction: 'horizontal'|'vertical', roughness = 0.8 })` — canvas texture via the texture factory (chair, legacy); plain colour when the factory is absent (Node). `pattern` may also be a shader kind name (`'dots'`, defaults) or a spec object (`{ kind: 'floral', spacing: 0.1 }`); then `[color, secondary]` become the spec's `colors` unless the spec has its own, and `scale`/`direction` are ignored.
- `pattern(spec, { roughness = 0.8, metalness = 0 })` — shader pattern material (see Shader patterns).
- `wood(wood, { grain = 'plain'|'fine'|'bold'|'none', seed = 0, scale = 1, roughness = 0.7 })` — wood grain from a `pickWood`/`WOODS` swatch `{ h, s, l }` or a hex; base = `hsl(h, s, l)`, darker late-wood and lighter tones via `shade`. `'none'` returns a plain material in the base colour.
- `frame(color, finish)` — `finish === 'metal'` → roughness 0.35, metalness 0.6, else roughness 0.7.
- `solid(color, roughness = 0.9)` — upholstered bodies and anything plain.

Create a fresh material per item per role (merge groups by material identity). Pattern textures are cached and ref-counted; `disposeObject` releases them, so never call `texture.dispose()` yourself. Planned roles: `glass`, `emissive`.

### Shader patterns (`src/core/patterns.js`)

GLSL injected into `MeshStandardMaterial` with `onBeforeCompile` (flat shading, roughness, shadows unchanged). `customProgramCacheKey` is `pattern-<kind>-1`, so every item shares one program per kind; colours, sizes and seed are per-material uniforms (`uPatA…D`, `uPatP`, `uPatSeed`). No textures, no UVs, no extra triangles.

- **Item space.** Patterns read the merged mesh's local `position` (= item space), so an item looks the same at any grid cell and after a rebuild. Sizes are meters: a 5 cm dot is 5 cm on a stool and on a sofa.
- **Projection.** 2D kinds project on the dominant axis of each face's own normal (from `dFdx`/`dFdy`, so vertex normals don't matter): x faces use (z, y), y faces (x, z), z faces (x, y). The normal components are weighted (x 1, y 1.3, z 1.19) before the comparison, so ties fall at ~50° (x/z), ~52° (x/y) and ~47.5° (z/y), away from the 22.5/30/36/45/54/60° facets of lathes, drums and 2–3 segment bevels: a 45° facet always gets the same axis and never flips per pixel. This is triplanar with a hard switch; blended triplanar ghosts half-patterns on 45° bevel facets, and on flat-shaded facets the hard switch reads as printed fabric (motifs are still cut at bevel facet edges).
- **Anti-aliasing.** Edges are one pixel wide. The footprint (`patFootprint`) is the geometric mean of the two screen-derivative lengths, floored at a quarter of the larger one, so a foreshortened top keeps its detail about as long as a side seen square-on, without shimmer. Detail fades to its average colour once it gets smaller than ~1–2 px, so grids at 45 m show calm flat colour and no moiré.
- **Spec** (`userData.pattern`, plain JSON): `{ kind, colors: [hex…], scale = 1, seed = 0, …kind fields }`. `colors[0]` is required (`#rrggbb`); missing colours are derived from it with `shade` (direction flips on very dark/light bases so there is always contrast). `scale` multiplies every length field. Out-of-range numbers are clamped, unknown enum values fall back to the first value. `seed` (number or string) shifts the pattern phase; pass `params.seed` so neighbours differ. `material.color` = `colors[0]`.
- **Colour rule.** Every explicit colour must come from the pickers (`colourIsCalm`); `tests/unit/colour-calm.test.js` checks `userData.pattern.colors` of every material.

| Kind | Colours `[0, 1, 2, 3]` | Fields (default, range; lengths in m) | Use |
|---|---|---|---|
| `wood` | base, late wood (−0.1 l), light (+0.06 l) | `ringSpacing` 0.009 (0.002–0.05), `fibre` 0.5 (0–1), `figure` 0.5 (0–1, ring waviness) | All wood parts; needs grain (below). Presets `WOOD_GRAINS`: `fine` 5 mm, `plain` 9 mm, `bold` 15 mm |
| `dots` | ground, dot | `spacing` 0.05 (0.008–0.4), `size` 0.2 (radius ÷ spacing, 0.05–0.45), `layout` `'offset'` \| `'grid'` | Polka cushions, pillows, seat pads |
| `floral` | ground, petal, centre, leaf | `spacing` 0.11 (cell, 0.03–0.5), `petals` 5 (4–7), `size` 0.24 (0.12–0.28), `leaves` true | Pillows, cottage upholstery |
| `gingham` | ground, band, overcheck line | `spacing` 0.02 (check, 0.004–0.2), `overcheck` 0 (line width in checks, 0–0.3; > 0 adds a line every 4 checks) | Seat pads, café chairs, cushions |
| `ticking` | ground, stripe | `spacing` 0.03 (0.004–0.3), `width` 0.12 (÷ spacing, 0.02–0.45), `direction` `'vertical'` \| `'horizontal'`, `double` false | Pinstripe / ticking upholstery |
| `herringbone` | ground, twill line | `band` 0.03 (zigzag column, 0.006–0.2), `spacing` 0.01 (twill line period, 0.002–0.05), `width` 0.45 (0.1–0.7) | Tweed sofas, armchairs |
| `terrazzo` | ground, chip, large chip | `size` 0.014 (chip cell, 0.003–0.08), `density` 0.6 (0.1–1) | Stone tops (`STONE_TONES`), plinths |
| `linen` | base, darker slub, lighter slub | `thread` 0.004 (0.001–0.02), `strength` 0.4 (0–1), `texture` `'linen'` \| `'boucle'` | Plain fabric micro-texture; averages to `colors[0]` at distance. Default slubs are ±0.04 l; bouclé loops are ~0.7·`thread` (mm scale). Pass only `[base]` as colours: a pattern secondary as slub colour reads as camouflage |

**Wood grain through merge.** The wood shader reads a per-vertex `grain` attribute (unit vector, fibre direction). `grainAlong(part, axis)` writes it in the part's local frame; `mergeByMaterial` rotates it with the part's world matrix into item space, writes `autoGrainAxis` for wood parts that have none (beams use their direction, other parts their longest bbox side, tubes their tangents), and drops it from non-wood meshes. Rings are circles around a slightly tilted copy of the grain axis (centre ~0.3 m off the item origin, tilt ~0.08), with ring-spacing noise, a low-frequency sweep scaled by `figure`, and darker growth zones every ~4 rings that stay visible at item distance; flat faces along the grain show cathedral arcs and uneven bands instead of pinstripes, end faces show arcs. Ring and fibre contrast is boosted up to 1.6× on dark woods so walnut still shows grain. Gotcha: set the axis explicitly on near-square slabs (seat panels, round tops), or the grain picks whichever side happens to be longer, and it may flip between seeds.

### How to adopt shader patterns in a generator

1. Keep colour picking as is (pickers, hex in params). Add pattern choices to params as plain data, e.g. `seatPattern: { kind: 'dots', spacing: 0.05, layout: 'offset' }` or `'none'`, rolled in the group that owns the fabric (usually `pattern` or `palette`); wood parts use `pickWood` plus a `grain` field (`'fine'|'plain'|'bold'`).
2. In `build`: `const wood = kit.materials.wood(p.wood, { grain: p.grain, seed: p.seed })`, `const fabric = p.seatPattern === 'none' ? kit.materials.solid(p.seatColor) : kit.materials.pattern({ ...p.seatPattern, colors: [p.seatColor, p.patternColor], seed: p.seed })`. One material per role, as before (≤ 4 draw calls).
3. Call `grainAlong(part, 'x')` on slabs/tops whose long axis is ambiguous; slats, legs, rails and beams need nothing.
4. Check `node scripts/pattern-board.mjs` for the look, snapshot your type, run the calm test. Don't touch the chair (golden).

### Colour

**Rule: new types must draw every colour via these pickers**: `fabricColor`, `paintColor`, `accentColor`, `harmoniousSecondary`, `shade` / `capSaturation` (`src/core/palette.js`), `pickWood` + `WOODS`, `STONE_TONES`, `FRAME_COLORS`. No `hsl(hue, r.range(…), …)` on a free hue, no `WOOD_TONES` (chair only). Store swatches as hex strings in params; keep `{ h, s, l }` only where a later group needs it.

- `colourIsCalm` thresholds (OKLCH chroma limit, linear between hue anchors in degrees): 0° 0.10 · 30° 0.105 · 60° 0.12 · 85° 0.115 · 105° 0.08 · 130° 0.07 · 160° 0.07 · 195° 0.075 · 230° 0.075 · 265° 0.075 · 290° 0.07 · 330° 0.08 · 360° 0.10. Greys, blacks, whites, `WOODS` and `STONE_TONES` pass; brass at `hsl(0.11, 0.55, 0.5)` fails narrowly, so draw brass through `capSaturation(0.11, s, l)`; review neons (lime, kelly green, cyan, royal blue, electric violet, magenta, hot pink) fail.
- The calm test covers every `#rrggbb` string in params, including colours a seed rolls but does not use, so unused fields must come from the pickers too.
- `tests/unit/colour-calm.test.js` marks types still on the old palette as `todo` (`TODO` set). Remove your type from that set when it adopts the pickers.
- Visual check: `node scripts/palette-board.mjs [out/palette-board.png] [seed]` renders fabric moods, paints, woods and primary + secondary + accent pairs; anything that fails `colourIsCalm` gets a red outline.

## Budgets (per item)

| Metric | Budget | Chair baseline (500 seeds, Node, after the curvy-foot and thin-bar fixes) |
|---|---|---|
| Draw calls after merge | ≤ 4 (≤ 6 with emissive/glass) | max 3 |
| Triangles | ≤ 6k | p50 2.6k · p95 4.2k · max 5.4k (classic max 5.4k, curvy max 1.8k) |
| Build time | ≤ 4 ms median (browser) | Node p50 2.8 ms · p95 5.1 ms |
| Textures | 64×64, shared per pattern+palette key | cached (ref-counted) |
| Shader patterns | No textures; one program per kind (8 kinds max); no extra triangles or draw calls | Full grids with a pattern on every role stay at 60 fps (RTX 3070, `scripts/pattern-board.mjs --perf`) |

Measure with `npm run metrics` (chair only until the registry exists).

## Do / don't

- Do put all randomness in `generateParams`; `build` is a pure function of params.
- Do keep group order and only read earlier groups.
- Do return parts in item space and let the app merge.
- Don't use `Math.random`, `Date`, or the DOM in params/build.
- Don't add per-item lights.
- Don't edit `src/core/**` or `src/furniture/registry.js` unless you are the architect — request a helper instead.
- Don't write code comments (project preference).
