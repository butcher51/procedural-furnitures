# 01 — Vision & Scope

## Vision

Type a seed and get a showroom of plausible, charming, low-poly furniture. Every piece is
unique, every piece is reproducible, and pieces from the same seed can look like they belong to the same
collection.

## Selection criteria

Each candidate is scored on four things:

- **Kit reuse.** How much of the existing chair geometry (legs, slabs, cushions, tubes) it can use.
- **Variety potential.** Whether seeds will produce visibly different, interesting results.
- **Silhouette clarity.** Whether it reads instantly as "that thing" at grid distance.
- **New capability.** Whether it forces a new helper that later types will reuse (drawers, doors, lathe parts, light).

## Catalogue

### Wave 1: reuse the chair kit (milestone M2)

| Type | Styles (initial) | Key params & real ranges | New kit pieces |
|---|---|---|---|
| **Stool** | bar, counter, milking (3-leg), drum | seat h: low 0.45, counter 0.60–0.68, bar 0.72–0.80 m; footrest ring; round/square seat | Footrest ring (from curvy ring), swivel column |
| **Table** | dining, coffee, side, café (pedestal), trestle | top h: dining 0.72–0.76, coffee 0.35–0.48, side 0.50–0.60; top shape rect/round/oval/squircle; apron; thickness 0.02–0.06 | Apron rails, trestle base, cross stretchers |
| **Bench** | park slats, plank, upholstered, backless/with back | seat h 0.42–0.47; length 1.0–1.8 m | Long-span leg layouts (2 frames vs 4–6 legs) |
| **Sofa** | grows out of `cozy`: 2/3-seater, loveseat, chaise, sectional-L | seat h 0.38–0.45; 1–4 seat cushions; arm styles track/roll/slope/none | Cushion splitting, rolled arms (tube or lathe) |

### Wave 2: boxes with features (milestone M4)

| Type | Styles | Key params | New kit pieces |
|---|---|---|---|
| **Shelf / bookcase** | open, ladder, cube grid, wall-leaning | h 0.8–2.1, depth 0.25–0.40; shelf count; back panel | **Procedural books & objects** filling the shelves (high charm) |
| **Cabinet family** (sideboard, dresser, nightstand, TV unit) | mid-century, shaker, industrial | carcass w/h/d; plinth vs legs; drawer/door grid | **Drawer & door fronts, handles/knobs library**, front-layout solver |
| **Desk** | writing, pedestal, trestle, standing | h 0.72–0.76, d 0.6–0.8; drawer pedestal 0/1/2 | Reuses table + cabinet |
| **Bed** | platform, slatted, upholstered headboard, four-poster, bunk | mattress sizes 90/140/160/180 × 200; frame h; headboard style | Mattress + pillows + duvet (soft puffy fold) |

### Wave 3: accents and atmosphere (milestone M5)

| Type | Styles | Notes |
|---|---|---|
| **Lamps** | floor, table, pendant, arc | Lathe shades, emissive material, optional real point light only on the selected item (performance) |
| **Plants & pots** | lathe pots, leaf clusters | Big charm for little code. Good "decoration" slots on shelves and tables |
| **Rugs** | rect/round/runner, patterns | Flat; reuses the pattern texture system. Anchors groupings in ensembles |
| **Wardrobe** | 2–4 doors, sliding, open rail | Reuses cabinet. Large footprint, so its grid needs fewer items |

### Wave 4: ensembles & rooms (milestone M6)

- **Style DNA.** One seed decides a palette, wood tone, frame finish, roundness and leg language. Every
  item generated from that DNA matches.
- **Sets.** A dining set (table + 4–8 chairs placed around it), a living set (sofa + coffee table + rug + lamp),
  a bedroom set (bed + 2 nightstands + lamp).
- **Room mode.** A simple floor plan with sets placed along walls. This is a stretch goal.

## Out of scope (for now)

- Physics, collision and drag-and-drop arrangement
- High-poly or PBR texture realism. The low-poly identity is a feature.
- Server-side generation and accounts. Static files only.
- Export to CAD formats. GLB export is in the backlog as a small nice-to-have.

## Success criteria

- Every type yields **at least 3 recognisable styles** and **no broken items in 500 consecutive seeds**
  (no floating parts, no parts poking through, nothing below the floor). Checked by doc 06's invariants plus visual review.
- A full grid of any type builds in **< 3 s** and runs at **60 fps** on a mid-range laptop.
- Existing chair seeds **reproduce exactly** after the refactor (golden test).
