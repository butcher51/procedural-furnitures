# Sofa visual review 2

Branch `wave1-integration` @ 883c870. Seed `review`, items 1–48, plus fresh seed `fresh2`, items 1–48.
Images in `out/snapshots/`: `sofa-r2.png`, `sofa-r2-overview.png`; 640 px close-ups of all 48 `review` items
(`sofa-r2-z{1,9,17,25,33,41}.png`); 900 px zooms `sofa-r2-zoom{13,28,30,45}.png`; `sofa-r2-fresh.png`,
`sofa-r2-fresh-overview.png`; fresh close-ups `sofa-r2-fresh-z{1,29,37,45}.png` (items 1–4, 29–48). No page errors.

**Verdict: passes.** No blockers. Every criterion is 4 or higher. The palette rework removed every neon
combination from round 1, loveseats now read as two-seaters, and pillows no longer clip arms. What remains is minor:
the chaise pillow on #13, the placement of single pillows on sectionals, and a few tall bare back frames.

## Scores (rubric: plan/06 "AI visual review rubric")

| Criterion | Score | Justification |
|---|---|---|
| Recognisable | 4 | Every item in both seeds reads as a sofa, loveseat, midcentury, chaise or sectional. The narrow loveseats now have 2 cushions (#19, #38, #41). Backless plain-head chaises (#25, #30, fresh2 #2) still look a little like daybeds. |
| Proportions | 4 | The loveseat armchair problem is gone. #38 is still boxy, with slope arms almost at back height. Armless pieces with a bare back frame well above the cushions (fresh2 #37, #43) look like banquettes. |
| Construction | 4 | No floating parts, all legs reach the floor, pillows clear the arms on #7, #26 and #46, and the chaise back no longer shows through the head (#34). The #13 chaise pillow sinks into the seat cushion at its base. |
| Variety | 5 | Five distinct styles, L sectionals on both sides, chaise heads on both sides, all leg and arm types, and solid, stripe and checker covers. Neither seed feels repetitive, and the min-2-cushion rule removed the bench-like long single cushions. |
| Colour harmony | 4 | No neon left. Pattern secondaries are now tonal or muted (#21, #31, #6, #39, #47) and the bold greens and blues are calm (#35, #40, #16, #1). A few pairings are dull or slightly loud: olive on lavender (#30), mustard/terracotta checker (fresh2 #1), near-black stripes (#27, fresh2 #40). |
| Grid read | 4 | Both overviews are much calmer, and the L, chaise and raised-midcentury silhouettes separate well. A handful of high-contrast stripe/checker sectionals still stand out as busy patches in the fresh2 overview. |

## Round-1 items re-checked

| Item | Round-1 problem (severity) | Now | Status |
|---|---|---|---|
| #21, #31 | Neon green stripes/checker on mauve (blocker) | #21 has soft lilac/grey stripes and #31 a pale-pink tonal checker | fixed |
| #39, #47, #6, #30 | Chartreuse, cyan, royal-blue and lime pattern secondaries (major) | #39 grey-blue/stone, #47 dusty blue/brown, #6 olive/beige, #30 olive/lavender. All muted. #30 is still a dull pairing (see new issues). | fixed (#30 improved) |
| #35, #40 | Neon green sectionals, pink pillows (major) | Sage green (#35) and olive (#40) with a dusty-mauve pillow and salmon pillows | fixed |
| #1 | Electric violet with lime pillows (major) | Muted indigo with khaki pillows | fixed |
| #16 | Royal blue with yellow stripes (major) | Mid blue with sand stripes. Now 2 seat cushions. | fixed |
| #41, #19 | 1.3 m roll-arm loveseat reads as armchair (major) | Wider, with 2 seat cushions. Reads as a loveseat. | fixed |
| #38 | Boxy 1.3 m loveseat, one cushion (major) | 2 cushions and reads as a loveseat, but the slope arms still sit almost at back height, so it stays boxy | improved |
| #46 | Pillow clips the right arm (major) | Both pillows sit well clear of the arms (640 px close-up) | fixed |
| #7, #26 | Near-miss pillow/arm (from #46) | Clear gap on both | fixed |
| #13 | Chaise pillow pokes above the head as a yellow tube (major) | The pillow stays below the head top and is yawed, but from the camera it is still seen almost edge-on as an orange sausage, and its base sinks into the seat cushion (dark ring, `sofa-r2-zoom13.png`) | improved, still minor issue |
| #34 | Dark slits on the outer head face from the half back (minor) | No slits. The checker half back ends cleanly against the head. | fixed |
| #30, #34 | Seat cushion runs into the inclined head (minor) | Not reproduced at 640/900 px: the cushion end butts cleanly against the foot of the slope. In `buildChaise` the head inner face leans outward from the base line `xb` and the cushion ends exactly at `xb`, so only the cushion puff can touch the slope. At most a hairline contact. | fixed / not visible |
| #13, #30, #34 | Plain head is a blunt wedge, a fin without a back (minor) | Rounded cap present and the head reads softer. #30 and #25 without a back still read a little like a daybed with a fin. | improved |
| #44 | Neon cyan pillow (minor) | Muted plum pillow | fixed |
| #17, #42 | Hot pink / magenta (minor) | #17 dusty rose with cream checker, #42 muted orchid | fixed |
| #11 | Olive contrast body under purple (minor) | Light grey body under indigo: clean, like a daybed on a platform | fixed |
| #16, #42 | Long single seat cushion (minor) | Both now have 2 cushions | fixed |
| #8 | Cherry bun feet read as red paint (minor) | Dark brown feet | fixed |

## New issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| review #13 (also #37, fresh2 #30, #32) | The chaise pillow is seen edge-on as a sausage, and on #13 its base sinks into the seat cushion. | minor | `buildChaise` pillow: fixed `yaw = rad(20)` keeps the face toward +-x, i.e. side-on to the camera. Pivot y uses `p.seatHeight - tiltDeficit(...)` and ignores the cushion `cushionPuff` crown. A larger yaw (35-45 deg), or facing the pillow forward, would read better. |
| review #35, #40, #44 | On L sectionals a single pillow (or the inner one of two) sits at the seat/return junction, mid-sofa, instead of near an arm. | minor | `buildPillows(p, L, mats, parts, seatLo, seatHi)` gets the main-run span only, and `pillowSide` can pick the end that borders the return. Use the arm end, or the far side of the return. |
| fresh2 #45 | Pillows are taller than the low tight back, so their tops overhang behind the backrest. | minor | `pillowSize` not clamped to `backTop - seatHeight` (keep the pillow about 5 cm below the back top) |
| fresh2 #37, #43 | Armless pieces where the bare back frame rises about 15-20 cm above the loose back cushions: a banquette/booth look. | minor | `backTop` vs `backCushionHeight` + tilt. Cap the frame at the cushion top + ~5 cm when `armStyle = none`. |
| review #38 | Slope arms nearly at back height on a short loveseat: boxy. | minor | slope `armRise` vs `backTop`, with no cap for loveseats |
| review #30 | Olive stripes on lavender: no longer neon, but a dull, slightly muddy pairing. | minor | mood-aware secondary in `src/core/palette.js` can still land near the complement for violet primaries |
| review #41, fresh2 #39 | Roll-arm cylinders show visible facets at 640 px. | minor | low radial segment count on the roll arm |
| review #45 | Tiny grey speck at the right front corner of the seat cushion next to the arm (`sofa-r2-zoom45.png`). Probably a leg top or arm-bevel corner showing through. | minor (unconfirmed) | leg/arm vs seat cushion corner overlap |

## Style coverage

Both seeds have all five styles, both L and chaise orientations, all leg types (block, bun, tapered, sled, plinth),
all arm types (track, roll, slope, none), and all back modes (loose, pillow, tight, half back on chaise).

## Best 3

1. **review #3** (midcentury): terracotta with cream checker, slim track arms, tapered wood legs, blush pillows. Crisp and harmonious.
2. **review #46** (loveseat): sage green, two seat cushions, terracotta pillows well clear of the arms. Reads like a real catalogue loveseat.
3. **review #48** (sofa): slate body with powder-blue cushions on light wood tapered legs, six legs in a straight row. Well proportioned.

Runners-up: review #22, review #9, fresh2 #42 (pale-grey frame with teal cushions on splayed wood legs).
