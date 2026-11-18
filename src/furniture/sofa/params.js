import { FRAME_COLORS, pickWood } from '../../core/color.js';
import { HARMONY_MODES, accentColor, capSaturation, fabricColor, harmoniousSecondary, shade, swatch } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp, lerp } from '../../core/math.js';

export const STYLES = { sofa: 0.3, loveseat: 0.15, midcentury: 0.15, chaise: 0.15, sectional: 0.25 };

const SHAPE = {
  sofa: { width: [1.75, 2.3], depth: [0.85, 1.0], seat: [0.38, 0.46], backTop: [0.76, 0.92], arms: { track: 0.4, roll: 0.3, slope: 0.2, none: 0.1 }, frame: [0.14, 0.24], puff: [0.02, 0.05], rise: [0.16, 0.28] },
  loveseat: { width: [1.3, 1.65], depth: [0.8, 0.95], seat: [0.39, 0.46], backTop: [0.76, 0.9], arms: { track: 0.35, roll: 0.4, slope: 0.2, none: 0.05 }, frame: [0.14, 0.24], puff: [0.02, 0.05], rise: [0.16, 0.28] },
  midcentury: { width: [1.6, 2.1], depth: [0.78, 0.9], seat: [0.4, 0.45], backTop: [0.7, 0.8], arms: { track: 0.7, roll: 0, slope: 0, none: 0.3 }, frame: [0.08, 0.14], puff: [0.01, 0.025], rise: [0.14, 0.22] },
  chaise: { width: [1.5, 1.8], depth: [0.65, 0.85], seat: [0.38, 0.44], backTop: [0.6, 0.75], arms: { track: 0, roll: 0, slope: 0, none: 1 }, frame: [0.1, 0.16], puff: [0.02, 0.05], rise: [0.16, 0.28] },
  sectional: { width: [2.2, 2.55], depth: [0.88, 1.0], seat: [0.38, 0.45], backTop: [0.74, 0.88], arms: { track: 0.55, roll: 0.2, slope: 0, none: 0.25 }, frame: [0.14, 0.24], puff: [0.02, 0.05], rise: [0.16, 0.28] },
};

const rad = (deg) => (deg * Math.PI) / 180;
const fixed = (t) => ({ next: () => t });
const draws = (r, n) => Array.from({ length: n }, () => r.next());

export function shapeParams(r, style) {
  const c = SHAPE[style];
  const chaise = style === 'chaise';
  const sectional = style === 'sectional';
  const t = draws(r, 20);
  let width = lerp(c.width, t[0]);
  const depth = lerp(c.depth, t[1]);
  const seatHeight = lerp(c.seat, t[2]);
  const armStyle = weightedPick(fixed(t[3]), c.arms);
  const armWidthRange = armStyle === 'track' ? (style === 'midcentury' ? [0.05, 0.1] : [0.1, 0.22]) : armStyle === 'roll' ? [0.08, 0.16] : [0.1, 0.18];
  const armWidth = armStyle === 'none' ? 0 : lerp(armWidthRange, t[4]);
  const rollRadius = armStyle === 'roll' ? lerp([0.07, 0.11], t[5]) : 0;
  const armOuter = armStyle === 'roll' ? Math.max(armWidth, 2 * rollRadius) : armWidth;
  const armRise = armStyle === 'none' ? 0 : lerp(c.rise, t[6]);
  const headHeight = chaise ? Math.max(lerp([0.65, 0.85], t[13]), seatHeight + 0.25) : 0;
  const headLength = chaise ? lerp([0.18, 0.3], t[14]) : 0;
  if (style === 'loveseat') width = Math.max(width, 1.05 + 2 * armOuter);
  const innerSpan = chaise ? width - headLength : width - 2 * armOuter;
  let backTop = lerp(c.backTop, t[7]);
  if (chaise) backTop = Math.min(backTop, headHeight - 0.05);
  backTop = Math.max(backTop, seatHeight + armRise + 0.08);
  const returnLength = sectional ? Math.max(lerp([1.5, 1.9], t[10]), depth + 0.5) : 0;
  const returnWidth = sectional ? Math.min(lerp([0.75, 0.95], t[11]), innerSpan - 1.0) : 0;
  let headIncline = 0;
  if (chaise) {
    const maxIncline = (Math.atan((headLength - 0.07) / (headHeight - 0.02)) * 180) / Math.PI;
    headIncline = Math.min(lerp([10, 35], t[15]), maxIncline);
  }
  return {
    width, depth, seatHeight, armStyle, armWidth, rollRadius, armOuter, armRise, innerSpan, backTop,
    backFrameThickness: lerp(c.frame, t[8]),
    bodyPuff: lerp(c.puff, t[9]),
    returnSide: sectional ? (t[12] < 0.5 ? 'left' : 'right') : null,
    returnLength,
    returnWidth,
    headSide: chaise ? (t[16] < 0.5 ? 'left' : 'right') : null,
    headStyle: chaise ? (t[17] < 0.6 ? 'scroll' : 'plain') : 'none',
    headHeight,
    headLength,
    headIncline,
    backFraction: chaise ? (t[18] < 0.4 ? 0 : lerp([0.35, 0.7], t[19])) : 1,
  };
}

