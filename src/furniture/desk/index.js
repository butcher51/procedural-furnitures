import { generateDeskParams, STYLE_WEIGHTS } from './params.js';
import { buildDesk } from './build.js';
import { drawerTotals, frontRegions, hasFronts, propSetOf, propZones } from './layout.js';

const cm = (m) => `${Math.round(m * 100)} cm`;
const cm1 = (m) => `${(Math.round(m * 1000) / 10).toString()} cm`;

const paintApplies = (p) => p.topFinish === 'painted' || p.bodyMode === 'painted' || p.inlay;

const STACK_LABELS = {
  three: 'three', graduated4: 'graduated', boxFile: 'box + file', twoBoxFile: '2 box + file', drawerDoor: 'drawer + door',
};

function supportLabel(p) {
  const box = p.pedestalLayout === 'box' ? ' · drawer box' : '';
  if (p.style === 'writing') return `4 legs · ${p.legProfile}`;
  if (p.style === 'trestle') return `trestle · ${p.trestleKind}${box}`;
  if (p.style === 'standing') return `T-frame · ${p.columnStages} stages`;
  if (p.style === 'panel') return `panels · ${p.waterfall ? 'waterfall' : p.panelCut === 'none' ? 'slabs' : `${p.panelCut} cut`}${box}`;
  if (p.pedestalLayout === 'double') return `2 pedestals · ${p.pedestalBase}`;
  if (p.pedestalLayout === 'single') return `pedestal ${p.pedestalSide} · ${p.endSupport === 'panel' ? 'panel' : 'leg'} end`;
  return `hung pedestal · ${p.pedestalSide}`;
}

function baseRows(p) {
  const rows = [['Support', supportLabel(p)], ['Knee space', cm(p.kneeWidth)]];
  if (p.style === 'pedestal' || p.style === 'panel') rows.push(['Modesty panel', p.modestyPanel ? cm(p.modestyHeight) : 'none']);
  if (p.style === 'trestle') rows.push(['Footrest', p.trestleKind === 'X' ? 'none' : `at ${cm(p.trestleStretcherHeight)}`]);
  return rows;
}

function drawersLabel(p) {
  const regions = drawerTotals(p).perRegion;
  const order = ['pedestal-left', 'centre', 'pedestal-right', 'apron', 'box'];
  const label = (r) => `${r.drawers}${r.doors ? ` + ${r.doors === 1 ? 'door' : `${r.doors} doors`}` : ''}`;
  return order.map((id) => regions.find((r) => r.id === id)).filter(Boolean).map(label).join(' + ') || '0';
}

function layoutLabel(p) {
  if (p.style === 'writing') return 'apron row';
  if (p.pedestalLayout === 'hung' || p.pedestalLayout === 'box') return 'hung box';
  const labels = frontRegions(p).filter((r) => r.id.startsWith('pedestal')).map((r) => {
    const stack = p.pedestalLayout === 'double' && r.id === 'pedestal-right' && !p.mirrorStack ? (p.stackLayout === 'three' ? 'twoBoxFile' : 'three') : p.stackLayout;
    return STACK_LABELS[stack];
  });
  const unique = [...new Set(labels)].join(' / ');
  return p.centreDrawer ? `${unique} + centre drawer` : unique;
}

const HARDWARE_WORDS = { match: 'matching', black: 'black', brass: 'brass', metal: 'steel', none: '' };

function handleLabel(p) {
  if (p.handleKind === 'groove' || p.handleKind === 'none') return 'finger groove';
  const size = p.handleKind === 'bar' ? ` ${cm1(p.handleSize)}` : '';
  return `${HARDWARE_WORDS[p.hardwareMode]} ${p.handleKind}${size}`;
}

function extrasLabel(p) {
  const extras = [];
  if (p.topAddon === 'rail') extras.push('gallery rail');
  if (p.topAddon === 'riser') extras.push('riser');
  if (p.inlay) extras.push('leather inlay');
  if (p.clutter) extras.push('props');
  return extras.length ? extras.join(', ') : 'none';
}

function heightLabel(p) {
  if (p.heightMode === 'stand') return `${cm(p.topHeight)} · standing`;
  return p.style === 'standing' ? `${cm(p.topHeight)} · seated` : cm(p.topHeight);
}

function bodyLabel(p) {
  if (p.bodyMode === 'wood') return `${p.woodName} wood`;
  if (p.bodyMode === 'top') return 'matches top';
  return p.bodyMode;
}

function propsLabel(p) {
  const set = propSetOf(p);
  const items = [];
  if (set.laptop) items.push('laptop');
  if (set.books) items.push(`${p.bookCount} books`);
  if (set.cup) items.push('pen cup');
  return items.join(', ');
}

