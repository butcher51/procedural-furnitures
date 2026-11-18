import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKit } from '../../src/core/kit.js';
import { generateItem, groupApplies } from '../../src/core/item.js';
import { carcassSpec, faceField } from '../../src/furniture/cabinet/layout.js';
import { buildCarcass } from '../../src/core/fronts.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { STYLE_WEIGHTS, KIND_WEIGHTS } from '../../src/furniture/cabinet/params.js';
import { CABINET_TEMPLATES, TEMPLATE_WEIGHTS } from '../../src/furniture/cabinet/templates.js';
import * as registry from '../../src/furniture/registry.js';
import { meshesOf } from '../helpers/invariants.js';

const cabinet = registry.get('cabinet');
const gen = (n, rerolls = {}) => generateItem(cabinet, 'cabinet-test', n, rerolls);
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const all = SEEDS.map((n) => gen(n));
const STYLES = Object.keys(STYLE_WEIGHTS);
const KINDS = Object.keys(KIND_WEIGHTS);

test('cabinet is registered with plural, kinds and a non-square cell', () => {
  assert.equal(cabinet.plural, 'cabinets');
  assert.deepEqual(cabinet.cell, { spacing: 2.3, spacingZ: 1.5, gridSize: 9 });
  assert.deepEqual(cabinet.kinds, KIND_WEIGHTS);
  assert.equal(Math.round(Object.values(STYLE_WEIGHTS).reduce((a, b) => a + b, 0) * 100), 100);
});

test('same seed gives deep-equal params, same rerolls too', () => {
  for (const n of SEEDS.slice(0, 200)) {
    assert.deepEqual(gen(n), gen(n));
    assert.deepEqual(gen(n, { shape: 2, finish: 1, kind: 3 }), gen(n, { shape: 2, finish: 1, kind: 3 }));
  }
});

