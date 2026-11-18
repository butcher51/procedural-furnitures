import { FRAME_COLORS, hsl, pickLeather, pickWood } from '../../core/color.js';
import { PAINTS, capSaturation, harmoniousSecondary, paintColor, shade, swatch } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp, lerp } from '../../core/math.js';
import {
  KNEE_MIN, PEDESTAL_SETBACK, addonBack, drawerTotals, hasFronts, kneeSpan, laptopFootprint, legPlan, riserWidth, stackFootprint,
  topMargin,
} from './layout.js';

export const STYLE_WEIGHTS = { writing: 0.24, pedestal: 0.28, trestle: 0.16, standing: 0.18, panel: 0.14 };

const at = (u) => ({ next: () => u });
const pickU = (u, weights) => weightedPick(at(u), weights);
const mm = (v) => Math.round(v * 1000) / 1000;

const WIDTH = { writing: [0.9, 1.3], pedestal: [1.4, 1.8], trestle: [1.3, 1.8], standing: [1.0, 1.6], panel: [1.0, 1.6] };
const DEPTH = { writing: [0.5, 0.65], pedestal: [0.65, 0.8], trestle: [0.62, 0.75], standing: [0.6, 0.8], panel: [0.55, 0.75] };
const THICKNESS = { writing: [0.018, 0.028], pedestal: [0.025, 0.04], trestle: [0.035, 0.05], standing: [0.022, 0.03], panel: [0.03, 0.05] };
const ADDON_WEIGHTS = {
  writing: { none: 0.55, rail: 0.25, riser: 0.2 },
  pedestal: { none: 0.75, rail: 0.15, riser: 0.1 },
  trestle: { none: 0.8, rail: 0, riser: 0.2 },
  standing: { none: 0.65, rail: 0, riser: 0.35 },
  panel: { none: 0.75, rail: 0, riser: 0.25 },
};
const INLAY_CHANCE = { writing: 0.3, pedestal: 0.25 };

function generateTop(g, style) {
  return g.roll('top', (r) => {
    const [uMode, uW, uD, uH, uT, uE, uSoft, uExp, uAdd, uAH, uAD, uInlay, uInset, uClutter] = Array.from({ length: 14 }, () => r.next());
    const heightMode = style === 'standing' ? pickU(uMode, { sit: 0.45, stand: 0.55 }) : 'sit';
    const topWidth = lerp(WIDTH[style], uW);
    const topDepth = Math.min(lerp(DEPTH[style], uD), 0.6 * topWidth);
    const topHeight = heightMode === 'stand' ? lerp([1.0, 1.18], uH) : lerp([0.72, 0.76], uH);
    const topThickness = lerp(THICKNESS[style], uT);
    const topEdge = lerp([0.003, 0.012], uE);
    const topExponent = (style === 'standing' || style === 'trestle') && uSoft < 0.25 ? lerp([5, 8], uExp) : 10;
    const topAddon = pickU(uAdd, ADDON_WEIGHTS[style]);
    const addonHeight = topAddon === 'rail' ? lerp([0.04, 0.08], uAH) : topAddon === 'riser' ? lerp([0.09, 0.15], uAH) : 0;
    const addonDepth = topAddon === 'rail' ? lerp([0.018, 0.022], uAD) : topAddon === 'riser' ? Math.min(lerp([0.2, 0.26], uAD), 0.4 * topDepth) : 0;
    const inlayInset0 = lerp([0.04, 0.08], uInset);
    const inlayDepth = topDepth - 2 * inlayInset0 - (topAddon === 'none' ? 0 : addonDepth + 0.02);
    const inlay = uInlay < (INLAY_CHANCE[style] ?? 0) && inlayDepth >= 0.25;
    const inlayInset = inlay ? inlayInset0 : 0;
    return {
      heightMode, topWidth, topDepth, topHeight, topThickness, topEdge, topExponent, topAddon, addonHeight, addonDepth,
      inlay, inlayInset, clutter: uClutter < 0.4,
    };
  });
}

