import { hsl, pickWood, STONE_TONES, FRAME_COLORS } from '../../core/color.js';
import { paintColor, accentColor } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp, lerp } from '../../core/math.js';

export const STYLE_WEIGHTS = { dining: 0.3, coffee: 0.24, side: 0.16, cafe: 0.15, trestle: 0.15 };

const at = (u) => ({ next: () => u });
const pickU = (u, weights) => weightedPick(at(u), weights);

const SHAPE_WEIGHTS = {
  dining: { rect: 0.45, round: 0.2, oval: 0.15, squircle: 0.2 },
  coffee: { rect: 0.35, round: 0.25, oval: 0.2, squircle: 0.2 },
  side: { rect: 0.35, round: 0.4, squircle: 0.25 },
  cafe: { rect: 0.3, round: 0.6, squircle: 0.1 },
  trestle: { rect: 0.7, squircle: 0.3 },
};

const THICKNESS = {
  dining: [0.03, 0.05], trestle: [0.04, 0.06], coffee: [0.02, 0.06], side: [0.018, 0.035], cafe: [0.02, 0.035],
};

const HEIGHT = {
  dining: [0.72, 0.76], trestle: [0.72, 0.76], coffee: [0.35, 0.48], side: [0.5, 0.6], cafe: [0.72, 0.76],
};

function lengthRange(style, shape) {
  if (style === 'dining') return shape === 'round' ? [0.9, 1.3] : shape === 'oval' ? [1.4, 1.9] : [1.2, 1.9];
  if (style === 'coffee') return shape === 'round' ? [0.7, 1.0] : [0.9, 1.3];
  if (style === 'side') return [0.38, 0.55];
  if (style === 'cafe') return [0.6, 0.8];
  return [1.5, 2.0];
}

function generateTop(g, style) {
  return g.roll('top', (r) => {
    const [uClass, uShape, uLength, uDepth, uSquare, uThick, uEdge, uExp, uHeight, uSquircleDepth] = Array.from({ length: 10 }, () => r.next());
    const heightClass = style === 'cafe' ? pickU(uClass, { standard: 0.8, bar: 0.2 }) : 'standard';
    const topShape = pickU(uShape, SHAPE_WEIGHTS[style]);
    const round = topShape === 'round';
    const topLength = lerp(lengthRange(style, topShape), uLength);
    let topDepth;
    if (round) topDepth = topLength;
    else if (style === 'side' || style === 'cafe') {
      const square = topShape === 'rect' || uSquare < 0.3;
      topDepth = square ? topLength : topLength * lerp([0.8, 1], uSquircleDepth);
    } else if (style === 'dining') topDepth = Math.min(lerp([0.8, 1.0], uDepth), 0.8 * topLength);
    else if (style === 'coffee') topDepth = Math.min(lerp([0.45, 0.7], uDepth), 0.75 * topLength);
    else topDepth = lerp([0.75, 0.95], uDepth);
    let topHeight = style === 'cafe' && heightClass === 'bar' ? lerp([1.0, 1.07], uHeight) : lerp(HEIGHT[style], uHeight);
    if (style === 'coffee') topHeight = Math.min(topHeight, 0.45 * topLength);
    if (style === 'side') topHeight = Math.max(topHeight, topLength);
    const topThickness = lerp(THICKNESS[style], uThick);
    const topEdge = lerp(style === 'trestle' ? [0.004, 0.02] : [0.004, 0.015], uEdge);
    const topExponent = topShape === 'rect' ? 10 : topShape === 'squircle' ? lerp([3, 5], uExp) : 2;
    const topSides = round ? (topLength <= 0.8 ? 18 : 24) : 0;
    let seats = 0;
    if (style === 'dining' || style === 'trestle') {
      seats = round ? clamp(Math.floor((Math.PI * topLength) / 0.6), 3, 6) : clamp(2 * Math.floor(topLength / 0.6), 4, 8);
    } else if (style === 'cafe') seats = 2;
    return { heightClass, topShape, topLength, topDepth, topHeight, topThickness, topEdge, topExponent, topSides, seats };
  });
}

