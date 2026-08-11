import * as THREE from 'three';
import { SYSTEMS } from '../game/state.js';
import { styleFor } from '../game/faction-style.js'; // wave 37: faction planet grading

/**
 * Solar system — procedural sun + orbiting planets centered on
 * ctx.config.world.sunPosition (the origin), built from
 * SYSTEMS[ctx.world.currentSystem] (§15.1 system identity).
 *
 * Wave 2: per-system rebuild. On ctx.lastEvents 'systemLoaded' { to } the
 * whole system (sun, light, glow, planets, orbit rings, ambient) is removed,
 * disposed, and regenerated from SYSTEMS[to]. def.worldSeed drives the seeded
 * mulberry32 generation, so each system is stable run-to-run and jump-to-jump.
 * Freehold (seed 11) reproduces the wave-1 amber system exactly; Veridian
 * (seed 47, cold white-blue sun) uses a colder corporate palette (§18.2).
 *
 * Ownership: adds/removes objects in ctx.scene, writes nothing shared. Never
 * touches ctx.camera, ctx.input, or ctx.ship. update() performs zero
 * allocations — all per-planet state (angle, radii, speeds, Vector3s) is
 * precomputed at build time.
 */

// Deterministic pseudo-random generator (mulberry32) so planet surfaces are
// stable frame-to-frame and run-to-run without Math.random() noise at runtime.
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Cheap procedural planet surface: horizontal color bands modulated by
 * sinusoidal "noise", plus a handful of darker/lighter spots. Rendered once
 * at build onto a small canvas and reused as the planet's diffuse map.
 */
function makePlanetTexture({ bands, seed }) {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const rng = makeRng(seed);

  // Base vertical band gradient.
  const grad = g.createLinearGradient(0, 0, 0, h);
  const [c1, c2, c3] = bands;
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Wavy horizontal bands (noise-ish via layered sines with random phases).
  const bandCount = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < bandCount; i++) {
    const y0 = rng() * h;
    const thickness = 3 + rng() * 14;
    const alpha = 0.12 + rng() * 0.22;
    const phase = rng() * Math.PI * 2;
    const freq = 1 + rng() * 3;
    const amp = 2 + rng() * 6;
    g.fillStyle = rng() < 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(0,0,0,${alpha})`;
    g.beginPath();
    g.moveTo(0, y0 + Math.sin(phase) * amp);
    for (let x = 0; x <= w; x += 8) {
      g.lineTo(x, y0 + Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp);
    }
    for (let x = w; x >= 0; x -= 8) {
      g.lineTo(
        x,
        y0 + thickness + Math.sin((x / w) * Math.PI * 2 * freq + phase) * amp,
      );
    }
    g.closePath();
    g.fill();
  }

  // Scattered spots / storms.
  const spotCount = 4 + Math.floor(rng() * 6);
  for (let i = 0; i < spotCount; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 3 + rng() * 12;
    const alpha = 0.15 + rng() * 0.25;
    g.fillStyle = rng() < 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(0,0,0,${alpha})`;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.4 + rng() * 0.4), 0, 0, Math.PI * 2);
    g.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

const _glowColor = new THREE.Color();