const BASE_DRAWS = [
  'layout', 'side', 'pw', 'ph', 'pd', 'po', 'poFlush', 'base', 'baseH', 'ct', 'end', 'modesty', 'modestyH', 'profile', 'legT', 'sides',
  'taper', 'splay', 'overhang', 'apronH', 'apronT', 'stretch', 'stretchH', 'stretchT', 'tKind', 'tInset', 'foot', 'footH', 'beam',
  'post', 'cleat', 'tStretch', 'backRail', 'railH', 'fInset', 'colW', 'colD', 'stages', 'colZ', 'ffH', 'ffW', 'barH', 'control', 'panelT',
  'waterfall', 'panelInset', 'panelDepth', 'panelCut', 'panelCutH',
];

const NEUTRAL_BASE = {
  supportKind: 'legs', pedestalLayout: 'none', pedestalSide: 'none', pedestalWidth: 0, pedestalHeight: 0, pedestalDepth: 0,
  pedestalOverhang: 0, pedestalBase: 'none', pedestalBaseHeight: 0, endSupport: 'none', modestyPanel: false, modestyHeight: 0,
  legCount: 0, legProfile: 'straight', legThickness: 0, legSides: 0, legTaper: 1, legSplay: 0, overhang: 0, apronHeight: 0,
  stretcher: 'none', stretcherHeight: 0, stretcherThickness: 0, trestleKind: 'none', trestleInset: 0, footLength: 0, footHeight: 0,
  beamWidth: 0, postDepth: 0, cleatHeight: 0, trestleStretcherHeight: 0, trestleBackRail: false, trestleRailHeight: 0, frameInset: 0, columnWidth: 0,
  columnDepth: 0, columnStages: 0, columnZ: 0, frameFootLength: 0, frameFootHeight: 0, frameFootWidth: 0, crossbarHeight: 0,
  controlBox: false, waterfall: false, panelThickness: 0, panelInset: 0, panelDepth: 0, panelCut: 'none', panelCutHeight: 0,
};

function legFields(u, weights, thicknessRange, overhang, legHeight) {
  const legProfile = pickU(u.profile, weights);
  const legThickness = legProfile === 'turned' ? lerp([0.05, 0.06], u.legT) : lerp(thicknessRange, u.legT);
  const legSides = legProfile === 'turned' ? 8 : pickU(u.sides, [[4, 0.55], [6, 0.2], [8, 0.25]]);
  const legTaper = legProfile === 'tapered' ? lerp([0.5, 0.75], u.taper) : legProfile === 'splayed' ? lerp([0.55, 0.8], u.taper) : 1;
  let legSplay = 0;
  if (legProfile === 'splayed') {
    legSplay = Math.max(0, Math.min(lerp([0.02, 0.05], u.splay), 0.1 * legHeight, overhang + 0.6 * legThickness - 0.5 * legThickness * legTaper - 0.002));
  }
  return { legProfile, legThickness, legSides, legTaper, legSplay };
}

function cutFields(u, weights) {
  const panelCut = pickU(u.panelCut, weights);
  return {
    panelCut,
    panelCutHeight: panelCut === 'notch' ? lerp([0.04, 0.08], u.panelCutH) : panelCut === 'arch' ? lerp([0.1, 0.2], u.panelCutH) : 0,
  };
}

function floorPedestal(u, W, D, L, po, panelThickness) {
  const pedestalBase = pickU(u.base, { plinth: 0.35, feet: 0.2, flush: 0.25, legs: 0.2 });
  const pedestalBaseHeight = {
    plinth: lerp([0.06, 0.1], u.baseH), feet: lerp([0.04, 0.08], u.baseH), legs: lerp([0.1, 0.18], u.baseH), flush: 0,
  }[pedestalBase];
  return {
    pedestalBase,
    pedestalBaseHeight,
    pedestalHeight: L - pedestalBaseHeight,
    pedestalDepth: D - 2 * PEDESTAL_SETBACK,
    pedestalOverhang: po,
    panelThickness,
  };
}

