import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { DRAPE_TRI_CAP, drapeSheet, pillow, pillowTriangles } from '../../src/core/soft.js';

const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const tris = (geo) => geo.attributes.position.count / 3;
const bbox = (geo) => {
  geo.computeBoundingBox();
  return geo.boundingBox;
};
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

function edgeUses(geo) {
  const p = geo.attributes.position;
  const key = (i) => `${p.getX(i).toFixed(5)},${p.getY(i).toFixed(5)},${p.getZ(i).toFixed(5)}`;
  const uses = new Map();
  for (let i = 0; i < p.count; i += 3) {
    const k = [key(i), key(i + 1), key(i + 2)];
    if (k[0] === k[1] || k[1] === k[2] || k[0] === k[2]) continue;
    for (let e = 0; e < 3; e++) {
      const edge = [k[e], k[(e + 1) % 3]].sort().join('|');
      uses.set(edge, (uses.get(edge) ?? 0) + 1);
    }
  }
  return uses;
}

function signedVolume(geo) {
  const p = geo.attributes.position;
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

test('pillow: exact bbox, closed, outward, 4·grid² + 8·grid triangles', () => {
  for (const grid of [4, 5, 6, 7, 8]) {
    for (const flatBottom of [false, true]) {
      const geo = pillow(0.66, 0.48, 0.14, mat, { grid, flatBottom, pinch: 0.45 }).geometry;
      assert.equal(geo.index, null);
      assert.equal(tris(geo), 4 * grid * grid + 8 * grid);
      assert.equal(tris(geo), pillowTriangles(grid));
      const box = bbox(geo);
      assert.ok(near(box.min.x, -0.33) && near(box.max.x, 0.33), `x grid ${grid}`);
      assert.ok(near(box.min.y, -0.24) && near(box.max.y, 0.24), `y grid ${grid}`);
      assert.ok(near(box.min.z, -0.07) && near(box.max.z, 0.07), `z grid ${grid} flat ${flatBottom}`);
      for (const [edge, n] of edgeUses(geo)) assert.equal(n, 2, `open edge ${edge}`);
      assert.ok(signedVolume(geo) > 0, 'faces point outward');
    }
  }
});

test('pillow: flat bottom is planar, seams pinch, options are clamped', () => {
  const geo = pillow(0.5, 0.5, 0.1, mat, { flatBottom: true, grid: 6 }).geometry;
  const p = geo.attributes.position;
  let bottom = 0;
  for (let i = 0; i < p.count; i++) if (near(p.getZ(i), -0.05)) bottom++;
  assert.ok(bottom >= 2 * 36 * 3, 'every bottom-skin vertex lies on z = −t/2');
  const lens = pillow(0.5, 0.5, 0.1, mat, { pinch: 0.6 }).geometry;
  const lp = lens.attributes.position;
  let seam = 0;
  for (let i = 0; i < lp.count; i++) if (near(Math.abs(lp.getX(i)), 0.25) && near(Math.abs(lp.getY(i)), 0.25)) seam = Math.max(seam, Math.abs(lp.getZ(i)));
  assert.ok(near(seam, 0.05 * 0.4), 'corner seam half-thickness is (t/2)(1 − pinch)');
  const wild = pillow(0.5, 0.4, 0.1, mat, { pinch: 3, waist: 1, grid: 40 }).geometry;
  assert.equal(tris(wild), pillowTriangles(8));
  const box = bbox(wild);
  assert.ok(near(box.max.x, 0.25) && near(box.max.y, 0.2) && near(box.max.z, 0.05));
  const a = pillow(0.5, 0.4, 0.1, mat).geometry.attributes.position.array;
  const b = pillow(0.5, 0.4, 0.1, mat).geometry.attributes.position.array;
  assert.deepEqual(a, b);
});

const MATTRESSES = [0.9, 1.4, 1.6, 1.8];
const base = (W, extra = {}) => ({
  top: 0.55, width: W, x0: 0.3, zStart: -0.35, zEnd: 1.0, radius: 0.04, thickness: 0.06,
  crown: 0.03, flare: 0.02, cornerSag: 0.04, wrinkle: 0.006, seed: 42, fold: { depth: 0.3, roll: 0.075 }, ...extra,
});
const MODES = {
  drape: { side: { mode: 'drape', drop: 0.3 }, foot: { mode: 'drape', drop: 0.28 } },
  tuck: { side: { mode: 'tuck' }, foot: { mode: 'tuck' } },
  taper: { side: { mode: 'drape', drop: 0.25 }, foot: { mode: 'tuck' } },
};

function allPositions(sheet) {
  const out = [];
  for (const geo of [sheet.main, sheet.fold].filter(Boolean)) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(p, i));
  }
  return out;
}

