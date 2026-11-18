import { FRAME_COLORS, pickWood } from '../../core/color.js';
import { HARMONY_MODES, accentColor, capSaturation, fabricColor, harmoniousSecondary, paintColor, shade, swatch } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp, lerp } from '../../core/math.js';
import { planPillows } from './layout.js';

export const STYLES = { platform: 0.22, slatted: 0.24, upholstered: 0.24, fourPoster: 0.15, bunk: 0.15 };

export const MAX_HEAD_WIDTH = 2.3;
export const ZONE_LIMIT = 0.85;
export const BUNK_LIMIT = 1.8;
export const POST_LIMIT = 2.2;

const fixed = (t) => ({ next: () => t });
const draws = (r, n) => Array.from({ length: n }, () => r.next());
const pickIndex = (list, t) => list[Math.min(list.length - 1, Math.floor(t * list.length))];
const round = (v) => Math.round(v * 1000) / 1000;

const WIDTHS = {
  platform: { 1.4: 0.2, 1.6: 0.35, 1.8: 0.45 },
  slatted: { 0.9: 0.2, 1.4: 0.3, 1.6: 0.3, 1.8: 0.2 },
  upholstered: { 1.4: 0.2, 1.6: 0.4, 1.8: 0.4 },
  fourPoster: { 1.4: 0.25, 1.6: 0.4, 1.8: 0.35 },
  bunk: { 0.9: 1 },
};
const TOPS = { platform: [0.3, 0.44], slatted: [0.45, 0.58], upholstered: [0.5, 0.62], fourPoster: [0.55, 0.7], bunk: [0.32, 0.42] };

export function sizeParams(r, style) {
  const t = draws(r, 5);
  const mattressWidth = Number(weightedPick(fixed(t[0]), WIDTHS[style]));
  const mattressThickness = lerp(style === 'bunk' ? [0.12, 0.16] : [0.16, 0.26], t[1]);
  const mattressTop = Math.max(lerp(TOPS[style], t[2]), mattressThickness + (style === 'platform' ? 0.12 : 0.18));
  return {
    mattressWidth,
    mattressLength: 2,
    mattressThickness,
    mattressTop,
    deckY: mattressTop - mattressThickness,
    clearance: lerp([0.01, 0.02], t[3]),
    mattressRadius: lerp([0.025, 0.05], t[4]),
  };
}

const FRAME_NEUTRAL = {
  headKind: 'none', headHeight: 0, headThickness: 0, headOverhang: 0, headSlatCount: 0, headSlatWidth: 0, archRise: 0,
  channelCount: 0, channelBulge: 0, wingDepth: 0, wingThickness: 0, shelfWidth: 0, shelfDepth: 0, shelfThickness: 0, shelfLift: 0,
  footKind: 'none', footHeight: 0, footSlatCount: 0, railHeight: 0, railThickness: 0, railRise: 0, postProfile: 'none', postSize: 0,
  postHeight: 0, canopy: false, canopyRailHeight: 0, finial: 0, support: 'none', legCount: 0, legHeight: 0, legThickness: 0,
  legSides: 0, legTaper: 0, legSplay: 0, legInset: 0, plinthHeight: 0, plinthInset: 0, slabThickness: 0, ledge: 0, bunkClearance: 0,
  guardAbove: 0, guardBars: 0, postCap: 0, upperRailBottom: 0, upperDeckY: 0, upperMattressTop: 0, guardTop: 0, ladderKind: 'none',
  ladderSide: null, ladderLean: 0, ladderWidth: 0, rungProfile: 'none', rungCount: 0, endFill: 'none',
};

export const BUNK_ACCESS = 0.4;
export const STILE_DEPTH = 0.03;

function slatPitch(width, t) {
  const pitch = lerp([0.1, 0.16], t);
  return clamp(Math.round(width / pitch), 5, 14);
}

