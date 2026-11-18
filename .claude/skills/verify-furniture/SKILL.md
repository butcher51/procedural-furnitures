---
name: verify-furniture
description: The P4 gate for a furniture type — runs unit tests, the 500-seed invariant sweep, the budget report and a snapshot contact sheet, then prints one summary line to paste into a report. Use before reporting a generator done and when the orchestrator merges a branch.
---

# Verify furniture

```bash
npm run verify -- --type chair
```

Prints one line, for example:

```
type: chair   tests: 3/3   invariants: n/a   p95 tris: 5.6k   max draws: 3   p95 build: 5.96 ms (node)   sheet: out/snapshots/chair-verify.png
```

Exit code 0 only if every stage passed. Paste the line into your final report, then `Read` the sheet and look at it.

| Option | Default | Meaning |
|---|---|---|
| `--type` | `chair` | Type to verify |
| `--seed` | `verify` | Snapshot seed |
| `--count` | `48` | Items in the sheet |
| `--no-snapshot` | off | Skip the browser stage (CI) |

## Stages

1. **Tests:** `node --test "tests/unit/**/*.test.js"`. Failing test names are printed under the summary.
2. **Invariants:** `tests/invariants/run.mjs --type T --count 500` prints `invariants: pass/total` plus `known-bad: K` (seeds recorded as `"status": "known-bad"` in `tests/regressions/<type>.json`). Known-bad seeds count as not passing but do not fail the stage; any other failure does.
3. **Budgets:** `scripts/metrics.mjs 500 verify-T --type T --json` over 500 seeds. Compare against `furniture-kit` budgets.
4. **Snapshot:** the `snapshot` skill with `--name <type>-verify`.

## Pass bar

Tests all pass, invariants 500/500, p95 tris ≤ 6k, draws ≤ 4, and the contact sheet has no visibly broken items. Do not report done otherwise.
