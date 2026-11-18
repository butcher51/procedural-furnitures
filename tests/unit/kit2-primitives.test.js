import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGroupedRng, createRng, rollCycle, rollStyle, weightedPick, weightedShuffle } from '../../src/core/rng.js';
import * as THREE from 'three';
import { hsl, LEATHERS, pickLeather, pickWood, WOODS } from '../../src/core/color.js';
import { colourIsCalm } from '../../src/core/palette.js';
import { buildFeet, buildFramedPanel, buildTrestle, turnedPost } from '../../src/core/supports.js';

const STYLES = { bar: 0.25, counter: 0.2, diner: 0.15, milking: 0.15, drum: 0.15, slab: 0.1 };

function wave1RollStyle(g, styles) {
  const entries = Object.entries(styles);
  const base = weightedPick(createRng(`${g.seed}/style/0`), styles);
  const n = g.count('style');
  if (n === 0) return base;
  const others = entries.filter(([value]) => value !== base);
  const cycle = [...weightedShuffle(createRng(`${g.seed}/style/order`), others), base];
  return cycle[(n - 1) % cycle.length];
}

test('rollStyle is rollCycle on the style group and matches the wave-1 streams (2,000 seeds x counts 0-6)', () => {
  for (let i = 0; i < 2000; i++) {
    for (let n = 0; n <= 6; n++) {
      const g = createGroupedRng(`cycle-${i}`, { style: n });
      const expected = wave1RollStyle(g, STYLES);
      assert.equal(rollStyle(g, STYLES), expected);
      assert.equal(rollCycle(g, 'style', STYLES), expected);
    }
  }
});

test('rollCycle cycles any group on its own streams and leaves other groups alone', () => {
  const KINDS = { sideboard: 0.3, dresser: 0.28, nightstand: 0.22, tv: 0.2 };
  for (let i = 0; i < 200; i++) {
    const seed = `kind-${i}`;
    const at = (n, extra = {}) => rollCycle(createGroupedRng(seed, { kind: n, ...extra }), 'kind', KINDS);
    const base = at(0);
    assert.equal(base, weightedPick(createRng(`${seed}/kind/0`), KINDS));
    const visited = [1, 2, 3].map((n) => at(n));
    assert.deepStrictEqual(new Set(visited).size, 3);
    assert.ok(!visited.includes(base));
    assert.equal(at(4), base);
    assert.equal(at(5), visited[0]);
    assert.equal(at(2, { style: 3, shape: 1 }), visited[1]);
    assert.equal(rollStyle(createGroupedRng(seed, { kind: 2 }), STYLES), rollStyle(createGroupedRng(seed), STYLES));
  }
});

function wave1PickWood(r) {
  const wood = r.pick(WOODS);
  const h = wood.h + r.range(-0.01, 0.01);
  const l = wood.l + r.range(-0.05, 0.05);
  return { name: wood.name, h, s: wood.s, l };
}

test('pickWood without weights is the wave-1 code path', () => {
  for (let i = 0; i < 500; i++) {
    const a = createRng(`wood-${i}`), b = createRng(`wood-${i}`);
    assert.deepStrictEqual(pickWood(a), wave1PickWood(b));
    assert.deepStrictEqual(pickWood(a, {}), wave1PickWood(b));
    assert.equal(a.next(), b.next());
  }
});

test('pickWood weights bias the species, missing names never come, still 3 draws', () => {
  const weights = { walnut: 0.6, oak: 0.4 };
  const counts = {};
  for (let i = 0; i < 4000; i++) {
    const r = createRng(`bias-${i}`), twin = createRng(`bias-${i}`);
    const wood = pickWood(r, { weights });
    counts[wood.name] = (counts[wood.name] ?? 0) + 1;
    twin.next(); twin.next(); twin.next();
    assert.equal(r.next(), twin.next());
  }
  assert.deepStrictEqual(Object.keys(counts).sort(), ['oak', 'walnut']);
  assert.ok(Math.abs(counts.walnut / 4000 - 0.6) < 0.03, JSON.stringify(counts));
});

test('LEATHERS: five calm tones across the full jitter, pickLeather uses 3 draws', () => {
  assert.deepStrictEqual(LEATHERS.map((t) => t.name), ['tan', 'cognac', 'chocolate', 'oxblood', 'bottle green']);
  for (const tone of LEATHERS) {
    for (const dh of [-0.01, 0, 0.01]) for (const dl of [-0.03, 0, 0.03]) {
      const hex = hsl((tone.h + dh + 1) % 1, tone.s, tone.l + dl);
      assert.ok(colourIsCalm(hex), `${tone.name} ${dh} ${dl} ${hex}`);
    }
  }
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const r = createRng(`leather-${i}`), twin = createRng(`leather-${i}`);
    const leather = pickLeather(r);
    seen.add(leather.name);
    assert.match(leather.hex, /^#[0-9a-f]{6}$/);
    assert.ok(colourIsCalm(leather.hex));
    twin.next(); twin.next(); twin.next();
    assert.equal(r.next(), twin.next());
  }
  assert.equal(seen.size, 5);
});

const mat = new THREE.MeshBasicMaterial();
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
const meshesOf = (object) => {
  const list = [];
  object.traverse((o) => o.isMesh && list.push(o));
  return list;
};

