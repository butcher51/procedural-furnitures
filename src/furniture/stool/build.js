import * as THREE from 'three';
import {
  beam, endPanelShape, extrudeProfile, extrudeUp, latheSolid, normalizeUVs, puffy, roundedDiscGeometry, strut, superellipseShape, tube,
} from '../../core/geometry.js';
import { grainAlong } from '../../core/patterns.js';
import { buildLegs, buildPedestal, buildStretchers, legLines } from '../../core/supports.js';

const SINK = 0.001;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function seatSolid(p, { width, depth, thickness, edge, bottom, mat }) {
  if (p.seatShape === 'round') {
    const mesh = new THREE.Mesh(roundedDiscGeometry(width / 2, thickness, edge, p.seatSides), mat);
    mesh.position.y = bottom + thickness / 2;
    return grainAlong(mesh, 'x');
  }
  if (p.seatShape === 'squircle' || p.seatShape === 'oval') {
    const bevel = Math.min(edge, thickness * 0.4);
    const outline = superellipseShape(width / 2 - bevel, depth / 2 - bevel, p.seatExponent);
    const mesh = new THREE.Mesh(normalizeUVs(extrudeUp(outline, thickness, bevel), width), mat);
    mesh.position.y = bottom;
    return grainAlong(mesh, 'x');
  }
  const mesh = puffy(width, thickness, depth, edge, mat);
  mesh.position.y = bottom + thickness / 2;
  return grainAlong(mesh, 'x');
}

function legObject(p) {
  return { legCount: p.legCount, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay, puff: p.puff };
}

function seatFootprint(p, top) {
  return { width: p.seatWidth, depth: p.seatDepth, top, round: p.seatShape === 'round', exponent: p.seatExponent };
}

function panAndCushion(p, mats, legTop) {
  const parts = [];
  const panEdge = Math.min(p.puff, p.seatThickness * 0.4);
  parts.push(seatSolid(p, { width: p.seatWidth, depth: p.seatDepth, thickness: p.seatThickness, edge: panEdge, bottom: legTop, mat: mats.pan }));
  if (p.hasCushion) {
    const thickness = p.cushionThickness + SINK;
    const edge = Math.max(p.puff, Math.min(0.03, p.cushionThickness * 0.45));
    parts.push(seatSolid(p, {
      width: p.seatWidth - 0.02, depth: p.seatDepth - 0.02, thickness, edge, bottom: legTop + p.seatThickness - SINK, mat: mats.cushion,
    }));
  }
  return parts;
}

function footrestParts(p, mats, lines) {
  if (p.footrestKind === 'none' || lines.length < 3) return [];
  const options = { radius: p.footrestRadius, sides: 6, stagger: p.footrestStagger ? p.footrestRadius * 3 : 0 };
  const parts = [buildStretchers(lines, p.footrestKind, p.footrestHeight, options, mats.frame)];
  if (p.footrestDouble) parts.push(buildStretchers(lines, 'ring', p.footrestHeight + p.footrestGap, options, mats.frame));
  return parts;
}

function buildLegged(p, mats) {
  const legTop = p.seatHeight - p.cushionThickness - p.seatThickness;
  const footprint = seatFootprint(p, legTop);
  const legs = legObject(p);
  return [
    ...panAndCushion(p, mats, legTop),
    buildLegs(legs, mats, footprint),
    ...footrestParts(p, mats, legLines(legs, footprint)),
  ];
}

function pedestalRing(p, mats) {
  const group = new THREE.Group();
  const y = p.footrestHeight;
  const R = p.pedestalRingRadius;
  const points = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return v3(Math.cos(a) * R, y, Math.sin(a) * R);
  });
  group.add(tube(points, p.footrestRadius, 6, mats.frame, true, 32));
  for (let i = 0; i < p.pedestalSpokes; i++) {
    const a = (i / p.pedestalSpokes) * Math.PI * 2 + Math.PI / 4;
    group.add(strut(v3(0, y, 0), v3(Math.cos(a) * R, y, Math.sin(a) * R), p.footrestRadius * 0.8, p.footrestRadius * 0.8, 6, mats.frame));
  }
  return group;
}

