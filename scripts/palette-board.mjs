import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { hsl, pickWood, WOODS } from '../src/core/color.js';
import { createRng } from '../src/core/rng.js';
import { accentColor, colourIsCalm, fabricColor, harmoniousSecondary, HARMONY_MODES, paintColor } from '../src/core/palette.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.argv[2] ?? 'out/palette-board.png');
const seed = process.argv[3] ?? 'board';

const chip = (hex, label = '') =>
  `<div class="chip${colourIsCalm(hex) ? '' : ' loud'}" style="background:${hex}"><span>${label}</span></div>`;
const section = (title, body) => `<h2>${title}</h2><div class="row">${body}</div>`;

const moods = ['neutral', 'muted', 'bold'];
const fabrics = moods
  .map((mood) => {
    const r = createRng(`${seed}/fabric/${mood}`);
    return section(`fabricColor ${mood}`, Array.from({ length: 20 }, () => chip(fabricColor(r, { mood }).hex)).join(''));
  })
  .join('');

const paintRng = createRng(`${seed}/paint`);
const paints = section('paintColor', Array.from({ length: 40 }, () => {
  const p = paintColor(paintRng);
  return chip(p.hex, p.name);
}).join(''));

const woodRng = createRng(`${seed}/wood`);
const woods = section(
  'WOODS (base, then pickWood jitter)',
  WOODS.map((w) => chip(hsl(w.h, w.s, w.l), w.name)).join('') +
    Array.from({ length: 14 }, () => {
      const w = pickWood(woodRng);
      return chip(hsl(w.h, w.s, w.l), w.name);
    }).join('')
);

const pairRng = createRng(`${seed}/pairs`);
const pairs = section(
  'primary + harmoniousSecondary (stripes) + accentColor (dot)',
  Array.from({ length: 20 }, (_, i) => {
    const primary = fabricColor(pairRng, { mood: moods[i % 3] });
    const mode = HARMONY_MODES[i % HARMONY_MODES.length];
    const secondary = harmoniousSecondary(primary, mode);
    const accent = accentColor(pairRng, primary);
    const loud = [primary, secondary, accent].some((c) => !colourIsCalm(c.hex));
    return `<div class="pair${loud ? ' loud' : ''}" style="background:repeating-linear-gradient(90deg, ${primary.hex} 0 14px, ${secondary.hex} 14px 28px)"><i style="background:${accent.hex}"></i><span>${mode}</span></div>`;
  }).join('')
);

const html = `<!doctype html><html><head><style>
body { margin: 0; padding: 16px; background: #d9d6d0; font: 11px system-ui, sans-serif; color: #333; width: 1180px; }
h2 { font-size: 13px; margin: 14px 0 6px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { width: 52px; height: 52px; border-radius: 6px; position: relative; }
.chip span, .pair span { position: absolute; bottom: -1px; left: 2px; font-size: 9px; color: #fff; text-shadow: 0 0 2px #000; }
.pair { width: 110px; height: 70px; border-radius: 6px; position: relative; }
.pair i { position: absolute; right: 8px; top: 8px; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff4; }
.loud { outline: 3px solid red; }
</style></head><body>${fabrics}${paints}${woods}${pairs}</body></html>`;

await mkdir(dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1212, height: 400 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
