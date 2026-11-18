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

export function groupApplies(definition, groupId, params) {
  const group = definition.groups.find((g) => g.id === groupId);
  return group?.appliesTo ? group.appliesTo(params) !== false : true;
}

export function canRoll(definition, groupId, params) {
  const group = definition.groups.find((g) => g.id === groupId);
  return Boolean(group) && group.rerollable !== false && groupApplies(definition, groupId, params);
}

const SECONDARY_GROUPS = new Set(['style', 'palette', 'pattern', 'finish']);

export function shortcutGroups(definition) {
  const rollable = definition.groups.filter((g) => g.rerollable !== false);
  const has = (id) => rollable.some((g) => g.id === id);
  return {
    c: has('palette') ? 'palette' : null,
    s: has('shape') ? 'shape' : rollable.find((g) => !SECONDARY_GROUPS.has(g.id))?.id ?? null,
  };
}
