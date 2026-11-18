import { canRoll, shortcutGroups } from '../core/item.js';

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderValue(value) {
  if (value && typeof value === 'object' && Array.isArray(value.swatches)) {
    return value.swatches
      .map((c) => `<span class="swatch" style="background:${escapeHtml(c)}" title="${escapeHtml(c)}"></span>`)
      .join('');
  }
  return escapeHtml(value);
}

function shortcutKeys(definition) {
  const { c, s } = shortcutGroups(definition);
  return { ...(s ? { [s]: 'S' } : {}), ...(c ? { [c]: 'C' } : {}) };
}

function rollControl(group, count, key, applies = true) {
  const name = group.label.toLowerCase();
  const forwardTip = `Re-roll ${name}${key ? ` (${key})` : ''}`;
  const forward = applies
    ? `<button type="button" class="roll" data-group="${escapeHtml(group.id)}" data-dir="1" title="${escapeHtml(
        forwardTip
      )}" aria-label="${escapeHtml(forwardTip)}">⟳</button>`
    : '';
  if (!count) return forward;
  const backTip = `Step back${key ? ` (shift+${key})` : ''}`;
  return `<span class="rollctl"><button type="button" class="back" data-group="${escapeHtml(
    group.id
  )}" data-dir="-1" title="${backTip}" aria-label="Step back ${escapeHtml(name)}">‹</button><span class="count">${count}</span>${forward}</span>`;
}

export function createPanel({ root, onReroll, onReset, onCopyLink, onSolo, onToggleOpen, onHeadClick }) {
  const head = root.querySelector('[data-panel-head]');
  const title = root.querySelector('[data-panel-title]');
  const seedLabel = root.querySelector('[data-panel-seed]');
  const seedLabel2 = root.querySelector('[data-panel-seed2]');
  const meta = root.querySelector('[data-panel-meta]');
  const sub = root.querySelector('[data-panel-sub]');
  const peek = root.querySelector('[data-panel-peek]');
  const body = root.querySelector('[data-panel-sections]');
  const resetButton = root.querySelector('[data-action="reset"]');
  const copyButton = root.querySelector('[data-action="copy"]');
  const soloButton = root.querySelector('[data-action="solo"]');
  let previous = { key: '', cells: new Map() };

  root.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-group]');
    if (!button) return;
    const direction = Number(button.dataset.dir);
    onReroll(button.dataset.group, direction < 0 || e.shiftKey ? -1 : 1);
  });
  head.addEventListener('click', () => onHeadClick());
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onHeadClick();
    }
  });
  resetButton.addEventListener('click', () => onReset());
  soloButton.addEventListener('click', () => onSolo());
  let copyTimer = 0;
  copyButton.addEventListener('click', async () => {
    const ok = await onCopyLink();
    copyButton.textContent = ok ? 'Copied' : 'Copy failed';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copyButton.textContent = 'Copy link'), 1200);
  });

  function setOpen(open) {
    root.dataset.open = String(open);
    head.setAttribute('aria-expanded', String(open));
    onToggleOpen?.(open);
  }

  function render({ definition, number, params, rolls, single, flash }) {
    const rerolled = Object.values(rolls).some((count) => count > 0);
    const subtitle = `${params.style ?? ''}${rerolled ? ' · re-rolled' : ''}`;
    title.textContent = `${definition.label} ${number}`;
    seedLabel.textContent = params.seed;
    seedLabel.title = params.seed;
    seedLabel2.textContent = params.seed;
    meta.textContent = subtitle ? `· ${subtitle}` : '';
    sub.textContent = subtitle;
    const groups = new Map(definition.groups.map((g) => [g.id, g]));
    const keys = shortcutKeys(definition);
    const { sections } = definition.describe(params);
    const key = `${definition.id}/${number}`;
    const sameItem = previous.key === key;
    const cells = new Map();
    const peekParts = [];
    body.innerHTML = sections
      .map(({ group: groupId, rows }) => {
        const group = groups.get(groupId) ?? { id: groupId, label: groupId, rerollable: false };
        const count = rolls[groupId] ?? 0;
        const applies = groups.has(groupId) && canRoll(definition, groupId, params);
        const shown = applies || (group.rerollable !== false && count > 0);
        const control = shown ? rollControl(group, count, keys[groupId], applies) : '';
        if (shown) peekParts.push(`<span class="pr">${escapeHtml(group.label)}${control}</span>`);
        const list = rows
          .map(([label, value], index) => {
            const html = renderValue(value);
            const cellKey = `${groupId}/${index}`;
            cells.set(cellKey, html);
            const changed = flash && sameItem && previous.cells.has(cellKey) && previous.cells.get(cellKey) !== html;
            return `<dt>${escapeHtml(label)}</dt><dd${changed ? ' class="flash"' : ''}>${html}</dd>`;
          })
          .join('');
        return `<section class="group"><header><span>${escapeHtml(group.label)}</span>${control}</header><dl>${list}</dl></section>`;
      })
      .join('');
    peek.innerHTML = peekParts.join('');
    previous = { key, cells };
    resetButton.disabled = !rerolled;
    soloButton.textContent = single ? 'Grid' : 'Solo';
    soloButton.title = single ? 'Back to grid (Esc)' : 'Solo view (Enter)';
    return rolls;
  }

  return {
    render,
    setOpen,
    get open() {
      return root.dataset.open !== 'false';
    },
  };
}
