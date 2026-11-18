import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { wave1Hashes } from '../tests/helpers/geometry-hash.js';

const file = new URL('../tests/golden/wave1-geometry-hashes.json', import.meta.url);
const check = process.argv.includes('--check');
const next = wave1Hashes();

if (check) {
  const previous = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  let changed = 0;
  for (const [type, entries] of Object.entries(next)) {
    const diff = Object.keys(entries).filter((key) => previous[type]?.[key] !== entries[key]);
    changed += diff.length;
    console.log(`${type}: ${diff.length} of ${Object.keys(entries).length} items differ${diff.length ? ` (${diff.slice(0, 8).join(', ')})` : ''}`);
  }
  process.exit(changed ? 1 : 0);
}

writeFileSync(file, `${JSON.stringify(next, null, 1)}\n`);
for (const [type, entries] of Object.entries(next)) console.log(`${type}: ${Object.keys(entries).length} hashes written`);
