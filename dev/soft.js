import * as THREE from 'three';
import { createKit } from '../src/core/kit.js';
import { beam, puffy } from '../src/core/geometry.js';
import { groupParts, mergeByMaterial } from '../src/core/merge.js';
import { muted, PAINTS, shade, swatch } from '../src/core/palette.js';
import { FRAME_COLORS, WOODS } from '../src/core/color.js';
import { canvasPatternTexture } from '../src/core/materials.js';
import { createRng } from '../src/core/rng.js';
import { drapeSheet, pillow } from '../src/core/soft.js';
import { buildDecor, layoutShelfContents } from '../src/core/fill.js';

const query = new URLSearchParams(location.search);
const kit = createKit({ textureFactory: canvasPatternTexture });
const paint = (name) => {
  const p = PAINTS.find((x) => x.name === name);
  return muted(p.h, p.s, p.l);
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const WIDTHS = [0.9, 1.4, 1.6, 1.8];
const SPACING = 2.6;
const xOf = (i) => (i - 1.5) * SPACING;

const LOOKS = [
  { duvet: { kind: 'linen', colors: [paint('cream')] }, bedding: paint('putty'), accent: { kind: 'linen', colors: [paint('terracotta')], texture: 'boucle' } },
  { duvet: { kind: 'ticking', colors: [paint('cream'), paint('navy')], spacing: 0.06, width: 0.1 }, bedding: '#f1eee8', accent: { kind: 'linen', colors: [paint('ochre')] } },
  { duvet: { kind: 'linen', colors: [paint('sage')] }, bedding: '#f1eee8', accent: { kind: 'gingham', colors: [paint('cream'), paint('dusty rose')], spacing: 0.04 } },
  { duvet: { kind: 'dots', colors: [paint('slate blue'), paint('cream')], spacing: 0.08, size: 0.12 }, bedding: paint('putty'), accent: { kind: 'herringbone', colors: [paint('charcoal')] } },
];

function bed(i, { side, foot, res = 'full', fold = true, throwKind = 'none', lean = false }) {
  const W = WIDTHS[i];
  const x = xOf(i);
  const look = LOOKS[i];
  const frame = kit.materials.wood(WOODS[i + 1], { seed: i });
  const bedding = kit.materials.pattern({ kind: 'linen', colors: [look.bedding] });
  const duvetMat = kit.materials.pattern({ ...look.duvet, seed: i });
  const accent = kit.materials.pattern({ ...look.accent, seed: i });
  const thick = 0.22, top = 0.52, L = 2.0, r = 0.035, zM0 = -1.0, t = 0.06;
  const parts = [];
  const plinth = puffy(W - 0.3, top - thick, L - 0.3, 0.01, frame, 2);
  plinth.position.set(x, (top - thick) / 2, zM0 + L / 2);
  const head = puffy(W + 0.12, 1.0, 0.06, 0.02, frame, 3);
  head.position.set(x, 0.5, zM0 - 0.04);
  const mattress = puffy(W, thick, L, r, bedding, 3);
  mattress.position.set(x, top - thick / 2, zM0 + L / 2);
  parts.push(plinth, head, mattress);
  const n = W >= 1.4 ? 2 : 1;
  const pw = Math.min(0.68, (W - 0.04 - (n - 1) * 0.01) / n);
  let zoneEnd = zM0;
  for (let k = 0; k < n; k++) {
    const p = pillow(pw, 0.5, 0.14, bedding, { pinch: 0.45, grid: 6 });
    p.rotation.x = lean ? -THREE.MathUtils.degToRad(68) : -Math.PI / 2;
    p.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(p);
    const cx = x - W / 2 + 0.02 + pw / 2 + k * (pw + 0.01);
    p.position.set(cx, top - box.min.y, zM0 + 0.02 - box.min.z);
    p.updateMatrixWorld(true);
    zoneEnd = Math.max(zoneEnd, new THREE.Box3().setFromObject(p).max.z);
    parts.push(p);
  }
  if (lean) {
    const deco = pillow(0.42, 0.42, 0.13, accent, { pinch: 0.5, waist: 0.04 });
    deco.rotation.x = -THREE.MathUtils.degToRad(35);
    deco.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(deco);
    deco.position.set(x, top - box.min.y, zoneEnd - 0.06 - box.min.z);
    parts.push(deco);
    zoneEnd += 0.08;
  }
  const roll = 0.07;
  const zStart = zoneEnd + (fold ? roll : 0) + 0.01;
  const opts = {
    top, width: W, x0: x, zStart, zEnd: zM0 + L, radius: r, thickness: t, side, foot, res,
    crown: 0.025, flare: 0.02, cornerSag: 0.03, wrinkle: 0.004, seed: 11 + i,
    fold: fold ? { depth: 0.28, roll } : null,
  };
  const sheet = drapeSheet(opts);
  parts.push(new THREE.Mesh(sheet.main, duvetMat));
  if (sheet.fold) parts.push(new THREE.Mesh(sheet.fold, i % 2 ? bedding : duvetMat));
  if (throwKind === 'runner') {
    const runner = drapeSheet({
      ...opts, zStart: zM0 + L - 0.5, thickness: 0.016, lift: t + 0.002, fold: null, seed: 3,
      crownRegion: { zFrom: zStart, zTo: zM0 + L - r }, flareDrop: side.drop,
      side: side.mode === 'tuck' ? side : { mode: 'drape', drop: side.drop + 0.03 },
      foot: foot.mode === 'tuck' ? foot : { mode: 'drape', drop: foot.drop + 0.03 },
    });
    parts.push(new THREE.Mesh(runner.main, accent));
  }
  if (throwKind === 'folded') {
    const th = pillow(0.55, 0.36, 0.06, accent, { pinch: 0.15, waist: 0.01, flatBottom: true, grid: 4 });
    th.rotation.set(-Math.PI / 2, 0, THREE.MathUtils.degToRad(8));
    th.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(th);
    th.position.set(x + W / 4, top + t + 0.025 - box.min.y, zM0 + L - 0.35);
    parts.push(th);
  }
  return parts;
}

const COVERS = {
  classic: ['oxblood', 'navy', 'forest', 'ochre', 'charcoal'].map(paint),
  mixed: ['sage', 'terracotta', 'slate blue', 'cream', 'plum'].map(paint),
  tonal: [-0.15, -0.05, 0.05, 0.12, 0.2].map((dl) => shade(swatch(paint('slate blue')), dl).hex),
};
const PAGES = muted(0.11, 0.22, 0.86);

function bookcase(x, { mood, covers, width = 0.9, height = 1.8, depth = 0.3, shelves = 5, seed = 1, cols = 1, bins = false, wood = 'oak' }) {
  const frame = kit.materials.wood(WOODS.find((w) => w.name === wood), { seed });
  const decor = kit.materials.vertexColor();
  const t = 0.02, side = 0.02, back = 0.008;
  const parts = [];
  for (const sx of [-1, 1]) parts.push(beam(V(x + sx * (width / 2 - side / 2), 0, 0), V(x + sx * (width / 2 - side / 2), height, 0), side, depth, 0.003, frame));
  parts.push(beam(V(x - width / 2 + side, 0, -depth / 2 + back / 2), V(x - width / 2 + side, height, -depth / 2 + back / 2), back, 0.001, 0.001, frame));
  const backPanel = puffy(width - 2 * side + 0.002, height - 0.002, back, 0.002, frame, 2);
  backPanel.position.set(x, height / 2, -depth / 2 + back / 2);
  parts.push(backPanel);
  const inner = width - 2 * side;
  const ys = Array.from({ length: shelves + 1 }, (_, i) => 0.06 + ((height - 0.06 - t) * i) / shelves);
  ys.forEach((y) => parts.push(beam(V(x - inner / 2 - 0.001, y + t / 2, back / 2), V(x + inner / 2 + 0.001, y + t / 2, back / 2), depth - back, t, 0.003, frame)));
  parts.push(beam(V(x - inner / 2, 0, depth / 2 - 0.03), V(x + inner / 2, 0.06, depth / 2 - 0.03), inner, 0.02, 0.003, frame));
  const colW = (inner - (cols - 1) * t) / cols;
  for (let c = 1; c < cols; c++) {
    const cx = x - inner / 2 + c * (colW + t) - t / 2;
    parts.push(beam(V(cx, 0.06 + t, back / 2), V(cx, ys[shelves], back / 2), t, depth - back, 0.003, frame));
  }
  const surfaces = [];
  for (let i = 0; i < shelves; i++) {
    for (let c = 0; c < cols; c++) {
      const x0 = x - inner / 2 + c * (colW + t);
      surfaces.push({ id: `${i}-${c}`, x0, x1: x0 + colW, y: ys[i] + t, clear: ys[i + 1] - ys[i] - t, zBack: -depth / 2 + back, zFront: depth / 2, back: true });
    }
  }
  const layout = layoutShelfContents(createRng(String(seed)), surfaces, { mood, inset: 0.012, allowBins: bins, objectKinds: ['vase', 'bowl', 'orb', 'box', 'frame'], budget: 4300 });
  const colours = { covers, pages: PAGES, objects: [paint('cream'), paint('terracotta')] };
  surfaces.forEach((s, i) => layout[i].length && parts.push(buildDecor(layout[i], s, colours, decor)));
  return parts;
}

function deskTop(x) {
  const top = kit.materials.wood(WOODS[1], { seed: 3 });
  const decor = kit.materials.vertexColor();
  const slab = puffy(1.2, 0.03, 0.6, 0.008, top, 3);
  slab.position.set(x, 0.745, 0);
  const legs = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => beam(V(x + sx * 0.55, 0, sz * 0.25), V(x + sx * 0.55, 0.73, sz * 0.25), 0.04, 0.04, 0.004, top)));
  const zone = (x0, x1, zBack, zFront) => ({ id: 'z', x0: x + x0, x1: x + x1, y: 0.76, clear: 0.3, zBack, zFront, back: false });
  const colours = { covers: [paint('navy'), paint('ochre')], pages: PAGES, objects: [FRAME_COLORS.metal, paint('terracotta')] };
  const laptop = zone(-0.2, 0.2, -0.05, 0.25);
  const books = zone(-0.57, -0.25, -0.27, -0.02);
  const cup = zone(0.4, 0.57, -0.27, -0.1);
  return [
    slab, ...legs,
    buildDecor([{ k: 'slab', x: 0.03, w: 0.33, h: 0.018, d: 0.23, c: 0, yaw: 6 }], laptop, colours, decor),
    buildDecor([{ k: 's', x: 0.02, books: [{ w: 0.04, h: 0.24, d: 0.17, c: 0, yaw: -3 }, { w: 0.03, h: 0.21, d: 0.15, c: 1, yaw: 4 }, { w: 0.025, h: 0.18, d: 0.13, c: 0, yaw: -6 }] }], books, colours, decor),
    buildDecor([{ k: 'cup', x: 0.04, size: 0.07, h: 0.1, c: 1 }], cup, colours, decor),
  ];
}

