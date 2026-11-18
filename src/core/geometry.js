import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Corner radius that never exceeds what the thinnest side allows.
export function edgeRadius(radius, w, h, d) {
  return Math.max(0.001, Math.min(radius, Math.min(w, h, d) / 2 - 0.001));
}

// Disc with a rounded rim: a lathe profile with quarter-circle corners.
export function roundedDiscGeometry(radius, height, edge, sides) {
  const e = edgeRadius(edge, radius * 2, height, radius * 2);
  const steps = 3;
  const pts = [new THREE.Vector2(0, -height / 2)];
  for (let i = 0; i <= steps; i++) { // bottom rim corner
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - e + Math.cos(a) * e, -height / 2 + e + Math.sin(a) * e));
  }
  for (let i = 0; i <= steps; i++) { // top rim corner
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - e + Math.cos(a) * e, height / 2 - e + Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0, height / 2));
  return new THREE.LatheGeometry(pts, sides);
}

// Box with rounded corners & edges (3 bevel segments: soft but still low poly).
export function puffy(w, h, d, radius, mat, segments = 3) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, edgeRadius(radius, w, h, d)), mat);
}

// Low-poly cylinder between two points (bottom -> top), optionally tapered.
export function strut(bottom, top, rTop, rBottom, sides, mat) {
  const dir = new THREE.Vector3().subVectors(top, bottom);
  const geo = new THREE.CylinderGeometry(rTop, rBottom, dir.length(), sides, 1, false, Math.PI / 4);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.addVectors(top, bottom).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

// Rescale UVs that are in meters (Extrude/Tube) so patterns tile like on boxes.
export function normalizeUVs(geometry, size) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / size, uv.getY(i) / size);
  return geometry;
}

// Extrude a 2D outline (x, -z in plan) upwards into a slab with beveled edges,
// sitting on y = 0.
export function extrudeUp(shape, height, bevel) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(height - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  return geo;
}

export function superellipseShape(hx, hz, exponent, steps = 28) {
  const shape = new THREE.Shape();
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const x = hx * Math.sign(c) * Math.abs(c) ** (2 / exponent);
    const y = hz * Math.sign(s) * Math.abs(s) ** (2 / exponent);
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// Plan-view z of a back that cups the sitter: ends come forward by `bend`.
export const bendZ = (x, halfWidth, bend) => bend * (x / halfWidth) ** 2;

// Vertical band, curved in plan, `height` tall (bent plywood look).
export function bentBandGeometry(width, height, thickness, bend) {
  const bevel = Math.min(0.006, thickness * 0.3);
  const half = width / 2 - bevel;
  const t = thickness / 2 - bevel;
  const steps = 10;
  const front = [], back = [];
  for (let i = 0; i <= steps; i++) {
    const x = -half + (i / steps) * half * 2;
    const z = bendZ(x, half, bend);
    front.push(new THREE.Vector2(x, -(z + t)));
    back.push(new THREE.Vector2(x, -(z - t)));
  }
  const shape = new THREE.Shape([...front, ...back.reverse()]);
  return normalizeUVs(extrudeUp(shape, height, bevel), width);
}

export function tube(points, radius, sides, mat, closed = false, segments = 10) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, sides, closed), mat);
}

function roundedRectRing(hw, ht, r, steps) {
  const ring = [];
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  corners.forEach(([sw, st], k) => {
    for (let i = 0; i <= steps; i++) {
      const a = (k + i / steps) * (Math.PI / 2);
      ring.push([sw * (hw - r) + Math.cos(a) * r, st * (ht - r) + Math.sin(a) * r]);
    }
  });
  return ring;
}

