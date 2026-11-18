import { FRAME_COLORS, pickWood } from '../../core/color.js';
import { HARMONY_MODES, capSaturation, fabricColor, harmoniousSecondary, paintColor, shade } from '../../core/palette.js';
import { rollStyle, weightedPick } from '../../core/rng.js';
import { clamp } from '../../core/math.js';

export const STYLES = { park: 0.24, garden: 0.18, plank: 0.22, platform: 0.14, upholstered: 0.22 };

export const MAX_OVERALL_X = 1.95;
export const MAX_TOP = 0.93;


const NEUTRAL_SHAPE = {
  seatSlatCount: 0, slatGap: 0, slatWidth: 0, seatExponent: 10,
  hasArms: false, armHeight: 0, armWidth: 0,
  hasBack: false, backStyle: 'none', backHeight: 0, backAngle: 0, backThickness: 0, backBarCount: 0, backWidth: 0,
};

const NEUTRAL_BASE = {
  support: 'none', legCount: 0, legThickness: 0, legSides: 4, legTaper: 1, legSplay: 0, legInset: 0, apronHeight: 0,
  legHeight: 0, frameWidth: 0, frameThickness: 0, footNotch: 'none', hasStretcher: false, stretcherHeight: 0,
};

function clampBack(s) {
  const cos = Math.cos((s.backAngle * Math.PI) / 180);
  return { ...s, backHeight: Math.min(s.backHeight, (MAX_TOP - s.seatHeight) / cos) };
}

function withArms(r, s, armWidth, chance, outside) {
  const hasArms = r.chance(chance);
  const armHeight = r.range(0.18, 0.25);
  const width = r.range(armWidth[0], armWidth[1]);
  return {
    ...s,
    hasArms,
    armHeight: hasArms ? armHeight : 0,
    armWidth: hasArms ? width : 0,
    seatLength: Math.min(s.seatLength, MAX_OVERALL_X - (hasArms && outside ? 2 * width : 0)),
  };
}

const slatWidthOf = (s) => (s.seatDepth - (s.seatSlatCount - 1) * s.slatGap) / s.seatSlatCount;

function parkShape(r) {
  const s = {
    ...NEUTRAL_SHAPE,
    seatLength: r.range(1.2, 1.8), seatDepth: r.range(0.4, 0.48), seatHeight: r.range(0.42, 0.47),
    seatThickness: r.range(0.025, 0.04), seatSlatCount: r.int(4, 7), slatGap: r.range(0.008, 0.02), puff: r.range(0.003, 0.008),
  };
  const armed = withArms(r, s, [0.04, 0.06], 0.7, false);
  const back = {
    ...armed, hasBack: true, backStyle: 'boards', backHeight: r.range(0.3, 0.45), backAngle: r.range(10, 20),
    backThickness: r.range(0.02, 0.035), backBarCount: r.int(2, 4),
  };
  back.backWidth = back.seatLength;
  back.slatWidth = slatWidthOf(back);
  return clampBack(back);
}

function gardenShape(r) {
  const s = {
    ...NEUTRAL_SHAPE,
    seatLength: r.range(1.0, 1.6), seatDepth: r.range(0.4, 0.5), seatHeight: r.range(0.42, 0.47),
    seatThickness: r.range(0.025, 0.04), seatSlatCount: r.int(3, 6), slatGap: r.range(0.008, 0.02), puff: r.range(0.003, 0.008),
  };
  const armed = withArms(r, s, [0.05, 0.08], 0.8, true);
  const backStyle = weightedPick(r, { slats: 0.6, rails: 0.4 });
  const back = {
    ...armed, hasBack: true, backStyle, backHeight: r.range(0.35, 0.5), backAngle: r.range(5, 15),
    backThickness: r.range(0.02, 0.035),
  };
  const pitch = r.range(0.08, 0.14);
  const rails = r.int(2, 4);
  back.backWidth = back.seatLength;
  back.backBarCount = backStyle === 'slats' ? clamp(Math.round(back.backWidth / pitch), 6, 14) : rails;
  back.slatWidth = slatWidthOf(back);
  return clampBack(back);
}

function plankShape(r) {
  return {
    ...NEUTRAL_SHAPE,
    seatLength: r.range(1.0, 1.8), seatDepth: r.range(0.28, 0.4), seatHeight: r.range(0.42, 0.47),
    seatThickness: r.range(0.045, 0.09), seatExponent: r.range(6, 10), puff: r.range(0.004, 0.02),
  };
}

function platformShape(r) {
  const s = {
    ...NEUTRAL_SHAPE,
    seatLength: r.range(1.2, 1.8), seatDepth: r.range(0.4, 0.48), seatHeight: r.range(0.34, 0.4),
    seatThickness: r.range(0.022, 0.032), slatGap: r.range(0.012, 0.022), puff: r.range(0.003, 0.008),
  };
  const pitch = r.range(0.035, 0.06);
  s.seatSlatCount = clamp(Math.floor((s.seatLength + s.slatGap) / (pitch + s.slatGap)), 12, 30);
  s.slatWidth = (s.seatLength - (s.seatSlatCount - 1) * s.slatGap) / s.seatSlatCount;
  return s;
}

