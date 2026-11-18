import { STYLES, generateBedParams } from './params.js';
import { buildBed } from './build.js';

const cm = (m) => String(Math.round(m * 100));

export const SIZE_FIELDS = ['mattressWidth', 'mattressLength', 'mattressThickness', 'mattressTop', 'deckY', 'clearance', 'mattressRadius'];
export const FRAME_FIELDS = [
  'headKind', 'headHeight', 'headThickness', 'headOverhang', 'headSlatCount', 'headSlatWidth', 'archRise', 'channelCount', 'channelBulge',
  'wingDepth', 'wingThickness', 'shelfWidth', 'shelfDepth', 'shelfThickness', 'shelfLift', 'footKind', 'footHeight', 'footSlatCount',
  'railHeight', 'railThickness', 'railRise', 'postProfile', 'postSize', 'postHeight', 'canopy', 'canopyRailHeight', 'finial', 'support',
  'legCount', 'legHeight', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'legInset', 'plinthHeight', 'plinthInset', 'slabThickness',
  'ledge', 'bunkClearance', 'guardAbove', 'guardBars', 'postCap', 'upperRailBottom', 'upperDeckY', 'upperMattressTop', 'guardTop',
  'ladderKind', 'ladderSide', 'ladderLean', 'ladderWidth', 'rungProfile', 'rungCount', 'endFill', 'frameWidth', 'frameLength', 'overallHeight',
];
export const BEDDING_FIELDS = [
  'pillowArrangement', 'pillowCount', 'euroCount', 'pillowWidth', 'pillowLength', 'pillowThickness', 'pillowPinch', 'pillowLean', 'euroSize',
  'euroThickness', 'euroLean', 'euroRole', 'decoKind', 'decoWidth', 'decoHeight', 'decoThickness', 'decoLean', 'duvetKind', 'duvetThickness',
  'duvetCrown', 'duvetFit', 'footFit', 'drapeFloor', 'sideDrop', 'footDrop', 'hemFlare', 'cornerSag', 'foldDepth', 'foldRoll', 'foldMaterial',
  'wrinkle', 'wrinkleSeed', 'throwKind', 'throwDepth', 'throwThickness', 'throwExtraDrop', 'throwWidth', 'throwFoldDepth',
  'throwFoldThickness', 'throwYaw', 'throwSide', 'mattressSegments', 'duvetRes',
];

export const usesAccent = (p) => p.throwKind !== 'none' || p.decoKind !== 'none' || p.euroRole === 'accent';

const kindName = (spec) => (spec.kind === 'gingham' && spec.overcheck > 0 ? 'gingham overcheck' : spec.kind === 'ticking' && spec.double ? 'double ticking' : spec.kind);
const textureName = (texture) => (texture === 'flat' ? 'plain' : texture === 'boucle' ? 'bouclé' : 'linen');

function headRow(p) {
  const h = `${cm(p.headHeight)} cm`;
  switch (p.headKind) {
    case 'none': return 'none';
    case 'low': return `low · ${h}`;
    case 'wide': return `wide · 2 shelves · ${h}`;
    case 'vertical': return `vertical slats × ${p.headSlatCount} · ${h}`;
    case 'horizontal': return `horizontal boards × ${p.headSlatCount} · ${h}`;
    case 'board': return `board · ${h}`;
    case 'channel': return `channel × ${p.channelCount} · ${h}`;
    case 'slats': return `slats × ${p.headSlatCount} · ${h}`;
    case 'rails':
    case 'panel':
      return p.style === 'bunk' ? `${p.headKind} ends` : `panel · ${h}`;
    default: return `${p.headKind} · ${h}`;
  }
}

function footRow(p) {
  switch (p.style) {
    case 'platform': return `ledge ${cm(p.ledge)} cm`;
    case 'bunk': return p.footKind === 'rungs' ? 'rungs' : `${p.footKind} ends`;
    default:
      if (p.footKind === 'none' || p.footKind === 'rail') return 'rail';
      if (p.footKind === 'lowSlats') return `low slats · ${cm(p.footHeight)} cm`;
      if (p.footKind === 'lowBoard') return `low board · ${cm(p.footHeight)} cm`;
      return `panel · ${cm(p.footHeight)} cm`;
  }
}

