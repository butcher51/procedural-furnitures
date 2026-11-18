# UI spec: multi-furniture showroom

Backlog 2.5. Input to 3.1 (ui-engineer). Mockup: `mockups/ui.html` (static, open it in a browser; the switches at the
top toggle desktop/phone and the ready/loading/solo states).

Scope: what 3.1 must add (type switcher, view controls, keyboard map, phone layout with bottom sheet, per-type loader
text, solo/turntable view) and the refinements to what P1 already ships (panel, re-roll buttons, actions, URL).
Wave 1 types: Chair, Stool, Table, Bench, Sofa.

Everything here keeps the "warm paper showroom" identity from plan/03: the page and scene share one background, chrome
floats over the canvas on blurred white panels, and every item arrives with the centre-out pop.

---

## 1. Tokens

Existing tokens stay as they are. 3.1 adds the ones in **bold** to `:root` so the new components don't hard-code values.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f3ef` | Page, scene background, input fill, button hover |
| **`--ground`** | `#ece8e1` | Floor plane (today hard-coded in `scene.js`) |
| `--panel` | `#ffffffd9` + `backdrop-filter: blur(6px)` | Every floating surface: panel, view controls, loader, toasts, sheet |
| `--border` | `#e2ddd4` | Hairlines, sheet handle |
| `--text` / `--muted` | `#2b2a28` / `#8a857c` | Type |
| `--accent` | `#2b2a28` | Primary button, active chip, selection ring, loader bar |
| **`--on-accent`** | `#ffffff` | Text on accent |
| **`--focus`** | `#c9c2b5` | 2px focus ring (already used on the seed input) |
| **`--shadow`** | `0 8px 24px #0000000f` | Loader card, sheet, toasts (already on the loader card) |
| **`--r-input` / `--r-panel` / `--r-card`** | 6 / 8 / 10 px | Inputs and buttons / panels and chip track / loader card, sheet top corners |
| **`--hit`** | 32px desktop, 44px phone | Minimum hit target for icon buttons |

Dark mode (later, not in 3.1) only overrides these variables: `--bg #23211e`, `--ground #2c2a26`, `--panel #2b2926d9`,
`--border #3a3732`, `--text #efebe4`, `--muted #9a948a`, `--accent #efe6d6`, `--on-accent #23211e`, `--focus #6b6458`.
Keep every colour in CSS behind a variable so that works without touching components. `scene.js` should read the scene
background and ground colours from the computed CSS variables at boot instead of hard-coding them.

Type: `system-ui` 14px / 1.4. Values use `font-variant-numeric: tabular-nums`. Section headers 11px, 600, uppercase,
`letter-spacing: .06em`, `--muted` (as today). Item seeds use `ui-monospace` 12px.

---

## 2. Layout

### 2.1 Desktop (≥ 1024px wide), reference 1440 × 900

```
┌ header 52px, white, 1px bottom hairline ──────────────────────────────────────────────────────────┐
│ Procedural Furniture      [ Chair | Stool | Table | Bench | Sofa ]      Seed [abc123   ] (Regenerate) ⋯ │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                    │
│                               canvas fills the rest (scene bg = page bg)                           │
│                                                                                                    │
│                                     ┌ loader card, centred ┐                                       │
│                                     └──────────────────────┘                                       │
│ ┌ panel 300px ───────────┐                                                       ┌ view ctrls ┐    │
│ │ ▾ Table 42  abc123-ta… │                                                       │ ⟲  ⤢  ◉   │    │
│ │ ...sections...         │                                                       └────────────┘    │
│ │ [Reset rolls][Copy link][Solo]                                                                   │
│ └────────────────────────┘                                                                         │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- The header is one row. Title left (flex 1), chips centred (flex none), seed group right (flex 1, right-aligned).
  Padding 12px 16px, gap 12px. It stays white with the hairline, as today.
- The canvas fills the remaining height. Overlays are absolutely positioned in `#viewport` with a 16px inset.
- Panel: bottom-left, width 300px. Today it has a 240px minimum and grows with its content, so it jumps in width when
  the selection changes; fix the width. `max-height: calc(100% - 32px)`, scrolls inside.
