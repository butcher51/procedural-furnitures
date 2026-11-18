---
name: furniture-kit
description: Reference for building procedural furniture in this repo — coordinate conventions, the FurnitureDefinition contract, seeds and re-roll groups, the catalogue of geometry/support helpers, material roles, per-item budgets, and do/don't rules. Load before writing or reviewing any generator, spec or core helper.
---

# Furniture kit

Source of truth for architecture: `plan/02-architecture.md`. This skill is the condensed working reference; keep it in sync when `src/core` changes (the architect owns that).

> **Status:** P0. The kit still lives in `chair.js` (baseline). P1 (backlog 1.2–1.4) moves it into `src/core/*` and `src/furniture/chair/`. Paths below give the target location; until P1 lands, find the function in `chair.js`.

## Conventions

- Units are **meters**. Use real-world, ergonomic ranges (see the spec for the type).
- **y is up.** Items stand on **y = 0**, the **front faces +z**, items are **centred on x/z**.
- Back rests pivot on the rear edge of the seat (`pivot.rotation.x = -deg(backAngle)` tilts backwards).
- Low-poly, flat-shaded, soft bevels: 3 bevel segments on boxes, 4–12 sides on cylinders.

## FurnitureDefinition contract

```js
export default {
  id: 'table',
  label: 'Table',
  styles: { dining: 0.35, coffee: 0.25, side: 0.15, cafe: 0.15, trestle: 0.1 },
  cell: { spacing: 2.6, gridSize: 15 },
  groups: [{ id: 'style', label: 'Style' }, { id: 'shape', label: 'Shape' }, { id: 'palette', label: 'Colours' }, { id: 'finish', label: 'Finish' }],
  generateParams(g, dna) {},
  build(params, kit) {},
  describe(params) {},
};
```

| Member | Contract |
|---|---|
| `styles` | Style id → roll weight. Tests check the observed distribution (±4 pp over 2,000 seeds). |
| `cell` | Grid spacing (m) and grid size. Item x/z extent must be < `spacing − 0.1`. |
| `groups` | Re-rollable groups in roll order. A group may read earlier groups' results, never later ones. |
| `generateParams(g, dna)` | Pure. All randomness via `g.roll(groupId, (r) => …)`. Returns JSON-serialisable data incl. `seed`, `type`, `style`. |
| `build(params, kit)` | Pure. Returns an array of `Object3D` parts in item space. No randomness. |
| `describe(params)` | `{ sections: [{ group, rows: [[label, value]] }], swatches: [hex] }`. |

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
| `puffy(w, h, d, r, mat)` (geometry) | Rounded box mesh centred on origin | Radius is clamped via `edgeRadius`. Geometry is non-indexed. |
| `roundedDiscGeometry(radius, h, edge, sides)` | Lathe disc with rounded rim, centred on y | `sides` 6–12 keeps it low poly. |
| `strut(bottom, top, rTop, rBottom, sides, mat)` | Cylinder between two Vector3s | Rotated with a 45° phase so 4-sided legs look square-on. |
| `tube(points, radius, sides, mat, closed, segments)` | Centripetal Catmull-Rom tube | Ends are open; rest the end centre `radius` above the floor. |
| `extrudeUp(shape, height, bevel)` | Beveled slab from a plan outline, bottom at y = 0 | Shape is in (x, −z). UVs are in meters → `normalizeUVs`. |
| `superellipseShape(hx, hz, exponent, steps)` | Plan outline | exponent 2 = ellipse, 4 = squircle, 10 ≈ rectangle. |
| `bentBandGeometry(w, h, t, bend)` | Vertical band curved in plan | Ends come forward by `bend`. |
| `normalizeUVs(geo, size)` | Rescales meter UVs | Needed so patterns tile like on boxes. |
| `legAnchors(p, fp)` (supports) | Leg top (x, z) list for 1–n legs | Uses `p.legCount`, `p.legThickness`; `fp = { width, depth, round?, exponent? }`. |
| `buildLegs(p, mats, fp)` (supports) | Legs: pedestal (1), sled runners (2), splayed struts (3+) | `fp.top` = y the legs hold up. |
| `buildCurvyLegs(p, mats, fp)` (supports) | Bentwood legs (sabre/cabriole/bow) + optional ring | Needs `p.legCurve`, `p.hasRing`, `p.ringHeight`. |
| `mergeByMaterial(root)` (merge) | One mesh per material | Disposes source geometries; converts indexed → non-indexed. |
| `disposeObject(root)` (merge) | Frees geometry, materials, maps | Call before dropping an item. |

## Materials

Roles: `surface` (upholstery/top, may carry a 64 px pattern), `frame` (legs/structure; metal finish → roughness 0.35, metalness 0.6), `body` (upholstered carcass). Planned: `metal`, `glass`, `emissive`. All `MeshStandardMaterial` with `flatShading: true`. Textures come through an injectable `textureFactory` (returns `null` in Node tests). Never mutate a material that might be shared.

## Budgets (per item)

| Metric | Budget | Chair baseline (P0, 500 seeds, Node) |
|---|---|---|
| Draw calls after merge | ≤ 4 (≤ 6 with emissive/glass) | max 3 |
| Triangles | ≤ 6k | p50 3.0k · p95 5.6k · max 7.1k (classic exceeds) |
| Build time | ≤ 4 ms median (browser) | Node p50 2.7 ms · p95 5.9 ms |
| Textures | 64×64, shared per pattern+palette key | not cached yet (backlog 1.7) |

Measure with `npm run metrics` (chair only until the registry exists).

## Do / don't

- Do put all randomness in `generateParams`; `build` is a pure function of params.
- Do keep group order and only read earlier groups.
- Do return parts in item space and let the app merge.
- Don't use `Math.random`, `Date`, or the DOM in params/build.
- Don't add per-item lights.
- Don't edit `src/core/**` or `src/furniture/registry.js` unless you are the architect — request a helper instead.
- Don't write code comments (project preference).
