import { createHash } from 'node:crypto';
import { createKit } from '../../src/core/kit.js';
import { buildItem, generateItem } from '../../src/core/item.js';
import { createRng } from '../../src/core/rng.js';
import { disposeObject } from '../../src/core/merge.js';
import * as registry from '../../src/furniture/registry.js';

export const WAVE1_TYPES = ['chair', 'stool', 'table', 'bench', 'sofa'];
export const HASH_SCENE_SEED = 'w6';
export const HASH_COUNT = 200;
const HASHED_ATTRIBUTES = ['position', 'normal', 'uv', 'grain', 'color'];

function materialKey(material) {
  return JSON.stringify([
    material.type,
    material.color?.getHexString() ?? null,
    material.roughness ?? null,
    material.metalness ?? null,
    material.vertexColors ?? false,
    material.userData?.pattern ?? null,
  ]);
}

function bytesOf(array) {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}

export function hashObject(params, object) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(params));
  object.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    hash.update(materialKey(o.material));
    for (const name of HASHED_ATTRIBUTES) {
      const attribute = g.attributes[name];
      hash.update(`|${name}:`);
      if (attribute) hash.update(bytesOf(attribute.array));
    }
    hash.update(`|tris:${(g.index ? g.index.count : g.attributes.position.count) / 3}`);
  });
  return hash.digest('hex').slice(0, 16);
}

export function rerollMap(definition, number) {
  const r = createRng(`${HASH_SCENE_SEED}/rerolls/${definition.id}/${number}`);
  const map = {};
  for (const group of definition.groups) {
    if (group.id === 'style') map.style = number % 7;
    else if (r.chance(0.5)) map[group.id] = r.int(1, 4);
  }
  return map;
}

export const rerollKey = (map) => Object.entries(map).map(([id, n]) => `${id}${n}`).join('.');

function hashItem(definition, kit, number, rerolls) {
  const params = generateItem(definition, HASH_SCENE_SEED, number, rerolls);
  const object = buildItem(definition, params, kit);
  const digest = hashObject(params, object);
  disposeObject(object);
  return digest;
}

export function wave1Hashes({ types = WAVE1_TYPES, count = HASH_COUNT } = {}) {
  const kit = createKit();
  const result = {};
  for (const type of types) {
    const definition = registry.get(type);
    const entries = {};
    for (let n = 1; n <= count; n++) {
      entries[n] = hashItem(definition, kit, n, {});
      const map = rerollMap(definition, n);
      entries[`${n}~${rerollKey(map)}`] = hashItem(definition, kit, n, map);
    }
    result[type] = entries;
  }
  return result;
}