function pedestalBase(u, t, L) {
  const { topWidth: W, topDepth: D } = t;
  const out = { supportKind: 'pedestals' };
  let layout = pickU(u.layout, { double: 0.4, single: 0.35, hung: 0.25 });
  const po = u.poFlush < 0.4 ? 0 : lerp([0, 0.05], u.po);
  const overhang = Math.min(lerp([0.02, 0.08], u.overhang), 0.15 * D);
  if (layout === 'hung') {
    const legT = lerp([0.035, 0.055], u.legT);
    if (W - 2 * overhang - 2.2 * legT - KNEE_MIN < 0.3) layout = 'single';
  }
  if (layout === 'double' && (W - KNEE_MIN - 2 * po) / 2 < 0.34) layout = 'single';
  const apronRange = [0.05, 0.08];
  if (layout === 'hung') {
    const legs = legFields(u, { straight: 0.15, tapered: 0.55, splayed: 0.3, turned: 0 }, [0.035, 0.055], overhang, L);
    const avail = W - 2 * overhang - 2.2 * legs.legThickness - KNEE_MIN;
    const pedestalWidth = Math.min(lerp([0.34, 0.44], u.pw), avail);
    return {
      ...out, ...legs, supportKind: 'legs', pedestalLayout: 'hung', pedestalSide: pickU(u.side, { left: 0.4, right: 0.6 }), pedestalWidth,
      pedestalHeight: Math.min(lerp([0.28, 0.4], u.ph), L - 0.3), pedestalDepth: D - 2 * overhang - 0.2 * legs.legThickness,
      legCount: 4, overhang, apronHeight: Math.min(lerp(apronRange, u.apronH), L - 0.61),
    };
  }
  if (layout === 'double') {
    return {
      ...out, pedestalLayout: 'double', pedestalSide: 'both', pedestalWidth: Math.min(lerp([0.36, 0.46], u.pw), (W - KNEE_MIN - 2 * po) / 2),
      ...floorPedestal(u, W, D, L, po, 0), modestyPanel: u.modesty < 0.75, modestyHeight: lerp([0.25, 0.4], u.modestyH),
    };
  }
  const endSupport = pickU(u.end, { panel: 0.55, legs: 0.45 });
  const panelThickness = lerp([0.025, 0.05], u.panelT);
  const legs = endSupport === 'legs' ? legFields(u, { straight: 0.4, tapered: 0.6, splayed: 0, turned: 0 }, [0.04, 0.06], 0, L) : {};
  const es = endSupport === 'panel' ? panelThickness : legs.legThickness;
  const cut = endSupport === 'panel' ? cutFields(u, { none: 0.7, notch: 0.3, arch: 0 }) : {};
  return {
    ...out, ...legs, ...cut, pedestalLayout: 'single', pedestalSide: pickU(u.side, { left: 0.4, right: 0.6 }), endSupport,
    pedestalWidth: Math.min(lerp([0.36, 0.46], u.pw), W - 2 * po - es - KNEE_MIN),
    ...floorPedestal(u, W, D, L, po, endSupport === 'panel' ? panelThickness : 0),
    apronHeight: endSupport === 'legs' ? Math.min(lerp(apronRange, u.apronH), L - 0.61) : 0,
    modestyPanel: u.modesty < 0.55, modestyHeight: lerp([0.25, 0.4], u.modestyH),
  };
}

function trestleBase(u, t, L) {
  const { topWidth: W, topDepth: D } = t;
  const trestleKind = pickU(u.tKind, { I: 0.45, A: 0.4, X: 0.15 });
  const beamWidth = lerp([0.06, 0.1], u.beam);
  const trestleInset = Math.max(0.08, Math.min(lerp([0.12, 0.3], u.tInset), 0.18 * W, (W - beamWidth - KNEE_MIN - 0.3) / 2));
  const fi = W / 2 - trestleInset - beamWidth / 2;
  const out = {
    supportKind: 'trestle', trestleKind, trestleInset, beamWidth,
    postDepth: trestleKind === 'I' ? lerp([0.1, 0.16], u.post) : beamWidth,
    footLength: D * lerp([0.8, 0.92], u.foot), footHeight: lerp([0.05, 0.08], u.footH), cleatHeight: lerp([0.04, 0.06], u.cleat),
    trestleStretcherHeight: trestleKind === 'X' ? 0 : Math.min(lerp([0.1, 0.2], u.tStretch), 0.215 - beamWidth / 2),
  };
  const room = 2 * fi - KNEE_MIN;
  const boxed = room >= 0.3 - 1e-6;
  const trestleBackRail = boxed ? u.backRail < 0.5 : true;
  const trestleRailHeight = lerp(boxed ? [0.14, 0.24] : [0.2, 0.3], u.railH);
  if (!boxed) return { ...out, trestleBackRail, trestleRailHeight };
  return {
    ...out, trestleBackRail, trestleRailHeight, pedestalLayout: 'box', pedestalSide: pickU(u.side, { left: 0.4, right: 0.6 }), pedestalWidth: Math.min(lerp([0.34, 0.48], u.pw), room),
    pedestalHeight: lerp([0.1, 0.14], u.ph), pedestalDepth: Math.min(lerp([0.85, 0.92], u.pd) * D, D - 2 * PEDESTAL_SETBACK),
  };
}

