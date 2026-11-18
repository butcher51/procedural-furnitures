import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { latheSolid } from '../../src/core/geometry.js';
import { createMaterials } from '../../src/core/materials.js';
import { fillMissingAttributes, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { createRng } from '../../src/core/rng.js';
import {
  CONTENT_TRIS, DECOR, DECOR_KINDS, bookFace, bookGeometry, buildDecor, countDecor, decorFootprint, decorTriangles,
  layoutShelfContents, paintVertices,
} from '../../src/core/fill.js';
import { decorInside, decorSupported } from '../helpers/invariants.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const tris = (geo) => (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
const bbox = (geo) => {
  geo.computeBoundingBox();
  return geo.boundingBox;
};
function signedVolume(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let v = 0;
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    v += a.dot(b.clone().cross(c)) / 6;
  }
  return v;
}
const hexOf = (r, g, b) => `#${new THREE.Color().setRGB(r, g, b).getHexString()}`;
function colourSet(geo) {
  const c = geo.attributes.color;
  const out = new Set();
  for (let i = 0; i < c.count; i++) out.add(hexOf(c.getX(i), c.getY(i), c.getZ(i)));
  return out;
}

test('paintVertices: per-face colour in linear space, indexed input becomes non-indexed', () => {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const painted = paintVertices(box, (n) => (n.y > 0.5 ? '#d9cbb0' : '#7a3b2e'));
  assert.equal(painted.index, null);
  assert.equal(painted.attributes.color.count, 36);
  assert.deepEqual([...colourSet(painted)].sort(), ['#7a3b2e', '#d9cbb0']);
  const grey = paintVertices(new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), '#808080');
  assert.ok(near(grey.attributes.color.getX(0), 0.2158605, 1e-5), 'sRGB #808080 is stored linear');
});

test('bookGeometry: 28 triangles, exact extents, outward, pages on top, bottom and fore-edge', () => {
  const geo = bookGeometry(0.03, 0.22, 0.15);
  assert.equal(tris(geo), 28);
  assert.equal(geo.index, null);
  const box = bbox(geo);
  assert.ok(near(box.min.x, -0.015) && near(box.max.x, 0.015));
  assert.ok(near(box.min.y, 0) && near(box.max.y, 0.22));
  assert.ok(near(box.min.z, -0.075) && near(box.max.z, 0.075));
  assert.ok(signedVolume(geo) > 0);
  const n = new THREE.Vector3();
  const faces = { cover: 0, pages: 0 };
  const p = geo.attributes.normal;
  for (let i = 0; i < p.count; i += 3) faces[bookFace(n.fromBufferAttribute(p, i))]++;
  assert.deepEqual(faces, { cover: 14, pages: 14 });
});

test('DECOR presets: lathe triangle counts match CONTENT_TRIS, stand on y = 0, unit size', () => {
  assert.deepEqual(Object.keys(DECOR).sort(), ['bowl', 'cup', 'orb', 'vase']);
  assert.ok(DECOR_KINDS.includes('plant') && !('plant' in DECOR));
  for (const [kind, { profile, sides }] of Object.entries(DECOR)) {
    const geo = latheSolid(profile, sides);
    assert.equal(tris(geo), CONTENT_TRIS[kind], kind);
    assert.ok(sides >= 6 && sides <= 8);
    const box = bbox(geo);
    assert.ok(near(box.min.y, 0) && near(box.max.y, 1), kind);
    assert.ok(box.max.x <= 0.5 + 1e-9 && box.max.x > 0.4, kind);
    assert.ok(signedVolume(geo) > 0, `${kind} faces outward`);
  }
});

test('vertexColor material and the merge colour rule', () => {
  const mats = createMaterials();
  const decor = mats.vertexColor();
  assert.equal(decor.vertexColors, true);
  assert.equal(decor.flatShading, true);
  assert.equal(decor.userData.role, 'decor');
  assert.equal(`#${decor.color.getHexString()}`, '#ffffff');
  const solid = mats.solid('#8a6f5a');
  const painted = new THREE.Mesh(paintVertices(new THREE.BoxGeometry(0.1, 0.1, 0.1), '#7a3b2e'), decor);
  const bare = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), decor);
  bare.position.x = 0.3;
  const stray = new THREE.Mesh(paintVertices(new THREE.BoxGeometry(0.1, 0.1, 0.1), '#7a3b2e'), solid);
  stray.position.x = -0.3;
  const merged = mergeByMaterial(groupParts([painted, bare, stray]));
  const byMat = new Map(merged.children.map((m) => [m.material, m.geometry]));
  assert.deepEqual([...colourSet(byMat.get(decor))].sort(), ['#7a3b2e', '#ffffff']);
  assert.equal(byMat.get(solid).attributes.color, undefined);
  const zero = fillMissingAttributes([new THREE.BoxGeometry(), paintVertices(new THREE.BoxGeometry(), '#ffffff')]);
  assert.ok(zero[0].attributes.color.array.every((v) => v === 0), 'default fill stays zero');
});

