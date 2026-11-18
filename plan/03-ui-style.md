# 03 — UI & Visual Style

## Identity: "warm paper showroom"

Keep what already works in the chair generator and turn it into a small design system.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f3ef` | Page and scene background (scene matches page so the canvas feels borderless) |
| `--ground` | `#ece8e1` | Floor plane |
| `--panel` | `#ffffffd9` + blur 6px | Floating panels |
| `--border` | `#e2ddd4` | Hairlines, grid minor lines |
| `--text` / `--muted` | `#2b2a28` / `#8a857c` | Typography |
| `--accent` | `#2b2a28` | Primary buttons, selection ring |
| Radius | 6 / 8 / 10 px | Inputs / panels / cards |
| Type | system-ui 14px, tabular numerals for values | |

- **3D look:** flat shading, soft rounded bevels, one hemisphere light plus a soft sun, gentle shadows. No textures beyond
  64px patterns. Colours stay mid-saturation; a randomly generated palette must never look neon.
- **Motion:** the centre-out "pop" reveal with overshoot is the signature. Keep it for every type, and scale the ring delay
  by grid size so big grids don't drag.
- **Dark mode:** optional, later. Plan the tokens for it now: a charcoal floor and warm lamp light. It pairs nicely with wave 3 lamps.

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Procedural Furniture        [Chair][Stool][Table][Bench][Sofa]     │
│                                  Seed [ abc123   ] (Regenerate) ⋯ │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              3D grid of one type (orbit, click, dblclick)            │
│                                                                      │
│ ┌──────────────────────────┐                            ┌────────┐  │
│ │ ▾ Table 42 · abc-..      │                            │ ⟲ ⤢ 📷 │  │
│ │ STYLE                 ⟳  │                            └────────┘  │
│ │   Style       coffee     │                                        │
│ │ SHAPE              ⟳ 1   │                                        │
│ │   Top         oval       │                                        │
│ │   Height      42 cm      │                                        │
│ │ COLOURS            ⟳ 2   │                                        │
│ │   Colors      ■ ■ ■      │                                        │
│ │ [Reset rolls] [Copy link]│                                        │
│ │ [Solo]                   │                                        │
│ └──────────────────────────┘                                        │
└──────────────────────────────────────────────────────────────────────┘
```

- **One type at a time.** The grid always shows a single furniture type. The type switcher is a row of segmented chips in the header.
- **Params panel:** generic, driven by `describe()` sections. Adds **Copy link** (seed, type, item and rerolls) and **Solo**, which
  isolates the item in single view on a turntable.
- **Re-roll per section.** Each section header has a ⟳ button that re-rolls only that group, with a small counter once it
  has been rolled. Shift+click steps the counter back. **Reset rolls** returns the item to its original version. The
  item pops in again in place, and the rest of the grid stays untouched. Re-rolled items get a small dot on their floor
  marker so you can spot them in the grid. Sections that cannot be re-rolled (the chair's style) show no button.
- **View controls** (bottom right): reset camera, fullscreen, screenshot PNG. Later: export GLB.
- **Keyboard:** `R` regenerate, `←/→` previous/next item, `1–9` switch type, `Esc` back to overview, `C` re-roll colours
  of the selected item, `S` re-roll its shape.
- **Phone width:** the panel becomes a bottom sheet and the chips scroll horizontally.

## Interaction rules

- Click selects, double-click zooms, double-click on the floor resets. Unchanged from today.
- Switching type keeps the seed. Regenerate changes the seed and keeps the type. Both clear rerolls.
- Every visible state is in the URL, including rerolls, so any view can be shared.
- The loader shows `Generating tables… n / total`, using `definition.label`.

## Decided

- The grid shows one type at a time. There is no Mixed mode for now.
- Per-group re-roll is in scope (see doc 02, "Re-roll groups").

## Open for the UX designer agent

1. Should the ensemble view (wave 4) be a separate mode or a layout option of the grid?
2. Should re-roll history be browsable (e.g. a filmstrip of previous rolls), or is the counter with shift+click enough?

The UX designer delivers `specs/ui.md` plus a clickable HTML mockup (no 3D, static images are fine) for the
P2 human gate.
