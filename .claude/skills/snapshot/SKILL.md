---
name: snapshot
description: Render a furniture type headless with Playwright and write a contact sheet PNG (one solo shot per item, labelled with its seed) plus an overview of the full grid. Use to look at generator output, for visual review, or to check the UI at desktop and phone widths.
---

# Snapshot

```bash
npm run snapshot -- --type chair --seed abc --count 48
```

Prints the PNG paths; `Read` them to look at the images.

| Option | Default | Meaning |
|---|---|---|
| `--type` | `chair` | Furniture type (`?type=`) |
| `--seed` | `snap` | Scene seed |
| `--count` | `48` | Items in the contact sheet |
| `--start` | `1` | First item number |
| `--cols` | `8` | Sheet columns |
| `--size` | `320` | Pixel size of each solo shot |
| `--name` | `<type>-<seed>` | Output file base name |
| `--out` | `out/snapshots` | Output folder (gitignored) |
| `--no-overview` | off | Skip the 1440×900 grid shot |
| `--phone` | off | Also shoot the grid at 390×844 |

Outputs `out/snapshots/<name>.png`, `<name>-overview.png`, optionally `<name>-phone.png`, and `<name>.json` with any page errors. Exit code 1 if the page threw.

## How it works

`scripts/snapshot.mjs` starts `server.js` on a free port and opens Chromium (SwiftShader, deterministic software GL). For each item it loads `?type=T&seed=S&view=single&anim=0&item=N`, waits for `html[data-ready]`, and captures the canvas. The shots are tiled into one sheet by rendering an HTML grid and screenshotting it.

The app contract it depends on: `view=single` (one item at the origin, fixed camera, panel hidden), `anim=0` (no pop), `item=N` (1-based), and `document.documentElement.dataset.ready` set once the scene is built.

## Notes

- First run needs `npx playwright install chromium`.
- three.js loads from the CDN via the importmap, so the machine needs network access.
- 48 items take about 2–3 minutes.
