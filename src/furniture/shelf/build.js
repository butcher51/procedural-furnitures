import * as THREE from 'three';
import { beam, endPanelShape, extrudeProfile, strut } from '../../core/geometry.js';
import { buildDecor } from '../../core/fill.js';
import { buildLegs } from '../../core/supports.js';
import { frameParts, zCentre } from './layout.js';
import { contentsLayout } from './params.js';

function materials(p, m) {
  const wood = (hex, grain) => m.wood(hex, { grain, seed: p.seed });
  const wide = p.style !== 'open' && p.grain === 'bold' ? 'plain' : p.grain;
  const frame = p.frameMode === 'wood'
    ? wood(p.frameColor, wide)
    : p.frameMode === 'metal' ? m.frame(p.frameColor, 'metal') : m.solid(p.frameColor, 0.8);
  const boardGrain = p.grain === 'bold' ? 'plain' : p.grain;
  let boards = frame;
  if (p.boardMode === 'wood') boards = wood(p.boardColor, boardGrain);
  else if (p.boardMode === 'painted') boards = m.solid(p.boardColor, 0.8);
  else if (p.frameMode === 'wood' && p.grain === 'bold') boards = wood(p.boardColor, boardGrain);
  let back = null;
  if (p.backMode === 'match') back = frame;
  else if (p.backMode === 'wood') back = wood(p.backColor, wide);
  else if (p.backMode === 'accent' || p.backMode === 'paint') {
    back = p.backPattern === 'linen'
      ? m.pattern({ kind: 'linen', colors: [p.backColor], thread: 0.006, strength: 0.5, seed: p.seed })
      : m.solid(p.backColor, 0.9);
  }
  return { frame, boards, back, decor: m.vertexColor() };
}

function boxMesh(d, mat) {
  const xm = (d.x0 + d.x1) / 2;
  const ym = (d.y0 + d.y1) / 2;
  const zm = (d.z0 + d.z1) / 2;
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  if (d.axis === 'x') return beam(v(d.x0, ym, zm), v(d.x1, ym, zm), d.z1 - d.z0, d.y1 - d.y0, d.r, mat);
  if (d.axis === 'z') return beam(v(xm, ym, d.z0), v(xm, ym, d.z1), d.x1 - d.x0, d.y1 - d.y0, d.r, mat);
  return beam(v(xm, d.y0, zm), v(xm, d.y1, zm), d.x1 - d.x0, d.z1 - d.z0, d.r, mat);
}

function partMesh(d, mats) {
  const mat = mats[d.role];
  let part;
  if (d.t === 'box') part = boxMesh(d, mat);
  else if (d.t === 'beam') part = beam(d.a, d.b, d.w, d.th, d.r, mat);
  else if (d.t === 'strut') part = strut(d.a, d.b, d.r, d.r, d.sides, mat);
  else if (d.t === 'legs') part = buildLegs(d.legParams, mats, d.fp);
  else if (d.t === 'panel') {
    const shape = endPanelShape(d.depth, d.height, { cut: d.cut, cutWidth: d.cutWidth, cutHeight: d.cutHeight });
    part = new THREE.Mesh(extrudeProfile(shape, d.thickness, 0.002), mat);
    part.position.x = d.x;
  } else {
    part = new THREE.Mesh(extrudeProfile(d.outline.map(([z, y]) => new THREE.Vector2(z, y)), d.thickness, 0.002), mat);
    part.position.x = d.x;
  }
  part.name = d.name;
  return part;
}

export function buildShelf(p, kit) {
  const mats = materials(p, kit.materials);
  const frame = new THREE.Group();
  frame.position.z = -zCentre(p);
  for (const d of frameParts(p)) frame.add(partMesh(d, mats));
  const parts = [frame];
  const { surfaces, layout } = contentsLayout(p);
  const colours = { covers: p.bookColors, pages: p.pageColor, objects: p.objectColors };
  surfaces.forEach((surface, i) => {
    if (layout[i].length) parts.push(buildDecor(layout[i], surface, colours, mats.decor));
  });
  return parts;
}
