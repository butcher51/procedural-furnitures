import * as THREE from 'three';
import { beam, extrudeProfile } from './geometry.js';
import { grainAlong } from './patterns.js';
import { buildHandle, handleTris, HANDLE_KINDS, normalizeHandle, RING_DROP } from './handles.js';

export const FRONT_DEFAULTS = {
  construction: 'overlay',
  gap: 0.004,
  frameWidth: 0.02,
  reveal: 0.0025,
  thickness: 0.02,
  minDrawerH: 0.09,
  maxDrawerH: 0.3,
  minDrawerW: 0.22,
  maxDrawerW: 1.0,
  minDoorW: 0.22,
  maxDoorW: 0.6,
  maxWideDoorW: 0.7,
  minOpenW: 0.18,
  minOpenH: 0.12,
  maxDoorH: Infinity,
  maxFronts: 16,
  grainMode: 'classic',
  fallback: { leaf: 'doors', hinge: 'auto' },
};

const EPS = 1e-9;
const DEGRADE_ORDER = ['none', 'counts', 'collapsed', 'fallback'];

const isLeaf = (node) => typeof node.leaf === 'string';
const containsOpen = (node) => (isLeaf(node) ? node.leaf === 'open' : node.children.some(containsOpen));
const leavesOf = (node) => (isLeaf(node) ? [node] : node.children.flatMap(leavesOf));

function separator(o, a, b) {
  if (o.construction === 'inset') return o.frameWidth;
  return containsOpen(a) || containsOpen(b) ? o.frameWidth : o.gap;
}

const innerSep = (o) => (o.construction === 'inset' ? o.frameWidth : o.gap);

function minSize(node, axis, o) {
  if (isLeaf(node)) {
    const sep = innerSep(o);
    if (node.leaf === 'drawers') {
      if (axis === 'y') {
        const n = node.count ?? 1;
        return n * o.minDrawerH + (n - 1) * sep;
      }
      const a = Math.max(node.across ?? 1, node.acrossTop ?? 1);
      return a * o.minDrawerW + (a - 1) * sep;
    }
    if (node.leaf === 'doors') return axis === 'x' ? (node.hinge === 'bottom' ? o.minDrawerW : o.minDoorW) : o.minOpenH;
    return axis === 'x' ? o.minOpenW : o.minOpenH;
  }
  const mins = node.children.map((child) => minSize(child, axis, o));
  if (node.split !== axis) return Math.max(...mins);
  const seps = node.children.slice(1).reduce((sum, child, i) => sum + separator(o, node.children[i], child), 0);
  return mins.reduce((a, b) => a + b, 0) + seps;
}

function fixedSizeOf(node, i) {
  const size = node.sizes?.[i] ?? node.children[i].size;
  return typeof size === 'number' ? size : null;
}

function shareSizes(node, span, o) {
  const n = node.children.length;
  const seps = node.children.slice(1).map((child, i) => separator(o, node.children[i], child));
  const available = span - seps.reduce((a, b) => a + b, 0);
  const mins = node.children.map((child) => minSize(child, node.split, o));
  const minTotal = mins.reduce((a, b) => a + b, 0);
  const sizes = new Array(n).fill(0);
  const fixed = node.children.map((_, i) => fixedSizeOf(node, i));
  const weights = node.children.map((child, i) => Math.max(EPS, node.weights?.[i] ?? child.weight ?? 1));
  let reserved = 0;
  fixed.forEach((size, i) => {
    if (size === null) return;
    const othersMin = minTotal - mins[i];
    sizes[i] = Math.max(mins[i], Math.min(size, available - othersMin));
    reserved += sizes[i];
  });
  const pinned = new Set();
  for (let pass = 0; pass <= n; pass++) {
    const free = sizes.map((_, i) => i).filter((i) => fixed[i] === null && !pinned.has(i));
    const rest = available - reserved - [...pinned].reduce((sum, i) => sum + mins[i], 0);
    const total = free.reduce((sum, i) => sum + weights[i], 0);
    let changed = false;
    for (const i of free) {
      sizes[i] = (rest * weights[i]) / total;
      if (sizes[i] < mins[i] - EPS) {
        pinned.add(i);
        changed = true;
      }
    }
    for (const i of pinned) sizes[i] = mins[i];
    if (!changed) break;
  }
  return { sizes, seps, fits: minTotal + (span - available) <= span + 1e-9 };
}

