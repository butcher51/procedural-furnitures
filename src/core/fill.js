import * as THREE from 'three';
import { beam, latheSolid } from './geometry.js';
import { shade, swatch } from './palette.js';
import { weightedPick } from './rng.js';
import { clamp } from './math.js';

export const DECOR_KINDS = ['b', 's', 'vase', 'bowl', 'orb', 'cup', 'box', 'slab', 'frame', 'bin', 'plant'];

export const DECOR = {
  vase: { sides: 6, profile: [[0.3, 0], [0.46, 0.18], [0.48, 0.42], [0.3, 0.72], [0.17, 0.88], [0.22, 1]] },
  bowl: { sides: 8, profile: [[0.24, 0], [0.42, 0.32], [0.5, 0.82], [0.48, 1]] },
  orb: { sides: 6, profile: Array.from({ length: 7 }, (_, i) => [i % 6 ? 0.5 * Math.sin((Math.PI * i) / 6) : 0, 0.5 - 0.5 * Math.cos((Math.PI * i) / 6)]) },
  cup: { sides: 8, profile: [[0.44, 0], [0.5, 0.06], [0.5, 0.94], [0.46, 1]] },
};

export const CONTENT_TRIS = { b: 28, s: 28, vase: 84, bowl: 80, orb: 72, cup: 80, box: 44, slab: 44, frame: 88, bin: 88, plant: 0 };

const color = new THREE.Color();
const deg = THREE.MathUtils.degToRad;
const r3 = (v) => Math.round(v * 1000) / 1000;
const f3 = (v) => Math.floor(v * 1000 + 1e-6) / 1000;
const ceil3 = (v) => Math.ceil(v * 1000 - 1e-6) / 1000;

export function paintVertices(geometry, colour) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  if (geo !== geometry) geometry.dispose();
  const pos = geo.attributes.position;
  const out = new Float32Array(pos.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i + 2 < pos.count; i += 3) {
    let hex = colour;
    if (typeof colour === 'function') {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      n.subVectors(c, b).cross(a.sub(b)).normalize();
      hex = colour(n);
    }
    color.set(hex);
    for (let k = 0; k < 3; k++) out.set([color.r, color.g, color.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3));
  return geo;
}

function bookSection(w, d, rs) {
  const hw = w / 2, hd = d / 2;
  const r = clamp(rs, 0.0005, Math.min(hw, hd) - 0.0001);
  const s = Math.SQRT1_2;
  return [
    [-hw, -hd], [hw, -hd],
    [hw, hd - r], [hw - r + r * s, hd - r + r * s], [hw - r, hd],
    [-hw + r, hd], [-hw + r - r * s, hd - r + r * s], [-hw, hd - r],
  ];
}

function bookTriangles(w, h, d, rs, emit) {
  const ring = bookSection(w, d, rs);
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % n];
    const face = i === 0 ? 'pages' : 'cover';
    emit([x0, 0, z0], [x0, h, z0], [x1, 0, z1], face);
    emit([x0, h, z0], [x1, h, z1], [x1, 0, z1], face);
  }
  for (let i = 1; i < n - 1; i++) {
    const [p0, p1, p2] = [ring[0], ring[i], ring[i + 1]];
    emit([p0[0], h, p0[1]], [p2[0], h, p2[1]], [p1[0], h, p1[1]], 'pages');
    emit([p0[0], 0, p0[1]], [p1[0], 0, p1[1]], [p2[0], 0, p2[1]], 'pages');
  }
}

export function bookGeometry(w, h, d, spineRadius = Math.min(0.004, w / 3)) {
  const positions = [];
  bookTriangles(w, h, d, spineRadius, (a, b, c) => positions.push(...a, ...b, ...c));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

export const bookFace = (normal) => (Math.abs(normal.y) > 0.5 || normal.z < -0.5 ? 'pages' : 'cover');

const latheCache = new Map();
function unitLathe(kind) {
  if (!latheCache.has(kind)) {
    const { profile, sides } = DECOR[kind];
    const geo = latheSolid(profile, sides).toNonIndexed();
    latheCache.set(kind, Float32Array.from(geo.attributes.position.array));
    geo.dispose();
  }
  return latheCache.get(kind);
}

function boxSoup(w, h, d, radius) {
  const mesh = beam(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), w, d, radius, null);
  const array = Float32Array.from(mesh.geometry.attributes.position.array);
  mesh.geometry.dispose();
  for (let i = 1; i < array.length; i += 3) array[i] += h / 2;
  return array;
}

