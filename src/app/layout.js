const CANDIDATES = 24;

function packWith(sizes, gap, rowWidth) {
  const rows = [];
  let row = [];
  let used = 0;
  for (let i = 0; i < sizes.length; i++) {
    const w = sizes[i].w + gap;
    if (row.length && used + w > rowWidth) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(i);
    used += w;
  }
  if (row.length) rows.push(row);
  const metrics = rows.map((indices) => ({
    indices,
    width: indices.reduce((sum, i) => sum + sizes[i].w + gap, 0),
    depth: Math.max(...indices.map((i) => sizes[i].d)) + gap,
  }));
  const width = Math.max(...metrics.map((r) => r.width));
  const depth = metrics.reduce((sum, r) => sum + r.depth, 0);
  return { metrics, width, depth };
}

export function packRows(sizes, { gap = 0.3 } = {}) {
  if (!sizes.length) return { positions: [], rows: [], width: 0, depth: 0 };
  const area = sizes.reduce((sum, s) => sum + (s.w + gap) * (s.d + gap), 0);
  const widest = Math.max(...sizes.map((s) => s.w + gap));
  const base = Math.sqrt(area);
  let best = null;
  for (let k = 0; k < CANDIDATES; k++) {
    const rowWidth = Math.max(widest, base * (0.8 + k / CANDIDATES));
    const result = packWith(sizes, gap, rowWidth);
    const score = Math.max(result.width, result.depth) + Math.abs(result.width - result.depth) * 0.25;
    if (!best || score < best.score) best = { ...result, score };
  }

  const positions = new Array(sizes.length);
  let z = -best.depth / 2;
  for (const row of best.metrics) {
    let x = -row.width / 2;
    for (const i of row.indices) {
      positions[i] = { x: x + (sizes[i].w + gap) / 2, z: z + row.depth / 2 };
      x += sizes[i].w + gap;
    }
    z += row.depth;
  }
  return {
    positions,
    rows: best.metrics.map((r) => r.indices),
    width: best.width - gap,
    depth: best.depth - gap,
  };
}

export function verticalNeighbor(rows, positions, index, direction) {
  const at = rows.findIndex((row) => row.includes(index));
  const next = rows[at + direction];
  if (!next) return index;
  const x = positions[index].x;
  return next.reduce((best, i) => (Math.abs(positions[i].x - x) < Math.abs(positions[best].x - x) ? i : best), next[0]);
}

export function cellCenter(row, col, center, spacing, spacingZ = spacing) {
  return { x: (col - center) * spacing, z: (row - center) * spacingZ };
}
