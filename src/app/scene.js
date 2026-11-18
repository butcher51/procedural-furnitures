import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createStage(viewport) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f3ef');

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.8;
  controls.maxPolarAngle = Math.PI * 0.49;

  scene.add(new THREE.HemisphereLight('#ffffff', '#d9d2c5', 1.4));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let floorGrid = null;
  const overview = { position: new THREE.Vector3(), target: new THREE.Vector3() };

  function layout({ gridSize, spacing, single }) {
    const size = single ? 1 : gridSize;
    const extent = ((size - 1) / 2) * spacing + 1;
    const scale = spacing / 1.7;

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
    floorGrid = new THREE.GridHelper(gridSize * spacing, gridSize * 4, '#d8d1c5', '#e2ddd4');
    floorGrid.position.y = 0.001;
    floorGrid.visible = !single;
    scene.add(floorGrid);

    if (single) {
      overview.position.set(1.45, 1.1, 1.95).multiplyScalar(scale);
      overview.target.set(0, 0.42 * scale, 0);
    } else {
      overview.position.set(extent * 1.25, extent * 1.2, extent * 1.7);
      overview.target.set(0, 0.3, 0);
    }
    resetCamera();
  }

  function resetCamera() {
    camera.position.copy(overview.position);
    controls.target.copy(overview.target);
  }

  function focus(position, distance) {
    const viewDir = camera.position.clone().sub(controls.target).setLength(distance);
    controls.target.set(position.x, 0.4, position.z);
    camera.position.copy(controls.target).add(viewDir);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = viewport;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, controls, layout, resetCamera, focus };
}
