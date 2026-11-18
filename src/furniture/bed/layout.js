import { splitSpan } from '../../core/layout.js';
import { pillow } from '../../core/soft.js';

const rad = (deg) => (deg * Math.PI) / 180;
const cache = new Map();

export const PILLOW_LOOK = {
  sleep: { waist: 0.03, grid: 6 },
  euro: { waist: 0.03, grid: 6 },
  deco: { waist: 0.04, grid: 5 },
};

export function pillowExtents(w, h, t, pinch, waist, grid, rotX) {
  const key = [w, h, t, pinch, waist, grid, rotX].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const position = pillow(w, h, t, undefined, { pinch, waist, grid }).geometry.attributes.position;
  const c = Math.cos(rotX);
  const s = Math.sin(rotX);
  const e = { minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const z = position.getZ(i);
    const ry = y * c - z * s;
    const rz = y * s + z * c;
    e.minY = Math.min(e.minY, ry);
    e.maxY = Math.max(e.maxY, ry);
    e.minZ = Math.min(e.minZ, rz);
    e.maxZ = Math.max(e.maxZ, rz);
  }
  if (cache.size > 4000) cache.clear();
  cache.set(key, e);
  return e;
}

const LEAN_ROLES = new Set(['singleLean', 'pairLean']);

export function planPillows(c) {
  const items = [];
  const rows = [];
  let ok = true;
  const hasHead = c.headRise > 0;
  const xs = (n) => splitSpan(-c.W / 2 + 0.02, c.W / 2 - 0.02, n, 0.01).map((s) => s.center);
  const flatRear = c.cl + 0.02;

  const put = (role, size, rotX, rear, x, onHead, tanA) => {
    const look = PILLOW_LOOK[role];
    const m = pillowExtents(size.w, size.h, size.t, size.pinch, look.waist, look.grid, rotX);
    const height = m.maxY - m.minY;
    if (onHead && !(hasHead && c.headRise >= height + 0.04)) ok = false;
    const item = {
      role,
      w: size.w, h: size.h, t: size.t, pinch: size.pinch, waist: look.waist, grid: look.grid,
      rotX,
      x,
      y: c.top - m.minY,
      z: rear - m.minZ,
      minZ: rear,
      maxZ: rear + (m.maxZ - m.minZ),
      height,
      onHead,
      tan: Math.tan(-rotX) * (Math.abs(rotX) > 1.5 ? 0 : 1),
    };
    items.push(item);
    return item;
  };
  const row = (list) => {
    const info = {
      front: Math.max(...list.map((i) => i.maxZ)),
      tan: Math.max(...list.map((i) => i.tan)),
      height: Math.max(...list.map((i) => i.height)),
    };
    rows.push(info);
    return info;
  };
  const resting = (support, a, height) => support.front + Math.max(0, Math.min(support.height, height) * (Math.tan(a) - support.tan)) + 0.003;

  const sleeper = { w: c.pillowWidth, h: c.pillowLength, t: c.pillowThickness, pinch: c.pillowPinch };
  const euro = { w: c.euroSize, h: c.euroSize, t: c.euroThickness, pinch: c.pillowPinch };
  const flat = -Math.PI / 2;
  const a1 = rad(c.euroLean);
  const a2 = rad(c.pillowLean);
  const arrangement = c.arrangement;

  if (arrangement === 'single' || arrangement === 'pair') {
    const n = arrangement === 'single' ? 1 : 2;
    row(xs(n).map((x) => put('sleep', sleeper, flat, flatRear, x, false)));
  } else if (LEAN_ROLES.has(arrangement)) {
    const n = arrangement === 'singleLean' ? 1 : 2;
    row(xs(n).map((x) => put('sleep', sleeper, -a2, 0.003, x, true)));
  } else if (arrangement === 'euroSingle') {
    const first = row([put('euro', euro, -a1, 0.003, 0, true)]);
    row([put('sleep', sleeper, flat, first.front + 0.01, 0, false)]);
  } else if (arrangement === 'euroStack') {
    const first = row(xs(2).map((x) => put('euro', euro, -a1, 0.003, x, true)));
    const m = pillowExtents(sleeper.w, sleeper.h, sleeper.t, sleeper.pinch, PILLOW_LOOK.sleep.waist, PILLOW_LOOK.sleep.grid, -a2);
    row(xs(2).map((x) => put('sleep', sleeper, -a2, resting(first, a2, m.maxY - m.minY), x, false)));
  }

  if (c.decoKind !== 'none' && rows.length > 0) {
    const deco = { w: c.decoWidth, h: c.decoHeight, t: c.decoThickness, pinch: c.pillowPinch };
    const a = rad(c.decoLean);
    const m = pillowExtents(deco.w, deco.h, deco.t, deco.pinch, PILLOW_LOOK.deco.waist, PILLOW_LOOK.deco.grid, -a);
    const support = rows[rows.length - 1];
    row([put('deco', deco, -a, resting(support, a, m.maxY - m.minY), 0, false)]);
  }

  const zoneEnd = items.length ? Math.max(...items.map((i) => i.maxZ)) : 0;
  return { ok, zoneEnd, items };
}
