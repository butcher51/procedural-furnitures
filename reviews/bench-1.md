# Bench visual review 1

Branch `wave1-integration` @ 065b731. Seed `review`, items 1–48 (`?type=bench&seed=review&item=N`).
Images: `out/snapshots/bench-review.png`, `bench-review-overview.png`, close-ups `bench-review-close.png` (1–8) and
`bench-review-close-{9,17,25,33,41}.png` (640 px, all 48 items seen at close-up size). No page errors.

**Verdict: does not pass.** One blocker and several majors, all in colour harmony (upholstery palette). Geometry is in good shape.

## Scores

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | Every item reads as a bench and the style is nameable without labels; the 4 backed upholstered items (#2, #7, #27, #35) read as armless loveseats/sofas. |
| Proportions | 4 | Heights, depths and lengths look right per style; backed upholstered items look short and tall (sofa-like), park/garden backs are well proportioned. |
| Construction | 4 | No floating parts, all feet on the floor, slats sit on frames/rails, backs meet uprights; no poke-through seen. Only nits (overhangs, monochrome park). |
| Variety | 5 | All 5 styles and all support variants present; 48 items don't feel repetitive (legs vs frames vs slab vs trestle vs sled, arms, back types). |
| Colour harmony | 2 | Wood/iron/painted combos are pleasant, but upholstery fabric is often neon (lime, kelly green, hot magenta) and #28 is a green/magenta checker on purple. Wood tones skew saturated orange. |
| Grid read | 4 | At overview distance backs, frames, stripes and soft blocks are all distinct in silhouette; the neon upholstered blocks are what makes the scene look noisy. |

## Issues

| Item | Problem | Severity | Suspected parameter / code area |
|---|---|---|---|
| review #28 | Checker of saturated green and magenta on a purple plinth: neon, clashing complement. Checks also render as stretched rectangles, not squares. | blocker | `palette`: `sat` U(0.35, 0.75) + `secondaryColor(mode = complement)` in `src/furniture/bench/params.js` ~L241–268; checker UV aspect on `puffy` cushion (`patternScale` applied equally to u/v on a long cushion) |
| review #11 | Lime / chartreuse cushion and plinth, reads neon. | major | `fabricColor` s up to 0.75 at l 0.42–0.62; yellow-green hues (~0.2–0.4) need lower s cap |
| review #2, #35 | Bright kelly green upholstery, looks like plastic. | major | same: `sat` range; consider s ≤ 0.5 for upholstery or hue-dependent cap |
| review #1, #24 | Hot magenta / pink upholstery (#24 also dark-purple stripes). | major | same `sat` / `light` range; `bodyColor = hsl(hue, sat·0.85, light−0.12)` keeps the plinth saturated too |
| review #2, #7, #27, #35 | Upholstered with back reads as an armless sofa/loveseat: back cushion is full width and tall, short seat length. | minor | `backHeight` Up 0.20–0.35 + `backThickness` 0.08–0.14 + `seatLength` Up 0.90–1.50; a thinner, lower back or longer min length would separate it from sofa |
| review #6, #13, #17, #25, #34, #39 | "Wood" seats look like saturated orange plastic; pine/oak tones too orange. | minor | `WOOD_TONES` s, plus `seatColor = woodL + 0.04` lift; maybe reduce wood s by ~0.1 |
| review #3, #8, #32, #33, #36 | Red-wood tones (cherry/mahogany) read as red paint on plank/platform, where seat is always wood. | minor | `WOOD_TONES` red entries' saturation |
| review #37 | Garden painted in saturated ultramarine, heavy at grid distance. | minor | `paintColor` s 0.35–0.55 is fine on paper but blue hues read much more saturated; hue-dependent cap |
| review #43 | Park bench with painted olive slats and `match` olive frame: one colour, loses the slat-vs-frame contrast that identifies park. | minor | `frameMode = match` uses the same hue as `paintColor`; avoid `match` when `seatMaterial = painted` |
| review #20, #34 | `scroll` frames show curved legs but no visible curl at feet or arms; only #26 reads as a cast-iron scroll end. | minor | `strokeShape` scroll path / curl radius in `src/furniture/bench/` (park frame) |
| all slatted items (park, garden, platform) | Wood grain `stripes` (50 % of items) is not visible on any slat; only plank slabs show grain (#4, #9, #44, along x, correct). Code check: one shared surface material with `direction: 'horizontal'` and `scale` 3–6 bands per UV tile, so on a `beam` (u along the bar) the bands do run along the slat but are 3–6 across a 3–6 cm slat, i.e. sub-pixel. Direction is right; the grain is just invisible on slats. | minor | `build()` in `src/furniture/bench/index.js` L89–95 (`patternScale` applied per beam UV); `grainScale` 3–6 |
| review #24, #7 | Fabric stripes direction OK (#7 along x, #24 across); #24's stripes smear on the rounded front edge. | minor | `puffy` UVs on the rounded edge |

No floating or intersecting parts found on any of the 48 items. Slats along x for park/garden and crosswise for platform, as specced.

## Style coverage (48 items)

| Style | Count | Items | Variants seen |
|---|---|---|---|
| park | 8 | 6, 12, 18, 20, 26, 34, 39, 43 | angular ×5 (6, 12, 18, 39, 43), scroll ×3 (20, 26, 34); arms 4/8 (6, 18, 26, 43) |
| garden | 10 | 10, 15, 16, 29, 37, 41, 42, 45, 47, 48 | slats back ×6, rails back ×4 (10, 45, 47, 48); arms 6/10; painted ×6 (15, 16, 37, 41, 45, 48); H-stretcher (29, 47, 48); 6 legs (48) |
| plank | 13 | 3, 4, 5, 9, 13, 17, 19, 21, 25, 31, 33, 38, 44 | staked ×8 (6-leg: 21, 31), slab ×3 (17 v, 25 none, 38 arch), trestle ×2 (9, 19) |
| platform | 7 | 8, 14, 23, 30, 32, 36, 46 | 4 and 6 legs; black and wood legs |
| upholstered | 10 | 1, 2, 7, 11, 22, 24, 27, 28, 35, 40 | legs ×7, sled ×3 (1, 11, 27); back 4/10 (2, 7, 27, 35); solid, stripes (7, 24), checker (28) |

Mix is close to the 0.24 / 0.18 / 0.22 / 0.14 / 0.22 weights.

## Best three

1. **review #26**: park bench, scroll grey cast-iron ends with arms, brown slats. Reads as a park bench instantly.
2. **review #47**: garden bench, cream wood, rails back, flat arms, H-stretcher. Clean, balanced proportions.
3. **review #23**: platform bench, dark wood slats on black legs. Textbook Nelson stripes-on-sticks.

Runners-up: #29 (garden, slats back), #9 (plank trestle with grain), #15 (painted olive garden).
