import * as THREE from 'three';
import { hsl } from './color.js';
import { shade, swatch } from './palette.js';
import { hashString } from './rng.js';

const HEX = /^#[0-9a-f]{6}$/i;

const derive = (hex, dl, sScale = 1) => {
  const base = swatch(hex);
  const l = base.l + dl;
  return shade(base, l < 0.2 || l > 0.9 ? -dl : dl, sScale).hex;
};

const GLSL_COMMON = `
varying vec3 vPatPos;
uniform vec3 uPatA;
uniform vec3 uPatB;
uniform vec3 uPatC;
uniform vec3 uPatD;
uniform vec4 uPatP;
uniform float uPatSeed;
float patHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec2 patHash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
float patHash3(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float patNoise2(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(patHash(i), patHash(i + vec2(1.0, 0.0)), f.x), mix(patHash(i + vec2(0.0, 1.0)), patHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float patNoise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(patHash3(i), patHash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(patHash3(i + vec3(0.0, 1.0, 0.0)), patHash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(patHash3(i + vec3(0.0, 0.0, 1.0)), patHash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(patHash3(i + vec3(0.0, 1.0, 1.0)), patHash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float patFill(float d, float aw) {
  return clamp(0.5 - d / max(aw, 1e-5), 0.0, 1.0);
}
float patFade(float aw, float lo, float hi) {
  return 1.0 - smoothstep(lo, hi, aw);
}
float patFootprint(vec3 dx, vec3 dy) {
  float a = length(dx);
  float b = length(dy);
  return max(sqrt(a * b), 0.25 * max(a, b));
}
`;

const GLSL_TRIPLANAR = `
  vec3 patDx = dFdx(vPatPos);
  vec3 patDy = dFdy(vPatPos);
  float patPx = patFootprint(patDx, patDy);
  vec3 patN = abs(normalize(cross(patDx, patDy))) * vec3(1.0, 1.3, 1.19);
  vec2 patUv = patN.x > patN.y && patN.x > patN.z ? vPatPos.zy : patN.y > patN.z ? vPatPos.xz : vPatPos.xy;
  diffuseColor.rgb = patPlane(patUv, patPx);
`;

