import { FRAME_COLORS, hsl, pickWood } from '../../core/color.js';
import {
  PAINTS, accentColor, capSaturation, fabricColor, hexToHsl, muted, paintColor, shade, swatch,
} from '../../core/palette.js';
import { createRng, rollStyle, weightedPick } from '../../core/rng.js';
import { clamp, lerp } from '../../core/math.js';
import { countDecor, layoutShelfContents } from '../../core/fill.js';
import {
  BASE_RANGE, CUBE_MAX_BASE, LEAN_TOP_MARGIN, LEAN_Y0_NOMINAL, bays, chooseCount, frameTris,
} from './layout.js';

export const STYLE_WEIGHTS = { bookcase: 0.3, open: 0.2, ladder: 0.14, cube: 0.22, leaning: 0.14 };
export const CONTENT_BUDGET = 5800;
export const OBJECT_KINDS = ['vase', 'bowl', 'orb', 'box'];

const at = (u) => ({ next: () => u });
const pickU = (u, weights) => weightedPick(at(u), weights);
const draws = (r, n) => Array.from({ length: n }, () => r.next());
const deg = (rad) => (rad * 180) / Math.PI;

const NEUTRAL_SHAPE = {
  heightClass: 'tall', height: 0, width: 0, depth: 0, topDepth: 0, cols: 1, rows: 0, cellSize: 0, boardThickness: 0,
  sideThickness: 0, railDepth: 0, leanAngle: 0, shelfCount: 0, shelfSpacing: 'even', bays: 1, backKind: 'none',
  backThickness: 0, sideBraces: false, topOverhang: 0, postFinials: 0, rungCount: 0,
};

const NEUTRAL_BASE = {
  baseKind: 'none', baseHeight: 0, plinthSetback: 0, footCut: 'none', postProfile: 'none', legCount: 0, legThickness: 0,
  legSides: 4, legTaper: 1, legSplay: 0, legInset: 0, legHeight: 0,
};

function bookcaseShape(u) {
  const heightClass = pickU(u[0], { low: 0.25, mid: 0.35, tall: 0.4 });
  const range = { low: [0.8, 1.1], mid: [1.1, 1.6], tall: [1.6, 2.1] }[heightClass];
  const height = lerp(range, u[1]);
  const width = lerp([0.4, 1.2], u[2]);
  let depth = u[3] < 0.7 ? lerp([0.26, 0.32], u[4]) : lerp([0.25, 0.4], u[4]);
  depth = Math.max(depth, height / 7);
  const boardThickness = lerp([0.016, 0.025], u[5]);
  const sideThickness = boardThickness * lerp([1, 1.4], u[6]);
  const shelfSpacing = pickU(u[8], { even: 0.6, graded: 0.4 });
  const backKind = pickU(u[9], { panel: 0.8, none: 0.2 });
  const part = {
    ...NEUTRAL_SHAPE, style: 'bookcase', height, boardThickness, shelfSpacing, baseHeight: 0,
  };
  const interior = height - 0.22 - boardThickness;
  const shelfCount = chooseCount(part, clamp(Math.round(interior / lerp([0.26, 0.36], u[7])), 2, 7), 2, 7);
  return {
    ...NEUTRAL_SHAPE,
    heightClass, height, width, depth, topDepth: depth, boardThickness, sideThickness, shelfCount, shelfSpacing,
    bays: width - 2 * sideThickness > 0.9 ? 2 : 1,
    backKind, backThickness: backKind === 'panel' ? lerp([0.006, 0.012], u[10]) : 0,
    topOverhang: u[11] < 0.5 ? 0 : lerp([0.01, 0.03], u[12]),
  };
}

