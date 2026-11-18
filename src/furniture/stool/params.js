import { hsl, pickWood } from '../../core/color.js';
import { capSaturation, fabricColor, harmoniousSecondary, HARMONY_MODES, paintColor, shade } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp } from '../../core/math.js';

export const STYLES = { bar: 0.25, counter: 0.2, diner: 0.15, milking: 0.15, drum: 0.15, slab: 0.1 };

export const SEAT_HEIGHT_RANGES = {
  bar: [0.72, 0.8],
  counter: [0.6, 0.68],
  diner: [0.6, 0.8],
  milking: [0.26, 0.45],
  drum: [0.38, 0.46],
  slab: [0.22, 0.46],
};

const NEUTRAL_SHAPE = {
  seatHeight: 0,
  seatShape: 'round',
  seatWidth: 0,
  seatDepth: 0,
  seatExponent: 2,
  seatSides: 12,
  seatThickness: 0,
  puff: 0,
  hasCushion: false,
  cushionThickness: 0,
  legCount: 0,
  legThickness: 0,
  legSides: 0,
  legTaper: 1,
  legSplay: 0,
  legHeight: 0,
  columnRadius: 0,
  hasSleeve: false,
  hubRadius: 0,
  hubHeight: 0,
  baseShape: 'none',
  baseRadius: 0,
  baseHeight: 0,
  drumProfile: 'none',
  drumWaist: 1,
  drumBase: 'none',
  plinthHeight: 0,
  slabThickness: 0,
  slabInset: 0,
  slabCutout: 'none',
  slabCutoutHeight: 0,
  slabCutoutWidth: 0,
};

const NEUTRAL_FOOTREST = {
  footrestKind: 'none',
  footrestHeight: 0,
  footrestRadius: 0,
  footrestDouble: false,
  footrestGap: 0,
  footrestStagger: false,
  pedestalRingRadius: 0,
  pedestalSpokes: 0,
};

const PALETTE_FIELDS = ['cushionColor', 'cushionSecondary', 'bodyColor', 'accentColor'];
const PATTERN_FIELDS = ['pattern'];
const FINISH_FIELDS = ['frameMode', 'frameColor', 'woodName', 'panMode', 'panColor', 'grain'];

export const PATTERN_WEIGHTS = [
  ['none', 0.14],
  ['linen', 0.3],
  ['boucle', 0.14],
  ['dots', 0.1],
  ['gingham', 0.08],
  ['ticking', 0.08],
  ['herringbone', 0.08],
  ['floral', 0.08],
];

export const GRAIN_WEIGHTS = [['fine', 0.25], ['plain', 0.5], ['bold', 0.25]];

function patternSpec(r) {
  const kind = weightedPick(r, PATTERN_WEIGHTS);
  const a = r.next();
  const b = r.next();
  const c = r.next();
  const flag = r.chance(0.5);
  switch (kind) {
    case 'linen':
      return { kind: 'linen', texture: 'linen', thread: 0.003 + 0.002 * a, strength: 0.4 + 0.3 * b };
    case 'boucle':
      return { kind: 'linen', texture: 'boucle', thread: 0.005 + 0.003 * a, strength: 0.5 + 0.3 * b };
    case 'dots':
      return { kind: 'dots', spacing: 0.03 + 0.03 * a, size: 0.16 + 0.1 * b, layout: flag ? 'offset' : 'grid' };
    case 'gingham':
      return { kind: 'gingham', spacing: 0.012 + 0.012 * a, overcheck: c < 0.3 ? 0.12 : 0 };
    case 'ticking':
      return { kind: 'ticking', spacing: 0.02 + 0.02 * a, width: 0.1 + 0.1 * b, direction: flag ? 'vertical' : 'horizontal', double: c < 0.25 };
    case 'herringbone':
      return { kind: 'herringbone', band: 0.025 + 0.02 * a, spacing: 0.008 + 0.004 * b, width: 0.45 };
    case 'floral':
      return { kind: 'floral', spacing: 0.09 + 0.05 * a, petals: 5, size: 0.2 + 0.05 * b, leaves: true };
    default:
      return 'none';
  }
}

export function patternLabel(pattern) {
  if (pattern === 'none') return 'solid';
  if (pattern.kind === 'linen') return pattern.texture === 'boucle' ? 'bouclé' : 'linen';
  if (pattern.kind === 'dots') return `dots (${pattern.layout})`;
  if (pattern.kind === 'ticking') return `ticking (${pattern.direction})`;
  return pattern.kind;
}