const GLSL_KINDS = {
  wood: `
varying vec3 vPatGrain;
vec3 patWood(vec3 pos, vec3 g, float px) {
  vec3 a = dot(g, g) < 0.25 ? vec3(1.0, 0.0, 0.0) : normalize(g);
  vec3 ref = abs(a.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 u = normalize(cross(a, ref));
  vec3 v = cross(a, u);
  float along = dot(pos, a);
  vec2 q = vec2(dot(pos, u), dot(pos, v));
  vec2 centre = vec2(0.12, -0.3) + (vec2(uPatSeed, fract(uPatSeed * 7.13)) - 0.5) * 0.3;
  vec2 tilt = vec2(0.08, 0.05) + (vec2(fract(uPatSeed * 3.71), fract(uPatSeed * 5.37)) - 0.5) * 0.06;
  float spacing = uPatP.x;
  float warp = patNoise3(vec3(along * 2.2, q * 7.0) + uPatSeed * 13.0) - 0.5;
  float sweep = patNoise3(vec3(along * 0.9, q * 1.6) + uPatSeed * 29.0) - 0.5;
  float r = length(q - centre - along * tilt) + warp * spacing * (1.0 + 5.0 * uPatP.z) + sweep * spacing * (1.5 + 5.0 * uPatP.z);
  r += spacing * 1.7 * (patNoise3(vec3(r / spacing * 0.17, along * 0.5, uPatSeed * 41.0)) - 0.5);
  float ft = fract(r / spacing);
  float aw = px / spacing;
  float band = smoothstep(0.45, 0.8, ft) * (1.0 - smoothstep(0.86, 1.0, ft));
  band = mix(0.2, band, patFade(aw, 0.2, 0.55));
  float fib = patNoise3(vec3(along * 18.0, q * 650.0) + uPatSeed * 50.0);
  float fibFade = patFade(px * 650.0, 0.35, 0.9);
  float tone = patNoise3(vec3(along * 1.1, q * 2.5) + uPatSeed * 3.0);
  float k = mix(1.6, 1.0, smoothstep(0.03, 0.2, dot(uPatA, vec3(0.2126, 0.7152, 0.0722))));
  vec3 late = max(uPatA + (uPatB - uPatA) * k, vec3(0.0));
  vec3 light = uPatA + (uPatC - uPatA) * k;
  vec3 col = mix(uPatA, light, smoothstep(0.35, 0.85, tone) * 0.8);
  col = mix(col, late, band * 0.7);
  float zone = smoothstep(0.45, 0.75, patNoise3(vec3(r / (spacing * 4.0), along * 0.4, uPatSeed * 17.0)));
  col = mix(col, late, zone * 0.4 * patFade(px / (spacing * 4.0), 0.25, 0.6));
  float f = (fib - 0.5) * uPatP.y * fibFade;
  col = f > 0.0 ? mix(col, light, f * 0.7) : mix(col, late, -f * 0.9);
  return col;
}
`,
  dots: `
vec3 patPlane(vec2 p, float px) {
  float s = uPatP.x;
  vec2 c = p / s + uPatSeed * vec2(17.0, 31.0);
  c.x += uPatP.z * 0.5 * mod(floor(c.y), 2.0);
  vec2 f = fract(c) - 0.5;
  float aw = px / s;
  float r = uPatP.y;
  float cov = patFill(length(f) - r, aw);
  cov = mix(3.14159 * r * r, cov, patFade(aw / r, 0.5, 1.0));
  return mix(uPatA, uPatB, cov);
}
`,
  floral: `
vec3 patPlane(vec2 p, float px) {
  float s = uPatP.x;
  vec2 c = p / s + uPatSeed * vec2(17.0, 31.0);
  vec2 id = floor(c);
  vec2 h = patHash2(id + uPatSeed * 7.0);
  vec2 f = fract(c) - 0.5 - (h - 0.5) * 0.14;
  float aw = px / s;
  float size = uPatP.z;
  float R = size * (0.9 + 0.2 * h.x);
  float n = uPatP.y;
  float rot = h.y * 6.2832;
  float ang = atan(f.y, f.x) + rot;
  float rad = length(f);
  float petal = (rad - R * (0.42 + 0.58 * abs(cos(0.5 * n * ang)))) * 0.8;
  float centre = rad - R * 0.26;
  float leaf = 1.0;
  if (uPatP.w > 0.5) {
    float la = 3.1416 / n - rot;
    vec2 ld = vec2(cos(la), sin(la));
    vec2 q = f - ld * R * 1.02;
    vec2 lq = vec2(dot(q, ld), dot(q, vec2(-ld.y, ld.x)));
    leaf = (length(lq * vec2(1.0, 2.3)) - R * 0.36) * 0.6;
    vec2 ld2 = vec2(cos(la + 2.4), sin(la + 2.4));
    vec2 q2 = f - ld2 * R * 0.98;
    vec2 lq2 = vec2(dot(q2, ld2), dot(q2, vec2(-ld2.y, ld2.x)));
    leaf = min(leaf, (length(lq2 * vec2(1.0, 2.3)) - R * 0.3) * 0.6);
  }
  float fade = patFade(aw / size, 0.12, 0.3);
  float leafCov = mix(uPatP.w * 0.55 * size * size, patFill(leaf, aw), fade);
  float petalCov = mix(1.6 * size * size, patFill(petal, aw), fade);
  float centreCov = mix(0.2 * size * size, patFill(centre, aw), fade);
  vec3 col = mix(uPatA, uPatD, leafCov);
  col = mix(col, uPatB, petalCov);
  return mix(col, uPatC, centreCov);
}
`,
  gingham: `
vec3 patPlane(vec2 p, float px) {
  float s = uPatP.x;
  vec2 c = p / s + uPatSeed * vec2(3.0, 5.0);
  float aw = px / s;
  float fade = patFade(aw, 0.3, 0.6);
  float bx = mix(0.5, patFill(abs(fract(c.x) - 0.5) - 0.25, aw), fade);
  float by = mix(0.5, patFill(abs(fract(c.y) - 0.5) - 0.25, aw), fade);
  vec3 col = mix(uPatA, uPatB, (bx + by) * 0.5);
  float w = uPatP.y;
  if (w > 0.0) {
    float lx = patFill(abs(fract(c.x * 0.25) - 0.5) * 4.0 - w * 0.5, aw);
    float ly = patFill(abs(fract(c.y * 0.25) - 0.5) * 4.0 - w * 0.5, aw);
    float line = mix(w * 0.5, max(lx, ly), patFade(aw / w, 1.0, 2.0));
    col = mix(col, uPatC, line);
  }
  return col;
}
`,
  ticking: `
vec3 patPlane(vec2 p, float px) {
  float s = uPatP.x;
  float coord = (uPatP.z > 0.5 ? p.x : p.y) / s + uPatSeed * 7.0;
  float aw = px / s;
  float w = uPatP.y;
  float d = abs(fract(coord) - 0.5);
  d = uPatP.w > 0.5 ? abs(d - w * 0.9) : d;
  float cov = patFill(d - w * 0.5, aw);
  cov = mix(w * (1.0 + uPatP.w), cov, patFade(aw / w, 1.0, 2.0));
  return mix(uPatA, uPatB, cov);
}
`,
  herringbone: `
vec3 patPlane(vec2 p, float px) {
  float bw = uPatP.x;
  float per = uPatP.y;
  float w = uPatP.z;
  vec2 q = p + uPatSeed * vec2(7.0, 3.0) * bw;
  float zig = abs(fract(q.x / (2.0 * bw)) - 0.5) * 2.0 * bw;
  float coord = (q.y + zig) / per + 0.5 * mod(floor(q.x / bw), 2.0);
  float aw = 1.41 * px / per;
  float cov = patFill(abs(fract(coord) - 0.5) - w * 0.5, aw);
  cov = mix(w, cov, patFade(aw / w, 1.0, 2.0));
  float seam = patFill(abs(fract(q.x / bw) - 0.5) * bw - bw * 0.47, px);
  cov = mix(cov, w, seam * patFade(px / bw, 0.1, 0.25) * 0.6);
  return mix(uPatA, uPatB, cov);
}
`,
  terrazzo: `
float patChip(vec2 c, float aw, float density, float salt) {
  vec2 id = floor(c);
  vec2 h = patHash2(id + salt);
  float present = step(patHash(id + salt + 3.7), density);
  float r = 0.08 + 0.16 * h.y * h.y;
  vec2 f = fract(c) - 0.5 - (h - 0.5) * (0.84 - 2.4 * r);
  float ang = atan(f.y, f.x) + h.x * 6.28;
  r *= 1.0 + 0.22 * sin(2.0 * ang) + 0.1 * sin(5.0 * ang + h.y * 6.28);
  return mix(density * 0.1, patFill(length(f) - r, aw) * present, patFade(aw, 0.08, 0.2));
}
vec3 patPlane(vec2 p, float px) {
  float s = uPatP.x;
  float density = uPatP.y;
  vec2 o = uPatSeed * vec2(17.0, 31.0);
  vec2 q = mat2(0.866, 0.5, -0.5, 0.866) * p;
  vec3 col = mix(uPatA, uPatC, patChip(q / (s * 2.3) + o, px / (s * 2.3), density * 0.6, 11.0 + uPatSeed));
  col = mix(col, uPatB, patChip(p / s + o, px / s, density, 23.0 + uPatSeed));
  return mix(col, uPatB, patChip(q / (s * 0.6) + o.yx, px / (s * 0.6), density * 0.5, 37.0 + uPatSeed) * 0.6);
}
`,
  linen: `
vec3 patPlane(vec2 p, float px) {
  float t = uPatP.x;
  vec2 c = p / t + uPatSeed * vec2(17.0, 31.0);
  float aw = px / t;
  float tone;
  float fade;
  if (uPatP.z > 0.5) {
    vec2 b = c * 1.4;
    float n = patNoise2(b) * 0.6 + patNoise2(b * 2.1 + 7.0) * 0.4;
    tone = smoothstep(0.2, 0.8, n);
    fade = patFade(aw * 1.4, 0.35, 0.8);
  } else {
    float warp = patNoise2(vec2(c.x * 0.3, floor(c.y) * 1.7));
    float weft = patNoise2(vec2(floor(c.x) * 1.7 + 5.0, c.y * 0.3));
    float slub = patNoise2(c * 0.05 + 11.0);
    tone = mix(0.5, mix(warp, weft, 0.5), 0.75 + 0.25 * slub);
    fade = patFade(aw, 0.4, 0.9);
  }
  tone = (mix(0.5, tone, fade) - 0.5) * 1.4 * uPatP.y;
  return tone > 0.0 ? mix(uPatA, uPatB, tone) : mix(uPatA, uPatC, -tone);
}
`,
};

