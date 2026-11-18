import * as THREE from 'three';
import { createKit } from '../src/core/kit.js';
import { puffy, strut } from '../src/core/geometry.js';
import { groupParts, mergeByMaterial } from '../src/core/merge.js';
import { capSaturation, harmoniousSecondary, muted, PAINTS } from '../src/core/palette.js';
import { FRAME_COLORS, WOODS } from '../src/core/color.js';
import { grainAlong } from '../src/core/patterns.js';
import { buildFeet, buildApron, legLines, rowAnchors } from '../src/core/supports.js';
import { buildCarcass, buildFronts, solveFronts } from '../src/core/fronts.js';
import { HANDLE_KINDS } from '../src/core/handles.js';
import { CABINET_TEMPLATES, DESK_PLANS } from '../tests/helpers/front-plans.js';

const kit = createKit();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const paint = (name) => {
  const p = PAINTS.find((x) => x.name === name);
  return muted(p.h, p.s, p.l);
};
const wood = (name) => WOODS.find((w) => w.name === name);
const brass = capSaturation(0.11, 0.42, 0.5).hex;

const FINISH = {
  oak: () => kit.materials.wood(wood('oak'), { grain: 'plain', seed: 'oak' }),
  walnut: () => kit.materials.wood(wood('walnut'), { grain: 'plain', seed: 'walnut' }),
  cherry: () => kit.materials.wood(wood('cherry'), { grain: 'fine', seed: 'cherry' }),
  birch: () => kit.materials.wood(wood('birch'), { grain: 'fine', seed: 'birch' }),
  sage: () => kit.materials.solid(paint('sage'), 0.6),
  cream: () => kit.materials.solid(paint('cream'), 0.6),
  navy: () => kit.materials.solid(paint('navy'), 0.6),
  charcoal: () => kit.materials.solid(paint('charcoal'), 0.6),
  black: () => kit.materials.frame(FRAME_COLORS.black, 'black'),
  metal: () => kit.materials.frame(FRAME_COLORS.metal, 'metal'),
  brass: () => kit.materials.frame(brass, 'metal'),
  leather: () => kit.materials.solid('#7a4a2e', 0.7),
  cane: () => kit.materials.pattern({ kind: 'dots', layout: 'grid', spacing: 0.012, size: 0.28, colors: [capSaturation(0.11, 0.32, 0.7).hex, harmoniousSecondary(capSaturation(0.11, 0.32, 0.7), 'dark').hex] }),
};

const slotsOf = (a = 0.5, b = 0.5, c = 0.5, d = 0.5, e = 0.5, f = 0.2) => [a, b, c, d, e, f];

