import { hsl, pickWood, pickLeather, STONE_TONES, FRAME_COLORS } from '../../core/color.js';
import { paintColor, accentColor, capSaturation } from '../../core/palette.js';
import { rollStyle, rollCycle, weightedPick } from '../../core/rng.js';
import { lerp } from '../../core/math.js';
import { CABINET_TEMPLATES, TEMPLATE_WEIGHTS } from './templates.js';

export const STYLE_WEIGHTS = { midcentury: 0.3, shaker: 0.26, industrial: 0.2, modern: 0.24 };
export const KIND_WEIGHTS = { sideboard: 0.3, dresser: 0.28, nightstand: 0.22, tv: 0.2 };

const at = (u) => ({ next: () => u });
const pickU = (u, weights) => weightedPick(at(u), weights);
const draws = (r, n) => Array.from({ length: n }, () => r.next());

const WIDTH = { sideboard: [1.2, 1.95], lowDresser: [0.9, 1.6], tallChest: [0.7, 1.0], nightstand: [0.4, 0.6], tv: [1.2, 1.95] };
const HEIGHT = {
  sideboard: [0.72, 0.9], lowDresser: [0.74, 0.95], tallChest: [1.05, 1.4], nightstand: [0.5, 0.68], tv: [0.4, 0.6],
};
const DEPTH = { sideboard: [0.4, 0.5], lowDresser: [0.42, 0.52], tallChest: [0.42, 0.52], nightstand: [0.35, 0.45], tv: [0.38, 0.48] };
const PANEL = { midcentury: [0.016, 0.022], shaker: [0.016, 0.022], modern: [0.016, 0.022], industrial: [0.02, 0.028] };
const TOP_T = { midcentury: [0.016, 0.025], shaker: [0.022, 0.032], industrial: [0.03, 0.05], modern: [0.016, 0.022] };
const OVERHANG = { midcentury: [0, 0.012], shaker: [0.015, 0.035], industrial: [0.01, 0.03], modern: [0, 0] };
export const BODY_MIN = { sideboard: 0.45, lowDresser: 0.55, tallChest: 0.85, nightstand: 0.26, tv: 0.24 };

function generateShape(g, style, kind) {
  return g.roll('shape', (r) => {
    const [uForm, uWidth, uHeight, uDepth, uPanel, uTopT, uOver, uEdge] = draws(r, 8);
    const form = kind === 'dresser' ? pickU(uForm, { lowDresser: 0.6, tallChest: 0.4 }) : kind;
    const topOverhang = lerp(OVERHANG[style], uOver);
    const width = Math.min(lerp(WIDTH[form], uWidth), 2.0 - 2 * topOverhang);
    let heightRange = HEIGHT[form];
    if (form === 'sideboard' && style === 'midcentury') heightRange = [0.68, 0.82];
    if (form === 'tv' && (style === 'midcentury' || style === 'modern')) heightRange = [0.4, 0.52];
    let height = lerp(heightRange, uHeight);
    if (form === 'sideboard') height = Math.min(height, width / 1.6);
    if (form === 'tv') height = Math.min(height, width / 2.5);
    const depth = Math.min(lerp(DEPTH[form], uDepth), 0.9 * width);
    const topThickness = lerp(TOP_T[style], uTopT);
    const topEdge = Math.min(lerp([0.003, 0.008], uEdge), 0.4 * topThickness);
    return { form, width, height, depth, panel: lerp(PANEL[style], uPanel), topThickness, topOverhang, topEdge };
  });
}

