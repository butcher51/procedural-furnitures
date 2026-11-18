import { createKit } from '../core/kit.js';
import { canvasPatternTexture } from '../core/materials.js';
import * as registry from '../furniture/registry.js';
import { createShowroom, rollKey } from './grid.js';
import { createHelp } from './help.js';
import { attachKeys } from './keys.js';
import { screenshotName, stepIndex } from './nav.js';
import { createPanel, groupApplies } from './panel.js';
import { attachPicking } from './picking.js';
import { createStage } from './scene.js';
import { createSheet } from './sheet.js';
import { attachToolbar, randomSeed } from './toolbar.js';
import { createToast } from './toast.js';
import { readState, writeState } from './url.js';
import { createView } from './view.js';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const root = document.documentElement;
const PANEL_KEY = 'pf.panel.open';
const LOADER_DELAY = 150;
const LOADER_MIN = 300;
const ZOOM_DISTANCE = 3.2;

const types = registry.list();
const state = readState(location.search);
const unknownType = registry.has(state.type) ? null : state.type;
if (unknownType) state.type = 'chair';
state.seed ||= randomSeed();

const toast = createToast({ root: $('toast'), live: $('live') });
const help = createHelp({ root: $('help') });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionOverride = null;
const motion = () => state.animate && (motionOverride ?? !reducedMotion.matches);

let stage = null;
try {
  stage = createStage(viewport);
} catch {
  $('nogl').hidden = false;
  toast.announce('This needs WebGL. Try another browser.');
}

const loaderUi = (() => {
  const card = $('loader');
  const text = $('loader-text');
  const bar = $('loader-bar');
  const barWrap = $('loader-barwrap');
  let showTimer = 0;
  let hideTimer = 0;
  let shownAt = 0;
  let active = false;
  return {
    begin(label, withBar) {
      active = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      text.textContent = label;
      barWrap.hidden = !withBar;
      bar.style.width = '0';
      if (!card.hidden) return;
      showTimer = setTimeout(() => {
        if (!active) return;
        shownAt = performance.now();
        card.hidden = false;
      }, LOADER_DELAY);
    },
    progress(label, done, total) {
      text.textContent = label;
      bar.style.width = `${(done / total) * 100}%`;
    },
    end() {
      active = false;
      clearTimeout(showTimer);
      if (card.hidden) return;
      hideTimer = setTimeout(() => {
        if (!active) card.hidden = true;
      }, Math.max(0, LOADER_MIN - (performance.now() - shownAt)));
    },
  };
})();

const kit = createKit({ textureFactory: canvasPatternTexture });
const pluralOf = (definition) => definition.plural ?? `${definition.label.toLowerCase()}s`;

const grid = stage
  ? createShowroom({
      scene: stage.scene,
      kit,
      onProgress(done, total, definition) {
        loaderUi.progress(`Generating ${pluralOf(definition)}… ${done} / ${total}`, done, total);
      },
    })
  : null;
const solo = stage ? createShowroom({ scene: stage.scene, kit, onProgress() {} }) : null;

let selected = -1;
let zoomed = false;
let turntableOff = false;
let gridKey = null;
let epoch = 0;
const room = () => (state.single ? solo : grid);
const keyOf = () => `${state.type}|${state.seed}`;
const rollsFor = (number) => state.rerolls.get(number) ?? {};
const currentItem = () => room()?.items[selected];
const currentDefinition = () => registry.get(state.type);

const urlOf = () => writeState(state);
const replaceUrl = () => history.replaceState(null, '', urlOf());
const pushUrl = () => history.pushState(null, '', urlOf());

let sheet = null;

const panel = createPanel({
  root: $('panel'),
  onReroll: (groupId, delta) => reroll(groupId, delta),
  onReset() {
    const item = currentItem();
    if (item) applyRolls(item.number, {});
  },
  async onCopyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      return true;
    } catch {
      toast.show('Copy failed. Copy the link by hand', { duration: 8000, copyText: location.href });
      return false;
    }
  },
  onSolo: () => toggleSolo(),
  onHeadClick() {
    if (!sheet.isPhone) panel.setOpen(!panel.open);
  },
  onToggleOpen(open) {
    try {
      localStorage.setItem(PANEL_KEY, open ? '1' : '0');
    } catch {}
  },
});

