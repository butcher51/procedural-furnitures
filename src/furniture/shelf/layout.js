import * as THREE from 'three';
import { endPanelShape, extrudeProfile } from '../../core/geometry.js';
import { rowAnchors } from '../../core/supports.js';

export const BEAM_TRIS = 44;
export const BACK_INSET = 0.004;
export const DISPLAY_CAP = 1.4;
export const DISPLAY_CLEAR = 0.3;
export const TOP_BOARD = 1.2;
export const LEAN_TOP_MARGIN = 0.24;
export const LEAN_TOP_CLEAR = 0.22;
export const LEAN_Y0_NOMINAL = 0.21;
export const LADDER_Y0 = 0.22;
export const LADDER_TOP_CLEAR = 0.23;
export const LADDER_MARGIN = { 1: 0.36, 2: 0.46 };
export const CUBE_MAX_BASE = 0.18;
export const BASE_RANGE = {
  bookcase: [0.05, 0.22], open: [0.05, 0.15], cube: [0, 0.18], leaning: [0.12, 0.3], ladder: [0, 0],
};
export const MIN_GAP = 0.22;
export const MIN_GAP_GRADED = 0.2;
export const MAX_GAP = 0.42;

const tris = new Map();
function measured(key, make) {
  if (!tris.has(key)) {
    const geometry = make();
    tris.set(key, geometry.attributes.position.count / 3);
    geometry.dispose();
  }
  return tris.get(key);
}

export const panelTris = (cut) => measured(`panel-${cut}`, () => extrudeProfile(endPanelShape(0.3, 1, { cut, cutWidth: 0.18, cutHeight: 0.08 }), 0.02, 0.002));
export const railTris = () => measured('rail', () => extrudeProfile([new THREE.Vector2(0, 0), new THREE.Vector2(0.04, 0), new THREE.Vector2(0.1, 1), new THREE.Vector2(0.06, 1)], 0.03, 0.002));

function gapWeights(count, graded) {
  if (count <= 0) return [];
  const raw = Array.from({ length: count }, (_, i) => (graded && count > 1 ? 1.25 - (0.25 * i) / (count - 1) : 1));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / total);
}

export function levels(p) {
  const n = p.shelfCount;
  const t = p.boardThickness;
  const graded = p.shelfSpacing === 'graded';
  const bh = p.baseHeight;
  const tops = [];
  const clears = [];
  if (p.style === 'bookcase') {
    const y0 = bh + t;
    const avail = p.height - TOP_BOARD * t - y0 - (n - 1) * t;
    const w = gapWeights(n, graded);
    let y = y0;
    for (let i = 0; i < n; i++) {
      tops.push(y);
      clears.push(avail * w[i]);
      y += avail * w[i] + t;
    }
    return { tops, clears, gaps: clears, top: p.height };
  }
  if (p.style === 'open') {
    const total = p.height - bh - n * t;
    const w = gapWeights(n - 1, graded);
    let y = bh + t;
    for (let i = 0; i < n - 1; i++) {
      tops.push(y);
      clears.push(total * w[i]);
      y += total * w[i] + t;
    }
    return { tops, clears, gaps: clears, top: p.height };
  }
  if (p.style === 'cube') {
    for (let i = 0; i < p.rows; i++) {
      tops.push(bh + t + i * (p.cellSize + t));
      clears.push(p.cellSize);
    }
    return { tops, clears, gaps: clears, top: bh + p.rows * (p.cellSize + t) + t };
  }
  const y0 = p.style === 'ladder' ? LADDER_Y0 : bh;
  const yTop = p.height - (p.style === 'ladder' ? LADDER_MARGIN[p.rungCount] ?? LADDER_MARGIN[1] : LEAN_TOP_MARGIN);
  const w = gapWeights(n - 1, graded);
  let y = y0;
  for (let i = 0; i < n; i++) {
    tops.push(y);
    if (i < n - 1) {
      clears.push((yTop - y0) * w[i] - t);
      y += (yTop - y0) * w[i];
    } else clears.push(p.style === 'ladder' ? LADDER_TOP_CLEAR : LEAN_TOP_CLEAR);
  }
  return { tops, clears, gaps: clears.slice(0, n - 1), top: p.height, yTop };
}

