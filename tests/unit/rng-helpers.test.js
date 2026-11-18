import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGroupedRng, createRng, rollStyle, weightedPick, weightedShuffle } from '../../src/core/rng.js';
import { canRoll, groupApplies, shortcutGroups } from '../../src/core/item.js';

const STYLES = { bar: 0.25, counter: 0.2, diner: 0.15, milking: 0.15, drum: 0.15, slab: 0.1 };
const ids = Object.keys(STYLES);
const seeds = Array.from({ length: 2000 }, (_, i) => `style-test-${i}`);

test('weightedPick uses one draw, accepts objects and pairs, and follows the weights', () => {
  const r = createRng('wp');
  const twin = createRng('wp');
  weightedPick(r, STYLES);
  twin.next();
  assert.equal(r.next(), twin.next());
  assert.equal(weightedPick({ next: () => 0 }, [['a', 1], ['b', 1]]), 'a');
  assert.equal(weightedPick({ next: () => 0.99 }, [['a', 1], ['b', 1]]), 'b');
  assert.equal(weightedPick({ next: () => 0.5 }, { a: 0, b: 1 }), 'b');
  const counts = Object.fromEntries(ids.map((id) => [id, 0]));
  const rng = createRng('wp-dist');
  for (let i = 0; i < 20000; i++) counts[weightedPick(rng, STYLES)]++;
  for (const id of ids) assert.ok(Math.abs(counts[id] / 20000 - STYLES[id]) < 0.015, `${id} ${counts[id]}`);
});

test('weightedShuffle returns every entry once, one draw each, heavy entries first more often', () => {
  const r = createRng('ws');
  const twin = createRng('ws');
  const order = weightedShuffle(r, STYLES);
  for (let i = 0; i < ids.length; i++) twin.next();
  assert.equal(r.next(), twin.next());
  assert.deepEqual([...order].sort(), [...ids].sort());
  let heavyFirst = 0;
  const rng = createRng('ws-dist');
  for (let i = 0; i < 4000; i++) if (weightedShuffle(rng, [['a', 0.8], ['b', 0.2]])[0] === 'a') heavyFirst++;
  assert.ok(Math.abs(heavyFirst / 4000 - 0.8) < 0.03, `${heavyFirst}`);
  assert.equal(weightedShuffle(createRng('z'), { a: 0, b: 1 })[1], 'a');
});

test('rollStyle without a reroll is the weighted pick on the style stream', () => {
  const counts = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const seed of seeds) {
    const g = createGroupedRng(seed);
    const style = rollStyle(g, STYLES);
    assert.equal(style, g.roll('style', (r) => weightedPick(r, STYLES)));
    assert.equal(style, rollStyle(createGroupedRng(seed, { style: 0 }), STYLES));
    counts[style]++;
  }
  for (const id of ids) assert.ok(Math.abs(counts[id] / seeds.length - STYLES[id]) < 0.04, `${id} ${counts[id]}`);
});

test('rollStyle rerolls 1..k-1 visit every other style once, then return to the base and repeat', () => {
  const k = ids.length;
  for (const seed of seeds.slice(0, 500)) {
    const at = (n) => rollStyle(createGroupedRng(seed, { style: n }), STYLES);
    const base = at(0);
    const visited = Array.from({ length: k - 1 }, (_, i) => at(i + 1));
    assert.notEqual(visited[0], base, seed);
    assert.equal(new Set(visited).size, k - 1, seed);
    assert.ok(!visited.includes(base), seed);
    assert.equal(at(k), base, seed);
    for (let n = 1; n <= k; n++) assert.equal(at(n + k), at(n), `${seed} ${n}`);
  }
});

test('rollStyle first reroll follows the weights of the remaining styles', () => {
  const styles = { a: 0.7, b: 0.25, c: 0.05 };
  let fromA = 0, toB = 0;
  for (let i = 0; i < 6000; i++) {
    const seed = `first-${i}`;
    if (rollStyle(createGroupedRng(seed), styles) !== 'a') continue;
    fromA++;
    if (rollStyle(createGroupedRng(seed, { style: 1 }), styles) === 'b') toB++;
  }
  assert.ok(Math.abs(toB / fromA - 0.25 / 0.3) < 0.04, `${toB}/${fromA}`);
});

test('rollStyle is isolated from other groups and other groups from it', () => {
  for (const seed of seeds.slice(0, 300)) {
    const palette = (g) => g.roll('palette', (r) => [r.next(), r.next()]);
    assert.equal(rollStyle(createGroupedRng(seed, { palette: 3, shape: 2 }), STYLES), rollStyle(createGroupedRng(seed), STYLES));
    const g = createGroupedRng(seed, { style: 2 });
    rollStyle(g, STYLES);
    assert.deepEqual(palette(g), palette(createGroupedRng(seed)));
    assert.equal(rollStyle(createGroupedRng(seed, { style: 2 }, { fixed: ['style'] }), STYLES), rollStyle(createGroupedRng(seed), STYLES));
  }
  assert.equal(rollStyle(createGroupedRng('solo', { style: 3 }), { only: 1 }), 'only');
});

test('groupApplies defaults to true; canRoll also requires a rerollable group', () => {
  const definition = {
    groups: [
      { id: 'style', fields: ['style'] },
      { id: 'footrest', fields: ['footrestKind'], appliesTo: (p) => p.style !== 'drum' },
      { id: 'legacy', fields: ['x'], rerollable: false },
    ],
  };
  assert.equal(groupApplies(definition, 'style', { style: 'drum' }), true);
  assert.equal(groupApplies(definition, 'footrest', { style: 'drum' }), false);
  assert.equal(groupApplies(definition, 'footrest', { style: 'bar' }), true);
  assert.equal(groupApplies(definition, 'missing', {}), true);
  assert.equal(canRoll(definition, 'footrest', { style: 'drum' }), false);
  assert.equal(canRoll(definition, 'footrest', { style: 'bar' }), true);
  assert.equal(canRoll(definition, 'legacy', {}), false);
  assert.equal(canRoll(definition, 'missing', {}), false);
});

test('shortcutGroups maps C to palette and S to shape or the first form group', () => {
  const g = (ids) => ({ groups: ids.map((id) => ({ id })) });
  assert.deepEqual(shortcutGroups(g(['style', 'shape', 'palette', 'finish'])), { c: 'palette', s: 'shape' });
  assert.deepEqual(shortcutGroups(g(['style', 'top', 'base', 'palette', 'finish'])), { c: 'palette', s: 'top' });
  assert.deepEqual(shortcutGroups(g(['style', 'finish'])), { c: null, s: null });
  const fixedPalette = { groups: [{ id: 'shape' }, { id: 'palette', rerollable: false }] };
  assert.deepEqual(shortcutGroups(fixedPalette), { c: null, s: 'shape' });
});
