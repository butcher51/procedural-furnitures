# Table visual review 1

Branch `wave1-integration` @ 065b731. Seed `review`, items 1–48 (`?type=table&seed=review&item=N`).
Images: `out/snapshots/table-review.png`, `table-review-overview.png`, `table-review-close.png` (items 1–8 at 640 px),
plus extra 440 px close-ups `table-review-z9.png` (9–24), `table-review-z25.png` (25–40), `table-review-z41.png` (41–48).
The page reported no errors. Params were cross-checked by calling `generateItem(def, "review", N)` from a scratch script.

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | Café pedestals, trestles, shelved side tables and low coffee tables are clear on sight. Dining tables read as a generic "slab on legs": none of the 8 dining aprons can be seen (#12, #17, #28, #34, #36, #41, #44, #47). |
| Proportions | 4 | Heights per style look right and side tables are properly tall and narrow. Some round tops on short legs look top-heavy, like a mushroom (#46, #30), and #39 is a very spindly plant-stand. |
| Construction | 4 | Everything stands on the floor. Shelves, stretchers and pedestal arms join cleanly, and no part floats. On the two A-trestles with squircle tops, a cleat corner shows under the bevelled rim (#2, #20). |
| Variety | 4 | All 5 styles appear, and so do every top shape, all 3 pedestal bases and all 3 trestle kinds. Trestles are thin on the ground in this sample (4 of 48), and the café tables repeat a lot: 3 of the 10 are travertine/black-marble round tops on a black cross. |
| Colour harmony | **2** | Wood, stone and black/metal combinations look good. But about 10 of the 21 painted items look neon or clash: magenta (#26, #19, #48, #25), vivid green (#12, #23, #15), saturated blue (#27, #30). The saturated blue and magenta problem noted earlier is still present. |
| Grid read | 4 | At overview distance the height classes and the pedestal and trestle silhouettes separate well. The magenta, blue and lime tops scattered through the grid make it noisy. |

Pass bar (every criterion ≥ 4, no blockers): **not met**. Colour harmony scores 2.

## Issues

| Item | Problem | Severity | Suspected parameter / code area |
|---|---|---|---|
| (all painted items) | Paint palette can produce neon colours. Saturation goes up to 0.65 at L 0.40–0.65 on any hue, and that is far too vivid for green, magenta and blue | **blocker** (explicitly ruled out) | `generatePalette` in `src/furniture/table/params.js` (`sat r.range(0.3, 0.65)`, `light r.range(0.4, 0.65)`, hue U(0,1)). This matches spec `palette.paint`, so the spec needs to change as well. Cap s at about 0.40 (about 0.30 for hue 0.25–0.45 and 0.75–0.95), or switch to a curated muted paint list |
| review #26 | Bar café with a hot-magenta top (`#d745d0`) | major | `palette.paint` saturation (see above) |
| review #19, #48 | Magenta painted base (pedestal cross `#b02dad`; X-trestle frame `#a82f93`). On #48 it sits on a mahogany top and clashes | major | `baseMode` painted → `palette.paint`. Consider no painted base on wood/stone tops, or a muted, darkened paint for bases |
| review #12 | Dining table with an electric-green top (`#41b32f`) on black turned legs | major | `palette.paint` saturation |
| review #23 | Acid-green legs (`#47d43b`) under a mahogany squircle coffee top: red/green clash | major | `baseMode` painted on a wood top; `palette.paint` saturation |
| review #25 | Hot-pink frame (`#d64ea7`) under a walnut top | major | same as #23 |
| review #27, #30 | Saturated blue: #27 painted top `#5b8ada`; #30 blue legs `#4193c8` under black marble | major | `palette.paint` saturation (blue hues) |
| review #15, #29, #39 | Emerald or lime painted tops (`#28b26a`, `#9bc156`, `#8bcb69`): loud | minor | `palette.paint` saturation (green hues) |
| review #11, #3 | Painted legs on wood tops: periwinkle `#7779b7` on walnut, grass green on honey. They look like a toy | minor | `baseMode` weights for wood tops (painted 0.20). Consider 0.10 with a muted paint |
| review #31 | Olive / bile-yellow squircle café top (`#9ea736`) | minor | `palette.paint` at yellow-green hues |
| review #12, #17, #28, #34, #36, #41, #44, #47 | Dining aprons are built (apronHeight 0.07–0.11 according to params) but never visible. The legs sit about 0.15–0.22 m in from the edge, so from the standard camera the apron hides under the overhang. Dining loses its key silhouette and blurs with coffee tables | major | `overhang` dining U(0.04, 0.14), plus the extra 1.2 × legThickness inset that `legAnchors` adds, used in `buildLegged` (`src/furniture/table/build.js`). Cap the dining overhang at about 0.08, or subtract the anchor inset so the total edge-to-leg distance stays at or below about 0.12 |
| review #46 | Round painted coffee top, diameter 0.94, on 3 short splayed cherry legs: the legs barely show under the top, and the table reads as a mushroom or pouf | major | round coffee: 3-leg `legCount` under a large round top with `topHeight` 0.42. Force 4 legs when the diameter is over 0.8, or use a smaller overhang for round tops |
| review #30 | Black-marble round coffee top, diameter 0.82, at 0.37 m: the thin blue legs almost vanish under the top | minor | same area: round coffee overhang plus legs placed on a square plan inside the circle; low `topHeight` |
| review #16, #24 | Legs on round dining/coffee tops sit well in from the rim (square plan inside the circle). They read, but look bunched | minor | `overhang` together with the `fp` exponent for round tops |
| review #2, #20 | A-trestle with a squircle top: a cleat corner pokes out under the bevelled rim at the table end (about 1 cm margin to the squircle outline at the inset) | minor | `buildTrestle` default `cleatLength` (0.8 × depth) against the squircle outline at `trestleInset`. Shorten the cleat for squircle tops (for example 0.7 × depth) or clamp it to the outline width at the frame x position minus beamWidth/2 |
| review #4, #5, #7, #13, #19, #29, #32, #40 | Round tops up to diameter 0.8 use 12 sides, and the polygon is clearly visible in close-ups. 16-sided tops (#16, #41, #46) are still faceted | minor | `topSides` (12 up to diameter 0.8, else 16). Consider 20 / 24 sides; it costs few triangles on a flat disc |
| review #39 | 0.39 m square side table at 0.56 m on thin black legs with a shelf: spindly | minor | side `legThickness` low end (0.025) with a small `topLength`; the height-at-least-topLength rule pushes very narrow tops tall |
| review #40 | Round shelf sits almost on the floor and reads like a base disc | minor | `shelfHeight` low end (0.06) on round 3-leg side tables |
| review #4, #5, #7 | Three round cafés in a row look nearly identical (round stone top, black cross or tripod) | minor | café `pedestalBase` / `baseMode` weights (black 0.45) and stone 0.40. Little variety within the café style |

No blockers were found in construction: every item stands on the floor, and nothing floats or passes through another part.

## Style coverage (48 items)

| Style | Count | Items | Notes |
|---|---|---|---|
| dining | 9 | 12, 16, 17, 28, 34, 36, 41, 44, 47 | rect 5, round 2, oval 1, squircle 1; turned 3, tapered 3, straight 2 |
| coffee | 13 | 8, 14, 18, 23, 24, 27, 30, 33, 35, 37, 38, 45, 46 | 4 with a shelf; round 5 |
| side | 12 | 1, 3, 6, 9, 11, 15, 21, 25, 29, 32, 39, 40 | 7 with a shelf; 3-leg and 4-leg both present |
| cafe | 10 | 4, 5, 7, 10, 13, 19, 26, 31, 42, 43 | bar height 2 (#10, #26); cross 6, cone 3, tripod 1 |
| trestle | 4 | 2, 20, 22, 48 | A 2, I 1, X 1 (below the expected 7 for weight 0.15) |

## Best three

1. **review #22**: walnut-plank trestle (I frames). It has a long, heavy top, clear overhang past the frames and a strong farmhouse silhouette.
2. **review #45**: walnut-plank coffee table with a matching planked lower shelf and splayed legs. Well proportioned, and the materials match.
3. **review #42**: oak-plank square café table on a metal cross base. Clean bistro read, and the colours are calm.

Runners-up: #47 (birch dining with H stretchers), #6 (white-marble side table on metal), #5 (travertine café).
