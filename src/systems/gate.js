import * as THREE from 'three';
import { SYSTEMS, JUMP, FACTIONS } from '../game/state.js';
import { styleFor } from '../game/faction-style.js'; // wave 37: faction gate tinting
import {
  ORGANIC,
  isBeautiful,
  makePetalGeometry,
  makeTendrilGeometry,
  makeOrganicGlowTexture,
  organicMaterials,
  tagSway,
  tagPulse,
  collectOrganic,
  animateOrganic,
} from './organic.js';

/**
 * Jump gates — the Lamplighter Guild transit rings of the current system's
 * origin (arrival/departure). One assembly per gate plus one junction assembly
 * at the hub (if any). The ring is Guild brass everywhere; faction home
 * systems tint the glow/beacon/chevrons (wave 37) or overlay sculpted dress
 * (wave 38). Beautiful systems grow mint overgrowth (wave 27).
 *
 * Live gates sit at gate positions from the system def, look at origin, and
 * animate per-frame (ring spin, beacon pulse, glow breath, tunnel swirl).
 * Jump charge (`ctx.gate.progress`) intensifies the departing gate's glow and
 * triggers the particle tunnel; zone checks enable dock input (KeyG) to pick a
 * destination. The hub assembly carries the route list; KeyG cycles selection.
 * rebuild() runs on `systemLoaded`, tearing down every assembly and rebuilding
 * from the new system def.
 *
 * Models Browser uses buildGateModel(faction, opts) to generate a standalone
 * gate model at the origin with visual update only — no gameplay. The model
 * shares the same sculpt code as live gates (ring, chevrons, glow, beacon,
 * tunnel, overgrowth, overlay, junction extras) via module-scope builders.
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

// Charge tunnel (wave-6): preallocated particle ring swirling in the bore
// plane of the departing gate while ctx.gate.jumping.
const TUNNEL_COUNT = 200;
const TUNNEL_DEPTH = 24; // tunnel length along the bore axis (local Z)
const TUNNEL_SIZE = 1.7; // point size

// Junction lantern silhouette (wave-22): a hexagonal brass outer frame
// counter-rotating against the ring, plus one slender brass arm per hub
// route tipped with an amber lamp. All preallocated at build time.
const HEX_RADIUS = RING_RADIUS * 1.35;
const HEX_BAR_THICK = 1.4;
const HEX_SPIN_SPEED = -SPIN_SPEED * 0.4; // counter-rotates the ring spin
const ARM_THICK = 0.7;
const LAMP_BASE_SCALE = 6;
const LAMP_SELECTED_SCALE = 9.5;
const LAMP_BASE_OPACITY = 0.45;
const LAMP_SELECTED_OPACITY = 1;

// Faction gate overlays (wave 38): systems flying these factions dress the
// Lamplighter brass ring with a '<faction>-overlay' subgroup (plan Phase 4).
// Wave 42 D3: Unknowables join as energy-field (no hull, additive only).
// Beautiful keeps its wave-27 overgrowth; independent/hollow/unknown stay
// plain brass (byte-identical).
const OVERLAY_FACTIONS = new Set(['veridian', 'ferrous', 'freehold', 'redledger', 'gilded', 'congregation', 'assembly', 'lamplighter', 'unknowables']);

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

// =============================================================================
// MODULE-SCOPE SHARED RESOURCES (lazy, reused across all gate assemblies)
// =============================================================================

let _gateShared = null;
function gateShared() {
  if (_gateShared) return _gateShared;

  const ringGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48);
  ringGeo.userData.shared = true;
  const chevronGeo = new THREE.ConeGeometry(1.6, 5, 4);
  chevronGeo.userData.shared = true;
  const chevronMat = new THREE.MeshStandardMaterial({
    color: BRASS_DARK,
    emissive: AMBER_HOT,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.6,
  });
  chevronMat.userData.shared = true;
  const glowMap = makeGlowTexture('rgba(255,220,150,0.9)', 'rgba(255,170,70,0.35)');
  glowMap.userData.shared = true;
  const beaconMap = makeGlowTexture('rgba(255,240,200,1)', 'rgba(255,190,90,0.5)');
  beaconMap.userData.shared = true;
  const chevronRadius = RING_RADIUS - RING_TUBE - 3;
  const glowBaseScale = RING_RADIUS * 3.2;
  const beaconBaseScale = 10;

  // Junction silhouette shared geometry (shared across assemblies, never disposed).
  const hexBarGeo = new THREE.BoxGeometry(HEX_RADIUS, HEX_BAR_THICK, HEX_BAR_THICK);
  hexBarGeo.userData.shared = true;
  const armGeo = new THREE.BoxGeometry(HEX_RADIUS - RING_RADIUS, ARM_THICK, ARM_THICK);
  armGeo.userData.shared = true;

  // Faction gate tinting cache (per-faction glow/beacon textures and chevron material).
  const factionTintCache = {};

  // Beautiful Ones overgrowth shared resources (lazy-cached, never disposed).
  let ogTendrilGeoA = null;
  let ogTendrilGeoB = null;
  let ogPetalGeo = null;
  let ogVineGeoA = null;
  let ogVineGeoB = null;
  let beautifulGlowMap = null;

  // Overlay shared resources (lazy-cached, never disposed).
  let ovShared = null;

  // Helper: hex color to rgba string.
  function _hexRgba(hex, a) {
    return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
  }

  // Helper: faction-specific tint resources (lazy-cached).
  function tintFor(faction) {
    let t = factionTintCache[faction];
    if (!t) {
      const st = styleFor(faction);
      const factionGlowMap = makeGlowTexture(_hexRgba(st.beacon, 0.9), _hexRgba(st.glow, 0.35));
      factionGlowMap.userData.shared = true;
      const factionBeaconMap = makeGlowTexture(_hexRgba(st.beacon, 1), _hexRgba(st.glow, 0.5));
      factionBeaconMap.userData.shared = true;
      const factionChevronMat = new THREE.MeshStandardMaterial({
        color: BRASS_DARK,
        emissive: st.glow,
        emissiveIntensity: 0.9,
        roughness: 0.4,
        metalness: 0.6,
      });
      factionChevronMat.userData.shared = true;
      t = {
        glowMap: factionGlowMap,
        beaconMap: factionBeaconMap,
        chevronMat: factionChevronMat,
        tunnelColor: st.glow,
      };
      factionTintCache[faction] = t;
    }
    return t;
  }

  // Helper: bend a +Z-growing tendril geometry into a planar arc of radius rb.
  function bendTendrilToArc(geo, rb) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const th = z / rb;
      const c = Math.cos(th);
      const s = Math.sin(th);
      pos.setXYZ(i, -rb * (1 - c) - x * c, y, rb * s - x * s);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  // Helper: ensure Beautiful Ones organic shared resources are initialized.
  function ensureOrganicShared() {
    if (ogTendrilGeoA) return;
    ogTendrilGeoA = bendTendrilToArc(
      makeTendrilGeometry({ length: 47, radius: 0.9, sway: 1.4, taper: 0.35, radialSegs: 6, tubularSegs: 36 }),
      RING_RADIUS,
    );
    ogTendrilGeoB = bendTendrilToArc(
      makeTendrilGeometry({ length: 47, radius: 0.8, sway: -1.1, taper: 0.3, radialSegs: 6, tubularSegs: 36 }),
      RING_RADIUS,
    );
    ogPetalGeo = makePetalGeometry({ length: 8, width: 4.5, curl: 1.7, cup: 1.3, segs: 10 });
    ogVineGeoA = new THREE.TorusGeometry(RING_RADIUS + 3, 0.3, 6, 72);
    ogVineGeoB = new THREE.TorusGeometry(RING_RADIUS - 3, 0.3, 6, 72);
    beautifulGlowMap = makeOrganicGlowTexture('rgba(184,255,216,1)', 'rgba(127,224,168,0)');
  }

  // Helper: ensure overlay shared resources are initialized.
  function ensureOverlayShared() {
    if (ovShared) return;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 6);
    const cone = new THREE.ConeGeometry(1, 1, 6);
    const sphere = new THREE.SphereGeometry(1, 8, 6);
    const ring = new THREE.TorusGeometry(1, 0.1, 6, 40);
    const arcRing = new THREE.TorusGeometry(1, 0.02, 6, 48, Math.PI * 0.55);
    box.userData.shared = true;
    cyl.userData.shared = true;
    cone.userData.shared = true;
    sphere.userData.shared = true;
    ring.userData.shared = true;
    arcRing.userData.shared = true;
    ovShared = { box, cyl, cone, sphere, ring, arcRing };
  }

  _gateShared = {
    ringGeo, chevronGeo, chevronMat, glowMap, beaconMap, chevronRadius,
    glowBaseScale, beaconBaseScale, hexBarGeo, armGeo,
    tintFor, ensureOrganicShared, ensureOverlayShared,
    get ogTendrilGeoA() { return ogTendrilGeoA; },
    get ogTendrilGeoB() { return ogTendrilGeoB; },
    get ogPetalGeo() { return ogPetalGeo; },
    get ogVineGeoA() { return ogVineGeoA; },
    get ogVineGeoB() { return ogVineGeoB; },
    get beautifulGlowMap() { return beautifulGlowMap; },
    get ovShared() { return ovShared; },
  };
  return _gateShared;
}

// =============================================================================
// BUILDER FUNCTIONS (module-scope, used by both live gates and buildGateModel)
// =============================================================================

// Per-assembly visual animation (pure visual work, no gameplay).
// `charging` is the departing gate's own flag (jumping AND this assembly is
// the destination lane). It is NOT derivable from jumpProgress: a transit
// opens at progress 0, and the plasma cells, the tunnel swirl and the bore
// bloom all key off the flag, not the ramp (wave 42 D3).
function animateAssembly(a, elapsed, dt, reducedMotion, charging = false, jumpProgress = 0) {
  // Slow spin of ring + chevrons around the bore axis.
  if (!reducedMotion) {
    a.ring.rotation.z += SPIN_SPEED * dt;
    a.chevrons.rotation.z -= SPIN_SPEED * 0.6 * dt;
  }

  // Beacon pulse (~1.2 s period).
  const pulse = reducedMotion ? 1.0 : 0.7 + 0.3 * Math.sin(elapsed * 5.2);
  a.beacon.scale.setScalar(gateShared().beaconBaseScale * pulse);

  // Glow: gentle breathing at rest, intensifies with jump progress.
  const charge = charging ? 1 + jumpProgress * 1.6 : 1;
  a.glow.scale.setScalar(
    gateShared().glowBaseScale * (reducedMotion ? 1.0 : 0.95 + 0.05 * Math.sin(elapsed * 2.1)) * charge
  );
  a.ring.material.emissiveIntensity = charging ? 0.25 + jumpProgress * 1.2 : 0.25;

  // Beautiful overgrowth (wave-27): part-level tendril/petal sway and bud pulse.
  if (a.organicParts) animateOrganic(a.organicParts, elapsed, reducedMotion);

  // Faction overlay (wave 38): lamp blink/pulse + slow sub-ring spins.
  if (a.overlayAnims) {
    for (let k = 0; k < a.overlayAnims.length; k++) {
      const an = a.overlayAnims[k];
      if (an.obj) {
        if (!reducedMotion) an.obj.rotation.z += an.spin * dt;
      } else {
        an.mat.opacity = reducedMotion
          ? an.base
          : an.base + an.amp * Math.sin(elapsed * an.spd + an.phase);
      }
    }
  }

  // Unknowables plasma cells (wave 42 D3): visible only while charging.
  if (a.unknowablesPlasma) a.unknowablesPlasma.visible = charging;

  // Junction silhouette (wave-22): hex frame counter-rotates the ring spin.
  if (a.isHub) {
    if (!reducedMotion) a.hexFrame.rotation.z += HEX_SPIN_SPEED * dt;

    // Lamp selection lerp (smooth transition to selected route).
    const lerp = Math.min(1, dt * 8);
    for (let k = 0; k < a.lamps.length; k++) {
      const target = k === a.routeIndex ? 1 : 0;
      const blend = a.lampBlend[k] + (target - a.lampBlend[k]) * lerp;
      a.lampBlend[k] = blend;
      a.lamps[k].scale.setScalar(LAMP_BASE_SCALE + (LAMP_SELECTED_SCALE - LAMP_BASE_SCALE) * blend);
      a.lampMats[k].opacity = LAMP_BASE_OPACITY + (LAMP_SELECTED_OPACITY - LAMP_BASE_OPACITY) * blend;
    }
  }

  // Charge tunnel (wave-6): swirl the particle ring while charging.
  const swirling = charging && !reducedMotion;
  a.swirl.visible = swirling;
  if (swirling) {
    const prog = jumpProgress;
    a.swirlPhase += dt * (1.5 + prog * 4);
    const zDrift = (elapsed * (20 + prog * 40)) % TUNNEL_DEPTH;
    const radScale = RING_RADIUS * (1.15 - 0.55 * prog);
    for (let j = 0; j < TUNNEL_COUNT; j++) {
      const ang = a.swirlBase[j * 2] + a.swirlPhase;
      const r = a.swirlBase[j * 2 + 1] * radScale;
      let z = a.swirlZ[j] + zDrift;
      if (z >= TUNNEL_DEPTH) z -= TUNNEL_DEPTH;
      const j3 = j * 3;
      a.swirlArr[j3] = Math.cos(ang) * r;
      a.swirlArr[j3 + 1] = Math.sin(ang) * r;
      a.swirlArr[j3 + 2] = z - TUNNEL_DEPTH * 0.5;
    }
    a.swirl.geometry.attributes.position.needsUpdate = true;
    a.swirl.material.opacity = 0.25 + prog * 0.75;
  }
}

// Build the Beautiful Ones overgrowth (wave-27) on an assembly.
function buildOvergrowth(a) {
  const sh = gateShared();
  const mats = organicMaterials(); // cached shared set — used directly
  const group = new THREE.Group();
  group.name = 'beautiful-overgrowth';

  // Living tendrils wrapped around the torus tube at spaced angles.
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.35;
    const mount = new THREE.Group();
    mount.position.set(Math.cos(ang) * RING_RADIUS, Math.sin(ang) * RING_RADIUS, 0);
    mount.rotation.z = ang;
    const tendril = new THREE.Mesh(i % 2 ? sh.ogTendrilGeoB : sh.ogTendrilGeoA, mats.flesh);
    tendril.rotation.x = Math.PI / 2;
    tendril.position.set(i % 2 ? RING_TUBE * 0.75 : -RING_TUBE * 0.75, 0, i % 2 ? -1.1 : 1.1);
    mount.add(tendril);
    tagSway(mount, { axis: 'z', amp: 0.015, hz: 0.15, phase: i * 1.9 });
    group.add(mount);
  }

  // Membrane petals cocooning alternating chevrons (0, 2, 4, 6).
  for (let k = 0; k < 4; k++) {
    const ang = ((k * 2) / CHEVRON_COUNT) * Math.PI * 2;
    const mount = new THREE.Group();
    mount.position.set(Math.cos(ang) * sh.chevronRadius, Math.sin(ang) * sh.chevronRadius, 0);
    mount.rotation.z = ang + Math.PI / 2;
    const petal = new THREE.Mesh(sh.ogPetalGeo, mats.membrane);
    petal.rotation.x = -Math.PI / 2;
    petal.rotation.z = 0.15;
    petal.position.y = -3;
    mount.add(petal);
    tagSway(mount, { axis: 'z', amp: 0.04, hz: 0.25, phase: k * 1.7 });
    a.chevrons.add(mount);
  }

  // Mint bud-lanterns riding the ring at 45° offsets from the chevrons.
  const budMats = [];
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const mat = new THREE.SpriteMaterial({
      map: sh.beautifulGlowMap,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    tagPulse(mat, { base: 0.55, amp: 0.25, hz: 0.4, phase: i * 1.6 });
    const bud = new THREE.Sprite(mat);
    bud.name = 'beautiful-bud';
    bud.position.set(Math.cos(ang) * RING_RADIUS, Math.sin(ang) * RING_RADIUS, 0);
    bud.scale.setScalar(7);
    group.add(bud);
    budMats.push(mat);
  }

  // Gilt vine rings circling the main ring.
  const vineA = new THREE.Mesh(sh.ogVineGeoA, mats.gilt);
  const vineB = new THREE.Mesh(sh.ogVineGeoB, mats.gilt);
  vineB.rotation.x = 0.06;
  group.add(vineA);
  group.add(vineB);

  a.group.add(group);
  a.budMats = budMats;
}

// Build faction overlay (wave 38) on an assembly.
function buildOverlay(a, faction, tint) {
  const sh = gateShared();
  sh.ensureOverlayShared();
  const st = styleFor(faction);
  const G = sh.ovShared; // This is now accessed through the shared object
  const ov = new THREE.Group();
  ov.name = faction + '-overlay';
  const mats = [];
  const anims = [];
  const T = RING_RADIUS + RING_TUBE;
  const IN = RING_RADIUS - RING_TUBE;

  // Per-assembly structural material (disposed in rebuild()).
  const struct = (color, emissive, ei) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: emissive ?? 0x000000,
      emissiveIntensity: ei ?? 0,
      metalness: st.metalness,
      roughness: st.roughness,
    });
    mats.push(m);
    return m;
  };

  const part = (geo, mat, sx, sy, sz, ang, r, z = 0, rot = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
    m.rotation.z = ang + rot;
    ov.add(m);
    return m;
  };

  const axial = (geo, mat, thick, len, ang, r, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(thick, len, thick);
    m.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
    m.rotation.z = ang - Math.PI / 2;
    ov.add(m);
    return m;
  };

  const lamp = (map, color, scale, ang, r, z, base, amp, spd, phase = 0) => {
    const m = new THREE.SpriteMaterial({
      map, color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: base,
      depthWrite: false,
    });
    mats.push(m);
    const s = new THREE.Sprite(m);
    s.scale.setScalar(scale);
    s.position.set(Math.cos(ang) * r, Math.sin(ang) * r, z);
    ov.add(s);
    if (amp > 0) anims.push({ mat: m, base, amp, spd, phase });
    return s;
  };

  switch (faction) {
    case 'veridian': {
      const clad = struct(st.hull);
      const alloy = struct(st.trim);
      const aperture = struct(st.hullDark, st.glow, 1.2);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
        part(G.box, clad, 11, 3.4, 4.6, ang, T + 1.4, 0, Math.PI / 2);
        part(G.box, aperture, 4.2, 0.9, 1.4, ang, IN - 1.2, 0, Math.PI / 2);
      }
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        axial(G.cyl, alloy, 0.6, 7, ang, T + 3.5);
        lamp(tint.beaconMap, st.glow, 4.5, ang, T + 7.5, 0, 0.5, 0.35, 2.2, i * 2.1);
      }
      break;
    }
    case 'ferrous': {
      const iron = struct(st.hull);
      const dark = struct(st.hullDark);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        part(G.box, iron, 6, 9, 6.5, ang, T + 3.5, 0, -Math.PI / 2);
        part(G.box, dark, 3.6, 3, 4.2, ang, T + 9.5, 0, -Math.PI / 2);
        lamp(tint.beaconMap, st.accent, 4, ang, T + 11.5, 0, 0.6, 0.4, 3.2, (i % 2) * Math.PI);
      }
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        part(G.box, dark, 12, 5.5, 0.9, ang, IN - 2.2, 2.4, Math.PI / 2);
        part(G.box, dark, 12, 5.5, 0.9, ang, IN - 2.2, -2.4, Math.PI / 2);
      }
      break;
    }
    case 'freehold': {
      const patchMats = st.patch.map((c) => struct(c));
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2 + 0.45;
        part(G.box, patchMats[i % 3], 8 + (i % 3) * 2.5, 2.6 + (i % 2), 4.8,
          ang, T + 0.9, i % 2 ? 0.8 : -0.8, Math.PI / 2);
      }
      const frame = struct(st.trim);
      for (let i = 0; i < 2; i++) {
        const ang = i * Math.PI + Math.PI / 2.5;
        for (let k = -1; k <= 1; k++) axial(G.cyl, frame, 0.28, 9, ang + k * 0.075, T + 4.5);
        part(G.box, frame, 5.5, 0.5, 3, ang, T + 9, 0, Math.PI / 2);
      }
      const pod = struct(st.hullDark, st.glow, 0.9);
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + 1.1;
        part(G.box, pod, 3.2, 2.4, 3, ang, T + 2.6, 1.2, Math.PI / 2);
        lamp(tint.beaconMap, st.glow, 2.6, ang, T + 4.4, 1.2, 0.45, 0.2, 1.4, i * 1.3);
      }
      break;
    }
    case 'redledger': {
      const iron = struct(st.hull);
      const copper = struct(st.trim);
      for (const s of [-1, 1]) {
        const ang = s * Math.PI / 3;
        part(G.box, iron, 11, 2.6, 7.5, ang, T + 1.6, 0, Math.PI / 2);
        part(G.box, copper, 11.6, 0.7, 8.1, ang, T + 3.2, 0, Math.PI / 2);
      }
      const dAng = -Math.PI / 2;
      part(G.box, iron, 3, 15, 3.4, dAng, T + 7.5, 0, -Math.PI / 2);
      part(G.box, copper, 5.5, 1.2, 5.5, dAng, T + 15.5, 0, -Math.PI / 2);
      lamp(tint.beaconMap, st.glow, 3.6, dAng, T + 16.8, 0, 0.6, 0.35, 2.6);
      for (const s of [-1, 1]) {
        for (let k = -1; k <= 1; k++) {
          lamp(tint.beaconMap, st.beacon, 2.8, s > 0 ? 0 : Math.PI, 16, k * 13, 0.5, 0.45, 3.4);
        }
      }
      break;
    }
    case 'gilded': {
      const ceramic = struct(st.hull);
      const gold = struct(st.accent);
      const aperture = struct(st.hullDark, st.glow, 1.5);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        part(G.sphere, i % 4 === 3 ? gold : ceramic, 5.4, 3.1, 1.7,
          ang, T + 0.7, i % 2 ? 1 : -1, Math.PI / 2);
      }
      part(G.ring, aperture, IN - 1.4, IN - 1.4, (IN - 1.4) * 0.22, 0, 0);
      for (let i = 0; i < 4; i++) {
        lamp(tint.beaconMap, st.glow, 3.4, (i / 4) * Math.PI * 2 + Math.PI / 4, IN - 1.4, 0, 0.5, 0.3, 1.8, i * 1.6);
      }
      break;
    }
    case 'congregation': {
      const hullM = struct(st.hull);
      const silver = struct(st.trim);
      const wake = struct(st.hullDark, st.patch[0], 1.4);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
        part(G.box, hullM, 4.4, 2.6, 4.4, ang, T + 1.4, 0, Math.PI / 2);
        axial(G.cone, silver, 1.7, 6.5, ang, T + 5.6);
        part(G.box, wake, 1.2, 1.2, 1.2, ang + 0.16, T + 1.8, 1.4);
      }
      for (let i = 0; i < 6; i++) {
        lamp(tint.beaconMap, st.glow, 3, (i / 6) * Math.PI * 2, T + 0.6, i % 2 ? 2.4 : -2.4, 0.5, 0.25, 1.2, i * 1.05);
      }
      for (let i = 0; i < 2; i++) {
        lamp(tint.beaconMap, st.patch[0], 3.6, (i / 2) * Math.PI * 2 + Math.PI / 4, T + 8.6, 0, 0.45, 0.25, 1.6, i * Math.PI);
      }
      break;
    }
    case 'assembly': {
      const off = struct(st.hull);
      const char = struct(st.hullDark);
      const orange = struct(st.accent);
      for (let i = 0; i < 2; i++) {
        const ang = (i / 2) * Math.PI * 2 + Math.PI / 3;
        const mount = new THREE.Group();
        mount.position.set(Math.cos(ang) * (T + 6), Math.sin(ang) * (T + 6), i ? -4 : 4);
        const sub = new THREE.Mesh(G.ring, off);
        sub.scale.setScalar(9);
        mount.add(sub);
        for (let k = 0; k < 3; k++) {
          const na = (k / 3) * Math.PI * 2;
          const nub = new THREE.Mesh(G.box, k === 1 ? orange : char);
          nub.scale.set(2, 2, 2);
          nub.position.set(Math.cos(na) * 9, Math.sin(na) * 9, 0);
          mount.add(nub);
        }
        ov.add(mount);
        anims.push({ obj: mount, spin: i ? 0.3 : -0.3 });
      }
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        part(G.box, char, 5, 5, 5, ang, T + 2.5);
        part(G.box, off, 2.6, 2.6, 2.6, ang, T + 6.3);
        part(G.box, orange, 1.3, 1.3, 1.3, ang, T + 8.2);
      }
      for (let i = 0; i < 4; i++) {
        lamp(tint.beaconMap, st.glow, 3.2, (i / 4) * Math.PI * 2 + Math.PI / 4, T + 3.4, i % 2 ? 2 : -2, 0.5, 0.35, 2.0, i * 1.9);
      }
      break;
    }
    case 'lamplighter': {
      const soot = struct(st.hull);
      const yellow = struct(st.trim);
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + Math.PI / 6;
        part(G.box, soot, 1.4, 13, 1.4, ang, T + 6.5, 0, -Math.PI / 2);
        part(G.box, yellow, 2.2, 2.2, 2.2, ang, T + 13.5, 0, -Math.PI / 2);
      }
      const cAng = (11 / 6) * Math.PI;
      axial(G.cyl, soot, 2.6, 6, cAng, T + 3);
      axial(G.cyl, yellow, 1.4, 3.4, cAng, T + 7.4);
      axial(G.cone, soot, 0.8, 3.4, cAng, T + 10.6);
      lamp(tint.beaconMap, st.patch[1], 3.8, cAng, T + 12.8, 0, 0.5, 0.3, 2.8);
      const rail = part(G.ring, yellow, T + 3.4, T + 3.4, (T + 3.4) * 0.12, 0, 0);
      rail.rotation.x = 0.05;
      for (let i = 0; i < 12; i++) {
        lamp(tint.beaconMap, st.glow, 2.2, (i / 12) * Math.PI * 2, T + 0.9, i % 2 ? 1.6 : -1.6, 0.5, 0.25, 1.7, i * 0.7);
      }
      lamp(tint.beaconMap, st.patch[1], 3, Math.PI / 6 + (Math.PI * 2) / 3, T + 15.9, 0, 0.45, 0.25, 2.2, 1.1);
      break;
    }
    case 'unknowables': {
      const lensMat = (color) => {
        const m = new THREE.MeshBasicMaterial({
          color,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        });
        mats.push(m);
        return m;
      };
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        const lens = new THREE.Mesh(G.arcRing, lensMat(i % 2 === 0 ? st.patch[0] : st.accent));
        lens.name = 'unknowables-lens';
        const arcRadius = T + 2 + (i % 2) * 5;
        lens.scale.setScalar(arcRadius);
        lens.rotation.x = i % 2 === 0 ? 0.32 : -0.22;
        lens.rotation.z = ang;
        ov.add(lens);
        anims.push({ obj: lens, spin: i % 2 === 0 ? 0.12 : -0.08 });
      }
      const plasmaGroup = new THREE.Group();
      plasmaGroup.name = 'unknowables-plasma';
      plasmaGroup.visible = false;
      const plasmaMat = (color) => {
        const m = new THREE.MeshBasicMaterial({
          color,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        });
        mats.push(m);
        return m;
      };
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const radius = RING_RADIUS * 0.5;
        const cell = new THREE.Mesh(G.sphere, plasmaMat(i % 3 === 0 ? st.beacon : st.accent));
        cell.name = 'unknowables-plasma-cell';
        cell.scale.setScalar(1.8);
        cell.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
        cell.position.z = (i % 2 === 0 ? 2 : -2) + (i % 3) * 1.5;
        plasmaGroup.add(cell);
        anims.push({ obj: cell, spin: (i % 2 === 0 ? 0.08 : -0.08) });
      }
      ov.add(plasmaGroup);
      a.unknowablesPlasma = plasmaGroup;
      break;
    }
  }

  a.group.add(ov);
  a.overlayMats = mats;
  a.overlayAnims = anims;
}

// Build junction extras (wave-22): hexagonal frame + arm lamps for hub assemblies.
function buildJunctionExtras(a, routes) {
  const sh = gateShared();
  const hexMat = new THREE.MeshStandardMaterial({
    color: BRASS_DARK,
    emissive: AMBER,
    emissiveIntensity: 0.35,
    roughness: 0.5,
    metalness: 0.7,
  });
  const hexFrame = new THREE.Group();
  const edgeMidR = HEX_RADIUS * Math.cos(Math.PI / 6);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const bar = new THREE.Mesh(sh.hexBarGeo, hexMat);
    bar.position.set(Math.cos(ang) * edgeMidR, Math.sin(ang) * edgeMidR, 0);
    bar.rotation.z = ang + Math.PI / 2;
    hexFrame.add(bar);
  }
  a.group.add(hexFrame);

  const arms = new THREE.Group();
  const lamps = [];
  const lampMats = [];
  const armR = (RING_RADIUS + HEX_RADIUS) / 2;
  const lampR = HEX_RADIUS - 1;
  for (let k = 0; k < routes.length; k++) {
    const phi = (k / routes.length) * Math.PI * 2;
    const arm = new THREE.Mesh(sh.armGeo, hexMat);
    arm.position.set(Math.cos(phi) * armR, Math.sin(phi) * armR, 0);
    arm.rotation.z = phi;
    arms.add(arm);
    const lampMat = new THREE.SpriteMaterial({
      map: sh.beaconMap,
      color: AMBER,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: LAMP_BASE_OPACITY,
      depthWrite: false,
    });
    const lamp = new THREE.Sprite(lampMat);
    lamp.name = 'junction-arm-lamp';
    lamp.position.set(Math.cos(phi) * lampR, Math.sin(phi) * lampR, 0);
    lamp.scale.setScalar(LAMP_BASE_SCALE);
    arms.add(lamp);
    lamps.push(lamp);
    lampMats.push(lampMat);
  }
  a.group.add(arms);

  a.hexFrame = hexFrame;
  a.hexMat = hexMat;
  a.arms = arms;
  a.lamps = lamps;
  a.lampMats = lampMats;
  a.lampBlend = new Float32Array(routes.length);
  a.group.userData.routeCount = routes.length;
  a.group.userData.routeIndex = 0;
}

// Build a single gate assembly (ring, chevrons, glow, beacon, tunnel, overgrowth, overlay).
function buildAssembly(gateDef, faction, beautiful) {
  const sh = gateShared();
  const group = new THREE.Group();

  if (beautiful) sh.ensureOrganicShared();
  const tint = beautiful ? null : sh.tintFor(faction);
  const gMap = beautiful ? sh.beautifulGlowMap : (tint?.glowMap ?? sh.glowMap);
  const bMap = beautiful ? sh.beautifulGlowMap : (tint?.beaconMap ?? sh.beaconMap);
  const chvMat = beautiful ? sh.chevronMat : (tint?.chevronMat ?? sh.chevronMat);

  // Ring (brass, slightly emissive).
  const ring = new THREE.Mesh(
    sh.ringGeo,
    new THREE.MeshStandardMaterial({
      color: BRASS,
      emissive: AMBER,
      emissiveIntensity: 0.25,
      roughness: 0.55,
      metalness: 0.8,
    }),
  );
  group.add(ring);

  // Inner chevron markers.
  const chevrons = new THREE.Group();
  for (let i = 0; i < CHEVRON_COUNT; i++) {
    const a = (i / CHEVRON_COUNT) * Math.PI * 2;
    const c = new THREE.Mesh(sh.chevronGeo, chvMat);
    c.position.set(Math.cos(a) * sh.chevronRadius, Math.sin(a) * sh.chevronRadius, 0);
    c.rotation.z = a + Math.PI / 2;
    chevrons.add(c);
  }
  group.add(chevrons);

  // Additive amber glow filling the bore.
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: gMap,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  glow.scale.setScalar(sh.glowBaseScale);
  group.add(glow);

  // Pulsing beacon riding the ring.
  const beacon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: bMap,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  beacon.position.set(0, RING_RADIUS + RING_TUBE + 2, 0);
  beacon.scale.setScalar(sh.beaconBaseScale);
  group.add(beacon);

  // Charge tunnel particles (preallocated but invisible).
  const swirlGeo = new THREE.BufferGeometry();
  const swirlArr = new Float32Array(TUNNEL_COUNT * 3);
  swirlGeo.setAttribute('position', new THREE.BufferAttribute(swirlArr, 3));
  const swirlBase = new Float32Array(TUNNEL_COUNT * 2);
  const swirlZ = new Float32Array(TUNNEL_COUNT);
  for (let i = 0; i < TUNNEL_COUNT; i++) {
    swirlBase[i * 2] = Math.random() * Math.PI * 2;
    swirlBase[i * 2 + 1] = 0.55 + Math.random() * 0.5;
    swirlZ[i] = Math.random() * TUNNEL_DEPTH;
  }
  const swirl = new THREE.Points(
    swirlGeo,
    new THREE.PointsMaterial({
      map: gMap,
      color: beautiful ? ORGANIC.mint : (tint?.tunnelColor ?? AMBER_HOT),
      size: TUNNEL_SIZE,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  swirl.visible = false;
  swirl.frustumCulled = false;
  group.add(swirl);

  // Position and orient the assembly.
  const gp = gateDef.position;
  group.position.set(gp[0], gp[1], gp[2]);
  group.lookAt(0, 0, 0);

  const a = {
    group, ring, chevrons, glow, beacon, swirl, swirlArr, swirlBase, swirlZ, swirlPhase: 0,
    to: gateDef.to, x: gp[0], y: gp[1], z: gp[2],
    organicParts: null, overlayAnims: null, budMats: null, overlayMats: null,
    hexFrame: null, hexMat: null, arms: null, lamps: null, lampMats: null, lampBlend: null,
    isHub: false, routeIndex: 0, unknowablesPlasma: null,
  };

  // Beautiful Ones overgrowth (wave-27).
  if (beautiful) {
    buildOvergrowth(a);
    a.organicParts = collectOrganic(group);
  }

  // Faction overlay (wave 38).
  if (!beautiful && OVERLAY_FACTIONS.has(faction)) {
    buildOverlay(a, faction, tint);
  }

  return a;
}

// =============================================================================
// LIVE GATE SYSTEM (initGate)
// =============================================================================

export function initGate(ctx) {
  const root = new THREE.Group();
  ctx.scene.add(root);

  // Per-system-faction state (set per rebuild).
  let currentFaction = 'independent';
  let currentBeautiful = false;

  // One preallocated assembly per gate.
  const assemblies = [];

  // Rebuild every assembly for the current system (on 'systemLoaded').
  function rebuild() {
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      root.remove(a.group);
      a.ring.material.dispose();
      a.glow.material.dispose();
      a.beacon.material.dispose();
      a.swirl.geometry.dispose();
      a.swirl.material.dispose();
      if (a.isHub) {
        a.hexMat.dispose();
        for (let k = 0; k < a.lampMats.length; k++) a.lampMats[k].dispose();
      }
      if (a.budMats) {
        for (let k = 0; k < a.budMats.length; k++) a.budMats[k].dispose();
      }
      if (a.overlayMats) {
        for (let k = 0; k < a.overlayMats.length; k++) a.overlayMats[k].dispose();
      }
    }
    assemblies.length = 0;
    const def = SYSTEMS[ctx.world.currentSystem];
    currentBeautiful = isBeautiful(def.faction);
    currentFaction = def.faction ?? 'independent';
    const gates = def.gates;
    for (let i = 0; i < gates.length; i++) {
      const a = buildAssembly(gates[i], currentFaction, currentBeautiful);
      a.group.name = 'lamplighter-gate';
      root.add(a.group);
      assemblies.push(a);
    }
    // Lamplighter junction.
    const hub = def.hub;
    if (hub && hub.routes && hub.routes.length) {
      const a = buildAssembly({ position: hub.position, to: hub.routes[0] }, currentFaction, currentBeautiful);
      a.isHub = true;
      a.routes = hub.routes;
      a.routeIndex = 0;
      buildJunctionExtras(a, hub.routes);
      a.group.name = 'lamplighter-junction';
      root.add(a.group);
      assemblies.push(a);
    }
  }
  rebuild();

  // Jump overlay: full-screen fade + centered label.
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
  let labelFor = null;
  let wasJumping = false;
  let lastFadeStep = -1;

  // Junction route cycling.
  let zoneHub = null;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyG' || e.repeat) return;
    if (!zoneHub || ctx.flags.docked || ctx.flags.paused || ctx.gate.jumping) return;
    const routes = zoneHub.routes;
    zoneHub.routeIndex = (zoneHub.routeIndex + 1) % routes.length;
    zoneHub.to = routes[zoneHub.routeIndex];
  });

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
    const reducedMotion = ctx.settings?.reducedMotion === true;

    // Per-assembly visual animation.
    for (let i = 0; i < assemblies.length; i++) {
      const a = assemblies[i];
      const charging = jumping && a.to === ctx.gate.destination;
      const jumpProgress = charging ? ctx.gate.progress : 0;
      animateAssembly(a, ctx.elapsed, dt, reducedMotion, charging, jumpProgress);

      // Update junction userData for gameplay reads.
      if (a.isHub) {
        a.group.userData.routeIndex = a.routeIndex;
      }
    }

    // Zone check per gate.
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
    const near = inZone ? assemblies[nearIdx] : null;
    const nearIsHub = !!(near && near.isHub);
    zoneHub = nearIsHub ? near : null;
    ctx.gate.inZone = inZone;
    ctx.gate.nearTo = near ? near.to : null;
    ctx.gate.nearHub = nearIsHub;
    ctx.gate.nearRouteIndex = nearIsHub ? near.routeIndex : -1;
    ctx.gate.nearRouteCount = nearIsHub ? near.routes.length : 0;

    if (inZone && ctx.input.dockPressed) {
      ctx.emit('jumpRequested', { to: near.to });
    }

    // Jump overlay: fade in/out.
    if (jumping) {
      const p = ctx.gate.progress;
      const opacity = p < 0.4 ? p / 0.4 : p > 0.6 ? (1 - p) / 0.4 : 1;
      if (!overlayShown) {
        overlay.style.display = 'flex';
        overlayShown = true;
      }
      const fadeStep = Math.round(opacity * 32);
      if (fadeStep !== lastFadeStep) {
        lastFadeStep = fadeStep;
        overlay.style.opacity = (fadeStep / 32).toFixed(3);
      }
      if (ctx.gate.destination !== labelFor) {
        labelFor = ctx.gate.destination;
        const dest = SYSTEMS[labelFor];
        label.textContent = 'JUMP — ' + (dest ? dest.name : labelFor);
      }
    } else if (overlayShown || wasJumping) {
      overlay.style.display = 'none';
      overlay.style.opacity = (0).toFixed(3);
      overlayShown = false;
      lastFadeStep = -1;
      labelFor = null;
    }
    wasJumping = jumping;
  }

  return { update };
}

// =============================================================================
// MODELS BROWSER ENTRY POINT
// =============================================================================

/**
 * Standalone gate model builder for the Models Browser.
 * Returns an unparented gate assembly at the origin with visual update.
 * This is a thin wrapper that uses the same sculpt code as live gates.
 * @param {string} faction - Faction id (e.g., 'freehold', 'beautiful', 'lamplighter')
 * @param {Object} opts - { hub: boolean, routes: number }
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildGateModel(faction = 'independent', opts = {}) {
  const { hub = false, routes = 0 } = opts;
  const beautiful = isBeautiful(faction);

  // Build a synthetic gate def at the origin.
  const gateDef = { position: [0, 0, 0], to: null };

  // Build the assembly using the same builder as live gates.
  const a = buildAssembly(gateDef, faction, beautiful);

  // Add junction extras if hub option is set.
  if (hub && routes > 0) {
    a.isHub = true;
    a.routeIndex = 0;
    a.routes = Array.from({ length: routes }, (_, i) => `route${i}`);
    buildJunctionExtras(a, a.routes);
  }

  // Ensure the group is at the origin.
  a.group.position.set(0, 0, 0);
  a.group.rotation.set(0, 0, 0);

  // Create the update function (visual only, no gameplay).
  let prevElapsed = 0;
  function update(elapsed, reducedMotion) {
    const dt = prevElapsed === 0 ? 0.016 : Math.max(0, elapsed - prevElapsed);
    prevElapsed = elapsed;
    animateAssembly(a, elapsed, dt, reducedMotion, false, 0); // parked model: never charging
  }

  return {
    object: a.group,
    update,
    label: `${FACTIONS[faction]?.name ?? faction}${hub ? ' hub' : ''} gate`,
  };
}
