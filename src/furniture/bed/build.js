import * as THREE from 'three';
import { beam, edgeRadius, extrudeProfile, extrudeUp, latheSolid, puffy, strut } from '../../core/geometry.js';
import { grainAlong } from '../../core/patterns.js';
import { drapeSheet, pillow } from '../../core/soft.js';
import { buildFramedPanel, buildLegs, turnedPost } from '../../core/supports.js';
import { BUNK_ACCESS, STILE_DEPTH, headDepthOf, headWidthOf, pillowContextOf } from './params.js';
import { planPillows } from './layout.js';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rad = (deg) => (deg * Math.PI) / 180;
const OVERLAP = 0.004;

function tag(object, name) {
  object.traverse((o) => {
    if (o.isMesh) o.name = name ?? '';
  });
  return object;
}

function bar(a, b, w, t, mat, radius = 0.004) {
  return beam(v3(...a), v3(...b), w, t, radius, mat);
}

function slab(mat, { x = 0, y0, y1, z0, z1, w, radius, segments }) {
  const mesh = puffy(w, y1 - y0, z1 - z0, radius, mat, segments);
  mesh.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
  return mesh;
}

export function archTopShape(width, height, rise, steps = 6) {
  const hw = width / 2;
  const shoulder = height - rise;
  const pts = [new THREE.Vector2(-hw, 0), new THREE.Vector2(hw, 0), new THREE.Vector2(hw, shoulder)];
  for (let i = 1; i < steps; i++) {
    const a = (i / steps) * Math.PI;
    pts.push(new THREE.Vector2(Math.cos(a) * hw, shoulder + Math.sin(a) * rise));
  }
  pts.push(new THREE.Vector2(-hw, shoulder));
  return new THREE.Shape(pts);
}

export function scallopShape(width, depth, count, bulge, steps = 3) {
  const hw = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(hw, 0);
  const pitch = width / count;
  const per = steps + 1;
  for (let i = count - 1; i >= 0; i--) {
    for (let k = per; k >= 0; k--) {
      if (i === count - 1 && k === per) {
        shape.lineTo(hw, -depth);
        continue;
      }
      const x = -hw + pitch * i + (pitch * k) / per;
      shape.lineTo(x, -(depth + bulge * Math.sin((Math.PI * k) / per)));
    }
  }
  shape.lineTo(-hw, 0);
  return shape;
}

export function buildLadder({ top, width, stileWidth, stileDepth, rungCount, rungTop, rungProfile, lean }, mat) {
  const group = new THREE.Group();
  const xAt = (y) => lean * (1 - y / top);
  for (const sz of [-1, 1]) group.add(bar([lean, 0, (sz * width) / 2], [0, top, (sz * width) / 2], stileWidth, stileDepth, mat, 0.004));
  const first = 0.22;
  for (let i = 0; i < rungCount; i++) {
    const y = rungCount === 1 ? first : first + ((rungTop - first) * i) / (rungCount - 1);
    const a = [xAt(y), y, -width / 2];
    const b = [xAt(y), y, width / 2];
    group.add(rungProfile === 'round' ? strut(v3(...a), v3(...b), 0.014, 0.014, 6, mat) : bar(a, b, 0.05, 0.022, mat, 0.004));
  }
  return tag(group, 'ladder');
}

function knob(radius, height, mat, y) {
  const mesh = new THREE.Mesh(latheSolid([[0.45 * radius, 0], [0.3 * radius, 0.15 * height], [0.65 * radius, 0.5 * height], [0.5 * radius, 0.8 * height], [0.1 * radius, height]], 8), mat);
  mesh.position.y = y;
  return grainAlong(mesh, 'y');
}

function dims(p) {
  const hd = headDepthOf(p, p.style);
  const zM0 = hd + p.clearance;
  return { hd, zM0, zM1: zM0 + p.mattressLength, zHF: hd };
}

function dropPosts(group) {
  const posts = group.children.slice(0, 2);
  for (const post of posts) post.geometry.dispose();
  group.remove(...posts);
}