const num = (def, min, max) => ({ type: 'number', def, min, max });
const len = (def, min, max) => ({ type: 'number', def, min, max, length: true });
const oneOf = (...values) => ({ type: 'enum', values });
const flag = (def) => ({ type: 'boolean', def });

export const PATTERN_KINDS_SPEC = {
  wood: {
    colors: ([a, b, c]) => [a, b ?? derive(a, -0.1), c ?? derive(a, 0.06)],
    fields: { ringSpacing: len(0.009, 0.002, 0.05), fibre: num(0.5, 0, 1), figure: num(0.5, 0, 1) },
    params: (s) => [s.ringSpacing, s.fibre, s.figure, 0],
    grain: true,
  },
  dots: {
    colors: ([a, b]) => [a, b ?? derive(a, -0.2)],
    fields: { spacing: len(0.05, 0.008, 0.4), size: num(0.2, 0.05, 0.45), layout: oneOf('offset', 'grid') },
    params: (s) => [s.spacing, s.size, s.layout === 'offset' ? 1 : 0, 0],
  },
  floral: {
    colors: ([a, b, c, d]) => {
      const petal = b ?? derive(a, -0.22);
      return [a, petal, c ?? derive(petal, 0.25), d ?? derive(a, -0.12, 0.6)];
    },
    fields: { spacing: len(0.11, 0.03, 0.5), petals: num(5, 4, 7), size: num(0.24, 0.12, 0.28), leaves: flag(true) },
    params: (s) => [s.spacing, Math.round(s.petals), s.size, s.leaves ? 1 : 0],
  },
  gingham: {
    colors: ([a, b, c]) => {
      const band = b ?? derive(a, -0.25);
      return [a, band, c ?? derive(band, -0.1)];
    },
    fields: { spacing: len(0.02, 0.004, 0.2), overcheck: num(0, 0, 0.3) },
    params: (s) => [s.spacing, s.overcheck, 0, 0],
  },
  ticking: {
    colors: ([a, b]) => [a, b ?? derive(a, -0.3)],
    fields: { spacing: len(0.03, 0.004, 0.3), width: num(0.12, 0.02, 0.45), direction: oneOf('vertical', 'horizontal'), double: flag(false) },
    params: (s) => [s.spacing, s.width, s.direction === 'vertical' ? 1 : 0, s.double ? 1 : 0],
  },
  herringbone: {
    colors: ([a, b]) => [a, b ?? derive(a, -0.12)],
    fields: { band: len(0.03, 0.006, 0.2), spacing: len(0.01, 0.002, 0.05), width: num(0.45, 0.1, 0.7) },
    params: (s) => [s.band, s.spacing, s.width, 0],
  },
  terrazzo: {
    colors: ([a, b, c]) => [a, b ?? derive(a, -0.3, 0.7), c ?? derive(a, -0.12)],
    fields: { size: len(0.014, 0.003, 0.08), density: num(0.6, 0.1, 1) },
    params: (s) => [s.size, s.density, 0, 0],
  },
  linen: {
    colors: ([a, b, c]) => [a, b ?? derive(a, -0.045), c ?? derive(a, 0.035)],
    fields: { thread: len(0.004, 0.001, 0.02), strength: num(0.4, 0, 1), texture: oneOf('linen', 'boucle') },
    params: (s) => [s.thread, s.strength, s.texture === 'boucle' ? 1 : 0, 0],
  },
};