export default {
  id: 'bed',
  label: 'Bed',
  plural: 'beds',
  styles: STYLES,
  cell: { spacing: 2.6, gridSize: 9 },
  mixWeight: 0.5,
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    { id: 'size', label: 'Size', reads: ['style'], fields: SIZE_FIELDS },
    { id: 'frame', label: 'Frame', reads: ['style', 'size'], fields: FRAME_FIELDS },
    { id: 'bedding', label: 'Bedding', reads: ['style', 'size', 'frame'], fields: BEDDING_FIELDS },
    {
      id: 'palette',
      label: 'Colours',
      reads: ['style'],
      fields: ['duvetMood', 'beddingTone', 'beddingColor', 'duvetColor', 'duvetSecondary', 'accent', 'accentSecondary', 'upholsteryColor'],
    },
    {
      id: 'pattern',
      label: 'Pattern',
      reads: ['style'],
      fields: ['beddingTexture', 'duvetPattern', 'accentPattern', 'accentTexture', 'upholsteryTexture', 'fabricThread'],
    },
    {
      id: 'finish',
      label: 'Finish',
      reads: ['style', 'frame'],
      fields: ['frameMode', 'frameColor', 'woodName', 'paintName', 'grain'],
      appliesTo: (p) => p.style !== 'upholstered',
    },
  ],

  generateParams(g) {
    return generateBedParams(g);
  },

  build(p, kit) {
    const m = kit.materials;
    const plain = (color, texture) =>
      texture === 'flat'
        ? m.solid(color, 0.9)
        : m.pattern({ kind: 'linen', texture, colors: [color], thread: (texture === 'boucle' ? 0.01 : 0.005) * p.fabricThread, seed: p.seed }, { roughness: 0.9 });
    const printed = (spec, colors) => m.pattern({ ...spec, colors, seed: p.seed }, { roughness: 0.9 });
    const bedTexture = p.beddingTexture;
    const frame =
      p.style === 'upholstered' ? plain(p.upholsteryColor, p.upholsteryTexture) :
      p.frameMode === 'wood' ? m.wood(p.frameColor, { grain: p.grain, seed: p.seed }) :
      m.frame(p.frameColor, p.frameMode === 'metal' ? 'metal' : 'wood');
    const mats = {
      frame,
      bedding: plain(p.beddingColor, bedTexture),
      duvet: p.duvetPattern === 'none' ? plain(p.duvetColor, bedTexture) : printed(p.duvetPattern, [p.duvetColor, p.duvetSecondary]),
      accent: usesAccent(p) ? (p.accentPattern === 'none' ? plain(p.accent, p.accentTexture) : printed(p.accentPattern, [p.accent, p.accentSecondary])) : null,
    };
    return buildBed(p, mats);
  },

  describe(p) {
    const upholstered = p.style === 'upholstered';
    const bunk = p.style === 'bunk';
    const styleLabel =
      p.style === 'fourPoster' ? `four-poster${p.canopy ? ' (canopy)' : ''}` :
      bunk ? `bunk (ladder ${p.ladderKind === 'side' ? p.ladderSide : 'end'})` : p.style;
    const frameRows = [
      ['Size', `${cm(p.frameWidth)} × ${cm(p.frameLength)} × ${cm(p.overallHeight)} cm`],
      ['Headboard', headRow(p)],
      ['Foot', footRow(p)],
    ];
    if (p.postSize > 0) {
      const finial = p.finial > 0 ? ' · finials' : p.canopy ? ' · canopy' : '';
      frameRows.push(['Posts', `${p.postProfile}${p.postHeight > 0 ? ` · ${cm(p.postHeight)} cm` : ''}${finial}`]);
    }
    frameRows.push(['Base', p.support === 'legs' ? `legs × ${p.legCount} · ${cm(p.legHeight)} cm` : p.support]);
    if (bunk) frameRows.push(['Ladder', `${p.ladderKind} · ${p.rungCount} rungs`]);

    const extras = [];
    if (p.euroCount > 0) extras.push(`${p.euroCount} euro`);
    if (p.decoKind !== 'none') extras.push(p.decoKind === 'lumbar' ? 'lumbar' : 'square');
    const pillows = `${p.pillowCount}${extras.length ? ` + ${extras.join(' + ')}` : ''}`;
    const duvet = `${p.duvetKind} · ${p.duvetFit === 'drape' ? 'draped' : 'tucked'}${p.foldDepth > 0 ? ` · fold ${cm(p.foldDepth)} cm (${p.foldMaterial})` : ''}`;
    const throwRow = p.throwKind === 'runner' ? `runner ${cm(p.throwDepth)} cm` : p.throwKind === 'folded' ? 'folded' : 'none';
    const accentUsed = usesAccent(p);

    const patternRows = [
      ['Duvet', p.duvetPattern === 'none' ? textureName(p.beddingTexture) : kindName(p.duvetPattern)],
      ['Bedding', textureName(p.beddingTexture)],
    ];
    if (accentUsed) patternRows.push(['Accent', p.accentPattern === 'none' ? textureName(p.accentTexture) : kindName(p.accentPattern)]);
    if (upholstered) patternRows.push(['Upholstery', textureName(p.upholsteryTexture)]);

    const frameFinish =
      upholstered ? 'fabric upholstery' :
      p.frameMode === 'wood' ? `${p.woodName} wood · ${p.grain} grain` :
      p.frameMode === 'paint' ? `${p.paintName} paint` : p.frameMode;
    const paletteSwatches = [p.beddingColor, p.duvetColor, accentUsed ? p.accent : null, upholstered ? p.upholsteryColor : null].filter(Boolean);
    const swatches = [
      p.duvetColor,
      p.duvetPattern === 'none' ? null : p.duvetSecondary,
      p.beddingColor,
      accentUsed ? p.accent : null,
      upholstered ? p.upholsteryColor : p.frameColor,
    ].filter(Boolean);
    return {
      sections: [
        { group: 'style', rows: [['Style', styleLabel]] },
        {
          group: 'size',
          rows: [
            ['Mattress', `${cm(p.mattressWidth)} × ${cm(p.mattressLength)} · ${cm(p.mattressThickness)} cm`],
            ['Height', bunk ? `${cm(p.mattressTop)} / ${cm(p.upperMattressTop)} cm` : `mattress top ${cm(p.mattressTop)} cm`],
          ],
        },
        { group: 'frame', rows: frameRows },
        { group: 'bedding', rows: [['Pillows', pillows], ['Duvet', duvet], ['Throw', throwRow]] },
        { group: 'palette', rows: [['Colours', { swatches: paletteSwatches }]] },
        { group: 'pattern', rows: patternRows },
        { group: 'finish', rows: [['Frame', frameFinish]] },
      ],
      swatches,
    };
  },
};
