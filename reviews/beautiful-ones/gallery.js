import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ships, buildConcept } from './fleet.js';
import { loadOriginal } from './originals.js';

const STORAGE_KEY = 'beautiful-ones-review-v1';
const VALID_MODES = new Set(['concept', 'current']);
const VALID_VIEWS = new Set(['three-quarter', 'top', 'side']);
const VALID_REVIEWS = new Set(['not-reviewed', 'approve', 'changes']);
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const byId = (id) => document.getElementById(id);
const viewport = byId('viewport');
const viewportWrap = byId('viewport-wrap');
const shipList = byId('ship-list');
const shipTitle = byId('ship-title');
const shipKicker = byId('ship-kicker');
const shipCreature = byId('ship-creature');
const shipDescription = byId('ship-description');
const shipChanges = byId('ship-changes');
const loadState = byId('load-state');
const viewportError = byId('viewport-error');
const feedbackForm = byId('feedback-form');
const notes = byId('review-notes');
const saveState = byId('save-state');
const autoRotate = byId('auto-rotate');

const catalog = Array.isArray(ships) ? ships : [];
const shipById = new Map(catalog.map((ship) => [ship.id, ship]));
const queryId = new URLSearchParams(window.location.search).get('ship');
const firstId = shipById.has('light') ? 'light' : (catalog[0]?.id ?? 'player');
const initialId = shipById.has(queryId) ? queryId : firstId;

const state = {
  shipId: initialId,
  mode: 'concept',
  view: 'three-quarter',
  display: 'studio',
  autoRotate: false,
};

let feedback = readFeedback();
let renderer;
let scene;
let camera;
let controls;
let pmrem;
let environmentTexture;
let silhouetteMaterial;
let starfield;
let activeObject = null;
let activeUpdater = null;
let activeIsOriginal = false;
let selectionToken = 0;
let resizeObserver;
let runtimeErrorShown = false;
let keyLight;
let fillLight;
let rimLight;

function readFeedback() {
  const empty = {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;
    for (const ship of catalog) {
      const item = parsed[ship.id];
      if (!item || typeof item !== 'object') continue;
      const review = VALID_REVIEWS.has(item.review) ? item.review : 'not-reviewed';
      const note = typeof item.notes === 'string' ? item.notes.slice(0, 2000) : '';
      empty[ship.id] = { review, notes: note };
    }
  } catch (error) {
    console.warn('Beautiful Ones review drafts could not be read.', error);
  }
  return empty;
}

function writeFeedback() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback));
    saveState.textContent = 'Draft saved locally.';
  } catch (error) {
    saveState.textContent = 'Draft could not be saved; your notes remain on screen.';
    console.warn('Beautiful Ones review draft could not be saved.', error);
  }
}

function getDraft(id = state.shipId) {
  return feedback[id] ?? { review: 'not-reviewed', notes: '' };
}

function syncFeedbackForm() {
  const draft = getDraft();
  const radio = feedbackForm.querySelector(`input[name="review-status"][value="${draft.review}"]`);
  if (radio) radio.checked = true;
  notes.value = draft.notes;
  saveState.textContent = feedback[state.shipId] ? 'Draft loaded from this browser.' : '';
}

function renderShipList() {
  shipList.replaceChildren();
  catalog.forEach((ship, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ship-button';
    button.dataset.shipId = ship.id;
    button.setAttribute('aria-label', `Open ${ship.name} ${ship.role} study`);

    const number = document.createElement('span');
    number.className = 'ship-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.className = 'ship-button__text';
    const name = document.createElement('span');
    name.className = 'ship-button__name';
    name.textContent = ship.name;
    const role = document.createElement('span');
    role.className = 'ship-button__role';
    role.textContent = ship.role;
    const creature = document.createElement('span');
    creature.className = 'ship-button__creature';
    creature.textContent = ship.creature;
    text.append(name, role, creature);
    button.append(number, text);
    button.addEventListener('click', () => selectShip(ship.id));
    shipList.append(button);
  });
}

