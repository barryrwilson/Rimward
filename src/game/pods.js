import * as THREE from 'three';
import { U } from './state.js';

/**
 * Cargo pods — shared infrastructure (orchestrator-owned).
 * Any system may spawn pods via spawnPod (imports this module read-only):
 * jettisoned surrenders (npc.js), mined ore (asteroids.js), aftermath (world.js).
 *
 * Pods drift, glitter, and auto-scoop within U.SCOOP_RANGE of the player ship
 * (doc §4.1 "scoop" verb made physical; cargo capacity enforced).
 *
 * Wave 51: spawnPod takes an optional 5th `tint` (hex int) so mined ore reads
 * as what it is while it drifts — asteroids.js passes ORE_TYPES[oreKey].podTint.
 * Tinted materials come from a per-tint cache below; a 4-argument call still
 * yields the IDENTICAL pre-wave-51 salvage-green pod (npc.js and world.js
 * depend on that look).
 */

const _toPlayer = new THREE.Vector3();
let podGeo = null;

// Wave 51: tint-keyed material cache replaces the old single `podMat`
// singleton. The `null` key holds the DEFAULT salvage-green material — a
// 4-argument spawnPod call resolves to exactly the instance pre-wave-51 code
// used, so jettisoned surrenders and aftermath salvage look unchanged. Any
// other key is an ore podTint hex int and gets a clone of the default's
// settings with `color` overridden and a matching dimmer `emissive` (the
// default keeps emissive at roughly half its color's brightness: 0x3fae6a →
// 0x1d5c38). Geometry stays a single shared singleton — only materials vary.
//
// The cache is process-lifetime and INTENTIONALLY never cleared: one default
// plus at most nine ore tints, shared by every pod in every system. Do not
// "fix" this into a leak-avoidance dispose loop.
const podMats = new Map();

function podMaterialFor(tint) {
  let mat = podMats.get(tint);
  if (mat) return mat;
  mat = new THREE.MeshStandardMaterial({
    color: 0x3fae6a, // salvage green (doc §18.4)
    emissive: 0x1d5c38,
    roughness: 0.4,
    metalness: 0.3,
  });
  if (tint != null) {
    mat.color.setHex(tint);
    // Dimmer emissive matched to the tint — same half-brightness relationship
    // the default keeps between color and emissive.
    mat.emissive.setHex(tint).multiplyScalar(0.5);
  }
  podMats.set(tint, mat);
  return mat;
}

export function spawnPod(ctx, contents, position, drift = null, tint = null) {
  podGeo ??= new THREE.IcosahedronGeometry(0.9, 0);
  const mesh = new THREE.Mesh(podGeo, podMaterialFor(tint));
  mesh.position.copy(position);
  ctx.scene.add(mesh);
  const pod = {
    mesh,
    contents, // [{ commodity, units }]
    velocity: drift ? drift.clone() : new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
    bornAt: ctx.world.time,
    ttl: 300, // world-seconds before fading out
  };
  ctx.pods.push(pod);
  ctx.emit('podSpawned', { pod });
  return pod;
}
/**
 * Build a standalone pod mesh for the models browser (no ctx, no scene, no shared state).
 * Returns a cloned material so emissive drive doesn't affect live pods.
 * Wave 51: optional `tint` is a raw hex int matching spawnPod's parameter —
 * the browser model clones from the same cached per-tint material live pods
 * use. The label stays 'Cargo pod' either way (COMMODITIES has no hex→key
 * index, so a hex cannot be named here).
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildPodModel(tint = null) {
  podGeo ??= new THREE.IcosahedronGeometry(0.9, 0);

  // Clone material: browser pod's emissive drive must not mutate live pods.
  const browserMat = podMaterialFor(tint).clone();
  const object = new THREE.Mesh(podGeo, browserMat);

  let spin = 0;

  function update(elapsed, reducedMotion) {
    if (reducedMotion) {
      spin = 0;
      browserMat.emissiveIntensity = 0.8;
      return;
    }
    // Live path: spin accumulates per-frame (line 46), each pod gets offset rotation.
    // We mirror index 0: spin * 0.7 + 0 for x, spin * 1.1 + 0 for y, z always 0.
    spin += 0.016; // dt ≈ 0.016 at 60fps
    object.rotation.set(spin * 0.7, spin * 1.1, 0);
    // Glitter: same math as line 52 for index 0 (spin * 3 + 0).
    browserMat.emissiveIntensity = 0.8 + 0.4 * Math.sin(spin * 3);
  }

  return { object, update, label: 'Cargo pod' };
}


export function initPods(ctx) {
  ctx.pods = ctx.pods ?? [];
  let spin = 0;

  return {
    update(dt) {
      spin += dt;
      const playerObj = ctx.ship.object;
      for (let i = ctx.pods.length - 1; i >= 0; i--) {
        const pod = ctx.pods[i];
        pod.mesh.position.addScaledVector(pod.velocity, dt);
        pod.mesh.rotation.set(spin * 0.7 + i, spin * 1.1 + i * 2, 0);
        pod.mesh.material.emissiveIntensity = 0.8 + 0.4 * Math.sin(spin * 3 + i); // glitter

        if (ctx.world.time - pod.bornAt > pod.ttl) {
          ctx.scene.remove(pod.mesh);
          ctx.pods.splice(i, 1);
          continue;
        }

        // Auto-scoop: magnet in, collect at contact. Respects cargo capacity.
        if (playerObj && !ctx.flags.docked) {
          _toPlayer.subVectors(playerObj.position, pod.mesh.position);
          const dist = _toPlayer.length();
          if (dist < U.SCOOP_RANGE * 3) pod.mesh.position.addScaledVector(_toPlayer.normalize(), dt * 15);
          if (dist < U.SCOOP_RANGE) {
            const used = ctx.cargo.reduce((n, c) => n + c.units, 0);
            const incoming = pod.contents.reduce((n, c) => n + c.units, 0);
            if (used + incoming <= ctx.cargoCapacity) {
              for (const c of pod.contents) {
                const existing = ctx.cargo.find((x) => x.commodity === c.commodity);
                if (existing) existing.units += c.units;
                else ctx.cargo.push({ ...c });
              }
              ctx.emit('podCollected', { pod });
              ctx.scene.remove(pod.mesh);
              ctx.pods.splice(i, 1);
            }
          }
        }
      }
    },
  };
}
