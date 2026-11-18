import * as THREE from 'three';
import { buildItem, generateItem } from '../core/item.js';
import { disposeObject } from '../core/merge.js';
import { packRows, verticalNeighbor } from './layout.js';

const RING_DELAY = 100;
const POP_DURATION = 450;
const FRAME_BUDGET = 30;
const PACK_GAP = 0.3;
const MARKER_BASE = 0.65;
const MARKER_PAD = 0.14;
const MIXED_REVEAL = 1200;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function easeOutBack(t, overshoot = 2.2) {
  const u = t - 1;
  return 1 + (overshoot + 1) * u * u * u + overshoot * u * u;
}

export function rollKey(rolls) {
  return Object.entries(rolls ?? {})
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, count]) => `${group}${count}`)
    .join('.');
}

function measure(object) {
  object.position.set(0, 0, 0);
  object.scale.setScalar(1);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return { w: 0.5, d: 0.5, cx: 0, cz: 0 };
  return { w: box.max.x - box.min.x, d: box.max.z - box.min.z, cx: (box.max.x + box.min.x) / 2, cz: (box.max.z + box.min.z) / 2 };
}

export function createShowroom({ scene, kit, onProgress }) {
  let items = [];
  let generation = 0;
  let animate = true;
  let overlays = true;
  let markerWanted = false;
  let mixed = false;
  let packed = { rows: [], positions: [], width: 0, depth: 0 };

  const group = new THREE.Group();
  scene.add(group);

  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#2b2a28', transparent: true, opacity: 0.55 });
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.68, 40), markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.003;
  marker.visible = false;
  group.add(marker);

  const dotGeometry = new THREE.CircleGeometry(0.035, 16);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: '#2b2a28', transparent: true, opacity: 0.7 });

  function clear() {
    for (const item of items) {
      group.remove(item.object);
      disposeObject(item.object);
      if (item.dot) group.remove(item.dot);
    }
    items = [];
    markerWanted = false;
    marker.visible = false;
  }

  function cancel() {
    generation++;
  }

  function placeDot(item, rerolled) {
    if (!rerolled) {
      if (item.dot) group.remove(item.dot);
      item.dot = null;
      return;
    }
    if (!item.dot) {
      item.dot = new THREE.Mesh(dotGeometry, dotMaterial);
      item.dot.rotation.x = -Math.PI / 2;
      item.dot.visible = overlays;
      group.add(item.dot);
    }
    const offset = item.markerRadius * 0.7;
    item.dot.position.set(item.center.x + offset, 0.004, item.center.z + offset);
  }

  function makeItem(definition, sceneSeed, number, rolls) {
    const params = generateItem(definition, sceneSeed, number, rolls);
    const object = buildItem(definition, params, kit);
    return { params, object };
  }

  function place(item, x, z) {
    item.center = { x, z };
    item.object.position.set(x - item.foot.cx, 0, z - item.foot.cz);
  }

  function relayout() {
    const sizes = items.map((item) => ({ w: item.foot.w, d: item.foot.d }));
    packed = packRows(sizes, { gap: PACK_GAP });
    items.forEach((item, i) => {
      place(item, packed.positions[i].x, packed.positions[i].z);
      item.markerRadius = Math.max(item.foot.w, item.foot.d) / 2 + MARKER_PAD;
      if (item.dot) placeDot(item, true);
    });
  }

  async function populate(options) {
    const id = ++generation;
    clear();
    animate = options.animate;
    mixed = Boolean(options.mixed);

    const single = options.single;
    const size = single ? 1 : options.gridSize;
    const total = single ? 1 : options.count;
    const center = (size - 1) / 2;
    const { spacing } = options;
    const built = [];
    const abandon = () => {
      built.forEach((item) => disposeObject(item.object));
      return false;
    };
    onProgress(0, total);
    await nextFrame();
    if (id !== generation) return false;
    let sliceStart = performance.now();
    for (let n = 0; n < total; n++) {
      const row = Math.floor(n / size);
      const col = n % size;
      const number = single ? options.item ?? 1 : n + 1;
      const rolls = options.rerolls.get(number) ?? {};
      const { definition, seed } = options.resolve(number);
      const { params, object } = makeItem(definition, seed, number, rolls);
      const foot = mixed ? measure(object) : { w: 0, d: 0, cx: 0, cz: 0 };
      object.userData.itemIndex = built.length;
      object.visible = false;
      const ring = mixed ? 0 : Math.max(Math.abs(row - center), Math.abs(col - center));
      built.push({
        number,
        definition,
        seed,
        object,
        params,
        foot,
        ring,
        center: { x: 0, z: 0 },
        markerRadius: (MARKER_BASE * spacing) / 1.7,
        revealAt: 0,
        popped: false,
        dot: null,
        rollKey: rollKey(rolls),
      });
      if (!mixed) {
        built[n].center = { x: (col - center) * spacing, z: (row - center) * spacing };
        object.position.set(built[n].center.x, 0, built[n].center.z);
      }

      if (performance.now() - sliceStart > FRAME_BUDGET) {
        onProgress(built.length, total);
        await nextFrame();
        if (id !== generation) return abandon();
        sliceStart = performance.now();
      }
    }
    if (id !== generation) return abandon();
    onProgress(total, total);

    items = built;
    if (mixed) {
      relayout();
      let farthest = 0;
      for (const item of items) {
        item.ring = Math.hypot(item.center.x, item.center.z);
        farthest = Math.max(farthest, item.ring);
      }
      for (const item of items) item.ring = item.ring / (farthest || 1);
    }

    const start = performance.now();
    const ringDelay = mixed ? MIXED_REVEAL : RING_DELAY * Math.min(1, 12 / Math.max(center, 1));
    for (const item of built) {
      item.revealAt = start + item.ring * ringDelay;
      reveal(item, !animate);
      group.add(item.object);
      if (!single) placeDot(item, rollKey(options.rerolls.get(item.number)) !== '');
    }
    return true;
  }

  function reveal(item, instant) {
    item.object.scale.setScalar(instant ? 1 : 0.001);
    item.object.visible = instant;
    item.popped = instant;
  }

  function rebuild(index, rolls, { quiet = false } = {}) {
    const item = items[index];
    const { params, object } = makeItem(item.definition, item.seed, item.number, rolls);
    const before = item.foot;
    item.foot = mixed ? measure(object) : before;
    object.position.copy(item.object.position);
    object.userData.itemIndex = index;
    group.remove(item.object);
    disposeObject(item.object);
    group.add(object);
    item.object = object;
    item.params = params;
    item.rollKey = rollKey(rolls);
    item.revealAt = performance.now();
    const moved = mixed && ['w', 'd', 'cx', 'cz'].some((k) => Math.abs(item.foot[k] - before[k]) > 0.002);
    if (moved) relayout();
    else if (mixed) place(item, item.center.x, item.center.z);
    reveal(item, quiet || !animate);
    placeDot(item, item.rollKey !== '');
    return item;
  }

  function tick(now) {
    let animating = false;
    for (const item of items) {
      if (item.popped) continue;
      animating = true;
      if (now < item.revealAt) continue;
      const t = Math.min((now - item.revealAt) / POP_DURATION, 1);
      item.object.visible = true;
      item.object.scale.setScalar(Math.max(easeOutBack(t), 0.001));
      item.popped = t === 1;
    }
    return animating;
  }

  function applyMarker() {
    marker.visible = overlays && markerWanted;
  }

  function mark(index, visible = true) {
    const item = items[index];
    markerWanted = visible && Boolean(item);
    if (item) {
      marker.position.set(item.center.x, 0.003, item.center.z);
      const scale = item.markerRadius / MARKER_BASE;
      marker.scale.set(scale, scale, 1);
    }
    applyMarker();
  }

  function setOverlays(visible) {
    overlays = visible;
    applyMarker();
    for (const item of items) if (item.dot) item.dot.visible = visible;
  }

  function setVisible(visible) {
    group.visible = visible;
  }

  return {
    populate,
    rebuild,
    tick,
    mark,
    clear,
    cancel,
    setOverlays,
    setVisible,
    neighbor: (index, direction) => verticalNeighbor(packed.rows, packed.positions, index, direction),
    setAnimate(value) {
      animate = value;
    },
    get items() {
      return items;
    },
    get extent() {
      return { width: packed.width, depth: packed.depth };
    },
  };
}
