import { generateCabinetParams, STYLE_WEIGHTS, KIND_WEIGHTS } from './params.js';
import { buildCabinet } from './build.js';
import { cabinetLayout, surfaces } from './layout.js';

const cm = (m) => `${Math.round(m * 100)} cm`;
const num = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const STYLE_LABEL = { midcentury: 'Mid-century', shaker: 'Shaker', industrial: 'Industrial', modern: 'Modern' };
const FORM_LABEL = { sideboard: 'Sideboard', lowDresser: 'Dresser', tallChest: 'Tall chest', nightstand: 'Nightstand', tv: 'TV unit' };
const HANDLE_LABEL = { knob: 'knobs', bar: 'bar pulls', cup: 'cup pulls', cutout: 'cut-outs', groove: 'push to open (grooves)', lip: 'wooden lips', tab: 'leather tabs', none: 'none' };
const HARDWARE_LABEL = { brass: 'brass', black: 'black', metal: 'steel', white: 'white ceramic', wood: 'wood', leather: 'leather', front: '', none: '' };

const paintApplies = (p) => Object.values(p.roles).some((k) => k && k.startsWith('solid:'));

function baseLabel(p) {
  switch (p.baseKind) {
    case 'legs': return `${p.legCount} legs · ${p.legSplay > 0 ? 'splayed' : p.legTaper < 0.95 ? 'tapered' : 'straight'}`;
    case 'frameLegs': return `${p.legCount} legs + rail frame`;
    case 'plinth': return 'plinth';
    case 'skirt': return `${p.skirtCut === 'arch' ? 'arched' : 'notched'} skirt`;
    case 'bun': return 'bun feet';
    case 'panelEnds': return p.endCut === 'notch' ? 'slab ends · notched' : 'slab ends';
    case 'hairpin': return `${p.legCount} hairpin legs`;
    default: return `metal frame${p.sideBrace === 'x' ? ' · X brace' : ''}${p.bottomShelf ? ' · shelf' : ''}`;
  }
}

function layoutLabel(stats) {
  const parts = [];
  if (stats.drawers) parts.push(num(stats.drawers, 'drawer', 'drawers'));
  if (stats.doors) parts.push(num(stats.doors, 'door', 'doors'));
  if (stats.open) parts.push(`${stats.open} open`);
  return parts.join(' · ');
}

function handlesLabel(p) {
  const kind = HANDLE_LABEL[p.drawerHandle];
  const finish = HARDWARE_LABEL[p.hardwareFinish];
  if (p.drawerHandle === 'tab' || p.drawerHandle === 'lip') return kind;
  return finish ? `${finish} ${kind}` : kind;
}

function woodLabel(p) {
  return `${p.woodName} (${p.grain} grain)`;
}

function bodyLabel(p) {
  return p.bodyFinish === 'wood' ? woodLabel(p) : 'painted';
}

function frontsFinishLabel(p) {
  return { match: 'match body', painted: 'painted', accent: 'accent', metal: 'metal' }[p.frontFinish];
}

function topLabel(p) {
  if (p.topFinish === 'stone') return p.stoneName;
  if (p.topFinish === 'wood') return p.woodName;
  return 'match body';
}

