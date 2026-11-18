import { readFileSync, writeFileSync } from 'node:fs';
import { createKit } from '../../src/core/kit.js';
import { buildItem, generateItem } from '../../src/core/item.js';
import { disposeObject } from '../../src/core/merge.js';
import * as registry from '../../src/furniture/registry.js';
import { geometryStats } from '../helpers/geometry-stats.js';

const file = new URL('./chair-geometry.json', import.meta.url);
const previous = JSON.parse(readFileSync(file, 'utf8'));
const chair = registry.get('chair');
const kit = createKit();
const numberOf = (seed) => Number(seed.slice('golden-'.length));

const changedByStyle = {};
const totalByStyle = {};
const next = previous.map((old) => {
  const params = generateItem(chair, 'golden', numberOf(old.seed));
  const object = buildItem(chair, params, kit);
  const entry = { seed: old.seed, ...geometryStats(object) };
  disposeObject(object);
  totalByStyle[params.style] = (totalByStyle[params.style] ?? 0) + 1;
  if (JSON.stringify(entry) !== JSON.stringify(old)) changedByStyle[params.style] = (changedByStyle[params.style] ?? 0) + 1;
  return entry;
});

writeFileSync(file, `${JSON.stringify(next, null, 1)}\n`);
for (const style of Object.keys(totalByStyle).sort()) {
  console.log(`${style}: ${changedByStyle[style] ?? 0} of ${totalByStyle[style]} entries changed`);
}
