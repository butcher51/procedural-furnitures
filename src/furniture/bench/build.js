import * as THREE from 'three';
import {
  beam, boxProjectUVs, endPanelShape, extrudeProfile, extrudeUp, normalizeUVs, puffy, strut, superellipseShape,
} from '../../core/geometry.js';
import { splitSpan } from '../../core/layout.js';
import { buildApron, buildLegs, buildStretchers, buildTrestle, legLines, rowAnchors } from '../../core/supports.js';
import { grainAlong } from '../../core/patterns.js';
import { buildFramedBack } from './framedBack.js';
import { strokeShape } from './strokes.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const v2 = (z, y) => new THREE.Vector2(z, y);
const rad = (deg) => THREE.MathUtils.degToRad(deg);

function seatSlatsAlongX(p, mats, x0, x1) {
  const y = p.seatHeight - p.seatThickness / 2;
  return splitSpan(-p.seatDepth / 2, p.seatDepth / 2, p.seatSlatCount, p.slatGap).map(({ center, size }) =>
    beam(v3(x0, y, center), v3(x1, y, center), size, p.seatThickness, p.puff, mats.surface)
  );
}

function sideProfile(shape, thickness, bevel, mat, x) {
  const mesh = new THREE.Mesh(extrudeProfile(shape, thickness, bevel, 'side'), mat);
  mesh.position.x = x;
  return grainAlong(mesh, 'z');
}

function footCurl(zLeg, yc, rho, dir) {
  const pts = [];
  for (let k = 0; k <= 9; k++) {
    const phi = rad(180 + k * 30);
    const rr = rho * (1 - 0.4 * (k / 9));
    pts.push(v2(zLeg + dir * (rho + rr * Math.cos(phi)), yc + rr * Math.sin(phi)));
  }
  return pts;
}

function parkFrameStrokes(p) {
  const scroll = p.support === 'scroll';
  const D = p.seatDepth, H = p.seatHeight, fw = p.frameWidth;
  const angle = rad(p.backAngle);
  const bearerY = H - p.seatThickness - fw / 2 + 0.001;
  const zQ = -D / 2 - fw / 2;
  const zP = D / 2 - fw / 2;
  const top = v2(zQ - p.backHeight * Math.sin(angle), H + p.backHeight * Math.cos(angle));

  const rho = Math.max(0.04, Math.min(fw, 0.05));
  const frontLeg = scroll
    ? [...footCurl(zP, 0.867 * rho + fw / 2, rho, 1).reverse(), v2(zP, bearerY)]
    : [v2(zP + 0.04, 0), v2(zP, bearerY)];
  const main = [...frontLeg, v2(zQ, bearerY), v2(zQ, H), top];

  const dz = Math.max(0.04, 0.6 * p.backHeight * Math.sin(angle));
  const zr = zQ - dz;
  const rear = scroll
    ? [...footCurl(zr, 0.867 * rho + fw / 2, rho, -1).reverse(), v2(zQ, bearerY)]
    : [v2(zr, 0), v2(zQ, bearerY)];
  const strokes = [{ points: main, width: fw, floor: true }, { points: rear, width: fw, floor: true }];

  if (p.hasArms) {
    const aw = p.armWidth;
    const armY = H + p.armHeight - aw / 2;
    const zUp = zQ - p.armHeight * Math.tan(angle);
    strokes.push({ points: [v2(zP, bearerY), v2(zP, armY)], width: fw, floor: false });
    if (scroll) {
      const rhoA = Math.max(1.3 * aw, 0.05);
      const curl = [];
      for (let k = 0; k <= 9; k++) {
        const phi = rad(90 - k * 30);
        const rr = rhoA * (1 - 0.45 * (k / 9));
        curl.push(v2(zP + rr * Math.cos(phi), armY - rhoA + rr * Math.sin(phi)));
      }
      strokes.push({ points: [v2(zUp, armY), ...curl], width: aw, floor: false });
    } else {
      strokes.push({ points: [v2(zUp, armY), v2(zP - 0.04, armY), v2(zP + 0.02, armY - 0.03)], width: aw, floor: false });
    }
  }
  return strokes;
}

