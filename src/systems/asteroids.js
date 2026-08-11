import * as THREE from 'three';
import { WEAPONS, SYSTEMS } from '../game/state.js';
import { spawnPod } from '../game/pods.js';

/**
 * Asteroid field — one InstancedMesh of tumbling rocks built from
 * SYSTEMS[ctx.world.currentSystem].field (doc §6.8 terrain, §10.3 miner,
 * §15.1 system identity).
 *
 * Wave 2: per-system rebuild. On ctx.lastEvents 'systemLoaded' { to } the old
 * InstancedMesh is removed/disposed and the field regenerates from
 * SYSTEMS[to].field (center/radius/count/oreMult). ctx.asteroids.list is
 * REPLACED with a new array so combat.js never holds stale entries.
 * oreMult scales ore per rock (Veridian 1.5 → ×1.5 rounded up: richer rock).
 *
 * Ownership: writes ctx.asteroids = { list } (combat.js raycasts its mining
 * beam against list entries { id, position, radius, ore }); consumes
 * 'mineHit' events from ctx.lastEvents; spawns ore pods via spawnPod.
 * Never touches ctx.input, ctx.ship, ctx.camera.
 *
 * Perf: zero per-frame allocations. Tumble matrices are recomputed for a
 * round-robin subset of rocks each frame using module-scope scratch objects.
 */

const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _podPos = new THREE.Vector3();
const _drift = new THREE.Vector3();

// Deterministic RNG (mulberry32, same pattern as solarsystem.js) so the
// field layout is stable run-to-run and per system seed.
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

/** Factory: shared material for both InstancedMesh (live) and single-mesh browser. */
function makeRockMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8a7a68, // gray-brown
    roughness: 0.95,
    metalness: 0.08,
    flatShading: true,
  });
}