const drape = (d) => ({ mode: 'drape', drop: d });
const tuck = { mode: 'tuck' };

const ROWS = [
  { label: 'drape', note: '0.9 / 1.4 / 1.6 / 1.8, fold, side + foot drape 0.30', parts: () => WIDTHS.flatMap((_, i) => bed(i, { side: drape(0.3), foot: drape(0.3), lean: i === 3 })) },
  { label: 'tuck', note: 'tuck both (0.9, 1.4); side drape + foot tuck taper (1.6, 1.8)', parts: () => WIDTHS.flatMap((_, i) => bed(i, i < 2 ? { side: tuck, foot: tuck, res: i === 0 ? 'low' : 'full' } : { side: drape(0.24), foot: tuck })) },
  { label: 'throws', note: 'runner over drape (0.9, 1.6), folded throw (1.4, 1.8), no fold on 1.6', parts: () => WIDTHS.flatMap((_, i) => bed(i, { side: drape(0.18 + i * 0.05), foot: drape(0.18 + i * 0.05), fold: i !== 2, throwKind: i % 2 ? 'folded' : 'runner', lean: i === 1 })) },
  {
    label: 'details',
    note: 'drape corner, roll end, pillows (pinch 0.2 / 0.45 / 0.7, flat bottom, grid 4)',
    parts: () => [
      ...bed(2, { side: drape(0.3), foot: drape(0.3) }),
      ...[[0.2, false, 6], [0.45, false, 6], [0.7, false, 6], [0.15, true, 6], [0.45, false, 4]].map(([pinch, flatBottom, grid], k) => {
        const p = pillow(0.6, 0.45, 0.14, kit.materials.pattern({ kind: 'linen', colors: [paint(['cream', 'putty', 'sage', 'terracotta', 'slate blue'][k])] }), { pinch, flatBottom, grid });
        p.position.set(xOf(0) - 1 + k * 0.7, 0.225, 0.4);
        return p;
      }),
    ],
    tiles: [
      { width: 560, distance: 3.2, dir: [0, 0.35, 1], focus: [xOf(0) + 0.4, 0.25, 0.4] },
      { width: 440, distance: 1.6, dir: [1, 0.15, 0.9], focus: [xOf(2) + 0.8, 0.35, 1.0] },
      { width: 440, distance: 1.5, dir: [-1, 0.5, -0.4], focus: [xOf(2) - 0.8, 0.55, -0.35] },
      { width: 160, distance: 45, dir: [1.25, 1.2, 1.7], focus: [0, 0.35, 0] },
    ],
  },
  {
    label: 'decor',
    note: 'library (classic), styled (mixed, 2 bays), sparse (tonal), cube bins; desk props',
    parts: () => [
      ...bookcase(xOf(0) - 0.4, { mood: 'library', covers: COVERS.classic, seed: 4 }),
      ...bookcase(xOf(1) - 0.6, { mood: 'styled', covers: COVERS.mixed, width: 1.2, cols: 2, seed: 8, wood: 'walnut' }),
      ...bookcase(xOf(2) - 0.7, { mood: 'sparse', covers: COVERS.tonal, seed: 5, wood: 'birch' }),
      ...bookcase(xOf(2) + 0.6, { mood: 'styled', covers: COVERS.classic, width: 1.1, height: 1.1, depth: 0.36, shelves: 3, cols: 3, bins: true, seed: 2, wood: 'honey' }),
      ...deskTop(xOf(3) + 0.3),
    ],
    tiles: [
      { width: 560, distance: 13, dir: [0.15, 0.3, 1], focus: [0, 0.8, 0] },
      { width: 440, distance: 2.6, dir: [0.25, 0.15, 1], focus: [xOf(1) - 0.6, 1.0, 0] },
      { width: 440, distance: 2.2, dir: [0.5, 0.7, 1], focus: [xOf(3) + 0.3, 0.75, 0] },
      { width: 160, distance: 45, dir: [1.25, 1.2, 1.7], focus: [0, 0.35, 0] },
    ],
  },
];

