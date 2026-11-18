# Bench visual review 2

Branch `wave1-integration` @ 883c870. Seed `review` items 1–48 (same seed as round 1, same style assignment per item) plus
fresh seed `fresh2` items 1–48. No page errors in any run.

Images (`out/snapshots/`):
- `bench-r2.png`, `bench-r2-overview.png`: seed `review` sheet and grid
- `bench-r2-z{1,9,17,25,33,41}.png`: 560 px close-ups of all 48 `review` items
- `bench-r2-x29.png`, `bench-r2-x37.png`: 1000 px joinery check on garden seat/leg corners
- `bench-r2-fresh.png`, `bench-r2-fresh-overview.png`: seed `fresh2` sheet and grid
- `bench-r2-fresh-z{5,17,29,41}.png`: 560 px close-ups of `fresh2` items 5–12, 17–24, 29–36, 41–48

**Verdict: passes.** No blockers, no majors, every criterion is 4 or higher. The round-1 colour problems (neon upholstery,
the #28 checker) are gone, and scroll curls now read clearly. What's left is minor polish.

## Scores

| Criterion | R1 | R2 | Justification |
|---|---|---|---|
| Recognisable | 4 | 4 | Every item is a nameable bench style. The only weak reads are backed upholstered items on hidden feet (fresh2 #8, #21), which still look like small armless sofas. |
| Proportions | 4 | 4 | Lengths, heights and depths look right. The lower, thinner backs on #2/#35 help, but backed upholstered items on a tall plinth still look boxy. |
| Construction | 4 | 5 | No floating or intersecting parts in 96 items. Scroll feet and arms join the frame cleanly, backs sit on uprights, and garden leg posts are flush or just proud at the seat corners (checked at 1000 px). |
| Variety | 5 | 5 | All 5 styles and all support variants show up in both seeds: angular/scroll park, slats/rails garden, staked/slab/trestle plank, wood/black-leg platform, legs/sled upholstered with solid/stripes/checker. |
| Colour harmony | 2 | 4 | No neon left. Upholstery is muted (sage, dusty mauve, terracotta, teal, lavender), painted colours are calm (plum, slate blue, sage) and match frames are shaded for contrast. Minor leftovers: rose/green complement stripes on #24, a few ochre woods. |
| Grid read | 4 | 4 | Both overviews read as a calm, coherent field of benches with clear silhouettes. Stripes and checkers add pleasant accents, not noise. Slat grain is still sub-pixel. |

## Round-1 items re-checked

| Item (round 1) | Round-1 problem | Status | Notes |
|---|---|---|---|
| review #28 (blocker) | Neon green/magenta checker on purple, stretched checks | **fixed** | Now a mauve/plum analogous checker on a plum plinth. Checks are square on top and on the front edge. |
| review #11 | Lime / chartreuse | **fixed** | Terracotta cushion on a tan sled. |
| review #2, #35 | Kelly green, looks like plastic | **fixed** | Muted sage/olive. |
| review #1, #24 | Hot magenta | #1 **fixed**, #24 **improved** | #1 is dusty mauve on a grey sled. #24 is dusty rose with sage-green stripes: no longer neon, but the complementary pair is still the loudest item on the sheet (minor). |
| review #2, #7, #27, #35 | Backed upholstered reads as armless sofa | **improved** | #7 and #27 are now backless (seat under 1.2 m). #2 and #35 have lower, thinner backs and read more like banquettes. Fresh2 #8 and #21 still read as sofas (see new issues). |
| review #6, #13, #17, #25, #34, #39 | Wood looks like orange plastic | **improved** | Oak/pine are now tan and honey. Ochre/mustard still shows on review #15 and #21 and fresh2 #41 (minor). |
| review #3, #8, #32, #33, #36 | Red woods read as red paint | **fixed** | Cherry/mahogany are now brown-red. Platform slats (#8, #32, #36) read as stained wood. |
| review #37 | Saturated ultramarine paint | **fixed** | Muted plum. |
| review #43 | Match frame same colour as painted slats | **fixed** | Slate-blue slats on a dark navy frame. Park reads at once. |
| review #20, #34 | Scroll frames show no curl | **fixed** | Close-ups show clear spiral curls at front and back feet (#20 dark green, #34 navy). #26 and #39 also curl, and #26's scroll arms curl at the front. Fresh2 #7, #9, #11, #18, #27, #30, #43 all curl too. |
| all slatted items | Wood grain invisible on slats | **still an issue** (minor) | Slats on park/garden/platform still show no grain at 560 px. Plank slabs now show broad "planks" bands (#4, #44, fresh2 #46). |
| review #24, #7 | Stripe smear on rounded front edge | **fixed** | With `boxProjectUVs` the stripes run straight over the front roll and wrap the ends without stretching (#7, #24, fresh2 #31, #44). The checker on #28 and fresh2 #36/#45 is clean too. |

## New issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| fresh2 #8, #21 | Upholstered with back on a deep plinth with near-invisible feet reads as an armless sofa/loveseat, not a bench. | minor | Backed variant allows the tall plinth plus short legs. Upholstered `legHeight` / plinth height for `back != none` in `src/furniture/bench/params.js`; give backed items visible legs or a thinner seat block. |
| review #24 | Dusty rose + sage stripes: the complement is muted but still candy-like at grid distance. | minor | Fabric secondary colour picker in `src/core/palette.js` still allows a complement mode; prefer analogous/tonal secondaries for stripes. |
| review #4, fresh2 #46 | "Planks" grain on plank slabs is 2–3 broad high-contrast bands, which looks like glued laminate strips rather than grain. | minor | `grainScale` 3–6 bands per UV tile with a `seatSecondary` that is too far from `seatColor`; lower the contrast or raise the band count. |
| review #15, #21, fresh2 #41 | Ochre/mustard wood still looks a little painted. | minor | Yellow-hue entries of the wood tones in `src/core/palette.js`; trim saturation by about 0.05–0.1. |
| fresh2 #6, review #41, #45 | White frame with cream/white slats loses slat-vs-frame contrast. Fine for garden, flat for park (fresh2 #6). | nit | `frameMode` white with light woods; shade the frame like `match` does. |

No floating parts, poke-through or ungrounded legs found in either seed.

## Style coverage (seed `review`)

Same split as round 1: park 8 (scroll ×4: 20, 26, 34, 39; angular ×4: 6, 12, 18, 43), garden 10, plank 13, platform 7,
upholstered 10 (backed: 2, 35). Fresh2 has a similar mix with more scroll park (7, 9, 11, 18, 27, 30, 43).

## Best three

1. **review #26**: park bench with grey cast-iron scroll ends, scroll arms and walnut slats. Classic.
2. **fresh2 #7**: park bench with black scroll frame and arms and mahogany slats. Curls are crisp at both feet and arms.
3. **review #47**: garden bench in cream wood with rails back, flat arms and H-stretcher. Balanced and calm.

Runners-up: review #43 (slate-blue park with navy frame), fresh2 #36 (blue gingham upholstered), fresh2 #42 (mahogany
garden with slats back), review #20 (dark-green scroll park).