function platformFrame(t, s) {
  const W = s.mattressWidth;
  const ledge = Math.min(lerp([0.03, 0.15], t[1]), (2.15 - W) / 2);
  const slabWidth = W + 2 * ledge;
  const support = t[2] < 0.6 ? 'plinth' : 'legs';
  let slabThickness;
  let legHeight = 0;
  let plinthHeight = 0;
  if (support === 'plinth') {
    slabThickness = clamp(lerp([0.06, 0.14], t[3]), 0.06, s.deckY - 0.03);
    plinthHeight = s.deckY - slabThickness;
  } else {
    legHeight = clamp(lerp([0.06, 0.15], t[4]), 0.06, Math.min(0.15, s.deckY - 0.06));
    slabThickness = s.deckY - legHeight;
  }
  const shelfWidth = Math.min(0.42, (MAX_HEAD_WIDTH - slabWidth) / 2);
  let headKind = weightedPick(fixed(t[0]), { none: 0.2, low: 0.5, wide: 0.3 });
  if (headKind === 'wide' && shelfWidth < 0.28) headKind = 'low';
  const wide = headKind === 'wide';
  const has = headKind !== 'none';
  const legs = support === 'legs';
  return {
    headKind,
    headHeight: has ? s.mattressTop + Math.max(0.18, lerp([0.2, 0.45], t[7])) : 0,
    headThickness: has ? lerp([0.04, 0.08], t[6]) : 0,
    headOverhang: headKind === 'low' ? Math.min(lerp([0, 0.05], t[8]), (MAX_HEAD_WIDTH - slabWidth) / 2) : 0,
    shelfWidth: wide ? shelfWidth : 0,
    shelfDepth: wide ? lerp([0.28, 0.38], t[9]) : 0,
    shelfThickness: wide ? lerp([0.03, 0.05], t[10]) : 0,
    shelfLift: wide ? lerp([-0.02, 0.08], t[11]) : 0,
    support,
    legCount: legs ? (W <= 1.4 ? 4 : 6) : 0,
    legHeight,
    legThickness: legs ? lerp([0.05, 0.08], t[12]) : 0,
    legSides: legs ? (t[13] < 0.5 ? 4 : 8) : 0,
    legTaper: legs ? lerp([0.7, 1], t[14]) : 0,
    legInset: legs ? lerp([0.08, 0.2], t[15]) : 0,
    plinthHeight,
    plinthInset: legs ? 0 : lerp([0.06, 0.18], t[5]),
    slabThickness,
    ledge,
  };
}

function railRiseOf(range, t, s, margin) {
  return Math.min(lerp(range, t), Math.max(0, s.mattressThickness - margin));
}

function slatted(t, s) {
  const W = s.mattressWidth;
  const postSize = lerp([0.045, 0.07], t[0]);
  const railThickness = Math.min(lerp([0.025, 0.045], t[1]), postSize);
  const railRise = railRiseOf([0, 0.08], t[2], s, 0.1);
  const railHeight = Math.min(lerp([0.1, 0.18], t[3]), s.deckY + railRise - 0.05);
  const headKind = weightedPick(fixed(t[4]), { vertical: 0.5, horizontal: 0.3, board: 0.2 });
  const footKind = weightedPick(fixed(t[5]), { none: 0.45, lowSlats: 0.3, lowBoard: 0.25 });
  const inner = W + 2 * s.clearance;
  const headSlatCount = headKind === 'vertical' ? slatPitch(inner, t[6]) : headKind === 'horizontal' ? 2 + Math.floor(t[6] * 3) : 0;
  const pitch = headKind === 'vertical' ? inner / headSlatCount : 0;
  const headSlatWidth = headKind === 'vertical' ? Math.min(lerp([0.03, 0.06], t[7]), 0.5 * pitch) : headKind === 'horizontal' ? lerp([0.06, 0.12], t[7]) : 0;
  const footSlatCount = footKind === 'lowSlats' ? slatPitch(inner, t[6]) : 0;
  return {
    headKind,
    headHeight: lerp([0.85, 1.05], t[8]),
    headThickness: lerp([0.018, 0.03], t[9]),
    headSlatCount,
    headSlatWidth,
    footKind,
    footHeight: footKind === 'none' ? s.deckY + railRise : s.mattressTop + lerp([0.05, 0.25], t[10]),
    footSlatCount,
    railHeight,
    railThickness,
    railRise,
    postProfile: weightedPick(fixed(t[11]), { square: 0.6, round: 0.4 }),
    postSize,
    postHeight: 0,
    support: 'posts',
  };
}

