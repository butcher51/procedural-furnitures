const lerp = (a, b, t) => a + (b - a) * t;
const pickInt = (lo, hi, t) => Math.min(hi, lo + Math.floor(t * (hi - lo + 1)));
const doors = (hinge = 'auto') => ({ leaf: 'doors', hinge });
const drawers = (count, extra = {}) => ({ leaf: 'drawers', count, ...extra });
const open = (shelves = 0) => ({ leaf: 'open', shelves });
const bays = (k, make) => Array.from({ length: k }, make);

export const FORMS = {
  sideboard: { width: [1.2, 1.95], body: [0.45, 0.72], base: [0.05, 0.3] },
  tv: { width: [1.2, 1.95], body: [0.24, 0.5], base: [0.05, 0.25] },
  lowDresser: { width: [0.9, 1.6], body: [0.55, 0.85], base: [0.05, 0.22] },
  tallChest: { width: [0.7, 1.0], body: [0.85, 1.3], base: [0.05, 0.15] },
  nightstand: { width: [0.4, 0.6], body: [0.26, 0.55], base: [0.05, 0.26] },
};

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

export const CABINET_STYLES = {
  midcentury: (u) => ({ opts: { construction: u < 0.9 ? 'overlay' : 'inset', gap: lerp(0.003, 0.006, u), grainMode: 'continuous' }, grade: lerp(1, 1.12, u) }),
  shaker: (u) => ({ opts: { construction: u < 0.25 ? 'overlay' : 'inset', gap: lerp(0.003, 0.006, u), reveal: lerp(0.002, 0.003, u), frameWidth: lerp(0.016, 0.025, u) }, grade: lerp(1.08, 1.22, u) }),
  industrial: (u) => ({ opts: { construction: u < 0.7 ? 'overlay' : 'inset', gap: lerp(0.003, 0.006, u) }, grade: 1 }),
  modern: (u) => ({ opts: { construction: 'overlay', gap: lerp(0.004, 0.008, u), grainMode: u < 0.5 ? 'continuous' : 'classic' }, grade: 1 }),
};

export function cabinetCase(templateId, style, r) {
  const template = CABINET_TEMPLATES[templateId];
  const form = FORMS[template.form];
  const width = lerp(...form.width, r.next());
  const body = lerp(...form.body, r.next());
  const y0 = lerp(...form.base, r.next());
  const slots = Array.from({ length: 6 }, () => r.next());
  const { opts, grade } = CABINET_STYLES[style](r.next());
  const edge = 0.002;
  const field = { x0: -width / 2 + edge, x1: width / 2 - edge, y0: y0 + edge, y1: y0 + body - edge, z: 0.22 };
  const fallback = template.form === 'nightstand' ? { leaf: 'drawers', count: 2 } : { leaf: 'doors', hinge: 'auto' };
  return { plan: template.plan(slots, grade, width), field, opts: { ...opts, fallback } };
}

const PEDESTAL_OPTS = { maxDrawerH: 0.46, maxFronts: 6 };

export const DESK_PLANS = {
  apronRow: { plan: (across = 3) => ({ leaf: 'drawers', count: 1, across }), opts: { minDrawerH: 0.05, maxDrawerH: 0.12, minDrawerW: 0.22 }, field: { x0: -0.5, x1: 0.5, y0: 0.6, y1: 0.7, z: 0.27 } },
  three: { plan: () => drawers(3, { grade: 1 }), opts: PEDESTAL_OPTS, field: { x0: -0.2, x1: 0.2, y0: 0.08, y1: 0.7, z: 0.3 } },
  graduated4: { plan: () => drawers(4, { grade: 1.15 }), opts: PEDESTAL_OPTS, field: { x0: -0.2, x1: 0.2, y0: 0.08, y1: 0.7, z: 0.3 } },
  boxFile: { plan: () => ({ split: 'y', weights: [1, 2.1], children: [drawers(1), drawers(1)] }), opts: PEDESTAL_OPTS, field: { x0: -0.2, x1: 0.2, y0: 0.08, y1: 0.7, z: 0.3 } },
  twoBoxFile: { plan: () => ({ split: 'y', weights: [2, 2.3], children: [drawers(2), drawers(1)] }), opts: PEDESTAL_OPTS, field: { x0: -0.2, x1: 0.2, y0: 0.08, y1: 0.7, z: 0.3 } },
  drawerDoor: { plan: (hinge = 'left') => ({ split: 'y', weights: [1, 3.2], children: [drawers(1), doors(hinge)] }), opts: PEDESTAL_OPTS, field: { x0: -0.2, x1: 0.2, y0: 0.08, y1: 0.7, z: 0.3 } },
  hung: { plan: (count = 3) => drawers(count), opts: { minDrawerH: 0.08, maxDrawerH: 0.2 }, field: { x0: -0.2, x1: 0.2, y0: 0.38, y1: 0.72, z: 0.3 } },
  centre: { plan: () => drawers(1), opts: { minDrawerH: 0.05, maxDrawerH: 0.1, maxDrawerW: 1.0 }, field: { x0: -0.35, x1: 0.35, y0: 0.64, y1: 0.72, z: 0.3 } },
};
