const ROWS = [
  ['R', 'Regenerate (new seed)'],
  ['1 – 9', 'Switch type'],
  ['← / →', 'Previous / next item'],
  ['↑ / ↓', 'Row back / forward'],
  ['C / ⇧C', 'Re-roll / step back colours'],
  ['S / ⇧S', 'Re-roll / step back shape (table: top)'],
  ['Enter', 'Solo on / off'],
  ['Space', 'Pause turntable (solo)'],
  ['Esc', 'Back one level'],
  ['Home', 'Reset camera'],
  ['F', 'Fullscreen'],
  ['P', 'Screenshot PNG'],
  ['/', 'Focus seed'],
  ['?', 'This card'],
];

export function createHelp({ root }) {
  const card = root.querySelector('.help');
  card.querySelector('dl').innerHTML = ROWS.map(([key, text]) => `<dt><kbd>${key}</kbd></dt><dd>${text}</dd>`).join('');
  let opener = null;

  function open() {
    opener = document.activeElement;
    root.hidden = false;
    card.focus();
  }

  function close() {
    if (root.hidden) return false;
    root.hidden = true;
    if (opener && opener.isConnected) opener.focus();
    return true;
  }

  root.addEventListener('pointerdown', (e) => {
    if (e.target === root) close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      card.focus();
    }
  });

  return {
    open,
    close,
    toggle: () => (root.hidden ? open() : close()),
    get isOpen() {
      return !root.hidden;
    },
  };
}