const BASE_WEIGHTS = {
  midcentury: { legs: 0.55, frameLegs: 0.25, plinth: 0.1, panelEnds: 0.1 },
  shaker: { legs: 0.35, skirt: 0.3, bun: 0.2, plinth: 0.15 },
  industrial: { metalFrame: 0.55, hairpin: 0.25, legs: 0.2 },
  modern: { plinth: 0.45, panelEnds: 0.3, legs: 0.25 },
};
const LEG_HEIGHT = {
  legs: { sideboard: [0.15, 0.3], tv: [0.12, 0.25], nightstand: [0.12, 0.26], lowDresser: [0.1, 0.22], tallChest: [0.08, 0.15] },
  hairpin: [0.18, 0.32],
  metalFrame: [0.1, 0.25],
  plinth: [0.05, 0.1],
  skirt: [0.07, 0.14],
  bun: [0.05, 0.09],
  panelEnds: [0.06, 0.15],
};
const LEG_THICKNESS = { midcentury: [0.03, 0.045], shaker: [0.035, 0.05], industrial: [0.02, 0.032], modern: [0.02, 0.032] };
const LEG_TAPER = { midcentury: [0.5, 0.7], shaker: [0.6, 0.8], industrial: [1, 1], modern: [0.7, 1] };
const LEG_INSET = { legs: [0.03, 0.1], frameLegs: [0.06, 0.15], hairpin: [0.05, 0.1], bun: [0.05, 0.1] };

const NEUTRAL_BASE = {
  legCount: 0, legThickness: 0, legSides: 0, legTaper: 1, legSplay: 0, legInsetX: 0, legInsetZ: 0, apronHeight: 0,
  plinthInset: 0, skirtCut: 'none', skirtCutHeight: 0, skirtFoot: 0, bunRadius: 0, endCut: 'none', postSize: 0,
  sideBrace: 'none', bottomShelf: false, bottomShelfHeight: 0,
};

function generateBase(g, style, shape) {
  return g.roll('base', (r) => {
    const [uKind, uLegH, uLegT, uSides, uTaper, uSplay, uInX, uInZ, uApron, uPlinth, uCut, uCutH, uFoot, uBun, uEndCut, uPost, uBrace, uShelf, uShelfH] = draws(r, 19);
    const { form, width, height, topThickness } = shape;
    let baseKind = pickU(uKind, BASE_WEIGHTS[style]);
    if (form === 'tallChest' && baseKind === 'hairpin') baseKind = 'metalFrame';
    const heightRange = baseKind === 'legs' || baseKind === 'frameLegs' ? LEG_HEIGHT.legs[form] : LEG_HEIGHT[baseKind];
    const legHeight = Math.max(0.05, Math.min(lerp(heightRange, uLegH), 0.4 * height, height - topThickness - BODY_MIN[form]));
    const base = { ...NEUTRAL_BASE, baseKind, legHeight };
    const footed = baseKind === 'legs' || baseKind === 'frameLegs' || baseKind === 'hairpin';
    if (footed) base.legCount = width > 1.5 ? 6 : 4;
    if (footed || baseKind === 'bun') {
      let inset = Math.min(lerp(LEG_INSET[baseKind], uInX), 0.15 * width);
      if (form === 'tallChest' && baseKind !== 'bun') inset = Math.min(inset, 0.1);
      base.legInsetX = inset;
      base.legInsetZ = lerp([0.03, 0.06], uInZ);
    }
    if (footed) {
      const hairpin = baseKind === 'hairpin';
      base.legThickness = hairpin ? lerp([0.01, 0.014], uLegT) : lerp(LEG_THICKNESS[style], uLegT);
      base.legSides = hairpin ? 6 : style === 'midcentury' ? pickU(uSides, [[8, 0.5], [6, 0.3], [4, 0.2]]) : style === 'modern' ? 8 : 4;
      base.legTaper = hairpin ? 1 : lerp(LEG_TAPER[style], uTaper);
      if (style === 'midcentury' && !hairpin) {
        const room = Math.max(0, base.legInsetX - base.legThickness / 2 - 0.004);
        base.legSplay = Math.min(lerp([0.01, 0.04], uSplay), 0.2 * legHeight, room);
      }
      if (!hairpin) base.legInsetZ = Math.max(base.legInsetZ, base.legThickness / 2 + base.legSplay + 0.004);
    }
    if (baseKind === 'frameLegs') base.apronHeight = lerp([0.03, 0.05], uApron);
    if (baseKind === 'plinth') base.plinthInset = style === 'modern' ? lerp([0.035, 0.06], uPlinth) : lerp([0.02, 0.05], uPlinth);
    if (baseKind === 'skirt') {
      base.skirtCut = pickU(uCut, { arch: 0.6, notch: 0.4 });
      base.skirtCutHeight = lerp([0.6, 0.85], uCutH) * legHeight;
      base.skirtFoot = lerp([0.06, 0.1], uFoot);
    }
    if (baseKind === 'bun') {
      base.bunRadius = Math.min(lerp([0.03, 0.045], uBun), base.legInsetX - 0.005);
      base.legInsetZ = Math.max(base.legInsetZ, base.bunRadius + 0.004);
    }
    if (baseKind === 'panelEnds') base.endCut = pickU(uEndCut, { none: 0.6, notch: 0.4 });
    if (baseKind === 'metalFrame') {
      base.postSize = lerp([0.025, 0.04], uPost);
      base.sideBrace = pickU(uBrace, { none: 0.7, x: 0.3 });
      base.bottomShelf = legHeight >= 0.15 && uShelf < 0.5;
      base.bottomShelfHeight = base.bottomShelf ? lerp([0.04, 0.08], uShelfH) : 0;
    }
    return base;
  });
}