function panelBase(u, t, L) {
  const { topWidth: W, topDepth: D, topThickness } = t;
  const waterfall = u.waterfall < 0.5;
  const panelThickness = waterfall ? topThickness : lerp([0.025, 0.05], u.panelT);
  const panelInset = waterfall ? 0 : lerp([0, 0.08], u.panelInset);
  const out = {
    supportKind: 'panels', waterfall, panelThickness, panelInset, panelDepth: waterfall ? 1 : lerp([0.92, 1], u.panelDepth),
    ...cutFields(u, { none: 0.6, notch: 0.2, arch: 0.2 }), modestyPanel: u.modesty < 0.4, modestyHeight: lerp([0.08, 0.14], u.modestyH),
  };
  const room = 2 * (W / 2 - panelInset - panelThickness) - KNEE_MIN;
  if (u.layout >= 0.3 || room < 0.3) return out;
  return {
    ...out, pedestalLayout: 'box', pedestalSide: pickU(u.side, { left: 0.4, right: 0.6 }), pedestalWidth: Math.min(lerp([0.34, 0.48], u.pw), room),
    pedestalHeight: lerp([0.1, 0.14], u.ph), pedestalDepth: Math.min(lerp([0.85, 0.92], u.pd) * D, D - 2 * PEDESTAL_SETBACK),
  };
}

function standingBase(u, t, L) {
  const { topWidth: W, topDepth: D } = t;
  const columnWidth = lerp([0.06, 0.08], u.colW);
  return {
    supportKind: 'tframe',
    frameInset: clamp(lerp([0.1, 0.22], u.fInset), 0.1, W / 2 - 0.31 - columnWidth / 2),
    columnWidth, columnDepth: lerp([0.045, 0.06], u.colD), columnStages: pickU(u.stages, [[2, 0.6], [3, 0.4]]),
    columnZ: lerp([-0.06, 0], u.colZ), frameFootLength: Math.min(Math.max(0.85 * D, 0.58), D - 0.02),
    frameFootHeight: lerp([0.03, 0.05], u.ffH), frameFootWidth: lerp([0.06, 0.08], u.ffW), crossbarHeight: lerp([0.03, 0.05], u.barH),
    controlBox: u.control < 0.7,
  };
}

function writingBase(u, t, L) {
  const { topDepth: D } = t;
  const overhang = Math.min(lerp([0.02, 0.08], u.overhang), 0.15 * D);
  const legs = legFields(u, { straight: 0.25, tapered: 0.35, splayed: 0.2, turned: 0.2 }, [0.035, 0.055], overhang, L);
  const stretcher = pickU(u.stretch, { none: 0.75, ends: 0.25 });
  return {
    supportKind: 'legs', ...legs, legCount: 4, overhang, apronHeight: Math.min(lerp([0.08, 0.11], u.apronH), L - 0.61),
    stretcher, stretcherHeight: stretcher === 'none' ? 0 : lerp([0.08, 0.16], u.stretchH),
    stretcherThickness: stretcher === 'none' ? 0 : Math.max(0.015, legs.legThickness * lerp([0.45, 0.6], u.stretchT)),
  };
}

const BASES = { writing: writingBase, pedestal: pedestalBase, trestle: trestleBase, standing: standingBase, panel: panelBase };

function generateBase(g, style, t) {
  return g.roll('base', (r) => {
    const u = {};
    for (const name of BASE_DRAWS) u[name] = r.next();
    const legHeight = t.topHeight - t.topThickness;
    const out = {
      ...NEUTRAL_BASE, legHeight, carcassThickness: lerp([0.016, 0.022], u.ct), apronThickness: lerp([0.018, 0.024], u.apronT),
      ...BASES[style](u, t, legHeight),
    };
    const [k0, k1] = kneeSpan({ ...t, ...out });
    return { ...out, kneeWidth: k1 - k0, kneeCenterX: (k0 + k1) / 2 };
  });
}

