export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}

export function attachToolbar({ seedInput, regenButton, chipGroup, moreButton, menu, types, onSeed, onType, onHelp, onClearRolls, onToggleAnimations }) {
  let currentSeed = '';

  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && seedInput.value.trim()) {
      const next = seedInput.value.trim();
      if (next !== currentSeed) onSeed(next);
      seedInput.blur();
    } else if (e.key === 'Escape') {
      seedInput.value = currentSeed;
      seedInput.blur();
      e.stopPropagation();
    }
  });
  seedInput.addEventListener('blur', () => {
    seedInput.value = currentSeed;
  });
  regenButton.addEventListener('click', () => onSeed(randomSeed()));

  chipGroup.replaceChildren(
    ...types.map((definition, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.setAttribute('role', 'radio');
      chip.dataset.type = definition.id;
      chip.textContent = definition.label;
      chip.title = index < 9 ? `${definition.label} (${index + 1})` : definition.label;
      return chip;
    })
  );
  const chips = [...chipGroup.children];
  chipGroup.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) onType(chip.dataset.type);
  });
  chipGroup.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const index = chips.indexOf(document.activeElement);
    if (index < 0) return;
    e.preventDefault();
    const next = chips[(index + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length];
    next.focus();
    onType(next.dataset.type);
  });

  function setType(id) {
    for (const chip of chips) {
      const active = chip.dataset.type === id;
      chip.setAttribute('aria-checked', String(active));
      chip.tabIndex = active ? 0 : -1;
      if (active) chip.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  const items = {
    help: menu.querySelector('[data-menu="help"]'),
    clear: menu.querySelector('[data-menu="clear"]'),
    anim: menu.querySelector('[data-menu="anim"]'),
  };

  function closeMenu() {
    if (menu.hidden) return false;
    menu.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
    return true;
  }

  function openMenu() {
    menu.hidden = false;
    moreButton.setAttribute('aria-expanded', 'true');
    items.help.focus();
  }

  moreButton.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !moreButton.contains(e.target)) closeMenu();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const enabled = Object.values(items).filter((item) => !item.disabled);
    const index = enabled.indexOf(document.activeElement);
    enabled[(index + (e.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length].focus();
  });
  items.help.addEventListener('click', () => {
    closeMenu();
    onHelp();
  });
  items.clear.addEventListener('click', () => {
    closeMenu();
    onClearRolls();
  });
  items.anim.addEventListener('click', () => {
    onToggleAnimations();
  });

  return {
    setSeed(seed) {
      currentSeed = seed;
      seedInput.value = seed;
    },
    setType,
    focusSeed() {
      seedInput.focus();
      seedInput.select();
    },
    setRollCount(count) {
      items.clear.textContent = count ? `Clear all rolls (${count} ${count === 1 ? 'item' : 'items'})` : 'Clear all rolls';
      items.clear.disabled = count === 0;
    },
    setAnimations(on) {
      items.anim.setAttribute('aria-checked', String(on));
      items.anim.querySelector('.state').textContent = on ? 'On' : 'Off';
    },
    closeMenu,
    get menuOpen() {
      return !menu.hidden;
    },
  };
}
