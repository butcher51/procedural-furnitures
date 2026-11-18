# Cabinet visual review 1

Branch `wave2-integration`, seed `review` (48, 640 px close-ups of all) + `fresh` (24) + 900 px of #1/#2. No page errors. Report by the visual-reviewer agent; saved by the orchestrator.

**Verdict: passes the bar** (no blockers, every criterion ≥ 4). One major to fix before sign-off.

## Scores

| Criterion | Score | Notes |
|---|---|---|
| Recognisable | 4 | All four kinds and four styles read without labels; #1 reads as a bench; mid-century on slab ends is close to modern. |
| Proportions | 4 | Graduation, door widths and 6-leg rule right; heavy industrial tops on small nightstands. |
| Construction | 4 | Nothing floats; no visible handle float on framed fronts; #1 collapses to an open cell. |
| Variety | 5 | 8 base kinds, 22 templates, 8 handle kinds in 72 items. |
| Colour harmony | 4 | Mostly calm; a few loud/murky accent pairs; black-on-black loses face detail. |
| Grid read | 4 | Kinds separate by footprint/height. |

## Issues

| Item | Problem | Severity | Suspected cause |
|---|---|---|---|
| review #1 (mc TV3) | Drawer row dropped; the face is one open cell, reads as a bench. 4/4 collapsed TV3s in a 1000-seed sweep had zero fronts. | major | `solveFronts` degrade (b) drops the last child (drawers) instead of shrinking/dropping the open cell; short TV bodies from tall legs + inset panels. |
| review #9, #37 | Centre door of a 3-bay sideboard hinges left, so its handle pairs with door 3. | minor | `hinge: 'auto'` for odd bay counts. |
| review #2, #41 | Knob heads look lumpy under flat shading. | minor | Knob lathe: 8 sides + domed head facets. |
| review #2, fresh #20 | Centred knob on short nightstand doors reads low. | minor | Short-door centring rule. |
| review #5, #16 | Groove backer in the body material reads as a stile or vanishes. | minor | Groove backer should use a shadow tone. |
| review #17, #24, #27, #48 | High-contrast striped grain on small framed panels and large walnut ends. | minor | Backlog pinstripe wood, louder here. |
| review #19 | Lip reads as a bar below the top edge; brass looks olive on cream. | minor | Lip y origin on inset fronts; brass lightness. |
| review #46 | Cane renders as a blank panel at 640 px. | minor | `dots` spacing too fine. |
| review #10, #21 | `frameLegs` rail barely visible. | minor | Apron too short under overlay fronts. |
| review #32, #41, fresh #15 | Loud/murky painted accent pairs. | minor | `accentColor` complement on painted body + fronts. |
| review #43, #47, fresh #12 | Black-on-black loses detail; oxblood tabs vanish on black. | minor | Very dark paint + match fronts; tab contrast. |
| review #17, #27, #39, fresh #16 | Wood hardware on matching wood fronts is invisible. | minor | By design; could shade one step darker. |
| review #26 | Cream plinth disappears on the floor. | minor | Body-colour plinth on near-white paint. |

## Best 3

review #28 (mid-century sideboard, oak, steel bars), review #4 (shaker tall chest, cherry, brass cups), review #37 (industrial sideboard, perforated doors, hairpins).
