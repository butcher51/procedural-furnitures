import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKit } from '../../src/core/kit.js';
import { buildItem, generateItem } from '../../src/core/item.js';
import { disposeObject } from '../../src/core/merge.js';
import * as registry from '../../src/furniture/registry.js';
import { geometryStats } from '../helpers/geometry-stats.js';
import { checkInvariants } from '../helpers/invariants.js';
import { formatFailures, sweep } from '../helpers/sweep.js';
import { strokeShape } from '../../src/furniture/bench/strokes.js';
import { Vector2 } from 'three';

const bench = registry.get('bench');
const params = (n, rerolls = {}) => generateItem(bench, 'bench-test', n, rerolls);
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const all = SEEDS.map((n) => params(n));

const inRange = (p, key, lo, hi) => assert.ok(p[key] >= lo - 1e-9 && p[key] <= hi + 1e-9, `${p.seed}: ${key} = ${p[key]} not in [${lo}, ${hi}]`);

test('determinism', () => {
  for (const n of SEEDS.slice(0, 200)) {
    assert.deepEqual(params(n), params(n));
    assert.deepEqual(params(n, { base: 2, palette: 1 }), params(n, { base: 2, palette: 1 }));
  }
});

test('style distribution within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(bench.styles)) {
    const share = all.filter((p) => p.style === style).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
});

test('shape and base ranges follow the spec table', () => {
  const ranges = {
    park: { seatLength: [1.2, 1.8], seatDepth: [0.4, 0.48], seatHeight: [0.42, 0.47], seatThickness: [0.025, 0.04] },
    garden: { seatLength: [1.0, 1.6], seatDepth: [0.4, 0.5], seatHeight: [0.42, 0.47], seatThickness: [0.025, 0.04] },
    plank: { seatLength: [1.0, 1.8], seatDepth: [0.28, 0.4], seatHeight: [0.42, 0.47], seatThickness: [0.045, 0.09] },
    platform: { seatLength: [1.2, 1.8], seatDepth: [0.4, 0.48], seatHeight: [0.34, 0.4], seatThickness: [0.022, 0.032] },
    upholstered: { seatLength: [0.9, 1.5], seatDepth: [0.36, 0.48], seatHeight: [0.42, 0.48], seatThickness: [0.08, 0.16] },
  };
  for (const p of all) {
    for (const [key, [lo, hi]] of Object.entries(ranges[p.style])) inRange(p, key, lo, hi);
    assert.ok(p.seatLength + (p.style === 'garden' && p.hasArms ? 2 * p.armWidth : 0) <= 1.95 + 1e-9, `${p.seed}: overall x`);
    assert.ok(p.seatHeight + p.backHeight * Math.cos((p.backAngle * Math.PI) / 180) <= 0.93 + 1e-9, `${p.seed}: back top`);
    if (p.style === 'platform') {
      assert.ok(p.seatSlatCount >= 12 && p.seatSlatCount <= 30);
      inRange(p, 'seatSlatCount', 12, 30);
    }
    if (p.style === 'upholstered') {
      assert.equal(p.hasArms, false);
      assert.ok(p.seatHeight - p.seatThickness - p.legHeight >= 0.08 - 1e-9, `${p.seed}: plinth`);
    }
    if (p.style === 'plank' || p.style === 'platform') assert.equal(p.hasBack, false);
    if (p.style === 'park' || p.style === 'garden') assert.equal(p.hasBack, true);
    if (p.hasStretcher) assert.ok(p.stretcherHeight <= 0.5 * p.legHeight + 1e-9, `${p.seed}: stretcher height`);
    if (p.legCount) assert.ok(p.legCount === 4 || p.legCount === 6);
    if (p.legCount === 6) assert.ok(p.seatLength >= 1.45);
    assert.ok(p.legInset <= 0.12 * p.seatLength + 1e-9);
  }
});

test('park benches are painted in about 20 percent of seeds', () => {
  const park = all.filter((p) => p.style === 'park');
  const share = park.filter((p) => p.seatMaterial === 'painted').length / park.length;
  assert.ok(Math.abs(share - 0.2) <= 0.06, `painted share ${share}`);
});

test('every style, support and notch appears', () => {
  const supports = new Set(all.map((p) => `${p.style}/${p.support}`));
  for (const key of ['park/scroll', 'park/angular', 'garden/legs', 'plank/staked', 'plank/slab', 'plank/trestle', 'platform/legs', 'upholstered/legs', 'upholstered/sled']) {
    assert.ok(supports.has(key), key);
  }
  assert.deepEqual(new Set(all.filter((p) => p.support === 'slab').map((p) => p.footNotch)), new Set(['v', 'arch', 'none']));
});

test('describe lists a row per group and swatches', () => {
  for (const n of SEEDS.slice(0, 100)) {
    const d = bench.describe(params(n));
    assert.deepEqual(d.sections.map((s) => s.group), ['style', 'shape', 'base', 'palette', 'pattern', 'finish']);
    assert.ok(d.swatches.length >= 2);
    for (const section of d.sections) assert.ok(section.rows.length > 0);
  }
});

test('strokeShape keeps floor strokes on the ground', () => {
  const shape = strokeShape([new Vector2(0.1, 0), new Vector2(0, 0.3)], 0.04, { floor: true });
  const points = shape.getPoints();
  assert.ok(Math.min(...points.map((p) => p.y)) >= 0);
});

test('geometry invariants, triangles and draw calls over 500 seeds', () => {
  const { failures } = sweep('bench', 500, checkInvariants);
  assert.equal(failures.length, 0, formatFailures(failures));
  const kit = createKit();
  const tris = [];
  for (let n = 1; n <= 500; n++) {
    const object = buildItem(bench, generateItem(bench, 'bench-budget', n), kit);
    const stats = geometryStats(object);
    tris.push(stats.triangles ?? stats.tris);
    assert.ok(object.children.length <= 4, `bench-budget #${n}: ${object.children.length} draws`);
    disposeObject(object);
  }
  tris.sort((a, b) => a - b);
  assert.ok(tris[Math.floor(tris.length * 0.95)] <= 6000, `p95 tris ${tris[Math.floor(tris.length * 0.95)]}`);
  assert.ok(tris[tris.length - 1] <= 6000, `max tris ${tris[tris.length - 1]}`);
});