const SEAT_COUNT = {
  sofa: { 1: 0.15, 2: 0.35, 3: 0.5 },
  loveseat: { 2: 1 },
  midcentury: { 1: 0.4, 2: 0.35, 3: 0.25 },
  chaise: { 1: 1 },
  sectional: { 2: 0.5, 3: 0.5 },
};
const BACK_MODE = {
  sofa: { loose: 0.5, pillow: 0.25, tight: 0.25 },
  loveseat: { loose: 0.45, pillow: 0.35, tight: 0.2 },
  midcentury: { loose: 0.3, pillow: 0, tight: 0.7 },
  chaise: { loose: 0, pillow: 0, tight: 1 },
  sectional: { loose: 0.55, pillow: 0.3, tight: 0.15 },
};
const SEAT_THICKNESS = { sofa: [0.1, 0.18], loveseat: [0.1, 0.18], midcentury: [0.08, 0.13], chaise: [0.08, 0.14], sectional: [0.1, 0.18] };
const CUSHION_PUFF = { midcentury: [0.012, 0.03] };

export function usableSeatDepth(p) {
  if (p.backMode === 'tight' || p.backCushionCount === 0) return p.depth - p.backFrameThickness;
  const a = rad(p.backCushionAngle);
  return p.depth - p.backFrameThickness - p.backCushionThickness * Math.cos(a) - p.backCushionHeight * Math.sin(a);
}

