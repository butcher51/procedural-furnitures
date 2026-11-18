# Stool spec

## Summary

A stool is a seat with no back: a top on a support, sometimes with a place to rest your feet. It is fun to generate
because the parts are few but their proportions vary a lot. A 0.28 m three-legged milking stool, a 0.78 m bar stool with
a footrest ring and a chrome diner swivel all come from the same short parts list. Seeds differ first in **height class**
(low / counter / bar), then in **support type** (splayed legs, pedestal column, solid drum, slab panels), then in the
**footrest** (ring, box rails, H stretcher, pedestal ring, none) and finally in seat shape, cushion and finish. The type
reuses the chair's legs, seats and ring almost directly. It adds two small pieces that later types also need: stretchers
between legs and a pedestal column.

## Real-world references and dimensions

| Dimension | Range | Source |
|---|---|---|
| Counter stool seat height (for 0.86–0.91 m counters) | 0.61–0.69 m (24–27") | Wayfair bar stool dimensions guide; NFM bar stool heights guide |
| Bar stool seat height (for 1.02–1.07 m bars) | 0.71–0.81 m (28–32"); sources disagree slightly on the top end | Wayfair; NFM; Living Spaces |
| Seat to counter underside clearance | 0.25–0.30 m (10–12") | Wayfair; restaurant-furniture.com |
| Seat width, counter / bar | 0.38–0.51 m / 0.41–0.66 m (15–20" / 16–26"); backless round seats sit at the low end, 0.33–0.43 m | AllModern bar stool width tips; Wayfair |
| Seat depth, counter / bar | 0.30–0.41 m / 0.36–0.46 m | AllModern |
| Footrest height above floor | 0.18–0.25 m (7–10") on retail spec sheets | Houzz / Overstock / Lowe's listings |
| Seat to footrest drop | 0.38–0.46 m (15–18"); one guide says 0.40–0.45 m | by-crea footrest guide; calculator.academy; retail listings |
| Pedestal base diameter (bar swivel) | about 0.43–0.48 m (17–19") for a 0.76 m seat; one wide-base counter stool is 0.61 m | Lowe's / Overstock swivel listings |
| Milking stool height | 0.25–0.45 m (antiques cluster at 0.28–0.39 m) | Chairish, Pamono, 1stDibs listings; Museum Wales (H 36, Ø 33 cm); Ingenium (H 24.7 cm) |
| Milking stool seat diameter / thickness | 0.24–0.33 m / 0.04 m | Pamono (seat Ø 24 cm); 1stDibs Belgian oak (seat Ø 26 cm, 4 cm thick) |
| Milking stool leg spread | 0.32–0.38 m leg to leg (wider than the seat) | Pamono (32 cm); Chairish (37.5 cm) |
| Low stool (Artek Stool 60) | H 0.44 m, seat Ø 0.35–0.38 m, 3 legs | Innes; DWR; dimensions.com |
| Drum / pouf | H 0.30–0.46 m, Ø 0.36–0.60 m (IKEA Förlunda 41 × Ø44 cm; DWR Drum Pouf High 40 × Ø45 cm) | dimensions.com; DWR |
| Step / plank stool | H 0.22–0.46 m, top 0.40–0.60 × 0.24–0.34 m (designer's estimate, cross-checked with bench seat h 0.42–0.47 in plan 01) | plan 01 bench row; general catalogue ranges |

The plan's "low 0.45" is the top of the low class. Real low stools go from 0.25 m (milking) to 0.46 m (drum, Stool 60).
We keep a **gap between counter (≤ 0.68) and bar (≥ 0.72)** so the two classes read differently at grid distance.

## Styles

Six styles, picked so they are recognisable **as silhouettes** and not only by colour. There are three height classes
and four support types.

### bar (weight 0.25)
- Silhouette: a tall (0.72–0.80 m), narrow stool on 3–4 thin splayed legs, with a footrest ring about a third of the
  way up. It looks like an "A" with a hoop round it. The seat is round, squircle or square, with an optional thin cushion.
- Parts: seat pan, optional cushion, 3–4 splayed struts, 1–2 footrest rings (closed tube through the leg axes).

### counter (weight 0.20)
- Silhouette: a mid-height (0.60–0.68 m), sturdier stool on 4 near-vertical legs with **straight rails**: a square box
  of stretchers or an H. Square or rectangular seats are favoured. This is the "kitchen stool" next to the bar stool's
  hoop.
- Parts: seat pan, optional cushion, 4 struts, box rails (4 struts) or an H stretcher (3 struts), sometimes a ring.

### diner (weight 0.15)
- Silhouette: a chrome swivel. There is a fat round cushion on a thin pan, a short hub, one central column (optionally
  with a wider gas-lift sleeve), a wide round base on the floor and a ring floating on spokes round the column. It can
  be counter or bar height.
- Parts: cushion (rounded disc), pan band, swivel hub, column, optional sleeve, base (disc or cone), footrest ring with
  3–4 spokes.

### milking (weight 0.15)
- Silhouette: a low (0.26–0.45 m), chunky, thick round seat on three stubby legs that splay out **wider than the seat**.
  It looks like a tripod. Wood almost always.
- Parts: thick seat (round disc or oval/squircle extrusion), 3 legs (sometimes 4), thick and tapered, strongly splayed.
  No footrest.

### drum (weight 0.15)
- Silhouette: a solid upholstered cylinder 0.38–0.46 m tall. It can be straight, waisted like a spool or bellied like a
  barrel. It optionally has a contrasting top cushion, and either sits flat, sits on a recessed plinth or stands on 3–4
  short feet.
- Parts: body (lathe), optional top cushion, optional plinth or short feet.

### slab (weight 0.10)
- Silhouette: a low rectangular plank on two flat end panels (a step stool / Japanese-style plank stool). Each panel
  can be plain, have an arch cut out underneath (two "feet") or have a notch. An optional stretcher runs between the
  panels.
- Parts: seat plank (rounded box), 2 end panels (vertical slab with optional cutout), optional stretcher.

## Parameters

Units are meters. `U(a, b)` is uniform. Every style returns the full field set. Fields a style does not use are set to
`0`, `false` or `null` (the chair pattern) so the panel and tests see a fixed shape.

### style group

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| style | bar, counter, diner, milking, drum, slab | `rollStyle(g, styles)`: a weighted pick 0.25 / 0.20 / 0.15 / 0.15 / 0.15 / 0.10 at re-roll 0 (see `_kit-additions.md` R1) | — | style |

### shape group (reads style)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| seatHeight | bar U(0.72, 0.80) · counter U(0.60, 0.68) · diner pick(counter, bar) then that class's range · milking U(0.26, 0.45) · drum U(0.38, 0.46) · slab U(0.22, 0.46) | uniform per class | style | shape |
| seatShape | bar: round .5 / squircle .25 / square .25 · counter: square .45 / rect .2 / round .2 / squircle .15 · diner: round · milking: round .7 / oval .3 · drum: round · slab: rect | weighted pick | style | shape |
| seatWidth (x, or diameter) | bar U(0.34, 0.44) · counter U(0.36, 0.46) · diner U(0.36, 0.44) · milking U(0.24, 0.36) · drum U(0.36, 0.50) · slab U(0.40, 0.60) | uniform | style | shape |
| seatDepth (z) | = seatWidth, except rect: U(0.30, 0.38) (counter) / U(0.24, 0.34) (slab); oval: seatWidth × U(0.75, 0.9) | derived / uniform | seatShape, seatWidth | shape |
| seatExponent | round / oval 2 · squircle U(3, 5) · square / rect 10 (unused, puffy box) | derived / uniform | seatShape | shape |
| seatSides | {8, 10, 12} for round and lathe seats; 12 for diner and drum | pick | style | shape |
| seatThickness (pan) | bar / counter U(0.03, 0.06) · diner U(0.02, 0.035) · milking U(0.04, 0.07) · drum 0 · slab U(0.025, 0.045) | uniform | style | shape |
| puff (edge radius) | wood U(0.004, 0.012) · drum / diner cushion U(0.02, 0.05) | uniform | style | shape |
| hasCushion | bar 0.4 · counter 0.5 · diner true · milking false · drum 0.6 · slab false | chance | style | shape |
| cushionThickness | bar / counter U(0.04, 0.08) · diner U(0.06, 0.11) · drum U(0.05, 0.09); 0 when no cushion | uniform | hasCushion | shape |
| legCount | bar {4: .75, 3: .25} · counter 4 · diner 0 (column) · milking {3: .85, 4: .15} · drum (feet) {3, 4} or 0 · slab 0 (panels). Counts only `buildLegs` struts (R6) | weighted pick | style | shape |
| legThickness | bar U(0.025, 0.045) · counter U(0.03, 0.05) · diner 0 · milking U(0.035, 0.055) · drum feet U(0.03, 0.045) · slab 0 | uniform | style | shape |
| legSides | bar {4, 6, 8} · counter {4, 4, 6} · milking {5, 6, 8} · drum feet {6, 8} | pick | style | shape |
| legTaper (bottom / top radius) | bar U(0.6, 1) · counter U(0.7, 1) · milking U(0.55, 0.85) · feet U(0.6, 0.9) | uniform | style | shape |
| legSplay (outward offset at floor) | bar U(0.04, 0.09) · counter U(0, 0.05) · milking U(0.06, 0.12) · feet U(0, 0.02); then clamped to ≤ 0.35 × legHeight | uniform, then clamped | style, legHeight | shape |
| legHeight | seatHeight − cushionThickness − seatThickness (legs/support top = pan underside); drum feet: U(0.06, 0.12) | derived | seatHeight, seatThickness, cushionThickness | shape |
| columnRadius (diner) | U(0.022, 0.035) | uniform | style | shape |
| hasSleeve (diner gas-lift look) | chance 0.5; sleeve = lower 55 % of column at 1.6 × radius | chance | style | shape |
| hubRadius / hubHeight (diner swivel plate) | U(0.06, 0.10) / U(0.03, 0.06) | uniform | style | shape |
| baseShape (diner) | disc .6 / cone .4 | weighted pick | style | shape |
| baseRadius (diner) | clamp(seatHeight × U(0.28, 0.33), 0.19, 0.26) | derived | seatHeight | shape |
| baseHeight (diner) | U(0.02, 0.05) | uniform | style | shape |
| drumProfile | straight .45 / spool .30 / barrel .25 | weighted pick | style | shape |
| drumWaist | spool: mid radius ratio U(0.65, 0.85) · barrel: end radius ratio U(0.8, 0.92) · straight 1 | uniform | drumProfile | shape |
| drumBase | floor .45 / plinth .30 / feet .25 | weighted pick | style | shape |
| plinthHeight | plinth U(0.03, 0.06), else 0; plinth radius = body bottom radius × 0.85 | uniform | drumBase | shape |
| slabThickness (panel) | U(0.02, 0.04) | uniform | style | shape |
| slabInset (panel from seat end) | U(0.02, 0.08) | uniform | seatWidth | shape |
| slabCutout | none .4 / arch .4 / notch .2 (the `endPanelShape` cut kinds) | weighted pick | style | shape |
| slabCutoutHeight | arch / notch: legHeight × U(0.2, 0.4) | derived | legHeight | shape |
| slabCutoutWidth | arch: seatDepth × U(0.4, 0.6) · notch: U(0.04, 0.08) | derived / uniform | seatDepth | shape |

### footrest group (reads style, shape)

The footrest is its own re-roll group: "same stool, different footrest" is a fun and readable change. It declares
`appliesTo: (p) => p.style !== 'milking' && p.style !== 'drum'` (R2), because those styles never have a footrest. For
them every footrest field is neutral (`'none'`, `0`, `false`). Its function
**must take the shape result as input and resolve against it every time**. It must not cache anything, so a re-rolled
shape (e.g. legCount 4 → 3) always gets a valid footrest.

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| footrestKind | bar: ring .8 / none .2 · counter: perimeter .5 / h .25 / ring .15 / none .1 · diner: pedestalRing .85 / none .15 · milking: none · drum: none · slab: stretcher .6 / none .4. `perimeter` and `h` need legCount 4, otherwise fall back to ring | weighted pick, then resolved | style, legCount | footrest |
| footrestHeight | legged: clamp(seatHeight − U(0.40, 0.47), 0.17, legHeight − 0.15) · diner same formula · slab stretcher: legHeight × U(0.25, 0.5) · none: 0 | derived from uniform | seatHeight, legHeight | footrest |
| footrestRadius (tube / rail radius) | ring / pedestalRing U(0.008, 0.013) · perimeter / h: min(U(0.008, 0.014), 0.8 × legThickness / 2) · stretcher U(0.012, 0.02) | uniform, clamped | legThickness | footrest |
| footrestDouble | bar and counter ring only: chance 0.3; second ring at footrestHeight + U(0.18, 0.26), dropped if above legHeight − 0.08 | chance | footrestHeight, legHeight | footrest |
| footrestStagger | perimeter only: chance 0.4; side rails sit footrestRadius × 3 above front/back rails so the joints do not clash | chance | footrestKind | footrest |
| pedestalRingRadius | diner with pedestalRing: U(0.17, 0.21), clamped to ≥ columnRadius × 1.6 + 0.10 and ≤ seatWidth / 2 + 0.03; else 0 | uniform, clamped | columnRadius, seatWidth | footrest |
| pedestalSpokes | diner with pedestalRing: {3, 4}; else 0 | pick | — | footrest |

The ring has **no free size**. Its points are where the leg axes cross `footrestHeight`, so it always runs through the
legs.

### palette group (independent)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| cushionColor | hsl(hue U(0, 1), sat U(0.35, 0.75), light U(0.42, 0.62)) | uniform | — | palette |
| cushionSecondary | light / dark / complement / white (as chair `secondaryMode`) | pick, derived | hue | palette |
| bodyColor (drum body under a top cushion) | hsl(hue, sat × 0.85, light − 0.12) | derived | hue | palette |
| accentColor (painted frame / painted seat) | hsl(hue, 0.4, U(0.30, 0.55)) | derived | hue | palette |

### pattern group (independent)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| pattern | solid .5 / stripes .3 / checker .2 (applies to the cushion and the drum body) | weighted pick | — | pattern |
| patternScale | int 3–9 | uniform int | — | pattern |
| stripeDirection | horizontal / vertical | pick | — | pattern |

### finish group (reads style, shape, palette)

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| frameMode | wood chance per style: bar .5 · counter .6 · diner 0 · milking .95 · drum .5 · slab .85. Not wood → pick: diner metal .7 / black .2 / white .1; others black / white / metal / match | chance, then pick | style | finish |
| frameColor | wood tone (h ± 0.01, l ± 0.05) · #2a2a2c · #efefea · #a7abb0 · accentColor (match) | derived | frameMode, palette | finish |
| woodName | WOOD_TONES name or null | pick | frameMode | finish |
| panMode | no cushion: wood .7 / painted .3 if frame is wood, else painted .5 / wood .5 · with cushion: frame (pan matches frame) · diner: always frame | weighted pick | style, hasCushion, frameMode | finish |
| panColor / panSecondary | wood: tone ± 0.04 l (planks) · painted: accentColor / lighter accent · frame: frameColor | derived | panMode, palette | finish |
| panPattern / panPatternScale | wood: stripes .4 (planks) / solid .6, int 3–5 · else solid | chance | panMode | finish |

Derived fields that depend on an earlier group live in the **last** group that influences them, as in the chair.

## Re-roll groups

All groups are modern (an independent stream per group, `${itemSeed}/${groupId}/${n}`). `style` is rerollable through
`rollStyle` (R1): each ⟳ press steps to a style not seen yet.

| Order | Group | Owns (`fields`) | `reads` | Visibly changes |
|---|---|---|---|---|
| 1 | style | style | — | everything structural: height class, support type |
| 2 | shape | seatHeight, seatShape, seatWidth, seatDepth, seatExponent, seatSides, seatThickness, puff, hasCushion, cushionThickness, legCount, legThickness, legSides, legTaper, legSplay, legHeight, columnRadius, hasSleeve, hubRadius, hubHeight, baseShape, baseRadius, baseHeight, drumProfile, drumWaist, drumBase, plinthHeight, slabThickness, slabInset, slabCutout, slabCutoutHeight, slabCutoutWidth | style | proportions, seat outline, leg count/splay, cushion on/off, drum profile, panel cutouts |
| 3 | footrest (`appliesTo`: not milking or drum) | footrestKind, footrestHeight, footrestRadius, footrestDouble, footrestStagger, pedestalRingRadius, pedestalSpokes | style, shape | ring vs rails vs H vs none, footrest height, double ring |
| 4 | palette | cushionColor, cushionSecondary, bodyColor, accentColor | — | upholstery colours, painted accents |
| 5 | pattern | pattern, patternScale, stripeDirection | — | cushion / drum fabric pattern |
| 6 | finish | frameMode, frameColor, woodName, panMode, panColor, panSecondary, panPattern, panPatternScale | style, shape, palette | frame wood / metal / paint, seat pan material |

Later-group fields that legitimately change when an earlier group is re-rolled (for the isolation test):

- **style →** all shape, footrest and finish fields.
- **shape →** footrest: footrestKind (fallback when legCount changes), footrestHeight, footrestRadius, footrestDouble,
  pedestalRingRadius. Finish: panMode, panColor, panSecondary, panPattern, panPatternScale (hasCushion changes the pan
  rules).
- **palette →** finish: frameColor (match), panColor, panSecondary (painted).
- **pattern →** nothing later.

Style re-roll: `rollStyle` never returns the base style on re-roll 1, so the change rate is 100 %. This replaces the
"exclude current style" idea, and the Σw² ≈ 0.18 repeat rate no longer matters.

Footrest change rate (over the seeds where it applies): none → none happens for about 4.5 % of them, so the rate is about
95 %. Fields a style does not use stay neutral, so an inert re-roll cannot pass the test by changing invisible values.

## Kit reuse map

| Part | Helper | Notes |
|---|---|---|
| Round seat pan (bar, counter, milking round) | `roundedDiscGeometry(r, seatThickness, puff, seatSides)` | Centred on y; place at legTop + thickness / 2. |
| Square / rect seat pan, slab plank | `puffy(w, t, d, puff, mat)` | As in chair `buildSeat`. |
| Squircle / oval seat (bar, counter, milking oval) | `superellipseShape` + `extrudeUp` + `normalizeUVs` | As in chair `buildCurvy`. |
| Cushion (bar, counter) | `puffy` / `roundedDiscGeometry` / `extrudeUp`, matching the seat outline inset 0.01 m | Sits 1 mm into the pan (joined). |
| Diner cushion | `roundedDiscGeometry(r, cushionThickness, puff, 12)` | A large `puff` gives the fat diner roll. |
| Splayed legs (bar, counter, milking, drum feet) | `buildLegs(p, mats, fp)` with legCount ≥ 3, called only from the legged styles' branch (R6) | `fp = { width, depth, top: legTop, round, exponent }`. Struts only: **no `tube` reaches the floor**. |
| Leg layout | `legAnchors` | 3 legs: one at the rear, two at the front (start −π/2). That suits milking. |
| Footrest ring(s), perimeter rails, H stretcher | `buildStretchers(legLines(p, fp), footrestKind, footrestHeight, { radius: footrestRadius, sides: 6, stagger }, frame)` | `ring` is the same closed tube `buildCurvyLegs` makes. A double ring is a second call. |
| Slab stretcher, diner pedestal ring and spokes | stool-local: a `beam` between the panel inner faces; a closed `tube` on a circle plus `strut` spokes | Not shared in wave 1 (R7). |
| Diner base, column, sleeve, hub | `buildPedestal({ top: legTop, base: baseShape, baseRadius, baseHeight, baseTaper: 0.35, columnRadius, columnSides: 10, sleeve, cap: { radius: hubRadius, height: hubHeight } }, frame)` | `disc` and `cone` map directly. The hub is the pedestal `cap`. |
| Drum body (straight) | `roundedDiscGeometry(r, h, puff, 12)` | The spool and barrel need `latheSolid`. Until it lands, the fallback is `drumProfile` straight only. |
| Drum feet | `buildLegs` (3–4 short struts) | Top embedded 5 mm into the body bottom. |
| Slab panels | `extrudeProfile(endPanelShape(seatDepth, legHeight, { cut: slabCutout, cutWidth, cutHeight }), slabThickness, bevel, 'side')` | One path for all three cut kinds. |
| Materials | `kit.materials.surface` (cushion: palette + pattern), `surface` (pan: finish planks or paint), `frame(frameColor, frameMode)`, `solid(bodyColor)` (drum body only) | At most 3 roles per item: pan / cushion / frame, or cushion / body / frame for drum. |
| Merge | `mergeByMaterial` (app) | ≤ 3 draw calls. |

## New helpers requested

| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| `legLines` (supports) → **merged as `legLines` + `pointOnLeg` (B2)** | `legLines(p, fp) → [{ top, bottom, rTop, rBottom }]`, the exact axes `buildLegs` uses for legCount ≥ 3. Refactor `buildLegs` to call it (no output change, chair golden test guards it) | Rings and rails must sit **on** the legs at any height. Without this the stool would copy the splay maths. | table (stretchers), bench, chair (a future classic ring) |
| `legStretchers` (supports) → **merged as `buildStretchers` (C1)** | `buildStretchers(lines, kind, y, { radius, sides, profile, stagger }, mat) → Group`, kinds `ring` / `perimeter` / `h` / `ends` / `cross` | Footrest ring and rails in one place, as the plan suggests ("footrest ring from the curvy ring"). | table (cross stretchers, listed in plan 01), bench, chair |
| `pedestalColumn` (supports) → **merged as `buildPedestal` (C3)** | `buildPedestal({ top, base: 'disc' \| 'cone' \| 'cross' \| 'tripod', baseRadius, baseHeight, baseTaper, columnRadius, columnSides, sleeve, cap }, mat) → Group`. Bottom at y = 0, cap top at `top` | `buildLegs`' 1-leg pedestal has a fixed 0.03 m base and radius 0.38 × seat, which gives Ø0.29 m under a 0.78 m bar seat. That is too small to look stable. This is the plan's "swivel column". | table (café pedestal), chair (office / swivel), lamps (floor-lamp stem + base) |
| `latheSolid` (geometry) → **accepted as A7 (deferrable)** | `latheSolid(profile: [[r, y], …], sides) → BufferGeometry`, closed with caps, y as given, UVs normalised | Spool and barrel drums. The wave 3 lamps and pots will need a lathe anyway. | lamps (shades, bases), plants (pots), table (turned legs) |
| `panelFromShape` (geometry) → **merged as `extrudeProfile` (A5) + `endPanelShape` (A6)** | `extrudeProfile(endPanelShape(…), thickness, bevel, 'side')`: outline in (z, y), thickness along x, outline extents exact | Slab end panels with an arch or notch cut out. | bench (slab ends), shelf (side panels), desk / table (trestle ends) |

Optional, if the architect prefers: a `floorFlush` flag on `buildLegs` that lifts each strut's bottom by
`rBottom × sin(tilt)` so the lowest cap vertex sits exactly on y = 0. The stool does **not** depend on it. The accepted
sink is bounded below. (Architect: rejected, see `_kit-additions.md`.)

## How legs meet the floor

- **No `tube` touches the floor.** This avoids the known `buildCurvyLegs` float (9–19 mm, `tests/regressions/chair.json`).
  Tubes are only used for closed footrest rings, which sit high and cross the legs.
- All floor-reaching legs are `strut`s from `buildLegs` with `bottom.y = 0`. A splayed strut's cap is tilted, so its
  lowest rim vertex sinks by `rBottom × sin(θ)`. With the clamps (rBottom ≤ 0.0275, legSplay ≤ 0.35 × legHeight, so
  θ ≤ 19.3°), the worst case is **≤ 9.1 mm**. That is within the sweep's `GROUND_MIN` of −20 mm and the same accepted
  behaviour as the chair.
- The diner base, drum body, drum plinth and slab panels all have flat bottoms at exactly y = 0.

## Failure modes and guards

| Failure | Guard | Test |
|---|---|---|
| Legs floating above the floor (tube end caps) | No tubes to the floor; legs are struts from y = 0 | Grounded invariant; regression list starts empty |
| Strut caps sink too far | legSplay ≤ 0.35 × legHeight; legThickness ≤ 0.055 → sink ≤ 9.1 mm | Grounded (min y ≥ −20 mm); add a stool check: min y ≥ −0.012 |
| Footrest ring floats between legs | Ring points are the leg axes at footrestHeight (`legLines`), so the ring passes through every leg | Connected invariant |
| Footrest at or above the seat / too high to use | footrestHeight ≤ legHeight − 0.15 and ≥ 0.17; second ring dropped if above legHeight − 0.08 | Type check `footrestBelowSeat`: footrestHeight + footrestRadius < legHeight − 0.05 |
| Leg tops poke through the seat top | Leg top = pan underside; seatThickness ≥ rTop × sin θ + 0.005 (raise seatThickness if needed) | Type check `nothingAboveSeat`: bbox max y ≤ seatHeight + 0.002 |
| Leg tops poke out of the seat edge | `legAnchors` inset 1.2 × legThickness; splay is outward below the seat only | Visual review |
| Box rail caps stick out of the legs | Rail radius ≤ 0.8 × leg radius, end points on leg axes | Visual review |
| Box rail joints clash at one height | footrestStagger raises the side rails by 3 × radius (chance 0.4); unstaggered, the four rails meet inside the leg and are hidden | Visual review |
| Diner tips (base too small for a tall column) | baseRadius = clamp(0.28–0.33 × seatHeight, 0.19, 0.26) | Stable invariant; type check baseRadius ≥ 0.24 × seatHeight |
| Diner ring touches nothing | Spokes run from the column surface to the ring at the same y; ring radius ≥ columnRadius × 1.6 + 0.10 | Connected invariant |
| Milking stool tips | 3 legs splayed wider than the seat; centre stays inside the leg triangle by symmetry | Stable invariant |
| Spool drum too thin at the waist / barrel too pinched at the ends | drumWaist ≥ 0.65 (spool), ≥ 0.8 (barrel) | Param contract |
| Drum cushion overhangs or sinks | Cushion radius = body top radius − 0.005, cushion bottom 1 mm into the body | Visual review |
| Drum feet lift a body that then looks tippy | Feet only on drumBase 'feet'; feet height 0.06–0.12; feet anchors use body bottom radius × 0.8 | Stable invariant |
| Slab arch leaves stick-thin feet | arch width ≤ 0.6 × seatDepth, height ≤ 0.4 × legHeight → each foot ≥ 0.2 × seatDepth ≈ 0.05 m | Param contract |
| Slab stretcher misses the panels | Stretcher runs between panel inner faces at footrestHeight, length = distance between faces + 2 × 0.005 embed | Connected invariant |
| Seat / cushion z-fighting | Cushion outline inset 0.01 m and sunk 1 mm into the pan; pan and cushion are different materials | Visual review |
| Counter and bar read the same | Height gap 0.68 / 0.72; counter favours square seats and straight rails, bar favours round seats and rings | Visual review (grid read) |
| Re-rolled shape breaks the footrest (perimeter rails with 3 legs) | Footrest resolves kind against the current legCount on every run | Re-roll sweep with random reroll maps |
| Footprint too big for the cell | Max legged footprint = seatWidth + 2 × legSplay − 2 × inset ≤ 0.44 + 0.18 = 0.62; diner base Ø ≤ 0.52; drum Ø ≤ 0.50; slab 0.60 × 0.34 | Fits-cell invariant |
| Unreadable silhouette: tiny stool next to bar stools at overview distance | Low styles (milking, drum, slab) are chunky (thick seat, wide spread) on purpose | Visual review |

Joined part pairs (allowed to overlap in the intersection check): seat pan ↔ cushion, seat pan ↔ leg tops, legs ↔
rings / rails, column ↔ hub ↔ pan, column ↔ base, column ↔ spokes ↔ ring, drum body ↔ cushion / plinth / feet, slab
panels ↔ plank ↔ stretcher.

Proposed `TYPE_RULES.stool`: `maxSize { width: 0.70, height: 0.85, depth: 0.70 }`; checks `centredInX`,
`nothingAboveSeat`, `footrestBelowSeat`, `seatHeightInStyleRange` (bbox max y in the style's seatHeight range ± 2 mm).

### Budget estimate (triangles, before merge)

| Style | Worst case | Main contributors |
|---|---|---|
| bar | ≈ 2.1k | puffy pan 588 + puffy cushion 588 + 4 legs × 8 sides 128 + 2 rings 768 |
| counter | ≈ 1.6k | pan + cushion 1,176 + 4 legs + 4 rails ≈ 250 + optional ring 384 |
| diner | ≈ 1.1k | cushion + pan discs 432 + base / column / sleeve / hub ≈ 200 + ring 384 + spokes 64 |
| milking | ≈ 0.5k | extruded oval ≈ 330 + 3 legs ≈ 100 |
| drum | ≈ 1.0k | lathe ≈ 16 × 12 × 2 = 384 + cushion disc 216 + plinth / feet ≈ 200 |
| slab | ≈ 1.2k | plank 588 + 2 cutout panels ≈ 400 + stretcher 24 |

Everything is far below 6k. Draw calls after merge are ≤ 3 (pan, cushion, frame; or cushion, body, frame).

## describe() rows

| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `bar` / `counter` / … |
| shape | Height | `76 cm · bar` (class from seatHeight: < 0.50 low, ≤ 0.69 counter, else bar) |
| shape | Seat | `round ⌀ 38 cm` / `square 40 × 40 cm` / `oval 32 × 26 cm` |
| shape | Seat thickness | `4 cm` (+ ` · cushion 6 cm` when hasCushion) |
| shape | Legs | `4 · splay 6 cm · 3.5 cm thick` (legged) · `column · sleeve` (diner) · `spool · plinth` (drum) · `2 panels · arch` (slab). Words come from the style, not from `legCount` |
| shape | Base | diner only: `cone ⌀ 46 cm` |
| footrest | Footrest | `ring at 30 cm` / `double ring at 28 / 52 cm` / `rails at 22 cm (staggered)` / `H at 20 cm` / `pedestal ring ⌀ 38 cm` / `stretcher` / `none` |
| palette | Colours | `{ swatches: [cushionColor, cushionSecondary?, bodyColor (drum), accentColor (if painted)] }` |
| pattern | Pattern | `solid` / `stripes (vertical)` / `checker`; hidden when there is no cushion and the item is not a drum |
| finish | Frame | `oak wood` / `metal` / `black` / `match` |
| finish | Seat | `oak planks` / `painted` / `matches frame` |

Top-level `swatches`: [cushionColor (if any), pattern secondary (if not solid), panColor, frameColor].

## Grid cell

**spacing: 1.2 m, gridSize: 25.**

The biggest x/z footprint is a bar stool with a 0.44 m seat and 0.09 m splay, about **0.62 m**. Next come the slab
(0.60 m) and the diner base (Ø 0.52 m). The fits-cell limit is 1.2 − 0.1 = 1.1 m, which leaves about 0.5 m of air
between neighbours. That is roughly the same ratio the chair grid has (1.7 m cells for chairs up to about 0.95 m).
Stools are small and mostly tall, so a tighter grid reads as a showroom and not a sparse field. With 625 items at
≤ 2.1k triangles each, the scene stays well under the chair grid's total.

## Open questions

1. ~~**Style re-roll rate.**~~ Answered by ruling R1: option (a), as `rollStyle(g, styles)` built on `g.count`.
2. **Six styles or four?** The plan lists bar, counter, milking and drum. I added `diner` (it is the plan's "swivel
   column", and it gives the pedestal its own silhouette) and `slab` (step / plank stool). Keep both, drop `slab`
   (it overlaps a little with the bench's plank style), or fold `diner` into bar and counter as a support option?
   *Architect: keep all six. Diner is the only pedestal silhouette among the stools. Slab reads as a stool (0.40–0.60 m
   long) next to the bench's plank (1.0–1.8 m), and both share `endPanelShape`, so it costs little.*
3. **Backrests.** Many real bar and counter stools have a low back. This spec keeps stools strictly backless so they
   never read as tall chairs, and so the `nothingAboveSeat` check holds. Add an optional low back (chance about 0.2,
   bar and counter only) later?
   *Architect: later (wave 1.5 or wave 4), as a chance about 0.2 on bar and counter, with `nothingAboveSeat` gated on it.
   Not in v1.*
4. **Bentwood legs (Aalto Stool 60).** The L-shaped bent leg is iconic but needs a tube that reaches the floor. That
   means fixing `buildCurvyLegs` first (end the tube at y = 0 and cap it, or add a foot disc). Do we want that fix in
   the kit now, which would also clear the 150 known-bad chair seeds? Or should stools avoid tubes to the floor as
   specified?
   *Architect: the float half is answered. PR #4 adds `bentwoodFoot` and clears the known-bad chair seeds, so a tube may
   now reach the floor when it is closed with `bentwoodFoot`. The Aalto L-bend itself is a new leg shape (an L, not a
   `LEG_PROFILES` offset curve). Recommend deferring it to after wave 1 as a fourth stool support; v1 stays as specified.*
5. **Through-tenons on milking stools.** Leg ends showing through the seat top are a charming detail, but they break
   `nothingAboveSeat` and risk z-fighting. Allow them, 1 mm proud, as a listed exception?
   *Architect: no for v1. A 1 mm tenon is invisible at grid distance, and it would need its own exception in the check.*
6. **Saddle seats.** Sculpted wooden saddle seats are common on bar stools but need a new dished-seat helper. Defer to a
   later wave?
   *Architect: defer. A dished seat is a new geometry helper with one user.*
7. ~~**Helper ownership.**~~ Answered in `_kit-additions.md`: `legLines` + `pointOnLeg` (B2), `buildStretchers` (C1),
   `buildPedestal` (C3).
8. ~~**Grid spacing.**~~ Answered by ruling R4: each type keeps its own square spacing (camera framing scales with it),
   and 1.2 / 25 is approved. Wave 4 ensembles get their own cell.

## Sources

- [Wayfair: Bar stool dimensions](https://www.wayfair.com/sca/ideas-and-advice/guides/bar-stool-dimensions-how-to-choose-the-right-ones-T494.html)
- [NFM: Bar stool heights guide](https://nfm.com/bar-stool-heights.html)
- [Living Spaces: Choosing bar stool height](https://livingspaces.com/inspiration/ideas-advice/how-tos/how-to-choose-the-right-bar-stool-height)
- [AllModern: Bar stool height and width tips](https://www.allmodern.com/sca/inspiration/inspiration/bar-stool-height-width-tips-T5819)
- [restaurant-furniture.com: Bar and counter stool measurements](https://www.restaurant-furniture.com/resources/guides/bar-stool-and-counter-stool-measurements-and-spacing-layout-selecting-the-right-dimension)
- [by-crea: Bar stool footrest height](https://by-crea.com/pages/footrest-height-importance)
- [calculator.academy: Stool height calculator](https://calculator.academy/stool-height-calculator/)
- [Overstock: Swivel bar stools with footrest](https://www.overstock.com/products/swivel-bar-stools-with-footrest-38363277)
- [Pamono: French farmhouse milking stool](https://www.pamono.co.uk/vintage-french-farmhouse-milking-stool-on-3-legs-1950s-or-1960s)
- [Chairish: Antique three-legged milking stool](https://www.chairish.com/product/28801102/antique-rustic-three-legged-milking-stool)
- [Museum Wales: Milking stool](https://museum.wales/collections/online/object/7af735ab-438e-3479-bf17-6fc0bf1bd179?page=76)
- [Ingenium: Stool, milking](https://collection.ingenium.ca/en/id/1987.0370.001)
- [Innes: Artek 60 low stool](https://www.innes.co.uk/products/artek-ar60-low-stool-aalto)
- [dimensions.com: Artek Aalto Stool 60](https://www.dimensions.com/element/artek-alto-stool-60)
- [dimensions.com: Drum pouf](https://dimensions.com/element/drum-pouf-cocktail)
- [DWR: Drum pouf high](https://www.dwr.com/living-ottomans/drum-pouf-high/100341710.html)

## Architect review

Backlog 2.6. **Verdict: approved with edits.** The rulings (R1–R7) and helper ids (A1–C4) are in
`specs/_kit-additions.md`.

Checklist:
- Style weights sum to 1.00, and every per-style weight set sums to 1.
- Group order and `reads` are correct. Footrest resolves against the current `legCount` on every run.
- Ranges are plausible. The worst case is about 2.1k tris and 3 draw calls, inside the budget.
- The max footprint is 0.62 m, inside the 1.10 m cell limit.

What I changed:
1. `style` uses `rollStyle` (R1). Open question 1 is struck.
2. `legCount` counts `buildLegs` struts only: diner 0 and slab 0 (were 1 and 2), so build never reaches the chair's
   pedestal or sled branches (R6). The describe words come from the style.
3. Footrest kind `box` is renamed `perimeter`, the shared stretcher vocabulary (R6).
4. The footrest group gets `appliesTo` (not milking or drum, R2). Without it the change rate would be about 70 % and fail
   the test. `pedestalRingRadius` and `pedestalSpokes` are neutral (0) outside diner, so an inert re-roll cannot change
   invisible fields.
5. Kit reuse is mapped to the merged helpers:
   - `legLines` → B2 (as `legLines` + `pointOnLeg`).
   - `legStretchers` → `buildStretchers` (C1).
   - `pedestalColumn` → `buildPedestal` (C3); the hub is its `cap`.
   - `panelFromShape` → `extrudeProfile` (A5) + `endPanelShape` (A6). The designer missed that the bench needs the same
     notched end panel.
   - `latheSolid` (A7) is deferrable, with the straight drum as the fallback.
   - The diner ring with spokes and the slab stretcher stay stool-local (R7).
6. `floorFlush` is rejected: the sink is already bounded at 9.1 mm.
7. Open questions 7 and 8 are struck (helper list, R4). The rest are annotated with recommendations.

### Kit landed (backlog 2.8): notes for the generator engineer

All helpers this spec uses are in core on branch `kit-additions`, including `latheSolid` (A7): the spool and barrel drum
profiles can be built now (`latheSolid([[r, y], …], 12)`, about 2·12·(points + 1) tris), so the straight-only fallback
is not needed. Differences from the text above:

1. `buildStretchers` `'h'` and `'ends'` throw unless at least 2 legs sit at z > 0 and 2 at z < 0. With `legLines` from
   `legAnchors`, 3 legs never qualify, so the footrest params must resolve 3-leg stools to `ring` or `perimeter` (as the
   spec's "resolve against shape" rule says).
2. `buildStretchers(…, 'ring', …)` uses `sides` (default 6) and 32 segments; a double ring is a second call.
3. `buildPedestal` `disc` uses a fixed 0.008 rim; the hub is `cap` and the column ends at `top − cap.height`. The sleeve
   is clamped below the cap.
4. `appliesTo` on `footrest`: the re-roll test now measures the change rate only where it applies and, elsewhere,
   requires a footrest re-roll to change no field outside the footrest group. With neutral values that holds trivially.