class DecorWriter {
  constructor() {
    this.pos = [];
    this.col = [];
    this.entries = [];
  }
  begin(k, support) {
    this.entry = { k, start: this.pos.length / 3, count: 0, support };
    this.entries.push(this.entry);
  }
  tri(a, b, c, rgb) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let k = 0; k < 3; k++) this.col.push(rgb[0], rgb[1], rgb[2]);
    this.entry.count += 3;
  }
  soup(array, scale, transform, rgb) {
    const pts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    for (let i = 0; i < array.length; i += 9) {
      for (let k = 0; k < 3; k++) {
        const o = i + k * 3;
        pts[k].set(array[o] * scale[0], array[o + 1] * scale[1], array[o + 2] * scale[2]).applyMatrix4(transform);
      }
      this.tri(pts[0], pts[1], pts[2], rgb);
    }
  }
  mesh(mat, surface) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'decor';
    mesh.userData.surface = surface;
    mesh.userData.decor = this.entries.map(({ k, start, count, support }) => ({ k, start, count, support }));
    return mesh;
  }
}

const rgbOf = (hex) => {
  color.set(hex);
  return [color.r, color.g, color.b];
};

function frameOf(x, y, z, yawDeg = 0, rollDeg = 0, pitchDeg = 0) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(pitchDeg), deg(yawDeg), deg(rollDeg), 'YZX')),
    new THREE.Vector3(1, 1, 1)
  );
}

function writeBook(wr, { w, h, d }, transform, cover, pages) {
  const pts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  bookTriangles(w, h, d, Math.min(0.004, w / 3), (a, b, c, face) => {
    pts[0].fromArray(a).applyMatrix4(transform);
    pts[1].fromArray(b).applyMatrix4(transform);
    pts[2].fromArray(c).applyMatrix4(transform);
    wr.tri(pts[0], pts[1], pts[2], face === 'pages' ? pages : cover);
  });
}

const FRAME_DEPTH = 0.018;

export function decorFootprint(rec) {
  if (rec.k === 'b') {
    const th = deg(Math.abs(rec.lean ?? 0));
    return { w: rec.w * Math.cos(th), h: rec.h * Math.cos(th) + rec.w * Math.sin(th) };
  }
  if (rec.k === 's') {
    let w = 0, h = 0;
    for (const b of rec.books) {
      const a = deg(Math.abs(b.yaw ?? 0));
      w = Math.max(w, b.h * Math.cos(a) + b.d * Math.sin(a));
      h += b.w;
    }
    if (rec.top) h += rec.top.h ?? rec.top.size;
    return { w, h };
  }
  if (rec.k === 'frame') {
    const a = deg(rec.lean ?? 12);
    return { w: rec.w, h: rec.h * Math.cos(a) + FRAME_DEPTH * Math.sin(a) };
  }
  if (rec.k in DECOR) return { w: rec.size, h: rec.h ?? rec.size };
  return { w: rec.w ?? 0, h: rec.h ?? 0 };
}

