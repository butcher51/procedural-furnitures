import * as THREE from 'three';
import { beam, extrudeProfile, latheSolid, strut, tube } from './geometry.js';

export const HANDLE_KINDS = {
  knob: { tris: 140, part: true },
  bar: { tris: 72, squareTris: 132, part: true },
  cup: { tris: 92, part: true },
  ring: { tris: 128, part: true },
  tab: { tris: 88, part: true },
  lip: { tris: 44, part: true },
  cutout: { tris: 0, part: false },
  groove: { tris: 0, part: false },
  none: { tris: 0, part: false },
};

export const RING_DROP = 1.25;

const PROJECTION = { knob: 0.026, bar: 0.03, cup: 0.023, ring: 0.012, tab: 0.012, lip: 0.016 };

export const HANDLE_DEFAULTS = {
  kind: 'knob',
  doorKind: null,
  knobDiameter: 0.03,
  barLength: null,
  barScale: 1,
  barProfile: 'round',
  barDiameter: 0.012,
  projection: null,
  cupWidth: 0.086,
  cupHeight: 0.034,
  ringDiameter: 0.038,
  cutoutWidth: 0.1,
  cutoutHeight: 0.03,
  cutoutShape: 'slot',
  lipFraction: 1,
  lipHeight: 0.026,
  tabLength: 0.055,
  tabWidth: 0.025,
  vPos: 'centre',
  doorInset: 0.045,
  doorDrop: 0.07,
};

const SIZE_FIELD = { knob: 'knobDiameter', ring: 'ringDiameter', bar: 'barLength', cup: 'cupWidth', tab: 'tabLength' };

export function normalizeHandle(handle = {}) {
  if (handle.normalized) return handle;
  const hw = { ...HANDLE_DEFAULTS };
  for (const [key, value] of Object.entries(handle)) if (value !== undefined && value !== null) hw[key] = value;
  if (!HANDLE_KINDS[hw.kind]) hw.kind = 'none';
  if (handle.size > 0 && SIZE_FIELD[hw.kind]) hw[SIZE_FIELD[hw.kind]] = handle.size;
  hw.projection = handle.projection ?? PROJECTION[hw.kind] ?? 0.02;
  hw.normalized = true;
  return hw;
}

export function handleTris(kind, handle) {
  const entry = HANDLE_KINDS[kind];
  if (!entry) return 0;
  return kind === 'bar' && normalizeHandle(handle).barProfile === 'square' ? entry.squareTris : entry.tris;
}

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function knob(diameter, projection, mat) {
  const d = diameter, p = projection;
  const geo = latheSolid([[0.28 * d, 0], [0.22 * d, 0.3 * p], [0.45 * d, 0.56 * p], [0.5 * d, 0.74 * p], [0.43 * d, 0.92 * p], [0.24 * d, p]], 10);
  geo.rotateX(Math.PI / 2);
  return [new THREE.Mesh(geo, mat)];
}

function bar(length, projection, diameter, profile, mat) {
  const r = diameter / 2;
  const zRod = projection - r;
  const postX = length / 2 - r;
  if (profile === 'square') {
    const radius = diameter * 0.15;
    return [
      beam(v3(-length / 2, 0, zRod), v3(length / 2, 0, zRod), diameter, diameter, radius, mat),
      ...[-postX, postX].map((x) => beam(v3(x, 0, 0), v3(x, 0, zRod), diameter * 0.8, diameter * 0.8, radius, mat)),
    ];
  }
  return [
    strut(v3(-length / 2, 0, zRod), v3(length / 2, 0, zRod), r, r, 6, mat),
    ...[-postX, postX].map((x) => strut(v3(x, 0, 0), v3(x, 0, zRod), r * 0.8, r * 0.8, 6, mat)),
  ];
}

function cup(width, height, projection, mat) {
  const p = projection, h = height, t = Math.min(0.003, p * 0.15);
  const section = [
    [0, h / 2], [0, -h / 2], [0.6 * p, -h / 2], [p, 0.05 * h],
    [p - t, 0.05 * h], [0.6 * p - 0.4 * t, -h / 2 + t], [t, -h / 2 + t], [t, h / 2],
  ].map(([z, y]) => new THREE.Vector2(z, y));
  return [new THREE.Mesh(extrudeProfile(section, width, Math.min(0.0008, t * 0.3), 'side'), mat)];
}

function lip(length, height, projection, mat) {
  return [beam(v3(-length / 2, 0, projection / 2), v3(length / 2, 0, projection / 2), projection, height, 0.4 * Math.min(projection, height), mat)];
}

function tab(length, width, projection, mat) {
  const t = 0.004;
  const tip = v3(0, -length / 2 + t, projection - t / 2);
  return [
    beam(v3(0, length / 2 - t, t / 2), tip, width, t, t * 0.4, mat),
    beam(v3(0, length / 2 - 0.4 * length, t / 2), tip, width, t, t * 0.4, mat),
  ];
}

function ring(diameter, projection, mat) {
  const rosette = 0.22 * diameter;
  const top = (diameter * RING_DROP) / 2;
  const yRosette = top - rosette;
  const head = latheSolid([[rosette, 0], [rosette, 0.4 * projection], [0.55 * rosette, projection]], 6);
  head.rotateX(Math.PI / 2);
  const parts = [new THREE.Mesh(head, mat)];
  parts[0].position.y = yRosette;
  const tubeR = Math.max(0.0025, diameter * 0.08);
  const radius = diameter / 2 - tubeR;
  const centre = yRosette - radius;
  const z = 0.6 * projection;
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    return v3(Math.cos(a) * radius, centre + Math.sin(a) * radius, z);
  });
  parts.push(tube(points, tubeR, 4, mat, true, 10));
  return parts;
}

export function buildHandle(slot, handle, mat) {
  const hw = normalizeHandle(handle);
  const group = new THREE.Group();
  const p = hw.projection;
  let parts = [];
  if (slot.kind === 'knob') parts = knob(slot.length, p, mat);
  else if (slot.kind === 'bar') parts = bar(slot.length, p, slot.size ?? hw.barDiameter, hw.barProfile, mat);
  else if (slot.kind === 'cup') parts = cup(slot.length, slot.size ?? hw.cupHeight, p, mat);
  else if (slot.kind === 'lip') parts = lip(slot.length, slot.size ?? hw.lipHeight, p, mat);
  else if (slot.kind === 'tab') parts = tab(slot.size ?? hw.tabLength, slot.length, p, mat);
  else if (slot.kind === 'ring') parts = ring(slot.length, p, mat);
  if (parts.length) group.add(...parts);
  if (slot.axis === 'y' && (slot.kind === 'bar' || slot.kind === 'lip')) group.rotation.z = Math.PI / 2;
  group.position.set(slot.x, slot.y, slot.z);
  return group;
}
