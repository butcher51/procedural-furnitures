import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRng } from '../../src/core/rng.js';
import { buildCarcass, buildFronts, FRONT_DEFAULTS, frontPanel, handleSlots, planHandles, solveFronts } from '../../src/core/fronts.js';
import { buildHandle, handleTris, HANDLE_DEFAULTS, HANDLE_KINDS, normalizeHandle } from '../../src/core/handles.js';
import { CABINET_STYLES, CABINET_TEMPLATES, cabinetCase, DESK_PLANS } from '../helpers/front-plans.js';

const mat = new THREE.MeshBasicMaterial();
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const boxOf = (object) => {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
};
const trianglesOf = (object) => {
  let n = 0;
  object.traverse((o) => {
    if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });
  return n;
};

const separation = (a, b) => Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);
const counts = (layout) => JSON.stringify([layout.stats.drawers, layout.stats.doors, layout.stats.open]);

function checkLayout(layout, field, opts, label) {
  const o = { ...FRONT_DEFAULTS, ...opts };
  const inset = o.construction === 'inset';
  const minSep = inset ? 2 * o.reveal : Math.min(o.gap, o.frameWidth);
  const rects = [...layout.fronts, ...layout.open];
  for (const r of rects) {
    assert.ok(r.x0 >= field.x0 - 1e-9 && r.x1 <= field.x1 + 1e-9 && r.y0 >= field.y0 - 1e-9 && r.y1 <= field.y1 + 1e-9, `${label}: outside field`);
    assert.ok(r.x1 > r.x0 && r.y1 > r.y0, `${label}: empty rect`);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      assert.ok(separation(rects[i], rects[j]) >= minSep - 1e-6, `${label}: separator ${separation(rects[i], rects[j])} < ${minSep}`);
    }
  }
  const pad = inset ? 2 * o.reveal : 0;
  for (const f of layout.fronts.filter((f) => f.kind === 'drawer')) {
    const h = f.y1 - f.y0 + pad;
    if (layout.stats.degraded === 'none') assert.ok(h >= o.minDrawerH - 1e-6 && h <= o.maxDrawerH + 1e-6, `${label}: drawer height ${h}`);
    assert.ok(h >= o.minDrawerH - 1e-6, `${label}: drawer height ${h}`);
  }
  for (const f of layout.fronts.filter((f) => f.kind === 'door')) {
    if (!layout.stats.wideDoors) assert.ok(f.x1 - f.x0 <= o.maxDoorW + 1e-6, `${label}: door ${f.x1 - f.x0}`);
    assert.ok(f.x1 - f.x0 <= o.maxWideDoorW + 1e-6, `${label}: wide door ${f.x1 - f.x0}`);
  }
  assert.ok(layout.fronts.length <= o.maxFronts, `${label}: ${layout.fronts.length} fronts`);
  for (const f of layout.fronts) assert.ok(near(f.z1 - f.z0, o.thickness), label);
}

function checkMirror(layout, label) {
  const key = (r) => [r.x0, r.x1, r.y0, r.y1];
  for (const f of [...layout.fronts, ...layout.open]) {
    const twin = [...layout.fronts, ...layout.open].find((g) => near(g.x0, -f.x1, 0.001) && near(g.x1, -f.x0, 0.001) && near(g.y0, f.y0, 0.001) && near(g.y1, f.y1, 0.001));
    assert.ok(twin, `${label}: no mirror for ${key(f)}`);
    if (f.kind === 'door' && twin !== f && f.hinge && twin.hinge) assert.notEqual(f.hinge, twin.hinge, `${label}: hinges do not mirror`);
  }
}

