import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateItem } from '../../src/core/item.js';
import { createKit } from '../../src/core/kit.js';
import { groupParts, mergeByMaterial, disposeObject } from '../../src/core/merge.js';
import sofa from '../../src/furniture/sofa/index.js';
import { usableSeatDepth } from '../../src/furniture/sofa/params.js';

const SEEDS = 2000;
const items = Array.from({ length: SEEDS }, (_, i) => generateItem(sofa, 'sofa-unit', i + 1));
const within = (v, lo, hi) => v >= lo - 1e-9 && v <= hi + 1e-9;
const byStyle = (style) => items.filter((p) => p.style === style);

const WIDTH = { sofa: [1.75, 2.3], loveseat: [1.3, 1.65], midcentury: [1.6, 2.1], chaise: [1.5, 1.8], sectional: [2.2, 2.55] };

test('sofa: same seed gives deep-equal params and JSON-safe data', () => {
  for (let n = 1; n <= 50; n++) {
    const a = generateItem(sofa, 'sofa-det', n);
    assert.deepStrictEqual(a, generateItem(sofa, 'sofa-det', n));
    assert.deepStrictEqual(a, JSON.parse(JSON.stringify(a)));
    const rerolls = { shape: 2, legs: 1 };
    assert.deepStrictEqual(generateItem(sofa, 'sofa-det', n, rerolls), generateItem(sofa, 'sofa-det', n, { ...rerolls }));
  }
});

test('sofa: style distribution is within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(sofa.styles)) {
    const share = byStyle(style).length / SEEDS;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
});

test('sofa: all five styles occur', () => {
  for (const style of Object.keys(sofa.styles)) assert.ok(byStyle(style).length > 0, style);
});

test('sofa: shape params stay in the spec ranges', () => {
  for (const p of items) {
    assert.ok(within(p.width, ...WIDTH[p.style]), `${p.seed} width ${p.width}`);
    assert.ok(within(p.seatHeight, 0.38, 0.46), `${p.seed} seatHeight`);
    assert.ok(p.backTop >= p.seatHeight + p.armRise + 0.08 - 1e-9, `${p.seed} backTop`);
    assert.ok(within(p.armRise, 0, 0.28));
    assert.ok(p.innerSpan > 0.8, `${p.seed} innerSpan`);
    if (p.style === 'chaise') {
      assert.equal(p.armStyle, 'none');
      assert.equal(p.backMode, 'tight');
      assert.ok(p.headHeight >= p.seatHeight + 0.25 - 1e-9);
      assert.ok(p.headLength - (p.headHeight - 0.02) * Math.tan((p.headIncline * Math.PI) / 180) >= 0.07 - 1e-6, `${p.seed} head top thickness`);
    }
    if (p.style === 'sectional') {
      assert.ok(p.returnLength >= p.depth + 0.5 - 1e-9 && p.returnLength <= 1.9 + 1e-9);
      assert.ok(p.returnWidth <= p.innerSpan - 1.0 + 1e-9 && p.returnWidth >= 0.7);
    } else {
      assert.equal(p.returnSide, null);
    }
  }
});

test('sofa: cushion and leg clamps hold', () => {
  for (const p of items) {
    assert.ok(p.seatCushionCount >= 1 && p.seatCushionCount <= Math.max(1, Math.floor(p.innerSpan / 0.45)));
    assert.ok(p.backCushionCount <= 4);
    if (p.backMode === 'tight') assert.equal(p.backCushionCount, 0);
    else assert.ok(p.backCushionCount >= 1);
    assert.ok(usableSeatDepth(p) >= 0.45 - 1e-9, `${p.seed} usable depth ${usableSeatDepth(p)}`);
    const bodyH = p.seatHeight - p.seatThickness - p.legHeight;
    assert.ok(bodyH >= 0.08 - 1e-9, `${p.seed} bodyH ${bodyH}`);
    assert.ok(p.legSplay <= 0.35 * p.legHeight + 1e-9);
    assert.equal(p.legCount, p.legStyle === 'sled' ? 2 : p.legStyle === 'plinth' ? 0 : p.legCount);
    if (p.style === 'midcentury') assert.ok(['tapered', 'sled'].includes(p.legStyle));
    if (p.legStyle === 'sled') assert.ok(['metal', 'black'].includes(p.frameMode));
  }
});

test('sofa: describe lists a row per group with swatches', () => {
  for (const p of items.slice(0, 200)) {
    const d = sofa.describe(p);
    assert.deepStrictEqual(d.sections.map((s) => s.group), sofa.groups.map((g) => g.id));
    for (const section of d.sections) assert.ok(section.rows.length > 0);
    assert.ok(d.swatches.length >= 1);
  }
});

test('sofa: triangle and draw-call budgets over 500 seeds', () => {
  const kit = createKit();
  const tris = [];
  const perStyle = {};
  for (let n = 1; n <= 500; n++) {
    const p = generateItem(sofa, 'sofa-budget', n);
    const object = mergeByMaterial(groupParts(sofa.build(p, kit)));
    let count = 0;
    let draws = 0;
    object.traverse((o) => {
      if (o.isMesh) {
        draws++;
        count += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      }
    });
    assert.ok(draws <= 4, `${p.seed} draws ${draws}`);
    assert.ok(count <= 6000, `${p.seed} tris ${count}`);
    tris.push(count);
    (perStyle[p.style] ??= []).push(count);
    disposeObject(object);
  }
  tris.sort((a, b) => a - b);
  assert.ok(tris[Math.floor(tris.length * 0.95)] <= 6000);
});