const CONSTRUCTION = {
  midcentury: { overlay: 0.9, inset: 0.1 }, shaker: { overlay: 0.25, inset: 0.75 }, industrial: { overlay: 0.7, inset: 0.3 }, modern: { overlay: 1, inset: 0 },
};
const DOOR_STYLE = {
  midcentury: { slab: 0.7, insert: 0.2, framed: 0.1 }, shaker: { framed: 0.85, slab: 0.15 }, industrial: { slab: 0.5, insert: 0.3, framed: 0.2 }, modern: { slab: 1 },
};

function planLeaves(node) {
  return node.leaf ? [node] : node.children.flatMap(planLeaves);
}

function generateFronts(g, style, shape) {
  return g.roll('fronts', (r) => {
    const [uTemplate, uConstruction, uGap, uEdge, uFrame, uThick, uBevel, uDoorStyle, uDrawerStyle, uGrain, uA, uB, uC, uD, uE, uF, uGrade, uDoorFrame, uReveal] = draws(r, 19);
    const { form, width, panel } = shape;
    const template = pickU(uTemplate, TEMPLATE_WEIGHTS[form][style]);
    const construction = pickU(uConstruction, CONSTRUCTION[style]);
    const gap = style === 'modern' ? lerp([0.004, 0.008], uGap) : lerp([0.003, 0.006], uGap);
    const halfOverlay = style === 'industrial' || style === 'shaker';
    const edge = construction === 'inset' ? 0 : halfOverlay ? lerp([0.006, 0.012], uEdge) : lerp([0.001, 0.003], uEdge);
    const reveal = construction === 'inset' ? lerp([0.002, 0.003], uReveal) : 0;
    const frameWidth = Math.max(lerp([0.016, 0.025], uFrame), panel);
    const grade = style === 'midcentury' ? lerp([1, 1.12], uGrade) : style === 'shaker' ? lerp([1.08, 1.22], uGrade) : 1;
    const plan = CABINET_TEMPLATES[template].plan([uA, uB, uC, uD, uE, uF], grade, width);
    const doorStyle = pickU(uDoorStyle, DOOR_STYLE[style]);
    const insertKind = doorStyle !== 'insert' ? 'none' : style === 'industrial' ? 'perforated' : 'cane';
    const drawerStyle = style === 'shaker' ? pickU(uDrawerStyle, { slab: 0.7, framed: 0.3 }) : 'slab';
    const grainMode = style === 'midcentury' ? pickU(uGrain, { continuous: 0.7, classic: 0.3 }) : style === 'modern' ? pickU(uGrain, { continuous: 0.5, classic: 0.5 }) : 'classic';
    const hasFronts = planLeaves(plan).some((leaf) => leaf.leaf !== 'open');
    return {
      template, plan, construction, gap, edge, reveal, frameWidth, frontThickness: lerp([0.018, 0.022], uThick),
      frontBevel: lerp([0.003, 0.005], uBevel), doorStyle, insertKind, drawerStyle, doorFrameWidth: lerp([0.045, 0.07], uDoorFrame), grainMode, hasFronts,
    };
  });
}

