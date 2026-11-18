import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const { values: args } = parseArgs({
  options: {
    type: { type: 'string', default: 'chair' },
    seed: { type: 'string', default: 'verify' },
    count: { type: 'string', default: '48' },
    'no-snapshot': { type: 'boolean', default: false },
  },
});

const run = (cmd, cmdArgs) => {
  const result = spawnSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8' });
  return { ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}` };
};

const node = process.execPath;
const fields = { type: args.type };

const tests = run(node, ['--test', '--test-reporter=tap', 'tests/unit/**/*.test.js']);
const pass = Number(tests.out.match(/^# pass (\d+)/m)?.[1] ?? 0);
const fail = Number(tests.out.match(/^# fail (\d+)/m)?.[1] ?? 0);
fields.tests = `${pass}/${pass + fail}`;

const invariantsScript = join(root, 'tests/invariants/run.mjs');
let invariantsOk = true;
if (existsSync(invariantsScript)) {
  const inv = run(node, [invariantsScript, '--type', args.type, '--count', '500']);
  invariantsOk = inv.ok;
  fields.invariants = inv.out.match(/invariants: (\S+)/)?.[1] ?? (inv.ok ? 'ok' : 'FAIL');
} else {
  fields.invariants = 'n/a';
}

const metrics = run(node, [join(root, 'scripts/metrics.mjs'), '500', `verify-${args.type}`, '--json']);
if (metrics.ok) {
  const all = JSON.parse(metrics.out.slice(metrics.out.indexOf('['))).find((r) => r.group === 'all');
  fields['p95 tris'] = `${(all['tris p95'] / 1000).toFixed(1)}k`;
  fields['max draws'] = all['draws max'];
  fields['p95 build'] = `${all['build ms p95']} ms (node)`;
} else {
  fields.metrics = 'FAIL';
}

let snapshotOk = true;
if (!args['no-snapshot']) {
  const name = `${args.type}-verify`;
  const snap = run(node, [
    join(root, '.claude/skills/snapshot/scripts/snapshot.mjs'),
    '--type', args.type, '--seed', args.seed, '--count', args.count, '--name', name,
  ]);
  snapshotOk = snap.ok;
  fields.sheet = snap.ok ? `out/snapshots/${name}.png` : 'FAIL';
}

console.log(Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('   '));
if (fail > 0 || !tests.ok) console.log(`\n${tests.out.split('\n').filter((l) => /^not ok|# Subtest|error|Error/.test(l)).join('\n')}`);
process.exitCode = fail === 0 && tests.ok && invariantsOk && metrics.ok && snapshotOk ? 0 : 1;
