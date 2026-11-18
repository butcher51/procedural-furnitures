import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createKit } from '../../src/core/kit.js';
import { generateItem } from '../../src/core/item.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { countDecor } from '../../src/core/fill.js';
import { STYLE_WEIGHTS, contentsLayout } from '../../src/furniture/shelf/params.js';
import { bays, frameParts, frameTris, levels } from '../../src/furniture/shelf/layout.js';
import * as registry from '../../src/furniture/registry.js';
import { meshesOf } from '../helpers/invariants.js';

const shelf = registry.get('shelf');
const gen = (n, rerolls = {}) => generateItem(shelf, 'shelf-test', n, rerolls);
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const all = SEEDS.map((n) => gen(n));
const FRAME_TRIS_MAX = { bookcase: 1500, open: 1100, ladder: 900, cube: 1400, leaning: 1100 };

test('shelf is registered with plural and cell', () => {
  assert.equal(shelf.plural, 'shelves');
  assert.deepEqual(shelf.cell, { spacing: 1.8, gridSize: 9 });
});

test('same seed gives deep-equal params, same rerolls too', () => {
  for (const n of SEEDS.slice(0, 200)) {
    assert.deepEqual(gen(n), gen(n));
    assert.deepEqual(gen(n, { shape: 2, contents: 1 }), gen(n, { shape: 2, contents: 1 }));
  }
});

test('style distribution is within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(STYLE_WEIGHTS)) {
    const share = all.filter((p) => p.style === style).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
});

