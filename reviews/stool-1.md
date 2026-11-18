# Stool visual review 1

Branch `wave1-integration` @ 065b731. Seed `review`, items 1–48 (`?type=stool&seed=review&item=N`).
Images: `out/snapshots/stool-review.png`, `stool-review-overview.png`, `stool-review-close.png` (items 1–8 at 640 px),
plus extra 560 px close-ups `stool-review-z{13,21,29,37,41,45}.png` (items 13–16, 21–24, 29–32, 37–48).

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | Bar, counter, diner, milking and drum are clear on sight. Some slabs (#13, #46) read as a small bench or side table more than a stool. |
| Proportions | 4 | Mostly believable. A few bar stools are spindly: thin, long legs under a heavy seat with no footrest (#11, #31, #47). |
| Construction | 4 | Legs reach the floor, rings and rails sit on the legs, cushions seat cleanly, no poke-through seen. One exception: the drum on short white feet (#14) looks like it is hovering. |
| Variety | 5 | All six styles appear. Within each style, seat shape, footrest kind (ring, double ring, box, H, none), drum profile (straight, spool, barrel) and base (floor, plinth, feet) vary visibly. |
| Colour harmony | 3 | Wood and metal frames are pleasant, but several cushions are lime, electric violet or cyan and look neon (#37, #40, #44, #48, #30). Painted green seats are loud (#32, #34, #47). Cherry wood reads as red paint. |
| Grid read | 4 | Height classes and the drum, slab and diner silhouettes separate well at overview distance. The saturated lime and purple cushions make the grid look busy. |

Pass bar (every criterion ≥ 4, no blockers): **not met**, because colour harmony scores 3.

## Issues

| Item | Problem | Severity | Suspected parameter / code area |
|---|---|---|---|
| review #37, #40 | Lime / acid-yellow diner cushions look neon | major | palette `cushionColor`: `sat U(0.35, 0.75)` over a uniform hue (`params.js` palette roll). Cap the saturation by hue (greens/yellows ≤ ~0.45) or lower the max to ~0.55 |
| review #44, #48, #35 | Electric violet cushions (#35 is a purple checker) | major | Same as above (high sat at violet hues) |
| review #30 | Neon cyan cushion band around a dark-teal top | major | `cushionColor` saturation, plus `cushionSecondary` 'dark' stripe pattern making the contrast stronger |
| review #24 | Saturated royal-blue cushion on a red (cherry) frame clashes | minor | `cushionColor` saturation; no harmony check between the cushion hue and the wood tone |
| review #2, #9 | Hot magenta cushion on honey wood | minor | `cushionColor` saturation |
| review #21 | Yellow / near-black stripes look like hazard tape | minor | `secondaryColor('dark')` with a high-sat yellow cushion; consider skipping 'dark' stripes for yellow hues |
| review #32, #34, #47 | Painted seat in bright grass green (slab, counter, bar) | minor | `accentColor = hsl(hue, 0.4, U(0.30, 0.55))`: at green hues with l ≈ 0.5, sat 0.4 still renders loud. Lower to ~0.3 or reduce light for greens |
| review #3 | Whole frame and pan in saturated violet-blue ("match") with a blue checker cushion: one very loud item | minor | `frameMode: 'match'` → `accentColor`; same saturation note |
| review #12, #17, #24, #25, #31, #35 | Cherry wood reads as red paint, not wood | minor | `WOOD_TONES` cherry `{h 0.03, s 0.5, l 0.4}` in `src/core/color.js` (shared). Lower the saturation to ~0.35 |
| review #14 | Barrel drum on feet: the feet are thin, short, white and set far in under the body, so the drum looks like it floats | major | drum `drumBase: 'feet'`: feet anchor radius (body bottom × 0.8) and `legThickness` for feet; the white `frameMode` makes the feet vanish against the floor |
| review #11, #31 | Bar stool with very thin, long legs and no footrest looks like a plant stand and tippy (#11 has 3 legs) | minor | bar `legThickness U(0.025, 0.045)` at the low end combined with `footrestKind: 'none'`. Raise the min thickness for 3-leg bars or forbid 'none' for them |
| review #47 | Cream legs are spindly under a thick green square seat | minor | bar `legThickness` low end plus `seatThickness` high end |
| review #41, #16 | Checker on a round cushion becomes a pinwheel. On #41 a big dark wedge smears over the cushion side | minor | pattern UVs on `roundedDiscGeometry` / lathe cushion (checker mapped radially) |
| review #7, #13, #46 | Slab plank stripes run across the short axis, so the "boards" are crosswise and the rounded edge looks notched | minor | slab `panPattern: 'stripes'` direction / UV orientation on the `puffy` plank |
| review #13, #46 | Plain slab (no cutout, no stretcher) reads as a small bench or side table | minor | slab `slabCutout: 'none'` plus `footrestKind: 'none'`; consider requiring a cutout or stretcher |
| review #27 | Olive drum with a mustard cushion looks muddy | minor | `bodyColor = hsl(hue, sat*0.85, light-0.12)` at yellow hues |

No blockers.

## Style coverage (48 items)

| Style | Count | Items |
|---|---|---|
| bar | 11 | 8, 10, 11, 22, 24, 25, 31, 33, 35, 47, 48 |
| counter | 10 | 2, 3, 4, 9, 12, 17, 21, 30, 34, 42 |
| slab | 8 | 6, 7, 13, 26, 28, 32, 36, 46 |
| milking | 7 | 1, 5, 15, 20, 23, 38, 45 |
| drum | 7 | 14 (barrel, feet), 19 (barrel), 27, 29, 39, 41 (spool), 43 |
| diner | 5 | 16, 18, 37, 40, 44 |

Style is inferred from the silhouette. #8 and #47 (square seat with a ring) could be counter with ring rather than bar.
Every spec style appears. Footrest kinds seen: ring, double ring (#24, #25, #33), box/perimeter, H (#4), pedestal ring,
slab stretcher, and none. Slab is over-represented (8 vs an expected ~5), which is within the spread for 48 seeds.

## Best three

1. **review #22**: honey-wood bar stool, octagonal seat, ring footrest. A classic silhouette with good proportions.
2. **review #23**: walnut milking stool with plank stripes, a chunky seat and well-splayed legs.
3. **review #29**: dusty-rose drum with a matching cushion on a light wood plinth. Calm colour, clean construction.
