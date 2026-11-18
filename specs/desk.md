# Desk spec

## Summary
A work surface at sitting (or standing) height with knee space underneath and, usually, somewhere to put things away. The desk is the wave-2 type that mixes the two kits: the **table kit** (tops, legs, aprons, trestles) holds it up, and the **cabinet kit** (`src/core/fronts.js`: `buildCarcass`, `solveFronts`, `buildFronts`; `src/core/handles.js`: the handle library) gives it drawers. Five styles read as different silhouettes at grid distance:
- **writing**: a slim, shallow table on four legs with a drawer row in the front apron and sometimes a low gallery at the back;
- **pedestal**: one or two solid drawer boxes standing on the floor (or one box hung under the top on legs);
- **trestle**: a long top on two end frames with a low footrest stretcher;
- **standing**: a T-leg steel frame with telescoping columns, half of them at standing height;
- **panel**: a Π of two thick end slabs under the top, often a "waterfall" in the top's own material.

Seeds differ along four axes the eye picks up quickly: **support language** (legs / boxes / frames / columns / slabs), **mass distribution** (symmetric, one-sided, floating), **height class** (0.74 vs 1.0–1.18 m) and **front pattern** (no drawers, a row of 1–3, stacks of 2–4, file drawers, a door). Finishes (wood, painted, black/white/metal frames, brass or black hardware) and an optional small still life on the top (closed laptop, book stack, pen cup) add the collection feel.

Every desk records its knee hole (`kneeCenterX`, `kneeWidth`) so the wave-4 office set can place a chair.

