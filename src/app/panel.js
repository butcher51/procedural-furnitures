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

export function createPanel({ root, onReroll, onReset, onCopyLink, onSolo }) {
  const title = root.querySelector('[data-panel-title]');
  const body = root.querySelector('[data-panel-sections]');
  const resetButton = root.querySelector('[data-action="reset"]');
  const copyButton = root.querySelector('[data-action="copy"]');
  const soloButton = root.querySelector('[data-action="solo"]');

  body.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-group]');
    if (button) onReroll(button.dataset.group, e.shiftKey ? -1 : 1);
  });
  resetButton.addEventListener('click', () => onReset());
  soloButton.addEventListener('click', () => onSolo());
  copyButton.addEventListener('click', async () => {
    const ok = await onCopyLink();
    copyButton.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => (copyButton.textContent = 'Copy link'), 1200);
  });

  function render({ heading, definition, params, rolls, single }) {
    title.textContent = heading;
    const groups = new Map(definition.groups.map((g) => [g.id, g]));
    const { sections } = definition.describe(params);
    body.innerHTML = sections
      .map(({ group: groupId, rows }) => {
        const group = groups.get(groupId) ?? { id: groupId, label: groupId };
        const count = rolls[groupId] ?? 0;
        const button =
          group.rerollable === false
            ? ''
            : `<button type="button" class="roll" data-group="${escapeHtml(group.id)}" title="Re-roll ${escapeHtml(
                group.label.toLowerCase()
              )} (shift+click steps back)" aria-label="Re-roll ${escapeHtml(group.label)}">⟳${
                count ? `<span class="count">${count}</span>` : ''
              }</button>`;
        const list = rows.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${renderValue(value)}</dd>`).join('');
        return `<section class="group"><header><span>${escapeHtml(group.label)}</span>${button}</header><dl>${list}</dl></section>`;
      })
      .join('');
    resetButton.disabled = Object.keys(rolls).length === 0;
    soloButton.textContent = single ? 'Grid' : 'Solo';
  }

  return { render };
}
