import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as registry from '../../src/furniture/registry.js';
import { checkInvariants, connected, convexHull, distanceOutsideHull, grounded, meshesOf, stable, boxOf } from '../helpers/invariants.js';
import { excuseKnownBad, isKnownBad, loadRegressions } from '../helpers/regressions.js';
import { formatFailures, sweep, sweepSeeds } from '../helpers/sweep.js';

const SEEDS = 500;

const box = (w, h, d, x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
  mesh.position.set(x, y, z);
  return mesh;
};

const table = (topY) => {
  const root = new THREE.Group();
  for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) root.add(box(0.04, 0.7, 0.04, x, 0.35, z));
  root.add(box(0.9, 0.04, 0.9, 0, topY, 0));
  return root;
};

test('connected flags a floating part and accepts touching parts', () => {
  assert.deepEqual(connected(meshesOf(table(0.72)), 'test'), []);
  assert.match(connected(meshesOf(table(0.8)), 'test')[0], /5 components/);
});

test('grounded and stable catch a lifted or tipping item', () => {
  const lifted = table(0.72);
  lifted.position.y = 0.05;
  assert.match(grounded(boxOf(meshesOf(lifted)), 'test')[0], /grounded/);
  const meshes = meshesOf(table(0.72));
  assert.deepEqual(stable(meshes, boxOf(meshes), 'test'), []);
  const tipping = table(0.72);
  tipping.add(box(0.04, 0.04, 2, 0, 0.72, 1.4));
  const tippingMeshes = meshesOf(tipping);
  assert.match(stable(tippingMeshes, boxOf(tippingMeshes), 'test')[0], /outside the floor contact hull/);
});

test('convex hull distance is negative inside and positive outside', () => {
  const hull = convexHull([[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]]);
  assert.equal(hull.length, 4);
  assert.ok(distanceOutsideHull(hull, [0.5, 0.5]) < 0);
  assert.ok(Math.abs(distanceOutsideHull(hull, [1.5, 0.5]) - 0.5) < 1e-9);
});

for (const definition of registry.list()) {
  const type = definition.id;
  const regressions = loadRegressions(type);

  test(`${type}: geometry invariants hold over ${SEEDS} seeds`, () => {
    const { failures } = sweep(type, SEEDS, checkInvariants);
    const unexpected = excuseKnownBad(failures, regressions);
    assert.equal(unexpected.length, 0, `${unexpected.length} invariant failures:\n${formatFailures(unexpected)}`);
  });

  test(`${type}: regression seeds`, () => {
    const problems = [];
    for (const entry of regressions) {
      assert.ok(entry.seed && entry.reason, `${type} regression entry needs seed and reason: ${JSON.stringify(entry)}`);
      const { failures } = sweepSeeds(type, [entry.seed], checkInvariants, { rerolls: entry.rerolls });
      if (entry.status === 'known-bad') {
        if (!failures.some((failure) => isKnownBad(failure, [entry]))) problems.push(`${entry.seed}: known-bad seed now passes ${entry.invariant ?? 'all invariants'}, remove it from tests/regressions/${type}.json`);
        problems.push(...excuseKnownBad(failures, [entry]).map((f) => `${f.seed}: ${f.message}`));
      } else {
        problems.push(...failures.map((f) => `${f.seed}: ${f.message} (${entry.reason})`));
      }
    }
    assert.deepEqual(problems.slice(0, 30), [], `${problems.length} regression problems`);
  });
}
