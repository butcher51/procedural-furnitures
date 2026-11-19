const typing = (target) => Boolean(target.closest?.('input, textarea, select, [contenteditable]'));

export function attachKeys(handlers) {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.isComposing) return;
    const target = e.target;

    if (typing(target)) {
      if (e.key === 'Escape') target.blur();
      return;
    }

    if (handlers.walking()) {
      if (e.key === 'Escape') handlers.escape();
      return;
    }

    if (e.key === '?') {
      e.preventDefault();
      handlers.help();
      return;
    }
    if (handlers.dialogOpen()) {
      if (e.key === 'Escape') handlers.escape();
      return;
    }

    const inChips = Boolean(target.closest?.('[role="radiogroup"]'));
    const onButton = Boolean(target.closest?.('button, [role="button"], [role="menuitem"]'));
    const key = e.key.toLowerCase();

    const digit = /^Digit([0-9])$/.exec(e.code);
    if (digit && !e.shiftKey) {
      handlers.type(Number(digit[1]));
      return;
    }

    if (key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') {
      if (inChips || target.closest?.('[role="menu"]')) return;
      e.preventDefault();
      handlers.step(e.key);
      return;
    }

    const dir = e.shiftKey ? -1 : 1;
    switch (key) {
      case 'r':
        handlers.regenerate();
        break;
      case 'c':
      case 's':
        handlers.shortcut(key, dir);
        break;
      case 'enter':
        if (onButton) return;
        handlers.solo();
        break;
      case ' ':
        if (onButton) return;
        e.preventDefault();
        handlers.turntable();
        break;
      case 'escape':
        handlers.escape();
        break;
      case 'home':
        handlers.resetCamera();
        break;
      case 'f':
        handlers.fullscreen();
        break;
      case 'p':
        handlers.screenshot();
        break;
      case '/':
        e.preventDefault();
        handlers.focusSeed();
        break;
      default:
    }
  });
}
