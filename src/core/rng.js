// ---------------------------------------------------------------------------
// Seeded RNG: string seed -> 32-bit hash -> mulberry32 stream
// ---------------------------------------------------------------------------

export function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(hashString(String(seed)));
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}

export function createGroupedRng(itemSeed, rerolls = {}, { legacy = false, fixed = [] } = {}) {
  const main = legacy ? createRng(itemSeed) : null;
  const count = (groupId) => (fixed.includes(groupId) ? 0 : Math.max(0, Math.trunc(rerolls[groupId] ?? 0)));
  const groupStream = (groupId) => createRng(`${itemSeed}/${groupId}/${count(groupId)}`);
  return {
    seed: String(itemSeed),
    count,
    roll(groupId, fn) {
      if (!legacy) return fn(groupStream(groupId));
      const original = fn(main);
      return count(groupId) > 0 ? fn(groupStream(groupId)) : original;
    },
  };
}


const weightEntries = (weights) => (Array.isArray(weights) ? weights : Object.entries(weights));

export function weightedPick(r, weights) {
  const entries = weightEntries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let x = r.next() * total;
  for (const [value, w] of entries) {
    if (x < w) return value;
    x -= w;
  }
  return entries[entries.length - 1][0];
}

export function weightedShuffle(r, weights) {
  return weightEntries(weights)
    .map(([value, w]) => ({ value, key: w > 0 ? r.next() ** (1 / w) : (r.next(), -1) }))
    .sort((a, b) => b.key - a.key)
    .map(({ value }) => value);
}

export function rollStyle(g, styles) {
  const base = weightedPick(createRng(`${g.seed}/style/0`), styles);
  const n = g.count('style');
  if (n === 0) return base;
  const others = weightEntries(styles).filter(([value]) => value !== base);
  const cycle = [...weightedShuffle(createRng(`${g.seed}/style/order`), others), base];
  return cycle[(n - 1) % cycle.length];
}
