import * as THREE from 'three';
import { buildItem, generateItem } from '../core/item.js';
import { disposeObject } from '../core/merge.js';

const RING_DELAY = 100;
const POP_DURATION = 450;
const FRAME_BUDGET = 30;

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

export function createShowroom({ scene, kit, onProgress }) {
  let items = [];
  let generation = 0;
  let definition = null;
  let animate = true;
  let seed = '';
  let overlays = true;
  let markerWanted = false;

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

  function sizeMarker(spacing) {
    const scale = spacing / 1.7;
    marker.scale.set(scale, scale, 1);
  }

  function placeDot(item, rerolled) {
    if (!rerolled) {
      if (item.dot) group.remove(item.dot);
      item.dot = null;
      return;
    }
    if (item.dot) return;
    const offset = definition.cell.spacing * 0.37;
    item.dot = new THREE.Mesh(dotGeometry, dotMaterial);
    item.dot.rotation.x = -Math.PI / 2;
    item.dot.position.set(item.object.position.x + offset * 0.72, 0.004, item.object.position.z + offset * 0.72);
    item.dot.visible = overlays;
    group.add(item.dot);
  }

  function makeItem(number, rolls) {
    const params = generateItem(definition, seed, number, rolls);
    const object = buildItem(definition, params, kit);
    return { params, object };
  }

  async function populate(options) {
    const id = ++generation;
    clear();
    definition = options.definition;
    animate = options.animate;
    seed = options.seed;
    sizeMarker(definition.cell.spacing);

    const size = options.single ? 1 : definition.cell.gridSize;
    const total = size * size;
    const center = (size - 1) / 2;
    const { spacing } = definition.cell;
    const built = [];
    const abandon = () => {
      built.forEach((item) => disposeObject(item.object));
      return false;
    };
    onProgress(0, total, definition);
    await nextFrame();
    if (id !== generation) return false;
    let sliceStart = performance.now();
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const number = options.single ? options.item ?? 1 : built.length + 1;
        const rolls = options.rerolls.get(number) ?? {};
        const { params, object } = makeItem(number, rolls);
        object.position.set((col - center) * spacing, 0, (row - center) * spacing);
        object.userData.itemIndex = built.length;
        object.visible = false;
        const ring = Math.max(Math.abs(row - center), Math.abs(col - center));
        built.push({ number, object, params, ring, revealAt: 0, popped: false, dot: null, rollKey: rollKey(rolls) });

        if (performance.now() - sliceStart > FRAME_BUDGET) {
          onProgress(built.length, total, definition);
          await nextFrame();
          if (id !== generation) return abandon();
          sliceStart = performance.now();
        }
      }
    }
    if (id !== generation) return abandon();
    onProgress(total, total, definition);

    const start = performance.now();
    const ringDelay = RING_DELAY * Math.min(1, 12 / Math.max(center, 1));
    for (const item of built) {
      item.revealAt = start + item.ring * ringDelay;
      reveal(item, !animate);
      group.add(item.object);
      if (!options.single) placeDot(item, rollKey(options.rerolls.get(item.number)) !== '');
    }
    items = built;
    return true;
  }

  function reveal(item, instant) {
    item.object.scale.setScalar(instant ? 1 : 0.001);
    item.object.visible = instant;
    item.popped = instant;
  }

  function rebuild(index, rolls, { quiet = false } = {}) {
    const item = items[index];
    const { params, object } = makeItem(item.number, rolls);
    object.position.copy(item.object.position);
    object.userData.itemIndex = index;
    group.remove(item.object);
    disposeObject(item.object);
    group.add(object);
    item.object = object;
    item.params = params;
    item.rollKey = rollKey(rolls);
    item.revealAt = performance.now();
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
    if (item) marker.position.set(item.object.position.x, 0.003, item.object.position.z);
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
    setAnimate(value) {
      animate = value;
    },
    get items() {
      return items;
    },
    get definition() {
      return definition;
    },
    get seed() {
      return seed;
    },
  };
}
