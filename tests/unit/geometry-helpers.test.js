import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { beam, boxProjectUVs, endPanelShape, extrudeProfile, latheSolid } from '../../src/core/geometry.js';
import { splitSpan } from '../../src/core/layout.js';
import { FRAME_COLORS, STONE_TONES, WOODS, hsl, pickWood, secondaryColor } from '../../src/core/color.js';
import { createRng } from '../../src/core/rng.js';

const mat = new THREE.MeshBasicMaterial();
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const triangles = (geo) => (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
const boxOf = (object) => {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
};
const geoBox = (geo) => {
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

test('beam: 44 triangles at 2 steps, exact extents, outward faces', () => {
  const along = beam(new THREE.Vector3(-0.5, 0.4, 0.1), new THREE.Vector3(0.5, 0.4, 0.1), 0.08, 0.02, 0.005, mat);
  assert.equal(triangles(along.geometry), 44);
  assert.equal(along.geometry.index, null);
  const box = boxOf(along);
  assert.ok(near(box.min.x, -0.5) && near(box.max.x, 0.5));
  assert.ok(near(box.min.y, 0.39) && near(box.max.y, 0.41));
  assert.ok(near(box.min.z, 0.06) && near(box.max.z, 0.14));
  assert.ok(near(signedVolume(along.geometry), 0.08 * 0.02 * 1, 1e-4));
  assert.equal(triangles(beam(new THREE.Vector3(), new THREE.Vector3(1, 0, 0), 0.05, 0.05, 0.01, mat, 3).geometry), 60);

  const post = beam(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.7, 0), 0.06, 0.12, 0.006, mat);
  const pb = boxOf(post);
  assert.ok(near(pb.min.y, 0) && near(pb.max.y, 0.7));
  assert.ok(near(pb.max.x - pb.min.x, 0.06) && near(pb.max.z - pb.min.z, 0.12));
  assert.ok(signedVolume(post.geometry) > 0);

  const slant = beam(new THREE.Vector3(0.1, 0.05, -0.3), new THREE.Vector3(0.1, 0.7, 0.2), 0.05, 0.03, 0.004, mat);
  assert.ok(signedVolume(slant.geometry) > 0);
  assert.ok(near(boxOf(slant).max.x - boxOf(slant).min.x, 0.05));
  const uv = along.geometry.attributes.uv;
  let maxU = 0;
  for (let i = 0; i < uv.count; i++) maxU = Math.max(maxU, uv.getX(i));
  assert.ok(near(maxU, 1, 1e-5));
});

test('splitSpan: equal parts with gaps that fill the span', () => {
  const parts = splitSpan(-1, 1, 3, 0.02);
  assert.equal(parts.length, 3);
  const size = (2 - 0.04) / 3;
  for (const part of parts) assert.ok(near(part.size, size));
  assert.ok(near(parts[0].center - size / 2, -1));
  assert.ok(near(parts[2].center + size / 2, 1));
  assert.ok(near(parts[1].center - parts[0].center, size + 0.02));
  assert.deepEqual(splitSpan(0, 1, 1, 0.5), [{ center: 0.5, size: 1 }]);
  assert.equal(splitSpan(0, 0.01, 5, 0.01)[0].size, 0.001);
});

test('extrudeProfile: exact outline extents, centred on the extrusion axis, closed and not mirrored', () => {
  const outline = [new THREE.Vector2(-0.2, 0), new THREE.Vector2(0.25, 0), new THREE.Vector2(0.25, 0.5), new THREE.Vector2(-0.2, 0.5)];
  const side = extrudeProfile(outline, 0.04, 0.006, 'side');
  const sb = geoBox(side);
  assert.ok(near(sb.min.y, 0) && near(sb.max.y, 0.5));
  assert.ok(near(sb.min.z, -0.2) && near(sb.max.z, 0.25));
  assert.ok(near(sb.min.x, -0.02) && near(sb.max.x, 0.02));
  assert.ok(near(signedVolume(side), 0.45 * 0.5 * 0.04, 2e-4));

  const front = extrudeProfile(new THREE.Shape(outline), 0.04, 0.006, 'front');
  const fb = geoBox(front);
  assert.ok(near(fb.min.x, -0.2) && near(fb.max.x, 0.25));
  assert.ok(near(fb.min.z, -0.02) && near(fb.max.z, 0.02));
  assert.ok(signedVolume(front) > 0);
  assert.ok(triangles(side) < 200);
});

test('endPanelShape: every cut keeps the outline, grounded feet and clamps the cut', () => {
  for (const cut of ['none', 'arch', 'v', 'notch']) {
    const shape = endPanelShape(0.4, 0.45, { cut, cutWidth: 0.2, cutHeight: 0.15 });
    const pts = shape.getPoints();
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    assert.ok(near(Math.min(...xs), -0.2) && near(Math.max(...xs), 0.2), cut);
    assert.ok(near(Math.min(...ys), 0) && near(Math.max(...ys), 0.45), cut);
    const geo = extrudeProfile(shape, 0.03, 0.005, 'side');
    const box = geoBox(geo);
    assert.ok(near(box.min.y, 0) && near(box.max.y, 0.45), cut);
    assert.ok(signedVolume(geo) > 0, cut);
    const area = THREE.ShapeUtils.area(pts);
    assert.ok(area > 0, cut);
    if (cut !== 'none') assert.ok(area < 0.4 * 0.45 - 0.01, cut);
    if (cut !== 'none') assert.ok(near(Math.max(...pts.filter((p) => Math.abs(p.x) < 0.099).map((p) => p.y)), 0.15) || cut === 'notch', cut);
  }
  const clamped = endPanelShape(0.4, 0.45, { cut: 'notch', cutWidth: 1, cutHeight: 1 }).getPoints();
  const inner = clamped.filter((p) => p.y > 0 && p.y < 0.45);
  assert.ok(near(Math.max(...inner.map((p) => Math.abs(p.x))), 0.12));
  assert.ok(near(Math.max(...inner.map((p) => p.y)), 0.405));
});

test('latheSolid: closed solid from the floor, 2 * sides * (points + 1) triangles', () => {
  const geo = latheSolid([[0.15, 0], [0.12, 0.2], [0.16, 0.4]], 12);
  assert.equal(triangles(geo), 2 * 12 * (3 + 1));
  const box = geoBox(geo);
  assert.ok(near(box.min.y, 0) && near(box.max.y, 0.4));
  assert.ok(box.max.x <= 0.16 + 1e-9);
  const cylinder = latheSolid([[0.1, 0], [0.1, 1]], 32);
  assert.ok(near(Math.abs(signedVolume(cylinder)), Math.PI * 0.01, 2e-3));
  assert.equal(triangles(latheSolid([[0, 0], [0.1, 0.1], [0, 0.2]], 8)), 2 * 8 * 2);
});

test('boxProjectUVs: per-meter UVs on the dominant axis plane, converts indexed geometry', () => {
  const geo = boxProjectUVs(new THREE.BoxGeometry(2, 0.2, 1), 0.5);
  assert.equal(geo.index, null);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i += 3) {
    const tops = [0, 1, 2].every((k) => near(pos.getY(i + k), 0.1));
    if (!tops) continue;
    for (let k = 0; k < 3; k++) {
      assert.ok(near(uv.getX(i + k), pos.getX(i + k) / 0.5));
      assert.ok(near(uv.getY(i + k), pos.getZ(i + k) / 0.5));
    }
  }
  const already = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  assert.equal(boxProjectUVs(already), already);
  let span = 0;
  for (let i = 0; i < uv.count; i++) span = Math.max(span, Math.abs(uv.getX(i)));
  assert.ok(near(span, 2));
});

