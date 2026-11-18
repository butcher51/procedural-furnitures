import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { generateItem } from '../../src/core/item.js';
import { createKit } from '../../src/core/kit.js';
import { groupParts, mergeByMaterial, disposeObject } from '../../src/core/merge.js';
import bed from '../../src/furniture/bed/index.js';
import { archTopShape, buildLadder, scallopShape } from '../../src/furniture/bed/build.js';
import { planPillows } from '../../src/furniture/bed/layout.js';
import { bedPillowPlan } from '../../src/furniture/bed/params.js';
import { hexToHsl } from '../../src/core/palette.js';
import { worstClearance } from '../helpers/sheet-clearance.js';

const SEEDS = 2000;
const items = Array.from({ length: SEEDS }, (_, i) => generateItem(bed, 'bed-unit', i + 1));
const within = (v, lo, hi) => v >= lo - 1e-9 && v <= hi + 1e-9;
const byStyle = (style) => items.filter((p) => p.style === style);

test('bed: same seed gives deep-equal params and JSON-safe data', () => {
  for (let n = 1; n <= 50; n++) {
    const a = generateItem(bed, 'bed-det', n);
    assert.deepStrictEqual(a, generateItem(bed, 'bed-det', n));
    assert.deepStrictEqual(a, JSON.parse(JSON.stringify(a)));
    const rerolls = { frame: 2, bedding: 1, size: 1 };
    assert.deepStrictEqual(generateItem(bed, 'bed-det', n, rerolls), generateItem(bed, 'bed-det', n, { ...rerolls }));
  }
});

test('bed: definition metadata', () => {
  assert.equal(bed.plural, 'beds');
  assert.equal(bed.mixWeight, 0.5);
  assert.deepStrictEqual(bed.cell, { spacing: 2.6, gridSize: 9 });
  assert.deepStrictEqual(bed.groups.map((g) => g.id), ['style', 'size', 'frame', 'bedding', 'palette', 'pattern', 'finish']);
});

test('bed: style distribution is within 4 pp of the weights', () => {
  for (const [style, weight] of Object.entries(bed.styles)) {
    const share = byStyle(style).length / SEEDS;
    assert.ok(Math.abs(share - weight) <= 0.04, `${style}: ${share} vs ${weight}`);
    assert.ok(byStyle(style).length > 0, style);
  }
});

test('bed: every param is owned by exactly one group', () => {
  const owned = new Set(bed.groups.flatMap((g) => g.fields));
  const sample = items.slice(0, 300);
  for (const p of sample) {
    for (const key of Object.keys(p)) assert.ok(key === 'seed' || key === 'type' || owned.has(key), `unowned field ${key}`);
    for (const field of owned) assert.ok(field in p, `missing field ${field}`);
  }
});

const TOP = { platform: [0.3, 0.44], slatted: [0.45, 0.58], upholstered: [0.5, 0.62], fourPoster: [0.55, 0.7], bunk: [0.32, 0.42] };

test('bed: size params stay in the spec ranges', () => {
  for (const p of items) {
    assert.ok([0.9, 1.4, 1.6, 1.8].includes(p.mattressWidth), `${p.seed} width`);
    if (p.style === 'bunk') assert.equal(p.mattressWidth, 0.9);
    if (p.style === 'platform' || p.style === 'upholstered' || p.style === 'fourPoster') assert.ok(p.mattressWidth >= 1.4);
    assert.equal(p.mattressLength, 2);
    assert.ok(within(p.mattressThickness, p.style === 'bunk' ? 0.12 : 0.16, p.style === 'bunk' ? 0.16 : 0.26));
    const [lo, hi] = TOP[p.style];
    assert.ok(p.mattressTop >= lo - 1e-9 && p.mattressTop >= p.mattressThickness + (p.style === 'platform' ? 0.12 : 0.18) - 1e-9, `${p.seed} top`);
    assert.ok(p.mattressTop <= Math.max(hi, p.mattressThickness + 0.18) + 1e-9);
    assert.ok(Math.abs(p.deckY - (p.mattressTop - p.mattressThickness)) < 1e-9);
    assert.ok(within(p.clearance, 0.01, 0.02) && within(p.mattressRadius, 0.025, 0.05));
  }
});

