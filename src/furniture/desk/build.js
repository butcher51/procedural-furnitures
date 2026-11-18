import * as THREE from 'three';
import { grainAlong } from '../../core/patterns.js';
import { buildDecor, paintVertices } from '../../core/fill.js';
import { buildCarcass, buildFronts } from '../../core/fronts.js';
import { normalizeHandle } from '../../core/handles.js';
import {
  beam, endPanelShape, extrudeProfile, extrudeUp, normalizeUVs, puffy, strut, superellipseShape,
} from '../../core/geometry.js';
import {
  buildApron, buildFeet, buildLegs, buildStretchers, buildTrestle, legLines, pointOnLeg, turnedPost,
} from '../../core/supports.js';
import {
  POST_WIDTH, SHELF_THICKNESS, clearSpan, columnStages, columnX, floorPedestals, frontRegions, inlayRect, kneeSpan, legPlan,
  panelInner, propPlan, riserWidth, sideSign, wingLength,
} from './layout.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const PAGES = '#efe8da';

function materials(p, kit) {
  const m = kit.materials;
  const wood = (hex) => m.wood(hex, { grain: p.grain, seed: p.seed });
  const top = p.topFinish === 'wood' ? wood(p.topColor) : m.solid(p.topColor, 0.8);
  let body = top;
  if (p.bodyMode === 'wood') body = wood(p.bodyColor);
  else if (p.bodyMode === 'painted') body = m.solid(p.bodyColor, 0.8);
  else if (p.bodyMode !== 'top') body = m.frame(p.bodyColor, p.bodyMode);
  const front = p.frontMode === 'top' ? top : body;
  let hardware = front;
  if (p.hardwareMode === 'black') hardware = m.frame(p.hardwareColor, 'black');
  else if (p.hardwareMode === 'metal' || p.hardwareMode === 'brass') hardware = m.frame(p.hardwareColor, 'metal');
  const propCount = propPlan(p).length;
  const decor = p.inlay || propCount ? m.vertexColor() : null;
  return { top, body, front, hardware, decor };
}

function buildTop(p, mats) {
  let mesh;
  if (p.topExponent >= 10) {
    mesh = puffy(p.topWidth, p.topThickness, p.topDepth, p.topEdge, mats.top);
    mesh.position.y = p.topHeight - p.topThickness / 2;
  } else {
    const bevel = Math.min(p.topEdge, p.topThickness * 0.4);
    const outline = superellipseShape(p.topWidth / 2 - bevel, p.topDepth / 2 - bevel, p.topExponent);
    mesh = new THREE.Mesh(normalizeUVs(extrudeUp(outline, p.topThickness, bevel), p.topWidth), mats.top);
    mesh.position.y = p.legHeight;
  }
  mesh.name = 'top';
  return grainAlong(mesh, 'x');
}

function buildAddon(p, mats) {
  if (p.topAddon === 'none') return [];
  const { topWidth: W, topDepth: D, topHeight: H, addonHeight: h, addonDepth: d } = p;
  if (p.topAddon === 'rail') {
    const zb = -D / 2 + 0.015 + d / 2;
    const hx = W / 2 - 0.015;
    const y = H + h / 2;
    const parts = [beam(v3(-hx, y, zb), v3(hx, y, zb), d, h, 0.003, mats.top)];
    for (const sx of [-1, 1]) parts.push(beam(v3(sx * (hx - d / 2), y, zb), v3(sx * (hx - d / 2), y, zb + wingLength(p)), d, h, 0.003, mats.top));
    return parts;
  }
  const rw = riserWidth(p);
  const zc = -D / 2 + 0.03 + d / 2;
  const parts = [beam(v3(-rw / 2, H + h + SHELF_THICKNESS / 2, zc), v3(rw / 2, H + h + SHELF_THICKNESS / 2, zc), d, SHELF_THICKNESS, 0.003, mats.top)];
  for (const sx of [-1, 1]) parts.push(beam(v3(sx * (rw / 2 - POST_WIDTH / 2), H, zc), v3(sx * (rw / 2 - POST_WIDTH / 2), H + h, zc), POST_WIDTH, d, 0.003, mats.top));
  return parts;
}

