import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  bendZ, bentBandGeometry, edgeRadius, extrudeUp, normalizeUVs, puffy, roundedDiscGeometry, strut, superellipseShape, tube,
} from '../../core/geometry.js';
import { buildCurvyLegs, buildLegs } from '../../core/supports.js';

function buildSeat(p, mats) {
  const geo =
    p.seatShape === 'round'
      ? roundedDiscGeometry(p.seatWidth / 2, p.seatThickness, p.puff, p.seatSides)
      : new RoundedBoxGeometry(p.seatWidth, p.seatThickness, p.seatDepth, 3, edgeRadius(p.puff, p.seatWidth, p.seatThickness, p.seatDepth));
  const seat = new THREE.Mesh(geo, mats.surface);
  seat.position.y = p.seatHeight - p.seatThickness / 2;
  return seat;
}

function buildBackrest(p, mats) {
  // Pivot sits on the back edge of the seat; tilting it tilts the whole back.
  const pivot = new THREE.Group();
  const backEdge = p.seatShape === 'round' ? (p.seatWidth / 2) * 0.85 : p.seatDepth / 2;
  pivot.position.set(0, p.seatHeight, -backEdge + p.backThickness / 2);
  pivot.rotation.x = -THREE.MathUtils.degToRad(p.backAngle);

  const w = p.backWidth, h = p.backHeight, t = p.backThickness;

  if (p.backStyle === 'panel') {
    const panel = puffy(w, h, t, p.puff, mats.surface);
    panel.position.y = h / 2;
    pivot.add(panel);
    return pivot;
  }

  // Frame: two posts + a patterned top rail, filled with slats or rails
  const postW = Math.max(t, p.legThickness * 0.8);
  for (const sx of [-1, 1]) {
    const post = puffy(postW, h, t, p.puff, mats.frame);
    post.position.set(sx * (w / 2 - postW / 2), h / 2, 0);
    pivot.add(post);
  }
  const railH = Math.max(h * 0.22, 0.05);
  const topRail = puffy(w, railH, t * 1.1, p.puff, mats.surface);
  topRail.position.y = h - railH / 2;
  pivot.add(topRail);

  const innerW = w - postW * 2;
  const innerH = h - railH;
  const n = p.backBarCount;
  if (p.backStyle === 'slats') {
    const slatW = Math.min(innerW / (n * 2), 0.04);
    for (let i = 0; i < n; i++) {
      const slat = puffy(slatW, innerH, t * 0.6, p.puff, mats.frame);
      slat.position.set(-innerW / 2 + (innerW * (i + 0.5)) / n, innerH / 2, 0);
      pivot.add(slat);
    }
  } else {
    const barH = Math.min(innerH / (n * 2.5), 0.035);
    for (let i = 0; i < n; i++) {
      const bar = puffy(innerW, barH, t * 0.6, p.puff, mats.frame);
      bar.position.y = (innerH * (i + 0.5)) / n;
      pivot.add(bar);
    }
  }
  return pivot;
}

export function buildClassic(p, mats) {
  const footprint = {
    width: p.seatWidth,
    depth: p.seatDepth,
    top: p.seatHeight - p.seatThickness,
    round: p.seatShape === 'round',
  };
  return [buildSeat(p, mats), buildLegs(p, mats, footprint), buildBackrest(p, mats)];
}