const HANDLE_WEIGHTS = {
  midcentury: { lip: 0.35, knob: 0.2, bar: 0.15, cutout: 0.15, tab: 0.15 },
  shaker: { knob: 0.65, cup: 0.2, bar: 0.15 },
  industrial: { cup: 0.4, bar: 0.35, knob: 0.15, tab: 0.1 },
  modern: { cutout: 0.25, groove: 0.25, bar: 0.25, tab: 0.15, none: 0.1 },
};
const DOOR_HANDLE = { knob: 'knob', bar: 'bar', cup: 'bar', cutout: 'cutout', groove: 'groove', lip: 'lip', tab: 'tab', none: 'none' };
const PROJECTION = { knob: [0.022, 0.03], bar: [0.025, 0.035], cup: [0.02, 0.026], tab: [0.01, 0.014], lip: [0.012, 0.02] };

const NEUTRAL_HARDWARE = {
  drawerHandle: 'none', doorHandle: 'none', knobDiameter: 0, barScale: 0, barProfile: 'round', projection: 0, cupWidth: 0,
  cutoutWidth: 0, cutoutHeight: 0, lipFraction: 0, tabLength: 0, vPos: 'centre', doorInset: 0, doorDrop: 0,
};

function generateHardware(g, style, hasFronts) {
  return g.roll('hardware', (r) => {
    const [uKind, uKnob, uScale, uVPos, uInset, uDrop, uLip, uBar, uProfile, uCup, uCutW, uCutH, uTab, uLipMode] = draws(r, 14);
    if (!hasFronts) return { ...NEUTRAL_HARDWARE };
    const drawerHandle = pickU(uKind, HANDLE_WEIGHTS[style]);
    const projectionRange = PROJECTION[drawerHandle];
    return {
      drawerHandle,
      doorHandle: DOOR_HANDLE[drawerHandle],
      knobDiameter: lerp([0.025, 0.038], uKnob),
      barScale: lerp([0.75, 1.2], uBar),
      barProfile: style === 'industrial' && uProfile < 0.6 ? 'square' : 'round',
      projection: projectionRange ? lerp(projectionRange, uScale) : 0,
      cupWidth: lerp([0.076, 0.096], uCup),
      cutoutWidth: lerp([0.08, 0.12], uCutW),
      cutoutHeight: lerp([0.025, 0.035], uCutH),
      lipFraction: uLipMode < 0.5 ? 1 : lerp([0.35, 0.7], uLip),
      tabLength: lerp([0.045, 0.07], uTab),
      vPos: ['cutout', 'groove', 'lip'].includes(drawerHandle) ? 'top' : pickU(uVPos, { centre: 0.8, top: 0.2 }),
      doorInset: lerp([0.035, 0.06], uInset),
      doorDrop: lerp([0.05, 0.1], uDrop),
    };
  });
}

function generatePalette(g) {
  return g.roll('palette', (r) => {
    const paint = paintColor(r);
    const accent = accentColor(r, paint);
    return { paint: paint.hex, accent: accent.hex };
  });
}

export const WOOD_BIAS = {
  midcentury: { walnut: 0.45, honey: 0.2, oak: 0.15, cherry: 0.1, mahogany: 0.1 },
  shaker: { oak: 0.35, cherry: 0.35, honey: 0.15, walnut: 0.1, mahogany: 0.05 },
  industrial: { walnut: 0.3, oak: 0.3, mahogany: 0.2, honey: 0.2 },
  modern: { oak: 0.35, birch: 0.35, walnut: 0.2, honey: 0.1 },
};
const BODY_FINISH = { midcentury: { wood: 0.85, painted: 0.15 }, shaker: { wood: 0.45, painted: 0.55 }, industrial: { wood: 0.8, painted: 0.2 }, modern: { wood: 0.45, painted: 0.55 } };

function frontFinishWeights(style, bodyFinish) {
  const woodBody = bodyFinish === 'wood';
  if (style === 'midcentury') return woodBody ? { match: 0.75, painted: 0.25 } : { match: 1 };
  if (style === 'shaker') return { match: 0.85, accent: 0.15 };
  if (style === 'industrial') return { match: 0.5, metal: 0.5 };
  return woodBody ? { match: 0.5, accent: 0.3, painted: 0.2 } : { match: 0.7, accent: 0.3 };
}

