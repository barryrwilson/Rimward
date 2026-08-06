import * as THREE from 'three';
import { CONVERGENCE } from '../game/state.js';

/**
 * Authored landmarks + clue motes — per-system points of interest from
 * SYSTEMS[id].landmarks / SYSTEMS[id].clues (§15.3 system identity, §25
 * mystery). Wrecks, beacons, monuments, and anomalies give each system a
 * silhouette worth travelling toward; clue motes are small dim emissive
 * spheres found by proximity, not by UI.
 *
 * Wave 5: per-system rebuild, mirroring solarsystem.js. On ctx.lastEvents
 * 'systemLoaded' { to } the previous group is removed, its per-build
 * materials disposed, and a new group is constructed from SYSTEMS[to].
 * Geometries are module-level and shared across every system and rebuild;
 * materials that must dim independently are cloned per POI and tracked for
 * disposal. Seeded stability is not required — wreck debris scatter uses
 * build-time Math.random().
 *
 * Discovered state reads ctx.world.mystery ({ found: [clueIds], visited:
 * [landmarkIds] }), guarded with ?? because the mystery module may not have
 * initialized it yet. Membership is checked at build time AND re-checked
 * cheaply in update(): the found/visited arrays only ever grow, so their
 * lengths are cached and dimmables are re-applied in place (no rebuild)
 * only when a length changes.
 *
 * Wave 6: the CONVERGENCE site is a dynamic POI — not in any SYSTEMS list.
 * It is built (anomaly visual) only in CONVERGENCE.site.system and only
 * once mystery.convergeHinted is true; the hint flag is watched in update()
 * and flips trigger a full rebuild. mystery.converged dims it like any
 * discovered landmark (dimmable list 'converged' reads the flag, not an
 * array).
 *
 * Ownership: adds/removes objects in ctx.scene, writes nothing shared.
 * update() performs zero allocations — pulse phases, base intensities, and
 * base colors are precomputed at build; dimming mutates existing materials.
 */

// ---- Shared geometries: one allocation for the lifetime of the module ----
const GEO = {
  mote: new THREE.SphereGeometry(2, 8, 6),          // clue mote (~2u)
  anomaly: new THREE.IcosahedronGeometry(6, 0),
  slab: new THREE.BoxGeometry(4, 26, 2),            // monument
  pole: new THREE.CylinderGeometry(0.6, 0.6, 14, 6), // beacon mast
  tip: new THREE.SphereGeometry(1.6, 8, 6),         // beacon lamp
  debrisBox: new THREE.BoxGeometry(3, 2, 2.5),
  debrisTet: new THREE.TetrahedronGeometry(2.2),
};

// Beacon masts never dim (the lamp carries the discovery state), so one
// dark metal material is shared by every beacon in every system.
const MAT_POLE = new THREE.MeshStandardMaterial({
  color: 0x2a2a30, roughness: 0.8, metalness: 0.6,
});

const DIM = 0.35; // discovered emissive/color multiplier
const EMPTY = []; // shared stand-in so ?? never allocates