test('solveFronts invariants: every cabinet template x 4 styles x 200 random fields', () => {
  let flips = 0, total = 0;
  for (const id of Object.keys(CABINET_TEMPLATES)) {
    for (const style of Object.keys(CABINET_STYLES)) {
      const r = createRng(`fronts/${id}/${style}`);
      for (let i = 0; i < 200; i++) {
        const { plan, field, opts } = cabinetCase(id, style, r);
        const label = `${id}/${style}/${i}`;
        const layout = solveFronts(plan, field, opts);
        checkLayout(layout, field, opts, label);
        assert.deepStrictEqual(solveFronts(plan, field, opts), layout, `${label}: not deterministic`);
        if (plan.symmetric && layout.stats.degraded !== 'fallback') checkMirror(layout, label);
        const nudged = solveFronts(plan, { ...field, x1: field.x1 + 0.0005, x0: field.x0 - 0.0005, y1: field.y1 + 0.001 }, opts);
        total++;
        if (counts(nudged) !== counts(layout)) flips++;
      }
    }
  }
  assert.ok(flips / total < 0.03, `a 1 mm field change flipped counts in ${flips} of ${total} cases`);
});

test('solveFronts does not mutate the plan and keeps planned counts when they fit', () => {
  const plan = { split: 'x', symmetric: true, weights: [1, 0.8, 1], children: [{ leaf: 'doors' }, { leaf: 'drawers', count: 4, grade: 1.1 }, { leaf: 'doors' }] };
  const copy = structuredClone(plan);
  const layout = solveFronts(plan, { x0: -0.8, x1: 0.8, y0: 0.2, y1: 0.78, z: 0.22 });
  assert.deepStrictEqual(plan, copy);
  assert.deepStrictEqual([layout.stats.drawers, layout.stats.doors, layout.stats.degraded], [4, 2, 'none']);
  const drawers = layout.fronts.filter((f) => f.kind === 'drawer');
  for (let i = 1; i < drawers.length; i++) assert.ok(drawers[i].y1 - drawers[i].y0 > drawers[i - 1].y1 - drawers[i - 1].y0, 'graduated: bottom drawers taller');
  const doors = layout.fronts.filter((f) => f.kind === 'door');
  assert.deepStrictEqual(doors.map((d) => d.hinge), ['left', 'right']);
  assert.deepStrictEqual(doors.map((d) => d.grain), ['y', 'y']);
});

test('solveFronts: door pairs above maxDoorW, wide doors, maxDoorH stacks, flaps', () => {
  const field = { x0: -0.5, x1: 0.5, y0: 0.1, y1: 0.8, z: 0.2 };
  const pair = solveFronts({ leaf: 'doors' }, field);
  assert.deepStrictEqual(pair.fronts.map((f) => f.hinge), ['left', 'right']);
  const wide = solveFronts({ leaf: 'doors' }, { ...field, x0: -0.65, x1: 0.65 });
  assert.equal(wide.stats.wideDoors, true);
  const tall = solveFronts({ leaf: 'doors' }, { ...field, x0: -0.25, x1: 0.25, y1: 2.0 }, { maxDoorH: 1.0 });
  assert.equal(tall.fronts.length, 2);
  assert.ok(tall.fronts.every((f) => f.y1 - f.y0 <= 1.0));
  const single = solveFronts({ leaf: 'doors' }, { ...field, x0: 0.1, x1: 0.5 });
  assert.equal(single.fronts[0].hinge, 'right');
  const flap = solveFronts({ leaf: 'doors', hinge: 'bottom' }, { ...field, y1: 0.4 });
  assert.deepStrictEqual([flap.fronts[0].kind, flap.fronts[0].hinge, flap.fronts[0].grain], ['flap', 'bottom', 'x']);
});

test('solveFronts: inset members, overlay dividers next to open cells, backers per closed run', () => {
  const field = { x0: -0.6, x1: 0.6, y0: 0.1, y1: 0.7, z: 0.2 };
  const plan = { split: 'x', symmetric: true, children: [{ leaf: 'doors' }, { leaf: 'open', shelves: 1 }, { leaf: 'doors' }] };
  const overlay = solveFronts(plan, field);
  assert.equal(overlay.members.length, 2);
  assert.ok(overlay.members.every((m) => m.depth === 'full' && m.axis === 'y' && near(m.x1 - m.x0, FRONT_DEFAULTS.frameWidth)));
  assert.equal(overlay.open[0].shelves.length, 1);
  assert.equal(overlay.closed.length, 2);
  const inset = solveFronts({ split: 'y', weights: [1, 2], children: [{ leaf: 'drawers', count: 1, across: 2 }, { leaf: 'doors' }] }, field, { construction: 'inset' });
  assert.ok(inset.members.some((m) => m.axis === 'x') && inset.members.some((m) => m.axis === 'y'));
  assert.equal(inset.closed.length, 1);
  for (const f of inset.fronts) assert.ok(near(f.z1, field.z - 0.001));
});

