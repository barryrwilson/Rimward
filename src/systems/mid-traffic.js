import * as THREE from 'three';
import { recordPosition } from '../game/world.js';
import { styleFor } from '../game/faction-style.js';
import { scaleFor } from '../game/ship-scale.js';
import { withoutGlobalRandom } from '../game/random-scope.js';
import { NEAR_RANGE, MID_RANGE, MID_CAP } from '../game/traffic-tiers.js';

/**
 * Mid-traffic instanced proxies — issue #339, system scale/population Phase 2.
 *
 * Abstract world records in the (NEAR_RANGE, MID_RANGE] band are drawn as ONE
 * instanced low-poly proxy at 8 Hz. This is a presentation layer only: no AI,
 * no collision, no combat, no FX, no per-frame simulation and no persistent
 * fields on records or world state. The full simulation stays near-only; a
 * record promoted to a real hull inside NEAR_RANGE hides its proxy, and a
 * record beyond MID_RANGE is handed to far-traffic's impostor layer, so no
 * record is ever drawn twice.
 *
 * Contract:
 *   initMidTraffic(ctx) -> { update(dt) }
 *   - one InstancedMesh named 'mid-traffic-proxies', capacity MID_CAP (40,
 *     the issue's 30-40 band), cheap dart proxy (8 triangles).
 *   - refreshes from ctx.world.records (the CURRENT bank; world.js swaps on
 *     'systemLoaded') at 8 Hz via recordPosition, nearest records first so the
 *     visible set is the most relevant one when more than MID_CAP qualify.
 *   - a visible proxy is hidden while its record is live (a real hull exists),
 *     inside NEAR_RANGE (900 u), beyond MID_RANGE (2500 u), or terminal
 *     (dead/captured/inTransit).
 *   - coarse steering: the proxy nose points at the record's next route
 *     waypoint; scale follows the class scale charter so the handoff at 900 u
 *     reads as the same hull. Per-instance faction colour from
 *     game/faction-style.js; per-system seed makes variation deterministic.
 *   - rebuilds/refreshes on a 'systemLoaded' event and on a record-bank swap;
 *     the old mesh is disposed so repeated jumps do not leak resources.
 *   - reducedMotion parity: nothing animates per frame; the only motion is the
 *     8 Hz abstract-position refresh, which reducedMotion must not freeze.
 *
 * Session-only bookkeeping for tests lives on mesh.userData (capacity,
 * visibleCount, per-instance record ids, system, seed, lastRefreshAt). Nothing
 * is written back to a record, so saves and the agent API cannot observe it.
 */

const REFRESH_SECONDS = 1 / 8; // issue #339: mid band 5-10 Hz
const MESH_NAME = 'mid-traffic-proxies';
const PROXY_TRIANGLES = 8;
const FORWARD = new THREE.Vector3(0, 0, 1);

const _pos = new THREE.Vector3();
const _dir = new THREE.Vector3();
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
  return hashString('mid-traffic:' + (systemId ?? ''));
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
 * The ~8-triangle dart proxy. Deliberately unlit and cheap: a mid proxy is a
 * silhouette, not a simulated hull. A white color attribute lets the per-
 * instance colour multiply through the vertexColors path without a material
 * clone per instance.
 */
function buildProxyGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    0, 0, 1, // 0 nose
    0, 0, -1, // 1 tail
    0, 0.5, 0, // 2 top
    0, -0.5, 0, // 3 bottom
    -1, 0, -0.4, // 4 left
    1, 0, -0.4, // 5 right
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
 *   900 u    -> false (a real hull may spawn this frame; hide to avoid a duplicate)
 *   900.01 u -> true
 *   2500 u   -> true (last mid-band frame)
 *   2500.01  -> false (far-traffic owns the impostor beyond MID_RANGE)
 * A record flagged live is always hidden; terminal records never draw.
 */
export function shouldShowMidProxy(rec, distance) {
  if (!rec || rec.live === true) return false;
  if (rec.state === 'dead' || rec.state === 'captured' || rec.state === 'inTransit') return false;
  if (!Number.isFinite(distance)) return false;
  return distance > NEAR_RANGE && distance <= MID_RANGE;
}

/** Class scale charter target length, with a light fallback. */
function proxyLengthFor(classKey) {
  const scale = scaleFor(classKey);
  const target = scale && Number.isFinite(scale.target) && scale.target > 0 ? scale.target : 6.8;
  return target;
}

/** Coarse heading: point the proxy at the record's next route waypoint. */
function headingFor(rec, pos, out) {
  const route = Array.isArray(rec.route) ? rec.route : null;
  if (!route || route.length < 2) return null;
  const leg = Number.isFinite(rec.leg) ? rec.leg | 0 : 0;
  const step = rec.dir < 0 ? -1 : 1;
  const idx = Math.max(0, Math.min(route.length - 1, leg + step));
  const wp = route[idx];
  if (!wp) return null;
  out.set(wp.x - pos.x, wp.y - pos.y, wp.z - pos.z);
  if (out.lengthSq() < 1e-6) return null;
  out.normalize();
  return out;
}

/**
 * Issue #339 mid-traffic layer. Presentation-only: reads ctx.world.records,
 * ctx.world.currentSystem and the player position; writes only its own scene
 * object and mesh.userData (session-only test bookkeeping).
 */
