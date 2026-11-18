import chair from './chair/index.js';
import stool from './stool/index.js';
import table from './table/index.js';
import bench from './bench/index.js';
import sofa from './sofa/index.js';
import bed from './bed/index.js';

const definitions = new Map();

export function register(definition) {
  if (definitions.has(definition.id)) throw new Error(`furniture type "${definition.id}" is already registered`);
  definitions.set(definition.id, definition);
}

export function get(id) {
  const definition = definitions.get(id);
  if (!definition) throw new Error(`unknown furniture type "${id}"`);
  return definition;
}

export function has(id) {
  return definitions.has(id);
}

export function list() {
  return [...definitions.values()];
}

register(chair);
register(stool);
register(table);
register(bench);
register(sofa);
register(bed);
