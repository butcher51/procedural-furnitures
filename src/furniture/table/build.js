import * as THREE from 'three';
import { grainAlong } from '../../core/patterns.js';
import { shade, swatch } from '../../core/palette.js';
import {
  extrudeUp, normalizeUVs, puffy, roundedDiscGeometry, superellipseShape,
} from '../../core/geometry.js';
import {
  buildApron, buildLegs, buildPedestal, buildStretchers, buildTrestle, legLines, pointOnLeg, turnedPost,
} from '../../core/supports.js';

function slabGeometry(shape, thickness, edge, length, depth, exponent, sides) {
  if (shape === 'round') return roundedDiscGeometry(length / 2, thickness, edge, sides);
  const bevel = Math.min(edge, thickness * 0.4);
  const outline = superellipseShape(length / 2 - bevel, depth / 2 - bevel, exponent);
  return normalizeUVs(extrudeUp(outline, thickness, bevel), length);
}

function buildTop(p, mats) {
  if (p.topShape === 'rect') {
    const slab = puffy(p.topLength, p.topThickness, p.topDepth, p.topEdge, mats.top);
    slab.position.y = p.topHeight - p.topThickness / 2;
    return grainAlong(slab, 'x');
  }
  const geo = slabGeometry(p.topShape, p.topThickness, p.topEdge, p.topLength, p.topDepth, p.topExponent, p.topSides);
  const mesh = new THREE.Mesh(geo, mats.top);
  mesh.position.y = p.topShape === 'round' ? p.topHeight - p.topThickness / 2 : p.legHeight;
  return grainAlong(mesh, 'x');
}

function buildShelf(p, mats, lines) {
  const pts = lines.map((line) => pointOnLeg(line, p.shelfHeight));
  const pad = (p.legThickness / 2) * p.legTaper;
  const maxX = Math.max(...pts.map((pt) => Math.abs(pt.x)));
  const maxZ = Math.max(...pts.map((pt) => Math.abs(pt.z)));
  const t = p.shelfThickness;
  let mesh;
  if (p.shelfShape === 'rect') {
    mesh = puffy((maxX + pad) * 2, t, (maxZ + pad) * 2, 0.004, mats.top);
    mesh.position.y = p.shelfHeight;
    return grainAlong(mesh, 'x');
  }
  let sx, sz, e;
  if (p.legCount === 3) {
    e = p.topExponent;
    sx = maxX / Math.cos(Math.PI / 6) ** (2 / e) + pad;
    sz = maxZ + pad;
  } else {
    e = p.topExponent;
    const k = Math.SQRT1_2 ** (2 / e);
    sx = maxX / k + pad;
    sz = maxZ / k + pad;
  }
  const bevel = Math.min(0.004, t * 0.3);
  const outline = superellipseShape(sx - bevel, sz - bevel, e);
  mesh = new THREE.Mesh(normalizeUVs(extrudeUp(outline, t, bevel), sx * 2), mats.top);
  mesh.position.y = p.shelfHeight - t / 2;
  return grainAlong(mesh, 'x');
}

function buildLegged(p, mats) {
  const parts = [];
  const legParams = { legCount: p.legCount, legThickness: p.legThickness, legSides: p.legSides, legTaper: p.legTaper, legSplay: p.legSplay };
  const fp = { width: p.topLength - 2 * p.overhang, depth: p.topDepth - 2 * p.overhang, top: p.legHeight, exponent: p.topExponent };
  const lines = legLines(legParams, fp);
  if (p.legProfile === 'turned') {
    const block = Math.min(Math.max(p.apronHeight, 0.07), p.legHeight * 0.4);
    const blocks = [[p.legHeight - block, p.legHeight]];
    for (const line of lines) {
      const post = turnedPost({ height: p.legHeight, thickness: p.legThickness, blocks }, mats.frame);
      post.position.set(line.top.x, 0, line.top.z);
      parts.push(post);
    }
  } else {
    parts.push(buildLegs(legParams, mats, fp));
  }
  if (p.hasApron) {
    const setback = Math.max(0, p.legThickness / 2 - p.apronThickness / 2);
    parts.push(buildApron(lines, { top: p.legHeight, height: p.apronHeight, thickness: p.apronThickness, setback }, mats.frame));
  }
  if (p.stretcher !== 'none') {
    parts.push(buildStretchers(lines, p.stretcher, p.stretcherHeight, {
      radius: p.stretcherThickness / 2, profile: p.legSides === 4 ? 'square' : 'round',
    }, mats.frame));
  }
  if (p.hasShelf) parts.push(buildShelf(p, mats, lines));
  return parts;
}

function buildPedestalBase(p, mats) {
  return [buildPedestal({
    top: p.legHeight,
    base: p.pedestalBase,
    baseRadius: p.baseSpan / 2,
    baseHeight: p.baseHeight,
    baseTaper: 0.6,
    columnRadius: p.columnRadius,
    columnSides: p.columnSides,
    cap: { radius: p.capRadius, height: 0.02 },
  }, mats.frame)];
}

function cleatLengthFor(p) {
  const full = 0.8 * p.topDepth;
  if (p.topShape === 'rect') return full;
  const hx = p.topLength / 2;
  const hz = p.topDepth / 2;
  const x = Math.min(hx - 0.01, hx - p.trestleInset + p.beamWidth / 2);
  const e = p.topExponent;
  const zMax = hz * Math.max(0, 1 - (x / hx) ** e) ** (1 / e);
  return Math.max(0.2, Math.min(full, 2 * (zMax - 0.05)));
}

function buildTrestleBase(p, mats) {
  return [buildTrestle({
    cleatLength: cleatLengthFor(p),
    length: p.topLength,
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
  }, mats.frame)];
}

const BASES = { legs: buildLegged, pedestal: buildPedestalBase, trestle: buildTrestleBase };

function stoneMaterial(p, m) {
  if (p.stonePattern === 'terrazzo') {
    return m.pattern({ kind: 'terrazzo', colors: [p.topColor], seed: p.seed }, { roughness: 0.4 });
  }
  const base = swatch(p.topColor);
  const dir = base.l > 0.5 ? -1 : 1;
  return m.pattern({
    kind: 'terrazzo',
    colors: [p.topColor, shade(base, 0.05 * dir).hex, shade(base, 0.08 * dir).hex],
    size: 0.006,
    density: 0.22,
    seed: p.seed,
  }, { roughness: 0.4 });
}

function topMaterial(p, m) {
  if (p.topFinish === 'wood') return m.wood(p.topColor, { grain: p.grain, seed: p.seed });
  if (p.topFinish === 'stone') return stoneMaterial(p, m);
  return m.solid(p.topColor, 0.8);
}

function frameMaterial(p, m) {
  if (p.baseMode === 'wood') return m.wood(p.baseColor, { grain: p.grain, seed: p.seed });
  return m.frame(p.baseColor, p.baseMode);
}

export function buildTable(p, kit) {
  const m = kit.materials;
  const mats = { top: topMaterial(p, m), frame: frameMaterial(p, m) };
  return [buildTop(p, mats), ...BASES[p.baseKind](p, mats)];
}
