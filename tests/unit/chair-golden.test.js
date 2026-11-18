import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createKit } from '../../src/core/kit.js';
import { buildItem, generateItem } from '../../src/core/item.js';
import { disposeObject } from '../../src/core/merge.js';
import * as registry from '../../src/furniture/registry.js';
import { geometryStats } from '../helpers/geometry-stats.js';

const load = (name) => JSON.parse(readFileSync(new URL(`../golden/${name}`, import.meta.url), 'utf8'));
const goldenParams = load('chair-params.json');
const goldenGeometry = load('chair-geometry.json');
const chair = registry.get('chair');
const numberOf = (seed) => Number(seed.slice('golden-'.length));

test('chair params match the pre-refactor golden file', () => {
  for (const expected of goldenParams) {
    const { type, ...actual } = generateItem(chair, 'golden', numberOf(expected.seed));
    assert.equal(type, 'chair');
    assert.deepStrictEqual(actual, expected, expected.seed);
  }
});

test('zero rerolls equal no rerolls', () => {
  const zero = Object.fromEntries(chair.groups.map((g) => [g.id, 0]));
  for (const expected of goldenParams.slice(0, 50)) {
    const n = numberOf(expected.seed);
    assert.deepStrictEqual(generateItem(chair, 'golden', n, zero), generateItem(chair, 'golden', n), expected.seed);
  }
});

test('chair geometry matches the pre-refactor golden file', () => {
  const kit = createKit();
  for (const expected of goldenGeometry) {
    const object = buildItem(chair, generateItem(chair, 'golden', numberOf(expected.seed)), kit);
    assert.deepStrictEqual({ seed: expected.seed, ...geometryStats(object) }, expected, expected.seed);
    disposeObject(object);
  }
});
