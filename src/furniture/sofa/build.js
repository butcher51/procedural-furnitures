import * as THREE from 'three';
import { boxProjectUVs, edgeRadius, extrudeProfile, extrudeUp, puffy, roundedDiscGeometry } from '../../core/geometry.js';
import { splitSpan } from '../../core/layout.js';
import { buildLegs, rowAnchors } from '../../core/supports.js';

const rad = (deg) => (deg * Math.PI) / 180;
const OVERLAP = 0.004;
const tiltDeficit = (radius, angle) => radius * (Math.sin(angle) + Math.cos(angle) - 1);

function place(mesh, x, y, z, name) {
  mesh.position.set(x, y, z);
  if (name) mesh.name = name;
  return mesh;
}

function upholster(mesh) {
  mesh.geometry = boxProjectUVs(mesh.geometry, 1);
  return mesh;
}

function insetPolygon(points, b) {
  const area = points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + (x * ny - nx * y);
  }, 0);
  const sign = area > 0 ? 1 : -1;
  const normal = ([ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    return [(-dy / len) * sign, (dx / len) * sign];
  };
  return points.map((v, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const n1 = normal(prev, v), n2 = normal(v, next);
    const k = b / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    return [v[0] + (n1[0] + n2[0]) * k, v[1] + (n1[1] + n2[1]) * k];
  });
}

function roundedPolygonShape(points, radius, steps = 3) {
  const shape = new THREE.Shape();
  const n = points.length;
  const out = [];
  points.forEach((v, i) => {
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    const lp = Math.hypot(prev[0] - v[0], prev[1] - v[1]);
    const ln = Math.hypot(next[0] - v[0], next[1] - v[1]);
    const t = Math.min(radius, lp / 2, ln / 2);
    const a = [v[0] + ((prev[0] - v[0]) / lp) * t, v[1] + ((prev[1] - v[1]) / lp) * t];
    const c = [v[0] + ((next[0] - v[0]) / ln) * t, v[1] + ((next[1] - v[1]) / ln) * t];
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const w = (1 - u) * (1 - u), m = 2 * u * (1 - u), e = u * u;
      out.push([w * a[0] + m * v[0] + e * c[0], w * a[1] + m * v[1] + e * c[1]]);
    }
  });
  out.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  return shape;
}

function lSlab(outline, inset, height, radius, mat, y0 = 0) {
  const bevel = Math.min(0.01, height * 0.4);
  const pts = insetPolygon(outline, inset + bevel).map(([x, z]) => [x, -z]);
  const mesh = new THREE.Mesh(extrudeUp(roundedPolygonShape(pts, radius), height, bevel), mat);
  mesh.position.y = y0;
  return mesh;
}

function layout(p) {
  const sectional = p.style === 'sectional';
  const cushionBottom = p.seatHeight - p.seatThickness;
  const zBack = sectional ? -p.returnLength / 2 : -p.depth / 2;
  const loose = p.backMode !== 'tight' && p.backCushionCount > 0;
  const a = rad(p.backCushionAngle);
  const frameFront = zBack + p.backFrameThickness;
  const backRadius = edgeRadius(p.backMode === 'pillow' ? p.cushionPuff * 1.5 : p.cushionPuff, 1, p.backCushionHeight, p.backCushionThickness);
  const tiltLoss = loose ? tiltDeficit(backRadius, a) : 0;
  const pivotZ = loose ? frameFront + p.backCushionHeight * Math.sin(a) - tiltLoss : frameFront;
  const frontZ = (Y) => {
    if (!loose) return frameFront;
    const yloc = Math.max(0, (Y - cushionBottom - p.backCushionThickness * Math.sin(a)) / Math.cos(a));
    return pivotZ - yloc * Math.sin(a) + p.backCushionThickness * Math.cos(a);
  };
  return {
    sectional,
    cushionBottom,
    bodyH: cushionBottom - p.legHeight,
    armTop: p.seatHeight + p.armRise,
    zBack,
    zFront: zBack + p.depth,
    ih: p.innerSpan / 2,
    loose,
    a,
    frameFront,
    pivotZ,
    tiltLoss,
    frontZ,
    seatStart: frontZ(p.seatHeight),
    sign: p.returnSide === 'left' ? -1 : 1,
  };
}

