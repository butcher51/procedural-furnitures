import { performance } from 'node:perf_hooks';

globalThis.document ??= {
  createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect() {} }) }),
};

const { generateParams, buildChair, disposeObject } = await import('../chair.js');

const count = Number(process.argv[2]) || 500;
const prefix = process.argv[3] || 'metrics';
const rows = [];

for (let i = 1; i <= count; i++) {
  const params = generateParams(`${prefix}-${i}`);
  const start = performance.now();
  const object = buildChair(params);
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

const pct = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

const summarise = (label, list) => {
  const tris = list.map((r) => r.triangles);
  const calls = list.map((r) => r.drawCalls);
  const ms = list.map((r) => r.ms);
  return {
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

const styles = [...new Set(rows.map((r) => r.style))].sort();
const table = [summarise('all', rows), ...styles.map((s) => summarise(s, rows.filter((r) => r.style === s)))];

if (process.argv.includes('--json')) console.log(JSON.stringify(table, null, 2));
else console.table(table);
