import * as THREE from 'three';
import { weightedPick } from './rng.js';

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

export const WOODS = [
  { name: 'oak', h: 0.09, s: 0.3, l: 0.58 },
  { name: 'walnut', h: 0.075, s: 0.24, l: 0.31 },
  { name: 'cherry', h: 0.055, s: 0.32, l: 0.4 },
  { name: 'honey', h: 0.095, s: 0.38, l: 0.54 },
  { name: 'birch', h: 0.11, s: 0.26, l: 0.74 },
  { name: 'mahogany', h: 0.04, s: 0.3, l: 0.28 },
];

export function pickWood(r, { weights } = {}) {
  const wood = weights ? weightedPick(r, WOODS.map((w) => [w, weights[w.name] ?? 0])) : r.pick(WOODS);
  const h = wood.h + r.range(-0.01, 0.01);
  const l = wood.l + r.range(-0.05, 0.05);
  return { name: wood.name, h, s: wood.s, l };
}

export const LEATHERS = [
  { name: 'tan', h: 0.085, s: 0.42, l: 0.5 },
  { name: 'cognac', h: 0.06, s: 0.5, l: 0.38 },
  { name: 'chocolate', h: 0.055, s: 0.32, l: 0.24 },
  { name: 'oxblood', h: 0.995, s: 0.4, l: 0.26 },
  { name: 'bottle green', h: 0.4, s: 0.28, l: 0.24 },
];

export function pickLeather(r) {
  const leather = r.pick(LEATHERS);
  const h = (leather.h + r.range(-0.01, 0.01) + 1) % 1;
  const l = leather.l + r.range(-0.03, 0.03);
  return { name: leather.name, h, s: leather.s, l, hex: hsl(h, leather.s, l) };
}
