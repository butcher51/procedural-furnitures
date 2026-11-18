import * as THREE from 'three';
import { frontRegions } from '../../src/furniture/desk/layout.js';

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

const DESK_HEIGHT_WINDOW = { sit: [0.72, 0.76], stand: [1.0, 1.18] };

const isDecorMesh = (mesh) => mesh.material?.userData?.role === 'decor';
const deskTop = (partMeshes) => partMeshes.find((mesh) => mesh.name === 'top');
const meshBox = (mesh) => new THREE.Box3().setFromObject(mesh, true);

function deskTopAtHeight({ params, partMeshes }) {
  const top = deskTop(partMeshes);
  if (!top) return ['top at height: no mesh named "top"'];
  const failures = [];
  const max = meshBox(top).max.y;
  if (Math.abs(max - params.topHeight) > 0.003) failures.push(`top at height: top surface ${max.toFixed(3)} differs from topHeight ${params.topHeight.toFixed(3)}`);
  const [lo, hi] = DESK_HEIGHT_WINDOW[params.heightMode];
  if (params.topHeight < lo - 1e-9 || params.topHeight > hi + 1e-9) failures.push(`top at height: ${params.heightMode} topHeight ${params.topHeight.toFixed(3)} outside [${lo}, ${hi}]`);
  return failures;
}

function deskBaseUnderTop({ params, partMeshes }) {
  const top = deskTop(partMeshes);
  if (!top) return [];
  const box = meshBox(top).expandByScalar(0.002);
  for (const mesh of partMeshes) {
    if (mesh === top || isDecorMesh(mesh)) continue;
    const b = meshBox(mesh);
    if (b.min.x < box.min.x || b.max.x > box.max.x || b.min.z < box.min.z || b.max.z > box.max.z) {
      const over = Math.max(box.min.x - b.min.x, b.max.x - box.max.x, box.min.z - b.min.z, b.max.z - box.max.z);
      return [`base under top: a ${params.style} part sticks out of the top plan by ${(over * 1000).toFixed(1)} mm`];
    }
  }
  return [];
}

function deskKneeClearance({ params, partMeshes }) {
  const top = deskTop(partMeshes);
  const yMax = params.heightMode === 'stand' ? params.topHeight - 0.14 : 0.6;
  const zFront = params.topDepth / 2;
  const knee = new THREE.Box3(
    new THREE.Vector3(params.kneeCenterX - 0.3, 0.22, zFront - 0.45),
    new THREE.Vector3(params.kneeCenterX + 0.3, yMax, zFront)
  );
  if (params.kneeWidth < 0.62 - 1e-9) return [`knee clearance: knee width ${params.kneeWidth.toFixed(3)} m < 0.62 m`];
  for (const mesh of partMeshes) {
    if (mesh === top) continue;
    const b = meshBox(mesh);
    const overlap = (axis) => Math.min(b.max[axis], knee.max[axis]) - Math.max(b.min[axis], knee.min[axis]);
    if (overlap('x') > 0.001 && overlap('y') > 0.001 && overlap('z') > 0.001) {
      return [`knee clearance: a part occupies the knee space (x ${b.min.x.toFixed(3)}..${b.max.x.toFixed(3)}, y ${b.min.y.toFixed(3)}..${b.max.y.toFixed(3)}, z ${b.min.z.toFixed(3)}..${b.max.z.toFixed(3)})`];
    }
  }
  return [];
}

function deskFrontsFacePlusZ({ params }) {
  return frontRegions(params).flatMap((region) => region.layout.fronts
    .filter((front) => !(front.z1 > front.z0 && front.z1 > 0))
    .map((front) => `fronts face +z: ${region.id} front ${front.index} spans z ${front.z0.toFixed(3)}..${front.z1.toFixed(3)}`));
}

TYPE_RULES.desk = {
  maxSize: { width: 1.8, height: 1.4, depth: 0.82 },
  checks: [centredInX, deskTopAtHeight, deskBaseUnderTop, deskKneeClearance, deskFrontsFacePlusZ],
};