function framedPanel(p, m, { z, postTop, rails, fill, round = false, name = null }) {
  const width = p.mattressWidth + 2 * p.clearance + 2 * p.postSize;
  const group = buildFramedPanel(
    { width, postWidth: p.postSize, postDepth: p.postSize, postBottom: 0, postTop, rails, fill, puff: 0.004 },
    { frame: m.frame, fill: m.frame }
  );
  if (round) {
    dropPosts(group);
  }
  group.position.z = z;
  return name ? tag(group, name) : group;
}

function roundPost(x, z, top, size, m) {
  return strut(v3(x, 0, z), v3(x, top, z), size / 2, (size / 2) * 0.8, 8, m.frame);
}

function platformFrame(p, m, d) {
  const parts = [];
  const W = p.mattressWidth;
  const slabW = W + 2 * p.ledge;
  const len = d.zM1 + p.ledge;
  const bottom = p.deckY - p.slabThickness;
  parts.push(grainAlong(slab(m.frame, { y0: bottom, y1: p.deckY, z0: 0, z1: len, w: slabW, radius: 0.012, segments: 3 }), 'z'));
  if (p.support === 'plinth') {
    const i = p.plinthInset;
    parts.push(grainAlong(slab(m.frame, { y0: 0, y1: p.plinthHeight + OVERLAP, z0: i, z1: len - i, w: slabW - 2 * i, radius: 0.01, segments: 2 }), 'x'));
  } else {
    const ax = slabW / 2 - p.legInset;
    const az = len / 2 - p.legInset;
    const anchors = [[-ax, -az], [ax, -az], [ax, az], [-ax, az]];
    if (p.legCount === 6) anchors.push([-ax, 0], [ax, 0]);
    const legs = { legCount: anchors.length, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: 0 };
    const group = buildLegs(legs, m, { width: slabW, depth: len, top: p.legHeight + OVERLAP, anchors });
    group.position.z = len / 2;
    parts.push(group);
  }
  if (p.headKind !== 'none') {
    const headW = headWidthOf(p, 'platform', p);
    const board = slab(m.frame, { y0: bottom, y1: p.headHeight, z0: 0, z1: d.hd, w: headW, radius: 0.015, segments: 3 });
    parts.push(tag(grainAlong(board, 'x'), 'headboard'));
    if (p.headKind === 'wide') {
      for (const sx of [-1, 1]) {
        const top = p.mattressTop + p.shelfLift;
        const shelf = slab(m.frame, {
          x: sx * (slabW / 2 + p.shelfWidth / 2), y0: top - p.shelfThickness, y1: top, z0: d.hd - OVERLAP, z1: d.hd + p.shelfDepth, w: p.shelfWidth, radius: 0.008, segments: 2,
        });
        parts.push(tag(grainAlong(shelf, 'x'), 'shelf'));
      }
    }
  }
  return parts;
}