function placeChildren(node, cell, o) {
  const axis = node.split;
  const lo = axis === 'x' ? cell.x0 : cell.y0;
  const hi = axis === 'x' ? cell.x1 : cell.y1;
  const { sizes, seps, fits } = shareSizes(node, hi - lo, o);
  const n = sizes.length;
  const ranges = new Array(n);
  let cursor = axis === 'x' ? lo : hi;
  for (let i = 0; i < n; i++) {
    if (axis === 'x') {
      ranges[i] = [cursor, cursor + sizes[i]];
      cursor += sizes[i] + (seps[i] ?? 0);
    } else {
      ranges[i] = [cursor - sizes[i], cursor];
      cursor -= sizes[i] + (seps[i] ?? 0);
    }
  }
  if (node.symmetric) {
    const centre = (lo + hi) / 2;
    for (let i = 0; i < n; i++) {
      const j = n - 1 - i;
      if (j < i) break;
      if (j === i) ranges[i] = [centre - sizes[i] / 2, centre + sizes[i] / 2];
      else ranges[j] = [2 * centre - ranges[i][1], 2 * centre - ranges[i][0]];
    }
  }
  const cells = ranges.map(([a, b]) => (axis === 'x' ? { ...cell, x0: a, x1: b } : { ...cell, y0: a, y1: b }));
  return { cells, fits };
}

function drawerHeights(H, n, grade, sep, o) {
  const available = H - (n - 1) * sep;
  let g = grade;
  for (let step = 0; step <= 40; step++) {
    if (step === 40) g = 1;
    const factors = Array.from({ length: n }, (_, i) => g ** i);
    const sum = factors.reduce((a, b) => a + b, 0);
    const heights = factors.map((f) => (available * f) / sum);
    const ok = heights.every((h) => h >= o.minDrawerH - 1e-9 && h <= o.maxDrawerH + 1e-9);
    if (ok || g === 1) return heights;
    g = 1 + (g - 1) * 0.85;
  }
  return [];
}

function acrossCount(W, a, sep, o) {
  let count = Math.max(a, Math.ceil((W + sep) / (o.maxDrawerW + sep) - 1e-9));
  while (count > 1 && (W - (count - 1) * sep) / count < o.minDrawerW - 1e-9) count--;
  return count;
}

function splitEven(lo, hi, count, gap) {
  const size = (hi - lo - (count - 1) * gap) / count;
  return Array.from({ length: count }, (_, i) => [lo + i * (size + gap), lo + i * (size + gap) + size]);
}

function createState(o, field) {
  const inset = o.construction === 'inset';
  const z1 = inset ? field.z - 0.001 : field.z;
  return {
    o, inset, field, z0: z1 - o.thickness, z1,
    fronts: [], open: [], members: [], closed: [], failures: [], leafIndex: 0,
    wideDoors: false, symmetric: false,
  };
}

function addFront(state, kind, cell, extra) {
  const { o, inset } = state;
  const r = inset ? o.reveal : 0;
  const grain = o.grainMode === 'continuous' || kind !== 'door' ? 'x' : 'y';
  state.fronts.push({
    kind,
    x0: cell.x0 + r, x1: cell.x1 - r, y0: cell.y0 + r, y1: cell.y1 - r,
    z0: state.z0, z1: state.z1, grain, index: state.fronts.length, ...extra,
  });
}

function addMember(state, axis, rect, full) {
  if (rect.x1 - rect.x0 < EPS || rect.y1 - rect.y0 < EPS) return;
  state.members.push({ axis, x0: rect.x0, x1: rect.x1, y0: rect.y0, y1: rect.y1, depth: full ? 'full' : 'face' });
}

function solveDrawers(state, node, cell) {
  const { o, inset } = state;
  const sep = innerSep(o);
  const H = cell.y1 - cell.y0;
  const W = cell.x1 - cell.x0;
  const lo = Math.ceil((H + sep) / (o.maxDrawerH + sep) - 1e-9);
  const hi = Math.floor((H + sep) / (o.minDrawerH + sep) + 1e-9);
  if (hi < 1 || W < o.minDrawerW - 1e-9) return state.failures.push({ node, reason: 'drawers' });
  const want = node.count ?? 1;
  const n = Math.max(1, Math.min(node.capped ? want : Math.max(want, lo), hi));
  const heights = drawerHeights(H, n, node.grade ?? 1, sep, o);
  const leaf = state.leafIndex++;
  let top = cell.y1;
  heights.forEach((h, row) => {
    const rowCell = { ...cell, y0: top - h, y1: top };
    const across = acrossCount(W, row === 0 ? node.acrossTop ?? node.across ?? 1 : node.across ?? 1, sep, o);
    splitEven(cell.x0, cell.x1, across, sep).forEach(([x0, x1], col) => {
      addFront(state, 'drawer', { ...rowCell, x0, x1 }, { hinge: null, leaf, bay: leaf, row, col });
      if (inset && col > 0) addMember(state, 'y', { x0: x0 - sep, x1: x0, y0: rowCell.y0, y1: rowCell.y1 }, false);
    });
    if (inset && row > 0) addMember(state, 'x', { x0: cell.x0, x1: cell.x1, y0: top, y1: top + sep }, false);
    top -= h + sep;
  });
  state.closed.push({ x0: cell.x0, x1: cell.x1, y0: cell.y0, y1: cell.y1 });
}

