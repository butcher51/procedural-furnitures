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

const STOOL_HEIGHT_RANGES = {
  bar: [0.72, 0.8],
  counter: [0.6, 0.68],
  diner: [0.6, 0.8],
  milking: [0.26, 0.45],
  drum: [0.38, 0.46],
  slab: [0.22, 0.46],
};

function stoolNothingAboveSeat({ params, box }) {
  const over = box.max.y - params.seatHeight;
  return over <= 0.002 ? [] : [`nothing above seat: bbox top is ${(over * 1000).toFixed(1)} mm above the seat height`];
}

function stoolFootrestBelowSeat({ params }) {
  if (params.footrestKind === 'none') return [];
  const top = params.footrestHeight + (params.footrestDouble ? params.footrestGap : 0) + params.footrestRadius;
  return top < params.legHeight - 0.05 ? [] : [`footrest below seat: footrest top ${top.toFixed(3)} m is not 5 cm under the support top ${params.legHeight.toFixed(3)} m`];
}

function stoolSeatHeightInStyleRange({ params, box }) {
  const [lo, hi] = STOOL_HEIGHT_RANGES[params.style];
  const top = box.max.y;
  return top >= lo - 0.002 && top <= hi + 0.002 ? [] : [`seat height: bbox top ${top.toFixed(3)} m outside the ${params.style} range ${lo}-${hi} m`];
}

TYPE_RULES.stool = {
  maxSize: { width: 0.7, height: 0.85, depth: 0.7 },
  checks: [centredInX, stoolNothingAboveSeat, stoolFootrestBelowSeat, stoolSeatHeightInStyleRange],
};
