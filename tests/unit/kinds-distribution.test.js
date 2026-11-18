import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateItem } from '../../src/core/item.js';
import * as registry from '../../src/furniture/registry.js';

const SEEDS = 2000;

for (const definition of registry.list().filter((d) => d.kinds)) {
  const type = definition.id;
  const total = Object.values(definition.kinds).reduce((a, b) => a + b, 0);

  test(`${type}: kinds is a cycled group of its own and sums to one`, () => {
    assert.ok(Math.abs(total - 1) < 1e-9);
    assert.ok(definition.groups.some((g) => g.id === 'kind' && g.fields.includes('kind')));
  });

  test(`${type}: kind distribution at re-roll 0 is within 4 pp of the weights over ${SEEDS} seeds`, () => {
    const kinds = Array.from({ length: SEEDS }, (_, i) => generateItem(definition, `kinds-${type}`, i + 1).kind);
    for (const [kind, weight] of Object.entries(definition.kinds)) {
      const share = kinds.filter((k) => k === kind).length / SEEDS;
      assert.ok(Math.abs(share - weight / total) <= 0.04, `${kind}: ${share} vs ${weight}`);
    }
  });

  test(`${type}: kind re-rolls visit every other kind once before returning to the base`, () => {
    for (let n = 1; n <= 100; n++) {
      const count = Object.keys(definition.kinds).length;
      const base = generateItem(definition, `kinds-${type}`, n).kind;
      const visited = Array.from({ length: count - 1 }, (_, k) => generateItem(definition, `kinds-${type}`, n, { kind: k + 1 }).kind);
      assert.equal(new Set(visited).size, count - 1);
      assert.ok(!visited.includes(base));
      assert.equal(generateItem(definition, `kinds-${type}`, n, { kind: count }).kind, base);
    }
  });
}
