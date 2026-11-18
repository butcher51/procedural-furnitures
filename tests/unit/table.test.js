import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKit } from '../../src/core/kit.js';
import { generateItem } from '../../src/core/item.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { STYLE_WEIGHTS } from '../../src/furniture/table/params.js';
import * as registry from '../../src/furniture/registry.js';
import { meshesOf } from '../helpers/invariants.js';

const table = registry.get('table');
const gen = (n, rerolls = {}) => generateItem(table, 'table-test', n, rerolls);
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const all = SEEDS.map((n) => gen(n));

test('table is registered with plural and cell', () => {
  assert.equal(table.plural, 'tables');
  assert.deepEqual(table.cell, { spacing: 2.3, gridSize: 9 });
});

test('same seed gives deep-equal params, same rerolls too', () => {
  for (const n of SEEDS.slice(0, 200)) {
    assert.deepEqual(gen(n), gen(n));
    assert.deepEqual(gen(n, { top: 2, finish: 1 }), gen(n, { top: 2, finish: 1 }));
  }
});

test('style distribution is within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(STYLE_WEIGHTS)) {
    const share = all.filter((p) => p.style === style).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
});

test('params respect the spec ranges', () => {
  const inRange = (p, key, lo, hi) => assert.ok(p[key] >= lo - 1e-9 && p[key] <= hi + 1e-9, `${p.seed} ${p.style}: ${key} ${p[key]} not in [${lo}, ${hi}]`);
  for (const p of all) {
    for (const [key, value] of Object.entries(p)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${p.seed}: ${key}`);
    inRange(p, 'topLength', 0.38, 2.0);
    inRange(p, 'topThickness', 0.018, 0.06);
    inRange(p, 'topEdge', 0.004, 0.02);
    assert.ok(Math.abs(p.legHeight - (p.topHeight - p.topThickness)) < 1e-9);
    if (p.style === 'dining') {
      inRange(p, 'topHeight', 0.72, 0.76);
      if (p.topShape !== 'round') inRange(p, 'topDepth', 0.8, 1.0);
      assert.equal(p.legCount, 4);
      assert.ok(p.topThickness >= 0.03);
      if (p.hasApron) assert.ok(p.legHeight - p.apronHeight >= 0.6 - 1e-9);
      else assert.ok(p.legThickness >= 0.06 - 1e-9);
      if (p.legProfile === 'turned') assert.ok(p.hasApron);
    }
    if (p.style === 'coffee') {
      assert.ok(p.topHeight <= 0.45 * p.topLength + 1e-9);
      inRange(p, 'topHeight', 0.3, 0.48);
    }
    if (p.style === 'side') {
      inRange(p, 'topHeight', 0.5, 0.6);
      assert.ok(p.topHeight >= p.topLength - 1e-9);
    }
    if (p.style === 'cafe') {
      assert.equal(p.baseKind, 'pedestal');
      assert.equal(p.legCount, 0);
      assert.ok(p.baseSpan <= Math.min(p.topLength, p.topDepth) - 0.02 + 1e-9);
      assert.ok(p.baseSpan >= 0.62 * Math.min(p.topLength, p.topDepth) - 0.021);
      if (p.heightClass === 'bar') {
        inRange(p, 'topHeight', 1.0, 1.07);
        assert.notEqual(p.pedestalBase, 'tripod');
      }
    }
    if (p.style === 'trestle') {
      assert.equal(p.baseKind, 'trestle');
      assert.equal(p.legCount, 0);
      inRange(p, 'trestleInset', 0.15, 0.35);
      assert.ok(p.trestleInset <= 0.2 * p.topLength + 1e-9);
      assert.ok(p.footLength <= 0.92 * p.topDepth + 1e-9 && p.footLength >= 0.78 * p.topDepth - 1e-9);
    }
    if (p.baseKind === 'legs') {
      assert.ok(p.legCount === 3 || p.legCount === 4);
      assert.ok(p.legSplay <= 0.14 * p.legHeight + 1e-9);
      if (p.hasShelf) assert.equal(p.stretcher, 'none');
      if (p.stretcher === 'h') assert.equal(p.legCount, 4);
    }
    assert.equal(p.woodName === null, !(p.topFinish === 'wood' || p.baseMode === 'wood'));
    assert.equal(p.stoneName === null, p.topFinish !== 'stone');
  }
});

test('palette applies only where something is painted', () => {
  const group = table.groups.find((g) => g.id === 'palette');
  for (const p of all.slice(0, 300)) {
    const painted = p.topFinish === 'painted' || p.baseMode === 'painted' || p.baseMode === 'accent';
    assert.equal(group.appliesTo(p), painted);
  }
});

test('describe lists sections per group and swatches', () => {
  const ids = new Set(table.groups.map((g) => g.id));
  for (const p of all.slice(0, 300)) {
    const { sections, swatches } = table.describe(p);
    assert.ok(swatches.length >= 2);
    for (const s of sections) {
      assert.ok(ids.has(s.group));
      assert.ok(s.rows.length > 0);
    }
    for (const id of ['style', 'top', 'base', 'finish']) assert.ok(sections.some((s) => s.group === id), `${p.seed}: no ${id} section`);
    assert.equal(sections.some((s) => s.group === 'palette'), table.groups.find((g) => g.id === 'palette').appliesTo(p));
  }
});

test('every style builds within the triangle and draw budgets', () => {
  const kit = createKit();
  const tris = [];
  const perStyle = {};
  for (const n of SEEDS.slice(0, 500)) {
    const p = gen(n);
    const object = mergeByMaterial(groupParts(table.build(p, kit)));
    const meshes = meshesOf(object);
    const count = meshes.reduce((sum, m) => sum + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
    assert.ok(meshes.length <= 4, `${p.seed}: ${meshes.length} draws`);
    assert.ok(count <= 6000, `${p.seed}: ${count} tris`);
    tris.push(count);
    (perStyle[p.style] ??= []).push(count);
    disposeObject(object);
  }
  tris.sort((a, b) => a - b);
  assert.ok(tris[Math.floor(tris.length * 0.95)] <= 4500);
  assert.deepEqual(Object.keys(perStyle).sort(), Object.keys(STYLE_WEIGHTS).sort());
});