function openShape(u) {
  const heightClass = pickU(u[0], { low: 0.3, tall: 0.7 });
  const height = lerp(heightClass === 'low' ? [0.8, 1.1] : [1.4, 2.0], u[1]);
  const width = lerp([0.6, 1.2], u[2]);
  const depth = lerp([0.28, 0.4], u[3]);
  let boardThickness = lerp([0.018, 0.035], u[4]);
  if (width >= 1.0) boardThickness = Math.max(boardThickness, 0.025);
  const shelfSpacing = pickU(u[6], { even: 0.6, graded: 0.4 });
  const backKind = pickU(u[7], { brace: 0.4, none: 0.6 });
  const part = {
    ...NEUTRAL_SHAPE, style: 'open', height, boardThickness, shelfSpacing,
  };
  const shelfCount = chooseCount(part, clamp(Math.round(height / lerp([0.3, 0.4], u[5])), 3, 6), 3, 6);
  let postFinials = heightClass === 'tall' && u[9] >= 0.6 ? lerp([0.03, 0.08], u[10]) : 0;
  postFinials = Math.min(postFinials, 2.0 - height);
  if (postFinials < 0.03) postFinials = 0;
  return {
    ...NEUTRAL_SHAPE,
    heightClass, height, width, depth, topDepth: depth, boardThickness, shelfCount, shelfSpacing,
    bays: width >= 1.0 ? 2 : 1,
    backKind, backThickness: backKind === 'brace' ? lerp([0.012, 0.02], u[8]) : 0,
    sideBraces: backKind === 'brace' && u[11] < 0.5,
    postFinials,
  };
}

function ladderShape(u) {
  const height = lerp([1.2, 1.8], u[0]);
  const width = lerp([0.5, 0.9], u[1]);
  const depth = lerp([0.4, 0.6], u[2]);
  const topDepth = lerp([0.12, 0.2], u[3]);
  const boardThickness = lerp([0.018, 0.025], u[4]);
  const sideThickness = lerp([0.03, 0.045], u[5]);
  const rungCount = u[6] < 0.5 ? 1 : 2;
  const part = {
    ...NEUTRAL_SHAPE, style: 'ladder', height, boardThickness, rungCount, baseHeight: 0,
  };
  const cap = Math.max(3, Math.min(5, Math.floor(height / 0.3)));
  const shelfCount = chooseCount(part, Math.min(3 + Math.floor(u[7] * 3), cap), 3, cap);
  return {
    ...NEUTRAL_SHAPE,
    height, width, depth, topDepth, boardThickness, sideThickness, railDepth: sideThickness,
    leanAngle: deg(Math.atan((depth - topDepth) / 2 / height)), shelfCount, rungCount,
  };
}

function cubeShape(u) {
  const boardThickness = lerp([0.032, 0.05], u[0]);
  const cols = Math.min(4, 1 + Math.floor(u[1] * 4));
  let rows = Math.min(cols === 1 ? 4 : 5, 2 + Math.floor(u[2] * 4));
  let cellSize = lerp([0.3, 0.36], u[3]);
  if (cols * cellSize + (cols + 1) * boardThickness > 1.6) cellSize = (1.6 - (cols + 1) * boardThickness) / cols;
  const depth = lerp([0.35, 0.4], u[4]);
  while (rows > 2 && rows * cellSize + (rows + 1) * boardThickness + CUBE_MAX_BASE > 2.0) rows--;
  const backKind = pickU(u[5], { panel: 0.3, none: 0.7 });
  return {
    ...NEUTRAL_SHAPE,
    heightClass: rows <= 2 ? 'low' : 'tall',
    height: rows * cellSize + (rows + 1) * boardThickness + CUBE_MAX_BASE,
    width: cols * cellSize + (cols + 1) * boardThickness,
    depth, topDepth: depth, cols, rows, cellSize, boardThickness, sideThickness: boardThickness,
    shelfCount: rows, bays: cols, backKind, backThickness: backKind === 'panel' ? lerp([0.006, 0.012], u[6]) : 0,
  };
}

