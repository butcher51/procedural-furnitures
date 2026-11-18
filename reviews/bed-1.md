# Bed visual review 1

Branch `wave2-integration`, seed `review` (48, 640 px close-ups of all) + `fresh` (24) + 900 px solos. No page errors. Report by the visual-reviewer agent; saved by the orchestrator.

**Verdict: does not pass (close).** No blockers; Construction 3/5 because the duvet shows through the runner and hem/fold corners stick out as hard flaps.

## Scores

| Criterion | Score | Notes |
|---|---|---|
| Recognisable | 5 | All five styles and every headboard kind read without labels. |
| Proportions | 4 | Folded throws too thick; fold-back blocky on low platforms. |
| Construction | 3 | Duvet shows through the runner (#14, fresh #17); faceted hem/fold corners (#27, #28, #32, fresh #18); canopy rail shadow stripes. |
| Variety | 5 | All styles, widths, headboards, ladders, drape/tuck, throws. |
| Colour harmony | 4 | A few loud runner/duvet pairs (#40, #32, #5, fresh #17). |
| Grid read | 4 | Profiles separate well; white/cream four-posters fade on the floor. |

## Issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| review #14, fresh #17 | Duvet shows through the runner on the foot hem/corner and across the top. | major | Runner lift too small on drape/corner; runner may use a coarser grid than the duvet so surfaces cross between vertices. |
| review #28, fresh #18 | Fold-back corner sticks out past the side rail as a hard flap. | minor | Fold not clamped to frame inner width or rounded. |
| review #27 | Duvet foot hem corner flares as a flat triangle. | minor | No corner rounding/pinch on `drapeSheet` corners. |
| review #32 | Runner faceted at the foot fold; corner pokes past the footboard post. | minor | Runner grid too coarse; width not clamped with a footboard. |
| review #11, #24, fresh #19, #23 | Thin dark stripes from canopy rail shadows. | minor | Shadow map vs thin rails; consider no `castShadow` on rails. |
| review #3, #23, #31, #41, fresh #12 | Folded throws are rigid thick boxes. | minor | Throw thickness and no edge rounding. |
| review #9, #29 | Fold-back is a thick band hiding pillows on low beds. | minor | Fold thickness/height vs pillow height. |
| review #40, #5, fresh #17 | Loud runner/duvet colour pairs. | minor | Runner accent not constrained relative to duvet hue. |
| review #43, fresh #18 | Pale four-posters wash out at grid distance. | minor | White/cream frame weight for fourPoster. |

Bunks (ladders, guards, stability), pillows (lean, no floating) and four-poster posts checked and fine.

## Coverage

platform 7, slatted 11, upholstered 13, fourPoster 10, bunk 7 (seed `review`).

## Best 3

review #6 (blue channel upholstered, gingham fold), review #10 (oak bunk, side ladder, polka-dot bedding), review #23 (walnut wingback, olive dots).
