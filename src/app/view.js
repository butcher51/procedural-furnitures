export function createView({ stage, viewport, root, toast, getFileName, setOverlays, onReset }) {
  const fullscreenButton = root.querySelector('[data-view="full"]');
  const fullscreenSupported = Boolean(document.fullscreenEnabled && viewport.requestFullscreen);
  if (!fullscreenSupported) fullscreenButton.hidden = true;

  function reset() {
    stage.resetCamera();
    onReset();
  }

  function fullscreen() {
    if (!fullscreenSupported) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else viewport.requestFullscreen().catch(() => {});
  }

  function screenshot() {
    setOverlays(false);
    stage.renderNow();
    const name = getFileName();
    stage.renderer.domElement.toBlob((blob) => {
      if (!blob) {
        toast.show('Screenshot failed');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.show(`Saved ${name}`);
    }, 'image/png');
    setOverlays(true);
    stage.invalidate();
  }

  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.dataset.active = String(active);
    fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Fullscreen');
    fullscreenButton.dataset.tip = `${active ? 'Exit fullscreen' : 'Fullscreen'} (F)`;
    viewport.dataset.fullscreen = String(active);
  });

  root.addEventListener('click', (e) => {
    const button = e.target.closest('[data-view]');
    if (!button) return;
    ({ reset, full: fullscreen, shot: screenshot })[button.dataset.view]?.();
  });

  return { reset, fullscreen, screenshot };
}
