# Bed spec

## Summary

A bed is a frame (platform, slatted wood, upholstered, four-poster or bunk) that holds a mattress, plus the bedding that makes it read as a bed and not a box: pillows, a duvet with a folded-back top edge that drapes softly over the mattress sides, and sometimes a throw across the foot. Two things make it fun to generate. The frames have strong silhouettes: a low floating slab, a slatted wood grille, a tall padded headboard, four tall corner posts with a canopy outline, two stacked bunks with a ladder. The soft goods are a new kit layer (backlog M4) that every bed shares: pillow arrangements, duvet weight, fold depth and fold material, drape length and throws. Seeds differ first in **silhouette** (style, mattress width 90/140/160/180, headboard kind and height, posts), then in **bedding rhythm** (single pillow vs euro stack, crisp white sheet fold vs duvet fold, runner vs folded throw), then in **colour and print**. The re-roll groups follow that order: style, size, frame, bedding, palette, pattern, finish.

Conventions for this type: the **head is at −z and the foot at +z** (the foot end faces the camera, as in catalogue 3/4 shots and in the wave-4 bedroom set where the headboard goes against the wall). The mattress long axis runs along z. The item bbox is centred analytically on x and z (see Derived layout).

## Real-world references and dimensions

Sources are listed below the table. Inch values are converted. "Used" is what the generator rolls; where it differs from the sources, the reason is in brackets.

| Dimension | Real range | Used | Source |
|---|---|---|---|
| Mattress width × length (EU) | 90, 140, 160, 180 × 200 cm (UK/US variants 190–203 cm long) | width ∈ {0.90, 1.40, 1.60, 1.80}, length 2.00 fixed | [IKEA bedding], [Cloudpillo], vision doc |
| Mattress thickness | 15–30 cm typical; bunk mattresses capped at 15–19 cm (6–7.5 in) | 0.16–0.26 (bunk 0.12–0.16) | [Room & Board], [Pottery Barn] |
| Floor to mattress top | 50–65 cm typical; 61–64 cm (24–25 in) "standard"; 40–60 cm comfortable sitting | platform 0.30–0.44, slatted 0.45–0.58, upholstered 0.50–0.62, four-poster 0.55–0.70, bunk lower 0.32–0.42 [platform deliberately low so it reads as its own silhouette] | [Nectar], [Maxihome], [Cort] |
| Headboard above mattress | ≥ 30 cm (1 ft) above the mattress top | slatted top 0.85–1.05, upholstered 1.10–1.40, four-poster panel 0.95–1.25, platform mattressTop + 0.20–0.45 | [Woodbin] |
| Four-poster post height | 79–90 in → 2.0–2.3 m; footboard posts sometimes lower | 1.80–2.15 (+ finial ≤ 0.06), total ≤ 2.20 [capped for the grid camera and `maxSize`] | [DutchCrafters], [Sonder] |
| Floor to side-rail (four-poster) | 8–10 in → 0.20–0.25 m | rail bottom ≥ 0.18 | [DutchCrafters] |
| Bunk overall height | 137–185 cm (54–73 in) | 1.42–1.80 | [Room & Board], [Pottery Barn] |
| Bunk clearance (lower mattress top → upper frame) | 84–97 cm (33–38 in) | 0.78–0.92 [lower end so the whole bunk stays ≤ 1.80] | [Room & Board], [Pottery Barn] |
| Bunk guard rail above upper mattress | ≥ 12.7 cm (5 in, US CPSC per a retailer); EN 747 values not verified | ≥ 0.16 (0.16–0.22) [the stricter value] | [Mattress Miracle], [Sleepland] |
| Bunk access opening | 30–38 cm (12–15 in) | ladderWidth 0.32–0.40, opening = ladderWidth + 0.04 | [Sleepland], [Mattress Miracle] |
| Bunk ladder | ≈ 0.36 m wide × 1.17 m high, 7.6 cm thick | stile spacing 0.32–0.40, rung pitch 0.24–0.30 | [Pottery Barn] |
| Sleeping pillow | EU 50 × 70; UK 50 × 75; US standard/queen 51 × 66–76 | 0.46–0.52 × 0.62–0.76, thickness 0.10–0.16 | [Sylvie Thiriez], [T3] |
| Euro / continental square | 65 × 65 (EU), 80 × 80 (DE) | 0.60–0.80 square, thickness 0.14–0.20 | [Sylvie Thiriez], [T3] |
| Duvet vs mattress | 200 × 200 on a 160 bed (≈ 20 cm per side); 240 × 220 on a 160/180 bed (30–40 cm per side, ≈ 10 cm at the foot) | side drop 0.12–0.40 below the mattress top, clamped by the frame | [Cloudpillo], [IKEA bedding] |
| Duvet loft | not in sources; thin summer quilts ≈ 2–3 cm, down duvets 5–8 cm when made | quilt 0.020–0.035, duvet 0.045–0.080 | estimate |

