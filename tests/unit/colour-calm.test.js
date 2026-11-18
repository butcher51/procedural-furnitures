import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { colourIsCalm } from '../../src/core/palette.js';
import { paintVertices } from '../../src/core/fill.js';
import { createMaterials } from '../../src/core/materials.js';
import * as registry from '../../src/furniture/registry.js';
import { formatFailures, sweep } from '../helpers/sweep.js';

const SEEDS = 500;
const EXEMPT = new Set(['chair']);
const TODO = new Set([]);
const HEX = /^#[0-9a-f]{6}$/i;

function paramColours(value, path, out) {
  if (typeof value === 'string') {
    if (HEX.test(value)) out.push([path, value.toLowerCase()]);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => paramColours(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) paramColours(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

function vertexColours(geometry) {
  const colour = geometry?.attributes?.color;
  if (!colour) return [];
  const seen = new Set();
  const c = new THREE.Color();
  for (let i = 0; i < colour.count; i++) {
    seen.add(`#${c.setRGB(colour.getX(i), colour.getY(i), colour.getZ(i)).getHexString()}`);
  }
  return [...seen];
}

function materialColours(object) {
  const out = [];
  object.traverse((node) => {
    for (const m of node.material ? [node.material].flat() : []) {
      if (m.color) out.push([`material ${m.name || m.type}`, `#${m.color.getHexString()}`]);
      for (const hex of m.userData?.pattern?.colors ?? []) out.push([`pattern ${m.userData.pattern.kind}`, hex]);
      if (m.vertexColors) for (const hex of vertexColours(node.geometry)) out.push([`vertex colour (${m.userData?.role ?? m.type})`, hex]);
    }
  });
  return out;
}

function loudColours({ params, object }) {
  const seen = new Set();
  const loud = [];
  for (const [where, hex] of [...paramColours(params, '', []), ...materialColours(object)]) {
    if (seen.has(where + hex)) continue;
    seen.add(where + hex);
    if (!colourIsCalm(hex)) loud.push(`${where} ${hex} is not calm`);
  }
  return loud;
}

test('loudColours finds neon in params and accepts calm ones', () => {
  assert.deepEqual(paramColours({ a: '#4DCB51', b: ['#2a2a2c', 'x'], c: { d: 1 } }, '', []), [['a', '#4dcb51'], ['b[0]', '#2a2a2c']]);
  const object = { traverse: () => {} };
  assert.equal(loudColours({ params: { a: '#4dcb51', b: '#2a2a2c' }, object }).length, 1);
});

test('loudColours reads vertex colours of vertex-colour materials as sRGB hex', () => {
  const geometry = paintVertices(new THREE.BoxGeometry(1, 1, 1), (n) => (n.y > 0.5 ? '#4dcb51' : '#8a6f5a'));
  assert.deepEqual(vertexColours(geometry).sort(), ['#4dcb51', '#8a6f5a']);
  const decor = new THREE.Mesh(geometry, createMaterials().vertexColor());
  assert.deepEqual(loudColours({ params: {}, object: decor }), ['vertex colour (decor) #4dcb51 is not calm']);
  const plain = new THREE.Mesh(geometry, createMaterials().solid('#8a6f5a'));
  assert.deepEqual(loudColours({ params: {}, object: plain }), []);
});

for (const definition of registry.list()) {
  const type = definition.id;
  if (EXEMPT.has(type)) continue;
  const todo = TODO.has(type) ? `${type} generator must adopt src/core/palette.js pickers` : false;
  test(`${type}: every colour is calm over ${SEEDS} seeds`, { todo }, (t) => {
    const { failures } = sweep(type, SEEDS, loudColours);
    const items = new Set(failures.map((f) => f.seed)).size;
    if (failures.length) t.diagnostic(`${type}: ${items}/${SEEDS} items, ${failures.length} loud colours`);
    assert.equal(failures.length, 0, `${items}/${SEEDS} items with loud colours:\n${formatFailures(failures, 20)}`);
  });
}
