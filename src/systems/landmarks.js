import * as THREE from 'three';
import { CONVERGENCE, DEEPENING } from '../game/state.js';
import {
  isBeautiful, organicMaterials, makePetalGeometry, makeTendrilGeometry,
  makeOrganicGlowTexture, tagSway, tagBreath, tagPulse, collectOrganic,
  animateOrganic,
} from './organic.js';

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
 * Wave 7: the DEEPENING site follows the same dynamic-POI pattern — built
 * (anomaly visual) only in DEEPENING.site.system and only once
 * mystery.deepHinted is true, watched in update() with rebuilds on flips;
 * mystery.deepened dims it (dimmable list 'deepened').
 *
 * Wave 27: in beautiful-faction systems (organic.js isBeautiful) each
 * landmark routes through a grown glaze builder instead of the standard
 * kind builder — sunken salon barges (wreck), blown-glass lanterns
 * (beacon), mirror-petal obelisks (monument), sourceless color blooms
 * (anomaly). Glazes sculpt from the shared organic toolkit: cached shared
 * materials (userData.shared, NEVER disposed — the dispose loop skips
 * them) for sculpted parts, per-POI SpriteMaterials for glow (registered
 * in ownMat and dimmed via registerDimmable exactly like the standard
 * builders). Scatter is deterministic per POI id (string hash → Lehmer
 * PRNG); the standard builders' Math.random paths are untouched, so
 * non-beautiful systems build byte-identically to before. Glaze POI roots
 * carry userData.organic = true plus the same { poiId, poiType, kind }
 * tags on every piece; §25 holds — glazes are pure set dressing and speak
 * no mystery content (the CONVERGENCE/DEEPENING site builders below are
 * NOT glazed). Animation is collectOrganic once at build (stashed on
 * root.userData.organicParts) + animateOrganic per frame after the pulse
 * loop — part-level sway/breath/pulse only, frozen under
 * ctx.settings.reducedMotion, zero allocation. Per-build glaze geometries
 * are tracked in ownedGeos and disposed on rebuild.
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
  // Wave 27: unit sphere for glaze pearl blisters / motes / globes —
  // per-mesh scale carries the shape, so one geometry serves all glazes.
  blister: new THREE.SphereGeometry(1, 12, 10),
};

const TAU = Math.PI * 2;

