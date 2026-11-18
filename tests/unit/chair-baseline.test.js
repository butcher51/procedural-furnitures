import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateParams } from '../../chair.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => `baseline-${i + 1}`);

test('same seed gives deep-equal params', () => {
  for (const seed of SEEDS) assert.deepEqual(generateParams(seed), generateParams(seed));
});

test('params are finite and include seed and style', () => {
  for (const seed of SEEDS) {
    const p = generateParams(seed);
    assert.equal(p.seed, seed);
    assert.ok(['classic', 'curvy', 'cozy'].includes(p.style), `${seed}: style ${p.style}`);
    for (const [key, value] of Object.entries(p)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${seed}: ${key} = ${value}`);
    }
  }
});

test('every style appears', () => {
  const styles = new Set(SEEDS.map((s) => generateParams(s).style));
  assert.deepEqual([...styles].sort(), ['classic', 'cozy', 'curvy']);
});
