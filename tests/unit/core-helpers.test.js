import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { puffy } from '../../src/core/geometry.js';
import { bentwoodFoot, buildCurvyLegs } from '../../src/core/supports.js';

const trianglesOf = (mesh) => mesh.geometry.attributes.position.count / 3;

const minYOf = (object) => {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object).min.y;
};

test('puffy keeps 3 bevel segments by default and accepts fewer', () => {
  const mat = new THREE.MeshBasicMaterial();
  assert.equal(trianglesOf(puffy(0.4, 0.3, 0.05, 0.01, mat)), 588);
  assert.equal(trianglesOf(puffy(0.4, 0.3, 0.05, 0.01, mat, 3)), 588);
  assert.equal(trianglesOf(puffy(0.4, 0.3, 0.05, 0.01, mat, 2)), 300);
});

test('bentwoodFoot stands on the floor and closes the open tube end', () => {
  const radius = 0.02;
  const path = new THREE.CatmullRomCurve3(
    [new THREE.Vector3(0, 0.4, 0), new THREE.Vector3(0.02, 0.2, 0), new THREE.Vector3(0.08, radius, 0)],
    false,
    'centripetal'
  );
  const foot = bentwoodFoot(path, radius, 6, new THREE.MeshBasicMaterial());
  const box = new THREE.Box3().setFromObject(foot);
  const end = path.getPoint(1);
  const rimTop = end.y + radius * Math.sqrt(1 - path.getTangent(1).y ** 2);
  assert.ok(Math.abs(box.min.y) < 1e-9);
  assert.ok(box.max.y > rimTop);
  assert.ok(Math.abs((box.min.x + box.max.x) / 2 - end.x) < 1e-9);
  assert.ok(box.max.x - end.x > radius);
});

test('buildCurvyLegs rests on y = 0 for every leg curve', () => {
  const mats = { frame: new THREE.MeshBasicMaterial() };
  const fp = { width: 0.45, depth: 0.42, top: 0.43, exponent: 3 };
  for (const legCurve of ['sabre', 'cabriole', 'bow']) {
    for (const legThickness of [0.025, 0.045]) {
      const p = { legCount: 4, legThickness, legSides: 6, legSplay: 0.08, legCurve, hasRing: true, ringHeight: 0.2 };
      assert.ok(Math.abs(minYOf(buildCurvyLegs(p, mats, fp))) < 1e-6, `${legCurve} ${legThickness}`);
    }
  }
});
