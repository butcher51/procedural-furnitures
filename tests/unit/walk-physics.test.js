import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROUCH_EYE_HEIGHT, CROUCH_SPEED, EYE_HEIGHT, RUN_SPEED, WALK_SPEED, createWalker, stepWalker } from '../../src/app/walk-physics.js';

const bounds = { halfX: 10, halfZ: 10 };
const FRAME = 1 / 60;

function simulate(walker, input, seconds) {
  for (let t = 0; t < seconds; t += FRAME) stepWalker(walker, input, FRAME, bounds);
  return walker;
}

test('a walker stands on the ground at eye height', () => {
  const walker = simulate(createWalker(0, 0), {}, 1);
  assert.equal(walker.y, EYE_HEIGHT);
  assert.equal(walker.grounded, true);
  assert.equal(walker.x, 0);
  assert.equal(walker.z, 0);
});

test('forward with yaw 0 walks toward -z at walking speed', () => {
  const walker = simulate(createWalker(0, 0), { forward: 1 }, 2);
  assert.ok(walker.z < -3, `z ${walker.z}`);
  assert.ok(Math.abs(walker.x) < 1e-9);
  assert.ok(Math.abs(Math.hypot(walker.vx, walker.vz) - WALK_SPEED) < 0.01);
});

test('strafing right with yaw 0 moves toward +x, and yaw turns the frame', () => {
  const right = simulate(createWalker(0, 0), { strafe: 1 }, 1);
  assert.ok(right.x > 1 && Math.abs(right.z) < 1e-9);
  const turnedLeft = simulate(createWalker(0, 0), { forward: 1, yaw: Math.PI / 2 }, 1);
  assert.ok(turnedLeft.x < -1 && Math.abs(turnedLeft.z) < 1e-9);
});

test('diagonal movement is not faster than straight movement and running is faster', () => {
  const diagonal = simulate(createWalker(0, 0), { forward: 1, strafe: 1 }, 2);
  assert.ok(Math.hypot(diagonal.vx, diagonal.vz) <= WALK_SPEED + 1e-6);
  const running = simulate(createWalker(0, 0), { forward: 1, run: true }, 2);
  assert.ok(Math.abs(Math.hypot(running.vx, running.vz) - RUN_SPEED) < 0.01);
});

test('a jump leaves the ground, peaks and lands back at eye height', () => {
  const walker = createWalker(0, 0);
  stepWalker(walker, { jump: true }, FRAME, bounds);
  assert.equal(walker.grounded, false);
  let peak = walker.y;
  for (let i = 0; i < 120; i++) {
    stepWalker(walker, {}, FRAME, bounds);
    peak = Math.max(peak, walker.y);
  }
  assert.ok(peak > EYE_HEIGHT + 0.5 && peak < EYE_HEIGHT + 0.8, `peak ${peak}`);
  assert.equal(walker.y, EYE_HEIGHT);
  assert.equal(walker.grounded, true);
});

test('holding jump in the air does not double jump', () => {
  const walker = createWalker(0, 0);
  stepWalker(walker, { jump: true }, FRAME, bounds);
  const rising = walker.vy;
  stepWalker(walker, { jump: true }, FRAME, bounds);
  assert.ok(walker.vy < rising);
});

test('the walker stays inside the ground bounds', () => {
  const walker = simulate(createWalker(9, 0), { strafe: 1, run: true }, 3);
  assert.equal(walker.x, bounds.halfX);
});

test('a long frame is clamped so a stalled tab does not teleport the walker', () => {
  const walker = createWalker(0, 0);
  stepWalker(walker, { jump: true }, 5, bounds);
  assert.ok(walker.y < EYE_HEIGHT + 0.2);
});

test('the player stands at an eye height that fits a 160-170 cm person', () => {
  assert.ok(EYE_HEIGHT >= 1.48 && EYE_HEIGHT <= 1.58);
});

test('crouching lowers the eye smoothly, slows the walk and standing up restores it', () => {
  const walker = createWalker(0, 0);
  stepWalker(walker, { crouch: true }, FRAME, bounds);
  assert.ok(walker.y < EYE_HEIGHT && walker.y > CROUCH_EYE_HEIGHT);
  simulate(walker, { crouch: true, forward: 1, run: true }, 2);
  assert.equal(walker.y, CROUCH_EYE_HEIGHT);
  assert.ok(Math.abs(Math.hypot(walker.vx, walker.vz) - CROUCH_SPEED) < 0.01);
  simulate(walker, {}, 1);
  assert.equal(walker.y, EYE_HEIGHT);
  assert.equal(walker.grounded, true);
});

test('a crouched jump lands back at crouch height', () => {
  const walker = simulate(createWalker(0, 0), { crouch: true }, 1);
  stepWalker(walker, { crouch: true, jump: true }, FRAME, bounds);
  assert.ok(walker.y > CROUCH_EYE_HEIGHT);
  simulate(walker, { crouch: true }, 2);
  assert.equal(walker.y, CROUCH_EYE_HEIGHT);
});
