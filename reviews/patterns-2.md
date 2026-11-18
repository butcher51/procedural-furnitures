# Patterns visual review 2

Branch `m3b-patterns-mix` @ 3e859c7. Seeds `pat` (24 per type + 640 px close-ups of every round-1 item) and `pat3` (16 per type); All view 12 solo + overview + phone. No page errors. Report by the visual-reviewer agent, saved by the orchestrator.

**Verdict: patterns pass.** No blockers; every criterion ≥ 4. One major regression outside the shaders (solo view shifted right by the panel inset, cropping wide items) was fixed in the follow-up commit by skipping the panel inset in solo view.

## Scores

| Criterion | Score |
|---|---|
| Recognisable | 5 |
| Proportions | 5 |
| Construction | 5 |
| Variety | 5 |
| Colour harmony | 4 |
| Grid read | 5 |

Per type: stool 4.5, table 4, bench 4.5, sofa 4.5, All 4.5.

## Round-1 items

| Item | Status |
|---|---|
| Torn motifs on ~45° facets (blocker) | fixed |
| Linen/bouclé too strong | fixed |
| Early fade at grazing angles | improved (minor: speckle fades over the far half of long bench tops; sofa #22 left cushion lower contrast) |
| Pinstripe wood (table #5, stool #13, #20) | improved (minor: right half of table #5 and stool #13 still even stripes) |
| Table #8 shelf grain | fixed |
| Dark tops without grain (table #2, #3, #6) | improved (minor: #2, #6 still flat) |
| Stool floral size / dark petals | fixed / improved (All Stool 9 navy on periwinkle) |
| Sofa flowers cut on bevels | fixed |
| Bench #10 dotted line | fixed on #10; similar faint dots on white slats of `pat3` #10 |
| Bench #11 loud dots | still minor |
| All framing | fixed desktop; phone fits but small |

## New issues

| Item | Problem | Severity | Status |
|---|---|---|---|
| solo view, all types | Items shifted ~14% right, wide items cropped | major | fixed (panel inset skipped in solo) |
| stool #7 | Dark mahogany seat: high-contrast regular stripes and an "eye" | minor | deferred |
| per-type desktop overviews | Left column under the panel, right column off screen | minor | fixed (width fit factor 1.4) |
| bench `pat3` #10 | Faint pink dotted lines on white back slats | minor | deferred |

## Best items

Overall: sofa `pat` #15, stool `pat` #22, table `pat3` #4. Stool #22, #14, #12 · Table #8, #17, `pat3` #4 · Bench #15, #20, #10 · Sofa #15, #9, #10.
