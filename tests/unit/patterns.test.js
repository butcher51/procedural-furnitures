import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createKit } from '../../src/core/kit.js';
import { beam, puffy, tube } from '../../src/core/geometry.js';
import { groupParts, mergeByMaterial, disposeObject } from '../../src/core/merge.js';
import { colourIsCalm, fabricColor, paintColor } from '../../src/core/palette.js';
import { createRng } from '../../src/core/rng.js';
import { WOODS } from '../../src/core/color.js';
import {
  PATTERN_KINDS,
  PATTERN_KINDS_SPEC,
  WOOD_GRAINS,
  autoGrainAxis,
  grainAlong,
  injectPattern,
  normalizePattern,
  patternColours,
  patternProgramKey,
} from '../../src/core/patterns.js';

const kit = createKit();
const grainOf = (mesh, i = 0) => new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.grain, i);
const near = (a, b, eps = 1e-6) => a.distanceTo(b) < eps;

test('the first wave covers wood, dots, floral and the calm variations', () => {
  assert.deepEqual(PATTERN_KINDS, ['wood', 'dots', 'floral', 'gingham', 'ticking', 'herringbone', 'terrazzo', 'linen']);
});

test('pattern() builds a flat-shaded standard material with JSON spec and uniforms, no WebGL needed', () => {
  const m = kit.materials.pattern({ kind: 'dots', colors: ['#E8DCC4', '#2f3a52'], spacing: 0.04, size: 0.3, layout: 'grid', seed: 'abc' }, { roughness: 0.85 });
  assert.ok(m.isMeshStandardMaterial);
  assert.equal(m.flatShading, true);
  assert.equal(m.roughness, 0.85);
  assert.equal(m.map, null);
  assert.equal(`#${m.color.getHexString()}`, '#e8dcc4');
  const p = m.userData.pattern;
  assert.deepEqual(p, { kind: 'dots', colors: ['#e8dcc4', '#2f3a52'], scale: 1, seed: 'abc', spacing: 0.04, size: 0.3, layout: 'grid' });
  assert.deepEqual(JSON.parse(JSON.stringify(p)), p);
  const u = m.userData.uniforms;
  assert.deepEqual(u.uPatP.value.toArray(), [0.04, 0.3, 0, 0]);
  assert.equal(`#${u.uPatB.value.getHexString()}`, '#2f3a52');
  assert.ok(u.uPatSeed.value >= 0 && u.uPatSeed.value < 1);
});

test('one shader program per kind: cache key depends on the kind only', () => {
  const a = kit.materials.pattern({ kind: 'floral', colors: ['#e8dcc4'], seed: 1 });
  const b = kit.materials.pattern({ kind: 'floral', colors: ['#5b6b80'], spacing: 0.2, seed: 2 });
  const c = kit.materials.pattern({ kind: 'dots', colors: ['#e8dcc4'] });
  assert.notEqual(a, b);
  assert.equal(a.customProgramCacheKey(), b.customProgramCacheKey());
  assert.equal(a.customProgramCacheKey(), patternProgramKey('floral'));
  assert.notEqual(a.customProgramCacheKey(), c.customProgramCacheKey());
  assert.notEqual(a.userData.uniforms.uPatA, b.userData.uniforms.uPatA);
});

