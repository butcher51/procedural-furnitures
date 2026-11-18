import * as THREE from 'three';
import { TYPE_RULES } from '../invariants/types.js';

export const SPLAYED_LEG_FLOOR_SINK = 0.02;
export const GROUND_MIN = -SPLAYED_LEG_FLOOR_SINK;
export const GROUND_MAX = 0.002;
export const SIZE_SLACK = 1.05;
export const CELL_MARGIN = 0.1;
export const CONTACT_GAP = 0.002;
export const FLOOR_CONTACT_BAND = 0.003;
export const HULL_TOLERANCE = 0.001;
export const DEFAULT_MAX_SIZE = { width: 2.5, height: 2.5, depth: 2.5 };

const mm = (m) => `${(m * 1000).toFixed(1)} mm`;
const cm = (m) => `${(m * 100).toFixed(1)} cm`;

export function meshesOf(object) {
  const meshes = [];
  object.updateMatrixWorld(true);
  object.traverse((o) => {
    if (o.isMesh) meshes.push(o);
  });
  return meshes;
}

export function forEachWorldVertex(mesh, visit) {
  const position = mesh.geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    visit(v);
  }
}

export function worldBox(mesh) {
  const box = new THREE.Box3();
  forEachWorldVertex(mesh, (v) => box.expandByPoint(v));
  return box;
}

export function boxOf(meshes) {
  const box = new THREE.Box3();
  for (const mesh of meshes) box.union(worldBox(mesh));
  return box;
}

export function rulesFor(definition) {
  const rules = TYPE_RULES[definition.id] ?? {};
  return {
    maxSize: definition.maxSize ?? rules.maxSize ?? DEFAULT_MAX_SIZE,
    checks: rules.checks ?? [],
  };
}

export function grounded(box, label) {
  const y = box.min.y;
  return y >= GROUND_MIN && y <= GROUND_MAX ? [] : [`grounded (${label}): min y ${mm(y)} outside [${mm(GROUND_MIN)}, ${mm(GROUND_MAX)}]`];
}

export function saneSize(box, maxSize, label) {
  const size = box.getSize(new THREE.Vector3());
  const measured = { width: size.x, height: size.y, depth: size.z };
  return Object.entries(maxSize)
    .filter(([axis, max]) => measured[axis] > max * SIZE_SLACK)
    .map(([axis, max]) => `sane size (${label}): ${axis} ${cm(measured[axis])} > ${cm(max)} + 5%`);
}

export function fitsCell(box, cell, label) {
  const size = box.getSize(new THREE.Vector3());
  const limits = { x: cell.spacing - CELL_MARGIN, z: (cell.spacingZ ?? cell.spacing) - CELL_MARGIN };
  return [['x', size.x], ['z', size.z]]
    .filter(([axis, extent]) => !(extent < limits[axis]))
    .map(([axis, extent]) => `fits cell (${label}): ${axis} extent ${cm(extent)} >= ${cm(limits[axis])}`);
}

export function finite(meshes, label) {
  const failures = [];
  for (const mesh of meshes) {
    const array = mesh.geometry.attributes.position?.array;
    if (!array) {
      failures.push(`finite (${label}): mesh without position attribute`);
      continue;
    }
    if (!array.every(Number.isFinite)) failures.push(`finite (${label}): non-finite position in mesh "${mesh.name || mesh.id}"`);
  }
  return failures;
}

export function components(boxes, gap = CONTACT_GAP) {
  const parent = boxes.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const expanded = boxes.map((b) => b.clone().expandByScalar(gap));
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (expanded[i].intersectsBox(expanded[j])) parent[find(i)] = find(j);
    }
  }
  const groups = new Map();
  boxes.forEach((_, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  });
  return [...groups.values()];
}

export function connected(meshes, label) {
  const boxes = meshes.map(worldBox);
  const groups = components(boxes);
  if (groups.length <= 1) return [];
  const describe = (group) => {
    const box = new THREE.Box3();
    group.forEach((i) => box.union(boxes[i]));
    const c = box.getCenter(new THREE.Vector3());
    return `${group.length} mesh(es) around (${c.x.toFixed(3)}, ${c.y.toFixed(3)}, ${c.z.toFixed(3)})`;
  };
  return [`connected (${label}): ${groups.length} components: ${groups.map(describe).join('; ')}`];
}

export function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

export function distanceOutsideHull(hull, point) {
  if (hull.length < 3) return Infinity;
  let outside = -Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    const length = Math.hypot(ex, ez);
    if (length === 0) continue;
    outside = Math.max(outside, (ex * (point[1] - a[1]) - ez * (point[0] - a[0])) / -length);
  }
  return outside;
}

export function stable(meshes, box, label) {
  const contacts = [];
  const floor = box.min.y + FLOOR_CONTACT_BAND;
  for (const mesh of meshes) {
    forEachWorldVertex(mesh, (v) => {
      if (v.y <= floor) contacts.push([v.x, v.z]);
    });
  }
  const hull = convexHull(contacts);
  const centre = box.getCenter(new THREE.Vector3());
  const outside = distanceOutsideHull(hull, [centre.x, centre.z]);
  if (outside <= HULL_TOLERANCE) return [];
  if (hull.length < 3) return [`stable (${label}): floor contact hull is degenerate (${contacts.length} contact points)`];
  return [`stable (${label}): bbox centre (${centre.x.toFixed(3)}, ${centre.z.toFixed(3)}) is ${mm(outside)} outside the floor contact hull`];
}

export function checkInvariants({ definition, params, root, object }) {
  const { maxSize, checks } = rulesFor(definition);
  const partMeshes = meshesOf(root);
  const mergedMeshes = meshesOf(object);
  const partBox = boxOf(partMeshes);
  const mergedBox = boxOf(mergedMeshes);
  const failures = [
    ...finite(partMeshes, 'parts'),
    ...finite(mergedMeshes, 'merged'),
    ...grounded(partBox, 'parts'),
    ...grounded(mergedBox, 'merged'),
    ...saneSize(mergedBox, maxSize, 'merged'),
    ...fitsCell(mergedBox, definition.cell, 'merged'),
    ...connected(partMeshes, 'parts'),
    ...stable(mergedMeshes, mergedBox, 'merged'),
  ];
  if (partBox.min.distanceTo(mergedBox.min) + partBox.max.distanceTo(mergedBox.max) > 1e-5) {
    failures.push('merge: merged bbox differs from the pre-merge parts bbox');
  }
  const context = { definition, params, root, object, partMeshes, mergedMeshes, box: mergedBox };
  for (const check of checks) failures.push(...check(context));
  return failures;
}
