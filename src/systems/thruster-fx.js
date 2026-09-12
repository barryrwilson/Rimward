import * as THREE from 'three';
import { classCruise } from '../game/living-cadence.js';
import { styleFor } from '../game/faction-style.js';

/**
 * Thruster FX — a velocity-driven drive plume for every BUILT hull.
 *
 * Every GLB ship carries a RIMWARD_ENGINE_GLOW flare bead that ship-assets.js
 * parks in the root's 'engine-effect' group (root.userData.glow). Before this
 * module the bead was static: a freighter at rest and a cutter at full burn
 * wore the same pearl. attachThruster hangs two additive cones behind that
 * bead — a short bright core and a longer soft halo — in the faction's glow
 * colour (faction-style.js), and updateThruster stretches them with the
 * hull's speed each frame:
 *
 *   level = speed / classCruise(classKey), eased (~6/s) so throttle steps read
 *           as a ramp, not a switch; clamped to LEVEL_MAX so an afterburner or
 *           a burn-speed NPC reads hotter than cruise without a mile-long cone.
 *   plume  length = radius-scaled max × level; width breathes with level;
 *           opacity rises with level; hidden entirely below LEVEL_SHOW.
 *   bead   the flare itself swells up to +60% at cruise.
 *   flicker a small two-sine shimmer on length/width, OFF under reducedMotion
 *           (the plume then scales with speed only — still, no motion).
 *
 * Two factions are excluded by contract: the Beautiful Ones have no
 * propulsion organs (Bio03ClassLookDesign.md — "thrust reads as a
 * bioluminescent surge … no nozzle, no glow pods"), and the Unknowables have
 * no hull at all (faction-style.js — additive light fields, not a ship). The
 * player's living manta keeps its vein surge in ship.js. attachThruster is a
 * no-op for all of them.
 *
 * The cones are SIBLINGS of the bead inside the glow group, never children of
 * it and never the group itself: npc.js animates glow.scale / glow.visible for
 * the shaken waver, the pirate telegraph flash, and the disabled flicker, and
 * the wave-39 pins hold glow.scale at EXACTLY 1 under reducedMotion. This
 * module touches only its own meshes plus the bead's local scale.
 *
 * Zero per-frame allocation: geometry is one shared module lathe, the two
 * shader materials are per instance (opacity animates per ship) and are
 * disposed by releaseShipAsset through userData.thruster.
 */

export const THRUSTER_EXCLUDED_FACTIONS = Object.freeze(['beautiful', 'unknowables']);

const LEVEL_MAX = 1.6; // burn ≈ 2× cruise; cap the stretch short of that
const LEVEL_SHOW = 0.03; // below this the plume is hidden outright
const LEVEL_RATE = 6; // 1/s — ease toward the speed target
const DT_MAX = 0.1; // clamp a stalled frame so the ease cannot jump
const CORE_LEN = 0.45; // × hull bounding radius at level 1
const HALO_LEN = 0.85;
const WIDTH_FLOOR = 0.07; // plume base half-width ≥ this × hull bounding radius
const CORE_WIDTH = 0.75; // × plume width at level 1
const HALO_WIDTH = 1.9;
const BEAD_SWELL = 0.6; // bead scale = 1 + BEAD_SWELL × min(level, 1)
const CORE_OPACITY = 1.0;
const HALO_OPACITY = 0.45;
const FLICKER_AMP = 0.09;

// One plume body, base at the local origin, tip at local +Z (aft; nose is
// -Z). A lathe with a blunt (1-z)^0.55 taper, not a straight cone: a cone's
// linear silhouette reads as a blade. Vertex colour fades white → black from
// base to tip: under additive blending black is transparent, so the plume
// dissolves instead of ending in a hard point.
const plumeGeometry = (() => {
  const profile = [];
  const SEG = 12;
  for (let i = 0; i <= SEG; i++) {
    const y = i / SEG;
    profile.push(new THREE.Vector2(Math.pow(1 - y, 0.55), y));
  }
  const geo = new THREE.LatheGeometry(profile, 16);
  geo.rotateX(Math.PI / 2);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const z = Math.min(Math.max(pos.getZ(i), 0), 1); // 0 base → 1 tip
    const c = Math.pow(1 - z, 1.6);
    col[i * 3] = c;
    col[i * 3 + 1] = c;
    col[i * 3 + 2] = c;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
})();

const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
// Flicker phase: a golden-angle walk, not Math.random — the plume must never
// perturb the shared RNG stream that world generation and the boot test read.
let phaseWalk = 0;

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

/** True when `faction` flies built hulls that carry a drive plume. */
export function thrusterFaction(faction) {
  return !THRUSTER_EXCLUDED_FACTIONS.includes(faction);
}