function upholsteredFrame(t, s) {
  const W = s.mattressWidth;
  const railThickness = lerp([0.06, 0.12], t[0]);
  const railRise = railRiseOf([0, 0.1], t[1], s, 0.1);
  const plinthHeight = lerp([0.02, 0.06], t[2]);
  const headKind = weightedPick(fixed(t[3]), { panel: 0.3, arch: 0.25, channel: 0.25, wingback: 0.2 });
  const headHeight = lerp([1.1, 1.4], t[4]);
  const base = W + 2 * s.clearance + 2 * railThickness;
  const headOverhang = Math.min(lerp([0.02, 0.1], t[6]), (MAX_HEAD_WIDTH - base) / 2);
  const headW = base + 2 * headOverhang;
  const channel = headKind === 'channel';
  return {
    headKind,
    headHeight,
    headThickness: lerp([0.08, 0.16], t[5]),
    headOverhang,
    archRise: headKind === 'arch' ? Math.min(lerp([0.06, 0.2], t[7]), 0.4 * (headHeight - s.mattressTop)) : 0,
    channelCount: channel ? clamp(Math.round(headW / 0.27) + Math.floor(t[8] * 3) - 1, 3, 7) : 0,
    channelBulge: channel ? lerp([0.02, 0.04], t[9]) : 0,
    wingDepth: headKind === 'wingback' ? lerp([0.12, 0.24], t[10]) : 0,
    wingThickness: headKind === 'wingback' ? Math.max(0.06, Math.min(lerp([0.08, 0.12], t[11]), railThickness + headOverhang)) : 0,
    footKind: 'rail',
    railHeight: s.deckY + railRise - plinthHeight,
    railThickness,
    railRise,
    support: 'plinth',
    plinthHeight,
    plinthInset: lerp([0.02, 0.05], t[12]),
  };
}

function fourPosterFrame(t, s) {
  const postProfile = weightedPick(fixed(t[0]), { turned: 0.35, square: 0.3, tapered: 0.15, thin: 0.2 });
  const thin = postProfile === 'thin';
  const postSize = thin ? lerp([0.03, 0.045], t[1]) : lerp([0.06, 0.1], t[1]);
  const headKind = weightedPick(fixed(t[2]), { panel: 0.45, arch: 0.35, slats: 0.2 });
  const headHeight = lerp([0.95, 1.25], t[3]);
  const railRise = railRiseOf([0.02, 0.08], t[4], s, 0.1);
  const upper = s.deckY + railRise - 0.18;
  const railHeight = Math.min(lerp([0.14, 0.22], t[5]), upper);
  const canopy = t[6] < 0.6;
  const finial = canopy ? 0 : thin ? lerp([0.03, 0.04], t[7]) : lerp([0.03, 0.06], t[7]);
  const footKind = weightedPick(fixed(t[8]), { rail: 0.5, panel: 0.5 });
  const inner = s.mattressWidth + 2 * s.clearance;
  const slats = headKind === 'slats';
  const headSlatCount = slats ? slatPitch(inner, t[9]) : 0;
  return {
    headKind,
    headHeight,
    headThickness: Math.min(lerp([0.03, 0.06], t[10]), postSize),
    headSlatCount,
    headSlatWidth: slats ? Math.min(lerp([0.03, 0.05], t[11]), 0.5 * (inner / headSlatCount)) : 0,
    archRise: headKind === 'arch' ? Math.min(lerp([0.06, 0.2], t[12]), 0.4 * (headHeight - s.mattressTop)) : 0,
    footKind,
    footHeight: footKind === 'panel' ? s.mattressTop + lerp([0.05, 0.25], t[13]) : s.deckY + railRise,
    railHeight,
    railThickness: Math.min(lerp([0.03, 0.05], t[14]), 0.9 * postSize),
    railRise,
    postProfile,
    postSize,
    postHeight: Math.min(Math.max(lerp([1.8, 2.15], t[15]), headHeight + 0.45), POST_LIMIT - finial),
    canopy,
    canopyRailHeight: canopy ? lerp([0.04, 0.07], t[16]) : 0,
    finial,
    support: 'posts',
  };
}

