import { solveFronts } from '../../core/fronts.js';

const drawers = (count, extra = {}) => ({ leaf: 'drawers', count, ...extra });

export const STACK_PLANS = {
  three: () => drawers(3, { grade: 1 }),
  graduated4: () => drawers(4, { grade: 1.15 }),
  boxFile: () => ({ split: 'y', weights: [1, 2.1], children: [drawers(1), drawers(1)] }),
  twoBoxFile: () => ({ split: 'y', weights: [2, 2.3], children: [drawers(2), drawers(1)] }),
  drawerDoor: (hinge) => ({ split: 'y', weights: [1, 3.2], children: [drawers(1), { leaf: 'doors', hinge }] }),
};

const PEDESTAL_OPTS = { maxDrawerH: 0.46, maxFronts: 6 };
const BOX_OPTS = { minDrawerH: 0.06, maxDrawerH: 0.2 };
const CENTRE_OPTS = { minDrawerH: 0.05, maxDrawerH: 0.1, maxDrawerW: 3 };
const APRON_OPTS = { minDrawerH: 0.05, maxDrawerH: 0.12, minDrawerW: 0.22, maxDrawerW: 3 };

export const KNEE_MIN = 0.62;
export const PEDESTAL_SETBACK = 0.032;
export const SHELF_THICKNESS = 0.02;
export const POST_WIDTH = 0.03;

export const sideSign = (side) => (side === 'left' ? -1 : 1);

export function legPlan(p) {
  const t = p.legThickness;
  const lx = p.topWidth / 2 - p.overhang - 0.6 * t;
  const zl = p.topDepth / 2 - p.overhang - 0.6 * t;
  return { lx, zl, zFront: zl + t / 2, inner: lx - t / 2, anchors: [[lx, zl], [-lx, zl], [-lx, -zl], [lx, -zl]] };
}

export const columnX = (p) => p.topWidth / 2 - p.frameInset;
export const frameX = (p) => p.topWidth / 2 - p.trestleInset;
export const panelInner = (p) => p.topWidth / 2 - p.panelInset - p.panelThickness;

export function floorPedestals(p) {
  if (p.pedestalLayout !== 'double' && p.pedestalLayout !== 'single') return [];
  const sides = p.pedestalLayout === 'double' ? [-1, 1] : [sideSign(p.pedestalSide)];
  return sides.map((s) => ({ side: s, name: s < 0 ? 'left' : 'right', x: s * (p.topWidth / 2 - p.pedestalOverhang - p.pedestalWidth / 2) }));
}

export const endSupportWidth = (p) => (p.endSupport === 'panel' ? p.panelThickness : p.legThickness);

export function clearSpan(p) {
  if (p.supportKind === 'legs') {
    const f = legPlan(p).inner;
    return [-f, f];
  }
  if (p.supportKind === 'tframe') {
    const f = columnX(p) - p.columnWidth / 2;
    return [-f, f];
  }
  if (p.supportKind === 'trestle') {
    const f = frameX(p) - p.beamWidth / 2;
    return [-f, f];
  }
  if (p.supportKind === 'panels') {
    const f = panelInner(p);
    return [-f, f];
  }
  const edge = p.topWidth / 2 - p.pedestalOverhang;
  if (p.pedestalLayout === 'double') {
    const f = edge - p.pedestalWidth;
    return [-f, f];
  }
  const free = edge - endSupportWidth(p);
  const near = edge - p.pedestalWidth;
  return sideSign(p.pedestalSide) > 0 ? [-free, near] : [-near, free];
}

export function kneeSpan(p) {
  const [x0, x1] = clearSpan(p);
  if (p.pedestalLayout !== 'hung' && p.pedestalLayout !== 'box') return [x0, x1];
  return sideSign(p.pedestalSide) > 0 ? [x0, x1 - p.pedestalWidth] : [x0 + p.pedestalWidth, x1];
}

export function boxCentreX(p) {
  const [x0, x1] = clearSpan(p);
  const s = sideSign(p.pedestalSide);
  return (s > 0 ? x1 : x0) + s * (0.002 - p.pedestalWidth / 2);
}

export function carcassField({ width, y0, y1, depth, panel, construction, edge = 0.002, x = 0 }) {
  if (construction === 'inset') {
    const inner = width / 2 - panel;
    return { x0: x - inner, x1: x + inner, y0: y0 + panel, y1, z: depth / 2 };
  }
  return { x0: x - width / 2 + edge, x1: x + width / 2 - edge, y0: y0 + edge, y1: y1 - edge, z: depth / 2 };
}

export function carcassOpening({ width, y0, y1, panel, x = 0 }) {
  const inner = width / 2 - panel;
  return { x0: x - inner, x1: x + inner, y0: y0 + panel, y1 };
}

