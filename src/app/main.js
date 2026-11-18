import { createKit } from '../core/kit.js';
import { canvasPatternTexture } from '../core/materials.js';
import * as registry from '../furniture/registry.js';
import { createShowroom } from './grid.js';
import { createPanel } from './panel.js';
import { attachPicking } from './picking.js';
import { createStage } from './scene.js';
import { attachToolbar, randomSeed } from './toolbar.js';
import { readState, writeState } from './url.js';

const viewport = document.getElementById('viewport');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const loaderBar = document.getElementById('loader-bar');

const state = readState(location.search);
if (!registry.has(state.type)) state.type = 'chair';
state.seed ||= randomSeed();

const stage = createStage(viewport);
const kit = createKit({ textureFactory: canvasPatternTexture });
const showroom = createShowroom({
  scene: stage.scene,
  kit,
  onProgress(done, total, definition) {
    loader.hidden = done >= total;
    loaderText.textContent = `Generating ${definition.plural ?? `${definition.label.toLowerCase()}s`}… ${done} / ${total}`;
    loaderBar.style.width = `${(done / total) * 100}%`;
  },
});

let selected = -1;

const syncUrl = () => history.replaceState(null, '', writeState(state));
const rollsFor = (number) => state.rerolls.get(number) ?? {};

const panel = createPanel({
  root: document.getElementById('panel'),
  onReroll(groupId, delta) {
    const item = showroom.items[selected];
    if (!item) return;
    const rolls = { ...rollsFor(item.number) };
    rolls[groupId] = Math.max(0, (rolls[groupId] ?? 0) + delta);
    if (rolls[groupId] === 0) delete rolls[groupId];
    applyRolls(item.number, rolls);
  },
  onReset() {
    const item = showroom.items[selected];
    if (item) applyRolls(item.number, {});
  },
  async onCopyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      return true;
    } catch {
      return false;
    }
  },
  onSolo() {
    const item = showroom.items[selected];
    if (!item) return;
    const next = { ...state, single: !state.single, item: item.number };
    location.assign(writeState(next));
  },
});

function applyRolls(number, rolls) {
  if (Object.keys(rolls).length) state.rerolls.set(number, rolls);
  else state.rerolls.delete(number);
  showroom.rebuild(selected, rolls);
  syncUrl();
  renderPanel();
}

function renderPanel() {
  const item = showroom.items[selected];
  if (!item) return;
  const definition = showroom.definition;
  panel.render({
    heading: `${definition.label} ${item.number} · ${item.params.seed}`,
    definition,
    params: item.params,
    rolls: rollsFor(item.number),
    single: state.single,
  });
}

function select(index, { record = true } = {}) {
  selected = index;
  showroom.mark(index, !state.single);
  if (record) {
    state.item = showroom.items[index].number;
    syncUrl();
  }
  renderPanel();
}

const toolbar = attachToolbar({
  seedInput: document.getElementById('seed'),
  regenButton: document.getElementById('regen'),
  onSeed(seed) {
    state.seed = seed;
    state.item = null;
    state.rerolls = new Map();
    generate();
  },
});

async function generate() {
  delete document.documentElement.dataset.ready;
  const definition = registry.get(state.type);
  toolbar.setSeed(state.seed);
  syncUrl();
  stage.layout({ ...definition.cell, single: state.single });
  const finished = await showroom.populate({
    definition,
    seed: state.seed,
    single: state.single,
    item: state.item,
    rerolls: state.rerolls,
    animate: state.animate,
  });
  if (!finished) return;
  const count = showroom.items.length;
  const requested = !state.single && state.item && state.item <= count ? state.item - 1 : -1;
  select(requested >= 0 ? requested : Math.floor(count / 2), { record: false });
  document.documentElement.dataset.ready = state.seed;
}

attachPicking({
  renderer: stage.renderer,
  camera: stage.camera,
  getObjects: () => showroom.items.filter((item) => item.object.visible).map((item) => item.object),
  onSelect: (index) => select(index),
  onZoom(index) {
    select(index);
    stage.focus(showroom.items[index].object.position, 3.2 * (showroom.definition.cell.spacing / 1.7));
  },
  onFloor: () => stage.resetCamera(),
});

stage.renderer.setAnimationLoop((now) => {
  showroom.tick(now);
  stage.controls.update();
  stage.renderer.render(stage.scene, stage.camera);
});

generate();