test('onBeforeCompile injects item-space varyings, kind code and per-material uniforms', () => {
  for (const kind of PATTERN_KINDS) {
    const m = kit.materials.pattern({ kind, colors: ['#c8b89a'] });
    const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
    m.onBeforeCompile(shader);
    assert.match(shader.vertexShader, /vPatPos = transformed;/);
    assert.match(shader.fragmentShader, /diffuseColor\.rgb = /);
    assert.equal(shader.uniforms.uPatA, m.userData.uniforms.uPatA);
    const grain = Boolean(PATTERN_KINDS_SPEC[kind].grain);
    assert.equal(/attribute vec3 grain;/.test(shader.vertexShader), grain, kind);
    assert.equal(/patPlane\(patUv, patPx\)/.test(shader.fragmentShader), !grain, kind);
  }
  const minimal = injectPattern({ uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <color_fragment>' }, 'dots', {});
  assert.match(minimal.fragmentShader, /fwidth|dFdx/);
});

test('normalizePattern fills defaults, clamps ranges, applies scale to lengths only, and rejects bad input', () => {
  const p = normalizePattern({ kind: 'ticking', colors: ['#e8dcc4'], width: 9, direction: 'diagonal', scale: 2 });
  assert.equal(p.width, 0.45);
  assert.equal(p.direction, 'vertical');
  assert.equal(p.double, false);
  assert.equal(p.colors.length, 2);
  const m = kit.materials.pattern({ kind: 'ticking', colors: ['#e8dcc4'], scale: 2 });
  assert.ok(Math.abs(m.userData.uniforms.uPatP.value.x - 0.06) < 1e-9);
  assert.ok(Math.abs(m.userData.uniforms.uPatP.value.y - 0.12) < 1e-9);
  assert.throws(() => normalizePattern({ kind: 'paisley', colors: ['#e8dcc4'] }), /Unknown pattern kind/);
  assert.throws(() => normalizePattern({ kind: 'dots', colors: ['red'] }), /#rrggbb/);
  assert.throws(() => normalizePattern({ kind: 'dots' }), /#rrggbb/);
});

test('derived pattern colours are calm for every picker colour and every kind', () => {
  const r = createRng('pattern-calm');
  for (let i = 0; i < 200; i++) {
    const base = i % 2 ? fabricColor(r, { mood: ['neutral', 'muted', 'bold'][i % 3] }).hex : paintColor(r).hex;
    for (const kind of PATTERN_KINDS) {
      for (const hex of patternColours(kit.materials.pattern({ kind, colors: [base] }))) assert.ok(colourIsCalm(hex), `${kind} ${base} -> ${hex}`);
    }
  }
});

test('derived colours keep contrast on very dark and very light bases', () => {
  for (const base of ['#2a2a2c', '#efefea']) {
    const [a, b] = normalizePattern({ kind: 'herringbone', colors: [base] }).colors;
    assert.notEqual(a, b);
  }
});

test('wood() derives three calm tones from a WOODS swatch, grain presets, none falls back to plain', () => {
  for (const wood of WOODS) {
    for (const grain of Object.keys(WOOD_GRAINS)) {
      const m = kit.materials.wood(wood, { grain, seed: 's' });
      assert.equal(m.userData.pattern.kind, 'wood');
      assert.equal(m.userData.pattern.colors.length, 3);
      assert.equal(m.userData.pattern.ringSpacing, WOOD_GRAINS[grain].ringSpacing);
      m.userData.pattern.colors.forEach((hex) => assert.ok(colourIsCalm(hex), `${wood.name} ${hex}`));
    }
  }
  const plain = kit.materials.wood('#a07850', { grain: 'none' });
  assert.equal(plain.userData.pattern, undefined);
  assert.equal(`#${plain.color.getHexString()}`, '#a07850');
  assert.throws(() => kit.materials.wood(WOODS[0], { grain: 'burl' }), /Unknown wood grain/);
});

test('surface() keeps canvas patterns and routes shader kinds and spec objects to pattern()', () => {
  const legacy = kit.materials.surface({ color: '#e8dcc4', secondary: '#5b6b80', pattern: 'stripes', scale: 4 });
  assert.equal(legacy.userData.pattern, undefined);
  assert.equal(legacy.onBeforeCompile.toString(), new THREE.MeshStandardMaterial().onBeforeCompile.toString());
  const byName = kit.materials.surface({ color: '#e8dcc4', secondary: '#5b6b80', pattern: 'gingham' });
  assert.deepEqual(byName.userData.pattern.colors.slice(0, 2), ['#e8dcc4', '#5b6b80']);
  const bySpec = kit.materials.surface({ color: '#e8dcc4', secondary: '#5b6b80', pattern: { kind: 'dots', spacing: 0.08 }, roughness: 0.7 });
  assert.equal(bySpec.userData.pattern.spacing, 0.08);
  assert.equal(bySpec.roughness, 0.7);
  assert.deepEqual(bySpec.userData.pattern.colors, ['#e8dcc4', '#5b6b80']);
});

test('grainAlong writes the axis in each mesh local frame', () => {
  const mat = kit.materials.wood(WOODS[0]);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), mat);
  assert.ok(near(grainOf(grainAlong(leg)), new THREE.Vector3(0, 1, 0)));
  const slat = puffy(0.4, 0.02, 0.5, 0.005, mat, 2);
  assert.ok(near(grainOf(grainAlong(slat, 'x')), new THREE.Vector3(1, 0, 0)));
  const group = new THREE.Group();
  const child = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
  child.rotation.y = Math.PI / 2;
  group.add(child);
  grainAlong(group, 'x');
  assert.ok(near(grainOf(child), new THREE.Vector3(0, 0, 1), 1e-9) || near(grainOf(child), new THREE.Vector3(0, 0, -1), 1e-9));
  assert.throws(() => grainAlong(leg, 'w'), /Unknown grain axis/);
});

test('autoGrainAxis follows beams, boxes and tube tangents', () => {
  const mat = kit.materials.wood(WOODS[0]);
  const slanted = beam(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, 0.9, 0), 0.05, 0.03, 0.004, mat);
  assert.ok(near(autoGrainAxis(slanted.geometry), new THREE.Vector3(0.3, 0.9, 0).normalize()));
  assert.ok(near(autoGrainAxis(new THREE.BoxGeometry(0.1, 0.1, 0.8)), new THREE.Vector3(0, 0, 1)));
  const bow = tube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, 0.3, 0), new THREE.Vector3(0.6, 0, 0)], 0.02, 6, mat);
  grainAlong(bow);
  const first = grainOf(bow, 0);
  const last = grainOf(bow, bow.geometry.attributes.grain.count - 1);
  assert.ok(first.y > 0.3 && last.y < -0.3);
});