try {
  if (localStorage.getItem(PANEL_KEY) === '0') panel.setOpen(false);
} catch {}

sheet = createSheet({
  panel: $('panel'),
  viewport,
  onChange({ detent, height }) {
    viewport.dataset.detent = detent;
    stage?.setInset(height);
  },
});

const stepper = $('stepper');
const spinHint = $('spin-hint');

function applyTurntable() {
  const on = Boolean(stage) && state.single && motion() && !turntableOff;
  stage?.setTurntable(on);
  spinHint.hidden = !(state.single && on);
}

function applyMotion() {
  root.classList.toggle('no-motion', !motion());
  stage?.setAnimateMoves(motion());
  grid?.setAnimate(motion());
  solo?.setAnimate(motion());
  toolbar.setAnimations(motion());
  applyTurntable();
}

function describeCanvas() {
  const item = currentItem();
  const definition = currentDefinition();
  if (!stage || !item) return;
  const label = state.single
    ? `${definition.label} ${item.number}, solo view`
    : `Grid of ${grid.items.length} ${pluralOf(definition)}, ${definition.label.toLowerCase()} ${item.number} selected`;
  stage.renderer.domElement.setAttribute('role', 'img');
  stage.renderer.domElement.setAttribute('aria-label', label);
  $('stepper-label').textContent = `${definition.label} ${item.number}`;
}

function renderPanel(flash = false) {
  const item = currentItem();
  if (!item) return;
  $('panel').hidden = false;
  sheet.setVisible(true);
  panel.render({
    definition: currentDefinition(),
    number: item.number,
    params: item.params,
    rolls: rollsFor(item.number),
    single: state.single,
    flash,
  });
  describeCanvas();
}

function select(index, { record = true } = {}) {
  selected = index;
  room().mark(index, !state.single);
  if (record) {
    state.item = room().items[index].number;
    replaceUrl();
  }
  renderPanel();
}

function reconcile(showroom) {
  let changed = 0;
  showroom.items.forEach((item, index) => {
    const rolls = rollsFor(item.number);
    if (rollKey(rolls) !== item.rollKey) {
      showroom.rebuild(index, rolls);
      changed++;
    }
  });
  if (changed) stage.invalidate({ shadow: true });
  return changed;
}

function applyRolls(number, rolls, flash = false) {
  if (Object.keys(rolls).length) state.rerolls.set(number, rolls);
  else state.rerolls.delete(number);
  room().rebuild(selected, rolls);
  stage.invalidate({ shadow: true });
  replaceUrl();
  toolbar.setRollCount(state.rerolls.size);
  renderPanel(flash);
}

function reroll(groupId, delta) {
  const item = currentItem();
  if (!item || !stage) return;
  const definition = currentDefinition();
  const group = definition.groups.find((g) => g.id === groupId);
  if (!group || !groupApplies(group, item.params)) return;
  const rolls = { ...rollsFor(item.number) };
  const before = rolls[groupId] ?? 0;
  if (delta < 0 && before === 0) return;
  rolls[groupId] = Math.max(0, before + delta);
  if (rolls[groupId] === 0) delete rolls[groupId];
  applyRolls(item.number, rolls, true);
  toast.announce(`${group.label} ${delta < 0 ? 'stepped back' : 're-rolled'}, roll ${rolls[groupId] ?? 0}`);
}

function clearAllRolls() {
  if (!state.rerolls.size || !stage) return;
  state.rerolls = new Map();
  reconcile(room());
  replaceUrl();
  toolbar.setRollCount(0);
  renderPanel();
}