- View controls: bottom-right, one horizontal pill.
- Loader: centred over the canvas.
- Toasts: bottom-centre, 16px above the bottom edge.

### 2.2 Narrow desktop / tablet (640–1023px)

The header wraps to two rows. Row 1: title, seed input, Regenerate, ⋯. Row 2: chips, left-aligned, scrolling
horizontally if they don't fit. The panel and view controls stay floating. Panel width becomes
`min(300px, 100% - 32px - view-controls width - 12px)`.

### 2.3 Phone (< 640px wide), reference 390 × 844

See section 7.

---

## 3. Components

### 3.1 Type switcher (new)

A segmented control in the header with one chip per registered type, in registry order. The chip list comes from
`registry.list()`, so the shell never names a type. Types whose generator hasn't landed yet get no chip. Disabled
"coming soon" chips would be noise in every screenshot until 3.5 merges.

The first chip is **All** (key `0`, `?type=all`): 120 items, each picking its type from `${seed}-all-${n}` with equal
weights and generated with `generateItem(def, `${seed}-all`, n, rerolls)`. Items are row-packed by measured footprint
(`src/app/layout.js`, gap 0.3 m, roughly square, centred) and repacked when a re-roll changes a footprint. Loader:
`Generating furniture… n / 120`. Grid sizes since 3.5.4: chair 13, stool 13, table 9, bench 9, sofa 9.

| Part | Spec |
|---|---|
| Track | `--bg` fill, 1px `--border`, radius `--r-panel`, padding 2px, gap 2px |
| Chip | `definition.label`, 13px, padding 4px 12px, radius `--r-input`, transparent, `--text` |
| Hover | background `#fff` |
| Active | `--accent` fill, `--on-accent` text, no hover change |
| Focus | 2px `--focus` ring (`:focus-visible` only) |
| Tooltip | `Table (3)` (label plus number key) |

Semantics: `role="radiogroup"` with `aria-label="Furniture type"`; each chip is `role="radio"` with `aria-checked`.
Roving tabindex: Tab enters on the active chip, and ←/→ move between chips and activate them (radio behaviour). The
chip group handles these arrow keys itself, so they don't reach the global ←/→ item navigation (see section 5).

Behaviour:

- Click: if it's the active type, nothing happens. Otherwise set `type`, keep `seed`, clear `item` and `rerolls`,
  push a history entry (6.2), then regenerate.
- The chip goes active immediately, before the grid is built. Clicking another chip while a grid is generating cancels
  the in-flight build (the `generation` counter in `grid.js` already supports this) and starts the new one.
- In solo view, switching type stays in solo. Because `item` is cleared, it shows item 1 of the new type.

### 3.2 Seed group (exists, refined)

`Seed [input] (Regenerate) ⋯`

- Input: 160px wide, monospace value, Enter applies (as today). On blur, an empty or unchanged field shows the current
  seed again. Esc blurs and restores the current seed.
- Regenerate: primary button (accent). Tooltip `New seed (R)`.
- `⋯` (new): a 32px icon button that opens a small menu (a `--panel` card under the button, right-aligned):
  - **Keyboard shortcuts** `?`: opens the help card (3.8).
  - **Clear all rolls**: clears `rerolls` for every item and rebuilds only the affected items, each with its own pop.
    The label shows the count, e.g. `Clear all rolls (3 items)`, and the entry is disabled when there are none. Today
    the only way to do this is to regenerate.
  - **Animations** on/off: toggles `anim` (the pop and the turntable). The default follows `prefers-reduced-motion`.

### 3.3 Params panel (exists, refined)