function buildDiner(p, mats) {
  const legTop = p.seatHeight - p.cushionThickness - p.seatThickness;
  const columnTop = legTop - p.hubHeight;
  const parts = [
    buildPedestal({
      top: legTop,
      base: p.baseShape,
      baseRadius: p.baseRadius,
      baseHeight: p.baseHeight,
      baseTaper: 0.35,
      columnRadius: p.columnRadius,
      columnSides: 10,
      sleeve: p.hasSleeve ? { radius: p.columnRadius * 1.6, height: 0.55 * (columnTop - p.baseHeight) } : null,
      cap: { radius: p.hubRadius, height: p.hubHeight },
    }, mats.frame),
  ];
  const pan = new THREE.Mesh(roundedDiscGeometry(p.seatWidth / 2 - 0.02, p.seatThickness, Math.min(0.01, p.seatThickness * 0.4), 12), mats.pan);
  pan.position.y = legTop + p.seatThickness / 2;
  parts.push(grainAlong(pan, 'x'));
  const cushion = new THREE.Mesh(roundedDiscGeometry(p.seatWidth / 2, p.cushionThickness + SINK, p.puff, 12), mats.cushion);
  cushion.position.y = legTop + p.seatThickness - SINK + (p.cushionThickness + SINK) / 2;
  parts.push(cushion);
  if (p.footrestKind === 'pedestalRing') parts.push(pedestalRing(p, mats));
  return parts;
}

function drumRadii(p) {
  const R = p.seatWidth / 2;
  if (p.drumProfile === 'barrel') return { bottom: R * p.drumWaist, top: R * p.drumWaist, mid: R };
  return { bottom: R, top: R, mid: R * (p.drumProfile === 'spool' ? p.drumWaist : 1) };
}

function drumProfile(p, radii, y0, y1) {
  const e = 0.008;
  const steps = 6;
  const radius = (t) => {
    if (p.drumProfile === 'spool') return radii.bottom - (radii.bottom - radii.mid) * Math.sin(Math.PI * t);
    if (p.drumProfile === 'barrel') return radii.bottom + (radii.mid - radii.bottom) * Math.sin(Math.PI * t);
    return radii.bottom;
  };
  const points = [[radius(0) - e, y0], [radius(0), y0 + e]];
  for (let i = 1; i < steps; i++) points.push([radius(i / steps), y0 + ((y1 - y0) * i) / steps]);
  points.push([radius(1), y1 - e], [radius(1) - e, y1]);
  return points;
}

function buildDrum(p, mats) {
  const parts = [];
  const radii = drumRadii(p);
  const lift = p.drumBase === 'plinth' ? p.plinthHeight : p.drumBase === 'feet' ? p.legHeight : 0;
  const bodyTop = p.seatHeight - p.cushionThickness;

  if (p.drumBase === 'plinth') {
    const plinth = new THREE.Mesh(roundedDiscGeometry(radii.bottom * 0.85, p.plinthHeight, Math.min(0.006, p.plinthHeight * 0.3), 12), mats.frame);
    plinth.position.y = p.plinthHeight / 2;
    parts.push(grainAlong(plinth, 'x'));
  }
  if (p.drumBase === 'feet') {
    const legs = legObject(p);
    const footprint = {
      width: radii.bottom * 2 + p.legThickness * 0.6,
      depth: radii.bottom * 2 + p.legThickness * 0.6,
      top: lift + 0.005,
      round: true,
    };
    parts.push(buildLegs(legs, mats, footprint));
  }

  const body = new THREE.Mesh(latheSolid(drumProfile(p, radii, lift, bodyTop), 12), p.hasCushion ? mats.body : mats.cushion);
  parts.push(body);

  if (p.hasCushion) {
    const thickness = p.cushionThickness + SINK;
    const cushion = new THREE.Mesh(roundedDiscGeometry(radii.top - 0.005, thickness, p.puff, 12), mats.cushion);
    cushion.position.y = bodyTop - SINK + thickness / 2;
    parts.push(cushion);
  }
  return parts;
}

function buildSlab(p, mats) {
  const parts = [];
  const plank = puffy(p.seatWidth, p.seatThickness, p.seatDepth, p.puff, mats.pan);
  plank.position.y = p.legHeight + p.seatThickness / 2;
  parts.push(grainAlong(plank, 'x'));

  const outline = endPanelShape(p.seatDepth, p.legHeight, {
    cut: p.slabCutout,
    cutWidth: p.slabCutoutWidth,
    cutHeight: p.slabCutoutHeight,
  });
  const bevel = Math.min(0.006, p.slabThickness * 0.3);
  const x = p.seatWidth / 2 - p.slabInset - p.slabThickness / 2;
  for (const sx of [-1, 1]) {
    const panel = new THREE.Mesh(normalizeUVs(extrudeProfile(outline, p.slabThickness, bevel, 'side'), p.seatDepth), mats.frame);
    panel.position.x = sx * x;
    parts.push(grainAlong(panel, 'y'));
  }
  if (p.footrestKind === 'stretcher') {
    const inner = x - p.slabThickness / 2 + 0.005;
    const r = p.footrestRadius;
    parts.push(beam(v3(-inner, p.footrestHeight, 0), v3(inner, p.footrestHeight, 0), r * 2, r * 2, r * 0.5, mats.frame));
  }
  return parts;
}

export const BUILDERS = {
  bar: buildLegged,
  counter: buildLegged,
  milking: buildLegged,
  diner: buildDiner,
  drum: buildDrum,
  slab: buildSlab,
};
