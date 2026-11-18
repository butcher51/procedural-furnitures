import { STYLES, generateSofaParams } from './params.js';
import { buildSofa } from './build.js';

const cm = (m) => String(Math.round(m * 100));

export default {
  id: 'sofa',
  label: 'Sofa',
  plural: 'sofas',
  styles: STYLES,
  cell: { spacing: 2.8, gridSize: 9 },
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    {
      id: 'shape',
      label: 'Shape',
      reads: ['style'],
      fields: [
        'width', 'depth', 'seatHeight', 'armStyle', 'armWidth', 'rollRadius', 'armOuter', 'armRise', 'innerSpan', 'backTop',
        'backFrameThickness', 'bodyPuff', 'returnSide', 'returnLength', 'returnWidth', 'headSide', 'headStyle', 'headHeight',
        'headLength', 'headIncline', 'backFraction',
      ],
    },
    {
      id: 'cushions',
      label: 'Cushions',
      reads: ['style', 'shape'],
      fields: [
        'seatCushionCount', 'seatThickness', 'cushionPuff', 'cushionGap', 'backMode', 'backCushionCount', 'backCushionHeight',
        'backCushionThickness', 'backCushionAngle', 'pillowCount', 'pillowSize', 'pillowThickness', 'pillowSide', 'pillowAngle',
        'cushionSegments',
      ],
    },
    {
      id: 'legs',
      label: 'Legs',
      reads: ['style', 'shape', 'cushions'],
      fields: ['legStyle', 'legCount', 'legHeight', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'plinthInset'],
    },
    { id: 'palette', label: 'Colours', reads: ['style'], fields: ['paletteMood', 'primary', 'secondary', 'bodyMode', 'bodyColor', 'accentColor', 'pillowSecondary', 'pillowPattern'] },
    { id: 'pattern', label: 'Pattern', reads: ['palette'], fields: ['fabricTexture', 'fabricThread', 'fabricPattern'] },
    { id: 'finish', label: 'Frame', reads: ['style', 'legs', 'palette'], fields: ['frameMode', 'frameColor', 'woodName', 'grain'] },
  ],

  generateParams(g) {
    return generateSofaParams(g);
  },

  build(p, kit) {
    const m = kit.materials;
    const plain = (color) => (p.fabricTexture === 'flat' ? m.solid(color, 0.9) : m.pattern({ kind: 'linen', texture: p.fabricTexture, colors: [color], thread: (p.fabricTexture === 'boucle' ? 0.01 : 0.005) * p.fabricThread, seed: p.seed }, { roughness: 0.9 }));
    const printed = (spec, colors) => m.pattern({ ...spec, colors, seed: p.seed }, { roughness: 0.9 });
    const mats = {
      surface: p.fabricPattern === 'none' ? plain(p.primary) : printed(p.fabricPattern, [p.primary, p.secondary]),
      body: plain(p.bodyColor),
      frame: p.frameMode === 'wood' ? m.wood(p.frameColor, { grain: p.grain, seed: p.seed }) : m.frame(p.frameColor, p.frameMode === 'metal' || p.frameMode === 'brass' ? 'metal' : 'wood'),
      accent: p.pillowCount === 0 ? null : p.pillowPattern === 'none' ? plain(p.accentColor) : printed(p.pillowPattern, [p.accentColor, p.pillowSecondary]),
    };
    return buildSofa(p, mats);
  },

  describe(p) {
    const chaise = p.style === 'chaise';
    const sectional = p.style === 'sectional';
    const side = chaise ? ` (head ${p.headSide})` : sectional ? ` (chaise ${p.returnSide})` : '';
    const height = chaise ? p.headHeight : p.backTop;
    const depth = sectional ? p.returnLength : p.depth;
    const legs =
      p.legStyle === 'plinth' ? `plinth ${cm(p.legHeight)} cm` :
      p.legStyle === 'sled' ? `sled · ${cm(p.legHeight)} cm` :
      `${p.legStyle} × ${p.legCount} · ${cm(p.legHeight)} cm`;
    const back =
      chaise ? (p.backFraction > 0 ? `half (${Math.round(p.backFraction * 100)} %)` : 'none') : `${cm(p.backTop)} cm`;
    const backCushions =
      p.backMode === 'tight' ? 'tight' : p.backMode === 'pillow' ? `pillow × ${p.backCushionCount}` : `loose × ${p.backCushionCount} · ${Math.round(p.backCushionAngle)}°`;
    const kindName = (spec) => (spec.kind === 'gingham' && spec.overcheck > 0 ? 'gingham overcheck' : spec.kind === 'ticking' && spec.double ? 'double ticking' : spec.kind);
    const fabric = p.fabricTexture === 'flat' ? 'plain' : p.fabricTexture === 'boucle' ? 'bouclé' : 'linen';
    const upholstery = p.fabricPattern === 'none' ? fabric : kindName(p.fabricPattern);
    const patternRows = [['Upholstery', upholstery]];
    if (p.pillowCount > 0) patternRows.push(['Pillows', p.pillowPattern === 'none' ? fabric : kindName(p.pillowPattern)]);
    const plinthBlack = p.legStyle === 'plinth' && p.frameMode === 'black';
    const swatches = [
      p.primary,
      p.fabricPattern === 'none' ? null : p.secondary,
      p.bodyColor !== p.primary ? p.bodyColor : null,
      p.pillowCount > 0 ? p.accentColor : null,
      p.pillowCount > 0 && p.pillowPattern !== 'none' ? p.pillowSecondary : null,
      plinthBlack ? null : p.frameColor,
    ].filter(Boolean);
    const shape = [
      ['Size', `${cm(p.width)} × ${cm(depth)} × ${cm(height)} cm`],
      ['Seat height', `${cm(p.seatHeight)} cm`],
    ];
    if (!chaise) shape.push(['Arms', p.armStyle === 'none' ? 'none' : `${p.armStyle} · ${cm(p.armWidth)} cm`]);
    if (chaise) shape.push(['Head', `${p.headStyle} · ${cm(p.headHeight)} cm · ${Math.round(p.headIncline)}°`]);
    shape.push(['Back', back]);
    const paletteSwatches = [p.primary, p.bodyColor !== p.primary ? p.bodyColor : null, p.pillowCount > 0 ? p.accentColor : null].filter(Boolean);
    return {
      sections: [
        { group: 'style', rows: [['Style', `${p.style}${side}`]] },
        { group: 'shape', rows: shape },
        {
          group: 'cushions',
          rows: [
            ['Seat cushions', `${p.seatCushionCount} × ${cm(p.seatThickness)} cm`],
            ['Back', backCushions],
            ['Pillows', p.pillowCount === 0 ? 'none' : p.pillowCount === 1 ? `1 (${p.pillowSide})` : String(p.pillowCount)],
          ],
        },
        { group: 'legs', rows: [['Legs', legs]] },
        { group: 'palette', rows: [['Colours', { swatches: paletteSwatches }]] },
        { group: 'pattern', rows: patternRows },
        { group: 'finish', rows: [['Frame', p.woodName ? `${p.woodName} wood · ${p.grain} grain` : p.frameMode]] },
      ],
      swatches,
    };
  },
};
