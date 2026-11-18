const lerp = (a, b, t) => a + (b - a) * t;
const pickInt = (lo, hi, t) => Math.min(hi, lo + Math.floor(t * (hi - lo + 1)));
const doors = (hinge = 'auto') => ({ leaf: 'doors', hinge });
const drawers = (count, extra = {}) => ({ leaf: 'drawers', count, ...extra });
const open = (shelves = 0) => ({ leaf: 'open', shelves });
const bays = (k, make) => Array.from({ length: k }, make);

export const CABINET_TEMPLATES = {
  SB1: { form: 'sideboard', plan: ([, b, , d], g) => ({ split: 'x', symmetric: true, weights: [1, lerp(0.6, 1, d), 1], children: [doors(), drawers(pickInt(3, 4, b), { grade: g }), doors()] }) },
  SB2: { form: 'sideboard', plan: ([a, , c], g, w) => {
    const k = Math.min(pickInt(2, 4, c), Math.max(2, Math.floor(w / 0.38)));
    return { split: 'y', children: [drawers(1, { across: k, size: lerp(0.16, 0.22, a) }), { split: 'x', children: bays(k, () => doors()) }] };
  } },
  SB3: { form: 'sideboard', plan: ([, , c]) => ({ split: 'x', symmetric: true, children: bays(pickInt(3, 4, c), () => doors()) }) },
  SB4: { form: 'sideboard', plan: ([a, b, , , , f], g) => {
    const share = lerp(0.35, 0.5, a);
    const children = [drawers(pickInt(3, 4, b), { grade: g }), doors()];
    const weights = [share, 1 - share];
    return f < 0.5 ? { split: 'x', weights, children } : { split: 'x', weights: weights.reverse(), children: children.reverse() };
  } },
  SB5: { form: 'sideboard', plan: ([a]) => ({ split: 'x', symmetric: true, weights: [1, lerp(0.7, 1.2, a), 1], children: [doors(), open(1), doors()] }) },
  SB6: { form: 'sideboard', plan: ([a, , c]) => {
    const share = lerp(0.45, 0.6, a);
    return { split: 'y', weights: [share, 1 - share], children: [drawers(1, { across: pickInt(2, 4, c) }), open(1)] };
  } },
  TV1: { form: 'tv', plan: ([a, , , , e]) => ({ split: 'x', symmetric: true, weights: [1, lerp(0.8, 1.4, a), 1], children: [doors(), open(pickInt(0, 1, e)), doors()] }) },
  TV2: { form: 'tv', plan: ([, , c]) => ({ split: 'x', symmetric: true, children: bays(pickInt(2, 4, c), () => doors('bottom')) }) },
  TV3: { form: 'tv', plan: ([a, , c]) => {
    const share = lerp(0.4, 0.55, a);
    return { split: 'y', weights: [share, 1 - share], children: [open(0), drawers(1, { across: pickInt(2, 4, c) })] };
  } },
  TV4: { form: 'tv', plan: ([, , c]) => ({ split: 'x', symmetric: true, children: bays(pickInt(2, 3, c), () => ({ split: 'y', children: [open(0), open(0)] })) }) },
  TV5: { form: 'tv', plan: ([a]) => ({ split: 'x', symmetric: true, weights: [1, lerp(0.8, 1.4, a), 1], children: [drawers(2), open(0), drawers(2)] }) },
  LD1: { form: 'lowDresser', plan: ([, b], g) => ({ split: 'x', symmetric: true, children: [drawers(pickInt(3, 4, b), { grade: g }), drawers(pickInt(3, 4, b), { grade: g })] }) },
  LD2: { form: 'lowDresser', plan: ([, b], g) => ({ split: 'x', symmetric: true, children: bays(3, () => drawers(pickInt(3, 4, b), { grade: g })) }) },
  LD3: { form: 'lowDresser', plan: ([, b], g) => drawers(pickInt(2, 3, b) + 1, { grade: g, acrossTop: 2 }) },
  LD4: { form: 'lowDresser', plan: ([a, b, , , , f], g) => {
    const share = lerp(0.4, 0.6, a);
    const children = [drawers(pickInt(3, 4, b), { grade: g }), doors()];
    const weights = [share, 1 - share];
    return f < 0.5 ? { split: 'x', weights, children } : { split: 'x', weights: weights.reverse(), children: children.reverse() };
  } },
  LD5: { form: 'lowDresser', plan: ([, b, c]) => ({ split: 'x', symmetric: true, children: bays(pickInt(3, 4, c), () => drawers(pickInt(3, 4, b))) }) },
  TC1: { form: 'tallChest', plan: ([, b], g) => drawers(pickInt(4, 6, b), { grade: g }) },
  TC2: { form: 'tallChest', plan: ([, b], g) => drawers(pickInt(3, 4, b) + 1, { grade: g, acrossTop: 2 }) },
  TC3: { form: 'tallChest', plan: ([a, b], g) => {
    const share = lerp(0.35, 0.5, a);
    return { split: 'y', weights: [share, 1 - share], children: [doors(), drawers(pickInt(2, 3, b), { grade: g })] };
  } },
  TC4: { form: 'tallChest', plan: ([, b]) => ({ split: 'x', symmetric: true, children: [drawers(pickInt(5, 6, b)), drawers(pickInt(5, 6, b))] }) },
  NS1: { form: 'nightstand', plan: ([a, , , , e]) => {
    const share = lerp(0.35, 0.5, a);
    return { split: 'y', weights: [share, 1 - share], children: [drawers(1), open(pickInt(0, 1, e))] };
  } },
  NS2: { form: 'nightstand', plan: ([a]) => {
    const share = lerp(0.3, 0.4, a);
    return { split: 'y', weights: [share, 1 - share], children: [drawers(1), doors()] };
  } },
  NS3: { form: 'nightstand', plan: ([, b], g) => drawers(pickInt(2, 3, b), { grade: g }) },
  NS4: { form: 'nightstand', plan: () => ({ split: 'y', children: [open(0), open(0)] }) },
};