// Silhouette-soft additive plume shader. A flat-shaded body always shows a
// hard outline; this dims each fragment by how squarely its surface faces the
// eye (|n·v|^EDGE_POWER), so the rim of the plume melts into space from every
// angle, and multiplies by the per-vertex length fade baked into the geometry.
// Alpha is folded into RGB: additive blending adds src.rgb × src.a onto the
// frame, so black is transparent and no depth sorting is needed.
const PLUME_VERTEX = /* glsl */ `
varying float vFade;
void main() {
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 v = normalize(-mv.xyz);
  float facing = abs(dot(n, v));
  vFade = color.r * pow(facing, EDGE_POWER);
  gl_Position = projectionMatrix * mv;
}
`;
const PLUME_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  gl_FragColor = vec4(uColor * (vFade * uOpacity), 1.0);
  #include <colorspace_fragment>
}
`;

function plumeMaterial(color, opacity) {
  return new THREE.ShaderMaterial({
    name: 'RIMWARD_THRUSTER_PLUME',
    vertexShader: PLUME_VERTEX,
    fragmentShader: PLUME_FRAGMENT,
    defines: { EDGE_POWER: '1.6' },
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Hang the plume behind `bead` inside `glowGroup`. Returns the thruster
 * record (also stored on root.userData.thruster) or null for an excluded
 * faction or a missing bead.
 */
export function attachThruster(root, faction, classKey, glowGroup, bead) {
  if (!root || !glowGroup || !bead || !thrusterFaction(faction)) return null;
  const style = styleFor(faction);
  // Bead extents in its own frame (Blender bakes the ellipsoid scale into the
  // geometry, so the mesh's local box is the flare's true size).
  if (bead.geometry) {
    if (!bead.geometry.boundingBox) bead.geometry.computeBoundingBox();
    bead.geometry.boundingBox.getSize(_size);
    bead.geometry.boundingBox.getCenter(_center);
  } else {
    _size.set(0.2, 0.16, 0.14);
    _center.set(0, 0, 0);
  }
  // The GLB keeps the flare's ellipsoid as the NODE scale (the geometry is a
  // unit-ish sphere), so the true flare size is box × rest scale. That rest
  // scale is remembered once and every per-frame swell multiplies it — the
  // authored size is never clobbered.
  const restScale = bead.scale.clone();
  const halfWidth = Math.max(_size.x * restScale.x, _size.y * restScale.y, 0.05) * 0.5;
  const halfDepth = Math.max(_size.z * restScale.z, 0.05) * 0.5;
  const hullRadius = Number.isFinite(root.userData.radius) && root.userData.radius > 0
    ? root.userData.radius
    : Math.max(halfWidth * 8, 1);
  // Plume width: the flare bead is a small bright point on a big hull, so the
  // cone takes the wider of the bead and a hull-proportional floor.
  const plumeWidth = Math.max(halfWidth, hullRadius * WIDTH_FLOOR);

  const core = new THREE.Mesh(plumeGeometry, plumeMaterial(style.glow, CORE_OPACITY));
  core.name = 'RIMWARD_THRUSTER_CORE';
  const halo = new THREE.Mesh(plumeGeometry, plumeMaterial(style.glow, HALO_OPACITY));
  halo.name = 'RIMWARD_THRUSTER_HALO';
  for (const mesh of [core, halo]) {
    // Base on the bead's aft face; the bead sits on the hull's drive end.
    mesh.position.copy(bead.position);
    mesh.position.x += _center.x * restScale.x;
    mesh.position.y += _center.y * restScale.y;
    mesh.position.z += _center.z * restScale.z + halfDepth * 0.5;
    mesh.quaternion.copy(bead.quaternion);
    mesh.visible = false;
    mesh.scale.set(plumeWidth, plumeWidth, 0.001);
    mesh.frustumCulled = false; // it stretches per frame; culling by rest bounds would pop
    mesh.renderOrder = 1; // after the opaque hull, with the other additive fields
    glowGroup.add(mesh);
  }
  const thruster = {
    core,
    halo,
    bead,
    restScale,
    classKey,
    plumeWidth,
    hullRadius,
    level: 0,
    lastElapsed: null,
    phase: (phaseWalk++ * 2.399963) % (Math.PI * 2),
  };
  root.userData.thruster = thruster;
  return thruster;
}

/**
 * Drive the plume from `speed` (world units per second). `elapsed` is the
 * caller's monotonic clock; the ease derives its own dt from it.
 */
export function updateThruster(root, speed, elapsed, reducedMotion = false) {
  const th = root && root.userData && root.userData.thruster;
  if (!th) return;
  const spd = Number.isFinite(speed) && speed > 0 ? speed : 0;
  const target = clamp(spd / classCruise(th.classKey), 0, LEVEL_MAX);
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  const dt = th.lastElapsed === null ? DT_MAX : clamp(t - th.lastElapsed, 0, DT_MAX);
  th.lastElapsed = t;
  th.level += (target - th.level) * (1 - Math.exp(-LEVEL_RATE * dt));
  if (Math.abs(target - th.level) < 1e-3) th.level = target;
  const level = th.level;

  const lit = Math.min(level, 1);
  th.bead.scale.copy(th.restScale).multiplyScalar(1 + BEAD_SWELL * lit);

  if (level < LEVEL_SHOW) {
    th.core.visible = false;
    th.halo.visible = false;
    return;
  }
  const flicker = reducedMotion
    ? 1
    : 1 + FLICKER_AMP * Math.sin(t * 37 + th.phase) * Math.sin(t * 23.3 + th.phase * 0.7);
  const w = th.plumeWidth * (0.6 + 0.4 * lit) * flicker;
  const len = th.hullRadius * level * flicker;
  th.core.visible = true;
  th.halo.visible = true;
  th.core.scale.set(w * CORE_WIDTH, w * CORE_WIDTH, len * CORE_LEN);
  th.halo.scale.set(w * HALO_WIDTH, w * HALO_WIDTH, len * HALO_LEN);
  th.core.material.uniforms.uOpacity.value = CORE_OPACITY * (0.35 + 0.65 * lit);
  th.halo.material.uniforms.uOpacity.value = HALO_OPACITY * (0.3 + 0.7 * lit);
}

/** Dispose the instance-owned plume materials. Geometry is shared; keep it. */
export function releaseThruster(root) {
  const th = root && root.userData && root.userData.thruster;
  if (!th) return;
  th.core.material.dispose();
  th.halo.material.dispose();
  root.userData.thruster = null;
}