function topFinishWeights(style, form, bodyFinish) {
  if (bodyFinish === 'painted') return style === 'shaker' ? { wood: 0.7, match: 0.3 } : { match: 0.8, wood: 0.2 };
  if ((style === 'midcentury' || style === 'modern') && (form === 'sideboard' || form === 'tv')) return { match: 0.85, stone: 0.15 };
  return { match: 1 };
}

const HARDWARE_WEIGHTS = {
  midcentury: { brass: 0.35, wood: 0.25, black: 0.2, metal: 0.2 },
  shaker: { wood: 0.55, black: 0.2, brass: 0.15, white: 0.1 },
  industrial: { black: 0.5, metal: 0.4, brass: 0.1 },
  modern: { metal: 0.35, black: 0.35, brass: 0.2, white: 0.1 },
};

function baseFinishWeights(style, baseKind) {
  if (baseKind === 'metalFrame' || baseKind === 'hairpin') return { black: 0.6, metal: 0.4 };
  if (baseKind === 'legs' || baseKind === 'frameLegs') {
    return { midcentury: { body: 0.7, black: 0.3 }, shaker: { body: 0.8, paint: 0.2 }, industrial: { black: 0.6, metal: 0.4 }, modern: { black: 0.5, body: 0.5 } }[style];
  }
  return { body: 1 };
}

const GRAIN_WEIGHTS = { wide: { fine: 0.25, plain: 0.55, bold: 0.2 }, normal: { fine: 0.45, plain: 0.45, bold: 0.1 }, small: { fine: 0.5, plain: 0.5, bold: 0 } };

const rolesOf = (roles) => Object.values(roles).filter(Boolean);
const keyKind = (key) => key.split(':')[0];
const keyColor = (key) => key.split(':')[1];
const key = (kind, hex) => `${kind}:${hex}`;

function foldRoles(roles, flags) {
  const distinct = () => new Set(rolesOf(roles)).size;
  if (distinct() > 4 && roles.base) {
    const woodBody = keyKind(roles.body) === 'wood';
    roles.base = woodBody || !roles.hardware ? roles.body : roles.hardware;
  }
  if (distinct() > 4 && roles.insert) roles.insert = roles.front;
  if (distinct() > 4) {
    roles.top = roles.body;
    flags.topFolded = true;
  }
  return roles;
}

