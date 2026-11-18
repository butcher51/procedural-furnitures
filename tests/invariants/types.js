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

function sofaCentred({ box }) {
  const c = box.getCenter(new THREE.Vector3());
  return Math.abs(c.x) <= 0.005 && Math.abs(c.z) <= 0.005 ? [] : [`centred: bbox centre (${(c.x * 1000).toFixed(1)}, ${(c.z * 1000).toFixed(1)}) mm off the axes`];
}

function sofaNamedBox(partMeshes, name) {
  const box = new THREE.Box3();
  let any = false;
  for (const mesh of partMeshes) {
    if (mesh.name === name) {
      box.expandByObject(mesh);
      any = true;
    }
  }
  return any ? box : null;
}

function sofaArmsSymmetric({ params, partMeshes }) {
  if (!['sofa', 'loveseat', 'midcentury'].includes(params.style) || params.armStyle === 'none') return [];
  const box = sofaNamedBox(partMeshes, 'arm');
  if (!box) return ['armsSymmetric: no arm meshes'];
  const x = box.getCenter(new THREE.Vector3()).x;
  return Math.abs(x) <= CENTRED_TOLERANCE ? [] : [`armsSymmetric: arm bbox centre x ${(x * 1000).toFixed(1)} mm off the axis`];
}

function sofaBackAtRear({ params, mergedMeshes }) {
  if (params.style === 'chaise') return [];
  const threshold = params.seatHeight + params.armRise + 0.02;
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
  if (count === 0) return ['backAtRear: nothing rises above the arms'];
  const limit = params.style === 'sectional' ? -params.returnLength / 2 + params.depth / 2 : 0;
  const z = sum / count;
  return z < limit ? [] : [`backAtRear: geometry above the arms is centred at z ${z.toFixed(3)}, limit ${limit.toFixed(3)}`];
}

function sofaSeatHeight({ partMeshes }) {
  const box = sofaNamedBox(partMeshes, 'seatCushion');
  if (!box) return ['seatHeight: no seat cushions'];
  return box.max.y >= 0.38 && box.max.y <= 0.47 ? [] : [`seatHeight: seat cushion top ${box.max.y.toFixed(3)} m outside [0.38, 0.47]`];
}

function sofaCushionsInsideArms({ params, partMeshes }) {
  const box = sofaNamedBox(partMeshes, 'seatCushion');
  if (!box) return [];
  if (params.style === 'chaise') {
    const edge = params.width / 2 - params.headLength + 0.001;
    const sh = params.headSide === 'left' ? -1 : 1;
    return (sh > 0 ? box.max.x : -box.min.x) <= edge ? [] : ['cushionsInsideArms: seat cushion reaches into the head end'];
  }
  const inner = params.innerSpan / 2 + 0.001;
  return box.max.x <= inner && box.min.x >= -inner ? [] : [`cushionsInsideArms: seat cushions span x [${box.min.x.toFixed(3)}, ${box.max.x.toFixed(3)}], inner faces at +-${inner.toFixed(3)}`];
}

TYPE_RULES.sofa = {
  maxSize: { width: 2.6, height: 1.0, depth: 2.0 },
  checks: [sofaCentred, sofaArmsSymmetric, sofaBackAtRear, sofaSeatHeight, sofaCushionsInsideArms],
};
