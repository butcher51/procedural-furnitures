# Sofa spec

## Summary

A sofa is the chair's `cozy` armchair (`cozyShape` / `buildCozy`) stretched sideways. It has a padded body on short feet, arms on both ends, a back frame, and loose seat and back cushions on top. The fun part is the combinatorics. Arm style (track / roll / slope / none), cushion splitting (1–4 seat cushions, loose or tight back, throw pillows), leg language (block, bun, tapered, sled, plinth) and the overall plan (straight run, chaise longue, L sectional) multiply into many sofas that each read clearly. Seeds differ first in **silhouette**: width class, L versus straight, one raised end versus two arms, and legs versus plinth. Then they differ in **rhythm** (how many cushions, pillow accents) and finally in **colour**. Re-roll groups mirror that: shape, cushions, legs, palette, pattern, finish.

## Real-world references and dimensions

Sources are listed at the end of this section. Source values are in inches and converted here. The "Used" column is what the generator rolls. Where it differs from the sources, the reason is given in brackets.

| Dimension | Real range | Used | Source |
|---|---|---|---|
| 3-seater overall width | 1.83–2.44 m (72–96 in); 1.98–2.29 m (78–90 in) | 1.75–2.30 | [R&F], [Interior Insider] |
| Loveseat overall width | 1.47–1.63 m (58–64 in); 1.22–1.83 m (48–72 in) | 1.30–1.65 | [Homenish], [Wjs] |
| Overall depth | 0.76–0.91 m (30–36 in); 0.89–1.02 m (35–40 in) | 0.80–1.00 (mid-century 0.78–0.90) | [R&F], [Interior Insider] |
| Overall height (back top) | 0.76–0.91 m (30–36 in) | 0.72–0.92 | [Interior Insider], [Wjs] |
| Seat height | ≈ 0.46 m (18 in); 0.43–0.48 m (17–19 in) | 0.38–0.46 [low lounge sofas sit lower than the guides; vision doc says 0.38–0.45] | [Homenish], [Tribesigns] |
| Seat depth (usable) | 0.51–0.64 m (20–25 in) | ≥ 0.45 guaranteed, typically 0.50–0.62 | [Tribesigns], [Wayfair] |
| Arm height (from floor) | 0.61–0.81 m (24–32 in, avg 0.66) | seat + 0.16–0.28 → 0.54–0.74 | [Tribesigns] |
| L sectional long side | 2.39–3.05 m (94–120 in) | 2.20–2.55 [capped by the grid cell] | [Interior Insider] |
| L sectional short side / chaise run | 1.98–2.39 m (78–94 in); chaise 1.52–1.83 m (60–72 in) | 1.50–1.90 | [Interior Insider], [Wjs] |
| Chaise longue length × width | 1.52–1.83 m × 0.89–1.14 m (60–72 × 35–45 in) | 1.50–1.80 × 0.65–0.85 [narrower so it reads as a single-person lounger, not a daybed] | [Wjs] |
| Seat cushion thickness | not in sources; cozy chair uses 0.10–0.18 | 0.10–0.18 (mid-century 0.08–0.13) | `cozyShape` |
| Per-seat width | ≈ 0.55–0.65 m (3 seats in 1.8–2.0 m between arms) | cushion ≥ 0.45 m | derived from the widths above |

Arm-style vocabulary ([Suburban], [Houzz], [American Leather]):
- **Track:** straight, boxy, flat top.
- **Rolled:** padded, curls outward.
- **Slope:** continues down from the back at an angle.
- **Square / slim track:** sharp mid-century lines, often on Lawson / mid-century sofas.
- **Armless:** no arms.