function buildArm(p, L, mats, sx, d, zc, zStart, zEnd) {
  const parts = [];
  const h = L.armTop - p.legHeight;
  const x = sx * (L.ih + p.armWidth / 2);
  if (p.armStyle === 'track') {
    parts.push(place(puffy(p.armWidth, h, d, p.bodyPuff * 1.5, mats.body, 2), x, p.legHeight + h / 2, zc, 'arm'));
  } else if (p.armStyle === 'roll') {
    const r = p.rollRadius;
    const postH = h - r;
    parts.push(place(puffy(p.armWidth, postH, d, p.bodyPuff * 1.5, mats.body, 2), x, p.legHeight + postH / 2, zc, 'arm'));
    const geo = roundedDiscGeometry(r, d, r * 0.4, 10);
    geo.rotateX(Math.PI / 2);
    parts.push(place(new THREE.Mesh(geo, mats.body), sx * (L.ih + Math.max(r, p.armWidth / 2)), L.armTop - r, zc, 'arm'));
  } else if (p.armStyle === 'slope') {
    const outline = [new THREE.Vector2(zStart, p.legHeight), new THREE.Vector2(zEnd, p.legHeight), new THREE.Vector2(zEnd, L.armTop), new THREE.Vector2(zStart, p.backTop)];
    const bevel = Math.min(p.bodyPuff, p.armWidth / 2 - 0.003);
    parts.push(place(new THREE.Mesh(extrudeProfile(outline, p.armWidth, bevel, 'side'), mats.body), x, 0, 0, 'arm'));
  }
  return parts;
}

function buildFeet(p, mats, anchors) {
  const parts = [];
  const h = p.legHeight + OVERLAP;
  for (const [x, z] of anchors) {
    const geo = roundedDiscGeometry(p.legThickness / 2, h, p.legThickness * 0.3, 8);
    parts.push(place(new THREE.Mesh(geo, mats.frame), x, h / 2, z));
  }
  return parts;
}

function buildSupport(p, L, mats, anchors, footprint, plinthOutline) {
  if (p.legStyle === 'plinth') {
    const h = p.legHeight + OVERLAP;
    if (plinthOutline) return [lSlab(plinthOutline, p.plinthInset, h, 0.02, mats.frame)];
    const w = footprint.width - 2 * p.plinthInset, d = footprint.depth - 2 * p.plinthInset;
    return [place(puffy(w, h, d, 0.01, mats.frame, 2), 0, h / 2, footprint.zc)];
  }
  if (p.legStyle === 'bun') return buildFeet(p, mats, anchors);
  if (p.legStyle === 'sled') {
    const legs = { legCount: 2, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: 0, puff: 0.006 };
    return [buildLegs(legs, mats, { width: footprint.width, depth: footprint.depth, top: p.legHeight })];
  }
  const legs = { legCount: anchors.length, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay };
  return [buildLegs(legs, mats, { width: footprint.width, depth: footprint.depth, top: p.legHeight, anchors })];
}

function legInsets(p) {
  const base = p.legThickness / 2 + p.bodyPuff + 0.01;
  const x = p.armStyle === 'none' ? base : Math.max(base * 0.8, p.armOuter - p.armWidth / 2);
  return { x, z: base };
}

function buildCushionRows(p, L, mats, parts, seatLo, seatHi, chaiseRange) {
  const segments = p.cushionSegments;
  const seatDepth = L.zFront - L.seatStart;
  for (const { center, size } of splitSpan(seatLo, seatHi, p.seatCushionCount, p.cushionGap)) {
    parts.push(upholster(place(puffy(size, p.seatThickness, seatDepth, p.cushionPuff, mats.surface, segments), center, L.cushionBottom + p.seatThickness / 2, L.zFront - seatDepth / 2, 'seatCushion')));
  }
  if (chaiseRange) {
    const [lo, hi] = chaiseRange;
    const zEnd = p.returnLength / 2;
    const d = zEnd - L.seatStart;
    parts.push(upholster(place(puffy(hi - lo, p.seatThickness, d, p.cushionPuff, mats.surface, segments), (lo + hi) / 2, L.cushionBottom + p.seatThickness / 2, zEnd - d / 2, 'seatCushion')));
  }
  if (L.loose) {
    for (const { center, size } of splitSpan(-L.ih, L.ih, p.backCushionCount, p.cushionGap)) {
      const pivot = new THREE.Group();
      pivot.position.set(center, L.cushionBottom - L.tiltLoss, L.pivotZ);
      pivot.rotation.x = -L.a;
      const puff = p.backMode === 'pillow' ? p.cushionPuff * 1.5 : p.cushionPuff;
      const back = upholster(puffy(size, p.backCushionHeight, p.backCushionThickness, puff, mats.surface, segments));
      back.position.set(0, p.backCushionHeight / 2, p.backCushionThickness / 2);
      pivot.add(back);
      parts.push(pivot);
    }
  }
}

