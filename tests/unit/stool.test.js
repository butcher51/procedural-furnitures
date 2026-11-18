import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKit } from '../../src/core/kit.js';
import { generateItem } from '../../src/core/item.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { hexToHsl } from '../../src/core/palette.js';
import * as registry from '../../src/furniture/registry.js';
import { geometryStats } from '../helpers/geometry-stats.js';
import { checkInvariants } from '../helpers/invariants.js';
import { excuseKnownBad, loadRegressions } from '../helpers/regressions.js';
import { formatFailures, sweep } from '../helpers/sweep.js';

const stool = registry.get('stool');
const SCENE = 'stool-unit';
const SEEDS = 2000;
const numbers = Array.from({ length: SEEDS }, (_, i) => i + 1);
const params = (n, rerolls = {}) => generateItem(stool, SCENE, n, rerolls);
const all = numbers.map((n) => params(n));

const RANGES = {
  bar: { seatHeight: [0.72, 0.8], seatWidth: [0.34, 0.44], seatThickness: [0.03, 0.06], legThickness: [0.032, 0.05], legTaper: [0.6, 1] },
  counter: { seatHeight: [0.6, 0.68], seatWidth: [0.36, 0.46], seatThickness: [0.03, 0.06], legThickness: [0.03, 0.05], legTaper: [0.7, 1] },
  diner: { seatHeight: [0.6, 0.8], seatWidth: [0.36, 0.44], seatThickness: [0.02, 0.035], columnRadius: [0.022, 0.035], baseRadius: [0.19, 0.26], hubRadius: [0.06, 0.1] },
  milking: { seatHeight: [0.26, 0.45], seatWidth: [0.24, 0.36], seatThickness: [0.04, 0.07], legThickness: [0.035, 0.055], legTaper: [0.55, 0.85] },
  drum: { seatHeight: [0.38, 0.46], seatWidth: [0.36, 0.5], drumWaist: [0.65, 1] },
  slab: { seatHeight: [0.22, 0.46], seatWidth: [0.4, 0.6], seatDepth: [0.24, 0.34], seatThickness: [0.025, 0.045], slabThickness: [0.02, 0.04], slabInset: [0.02, 0.08] },
};

