import * as THREE from 'three';
import { U } from '../game/state.js';
import { recordPosition } from '../game/world.js';
import { styleFor } from '../game/faction-style.js';
import { withoutGlobalRandom } from '../game/random-scope.js';

/**
 * Far-traffic impostors — issue #338, system scale/population Phase 1.
 *
 * Abstract world records (game/world.js) outside the instantiation bubble are
 * drawn as ONE instanced low-poly proxy at 1 Hz. This is a presentation layer
 * only: no AI, no collision, no combat, no per-frame simulation, and no
 * persistent fields on records or world state.
 *
 * Contract:
 *   initFarTraffic(ctx) -> { update(dt) }
 *   - one InstancedMesh named 'far-traffic-impostors', capacity 256
 *     (the issue's 150–300 band), cheap 8-triangle dart proxy.
 *   - refreshes from ctx.world.records (the CURRENT bank; world.js swaps on
 *     'systemLoaded') once per second via recordPosition.
 *   - a visible impostor is hidden while its record is live (a real hull
 *     exists) and while its abstract position is inside U.INSTANTIATE_RANGE
 *     (900 u), so there is never a duplicate at the 900 u handoff. Records
 *     that can no longer promote (dead/captured/inTransit) are hidden too.
 *   - per-instance faction colour from game/faction-style.js; the per-system
 *     seed makes proxy variation deterministic for a given system.
 *   - rebuilds/refreshes on a 'systemLoaded' event and on a record-bank swap;
 *     the old mesh is disposed so repeated jumps do not leak resources.
 *   - reducedMotion parity: nothing here animates per frame; the only motion
 *     is the 1 Hz abstract-position refresh, which reducedMotion must not
 *     freeze (the traffic itself still moves).
 *
 * Session-only bookkeeping for tests lives on mesh.userData (capacity,
 * visibleCount, per-instance record ids, system, seed, lastRefreshAt). Nothing
 * is written back to a record, so saves and the agent API cannot observe it.
 */

const CAPACITY = 256; // issue #338: 150–300 impostors, one draw call
const REFRESH_SECONDS = 1; // issue #338: 1 Hz from abstract records
const MESH_NAME = 'far-traffic-impostors';
const BASE_SCALE = 30; // world units; far lights, not true hull scale
const PROXY_TRIANGLES = 8;

const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _matrix = new THREE.Matrix4();
const _hidden = new THREE.Matrix4().makeScale(0, 0, 0);
const _color = new THREE.Color();

