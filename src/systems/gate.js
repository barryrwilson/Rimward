import * as THREE from 'three';
import { SYSTEMS, JUMP } from '../game/state.js';

/**
 * Jump gates — the Lamplighter Guild transit rings of the current system's
 * gate NETWORK. One ring assembly per entry in SYSTEMS[system].gates.
 *
 * Visual: each gate is a ~30u-radius rotating torus ring with inner chevron
 * markers, an additive amber/brass glow (Lamplighter palette: worn brass,
 * lamplight amber), and a pulsing beacon. Oriented so the ring faces the
 * system center. Distinct silhouette from 500+u.
 *
 * Ownership: writes ctx.gate.inZone and ctx.gate.nearTo only
 * (jumping/progress/destination are jump.js's). The zone check runs per
 * gate — nearest in-range gate wins: inZone = true and nearTo = that
 * gate's destination id; out of all zones, inZone = false and nearTo =
 * null. Emits 'jumpRequested' { to } with the near gate's destination when
 * the player presses dock (D) inside JUMP.zone while undocked and not
 * already jumping. Reads ctx.input.dockPressed, ctx.flags.docked,
 * ctx.ship.object — never writes them. On 'systemLoaded' (seen via
 * ctx.lastEvents) all gate assemblies rebuild for the new current system.
 *
 * Jump visual (driven by jump.js's ctx.gate fields): a full-screen black
 * fade — in over the first 40% of progress, out over the last 40% — plus a
 * centered 'JUMP' label naming the destination. The overlay div is created
 * once at init and hidden otherwise. Only the departing gate (the one whose
 * `to` matches ctx.gate.destination) intensifies its glow during charge.
 *
 * update() performs zero allocations: gate assemblies are preallocated on
 * rebuild and iterated by index; overlay style/text are only touched on
 * state changes.
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

  // --- Shared resources across every gate assembly in a system ---
  const ringGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48);
  const chevronGeo = new THREE.ConeGeometry(1.6, 5, 4);
  const chevronMat = new THREE.MeshStandardMaterial({
    color: BRASS_DARK,
    emissive: AMBER_HOT,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.6,
  });
  const glowMap = makeGlowTexture('rgba(255,220,150,0.9)', 'rgba(255,170,70,0.35)');
  const beaconMap = makeGlowTexture('rgba(255,240,200,1)', 'rgba(255,190,90,0.5)');
  const chevronRadius = RING_RADIUS - RING_TUBE - 3;
  const glowBaseScale = RING_RADIUS * 3.2;
  const beaconBaseScale = 10;

  // One preallocated assembly per gate: { group, ring, chevrons, glow,
  // beacon, to, x, y, z }. Rebuilt only on 'systemLoaded'.
  const assemblies = [];

  function buildAssembly(gateDef) {
    const group = new THREE.Group();

    // Ring (brass, slightly emissive so it reads against deep space). The
    // material is per-gate: charge glow raises one ring's emissive only.
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({
        color: BRASS,
        emissive: AMBER,
        emissiveIntensity: 0.25,
        roughness: 0.55,
        metalness: 0.8,
      }),
    );
    group.add(ring);

    // Inner chevron markers: radial inward-pointing cones around the bore.
    const chevrons = new THREE.Group();
    for (let i = 0; i < CHEVRON_COUNT; i++) {
      const a = (i / CHEVRON_COUNT) * Math.PI * 2;
      const c = new THREE.Mesh(chevronGeo, chevronMat);
      c.position.set(Math.cos(a) * chevronRadius, Math.sin(a) * chevronRadius, 0);
      // Cone +Y is the tip; rotate so the tip points at the ring center.
      c.rotation.z = a + Math.PI / 2;
      chevrons.add(c);
    }
    group.add(chevrons);

    // Additive amber glow filling the bore (the "lamplight").
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(glowBaseScale);
    group.add(glow);

    // Pulsing beacon riding the ring.
    const beacon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: beaconMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    beacon.position.set(0, RING_RADIUS + RING_TUBE + 2, 0);
    beacon.scale.setScalar(beaconBaseScale);
    group.add(beacon);

    const gp = gateDef.position;
    group.position.set(gp[0], gp[1], gp[2]);
    // Ring bore faces the system center (origin) — the arrival/departure lane.
    group.lookAt(0, 0, 0);
    root.add(group);

    return { group, ring, chevrons, glow, beacon, to: gateDef.to, x: gp[0], y: gp[1], z: gp[2] };
  }

  // --- Rebuild every assembly for the current system (on 'systemLoaded') ---
  function rebuild() {
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      root.remove(a.group);
      a.ring.material.dispose();
      a.glow.material.dispose();
      a.beacon.material.dispose();
    }
    assemblies.length = 0;
    const gates = SYSTEMS[ctx.world.currentSystem].gates;
    for (let i = 0; i < gates.length; i++) assemblies.push(buildAssembly(gates[i]));
  }
  rebuild();

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
        rebuild();
        break;
      }
    }

    const jumping = ctx.gate.jumping;

    // Per-gate idle motion + glow; only the departing gate (the one whose
    // `to` matches ctx.gate.destination) intensifies during charge.
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      // Slow spin of ring + chevrons around the bore axis.
      a.ring.rotation.z += SPIN_SPEED * dt;
      a.chevrons.rotation.z -= SPIN_SPEED * 0.6 * dt;
      // Beacon pulse (~1.2 s period).
      const pulse = 0.7 + 0.3 * Math.sin(ctx.elapsed * 5.2);
      a.beacon.scale.setScalar(beaconBaseScale * pulse);
      // Glow: gentle breathing at rest, intensifies on the departing gate.
      const charging = jumping && a.to === ctx.gate.destination;
      const charge = charging ? 1 + ctx.gate.progress * 1.6 : 1;
      a.glow.scale.setScalar(glowBaseScale * (0.95 + 0.05 * Math.sin(ctx.elapsed * 2.1)) * charge);
      a.ring.material.emissiveIntensity = charging ? 0.25 + ctx.gate.progress * 1.2 : 0.25;
    }

    // Zone check per gate (ignored while docked or mid-jump); the nearest
    // in-range gate wins.
    const shipObj = ctx.ship.object;
    let nearIdx = -1;
    let nearD2 = JUMP.zone * JUMP.zone;
    if (!jumping && !ctx.flags.docked && shipObj) {
      const p = shipObj.position;
      for (let i = 0; i < assemblies.length; i++) {
        const a = assemblies[i];
        const dx = p.x - a.x, dy = p.y - a.y, dz = p.z - a.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 <= nearD2) { nearD2 = d2; nearIdx = i; }
      }
    }
    const inZone = nearIdx >= 0;
    ctx.gate.inZone = inZone;
    ctx.gate.nearTo = inZone ? assemblies[nearIdx].to : null;

    if (inZone && ctx.input.dockPressed) {
      ctx.emit('jumpRequested', { to: assemblies[nearIdx].to });
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