export function initMidTraffic(ctx) {
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
   * 8 Hz refresh. Candidate records are collected, sorted nearest-first and
   * capped at MID_CAP; hidden slots keep the zero matrix. No record is mutated.
   */
  function refresh() {
    if (!mesh) return;
    const records = Array.isArray(ctx.world?.records) ? ctx.world.records : [];
    const playerPos = playerPosition();
    const userData = mesh.userData;
    const seed = userData.seed;
    const candidates = [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (!rec || typeof rec !== 'object') continue;
      recordPosition(rec, _pos);
      const distance = playerPos ? _pos.distanceTo(playerPos) : Infinity;
      if (!shouldShowMidProxy(rec, distance)) continue;
      candidates.push({ rec, x: _pos.x, y: _pos.y, z: _pos.z, distance });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates.length > MID_CAP) candidates.length = MID_CAP;

    const ids = new Array(MID_CAP).fill(null);
    const slotRecords = new Array(MID_CAP).fill(null);
    const visibleIds = [];
    for (let slot = 0; slot < MID_CAP; slot++) {
      const c = candidates[slot];
      if (!c) {
        hideSlot(slot);
        continue;
      }
      const rec = c.rec;
      const key = typeof rec.id === 'string' ? rec.id : String(slot);
      const length = proxyLengthFor(rec.classKey);
      const variation = 0.9 + unit(seed, 'scale:' + key) * 0.2;
      _pos.set(c.x, c.y, c.z);
      const heading = headingFor(rec, _pos, _dir);
      if (heading) {
        _quat.setFromUnitVectors(FORWARD, heading);
      } else {
        _euler.set(
          (unit(seed, 'pitch:' + key) - 0.5) * 0.5,
          (unit(seed, 'yaw:' + key) - 0.5) * 0.7,
          (unit(seed, 'roll:' + key) - 0.5) * Math.PI * 2,
          'YXZ',
        );
        _quat.setFromEuler(_euler);
      }
      _scale.set(length * 0.4 * variation, length * 0.25 * variation, length * 0.5 * variation);
      _matrix.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(slot, _matrix);
      const style = styleFor(rec.faction);
      _color.setHex(style.accent);
      _color.multiplyScalar(0.8 + unit(seed, 'bright:' + key) * 0.35);
      mesh.setColorAt(slot, _color);
      const id = typeof rec.id === 'string' ? rec.id : null;
      ids[slot] = id;
      slotRecords[slot] = rec;
      if (id) visibleIds.push(id);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    userData.instanceRecordIds = ids;
    userData.instanceRecords = slotRecords;
    userData.visibleRecordIds = visibleIds;
    userData.visibleCount = visibleIds.length;
    userData.lastRefreshAt = ctx.world?.time ?? 0;
  }

  /**
   * Issue #339 handoff guard: a record can promote to a real hull between the
   * 8 Hz refreshes. Hide any visible slot whose record is now live/terminal on
   * the very next frame, so a duplicate hull/proxy is never rendered — not even
   * for one refresh interval. 40 cheap flag checks; no record mutation.
   */
  function hidePromoted() {
    if (!mesh) return;
    const userData = mesh.userData;
    const records = userData.instanceRecords;
    if (!Array.isArray(records)) return;
    let changed = false;
    for (let slot = 0; slot < records.length; slot++) {
      const rec = records[slot];
      if (!rec) continue;
      if (rec.live !== true && rec.state !== 'dead' && rec.state !== 'captured' && rec.state !== 'inTransit') continue;
      hideSlot(slot);
      records[slot] = null;
      if (userData.instanceRecordIds[slot] !== null) {
        userData.instanceRecordIds[slot] = null;
        changed = true;
      }
    }
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
      userData.visibleRecordIds = userData.instanceRecordIds.filter((id) => id !== null);
      userData.visibleCount = userData.visibleRecordIds.length;
    }
  }

  function disposeCurrent() {
    if (!mesh) return;
    if (mesh.parent) mesh.parent.remove(mesh);
    else ctx.scene?.remove?.(mesh);
    mesh.dispose();
    mesh.geometry?.dispose?.();
    mesh.material?.dispose?.();
    mesh = null;
  }

  function build(systemId) {
    // Scene construction consumes global Math.random via THREE UUIDs; keep the
    // harness's seeded content stream byte-identical (issue #338 precedent).
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
      mesh = new THREE.InstancedMesh(geometry, material, MID_CAP);
      mesh.name = MESH_NAME;
      mesh.frustumCulled = false; // one layer; instance bounds are not precomputed
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.userData = {
        capacity: MID_CAP,
        proxyTriangles: PROXY_TRIANGLES,
        refreshSeconds: REFRESH_SECONDS,
        system: systemId ?? null,
        seed,
        visibleCount: 0,
        instanceRecordIds: new Array(MID_CAP).fill(null),
        instanceRecords: new Array(MID_CAP).fill(null),
        visibleRecordIds: [],
        lastRefreshAt: 0,
      };
      for (let slot = 0; slot < MID_CAP; slot++) mesh.setMatrixAt(slot, _hidden);
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
      // Close the 8 Hz handoff window first: a record promoted since the last
      // refresh must stop drawing its proxy this frame.
      hidePromoted();
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
