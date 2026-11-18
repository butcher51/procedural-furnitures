---
name: furniture-kit
description: Reference for building procedural furniture in this repo — coordinate conventions, the FurnitureDefinition contract, seeds and re-roll groups, the catalogue of geometry/support helpers, material roles, per-item budgets, and do/don't rules. Load before writing or reviewing any generator, spec or core helper.
---

# Furniture kit

Source of truth for architecture: `plan/02-architecture.md`. This skill is the condensed working reference; keep it in sync when `src/core` changes (the architect owns that).

## Where things live

| Path | Contents |
|---|---|
| `src/core/rng.js` | `hashString`, `mulberry32`, `createRng`, `createGroupedRng`, `weightedPick`, `weightedShuffle`, `rollStyle` |
| `src/core/color.js` | `hsl`, `WOOD_TONES` (chair, frozen), `WOODS`, `STONE_TONES`, `FRAME_COLORS`, `pickWood` |
| `src/core/palette.js` | `oklch`, `chromaLimit`, `CHROMA_LIMITS`, `colourIsCalm`, `capSaturation`, `muted`, `LIGHTNESS_BOUNDS`, `fabricColor`, `FABRIC_MOODS`, `fabricHue`, `paintColor`, `PAINTS`, `accentColor`, `harmoniousSecondary`, `HARMONY_MODES`, `shade`, `swatch`, `hexToHsl` |
| `src/core/geometry.js` | `edgeRadius`, `puffy`, `strut`, `tube`, `roundedDiscGeometry`, `extrudeUp`, `superellipseShape`, `bendZ`, `bentBandGeometry`, `normalizeUVs`, `beam`, `extrudeProfile`, `endPanelShape`, `latheSolid`, `boxProjectUVs` |
| `src/core/layout.js` | `splitSpan` |
| `src/core/supports.js` | `legAnchors`, `rowAnchors`, `buildLegs`, `legLines`, `pointOnLeg`, `LEG_PROFILES`, `bentwoodFoot`, `buildCurvyLegs`, `buildStretchers`, `buildApron`, `buildPedestal`, `buildTrestle` |
| `src/core/materials.js` | `createMaterials({ textureFactory })`, `canvasPatternTexture`, ref-counted pattern texture cache |
| `src/core/merge.js` | `groupParts`, `mergeByMaterial`, `disposeObject` |
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
| `rollStyle(g, styles)` | Style for a modern grouped rng (R1). Re-roll 0 = `weightedPick` on the `style/0` stream (identical to `g.roll('style', (r) => weightedPick(r, styles))`). Re-rolls 1…k−1 visit every other style once, in a weighted-shuffle order from stream `${seed}/style/order`; re-roll k returns the base; then it cycles. | Call it outside `g.roll`, modern mode only. Re-roll 1 is never the base style, so the style change rate is 100 %. |

## Helper catalogue

| Helper | Makes | Gotcha |
|---|---|---|
| `hsl(h, s, l)` (color) | sRGB hex string | Inputs 0–1. New types never call it with drawn s/l: use the `palette.js` pickers (see Colour). |
| `WOOD_TONES` (color) | `{ name, h, s, l }` × 6 | Chair only, frozen for its golden params. New types use `WOODS` via `pickWood`. |
| `WOODS` (color) | `{ name, h, s, l }` × 6, same names and order as `WOOD_TONES`, lower saturation, cherry/mahogany browner | Every tone ± 0.04 l passes `colourIsCalm`; keep wood lifts (`l ± 0.04`) inside that. |
| `pickWood(r)` (color) | `{ name, h, s, l }` from `WOODS` with h ± 0.01 and l ± 0.05 | Exactly 3 draws (pick, h, l). Draw it even when unused so the stream stays stable. |
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
| `buildTrestle({ length, depth, top, kind, inset, footLength, footHeight, beamWidth, postDepth = beamWidth, cleatHeight, cleatLength = 0.8·depth, stretcherHeight, stretcher = true, radius = 0.006 }, mat)` (supports) | Two `beam` frames at x = ±(length/2 − inset) (foot, posts, cleat) plus one long stretcher at z = 0 | `kind` `'I'`: one `beamWidth × postDepth` post. `'A'`: two slanted posts (±0.38·footLength → ±0.2·cleatLength) and a crossbar at `stretcherHeight`. `'X'`: crossed beams; the stretcher sits at the crossing and `stretcherHeight` is ignored. Slanted ends are pulled in so corners stay within y 0…`top`. 308–484 tris. |
| `bentwoodFoot(path, radius, sides, mat)` (supports) | Ferrule foot from y = 0 up past the open end of a tube leg | `path` is the tube curve (`mesh.geometry.parameters.path`); the end centre must sit `radius` above the floor. 4·sides triangles. |
| `buildCurvyLegs(p, mats, fp)` (supports) | Bentwood legs (sabre/cabriole/bow) on ferrule feet + optional ring | Needs `p.legCurve`, `p.hasRing`, `p.ringHeight`. Feet stand on y = 0 exactly. |
| `mergeByMaterial(root)` (merge) | One mesh per material | Disposes source geometries; converts indexed → non-indexed. |
| `disposeObject(root)` (merge) | Frees geometry, materials, maps | Call before dropping an item. |

## Materials

`kit.materials` (from `createMaterials`), all `MeshStandardMaterial` with `flatShading: true`:

- `surface({ color, secondary, pattern: 'solid'|'stripes'|'checker', scale, direction: 'horizontal'|'vertical', roughness = 0.8 })` — patterned via the texture factory; plain colour when the factory is absent (Node).
- `frame(color, finish)` — `finish === 'metal'` → roughness 0.35, metalness 0.6, else roughness 0.7.
- `solid(color, roughness = 0.9)` — upholstered bodies and anything plain.

Create a fresh material per item per role (merge groups by material identity). Pattern textures are cached and ref-counted; `disposeObject` releases them, so never call `texture.dispose()` yourself. Planned roles: `glass`, `emissive`.

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

Measure with `npm run metrics` (chair only until the registry exists).

## Do / don't

- Do put all randomness in `generateParams`; `build` is a pure function of params.
- Do keep group order and only read earlier groups.
- Do return parts in item space and let the app merge.
- Don't use `Math.random`, `Date`, or the DOM in params/build.
- Don't add per-item lights.
- Don't edit `src/core/**` or `src/furniture/registry.js` unless you are the architect — request a helper instead.
- Don't write code comments (project preference).