function generateFinish(g, style, shape, base, fronts, hardware, palette) {
  const f = g.roll('finish', (r) => {
    const uBody = r.next();
    const uFront = r.next();
    const uTop = r.next();
    const wood = pickWood(r, { weights: WOOD_BIAS[style] });
    const uGrain = r.next();
    const stone = r.pick(STONE_TONES);
    const stoneL = stone.l + r.range(-0.03, 0.03);
    const uHw = r.next();
    const uHwJitter = r.next();
    const leather = pickLeather(r);
    const uBase = r.next();
    const paintSheen = 0.45 + r.next() * 0.35;
    const uInsert = r.next();
    const uMetal = r.next();
    return { uBody, uFront, uTop, wood, uGrain, stone, stoneL, uHw, uHwJitter, leather, uBase, paintSheen, uInsert, uMetal };
  });
  const { form } = shape;
  const bodyFinish = pickU(f.uBody, BODY_FINISH[style]);
  const frontFinish = pickU(f.uFront, frontFinishWeights(style, bodyFinish));
  let topFinish = pickU(f.uTop, topFinishWeights(style, form, bodyFinish));
  const woodHex = hsl(f.wood.h, f.wood.s, f.wood.l);
  const stoneHex = hsl(f.stone.h, f.stone.s, f.stoneL);
  const brass = capSaturation(0.11, 0.42 + (f.uHwJitter - 0.5) * 0.08, 0.5 + (f.uHwJitter - 0.5) * 0.06).hex;
  const metalFront = f.uMetal < 0.5 ? key('black', FRAME_COLORS.black) : key('metal', FRAME_COLORS.metal);
  const bodyKey = bodyFinish === 'wood' ? key('wood', woodHex) : key('solid', palette.paint);
  const frontKey = { match: bodyKey, painted: key('solid', palette.paint), accent: key('solid', palette.accent), metal: metalFront }[frontFinish];
  const topKey = { match: bodyKey, wood: key('wood', woodHex), stone: key('stone', stoneHex) }[topFinish];
  const hasParts = hardware.drawerHandle !== 'none' && hardware.drawerHandle !== 'cutout' && hardware.drawerHandle !== 'groove';
  let hardwareFinish = 'none';
  if (hasParts) {
    hardwareFinish = pickU(f.uHw, HARDWARE_WEIGHTS[style]);
    if (hardware.drawerHandle === 'lip') hardwareFinish = keyKind(frontKey) === 'wood' ? 'wood' : 'brass';
    if (hardware.drawerHandle === 'tab') hardwareFinish = 'leather';
  } else if (hardware.drawerHandle !== 'none') hardwareFinish = 'front';
  const hardwareKey = {
    none: null, front: null, brass: key('brass', brass), black: key('black', FRAME_COLORS.black), metal: key('metal', FRAME_COLORS.metal),
    white: key('white', FRAME_COLORS.white), leather: key('leather', f.leather.hex),
    wood: keyKind(frontKey) === 'wood' ? frontKey : key('wood', woodHex),
  }[hardwareFinish];
  const baseFinish = pickU(f.uBase, baseFinishWeights(style, base.baseKind));
  const baseKey = { body: bodyKey, black: key('black', FRAME_COLORS.black), metal: key('metal', FRAME_COLORS.metal), paint: key('solid', palette.paint) }[baseFinish];
  const cane = capSaturation(0.11, 0.32, 0.7 + (f.uInsert - 0.5) * 0.08).hex;
  const insertKey = fronts.insertKind === 'cane' ? key('cane', cane) : fronts.insertKind === 'perforated' ? key('perf', FRAME_COLORS.metal) : null;
  const roles = {
    body: bodyKey,
    front: fronts.hasFronts ? frontKey : null,
    top: topKey,
    hardware: fronts.hasFronts ? hardwareKey : null,
    base: baseKey,
    insert: fronts.hasFronts ? insertKey : null,
  };
  const flags = { topFolded: false };
  foldRoles(roles, flags);
  if (flags.topFolded) topFinish = 'match';
  const final = { ...roles, front: roles.front ?? roles.body };
  const colour = (role) => (roles[role] ? keyColor(roles[role]) : null);
  const used = rolesOf(roles);
  const woodUsed = used.some((k) => keyKind(k) === 'wood');
  const stoneUsed = keyKind(roles.top) === 'stone';
  const wide = form === 'sideboard' || form === 'tv';
  return {
    bodyFinish,
    frontFinish,
    topFinish,
    woodName: woodUsed ? f.wood.name : null,
    leatherName: f.leather.name,
    grain: woodUsed ? pickU(f.uGrain, wide ? GRAIN_WEIGHTS.wide : form === 'nightstand' ? GRAIN_WEIGHTS.small : GRAIN_WEIGHTS.normal) : 'none',
    stoneName: stoneUsed ? f.stone.name : null,
    hardwareFinish: roles.hardware ? hardwareFinish : hardwareFinish === 'front' ? 'front' : 'none',
    baseFinish,
    paintSheen: f.paintSheen,
    bodyColor: colour('body'),
    frontColor: keyColor(final.front),
    topColor: colour('top'),
    hardwareColor: colour('hardware'),
    baseColor: colour('base'),
    insertColor: colour('insert'),
    roles,
  };
}

export function generateCabinetParams(g) {
  const style = rollStyle(g, STYLE_WEIGHTS);
  const kind = rollCycle(g, 'kind', KIND_WEIGHTS);
  const shape = generateShape(g, style, kind);
  const base = generateBase(g, style, shape);
  const fronts = generateFronts(g, style, shape);
  const hardware = generateHardware(g, style, fronts.hasFronts);
  const palette = generatePalette(g);
  const finish = generateFinish(g, style, shape, base, fronts, hardware, palette);
  return { seed: g.seed, type: 'cabinet', style, kind, ...shape, ...base, ...fronts, ...hardware, ...palette, ...finish };
}