const COLOURS = { covers: ['#7a3b2e', '#2f3e5c', '#4b5e44', '#b08a3e', '#3b3a38'], pages: '#e9e1cf', objects: ['#e8e2d6', '#a65f45'] };

function shelfSurfaces(rng, n = 5) {
  const out = [];
  const width = rng.range(0.3, 0.9), depth = rng.range(0.09, 0.4);
  for (let i = 0; i < n; i++) {
    out.push({
      id: `bay-${i}`, x0: -width / 2, x1: width / 2, y: 0.06 + i * 0.32, clear: rng.range(0.16, 0.4),
      zBack: -depth / 2, zFront: depth / 2, back: rng.chance(0.6), top: i === n - 1 && rng.chance(0.3),
    });
  }
  return out;
}

const roundedToMm = (value) => {
  if (typeof value === 'number') return near(value * 1000, Math.round(value * 1000), 1e-6);
  if (Array.isArray(value)) return value.every(roundedToMm);
  if (value && typeof value === 'object') return Object.values(value).every(roundedToMm);
  return true;
};

test('layoutShelfContents: same seed, same records; mm-rounded; budget and vocabulary respected', () => {
  const surfaces = shelfSurfaces(createRng('s'), 6);
  for (const mood of ['library', 'styled', 'sparse']) {
    const a = layoutShelfContents(createRng('17'), surfaces, { mood, allowBins: true });
    const b = layoutShelfContents(createRng('17'), surfaces, { mood, allowBins: true });
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, layoutShelfContents(createRng('18'), surfaces, { mood, allowBins: true }));
    assert.equal(a.length, surfaces.length);
    assert.ok(roundedToMm(a), `${mood}: numbers are mm-rounded`);
  }
  let tight = 0;
  for (let seed = 0; seed < 50; seed++) {
    const layout = layoutShelfContents(createRng(String(seed)), surfaces, { mood: 'library', budget: 600 });
    const used = layout.reduce((n, recs) => n + decorTriangles(recs), 0);
    assert.ok(used <= 600, `budget ${used}`);
    tight = Math.max(tight, used);
  }
  assert.ok(tight > 500, 'the budget is used');
  const kinds = new Set();
  const avg = { library: 0, sparse: 0 };
  for (let seed = 0; seed < 100; seed++) {
    const s = shelfSurfaces(createRng(`k${seed}`));
    for (const mood of Object.keys(avg)) {
      const layout = layoutShelfContents(createRng(String(seed)), s, { mood, objectKinds: ['vase', 'bowl', 'orb', 'box', 'frame'] });
      avg[mood] += countDecor(layout).books;
      layout.forEach((recs, i) => recs.forEach((rec) => {
        kinds.add(rec.k);
        assert.ok(DECOR_KINDS.includes(rec.k));
        if (rec.k === 'frame') assert.ok(s[i].back, 'frames lean on a back');
        if (rec.k === 'b' && !rec.lean) assert.ok(rec.h <= s[i].clear - 0.015 + 1e-9);
      }));
    }
  }
  assert.ok(avg.library > 2 * avg.sparse, `library ${avg.library} vs sparse ${avg.sparse}`);
  assert.ok(!kinds.has('plant') && !kinds.has('bin'));
  assert.ok(['b', 's', 'vase', 'bowl', 'orb', 'box', 'frame'].every((k) => kinds.has(k)), [...kinds].join());
});

test('layoutShelfContents: shallow bays get stacks and objects only; bins only when allowed', () => {
  const shallow = [{ id: 'top', x0: -0.3, x1: 0.3, y: 1, clear: 0.3, zBack: -0.05, zFront: 0.05, back: false }];
  for (let seed = 0; seed < 100; seed++) {
    const [recs] = layoutShelfContents(createRng(String(seed)), shallow, { mood: 'library' });
    assert.ok(recs.every((r) => r.k !== 'b'));
    for (const r of recs.filter((r) => r.k === 's')) assert.ok(r.books.every((b) => b.d <= 0.09 + 1e-9));
  }
  const cube = Array.from({ length: 9 }, (_, i) => ({ id: `c${i}`, x0: i, x1: i + 0.33, y: 0.1, clear: 0.33, zBack: -0.17, zFront: 0.17, back: true }));
  let bins = 0;
  for (let seed = 0; seed < 40; seed++) bins += countDecor(layoutShelfContents(createRng(String(seed)), cube, { mood: 'sparse', allowBins: true })).bins;
  assert.ok(bins > 60 && bins < 230, `bins ${bins}`);
});

function decorContext(surfaces, layout) {
  const mat = createMaterials().vertexColor();
  const meshes = surfaces.map((s, i) => buildDecor(layout[i], s, COLOURS, mat));
  meshes.forEach((m) => m.updateMatrixWorld(true));
  return { definition: { surfaces: () => surfaces }, params: {}, partMeshes: meshes };
}