test('buildTrestle backRail: one beam under the cleats rear ends, off by default', () => {
  const spec = { length: 1.6, depth: 0.7, top: 0.74, inset: 0.2, footLength: 0.65, footHeight: 0.05, beamWidth: 0.06, cleatHeight: 0.05, stretcherHeight: 0.2 };
  for (const kind of ['I', 'A', 'X']) {
    const plain = buildTrestle({ ...spec, kind }, mat);
    const railed = buildTrestle({ ...spec, kind, backRail: true }, mat);
    assert.equal(railed.children.length, plain.children.length + 1);
    const rail = boxOf(railed.children[railed.children.length - 1]);
    const cleatLength = 0.8 * spec.depth;
    assert.ok(near(rail.max.y, spec.top - spec.cleatHeight, 1e-5), `${kind} top ${rail.max.y}`);
    assert.ok(near(rail.min.z, -cleatLength / 2, 1e-5), `${kind} z ${rail.min.z}`);
    assert.ok(near(rail.max.x, 0.6) && near(rail.min.x, -0.6), kind);
  }
});

test('turnedPost: table leg (one block on top), grounded, exact height, triangle count', () => {
  const post = turnedPost({ height: 0.7, thickness: 0.06, blocks: [[0.6, 0.7]] }, mat);
  const box = boxOf(post);
  assert.ok(near(box.min.y, 0) && near(box.max.y, 0.7));
  assert.ok(near(box.max.x, 0.03, 1e-5) && near(box.min.x, -0.03, 1e-5));
  assert.equal(trianglesOf(post), 2 * 8 * 10 + 44);
  for (const mesh of meshesOf(post)) assert.ok(mesh.geometry.attributes.grain);
});

test('turnedPost: blocks split the turning, simple profile, finial, sides', () => {
  const post = turnedPost({ height: 2, thickness: 0.08, blocks: [[0.5, 0.65], [0, 0.12]], profiles: ['simple', 'classic'], finial: 0.06, sides: 6 }, mat);
  const box = boxOf(post);
  assert.ok(near(box.min.y, 0) && near(box.max.y, 2.06, 1e-6));
  const lathes = meshesOf(post).filter((m) => m.geometry.type === 'LatheGeometry');
  assert.equal(lathes.length, 3);
  assert.equal(trianglesOf(lathes[0]), 2 * 6 * 6);
  assert.equal(trianglesOf(lathes[1]), 2 * 6 * 10);
  assert.ok(near(lathes[0].position.y, 0.12) && near(lathes[1].position.y, 0.65) && near(lathes[2].position.y, 2));
});

test('buildFeet: bun discs and block beams stand on the floor at each anchor', () => {
  const anchors = [[-0.4, 0.2], [0.4, -0.2]];
  const buns = buildFeet(anchors, { height: 0.06, radius: 0.03 }, mat);
  const blocks = buildFeet(anchors, { kind: 'block', height: 0.08, radius: 0.025 }, mat);
  for (const [i, [x, z]] of anchors.entries()) {
    const bun = boxOf(buns[i]);
    assert.ok(near(bun.min.y, 0) && near(bun.max.y, 0.06));
    assert.ok(near((bun.min.x + bun.max.x) / 2, x, 1e-4) && near((bun.min.z + bun.max.z) / 2, z, 1e-4));
    const block = boxOf(blocks[i]);
    assert.ok(near(block.min.y, 0) && near(block.max.y, 0.08));
    assert.ok(near(block.max.x - block.min.x, 0.05, 1e-6));
    assert.equal(trianglesOf(blocks[i]), 44);
    assert.ok(buns[i].geometry.attributes.grain);
  }
  assert.throws(() => buildFeet(anchors, { kind: 'claw', height: 0.1, radius: 0.02 }, mat));
});

test('buildFramedPanel: posts, rails and slat or bar fills between them', () => {
  const frame = new THREE.MeshBasicMaterial(), fill = new THREE.MeshBasicMaterial();
  const base = { width: 1.2, postWidth: 0.05, postDepth: 0.04, postTop: 0.9, puff: 0.004, rails: [{ y: 0.86, height: 0.08, thickness: 0.03 }, { y: 0.1, height: 0.06, thickness: 0.03 }] };
  const slats = buildFramedPanel({ ...base, fill: { kind: 'slats', count: 7, from: 0.13, to: 0.82, thickness: 0.02 } }, { frame, fill });
  assert.equal(slats.children.length, 2 + 2 + 7);
  const box = boxOf(slats);
  assert.ok(near(box.min.x, -0.6) && near(box.max.x, 0.6) && near(box.min.y, 0) && near(box.max.y, 0.9));
  const fills = slats.children.filter((c) => c.material === fill).map(boxOf);
  assert.equal(fills.length, 7);
  for (const f of fills) assert.ok(near(f.min.y, 0.13) && near(f.max.y, 0.82));
  const bars = buildFramedPanel({ ...base, postBottom: -0.02, fill: { kind: 'bars', count: 3, from: 0.13, to: 0.82, thickness: 0.02 } }, { frame, fill });
  assert.equal(bars.children.length, 7);
  assert.ok(near(boxOf(bars).min.y, -0.02));
  const wide = buildFramedPanel({ ...base, fill: { kind: 'slats', count: 4, from: 0.13, to: 0.82, thickness: 0.02, width: 0.09 } }, { frame, fill });
  const slat = boxOf(wide.children[4]);
  assert.ok(near(slat.max.x - slat.min.x, 0.09));
  assert.equal(buildFramedPanel({ ...base }, { frame, fill }).children.length, 4);
});