## Real-world references and dimensions
| Dimension | Range | Source |
|---|---|---|
| Sitting desk height | 0.71–0.76 m (28–30 in); plan target 0.72–0.76 | [Woodbin desk design guidelines](https://woodbin.com/ref/furniture-design/desks/), [OF2go straight desks guide](https://www.officefurniture2go.com/content/straight-desks.html), [Homedit standard desk dimensions](https://www.homedit.com/standard-desk-dimensions/), plan/01 |
| Desk width | 1.2 / 1.5 / 1.8 m common (48 / 60 / 72 in); pedestal desks 1.2–1.8 m | [Woodbin](https://woodbin.com/ref/furniture-design/desks/), [Autonomous desk size guide](https://www.autonomous.ai/ourblog/standard-desk-dimensions-guide) |
| Desk depth | 0.6–0.76 m (24–30 in); plan 0.6–0.8 | [Woodbin](https://woodbin.com/ref/furniture-design/desks/), [Upgraded Home desk dimensions](https://upgradedhome.com/desk-dimensions/), plan/01 |
| Writing table | h 0.71–0.76, w 0.91–1.02, d 0.51–0.61 m (36–40 × 20–24 in); table desk w up to 1.22 m | [Woodbin](https://woodbin.com/ref/furniture-design/desks/) |
| Knee space | height ≥ 0.51–0.66 m (20–26 in), ADA ≥ 0.69 m; width ≥ 0.51–0.61 m (20–24 in), ADA 0.76 m; depth ≥ 0.46 m at the knee | [Woodbin](https://woodbin.com/ref/furniture-design/desks/), [Houzz home office dimensions](https://www.houzz.com.sg/magazine/size-matters-dimensions-to-note-when-designing-your-home-office-stsetivw-vs~64974871) |
| Drawer over the knee space | ≤ 0.10 m deep (4 in); drawers beside the knee 0.10–0.25 m; file drawer ≥ 0.25 m | [Woodbin](https://woodbin.com/ref/furniture-design/desks/) |
| Pedestal width | ≥ 0.30 m (12 in) | [Woodbin](https://woodbin.com/ref/furniture-design/desks/) |
| Standing desk height | electric frames 0.62–1.27 m; Herman Miller Nevi 0.72–1.20 m (standard) | [FindOfficeFurniture sit-stand guide](https://www.findofficefurniture.com/guides/pdfs/FOF_Sit_Stand_Desks_Buyers_Guide.pdf), [Herman Miller Nevi specs](https://www.hermanmiller.com/en_mx/products/tables/sit-to-stand-tables/nevi-sit-to-stand-tables/specs/) |
| Standing frame parts | feet 0.58 × 0.07 m (Vivo V122EB); frame length 1.0–1.6 m; columns 40 × 80 to 53 × 93 mm | [Vivo V122EB](https://vivo-us.com/collections/b-001-new-products-b/products/desk-v122eb), [Hypertec frame sheet](https://www.hypertec.co.uk/documents/mmo_135203188_1770724084_711_135396.pdf) |
| Top thickness | 0.018–0.04 m (standing desk boards 0.025–0.03) | manufacturer listings above; matches `specs/table.md` |
| Trestle / panel proportions | Same as the table trestle: feet 0.78–0.92 × depth, frames 0.12–0.3 m in from the ends | `specs/table.md`, designer estimate |

## Styles

### writing (weight 0.24)
- Silhouette: a light, shallow (≤ 0.65 m) table on four slender legs with a deep front apron that holds a row of 1–3 small drawers; 45 % have a low back gallery (a rail or a small two-tier riser). Narrower than any other desk (0.9–1.3 m).
- Parts: rect top, 4 legs (tapered / straight / turned / splayed), side and back aprons, front apron rail behind a 1–3 drawer row (fronts solver, 1 row), handles, optional gallery, optional leather inlay, optional `ends` stretchers.

### pedestal (weight 0.28)
- Silhouette: boxes to the floor. Three layouts:
  - `double` (40 %): two drawer pedestals carry the top, a knee hole between them with a modesty panel at the back and often a shallow centre drawer;
  - `single` (35 %): one pedestal at one end, the other end on a panel or two legs;
  - `hung` (25 %): mid-century, four tapered legs with a short drawer box hanging under one side of the top.
- Parts: rect top, 1–2 carcasses (fronts.js) with drawer stacks, pedestal base (plinth / feet / flush / short legs), modesty panel, end panel or 2 end legs (single), 4 legs and aprons (hung), centre drawer (double), handles, optional inlay.

### trestle (weight 0.16)
- Silhouette: like the trestle table but desk-sized (≤ 0.75 m deep): a thick top overhanging two I/A/X end frames, a low footrest stretcher, and in 35 % a slim one-drawer box hung under the top.
- Parts: rect or soft-corner top, `buildTrestle` frames and stretcher, optional hung drawer box, handle, optional riser.

### standing (weight 0.18)
- Silhouette: a thin board on a steel T-frame: two flat feet running front to back, two telescoping rectangular columns (2 or 3 visible stages), side brackets and a crossbar under the top. 55 % are raised (1.00–1.18 m), which gives a tall, spindly silhouette no other type has; the rest sit at 0.72–0.76 with the columns collapsed.
- Parts: top (rect or soft corners), 2 feet, 2 columns of 2–3 stages, 2 side brackets, crossbar, optional control box, optional monitor riser. No drawers.

### panel (weight 0.14)
- Silhouette: a Π seen from the front. Two full-depth end slabs stand under the top's ends; in 50 % they are the same thickness and material as the top (a waterfall desk). Optional back rail (modesty beam) and a slim hung drawer box.
- Parts: rect top, 2 end slabs (`endPanelShape` + `extrudeProfile`, plain / notch / arch cut), optional back rail, optional hung drawer box, handle, optional riser.

Style weights sum to 1.00. The plan lists four styles. `panel` is added because it is nearly free (it reuses the single pedestal's end panel), and a waterfall Π is a strong silhouette (see open question 1). Pedestal is the heaviest because it carries the cabinet kit, which is what makes a desk read as a desk and not a table.

## Parameters
Units are meters. "U(a, b)" = uniform. "pick{…}" = weighted pick (`weightedPick`). Every field is always present. Fields a style does not use get a neutral value (`0`, `false`, `'none'`, `null`), as on the table. x = width (left −x / right +x), z = depth, front = +z (the sitter and every drawer face +z), back = −z.

**Draw rule (from the table):** each group draws all its random values in a fixed order, unconditionally, and only then derives and clamps. Re-rolling `top` therefore keeps the same leg profile, pedestal layout and drawer pattern, refitted to the new size.

### style
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| style | writing, pedestal, trestle, standing, panel | `rollStyle(g, styles)`: pick{0.24, 0.28, 0.16, 0.18, 0.14} at re-roll 0 (R1) | — | style |

### top (reads style)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| heightMode | `sit`, `stand` | standing pick{sit 0.45, stand 0.55}; others `sit` | style | top |
| topWidth (x) | writing 0.90–1.30; pedestal 1.10–1.80 (double ≥ 1.40, see base clamp); trestle 1.20–1.80; standing 1.00–1.60; panel 1.00–1.60 | U | style | top |
| topDepth (z) | writing 0.50–0.65; pedestal 0.65–0.80; trestle 0.62–0.75; standing 0.60–0.80; panel 0.55–0.75; clamp ≤ 0.6 × topWidth | U, then clamp | style, topWidth | top |
| topHeight | sit 0.72–0.76; stand 1.00–1.18 | U | heightMode | top |
| topThickness | writing 0.018–0.028; pedestal 0.025–0.04; trestle 0.035–0.05; standing 0.022–0.03; panel 0.03–0.05 | U | style | top |
| topEdge | 0.003–0.012, through `edgeRadius` | U | topThickness | top |
| topExponent | 10 (rect); standing and trestle 25 % U(5, 8) (soft corners) | chance, then U | style | top |
| topAddon | none, rail, riser | writing {.55, .25, .20}; pedestal {.75, .15, .10}; trestle {.80, 0, .20}; standing {.65, 0, .35}; panel {.75, 0, .25} | style | top |
| addonHeight | rail 0.04–0.08; riser 0.09–0.15 (monitor shelf underside) | U | topAddon | top |
| addonDepth | rail = 0.018–0.022 (board thickness); riser 0.20–0.26, clamp ≤ 0.4 × topDepth | U | topAddon, topDepth | top |
| inlay | writing 0.30, pedestal 0.25, else false | chance | style | top |
| inlayInset | 0.04–0.08 from the front and sides; the back edge stops in front of the addon | U | inlay, topAddon | top |
| clutter | 0.40 (props on the top) | chance | — | top |

### base (reads style, top)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| supportKind | legs, pedestals, trestle, tframe, panels | derived: writing → legs; pedestal double/single → pedestals, hung → legs; trestle → trestle; standing → tframe; panel → panels | style, pedestalLayout | base |
| pedestalLayout | none, double, single, hung, box | pedestal pick{double .40, single .35, hung .25}; trestle chance 0.35 → box; panel chance 0.30 → box; writing/standing none. `double` needs topWidth ≥ 2 × pedestalWidth + 0.62 + 2 × pedestalOverhang, else → `single` | style, topWidth | base |
| pedestalSide | none, left, right, both | double → both; single/hung/box pick{left .4, right .6}; else none | pedestalLayout | base |
| pedestalWidth | floor 0.36–0.46; hung 0.34–0.44; box 0.34–0.48; clamp so `kneeWidth ≥ 0.62` | U, then clamp | pedestalLayout, topWidth | base |
| pedestalHeight | floor: legHeight (derived); hung 0.28–0.40; box 0.10–0.14; hung bottom ≥ 0.30 above the floor | U / derived | pedestalLayout, legHeight | base |
| pedestalDepth | floor: topDepth − pedestalBack − 0.01..0.03 (front setback); hung/box: leg-to-leg or 0.85–0.92 × topDepth | derived | pedestalLayout, topDepth | base |
| pedestalOverhang | top end to pedestal outer face: 0–0.05 (40 % flush = 0) | chance, then U | pedestalLayout | base |
| pedestalBase | none, plinth, feet, flush, legs | floor pedestals pick{plinth .35, feet .20, flush .25, legs .20}; else none | pedestalLayout | base |
| pedestalBaseHeight | plinth 0.06–0.10 (toe recess 0.03–0.05); feet 0.04–0.08; legs 0.10–0.18; flush 0 | U | pedestalBase | base |
| carcassThickness | 0.016–0.022 (side/back/bottom panel) | U | — | base |
| endSupport | none, panel, legs | single pick{panel .55, legs .45}; else none | pedestalLayout | base |
| modestyPanel | false / true | double 0.75, single 0.55, panel 0.40 (back rail), trestle 0; else false | style, pedestalLayout | base |
| modestyHeight | 0.25–0.40 below the top's underside (panels: rail 0.08–0.14) | U | modestyPanel | base |
| legCount | 4 or 0 (R6) | 4 for supportKind legs; 0 otherwise (single `legs` end support is built separately) | supportKind | base |
| legProfile | straight, tapered, splayed, turned | writing {.25, .35, .20, .20}; hung {.15, .55, .30, 0}; single end legs {.40, .60, 0, 0}; else `straight` | style, pedestalLayout | base |
| legThickness | writing/hung 0.035–0.055; single end legs 0.04–0.06 | U | style | base |
| legSides | 4, 6, 8 | pick{.55, .2, .25}; turned → 8 | legProfile | base |
| legTaper | straight/turned 1; tapered 0.5–0.75; splayed 0.55–0.8 | U | legProfile | base |
| legSplay | splayed: U(0.02, 0.05), clamp ≤ 0.10 × legHeight and ≤ overhang + 0.7 × legThickness; else 0 | U, then clamp | legProfile, overhang, legHeight | base |
| overhang | footprint shrink: 0.02–0.08, clamp ≤ 0.15 × topDepth | U, then clamp | topDepth | base |
| legHeight | topHeight − topThickness | derived | top | base |
| apronHeight | writing 0.08–0.11 (holds the drawer row); hung 0.05–0.08; clamp so the apron bottom is ≥ 0.61 (sit) | U, then clamp | style, legHeight | base |
| apronThickness | 0.018–0.024 | U | — | base |
| stretcher | none, ends | writing pick{.75, .25}; else none (never `h`/`perimeter`: they cross the knee space) | style | base |
| stretcherHeight | 0.08–0.16 | U | stretcher | base |
| stretcherThickness | 0.45–0.6 × legThickness, min 0.015 | U | legThickness | base |
| trestleKind | I, A, X | pick{.45, .40, .15} | style | base |
| trestleInset, footLength, footHeight, beamWidth, postDepth, cleatHeight | as `specs/table.md`, with inset 0.12–0.30 (≤ 0.18 × topWidth) and footLength 0.80–0.92 × topDepth | U | topWidth, topDepth | base |
| trestleStretcherHeight | I/A 0.10–0.20 (footrest, below the knee box); X derived (crossing) | U / derived | trestleKind | base |
| trestleBackRail | trestle: chance 0.5 (a rail directly under the cleats' rear ends, core `buildTrestle({ backRail })`); else false | chance | style | base |
| frameInset | tframe: column centre from top end 0.10–0.22 | U | — | base |
| columnWidth (x) / columnDepth (z) | outer stage 0.06–0.08 / 0.045–0.06; each inner stage −0.006 per side | U / derived | — | base |
| columnStages | 2, 3 | pick{.6, .4} | — | base |
| columnZ | −0.06 to 0 (columns sit slightly to the back) | U | — | base |
| frameFootLength | max(0.85 × topDepth, 0.58), clamp ≤ topDepth − 0.02 | derived | topDepth | base |
| frameFootHeight / frameFootWidth | 0.03–0.05 / 0.06–0.08 | U | — | base |
| crossbarHeight | 0.03–0.05 (crossbar and side brackets) | U | — | base |
| controlBox | standing 0.70 | chance | style | base |
| panelThickness | waterfall: = topThickness; else 0.025–0.05 | derived / U | waterfall, topThickness | base |
| waterfall | panel 0.50 | chance | style | base |
| panelInset | waterfall 0; else 0.0–0.08 from the top end | U | waterfall | base |
| panelDepth | 0.92–1.0 × topDepth (waterfall 1.0) | U | waterfall, topDepth | base |
| panelCut | none, notch, arch (`endPanelShape` cut) | panel pick{.6, .2, .2}; single end panel pick{.7, .3, 0} | style | base |
| panelCutHeight | notch 0.04–0.08; arch 0.10–0.20 | U | panelCut | base |
| kneeWidth | free x span between the inner faces of the supports (or the hung box) | derived; guard ≥ 0.62 | all of the above | base |
| kneeCenterX | centre of that span (≠ 0 for single / hung / box) | derived | — | base |

### fronts (reads style, top, base; `appliesTo`: the desk has a drawer region, i.e. `style === 'writing' || pedestalLayout !== 'none'`)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| apronDrawers | 0–3 (writing only) | pick{0 .12, 1 .38, 2 .25, 3 .25}; 3 needs a drawer width ≥ 0.22, else 2; else 0 | style, topWidth | fronts |
| stackLayout | three, graduated4, boxFile, twoBoxFile, drawerDoor (floor pedestals) | pick{.30, .20, .18, .20, .12}; when pedestal front height < 0.50 → three; else `none` | pedestalLayout, pedestalHeight | fronts |
| mirrorStack | double only: second pedestal repeats the layout (0.7) or uses the other one of {three, twoBoxFile} | chance | pedestalLayout | fronts |
| hungDrawers | hung: 2 or 3 (pick{.6, .4}); box: 1; else 0 | pick | pedestalLayout | fronts |
| centreDrawer | double 0.55, single 0.25; height 0.06–0.09 (≤ 0.10 over the knee) | chance | pedestalLayout | fronts |
| centreDrawerHeight | 0.06–0.09; clamp so the drawer bottom ≥ 0.61 (sit) | U, then clamp | centreDrawer, legHeight | fronts |
| construction | overlay, inset (shared vocabulary, W9) | writing {.60, .40}; pedestal {.55, .45}; trestle/panel box {.75, .25} | style | fronts |
| drawerStyle | slab, framed (framed is applied only to drawers ≥ 0.15 m high, so apron and box drawers stay slab) | writing {.85, .15}; pedestal {.55, .45}; trestle/panel box slab | style | fronts |
| frontThickness | 0.016–0.022 | U | — | fronts |
| gap | overlay 0.003–0.006 between fronts; inset `reveal` = 0.002–0.003 from the same draw | U | construction | fronts |
| handleKind | knob, bar, tab, cup, ring, groove (core `HANDLE_KINDS`; `groove` = no hardware, finger channel over a backer) | writing {.40, .10, 0, .05, .20, .25}; pedestal {.20, .35, .10, .15, .05, .15}; trestle/panel {.35, .30, .15, 0, 0, .20} | style | fronts |
| handleSize | knob ⌀ 0.022–0.035; bar length 0.096–0.160 (32 mm steps, ≤ 0.45 × front width); tab/cup 0.05–0.09; ring ⌀ 0.03–0.045. Passed as `hw.size` to core `normalizeHandle`; one or two handles per front come from the shared `handleSlots` rules (C2) | U, then clamp | handleKind | fronts |
| drawerCount | total fronts that are drawers (for describe and tests) | derived | all of the above | fronts |

### palette (`appliesTo`: something painted, or an inlay: `topFinish === 'painted' || bodyMode === 'painted' || inlay`)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| paint | `paintColor(r)` hex | 3 draws | — | palette |
| inlayColor | core `pickLeather(r)` hex (tan, cognac, chocolate, oxblood, bottle green) | 3 draws, always drawn | — | palette |

`inlayColor` is not `accentColor(r, paint)`: the complement mode is the source of the teal-on-pink table issue in "Deferred minor issues", and a leather inlay wants a real leather tone. Book and cup colours moved to `props` (they belong to the still life, not the furniture's colourway).

### finish (reads style, base, palette)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| topFinish | wood, painted | writing {.80, .20}; pedestal {.80, .20}; trestle {.95, .05}; standing {.60, .40}; panel {.65, .35} | style | finish |
| wood | `pickWood(r)` → `woodName` (null if nothing is wood) | 3 draws, always drawn | — | finish |
| grain | fine, plain, bold | pick{.3, .45, .25}; `'none'` when nothing is wood | — | finish |
| bodyMode | wood, painted, black, white, metal, top | writing {wood .70, painted .20, black .10}; pedestal floor {wood .55, painted .30, white .10, black .05}; hung {wood .60, black .25, painted .15}; trestle {wood .75, black .15, painted .10}; standing {black .45, white .20, metal .35}; panel waterfall → `top`, else {wood .40, painted .30, black .20, white .10} | style, pedestalLayout, waterfall | finish |
| frontMode | body, top | pick{.65, .35}; forced `body` when bodyMode is `top` or equal to the top colour; `top` gives the classic wood-fronts-on-painted-carcass look | bodyMode | finish |
| hardwareMode | match, black, brass, metal | knob/tab/ring {match .30, black .25, brass .30, metal .15}; bar/cup {match .10, black .35, brass .25, metal .30}; `groove`/no fronts → `none` | handleKind | finish |
| topColor | hex: wood base, or `paint`; when the body is also painted, `harmoniousSecondary(swatch(paint), 'white')` | derived | topFinish, palette, bodyMode | finish |
| bodyColor | hex: wood (l − 0.04), `paint`, `FRAME_COLORS.black/white/metal`, or `topColor` (`top`) | derived | bodyMode | finish |
| hardwareColor | `FRAME_COLORS.black/metal`, brass = `capSaturation(0.11, 0.5, 0.5).hex`, `match` → front colour; `none` → null | derived | hardwareMode, frontMode | finish |

### props (reads top, finish; `appliesTo`: `clutter`)
| Name | Range / set | Distribution | Depends on | Group |
|---|---|---|---|---|
| propSet | laptop, books, cup, laptop+books, laptop+cup, books+cup, all | pick{.15, .15, .05, .20, .15, .15, .15}; `'none'` when clutter is false | clutter | props |
| laptopColor | `FRAME_COLORS.metal` / `.black` / `.white` | pick{.55, .30, .15} (vertex colour in the `decor` role) | — | props |
| bookColors | 2 hex, alternating in the stack | 2 × `paintColor(r)` (6 draws) | — | props |
| cupColor | hex | `paintColor(r)` restricted to cream, putty, charcoal, terracotta, sage, slate blue (3 draws) | — | props |
| laptopSize | w 0.30–0.36, d 0.21–0.24, h 0.015–0.02 | U | — | props |
| laptopX / laptopYaw | x U(−0.15, 0.15) × topWidth, z = front third; yaw ±12° | U | topWidth, topDepth | props |
| bookCount | 2–4 | int | — | props |
| bookSizes | each w 0.15–0.24, d 0.11–0.17, h 0.02–0.045; yaw ±10° per book, offset ±0.01 | U | — | props |
| cupRadius / cupHeight | 0.03–0.04 / 0.08–0.11 | U | — | props |
| propSide | books left / cup right, or mirrored | pick{.5, .5} | — | props |

Props sit in fixed zones (desk-local `propZones(p)` returning shared `Surface` records, W5) so they never overlap: laptop centre zone, books in one back corner, cup in the other. Every zone is clamped inside the top outline minus 0.03 m, and in front of `addonDepth` when there is a rail or riser. With a riser, the books may stand on the riser shelf instead (40 %, derived from `propSide`'s draw).

## Re-roll groups
| Order | Group | Owns (`fields`) | Reads | Visibly changes |
|---|---|---|---|---|
| 1 | style (rerollable via `rollStyle`) | style | — | everything except palette |
| 2 | top | heightMode, topWidth, topDepth, topHeight, topThickness, topEdge, topExponent, topAddon, addonHeight, addonDepth, inlay, inlayInset, clutter | style | size, height (sit/stand), gallery/riser, inlay, props on/off |
| 3 | base | supportKind, pedestalLayout, pedestalSide, pedestalWidth, pedestalHeight, pedestalDepth, pedestalOverhang, pedestalBase, pedestalBaseHeight, carcassThickness, endSupport, modestyPanel, modestyHeight, legCount, legProfile, legThickness, legSides, legTaper, legSplay, overhang, legHeight, apronHeight, apronThickness, stretcher, stretcherHeight, stretcherThickness, trestleKind, trestleInset, footLength, footHeight, beamWidth, postDepth, cleatHeight, trestleStretcherHeight, trestleBackRail, frameInset, columnWidth, columnDepth, columnStages, columnZ, frameFootLength, frameFootHeight, frameFootWidth, crossbarHeight, controlBox, waterfall, panelThickness, panelInset, panelDepth, panelCut, panelCutHeight, kneeWidth, kneeCenterX | style, top | supports, pedestal layout, modesty panel, knee hole, trestle back rail |
| 4 | fronts (`appliesTo`: has a drawer region) | apronDrawers, stackLayout, mirrorStack, hungDrawers, centreDrawer, centreDrawerHeight, construction, drawerStyle, frontThickness, gap, handleKind, handleSize, drawerCount | style, top, base | drawer pattern, front style, handles |
| 5 | palette (`appliesTo`: painted or inlay) | paint, inlayColor | — | paint and inlay colours |
| 6 | finish | topFinish, woodName, grain, bodyMode, frontMode, hardwareMode, topColor, bodyColor, hardwareColor | style, base, fronts, palette | materials, wood species, hardware colour |
| 7 | props (`appliesTo`: `clutter`) | propSet, laptopColor, bookColors, cupColor, laptopSize, laptopX, laptopYaw, bookCount, bookSizes, cupRadius, cupHeight, propSide | top | which props, where, sizes, prop colours |

Notes:
- `finish` reads `fronts` only for `hardwareMode` (its weights follow `handleKind`, and `groove` means no hardware). A fronts re-roll can therefore change the hardware colour. That is allowed, because finish is a reader of fronts.
- When fronts do not apply (standing, plain trestle/panel), their fields are neutral (`0`, `'none'`, `false`, `[]`), decided by `style` and `base`, as R2 requires.
- Props on/off (`clutter`) lives in `top`, not `props`. If `props` owned the toggle, an off → off re-roll would leave everything unchanged in about 36 % of seeds, below the 0.9 change rate. With the toggle in `top`, `props.appliesTo` is simply `clutter`, and every props re-roll moves the continuous laptop/book sizes.
- Palette `appliesTo` reads later-group fields (`topFinish`, `bodyMode`), as in the table (architect note 1 there). `paint` and `inlayColor` are always drawn, and `build` reads colours only through `topColor`/`bodyColor`/`hardwareColor`/`inlayColor`. So on an all-wood desk with no inlay, a palette re-roll changes only `paint`/`inlayColor`.
- Change rate: every rerollable group owns a continuous field (topWidth, pedestalWidth/legThickness/columnWidth, frontThickness/gap, paint, the wood jitter, laptopSize), so ≈ 100 %. No override is expected.

## Kit reuse map
| Part | Helper | Notes |
|---|---|---|
| Rect top | `puffy(W, T, D, topEdge, top)`, `grainAlong(top, 'x')` | Explicit axis: deep desks are near 2:1, but the inlay and riser must not flip grain. |
| Soft-corner top (standing, trestle) | `superellipseShape` + `extrudeUp` + `normalizeUVs(geo, W)` | As on the table. |
| Writing / hung legs | `legLines(p, fp)` + `buildLegs(p, mats, fp)` with `legCount` 4, `fp = { width: W − 2·overhang, depth: D − 2·overhang, top: legHeight }` | Same as the table's `legs` branch. |
| Turned legs | core `turnedPost({ height: legHeight, thickness: legThickness, blocks: [[legHeight − apronHeight, legHeight]] })` (B1), positioned at each leg line's top (x, z) | Promoted from the table. Fallback if B1 slips: turned → tapered. |
| Side and back aprons | `buildApron(lines, { edges: 'short' })` plus `buildApron([backLeft, backRight], …)` (two lines → one rail) | The front rail is a separate `buildApron([frontLeft, frontRight], { setback })` call. Its setback puts the drawer faces flush with the legs' front face: rail centre z = leg front face − frontThickness − apronThickness / 2. |
| `ends` stretchers (writing) | `buildStretchers(lines, 'ends', h, { profile })` | Never `h`/`perimeter`: they cross the knee space. |
| Apron drawer row (writing) | core `solveFronts({ leaf: 'drawers', count: 1, across: apronDrawers }, field, { construction, gap, minDrawerH: 0.05, maxDrawerH: 0.12, minDrawerW: 0.22 })` + `buildFronts(layout, { backers: false, members: false, … }, hw, mats)` | Field = between the front legs' inner faces, y from apron bottom to legHeight, z = the legs' front face. The front rail is the backer. |
| Floor pedestal carcass | core `buildCarcass({ width: pedestalWidth, depth: pedestalDepth, y0: pedestalBaseHeight, y1: legHeight, panel: carcassThickness, construction, frontThickness, x })` (C5) | No carcass top (never in `buildCarcass`): the desk top caps it. Bases are separate: plinth `puffy` 2, core `buildFeet` (B2) or `buildLegs`. Returns the face `field`. |
| Pedestal drawer stack | core `solveFronts(deskPlans(p)[side], carcass.field, { construction, gap, maxDrawerH: 0.46, maxFronts: 6 })` + `buildFronts` | Plan shapes per `stackLayout` in `specs/_kit-additions-wave2.md` ("Desk plan shapes"), derived in build by the desk-local `deskPlans(p)`. `drawerDoor` hinges the door on the pedestal's outer side, so its vertical handle sits at the opening edge toward the knee hole. |
| Pedestal feet | core `buildFeet(anchors, { kind: 'block', height: pedestalBaseHeight, radius: 0.025 }, mats.body)` (B2) | Promoted from the sofa. Fallback: feet → plinth. |
| Pedestal short legs | `buildLegs({ legCount: 4, legThickness, legSides: 4, legTaper: 0.6, legSplay: 0 }, mats, carcassFp)` | Explicit leg object (R6); the desk's own `legCount` stays 0. |
| Hung pedestal / box | core `buildCarcass({ …, y0: legHeight − pedestalHeight, y1: legHeight, x })` placed under the top at x = side, between the leg lines; plan `{ leaf: 'drawers', count: hungDrawers }`, `{ minDrawerH: 0.08, maxDrawerH: 0.20 }` | Its outer face is against the side apron's inner face; it hangs from the top and overlaps the apron by 2 mm. |
| Centre drawer (double/single) | core `solveFronts({ leaf: 'drawers', count: 1 }, field, { minDrawerH: 0.05, maxDrawerH: 0.10, maxDrawerW: 1.0 })` on the field between the pedestals under the top; its box is a `beam` | |
| Modesty panel | `beam` along x (width = carcassThickness in z, thickness = modestyHeight in y) at z = −D/2 + 0.02 | Between the pedestals' inner faces (or the supports' inner faces). |
| Single end support: panel | `endPanelShape(pedestalDepth, legHeight, { cut })` → `extrudeProfile(…, 'side')` | Same path as the panel style. |
| Single end support: legs | 2 `strut`s at the free end + a side rail `beam` + the back rail (or the modesty panel) | Desk-local: `legLines` needs ≥ 3 legs, and R6 forbids `legCount` 2 outside the sled branch. |
| Trestle frames | `buildTrestle({ …, stretcherHeight: trestleStretcherHeight, backRail: trestleBackRail })` | Low stretcher as a footrest at z = 0; the optional back rail (A7) sits under the cleats at the back, above the knee box. |
| Standing T-frame | desk-local `buildStandingFrame` from `beam`s: feet (along z), column stages (vertical, each stage overlapping the next by 0.03), side brackets (along z), crossbar (along x) | About 12 beams ≈ 530 tris. |
| Control box | `puffy(0.12, 0.025, 0.05, 0.006, body, 2)` under the top, front right | |
| Panel style slabs | `endPanelShape` + `extrudeProfile('side')`, `grainAlong(slab, 'y')` | Waterfall: grain y on the slabs and x on the top reads as a continuous board turning down. |
| Back rail (panel) | `beam` along x | |
| Gallery rail | `beam` along x on the top's back edge, plus 2 short side `beam`s (wings, 0.12–0.18 long) | Top material. |
| Riser | 2 `beam` posts + 1 `beam` shelf (wide board along x) | Top material. A monitor riser on standing desks. |
| Leather inlay | `beam` along x, thickness 0.002, 1 mm above the top surface, coloured with core `paintVertices(geo, inlayColor)` | `decor` role (vertex colours, W4). |
| Laptop | `slab` decor record → core `buildDecor` | Closed slab, yawed, `laptopColor`. `decor` role. |
| Book stack | `s` decor record → core `buildDecor` (`bookGeometry`, 28 tris per book, page edges in `pageColor`) | `decor` role; covers alternate between the two `bookColors`. |
| Pen cup | `cup` decor record → core `DECOR.cup` + `latheSolid` (8 sides) | `decor` role, `cupColor`. |
| Wood | `pickWood`, `kit.materials.wood(color, { grain, seed })` | Beams carry their own grain (pedestal sides vertical, drawer fronts horizontal). |
| Paint, leather, props | `paintColor`, `pickLeather`, `harmoniousSecondary`, `swatch` | |
| Frames, brass | `FRAME_COLORS`, `capSaturation(0.11, 0.5, 0.5)` | |

**Materials (R5): at most 4 roles, max 4 draw calls.**

| Role | Material | Carries |
|---|---|---|
| top | `wood` or `solid(paint)` | top, gallery, riser, fronts when `frontMode === 'top'`, waterfall slabs |
| body | `wood`, `solid(paint)` or `frame(color, mode)` | legs, aprons, carcasses, modesty panel, trestle, T-frame, control box, slabs, fronts when `frontMode === 'body'` |
| hardware | `frame(hardwareColor, metal ? 'metal' : …)` | handles (unless `match`) |
| decor | `kit.materials.vertexColor()` | inlay, laptop, books, pen cup (W4, W5) |

Fronts never add a role: they share the top or body instance. Handles with `hardwareMode: 'match'` use the fronts' instance. Every prop and the inlay share the one `decor` instance, so the laptop no longer creates a role and brass hardware no longer excludes it. Typical counts:
- writing: 3 (top, body, brass) + 1 with props or an inlay;
- standing: 2 (top, frame) + 1 with props;
- worst case: 4.

## New helpers requested
| Helper | Signature | Why | Reusable by |
|---|---|---|---|
| fronts.js (cabinet-led, backlog M4): **front-layout solver** → **merged into core `solveFronts` (C1)**; the desk's row layouts are plans (see the kit file) | `layoutFronts(rect: { x0, x1, y0, y1, z }, rows: [{ size: weight \| { m: meters }, cols = 1, kind: 'drawer' \| 'door' }], { reveal }) → [{ x0, x1, y0, y1, kind, row, col, handle: { x, y, orient: 'h' \| 'v' } }]` | Desk uses 4 layouts: 1 row × 1–3 cols (apron), 1 col × 2–4 rows with weights (pedestal stacks, file drawer, drawer + door), 1 × 1 (hung box, centre drawer). Needs: rows top → bottom, reveal between and around cells, row weights or meters (file drawer ≥ 0.25 m), handle anchor (drawer: centre, upper third for tall file drawers; door: vertical at the opening edge, with a flag for which edge), pure, no rng. | cabinet, desk, bed (under-bed drawers), wardrobe, bench storage |
| fronts.js: **fronts** → **merged into `frontPanel` (C4) + `buildFronts` (C6)** | `buildFronts(cells, { style: 'slab' \| 'inset' \| 'shaker', thickness, edge }, mat) → Group` | Drawer/door panels with the face on the rect's `z`. Budget ask: ≤ 60 tris for slab (a `beam` along x), ≤ 250 for shaker (frame of 4 beams + panel). Inset fronts sit back in the carcass opening by `thickness`. | cabinet, desk, bed, wardrobe |
| fronts.js: **handle library** → **merged into `handles.js` (C3) + `handleSlots` (C2)**; `ring` added, `edge` = `groove` | `buildHandles(cells, { kind: 'knob' \| 'bar' \| 'tab' \| 'cup' \| 'ring' \| 'edge', size, pairsAbove = 0.55 }, mat) → Group` | One call per front set. `edge` returns an empty group (the cut-out pull is implied by the reveal). Budget ask: ≤ 150 tris per handle (knob `latheSolid` 6–8 sides; bar 2 posts + bar `beam`; ring = knob + thin torus). Handles project ≤ 0.035 m from the front face (counted in the fits-cell and depth guards). | cabinet, desk, wardrobe, bed |
| fronts.js: **carcass** → **approved as `buildCarcass` (C5)**, never with a top, base separate | `buildCarcass({ width, height, depth, thickness, top = true, back = true, base: { kind: 'none' \| 'plinth' \| 'feet' \| 'flush' \| 'legs', height, inset } }, mat) → { group, frontRect }` | Desk pedestals are small carcasses without a top. `frontRect` feeds `layoutFronts` (overlay: the outer face; inset: the opening inside the panels). Panels as `beam`s (44 tris each, flat ends hidden). Two users (cabinet, desk), so it belongs in core under R7. | cabinet, desk, nightstand, bed storage |
| Promote `turnedLeg` (table → core) → **approved as `turnedPost` (B1)** | `turnedLeg({ height, radius, blockHeight, sides = 8 }, mat) → Group` | Writing desks use turned legs (20 %). Second user, so promote it (R7 "promote when"). Fallback: turned → tapered. | table, desk, bed posts |
| Promote `buildFeet` (sofa → core) → **approved (B2)** | `buildFeet(anchors, { kind: 'bun' \| 'block', height, radius }, mat)` | Pedestal `feet` base. The cabinet spec probably wants it too. Fallback: feet → plinth. | sofa, desk, cabinet, bed |
| `buildTrestle` option `stretcherZ` (additive, default 0) → **replaced by `backRail` (A7)** | `buildTrestle({ …, stretcherZ = 0 })` | A high trestle stretcher at z = 0 sits in the knee box. With `stretcherZ` the desk could use a high stretcher at the back (classic trestle desk). Until then, the desk keeps it low (≤ 0.20 m, a footrest) and gives X a low weight. | desk, bench |
| `buildStandingFrame` (desk-local) | `buildStandingFrame({ width, depth, top, inset, columnWidth, columnDepth, stages, columnZ, footLength, footHeight, footWidth, barHeight }, mat) → Group` | Telescoping column T-frame. Local until a second user appears (an adjustable table). | (table: sit-stand) |
| Desk props (desk-local, or shelf filler) → **geometry from core `buildDecor` (C7); zone layout desk-local** | `buildDeskProps(p, mats) → Group` | Laptop, book stack, pen cup. If the shelf filler (backlog M4) exposes `book(w, h, d, mat)`, use it. | shelf, sideboard, nightstand props |

## Failure modes and guards
| Failure | Guard | Test |
|---|---|---|
| Item floats | Every floor part (legs, carcass beams, plinth, feet, trestle feet, T-frame feet, slab outlines from y = 0) has its bottom at y = 0. No tubes to the floor. Splay ≤ 0.10 × legHeight. | grounded |
| Hung box or centre drawer floats | Their top face is at the top's underside (overlap 1 mm), and their outer face touches the apron/legs. | connected |
| Knee space blocked (the desk becomes a cabinet) | `kneeWidth ≥ 0.62` (clamp pedestalWidth, demote double → single); front apron/centre drawer bottom ≥ 0.61 (sit); no `h`/`perimeter` stretchers; trestle stretcher ≤ 0.20; modesty panel only at z ≤ −D/2 + 0.04 | type check `kneeClearance`: no part except floor-level footrests intersects the box x ∈ kneeCenterX ± 0.30, y ∈ [0.22, 0.60] (stand: [0.22, topHeight − 0.14]), z ∈ [D/2 − 0.45, D/2] |
| Pedestal sticks out of the top | `pedestalOverhang ≥ 0`; carcass and handles inside the top plan except handles may project ≤ 0.035 past the front edge only if the pedestal is flush at the front (it is set back 0.01–0.03, so they don't) | type check `baseUnderTop` (plan bbox of non-prop parts ⊆ top bbox + 2 mm) |
| Drawer fronts intersect legs/apron | Apron drawer rect is inside the front legs' inner faces; fronts sit in front of the rail, with faces flush with the leg face (derived setback) | unit test on fronts rects vs leg lines |
| Drawer stack that does not fit | `stackLayout` falls back to `three` when the front height < 0.50; the solver's per-call `minDrawerH` and its degrade order; 3 apron drawers need ≥ 0.22 m each, else 2 | param test over 500 seeds: every front ≥ 0.08 × 0.18 m |
| Standing desk tips (1.18 m on a 0.6 m footprint) | `frameFootLength ≥ max(0.85·D, 0.58)`; columns within ±0.06 of z = 0 | stable |
| Trestle / panel desk racks | footLength ≥ 0.80·D; panelDepth ≥ 0.92·D; trestleInset ≤ 0.18·W | stable |
| Column stages look broken | Each stage overlaps the next by 0.03 and sits centred on the lower one; in `sit` mode the upper stages hide inside the outer one: visible length = max(0, topHeight − 0.72) split over the stages | type check: column parts form a connected vertical chain |
| Props float, sink or clip | Prop bottoms at topHeight (or the riser shelf top) exactly; zones fixed and clamped inside the top minus 0.03; laptop yaw-rotated footprint is checked against its zone; nothing in the gallery/riser footprint except books on the riser | shared invariants `decorSupported` / `decorInside` over `propZones(p)` (W5) |
| Inlay z-fights with the top | Inlay 1–2 mm proud of the top, never coplanar | snapshot |
| Grain flips between seeds on near-square slabs | Explicit `grainAlong` on the top (x), slabs (y), inlay (none: solid) | snapshot |
| Pinstripe wood on wide tops (deferred table issue) | grain `plain`/`bold` weighted to 0.7 combined; explicit axis | pattern board / snapshot |
| White frame vanishes on the floor at grid distance (deferred stool issue) | White body ≤ 20 % (standing) and only with a non-white top; for white body, `topFinish` wood or a paint with l ≤ 0.75 | colour test: |l(top) − l(body)| ≥ 0.12 when neither is wood |
| Painted top and body the same colour | Both painted → top uses `harmoniousSecondary(paint, 'white')` | unit test |
| Desk reads as a dining table | Depth ≤ 0.6·W and ≤ 0.80; drawers or a modesty panel or a riser/gallery in ≥ 70 % of seeds (writing 88 % drawers; pedestal 100 %; standing tall or riser 70 %; trestle box/riser ≈ 50 % — see open question 2) | sweep statistic + snapshot review |
| Pedestal desk reads as a sideboard | Top overhang over the knee hole ≥ 0.62 m open; pedestal height = full legHeight only for floor pedestals; hung box bottom ≥ 0.30 | kneeClearance |
| Triangle blow-up (2 pedestals × 4 drawers × handles) | Carcass panels and slab fronts are beams; handles ≤ 150 tris; at most 9 fronts | budget report p95 ≤ 4.5k, max ≤ 6k |
| More than 4 draw calls | Role table above; fronts share instances; all props and the inlay share the `decor` role | draw calls ≤ 4 |
| Off-centre bbox | The top is always the outermost part in x; props are clamped inside it | `centredInX` on the bbox |
| Item bigger than its cell | topWidth ≤ 1.80 < spacing − 0.1 = 2.0 | fitsCell |

Proposed `TYPE_RULES.desk`: `maxSize { width: 1.8, height: 1.40, depth: 0.82 }` (+5 % by the sweep), checks `centredInX`, `topAtHeight` (top surface within ±3 mm of `topHeight`, window by `heightMode`), `baseUnderTop`, `kneeClearance`, `decorSupported`, `decorInside`, `frontsFacePlusZ` (every front's normal is +z).

### Budget estimate (worst case per style)
| Style | Parts → tris | Total |
|---|---|---|
| writing | top 588 + 4 turned legs ~0.8k + 4 apron rails 176 + 3 fronts 132 + 3 ring handles 420 + gallery 132 + inlay 44 + props ~240 | ~2.5k |
| pedestal double | top 588 + 2 carcasses (2 sides, back, bottom, plinth) ~2 × 480 + 8 shaker fronts 2.0k (slab: 350) + 8 bar handles 8 × 132 + centre drawer 44 + 132 + modesty 44 + props ~520 | ~5.3k shaker, ~3.5k slab. Guard: double + shaker + bar → at most 3 drawers per pedestal (stackLayout `three` or `boxFile`/`twoBoxFile`) |
| pedestal hung | top 588 + 4 legs ~150 + aprons 132 + carcass ~250 + 3 fronts + handles ~550 + props | ~2.2k |
| trestle | top 588 + trestle ~480 + box 250 + front/handle ~190 + riser 132 + props | ~2.2k |
| standing | top 588 + frame ~530 + control box 300 + riser 132 + props | ~2.1k |
| panel | top 588 + 2 slabs ~2 × 200 + rail 44 + box ~440 + riser 132 + props | ~2.1k |

## describe() rows
| Section (group) | Label | Value format |
|---|---|---|
| style | Style | `writing`, `pedestal`, `trestle`, `standing`, `panel` |
| top | Size | `140 × 70 cm` |
| top | Height | `74 cm` / `112 cm · standing` / `74 cm · seated` (standing style) |
| top | Thickness | `3 cm` |
| top | Extras | `gallery rail`, `riser`, `leather inlay`, `props` (comma list) / `none` |
| base | Support | `4 legs · tapered`, `2 pedestals · plinth`, `pedestal left · panel end`, `pedestal right · leg end`, `hung pedestal · left`, `trestle · A`, `T-frame · 3 stages`, `panels · waterfall` (words from `supportKind`/`pedestalLayout`) |
| base | Knee space | `68 cm` |
| base | Modesty panel | `30 cm` / `none` (pedestal, panel) |
| base | Footrest | `at 15 cm` (trestle) |
| fronts | Drawers | `3`, `3 + 1 + 3`, `2 + door` |
| fronts | Layout | `three`, `graduated`, `box + file`, `2 box + file`, `drawer + door`, `apron row` |
| fronts | Fronts | `overlay · slab`, `inset · slab`, `inset · framed` |
| fronts | Handles | `brass ring`, `black bar 12.8 cm`, `finger groove` (colour word from `hardwareMode`) |
| palette | Colours | `{ swatches: [paint, inlayColor] }` (only when it applies) |
| finish | Top | `oak wood · plain grain` / `painted` |
| finish | Body | `walnut wood`, `painted`, `black`, `metal`, `matches top` |
| finish | Fronts | `match body` / `match top` (only with drawers) |
| props | On the desk | `laptop, 3 books, pen cup` |
| — | swatches | `[topColor, bodyColor, hardwareColor?, inlayColor if inlay, bookColors[0] if books]` |

## Grid cell
spacing: 2.1 m, **spacingZ: 1.6 m** (architect, W2), gridSize: 9 (81 items).
- **Driver:** the widest top is 1.80 m (pedestal double, trestle). The fits-cell rule needs < 2.0 m, so there is 0.2 m of headroom, the same as the table. Nothing projects past the top: props are clamped inside it, handles stay behind the front edge (pedestals are set back), T-frame feet are ≤ D − 0.02.
- **Depth:** desks are ≤ 0.82 m deep (incl. handles). `spacingZ` 1.6 leaves 0.68 m of fits-cell headroom and keeps raised standing desks (1.18 m + riser) from hiding the row behind; check in the snapshot.
- **Budget:** median ~2.4k tris, so 81 × 2.4k ≈ 0.2M per grid (worst 81 × 5.3k ≈ 0.43M), well under the table grid. 81 builds × ~3 ms (fronts add parts) is fine.
- **Alternative:** 2.0 / 9 with a 1.75 m cap on topWidth (0.15 m headroom).

## Open questions
1. **Fifth style `panel`:** keep it (Π / waterfall silhouette, nearly free), or stay with the plan's four styles and fold the slab end into `pedestal: single` only?
   **Architect (recommendation):** keep `panel`. It costs almost nothing and the waterfall Π is a silhouette no other type has.
2. ~~**Trestle desk vs trestle table:**~~ at grid distance a plain trestle desk (65 % have no drawer box) differs from the table trestle mainly by depth (≤ 0.75 m vs 0.75–0.95). Raise the hung box chance to 0.6, or add the high back stretcher (needs the `stretcherZ` option on `buildTrestle`)?
   **Architect:** both cues: the core `buildTrestle({ backRail })` option (A7, replaces `stretcherZ`) at chance 0.5 (`trestleBackRail`), and the box chance stays 0.35. Together about 2 in 3 trestle desks carry a desk cue; the shallow depth does the rest.
3. ~~**fronts.js contract:**~~ this spec assumes `layoutFronts` / `buildFronts` / `buildHandles` / `buildCarcass` with the signatures above, and the cabinet's `frontStyle` and `handleKind` names. Whichever the cabinet spec settles on, the desk adopts its enum names. Is a carcass without a top (`top: false`) acceptable in the cabinet's helper, or should the desk build its pedestal carcass locally?
   **Architect:** the cabinet's API is the core (C1–C6), with the desk's plans listed in `specs/_kit-additions-wave2.md`. `buildCarcass` never builds a top (neither user wants one); bases are separate calls. Field names follow W9.
4. ~~**Props:**~~ keep the still life (40 % of desks, 0–1 extra draw call, ~0.5k tris)? Should books get two alternating colours? That needs a 5th role or a book helper from the shelf filler that uses a stripe pattern. Should standing desks always show the laptop, to sell the "office" read?
   **Architect:** keep 40 %. Props, books (two alternating colours) and the inlay share one vertex-colour `decor` role (W4/W5), so no 5th role and no stripe trick is needed. Standing desks: no forced laptop; the raised silhouette already reads as office.
5. ~~**Non-square cells:**~~ use `cell.spacingZ` (2.1 × 1.4) for desks in wave 2, or keep square cells per R4?
   **Architect:** `spacingZ` 1.6 (W2).
6. **L-shaped desks, roll-top/secretary desks and hutches (tall upper shelves)** are left out: they break the max footprint or overlap the shelf/cabinet types. Wanted later?
   **Architect (recommendation):** later. A hutch would be the second `layoutShelfContents` user.
7. **Standing height share:** 55 % of standing desks raised to 1.00–1.18 m makes them a strong silhouette, but they then dwarf the other desks in a mixed grid. OK, or 40 %?
   **Architect (recommendation):** keep 55 % and judge it in the snapshot; the All-view mix weight is 1, so raised standing desks are about 1 in 80 items there.
8. **Knee hole minimum:** 0.62 m (between the 0.51–0.61 m woodworking guidance and the 0.76 m ADA figure). Use ADA 0.76 instead? That forces double pedestals to ≥ 1.50 m wide.
   **Architect (recommendation):** keep 0.62 m; the type check enforces it.

## Architect review (wave 2, M4)

**Verdict: approved with edits.** The desk is well researched (knee space, drawer heights, standing frames), the five
styles read as different silhouettes, the knee-clearance check is the right type rule, and moving the props toggle
into `top` is a clean answer to the change-rate problem. The edits align it with the cabinet's front kit and the
shared decor approach; all are applied above. Final helper names and the desk's exact plan shapes are in
`specs/_kit-additions-wave2.md`.

Changes:
1. **Fronts on the cabinet's API (W9, C1–C6).** `layoutFronts` / `buildFronts` / `buildHandles` / `buildCarcass({ top })`
   are replaced by `solveFronts` plans, `buildFronts`, the shared handle library and `buildCarcass` (no top ever, bases
   separate). `stackRows` is removed: build derives the plans from `stackLayout` with a desk-local `deskPlans(p)`
   (plans are not stored because they hold no drawn values). The desk passes its own drawer limits per call
   (apron rows `minDrawerH` 0.05, pedestals `maxDrawerH` 0.46 for file drawers).
2. **Shared vocabulary:** `frontStyle` → `construction` (overlay / inset) + `drawerStyle` (slab / framed, framed only
   on drawers ≥ 0.15 m); `reveal` → `gap`; handle `edge` → `groove`; `handlePairs` removed (the shared `handleSlots`
   rules decide one or two handles; its file-drawer rule gives the "upper third" anchor the desk asked for). `ring`
   is added to the library for the desk (fallback `knob` if it slips).
3. **Decor role (W4, W5).** The `accent` role becomes the vertex-colour `decor` role: inlay, laptop, books and cup
   share it. The laptop no longer creates the hardware role, and the "no laptop with brass" rule is gone. Books
   alternate two `bookColors`; `cupColor` added; both live in `props`. Palette keeps `paint` and a new `inlayColor`
   from core `pickLeather` (A2). `propsOnTop` becomes the shared `decorSupported` / `decorInside` invariants over a
   desk-local `propZones(p)`.
4. **Trestle desk cue:** `trestleBackRail` (chance 0.5) via the additive `buildTrestle({ backRail })` (A7), replacing
   `stretcherZ`, which would float beside an `I` post.
5. **Promotions:** turned legs from core `turnedPost` (B1), pedestal feet from core `buildFeet` (`block`, B2).
6. **Grid:** `spacingZ` 1.6 (W2).

Notes for the generator-engineer:
- The apron drawer row passes `backers: false, members: false` to `buildFronts`: the front rail is the backer, and its
  setback puts the drawer faces flush with the legs.
- `drawerDoor` hinges on the pedestal's outer side (`hinge: pedestalSide`); for `double`, each pedestal uses its own
  side.
- Budget: the double-pedestal shaker guard (≤ 3 drawers per pedestal with bar handles) still applies; framed fronts
  cost ≈ 220 tris each.
- The decor allowance is 700 tris (W3).
