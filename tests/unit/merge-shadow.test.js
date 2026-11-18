import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { groupParts, mergeByMaterial, shadowMaskDepthMaterial } from '../../src/core/merge.js';

const box = (mat, x) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
  mesh.position.x = x;
  return mesh;
};

test('mergeByMaterial: noShadow parts get a shadow mask and the shared depth material', () => {
  const a = new THREE.MeshStandardMaterial();
  const b = new THREE.MeshStandardMaterial();
  const rail = box(a, 1);
  rail.userData.noShadow = true;
  const group = new THREE.Group();
  group.userData.noShadow = true;
  group.add(box(a, 2));
  const merged = mergeByMaterial(groupParts([box(a, 0), rail, group, box(b, 3)]));
  const [ma, mb] = merged.children;
  const mask = ma.geometry.attributes.shadowMask.array;
  const per = mask.length / 3;
  assert.deepEqual([mask[0], mask[per], mask[2 * per]], [0, 1, 1]);
  assert.equal(mask.filter((v) => v === 1).length, 2 * per);
  assert.equal(ma.customDepthMaterial, shadowMaskDepthMaterial());
  assert.ok(ma.castShadow && ma.receiveShadow);
  assert.equal(mb.geometry.attributes.shadowMask, undefined);
  assert.equal(mb.customDepthMaterial, undefined);
  assert.equal(shadowMaskDepthMaterial().depthPacking, THREE.RGBADepthPacking);
});
