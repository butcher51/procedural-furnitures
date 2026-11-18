import * as THREE from 'three';
import { beam, puffy, roundedDiscGeometry, strut, tube } from './geometry.js';

export function legAnchors(p, fp) {
  if (fp.anchors) return fp.anchors;
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

  if (p.legCount === 2) {
    const runnerH = p.legThickness * 0.8;
    for (const sx of [-1, 1]) {
      const x = sx * (fp.width / 2 - r * 1.2 + p.legSplay);
      const runner = puffy(p.legThickness * 1.2, runnerH, fp.depth * 0.9, p.puff, mats.frame);
      runner.position.set(x, runnerH / 2, 0);
      group.add(runner);
    }
    for (const [x, z] of legAnchors(p, fp)) {
      const top = new THREE.Vector3(x, fp.top, z);
      const out = new THREE.Vector2(Math.sign(x), 0);
      if (out.lengthSq() > 0) out.normalize().multiplyScalar(p.legSplay);
      const bottom = new THREE.Vector3(x + out.x, runnerH, z + out.y);
      group.add(strut(bottom, top, r, r * p.legTaper, p.legSides, mats.frame));
    }
    return group;
  }

  for (const line of legLines(p, fp)) group.add(strut(line.bottom, line.top, line.rTop, line.rBottom, p.legSides, mats.frame));
  return group;
}

export function legLines(p, fp) {
  if (!(p.legCount >= 3)) return [];
  const r = p.legThickness / 2;
  return legAnchors(p, fp).map(([x, z]) => {
    const top = new THREE.Vector3(x, fp.top, z);
    const out = fp.splayAxes ? new THREE.Vector2(Math.sign(x) * fp.splayAxes[0], Math.sign(z) * fp.splayAxes[1]) : new THREE.Vector2(x, z);
    if (out.lengthSq() > 0) out.normalize().multiplyScalar(p.legSplay);
    const bottom = new THREE.Vector3(x + out.x, 0, z + out.y);
    return { top, bottom, rTop: r, rBottom: r * p.legTaper };
  });
}

export function pointOnLeg(line, y) {
  const t = (y - line.bottom.y) / (line.top.y - line.bottom.y);
  return new THREE.Vector3().lerpVectors(line.bottom, line.top, t);
}

export function rowAnchors(length, depth, perRow, insetX, insetZ) {
  const hx = length / 2 - insetX;
  const hz = depth / 2 - insetZ;
  const xs = Array.from({ length: perRow }, (_, i) => (perRow === 1 ? 0 : -hx + (2 * hx * i) / (perRow - 1)));
  return [...xs.map((x) => [x, hz]), ...[...xs].reverse().map((x) => [x, -hz])];
}

// Radial offset of the leg at 4 heights (top -> floor), scaled by legSplay
export const LEG_PROFILES = {
  sabre: [0, 0.1, 0.4, 1], // straight under the seat, sweeping out to the floor
  cabriole: [0, 0.8, 0.25, 0.7], // knee bulges out, thin ankle, foot kicks out
  bow: [0, 0.9, 0.9, 0.35], // a long outward arc
};

export function bentwoodFoot(path, radius, sides, mat) {
  const end = path.getPoint(1);
  const tangent = path.getTangent(1);
  const endRimTop = end.y + radius * Math.sqrt(Math.max(0, 1 - tangent.y ** 2));
  const height = endRimTop + radius * 0.3;
  return strut(new THREE.Vector3(end.x, 0, end.z), new THREE.Vector3(end.x, height, end.z), radius * 1.1, radius * 1.2, sides, mat);
}

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
    group.add(bentwoodFoot(leg.geometry.parameters.path, radius, p.legSides, mats.frame));
    ringPoints.push(leg.geometry.parameters.path.getPoint(ringT));
  }

  // Bentwood ring tying the legs together
  if (p.hasRing) group.add(tube(ringPoints, radius * 0.7, 6, mats.frame, true, 32));
  return group;
}

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function endRails(points) {
  const byX = (list) => [...list].sort((a, b) => a.x - b.x);
  const front = byX(points.filter((pt) => pt.z > 0));
  const back = byX(points.filter((pt) => pt.z < 0));
  if (front.length < 2 || back.length < 2) throw new Error('buildStretchers: h and ends need two rows of at least two legs');
  return [[front[0], back[0]], [front[front.length - 1], back[back.length - 1]]];
}