export function gapViolation(p, n) {
  const [b0, b1] = BASE_RANGE[p.style];
  const lo = p.shelfSpacing === 'graded' ? MIN_GAP_GRADED : MIN_GAP;
  let worst = 0;
  for (const baseHeight of b0 === b1 ? [b0] : [b0, b1]) {
    for (const g of levels({ ...p, shelfCount: n, baseHeight }).gaps) worst = Math.max(worst, lo - g, g - MAX_GAP);
  }
  return worst;
}

export function chooseCount(p, target, lo, hi) {
  let best = lo;
  let bestScore = null;
  for (let n = lo; n <= hi; n++) {
    const violation = gapViolation(p, n);
    const score = [violation > 1e-9 ? violation : 0, Math.abs(n - target)];
    if (!bestScore || score[0] < bestScore[0] - 1e-12 || (Math.abs(score[0] - bestScore[0]) <= 1e-12 && score[1] < bestScore[1])) {
      best = n;
      bestScore = score;
    }
  }
  return best;
}

export const leanTan = (p) => Math.tan((p.leanAngle * Math.PI) / 180);

export function ladderOuter(p, y) {
  return p.depth / 2 - ((p.depth - p.topDepth) / 2) * (y / p.height);
}

export function leanFront(p, y) {
  return p.topDepth + (p.height - LEAN_TOP_MARGIN - y) * leanTan(p);
}

export function overallHeight(p) {
  if (p.style === 'cube') return p.height - CUBE_MAX_BASE + p.baseHeight;
  if (p.style === 'open') return p.height + (p.postProfile === 'square' ? p.postFinials : 0);
  return p.height;
}

function zExtent(p) {
  if (p.style === 'bookcase') return [-p.depth / 2, p.depth / 2 + p.topOverhang];
  if (p.style === 'leaning') return [-(p.backKind === 'panel' ? p.backThickness : 0), leanFront(p, 0)];
  return [-p.depth / 2, p.depth / 2];
}

export function zCentre(p) {
  const [lo, hi] = zExtent(p);
  return (lo + hi) / 2;
}

function backFront(p) {
  return p.style === 'open' ? -(p.depth / 2 - p.legThickness / 2) + p.backThickness / 2 + 0.002 : -p.depth / 2 + BACK_INSET + p.backThickness + 0.001;
}

function columns(p) {
  const hw = p.width / 2;
  if (p.style === 'bookcase') {
    const xin = hw - p.sideThickness;
    return p.bays === 1 ? [[-xin, xin]] : [[-xin, -p.boardThickness / 2], [p.boardThickness / 2, xin]];
  }
  if (p.style === 'cube') {
    return Array.from({ length: p.cols }, (_, j) => {
      const x0 = -hw + p.boardThickness + j * (p.cellSize + p.boardThickness);
      return [x0, x0 + p.cellSize];
    });
  }
  if (p.style === 'open') {
    const lt = p.legThickness;
    const xin = hw - lt;
    return p.bays === 1 ? [[-xin, xin]] : [[-xin, -lt / 2], [lt / 2, xin]];
  }
  const xin = hw - p.sideThickness;
  return [[-xin, xin]];
}

function rowBounds(p, y, clear) {
  if (p.style === 'ladder') return [-ladderOuter(p, y), ladderOuter(p, y)];
  if (p.style === 'leaning') return [0.001, leanFront(p, y + clear)];
  const hasBack = p.backKind === 'panel' || (p.style === 'open' && p.backKind === 'brace');
  return [hasBack ? backFront(p) : -p.depth / 2, p.depth / 2];
}

export function showsDisplay(p) {
  if (p.style === 'bookcase' || p.style === 'open') return p.height <= 1.1;
  return p.style === 'cube' && p.rows <= 2;
}