const LEG_PROFILE_WEIGHTS = {
  dining: { straight: 0.35, tapered: 0.3, splayed: 0.15, turned: 0.2 },
  coffee: { straight: 0.3, tapered: 0.3, splayed: 0.4 },
  side: { straight: 0.4, tapered: 0.3, splayed: 0.3 },
};
const LEG_THICKNESS = { dining: [0.05, 0.09], coffee: [0.035, 0.06], side: [0.032, 0.048] };
const OVERHANG = { dining: [0.04, 0.14], coffee: [0.03, 0.1], side: [0.01, 0.05] };
const MAX_LEG_EDGE = { dining: 0.13, coffee: 0.17, side: 0.14 };
const APRON_CHANCE = { dining: 0.85, coffee: 0.4, side: 0.15 };
const APRON_HEIGHT = { dining: [0.06, 0.11], coffee: [0.04, 0.08], side: [0.04, 0.08] };
const STRETCHER_WEIGHTS = {
  dining: { none: 0.55, h: 0.25, perimeter: 0.2 },
  coffee: { none: 0.7, perimeter: 0.15, cross: 0.15 },
  side: { none: 0.5, perimeter: 0.3, cross: 0.2 },
};
const STRETCHER_HEIGHT = { dining: [0.1, 0.22], coffee: [0.05, 0.14], side: [0.05, 0.14] };
const SHELF_CHANCE = { coffee: 0.4, side: 0.45 };

const NEUTRAL_BASE = {
  legCount: 0, legProfile: 'straight', legThickness: 0, legSides: 0, legTaper: 1, legSplay: 0, overhang: 0,
  hasApron: false, apronHeight: 0, apronThickness: 0, stretcher: 'none', stretcherHeight: 0, stretcherThickness: 0,
  hasShelf: false, shelfHeight: 0, shelfThickness: 0, shelfShape: 'none',
  pedestalBase: 'none', baseSpan: 0, baseHeight: 0, columnRadius: 0, columnSides: 0, capRadius: 0,
  trestleKind: 'none', trestleInset: 0, footLength: 0, footHeight: 0, beamWidth: 0, postDepth: 0, cleatHeight: 0,
  trestleStretcherHeight: 0,
};

function legsBase(style, t, d) {
  const { topShape, topLength, topDepth, topHeight, topThickness } = t;
  const [uCount, uProfile, uThick, uSides, uTaper, uSplay, uOverhang, uApron, uApronH, uApronT, uStretch, uStretchH, uStretchT, uShelf, uShelfH, uShelfT] = d;
  const legHeight = topHeight - topThickness;
  const rectLike = topShape === 'rect';
  let legCount = 4;
  if (style === 'coffee' && !rectLike) legCount = topLength > 0.8 ? 4 : pickU(uCount, [[3, 0.3], [4, 0.7]]);
  if (style === 'side' && !rectLike) legCount = pickU(uCount, [[3, 0.55], [4, 0.45]]);
  const legProfile = pickU(uProfile, LEG_PROFILE_WEIGHTS[style]);
  let legThickness = lerp(LEG_THICKNESS[style], uThick);
  const legSides = legProfile === 'turned' ? 8 : pickU(uSides, [[4, 0.5], [6, 0.25], [8, 0.25]]);
  const legTaper = legProfile === 'tapered' ? lerp([0.5, 0.75], uTaper) : legProfile === 'splayed' ? lerp([0.55, 0.8], uTaper) : 1;
  const hasApron = legProfile === 'turned' || uApron < APRON_CHANCE[style];
  if (style === 'dining' && !hasApron) legThickness = Math.max(legThickness, 0.06);
  const edgeCap = Math.max(0.012, MAX_LEG_EDGE[style] - 1.2 * legThickness);
  const overhang = Math.min(lerp(OVERHANG[style], uOverhang) * (topShape === 'round' ? 0.5 : 1), edgeCap, 0.2 * Math.min(topLength, topDepth));
  let legSplay = 0;
  if (legProfile === 'splayed') legSplay = Math.min(lerp([0.03, 0.08], uSplay), 0.14 * legHeight, overhang + 0.7 * legThickness);
  let apronHeight = lerp(APRON_HEIGHT[style], uApronH);
  apronHeight = style === 'dining' ? Math.min(apronHeight, legHeight - 0.6) : Math.min(apronHeight, 0.35 * legHeight);
  const apronThickness = lerp([0.018, 0.025], uApronT);
  const hasShelf = style !== 'dining' && uShelf < SHELF_CHANCE[style];
  let stretcher = pickU(uStretch, STRETCHER_WEIGHTS[style]);
  if (stretcher === 'h' && legCount !== 4) stretcher = 'perimeter';
  if (hasShelf) stretcher = 'none';
  const stretcherHeight = Math.min(lerp(STRETCHER_HEIGHT[style], uStretchH), 0.4 * legHeight);
  const stretcherThickness = Math.max(0.015, legThickness * lerp([0.45, 0.6], uStretchT));
  const shelfHeight = Math.min(lerp([0.12, 0.22], uShelfH), 0.45 * legHeight);
  const shelfThickness = lerp([0.015, 0.025], uShelfT);
  const shelfShape = legCount === 3 ? 'round' : topShape;
  return {
    ...NEUTRAL_BASE,
    legCount, legProfile, legThickness, legSides, legTaper, legSplay, overhang,
    hasApron, apronHeight: hasApron ? apronHeight : 0, apronThickness: hasApron ? apronThickness : 0,
    stretcher, stretcherHeight: stretcher === 'none' ? 0 : stretcherHeight,
    stretcherThickness: stretcher === 'none' ? 0 : stretcherThickness,
    hasShelf, shelfHeight: hasShelf ? shelfHeight : 0, shelfThickness: hasShelf ? shelfThickness : 0,
    shelfShape: hasShelf ? shelfShape : 'none',
  };
}