test('buildDecor: every record supported and inside its surface over 300 random layouts', () => {
  for (let seed = 0; seed < 300; seed++) {
    const surfaces = shelfSurfaces(createRng(`b${seed}`));
    const mood = ['library', 'styled', 'sparse'][seed % 3];
    const layout = layoutShelfContents(createRng(String(seed)), surfaces, { mood, allowBins: seed % 4 === 0, objectKinds: ['vase', 'bowl', 'orb', 'box', 'frame', 'cup'], inset: 0.005 + (seed % 5) * 0.006 });
    const context = decorContext(surfaces, layout);
    assert.deepEqual(decorSupported(context), [], `seed ${seed}`);
    assert.deepEqual(decorInside(context), [], `seed ${seed}`);
    context.partMeshes.forEach((mesh, i) => {
      assert.equal(tris(mesh.geometry), decorTriangles(layout[i]));
      assert.equal(mesh.geometry.index, null);
      assert.ok(mesh.geometry.attributes.color && mesh.geometry.attributes.normal);
      for (const hex of colourSet(mesh.geometry)) assert.ok(
        [...COLOURS.covers, COLOURS.pages, ...COLOURS.objects].includes(hex) || hex.length === 7,
        hex,
      );
    });
  }
});

test('buildDecor: leaning book touches its neighbour; slab, cup and stack records for desks', () => {
  const surface = { id: 's', x0: 0, x1: 0.5, y: 0.5, clear: 0.35, zBack: -0.15, zFront: 0.15, back: true };
  const th = 15, t = (th * Math.PI) / 180;
  const left = { k: 'b', x: 0, w: 0.03, h: 0.2, d: 0.14, c: 0 };
  const pivot = 0.03 + Math.min(0.24 * Math.sin(t), 0.2 * Math.tan(t));
  const lean = { k: 'b', x: pivot, w: 0.03, h: 0.24, d: 0.14, c: 1, lean: th };
  const mesh = buildDecor([left, lean], surface, COLOURS, null);
  const p = mesh.geometry.attributes.position;
  const [, entry] = mesh.userData.decor;
  let corner = null;
  for (let i = entry.start; i < entry.start + entry.count; i++) if (!corner || p.getX(i) < corner.x) corner = { x: p.getX(i), y: p.getY(i) - surface.y };
  const faceAtNeighbourTop = pivot - (pivot - corner.x) * (0.2 / corner.y);
  assert.ok(near(faceAtNeighbourTop, 0.03, 1e-5), `leaning book meets the neighbour's top corner (${faceAtNeighbourTop})`);
  assert.ok(near(corner.y, 0.24 * Math.cos(t), 1e-5));
  assert.ok(near(decorFootprint(lean).w, 0.03 * Math.cos(t)));
  const desk = buildDecor([
    { k: 'slab', x: 0.02, w: 0.32, h: 0.018, d: 0.22, c: 0, yaw: 8 },
  ], { ...surface, x1: 0.4, back: false }, COLOURS, null);
  const ctx = { definition: null, params: {}, partMeshes: [desk] };
  assert.deepEqual(decorSupported(ctx), []);
  assert.deepEqual(decorInside(ctx), []);
  assert.equal(tris(desk.geometry), 44);
  const records = [
    { k: 's', x: 0.01, books: [{ w: 0.04, h: 0.24, d: 0.17, c: 0, yaw: -3 }, { w: 0.03, h: 0.2, d: 0.15, c: 1, yaw: 4 }], top: { k: 'orb', size: 0.07, h: 0.07, c: 1 } },
    { k: 'cup', x: 0.3, size: 0.07, h: 0.1, c: 1 },
  ];
  const props = buildDecor(records, surface, COLOURS, null);
  const pctx = { definition: null, params: {}, partMeshes: [props] };
  assert.deepEqual(decorSupported(pctx), []);
  assert.deepEqual(decorInside(pctx), []);
  assert.equal(tris(props.geometry), 2 * 28 + 72 + 80);
  assert.deepEqual(countDecor([records]), { books: 2, objects: 2, bins: 0 });
});

test('decor invariants catch floating, sinking and escaping records', () => {
  const surface = { id: 's', x0: 0, x1: 0.4, y: 0.5, clear: 0.3, zBack: -0.15, zFront: 0.15, back: false };
  const make = () => buildDecor([{ k: 'b', x: 0.01, w: 0.03, h: 0.2, d: 0.14, c: 0 }, { k: 'vase', x: 0.1, size: 0.08, h: 0.2, c: 0 }], surface, COLOURS, null);
  const lifted = make();
  lifted.position.y = 0.003;
  lifted.updateMatrixWorld(true);
  assert.equal(decorSupported({ partMeshes: [lifted] }).length, 2);
  const outside = make();
  outside.position.x = 0.38;
  outside.updateMatrixWorld(true);
  assert.equal(decorInside({ partMeshes: [outside] }).length, 1);
  const wrong = make();
  assert.match(decorInside({ definition: { surfaces: () => [{ ...surface, clear: 0.2 }] }, params: {}, partMeshes: [wrong] })[0], /not one of/);
});
