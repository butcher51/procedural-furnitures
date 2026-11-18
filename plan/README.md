# Procedural Furnitures — Master Plan

Extend `procedural-chairs` (one seeded generator, three chair styles, a 25×25 showroom grid)
into a generator for a whole furniture catalogue, built by a small team of Claude Code agents
with clear handoffs and human checkpoints.

## Where we start from

`procedural-chairs` (GitHub `butcher51/chair-generator` @ 1964083, imported as the P0 baseline commit) is about 1,100 lines of vanilla JS. It had no build step and no tests.

| File | Role | What carries over |
|---|---|---|
| `chair.js` (662) | Seeded RNG, `generateParams(seed)` → pure data, `buildChair(params)` → merged mesh | RNG, the params/build split, geometry helpers (`puffy`, `strut`, `tube`, `extrudeUp`, `superellipseShape`, `roundedDiscGeometry`, `legAnchors`, `buildLegs`), materials, `mergeByMaterial`, `disposeObject` |
| `main.js` (264) | three.js scene, grid layout, time-sliced build, pop-in reveal, picking, zoom, params panel | Almost all of it, but `renderParams`, `SPACING`, the marker size and the loader text are hard-wired to chairs |
| `index.html` (162) | Warm paper-tone UI, header with seed and regenerate, collapsible params panel, loader | The visual language |
| `server.js` (45) | Zero-dependency static server | As is |

These patterns are worth keeping. Every new furniture type should follow them:

1. **All randomness lives in `generateParams`.** The build step is a pure function of params.
2. **The seed is the URL.** `?seed=abc` always reproduces the same scene.
3. **Merge by material.** Each item costs about 3 draw calls, so hundreds can share the screen.
4. **Real-world units (meters) and ergonomic ranges.** Items look plausible because their sizes are.
5. **Low-poly, flat-shaded, soft bevels.** This is the visual identity.

## Plan documents

| # | Doc | Answers |
|---|---|---|
| 01 | [Vision & scope](01-vision-and-scope.md) | Which furniture, in what order, and why |
| 02 | [Architecture](02-architecture.md) | How generators plug in, the shared kit, the folder layout |
| 03 | [UI & visual style](03-ui-style.md) | Look and feel, layout, interactions |
| 04 | [Agents & skills](04-agents-and-skills.md) | The agent team and the skills they share, with draft definitions |
| 05 | [Orchestration workflow](05-workflow.md) | Phases, handoffs, parallelism, human gates |
| 06 | [Testing strategy](06-testing.md) | Determinism, geometry invariants, visual review, performance |
| 07 | [Backlog](07-backlog.md) | Milestones broken into issue-sized tasks |

## Phases at a glance

```
P0 Bootstrap ──► P1 Refactor ──► P2 Plan ──────────► P3 Build ─────────► P4 Verify ──► P5 Ensembles
 copy repo        core kit +      furniture specs     generators in        tests +        matching sets,
 baseline tests   chair plugin    UI spec + mockup    parallel worktrees   visual review  room scenes
                  golden tests    ★ you approve       UI shell             ★ you approve
```

★ marks a human gate. Agents never pass one on their own.

## Decisions

- [x] **Stay buildless:** vanilla ES modules + CDN importmap.
- [x] **First-wave furniture:** stool, table, bench, sofa. See doc 01.
- [x] **Single-type grid:** the showroom shows one furniture type at a time. A mixed showroom is an unscheduled nice-to-have.
- [x] **Re-roll a single attribute:** yes. Params are generated in named groups, each with its own sub-seed. See doc 02, "Re-roll groups".
- [ ] **Orchestration driver.** Recommended: run P0–P2 from a main Claude Code session. From P3 on, feed the backlog to `claude-orchestrator` as `agent:ready` issues on `butcher51/procedural-furnitures`. See doc 05.