const GROUPS = [
  { id: 'style', label: 'Style', fields: ['style'] },
  { id: 'kind', label: 'Kind', fields: ['kind'] },
  { id: 'shape', label: 'Shape', reads: ['style', 'kind'], fields: ['form', 'width', 'height', 'depth', 'panel', 'topThickness', 'topOverhang', 'topEdge'] },
  {
    id: 'base',
    label: 'Base',
    reads: ['style', 'kind', 'shape'],
    fields: [
      'baseKind', 'legCount', 'legHeight', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'legInsetX', 'legInsetZ', 'apronHeight',
      'plinthInset', 'skirtCut', 'skirtCutHeight', 'skirtFoot', 'bunRadius', 'endCut', 'postSize', 'sideBrace', 'bottomShelf', 'bottomShelfHeight',
    ],
  },
  {
    id: 'fronts',
    label: 'Fronts',
    reads: ['style', 'kind', 'shape', 'base'],
    fields: [
      'template', 'plan', 'construction', 'gap', 'edge', 'reveal', 'frameWidth', 'frontThickness', 'frontBevel', 'doorStyle', 'insertKind',
      'drawerStyle', 'doorFrameWidth', 'grainMode', 'hasFronts',
    ],
  },
  {
    id: 'hardware',
    label: 'Hardware',
    reads: ['style', 'fronts'],
    appliesTo: (p) => p.hasFronts,
    fields: [
      'drawerHandle', 'doorHandle', 'knobDiameter', 'barScale', 'barProfile', 'projection', 'cupWidth', 'cutoutWidth', 'cutoutHeight',
      'lipFraction', 'tabLength', 'vPos', 'doorInset', 'doorDrop',
    ],
  },
  { id: 'palette', label: 'Colours', appliesTo: paintApplies, fields: ['paint', 'accent'] },
  {
    id: 'finish',
    label: 'Finish',
    reads: ['style', 'shape', 'base', 'fronts', 'hardware', 'palette'],
    fields: [
      'bodyFinish', 'frontFinish', 'topFinish', 'woodName', 'leatherName', 'grain', 'stoneName', 'hardwareFinish', 'baseFinish', 'paintSheen',
      'bodyColor', 'frontColor', 'topColor', 'hardwareColor', 'baseColor', 'insertColor', 'roles',
    ],
  },
];

export default {
  id: 'cabinet',
  label: 'Cabinet',
  plural: 'cabinets',
  styles: STYLE_WEIGHTS,
  kinds: KIND_WEIGHTS,
  cell: { spacing: 2.3, spacingZ: 1.5, gridSize: 9 },
  groups: GROUPS,

  generateParams(g) {
    return generateCabinetParams(g);
  },

  build(p, kit) {
    return buildCabinet(p, kit);
  },

  surfaces(p) {
    return surfaces(p);
  },

  describe(p) {
    const { layout, drawerStyle } = cabinetLayout(p);
    const sections = [
      { group: 'style', rows: [['Style', STYLE_LABEL[p.style]]] },
      { group: 'kind', rows: [['Kind', FORM_LABEL[p.form]]] },
      {
        group: 'shape',
        rows: [
          ['Size', `${Math.round(p.width * 100)} × ${Math.round(p.depth * 100)} cm`],
          ['Height', cm(p.height)],
          ['Top', p.topOverhang < 0.002 ? `${Math.round(p.topThickness * 1000) / 10} cm · flush` : `${Math.round(p.topThickness * 1000) / 10} cm · ${Math.round(p.topOverhang * 1000)} mm overhang`],
        ],
      },
      { group: 'base', rows: [['Base', baseLabel(p)], ['Clearance', cm(p.legHeight)]] },
    ];
    const doorWord = p.insertKind === 'none' ? p.doorStyle : p.insertKind;
    const frontRows = [['Layout', layoutLabel(layout.stats) || 'open shelves']];
    if (p.hasFronts) {
      const drawerWord = layout.stats.drawers ? drawerStyle : null;
      const kinds = [layout.stats.doors ? doorWord : null, drawerWord && drawerWord !== doorWord ? `${drawerWord} drawers` : null].filter(Boolean);
      frontRows.push(['Fronts', `${p.construction} · ${kinds.join(' · ') || 'slab'}`]);
    }
    sections.push({ group: 'fronts', rows: frontRows });
    if (p.hasFronts) sections.push({ group: 'hardware', rows: [['Handles', handlesLabel(p)]] });
    if (paintApplies(p)) sections.push({ group: 'palette', rows: [['Colours', { swatches: [p.paint, p.accent] }]] });
    sections.push({
      group: 'finish',
      rows: [['Body', bodyLabel(p)], ['Fronts', frontsFinishLabel(p)], ['Top', topLabel(p)]],
    });
    const swatches = [p.bodyColor];
    if (p.frontColor !== p.bodyColor) swatches.push(p.frontColor);
    if (p.topColor !== p.bodyColor) swatches.push(p.topColor);
    if (p.hardwareColor) swatches.push(p.hardwareColor);
    return { sections, swatches };
  },
};