function upholsteredShape(r) {
  const s = {
    ...NEUTRAL_SHAPE,
    seatLength: r.range(0.9, 1.5), seatDepth: r.range(0.36, 0.48), seatHeight: r.range(0.42, 0.48),
    seatThickness: r.range(0.08, 0.16), puff: r.range(0.03, 0.06),
  };
  const wantsBack = r.chance(0.3);
  const height = s.seatThickness + r.range(0.12, 0.22);
  const angle = r.range(4, 10);
  const thickness = r.range(0.06, 0.1);
  const hasBack = wantsBack && s.seatLength >= 1.2;
  if (!hasBack) return s;
  return clampBack({
    ...s, hasBack, backStyle: 'cushion', backHeight: height, backAngle: angle, backThickness: thickness, backWidth: s.seatLength,
  });
}

const SHAPES = {
  park: parkShape, garden: gardenShape, plank: plankShape, platform: platformShape, upholstered: upholsteredShape,
};

function legLayout(r, s) {
  const six = r.chance(0.55);
  return six && s.seatLength >= 1.45 ? 6 : 4;
}

function limitInset(inset, s, lower) {
  return Math.min(Math.max(inset, lower), 0.12 * s.seatLength);
}

function stretcherOf(r, base, has) {
  const raw = r.range(0.08, 0.2);
  if (!has) return { hasStretcher: false, stretcherHeight: 0 };
  return { hasStretcher: true, stretcherHeight: Math.min(raw, 0.5 * base.legHeight) };
}

function parkBase(r, s) {
  const support = weightedPick(r, { scroll: 0.55, angular: 0.45 });
  const frameWidth = r.range(0.035, 0.06);
  const frameThickness = r.range(0.03, 0.06);
  const legInset = limitInset(r.range(0.06, 0.18), s, frameThickness / 2);
  return {
    ...NEUTRAL_BASE, support, frameWidth, frameThickness, legInset, legHeight: s.seatHeight - s.seatThickness,
  };
}

function gardenBase(r, s) {
  const legCount = legLayout(r, s);
  const legThickness = r.range(0.04, 0.06);
  const apronHeight = r.range(0.06, 0.1);
  const base = {
    ...NEUTRAL_BASE, support: 'legs', legCount, legThickness, legInset: legThickness / 2, apronHeight,
    legHeight: s.seatHeight - s.seatThickness,
  };
  return { ...base, ...stretcherOf(r, base, r.chance(0.5)) };
}

function plankBase(r, s) {
  const support = weightedPick(r, { staked: 0.45, slab: 0.3, trestle: 0.25 });
  const legHeight = s.seatHeight - s.seatThickness;
  if (support === 'staked') {
    const legCount = legLayout(r, s);
    const legThickness = r.range(0.035, 0.055);
    const legSides = r.pick([6, 8]);
    const legTaper = r.range(0.7, 1);
    const legSplay = r.range(0.04, 0.09);
    const legInset = limitInset(r.range(0.08, 0.2), s, 0.4 * legSplay + legThickness / 2);
    const base = { ...NEUTRAL_BASE, support, legCount, legThickness, legSides, legTaper, legSplay, legInset, legHeight };
    return { ...base, ...stretcherOf(r, base, r.chance(0.3)) };
  }
  if (support === 'slab') {
    const legThickness = r.range(0.03, 0.05);
    const legInset = limitInset(r.range(0, 0.12), s, legThickness);
    const footNotch = weightedPick(r, { v: 0.4, arch: 0.4, none: 0.2 });
    const base = { ...NEUTRAL_BASE, support, legThickness, legInset, legHeight, frameThickness: legThickness, footNotch };
    const has = stretcherOf(r, base, r.chance(0.5));
    if (has.hasStretcher && footNotch !== 'none') has.stretcherHeight = Math.max(has.stretcherHeight, 0.3 * legHeight + 0.03);
    return { ...base, ...has };
  }
  const legThickness = r.range(0.05, 0.09);
  const legInset = limitInset(r.range(0.12, 0.25), s, legThickness);
  const base = { ...NEUTRAL_BASE, support, legThickness, legInset, legHeight };
  return { ...base, ...stretcherOf(r, base, true) };
}

function platformBase(r, s) {
  const legCount = legLayout(r, s);
  const legThickness = r.range(0.03, 0.045);
  const legTaper = r.range(0.55, 0.8);
  const legSplay = r.range(0, 0.012);
  const apronHeight = r.range(0.04, 0.06);
  const legInset = limitInset(r.range(0.04, 0.12), s, legSplay + legThickness);
  return {
    ...NEUTRAL_BASE, support: 'legs', legCount, legThickness, legTaper, legSplay, legInset, apronHeight,
    legHeight: s.seatHeight - s.seatThickness - apronHeight,
  };
}