```
┌──────────────────────────────────┐
│ ▾ Table 42   abc123-table-42     │   summary: label + number bold; item seed muted mono, ellipsised
│   coffee · re-rolled             │   subtitle: style, plus "re-rolled" when any count > 0
│ STYLE                         ⟳  │
│   Style                 coffee   │
│ SHAPE                    ‹ 1 ⟳   │   once rolled: step-back button, counter, re-roll
│   Top                     oval   │
│   Size             110 × 60 cm   │
│   Height                 42 cm   │
│ COLOURS                  ‹ 2 ⟳   │
│   Colors               ■ ■ ■     │
│ FINISH                        ⟳  │
│   Wood                     oak   │
│ ──────────────────────────────── │
│ [Reset rolls] [Copy link] [Solo] │
└──────────────────────────────────┘
```

Changes from P1:

1. **Heading.** Today the heading is `Table 42 · abc123-table-42` in one bold run. Split it: `Table 42` is weight 600,
   and the item seed is muted monospace with an ellipsis when it's too long (full value in `title`). Add a subtitle
   line with the style id, plus `· re-rolled` when the item has rolls. The style id comes from `params.style`, which
   the contract guarantees.
2. **Re-roll control.** At count 0 it's `⟳` alone. At count > 0 it becomes a small 3-part control, `‹ n ⟳`:
   - `‹` steps back one (same as shift+click on ⟳, which stays). This makes stepping back discoverable and works on
     touch, which has no shift key.
   - `n` is the counter, tabular, `--muted`.
   - `⟳` re-rolls forward.
   - Tooltips: `Re-roll shape (S)` and `Step back (shift+S)`. Only `palette` (C) and `shape` (S) have keys, so other
     groups show no key hint.
   - Sections with `rerollable: false` show nothing (as today).
   Each button is at least 24 × 22 px on desktop and 36 × 36 px on phone.
3. **Change flash.** After a re-roll, rows whose value changed get a 600ms `--bg` background fade. This covers the
   dependent-group case from doc 02 (re-rolling `palette` can change what `finish` shows) without needing an
   explanation. There's no flash when `anim=0` or reduced motion is on.
4. **Swatches** stay 14px squares with a `#0002` border and the hex in `title` (as today).
5. **Actions row.** It sits 10px below a hairline. All three are secondary buttons (transparent, 1px border).
   - `Reset rolls`: disabled at zero rolls (as today).
   - `Copy link`: becomes `Copied` or `Copy failed` for 1.2s (as today). On failure, a toast also shows the URL in a
     selected, read-only input so the user can copy it by hand.
   - `Solo` / `Grid`: toggles the view (3.6). The label names the view you'd switch to. Tooltip `Solo view (Enter)`.
6. **Collapse.** The `<details>` stays. Remember open/closed in `localStorage` (`pf.panel.open`), not in the URL,
   because it's chrome, not content.
7. **Width** is fixed at 300px (see 2.1).

### 3.4 View controls (new)

A floating pill, bottom-right: `--panel` + blur, 1px `--border`, radius `--r-panel`, padding 4px, gap 2px. It holds
three icon buttons, each `--hit` square and transparent, with `--text` stroke icons (1.5px stroke, 18px inline SVG,
no icon font):

| Button | Icon | Key | Action |
|---|---|---|---|
| Reset camera | circular arrow around a dot | `Home` | `stage.resetCamera()` with a 300ms ease instead of a jump. Clears the zoomed flag (section 5) |
| Fullscreen | four outward corners; four inward corners when active | `F` | Toggles `#viewport.requestFullscreen()`. The header hides; the panel and controls stay. Hidden when `document.fullscreenEnabled` is false (iPhone Safari) |
| Screenshot | camera | `P` | Downloads a PNG of the canvas (below) |

Screenshot behaviour:

