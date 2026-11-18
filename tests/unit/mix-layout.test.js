import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../../src/furniture/registry.js';
import { packRows, verticalNeighbor } from '../../src/app/layout.js';
import { ALL_COUNT, createScene, pickType } from '../../src/app/mix.js';
import { decodeRerolls, readState, writeState } from '../../src/app/url.js';

const definitions = registry.list();

test('mixed pick is deterministic and covers every registered type', () => {
  const ids = [];
  for (let n = 1; n <= 200; n++) {
    const a = pickType('mix', n, definitions);
    assert.equal(pickType('mix', n, definitions), a);
    ids.push(a.id);
  }
  assert.deepEqual([...new Set(ids)].sort(), definitions.map((d) => d.id).sort());
  const other = Array.from({ length: 50 }, (_, i) => pickType('other', i + 1, definitions).id);
  assert.notDeepEqual(other, ids.slice(0, 50));
});

test('all scene resolves per item with its own seed namespace', () => {
  const scene = createScene('all', 'abc', definitions);
  assert.equal(scene.count, ALL_COUNT);
  const { definition, seed } = scene.resolve(7);
  assert.equal(seed, 'abc-all');
  assert.equal(definition, pickType('abc', 7, definitions));
  const chairs = createScene('chair', 'abc', definitions);
  assert.equal(chairs.count, registry.get('chair').cell.gridSize ** 2);
  assert.equal(chairs.resolve(3).seed, 'abc');
});

function sizesFor(seed, count) {
  return Array.from({ length: count }, (_, i) => {
    const d = pickType(seed, i + 1, definitions);
    const w = d.cell.spacing * (0.35 + 0.15 * ((i * 7) % 5));
    return { w, d: w * (0.6 + 0.1 * ((i * 3) % 5)) };
  });
}

test('packing never overlaps, is centred and deterministic', () => {
  const gap = 0.3;
  const sizes = sizesFor('pack', ALL_COUNT);
  const a = packRows(sizes, { gap });
  const b = packRows(sizes, { gap });
  assert.deepEqual(a, b);
  const boxes = sizes.map((s, i) => ({
    x0: a.positions[i].x - s.w / 2,
    x1: a.positions[i].x + s.w / 2,
    z0: a.positions[i].z - s.d / 2,
    z1: a.positions[i].z + s.d / 2,
  }));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const apart = boxes[i].x1 + gap - 1e-9 <= boxes[j].x0 || boxes[j].x1 + gap - 1e-9 <= boxes[i].x0 || boxes[i].z1 + gap - 1e-9 <= boxes[j].z0 || boxes[j].z1 + gap - 1e-9 <= boxes[i].z0;
      assert.ok(apart, `items ${i} and ${j} overlap`);
    }
  }
  const minX = Math.min(...boxes.map((x) => x.x0));
  const maxX = Math.max(...boxes.map((x) => x.x1));
  const minZ = Math.min(...boxes.map((x) => x.z0));
  const maxZ = Math.max(...boxes.map((x) => x.z1));
  assert.ok(Math.abs(minZ + maxZ) < 1e-6);
  assert.ok(Math.abs(a.width - (maxX - minX)) < 1e-6 || a.width >= maxX - minX - 1e-6);
  assert.ok(a.width / a.depth > 0.5 && a.width / a.depth < 2);
  assert.equal(a.rows.flat().length, ALL_COUNT);
});

test('growing one footprint and repacking still has no overlap', () => {
  const gap = 0.3;
  const sizes = sizesFor('grow', 60);
  sizes[10] = { w: 3.4, d: 1.6 };
  const { positions } = packRows(sizes, { gap });
  for (let i = 0; i < sizes.length; i++) {
    for (let j = i + 1; j < sizes.length; j++) {
      const dx = Math.abs(positions[i].x - positions[j].x) - (sizes[i].w + sizes[j].w) / 2;
      const dz = Math.abs(positions[i].z - positions[j].z) - (sizes[i].d + sizes[j].d) / 2;
      assert.ok(Math.max(dx, dz) >= gap - 1e-9);
    }
  }
});

test('vertical neighbour moves between rows by nearest x', () => {
  const sizes = sizesFor('nav', 40);
  const { rows, positions } = packRows(sizes);
  const first = rows[0][0];
  assert.equal(verticalNeighbor(rows, positions, first, -1), first);
  const down = verticalNeighbor(rows, positions, first, 1);
  assert.ok(rows[1].includes(down));
});

test('url round-trips type=all with rerolls', () => {
  const state = { type: 'all', seed: 'mix', item: 12, single: false, animate: true, rerolls: decodeRerolls('12.palette2~40.shape1') };
  const search = writeState(state);
  assert.match(search, /type=all/);
  assert.deepEqual(readState(search), state);
});