test('solveFronts: acrossTop gives "two over n" rows that match the graduation', () => {
  const layout = solveFronts({ leaf: 'drawers', count: 4, grade: 1.12, acrossTop: 2 }, { x0: -0.45, x1: 0.45, y0: 0.15, y1: 0.85, z: 0.2 });
  assert.equal(layout.stats.drawers, 5);
  const rows = [...new Set(layout.fronts.map((f) => f.row))];
  assert.equal(rows.length, 4);
  assert.equal(layout.fronts.filter((f) => f.row === 0).length, 2);
});

test('solveFronts degrades deterministically: counts, then collapse, then fallback', () => {
  const tooMany = solveFronts({ split: 'x', children: [{ leaf: 'drawers', count: 6 }, { leaf: 'drawers', count: 6 }, { leaf: 'drawers', count: 6 }] }, { x0: -0.8, x1: 0.8, y0: 0.1, y1: 1.4, z: 0.2 });
  assert.ok(tooMany.fronts.length <= 16);
  assert.equal(tooMany.stats.degraded, 'counts');
  const narrow = solveFronts({ split: 'x', symmetric: true, children: [{ leaf: 'doors' }, { leaf: 'doors' }, { leaf: 'doors' }, { leaf: 'doors' }] }, { x0: -0.35, x1: 0.35, y0: 0.1, y1: 0.6, z: 0.2 });
  assert.equal(narrow.stats.degraded, 'collapsed');
  assert.equal(narrow.stats.doors, 2);
  const tiny = solveFronts({ split: 'y', children: [{ leaf: 'open' }, { leaf: 'open' }] }, { x0: -0.1, x1: 0.1, y0: 0.1, y1: 0.2, z: 0.2 }, { fallback: { leaf: 'drawers', count: 2 }, minDrawerW: 0.1 });
  assert.equal(tiny.stats.degraded, 'fallback');
});

test('desk plan shapes solve with their per-call options', () => {
  const expect = { apronRow: [3, 0], three: [3, 0], graduated4: [4, 0], boxFile: [2, 0], twoBoxFile: [3, 0], drawerDoor: [1, 1], hung: [3, 0], centre: [1, 0] };
  for (const [id, shape] of Object.entries(DESK_PLANS)) {
    for (const construction of ['overlay', 'inset']) {
      const opts = { ...shape.opts, construction, gap: 0.004, reveal: 0.0025 };
      const layout = solveFronts(shape.plan(), shape.field, opts);
      checkLayout(layout, shape.field, opts, `${id}/${construction}`);
      assert.deepStrictEqual([layout.stats.drawers, layout.stats.doors], expect[id], id);
      assert.equal(layout.stats.degraded, 'none', id);
    }
  }
  const leftPedestal = solveFronts(DESK_PLANS.drawerDoor.plan('left'), { ...DESK_PLANS.drawerDoor.field, x0: 0.3, x1: 0.7 }, DESK_PLANS.drawerDoor.opts);
  assert.equal(leftPedestal.fronts.find((f) => f.kind === 'door').hinge, 'left');
  const file = solveFronts(DESK_PLANS.boxFile.plan(), DESK_PLANS.boxFile.field, DESK_PLANS.boxFile.opts).fronts[1];
  assert.ok(file.y1 - file.y0 > 0.24);
  const [slot] = handleSlots(file, { kind: 'bar', size: 0.128, vPos: 'centre' });
  assert.ok(near(slot.y, file.y1 - (file.y1 - file.y0) / 3), 'file drawer handle in the upper third');
});

const front = (kind, x0, x1, y0, y1, extra = {}) => ({ kind, x0, x1, y0, y1, z0: 0.18, z1: 0.2, grain: 'x', hinge: kind === 'door' ? 'left' : null, ...extra });

