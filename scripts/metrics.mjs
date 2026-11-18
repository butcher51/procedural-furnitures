import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { createKit } from '../src/core/kit.js';
import { buildItem, generateItem } from '../src/core/item.js';
import { disposeObject } from '../src/core/merge.js';
import * as registry from '../src/furniture/registry.js';

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    type: { type: 'string' },
    json: { type: 'boolean', default: false },
  },
});

const count = Number(positionals[0]) || 500;
const prefix = positionals[1] || 'metrics';
const definitions = args.type ? [registry.get(args.type)] : registry.list();
const kit = createKit();

const pct = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

const summarise = (type, label, list) => {
  const tris = list.map((r) => r.triangles);
  const calls = list.map((r) => r.drawCalls);
  const ms = list.map((r) => r.ms);
  return {
    type,
    group: label,
    n: list.length,
    'tris p50': pct(tris, 50),
    'tris p95': pct(tris, 95),
    'tris max': Math.max(...tris),
    'draws max': Math.max(...calls),
    'build ms p50': +pct(ms, 50).toFixed(2),
    'build ms p95': +pct(ms, 95).toFixed(2),
  };
};

function measure(definition) {
  const rows = [];
  for (let i = 1; i <= count; i++) {
    const params = generateItem(definition, prefix, i);
    const start = performance.now();
    const object = buildItem(definition, params, kit);
    const ms = performance.now() - start;
    let triangles = 0;
    let drawCalls = 0;
    object.traverse((o) => {
      if (!o.isMesh) return;
      drawCalls++;
      const g = o.geometry;
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    rows.push({ style: params.style, triangles, drawCalls, ms });
    disposeObject(object);
  }
  const styles = [...new Set(rows.map((r) => r.style))].sort();
  return [summarise(definition.id, 'all', rows), ...styles.map((s) => summarise(definition.id, s, rows.filter((r) => r.style === s)))];
}

const table = definitions.flatMap(measure);

if (args.json) console.log(JSON.stringify(table, null, 2));
else console.table(table);