test('bed: frame clamps hold', () => {
  for (const p of items) {
    assert.ok(p.frameWidth <= 2.35 + 1e-9, `${p.seed} frameWidth ${p.frameWidth}`);
    assert.ok(p.frameLength <= 2.38 + 1e-9, `${p.seed} frameLength ${p.frameLength}`);
    if (p.style === 'platform') {
      assert.equal(p.footKind, 'none');
      assert.ok(within(p.ledge, 0.03, 0.15));
      assert.ok(p.mattressWidth + 2 * p.ledge <= 2.15 + 1e-9);
      assert.ok(p.slabThickness >= 0.06 - 1e-9);
      assert.ok(Math.abs(p.deckY - p.slabThickness - (p.support === 'legs' ? p.legHeight : p.plinthHeight)) < 1e-9);
      if (p.support === 'legs') assert.ok([4, 6].includes(p.legCount));
      else assert.equal(p.legCount, 0);
      if (p.headKind !== 'none') assert.ok(p.headHeight >= p.mattressTop + 0.18 - 1e-9 && p.headHeight <= p.mattressTop + 0.45 + 1e-9);
      if (p.headKind === 'wide') assert.ok(p.shelfWidth >= 0.28 && p.mattressWidth + 2 * p.ledge + 2 * p.shelfWidth <= 2.3 + 1e-9);
    }
    if (p.style === 'slatted') {
      assert.ok(within(p.headHeight, 0.85, 1.05));
      assert.ok(p.railRise <= p.mattressThickness - 0.1 + 1e-9);
      if (p.headKind === 'vertical') assert.ok(p.headSlatCount >= 5 && p.headSlatCount <= 14 && p.headSlatWidth <= 0.5 * ((p.mattressWidth + 2 * p.clearance) / p.headSlatCount) + 1e-9);
      if (p.headKind === 'horizontal') assert.ok(p.headSlatCount >= 2 && p.headSlatCount <= 4);
    }
    if (p.style === 'upholstered') {
      assert.ok(within(p.headHeight, 1.1, 1.4));
      assert.ok(p.mattressWidth + 2 * p.clearance + 2 * p.railThickness + 2 * p.headOverhang <= 2.3 + 1e-9);
      if (p.headKind === 'wingback') assert.ok(p.wingThickness <= p.railThickness + p.headOverhang + 1e-9);
      if (p.headKind === 'channel') assert.ok(p.channelCount >= 3 && p.channelCount <= 7);
      if (p.headKind === 'arch') assert.ok(p.archRise <= 0.4 * (p.headHeight - p.mattressTop) + 1e-9);
    }
    if (p.style === 'fourPoster') {
      assert.ok(p.postHeight + p.finial <= 2.2 + 1e-9);
      assert.ok(p.postHeight >= p.headHeight + 0.45 - 1e-9);
      assert.ok(p.deckY + p.railRise - p.railHeight >= 0.18 - 1e-9, `${p.seed} rail bottom`);
      assert.equal(p.canopy, p.finial === 0);
    }
    if (p.style === 'bunk') {
      assert.ok(p.postHeight <= 1.8 + 1e-9, `${p.seed} bunk height ${p.postHeight}`);
      assert.ok(p.bunkClearance >= 0.78 - 1e-9);
      assert.ok(p.guardTop - p.upperMattressTop >= 0.16 - 1e-9);
      assert.ok(p.ladderKind === 'side' ? p.ladderWidth + 0.04 <= 0.44 + 1e-9 : true);
      assert.ok(p.deckY + p.railRise - p.railHeight >= 0.06 - 1e-9);
      assert.ok(p.rungCount >= 3 && p.rungCount <= 7, `${p.seed} rungs ${p.rungCount}`);
      assert.ok(p.ladderLean <= 0.2 + 1e-9);
    }
  }
});

