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
export function puffy(w, h, d, radius, mat) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, edgeRadius(radius, w, h, d)), mat);
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