function baseOpts(p) {
  return {
    construction: p.construction,
    gap: p.gap,
    reveal: 0.002 + (p.gap - 0.003) / 3,
    thickness: p.frontThickness,
    frameWidth: 0.012,
    fallback: { leaf: 'drawers', count: 1 },
  };
}

export function carcassSpec(p, kind, x) {
  const base = { panel: p.carcassThickness, construction: p.construction, frontThickness: p.frontThickness, x, width: p.pedestalWidth, depth: p.pedestalDepth };
  const L = p.legHeight;
  if (kind === 'floor') return { ...base, y0: p.pedestalBaseHeight, y1: L };
  return { ...base, y0: L - p.pedestalHeight, y1: L };
}

export function stackOf(p, index) {
  if (p.pedestalLayout !== 'double' || index === 0 || p.mirrorStack) return p.stackLayout;
  return p.stackLayout === 'three' ? 'twoBoxFile' : 'three';
}

export function frontRegions(p) {
  const regions = [];
  const L = p.legHeight;
  const o = baseOpts(p);
  const add = (id, plan, field, opts, extra = {}) => {
    regions.push({ id, layout: solveFronts(plan, field, { ...o, ...opts }), ...extra });
  };
  if (p.style === 'writing' && p.apronDrawers > 0) {
    const leg = legPlan(p);
    add('apron', { leaf: 'drawers', count: 1, across: p.apronDrawers }, { x0: -leg.inner, x1: leg.inner, y0: L - p.apronHeight, y1: L, z: leg.zFront }, APRON_OPTS, { backers: false, members: false });
  }
  floorPedestals(p).forEach((ped) => {
    const spec = carcassSpec(p, 'floor', ped.x);
    const plan = STACK_PLANS[stackOf(p, ped.side < 0 ? 0 : 1)](ped.name);
    add(`pedestal-${ped.name}`, plan, carcassField(spec), PEDESTAL_OPTS, { carcass: spec, opening: carcassOpening(spec), backers: true, members: true });
  });
  if (p.pedestalLayout === 'hung' || p.pedestalLayout === 'box') {
    const spec = carcassSpec(p, 'box', boxCentreX(p));
    const count = p.pedestalLayout === 'hung' ? p.hungDrawers : 1;
    add('box', { leaf: 'drawers', count }, carcassField(spec), BOX_OPTS, { carcass: spec, opening: carcassOpening(spec), backers: true, members: true });
  }
  if (p.centreDrawer) {
    const [x0, x1] = clearSpan(p);
    add('centre', { leaf: 'drawers', count: 1 }, { x0, x1, y0: L - p.centreDrawerHeight, y1: L, z: p.pedestalDepth / 2 }, CENTRE_OPTS, { backers: true, members: true });
  }
  return regions;
}

export function drawerTotals(p) {
  const out = { drawers: 0, doors: 0, perRegion: [] };
  for (const region of frontRegions(p)) {
    const { drawers: d, doors } = region.layout.stats;
    out.drawers += d;
    out.doors += doors;
    out.perRegion.push({ id: region.id, drawers: d, doors });
  }
  return out;
}

export const hasFronts = (p) => p.style === 'writing' || p.pedestalLayout !== 'none';

export const topMargin = (p) => 0.03 + 0.016 * (10 - p.topExponent);
export const addonBack = (p) => (p.topAddon === 'none' ? 0 : p.addonDepth + 0.02);
export const riserWidth = (p) => Math.min(0.6 * p.topWidth, 0.9);
export const riserShelfTop = (p) => p.topHeight + p.addonHeight + SHELF_THICKNESS;
export const wingLength = (p) => 0.12 + ((p.addonHeight - 0.04) / 0.04) * 0.06;

const rad = (deg) => (deg * Math.PI) / 180;

export function stackFootprint(sizes) {
  let w = 0;
  let d = 0;
  let h = 0;
  for (const b of sizes) {
    const a = rad(Math.abs(b.yaw));
    w = Math.max(w, b.h * Math.cos(a) + b.d * Math.sin(a));
    d = Math.max(d, b.d * Math.cos(a) + b.h * Math.sin(a));
    h += b.w;
  }
  return { w, d, h };
}

export function laptopFootprint(size, yawDeg) {
  const a = rad(Math.abs(yawDeg));
  return { w: size.w * Math.cos(a) + size.d * Math.sin(a), d: size.d * Math.cos(a) + size.w * Math.sin(a) };
}

export function propSetOf(p) {
  if (!p.clutter || p.propSet === 'none') return { laptop: false, books: false, cup: false };
  if (p.propSet === 'all') return { laptop: true, books: true, cup: true };
  const parts = p.propSet.split('+');
  return { laptop: parts.includes('laptop'), books: parts.includes('books'), cup: parts.includes('cup') };
}