export function cushionParams(r, style, s) {
  const t = draws(r, 16);
  const sectional = style === 'sectional';
  const chaise = style === 'chaise';
  const seatSpan = sectional ? s.innerSpan - s.returnWidth : s.innerSpan;
  const wanted = Number(weightedPick(fixed(t[0]), SEAT_COUNT[style]));
  const seatCushionCount = chaise ? 1 : clamp(s.width >= 1.9 ? Math.max(2, wanted) : wanted, 1, Math.max(1, Math.floor(seatSpan / 0.45)));
  const seatThickness = lerp(SEAT_THICKNESS[style], t[1]);
  const cushionPuff = lerp(CUSHION_PUFF[style] ?? [0.025, 0.06], t[2]);
  const cushionGap = lerp([0, 0.012], t[3]);
  const backMode = weightedPick(fixed(t[4]), BACK_MODE[style]);
  const loose = backMode !== 'tight';
  const cap = Math.min(4, Math.max(1, Math.floor(s.innerSpan / 0.45)));
  const options = sectional ? [seatCushionCount + 1] : [seatCushionCount, 2, 3];
  const backCount = loose ? clamp(options[Math.min(options.length - 1, Math.floor(t[5] * options.length))], 1, cap) : 0;
  const pillowMode = backMode === 'pillow';
  const cushionAngle = lerp([6, 20], t[6]);
  const a = rad(cushionAngle);
  const cosA = Math.cos(a), sinA = Math.sin(a);
  const cushionBottom = s.seatHeight - seatThickness;
  let thickness = lerp(pillowMode ? [0.16, 0.24] : [0.12, 0.2], t[7]);
  let height = lerp(pillowMode ? [0.4, 0.55] : [0.32, 0.48], t[8]);
  const overshoot = pillowMode ? 0.06 : 0;
  if (loose) {
    thickness = Math.max(0.06, Math.min(thickness, (s.depth - s.backFrameThickness - 0.45 - height * sinA) / cosA));
    height = Math.max(0.14, Math.min(height, (s.backTop + overshoot - cushionBottom - thickness * sinA) / cosA, (s.depth - s.backFrameThickness - 0.45 - thickness * cosA) / sinA));
  }
  const headRoom = chaise ? s.headHeight - s.seatHeight - 0.1 : 1;
  const pillowCount = chaise ? (t[9] < 0.6 || headRoom < 0.24 ? 0 : 1) : t[9] < 0.45 ? 0 : t[9] < 0.65 ? 1 : 2;
  const base = {
    seatCushionCount, seatThickness, cushionPuff, cushionGap, backMode,
    backCushionCount: backCount,
    backCushionHeight: loose ? height : 0,
    backCushionThickness: loose ? thickness : 0,
    backCushionAngle: loose ? cushionAngle : 0,
    pillowCount,
  };
  const usable = usableSeatDepth({ ...s, ...base });
  const pillowSize = chaise
    ? Math.max(0.2, Math.min(lerp([0.34, 0.48], t[10]), s.depth - 0.15, headRoom))
    : Math.max(0.2, Math.min(lerp([0.34, 0.48], t[10]), usable - 0.05, seatSpan / 3));
  const totalCushions = seatCushionCount + backCount + (sectional ? 1 : 0);
  return {
    ...base,
    pillowSize,
    pillowThickness: lerp([0.1, 0.15], t[11]),
    pillowSide: t[12] < 0.5 ? 'left' : 'right',
    pillowAngle: lerp([10, 22], t[13]),
    cushionSegments: totalCushions <= 4 ? 3 : 2,
  };
}

const LEG_STYLE = {
  sofa: { block: 0.35, bun: 0.2, tapered: 0.3, sled: 0, plinth: 0.15 },
  loveseat: { block: 0.3, bun: 0.35, tapered: 0.25, sled: 0, plinth: 0.1 },
  midcentury: { block: 0, bun: 0, tapered: 0.75, sled: 0.25, plinth: 0 },
  chaise: { block: 0.25, bun: 0.35, tapered: 0.4, sled: 0, plinth: 0 },
  sectional: { block: 0.45, bun: 0, tapered: 0.25, sled: 0, plinth: 0.3 },
};
const LEG_HEIGHT = { block: [0.03, 0.08], bun: [0.04, 0.08], tapered: [0.1, 0.2], sled: [0.12, 0.2], plinth: [0.02, 0.05] };
const LEG_THICKNESS = { block: [0.04, 0.07], bun: [0.06, 0.1], tapered: [0.035, 0.05], sled: [0.03, 0.045], plinth: [0, 0] };
const LEG_SIDES = { block: [4], bun: [8], tapered: [5, 6, 8], sled: [4, 8], plinth: [4] };

export function legParams(r, style, s, c) {
  const t = draws(r, 8);
  const legStyle = weightedPick(fixed(t[0]), LEG_STYLE[style]);
  const heightRange = legStyle === 'tapered' && style === 'midcentury' ? [0.14, 0.22] : LEG_HEIGHT[legStyle];
  const legHeight = clamp(lerp(heightRange, t[1]), 0.02, s.seatHeight - c.seatThickness - 0.08);
  const sides = LEG_SIDES[legStyle];
  const legCount =
    legStyle === 'sled' ? 2 : legStyle === 'plinth' ? 0 : style === 'chaise' ? 4 : style === 'sectional' ? (s.width > 2.3 ? 7 : 6) : s.width < 1.9 ? 4 : 6;
  return {
    legStyle,
    legCount,
    legHeight,
    legThickness: lerp(LEG_THICKNESS[legStyle], t[2]),
    legSides: sides[Math.min(sides.length - 1, Math.floor(t[3] * sides.length))],
    legTaper: legStyle === 'block' ? lerp([0.85, 1], t[4]) : legStyle === 'tapered' ? lerp([0.5, 0.75], t[4]) : 1,
    legSplay: legStyle === 'tapered' ? Math.min(lerp([0, 0.04], t[5]), 0.3 * legHeight) : 0,
    plinthInset: legStyle === 'plinth' ? lerp([0.02, 0.05], t[6]) : 0,
  };
}