function buildInlay(p, mats) {
  if (!p.inlay) return [];
  const { x, zFront, zBack } = inlayRect(p);
  if (zFront - zBack < 0.08) return [];
  const mesh = beam(v3(-x, p.topHeight + 0.0005, (zFront + zBack) / 2), v3(x, p.topHeight + 0.0005, (zFront + zBack) / 2), zFront - zBack, 0.002, 0.0005, mats.decor);
  mesh.geometry = paintVertices(mesh.geometry, p.inlayColor);
  return [mesh];
}

function buildProps(p, mats) {
  return propPlan(p).map(({ kind, surface, records }) => {
    const colours = { covers: p.bookColors, pages: PAGES, objects: [kind === 'laptop' ? p.laptopColor : p.cupColor] };
    return buildDecor(records, surface, colours, mats.decor);
  });
}

function bodyBeam(a, b, width, thickness, mat, radius = 0.004) {
  return beam(a, b, width, thickness, radius, mat);
}

function buildLegged(p, mats) {
  const parts = [];
  const leg = legPlan(p);
  const legParams = { legCount: 4, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay };
  const fp = { width: p.topWidth - 2 * p.overhang, depth: p.topDepth - 2 * p.overhang, top: p.legHeight, anchors: leg.anchors };
  const lines = legLines(legParams, fp);
  if (p.legProfile === 'turned') {
    const block = Math.min(Math.max(p.apronHeight, 0.07), p.legHeight * 0.4);
    for (const line of lines) {
      const post = turnedPost({ height: p.legHeight, thickness: p.legThickness, blocks: [[p.legHeight - block, p.legHeight]] }, mats.body);
      post.position.set(line.top.x, 0, line.top.z);
      parts.push(post);
    }
  } else {
    parts.push(buildLegs(legParams, { frame: mats.body }, fp));
  }
  const setback = Math.max(0, p.legThickness / 2 - p.apronThickness / 2);
  const apron = { top: p.legHeight, height: p.apronHeight, thickness: p.apronThickness, setback };
  parts.push(buildApron(lines, { ...apron, edges: 'short' }, mats.body));
  parts.push(buildApron([lines[2], lines[3]], apron, mats.body));
  const y = p.legHeight - p.apronHeight / 2;
  const front = pointOnLeg(lines[0], y);
  const zr = leg.zFront - p.apronThickness / 2;
  if (p.style === 'writing') {
    const drawers = p.apronDrawers > 0 ? p.frontThickness : 0;
    parts.push(bodyBeam(v3(-front.x, y, zr - drawers), v3(front.x, y, zr - drawers), p.apronThickness, p.apronHeight, mats.body));
  } else {
    const [k0, k1] = kneeSpan(p);
    const from = sideSign(p.pedestalSide) > 0 ? -front.x : k0;
    const to = sideSign(p.pedestalSide) > 0 ? k1 : front.x;
    parts.push(bodyBeam(v3(from, y, zr), v3(to, y, zr), p.apronThickness, p.apronHeight, mats.body));
  }
  if (p.stretcher !== 'none') {
    parts.push(buildStretchers(lines, p.stretcher, p.stretcherHeight, {
      radius: p.stretcherThickness / 2, profile: p.legSides === 4 ? 'square' : 'round',
    }, mats.body));
  }
  return parts;
}