- Hide the selection ring and the re-roll dots, render one frame, and call `canvas.toBlob` in the same task (so
  `preserveDrawingBuffer` isn't needed). Then show them again.
- Resolution: the canvas backing size (CSS size × pixel ratio, max 2).
- File name: `{type}-{seed}.png` in the grid and `{type}-{seed}-{item}.png` in solo. In solo, rolls are appended as
  `-palette2-shape1` (the same pairs as the URL, sorted).
- Feedback: a toast `Saved table-abc123-42.png` for 2s.

Later (not 3.1): an `Export GLB` button joins the pill as a fourth icon, with the same file name rule.

Hovering shows a tooltip with the key, e.g. `Reset camera (Home)`. Every button gets an `aria-label`.

### 3.5 Loader (exists, refined)

The card stays as it is (spinner, text, 4px bar, `--r-card`, `--shadow`). Changes:

- **Text** is `Generating {plural}… {done} / {total}`, e.g. `Generating benches… 120 / 225`. `plural` becomes a
  **required** field on every definition, because the `label + 's'` fallback in `main.js` would give "benchs". Wave 1
  values:

  | Type | label | plural | Loader example (grid size from `definition.cell`) |
  |---|---|---|---|
  | chair | Chair | chairs | `Generating chairs… 312 / 625` (25 × 25) |
  | stool | Stool | stools | `Generating stools… n / N` |
  | table | Table | tables | `Generating tables… 88 / 225` (15 × 15, the doc 02 example) |
  | bench | Bench | benches | `Generating benches… n / N` |
  | sofa | Sofa | sofas | `Generating sofas… n / N` |

  N comes from each type's spec; the shell never hard-codes it.
- **Solo** builds a single item. The text is `Generating table 42…` and there's no bar.
- **Delay.** Show the card only if generation hasn't finished 150ms after it started, so fast builds (solo, small
  grids) never flash a loader. Once it's shown, keep it up for at least 300ms so it doesn't blink.
- **Accessibility.** The text sits in an `aria-live="polite"` region but only announces the start and the end
  (`Generated 225 tables`), not every count.
- The old grid is cleared before building (as today). The loading state is the empty floor with the loader card;
  there's no skeleton.
- On phone, the card is centred in the canvas area above the sheet peek, not in the full viewport.

### 3.6 Solo / turntable view (exists as `view=single`, extended)

Solo shows one item centred, with no floor grid, on a slow turntable.

- **Entering:** the panel's `Solo` button or `Enter`. Double-click keeps its meaning (zoom), as plan/03 requires, so
  solo is always an explicit action.
- **No page reload.** Today `onSolo` calls `location.assign`, which reloads the page and loses the camera. 3.1 changes
  it to `history.pushState` plus an in-place `populate({ single: true })`. Back returns to the grid (6.2).
- **Turntable.** `controls.autoRotate = true` at one revolution per 24s (`autoRotateSpeed ≈ 2.5`). Any pointer-down on
  the canvas stops it, and `Space` toggles it. Once the user has orbited, it stays off until they press Space or
  re-enter solo. It's off when `anim=0` or with `prefers-reduced-motion`, because snapshot tests rely on
  `view=single&anim=0` being still.
- **Item stepper.** A small pill at the top-centre of the canvas: `‹  Table 42  ›`. `‹`/`›` and ←/→ step the item
  number (1…gridSize², wrapping) and rebuild the single item with its pop. The URL `item` is replaced. Rolls for other
  items stay in `r`, so stepping back to a rolled item shows its rolls.
- **Back to grid:** the `Grid` button in the panel, `Esc`, or a `← Grid` text button at the left of the stepper pill.
  The grid comes back with the same item selected and the camera focused on it (as after a double-click zoom), so the
  user lands where they left.
- **Backdrop.** The same `--bg` as the grid, with the floor grid hidden (as today). A soft studio vignette (radial
  `--bg` → `--ground`) is a later nice-to-have; it needs a transparent renderer and isn't in 3.1.
- The selection ring and re-roll dots are hidden in solo (the ring already is).

### 3.7 Selection and grid feedback (exists, unchanged)

