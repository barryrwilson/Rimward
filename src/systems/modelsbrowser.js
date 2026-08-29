/**
 * Models Browser — full-screen overlay for inspecting every buildable model.
 *
 * OWNERSHIP:
 * - Owns its own WebGL renderer, scene, camera, and animation loop.
 * - The renderer is created lazily on first open() and kept for the session;
 *   creating and destroying a GL context on every open is churn.
 * - Sets ctx.flags.paused = true while open and restores the previous value
 *   on close (the title screen is already paused; closing back to it must
 *   not unpause the game).
 * - Owns the capture-phase keydown listener while open; swallows navigation
 *   keys but lets filter input keys pass through when focused.
 * - Owns the .rw-models overlay DOM and its lifecycle.
 *
 * CONTRACT:
 * - ctx.models = { open(), close(), isOpen() } is assigned synchronously at
 *   init. title.js calls ctx.models?.open?.() from its MODELS entry.
 * - open() when already open is a no-op. close() when closed is a no-op.
 * - On first open, the renderer DOM is created, the scene built, and the
 *   animation loop started. On close, the loop is cancelled and the overlay
 *   hidden; the renderer is kept for the session.
 *
 * THREE.JS CONTEXT:
 * - The browser has its own renderer because main.js calls
 *   renderer.render(scene, camera) unconditionally every frame. Sharing the
 *   game renderer would conflict with the game's own scene/camera.
 * - Camera: PerspectiveCamera(50, aspect, 0.01, 100000). The near plane is
 *   small enough to let the player push the camera right up against a hull.
 * - Lighting matches the game world: a strong PointLight at distance,
 *   weak AmbientLight, and a weak fill light opposite the key. These are
 *   the live values from solarsystem.js so hulls read the same as in flight.
 * - Scene dress: a local star shell of ~1500 points on a sphere of radius
 *   4000, additive, sizeAttenuation: false, mixed white/blue/warm colors.
 *
 * MODEL CACHING:
 * - Built models are cached in a Map by entry.id. build() is called at most
 *   once per entry. The cached object is never disposed; all geometries and
 *   materials in this project are module-shared and never disposed.
 * - build() may throw for a broken sculpt. The browser catches the error
 *   and shows it in the info bar instead of crashing. One broken sculpt must
 *   never break the browser.
 *
 * INTERACTION:
 * - Sidebar: text filter input, category tabs (ALL plus MODEL_CATEGORIES),
 *   and a scrollable list of filtered entries. Clicking selects the model.
 * - Viewport: OrbitControls with damping. Drag to orbit, wheel to zoom.
 * - Keydown (window, capture phase): Escape closes, ArrowDown/ArrowUp navigate
 *   the filtered list, KeyR re-frames the camera. Navigation keys are
 *   intercepted only when the filter input does NOT have focus.
 * - Per frame: clock advances, current model's update() is called (if any),
 *   star shell rotates slowly, controls.update() runs, then render.
 * - Auto-turntable: model rotates slowly on Y until user drags, then stops.
 *   Frozen under ctx.settings.reducedMotion.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MODEL_CATALOG, MODEL_CATEGORIES } from '../game/model-catalog.js';
import { FACTIONS } from '../game/state.js';
import { configureShipAssets } from './ship-assets.js';
import { applyShipLighting, addShipLightRig, applyShipToneMapping } from './ship-lighting.js';
import '../ui/models.css';

const STAR_COUNT = 1500;
const STAR_RADIUS = 4000;
const Z_INDEX = 80; // Above title (70), below fatal (99)

const CAMERA_FOV = 50;
const CAMERA_NEAR = 0.01;
const CAMERA_FAR = 100000;

const TURNTABLE_SPEED = 0.18; // rad per second

// The warm error/warning color (#ffb454) now lives in models.css as
// .rw-models-warn. It used to be an inline style on a markup string; the
// text-safe DOM path sets a class instead, so no JS constant is needed.

// aria-labelledby target for the dialog root.
const TITLE_ID = 'rw-models-title';

// Where focus goes when the overlay closes: the title entry that opened it
// (title.js). Missing on a direct ctx.models.open() call, which is fine.
const OPENER_ID = 'rw-title-models';

/**
 * Initialize the models browser.
 * Returns { update() {} } with no per-frame work.
 */
