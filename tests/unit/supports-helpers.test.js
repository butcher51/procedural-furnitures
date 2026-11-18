import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildApron,
  buildLegs,
  buildPedestal,
  buildStretchers,
  buildTrestle,
  legAnchors,
  legLines,
  pointOnLeg,
  rowAnchors,
} from '../../src/core/supports.js';
import { generateItem } from '../../src/core/item.js';
import * as registry from '../../src/furniture/registry.js';

const mat = new THREE.MeshBasicMaterial();
const mats = { frame: mat };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const boxOf = (object) => {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
};
const trianglesOf = (object) => {
  let n = 0;
  object.traverse((o) => {
    if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });
  return n;
};
const legs = (overrides = {}) => ({ legCount: 4, legThickness: 0.04, legSides: 6, legTaper: 0.8, legSplay: 0.05, puff: 0.006, ...overrides });

test('rowAnchors: two straight rows in perimeter order', () => {
  const same = (actual, expected) => {
    assert.equal(actual.length, expected.length);
    actual.forEach(([x, z], i) => assert.ok(near(x, expected[i][0]) && near(z, expected[i][1]), `${i}: ${x}, ${z}`));
  };
  same(rowAnchors(1.6, 0.4, 2, 0.1, 0.05), [[-0.7, 0.15], [0.7, 0.15], [0.7, -0.15], [-0.7, -0.15]]);
  same(rowAnchors(2, 0.8, 3, 0.1, 0.1), [[-0.9, 0.3], [0, 0.3], [0.9, 0.3], [0.9, -0.3], [0, -0.3], [-0.9, -0.3]]);
});

test('legAnchors returns fp.anchors unchanged and buildLegs builds one strut per anchor', () => {
  const anchors = rowAnchors(1.5, 0.4, 3, 0.1, 0.05);
  const fp = { width: 1.5, depth: 0.4, top: 0.42, anchors };
  assert.equal(legAnchors(legs({ legCount: 6 }), fp), anchors);
  const group = buildLegs(legs({ legCount: 6 }), mats, fp);
  assert.equal(group.children.length, 6);
  assert.ok(boxOf(group).min.y > -0.02 && boxOf(group).min.y <= 0);
});

test('legLines equal the struts buildLegs builds for every classic and cozy chair with 3+ legs', () => {
  const chair = registry.get('chair');
  let checked = 0;
  for (let n = 1; n <= 500; n++) {
    const p = generateItem(chair, 'leglines', n);
    if (p.style === 'curvy' || p.legCount < 3) continue;
    const fp = { width: p.seatWidth, depth: p.seatDepth, top: p.seatHeight - p.seatThickness, round: p.seatShape === 'round' };
    const lines = legLines(p, fp);
    const struts = buildLegs(p, mats, fp).children;
    assert.equal(struts.length, lines.length);
    lines.forEach((line, i) => {
      const s = struts[i];
      const mid = new THREE.Vector3().addVectors(line.top, line.bottom).multiplyScalar(0.5);
      assert.ok(s.position.equals(mid), `#${n} leg ${i}`);
      assert.equal(s.geometry.parameters.height, line.top.distanceTo(line.bottom));
      assert.equal(s.geometry.parameters.radiusTop, line.rTop);
      assert.equal(s.geometry.parameters.radiusBottom, line.rBottom);
      assert.equal(line.bottom.y, 0);
      assert.equal(line.top.y, fp.top);
    });
    checked++;
  }
  assert.ok(checked > 150, `${checked}`);
  assert.deepEqual(legLines(legs({ legCount: 2 }), { width: 1, depth: 1, top: 0.4 }), []);
  assert.deepEqual(legLines(legs({ legCount: 0 }), { width: 1, depth: 1, top: 0.4 }), []);
});

test('fp.splayAxes: a middle leg splays in z only and every foot moves legSplay', () => {
  const p = legs({ legCount: 6, legSplay: 0.06 });
  const fp = { width: 1.6, depth: 0.4, top: 0.45, anchors: rowAnchors(1.6, 0.4, 3, 0.1, 0.05), splayAxes: [0.4, 1] };
  for (const line of legLines(p, fp)) {
    const dx = line.bottom.x - line.top.x, dz = line.bottom.z - line.top.z;
    assert.ok(near(Math.hypot(dx, dz), 0.06));
    assert.ok(Math.sign(dz) === Math.sign(line.top.z));
    if (line.top.x === 0) assert.equal(dx, 0);
    else assert.ok(Math.abs(dx) < Math.abs(dz));
  }
});

test('pointOnLeg is linear along the axis', () => {
  const line = { top: new THREE.Vector3(0.2, 0.5, 0.2), bottom: new THREE.Vector3(0.3, 0, 0.3) };
  assert.ok(pointOnLeg(line, 0).equals(line.bottom));
  assert.ok(pointOnLeg(line, 0.5).equals(line.top));
  const mid = pointOnLeg(line, 0.25);
  assert.ok(near(mid.x, 0.25) && near(mid.y, 0.25) && near(mid.z, 0.25));
});

