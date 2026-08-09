import * as THREE from 'three';
import {
  SHIP_CLASSES,
  FACTIONS,
  U,
  WEAPONS,
  ECON,
  NAMED_GUNS,
  createShipState,
  tickShipState,
  computeResolve,
  resolveBand,
  cargoValue,
  HIDDEN_MOUNTS,
} from '../game/state.js';
import { epicEffects } from '../game/epics.js';
import { spawnPod } from '../game/pods.js';
import {
  isBeautiful,
  sculptGrownHull,
  makePetalGeometry,
  makeTendrilGeometry,
  organicMaterials,
  tagSway,
  tagBreath,
  collectOrganic,
  animateOrganic,
} from './organic.js';

/**
 * NPC system — live NPC ships: procedural meshes + AI (doc §6.7, §7).
 *
 * Exports the cross-worker API traffic.js imports:
 *   spawnLiveShip(ctx, record, position) → { id, record, object, state, role, ai }
 *   removeLiveShip(ctx, liveShip)
 *
 * record fields read: { id?, classKey, role ('trader'|'patrol'|'pirate'|'ace'),
 *   name?, faction?, cargo?, resolve?, personality?, bounty?, route?: Vector3[],
 *   anchor?: Vector3 }
 *
 * AI modes: route (trader), loiter (patrol), hunt (pirate), duel (ace),
 * plus surrender modes flee/drift. Hostiles telegraph ≥3 s before the first
 * shot (§6.1): direct approach + flashing engine glow + a commLine. Fire is
 * emitted as 'npcFire' { ship, weapon:'cannon' } — combat.js spawns the
 * actual projectile.
 *
 * Resolve (§7.2–7.5) is recomputed ~1 Hz for hostiles-with-intent and for any
 * ship recently in combat. Bands drive behavior: defiant presses, shaken
 * weaves with visible power waver, bargaining opens one combat hail,
 * capitulate picks a §7.5 outcome (cut engines / jettison / flee / crew pods).
 *
 * update() performs zero allocations: all scratch vectors/quaternions are
 * module-scope; allocations happen only on spawn, hail, capitulation, or
 * destruction (event-time, not per-frame).
 *
 * Wave 27 (Beautiful Ones organic technology): beautiful-faction ships are
 * GROWN, not built — buildBeautifulShip sculpts nacre hulls, orchid-petal
 * sail fins, and tendril tails from the organic.js toolkit instead of the
 * box/cone placeholder switch. Pirate-role beautiful ships use the
 * `tarnished` material variant (the fallen-Beautiful look). Grown groups
 * are named 'beautiful-ship' with userData.organic = { classKey, role,
 * tarnished }, a mint engine glow, and per-part sway/breath animated from
 * the update loop via animateOrganic (zero-alloc, frozen under
 * ctx.settings.reducedMotion). Geometries/materials are module-scope
 * cached and shared (factionMaterials pattern — never disposed).
 *
 * Wave 30 (§29 product test — "I paid one off, bluffed the other with hidden
 * mounts"): a hunting pirate that closes to U.TARGET_RANGE of the player
 * opens ONE demand hail before pressing the attack — 'payTribute' /
 * 'showTeeth' (only when ctx.world.concealedMounts === true) / 'refuseFight',
 * resolved in hail.js. While the card is open the pirate holds position
 * weapons-cold (ai.demanding); the parley voids if the player lands a hit,
 * and record.demandedAt (JSON-plain, persisted) enforces a per-record
 * cooldown across despawn/re-instantiation. Every pirate/ace entry into flee
 * mode (capitulate or hail resolution) also stamps record.wakeSite
 * { position: [x,y,z], found: false } — current position + forward heading ×
 * WAKE_SITE_DISTANCE (1400 = U.DEINSTANTIATE_RANGE in state.js, the range at
 * which traffic.js folds live ships back into records, so the site outlives
 * the fleeing ship) — the wake-trailing contract consumed by wakes.js.
 */

// ---------- module-scope scratch (no per-frame allocation) ----------
const NEG_Z = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _toT = new THREE.Vector3();
const _q = new THREE.Quaternion();

const TELEGRAPH_SECONDS = 3; // §6.1 minimum hostile-intent warning
const NPC_FIRE_INTERVAL = 1 / (WEAPONS.cannon.rof * 0.5); // ~0.5× player rof
const ACE_FURY_INTERVAL = NPC_FIRE_INTERVAL * 0.65;
const LAW_ZONE_RADIUS = 300; // station law zone: no hostile intent develops
const RESOLVE_INTERVAL = 1; // s between resolve recomputes
const THREAT_MEMORY = 12; // s a ship stays wary after last combat
const FIRE_FACE_DOT = 0.92; // must roughly face target to fire
const FLASH_LIFE = 0.6; // s debris flash on destruction
const DEMAND_COOLDOWN = 300; // s before the same pirate record may demand the player again (record.demandedAt)
const WAKE_SITE_DISTANCE = 1400; // = U.DEINSTANTIATE_RANGE (state.js; traffic.js despawns there) — the wake site sits beyond the fold

let nextShipId = 1;

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// ---------- procedural meshes (§13.1 silhouette-readable) ----------
const factionMaterials = {}; // faction → { hull, trim } (shared, never disposed)
function materialsFor(faction) {
  let m = factionMaterials[faction];
  if (!m) {
    const color = FACTIONS[faction]?.color ?? FACTIONS.independent.color;
    m = {
      hull: new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.45 }),
      trim: new THREE.MeshStandardMaterial({ color: 0xd7e4ea, roughness: 0.35, metalness: 0.6 }),
    };
    factionMaterials[faction] = m;
  }
  return m;
}

let glowGeo = null;
let glowMat = null;
let flashGeo = null;

function part(group, geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx, ry, rz);
  group.add(m);
  return m;
}

// ---------- Beautiful Ones grown ships (wave 27) ----------
// Beautiful technology is grown, not built: sculpted nacre hulls,
// orchid-petal sail fins, tendril tails, gilt veining — zero straight
// edges. All geometry is cached per classKey at module scope and shared
// across every spawn (factionMaterials pattern — NEVER disposed); the
// tarnished ("fallen Beautiful" pirate) variant reuses the SAME geometries
// with the tarnished organicMaterials() set. Animation is part-level only
// (fin/tendril sway, hull/pod breath) — no per-vertex mutation, which stays
// unique to the player ship (ship.js). The shared veinGlow/membrane/flesh/
// gilt materials are never tagPulse'd (pulse params live on material
// userData — one slot; these are shared).
const beautifulGeos = {}; // classKey → { hull, fins, extras, tail, glowZ } (shared, never disposed)
let beautifulGlowMat = null; // mint engine glow (shared, never disposed)