function slattedFrame(p, m, d) {
  const parts = [];
  const W = p.mattressWidth;
  const ps = p.postSize;
  const round = p.postProfile === 'round';
  const px = W / 2 + p.clearance + ps / 2;
  const zh = ps / 2;
  const zf = d.zM1 + p.clearance + ps / 2;
  const railTop = p.deckY + p.railRise;
  const inner = 2 * px;
  const ht = p.headThickness;
  const lower = { y: railTop - p.railHeight / 2, height: p.railHeight, thickness: ht };

  const topRailOf = (top) => ({ y: top - 0.04, height: 0.07, thickness: ht });
  const headRails = [topRailOf(p.headHeight), lower];
  const slatTop = p.headHeight - 0.075;
  let headFill = { kind: 'none' };
  const extra = [];
  if (p.headKind === 'vertical') headFill = { kind: 'slats', count: p.headSlatCount, from: railTop, to: slatTop, thickness: ht, width: p.headSlatWidth };
  else if (p.headKind === 'horizontal') {
    const n = p.headSlatCount;
    const span = slatTop - railTop;
    const size = Math.min(p.headSlatWidth, (0.8 * span) / n);
    const gap = (span - n * size) / (n + 1);
    for (let i = 0; i < n; i++) extra.push(bar([-px, railTop + gap * (i + 1) + size * (i + 0.5), 0], [px, railTop + gap * (i + 1) + size * (i + 0.5), 0], ht, size, m.frame));
  } else {
    extra.push(slab(m.frame, { y0: railTop, y1: slatTop, z0: -ht / 2, z1: ht / 2, w: inner, radius: 0.008, segments: 2 }));
  }
  const head = framedPanel(p, m, { z: zh, postTop: p.headHeight, rails: headRails, fill: headFill, round, name: 'headboard' });
  for (const piece of extra) head.add(tag(piece, 'headboard'));
  parts.push(head);

  const footPostTop = p.footKind === 'none' ? railTop : p.footHeight;
  const footRails = [lower];
  let footFill = { kind: 'none' };
  const footExtra = [];
  if (p.footKind === 'lowSlats') {
    footRails.push({ y: p.footHeight - 0.03, height: 0.05, thickness: ht });
    const pitch = inner / p.footSlatCount;
    footFill = { kind: 'slats', count: p.footSlatCount, from: railTop, to: p.footHeight - 0.055, thickness: ht, width: Math.min(p.headKind === 'vertical' ? p.headSlatWidth : 0.04, 0.5 * pitch) };
  } else if (p.footKind === 'lowBoard') {
    footExtra.push(slab(m.frame, { y0: railTop, y1: p.footHeight, z0: -ht / 2, z1: ht / 2, w: inner, radius: 0.008, segments: 2 }));
  }
  const foot = framedPanel(p, m, { z: zf, postTop: footPostTop, rails: footRails, fill: footFill, round });
  for (const piece of footExtra) foot.add(piece);
  parts.push(foot);

  if (round) {
    for (const sx of [-1, 1]) {
      parts.push(tag(roundPost(sx * px, zh, p.headHeight, ps, m), 'headboard'));
      parts.push(roundPost(sx * px, zf, footPostTop, ps, m));
    }
  }
  const xr = W / 2 + p.clearance + p.railThickness / 2;
  for (const sx of [-1, 1]) parts.push(bar([sx * xr, lower.y, zh], [sx * xr, lower.y, zf], p.railThickness, p.railHeight, m.frame));
  parts.push(bar([0, p.deckY - 0.009, zh], [0, p.deckY - 0.009, zf], W + 2 * p.clearance + 0.008, 0.018, m.frame));
  return parts;
}

function archHead(width, height, rise, thickness, bevel, mat) {
  return new THREE.Mesh(extrudeProfile(archTopShape(width, height, rise), thickness, bevel, 'front'), mat);
}

function upholsteredFrame(p, m, d) {
  const parts = [];
  const W = p.mattressWidth;
  const rt = p.railThickness;
  const base = W + 2 * p.clearance + 2 * rt;
  const zEnd = d.zM1 + p.clearance + rt;
  const railTop = p.deckY + p.railRise;
  const ph = p.plinthHeight;
  const i = p.plinthInset;
  const headW = headWidthOf(p, 'upholstered', p);
  parts.push(slab(m.frame, { y0: 0, y1: ph + OVERLAP, z0: i, z1: zEnd - i, w: base - 2 * i, radius: 0.01, segments: 2 }));
  const xr = W / 2 + p.clearance + rt / 2;
  for (const sx of [-1, 1]) parts.push(slab(m.frame, { x: sx * xr, y0: ph, y1: railTop, z0: d.hd - OVERLAP, z1: zEnd, w: rt, radius: 0.014, segments: 2 }));
  parts.push(slab(m.frame, { y0: ph, y1: railTop, z0: zEnd - rt, z1: zEnd, w: base, radius: 0.014, segments: 2 }));
  parts.push(bar([0, p.deckY - 0.01, d.hd - OVERLAP], [0, p.deckY - 0.01, d.zM1 + p.clearance + OVERLAP], W + 2 * p.clearance + 0.008, 0.02, m.frame));

  const h = p.headHeight - ph;
  const ht = p.headThickness;
  const bevel = Math.min(0.02, ht / 3);
  let head;
  if (p.headKind === 'arch') {
    head = archHead(headW, h, p.archRise, ht, bevel, m.frame);
    head.position.set(0, ph, ht / 2);
  } else if (p.headKind === 'channel') {
    const b = 0.012;
    const shape = scallopShape(headW - 2 * b, ht - 2 * b, p.channelCount, p.channelBulge);
    head = new THREE.Mesh(extrudeUp(shape, h, b), m.frame);
    head.position.set(0, ph, b);
  } else {
    head = slab(m.frame, { y0: ph, y1: p.headHeight, z0: 0, z1: ht, w: headW, radius: Math.min(0.04, ht * 0.4), segments: 3 });
  }
  parts.push(tag(head, 'headboard'));
  if (p.headKind === 'wingback') {
    for (const sx of [-1, 1]) {
      const wing = slab(m.frame, {
        x: sx * (headW / 2 - p.wingThickness / 2), y0: ph, y1: p.headHeight - 0.12, z0: ht - 0.01, z1: ht + p.wingDepth, w: p.wingThickness, radius: Math.min(0.03, p.wingThickness * 0.35), segments: 2,
      });
      parts.push(tag(wing, 'wing'));
    }
  }
  return parts;
}