function makeRockGeometry(rng) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.75 + rng() * 0.5; // 0.75..1.25 radial wobble
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}
/**
 * Build a standalone asteroid mesh for the models browser (deterministic per seed).
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildAsteroidModel(seed = 1) {
  const rng = makeRng(seed);
  const geo = makeRockGeometry(rng);
  const mat = makeRockMaterial();
  const object = new THREE.Mesh(geo, mat);

  // Midpoint of instance scale range (2..14 → 8). Live path uses baseScale = radius.
  object.scale.setScalar(8);

  // Tumble state mirrors live rock structure.
  const axis = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
  const spin = (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1);
  let angle = rng() * Math.PI * 2;

  const _quat = new THREE.Quaternion();
  const _axis = new THREE.Vector3();

  function update(elapsed, reducedMotion) {
    if (reducedMotion) return;
    // Live path amortizes over ~4 frames (n/chunk ≈ 4); we advance every frame.
    angle += spin * 0.016 * 4; // dt ≈ 0.016 at 60fps, n/chunk ≈ 4
    _quat.setFromAxisAngle(axis, angle);
    object.quaternion.copy(_quat);
  }

  return { object, update, label: 'Asteroid' };
}

export function initAsteroids(ctx) {
  // Mutable build state, swapped wholesale on rebuild.
  let mesh = null;
  let rocks = [];
  let list = [];
  let chunk = 1;
  let cursor = 0;

  function build(def) {
    const field = def.field;
    const count = field.count;
    const [cx, cy, cz] = field.center;
    const oreMult = field.oreMult ?? 1;
    const rng = makeRng(0xa57e000 + def.worldSeed);

    const geo = makeRockGeometry(rng);
    const mat = makeRockMaterial();
    mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false; // instances span the whole field
    ctx.scene.add(mesh);

    // Internal per-instance state (render + sim), parallel to ctx.asteroids.list.
    rocks = [];
    list = [];
    for (let i = 0; i < count; i++) {
      // Flattened torus/cluster: ring 35%..100% of field radius, y squashed.
      const theta = rng() * Math.PI * 2;
      const r = field.radius * (0.35 + 0.65 * Math.pow(rng(), 0.7));
      const position = new THREE.Vector3(
        cx + Math.cos(theta) * r + (rng() - 0.5) * 24,
        cy + (rng() - 0.5) * 36,
        cz + Math.sin(theta) * r + (rng() - 0.5) * 24,
      );
      const radius = 2 + Math.pow(rng(), 1.6) * 12; // scales 2..14, biased small
      const living = rng() < 0.05; // ~5% living rock (§10.3 premium bio food)
      const baseColor = new THREE.Color().setHSL(
        0.07 + rng() * 0.04, // brown-gray hue band
        0.12 + rng() * 0.12,
        0.32 + rng() * 0.18, // slight per-instance brightness variation
      );

      const rock = {
        position,
        radius,
        baseScale: radius, // geometry radius is 1 → scale == world radius
        axis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
        spin: (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1), // rad/s, slow tumble
        angle: rng() * Math.PI * 2,
        // oreMult rounds up: Veridian's 1.5 yields visibly richer rock.
        ore: Math.ceil((4 + Math.floor(rng() * 9)) * oreMult), // 4..12 × oreMult
        commodity: living ? 'livingRock' : 'rawOre',
        extract: 0, // fractional extraction accumulator
        depleted: false,
        hitThisFrame: false,
        hitPoint: null, // last mineHit point (borrowed ref, cloned on pod spawn)
        baseColor,
      };
      rocks.push(rock);
      list.push({ id: i, position, radius, ore: rock.ore });

      // Initial instance transform + color.
      _quat.setFromAxisAngle(rock.axis, rock.angle);
      _scale.setScalar(radius);
      _mat4.compose(position, _quat, _scale);
      mesh.setMatrixAt(i, _mat4);
      mesh.setColorAt(i, baseColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Replace (never mutate) so combat.js drops stale entries immediately.
    ctx.asteroids = { list };

    // Tumble budget: recompose ~1/4 of instances per frame (full sweep ≈
    // every 4 frames ≈ 15 Hz at 60 fps) — smooth motion, flat cost.
    chunk = Math.ceil(count / 4);
    cursor = 0;
  }

  function rebuild(to) {
    if (mesh) {
      ctx.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }
    build(SYSTEMS[to]);
  }

  function deplete(i, rock) {
    rock.depleted = true;
    rock.radius = rock.baseScale * 0.3;
    list[i].radius = rock.radius;
    list[i].ore = 0;
    _quat.setFromAxisAngle(rock.axis, rock.angle);
    _scale.setScalar(rock.radius);
    _mat4.compose(rock.position, _quat, _scale);
    mesh.setMatrixAt(i, _mat4);
    // Darken: world-tells-first depletion cue (§13.1).
    _color.copy(rock.baseColor).multiplyScalar(0.35);
    mesh.setColorAt(i, _color);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  build(SYSTEMS[ctx.world.currentSystem]);

  return {
    update(dt) {
      // --- System swap (jump.js midpoint event, consumed next frame) ---
      for (let e = 0; e < ctx.lastEvents.length; e++) {
        const ev = ctx.lastEvents[e];
        if (ev.type === 'systemLoaded') {
          rebuild(ev.to);
          break; // fresh field: nothing else in this queue can apply to it
        }
      }

      // --- Slow tumble, round-robin subset, zero allocations ---
      const n = rocks.length;
      const end = Math.min(cursor + chunk, n);
      for (let i = cursor; i < end; i++) {
        const rock = rocks[i];
        if (rock.depleted) continue;
        rock.angle += rock.spin * dt * (n / chunk); // amortized over skipped frames
        _quat.setFromAxisAngle(rock.axis, rock.angle);
        _scale.setScalar(rock.baseScale);
        _mat4.compose(rock.position, _quat, _scale);
        mesh.setMatrixAt(i, _mat4);
      }
      cursor = end >= n ? 0 : end;
      mesh.instanceMatrix.needsUpdate = true;

      // --- Mining: consume combat's 'mineHit' beam contacts (§6.3) ---
      for (let e = 0; e < ctx.lastEvents.length; e++) {
        const ev = ctx.lastEvents[e];
        if (ev.type === 'mineHit') {
          const rock = rocks[ev.asteroidId];
          if (rock && !rock.depleted) {
            rock.hitThisFrame = true;
            if (ev.point) rock.hitPoint = ev.point;
          }
        }
      }
      const yieldUnits = ctx.world.activeEvent?.kind === 'strikeRush' ? 2 : 1; // strike-rush hook
      const rate = WEAPONS.mining.extractPerSec * dt;
      for (let i = 0; i < n; i++) {
        const rock = rocks[i];
        if (!rock.hitThisFrame) continue;
        rock.hitThisFrame = false;
        rock.extract += rate;
        while (rock.extract >= 1 && rock.ore > 0) {
          rock.extract -= 1;
          rock.ore -= 1;
          list[i].ore = rock.ore;
          // Pod spawns at the beam contact point (or near the rock) with a
          // small random drift so the player scoops it on a flyby.
          if (rock.hitPoint) {
            _podPos.copy(rock.hitPoint);
          } else {
            _podPos.copy(rock.position);
          }
          _podPos.x += (Math.random() - 0.5) * rock.baseScale;
          _podPos.y += (Math.random() - 0.5) * rock.baseScale;
          _podPos.z += (Math.random() - 0.5) * rock.baseScale;
          _drift.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(4);
          spawnPod(ctx, [{ commodity: rock.commodity, units: yieldUnits }], _podPos, _drift);
          if (rock.ore <= 0) deplete(i, rock);
        }
      }
    },
  };
}
