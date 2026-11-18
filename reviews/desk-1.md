# Desk visual review 1

Branch `wave2-integration`, seed `review` (48, close-ups of all) + `fresh` (24) + 1100 px zooms. No page errors. Report by the visual-reviewer agent; saved by the orchestrator.

**Verdict: passes the bar** (no blockers, every criterion 4). Three majors recommended before sign-off.

## Scores

| Criterion | Score | Notes |
|---|---|---|
| Recognisable | 4 | Pedestal, standing, panel/waterfall and boxed trestles read as desks; drawer-less writing desks and box-less trestles read as tables. |
| Proportions | 4 | Heights, knee holes and props plausible; spindly turned legs; inlay shrinks to a runner under a riser. |
| Construction | 4 | Grounded, no visible handle float; pen cup clips the gallery wing (3/72). |
| Variety | 4 | Good spread; double pedestals rare (~6.5 %). |
| Colour harmony | 4 | One clash (purple paint around cognac leather). |
| Grid read | 4 | Clean; plain trestles/writing desks blend into a field of tables. |

## Issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| review #18, #23, fresh #9 | Pen cup clips the gallery rail's side wing. | major | `propZones` only reserves the rail board thickness, not its 0.12–0.18 m wings. |
| review #1, #6, #19, #27, #45, #46; fresh #8, #11 | Writing desks with no visible drawer cue read as small tables. | major | `apronDrawers` 0 at 0.12 and `groove` handles (invisible at apron scale) at 0.25. |
| review #13, #37, #40 (trestles) | Back rail hidden under the top; box-less trestles read as trestle tables. | major | `backRail` sits directly under the cleats; hung-box chance 0.35. |
| review #35 | Laptop touches the book stack on a narrow riser desk. | minor | Laptop zone not clamped against the book zone. |
| review #27, #34 | Inlay becomes a thin runner with a riser on shallow tops. | minor | Inset + riser depth leave < 0.25 m. |
| review #14 | Tab on a hung box drawer mounted vertically. | minor | Tab orientation on short wide drawers. |
| fresh #23 | Turned legs too thin to read. | minor | `legThickness` 0.035–0.055 for `turnedPost`. |
| review #6 | Purple paint around cognac leather. | minor | Paint and leather drawn independently. |
| review #7, #12, #22, #38 | Groove/match handles make pedestal stacks read as panels. | minor | Groove 0.15 and match knobs. |
| sweep | Double pedestals ~6.5 % vs 11 % nominal. | minor | Double → single demotion on tops < 1.5 m. |

## Coverage

writing 25 %, pedestal 27 % (double 6.9 %, single 14.2 %, hung 6.2 % of all), trestle 16 %, standing 18 %, panel 14 % over 2,000 items.

## Best 3

review #21 (double pedestal, green body, ash fronts), review #15 (mid-century hung pedestal), review #3 (X-trestle with hung drawer and riser).