function upholsteredBase(r, s) {
  const support = weightedPick(r, { legs: 0.7, sled: 0.3 });
  const maxHeight = s.seatHeight - s.seatThickness - 0.08;
  if (support === 'legs') {
    const legCount = legLayout(r, s);
    const legThickness = r.range(0.03, 0.05);
    const legSides = r.pick([4, 6, 8]);
    const legTaper = r.range(0.55, 0.9);
    const legSplay = r.range(0, 0.02);
    const legInset = limitInset(r.range(0.03, 0.08), s, 0.7 * legSplay + legThickness / 2 + 0.005);
    const legHeight = Math.min(r.range(0.06, 0.2), maxHeight);
    return { ...NEUTRAL_BASE, support, legCount, legThickness, legSides, legTaper, legSplay, legInset, legHeight };
  }
  const legInset = limitInset(r.range(0.03, 0.08), s, 0.03);
  const legHeight = Math.min(r.range(0.12, 0.22), maxHeight);
  const frameWidth = r.range(0.025, 0.04);
  const frameThickness = r.range(0.025, 0.04);
  return { ...NEUTRAL_BASE, support, legInset, legHeight, frameWidth, frameThickness };
}

const BASES = {
  park: parkBase, garden: gardenBase, plank: plankBase, platform: platformBase, upholstered: upholsteredBase,
};

const SEAT_MATERIAL = {
  park: { wood: 0.8, painted: 0.2 },
  garden: { wood: 0.6, painted: 0.4 },
  plank: { wood: 1 },
  platform: { wood: 1 },
  upholstered: { fabric: 1 },
};

const FRAME_MODE = {
  park: { black: 0.45, match: 0.25, metal: 0.15, white: 0.15 },
  plank: { wood: 0.5, black: 0.35, white: 0.15 },
  platform: { black: 0.5, wood: 0.5 },
  upholstered: { wood: 0.6, black: 0.25, metal: 0.15 },
};

export function generateBenchParams(g) {
  const style = rollStyle(g, STYLES);
  const shape = g.roll('shape', (r) => SHAPES[style](r));
  const base = g.roll('base', (r) => BASES[style](r, shape));

  const palette = g.roll('palette', (r) => {
    const fabric = fabricColor(r);
    const mode = r.pick(HARMONY_MODES);
    const paint = paintColor(r);
    return { fabric, mode, paint };
  });

  const patterning = g.roll('pattern', (r) => ({
    fabricPattern: weightedPick(r, { solid: 0.45, stripes: 0.3, checker: 0.25 }),
    fabricScale: r.int(3, 9),
    stripeDirection: r.pick(['horizontal', 'vertical']),
    grainPattern: weightedPick(r, { solid: 0.5, stripes: 0.5 }),
    grainScale: r.int(3, 6),
  }));

  const finish = g.roll('finish', (r) => {
    const seatMaterial = weightedPick(r, SEAT_MATERIAL[style]);
    const wood = pickWood(r);
    const white = r.chance(0.5);
    const picked = style === 'garden' ? null : weightedPick(r, FRAME_MODE[style]);
    const frameMode = style === 'garden' ? (seatMaterial === 'wood' ? 'wood' : 'painted') : picked;
    return { seatMaterial, wood, white, frameMode };
  });

  const { fabric, mode, paint } = palette;
  const { seatMaterial, wood, white, frameMode } = finish;
  const fabricHex = fabric.hex;
  const fabricSecondary = harmoniousSecondary(fabric, mode).hex;
  const bodyColor = shade(fabric, -0.12, 0.85).hex;
  const paintHex = paint.hex;
  const woodColor = (dl) => capSaturation(wood.h, wood.s, wood.l + dl).hex;

  let seatColor;
  let seatSecondary;
  let pattern = 'solid';
  let patternScale = 1;
  if (seatMaterial === 'wood') {
    seatColor = woodColor(0.04);
    seatSecondary = woodColor(-0.04);
    pattern = patterning.grainPattern;
    patternScale = patterning.grainScale;
  } else if (seatMaterial === 'fabric') {
    seatColor = fabricHex;
    seatSecondary = fabricSecondary;
    pattern = patterning.fabricPattern;
    patternScale = patterning.fabricScale;
  } else {
    seatColor = style === 'garden' && white ? FRAME_COLORS.white : paintHex;
    seatSecondary = seatColor;
  }

  const matchSource = seatMaterial === 'painted' ? paint : fabric;
  const matchShade = shade(matchSource, matchSource.l > 0.4 ? -0.24 : 0.24, 0.8).hex;

  const frameColor = {
    wood: woodColor(0),
    black: FRAME_COLORS.black,
    white: FRAME_COLORS.white,
    metal: FRAME_COLORS.metal,
    match: matchShade,
    painted: seatColor,
  }[frameMode];

  return {
    seed: g.seed,
    type: 'bench',
    style,
    ...shape,
    ...base,
    fabricColor: fabricHex, fabricSecondary, bodyColor, paintColor: paintHex,
    fabricPattern: patterning.fabricPattern,
    fabricScale: patterning.fabricScale,
    stripeDirection: patterning.stripeDirection,
    grainPattern: patterning.grainPattern,
    grainScale: patterning.grainScale,
    seatMaterial,
    woodName: seatMaterial === 'wood' || frameMode === 'wood' ? wood.name : null,
    seatColor, seatSecondary, pattern, patternScale, frameMode, frameColor,
  };
}
