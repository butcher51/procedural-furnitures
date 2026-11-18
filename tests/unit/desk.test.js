import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKit } from '../../src/core/kit.js';
import { generateItem } from '../../src/core/item.js';
import { buildCarcass } from '../../src/core/fronts.js';
import { disposeObject, groupParts, mergeByMaterial } from '../../src/core/merge.js';
import { STYLE_WEIGHTS } from '../../src/furniture/desk/params.js';
import { carcassSpec, frontRegions, kneeSpan, propZones } from '../../src/furniture/desk/layout.js';
import * as registry from '../../src/furniture/registry.js';
import { meshesOf } from '../helpers/invariants.js';

const desk = registry.get('desk');
const gen = (n, rerolls = {}) => generateItem(desk, 'desk-test', n, rerolls);
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);
const all = SEEDS.map((n) => gen(n));

const inRange = (p, key, lo, hi) => assert.ok(p[key] >= lo - 1e-9 && p[key] <= hi + 1e-9, `${p.seed} ${p.style}: ${key} ${p[key]} not in [${lo}, ${hi}]`);

test('desk is registered with plural, surfaces and a non-square cell', () => {
  assert.equal(desk.plural, 'desks');
  assert.deepEqual(desk.cell, { spacing: 2.1, spacingZ: 1.6, gridSize: 9 });
  assert.equal(typeof desk.surfaces, 'function');
});

test('same seed gives deep-equal params, same rerolls too', () => {
  for (const n of SEEDS.slice(0, 200)) {
    assert.deepEqual(gen(n), gen(n));
    assert.deepEqual(gen(n, { top: 2, finish: 1, props: 3 }), gen(n, { top: 2, finish: 1, props: 3 }));
  }
});

test('style distribution is within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(STYLE_WEIGHTS)) {
    const share = all.filter((p) => p.style === style).length / all.length;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
  }
});

