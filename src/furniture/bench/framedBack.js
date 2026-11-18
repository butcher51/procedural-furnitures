import * as THREE from 'three';
import { beam } from '../../core/geometry.js';
import { splitSpan } from '../../core/layout.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildFramedBack({ width, height, thickness, postWidth, postDepth, style, count, puff }, mats) {
  const group = new THREE.Group();
  const railH = Math.max(Math.min(height * 0.16, 0.06), 0.035);
  const postX = width / 2 - postWidth / 2;
  const innerW = width - postWidth * 2;
  const add = (a, b, w, t, mat) => group.add(beam(a, b, w, t, puff, mat));

  for (const sx of [-1, 1]) add(v3(sx * postX, -0.02, 0), v3(sx * postX, height, 0), postWidth, postDepth, mats.frame);
  add(v3(-postX, height - railH / 2, 0), v3(postX, height - railH / 2, 0), thickness * 1.2, railH, mats.frame);
  add(v3(-postX, railH / 2 + 0.03, 0), v3(postX, railH / 2 + 0.03, 0), thickness * 1.2, railH, mats.frame);

  const lo = railH + 0.03 - 0.002;
  const hi = height - railH + 0.002;
  if (style === 'slats') {
    const pitch = innerW / count;
    const slat = Math.min(pitch * 0.5, 0.05);
    for (let i = 0; i < count; i++) {
      const x = -innerW / 2 + pitch * (i + 0.5);
      add(v3(x, lo, 0), v3(x, hi, 0), slat, thickness, mats.surface);
    }
  } else {
    const gap = (hi - lo) * 0.14;
    for (const { center, size } of splitSpan(lo, hi, count, gap)) {
      const bar = Math.min(size, 0.05);
      add(v3(-postX, center, 0), v3(postX, center, 0), thickness, bar, mats.surface);
    }
  }
  return group;
}
