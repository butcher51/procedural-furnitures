import { hsl } from './color.js';
import { weightedPick } from './rng.js';
import { clamp, lerp } from './math.js';

const wrap = (h) => ((h % 1) + 1) % 1;

export const LIGHTNESS_BOUNDS = [0.18, 0.9];

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
}

export function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h / 6, s, l };
}

const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function oklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 1e-6 ? 0 : (Math.atan2(B, A) * 180 / Math.PI + 360) % 360;
  return { L, C, H };
}

export const CHROMA_LIMITS = [
  [0, 0.1],
  [30, 0.105],
  [60, 0.12],
  [85, 0.115],
  [105, 0.08],
  [130, 0.07],
  [160, 0.07],
  [195, 0.075],
  [230, 0.075],
  [265, 0.075],
  [290, 0.07],
  [330, 0.08],
  [360, 0.1],
];

export function chromaLimit(hueDeg) {
  const h = ((hueDeg % 360) + 360) % 360;
  for (let i = 1; i < CHROMA_LIMITS.length; i++) {
    const [h1, c1] = CHROMA_LIMITS[i];
    if (h <= h1) {
      const [h0, c0] = CHROMA_LIMITS[i - 1];
      return c0 + ((c1 - c0) * (h - h0)) / (h1 - h0);
    }
  }
  return CHROMA_LIMITS[0][1];
}

export function colourIsCalm(hex) {
  const { C, H } = oklch(hex);
  return C <= chromaLimit(H) + 1e-9;
}

const CAP_MARGIN = 0.92;

export function capSaturation(h, s, l) {
  const hue = wrap(h);
  const light = clamp(l, LIGHTNESS_BOUNDS[0], LIGHTNESS_BOUNDS[1]);
  const fits = (sat) => {
    const { C, H } = oklch(hsl(hue, sat, light));
    return C <= CAP_MARGIN * chromaLimit(H);
  };
  let sat = clamp(s, 0, 1);
  if (!fits(sat)) {
    let lo = 0;
    let hi = sat;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    sat = lo;
  }
  return { h: hue, s: sat, l: light, hex: hsl(hue, sat, light) };
}

export function muted(h, s, l) {
  return capSaturation(h, s, l).hex;
}

export const FABRIC_MOODS = {
  neutral: { s: [0.04, 0.16], l: [0.45, 0.78] },
  muted: { s: [0.18, 0.38], l: [0.38, 0.64] },
  bold: { s: [0.35, 0.6], l: [0.32, 0.54] },
};

export const HUE_BANDS = [
  [0, 0.08, 1.2],
  [0.08, 0.17, 1],
  [0.17, 0.45, 0.9],
  [0.45, 0.55, 0.7],
  [0.55, 0.72, 1],
  [0.72, 0.88, 0.6],
  [0.88, 1, 1],
];

const HUE_TOTAL = HUE_BANDS.reduce((sum, [, , w]) => sum + w, 0);

export function fabricHue(u) {
  let rest = u * HUE_TOTAL;
  for (const [from, to, w] of HUE_BANDS) {
    if (rest < w) return from + ((to - from) * rest) / w;
    rest -= w;
  }
  return 0;
}

export function fabricColor(r, { mood = 'muted' } = {}) {
  const range = FABRIC_MOODS[mood] ?? FABRIC_MOODS.muted;
  const h = fabricHue(r.next());
  const s = lerp(range.s, r.next());
  const l = lerp(range.l, r.next());
  return capSaturation(h, s, l);
}

export const PAINTS = [
  { name: 'sage', h: 0.25, s: 0.14, l: 0.6, w: 1 },
  { name: 'olive', h: 0.17, s: 0.22, l: 0.38, w: 0.8 },
  { name: 'forest', h: 0.38, s: 0.2, l: 0.28, w: 0.6 },
  { name: 'slate blue', h: 0.6, s: 0.2, l: 0.46, w: 1 },
  { name: 'navy', h: 0.62, s: 0.32, l: 0.24, w: 0.7 },
  { name: 'powder blue', h: 0.57, s: 0.24, l: 0.74, w: 0.6 },
  { name: 'teal', h: 0.5, s: 0.3, l: 0.34, w: 0.8 },
  { name: 'dusty rose', h: 0.98, s: 0.28, l: 0.66, w: 1 },
  { name: 'oxblood', h: 0.99, s: 0.42, l: 0.27, w: 0.7 },
  { name: 'terracotta', h: 0.04, s: 0.42, l: 0.48, w: 0.8 },
  { name: 'ochre', h: 0.11, s: 0.5, l: 0.5, w: 0.8 },
  { name: 'cream', h: 0.12, s: 0.38, l: 0.86, w: 1 },
  { name: 'putty', h: 0.1, s: 0.12, l: 0.66, w: 0.7 },
  { name: 'charcoal', h: 0.6, s: 0.06, l: 0.22, w: 0.9 },
  { name: 'plum', h: 0.88, s: 0.18, l: 0.32, w: 0.5 },
];

const PAINT_WEIGHTS = PAINTS.map((p) => [p, p.w]);

export function paintColor(r) {
  const paint = weightedPick(r, PAINT_WEIGHTS);
  const h = paint.h + r.range(-0.012, 0.012);
  const l = paint.l + r.range(-0.04, 0.04);
  return { name: paint.name, ...capSaturation(h, paint.s, l) };
}

export const ACCENT_MODES = ['analogous', 'complement', 'warm', 'tonal'];

export function accentColor(r, base) {
  const mode = ACCENT_MODES[Math.min(3, Math.floor(r.next() * 4))];
  const u = r.next();
  const v = r.next();
  const band = clamp(Math.max(base.s, 0.18), 0.18, 0.4);
  if (mode === 'analogous') {
    const h = base.h + (u < 0.5 ? -1 : 1) * lerp([0.06, 0.11], (u * 2) % 1);
    return capSaturation(h, band, contrastLightness(base.l, v));
  }
  if (mode === 'complement') return capSaturation(base.h + 0.5 + (u - 0.5) * 0.08, band * 0.85, contrastLightness(base.l, v));
  if (mode === 'warm') {
    const h = lerp([0.03, 0.12], u);
    return capSaturation(h, lerp([0.3, 0.45], v), lerp([0.45, 0.62], v));
  }
  return capSaturation(base.h, clamp(base.s * 0.7, 0.05, 0.3), contrastLightness(base.l, v));
}

function contrastLightness(l, t) {
  const shift = lerp([0.14, 0.24], t);
  return l > 0.55 ? l - shift : l + shift;
}

export const HARMONY_MODES = ['light', 'dark', 'complement', 'analogous', 'white'];

export function harmoniousSecondary(primary, mode) {
  const { h, s, l } = primary;
  if (mode === 'light') return capSaturation(h, Math.min(s, 0.3) * 0.8, clamp(l + 0.25, 0.78, 0.88));
  if (mode === 'dark') return capSaturation(h, Math.min(s, 0.4), clamp(l - 0.28, 0.18, 0.3));
  if (mode === 'complement') return capSaturation(h + 0.5, clamp(s * 0.9, 0.06, 0.38), contrastLightness(l, 0.3));
  if (mode === 'analogous') return capSaturation(h + 0.07, clamp(s, 0.06, 0.4), contrastLightness(l, 0.5));
  return capSaturation(0.11, 0.3, 0.93);
}

export function shade(base, dl, sScale = 1) {
  return capSaturation(base.h, base.s * sScale, base.l + dl);
}

export function swatch(hex) {
  return { ...hexToHsl(hex), hex };
}
