import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const EASE_MS = 300;

const cssColor = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export function createStage(viewport) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(cssColor('--bg', '#f5f3ef'));

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.8;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 2.5;

  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d2c5', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: cssColor('--ground', '#ece8e1'), roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let floorGrid = null;
  let dirty = true;
  let shadowDirty = true;
  let tween = null;
  let inset = 0;
  let insetLeft = 0;
  let animateMoves = true;
  const overview = { position: new THREE.Vector3(), target: new THREE.Vector3() };

  const invalidate = ({ shadow = false } = {}) => {
    dirty = true;
    if (shadow) shadowDirty = true;
  };

  function layout({ side, floor, divisions, scale, single, fit = 1 }) {
    const extent = Math.max(side, 0) / 2 + 1;

    camera.far = extent * 10 + 50;
    camera.updateProjectionMatrix();
    controls.maxDistance = extent * 4;

    sun.position.set(0.5, 1, 0.75).multiplyScalar(extent + 6);
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: extent * 4 + 20 });
    sun.shadow.camera.updateProjectionMatrix();

    const groundSize = Math.max(extent * 8, 20);
    ground.scale.set(groundSize, groundSize, 1);

    if (floorGrid) {
      scene.remove(floorGrid);
      floorGrid.geometry.dispose();
      floorGrid.material.dispose();
    }
    floorGrid = new THREE.GridHelper(floor ?? side + 1, divisions, '#d8d1c5', '#e2ddd4');
    floorGrid.position.y = 0.001;
    floorGrid.visible = !single;
    scene.add(floorGrid);

    if (single) {
      overview.position.set(1.45, 1.1, 1.95).multiplyScalar(scale);
      overview.target.set(0, 0.42 * scale, 0);
    } else {
      const { clientWidth: w, clientHeight: h } = viewport;
      const available = w && h ? Math.max(w - insetLeft, 1) / Math.max(h - inset, 1) : 1.6;
      const direction = new THREE.Vector3(1.25, 1.2, 1.7);
      const preferred = direction.length() * extent * fit;
      const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
      const hHalf = Math.atan(Math.tan(vHalf) * available);
      const fitWidth = (extent * fit) / Math.sin(hHalf);
      const distance = Math.max(preferred, fitWidth);
      controls.maxDistance = Math.max(controls.maxDistance, distance * 1.5);
      overview.position.copy(direction.normalize().multiplyScalar(distance));
      overview.target.set(0, 0.3, 0);
    }
    tween = null;
    camera.position.copy(overview.position);
    controls.target.copy(overview.target);
    invalidate({ shadow: true });
  }

  function frameObject(object, { margin = 1.12 } = {}) {
    const scale = object.scale.clone();
    object.scale.setScalar(1);
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    object.scale.copy(scale);
    object.updateMatrixWorld(true);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const vFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const hFov = Math.atan(Math.tan(vFov) * Math.min(camera.aspect, 1));
    const distance = (sphere.radius * margin) / Math.sin(Math.min(vFov, hFov));
    const direction = new THREE.Vector3(1.45, 1.1, 1.95).normalize();
    overview.target.copy(sphere.center);
    overview.position.copy(sphere.center).addScaledVector(direction, distance);
    controls.maxDistance = Math.max(controls.maxDistance, distance * 3);
    tween = null;
    camera.position.copy(overview.position);
    controls.target.copy(overview.target);
    invalidate({ shadow: true });
  }

  function moveTo(position, target) {
    if (!animateMoves) {
      tween = null;
      camera.position.copy(position);
      controls.target.copy(target);
      invalidate();
      return;
    }
    tween = {
      start: performance.now(),
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      position: position.clone(),
      target: target.clone(),
    };
    invalidate();
  }

  function resetCamera() {
    moveTo(overview.position, overview.target);
  }

  function focus(position, distance) {
    const viewDir = camera.position.clone().sub(controls.target).setLength(distance);
    const target = new THREE.Vector3(position.x, 0.4, position.z);
    moveTo(target.clone().add(viewDir), target);
  }

  function applyViewOffset() {
    const { clientWidth: w, clientHeight: h } = viewport;
    if ((inset > 0 || insetLeft > 0) && w > 0) camera.setViewOffset(w, h, -insetLeft / 2, inset / 2, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function setInset(px) {
    inset = px;
    applyViewOffset();
    invalidate();
  }

  function setInsetLeft(px) {
    if (px === insetLeft) return;
    insetLeft = px;
    applyViewOffset();
    invalidate();
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = viewport;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    applyViewOffset();
    invalidate();
  }
  new ResizeObserver(resize).observe(viewport);
  resize();

  controls.addEventListener('start', () => (tween = null));

  function frame(now, animating = false) {
    let active = dirty || animating;
    if (tween) {
      const t = Math.min((now - tween.start) / EASE_MS, 1);
      const k = 1 - (1 - t) ** 3;
      camera.position.lerpVectors(tween.fromPosition, tween.position, k);
      controls.target.lerpVectors(tween.fromTarget, tween.target, k);
      if (t === 1) tween = null;
      active = true;
    }
    if (controls.update()) active = true;
    if (!active) return false;
    if (animating || shadowDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty = false;
    }
    renderer.render(scene, camera);
    dirty = false;
    return true;
  }

  function renderNow() {
    renderer.render(scene, camera);
    dirty = true;
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    layout,
    frameObject,
    resetCamera,
    focus,
    setInset,
    setInsetLeft,
    resize,
    frame,
    renderNow,
    invalidate,
    setAnimateMoves(value) {
      animateMoves = value;
    },
    setTurntable(on) {
      controls.autoRotate = on;
      invalidate();
    },
    get turntable() {
      return controls.autoRotate;
    },
  };
}
