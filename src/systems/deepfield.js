import * as THREE from 'three';
import { SYSTEMS } from '../game/state.js';
import { styleFor } from '../game/faction-style.js';
import { withoutGlobalRandom } from '../game/random-scope.js';

/**
 * Deep field — deterministic distant scenery beyond the playable bubble
 * (issue #338, system scale/population Phase 1).
 *
 * Per-system content lives at 1,800–8,000 u from the sun: planet silhouettes,
 * an optional companion star, ring/megastructure silhouettes, a beacon chain
 * with distant station lights, and low-opacity nebula sprites. It is static or
 * very slowly rotating presentation only: no collision, no AI, no save data,
 * no persistent field, no ctx field. It rebuilds from SYSTEMS[to] on
 * 'systemLoaded' and disposes every geometry/material/texture it owns first
 * (the boot resource-delta guard watches scene-reachable resources).
 *
 * Budget: ≤20 draw calls and ≤30k triangles (issue #338). The build publishes
 * the measured counts on root.userData.deepfield for tests; the values are
 * derived from the objects actually added, so a traversal cannot disagree.
 *
 * reducedMotion parity: every rotation stops when
 * ctx.settings.reducedMotion is true (the scene still exists; it is static).
 *
 * Determinism: content is driven by a mulberry32 stream seeded from
 * def.worldSeed; no Math.random, no wall-clock input. A given system rebuilds
 * identically run-to-run. update() allocates nothing.
 */

const BAND_MIN = 1800;
const BAND_MAX = 8000;
const RNG_SALT = 0x9e370000;

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

function tinted(hex, mult) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(mult);
  return c;
}

/**
 * One soft radial sprite texture shared by every additive sprite in the
 * build (companion star + nebulae). White so each material's color owns the
 * hue; this keeps the per-build texture count at one and makes disposal a
 * single, deduped operation.
 */
function makeSoftTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Actual triangles in a geometry, matching a renderer traversal count. */
function triangleCount(geometry) {
  if (!geometry) return 0;
  if (geometry.index) return geometry.index.count / 3;
  return (geometry.attributes.position?.count ?? 0) / 3;
}

/** Remove the subtree from the scene and dispose every owned resource once. */
function disposeObject(root) {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry);
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (let i = 0; i < mats.length; i++) {
      const mat = mats[i];
      if (!mat) continue;
      materials.add(mat);
      for (const key of Object.keys(mat)) {
        const value = mat[key];
        if (value && value.isTexture) textures.add(value);
      }
    }
  });
  for (const geo of geometries) geo.dispose();
  for (const tex of textures) tex.dispose();
  for (const mat of materials) mat.dispose();
  root.parent?.remove(root);
}

/** Random point in the deep-field band: sparse, mostly near the ecliptic. */
function placeInBand(rng, min, max) {
  const angle = rng() * Math.PI * 2;
  const dist = min + rng() * (max - min);
  const elev = (rng() - 0.5) * 0.5;
  return new THREE.Vector3(
    Math.cos(angle) * dist,
    Math.sin(elev) * dist * 0.25,
    Math.sin(angle) * dist,
  );
}

/**
 * Planet silhouette with baked dark-side shading. Vertex colors are derived
 * from each surface normal against the direction to the sun, so the body reads
 * as a distant world instead of a flat disc while staying one MeshBasicMaterial
 * draw call (no lights, no PBR, no per-frame work).
 */