function bunkFrame(t, s) {
  const W = s.mattressWidth;
  const postSize = lerp([0.06, 0.09], t[0]);
  const railThickness = Math.min(lerp([0.03, 0.045], t[1]), postSize);
  const railRise = railRiseOf([0.03, 0.06], t[2], s, 0.06);
  const railHeight = Math.min(lerp([0.1, 0.14], t[3]), s.deckY + railRise - 0.06);
  const guardAbove = lerp([0.16, 0.22], t[4]);
  const guardBars = t[5] < 0.45 ? 1 : 2;
  const postCap = lerp([0, 0.05], t[6]);
  const rest = s.mattressTop + railHeight - railRise + s.mattressThickness + guardAbove + postCap;
  const bunkClearance = clamp(lerp([0.78, 0.92], t[7]), 0.78, Math.max(0.78, BUNK_LIMIT - rest));
  const upperRailBottom = s.mattressTop + bunkClearance;
  const upperRailTop = upperRailBottom + railHeight;
  const upperDeckY = upperRailTop - railRise;
  const upperMattressTop = upperDeckY + s.mattressThickness;
  const guardTop = upperMattressTop + guardAbove;
  const ladderKind = t[8] < 0.65 ? 'side' : 'end';
  const side = ladderKind === 'side';
  const pitch = lerp([0.24, 0.3], t[9]);
  const endFill = weightedPick(fixed(t[10]), { rails: 0.45, slats: 0.3, panel: 0.25 });
  return {
    headKind: endFill,
    footKind: side ? endFill : 'rungs',
    railHeight,
    railThickness,
    railRise,
    postProfile: 'square',
    postSize,
    postHeight: guardTop + postCap,
    support: 'posts',
    bunkClearance,
    guardAbove,
    guardBars,
    postCap,
    upperRailBottom,
    upperDeckY,
    upperMattressTop,
    guardTop,
    ladderKind,
    ladderSide: side ? (t[11] < 0.5 ? 'left' : 'right') : null,
    ladderLean: side && t[12] >= 0.6 ? lerp([0.1, 0.2], t[13]) : 0,
    ladderWidth: side ? lerp([0.32, 0.4], t[14]) : W + 2 * s.clearance,
    rungProfile: t[15] < 0.5 ? 'round' : 'flat',
    rungCount: Math.floor((upperRailTop - 0.22) / pitch) + 1,
    endFill,
  };
}

const FRAME_BUILDERS = { platform: platformFrame, slatted, upholstered: upholsteredFrame, fourPoster: fourPosterFrame, bunk: bunkFrame };

export function headDepthOf(f, style) {
  if (style === 'platform') return f.headKind === 'none' ? 0 : f.headThickness;
  if (style === 'upholstered') return f.headThickness + (f.headKind === 'channel' ? f.channelBulge : 0);
  return f.postSize;
}

export function footDepthOf(f, style, clearance) {
  if (style === 'platform') return Math.max(0, f.ledge - clearance);
  if (style === 'upholstered') return f.railThickness;
  return f.postSize;
}

export function headWidthOf(f, style, s) {
  if (style === 'platform') {
    const slab = s.mattressWidth + 2 * f.ledge;
    if (f.headKind === 'none') return slab;
    return f.headKind === 'wide' ? slab + 2 * f.shelfWidth : slab + 2 * f.headOverhang;
  }
  if (style === 'upholstered') return s.mattressWidth + 2 * s.clearance + 2 * f.railThickness + 2 * f.headOverhang;
  return s.mattressWidth + 2 * s.clearance + 2 * f.postSize;
}

export function ladderOutOf(f) {
  return f.ladderKind === 'side' ? Math.max(0, f.railThickness + STILE_DEPTH - 0.004 - f.postSize + f.ladderLean) : 0;
}

export function frameParams(r, style, s) {
  const t = draws(r, 20);
  const f = { ...FRAME_NEUTRAL, ...FRAME_BUILDERS[style](t, s) };
  const frameWidth = headWidthOf(f, style, s) + (style === 'bunk' ? ladderOutOf(f) : 0);
  const frameLength = headDepthOf(f, style) + s.clearance + s.mattressLength + s.clearance + footDepthOf(f, style, s.clearance);
  const top = style === 'bunk' ? f.postHeight : style === 'fourPoster' ? f.postHeight + f.finial : Math.max(f.headHeight, s.mattressTop);
  return { ...f, frameWidth, frameLength, overallHeight: top };
}

