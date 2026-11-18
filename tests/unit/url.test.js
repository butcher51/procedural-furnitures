import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeRerolls, encodeRerolls, readState, writeState } from '../../src/app/url.js';

test('rerolls round-trip through the plan example', () => {
  const text = '7.finish1~42.palette2.shape1';
  const decoded = decodeRerolls(text);
  assert.deepEqual([...decoded.entries()], [[7, { finish: 1 }], [42, { palette: 2, shape: 1 }]]);
  assert.equal(encodeRerolls(decoded), text);
});

test('encoding is canonical and drops zero counts', () => {
  const rolls = new Map([[42, { shape: 1, palette: 2, finish: 0 }], [3, { palette: 0 }], [7, { finish: 1 }]]);
  assert.equal(encodeRerolls(rolls), '7.finish1~42.palette2.shape1');
});

test('malformed chunks are ignored', () => {
  const decoded = decodeRerolls('x.palette1~0.shape1~5.palette~5.shape0~6.colour3.bad-~9');
  assert.deepEqual([...decoded.entries()], [[6, { colour: 3 }]]);
});

test('random reroll maps round-trip', () => {
  const groups = ['style', 'shape', 'palette', 'pattern', 'finish'];
  let s = 1;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 300; i++) {
    const map = new Map();
    for (let k = 0; k < 1 + Math.floor(rand() * 6); k++) {
      const groupsFor = {};
      for (const g of groups) if (rand() < 0.4) groupsFor[g] = 1 + Math.floor(rand() * 20);
      if (Object.keys(groupsFor).length) map.set(1 + Math.floor(rand() * 625), groupsFor);
    }
    assert.deepEqual(decodeRerolls(encodeRerolls(map)), new Map([...map.entries()].sort(([a], [b]) => a - b)));
  }
});

test('full state round-trips and keeps old chair links short', () => {
  assert.equal(writeState(readState('?seed=abc')), '?seed=abc');
  const search = '?type=table&seed=a+b&item=42&view=single&anim=0&r=42.palette2.shape1~7.finish1';
  const state = readState(search);
  assert.equal(state.type, 'table');
  assert.equal(state.seed, 'a b');
  assert.equal(state.item, 42);
  assert.equal(state.single, true);
  assert.equal(state.animate, false);
  assert.deepEqual(readState(writeState(state)), state);
});