function buildPlanetSilhouette(rng, style, index) {
  const radius = 90 + rng() * 210;
  const geometry = new THREE.SphereGeometry(radius, 16, 12);
  const position = placeInBand(rng, 1800, 6800);
  const toSun = new THREE.Vector3(-position.x, -position.y, -position.z).normalize();
  const baseHex = index % 2 === 0
    ? (style?.hull ?? 0x6a7076)
    : (style?.planetTint ?? style?.accent ?? 0x9aa7b8);
  const base = tinted(baseHex, 0.34 + rng() * 0.20);

  const normals = geometry.attributes.normal;
  const colors = new Float32Array(normals.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < normals.count; i++) {
    n.fromBufferAttribute(normals, i);
    const shade = 0.08 + 0.62 * Math.max(0, n.dot(toSun));
    colors[i * 3 + 0] = base.r * shade;
    colors[i * 3 + 1] = base.g * shade;
    colors[i * 3 + 2] = base.b * shade;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  mesh.position.copy(position);
  mesh.rotation.y = rng() * Math.PI * 2;
  mesh.frustumCulled = true; // static world-space body; cull like any scenery
  return { mesh, radius, triangles: triangleCount(geometry) };
}

export function initDeepField(ctx) {
  let root = null;
  const spinners = []; // { mesh, speed } — slow silhouette rotation only

  function build(def) {
    // Scene construction consumes global Math.random via THREE UUIDs; keep the
    // harness's seeded content stream byte-identical (issue #338).
    withoutGlobalRandom(() => {
    root = new THREE.Group();
    root.name = 'deepfield';
    root.position.copy(ctx.config.world.sunPosition);
    ctx.scene.add(root);

    const rng = makeRng(RNG_SALT + ((def.worldSeed | 0) >>> 0));
    const style = styleFor(def.faction);
    const accent = style?.accent ?? 0x9aa7b8;
    const glow = style?.glow ?? 0xffa54a;
    const beacon = style?.beacon ?? 0xffdca0;
    const texture = makeSoftTexture();
    const counts = {
      system: def.id,
      worldSeed: def.worldSeed,
      planets: 0,
      rings: 0,
      nebula: 0,
      beaconNodes: 0,
      stationLights: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 1,
    };

    // --- 2–4 planet silhouettes -------------------------------------------
    counts.planets = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < counts.planets; i++) {
      const planet = buildPlanetSilhouette(rng, style, i);
      planet.mesh.name = 'deepfield-planet-' + i;
      root.add(planet.mesh);
      spinners.push({ mesh: planet.mesh, speed: 0.004 + rng() * 0.012 });
      counts.drawCalls += 1;
      counts.triangles += planet.triangles;
    }

    // --- Optional companion-star sprite -----------------------------------
    if (rng() < 0.55 || def.band >= 2) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        color: tinted(def.sunColor ?? 0xffe0b0, 1.0),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }));
      sprite.name = 'deepfield-companion';
      sprite.position.copy(placeInBand(rng, 5200, BAND_MAX));
      sprite.scale.setScalar(220 + rng() * 380);
      sprite.frustumCulled = true;
      root.add(sprite);
      counts.drawCalls += 1;
      counts.triangles += 2;
    }

    // --- 1–2 ring / megastructure silhouettes -----------------------------
    counts.rings = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < counts.rings; i++) {
      const ringRadius = 120 + rng() * 260;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius, 2 + rng() * 6, 6, 48),
        new THREE.MeshBasicMaterial({ color: tinted(i % 2 ? glow : accent, 0.22 + rng() * 0.12) }),
      );
      ring.name = 'deepfield-ring-' + i;
      ring.position.copy(placeInBand(rng, 2400, 7200));
      ring.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      ring.frustumCulled = true;
      root.add(ring);
      counts.drawCalls += 1;
      counts.triangles += triangleCount(ring.geometry);
    }

    // --- Beacon chain + distant station lights, ONE Points layer ----------
    // Beacon nodes and station lights share a single Points geometry/draw call
    // (issue #338). A faint LineSegments chain connects the nodes so the chain
    // still reads as a lane rather than a random scatter; it is one extra draw
    // call and zero triangles.
    const beaconDir = new THREE.Vector3(
      Math.cos(rng() * Math.PI * 2), (rng() - 0.5) * 0.2, Math.sin(rng() * Math.PI * 2),
    ).normalize();
    const beaconStart = 1900 + rng() * 500;
    const beaconEnd = 5800 + rng() * 1500;
    counts.beaconNodes = 8;
    const beaconPoints = [];
    for (let i = 0; i < counts.beaconNodes; i++) {
      const t = i / (counts.beaconNodes - 1);
      const dist = beaconStart + (beaconEnd - beaconStart) * t;
      const p = beaconDir.clone().multiplyScalar(dist);
      p.y += Math.sin(t * Math.PI * 3) * 120;
      beaconPoints.push(p);
    }

    const chainPositions = new Float32Array((counts.beaconNodes - 1) * 6);
    for (let i = 1; i < counts.beaconNodes; i++) {
      const q = beaconPoints[i - 1];
      const p = beaconPoints[i];
      const o = (i - 1) * 6;
      chainPositions[o + 0] = q.x;
      chainPositions[o + 1] = q.y;
      chainPositions[o + 2] = q.z;
      chainPositions[o + 3] = p.x;
      chainPositions[o + 4] = p.y;
      chainPositions[o + 5] = p.z;
    }
    const chainGeo = new THREE.BufferGeometry();
    chainGeo.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
    const chain = new THREE.LineSegments(chainGeo, new THREE.LineBasicMaterial({
      color: tinted(glow, 0.9),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }));
    chain.name = 'deepfield-beacons';
    chain.frustumCulled = true;
    root.add(chain);
    counts.drawCalls += 1;

    counts.stationLights = 6 + Math.floor(rng() * 7);
    const lightTotal = counts.beaconNodes + counts.stationLights;
    const lightPos = new Float32Array(lightTotal * 3);
    const lightCol = new Float32Array(lightTotal * 3);
    const lightColor = new THREE.Color();
    for (let i = 0; i < counts.beaconNodes; i++) {
      const node = beaconPoints[i];
      lightPos[i * 3 + 0] = node.x;
      lightPos[i * 3 + 1] = node.y;
      lightPos[i * 3 + 2] = node.z;
      lightColor.copy(tinted(beacon, 0.85 + rng() * 0.15));
      lightCol[i * 3 + 0] = lightColor.r;
      lightCol[i * 3 + 1] = lightColor.g;
      lightCol[i * 3 + 2] = lightColor.b;
    }
    for (let i = 0; i < counts.stationLights; i++) {
      const node = beaconPoints[i % beaconPoints.length];
      const jitter = 60 + rng() * 160;
      const o = (counts.beaconNodes + i) * 3;
      lightPos[o + 0] = node.x + (rng() - 0.5) * jitter;
      lightPos[o + 1] = node.y + (rng() - 0.5) * jitter;
      lightPos[o + 2] = node.z + (rng() - 0.5) * jitter;
      lightColor.copy(tinted(i % 3 === 0 ? glow : accent, 0.7 + rng() * 0.3));
      lightCol[o + 0] = lightColor.r;
      lightCol[o + 1] = lightColor.g;
      lightCol[o + 2] = lightColor.b;
    }
    const lightGeo = new THREE.BufferGeometry();
    lightGeo.setAttribute('position', new THREE.BufferAttribute(lightPos, 3));
    lightGeo.setAttribute('color', new THREE.BufferAttribute(lightCol, 3));
    const lights = new THREE.Points(lightGeo, new THREE.PointsMaterial({
      size: 16,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    lights.name = 'deepfield-lights';
    lights.frustumCulled = true;
    root.add(lights);
    counts.drawCalls += 1;

    // --- 3–6 low-opacity nebula sprites -----------------------------------
    counts.nebula = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < counts.nebula; i++) {
      const nebula = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        color: tinted(i % 2 ? glow : accent, 1.0),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.06 + rng() * 0.08,
        depthWrite: false,
      }));
      nebula.name = 'deepfield-nebula-' + i;
      nebula.position.copy(placeInBand(rng, 2800, BAND_MAX));
      nebula.scale.setScalar(700 + rng() * 1800);
      nebula.frustumCulled = true;
      root.add(nebula);
      counts.drawCalls += 1;
      counts.triangles += 2;
    }

    root.userData.deepfield = counts;
    });
  }

  function rebuild(to) {
    disposeObject(root);
    root = null;
    spinners.length = 0;
    const def = SYSTEMS[to];
    if (!def) return;
    build(def);
  }

  function update(dt) {
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      if (ctx.lastEvents[i].type === 'systemLoaded') {
        rebuild(ctx.lastEvents[i].to);
        break; // one rebuild per frame is enough
      }
    }
    if (!root) return;
    if (ctx.settings?.reducedMotion === true) return; // static under reduced motion
    root.rotation.y += 0.0015 * dt; // barely-there drift; no per-frame allocation
    for (let i = 0; i < spinners.length; i++) {
      spinners[i].mesh.rotation.y += spinners[i].speed * dt;
    }
  }

  const initial = SYSTEMS[ctx.world.currentSystem];
  if (initial) build(initial);
  return { update };
}