function pedestalFoot(p, ped, mats) {
  const w = p.pedestalWidth;
  const d = p.pedestalDepth;
  const bh = p.pedestalBaseHeight;
  const ax = w / 2 - 0.03;
  const az = d / 2 - 0.03;
  if (p.pedestalBase === 'plinth') {
    const recess = Math.min(0.05, 0.03 + 0.5 * (bh - 0.06));
    const plinth = puffy(w - 2 * recess, bh, d - recess, 0.004, mats.body, 2);
    plinth.position.set(ped.x, bh / 2, -recess / 2);
    return [grainAlong(plinth, 'x')];
  }
  const anchors = [[ped.x + ax, az], [ped.x - ax, az], [ped.x - ax, -az], [ped.x + ax, -az]];
  if (p.pedestalBase === 'feet') return buildFeet(anchors, { kind: 'block', height: bh, radius: 0.025 }, mats.body);
  if (p.pedestalBase === 'legs') {
    const legs = { legCount: 4, legThickness: 0.03, legSides: 4, legTaper: 0.6, legSplay: 0 };
    return [buildLegs(legs, { frame: mats.body }, { width: w, depth: d, top: bh, anchors })];
  }
  return [];
}

function slab(p, x, depth, thickness, mats, cutHeight, cut) {
  const shape = endPanelShape(depth, p.legHeight, { cut, cutWidth: 0.5 * depth, cutHeight });
  const mesh = new THREE.Mesh(extrudeProfile(shape, thickness, Math.min(0.004, thickness * 0.3), 'side'), mats.body);
  mesh.position.set(x, 0, 0);
  return grainAlong(mesh, 'y');
}

function buildPedestalDesk(p, mats) {
  if (p.pedestalLayout === 'hung') return buildLegged(p, mats);
  const parts = [];
  const L = p.legHeight;
  const [x0, x1] = clearSpan(p);
  for (const ped of floorPedestals(p)) parts.push(...pedestalFoot(p, ped, mats));
  if (p.pedestalLayout === 'single') {
    const s = sideSign(p.pedestalSide);
    const edge = p.topWidth / 2 - p.pedestalOverhang;
    const pd = p.pedestalDepth;
    if (p.endSupport === 'panel') {
      parts.push(slab(p, -s * (edge - p.panelThickness / 2), pd, p.panelThickness, mats, p.panelCutHeight, p.panelCut));
    } else {
      const t = p.legThickness;
      const xe = -s * (edge - t / 2);
      const zb = pd / 2 - t / 2;
      for (const z of [zb, -zb]) parts.push(strut(v3(xe, 0, z), v3(xe, L, z), t / 2, (t / 2) * p.legTaper, p.legSides, mats.body));
      parts.push(bodyBeam(v3(xe, L - p.apronHeight / 2, -zb), v3(xe, L - p.apronHeight / 2, zb), p.apronThickness, p.apronHeight, mats.body));
      if (!p.modestyPanel) {
        const zr = -pd / 2 + p.apronThickness / 2;
        parts.push(bodyBeam(v3(x0 - 0.002, L - p.apronHeight / 2, zr), v3(x1 + 0.002, L - p.apronHeight / 2, zr), p.apronThickness, p.apronHeight, mats.body));
      }
    }
  }
  if (p.modestyPanel) {
    const zr = -p.pedestalDepth / 2 + p.carcassThickness / 2;
    parts.push(bodyBeam(v3(x0 - 0.002, L - p.modestyHeight / 2, zr), v3(x1 + 0.002, L - p.modestyHeight / 2, zr), p.carcassThickness, p.modestyHeight, mats.body));
  }
  return parts;
}

function cleatLengthFor(p) {
  const full = 0.8 * p.topDepth;
  if (p.topExponent >= 10) return full;
  const hx = p.topWidth / 2;
  const hz = p.topDepth / 2;
  const x = Math.min(hx - 0.01, hx - p.trestleInset + p.beamWidth / 2);
  const e = p.topExponent;
  const zMax = hz * Math.max(0, 1 - (x / hx) ** e) ** (1 / e);
  return Math.max(0.2, Math.min(full, 2 * (zMax - 0.05)));
}

