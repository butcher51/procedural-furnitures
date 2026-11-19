export const EYE_HEIGHT = 1.55;
export const CROUCH_EYE_HEIGHT = 1.0;
export const WALK_SPEED = 2.64;
export const RUN_SPEED = 4.5;
export const CROUCH_SPEED = 1.3;
export const JUMP_SPEED = 3.6;
export const GRAVITY = 9.81;
const ACCELERATION = 12;
const CROUCH_RATE = 14;
const MAX_STEP = 0.05;

const clamp = (value, limit) => Math.min(Math.max(value, -limit), limit);

export function createWalker(x, z) {
  return { x, y: EYE_HEIGHT, z, vx: 0, vy: 0, vz: 0, eye: EYE_HEIGHT, grounded: true };
}

function speedFor({ run, crouch }) {
  if (crouch) return CROUCH_SPEED;
  return run ? RUN_SPEED : WALK_SPEED;
}

export function stepWalker(walker, { forward = 0, strafe = 0, jump = false, run = false, crouch = false, yaw = 0 }, dt, bounds) {
  const t = Math.min(Math.max(dt, 0), MAX_STEP);
  const speed = speedFor({ run, crouch }) / Math.max(1, Math.hypot(forward, strafe));
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  const wishX = (cos * strafe - sin * forward) * speed;
  const wishZ = (-sin * strafe - cos * forward) * speed;
  const blend = 1 - Math.exp(-ACCELERATION * t);
  walker.vx += (wishX - walker.vx) * blend;
  walker.vz += (wishZ - walker.vz) * blend;

  const targetEye = crouch ? CROUCH_EYE_HEIGHT : EYE_HEIGHT;
  walker.eye += (targetEye - walker.eye) * (1 - Math.exp(-CROUCH_RATE * t));
  if (Math.abs(targetEye - walker.eye) < 1e-4) walker.eye = targetEye;

  if (jump && walker.grounded) {
    walker.vy = JUMP_SPEED;
    walker.grounded = false;
  }
  walker.vy -= GRAVITY * t;

  walker.x = clamp(walker.x + walker.vx * t, bounds.halfX);
  walker.z = clamp(walker.z + walker.vz * t, bounds.halfZ);
  walker.y += walker.vy * t;
  if (walker.grounded || walker.y <= walker.eye) {
    walker.y = walker.eye;
    walker.vy = 0;
    walker.grounded = true;
  }
  return walker;
}