test('palette constants: stone tones, frame colours, chair secondary formulas, pickWood draws 3', () => {
  assert.deepEqual(STONE_TONES.map((t) => t.name), ['white marble', 'black marble', 'travertine', 'grey terrazzo']);
  for (const t of STONE_TONES) assert.ok(t.s <= 0.75 && t.l >= 0.15 && t.l <= 0.9);
  assert.deepEqual(FRAME_COLORS, { black: '#2a2a2c', white: '#efefea', metal: '#a7abb0' });
  assert.equal(secondaryColor('light', 0.3), hsl(0.3, 0.4, 0.85));
  assert.equal(secondaryColor('dark', 0.3), hsl(0.3, 0.5, 0.22));
  assert.equal(secondaryColor('complement', 0.7), hsl(0.2, 0.55, 0.55));
  assert.equal(secondaryColor('white', 0.3), '#f4f1ea');
  const r = createRng('wood'), ref = createRng('wood');
  const wood = pickWood(r);
  const tone = ref.pick(WOODS);
  assert.equal(wood.name, tone.name);
  assert.equal(wood.h, tone.h + ref.range(-0.01, 0.01));
  assert.equal(wood.l, tone.l + ref.range(-0.05, 0.05));
  assert.equal(wood.s, tone.s);
  assert.equal(r.next(), ref.next());
});
