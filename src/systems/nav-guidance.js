import * as THREE from 'three';
import { SYSTEMS } from '../game/state.js';
import { RING_RADIUS } from '../game/gate-scale.js';
import { lookupLiveNavGate } from './gate.js';

/**
 * NAV-02 in-world next-gate ring. Read-only consume of ctx.world.nav.
 * Does not write the bag, emit guidance events, or set targets.current.
 * Next hop is path[1]. Aim uses the live assembly zone origin only
 * (physical to === nextTo, else hub.routes). No authored ghost fallback.
 * resolveAuthoredNavGate stays authored for tests.
 */

const TORUS_RADIUS = RING_RADIUS + 3;
const TORUS_TUBE = 0.35;
const ALLOWED_STATUS = { plotted: true, blocked: true, arrived: true };
const RESERVED_IDS = new Set([
  '__proto__', 'prototype', 'constructor', 'toString', 'valueOf',
  'hasOwnProperty', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

const _look = new THREE.Vector3();

export function emptyNavRaycast() {}

function reservedNavId(value) {
  if (typeof value !== 'string' || !value) return true;
  if (RESERVED_IDS.has(value) || RESERVED_IDS.has(value.toLowerCase())) return true;
  return false;
}

export function stripNavText(value) {
  if (typeof value !== 'string') return '';
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c < 32 || c === 127) continue;
    out += value.charAt(i);
  }
  return out;
}

export function navSystemName(id) {
  if (reservedNavId(id) || !Object.hasOwn(SYSTEMS, id)) return '';
  const name = SYSTEMS[id] && SYSTEMS[id].name;
  return stripNavText(name);
}

export function formatNavDist(dist) {
  if (!Number.isFinite(dist) || dist < 0) return '';
  if (dist >= 1000) return (Math.round(dist / 100) / 10) + 'k';
  return Math.round(dist) + 'u';
}

export function resolveAuthoredNavGate(ctx, nextTo) {
  if (reservedNavId(nextTo) || !Object.hasOwn(SYSTEMS, nextTo)) return null;
  const cur = ctx && ctx.world && ctx.world.currentSystem;
  if (reservedNavId(cur) || !Object.hasOwn(SYSTEMS, cur)) return null;
  const def = SYSTEMS[cur];
  const gates = def && def.gates;
  if (Array.isArray(gates)) {
    for (let i = 0; i < gates.length; i++) {
      const g = gates[i];
      if (!g || g.to !== nextTo) continue;
      const p = g.position;
      if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) continue;
      return { x: p[0], y: p[1], z: p[2] };
    }
  }
  const hub = def && def.hub;
  const routes = hub && hub.routes;
  if (hub && Array.isArray(routes)) {
    let found = false;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i] === nextTo) { found = true; break; }
    }
    if (found) {
      const hp = hub.position;
      if (hp && Number.isFinite(hp[0]) && Number.isFinite(hp[1]) && Number.isFinite(hp[2])) {
        return { x: hp[0], y: hp[1], z: hp[2] };
      }
    }
  }
  return null;
}

/** Live zone origin for `nextTo`, or null. Never an authored ghost. */
export function resolveNavGatePos(ctx, nextTo) {
  if (reservedNavId(nextTo)) return null;
  const cur = ctx && ctx.world && ctx.world.currentSystem;
  if (typeof cur === 'string' && cur) {
    if (reservedNavId(cur)) return null;
    return lookupLiveNavGate(nextTo, cur);
  }
  return lookupLiveNavGate(nextTo);
}

export function readNavGuidance(ctx) {
  const empty = {
    kind: 'omit', nextId: '', destId: '', remaining: null, pos: null,
    nextName: '', destName: '',
  };
  const bag = ctx && ctx.world && ctx.world.nav;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return empty;
  const status = Object.hasOwn(bag, 'status') ? bag.status : '';
  if (!Object.hasOwn(ALLOWED_STATUS, status)) return empty;

  const destId = Object.hasOwn(bag, 'dest') && typeof bag.dest === 'string' ? bag.dest : '';
  const destName = navSystemName(destId);
  let remaining = null;
  if (Object.hasOwn(bag, 'remaining') && Number.isFinite(bag.remaining) && bag.remaining >= 0) {
    remaining = Math.trunc(bag.remaining);
  }

  if (status === 'blocked') {
    return {
      kind: 'blocked', nextId: '', destId: destName ? destId : '', remaining: null,
      pos: null, nextName: '', destName: destName || '—',
    };
  }
  if (status === 'arrived') {
    return {
      kind: 'arrived', nextId: '', destId: destName ? destId : '', remaining: null,
      pos: null, nextName: '', destName: destName || '—',
    };
  }

  const path = Object.hasOwn(bag, 'path') && Array.isArray(bag.path) ? bag.path : null;
  const nextId = path && path.length >= 2 && typeof path[1] === 'string' ? path[1] : '';
  const nextName = navSystemName(nextId);
  if (!nextName) {
    return {
      kind: destName ? 'dest-only' : 'omit',
      nextId: '', destId: destName ? destId : '', remaining: null, pos: null,
      nextName: '', destName: destName || '',
    };
  }
  return {
    kind: 'plotted',
    nextId,
    destId: destName ? destId : '',
    remaining,
    pos: resolveNavGatePos(ctx, nextId),
    nextName,
    destName: destName || '—',
  };
}

let sharedMat = null;
let parkedGroup = null;
let parkedMesh = null;

function navMarkerMaterial() {
  if (sharedMat) return sharedMat;
  sharedMat = new THREE.MeshBasicMaterial({
    color: 0x6ff2e0,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  return sharedMat;
}

function bindNavMarker(ctx) {
  if (!parkedGroup) {
    parkedGroup = new THREE.Group();
    const geo = new THREE.TorusGeometry(TORUS_RADIUS, TORUS_TUBE, 8, 48);
    parkedMesh = new THREE.Mesh(geo, navMarkerMaterial());
    parkedMesh.name = 'nav-gate-ring';
    parkedGroup.add(parkedMesh);
    parkedGroup.visible = false;
  }
  parkedGroup.name = 'nav-gate-marker';
  parkedGroup.raycast = emptyNavRaycast;
  parkedGroup.traverse((o) => { o.raycast = emptyNavRaycast; });
  if (ctx && ctx.scene && parkedGroup.parent !== ctx.scene) ctx.scene.add(parkedGroup);
}

export function initNavGuidance(ctx) {
  bindNavMarker(ctx);

  return {
    update(info, showMark, reducedMotion, dt) {
      bindNavMarker(ctx);
      const group = parkedGroup;
      const mesh = parkedMesh;
      if (!showMark || !info || !info.pos) {
        if (group.visible) group.visible = false;
        mesh.rotation.z = 0;
        mesh.scale.set(1, 1, 1);
        return;
      }
      group.position.set(info.pos.x, info.pos.y, info.pos.z);
      _look.set(0, 0, 0);
      group.lookAt(_look);
      if (reducedMotion) {
        mesh.rotation.z = 0;
        mesh.scale.set(1, 1, 1);
      } else if (dt > 0) {
        mesh.rotation.z += dt * 0.35;
      }
      if (!group.visible) group.visible = true;
    },
  };
}