function fourPosterFrame(p, m, d) {
  const parts = [];
  const W = p.mattressWidth;
  const ps = p.postSize;
  const px = W / 2 + p.clearance + ps / 2;
  const zh = ps / 2;
  const zf = d.zM1 + p.clearance + ps / 2;
  const railTop = p.deckY + p.railRise;
  const railBottom = railTop - p.railHeight;
  const H = p.postHeight;
  const post = (x, z, name) => {
    let part;
    if (p.postProfile === 'turned') {
      part = turnedPost({ height: H, thickness: ps, blocks: [[railBottom, railTop], [H - 0.12, H]], finial: p.finial, profiles: ['simple', 'simple'] }, m.frame);
      part.position.set(x, 0, z);
    } else {
      const thin = p.postProfile === 'thin';
      const body = p.postProfile === 'square' ? bar([x, 0, z], [x, H, z], ps, ps, m.frame, 0.006) : strut(v3(x, 0, z), v3(x, H, z), ps / 2, (ps / 2) * (thin ? 1 : 0.6), thin ? 6 : 4, m.frame);
      part = body;
      if (p.finial > 0) {
        part = new THREE.Group();
        const top = knob(Math.max(ps / 2, 0.02), p.finial, m.frame, H);
        top.position.set(x, H, z);
        part.add(body, top);
      }
    }
    return name ? tag(part, name) : part;
  };
  for (const sx of [-1, 1]) {
    parts.push(post(sx * px, zh, 'headboard'));
    parts.push(post(sx * px, zf, null));
  }
  const xr = W / 2 + p.clearance + p.railThickness / 2;
  const yc = railTop - p.railHeight / 2;
  for (const sx of [-1, 1]) parts.push(bar([sx * xr, yc, zh], [sx * xr, yc, zf], p.railThickness, p.railHeight, m.frame));
  parts.push(bar([0, p.deckY - 0.009, zh], [0, p.deckY - 0.009, zf], W + 2 * p.clearance + 0.008, 0.018, m.frame));
  const ht = p.headThickness;
  const span = 2 * px;
  const hh = p.headHeight - railBottom;
  let head;
  if (p.headKind === 'arch') {
    head = archHead(span, hh, p.archRise, ht, Math.min(0.012, ht / 3), m.frame);
    head.position.set(0, railBottom, zh);
  } else if (p.headKind === 'slats') {
    head = buildFramedPanel(
      {
        width: span + ps, postWidth: ps, postDepth: ps, postBottom: 0, postTop: 0.01,
        rails: [{ y: p.headHeight - 0.04, height: 0.07, thickness: ht }, { y: railTop - p.railHeight / 2, height: p.railHeight, thickness: ht }],
        fill: { kind: 'slats', count: p.headSlatCount, from: railTop, to: p.headHeight - 0.075, thickness: ht, width: p.headSlatWidth },
        puff: 0.004,
      },
      { frame: m.frame, fill: m.frame }
    );
    dropPosts(head);
    head.position.z = zh;
  } else {
    head = slab(m.frame, { y0: railBottom, y1: p.headHeight, z0: zh - ht / 2, z1: zh + ht / 2, w: span, radius: 0.012, segments: 3 });
  }
  parts.push(tag(head, 'headboard'));
  const rt = p.railThickness;
  const zr = d.zM1 + p.clearance + rt / 2;
  if (p.footKind === 'panel') {
    parts.push(slab(m.frame, { y0: railBottom, y1: p.footHeight, z0: zr - rt / 2, z1: zr + rt / 2, w: span, radius: 0.01, segments: 2 }));
  } else {
    parts.push(bar([-px, yc, zr], [px, yc, zr], rt, p.railHeight, m.frame));
  }
  if (p.canopy) {
    const cw = Math.min(ps * 0.9, 0.045);
    const y = H - p.canopyRailHeight / 2;
    for (const z of [zh, zf]) parts.push(bar([-px, y, z], [px, y, z], cw, p.canopyRailHeight, m.frame));
    for (const sx of [-1, 1]) parts.push(bar([sx * px, y, zh], [sx * px, y, zf], cw, p.canopyRailHeight, m.frame));
  }
  return parts;
}

