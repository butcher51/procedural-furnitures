# Shelf spec

## Summary

A shelf (bookcase) is a frame of vertical supports and horizontal boards that stands on the floor, filled with books
and a few objects. The frame alone is a simple box of boards. What makes it fun to generate is the frame family plus
what sits on it. The family covers a classic panel bookcase, a see-through étagère on posts, an A-frame ladder, a chunky
cube grid and a tall wall-leaning ladder. On top of that come the **contents**: rows of books in colour runs with a
leaning book at the end, lying stacks, a vase, a bowl, a picture frame, fabric bins in cube cells. Seeds differ first by
silhouette (box, posts with an X brace, triangle, grid, right-triangle wedge), then by size, shelf rhythm, base, finish
and back panel. The contents vary independently: one ⟳ re-shelves the books without touching the furniture. This type
adds the **shelf filler** to the kit (books, boxes and small objects merged into one vertex-coloured draw call). The
cabinet family, the desk hutch and the table's lower shelf can reuse it later.

## Real-world references and dimensions

| Dimension | Range | Source |
|---|---|---|
| Freestanding bookcase height | 0.91–2.13 m (36–84 in); low 0.76–1.07, tall 1.83–2.13 | [Wayfair bookcase dimensions](https://www.wayfair.com/sca/ideas-and-advice/guides/bookcase-dimensions-how-to-pick-the-right-size-T23108), [Hunker standard bookcase sizes](https://www.hunker.com/13403531/standard-bookcase-sizes/) |
| Bookcase width | 0.61–1.22 m (24–48 in), 0.79–0.81 typical; IKEA BILLY 0.40 / 0.80 | [Designing Idea bookshelf dimensions](https://designingidea.com/bookshelf-dimensions), [IKEA BILLY 80×28×202](https://www.ikea.gr/en/products/billy-bookcase-80x28x202-cm/10508932/) |
| Bookcase depth | 0.25–0.30 m (10–12 in) for books; 0.36–0.41 (14–16 in) for oversized books; BILLY 0.28 | [Designing Idea](https://designingidea.com/bookshelf-dimensions), [Homenish](https://www.homenish.com/?p=11771), [IKEA BILLY](https://www.ikea.com/de/en/p/billy-bookcase-white-00263850) |
| Shelf spacing (board to board) | 0.20–0.30 m common (8–12 in), 0.18–0.38 m extremes; paperbacks 0.20–0.25, hardcovers 0.25–0.30 | [Designing Idea bookcase dimensions](https://designingidea.com/bookcase-dimensions), [Homenish](https://www.homenish.com/?p=11771) |
| Shelf count | BILLY 202 cm: 1 fixed + 4 adjustable (6 compartments) | [IKEA BILLY listing](https://mgmt.ikea.gr/en/products/billy-bookcase-80x28x202-cm/10508932) |
| Shelf span (sag) | 18–19 mm board spans about 0.75–0.90 m under books; wider cases get a divider | [Woodbin shelf design guidelines (Sagulator)](https://woodbin.com/?p=1129) |
| Cube grid | KALLAX 77 × 77, 77 × 147, 147 × 147 cm; 33 × 33 cm inserts per cell; depth 39 cm (product page, not re-verified); about 4 cm boards | [IKEA KALLAX 77×147](https://www.ikea.gr/en/products/kallax-shelving-unit-77x147-cm/40346924/), [KALLAX 147×147 with inserts](https://www.ikea.gr/en/products/kallax-shelving-unit-with-4-inserts/49197420/) |
| Cube grid on an underframe | 147 × 94 / 129 / 164 cm overall | [KALLAX with underframe](https://www.ikea.gr/en/products/kallax-shelving-unit-with-underframe-147x129-cm/79442694/) |
| Leaning ladder shelf | h 1.60–1.90 m (63–75 in), w 0.46–0.69 m (18–27 in); shelf depth grows to the floor: 6/8/10/12/14 in, or 9/11/14/16 in; 13 in between shelves; overall depth 0.33–0.41 m | [Kohl's ehemco 5-tier](https://www.kohls.com/product/prd-6630767/ehemco-5-tier-leaning-ladder-wall-book-shelf-69-inches-height.jsp), [Home Depot Welwick 4-shelf](https://homedepot.ca/product/welwick-designs-4-shelf-industrial-metal-wood-leaning-wall-shelf-dark-walnut/1001541645), [Kiera Grace Hadfield 67×18×13.5](https://homedepot.ca/product/kiera-grace-hadfield-67-x-18-x-13-5-5-tier-shelf-black/1000653351) |
| Anchoring | Units over about 1.5 m (60 in) should be anchored to the wall | [Designing Idea](https://designingidea.com/bookshelf-dimensions) |
| Book sizes (h × w) | mass market 0.175 × 0.108; trade 0.203–0.229 × 0.127–0.152; hardcover 0.21–0.24 × 0.15–0.16; comics and art books 0.26–0.31 | [Kindlepreneur book sizes](https://kindlepreneur.com/book-sizes), [MasterClass standard book sizes](https://www.masterclass.com/articles/a-guide-to-standard-book-sizes) |
| Book thickness (spine) | 0.012–0.06 m; it depends on page count and paper, and no source gives a standard (estimate: 300 pages ≈ 0.022 m) | designer estimate |

Takeaway: overall height 0.80–2.10 m, depth 0.25–0.40 m (cube 0.35–0.40, leaning bottom shelf 0.30–0.40, top 0.12–0.20),
width 0.40–1.20 m (cube up to about 1.6), board-to-board gap 0.22–0.40 m, single board span ≤ 0.9 m. Books are
0.17–0.31 m tall, 0.10–0.22 m deep and 0.012–0.06 m thick.

## Styles

Abbreviations in the tables: **Bc** bookcase, **Op** open, **Ld** ladder, **Cb** cube, **Ln** leaning.

### bookcase (weight 0.30)
- Silhouette: a closed upright box. Two full-height side panels, a top that may overhang, a recessed plinth, tapered legs
  or panel feet with an arch cut. Usually a back panel, so the shelves read as dark slots filled with spines. Wider
  cases are split by a centre divider into two bays.
- Parts: 2 side panels · top · bottom board · 1–6 fixed shelves per bay · optional centre divider · optional back panel
  · base by `baseKind`: plinth kick board / 4 or 6 short legs / side panels to the floor with a cut.
- Low (0.8–1.1 m) cases may carry a display on top (a vase or a short stack of books).

### open (weight 0.20)
- Silhouette: an étagère or industrial shelf. Four (or six) slim posts run the full height, with 3–6 boards between
  them. No side panels and no back panel; you can see through it. Optional diagonal X braces across the back and the
  sides (metal) make it read as "industrial" at grid distance.
- Parts: 4 or 6 posts (round metal or square wood) · 3–6 boards (the bottom one 0.05–0.15 m off the floor) · optional
  back X brace and side X braces · optional posts rising above the top board as finials (square wood posts only).

### ladder (weight 0.14)
- Silhouette: a free-standing A-frame, like a step ladder seen from the side. Front rails lean back and rear rails lean
  forward, and they meet at a narrow top. The shelves get deeper towards the floor, so it is a clear triangle in side
  view. Open from every side, with round rungs above the top shelf.
- Parts: 2 front rails + 2 rear rails (side profiles with flat feet) · 3–5 graduated shelves between the rail pairs ·
  1–2 rungs (round dowels) in the front plane above the top shelf.

### cube (weight 0.22)
- Silhouette: a chunky grid of square cells with thick boards, all the same thickness. 1–4 columns × 2–5 rows, on the
  floor or on short legs. It reads as a grid at any distance. Cells hold books, objects or fabric bins.
- Parts: outer box (2 sides, top, bottom) · `cols − 1` full-height dividers · `rows − 1` shelves per column (cut between
  dividers) · optional back panel · base by `baseKind`: floor / 4 or 6 short legs.

### leaning (weight 0.14)
- Silhouette: a tall, narrow right-triangle wedge. Two flat rails lean back 8–14° to a vertical back plane (where the
  wall would be). The shelves hang between the rails and the back plane, so they are deep at the bottom and shallow at
  the top. Without a wall it stands on its rail feet plus a pair of rear posts (or a floor crate) under the deepest shelf
  (see the stability guard). An optional back panel fills the vertical plane.
- Parts: 2 rails (side profiles with a flat foot and a vertical top cut) · 4–6 graduated shelves · rear support by
  `baseKind`: 2 rear posts under the bottom shelf, or a crate (the bottom shelf becomes a box resting on the floor) ·
  optional vertical back panel.

Readability at grid distance (grey, no contents): Bc = solid box with dark slots, Op = see-through posts (+ X), Ld =
symmetric triangle, Cb = square grid with thick lines, Ln = tall wedge leaning back. Contents must not hide the frame:
books are inset 5–30 mm from the board front and never rise above `clear − 15 mm`, so every board edge stays a
continuous line.

## Parameters

Lengths in meters, angles in degrees. "U(a, b)" is uniform. Every style returns the same field set. A field a style
does not use is `0`, `false`, `null` or `'none'`. Like the table, each group pre-draws a fixed number of `r.next()`
values and maps them, so the stream does not shift when a style skips a field (the contents group is the exception:
its draw count varies, and it is the last group).

### style

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `style` | bookcase · open · ladder · cube · leaning | `rollStyle(g, styles)`; 0.30 / 0.20 / 0.14 / 0.22 / 0.14 at re-roll 0 | — | style |

### shape (carcass)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `heightClass` | Bc `low` 0.25 / `mid` 0.35 / `tall` 0.40 · Op `low` 0.3 / `tall` 0.7 · Cb derived (≤ 2 rows `low`, else `tall`) · else `tall` | weighted pick | style | shape |
| `height` (overall, floor to top surface, worst-case base included) | Bc low 0.80–1.10, mid 1.10–1.60, tall 1.60–2.10 · Op low 0.80–1.10, tall 1.40–2.00 · Ld 1.20–1.80 · Ln 1.50–2.00 · Cb derived `rows·cellSize + (rows+1)·boardThickness + maxBaseHeight(Cb)` | U / derived | style, heightClass | shape |
| `width` (x, overall) | Bc 0.40–1.20 · Op 0.60–1.20 · Ld 0.50–0.90 · Ln 0.45–0.80 · Cb `cols·cellSize + (cols+1)·boardThickness` (≤ 1.60, `cellSize` reduced to fit) | U / derived | style | shape |
| `depth` (z, at the bottom) | Bc 0.25–0.40 (0.70 of seeds in 0.26–0.32) · Op 0.28–0.40 · Cb 0.35–0.40 · Ld footprint 0.40–0.60 · Ln bottom shelf 0.30–0.40 | U | style | shape |
| `topDepth` | Ld top shelf 0.12–0.20 · Ln top shelf 0.12–0.20 · else = depth | U / derived | style | shape |
| `cols`, `rows` | Cb cols int 1–4, rows int 2–5 with `height ≤ 2.0` (drop rows until it fits) · else 1, 0 | U int | style | shape |
| `cellSize` | Cb 0.30–0.36 · else 0 | U | style | shape |
| `boardThickness` | Bc 0.016–0.025 · Op 0.018–0.035 (≥ 0.025 when width ≥ 1.0) · Ld 0.018–0.025 · Ln 0.016–0.022 · Cb 0.032–0.050 | U | style, width | shape |
| `sideThickness` | Bc `boardThickness × U(1.0, 1.4)` · Cb = boardThickness · Ln rail x-thickness 0.022–0.035 · Ld rail 0.030–0.045 (square section) · Op 0 (posts use `legThickness`) | U / derived | style, boardThickness | shape |
| `railDepth` (rail section in the side plane) | Ln 0.040–0.065 · Ld = sideThickness · else 0 | U / derived | style | shape |
| `leanAngle` (from vertical) | Ln 8–14 · Ld derived `atan(((depth − topDepth)/2) / height)` (about 4–11°) · else 0 | U / derived | style, depth, topDepth, height | shape |
| `shelfCount` (boards that carry contents, bottom board included; Cb = rows) | Bc `clamp(round(interior / U(0.26, 0.36)), 2, 7)` with `interior = height − maxBaseHeight(Bc) − boardThickness` · Op `clamp(round(height / U(0.30, 0.40)), 3, 6)` · Ld int 3–5, `≤ floor(height / 0.30)` · Ln `clamp(round(height / U(0.30, 0.38)), 4, 6)` · Cb = rows | U / derived | style, height | shape |
| `shelfSpacing` | Bc/Op/Ln `even` 0.6 / `graded` 0.4 (bottom gap 1.25 × the top gap) · Ld/Cb `even` | weighted pick | style | shape |
| `bays` (bays per board row) | Bc 2 when `width − 2·sideThickness > 0.90`, else 1 · Cb = cols · else 1 | derived | style, width | shape |
| `backKind` | Bc `panel` 0.80 / `none` 0.20 · Op `brace` 0.40 / `none` 0.60 · Cb `panel` 0.30 / `none` 0.70 · Ln `panel` 0.45 / `none` 0.55 · Ld `none` | weighted pick | style | shape |
| `backThickness` | `panel` 0.006–0.012 · `brace` (bar width) 0.012–0.020 · else 0 | U | backKind | shape |
| `sideBraces` | Op: chance 0.5 when `backKind = brace` · else false | chance | backKind | shape |
| `topOverhang` (front and sides) | Bc 0 at 0.5, else 0.010–0.030 · else 0 | chance + U | style | shape |
| `postFinials` (posts rising above the top board) | Op tall: 0 at 0.6, else 0.03–0.08 · else 0. Build ignores it unless the posts are square wood | chance + U | style | shape |
| `rungCount` | Ld int 1–2 · else 0 | U int | style | shape |

Note on height and base: `maxBaseHeight(style)` is a constant per style (Bc 0.22, Cb 0.18, Ln 0.30, Op 0.15, Ld 0).
Shape rolls `shelfCount` against the worst-case base, so any base re-roll keeps every gap ≥ 0.22 m (failure modes). For
the cube, build drops the carcass onto the real base, so the overall height is `height − maxBaseHeight + baseHeight`.
For the other styles `height` is the overall height and the base takes its share from the interior. `describe()`
reports the real overall height.

### base (type-specific group)

`appliesTo: (p) => p.style !== 'ladder'` (the ladder has no base variant, 14 % of seeds).

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `baseKind` | Bc `plinth` 0.45 / `legs` 0.30 / `cut` 0.25 · Cb `floor` 0.60 / `legs` 0.40 · Ln `posts` 0.65 / `crate` 0.35 · Op `posts` · Ld `none` | weighted pick | style | base |
| `baseHeight` | Bc plinth 0.05–0.10 · Bc legs 0.10–0.22 · Bc cut 0.06–0.14 (bottom board height; cut height = 0.8 × it) · Cb floor 0 · Cb legs 0.10–0.18 · Ln bottom shelf top 0.12–0.30 · Op bottom board 0.05–0.15 · Ld 0 | U | baseKind | base |
| `plinthSetback` | Bc plinth 0.015–0.05 (front only) · else 0 | U | baseKind | base |
| `footCut` | Bc cut `arch` 0.5 / `v` 0.2 / `notch` 0.3 · else `none` | weighted pick | baseKind | base |
| `postProfile` | Op `round` 0.5 / `square` 0.5 · else `none` | weighted pick | style | base |
| `legCount` | Bc legs 4, or 6 when `bays = 2` · Cb legs 4, or 6 when `cols ≥ 3` · Op 4, or 6 when `width ≥ 1.0` (the posts) · else 0 (R6) | derived | baseKind, shape | base |
| `legThickness` | Bc/Cb legs 0.030–0.045 · Op posts: round 0.020–0.030, square 0.030–0.045 · else 0 | U | baseKind, postProfile | base |
| `legSides` | Bc/Cb legs pick 4 / 6 / 8 · Op round 8, square 4 · else 4 | pick / derived | baseKind, postProfile | base |
| `legTaper` | Bc/Cb legs 0.55–0.85 · else 1 | U | baseKind | base |
| `legSplay` | Bc/Cb legs 0–0.02 (`≤ 0.35·legHeight`, R6) · else 0 | U | baseKind | base |
| `legInset` | Bc/Cb legs 0.02–0.05 · Op `legThickness/2` · else 0 | U / derived | baseKind | base |
| `legHeight` | legs: = baseHeight (= `fp.top`, R6) · Op = `height + postFinials` when the posts are square wood, else `height` (always the `fp.top` passed to `buildLegs`, R6) · else 0 | derived | baseHeight, height, postFinials, postProfile | base |

### palette (label "Colours")

`appliesTo: (p) => p.frameMode === 'painted' || p.boardMode === 'painted' || ['paint', 'accent'].includes(p.backMode)`.

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `paint` | `paintColor(r)` (3 draws) | picker | — | palette |
| `accent` | `accentColor(r, paint)` (3 draws), back-panel accent | picker | paint | palette |

### finish (reads style, shape, base, palette)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `frameMode` (sides, rails, posts, dividers) | Bc wood 0.55 / painted 0.30 / white 0.15 · Op square posts: wood 0.6 / black 0.4; round posts: metal 0.5 / black 0.5 · Ld wood 0.75 / painted 0.25 · Cb white 0.35 / wood 0.30 / painted 0.20 / black 0.15 · Ln wood 0.60 / black 0.25 / painted 0.15 | weighted pick | style, postProfile | finish |
| `boardMode` (shelves) | `match` (the frame's material instance), except Op metal or black posts: wood 0.75 / painted 0.25, and Ln black rails: wood 0.7 / match 0.3 | weighted pick | style, frameMode | finish |
| `backMode` | `backKind = panel`: match 0.40 / accent 0.25 / paint 0.15 (only when the frame is not painted) / wood 0.20 (only when the frame is not wood); never `match` when `frameMode = white` · `brace`: `match` · else `none` | weighted pick, renormalised | backKind, frameMode | finish |
| `backPattern` | backMode accent or paint: `solid` 0.6 / `linen` 0.4 (grasscloth look: `linen` kind, `thread` 0.006, `strength` 0.5, one colour) · else `solid` | weighted pick | backMode | finish |
| `woodName` | `pickWood(r)` (3 draws, always drawn); null when nothing is wood | picker | — | finish |
| `grain` | `fine` 0.3 / `plain` 0.5 / `bold` 0.2; `none` when nothing is wood | pick | — | finish |
| `frameColor` | wood: wood hex · painted: `paint` · white `FRAME_COLORS.white` · black `FRAME_COLORS.black` · metal `FRAME_COLORS.metal` | derived | frameMode, palette | finish |
| `boardColor` | match: frameColor · wood: `shade(wood, +0.03)` · painted: paint | derived | boardMode | finish |
| `backColor` | match: frameColor · accent: `accent`, pushed by `shade` to ΔL ≥ 0.12 from frameColor · paint: paint · wood: `shade(wood, −0.05)` · none: null | derived | backMode, palette | finish |

### contents (type-specific group, last)

Reads style, shape, base, palette, finish. It always applies (every item has contents), so its change rate is 100 %.

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `contentsMood` | `library` 0.40 (fill 0.70–0.95, mostly book rows, up to 1 object per 3 bays) · `styled` 0.40 (fill 0.40–0.70, books, stacks and objects, an object in about every 2nd bay) · `sparse` 0.20 (fill 0.15–0.40, mostly objects and short stacks, some empty bays). Cube cells become `bin`s at 0.1 (library) / 0.3 (styled) / 0.4 (sparse) per cell | weighted pick | — | contents |
| `coverMood` | `classic` 0.30 (library: oxblood, navy, forest, ochre, charcoal, cream from `PAINTS`) · `mixed` 0.30 (5 × `paintColor`) · `tonal` 0.25 (one `paintColor` + `shade` steps −0.15…+0.2) · `pale` 0.15 (5 × `fabricColor({ mood: 'neutral' })`; falls back to `tonal` with a white frame) | weighted pick | finish | contents |
| `bookColors` | 5 hex from the cover mood's pickers. A colour within ΔL 0.06 of `boardColor` is shaded away by 0.12 | picker / derived | coverMood, finish | contents |
| `pageColor` | `muted(0.11, U(0.15, 0.30), U(0.82, 0.90))` (cream page edges) | picker | — | contents |
| `objectColors` | 2 hex: a ceramic `paintColor` (re-drawn into cream, putty, charcoal, terracotta, sage, slate blue) and `accentColor(r, swatch(frameColor))` | picker | finish | contents |
| `fillSeed` | integer 0 … 2³¹ − 1 | U int (1 draw) | — | contents |
| `inset` | 0.005–0.03 (spines behind the board front, one value per item) | U | — | contents |
| `bookCount`, `objectCount` | totals of the regenerated layout (summary for `describe()`) | derived: `generateParams` runs `layoutShelfContents` once | fillSeed, all earlier groups via `bays(p)` | contents |

The per-item layout is **not stored in params** (architect ruling W5). `build` regenerates it with
`layoutShelfContents(createRng(String(p.fillSeed)), bays(p), { mood: p.contentsMood, inset: p.inset, … })`. Records
use the shared decor vocabulary of `src/core/fill.js` (compact, mm-rounded): book `{ k: 'b', x, w, h, d, c, lean? }`,
stack `{ k: 's', x, books: [{ w, h, d, c, yaw }], top? }`, object `{ k: 'vase' | 'bowl' | 'orb' | 'box' | 'frame', x,
size, c }`, bin `{ k: 'bin', c }`. `x` is the record's left edge from the bay's left edge; `c` indexes `bookColors` or
`objectColors`.

#### Contents layout rules (core `layoutShelfContents(r, surfaces, opts)`, run in `build` from `fillSeed`)

Input: `bays(p)` (generator-local, pure, shared with `build` and the type checks) returns one `Surface` per contents
bay (W5): `{ id, x0, x1, y (board top), clear (free height to the board above, or the display cap), zBack, zFront,
back (a back panel or the leaning back plane is behind it) }`, with `depth = zFront − zBack`.
Ladder and leaning bays have a per-shelf depth. Low bookcases and open shelves (`height ≤ 1.10`) and cube grids with
2 rows also get a **top display** bay on the top surface with `clear = min(0.30, 1.40 − height)`, holding objects or a
short stack only.

Per bay (left to right), with `span = x1 − x0`:
1. Pick an arrangement by mood: `row` (books standing from the left or right end), `split` (two rows with an object or
   a gap between), `stack` (2–6 lying books, largest at the bottom, each turned by `yaw` 0–4°, optionally an orb or bowl
   on top), `objects` (1–2 objects spaced out), `bin` (cube cells only, fills the cell), `empty` (sparse only, ≤ 30 %
   of bays).
2. Books in a row: thickness `w` from a weighted mix (0.015–0.025 at 0.45, 0.025–0.040 at 0.40, 0.040–0.060 at 0.15).
   Height class per run: paperback 0.17–0.21, hardcover 0.21–0.25, large 0.26–0.31, with `h ≤ clear − 0.015`. Depth
   `d = clamp(0.68·h ± 0.02, 0.10, bay.depth − 0.01)`. "Series": with chance 0.35 the next 2–5 books share colour and
   height (± 5 mm). Gaps between books 0–2 mm.
3. A row ends with a leaning book at chance 0.35 (library) / 0.5 (styled) when there is room. It tilts by `lean` 8–20°
   towards the row. Its pivot (lowest corner) sits at `x_e + min(h·sin θ, h_n·tan θ)` (`x_e` = the row's free face,
   `h_n` = the neighbour's height), so its top corner or its face touches the neighbour. Every corner stays inside the
   bay.
4. Books taller than `clear − 0.015` are laid flat in a stack instead. Bays with depth < 0.11 (ladder and leaning top
   shelves) get only objects and stacks of books with `d ≤ depth − 0.01`.
5. Objects (m): `vase` h 0.12–0.26, ⌀ 0.07–0.12 · `bowl` ⌀ 0.12–0.20, h 0.05–0.08 · `orb` ⌀ 0.06–0.10 · `box`
   0.08–0.16, cube-ish · `frame` (picture) 0.15–0.25 high, leaning back 10–15° against a back panel or the leaning back
   plane only (elsewhere it becomes a box). All limited by `clear − 0.015` and `depth − 0.01`, centred in depth.
6. Spines face +z, set back by `inset` 0.005–0.03 from the board front (one value per item).
7. **Triangle budget.** Each item has a fixed cost (`CONTENT_TRIS`: book 28, lying book 28, vase 84, bowl 80, orb 72,
   box 44, frame 88, bin 88). The layout stops placing items (and leaves the rest empty) once
   `frameTrisMax(style) + used + next > 5800`, with `frameTrisMax` = Bc 1500 · Op 1100 · Ld 900 · Cb 1400 · Ln 1100
   (each style's worst-case frame, held by a unit test). This keeps every item under 6k without measuring geometry in
   params.

## Re-roll groups

Modern grouped RNG; item seed `${seed}-shelf-${n}`; no `itemSeed` or `legacyRng`.

| Order | Group | Owns (`fields`) | `reads` | Visibly changes |
|---|---|---|---|---|
| 1 | `style` (via `rollStyle`) | style | — | everything except the colourway; ⟳ steps through the other styles |
| 2 | `shape` | heightClass, height, width, depth, topDepth, cols, rows, cellSize, boardThickness, sideThickness, railDepth, leanAngle, shelfCount, shelfSpacing, bays, backKind, backThickness, sideBraces, topOverhang, postFinials, rungCount | style | size, number of shelves and their rhythm, back panel or brace, cube grid size, lean |
| 3 | `base` (label "Base", `appliesTo` not ladder) | baseKind, baseHeight, plinthSetback, footCut, postProfile, legCount, legThickness, legSides, legTaper, legSplay, legInset, legHeight | style, shape | plinth vs legs vs cut panels, cube on legs, leaning rear posts vs crate, open posts round vs square |
| 4 | `palette` (label "Colours", `appliesTo` something painted) | paint, accent | — | paint colour of the frame, boards or back panel |
| 5 | `finish` (label "Finish") | frameMode, boardMode, backMode, backPattern, woodName, grain, frameColor, boardColor, backColor | style, shape, base, palette | wood vs painted vs white/black/metal, back-panel colour and grasscloth texture |
| 6 | `contents` (label "Contents") | contentsMood, coverMood, bookColors, pageColor, objectColors, fillSeed, inset, bookCount, objectCount | style, shape, base, palette, finish | only the books and objects: arrangement, cover colours, ornaments. The furniture stays the same |

Cross-group dependencies the isolation test must allow:
- `shape` → `base`: `legCount` (6 when `bays = 2`, `cols ≥ 3` or `width ≥ 1.0`) and `legHeight` (Op = height).
- `base` → `finish`: `frameMode` weights depend on `postProfile` (round posts are never wood).
- `palette` → `finish`: frameColor, boardColor, backColor when painted or accent.
- `finish` → `contents`: `bookColors` (contrast push against boardColor), `coverMood` (`pale` falls back with a white
  frame), `objectColors[1]`.
- Every earlier group → `contents.bookCount`, `objectCount` (the bays move, so the regenerated layout changes). The contents stream is unchanged,
  so a shape re-roll keeps the mood, the covers and the feel of the arrangement.
- Why `contents` is its own group, and last: it is the charm feature and the most-pressed button ("re-shelve"), it must
  never move the furniture, and it has to read every bay.
- Why the cover colours sit in `contents` and not in `palette`: re-rolling the furniture's colourway should not repaint
  the books, and re-shelving should bring new spines. A split into `contents` (arrangement) and `covers` (colours) is
  possible (open question 3).

## Kit reuse map

| Part | Helper | Notes |
|---|---|---|
| Bookcase side panels (plinth, legs) | `beam(bottom, top, sideThickness, depth, r, frame)` vertical | Vertical beam: width along x = side thickness, thickness along z = depth. 44 tris. |
| Bookcase side panels with a foot cut | `extrudeProfile(endPanelShape(depth, height, { cut: footCut, cutWidth: 0.6·depth, cutHeight: 0.8·baseHeight }), sideThickness, bevel, 'side')` | The same as the bench slab ends. |
| Shelves, bottom board, cube shelves and dividers, open boards | `beam` along x (dividers vertical) | Thin repeated boards (R3), 44 tris. Length = clear span + 1 mm into the side on each end. Shelves stop 1 mm in front of the back panel. Positions from `splitSpan` (even) or a graded variant in `bays(p)`. |
| Bookcase top | `beam` along x (length `width + 2·overhang`, width `depth + overhang` in z, thickness `1.2·boardThickness`), 44 tris | Architect: a 2-segment `puffy` is for structural boxes (R3) and a 3-segment one would cost 588 tris for a board seen edge-on; the top is a thin board like the shelves. Grain runs along x (beam direction). |
| Plinth kick board | `beam` along x, set back by `plinthSetback`, plus 2 short side returns | Reads as a plinth from 3/4 views. |
| Bookcase and cube legs | `buildLegs(legParams, mats, { width, depth, top: baseHeight, anchors: rowAnchors(width, depth, legCount/2, legInset, legInset) })` | R6 names; explicit leg object (no spread params). |
| Open posts | `buildLegs` with `fp.top = height + postFinials` (finials only for square wood posts), `legTaper 1`, `legSplay 0`, `fp.anchors = rowAnchors(…)` | Full-height struts, 16–64 tris each. |
| Open X braces | `beam` (square 0.012–0.020) between the rear posts, and the side posts when `sideBraces` | Two beams per X, crossing at the centre. End points on the post axes via `pointOnLeg`. |
| Back panel | `beam` vertical, width = inner width, thickness = backThickness | One per case. The grain runs along y (auto, the beam direction). `kit.materials.pattern({ kind: 'linen', … })` when `backPattern = linen`. |
| Ladder and leaning rails | `extrudeProfile(parallelogram outline in (z, y), thickness, bevel, 'side')` | Flat foot on y = 0 (`railDepth` wide), top cut vertical (leaning) or horizontal (ladder). Exact extents, so feet stand flat. Generator-local `railOutline(p, side)`. |
| Ladder rungs | `strut(a, b, r, r, 8, frame)` | Between the front rails above the top shelf. |
| Leaning rear posts | `beam` vertical under the bottom shelf's back edge | 0.03–0.04 square. |
| Leaning crate | 2 side boards + front board (`beam`s) under the bottom shelf, down to y = 0 | Reads as a deep bottom box. |
| Books, lying books | core `bookGeometry(w, h, d, spineRadius)` (wave-2 kit A4) | 28 tris: a prism with 2-step rounded spine corners and square page-block corners. |
| Vase, bowl, orb | `latheSolid(profile, 6–8)` with core `DECOR` presets (A4) | 72–84 tris. Bottom at y = 0. |
| Box, bin, picture frame | `beam` (bin + darker handle-slot beam; frame + inset photo beam) | 44–88 tris. |
| Contents geometry | core `buildDecor(records, surface, colours, mat)` (C7) | One mesh per bay, typed arrays. |
| Merging | `mergeByMaterial` | Contents bays merge into the vertex-colour mesh. Needs the `color` rule (A3). |
| Colours | `pickWood`, `paintColor`, `accentColor`, `fabricColor`, `shade`, `muted`, `swatch`, `FRAME_COLORS` | All hex in params. |
| Materials | `kit.materials.wood(…)` / `frame(color, 'metal')` / `solid(color)` (frame and boards roles), `solid` / `pattern` / `wood` (back role), core `vertexColor()` (decor role, A3) | ≤ 4 roles, below. |
| Not used | `tube`, `buildCurvyLegs`, `buildApron`, `buildStretchers`, `buildPedestal`, `buildTrestle` | The open shelf's boards act as its rails. |

### Material roles (R5)

| Role | Parts | Material |
|---|---|---|
| frame | sides, top, dividers, rails, posts, legs, plinth, braces, rungs | `wood(wood, { grain, seed })` / `frame(color, 'metal')` / `solid(color)` |
| boards | shelves (the open shelf's boards) | the frame instance when `boardMode = match`, else its own |
| back | back panel | the frame instance when `backMode = match`, else `solid` / `pattern(linen)` / `wood` |
| decor | books, stacks, objects, bins | `kit.materials.vertexColor()` (one per item, W4) |

Item-wide maximum: **4 draw calls**. Typical items use 2–3: a bookcase with a wood frame, an accent back and contents is
3; an open shelf with metal posts, wood boards and contents is 3 (the brace shares the post material). Only a leaning
shelf with black rails, wood boards and an accent or painted back panel reaches 4.

## New helpers requested

Backlog M4 names the shelf filler as an architect-led kit addition, and the cabinet family (open shelves in sideboards
and TV units), desk hutches, table lower shelves and open wardrobes are planned users. So the filler goes into core
(`src/core/fill.js`) under R7. The type-specific parts stay local.

| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| **K1** `materials.vertexColor({ roughness = 0.85 })` (core, `materials.js`) | `MeshStandardMaterial({ color: '#ffffff', vertexColors: true, flatShading: true, roughness })`, `userData.role = 'contents'` | One draw call for many differently coloured books and objects. One material per colour would need 5–8 draw calls; shader patterns cannot colour separate parts. | cabinet open shelves, desk hutch, wave 3 plants (pot + leaves in one call), rugs |
| **K2** `paintVertices(geometry, colour)` (core, `fill.js`) | `colour` is a hex or `(localNormal) => hex`. Writes a non-indexed `color` attribute in the linear working space (`Color.setHex` converts sRGB → linear), per face from the face normal. A book gets the cover colour on ±x and +z and `pageColor` on ±y and −z (its local frame) | Page edges and spines from one geometry, no extra triangles. Per-face colour needs non-indexed geometry. | as K1 |
| **K3** `mergeByMaterial` colour rule (core, `merge.js`) | `fillMissingAttributes` fills a missing `color` with 1 (white), not 0; groups whose material has `vertexColors = false` drop `color` (like `grain`) | Today a contents part without colours would merge black, and a stray `color` attribute on another part would be zero-filled into its neighbours. | every vertex-colour user |
| **K4** `bookGeometry(w, h, d, spineRadius = min(0.004, w/3))` (core, `fill.js`) | Prism in book space: x = thickness `w` (centred), y = height `h` (bottom at 0), z = depth `d` (spine at +z, centred). Section in (x, z): 2 square back corners plus 2 front corners rounded in 2 steps (8 vertices). 28 tris, non-indexed, with normals | A box with a soft spine reads as a book. A `beam` (44) would also round the page edges and cost 57 % more; a 12-tri box breaks R3. | cabinet shelves, desk, coffee-table stacks, nightstands |
| **K5** `layoutShelfContents(r, bays, opts) → fill` (core, `fill.js`) | Pure, all draws from `r`. `opts = { mood, coverCount, objectKinds, allowBins, allowFrames, budget, inset }`. Implements the layout rules above and returns the JSON `fill` | Clearance, depth, lean maths and budget rules belong in one place. | cabinet open shelves, desk hutch, table lower shelf (stacks only) |
| **K6** `buildShelfContents(fill, bays, colours, mat) → Mesh[]` (core, `fill.js`) | Pure. Writes every item of a bay into one non-indexed geometry (position, normal, color) and returns one `Mesh` per bay in item space | 150 books as 150 meshes would hurt build time (≤ 4 ms). One mesh per bay keeps the connected invariant meaningful (each bay touches its board). | as K5 |
| **K7** `DECOR` lathe presets (core, `fill.js`) | `{ vase, bowl, orb }` → `[[r, y], …]` unit profiles scaled by size, fed to `latheSolid` | Small decor; wave 3 pots can extend it. | wave 3 pots, table centrepieces |
| **K8** calm test extension (`tests/unit/colour-calm.test.js`) | For materials with `vertexColors`, collect the distinct vertex colours, convert linear → sRGB hex, check `colourIsCalm` | Vertex colours bypass `material.color`. (`bookColors` etc. in params are already covered by the param scan.) | every vertex-colour user |
| `bays(p)` (generator-local) | `p → [{ id, x0, x1, y, clear, zFront, zBack, depth }]` | Shared by params (layout), build (placement) and the type checks. | — |
| `railOutline(p, side)` (generator-local) | Parallelogram (z, y) outline for ladder and leaning rails with a flat foot | — | desk A-frames, easels |
| `frameTris(p)` (generator-local) | Exact triangle count of the frame from params | Unit test against `frameTrisMax(style)` and the built mesh. | — |

Architect: K1–K8 are approved; their final names and modules are in `specs/_kit-additions-wave2.md` (K1, K3 → A3;
K2, K4, K7 → A4, with a `cup` preset added for the desk; K5, K6 → C7 `layoutShelfContents` + `buildDecor`, whose
output is regenerated in build, not stored; K8 → test-engineer).

**Instanced vs merged (backlog M4): merged.** The app already merges per item and per material, and an `InstancedMesh`
per item would still cost one draw call, so instancing saves nothing per item. Grid-wide instancing across items would
break the per-item build, merge, invariant and GLB-export contract, and books differ in size, tilt and colour anyway.
At 81 items × ≤ 6k tris the grid is ≤ 0.5M tris, about a quarter of the chair grid. Revisit only if the perf test
fails.

## Failure modes and guards

| Failure | Guard | Test |
|---|---|---|
| Floating shelves or dividers | Boards span the clear width plus 1 mm into the sides, dividers and rails on each end. Ladder and leaning board ends sit on the rail's inner face at that height (linear on the rail line). | connected (2 mm) |
| Books floating or sinking | Every item's bottom is its support's top − 0.001 (board, or the book under it in a stack). Leaning books pivot on their lowest corner. Stacks sort by size so each book sits fully on the one below. | shared invariant `decorSupported` (W5): from the regenerated records + `bays(p)`, every item bottom within 1 mm of its support; connected |
| Books through the board above or the top | `h ≤ clear − 0.015`; a leaning book's top `h·cos θ ≤ clear − 0.015`; taller books go into stacks | shared invariant `decorInside` (W5): every contents vertex inside its bay box (x0…x1, y…y + clear, zBack…zFront) |
| Books through a side, the back panel, or past the front | Row length ≤ span; leaning book corners inside x1; `d ≤ depth − 0.01`; spines `inset` ≥ 5 mm behind the board front; with a back panel `zBack` = panel front | `decorInside` |
| Stacks turned out of the bay | `yaw ≤ 4°`, and the turned footprint (`h·cos + d·sin`) is checked against span and depth before placing | `decorInside` |
| Leaning shelf tips over without a wall | The rear support (2 posts under the bottom shelf's back edge at the back plane, or the crate) puts floor contact at the back plane. The rail tops never pass behind that plane, so the bbox z range equals the contact hull's z range and the bbox centre is inside. The real mass also lies between the rails and the back plane. | stable; type check `leaningRearContact`: ≥ 2 floor contacts at z ≤ zBack + 0.01 |
| Slanted rails sink, or touch the floor on one corner | Rails are `extrudeProfile` outlines with a flat foot on y = 0 (no slanted `beam` ends, whose corners would reach `width/2·sin θ` below the end) | grounded; stable (all contacts in the 3 mm band) |
| Ladder A-frame tips | Feet at z = ±depth/2, symmetric, so the bbox centre is at z = 0 | stable |
| Tall narrow bookcase looks unstable | `depth ≥ 0.25` and `height / depth ≤ 7` (else depth is raised to height / 7) | param contract |
| Shelf gap too small for books | `shelfCount` is rolled against the worst-case base, so every gap ≥ 0.22 (graded: top gap ≥ 0.20) | type check `shelfGaps`: every gap in [0.20, 0.42] from `bays(p)` |
| Shelf sag (span too long) | Bookcase bays ≤ 0.90 m (divider); open shelves with width ≥ 1.0 get 6 posts and `boardThickness ≥ 0.025` | param contract: max board span ≤ 0.90 (Op ≤ 0.60 with 6 posts) |
| Open shelf boards and posts | Posts pass through the board corners (a joined pair, like a real étagère). Round metal posts never get finials | visual review |
| Back panel on the wrong side | Built only at z < 0 | type check: back panel bbox max z < 0 |
| Too wide for the cell | Bc ≤ 1.20 + 2 × 0.03 overhang = 1.26; Cb cols ≤ 4, width clamped to 1.60 by reducing `cellSize`; Op ≤ 1.20 | fits cell (< 1.70); sane size |
| Too tall (legs, finials, top displays) | `height ≤ 2.10` includes the base; finials only on Op with `height ≤ 2.0 − postFinials`; top displays only when `height ≤ 1.10`, with `clear ≤ 1.40 − height` | sane size: maxSize `{ width: 1.65, height: 2.1, depth: 0.62 }`; type check `heightInRange` per style |
| Triangle budget | Frame worst cases (Bc ≈ 1.5k with legs, a divider and 7 shelves × 2 bays; Cb 4 × 5 ≈ 1.4k) are capped by `frameTrisMax`; contents stop at 5.8k total | budget: ≤ 6k tris, ≤ 4 draw calls over 500 seeds; unit test `frameTris(p) ≤ frameTrisMax(style)` |
| Build time with 150+ books | Contents are written straight into one typed array per bay (no per-book `Mesh` or `BufferGeometry`) | budget report (≤ 4 ms median) |
| Black books (missing vertex colours) | A3 merge rule: a missing `color` fills with white; every contents part goes through `paintVertices` | unit test: every contents vertex colour is one of `bookColors`, `pageColor`, `objectColors` or their fixed handle/photo shades |
| Loud or clashing covers | Every cover comes from a picker; `classic` and `tonal` keep it calm | colour-calm test including vertex colours (K8, test-engineer) |
| Books vanish into the case (pale books in a white case) | ΔL ≥ 0.06 from boardColor, else shaded by 0.12; `pale` falls back to `tonal` with a white frame | unit test on ΔL; visual review |
| Contents hide the silhouette | Spines set back from the board front; 15 mm headroom; `sparse` in 20 % of seeds; back panel ΔL ≥ 0.12 from the frame | visual review (grey and colour grids) |
| Accent back panel clashes with the frame | `accentColor` from `paint`, `shade` to ΔL ≥ 0.12; `linen` gets one colour only (pattern catalogue rule) | colour-calm test; visual review |
| Wood pinstripes on thin boards (deferred pattern issue) | Grain runs along each beam (auto); the back panel's grain along y; with `bold`, boards fall back to `plain` (sides, top and rails keep `bold`) | pattern board; snapshot |
| White frame + white back + light books lack contrast (deferred bench issue) | `backMode` is never `match` with a white frame and a panel | visual review |
| Leaning book cuts into its neighbour | Pivot formula `x_e + min(h·sin θ, h_n·tan θ)`, 1 mm clearance | `decorInside`; unit test on the formula |
| Picture frame with nothing to lean on | Frames only in bays with a back panel or on leaning shelves; otherwise a box | `decorInside` |
| Not centred | Build recentres the item on x and z from the analytic bbox (leaning is asymmetric in z before the shift) | type check: bbox centre x and z within ±2 mm |
| Large params | The layout is regenerated from `fillSeed` in build (W5); only the recipe is stored | unit test: `JSON.stringify(params).length < 3000` |
| Layout differs between params and build | One pure `layoutShelfContents`, mm-rounded numbers, the same call in `generateParams` (counts) and `build` | unit test: `bookCount`/`objectCount` equal the built records |

Joined pairs the intersection review must allow: board–side, board–rail, board–post, divider–board, brace–brace (X),
brace–post, rung–rail, leg–bottom board, back panel–sides, bin–cell, book–board, book–book (leaning contact).

## describe() rows

| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `bookcase` · `open` · `ladder` · `cube grid` · `leaning` |
| shape | Size | `80 × 30 cm · 180 cm high` (width × depth · real height); cube `3 × 4 cubes · 110 × 147 cm` |
| shape | Shelves | `5 shelves · even` / `graded`; two bays `5 shelves × 2 bays`; ladder and leaning `4 shelves · 14–36 cm deep` |
| shape | Back | `panel` · `X brace` / `X brace + sides` · `none` |
| base | Base | `plinth 8 cm` · `4 legs · 15 cm` · `arch-cut sides` · `on the floor` · `rear posts` · `crate` · `round posts` / `square posts`; ladder: `A-frame` (no ⟳) |
| palette | Colours | `{ swatches: [paint, accent] }` (only when it applies) |
| finish | Frame | `oak wood · plain grain` · `painted` · `white` · `black` · `metal` |
| finish | Shelves | `match` · `walnut wood` · `painted` |
| finish | Back | `match` · `accent` · `grasscloth` · `wood` · `none` |
| contents | Contents | `library · 84 books, 3 objects` |
| contents | Covers | `{ swatches: bookColors }` (row label carries the mood: `Covers (classic)`) |
| contents | Objects | `vase, bowl, frame` or `none` |

Top-level `swatches`: `[frameColor, boardColor if different, backColor if any, bookColors[0], bookColors[1]]`.

## Grid cell

**spacing: 1.8 m, gridSize: 9** (81 items, 16.2 m across).

- Max footprint: x 1.60 m (cube, 4 columns, clamped; bookcase 1.26 m) × z 0.60 m (ladder), height 2.10 m.
- Fits-cell limit: `1.8 − 0.1 = 1.70 > 1.60`, so at least 10 cm between the widest neighbours. The z gaps are large
  (≥ 1.2 m) because cells are square (R4). A `cell.spacingZ` of about 1.0 would pack shelves tighter but is not needed.
- The items are tall and thin. At 1.8 m spacing a 2.1 m bookcase may hide part of the one behind it from the default
  camera, and in the All view it towers over stools and tables. Check this in the snapshot (open question 6).
- Architect (W2): the shelf keeps square cells. `cell.spacingZ` lands in wave 2 for cabinets and desks only; tighter
  rows would make tall shelves hide each other.
- Triangles: p50 estimate 4.0k (most shelves carry 50–90 books), max 5.8k by construction. The grid is about 0.35M tris,
  below the chair grid.

## Open questions

1. ~~**Book geometry and R3.**~~ Books use `bookGeometry` (28 tris, 2-step rounded spine, square page-block corners). Is a
   part with only *some* edges rounded fine under R3, or should books be `beam`s (44 tris, all four long edges rounded,
   about 55 fewer books per item within the budget)?
   **Architect:** `bookGeometry` (28 tris) is approved. R3 is about edges that are rounded; page blocks are square in
   reality, so square page corners are correct, and the spine keeps its 2 facets.
2. ~~**Vertex colours as a new material role.**~~ `vertexColor()` is a material the shader patterns cannot decorate (no
   linen on bins, no stripes on covers). OK for wave 2? The alternative, 5 book colours as 5 materials, breaks the
   4-draw budget.
   **Architect:** approved (W4): one `decor` vertex-colour role, counted like any role, at most one per item.
3. ~~**Contents re-roll granularity.**~~ One `contents` group re-shelves everything (arrangement and cover colours). Should
   it split into `contents` (arrangement) and `covers` (book colours), so a user can keep an arrangement and only
   recolour it?
   **Architect:** keep one `contents` group in wave 2 (a re-shelve should bring new spines). Revisit after the visual
   review if users want covers alone.
4. **Wall-leaning without a wall.** The leaning style stands on rear posts or a crate under the deepest shelf, so it is
   stable on its own. Real leaning shelves rely on the wall. Is that compromise fine, or should the style wait for room
   mode (wave 4), where a wall exists?
   **Architect (recommendation):** keep it, standing on its rear posts or crate. It is stable on its own and the
   wedge silhouette is unique. Room mode can drop the rear support later.
5. **Top displays.** Low bookcases, low open shelves and 2-row cube grids get a vase or a stack on top (up to 1.40 m
   overall). Welcome charm, or keep the top empty so the frame top is always the bbox top?
   **Architect (recommendation):** keep them. `maxSize` and `heightInRange` already use the real top; the display
   cap (≤ 1.40 m overall) keeps them below tall cases.
6. ~~**Grid spacing 1.8 m for 2.1 m tall items.**~~ Keep square 1.8 m cells and check occlusion in the snapshot, or
   introduce `cell.spacingZ` now (wave 2 was the planned point to revisit R4)?
   **Architect:** square 1.8 m for the shelf (W2); check occlusion in the snapshot.
7. ~~**Plants on shelves.**~~ Should the filler reserve an object kind `plant` (unused in wave 2), so wave 3 can add
   trailing plants to shelves without changing the `fill` format?
   **Architect:** yes, `plant` is reserved in the shared decor vocabulary (W5); no layout emits it in wave 2.
8. **Cube inserts.** Cube cells get fabric bins (one colour + handle slot). Add doors and drawers from `fronts.js` once
   the cabinet kit lands, or keep the cube open?
   **Architect (recommendation):** keep bins in wave 2. `solveFronts` can fill a cube cell later (one `doors` or
   `drawers` leaf per cell); that needs a 4th role for hardware, so it is a later change, not a wave-2 one.
9. ~~**Filler in core now.**~~ K1–K8 go into core (`src/core/fill.js`, `materials.js`, `merge.js`) before a second user
   exists, because the backlog names the filler as a kit addition and the cabinet family is next. Confirm, or keep it
   shelf-local until the cabinet spec asks for it (R7)?
   **Architect:** core now. The desk is a second user (books, cup, `buildDecor`), and the backlog names it.
10. ~~**Params size.**~~ `fill` stores every book (up to about 12 kB of JSON per item). Fine, or store only summary fields
    and let build lay out the books from a stored sub-seed (which bends the "build has no randomness" rule)?
    **Architect:** regenerate in build from `fillSeed` (W5). Build stays a pure function of params; the contract now
    says build may derive detail from a seed that is a param.

## Architect review (wave 2, M4)

**Verdict: approved with edits.** The frame family is strong (five distinct silhouettes in grey), the parameter
table is complete with neutral values, the groups are ordered correctly (style weights sum to 1.00), the budget is
held by construction, and the filler is the right kit addition. The edits below are applied above; the helper names
and modules are final in `specs/_kit-additions-wave2.md`.

Changes:
1. **Contents are regenerated, not stored (W5).** `fill` is replaced by `fillSeed` + `inset`; `build` calls
   `layoutShelfContents(createRng(String(p.fillSeed)), bays(p), …)`; `generateParams` runs it once for `bookCount` /
   `objectCount`. Params stay under 3 kB (new test). Open question 10 answered.
2. **Shared decor approach (W5).** `bays(p)` returns the shared `Surface` record (`zBack`, `zFront`, `back`); records
   use the core decor vocabulary; geometry comes from core `buildDecor`; the `contentsSupported` / `contentsInside`
   type checks become the shared invariants `decorSupported` / `decorInside` (test-engineer), which the desk also
   uses.
3. **Material role renamed `decor`** (W4): `kit.materials.vertexColor()`, one per item, counted in the 4.
4. **K1–K8 mapped** to A3 (vertex material + merge colour rule), A4 (`paintVertices`, `bookGeometry`, `DECOR`), C7
   (`layoutShelfContents`, `buildDecor`), K8 to the test-engineer.
5. **R6 fix for open posts:** `legHeight` now equals the `fp.top` passed to `buildLegs` (`height + postFinials` for
   square wood posts with finials).
6. **Bookcase top** is a `beam` board (44 tris) instead of a 2-segment `puffy` (R3: tops are either hero `puffy` 3 or
   boards); `frameTrisMax(Bc)` drops by about 250, which goes to books.
7. **Grid:** square 1.8 m cells stay (W2); open question 6 answered.

Notes for the generator-engineer:
- `palette.appliesTo` reads `finish` fields (as on the table): `paint` and `accent` must stay drawn on every seed, and
  `frameColor` / `boardColor` / `backColor` must read them only when something is painted.
- The `contents` change rate is 100 % by construction (`fillSeed` is a fresh integer on every re-roll).
- Keep `layoutShelfContents` numbers mm-rounded inside the layout so params-time counts and build-time records match
  on every platform.
- The deferred "faint dotted seam on white slats" and "pinstripe on thin boards" pattern issues apply here; the
  board-grain fallback (`bold` → `plain` on boards) stays.
