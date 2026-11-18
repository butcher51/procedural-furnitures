import { cycleDetent, snapDetent } from './nav.js';

const PEEK = 72;

export function createSheet({ panel, viewport, onChange }) {
  const grab = panel.querySelector('[data-panel-grab]');
  const head = panel.querySelector('[data-panel-head]');
  const body = panel.querySelector('[data-panel-sections]');
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)';
  viewport.append(probe);
  const phone = window.matchMedia('(max-width: 639px)');

  let detent = 'peek';
  let visible = false;
  let drag = null;

  const heights = () => ({
    peek: PEEK + (parseFloat(getComputedStyle(probe).paddingBottom) || 0),
    half: Math.round(window.innerHeight * 0.5),
    full: Math.max(PEEK, viewport.clientHeight - 8),
  });

  function publish(height, animated) {
    panel.style.transition = animated ? '' : 'none';
    panel.style.setProperty('--sheet-h', `${height}px`);
    viewport.style.setProperty('--sheet-h', visible && phone.matches ? `${height}px` : '0px');
    onChange?.({ detent, height: visible && phone.matches ? height : 0 });
  }

  function set(next, animated = true) {
    detent = next;
    panel.dataset.detent = next;
    publish(heights()[next], animated);
  }

  function refresh() {
    if (!phone.matches) {
      panel.style.removeProperty('--sheet-h');
      viewport.style.setProperty('--sheet-h', '0px');
      onChange?.({ detent, height: 0 });
      return;
    }
    set(detent, false);
  }

  function startDrag(y, from) {
    drag = { from, startY: y, lastY: y, time: performance.now(), velocity: 0, height: panel.offsetHeight, moved: false };
  }

  function moveDrag(y) {
    const now = performance.now();
    const dy = y - drag.lastY;
    if (Math.abs(y - drag.startY) > 4) drag.moved = true;
    drag.velocity = 0.6 * (-dy / Math.max(1, now - drag.time)) + 0.4 * drag.velocity;
    drag.lastY = y;
    drag.time = now;
    drag.height = Math.min(heights().full, Math.max(PEEK, drag.height - dy));
    publish(drag.height, false);
  }

  function endDrag() {
    const state = drag;
    drag = null;
    if (!state) return;
    if (!state.moved) {
      if (state.from === 'tap') set(cycleDetent(detent));
      return;
    }
    set(snapDetent(state.height, state.velocity, heights()));
  }

  for (const handle of [grab, head]) {
    handle.addEventListener('pointerdown', (e) => {
      if (!phone.matches) return;
      startDrag(e.clientY, 'tap');
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => drag && moveDrag(e.clientY));
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  }

  let bodyTouch = null;
  body.addEventListener(
    'touchstart',
    (e) => {
      bodyTouch = { y: e.touches[0].clientY, time: performance.now(), takeover: false };
    },
    { passive: true }
  );
  body.addEventListener(
    'touchmove',
    (e) => {
      if (!bodyTouch || !phone.matches) return;
      const y = e.touches[0].clientY;
      if (!bodyTouch.takeover) {
        const up = y < bodyTouch.y;
        const grows = detent !== 'full' && up;
        const shrinks = body.scrollTop <= 0 && y > bodyTouch.y;
        if (!grows && !shrinks) return;
        bodyTouch.takeover = true;
        startDrag(bodyTouch.y, 'body');
      }
      e.preventDefault();
      moveDrag(y);
    },
    { passive: false }
  );
  body.addEventListener('touchend', () => {
    if (bodyTouch?.takeover) endDrag();
    bodyTouch = null;
  });

  phone.addEventListener('change', refresh);
  window.addEventListener('resize', () => {
    if (phone.matches && !drag) set(detent, false);
  });

  return {
    get detent() {
      return detent;
    },
    cycle: () => set(cycleDetent(detent)),
    collapse() {
      if (!phone.matches || detent === 'peek') return false;
      set('peek');
      return true;
    },
    setVisible(value) {
      visible = value;
      if (phone.matches) set(detent, false);
      else viewport.style.setProperty('--sheet-h', '0px');
    },
    refresh,
    get isPhone() {
      return phone.matches;
    },
  };
}