export function buildDecor(records, surface, colours, mat) {
  const wr = new DecorWriter();
  const covers = (colours.covers ?? []).map(rgbOf);
  const objects = (colours.objects ?? []).map(rgbOf);
  const pages = rgbOf(colours.pages ?? '#efe8da');
  const coverOf = (c) => covers[c % covers.length] ?? pages;
  const objectOf = (c) => objects[c % objects.length] ?? pages;
  const darker = (c) => rgbOf(shade(swatch(colours.objects[c % colours.objects.length]), -0.15).hex);
  const zMid = (surface.zBack + surface.zFront) / 2;
  const y0 = surface.y;
  const lathe = (kind, cx, y, cz, size, h, rgb, yaw = 0) => {
    wr.soup(unitLathe(kind), [size, h, size], frameOf(cx, y, cz, yaw), rgb);
  };
  const box = (radius, cx, y, cz, w, h, d, rgb, transform = null) => {
    const m = transform ?? frameOf(cx, y, cz);
    wr.soup(boxSoup(w, h, d, radius), [1, 1, 1], m, rgb);
  };
  for (const rec of records) {
    const x = surface.x0 + rec.x;
    const cz = zMid + (rec.z ?? 0);
    if (rec.k === 'b') {
      wr.begin('b', y0);
      const lean = rec.lean ?? 0;
      const th = deg(Math.abs(lean));
      const px = lean > 0 ? x : lean < 0 ? x + rec.w * Math.cos(th) : x + rec.w / 2;
      const local = new THREE.Matrix4().makeTranslation(lean > 0 ? rec.w / 2 : lean < 0 ? -rec.w / 2 : 0, 0, 0);
      const m = frameOf(px, y0, cz, 0, lean).multiply(local);
      writeBook(wr, rec, m, coverOf(rec.c), pages);
    } else if (rec.k === 's') {
      const cx = x + decorFootprint(rec).w / 2;
      let y = y0;
      for (const b of rec.books) {
        wr.begin('s', y);
        const m = frameOf(cx, y + b.w / 2, cz, b.yaw ?? 0, -90).multiply(new THREE.Matrix4().makeTranslation(0, -b.h / 2, 0));
        writeBook(wr, b, m, coverOf(b.c), pages);
        y += b.w;
      }
      if (rec.top) {
        wr.begin(rec.top.k, y);
        lathe(rec.top.k, cx, y, cz, rec.top.size, rec.top.h ?? rec.top.size, objectOf(rec.top.c));
      }
    } else if (rec.k in DECOR) {
      wr.begin(rec.k, y0);
      lathe(rec.k, x + rec.size / 2, y0, cz, rec.size, rec.h ?? rec.size, objectOf(rec.c), rec.yaw ?? 0);
    } else if (rec.k === 'box' || rec.k === 'slab') {
      wr.begin(rec.k, y0);
      const yaw = deg(Math.abs(rec.yaw ?? 0));
      const fw = rec.w * Math.cos(yaw) + rec.d * Math.sin(yaw);
      box(rec.k === 'slab' ? 0.003 : 0.006, 0, 0, 0, rec.w, rec.h, rec.d, objectOf(rec.c), frameOf(x + fw / 2, y0, cz, rec.yaw ?? 0));
    } else if (rec.k === 'bin') {
      wr.begin('bin', y0);
      const cx = x + rec.w / 2;
      box(0.01, cx, y0, cz, rec.w, rec.h, rec.d, objectOf(rec.c));
      box(0.004, cx, y0 + rec.h * 0.72, cz + rec.d / 2 - 0.0015, rec.w * 0.4, 0.03, 0.004, darker(rec.c));
    } else if (rec.k === 'frame') {
      wr.begin('frame', y0);
      const lean = rec.lean ?? 12;
      const a = deg(lean);
      const pivotZ = surface.zBack + 0.001 + rec.h * Math.sin(a);
      const m = frameOf(x + rec.w / 2, y0, pivotZ, 0, 0, -lean);
      box(0.004, 0, 0, 0, rec.w, rec.h, FRAME_DEPTH, objectOf(rec.c), m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, FRAME_DEPTH / 2)));
      const inset = Math.min(0.025, rec.w * 0.18);
      const photo = new THREE.Matrix4().makeTranslation(0, inset, FRAME_DEPTH + 0.001);
      box(0.001, 0, 0, 0, rec.w - 2 * inset, rec.h - 2 * inset, 0.004, pages, m.clone().multiply(photo));
    }
  }
  return wr.mesh(mat, surface);
}

export function decorTriangles(records) {
  let tris = 0;
  for (const rec of records) {
    if (rec.k === 's') tris += rec.books.length * CONTENT_TRIS.s + (rec.top ? CONTENT_TRIS[rec.top.k] : 0);
    else tris += CONTENT_TRIS[rec.k] ?? 0;
  }
  return tris;
}

export function countDecor(layout) {
  const out = { books: 0, objects: 0, bins: 0 };
  for (const rec of layout.flat()) {
    if (rec.k === 'b') out.books++;
    else if (rec.k === 's') {
      out.books += rec.books.length;
      if (rec.top) out.objects++;
    } else if (rec.k === 'bin') out.bins++;
    else if (rec.k !== 'plant') out.objects++;
  }
  return out;
}