Sources:
- [R&F] [Raymour & Flanigan, sofa size guide](https://www.raymourflanigan.com/blog/expertise/guides/sofa-size-guide)
- [Interior Insider] [Sofa dimensions guide](https://www.interiorinsider.com/articles/sofa-dimensions-guide)
- [Tribesigns] [Standard sofa size guide](https://tribesigns.com/blogs/furniture-knowledge/standard-sofa-size-guide)
- [Homenish] [Sofa dimensions, ultimate guide](https://homenish.com/?p=2716)
- [Wjs] [Sofa dimensions guide](https://wjshomestore.com/blogs/news/sofa-dimensions-guide)
- [Wayfair] [Sofa dimensions, choosing the right size](https://www.wayfair.ca/sca/ideas-and-advice/guides/sofa-dimensions-how-to-choose-the-right-size-sofa-for-your-home-T5610)
- [Castlery] [Sofa sizes and dimensions](https://www.castlery.com/us/blog/sofa-sizes-and-dimensions)
- [Suburban] [Sofa arm style guide](https://suburbanfurniture.com/blog/sofa-arm-style-guide)
- [Houzz] [How to choose the right arm style](https://www.houzz.com/magazine/sofa-secrets-how-to-choose-the-right-arm-style-stsetivw-vs~75473250)
- [American Leather] [Sofa arm styles](https://americanleather.com/resource-center/sofa-arm-styles)

## Styles

Weights sum to 1.00. Width ranges for `sofa` and `loveseat` do not overlap (1.65 < 1.75), so the two read as different sizes at grid distance.

### sofa (weight 0.30)
- **Silhouette:** a long low block, 1.75–2.30 m, with an arm at each end and a back that rises above the arms. There are 2–3 seat cushions, a row of back cushions, and short feet or a plinth.
- **Parts:**
  - body (deck)
  - back frame
  - 2 arms (track / roll / slope / none)
  - 1–3 seat cushions
  - 0–3 back cushions (loose / pillow), or a tight upholstered back
  - 0–2 throw pillows
  - 4 or 6 legs, or a plinth

### loveseat (weight 0.15)
- **Silhouette:** a short, chunky two-seater, 1.30–1.65 m. Arms are relatively fat and rolled arms are most likely. It is nearly as deep as it is wide in plan, so it reads squat next to a sofa.
- **Parts:** same as `sofa`, with 1–2 seat cushions, 0–2 back cushions and 4 legs.

### midcentury (weight 0.15)
- **Silhouette:** a slim, raised sofa on tall splayed tapered legs (or a sled base). It has thin square arms or none, a thin bench or two seat cushions, and a low, tight back. Light shows clearly underneath.
- **Parts:**
  - body
  - thin back frame (tight back, optional loose back cushions)
  - 0 or 2 slim track arms
  - 1–3 thin seat cushions
  - 4 or 6 tapered legs, or 2 sled runners

### chaise (weight 0.15)
- **Silhouette:** a chaise longue: a long, narrow lounger, 1.50–1.80 × 0.65–0.85 m. One end rises into an inclined head rest, optionally topped by a scroll bolster. There is an optional low half-back along the rear from the head end. It is asymmetric, with the open long side facing +z.
- **Parts:**
  - body
  - 1 long seat cushion
  - head end (inclined profile slab, optional scroll bolster)
  - optional half back frame
  - 0–1 pillow leaning on the head
  - 4 legs

### sectional (weight 0.25)
- **Silhouette:** an L in plan. A main run (2.20–2.55 m) has a chaise return extending forward on one side to 1.50–1.90 m total depth. A long arm runs down the outer side of the chaise and a normal arm sits at the other end. Seen from above it is unmistakable. From the front it reads as a wide sofa with one side pushed forward.
- **Parts:**
  - L-shaped body
  - back frame along the rear only
  - far-end arm
  - long return-side arm (track / roll / none)
  - 2–3 main seat cushions plus 1 chaise cushion
  - 0–4 back cushions
  - 0–2 pillows
  - 6–7 legs at the L corners, or an L plinth

The "corner" sectional (backs on two sides, arm at the front of the return) is deferred. See Open questions.

## Parameters

Units in meters, angles in degrees. "Style-dependent" ranges are listed in the per-style table below the master table. Every param is owned by exactly one group. Fields that do not apply to a style still exist, with neutral values (`0`, `null` or `'none'`), so the field set is uniform, as with the chair.

### Master table

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `style` | sofa, loveseat, midcentury, chaise, sectional | `rollStyle(g, styles)`: weighted pick 0.30 / 0.15 / 0.15 / 0.15 / 0.25 at re-roll 0 (`_kit-additions.md` R1) | none | style |
| `width` | per style (overall x extent, arms and overhangs included) | uniform | style | shape |
| `depth` | per style (main-run z extent; chaise: z extent) | uniform | style | shape |
| `seatHeight` | per style, within 0.38–0.46 | uniform | style | shape |
| `armStyle` | track, roll, slope, none | weighted pick per style; chaise is always `none` | style | shape |
| `armWidth` | track 0.10–0.22 · roll post 0.08–0.16 · slope 0.10–0.18 · midcentury track 0.05–0.10 · none 0 | uniform | style, armStyle | shape |
| `rollRadius` | 0.07–0.11 (roll only, else 0) | uniform | armStyle | shape |
| `armOuter` | derived: track/slope = armWidth · roll = max(armWidth, 2·rollRadius) · none = 0 | derived | armWidth, rollRadius | shape |
| `armRise` | 0.16–0.28 above seat (midcentury 0.14–0.22; none/chaise 0) | uniform | style, armStyle | shape |
| `innerSpan` | derived: width − 2·armOuter (sofa / loveseat / midcentury / sectional) or width − headLength (chaise) | derived | width, armOuter | shape |
| `backTop` | per style (y of back frame top); clamped ≥ seatHeight + armRise + 0.08 | uniform then clamp | style, seatHeight, armRise | shape |
| `backFrameThickness` | 0.14–0.24 (midcentury 0.08–0.14, chaise 0.10–0.16) | uniform | style | shape |
| `bodyPuff` | 0.02–0.05 (midcentury 0.01–0.025) | uniform | style | shape |
| `returnSide` | left, right (sectional only, else null) | 50 / 50 | style | shape |
| `returnLength` | 1.50–1.90 total z extent (sectional), clamped ≥ depth + 0.5 | uniform then clamp | depth | shape |
| `returnWidth` | 0.75–0.95, clamped ≤ innerSpan − 1.0 (sectional) | uniform then clamp | innerSpan | shape |
| `headSide` | left, right (chaise only) | 50 / 50 | style | shape |
| `headStyle` | scroll, plain (chaise only) | 0.6 / 0.4 | style | shape |
| `headHeight` | 0.65–0.85 (chaise only) | uniform | style | shape |
| `headLength` | 0.18–0.30 (x extent of head base, chaise only) | uniform | style | shape |
| `headIncline` | 10–35° from vertical, clamped so head top thickness ≥ 0.07 | uniform then clamp | headLength, headHeight, seatHeight | shape |
| `backFraction` | 0 (p 0.4) or 0.35–0.70 of the length (chaise only; others 1) | weighted then uniform | style | shape |
| `seatCushionCount` | per style set; clamped to floor(seatSpan / 0.45) and ≥ 1 | weighted pick then clamp | style, innerSpan, returnWidth | cushions |
| `seatThickness` | 0.10–0.18 (midcentury 0.08–0.13, chaise 0.08–0.14) | uniform | style | cushions |
| `cushionPuff` | 0.025–0.06 (midcentury 0.012–0.03) | uniform | style | cushions |
| `cushionGap` | 0–0.012 | uniform | none | cushions |
| `backMode` | loose, pillow, tight | weighted pick per style; chaise is always `tight` | style | cushions |
| `backCushionCount` | loose/pillow: pick of {seatCushionCount, 2, 3} (sectional: mainCount + 1), clamped to ≥ 0.45 m per cushion and ≤ 4; tight: 0 | weighted pick then clamp | backMode, seatCushionCount, innerSpan | cushions |
| `backCushionHeight` | loose 0.32–0.48 · pillow 0.40–0.55; clamped so top ≤ backTop + (pillow ? 0.06 : 0) | uniform then clamp | backMode, backTop, seatHeight, seatThickness | cushions |
| `backCushionThickness` | loose 0.12–0.20 · pillow 0.16–0.24; clamped so usable seat depth ≥ 0.45 | uniform then clamp | backMode, depth, backFrameThickness | cushions |
| `backCushionAngle` | 6–20° | uniform | backMode | cushions |
| `pillowCount` | 0, 1, 2 (chaise 0, 1) | weighted 0.45 / 0.2 / 0.35 (chaise 0.6 / 0.4) | style | cushions |
| `pillowSize` | 0.34–0.48, clamped ≤ seatCushionDepth − 0.05 and ≤ innerSpan / 3 | uniform then clamp | innerSpan, depth | cushions |
| `pillowThickness` | 0.10–0.15 | uniform | none | cushions |
| `pillowSide` | left, right (only used when pillowCount = 1) | 50 / 50 | none | cushions |
| `pillowAngle` | 10–22° tilt back, yaw ±8° | uniform | none | cushions |
| `cushionSegments` | 3 if seat + back cushions ≤ 4, else 2 | derived | seatCushionCount, backCushionCount | cushions |
| `legStyle` | block, bun, tapered, sled, plinth | weighted pick per style | style | legs |
| `legCount` | derived: sled 2 · plinth 0 · chaise 4 · straight runs 4 (width < 1.9) or 6 · sectional 6 (+1 if width > 2.3) | derived | style, legStyle, width | legs |
| `legHeight` | block 0.03–0.08 · bun 0.04–0.08 · tapered 0.10–0.20 (midcentury 0.14–0.22) · sled 0.12–0.20 · plinth 0.02–0.05; clamped ≤ seatHeight − seatThickness − 0.08 | uniform then clamp | legStyle, seatHeight, seatThickness | legs |
| `legThickness` | block 0.04–0.07 · bun 0.06–0.10 (diameter) · tapered 0.035–0.05 · sled 0.03–0.045 · plinth 0 | uniform | legStyle | legs |
| `legSides` | block 4 · bun 8 · tapered pick [5, 6, 8] · sled pick [4, 8] | pick / fixed | legStyle | legs |
| `legTaper` | block 0.85–1.0 · tapered 0.5–0.75 · others 1 | uniform | legStyle | legs |
| `legSplay` | tapered 0–0.04 · others 0 | uniform | legStyle | legs |
| `plinthInset` | 0.02–0.05 (plinth only) | uniform | legStyle | legs |
| `paletteMood` | neutral, muted, bold | weighted 0.4 / 0.4 / 0.2 (midcentury 0.25 / 0.4 / 0.35) | style | palette |
| `primary` | hsl(hue U[0,1], s, l): neutral s 0.04–0.18 l 0.45–0.78 · muted s 0.2–0.45 l 0.38–0.62 · bold s 0.45–0.70 l 0.35–0.55 | derived from the rolls | paletteMood | palette |
| `secondary` | from secondaryMode light / dark / complement / white, as in the chair | weighted pick | primary hue | palette |
| `bodyMode` | same, match, contrast | weighted 0.5 / 0.35 / 0.15 | none | palette |
| `bodyColor` | same = primary · match = l − (0.06–0.12), s × 0.85 · contrast = neutral hsl(hue ± 0.5, 0.08–0.2, 0.3–0.7) | derived | bodyMode, primary | palette |
| `accentColor` | hsl(hue + pick[0.5, ±0.08, mustard 0.12 fixed], 0.35–0.65, 0.45–0.70) | weighted pick + uniform | primary hue | palette |
| `pattern` | solid, stripes, checker | weighted 0.6 / 0.25 / 0.15 | none | pattern |
| `patternScale` | int 2–6 (repeats per meter with `boxProjectUVs`) | uniform int | none | pattern |
| `stripeDirection` | horizontal, vertical | 50 / 50 | none | pattern |
| `frameMode` | wood, black, metal, brass, match | weighted per style and legStyle (below) | style, legStyle | finish |
| `frameColor` | wood: WOOD_TONES with h ±0.01, l ±0.05 · black #2a2a2c l ±0.03 · metal #a7abb0 l ±0.03 · brass hsl(0.11, 0.45–0.55, 0.5–0.58) · match hsl(hue, 0.4, 0.32) | derived + jitter | frameMode, palette hue | finish |
| `woodName` | WOOD_TONES name or null | derived | frameMode | finish |

### Per-style shape ranges

| Field | sofa | loveseat | midcentury | chaise | sectional |
|---|---|---|---|---|---|
| width | 1.75–2.30 | 1.30–1.65 | 1.60–2.10 | 1.50–1.80 (length) | 2.20–2.55 |
| depth | 0.85–1.00 | 0.80–0.95 | 0.78–0.90 | 0.65–0.85 | 0.88–1.00 |
| seatHeight | 0.38–0.46 | 0.39–0.46 | 0.40–0.45 | 0.38–0.44 | 0.38–0.45 |
| backTop | 0.76–0.92 | 0.76–0.90 | 0.70–0.80 | 0.60–0.75, ≤ headHeight − 0.05 | 0.74–0.88 |
| armStyle weights (track / roll / slope / none) | 0.40 / 0.30 / 0.20 / 0.10 | 0.35 / 0.40 / 0.20 / 0.05 | 0.70 / 0 / 0 / 0.30 | 0 / 0 / 0 / 1 | 0.55 / 0.20 / 0 / 0.25 |
| seatCushionCount weights | 1: 0.15 · 2: 0.35 · 3: 0.50 | 1: 0.35 · 2: 0.65 | 1: 0.40 · 2: 0.35 · 3: 0.25 | 1 | main 2: 0.5 · 3: 0.5, plus 1 chaise cushion (total 3–4) |
| backMode weights (loose / pillow / tight) | 0.50 / 0.25 / 0.25 | 0.45 / 0.35 / 0.20 | 0.30 / 0 / 0.70 | tight | 0.55 / 0.30 / 0.15 |
| legStyle weights (block / bun / tapered / sled / plinth) | 0.35 / 0.20 / 0.30 / 0 / 0.15 | 0.30 / 0.35 / 0.25 / 0 / 0.10 | 0 / 0 / 0.75 / 0.25 / 0 | 0.25 / 0.35 / 0.40 / 0 / 0 | 0.45 / 0 / 0.25 / 0 / 0.30 |
| frame wood chance | 0.55 | 0.6 | 0.75 | 0.7 | 0.45 |

Non-wood `frameMode` is split black 0.45 / metal 0.25 / brass 0.15 / match 0.15. Two overrides apply:
- `sled` forces non-wood (metal 0.6, black 0.4).
- `plinth` uses black 0.6 / wood 0.4 (a recessed dark plinth).

### Derived layout (build-time, from params, no randomness)

- **Heights:**
  - `cushionBottom = seatHeight − seatThickness`
  - `bodyBottom = legHeight`
  - `bodyH = cushionBottom − legHeight` (≥ 0.08 by clamp)
  - `armTop = seatHeight + armRise`
- **Main-run z extents:** back at `zBack`, front at `zBack + depth`.
  - Straight styles: `zBack = −depth / 2`.
  - Sectional: `zBack = −returnLength / 2`, and the return front sits at `+returnLength / 2`.
  - So every bbox is analytically centred, and no post-hoc recentring is needed.
- **Back cushion pivot:** the cushion's bottom rear edge sits at `frameFront + backCushionHeight · sin(angle)`. The tilted top then just touches the frame front.
- **Seat cushions:** depth runs from the back-cushion bottom-front edge to the body front.
- **Usable seat depth:** `depth − backFrameThickness − backCushionThickness·cos(a) − backCushionHeight·sin(a)` must stay ≥ 0.45 (clamp in cushions).

## Re-roll groups

All groups use modern independent streams (`${itemSeed}/${group}/${n}`). `style` is rerollable through `rollStyle` (ruling R1): each ⟳ steps to a style not seen yet. Palette reads style (mood weights), so it may change too; pattern is kept.

| Order | Group | Owns | Reads | Visibly changes |
|---|---|---|---|---|
| 1 | `style` | style | none | Everything except pattern (rerollable via `rollStyle`) |
| 2 | `shape` | width, depth, seatHeight, armStyle, armWidth, rollRadius, armOuter, armRise, innerSpan, backTop, backFrameThickness, bodyPuff, returnSide, returnLength, returnWidth, headSide, headStyle, headHeight, headLength, headIncline, backFraction | style | Footprint, arm type, back height, which side the chaise/head is on |
| 3 | `cushions` | seatCushionCount, seatThickness, cushionPuff, cushionGap, backMode, backCushionCount, backCushionHeight, backCushionThickness, backCushionAngle, pillowCount, pillowSize, pillowThickness, pillowSide, pillowAngle, cushionSegments | style, shape | Cushion rhythm, loose versus tight back, pillows |
| 4 | `legs` | legStyle, legCount, legHeight, legThickness, legSides, legTaper, legSplay, plinthInset | style, shape, cushions | Feet versus plinth versus tall tapered legs; body thickness |
| 5 | `palette` | paletteMood, primary, secondary, bodyMode, bodyColor, accentColor | style | Upholstery, body and pillow colours |
| 6 | `pattern` | pattern, patternScale, stripeDirection | none | Cushion fabric pattern |
| 7 | `finish` | frameMode, frameColor, woodName | style, legs, palette | Leg / plinth colour |

Group ids `cushions` and `legs` are type-specific. Labels: Style, Shape, Cushions, Legs, Colours, Pattern, Frame.

Later-group fields that may change when an earlier group is re-rolled (for the isolation test's allow-list):
- **Re-roll `shape`:**
  - Cushions: `seatCushionCount` (span clamp), `backCushionCount`, `backCushionHeight` (backTop clamp), `backCushionThickness` (depth clamp), `pillowSize` (clamp) and `cushionSegments`.
  - Legs: `legCount` (width threshold, sectional) and `legHeight` (seatHeight clamp).
  - Finish: no fields change.
- **Re-roll `cushions`:** `legs.legHeight` (seatThickness clamp).
- **Re-roll `legs`:** `finish.frameMode` / `frameColor` / `woodName` (sled / plinth overrides).
- **Re-roll `palette`:** `finish.frameColor` only when `frameMode === 'match'`.
- **Re-roll `pattern`, `finish`:** no later dependants.

Isolation note: `finish` must change a field on ≥ 90 % of re-rolls. Rolling the same non-wood mode twice is about 8 % likely. To keep re-rolls visible, black and metal also jitter lightness by ±0.03, so `frameColor` always changes.

## Kit reuse map

| Part | Helper | Notes |
|---|---|---|
| Body / deck (straight styles) | `puffy(w, bodyH, d, bodyPuff, body, 2)` | Spans `innerSpan` between arms, as in `buildCozy`. Uses 2 segments (see the `puffy` segments request). |
| Body (sectional L) | `extrudeUp(roundedPolygonShape(L, bodyPuff), bodyH, bevel)` + `boxProjectUVs` | One mesh, about 220 tris, instead of 2 puffies. `roundedPolygonShape` is sofa-local in wave 1 (R7); the fallback is 2 overlapping puffies. |
| Back frame | `puffy` (2 segments) | Vertical, with no rake, so the bbox z is exact. Material is `body`, or `surface` when `backMode === 'tight'` so a tight back reads as upholstered. |
| Seat cushions | `puffy(…, cushionPuff, surface, cushionSegments)` laid out with `splitSpan` | Sectional chaise cushion: one puffy over `returnWidth × (returnLength − backFrameThickness)`. |
| Back cushions | `puffy` in a pivot `Group` rotated by `backCushionAngle`, as in `buildCozy` | `pillow` mode: puff × 1.5 and allowed to overshoot the frame top by 6 cm. |
| Track arm | `puffy(armWidth, armTop − legHeight, depth, bodyPuff·1.5, body, 2)` | Sectional return-side arm uses `depth = returnLength`. |
| Roll arm, post | `puffy` (2 segments) up to `armTop − rollRadius` | |
| Roll arm, roll | `roundedDiscGeometry(rollRadius, depth, rollRadius·0.4, 10)` rotated 90° about x, so the lathe axis runs along z | Lathe, not `tube` (tube ends are open). Centre x = `innerHalf + max(rollRadius, armWidth/2)`, so the inner tangent is flush with the post's inner face. |
| Slope arm | `extrudeProfile(sideProfile, armWidth, bevel, 'side')` | Side profile: from (zBack, backTop) down to (front, armTop), then vertical down to legHeight. |
| Chaise head | `extrudeProfile(frontProfile, depth, bevel, 'front')` (A5) + optional scroll `roundedDiscGeometry(r 0.06–0.09, depth·0.98, …)` on top | The scroll's outer tangent is flush with the end face, so x stays symmetric. Its top tangent is at `headHeight` (centre at `headHeight − r`), so `headHeight` stays the overall top (≤ 0.85 < maxSize 1.0). |
| Chaise half back | `puffy` (2 segments) | Starts at the head (overlaps it), length `backFraction · width`. |
| Throw pillows | `puffy(pillowSize, pillowSize, pillowThickness, pillowSize·0.25, accent, 2)` | Bottom on the seat cushion top, back edge touching the back cushion or frame. |
| Block / tapered legs | `buildLegs(p, mats, fp)` | `fp` is the body/arm-post footprint inset by `bodyPuff`, so legs don't peek out of the rounded corners. 6 legs come from `fp.anchors = rowAnchors(w, d, 3, insetX, insetZ)` (B1), **not** `legAnchors` with n = 6: its middle legs land on z = ±hz while the corner legs sit at about ±0.87·hz, so the rows misalign (see the bench spec). |
| Sled base | `buildLegs` with `legCount = 2` | Runners along z under each arm. The sled branch reads `p.puff`, which the sofa does not have (it would give NaN geometry). Pass an explicit leg object, `{ legCount: 2, legThickness, legSides, legTaper, legSplay: 0, puff: 0.006 }` (R6). |
| Sectional legs | `buildLegs` with `fp.anchors` (B1) | 5 convex L corners + inner corner (+ mid-back when width > 2.3). |
| Bun feet | sofa-local `buildFeet`: `roundedDiscGeometry(legThickness/2, legHeight, legThickness·0.3, 8)` at the same anchors the legs would use | Disc is centred on y → `position.y = legHeight / 2`. |
| Plinth | `puffy` (inset box) or `extrudeUp(roundedPolygonShape(L inset))` for sectional | Frame material. |
| Palette | `hsl`, `WOOD_TONES` | s ≤ 0.70, l 0.35–0.78. |
| Materials | `surface` (cushions, patterned), `solid(bodyColor)` (body / arms / frame), `frame(frameColor, frameMode)` (legs / plinth), `solid(accentColor)` (pillows) | 3 draw calls, 4 with pillows. Never more. The 4th role is approved by ruling R5. |
| Merge / dispose | `mergeByMaterial`, `disposeObject` | Done by the app. |

Triangle estimates:

| Part | Tris |
|---|---|
| `puffy`, 3 segments | 588 |
| `puffy`, 2 segments | 300 |
| Lathe roll, 10 sides | ≈ 180 |
| `extrudeProfile` | ≈ 150 |
| L extrusion | ≈ 220 |
| 8-sided strut | 32 |

Worst cases:

| Case | Parts | Total |
|---|---|---|
| Sofa, 3-segment cushions | 4 cushions × 588 + 2 pillows 600 + body 300 + frame 300 + 2 roll arms 960 + 6 legs 200 | ≈ 4.7k |
| Sectional, 2-segment cushions | 4 seat + 4 back cushions 2.4k + pillows 600 + L body 220 + frame 300 + 2 roll arms 960 + 7 legs 230 | ≈ 4.7k |
| Sectional, 9 cushions | as above with 9 cushions | ≈ 5.0k |

All stay under 6k.

## New helpers requested

| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| `puffy` segments arg (geometry.js) → **done in PR #4** | `puffy(w, h, d, radius, mat, segments = 3)` | Budget. A 3-segment puffy is 588 tris. Sofas need 6–12 boxes, and 2 segments (300 tris) is enough for large flat parts. The default keeps the chair golden unchanged. | All types (bench, bed, cabinet carcasses) |
| `splitSpan` (new `core/layout.js`) → **accepted as A4** | `splitSpan(start, end, count, gap) → [{ center, size }]` | Cushion splitting: equal parts with gaps, used for seat and back rows and sectional runs. | Bench slats, shelf dividers, drawer grids, bed pillows |
| `extrudeProfile` (geometry.js) → **accepted as A5** (outline may be a `Shape`; merges stool `panelFromShape` and bench `extrudeSide`) | `extrudeProfile(points: Vector2[], thickness, bevel, plane: 'side' \| 'front') → BufferGeometry` | Slabs from a side profile (z, y) extruded along x, or from a front profile (x, y) extruded along z. Centred on the extrusion axis, UVs normalised. Needed for slope arms and the chaise head. | Bench ends, bed headboards/footboards, sled legs, rocking-chair runners |
| `roundedPolygonShape` → **sofa-local in wave 1 (R7)** | `roundedPolygonShape(points: [x, z][], radius, steps = 3) → Shape` | L-shaped body and plinth with soft corners for `extrudeUp`. | Table tops (rounded rect), rugs, cabinet plinths, corner shelves |
| `buildLegs` anchors override (supports.js) → **accepted as B1** (with `rowAnchors`) | `fp.anchors?: [x, z][]` overrides `legAnchors` | L footprints and extra centre legs. | Trestle/long tables, beds, long benches |
| `boxProjectUVs` (geometry.js) → **accepted as A8** | `boxProjectUVs(geometry, unit = 1) → geometry` | Rewrites UVs from vertex position by dominant normal axis, so patterns tile per meter. Without it, a 2 m bench cushion and a 0.5 m cushion show the same number of stripes. | Every patterned surface (bench seats, table tops, beds, rugs) |
| Optional: `buildFeet` → **sofa-local in wave 1 (R7)** | `buildFeet(p, mats, fp)` for `bun` / `block` | Bun feet are local code today. Promote them if cabinets or beds need them in Wave 2. | Cabinets, dressers, beds |

The rolled arm does **not** need a new helper. It is a `puffy` post plus a `roundedDiscGeometry` lathe roll (the plan's "tube or lathe" option, lathe chosen because tube ends are open and visible on the arm front).

## Failure modes and guards

| Failure | Guard | Test |
|---|---|---|
| Legs float (chair `tube` regression: tube end centres sit one radius above the floor) | Never use `tube` for legs. Use struts (bottom at y = 0), bun discs at `y = legHeight/2`, and plinth boxes from y = 0. | grounded (parts + merged) |
| Body height ≤ 0 or paper-thin | `legHeight ≤ seatHeight − seatThickness − 0.08` | param contract: `bodyH ≥ 0.08` |
| Legs peek out of rounded body corners | Footprint inset by `bodyPuff`; legs under arm posts, never under roll overhangs | visual; invariant: leg tops inside the body bbox |
| Back lower than the arms (reads as a box or bench) | `backTop ≥ armTop + 0.08` clamp in shape | type check `backAtRear` (below) |
| Slope arm with negative slope | Guaranteed by the clamp above | param contract |
| Cushions too narrow or too many | `seatCushionCount ≤ floor(span / 0.45)`, `backCushionCount ≤ 4`, ≥ 0.45 m each | param contract |
| Sectional main run too short (one stubby cushion) | `returnWidth ≤ innerSpan − 1.0` | param contract |
| Seat depth unusable after back cushions | Clamp `backCushionThickness` so usable depth ≥ 0.45 | param contract |
| Tilted back cushion pokes through the back frame | Pivot offset by `backCushionHeight · sin(angle)` | intersection check (frame vs back cushion overlap < 5 %) |
| Cushions intersect arms | Cushions span exactly `innerSpan` minus gaps; roll inner tangent flush with the post face | type check `cushionsInsideArms` |
| Roll overhangs into the seat | Roll centre x ≥ `innerHalf + rollRadius` (outward overhang only) | same |
| Pillows poke through arms or float | Size clamp, centre ≥ `pillowSize/2 + 0.03` from the arm face, yaw ≤ 8°, bottom on the cushion top | connected; visual |
| Floating parts (pillows, roll, half back, head) | Each sits on or overlaps a supporting part (bbox overlap ≥ 0 within 2 mm) | connected |
| Over budget | `cushionSegments` rule; 2-segment structural parts; worst cases ≈ 5k | budget test, 500 seeds, ≤ 6k tris, ≤ 4 draw calls |
| Sectional exceeds the cell | width ≤ 2.55, returnLength ≤ 1.90 < 2.7 | fits cell |
| Sectional tips (bbox centre outside the leg hull) | Legs at all L convex corners + inner corner; the hull of an L contains its bbox centre for returnLength − depth ≥ 0.5 (checked by hand) | stable |
| Asymmetric styles off-centre | Layout computed in centred coordinates (see Derived layout) | type check `centred` (bbox centre within 5 mm of x = 0, z = 0) |
| Loveseat and sofa indistinguishable | Non-overlapping width ranges | style distribution + visual |
| Chaise reads as a bench | `headHeight ≥ seatHeight + 0.25`; head top thickness ≥ 0.07 | param contract |
| Scroll bolster pushes the chaise over `maxSize.height` | The scroll's top tangent sits at `headHeight` (centre at `headHeight − r`) | sane size |
| Sled legs build NaN geometry | Pass an explicit leg object with `puff` to `buildLegs` (the sled branch reads `p.puff`) | finite |
| 6-leg rows misaligned | `rowAnchors(…, 3, …)` through `fp.anchors`, never `legAnchors` with n = 6 | visual; legs in two straight rows |
| Stretched patterns on long cushions | `boxProjectUVs` with `patternScale` per meter | visual |
| Zero-size parts (pillowCount 0, armless, backFraction 0) | Don't emit the part at all | finite; merge bbox equality |
| Splayed tapered legs dip below the floor | legSplay ≤ 0.04; existing `GROUND_MIN = −20 mm` tolerance | grounded |
| Re-roll combos break things (re-rolled shape with old legs) | All clamps re-evaluated in later groups from the current earlier values | invariant sweep with random reroll maps |

Proposed `TYPE_RULES.sofa`:
- `maxSize: { width: 2.6, height: 1.0, depth: 2.0 }`
- Checks:
  - **`centred`:** x and z, 5 mm tolerance.
  - **`armsSymmetric`:** sofa / loveseat / midcentury only. Reuses `centredInX` on the arm meshes, 2 mm.
  - **`backAtRear`:** all except chaise. Mean z of vertices above `armTop + 0.02` is < 0 for straight styles. For sectional, it is < the main-run centre z.
  - **`seatHeight`:** max y of seat-cushion tops ∈ [0.38, 0.47].
  - **`cushionsInsideArms`:** no seat-cushion vertex beyond the arm inner faces + 1 mm.

## describe() rows

| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `sofa` · `sectional (chaise right)` · `chaise (head left)` |
| shape | Size | `214 × 92 × 84 cm` (W × D × H; sectional D is returnLength) |
| shape | Seat height | `43 cm` |
| shape | Arms | `roll · 18 cm` / `track · 14 cm` / `none` (hidden for chaise) |
| shape | Head | `scroll · 78 cm · 22°` (chaise only) |
| shape | Back | `84 cm` / chaise `half (55 %)` / `none` |
| cushions | Seat cushions | `3 × 14 cm` |
| cushions | Back | `loose × 3 · 12°` / `pillow × 2` / `tight` |
| cushions | Pillows | `2` / `1 (left)` / `none` |
| legs | Legs | `tapered × 6 · 16 cm` / `bun × 4 · 6 cm` / `sled · 15 cm` / `plinth 4 cm` |
| palette | Colours | `{ swatches: [primary, bodyColor if ≠ primary, accentColor if pillows] }` |
| pattern | Pattern | `solid` / `stripes (vertical) × 4/m` / `checker × 3/m` |
| finish | Frame | `walnut wood` / `black` / `brass` / `metal` / `match` |

`swatches` (top level): primary, secondary (if pattern ≠ solid), bodyColor (if ≠ primary), accentColor (if pillowCount > 0), frameColor (unless plinth and black).

## Grid cell

**spacing: 2.8 m, gridSize: 15.**

- **What drives it:** the sectional, at x ≤ 2.55 m (width includes arms and roll overhang) and z ≤ 1.90 m. The fits-cell limit is 2.8 − 0.1 = 2.7 m, which leaves 15 cm of headroom. The straight sofa is ≤ 2.30 m.
- **Grid size:** 15 × 2.8 = 42 m, which matches the chair grid's world size (25 × 1.7 = 42.5 m), so camera framing stays consistent. 225 items × ≈ 3.5k average tris ≈ 0.8M tris, well under the chair grid (625 × 3k ≈ 1.9M).
- **Seed form:** `${seed}-sofa-${n}`. `plural: 'sofas'`.

## Open questions

1. **Chaise meaning:** `chaise` here is a standalone chaise longue (one raised head end, optional half back). The sofa-with-chaise silhouette is covered by `sectional`. Is that the intended split, or did the plan mean "sofa + chaise" for both?
   *Architect: the split is sound. It gives two different silhouettes, and both are cheap in the kit.*
2. **Corner sectional:** only the chaise-L is specified. A corner L (backs on two sides, arm on the front of the return) adds about 4 more cushions and a second back frame (≈ +1.2k tris). Add it in v1 as a `returnKind` with weight about 0.35, or defer?
   *Architect: defer. With 2-segment cushions it fits the budget (about 6.2k worst case, which is tight), but it doubles the back and cushion layout logic.*
3. **`midcentury` style:** this style is not in the vision doc's list. It was added because sofa, loveseat and sectional share the same "block on stubby feet" language, and a raised, slim, tall-legged sofa gives the grid a fourth silhouette. Keep it, or fold it into `sofa` as a leg/arm option?
   *Architect: keep it as a style. It is the only one with light under the body.*
4. **Seat height:** the guides say 0.43–0.48 m, and the vision doc says 0.38–0.45. This spec uses 0.38–0.46 to allow low lounge sofas. Is that OK?
   *Architect: fine. No kit impact.*
5. **Sectional size:** real sectionals run 2.4–3.0 m. Capping at 2.55 m keeps the cell at 2.8 m. Alternatively, a 3.2 m cell would allow true-size sectionals with gridSize 13. Which do you prefer?
   *Architect: keep 2.55 / 2.8 m (ruling R4, 15 cm headroom). 3.2 m makes straight sofas look sparse.*
6. ~~**Should `style` be rerollable?**~~ Answered by ruling R1: yes, via `rollStyle`.
7. ~~**Kit requests.**~~ Answered: `puffy` segments landed in PR #4; `boxProjectUVs` is A8 (wave 1). The fallback stays as written in case A8 slips.
8. ~~**Throw pillows.**~~ Answered by ruling R5: the 4th draw call is allowed.
9. **Tufting / Chesterfield** (button-tufted back with rolled arms at back height) is a very recognisable silhouette but needs either a normal-map texture or many more triangles. Out of scope for Wave 1?
   *Architect: out of scope for wave 1.*

## Architect review

Backlog 2.6. **Verdict: approved with edits.** The rulings (R1–R7) and helper ids (A1–C4) are in
`specs/_kit-additions.md`.

Checklist:
- Style weights sum to 1.00, and every per-style weight set sums to 1.
- Group order, `reads` and the allow-list are correct, including legs reading cushions for the `seatThickness` clamp.
- Worst case is about 5.0k tris and 4 draw calls.
- The max footprint is 2.55 × 1.90 m, inside the 2.70 m cell limit.

What I changed:
1. `style` is rerollable through `rollStyle` (R1).
2. **Bug: the sled base would build NaN geometry.** `buildLegs`' sled branch reads `p.puff`, which sofa params do not
   have. Build now passes an explicit leg object with `puff` (R6).
3. **6-leg layout:** `legAnchors` with n = 6 misaligns the rows (the bench designer's analysis). It is replaced by
   `rowAnchors(…, 3, …)` through `fp.anchors` (B1).
4. The chaise scroll bolster's top tangent is pinned at `headHeight`, so it cannot exceed `maxSize.height`. Three guard
   rows are added for these fixes.
5. Accepted helpers:
   - `splitSpan` (A4).
   - `extrudeProfile` (A5), which now also serves the stool and the bench.
   - `boxProjectUVs` (A8). The L body uses it too, so every patterned part shares one UV convention.
   - `fp.anchors` (B1).
6. `roundedPolygonShape` and `buildFeet` stay sofa-local (R7).
7. The 4th material role (accent pillows) is approved (R5). `cushionSegments` matches ruling R3.
8. Open questions 6, 7 and 8 are struck; 1–5 and 9 are annotated.
