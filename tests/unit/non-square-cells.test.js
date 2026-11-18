import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { cellCenter } from '../../src/app/layout.js';
import { createScene, pickType } from '../../src/app/mix.js';
import { stepIndex } from '../../src/app/nav.js';
import { fitsCell } from '../helpers/invariants.js';

const fake = (id, mixWeight, cell = { spacing: 2, gridSize: 3 }) => ({ id, label: id, cell, ...(mixWeight === undefined ? {} : { mixWeight }) });

test('cell centres use spacing in x and spacingZ in z, centred on the origin', () => {
  const size = 5;
  const center = (size - 1) / 2;
  const centres = Array.from({ length: size * size }, (_, n) => cellCenter(Math.floor(n / size), n % size, center, 2.3, 1.5));
  assert.deepEqual(centres[12], { x: 0, z: 0 });
  assert.equal(centres[1].x - centres[0].x, 2.3);
  assert.ok(Math.abs(centres[size].z - centres[0].z - 1.5) < 1e-9);
  assert.ok(Math.abs(centres[size * size - 1].x - 2 * 2.3) < 1e-9);
  assert.ok(Math.abs(centres[size * size - 1].z - 2 * 1.5) < 1e-9);
  assert.deepEqual(cellCenter(0, 4, 2, 2), { x: 4, z: -4 });
});

test('scene carries spacingZ and defaults it to spacing', () => {
  const square = fake('sq', undefined, { spacing: 1.8, gridSize: 4 });
  const wide = fake('wide', undefined, { spacing: 2.3, spacingZ: 1.5, gridSize: 4 });
  assert.equal(createScene('sq', 's', [square, wide]).spacingZ, 1.8);
  const scene = createScene('wide', 's', [square, wide]);
  assert.deepEqual([scene.spacing, scene.spacingZ], [2.3, 1.5]);
  const all = createScene('all', 's', [square, wide]);
  assert.equal(all.spacingZ, all.spacing);
});

test('keyboard stepping stays row-major on non-square grids', () => {
  const opts = { count: 25, gridSize: 5 };
  assert.equal(stepIndex(12, 'ArrowUp', opts), 7);
  assert.equal(stepIndex(12, 'ArrowDown', opts), 17);
  assert.equal(stepIndex(2, 'ArrowUp', opts), 2);
  assert.equal(stepIndex(22, 'ArrowDown', opts), 22);
});

test('fits-cell checks x against spacing and z against spacingZ', () => {
  const cell = { spacing: 2.3, spacingZ: 1.5, gridSize: 9 };
  const box = (x, z) => new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 1, z));
  assert.deepEqual(fitsCell(box(2.0, 1.3), cell, 't'), []);
  assert.equal(fitsCell(box(2.0, 1.45), cell, 't').length, 1);
  assert.match(fitsCell(box(2.0, 1.45), cell, 't')[0], /z extent/);
  assert.match(fitsCell(box(2.25, 0.5), cell, 't')[0], /x extent/);
  assert.deepEqual(fitsCell(box(1.6, 1.6), { spacing: 1.8, gridSize: 4 }, 't'), []);
  assert.equal(fitsCell(box(1.6, 1.75), { spacing: 1.8, gridSize: 4 }, 't').length, 1);
});

test('mixWeight biases the pick and defaults to 1', () => {
  const defs = [fake('a'), fake('b', 0.5), fake('c', 0)];
  const counts = { a: 0, b: 0, c: 0 };
  for (let n = 1; n <= 3000; n++) counts[pickType('w', n, defs).id]++;
  assert.equal(counts.c, 0);
  assert.ok(Math.abs(counts.b / counts.a - 0.5) < 0.08, `ratio ${counts.b / counts.a}`);
  const even = [fake('a'), fake('b')];
  const evenCounts = { a: 0, b: 0 };
  for (let n = 1; n <= 2000; n++) evenCounts[pickType('w', n, even).id]++;
  assert.ok(Math.abs(evenCounts.a - 1000) < 100);
});