export const PATTERN_KINDS = Object.keys(PATTERN_KINDS_SPEC);

export const WOOD_GRAINS = {
  fine: { ringSpacing: 0.005, fibre: 0.35, figure: 0.3 },
  plain: { ringSpacing: 0.009, fibre: 0.5, figure: 0.5 },
  bold: { ringSpacing: 0.015, fibre: 0.6, figure: 0.85 },
};

export function isShaderPattern(kind) {
  return Object.hasOwn(PATTERN_KINDS_SPEC, kind);
}

export function normalizePattern(spec) {
  const def = PATTERN_KINDS_SPEC[spec?.kind];
  if (!def) throw new Error(`Unknown pattern kind: ${spec?.kind}`);
  const given = [spec.colors ?? []].flat().map((c) => (typeof c === 'string' ? c.toLowerCase() : c));
  if (!given.length || !given.every((c) => HEX.test(c))) throw new Error(`Pattern ${spec.kind} needs #rrggbb colors, got ${JSON.stringify(spec.colors)}`);
  const out = { kind: spec.kind, colors: def.colors(given).map((c) => c.toLowerCase()), scale: Math.max(0.05, Number(spec.scale ?? 1)), seed: spec.seed ?? 0 };
  for (const [name, field] of Object.entries(def.fields)) {
    const value = spec[name];
    if (field.type === 'number') out[name] = Math.min(field.max, Math.max(field.min, Number.isFinite(value) ? value : field.def));
    else if (field.type === 'enum') out[name] = field.values.includes(value) ? value : field.values[0];
    else out[name] = typeof value === 'boolean' ? value : field.def;
  }
  return out;
}

