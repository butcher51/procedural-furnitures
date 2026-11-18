import * as THREE from 'three';
import { planHandles } from '../../src/core/fronts.js';
import { cabinetLayout } from '../../src/furniture/cabinet/layout.js';

export const FORM_WINDOWS = {
  sideboard: { height: [0.68, 0.9], width: [1.2, 1.95] },
  lowDresser: { height: [0.74, 0.95], width: [0.9, 1.6] },
  tallChest: { height: [1.05, 1.4], width: [0.7, 1.0] },
  nightstand: { height: [0.5, 0.68], width: [0.4, 0.6] },
  tv: { height: [0.4, 0.6], width: [1.2, 1.95] },
};

export function formWindow({ params }) {
  const window = FORM_WINDOWS[params.form];
  const failures = [];
  const within = (name, value, [lo, hi]) => {
    if (value < lo - 1e-9 || value > hi + 1e-9) failures.push(`form window: ${params.form} ${name} ${value.toFixed(3)} outside [${lo}, ${hi}]`);
  };
  within('height', params.height, window.height);
  within('width', params.width, window.width);
  if (params.form === 'sideboard' && params.width < 1.6 * params.height - 1e-9) failures.push('form window: sideboard narrower than 1.6 x height');
  if (params.form === 'tv' && params.width < 2.5 * params.height - 1e-9) failures.push('form window: tv narrower than 2.5 x height');
  return failures;
}

export function materialsAtMost4({ mergedMeshes }) {
  return mergedMeshes.length <= 4 ? [] : [`materials: ${mergedMeshes.length} merged meshes`];
}

export function frontsInField({ params }) {
  const { layout, field } = cabinetLayout(params);
  const e = 1e-6;
  const failures = [];
  layout.fronts.forEach((a, i) => {
    if (a.x0 < field.x0 - e || a.x1 > field.x1 + e || a.y0 < field.y0 - e || a.y1 > field.y1 + e) failures.push(`fronts in field: front ${i} outside the face field`);
    for (let j = i + 1; j < layout.fronts.length; j++) {
      const b = layout.fronts[j];
      if (a.x0 < b.x1 - e && b.x0 < a.x1 - e && a.y0 < b.y1 - e && b.y0 < a.y1 - e) failures.push(`fronts in field: fronts ${i} and ${j} overlap`);
    }
  });
  return failures;
}

export function handlesOnFronts({ params }) {
  if (!params.hasFronts) return [];
  const { layout, hw } = cabinetLayout(params);
  const failures = [];
  for (const slot of planHandles(layout, hw)) {
    if (slot.kind === 'groove' || slot.kind === 'cutout') continue;
    const front = layout.fronts[slot.front];
    const horizontal = slot.axis === 'x';
    const halfX = (horizontal ? slot.length : slot.size) / 2;
    const halfY = (horizontal ? slot.size : slot.length) / 2;
    if (slot.x - halfX < front.x0 - 1e-6 || slot.x + halfX > front.x1 + 1e-6 || slot.y - halfY < front.y0 - 1e-6 || slot.y + halfY > front.y1 + 1e-6) {
      failures.push(`handles on fronts: ${slot.kind} on front ${slot.front} hangs over its edge`);
    }
  }
  return failures;
}

export function baseUnderTop({ params, mergedMeshes }) {
  const hx = params.width / 2 + params.topOverhang + 0.002;
  const underside = params.height - params.topThickness - 0.002;
  const backZ = -params.depth / 2 - 0.002;
  const frontZ = params.depth / 2 + Math.max(params.topOverhang, 0.04) + 0.002;
  const v = new THREE.Vector3();
  for (const mesh of mergedMeshes) {
    const position = mesh.geometry.attributes.position;
    mesh.updateMatrixWorld(true);
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      if (v.y < underside && (Math.abs(v.x) > hx || v.z < backZ || v.z > frontZ)) {
        return [`base under top: vertex (${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)}) outside the top plan`];
      }
    }
  }
  return [];
}
