# 02 — Architecture

## Principles

- **Buildless.** Native ES modules, three.js r170 via importmap, `node server.js`. The only dev dependencies are
  `three` (so tests can import the same modules in Node) and `@playwright/test` for screenshots.
- **Plugins, not branches.** Every furniture type is a self-contained module that registers itself. The
  app shell never says "chair".
- **Pure core.** `generateParams` and `build` run in Node without a DOM. Anything that touches
  `document` (canvas textures) goes behind an injectable factory.

## Folder layout

```
index.html
server.js
src/
  core/
    rng.js              hashString, mulberry32, createRng (moved verbatim from chair.js)
    color.js            hsl helper, palettes, WOOD_TONES
    materials.js        makeMaterials(palette, textureFactory), patternTexture
    patterns.js         item-space GLSL patterns (wood, dots, floral, …), grain attribute helpers
    geometry.js         edgeRadius, puffy, strut, tube, extrudeUp, superellipseShape,
                        roundedDiscGeometry, bentBandGeometry, normalizeUVs, lathe helpers
    supports.js         legAnchors, buildLegs, buildCurvyLegs, pedestal, runners, trestle
    fronts.js           drawers, doors, handles (wave 2)
    merge.js            mergeByMaterial, disposeObject
    dna.js              style DNA: shared palette/finish/roundness (wave 4)
  furniture/
    registry.js         register(), get(id), list()
    chair/
      index.js          the FurnitureDefinition
      params.js         classicShape, curvyShape, cozyShape, generateChairParams
      build.js          buildClassic, buildCurvy, buildCozy
    table/ ...
    stool/ ...
  app/
    main.js             boot, URL state
    scene.js            renderer, lights, ground, resize
    grid.js             layout per type (spacing from footprint), time-sliced build, pop reveal
    picking.js          raycast select, dblclick zoom
    panel.js            generic params panel driven by definition.describe()
    toolbar.js          type switcher, seed, regenerate
tests/
  unit/                 node --test
  visual/               Playwright
specs/                  one design spec per furniture type (written by the designer agent)
```

## The FurnitureDefinition contract

```js
export default {
  id: 'table',
  label: 'Table',
  styles: { dining: 0.35, coffee: 0.25, side: 0.15, cafe: 0.15, trestle: 0.1 },
  cell: { spacing: 2.6, gridSize: 15 },
  groups: [
    { id: 'style', label: 'Style' },
    { id: 'shape', label: 'Shape' },
    { id: 'palette', label: 'Colours' },
    { id: 'finish', label: 'Finish' },
  ],
  generateParams(g, dna) {},
  build(params, kit) {},
  describe(params) {},
};
```