const CABINETS = [
  ['SB1', 'midcentury sideboard', { width: 1.7, y0: 0.22, bodyH: 0.56, slots: slotsOf(0.5, 0.9), grade: 1.08, gap: 0.004, hw: { kind: 'lip', lipFraction: 1 }, body: 'walnut', front: 'walnut', hardware: 'walnut', base: 'legs', doorStyle: 'slab', grainMode: 'continuous' }],
  ['SB2', 'shaker sideboard, inset', { width: 1.6, y0: 0.1, bodyH: 0.66, slots: slotsOf(0.6, 0.5, 0.6), construction: 'inset', hw: { kind: 'knob', knobDiameter: 0.032 }, body: 'cherry', front: 'cherry', hardware: 'cherry', doorStyle: 'framed', base: 'plinth' }],
  ['SB3', 'modern sideboard, cut-outs', { width: 1.8, y0: 0.06, bodyH: 0.62, slots: slotsOf(0.5, 0.5, 0.9), gap: 0.006, hw: { kind: 'cutout' }, body: 'cream', front: 'cream', hardware: 'cream', base: 'plinth' }],
  ['SB4', 'midcentury sideboard, asym', { width: 1.5, y0: 0.2, bodyH: 0.58, slots: slotsOf(0.5, 0.9, 0.5, 0.5, 0.5, 0.8), grade: 1.06, gap: 0.004, hw: { kind: 'knob' }, body: 'walnut', front: 'walnut', hardware: 'brass', base: 'legs', doorStyle: 'insert' }],
  ['SB5', 'industrial sideboard, open', { width: 1.6, y0: 0.18, bodyH: 0.6, slots: slotsOf(0.5), gap: 0.004, hw: { kind: 'bar', barProfile: 'square' }, body: 'oak', front: 'charcoal', hardware: 'black', base: 'legs' }],
  ['SB6', 'industrial, drawers over shelf', { width: 1.4, y0: 0.2, bodyH: 0.55, slots: slotsOf(0.5, 0.5, 0.6), gap: 0.004, hw: { kind: 'cup' }, body: 'oak', front: 'oak', hardware: 'black', base: 'legs' }],
  ['TV1', 'tv, doors and niche', { width: 1.7, y0: 0.15, bodyH: 0.36, slots: slotsOf(0.5, 0.5, 0.5, 0.5, 0.9), gap: 0.005, hw: { kind: 'tab' }, body: 'oak', front: 'oak', hardware: 'leather', base: 'legs' }],
  ['TV2', 'tv, flaps', { width: 1.8, y0: 0.08, bodyH: 0.36, slots: slotsOf(0.5, 0.5, 0.9), gap: 0.006, hw: { kind: 'groove' }, body: 'birch', front: 'birch', hardware: 'birch', base: 'plinth' }],
  ['TV3', 'tv, shelf over drawers', { width: 1.6, y0: 0.16, bodyH: 0.4, slots: slotsOf(0.5, 0.5, 0.5), gap: 0.004, hw: { kind: 'bar' }, body: 'walnut', front: 'walnut', hardware: 'metal', base: 'legs' }],
  ['TV5', 'tv, drawers and niche', { width: 1.6, y0: 0.15, bodyH: 0.38, slots: slotsOf(0.5), gap: 0.004, hw: { kind: 'knob' }, body: 'oak', front: 'sage', hardware: 'brass', base: 'legs' }],
  ['LD1', 'midcentury low dresser', { width: 1.3, y0: 0.18, bodyH: 0.62, slots: slotsOf(0.5, 0.9), grade: 1.08, gap: 0.004, hw: { kind: 'bar' }, body: 'walnut', front: 'walnut', hardware: 'brass', base: 'legs' }],
  ['LD3', 'shaker two-over-three, inset', { width: 0.98, y0: 0.1, bodyH: 0.72, slots: slotsOf(0.5, 0.9), grade: 1.15, construction: 'inset', hw: { kind: 'knob' }, body: 'cherry', front: 'cherry', hardware: 'cherry', drawerStyle: 'framed', base: 'plinth' }],
  ['LD5', 'industrial apothecary', { width: 1.4, y0: 0.15, bodyH: 0.7, slots: slotsOf(0.5, 0.9, 0.9), gap: 0.004, hw: { kind: 'cup' }, body: 'oak', front: 'oak', hardware: 'metal', base: 'legs' }],
  ['TC1', 'tall chest, graduated', { width: 0.85, y0: 0.1, bodyH: 1.15, slots: slotsOf(0.5, 0.5), grade: 1.12, gap: 0.004, hw: { kind: 'knob' }, body: 'navy', front: 'navy', hardware: 'brass', base: 'plinth' }],
  ['TC3', 'tall chest, doors over drawers', { width: 0.9, y0: 0.1, bodyH: 1.15, slots: slotsOf(0.5, 0.9), grade: 1.1, gap: 0.004, hw: { kind: 'bar' }, body: 'oak', front: 'oak', hardware: 'black', base: 'plinth' }],
  ['NS1', 'nightstand, drawer over shelf', { width: 0.5, y0: 0.2, bodyH: 0.38, slots: slotsOf(0.5, 0.5, 0.5, 0.5, 0.9), gap: 0.004, hw: { kind: 'knob' }, body: 'walnut', front: 'walnut', hardware: 'brass', base: 'legs' }],
  ['NS2', 'nightstand, drawer over door', { width: 0.5, y0: 0.1, bodyH: 0.5, slots: slotsOf(0.5), construction: 'inset', hw: { kind: 'knob' }, body: 'sage', front: 'sage', hardware: 'brass', base: 'plinth' }],
  ['NS3', 'nightstand, three drawers', { width: 0.5, y0: 0.14, bodyH: 0.48, slots: slotsOf(0.5, 0.9), gap: 0.004, hw: { kind: 'lip', lipFraction: 0.5 }, body: 'birch', front: 'birch', hardware: 'birch', base: 'legs' }],
];

