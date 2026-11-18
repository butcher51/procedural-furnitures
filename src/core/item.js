import { createGroupedRng } from './rng.js';
import { groupParts, mergeByMaterial } from './merge.js';

export function itemSeed(definition, sceneSeed, number) {
  return definition.itemSeed ? definition.itemSeed(sceneSeed, number) : `${sceneSeed}-${definition.id}-${number}`;
}

export function fixedGroups(definition) {
  return definition.groups.filter((group) => group.rerollable === false).map((group) => group.id);
}

export function rerollableGroups(definition) {
  return definition.groups.filter((group) => group.rerollable !== false).map((group) => group.id);
}

export function generateItem(definition, sceneSeed, number, rerolls = {}, dna = null) {
  const g = createGroupedRng(itemSeed(definition, sceneSeed, number), rerolls, {
    legacy: definition.legacyRng === true,
    fixed: fixedGroups(definition),
  });
  return definition.generateParams(g, dna);
}

export function buildItem(definition, params, kit) {
  return mergeByMaterial(groupParts(definition.build(params, kit)));
}
