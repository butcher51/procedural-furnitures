import { generateBenchParams, STYLES } from './params.js';
import { buildGarden, buildPark, buildPlank, buildPlatform, buildUpholstered } from './build.js';

const BUILDERS = { park: buildPark, garden: buildGarden, plank: buildPlank, platform: buildPlatform, upholstered: buildUpholstered };

const cm = (m) => `${Math.round(m * 100)} cm`;

function seatRow(p) {
  if (p.style === 'plank') return `slab ${cm(p.seatThickness)}`;
  if (p.style === 'upholstered') return `cushion ${cm(p.seatThickness)}`;
  return `${p.seatSlatCount} slats · ${cm(p.seatThickness)}`;
}

function backRow(p) {
  if (!p.hasBack) return 'none';
  const count = p.backStyle === 'cushion' ? '' : ` ×${p.backBarCount}`;
  return `${p.backStyle}${count} · ${cm(p.backHeight)} · ${p.backAngle.toFixed(1)}°`;
}

function supportRow(p) {
  if (p.support === 'scroll' || p.support === 'angular') return `${p.support} frames`;
  if (p.support === 'staked') return `${p.legCount} staked legs`;
  if (p.support === 'legs') return `${p.legCount} legs`;
  if (p.support === 'slab') return `slab ends (${p.footNotch} notch)`;
  return p.support;
}

function fabricName(f) {
  if (f.kind === 'linen') return f.texture === 'boucle' ? 'bouclé' : 'linen';
  return f.kind;
}

function showSecondary(p) {
  if (p.seatMaterial === 'wood') return true;
  return p.seatMaterial === 'fabric' && p.fabricPattern.kind !== 'linen';
}

function patternRow(p) {
  if (p.seatMaterial === 'painted') return 'painted (solid)';
  if (p.seatMaterial === 'wood') return `${p.grain} grain`;
  return fabricName(p.fabricPattern);
}

function frameRow(p) {
  if (p.frameMode === 'wood') return `${p.woodName} wood`;
  if (p.frameMode === 'black') return 'cast iron black';
  if (p.frameMode === 'painted') return 'painted';
  return p.frameMode;
}

export default {
  id: 'bench',
  label: 'Bench',
  plural: 'benches',
  styles: STYLES,
  cell: { spacing: 2.2, gridSize: 9 },
  groups: [
    { id: 'style', label: 'Style', fields: ['style'] },
    {
      id: 'shape',
      label: 'Shape',
      reads: ['style'],
      fields: [
        'seatLength', 'seatDepth', 'seatHeight', 'seatThickness', 'seatSlatCount', 'slatGap', 'slatWidth', 'seatExponent',
        'puff', 'hasArms', 'armHeight', 'armWidth', 'hasBack', 'backStyle', 'backHeight', 'backAngle', 'backThickness',
        'backBarCount', 'backWidth',
      ],
    },
    {
      id: 'base',
      label: 'Base',
      reads: ['style', 'shape'],
      fields: [
        'support', 'legCount', 'legThickness', 'legSides', 'legTaper', 'legSplay', 'legInset', 'apronHeight', 'legHeight',
        'frameWidth', 'frameThickness', 'footNotch', 'hasStretcher', 'stretcherHeight',
      ],
    },
    { id: 'palette', label: 'Colours', fields: ['fabricColor', 'fabricSecondary', 'bodyColor', 'paintColor'] },
    {
      id: 'pattern',
      label: 'Pattern',
      fields: ['fabricPattern', 'grain'],
    },
    {
      id: 'finish',
      label: 'Frame',
      reads: ['style', 'palette', 'pattern'],
      fields: ['seatMaterial', 'woodName', 'woodSwatch', 'seatColor', 'seatSecondary', 'frameMode', 'frameColor'],
    },
  ],

  generateParams(g) {
    return generateBenchParams(g);
  },

  build(p, kit) {
    const m = kit.materials;
    const wood = () => m.wood(p.woodSwatch, { grain: p.grain, seed: p.seed });
    let surface;
    if (p.seatMaterial === 'wood') surface = wood();
    else if (p.seatMaterial === 'fabric') {
      const colors = p.fabricPattern.kind === 'linen' ? [p.seatColor] : [p.seatColor, p.seatSecondary];
      surface = m.pattern({ ...p.fabricPattern, colors, seed: p.seed });
    } else surface = m.solid(p.seatColor);
    const mats = {
      surface,
      frame: p.frameMode === 'wood' ? wood() : m.frame(p.frameColor, p.frameMode),
      body: p.style === 'upholstered' ? m.solid(p.bodyColor, 0.9) : null,
    };
    return BUILDERS[p.style](p, mats);
  },

  describe(p) {
    const upholstered = p.style === 'upholstered';
    const splayed = p.legSplay > 0.0005;
    const swatches = [p.seatColor, showSecondary(p) ? p.seatSecondary : null, upholstered ? p.bodyColor : null, p.frameColor].filter(Boolean);
    return {
      sections: [
        { group: 'style', rows: [['Style', p.style]] },
        {
          group: 'shape',
          rows: [
            ['Size', `${cm(p.seatLength)} × ${cm(p.seatDepth)}`],
            ['Seat height', cm(p.seatHeight)],
            ['Seat', seatRow(p)],
            ['Back', backRow(p)],
            ['Arms', p.hasArms ? `${cm(p.armHeight)} above seat` : 'none'],
          ],
        },
        {
          group: 'base',
          rows: [
            ['Support', supportRow(p)],
            ...(p.legThickness > 0 ? [['Leg thickness', cm(p.legThickness)]] : []),
            ...(splayed ? [['Leg splay', cm(p.legSplay)]] : []),
            ['Stretcher', p.hasStretcher ? `at ${cm(p.stretcherHeight)}` : 'none'],
          ],
        },
        { group: 'palette', rows: [['Colours', { swatches }]] },
        { group: 'pattern', rows: [['Pattern', patternRow(p)]] },
        {
          group: 'finish',
          rows: [
            ['Seat', p.seatMaterial === 'wood' ? `${p.woodName} wood` : p.seatMaterial],
            ['Frame', frameRow(p)],
          ],
        },
      ],
      swatches,
    };
  },
};
