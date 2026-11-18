import { writeFile } from 'node:fs/promises';
import '../helpers/dom-stub.js';
import { geometryStats } from '../helpers/geometry-stats.js';
import { generateParams, buildChair, disposeObject } from '../../chair.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => `golden-${i + 1}`);
const params = SEEDS.map((seed) => generateParams(seed));
const geometry = params.map((p) => {
  const object = buildChair(p);
  const stats = geometryStats(object);
  disposeObject(object);
  return { seed: p.seed, ...stats };
});

const dir = new URL('./', import.meta.url);
await writeFile(new URL('chair-params.json', dir), JSON.stringify(params, null, 1) + '\n');
await writeFile(new URL('chair-geometry.json', dir), JSON.stringify(geometry, null, 1) + '\n');
console.log(`captured ${params.length} seeds`);