async function populateCurrent({ zoomToItem = false } = {}) {
  const run = epoch;
  const definition = currentDefinition();
  const single = state.single;
  const total = definition.cell.gridSize ** 2;
  const plural = pluralOf(definition);
  let ok;

  if (single) {
    state.item ??= 1;
    loaderUi.begin(`Generating ${definition.label.toLowerCase()} ${state.item}…`, false);
    ok = await solo.populate({
      definition,
      seed: state.seed,
      single: true,
      item: state.item,
      rerolls: state.rerolls,
      animate: motion(),
    });
  } else if (gridKey === keyOf() && grid.items.length) {
    reconcile(grid);
    ok = true;
  } else {
    gridKey = null;
    loaderUi.begin(`Generating ${plural}… 0 / ${total}`, true);
    toast.announce(`Generating ${plural}`);
    ok = await grid.populate({
      definition,
      seed: state.seed,
      single: false,
      item: state.item,
      rerolls: state.rerolls,
      animate: motion(),
    });
    if (ok) gridKey = keyOf();
  }
  if (!ok || run !== epoch) return;

  loaderUi.end();
  if (single && solo.items[0]) stage.frameObject(solo.items[0].object);
  stage.invalidate({ shadow: true });
  const showroom = room();
  const count = showroom.items.length;
  const requested = !single && state.item && state.item <= count ? state.item - 1 : -1;
  select(single ? 0 : requested >= 0 ? requested : Math.floor(count / 2), { record: false });
  if (zoomToItem && !single) focusSelected();
  if (!single) toast.announce(`Generated ${count} ${plural}`);
  replaceUrl();
  toolbar.setRollCount(state.rerolls.size);
  root.dataset.ready = state.seed;
}

function focusSelected() {
  const item = grid.items[selected];
  if (!item) return;
  zoomed = true;
  stage.focus(item.object.position, ZOOM_DISTANCE * (currentDefinition().cell.spacing / 1.7));
}

async function generate({ zoomToItem = false } = {}) {
  epoch++;
  delete root.dataset.ready;
  const definition = currentDefinition();
  toolbar.setType(state.type);
  toolbar.setSeed(state.seed);
  const count = definition.cell.gridSize ** 2;
  if (state.item && state.item > count) state.item = null;
  if (!stage) {
    replaceUrl();
    return;
  }
  grid.cancel();
  solo.cancel();
  selected = -1;
  zoomed = false;
  turntableOff = false;
  $('panel').hidden = true;
  sheet.setVisible(false);
  stepper.hidden = !state.single;
  stage.layout({ ...definition.cell, single: state.single });
  if (state.single) {
    grid.setVisible(false);
    grid.mark(-1, false);
    if (gridKey !== keyOf()) {
      grid.clear();
      gridKey = null;
    }
  } else {
    solo.clear();
    grid.setVisible(true);
  }
  applyTurntable();
  await populateCurrent({ zoomToItem });
}

function switchType(id) {
  if (id === state.type || !registry.has(id)) return;
  state.type = id;
  state.item = null;
  state.rerolls = new Map();
  pushUrl();
  generate();
}

function setSeed(seed) {
  state.seed = seed;
  state.item = null;
  state.rerolls = new Map();
  pushUrl();
  generate();
}

function toggleSolo() {
  const item = currentItem();
  if (!item || !stage) return;
  state.item = item.number;
  state.single = !state.single;
  pushUrl();
  generate({ zoomToItem: !state.single });
}

function stepSolo(delta) {
  const total = currentDefinition().cell.gridSize ** 2;
  state.item = ((((state.item ?? 1) - 1 + delta) % total) + total) % total + 1;
  replaceUrl();
  populateCurrent();
}

function step(key) {
  if (!stage) return;
  if (state.single) {
    if (key === 'ArrowLeft') stepSolo(-1);
    else if (key === 'ArrowRight') stepSolo(1);
    return;
  }
  if (selected < 0) return;
  const next = stepIndex(selected, key, { count: grid.items.length, gridSize: currentDefinition().cell.gridSize });
  if (next === selected) return;
  select(next);
  if (zoomed) focusSelected();
}

