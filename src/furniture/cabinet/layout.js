import { solveFronts } from '../../core/fronts.js';

export const FRAMED_DRAWER_MAX_FRONTS = 8;

export function endThickness(p) {
  return Math.max(p.panel, 0.02);
}

export function carcassSpec(p) {
  if (p.baseKind === 'panelEnds') return { width: p.width - 2 * endThickness(p), sides: false };
  if (p.baseKind === 'metalFrame') return { width: p.width - 2 * p.postSize, sides: true };
  return { width: p.width, sides: true };
}

export function faceField(p) {
  const { width, sides } = carcassSpec(p);
  const y0 = p.legHeight;
  const y1 = p.height - p.topThickness;
  if (p.construction === 'inset') {
    const inner = width / 2 - (sides ? p.panel : 0);
    return { x0: -inner, x1: inner, y0: y0 + p.panel, y1, z: p.depth / 2 };
  }
  return { x0: -width / 2 + p.edge, x1: width / 2 - p.edge, y0: y0 + p.edge, y1: y1 - p.edge, z: p.depth / 2 };
}

export function frontOptions(p) {
  return {
    construction: p.construction,
    gap: p.gap,
    frameWidth: p.frameWidth,
    reveal: p.reveal || 0.0025,
    thickness: p.frontThickness,
    grainMode: p.grainMode,
    maxDrawerW: p.template === 'LD3' ? 1.7 : 1.0,
    fallback: p.form === 'nightstand' ? { leaf: 'drawers', count: 2 } : { leaf: 'doors', hinge: 'auto' },
  };
}

export function handleSpec(p) {
  return {
    kind: p.drawerHandle,
    doorKind: p.doorHandle,
    knobDiameter: p.knobDiameter || undefined,
    barScale: p.barScale || undefined,
    barProfile: p.barProfile,
    projection: p.projection || undefined,
    cupWidth: p.cupWidth || undefined,
    cutoutWidth: p.cutoutWidth || undefined,
    cutoutHeight: p.cutoutHeight || undefined,
    lipFraction: p.lipFraction || undefined,
    tabLength: p.tabLength || undefined,
    vPos: p.vPos,
    doorInset: p.doorInset || undefined,
    doorDrop: p.doorDrop || undefined,
  };
}

export function cabinetLayout(p) {
  const f = faceField(p);
  const layout = solveFronts(p.plan, f, frontOptions(p));
  const drawerStyle = layout.fronts.length <= FRAMED_DRAWER_MAX_FRONTS ? p.drawerStyle : 'slab';
  return { layout, field: f, drawerStyle, hw: handleSpec(p) };
}

export function surfaces(p) {
  const { layout } = cabinetLayout(p);
  const top = p.height;
  const result = [{
    id: 'top', x0: -p.width / 2, x1: p.width / 2, y: top, clear: 0.5, zBack: -p.depth / 2, zFront: p.depth / 2 + p.topOverhang, back: false, top: true,
  }];
  layout.open.forEach((cell, i) => {
    const floor = [cell.y0, ...cell.shelves].map((y, k) => ({ y, top: [...cell.shelves, cell.y1][k] }));
    floor.forEach((level, k) => {
      result.push({
        id: `open${i}.${k}`, x0: cell.x0, x1: cell.x1, y: level.y, clear: level.top - level.y, zBack: -p.depth / 2 + 0.01, zFront: p.depth / 2, back: true,
      });
    });
  });
  return result;
}