test('handleSlots: counts, positions and fit rules', () => {
  assert.equal(handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.65), { kind: 'knob' }).length, 1);
  const pair = handleSlots(front('drawer', -0.4, 0.4, 0.5, 0.65), { kind: 'knob' });
  assert.deepStrictEqual(pair.map((s) => s.x.toFixed(3)), ['-0.200', '0.200']);
  assert.equal(handleSlots(front('drawer', -0.45, 0.45, 0.5, 0.65), { kind: 'bar' }).length, 1);
  const bars = handleSlots(front('drawer', -0.5, 0.5, 0.5, 0.65), { kind: 'bar', barScale: 1.2 });
  assert.equal(bars.length, 2);
  for (const s of bars) assert.ok(s.length <= 0.5 - 0.02 + 1e-9 && near((s.length / 0.032) % 1, 0, 1e-6) || near((s.length / 0.032) % 1, 1, 1e-6));
  const top = handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.7), { kind: 'knob', vPos: 'top' })[0];
  assert.ok(near(top.y, 0.7 - 0.06));
  const knob = handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.54), { kind: 'knob', knobDiameter: 0.038 })[0];
  assert.ok(near(knob.length, 0.024));
  assert.equal(handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.58), { kind: 'cutout' })[0].kind, 'groove');
  assert.equal(handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.62), { kind: 'cutout' })[0].kind, 'cutout');
  const lip = handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.62), { kind: 'lip', lipFraction: 0.5 })[0];
  assert.ok(near(lip.length, 0.3) && near(lip.y + lip.size / 2, 0.62));
  assert.deepStrictEqual(handleSlots(front('drawer', -0.3, 0.3, 0.5, 0.62), { kind: 'none' }), []);
});

test('handleSlots: door handles sit on the opening side, vertical bars from the top', () => {
  const left = front('door', -0.6, -0.1, 0.1, 0.7, { hinge: 'left' });
  const right = front('door', 0.1, 0.6, 0.1, 0.7, { hinge: 'right' });
  for (const kind of ['knob', 'bar', 'cup', 'tab', 'ring', 'lip', 'cutout']) {
    const [a] = handleSlots(left, { kind, doorInset: 0.05, doorDrop: 0.08 });
    const [b] = handleSlots(right, { kind, doorInset: 0.05, doorDrop: 0.08 });
    assert.ok(a.x > -0.35 && b.x < 0.35, `${kind}: handles on the hinge side`);
    assert.ok(near(a.x, -b.x), kind);
  }
  const [bar] = handleSlots(left, { kind: 'cup', doorDrop: 0.08 });
  assert.deepStrictEqual([bar.kind, bar.axis], ['bar', 'y']);
  assert.ok(near(bar.y + bar.length / 2, 0.7 - 0.08));
  const [groove] = handleSlots(left, { kind: 'groove' });
  assert.equal(groove.side, 'right');
  const short = handleSlots(front('door', -0.3, 0, 0.1, 0.35, { hinge: 'left' }), { kind: 'knob' })[0];
  assert.ok(near(short.y, 0.225));
});

function footprintOk(slot, f) {
  const handle = buildHandle(slot, { kind: slot.kind }, mat);
  const box = boxOf(handle);
  const pad = slot.kind === 'lip' ? -1e-6 : 0.008 - 1e-4;
  return box.min.x >= f.x0 + pad && box.max.x <= f.x1 - pad && box.min.y >= f.y0 + pad && box.max.y <= f.y1 - pad;
}

test('handles stay inside their front shrunk by 8 mm and touch its face', () => {
  const fronts = [front('drawer', -0.3, 0.3, 0.5, 0.6), front('drawer', -0.5, 0.5, 0.2, 0.5), front('door', -0.3, 0, 0.1, 0.7), front('door', 0, 0.3, 0.1, 0.7, { hinge: 'right' }), front('flap', -0.3, 0.3, 0.1, 0.4)];
  for (const kind of ['knob', 'bar', 'cup', 'ring', 'tab', 'lip']) {
    for (const f of fronts) {
      for (const slot of handleSlots(f, { kind })) {
        assert.ok(footprintOk(slot, f), `${kind} on ${f.kind} ${f.x0}`);
        const box = boxOf(buildHandle(slot, { kind }, mat));
        assert.ok(box.min.z >= f.z1 - 0.0011 && box.min.z <= f.z1 + 0.003, `${kind}: back face ${box.min.z}`);
      }
    }
  }
});