const ARRANGEMENT = {
  narrow: { single: 0.6, singleLean: 0.2, euroSingle: 0.2 },
  wide: { pair: 0.35, pairLean: 0.25, euroStack: 0.4 },
};
const COUNTS = {
  single: [1, 0], singleLean: [1, 0], euroSingle: [1, 1], pair: [2, 0], pairLean: [2, 0], euroStack: [2, 2],
};
const DEGRADE = {
  euroStack: ['pairLean', 'pair'], pairLean: ['pair'], singleLean: ['single'], euroSingle: ['single'], pair: [], single: [],
};

export function drapeFloorOf(style, s, f) {
  if (style === 'platform') return Math.max(0.05, s.deckY);
  if (style === 'bunk') return 0.05;
  return Math.max(0.05, s.deckY + f.railRise);
}

export function headRiseOf(style, s, f) {
  if (style === 'bunk' || f.headKind === 'none') return 0;
  return f.headHeight - s.mattressTop;
}

export function pillowContextOf(p) {
  return {
    arrangement: p.pillowArrangement,
    decoKind: p.decoKind,
    W: p.mattressWidth,
    cl: p.clearance,
    top: p.mattressTop,
    headRise: p.style === 'bunk' || p.headKind === 'none' ? 0 : p.headHeight - p.mattressTop,
    pillowWidth: p.pillowWidth,
    pillowLength: p.pillowLength,
    pillowThickness: p.pillowThickness,
    pillowPinch: p.pillowPinch,
    pillowLean: p.pillowLean,
    euroSize: p.euroSize,
    euroThickness: p.euroThickness,
    euroLean: p.euroLean,
    decoWidth: p.decoWidth,
    decoHeight: p.decoHeight,
    decoThickness: p.decoThickness,
    decoLean: p.decoLean,
  };
}