test('buildStretchers: every kind, rail ends on the legs, asserts on 3 legs for h/ends', () => {
  const fp = { width: 0.5, depth: 0.45, top: 0.7 };
  const four = legLines(legs(), fp);
  const six = legLines(legs({ legCount: 6 }), { ...fp, width: 1.4, anchors: rowAnchors(1.4, 0.45, 3, 0.08, 0.06) });
  const opts = { radius: 0.01 };
  assert.equal(buildStretchers(four, 'none', 0.2, opts, mat).children.length, 0);
  assert.equal(buildStretchers(four, 'ring', 0.2, opts, mat).children.length, 1);
  assert.equal(buildStretchers(four, 'perimeter', 0.2, opts, mat).children.length, 4);
  assert.equal(buildStretchers(six, 'perimeter', 0.2, opts, mat).children.length, 6);
  assert.equal(buildStretchers(four, 'h', 0.2, opts, mat).children.length, 3);
  assert.equal(buildStretchers(six, 'h', 0.2, opts, mat).children.length, 3);
  assert.equal(buildStretchers(four, 'ends', 0.2, opts, mat).children.length, 2);
  assert.equal(buildStretchers(four, 'cross', 0.2, opts, mat).children.length, 5);
  const three = legLines(legs({ legCount: 3 }), fp);
  assert.throws(() => buildStretchers(three, 'h', 0.2, opts, mat));
  assert.equal(buildStretchers(three, 'cross', 0.2, opts, mat).children.length, 4);

  const ends = buildStretchers(six, 'ends', 0.2, opts, mat);
  const ex = ends.children.map((c) => c.position.x).sort((a, b) => a - b);
  const legX = six.map((l) => pointOnLeg(l, 0.2).x);
  assert.ok(near(ex[0], Math.min(...legX)) && near(ex[1], Math.max(...legX)));
  for (const rail of ends.children) assert.ok(near(rail.position.y, 0.2));

  const ring = buildStretchers(four, 'ring', 0.25, opts, mat).children[0];
  const path = ring.geometry.parameters.path;
  for (const line of four) {
    const target = pointOnLeg(line, 0.25);
    let best = Infinity;
    for (let t = 0; t <= 1; t += 0.001) best = Math.min(best, path.getPoint(t).distanceTo(target));
    assert.ok(best < 1e-3);
  }

  const staggered = buildStretchers(four, 'perimeter', 0.2, { radius: 0.01, stagger: 0.04 }, mat);
  const ys = staggered.children.map((c) => Math.round(c.position.y * 1000));
  assert.deepEqual([...new Set(ys)].sort(), [200, 240]);
  const square = buildStretchers(four, 'perimeter', 0.2, { radius: 0.01, profile: 'square' }, mat);
  assert.equal(trianglesOf(square), 4 * 44);
});

test('buildApron: rails under the top on every edge, filters long/short, setback moves inward', () => {
  const fp = { width: 1.2, depth: 0.7, top: 0.72 };
  const lines = legLines(legs({ legSplay: 0 }), fp);
  const apron = buildApron(lines, { top: 0.72, height: 0.08, thickness: 0.02 }, mat);
  assert.equal(apron.children.length, 4);
  const box = boxOf(apron);
  assert.ok(near(box.max.y, 0.72) && near(box.min.y, 0.64));
  assert.equal(buildApron(lines, { top: 0.72, height: 0.08, thickness: 0.02, edges: 'long' }, mat).children.length, 2);
  assert.equal(buildApron(lines, { top: 0.72, height: 0.08, thickness: 0.02, edges: 'short' }, mat).children.length, 2);
  const set = boxOf(buildApron(lines, { top: 0.72, height: 0.08, thickness: 0.02, setback: 0.01 }, mat));
  assert.ok(near(set.max.x, box.max.x - 0.01) && near(set.max.z, box.max.z - 0.01));
  assert.equal(trianglesOf(apron), 4 * 44);
});

test('buildPedestal: every base stands on y = 0 and reaches top, tripod symmetric in x', () => {
  for (const base of ['disc', 'cone', 'cross', 'tripod']) {
    const ped = buildPedestal({ top: 0.72, base, baseRadius: 0.25, baseHeight: 0.03, columnRadius: 0.035, sleeve: { radius: 0.05, height: 0.2 }, cap: { radius: 0.12, height: 0.02 } }, mat);
    const box = boxOf(ped);
    assert.ok(near(box.min.y, 0), `${base} min y ${box.min.y}`);
    assert.ok(near(box.max.y, 0.72), `${base} max y ${box.max.y}`);
    assert.ok(box.max.x <= 0.25 + 1e-6 && box.max.z <= 0.25 + 1e-6, base);
    assert.ok(near(box.min.x, -box.max.x, 1e-6), base);
    assert.ok(trianglesOf(ped) < 1000, `${base} ${trianglesOf(ped)}`);
  }
  const plain = boxOf(buildPedestal({ top: 0.6, base: 'disc', baseRadius: 0.2, baseHeight: 0.02, columnRadius: 0.03 }, mat));
  assert.ok(near(plain.max.y, 0.6));
});

test('buildTrestle: I, A and X frames stand on y = 0, reach top, about 0.5k triangles', () => {
  const spec = { length: 1.8, depth: 0.9, top: 0.72, inset: 0.25, footLength: 0.75, footHeight: 0.06, beamWidth: 0.08, postDepth: 0.14, cleatHeight: 0.05, stretcherHeight: 0.3 };
  for (const kind of ['I', 'A', 'X']) {
    const t = buildTrestle({ ...spec, kind }, mat);
    const box = boxOf(t);
    assert.ok(near(box.min.y, 0), `${kind} min y`);
    assert.ok(near(box.max.y, 0.72, 1e-5), `${kind} max y ${box.max.y}`);
    assert.ok(near(box.max.x, 0.9 - 0.25 + 0.04) && near(box.min.x, -box.max.x), kind);
    assert.ok(box.max.z <= Math.max(0.75, 0.72) / 2 + 1e-6, kind);
    assert.ok(trianglesOf(t) <= 600, `${kind} ${trianglesOf(t)}`);
  }
  assert.equal(buildTrestle({ ...spec, kind: 'I', stretcher: false }, mat).children.length, 6);
});