function doorLeafCount(W, o) {
  if (W <= o.maxDoorW + 1e-9) return 1;
  if (W <= 2 * o.maxWideDoorW + 1e-9) return 2;
  return 2 * Math.ceil(W / (2 * o.maxDoorW) - 1e-9);
}

function autoHinge(x0, x1, mirror, explicit) {
  if (explicit === 'left' || explicit === 'right') return mirror ? (explicit === 'left' ? 'right' : 'left') : explicit;
  const centre = (x0 + x1) / 2;
  return centre > 1e-6 ? 'right' : 'left';
}

function solveDoors(state, node, cell, mirror) {
  const { o, inset } = state;
  const sep = innerSep(o);
  const H = cell.y1 - cell.y0;
  const W = cell.x1 - cell.x0;
  const leaf = state.leafIndex++;
  if (node.hinge === 'bottom') {
    if (W < o.minDrawerW - 1e-9 || H < o.minOpenH - 1e-9) return state.failures.push({ node, reason: 'flap' });
    addFront(state, 'flap', cell, { hinge: 'bottom', leaf, bay: leaf, row: 0, col: 0 });
  } else {
    if (W < o.minDoorW - 1e-9 || H < o.minOpenH - 1e-9) return state.failures.push({ node, reason: 'doors' });
    const count = doorLeafCount(W, o);
    const rows = Number.isFinite(o.maxDoorH) ? Math.max(1, Math.ceil((H + sep) / (o.maxDoorH + sep) - 1e-9)) : 1;
    const leafGap = inset ? 0 : o.gap;
    const columns = splitEven(cell.x0, cell.x1, count, leafGap);
    if ((columns[0][1] - columns[0][0]) > o.maxDoorW + 1e-9) state.wideDoors = true;
    splitEven(cell.y0, cell.y1, rows, sep).reverse().forEach(([y0, y1], row) => {
      columns.forEach(([x0, x1], col) => {
        const hinge = count === 1 ? autoHinge(x0, x1, mirror, node.hinge) : col % 2 === 0 ? 'left' : 'right';
        addFront(state, 'door', { ...cell, x0, x1, y0, y1 }, { hinge, leaf, bay: leaf, row, col });
      });
      if (inset && row > 0) addMember(state, 'x', { x0: cell.x0, x1: cell.x1, y0: y1, y1: y1 + sep }, false);
    });
  }
  state.closed.push({ x0: cell.x0, x1: cell.x1, y0: cell.y0, y1: cell.y1 });
}

function solveOpen(state, node, cell) {
  const { o } = state;
  const H = cell.y1 - cell.y0;
  const W = cell.x1 - cell.x0;
  if (W < o.minOpenW - 1e-9 || H < o.minOpenH - 1e-9) return state.failures.push({ node, reason: 'open' });
  const s = Math.max(0, Math.min(node.shelves ?? 0, Math.floor(H / o.minOpenH + 1e-9) - 1));
  const shelves = Array.from({ length: s }, (_, k) => cell.y0 + ((k + 1) * H) / (s + 1));
  state.leafIndex++;
  state.open.push({ x0: cell.x0, x1: cell.x1, y0: cell.y0, y1: cell.y1, shelves });
}

function solveNode(state, node, cell, mirror) {
  if (isLeaf(node)) {
    if (node.leaf === 'drawers') return solveDrawers(state, node, cell);
    if (node.leaf === 'doors') return solveDoors(state, node, cell, mirror);
    if (node.leaf === 'open') return solveOpen(state, node, cell);
    throw new Error(`solveFronts: unknown leaf "${node.leaf}"`);
  }
  if (node.symmetric) state.symmetric = true;
  const { cells, fits } = placeChildren(node, cell, state.o);
  if (!fits) state.failures.push({ node, reason: 'split' });
  const n = node.children.length;
  node.children.forEach((child, i) => {
    const childMirror = node.split === 'x' && node.symmetric && i > (n - 1) / 2 ? !mirror : mirror;
    solveNode(state, child, cells[i], childMirror);
    if (i === 0) return;
    const full = containsOpen(child) || containsOpen(node.children[i - 1]);
    if (!state.inset && !full) return;
    const prev = cells[i - 1], cur = cells[i];
    if (node.split === 'x') addMember(state, 'y', { x0: prev.x1, x1: cur.x0, y0: cell.y0, y1: cell.y1 }, full);
    else addMember(state, 'x', { x0: cell.x0, x1: cell.x1, y0: cur.y1, y1: prev.y0 }, full);
  });
}

