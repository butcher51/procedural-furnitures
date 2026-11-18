import { generateChairParams } from './params.js';
import { buildClassic, buildCozy, buildCurvy } from './build.js';

const BUILDERS = { classic: buildClassic, curvy: buildCurvy, cozy: buildCozy };

const cm = (m) => `${Math.round(m * 100)} cm`;

export default {
  id: 'chair',
  label: 'Chair',
  plural: 'chairs',
  styles: { classic: 0.35, curvy: 0.3, cozy: 0.35 },
  cell: { spacing: 1.7, gridSize: 13 },
  legacyRng: true,
  itemSeed: (sceneSeed, number) => `${sceneSeed}-${number}`,
  groups: [
    { id: 'style', label: 'Style', rerollable: false, fields: ['style'] },
    {
      id: 'shape',
      label: 'Shape',
      fields: [
        'hasArms', 'armWidth', 'armHeight', 'seatShape', 'seatWidth', 'seatHeight', 'seatThickness', 'seatDepth',
        'seatSides', 'seatExponent', 'puff', 'legCount', 'legThickness', 'legSides', 'legTaper', 'legSplay',
        'legCurve', 'legHeight', 'hasRing', 'ringHeight', 'backStyle', 'backHeight', 'backWidth', 'backThickness',
        'backAngle', 'backBarCount',
      ],
    },
    { id: 'palette', label: 'Colours', fields: ['bodyColor'] },
    { id: 'pattern', label: 'Pattern', fields: ['stripeDirection'] },
    {
      id: 'finish',
      label: 'Frame',
      reads: ['palette', 'pattern'],
      fields: ['frameMode', 'frameColor', 'woodName', 'allWood', 'primary', 'secondary', 'pattern', 'patternScale'],
    },
  ],

  generateParams(g) {
    return generateChairParams(g);
  },

  build(p, kit) {
    const m = kit.materials;
    const mats = {
      surface: m.surface({
        color: p.primary,
        secondary: p.secondary,
        pattern: p.pattern,
        scale: p.patternScale,
        direction: p.stripeDirection,
      }),
      frame: m.frame(p.frameColor, p.frameMode),
      body: m.solid(p.bodyColor, 0.9),
    };
    return BUILDERS[p.style](p, mats);
  },

  describe(p) {
    const cozy = p.style === 'cozy';
    const curvy = p.style === 'curvy';
    const swatches = [p.primary, p.pattern === 'solid' ? null : p.secondary, cozy ? p.bodyColor : null, p.frameColor].filter(Boolean);
    return {
      sections: [
        { group: 'style', rows: [['Style', p.style]] },
        {
          group: 'shape',
          rows: [
            ['Legs', curvy ? `${p.legCount} · ${p.legCurve}` : String(p.legCount)],
            ...(curvy ? [['Leg ring', p.hasRing ? `at ${cm(p.ringHeight)}` : 'none']] : []),
            ['Leg thickness', cm(p.legThickness)],
            ...(cozy ? [['Leg height', cm(p.legHeight)]] : []),
            ['Leg sides', String(p.legSides)],
            ['Leg splay', cm(p.legSplay)],
            ['Seat shape', p.seatShape],
            ['Seat height', cm(p.seatHeight)],
            ['Seat size', p.seatShape === 'round' ? `⌀ ${cm(p.seatWidth)}` : `${cm(p.seatWidth)} × ${cm(p.seatDepth)}`],
            ['Seat thickness', cm(p.seatThickness)],
            ...(cozy ? [['Arms', p.hasArms ? `${cm(p.armWidth)} wide` : 'none']] : []),
            ['Back style', p.backStyle],
            ['Back size', `${cm(p.backWidth)} × ${cm(p.backHeight)}`],
            ['Back angle', `${p.backAngle.toFixed(1)}°`],
          ],
        },
        { group: 'palette', rows: [['Colors', { swatches }]] },
        {
          group: 'pattern',
          rows: [['Pattern', p.pattern === 'stripes' ? `${p.allWood ? 'planks' : 'stripes'} (${p.stripeDirection})` : p.pattern]],
        },
        { group: 'finish', rows: [['Frame', p.woodName ? `${p.woodName} wood${p.allWood ? ' (all)' : ''}` : p.frameMode]] },
      ],
      swatches,
    };
  },
};
