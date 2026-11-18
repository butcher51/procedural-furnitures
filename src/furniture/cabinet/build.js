import * as THREE from 'three';
import { beam, endPanelShape, extrudeProfile, puffy, strut } from '../../core/geometry.js';
import { buildCarcass, buildFronts } from '../../core/fronts.js';
import { grainAlong } from '../../core/patterns.js';
import { harmoniousSecondary, shade, swatch } from '../../core/palette.js';
import { buildApron, buildFeet, buildLegs, legLines, rowAnchors } from '../../core/supports.js';
import { cabinetLayout, carcassSpec, endThickness } from './layout.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function stoneMaterial(p, hex, m) {
  if (p.stoneName === 'grey terrazzo') return m.pattern({ kind: 'terrazzo', colors: [hex], seed: p.seed }, { roughness: 0.4 });
  const base = swatch(hex);
  const dir = base.l > 0.5 ? -1 : 1;
  return m.pattern({
    kind: 'terrazzo', colors: [hex, shade(base, 0.05 * dir).hex, shade(base, 0.08 * dir).hex], size: 0.006, density: 0.22, seed: p.seed,
  }, { roughness: 0.4 });
}

function makeMaterial(key, p, m) {
  const [kind, hex] = key.split(':');
  if (kind === 'wood') return m.wood(hex, { grain: p.grain, seed: p.seed });
  if (kind === 'solid') return m.solid(hex, p.paintSheen);
  if (kind === 'black') return m.frame(hex, 'black');
  if (kind === 'metal' || kind === 'brass') return m.frame(hex, 'metal');
  if (kind === 'white') return m.solid(hex, 0.45);
  if (kind === 'leather') return m.solid(hex, 0.8);
  if (kind === 'stone') return stoneMaterial(p, hex, m);
  if (kind === 'cane') {
    const holes = harmoniousSecondary(swatch(hex), 'dark').hex;
    return m.pattern({ kind: 'dots', layout: 'grid', spacing: 0.012, size: 0.28, colors: [hex, holes], seed: p.seed }, { roughness: 0.85 });
  }
  const holes = shade(swatch(hex), -0.25).hex;
  return m.pattern({ kind: 'dots', layout: 'grid', spacing: 0.01, size: 0.25, colors: [hex, holes], seed: p.seed }, { roughness: 0.4, metalness: 0.6 });
}

function createMats(p, m) {
  const made = new Map();
  for (const key of new Set(Object.values(p.roles).filter(Boolean))) made.set(key, makeMaterial(key, p, m));
  const role = (name) => made.get(p.roles[name]) ?? made.get(p.roles.body);
  return { top: role('top'), body: role('body'), front: role('front'), hardware: role('hardware'), base: role('base'), insert: role('insert') };
}

function buildTop(p, mats) {
  const top = puffy(p.width + 2 * p.topOverhang, p.topThickness, p.depth + p.topOverhang, p.topEdge, mats.top, 3);
  top.position.set(0, p.height - p.topThickness / 2, p.topOverhang / 2);
  return grainAlong(top, 'x');
}

function sidePanel(shape, thickness, x, mat) {
  const mesh = new THREE.Mesh(extrudeProfile(shape, thickness, Math.min(0.003, thickness * 0.3), 'side'), mat);
  mesh.position.x = x;
  return grainAlong(mesh, 'z');
}

function frontPanelShape(shape, thickness, z, mat) {
  const mesh = new THREE.Mesh(extrudeProfile(shape, thickness, Math.min(0.003, thickness * 0.3), 'front'), mat);
  mesh.position.z = z;
  return grainAlong(mesh, 'x');
}

function carcassFront(p) {
  return p.construction === 'inset' ? p.depth / 2 : p.depth / 2 - p.frontThickness;
}

function buildLegged(p, mats) {
  const parts = [];
  const anchors = rowAnchors(p.width, p.depth, p.legCount / 2, p.legInsetX, p.legInsetZ);
  const legObject = { legCount: p.legCount, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay };
  const fp = { width: p.width, depth: p.depth, top: p.legHeight, anchors };
  parts.push(buildLegs(legObject, { frame: mats.base }, fp));
  if (p.baseKind === 'frameLegs') {
    const lines = legLines(legObject, fp);
    parts.push(buildApron(lines, { top: p.legHeight, height: p.apronHeight, thickness: 0.02 }, mats.base));
  }
  return parts;
}

function buildPlinth(p, mats) {
  const frontZ = carcassFront(p) - p.plinthInset;
  const depth = frontZ + p.depth / 2;
  const plinth = puffy(p.width - 2 * p.plinthInset, p.legHeight + 0.002, depth, 0.006, mats.base, 2);
  plinth.position.set(0, (p.legHeight + 0.002) / 2, (frontZ - p.depth / 2) / 2);
  return [grainAlong(plinth, 'x')];
}