const DESKS = [
  ['three', 'desk pedestal: three', { plan: DESK_PLANS.three.plan(), hw: { kind: 'bar', size: 0.128 }, front: 'oak' }],
  ['graduated4', 'pedestal: graduated4, inset framed', { plan: DESK_PLANS.graduated4.plan(), construction: 'inset', drawerStyle: 'framed', hw: { kind: 'ring', size: 0.04 }, front: 'cherry' }],
  ['boxFile', 'pedestal: box + file', { plan: DESK_PLANS.boxFile.plan(), hw: { kind: 'bar', size: 0.128 }, front: 'walnut' }],
  ['twoBoxFile', 'pedestal: 2 box + file', { plan: DESK_PLANS.twoBoxFile.plan(), hw: { kind: 'knob', size: 0.03 }, front: 'oak' }],
  ['drawerDoor', 'pedestal: drawer + door (left)', { plan: DESK_PLANS.drawerDoor.plan('left'), hw: { kind: 'tab', size: 0.06 }, front: 'oak' }],
  ['apron', 'writing desk apron row + hung', { hw: { kind: 'ring', size: 0.035 }, front: 'walnut' }],
];

function base(t, width, depth, mat) {
  if (t.y0 <= 0) return [];
  if (t.base === 'plinth') {
    const plinth = puffy(width - 0.05, t.y0 + 0.002, depth - 0.06, 0.005, mat, 2);
    plinth.position.set(0, (t.y0 + 0.002) / 2, -0.02);
    return [grainAlong(plinth, 'x')];
  }
  const legs = { legCount: 4, legThickness: 0.035, legSides: 8, legTaper: 0.6, legSplay: 0.02 };
  const fp = { width, depth, top: t.y0, anchors: rowAnchors(width, depth, 2, 0.06, 0.05) };
  return legLines(legs, fp).map((line) => strut(line.bottom, line.top, line.rTop, line.rBottom, 8, mat));
}

function cabinet(id, t) {
  const width = t.width, depth = 0.45;
  const y1 = t.y0 + t.bodyH;
  const construction = t.construction ?? 'overlay';
  const mats = { body: FINISH[t.body](), front: t.front === t.body ? null : FINISH[t.front](), hardware: null };
  mats.front ??= mats.body;
  mats.hardware = t.hardware === t.front ? mats.front : t.hardware === t.body ? mats.body : FINISH[t.hardware]();
  const carcass = buildCarcass({ width, depth, y0: t.y0, y1, panel: 0.018, construction, frontThickness: 0.02, edge: 0.002 }, mats.body);
  const plan = CABINET_TEMPLATES[id].plan(t.slots, t.grade ?? 1, width);
  const opts = { construction, gap: t.gap ?? 0.004, reveal: 0.0025, frameWidth: 0.02, grainMode: t.grainMode ?? 'classic' };
  const layout = solveFronts(plan, carcass.field, opts);
  const fronts = buildFronts(layout, {
    thickness: 0.02, bevel: 0.003, drawerStyle: t.drawerStyle ?? 'slab', doorStyle: t.doorStyle ?? 'slab', frameWidth: 0.05, doorFrameWidth: 0.06,
    fullDepth: carcass.innerDepth, opening: carcass.opening,
  }, t.hw, { front: mats.front, insert: FINISH.cane(), hardware: mats.hardware, carcass: mats.body });
  const overhang = construction === 'inset' ? 0.02 : 0.005;
  const top = puffy(width + 2 * overhang, 0.024, depth + overhang, 0.005, mats.body, 3);
  top.position.set(0, y1 + 0.012, overhang / 2);
  grainAlong(top, 'x');
  const object = mergeByMaterial(groupParts([...carcass.parts, ...fronts, top, ...base(t, width, depth, mats.body)]));
  return { object, height: y1 + 0.024, width, note: `${layout.stats.drawers}D ${layout.stats.doors}P ${layout.stats.open}O · ${construction} · ${t.hw.kind}${layout.stats.degraded !== 'none' ? ` · ${layout.stats.degraded}` : ''}` };
}

