import * as THREE from 'three';

export function hsl(h, s, l) {
  return '#' + new THREE.Color().setHSL(h, s, l, THREE.SRGBColorSpace).getHexString();
}

export const WOOD_TONES = [
  { name: 'oak', h: 0.09, s: 0.45, l: 0.6 },
  { name: 'walnut', h: 0.07, s: 0.35, l: 0.3 },
  { name: 'cherry', h: 0.03, s: 0.5, l: 0.4 },
  { name: 'honey', h: 0.1, s: 0.6, l: 0.5 },
  { name: 'birch', h: 0.11, s: 0.35, l: 0.75 },
  { name: 'mahogany', h: 0.01, s: 0.45, l: 0.28 },
];