function mergeClosed(rects, tolerance) {
  const list = rects.map((r) => ({ ...r }));
  const same = (a, b) => Math.abs(a - b) < 1e-7;
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const stackY = same(a.x0, b.x0) && same(a.x1, b.x1) && (Math.abs(a.y0 - b.y1) <= tolerance || Math.abs(b.y0 - a.y1) <= tolerance);
        const sideX = same(a.y0, b.y0) && same(a.y1, b.y1) && (Math.abs(a.x0 - b.x1) <= tolerance || Math.abs(b.x0 - a.x1) <= tolerance);
        if (!stackY && !sideX) continue;
        list[i] = { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1) };
        list.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
  return list;
}

function layoutOnce(plan, field, o) {
  const state = createState(o, field);
  solveNode(state, plan, { x0: field.x0, x1: field.x1, y0: field.y0, y1: field.y1 }, false);
  return state;
}

function parentsOf(root) {
  const parents = new Map();
  const walk = (node) => {
    if (isLeaf(node)) return;
    for (const child of node.children) {
      parents.set(child, node);
      walk(child);
    }
  };
  walk(root);
  return parents;
}

function reduceCounts(node, axis) {
  const keys = axis === 'x' ? ['acrossTop', 'across'] : axis === 'y' ? ['count', 'shelves'] : ['count', 'across', 'acrossTop', 'shelves'];
  let best = null;
  for (const leaf of leavesOf(node)) {
    for (const key of keys) {
      const floor = key === 'shelves' ? 0 : 1;
      const value = leaf[key] ?? (key === 'count' || key === 'across' ? 1 : null);
      if (value === null || value <= floor) continue;
      if (!best || value > best.value) best = { leaf, key, value };
    }
  }
  if (!best) return false;
  best.leaf[best.key] = best.value - 1;
  if (best.key === 'count') best.leaf.capped = true;
  return true;
}

function collapse(root, split) {
  const n = split.children.length;
  const weights = split.children.map((child, i) => split.weights?.[i] ?? child.weight ?? 1);
  const sizes = split.children.map((_, i) => fixedSizeOf(split, i));
  let keep;
  if (split.symmetric && n >= 3) {
    keep = Array.from({ length: n - 2 }, (_, i) => i + 1);
    weights[1] += weights[0];
    weights[n - 2] += weights[n - 1];
  } else {
    keep = Array.from({ length: n - 1 }, (_, i) => i);
    weights[n - 2] += weights[n - 1];
  }
  split.children = keep.map((i) => split.children[i]);
  split.weights = keep.map((i) => weights[i]);
  split.sizes = keep.map((i) => sizes[i]);
  if (split.children.length > 1) return root;
  const only = split.children[0];
  if (split === root) return only;
  const parent = parentsOf(root).get(split);
  parent.children[parent.children.indexOf(split)] = only;
  return root;
}

function nearestSplit(root, node) {
  if (!isLeaf(node)) return node;
  return parentsOf(root).get(node) ?? null;
}

function largestSplit(root) {
  if (isLeaf(root)) return null;
  let best = root;
  const walk = (node) => {
    if (isLeaf(node)) return;
    if (leavesOf(node).length > 1 && node.children.length >= best.children.length) best = node;
    node.children.forEach(walk);
  };
  walk(root);
  return best;
}

function finish(state, degraded) {
  const { fronts, open, members } = state;
  const sep = Math.max(state.o.gap, state.o.frameWidth);
  const closed = mergeClosed(state.closed, sep + 1e-7);
  const drawers = fronts.filter((f) => f.kind === 'drawer').length;
  return {
    fronts, open, members, closed, face: state.field.z,
    stats: {
      drawers, doors: fronts.length - drawers, open: open.length, fronts: fronts.length,
      degraded, symmetric: state.symmetric, wideDoors: state.wideDoors,
    },
  };
}