- A selection ring on the floor around the selected item (accent, 55% opacity), scaled with `cell.spacing`.
- Re-rolled items show a small dot on the floor at the cell's front-right corner.
- Hover shows a pointer cursor over items.
- The pop reveal runs centre-out by ring, with `RING_DELAY` scaled by grid size (already done). A re-roll pops the
  single item.

### 3.8 Toasts and help card (new, small)

- **Toast:** `--panel` + blur, `--r-panel`, `--shadow`, 13px, bottom-centre. It dismisses itself after 2s, and only
  one shows at a time (a new one replaces the old). Used for: screenshot saved, the link-copy fallback, an unknown
  type in the URL, and WebGL errors.
- **Help card** (`?`, or ⋯ → Keyboard shortcuts): a centred `--panel` card, max 420px, with two columns (key, action)
  taken from the table in section 5. It closes on Esc, a click outside, or `?`. `role="dialog"`,
  `aria-modal="true"`, focus trapped.

---

## 4. States

| State | What the user sees | Notes |
|---|---|---|
| Booting | Header with chips (active type from the URL) and seed; empty canvas; loader after 150ms | Panel hidden until the first item is selected |
| Generating grid | Empty floor + loader card with per-type text and bar; the params panel is hidden until the grid is built; chips and Regenerate stay enabled | Clicking again cancels and restarts |
| Ready (grid) | Grid popped in centre-out; centre item (or `item` from the URL) selected with the ring; panel shows it | `data-ready` on `<html>` as today |
| Item selected | Ring moves (no animation needed); panel re-renders; URL `item` replaced | |
| Zoomed | After a double-click the camera is focused on the item; ←/→ move the selection and the camera follows | Ends on reset camera, floor double-click or Esc |
| Re-rolled | Item pops in place; section shows `‹ n ⟳`; subtitle `· re-rolled`; floor dot; changed rows flash | Other items untouched |
| Solo | One item, turntable, stepper pill top-centre, panel button reads `Grid` | |
| Loading (solo) | Usually invisible (< 150ms); otherwise `Generating table 42…` | |
| Fullscreen | Header hidden; canvas, panel, view controls and stepper remain; fullscreen icon flips | Esc leaves fullscreen (browser) |
| Copy link done / failed | Button reads `Copied` / `Copy failed` for 1.2s; fallback toast on failure | |
| Unknown type in URL | Falls back to chair, URL replaced, toast `Unknown type "lamp", showing chairs` | |
| Item out of range | Ignored; centre item selected; `item` dropped from the URL | |
| Malformed `r` | Bad chunks dropped (the decoder already does this); URL rewritten clean | |
| WebGL unavailable | Canvas area shows a `--panel` card: `This needs WebGL. Try another browser.` The header still works | |
| Reduced motion | No pop (instant), no turntable, no row flash; camera moves jump | `prefers-reduced-motion: reduce` or Animations off |

Disabled styling: 35% opacity (as today), no hover change, `cursor: default`.

---

## 5. Keyboard

A global `keydown` handler on `document`. It ignores the event when:

- focus is in an `input`, `textarea` or `[contenteditable]` (except Esc, which blurs);
- focus is inside the chip radiogroup (it handles its own arrows; other keys still pass);
- Ctrl, Meta or Alt is held (browser shortcuts win);
- a dialog (the help card) is open, except for Esc and `?`.

