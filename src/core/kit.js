import { createMaterials } from './materials.js';

export function createKit({ textureFactory = null } = {}) {
  return { materials: createMaterials({ textureFactory }) };
}
