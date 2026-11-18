import * as THREE from 'three';
import { createKit } from '../src/core/kit.js';
import { beam, puffy, roundedDiscGeometry, strut, tube } from '../src/core/geometry.js';
import { groupParts, mergeByMaterial } from '../src/core/merge.js';
import { muted, PAINTS } from '../src/core/palette.js';
import { STONE_TONES, WOODS, hsl } from '../src/core/color.js';
import { canvasPatternTexture } from '../src/core/materials.js';
import { grainAlong, PATTERN_KINDS } from '../src/core/patterns.js';
import { buildItem, generateItem } from '../src/core/item.js';
import * as registry from '../src/furniture/registry.js';

const query = new URLSearchParams(location.search);
const kit = createKit({ textureFactory: canvasPatternTexture });
const paint = (name) => {
  const p = PAINTS.find((x) => x.name === name);
  return muted(p.h, p.s, p.l);
};
const wood = (name) => WOODS.find((w) => w.name === name);
const stone = (name) => {
  const s = STONE_TONES.find((x) => x.name === name);
  return hsl(s.h, s.s, s.l);
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const ROWS = [
  { label: 'wood plain', note: 'oak', shapes: 'wood', material: () => kit.materials.wood(wood('oak'), { seed: 'oak' }) },
  { label: 'wood bold', note: 'walnut', shapes: 'wood', material: () => kit.materials.wood(wood('walnut'), { grain: 'bold', seed: 'walnut' }) },
  { label: 'wood fine', note: 'birch', shapes: 'wood', material: () => kit.materials.wood(wood('birch'), { grain: 'fine', seed: 'birch' }) },
  { label: 'wood plain', note: 'cherry, scale 1.5', shapes: 'wood', material: () => kit.materials.wood(wood('cherry'), { seed: 'cherry', scale: 1.5 }) },
  { label: 'dots offset', note: 'cream + navy', spec: { kind: 'dots', colors: [paint('cream'), paint('navy')] } },
  { label: 'dots grid', note: 'sage + cream, 3 cm', spec: { kind: 'dots', colors: [paint('sage'), paint('cream')], layout: 'grid', spacing: 0.03, size: 0.25 } },
  { label: 'floral', note: 'cream, rose, ochre, sage', spec: { kind: 'floral', colors: [paint('cream'), paint('dusty rose'), paint('ochre'), paint('sage')] } },
  { label: 'floral no leaves', note: 'slate blue + cream, 6 petals', spec: { kind: 'floral', colors: [paint('slate blue'), paint('cream')], leaves: false, petals: 6, spacing: 0.09 } },
  { label: 'gingham', note: 'cream + powder blue', spec: { kind: 'gingham', colors: [paint('cream'), paint('slate blue')] } },
  { label: 'gingham overcheck', note: 'putty + terracotta, 4 cm', spec: { kind: 'gingham', colors: [paint('cream'), paint('terracotta'), paint('navy')], spacing: 0.04, overcheck: 0.12 } },
  { label: 'ticking', note: 'pinstripe, cream + navy', spec: { kind: 'ticking', colors: [paint('cream'), paint('navy')], spacing: 0.03, width: 0.12 } },
  { label: 'ticking double', note: 'horizontal, putty + oxblood', spec: { kind: 'ticking', colors: [paint('putty'), paint('oxblood')], spacing: 0.05, width: 0.1, double: true, direction: 'horizontal' } },
  { label: 'herringbone', note: 'charcoal tweed', spec: { kind: 'herringbone', colors: [paint('charcoal')] } },
  { label: 'herringbone', note: 'putty + cream, wide', spec: { kind: 'herringbone', colors: [paint('putty'), paint('cream')], band: 0.045, spacing: 0.014 } },
  { label: 'terrazzo', note: 'grey terrazzo', shapes: 'stone', spec: { kind: 'terrazzo', colors: [stone('grey terrazzo')] } },
  { label: 'terrazzo', note: 'white marble, terracotta chips', shapes: 'stone', spec: { kind: 'terrazzo', colors: [stone('white marble'), paint('terracotta'), paint('sage')], size: 0.018, density: 0.5 } },
  { label: 'linen', note: 'oatmeal', spec: { kind: 'linen', colors: [paint('putty')] } },
  { label: 'boucle', note: 'cream', spec: { kind: 'linen', colors: [paint('cream')], texture: 'boucle', thread: 0.004, strength: 0.6 } },
  { label: 'canvas stripes (legacy)', note: 'chair texture path', surface: { color: paint('cream'), secondary: paint('slate blue'), pattern: 'stripes', scale: 4 } },
];

function fabricShapes(mat) {
  const box = puffy(0.4, 0.45, 0.4, 0.03, mat, 2);
  box.position.set(-1.45, 0.225, 0);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 10), mat);
  cyl.position.set(-0.85, 0.225, 0);
  const cushion = puffy(0.6, 0.16, 0.6, 0.06, mat, 3);
  cushion.position.set(-0.15, 0.08, 0);
  const sofa = puffy(1.6, 0.42, 0.75, 0.06, mat, 3);
  sofa.position.set(1.15, 0.21, 0);
  const back = puffy(1.6, 0.4, 0.18, 0.05, mat, 3);
  back.position.set(1.15, 0.6, -0.28);
  return [box, cyl, cushion, sofa, back];
}