function beautifulGeosFor(classKey) {
  let c = beautifulGeos[classKey];
  if (c) return c;
  switch (classKey) {
    case 'freighter': {
      // Salon barge: broad heavy hull, two grand petal sail fins swept
      // up/back, four pearl blister cargo pods slung ventrally, gilt keel.
      const hull = sculptGrownHull({
        spine: 2.3, midWiden: 2.8, tailStart: 1.4, tailRate: 1.0,
        flatten: 0.42, camber: 0.22, headBulge: 0.12,
      }).geo;
      hull.scale(1.8, 1.8, 1.8);
      const blister = new THREE.SphereGeometry(1, 18, 12);
      blister.scale(1.15, 0.75, 1.55);
      const keel = new THREE.SphereGeometry(1, 12, 8);
      keel.scale(0.16, 0.16, 3.4);
      const sailA = makePetalGeometry({ length: 5.4, width: 2.6, curl: 1.2, cup: 0.55 });
      const sailB = makePetalGeometry({ length: 5.4, width: 2.6, curl: 1.2, cup: 0.55 });
      c = {
        hull,
        glowZ: 3.9,
        fins: [
          { geo: sailA, x: 1.6, y: 0.8, z: 0.4, rx: -0.15, ry: -0.2, rz: -1.05, axis: 'z', amp: 0.07, hz: 0.32 },
          { geo: sailB, x: -1.6, y: 0.8, z: 0.4, rx: -0.15, ry: 0.2, rz: 1.05, axis: 'z', amp: 0.07, hz: 0.32 },
        ],
        extras: [
          { geo: blister, mat: 'flesh', x: 2.6, y: -0.85, z: 1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: -2.6, y: -0.85, z: 1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: 2.6, y: -0.85, z: -1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: blister, mat: 'flesh', x: -2.6, y: -0.85, z: -1.4, breath: { depth: 0.05, hz: 0.22 } },
          { geo: keel, mat: 'gilt', x: 0, y: -0.8, z: 0.2 },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.4, radius: 0.22, sway: 0.4, taper: 0.25 }), x: 0, y: 0, z: 3.1, amp: 0.05, hz: 0.4 },
      };
      break;
    }
    case 'cutter': {
      // Slim predator ray: narrow fast profile (low midWiden, hard tail
      // whip), two swept petal fins, one dorsal petal crest.
      const hull = sculptGrownHull({
        spine: 2.5, midWiden: 1.5, tailStart: 1.1, tailRate: 2.3,
        flatten: 0.26, camber: 0.12, headBulge: 0.05,
      }).geo;
      hull.scale(1.2, 1.2, 1.2);
      const finA = makePetalGeometry({ length: 3.6, width: 1.5, curl: 0.55, cup: 0.3 });
      const finB = makePetalGeometry({ length: 3.6, width: 1.5, curl: 0.55, cup: 0.3 });
      c = {
        hull,
        glowZ: 2.85,
        fins: [
          { geo: finA, x: 0.9, y: 0.1, z: 0.1, rx: 0, ry: 0.85, rz: -0.25, axis: 'z', amp: 0.1, hz: 0.55 },
          { geo: finB, x: -0.9, y: 0.1, z: 0.1, rx: 0, ry: -0.85, rz: 0.25, axis: 'z', amp: 0.1, hz: 0.55 },
          { geo: makePetalGeometry({ length: 2.6, width: 0.9, curl: 0.7, cup: 0.25 }), x: 0, y: 0.4, z: -0.2, rx: -1.0, ry: 0, rz: 0, axis: 'y', amp: 0.06, hz: 0.5 },
        ],
        extras: [],
        tail: { geo: makeTendrilGeometry({ length: 3.4, radius: 0.12, sway: 0.55, taper: 0.2 }), x: 0, y: 0, z: 2.2, amp: 0.07, hz: 0.5 },
      };
      break;
    }
    case 'heavy':
    case 'frigate': {
      // Grand swan-manta: broad hull, tall dorsal sail crest curling
      // forward like a swan neck, gilt vein spine. Frigate runs ~1.6×
      // (mirroring the placeholder's larger relative scale; class size
      // ordering preserved).
      const k = classKey === 'frigate' ? 1.6 : 1;
      const s = 2.0 * k;
      const hull = sculptGrownHull({
        spine: 2.2, midWiden: 2.5, tailStart: 1.3, tailRate: 1.3,
        flatten: 0.34, camber: 0.2, headBulge: 0.1,
      }).geo;
      hull.scale(s, s, s);
      const spineGeo = new THREE.SphereGeometry(1, 12, 8);
      spineGeo.scale(0.14 * k, 0.14 * k, 2.8 * k);
      const finA = makePetalGeometry({ length: 4.4 * k, width: 1.7 * k, curl: 0.7 * k, cup: 0.35 * k });
      const finB = makePetalGeometry({ length: 4.4 * k, width: 1.7 * k, curl: 0.7 * k, cup: 0.35 * k });
      c = {
        hull,
        glowZ: 2.2 * s * 0.95,
        fins: [
          { geo: finA, x: 2.2 * k, y: 0.1 * k, z: 0.3 * k, rx: 0, ry: 0.7, rz: -0.2, axis: 'z', amp: 0.08, hz: 0.4 },
          { geo: finB, x: -2.2 * k, y: 0.1 * k, z: 0.3 * k, rx: 0, ry: -0.7, rz: 0.2, axis: 'z', amp: 0.08, hz: 0.4 },
          { geo: makePetalGeometry({ length: 5.0 * k, width: 1.6 * k, curl: 1.7 * k, cup: 0.4 * k }), x: 0, y: 0.95 * k, z: -0.4 * k, rx: -0.9, ry: 0, rz: 0, axis: 'y', amp: 0.05, hz: 0.3 },
        ],
        extras: [
          { geo: spineGeo, mat: 'gilt', x: 0, y: 0.95 * k, z: 0.9 * k },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.8 * k, radius: 0.18 * k, sway: 0.45 * k, taper: 0.22 }), x: 0, y: 0, z: 3.3 * k, amp: 0.05, hz: 0.35 },
      };
      break;
    }
    case 'ace': {
      // Duelist ray: elegant narrow hull; the placeholder's gilt crest ring
      // becomes a crown of gilt tendrils arcing back over the head —
      // recognizable at distance.
      const hull = sculptGrownHull({
        spine: 2.7, midWiden: 1.7, tailStart: 1.2, tailRate: 1.9,
        flatten: 0.24, camber: 0.14, headBulge: 0.07,
      }).geo;
      hull.scale(1.3, 1.3, 1.3);
      const crown = makeTendrilGeometry({ length: 1.8, radius: 0.07, sway: 0.5, taper: 0.12 });
      const finA = makePetalGeometry({ length: 3.4, width: 1.3, curl: 0.6, cup: 0.3 });
      const finB = makePetalGeometry({ length: 3.4, width: 1.3, curl: 0.6, cup: 0.3 });
      c = {
        hull,
        glowZ: 3.3,
        fins: [
          { geo: finA, x: 1.1, y: 0.1, z: 0.1, rx: 0, ry: 0.9, rz: -0.3, axis: 'z', amp: 0.12, hz: 0.6 },
          { geo: finB, x: -1.1, y: 0.1, z: 0.1, rx: 0, ry: -0.9, rz: 0.3, axis: 'z', amp: 0.12, hz: 0.6 },
        ],
        extras: [
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: -0.6, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: -0.3, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.62, ry: 0, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: 0.3, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
          { geo: crown, mat: 'gilt', x: 0, y: 0.45, z: -1.1, rx: -0.55, ry: 0.6, sway: { axis: 'y', amp: 0.05, hz: 0.65 } },
        ],
        tail: { geo: makeTendrilGeometry({ length: 3.2, radius: 0.12, sway: 0.45, taper: 0.2 }), x: 0, y: 0, z: 2.6, amp: 0.06, hz: 0.55 },
      };
      break;
    }
    default: {
      // Light / unknown: small dart-ray.
      const hull = sculptGrownHull({
        spine: 2.1, midWiden: 1.9, tailStart: 1.2, tailRate: 1.8,
        flatten: 0.3, camber: 0.14, headBulge: 0.08,
      }).geo;
      const finA = makePetalGeometry({ length: 2.4, width: 1.1, curl: 0.45, cup: 0.28 });
      const finB = makePetalGeometry({ length: 2.4, width: 1.1, curl: 0.45, cup: 0.28 });
      c = {
        hull,
        glowZ: 2.0,
        fins: [
          { geo: finA, x: 0.7, y: 0.05, z: 0, rx: 0, ry: 0.95, rz: -0.3, axis: 'z', amp: 0.14, hz: 0.7 },
          { geo: finB, x: -0.7, y: 0.05, z: 0, rx: 0, ry: -0.95, rz: 0.3, axis: 'z', amp: 0.14, hz: 0.7 },
        ],
        extras: [],
        tail: { geo: makeTendrilGeometry({ length: 2.4, radius: 0.1, sway: 0.4, taper: 0.25 }), x: 0, y: 0, z: 1.6, amp: 0.08, hz: 0.6 },
      };
      break;
    }
  }
  beautifulGeos[classKey] = c;
  return c;
}