const STYLE_ORDER = ['midcentury', 'shaker', 'industrial', 'modern'];

function weightTable(rows) {
  const out = {};
  for (const [id, form, ...weights] of rows) {
    out[form] ??= Object.fromEntries(STYLE_ORDER.map((style) => [style, {}]));
    STYLE_ORDER.forEach((style, i) => {
      out[form][style][id] = weights[i];
    });
  }
  return out;
}

export const TEMPLATE_WEIGHTS = weightTable([
  ['SB1', 'sideboard', 0.25, 0.3, 0.1, 0.15],
  ['SB2', 'sideboard', 0.15, 0.35, 0.15, 0.1],
  ['SB3', 'sideboard', 0.25, 0.15, 0.1, 0.3],
  ['SB4', 'sideboard', 0.25, 0.05, 0.1, 0.15],
  ['SB5', 'sideboard', 0.1, 0.15, 0.25, 0.2],
  ['SB6', 'sideboard', 0, 0, 0.3, 0.1],
  ['TV1', 'tv', 0.25, 0.3, 0.15, 0.25],
  ['TV2', 'tv', 0.2, 0.15, 0.1, 0.3],
  ['TV3', 'tv', 0.25, 0.2, 0.15, 0.15],
  ['TV4', 'tv', 0.05, 0.05, 0.4, 0.05],
  ['TV5', 'tv', 0.25, 0.3, 0.2, 0.25],
  ['LD1', 'lowDresser', 0.25, 0.2, 0.2, 0.35],
  ['LD2', 'lowDresser', 0.3, 0.15, 0.25, 0.25],
  ['LD3', 'lowDresser', 0.15, 0.45, 0.15, 0.1],
  ['LD4', 'lowDresser', 0.3, 0.2, 0.1, 0.3],
  ['LD5', 'lowDresser', 0, 0, 0.3, 0],
  ['TC1', 'tallChest', 0.35, 0.3, 0.3, 0.5],
  ['TC2', 'tallChest', 0.35, 0.5, 0.2, 0.3],
  ['TC3', 'tallChest', 0.3, 0.2, 0.1, 0.2],
  ['TC4', 'tallChest', 0, 0, 0.4, 0],
  ['NS1', 'nightstand', 0.4, 0.3, 0.25, 0.3],
  ['NS2', 'nightstand', 0.15, 0.35, 0.15, 0.15],
  ['NS3', 'nightstand', 0.4, 0.35, 0.2, 0.45],
  ['NS4', 'nightstand', 0.05, 0, 0.4, 0.1],
]);
