import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colourIsCalm } from '../../src/core/palette.js';
import * as registry from '../../src/furniture/registry.js';
import { formatFailures, sweep } from '../helpers/sweep.js';

const SEEDS = 500;
const EXEMPT = new Set(['chair']);
const TODO = new Set(['table', 'bench', 'sofa']);
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

function materialColours(object) {
  const out = [];
  object.traverse((node) => {
    for (const m of node.material ? [node.material].flat() : []) {
      if (m.color) out.push([`material ${m.name || m.type}`, `#${m.color.getHexString()}`]);
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
