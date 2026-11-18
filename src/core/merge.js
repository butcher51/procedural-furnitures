import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { releaseTexture } from './materials.js';
import { transformGrain, usesGrain, writeAutoGrain } from './patterns.js';

export function groupParts(parts) {
  const root = new THREE.Group();
  root.add(...parts);
  return root;
}

let noShadowDepth = null;

export function shadowMaskDepthMaterial() {
  if (noShadowDepth) return noShadowDepth;
  noShadowDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  noShadowDepth.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float shadowMask;\nvarying float vShadowMask;\n${shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvShadowMask = shadowMask;')}`;
    shader.fragmentShader = `varying float vShadowMask;\n${shader.fragmentShader.replace('void main() {', 'void main() {\n\tif (vShadowMask > 0.5) discard;')}`;
  };
  noShadowDepth.customProgramCacheKey = () => 'shadow-mask-1';
  return noShadowDepth;
}

export function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  const byMaterial = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!byMaterial.has(o.material)) byMaterial.set(o.material, []);
    if (usesGrain(o.material) && !o.geometry.attributes.grain) writeAutoGrain(o.geometry);
    const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    if (noShadowPart(o)) geometry.setAttribute('shadowMask', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1), 1));
    transformGrain(geometry.applyMatrix4(o.matrixWorld), o.matrixWorld);
    byMaterial.get(o.material).push(geometry);
    o.geometry.dispose();
  });
  const merged = new THREE.Group();
  for (const [material, geometries] of byMaterial) {
    if (!usesGrain(material)) geometries.forEach((g) => g.deleteAttribute('grain'));
    if (!material.vertexColors) geometries.forEach((g) => g.deleteAttribute('color'));
    fillMissingAttributes(geometries, material.vertexColors ? { color: 1 } : {});
    const masked = geometries.some((g) => g.attributes.shadowMask);
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    mesh.castShadow = mesh.receiveShadow = true;
    if (masked) mesh.customDepthMaterial = shadowMaskDepthMaterial();
    merged.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  return merged;
}

function noShadowPart(o) {
  for (let p = o; p; p = p.parent) if (p.userData?.noShadow) return true;
  return false;
}

export function fillMissingAttributes(geometries, fills = {}) {
  const sizes = new Map();
  for (const g of geometries) for (const [name, a] of Object.entries(g.attributes)) if (!sizes.has(name)) sizes.set(name, a.itemSize);
  for (const g of geometries) {
    for (const [name, itemSize] of sizes) {
      if (g.attributes[name]) continue;
      const array = new Float32Array(g.attributes.position.count * itemSize);
      if (fills[name]) array.fill(fills[name]);
      g.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
    }
  }
  return geometries;
}

export function disposeObject(root) {
  const materials = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    materials.add(o.material);
  });
  for (const m of materials) {
    if (m.map) releaseTexture(m.map);
    m.dispose();
  }
}