/** Additive radial-gradient sprite used as the sun's glow halo. */
function makeGlowTexture(sunColor) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');

  // Stops are derived from the system def's sun color: a near-white core
  // easing into the sun hue, so an amber sun glows amber and a white-blue
  // sun glows cold (§15.1 identity). Freehold (0xffe0b0) lands ≈ the wave-1
  // hand-tuned amber gradient.
  const rgb = (r, gg, b, a) => `rgba(${r | 0},${gg | 0},${b | 0},${a})`;
  _glowColor.set(sunColor);
  const { r, g: gr, b } = _glowColor;
  const coreR = r + (1 - r) * 0.6;
  const coreG = gr + (1 - gr) * 0.6;
  const coreB = b + (1 - b) * 0.6;

  const grad = g.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  grad.addColorStop(0, rgb(coreR * 255, coreG * 255, coreB * 255, 1));
  grad.addColorStop(0.25, rgb(r * 255, gr * 255, b * 255, 0.55));
  grad.addColorStop(0.6, rgb(r * 0.75 * 255, gr * 0.75 * 255, b * 0.75 * 255, 0.18));
  grad.addColorStop(1, rgb(r * 0.6 * 255, gr * 0.6 * 255, b * 0.6 * 255, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Faint orbit ring line for a given radius. */
function makeOrbitRing(radius) {
  const segments = 128;
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x8899bb,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

// Orbital slots: radius, orbit radius, axial tilt (rad), and per-faction band
// palettes (§18.2 faction grading). Geometry slots are the wave-1 table, so
// Freehold reproduces the current system exactly; Veridian (planetCount 3)
// fills the first three slots with a colder corporate palette.
// Angular/spin speeds are derived at build (Kepler-ish: outer orbits slower).
const SLOTS = [
  {
    radius: 9, orbitRadius: 250, tilt: 0.05,
    bands: {
      warm: ['#b08850', '#c9a06a', '#8a6a40'],
      cold: ['#9ab4c8', '#c2d4e2', '#6e8aa0'], // pale ice-stone
    },
  },
  {
    radius: 14, orbitRadius: 420, tilt: 0.4,
    bands: {
      warm: ['#d8b078', '#e8c898', '#b89058'],
      cold: ['#7fb8c4', '#a8d4dc', '#54858f'], // Veridian teal-white
    },
  },
  {
    radius: 16, orbitRadius: 640, tilt: 0.41,
    bands: {
      warm: ['#3a6a9a', '#5a8aba', '#2a4a6a'],
      cold: ['#3a5a7a', '#5a7a9a', '#24384e'], // deep steel blue
    },
  },
  {
    radius: 12, orbitRadius: 920, tilt: 0.44,
    bands: {
      warm: ['#a04830', '#c06848', '#78301e'],
      cold: ['#8a9ab0', '#aab8cc', '#5c6a80'], // slate chrome
    },
  },
  {
    radius: 30, orbitRadius: 1400, tilt: 0.1,
    bands: {
      warm: ['#c8a878', '#e0c498', '#987848'],
      cold: ['#b8c8d8', '#d8e4ee', '#8898ac'], // glacial gas giant
    },
  },
];

const _bandColor = new THREE.Color();
/** Wave 37: slot band palette for a faction — mood picks warm/cold base,
 *  tint multiplies each band (null tint = the pre-wave-37 colors). */
function bandsFor(slot, mood, tint) {
  const base = slot.bands[mood] ?? slot.bands.warm;
  if (!tint) return base;
  return base.map((hex) => '#' + _bandColor.set(hex).multiply(tint).getHexString());
}

/** Remove an object subtree from the scene and free GPU resources. */
function disposeObject(root) {  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });
  root.parent?.remove(root);
}

export function initSolarSystem(ctx) {
  // Mutable build state, swapped wholesale on rebuild.
  let root = null;
  let sun = null;
  let planets = [];

  function build(def) {
    root = new THREE.Group();
    root.position.copy(ctx.config.world.sunPosition);
    ctx.scene.add(root);

    // --- Sun ---
    sun = new THREE.Mesh(
      new THREE.SphereGeometry(def.sunRadius, 32, 24),
      new THREE.MeshBasicMaterial({ color: def.sunColor }),
    );
    root.add(sun);

    // Point light at the sun. decay: 0 keeps intensity constant with
    // distance so planets out at 1400 units are lit just like the inner ones
    // (physically correct decay: 2 would leave them pitch black).
    const sunLight = new THREE.PointLight(def.sunColor, 2.5, 0, 0);
    root.add(sunLight);

    // Faint ambient so night sides aren't pure black. Lives under root so a
    // single removal/dispose pass covers the whole system.
    const ambient = new THREE.AmbientLight(0x334455, 0.25);
    root.add(ambient);

    // Additive glow halo around the sun.
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(def.sunColor),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(def.sunRadius * 6);
    root.add(glow);

    // --- Planets ---
    // Kepler-ish angular speed: omega ∝ R^-1.5. Constant chosen so the
    // innermost planet (R=250) orbits in ~17 s and the outermost (R=1400)
    // in ~3.5 min.
    const ORBIT_K = 1500;
    // Wave 37: per-faction band grading from FACTION_STYLE — the base
    // warm/cold slot palette is chosen by planetMood (veridian→cold,
    // freehold→warm reproduces the pre-wave-37 look exactly), then
    // multiplied by planetTint so each faction's space carries its cast
    // (ferrous slate, congregation violet, gilded pale gold…). Null tint
    // is byte-identical to the old warm/cold path.
    const st = styleFor(def.faction);
    const mood = st.planetMood ?? 'warm';
    const tint = st.planetTint != null ? new THREE.Color(st.planetTint) : null;
    const count = Math.min(def.planetCount, SLOTS.length);
    planets = [];
    for (let i = 0; i < count; i++) {
      const slot = SLOTS[i];
      // Texture seed: worldSeed × slot index+1 — with Freehold's worldSeed 11
      // this reproduces wave 1's 11/22/33/44/55 seeds exactly.
      const seed = def.worldSeed * (i + 1);

      // Tilt group carries the constant axial tilt; the mesh spins inside it.
      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = slot.tilt;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(slot.radius, 24, 18),
        new THREE.MeshStandardMaterial({
          map: makePlanetTexture({ bands: bandsFor(slot, mood, tint), seed }),
          roughness: 0.9,
          metalness: 0.0,
        }),
      );
      tiltGroup.add(mesh);
      root.add(tiltGroup);
      root.add(makeOrbitRing(slot.orbitRadius));

      const rng = makeRng(seed * 7919);
      planets.push({
        mesh,
        tiltGroup,
        orbitRadius: slot.orbitRadius,
        angle: rng() * Math.PI * 2,                    // random start phase
        angularSpeed: ORBIT_K * Math.pow(slot.orbitRadius, -1.5),
        spinSpeed: 0.3 + rng() * 0.9,                  // rad/s self-rotation
      });
    }
  }

  function rebuild(to) {
    disposeObject(root);
    build(SYSTEMS[to]);
  }

  build(SYSTEMS[ctx.world.currentSystem]);

  // --- Per-frame update: revolve + spin. Zero allocations. ---
  function update(dt) {
    // System swap (jump.js emits at the jump midpoint; consumed next frame).
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      const ev = ctx.lastEvents[i];
      if (ev.type === 'systemLoaded') {
        rebuild(ev.to);
        break; // one rebuild per frame is enough
      }
    }

    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      p.angle += p.angularSpeed * dt;
      p.tiltGroup.position.set(
        Math.cos(p.angle) * p.orbitRadius,
        0,
        Math.sin(p.angle) * p.orbitRadius,
      );
      p.mesh.rotation.y += p.spinSpeed * dt;
    }
    // Slow sun rotation (subtle surface shimmer via the glow is billboarded,
    // so this is purely cosmetic on the sphere itself).
    sun.rotation.y += 0.05 * dt;
  }

  return { update };
}
/**
 * Standalone star model for the Models Browser.
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildStarModel(systemId = 'freehold') {
  const def = SYSTEMS[systemId];
  if (!def) {
    throw new Error(`Unknown system: ${systemId}`);
  }

  const group = new THREE.Group();

  // Sun mesh
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(def.sunRadius, 32, 24),
    new THREE.MeshBasicMaterial({ color: def.sunColor }),
  );
  group.add(sun);

  // Glow halo
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(def.sunColor),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(def.sunRadius * 6);
  group.add(glow);

  // Slow rotation matching the live sun
  function update(elapsed, reducedMotion) {
    const dt = 0.016; // Fixed timestep for deterministic rendering
    sun.rotation.y += 0.05 * dt;
  }

  return {
    object: group,
    update,
    label: `${def.name} Star`,
  };
}

/**
 * Standalone planet model for the Models Browser.
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildPlanetModel(systemId = 'freehold', slotIndex = 0) {
  const def = SYSTEMS[systemId];
  const slot = SLOTS[slotIndex];

  if (!def) {
    throw new Error(`Unknown system: ${systemId}`);
  }
  if (!slot) {
    throw new Error(`Invalid slot index: ${slotIndex}`);
  }

  // Tilt group for axial tilt
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = slot.tilt;

  // Planet mesh with faction-specific band palette
  const seed = def.worldSeed * (slotIndex + 1);
  const st = styleFor(def.faction);
  const mood = st.planetMood ?? 'warm';
  const tint = st.planetTint != null ? new THREE.Color(st.planetTint) : null;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(slot.radius, 24, 18),
    new THREE.MeshStandardMaterial({
      map: makePlanetTexture({ bands: bandsFor(slot, mood, tint), seed }),
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  tiltGroup.add(mesh);

  // Spin speed (reuses the live path's rng logic)
  const rng = makeRng(seed * 7919);
  const spinSpeed = 0.3 + rng() * 0.9;

  // Spin-only update (no orbit; model sits at origin)
  function update(elapsed, reducedMotion) {
    const dt = 0.016; // Fixed timestep
    mesh.rotation.y += spinSpeed * dt;
  }

  return {
    object: tiltGroup,
    update,
    label: `${def.name} — planet ${slotIndex + 1}`,
  };
}

/** Number of available planet slots for enumeration. */
export const PLANET_SLOT_COUNT = SLOTS.length;
