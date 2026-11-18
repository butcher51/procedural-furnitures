# Table visual review 2

Branch `wave1-integration` @ 883c870. Seed `review`, items 1–48, plus a fresh seed `fresh2`, items 1–48.
Images (all in `out/snapshots/`): `table-r2.png`, `table-r2-overview.png`, close-ups at 560 px `table-r2-z1/z9/z17/z25/z33/z41.png` (all 48 review items),
`table-r2-fresh.png`, `table-r2-fresh-overview.png`, and fresh close-ups `table-r2-fresh-z1/z17/z25/z41.png`.
None of the snapshot runs reported page errors. Params were cross-checked by calling `generateItem(def, seed, N)` from a scratch script.
The style and shape rolls for seed `review` match round 1, so the item numbers below refer to the same tables.

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score (r1 → r2) | Justification |
|---|---|---|
| Recognisable | 4 → 4 | Rectangular dining tables now show their apron (#12, #28, #34). Oval and squircle dining tops still hide it (#17, #44), so those read as big coffee tables. Round coffee tables with a full-size shelf look like drums (#18, fresh2 #32). |
| Proportions | 4 → 4 | Big round coffee tables now stand on 4 legs near the rim (#46, #24). Side tables are sturdier (#39). Thick (5–6 cm) round coffee tops on short legs still look squat (#30, fresh2 #23), and fresh2 #6 has stubby elephant legs. |
| Construction | 4 → 5 | Every item stands on the floor and nothing floats. Trestle cleats now stay inside the squircle rim (#2, #20, fresh2 #10/#37). Shelves and stretchers join cleanly. |
| Variety | 4 → 4 | All 5 styles, all 3 trestle kinds and all 3 pedestal bases appear. Seed fresh2 has 7 trestles. Cafés #5 and #7 are still near-twins (travertine round top on a black cross). |
| Colour harmony | 2 → 4 | No neon is left. The paints are muted (sage, slate blue, teal, terracotta, dusty rose, aubergine), and painted bases under wood tops are now rare. One complement pairing reads as a toy: fresh2 #29, a teal top on a dusty-pink trestle. |
| Grid read | 4 → 5 | The overview is calm, mostly wood tones with a few muted accents. Height classes and pedestal/trestle silhouettes separate clearly at grid distance. |

Pass bar (every criterion ≥ 4, no blockers): **met (PASS)**.

## Round 1 items re-checked

| Item (round 1) | Round 1 problem | Status | Notes |
|---|---|---|---|
| all painted items | Neon paint palette (**blocker**) | **fixed** | `core/palette.js` caps saturation. No saturated magenta, lime or electric blue appears in either seed. |
| #26 | Hot-magenta bar café top | fixed | Greige top on a black cone base. |
| #19, #48 | Magenta painted base | fixed | #19: beige cross under a grey top. #48: mahogany X-trestle in matching wood. |
| #12 | Electric-green dining top | fixed | Honey wood with turned legs, and the apron is visible. |
| #23 | Acid-green legs under mahogany | fixed | Mahogany legs in matching wood. |
| #25 | Hot-pink frame under walnut | fixed | All walnut with box stretchers. |
| #27, #30 | Saturated blue | fixed | #27: muted terracotta top on white legs. #30: black top on maroon legs. |
| #15, #29, #39 | Emerald or lime tops | fixed | Muted teal, slate blue and slate blue. |
| #11, #3 | Toy-like painted legs on wood | fixed | All one wood now. |
| #31 | Bile-olive café top | fixed | Deep green on a grey cross. |
| #12, #17, #28, #34, #36, #41, #44, #47 | Dining apron never visible (major) | **improved** | Rect: #12, #28 and #34 clearly show the apron, #36 and #47 faintly. Oval #17 (apron 0.07) and squircle #44 (apron 0.072) still hide it under the curved overhang. #16 and #41 are round with apronHeight 0, so there is nothing to show. Now minor. |
| #46 | Round coffee table reads as a mushroom (major) | **fixed** | 4 legs, overhang 0.022, legs visible close to the rim. Still a little squat because of the 4.7 cm top. |
| #30 | Legs vanish under a round black top | improved / still minor | The legs now sit at the rim, but the 6 cm top on 0.37 m legs still reads as a pouf. |
| #16, #24 | Legs bunched inside round tops | fixed | The legs sit close to the rim. |
| #2, #20 | Cleat corner poking under the squircle rim | fixed | The cleats stay inside the rim in both close-ups. |
| #4, #5, #7, #13, #19, #29, #32, #40 (+16-gon tops) | Faceted round tops | fixed | 24 sides on big tops, at least 18 on small ones. A faint facet still shows on the bevel at 560 px (#4, fresh2 #23, #28), but it is fine at grid size. |
| #39 | Spindly plant stand | fixed | Thick black legs, and the shelf sits at about 1/3 height. |
| #40 | Round shelf almost on the floor | fixed | The shelf is now at about 1/4 of the height. |
| #4, #5, #7 | Café near-duplicates | still an issue (minor) | #5 and #7 are still the same travertine-round-on-black-cross table. #4 differs (black top, tripod). |

No regressions found.

## New issues

| Item | Problem | Severity | Suspected parameter / code area |
|---|---|---|---|
| fresh2 #29 | Teal painted top on a dusty-pink I-trestle. The complement pairing reads as a toy. | minor | `baseMode` `accent` on a painted top, combined with `accentColor` `complement` mode (`src/core/palette.js:175`). For furniture bases, drop `complement` or limit accent to `analogous` / `tonal`. |
| review #18, #37; fresh2 #19, #30, #32, #45 | Round or oval coffee table where the shelf disc is almost as large as the top and extends past the legs, so it reads as a drum or pouf. The legs pierce the shelf near its rim. | minor | Shelf outline on curved coffee tops. It looks like it is scaled from the top outline, not from the leg footprint. Size it to the leg rectangle plus about 2 cm. |
| review #30, fresh2 #23 | Round coffee table with a 5.5–6 cm top on short legs looks squat | minor | `topThickness` upper range for coffee tables (0.06). Cap it at about 0.045 for round coffee tops, or scale it with diameter. |
| fresh2 #6 | Oval coffee table on very thick, short cylindrical legs (legThickness 0.059 at height 0.41). The legs look stubby. | minor | Coffee `legThickness` upper end combined with a turned or cylinder profile. Cap it at about 0.05 for coffee tables. |
| review #17, #44 | Oval or squircle dining table with a hidden apron (the rest of the round 1 major) | minor | `legAnchors` on curved outlines places the legs on the inscribed rectangle. Add a smaller inset for oval/squircle tops, or a ring apron that follows the outline. |
| review #8, #37, #44; fresh2 #30, #44, #45 | White legs under dark or black tops. They look fine individually, but appear often. | minor (taste) | `baseModeWeights` gives white 0.10–0.17. Optional: weight white toward light tops. |

Blockers: none. Majors: none.

## Style coverage

| Seed | dining | coffee | side | cafe | trestle |
|---|---|---|---|---|---|
| review | 9 | 13 | 12 | 10 | 4 |
| fresh2 | 12 | 14 | 11 | 4 | 7 (A, I and X all present) |

## Best three

1. **review #12**: honey-oak dining table with turned legs, a visible apron and an H stretcher. It is the classic farmhouse dining read, and the materials match.
2. **review #45**: walnut-plank coffee table with a matching planked lower shelf. Good proportions and calm colour.
3. **fresh2 #25**: oak-plank X-trestle. Strong crossed silhouette, clear overhang past the frames, all in matching wood.

Runners-up: review #34 (birch dining with H stretchers), review #22 (T-foot plank trestle), review #48 (mahogany X-trestle), review #6 (white marble side table on metal legs).
