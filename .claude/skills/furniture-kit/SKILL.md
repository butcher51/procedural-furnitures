---
name: furniture-kit
description: Reference for building procedural furniture in this repo — coordinate conventions, the FurnitureDefinition contract, seeds and re-roll groups, the catalogue of geometry/support helpers, material roles, per-item budgets, and do/don't rules. Load before writing or reviewing any generator, spec or core helper.
---

# Furniture kit

Source of truth for architecture: `plan/02-architecture.md`. This skill is the condensed working reference; keep it in sync when `src/core` changes (the architect owns that).

## Where things live

| Path | Contents |
|---|---|
| `src/core/rng.js` | `hashString`, `mulberry32`, `createRng`, `createGroupedRng` |
| `src/core/color.js` | `hsl`, `WOOD_TONES` |
| `src/core/geometry.js` | `edgeRadius`, `puffy`, `strut`, `tube`, `roundedDiscGeometry`, `extrudeUp`, `superellipseShape`, `bendZ`, `bentBandGeometry`, `normalizeUVs` |
| `src/core/supports.js` | `legAnchors`, `buildLegs`, `LEG_PROFILES`, `bentwoodFoot`, `buildCurvyLegs` |
| `src/core/materials.js` | `createMaterials({ textureFactory })`, `canvasPatternTexture`, ref-counted pattern texture cache |
| `src/core/merge.js` | `groupParts`, `mergeByMaterial`, `disposeObject` |
| `src/core/item.js` | `itemSeed`, `generateItem(def, sceneSeed, n, rerolls, dna)`, `buildItem(def, params, kit)`, `rerollableGroups`, `fixedGroups` |
| `src/core/kit.js` | `createKit({ textureFactory })` → `{ materials }` |
| `src/furniture/registry.js` | `register`, `get`, `has`, `list`; one import + `register()` line per type |
| `src/furniture/chair/` | Reference plugin: `index.js` (definition), `params.js`, `build.js` |

Generators import geometry/support helpers directly from `src/core/*`; `kit` carries what depends on the runtime (materials bound to a texture factory).

## Conventions

- Units are **meters**. Use real-world, ergonomic ranges (see the spec for the type).
- **y is up.** Items stand on **y = 0**, the **front faces +z**, items are **centred on x/z**.
- Back rests pivot on the rear edge of the seat (`pivot.rotation.x = -deg(backAngle)` tilts backwards).
- Low-poly, flat-shaded, soft bevels: 3 bevel segments on boxes (2 on thin repeated bars such as slats and rails), 4–12 sides on cylinders.

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
    { id: 'shape', label: 'Shape', fields: ['topShape', 'height'] },
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
| `styles` | Style id → roll weight. Tests check the observed distribution (±4 pp over 2,000 seeds). |
| `cell` | Grid spacing (m) and grid size. Item x/z extent must be < `spacing − 0.1`. |
| `groups` | Groups in roll order. `fields`: the params the group owns (re-roll tests check isolation with it). `reads`: earlier groups whose results it uses. `rerollable: false` hides the ⟳ button and ignores rerolls. A group may read earlier groups, never later ones. |
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

## Helper catalogue

| Helper | Makes | Gotcha |
|---|---|---|
| `hsl(h, s, l)` (color) | sRGB hex string | Inputs 0–1. Keep s ≤ 0.75 and l in 0.25–0.85 so palettes never go neon. |
| `WOOD_TONES` (color) | `{ name, h, s, l }` × 6 | Jitter h ±0.01 and l ±0.05 per item. |
| `edgeRadius(r, w, h, d)` (geometry) | Clamped bevel radius | Always use it; RoundedBoxGeometry breaks when r ≥ half the thinnest side. |
| `puffy(w, h, d, r, mat, segments = 3)` (geometry) | Rounded box mesh centred on origin | Radius is clamped via `edgeRadius`. Geometry is non-indexed. Cost is 12·(2·segments+1)² triangles: 588 at 3, 300 at 2. Pass `segments` 2 for thin repeated bars (slats, rails) to stay under 6k. |
| `roundedDiscGeometry(radius, h, edge, sides)` | Lathe disc with rounded rim, centred on y | `sides` 6–12 keeps it low poly. |
| `strut(bottom, top, rTop, rBottom, sides, mat)` | Cylinder between two Vector3s | Rotated with a 45° phase so 4-sided legs look square-on. |
| `tube(points, radius, sides, mat, closed, segments)` | Centripetal Catmull-Rom tube | Ends are open. A tube ending at the floor floats by `radius` unless you close it, e.g. with `bentwoodFoot`. |
| `extrudeUp(shape, height, bevel)` | Beveled slab from a plan outline, bottom at y = 0 | Shape is in (x, −z). UVs are in meters → `normalizeUVs`. |
| `superellipseShape(hx, hz, exponent, steps)` | Plan outline | exponent 2 = ellipse, 4 = squircle, 10 ≈ rectangle. |
| `bentBandGeometry(w, h, t, bend)` | Vertical band curved in plan | Ends come forward by `bend`. |
| `normalizeUVs(geo, size)` | Rescales meter UVs | Needed so patterns tile like on boxes. |
| `legAnchors(p, fp)` (supports) | Leg top (x, z) list for 1–n legs | Uses `p.legCount`, `p.legThickness`; `fp = { width, depth, round?, exponent? }`. |
| `buildLegs(p, mats, fp)` (supports) | Legs: pedestal (1), sled runners (2), splayed struts (3+) | `fp.top` = y the legs hold up. |
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
