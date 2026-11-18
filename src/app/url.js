const ROLL_PAIR = /^([A-Za-z_-]+)(\d+)$/;

export function encodeRerolls(rerolls) {
  return [...rerolls.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, groups]) => {
      const pairs = Object.entries(groups)
        .filter(([, count]) => count > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, count]) => `${group}${count}`);
      return pairs.length ? [number, ...pairs].join('.') : null;
    })
    .filter(Boolean)
    .join('~');
}

export function decodeRerolls(text) {
  const rerolls = new Map();
  if (!text) return rerolls;
  for (const chunk of text.split('~')) {
    const [head, ...pairs] = chunk.split('.');
    const number = Number(head);
    if (!Number.isInteger(number) || number < 1) continue;
    const groups = {};
    for (const pair of pairs) {
      const match = ROLL_PAIR.exec(pair);
      if (match && Number(match[2]) > 0) groups[match[1]] = Number(match[2]);
    }
    if (Object.keys(groups).length) rerolls.set(number, groups);
  }
  return rerolls;
}

export function readState(search) {
  const query = new URLSearchParams(search);
  const item = parseInt(query.get('item'), 10);
  return {
    type: query.get('type') || 'chair',
    seed: query.get('seed') || '',
    item: Number.isInteger(item) && item > 0 ? item : null,
    single: query.get('view') === 'single',
    animate: query.get('anim') !== '0',
    rerolls: decodeRerolls(query.get('r')),
  };
}

export function writeState(state) {
  const query = new URLSearchParams();
  if (state.type !== 'chair') query.set('type', state.type);
  query.set('seed', state.seed);
  if (state.item) query.set('item', String(state.item));
  if (state.single) query.set('view', 'single');
  if (!state.animate) query.set('anim', '0');
  const rolls = encodeRerolls(state.rerolls);
  if (rolls) query.set('r', rolls);
  return `?${query.toString().replaceAll('%7E', '~')}`;
}
