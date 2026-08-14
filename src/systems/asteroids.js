import * as THREE from 'three';
import { WEAPONS, SYSTEMS, ORE_TYPES, COMMODITIES, pickOreType, oreKeysForBand } from '../game/state.js';
import { spawnPod } from '../game/pods.js';

/**
 * Asteroid field — one InstancedMesh PER ORE TYPE of tumbling rocks, built
 * from SYSTEMS[ctx.world.currentSystem].field plus the system's band
 * (doc §6.8 terrain, §10.3 miner, §13.1 world-tells-first, §15.1 identity).
 *
 * Wave 51: per-ore mesh fan-out. Field composition is driven by the system
 * BAND (def.band ?? 0) through ORE_BAND_WEIGHTS: a first pass draws one ore
 * key per rock via pickOreType(band, rng()) so the RNG draw order — and thus
 * the mix — is deterministic per worldSeed. Each ore type that drew ≥1 rock
 * gets its own InstancedMesh named 'asteroid-field-<oreKey>' with
 * userData.oreKey set (boot harness contract); empty meshes are never
 * allocated. Geometry shape, colour band, roughness/metalness/emissive and
 * scaleMult all come from ORE_TYPES[oreKey].rock — this file holds no
 * per-ore constants of its own.
 *
 * Wave 2: per-system rebuild. On ctx.lastEvents 'systemLoaded' { to } EVERY
 * per-ore mesh is removed from the scene and disposed (geometry + material)
 * before the new field builds — a leaked mesh across a jump is a hard
 * failure. ctx.asteroids.list is REPLACED with a new array so combat.js
 * never holds stale entries. oreMult scales ore per rock (Veridian 1.5 →
 * ×1.5 rounded up: richer rock).
 *
 * Hardness/resist extraction maths (§6.3): combat.js emits 'mineHit'
 * { asteroidId, point, laserTier, extractPerSec } — the raw head rate. The
 * effective rate for a rock is extractPerSec / ORE_TYPES[oreKey].extractResist,
 * so hard rock is slow even with the right head. Rocks harder than the
 * installed head never reach this file: combat.js emits 'mineBlocked'
 * instead. Pods spawn tinted with the ore's podTint (spawnPod's 5th arg).
 *
 * Heat glow (§13.1): a rock being cut warms its instance colour toward the
 * ore's sparkColor (heat += dt*2.5 while hit, cools at dt*1.2 otherwise, so
 * the tint fades ~0.8 s after the beam leaves). Tracked in a small reused
 * active-index array (cap 24 — mining hits one rock at a time). Under
 * ctx.settings.reducedMotion the animated lerp is skipped but a static
 * bright tint is still applied while hot: the feedback survives, the motion
 * does not. Depletion darkens as before and, unless reducedMotion is set,
 * collapses over ~0.4 s with a quadratic ease-out instead of snapping.
 *
 * Ownership: writes ctx.asteroids = { list } (combat.js raycasts its mining
 * beam against list entries { id, position, radius, ore, commodity, oreKey,
 * hardness }); consumes 'mineHit' events from ctx.lastEvents; spawns ore
 * pods via spawnPod. Never touches ctx.input, ctx.ship, ctx.camera.
 *
 * Perf: zero per-frame allocations. Tumble matrices are recomputed for a
 * round-robin subset of the FLAT rock array each frame using module-scope
 * scratch objects; each touched rock writes its own mesh's slot and the
 * mesh is marked instanceMatrix-dirty once per frame via a reused array.
 */

const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _podPos = new THREE.Vector3();
const _drift = new THREE.Vector3();

// Heat-glow bookkeeping cap: mining hits one rock at a time, so 24 listed
// rocks is generous headroom for beam flicker across overlapping frames.
const HEAT_CAP = 24;

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

// PolyhedronGeometry is non-indexed: verts = faces × (detail+1)² × 3.
// Wave 51 vertex budget is ~400 per shape — icosa detail 2 would be 540,
// so icosa-based shapes cap at detail 1 (240); octa detail 2 (216) fits.
function polyDetail(faces, detail) {
  let d = detail;
  while (d > 1 && faces * (d + 1) * (d + 1) * 3 > 400) d--;
  return d;
}

