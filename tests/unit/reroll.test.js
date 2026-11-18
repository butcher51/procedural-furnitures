import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { fixedGroups, generateItem, groupApplies, rerollableGroups } from '../../src/core/item.js';
import { createRng } from '../../src/core/rng.js';
import * as registry from '../../src/furniture/registry.js';
import { checkInvariants } from '../helpers/invariants.js';
import { excuseKnownBad, loadRegressions } from '../helpers/regressions.js';
import { formatFailures, sweep } from '../helpers/sweep.js';

const SEEDS = 500;
const INVARIANT_SEEDS = 150;
const DEFAULT_CHANGE_RATE = 0.9;

const CHANGE_RATE_OVERRIDES = {
  chair: {
    pattern: {
      min: 0.45,
      measured: 0.52,
      why: 'pattern owns only stripeDirection (2 values); pattern/patternScale are owned by finish because all-wood chairs overwrite them. Counting finish fields too, 88.4% of pattern re-rolls change something.',
    },
  },
};

const sceneSeed = (definition) => `reroll-${definition.id}`;
const numbers = Array.from({ length: SEEDS }, (_, i) => i + 1);

function ownerIndex(definition) {
  const owner = new Map();
  definition.groups.forEach((group, index) => {
    for (const field of group.fields ?? []) {
      assert.ok(!owner.has(field), `${definition.id}: field "${field}" is owned by two groups`);
      owner.set(field, index);
    }
  });
  return owner;
}

function dependents(definition, groupId) {
  const affected = new Set([groupId]);
  for (const group of definition.groups) {
    if ((group.reads ?? []).some((id) => affected.has(id))) affected.add(group.id);
  }
  affected.delete(groupId);
  return affected;
}

function changedFields(a, b) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((key) => !isDeepStrictEqual(a[key], b[key]));
}

function randomRerolls(definition, label) {
  const r = createRng(label);
  const map = {};
  for (const id of rerollableGroups(definition)) if (r.chance(0.5)) map[id] = r.int(1, 4);
  return map;
}

for (const definition of registry.list()) {
  const type = definition.id;
  const scene = sceneSeed(definition);
  const base = new Map(numbers.map((n) => [n, generateItem(definition, scene, n)]));

  test(`${type}: every group declares fields and only reads earlier groups`, () => {
    const order = definition.groups.map((g) => g.id);
    ownerIndex(definition);
    definition.groups.forEach((group, index) => {
      assert.ok(Array.isArray(group.fields) && group.fields.length > 0, `${type}.${group.id}: no fields`);
      for (const id of group.reads ?? []) {
        assert.ok(order.indexOf(id) >= 0 && order.indexOf(id) < index, `${type}.${group.id} reads "${id}", which is not an earlier group`);
      }
    });
  });

  test(`${type}: zero rerolls equal the base params`, () => {
    const zero = Object.fromEntries(definition.groups.map((g) => [g.id, 0]));
    for (const n of numbers) {
      assert.deepStrictEqual(generateItem(definition, scene, n, {}), base.get(n), `${type} #${n} with {}`);
      assert.deepStrictEqual(generateItem(definition, scene, n, zero), base.get(n), `${type} #${n} with all zeros`);
    }
  });

  test(`${type}: non-rerollable groups ignore reroll counts`, () => {
    const fixed = fixedGroups(definition);
    if (fixed.length === 0) return;
    const rerolls = Object.fromEntries(fixed.map((id) => [id, 3]));
    for (const n of numbers) assert.deepStrictEqual(generateItem(definition, scene, n, rerolls), base.get(n), `${type} #${n} with ${JSON.stringify(rerolls)}`);
  });

  test(`${type}: same seed and rerolls give the same params`, () => {
    for (const n of numbers) {
      const rerolls = randomRerolls(definition, `${scene}-map-${n}`);
      assert.deepStrictEqual(generateItem(definition, scene, n, rerolls), generateItem(definition, scene, n, { ...rerolls }), `${type} #${n} ${JSON.stringify(rerolls)}`);
    }
  });

  const owner = ownerIndex(definition);
  for (const groupId of rerollableGroups(definition)) {
    const groupIndex = definition.groups.findIndex((g) => g.id === groupId);
    const allowedLater = dependents(definition, groupId);
    const ownFields = new Set(definition.groups[groupIndex].fields);
    const override = CHANGE_RATE_OVERRIDES[type]?.[groupId];
    const minRate = override?.min ?? DEFAULT_CHANGE_RATE;

    test(`${type}: re-rolling ${groupId} changes only ${groupId}${allowedLater.size ? ` and its readers (${[...allowedLater].join(', ')})` : ''}`, () => {
      const violations = [];
      let visible = 0;
      let applying = 0;
      for (const n of numbers) {
        const once = generateItem(definition, scene, n, { [groupId]: 1 });
        const twice = generateItem(definition, scene, n, { [groupId]: 2 });
        const applies = groupApplies(definition, groupId, base.get(n));
        if (applies) {
          applying++;
          if (changedFields(base.get(n), once).some((field) => ownFields.has(field))) visible++;
        }
        for (const [label, params] of [['1', once], ['2', twice]]) {
          for (const field of changedFields(base.get(n), params)) {
            if (!applies && !ownFields.has(field)) violations.push(`#${n} x${label}: ${groupId} does not apply but ${field} changed`);
            const index = owner.get(field);
            const ownerId = definition.groups[index]?.id;
            if (index === undefined) violations.push(`#${n} x${label}: unowned field "${field}" changed`);
            else if (index < groupIndex) violations.push(`#${n} x${label}: earlier group ${ownerId}.${field} changed`);
            else if (index > groupIndex && !allowedLater.has(ownerId)) violations.push(`#${n} x${label}: ${ownerId}.${field} changed but ${ownerId} does not read ${groupId}`);
          }
        }
      }
      assert.deepStrictEqual(violations.slice(0, 30), [], `${violations.length} isolation violations`);
      if (applying === 0) return;
      const rate = visible / applying;
      assert.ok(rate >= minRate, `${type}.${groupId}: only ${(rate * 100).toFixed(1)}% of re-rolls change a ${groupId} field (need ${minRate * 100}%)`);
    });
  }

  test(`${type}: invariants hold under random reroll maps`, () => {
    const regressions = loadRegressions(type);
    const { failures } = sweep(type, INVARIANT_SEEDS, checkInvariants, {
      sceneSeed: `sweep-${type}`,
      rerolls: (n) => randomRerolls(definition, `invariant-map-${type}-${n}`),
    });
    const unexpected = excuseKnownBad(failures, regressions);
    assert.equal(unexpected.length, 0, `invariant failures under rerolls:\n${formatFailures(unexpected)}`);
  });
}