function buildCurvyBack(p, mats) {
  const w = p.backWidth, h = p.backHeight, t = p.backThickness;
  const hx = p.seatWidth / 2, hz = p.seatDepth / 2;

  // Bend the back so its ends follow the seat outline
  const e = p.seatExponent;
  const bend = hz - hz * Math.max(1 - (w / 2 / hx) ** e, 0) ** (1 / e);

  const pivot = new THREE.Group();
  pivot.position.set(0, p.seatHeight, -hz + t / 2 + 0.012);
  pivot.rotation.x = -THREE.MathUtils.degToRad(p.backAngle);

  const radius = Math.max(p.legThickness / 2, 0.014);
  const z = (x) => bendZ(x, w / 2, bend);
  const arch = (halfW, height) =>
    [[-1, 0], [-1, 0.55], [-0.8, 0.9], [0, 1], [0.8, 0.9], [1, 0.55], [1, 0]].map(
      ([fx, fy]) => new THREE.Vector3(fx * halfW, fy * height, z(fx * halfW))
    );

  if (p.backStyle === 'hoop') {
    // Outer bentwood hoop + a smaller inner loop
    pivot.add(tube(arch(w / 2, h), radius, 6, mats.frame, false, 24));
    pivot.add(tube(arch(w * 0.28, h * 0.72), radius * 0.75, 6, mats.frame, false, 20));
  } else if (p.backStyle === 'crest') {
    // Two posts, a bent crest rail on top and spindles in between
    const railH = Math.max(h * 0.22, 0.06);
    const crest = new THREE.Mesh(bentBandGeometry(w, railH, t * 1.4, bend), mats.surface);
    crest.position.y = h - railH;
    pivot.add(crest);
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - radius);
      pivot.add(tube([new THREE.Vector3(x, 0, z(x)), new THREE.Vector3(x, h - railH * 0.5, z(x))], radius, 6, mats.frame, false, 1));
    }
    const n = p.backBarCount;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + radius * 2 + ((w - radius * 4) * (i + 1)) / (n + 1);
      pivot.add(strut(new THREE.Vector3(x, 0, z(x)), new THREE.Vector3(x, h - railH * 0.5, z(x)), radius * 0.45, radius * 0.45, 5, mats.frame));
    }
  } else {
    pivot.add(new THREE.Mesh(bentBandGeometry(w, h, t, bend), mats.surface));
  }
  return pivot;
}

export function buildCurvy(p, mats) {
  const seatBottom = p.seatHeight - p.seatThickness;
  const bevel = Math.min(p.puff, p.seatThickness * 0.4);
  const outline = superellipseShape(p.seatWidth / 2 - bevel, p.seatDepth / 2 - bevel, p.seatExponent);
  const seat = new THREE.Mesh(normalizeUVs(extrudeUp(outline, p.seatThickness, bevel), p.seatWidth), mats.surface);
  seat.position.y = seatBottom;

  const footprint = { width: p.seatWidth, depth: p.seatDepth, top: seatBottom, exponent: p.seatExponent };
  return [seat, buildCurvyLegs(p, mats, footprint), buildCurvyBack(p, mats)];
}

// Upholstered armchair: short legs -> body block -> fat seat & back cushions,
// with optional chunky arms on both sides of the body.
export function buildCozy(p, mats) {
  const parts = [];
  const armW = p.hasArms ? p.armWidth : 0;
  const cushionBottom = p.seatHeight - p.seatThickness;

  const bodyH = cushionBottom - p.legHeight;
  const body = puffy(p.seatWidth, bodyH, p.seatDepth, p.puff, mats.body);
  body.position.y = p.legHeight + bodyH / 2;
  parts.push(body);

  if (p.hasArms) {
    const armH = p.seatHeight + p.armHeight - p.legHeight;
    for (const sx of [-1, 1]) {
      const arm = puffy(armW, armH, p.seatDepth, p.puff * 1.5, mats.body);
      arm.position.set(sx * (p.seatWidth / 2 + armW / 2), p.legHeight + armH / 2, 0);
      parts.push(arm);
    }
  }

  // Seat cushion sits in front of the back cushion
  const cushionDepth = p.seatDepth - p.backThickness;
  const cushion = puffy(p.seatWidth, p.seatThickness, cushionDepth, p.puff * 1.5, mats.surface);
  cushion.position.set(0, cushionBottom + p.seatThickness / 2, p.backThickness / 2);
  parts.push(cushion);

  // Back cushion pivots on its bottom edge at the rear of the body
  const pivot = new THREE.Group();
  pivot.position.set(0, cushionBottom, -p.seatDepth / 2 + p.backThickness / 2);
  pivot.rotation.x = -THREE.MathUtils.degToRad(p.backAngle);
  const back = puffy(p.backWidth, p.backHeight, p.backThickness, p.puff * 1.5, mats.surface);
  back.position.y = p.backHeight / 2;
  pivot.add(back);
  parts.push(pivot);

  const footprint = { width: p.seatWidth + armW * 2, depth: p.seatDepth, top: p.legHeight, round: false };
  parts.push(buildLegs(p, mats, footprint));
  return parts;
}
