# 05 — Orchestration Workflow

## Roles

- **You:** product owner. You approve scope, specs, UI and final visuals.
- **Orchestrator:** the main Claude Code session in `procedural-furnitures`. It spawns agents, merges their branches,
  and keeps `plan/07-backlog.md` current.
- **Agents:** see doc 04.

## Phase by phase

### P0 — Bootstrap (orchestrator, ~1 session)

1. Copy `procedural-chairs` into this repo and make an initial commit ("baseline from procedural-chairs").
2. Add `package.json` scripts: `start`, `test` (`node --test tests/unit`), `snapshot`, `verify`. Add devDeps `three@0.170.0` and `@playwright/test`.
3. Create the `.claude/agents/*` and `.claude/skills/*` files from doc 04.
4. Add a `CLAUDE.md`: project conventions, links to `plan/`, and the "no code comments" preference.
5. Record baseline metrics: triangles, draw calls and build time for chairs.

**Exit:** the app runs from this repo, and the agents and skills load (`/agents` lists them).

### P1 — Refactor to plugin architecture (architect + test-engineer)

```
test-engineer: capture golden chair params (200 seeds) + triangle counts   ─┐
                                                                            ├─► architect: split into core/ + furniture/chair/ + app/
                                                                            │
                                    golden + new unit tests must pass  ◄────┘
```

**Exit:** the golden tests pass, `?seed=` links from the old app render identical chairs, and the registry has one entry.

### P2 — Plan (parallel designers → architect review → ★ you)

```
furniture-designer ×4 (stool, table, bench, sofa)  ─┐
ux-designer                                         ├─► architect reviews specs: reuse, shared helper list
                                                    │
                                     ★ HUMAN GATE: you approve specs/*.md + mockups/ui.html
```

- The designers run in parallel and only write `specs/`, so they need no worktree.
- The architect produces `specs/_kit-additions.md`, the deduplicated list of new shared helpers.
- After you approve, the architect implements the kit additions **before** P3 starts. This is the main tool for
  avoiding merge conflicts.

### P3 — Build (parallel engineers in worktrees)

```
                     ┌─ generator-engineer: stool   (worktree feat/stool)  ─┐
main (core frozen) ──┼─ generator-engineer: table   (worktree feat/table)  ─┼─► orchestrator merges one at a time,
                     ├─ generator-engineer: bench   (worktree feat/bench)  ─┤   re-running verify after each merge
                     ├─ generator-engineer: sofa    (worktree feat/sofa)   ─┤
                     └─ ui-engineer: app shell      (worktree feat/ui)     ─┘
```

- **Ownership prevents conflicts.** Each engineer touches only its own folder. `registry.js` is append-only, one line each.
- **Core is frozen during P3.** A helper request goes to the architect as a follow-up task, and the engineer keeps a local copy until it lands.
- Merge order: the UI shell first (type switcher), then generators in any order.

### P4 — Verify (test-engineer + visual-reviewer loop → ★ you)

```
for each type:
  test-engineer hardens tests ─► verify-furniture ─► visual-reviewer critiques contact sheet
        ▲                                                         │
        └──── generator-engineer fixes blockers/majors ◄──────────┘   (max 3 loops, then escalate to you)
/code-review on the merged diff
★ HUMAN GATE: you look at the contact sheets + reviewer's "best 3", approve the milestone
```

### P5 — Ensembles & beyond

Repeat P2–P4 for waves 2–4. Wave 4 (style DNA) is an architect-led change to `core/dna.js`, followed by a
small change in each generator so it consumes `dna`.

## Ways to drive it

| Option | How | Best for |
|---|---|---|
| **A. Main session + Agent tool** | In Claude Code: "spawn 4 furniture-designer agents for stool, table, bench, sofa". For P3, ask for `isolation: worktree` per engineer. | P0–P2: interactive, lots of back-and-forth with you |
| **B. Workflow script** | Ask Claude to "use a workflow" for a phase, such as P3+P4 per type (build → verify → review → fix loop). It runs deterministically in the background. | Repeating P3/P4 for waves 2–3 once the loop is proven |
| **C. claude-orchestrator** | Turn `plan/07-backlog.md` tasks into GitHub issues on `butcher51/procedural-furnitures` and label them `agent:ready`. Each one gets a worktree, an agent and a PR, and you watch from the dashboard. | P3 onward. You review PRs, CI runs `npm test`. |

Recommended path: use **A** for P0–P2, then switch to **C** for P3+. Each backlog item already has an issue-sized scope and
an "agent" field naming which `.claude/agents` role should pick it up. Put that role name in the issue body
("Act as the generator-engineer agent…").

## Handoff artefacts

| From → To | Artefact |
|---|---|
| designer → architect → you | `specs/<type>.md` |
| ux-designer → you → ui-engineer | `specs/ui.md`, `mockups/ui.html` |
| architect → engineers | `specs/_kit-additions.md` + the updated `furniture-kit` skill |
| engineer → orchestrator | Branch + verify summary + contact sheet path |
| visual-reviewer → engineer | `reviews/<type>-<n>.md` (seed table) |
| test-engineer → everyone | `tests/regressions/<type>.json` |

## Human gates checklist

- [ ] After P0: the baseline runs and the agents load
- [ ] After P2: specs approved (styles, ranges, what's cut), UI mockup approved
- [ ] After P4 per milestone: contact sheets look good, no blocker seeds, performance budgets met