/**
 * Grow a Beautiful Ones ship (wave 27). Nose -Z, class-comparable scale.
 * `role` selects the material variant: pirates are tarnished (fallen
 * Beautiful). Every fin mesh is named 'beautiful-fin' and sway-tagged; the
 * hull breathes; the tendril tail sways gently. Sets userData.glow (mint,
 * shared geometry/material — consumers mutate scale/visible only),
 * userData.organic, and userData.organicParts for the update loop.
 */
function buildBeautifulShip(classKey, role) {
  role = role ?? SHIP_CLASSES[classKey]?.role ?? 'trader';
  const tarnished = role === 'pirate';
  const mats = organicMaterials({ tarnished });
  const spec = beautifulGeosFor(classKey);
  const g = new THREE.Group();
  g.name = 'beautiful-ship';

  // Nacre hull + mint vein-glow overlay shell riding just off the skin
  // (child of the hull so it inherits the breath scale).
  const hull = new THREE.Mesh(spec.hull, mats.flesh);
  tagBreath(hull, { depth: 0.012, hz: 0.16, phase: Math.random() * Math.PI * 2 });
  const veins = new THREE.Mesh(spec.hull, mats.veinGlow);
  veins.scale.setScalar(1.018);
  hull.add(veins);
  g.add(hull);

  // Petal fins: translucent membrane over a veinGlow liner that glows
  // through. Each fin sways on its tagged axis around its rest rotation.
  for (let i = 0; i < spec.fins.length; i++) {
    const f = spec.fins[i];
    const fin = new THREE.Mesh(f.geo, mats.membrane);
    fin.name = 'beautiful-fin';
    fin.position.set(f.x, f.y, f.z);
    fin.rotation.set(f.rx, f.ry, f.rz);
    tagSway(fin, { axis: f.axis, amp: f.amp, hz: f.hz, phase: Math.random() * Math.PI * 2 });
    const liner = new THREE.Mesh(f.geo, mats.veinGlow);
    liner.scale.set(0.92, 0.92, 0.97);
    liner.position.y = 0.02;
    fin.add(liner);
    g.add(fin);
  }

  // Class extras: blister cargo pods (breathing), gilt keel/vein spine,
  // ace gilt tendril crown (swaying).
  for (let i = 0; i < spec.extras.length; i++) {
    const e = spec.extras[i];
    const mesh = new THREE.Mesh(e.geo, e.mat === 'gilt' ? mats.gilt : mats.flesh);
    mesh.position.set(e.x, e.y, e.z);
    mesh.rotation.set(e.rx ?? 0, e.ry ?? 0, e.rz ?? 0);
    if (e.breath) tagBreath(mesh, { depth: e.breath.depth, hz: e.breath.hz, phase: Math.random() * Math.PI * 2 });
    if (e.sway) tagSway(mesh, { axis: e.sway.axis, amp: e.sway.amp, hz: e.sway.hz, phase: Math.random() * Math.PI * 2 });
    g.add(mesh);
  }

  // Tendril tail, gently swaying at the sculpted stern.
  const tail = new THREE.Mesh(spec.tail.geo, mats.flesh);
  tail.position.set(spec.tail.x, spec.tail.y, spec.tail.z);
  tagSway(tail, { axis: 'y', amp: spec.tail.amp, hz: spec.tail.hz, phase: Math.random() * Math.PI * 2 });
  g.add(tail);

  // Mint engine glow at the sculpted tail — same shared-geometry contract
  // as the standard glow (consumers mutate scale/visible only, so a second
  // shared material is safe).
  glowGeo ??= new THREE.SphereGeometry(0.55, 8, 6);
  beautifulGlowMat ??= new THREE.MeshBasicMaterial({
    color: 0x7fe0a8,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, beautifulGlowMat);
  glow.position.set(0, 0, spec.glowZ);
  g.add(glow);
  g.userData.glow = glow;

  g.userData.organic = { classKey, role, tarnished };
  g.userData.organicParts = collectOrganic(g);
  return g;
}

/**
 * Build a faction-colored ship mesh. Nose points along local -Z (ship.js
 * convention). Beautiful-Ones factions delegate to buildBeautifulShip
 * (wave 27: grown organic hulls; `role` selects the tarnished fallen-
 * Beautiful material variant for pirates). Every other faction takes the
 * box/cone placeholder path below, unchanged.
 */
function buildShipMesh(classKey, faction, role) {
  if (isBeautiful(faction)) return buildBeautifulShip(classKey, role);
  const { hull, trim } = materialsFor(faction);
  const g = new THREE.Group();
  let glowZ = 3;

  switch (classKey) {
    case 'freighter': {
      // Boxy hull + visible cargo pods (§13.1: visible cargo).
      part(g, new THREE.BoxGeometry(3.6, 3, 9), hull);
      part(g, new THREE.BoxGeometry(2.2, 1.4, 2), trim, 0, 1.9, -2.5); // cab
      const podGeo = new THREE.BoxGeometry(1.4, 1.4, 2.6);
      part(g, podGeo, trim, -2.4, 0, 1.6);
      part(g, podGeo, trim, 2.4, 0, 1.6);
      part(g, podGeo, trim, -2.4, 0, -1.6);
      part(g, podGeo, trim, 2.4, 0, -1.6);
      glowZ = 4.8;
      break;
    }
    case 'cutter': {
      // Lean dart.
      part(g, new THREE.ConeGeometry(1.1, 7, 6), hull, 0, 0, 0, -Math.PI / 2);
      const wingGeo = new THREE.BoxGeometry(3.4, 0.15, 1.6);
      part(g, wingGeo, trim, 0, 0, 2.2);
      part(g, new THREE.BoxGeometry(0.15, 1.6, 1.4), trim, 0, 0.7, 2.4);
      glowZ = 3.6;
      break;
    }
    case 'heavy':
    case 'frigate': {
      // Broad wedge.
      const s = classKey === 'frigate' ? 3.5 : 1;
      const body = part(g, new THREE.BoxGeometry(7 * s, 2 * s, 6 * s), hull);
      body.scale.set(1, 1, 1);
      const nose = part(g, new THREE.ConeGeometry(2.6 * s, 4 * s, 4), hull, 0, 0, -5 * s, -Math.PI / 2, Math.PI / 4);
      nose.scale.set(1.35, 0.55, 1);
      part(g, new THREE.BoxGeometry(8.6 * s, 0.4 * s, 2.4 * s), trim, 0, 0.9 * s, 1.6 * s);
      glowZ = 3.2 * s;
      break;
    }
    case 'ace': {
      // Sleek + distinctive trim ring (§6.7 named ace: recognizable).
      const body = part(g, new THREE.OctahedronGeometry(1.6, 0), hull);
      body.scale.set(0.9, 0.55, 3.2);
      part(g, new THREE.TorusGeometry(1.3, 0.14, 6, 18), trim, 0, 0, 0.6);
      part(g, new THREE.BoxGeometry(0.14, 1.8, 1.8), trim, 0, 0.8, 2.4);
      glowZ = 4.6;
      break;
    }
    default: {
      // Light / unknown: small dart.
      part(g, new THREE.ConeGeometry(0.9, 5, 6), hull, 0, 0, 0, -Math.PI / 2);
      part(g, new THREE.BoxGeometry(2.4, 0.12, 1.2), trim, 0, 0, 1.6);
      glowZ = 2.8;
    }
  }

  // Small engine-glow point at the stern. Animated via scale/visible only so
  // the material stays shared across every ship.
  glowGeo ??= new THREE.SphereGeometry(0.55, 8, 6);
  glowMat ??= new THREE.MeshBasicMaterial({
    color: 0xffa54a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 0, glowZ);
  g.add(glow);
  g.userData.glow = glow;
  return g;
}

// ---------- AI construction ----------
function ring(center, radius, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(
      new THREE.Vector3(
        center.x + Math.cos(a) * radius,
        center.y + (Math.random() - 0.5) * 24,
        center.z + Math.sin(a) * radius,
      ),
    );
  }
  return pts;
}

function makeAi(ctx, record, startPos) {
  const role = record.role ?? 'trader';
  const mode = role === 'pirate' ? 'hunt' : role === 'ace' ? 'duel' : role === 'trader' ? 'route' : 'loiter';
  const ai = {
    mode,
    role,
    t: 0,
    phase: null, // null | 'telegraph' | 'attack'
    phaseStart: 0,
    acePhase: 1,
    target: null, // 'player' | live ship
    intent: false, // hostile intent toward the player (drives ctx.flags.combat)
    commSent: false,
    recognitionSent: false, // ace recognition/rematch line fires once per instance
    hailed: false,
    surrenderDone: false,
    demandSent: false, // wave 30: one demand hail per instantiation (reset never)
    demanding: false, // demand card open: hold position, weapons cold
    demandOutcome: null, // stamped by hail.js: 'paid'|'bluffed'|'refused'|'failed'
    demandPeaceAt: 0, // demand open time; a player hit after this voids the parley
    band: 'defiant',
    resolveAt: 0,
    fireAt: 0,
    wp: 0,
    waypoints: null,
    calmUntil: 0,
    disabledInit: false,
    driftVel: new THREE.Vector3(),
    weaveSeed: Math.random() * Math.PI * 2,
  };
  if (mode === 'route' && Array.isArray(record.route) && record.route.length > 0) {
    ai.waypoints = record.route;
  } else if (mode === 'route') {
    ai.waypoints = ring(startPos, 90, 3);
  } else {
    ai.waypoints = ring(record.anchor ?? ctx.config.world.stationPosition, 80 + Math.random() * 70, 4);
  }
  return ai;
}

// ---------- cross-worker API (imported by traffic.js) ----------
// Contract (agreed with world/traffic owner): spawnLiveShip ONLY constructs —
// scene add, state, ai. traffic.js owns the ctx.ships list and pushes the
// returned object itself. removeLiveShip removes the mesh only; traffic
// splices the list (its splice is defensive if the entry is already gone).
export function spawnLiveShip(ctx, record, position) {
  const object = buildShipMesh(record.classKey, record.faction, record.role ?? SHIP_CLASSES[record.classKey]?.role ?? 'trader');
  object.position.copy(position);
  ctx.scene.add(object);
  // createShipState reads { name, faction, cargo, resolve, personality,
  // bounty } — record carries personality/bounty; records carry resolveSeed
  // (0..1), which createShipState does not read, so map it onto resolve.
  const state = createShipState(record.classKey, {
    ...record,
    resolve: record.resolve ?? Math.round((record.resolveSeed ?? 0.5) * 100),
  });
  // Illyx rematch ladder: he fled a defeat and comes back harder, up to TWO
  // bumps (+15 resolve each, capped at 95). Each bump requires one more
  // recorded ace defeat than bumps already taken. record.rematchCount
  // (JSON-plain, persisted) counts bumps taken; the bump is written back onto
  // record.resolve, which createShipState prefers on every later
  // instantiation, so despawn/re-instantiation reuses it instead of
  // stacking another +15.
  if (
    record.name === 'Carver Illyx' &&
    (record.rematchCount ?? 0) < 2 &&
    (ctx.world.aceRivalry?.defeats ?? 0) > (record.rematchCount ?? 0) &&
    record.state !== 'dead' &&
    record.state !== 'captured'
  ) {
    record.rematchCount = (record.rematchCount ?? 0) + 1;
    record.resolve = Math.min(95, (record.resolve ?? 55) + 15);
    state.resolve = record.resolve;
  }
  const live = {
    id: record.id ?? `npc-${nextShipId++}`,
    record,
    object,
    state,
    role: record.role ?? SHIP_CLASSES[record.classKey]?.role ?? 'trader',
    ai: null,
  };
  live.ai = makeAi(ctx, record, position);
  return live;
}

export function removeLiveShip(ctx, liveShip) {
  ctx.scene.remove(liveShip.object);
}

// ---------- shared helpers ----------
function say(ctx, live, text) {
  ctx.emit('commLine', { text, from: live.state.name });
}

function bumpFear(ctx, delta) {
  ctx.world.fear = Math.max(0, Math.min(100, ctx.world.fear + delta));
  ctx.emit('fearChanged', { fear: ctx.world.fear });
}

/**
 * Flee wake-site stamping (wave 30, contract with wakes.js): when a pirate
 * or ace breaks off, stamp where its wake can later be trailed — current
 * position + forward heading × WAKE_SITE_DISTANCE (1400 = U.DEINSTANTIATE_RANGE,
 * so the site sits beyond traffic.js's despawn fold). Overwritten on each
 * flee. JSON-plain only (plain array — records serialize through save.js);
 * allocation is event-time, never per-frame. Skips null records and
 * non-pirate/ace ships. Exported for hail.js, which resolves several of the
 * flee entries.
 */
export function stampWakeSite(live) {
  const rec = live.record;
  if (!rec) return;
  const role = live.role ?? rec.role;
  if (role !== 'pirate' && role !== 'ace') return;
  _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
  const p = live.object.position;
  rec.wakeSite = {
    position: [p.x + _fwd.x * WAKE_SITE_DISTANCE, p.y + _fwd.y * WAKE_SITE_DISTANCE, p.z + _fwd.z * WAKE_SITE_DISTANCE],
    found: false,
  };
}

function speedCap(live) {
  const cls = SHIP_CLASSES[live.state.classKey];
  return live.state.engineOut ? cls.cruise * 0.3 : cls.cruise;
}

/** Rotate toward target and advance along -Z. Returns distance to target. */
function steer(object, targetPos, speed, turnRate, dt) {
  _v1.subVectors(targetPos, object.position);
  const dist = _v1.length();
  if (dist > 1e-3) {
    _v1.divideScalar(dist);
    _q.setFromUnitVectors(NEG_Z, _v1);
    object.quaternion.rotateTowards(_q, turnRate * dt);
  }
  if (speed > 0) {
    _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
    object.position.addScaledVector(_fwd, speed * dt);
  }
  return dist;
}

function facingDot(object, targetPos) {
  _fwd.copy(NEG_Z).applyQuaternion(object.quaternion);
  _toT.subVectors(targetPos, object.position).normalize();
  return _fwd.dot(_toT);
}

function playerNear(ctx, live, range) {
  const o = ctx.ship.object;
  return !!o && live.object.position.distanceTo(o.position) < range;
}

// ---------- resolve & the fear economy (§7.2–7.5) ----------
function updateResolve(ctx, live, now) {
  const st = live.state;
  const ai = live.ai;
  const hostile = (ai.mode === 'hunt' || ai.mode === 'duel') && ai.intent;
  const threatened = now - st.lastCombatAt < THREAT_MEMORY;
  if (!hostile && !threatened) return;
  if (now < ai.calmUntil) return;

  const shieldFrac = (st.screen + st.shell) / (st.screenMax + st.shellMax);
  const defense = shieldFrac * 0.5 + (st.hull / st.hullMax) * 0.35 + (st.engine / st.engineMax) * 0.15;
  let force = 0.5;
  const p = ctx.player;
  if (p) {
    const playerFrac = ((p.screen + p.shell) / (p.screenMax + p.shellMax)) * 0.5 + (p.hull / p.hullMax) * 0.5;
    const ownFrac = shieldFrac * 0.5 + (st.hull / st.hullMax) * 0.5;
    force = clamp01(0.5 + (playerFrac - ownFrac) * 0.5);
  }
  // Pirate resolve gets the faction epic's pirateResolveMod as an additive
  // nudge alongside personality (Red Ledger epic stage 3 = -10: they yield
  // sooner). epicEffects is pure — reads ctx.world.epics, writes nothing.
  st.resolve = computeResolve(
    {
      defense: clamp01(defense),
      force,
      fear: clamp01(ctx.world.fear / 100),
      cargoAtStake: clamp01(cargoValue(st.cargo, ctx.world.prices) / 2000),
      doctrine: FACTIONS[st.faction]?.doctrine ?? 0.5,
    },
    ai.role === 'pirate'
      // Wave 9: no Named Guns left, every pirate has heard — additive -5
      // alongside the epic mod while 'rimWithoutGuns' stands.
      ? st.personality + (epicEffects(ctx, live.record?.faction ?? st.faction).pirateResolveMod ?? 0)
        + (ctx.world.milestones.includes('rimWithoutGuns') ? NAMED_GUNS.brokenResolveMod : 0)
      : st.personality,
  );
  const band = resolveBand(st.resolve);
  if (band === ai.band) return;
  ai.band = band;
  if (band === 'bargaining' && !ai.hailed && !ai.demanding && playerNear(ctx, live, U.TARGET_RANGE)) {
    ai.hailed = true;
    say(ctx, live, 'Terms. Name them.');
    ctx.emit('hailOpened', { ship: live, intents: intentsFor(ctx, live), line: 'They are breaking.' });
  } else if (band === 'capitulate') {
    capitulate(ctx, live);
  }
}

function intentsFor(ctx, live) {
  const st = live.state;
  const intents = [];
  if (st.cargo.length > 0) intents.push('demandCargo');
  intents.push('demandRansom');
  if (cargoValue(st.cargo, ctx.world.prices) > 0) intents.push('acceptTribute');
  // Named-ace respect: a feared pilot can ask a Named Gun to stand down.
  if ((live.record?.role ?? live.role) === 'ace' && ctx.world.fear >= 15) intents.push('respect');
  intents.push('letGo', 'keepFiring');
  return intents;
}

/**
 * Demand-hail intents (wave 30): the pirate's opening offer to the player.
 * 'showTeeth' — the hidden-mounts Q-ship bluff — exists only once the player
 * owns concealed mounts (ctx.world.concealedMounts, worker-B contract).
 */
function demandIntentsFor(ctx, live) {
  const intents = ['payTribute'];
  if (ctx.world.concealedMounts === true) intents.push('showTeeth');
  intents.push('refuseFight');
  return intents;
}

function jettison(ctx, live, crewPods) {
  const st = live.state;
  const pos = live.object.position;
  for (const entry of st.cargo) {
    _v1.set(pos.x + (Math.random() - 0.5) * 8, pos.y + (Math.random() - 0.5) * 8, pos.z + (Math.random() - 0.5) * 8);
    spawnPod(ctx, [{ commodity: entry.commodity, units: entry.units }], _v1);
  }
  st.cargo.length = 0;
  if (crewPods) {
    for (let k = 0; k < 2; k++) {
      _v1.set(pos.x + (Math.random() - 0.5) * 6, pos.y + (Math.random() - 0.5) * 6, pos.z + (Math.random() - 0.5) * 6);
      spawnPod(ctx, [], _v1); // flavor: crew escape pods
    }
  }
}

function capitulate(ctx, live) {
  const st = live.state;
  const ai = live.ai;
  if (ai.surrenderDone) return;
  ai.surrenderDone = true;
  st.surrendered = true;
  ai.phase = null;
  ai.intent = false;
  ai.target = null;

  // §7.5: critical hull → crew pods; intact cargo → jettison; pirates/aces run.
  let outcome;
  if (st.hull / st.hullMax < 0.4) outcome = 'crewPods';
  else if (st.cargo.length > 0) outcome = 'jettison';
  else if (ai.role === 'pirate' || ai.role === 'ace') outcome = 'flee';
  else outcome = 'cutEngines';

  const glow = live.object.userData.glow;
  if (outcome === 'jettison' || outcome === 'crewPods') jettison(ctx, live, outcome === 'crewPods');
  if (outcome === 'flee') {
    ai.mode = 'flee';
    stampWakeSite(live);
    say(ctx, live, 'Breaking off.');
  } else {
    ai.mode = 'drift';
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    ai.driftVel.copy(_fwd).multiplyScalar(8); // dead-stick drift
    glow.visible = false; // engines cut
    say(ctx, live, outcome === 'crewPods' ? 'Abandoning ship.' : outcome === 'jettison' ? 'Cargo loose.' : 'We yield.');
  }
  bumpFear(ctx, ECON.fear.capitulation); // witnessed capitulation +2
  ctx.emit('npcSurrendered', { ship: live, outcome });
}

// ---------- movement modes ----------
function updateRoute(ctx, live, dt, now) {
  const ai = live.ai;
  const cls = SHIP_CLASSES[live.state.classKey];
  const cap = speedCap(live);
  const glow = live.object.userData.glow;
  const wp = ai.waypoints[ai.wp];
  let speed = cap * 0.85;
  _aim.copy(wp);
  if (ai.band === 'bargaining') {
    speed = cap * 0.12; // holding, waiting on the hail
    glow.scale.setScalar(0.8);
  } else if (ai.band === 'shaken') {
    // wider evasion + power waver (§7.3)
    _v2.subVectors(wp, live.object.position).normalize();
    _v3.crossVectors(_v2, UP).normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.1 + ai.weaveSeed) * 40);
    speed = cap * (0.85 + 0.15 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(1 + 0.45 * Math.sin(now * 8 + ai.weaveSeed));
  } else {
    glow.scale.setScalar(1);
  }
  const dist = steer(live.object, _aim, speed, cls.turn, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function updateLoiter(live, dt) {
  const ai = live.ai;
  const cls = SHIP_CLASSES[live.state.classKey];
  const dist = steer(live.object, ai.waypoints[ai.wp], speedCap(live) * 0.5, cls.turn, dt);
  if (dist < 25) ai.wp = (ai.wp + 1) % ai.waypoints.length;
}

function breakOff(ai) {
  ai.target = null;
  ai.phase = null;
  ai.intent = false;
}

function setTarget(ai, target) {
  ai.target = target;
  ai.phase = null;
  ai.intent = false;
}

function engageTarget(ctx, live, dt, now, targetPos) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const glow = live.object.userData.glow;
  if (!ai.phase) {
    ai.phase = 'telegraph';
    ai.phaseStart = now;
    ai.commSent = false;
  }
  ai.intent = ai.target === 'player';
  const dist = live.object.position.distanceTo(targetPos);
  const cap = speedCap(live);
  let speed = cap;
  _aim.copy(targetPos);

  const shaken = ai.band === 'shaken' || (ai.band === 'bargaining' && ai.hailed);
  if ((ai.band === 'bargaining' && !ai.hailed) || ai.demanding) {
    // mid-offer / demand hail open (wave 30): hold position, weapons cold
    speed = cap * 0.15;
    glow.scale.setScalar(0.7);
  } else if (shaken) {
    // wider evasion + visible power waver (§7.3)
    _v2.subVectors(targetPos, live.object.position).normalize();
    _v3.crossVectors(_v2, UP).normalize();
    _aim.addScaledVector(_v3, Math.sin(now * 2.2 + ai.weaveSeed) * 70).addScaledVector(UP, Math.cos(now * 1.7 + ai.weaveSeed) * 35);
    speed = cap * (0.8 + 0.2 * Math.sin(now * 5 + ai.weaveSeed));
    glow.scale.setScalar(1 + 0.5 * Math.sin(now * 9 + ai.weaveSeed));
  } else {
    // defiant: aggressive press into weapon-exchange range
    speed = dist > 220 ? cap : cap * 0.6;
    if (ai.phase !== 'telegraph') glow.scale.setScalar(1.3);
  }
  steer(live.object, _aim, speed, cls.turn, dt);

  if (ai.phase === 'telegraph') {
    if (ai.demanding) {
      ai.phaseStart = now; // demand hold: telegraph stays frozen, weapons cold
      return;
    }
    if (!ai.commSent) {
      ai.commSent = true;
      say(ctx, live, ai.role === 'ace' ? 'Run if you like.' : 'Heave to. Cargo or hull.');
    }
    glow.scale.setScalar(Math.max(0.3, 1 + 0.7 * Math.sin(now * 14))); // flashing warning
    if (now - ai.phaseStart >= TELEGRAPH_SECONDS) ai.phase = 'attack';
    return;
  }
  if (ai.band === 'bargaining' || ai.demanding) return; // no fire while talking
  const interval = ai.acePhase === 3 && ai.mode === 'duel' ? ACE_FURY_INTERVAL : shaken ? NPC_FIRE_INTERVAL * 1.5 : NPC_FIRE_INTERVAL;
  if (now >= ai.fireAt && dist < WEAPONS.cannon.range && facingDot(live.object, targetPos) > FIRE_FACE_DOT) {
    ai.fireAt = now + interval;
    ctx.emit('npcFire', { ship: live, weapon: 'cannon' });
  }
}

function updateHunt(ctx, live, dt, now) {
  const ai = live.ai;
  const station = ctx.config.world.stationPosition;

  // Validate current target.
  let targetPos = null;
  if (ai.target === 'player') {
    if (ctx.ship.object && !ctx.flags.docked) targetPos = ctx.ship.object.position;
    else breakOff(ai);
  } else if (ai.target) {
    const t = ai.target;
    if (t.state.destroyed || t.state.disabled || t.state.surrendered || !ctx.ships.includes(t)) breakOff(ai);
    else targetPos = t.object.position;
  }

  if (targetPos) {
    const inLaw =
      targetPos.distanceTo(station) < LAW_ZONE_RADIUS ||
      live.object.position.distanceTo(station) < LAW_ZONE_RADIUS;
    if (inLaw) breakOff(ai); // station law zone: hostile intent never develops
    else if (live.object.position.distanceTo(targetPos) >= U.ENCOUNTER_BUBBLE) breakOff(ai);
  }

  // Acquire: player first, else nearest live trader inside the bubble.
  if (!ai.target) {
    const pObj = ctx.ship.object;
    if (
      pObj &&
      !ctx.flags.docked &&
      pObj.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
      live.object.position.distanceTo(station) >= LAW_ZONE_RADIUS &&
      live.object.position.distanceTo(pObj.position) < U.ENCOUNTER_BUBBLE
    ) {
      setTarget(ai, 'player');
      targetPos = pObj.position;
    } else {
      let best = null;
      let bestD = U.ENCOUNTER_BUBBLE;
      for (const other of ctx.ships) {
        if (other === live || other.role !== 'trader') continue;
        if (other.state.destroyed || other.state.disabled || other.state.surrendered) continue;
        if (other.object.position.distanceTo(station) < LAW_ZONE_RADIUS) continue;
        const d = live.object.position.distanceTo(other.object.position);
        if (d < bestD) {
          best = other;
          bestD = d;
        }
      }
      if (best) {
        setTarget(ai, best);
        targetPos = best.object.position;
      }
    }
  }

  if (!targetPos) {
    ai.phase = null;
    ai.intent = false;
    updateLoiter(live, dt);
    return;
  }

  // Demand hail (wave 30, §29 Q-ship beat): a hunting pirate that closes on
  // the player opens ONE demand hail before pressing the attack — tribute,
  // hidden-mount bluff, or refuse-and-fight, resolved in hail.js. Guards:
  // once per instantiation (ai.demandSent), per-record cooldown across
  // re-instantiation (record.demandedAt), never while docked or inside the
  // law zone (both already broken off above), never during jump grace, and
  // only inside U.TARGET_RANGE. The demand amount is rolled ONCE here so the
  // offer is stable (hail.js ransom pattern): 10× the tribute rate on the
  // player's cargo value, floored at HIDDEN_MOUNTS.demandMin.
  if (
    ai.target === 'player' &&
    ai.role === 'pirate' &&
    !ai.demandSent &&
    now >= (ctx.world.jumpGraceUntil ?? 0) &&
    now - (live.record?.demandedAt ?? -Infinity) >= DEMAND_COOLDOWN &&
    live.object.position.distanceTo(targetPos) < U.TARGET_RANGE
  ) {
    ai.demandSent = true; // reset never — one demand per instantiation
    ai.demanding = true;
    ai.demandOutcome = null;
    ai.demandPeaceAt = now; // a player hit stamped after this voids the parley
    if (live.record) live.record.demandedAt = now;
    const demand = Math.max(
      HIDDEN_MOUNTS.demandMin,
      Math.round(ECON.tributeRate * cargoValue(ctx.cargo, ctx.world.prices) * 10),
    );
    ctx.emit('hailOpened', { ship: live, intents: demandIntentsFor(ctx, live), line: 'Your cargo or your hull.', demand });
  }

  engageTarget(ctx, live, dt, now, targetPos);
}

function updateDuel(ctx, live, dt, now) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const pObj = ctx.ship.object;
  if (!pObj || ctx.flags.docked) {
    ai.intent = false;
    updateLoiter(live, dt);
    return;
  }
  const playerPos = pObj.position;
  const station = ctx.config.world.stationPosition;
  const dist = live.object.position.distanceTo(playerPos);

  // Wait outside the law zone; approach from beyond the bubble without intent.
  if (playerPos.distanceTo(station) < LAW_ZONE_RADIUS || live.object.position.distanceTo(station) < LAW_ZONE_RADIUS) {
    ai.intent = false;
    ai.phase = null;
    updateLoiter(live, dt);
    return;
  }
  if (dist > U.ENCOUNTER_BUBBLE) {
    ai.intent = false;
    ai.phase = null;
    steer(live.object, playerPos, speedCap(live), cls.turn, dt);
    return;
  }

  // Ace phase from own hull fraction (§6.7): helix → feint at 2/3 → fury at 1/3.
  const hullFrac = st.hull / st.hullMax;
  const phase = hullFrac > 2 / 3 ? 1 : hullFrac > 1 / 3 ? 2 : 3;
  if (phase !== ai.acePhase) {
    ai.acePhase = phase;
    if (phase === 2) say(ctx, live, 'Not bad.');
    if (phase === 3) say(ctx, live, 'Enough.');
  }

  ai.target = 'player';
  if (!ai.phase) {
    ai.phase = 'telegraph';
    ai.phaseStart = now;
    ai.commSent = false;
  }
  ai.intent = true;
  const glow = live.object.userData.glow;
  const cap = speedCap(live);
  const burning = !st.engineOut;
  let speed = cap;

  if (ai.band === 'bargaining') {
    speed = cap * 0.15;
    glow.scale.setScalar(0.7);
    _aim.copy(playerPos);
    steer(live.object, _aim, speed, cls.turn, dt);
    return; // no fire while bargaining (capitulation handled globally)
  }

  if (ai.acePhase === 1) {
    // Helix around the player.
    const a = now * 0.9 + ai.weaveSeed;
    _aim.set(
      playerPos.x + Math.cos(a) * 130,
      playerPos.y + Math.sin(now * 2.3 + ai.weaveSeed) * 40,
      playerPos.z + Math.sin(a) * 130,
    );
  } else if (ai.acePhase === 2) {
    // Feint: rush in, then break away on a ~6 s cycle.
    const cycle = (now + ai.weaveSeed) % 6;
    if (cycle < 3) {
      _aim.copy(playerPos);
      speed = burning ? cls.burn : cap;
    } else {
      _v2.subVectors(live.object.position, playerPos).normalize();
      _aim.copy(live.object.position).addScaledVector(_v2, 200);
      speed = cap;
    }
  } else {
    // Fury: direct press.
    _aim.copy(playerPos);
    speed = burning ? cls.burn : cap;
  }
  steer(live.object, _aim, speed, cls.turn, dt);

  if (ai.phase === 'telegraph') {
    if (!ai.commSent) {
      ai.commSent = true;
      // Recognition: a Named Gun acknowledges a known/hunted pilot. Priority:
      // aspirant (wave 10, a new name defines itself against the player) >
      // Sister Vane's first-ever encounter > Illyx lineage/rematch > fear
      // recognition > the generic line.
      let line = 'Run if you like.';
      if (!ai.recognitionSent) {
        ai.recognitionSent = true;
        const recName = live.record?.name;
        if (live.record?.aspirant) {
          // Aspirant cycle (wave 10): no mantle, no lineage — the new name
          // takes its measure from the pilot who broke the old lines.
          line = 'No mantle. No lineage. I take my name from yours.';
        } else if (recName === 'Sister Vane') {
          // Lineage generation: each fallen Vane is succeeded by the next.
          const gen = ctx.world.aceRivalry?.hunterGeneration ?? 0;
          line = gen >= 2
            ? 'The third Vane does not run, legend.'
            : gen === 1
              ? 'You killed her. The name you will have to kill again.'
              : 'The Ledger bought my wing for you.';
        } else if (recName === 'Carver Illyx' && (ctx.world.aceRivalry?.defeats ?? 0) > 0) {
          // Freehold lineage: the successor acknowledges the name he carries
          // before any rematch talk.
          line = (ctx.world.aceRivalry?.illyxGeneration ?? 0) >= 1
            ? 'I fly his wing now. You know how this ends.'
            : (live.record?.rematchCount ?? 0) < 2 ? 'Again.' : 'Again. Again.';
        } else if (ctx.world.fear >= 25) {
          line = 'They pay me to end you. Nothing personal, legend.';
        } else if (ctx.world.fear >= 15) {
          line = 'I know that hull. The whisper runs ahead of you.';
        }
      }
      say(ctx, live, line);
    }
    glow.scale.setScalar(Math.max(0.3, 1 + 0.7 * Math.sin(now * 14)));
    if (now - ai.phaseStart >= TELEGRAPH_SECONDS) ai.phase = 'attack';
    return;
  }
  glow.scale.setScalar(1.3);
  const interval = ai.acePhase === 3 ? ACE_FURY_INTERVAL : NPC_FIRE_INTERVAL;
  if (now >= ai.fireAt && dist < WEAPONS.cannon.range && facingDot(live.object, playerPos) > FIRE_FACE_DOT) {
    ai.fireAt = now + interval;
    ctx.emit('npcFire', { ship: live, weapon: 'cannon' });
  }
}