function renderDetails(ship) {
  shipTitle.textContent = ship.name;
  shipKicker.textContent = `${ship.role} · ${ship.id}`;
  shipCreature.textContent = `SEA CREATURE SOURCE · ${ship.creature}`;
  shipDescription.textContent = ship.description;
  shipChanges.replaceChildren();
  (Array.isArray(ship.changes) ? ship.changes : []).slice(0, 3).forEach((change) => {
    const item = document.createElement('li');
    item.textContent = change;
    shipChanges.append(item);
  });
  document.querySelectorAll('.ship-button').forEach((button) => {
    const isActive = button.dataset.shipId === ship.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('ship', state.shipId);
  window.history.replaceState({}, '', url);
}

function setLoadState(message, isError = false) {
  loadState.textContent = message;
  loadState.classList.toggle('is-error', isError);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  viewport.append(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#091923');
  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 500);
  camera.position.set(8, 5, -10);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  scene.add(new THREE.HemisphereLight('#c0eae0', '#091322', 0.55));
  keyLight = new THREE.DirectionalLight('#f6e5d4', 2);
  keyLight.position.set(-5, 8, -7);
  scene.add(keyLight);
  fillLight = new THREE.DirectionalLight('#7bd9dc', 0.45);
  fillLight.position.set(7, 1, -2);
  scene.add(fillLight);
  rimLight = new THREE.DirectionalLight('#aa8fe2', 2.1);
  rimLight.position.set(2, 4, 8);
  scene.add(rimLight);

  pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  environmentTexture = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#d9eee7', side: THREE.DoubleSide });
  scene.environment = environmentTexture;
  scene.environmentIntensity = 0.4;

  const starPositions = new Float32Array(260 * 3);
  for (let i = 0; i < 260; i += 1) {
    const radius = 40 + Math.random() * 85;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starfield = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#91c8c6', size: 0.12, transparent: true, opacity: 0.3, sizeAttenuation: true }));
  scene.add(starfield);

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewportWrap);
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  resize();
  setPresentationMode();
}

function disposeConcept(object) {
  object.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
    else node.material?.dispose();
  });
}

function removeActiveObject() {
  if (!activeObject) return;
  scene.remove(activeObject);
  // Current models are cached by originals.js and may share resources. Only dispose
  // geometry built by a concept module; cached game resources remain untouched.
  if (!activeIsOriginal) disposeConcept(activeObject);
  activeObject = null;
  activeUpdater = null;
  activeIsOriginal = false;
}

async function loadSelection() {
  const ship = shipById.get(state.shipId);
  if (!ship) return;
  const token = ++selectionToken;
  const requestedMode = state.mode;
  runtimeErrorShown = false;
  viewportError.hidden = true;
  setLoadState(requestedMode === 'concept' ? 'Building concept' : 'Loading current model');
  removeActiveObject();
  try {
    let result;
    if (requestedMode === 'concept') {
      result = { object: buildConcept(ship.id), update: null };
    } else {
      result = await loadOriginal(ship.id, renderer);
    }
    if (token !== selectionToken) {
      if (requestedMode === 'concept' && result?.object) disposeConcept(result.object);
      return;
    }
    if (!result?.object) throw new Error('The selected study returned no model object.');
    activeObject = result.object;
    activeUpdater = typeof result.update === 'function' ? result.update : null;
    activeIsOriginal = requestedMode === 'current';
    scene.add(activeObject);
    setPresentationMode();
    frameObject();
    setLoadState(requestedMode === 'concept' ? 'Concept loaded' : 'Current model loaded');
  } catch (error) {
    if (token !== selectionToken) return;
    console.error('Beautiful Ones model load failed.', error);
    setLoadState('Model unavailable', true);
    viewportError.textContent = `This ${requestedMode === 'concept' ? 'concept' : 'current model'} could not be loaded. ${error?.message || 'Try another study.'}`;
    viewportError.hidden = false;
  }
}
 

function frameObject() {
  if (!activeObject) return;
  activeObject.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(activeObject);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.5);
  const target = sphere.center.clone();
  const vectors = {
    'three-quarter': new THREE.Vector3(1.25, 0.9, -0.85).normalize(),
    top: new THREE.Vector3(0, 1, -0.001).normalize(),
    side: new THREE.Vector3(1, 0.06, 0).normalize(),
  };
  const direction = vectors[state.view] ?? vectors['three-quarter'];
  const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const point = new THREE.Vector3();
  const meshes = [];
  activeObject.traverseVisible((node) => {
    if (node.isMesh && node.geometry?.attributes.position) meshes.push(node);
  });
  // Fit the sculpt, not an enclosing sphere: a ray or a long sensory filament
  // otherwise makes most of the viewport empty. This runs only on view changes.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const mesh of meshes) {
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(target);
      const x = point.dot(right);
      const y = point.dot(up);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (Number.isFinite(minX)) {
    target.addScaledVector(right, (minX + maxX) / 2);
    target.addScaledVector(up, (minY + maxY) / 2);
  }
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.82;
  const tanHorizontal = tanVertical * Math.max(camera.aspect, 0.01);
  let distance = radius * 1.2;
  for (const mesh of meshes) {
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(target);
      const depth = point.dot(direction);
      distance = Math.max(distance, Math.abs(point.dot(right)) / tanHorizontal + depth,
        Math.abs(point.dot(up)) / tanVertical + depth);
    }
  }
  // Discard damped orbit deltas before applying an exact inspection preset.
  controls.enableDamping = false;
  controls.update();
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.near = Math.max(0.01, radius * 0.005);
  camera.far = Math.max(160, distance + radius * 24);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.minDistance = Math.max(radius * 0.45, 0.3);
  controls.maxDistance = Math.max(distance * 3, radius * 7, 12);
  controls.update();
  controls.enableDamping = true;
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(viewportWrap.clientWidth, 1);
  const height = Math.max(viewportWrap.clientHeight, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (activeObject) frameObject();
}