export function solveFronts(plan, field, opts = {}) {
  const o = { ...FRONT_DEFAULTS, ...opts };
  let current = structuredClone(plan);
  let degraded = 'none';
  const raise = (level) => {
    if (DEGRADE_ORDER.indexOf(level) > DEGRADE_ORDER.indexOf(degraded)) degraded = level;
  };
  for (let step = 0; step < 200; step++) {
    const state = layoutOnce(current, field, o);
    const tooMany = state.fronts.length > o.maxFronts;
    if (!state.failures.length && !tooMany) return finish(state, degraded);
    const failure = state.failures[0];
    if (failure) {
      const split = failure.reason === 'split' ? failure.node : null;
      if (split && reduceCounts(split, split.split)) {
        raise('counts');
        continue;
      }
      const target = split ?? nearestSplit(current, failure.node);
      if (!target || isLeaf(target)) break;
      current = collapse(current, target);
      raise('collapsed');
      continue;
    }
    if (reduceCounts(current, null)) {
      raise('counts');
      continue;
    }
    const target = largestSplit(current);
    if (!target) break;
    current = collapse(current, target);
    raise('collapsed');
  }
  return finish(layoutOnce(structuredClone(o.fallback), field, o), 'fallback');
}

const DOOR_KIND = { cup: 'bar' };
const ROUND_KINDS = new Set(['knob', 'cup', 'tab', 'ring']);
const INSIDE = 0.008;
const snap32 = (length) => Math.round(length / 0.032) * 0.032;

function footprint(kind, hw) {
  if (kind === 'ring') return [hw.ringDiameter, hw.ringDiameter * RING_DROP];
  if (kind === 'cup') return [hw.cupWidth, hw.cupHeight];
  if (kind === 'tab') return [hw.tabWidth, hw.tabLength];
  return [hw.knobDiameter, hw.knobDiameter];
}

function fitKnob(hw, h) {
  return Math.max(0.018, Math.min(hw.knobDiameter, 0.6 * h));
}

function fitBar(length, room) {
  let fit = Math.min(0.32, Math.max(0.096, length));
  fit = snap32(fit);
  while (fit > room + 1e-9 && fit > 0.064 + 1e-9) fit = Math.max(0.064, snap32(fit - 0.032));
  return Math.min(fit, Math.max(0.02, room));
}

function drawerSlotY(front, hw, extent) {
  const h = front.y1 - front.y0;
  const yc = (front.y0 + front.y1) / 2;
  let y;
  if (hw.vPos === 'top' || front.kind === 'flap') y = front.y1 - Math.max(0.025, Math.min(0.06, 0.3 * h));
  else y = h > 0.24 ? front.y1 - h / 3 : yc;
  const half = extent / 2;
  return Math.min(front.y1 - INSIDE - half, Math.max(front.y0 + INSIDE + half, y));
}