export function propPlan(p) {
  const set = propSetOf(p);
  const plans = [];
  const W = p.topWidth;
  const D = p.topDepth;
  const H = p.topHeight;
  const m = topMargin(p);
  const backLimit = -D / 2 + m + addonBack(p);
  const pad = 0.001;
  const left = p.propSide === 'left';
  const zone = (id, x0, x1, y, clear, zc, depth) => ({
    id, x0, x1, y, clear, zBack: zc - depth / 2 - pad, zFront: zc + depth / 2 + pad, back: false, top: true,
  });
  const obstacles = [];
  if (set.books && p.bookSizes.length) {
    const fp = stackFootprint(p.bookSizes);
    const sorted = [...p.bookSizes].sort((a, b) => b.h * b.d - a.h * a.d);
    const records = [{ k: 's', x: pad, books: sorted.map((b, i) => ({ w: b.w, h: b.h, d: b.d, c: i % 2, yaw: b.yaw })) }];
    let x0;
    let y = H;
    let zc;
    if (p.booksOnRiser) {
      const rw = riserWidth(p);
      x0 = left ? -rw / 2 + 0.04 : rw / 2 - 0.04 - fp.w - 2 * pad;
      y = riserShelfTop(p);
      zc = -D / 2 + 0.03 + p.addonDepth / 2;
    } else {
      x0 = left ? -W / 2 + m : W / 2 - m - fp.w - 2 * pad;
      zc = backLimit + fp.d / 2 + pad;
    }
    const s = zone('books', x0, x0 + fp.w + 2 * pad, y, fp.h + 0.01, zc, fp.d);
    plans.push({ kind: 'books', surface: s, records });
    if (!p.booksOnRiser) obstacles.push(s);
  }
  if (set.cup) {
    const size = p.cupRadius * 2;
    const x0 = left ? W / 2 - m - size - 2 * pad : -W / 2 + m;
    const zc = backLimit + size / 2 + pad;
    const s = zone('cup', x0, x0 + size + 2 * pad, H, p.cupHeight + 0.01, zc, size);
    plans.push({ kind: 'cup', surface: s, records: [{ k: 'cup', x: pad, size, h: p.cupHeight, c: 0 }] });
    obstacles.push(s);
  }
  if (set.laptop) {
    const fp = laptopFootprint(p.laptopSize, p.laptopYaw);
    const zc = D / 2 - m - fp.d / 2 - pad;
    const zLo = zc - fp.d / 2 - pad;
    const zHi = zc + fp.d / 2 + pad;
    const lo = -W / 2 + m + fp.w / 2 + pad;
    const hi = W / 2 - m - fp.w / 2 - pad;
    const gap = 0.012;
    const half = fp.w / 2 + pad;
    const blocked = obstacles.filter((o) => o.zBack < zHi + gap && o.zFront > zLo - gap);
    const free = (cx) => blocked.every((o) => cx <= o.x0 - gap - half || cx >= o.x1 + gap + half);
    const want = Math.min(hi, Math.max(lo, p.laptopX));
    const candidates = [want, ...blocked.flatMap((o) => [o.x0 - gap - half, o.x1 + gap + half])]
      .filter((cx) => cx >= lo - 1e-9 && cx <= hi + 1e-9 && free(cx))
      .sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
    if (candidates.length) {
      const cx = candidates[0];
      const s = zone('laptop', cx - half, cx + half, H, p.laptopSize.h + 0.01, zc, fp.d);
      plans.push({
        kind: 'laptop',
        surface: s,
        records: [{ k: 'slab', x: pad, w: p.laptopSize.w, h: p.laptopSize.h, d: p.laptopSize.d, c: 0, yaw: p.laptopYaw }],
      });
    }
  }
  return plans;
}

export const propZones = (p) => propPlan(p).map((plan) => plan.surface);

export function inlayRect(p) {
  return {
    x: p.topWidth / 2 - p.inlayInset,
    zFront: p.topDepth / 2 - p.inlayInset,
    zBack: -p.topDepth / 2 + p.inlayInset + addonBack(p),
  };
}

export function columnStages(p) {
  const colTop = p.legHeight - p.crossbarHeight;
  const extra = Math.max(0, p.topHeight - 0.72);
  const n = p.columnStages;
  const vis = 0.04 + extra / (n - 1);
  const outerTop = colTop - vis * (n - 1);
  const stages = [{ y0: p.frameFootHeight, y1: outerTop, w: p.columnWidth, d: p.columnDepth }];
  let top = outerTop;
  for (let i = 1; i < n; i++) {
    const y1 = i === n - 1 ? colTop : top + vis;
    stages.push({ y0: top - 0.03, y1, w: p.columnWidth - 0.012 * i, d: p.columnDepth - 0.012 * i });
    top = y1;
  }
  return stages;
}