function leaningShape(u) {
  const height = lerp([1.5, 2.0], u[0]);
  const width = lerp([0.45, 0.8], u[1]);
  const topDepth = lerp([0.12, 0.2], u[2]);
  const boardThickness = lerp([0.016, 0.022], u[3]);
  const sideThickness = lerp([0.022, 0.035], u[4]);
  const span = height - LEAN_TOP_MARGIN - LEAN_Y0_NOMINAL;
  const tan = clamp(Math.tan((lerp([8, 14], u[5]) * Math.PI) / 180), (0.3 - topDepth) / span, (0.4 - topDepth) / span);
  const depth = topDepth + span * tan;
  const railDepth = Math.min(lerp([0.04, 0.065], u[6]), topDepth - LEAN_TOP_MARGIN * tan - 0.002);
  const shelfSpacing = pickU(u[8], { even: 0.6, graded: 0.4 });
  const backKind = pickU(u[9], { panel: 0.45, none: 0.55 });
  const part = {
    ...NEUTRAL_SHAPE, style: 'leaning', height, boardThickness, shelfSpacing,
  };
  const shelfCount = chooseCount(part, clamp(Math.round(height / lerp([0.3, 0.38], u[7])), 4, 6), 4, 6);
  return {
    ...NEUTRAL_SHAPE,
    height, width, depth, topDepth, boardThickness, sideThickness, railDepth, leanAngle: deg(Math.atan(tan)),
    shelfCount, shelfSpacing, backKind, backThickness: backKind === 'panel' ? lerp([0.006, 0.012], u[10]) : 0,
  };
}

const SHAPES = { bookcase: bookcaseShape, open: openShape, ladder: ladderShape, cube: cubeShape, leaning: leaningShape };

function generateShape(g, style) {
  return g.roll('shape', (r) => SHAPES[style](draws(r, 14)));
}

function legFields(u, minInset, legHeight) {
  const legThickness = lerp([0.03, 0.045], u[0]);
  const legSplay = Math.min(lerp([0, 0.02], u[3]), 0.35 * legHeight);
  return {
    legThickness,
    legSides: pickU(u[1], [[4, 1], [6, 1], [8, 1]]),
    legTaper: lerp([0.55, 0.85], u[2]),
    legSplay,
    legInset: Math.max(lerp([0.02, 0.05], u[4]), legThickness / 2 + legSplay + 0.001, minInset),
  };
}

function bookcaseBase(s, u) {
  const baseKind = pickU(u[0], { plinth: 0.45, legs: 0.3, cut: 0.25 });
  const baseHeight = lerp({ plinth: [0.05, 0.1], legs: [0.1, 0.22], cut: [0.06, 0.14] }[baseKind], u[1]);
  const base = {
    ...NEUTRAL_BASE, baseKind, baseHeight,
    plinthSetback: baseKind === 'plinth' ? lerp([0.015, 0.05], u[2]) : 0,
    footCut: baseKind === 'cut' ? pickU(u[3], { arch: 0.5, v: 0.2, notch: 0.3 }) : 'none',
  };
  if (baseKind !== 'legs') return base;
  return {
    ...base, legCount: s.bays === 2 ? 6 : 4, ...legFields(u.slice(4), 0, baseHeight), legHeight: baseHeight,
  };
}

function cubeBase(s, u) {
  const baseKind = pickU(u[0], { floor: 0.6, legs: 0.4 });
  if (baseKind === 'floor') return { ...NEUTRAL_BASE, baseKind };
  const baseHeight = lerp([0.1, 0.18], u[1]);
  return {
    ...NEUTRAL_BASE, baseKind, baseHeight, legCount: s.cols >= 3 ? 6 : 4, ...legFields(u.slice(4), 0, baseHeight), legHeight: baseHeight,
  };
}

function leaningBase(s, u) {
  return { ...NEUTRAL_BASE, baseKind: pickU(u[0], { posts: 0.65, crate: 0.35 }), baseHeight: lerp([0.12, 0.3], u[1]) };
}

function openBase(s, u) {
  const postProfile = pickU(u[2], { round: 0.5, square: 0.5 });
  const round = postProfile === 'round';
  const legThickness = round ? lerp([0.02, 0.03], u[3]) : lerp([0.03, 0.045], u[3]);
  return {
    ...NEUTRAL_BASE,
    baseKind: 'posts',
    baseHeight: lerp([0.05, 0.15], u[1]),
    postProfile,
    legCount: s.width >= 1.0 ? 6 : 4,
    legThickness,
    legSides: round ? 8 : 4,
    legInset: legThickness / 2,
    legHeight: s.height + (round ? 0 : s.postFinials),
  };
}

const BASES = { bookcase: bookcaseBase, cube: cubeBase, leaning: leaningBase, open: openBase, ladder: () => ({ ...NEUTRAL_BASE }) };

function generateBase(g, style, shape) {
  return g.roll('base', (r) => BASES[style](shape, draws(r, 12)));
}