| Key | Action | Notes |
|---|---|---|
| `R` | Regenerate (new seed, same type) | Clears rolls and item |
| `0`–`9` | Switch type by chip order | 0 All, 1 Chair, 2 Stool, 3 Table, 4 Bench, 5 Sofa. Unused numbers do nothing |
| `←` / `→` | Previous / next item | Grid: number ±1, wrapping; if zoomed, the camera follows. Solo: steps the solo item |
| `↑` / `↓` | One row back / forward | Grid only (number ∓/± gridSize, clamped). Not in plan/03, but cheap and expected once ←/→ exist |
| `C` / `Shift+C` | Re-roll / step back the selected item's `palette` group | No-op if the type has no `palette` group or it isn't rerollable |
| `S` / `Shift+S` | Re-roll / step back `shape` | Same rule |
| `Enter` | Toggle solo for the selected item | |
| `Space` | Pause / resume the turntable | Solo only. `preventDefault` so the page doesn't scroll |
| `Esc` | Back one level | Cascade: close help/menu → collapse the phone sheet to peek → leave solo → reset a zoomed camera |
| `Home` | Reset camera | Same as the view-control button and a floor double-click |
| `F` | Toggle fullscreen | |
| `P` | Screenshot PNG | |
| `/` | Focus the seed input and select its text | |
| `?` | Show / hide the shortcut help card | `Shift+/` on most layouts; match on `e.key === '?'` |

Keys match on `e.key` (lowercased) so they work on non-QWERTY layouts. The exception is `1`–`9`, which match on
`e.code` (`Digit1`…) so AZERTY users don't have to hold Shift.

Group keys are bound by group id, not by label, so they stay generic: `C → palette`, `S → shape`. The chair already
uses those ids. The wave 1 type specs (2.1–2.4) must use them too for their colour and shape groups, and the 2.6
review should check it.

---

## 6. URL behaviour

### 6.1 Parameters

The grammar is unchanged from doc 02 and `src/app/url.js`:

| Param | Example | Default | Notes |
|---|---|---|---|
| `type` | `table`, `all` | `chair` (omitted) | `all` is the mixed showroom. Unknown → chair + toast, URL rewritten |
| `seed` | `abc123` | random 6 chars | Always written |
| `item` | `42` | none → centre item | 1-based. Out of range → dropped |
| `view` | `single` | grid (omitted) | Solo |
| `r` | `42.palette2.shape1~7.finish1` | none | Rolls per item. Cleared by a type or seed change |
| `anim` | `0` | on (omitted) | Disables the pop, turntable, row flashes and camera easing |

Some state stays out of the URL on purpose: the camera position (too noisy, and a shared link should open at the
overview), panel open/closed, the sheet detent, and fullscreen. The rule "every visible state is in the URL" applies
to content (which items, which rolls, which view), not to chrome or the camera.

### 6.2 History

Today every change uses `replaceState`, and solo does a full `location.assign`. 3.1 changes this:

| Change | History | Why |
|---|---|---|
| Type switch | `pushState` | Back returns to the previous type with the rolls the switch just cleared. A cheap undo for "I lost my rolls" |
| Regenerate / new seed | `pushState` | Same: Back recovers the previous showroom |
| Solo ↔ grid | `pushState` | Back leaves solo, which is what people expect, especially on phone |
| Select item | `replaceState` | Dozens per minute; pushing would bury the useful entries |
| Re-roll / step back / reset | `replaceState` | The counter is its own undo (‹) |
| Solo stepper ←/→ | `replaceState` | |

`popstate`: read the state with `readState`. If `type` or `seed` changed, regenerate. If only `view` changed, switch
between solo and grid in place. If only `item` or `r` changed, rebuild the affected items and select. Never push from
inside the `popstate` handler.

---

## 7. Phone layout (< 640px), reference 390 × 844

```
┌ 390 ─────────────────────────────┐
│ [abc123        ] (⟳)  ⋯          │  header row 1: seed input flex, Regenerate as icon, menu
│ [Chair][Stool][Table][Bench][So›│  row 2: chips scroll horizontally, edge fade
├──────────────────────────────────┤
│                                  │
│          canvas                  │
│                                  │
│                           ┌───┐  │  view controls: vertical pill, right edge,
│                           │ ⟲ │  │  12px above the sheet
│                           │ ◉ │  │
│                           └───┘  │
├─────────── ▬▬ ───────────────────┤  sheet handle
│ Table 42 · coffee · re-rolled  ▴ │  peek (72px + safe area)
│ STYLE ...                        │  half (50% of viewport)
│ ...                              │
│ [Reset rolls][Copy link][Solo]   │  actions sticky at sheet bottom
└──────────────────────────────────┘
```