const MOODS = {
  midcentury: { neutral: 0.25, muted: 0.4, bold: 0.35 },
  default: { neutral: 0.4, muted: 0.4, bold: 0.2 },
};

export function paletteParams(r, style) {
  const paletteMood = weightedPick(r, MOODS[style] ?? MOODS.default);
  const base = fabricColor(r, { mood: paletteMood });
  const secondaryMode = HARMONY_MODES[Math.min(HARMONY_MODES.length - 1, Math.floor(r.next() * HARMONY_MODES.length))];
  const bodyPick = r.next();
  const bodyJitter = r.next();
  const bodyMode = bodyPick < 0.5 ? 'same' : bodyPick < 0.85 ? 'match' : 'contrast';
  const bodyColor =
    bodyMode === 'same' ? base.hex :
    bodyMode === 'match' ? shade(base, -lerp([0.06, 0.12], bodyJitter)).hex :
    capSaturation(base.h, 0.08, base.l > 0.5 ? lerp([0.26, 0.34], bodyJitter) : lerp([0.74, 0.82], bodyJitter)).hex;
  const accent = accentColor(r, base);
  return {
    paletteMood,
    primary: base.hex,
    secondary: harmoniousSecondary(base, secondaryMode).hex,
    bodyMode,
    bodyColor,
    accentColor: accent.hex,
  };
}

export function patternParams(r) {
  return {
    pattern: weightedPick(r, { solid: 0.6, stripes: 0.25, checker: 0.15 }),
    patternScale: r.int(2, 6),
    stripeDirection: r.pick(['horizontal', 'vertical']),
  };
}

const WOOD_CHANCE = { sofa: 0.55, loveseat: 0.6, midcentury: 0.75, chaise: 0.7, sectional: 0.45 };

export function finishParams(r, style, legStyle, primary) {
  const t = draws(r, 6);
  const wood = pickWood(r);
  let frameMode;
  if (legStyle === 'sled') frameMode = t[0] < 0.6 ? 'metal' : 'black';
  else if (legStyle === 'plinth') frameMode = t[0] < 0.6 ? 'black' : 'wood';
  else if (t[0] < WOOD_CHANCE[style]) frameMode = 'wood';
  else frameMode = weightedPick(fixed(t[1]), { black: 0.45, metal: 0.25, brass: 0.15, match: 0.15 });
  const jitter = (t[2] - 0.5) * 0.06;
  const frameColor = {
    wood: capSaturation(wood.h, wood.s, wood.l).hex,
    black: shade(swatch(FRAME_COLORS.black), jitter).hex,
    metal: shade(swatch(FRAME_COLORS.metal), jitter).hex,
    brass: capSaturation(0.11, lerp([0.45, 0.55], t[3]), lerp([0.5, 0.58], t[4])).hex,
    match: shade(swatch(primary), -0.2, 0.8).hex,
  }[frameMode];
  return { frameMode, frameColor, woodName: frameMode === 'wood' ? wood.name : null };
}

export function generateSofaParams(g) {
  const style = rollStyle(g, STYLES);
  const shape = g.roll('shape', (r) => shapeParams(r, style));
  const cushions = g.roll('cushions', (r) => cushionParams(r, style, shape));
  const legs = g.roll('legs', (r) => legParams(r, style, shape, cushions));
  const palette = g.roll('palette', (r) => paletteParams(r, style));
  const pattern = g.roll('pattern', patternParams);
  const finish = g.roll('finish', (r) => finishParams(r, style, legs.legStyle, palette.primary));
  return { seed: g.seed, type: 'sofa', style, ...shape, ...cushions, ...legs, ...palette, ...pattern, ...finish };
}