export function patternSeed(seed) {
  return (hashString(String(seed)) % 10007) / 10007;
}

export function patternUniforms(pattern) {
  const def = PATTERN_KINDS_SPEC[pattern.kind];
  const scaled = { ...pattern };
  for (const [name, field] of Object.entries(def.fields)) if (field.length) scaled[name] = pattern[name] * pattern.scale;
  const [a, b, c, d] = pattern.colors;
  return {
    uPatA: { value: new THREE.Color(a) },
    uPatB: { value: new THREE.Color(b ?? a) },
    uPatC: { value: new THREE.Color(c ?? b ?? a) },
    uPatD: { value: new THREE.Color(d ?? c ?? b ?? a) },
    uPatP: { value: new THREE.Vector4(...def.params(scaled)) },
    uPatSeed: { value: patternSeed(pattern.seed) },
  };
}

export function patternProgramKey(kind) {
  return `pattern-${kind}-1`;
}

export function injectPattern(shader, kind, uniforms) {
  const grain = PATTERN_KINDS_SPEC[kind].grain;
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\nvarying vec3 vPatPos;\n${grain ? 'attribute vec3 grain;\nvarying vec3 vPatGrain;\n' : ''}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>\nvPatPos = transformed;\n${grain ? 'vPatGrain = grain;\n' : ''}`);
  const body = grain
    ? `  float patPx = patFootprint(dFdx(vPatPos), dFdy(vPatPos));\n  diffuseColor.rgb = patWood(vPatPos, vPatGrain, patPx);\n`
    : GLSL_TRIPLANAR;
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${GLSL_COMMON}\n${GLSL_KINDS[kind]}`)
    .replace('#include <color_fragment>', `#include <color_fragment>\n${body}`);
  return shader;
}

