import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WAVE1_TYPES, wave1Hashes } from '../helpers/geometry-hash.js';

const golden = JSON.parse(readFileSync(new URL('../golden/wave1-geometry-hashes.json', import.meta.url), 'utf8'));

for (const type of WAVE1_TYPES) {
  test(`${type} params and merged geometry match the wave-1 hashes (W6)`, () => {
    const actual = wave1Hashes({ types: [type] })[type];
    const changed = Object.keys(golden[type]).filter((key) => actual[key] !== golden[type][key]);
    assert.deepStrictEqual(changed, [], `${changed.length} ${type} items changed; regenerate with node scripts/geometry-hash.mjs only for an intentional look change`);
    assert.deepStrictEqual(Object.keys(actual), Object.keys(golden[type]));
  });
}