### 7.1 Header

- The title is dropped: it's already the page title and would cost a row. The header is 2 rows, about 96px in total.
- Row 1: the seed input (flex 1, 16px font so iOS doesn't zoom on focus), Regenerate as a 44px icon button (dice/⟳
  glyph, accent fill, `aria-label="Regenerate"`), and the `⋯` menu (44px).
- Row 2: the chip track scrolls horizontally (`overflow-x: auto`, `scroll-snap-type: x proximity`, no scrollbar),
  with a 24px fade mask on the right edge when it overflows. The active chip is scrolled into view
  (`scrollIntoView({ inline: 'center' })`) on load and on change. Chips are 36px tall with 14px text.

### 7.2 Bottom sheet (replaces the floating panel)

The same `<details>` content, restyled as a sheet docked to the bottom: full width, `--panel` + blur, top corners
`--r-card`, `--shadow` cast upwards, 1px top hairline. A 36 × 4px handle in `--border` is centred at the top, inside a
44px-tall drag zone.

Three detents:

| Detent | Height | Shows | Default |
|---|---|---|---|
| Peek | 72px + `env(safe-area-inset-bottom)` | Handle, heading line (`Table 42 · coffee`) and a compact row of the item's re-roll buttons (`Shape ⟳1  Colours ⟳2`) | Yes |
| Half | 50% of the viewport | Heading plus scrolling sections; actions row sticky at the bottom | |
| Full | Viewport minus header minus 8px | Same as half, with more room | |

- Tapping the handle or heading cycles peek → half → peek. Dragging the handle moves between detents: on release it
  snaps to the nearest one, and a flick faster than 0.5 px/ms goes in the flick direction. At half or full, the content
  only scrolls when it's already at its top; otherwise the drag moves the sheet (standard sheet behaviour).
- Esc collapses the sheet to peek. The browser Back button doesn't, because the detent isn't a history entry.
- Selecting an item doesn't open the sheet; only the peek line updates. A re-roll from the peek row doesn't open it
  either, so the user can watch the item change.
- The canvas doesn't resize when the sheet is at half or full, which avoids a full re-layout on every drag frame.
  Instead, the camera target is nudged up by a quarter of the sheet height so the selected item stays visible.

### 7.3 View controls on phone

A vertical pill on the right edge, 12px above the sheet's current top. It moves with the sheet and hides at full. It
holds Reset camera and Screenshot. Fullscreen is hidden where `document.fullscreenEnabled` is false (iPhone) and shown
on Android.

### 7.4 Touch

- Tap selects, double-tap zooms, and double-tap on the floor resets (same as click / dblclick).
- OrbitControls defaults: one finger orbits, pinch zooms, two fingers pan.
- There's no shift+tap; the `‹` step-back button covers it.
- No long-press actions, because they clash with the browser's context menu on the canvas.
- In solo, the stepper pill sits under the header. Swiping left/right on the canvas doesn't step items, because it
  conflicts with orbit.

### 7.5 Loader on phone

Centred in the canvas area between the header and the sheet peek, max width `100% - 32px`.

---

## 8. Accessibility

- Every icon button has an `aria-label`; tooltips repeat the key.
- A `:focus-visible` ring everywhere: 2px `--focus` outline (today only the seed input has one).
- Hit targets: 32px for desktop icon buttons and 44px on phone (36px for re-roll buttons inside the sheet, with 8px
  spacing).
- Contrast: `--muted` on `--panel` over `--bg` is about 3.3:1. Use it only for labels and secondary text (11px uppercase
  or ≥ 13px), never for values.
- A live region announces the loader start and end and each re-roll (`Shape re-rolled, roll 2`).
- The canvas has `role="img"` and an `aria-label` that updates, e.g. `Grid of 225 tables, table 42 selected`.

