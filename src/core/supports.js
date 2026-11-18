import * as THREE from 'three';
import { puffy, strut, tube } from './geometry.js';

// Leg top positions (x, z) under a footprint. 3+ legs are spread on a
// superellipse so rectangular footprints push legs towards the corners.
export function legAnchors(p, fp) {
  const n = p.legCount;
  const inset = p.legThickness * 1.2;
  const hx = fp.width / 2 - inset;
  const hz = fp.depth / 2 - inset;
  if (n === 1) return [[0, 0]];
  if (n === 2) return [[-hx, 0], [hx, 0]];

  const exponent = fp.exponent ?? (fp.round ? 2 : 10);
  const start = n % 2 === 0 ? Math.PI / n : -Math.PI / 2; // symmetric layouts
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push([
      hx * Math.sign(c) * Math.abs(c) ** (2 / exponent),
      hz * Math.sign(s) * Math.abs(s) ** (2 / exponent),
    ]);
  }
  return pts;
}

// fp = footprint the legs hold up: { width, depth, top (y), round }
export function buildLegs(p, mats, fp) {
  const group = new THREE.Group();
  const r = p.legThickness / 2;

  // 1 leg: pedestal column on a round base
  if (p.legCount === 1) {
    const baseH = 0.03;
    const baseR = Math.min(fp.width, fp.depth) * 0.38;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.9, baseR, baseH, 10), mats.frame);
    base.position.y = baseH / 2;
    group.add(base);
    const colR = Math.max(r * 1.6, 0.03);
    group.add(strut(new THREE.Vector3(0, baseH, 0), new THREE.Vector3(0, fp.top, 0), colR, colR, p.legSides, mats.frame));
    return group;
  }

  // 2 legs: side legs standing on floor runners (sled style)
  const runnerH = p.legCount === 2 ? p.legThickness * 0.8 : 0;
  if (p.legCount === 2) {
    for (const sx of [-1, 1]) {
      const x = sx * (fp.width / 2 - r * 1.2 + p.legSplay);
      const runner = puffy(p.legThickness * 1.2, runnerH, fp.depth * 0.9, p.puff, mats.frame);
      runner.position.set(x, runnerH / 2, 0);
      group.add(runner);
    }
  }

  for (const [x, z] of legAnchors(p, fp)) {
    const top = new THREE.Vector3(x, fp.top, z);
    const out = new THREE.Vector2(x, z);
    if (p.legCount === 2) out.set(Math.sign(x), 0);
    if (out.lengthSq() > 0) out.normalize().multiplyScalar(p.legSplay);
    const bottom = new THREE.Vector3(x + out.x, runnerH, z + out.y);
    group.add(strut(bottom, top, r, r * p.legTaper, p.legSides, mats.frame));
  }
  return group;
}

// Radial offset of the leg at 4 heights (top -> floor), scaled by legSplay
export const LEG_PROFILES = {
  sabre: [0, 0.1, 0.4, 1], // straight under the seat, sweeping out to the floor
  cabriole: [0, 0.8, 0.25, 0.7], // knee bulges out, thin ankle, foot kicks out
  bow: [0, 0.9, 0.9, 0.35], // a long outward arc
};

export function buildCurvyLegs(p, mats, fp) {
  const group = new THREE.Group();
  const profile = LEG_PROFILES[p.legCurve];
  const radius = p.legThickness / 2;
  const ringT = 1 - p.ringHeight / fp.top; // curve parameter at ring height
  const ringPoints = [];

  for (const [x, z] of legAnchors(p, fp)) {
    const out = new THREE.Vector2(x, z).normalize();
    const points = profile.map((o, i) => {
      const t = i / (profile.length - 1);
      const y = radius + (fp.top - radius) * (1 - t); // tube end rests on the floor
      return new THREE.Vector3(x + out.x * o * p.legSplay, y, z + out.y * o * p.legSplay);
    });
    const leg = tube(points, radius, p.legSides, mats.frame);
    group.add(leg);
    ringPoints.push(leg.geometry.parameters.path.getPoint(ringT));
  }

  // Bentwood ring tying the legs together
  if (p.hasRing) group.add(tube(ringPoints, radius * 0.7, 6, mats.frame, true, 32));
  return group;
}