function buildPillows(p, L, mats, parts, lo, hi) {
  if (p.pillowCount === 0) return;
  const size = p.pillowSize;
  const ap = rad(p.pillowAngle);
  const z0 = L.frontZ(p.seatHeight + (size / 2) * Math.cos(ap)) + (size / 2) * Math.sin(ap);
  const yaw = ((p.pillowAngle - 10) / 12 * 2 - 1) * rad(8);
  const reach = (size / 2) * Math.cos(yaw) + (p.pillowThickness / 2 + size / 4) * Math.abs(Math.sin(yaw));
  const margin = reach + 0.03 + p.bodyPuff * 1.5;
  const xs = p.pillowCount === 2 ? [lo + margin, hi - margin] : [p.pillowSide === 'left' ? lo + margin : hi - margin];
  xs.forEach((x, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.order = 'YXZ';
    pivot.position.set(x, p.seatHeight - tiltDeficit(edgeRadius(size * 0.25, size, size, p.pillowThickness), ap), z0);
    pivot.rotation.set(-ap, i % 2 === 0 ? yaw : -yaw, 0);
    const pillow = puffy(size, size, p.pillowThickness, size * 0.25, mats.accent, 2);
    pillow.position.set(0, size / 2, p.pillowThickness / 2);
    pivot.add(pillow);
    parts.push(pivot);
  });
}

function buildRun(p, mats) {
  const L = layout(p);
  const parts = [];
  const s = L.sign;
  const W = p.width;
  const frameH = p.backTop - p.legHeight;
  const tight = p.backMode === 'tight';
  const frame = place(puffy(p.innerSpan + OVERLAP, frameH, p.backFrameThickness, p.bodyPuff, tight ? mats.surface : mats.body, 2), 0, p.legHeight + frameH / 2, L.zBack + p.backFrameThickness / 2, 'back');
  parts.push(tight ? upholster(frame) : frame);

  let outline = null;
  if (L.sectional) {
    const ih = L.ih, rw = p.returnWidth, zRF = p.returnLength / 2;
    const raw = [[-ih, L.zBack], [ih, L.zBack], [ih, zRF], [ih - rw, zRF], [ih - rw, L.zFront], [-ih, L.zFront]];
    const bodyOutline = raw.map(([x, z]) => [x * s, z]);
    if (s < 0) bodyOutline.reverse();
    parts.push(lSlab(bodyOutline, 0, L.bodyH, p.bodyPuff, mats.body, p.legHeight));
    const xi = ih + p.armOuter - rw - p.armOuter;
    const full = [[-W / 2, L.zBack], [W / 2, L.zBack], [W / 2, zRF], [xi, zRF], [xi, L.zFront], [-W / 2, L.zFront]];
    outline = full.map(([x, z]) => [x * s, z]);
    if (s < 0) outline.reverse();
  } else {
    parts.push(place(puffy(p.innerSpan + OVERLAP, L.bodyH, p.depth, p.bodyPuff, mats.body, 2), 0, p.legHeight + L.bodyH / 2, 0));
  }

  if (p.armStyle !== 'none') {
    for (const sx of [-1, 1]) {
      const isReturn = L.sectional && sx === s;
      const d = isReturn ? p.returnLength : p.depth;
      const zStart = L.zBack, zEnd = L.zBack + d;
      parts.push(...buildArm(p, L, mats, sx, d, (zStart + zEnd) / 2, zStart, zEnd));
    }
  }

  const ih = L.ih;
  let seatLo = -ih, seatHi = ih, chaiseRange = null;
  if (L.sectional) {
    const split = s > 0 ? ih - p.returnWidth : -ih + p.returnWidth;
    if (s > 0) { seatHi = split - p.cushionGap / 2; chaiseRange = [split + p.cushionGap / 2, ih]; }
    else { seatLo = split + p.cushionGap / 2; chaiseRange = [-ih, split - p.cushionGap / 2]; }
  }
  buildCushionRows(p, L, mats, parts, seatLo, seatHi, chaiseRange);
  buildPillows(p, L, mats, parts, seatLo, seatHi);

  const ins = legInsets(p);
  const footprint = { width: W, depth: p.depth, zc: 0 };
  let anchors = [];
  if (L.sectional) {
    const i = ins.z;
    const ix = ins.x;
    const zRF = p.returnLength / 2;
    const xi = ih - p.returnWidth;
    const pts = [
      [-W / 2 + ix, L.zBack + i], [W / 2 - ix, L.zBack + i], [W / 2 - ix, zRF - i],
      [xi + i, zRF - i], [xi + i, L.zFront + i], [-W / 2 + ix, L.zFront - i],
    ].map(([x, z]) => [x * s, z]);
    if (W > 2.3) pts.push([0, L.zBack + i]);
    anchors = pts;
    footprint.depth = p.returnLength;
  } else if (p.legStyle !== 'plinth' && p.legStyle !== 'sled') {
    anchors = rowAnchors(W, p.depth, p.legCount / 2, ins.x, ins.z);
  }
  parts.push(...buildSupport(p, L, mats, anchors, footprint, outline));
  return parts;
}