test('top, base and support params respect the spec ranges', () => {
  const widths = { writing: [0.9, 1.3], pedestal: [1.1, 1.8], trestle: [1.2, 1.8], standing: [1.0, 1.6], panel: [1.0, 1.6] };
  const depths = { writing: [0.5, 0.65], pedestal: [0.65, 0.8], trestle: [0.62, 0.75], standing: [0.6, 0.8], panel: [0.55, 0.75] };
  const thick = { writing: [0.018, 0.028], pedestal: [0.025, 0.04], trestle: [0.035, 0.05], standing: [0.022, 0.03], panel: [0.03, 0.05] };
  for (const p of all) {
    for (const [key, value] of Object.entries(p)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${p.seed}: ${key}`);
    inRange(p, 'topWidth', ...widths[p.style]);
    inRange(p, 'topDepth', ...depths[p.style]);
    inRange(p, 'topThickness', ...thick[p.style]);
    inRange(p, 'topEdge', 0.003, 0.012);
    assert.ok(p.topDepth <= 0.6 * p.topWidth + 1e-9);
    assert.ok(Math.abs(p.legHeight - (p.topHeight - p.topThickness)) < 1e-9);
    if (p.heightMode === 'stand') inRange(p, 'topHeight', 1.0, 1.18);
    else inRange(p, 'topHeight', 0.72, 0.76);
    assert.ok(p.heightMode === 'sit' || p.style === 'standing');
    assert.ok(p.kneeWidth >= 0.62 - 1e-9, `${p.seed}: knee ${p.kneeWidth}`);
    const [k0, k1] = kneeSpan(p);
    assert.ok(Math.abs(p.kneeWidth - (k1 - k0)) < 1e-9 && Math.abs(p.kneeCenterX - (k0 + k1) / 2) < 1e-9);
    assert.ok(p.topWidth <= 1.8);
    if (p.topAddon === 'rail') { inRange(p, 'addonHeight', 0.04, 0.08); inRange(p, 'addonDepth', 0.018, 0.022); }
    if (p.topAddon === 'riser') { inRange(p, 'addonHeight', 0.09, 0.15); assert.ok(p.addonDepth <= 0.4 * p.topDepth + 1e-9 && p.addonDepth >= 0.2 - 1e-9); }
    if (p.topAddon === 'none') assert.deepEqual([p.addonHeight, p.addonDepth], [0, 0]);
    assert.ok(p.style === 'writing' || p.style === 'pedestal' || !p.inlay);
    if (p.style === 'writing') {
      assert.equal(p.supportKind, 'legs');
      assert.equal(p.legCount, 4);
      assert.equal(p.pedestalLayout, 'none');
      assert.ok(p.legHeight - p.apronHeight >= 0.61 - 1e-9);
      assert.ok(p.topAddon !== 'rail' || p.topExponent === 10);
    }
    if (p.legProfile === 'splayed') assert.ok(p.legSplay <= 0.1 * p.legHeight + 1e-9 && p.legSplay <= p.overhang + 0.7 * p.legThickness + 1e-9);
    if (p.legProfile === 'turned') assert.equal(p.legSides, 8);
    if (p.stretcher !== 'none') assert.equal(p.stretcher, 'ends');
    if (p.style === 'pedestal') {
      assert.ok(['double', 'single', 'hung'].includes(p.pedestalLayout));
      assert.equal(p.legCount, p.pedestalLayout === 'hung' ? 4 : 0);
      if (p.pedestalLayout === 'double') assert.ok(p.topWidth >= 2 * p.pedestalWidth + 0.62 + 2 * p.pedestalOverhang - 1e-9);
      if (p.pedestalLayout === 'hung') assert.ok(p.legHeight - p.pedestalHeight >= 0.3 - 1e-9);
      if (p.pedestalLayout !== 'hung') assert.ok(p.pedestalWidth >= 0.3 - 1e-9);
    }
    if (p.style === 'trestle') {
      assert.equal(p.supportKind, 'trestle');
      assert.equal(p.legCount, 0);
      inRange(p, 'trestleInset', 0.12, 0.3);
      assert.ok(p.trestleInset <= 0.18 * p.topWidth + 1e-9);
      assert.ok(p.footLength <= 0.92 * p.topDepth + 1e-9 && p.footLength >= 0.8 * p.topDepth - 1e-9);
      assert.ok(p.trestleKind === 'X' || p.trestleStretcherHeight + p.beamWidth / 2 <= 0.22);
    }
    if (p.style === 'standing') {
      assert.equal(p.supportKind, 'tframe');
      assert.ok(p.frameFootLength >= Math.max(0.85 * p.topDepth, 0.58) - 1e-9 || p.frameFootLength === p.topDepth - 0.02);
      assert.ok(p.frameFootLength <= p.topDepth - 0.02 + 1e-9);
      inRange(p, 'columnZ', -0.06, 0);
      inRange(p, 'frameInset', 0.1, 0.22);
    }
    if (p.style === 'panel') {
      assert.equal(p.supportKind, 'panels');
      if (p.waterfall) assert.ok(p.panelThickness === p.topThickness && p.panelInset === 0 && p.bodyMode === 'top');
      else assert.ok(p.panelDepth >= 0.92 - 1e-9);
    }
  }
});

test('drawer fronts fit: every front is at least 8 x 18 cm and apron fronts avoid the legs', () => {
  let drawers = 0;
  for (const p of all.slice(0, 500)) {
    assert.equal(desk.groups.find((g) => g.id === 'fronts').appliesTo(p), p.style === 'writing' || p.pedestalLayout !== 'none');
    const regions = frontRegions(p);
    let counted = 0;
    for (const region of regions) {
      for (const f of region.layout.fronts) {
        const h = f.y1 - f.y0;
        const w = f.x1 - f.x0;
        assert.ok(h >= 0.05 - 1e-6 && w >= 0.18 - 1e-6, `${p.seed} ${region.id}: front ${w.toFixed(3)} x ${h.toFixed(3)}`);
        assert.ok(f.z1 > f.z0);
        if (f.kind === 'drawer') counted++;
      }
      assert.notEqual(region.layout.stats.degraded, 'fallback', `${p.seed} ${region.id}: solver fell back`);
    }
    assert.equal(p.drawerCount, counted);
    drawers += counted;
    if (p.style === 'standing') assert.equal(regions.length, 0);
    if (p.style === 'writing' && p.apronDrawers > 0) {
      const apron = regions.find((r) => r.id === 'apron');
      assert.equal(apron.layout.fronts.length, p.apronDrawers);
      const [k0, k1] = kneeSpan(p);
      assert.ok(apron.layout.fronts.every((f) => f.x0 >= k0 - 1e-9 && f.x1 <= k1 + 1e-9));
    }
    if (p.pedestalLayout === 'double') assert.equal(regions.filter((r) => r.id.startsWith('pedestal')).length, 2);
    if (p.centreDrawer) assert.ok(p.legHeight - p.centreDrawerHeight >= 0.61 - 1e-9);
  }
  assert.ok(drawers > 500);
});

test('the pedestal fields equal the core carcass field', () => {
  let checked = 0;
  for (const p of all.slice(0, 400)) {
    for (const region of frontRegions(p)) {
      if (!region.carcass) continue;
      const spec = region.carcass;
      const built = buildCarcass(spec, null);
      assert.deepEqual(region.opening, built.opening);
      assert.equal(region.layout.face, built.field.z);
      for (const f of region.layout.fronts) {
        assert.ok(f.x0 >= built.field.x0 - 1e-9 && f.x1 <= built.field.x1 + 1e-9 && f.y0 >= built.field.y0 - 1e-9 && f.y1 <= built.field.y1 + 1e-9);
      }
      checked++;
    }
  }
  assert.ok(checked > 100);
  assert.deepEqual(Object.keys(carcassSpec(all.find((p) => p.pedestalLayout === 'double'), 'floor', 0)).sort(), ['construction', 'depth', 'frontThickness', 'panel', 'width', 'x', 'y0', 'y1']);
});

test('palette, fronts and props apply only where there is something to roll', () => {
  const palette = desk.groups.find((g) => g.id === 'palette');
  const props = desk.groups.find((g) => g.id === 'props');
  for (const p of all.slice(0, 400)) {
    assert.equal(palette.appliesTo(p), p.topFinish === 'painted' || p.bodyMode === 'painted' || p.inlay);
    assert.equal(props.appliesTo(p), p.clutter);
    if (!p.clutter) assert.deepEqual([p.propSet, p.bookCount, p.laptopColor, p.cupColor], ['none', 0, null, null]);
  }
});

test('colour rules: painted tops and bodies differ, white bodies read against the top', () => {
  for (const p of all) {
    assert.equal(p.woodName === null, !(p.topFinish === 'wood' || p.bodyMode === 'wood'));
    assert.equal(p.grain === 'none', p.woodName === null);
    if (p.topFinish === 'painted' && p.bodyMode === 'painted') assert.notEqual(p.topColor, p.bodyColor);
    if (p.bodyMode === 'top') assert.equal(p.bodyColor, p.topColor);
    if (p.frontMode !== 'none') assert.ok(p.drawerCount > 0);
    if (p.hardwareMode !== 'none') assert.ok(p.hardwareColor);
  }
  const white = all.filter((p) => p.style === 'standing' && p.bodyMode === 'white').length / all.filter((p) => p.style === 'standing').length;
  assert.ok(white <= 0.26, `white standing share ${white}`);
});

test('props sit in zones inside the top and never overlap', () => {
  let laptops = 0;
  for (const p of all.slice(0, 600)) {
    const zones = propZones(p);
    if (!p.clutter) assert.deepEqual(zones, []);
    for (const z of zones) {
      assert.ok(z.x0 >= -p.topWidth / 2 + 0.03 - 1e-9 && z.x1 <= p.topWidth / 2 - 0.03 + 1e-9, `${p.seed} ${z.id} x`);
      assert.ok(z.zBack >= -p.topDepth / 2 + 0.03 - 1e-9 && z.zFront <= p.topDepth / 2 - 0.03 + 1e-9, `${p.seed} ${z.id} z`);
      if (z.id === 'laptop') laptops++;
    }
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const a = zones[i];
        const b = zones[j];
        const disjoint = a.x1 <= b.x0 || b.x1 <= a.x0 || a.zFront <= b.zBack || b.zFront <= a.zBack || a.y !== b.y;
        assert.ok(disjoint, `${p.seed}: ${a.id} overlaps ${b.id}`);
      }
    }
  }
  assert.ok(laptops > 30);
});

test('describe lists sections per group and swatches', () => {
  const ids = new Set(desk.groups.map((g) => g.id));
  for (const p of all.slice(0, 400)) {
    const { sections, swatches } = desk.describe(p);
    assert.ok(swatches.length >= 2);
    for (const s of sections) {
      assert.ok(ids.has(s.group));
      assert.ok(s.rows.length > 0);
      for (const [label, value] of s.rows) assert.ok(label && (typeof value === 'string' ? value.length > 0 : value.swatches.length > 0), `${p.seed}: ${label}`);
    }
    for (const id of ['style', 'top', 'base', 'finish']) assert.ok(sections.some((s) => s.group === id), `${p.seed}: no ${id} section`);
    for (const group of desk.groups.filter((g) => g.appliesTo)) assert.equal(sections.some((s) => s.group === group.id), group.appliesTo(p), `${p.seed}: ${group.id}`);
    const rows = Object.fromEntries(sections.flatMap((s) => s.rows));
    assert.match(rows.Size, /^\d+ × \d+ cm$/);
    assert.match(rows['Knee space'], /^\d+ cm$/);
    if (p.heightMode === 'stand') assert.match(rows.Height, /standing/);
    if (p.style === 'trestle') assert.ok(rows.Footrest);
    if (p.drawerCount > 0) assert.match(rows.Drawers, /^\d/);
  }
});

test('every style builds within the triangle and draw budgets, props and fronts included', () => {
  const kit = createKit();
  const tris = [];
  const perStyle = {};
  for (const n of SEEDS.slice(0, 500)) {
    const p = gen(n);
    const object = mergeByMaterial(groupParts(desk.build(p, kit)));
    const meshes = meshesOf(object);
    const count = meshes.reduce((sum, m) => sum + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
    assert.ok(meshes.length <= 4, `${p.seed}: ${meshes.length} draws`);
    assert.ok(count <= 6000, `${p.seed}: ${count} tris`);
    const decor = meshes.filter((m) => m.material.userData.role === 'decor');
    assert.ok(decor.length <= 1);
    tris.push(count);
    (perStyle[p.style] ??= []).push(count);
    disposeObject(object);
  }
  tris.sort((a, b) => a - b);
  assert.ok(tris[Math.floor(tris.length * 0.95)] <= 4500, `p95 ${tris[Math.floor(tris.length * 0.95)]}`);
  assert.deepEqual(Object.keys(perStyle).sort(), Object.keys(STYLE_WEIGHTS).sort());
});

test('decor role carries the inlay and props, wood parts carry grain', () => {
  const kit = createKit();
  let inlays = 0;
  let woods = 0;
  for (const p of all.slice(0, 300)) {
    const object = mergeByMaterial(groupParts(desk.build(p, kit)));
    const meshes = meshesOf(object);
    const decor = meshes.filter((m) => m.material.vertexColors);
    const wanted = p.inlay || propZones(p).length > 0;
    assert.equal(decor.length, wanted ? 1 : 0, `${p.seed}: decor meshes`);
    if (p.inlay) inlays++;
    if (p.topFinish === 'wood') {
      woods++;
      assert.ok(meshes.some((m) => m.material.userData.pattern?.kind === 'wood' && m.geometry.attributes.grain));
    }
    disposeObject(object);
  }
  assert.ok(inlays > 10 && woods > 100);
});

test('desk reads as a desk: depth, and a drawer, modesty panel, addon or raised top in most seeds', () => {
  const cues = all.filter((p) => p.drawerCount > 0 || p.modestyPanel || p.topAddon !== 'none' || p.heightMode === 'stand' || p.trestleBackRail || p.style === 'panel' || p.style === 'standing');
  assert.ok(cues.length / all.length >= 0.7, `${cues.length / all.length}`);
  for (const p of all) assert.ok(p.topDepth <= 0.8 + 1e-9);
});