export function initModelsBrowser(ctx) {
  let overlayEl = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let starShell = null;
  let modelGroup = null;
  let rafId = null;
  let clock = null;

  const builtModels = new Map();
  const loadingModels = new Map();
  let currentEntry = null;
  let currentObject = null;
  let userHasInteracted = false; // stops auto-turntable on first drag
  let wasPausedBeforeOpen = false;
  let keydownListener = null;
  let openerEl = null; // element focus returns to on close

  let filterText = '';
  let selectedCategory = 'ALL';

  /**
   * Create the overlay DOM and its contents.
   * Called lazily on first open(); the DOM is kept for the session.
   */
  function createOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.className = 'rw-models';
    overlayEl.style.display = 'none';
    // The overlay is a modal in front of the title (title.js). Screen readers
    // need to know that, and the Tab trap below needs a root to trap inside.
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-labelledby', TITLE_ID);

    // Header
    const header = document.createElement('div');
    header.className = 'rw-models-head';
    const titleEl = document.createElement('div');
    titleEl.className = 'rw-models-title';
    titleEl.id = TITLE_ID;
    titleEl.textContent = 'MODELS';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'rw-models-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Main layout: sidebar + viewport
    const main = document.createElement('div');
    main.className = 'rw-models-main';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'rw-models-sidebar';

    // Filter input
    const filterDiv = document.createElement('div');
    filterDiv.className = 'rw-models-filter';
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Filter...';
    filterInput.className = 'rw-models-input';
    filterInput.addEventListener('input', (e) => {
      filterText = e.target.value.toLowerCase();
      renderEntryList();
    });
    filterDiv.appendChild(filterInput);

    // Category tabs
    const tabsDiv = document.createElement('div');
    tabsDiv.className = 'rw-models-tabs';
    const allTabs = ['ALL', ...MODEL_CATEGORIES];
    allTabs.forEach((cat) => {
      const tab = document.createElement('button');
      tab.className = 'rw-models-tab' + (cat === selectedCategory ? ' rw-selected' : '');
      tab.textContent = cat;
      tab.addEventListener('click', () => {
        selectedCategory = cat;
        updateTabSelection();
        renderEntryList();
      });
      tabsDiv.appendChild(tab);
    });

    // Entry list container
    const listDiv = document.createElement('div');
    listDiv.className = 'rw-models-list';
    sidebar.appendChild(filterDiv);
    sidebar.appendChild(tabsDiv);
    sidebar.appendChild(listDiv);

    // Legend
    const legendDiv = document.createElement('div');
    legendDiv.className = 'rw-models-legend';
    legendDiv.textContent = 'DRAG ORBIT — WHEEL ZOOM — ↑↓ SELECT — R RESET — ESC CLOSE';
    sidebar.appendChild(legendDiv);

    // Viewport
    const viewport = document.createElement('div');
    viewport.className = 'rw-models-viewport';

    // Info bar (overlay over viewport bottom). Selection, loading and error
    // copy all land here, so it announces politely rather than interrupting.
    const infoBar = document.createElement('div');
    infoBar.className = 'rw-models-info';
    infoBar.setAttribute('role', 'status');
    infoBar.setAttribute('aria-live', 'polite');
    viewport.appendChild(infoBar);

    main.appendChild(sidebar);
    main.appendChild(viewport);

    overlayEl.appendChild(header);
    overlayEl.appendChild(main);

    // Event delegation: stop input/bubbling to game canvas
    overlayEl.addEventListener('mousedown', (e) => e.stopPropagation());
    overlayEl.addEventListener('click', (e) => e.stopPropagation());
    overlayEl.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

    // Close button
    closeBtn.addEventListener('click', () => close());

    document.body.appendChild(overlayEl);

    // Cache references
    overlayEl._filterInput = filterInput;
    overlayEl._listDiv = listDiv;
    overlayEl._tabsDiv = tabsDiv;
    overlayEl._viewport = viewport;
    overlayEl._infoBar = infoBar;
  }

  /**
   * Initialize the Three.js scene, camera, renderer, and controls.
   * Called once on first open(); the renderer is kept for the session.
   */
  function initThree() {
    const viewport = overlayEl._viewport;

    // Create renderer with WebGL context
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      showFatalError('WebGL not available');
      return;
    }
    configureShipAssets(renderer);
    applyShipToneMapping(renderer);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    viewport.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    applyShipLighting(renderer, scene);

    // Camera
    const aspect = viewport.clientWidth / viewport.clientHeight;
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(0, 0, 20);

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.addEventListener('start', () => {
      userHasInteracted = true;
    });

    // Match the live system's key direction and its low ambient fill.
    addShipLightRig(scene);

    // Star shell
    buildStarShell();

    // Model pivot group (for turntable)
    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    clock = new THREE.Clock();

    // Window resize handler
    window.addEventListener('resize', onWindowResize);
  }

  /**
   * Build the local star shell.
   * ~1500 points on a sphere of radius 4000, additive, mixed colors.
   */
  function buildStarShell() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform point on sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = STAR_RADIUS;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Mix white/blue/warm
      const roll = Math.random();
      let color = new THREE.Color();
      if (roll < 0.5) {
        color.setHex(0xffffff); // white
      } else if (roll < 0.75) {
        color.setHex(0x6fd2e0); // accent cyan
      } else {
        color.setHex(0xffb454); // warm
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
      depthWrite: false,
    });

    starShell = new THREE.Points(geometry, material);
    starShell.frustumCulled = false;
    scene.add(starShell);
  }

  /**
   * Show a fatal error in the info bar.
   */
  function showFatalError(message) {
    if (!overlayEl || !overlayEl._infoBar) return;
    const bar = overlayEl._infoBar;
    bar.replaceChildren();
    const span = document.createElement('span');
    span.className = 'rw-models-warn';
    span.textContent = message;
    bar.appendChild(span);
  }

  /**
   * Window resize handler.
   */
  function onWindowResize() {
    if (!isOpen() || !renderer || !camera) return;

    const viewport = overlayEl._viewport;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;

    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  /**
   * Update the category tab selection visuals.
   */
  function updateTabSelection() {
    const tabs = overlayEl._tabsDiv.querySelectorAll('.rw-models-tab');
    tabs.forEach((tab) => {
      if (tab.textContent === selectedCategory) {
        tab.classList.add('rw-selected');
      } else {
        tab.classList.remove('rw-selected');
      }
    });
  }

  /**
   * Get the filtered list of entries.
   */
  function getFilteredEntries() {
    return MODEL_CATALOG.filter((entry) => {
      const matchesCategory = selectedCategory === 'ALL' || entry.category === selectedCategory;
      const matchesFilter = filterText === '' || entry.label.toLowerCase().includes(filterText);
      return matchesCategory && matchesFilter;
    });
  }

  /**
   * Render the entry list in the sidebar.
   */
  const entryButtons = new Map(); // Map from entry.id to button element
  function renderEntryList() {
    const listDiv = overlayEl._listDiv;
    listDiv.replaceChildren();
    entryButtons.clear();

    const entries = getFilteredEntries();
    entries.forEach((entry) => {
      const btn = document.createElement('button');
      btn.className = 'rw-models-entry';
      if (currentEntry === entry) {
        btn.classList.add('rw-selected');
      }
      btn.textContent = entry.label;
      btn.addEventListener('click', () => selectEntry(entry));
      listDiv.appendChild(btn);
      entryButtons.set(entry.id, btn);
    });
  }

  /**
   * Select an entry and show its model in the viewport.
   */
  function selectEntry(entry) {
    currentEntry = entry;
    userHasInteracted = false; // reset auto-turntable

    // Reset modelGroup rotation before adding new model
    if (modelGroup) {
      modelGroup.rotation.set(0, 0, 0);
    }

    // Update selection visuals (move the selected class, don't rebuild)
    const currentBtn = entryButtons.get(entry.id);
    if (currentBtn) {
      // Remove selected class from all buttons
      entryButtons.forEach((btn) => btn.classList.remove('rw-selected'));
      // Add selected class to current button
      currentBtn.classList.add('rw-selected');
      // Scroll button into view if needed
      currentBtn.scrollIntoView({ block: 'nearest' });
    } else {
      // Fallback: rebuild list if button not found
      renderEntryList();
    }

    // Clear previous model
    if (currentObject) {
      modelGroup.remove(currentObject);
      currentObject = null;
    }

    if (builtModels.has(entry.id)) {
      mountBuilt(entry, builtModels.get(entry.id));
      return;
    }
    if (entry.load) {
      showLoading(entry);
      let pending = loadingModels.get(entry.id);
      if (!pending) {
        pending = Promise.resolve(entry.load()).then((built) => {
          builtModels.set(entry.id, built);
          return built;
        }).finally(() => loadingModels.delete(entry.id));
        loadingModels.set(entry.id, pending);
      }
      pending.then((built) => {
        if (currentEntry === entry) mountBuilt(entry, built);
      }).catch((error) => {
        if (currentEntry === entry) showBuildError(entry, error);
      });
      return;
    }
    try {
      mountBuilt(entry, entry.build());
    } catch (error) {
      showBuildError(entry, error);
    }
  }

  function mountBuilt(entry, built) {
    if (!built?.object) {
      showBuildError(entry, new Error('Model loader returned no object'));
      return;
    }
    currentObject = built.object;
    modelGroup.add(currentObject);
    const stats = computeStats(currentObject);
    const { center, radius, size } = measureModel(currentObject);
    frameModel(center, radius, size);
    updateInfoBar(entry, stats, radius);
  }

  function showLoading(entry) {
    paintStatus(entry, 'Loading asset…');
  }

  /**
   * Show a build error in the info bar.
   */
  function showBuildError(entry, error) {
    // error.message is the least predictable string this file handles, so it
    // is set as TEXT. A sculpt that throws must never inject markup.
    paintStatus(entry, error?.message ? String(error.message) : 'Model failed to build');
  }

  /**
   * Paint the info bar as "<entry label> / <warm status line>".
   * Shared by the loading and error states so both stay text-safe.
   */
  function paintStatus(entry, message) {
    const infoBar = overlayEl._infoBar;
    infoBar.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'rw-models-error';
    const name = document.createElement('div');
    name.textContent = entry.label;
    const line = document.createElement('div');
    line.className = 'rw-models-warn';
    line.textContent = message;
    wrap.appendChild(name);
    wrap.appendChild(line);
    infoBar.appendChild(wrap);
  }

  /**
   * Compute mesh and triangle statistics for a model.
   */
  function computeStats(object) {
    let meshCount = 0;
    let triangleCount = 0;

    object.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        const geom = child.geometry;
        if (geom) {
          if (geom.index) {
            triangleCount += geom.index.count / 3;
          } else if (geom.attributes.position) {
            triangleCount += geom.attributes.position.count / 3;
          }
        }
      } else if (child.isPoints || child.isSprite) {
        meshCount++;
      }
    });

    return { meshCount, triangleCount: Math.round(triangleCount) };
  }

  /**
   * Measure a model's structural bounding box (excluding sprites).
   * Returns { center, radius, size } — `size` is the box extent, which framing
   * needs so a long hull is not framed as if it were a ball.
   */
  function measureModel(object) {
    object.updateMatrixWorld(true);

    const structuralBox = new THREE.Box3();
    let hasGeometry = false;

    object.traverse((child) => {
      if (child.isMesh || child.isPoints || child.isLine) {
        const childBox = new THREE.Box3().setFromObject(child);
        if (!childBox.isEmpty()) {
          structuralBox.union(childBox);
          hasGeometry = true;
        }
      }
    });

    // Fallback to full box if structural box is empty (e.g., sprite-only model)
    if (!hasGeometry) {
      const fullBox = new THREE.Box3().setFromObject(object);
      if (!fullBox.isEmpty()) {
        structuralBox.copy(fullBox);
      }
    }

    // Final fallback to radius 1 if still empty
    if (structuralBox.isEmpty()) {
      return { center: new THREE.Vector3(), radius: 1, size: new THREE.Vector3(2, 2, 2) };
    }

    const center = structuralBox.getCenter(new THREE.Vector3());
    const radius = structuralBox.getBoundingSphere(new THREE.Sphere()).radius;
    const size = structuralBox.getSize(new THREE.Vector3());
    return { center, radius, size };
  }

  /**
   * Frame the camera on a model.
   *
   * Fits the model's BOUNDING BOX to the frustum, not its bounding sphere. The
   * wave-49 ship charter spans a 6.8-unit scout to a 78-unit freighter, and a
   * sphere fit sizes the long hulls by their diagonal: the Veridian extraction
   * carrier framed to a 52-unit radius filled about a sixth of the viewport and
   * could not be reviewed. Projecting the box onto the camera basis and solving
   * for the tighter of the vertical and horizontal fits makes every model in the
   * ladder arrive at a comparable apparent size.
   */
  function frameModel(center, radius, size) {
    if (!controls || !camera) return;

    const safeRadius = radius > 0 && Number.isFinite(radius) ? radius : 1;

    controls.target.copy(center);

    // Default view direction is SIDE-BIASED, mostly +X. Every ship in this
    // project is built nose -Z / stern +Z, so the old (0.75, 0.42, 1) camera
    // looked down the length and a 78-unit freighter projected to almost
    // nothing however tightly the box was fitted. From the side the long axis
    // spans the viewport and the class silhouette is what a reviewer sees first.
    const direction = new THREE.Vector3(1, 0.42, 0.34).normalize();

    // Extent of the box as seen from `direction`: project the half-extents onto
    // the camera's right and up vectors. abs() on each term is the support
    // function of a box, so this is exact for any orientation.
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, direction).normalize();
    const camUp = new THREE.Vector3().crossVectors(direction, right).normalize();
    const ext = size && Number.isFinite(size.x)
      ? size : new THREE.Vector3(safeRadius * 2, safeRadius * 2, safeRadius * 2);
    const halfW = 0.5 * (Math.abs(ext.x * right.x) + Math.abs(ext.y * right.y) + Math.abs(ext.z * right.z));
    const halfH = 0.5 * (Math.abs(ext.x * camUp.x) + Math.abs(ext.y * camUp.y) + Math.abs(ext.z * camUp.z));

    const fovRad = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
    const aspect = camera.aspect > 0 ? camera.aspect : 1;
    const distV = halfH / Math.tan(fovRad);
    const distH = halfW / (Math.tan(fovRad) * aspect);
    // Half the box depth still has to clear the near plane once we are close.
    const halfD = 0.5 * (Math.abs(ext.x * direction.x) + Math.abs(ext.y * direction.y) + Math.abs(ext.z * direction.z));
    const distance = Math.max(distV, distH) * 1.12 + halfD;

    camera.position.copy(center).add(direction.multiplyScalar(distance));

    controls.minDistance = safeRadius * 0.02;
    controls.maxDistance = safeRadius * 60;

    controls.update();
  }

  /**
   * Update the info bar with entry stats.
   */
  function updateInfoBar(entry, stats, radius) {
    const infoBar = overlayEl._infoBar;
    const radiusStr = Number.isFinite(radius) ? radius.toFixed(1) : '?';
    infoBar.replaceChildren();

    const name = document.createElement('div');
    name.className = 'rw-models-name';
    name.textContent = entry.label;
    infoBar.appendChild(name);

    // The faction DISPLAY name, not the raw key. `beautiful` and `redledger`
    // are storage keys; a reader wants "Beautiful Ones" and "Red Ledger".
    // entry.faction is authored in model-catalog.js, but read it own-key
    // anyway so an unknown key degrades to no line instead of throwing.
    const factionName = entry.faction && Object.hasOwn(FACTIONS, entry.faction)
      ? FACTIONS[entry.faction].name : null;
    if (factionName) {
      const row = document.createElement('div');
      const span = document.createElement('span');
      span.className = 'rw-models-faction';
      span.textContent = factionName;
      row.appendChild(span);
      infoBar.appendChild(row);
    }

    const statsEl = document.createElement('div');
    statsEl.className = 'rw-models-stats';
    statsEl.textContent =
      `Meshes: ${stats.meshCount} | Tris: ${stats.triangleCount.toLocaleString()} | Radius: ${radiusStr}`;
    infoBar.appendChild(statsEl);
  }

  /**
   * Open the models browser overlay.
   */
  function open() {
    if (!overlayEl) {
      createOverlay();
    }
    if (isOpen()) {
      return; // already open
    }

    // Show overlay FIRST so renderer gets correct dimensions
    overlayEl.style.display = '';

    // Now initialize Three.js renderer (only on first open)
    if (!renderer) {
      initThree();
      if (!renderer) {
        // WebGL init failed - show error and stop here
        overlayEl._filterInput.focus();
        return;
      }
    }

    // Re-sync renderer size and camera aspect on every open
    onWindowResize();

    // Capture paused state before we change it
    wasPausedBeforeOpen = ctx.flags.paused;
    ctx.flags.paused = true;

    // Remember where focus came from so close() can put it back. Prefer the
    // live activeElement (the title button that was clicked); fall back to the
    // MODELS entry by id when open() was called directly.
    const active = document.activeElement;
    openerEl = active && active !== document.body && !overlayEl.contains(active)
      ? active : document.getElementById(OPENER_ID);

    overlayEl._filterInput.focus();

    // Register keydown listener in capture phase
    if (!keydownListener) {
      keydownListener = handleKeydown.bind(null);
      window.addEventListener('keydown', keydownListener, { capture: true });
    }

    // Select first entry in Ships category by default
    selectedCategory = 'Ships';
    updateTabSelection();
    const ships = MODEL_CATALOG.filter((e) => e.category === 'Ships');
    if (ships.length > 0) {
      selectEntry(ships[0]);
    } else {
      renderEntryList();
    }

    // Start animation loop
    startAnimationLoop();
  }

  /**
   * Close the models browser overlay.
   */
  function close() {
    if (!isOpen()) {
      return; // already closed
    }

    // Cancel animation loop
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Remove keydown listener
    if (keydownListener) {
      window.removeEventListener('keydown', keydownListener, { capture: true });
      keydownListener = null;
    }

    // Hide overlay
    if (overlayEl) {
      overlayEl.style.display = 'none';
    }

    // Restore paused state
    ctx.flags.paused = wasPausedBeforeOpen;

    // Return focus to whatever opened us. Fail closed: a detached or hidden
    // opener must not throw out of close().
    try {
      if (openerEl?.isConnected && typeof openerEl.focus === 'function') openerEl.focus();
    } catch { /* focus is a courtesy, never a failure path */ }
    openerEl = null;
  }

  /**
   * Focusable controls inside the overlay, in DOM order.
   * Used by the Tab trap. Hidden and disabled controls are skipped, and the
   * collapsed/empty list simply contributes no rows.
   */
  function focusables() {
    if (!overlayEl) return [];
    const nodes = overlayEl.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
    return Array.from(nodes).filter((el) => !el.disabled && el.offsetParent !== null);
  }

  /**
   * Trap Tab inside the dialog.
   *
   * Before this, handleKeydown's default branch swallowed every unhandled key
   * while the filter input was blurred, so Tab did nothing at all; and while
   * the input WAS focused Tab escaped to the title underneath. A modal has to
   * cycle. Returns true when the event was handled.
   */
  function trapTab(e) {
    const items = focusables();
    if (items.length === 0) return false;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = overlayEl.contains(active);

    e.preventDefault();
    e.stopImmediatePropagation();
    if (!inside) {
      (e.shiftKey ? last : first).focus();
      return true;
    }
    const index = items.indexOf(active);
    if (index === -1) {
      (e.shiftKey ? last : first).focus();
      return true;
    }
    const next = e.shiftKey
      ? (index === 0 ? last : items[index - 1])
      : (index === items.length - 1 ? first : items[index + 1]);
    next.focus();
    return true;
  }

  /**
   * Check if the browser is currently open.
   */
  function isOpen() {
    return overlayEl && overlayEl.style.display !== 'none';
  }

  /**
   * Keydown handler (capture phase).
   */
  function handleKeydown(e) {
    // Tab cycles inside the dialog from anywhere, including the filter input.
    if (e.code === 'Tab') {
      trapTab(e);
      return;
    }

    // Let filter input keys pass through when input is focused
    if (document.activeElement === overlayEl._filterInput) {
      // Intercept navigation keys and Escape
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        navigateList(e.code === 'ArrowDown' ? 1 : -1);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
      // Letters must reach the INPUT (this listener is window-capture).
      // Game shortcuts that listen on bubble (KeyP pause) must ignore
      // a focused text field — see main.js.
      return;
    }

    // Handle global shortcuts
    switch (e.code) {
      case 'Escape':
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
        break;

      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        e.stopImmediatePropagation();
        navigateList(e.code === 'ArrowDown' ? 1 : -1);
        break;

      case 'KeyR':
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          reframeCamera();
        }
        break;

      default:
        // Modal: do not let KeyP unpause the title sim under the overlay.
        e.preventDefault();
        e.stopImmediatePropagation();
        break;
    }
  }

  /**
   * Navigate the filtered list up or down.
   */
  function navigateList(direction) {
    const entries = getFilteredEntries();
    if (entries.length === 0) return;

    const currentIndex = entries.indexOf(currentEntry);
    if (currentIndex === -1) {
      selectEntry(entries[0]);
      return;
    }

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = entries.length - 1;
    if (nextIndex >= entries.length) nextIndex = 0;

    selectEntry(entries[nextIndex]);
  }

  /**
   * Re-frame the camera on the current model.
   */
  function reframeCamera() {
    if (!currentObject) return;

    // Reset modelGroup rotation before measuring
    if (modelGroup) {
      modelGroup.rotation.set(0, 0, 0);
    }

    const { center, radius, size } = measureModel(currentObject);
    frameModel(center, radius, size);
  }

  /**
   * Start the animation loop.
   */
  function startAnimationLoop() {
    if (rafId !== null) return; // already running
    if (!renderer) return; // WebGL init failed

    function loop() {
      rafId = requestAnimationFrame(loop);

      if (!isOpen() || !renderer || !scene || !camera || !controls) {
        rafId = null;
        return;
      }

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Update model animation if present
      if (currentObject && currentEntry) {
        const built = builtModels.get(currentEntry.id);
        if (built?.update) {
          built.update(elapsed, ctx.settings.reducedMotion, camera);
        }
      }

      // Auto-turntable (unless user has interacted or reducedMotion)
      if (modelGroup && !userHasInteracted && !ctx.settings.reducedMotion) {
        modelGroup.rotateY(TURNTABLE_SPEED * dt);
      }

      // Slowly rotate star shell (dt-based). Frozen under reducedMotion for
      // the same reason as the turntable above: it is ambient motion the
      // reviewer did not ask for, and the setting means ALL of it stops.
      if (starShell && !ctx.settings.reducedMotion) {
        starShell.rotation.y += 0.00002 * dt * 60; // normalize to ~60fps
        starShell.rotation.x += 0.000005 * dt * 60;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    loop();
  }

  // Assign ctx.models API
  ctx.models = {
    open,
    close,
    isOpen,
  };

  // Return update function (no-op — browser drives its own loop)
  return {
    update() {},
  };
}