export function bays(p) {
  const lv = levels(p);
  const cols = columns(p);
  const shift = zCentre(p);
  const count = p.style === 'open' ? p.shelfCount - 1 : p.shelfCount;
  const out = [];
  for (let i = 0; i < count; i++) {
    const [zBack, zFront] = rowBounds(p, lv.tops[i], lv.clears[i]);
    cols.forEach(([x0, x1], j) => {
      out.push({
        id: `r${i}c${j}`,
        x0,
        x1,
        y: lv.tops[i],
        clear: lv.clears[i],
        zBack: zBack - shift,
        zFront: zFront - shift,
        back: p.backKind === 'panel',
      });
    });
  }
  if (showsDisplay(p)) {
    const inner = p.width / 2 - 0.01;
    out.push({
      id: 'top',
      x0: -inner,
      x1: inner,
      y: lv.top,
      clear: Math.min(DISPLAY_CLEAR, DISPLAY_CAP - lv.top),
      zBack: -p.depth / 2 + 0.01 - shift,
      zFront: p.depth / 2 - shift,
      back: false,
      top: true,
    });
  }
  return out;
}

const box = (role, x0, x1, y0, y1, z0, z1, axis = 'x', r = 0.003, name = role) => ({ t: 'box', role, x0, x1, y0, y1, z0, z1, axis, r, name, tris: BEAM_TRIS });

function legsPart(p, perRow, top, inset, width, depth) {
  const legParams = { legCount: p.legCount, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay };
  const fp = { width, depth, top, anchors: rowAnchors(width, depth, perRow, inset, inset) };
  return { t: 'legs', role: 'frame', legParams, fp, name: 'legs', tris: p.legCount * 4 * p.legSides };
}

function bookcaseParts(p) {
  const { width: W, depth: D, height: H, boardThickness: t, sideThickness: s, baseHeight: bh } = p;
  const hw = W / 2;
  const tt = TOP_BOARD * t;
  const o = p.topOverhang;
  const lv = levels(p);
  const panel = p.backKind === 'panel';
  const zShelf = panel ? -D / 2 + BACK_INSET + p.backThickness + 0.001 : -D / 2;
  const out = [];
  if (p.baseKind === 'cut') {
    for (const sx of [-1, 1]) {
      out.push({ t: 'panel', role: 'frame', x: sx * (hw - s / 2), thickness: s, depth: D, height: H - tt, cut: p.footCut, cutWidth: 0.6 * D, cutHeight: 0.8 * bh, name: 'side', tris: panelTris(p.footCut) });
    }
  } else {
    out.push(box('frame', -hw, -hw + s, bh, H - tt, -D / 2, D / 2, 'y', 0.003, 'side'), box('frame', hw - s, hw, bh, H - tt, -D / 2, D / 2, 'y', 0.003, 'side'));
  }
  out.push(box('frame', -hw - o, hw + o, H - tt, H, -D / 2, D / 2 + o, 'x', 0.004, 'top'));
  for (const [x0, x1] of columns(p)) {
    for (const y of lv.tops) out.push(box('boards', x0 - 0.001, x1 + 0.001, y - t, y, zShelf, D / 2, 'x', 0.003, 'shelf'));
  }
  if (p.bays === 2) out.push(box('frame', -t / 2, t / 2, bh, H - tt, zShelf, D / 2, 'y', 0.003, 'divider'));
  if (panel) out.push(box('back', -hw + s - 0.001, hw - s + 0.001, bh, H - tt, -D / 2 + BACK_INSET, -D / 2 + BACK_INSET + p.backThickness, 'y', 0.002, 'back'));
  if (p.baseKind === 'plinth') {
    const zk = D / 2 - p.plinthSetback;
    out.push(box('frame', -hw + s, hw - s, 0, bh, zk - 0.018, zk, 'x', 0.003, 'plinth'));
    out.push(box('frame', -hw, -hw + s, 0, bh, -D / 2, zk, 'z', 0.003, 'plinth'), box('frame', hw - s, hw, 0, bh, -D / 2, zk, 'z', 0.003, 'plinth'));
  } else if (p.baseKind === 'legs') {
    out.push(legsPart(p, p.legCount / 2, bh, p.legInset, W, D));
  }
  return out;
}