function beddingParams(r, style, s, f) {
  const t = draws(r, 44);
  const W = s.mattressWidth;
  const bunk = style === 'bunk';
  const headRise = headRiseOf(style, s, f);
  const baseArrangement = bunk ? 'single' : weightedPick(fixed(t[0]), W < 1.2 ? ARRANGEMENT.narrow : ARRANGEMENT.wide);
  const [pillowCount, baseEuro] = COUNTS[baseArrangement];
  const gap = (n) => (W - 0.04 - (n - 1) * 0.01) / n;
  const pillowWidth = Math.min(lerp([0.62, 0.76], t[1]), gap(pillowCount));
  const euroSize = Math.min(lerp([0.6, 0.8], t[2]), gap(Math.max(1, baseEuro)));
  const decoKind = bunk ? 'none' : weightedPick(fixed(t[3]), { none: 0.55, square: 0.25, lumbar: 0.2 });
  const square = decoKind === 'square';
  const decoSide = lerp([0.36, 0.45], t[4]);
  const decoWidth = decoKind === 'none' ? 0 : square ? decoSide : lerp([0.45, 0.55], t[4]);
  const decoHeight = decoKind === 'none' ? 0 : square ? decoSide : lerp([0.28, 0.34], t[5]);
  const base = {
    pillowWidth,
    pillowLength: lerp([0.46, 0.52], t[6]),
    pillowThickness: lerp([0.1, 0.16], t[7]),
    pillowPinch: lerp([0.35, 0.6], t[8]),
    euroSize,
    euroThickness: lerp([0.14, 0.2], t[9]),
    euroLean: lerp([10, 20], t[10]),
    decoWidth,
    decoHeight,
    decoThickness: decoKind === 'none' ? 0 : lerp([0.1, 0.14], t[11]),
    decoLean: decoKind === 'none' ? 0 : lerp([25, 40], t[12]),
    pillowLean: lerp([18, 30], t[13]),
  };
  const common = { W, cl: s.clearance, top: s.mattressTop, headRise, ...base };
  const chain = [baseArrangement, ...DEGRADE[baseArrangement]];
  const attempts = [];
  chain.forEach((arrangement, i) => {
    if (i === 0 && decoKind !== 'none') attempts.push([arrangement, decoKind]);
    attempts.push([arrangement, 'none']);
  });
  let chosen = null;
  for (const [arrangement, deco] of attempts) {
    const plan = planPillows({ ...common, arrangement, decoKind: deco });
    if (plan.ok && plan.zoneEnd <= s.clearance + ZONE_LIMIT) {
      chosen = { arrangement, deco };
      break;
    }
  }
  chosen ??= { arrangement: chain[chain.length - 1], deco: 'none' };
  const pillowArrangement = chosen.arrangement;
  const [count, euroCount] = COUNTS[pillowArrangement];
  const leaning = pillowArrangement.endsWith('Lean') || pillowArrangement === 'euroStack';
  const finalDeco = chosen.deco;
  const euroRoleDraw = t[14] < 0.5 ? 'accent' : 'bedding';

  const duvetKind = t[15] < 0.3 ? 'quilt' : 'duvet';
  const duvetThickness = round(
    Math.min(duvetKind === 'quilt' ? lerp([0.02, 0.035], t[16]) : lerp([0.045, 0.08], t[16]), bunk ? 0.05 : 1)
  );
  const duvetCrown = duvetKind === 'quilt' ? lerp([0, 0.01], t[17]) : lerp([0.01, 0.035], t[17]);
  const duvetFit = bunk ? 'tuck' : t[18] < 0.85 ? 'drape' : 'tuck';
  const footFit =
    duvetFit === 'drape' && (style === 'platform' || style === 'upholstered' || (style === 'slatted' && f.footKind === 'none')) ? 'drape' : 'tuck';
  const drapeFloor = drapeFloorOf(style, s, f);
  const reach = Math.max(0, s.mattressTop - drapeFloor - 0.01);
  const sideDrop = duvetFit === 'tuck' ? 0 : Math.min(lerp([0.12, 0.4], t[19]), reach);
  const footDrop = footFit === 'drape' ? sideDrop : 0;
  const cornerSag = duvetFit === 'drape' && footFit === 'drape' ? Math.min(lerp([0, 0.06], t[20]), Math.max(0, reach - sideDrop)) : 0;
  const foldDepth = t[21] < 0.25 ? 0 : lerp([0.18, 0.4], t[22]);
  const foldRollRaw = lerp([1, 1.4], t[23]) * duvetThickness;
  const foldRoll = foldDepth === 0 ? 0 : round(bunk ? Math.min(foldRollRaw, 0.06) : foldRollRaw);
  const throwKind = bunk ? (t[24] < 0.6 ? 'none' : 'folded') : t[24] < 0.4 ? 'none' : t[24] < 0.75 ? 'runner' : 'folded';
  const runner = throwKind === 'runner';
  const folded = throwKind === 'folded';
  return {
    pillowArrangement,
    pillowCount: count,
    euroCount,
    pillowWidth: base.pillowWidth,
    pillowLength: base.pillowLength,
    pillowThickness: base.pillowThickness,
    pillowPinch: base.pillowPinch,
    pillowLean: leaning ? base.pillowLean : 0,
    euroSize: euroCount > 0 ? base.euroSize : 0,
    euroThickness: euroCount > 0 ? base.euroThickness : 0,
    euroLean: euroCount > 0 ? base.euroLean : 0,
    euroRole: euroCount > 0 ? euroRoleDraw : null,
    decoKind: finalDeco,
    decoWidth: finalDeco === 'none' ? 0 : base.decoWidth,
    decoHeight: finalDeco === 'none' ? 0 : base.decoHeight,
    decoThickness: finalDeco === 'none' ? 0 : base.decoThickness,
    decoLean: finalDeco === 'none' ? 0 : base.decoLean,
    duvetKind,
    duvetThickness,
    duvetCrown,
    duvetFit,
    footFit,
    drapeFloor,
    sideDrop,
    footDrop,
    hemFlare: lerp([0, 0.025], t[25]),
    cornerSag,
    foldDepth,
    foldRoll,
    foldMaterial: foldDepth === 0 ? null : t[26] < 0.6 ? 'duvet' : 'sheet',
    wrinkle: lerp([0, 0.008], t[27]),
    wrinkleSeed: Math.floor(t[28] * 10000),
    throwKind,
    throwDepth: runner ? lerp([0.35, 0.6], t[29]) : 0,
    throwThickness: runner ? lerp([0.012, 0.025], t[30]) : 0,
    throwExtraDrop: runner && duvetFit === 'drape' ? Math.min(lerp([0.01, 0.05], t[31]), Math.max(0, reach - sideDrop - cornerSag)) : 0,
    throwWidth: folded ? lerp([0.45, 0.65], t[32]) : 0,
    throwFoldDepth: folded ? lerp([0.3, 0.42], t[33]) : 0,
    throwFoldThickness: folded ? lerp([0.04, 0.08], t[34]) : 0,
    throwYaw: folded ? lerp([-15, 15], t[35]) : 0,
    throwSide: folded ? (t[36] < 0.5 ? 'left' : 'right') : null,
    mattressSegments: bunk ? 2 : 3,
    duvetRes: bunk ? 'low' : 'full',
  };
}