test('drapeSheet: hem never below top − drop − cornerSag; tuck stays inside the mattress footprint', () => {
  for (const W of MATTRESSES) {
    for (const [mode, sides] of Object.entries(MODES)) {
      for (const res of ['full', 'low']) {
        const o = base(W, { ...sides, res });
        const sheet = drapeSheet(o);
        const pts = allPositions(sheet);
        const drop = Math.max(sides.side.drop ?? 0, sides.foot.drop ?? 0, o.radius);
        const floor = o.top - drop - o.cornerSag - 0.001;
        assert.ok(pts.every((v) => v.y >= floor), `${W} ${mode} ${res}: below the drape floor`);
        assert.ok(pts.every((v) => Number.isFinite(v.x + v.y + v.z)));
        for (const geo of [sheet.main, sheet.fold].filter(Boolean)) assert.ok(geo.attributes.normal.array.every(Number.isFinite));
        const maxX = Math.max(...pts.map((v) => Math.abs(v.x - o.x0)));
        const maxZ = Math.max(...pts.map((v) => v.z));
        if (mode === 'tuck') {
          assert.ok(maxX <= W / 2 + 1e-6, `${W} tuck: |x| ${maxX}`);
          assert.ok(maxZ <= o.zEnd + 0.001, `${W} tuck: z ${maxZ}`);
        } else {
          const maxOffset = Math.max(o.thickness, 2 * o.fold.roll) + o.wrinkle;
          assert.ok(maxX <= W / 2 + maxOffset + o.flare + 1e-6, `${W} ${mode}: |x| ${maxX}`);
          if (mode === 'taper') assert.ok(maxZ <= o.zEnd + 0.001, `${W} taper: z ${maxZ}`);
        }
        const n = tris(sheet.main) + tris(sheet.fold);
        assert.ok(n <= DRAPE_TRI_CAP, `${W} ${mode} ${res}: ${n} triangles`);
      }
    }
  }
});

test('drapeSheet: triangle counts per resolution, hem bands close the outer skin', () => {
  const full = drapeSheet(base(1.6, MODES.drape));
  assert.equal(tris(full.main), 16 * 9 * 2 + 4 * (16 + 9));
  assert.equal(tris(full.fold), 16 * 5 * 2 + 2 * (2 * 5 + 16));
  const low = drapeSheet(base(1.6, { ...MODES.drape, res: 'low' }));
  assert.equal(tris(low.main), 12 * 7 * 2 + 4 * (12 + 7));
  assert.equal(tris(low.fold), 12 * 4 * 2 + 2 * (2 * 4 + 12));
  const total = (s) => tris(s.main) + tris(s.fold);
  assert.ok(total(full) >= 550 && total(full) <= 700, `full ${total(full)}`);
  assert.ok(total(low) >= 350 && total(low) <= 450, `low ${total(low)}`);
  const open = [...edgeUses(full.main).values()].filter((n) => n === 1).length;
  assert.equal(open, 2 * (16 + 9), 'only the inner hem ring is open');
});