const ROW_H = 360;
const TILES = [
  { label: 'row 3/4 (foot side)', width: 560, distance: 12, dir: [0.25, 0.55, 1], focus: [0, 0.35, 0] },
  { label: 'close-up 1.8 corner', width: 440, distance: 3.4, dir: [0.9, 0.45, 1], focus: [xOf(3) + 0.3, 0.4, 0.4] },
  { label: 'close-up 0.9 side', width: 440, distance: 3.0, dir: [-1, 0.35, 0.5], focus: [xOf(0), 0.45, 0] },
  { label: 'grid (45 m)', width: 160, distance: 45, dir: [1.25, 1.2, 1.7], focus: [0, 0.35, 0] },
];

function lights(scene) {
  scene.background = new THREE.Color('#f5f3ef');
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d2c5', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.02;
  sun.position.set(0.5, 1, 0.75).multiplyScalar(12);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, far: 40 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

export function board(rows, tiles) {
  const host = document.getElementById('board');
  const width = tiles.reduce((s, t) => s + t.width, 0);
  const height = ROW_H * rows.length + 24;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setScissorTest(true);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  lights(scene);
  const items = rows.map((row) => {
    const object = mergeByMaterial(groupParts(row.parts()));
    object.visible = false;
    scene.add(object);
    return object;
  });
  renderer.setClearColor('#f5f3ef');
  renderer.clear();
  let x0 = 0;
  for (const tile of tiles) {
    const head = document.createElement('div');
    head.className = 'head';
    head.style.left = `${x0 + 8}px`;
    head.textContent = tile.label;
    host.appendChild(head);
    x0 += tile.width;
  }
  rows.forEach((row, i) => {
    items.forEach((o, j) => (o.visible = j === i));
    const y = height - 24 - (i + 1) * ROW_H;
    let x = 0;
    for (const tile of row.tiles ?? tiles) {
      const camera = new THREE.PerspectiveCamera(tile.fov ?? 30, tile.width / ROW_H, 0.05, 200);
      const target = V(...tile.focus);
      camera.position.copy(target).addScaledVector(V(...tile.dir).normalize(), tile.distance);
      camera.lookAt(target);
      renderer.setViewport(x, y, tile.width - 2, ROW_H - 2);
      renderer.setScissor(x, y, tile.width - 2, ROW_H - 2);
      renderer.render(scene, camera);
      x += tile.width;
    }
    const label = document.createElement('div');
    label.className = 'label';
    label.style.top = `${24 + i * ROW_H + 6}px`;
    label.innerHTML = `${row.label} <small>${row.note}</small>`;
    host.appendChild(label);
  });
}

const pick = query.get('rows');
board(pick ? ROWS.filter((_, i) => pick.split(',').includes(String(i))) : ROWS, TILES);
document.documentElement.dataset.ready = '1';
