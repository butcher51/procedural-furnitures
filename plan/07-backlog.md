# 07 — Backlog

Each task is sized for one agent run and can become a GitHub issue for `claude-orchestrator`
(label `agent:ready`). The **Agent** column names the `.claude/agents` role to put in the issue body.

## M0 — Bootstrap

| # | Task | Agent | Depends |
|---|---|---|---|
| 0.1 | Copy procedural-chairs into the repo and commit the baseline | orchestrator | – |
| 0.2 | package.json scripts + devDeps (three, @playwright/test), `.gitignore` | orchestrator | 0.1 |
| 0.3 | Create `.claude/agents/*` from plan/04 | orchestrator | 0.1 |
| 0.4 | Create skills: `furniture-kit`, `furniture-spec`, `new-furniture` | orchestrator | 0.1 |
| 0.5 | `snapshot` skill + `scripts/snapshot.mjs` (needs `view=single&anim=0` in the app) | ui-engineer | 0.2 |
| 0.6 | `verify-furniture` skill | test-engineer | 0.5 |
| 0.7 | CLAUDE.md + baseline metrics recorded | orchestrator | 0.2 |

## M1 — Plugin architecture

| # | Task | Agent | Depends |
|---|---|---|---|
| 1.1 | Golden capture: chair params + triangle counts for 200 seeds | test-engineer | 0.2 |
| 1.2 | Extract `src/core/*` (rng, color, materials w/ textureFactory, geometry, supports, merge) | architect | 1.1 |
| 1.3 | `src/furniture/chair/` + registry; app consumes the registry | architect | 1.2 |
| 1.4 | `createGroupedRng` (modern + legacy modes); wrap chair draws in groups style → shape → palette → pattern → finish; golden still passes | architect | 1.3 |
| 1.5 | Split main.js into `src/app/*`; generic sectioned panel via `describe()`; `?type=` URL | ui-engineer | 1.4 |
| 1.6 | Sweep helper + invariant suite + re-roll tests, applied to chair (fix or record any existing bad seeds) | test-engineer | 1.4 |
| 1.7 | Texture cache keyed by pattern+colours | architect | 1.2 |
| 1.8 | Re-roll UI: ⟳ per section, counters, shift+click back, reset, in-place rebuild + pop, `&r=` URL, marker dot | ui-engineer | 1.5 |

## M2 — Planning wave 1

| # | Task | Agent | Depends |
|---|---|---|---|
| 2.1 | Spec: stool | furniture-designer | M1 |
| 2.2 | Spec: table | furniture-designer | M1 |
| 2.3 | Spec: bench | furniture-designer | M1 |
| 2.4 | Spec: sofa (grows out of chair `cozy`) | furniture-designer | M1 |
| 2.5 | UI spec + mockup | ux-designer | M1 |
| 2.6 | Spec review + `_kit-additions.md` | architect | 2.1–2.4 |
| 2.7 | ★ Human approval | you | 2.5, 2.6 |
| 2.8 | Implement kit additions (apron, stretchers, trestle, footrest ring, cushion splitter) | architect | 2.7 |

## M3 — Build & verify wave 1

| # | Task | Agent | Depends |
|---|---|---|---|
| 3.1 | App shell: type switcher, per-type grid cells, view controls, keyboard, phone layout | ui-engineer | 2.7 |
| 3.2 | Stool generator | generator-engineer | 2.8 |
| 3.3 | Table generator | generator-engineer | 2.8 |
| 3.4 | Bench generator | generator-engineer | 2.8 |
| 3.5 | Sofa generator | generator-engineer | 2.8 |
| 3.6 | Visual review loop per type (≤ 3 iterations) | visual-reviewer ↔ generator-engineer | 3.2–3.5 |
| 3.7 | Perf test + CI workflow | test-engineer | 3.1 |
| 3.8 | ★ Human approval of wave 1 | you | 3.6, 3.7 |

## M4 — Wave 2 (shelf, cabinet family, desk, bed)

Same shape as M2 + M3. These kit additions come first and are architect-led:
- `fronts.js`: drawer/door layout solver, handle and knob library
- shelf filler: procedural books, boxes and small objects (instanced or merged; decide via budget)
- soft goods: mattress, pillows, duvet

## M5 — Wave 3 (lamps, plants & pots, rugs, wardrobe)

- Emissive material role. Real light only for the selected item.
- Lathe helpers for shades and pots.
- Optional dark "evening" theme.

## M6 — Ensembles

| # | Task | Agent |
|---|---|---|
| 6.1 | `core/dna.js`: style DNA from seed; generators consume `dna` | architect |
| 6.2 | Set compositions: dining, living, bedroom (placement rules) | furniture-designer → generator-engineer |
| 6.3 | Ensemble view in UI | ux-designer → ui-engineer |
| 6.4 | Room mode (stretch) | – |

## Nice-to-haves (unscheduled)

- Export the selected item as GLB (`GLTFExporter`)
- PNG screenshot button
- Mixed showroom: a weighted mix of all types in one grid (the default stays one type at a time)
- Re-roll history filmstrip
- Turntable "solo" view with a soft studio background
- Favourites list stored in localStorage, shareable as a seed list
