# Patterns visual review 1

Branch `m3b-patterns-mix` @ 419753d, seed `pat`. Stool, table, bench and sofa items 1–24 at 480 px with 640 px close-ups; All view 24 items, desktop overview and phone. No page errors. Report written by the visual-reviewer agent; saved by the orchestrator.

**Verdict: does not pass.** One blocker (motifs tear on ~45° facets of round/faceted cushions) and three majors (linen/bouclé too strong; early angle-dependent fade; pinstripe wood on wide tops). Wood on legs, slats, boards and most tops reads as real wood; every type fades to calm flat colour at grid distance with no moiré.

## Scores

| Criterion | Score | Notes |
|---|---|---|
| Recognisable | 5 | Patterns never hide the type or style. |
| Proportions | 4 | Pattern scale sensible on sofas and benches (5 cm dots, 10 cm flowers); floral too large on small stool cushions. |
| Construction | 4 | No new floating or intersecting parts; the blocker is a shading fault. |
| Variety | 5 | All 8 kinds appear; good pattern pairings. |
| Colour harmony | 4 | Mostly tonal; a few loud or muddy pairs (bench #11, stool #5, All Stool 9). |
| Grid read | 4 | Overviews stay calm; bouclé items look mottled at sheet size. |

Per type: stool 3.5, table 4, bench 4, sofa 4, All 4.

## Issues

| Type | Item | Problem | Severity | Suspected cause |
|---|---|---|---|---|
| stool | pat #22, #9, #10; All Stool 9, Stool 24 | Flowers and dots break into dithered, torn fragments on cushion/drum facets facing the camera at ~45°. | **blocker** | `patterns.js` picks the projection axis from the `dFdx`/`dFdy` face normal; when \|nx\| ≈ \|nz\| derivative noise flips x/z projection per pixel inside one facet. Needs a stable per-face choice (bias/hysteresis or flat vertex normals). |
| stool / bench / sofa | stool #3, #5, #6; bench #12, #14, #16, #19, #21; sofa #3, #6, #8, #12 | Linen reads as coarse plaid/burlap; bouclé reads as camouflage/marble with 1–2 cm blotches. | major | `linen` strength 0.6 too high; bouclé loop cell too large; slub colours too far from the base. |
| sofa / bench / stool | sofa #22; bench #12, #16; All Stool 24 | Detail fades too early on faces seen at a grazing angle, so identical cushions look different. | major | Fade footprint uses the larger (anisotropic) screen derivative; use a gentler/isotropic footprint or a later threshold. |
| table | pat #5 (also stool #13, #20) | Wood top shows evenly spaced parallel lines; reads as pinstripes. | major | Ring centre far off-part makes near-parallel rings on wide flat tops; little figure or spacing jitter on `fine`. |
| table | pat #8 | Round shelf grain ~30° off the top's grain. | minor | No explicit `grainAlong(…, 'x')` on round shelf discs. |
| table | pat #2, #3, #6 | Dark wood tops show almost no grain. | minor | `plain` contrast too low at low lightness. |
| stool | All Stool 9, pat #22 | Floral motifs too large for a 0.4 m seat; dark petals on navy look like stains. | minor | Floral spacing not scaled to part size; `dark` harmony used for petals. |
| sofa | pat #15, #22 | Flowers cut into fragments along cushion front bevels. | minor | Hard projection switch on bevel facets. |
| bench | pat #10 | Faint dotted vertical line on the upper back board near the right post. | minor | Grain/merge seam or slight z-fighting. |
| bench | pat #11 | Periwinkle dots on ochre are a loud complement. | minor | `complement` harmony on warm bases. |
| all | overview, phone | Desktop: grid sits left of centre under the panel, right ~15% empty. Phone: top ~300 px empty floor, grid cut on both sides. | minor | Camera framing ignores panel width and All grid extent. |

## Best items

| Type | Best 3 |
|---|---|
| Stool | #23, #12, #8 |
| Table | #17, #9, #21 |
| Bench | #10, #18, #11 |
| Sofa | #15, #9, #16 |
| All | Centre of the overview around the mustard L-sectional (contact sheet items 14–18). |