function toggleTurntable() {
  if (!state.single || !motion()) return;
  turntableOff = stage.turntable;
  applyTurntable();
}

function toggleAnimations() {
  if (motion()) state.animate = false;
  else {
    state.animate = true;
    motionOverride = true;
  }
  applyMotion();
  replaceUrl();
}

function escape() {
  if (help.close()) return;
  if (toolbar.closeMenu()) return;
  if (sheet.collapse()) return;
  if (state.single) {
    toggleSolo();
    return;
  }
  if (zoomed) resetCamera();
}

function resetCamera() {
  zoomed = false;
  stage?.resetCamera();
}

const toolbar = attachToolbar({
  seedInput: $('seed'),
  regenButton: $('regen'),
  chipGroup: $('chips'),
  moreButton: $('more'),
  menu: $('menu'),
  types,
  onSeed: setSeed,
  onType: switchType,
  onHelp: () => help.open(),
  onClearRolls: clearAllRolls,
  onToggleAnimations: toggleAnimations,
});

const view = createView({
  stage: stage ?? { resetCamera() {}, renderNow() {}, invalidate() {}, renderer: { domElement: document.createElement('canvas') } },
  viewport,
  root: $('viewctl'),
  toast,
  setOverlays(visible) {
    grid?.setOverlays(visible);
    solo?.setOverlays(visible);
  },
  getFileName() {
    const item = currentItem();
    return screenshotName({
      type: state.type,
      seed: state.seed,
      item: item?.number ?? state.item ?? 1,
      single: state.single,
      rerolls: state.rerolls,
    });
  },
  onReset: () => (zoomed = false),
});

stepper.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.dataset.step) stepSolo(Number(button.dataset.step));
  else if (button.dataset.stepper === 'grid') toggleSolo();
});

attachKeys({
  help: () => help.toggle(),
  dialogOpen: () => help.isOpen,
  type: (index) => types[index] && switchType(types[index].id),
  step,
  regenerate: () => setSeed(randomSeed()),
  reroll: (groupId, delta) => reroll(groupId, delta),
  solo: toggleSolo,
  turntable: toggleTurntable,
  escape,
  resetCamera: view.reset,
  fullscreen: view.fullscreen,
  screenshot: view.screenshot,
  focusSeed: () => toolbar.focusSeed(),
});

window.addEventListener('popstate', () => {
  const next = readState(location.search);
  if (!registry.has(next.type)) next.type = 'chair';
  next.seed ||= state.seed;
  const rebuildAll = next.type !== state.type || next.seed !== state.seed;
  const viewChanged = next.single !== state.single;
  const itemChanged = next.item !== state.item;
  Object.assign(state, next);
  applyMotion();
  if (!stage) {
    generate();
    return;
  }
  if (rebuildAll) generate();
  else if (viewChanged) generate({ zoomToItem: !state.single });
  else if (state.single && itemChanged) populateCurrent();
  else {
    reconcile(room());
    const count = room().items.length;
    if (!state.single && state.item && state.item <= count) select(state.item - 1, { record: false });
    else renderPanel();
    toolbar.setRollCount(state.rerolls.size);
    replaceUrl();
  }
});

if (stage) {
  attachPicking({
    renderer: stage.renderer,
    camera: stage.camera,
    getObjects: () => (state.single || !grid ? [] : grid.items.filter((item) => item.object.visible).map((item) => item.object)),
    onSelect: (index) => select(index),
    onZoom(index) {
      select(index);
      focusSelected();
    },
    onFloor: resetCamera,
  });

  stage.controls.addEventListener('start', () => {
    turntableOff = true;
    applyTurntable();
  });

  stage.renderer.setAnimationLoop((now) => {
    const growing = grid.tick(now);
    const growingSolo = solo.tick(now);
    stage.frame(now, growing || growingSolo);
  });
}

if (unknownType) toast.show(`Unknown type "${unknownType}", showing ${pluralOf(registry.get('chair'))}`);
reducedMotion.addEventListener('change', applyMotion);
applyMotion();
replaceUrl();
generate();
