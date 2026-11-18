import * as THREE from 'three';
import { isShaderPattern, patternMaterial, woodHex, woodPattern } from './patterns.js';

const textureCache = new Map();

export function patternKey({ pattern, primary, secondary, direction, scale }) {
  return [pattern, primary, secondary, direction, scale].join('|');
}

export function canvasPatternTexture({ pattern, primary, secondary, direction, scale }) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = secondary;
  const half = size / 2;
  if (pattern === 'stripes') {
    if (direction === 'horizontal') ctx.fillRect(0, 0, size, half);
    else ctx.fillRect(0, 0, half, size);
  } else if (pattern === 'checker') {
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(scale, scale);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export function acquirePatternTexture(spec, textureFactory) {
  if (!textureFactory) return null;
  const key = patternKey(spec);
  let entry = textureCache.get(key);
  if (!entry) {
    const texture = textureFactory(spec);
    if (!texture) return null;
    texture.userData.cacheKey = key;
    entry = { texture, refs: 0 };
    textureCache.set(key, entry);
  }
  entry.refs++;
  return entry.texture;
}

export function releaseTexture(texture) {
  const key = texture.userData?.cacheKey;
  const entry = key === undefined ? null : textureCache.get(key);
  if (!entry || entry.texture !== texture) {
    texture.dispose();
    return;
  }
  entry.refs--;
  if (entry.refs > 0) return;
  textureCache.delete(key);
  texture.dispose();
}

export function textureCacheStats() {
  let refs = 0;
  for (const entry of textureCache.values()) refs += entry.refs;
  return { textures: textureCache.size, refs };
}

export function createMaterials({ textureFactory = null } = {}) {
  const standard = (options) => new THREE.MeshStandardMaterial({ flatShading: true, ...options });
  return {
    surface({ color, secondary, pattern = 'solid', scale = 1, direction = 'horizontal', roughness = 0.8 }) {
      const colors = [color, secondary].filter(Boolean);
      if (pattern && typeof pattern === 'object') return patternMaterial({ colors, ...pattern }, { roughness });
      if (isShaderPattern(pattern)) return patternMaterial({ kind: pattern, colors }, { roughness });
      const map =
        pattern === 'solid'
          ? null
          : acquirePatternTexture({ pattern, primary: color, secondary, direction, scale }, textureFactory);
      return map ? standard({ map, roughness }) : standard({ color, roughness });
    },
    pattern(spec, { roughness = 0.8, metalness = 0 } = {}) {
      return patternMaterial(spec, { roughness, metalness });
    },
    wood(wood, { grain = 'plain', seed = 0, scale = 1, roughness = 0.7 } = {}) {
      if (grain === 'none') return standard({ color: woodHex(wood), roughness });
      return patternMaterial(woodPattern(wood, { grain, seed, scale }), { roughness });
    },
    frame(color, finish) {
      const metal = finish === 'metal';
      return standard({ color, roughness: metal ? 0.35 : 0.7, metalness: metal ? 0.6 : 0 });
    },
    solid(color, roughness = 0.9) {
      return standard({ color, roughness });
    },
  };
}