function updateFlee(ctx, live, dt) {
  const ai = live.ai;
  const st = live.state;
  const cls = SHIP_CLASSES[st.classKey];
  const pObj = ctx.ship.object;
  if (pObj) {
    _v2.subVectors(live.object.position, pObj.position).normalize();
    _aim.copy(live.object.position).addScaledVector(_v2, 300);
  } else {
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    _aim.copy(live.object.position).addScaledVector(_fwd, 300);
  }
  steer(live.object, _aim, st.engineOut ? cls.cruise * 0.3 : cls.burn, cls.turn, dt);
  live.object.userData.glow.scale.setScalar(1.6);
  // traffic.js despawns at DEINSTANTIATE_RANGE — we just run.
}

function updateDrift(live, dt) {
  // Surrendered, engines cut: drift and gentle tumble, glow dark.
  live.object.position.addScaledVector(live.ai.driftVel, dt);
  live.object.rotation.x += dt * 0.12;
  live.object.rotation.z += dt * 0.08;
}

function updateDisabled(live, dt, now) {
  const ai = live.ai;
  if (!ai.disabledInit) {
    ai.disabledInit = true;
    _fwd.copy(NEG_Z).applyQuaternion(live.object.quaternion);
    ai.driftVel.copy(_fwd).multiplyScalar(6);
  }
  live.object.position.addScaledVector(ai.driftVel, dt);
  live.object.rotation.x += dt * 0.35; // slow tumble
  live.object.rotation.y += dt * 0.22;
  // dim flickering lights, no fire
  live.object.userData.glow.visible = (now * 6 + ai.weaveSeed) % 1 < 0.18;
}

