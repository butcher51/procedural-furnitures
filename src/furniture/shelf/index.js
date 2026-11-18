import { generateShelfParams, STYLE_WEIGHTS } from './params.js';
import { buildShelf } from './build.js';
import { bays, overallHeight } from './layout.js';

const cm = (m) => `${Math.round(m * 100)} cm`;

const paintApplies = (p) => p.frameMode === 'painted' || p.boardMode === 'painted' || ['paint', 'accent'].includes(p.backMode);

const STYLE_LABELS = { bookcase: 'bookcase', open: 'open', ladder: 'ladder', cube: 'cube grid', leaning: 'leaning' };

function sizeRow(p) {
  if (p.style === 'cube') return `${p.cols} × ${p.rows} cubes · ${cm(p.width)} × ${cm(overallHeight(p))}`;
  return `${cm(p.width)} × ${cm(p.depth)} · ${cm(overallHeight(p))} high`;
}

function shelvesRow(p) {
  if (p.style === 'ladder' || p.style === 'leaning') {
    const depths = bays(p).filter((b) => !b.top).map((b) => b.zFront - b.zBack);
    return `${p.shelfCount} shelves · ${Math.round(Math.min(...depths) * 100)}–${Math.round(Math.max(...depths) * 100)} cm deep`;
  }
  if (p.style === 'cube') return `${p.rows} rows × ${p.cols} columns`;
  if (p.bays === 2) return `${p.shelfCount} shelves × 2 bays · ${p.shelfSpacing}`;
  return `${p.shelfCount} shelves · ${p.shelfSpacing}`;
}

function backRow(p) {
  if (p.backKind === 'brace') return p.sideBraces ? 'X brace + sides' : 'X brace';
  return p.backKind === 'panel' ? 'panel' : 'none';
}

function baseRow(p) {
  if (p.style === 'ladder') return 'A-frame';
  if (p.baseKind === 'plinth') return `plinth ${cm(p.baseHeight)}`;
  if (p.baseKind === 'legs') return `${p.legCount} legs · ${cm(p.baseHeight)}`;
  if (p.baseKind === 'cut') return `${p.footCut}-cut sides`;
  if (p.baseKind === 'floor') return 'on the floor';
  if (p.style === 'open') return `${p.postProfile} posts`;
  return p.baseKind === 'posts' ? 'rear posts' : p.baseKind;
}

const frameRow = (p) => (p.frameMode === 'wood' ? `${p.woodName} wood · ${p.grain} grain` : p.frameMode);

const boardsRow = (p) => (p.boardMode === 'wood' ? `${p.woodName} wood` : p.boardMode);

function backFinishRow(p) {
  if (p.backMode === 'accent' || p.backMode === 'paint') return p.backPattern === 'linen' ? 'grasscloth' : p.backMode;
  return p.backMode;
}

export default {
  id: 'shelf',
  label: 'Shelf',
  plural: 'shelves',
  styles: STYLE_WEIGHTS,
  cell: { spacing: 1.8, gridSize: 9 },
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    {
      id: 'shape',
      label: 'Shape',
      reads: ['style'],
      fields: [
        'heightClass', 'height', 'width', 'depth', 'topDepth', 'cols', 'rows', 'cellSize', 'boardThickness', 'sideThickness',
        'railDepth', 'leanAngle', 'shelfCount', 'shelfSpacing', 'bays', 'backKind', 'backThickness', 'sideBraces',
        'topOverhang', 'postFinials', 'rungCount',
      ],
    },
    {
      id: 'base',
      label: 'Base',
      reads: ['style', 'shape'],
      appliesTo: (p) => p.style !== 'ladder',
      fields: [
        'baseKind', 'baseHeight', 'plinthSetback', 'footCut', 'postProfile', 'legCount', 'legThickness', 'legSides',
        'legTaper', 'legSplay', 'legInset', 'legHeight',
      ],
    },
    { id: 'palette', label: 'Colours', appliesTo: paintApplies, fields: ['paint', 'accent'] },
    {
      id: 'finish',
      label: 'Finish',
      reads: ['style', 'shape', 'base', 'palette'],
      fields: ['frameMode', 'boardMode', 'backMode', 'backPattern', 'woodName', 'grain', 'frameColor', 'boardColor', 'backColor'],
    },
    {
      id: 'contents',
      label: 'Contents',
      reads: ['style', 'shape', 'base', 'palette', 'finish'],
      fields: ['contentsMood', 'coverMood', 'bookColors', 'pageColor', 'objectColors', 'fillSeed', 'inset', 'bookCount', 'objectCount'],
    },
  ],

  generateParams(g) {
    return generateShelfParams(g);
  },

  surfaces(p) {
    return bays(p);
  },

  build(p, kit) {
    return buildShelf(p, kit);
  },

  describe(p) {
    const swatches = [p.frameColor];
    if (p.boardColor !== p.frameColor) swatches.push(p.boardColor);
    if (p.backColor && !swatches.includes(p.backColor)) swatches.push(p.backColor);
    swatches.push(p.bookColors[0], p.bookColors[1]);
    const sections = [
      { group: 'style', rows: [['Style', STYLE_LABELS[p.style]]] },
      { group: 'shape', rows: [['Size', sizeRow(p)], ['Shelves', shelvesRow(p)], ['Back', backRow(p)]] },
      { group: 'base', rows: [['Base', baseRow(p)]] },
    ];
    if (paintApplies(p)) sections.push({ group: 'palette', rows: [['Colours', { swatches: [p.paint, p.accent] }]] });
    sections.push({
      group: 'finish',
      rows: [['Frame', frameRow(p)], ['Shelves', boardsRow(p)], ['Back', backFinishRow(p)]],
    });
    sections.push({
      group: 'contents',
      rows: [
        ['Contents', `${p.contentsMood} · ${p.bookCount} books, ${p.objectCount} objects`],
        [`Covers (${p.coverMood})`, { swatches: p.bookColors }],
        ['Objects', p.objectCount > 0 ? String(p.objectCount) : 'none'],
      ],
    });
    return { sections, swatches };
  },
};
