import * as THREE from 'three';
import { U } from './state.js';

/**
 * Cargo pods — shared infrastructure (orchestrator-owned).
 * Any system may spawn pods via spawnPod (imports this module read-only):
 * jettisoned surrenders (npc.js), mined ore (asteroids.js), aftermath (world.js).
 *
 * Pods drift, glitter, and auto-scoop within U.SCOOP_RANGE of the player ship
 * (doc §4.1 "scoop" verb made physical; cargo capacity enforced).
 */

const _toPlayer = new THREE.Vector3();
let podGeo = null;
let podMat = null;

export function spawnPod(ctx, contents, position, drift = null) {
  podGeo ??= new THREE.IcosahedronGeometry(0.9, 0);
  podMat ??= new THREE.MeshStandardMaterial({
    color: 0x3fae6a, // salvage green (doc §18.4)
    emissive: 0x1d5c38,
    roughness: 0.4,
    metalness: 0.3,
  });
  const mesh = new THREE.Mesh(podGeo, podMat);
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