function desk(id, t) {
  const topH = 0.74, depth = 0.65, width = 1.3;
  const body = FINISH.oak();
  const front = t.front === 'oak' ? body : FINISH[t.front]();
  const hardware = t.hw.kind === 'ring' || t.hw.kind === 'knob' ? FINISH.brass() : t.hw.kind === 'tab' ? FINISH.leather() : FINISH.black();
  const parts = [];
  const top = puffy(width, 0.028, depth, 0.006, body, 3);
  top.position.set(0, topH - 0.014, 0);
  parts.push(grainAlong(top, 'x'));
  const under = topH - 0.028;
  let stats;
  if (id === 'apron') {
    const legs = { legCount: 4, legThickness: 0.04, legSides: 4, legTaper: 0.7, legSplay: 0 };
    const fp = { width: width - 0.06, depth: depth - 0.06, top: under, anchors: rowAnchors(width - 0.06, depth - 0.06, 2, 0.03, 0.03) };
    const lines = legLines(legs, fp);
    lines.forEach((line) => parts.push(strut(line.bottom, line.top, line.rTop, line.rBottom, 4, body)));
    parts.push(buildApron(lines, { top: under, height: 0.12, thickness: 0.02, edges: 'short' }, body));
    parts.push(buildApron([lines[3], lines[2]], { top: under, height: 0.12, thickness: 0.02 }, body));
    const legFront = fp.depth / 2 - 0.03 + 0.02;
    parts.push(buildApron([lines[0], lines[1]], { top: under, height: 0.12, thickness: 0.02, setback: 0.02 + 0.01 }, body));
    const field = { x0: lines[0].top.x + 0.02, x1: lines[1].top.x - 0.02, y0: under - 0.12, y1: under, z: legFront };
    const layout = solveFronts({ leaf: 'drawers', count: 1, across: 3 }, field, DESK_PLANS.apronRow.opts);
    parts.push(...buildFronts(layout, { thickness: 0.02, backers: false, members: false }, t.hw, { front, hardware }));
    stats = layout.stats;
  } else {
    const pw = 0.42, pd = depth - 0.04;
    const x = -width / 2 + 0.02 + pw / 2;
    const construction = t.construction ?? 'overlay';
    const carcass = buildCarcass({ width: pw, depth: pd, y0: 0.08, y1: under, panel: 0.018, construction, frontThickness: 0.02, x }, body);
    parts.push(...carcass.parts);
    const feet = buildFeet(rowAnchors(pw - 0.06, pd - 0.06, 2, 0, 0).map(([fx, fz]) => [fx + x, fz]), { kind: 'block', height: 0.08, radius: 0.022 }, body);
    parts.push(...feet);
    const layout = solveFronts(t.plan, carcass.field, { ...DESK_PLANS.three.opts, construction });
    parts.push(...buildFronts(layout, { thickness: 0.02, drawerStyle: t.drawerStyle ?? 'slab', frameWidth: 0.045, opening: carcass.opening, fullDepth: carcass.innerDepth }, t.hw, { front, hardware, carcass: body }));
    const hx = width / 2 - 0.02 - 0.2;
    const hung = buildCarcass({ width: 0.4, depth: pd, y0: under - 0.3, y1: under, panel: 0.018, x: hx }, body);
    parts.push(...hung.parts);
    const hungLayout = solveFronts(DESK_PLANS.hung.plan(2), hung.field, DESK_PLANS.hung.opts);
    parts.push(...buildFronts(hungLayout, { thickness: 0.02, opening: hung.opening }, t.hw, { front, hardware, carcass: body }));
    for (const fz of [-1, 1]) parts.push(strut(V(hx + 0.17, 0, fz * (pd / 2 - 0.04)), V(hx + 0.17, under - 0.3, fz * (pd / 2 - 0.04)), 0.018, 0.016, 6, body));
    stats = layout.stats;
  }
  return { object: mergeByMaterial(groupParts(parts)), height: topH, width, note: `${stats.drawers}D ${stats.doors}P · ${t.hw.kind}` };
}

