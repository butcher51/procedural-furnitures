import * as THREE from 'three';

export function signedClearance(under, outerTris, v) {
  const p = under.attributes.position;
  const tri = new THREE.Triangle();
  const q = new THREE.Vector3(), n = new THREE.Vector3();
  let best = Infinity, sign = 1, bestOuter = Infinity;
  for (let i = 0; i < p.count; i += 3) {
    tri.a.fromBufferAttribute(p, i);
    tri.b.fromBufferAttribute(p, i + 1);
    tri.c.fromBufferAttribute(p, i + 2);
    if (tri.getArea() < 1e-12) continue;
    tri.closestPointToPoint(v, q);
    const d = q.distanceTo(v);
    best = Math.min(best, d);
    if (i / 3 < outerTris && d < bestOuter) {
      bestOuter = d;
      const plane = tri.getPlane(new THREE.Plane());
      sign = tri.containsPoint(plane.projectPoint(v, n)) ? Math.sign(plane.distanceToPoint(v)) || 1 : 1;
    }
  }
  return sign * best;
}

export function sheetGridTris(geo, cols) {
  const total = geo.attributes.position.count / 3;
  const rows = (total - 4 * cols) / (2 * cols + 4);
  return { rows, tris: rows * cols * 2 };
}

export function worstClearance(under, cols, over) {
  const { tris } = sheetGridTris(under, cols);
  const p = over.attributes.position;
  const v = new THREE.Vector3();
  let worst = Infinity;
  for (let i = 0; i < p.count; i++) worst = Math.min(worst, signedClearance(under, tris, v.fromBufferAttribute(p, i)));
  return worst;
}
