import { createWalker, stepWalker } from './walk-physics.js';

const LOOK_SPEED = 0.00264;
const MAX_PITCH = Math.PI / 2 - 0.05;
const ACTION_OF_KEY = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyC: 'crouch',
};

export const walkSupported = () =>
  'requestPointerLock' in Element.prototype && window.matchMedia('(pointer: fine)').matches;

export function createWalk({ stage, hint, onChange }) {
  const canvas = stage.renderer.domElement;
  const held = new Set();
  let active = false;
  let walker = null;
  let yaw = 0;
  let pitch = 0;
  let lastTime = 0;

  const locked = () => document.pointerLockElement === canvas;
  const axis = (positive, negative) => Number(held.has(positive)) - Number(held.has(negative));

  function lock() {
    try {
      Promise.resolve(canvas.requestPointerLock()).catch(() => {});
    } catch {}
  }

  function showState() {
    hint.dataset.state = locked() ? 'locked' : 'paused';
  }

  function enter() {
    if (active) return;
    const spawn = stage.enterWalk();
    walker = createWalker(spawn.x, spawn.z);
    yaw = spawn.yaw;
    pitch = 0;
    lastTime = 0;
    active = true;
    document.activeElement?.blur?.();
    hint.hidden = false;
    showState();
    lock();
    onChange(true);
  }

  function exit() {
    if (!active) return false;
    active = false;
    held.clear();
    hint.hidden = true;
    if (locked()) document.exitPointerLock();
    stage.exitWalk();
    onChange(false);
    return true;
  }

  function tick(now) {
    if (!active) return false;
    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    stepWalker(
      walker,
      {
        forward: axis('forward', 'back'),
        strafe: axis('right', 'left'),
        jump: held.has('jump'),
        run: held.has('run'),
        crouch: held.has('crouch'),
        yaw,
      },
      dt,
      stage.walkArea
    );
    stage.camera.position.set(walker.x, walker.y, walker.z);
    stage.camera.rotation.set(pitch, yaw, 0, 'YXZ');
    return true;
  }

  document.addEventListener('pointerlockchange', () => {
    if (!locked()) held.clear();
    if (active) showState();
  });
  document.addEventListener('mousemove', (e) => {
    if (!active || !locked()) return;
    yaw -= e.movementX * LOOK_SPEED;
    pitch = Math.min(Math.max(pitch - e.movementY * LOOK_SPEED, -MAX_PITCH), MAX_PITCH);
  });
  document.addEventListener('keydown', (e) => {
    const action = ACTION_OF_KEY[e.code];
    if (!active || !locked() || !action) return;
    e.preventDefault();
    held.add(action);
  });
  document.addEventListener('keyup', (e) => held.delete(ACTION_OF_KEY[e.code]));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('click', () => active && !locked() && lock());
  hint.addEventListener('click', () => active && !locked() && lock());

  return {
    enter,
    exit,
    toggle: () => (active ? exit() : enter()),
    tick,
    get active() {
      return active;
    },
  };
}