export const SHELF_MOODS = {
  library: { fill: [0.7, 0.95], arrange: { row: 0.72, split: 0.18, stack: 0.1 }, lean: 0.35, bin: 0.1, objectChance: 0.35 },
  styled: { fill: [0.4, 0.7], arrange: { row: 0.3, split: 0.3, stack: 0.22, objects: 0.18 }, lean: 0.5, bin: 0.3, objectChance: 0.5 },
  sparse: { fill: [0.15, 0.4], arrange: { row: 0.12, split: 0.1, stack: 0.33, objects: 0.33, empty: 0.12 }, lean: 0.4, bin: 0.4, objectChance: 0.7 },
};

const THICKNESS_MIX = [[[0.015, 0.025], 0.45], [[0.025, 0.04], 0.4], [[0.04, 0.06], 0.15]];
const HEIGHT_CLASSES = [[[0.17, 0.21], 0.4], [[0.21, 0.25], 0.4], [[0.26, 0.31], 0.2]];

export function layoutShelfContents(r, surfaces, opts = {}) {
  const {
    mood = 'styled',
    coverCount = 5,
    objectCount = 2,
    objectKinds = ['vase', 'bowl', 'orb', 'box'],
    allowBins = false,
    allowFrames = true,
    budget = Infinity,
    inset = 0.01,
  } = opts;
  const M = SHELF_MOODS[mood] ?? SHELF_MOODS.styled;
  const n = surfaces.length;
  const maxObjects = mood === 'library' ? Math.max(1, Math.floor(n / 3)) : Infinity;
  const maxEmpty = Math.floor(0.3 * n);
  let used = 0, full = false, objects = 0, empties = 0;
  const take = (tris) => {
    if (full || used + tris > budget) {
      full = true;
      return false;
    }
    used += tris;
    return true;
  };
  const range = ([lo, hi]) => r.range(lo, hi);

  return surfaces.map((s) => {
    const out = [];
    if (full) return out;
    const span = s.x1 - s.x0;
    const depth = s.zFront - s.zBack;
    const zMid = (s.zBack + s.zFront) / 2;
    const room = s.clear - 0.015;
    const maxD = depth - 0.01;
    const a = 0.004, b = r3(span - 0.004);
    const zFor = (d) => r3(Math.max(s.zFront - inset - d / 2, s.zBack + 0.001 + d / 2) - zMid);
    const canStand = room >= 0.17 && maxD >= 0.1;

    const book = (cls, series) => {
      const w = f3(range(weightedPick(r, THICKNESS_MIX)));
      const h = f3(Math.min(series ? series.h + r.range(-0.005, 0.005) : range(cls), room));
      const d = f3(clamp(0.68 * h + r.range(-0.02, 0.02), 0.1, maxD));
      return { k: 'b', w, h, d, c: series ? series.c : r.int(0, coverCount - 1) };
    };

    const row = (from, to, target, mirror) => {
      const recs = [];
      let x = from;
      let cls = weightedPick(r, HEIGHT_CLASSES);
      let series = null, left = 0;
      while (true) {
        if (left <= 0) {
          series = null;
          if (r.chance(0.35)) {
            left = r.int(2, 5);
            series = { h: Math.min(range(cls), room), c: r.int(0, coverCount - 1) };
          } else if (r.chance(0.25)) cls = weightedPick(r, HEIGHT_CLASSES);
        }
        const bk = book(cls, series);
        left--;
        if (bk.h < 0.12 || x + bk.w > to || x + bk.w - from > target) break;
        if (!take(CONTENT_TRIS.b)) break;
        recs.push({ ...bk, x: r3(x), z: zFor(bk.d) });
        x = r3(x + bk.w + r3(r.range(0, 0.002)));
      }
      if (recs.length && r.chance(M.lean)) {
        const last = recs[recs.length - 1];
        const xe = last.x + last.w;
        const th = r3(r.range(8, 20));
        const bk = book(cls, null);
        const t = deg(th);
        const fitsH = bk.h * Math.cos(t) + bk.w * Math.sin(t) <= room;
        const pivot = ceil3(xe + Math.min(bk.h * Math.sin(t), last.h * Math.tan(t)) + 0.001);
        const right = pivot + bk.w * Math.cos(t);
        if (fitsH && right <= to && pivot - bk.h * Math.sin(t) >= from && take(CONTENT_TRIS.b)) {
          recs.push({ ...bk, x: pivot, lean: th, z: zFor(bk.d) });
          x = ceil3(right);
        }
      }
      if (!mirror) return { recs, end: x };
      const mirrored = recs.map((rec) => {
        if (!rec.lean) return { ...rec, x: r3(from + to - rec.x - rec.w) };
        const fw = rec.w * Math.cos(deg(rec.lean));
        return { ...rec, x: r3(from + to - rec.x - fw), lean: -rec.lean };
      });
      return { recs: mirrored, end: r3(from + to - x) };
    };

    const object = (avail, kind = r.pick(objectKinds)) => {
      if (objects >= maxObjects) return null;
      let k = kind;
      if (k === 'frame' && !(allowFrames && s.back)) k = 'box';
      let rec = null;
      if (k === 'vase') {
        const h = Math.min(r.range(0.12, 0.26), room);
        const size = Math.min(r.range(0.07, 0.12), maxD, avail);
        if (h >= 0.08 && size >= 0.05) rec = { k, size: f3(size), h: f3(h) };
      } else if (k === 'bowl') {
        const size = Math.min(r.range(0.12, 0.2), maxD, avail);
        const h = Math.min(r.range(0.05, 0.08), room);
        if (size >= 0.08) rec = { k, size: f3(size), h: f3(h) };
      } else if (k === 'orb' || k === 'cup') {
        const size = Math.min(k === 'orb' ? r.range(0.06, 0.1) : r.range(0.06, 0.08), maxD, avail, room);
        const h = k === 'cup' ? Math.min(r.range(0.08, 0.11), room) : size;
        if (size >= 0.04) rec = { k, size: f3(size), h: f3(h) };
      } else if (k === 'box') {
        const size = Math.min(r.range(0.08, 0.16), maxD, avail);
        const h = Math.min(size * r.range(0.7, 1.1), room);
        const d = Math.min(size * r.range(0.8, 1), maxD);
        if (size >= 0.06 && h >= 0.04) rec = { k, w: f3(size), h: f3(h), d: f3(d) };
      } else if (k === 'frame') {
        const lean = r3(r.range(10, 15));
        const t = deg(lean);
        const h = Math.min(r.range(0.15, 0.25), (room - FRAME_DEPTH * Math.sin(t)) / Math.cos(t), (maxD - 0.006 - FRAME_DEPTH * Math.cos(t)) / Math.sin(t));
        const w = Math.min(h * r.range(0.7, 0.85), avail);
        if (h >= 0.1 && w >= 0.08) rec = { k, w: f3(w), h: f3(h), lean };
      }
      if (!rec || !take(CONTENT_TRIS[rec.k])) return null;
      objects++;
      return { ...rec, c: r.int(0, objectCount - 1) };
    };
    const place = (rec, x0, x1) => {
      const fw = decorFootprint(rec).w;
      if (x1 - x0 < fw) return null;
      return { ...rec, x: r3(x0 + (x1 - x0 - fw) / 2) };
    };

    const stack = (maxCount, avail) => {
      const count = r.int(2, maxCount);
      let books = [];
      for (let i = 0; i < count; i++) {
        const h = f3(Math.min(r.range(0.17, 0.31), avail - 0.01));
        const d = f3(clamp(0.68 * h + r.range(-0.02, 0.02), Math.min(0.1, maxD), maxD));
        books.push({ w: r3(r.range(0.02, 0.05)), h, d, c: r.int(0, coverCount - 1), yaw: r3(r.range(-4, 4)) });
      }
      books.sort((p, q) => q.h - p.h);
      books.forEach((bk, i) => {
        if (i) bk.d = Math.min(bk.d, books[i - 1].d);
        const yw = deg(Math.abs(bk.yaw));
        if (bk.h * Math.sin(yw) + bk.d * Math.cos(yw) > maxD || bk.h * Math.cos(yw) + bk.d * Math.sin(yw) > avail) bk.yaw = 0;
      });
      let height = 0;
      books = books.filter((bk) => (height + bk.w <= room && bk.h <= avail && bk.h >= 0.08 ? ((height += bk.w), true) : false));
      if (!books.length || !take(books.length * CONTENT_TRIS.s)) return null;
      const rec = { k: 's', books };
      const topD = books[books.length - 1];
      if (r.chance(0.3) && objects < maxObjects) {
        const kind = r.chance(0.5) ? 'orb' : 'bowl';
        const size = f3(Math.min(kind === 'orb' ? r.range(0.06, 0.09) : r.range(0.1, 0.16), topD.d, topD.h));
        const h = kind === 'orb' ? size : r3(r.range(0.04, 0.06));
        if (height + h <= room && size >= 0.05 && take(CONTENT_TRIS[kind])) {
          rec.top = { k: kind, size, h, c: r.int(0, objectCount - 1) };
          objects++;
        }
      }
      let fz = 0;
      for (const bk of books) {
        const yw = deg(Math.abs(bk.yaw));
        fz = Math.max(fz, bk.h * Math.sin(yw) + bk.d * Math.cos(yw));
      }
      rec.z = r3(Math.max(s.zFront - inset - fz / 2, s.zBack + 0.001 + fz / 2) - zMid);
      return rec;
    };

    if (allowBins && !s.top && r.chance(M.bin) && take(CONTENT_TRIS.bin)) {
      const w = f3(span - 0.01), h = f3(Math.min(s.clear - 0.012, 0.3)), d = f3(depth - 0.012);
      out.push({ k: 'bin', x: 0.005, w, h, d, c: r.int(0, objectCount - 1) });
      return out;
    }
    let arrangement;
    if (s.top) arrangement = r.chance(0.6) ? 'objects' : 'stack';
    else {
      const weights = { ...M.arrange };
      if (empties >= maxEmpty) delete weights.empty;
      if (!canStand) {
        delete weights.row;
        delete weights.split;
        weights.stack = (weights.stack ?? 0) + 0.3;
        weights.objects = (weights.objects ?? 0) + 0.3;
      }
      arrangement = weightedPick(r, weights);
    }
    const fill = range(M.fill);
    if (arrangement === 'empty') {
      empties++;
      return out;
    }
    if (arrangement === 'row') {
      const mirror = r.chance(0.5);
      const res = row(a, b, fill * span, mirror);
      out.push(...res.recs);
      const [g0, g1] = mirror ? [a, res.end - 0.02] : [res.end + 0.02, b];
      if (g1 - g0 >= 0.1 && r.chance(M.objectChance)) {
        const o = r.chance(0.3) ? stack(4, g1 - g0) : object(g1 - g0);
        const placed = o && place(o, g0, g1);
        if (placed) out.push(placed);
      }
    } else if (arrangement === 'split') {
      const left = row(a, b, fill * span * 0.45, false);
      const right = row(left.end + 0.04, b, fill * span * 0.45, true);
      out.push(...left.recs, ...right.recs);
      const g0 = left.end + 0.02, g1 = (right.recs.length ? right.end : b) - 0.02;
      if (g1 - g0 >= 0.08 && r.chance(M.objectChance + 0.3)) {
        const o = object(g1 - g0);
        const placed = o && place(o, g0, g1);
        if (placed) out.push(placed);
      }
    } else if (arrangement === 'stack') {
      const st = stack(s.top ? 3 : 6, Math.min(b - a, 0.32));
      if (st) {
        const fw = decorFootprint(st).w;
        const atLeft = r.chance(0.5);
        const x = r3(clamp(atLeft ? a + r.range(0, 0.03) : b - fw - r.range(0, 0.03), a, b - fw));
        out.push({ ...st, x });
        const [g0, g1] = atLeft ? [x + fw + 0.03, b] : [a, x - 0.03];
        if (g1 - g0 >= 0.08 && r.chance(M.objectChance)) {
          const o = !s.top && canStand && g1 - g0 > 0.15 && r.chance(0.4) ? null : object(g1 - g0);
          if (o) {
            const placed = place(o, g0, g1);
            if (placed) out.push(placed);
          } else if (!s.top && canStand) {
            out.push(...row(g0, g1, fill * span * 0.5, !atLeft).recs);
          }
        }
      }
    } else {
      const count = s.top || span < 0.35 ? 1 : r.int(1, 2);
      const slot = (b - a) / count;
      for (let i = 0; i < count; i++) {
        const o = object(slot - 0.02);
        const placed = o && place(o, a + i * slot + 0.01, a + (i + 1) * slot - 0.01);
        if (placed) out.push(placed);
      }
    }
    return out;
  });
}