function generatePalette(g) {
  return g.roll('palette', (r) => {
    const paint = paintColor(r);
    const accent = accentColor(r, paint);
    return { paint: paint.hex, accent: accent.hex };
  });
}

const FRAME_WEIGHTS = {
  bookcase: { wood: 0.55, painted: 0.3, white: 0.15 },
  ladder: { wood: 0.75, painted: 0.25 },
  cube: { white: 0.35, wood: 0.3, painted: 0.2, black: 0.15 },
  leaning: { wood: 0.6, black: 0.25, painted: 0.15 },
};

function frameWeights(style, postProfile) {
  if (style === 'open') return postProfile === 'square' ? { wood: 0.6, black: 0.4 } : { metal: 0.5, black: 0.5 };
  return FRAME_WEIGHTS[style];
}

function boardWeights(style, frameMode) {
  if (style === 'open' && frameMode !== 'wood') return { wood: 0.75, painted: 0.25 };
  if (style === 'leaning' && frameMode === 'black') return { wood: 0.7, match: 0.3 };
  return { match: 1 };
}

function backWeights(shape, frameMode) {
  if (shape.backKind === 'brace') return { match: 1 };
  if (shape.backKind !== 'panel') return { none: 1 };
  return {
    match: frameMode === 'white' ? 0 : 0.4,
    accent: 0.25,
    paint: frameMode === 'painted' ? 0 : 0.15,
    wood: frameMode === 'wood' ? 0 : 0.2,
  };
}

function pushFrom(sw, refL, min) {
  if (Math.abs(sw.l - refL) >= min) return sw;
  const up = refL + min <= 0.9;
  const down = refL - min >= 0.18;
  const dir = sw.l >= refL ? (up ? 1 : -1) : down ? -1 : 1;
  return shade(sw, refL + dir * min - sw.l);
}

function generateFinish(g, style, shape, base, palette) {
  const f = g.roll('finish', (r) => {
    const u = draws(r, 8);
    return { u, wood: pickWood(r) };
  });
  const frameMode = pickU(f.u[0], frameWeights(style, base.postProfile));
  const boardMode = pickU(f.u[1], boardWeights(style, frameMode));
  const backMode = pickU(f.u[2], backWeights(shape, frameMode));
  const backPattern = backMode === 'accent' || backMode === 'paint' ? pickU(f.u[3], { solid: 0.6, linen: 0.4 }) : 'solid';
  const woodUsed = frameMode === 'wood' || boardMode === 'wood' || backMode === 'wood';
  const grain = woodUsed ? pickU(f.u[4], { fine: 0.3, plain: 0.5, bold: 0.2 }) : 'none';
  const { wood } = f;
  const frameColor = {
    wood: () => hsl(wood.h, wood.s, wood.l),
    painted: () => palette.paint,
    white: () => FRAME_COLORS.white,
    black: () => FRAME_COLORS.black,
    metal: () => FRAME_COLORS.metal,
  }[frameMode]();
  const boardColor = {
    match: () => frameColor,
    wood: () => shade(wood, 0.03).hex,
    painted: () => palette.paint,
  }[boardMode]();
  const backColor = {
    match: () => frameColor,
    accent: () => pushFrom(swatch(palette.accent), hexToHsl(frameColor).l, 0.12).hex,
    paint: () => palette.paint,
    wood: () => shade(wood, -0.05).hex,
    none: () => null,
  }[backMode]();
  return {
    frameMode, boardMode, backMode, backPattern, woodName: woodUsed ? wood.name : null, grain, frameColor, boardColor, backColor,
  };
}

const MOODS = { library: 0.4, styled: 0.4, sparse: 0.2 };
const COVER_MOODS = { classic: 0.3, mixed: 0.3, tonal: 0.25, pale: 0.15 };
const CLASSIC = ['oxblood', 'navy', 'forest', 'ochre', 'charcoal', 'cream'];
const CERAMICS = ['cream', 'putty', 'charcoal', 'terracotta', 'sage', 'slate blue'];

function namedPaint(r, name) {
  const paint = PAINTS.find((q) => q.name === name);
  return capSaturation(paint.h + r.range(-0.012, 0.012), paint.s, paint.l + r.range(-0.04, 0.04));
}