test('HANDLE_KINDS triangle costs match the built handles', () => {
  const sizes = { knob: [0.03, 0.03], bar: [0.128, 0.012], cup: [0.086, 0.034], ring: [0.04, 0.05], tab: [0.025, 0.055], lip: [0.3, 0.026] };
  for (const [kind, entry] of Object.entries(HANDLE_KINDS)) {
    const [length, size] = sizes[kind] ?? [0.1, 0.03];
    const built = buildHandle({ kind, x: 0, y: 0, z: 0, axis: 'x', length, size }, { kind }, mat);
    assert.equal(trianglesOf(built), entry.tris, kind);
    assert.equal(entry.part, entry.tris > 0, kind);
  }
  const square = buildHandle({ kind: 'bar', x: 0, y: 0, z: 0, axis: 'x', length: 0.128 }, { kind: 'bar', barProfile: 'square' }, mat);
  assert.equal(trianglesOf(square), HANDLE_KINDS.bar.squareTris);
  assert.equal(handleTris('bar', { barProfile: 'square' }), 132);
  for (const kind of Object.keys(HANDLE_KINDS)) assert.ok(trianglesOf(buildHandle({ kind, x: 0, y: 0, z: 0, axis: 'x', length: 0.05, size: 0.03 }, { kind }, mat)) <= 150);
});

test('normalizeHandle fills defaults and maps size to the main dimension', () => {
  assert.equal(normalizeHandle({}).knobDiameter, HANDLE_DEFAULTS.knobDiameter);
  assert.equal(normalizeHandle({ kind: 'ring', size: 0.04 }).ringDiameter, 0.04);
  assert.equal(normalizeHandle({ kind: 'bar', size: 0.16 }).barLength, 0.16);
  assert.equal(normalizeHandle({ kind: 'tab', size: 0.06 }).tabLength, 0.06);
  assert.equal(normalizeHandle({ kind: 'bogus' }).kind, 'none');
  assert.equal(normalizeHandle({ kind: 'knob' }).projection, 0.026);
});

test('planHandles: one handle per drawer above the 2.2k handle budget', () => {
  const layout = solveFronts({ split: 'x', children: [{ leaf: 'drawers', count: 4 }, { leaf: 'drawers', count: 4 }] }, { x0: -0.8, x1: 0.8, y0: 0.1, y1: 0.9, z: 0.2 }, { maxDrawerW: 2 });
  const rich = planHandles(layout, { kind: 'ring' });
  assert.equal(rich.length, 16);
  const square = planHandles(layout, { kind: 'bar', barProfile: 'square' });
  assert.ok(square.length < 16 && square.length >= 8);
  assert.ok(square.reduce((s, slot) => s + handleTris(slot.kind, { barProfile: 'square' }), 0) <= 2200);
});

test('frontPanel: slab, cut-outs, grooves and framed / insert fronts', () => {
  const f = front('drawer', -0.3, 0.3, 0.4, 0.6);
  const slab = frontPanel(f, { thickness: 0.02, bevel: 0.003 }, { front: mat });
  const box = boxOf(slab);
  assert.ok(near(box.min.x, -0.3) && near(box.max.x, 0.3) && near(box.min.y, 0.4) && near(box.max.y, 0.6) && near(box.min.z, 0.18) && near(box.max.z, 0.2));
  assert.equal(trianglesOf(slab), 44);
  const slot = frontPanel(f, { thickness: 0.02, cut: { kind: 'slot', x: 0, y: 0.55, width: 0.1, height: 0.03 } }, { front: mat });
  assert.ok(trianglesOf(slot) > 44 && trianglesOf(slot) <= 220, `slot ${trianglesOf(slot)}`);
  const notch = frontPanel(f, { thickness: 0.02, cut: { kind: 'notch', x: 0, y: 0.585, width: 0.1, height: 0.03 } }, { front: mat });
  assert.ok(near(boxOf(notch).max.y, 0.6) && trianglesOf(notch) <= 220);
  const grooved = frontPanel(f, { thickness: 0.02, groove: 0.022 }, { front: mat });
  assert.ok(near(boxOf(grooved).max.y, 0.578));
  const side = frontPanel(f, { thickness: 0.02, groove: 0.022, grooveSide: 'right' }, { front: mat });
  assert.ok(near(boxOf(side).max.x, 0.278));
  const insert = new THREE.MeshBasicMaterial();
  const framed = frontPanel(front('door', -0.25, 0.25, 0.1, 0.7, { grain: 'y' }), { thickness: 0.02, style: 'insert', frameWidth: 0.06 }, { front: mat, insert });
  assert.equal(framed.children.length, 5);
  assert.equal(framed.children[4].material, insert);
  assert.ok(trianglesOf(framed) <= 240, `framed ${trianglesOf(framed)}`);
  const fb = boxOf(framed);
  assert.ok(near(fb.min.x, -0.25) && near(fb.max.y, 0.7) && near(fb.max.z, 0.2));
  for (const child of framed.children) assert.ok(child.geometry.attributes.grain || child.geometry.userData.grainAxis);
});

