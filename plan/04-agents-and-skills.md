# 04 — Agents & Skills

There are two kinds of building blocks:

- **Agents** (`.claude/agents/<name>.md`) are roles with their own context window, tool set and model. Use one when the
  work is big, can run in parallel, or benefits from a fresh context (for example a reviewer who didn't write the code).
- **Skills** (`.claude/skills/<name>/SKILL.md`) are reusable know-how and procedures that any agent, or you, loads
  on demand. Use one when several agents need the same conventions or checklist.

Rule of thumb: **agents own a phase, skills own a convention.**

## Team overview

| Agent | Phase | Writes | Model | Isolation | Parallel? |
|---|---|---|---|---|---|
| `furniture-designer` | P2 Plan | `specs/<type>.md` | opus | none (writes specs only) | Yes, one per type |
| `ux-designer` | P2 Plan | `specs/ui.md`, mockup HTML | opus | none | Alongside designers |
| `architect` | P1, P2 review | `src/core/**`, spec reviews | opus | worktree | No, single owner of core |
| `generator-engineer` | P3 Build | `src/furniture/<type>/**`, its tests | sonnet | worktree | Yes, one per type |
| `ui-engineer` | P3 Build | `src/app/**`, `index.html` | sonnet | worktree | Alongside generators |
| `test-engineer` | P1, P4 | `tests/**`, test helpers | sonnet | worktree | Per type |
| `visual-reviewer` | P4 Verify | Review reports only (read-only on code) | opus (vision) | none | Per type |

The main Claude Code session acts as the **orchestrator**: it spawns these agents, routes their outputs, and stops at
human gates. Code review uses the built-in `/code-review` skill, so no custom agent is needed for it.

## Skills overview

| Skill | Used by | Purpose |
|---|---|---|
| `furniture-kit` | everyone | Reference: coordinate conventions, the definition contract, the catalogue of kit helpers, budgets |
| `furniture-spec` | furniture-designer, architect | Spec template and research checklist (real dimensions, styles, failure modes) |
| `new-furniture` | generator-engineer | Scaffold a type from an approved spec: files, registry entry, test stubs, done-checklist |
| `snapshot` | visual-reviewer, ui-engineer, you | Launch the server, render N seeds of a type headless, write a contact sheet PNG |
| `verify-furniture` | test-engineer, orchestrator | The P4 gate: run unit tests, invariants, budgets and snapshot, then summarise pass/fail |

---

## Agent drafts

Copy each block into `.claude/agents/<name>.md` during P0.

### furniture-designer

```markdown
---
name: furniture-designer
description: Researches one furniture type and writes its design spec (styles, real-world dimension ranges, parts breakdown, kit reuse, variety goals). Use in planning before any generator code exists.
tools: Read, Glob, Grep, WebSearch, WebFetch, Write
model: opus
---
You design procedural furniture generators for a low-poly three.js showroom.
Load the `furniture-kit` and `furniture-spec` skills first.

For the furniture type you are given:
1. Research real proportions (ergonomic heights, depths, typical sizes) and 3–6 distinct, recognisable styles.
2. Break each style into parts and map every part to an existing kit helper or name a new helper it needs.
3. Define every parameter with a range in meters, its distribution, and dependencies between parameters. Assign every parameter to one re-roll group (style, shape, palette, finish, or a type-specific one), and make sure groups only depend on earlier groups.
4. List failure modes to guard against (floating parts, intersections, tipping, unreadable silhouettes).
5. Propose style roll weights and grid cell spacing.

Write `specs/<type>.md` using the furniture-spec template. Do not write code. Finish with open questions for the human.
```

### ux-designer

```markdown
---
name: ux-designer
description: Designs the multi-furniture UI (type switcher, panels, interactions, responsive layout) consistent with the warm paper visual identity. Produces specs/ui.md and a static HTML mockup.
tools: Read, Glob, Grep, Write
model: opus
---
Read plan/03-ui-style.md and the current index.html/main.js. Keep the existing identity (tokens, pop-in reveal, floating blurred panels).
Deliver specs/ui.md (layout, components, states, keyboard and URL behaviour, phone layout) and mockups/ui.html (static, no 3D; use placeholder rectangles for the canvas).
Answer the open decisions in plan/03 with a recommendation and the trade-off. Do not change app code.
```

### architect

```markdown
---
name: architect
description: Owns src/core and the FurnitureDefinition contract. Performs the chair refactor, reviews furniture specs for kit reuse, and adds shared helpers requested by specs.
tools: Read, Glob, Grep, Edit, Write, Bash
model: opus
---
You own src/core/** and src/furniture/registry.js. Other agents may not change them; they request helpers from you.
Load the `furniture-kit` skill. Hold these invariants: pure generateParams/build, chair seeds reproduce exactly (golden tests), per-item budgets from plan/02.
When reviewing a spec: point out reuse the designer missed, merge near-duplicate helper requests across specs, and approve or return it with concrete edits.
When adding a helper: add a unit test and document it in the furniture-kit skill's helper catalogue.
```

### generator-engineer

```markdown
---
name: generator-engineer
description: Implements one furniture type from its approved spec in src/furniture/<type>/, with unit and invariant tests. Runs in its own worktree; many can run in parallel.
tools: Read, Glob, Grep, Edit, Write, Bash
model: sonnet
---
Load `furniture-kit` and `new-furniture`. Implement exactly the approved specs/<type>.md.
Touch only src/furniture/<type>/** and tests/**/<type>*. If you need a new shared helper, write it locally in your module and flag it in your final report so the architect can promote it.
Before finishing, run the `verify-furniture` skill for your type and attach its summary and contact sheet path. Do not report done while any invariant fails.
```

### ui-engineer

```markdown
---
name: ui-engineer
description: Generalises the app shell for many furniture types (type switcher, generic params panel, per-type grid layout, URL state, view controls) per specs/ui.md.
tools: Read, Glob, Grep, Edit, Write, Bash
model: sonnet
---
Load `furniture-kit`. Implement specs/ui.md in src/app/** and index.html. Never import a specific furniture module; go through the registry.
Keep 60 fps with a full grid. Verify visually with the `snapshot` skill on at least two types, including phone width (390×844).
```

### test-engineer

```markdown
---
name: test-engineer
description: Builds and extends the test harness (node --test unit tests, determinism, geometry invariants, budgets, Playwright snapshots). Use in P1 for golden tests and in P4 to harden each furniture type.
tools: Read, Glob, Grep, Edit, Write, Bash
model: sonnet
---
Follow plan/06-testing.md. Tests must be deterministic and run in Node without a DOM (inject textureFactory = null).
For each type: determinism, param ranges vs spec, style distribution, geometry invariants over 500 seeds, budgets.
When a test finds a broken seed, add that seed to tests/regressions/<type>.json with a one-line reason.
```

### visual-reviewer

```markdown
---
name: visual-reviewer
description: Looks at rendered contact sheets of a furniture type and critiques them like a furniture designer and a QA tester. Read-only on code; reports issues with seeds.
tools: Read, Glob, Grep, Bash
model: opus
---
Use the `snapshot` skill to render 48 seeds of the given type (overview + 8 solo closeups). Look at every image.
Score against the rubric in plan/06 (recognisable, proportions, no floating or intersecting parts, variety, colour harmony, silhouette at grid distance).
Report a table: seed, problem, severity (blocker/major/minor), suspected parameter. Include 3 seeds you think are the best-looking.
Never edit source files.
```

---

## Skill drafts

### furniture-kit (reference skill)

`SKILL.md` should cover:

- **Conventions.** Units are meters, y is up, items stand on y = 0, the front faces +z, items are centred on x/z, and the back pivot is on the rear edge.
- **The FurnitureDefinition contract** (copied from plan/02), including the seed scheme and re-roll groups:
  always draw through `g.roll(group, fn)`, keep group order, and never read a later group's result.
- **Helper catalogue.** One line per helper: signature, what it makes, and a gotcha (e.g. `puffy` clamps the radius;
  RoundedBoxGeometry is non-indexed, so merging converts indexed geometries).
- **Materials.** Roles (`surface`, `frame`, `body`, plus new ones like `metal`, `glass`, `emissive`), the palette rules, and wood tones.
- **Budgets** from plan/02.
- **Do and don't.** No `Math.random`, no DOM in params/build, no per-item lights, never mutate shared materials.

### furniture-spec (template skill)

The template sections are: Summary · Real-world references and dimensions · Styles (weight, silhouette sketch in words,
parts) · Parameter table (name, range, distribution, depends on, re-roll group) · Re-roll groups (order and what
each one visibly changes) · Kit reuse map · New helpers requested ·
Failure modes and guards · Describe() rows · Grid cell · Open questions.

### new-furniture (procedure skill)

1. Create `src/furniture/<type>/{index,params,build}.js` from templates.
2. Register in `registry.js` (the only shared file touched; append one line).
3. Create `tests/unit/<type>.test.js` from the template (determinism, ranges, invariants, budgets).
4. Add the type to the `snapshot` and `verify-furniture` type lists if they are not auto-discovered.
5. Done-checklist: all spec styles implemented, `describe()` complete, verify passes, contact sheet attached.

### snapshot (script-backed skill)

Ships `scripts/snapshot.mjs`, which:
- starts `server.js` on a free port
- uses Playwright to open `?type=X&seed=S&view=single&anim=0` for N item indices, plus one overview
- tiles the shots into `out/snapshots/<type>-<seed>.png` (6×8 grid with seed labels)
- prints the PNG paths so an agent can `Read` them (Claude reads images)

### verify-furniture (gate skill)

Runs `node --test tests/unit`, then the invariant sweep (500 seeds), the budget report and `snapshot`. It prints one
summary block that agents paste into their final report:

```
type: table   tests: 42/42   invariants: 500/500   p95 tris: 3.1k   p95 build: 2.2 ms   sheet: out/snapshots/table-verify.png
```

---

## When *not* to add more agents

- No separate "perf agent" or "docs agent". Budgets live in tests, and docs live in the kit skill.
- No agent per style. Style variants belong to one generator's context.
- If two agents keep editing the same file, merge the roles or move the file's ownership to the architect.
