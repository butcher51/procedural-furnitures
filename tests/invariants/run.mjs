import { parseArgs } from 'node:util';
import { checkInvariants } from '../helpers/invariants.js';
import { isKnownBad, loadRegressions } from '../helpers/regressions.js';
import { formatFailures, sweep, sweepSceneSeed, sweepSeeds } from '../helpers/sweep.js';
import { itemSeed } from '../../src/core/item.js';
import * as registry from '../../src/furniture/registry.js';

const { values: args } = parseArgs({
  options: {
    type: { type: 'string' },
    count: { type: 'string', default: '500' },
    limit: { type: 'string', default: '50' },
    'show-known-bad': { type: 'boolean', default: false },
  },
});

const count = Number(args.count);
const limit = Number(args.limit);
const types = args.type ? [registry.get(args.type)] : registry.list();
const seedKey = (failure) => `${failure.seed}${failure.rerolls ? JSON.stringify(failure.rerolls) : ''}`;

let total = 0;
const failingItems = new Set();
const knownBadItems = new Set();
const unexpected = [];
const knownBad = [];

for (const definition of types) {
  const regressions = loadRegressions(definition.id);
  const base = sweep(definition.id, count, checkInvariants);
  const swept = new Set(Array.from({ length: count }, (_, i) => itemSeed(definition, sweepSceneSeed(definition.id), i + 1)));
  const extra = regressions.filter((entry) => entry.rerolls || !swept.has(entry.seed));
  const runs = [base, ...extra.map((entry) => sweepSeeds(definition.id, [entry.seed], checkInvariants, { rerolls: entry.rerolls }))];
  for (const run of runs) {
    total += run.count;
    for (const failure of run.failures) {
      const known = isKnownBad(failure, regressions);
      (known ? knownBad : unexpected).push(failure);
      (known ? knownBadItems : failingItems).add(`${definition.id}:${seedKey(failure)}`);
    }
  }
}

for (const item of failingItems) knownBadItems.delete(item);
const pass = total - failingItems.size - knownBadItems.size;
console.log(
  `types: ${types.map((d) => d.id).join(',')}   invariants: ${pass}/${total}   known-bad: ${knownBadItems.size}   unexpected: ${failingItems.size}`
);
if (knownBad.length && args['show-known-bad']) console.log(`known-bad failures:\n${formatFailures(knownBad, limit)}`);
if (unexpected.length) console.log(`failures:\n${formatFailures(unexpected, limit)}`);
process.exitCode = unexpected.length ? 1 : 0;
