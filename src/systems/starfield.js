import * as THREE from 'three';

/**
 * Deep-space backdrop: layered starfield + faint ambient light.
 *
 * - Stars live on sphere shells centered on the world origin (the solar
 *   system's scale is far smaller than the shell radius, so parallax vs.
 *   the ship is negligible and the shells never need re-centering).
 * - Both layers sit inside the camera far plane (20000).
 * - Attached to ctx.scene (NOT the ship) so stars never inherit ship rotation.
 * - Wave-6 polish: each layer also gets a SUBTLE parallax response — its
 *   position accumulates a small negative fraction of ctx.ship.velocity
 *   (nearer shell moves more), reset on 'systemLoaded'. Suppressed under
 *   ctx.settings.reducedMotion (shells stay centered = base look). Rim-band
 *   sparseness (§15 designed silence): star opacity scales with the current
 *   system's band — 0 full, 1 ×0.8, 2 ×0.55 — via material opacity on band
 *   change, no rebuilds.
 * - update() writes layer positions/opacity in place; zero allocations.
 */

const DRIFT_SPEED = 0.0005; // rad/s around Y — barely-there parallax life

/** Soft circular sprite, generated once on a canvas (no external assets). */
function createStarSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const gradient = g.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Mostly white, some blue, some warm; subtle per-star brightness falloff. */
function randomStarColor(target) {
  const r = Math.random();
  if (r < 0.7) target.setRGB(1, 1, 1);
  else if (r < 0.87) target.setRGB(0.7, 0.8, 1);
  else target.setRGB(1, 0.85, 0.7);
  return target.multiplyScalar(0.55 + Math.random() * 0.45);
}

function buildStarLayer({ count, minRadius, maxRadius, size, opacity, texture }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const dir = new THREE.Vector3();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    dir.randomDirection();
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    positions[i * 3] = dir.x * radius;
    positions[i * 3 + 1] = dir.y * radius;
    positions[i * 3 + 2] = dir.z * radius;

    randomStarColor(color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    map: texture,
    vertexColors: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: false, // constant pixel size — crisp distant stars
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // shell surrounds the camera; culling is wrong here
  return points;
}

// Rim-band sparseness (§15): opacity multiplier per band — the rim feels emptier.
const BAND_OPACITY = [1.0, 0.8, 0.55, 0.35];

export function initStarfield(ctx) {
  const texture = createStarSprite();

  const group = new THREE.Group();
  group.name = 'starfield';

  // Depth layers with per-layer parallax response (wave-6): the nearer
  // shell counters ship velocity more strongly. Layer positions are
  // mutated in place — no allocation, no rebuilds.
  const layers = [
    {
      // Primary layer: bright, varied stars on a near shell.
      points: buildStarLayer({
        count: 4500,
        minRadius: 8000,
        maxRadius: 9000,
        size: 2.4,
        opacity: 1.0,
        texture,
      }),
      baseOpacity: 1.0,
      parallax: 0.02,
    },
    {
      // Depth layer: farther, fainter, smaller dust of stars.
      points: buildStarLayer({
        count: 2500,
        minRadius: 12000,
        maxRadius: 16000,
        size: 1.4,
        opacity: 0.45,
        texture,
      }),
      baseOpacity: 0.45,
      parallax: 0.008,
    },
  ];
  for (let i = 0; i < layers.length; i++) group.add(layers[i].points);

  ctx.scene.add(group);

  // Faint ambient so unlit geometry faces aren't pure black.
  ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  let bandApplied = -1; // force the first opacity application

  return {
    update(dt) {
      group.rotation.y += DRIFT_SPEED * dt;

      // System swap: reset parallax offsets (the old system's accumulated
      // displacement is meaningless here) and re-apply band opacity.
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        if (ctx.lastEvents[i].type === 'systemLoaded') {
          for (let j = 0; j < layers.length; j++) layers[j].points.position.set(0, 0, 0);
          bandApplied = -1;
          break;
        }
      }

      // Band-aware sparseness: scale star opacity on band change only.
      const sys = ctx.systems?.[ctx.world.currentSystem];
      const band = sys?.band ?? 0;
      if (band !== bandApplied) {
        bandApplied = band;
        const mult = BAND_OPACITY[band] ?? 1;
        for (let i = 0; i < layers.length; i++) {
          layers[i].points.material.opacity = layers[i].baseOpacity * mult;
        }
      }

      // Parallax: accumulate a small negative fraction of ship velocity
      // into each shell's position (offset ∝ displacement from the system
      // origin — proper, subtle backdrop parallax). reducedMotion → shells
      // stay centered, i.e. the base look.
      const reduced = ctx.settings?.reducedMotion === true;
      const vel = ctx.ship?.velocity;
      for (let i = 0; i < layers.length; i++) {
        const pts = layers[i].points;
        if (reduced || !vel) {
          if (pts.position.x !== 0 || pts.position.y !== 0 || pts.position.z !== 0) {
            pts.position.set(0, 0, 0);
          }
          continue;
        }
        pts.position.addScaledVector(vel, -layers[i].parallax * dt);
      }
    },
  };
}
