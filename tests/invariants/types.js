import * as THREE from 'three';

const CENTRED_TOLERANCE = 0.002;
const ABOVE_SEAT = 0.02;

function centredInX({ box }) {
  const x = box.getCenter(new THREE.Vector3()).x;
  return Math.abs(x) <= CENTRED_TOLERANCE ? [] : [`centred: bbox centre x ${(x * 1000).toFixed(1)} mm off the axis`];
}

function chairBackAtRear({ params, mergedMeshes }) {
  const threshold = params.seatHeight + ABOVE_SEAT;
  let sum = 0;
  let count = 0;
  for (const mesh of mergedMeshes) {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      if (position.getY(i) > threshold) {
        sum += position.getZ(i);
        count++;
      }
    }
  }
  if (count === 0) return [`front facing: nothing rises above the seat (${params.seatHeight.toFixed(3)} m), no back rest`];
  const z = sum / count;
  return z < 0 ? [] : [`front facing: geometry above the seat is centred at z ${z.toFixed(3)}, not behind the seat`];
}

export const TYPE_RULES = {
  chair: {
    maxSize: { width: 1.2, height: 1.2, depth: 1.2 },
    checks: [centredInX, chairBackAtRear],
  },
};

function aboveSeat({ params, mergedMeshes }, visit) {
  const threshold = params.seatHeight + ABOVE_SEAT;
  for (const mesh of mergedMeshes) {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      if (position.getY(i) > threshold) visit(position.getX(i), position.getZ(i));
    }
  }
}

function benchBackAtRear(context) {
  if (!context.params.hasBack) return [];
  let min = Infinity;
  let max = -Infinity;
  aboveSeat(context, (x, z) => {
    min = Math.min(min, z);
    max = Math.max(max, z);
  });
  if (min === Infinity) return ['front facing: bench has a back but nothing rises above the seat'];
  const centre = (min + max) / 2;
  return centre < 0 ? [] : [`front facing: geometry above the seat spans z [${min.toFixed(3)}, ${max.toFixed(3)}], not behind the seat`];
}

function benchArmsSymmetric(context) {
  if (!context.params.hasArms) return [];
  let min = Infinity;
  let max = -Infinity;
  aboveSeat(context, (x) => {
    min = Math.min(min, x);
    max = Math.max(max, x);
  });
  return Math.abs(max + min) <= CENTRED_TOLERANCE ? [] : [`arms symmetric: x extent above the seat is [${min.toFixed(3)}, ${max.toFixed(3)}]`];
}

TYPE_RULES.bench = {
  maxSize: { width: 1.95, height: 0.95, depth: 0.8 },
  checks: [centredInX, benchBackAtRear, benchArmsSymmetric],
};