export function buildPark(p, mats) {
  const parts = seatSlatsAlongX(p, mats, -p.seatLength / 2, p.seatLength / 2);
  const bevel = Math.min(0.004, p.frameWidth * 0.25, p.frameThickness * 0.25, (p.hasArms ? p.armWidth : 1) * 0.25);
  const frameX = p.seatLength / 2 - p.legInset;
  for (const stroke of parkFrameStrokes(p)) {
    const shape = strokeShape(stroke.points, stroke.width, { floor: stroke.floor });
    for (const sx of [-1, 1]) parts.push(sideProfile(shape, p.frameThickness, bevel, mats.frame, sx * frameX));
  }

  const pivot = new THREE.Group();
  pivot.position.set(0, p.seatHeight, -p.seatDepth / 2 - p.frameWidth / 2);
  pivot.rotation.x = -rad(p.backAngle);
  const zOff = p.frameWidth / 2 + p.backThickness / 2 - 0.001;
  const half = p.seatLength / 2;
  for (const { center, size } of splitSpan(0.03, p.backHeight, p.backBarCount, 0.02)) {
    pivot.add(beam(v3(-half, center, zOff), v3(half, center, zOff), p.backThickness, size, p.puff, mats.surface));
  }
  parts.push(pivot);
  return parts;
}

export function buildGarden(p, mats) {
  const parts = [];
  const L = p.seatLength, D = p.seatDepth, H = p.seatHeight, T = p.seatThickness;
  const t = p.legThickness;
  const armT = 0.03;
  const anchors = rowAnchors(L, D, p.legCount / 2, t / 2, t / 2);
  const radius = t * Math.SQRT1_2;
  for (const [x, z] of anchors) {
    const raised = p.hasArms && z > 0 && Math.abs(x) > 0.01;
    const top = raised ? H + p.armHeight - armT + 0.002 : H;
    parts.push(strut(v3(x, 0, z), v3(x, top, z), radius, radius, 4, mats.frame));
  }

  const fp = { width: L, depth: D, top: H - T, anchors };
  const lines = legLines({ legCount: p.legCount, legThickness: t, legTaper: 1, legSplay: 0 }, fp);
  parts.push(buildApron(lines, { top: H - T + 0.001, height: p.apronHeight, thickness: t }, mats.frame));
  if (p.hasStretcher) parts.push(buildStretchers(lines, 'h', p.stretcherHeight, { radius: 0.012, profile: 'square' }, mats.frame));

  const edge = L / 2 - t + 0.001;
  parts.push(...seatSlatsAlongX(p, mats, -edge, edge));

  const angle = rad(p.backAngle);
  const pivotZ = -D / 2 + t / 2;
  const back = buildFramedBack(
    {
      width: L, height: p.backHeight, thickness: p.backThickness, postWidth: t, postDepth: t,
      style: p.backStyle, count: p.backBarCount, puff: p.puff,
    },
    mats
  );
  back.position.set(0, H, pivotZ);
  back.rotation.x = -angle;
  parts.push(back);

  if (p.hasArms) {
    const y = H + p.armHeight - armT / 2;
    const rear = pivotZ - p.armHeight * Math.tan(angle);
    const width = Math.max(p.armWidth, t);
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - t / 2);
      parts.push(beam(v3(x, y, D / 2 + 0.012), v3(x, y, rear), width, armT, 0.006, mats.frame));
    }
  }
  return parts;
}

function legParams(p) {
  return { legCount: p.legCount, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay, puff: 0.006 };
}

function buildStaked(p, mats) {
  const L = p.seatLength, D = p.seatDepth;
  const anchors = rowAnchors(L, D, p.legCount / 2, p.legInset, Math.min(0.05, D * 0.18));
  const fp = { width: L, depth: D, top: p.legHeight, anchors, splayAxes: [0.4, 1] };
  const parts = [buildLegs(legParams(p), mats, fp)];
  if (p.hasStretcher) {
    const lines = legLines(legParams(p), fp);
    parts.push(buildStretchers(lines, 'ends', p.stretcherHeight, { radius: p.legThickness * 0.3, sides: 6 }, mats.frame));
  }
  return parts;
}

function buildSlabEnds(p, mats) {
  const parts = [];
  const width = p.seatDepth * 0.9;
  const cutHeight = 0.3 * p.legHeight;
  const shape = endPanelShape(width, p.legHeight + 0.001, { cut: p.footNotch, cutWidth: 0.6 * width, cutHeight });
  const x = p.seatLength / 2 - p.legInset;
  for (const sx of [-1, 1]) parts.push(sideProfile(shape, p.frameThickness, Math.min(0.004, p.frameThickness * 0.25), mats.frame, sx * x));
  if (p.hasStretcher) {
    const t = Math.max(0.03, p.legThickness);
    parts.push(beam(v3(-x, p.stretcherHeight, 0), v3(x, p.stretcherHeight, 0), t, t, 0.006, mats.frame));
  }
  return parts;
}

