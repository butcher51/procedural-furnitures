import { encodeRerolls } from './url.js';

const safe = (text) => String(text).replace(/[^\w.-]+/g, '_');

export function screenshotName({ type, seed, item, single, rerolls }) {
  let name = `${safe(type)}-${safe(seed)}`;
  if (single) {
    name += `-${item}`;
    const rolls = encodeRerolls(new Map([[item, rerolls.get(item) ?? {}]]));
    const pairs = rolls ? rolls.split('.').slice(1) : [];
    if (pairs.length) name += `-${pairs.join('-')}`;
  }
  return `${name}.png`;
}

export function stepIndex(index, key, { count, gridSize }) {
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowUp') return index - gridSize >= 0 ? index - gridSize : index;
  if (key === 'ArrowDown') return index + gridSize < count ? index + gridSize : index;
  return index;
}

export const DETENTS = ['peek', 'half', 'full'];

export function cycleDetent(detent) {
  return detent === 'peek' ? 'half' : 'peek';
}

export function snapDetent(height, velocity, heights) {
  const ordered = DETENTS.map((name) => [name, heights[name]]);
  if (Math.abs(velocity) > 0.5) {
    const ahead = velocity > 0 ? ordered.filter(([, h]) => h > height) : ordered.filter(([, h]) => h < height).reverse();
    if (ahead.length) return ahead[0][0];
  }
  return ordered.reduce((best, entry) => (Math.abs(entry[1] - height) < Math.abs(best[1] - height) ? entry : best))[0];
}