// Wave 27: deterministic per-POI scatter for beautiful glazes — a string
// hash of the POI id seeds a Lehmer PRNG (organic.js makeRand pattern).
// The standard wreck builder keeps its build-time Math.random().
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function poiRand(id) {
  let s = (hashSeed(id) % 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Wave 27: glow sprite textures, lazy (canvas needs a DOM) and shared for
// the module's lifetime — marked userData.shared, NEVER disposed. Per-POI
// SpriteMaterials reference them; material disposal leaves the map alone.
let TEX_GLOW_MINT = null;
let TEX_GLOW_OPAL = null;
function glowTextures() {
  if (!TEX_GLOW_MINT) {
    TEX_GLOW_MINT = makeOrganicGlowTexture('#b8ffd8', 'rgba(127,224,168,0)');
    TEX_GLOW_MINT.userData = { shared: true };
    TEX_GLOW_OPAL = makeOrganicGlowTexture('#f0e6ff', 'rgba(216,200,240,0)');
    TEX_GLOW_OPAL.userData = { shared: true };
  }
  return { mint: TEX_GLOW_MINT, opal: TEX_GLOW_OPAL };
}

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
  let ownedGeos = [];   // wave-27 per-build glaze geometries, disposed on rebuild
  let organicRoots = []; // wave-27 glaze POI roots (userData.organicParts)
  let pulse = [];       // { mat, base, dimRef, phase, speed }
  let dimmables = [];   // { id, list, dim, mats: [{mat, base}], colors: [{mat, base}] }
  let lastFound = -1;
  let lastVisited = -1;
  let lastMystery = null; // identity watch: save-load may swap the object
  let lastHinted = false;   // mystery.convergeHinted watch (site POI add)
  let lastConverged = false; // mystery.converged watch (site dim)
  let lastDeepHinted = false;  // mystery.deepHinted watch (site POI add)
  let lastDeepened = false;    // mystery.deepened watch (site dim)

  function ownMat(mat) {
    ownedMats.push(mat);
    return mat;
  }

  function ownGeo(geo) {
    ownedGeos.push(geo);
    return geo;
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

  // ---- Beautiful Ones glazes (wave 27) ------------------------------------
  // Grown replacements for the standard kind builders, dispatched only when
  // isBeautiful(def.faction). Contracts preserved exactly: every piece
  // carries { poiId, poiType: 'landmark', kind }, the root additionally
  // carries organic = true; each builder registers exactly ONE dimmable
  // (the per-POI glow SpriteMaterials — the glaze's lamp, dimmed on
  // discovery via the same color-multiply path); sculpted parts use the
  // cached shared organicMaterials() set directly (never cloned, never
  // owned, never pulsed); all scatter derives from poiRand(def.id).

  function tagPiece(obj, def, kind) {
    obj.userData.poiId = def.id;
    obj.userData.poiType = 'landmark';
    obj.userData.kind = kind;
    return obj;
  }

  // Per-POI glow sprite: material owned (disposed on rebuild), texture
  // shared. Returns { sprite, mat } so the caller can tagPulse and register
  // the dim entry.
  function makeGlazeGlow(def, kind, tex, scale) {
    const mat = ownMat(new THREE.SpriteMaterial({
      map: tex, color: 0xffffff, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    tagPiece(sprite, def, kind);
    return { sprite, mat };
  }

  function glazeRoot(def, kind) {
    const root = new THREE.Group();
    root.name = 'beautiful-landmark';
    root.userData.organic = true;
    tagPiece(root, def, kind);
    return root;
  }

  function finishGlaze(root, colors) {
    // One dimmable per POI, registered last — build() applies membership
    // to dimmables[dimmables.length - 1] right after dispatch.
    registerDimmable(root.userData.poiId, 'visited', EMPTY, colors);
    root.userData.organicParts = collectOrganic(root);
    organicRoots.push(root);
    return root;
  }

  // wreck → sunken salon barge: nacre hull ribs arcing over a keel line,
  // pearl blister clusters, one tarnished-gilt chandelier swaying below
  // the largest rib.
  function glazeWreck(def) {
    const rand = poiRand(def.id);
    const mats = organicMaterials();
    const tarnished = organicMaterials({ tarnished: true });
    const root = glazeRoot(def, 'wreck');

    const keel = new THREE.Mesh(
      ownGeo(makeTendrilGeometry({ length: 26, radius: 1.1, sway: 2.2, taper: 0.35, tubularSegs: 32 })),
      mats.flesh);
    keel.position.z = -13; // tendril grows +Z from the origin: center it
    keel.scale.y = 0.6; // settled into the drift
    tagPiece(keel, def, 'wreck');
    root.add(keel);

    const ribs = 3 + (rand() * 3 | 0); // 3–5
    let biggest = null;
    let biggestLen = 0;
    for (let i = 0; i < ribs; i++) {
      const t = ribs === 1 ? 0.5 : i / (ribs - 1);
      const len = 12 + rand() * 6;
      const rib = new THREE.Mesh(
        ownGeo(makePetalGeometry({ length: len, width: 3.2 + rand() * 1.6, curl: 4.5 + rand() * 2.5, cup: 1.2, segs: 10 })),
        mats.flesh);
      rib.position.set((rand() - 0.5) * 2, 0.4, -11 + t * 22);
      rib.rotation.x = -Math.PI / 2 + 0.25; // rising, curling aft-over
      rib.rotation.z = (rand() - 0.5) * 0.9; // broken-rib roll
      tagPiece(rib, def, 'wreck');
      root.add(rib);
      if (len > biggestLen) { biggestLen = len; biggest = rib; }
    }

    const blisters = 5 + (rand() * 4 | 0); // 5–8
    for (let i = 0; i < blisters; i++) {
      const b = new THREE.Mesh(GEO.blister, mats.flesh);
      b.position.set((rand() - 0.5) * 6, rand() * 1.5, (rand() - 0.5) * 22);
      b.scale.set(1.2 + rand() * 1.8, 0.5 + rand() * 0.5, 1.2 + rand() * 1.8);
      tagPiece(b, def, 'wreck');
      root.add(b);
    }

    // Chandelier: tarnished-gilt tendril frame + mint bud lights, hung
    // below the largest rib's midpoint, swaying gently.
    const chandelier = new THREE.Group();
    tagPiece(chandelier, def, 'wreck');
    chandelier.position.copy(biggest.position);
    chandelier.position.y = biggest.position.y + biggestLen * 0.45;
    const frame = new THREE.Mesh(
      ownGeo(makeTendrilGeometry({ length: 5, radius: 0.35, sway: 1.1, taper: 0.5 })),
      tarnished.gilt);
    frame.rotation.x = Math.PI / 2; // +Z → -Y: hanging down
    tagPiece(frame, def, 'wreck');
    chandelier.add(frame);
    const tex = glowTextures();
    const colors = [];
    const buds = 2 + (rand() * 2 | 0); // 2–3
    for (let i = 0; i < buds; i++) {
      const g = makeGlazeGlow(def, 'wreck', tex.mint, 3.5);
      g.sprite.position.set((rand() - 0.5) * 2.4, -4.2 - rand() * 1.2, (rand() - 0.5) * 2.4);
      tagPulse(g.mat, { base: 0.85, amp: 0.15, hz: 0.3 + rand() * 0.25, phase: rand() * TAU });
      colors.push({ mat: g.mat, base: g.mat.color.clone() });
      chandelier.add(g.sprite);
    }
    tagSway(chandelier, { axis: 'z', amp: 0.06, hz: 0.15, phase: rand() * TAU });
    root.add(chandelier);
    return finishGlaze(root, colors);
  }

  // beacon → blown-glass lantern: a translucent membrane globe caged in
  // gilt tendril arms, mint glow core (the lamp — carries discovery
  // dimming like the standard beacon tip), drifting veinGlow motes.
  function glazeBeacon(def) {
    const rand = poiRand(def.id);
    const mats = organicMaterials();
    const root = glazeRoot(def, 'beacon');

    const globe = new THREE.Mesh(GEO.blister, mats.membrane);
    globe.scale.setScalar(5.2);
    globe.position.y = 7;
    tagPiece(globe, def, 'beacon');
    root.add(globe);

    const arms = 3 + (rand() * 2 | 0); // 3–4
    for (let i = 0; i < arms; i++) {
      const arm = new THREE.Mesh(
        ownGeo(makeTendrilGeometry({ length: 13, radius: 0.45, sway: 2.4, taper: 0.4 })),
        mats.gilt);
      arm.rotation.order = 'YXZ'; // tilt up in the local plane, then azimuth
      arm.rotation.x = -Math.PI / 2 + 0.35; // rising, arcing over the globe
      arm.rotation.y = (i / arms) * TAU + rand() * 0.4;
      tagPiece(arm, def, 'beacon');
      root.add(arm);
    }

    const tex = glowTextures();
    const core = makeGlazeGlow(def, 'beacon', tex.mint, 11);
    core.sprite.position.y = 7;
    tagPulse(core.mat, { base: 0.9, amp: 0.1, hz: 0.5, phase: rand() * TAU });
    root.add(core.sprite);

    const pivot = new THREE.Group();
    tagPiece(pivot, def, 'beacon');
    pivot.position.y = 7;
    const motes = 2 + (rand() * 2 | 0); // 2–3
    for (let i = 0; i < motes; i++) {
      const mote = new THREE.Mesh(GEO.blister, mats.veinGlow);
      mote.scale.setScalar(0.5 + rand() * 0.4);
      const a = rand() * TAU;
      mote.position.set(
        Math.cos(a) * (6.5 + rand() * 2),
        (rand() - 0.5) * 4,
        Math.sin(a) * (6.5 + rand() * 2));
      tagPiece(mote, def, 'beacon');
      pivot.add(mote);
    }
    tagSway(pivot, { axis: 'y', amp: 0.6, hz: 0.08, phase: rand() * TAU });
    root.add(pivot);

    return finishGlaze(root, [{ mat: core.mat, base: core.mat.color.clone() }]);
  }

  // monument → mirror-petal obelisk: a tall cluster of upright curled
  // nacre petals (the flesh sheen catches light like mirrors) around one
  // gilt spine tendril, crowned with an opal glow.
  function glazeMonument(def) {
    const rand = poiRand(def.id);
    const mats = organicMaterials();
    const root = glazeRoot(def, 'monument');

    const petals = 3 + (rand() * 3 | 0); // 3–5
    for (let i = 0; i < petals; i++) {
      const petal = new THREE.Mesh(
        ownGeo(makePetalGeometry({ length: 20 + rand() * 6, width: 6 + rand() * 3, curl: 5 + rand() * 3.5, cup: 1.6, segs: 12 })),
        mats.flesh);
      petal.rotation.order = 'YXZ';
      petal.rotation.x = -Math.PI / 2 + 0.12 + rand() * 0.15; // near-upright
      petal.rotation.y = (i / petals) * TAU + rand() * 0.5;
      tagPiece(petal, def, 'monument');
      tagSway(petal, { axis: 'z', amp: 0.015, hz: 0.1, phase: rand() * TAU });
      root.add(petal);
    }

    const spine = new THREE.Mesh(
      ownGeo(makeTendrilGeometry({ length: 26, radius: 0.55, sway: 1.6, taper: 0.25, tubularSegs: 32 })),
      mats.gilt);
    spine.rotation.x = -Math.PI / 2; // rising through the cluster
    tagPiece(spine, def, 'monument');
    root.add(spine);

    const tex = glowTextures();
    const crown = makeGlazeGlow(def, 'monument', tex.opal, 7);
    crown.sprite.position.y = 24;
    tagPulse(crown.mat, { base: 0.8, amp: 0.2, hz: 0.25, phase: rand() * TAU });
    root.add(crown.sprite);

    return finishGlaze(root, [{ mat: crown.mat, base: crown.mat.color.clone() }]);
  }

  // anomaly → the bloom: layered membrane petals around an empty heart,
  // mint/opal glow drifting inside, slow breath so the bloom opens/closes.
  function glazeAnomaly(def) {
    const rand = poiRand(def.id);
    const mats = organicMaterials();
    const root = glazeRoot(def, 'anomaly');

    const bloom = new THREE.Group();
    tagPiece(bloom, def, 'anomaly');
    const petals = 5 + (rand() * 3 | 0); // 5–7
    for (let i = 0; i < petals; i++) {
      const petal = new THREE.Mesh(
        ownGeo(makePetalGeometry({ length: 13 + rand() * 5, width: 8 + rand() * 3, curl: 6 + rand() * 3, cup: 2.5 + rand() * 1.5, segs: 12 })),
        mats.membrane);
      petal.rotation.order = 'YXZ';
      petal.rotation.x = -Math.PI / 2 + 0.5 + rand() * 0.35; // half-open
      petal.rotation.y = (i / petals) * TAU + rand() * 0.4;
      petal.scale.setScalar(0.85 + rand() * 0.35); // staggered layers
      tagPiece(petal, def, 'anomaly');
      bloom.add(petal);
    }
    tagBreath(bloom, { depth: 0.03, hz: 0.2, phase: rand() * TAU });
    root.add(bloom);

    const tex = glowTextures();
    const drift = new THREE.Group();
    tagPiece(drift, def, 'anomaly');
    const colors = [];
    const glows = 2 + (rand() * 2 | 0); // 2–3
    for (let i = 0; i < glows; i++) {
      const g = makeGlazeGlow(def, 'anomaly', i % 2 ? tex.opal : tex.mint, 6 + rand() * 3);
      g.sprite.position.set((rand() - 0.5) * 5, 2 + rand() * 4, (rand() - 0.5) * 5);
      tagPulse(g.mat, { base: 0.75, amp: 0.2, hz: 0.3 + rand() * 0.3, phase: rand() * TAU });
      colors.push({ mat: g.mat, base: g.mat.color.clone() });
      drift.add(g.sprite);
    }
    tagSway(drift, { axis: 'y', amp: 0.8, hz: 0.06, phase: rand() * TAU });
    root.add(drift);

    return finishGlaze(root, colors);
  }

  // ---- Build / rebuild ----------------------------------------------------

  function build(systemId) {
    const def = ctx.systems?.[systemId];
    group = new THREE.Group();
    group.name = 'landmarks';
    ctx.scene.add(group);
    ownedMats = [];
    ownedGeos = [];
    organicRoots = [];
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
    lastDeepHinted = !!mystery?.deepHinted;
    lastDeepened = !!mystery?.deepened;
    if (!def) return;

    const landmarks = def.landmarks ?? EMPTY;
    const beautiful = isBeautiful(def.faction); // wave 27 glaze dispatch
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      let obj;
      switch (lm.kind) {
        case 'wreck': obj = beautiful ? glazeWreck(lm) : buildWreck(lm); break;
        case 'beacon': obj = beautiful ? glazeBeacon(lm) : buildBeacon(lm); break;
        case 'monument': obj = beautiful ? glazeMonument(lm) : buildMonument(lm); break;
        case 'anomaly': obj = beautiful ? glazeAnomaly(lm) : buildAnomaly(lm); break;
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

    // Wave 7: the deepening site mirrors the convergence site — exists only
    // after Echo's hint, and only in its own system. Same anomaly visual,
    // dimmed like a discovered landmark once deepened.
    if (systemId === DEEPENING.site.system && lastDeepHinted) {
      const site = buildAnomaly(DEEPENING.site);
      site.position.fromArray(DEEPENING.site.position);
      group.add(site);
      const d = dimmables[dimmables.length - 1];
      d.list = 'deepened'; // membership is the deepened flag, not an array
      applyDim(d, lastDeepened);
    }
  }

  function dispose() {
    if (!group) return;
    ctx.scene.remove(group);
    for (let i = 0; i < ownedMats.length; i++) {
      const m = ownedMats[i];
      // Wave-27 shared-resource guard: cached organic materials (and their
      // maps) are never disposed. ownMat only ever receives per-build
      // materials, so this is belt-and-braces against future callers.
      if (!m.userData.shared) m.dispose();
    }
    ownedMats = [];
    for (let i = 0; i < ownedGeos.length; i++) ownedGeos[i].dispose();
    ownedGeos = [];
    organicRoots = [];
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
      const deepHinted = !!mystery.deepHinted;
      const deepened = !!mystery.deepened;
      if (hinted !== lastHinted || deepHinted !== lastDeepHinted) {
        // Hint flip can add/remove a site POI — full rebuild (same
        // discipline as systemLoaded; disposes per-build mats).
        rebuild(ctx.world.currentSystem);
      } else if (mystery !== lastMystery || found.length !== lastFound
        || visited.length !== lastVisited || converged !== lastConverged
        || deepened !== lastDeepened) {
        // A save-load record swap (identity change) lands here: the POI
        // set keys off the hint flags above, so the swap alone changes
        // nothing structural — re-apply dimming in place (the swapped
        // record's ids may differ at equal lengths) and leave the built
        // scene's object identities untouched. A same-system death-
        // restore therefore never rebuilds the grown scene.
        lastMystery = mystery;
        lastFound = found.length;
        lastVisited = visited.length;
        lastConverged = converged;
        lastDeepened = deepened;
        for (let i = 0; i < dimmables.length; i++) {
          const d = dimmables[i];
          if (d.list === 'converged') { applyDim(d, converged); continue; }
          if (d.list === 'deepened') { applyDim(d, deepened); continue; }
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

    // Wave 27: drive glaze sway/breath/pulse. Zero allocation; a complete
    // no-op under reducedMotion (bases stay, everything freezes).
    const reduced = ctx.settings.reducedMotion;
    for (let i = 0; i < organicRoots.length; i++) {
      const parts = organicRoots[i].userData.organicParts;
      if (parts) animateOrganic(parts, t, reduced);
    }
  }

  build(ctx.world.currentSystem);

  return { update };
}