function buildTrestleBase(p, mats) {
  return [
    buildTrestle(
      {
        length: p.seatLength, depth: p.seatDepth, top: p.legHeight + 0.001, kind: 'I', inset: p.legInset,
        footLength: 0.9 * p.seatDepth, footHeight: 0.04, beamWidth: p.legThickness,
        postDepth: Math.min(1.8 * p.legThickness, 0.5 * p.seatDepth), cleatHeight: 0.04, stretcherHeight: p.stretcherHeight,
      },
      mats.frame
    ),
  ];
}

export function buildPlank(p, mats) {
  const bevel = Math.min(p.puff, p.seatThickness * 0.4);
  const outline = superellipseShape(p.seatLength / 2 - bevel, p.seatDepth / 2 - bevel, p.seatExponent);
  const seat = new THREE.Mesh(normalizeUVs(extrudeUp(outline, p.seatThickness, bevel), p.seatLength), mats.surface);
  seat.position.y = p.seatHeight - p.seatThickness;
  grainAlong(seat, 'x');
  const base = { staked: buildStaked, slab: buildSlabEnds, trestle: buildTrestleBase }[p.support];
  return [seat, ...base(p, mats)];
}

export function buildPlatform(p, mats) {
  const L = p.seatLength, D = p.seatDepth, H = p.seatHeight, T = p.seatThickness;
  const parts = [];
  const y = H - T / 2;
  for (const { center, size } of splitSpan(-L / 2, L / 2, p.seatSlatCount, p.slatGap)) {
    parts.push(beam(v3(center, y, -D / 2), v3(center, y, D / 2), size, T, p.puff, mats.surface));
  }
  const railZ = D / 2 - 0.07;
  const railY = H - T + 0.001 - p.apronHeight / 2;
  for (const sz of [-1, 1]) {
    parts.push(beam(v3(-L / 2 + 0.02, railY, sz * railZ), v3(L / 2 - 0.02, railY, sz * railZ), 0.04, p.apronHeight, 0.004, mats.frame));
  }
  const anchors = rowAnchors(L, D, p.legCount / 2, p.legInset, 0.07);
  parts.push(buildLegs(legParams(p), mats, { width: L, depth: D, top: p.legHeight + 0.004, anchors, splayAxes: [1, 1] }));
  return parts;
}

function sledFrame(p) {
  const hz = p.seatDepth / 2 - 0.03;
  const fw = p.frameWidth;
  const h = p.legHeight;
  const shape = new THREE.Shape([v2(-hz, 0), v2(hz, 0), v2(hz, h), v2(-hz, h)]);
  shape.holes.push(new THREE.Path([v2(-hz + fw, fw), v2(-hz + fw, h - fw), v2(hz - fw, h - fw), v2(hz - fw, fw)]));
  return shape;
}

export function buildUpholstered(p, mats) {
  const parts = [];
  const L = p.seatLength, D = p.seatDepth, H = p.seatHeight, T = p.seatThickness;
  const bodyH = H - T - p.legHeight;
  const body = puffy(L, bodyH, D, p.puff, mats.body);
  body.position.y = p.legHeight + bodyH / 2;
  parts.push(body);

  const backDepth = p.hasBack ? p.backThickness : 0;
  const cushion = puffy(L, T, D - backDepth, p.puff, mats.surface);
  cushion.geometry = boxProjectUVs(cushion.geometry);
  cushion.position.set(0, H - T / 2, backDepth / 2);
  parts.push(cushion);

  if (p.hasBack) {
    const pivot = new THREE.Group();
    pivot.position.set(0, H - T, -D / 2 + p.backThickness / 2);
    pivot.rotation.x = -rad(p.backAngle);
    const back = puffy(L, p.backHeight, p.backThickness, p.puff, mats.surface);
    back.geometry = boxProjectUVs(back.geometry);
    back.position.y = p.backHeight / 2;
    pivot.add(back);
    parts.push(pivot);
  }

  if (p.support === 'sled') {
    const x = L / 2 - p.legInset;
    const bevel = Math.min(0.004, p.frameWidth * 0.3, p.frameThickness * 0.3);
    const shape = sledFrame(p);
    for (const sx of [-1, 1]) parts.push(sideProfile(shape, p.frameThickness, bevel, mats.frame, sx * x));
  } else {
    const anchors = rowAnchors(L, D, p.legCount / 2, p.legInset, p.legInset);
    parts.push(buildLegs(legParams(p), mats, { width: L, depth: D, top: p.legHeight + 0.01, anchors, splayAxes: [1, 1] }));
  }
  return parts;
}