export function handleSlots(front, handle) {
  const hw = normalizeHandle(handle);
  const isDoor = front.kind === 'door';
  let kind = isDoor ? hw.doorKind ?? DOOR_KIND[hw.kind] ?? hw.kind : hw.kind;
  if (kind === 'none') return [];
  const w = front.x1 - front.x0;
  const h = front.y1 - front.y0;
  const z = front.z1;
  const xc = (front.x0 + front.x1) / 2;
  const yc = (front.y0 + front.y1) / 2;
  if (kind === 'cutout' && (h < 0.09 || w < 0.12)) kind = 'groove';
  if (kind === 'groove') return [{ kind, x: xc, y: front.y1, z, axis: isDoor ? 'y' : 'x', length: isDoor ? h : w, side: isDoor ? (front.hinge === 'left' ? 'right' : 'left') : 'top' }];

  if (!isDoor) {
    if (kind === 'lip') {
      const length = Math.max(0.04, Math.min(w - 2 * INSIDE, hw.lipFraction * w));
      return [{ kind, x: xc, y: front.y1 - hw.lipHeight / 2, z, axis: 'x', length, size: hw.lipHeight }];
    }
    if (kind === 'cutout') {
      const width = Math.min(hw.cutoutWidth, 0.6 * w);
      const height = Math.min(hw.cutoutHeight, 0.4 * h);
      const y = hw.cutoutShape === 'notch' ? front.y1 - height / 2 : drawerSlotY(front, hw, height);
      return [{ kind, x: xc, y, z, axis: 'x', length: width, size: height }];
    }
    if (kind === 'bar') {
      const pair = w > 0.96;
      const room = pair ? w / 2 - 0.02 : w - 2 * INSIDE;
      const length = fitBar(hw.barLength ?? hw.barScale * (w / 3), room);
      const y = drawerSlotY(front, hw, hw.barDiameter);
      const xs = pair ? [xc - w / 4, xc + w / 4] : [xc];
      return xs.map((x) => ({ kind, x, y, z, axis: 'x', length, size: hw.barDiameter }));
    }
    const pair = w > 0.7;
    let [length, size] = footprint(kind, hw);
    if (kind === 'knob') length = size = fitKnob(hw, h);
    if (kind === 'ring') {
      length = Math.max(0.02, Math.min(hw.ringDiameter, (h - 2 * INSIDE) / RING_DROP));
      size = length * RING_DROP;
    }
    if (kind === 'cup') size = Math.min(size, h - 2 * INSIDE);
    if (kind === 'tab') size = Math.min(size, h - 2 * INSIDE);
    const y = drawerSlotY(front, hw, size);
    const xs = pair ? [xc - w / 4, xc + w / 4] : [xc];
    return xs.map((x) => ({ kind, x, y, z, axis: 'x', length, size }));
  }

  const opening = front.hinge === 'right' ? -1 : 1;
  const edge = opening > 0 ? front.x1 : front.x0;
  const short = h < 0.3;
  if (kind === 'lip') {
    const length = Math.max(0.06, Math.min(h - 2 * INSIDE, Math.max(0.12, Math.min(0.4, 0.4 * h))));
    const top = short ? yc + length / 2 : front.y1 - hw.doorDrop;
    const y = Math.max(front.y0 + INSIDE + length / 2, top - length / 2);
    return [{ kind, x: edge - opening * hw.lipHeight / 2, y, z, axis: 'y', length, size: hw.lipHeight }];
  }
  if (kind === 'bar' || kind === 'cutout') {
    const room = h - 2 * INSIDE;
    const width = kind === 'cutout' ? Math.min(hw.cutoutWidth, 0.6 * h) : fitBar(hw.barLength ?? hw.barScale * (h / 3), Math.min(room, 0.6 * h));
    const size = kind === 'cutout' ? Math.min(hw.cutoutHeight, 0.4 * w) : hw.barDiameter;
    const inset = Math.max(hw.doorInset, size / 2 + INSIDE);
    const top = short ? yc + width / 2 : front.y1 - hw.doorDrop;
    const y = Math.max(front.y0 + INSIDE + width / 2, Math.min(front.y1 - INSIDE - width / 2, top - width / 2));
    return [{ kind, x: edge - opening * inset, y, z, axis: 'y', length: width, size }];
  }
  let [length, size] = footprint(kind, hw);
  if (kind === 'knob') length = size = fitKnob(hw, Math.min(h, w));
  const inset = Math.max(hw.doorInset, length / 2 + INSIDE);
  const yTarget = short ? yc : front.y1 - hw.doorDrop;
  const y = Math.max(front.y0 + INSIDE + size / 2, Math.min(front.y1 - INSIDE - size / 2, yTarget));
  return [{ kind, x: edge - opening * inset, y, z, axis: ROUND_KINDS.has(kind) ? 'x' : 'y', length, size }];
}

export const HANDLE_BUDGET = 2200;

export function planHandles(layout, handle) {
  const hw = normalizeHandle(handle);
  const perFront = layout.fronts.map((front) => handleSlots(front, hw));
  const tris = (slots) => slots.reduce((sum, slot) => sum + handleTris(slot.kind, hw), 0);
  let total = perFront.reduce((sum, slots) => sum + tris(slots), 0);
  const slots = perFront.map((list, i) => {
    const front = layout.fronts[i];
    if (total <= HANDLE_BUDGET || list.length < 2 || front.kind === 'door') return list;
    total -= tris(list.slice(1));
    return [{ ...list[0], x: (front.x0 + front.x1) / 2 }];
  });
  return slots.flatMap((list, i) => list.map((slot) => ({ ...slot, front: i })));
}

function rectOutline(w, h) {
  return [new THREE.Vector2(-w / 2, -h / 2), new THREE.Vector2(w / 2, -h / 2), new THREE.Vector2(w / 2, h / 2), new THREE.Vector2(-w / 2, h / 2)];
}

function stadiumPath(cx, cy, width, height, steps = 4) {
  const r = Math.min(height, width) / 2;
  const vertical = height > width;
  const half = (vertical ? height : width) / 2 - r;
  const start = vertical ? 0 : -Math.PI / 2;
  const pts = [];
  for (const end of [1, -1]) {
    const ex = vertical ? 0 : end * half, ey = vertical ? end * half : 0;
    const from = start + (end > 0 ? 0 : Math.PI);
    for (let i = 0; i <= steps; i++) {
      const a = from + (i / steps) * Math.PI;
      pts.push(new THREE.Vector2(cx + ex + Math.cos(a) * r, cy + ey + Math.sin(a) * r));
    }
  }
  return pts;
}

function notchedOutline(w, h, cx, cut, steps = 6) {
  const half = Math.min(cut.width / 2, w / 2 - 0.01);
  const depth = Math.min(cut.height, h * 0.4);
  const pts = [new THREE.Vector2(-w / 2, -h / 2), new THREE.Vector2(w / 2, -h / 2), new THREE.Vector2(w / 2, h / 2)];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    pts.push(new THREE.Vector2(cx + Math.cos(a) * half, h / 2 - Math.sin(a) * depth));
  }
  pts.push(new THREE.Vector2(-w / 2, h / 2));
  return pts;
}

