import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hsl, pickWood, WOODS, WOOD_TONES } from '../../src/core/color.js';
import { createRng } from '../../src/core/rng.js';
import {
  accentColor,
  capSaturation,
  chromaLimit,
  colourIsCalm,
  fabricColor,
  FABRIC_MOODS,
  harmoniousSecondary,
  HARMONY_MODES,
  hexToHsl,
  LIGHTNESS_BOUNDS,
  muted,
  oklch,
  paintColor,
  PAINTS,
  shade,
  swatch,
} from '../../src/core/palette.js';

const REVIEW_NEON = ['#4dcb51', '#c8cb4d', '#4da9cb', '#4d66cb', '#27c96d', '#5438bd', '#3b55ce', '#54d9c4', '#b92a5c', '#d745d0', '#b02dad', '#41b32f', '#d64ea7', '#5b8ada', '#9ea736'];
const CALM = ['#2a2a2c', '#efefea', '#a7abb0', '#f4f1ea', '#967b95', '#682b27', '#cfa759'];

test('oklch matches reference values', () => {
  const white = oklch('#ffffff');
  assert.ok(Math.abs(white.L - 1) < 1e-3 && white.C < 1e-3);
  const red = oklch('#ff0000');
  assert.ok(Math.abs(red.L - 0.628) < 2e-3 && Math.abs(red.C - 0.2577) < 2e-3 && Math.abs(red.H - 29.23) < 0.5);
});

test('colourIsCalm rejects the reviewed neon colours and accepts neutrals and frame colours', () => {
  for (const hex of REVIEW_NEON) assert.equal(colourIsCalm(hex), false, hex);
  for (const hex of CALM) assert.equal(colourIsCalm(hex), true, hex);
});

test('chromaLimit is tighter for green, cyan, blue and violet than for earth tones', () => {
  for (const loud of [140, 200, 265, 300]) assert.ok(chromaLimit(loud) < chromaLimit(60), String(loud));
  assert.equal(chromaLimit(0), chromaLimit(360));
});

test('capSaturation always returns a calm colour inside the lightness bounds and keeps calm input', () => {
  const r = createRng('cap');
  for (let i = 0; i < 2000; i++) {
    const c = capSaturation(r.next(), r.next(), r.next());
    assert.ok(colourIsCalm(c.hex), c.hex);
    assert.ok(c.l >= LIGHTNESS_BOUNDS[0] && c.l <= LIGHTNESS_BOUNDS[1]);
    assert.equal(c.hex, hsl(c.h, c.s, c.l));
  }
  assert.equal(capSaturation(0.08, 0.1, 0.5).s, 0.1);
  assert.equal(muted(0.33, 0.9, 0.5), capSaturation(0.33, 0.9, 0.5).hex);
  assert.ok(capSaturation(0.33, 0.9, 0.5).s < capSaturation(0.05, 0.9, 0.5).s);
});

test('pickers draw a fixed number of values and only return calm colours', () => {
  for (const [name, fn, draws] of [
    ['fabric', (r) => fabricColor(r, { mood: 'bold' }), 3],
    ['paint', (r) => paintColor(r), 3],
    ['accent', (r) => accentColor(r, { h: 0.3, s: 0.5, l: 0.5 }), 3],
  ]) {
    const a = createRng(name);
    const b = createRng(name);
    for (let i = 0; i < 300; i++) {
      const c = fn(a);
      for (let k = 0; k < draws; k++) b.next();
      assert.ok(colourIsCalm(c.hex), `${name} ${c.hex}`);
    }
    assert.equal(a.next(), b.next(), `${name} draws ${draws}`);
  }
});

test('fabricColor respects the mood bands and paintColor names a curated paint', () => {
  const r = createRng('moods');
  for (const mood of Object.keys(FABRIC_MOODS)) {
    const band = FABRIC_MOODS[mood];
    for (let i = 0; i < 200; i++) {
      const c = fabricColor(r, { mood });
      assert.ok(c.s <= band.s[1] + 1e-9 && c.l >= band.l[0] - 1e-9 && c.l <= band.l[1] + 1e-9, `${mood} ${c.hex}`);
    }
  }
  const names = new Set(PAINTS.map((p) => p.name));
  for (let i = 0; i < 200; i++) assert.ok(names.has(paintColor(r).name));
});

test('harmoniousSecondary is calm, pure and keeps the complement in the primary band', () => {
  const r = createRng('harmony');
  for (let i = 0; i < 300; i++) {
    const primary = fabricColor(r, { mood: ['neutral', 'muted', 'bold'][i % 3] });
    for (const mode of HARMONY_MODES) {
      const c = harmoniousSecondary(primary, mode);
      assert.ok(colourIsCalm(c.hex), `${mode} ${c.hex}`);
      assert.deepEqual(harmoniousSecondary(primary, mode), c);
    }
    assert.ok(harmoniousSecondary(primary, 'complement').s <= Math.max(primary.s * 0.9, 0.06) + 1e-9);
  }
  assert.ok(harmoniousSecondary({ h: 0.8, s: 0.1, l: 0.6 }, 'complement').s <= 0.09 + 1e-9);
});

test('shade and swatch round-trip and stay calm', () => {
  const base = swatch(hsl(0.6, 0.3, 0.5));
  assert.ok(Math.abs(base.h - 0.6) < 0.01 && Math.abs(base.s - 0.3) < 0.01 && Math.abs(base.l - 0.5) < 0.01);
  const darker = shade(base, -0.12, 0.85);
  assert.ok(darker.l < base.l && colourIsCalm(darker.hex));
  assert.equal(hexToHsl('#808080').s, 0);
});

test('WOODS keep the WOOD_TONES names and order, are calmer, and pickWood draws 3 values', () => {
  assert.deepEqual(WOODS.map((w) => w.name), WOOD_TONES.map((w) => w.name));
  for (let i = 0; i < WOODS.length; i++) assert.ok(WOODS[i].s < WOOD_TONES[i].s);
  const a = createRng('wood');
  const b = createRng('wood');
  for (let i = 0; i < 200; i++) {
    const w = pickWood(a);
    b.next();
    b.next();
    b.next();
    for (const dl of [-0.04, 0, 0.04]) assert.ok(colourIsCalm(hsl(w.h, w.s, w.l + dl)), w.name);
  }
  assert.equal(a.next(), b.next());
});

test('frozen chair colour helpers are unchanged', () => {
  assert.deepEqual(WOOD_TONES[2], { name: 'cherry', h: 0.03, s: 0.5, l: 0.4 });
});
