import * as THREE from 'three';
import { SYSTEMS, JUMP } from '../game/state.js';

/**
 * Jump gate — the Lamplighter Guild transit ring in the current system.
 *
 * Visual: a ~30u-radius rotating torus ring with inner chevron markers, an
 * additive amber/brass glow (Lamplighter palette: worn brass, lamplight
 * amber), and a pulsing beacon. Oriented so the ring faces the system
 * center. Distinct silhouette from 500+u.
 *
 * Ownership: writes ctx.gate.inZone only (jumping/progress/destination are
 * jump.js's). Emits 'jumpRequested' { to } when the player presses dock (D)
 * inside JUMP.zone while undocked and not already jumping. Reads
 * ctx.input.dockPressed, ctx.flags.docked, ctx.ship.object — never writes
 * them. On 'systemLoaded' (seen via ctx.lastEvents) the gate repositions
 * for the new current system.
 *
 * Jump visual (driven by jump.js's ctx.gate fields): a full-screen black
 * fade — in over the first 40% of progress, out over the last 40% — plus a
 * centered 'JUMP' label naming the destination. The overlay div is created
 * once at init and hidden otherwise. Gate glow intensifies during charge.
 *
 * update() performs zero allocations: gate position is a preallocated
 * Vector3, overlay style/text are only touched on state changes.
 */

// Lamplighter palette (§16): worn brass structure, lamplight amber glow.
const BRASS = 0x8a6a34;
const BRASS_DARK = 0x5a4422;
const AMBER = 0xffb84d;
const AMBER_HOT = 0xffd890;

const RING_RADIUS = 30;
const RING_TUBE = 2.2;
const CHEVRON_COUNT = 8;
const SPIN_SPEED = 0.25; // rad/s, slow

/** Additive radial-gradient sprite texture for the gate glow/beacon. */
function makeGlowTexture(inner, outer) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(255,150,50,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function initGate(ctx) {
  const root = new THREE.Group();
  ctx.scene.add(root);

  // --- Ring (brass, slightly emissive so it reads against deep space) ---
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48),
    new THREE.MeshStandardMaterial({
      color: BRASS,
      emissive: AMBER,
      emissiveIntensity: 0.25,
      roughness: 0.55,
      metalness: 0.8,
    }),
  );
  root.add(ring);

  // --- Inner chevron markers: radial inward-pointing cones around the bore ---
  const chevrons = new THREE.Group();
  const chevronGeo = new THREE.ConeGeometry(1.6, 5, 4);
  const chevronMat = new THREE.MeshStandardMaterial({
    color: BRASS_DARK,
    emissive: AMBER_HOT,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.6,
  });
  const chevronRadius = RING_RADIUS - RING_TUBE - 3;
  for (let i = 0; i < CHEVRON_COUNT; i++) {
    const a = (i / CHEVRON_COUNT) * Math.PI * 2;
    const c = new THREE.Mesh(chevronGeo, chevronMat);
    c.position.set(Math.cos(a) * chevronRadius, Math.sin(a) * chevronRadius, 0);
    // Cone +Y is the tip; rotate so the tip points at the ring center.
    c.rotation.z = a + Math.PI / 2;
    chevrons.add(c);
  }
  root.add(chevrons);

  // --- Additive amber glow filling the bore (the "lamplight") ---
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('rgba(255,220,150,0.9)', 'rgba(255,170,70,0.35)'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  const glowBaseScale = RING_RADIUS * 3.2;
  glow.scale.setScalar(glowBaseScale);
  root.add(glow);

  // --- Pulsing beacon riding the ring ---
  const beacon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture('rgba(255,240,200,1)', 'rgba(255,190,90,0.5)'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  const beaconBaseScale = 10;
  beacon.position.set(0, RING_RADIUS + RING_TUBE + 2, 0);
  beacon.scale.setScalar(beaconBaseScale);
  root.add(beacon);

  // --- Placement (rebuilt on 'systemLoaded') ---
  const gatePos = new THREE.Vector3(); // preallocated; per-frame distance checks
  let destinationId = null; // current system's gate destination

  function configure() {
    const def = SYSTEMS[ctx.world.currentSystem];
    const gp = def.gate.position;
    gatePos.set(gp[0], gp[1], gp[2]);
    root.position.copy(gatePos);
    // Ring bore faces the system center (origin) — the arrival/departure lane.
    root.lookAt(0, 0, 0);
    destinationId = def.gate.to;
  }
  configure();

  // --- Jump overlay: full-screen fade + centered label, created once ---
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
    'background:#000;opacity:0;z-index:40;pointer-events:none;';
  const label = document.createElement('div');
  label.style.cssText =
    'color:#ffb84d;font:28px monospace;letter-spacing:.4em;text-align:center;' +
    'text-shadow:0 0 18px rgba(255,184,77,.8);';
  overlay.appendChild(label);
  document.body.appendChild(overlay);

  let overlayShown = false;
  let labelFor = null; // destination id currently named in the label
  let wasJumping = false;

  function update(dt) {
    // Rebuild for a system swap announced last frame.
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      const e = ctx.lastEvents[i];
      if (e.type === 'systemLoaded') {
        configure();
        break;
      }
    }

    // Slow spin of ring + chevrons around the bore axis.
    ring.rotation.z += SPIN_SPEED * dt;
    chevrons.rotation.z -= SPIN_SPEED * 0.6 * dt;

    // Beacon pulse (~1.2 s period).
    const pulse = 0.7 + 0.3 * Math.sin(ctx.elapsed * 5.2);
    beacon.scale.setScalar(beaconBaseScale * pulse);

    const jumping = ctx.gate.jumping;

    // Gate glow: gentle breathing at rest, intensifies during charge.
    const charge = jumping ? 1 + ctx.gate.progress * 1.6 : 1;
    glow.scale.setScalar(glowBaseScale * (0.95 + 0.05 * Math.sin(ctx.elapsed * 2.1)) * charge);
    ring.material.emissiveIntensity = jumping ? 0.25 + ctx.gate.progress * 1.2 : 0.25;

    // Zone check (ignored while docked or mid-jump).
    const shipObj = ctx.ship.object;
    const inZone =
      !jumping && !ctx.flags.docked && shipObj
        ? shipObj.position.distanceTo(gatePos) <= JUMP.zone
        : false;
    ctx.gate.inZone = inZone;

    if (inZone && ctx.input.dockPressed) {
      ctx.emit('jumpRequested', { to: destinationId });
    }

    // Jump overlay: fade in over first 40% of progress, out over last 40%.
    if (jumping) {
      const p = ctx.gate.progress;
      const opacity = p < 0.4 ? p / 0.4 : p > 0.6 ? (1 - p) / 0.4 : 1;
      if (!overlayShown) {
        overlay.style.display = 'flex';
        overlayShown = true;
      }
      overlay.style.opacity = opacity.toFixed(3);
      if (ctx.gate.destination !== labelFor) {
        labelFor = ctx.gate.destination;
        const dest = SYSTEMS[labelFor];
        label.textContent = 'JUMP — ' + (dest ? dest.name : labelFor);
      }
    } else if (overlayShown || wasJumping) {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      overlayShown = false;
      labelFor = null;
    }
    wasJumping = jumping;
  }

  return { update };
}