test('style and kind distributions are within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(STYLE_WEIGHTS)) {
    const share = all.filter((p) => p.style === style).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
  for (const [kind, weight] of Object.entries(KIND_WEIGHTS)) {
    const share = all.filter((p) => p.kind === kind).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${kind}: ${share} vs ${weight}`);
  }
  const dressers = all.filter((p) => p.kind === 'dresser');
  const low = dressers.filter((p) => p.form === 'lowDresser').length / dressers.length;
  assert.ok(Math.abs(low - 0.6) <= 0.04, `lowDresser share ${low}`);
});

test('template weights sum to one per form and style', () => {
  for (const [form, styles] of Object.entries(TEMPLATE_WEIGHTS)) {
    for (const [style, weights] of Object.entries(styles)) {
      assert.ok(Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-9, `${form}/${style}`);
      for (const id of Object.keys(weights)) assert.equal(CABINET_TEMPLATES[id].form, form);
    }
  }
});

test('every style and kind appears, and every template is reachable', () => {
  for (const style of STYLES) for (const kind of KINDS) assert.ok(all.some((p) => p.style === style && p.kind === kind), `${style}/${kind}`);
  const seen = new Set(all.map((p) => p.template));
  for (const [form, styles] of Object.entries(TEMPLATE_WEIGHTS)) {
    for (const id of Object.keys(styles.midcentury)) {
      const reachable = Object.values(styles).some((weights) => weights[id] > 0);
      assert.ok(!reachable || seen.has(id), `${form} template ${id} never rolled`);
    }
  }
});

test('params respect the spec ranges', () => {
  const inRange = (p, key, lo, hi) => assert.ok(p[key] >= lo - 1e-9 && p[key] <= hi + 1e-9, `${p.seed} ${p.style}/${p.form}: ${key} ${p[key]} not in [${lo}, ${hi}]`);
  const windows = {
    sideboard: [1.2, 1.95, 0.68, 0.9], lowDresser: [0.9, 1.6, 0.74, 0.95], tallChest: [0.7, 1.0, 1.05, 1.4], nightstand: [0.4, 0.6, 0.5, 0.68], tv: [1.2, 1.95, 0.4, 0.6],
  };
  for (const p of all) {
    for (const [key, value] of Object.entries(p)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${p.seed}: ${key}`);
    const [w0, w1, h0, h1] = windows[p.form];
    inRange(p, 'width', w0, w1);
    inRange(p, 'height', h0, h1);
    assert.ok(p.width + 2 * p.topOverhang <= 2.0 + 1e-9);
    assert.ok(p.depth <= 0.9 * p.width + 1e-9);
    inRange(p, 'depth', 0.3, 0.52);
    if (p.form === 'sideboard') assert.ok(p.width >= 1.6 * p.height - 1e-9);
    if (p.form === 'tv') assert.ok(p.width >= 2.5 * p.height - 1e-9);
    if (p.form === 'nightstand') assert.ok(p.width <= 0.6 + 1e-9);
    if (p.kind === 'dresser') assert.ok(['lowDresser', 'tallChest'].includes(p.form));
    else assert.equal(p.form, p.kind);
    inRange(p, 'legHeight', 0.05, 0.32);
    assert.ok(p.legHeight <= 0.4 * p.height + 1e-9);
    assert.ok(p.height - p.legHeight - p.topThickness >= { sideboard: 0.45, lowDresser: 0.55, tallChest: 0.85, nightstand: 0.26, tv: 0.24 }[p.form] - 1e-9);
    inRange(p, 'panel', 0.016, 0.028);
    inRange(p, 'topThickness', 0.016, 0.05);
    inRange(p, 'topOverhang', 0, 0.035);
    inRange(p, 'topEdge', 0.003, 0.008);
    if (p.style === 'modern') assert.equal(p.topOverhang, 0);
    if (p.style === 'shaker' && p.topOverhang > 0) inRange(p, 'topOverhang', 0.015, 0.035);
    if (p.baseKind === 'legs' || p.baseKind === 'frameLegs' || p.baseKind === 'hairpin') {
      assert.equal(p.legCount, p.width > 1.5 ? 6 : 4);
      assert.ok(p.legSplay <= p.legInsetX + 1e-9 && p.legSplay <= 0.2 * p.legHeight + 1e-9);
      assert.ok(p.legInsetX <= 0.15 * p.width + 1e-9);
      if (p.baseKind !== 'hairpin' && p.style !== 'midcentury') assert.equal(p.legSplay, 0);
    } else assert.equal(p.legCount, 0);
    if (p.form === 'tallChest') {
      assert.notEqual(p.baseKind, 'hairpin');
      if (p.baseKind === 'legs') assert.ok(p.legHeight <= 0.15 + 1e-9 && p.legInsetX <= 0.1 + 1e-9);
    }
    assert.ok(p.baseFinish !== 'white' && p.roles.base && !p.roles.base.startsWith('white'));
    assert.ok(new Set(Object.values(p.roles).filter(Boolean)).size <= 4);
    inRange(p, 'gap', 0.003, 0.008);
    inRange(p, 'frontBevel', 0.003, 0.005);
    inRange(p, 'frontThickness', 0.018, 0.022);
    if (p.construction === 'inset') inRange(p, 'reveal', 0.002, 0.003);
    assert.equal(p.woodName === null, p.grain === 'none');
    assert.equal(p.stoneName === null, p.topFinish !== 'stone');
    if (!p.hasFronts) assert.deepEqual([p.drawerHandle, p.doorHandle, p.knobDiameter], ['none', 'none', 0]);
  }
  assert.ok(all.some((p) => !p.hasFronts));
});

test('style signatures hold', () => {
  const mc = all.filter((p) => p.style === 'midcentury' && ['legs', 'frameLegs'].includes(p.baseKind));
  assert.ok(mc.filter((p) => p.legHeight >= 0.12).length / mc.length >= 0.8);
  for (const p of all.filter((q) => q.style === 'shaker' && q.topOverhang > 0)) assert.ok(p.topOverhang >= 0.015 - 1e-9);
  for (const p of all.filter((q) => q.style === 'industrial')) assert.ok(['metalFrame', 'hairpin', 'legs'].includes(p.baseKind));
  for (const p of all.filter((q) => q.style === 'modern' && q.baseKind === 'plinth')) assert.ok(p.plinthInset >= 0.035 - 1e-9);
});

test('params are plain JSON data', () => {
  for (const p of all.slice(0, 300)) assert.deepEqual(JSON.parse(JSON.stringify(p)), p);
});

