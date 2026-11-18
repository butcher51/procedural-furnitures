import { hsl, WOOD_TONES } from '../../core/color.js';

// Shape parameters per style. Every style returns the same field set
// (plus a few style-specific extras) so the UI can list them uniformly.

// Thin seat on tall straight legs
function classicShape(r) {
  const seatShape = r.pick(['square', 'rect', 'round']);
  const seatWidth = r.range(0.4, 0.58);
  const seatHeight = r.range(0.38, 0.52);
  const seatThickness = r.range(0.03, 0.08);
  return {
    seatShape, seatWidth, seatHeight, seatThickness,
    seatDepth: seatShape === 'rect' ? r.range(0.38, 0.52) : seatWidth,
    seatSides: r.pick([6, 8, 10, 12]), // only used for round seats
    puff: r.range(0.006, 0.02), // edge rounding radius
    legCount: r.int(1, 4),
    legThickness: r.range(0.025, 0.065),
    legSides: r.pick([4, 5, 6, 8]),
    legTaper: r.range(0.55, 1.0), // bottom radius as fraction of top
    legSplay: r.range(0, 0.07), // outward offset at the floor
    legHeight: seatHeight - seatThickness,
    backStyle: r.pick(['panel', 'slats', 'rails']),
    backHeight: r.range(0.25, 0.6),
    backWidth: (seatShape === 'round' ? seatWidth * 0.55 : seatWidth) * r.range(0.7, 1.0),
    backThickness: r.range(0.02, 0.045),
    backAngle: r.range(0, 22), // degrees, tilted backwards
    backBarCount: r.int(2, 6),
  };
}

// Fat upholstered armchair on stubby feet
function cozyShape(r) {
  const seatShape = r.pick(['square', 'rect']);
  const seatWidth = r.range(0.5, 0.75);
  const seatHeight = r.range(0.36, 0.46);
  const seatThickness = r.range(0.1, 0.18);
  const legCount = r.pick([4, 4, 4, 3, 2, 1]);
  // Legs only lift the body; a pedestal needs a bit more room for its column
  let legHeight = Math.min(r.range(0.04, 0.18), seatHeight - seatThickness - 0.06);
  if (legCount === 1) legHeight = Math.max(legHeight, 0.12);
  return {
    seatShape, seatWidth, seatHeight, seatThickness, legCount, legHeight,
    seatDepth: seatShape === 'rect' ? r.range(0.55, 0.8) : seatWidth,
    seatSides: 8,
    puff: r.range(0.04, 0.08),
    legThickness: r.range(0.04, 0.08),
    legSides: r.pick([4, 5, 6, 8]),
    legTaper: r.range(0.55, 1.0),
    legSplay: r.range(0, 0.03),
    hasArms: r.chance(0.7),
    armWidth: r.range(0.08, 0.2),
    armHeight: r.range(0.12, 0.26), // above the seat top
    backStyle: 'cushion',
    backHeight: r.range(0.4, 0.7),
    backWidth: seatWidth,
    backThickness: r.range(0.1, 0.2),
    backAngle: r.range(4, 26),
    backBarCount: 0,
  };
}

// Bentwood café chair: rounded seat, curved legs, hoop or bent backs
function curvyShape(r) {
  const seatWidth = r.range(0.4, 0.5);
  const seatHeight = r.range(0.42, 0.48);
  const seatThickness = r.range(0.025, 0.05);
  return {
    seatShape: 'curved', seatWidth, seatHeight, seatThickness,
    seatDepth: r.range(0.38, 0.48),
    seatExponent: r.range(2, 4), // superellipse: 2 = oval, 4 = squircle
    seatSides: 8,
    puff: r.range(0.008, 0.015),
    legCount: r.pick([4, 4, 4, 3]),
    legThickness: r.range(0.025, 0.045),
    legSides: 6,
    legTaper: 1,
    legSplay: r.range(0.03, 0.08), // amplitude of the leg curve
    legCurve: r.pick(['sabre', 'cabriole', 'bow']),
    legHeight: seatHeight - seatThickness,
    hasRing: r.chance(0.6),
    ringHeight: r.range(0.12, 0.25),
    backStyle: r.pick(['hoop', 'crest', 'bent panel']),
    backHeight: r.range(0.35, 0.55),
    backWidth: seatWidth * r.range(0.6, 0.85),
    backThickness: r.range(0.018, 0.03),
    backAngle: r.range(4, 18),
    backBarCount: r.int(3, 6),
  };
}

