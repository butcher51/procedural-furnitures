---
name: new-furniture
description: Procedure for scaffolding and finishing a new furniture type from an approved specs/<type>.md — module files, registry entry, test stubs and the done-checklist. Use when a generator-engineer starts implementing a type.
---

# New furniture type

Prerequisites: `specs/<type>.md` is approved (human gate P2) and the kit additions it needs have landed. Load `furniture-kit`.

> Requires the P1 plugin architecture (`src/furniture/registry.js`). If it does not exist yet, stop and report that P1 is not done.

## Steps

1. Create `src/furniture/<type>/`:
   - `index.js` — the FurnitureDefinition (`id`, `label`, `styles`, `cell`, `groups`, `generateParams`, `build`, `describe`), importing from the two files below.
   - `params.js` — one shape function per style plus `generate<Type>Params(g, dna)`. All draws via `g.roll(group, (r) => …)` in the spec's group order. Return `seed`, `type`, `style` and every spec parameter.
   - `build.js` — one builder per style; returns an array of parts in item space. Use kit helpers; anything new stays local and is flagged for the architect.
2. Register: append one import + `register(...)` line to `src/furniture/registry.js`. This is the only shared file you touch.
3. Create `tests/unit/<type>.test.js` covering:
   - determinism (same seed → deep-equal params; same `(seed, rerolls)` → same params)
   - param ranges vs the spec table, over 2,000 seeds
   - style distribution within ±4 pp of weights
   - re-roll isolation per group
   - geometry invariants over 500 seeds (grounded, sane size, fits cell, finite, connected, stable, type-specific)
   - budgets (triangles, draw calls)
4. Create `tests/regressions/<type>.json` as `[]`.
5. Snapshot and verify discover types from the registry; if not, add the type to their lists.
6. Run `verify-furniture` for the type and look at the contact sheet yourself.

## Done checklist

- [ ] Every style in the spec is implemented and appears in the contact sheet
- [ ] `describe()` lists every spec row, grouped by section
- [ ] `npm test` passes; invariants 500/500
- [ ] Budgets met (p95 tris ≤ 6k, draws ≤ 4)
- [ ] Final report contains the verify summary line, the contact sheet path, and any local helpers to promote
