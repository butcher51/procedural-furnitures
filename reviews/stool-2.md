# Stool visual review 2

Branch `wave1-integration` @ 883c870. Seed `review`, items 1–48 (`?type=stool&seed=review&item=N`), plus seed `fresh2`
(items 1–48) for unbiased coverage.
Images (in `out/snapshots/`): `stool-r2.png`, `stool-r2-overview.png`, close-ups `stool-r2-z{1,9,17,25,33,41}.png`
(all 48 review items at 560 px), `stool-r2-fresh.png`, `stool-r2-fresh-overview.png`, `stool-r2-fresh-z{9,25}.png`.

Note: the palette refactor changed how the RNG stream is consumed, so several item numbers now show a different stool than
in round 1 (for example, review #29 is now an olive drum, and #27 is a grey drum). Each round-1 item is re-checked
at the same seed and item number. Where the item changed, the verdict also says whether the round-1 failure mode still
happens anywhere in the 96 items.

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | All six styles read on sight. The slabs now have cutouts or stretchers, and the plank direction is right. Uncushioned straight drums (review #43, fresh2 #13, #35) still look more like a bin or planter than a seat. |
| Proportions | 4 | Mostly believable. A few bars without a footrest are still spindly: long thin legs under a heavy top (review #10, #11, #31, #47). |
| Construction | 5 | No floating or poke-through found in 96 items. Drum feet are thick and dark (review #14) or wood (fresh2 #27), and they ground the body. Rings, rails and stretchers all land on legs or panels. |
| Variety | 5 | All six styles in both seeds. Drum profiles (straight, spool, barrel), bases (floor, plinth, feet), footrests (ring, double ring, box, H, pedestal ring, stretcher, none), seat shapes and patterns all vary. |
| Colour harmony | 4 | No neon is left. Cushions are dusty (mauve, slate teal, muted indigo, terracotta), and painted seats are deep or greige. Wood reads as wood. The remaining weak spots are minor: the olive-on-olive drum (#29) and the pie-wedge grain on some round wood seats. |
| Grid read | 4 | Both overviews are calm and the height classes separate clearly. Thin white or cream bar frames fade into the floor at distance (fresh2 overview). |

Pass bar (every criterion ≥ 4, no blockers): **met**.

## Round-1 items re-checked (seed `review`)

| Item | Round-1 problem | Now | Verdict |
|---|---|---|---|
| #37, #40 | Lime / acid diner cushions | #37 mauve, #40 slate teal. No lime or acid yellow in 96 items | fixed |
| #44, #48, #35 | Electric violet cushions, purple checker | #44 muted indigo, #48 dusty teal-blue, #35 sage/cream checker | fixed |
| #30 | Neon cyan band on dark teal | Plum cushion on a honey frame | fixed |
| #24 | Royal blue on a red cherry frame | Dusty purple on red-brown wood. Calmer, though the hues are still close | improved |
| #2, #9 | Hot magenta on honey wood | #2 terracotta/cream stripe, #9 ochre cushion | fixed |
| #21 | Yellow/black hazard stripes | Lavender/white stripe on a grey frame. No hazard stripes in 96 items | fixed |
| #32, #34, #47 | Bright grass-green painted seats | #32 greige, #34 deep bottle green (no longer loud), #47 charcoal | fixed |
| #3 | Whole frame in saturated violet-blue | Teal frame with a blue/teal checker. Muted, but still one colour family | improved |
| #12, #17, #24, #25, #31, #35 | Cherry reads as red paint | Red-brown with visible grain (#12) or plain brown (#25, #31). Reads as wood | fixed |
| #14 | Drum on thin white feet looks like it floats | Barrel drum on thick black feet, clearly grounded | fixed |
| #11, #31 | Spindly bar legs, no footrest | Legs thicker, but #11 (3 legs, black) and #31 (4 legs, no ring) still look like plant stands. #10 is the same | still an issue (minor) |
| #47 | Spindly cream legs under a thick seat | Charcoal top on cream legs with a ring. The legs still look thin against the top | still an issue (minor) |
| #41, #16 | Checker pinwheel and dark wedge on round cushions | #16 and #41 solid. #35 checker on a squircle cushion maps cleanly. No smear seen | fixed |
| #7, #13, #46 | Slab stripes across the short axis | Stripes run along the long axis, and the edges look clean | fixed |
| #13, #46 | Plain slab reads as a bench or side table | #13 has an arch and a stretcher, #46 a stretcher. They read as step stools, though wide slabs (fresh2 #31, #45) are still a little table-like | improved |
| #27 | Olive drum with mustard cushion, muddy | #27 is now grey. The same failure now shows at **#29** (olive body, olive-mustard cushion) | still an issue (minor, moved) |

No regressions found.

## New issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| fresh2 #19, #25, #30 (also review #23 at a lesser degree) | Round wood seats on milking and bar stools show pie-wedge or pinwheel shading, as if the grain runs radially. Reads as segmented, not as boards | minor | Wood grain or stripe pattern UVs on `roundedDiscGeometry` / the lathe seat top (radial UV mapping). Same root as the old cushion pinwheel, now on wood pans |
| review #43, fresh2 #13, #35 | Straight drum with no cushion and a body-coloured top: a featureless prism that reads as a bin or planter | minor | drum `hasCushion` 0.4 miss combined with `drumProfile: 'straight'`. Require a cushion (or a contrasting top or seam) for straight drums |
| review #29 | Olive body with olive-mustard cushion, muddy | minor | drum `bodyColor` derived from the cushion hue at yellow-green hues. Pick a contrasting or neutral body for that hue band |
| fresh2 #3, #7, #11, #30 | White or cream bar frames almost vanish against the cream floor at grid distance | minor | white frame finish in the palette. Consider a slightly darker off-white or limiting white to metal frames |
| fresh2 #27 | Spool drum on short wood feet: the flared base overhangs the feet, so they barely show | minor | drum `feet` anchor radius vs the spool bottom radius. Anchor nearer the body edge for the spool profile |

No blockers and no majors.

## Best three

1. **review #24**: red-brown wood bar stool, dusty purple cushion, double ring footrest. A classic silhouette with a calm palette.
2. **review #14**: dusty-blue barrel drum with a matching cushion on stout black feet. This was the round-1 major and is now one of the nicest items.
3. **review #2**: honey-wood counter stool with box rails and a terracotta/cream striped cushion. Good proportions, warm and harmonious.