const CONSTRUCTION = { writing: { overlay: 0.6, inset: 0.4 }, pedestal: { overlay: 0.55, inset: 0.45 }, trestle: { overlay: 0.75, inset: 0.25 }, panel: { overlay: 0.75, inset: 0.25 } };
const DRAWER_STYLE = { writing: { slab: 0.85, framed: 0.15 }, pedestal: { slab: 0.55, framed: 0.45 }, trestle: { slab: 1, framed: 0 }, panel: { slab: 1, framed: 0 } };
const HANDLE_WEIGHTS = {
  writing: { knob: 0.4, bar: 0.2, tab: 0, cup: 0.1, ring: 0.3, groove: 0 },
  pedestal: { knob: 0.25, bar: 0.4, tab: 0.1, cup: 0.17, ring: 0.05, groove: 0.03 },
  trestle: { knob: 0.5, bar: 0.4, tab: 0, cup: 0.1, ring: 0, groove: 0 },
  panel: { knob: 0.5, bar: 0.4, tab: 0, cup: 0.1, ring: 0, groove: 0 },
};

const NEUTRAL_FRONTS = {
  apronDrawers: 0, stackLayout: 'none', mirrorStack: false, hungDrawers: 0, centreDrawer: false, centreDrawerHeight: 0,
  construction: 'none', drawerStyle: 'none', frontThickness: 0, gap: 0, handleKind: 'none', handleSize: 0, drawerCount: 0,
};

function handleSizeOf(kind, u) {
  if (kind === 'knob') return mm(lerp([0.022, 0.035], u));
  if (kind === 'ring') return mm(lerp([0.03, 0.045], u));
  if (kind === 'bar') return mm(lerp([0.096, 0.16], u));
  if (kind === 'tab' || kind === 'cup') return mm(lerp([0.05, 0.09], u));
  return 0;
}

function generateFronts(g, style, t, b) {
  const p0 = { style, ...t, ...b };
  return g.roll('fronts', (r) => {
    const [uApron, uStack, uMirror, uHung, uCentre, uCentreH, uCons, uDrawer, uThick, uGap, uKind, uSize] = Array.from({ length: 12 }, () => r.next());
    if (!hasFronts(p0)) return { ...NEUTRAL_FRONTS };
    const L = b.legHeight;
    let apronDrawers = 0;
    if (style === 'writing') {
      apronDrawers = pickU(uApron, [[1, 0.42], [2, 0.29], [3, 0.29]]);
      const width = 2 * legPlan(p0).inner;
      if (apronDrawers === 3 && (width - 0.012) / 3 < 0.22) apronDrawers = 2;
    }
    const floor = b.pedestalLayout === 'double' || b.pedestalLayout === 'single';
    let stackLayout = 'none';
    if (floor) {
      stackLayout = pickU(uStack, { three: 0.3, graduated4: 0.2, boxFile: 0.18, twoBoxFile: 0.2, drawerDoor: 0.12 });
      if (L - b.pedestalBaseHeight < 0.5) stackLayout = 'three';
    }
    const mirrorStack = b.pedestalLayout === 'double' ? uMirror < 0.7 : false;
    const hungDrawers = b.pedestalLayout === 'hung' ? pickU(uHung, [[2, 0.6], [3, 0.4]]) : b.pedestalLayout === 'box' ? 1 : 0;
    const centreChance = b.pedestalLayout === 'double' ? 0.55 : b.pedestalLayout === 'single' ? 0.25 : 0;
    const centreDrawer = uCentre < centreChance;
    const centreDrawerHeight = centreDrawer ? Math.min(lerp([0.06, 0.09], uCentreH), L - 0.61) : 0;
    const construction = pickU(uCons, CONSTRUCTION[style]);
    let drawerStyle = pickU(uDrawer, DRAWER_STYLE[style]);
    let handleKind = pickU(uKind, HANDLE_WEIGHTS[style]);
    if (handleKind === 'tab' && (b.pedestalLayout === 'hung' || b.pedestalLayout === 'box')) handleKind = 'knob';
    if (b.pedestalLayout === 'double' && drawerStyle === 'framed' && handleKind === 'bar' && stackLayout === 'graduated4') stackLayout = 'three';
    const out = {
      apronDrawers, stackLayout, mirrorStack, hungDrawers, centreDrawer, centreDrawerHeight, construction, drawerStyle,
      frontThickness: lerp([0.016, 0.022], uThick), gap: lerp([0.003, 0.006], uGap), handleKind, handleSize: handleSizeOf(handleKind, uSize),
      drawerCount: 0,
    };
    const totals = drawerTotals({ ...p0, ...out });
    if (totals.drawers + totals.doors === 0) return { ...out, handleKind: 'none', handleSize: 0, drawerCount: 0 };
    return { ...out, drawerCount: totals.drawers };
  });
}