test('bed: bedding clamps and fallbacks hold', () => {
  for (const p of items) {
    const n = p.pillowCount;
    assert.ok(p.pillowWidth <= (p.mattressWidth - 0.04 - (n - 1) * 0.01) / n + 1e-9, `${p.seed} pillowWidth`);
    if (p.euroCount > 0) assert.ok(p.euroSize <= (p.mattressWidth - 0.04 - (p.euroCount - 1) * 0.01) / p.euroCount + 1e-9);
    assert.deepStrictEqual([p.pillowCount, p.euroCount], { single: [1, 0], singleLean: [1, 0], euroSingle: [1, 1], pair: [2, 0], pairLean: [2, 0], euroStack: [2, 2] }[p.pillowArrangement]);
    const plan = bedPillowPlan(p);
    assert.ok(plan.ok, `${p.seed} lean headroom`);
    assert.ok(plan.zoneEnd <= p.clearance + 0.85 + 1e-9, `${p.seed} zone ${plan.zoneEnd}`);
    if (p.style === 'bunk') {
      assert.equal(p.pillowArrangement, 'single');
      assert.equal(p.duvetFit, 'tuck');
      assert.equal(p.decoKind, 'none');
      assert.equal(p.duvetRes, 'low');
      assert.equal(p.mattressSegments, 2);
    }
    if (p.footFit === 'drape') assert.equal(p.duvetFit, 'drape');
    if (['fourPoster', 'bunk'].includes(p.style)) assert.equal(p.footFit, 'tuck');
    if (p.style === 'slatted' && p.footKind !== 'none') assert.equal(p.footFit, 'tuck');
    assert.ok(p.drapeFloor >= 0.05 - 1e-9);
    if (p.duvetFit === 'drape') {
      assert.ok(p.sideDrop <= p.mattressTop - p.drapeFloor - 0.01 + 1e-9, `${p.seed} sideDrop`);
      assert.ok(p.sideDrop >= 0.08);
      assert.ok(p.cornerSag + p.sideDrop <= p.mattressTop - p.drapeFloor - 0.01 + 1e-9);
      assert.ok(p.throwExtraDrop + p.sideDrop + p.cornerSag <= p.mattressTop - p.drapeFloor - 0.01 + 1e-9, `${p.seed} throw drop`);
    } else assert.equal(p.sideDrop, 0);
    assert.equal(p.footDrop, p.footFit === 'drape' ? p.sideDrop : 0);
    if (p.foldDepth > 0) assert.ok(p.foldRoll >= p.duvetThickness - 1e-9 && ['duvet', 'sheet'].includes(p.foldMaterial));
    else assert.equal(p.foldMaterial, null);
    assert.ok(p.wrinkle >= 0 && p.wrinkle <= 0.008 + 1e-9);
    assert.ok(2 * p.foldRoll + p.hemFlare + p.wrinkle <= 0.26 + 1e-9);
  }
});

