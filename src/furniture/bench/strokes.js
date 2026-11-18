import * as THREE from 'three';

export function strokeShape(points, width, { floor = false, miterLimit = 2 } = {}) {
  const half = width / 2;
  const count = points.length;
  const dirs = [];
  for (let i = 0; i < count - 1; i++) dirs.push(new THREE.Vector2().subVectors(points[i + 1], points[i]).normalize());
  const normal = (d) => new THREE.Vector2(-d.y, d.x);
  const left = [];
  const right = [];
  for (let i = 0; i < count; i++) {
    let offset;
    if (i === 0) offset = normal(dirs[0]).multiplyScalar(half);
    else if (i === count - 1) offset = normal(dirs[count - 2]).multiplyScalar(half);
    else {
      const n0 = normal(dirs[i - 1]);
      const n1 = normal(dirs[i]);
      const mid = new THREE.Vector2().addVectors(n0, n1);
      if (mid.lengthSq() < 1e-9) offset = n1.multiplyScalar(half);
      else {
        mid.normalize();
        offset = mid.multiplyScalar(half / Math.max(mid.dot(n0), 1 / miterLimit));
      }
    }
    left.push(new THREE.Vector2().addVectors(points[i], offset));
    right.push(new THREE.Vector2().subVectors(points[i], offset));
  }
  const outline = [...left, ...right.reverse()];
  if (floor) for (const p of outline) p.y = Math.max(0, p.y);
  return new THREE.Shape(outline);
}