// Chance that the frame is wood, per style
const WOOD_CHANCE = { classic: 0.55, curvy: 0.8, cozy: 0.4 };

const SHAPES = { classic: classicShape, curvy: curvyShape, cozy: cozyShape };

export function generateChairParams(g) {
  const style = g.roll('style', (r) => {
    const roll = r.next();
    return roll < 0.35 ? 'classic' : roll < 0.65 ? 'curvy' : 'cozy';
  });

  const shape = g.roll('shape', (r) => ({ hasArms: false, armWidth: 0, armHeight: 0, ...SHAPES[style](r) }));

  const palette = g.roll('palette', (r) => {
    const hue = r.next();
    const sat = r.range(0.35, 0.75);
    const light = r.range(0.42, 0.62);
    return { hue, sat, light, secondaryMode: r.pick(['light', 'dark', 'complement', 'white']) };
  });

  const patterning = g.roll('pattern', (r) => ({
    pattern: r.pick(['solid', 'stripes', 'checker']),
    patternScale: r.int(3, 9),
    stripeDirection: r.pick(['horizontal', 'vertical']),
  }));

  const finish = g.roll('finish', (r) => {
    const isWood = r.chance(WOOD_CHANCE[style]);
    const frameMode = isWood ? 'wood' : r.pick(['black', 'white', 'metal', 'match']);
    const wood = r.pick(WOOD_TONES);
    const woodH = wood.h + r.range(-0.01, 0.01);
    const woodL = wood.l + r.range(-0.05, 0.05);
    const allWood = isWood && style !== 'cozy' && r.chance(style === 'curvy' ? 0.6 : 0.4);
    const planks = allWood ? { pattern: r.chance(0.4) ? 'stripes' : 'solid', patternScale: r.int(3, 5) } : null;
    return { isWood, frameMode, wood, woodH, woodL, allWood, planks };
  });

  const { hue, sat, light, secondaryMode } = palette;
  const { isWood, frameMode, wood, woodH, woodL, allWood, planks } = finish;

  let primary = hsl(hue, sat, light);
  const bodyColor = hsl(hue, sat * 0.85, light - 0.12);
  let secondary =
    secondaryMode === 'light' ? hsl(hue, 0.4, 0.85) :
    secondaryMode === 'dark' ? hsl(hue, 0.5, 0.22) :
    secondaryMode === 'complement' ? hsl((hue + 0.5) % 1, 0.55, 0.55) :
    '#f4f1ea';
  let { pattern, patternScale } = patterning;
  const { stripeDirection } = patterning;

  const frameColor = {
    wood: hsl(woodH, wood.s, woodL),
    black: '#2a2a2c',
    white: '#efefea',
    metal: '#a7abb0',
    match: hsl(hue, 0.4, 0.32),
  }[frameMode];

  if (allWood) {
    primary = hsl(woodH, wood.s, woodL + 0.04);
    secondary = hsl(woodH, wood.s, woodL - 0.04);
    pattern = planks.pattern;
    patternScale = planks.patternScale;
  }

  return {
    seed: g.seed,
    type: 'chair',
    style,
    ...shape,
    primary, secondary, bodyColor, frameMode, frameColor,
    woodName: isWood ? wood.name : null,
    allWood,
    pattern, patternScale, stripeDirection,
  };
}
