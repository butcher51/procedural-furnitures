import { generateTableParams, STYLE_WEIGHTS } from './params.js';
import { buildTable } from './build.js';

const cm = (m) => `${Math.round(m * 100)} cm`;

const paintApplies = (p) => p.topFinish === 'painted' || p.baseMode === 'painted' || p.baseMode === 'accent';

function styleLabel(p) {
  if (p.style !== 'cafe') return p.style;
  return p.heightClass === 'bar' ? 'café (bar)' : 'café';
}

function baseLabel(p) {
  if (p.baseKind === 'legs') return `${p.legCount} legs · ${p.legProfile}`;
  if (p.baseKind === 'pedestal') return `pedestal · ${p.pedestalBase}`;
  return `trestle · ${p.trestleKind}`;
}

function topFinishLabel(p) {
  if (p.topFinish === 'wood') return `${p.woodName} wood · ${p.grain} grain`;
  if (p.topFinish === 'stone') return `${p.stoneName} · ${p.stonePattern}`;
  return 'painted';
}

function baseFinishLabel(p) {
  return p.baseMode === 'wood' ? `${p.woodName} wood · ${p.grain} grain` : p.baseMode;
}

function baseRows(p) {
  const rows = [['Base', baseLabel(p)]];
  if (p.baseKind === 'legs') {
    rows.push(['Leg thickness', cm(p.legThickness)]);
    if (p.legProfile === 'splayed') rows.push(['Splay', cm(p.legSplay)]);
    rows.push(['Apron', p.hasApron ? cm(p.apronHeight) : 'none']);
    rows.push(['Stretchers', p.stretcher === 'none' ? 'none' : `${p.stretcher === 'h' ? 'H' : p.stretcher} at ${cm(p.stretcherHeight)}`]);
    if (p.style !== 'dining') rows.push(['Shelf', p.hasShelf ? `at ${cm(p.shelfHeight)}` : 'none']);
  } else if (p.baseKind === 'pedestal') {
    rows.push(['Base span', cm(p.baseSpan)]);
  } else {
    rows.push(['Frame inset', cm(p.trestleInset)]);
  }
  return rows;
}

export default {
  id: 'table',
  label: 'Table',
  plural: 'tables',
  styles: STYLE_WEIGHTS,
  cell: { spacing: 2.3, gridSize: 9 },
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    {
      id: 'top',
      label: 'Top',
      reads: ['style'],
      fields: [
        'heightClass', 'topShape', 'topLength', 'topDepth', 'topHeight', 'topThickness', 'topEdge', 'topExponent',
        'topSides', 'seats',
      ],
    },
    {
      id: 'base',
      label: 'Base',
      reads: ['style', 'top'],
      fields: [
        'baseKind', 'legCount', 'legProfile', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'overhang', 'legHeight',
        'hasApron', 'apronHeight', 'apronThickness', 'stretcher', 'stretcherHeight', 'stretcherThickness', 'hasShelf',
        'shelfHeight', 'shelfThickness', 'shelfShape', 'pedestalBase', 'baseSpan', 'baseHeight', 'columnRadius',
        'columnSides', 'capRadius', 'trestleKind', 'trestleInset', 'footLength', 'footHeight', 'beamWidth', 'postDepth',
        'cleatHeight', 'trestleStretcherHeight',
      ],
    },
    { id: 'palette', label: 'Colours', appliesTo: paintApplies, fields: ['paint', 'accent'] },
    {
      id: 'finish',
      label: 'Finish',
      reads: ['style', 'palette'],
      fields: [
        'topFinish', 'woodName', 'stoneName', 'baseMode', 'grain', 'stonePattern', 'topColor', 'baseColor',
      ],
    },
  ],

  generateParams(g) {
    return generateTableParams(g);
  },

  build(p, kit) {
    return buildTable(p, kit);
  },

  describe(p) {
    const round = p.topShape === 'round';
    const swatches = [p.topColor, p.baseColor];
    const sections = [
      { group: 'style', rows: [['Style', styleLabel(p)]] },
      {
        group: 'top',
        rows: [
          ['Shape', p.topShape],
          ['Size', round ? `⌀ ${cm(p.topLength)}` : `${cm(p.topLength)} × ${cm(p.topDepth)}`],
          ['Height', cm(p.topHeight)],
          ['Thickness', cm(p.topThickness)],
          ...(p.seats > 0 ? [['Seats', String(p.seats)]] : []),
        ],
      },
      { group: 'base', rows: baseRows(p) },
    ];
    if (paintApplies(p)) sections.push({ group: 'palette', rows: [['Colours', { swatches: [p.paint, p.accent] }]] });
    sections.push({
      group: 'finish',
      rows: [['Top', topFinishLabel(p)], ['Base', baseFinishLabel(p)]],
    });
    return { sections, swatches };
  },
};