function pedestalBase(t, d) {
  const { topLength, topDepth, heightClass } = t;
  const [uBase, uSpan, uHeight, uColumn, uSides, uCap] = d;
  const bar = heightClass === 'bar';
  let pedestal = pickU(uBase, { cone: 0.4, cross: 0.4, tripod: 0.2 });
  if (bar && pedestal === 'tripod') pedestal = 'cross';
  const small = Math.min(topLength, topDepth);
  const factor = pedestal === 'tripod' ? lerp([0.75, 0.85], uSpan) : bar ? lerp([0.7, 0.85], uSpan) : lerp([0.62, 0.8], uSpan);
  const baseSpan = Math.min(small * factor, small - 0.02);
  const baseHeight = pedestal === 'cone' ? lerp([0.02, 0.04], uHeight) : lerp([0.03, 0.05], uHeight);
  const columnRadius = lerp(bar ? [0.03, 0.05] : [0.025, 0.045], uColumn);
  const columnSides = pickU(uSides, [[8, 1], [10, 1], [12, 1]]);
  const capRadius = Math.min(lerp([0.08, 0.14], uCap), 0.35 * small);
  return { ...NEUTRAL_BASE, pedestalBase: pedestal, baseSpan, baseHeight, columnRadius, columnSides, capRadius };
}

function trestleBase(t, d) {
  const { topLength, topDepth, topHeight, topThickness } = t;
  const [uKind, uInset, uFoot, uFootH, uBeam, uPost, uCleat, uStretch] = d;
  const legHeight = topHeight - topThickness;
  const trestleKind = pickU(uKind, { I: 0.45, A: 0.3, X: 0.25 });
  const beamWidth = lerp([0.06, 0.1], uBeam);
  return {
    ...NEUTRAL_BASE,
    trestleKind,
    trestleInset: Math.min(lerp([0.15, 0.35], uInset), 0.2 * topLength),
    footLength: topDepth * lerp([0.78, 0.92], uFoot),
    footHeight: lerp([0.05, 0.08], uFootH),
    beamWidth,
    postDepth: trestleKind === 'I' ? lerp([0.1, 0.16], uPost) : beamWidth,
    cleatHeight: lerp([0.04, 0.06], uCleat),
    trestleStretcherHeight: trestleKind === 'X' ? 0.4 * legHeight : lerp([0.25, 0.45], uStretch),
  };
}