function buildChaise(p, mats) {
  const L = layout(p);
  const parts = [];
  const sh = p.headSide === 'left' ? -1 : 1;
  const W = p.width;
  const bodyW = W;
  parts.push(place(puffy(bodyW, L.bodyH, p.depth, p.bodyPuff, mats.body, 2), 0, p.legHeight + L.bodyH / 2, 0));

  const rel = p.headHeight - 0.02;
  const r = p.headStyle === 'scroll' ? Math.min(0.09, Math.max(0.06, p.headLength * 0.3)) : 0.045;
  const slabTop = p.headHeight - r;
  const xo = sh * (W / 2), xb = sh * (W / 2 - p.headLength);
  const xt = sh * (W / 2 - p.headLength + (slabTop - p.legHeight) * Math.tan(rad(p.headIncline)));
  const bevel = Math.min(p.bodyPuff, 0.03);
  const outline = [new THREE.Vector2(xo, p.legHeight), new THREE.Vector2(xb, p.legHeight), new THREE.Vector2(xt, slabTop), new THREE.Vector2(xo, slabTop)];
  if (rel > 0) parts.push(place(new THREE.Mesh(extrudeProfile(outline, p.depth, bevel, 'front'), mats.body), 0, 0, 0, 'head'));
  if (r > 0) {
    const geo = roundedDiscGeometry(r, p.depth * 0.98, r * 0.4, 10);
    geo.rotateX(Math.PI / 2);
    parts.push(place(new THREE.Mesh(geo, mats.body), sh * (W / 2 - r), p.headHeight - r, 0, 'head'));
  }

  const hasBack = p.backFraction > 0;
  if (hasBack) {
    const len = p.backFraction * W;
    const h = p.backTop - p.legHeight;
    const back = place(puffy(len, h, p.backFrameThickness, p.bodyPuff, mats.surface, 2), sh * (W / 2 - 0.03 - len / 2), p.legHeight + h / 2, L.zBack + p.backFrameThickness / 2, 'back');
    parts.push(upholster(back));
  }

  const lo = sh > 0 ? -W / 2 : -W / 2 + p.headLength;
  const hi = sh > 0 ? W / 2 - p.headLength : W / 2;
  const zStart = L.zBack + (hasBack ? p.backFrameThickness : 0.01);
  const d = L.zFront - zStart;
  parts.push(upholster(place(puffy(hi - lo, p.seatThickness, d, p.cushionPuff, mats.surface, 3), (lo + hi) / 2, L.cushionBottom + p.seatThickness / 2, L.zFront - d / 2, 'seatCushion')));

  if (p.pillowCount > 0) {
    const size = p.pillowSize;
    const ap = rad(p.pillowAngle);
    const yaw = rad(20);
    const outer = new THREE.Group();
    outer.position.set(sh * (W / 2 - p.headLength) - sh * (0.004 + (size / 2) * Math.sin(yaw)), 0, 0);
    outer.rotation.y = sh * yaw;
    const pivot = new THREE.Group();
    pivot.position.set(0, p.seatHeight - tiltDeficit(edgeRadius(size * 0.25, p.pillowThickness, size, size), ap), 0);
    pivot.rotation.z = -sh * ap;
    const pillow = puffy(p.pillowThickness, size, size, size * 0.25, mats.accent, 2);
    pillow.position.set(-sh * p.pillowThickness / 2, size / 2, 0);
    pivot.add(pillow);
    outer.add(pivot);
    parts.push(outer);
  }

  const ins = legInsets({ ...p, armStyle: 'none' });
  const anchors = p.legStyle === 'plinth' || p.legStyle === 'sled' ? [] : rowAnchors(W, p.depth, 2, ins.x, ins.z);
  parts.push(...buildSupport(p, L, mats, anchors, { width: W, depth: p.depth, zc: 0 }, null));
  return parts;
}

export function buildSofa(p, mats) {
  return p.style === 'chaise' ? buildChaise(p, mats) : buildRun(p, mats);
}