export function bedPillowPlan(p) {
  return planPillows(pillowContextOf(p));
}

const DUVET_MOODS = { default: { neutral: 0.4, muted: 0.4, bold: 0.2 }, bunk: { neutral: 0.25, muted: 0.4, bold: 0.35 } };
const BEDDING_TONES = { white: 0.45, ivory: 0.3, tinted: 0.25 };
const UPHOLSTERY_MOODS = { neutral: 0.5, muted: 0.35, bold: 0.15 };

const apart = (color, reference) => (Math.abs(color.l - reference.l) < 0.08 ? shade(color, -0.12) : color);

function paletteParams(r, style) {
  const duvetMood = weightedPick(r, style === 'bunk' ? DUVET_MOODS.bunk : DUVET_MOODS.default);
  const beddingTone = weightedPick(r, BEDDING_TONES);
  const jitterA = r.next();
  const jitterB = r.next();
  const tinted = fabricColor(r, { mood: 'neutral' });
  const bedding =
    beddingTone === 'white' ? shade(swatch(FRAME_COLORS.white), (jitterA - 0.5) * 0.04) :
    beddingTone === 'ivory' ? capSaturation(0.11, lerp([0.18, 0.28], jitterA), lerp([0.86, 0.9], jitterB)) :
    shade(tinted, clamp(tinted.l, 0.74, 0.86) - tinted.l);
  const duvetBase = fabricColor(r, { mood: duvetMood });
  const duvet = apart(duvetBase, bedding);
  const secondaryMode = pickIndex(HARMONY_MODES, r.next());
  const accent = accentColor(r, duvet);
  const accentMode = pickIndex(HARMONY_MODES, r.next());
  const upholsteryMood = weightedPick(r, UPHOLSTERY_MOODS);
  const upholstery = apart(fabricColor(r, { mood: upholsteryMood }), duvet);
  return {
    duvetMood,
    beddingTone,
    beddingColor: bedding.hex,
    duvetColor: duvet.hex,
    duvetSecondary: harmoniousSecondary(duvet, secondaryMode).hex,
    accent: accent.hex,
    accentSecondary: harmoniousSecondary(accent, accentMode).hex,
    upholsteryColor: upholstery.hex,
  };
}

const DUVET_KINDS = {
  default: { none: 0.5, ticking: 0.15, gingham: 0.1, floral: 0.1, dots: 0.08, herringbone: 0.07 },
  bunk: { none: 0.3, gingham: 0.22, dots: 0.2, ticking: 0.18, floral: 0.1 },
};
const ACCENT_KINDS = { herringbone: 0.15, gingham: 0.15, dots: 0.15, floral: 0.1 };
const SIZES = {
  ticking: [[0.03, 0.06], [0.022, 0.034]],
  gingham: [[0.03, 0.06], [0.02, 0.035]],
  floral: [[0.14, 0.22], [0.09, 0.13]],
  dots: [[0.05, 0.09], [0.03, 0.05]],
  herringbone: [[0.03, 0.05], [0.022, 0.034]],
};