function bunkFrame(p, m, d) {
  const parts = [];
  const W = p.mattressWidth;
  const ps = p.postSize;
  const rt = p.railThickness;
  const rh = p.railHeight;
  const cx = W / 2 + p.clearance + ps / 2;
  const xr = W / 2 + p.clearance + rt / 2;
  const zh = ps / 2;
  const zf = d.zM1 + p.clearance + ps / 2;
  const lowerTop = p.deckY + p.railRise;
  const upperTop = p.upperRailBottom + rh;
  const endLadder = p.ladderKind === 'end';
  for (const sx of [-1, 1]) {
    parts.push(tag(bar([sx * cx, 0, zh], [sx * cx, p.postHeight, zh], ps, ps, m.frame, 0.006), 'headboard'));
    parts.push(bar([sx * cx, 0, zf], [sx * cx, p.postHeight, zf], ps, ps, m.frame, 0.006));
  }
  const levels = [{ top: lowerTop, deck: p.deckY }, { top: upperTop, deck: p.upperDeckY }];
  levels.forEach((level, k) => {
    const yc = level.top - rh / 2;
    for (const sx of [-1, 1]) parts.push(bar([sx * xr, yc, zh], [sx * xr, yc, zf], rt, rh, m.frame));
    parts.push(tag(bar([-cx, yc, zh], [cx, yc, zh], rt, rh, m.frame), 'headboard'));
    if (!(endLadder && k === 0)) parts.push(bar([-cx, yc, zf], [cx, yc, zf], rt, rh, m.frame));
    parts.push(bar([0, level.deck - 0.01, zh], [0, level.deck - 0.01, zf], W + 2 * p.clearance + 0.008, 0.02, m.frame));
  });

  const guardTop = p.guardTop;
  const fill = (z, x0, x1, bottom, top, kind, name, count = null) => {
    const span = x1 - x0;
    const mid = (x0 + x1) / 2;
    const pieces = [];
    if (kind === 'panel') pieces.push(slab(m.frame, { x: mid, y0: bottom, y1: top, z0: z - 0.0125, z1: z + 0.0125, w: span, radius: 0.008, segments: 2 }));
    else if (kind === 'slats') {
      const n = count ?? Math.max(1, Math.round(span / 0.1));
      const pitch = span / n;
      for (let i = 0; i < n; i++) {
        const x = x0 + pitch * (i + 0.5);
        pieces.push(bar([x, bottom, z], [x, top, z], 0.03, 0.02, m.frame));
      }
      pieces.push(bar([x0, top - 0.02, z], [x1, top - 0.02, z], 0.025, 0.04, m.frame));
    } else {
      pieces.push(bar([x0, top - 0.02, z], [x1, top - 0.02, z], 0.025, 0.04, m.frame));
      if (p.guardBars === 2) {
        const y = (bottom + top - 0.04) / 2;
        pieces.push(bar([x0, y, z], [x1, y, z], 0.025, 0.04, m.frame));
      }
    }
    for (const piece of pieces) parts.push(tag(piece, name));
  };
  const lowerFillTop = p.mattressTop + 0.12;
  const lowerFill = (z, name) => {
    if (p.endFill === 'rails') return;
    fill(z, -cx, cx, lowerTop, lowerFillTop, p.endFill, name);
  };
  fill(zh, -cx, cx, upperTop, guardTop, p.endFill, 'headboard');
  lowerFill(zh, 'headboard');

  const open = p.ladderKind === 'side' ? p.ladderWidth + 0.04 : BUNK_ACCESS;
  const zInner = zf - ps / 2;
  if (endLadder) {
    const o = open / 2;
    const gp = (x) => parts.push(tag(bar([x, upperTop, zf], [x, guardTop, zf], 0.035, 0.035, m.frame), 'guard'));
    for (const sx of [-1, 1]) {
      fill(zf, sx > 0 ? o : -cx, sx > 0 ? cx : -o, upperTop, guardTop, p.endFill, 'guard');
      gp(sx * o);
    }
    const top = upperTop - 0.03;
    for (let i = 0; i < p.rungCount; i++) {
      const y = p.rungCount === 1 ? 0.22 : 0.22 + ((top - 0.22) * i) / (p.rungCount - 1);
      const rung = p.rungProfile === 'round' ? strut(v3(-cx, y, zf), v3(cx, y, zf), 0.014, 0.014, 6, m.frame) : bar([-cx, y, zf], [cx, y, zf], 0.05, 0.022, m.frame);
      parts.push(tag(rung, 'ladder'));
    }
  } else {
    fill(zf, -cx, cx, upperTop, guardTop, p.endFill, 'guard');
    lowerFill(zf, null);
  }

  const ladderSign = p.ladderSide === 'left' ? -1 : 1;
  for (const sx of [-1, 1]) {
    const withOpening = !endLadder && sx === ladderSign;
    const zB = withOpening ? zInner - open : zf;
    const yTop = guardTop - 0.02;
    parts.push(tag(bar([sx * xr, yTop, zh], [sx * xr, yTop, zB], 0.03, 0.04, m.frame), 'guard'));
    if (p.guardBars === 2) {
      const y = (upperTop + guardTop - 0.04) / 2;
      parts.push(tag(bar([sx * xr, y, zh], [sx * xr, y, zB], 0.03, 0.04, m.frame), 'guard'));
    }
    if (withOpening) parts.push(tag(bar([sx * xr, upperTop, zB], [sx * xr, guardTop, zB], 0.035, 0.035, m.frame), 'guard'));
  }
  if (!endLadder) {
    const zc = zInner - open / 2;
    const xo = ladderSign * (W / 2 + p.clearance + rt + STILE_DEPTH / 2 - 0.004);
    const ladder = buildLadder(
      { top: upperTop + 0.1, width: p.ladderWidth, stileWidth: 0.035, stileDepth: STILE_DEPTH, rungCount: p.rungCount, rungTop: upperTop - 0.03, rungProfile: p.rungProfile, lean: p.ladderLean },
      m.frame
    );
    ladder.position.set(xo, 0, zc);
    if (ladderSign < 0) ladder.rotation.y = Math.PI;
    parts.push(ladder);
  }
  return parts;
}