export function applyPattern(material, spec) {
  const pattern = normalizePattern(spec);
  const uniforms = patternUniforms(pattern);
  material.color.set(pattern.colors[0]);
  material.userData.pattern = pattern;
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => injectPattern(shader, pattern.kind, uniforms);
  material.customProgramCacheKey = () => patternProgramKey(pattern.kind);
  return material;
}

export function patternMaterial(spec, { roughness = 0.8, metalness = 0 } = {}) {
  return applyPattern(new THREE.MeshStandardMaterial({ flatShading: true, roughness, metalness }), spec);
}

export function patternColours(material) {
  return material?.userData?.pattern?.colors ?? [];
}

export function usesGrain(material) {
  return Boolean(PATTERN_KINDS_SPEC[material?.userData?.pattern?.kind]?.grain);
}

export function woodHex(wood) {
  return typeof wood === 'string' ? wood.toLowerCase() : hsl(wood.h, wood.s, wood.l);
}

export function woodPattern(wood, { grain = 'plain', seed = 0, scale = 1 } = {}) {
  const preset = WOOD_GRAINS[grain];
  if (!preset) throw new Error(`Unknown wood grain: ${grain}`);
  return { kind: 'wood', colors: [woodHex(wood)], seed, scale, ...preset };
}

const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

export function autoGrainAxis(geometry) {
  if (geometry.userData?.grainAxis) return new THREE.Vector3(...geometry.userData.grainAxis).normalize();
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  if (size.x >= size.y && size.x >= size.z) return new THREE.Vector3(1, 0, 0);
  return size.y >= size.z ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
}

export function writeGrain(geometry, axis) {
  const count = geometry.attributes.position.count;
  const array = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) array.set([axis.x, axis.y, axis.z], i * 3);
  geometry.setAttribute('grain', new THREE.BufferAttribute(array, 3));
  return geometry;
}

export function writeAutoGrain(geometry) {
  const tangents = geometry.tangents;
  const radial = geometry.parameters?.radialSegments;
  if (!tangents || !radial || geometry.attributes.position.count !== tangents.length * (radial + 1)) return writeGrain(geometry, autoGrainAxis(geometry));
  const array = new Float32Array(geometry.attributes.position.count * 3);
  tangents.forEach((t, i) => {
    for (let j = 0; j <= radial; j++) array.set([t.x, t.y, t.z], (i * (radial + 1) + j) * 3);
  });
  geometry.setAttribute('grain', new THREE.BufferAttribute(array, 3));
  return geometry;
}

function axisVector(axis) {
  if (axis?.isVector3) return axis.clone().normalize();
  if (Array.isArray(axis)) return new THREE.Vector3(...axis).normalize();
  if (AXES[axis]) return new THREE.Vector3(...AXES[axis]);
  throw new Error(`Unknown grain axis: ${axis}`);
}

export function grainAlong(object, axis = 'auto') {
  object.updateMatrixWorld(true);
  const dir = axis === 'auto' ? null : axisVector(axis);
  const toLocal = new THREE.Matrix4();
  object.traverse((o) => {
    if (!o.isMesh) return;
    if (!dir) {
      writeAutoGrain(o.geometry);
      return;
    }
    toLocal.copy(o.matrixWorld).invert().multiply(object.matrixWorld);
    writeGrain(o.geometry, o === object ? dir : dir.clone().transformDirection(toLocal));
  });
  return object;
}

export function transformGrain(geometry, matrix) {
  const grain = geometry.attributes.grain;
  if (!grain) return geometry;
  const m = new THREE.Matrix3().setFromMatrix4(matrix);
  const v = new THREE.Vector3();
  for (let i = 0; i < grain.count; i++) {
    v.fromBufferAttribute(grain, i).applyMatrix3(m);
    if (v.lengthSq() > 0) v.normalize();
    grain.setXYZ(i, v.x, v.y, v.z);
  }
  grain.needsUpdate = true;
  return geometry;
}
