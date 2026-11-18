export function createToast({ root, live }) {
  let timer = 0;

  function show(text, { duration = 2000, copyText = null } = {}) {
    clearTimeout(timer);
    root.replaceChildren();
    const label = document.createElement('span');
    label.textContent = text;
    root.append(label);
    if (copyText) {
      const input = document.createElement('input');
      input.readOnly = true;
      input.value = copyText;
      input.setAttribute('aria-label', 'Link');
      root.append(input);
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    }
    root.hidden = false;
    timer = setTimeout(() => {
      root.hidden = true;
      root.replaceChildren();
    }, duration);
  }

  function announce(text) {
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  }

  return { show, announce };
}