/**
 * Geometry recipe per ORE_TYPES[oreKey].rock.shape. All variants return a
 * computeVertexNormals()'d, flatShading-safe geometry of ≤ ~400 vertices.
 * profile.wobble is [min,max] radial scale; profile.detail is subdivision.
 */
function makeRockGeometry(rng, profile) {
  const [wMin, wMax] = profile.wobble;
  const wobble = () => wMin + rng() * (wMax - wMin);
  let geo;
  switch (profile.shape) {
    case 'blocky': {
      // Fractured slab: subdivided box pushed ~70% onto a wobbled sphere,
      // whole faces then displaced slightly so the cube reads as broken
      // plates, with a non-uniform axis scale baked in (never a die).
      geo = new THREE.BoxGeometry(1.6, 1.6, 1.6, 2, 2, 2);
      const pos = geo.attributes.position;
      const faceVerts = 9; // (2+1)² verts per face; 6 faces in +x,-x,+y,-y,+z,-z order
      const faceShift = []; // drawn up front: keeps the rng draw order stable
      for (let f = 0; f < 6; f++) {
        faceShift.push((rng() - 0.5) * 0.22, (rng() - 0.5) * 0.22, (rng() - 0.5) * 0.22);
      }
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        const k = wobble();
        const f = Math.floor(i / faceVerts) * 3;
        pos.setXYZ(
          i,
          x + ((x / len) * k - x) * 0.7 + faceShift[f],
          y + ((y / len) * k - y) * 0.7 + faceShift[f + 1],
          z + ((z / len) * k - z) * 0.7 + faceShift[f + 2],
        );
      }
      geo.scale(1.05 + rng() * 0.5, 0.55 + rng() * 0.3, 0.8 + rng() * 0.4); // e.g. x×1.3, y×0.7
      geo = geo.toNonIndexed(); // split the plates so flatShading reads the cracks
      break;
    }
    case 'crystal': {
      // Faceted prism: hexagonal tapering column, radial wobble, random
      // axis tilt baked in so instances never align with the world.
      geo = new THREE.CylinderGeometry(0.35, 0.9, 2.0, 6, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = wobble();
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i), pos.getZ(i) * k);
      }
      geo.rotateX((rng() - 0.5) * 0.9);
      geo.rotateZ((rng() - 0.5) * 0.9);
      break;
    }
    case 'shard': {
      // Splintered glass: octahedron with STRONG anisotropic wobble — one
      // random axis crushed to ~0.45, another stretched to ~1.6.
      geo = new THREE.OctahedronGeometry(1, polyDetail(8, profile.detail));
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = wobble();
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
      }
      const crush = Math.floor(rng() * 3);
      let stretch = Math.floor(rng() * 3);
      if (stretch === crush) stretch = (stretch + 1) % 3;
      const s = [1, 1, 1];
      s[crush] = 0.45;
      s[stretch] = 1.6;
      geo.scale(s[0], s[1], s[2]);
      break;
    }
    case 'bloom': {
      // Grown, near-spherical: gentle wobble plus a low-frequency lobed
      // term so the rock reads organic rather than noise-wobbled.
      geo = new THREE.IcosahedronGeometry(1, polyDetail(20, profile.detail));
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const k = wobble() * (1 + 0.18 * Math.sin(3 * Math.atan2(z, x)));
        pos.setXYZ(i, x * k, y * k, z * k);
      }
      break;
    }
    case 'lumpy':
    default: {
      // Classic rock: icosahedron with per-vertex radial wobble.
      geo = new THREE.IcosahedronGeometry(1, polyDetail(20, profile.detail));
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = wobble();
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
      }
      break;
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Material recipe per ORE_TYPES[oreKey].rock. Colour stays WHITE: the live
 * field tints per-instance via setColorAt. Emissive is skipped entirely
 * when the profile's emissive is 0.
 */