function generateBase(g, style, t) {
  return g.roll('base', (r) => {
    const legs = Array.from({ length: 16 }, () => r.next());
    const pedestal = Array.from({ length: 6 }, () => r.next());
    const trestle = Array.from({ length: 8 }, () => r.next());
    const baseKind = style === 'cafe' ? 'pedestal' : style === 'trestle' ? 'trestle' : 'legs';
    const detail = baseKind === 'legs' ? legsBase(style, t, legs) : baseKind === 'pedestal' ? pedestalBase(t, pedestal) : trestleBase(t, trestle);
    return { baseKind, legHeight: t.topHeight - t.topThickness, ...detail };
  });
}

function generatePalette(g) {
  return g.roll('palette', (r) => {
    const paint = paintColor(r);
    const accent = accentColor(r, paint);
    return { paint: paint.hex, accent: accent.hex };
  });
}

const TOP_FINISH_WEIGHTS = {
  dining: { wood: 0.7, painted: 0.15, stone: 0.15 },
  trestle: { wood: 0.9, painted: 0.1, stone: 0 },
  coffee: { wood: 0.5, painted: 0.25, stone: 0.25 },
  side: { wood: 0.45, painted: 0.35, stone: 0.2 },
  cafe: { wood: 0.35, painted: 0.25, stone: 0.4 },
};

function baseModeWeights(style, topFinish) {
  const painted = topFinish === 'painted' ? 'accent' : 'painted';
  if (style === 'cafe') return { black: 0.45, metal: 0.3, white: 0.1, [painted]: 0.08, wood: 0.07 };
  if (style === 'trestle') return { wood: 0.82, [painted]: 0.08, black: 0.1 };
  if (topFinish === 'wood') return { wood: 0.67, [painted]: 0.08, black: 0.15, white: 0.1 };
  return { wood: 0.28, black: 0.32, white: 0.17, metal: 0.17, [painted]: 0.06 };
}

function generateFinish(g, style, palette) {
  const f = g.roll('finish', (r) => {
    const topFinish = pickU(r.next(), TOP_FINISH_WEIGHTS[style]);
    const wood = pickWood(r);
    const stone = r.pick(STONE_TONES);
    const stoneL = stone.l + r.range(-0.03, 0.03);
    const uMode = r.next();
    const planked = r.chance(0.6);
    const scale = r.int(3, 6);
    return { topFinish, wood, stone, stoneL, uMode, planked, scale };
  });
  const baseMode = pickU(f.uMode, baseModeWeights(style, f.topFinish));
  const woodUsed = f.topFinish === 'wood' || baseMode === 'wood';
  const stoneUsed = f.topFinish === 'stone';
  const { wood } = f;
  const woodColor = (dl) => hsl(wood.h, wood.s, wood.l + dl);
  let topColor, topSecondary;
  if (f.topFinish === 'wood') {
    topColor = woodColor(0);
    topSecondary = woodColor(-0.05);
  } else if (stoneUsed) {
    topColor = hsl(f.stone.h, f.stone.s, f.stoneL);
    topSecondary = topColor;
  } else {
    topColor = palette.paint;
    topSecondary = topColor;
  }
  const baseColor = {
    wood: () => woodColor(-0.04),
    black: () => FRAME_COLORS.black,
    white: () => FRAME_COLORS.white,
    metal: () => FRAME_COLORS.metal,
    painted: () => palette.paint,
    accent: () => palette.accent,
  }[baseMode]();
  return {
    topFinish: f.topFinish,
    woodName: woodUsed ? wood.name : null,
    stoneName: stoneUsed ? f.stone.name : null,
    baseMode,
    topPattern: f.topFinish === 'wood' && f.planked ? 'stripes' : 'solid',
    topPatternScale: f.scale,
    topColor,
    topSecondary,
    baseColor,
  };
}

export function generateTableParams(g) {
  const style = rollStyle(g, STYLE_WEIGHTS);
  const top = generateTop(g, style);
  const base = generateBase(g, style, top);
  const palette = generatePalette(g);
  const finish = generateFinish(g, style, palette);
  return { seed: g.seed, type: 'table', style, ...top, ...base, ...palette, ...finish };
}