Sources:
- [IKEA bedding] [IKEA, guide to bedding sizes](https://www.ikea.com/es/en/rooms/bedroom/how-to/guide-to-bedding-sizes-pub3d66ecb0)
- [Cloudpillo] [Overview of all duvet sizes](https://cloudpillo.com/blogs/news/overview-of-all-duvet-sizes)
- [Nectar] [Bed height](https://www.nectarsleep.com/posts/bed-height)
- [Maxihome] [Bed frame heights: low, standard, tall compared](https://www.maxihome.com.sg/blogs/news/bed-frame-heights-low-standard-tall-compared)
- [Cort] [Guide to bed height](https://www.cort.com/ideas-and-inspiration/design-guides/guide-to-bed-height)
- [Woodbin] [Bed design guidelines](https://woodbin.com/ref/furniture-design/beds/)
- [DutchCrafters] [Amish Shakespeare pencil post bed](https://www.dutchcrafters.com/Amish-Shakespeare-Pencil-Post-Bed-with-Canopy-Option/p/58486), [Rosewood poster bed](https://www.dutchcrafters.com/Amish-Rosewood-Poster-Bed/p/65375?so=1)
- [Sonder] [Otis poster bed](https://www.sportique.com/collections/furniture/products/sonder-living-otis-poster-bed-us-king)
- [Room & Board] [Fort bunk beds](https://www.roomandboard.com/catalog/bedroom/all-kids/fort-bunk-beds-twin-over-full)
- [Pottery Barn] [Austen bunk bed](https://www.potterybarnkids.com/products/austen-twin-bunk-bed/), [Camp bunk bed](https://potterybarnkids.com/products/camp-bunk-bed_0)
- [Mattress Miracle] [Bunk bed measurements](https://mattressmiracle.ca/blogs/mattress-miracle-blog/bunk-bed-measurements)
- [Sleepland] [Bunk bed safety](https://sleeplandbeds.co.uk/bunk-bed-safety)
- [Sylvie Thiriez] [Pillowcase sizes](https://www.sylviethiriez.com/en/what-are-the-sizes-of-pillowcases)
- [T3] [Pillow size guide](https://www.t3.com/us/features/pillow-size-guide)

## Styles

Weights sum to 1.00. Every style has a different silhouette at grid distance: height profile (low slab / mid grille / tall soft board / tall posts / two levels) is the primary cue, not colour.

### platform (weight 0.22)
- **Silhouette:** low and broad. A thick slab, 0.30–0.44 m to the mattress top, sticks out 3–15 cm beyond the mattress at the sides and foot and hovers on a deeply recessed plinth or short legs. Headboard none, a low slab, or a wide slab with two floating side shelves (nightstand ledges). Japanese / minimalist.
- **Parts:** recessed plinth or 4–6 short legs; platform slab; optional headboard slab; optional 2 headboard shelves; mattress; bedding.

### slatted (weight 0.24)
- **Silhouette:** a Scandinavian wood frame on visible corner legs. The head posts rise to 0.85–1.05 m and frame a grille of vertical slats or 2–4 horizontal boards. The foot end is a plain rail, a low slatted footboard or a low board. Light shows under the side rails.
- **Parts:** 4 corner posts (square `beam` or round tapered `strut`); 2 side rails + foot rail; headboard (top and bottom rail + slats or boards); optional footboard (rails + slats, or a board); mattress; bedding.

### upholstered (weight 0.24)
- **Silhouette:** a tall padded headboard (1.10–1.40 m), as wide as or wider than the base, on a fabric-covered base whose thick rails sit almost flush with the mattress. Headboard shape: flat panel, arched top, vertical channels, or wingback with side wings that wrap forward. No visible legs (recessed toe-kick plinth).
- **Parts:** toe-kick plinth; 2 side rails + foot rail (all `puffy`); headboard (panel / arch / channel / wingback + 2 wings); mattress; bedding.

### fourPoster (weight 0.15)
- **Silhouette:** four tall corner posts (1.80–2.15 m) with either a box canopy outline (4 top rails) or finials. Headboard panel between the head posts; footboard rail or a low panel. The posts are turned, square, tapered, or thin metal (iron bed look). The tallest silhouette in the showroom.
- **Parts:** 4 posts (turned / square / tapered / thin); 4 canopy rails or 4 finials; 2 side rails + foot rail; headboard panel (flat or arched); optional low footboard panel; mattress; bedding.

### bunk (weight 0.15)
- **Silhouette:** two stacked 90 × 200 beds in one post frame, 1.42–1.80 m tall. Guard rails around the upper bunk, and a ladder: either vertical/leaning on one long side near the foot, or built into the foot end as rungs. Unmistakable even as a silhouette.
- **Parts:** 4 full-height posts; lower and upper side rails; 2 deck boards; head and foot end fills (rails / slats / panel) at both levels; upper guard rails (1–2 bars per side, with an access opening and a guard post on the ladder side); ladder (2 stiles + rungs); 2 mattresses; 2 pillows; 2 tucked duvets; optional folded throw on the lower bunk.

Deferred (see Open questions): metal/brass spindle bed as its own style, daybed, trundle, loft bed, twin-over-double bunk, fabric canopy curtains.

## Parameters

Units in meters, angles in degrees. Every field exists for every style; when it does not apply it has a neutral value (`0`, `null`, `'none'`, `false`), so the field set is fixed (R2). "Per style" ranges are in the tables below the master table.

### Master table

| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| `style` | platform, slatted, upholstered, fourPoster, bunk | `rollStyle(g, styles)`; 0.22 / 0.24 / 0.24 / 0.15 / 0.15 at re-roll 0 (R1) | none | style |
| `mattressWidth` | {0.9, 1.4, 1.6, 1.8} | weighted pick per style (table below) | style | size |
| `mattressLength` | 2.0 | constant | none | size |
| `mattressThickness` | 0.16–0.26 (bunk 0.12–0.16) | uniform | style | size |
| `mattressTop` | per style (lower bunk for bunk); clamped ≥ `mattressThickness + minDeck` (platform 0.12, others 0.18) | uniform then clamp | style, mattressThickness | size |
| `deckY` | `mattressTop − mattressThickness` | derived | mattressTop | size |
| `clearance` | 0.01–0.02 (mattress side to frame inner face, also at head and foot) | uniform | none | size |
| `mattressRadius` | 0.025–0.05 (passed through `edgeRadius`) | uniform | none | size |
| `headKind` | per style set (table below) | weighted pick | style | frame |
| `headHeight` | per style (y of the headboard top); clamped ≥ `mattressTop + 0.18`; 0 when `headKind = 'none'` | uniform then clamp | style, size | frame |
| `headThickness` | platform 0.04–0.08 · slatted slat depth 0.018–0.03 · upholstered 0.08–0.16 · fourPoster 0.03–0.06 · bunk 0 | uniform | style, headKind | frame |
| `headOverhang` | x reach past the frame each side: upholstered 0.02–0.10 · platform low 0–0.05 · others 0; clamped so headboard width ≤ 2.30 | uniform then clamp | style, size | frame |
| `headSlatCount` | vertical: `round(innerWidth / pitch)`, pitch 0.10–0.16, clamped 5–14 · horizontal 2–4 · else 0 | derived from a rolled pitch / int | headKind, size | frame |
| `headSlatWidth` | vertical 0.03–0.06 (≤ 0.5·pitch) · horizontal 0.06–0.12 · else 0 | uniform then clamp | headKind | frame |
| `archRise` | 0.06–0.20, clamped ≤ 0.4·(headHeight − mattressTop) (arch only) | uniform then clamp | headKind, headHeight | frame |
| `channelCount` | `round(headWidth / 0.27)` jittered ±1, clamped 3–7 (channel only) | derived + int jitter | headKind, size | frame |
| `channelBulge` | 0.02–0.04 (channel only) | uniform | headKind | frame |
| `wingDepth` / `wingThickness` | 0.12–0.24 / 0.08–0.12 (wingback only) | uniform | headKind | frame |
| `shelfWidth` | `min(0.42, (2.35 − slabWidth) / 2)`; wide headboard falls back to `low` when < 0.28 | derived | headKind, size, ledge | frame |
| `shelfDepth` / `shelfThickness` / `shelfLift` | 0.28–0.38 / 0.03–0.05 / −0.02…0.08 (shelf top − mattressTop) (wide only) | uniform | headKind | frame |
| `footKind` | per style set (table below) | weighted pick | style | frame |
| `footHeight` | low board / low slats / panel: `mattressTop + (0.05–0.25)`; rail / none: rail top | uniform or derived | footKind, size | frame |
| `footSlatCount` | low slats: same pitch as the head (clamped 4–14); else 0 | derived | footKind, headSlatCount | frame |
| `railHeight` | slatted 0.10–0.18 · fourPoster 0.14–0.22 · bunk 0.10–0.14 · upholstered derived (`deckY + railRise − plinthHeight`) · platform 0 | uniform / derived | style | frame |
| `railThickness` | slatted 0.025–0.045 · fourPoster 0.03–0.05 · bunk 0.03–0.045 · upholstered 0.06–0.12 · platform 0 | uniform | style | frame |
| `railRise` | rail top above the deck: slatted 0–0.08 · upholstered 0–0.10 · fourPoster 0.02–0.08 · bunk 0.03–0.06 · platform 0; clamped ≤ `mattressThickness − 0.06` | uniform then clamp | style, size | frame |
| `postProfile` | slatted square / round · fourPoster turned / square / tapered / thin · bunk square · else `'none'` | weighted pick | style | frame |
| `postSize` | slatted 0.045–0.07 · fourPoster 0.06–0.10 (thin 0.03–0.045) · bunk 0.06–0.09 · else 0 | uniform | style, postProfile | frame |
| `postHeight` | fourPoster 1.80–2.15, clamped ≥ headHeight + 0.45 and ≤ 2.20 − finial · others: derived (slatted head posts = headHeight, bunk = guardTop + postCap) | uniform then clamp / derived | style, headHeight | frame |
| `canopy` | fourPoster: true 0.6 / false 0.4 · else false | weighted | style | frame |
| `canopyRailHeight` | 0.04–0.07 (canopy only) | uniform | canopy | frame |
| `finial` | fourPoster without canopy: 0.03–0.06 knob height (thin posts: ball 0.03–0.04) · else 0 | uniform | canopy, postProfile | frame |
| `support` | platform: plinth 0.6 / legs 0.4 · upholstered: plinth · slatted, fourPoster, bunk: posts | weighted / fixed | style | frame |
| `legCount` | platform legs: 4 (mattressWidth ≤ 1.4) or 6 · else 0 (R6: plinth and posts are built another way) | derived | support, size | frame |
| `legHeight` | platform legs 0.06–0.15 · else 0 | uniform | support | frame |
| `legThickness` / `legSides` / `legTaper` | 0.05–0.08 / pick [4, 8] / 0.7–1.0 (platform legs only) | uniform / pick | support | frame |
| `legSplay` | 0 | constant | none | frame |
| `legInset` | 0.08–0.20 (platform legs only) | uniform | support | frame |
| `plinthHeight` | platform plinth: `deckY − slabThickness` (≥ 0.03) · upholstered toe kick 0.02–0.06 · else 0 | derived / uniform | support, size | frame |
| `plinthInset` | platform 0.06–0.18 · upholstered 0.02–0.05 · else 0 | uniform | support | frame |
| `slabThickness` | 0.06–0.14, clamped ≤ deckY − 0.03 (platform only) | uniform then clamp | style, size | frame |
| `ledge` | 0.03–0.15 (platform only; slab width = mattressWidth + 2·ledge, clamped ≤ 2.15) | uniform then clamp | style, size | frame |
| `bunkClearance` | 0.78 … min(0.92, 1.80 − rest of the stack) (bunk only) | uniform then clamp | style, size | frame |
| `guardAbove` | 0.16–0.22 (guard top − upper mattress top; bunk only) | uniform | style | frame |
| `guardBars` | 1 (0.45) / 2 (0.55) (bunk only) | weighted | style | frame |
| `postCap` | 0–0.05 (post top above guard top; bunk only) | uniform | style | frame |
| `upperRailBottom`, `upperDeckY`, `upperMattressTop`, `guardTop` | bunk stack (see Derived layout) · else 0 | derived | size, bunkClearance, railHeight, railRise, guardAbove | frame |
| `ladderKind` | side 0.65 / end 0.35 (bunk only, else `'none'`) | weighted | style | frame |
| `ladderSide` | left / right (side ladder only, else null) | 50 / 50 | ladderKind | frame |
| `ladderLean` | 0 (0.6) or 0.10–0.20 foot offset (side ladder only) | weighted then uniform | ladderKind | frame |
| `ladderWidth` | 0.32–0.40 (stile centre spacing, side ladder; end ladder = inner width between foot posts) | uniform / derived | ladderKind | frame |
| `rungProfile` | round (`strut`, 6 sides) 0.5 / flat (`beam`) 0.5 | 50 / 50 | ladderKind | frame |
| `rungCount` | `floor((upperRailTop − 0.22) / pitch) + 1`, pitch 0.24–0.30 → typically 4–6 | derived from a rolled pitch | bunk stack | frame |
| `endFill` | rails 0.45 / slats 0.30 / panel 0.25 (bunk ends; the footboard of an end-ladder bunk becomes rungs) | weighted | style | frame |
| `frameWidth`, `frameLength`, `overallHeight` | outer extents (see Derived layout) | derived | size, frame | frame |
| `pillowArrangement` | 0.9 wide: single 0.6 / singleLean 0.2 / euroSingle 0.2 · ≥ 1.4: pair 0.35 / pairLean 0.25 / euroStack 0.40 · bunk: single | weighted, then fallback (see Bedding layout) | size, frame (headroom) | bedding |
| `pillowCount` / `euroCount` | derived: single 1/0, singleLean 1/0, euroSingle 1/1, pair 2/0, pairLean 2/0, euroStack 2/2 | derived | pillowArrangement | bedding |
| `pillowWidth` | 0.62–0.76, clamped ≤ (mattressWidth − 0.04 − (n − 1)·0.01) / n | uniform then clamp | size, pillowCount | bedding |
| `pillowLength` / `pillowThickness` | 0.46–0.52 / 0.10–0.16 | uniform | none | bedding |
| `pillowPinch` | 0.35–0.60 | uniform | none | bedding |
| `pillowLean` | lean arrangements: 18–30° from vertical (0 when flat) | uniform | pillowArrangement | bedding |
| `euroSize` / `euroThickness` / `euroLean` | 0.60–0.80 clamped ≤ (mattressWidth − 0.04) / euroCount / 0.14–0.20 / 10–20° (0 when no euros) | uniform then clamp | euroCount, size | bedding |
| `euroRole` | accent 0.5 / bedding 0.5 (null when no euros) | 50 / 50 | euroCount | bedding |
| `decoKind` | none 0.55 / square 0.25 / lumbar 0.20 (bunk: none) | weighted | style | bedding |
| `decoWidth` / `decoHeight` / `decoThickness` / `decoLean` | square 0.36–0.45 (w = h) · lumbar 0.45–0.55 × 0.28–0.34 / 0.10–0.14 / 25–40° | uniform | decoKind | bedding |
| `duvetKind` | quilt 0.3 / duvet 0.7 | weighted | none | bedding |
| `duvetThickness` | quilt 0.020–0.035 · duvet 0.045–0.080 | uniform | duvetKind | bedding |
| `duvetCrown` | quilt 0–0.01 · duvet 0.01–0.035 | uniform | duvetKind | bedding |
| `duvetFit` | bunk: tuck · else drape 0.85 / tuck 0.15 | weighted / fixed | style | bedding |
| `footFit` | drape when nothing rises above the rail at the foot (platform, upholstered, slatted with `footKind = none`; see Bedding layout); tuck for fourPoster (foot posts), slatted with a footboard, bunk, and whenever `duvetFit = tuck` | derived | style, footKind, duvetFit | bedding |
| `drapeFloor` | y the hem must stay above (see Bedding layout) | derived | style, size, frame | bedding |
| `sideDrop` | wanted 0.12–0.40 below `mattressTop`; clamped ≤ `mattressTop − drapeFloor − 0.01`; tuck: 0 | uniform then clamp | duvetFit, drapeFloor | bedding |
| `footDrop` | `sideDrop` (same hang) when footFit = drape, else 0 | derived | footFit, sideDrop | bedding |
| `hemFlare` | 0–0.025 | uniform | none | bedding |
| `cornerSag` | 0–0.06, clamped so the corner hem stays ≥ drapeFloor + 0.01 (drape × drape corners only) | uniform then clamp | sideDrop, footFit | bedding |
| `foldDepth` | 0 (0.25) or 0.18–0.40 | weighted then uniform | none | bedding |
| `foldRoll` | 1.0–1.4 × duvetThickness (0 when no fold) | uniform | foldDepth, duvetThickness | bedding |
| `foldMaterial` | duvet 0.6 / sheet 0.4 (null when no fold) | weighted | foldDepth | bedding |
| `wrinkle` / `wrinkleSeed` | 0–0.008 / int 0–9999 | uniform / int | none | bedding |
| `throwKind` | none 0.40 / runner 0.35 / folded 0.25 · bunk: none 0.6 / folded 0.4 | weighted | style | bedding |
| `throwDepth` / `throwThickness` / `throwExtraDrop` | runner 0.35–0.60 / 0.012–0.025 / 0–0.05 (clamped like sideDrop) | uniform then clamp | throwKind | bedding |
| `throwWidth` / `throwFoldDepth` / `throwFoldThickness` / `throwYaw` / `throwSide` | folded 0.45–0.65 / 0.30–0.42 / 0.04–0.08 / −15…15° / left, right | uniform / 50 / 50 | throwKind | bedding |
| `mattressSegments` | bunk 2 (item-wide fallback for the mattress role, R3) · else 3 | derived | style | bedding |
| `duvetRes` | `'full'` · `'low'` for bunk | derived | style | bedding |
| `duvetMood` | neutral 0.40 / muted 0.40 / bold 0.20 (bunk 0.25 / 0.40 / 0.35) | weighted | style | palette |
| `beddingTone` | white 0.45 / ivory 0.30 / tinted 0.25 | weighted | none | palette |
| `beddingColor` | white: `shade(swatch(FRAME_COLORS.white), ±0.02)` · ivory: `capSaturation(0.11, 0.18–0.28, 0.86–0.90)` · tinted: `fabricColor(r, { mood: 'neutral' })` lifted with `shade` so l ∈ [0.74, 0.86] | derived from draws | beddingTone | palette |
| `duvetColor` | `fabricColor(r, { mood: duvetMood })`; if \|l − beddingColor l\| < 0.08, `shade(duvet, −0.12)` | picker then guard | duvetMood, beddingColor | palette |
| `duvetSecondary` | `harmoniousSecondary(duvet, mode)`, mode from `HARMONY_MODES` | pick | duvetColor | palette |
| `accent` / `accentSecondary` | `accentColor(r, duvet)` / `harmoniousSecondary(accent, mode)` (field renamed from `accentColor` so it does not shadow the picker) | picker | duvetColor | palette |
| `upholsteryColor` | `fabricColor(r, { mood })`, mood neutral 0.5 / muted 0.35 / bold 0.15; if \|Δl\| to duvetColor < 0.08, `shade(…, −0.12)`; always drawn (calm test), used by upholstered only | picker then guard | duvetColor | palette |
| `beddingTexture` | linen 0.7 / flat 0.3 | weighted | none | pattern |
| `duvetPattern` | none 0.50 / ticking 0.15 / gingham 0.10 / floral 0.10 / dots 0.08 / herringbone 0.07 (bunk: none 0.30 / gingham 0.22 / dots 0.20 / ticking 0.18 / floral 0.10); spec object with sizes below | weighted | style | pattern |
| `accentPattern` | none (texture) 0.45 / herringbone 0.15 / gingham 0.15 / dots 0.15 / floral 0.10; patterned chance drops to 0.2 when `duvetPattern ≠ none` | weighted | duvetPattern | pattern |
| `accentTexture` | linen 0.5 / bouclé 0.3 / flat 0.2 | weighted | none | pattern |
| `upholsteryTexture` | linen 0.45 / bouclé 0.30 / flat 0.25 | weighted | none | pattern |
| `fabricThread` | 0.8–1.3 (thread scale for linen/bouclé, as the sofa) | uniform | none | pattern |
| `frameMode` | per style (table below); `'none'` for upholstered | weighted | style, postProfile | finish |
| `frameColor` | wood: `pickWood` (capSaturation) · paint: `paintColor` · white / black / metal: `FRAME_COLORS` with `shade` l ±0.03 jitter · null for upholstered | picker | frameMode | finish |
| `woodName` / `paintName` | name or null | derived | frameMode | finish |
| `grain` | plain 0.5 / fine 0.3 / bold 0.2 (wood only, else `'none'`); platform slabs: plain 0.6 / bold 0.4 (no `fine`: pinstripe risk on wide tops) | weighted | frameMode, style | finish |

Pattern sizes (meters) for the duvet (large surfaces) and accent (throw, deco pillow, accent euros):

| Kind | Duvet | Accent |
|---|---|---|
| ticking | `spacing` 0.03–0.06, `width` 0.10–0.18, stripes run head → foot on the top (implementer: pick the `direction` value that gives z-running stripes on y faces), `double` 25 % | 0.022–0.034 |
| gingham | `spacing` 0.03–0.06, overcheck 30 % | 0.02–0.035 |
| floral | `spacing` 0.14–0.22, petals 5–6 | 0.09–0.13 |
| dots | `spacing` 0.05–0.09, `size` 0.16–0.24, offset 70 % | 0.03–0.05 |
| herringbone | `band` 0.03–0.05, `spacing` band / 3 | 0.022–0.034 |

### Per-style tables

| Field | platform | slatted | upholstered | fourPoster | bunk |
|---|---|---|---|---|---|
| mattressWidth weights (0.9 / 1.4 / 1.6 / 1.8) | 0 / 0.20 / 0.35 / 0.45 | 0.20 / 0.30 / 0.30 / 0.20 | 0 / 0.20 / 0.40 / 0.40 | 0 / 0.25 / 0.40 / 0.35 | 1 / 0 / 0 / 0 |
| mattressTop | 0.30–0.44 | 0.45–0.58 | 0.50–0.62 | 0.55–0.70 | 0.32–0.42 (lower) |
| headKind weights | none 0.20 / low 0.50 / wide 0.30 | vertical 0.50 / horizontal 0.30 / board 0.20 | panel 0.30 / arch 0.25 / channel 0.25 / wingback 0.20 | panel 0.45 / arch 0.35 / slats 0.20 | `endFill` |
| headHeight | mattressTop + 0.20–0.45 | 0.85–1.05 | 1.10–1.40 | 0.95–1.25 | guardTop (end fill) |
| footKind weights | none (ledge) | none 0.45 / lowSlats 0.30 / lowBoard 0.25 | rail (upholstered foot rail) | rail 0.50 / panel 0.50 | `endFill` (or rungs for an end ladder) |
| postProfile weights | none | square 0.6 / round 0.4 | none | turned 0.35 / square 0.30 / tapered 0.15 / thin 0.20 | square |
| frameMode weights | wood 0.60 / paint 0.25 / black 0.15 (architect: no white on the floor-level platform) | wood 0.70 / paint 0.15 / white 0.15 | none (fabric) | wood 0.60 / black 0.20 / white 0.10 / metal 0.10; thin posts: black 0.50 / metal 0.30 / white 0.20 | wood 0.55 / paint 0.25 / white 0.20 |

### Derived layout (build-time, from params, no randomness)

All values are computed analytically so the merged bbox is centred within 5 mm without measuring geometry.

- **Mattress:** `W = mattressWidth`, `L = 2.0`. The mattress head face sits at `zM0`, foot face at `zM1 = zM0 + L`.
- **Depth stack along z (head → foot):** `headDepth` (platform: headThickness; slatted / fourPoster / bunk: postSize; upholstered: headThickness; none: 0) + `clearance` + `L` + `clearance` + `footDepth` (platform: ledge − clearance, ≥ 0; slatted / fourPoster / bunk: postSize; upholstered: railThickness). `frameLength` = sum. `zM0 = −frameLength / 2 + headDepth + clearance`. Platform: the slab spans the mattress plus ledge at the sides and foot and ends flush with the headboard back.
- **Width:** `frameWidth = max(W + 2·clearance + 2·(railThickness or postSize), slab width, headboard width, shelf span, W + 2·(2·foldRoll + hemFlare))`. Symmetric in x except the bunk side ladder, whose protrusion `ladderOut = stile thickness + ladderLean` shifts the whole item by `−sign·ladderOut / 2` in x.
- **Clamps (fits cell):** `frameWidth ≤ 2.35`, `frameLength ≤ 2.38`. These clamp `headOverhang`, `shelfWidth`, `ledge` in the frame group.
- **Bunk stack:** `lowerMattressTop = mattressTop`; `upperRailBottom = lowerMattressTop + bunkClearance`; `upperRailTop = upperRailBottom + railHeight`; `upperDeckY = upperRailTop − railRise`; `upperMattressTop = upperDeckY + mattressThickness`; `guardTop = upperMattressTop + guardAbove`; `postHeight = guardTop + postCap`. `bunkClearance` is clamped so `postHeight ≤ 1.80`. The lower rails sit at `deckY + railRise` (top), bottom ≥ 0.06 above the floor.
- **Headroom** (used by bedding): `headRise = headHeight − mattressTop` (0 for `none`); for bunks, the end fill top at each level.

### Bedding layout (bedding group clamps; build places)

1. **Pillow zone.** Pillows rest on the mattress top, inside `|x| ≤ W/2 − 0.02`, laid out across x with `splitSpan(−W/2 + 0.02, W/2 − 0.02, n, 0.01)`. Placement is "rotate, measure, butt": rotate the pillow, take its `Box3`, translate so `min y = mattressTop` and its rear touches the support:
   - Row 1 (euros, or sleeping pillows in `pairLean` / `singleLean`): lean back by the lean angle against the headboard front plane (vertical): rear-most z = headboard front + 0.003.
   - Row 2 leaning on row 1 (sleeping pillows in `euroStack`): the support is row 1's front face, tilted back by `a1 = euroLean`. With the row-2 lean `a2` and row-2 height `h2 = pillowLength·cos a2`: if `a2 ≥ a1`, rear bottom edge at `z0 = zFront1 + h2·(tan a2 − tan a1) + 0.003` (contact at the top), else `z0 = zFront1 + 0.003` (contact at the bottom). `zFront1` is row 1's bottom-front edge.
   - Flat pillows (`pair`, `single`, `euroSingle` sleeping pillow): lie face down (long side along x), rear edge at the previous row's front + 0.01 (or headboard front + 0.02).
   - Deco pillow: centred on x, leaning `decoLean` on the front row with the same two-plane rule.
2. **Lean needs headroom.** A pillow may lean on the headboard only if `headRise ≥ height·cos(lean) + 0.04` and `headKind ≠ 'none'`; otherwise the arrangement falls back: `euroStack → pair`, `pairLean → pair`, `singleLean / euroSingle → single`.
3. **Zone budget.** `zoneEnd` (front-most pillow z) must stay ≤ `zM0 + 0.85`. If not: drop the deco pillow, then switch flat sleeping pillows to lean, then `euroStack → pairLean`.
4. **Duvet head line.** `zStart = zoneEnd + foldRoll + 0.01` (no fold: `zoneEnd + 0.01`), and also `zStart ≥ zM0 + max(wingDepth, postSize) + 0.03`, so the drape never meets wings or head posts.
5. **Drape floor** (the hem never goes below it): platform: `deckY` (the slab top is outside the mattress); slatted / fourPoster: rail top `deckY + railRise`; upholstered: rail top; with `duvetFit = tuck` the hem stays on the mattress side, so `drapeFloor` is unused. Also `drapeFloor ≥ 0.05`.
6. **Foot fit.** `drape` is allowed only when no part rises above `drapeFloor` within 0.10 m of the mattress foot (platform, upholstered foot rail, slatted `none` where the foot posts end at the rail top). Foot posts (fourPoster, bunk) or a footboard force `tuck`. With side drape and foot tuck, the side drape tapers from `sideDrop` to tuck over the last 0.25 m (one extra row), so it clears foot posts.
7. **Throw.** Runner: a `drapeSheet` over the duvet from `zM1 − throwDepth` to the foot, following the duvet's crown, with lift = `duvetThickness + 0.002` and hang = `sideDrop + throwExtraDrop` (same clamp). Folded: a `pillow` (pinch 0.15, `flatBottom`) of `throwWidth × throwFoldDepth × throwFoldThickness`, yawed, on the foot quarter at `x = ±W/4`, resting on the duvet top (max of the crown over its footprint). Bunk: lower bunk only.

## Re-roll groups

Modern streams (`${itemSeed}/${group}/${n}`). `style` is rerollable through `rollStyle` (R1).

| Order | Group | Owns | Reads | Visibly changes |
|---|---|---|---|---|
| 1 | `style` | style | none | Everything except colours and patterns |
| 2 | `size` | mattressWidth, mattressLength, mattressThickness, mattressTop, deckY, clearance, mattressRadius | style | Bed width (90 → 180), height, mattress thickness |
| 3 | `frame` | headKind, headHeight, headThickness, headOverhang, headSlatCount, headSlatWidth, archRise, channelCount, channelBulge, wingDepth, wingThickness, shelfWidth, shelfDepth, shelfThickness, shelfLift, footKind, footHeight, footSlatCount, railHeight, railThickness, railRise, postProfile, postSize, postHeight, canopy, canopyRailHeight, finial, support, legCount, legHeight, legThickness, legSides, legTaper, legSplay, legInset, plinthHeight, plinthInset, slabThickness, ledge, bunkClearance, guardAbove, guardBars, postCap, upperRailBottom, upperDeckY, upperMattressTop, guardTop, ladderKind, ladderSide, ladderLean, ladderWidth, rungProfile, rungCount, endFill, frameWidth, frameLength, overallHeight | style, size | Headboard shape and height, footboard, posts, canopy, legs vs plinth, ladder |
| 4 | `bedding` | pillowArrangement, pillowCount, euroCount, pillowWidth, pillowLength, pillowThickness, pillowPinch, pillowLean, euroSize, euroThickness, euroLean, euroRole, decoKind, decoWidth, decoHeight, decoThickness, decoLean, duvetKind, duvetThickness, duvetCrown, duvetFit, footFit, drapeFloor, sideDrop, footDrop, hemFlare, cornerSag, foldDepth, foldRoll, foldMaterial, wrinkle, wrinkleSeed, throwKind, throwDepth, throwThickness, throwExtraDrop, throwWidth, throwFoldDepth, throwFoldThickness, throwYaw, throwSide, mattressSegments, duvetRes | style, size, frame | Pillow stack, duvet loft and drape, fold, throw |
| 5 | `palette` | duvetMood, beddingTone, beddingColor, duvetColor, duvetSecondary, accent, accentSecondary, upholsteryColor | style | Bedding, duvet, accent and upholstery colours |
| 6 | `pattern` | beddingTexture, duvetPattern, accentPattern, accentTexture, upholsteryTexture, fabricThread | style | Prints and fabric textures |
| 7 | `finish` | frameMode, frameColor, woodName, paintName, grain | style, frame | Wood / paint / metal frame. `appliesTo: (p) => p.style !== 'upholstered'` (R2; neutral values `'none'`, `null`, `null`, `null`, `'none'`) |

Group ids `size`, `frame` and `bedding` are type-specific. Labels: Style, Size, Frame, Bedding, Colours, Pattern, Finish.

Later-group fields that may change when an earlier group is re-rolled (isolation allow-list):
- **Re-roll `size`:** frame: `headSlatCount`, `channelCount`, `shelfWidth` (and the wide → low fallback in `headKind`), `headOverhang`, `ledge`, `railRise`, `slabThickness`, `headHeight` (≥ mattressTop + 0.18 clamp), `legCount`, `plinthHeight`, `bunkClearance` and the derived bunk stack, `rungCount`, `frameWidth`, `frameLength`, `overallHeight`. Bedding: `pillowArrangement` (width class and fallbacks), `pillowCount`, `euroCount`, `pillowWidth`, `euroSize`, `drapeFloor`, `sideDrop`, `footDrop`, `cornerSag`, `throwExtraDrop`.
- **Re-roll `frame`:** bedding: `pillowArrangement` (headroom fallback), `pillowCount`, `euroCount`, `drapeFloor`, `sideDrop`, `footFit`, `footDrop`, `cornerSag`, `throwExtraDrop`. Finish: `frameMode`, `frameColor`, `woodName`, `paintName` (thin posts change the weights).
- **Re-roll `palette`:** none outside palette.
- **Re-roll `bedding`, `pattern`, `finish`:** no later dependants. `accentPattern` reads `duvetPattern` inside the same group.

Change rates: every group owns at least one continuous field (`mattressTop`, `headHeight` / rail and post sizes, `sideDrop` / `wrinkle`, colour draws, `fabricThread`), so each re-roll changes a field ≥ 90 % of the time. `finish` jitters black / white / metal lightness ±0.03 (as the sofa), so repeated modes still change `frameColor`.

## Kit reuse map

| Part | Helper | Notes |
|---|---|---|
| Mattress | `puffy(W, mattressThickness, L, mattressRadius, bedding, mattressSegments)` | Bottom at `deckY`. No piping (see the soft goods spec). |
| Sleeping pillows, euros, deco, folded throw | new `pillow` (core, below) | Bedding material; euros bedding or accent (`euroRole`); deco and throw accent. |
| Duvet + fold, runner throw | new `drapeSheet` (core, below) | Main skin: duvet material. Fold skin: duvet or bedding (`foldMaterial = 'sheet'` reads as a white top sheet folded over the duvet). Runner: accent. |
| Platform slab | `puffy` 3 segments | `grainAlong(slab, 'z')` (near-square slab, explicit axis). |
| Platform plinth / upholstered toe kick | `puffy` 2 segments | Inset by `plinthInset`; frame material (upholstered: upholstery fabric). |
| Platform legs | `buildLegs` with `fp.anchors = rowAnchors(frameLength, slabWidth, 3, legInset, legInset)` with x/z swapped (`[a, b] → [b, a]`) for 6 legs, or `legAnchors` for 4 | `legCount` = anchor count (R6). Swapping axes puts the middle legs on the long sides. |
| Platform low / wide headboard | `puffy` 3 segments | `grainAlong(board, 'x')`. |
| Platform headboard shelves | `puffy` 2 segments | Back face touches the headboard front. |
| Slatted posts | `beam` (square) or `strut` (round, `legTaper`) | Head posts floor → headHeight; foot posts floor → footHeight (or rail top when `footKind = none`). |
| Side rails, foot rail (slatted, fourPoster, bunk) | `beam` | Ends inside the posts. |
| Slatted headboard / footboard / bunk end fills | core `buildFramedPanel({ width, postWidth, postDepth, postBottom: 0, postTop, rails, fill: { kind: 'slats' \| 'bars' \| 'none', count, from, to, thickness, width: headSlatWidth } }, { frame, fill: frame })` (wave-2 kit B3, promoted from the bench) | Posts run to the floor independently of the rails. `board` and `panel` fills use `puffy` 2 between the posts. |
| Upholstered rails | `puffy` 2 segments | Plinth top → `deckY + railRise`. |
| Upholstered panel headboard | `puffy` 3 segments | Floor (or plinth) → headHeight. |
| Upholstered / fourPoster arch headboard | `extrudeProfile(archTopShape, thickness, bevel, 'front')` | `archTopShape` is bed-local (below). |
| Upholstered channel headboard | `extrudeUp(scallopShape(width, thickness, channelCount, channelBulge), height, bevel)` | One mesh; `scallopShape` is bed-local. |
| Wingback wings | `puffy` 2 segments | Outside the mattress line, depth `wingDepth` forward of the headboard. |
| FourPoster turned posts | core `turnedPost({ height: postHeight, thickness: postSize, blocks: [[railBottom, railTop], [postHeight − 0.12, postHeight]], profiles: ['simple', 'full'], finial })` (B1, promoted from the table) | Blocks at rail height and at the top (canopy rails and the headboard panel meet flat faces); the short lower segment uses the 5-point profile to save triangles. Fallback if B1 slips: `postProfile` turned → square. |
| FourPoster square / tapered / thin posts | `beam` / `strut` (thin: 6 sides) | Thin posts with `finial` → small `latheSolid` ball. |
| Canopy rails | `beam` | Top flush with `postHeight`; ends at post centres. |
| FourPoster panel headboard, foot panel | `puffy` 3 (head) / `puffy` 2 (foot) | Between the posts, overlapping them by 5 mm. |
| Bunk posts, rails, guard bars, guard post | `beam` | Guard post at the start of the access opening. |
| Bunk deck boards | `beam` (width W, thickness 0.02) | Visible from below the upper bunk. |
| Bunk ladder | `beam` stiles + `strut` (round) or `beam` (flat) rungs | Bed-local `buildLadder` (below). |
| Materials | `kit.materials.wood` / `solid` / `pattern` / `frame` | Roles below. |
| Merge / dispose | `mergeByMaterial`, `disposeObject` | Done by the app. |

**Material roles (R5), max 4 draw calls:**

| Role | Parts | Material |
|---|---|---|
| frame | posts, rails, slab, plinth, headboard/footboard, legs, ladder, canopy; upholstered: everything structural (fabric) | `wood(frameColor, { grain, seed })`, `frame(frameColor, mode)`, or for upholstered a linen/bouclé/flat `pattern` / `solid` in `upholsteryColor` (like the sofa's `plain()`) |
| bedding | mattress, sleeping pillows, euros when `euroRole = 'bedding'`, fold skin when `foldMaterial = 'sheet'` | linen (`beddingTexture`) or solid in `beddingColor` |
| duvet | duvet main skin (+ fold skin when `foldMaterial = 'duvet'`) | `pattern(duvetPattern, [duvetColor, duvetSecondary])` or linen/solid |
| accent | throw, deco pillow, euros when `euroRole = 'accent'` | `pattern(accentPattern, [accent, accentSecondary])` or `accentTexture` linen/bouclé/solid; omitted when no part uses it (3 draws) |

Patterns need no UVs (item-space projection); the new soft helpers emit none, and `mergeByMaterial` zero-fills `uv`.

**Triangle estimates** (from the catalogue: `puffy` 3 = 588, 2 = 300, `beam` 44; new helpers below):

| Part | Tris |
|---|---|
| `pillow`, grid 6 | 192 (grid 4: 96) |
| `drapeSheet` duvet with fold, `full` | ≈ 650 (cap 900) |
| `drapeSheet` duvet with fold, `low` | ≈ 420 |
| `drapeSheet` runner throw | ≈ 260 |
| turned post (`turnedPost`, 8 sides: simple lower + full upper segment, 2 blocks, finial) | ≈ 390 |
| arch `extrudeProfile` / channel `extrudeUp` | ≈ 200 / ≈ 350 |

Shared soft goods worst case (non-bunk): mattress 588 + 2 euros 384 + 2 sleeping 384 + deco 192 + duvet 900 + folded throw 300 = **2.75k**.

| Worst case | Frame | Total |
|---|---|---|
| Upholstered wingback | rails 900 + plinth 300 + panel 588 + wings 600 = 2.39k | **5.14k** |
| FourPoster turned + canopy + foot panel | posts 1560 + canopy 176 + rails 132 + head 588 + foot 300 = 2.76k | **5.51k** |
| Platform wide + 2 shelves | slab 588 + plinth 300 + head 588 + shelves 600 = 2.08k | **4.83k** |
| Slatted vertical + low slatted foot | posts 176 + rails 132 + head 704 + foot 616 = 1.63k | **4.38k** |
| Bunk panel ends, side ladder, 6 rungs | posts 176 + rails 176 + ends 1200 + guards 220 + ladder 352 + decks 88 = 2.21k; soft: 2 mattresses (2 seg) 600 + 2 duvets (`low`) 840 + 2 pillows 384 + throw 300 = 2.12k | **4.33k** |

All under 6k. No budget fallback is needed except the bunk's `mattressSegments = 2` / `duvetRes = 'low'` (kept so a later bump to `full` duvets stays < 6k).

## New helpers requested

### Soft goods (architect-led, `src/core/soft.js`, backlog M4) → **approved as specified (wave-2 kit A5 `pillow`, A6 `drapeSheet`)**

These are core from day one: the backlog scopes soft goods as a kit addition, the sofa's deferred pillow issues ("chunky", "edge-on") make the sofa a second user for `pillow`, and `drapeSheet` can serve tablecloths, rug edges and bench throws later.

#### S1. Mattress: no new helper

`puffy(W, h, L, r, mat, segments)` is the mattress. Spec for the generator:
- `r = mattressRadius` 0.025–0.05 (so 2–3 facets show on the visible long edges).
- Segments 3, bunk 2 (item-wide, R3).
- **Piping: rejected.** The duvet covers the top edges on three sides and the pillows the fourth, so a piping tube (4 × ~50 tris, or a 4th-role colour) would be seen only in thin slivers. A linen texture already reads as fabric. Revisit if the visual review asks for "more mattress".
- The `drapeSheet` base surface uses the same `r` so the duvet hugs the mattress edge exactly.

#### S2. `pillow(w, h, t, mat, { pinch = 0.5, waist = 0.03, grid = 6, flatBottom = false }) → Mesh`

A lens-shaped pillow: belly in the middle, thin seam at the edges, corners poking out. It replaces the sofa's `puffy(size, size, t, size·0.25, mat, 2)` (300 tris, reads as a box cushion) with a cheaper, more pillow-like shape.

- **Frame:** face in the x–y plane (`w` along x, `h` along y), thickness along z, centred on the origin. The bbox is exactly `w × h × t` (callers rotate a lying pillow by −90° about x).
- **Outline:** grid parameters `u, v ∈ [−1, 1]` (`grid × grid` quads). The outline is the rectangle with each edge pulled inward at its midpoint by `waist·min(w, h)·(1 − s²)` (s = position along the edge), so the corners stay at (±w/2, ±h/2) and poke out like real pillow ears. Interior vertices are interpolated from the boundary (a bilinear Coons patch is fine).
- **Thickness:** seam half-thickness `ts = (t/2)·(1 − pinch)`; belly `b(u, v) = (1 − u²)(1 − v²)`. Top skin `z = ts + (t/2 − ts)·b`, bottom skin `z = −(ts + (t/2 − ts)·b)`. A seam band of `4·grid` quads joins the two boundary rings (height `2·ts`).
- **`flatBottom`:** the bottom skin is the plane `z = −ts`, the top skin is `z = ts + (t − 2ts)·b`; then the mesh is shifted so its z range is `[−t/2, t/2]`. Used for lying pillows and the folded throw (pinch 0.15).
- **Clamp:** `pinch ∈ [0, 0.8]`, `waist ∈ [0, 0.06]`, `grid ∈ [4, 8]`.
- **Cost:** `4·grid² + 8·grid` tris: 192 at grid 6, 96 at grid 4. Non-indexed, flat shaded, no UVs. Every rounded profile has ≥ 2 facets (R3: `grid ≥ 4`).
- **Unit tests:** bbox exact, closed (no boundary edges), tri count, determinism, `flatBottom` min z face is planar.

#### S3. `drapeSheet(opts) → { main: BufferGeometry, fold: BufferGeometry | null }`

A low-poly cloth sheet that lies on a rounded slab (the mattress), drapes over its sides and foot, optionally rolls into a folded-back top edge at the head, and has visible thickness at every free edge. Used for the duvet (with fold), the runner throw (region only, no fold) and the bunk's tucked duvets.

**Options** (all meters, item space; the generator derives them from params):

| Option | Meaning |
|---|---|
| `top`, `width`, `x0 = 0` | Mattress top y, width W, centre x. |
| `zStart`, `zEnd` | Head line of the sheet (fold crease), mattress foot face. |
| `radius` | Base shoulder radius = the mattress `puffy` radius. |
| `thickness` | Sheet thickness `t`. |
| `side`, `foot` | `{ mode: 'drape' \| 'tuck', drop }`; `drop` = vertical hang below `top`. |
| `footTaper` | 0.25: when side = drape and foot = tuck, the side hang ramps to tuck over this length before `zEnd`. |
| `flare` | Outward kick of the hem (0–0.025), quadratic along the straight drape. |
| `cornerSag` | Extra drop at a drape × drape corner (0–0.06). |
| `crown` | Puff of the top region: offset `crown·(1 − (u/uTop)²)·ramp(v)`, `ramp` 0 → 1 over the first and last 0.15 m of the top region. |
| `crownRegion` | `{ zFrom, zTo }` over which `crown` is defined (a throw passes the duvet's region so it follows the duvet's puff). |
| `lift` | Constant offset added to every skin (throw over duvet: duvet `t + 0.002`). |
| `fold` | `null` or `{ depth, roll, hemLift = 0.015 }`; `roll = R ≥ t`. |
| `wrinkle`, `seed` | Amplitude (0–0.008) and integer seed of a pure per-vertex hash jitter along the offset normal (not applied to hem-band inner rings). |
| `res` | `'full'` (across 16, along 9 + fold 5) or `'low'` (12, 7 + 4). |

**Construction.**

1. **Base surface S(u, v)** hugging the mattress. Unfolded coordinates: `u` across, `v` along z from `zStart`. For an overhang `d = |u| − (W/2 − r)` (or `v − (zEnd − r)` at the foot), `wrap(d)` gives `(out, down, n)`:
   - shoulder, `d ≤ πr/2`: `θ = d / r`, `out = r·sin θ`, `down = r·(1 − cos θ)`, normal `n = (sin θ, cos θ)`;
   - straight drape, beyond: `s = d − πr/2`, `out = r + flare·(s / sMax)²`, `down = r + s`, `n = (1, 0)`, with `sMax = drop − r`.

   `x = sign(u)·(W/2 − r + out)`, `y = top − down`, z likewise at the foot. **Tuck** mode moves the wrap start inward by `t` and stops at `θ = π/2` (`sMax = 0`), so the outer skin ends flush with the mattress side or foot face and can never touch a footboard, foot post or guard rail.
2. **Corners** (drape × drape): x from the side wrap, z from the foot wrap, `y = top − max(down_u, down_v) − cornerSag·min(s_u, s_v) / max(sMax, ε)`, normal = normalized sum of the two. The corner quad grid collapses into a hanging pleat. Degenerate triangles are allowed (zero area, invisible with flat shading). `computeVertexNormals` must not produce NaN (three normalizes zero vectors to zero).
3. **Skins as offsets along n.**
   - Under skin of main: offset `0.001` (not built except at hem bands).
   - Main skin A: offset `t + crown + lift`, from `zStart` to the end.
   - Fold (when `fold`): skin B is the outside of a half-roll about the crease. For `φ ∈ [0, π]` (3 rows in `full`): `P = S(u, zStart) + n·(R − R cos φ) − ẑ·R sin φ` (in the side regions the roll happens in the local (n, −ẑ) frame, so it wraps around the drape as a rolled hem). Then the fold layer: `P = S(u, zStart + s) + n·2R` for `s ∈ [0, depth]` (2 rows), with its side hang shortened by `hemLift`.
4. **Hem bands** close every free boundary of an outer skin: each boundary vertex is copied `t` inward along its offset direction (curl vertices toward the curl centre), clamped at offset 0.001, and the two rings are joined with quads. The fold edge band goes from offset `2R` down to the main skin (offset `t`), so there is no visible slit under the fold even when `R > t`. The main skin's head edge (inside the roll) also gets its band.
5. **Output:** `main` = skin A + its bands; `fold` = skin B (roll + layer) + its bands, or null. Both non-indexed, item space, with normals and no UVs. The caller makes two meshes and assigns materials (`foldMaterial`).

**Guarantees** (unit-tested):
- No vertex below `top − max(drop) − cornerSag − 0.001`, so the caller's `drapeFloor` clamp is sufficient.
- Tuck mode: max |x| ≤ W/2 and max z ≤ zEnd (+0.001).
- Drape mode: max |x| ≤ W/2 + (max offset) + flare, which the generator includes in `frameWidth`.
- The fold layer never intersects skin A: offsets `2R ≥ 2t > t`.
- Determinism (same opts → same geometry), finite positions.
- Tri counts: `full` ≈ 650, `low` ≈ 420, runner ≈ 260, hard cap 900 (asserted).

**Look checklist for the architect's pattern board:** the fold reads at 3 rows (60° facets); a 2–3 cm `flare` reads as soft cloth at grid distance; ticking stripes stay continuous across the top → shoulder → side because projection switches only at ~50° (patterns.js).

### Generator-local and promotions

| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| Promote bench `buildFramedBack` → core `buildFramedPanel` (R7: bed is the second user) → **approved, B3** with a rails list and a fill object: `buildFramedPanel({ width, postWidth, postDepth, postBottom = 0, postTop, rails: [{ y, height, thickness }], fill: { kind, count, from, to, thickness, width }, puff }, { frame, fill }) → Group` | Slatted headboard/footboard and bunk end fills need posts that run to the floor (legs) independently of the rail heights, and a `'none'` fill (rails only). The bench version fixes the posts to the panel height and the bottom rail at 3 cm. | bench (back), bed, cabinet open backs, shelf ends |
| Promote table `turnedLeg` → core `turnedPost` (R7: second user) → **approved, B1** (+ per-segment `profiles`) | `turnedPost({ height, thickness, blocks: [[y0, y1], …], finial = 0, sides = 8, profiles = [] }, mat) → Group` | Four-poster posts need a square block at rail height (beams meet a flat face) and a finial; the table only has a top block. Fallback without it: `postProfile` turned → square. | table, bed, stool/chair turned legs |
| `archTopShape` (bed-local) | `archTopShape(width, height, rise, steps = 6) → Shape` | Front outline (x, y) from y = 0 with a half-ellipse top of `rise`, fed to `extrudeProfile(…, 'front')`. `endPanelShape` only cuts the bottom. | wardrobe/cabinet crowns, mirror frames |
| `scallopShape` (bed-local) | `scallopShape(width, depth, count, bulge, steps = 3) → Shape` | Plan outline (x, −z) of `count` rounded channels for `extrudeUp`: one mesh instead of `count` puffies. | sofa channel backs, upholstered benches |
| `buildLadder` (bed-local) | `buildLadder({ bottom, top, width, stileWidth, stileDepth, rungPitch, rungProfile, lean }, mat) → Group` | Two `beam` stiles from y = 0 up to `top` (above the guard for handholds) and rungs from 0.22 m at `rungPitch`; `lean` offsets the feet outward; rungs end inside the stiles. | loft beds, library ladder for shelves |

## Failure modes and guards

| Failure | Guard | Test |
|---|---|---|
| Item outside the cell | `frameWidth ≤ 2.35`, `frameLength ≤ 2.38` clamps (headOverhang, shelfWidth, ledge); bunk ladder included in `frameWidth` | fits cell (limit 2.50) |
| Off-centre bbox (headboard at the back, side ladder) | Analytic layout centres z; side ladder shifts the item by `−ladderOut/2` | type check `centred` (x and z, 5 mm) |
| Floating mattress | Mattress bottom = `deckY` = slab top / deck boards / hidden rail cleat height; rails rise above the deck by `railRise`, so the mattress bbox overlaps the rails | connected |
| Mattress hidden by the frame | `railRise ≤ mattressThickness − 0.06` | param contract |
| Duvet through the frame (rails, slab, posts) | `sideDrop ≤ mattressTop − drapeFloor − 0.01`; foot posts or footboard force `footFit = tuck`; `footTaper` near foot posts; duvet `zStart ≥` head posts / wings + 0.03 | type check `duvetClear` (duvet min y ≥ drapeFloor; tuck: duvet bbox inside the mattress footprint + 1 mm) |
| Duvet below the floor or dragging | `drapeFloor ≥ 0.05`; `cornerSag` clamped by the same floor | grounded + `duvetClear` |
| Bunk duvet through guard rails / posts | Bunk `duvetFit = tuck` (both levels) | `duvetClear` |
| Fold layer intersects the main sheet / see-through slit | `R ≥ t`, offsets 2R vs t, fold edge band down to the main skin | `drapeSheet` unit test |
| Pillows through the headboard | "Rotate, measure, butt" placement against the headboard plane; two-plane formula for stacked rows | type check `pillowsOnMattress` (pillow min y within 2 mm of mattressTop, \|x\| ≤ W/2, rear z ≥ headboard front − 1 mm) |
| Pillows taller than the headboard (sofa deferred issue) | Leaning requires `headRise ≥ h·cos(lean) + 0.04`; else fall back to flat | same check: pillow top ≤ headHeight − 0.02 when leaning |
| Pillows sinking into the mattress / edge-on (sofa deferred issues) | Measured placement (bbox min y = mattressTop); lean ≤ 30° for sleeping, ≤ 40° for deco, flat pillows face down | `pillowsOnMattress` |
| Pillows wider than the mattress | `pillowWidth`, `euroSize` clamps by count | param contract |
| Pillow zone eats the bed | `zoneEnd ≤ zM0 + 0.85` with the fallback order (drop deco → lean → pairLean) | param contract: duvet covers ≥ 0.9 m |
| Wingback wings hit the duvet drape | `zStart ≥ zM0 + wingDepth + 0.03` | `duvetClear` |
| Folded throw floats or sinks | Rests on the max of the duvet crown over its footprint (≤ 1–2 cm floating), yaw ≤ 15°, centre at \|x\| = W/4 | connected |
| Runner throw intersects the duvet | Same base and crown function (`crownRegion`), `lift = t + 0.002` | `drapeSheet` unit test |
| Platform legs/plinth peek out | Plinth inset ≥ 0.06, legs inset ≥ 0.08 from the slab edge | visual |
| Platform reads as a rug or box (no headboard, white bedding) | `headKind = none` only 20 %; slab ≥ 0.06 thick; ledge ≥ 0.03; pillows always present; duvet/bedding contrast guard | visual |
| Slatted and upholstered look alike | Non-overlapping head heights (≤ 1.05 vs ≥ 1.10); grille vs solid panel | style distribution + visual |
| Upholstered base looks like a box with no feet | Toe kick inset 0.02–0.05 makes a dark shadow line | visual |
| Four-poster too tall for `maxSize` | `postHeight + finial ≤ 2.20` | sane size |
| Canopy rails float | Rail ends at post centres, rail top = post top | connected |
| Posts or rails miss each other | Rails end inside the posts (`beam` ends at post centre ± postSize/2 − 2 mm); turned posts have a flat block at rail height | connected + visual |
| Bunk tips or ladder floats | Four full-height posts at the corners; ladder stiles start at y = 0 and touch the upper side rail / end posts; lean ≤ 0.20 so the ladder foot stays in the floor hull | stable, grounded, connected |
| Bunk too tall or upper bunk unguarded | `bunkClearance` clamp → `postHeight ≤ 1.80`; `guardAbove ≥ 0.16`; access opening = ladderWidth + 0.04 ≤ 0.44 | type check `bunkGuard` (guard top − upper mattress top ≥ 0.16) |
| Lower bunk cramped | `bunkClearance ≥ 0.78` | param contract |
| Over budget | Worst case 5.51k (turned four-poster); bunk mattress 2 segments, `duvetRes = 'low'`; `drapeSheet` asserts ≤ 900 | budget test (500 seeds, ≤ 6k tris, ≤ 4 draw calls) |
| More than 4 draws | Roles fixed (frame, bedding, duvet, accent); fold and euros reuse existing roles | budget test |
| Calm-colour failures | Every hex from the pickers; `upholsteryColor`, `accentSecondary` drawn even when unused | colour-calm test |
| White duvet on white bedding, upholstery same as duvet | `\|Δl\| < 0.08` → `shade(…, −0.12)` guards in palette | visual |
| Loud print clash (bench/patterns deferred issues) | Accent patterned chance 0.2 when the duvet is patterned; `harmoniousSecondary` only | visual + calm test |
| Pinstripe or invisible wood grain on the wide platform slab (patterns deferred issues) | Explicit `grainAlong(slab, 'z')`; platform grain plain/bold only | visual |
| White frames vanish on the floor (stool deferred issue) | White frame weight ≤ 0.20 per style (Open question 8 asks whether to restrict it further) | visual |
| NaN geometry | `edgeRadius` everywhere; `drapeSheet` and `pillow` clamp their options; no `buildLegs` sled branch (legCount 4 or 6 only) | finite |
| Re-roll combos (new size with old frame) | All clamps are re-evaluated in later groups from current earlier values | sweep with random reroll maps |

Proposed `TYPE_RULES.bed`:
- `maxSize: { width: 2.35, height: 2.2, depth: 2.4 }`
- Checks (meshes named `mattress`, `pillow`, `duvet`, `headboard`, `guard`, `ladder`, like the sofa's named boxes): `centred`, `pillowsOnMattress`, `duvetClear`, `bunkGuard` (bunk only), `headAtBack` (mean z of `headboard` vertices < mattress centre z).

## describe() rows

| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `platform` · `four-poster (canopy)` · `bunk (ladder right)` |
| size | Mattress | `160 × 200 · 22 cm` |
| size | Height | `mattress top 52 cm` (bunk: `52 / 146 cm`) |
| frame | Size | `214 × 228 × 118 cm` (W × L × H) |
| frame | Headboard | `channel × 5 · 128 cm` / `vertical slats × 9 · 96 cm` / `wide · 2 shelves` / `none` |
| frame | Foot | `low slats · 62 cm` / `rail` / `panel · 70 cm` / `ledge 8 cm` |
| frame | Posts | `turned · 205 cm · canopy` / `thin · 190 cm · finials` (four-poster, bunk) |
| frame | Base | `plinth` / `legs × 6 · 10 cm` / `posts` |
| frame | Ladder | `side · 5 rungs` / `end · 6 rungs` (bunk only) |
| bedding | Pillows | `2 + 2 euro + lumbar` / `1` |
| bedding | Duvet | `duvet · draped · fold 30 cm (sheet)` / `quilt · tucked` |
| bedding | Throw | `runner 45 cm` / `folded` / `none` |
| palette | Colours | `{ swatches: [beddingColor, duvetColor, accent if used, upholsteryColor if upholstered] }` |
| pattern | Duvet | `ticking` / `gingham overcheck` / `linen` |
| pattern | Bedding | `linen` / `plain` |
| pattern | Accent | `herringbone` / `bouclé` (only when the accent role is used) |
| pattern | Upholstery | `bouclé` (upholstered only) |
| finish | Frame | `oak wood · plain grain` / `sage paint` / `black` / `metal` (⟳ hidden for upholstered) |

`swatches` (top level): duvetColor, duvetSecondary (if patterned), beddingColor, accent (if used), upholsteryColor (upholstered) or frameColor.

## Grid cell

**spacing: 2.6 m, gridSize: 9.**

- **What drives it:** the upholstered bed at 180 × 200: z = 0.16 headboard + 2 × 0.02 clearance + 2.00 + 0.12 foot rail ≈ 2.32 m; the widest is a 180 upholstered bed with headboard overhang, clamped at 2.30 m. The clamps cap every style at 2.35 × 2.38. Fits-cell limit 2.6 − 0.1 = 2.50, so headroom is ≥ 0.12 m.
- **Square cells (R4):** beds are near-square in plan (2.0–2.35 × 2.1–2.38), so `cell.spacingZ` is not needed for beds. Bunks (≈ 1.1 × 2.2) leave space in x, which is acceptable.
- **Grid size:** 9 × 2.6 = 23.4 m floor (sofa 25.2 m, table 20.7 m). 81 items × ≈ 4.3k average tris ≈ 0.35M tris.
- **All view:** packing uses measured footprints (`packRows`, gap 0.3), so beds take ≈ 2.1–2.4 m slots and do not inflate other items. `mix.js` takes the mean of `spacing²` for camera framing; 2.6 m raises the mean only slightly. See Open question 9 for type weighting.
- **Seed form:** `${seed}-bed-${n}`. `plural: 'beds'`.

## Open questions

1. ~~**Draw-call budget for upholstered beds.**~~ With 4 roles (upholstery, bedding, duvet, accent), the upholstered base has no wood feet; it stands on a recessed fabric toe kick. Is that acceptable, or should beds get a 5th role (wood feet) as an exception to R5? Recommendation: keep 4.
   **Architect:** keep 4 (W4). No 5th role in wave 2.
2. **Orientation.** All beds put the head at −z and the foot toward the camera, including bunks (so their side ladder appears on a long side, ±x). Alternatively, bunks could turn 90° so their long side and ladder face +z, as in catalogue shots. Which do you prefer?
   **Architect (recommendation):** head at −z for every bed, bunks included. One orientation keeps the bedroom set
   simple (headboard to the wall) and a side ladder on ±x still reads at 3/4 view.
3. **Bunk variants.** Only twin-over-twin (90 over 90) in v1. Add twin-over-double (140 lower), a loft bed (upper only, desk space under) or a trundle later?
   **Architect (recommendation):** later. A loft bed would be a third `buildFramedPanel` user and a desk-under-bed
   ensemble candidate.
4. ~~**Canopy fabric.**~~ The four-poster canopy is an open rail frame. Fabric curtains or a valance would need a 5th role (or reuse the accent) and a hanging-cloth variant of `drapeSheet`. Defer?
   **Architect:** deferred.
5. ~~**Unmade / lived-in look.**~~ A duvet turned back diagonally, or a rumpled throw, would add charm but needs a non-axis-aligned fold in `drapeSheet`. Defer to after the first visual review?
   **Architect:** deferred until after the first visual review.
6. ~~**Mattress piping.**~~ Rejected here (mostly hidden, about 200 tris). Agree?
   **Architect:** agreed, rejected.
7. ~~**Sofa adopts `pillow`.**~~ Switching sofa throw pillows to the new lens `pillow` would fix the deferred "chunky / box-like pillow" notes and save about 100 tris per pillow, but it changes every sofa's look (the sofa has no golden). Do it in the same PR as the soft kit, or separately?
   **Architect:** separately, after the bed's first visual review, with a before/after sheet for the human (W7).
8. ~~**White frames.**~~ White platform plinths and white slatted legs may vanish on the light floor (stool deferred issue). Allow white only on four-poster and bunk, or keep it at ≤ 20 % everywhere and review?
   **Architect:** no white on the platform (its plinth and legs sit on the floor; weights moved to wood and paint).
   Slatted (0.15), four-poster (0.10) and bunk (0.20) keep white: their white mass is the tall head and posts, not
   the floor line. Review in the snapshot.
9. ~~**All view weighting.**~~ In the All mix every type has weight 1, so about 1 in 7 items would be a 2.3 m bed. Should big types (bed, sofa) get a lower mix weight, e.g. 0.6?
   **Architect:** `mixWeight` per definition (W8): bed 0.5, sofa 0.75, others 1.
10. **Metal / brass bed as its own style.** The four-poster's `thin` posts give an iron-bed look. A low metal bed with a spindle headboard and footboard (brass knobs via `capSaturation`) is a distinct, well-known silhouette. Add it as a 6th style in v1 or later?
    **Architect (recommendation):** later. `thin` four-poster posts cover the iron-bed look for now.
11. ~~**Mattress length.**~~ Fixed at 2.00 m (EU). Should 1.90 m (UK) or 2.03 m (US) lengths be rolled too? They are barely visible at grid distance.
    **Architect:** keep 2.00 m fixed.

## Architect review (wave 2, M4)

**Verdict: approved with edits.** An excellent spec: five silhouettes separated by height profile, analytic
centring, a bedding layout that fixes the sofa's deferred pillow issues by construction, and a soft-goods kit
(`pillow`, `drapeSheet`) specified to the level of its unit tests. It is approved as written; the edits are small and
applied above. Final names and order are in `specs/_kit-additions-wave2.md`.

Changes:
1. **Soft goods approved** as specified: `pillow` (A5) and `drapeSheet` (A6) in core `soft.js`. `drapeSheet` is the
   long pole of the kit PR and starts first. The sofa does not adopt `pillow` in wave 2 (W7).
2. **Promotions with final signatures:** `buildFramedPanel` (B3) takes a `rails` list and a `fill` object (the bench
   becomes a thin wrapper with identical output); `turnedPost` (B1) gains per-segment `profiles`. Four-poster posts
   use `profiles: ['simple', 'full']` with blocks at rail height and at the top.
3. **Budget re-check:** a turned four-poster post with two segments, two blocks and a finial is ≈ 390 tris, not 250.
   The turned + canopy + foot-panel worst case becomes 5.51k (was 4.95k), still under 6k; the bunk keeps its
   2-segment mattress and `low` duvets.
4. **Field rename:** palette `accentColor` → `accent`, so the param does not shadow the `accentColor` picker in code.
5. **White frames:** none on the platform (floor-level plinth and legs, the stool lesson); weights moved to wood and
   paint.
6. **Roles:** 4 (frame, bedding, duvet, accent), no exception (W4). **Grid:** square 2.6 m (W2). **All view:**
   `mixWeight` 0.5 (W8).

Notes for the generator-engineer:
- `drapeSheet` and `pillow` emit no UVs; `mergeByMaterial` zero-fills `uv` (fine for shader patterns).
- The `wrinkleSeed` jitter is computed in `drapeSheet` from the param seed; this is the same "detail from a param
  seed" rule the shelf filler uses (W5).
- 6-leg platforms: `rowAnchors` with swapped axes changes the perimeter order; that only matters for
  `buildStretchers`, which the bed does not use.
- Check the deferred sofa pillow issues (sinking, edge-on, taller than the back) against the `pillowsOnMattress`
  check in the first visual review; they are the reason the lean/headroom rules exist.