export const FIELDS = {
  style: ['style'],
  shape: Object.keys(NEUTRAL_SHAPE),
  footrest: Object.keys(NEUTRAL_FOOTREST),
  palette: PALETTE_FIELDS,
  pattern: PATTERN_FIELDS,
  finish: FINISH_FIELDS,
};


function seatOutline(r, shape, width, rectDepth) {
  const depth =
    shape === 'rect' ? r.range(rectDepth[0], rectDepth[1]) :
    shape === 'oval' ? width * r.range(0.75, 0.9) :
    width;
  const seatExponent =
    shape === 'squircle' ? r.range(3, 5) :
    shape === 'round' || shape === 'oval' ? 2 :
    10;
  return { seatShape: shape, seatWidth: width, seatDepth: depth, seatExponent, seatSides: r.pick([8, 10, 12]) };
}

function legSet(r, { count, thickness, sides, taper, splay, height }) {
  const legThickness = r.range(thickness[0], thickness[1]);
  const legSplay = Math.min(r.range(splay[0], splay[1]), 0.35 * height);
  return {
    legCount: count,
    legThickness,
    legSides: r.pick(sides),
    legTaper: r.range(taper[0], taper[1]),
    legSplay,
    legHeight: height,
  };
}

function barShape(r) {
  const seatHeight = r.range(0.72, 0.8);
  const outline = seatOutline(r, weightedPick(r, [['round', 0.5], ['squircle', 0.25], ['square', 0.25]]), r.range(0.34, 0.44));
  const seatThickness = r.range(0.03, 0.06);
  const puff = r.range(0.004, 0.012);
  const hasCushion = r.chance(0.4);
  const cushionThickness = hasCushion ? r.range(0.04, 0.08) : 0;
  const height = seatHeight - cushionThickness - seatThickness;
  const count = weightedPick(r, [[4, 0.75], [3, 0.25]]);
  return {
    seatHeight, ...outline, seatThickness, puff, hasCushion, cushionThickness,
    ...legSet(r, { count, thickness: count === 3 ? [0.038, 0.05] : [0.032, 0.048], sides: [4, 6, 8], taper: [0.6, 1], splay: [0.04, 0.09], height }),
  };
}

function counterShape(r) {
  const seatHeight = r.range(0.6, 0.68);
  const shape = weightedPick(r, [['square', 0.45], ['rect', 0.2], ['round', 0.2], ['squircle', 0.15]]);
  const outline = seatOutline(r, shape, r.range(0.36, 0.46), [0.3, 0.38]);
  const seatThickness = r.range(0.03, 0.06);
  const puff = r.range(0.004, 0.012);
  const hasCushion = r.chance(0.5);
  const cushionThickness = hasCushion ? r.range(0.04, 0.08) : 0;
  const height = seatHeight - cushionThickness - seatThickness;
  return {
    seatHeight, ...outline, seatThickness, puff, hasCushion, cushionThickness,
    ...legSet(r, { count: 4, thickness: [0.03, 0.05], sides: [4, 4, 6], taper: [0.7, 1], splay: [0, 0.05], height }),
  };
}

function dinerShape(r) {
  const seatHeight = r.chance(0.5) ? r.range(0.6, 0.68) : r.range(0.72, 0.8);
  const seatWidth = r.range(0.36, 0.44);
  const seatThickness = r.range(0.02, 0.035);
  const puff = r.range(0.02, 0.05);
  const cushionThickness = r.range(0.06, 0.11);
  const columnRadius = r.range(0.022, 0.035);
  return {
    seatHeight,
    seatShape: 'round',
    seatWidth,
    seatDepth: seatWidth,
    seatExponent: 2,
    seatSides: 12,
    seatThickness,
    puff,
    hasCushion: true,
    cushionThickness,
    legHeight: seatHeight - cushionThickness - seatThickness,
    columnRadius,
    hasSleeve: r.chance(0.5),
    hubRadius: r.range(0.06, 0.1),
    hubHeight: r.range(0.03, 0.06),
    baseShape: weightedPick(r, [['disc', 0.6], ['cone', 0.4]]),
    baseRadius: clamp(seatHeight * r.range(0.28, 0.33), 0.19, 0.26),
    baseHeight: r.range(0.02, 0.05),
  };
}