function setPresentationMode() {
  if (!scene || !renderer) return;
  const silhouette = state.display === 'silhouette';
  scene.background.set(silhouette ? '#02090d' : '#091923');
  scene.environment = silhouette ? null : environmentTexture;
  scene.overrideMaterial = silhouette ? silhouetteMaterial : null;
  if (starfield) starfield.visible = !silhouette;
  renderer.toneMappingExposure = 1;
}

function updateButtonStates() {
  document.querySelectorAll('[data-mode]').forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-display]').forEach((button) => {
    const active = button.dataset.display === state.display;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  autoRotate.checked = state.autoRotate;
}

function selectShip(id) {
  if (!shipById.has(id) || id === state.shipId) return;
  state.shipId = id;
  updateUrl();
  renderDetails(shipById.get(id));
  syncFeedbackForm();
  loadSelection();
}

function onKeyDown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.key === '1') setView('three-quarter');
  if (event.key === '2') setView('top');
  if (event.key === '3') setView('side');
  if (event.key.toLowerCase() === 'r') setView('three-quarter');
}

function setView(view) {
  if (view === 'reset') view = 'three-quarter';
  if (!VALID_VIEWS.has(view)) return;
  state.view = view;
  updateButtonStates();
  frameObject();
}

function bindUi() {
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (!VALID_MODES.has(mode) || mode === state.mode) return;
    state.mode = mode;
    updateButtonStates();
    loadSelection();
  }));
  document.querySelectorAll('[data-display]').forEach((button) => button.addEventListener('click', () => {
    if (!['studio', 'silhouette'].includes(button.dataset.display)) return;
    state.display = button.dataset.display;
    updateButtonStates();
    setPresentationMode();
  }));
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  autoRotate.addEventListener('change', () => {
    state.autoRotate = autoRotate.checked && !reducedMotion;
    if (autoRotate.checked && reducedMotion) {
      autoRotate.checked = false;
      setLoadState('Auto rotate disabled for reduced motion');
    }
    updateButtonStates();
  });
  feedbackForm.addEventListener('change', (event) => {
    if (event.target.name !== 'review-status') return;
    feedback[state.shipId] = { ...getDraft(), review: event.target.value };
    writeFeedback();
  });
  notes.addEventListener('input', () => {
    feedback[state.shipId] = { ...getDraft(), notes: notes.value.slice(0, 2000) };
    writeFeedback();
  });
  byId('export-review').addEventListener('click', exportReview);
}

function exportReview() {
  const payload = {
    format: 'rimward-beautiful-ones-review',
    exportedAt: new Date().toISOString(),
    localOnly: true,
    note: 'Feedback stays in this browser. Export to share. This file does not apply or approve production changes.',
    ships: catalog.map((ship) => ({
      id: ship.id,
      role: ship.role,
      name: ship.name,
      creature: ship.creature,
      review: getDraft(ship.id).review,
      notes: getDraft(ship.id).notes,
    })),
  };
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'beautiful-ones-review.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    saveState.textContent = 'Review exported locally; nothing was sent.';
  } catch (error) {
    console.error('Beautiful Ones review export failed.', error);
    saveState.textContent = 'Export failed in this browser. Your local draft is unchanged.';
  }
}

function animate(time) {
  if (controls) {
    controls.autoRotate = state.autoRotate && !reducedMotion;
    controls.autoRotateSpeed = 0.45;
    controls.update();
  }
  if (activeUpdater) {
    try { activeUpdater(time / 1000, camera); } catch (error) {
      if (!runtimeErrorShown) {
        runtimeErrorShown = true;
        console.error('Beautiful Ones model update failed.', error);
        setLoadState('Model animation unavailable', true);
        viewportError.textContent = 'This model loaded, but its preview motion failed. Static form remains available.';
        viewportError.hidden = false;
      }
    }
  }
  renderer?.render(scene, camera);
  window.requestAnimationFrame(animate);
}

function exposeInspectionState() {
  window.__beautifulReview = {
    get state() {
      return { shipId: state.shipId, mode: state.mode, view: state.view, display: state.display, autoRotate: state.autoRotate };
    },
    ready: true,
  };
}

function start() {
  if (!catalog.length) {
    setLoadState('Fleet metadata unavailable', true);
    viewportError.textContent = 'No Beautiful Ones fleet metadata was found. The gallery cannot open a study.';
    viewportError.hidden = false;
    exposeInspectionState();
    return;
  }
  renderShipList();
  renderDetails(shipById.get(state.shipId));
  updateUrl();
  syncFeedbackForm();
  updateButtonStates();
  bindUi();
  initRenderer();
  exposeInspectionState();
  loadSelection();
  window.requestAnimationFrame(animate);
}

start();
