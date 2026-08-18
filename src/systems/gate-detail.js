/**
 * Gate-sculpt toolkit — G0 shared functions, not a shared mesh.
 *
 * Authority: docs/FactionGateDesignBible.md.
 * Merge / frame / weather live in station-detail.js (wave 43). This module
 * re-exports that builder and adds gate-only helpers: seeded tunnel fill,
 * lamp runs at HUMAN.lampGap, shutter rings, and the Guild hub lantern extra.
 *
 * Faction builders (G1+) must not wrap the live TorusGeometry chassis.
 * Colours arrive as hex. This file does not import FACTION_STYLE.
 */

import * as THREE from 'three';
import {
  rng,
  weather,
  SHADES,
  detailBuilder,
  box,
  cyl,
  sphere,
  hemi,
  torus,
  cone,
  ribBands,
  windowRow,
  windowGrid,
  panelSkin,
  truss,
  railing,
  lampString,
  crate,
  antenna,
  pipeRun,
} from './station-detail.js';
import {
  HUMAN,
  BORE_RADIUS,
  RING_TUBE,
  TUNNEL_COUNT,
  TUNNEL_DEPTH,
  HEX_RADIUS,
  HEX_BAR_THICK,
  ARM_THICK,
  LAMP_BASE_SCALE,
  LAMP_BASE_OPACITY,
  RING_RADIUS,
  GUILD,
  lampCountForRun,
} from '../game/gate-scale.js';

export {
  rng,
  weather,
  SHADES,
  detailBuilder,
  box,
  cyl,
  sphere,
  hemi,
  torus,
  cone,
  ribBands,
  windowRow,
  windowGrid,
  panelSkin,
  truss,
  railing,
  lampString,
  crate,
  antenna,
  pipeRun,
  lampCountForRun,
};

/** FNV-1a 32-bit. Same family as station.js system seeds. */
export function seedFromParts(...parts) {
  let h = 2166136261;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Fill preallocated tunnel arrays from a seed. Replaces Math.random() so two
 * builds of the same gate are byte-identical.
 */
export function fillTunnelArrays(swirlBase, swirlZ, seed, count = TUNNEL_COUNT, depth = TUNNEL_DEPTH) {
  const rand = rng(seed);
  for (let i = 0; i < count; i++) {
    swirlBase[i * 2] = rand() * Math.PI * 2;
    swirlBase[i * 2 + 1] = 0.55 + rand() * 0.5;
    swirlZ[i] = rand() * depth;
  }
}

/** Patched ring in the XY (bore) plane. Width follows the tangent. */
export function segmentedRing(b, ch, hexes, {
  radius, tube = 2.4, depth = 3.6, segments = 16, seed = 1, jitter = 0.18,
} = {}) {
  const rand = rng(seed);
  const w = (2 * Math.PI * radius) / segments * 1.12;
  for (let i = 0; i < segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const hex = hexes[i % hexes.length];
    const h = tube * 2 * (1 - jitter + rand() * jitter * 2);
    box(b, ch, hex, w, h, depth * (0.85 + rand() * 0.3), {
      x: Math.cos(ang) * radius,
      y: Math.sin(ang) * radius,
      rz: ang + Math.PI / 2,
    });
  }
}

/** Six-face collar. Veridian outline. */
export function hexCollar(b, ch, hex, { radius, thick = 4.2, depth = 5.5 }) {
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    box(b, ch, hex, radius * 1.08, thick, depth, {
      x: Math.cos(ang) * radius,
      y: Math.sin(ang) * radius,
      rz: ang + Math.PI / 2,
    });
  }
}

/** Cardinal or evenly spaced boxes around the bore. */
export function spokeBoxes(b, ch, hex, {
  count, radius, w, h, d, z = 0, offset = 0,
} = {}) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + offset;
    box(b, ch, hex, w, h, d, {
      x: Math.cos(ang) * radius,
      y: Math.sin(ang) * radius,
      z,
      rz: ang + Math.PI / 2,
    });
  }
}

/** Work-lamp run. Count comes from HUMAN.lampGap, never lampSize. */
export function lampRun(b, ch, hex, { ax, ay, az, bx, by, bz, size = HUMAN.lampSize }) {
  const length = Math.hypot(bx - ax, by - ay, bz - az);
  lampString(b, ch, hex, {
    ax, ay, az, bx, by, bz,
    count: lampCountForRun(length),
    size,
  });
}

/**
 * Nested shutter rings stacked into the bore (−Z). These give tunnel depth
 * on a new body. They are not a faction outline.
 */
export function shutterRings(b, ch, hex, {
  radius = BORE_RADIUS,
  tube = RING_TUBE * 0.16,
  count = 4,
  depth = 8,
  rseg = 8,
  tseg = 24,
} = {}) {
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    torus(b, ch, hex, radius * (1 - t * 0.18), tube, rseg, tseg, undefined, {
      z: -t * depth,
    });
  }
}

// Shared hub lantern geos. Tagged shared; never disposed.
let _hubShared = null;
export function hubLanternShared() {
  if (_hubShared) return _hubShared;
  const hexBarGeo = new THREE.BoxGeometry(HEX_RADIUS, HEX_BAR_THICK, HEX_BAR_THICK);
  hexBarGeo.userData.shared = true;
  const armGeo = new THREE.BoxGeometry(HEX_RADIUS - RING_RADIUS, ARM_THICK, ARM_THICK);
  armGeo.userData.shared = true;
  _hubShared = { hexBarGeo, armGeo };
  return _hubShared;
}

/**
 * Guild-neutral hub lantern (R6). Hex frame + one arm lamp per route.
 * Same hooks the live hub already uses: hexFrame, lamps named
 * 'junction-arm-lamp', userData.routeCount / routeIndex.
 */
export function attachHubLantern(a, routes, shared) {
  const sh = shared ?? hubLanternShared();
  const hexMat = new THREE.MeshStandardMaterial({
    color: GUILD.brassDark,
    emissive: GUILD.amber,
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
  const map = sh.beaconMap;
  for (let k = 0; k < routes.length; k++) {
    const phi = (k / routes.length) * Math.PI * 2;
    const arm = new THREE.Mesh(sh.armGeo, hexMat);
    arm.position.set(Math.cos(phi) * armR, Math.sin(phi) * armR, 0);
    arm.rotation.z = phi;
    arms.add(arm);
    const lampMat = new THREE.SpriteMaterial({
      map: map ?? null,
      color: GUILD.amber,
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

/**
 * Tiny dummy sculpt used only to probe the kit. Not a faction gate.
 * One hull box, one glow lamp run, four shutter rings.
 */
export function probeKitSculpt(seed = 1) {
  const b = detailBuilder();
  box(b, 'hull', GUILD.brass, 4, 2, 6, { x: BORE_RADIUS + 4, y: 0, z: 0 });
  shutterRings(b, 'hull', GUILD.brassDark, { count: 4, depth: 8 });
  lampRun(b, 'glow', 0xf0e0c0, {
    ax: 0, ay: BORE_RADIUS + 2, az: -4,
    bx: 0, by: BORE_RADIUS + 2, bz: 4,
  });
  const geos = b.build();
  // Touch the seed so callers can prove determinism without unused-arg lint.
  rng(seed)();
  return geos;
}