function makeRockMaterial(profile) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: profile.roughness,
    metalness: profile.metalness,
    flatShading: profile.shape === 'lumpy' || profile.shape === 'blocky' || profile.shape === 'shard',
  });
  if (profile.emissive) {
    mat.emissive = new THREE.Color(profile.emissive);
    mat.emissiveIntensity = profile.emissiveIntensity;
  }
  return mat;
}

/**
 * Build a standalone asteroid mesh for the models browser (deterministic per seed).
 * Wave 51: optional oreKey selects the ore's geometry/material/colour recipe.
 * @returns {{ object: THREE.Object3D, update: (elapsed: number, reducedMotion: boolean) => void, label: string }}
 */
export function buildAsteroidModel(seed = 1, oreKey = 'rawOre') {
  const key = ORE_TYPES[oreKey] ? oreKey : 'rawOre';
  const profile = ORE_TYPES[key].rock;
  const rng = makeRng(seed);
  const geo = makeRockGeometry(rng, profile);
  const mat = makeRockMaterial(profile);
  // Standalone mesh has no instance colours — bake the ore's HSL band in.
  mat.color.setHSL(
    profile.hue[0] + rng() * profile.hue[1],
    profile.sat[0] + rng() * profile.sat[1],
    profile.light[0] + rng() * profile.light[1],
  );
  const object = new THREE.Mesh(geo, mat);

  // Midpoint of instance scale range (2..14 → 8). Live path uses baseScale = radius.
  object.scale.setScalar(8 * profile.scaleMult);

  // Tumble state mirrors live rock structure.
  const axis = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
  const spin = (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1);
  let angle = rng() * Math.PI * 2;

  const _quat = new THREE.Quaternion();

  function update(elapsed, reducedMotion) {
    if (reducedMotion) return;
    // Live path amortizes over ~4 frames (n/chunk ≈ 4); we advance every frame.
    angle += spin * 0.016 * 4; // dt ≈ 0.016 at 60fps, n/chunk ≈ 4
    _quat.setFromAxisAngle(axis, angle);
    object.quaternion.copy(_quat);
  }

  return { object, update, label: COMMODITIES[key].name + ' asteroid' };
}