export function initLandmarks(ctx) {
  let group = null;
  let ownedMats = [];   // per-build materials, disposed on rebuild
  let pulse = [];       // { mat, base, dimRef, phase, speed }
  let dimmables = [];   // { id, list, dim, mats: [{mat, base}], colors: [{mat, base}] }
  let lastFound = -1;
  let lastVisited = -1;
  let lastMystery = null; // identity watch: save-load may swap the object
  let lastHinted = false;   // mystery.convergeHinted watch (site POI add)
  let lastConverged = false; // mystery.converged watch (site dim)

  function ownMat(mat) {
    ownedMats.push(mat);
    return mat;
  }

  function registerDimmable(id, list, mats, colors) {
    const d = { id, list, dim: 1, mats, colors };
    dimmables.push(d);
    return d;
  }

  function applyDim(d, discovered) {
    d.dim = discovered ? DIM : 1;
    for (let i = 0; i < d.colors.length; i++) {
      const c = d.colors[i];
      c.mat.color.copy(c.base).multiplyScalar(d.dim);
    }
    // Emissive entries are re-scaled by the pulse loop via d.dim.
  }

  function addPulse(mat, base, dimRef, speed, phase) {
    pulse.push({ mat, base, dimRef, speed, phase });
  }

  // ---- POI builders -------------------------------------------------------

  function buildWreck(def) {
    // A few dark tumbling-free debris pieces clustered around the point.
    const mat = ownMat(new THREE.MeshStandardMaterial({
      color: 0x3a3630, roughness: 0.95, metalness: 0.3,
    }));
    const wreck = new THREE.Group();
    const pieces = 3 + (Math.random() * 2 | 0); // 3–4
    for (let i = 0; i < pieces; i++) {
      const geo = i % 2 ? GEO.debrisTet : GEO.debrisBox;
      const m = new THREE.Mesh(geo, mat);
      m.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10,
      );
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const s = 0.7 + Math.random() * 1.3;
      m.scale.setScalar(s);
      m.userData.poiId = def.id;
      m.userData.poiType = 'landmark';
      m.userData.kind = 'wreck';
      wreck.add(m);
    }
    registerDimmable(def.id, 'visited', EMPTY, [{ mat, base: mat.color.clone() }]);
    return wreck;
  }

  function buildBeacon(def) {
    const beacon = new THREE.Group();
    const pole = new THREE.Mesh(GEO.pole, MAT_POLE);
    pole.userData.poiId = def.id;
    pole.userData.poiType = 'landmark';
    pole.userData.kind = 'beacon';
    beacon.add(pole);

    const tipMat = ownMat(new THREE.MeshStandardMaterial({
      color: 0x1a1208, emissive: 0xffc070, emissiveIntensity: 1.2,
      roughness: 0.6, metalness: 0.2,
    }));
    const tip = new THREE.Mesh(GEO.tip, tipMat);
    tip.position.y = 8;
    tip.userData.poiId = def.id;
    tip.userData.poiType = 'landmark';
    tip.userData.kind = 'beacon';
    beacon.add(tip);

    const d = registerDimmable(def.id, 'visited', [{ mat: tipMat, base: 1.2 }], EMPTY);
    addPulse(tipMat, 1.2, d, 2.2, Math.random() * Math.PI * 2);
    return beacon;
  }

  function buildMonument(def) {
    const mat = ownMat(new THREE.MeshStandardMaterial({
      color: 0x23201f, roughness: 0.9, metalness: 0.15,
    }));
    const slab = new THREE.Mesh(GEO.slab, mat);
    slab.rotation.y = Math.random() * Math.PI;
    slab.userData.poiId = def.id;
    slab.userData.poiType = 'landmark';
    slab.userData.kind = 'monument';
    registerDimmable(def.id, 'visited', EMPTY, [{ mat, base: mat.color.clone() }]);
    return slab;
  }

  function buildAnomaly(def) {
    const mat = ownMat(new THREE.MeshStandardMaterial({
      color: 0x0a0812, emissive: 0x8a6aff, emissiveIntensity: 0.5,
      roughness: 0.4, metalness: 0.0,
      transparent: true, opacity: 0.85,
    }));
    const mesh = new THREE.Mesh(GEO.anomaly, mat);
    mesh.userData.poiId = def.id;
    mesh.userData.poiType = 'landmark';
    mesh.userData.kind = 'anomaly';
    const d = registerDimmable(def.id, 'visited', [{ mat, base: 0.5 }], EMPTY);
    addPulse(mat, 0.5, d, 0.9, Math.random() * Math.PI * 2);
    return mesh;
  }

  function buildClue(def) {
    const mat = ownMat(new THREE.MeshStandardMaterial({
      color: 0x060a10, emissive: 0x9ab4ff, emissiveIntensity: 0.9,
      roughness: 0.5, metalness: 0.0,
    }));
    const mote = new THREE.Mesh(GEO.mote, mat);
    mote.userData.poiId = def.id;
    mote.userData.poiType = 'clue';
    const d = registerDimmable(def.id, 'found', [{ mat, base: 0.9 }], EMPTY);
    addPulse(mat, 0.9, d, 1.3, Math.random() * Math.PI * 2);
    return mote;
  }

  // ---- Build / rebuild ----------------------------------------------------

  function build(systemId) {
    const def = ctx.systems?.[systemId];
    group = new THREE.Group();
    group.name = 'landmarks';
    ctx.scene.add(group);
    ownedMats = [];
    pulse = [];
    dimmables = [];

    const mystery = ctx.world.mystery ?? null;
    const found = mystery?.found ?? EMPTY;
    const visited = mystery?.visited ?? EMPTY;
    lastFound = found.length;
    lastVisited = visited.length;
    lastMystery = mystery;
    lastHinted = !!mystery?.convergeHinted;
    lastConverged = !!mystery?.converged;
    if (!def) return;

    const landmarks = def.landmarks ?? EMPTY;
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      let obj;
      switch (lm.kind) {
        case 'wreck': obj = buildWreck(lm); break;
        case 'beacon': obj = buildBeacon(lm); break;
        case 'monument': obj = buildMonument(lm); break;
        case 'anomaly': obj = buildAnomaly(lm); break;
        default: continue; // unknown kind: skip rather than guess
      }
      obj.position.fromArray(lm.position);
      group.add(obj);
      // Build-time membership check: visited landmarks render dimmer.
      applyDim(dimmables[dimmables.length - 1], visited.includes(lm.id));
    }

    const clues = def.clues ?? EMPTY;
    for (let i = 0; i < clues.length; i++) {
      const cl = clues[i];
      const mote = buildClue(cl);
      mote.position.fromArray(cl.position);
      group.add(mote);
      applyDim(dimmables[dimmables.length - 1], found.includes(cl.id));
    }

    // Wave 6: the convergence site is not in any SYSTEMS[].landmarks list —
    // it exists only after Echo's hint, and only in its own system. Same
    // anomaly visual, dimmed like a discovered landmark once converged.
    if (systemId === CONVERGENCE.site.system && lastHinted) {
      const site = buildAnomaly(CONVERGENCE.site);
      site.position.fromArray(CONVERGENCE.site.position);
      group.add(site);
      const d = dimmables[dimmables.length - 1];
      d.list = 'converged'; // membership is the converged flag, not an array
      applyDim(d, lastConverged);
    }
  }

  function dispose() {
    if (!group) return;
    ctx.scene.remove(group);
    for (let i = 0; i < ownedMats.length; i++) ownedMats[i].dispose();
    ownedMats = [];
    pulse = [];
    dimmables = [];
    group = null;
  }

  function rebuild(to) {
    dispose();
    build(to);
  }

  // ---- Per-frame: rebuild check + gentle emissive pulse. Zero allocations. --
  function update(dt) {
    for (let i = 0; i < ctx.lastEvents.length; i++) {
      const ev = ctx.lastEvents[i];
      if (ev.type === 'systemLoaded') {
        rebuild(ev.to);
        break;
      }
    }

    // Cheap membership re-check: found/visited only grow, so watch lengths
    // (plus object identity — a save-load swap can replace the record).
    const mystery = ctx.world.mystery ?? null;
    if (mystery) {
      const found = mystery.found ?? EMPTY;
      const visited = mystery.visited ?? EMPTY;
      const hinted = !!mystery.convergeHinted;
      const converged = !!mystery.converged;
      if (mystery !== lastMystery || hinted !== lastHinted) {
        // Record swap or hint flip can add/remove the site POI — full
        // rebuild (same discipline as systemLoaded; disposes per-build mats).
        rebuild(ctx.world.currentSystem);
      } else if (found.length !== lastFound || visited.length !== lastVisited
        || converged !== lastConverged) {
        lastFound = found.length;
        lastVisited = visited.length;
        lastConverged = converged;
        for (let i = 0; i < dimmables.length; i++) {
          const d = dimmables[i];
          if (d.list === 'converged') { applyDim(d, converged); continue; }
          const list = d.list === 'found' ? found : visited;
          applyDim(d, list.includes(d.id));
        }
      }
    }

    const t = ctx.elapsed;
    for (let i = 0; i < pulse.length; i++) {
      const p = pulse[i];
      p.mat.emissiveIntensity =
        p.base * p.dimRef.dim * (0.75 + 0.25 * Math.sin(t * p.speed + p.phase));
    }
  }

  build(ctx.world.currentSystem);

  return { update };
}