function generatePalette(g) {
  return g.roll('palette', (r) => {
    const paint = paintColor(r);
    const leather = pickLeather(r).hex;
    const cool = paint.h > 0.45 && paint.h < 0.95;
    return { paint: paint.hex, inlayColor: cool ? shade(paint, -0.3, 0.6).hex : leather };
  });
}

const TOP_FINISH = {
  writing: { wood: 0.8, painted: 0.2 }, pedestal: { wood: 0.8, painted: 0.2 }, trestle: { wood: 0.95, painted: 0.05 },
  standing: { wood: 0.6, painted: 0.4 }, panel: { wood: 0.65, painted: 0.35 },
};

function bodyWeights(p) {
  if (p.style === 'writing') return { wood: 0.7, painted: 0.2, black: 0.1 };
  if (p.style === 'pedestal') return p.pedestalLayout === 'hung' ? { wood: 0.6, black: 0.25, painted: 0.15 } : { wood: 0.55, painted: 0.3, white: 0.1, black: 0.05 };
  if (p.style === 'trestle') return { wood: 0.75, black: 0.15, painted: 0.1 };
  if (p.style === 'standing') return { black: 0.45, white: 0.2, metal: 0.35 };
  return p.waterfall ? { top: 1 } : { wood: 0.4, painted: 0.3, black: 0.2, white: 0.1 };
}

const HARDWARE_WEIGHTS = {
  soft: { match: 0.12, black: 0.3, brass: 0.35, metal: 0.23 },
  hard: { match: 0.04, black: 0.37, brass: 0.27, metal: 0.32 },
};

const lightness = (hex) => swatch(hex).l;

function generateFinish(g, p) {
  const f = g.roll('finish', (r) => ({ uTop: r.next(), wood: pickWood(r), uGrain: r.next(), uBody: r.next(), uFront: r.next(), uHardware: r.next() }));
  const topFinish = pickU(f.uTop, TOP_FINISH[p.style]);
  let bodyMode = pickU(f.uBody, bodyWeights(p));
  const { wood } = f;
  const woodHex = (dl) => hsl(wood.h, wood.s, wood.l + dl);
  let topColor = topFinish === 'wood' ? woodHex(0) : p.paint;
  if (bodyMode === 'white' && topFinish === 'painted' && Math.abs(lightness(topColor) - lightness(FRAME_COLORS.white)) < 0.12) bodyMode = 'black';
  if (topFinish === 'painted' && bodyMode === 'painted') topColor = harmoniousSecondary(swatch(p.paint), 'white').hex;
  const woodUsed = topFinish === 'wood' || bodyMode === 'wood';
  const bodyColor = {
    wood: () => woodHex(-0.04),
    painted: () => p.paint,
    black: () => FRAME_COLORS.black,
    white: () => FRAME_COLORS.white,
    metal: () => FRAME_COLORS.metal,
    top: () => topColor,
  }[bodyMode]();
  const grain = woodUsed ? pickU(f.uGrain, { fine: 0.3, plain: 0.45, bold: 0.25 }) : 'none';
  const fronted = p.drawerCount + (p.stackLayout === 'drawerDoor' ? 1 : 0) > 0;
  let frontMode = 'none';
  if (fronted) frontMode = bodyMode === 'top' || bodyColor === topColor ? 'body' : pickU(f.uFront, { body: 0.65, top: 0.35 });
  let hardwareMode = 'none';
  if (fronted && p.handleKind !== 'groove' && p.handleKind !== 'none') {
    const soft = p.handleKind === 'knob' || p.handleKind === 'tab' || p.handleKind === 'ring';
    hardwareMode = pickU(f.uHardware, soft ? HARDWARE_WEIGHTS.soft : HARDWARE_WEIGHTS.hard);
  }
  const frontColor = frontMode === 'top' ? topColor : bodyColor;
  const hardwareColor = {
    none: () => null,
    match: () => frontColor,
    black: () => FRAME_COLORS.black,
    metal: () => FRAME_COLORS.metal,
    brass: () => capSaturation(0.11, 0.5, 0.5).hex,
  }[hardwareMode]();
  return { topFinish, woodName: woodUsed ? wood.name : null, grain, bodyMode, frontMode, hardwareMode, topColor, bodyColor, hardwareColor };
}