function grooved(front, groove, side) {
  if (!(groove > 0)) return front;
  if (side === 'left') return { ...front, x0: front.x0 + groove };
  if (side === 'right') return { ...front, x1: front.x1 - groove };
  return { ...front, y1: front.y1 - groove };
}

export function frontPanel(front, { thickness, bevel = 0.003, style = 'slab', frameWidth = 0.05, cut = null, groove = 0, grooveSide = 'top' }, mats) {
  const group = new THREE.Group();
  const f = grooved(front, groove, grooveSide);
  const w = f.x1 - f.x0, h = f.y1 - f.y0;
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  const zc = front.z1 - thickness / 2;
  const b = Math.min(bevel, thickness * 0.3, w / 4, h / 4);
  if (style === 'slab') {
    let outline;
    if (cut?.kind === 'notch') {
      outline = new THREE.Shape(notchedOutline(w, h, cut.x - cx, cut));
    } else if (cut) {
      outline = new THREE.Shape(rectOutline(w, h));
      const hole = stadiumPath(cut.x - cx, cut.y - cy, Math.min(cut.width, w * 0.6), Math.min(cut.height, h * 0.4)).reverse();
      outline.holes.push(new THREE.Path(hole));
    } else {
      outline = rectOutline(w, h);
    }
    const mesh = new THREE.Mesh(extrudeProfile(outline, thickness, b, 'front'), mats.front);
    mesh.position.set(cx, cy, zc);
    group.add(grainAlong(mesh, front.grain ?? 'x'));
    return group;
  }
  const fw = Math.max(0.01, Math.min(frameWidth, 0.2 * Math.min(w, h)));
  const radius = Math.min(b, fw * 0.2);
  const stile = (x) => group.add(beam(new THREE.Vector3(x, f.y0, zc), new THREE.Vector3(x, f.y1, zc), fw, thickness, radius, mats.front));
  const rail = (y) => group.add(beam(new THREE.Vector3(f.x0 + fw, y, zc), new THREE.Vector3(f.x1 - fw, y, zc), thickness, fw, radius, mats.front));
  stile(f.x0 + fw / 2);
  stile(f.x1 - fw / 2);
  rail(f.y1 - fw / 2);
  rail(f.y0 + fw / 2);
  const panelT = thickness * 0.5;
  const overlap = Math.min(0.004, fw * 0.4);
  const panelMat = style === 'insert' ? mats.insert ?? mats.front : mats.front;
  const panel = new THREE.Mesh(extrudeProfile(rectOutline(w - 2 * fw + 2 * overlap, h - 2 * fw + 2 * overlap), panelT, Math.min(0.0015, panelT * 0.3), 'front'), panelMat);
  panel.position.set(cx, cy, front.z1 - 0.006 - panelT / 2);
  group.add(grainAlong(panel, front.grain ?? 'x'));
  return group;
}

export function buildCarcass({ width, depth, y0, y1, panel, back = 0.01, sides = true, bottom = true, construction = 'overlay', frontThickness = 0.02, edge = 0.002, x = 0, radius = 0.002 }, mat) {
  const parts = [];
  const inset = construction === 'inset';
  const zFront = inset ? depth / 2 : depth / 2 - frontThickness;
  const zBack = -depth / 2;
  const carcassDepth = zFront - zBack;
  const zc = (zFront + zBack) / 2;
  const v3 = (px, py, pz) => new THREE.Vector3(px, py, pz);
  const inner = width / 2 - (sides ? panel : 0);
  if (sides) {
    for (const sx of [-1, 1]) {
      const px = x + sx * (width / 2 - panel / 2);
      parts.push(beam(v3(px, y0, zc), v3(px, y1, zc), panel, carcassDepth, radius, mat));
    }
  }
  const backT = back > 0 ? back : 0;
  if (backT > 0) {
    const zb = zBack + backT / 2;
    parts.push(beam(v3(x - inner, (y0 + y1) / 2, zb), v3(x + inner, (y0 + y1) / 2, zb), backT, y1 - y0, Math.min(radius, backT * 0.3), mat));
  }
  if (bottom) {
    const zb = (zFront + zBack + backT) / 2;
    parts.push(beam(v3(x - inner, y0 + panel / 2, zb), v3(x + inner, y0 + panel / 2, zb), carcassDepth - backT, panel, radius, mat));
  }
  const opening = { x0: x - inner, x1: x + inner, y0: y0 + (bottom ? panel : 0), y1 };
  const field = inset
    ? { ...opening, z: depth / 2 }
    : { x0: x - width / 2 + edge, x1: x + width / 2 - edge, y0: y0 + edge, y1: y1 - edge, z: depth / 2 };
  return { parts, field, opening, innerDepth: depth - backT };
}