function milkingShape(r) {
  const seatHeight = r.range(0.26, 0.45);
  const outline = seatOutline(r, weightedPick(r, [['round', 0.7], ['oval', 0.3]]), r.range(0.24, 0.36));
  const seatThickness = r.range(0.04, 0.07);
  const puff = r.range(0.004, 0.012);
  const count = weightedPick(r, [[3, 0.85], [4, 0.15]]);
  return {
    seatHeight, ...outline, seatThickness, puff,
    ...legSet(r, { count, thickness: [0.035, 0.055], sides: [5, 6, 8], taper: [0.55, 0.85], splay: [0.06, 0.12], height: seatHeight - seatThickness }),
  };
}

function drumShape(r) {
  const seatHeight = r.range(0.38, 0.46);
  const seatWidth = r.range(0.36, 0.5);
  const puff = r.range(0.02, 0.05);
  const hasCushion = r.chance(0.6);
  const cushionThickness = hasCushion ? r.range(0.05, 0.09) : 0;
  const drumProfile = weightedPick(r, [['straight', 0.45], ['spool', 0.3], ['barrel', 0.25]]);
  const drumWaist = drumProfile === 'spool' ? r.range(0.65, 0.85) : drumProfile === 'barrel' ? r.range(0.8, 0.92) : 1;
  const drumBase = weightedPick(r, [['floor', 0.45], ['plinth', 0.3], ['feet', 0.25]]);
  const plinthHeight = drumBase === 'plinth' ? r.range(0.03, 0.06) : 0;
  const shape = {
    seatHeight, seatShape: 'round', seatWidth, seatDepth: seatWidth, seatExponent: 2, seatSides: 12, puff, hasCushion,
    cushionThickness, drumProfile, drumWaist, drumBase, plinthHeight,
  };
  if (drumBase !== 'feet') return shape;
  const count = r.pick([3, 4]);
  return { ...shape, ...legSet(r, { count, thickness: [0.055, 0.075], sides: [6, 8], taper: [0.8, 1], splay: [0, 0.01], height: r.range(0.1, 0.15) }) };
}

function slabShape(r) {
  const seatHeight = r.range(0.22, 0.46);
  const outline = seatOutline(r, 'rect', r.range(0.4, 0.6), [0.26, 0.34]);
  const seatThickness = r.range(0.025, 0.045);
  const puff = r.range(0.004, 0.012);
  const legHeight = seatHeight - seatThickness;
  const slabThickness = r.range(0.02, 0.04);
  const slabInset = r.range(0.02, 0.08);
  const slabCutout = weightedPick(r, [['none', 0.12], ['arch', 0.6], ['notch', 0.28]]);
  const cutHeight = r.range(0.2, 0.4) * legHeight;
  const archWidth = outline.seatDepth * r.range(0.4, 0.6);
  const notchWidth = r.range(0.04, 0.08);
  return {
    seatHeight, ...outline, seatThickness, puff, legHeight, slabThickness, slabInset, slabCutout,
    slabCutoutHeight: slabCutout === 'none' ? 0 : cutHeight,
    slabCutoutWidth: slabCutout === 'arch' ? archWidth : slabCutout === 'notch' ? notchWidth : 0,
  };
}

const SHAPES = { bar: barShape, counter: counterShape, diner: dinerShape, milking: milkingShape, drum: drumShape, slab: slabShape };

const FOOTREST_KINDS = {
  bar: [['ring', 0.85], ['none', 0.15]],
  counter: [['perimeter', 0.5], ['h', 0.25], ['ring', 0.15], ['none', 0.1]],
  diner: [['pedestalRing', 0.85], ['none', 0.15]],
  slab: [['stretcher', 0.7], ['none', 0.3]],
};

export function footrestApplies(p) {
  return p.style !== 'milking' && p.style !== 'drum';
}