function cubeParts(p) {
  const { width: W, depth: D, boardThickness: t, cellSize: cs, rows, baseHeight: y0 } = p;
  const hw = W / 2;
  const Hc = rows * cs + (rows + 1) * t;
  const panel = p.backKind === 'panel';
  const zShelf = panel ? -D / 2 + BACK_INSET + p.backThickness + 0.001 : -D / 2;
  const out = [];
  out.push(box('frame', -hw, -hw + t, y0, y0 + Hc, -D / 2, D / 2, 'y', 0.004, 'side'), box('frame', hw - t, hw, y0, y0 + Hc, -D / 2, D / 2, 'y', 0.004, 'side'));
  out.push(box('frame', -hw, hw, y0 + Hc - t, y0 + Hc, -D / 2, D / 2, 'x', 0.004, 'top'));
  out.push(box('frame', -hw, hw, y0, y0 + t, -D / 2, D / 2, 'x', 0.004, 'bottom'));
  const cols = columns(p);
  for (let j = 1; j < cols.length; j++) {
    const x = cols[j][0] - t / 2;
    out.push(box('frame', x - t / 2, x + t / 2, y0 + t - 0.001, y0 + Hc - t + 0.001, zShelf, D / 2, 'y', 0.004, 'divider'));
  }
  for (const [x0, x1] of cols) {
    for (let k = 1; k < rows; k++) {
      const yb = y0 + k * (cs + t);
      out.push(box('boards', x0 - 0.001, x1 + 0.001, yb, yb + t, zShelf, D / 2, 'x', 0.004, 'shelf'));
    }
  }
  if (panel) out.push(box('back', -hw + t - 0.001, hw - t + 0.001, y0 + t - 0.001, y0 + Hc - t + 0.001, -D / 2 + BACK_INSET, -D / 2 + BACK_INSET + p.backThickness, 'y', 0.002, 'back'));
  if (p.baseKind === 'legs') out.push(legsPart(p, p.legCount / 2, y0, p.legInset, W, D));
  return out;
}

function beamPart(role, a, b, w, th, r, name) {
  return { t: 'beam', role, a, b, w, th, r, name, tris: BEAM_TRIS };
}

function openParts(p) {
  const { width: W, depth: D, height: H, boardThickness: t, legThickness: lt } = p;
  const hw = W / 2;
  const lv = levels(p);
  const out = [];
  const finial = p.postProfile === 'square' && p.postFinials > 0;
  const top = finial ? p.legHeight : p.legHeight - 0.003;
  out.push(legsPart(p, p.legCount / 2, top, lt / 2, W, D));
  for (const y of [...lv.tops, H]) out.push(box('boards', -hw, hw, y - t, y, -D / 2, D / 2, 'x', 0.003, 'shelf'));
  if (p.backKind === 'brace') {
    const bt = p.backThickness;
    const yLo = lv.tops[0] + 0.012;
    const yHi = H - t - 0.012;
    const xs = p.legCount === 6 ? [-(hw - lt / 2), 0, hw - lt / 2] : [-(hw - lt / 2), hw - lt / 2];
    const zr = -(D / 2 - lt / 2);
    for (let i = 0; i < xs.length - 1; i++) {
      out.push(beamPart('frame', new THREE.Vector3(xs[i], yLo, zr), new THREE.Vector3(xs[i + 1], yHi, zr), bt, bt, 0.002, 'brace'));
      out.push(beamPart('frame', new THREE.Vector3(xs[i], yHi, zr), new THREE.Vector3(xs[i + 1], yLo, zr), bt, bt, 0.002, 'brace'));
    }
    if (p.sideBraces) {
      const zf = D / 2 - lt / 2;
      for (const sx of [-1, 1]) {
        const x = sx * (hw - lt / 2);
        out.push(beamPart('frame', new THREE.Vector3(x, yLo, -zf), new THREE.Vector3(x, yHi, zf), bt, bt, 0.002, 'brace'));
        out.push(beamPart('frame', new THREE.Vector3(x, yHi, -zf), new THREE.Vector3(x, yLo, zf), bt, bt, 0.002, 'brace'));
      }
    }
  }
  return out;
}