export default {
  id: 'desk',
  label: 'Desk',
  plural: 'desks',
  styles: STYLE_WEIGHTS,
  cell: { spacing: 2.1, spacingZ: 1.6, gridSize: 9 },
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    {
      id: 'top',
      label: 'Top',
      reads: ['style'],
      fields: [
        'heightMode', 'topWidth', 'topDepth', 'topHeight', 'topThickness', 'topEdge', 'topExponent', 'topAddon', 'addonHeight',
        'addonDepth', 'inlay', 'inlayInset', 'clutter',
      ],
    },
    {
      id: 'base',
      label: 'Base',
      reads: ['style', 'top'],
      fields: [
        'supportKind', 'pedestalLayout', 'pedestalSide', 'pedestalWidth', 'pedestalHeight', 'pedestalDepth', 'pedestalOverhang',
        'pedestalBase', 'pedestalBaseHeight', 'carcassThickness', 'endSupport', 'modestyPanel', 'modestyHeight', 'legCount',
        'legProfile', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'overhang', 'legHeight', 'apronHeight', 'apronThickness',
        'stretcher', 'stretcherHeight', 'stretcherThickness', 'trestleKind', 'trestleInset', 'footLength', 'footHeight', 'beamWidth',
        'postDepth', 'cleatHeight', 'trestleStretcherHeight', 'trestleBackRail', 'trestleRailHeight', 'frameInset', 'columnWidth', 'columnDepth',
        'columnStages', 'columnZ', 'frameFootLength', 'frameFootHeight', 'frameFootWidth', 'crossbarHeight', 'controlBox', 'waterfall',
        'panelThickness', 'panelInset', 'panelDepth', 'panelCut', 'panelCutHeight', 'kneeWidth', 'kneeCenterX',
      ],
    },
    {
      id: 'fronts',
      label: 'Fronts',
      reads: ['style', 'top', 'base'],
      appliesTo: hasFronts,
      fields: [
        'apronDrawers', 'stackLayout', 'mirrorStack', 'hungDrawers', 'centreDrawer', 'centreDrawerHeight', 'construction',
        'drawerStyle', 'frontThickness', 'gap', 'handleKind', 'handleSize', 'drawerCount',
      ],
    },
    { id: 'palette', label: 'Colours', appliesTo: paintApplies, fields: ['paint', 'inlayColor'] },
    {
      id: 'finish',
      label: 'Finish',
      reads: ['style', 'base', 'fronts', 'palette'],
      fields: [
        'topFinish', 'woodName', 'grain', 'bodyMode', 'frontMode', 'hardwareMode', 'topColor', 'bodyColor', 'hardwareColor',
      ],
    },
    {
      id: 'props',
      label: 'Props',
      reads: ['top'],
      appliesTo: (p) => p.clutter,
      fields: [
        'propSet', 'laptopColor', 'bookColors', 'cupColor', 'laptopSize', 'laptopX', 'laptopYaw', 'bookCount', 'bookSizes',
        'cupRadius', 'cupHeight', 'propSide', 'booksOnRiser',
      ],
    },
  ],

  generateParams(g) {
    return generateDeskParams(g);
  },

  build(p, kit) {
    return buildDesk(p, kit);
  },

  surfaces(p) {
    return propZones(p);
  },

  describe(p) {
    const sections = [
      { group: 'style', rows: [['Style', p.style]] },
      {
        group: 'top',
        rows: [
          ['Size', `${Math.round(p.topWidth * 100)} × ${Math.round(p.topDepth * 100)} cm`],
          ['Height', heightLabel(p)],
          ['Thickness', cm(p.topThickness)],
          ['Extras', extrasLabel(p)],
        ],
      },
      { group: 'base', rows: baseRows(p) },
    ];
    if (hasFronts(p)) {
      sections.push({
        group: 'fronts',
        rows: [
          ['Drawers', drawersLabel(p)],
          ['Layout', layoutLabel(p)],
          ['Fronts', `${p.construction} · ${p.drawerStyle}`],
          ['Handles', handleLabel(p)],
        ],
      });
    }
    if (paintApplies(p)) sections.push({ group: 'palette', rows: [['Colours', { swatches: [p.paint, p.inlayColor] }]] });
    const finish = [
      ['Top', p.topFinish === 'wood' ? `${p.woodName} wood · ${p.grain} grain` : 'painted'],
      ['Body', bodyLabel(p)],
    ];
    if (p.frontMode !== 'none') finish.push(['Fronts', p.frontMode === 'top' ? 'match top' : 'match body']);
    sections.push({ group: 'finish', rows: finish });
    if (p.clutter) sections.push({ group: 'props', rows: [['On the desk', propsLabel(p)]] });
    const swatches = [p.topColor, p.bodyColor];
    if (p.hardwareColor) swatches.push(p.hardwareColor);
    if (p.inlay) swatches.push(p.inlayColor);
    if (propSetOf(p).books) swatches.push(p.bookColors[0]);
    return { sections, swatches };
  },
};