function coverColours(r, mood, boardHue, boardSat) {
  if (mood === 'classic') return Array.from({ length: 5 }, () => namedPaint(r, r.pick(CLASSIC)).hex);
  if (mood === 'mixed') return Array.from({ length: 5 }, () => paintColor(r).hex);
  if (mood === 'pale') return Array.from({ length: 5 }, () => fabricColor(r, { mood: 'neutral' }).hex);
  let base = paintColor(r);
  if (boardSat > 0.08) {
    const d = ((base.h - boardHue + 1.5) % 1) - 0.5;
    if (Math.abs(d) < 0.1) base = capSaturation(boardHue + (d >= 0 ? 0.14 : -0.14) + 1, base.s, base.l);
  }
  return [-0.15, -0.07, 0, 0.1, 0.2].map((dl) => shade(base, dl).hex);
}

function dropLoneBooks(recs) {
  const books = recs.filter((q) => q.k === 'b').sort((a, b) => a.x - b.x);
  const drop = new Set();
  let run = [];
  let end = -Infinity;
  const flush = () => {
    if (run.length && run.length < 3) run.forEach((q) => drop.add(q));
    run = [];
  };
  for (const q of books) {
    if (q.x - end > 0.02) flush();
    run.push(q);
    end = Math.max(end, q.x + q.w + (q.lean ? q.h * Math.sin((Math.abs(q.lean) * Math.PI) / 180) : 0));
  }
  flush();
  return recs.filter((q) => !drop.has(q));
}

export function contentsLayout(p) {
  const surfaces = bays(p);
  const frames = surfaces.some((s) => s.back);
  return {
    surfaces,
    layout: layoutShelfContents(createRng(String(p.fillSeed)), surfaces, {
      mood: p.contentsMood,
      coverCount: 5,
      objectCount: 2,
      objectKinds: frames ? [...OBJECT_KINDS, 'frame'] : OBJECT_KINDS,
      allowBins: p.style === 'cube',
      allowFrames: true,
      budget: CONTENT_BUDGET - frameTris(p),
      inset: p.inset,
    }).map(dropLoneBooks),
  };
}

function generateContents(g, p) {
  const c = g.roll('contents', (r) => {
    const contentsMood = weightedPick(r, MOODS);
    let coverMood = weightedPick(r, COVER_MOODS);
    if (coverMood === 'pale' && p.frameMode === 'white') coverMood = 'tonal';
    const board = hexToHsl(p.boardColor);
    const boardL = board.l;
    const bookColors = coverColours(r, coverMood, board.h, board.s).map((hex) => {
      const sw = swatch(hex);
      return Math.abs(sw.l - boardL) < 0.06 ? shade(sw, sw.l >= boardL ? 0.12 : -0.12).hex : hex;
    });
    const pageColor = muted(0.11, r.range(0.15, 0.3), r.range(0.82, 0.9));
    const liftBin = (hex) => (hexToHsl(hex).l < 0.3 ? shade(swatch(hex), 0.3 - hexToHsl(hex).l).hex : hex);
    const ceramic = liftBin(namedPaint(r, r.pick(CERAMICS)).hex);
    const objectColors = [ceramic, liftBin(accentColor(r, swatch(p.frameColor)).hex)];
    const fillSeed = r.int(0, 2147483647);
    const inset = r.range(0.005, 0.03);
    return { contentsMood, coverMood, bookColors, pageColor, objectColors, fillSeed, inset };
  });
  const { layout } = contentsLayout({ ...p, ...c });
  const counts = countDecor(layout);
  return { ...c, bookCount: counts.books, objectCount: counts.objects + counts.bins };
}

export function generateShelfParams(g) {
  const style = rollStyle(g, STYLE_WEIGHTS);
  const shape = generateShape(g, style);
  const base = generateBase(g, style, shape);
  const palette = generatePalette(g);
  const finish = generateFinish(g, style, shape, base, palette);
  const head = { seed: g.seed, type: 'shelf', style, ...shape, ...base, ...palette, ...finish };
  const contents = generateContents(g, head);
  return { ...head, ...contents };
}

export { BASE_RANGE };