function buildSkirt(p, mats) {
  const t = 0.02;
  const zFront = carcassFront(p);
  const length = zFront + p.depth / 2;
  const cut = { cut: p.skirtCut, cutHeight: p.skirtCutHeight };
  const front = frontPanelShape(endPanelShape(p.width, p.legHeight, { ...cut, cutWidth: p.width - 2 * p.skirtFoot }), t, zFront - t / 2, mats.base);
  const sides = [-1, 1].map((s) => {
    const shape = endPanelShape(length, p.legHeight, { ...cut, cutWidth: length - 2 * p.skirtFoot });
    const panel = sidePanel(shape, t, s * (p.width / 2 - t / 2), mats.base);
    panel.position.z = (zFront - p.depth / 2) / 2;
    return panel;
  });
  return [front, ...sides];
}

function buildBun(p, mats) {
  const anchors = rowAnchors(p.width, p.depth, 2, p.legInsetX, p.legInsetZ);
  return buildFeet(anchors, { kind: 'bun', height: p.legHeight + 0.002, radius: p.bunRadius }, mats.base);
}

function buildPanelEnds(p, mats) {
  const t = endThickness(p);
  const height = p.height - p.topThickness;
  const cutWidth = 0.5 * p.depth;
  const shape = endPanelShape(p.depth, height, { cut: p.endCut, cutWidth, cutHeight: p.legHeight });
  return [-1, 1].map((s) => {
    const panel = sidePanel(shape, t, s * (p.width / 2 - t / 2), mats.base);
    panel.position.z = 0;
    return panel;
  });
}

function buildHairpin(p, mats) {
  const parts = [];
  const anchors = rowAnchors(p.width, p.depth, p.legCount / 2, p.legInsetX, p.legInsetZ);
  const r = p.legThickness / 2;
  const half = 0.035;
  for (const [x, z] of anchors) {
    const plate = beam(v3(x - half - r, p.legHeight - 0.002, z), v3(x + half + r, p.legHeight - 0.002, z), 0.05, 0.004, 0.0015, mats.base);
    parts.push(plate);
    for (const s of [-1, 1]) {
      parts.push(strut(v3(x, 0, z), v3(x + s * half, p.legHeight - 0.002, z), r, r, 6, mats.base));
    }
  }
  return parts;
}

function buildMetalFrame(p, mats) {
  const parts = [];
  const s = p.postSize;
  const top = p.height - p.topThickness;
  const px = p.width / 2 - s / 2;
  const pz = p.depth / 2 - s / 2;
  const radius = Math.min(0.003, s * 0.2);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) parts.push(beam(v3(sx * px, 0, sz * pz), v3(sx * px, top, sz * pz), s, s, radius, mats.base));
    const rail = (y, h) => beam(v3(sx * px, y, -pz), v3(sx * px, y, pz), s * 0.8, h, radius, mats.base);
    parts.push(rail(p.legHeight - s * 0.4, s * 0.8));
    if (p.sideBrace === 'x') {
      const lo = Math.max(0.03, s);
      const hi = p.legHeight - Math.max(0.03, s);
      const brace = s * 0.5;
      parts.push(beam(v3(sx * px, lo, -pz), v3(sx * px, hi, pz), brace, brace, 0.002, mats.base));
      parts.push(beam(v3(sx * px, lo, pz), v3(sx * px, hi, -pz), brace, brace, 0.002, mats.base));
    }
  }
  if (p.bottomShelf) {
    const inner = p.width / 2 - s;
    parts.push(beam(v3(-inner, p.bottomShelfHeight, 0), v3(inner, p.bottomShelfHeight, 0), p.depth - 2 * s, 0.02, 0.003, mats.base));
  }
  return parts;
}

const BASES = {
  legs: buildLegged,
  frameLegs: buildLegged,
  plinth: buildPlinth,
  skirt: buildSkirt,
  bun: buildBun,
  panelEnds: buildPanelEnds,
  hairpin: buildHairpin,
  metalFrame: buildMetalFrame,
};

export function buildCabinet(p, kit) {
  const mats = createMats(p, kit.materials);
  const { layout, drawerStyle, hw } = cabinetLayout(p);
  const spec = carcassSpec(p);
  const carcass = buildCarcass({
    width: spec.width, depth: p.depth, y0: p.legHeight, y1: p.height - p.topThickness, panel: p.panel, sides: spec.sides,
    construction: p.construction, frontThickness: p.frontThickness, edge: p.edge,
  }, mats.body);
  const parts = [buildTop(p, mats), ...carcass.parts, ...BASES[p.baseKind](p, mats).flat()];
  if (p.hasFronts || layout.open.length) {
    const fronts = buildFronts(layout, {
      thickness: p.frontThickness,
      bevel: p.frontBevel,
      drawerStyle,
      doorStyle: p.doorStyle,
      frameWidth: p.doorFrameWidth * 0.7,
      doorFrameWidth: p.doorFrameWidth,
      fullDepth: carcass.innerDepth,
      opening: carcass.opening,
    }, hw, { front: mats.front, insert: mats.insert, hardware: mats.hardware, carcass: mats.body });
    parts.push(...fronts);
  }
  return parts;
}