test('buildCarcass: sides, bottom and back, never a top; overlay and inset fields', () => {
  const overlay = buildCarcass({ width: 1.2, depth: 0.45, y0: 0.2, y1: 0.8, panel: 0.018, frontThickness: 0.02, edge: 0.002 }, mat);
  assert.equal(overlay.parts.length, 4);
  const group = new THREE.Group();
  group.add(...overlay.parts);
  const box = boxOf(group);
  assert.ok(near(box.min.x, -0.6) && near(box.max.x, 0.6) && near(box.min.y, 0.2) && near(box.max.y, 0.8));
  assert.ok(near(box.min.z, -0.225) && near(box.max.z, 0.225 - 0.02));
  assert.deepStrictEqual(overlay.field, { x0: -0.598, x1: 0.598, y0: 0.202, y1: 0.798, z: 0.225 });
  assert.ok(near(overlay.innerDepth, 0.44));
  const inset = buildCarcass({ width: 1.2, depth: 0.45, y0: 0.2, y1: 0.8, panel: 0.018, construction: 'inset', x: 0.3 }, mat);
  const ibox = boxOf(new THREE.Group().add(...inset.parts));
  assert.ok(near(ibox.max.z, 0.225));
  assert.ok(near(inset.field.x0, 0.3 - 0.6 + 0.018) && near(inset.field.y0, 0.218) && near(inset.field.y1, 0.8));
  const open = buildCarcass({ width: 1, depth: 0.4, y0: 0, y1: 0.5, panel: 0.02, sides: false, bottom: false, back: 0 }, mat);
  assert.equal(open.parts.length, 0);
});

test('buildFronts: fronts, handles, members, shelves and backers in one call', () => {
  const carcass = buildCarcass({ width: 1.6, depth: 0.45, y0: 0.2, y1: 0.78, panel: 0.018 }, mat);
  const plan = { split: 'x', symmetric: true, weights: [1, 0.9, 1], children: [{ leaf: 'doors' }, { leaf: 'open', shelves: 1 }, { leaf: 'drawers', count: 3 }] };
  const layout = solveFronts(plan, carcass.field);
  const hardware = new THREE.MeshBasicMaterial(), body = new THREE.MeshBasicMaterial();
  const parts = buildFronts(layout, { thickness: 0.02, fullDepth: carcass.innerDepth, opening: carcass.opening }, { kind: 'knob' }, { front: mat, hardware, carcass: body });
  const handles = parts.filter((p) => p.children.some((c) => c.material === hardware));
  assert.equal(handles.length, planHandles(layout, { kind: 'knob' }).length);
  const bodyParts = parts.filter((p) => p.material === body);
  assert.equal(bodyParts.length, layout.members.length + 1 + layout.closed.length);
  for (const backer of bodyParts.slice(-layout.closed.length)) {
    const b = boxOf(backer);
    assert.ok(near(b.max.z, layout.fronts[0].z0));
    assert.ok(b.min.x >= carcass.opening.x0 - 1e-6 && b.max.x <= carcass.opening.x1 + 1e-6);
  }
  const none = buildFronts(layout, { backers: false, members: false }, { kind: 'cutout' }, { front: mat });
  assert.equal(none.length, layout.fronts.length);
});
