# Shelf visual review 1

Branch `wave2-integration`, seed `review` (48, 640 px close-ups of all) + `fresh` (24) + 1000 px confirmations. No page errors. Report by the visual-reviewer agent; saved by the orchestrator.

**Verdict: does not pass.** No blockers; Construction 3/5 from two leaning-shelf problems.

## Scores

| Criterion | Score | Notes |
|---|---|---|
| Recognisable | 5 | Five distinct silhouettes. |
| Proportions | 4 | 1-column cube towers read as columns; narrow pale leaning units look spindly. |
| Construction | 3 | Leaning: tall books stand in front of the near rail; a picture frame leans on nothing; lone upright books. |
| Variety | 5 | Bases, posts, braces, backs, bins and contents moods all vary. |
| Colour harmony | 4 | Mostly calm; #32 loud; tonal covers merge with same-hue boards. |
| Grid read | 4 | Silhouettes separate; charcoal bins read as holes. |

## Issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| review #1, #9, #20 (#24, fresh #6, #17) | Leaning: tall books stand in front of the near rail. | major | Bay `zFront` taken where the rail crosses the board; the rail leans back by `y·tanθ` above it. Use the rail position at `y + clear` or `inset ≥ h·tanθ + 5 mm`. `decorInside` uses an axis-aligned box and misses it. |
| review #20 | Picture frame leans back on nothing (no back panel). | major | `layoutShelfContents` allows `frame` on every leaning bay; gate on `backKind === 'panel'`. |
| review #10, #39, #40 | Lone upright books with no neighbour. | minor | Runs of 1 book in sparse/styled moods; minimum run 3 or lay/lean singles. |
| review #7, #29 | Tonal covers merge with same-hue boards. | minor | Contrast rule checks lightness only. |
| review #32 | Loud colourway. | minor | Accent back on a saturated painted frame. |
| review #35 | All-ochre tonal books. | minor | Narrow tonal shade range. |
| review #25 | Charcoal bins read as black holes. | minor | Bin colour from dark covers; keep L ≥ 0.3. |
| review #3, #43, fresh #6 | Sparse bays with tiny orbs look empty. | minor | Small orb/bowl picks in sparse mood. |
| review #19, #27, #46 | Bold grain swirls on vertical panels. | minor | `bold` grain on wide panels/crates/dividers. |
| review #12 | Ladder top-shelf books almost touch the rung. | minor | Top-bay clear ignores the rung. |
| fresh #12 | 1 × 5 cube tower reads as a column. | minor | Cap rows at 4 when cols = 1. |
| fresh #16, #23 | Narrow pale leaning units vanish. | minor | Width ~0.45 + light frame + sparse. |

## Coverage (500 seeds)

bookcase 29 %, cube 22 %, leaning 15 %, open 18 %, ladder 16 %.

## Best 3

review #36 (tall bookcase on tapered legs, classic library), review #45 (white 4 × 4 cube with bins), review #15 (dark leaning shelf with sage back and a picture frame).