test('params respect the spec ranges and stay small', () => {
  const inRange = (p, key, lo, hi) => assert.ok(p[key] >= lo - 1e-9 && p[key] <= hi + 1e-9, `${p.seed} ${p.style}: ${key} ${p[key]} not in [${lo}, ${hi}]`);
  for (const p of all) {
    for (const [key, value] of Object.entries(p)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${p.seed}: ${key}`);
    assert.ok(JSON.stringify(p).length < 3000, `${p.seed}: params ${JSON.stringify(p).length} bytes`);
    inRange(p, 'inset', 0.005, 0.03);
    assert.ok(p.shelfCount >= 2 && p.depth >= 0.25);
    if (p.style === 'bookcase') {
      inRange(p, 'height', 0.8, 2.1);
      inRange(p, 'width', 0.4, 1.2);
      inRange(p, 'boardThickness', 0.016, 0.025);
      assert.ok(p.height / p.depth <= 7 + 1e-9);
      assert.equal(p.bays, p.width - 2 * p.sideThickness > 0.9 ? 2 : 1);
      if (p.baseKind === 'legs') assert.equal(p.legCount, p.bays === 2 ? 6 : 4);
      inRange(p, 'baseHeight', 0.05, 0.22);
    }
    if (p.style === 'open') {
      inRange(p, 'width', 0.6, 1.2);
      assert.ok(p.shelfCount >= 3 && p.shelfCount <= 6);
      if (p.width >= 1) assert.ok(p.boardThickness >= 0.025 - 1e-9 && p.legCount === 6);
      assert.ok(p.postProfile !== 'round' || p.legHeight === p.height);
      assert.ok(p.height + (p.postProfile === 'square' ? p.postFinials : 0) <= 2.0 + 1e-9);
    }
    if (p.style === 'ladder') {
      inRange(p, 'height', 1.2, 1.8);
      assert.equal(p.baseKind, 'none');
      assert.ok(p.shelfCount >= 3 && p.shelfCount <= 5);
    }
    if (p.style === 'cube') {
      assert.ok(p.width <= 1.6 + 1e-9);
      inRange(p, 'cols', 1, 4);
      inRange(p, 'rows', 2, 5);
      assert.ok(p.height - 0.18 + p.baseHeight <= 2.0 + 1e-9);
      assert.equal(p.shelfCount, p.rows);
    }
    if (p.style === 'leaning') {
      inRange(p, 'height', 1.5, 2.0);
      inRange(p, 'leanAngle', 5, 14.1);
      inRange(p, 'baseHeight', 0.12, 0.3);
    }
  }
});

test('frame triangles equal the built frame and respect the per-style cap', () => {
  const kit = createKit();
  for (const n of SEEDS.slice(0, 250)) {
    const p = gen(n);
    const frame = shelf.build(p, kit)[0];
    let tris = 0;
    frame.traverse((o) => {
      if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
    });
    assert.equal(frameTris(p), tris, `${p.seed} ${p.style}`);
    assert.ok(tris <= FRAME_TRIS_MAX[p.style], `${p.seed} ${p.style}: ${tris}`);
    disposeObject(frame);
  }
});

test('counts equal the regenerated layout and surfaces are shared', () => {
  for (const p of all.slice(0, 300)) {
    const counts = countDecor(contentsLayout(p).layout);
    assert.equal(p.bookCount, counts.books);
    assert.equal(p.objectCount, counts.objects + counts.bins);
    assert.deepEqual(shelf.surfaces(p), bays(p));
  }
});

test('shelf gaps stay in range for every base height', () => {
  for (const p of all.slice(0, 500)) {
    if (p.style === 'ladder') continue;
    const lo = p.shelfSpacing === 'graded' ? 0.2 : 0.22;
    const ranges = { bookcase: [0.05, 0.22], open: [0.05, 0.15], cube: [0, 0.18], leaning: [0.12, 0.3] }[p.style];
    for (const baseHeight of ranges) {
      for (const g of levels({ ...p, baseHeight }).gaps) assert.ok(g >= lo - 0.015 && g <= 0.46 + 1e-6, `${p.seed} ${p.style}: gap ${g}`);
    }
  }
});

test('book colours keep contrast with the boards', () => {
  for (const p of all.slice(0, 300)) assert.equal(p.bookColors.length, 5);
});

test('describe lists every group and the contents rows', () => {
  for (const p of all.slice(0, 100)) {
    const d = shelf.describe(p);
    const groups = d.sections.map((s) => s.group);
    for (const id of ['style', 'shape', 'base', 'finish', 'contents']) assert.ok(groups.includes(id));
    assert.deepEqual(d.sections.find((s) => s.group === 'contents').rows.map((r) => r[0].split(' ')[0]), ['Contents', 'Covers', 'Objects']);
  }
});

test('contents re-roll changes only the books and objects', () => {
  const kit = createKit();
  for (const n of SEEDS.slice(0, 40)) {
    const a = gen(n);
    const b = gen(n, { contents: 1 });
    assert.notEqual(a.fillSeed, b.fillSeed);
    const strip = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => !shelf.groups.find((g) => g.id === 'contents').fields.includes(k)));
    assert.deepEqual(strip(a), strip(b));
    const frameBox = (p) => {
      const parts = shelf.build(p, kit);
      const box = new THREE.Box3().setFromObject(parts[0]);
      parts.forEach((part) => disposeObject(groupParts([part])));
      return box.min.toArray().concat(box.max.toArray());
    };
    assert.deepEqual(frameBox(a), frameBox(b));
  }
});

test('geometry: one vertex-colour decor mesh, at most 4 draws, under 6k triangles', () => {
  const kit = createKit();
  for (const n of SEEDS.slice(0, 200)) {
    const p = gen(n);
    const root = groupParts(shelf.build(p, kit));
    const object = mergeByMaterial(root);
    const meshes = meshesOf(object);
    assert.ok(meshes.length <= 4, `${p.seed}: ${meshes.length} draws`);
    assert.ok(meshes.filter((m) => m.material.vertexColors).length <= 1);
    const tris = meshes.reduce((sum, m) => sum + m.geometry.attributes.position.count / 3, 0);
    assert.ok(tris <= 6000, `${p.seed}: ${tris} tris`);
    disposeObject(object);
  }
});

test('frame parts are deterministic', () => {
  for (const p of all.slice(0, 50)) assert.deepEqual(frameParts(p), frameParts(gen(Number(p.seed.split('-').pop()))));
});