export function initAsteroids(ctx) {
  // Mutable build state, swapped wholesale on rebuild.
  let bundles = []; // per-ore { oreKey, mesh, nextSlot, hot, matrixDirty }
  let rocks = []; // flat render+sim state, indexed 0..count-1
  let list = []; // flat ctx.asteroids.list, SAME index as rocks
  let chunk = 1;
  let cursor = 0;
  // Reused bookkeeping arrays — reset on build, never reallocated per frame.
  const dirtyBundles = [];
  const activeHeat = []; // rock indices with heat > 0, capped at HEAT_CAP
  const collapseList = []; // rock indices mid-collapse animation
  // Teardown list: every live per-ore InstancedMesh for THIS ctx. rebuild()
  // disposes and empties it, so no mesh leaks across a system jump. This is
  // per-ctx closure state, NOT module state: the boot harness builds several
  // contexts against this one module, and a shared list would let one ctx's
  // rebuild dispose another ctx's live geometry while it is still rendering.
  const fieldMeshes = [];

  function build(def) {
    const field = def.field;
    const count = field.count;
    const [cx, cy, cz] = field.center;
    const oreMult = field.oreMult ?? 1;
    const band = def.band ?? 0; // §15 band drives composition (wave 51)
    const rng = makeRng(0xa57e000 + def.worldSeed);

    // FIRST PASS — draw every rock's ore key before anything else so the
    // RNG draw order (and thus field composition) is deterministic.
    const draws = new Array(count);
    const perOre = new Map(); // oreKey -> rocks drawn
    for (let i = 0; i < count; i++) {
      const oreKey = pickOreType(band, rng());
      draws[i] = oreKey;
      perOre.set(oreKey, (perOre.get(oreKey) ?? 0) + 1);
    }

    // One InstancedMesh per ore type that actually drew ≥1 rock — never an
    // empty mesh. oreKeysForBand order keeps mesh creation deterministic.
    bundles = [];
    const bundleByOre = new Map();
    for (const oreKey of oreKeysForBand(band)) {
      const slots = perOre.get(oreKey);
      if (!slots) continue;
      const ore = ORE_TYPES[oreKey];
      const mesh = new THREE.InstancedMesh(
        makeRockGeometry(rng, ore.rock),
        makeRockMaterial(ore.rock),
        slots,
      );
      mesh.name = 'asteroid-field-' + oreKey; // boot harness contract
      mesh.userData.oreKey = oreKey;
      mesh.frustumCulled = false; // instances span the whole field
      ctx.scene.add(mesh);
      const bundle = {
        oreKey,
        mesh,
        nextSlot: 0,
        // Heat-glow target: the ore's spark colour, scaled bright.
        hot: new THREE.Color(ore.sparkColor).multiplyScalar(1.6),
        matrixDirty: false,
      };
      bundles.push(bundle);
      bundleByOre.set(oreKey, bundle);
      fieldMeshes.push(mesh);
    }

    // SECOND PASS — flat rocks/list arrays; index i IS the asteroidId.
    rocks = [];
    list = [];
    for (let i = 0; i < count; i++) {
      const oreKey = draws[i];
      const ore = ORE_TYPES[oreKey];
      const profile = ore.rock;
      const bundle = bundleByOre.get(oreKey);
      // Flattened torus/cluster: ring 35%..100% of field radius, y squashed.
      const theta = rng() * Math.PI * 2;
      const r = field.radius * (0.35 + 0.65 * Math.pow(rng(), 0.7));
      const position = new THREE.Vector3(
        cx + Math.cos(theta) * r + (rng() - 0.5) * 24,
        cy + (rng() - 0.5) * 36,
        cz + Math.sin(theta) * r + (rng() - 0.5) * 24,
      );
      // scaleMult sizes the ore's rocks (wakeglass small, slagIron chunky).
      const radius = (2 + Math.pow(rng(), 1.6) * 12) * profile.scaleMult;
      const baseColor = new THREE.Color().setHSL(
        profile.hue[0] + rng() * profile.hue[1],
        profile.sat[0] + rng() * profile.sat[1],
        profile.light[0] + rng() * profile.light[1],
      );

      const rock = {
        position,
        radius,
        baseScale: radius, // geometry radius is ~1 → scale == world radius
        axis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
        spin: (0.1 + rng() * 0.35) * (rng() < 0.5 ? -1 : 1), // rad/s, slow tumble
        angle: rng() * Math.PI * 2,
        // oreMult rounds up: Veridian's 1.5 yields visibly richer rock;
        // unitsMult thins the exotics (wakeglass 0.35 — precious, not bulk).
        ore: Math.max(1, Math.ceil((4 + Math.floor(rng() * 9)) * oreMult * ore.unitsMult)),
        oreKey,
        commodity: oreKey,
        bundle,
        mesh: bundle.mesh,
        instanceIndex: bundle.nextSlot++,
        hotColor: bundle.hot, // shared per-ore, read-only
        rawRate: WEAPONS.mining.extractPerSec, // until a mineHit names the head
        extract: 0, // fractional extraction accumulator
        depleted: false,
        hitThisFrame: false,
        heatedThisFrame: false,
        hitPoint: null, // last mineHit point (borrowed ref, cloned on pod spawn)
        baseColor,
        heat: 0, // 0..1 heat-glow amount
        heatListed: false, // in activeHeat[]
        collapseT: -1, // <0 = not collapsing
        collapseListed: false, // in collapseList[]
      };
      rocks.push(rock);
      list.push({
        id: i,
        position,
        radius,
        ore: rock.ore,
        commodity: oreKey,
        oreKey,
        hardness: ore.hardness,
      });

      // Initial instance transform + colour, into the rock's OWN mesh slot.
      _quat.setFromAxisAngle(rock.axis, rock.angle);
      _scale.setScalar(radius);
      _mat4.compose(position, _quat, _scale);
      bundle.mesh.setMatrixAt(rock.instanceIndex, _mat4);
      bundle.mesh.setColorAt(rock.instanceIndex, baseColor);
    }
    for (let b = 0; b < bundles.length; b++) {
      bundles[b].mesh.instanceMatrix.needsUpdate = true;
      if (bundles[b].mesh.instanceColor) bundles[b].mesh.instanceColor.needsUpdate = true;
    }

    // Replace (never mutate) so combat.js drops stale entries immediately.
    ctx.asteroids = { list };

    // Tumble budget: recompose ~1/4 of instances per frame (full sweep ≈
    // every 4 frames ≈ 15 Hz at 60 fps) — smooth motion, flat cost.
    chunk = Math.ceil(count / 4);
    cursor = 0;
    dirtyBundles.length = 0;
    activeHeat.length = 0;
    collapseList.length = 0;
  }

  function rebuild(to) {
    // Wave 51 teardown rule: remove AND dispose every per-ore mesh
    // (geometry + material) before building the new field — leaking a mesh
    // across a jump is a hard failure.
    for (let m = 0; m < fieldMeshes.length; m++) {
      const mesh = fieldMeshes[m];
      ctx.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    fieldMeshes.length = 0;
    bundles = [];
    build(SYSTEMS[to]);
  }

  // Mark a rock's mesh instanceMatrix-dirty exactly once per frame.
  function markDirty(rock) {
    const bundle = rock.bundle;
    if (!bundle.matrixDirty) {
      bundle.matrixDirty = true;
      dirtyBundles.push(bundle);
    }
  }

  function deplete(i, rock) {
    rock.depleted = true;
    rock.heat = 0; // the heat sweep unlists it and restores the darkened tint
    list[i].ore = 0;
    // Darken immediately: world-tells-first depletion cue (§13.1).
    _color.copy(rock.baseColor).multiplyScalar(0.35);
    rock.mesh.setColorAt(rock.instanceIndex, _color);
    rock.mesh.instanceColor.needsUpdate = true;
    if (ctx.settings.reducedMotion) {
      // Accessibility: no collapse animation — snap to the depleted husk.
      rock.radius = rock.baseScale * 0.3;
      list[i].radius = rock.radius;
      _quat.setFromAxisAngle(rock.axis, rock.angle);
      _scale.setScalar(rock.radius);
      _mat4.compose(rock.position, _quat, _scale);
      rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
      rock.mesh.instanceMatrix.needsUpdate = true; // direct: the per-frame flush already ran
    } else {
      // Ease-out collapse over ~0.4 s, driven by the update loop below.
      rock.collapseT = 0;
      if (!rock.collapseListed) {
        rock.collapseListed = true;
        collapseList.push(i);
      }
    }
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

      const reduced = ctx.settings.reducedMotion;
      const n = rocks.length;

      // --- Slow tumble, round-robin subset of the FLAT rock array ---
      const end = Math.min(cursor + chunk, n);
      for (let i = cursor; i < end; i++) {
        const rock = rocks[i];
        if (rock.depleted) continue;
        rock.angle += rock.spin * dt * (n / chunk); // amortized over skipped frames
        _quat.setFromAxisAngle(rock.axis, rock.angle);
        _scale.setScalar(rock.baseScale);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        markDirty(rock);
      }
      cursor = end >= n ? 0 : end;

      // --- Depletion collapse: ease-out shrink ~0.4 s (skipped under
      //     reducedMotion — deplete() snaps instead) ---
      for (let k = collapseList.length - 1; k >= 0; k--) {
        const i = collapseList[k];
        const rock = rocks[i];
        rock.collapseT += dt / 0.4;
        let t = rock.collapseT;
        if (t >= 1) {
          t = 1;
          rock.collapseListed = false;
          collapseList[k] = collapseList[collapseList.length - 1]; // swap-remove
          collapseList.pop();
        }
        const ease = 1 - (1 - t) * (1 - t); // quadratic ease-out
        rock.radius = rock.baseScale * (1 - 0.7 * ease); // → baseScale × 0.3
        list[i].radius = rock.radius;
        _quat.setFromAxisAngle(rock.axis, rock.angle);
        _scale.setScalar(rock.radius);
        _mat4.compose(rock.position, _quat, _scale);
        rock.mesh.setMatrixAt(rock.instanceIndex, _mat4);
        markDirty(rock);
      }

      // Flush per-mesh matrix dirtiness accumulated this frame.
      for (let b = 0; b < dirtyBundles.length; b++) {
        dirtyBundles[b].mesh.instanceMatrix.needsUpdate = true;
        dirtyBundles[b].matrixDirty = false;
      }
      dirtyBundles.length = 0;

      // --- Mining: consume combat's 'mineHit' beam contacts (§6.3) ---
      for (let e = 0; e < ctx.lastEvents.length; e++) {
        const ev = ctx.lastEvents[e];
        if (ev.type === 'mineHit') {
          const rock = rocks[ev.asteroidId];
          if (rock && !rock.depleted) {
            rock.hitThisFrame = true;
            // The installed head's raw rate (wave 51 contract); fall back to
            // the stock Mk I numbers when the event predates the field.
            rock.rawRate = ev.extractPerSec ?? WEAPONS.mining.extractPerSec;
            if (ev.point) rock.hitPoint = ev.point;
          }
        }
      }
      const yieldUnits = ctx.world.activeEvent?.kind === 'strikeRush' ? 2 : 1; // strike-rush hook
      for (let i = 0; i < n; i++) {
        const rock = rocks[i];
        if (!rock.hitThisFrame) continue;
        rock.hitThisFrame = false;
        // Heat glow (§13.1): the rock warms toward its spark tint while cut.
        rock.heat = Math.min(1, rock.heat + dt * 2.5);
        rock.heatedThisFrame = true;
        if (!rock.heatListed) {
          if (activeHeat.length < HEAT_CAP) {
            rock.heatListed = true;
            activeHeat.push(i);
          } else {
            rock.heatedThisFrame = false; // unlisted: no sweep will clear it
          }
        }
        // Hard rock resists: effective rate = head rate / extractResist.
        rock.extract += (rock.rawRate / ORE_TYPES[rock.oreKey].extractResist) * dt;
        while (rock.extract >= 1 && rock.ore > 0) {
          rock.extract -= 1;
          rock.ore -= 1;
          list[i].ore = rock.ore;
          // Pod spawns at the beam contact point (or near the rock) with a
          // small random drift so the player scoops it on a flyby. Wave 51:
          // the pod carries the ore's tint (spawnPod's optional 5th arg).
          if (rock.hitPoint) {
            _podPos.copy(rock.hitPoint);
          } else {
            _podPos.copy(rock.position);
          }
          _podPos.x += (Math.random() - 0.5) * rock.baseScale;
          _podPos.y += (Math.random() - 0.5) * rock.baseScale;
          _podPos.z += (Math.random() - 0.5) * rock.baseScale;
          _drift.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(4);
          spawnPod(ctx, [{ commodity: rock.oreKey, units: yieldUnits }], _podPos, _drift, ORE_TYPES[rock.oreKey].podTint);
          if (rock.ore <= 0) deplete(i, rock);
        }
      }

      // --- Heat glow sweep: listed rocks cool ~0.8 s after the beam leaves ---
      for (let k = activeHeat.length - 1; k >= 0; k--) {
        const i = activeHeat[k];
        const rock = rocks[i];
        if (!rock.heatedThisFrame) rock.heat = Math.max(0, rock.heat - dt * 1.2);
        rock.heatedThisFrame = false;
        if (rock.heat <= 0) {
          rock.heatListed = false;
          activeHeat[k] = activeHeat[activeHeat.length - 1]; // swap-remove
          activeHeat.pop();
          _color.copy(rock.baseColor);
          if (rock.depleted) _color.multiplyScalar(0.35);
          rock.mesh.setColorAt(rock.instanceIndex, _color);
          rock.mesh.instanceColor.needsUpdate = true;
          continue;
        }
        if (reduced) {
          // Accessibility: static bright tint while hot, no animated lerp.
          _color.copy(rock.hotColor);
        } else {
          _color.copy(rock.baseColor).lerp(rock.hotColor, rock.heat * 0.85);
        }
        rock.mesh.setColorAt(rock.instanceIndex, _color);
        rock.mesh.instanceColor.needsUpdate = true;
      }
    },
  };
}
