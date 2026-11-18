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

const TABLE_HEIGHT_WINDOW = {
  dining: [0.72, 0.76], trestle: [0.72, 0.76], coffee: [0.3, 0.48], side: [0.5, 0.6], cafe: [0.72, 1.07],
};

function tableTopAtHeight({ params, box }) {
  const failures = [];
  if (Math.abs(box.max.y - params.topHeight) > 0.003) {
    failures.push(`top at height: bbox max y ${box.max.y.toFixed(3)} differs from topHeight ${params.topHeight.toFixed(3)}`);
  }
  const [lo, hi] = TABLE_HEIGHT_WINDOW[params.style];
  if (params.topHeight < lo - 1e-9 || params.topHeight > hi + 1e-9) {
    failures.push(`top at height: ${params.style} topHeight ${params.topHeight.toFixed(3)} outside [${lo}, ${hi}]`);
  }
  return failures;
}

function tableBaseUnderTop({ params, mergedMeshes }) {
  const hx = params.topLength / 2 + 0.002;
  const hz = params.topDepth / 2 + 0.002;
  const underside = params.topHeight - params.topThickness - 0.002;
  const v = new THREE.Vector3();
  for (const mesh of mergedMeshes) {
    const position = mesh.geometry.attributes.position;
    mesh.updateMatrixWorld(true);
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      if (v.y < underside && (Math.abs(v.x) > hx || Math.abs(v.z) > hz)) {
        return [`base under top: vertex (${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)}) outside the top plan`];
      }
    }
  }
  return [];
}

function tableKneeClearance({ params }) {
  if (params.style !== 'dining' || !params.hasApron) return [];
  const bottom = params.legHeight - params.apronHeight;
  return bottom >= 0.6 - 1e-9 ? [] : [`knee clearance: apron bottom ${bottom.toFixed(3)} m < 0.60 m`];
}

export const TYPE_RULES = {
  chair: {
    maxSize: { width: 1.2, height: 1.2, depth: 1.2 },
    checks: [centredInX, chairBackAtRear],
  },
  table: {
    maxSize: { width: 2.0, height: 1.07, depth: 1.3 },
    checks: [centredInX, tableTopAtHeight, tableBaseUnderTop, tableKneeClearance],
  },
};
