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

export const STONE_TONES = [
  { name: 'white marble', h: 0.1, s: 0.08, l: 0.86 },
  { name: 'black marble', h: 0.6, s: 0.05, l: 0.18 },
  { name: 'travertine', h: 0.09, s: 0.3, l: 0.72 },
  { name: 'grey terrazzo', h: 0.08, s: 0.04, l: 0.62 },
];

export const FRAME_COLORS = { black: '#2a2a2c', white: '#efefea', metal: '#a7abb0' };

export const SECONDARY_MODES = ['light', 'dark', 'complement', 'white'];

export function secondaryColor(mode, hue) {
  if (mode === 'light') return hsl(hue, 0.4, 0.85);
  if (mode === 'dark') return hsl(hue, 0.5, 0.22);
  if (mode === 'complement') return hsl((hue + 0.5) % 1, 0.55, 0.55);
  return '#f4f1ea';
}

export function pickWood(r) {
  const wood = r.pick(WOOD_TONES);
  const h = wood.h + r.range(-0.01, 0.01);
  const l = wood.l + r.range(-0.05, 0.05);
  return { name: wood.name, h, s: wood.s, l };
}