function clipRect(rect, clip) {
  if (!clip) return rect;
  const r = { x0: Math.max(rect.x0, clip.x0), x1: Math.min(rect.x1, clip.x1), y0: Math.max(rect.y0, clip.y0), y1: Math.min(rect.y1, clip.y1) };
  return r.x1 - r.x0 > 1e-6 && r.y1 - r.y0 > 1e-6 ? r : null;
}

function slabBox(rect, z0, z1, mat) {
  const t = z1 - z0;
  const y = (rect.y0 + rect.y1) / 2;
  const z = (z0 + z1) / 2;
  const radius = Math.min(0.002, t * 0.3);
  return beam(new THREE.Vector3(rect.x0, y, z), new THREE.Vector3(rect.x1, y, z), t, rect.y1 - rect.y0, radius, mat);
}

function memberBox(member, zFront, depth, mat) {
  const z0 = zFront - depth;
  if (member.axis === 'x') return slabBox(member, z0, zFront, mat);
  const x = (member.x0 + member.x1) / 2;
  const z = (z0 + zFront) / 2;
  return beam(new THREE.Vector3(x, member.y0, z), new THREE.Vector3(x, member.y1, z), member.x1 - member.x0, depth, Math.min(0.002, (member.x1 - member.x0) * 0.3), mat);
}

export function buildFronts(layout, {
  thickness = FRONT_DEFAULTS.thickness, bevel = 0.003, drawerStyle = 'slab', doorStyle = 'slab', frameWidth = 0.05,
  doorFrameWidth = frameWidth, members = true, backers = true, memberDepth = 0.02, fullDepth = memberDepth,
  backerThickness = 0.012, opening = null, shelfThickness = 0.018, groove = 0.022,
} = {}, handle = { kind: 'none' }, mats = {}) {
  const hw = normalizeHandle(handle);
  const parts = [];
  const slots = planHandles(layout, hw);
  const carcassMat = mats.carcass ?? mats.front;
  layout.fronts.forEach((front, i) => {
    const own = slots.filter((slot) => slot.front === i);
    const isDoor = front.kind === 'door';
    const wanted = isDoor ? doorStyle : drawerStyle;
    const style = wanted !== 'slab' && (isDoor || front.y1 - front.y0 >= 0.15) ? wanted : 'slab';
    const cutSlot = own.find((slot) => slot.kind === 'cutout');
    const grooveSlot = own.find((slot) => slot.kind === 'groove');
    const notch = cutSlot && !isDoor && hw.cutoutShape === 'notch';
    const cut = style === 'slab' && cutSlot
      ? (cutSlot.axis === 'y'
        ? { kind: 'slot', x: cutSlot.x, y: cutSlot.y, width: cutSlot.size, height: cutSlot.length }
        : { kind: notch ? 'notch' : 'slot', x: cutSlot.x, y: cutSlot.y, width: cutSlot.length, height: cutSlot.size })
      : null;
    const grooveDepth = grooveSlot || (cutSlot && style !== 'slab') ? groove : 0;
    const grooveSide = grooveSlot?.side ?? 'top';
    parts.push(frontPanel(front, {
      thickness: front.z1 - front.z0, bevel, style, frameWidth: isDoor ? doorFrameWidth : frameWidth, cut, groove: grooveDepth, grooveSide,
    }, mats));
  });
  for (const slot of slots) {
    if (!HANDLE_KINDS[slot.kind]?.part) continue;
    parts.push(buildHandle(slot, hw, mats.hardware ?? mats.front));
  }
  if (members) {
    for (const member of layout.members) {
      const clipped = clipRect(member, opening);
      if (clipped) parts.push(memberBox({ ...member, ...clipped }, layout.face, member.depth === 'full' ? fullDepth : memberDepth, carcassMat));
    }
    const z = layout.face - 0.01;
    for (const cell of layout.open) {
      for (const y of cell.shelves) {
        parts.push(slabBox({ x0: cell.x0, x1: cell.x1, y0: y - shelfThickness / 2, y1: y + shelfThickness / 2 }, z - fullDepth + 0.01, z, carcassMat));
      }
    }
  }
  if (backers && layout.fronts.length) {
    const z1 = layout.fronts[0].z0;
    for (const rect of layout.closed) {
      const clipped = clipRect(rect, opening);
      if (clipped) parts.push(slabBox(clipped, z1 - backerThickness, z1, carcassMat));
    }
  }
  return parts;
}
