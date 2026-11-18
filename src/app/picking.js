import * as THREE from 'three';

export function attachPicking({ renderer, camera, getObjects, onSelect, onZoom, onFloor }) {
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downAt = null;

  function indexUnderPointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(getObjects(), true)[0];
    let o = hit?.object;
    while (o && o.userData.itemIndex === undefined) o = o.parent;
    return o ? o.userData.itemIndex : -1;
  }

  canvas.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const index = indexUnderPointer(e);
    if (index >= 0) onSelect(index);
  });
  canvas.addEventListener('dblclick', (e) => {
    const index = indexUnderPointer(e);
    if (index < 0) onFloor();
    else onZoom(index);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    canvas.style.cursor = indexUnderPointer(e) >= 0 ? 'pointer' : '';
  });
}
