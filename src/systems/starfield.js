import * as THREE from 'three';

/**
 * Deep-space backdrop: layered starfield + faint ambient light.
 *
 * - Stars live on sphere shells centered on the world origin (the solar
 *   system's scale is far smaller than the shell radius, so parallax vs.
 *   the ship is negligible and the shells never need re-centering).
 * - Both layers sit inside the camera far plane (20000).
 * - Attached to ctx.scene (NOT the ship) so stars never inherit ship rotation.
 * - update() only advances a slow drift rotation; zero per-frame allocations.
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

export function initStarfield(ctx) {
  const texture = createStarSprite();

  const group = new THREE.Group();
  group.name = 'starfield';

  // Primary layer: bright, varied stars on a near shell.
  group.add(buildStarLayer({
    count: 4500,
    minRadius: 8000,
    maxRadius: 9000,
    size: 2.4,
    opacity: 1.0,
    texture,
  }));

  // Depth layer: farther, fainter, smaller dust of stars.
  group.add(buildStarLayer({
    count: 2500,
    minRadius: 12000,
    maxRadius: 16000,
    size: 1.4,
    opacity: 0.45,
    texture,
  }));

  ctx.scene.add(group);

  // Faint ambient so unlit geometry faces aren't pure black.
  ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  return {
    update(dt) {
      group.rotation.y += DRIFT_SPEED * dt;
    },
  };
}