function buildTrestleDesk(p, mats) {
  return [buildTrestle({
    cleatLength: cleatLengthFor(p),
    length: p.topWidth,
    depth: p.topDepth,
    top: p.legHeight,
    kind: p.trestleKind,
    inset: p.trestleInset,
    footLength: p.footLength,
    footHeight: p.footHeight,
    beamWidth: p.beamWidth,
    postDepth: p.postDepth,
    cleatHeight: p.cleatHeight,
    stretcherHeight: p.trestleStretcherHeight,
    stretcher: p.trestleKind !== 'X',
    backRail: p.trestleBackRail,
  }, mats.body)];
}

function buildPanelDesk(p, mats) {
  const depth = p.panelDepth * p.topDepth;
  const parts = [];
  for (const s of [-1, 1]) parts.push(slab(p, s * (p.topWidth / 2 - p.panelInset - p.panelThickness / 2), depth, p.panelThickness, mats, p.panelCutHeight, p.panelCut));
  if (p.modestyPanel) {
    const f = panelInner(p) + 0.002;
    const zr = -depth / 2 + p.carcassThickness / 2;
    parts.push(bodyBeam(v3(-f, p.legHeight - p.modestyHeight / 2, zr), v3(f, p.legHeight - p.modestyHeight / 2, zr), p.carcassThickness, p.modestyHeight, mats.body));
  }
  return parts;
}

function buildStandingDesk(p, mats) {
  const parts = [];
  const cx = columnX(p);
  const L = p.legHeight;
  const barY = L - p.crossbarHeight / 2;
  for (const s of [-1, 1]) {
    const x = s * cx;
    parts.push(bodyBeam(v3(x, p.frameFootHeight / 2, -p.frameFootLength / 2), v3(x, p.frameFootHeight / 2, p.frameFootLength / 2), p.frameFootWidth, p.frameFootHeight, mats.body, 0.005));
    for (const stage of columnStages(p)) parts.push(bodyBeam(v3(x, stage.y0, p.columnZ), v3(x, stage.y1, p.columnZ), stage.w, stage.d, mats.body, 0.003));
    const len = Math.max(0.25, 0.55 * p.topDepth);
    parts.push(bodyBeam(v3(x, barY, p.columnZ - len / 2), v3(x, barY, p.columnZ + len / 2), p.columnWidth, p.crossbarHeight, mats.body, 0.004));
  }
  parts.push(bodyBeam(v3(-cx, barY, p.columnZ), v3(cx, barY, p.columnZ), 0.04, p.crossbarHeight, mats.body, 0.004));
  if (p.controlBox) {
    const box = puffy(0.12, 0.025, 0.05, 0.006, mats.body, 2);
    box.position.set(p.topWidth / 2 - 0.1, L - 0.0125, p.topDepth / 2 - 0.07);
    parts.push(box);
  }
  return parts;
}

const BASES = {
  writing: buildLegged,
  pedestal: buildPedestalDesk,
  trestle: buildTrestleDesk,
  standing: buildStandingDesk,
  panel: buildPanelDesk,
};

function buildRegions(p, mats) {
  const parts = [];
  const hw = normalizeHandle({ kind: p.handleKind, size: p.handleSize });
  const fronts = { front: mats.front, hardware: mats.hardware, carcass: mats.body };
  for (const region of frontRegions(p)) {
    if (region.carcass) parts.push(...buildCarcass({ ...region.carcass }, mats.body).parts);
    parts.push(...buildFronts(region.layout, {
      thickness: p.frontThickness,
      drawerStyle: p.drawerStyle,
      doorStyle: 'slab',
      frameWidth: 0.022,
      members: region.members,
      backers: region.backers,
      opening: region.opening ?? null,
    }, hw, fronts));
  }
  return parts;
}

export function buildDesk(p, kit) {
  const mats = materials(p, kit);
  return [
    buildTop(p, mats),
    ...buildAddon(p, mats),
    ...BASES[p.style](p, mats),
    ...buildRegions(p, mats),
    ...buildInlay(p, mats),
    ...buildProps(p, mats),
  ];
}