test('face field matches buildCarcass', () => {
  const kit = createKit();
  for (const p of all.slice(0, 300)) {
    const spec = carcassSpec(p);
    const mat = kit.materials.solid('#808080');
    const carcass = buildCarcass({
      width: spec.width, depth: p.depth, y0: p.legHeight, y1: p.height - p.topThickness, panel: p.panel, sides: spec.sides,
      construction: p.construction, frontThickness: p.frontThickness, edge: p.edge,
    }, mat);
    const field = faceField(p);
    for (const key of ['x0', 'x1', 'y0', 'y1', 'z']) assert.ok(Math.abs(carcass.field[key] - field[key]) < 1e-9, `${p.seed}: field.${key}`);
    carcass.parts.forEach((part) => part.geometry.dispose());
  }
});

test('palette and hardware apply only where used', () => {
  const palette = cabinet.groups.find((g) => g.id === 'palette');
  const hardware = cabinet.groups.find((g) => g.id === 'hardware');
  for (const p of all.slice(0, 300)) {
    const painted = Object.values(p.roles).some((k) => k && k.startsWith('solid:'));
    assert.equal(palette.appliesTo(p), painted);
    assert.equal(groupApplies(cabinet, 'hardware', p), p.hasFronts);
    assert.equal(hardware.appliesTo(p), p.hasFronts);
  }
});

test('describe lists sections per group and swatches, Style and Kind both cycle', () => {
  const ids = new Set(cabinet.groups.map((g) => g.id));
  for (const p of all.slice(0, 400)) {
    const { sections, swatches } = cabinet.describe(p);
    assert.ok(swatches.length >= 1);
    for (const s of sections) {
      assert.ok(ids.has(s.group));
      assert.ok(s.rows.length > 0);
    }
    for (const id of ['style', 'kind', 'shape', 'base', 'fronts', 'finish']) assert.ok(sections.some((s) => s.group === id), `${p.seed}: no ${id} section`);
    assert.equal(sections.some((s) => s.group === 'hardware'), p.hasFronts);
    assert.equal(sections.some((s) => s.group === 'palette'), cabinet.groups.find((g) => g.id === 'palette').appliesTo(p));
  }
  for (const n of [1, 2, 3, 4, 5]) {
    const styles = new Set();
    const kinds = new Set();
    for (let k = 0; k <= 4; k++) {
      styles.add(gen(n, { style: k }).style);
      kinds.add(gen(n, { kind: k }).kind);
    }
    assert.equal(styles.size, 4);
    assert.equal(kinds.size, 4);
  }
});

test('a style re-roll keeps the kind and a kind re-roll keeps the style and colours', () => {
  for (const n of SEEDS.slice(0, 100)) {
    const base = gen(n);
    assert.equal(gen(n, { style: 1 }).kind, base.kind);
    const other = gen(n, { kind: 1 });
    assert.equal(other.style, base.style);
    assert.notEqual(other.kind, base.kind);
    assert.equal(other.paint, base.paint);
    assert.equal(other.accent, base.accent);
  }
});

test('surfaces describe the top and the open cells', () => {
  for (const p of all.slice(0, 200)) {
    const list = cabinet.surfaces(p);
    assert.equal(list[0].id, 'top');
    assert.ok(Math.abs(list[0].y - p.height) < 1e-9);
    for (const s of list) assert.ok(s.x1 > s.x0 && s.clear > 0 && s.zFront > s.zBack);
  }
});

test('every style and kind builds within the triangle and draw budgets', () => {
  const kit = createKit();
  const tris = [];
  for (const n of SEEDS.slice(0, 500)) {
    const p = gen(n);
    const object = mergeByMaterial(groupParts(cabinet.build(p, kit)));
    const meshes = meshesOf(object);
    const count = meshes.reduce((sum, m) => sum + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
    assert.ok(meshes.length <= 4, `${p.seed}: ${meshes.length} draws`);
    assert.ok(count <= 6000, `${p.seed}: ${count} tris`);
    tris.push(count);
    disposeObject(object);
  }
  tris.sort((a, b) => a - b);
  assert.ok(tris[Math.floor(tris.length * 0.95)] <= 4500, `p95 ${tris[Math.floor(tris.length * 0.95)]}`);
});

test('every style x kind builds a valid mesh', () => {
  const kit = createKit();
  const seen = new Set();
  for (const p of all) {
    const key = `${p.style}/${p.form}/${p.baseKind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const object = mergeByMaterial(groupParts(cabinet.build(p, kit)));
    assert.ok(meshesOf(object).length >= 1);
    disposeObject(object);
  }
  assert.ok(seen.size >= 40);
});