export function buildStretchers(lines, kind, y, { radius, sides = 6, profile = 'round', stagger = 0 }, mat) {
  const group = new THREE.Group();
  if (kind === 'none' || lines.length < 2) return group;
  const rail = (a, b) => group.add(profile === 'square' ? beam(a, b, radius * 2, radius * 2, radius * 0.5, mat) : strut(a, b, radius, radius, sides, mat));
  const points = lines.map((line) => pointOnLeg(line, y));
  if (kind === 'ring') {
    group.add(tube(points, radius, sides, mat, true, 32));
  } else if (kind === 'perimeter') {
    lines.forEach((line, i) => {
      const next = lines[(i + 1) % lines.length];
      const a = points[i], b = points[(i + 1) % lines.length];
      const alongZ = Math.abs(b.z - a.z) > Math.abs(b.x - a.x);
      if (alongZ && stagger) rail(pointOnLeg(line, y + stagger), pointOnLeg(next, y + stagger));
      else rail(a, b);
    });
  } else if (kind === 'h' || kind === 'ends') {
    const ends = endRails(points);
    for (const [a, b] of ends) rail(a, b);
    if (kind === 'h') {
      const [left, right] = ends.map(([a, b]) => new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5));
      rail(left, right);
    }
  } else if (kind === 'cross') {
    for (const pt of points) rail(pt, v3(0, y, 0));
    const hub = new THREE.Mesh(roundedDiscGeometry(radius * 2.5, radius * 2, radius * 0.5, 8), mat);
    hub.position.y = y;
    group.add(hub);
  } else {
    throw new Error(`buildStretchers: unknown kind "${kind}"`);
  }
  return group;
}

export function buildApron(lines, { top, height, thickness, setback = 0, edges = 'all', radius = 0.004 }, mat) {
  const group = new THREE.Group();
  const y = top - height / 2;
  const count = lines.length === 2 ? 1 : lines.length < 2 ? 0 : lines.length;
  for (let i = 0; i < count; i++) {
    const a = pointOnLeg(lines[i], y);
    const b = pointOnLeg(lines[(i + 1) % lines.length], y);
    const dx = b.x - a.x, dz = b.z - a.z;
    const alongX = Math.abs(dx) >= Math.abs(dz);
    if ((edges === 'long' && !alongX) || (edges === 'short' && alongX)) continue;
    if (setback) {
      const len = Math.hypot(dx, dz);
      const nx = -dz / len, nz = dx / len;
      const outward = nx * (a.x + b.x) + nz * (a.z + b.z);
      const s = outward > 0 ? -setback : outward < 0 ? setback : 0;
      a.x += nx * s; a.z += nz * s;
      b.x += nx * s; b.z += nz * s;
    }
    group.add(beam(a, b, thickness, height, radius, mat));
  }
  return group;
}