function stoneShapes(mat) {
  const top = new THREE.Mesh(roundedDiscGeometry(0.45, 0.04, 0.012, 16), mat);
  top.position.set(-0.9, 0.72, 0);
  const column = strut(V(-0.9, 0, 0), V(-0.9, 0.7, 0), 0.06, 0.08, 10, mat);
  const slab = puffy(1.6, 0.05, 0.8, 0.01, mat, 2);
  slab.position.set(1, 0.72, 0);
  const block = puffy(0.4, 0.45, 0.4, 0.02, mat, 2);
  block.position.set(1, 0.225, 0);
  return [top, column, slab, block];
}

function woodShapes(mat) {
  const parts = [];
  for (let i = 0; i < 4; i++) parts.push(beam(V(-1.9, 0.45, -0.18 + i * 0.12), V(-0.5, 0.45, -0.18 + i * 0.12), 0.09, 0.025, 0.004, mat));
  for (const x of [-1.8, -0.6]) for (const z of [-0.17, 0.17]) parts.push(strut(V(x, 0, z), V(x, 0.44, z), 0.022, 0.018, 6, mat));
  parts.push(beam(V(-1.8, 0.38, 0.17), V(-0.6, 0.38, 0.17), 0.02, 0.06, 0.004, mat));
  const top = new THREE.Mesh(roundedDiscGeometry(0.4, 0.035, 0.01, 16), mat);
  top.position.set(0.15, 0.7, 0);
  grainAlong(top, 'x');
  parts.push(top, strut(V(0.15, 0, 0), V(0.15, 0.68, 0), 0.04, 0.05, 8, mat));
  parts.push(beam(V(0.9, 0, 0.2), V(1.05, 0.9, -0.2), 0.05, 0.03, 0.004, mat));
  parts.push(beam(V(1.6, 0, 0.2), V(1.45, 0.9, -0.2), 0.05, 0.03, 0.004, mat));
  const seat = puffy(0.7, 0.04, 0.45, 0.01, mat, 2);
  seat.position.set(1.25, 0.45, 0);
  parts.push(seat);
  parts.push(tube([V(1.0, 0.92, -0.2), V(1.25, 1.05, -0.26), V(1.5, 0.92, -0.2)], 0.018, 8, mat));
  return parts;
}

function buildRow(row) {
  const mat = row.material ? row.material() : row.surface ? kit.materials.surface(row.surface) : kit.materials.pattern(row.spec);
  const parts = row.shapes === 'wood' ? woodShapes(mat) : row.shapes === 'stone' ? stoneShapes(mat) : fabricShapes(mat);
  return mergeByMaterial(groupParts(parts));
}

function lights(scene) {
  scene.background = new THREE.Color('#f5f3ef');
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d2c5', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.02;
  sun.position.set(0.5, 1, 0.75).multiplyScalar(12);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, far: 40 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return sun;
}

const ROW_H = 300;
const appFov = (rowH) => 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(19)) * (rowH / 900)));
const TILES = [
  { label: 'close-up (app zoom, 2.4 m)', width: 620, distance: 2.4, dir: [0.35, 0.8, 1], focus: [0.6, 0.3, 0] },
  { label: 'item view (5 m)', width: 380, distance: 5, dir: [0.45, 0.8, 1], focus: [0, 0.35, 0] },
  { label: 'grid distance (45 m)', width: 200, distance: 45, dir: [1.25, 1.2, 1.7], focus: [0, 0.35, 0] },
].map((t) => ({ ...t, fov: appFov(ROW_H) }));
const LABEL_W = 0;

