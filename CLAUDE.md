# Procedural Furnitures

Seeded, low-poly three.js furniture showroom. Grows the `procedural-chairs` baseline (`butcher51/chair-generator` @ 1964083) into a whole furniture catalogue, built by a team of Claude Code agents.

## Start here

- Master plan: `plan/README.md`. Architecture: `plan/02-architecture.md`. Backlog and current milestone: `plan/07-backlog.md`.
- Working reference for generators and core helpers: the `furniture-kit` skill.
- Agents live in `.claude/agents/`, skills in `.claude/skills/`. Agents own a phase; skills own a convention.

## Layout

`src/core/` shared kit (architect-owned) · `src/furniture/<type>/` one plugin per type, registered in `src/furniture/registry.js` · `src/app/` the showroom shell (never imports a specific type) · `tests/unit` node tests incl. the chair golden test against `tests/golden/`.

## Commands

| Command | What |
|---|---|
| `npm start` | Static server on http://localhost:3000 (`PORT` overrides) |
| `npm test` | `node --test` over `tests/unit/**/*.test.js` |
| `npm run snapshot -- --type chair --seed abc` | Contact sheet PNG in `out/snapshots/` |
| `npm run verify -- --type chair` | Gate: tests + invariants + budgets + snapshot, one summary line |
| `npm run metrics -- [count] [prefix] [--type T] [--json]` | Triangles / draw calls / build ms over 500 seeds per type |
| `node tests/invariants/run.mjs [--type T] [--count N]` | Geometry invariant sweep, prints `invariants: pass/total` |

First-time setup: `npm install && npx playwright install chromium`.

## Conventions

- **Buildless.** Native ES modules, three.js 0.170.0 via importmap in the browser and via the npm devDependency in Node.
- **All randomness lives in `generateParams`.** `build` is a pure function of params. No `Math.random`, no DOM in params/build.
- **The seed is the URL.** Existing chair links (`?seed=abc`, item seeds `${seed}-${n}` from 1) must reproduce exactly: same params, so the same chair design, colours and dimensions.
- **Merge by material**, real-world meters, low-poly flat shading with soft bevels.
- URL state: `?type=&seed=&item=N&view=single&anim=0&r=42.palette2.shape1~7.finish1`. `html[data-ready]` is set when the scene is built.
- The chair golden test (`tests/unit/chair-golden.test.js`) must always pass. `chair-params.json` is frozen and never regenerated. `chair-geometry.json` (triangle counts, position checksums) may only change through a deliberate, human-approved geometry fix, regenerated with `tests/golden/update-geometry.mjs` and reviewed per style; the curvy-feet and classic-bevel fix (PR #4) is the one such change so far.
- **No code comments.** Write self-explanatory names instead. Leave existing baseline comments alone unless you are rewriting that code.
- Ownership: `src/core/**` and `src/furniture/registry.js` belong to the architect. Generator engineers touch only `src/furniture/<type>/**` and their tests.
- Human gates (★ in the plan) are never passed by an agent.

## Baseline metrics (chair, 500 seeds, Node 22, after the curvy-foot and thin-bar fixes)

| Group | n | tris p50 | tris p95 | tris max | draws max | build ms p50 | build ms p95 |
|---|---|---|---|---|---|---|---|
| all | 500 | 2,640 | 4,212 | 5,392 | 3 | 2.79 | 5.13 |
| classic | 181 | 3,316 | 4,580 | 5,392 | 2 | 3.71 | 5.39 |
| cozy | 171 | 3,020 | 4,164 | 4,180 | 3 | 3.16 | 4.67 |
| curvy | 148 | 1,552 | 1,820 | 1,820 | 2 | 1.41 | 2.51 |

Every chair is within the 6k triangle budget (2,000-seed classic max 5,392; slats and rails use 2 bevel segments). Curvy legs stand on ferrule feet at y = 0. Build times are Node timings; browser timings come with the perf test (backlog 3.7).