function patternSpec(kind, t, accent) {
  const size = round(lerp(SIZES[kind][accent ? 1 : 0], t[0]));
  if (kind === 'dots') return { kind, spacing: size, size: lerp(accent ? [0.18, 0.26] : [0.16, 0.24], t[1]), layout: t[2] < 0.7 ? 'offset' : 'grid' };
  if (kind === 'gingham') return { kind, spacing: size, overcheck: t[1] < 0.3 ? round(lerp([0.1, 0.18], t[2])) : 0 };
  if (kind === 'ticking') return { kind, spacing: size, width: lerp([0.1, 0.18], t[1]), direction: 'vertical', double: t[2] < 0.25 };
  if (kind === 'herringbone') return { kind, band: size, spacing: round(size / 3), width: lerp([0.4, 0.5], t[1]) };
  return { kind, spacing: size, petals: 5 + Math.floor(t[1] * 2), size: lerp([0.2, 0.26], t[2]), leaves: t[3] < 0.8 };
}

function patternParams(r, style) {
  const beddingTexture = weightedPick(r, { linen: 0.7, flat: 0.3 });
  const duvetKind = weightedPick(r, style === 'bunk' ? DUVET_KINDS.bunk : DUVET_KINDS.default);
  const duvetT = draws(r, 4);
  const duvetPattern = duvetKind === 'none' ? 'none' : patternSpec(duvetKind, duvetT, false);
  const patternedRoll = r.next();
  const accentKind = weightedPick(r, ACCENT_KINDS);
  const accentT = draws(r, 4);
  const accentPattern = patternedRoll < (duvetPattern === 'none' ? 0.55 : 0.2) ? patternSpec(accentKind, accentT, true) : 'none';
  return {
    beddingTexture,
    duvetPattern,
    accentPattern,
    accentTexture: weightedPick(r, { linen: 0.5, boucle: 0.3, flat: 0.2 }),
    upholsteryTexture: weightedPick(r, { linen: 0.45, boucle: 0.3, flat: 0.25 }),
    fabricThread: round(lerp([0.8, 1.3], r.next())),
  };
}

const FRAME_MODES = {
  platform: { wood: 0.6, paint: 0.25, black: 0.15 },
  slatted: { wood: 0.7, paint: 0.15, white: 0.15 },
  fourPoster: { wood: 0.6, black: 0.2, white: 0.1, metal: 0.1 },
  fourPosterThin: { black: 0.5, metal: 0.3, white: 0.2 },
  bunk: { wood: 0.55, paint: 0.25, white: 0.2 },
};

function finishParams(r, style, f) {
  const t = draws(r, 3);
  const wood = pickWood(r);
  const paint = paintColor(r);
  const grain = weightedPick(r, style === 'platform' ? { plain: 0.6, bold: 0.4 } : { plain: 0.5, fine: 0.3, bold: 0.2 });
  if (style === 'upholstered') return { frameMode: 'none', frameColor: null, woodName: null, paintName: null, grain: 'none' };
  const weights = style === 'fourPoster' && f.postProfile === 'thin' ? FRAME_MODES.fourPosterThin : FRAME_MODES[style];
  const frameMode = weightedPick(fixed(t[0]), weights);
  const jitter = (t[1] - 0.5) * 0.06;
  const frameColor = {
    wood: () => capSaturation(wood.h, wood.s, wood.l).hex,
    paint: () => paint.hex,
    black: () => shade(swatch(FRAME_COLORS.black), jitter).hex,
    white: () => shade(swatch(FRAME_COLORS.white), jitter).hex,
    metal: () => shade(swatch(FRAME_COLORS.metal), jitter).hex,
  }[frameMode]();
  return {
    frameMode,
    frameColor,
    woodName: frameMode === 'wood' ? wood.name : null,
    paintName: frameMode === 'paint' ? paint.name : null,
    grain: frameMode === 'wood' ? grain : 'none',
  };
}

export function generateBedParams(g) {
  const style = rollStyle(g, STYLES);
  const size = g.roll('size', (r) => sizeParams(r, style));
  const frame = g.roll('frame', (r) => frameParams(r, style, size));
  const bedding = g.roll('bedding', (r) => beddingParams(r, style, size, frame));
  const palette = g.roll('palette', (r) => paletteParams(r, style));
  const pattern = g.roll('pattern', (r) => patternParams(r, style));
  const finish = g.roll('finish', (r) => finishParams(r, style, frame));
  return { seed: g.seed, type: 'bed', style, ...size, ...frame, ...bedding, ...palette, ...pattern, ...finish };
}