export function buildPedestal({ top, base = 'disc', baseRadius, baseHeight, baseTaper = 0.5, columnRadius, columnSides = 10, sleeve = null, cap = null, armWidth = columnRadius * 1.6 }, mat) {
  const group = new THREE.Group();
  const baseSides = baseRadius > 0.4 ? 16 : 12;
  if (base === 'disc') {
    const disc = new THREE.Mesh(roundedDiscGeometry(baseRadius, baseHeight, 0.008, baseSides), mat);
    disc.position.y = baseHeight / 2;
    group.add(disc);
  } else if (base === 'cone') {
    group.add(strut(v3(0, 0, 0), v3(0, baseHeight, 0), baseRadius * baseTaper, baseRadius, baseSides, mat));
  } else if (base === 'cross' || base === 'tripod') {
    const angles = base === 'cross' ? [1, 3, 5, 7].map((k) => (k * Math.PI) / 4) : [Math.PI, Math.PI / 3, -Math.PI / 3];
    const y = baseHeight / 2;
    for (const a of angles) group.add(beam(v3(0, y, 0), v3(Math.sin(a) * baseRadius, y, Math.cos(a) * baseRadius), armWidth, baseHeight, 0.006, mat));
  } else {
    throw new Error(`buildPedestal: unknown base "${base}"`);
  }
  const columnTop = cap ? top - cap.height : top;
  if (sleeve) group.add(strut(v3(0, baseHeight, 0), v3(0, Math.min(baseHeight + sleeve.height, columnTop), 0), sleeve.radius, sleeve.radius, columnSides, mat));
  group.add(strut(v3(0, baseHeight, 0), v3(0, columnTop, 0), columnRadius, columnRadius, columnSides, mat));
  if (cap) {
    const plate = new THREE.Mesh(roundedDiscGeometry(cap.radius, cap.height, Math.min(0.006, cap.height * 0.3), cap.radius > 0.4 ? 16 : 12), mat);
    plate.position.y = top - cap.height / 2;
    group.add(plate);
  }
  return group;
}

export function buildTrestle({ length, depth, top, kind = 'I', inset, footLength, footHeight, beamWidth, postDepth = beamWidth, cleatHeight, cleatLength = 0.8 * depth, stretcherHeight, stretcher = true, radius = 0.006 }, mat) {
  const group = new THREE.Group();
  const bar = (a, b, w, t) => group.add(beam(a, b, w, t, radius, mat));
  const frameX = length / 2 - inset;
  const footY = footHeight / 2;
  const cleatY = top - cleatHeight / 2;
  const zf = footLength / 2 - beamWidth / 2;
  const zc = cleatLength / 2 - beamWidth / 2;
  const slantEnds = (zb, zt) => {
    let yb = footY, yt = cleatY;
    for (let i = 0; i < 4; i++) {
      const ext = ((beamWidth / 2) * Math.abs(zt - zb)) / Math.hypot(zt - zb, yt - yb);
      yb = Math.max(footY, ext);
      yt = Math.min(cleatY, top - ext);
    }
    return [yb, yt];
  };
  const [xb, xt] = slantEnds(-zf, zc);
  const crossY = xb + (zf / (zf + zc)) * (xt - xb);
  const railY = kind === 'X' ? crossY : stretcherHeight;
  for (const x of [-frameX, frameX]) {
    bar(v3(x, footY, -footLength / 2), v3(x, footY, footLength / 2), beamWidth, footHeight);
    bar(v3(x, cleatY, -cleatLength / 2), v3(x, cleatY, cleatLength / 2), beamWidth, cleatHeight);
    if (kind === 'I') {
      bar(v3(x, footY, 0), v3(x, cleatY, 0), beamWidth, postDepth);
    } else if (kind === 'A') {
      const zFoot = 0.38 * footLength, zTop = 0.2 * cleatLength;
      const [yb, yt] = slantEnds(zFoot, zTop);
      const t = (stretcherHeight - yb) / (yt - yb);
      const zRail = zFoot + (zTop - zFoot) * t;
      bar(v3(x, yb, -zFoot), v3(x, yt, -zTop), beamWidth, beamWidth);
      bar(v3(x, yb, zFoot), v3(x, yt, zTop), beamWidth, beamWidth);
      bar(v3(x, stretcherHeight, -zRail), v3(x, stretcherHeight, zRail), beamWidth, beamWidth);
    } else if (kind === 'X') {
      bar(v3(x, xb, -zf), v3(x, xt, zc), beamWidth, beamWidth);
      bar(v3(x, xb, zf), v3(x, xt, -zc), beamWidth, beamWidth);
    } else {
      throw new Error(`buildTrestle: unknown kind "${kind}"`);
    }
  }
  if (stretcher) bar(v3(-frameX, railY, 0), v3(frameX, railY, 0), beamWidth, beamWidth);
  return group;
}