function board() {
  const host = document.getElementById('board');
  const width = TILES.reduce((s, t) => s + t.width, LABEL_W);
  const height = ROW_H * ROWS.length + 24;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setScissorTest(true);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  lights(scene);
  const items = ROWS.map((row) => {
    const object = buildRow(row);
    object.visible = false;
    scene.add(object);
    return object;
  });
  renderer.setClearColor('#f5f3ef');
  renderer.clear();
  let x0 = LABEL_W;
  for (const tile of TILES) {
    const head = document.createElement('div');
    head.className = 'head';
    head.style.left = `${x0 + 8}px`;
    head.textContent = tile.label;
    host.appendChild(head);
    x0 += tile.width;
  }
  ROWS.forEach((row, i) => {
    items.forEach((o, j) => (o.visible = j === i));
    const y = height - 24 - (i + 1) * ROW_H;
    let x = LABEL_W;
    for (const tile of TILES) {
      const camera = new THREE.PerspectiveCamera(tile.fov, tile.width / ROW_H, 0.05, 200);
      const target = V(...tile.focus);
      if (row.shapes === 'stone') target.y += 0.3;
      if (row.shapes === 'wood' && tile.focus[0]) target.set(-1.0, 0.45, 0);
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
  const gl = renderer.getContext();
  document.documentElement.dataset.errors = String(gl.getError());
  document.documentElement.dataset.kinds = PATTERN_KINDS.join(',');
}

function perf(type) {
  const definition = registry.get(type);
  const plain = query.has('plain');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const sun = lights(scene);
  const { gridSize, spacing } = definition.cell;
  const extent = ((gridSize - 1) / 2) * spacing + 1;
  sun.position.set(0.5, 1, 0.75).multiplyScalar(extent + 6);
  Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: extent * 4 + 20 });
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.updateProjectionMatrix();
  const kinds = ['wood', 'floral', 'dots', 'linen', 'gingham', 'herringbone', 'ticking', 'terrazzo'];
  let n = 0;
  const materials = new Set();
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      n++;
      const object = buildItem(definition, generateItem(definition, 'perf', n), kit);
      if (!plain) {
        object.children.forEach((mesh, k) => {
          const color = `#${mesh.material.color.getHexString()}`;
          mesh.material = kit.materials.pattern({ kind: kinds[(n + k) % kinds.length], colors: [color], seed: n });
          materials.add(mesh.material.customProgramCacheKey());
        });
      }
      object.position.set((i - (gridSize - 1) / 2) * spacing, 0, (j - (gridSize - 1) / 2) * spacing);
      scene.add(object);
    }
  }
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.05, extent * 10 + 50);
  const base = V(extent * 1.25, extent * 1.2, extent * 1.7);
  camera.position.copy(base);
  camera.lookAt(0, 0.3, 0);
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  const frames = [];
  const renderMs = [];
  const gl = renderer.getContext();
  const pixel = new Uint8Array(4);
  let last = performance.now();
  const start = last;
  const duration = Number(query.get('ms') ?? 3000);
  const tick = (now) => {
    frames.push(now - last);
    last = now;
    const a = ((now - start) / duration) * Math.PI * 0.6;
    camera.position.set(base.x * Math.cos(a) - base.z * Math.sin(a), base.y, base.x * Math.sin(a) + base.z * Math.cos(a));
    camera.lookAt(0, 0.3, 0);
    const t0 = performance.now();
    renderer.render(scene, camera);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    renderMs.push(performance.now() - t0);
    if (now - start < duration) requestAnimationFrame(tick);
    else {
      const sample = frames.slice(5).sort((a, b) => a - b);
      const avg = sample.reduce((s, v) => s + v, 0) / sample.length;
      document.documentElement.dataset.result = JSON.stringify({
        type,
        plain,
        items: n,
        programs: renderer.info.programs.length,
        kinds: materials.size,
        avg: +avg.toFixed(2),
        p95: +sample[Math.floor(sample.length * 0.95)].toFixed(2),
        frames: sample.length,
        renderMs: +(renderMs.slice(5).sort((a, b) => a - b)[Math.floor((renderMs.length - 5) / 2)]).toFixed(2),
      });
    }
  };
  requestAnimationFrame(tick);
}

if (query.has('perf')) perf(query.get('perf'));
else board();
document.documentElement.dataset.ready = '1';