function footrestFor(r, style, s) {
  if (style === 'milking' || style === 'drum') return { ...NEUTRAL_FOOTREST };
  let kind = weightedPick(r, FOOTREST_KINDS[style]);
  if ((kind === 'perimeter' || kind === 'h') && s.legCount !== 4) kind = 'ring';
  if (style === 'slab' && s.slabCutout === 'none') kind = 'stretcher';
  const offset = r.range(0.4, 0.47);
  const slabFraction = r.range(0.25, 0.5);
  const ringRadius = r.range(0.008, 0.013);
  const railRadius = r.range(0.008, 0.014);
  const stretcherRadius = r.range(0.012, 0.02);
  const doubleRoll = r.chance(0.3);
  const gap = r.range(0.18, 0.26);
  const staggerRoll = r.chance(0.4);
  const pedestalRoll = r.range(0.17, 0.21);
  const spokes = r.pick([3, 4]);
  if (kind === 'none') return { ...NEUTRAL_FOOTREST };

  const footrestRadius =
    kind === 'ring' || kind === 'pedestalRing' ? ringRadius :
    kind === 'stretcher' ? stretcherRadius :
    Math.min(railRadius, 0.8 * (s.legThickness / 2) * s.legTaper);

  let footrestHeight;
  if (kind === 'stretcher') {
    const lowest = s.slabCutout === 'none' ? 0 : s.slabCutoutHeight + footrestRadius + 0.01;
    footrestHeight = Math.min(Math.max(s.legHeight * slabFraction, lowest), s.legHeight - footrestRadius - 0.06);
  } else {
    footrestHeight = clamp(s.seatHeight - offset, 0.17, s.legHeight - 0.15);
  }

  const double = (style === 'bar' || style === 'counter') && kind === 'ring' && doubleRoll && footrestHeight + gap <= s.legHeight - 0.08;
  const pedestal = kind === 'pedestalRing';
  return {
    footrestKind: kind,
    footrestHeight,
    footrestRadius,
    footrestDouble: double,
    footrestGap: double ? gap : 0,
    footrestStagger: kind === 'perimeter' && staggerRoll,
    pedestalRingRadius: pedestal ? clamp(pedestalRoll, s.columnRadius * 1.6 + 0.1, s.seatWidth / 2 + 0.03) : 0,
    pedestalSpokes: pedestal ? spokes : 0,
  };
}

const WOOD_CHANCE = { bar: 0.5, counter: 0.6, diner: 0, milking: 0.95, drum: 0.5, slab: 0.85 };

export function generateStoolParams(g) {
  const style = rollStyle(g, STYLES);

  const shape = g.roll('shape', (r) => ({ ...NEUTRAL_SHAPE, ...SHAPES[style](r) }));

  const footrest = g.roll('footrest', (r) => footrestFor(r, style, shape));

  const palette = g.roll('palette', (r) => {
    const mood = weightedPick(r, [['neutral', 0.3], ['muted', 0.5], ['bold', 0.2]]);
    const cushion = fabricColor(r, { mood });
    const mode = r.pick(HARMONY_MODES);
    const accent = paintColor(r);
    return {
      cushionColor: cushion.hex,
      cushionSecondary: harmoniousSecondary(cushion, mode).hex,
      bodyColor: shade(cushion, -0.1, 0.85).hex,
      accentColor: accent.hex,
    };
  });

  const pattern = g.roll('pattern', (r) => ({ pattern: patternSpec(r) }));

  const finish = g.roll('finish', (r) => {
    const isWood = r.chance(WOOD_CHANCE[style]);
    let other = style === 'diner' ? weightedPick(r, [['metal', 0.7], ['black', 0.2], ['white', 0.1]]) : r.pick(['black', 'white', 'metal', 'match']);
    if (style === 'drum' && other === 'white') other = 'black';
    const wood = pickWood(r);
    const panRoll = r.next();
    const tint = r.range(-1, 1);
    const grainRoll = weightedPick(r, GRAIN_WEIGHTS);

    const frameMode = isWood ? 'wood' : other;
    const frameColor = {
      wood: hsl(wood.h, wood.s, wood.l),
      black: capSaturation(0.67, 0.05, 0.17 + tint * 0.03).hex,
      white: capSaturation(0.12, 0.1, 0.93 + tint * 0.02).hex,
      metal: capSaturation(0.6, 0.06, 0.66 + tint * 0.05).hex,
      match: palette.accentColor,
    }[frameMode];

    let panMode;
    if (style === 'drum') panMode = 'none';
    else if (style === 'diner' || shape.hasCushion) panMode = 'frame';
    else if (isWood) panMode = panRoll < 0.7 ? 'wood' : 'painted';
    else panMode = panRoll < 0.5 ? 'painted' : 'wood';

    const pan =
      panMode === 'wood'
        ? { panColor: hsl(wood.h, wood.s, wood.l + 0.04) }
        : panMode === 'painted'
          ? { panColor: palette.accentColor }
          : panMode === 'frame'
            ? { panColor: frameColor }
            : { panColor: null };
    const woodUsed = isWood || panMode === 'wood';

    return { frameMode, frameColor, woodName: woodUsed ? wood.name : null, panMode, ...pan, grain: woodUsed ? grainRoll : 'none' };
  });

  return { seed: g.seed, type: 'stool', style, ...shape, ...footrest, ...palette, ...pattern, ...finish };
}