function rayDown(mesh, from) {
  const ray = new THREE.Raycaster(from.clone().add(new THREE.Vector3(1.3e-4, 1e-4, 0.7e-4)), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObject(mesh, false);
  return hits.length ? hits[0].distance - 1e-4 : null;
}

test('drapeSheet: fold layer and runner throw lie above the main sheet', () => {
  for (const W of MATTRESSES) {
    const o = base(W, MODES.drape);
    const sheet = drapeSheet(o);
    const main = new THREE.Mesh(sheet.main, mat);
    const fold = sheet.fold.attributes.position;
    const zFrom = o.zStart + 0.02, zTo = o.zStart + o.fold.depth - 0.02;
    let checked = 0;
    for (let i = 0; i < fold.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(fold, i);
      if (v.z < zFrom || v.z > zTo || Math.abs(v.x - o.x0) > W / 2 - o.radius - 0.01) continue;
      if (v.y < o.top + 2 * o.fold.roll - 0.001) continue;
      const d = rayDown(main, v);
      assert.ok(d !== null && d >= 2 * o.fold.roll - o.thickness - o.wrinkle - 0.002, `${W}: fold ${d} above the main sheet`);
      checked++;
    }
    assert.ok(checked > 10);
    const runner = drapeSheet({
      ...o, zStart: o.zEnd - 0.5, thickness: 0.018, lift: o.thickness + 0.002, fold: null, seed: 3,
      crownRegion: { zFrom: o.zStart, zTo: o.zEnd - o.radius }, flareDrop: 0.3,
      side: { mode: 'drape', drop: 0.33 }, foot: { mode: 'drape', drop: 0.31 },
    });
    assert.ok(tris(runner.main) <= 350, `runner ${tris(runner.main)}`);
    const rp = runner.main.attributes.position;
    let above = 0;
    for (let i = 0; i < rp.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(rp, i);
      if (v.y < o.top - 0.005 || Math.abs(v.x - o.x0) > W / 2 - 0.01 || v.z > o.zEnd - 0.01) continue;
      const d = rayDown(main, v);
      assert.ok(d !== null && d >= 0.001, `${W}: runner vertex ${d} above the duvet`);
      above++;
    }
    assert.ok(above > 10);
    let outside = 0;
    for (let i = 0; i < rp.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(rp, i);
      if (v.x - o.x0 < W / 2 + 0.005 || v.y > o.top - 0.06 || v.y < o.top - 0.27 || v.z > o.zEnd - 0.06) continue;
      const ray = new THREE.Raycaster(v.clone().add(new THREE.Vector3(1e-4, 0.7e-4, 1.3e-4)), new THREE.Vector3(-1, 0, 0));
      const hit = ray.intersectObject(main, false)[0];
      assert.ok(hit && hit.distance - 1e-4 >= 0.001, `${W}: runner side vertex ${hit?.distance} outside the duvet`);
      outside++;
    }
    assert.ok(outside > 4);
  }
});

test('drapeSheet: deterministic, wrinkle hashed from the seed', () => {
  const o = base(1.4, MODES.drape);
  const a = drapeSheet(o), b = drapeSheet(o);
  assert.deepEqual(a.main.attributes.position.array, b.main.attributes.position.array);
  assert.deepEqual(a.fold.attributes.position.array, b.fold.attributes.position.array);
  const c = drapeSheet({ ...o, seed: 43 });
  assert.notDeepEqual(a.main.attributes.position.array, c.main.attributes.position.array);
  const flat = drapeSheet({ ...o, wrinkle: 0, seed: 1 }), flat2 = drapeSheet({ ...o, wrinkle: 0, seed: 2 });
  assert.deepEqual(flat.main.attributes.position.array, flat2.main.attributes.position.array);
  assert.equal(drapeSheet({ ...o, fold: null }).fold, null);
  assert.equal(a.main.index, null);
  assert.equal(a.main.attributes.uv, undefined);
});
