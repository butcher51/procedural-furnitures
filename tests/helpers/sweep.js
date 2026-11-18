import { createKit } from '../../src/core/kit.js';
import { generateItem, itemSeed } from '../../src/core/item.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import * as registry from '../../src/furniture/registry.js';

export const sweepSceneSeed = (type) => `sweep-${type}`;

export function parseItemSeed(definition, seed) {
  const number = Number(seed.slice(seed.lastIndexOf('-') + 1));
  const head = seed.slice(0, seed.lastIndexOf('-'));
  const candidates = [head, head.endsWith(`-${definition.id}`) ? head.slice(0, -definition.id.length - 1) : null];
  const sceneSeed = candidates.find((c) => c !== null && itemSeed(definition, c, number) === seed);
  if (!Number.isInteger(number) || number < 1 || sceneSeed === undefined) {
    throw new Error(`"${seed}" is not a ${definition.id} item seed`);
  }
  return { sceneSeed, number };
}

function messagesOf(result) {
  if (result === undefined || result === null || result === true) return [];
  if (typeof result === 'string') return [result];
  return [...result];
}

function runItem(definition, kit, sceneSeed, number, rerolls, fn) {
  const params = generateItem(definition, sceneSeed, number, rerolls);
  const parts = definition.build(params, kit);
  const root = groupParts(parts);
  root.updateMatrixWorld(true);
  const object = mergeByMaterial(root);
  object.updateMatrixWorld(true);
  try {
    return messagesOf(fn({ definition, params, parts, root, object, rerolls, seed: params.seed ?? itemSeed(definition, sceneSeed, number) }));
  } catch (error) {
    return [error?.message ?? String(error)];
  } finally {
    disposeObject(object);
  }
}

function rerollsFor(rerolls, number) {
  return typeof rerolls === 'function' ? rerolls(number) : rerolls ?? {};
}

function runItems(type, items, fn, { rerolls, kit = createKit() } = {}) {
  const definition = registry.get(type);
  const failures = [];
  for (const { sceneSeed, number } of items) {
    const itemRerolls = rerollsFor(rerolls, number);
    for (const message of runItem(definition, kit, sceneSeed, number, itemRerolls, fn)) {
      const seed = itemSeed(definition, sceneSeed, number);
      failures.push(Object.keys(itemRerolls).length ? { seed, rerolls: itemRerolls, message } : { seed, message });
    }
  }
  return { count: items.length, failures };
}

export function sweep(type, n, fn, options = {}) {
  const sceneSeed = options.sceneSeed ?? sweepSceneSeed(type);
  const items = Array.from({ length: n }, (_, i) => ({ sceneSeed, number: i + 1 }));
  return runItems(type, items, fn, options);
}

export function sweepSeeds(type, seeds, fn, options = {}) {
  const definition = registry.get(type);
  return runItems(type, seeds.map((seed) => parseItemSeed(definition, seed)), fn, options);
}

export function formatFailures(failures, limit = 50) {
  const lines = failures.slice(0, limit).map((f) => `  ${f.seed}${f.rerolls ? ` ${JSON.stringify(f.rerolls)}` : ''}: ${f.message}`);
  if (failures.length > limit) lines.push(`  ... and ${failures.length - limit} more`);
  return lines.join('\n');
}