function handleDestroyed(ctx, live, flashes) {
  // combat.js normally emits npcDestroyed on the killing blow (it runs after
  // us); emit only if nobody else has, so the event fires exactly once.
  let seen = false;
  for (const e of ctx.events) {
    if (e.type === 'npcDestroyed' && e.ship === live) {
      seen = true;
      break;
    }
  }
  if (!seen) {
    for (const e of ctx.lastEvents) {
      if (e.type === 'npcDestroyed' && e.ship === live) {
        seen = true;
        break;
      }
    }
  }
  if (!seen) ctx.emit('npcDestroyed', { ship: live });

  // §7.7 fear consequences of the kill.
  if (live.state.surrendered) bumpFear(ctx, ECON.fear.killedSurrendered);
  else if (live.role === 'ace') bumpFear(ctx, ECON.fear.aceDefeated);

  // Brief debris flash; world.js stages the lasting aftermath, we don't.
  flashGeo ??= new THREE.SphereGeometry(1, 10, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffc080,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(flashGeo, mat);
  mesh.position.copy(live.object.position);
  ctx.scene.add(mesh);
  flashes.push({ mesh, age: 0 });

  removeLiveShip(ctx, live);
}

// ---------- system ----------
export function initNpc(ctx) {
  const flashes = [];

  return {
    update(dt) {
      const now = ctx.world.time;
      const playerObj = ctx.ship.object;
      let combat = false;

      for (let i = ctx.ships.length - 1; i >= 0; i--) {
        const live = ctx.ships[i];
        const st = live.state;
        if (st.destroyed) {
          // traffic.js splices destroyed ships from the list on its own
          // schedule, so guard against processing the same wreck twice.
          if (!live.ai.deathHandled) {
            live.ai.deathHandled = true;
            handleDestroyed(ctx, live, flashes);
          }
          continue;
        }
        tickShipState(st, now, dt);
        const ai = live.ai;
        // Wave 27: grown Beautiful-Ones ships breathe/sway. Driven BEFORE the
        // disabled branch — a surrendered/engine-out living hull still
        // breathes (it is alive, not destroyed). ctx.elapsed is the
        // visual-animation clock (ship.js/gate.js/station.js convention;
        // `now` is the game-logic clock). Zero-alloc; no-op under
        // reducedMotion.
        const op = live.object.userData.organicParts;
        if (op) animateOrganic(op, ctx.elapsed, ctx.settings.reducedMotion);
        // Wave 30 demand-hail upkeep: the parley dies with the hail target
        // (disabled here; destroyed/despawned discard the ai outright, and
        // hail.js's own timeout closes the card on those same conditions),
        // and opening fire on the demanding pirate voids the offer — any hit
        // stamped after the demand opened ends the hold and closes the card.
        if (ai.demanding) {
          if (st.disabled) {
            ai.demanding = false;
          } else if (st.lastHitAt > ai.demandPeaceAt) {
            ai.demanding = false;
            ctx.emit('hailClosed', {}); // card closes; the fight is on
          }
        }
        if (st.disabled) {
          updateDisabled(live, dt, now);
          continue;
        }
        ai.t += dt;
        if (now >= ai.resolveAt) {
          ai.resolveAt = now + RESOLVE_INTERVAL;
          updateResolve(ctx, live, now);
        }
        switch (ai.mode) {
          case 'hunt':
            updateHunt(ctx, live, dt, now);
            break;
          case 'duel':
            updateDuel(ctx, live, dt, now);
            break;
          case 'flee':
            updateFlee(ctx, live, dt);
            break;
          case 'drift':
            updateDrift(live, dt);
            break;
          case 'route':
            updateRoute(ctx, live, dt, now);
            break;
          default:
            updateLoiter(live, dt);
        }
        if (ai.intent && playerObj && live.object.position.distanceTo(playerObj.position) < U.ENCOUNTER_BUBBLE) {
          combat = true;
        }
      }
      ctx.flags.combat = combat;

      // Backstop: traffic.js runs before us each frame and may splice a wreck
      // out of ctx.ships before our loop sees it. Catch combat.js's
      // npcDestroyed event so the flash/fear bookkeeping still happens once.
      for (const e of ctx.lastEvents) {
        if (e.type === 'npcDestroyed' && e.ship && e.ship.ai && !e.ship.ai.deathHandled) {
          e.ship.ai.deathHandled = true;
          handleDestroyed(ctx, e.ship, flashes); // emit is skipped: event already seen
        }
      }

      // Demand-hail release (wave 30, cross-system via ctx.lastEvents):
      // hail.js resolves demand intents and stamps live.ai.demandOutcome —
      // 'failed'/'refused' clear ai.demanding themselves and press the
      // attack; 'paid'/'bluffed' are already fleeing. On 'hailClosed',
      // release any OUTCOME-STAMPED hold still standing (outcome-gated so a
      // stale hailClosed never steals a demand that opened this frame). On
      // a 'hailOpened' for ANOTHER ship the single hail card was stolen —
      // release the hold so the pirate stops waiting on a dead parley.
      for (const e of ctx.lastEvents) {
        if (e.type === 'hailClosed') {
          for (const s of ctx.ships) {
            if (s.ai && s.ai.demanding && s.ai.demandOutcome) s.ai.demanding = false;
          }
        } else if (e.type === 'hailOpened') {
          for (const s of ctx.ships) {
            if (s.ai && s.ai.demanding && s !== e.ship) s.ai.demanding = false;
          }
        }
      }

      // Target availability: drop a stale selected live ship (asteroid refs
      // have no .record/.state and are left alone).
      const cur = ctx.targets.current;
      if (cur && cur.record && cur.state && (cur.state.destroyed || !ctx.ships.includes(cur))) {
        ctx.targets.current = null;
      }

      // Debris flashes.
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.age += dt;
        const k = f.age / FLASH_LIFE;
        if (k >= 1) {
          ctx.scene.remove(f.mesh);
          f.mesh.material.dispose();
          flashes.splice(i, 1);
          continue;
        }
        f.mesh.scale.setScalar(1 + k * 26);
        f.mesh.material.opacity = 0.9 * (1 - k);
      }
    },
  };
}