function handleBox(kind) {
  const width = 0.9, depth = 0.42, y0 = 0.08, y1 = 0.72;
  const body = FINISH.oak();
  const front = kind === 'lip' ? body : FINISH.cream();
  const hardware = kind === 'tab' ? FINISH.leather() : kind === 'lip' ? body : kind === 'knob' ? FINISH.brass() : FINISH.black();
  const carcass = buildCarcass({ width, depth, y0, y1, panel: 0.018 }, body);
  const plan = { split: 'y', weights: [1, 1.9], children: [{ leaf: 'drawers', count: 2 }, { leaf: 'doors' }] };
  const layout = solveFronts(plan, carcass.field, { gap: 0.004 });
  const hw = { kind, barScale: 1, lipFraction: 0.6, cutoutShape: kind === 'cutout' ? 'slot' : 'slot' };
  const parts = buildFronts(layout, { thickness: 0.02, opening: carcass.opening, fullDepth: carcass.innerDepth }, hw, { front, hardware, carcass: body });
  const top = puffy(width + 0.01, 0.024, depth + 0.005, 0.005, body, 3);
  top.position.set(0, y1 + 0.012, 0.0025);
  const plinth = puffy(width - 0.05, y0 + 0.002, depth - 0.06, 0.005, body, 2);
  plinth.position.set(0, (y0 + 0.002) / 2, -0.02);
  return { object: mergeByMaterial(groupParts([...carcass.parts, ...parts, top, plinth])), height: y1 + 0.024, width, note: `${HANDLE_KINDS[kind].tris} tris each` };
}

function lights(scene) {
  scene.background = new THREE.Color('#f5f3ef');
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d2c5', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.normalBias = 0.02;
  sun.position.set(0.5, 1, 0.75).multiplyScalar(12);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, far: 40 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

const query = new URLSearchParams(location.search);
const COLS = Number(query.get('cols') ?? 4);
const TILE_W = Number(query.get('w') ?? 380);
const TILE_H = Number(query.get('h') ?? 300);

function tiles() {
  const only = query.get('only');
  const list = [
    ...CABINETS.map(([id, label, t]) => ({ label: `${id} ${label}`, make: () => cabinet(id, t) })),
    ...DESKS.map(([id, label, t]) => ({ label, make: () => desk(id, t) })),
    ...Object.keys(HANDLE_KINDS).map((kind) => ({ label: `handle: ${kind}`, make: () => handleBox(kind) })),
  ];
  return only ? list.filter((t) => t.label.toLowerCase().includes(only.toLowerCase())) : list;
}

function board() {
  const host = document.getElementById('board');
  const list = tiles();
  const rows = Math.ceil(list.length / COLS);
  const width = COLS * TILE_W, height = rows * TILE_H;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setScissorTest(true);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  lights(scene);
  renderer.setClearColor('#f5f3ef');
  renderer.clear();
  const fov = 28;
  list.forEach((tile, i) => {
    const built = tile.make();
    built.object.traverse((o) => {
      if (o.isMesh && o.geometry.attributes.position.array.some(Number.isNaN)) console.error(`NaN positions in ${tile.label} (${o.material.type})`);
    });
    scene.add(built.object);
    const col = i % COLS, row = Math.floor(i / COLS);
    const size = Math.max(built.width / (TILE_W / TILE_H), built.height) * 1.25;
    const distance = size / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    const camera = new THREE.PerspectiveCamera(fov, TILE_W / TILE_H, 0.05, 100);
    const target = V(0, built.height * 0.5, 0);
    camera.position.copy(target).addScaledVector(V(0.32, 0.22, 1).normalize(), distance);
    camera.lookAt(target);
    const y = height - (row + 1) * TILE_H;
    renderer.setViewport(col * TILE_W, y, TILE_W - 2, TILE_H - 2);
    renderer.setScissor(col * TILE_W, y, TILE_W - 2, TILE_H - 2);
    renderer.render(scene, camera);
    scene.remove(built.object);
    const label = document.createElement('div');
    label.className = 'label';
    label.style.left = `${col * TILE_W + 6}px`;
    label.style.top = `${row * TILE_H + 6}px`;
    label.innerHTML = `${tile.label}<br><small>${built.note}</small>`;
    host.appendChild(label);
  });
  document.documentElement.dataset.errors = String(renderer.getContext().getError());
}

board();
document.documentElement.dataset.ready = '1';
