import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycleDetent, screenshotName, snapDetent, stepIndex } from '../../src/app/nav.js';

test('screenshot names follow the grid and solo rules', () => {
  const rerolls = new Map([[42, { shape: 1, palette: 2 }]]);
  assert.equal(screenshotName({ type: 'table', seed: 'abc', item: 42, single: false, rerolls }), 'table-abc.png');
  assert.equal(screenshotName({ type: 'table', seed: 'abc', item: 42, single: true, rerolls }), 'table-abc-42-palette2-shape1.png');
  assert.equal(screenshotName({ type: 'table', seed: 'a/b c', item: 7, single: true, rerolls }), 'table-a_b_c-7.png');
});

test('item stepping wraps on rows and clamps on columns', () => {
  const dims = { count: 9, gridSize: 3 };
  assert.equal(stepIndex(0, 'ArrowLeft', dims), 8);
  assert.equal(stepIndex(8, 'ArrowRight', dims), 0);
  assert.equal(stepIndex(1, 'ArrowUp', dims), 1);
  assert.equal(stepIndex(7, 'ArrowDown', dims), 7);
  assert.equal(stepIndex(4, 'ArrowDown', dims), 7);
});

test('sheet detents snap to nearest or follow a flick', () => {
  const heights = { peek: 72, half: 420, full: 740 };
  assert.equal(snapDetent(200, 0, heights), 'peek');
  assert.equal(snapDetent(300, 0, heights), 'half');
  assert.equal(snapDetent(300, 0.8, heights), 'half');
  assert.equal(snapDetent(100, 0.8, heights), 'half');
  assert.equal(snapDetent(500, -0.8, heights), 'half');
  assert.equal(snapDetent(420, -0.8, heights), 'peek');
  assert.equal(cycleDetent('peek'), 'half');
  assert.equal(cycleDetent('full'), 'peek');
});