test('same seed gives deep-equal params and finite numbers', () => {
  for (const n of numbers.slice(0, 300)) {
    const a = params(n);
    assert.deepStrictEqual(a, params(n));
    assert.deepStrictEqual(a, JSON.parse(JSON.stringify(a)));
    assert.equal(a.type, 'stool');
    for (const [key, value] of Object.entries(a)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key} = ${value}`);
  }
});

test('same seed and rerolls give the same params', () => {
  const rerolls = { shape: 2, footrest: 1, palette: 3, style: 1 };
  for (const n of numbers.slice(0, 200)) assert.deepStrictEqual(params(n, rerolls), params(n, { ...rerolls }));
});

test('params stay inside the spec ranges', () => {
  for (const p of all) {
    for (const [field, [lo, hi]] of Object.entries(RANGES[p.style])) {
      assert.ok(p[field] >= lo - 1e-9 && p[field] <= hi + 1e-9, `${p.seed} ${p.style}.${field} = ${p[field]}`);
    }
    if (p.legCount) {
      assert.ok(p.legCount >= 3 && p.legCount <= 4, `${p.seed} legCount ${p.legCount}`);
      assert.ok(p.legSplay <= 0.35 * p.legHeight + 1e-9, `${p.seed} legSplay ${p.legSplay} > 0.35 * ${p.legHeight}`);
    }
    if (p.style === 'milking' || p.style === 'drum') assert.equal(p.footrestKind, 'none');
    if (p.footrestKind === 'perimeter' || p.footrestKind === 'h') assert.equal(p.legCount, 4);
    if (p.footrestKind !== 'none' && p.footrestKind !== 'stretcher' && p.footrestKind !== 'pedestalRing') {
      assert.ok(p.footrestHeight >= 0.17 - 1e-9 && p.footrestHeight <= p.legHeight - 0.15 + 1e-9, `${p.seed} footrestHeight ${p.footrestHeight}`);
    }
    if (p.style === 'diner') assert.ok(p.baseRadius >= 0.24 * p.seatHeight);
    if (p.drumProfile === 'barrel') assert.ok(p.drumWaist >= 0.8);
    if (p.footrestKind === 'pedestalRing') {
      assert.ok(p.pedestalRingRadius >= p.columnRadius * 1.6 + 0.1 - 1e-9 && p.pedestalRingRadius <= p.seatWidth / 2 + 0.03 + 1e-9);
    }
  }
});

test('style distribution is within 4 pp of the weights', () => {
  const counts = {};
  for (const p of all) counts[p.style] = (counts[p.style] ?? 0) + 1;
  for (const [style, weight] of Object.entries(stool.styles)) {
    assert.ok(Math.abs((counts[style] ?? 0) / SEEDS - weight) <= 0.04, `${style}: ${(counts[style] ?? 0) / SEEDS} vs ${weight}`);
  }
});

test('every style, support and footrest variant appears', () => {
  const seen = (fn) => new Set(all.map(fn));
  assert.equal(seen((p) => p.style).size, 6);
  assert.deepEqual([...seen((p) => p.footrestKind)].sort(), ['h', 'none', 'pedestalRing', 'perimeter', 'ring', 'stretcher']);
  assert.deepEqual([...seen((p) => p.drumProfile)].sort(), ['barrel', 'none', 'spool', 'straight']);
  assert.deepEqual([...seen((p) => p.slabCutout)].sort(), ['arch', 'none', 'notch']);
});

test('footrest resolves against the current shape after any re-roll', () => {
  for (const n of numbers.slice(0, 400)) {
    for (const rerolls of [{ shape: 1 }, { shape: 3, footrest: 1 }, { style: 2, shape: 1 }, { style: 1, footrest: 2 }]) {
      const p = params(n, rerolls);
      if (p.footrestKind === 'perimeter' || p.footrestKind === 'h') assert.equal(p.legCount, 4, `${p.seed} ${JSON.stringify(rerolls)}`);
      if (p.style === 'milking' || p.style === 'drum') assert.equal(p.footrestKind, 'none');
      if (p.footrestKind !== 'none') assert.ok(p.footrestRadius > 0);
    }
  }
});

test('style re-roll always changes the style and cycles through all of them', () => {
  for (const n of numbers.slice(0, 100)) {
    const base = params(n).style;
    assert.notEqual(params(n, { style: 1 }).style, base);
    const seen = new Set([base]);
    for (let k = 1; k <= 5; k++) seen.add(params(n, { style: k }).style);
    assert.equal(seen.size, 6);
  }
});

test('describe lists a row for every group section and a plural is set', () => {
  assert.equal(stool.plural, 'stools');
  for (const p of all.slice(0, 300)) {
    const d = stool.describe(p);
    const groups = d.sections.map((s) => s.group);
    for (const g of ['style', 'shape', 'footrest', 'palette']) assert.ok(groups.includes(g), `${p.seed} missing ${g}`);
    if (!(p.style === 'drum' && p.drumBase === 'floor')) assert.ok(groups.includes('finish'), `${p.seed} missing finish`);
    for (const s of d.sections) {
      assert.ok(stool.groups.some((g) => g.id === s.group));
      assert.ok(s.rows.length > 0);
      for (const [label, value] of s.rows) assert.ok(label && (typeof value === 'string' ? value.length > 0 : Array.isArray(value.swatches)), `${p.seed} ${label}`);
    }
    assert.ok(d.swatches.length >= 2);
    assert.ok(!JSON.stringify(d).includes('undefined') && !JSON.stringify(d).includes('NaN'), `${p.seed} describe has undefined/NaN`);
  }
});

test('geometry invariants hold over 500 seeds and budgets are met', () => {
  const triangles = [];
  let maxDraws = 0;
  const { failures } = sweep('stool', 500, (context) => {
    const stats = geometryStats(context.object);
    triangles.push(stats.triangles);
    maxDraws = Math.max(maxDraws, stats.drawCalls);
    return checkInvariants(context);
  });
  const unexpected = excuseKnownBad(failures, loadRegressions('stool'));
  assert.equal(unexpected.length, 0, formatFailures(unexpected));
  triangles.sort((a, b) => a - b);
  assert.ok(triangles[Math.floor(triangles.length * 0.95)] <= 6000, `p95 tris ${triangles[Math.floor(triangles.length * 0.95)]}`);
  assert.ok(triangles.at(-1) <= 6000, `max tris ${triangles.at(-1)}`);
  assert.ok(maxDraws <= 4, `draw calls ${maxDraws}`);
});

test('cushion patterns come from the shader pool with the weighted mix and wood carries grain', () => {
  const kinds = {};
  for (const p of all) {
    const label = p.pattern === 'none' ? 'none' : p.pattern.kind === 'linen' ? p.pattern.texture : p.pattern.kind;
    kinds[label] = (kinds[label] ?? 0) + 1;
    if (p.woodName) assert.ok(['fine', 'plain', 'bold'].includes(p.grain), `${p.seed} grain ${p.grain}`);
    else assert.equal(p.grain, 'none');
  }
  assert.deepEqual(Object.keys(kinds).sort(), ['boucle', 'dots', 'floral', 'gingham', 'herringbone', 'linen', 'none', 'ticking']);
  assert.ok(kinds.linen + kinds.none + kinds.boucle > 0.5 * SEEDS, 'plain fabrics stay most common');
  assert.ok(kinds.dots + kinds.floral + kinds.gingham + kinds.ticking + kinds.herringbone < 0.45 * SEEDS, 'loud patterns stay a minority');
});

test('pattern re-roll changes only the pattern field', () => {
  for (const n of numbers.slice(0, 100)) {
    const a = params(n);
    const b = params(n, { pattern: 1 });
    for (const key of Object.keys(a)) if (key !== 'pattern') assert.deepStrictEqual(a[key], b[key], `${n} ${key}`);
  }
});

test('build is pure and releases its textures', () => {
  const kit = createKit();
  for (const n of numbers.slice(0, 60)) {
    const p = params(n);
    const a = geometryStats(mergeByMaterial(groupParts(stool.build(p, kit))));
    const object = mergeByMaterial(groupParts(stool.build(p, kit)));
    assert.equal(geometryStats(object).checksum, a.checksum);
    disposeObject(object);
  }
});

test('floral spacing shrinks on small seats and dark cushions never get a darker pattern colour', () => {
  let florals = 0;
  for (let n = 1; n <= 800; n++) {
    const p = params(n);
    if (p.pattern !== 'none' && p.pattern.kind === 'floral') {
      florals++;
      assert.ok(p.pattern.spacing <= 0.14 * Math.min(1, Math.max(0.6, p.seatWidth / 0.55)) + 1e-9, `#${n}`);
    }
    const base = hexToHsl(p.cushionColor);
    if (base.l < 0.42) assert.ok(hexToHsl(p.cushionSecondary).l > base.l - 0.05, `#${n}`);
  }
  assert.ok(florals > 10);
});