test('bed: every colour comes from a picker and the accent role is only used when needed', () => {
  for (const p of items.slice(0, 200)) {
    assert.match(p.beddingColor, /^#[0-9a-f]{6}$/);
    assert.match(p.accent, /^#[0-9a-f]{6}$/);
    assert.match(p.upholsteryColor, /^#[0-9a-f]{6}$/);
    if (p.style === 'upholstered') {
      assert.equal(p.frameColor, null);
      assert.equal(p.frameMode, 'none');
    } else {
      assert.notEqual(p.frameColor, null);
      if (p.style === 'platform') assert.notEqual(p.frameMode, 'white');
    }
  }
});

test('bed: describe lists a row per group with swatches', () => {
  for (const p of items.slice(0, 200)) {
    const d = bed.describe(p);
    assert.deepStrictEqual(d.sections.map((s) => s.group), bed.groups.map((g) => g.id));
    for (const section of d.sections) assert.ok(section.rows.length > 0);
    assert.ok(d.swatches.length >= 1);
  }
});

test('bed: triangle and draw-call budgets over 500 seeds, bunk stays under 1.80 m', () => {
  const kit = createKit();
  const worst = {};
  for (let n = 1; n <= 500; n++) {
    const p = generateItem(bed, 'bed-budget', n);
    const object = mergeByMaterial(groupParts(bed.build(p, kit)));
    let count = 0;
    let draws = 0;
    object.traverse((o) => {
      if (o.isMesh) {
        draws++;
        count += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      }
    });
    assert.ok(draws <= 4, `${p.seed} draws ${draws}`);
    assert.ok(count <= 6000, `${p.seed} tris ${count}`);
    worst[p.style] = Math.max(worst[p.style] ?? 0, count);
    if (p.style === 'bunk') assert.ok(new THREE.Box3().setFromObject(object).max.y <= 1.8 + 1e-3);
    disposeObject(object);
  }
  assert.ok(Object.values(worst).every((v) => v <= 5600), JSON.stringify(worst));
});

test('bed: runner clears the duvet by ≥ 1 mm, accent stays near the duvet hue', () => {
  const kit = createKit();
  const runners = items.filter((p) => p.throwKind === 'runner').slice(0, 40);
  assert.ok(runners.some((p) => p.duvetFit === 'tuck') && runners.some((p) => p.footFit === 'drape'));
  for (const p of runners) {
    const parts = bed.build(p, kit);
    const duvet = parts.find((o) => o.name === 'duvet');
    const runner = parts.find((o) => o.name === 'throw');
    const cols = p.duvetRes === 'full' ? 16 : 12;
    const worst = worstClearance(duvet.geometry, cols, runner.geometry);
    assert.ok(worst >= 0.001, `${p.seed}: runner ${worst.toFixed(4)} m from the duvet`);
  }
  for (const p of items.slice(0, 500)) {
    const d = Math.abs(((hexToHsl(p.accent).h - hexToHsl(p.duvetColor).h + 1.5) % 1) - 0.5);
    const s = Math.min(hexToHsl(p.accent).s, hexToHsl(p.duvetColor).s);
    assert.ok(d <= 0.12 || s < 0.06, `${p.seed}: accent hue ${d.toFixed(3)} from the duvet`);
  }
});

test('bed: build is deterministic', () => {
  const kit = createKit();
  for (let n = 1; n <= 25; n++) {
    const p = generateItem(bed, 'bed-build', n);
    const sums = [0, 1].map(() => {
      const object = mergeByMaterial(groupParts(bed.build(p, kit)));
      let sum = 0;
      object.traverse((o) => {
        if (o.isMesh) for (const v of o.geometry.attributes.position.array) sum += v;
      });
      return sum;
    });
    assert.equal(sums[0], sums[1]);
  }
});

test('bed: pillow planner rests every pillow on the mattress and keeps leaning rows below the headboard', () => {
  const base = {
    W: 1.6, cl: 0.015, top: 0.5, headRise: 0.7, pillowWidth: 0.7, pillowLength: 0.5, pillowThickness: 0.13, pillowPinch: 0.5, pillowLean: 24,
    euroSize: 0.65, euroThickness: 0.17, euroLean: 14, decoWidth: 0.45, decoHeight: 0.3, decoThickness: 0.12, decoLean: 32,
  };
  for (const arrangement of ['pair', 'pairLean', 'euroStack']) {
    for (const decoKind of ['none', 'lumbar']) {
      const plan = planPillows({ ...base, arrangement, decoKind });
      assert.ok(plan.ok);
      for (const item of plan.items) {
        assert.ok(item.minZ >= 0.003 - 1e-9);
        assert.ok(Math.abs(item.x) + item.w / 2 <= base.W / 2 + 1e-9);
      }
    }
  }
  assert.equal(planPillows({ ...base, headRise: 0.3, arrangement: 'pairLean', decoKind: 'none' }).ok, false);
  assert.equal(planPillows({ ...base, headRise: 0, arrangement: 'euroStack', decoKind: 'none' }).ok, false);
});

test('bed: local shapes and ladder have the extents they promise', () => {
  const arch = archTopShape(1.6, 1.2, 0.2).getPoints();
  const abox = new THREE.Box2().setFromPoints(arch);
  assert.ok(Math.abs(abox.min.y) < 1e-9 && Math.abs(abox.max.y - 1.2) < 1e-6 && Math.abs(abox.max.x - 0.8) < 1e-9);
  const scallop = scallopShape(1.5, 0.08, 5, 0.03).getPoints();
  const sbox = new THREE.Box2().setFromPoints(scallop);
  assert.ok(Math.abs(sbox.max.x - 0.75) < 1e-9 && Math.abs(sbox.min.y + 0.11) < 1e-6 && Math.abs(sbox.max.y) < 1e-9);
  const ladder = buildLadder({ top: 1.4, width: 0.36, stileWidth: 0.035, stileDepth: 0.03, rungCount: 5, rungTop: 1.2, rungProfile: 'flat', lean: 0.15 }, undefined);
  const box = new THREE.Box3().setFromObject(ladder, true);
  assert.ok(box.min.y >= -0.02 && box.min.y <= 0 && Math.abs(box.max.y - 1.4) <= 0.02);
  assert.ok(box.max.x <= 0.15 + 0.02 && box.min.x >= -0.02);
  assert.equal(ladder.children.length, 2 + 5);
});