export function beam(a, b, width, thickness, radius, mat, steps = 2) {
  const axis = new THREE.Vector3().subVectors(b, a);
  const length = axis.length();
  const dir = axis.clone().normalize();
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-12) side.set(1, 0, 0);
  side.normalize();
  const up = new THREE.Vector3().crossVectors(side, dir).normalize();
  const r = edgeRadius(radius, width, thickness, Math.max(width, thickness));
  const ring = roundedRectRing(width / 2, thickness / 2, r, steps);
  const arc = [0];
  for (let i = 1; i <= ring.length; i++) {
    const [x0, y0] = ring[i - 1], [x1, y1] = ring[i % ring.length];
    arc.push(arc[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const point = ([w, t], along) => new THREE.Vector3().addScaledVector(side, w).addScaledVector(up, t).addScaledVector(dir, along);
  const positions = [], uvs = [];
  const push = (p, u, v) => {
    positions.push(p.x, p.y, p.z);
    uvs.push(u, v);
  };
  const h = length / 2;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    const a0 = point(ring[i], -h), a1 = point(ring[j], -h), b0 = point(ring[i], h), b1 = point(ring[j], h);
    push(a0, 0, arc[i]); push(b0, length, arc[i]); push(a1, 0, arc[i + 1]);
    push(a1, 0, arc[i + 1]); push(b0, length, arc[i]); push(b1, length, arc[i + 1]);
  }
  for (let i = 1; i < ring.length - 1; i++) {
    const [p0, p1, p2] = [ring[0], ring[i], ring[i + 1]];
    push(point(p0, -h), p0[0], p0[1]); push(point(p1, -h), p1[0], p1[1]); push(point(p2, -h), p2[0], p2[1]);
    push(point(p0, h), p0[0], p0[1]); push(point(p2, h), p2[0], p2[1]); push(point(p1, h), p1[0], p1[1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.userData.grainAxis = dir.toArray();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  return mesh;
}

export function extrudeProfile(outline, thickness, bevel, plane = 'side') {
  const shape = outline instanceof THREE.Shape ? outline : new THREE.Shape(outline);
  const depth = Math.max(thickness - bevel * 2, 0.001);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  if (plane === 'side') geo.rotateY(-Math.PI / 2);
  return geo;
}

export function endPanelShape(width, height, { cut = 'none', cutWidth = 0, cutHeight = 0, steps = 6 } = {}) {
  const hw = width / 2;
  const cw = Math.min(cutWidth, width * 0.6) / 2;
  const ch = Math.min(cutHeight, height * 0.9);
  const pts = [new THREE.Vector2(-hw, 0)];
  if (cut !== 'none' && cw > 0 && ch > 0) {
    pts.push(new THREE.Vector2(-cw, 0));
    if (cut === 'arch') {
      for (let i = 1; i < steps; i++) {
        const a = Math.PI - (i / steps) * Math.PI;
        pts.push(new THREE.Vector2(Math.cos(a) * cw, Math.sin(a) * ch));
      }
    } else if (cut === 'v') {
      pts.push(new THREE.Vector2(0, ch));
    } else {
      pts.push(new THREE.Vector2(-cw, ch), new THREE.Vector2(cw, ch));
    }
    pts.push(new THREE.Vector2(cw, 0));
  }
  pts.push(new THREE.Vector2(hw, 0), new THREE.Vector2(hw, height), new THREE.Vector2(-hw, height));
  return new THREE.Shape(pts);
}

export function latheSolid(profile, sides) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const first = pts[0], last = pts[pts.length - 1];
  if (first.x !== 0) pts.unshift(new THREE.Vector2(0, first.y));
  if (last.x !== 0) pts.push(new THREE.Vector2(0, last.y));
  return new THREE.LatheGeometry(pts, sides);
}

const PROJECTIONS = [['z', 'y'], ['x', 'z'], ['x', 'y']];

export function boxProjectUVs(geometry, unit = 1) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  if (geo !== geometry) geometry.dispose();
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), e = new THREE.Vector3();
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(e.subVectors(a, b));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    const [u, v] = PROJECTIONS[ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2];
    [a, b, c].forEach((p, k) => {
      uv[(i + k) * 2] = p[u] / unit;
      uv[(i + k) * 2 + 1] = p[v] / unit;
    });
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