const CUP_PAINTS = PAINTS.filter((c) => ['cream', 'putty', 'charcoal', 'terracotta', 'sage', 'slate blue'].includes(c.name));

function cupColour(r) {
  const paint = CUP_PAINTS[Math.floor(r.next() * CUP_PAINTS.length)];
  const h = paint.h + r.range(-0.012, 0.012);
  const l = paint.l + r.range(-0.04, 0.04);
  return capSaturation(h, paint.s, l).hex;
}

const NEUTRAL_PROPS = {
  propSet: 'none', laptopColor: null, bookColors: [], cupColor: null, laptopSize: { w: 0, d: 0, h: 0 }, laptopX: 0, laptopYaw: 0,
  bookCount: 0, bookSizes: [], cupRadius: 0, cupHeight: 0, propSide: 'none', booksOnRiser: false,
};

const PROP_SETS = [
  ['laptop', 0.15], ['books', 0.15], ['cup', 0.05], ['laptop+books', 0.2], ['laptop+cup', 0.15], ['books+cup', 0.15], ['all', 0.15],
];

function generateProps(g, t) {
  return g.roll('props', (r) => {
    const uSet = r.next();
    const laptopColor = FRAME_COLORS[pickU(r.next(), { metal: 0.55, black: 0.3, white: 0.15 })];
    const bookColors = [paintColor(r).hex, paintColor(r).hex];
    const cupColor = cupColour(r);
    const [lw, ld, lh, lx, ly] = Array.from({ length: 5 }, () => r.next());
    const bookCount = r.int(2, 4);
    const books = Array.from({ length: 4 }, () => {
      const [w, h, d, yaw] = [r.next(), r.next(), r.next(), r.next()];
      return { w: mm(lerp([0.02, 0.045], w)), h: mm(lerp([0.15, 0.24], h)), d: mm(lerp([0.11, 0.17], d)), yaw: mm(lerp([-10, 10], yaw)) };
    });
    const [uCupR, uCupH, uSide] = [r.next(), r.next(), r.next()];
    if (!t.clutter) return { ...NEUTRAL_PROPS, bookColors: [], laptopSize: { ...NEUTRAL_PROPS.laptopSize } };
    const propSide = uSide < 0.5 ? 'left' : 'right';
    const availD = t.topDepth - 2 * topMargin(t) - addonBack(t);
    let laptopYaw = mm(lerp([-12, 12], ly));
    const laptopSize = { w: mm(lerp([0.3, 0.36], lw)), d: mm(lerp([0.21, 0.24], ld)), h: mm(lerp([0.015, 0.02], lh)) };
    if (laptopFootprint(laptopSize, laptopYaw).d > availD) laptopYaw = 0;
    laptopSize.d = mm(Math.min(laptopSize.d, availD - 0.002));
    const bookSizes = books.slice(0, bookCount);
    const fp = stackFootprint(bookSizes);
    const booksOnRiser = t.topAddon === 'riser' && t.heightMode === 'sit' && (uSide * 2) % 1 < 0.4 && fp.w <= riserWidth(t) - 0.1 && fp.d <= t.addonDepth - 0.014;
    return {
      propSet: pickU(uSet, PROP_SETS), laptopColor, bookColors, cupColor, laptopSize, laptopX: mm(lerp([-0.15, 0.15], lx) * t.topWidth), laptopYaw,
      bookCount, bookSizes, cupRadius: mm(lerp([0.03, 0.04], uCupR)), cupHeight: mm(lerp([0.08, 0.11], uCupH)), propSide, booksOnRiser,
    };
  });
}

export function generateDeskParams(g) {
  const style = rollStyle(g, STYLE_WEIGHTS);
  const top = generateTop(g, style);
  const base = generateBase(g, style, top);
  const fronts = generateFronts(g, style, top, base);
  const palette = generatePalette(g);
  const finish = generateFinish(g, { style, ...top, ...base, ...fronts, ...palette });
  const props = generateProps(g, top);
  return { seed: g.seed, type: 'desk', style, ...top, ...base, ...fronts, ...palette, ...finish, ...props };
}
