import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { releaseTexture } from './materials.js';
import { transformGrain, usesGrain, writeAutoGrain } from './patterns.js';

export function groupParts(parts) {
  const root = new THREE.Group();
  root.add(...parts);
  return root;
}

export function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  const byMaterial = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!byMaterial.has(o.material)) byMaterial.set(o.material, []);
    if (usesGrain(o.material) && !o.geometry.attributes.grain) writeAutoGrain(o.geometry);
    const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    transformGrain(geometry.applyMatrix4(o.matrixWorld), o.matrixWorld);
    byMaterial.get(o.material).push(geometry);
    o.geometry.dispose();
  });
  const merged = new THREE.Group();
  for (const [material, geometries] of byMaterial) {
    if (!usesGrain(material)) geometries.forEach((g) => g.deleteAttribute('grain'));
    fillMissingAttributes(geometries);
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
    mesh.castShadow = mesh.receiveShadow = true;
    merged.add(mesh);
    geometries.forEach((g) => g.dispose());
  }
  return merged;
}

export function fillMissingAttributes(geometries) {
  const sizes = new Map();
  for (const g of geometries) for (const [name, a] of Object.entries(g.attributes)) if (!sizes.has(name)) sizes.set(name, a.itemSize);
  for (const g of geometries) {
    for (const [name, itemSize] of sizes) {
      if (g.attributes[name]) continue;
      g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * itemSize), itemSize));
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
