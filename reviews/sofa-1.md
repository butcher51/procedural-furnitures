# Sofa visual review 1

Branch `wave1-integration` @ 065b731. Seed `review`, items 1–48 (`?type=sofa&seed=review&item=N`).
Images: `out/snapshots/sofa-review.png`, `sofa-review-overview.png`, `sofa-review-close.png` (items 1–8 at 640 px),
extra 560 px close-ups `sofa-review-close{9,17,25,33,41}.png` (all 48 items seen at close-up size) and 900 px
zooms `sofa-review-z{13,30,34,46}.png`. No page errors. Styles and palette values were checked against
`generateItem(sofa, 'review', n)` so the style counts and hex values below are exact.

**Verdict: does not pass.** Geometry is mostly solid and the five styles read well, but colour harmony fails
(neon pattern secondaries and bold greens/blues), and the narrowest loveseats read as armchairs.

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | Every item is a sofa-family piece and the style is nameable; the 1.30 m loveseats with fat arms (#19, #38, #41) read as armchairs, and #30 (no back, plain wedge head) reads like a bench with a fin. |
| Proportions | 3 | Sofas, midcentury and sectionals are well proportioned, but 3 of 10 loveseats are armchair-proportioned (inner span ≈ 0.86–1.0 m, one seat cushion), and plain chaise heads are thick, blunt wedges. |
| Construction | 4 | Legs reach the floor, nothing floats, cushions sit inside arms. Pillow clips into an arm on #46, the chaise pillow on #13 pokes above the head as a yellow tube, and #34 has small dark slits on the outer head face. |
| Variety | 4 | All 5 styles present, L sectionals on both sides, all leg types (block, bun, tapered, sled, plinth) and all arm types seen. Tight-back, one-cushion sofas (#16, #42, #29) feel alike. |
| Colour harmony | 2 | Neutral and muted solids are pleasant, but the `complement` secondary (s 0.55, l 0.55, mood-independent) puts neon green/cyan/chartreuse patterns on neutral sofas (#21, #31, #39, #47, #6, #30), and bold mood gives neon green (#35, #40), electric violet (#1) and royal blue (#16). |
| Grid read | 3 | Silhouettes separate well at overview distance (L shapes, chaise heads, raised midcentury), but bright green L sectionals and striped/checker neon cushions make the scene loud and noisy. |

## Issues

| Item | Problem | Severity | Suspected parameter / code area |
|---|---|---|---|
| review #21, #31 | Neutral mauve sofa (#967b95, #9a7693) with saturated green stripes/checker (#4dcb51, #4dcb67): neon, breaks the never-neon rule. | blocker | `secondary: secondaryColor(secondaryMode, hue)` in `src/furniture/sofa/params.js` L190; `core/color.js` `secondaryColor('complement')` = hsl(h+0.5, 0.55, 0.55) ignores `paletteMood`. Needs a sofa-local, mood-aware secondary (s ≤ primary s + ~0.1, or ≤ 0.35) rather than editing core (chair goldens). |
| review #39, #47, #6, #30 | Same mechanism: chartreuse stripes (#c8cb4d) on grey-violet; cyan checker (#4da9cb) on brown; royal-blue checker (#4d66cb) on beige; lime stripes (#99cb4d) on violet chaise. | major | same `secondaryColor` complement mode |
| review #35, #40 | Bold-mood green sectionals (#27c96d, #3baa2f) look neon/plastic; #40 adds pink pillows (#d179da). Most visible items in the overview. | major | `MOOD_RANGES.bold` s 0.45–0.70: needs a lower cap (≈ 0.5) or a hue-dependent cap for greens/cyans (hue ≈ 0.2–0.55) |
| review #1 | Electric violet (#5438bd) loveseat with lime pillows (#9bb050). | major | bold `s` range + accent `hue + 0.5` complement |
| review #16 | Royal blue (#3b55ce) with saturated yellow stripes (#cbb64d): loud. | major | bold `s` range; complement secondary |
| review #41, #19 | Loveseat 1.31–1.32 m with roll arms (armOuter 0.19–0.22) leaves ≈ 0.9 m between arms and one seat cushion: reads as an armchair. | major | loveseat `width` min 1.30 + roll `armOuter = max(armWidth, 2·rollRadius)`; add innerSpan ≥ ~1.05 clamp (shrink arms) or force `seatCushionCount = 2` for loveseat |
| review #38 | 1.30 m loveseat, slope arms almost at back height, one cushion, plinth: boxy armchair. | major | same loveseat width / arm clamp; slope `armRise` vs `backTop` |
| review #46 | Right throw pillow clips into the right arm's inner face. Near-misses on #7, #26. | major | pillow x placement in `src/furniture/sofa/build.js` (pillow centre ≥ pillowSize/2 + 0.03 from arm face): yaw ±8° plus arm `puffy` bulge (bodyPuff·1.5) isn't accounted for |
| review #13 | Chaise pillow, seen edge-on, pokes above the plain head's top edge and reads as a yellow tube. | major | chaise pillow placement/size vs `headHeight`/`headIncline` (pillowSize not clamped to head face length) |
| review #34 | Small dark slits on the outer face of the chaise head: the checker half-back frame pokes through the inclined head. | minor | chaise half back starts "overlapping the head"; its end should stop short of the head's outer face |
| review #30, #34 | Seat-cushion end runs into the inclined head face (slight intersection at the foot of the slope). | minor | chaise `innerSpan = width − headLength` measured at the base; the cushion top meets the incline earlier |
| review #13, #30, #34 | Plain chaise head is a thick, flat-topped wedge with a sharp ridge; without a back (#30) it looks like a ramp/fin. | minor | `headStyle = plain` + `headLength` 0.18–0.30; consider a thinner top or always a rounded cap |
| review #44 | Neon cyan pillow (#54d9c4) on grey. | minor | `accentColor` s 0.35–0.65, l up to 0.70 |
| review #17, #42 | Bold hot pink / magenta (#b92a5c with white checker; #c552b7). | minor | bold `s` range |
| review #11 | Contrast body olive (#576142) under purple: muddy pairing. | minor | `bodyMode = contrast` hue+0.5 |
| review #16, #42 | 2.0–2.3 m sofa with a single long seat cushion and tight back: plain, bench-like. | minor | sofa `seatCushionCount` weight 1: 0.15 |
| review #8 | Cherry-wood bun feet read as red paint. | minor | `WOOD_TONES` red entries |

Sectional orientation is correct on all 9: the return extends forward (+z) on the specified side (4 left, 5 right),
the back frame runs along the rear only, the long arm sits on the return's outer side, and back cushions run the full
main run. Back cushions never poke through the frame; no floating parts or floating legs were seen. 6-leg rows
(#3, #10, #29, #45, #48) are straight.

## Style coverage (48 items)

| Style | Count | Items | Spec weight (expected of 48) |
|---|---|---|---|
| sofa | 14 | 7, 8, 14, 16, 17, 21, 26, 28, 29, 33, 36, 42, 43, 48 | 0.30 (14.4) |
| loveseat | 10 | 1, 2, 5, 9, 19, 23, 27, 38, 41, 46 | 0.15 (7.2) |
| midcentury | 8 | 3, 10, 11, 12, 15, 22, 31, 45 | 0.15 (7.2) |
| chaise | 7 | 4, 13, 24, 25, 30, 34, 37 | 0.15 (7.2) |
| sectional | 9 | 6, 18, 20, 32, 35, 39, 40, 44, 47 | 0.25 (12) |

Arms seen: track, roll, slope, none. Legs seen: block, bun, tapered, sled (#12), plinth (#17, #21, #32, #38, #47).
Back modes: loose, pillow, tight. Chaise heads both sides, scroll (#4) and plain.

## Best 3

1. **review #3** (midcentury): terracotta with cream checker, slim track arms, tapered wood legs, mustard pillows. Reads instantly and harmonious.
2. **review #22** (midcentury): muted teal, three loose back cushions, brass tapered legs. Clean silhouette and colour.
3. **review #48** (sofa): periwinkle cushions on a warm beige body, wood tapered legs, six straight-row legs. Well proportioned.

Runners-up: #7, #37, #44 (except its cyan pillow).