/** FNV-1a — stable string hash (no Math.random: rebuilds stay deterministic). */
function hashString(text) {
  const s = typeof text === 'string' ? text : String(text ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Per-system seed: the same system id always yields the same proxy look. */
function seedForSystem(systemId) {
  return hashString('far-traffic:' + (systemId ?? ''));
}

/** Deterministic 0..1 draw from a seed + salt (xorshift-style avalanche). */
function unit(seed, salt) {
  let x = (seed ^ hashString(salt)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 3266489909) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/**
 * The ~8-triangle dart proxy. Deliberately unlit and cheap: far impostors are
 * coloured specks, not simulated hulls. A white color attribute is required so
 * the per-instance colour (instanceColor) multiplies through the material's
 * vertexColors path without a per-instance material clone.
 */
function buildProxyGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    0, 0, 4, // 0 nose
    0, 0, -2, // 1 tail
    0, 1, 0, // 2 top
    0, -1, 0, // 3 bottom
    -2, 0, -1, // 4 left
    2, 0, -1, // 5 right
  ]);
  const colors = new Float32Array(positions.length);
  colors.fill(1);
  const indices = [
    0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2,
    1, 4, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4,
  ];
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Pure handoff predicate, exported so a test can pin the exact boundaries:
 *   899 u  -> false (inside the instantiation bubble)
 *   900 u  -> false (the real hull may spawn this frame; hide to avoid a duplicate)
 *   1400 u -> true when not live (the live hull has folded back; show the impostor)
 * A record flagged live is always hidden, even while its abstract position is
 * still beyond 900 u (the live hull can be culled only past
 * U.DEINSTANTIATE_RANGE = 1400 u).
 */
export function shouldShowImpostor(rec, distance) {
  if (!rec || rec.live === true) return false;
  // A record that can no longer promote to a real hull must not leave a ghost.
  if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') return false;
  if (!Number.isFinite(distance)) return false;
  return distance > U.INSTANTIATE_RANGE;
}

/**
 * Issue #338 far-traffic layer. Presentation-only: reads ctx.world.records,
 * ctx.world.currentSystem and the player position; writes only its own scene
 * object and mesh.userData (session-only test bookkeeping).
 */
export function initFarTraffic(ctx) {
  let mesh = null;
  let builtSystem = null;
  let knownRecords = null;
  let refreshAccum = 0;

  function playerPosition() {
    const obj = ctx.ship?.object;
    if (obj?.position) return obj.position;
    return ctx.camera?.position ?? null;
  }

  function hideSlot(slot) {
    mesh.setMatrixAt(slot, _hidden);
  }

  /**
   * 1 Hz refresh. Slots are the record bank indexes: hidden slots keep the
   * zero matrix, visible slots get a deterministic pose and faction colour.
   * No record is mutated.
   */
  function refresh() {
    if (!mesh) return;
    const records = Array.isArray(ctx.world?.records) ? ctx.world.records : [];
    const playerPos = playerPosition();
    const userData = mesh.userData;
    const seed = userData.seed;
    const ids = new Array(CAPACITY).fill(null);
    const visibleIds = [];
    let visible = 0;
    const count = Math.min(records.length, CAPACITY);

    for (let slot = 0; slot < CAPACITY; slot++) {
      const rec = slot < count ? records[slot] : null;
      let show = false;
      let distance = Infinity;
      if (rec && typeof rec === 'object') {
        recordPosition(rec, _pos);
        distance = playerPos ? _pos.distanceTo(playerPos) : Infinity;
        show = shouldShowImpostor(rec, distance);
      }
      if (!show) {
        hideSlot(slot);
        continue;
      }
      const key = typeof rec.id === 'string' ? rec.id : String(slot);
      const s = BASE_SCALE * (0.8 + unit(seed, 'scale:' + key) * 0.8);
      _scale.set(s * 0.55, s * 0.42, s * 1.7);
      _euler.set(
        (unit(seed, 'pitch:' + key) - 0.5) * 0.6,
        (unit(seed, 'yaw:' + key) - 0.5) * 0.9,
        (unit(seed, 'roll:' + key) - 0.5) * Math.PI * 2,
        'YXZ',
      );
      _quat.setFromEuler(_euler);
      _matrix.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(slot, _matrix);
      const style = styleFor(rec.faction);
      _color.setHex(style.accent);
      _color.multiplyScalar(0.85 + unit(seed, 'bright:' + key) * 0.3);
      mesh.setColorAt(slot, _color);
      const id = typeof rec.id === 'string' ? rec.id : null;
      ids[slot] = id;
      if (id) visibleIds.push(id);
      visible++;
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    userData.instanceRecordIds = ids;
    userData.visibleRecordIds = visibleIds;
    userData.visibleCount = visible;
    userData.lastRefreshAt = ctx.world?.time ?? 0;
  }

  function disposeCurrent() {
    if (!mesh) return;
    if (mesh.parent) mesh.parent.remove(mesh);
    else ctx.scene?.remove?.(mesh);
    // InstancedMesh 'dispose' tells WebGLObjects to release instanceMatrix /
    // instanceColor GPU buffers; geometry/material dispose release their own.
    mesh.dispose();
    mesh.geometry?.dispose?.();
    mesh.material?.dispose?.();
    mesh = null;
  }

  function build(systemId) {
    // Scene construction consumes global Math.random via THREE UUIDs; keep the
    // harness's seeded content stream byte-identical (issue #338).
    withoutGlobalRandom(() => {
    disposeCurrent();
    const seed = seedForSystem(systemId);
    const geometry = buildProxyGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
    mesh.name = MESH_NAME;
    mesh.frustumCulled = false; // one layer; instance bounds are not precomputed
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.userData = {
      capacity: CAPACITY,
      proxyTriangles: PROXY_TRIANGLES,
      refreshSeconds: REFRESH_SECONDS,
      system: systemId ?? null,
      seed,
      visibleCount: 0,
      instanceRecordIds: new Array(CAPACITY).fill(null),
      visibleRecordIds: [],
      lastRefreshAt: 0,
    };
    for (let slot = 0; slot < CAPACITY; slot++) mesh.setMatrixAt(slot, _hidden);
    mesh.instanceMatrix.needsUpdate = true;
    ctx.scene?.add?.(mesh);
    builtSystem = systemId ?? null;
    refresh();
    });
  }

  build(ctx.world?.currentSystem ?? null);
  knownRecords = ctx.world?.records ?? null;

  return {
    update(dt) {
      // Rebuild/refresh on jump or restore. world.js runs before this system,
      // so ctx.world.records is already the destination bank when the event is
      // visible here; only the seed and scene object need rebuilding.
      const events = Array.isArray(ctx.lastEvents) ? ctx.lastEvents : [];
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (!ev || ev.type !== 'systemLoaded') continue;
        const to = ev.to ?? ctx.world?.currentSystem ?? builtSystem;
        if (to !== builtSystem) build(to);
        else refresh();
        knownRecords = ctx.world?.records ?? null;
        refreshAccum = 0;
        break;
      }

      // Same-system save restores swap the bank without a 'systemLoaded'. Pick
      // that up immediately instead of waiting for the next 1 Hz tick.
      if (ctx.world?.records !== knownRecords) {
        knownRecords = ctx.world?.records ?? null;
        const current = ctx.world?.currentSystem ?? null;
        if (current !== builtSystem) build(current);
        else refresh();
        refreshAccum = 0;
      }

      const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
      refreshAccum += step;
      if (refreshAccum >= REFRESH_SECONDS) {
        refreshAccum %= REFRESH_SECONDS;
        refresh();
      }
    },
  };
}