test('mergeByMaterial carries grain into item space, fills it for parts without it, drops it elsewhere', () => {
  const wood = kit.materials.wood(WOODS[1]);
  const fabric = kit.materials.pattern({ kind: 'dots', colors: ['#e8dcc4'] });
  const slat = beam(new THREE.Vector3(-0.5, 0.4, 0), new THREE.Vector3(0.5, 0.4, 0), 0.08, 0.02, 0.004, wood);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), wood);
  leg.rotation.z = Math.PI / 2;
  const top = puffy(0.4, 0.03, 0.6, 0.005, wood, 2);
  grainAlong(top, 'x');
  const cushion = grainAlong(puffy(0.5, 0.1, 0.5, 0.02, fabric, 2), 'z');
  const merged = mergeByMaterial(groupParts([slat, leg, top, cushion]));
  assert.equal(merged.children.length, 2);
  const woodMesh = merged.children.find((m) => m.material === wood);
  const fabricMesh = merged.children.find((m) => m.material === fabric);
  assert.equal(fabricMesh.geometry.attributes.grain, undefined);
  const g = woodMesh.geometry.attributes.grain;
  assert.equal(g.count, woodMesh.geometry.attributes.position.count);
  const axes = new Set();
  for (let i = 0; i < g.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(g, i);
    assert.ok(Math.abs(v.length() - 1) < 1e-5);
    axes.add(`${Math.round(Math.abs(v.x))}${Math.round(Math.abs(v.y))}${Math.round(Math.abs(v.z))}`);
  }
  assert.deepEqual([...axes], ['100']);
  disposeObject(merged);
});

test('mergeByMaterial fills attributes that only some parts carry', () => {
  const mat = kit.materials.solid('#888888');
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
  b.geometry.deleteAttribute('uv');
  const merged = mergeByMaterial(groupParts([a, b]));
  assert.equal(merged.children.length, 1);
  assert.equal(merged.children[0].geometry.attributes.uv.count, merged.children[0].geometry.attributes.position.count);
});
