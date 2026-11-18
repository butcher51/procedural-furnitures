import * as THREE from 'three';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const HALF_PI = Math.PI / 2;

export const DRAPE_TRI_CAP = 900;

export const DRAPE_RES = {
  full: { top: 4, topU: 3, shoulder: 3, drape: 2, roll: 3, layer: 2 },
  low: { top: 3, topU: 2, shoulder: 2, drape: 2, roll: 2, layer: 2 },
};

export function pillowTriangles(grid = 6) {
  const g = Math.round(clamp(grid, 4, 8));
  return 4 * g * g + 8 * g;
}

export function pillow(w, h, t, mat, { pinch = 0.5, waist = 0.03, grid = 6, flatBottom = false } = {}) {
  const g = Math.round(clamp(grid, 4, 8));
  const p = clamp(pinch, 0, 0.8);
  const m = Math.min(w, h);
  const wa = clamp(waist, 0, 0.06) * m;
  const ts = (t / 2) * (1 - p);
  const us = Array.from({ length: g + 1 }, (_, i) => -1 + (2 * i) / g);
  const nearest = us.reduce((best, u) => (Math.abs(u) < Math.abs(best) ? u : best), 1);
  const bMax = (1 - nearest * nearest) ** 2;
  const belly = (u, v) => ((1 - u * u) * (1 - v * v)) / bMax;
  const xy = (u, v) => [u * (w / 2 - wa * (1 - v * v)), v * (h / 2 - wa * (1 - u * u))];
  const shift = flatBottom ? t / 2 - ts : 0;
  const topZ = (u, v) => (flatBottom ? ts + (t - 2 * ts) * belly(u, v) : ts + (t / 2 - ts) * belly(u, v)) - shift;
  const bottomZ = (u, v) => (flatBottom ? -ts : -(ts + (t / 2 - ts) * belly(u, v))) - shift;
  const positions = [];
  const vert = (u, v, top) => {
    const [x, y] = xy(u, v);
    return [x, y, top ? topZ(u, v) : bottomZ(u, v)];
  };
  const tri = (a, b, c) => positions.push(...a, ...b, ...c);
  for (let i = 0; i < g; i++) {
    for (let j = 0; j < g; j++) {
      const [u0, u1, v0, v1] = [us[i], us[i + 1], us[j], us[j + 1]];
      const A = vert(u0, v0, true), B = vert(u1, v0, true), C = vert(u1, v1, true), D = vert(u0, v1, true);
      tri(A, B, C);
      tri(A, C, D);
      const a = vert(u0, v0, false), b = vert(u1, v0, false), c = vert(u1, v1, false), d = vert(u0, v1, false);
      tri(a, c, b);
      tri(a, d, c);
    }
  }
  const ring = [];
  for (let i = 0; i < g; i++) ring.push([us[i], -1]);
  for (let j = 0; j < g; j++) ring.push([1, us[j]]);
  for (let i = g; i > 0; i--) ring.push([us[i], 1]);
  for (let j = g; j > 0; j--) ring.push([-1, us[j]]);
  ring.forEach(([u0, v0], k) => {
    const [u1, v1] = ring[(k + 1) % ring.length];
    const A = vert(u0, v0, true), B = vert(u1, v1, true), a = vert(u0, v0, false), b = vert(u1, v1, false);
    tri(A, a, b);
    tri(A, b, B);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function hash01(seed, key) {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(key + 1, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function wrapSpec(r, side, offset, flare, flareDrop) {
  if (side.mode === 'tuck') return { shift: offset, thetaMax: HALF_PI, sMax: 0, flare: 0, ref: 1 };
  const drop = Math.max(side.drop ?? 0, 0.001);
  const thetaMax = drop >= r ? HALF_PI : Math.acos(1 - drop / r);
  return { shift: 0, thetaMax, sMax: Math.max(0, drop - r), flare, ref: Math.max(flareDrop - r, 0.001) };
}

const lerpWrap = (a, b, k) => ({
  shift: a.shift + (b.shift - a.shift) * k,
  thetaMax: a.thetaMax + (b.thetaMax - a.thetaMax) * k,
  sMax: a.sMax + (b.sMax - a.sMax) * k,
  flare: a.flare,
  ref: a.ref,
});

function wrapAt(w, r, kind, f) {
  if (kind === 'shoulder') {
    const th = f * w.thetaMax;
    return { out: r * Math.sin(th), down: r * (1 - Math.cos(th)), sin: Math.sin(th), cos: Math.cos(th), s: 0 };
  }
  if (kind === 'drape') {
    const s = f * w.sMax;
    const out = Math.sin(w.thetaMax) * r + w.flare * (s / w.ref) ** 2;
    const down = r * (1 - Math.cos(w.thetaMax)) + s;
    return { out, down, sin: Math.sin(w.thetaMax), cos: Math.cos(w.thetaMax), s };
  }
  return { out: 0, down: 0, sin: 0, cos: 1, s: 0 };
}

function topRows(z0, z1, knots, n) {
  const inner = [...new Set(knots.filter((k) => k > z0 + 0.02 && k < z1 - 0.02))].sort((a, b) => a - b);
  const pts = [z0, ...inner, z1];
  const lens = pts.slice(1).map((z, i) => z - pts[i]);
  const counts = lens.map(() => 1);
  for (let left = Math.max(n, lens.length) - lens.length; left > 0; left--) {
    let best = 0;
    lens.forEach((len, i) => {
      if (len / counts[i] > lens[best] / counts[best] + 1e-12) best = i;
    });
    counts[best]++;
  }
  const rows = [z0];
  lens.forEach((len, i) => {
    for (let k = 1; k <= counts[i]; k++) rows.push(pts[i] + (len * k) / counts[i]);
  });
  return rows;
}

function sideColumns(res, tuck) {
  const nt = res.topU + (tuck ? res.drape : 0);
  const half = [];
  for (let i = 1; i <= nt; i++) half.push({ kind: 'top', f: i / nt });
  for (let i = 1; i <= res.shoulder; i++) half.push({ kind: 'shoulder', f: i / res.shoulder });
  if (!tuck) for (let i = 1; i <= res.drape; i++) half.push({ kind: 'drape', f: i / res.drape });
  return [...half.slice().reverse().map((c) => ({ ...c, sign: -1 })), { kind: 'top', f: 0, sign: 0 }, ...half.map((c) => ({ ...c, sign: 1 }))];
}

class SheetWriter {
  constructor() {
    this.positions = [];
  }
  tri(a, b, c) {
    this.positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  quad(a, b, c, d) {
    this.tri(a, b, c);
    this.tri(c, b, d);
  }
  grid(points) {
    for (let i = 0; i + 1 < points.length; i++) {
      for (let j = 0; j + 1 < points[i].length; j++) this.quad(points[i][j], points[i + 1][j], points[i][j + 1], points[i + 1][j + 1]);
    }
  }
  band(outer, inner) {
    for (let k = 0; k + 1 < outer.length; k++) {
      this.tri(outer[k], outer[k + 1], inner[k + 1]);
      this.tri(outer[k], inner[k + 1], inner[k]);
    }
  }
  geometry() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.computeVertexNormals();
    return geo;
  }
  get triangles() {
    return this.positions.length / 9;
  }
}

function loop(grid, inner, rows, cols, open = false) {
  const outerPts = [], innerPts = [];
  const add = (i, j) => {
    outerPts.push(grid[i][j]);
    innerPts.push(inner[i][j]);
  };
  if (!open) for (let j = 0; j < cols; j++) add(0, j);
  for (let i = 0; i < rows; i++) add(i, cols);
  for (let j = cols; j > 0; j--) add(rows, j);
  for (let i = rows; i >= 0; i--) add(i, 0);
  return [outerPts, innerPts];
}

export function drapeSheet(opts) {
  const {
    top,
    width,
    x0 = 0,
    zStart,
    zEnd,
    side = { mode: 'drape', drop: 0.2 },
    foot = { mode: 'drape', drop: 0.2 },
    footTaper = 0.25,
    crownRegion = null,
    fold = null,
    seed = 0,
    res = 'full',
  } = opts;
  const W = Math.max(width, 0.2);
  const r = clamp(opts.radius ?? 0.03, 0.005, W / 4);
  const t = Math.max(opts.thickness ?? 0.03, 0.002);
  const flare = clamp(opts.flare ?? 0, 0, 0.025);
  const cornerSag = clamp(opts.cornerSag ?? 0, 0, 0.06);
  const crown = Math.max(opts.crown ?? 0, 0);
  const wrinkle = clamp(opts.wrinkle ?? 0, 0, 0.008);
  const lift = opts.lift > 0 ? opts.lift + wrinkle : 0;
  const R = DRAPE_RES[res] ?? DRAPE_RES.full;
  const sideTuck = side.mode === 'tuck';
  const footTuck = foot.mode === 'tuck';
  const off = t + lift;
  const sideDrape = wrapSpec(r, side, off, flare, opts.flareDrop ?? side.drop ?? r);
  const sideTuckSpec = wrapSpec(r, { mode: 'tuck' }, off, 0, r);
  const footW = wrapSpec(r, foot, off, flare, opts.flareDrop ?? foot.drop ?? r);
  const zTopEnd = zEnd - r - footW.shift;
  const z0 = Math.min(zStart, zTopEnd - 0.05);
  const taper = !sideTuck && footTuck;
  const zTaper = zEnd - footTaper;
  const region = crownRegion ?? { zFrom: z0, zTo: zTopEnd };
  const ramp = (z) => clamp((z - region.zFrom) / 0.15, 0, 1) * clamp((region.zTo - z) / 0.15, 0, 1);
  const knots = [region.zFrom, region.zFrom + 0.15, region.zTo - 0.15, region.zTo, ...(taper ? [zTaper] : [])];
  const nTop = Math.min(R.top, Math.ceil((zTopEnd - z0) / 0.35)) + (taper ? 1 : 0);
  const rowsTop = topRows(z0, zTopEnd, knots, nTop).map((z) => ({ kind: 'top', z }));
  const footRows = [];
  for (let i = 1; i <= R.shoulder; i++) footRows.push({ kind: 'shoulder', f: i / R.shoulder });
  if (!footTuck) for (let i = 1; i <= R.drape; i++) footRows.push({ kind: 'drape', f: i / R.drape });
  const rows = [...rowsTop, ...footRows];
  const cols = sideColumns(R, sideTuck);
  const taperK = (row) => {
    if (!taper) return 0;
    if (row.kind !== 'top') return 1;
    return clamp((row.z - zTaper) / Math.max(zTopEnd - zTaper, 0.01), 0, 1);
  };
  const sideWrapFor = (row, base) => (taper ? lerpWrap(base, sideTuckSpec, taperK(row)) : base);
  const xMax = x0 + W / 2;

  const surface = (row, col, sw) => {
    const su = wrapAt(sw, r, col.sign === 0 ? 'top' : col.kind, col.f);
    const sv = row.kind === 'top' ? wrapAt(footW, r, 'top', 0) : wrapAt(footW, r, row.kind, row.f);
    const uTop = W / 2 - r - sw.shift;
    const x = x0 + col.sign * (col.kind === 'top' ? col.f * uTop : uTop + su.out);
    const z = row.kind === 'top' ? row.z : zTopEnd + sv.out;
    let sag = 0;
    if (col.kind === 'drape' && row.kind === 'drape' && sw.sMax > 0 && footW.sMax > 0) {
      sag = cornerSag * Math.min(su.s / sw.sMax, sv.s / footW.sMax);
    }
    const y = top - Math.max(su.down, sv.down) - sag;
    const n = new THREE.Vector3(col.sign * su.sin, su.cos * sv.cos, sv.sin).normalize();
    const inTop = (col.kind === 'top' || col.sign === 0) && row.kind === 'top';
    const a = col.sign === 0 ? 0 : col.f;
    const c = inTop ? crown * (1 - a * a) * ramp(row.z) : 0;
    return { p: new THREE.Vector3(x, y, z), n, c };
  };
  const place = (s, o, back = 0, tucked = sideTuck) => {
    const v = s.p.clone().addScaledVector(s.n, o);
    v.z -= back;
    if (tucked) v.x = clamp(v.x, 2 * x0 - xMax, xMax);
    if (footTuck) v.z = Math.min(v.z, zEnd);
    return v;
  };
  const jit = (skin, i, j) => wrinkle * hash01(seed, skin * 65536 + i * 256 + j);

  const main = new SheetWriter();
  const mainOuter = [], mainInner = [];
  rows.forEach((row, i) => {
    const sw = sideWrapFor(row, sideTuck ? sideTuckSpec : sideDrape);
    const outerRow = [], innerRow = [];
    cols.forEach((col, j) => {
      const s = surface(row, col, sw);
      const o = off + s.c + jit(0, i, j);
      const tucked = sideTuck || (taper && row.kind !== 'top');
      outerRow.push(place(s, o, 0, tucked));
      innerRow.push(place(s, Math.max(o - t, 0.001), 0, tucked));
    });
    mainOuter.push(outerRow);
    mainInner.push(innerRow);
  });
  const nr = rows.length - 1, nc = cols.length - 1;
  main.grid(mainOuter);
  main.band(...loop(mainOuter, mainInner, nr, nc));

  let foldGeo = null;
  let foldTris = 0;
  if (fold) {
    const Rr = Math.max(fold.roll ?? t, t);
    const hemLift = fold.hemLift ?? 0.015;
    const depth = clamp(fold.depth ?? 0.25, 0.02, Math.max(zTopEnd - z0 - 0.05, 0.02));
    const oFold = lift + 2 * Rr;
    const foldSide = sideTuck
      ? { ...sideTuckSpec, thetaMax: Math.asin(clamp((r + off) / (r + oFold + wrinkle), 0, 1)) }
      : wrapSpec(r, { mode: 'drape', drop: Math.max((side.drop ?? 0) - hemLift, 0.002) }, off, flare, opts.flareDrop ?? side.drop ?? r);
    if (!sideTuck) foldSide.ref = sideDrape.ref;
    const foldRows = [];
    for (let k = 0; k <= R.roll; k++) foldRows.push({ phi: (Math.PI * k) / R.roll, z: z0 });
    for (let k = 1; k <= R.layer; k++) foldRows.push({ phi: Math.PI, z: z0 + (depth * k) / R.layer, layer: true });
    const outer = [], inner = [];
    foldRows.forEach((fr, i) => {
      const row = { kind: 'top', z: fr.z };
      const sw = sideWrapFor(row, foldSide);
      const outerRow = [], innerRow = [];
      cols.forEach((col, j) => {
        const s = surface(row, col, sw);
        const w = (1 - Math.cos(fr.phi)) / 2;
        const jt = jit(1, i, j) * w;
        if (fr.layer) {
          outerRow.push(place(s, oFold + s.c + jt));
          innerRow.push(place(s, off + s.c));
          return;
        }
        const o = lift + Math.max(0.001, Rr * (1 - Math.cos(fr.phi))) + s.c * w + jt;
        const back = Rr * Math.sin(fr.phi);
        const oc = lift + Rr + s.c / 2;
        const k = (Rr - t) / Rr;
        outerRow.push(place(s, o, back));
        innerRow.push(place(s, oc + (o - oc) * k, back * k));
      });
      outer.push(outerRow);
      inner.push(innerRow);
    });
    const fw = new SheetWriter();
    fw.grid(outer);
    fw.band(...loop(outer, inner, foldRows.length - 1, nc, true));
    foldTris = fw.triangles;
    foldGeo = fw.geometry();
  }
  const total = main.triangles + foldTris;
  if (total > DRAPE_TRI_CAP) throw new Error(`drapeSheet: ${total} triangles > ${DRAPE_TRI_CAP}`);
  return { main: main.geometry(), fold: foldGeo };
}