function ladderParts(p) {
  const { width: W, height: H, boardThickness: t, sideThickness: s, railDepth: rd } = p;
  const lv = levels(p);
  const hw = W / 2;
  const out = [];
  const front = [[ladderOuter(p, 0) - rd, 0], [ladderOuter(p, 0), 0], [ladderOuter(p, H), H], [ladderOuter(p, H) - rd, H]];
  const rear = front.map(([z, y]) => [-z, y]);
  for (const sx of [-1, 1]) {
    for (const outline of [front, rear]) out.push({ t: 'rail', role: 'frame', x: sx * (hw - s / 2), thickness: s, outline, name: 'rail', tris: railTris() });
  }
  const xin = hw - s;
  for (const y of lv.tops) {
    const z = ladderOuter(p, y);
    out.push(box('boards', -xin - 0.001, xin + 0.001, y - t, y, -z, z, 'x', 0.003, 'shelf'));
  }
  const rungY = [lv.tops[p.shelfCount - 1] + 0.28, lv.tops[p.shelfCount - 1] + 0.4].slice(0, p.rungCount);
  for (const y of rungY) {
    const z = ladderOuter(p, y) - rd / 2;
    out.push({
      t: 'strut', role: 'frame', a: new THREE.Vector3(-(hw - s / 2), y, z), b: new THREE.Vector3(hw - s / 2, y, z), r: 0.01, sides: 8, name: 'rung', tris: 32,
    });
  }
  return out;
}

function leaningParts(p) {
  const { width: W, height: H, boardThickness: t, sideThickness: s, railDepth: wh } = p;
  const lv = levels(p);
  const hw = W / 2;
  const xin = hw - s;
  const y0 = p.baseHeight;
  const out = [];
  const outline = [[leanFront(p, 0) - wh, 0], [leanFront(p, 0), 0], [leanFront(p, H), H], [leanFront(p, H) - wh, H]];
  for (const sx of [-1, 1]) out.push({ t: 'rail', role: 'frame', x: sx * (hw - s / 2), thickness: s, outline, name: 'rail', tris: railTris() });
  for (const y of lv.tops) out.push(box('boards', -xin - 0.001, xin + 0.001, y - t, y, 0.001, leanFront(p, y), 'x', 0.003, 'shelf'));
  if (p.backKind === 'panel') out.push(box('back', -xin - 0.001, xin + 0.001, y0 - t, H, -p.backThickness, 0, 'y', 0.002, 'back'));
  if (p.baseKind === 'posts') {
    for (const sx of [-1, 1]) out.push(box('frame', sx * (xin - 0.02) - 0.0175, sx * (xin - 0.02) + 0.0175, 0, y0 - t, 0, 0.035, 'y', 0.003, 'rear'));
  } else {
    const zf = leanFront(p, y0);
    out.push(box('frame', -xin - 0.001, -xin + 0.018, 0, y0 - t, 0.001, zf, 'z', 0.003, 'crate'));
    out.push(box('frame', xin - 0.018, xin + 0.001, 0, y0 - t, 0.001, zf, 'z', 0.003, 'crate'));
    out.push(box('frame', -xin - 0.001, xin + 0.001, 0, y0 - t, zf - 0.018, zf, 'x', 0.003, 'crate'));
  }
  return out;
}

const PARTS = { bookcase: bookcaseParts, cube: cubeParts, open: openParts, ladder: ladderParts, leaning: leaningParts };

export function frameParts(p) {
  return PARTS[p.style](p);
}

export function frameTris(p) {
  return frameParts(p).reduce((sum, part) => sum + part.tris, 0);
}
