# 06 — Testing Strategy

Procedural generators fail in specific ways: a rare seed produces a floating leg, a back that intersects the
seat, or a 3 m tall stool. So the strategy is to **sweep many seeds against invariants**, then **look at pictures**.

## Test pyramid

| Layer | Tool | Runs | What it proves |
|---|---|---|---|
| 1. Determinism & golden | `node --test` | every commit | Same seed gives deep-equal params. Old chair seeds are unchanged. |
| 2. Param contracts | `node --test` | every commit | Over 2,000 seeds: every field is defined and finite, inside the spec range, and dependencies hold (e.g. seat h > leg h) |
| 2b. Re-roll isolation | `node --test` | every commit | See "Re-roll tests" below |
| 3. Style distribution | `node --test` | every commit | Over 2,000 seeds, each style is within ±4 pp of its declared weight, and none is missing |
| 4. Geometry invariants | `node --test` (three in Node) | every commit | See below, over 500 seeds per type |
| 5. Budgets | `node --test` + Playwright | every commit / P4 | Triangles and draw calls per item in Node. Build ms and fps in the browser. |
| 6. Visual snapshots | Playwright + `snapshot` skill | P3/P4, PRs | Contact sheets for human and AI review |
| 7. AI visual review | `visual-reviewer` agent | P4 | Aesthetics and plausibility that are hard to assert in code |

## Geometry invariants (layer 4)

Each one runs on the **pre-merge parts** (`def.build(params, kit)`) and on the merged object:

| Invariant | Check |
|---|---|
| Grounded | `bbox.min.y ∈ [-0.001, 0.002]`, so the item touches the floor |
| Sane size | bbox within the spec's max dimensions + 5 % |
| Fits its cell | x/z extent < `cell.spacing − 0.1` |
| Finite | no NaN/Infinity in any position attribute |
| Connected | build an overlap graph of part bounding boxes (expanded by 2 mm). It must be one connected component, which means no floating parts. |
| Stable | the centre of mass (bbox-centre approximation) projects inside the convex hull of floor contact points |
| Front facing | type-specific: e.g. a chair back's z-centre < 0, a sofa's arms are symmetric in x |
| Type-specific | spec-driven, e.g. table top h within its style range, a stool footrest below the seat, shelf boards inside the carcass |

Cheap intersection check for the obvious cases: no two parts of different roles (e.g. seat vs back) may overlap by more
than X % of the smaller part's bbox volume, unless the spec lists them as "joined".

## Re-roll tests

For every type, over 500 seeds:

- **Zero rerolls equal the base.** `rerolls = {}` and `rerolls = { palette: 0, ... }` give identical params. For the chair,
  both also match the golden file.
- **Isolation.** Re-rolling group X changes at least one of X's fields for most seeds (≥ 90 %, so the re-roll is
  visibly doing something). It never changes a field owned by an earlier group. Later groups may only change in fields
  the spec lists as depending on X.
- **Determinism.** The same `(seed, rerolls)` always gives the same params.
- **Round trip.** The URL encode/decode of rerolls is lossless (parser unit test).
- **Invariants hold under rerolls.** The geometry sweep also runs with random reroll maps. Combining groups must not
  produce broken items (e.g. a re-rolled shape on a re-rolled frame).

## Node setup

- `three@0.170.0` as a devDependency. `three/addons/*` resolves via the package exports, so the same
  `src/core` imports work in Node and the browser (the browser uses the importmap).
- Pass `textureFactory = () => null` to materials so no canvas is needed.
- Helper `tests/helpers/sweep.js`: `sweep(type, n, fn)` runs `fn(params, parts, object)` for seeds
  `sweep-${type}-0..n` and collects failures as `{ seed, message }`, so one test reports every failing seed at once.

## Regression seeds

- `tests/regressions/<type>.json` holds a list of `{ seed, reason }`. Each entry is always tested in addition to the sweep.
- Any seed the visual-reviewer flags as a blocker is added here once fixed.

## Visual layer

- App flags for tests: `view=single` (one item, fixed camera, turntable off), `anim=0` (no pop), `item=N`.
- Playwright runs Chromium with `--use-gl=swiftshader` (or `--use-angle=swiftshader`) for deterministic software rendering.
- Pixel-diff snapshots are **advisory at first**, with a high tolerance. Make them blocking once the shading is stable.
- Viewports: 1440×900 desktop and 390×844 phone, for the UI.

## AI visual review rubric

The `visual-reviewer` scores each sheet 1–5 on each criterion and lists the offending seeds:

1. **Recognisable.** You can name the furniture type and style without the label.
2. **Proportions.** Nothing looks too spindly, bloated or toy-like (unless that is the style).
3. **Construction.** No floating parts, nothing poking through, legs reach the floor, joints look plausible.
4. **Variety.** 48 seeds don't feel like 5 repeats. Styles are distinct.
5. **Colour harmony.** Palettes are pleasant, and wood/frame/upholstery combinations make sense.
6. **Grid read.** At overview distance the silhouettes are clear and the scene isn't noisy.

Pass bar for a milestone: no blockers, every criterion ≥ 4, and your own sign-off.

## Performance checks

- `tests/perf/grid.spec.js` (Playwright): load `?type=X&seed=perf`, then measure time-to-fully-built and the average frame
  time over 3 s of orbiting. Budgets: build < 3 s, frame < 16.7 ms on the dev machine. Record the numbers in the PR.

## CI (when using claude-orchestrator)

A GitHub Actions workflow runs `npm ci && npm test` on every PR, with layers 1–5 and no browser. The Playwright layers run
on demand (label `visual`), and the job uploads the contact sheets as artifacts so PR reviews show pictures.
