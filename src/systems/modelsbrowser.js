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
import '../ui/models.css';

const STAR_COUNT = 1500;
const STAR_RADIUS = 4000;
const Z_INDEX = 80; // Above title (70), below fatal (99)

const CAMERA_FOV = 50;
const CAMERA_NEAR = 0.01;
const CAMERA_FAR = 100000;

const TURNTABLE_SPEED = 0.18; // rad per second

// Warm color for errors/info bar warnings
const WARM_COLOR = 0xffb454;

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
  let currentEntry = null;
  let currentObject = null;
  let userHasInteracted = false; // stops auto-turntable on first drag
  let wasPausedBeforeOpen = false;
  let keydownListener = null;

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

    // Header
    const header = document.createElement('div');
    header.className = 'rw-models-head';
    header.innerHTML = `
      <div class="rw-models-title">MODELS</div>
      <button class="rw-models-close" aria-label="Close">✕</button>
    `;

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

    // Info bar (overlay over viewport bottom)
    const infoBar = document.createElement('div');
    infoBar.className = 'rw-models-info';
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
    header.querySelector('.rw-models-close').addEventListener('click', () => close());

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    viewport.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();

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

    // Lighting — matches solarsystem.js live values
    const keyLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
    keyLight.position.set(100, 80, 100);
    scene.add(keyLight);

    const ambientLight = new THREE.AmbientLight(0x334455, 0.25);
    scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x8899aa, 0.15);
    fillLight.position.set(-80, -40, -100);
    scene.add(fillLight);

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
    if (overlayEl && overlayEl._infoBar) {
      overlayEl._infoBar.innerHTML = `<span style="color:#${WARM_COLOR.toString(16)}">${message}</span>`;
    }
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
    listDiv.innerHTML = '';
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

    // Get or build the model (cache the whole { object, update } record)
    let built;
    if (builtModels.has(entry.id)) {
      built = builtModels.get(entry.id);
    } else {
      try {
        built = entry.build();
        builtModels.set(entry.id, built);
      } catch (e) {
        showBuildError(entry, e);
        return;
      }
    }

    if (!built || !built.object) {
      showBuildError(entry, new Error('build() returned null or missing object'));
      return;
    }

    currentObject = built.object;
    modelGroup.add(currentObject);

    // Compute stats and structural bounding box
    const stats = computeStats(currentObject);
    const { center, radius } = measureModel(currentObject);

    // Reframe camera
    frameModel(center, radius);

    // Update info bar
    updateInfoBar(entry, stats, radius);
  }

  /**
   * Show a build error in the info bar.
   */
  function showBuildError(entry, error) {
    const infoBar = overlayEl._infoBar;
    infoBar.innerHTML = `
      <div class="rw-models-error">
        <div>${entry.label}</div>
        <div style="color:#${WARM_COLOR.toString(16)}">${error.message}</div>
      </div>
    `;
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
   * Returns { center, radius } for framing the camera.
   */
  function measureModel(object) {
    object.updateMatrixWorld(true);

    const structuralBox = new THREE.Box3();
    let hasGeometry = false;

    object.traverse((child) => {
      if (child.isMesh || child.isPoints) {
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
      return { center: new THREE.Vector3(), radius: 1 };
    }

    const center = structuralBox.getCenter(new THREE.Vector3());
    const radius = structuralBox.getBoundingSphere(new THREE.Sphere()).radius;
    return { center, radius };
  }

  /**
   * Frame the camera on a model.
   */
  function frameModel(center, radius) {
    if (!controls || !camera) return;

    // Use a fallback radius for degenerate/empty models
    const safeRadius = radius > 0 && Number.isFinite(radius) ? radius : 1;

    controls.target.copy(center);

    // Position camera at a pleasing angle
    const direction = new THREE.Vector3(0.75, 0.42, 1).normalize();
    const fovRad = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
    const distance = (safeRadius / Math.sin(fovRad)) * 1.35;

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
    const factionLine = entry.faction ? `<span class="rw-models-faction">${entry.faction}</span>` : '';
    const radiusStr = Number.isFinite(radius) ? radius.toFixed(1) : '?';

    infoBar.innerHTML = `
      <div class="rw-models-name">${entry.label}</div>
      ${factionLine ? `<div>${factionLine}</div>` : ''}
      <div class="rw-models-stats">
        Meshes: ${stats.meshCount} | Tris: ${stats.triangleCount.toLocaleString()} | Radius: ${radiusStr}
      </div>
    `;
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

    const { center, radius } = measureModel(currentObject);
    frameModel(center, radius);
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
          built.update(elapsed, ctx.settings.reducedMotion);
        }
      }

      // Auto-turntable (unless user has interacted or reducedMotion)
      if (modelGroup && !userHasInteracted && !ctx.settings.reducedMotion) {
        modelGroup.rotateY(TURNTABLE_SPEED * dt);
      }

      // Slowly rotate star shell (dt-based)
      if (starShell) {
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