| Member | Contract |
|---|---|
| `styles` | Style ids mapped to their roll weights. Tests check the observed distribution against these. |
| `cell` | Grid spacing in meters and grid size, so big items (beds) get fewer, wider cells. |
| `groups` | The re-rollable parameter groups, in the order they are rolled. Later groups may read earlier groups' results, but not the other way round. Each group lists the `fields` it owns and the earlier groups it `reads`. `rerollable: false` fixes a group (chair `style`). Optional `appliesTo(params) → boolean`: pure, never affects generation; when false the panel hides the group's ⟳ and the re-roll test skips its change rate for that seed (a re-roll must then change no field outside the group's own). `core/item.js` exposes `groupApplies(def, id, params)`, `canRoll(def, id, params)` and `shortcutGroups(def)`. |
| `generateParams(g, dna)` | Pure. Draws randomness only through `g.roll(groupId, fn)` (see below). Returns plain JSON-serialisable data that always includes `seed`, `type` and `style`. |
| `build(params, kit)` | Pure. Returns an array of `Object3D` parts in item space: y-up, standing on y = 0, front faces +z, centred on x/z. |
| `describe(params)` | Returns `{ sections: [{ group, rows: [[label, value]] }], swatches: [hex] }`. Rows are grouped so the panel can put a re-roll button on each section. |

`kit` bundles `core/*` and the materials made for these params. The app calls:

```js
const def = registry.get(type);
const g = createGroupedRng(itemSeed, rerolls, { legacy: type === 'chair' });
const params = def.generateParams(g, dna);
const object = mergeByMaterial(group(def.build(params, kit)));
```

## Re-roll groups

The user can re-roll one group of an item (e.g. only its colours) while everything else stays the same. Each
group's roll counter starts at 0, and rerolls are stored as `{ palette: 2, shape: 1 }`.

`core/rng.js` gains `createGroupedRng(itemSeed, rerolls, { legacy })`, which returns `g.roll(groupId, fn)`:

- **Modern mode (all new types):** `fn` gets its own stream, `createRng(`${itemSeed}/${groupId}/${rerolls[groupId] ?? 0}`)`.
  Groups are fully independent, so re-rolling one never shifts the randomness of another.
- **Legacy mode (chair only):** today's chair draws everything from one sequential stream. To keep old links identical,
  `fn` always runs once on the main stream, so it consumes exactly the draws it always did. If the group has a reroll
  count > 0, `fn` runs again on the group's own stream and that result is returned instead. With no rerolls the output
  is byte-identical to today. With a reroll, every other group is untouched.

The chair's groups are style → shape → palette → pattern → finish, which matches the existing draw order in
`generateParams`. The chair cannot re-roll `style` in legacy mode: a different style makes the shape step consume a
different number of draws, which would shift every later group. "Next item" covers that case.

Modern types roll their style with `rollStyle(g, styles)` (`core/rng.js`) and keep `style` rerollable. Re-roll 0 is a
weighted pick on the `style/0` stream. Re-rolls 1…k−1 step through every other style once, in a weighted-shuffle order
drawn from `${itemSeed}/style/order`, and re-roll k returns the base style. Palette and pattern streams do not read
style, so a style re-roll keeps the colourway.

Dependencies: a group may read results of earlier groups (e.g. `finish` reads `style` for the wood chance). Re-rolling an
earlier group can therefore change what a later group means, though never its random draws. For example, a chair whose
frame becomes wood may become all-wood. This is expected.

Re-rolled items are rebuilt in place: dispose the old object, build the new one, and replay the pop animation on that
single item. The rest of the grid is not regenerated.

## Seeds

- Item seed: `${seed}-${index}` for `type=chair`. The app currently numbers chairs from 1 (`${seed}-1` is the first chair),
  and that numbering must stay so old links keep working.
  Every other type uses `${seed}-${type}-${index}`.
- URL state: `?type=table&seed=abc` (`type` defaults to `chair`). Adding `&item=42` selects an item, and `&view=single`
  shows one item centred (used by screenshot tests).
- Rerolls in the URL: `&r=42.palette2.shape1~7.finish1`. Items are separated by `~`. Each item is its index followed by
  `group+count` pairs. Changing the seed or the type clears all rerolls.
- Style DNA (wave 4): `createRng(`${seed}-dna`)` → `dna`. Wave 1–3 generators accept `dna` but may ignore it.

## Refactor safety (P1)

1. Before touching anything, run the original `generateParams` for seeds `golden-1..200` and save the
   JSON to `tests/golden/chair-params.json`.
2. Move code into `core/` and `furniture/chair/` with no behaviour change.
3. Wrap the chair's existing draw sequence in legacy-mode `g.roll` groups.
4. The golden test must pass byte-for-byte with no rerolls. Also compare triangle counts per seed, which catches build drift.

## Performance budgets per item

| Metric | Budget |
|---|---|
| Draw calls (meshes after merge) | ≤ 4 (≤ 6 for items with emissive or glass) |
| Triangles | ≤ 6k (chairs today: measure and record in P0) |
| Build time | ≤ 4 ms median in a browser |
| Textures | 64×64 canvas, shared per pattern+palette key (add a cache, since today each item makes its own) |

## Open technical questions

- **Instancing vs merging** for the many identical small parts (books, slats). Start with merging; revisit if a
  shelf blows the triangle budget.
- **Canvas in Node tests.** Inject a `textureFactory` that returns `null` in tests, so materials fall back to
  `color`. That avoids pulling in the `canvas` npm package.
- **Shadows for large grids.** A 4096 shadow map over a wider area gets blurry. Consider fitting the shadow
  camera to the visible area, or baked contact shadows (blob decals) for wave 3+.