---

## 9. Implementation notes for 3.1

- `index.html`: add the tokens, chip track markup in the header, the view-control pill, the stepper pill, a toast
  container, the help dialog and the `⋯` menu. Keep the single `<details id="panel">`. The phone styling is pure CSS
  (`@media (max-width: 639px)`) plus a small sheet controller for drag and detents (`src/app/sheet.js`).
- `toolbar.js`: grows the chip group (from `registry.list()`) and the `⋯` menu.
- New `src/app/keys.js` (the keyboard map in section 5) and `src/app/view.js` (view controls, screenshot, fullscreen,
  turntable).
- `main.js`: `onSolo` stops reloading the page; add `popstate`; apply the history policy in 6.2; add the loader delay
  and the singular solo text.
- `url.js`: no grammar change. The `pushState` / `replaceState` choice belongs at the call sites, not in `writeState`.
- Contract: make `plural` required in the furniture-kit skill and in each wave 1 spec.
- Snapshot tests: `view=single&anim=0` must stay deterministic, with no turntable, no flash and no loader-delay jitter.

---

## 10. Open decisions from plan/03

### 10.1 Ensemble view (wave 4): separate mode or grid layout option?

**Recommendation: a layout option of the grid.** An ensemble ("Dining set", "Living set") registers like a type and
gets a chip after a divider in the switcher. Each grid cell holds one composed set instead of one item, with a larger
`cell.spacing` and a smaller `gridSize` (e.g. 5 × 5). Selection, solo, the panel, the loader, re-rolls and the URL all
keep working, with two additions: the panel gets a second level (set → member), and the reroll grammar needs a member
qualifier. A separate mode earns its keep in **room mode** (doc 01, M6 stretch), which has free placement, walls and a
different camera.

Trade-off:

- *For the grid option:* one mental model ("pick a chip, browse a grid, pick one, roll its parts"). There's no second
  set of controls, URL, loader or screenshot code paths. Sets are directly comparable side by side, which is the whole
  point of DNA (same seed, many coherent sets).
- *Against:* sets are big, so a grid holds far fewer of them. Each cell is 5–9 items, so draw calls per cell rise
  (fine at 25 cells; budget it in 6.2). The panel gets deeper, and `r` needs an extension such as `3.m2.palette1`
  (member index as its own segment). Today's decoder would misread `m2` as a group called `m` rolled twice, so the
  grammar change needs a version marker or a distinct separator, and it has to keep old links valid. Free arrangement
  isn't possible in a grid; that's room mode's job.
- *For a separate mode:* free layout and a room-like camera from day one. *Against:* it duplicates the shell, splits
  the URL space, and makes "compare 25 dining sets from one seed" impossible without rebuilding the grid anyway.

### 10.2 Re-roll history: filmstrip, or counter with shift+click?

**Recommendation: the counter is enough for wave 1, with one change: show an explicit `‹` step-back button once the
count is above zero** (3.3). No filmstrip in 3.1.

Trade-off:

- Rolls are indexed, not recorded: roll n of a group is a pure function of `(itemSeed, group, n)`. So rolling forward
  never loses anything, and the "history" is just the integer the counter already shows. The `‹` button makes going
  back visible and touch-friendly; shift+click stays as a shortcut.
- A filmstrip would let you see several rolls side by side and jump straight to one. That has real value for colours,
  where a thumbnail is enough to judge the difference. But it costs one off-screen build and render per thumbnail
  (≈ 4ms build plus a render-to-texture each), a strip of UI that doesn't fit the phone sheet, and its own disposal
  and caching code.
- If it's built later, make it a **roll picker, not a history**. Because rolls are deterministic, it can show rolls
  ahead (n+1…n+4) as well as behind, which is more useful than replaying the past. It belongs in solo view, where
  there's room under the item, and only for the group the user last rolled. Keep it in the unscheduled nice-to-haves.