function softGoods(p, m, d, { top, deckY, seedShift, throwKind }) {
  const parts = [];
  const W = p.mattressWidth;
  const L = p.mattressLength;
  const { zM0, zM1, zHF } = d;
  const radius = edgeRadius(p.mattressRadius, W, p.mattressThickness, L);
  const mattress = puffy(W, p.mattressThickness, L, p.mattressRadius, m.bedding, p.mattressSegments);
  mattress.position.set(0, deckY + p.mattressThickness / 2, zM0 + L / 2);
  mattress.name = 'mattress';
  parts.push(mattress);

  const plan = planPillows({ ...pillowContextOf(p), top });
  for (const item of plan.items) {
    const mat = item.role === 'deco' || (item.role === 'euro' && p.euroRole === 'accent') ? m.accent : m.bedding;
    const mesh = pillow(item.w, item.h, item.t, mat, { pinch: item.pinch, waist: item.waist, grid: item.grid });
    mesh.rotation.x = item.rotX;
    mesh.position.set(item.x, item.y, zHF + item.z);
    mesh.name = 'pillow';
    mesh.userData.onHead = item.onHead;
    parts.push(mesh);
  }

  const tuckSide = p.duvetFit === 'tuck';
  const tuckFoot = p.footFit === 'tuck';
  const side = tuckSide ? { mode: 'tuck', drop: 0 } : { mode: 'drape', drop: p.sideDrop };
  const foot = tuckFoot ? { mode: 'tuck', drop: 0 } : { mode: 'drape', drop: p.footDrop };
  const zStart = Math.max(zHF + plan.zoneEnd + p.foldRoll + 0.01, zM0 + Math.max(p.wingDepth, p.style === 'upholstered' || p.style === 'platform' ? 0 : p.postSize) + 0.03);
  const base = {
    top, width: W, x0: 0, zStart, zEnd: zM1, radius, thickness: p.duvetThickness, side, foot, res: p.duvetRes,
    crown: p.duvetCrown, flare: p.hemFlare, cornerSag: p.cornerSag, wrinkle: p.wrinkle, seed: p.wrinkleSeed + seedShift,
  };
  const sheet = drapeSheet({ ...base, fold: p.foldDepth > 0 ? { depth: p.foldDepth, roll: p.foldRoll, hemLift: 0.015 } : null });
  parts.push(Object.assign(new THREE.Mesh(sheet.main, m.duvet), { name: 'duvet' }));
  if (sheet.fold) parts.push(Object.assign(new THREE.Mesh(sheet.fold, p.foldMaterial === 'sheet' ? m.bedding : m.duvet), { name: 'duvet' }));

  if (throwKind === 'runner') {
    const foldEnd = p.foldDepth > 0 ? zStart + p.foldDepth + p.foldRoll + 0.03 : -Infinity;
    const runner = drapeSheet({
      over: base,
      zStart: Math.max(zM1 - p.throwDepth, foldEnd),
      thickness: p.throwThickness,
      extraDrop: p.throwExtraDrop,
      wrinkle: p.wrinkle,
      seed: p.wrinkleSeed + 3 + seedShift,
      limit: { x: W / 2 + p.clearance - 0.001, z: zM1 + p.clearance - 0.001 },
    });
    parts.push(Object.assign(new THREE.Mesh(runner.main, m.accent), { name: 'throw' }));
  }
  if (throwKind === 'folded') {
    const th = pillow(p.throwWidth, p.throwFoldDepth, p.throwFoldThickness, m.accent, { pinch: 0.5, waist: 0.02, flatBottom: true, grid: 5 });
    th.rotation.set(-Math.PI / 2, 0, rad(p.throwYaw));
    th.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(th, true);
    const reach = Math.min(W / 4, Math.max(0, W / 2 - p.throwWidth / 2 - 0.03));
    const x = (p.throwSide === 'left' ? -1 : 1) * reach;
    const uTop = W / 2 - radius;
    const a = Math.max(0, (Math.abs(x) - p.throwWidth * 0.55) / uTop);
    const crown = p.duvetCrown * (1 - a * a);
    th.position.set(x, top + p.duvetThickness + crown - box.min.y, zM1 - 0.35);
    th.name = 'throw';
    parts.push(th);
  }
  return parts;
}

const FRAMES = { platform: platformFrame, slatted: slattedFrame, upholstered: upholsteredFrame, fourPoster: fourPosterFrame, bunk: bunkFrame };

export function buildBed(p, m) {
  const d = dims(p);
  const parts = FRAMES[p.style](p, m, d);
  parts.push(...softGoods(p, m, d, { top: p.mattressTop, deckY: p.deckY, seedShift: 0, throwKind: p.throwKind }));
  if (p.style === 'bunk') {
    parts.push(...softGoods(p, m, d, { top: p.upperMattressTop, deckY: p.upperDeckY, seedShift: 1, throwKind: 'none' }));
  }
  const box = new THREE.Box3();
  for (const part of parts) box.expandByObject(part, true);
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  for (const part of parts) {
    part.position.x -= cx;
    part.position.z -= cz;
  }
  return parts;
}
