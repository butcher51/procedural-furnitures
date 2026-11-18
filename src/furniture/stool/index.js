import { FIELDS, STYLES, footrestApplies, generateStoolParams, patternLabel } from './params.js';
import { BUILDERS } from './build.js';

const cm = (m) => `${Math.round(m * 100)} cm`;

const heightClass = (h) => (h < 0.5 ? 'low' : h <= 0.69 ? 'counter' : 'bar');

function usesCushion(p) {
  return p.hasCushion || p.style === 'drum';
}

function seatText(p) {
  if (p.seatShape === 'round') return `round ⌀ ${cm(p.seatWidth)}`;
  return `${p.seatShape} ${cm(p.seatWidth)} × ${cm(p.seatDepth)}`;
}

function legsText(p) {
  if (p.style === 'diner') return p.hasSleeve ? 'column · sleeve' : 'column';
  if (p.style === 'drum') {
    const base = p.drumBase === 'feet' ? `${p.legCount} feet` : p.drumBase === 'plinth' ? 'plinth' : 'flat base';
    return `${p.drumProfile} · ${base}`;
  }
  if (p.style === 'slab') return `2 panels · ${p.slabCutout === 'none' ? 'plain' : p.slabCutout}`;
  return `${p.legCount} · splay ${cm(p.legSplay)} · ${(p.legThickness * 100).toFixed(1)} cm thick`;
}

function footrestText(p) {
  switch (p.footrestKind) {
    case 'ring':
      return p.footrestDouble
        ? `double ring at ${cm(p.footrestHeight)} / ${cm(p.footrestHeight + p.footrestGap)}`
        : `ring at ${cm(p.footrestHeight)}`;
    case 'perimeter':
      return `rails at ${cm(p.footrestHeight)}${p.footrestStagger ? ' (staggered)' : ''}`;
    case 'h':
      return `H at ${cm(p.footrestHeight)}`;
    case 'pedestalRing':
      return `pedestal ring ⌀ ${cm(p.pedestalRingRadius * 2)}`;
    case 'stretcher':
      return `stretcher at ${cm(p.footrestHeight)}`;
    default:
      return 'none';
  }
}

export default {
  id: 'stool',
  label: 'Stool',
  plural: 'stools',
  styles: STYLES,
  cell: { spacing: 1.2, gridSize: 13 },
  groups: [
    { id: 'style', label: 'Style', fields: FIELDS.style },
    { id: 'shape', label: 'Shape', reads: ['style'], fields: FIELDS.shape },
    { id: 'footrest', label: 'Footrest', reads: ['style', 'shape'], appliesTo: footrestApplies, fields: FIELDS.footrest },
    { id: 'palette', label: 'Colours', fields: FIELDS.palette },
    { id: 'pattern', label: 'Pattern', reads: ['style', 'shape'], fields: FIELDS.pattern },
    { id: 'finish', label: 'Finish', reads: ['style', 'shape', 'palette'], fields: FIELDS.finish },
  ],

  generateParams(g) {
    return generateStoolParams(g);
  },

  build(p, kit) {
    const m = kit.materials;
    const wood = (color) => m.wood(color, { grain: p.grain, seed: p.seed });
    const frame = p.frameMode === 'wood' ? wood(p.frameColor) : m.frame(p.frameColor, p.frameMode);
    const mats = { frame };
    if (usesCushion(p)) {
      mats.cushion = p.pattern === 'none'
        ? m.solid(p.cushionColor)
        : m.pattern({ ...p.pattern, colors: p.pattern.kind === 'linen' ? [p.cushionColor] : [p.cushionColor, p.cushionSecondary], seed: p.seed });
    }
    if (p.style === 'drum' && p.hasCushion) mats.body = m.solid(p.bodyColor, 0.9);
    if (p.panMode === 'frame') mats.pan = frame;
    else if (p.panMode === 'wood') mats.pan = wood(p.panColor);
    else if (p.panMode === 'painted') mats.pan = m.solid(p.panColor);
    return BUILDERS[p.style](p, mats);
  },

  describe(p) {
    const cushion = usesCushion(p);
    const drum = p.style === 'drum';
    const painted = p.panMode === 'painted' || p.frameMode === 'match';
    const swatches = [
      cushion ? p.cushionColor : null,
      cushion && p.pattern !== 'none' ? p.cushionSecondary : null,
      drum && p.hasCushion ? p.bodyColor : null,
      painted ? p.accentColor : null,
    ].filter(Boolean);
    const topSwatches = [
      cushion ? p.cushionColor : null,
      cushion && p.pattern !== 'solid' ? p.cushionSecondary : null,
      p.panColor,
      p.frameColor,
    ].filter(Boolean);

    const shapeRows = [
      ['Height', `${cm(p.seatHeight)} · ${heightClass(p.seatHeight)}`],
      ['Seat', seatText(p)],
      ...(drum
        ? p.hasCushion ? [['Seat thickness', `cushion ${cm(p.cushionThickness)}`]] : []
        : [['Seat thickness', `${cm(p.seatThickness)}${p.hasCushion ? ` · cushion ${cm(p.cushionThickness)}` : ''}`]]),
      ['Legs', legsText(p)],
      ...(p.style === 'diner' ? [['Base', `${p.baseShape} ⌀ ${cm(p.baseRadius * 2)}`]] : []),
    ];

    const sections = [
      { group: 'style', rows: [['Style', p.style]] },
      { group: 'shape', rows: shapeRows },
      { group: 'footrest', rows: [['Footrest', footrestText(p)]] },
      { group: 'palette', rows: [['Colours', { swatches }]] },
    ];
    if (cushion) {
      sections.push({
        group: 'pattern',
        rows: [['Pattern', patternLabel(p.pattern)]],
      });
    }
    const finishRows = [];
    if (!(drum && p.drumBase === 'floor')) {
      finishRows.push(['Frame', p.frameMode === 'wood' ? `${p.woodName} wood · ${p.grain} grain` : p.frameMode]);
    }
    if (!drum) {
      finishRows.push([
        'Seat',
        p.panMode === 'wood' ? `${p.woodName} wood · ${p.grain} grain` : p.panMode === 'painted' ? 'painted' : 'matches frame',
      ]);
    }
    if (finishRows.length) sections.push({ group: 'finish', rows: finishRows });
    return { sections, swatches: topSwatches };
  },
};
