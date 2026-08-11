import * as THREE from 'three';
import '../ui/screens.css';
import { U, COMMODITIES, ECON, FACTIONS, EPICS, RANK_LADDER, rankFor, createShipState, SHIP_CLASSES, HERMIT, FACTION_SERVICES, FACTION_COMP, HIDDEN_MOUNTS } from '../game/state.js';
import { AUTHORED_SYSTEMS } from '../game/authored-systems.js'; // wave 24: authored-six guard (contacts.js pattern)
import { contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine, keeperLedgerLine, chartedMarkNotes, KEEPER_COMP_TRUST, GENERATED_KNOWN_TRUST } from '../game/contacts.js';
import { portraitFor, portraitVariant } from '../game/portraits.js'; // wave 41: faction character portraits
import { spawnPod } from '../game/pods.js';
import { epicEffects } from '../game/epics.js';
import { styleFor } from '../game/faction-style.js'; // wave 37: per-faction station schemes
import { detailBuilder, rng, box, cyl, sphere, hemi, torus, cone, ribBands, windowRow, portholeRing, truss, railing, panelPatches, pipeRun, antenna, ladder, radiatorPanel, lampString, crate } from './station-detail.js'; // wave 43: merged-geometry detail kit
import { isBeautiful, ORGANIC, organicMaterials, makePetalGeometry, makeStarfishArmGeometry, makeWebGeometry, makeOrganicVeinTexture, makeOrganicGlowTexture, tagSway, tagBreath, tagPulse, collectOrganic, animateOrganic } from './organic.js'; // wave 27: Beautiful Ones grown station

/**
 * Station — identity driven by SYSTEMS[ctx.world.currentSystem].station
 * (doc §12, §18.2). Freehold Landing keeps the frontier rust/sodium look;
 * Veridian Spire is clean white/cyan corporate (§18.2) with the same service
 * layout. On 'systemLoaded' the mesh is torn down and rebuilt with the new
 * palette/name/position and ctx.station is updated in place.
 *
 * Owns: ctx.flags.docked, ctx.station = { position, name, inZone } (HUD reads
 * it for the dock prompt), ctx.world.jobs (created here), ctx.world.scanner.
 * Mutates on purchase only: ctx.world.credits, ctx.cargo, ctx.cargoCapacity,
 * ctx.bio (feed/tend — agreed with bio.js), ctx.player (repair), ctx.world
 * reputation on job completion. Emits 'docked' / 'undocked' (+ 'commLine' for
 * job completions in space). Never emits for the dock prompt — hud.js reads
 * ctx.station.inZone itself.
 *
 * Restricted components (§12/§16): Freehold Landing refuses unless fear ≥
 * ECON.fear.tributeOpensAt or rep.freehold < -25. A system whose def flies
 * `tradesRestricted: true` (Veridian Spire, Redmarch) ALWAYS trades them —
 * patent stock is their commodity (§16), flavor noted.
 *
 * Jobs: ctx.world.jobs is created once here (ace bounty, patrol, haul), then
 * the board syncs pirate bounties on render — up to PIRATE_BOUNTY_CAP live,
 * priced pirates of the CURRENT system, posted only at their home station.
 * Every bounty claim needs a player-caused incident (Witness Rule §8.7).
 *
 * Haul job (§10.1): cross-system. Accept at either station, buy 5 Provisions,
 * deliver at the OTHER system's station for 140% of the stamped origin buy
 * cost. Origin system/price are JSON-plain fields on the job entry.
 *
 * UI (§12.1: no more than two menu levels): full-screen dim + panel, world
 * keeps ticking behind. Keyboard: 1-9 service select, digit hotkeys inside
 * services, Esc/B launch (Esc backs out of a service first). Mouse: panel has
 * pointer-events auto. update() performs zero allocations.
 *
 * Faction epics (wave 6): the 'epics' service ("Standing") surfaces EPICS
 * progress for this station's faction, and epicEffects(ctx, faction)
 * multiplies trade prices, refit totals, restricted-component sales, and job
 * payouts at transaction time (all read live; nothing cached per frame).
 *
 * Wave 26: generated-system depth, part 4. (1) Generated-system dockmasters
 * hold a favor economy: every finished contract banks +1 favor once the
 * post-bump trust reads >= GENERATED_KNOWN_TRUST (AUTHORED_SYSTEMS-guarded
 * by id, so the authored six stay byte-identical), and their people card
 * gains the keeper-pattern 'Call in a favor' button — a spent marker comps
 * the yard session-scoped and speaks the faction's FACTION_COMP line, shown
 * verbatim as the repair screen's note (ui.compNote, reset in undock()).
 * (2) Ferry/haul quotes become agreements: acceptJob stamps job.payQuoted
 * (JSON-plain, computed with the DESTINATION system's jobPayFor) and the
 * payout reads the snapshot with a jobPay fallback for old saves, so a
 * mid-contract standing shift never moves an agreed price. Bounty, patrol,
 * salvage, and recovery payouts are untouched.
 *
 * Wave 27: Beautiful Ones bloom station. When isBeautiful(def.faction) the
 * mesh is built by buildBeautifulStation — a flower–starfish hybrid sculpted
 * from organic.js primitives. update() drives the tagged breath/sway parts
 * via animateOrganic (zero-allocation; frozen under reducedMotion) and the
 * per-build tagPulse materials. Cached shared organic materials/textures
 * (including the module-cached bloom vein texture) are never disposed or
 * pulse-tagged (teardownMesh skips userData.shared); per-build materials
 * dispose exactly as before. Every other faction's station path is
 * byte-identical.
 *
 * Wave 33 (bloom station v2, toward BeautifulOnes_Station_Example.png): the
 * opaque green flesh becomes GLASS. The body bell and five starfish arms
 * share a translucent lagoon-teal MeshPhysicalMaterial (transparent, no
 * depth write, clearcoat sheen) with teal/amber veins glowing from WITHIN
 * the emissiveMap — so each arm reads as a veined petal of sea-glass with a
 * warm golden 'beautiful-hearth' chamber lit inside it. A circular landing
 * pad ('beautiful-pad') is embedded on the dorsal mid-bulge of every arm —
 * dark disc, twin gilt rings, mint rim lamps on the pulsing lightMat, amber
 * center — and a glowing teal 'beautiful-node' orb sits at every arm root.
 * The orchid crown gains a third whorl: five steep, nearly-closed bud
 * petals inside the outer/inner sevens (19 petals total) so the ringGroup
 * reads as a tall layered bud. Kept from v1: the breathing membrane webs,
 * chandelier clusters, throat pearl beacon + glow, mint halo, spore motes,
 * the dual-axis Lissajous arm sway, every tag convention, and the exact
 * return record update() consumes.
 *
 * Wave 38 (FactionVisualUpdatePlan Phase 3): buildStationMesh dispatches on
 * def.faction to per-faction builders (STATION_BUILDERS) for the eight
 * factions with reference art; the placeholder stays the fallback for
 * independent/hollow/unknown. Every builder returns the placeholder's exact
 * record shape and disposes through teardownMesh unchanged.
 */

const RING_SPIN = 0.05; // rad/s
const DOCK_KEY_SERVICES = ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics'];

const RESTRICTED_REP_GATE = -25; // a burned Compact name opens the locker

const FEED_COST = 60;
const TEND_COST = 25;
const ROUND_COST = 5;
// Itemized yard pricing, UU per integrity point restored (§12 repair bays).
// Hull is structural and dear; screens are cheap laminate; shell and engine
// sit between. Cost scales strictly with damage taken, per system.
const REPAIR_RATES = { hull: 0.9, screen: 0.3, shell: 0.5, engine: 0.6 };
const CARGO_UPGRADE_COST = 600;
const CARGO_UPGRADE_STEP = 10;
const CARGO_UPGRADE_MAX = 2;
const SCANNER_COST = 400;
const SCANNER2_COST = 900;

const PATROL_REWARD = 300;
const PATROL_REP = 5;
const PATROL_NEED = 2;
const HAUL_UNITS = 5;
const HAUL_MARGIN = 1.4;
const FERRY_UNITS = 4; // consignment is fronted on accept (§12.x)
const FERRY_REWARD = 350;
const RECOVERY_REWARD = 300;
const FIXER_CUT_TRUST = 30; // fixer trust that earns the restricted-sale markup
const FIXER_MARKUP = 1.10; // × on restrictedComponents sales the fixer brokers
const FIXER_TRUST_PER_SALE = 2;
const DOCKMASTER_TRUST_PER_JOB = 5;
// Wave 11: keeper trust that comps a pilot at a deep-rim dock — the hermit
// scarcity markup is waived and the keeper card shows the comp note.
// Wave 18: the constant lives in contacts.js (KEEPER_COMP_TRUST) — the
// recognition/vouch/ledger/chart-mark tiers already key on it there.
const DEFAULT_ACE_NAME = 'Carver Illyx';
const DEFAULT_ACE_BOUNTY = 2500;
const PIRATE_BOUNTY_CAP = 2; // max pirate bounty cards per system's board
const PIRATE_BOUNTY_FALLBACK = 400; // UU, until world.js prices every pirate

const _pulse = new THREE.Color();
const _podPos = new THREE.Vector3(); // scratch for recovery-job pod spawns

// ------------------------------------------------------------- palette ----

/**
 * Per-FACTION material schemes (wave 37). Pre-wave-37 only Freehold and
 * Veridian had authored schemes and everything else fell back to a neutral
 * gray tinted by def.station.palette. Now every scheme derives from the
 * faction's FACTION_STYLE record (faction-style.js — colors sampled from the
 * Docs/FactionExamples reference art): hull/hullDark structure, style.glow
 * running lights, style.beacon, and style.patch for the habitat-module
 * patchwork (freehold's donated red/cream/blue panels, lamplighter's
 * yellow/cobalt…). def.station.palette is no longer consulted here.
 */
function _dim(hex, f) {
  const r = Math.round(((hex >> 16) & 255) * f);
  const g = Math.round(((hex >> 8) & 255) * f);
  const b = Math.round((hex & 255) * f);
  return (r << 16) | (g << 8) | b;
}
function _rgba(hex, a) {
  return `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
}

function schemeFor(def) {
  const st = styleFor(def.faction);
  return {
    hull: st.hull, hullEmissive: _dim(st.hull, 0.15), hullMetalness: st.metalness, hullRoughness: st.roughness,
    dark: st.hullDark, darkEmissive: _dim(st.hullDark, 0.2), darkMetalness: Math.min(st.metalness + 0.05, 1), darkRoughness: Math.min(st.roughness + 0.1, 1),
    light: st.glow, beacon: st.beacon, accent: st.accent,
    patch: st.patch,
    glowInner: _rgba(st.glow, 0.8), glowOuter: _rgba(st.glow, 0),
    beaconGlowInner: _rgba(st.beacon, 0.95), beaconGlowOuter: _rgba(st.glow, 0),
  };
}

// ---------------------------------------------------------------- mesh ----

/** Additive radial-gradient sprite texture (glow halos, beacon). */
function makeGlowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildStationMesh(ctx, systemId, def) {
  if (isBeautiful(def.faction)) return buildBeautifulStation(ctx, systemId, def); // wave 27
  const builder = Object.hasOwn(STATION_BUILDERS, def.faction) ? STATION_BUILDERS[def.faction] : null; // wave 38: per-faction sculpts
  if (builder) return builder(ctx, systemId, def);
  return buildPlaceholderStation(ctx, systemId, def);
}

function buildPlaceholderStation(ctx, systemId, def) {
  const scheme = schemeFor(def);
  const group = new THREE.Group();
  group.position.fromArray(def.station.position);

  const rustMat = new THREE.MeshStandardMaterial({
    color: scheme.hull, metalness: scheme.hullMetalness,
    roughness: scheme.hullRoughness, emissive: scheme.hullEmissive,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: scheme.dark, metalness: scheme.darkMetalness,
    roughness: scheme.darkRoughness, emissive: scheme.darkEmissive,
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: scheme.light }); // running lights
  const beaconMat = new THREE.MeshBasicMaterial({ color: scheme.beacon });
  // Wave 37 patchwork: one per-build material per patch color; habitat
  // modules and drum bands cycle them (freehold's mismatched donated panels
  // are the archetype). Disposed with the mesh like rustMat/darkMat.
  const patchMats = scheme.patch.map((hex) => new THREE.MeshStandardMaterial({
    color: hex, metalness: scheme.hullMetalness,
    roughness: scheme.hullRoughness, emissive: _dim(hex, 0.12),
  }));
  const accentMat = new THREE.MeshBasicMaterial({ color: scheme.accent });

  // Central spindle.
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.4, 84, 12), rustMat);
  group.add(spindle);
  const dockingArm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 22), darkMat);
  dockingArm.position.set(0, -6, 14);
  group.add(dockingArm);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), beaconMat);
  beacon.position.set(0, 45, 0);
  group.add(beacon);

  // Rotating habitat ring (spins about the spindle axis). Habitat modules
  // cycle the faction patch palette; an accent collar ring carries the
  // faction identity color.
  const ringGroup = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(30, 2.6, 10, 56), rustMat);
  ring.rotation.x = Math.PI / 2;
  ringGroup.add(ring);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(30, 0.5, 6, 56), accentMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.4;
  ringGroup.add(collar);
  const habGeo = new THREE.BoxGeometry(9, 5, 5.5);
  const lightGeo = new THREE.SphereGeometry(0.85, 8, 6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const hab = new THREE.Mesh(habGeo, patchMats[i % patchMats.length]);
    hab.position.set(Math.cos(a) * 30, 0, Math.sin(a) * 30);
    hab.rotation.y = -a;
    ringGroup.add(hab);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const lamp = new THREE.Mesh(lightGeo, lightMat);
    lamp.position.set(Math.cos(a) * 30, 2.8, Math.sin(a) * 30);
    ringGroup.add(lamp);
  }
  group.add(ringGroup);

  // Habitat drums on the spindle with window bands alternating faction glow
  // and accent.
  const drumGeo = new THREE.CylinderGeometry(6, 6, 13, 14);
  const bandGeo = new THREE.TorusGeometry(6.05, 0.18, 6, 28);
  for (const y of [-19, 15]) {
    const drum = new THREE.Mesh(drumGeo, rustMat);
    drum.position.y = y;
    group.add(drum);
    const band = new THREE.Mesh(bandGeo, y < 0 ? lightMat : accentMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    group.add(band);
  }

  // Approach beacon glow + halo (additive sprites, pulsed in update).
  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(scheme.glowInner, scheme.glowOuter),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(150);
  group.add(glow);
  const beaconGlowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(scheme.beaconGlowInner, scheme.beaconGlowOuter),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8,
  });
  const beaconGlow = new THREE.Sprite(beaconGlowMat);
  beaconGlow.scale.setScalar(30);
  beaconGlow.position.set(0, 45, 0);
  group.add(beaconGlow);

  ctx.scene.add(group);
  return {
    group, ringGroup, lightMat, beaconMat, glowMat, beaconGlowMat,
    lightColor: new THREE.Color(scheme.light),
  };
}

// ----------------------------------------------------- faction sculpts ----
// Wave 38 (FactionVisualUpdatePlan Phase 3): per-faction builders for the
// eight factions with reference art. Same return contract as the
// placeholder; every geometry/material is per-build and disposes through
// teardownMesh exactly as the placeholder's do. No PointLights (the scene
// light census is boot-pinned) and no new animation paths — update() spins
// ringGroup and pulses lightMat/beaconMat/glowMat/beaconGlowMat as always.

/** Shared per-build material set + positioned group for a faction build. */
function factionKit(ctx, def) {
  const scheme = schemeFor(def);
  const st = styleFor(def.faction);
  const group = new THREE.Group();
  group.name = `${def.faction}-station`;
  group.position.fromArray(def.station.position);
  const std = (hex) => new THREE.MeshStandardMaterial({
    color: hex, metalness: st.metalness, roughness: st.roughness, emissive: _dim(hex, 0.14),
  });
  return {
    scheme, group,
    hullMat: std(st.hull), darkMat: std(st.hullDark), trimMat: std(st.trim),
    patchMats: scheme.patch.map((hex) => std(hex)),
    lightMat: new THREE.MeshBasicMaterial({ color: scheme.light }),
    beaconMat: new THREE.MeshBasicMaterial({ color: scheme.beacon }),
    accentMat: new THREE.MeshBasicMaterial({ color: scheme.accent }),
  };
}

/** Mesh shorthand: create, position, yaw, attach. */
function put(parent, geo, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}

/** Mount the group, add the beacon + halo, return the update() record. */
function stationRecord(ctx, kit, ringGroup, beaconY) {
  const { group, scheme } = kit;
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), kit.beaconMat);
  beacon.position.set(0, beaconY, 0);
  group.add(beacon);
  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(scheme.glowInner, scheme.glowOuter),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(150);
  group.add(glow);
  const beaconGlowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(scheme.beaconGlowInner, scheme.beaconGlowOuter),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8,
  });
  const beaconGlow = new THREE.Sprite(beaconGlowMat);
  beaconGlow.scale.setScalar(30);
  beaconGlow.position.set(0, beaconY, 0);
  group.add(beaconGlow);
  ctx.scene.add(group);
  return {
    group, ringGroup,
    lightMat: kit.lightMat, beaconMat: kit.beaconMat, glowMat, beaconGlowMat,
    lightColor: new THREE.Color(scheme.light),
  };
}

/**
 * Freehold Compact — "Freehold Landing", the homestead raft.
 *
 * Wave 43: the first station built as MERGED, vertex-coloured geometry
 * (station-detail.js), generalising the wave-37 D4 ship ruling to stations.
 * ~600 primitive parts land in five merged chunks — hull / glow / glaze on the
 * group and ringHull / ringGlow inside the spinning ringGroup — so the whole
 * sculpt costs 7 geometries and 6 materials, fewer than the 25-part wave-38
 * placeholder it replaces (the wave-39 scene resource budget is pinned).
 *
 * Read from 03-freehold-compact-station.png: a low, wide, deliberately
 * mismatched raft of pressurised drums, spherical tanks and domed habitats
 * bolted onto a shared keel truss, warm brown and weathered cream with barn-red
 * roofs and one or two donated faded-blue modules, a glazed barrel-vault
 * greenhouse on the spine, a lighthouse mast off the +X flank, catwalks and
 * mooring gantries everywhere, and hundreds of small warm-amber windows. The
 * agri carousel hangs beneath and turns.
 *
 * Channel discipline: `glow` carries lit elements ONLY, in near-neutral tints —
 * update() pulses lightMat.color (the faction's warm amber) and that multiplies
 * these vertex colours, so a saturated tint there would square the hue. The
 * greenhouse's grow-light green therefore lives in `glaze`, whose material is
 * white and never animated. Everything structural takes a FACTION_STYLE colour.
 *
 * Envelope: U.DOCK_RANGE is 45, so the solid silhouette stays inside |x|,|z| <=
 * 30 and y in [-24, +29]; the stationRecord beacon owns y = 31.
 */
function buildFreeholdStation(ctx, systemId, def) {
  const scheme = schemeFor(def);
  const st = styleFor(def.faction);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    metalness: st.metalness, roughness: st.roughness,
    emissive: _dim(st.hull, 0.10),
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: scheme.light, vertexColors: true });
  const glazeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  const beaconMat = new THREE.MeshBasicMaterial({ color: scheme.beacon });

  const group = new THREE.Group();
  group.name = 'freehold-station';
  group.position.fromArray(def.station.position);

  const b = detailBuilder();
  const rand = rng(4303);

  // Structure palette. Warm brown carries the mass, cream the panelling, barn
  // red the roofs and the one donated blue module the mismatch — the image is
  // warm-dominant, so blue is used sparingly.
  const BROWN = st.hull;       // 0x6b4f36 warm brown
  const DARK = st.hullDark;    // 0x3a2c1e recessed / truss / seams
  const CREAM = st.trim;       // 0xd8c9a8 weathered panelling
  const RED = st.patch[0];     // 0x9a4436 barn red
  const BLUE = st.patch[2];    // 0x5b7a94 donated faded blue
  // Window tints: near-neutral so the amber pulse keeps its hue.
  const LIT = 0xffffff;
  const LIT_WARM = 0xfff2e2;
  const LIT_DIM = 0xe8dcc8;
  const GROW = 0x35603a; // grow-light green, deliberately dull — a LIGHT colour, not a faction colour

  // ------------------------------------------------------------- keel truss --
  // The shared spine everything is bolted to; visible between the modules.
  truss(b, 'hull', DARK, { ax: -27, ay: -3.4, az: 0, bx: 27, by: -3.4, bz: 0, bays: 12, thickness: 0.34, spread: 1.1 });
  for (const kx of [-16, -5, 7, 18]) {
    truss(b, 'hull', DARK, { ax: kx, ay: -3.4, az: -14, bx: kx, by: -3.4, bz: 14, bays: 5, thickness: 0.26, spread: 0.8 });
  }
  box(b, 'hull', DARK, 54, 0.5, 3.0, { y: -4.6 }); // keel deck plate

  // ------------------------------------------------------------- drum row ----
  // Six pressurised habitat drums lying across the keel, no two alike: warm
  // brown and cream alternate, one barn-red and one donated blue. Each carries
  // rib bands, bolt rings, dense window rows, repair plates and a catwalk.
  const drums = [
    { x: -21, y: 0.5, z: -3, r: 4.6, l: 13, skin: CREAM, cap: BROWN, roof: RED, win: 9 },
    { x: -11, y: -1.5, z: 7, r: 3.5, l: 10, skin: BROWN, cap: CREAM, roof: BROWN, win: 7 },
    { x: -1, y: 1.5, z: -8, r: 5.0, l: 15, skin: BROWN, cap: CREAM, roof: RED, win: 10 },
    { x: 9, y: -0.5, z: 6, r: 4.0, l: 12, skin: CREAM, cap: BROWN, roof: RED, win: 8 },
    { x: 18, y: 1.0, z: -5, r: 3.8, l: 11, skin: CREAM, cap: BROWN, roof: RED, win: 8 },
    { x: 24, y: -1.5, z: 5, r: 3.0, l: 8, skin: BROWN, cap: CREAM, roof: BROWN, win: 6 },
  ];
  drums.forEach((d, i) => {
    b.push(d.x, d.y, d.z, 0, (i % 2 ? 1 : -1) * 0.05, 0);
    // CylinderGeometry's axis is +Y, so rz = 90 degrees lays the barrel along X.
    cyl(b, 'hull', d.skin, d.r, d.r, d.l, 18, { rz: Math.PI / 2 });
    for (const s of [-1, 1]) { // end caps + bolt rings (rings stand in the YZ plane)
      cyl(b, 'hull', d.cap, d.r * 1.05, d.r * 0.92, 1.0, 18, { x: s * d.l / 2, rz: Math.PI / 2 });
      torus(b, 'hull', DARK, d.r * 0.78, 0.12, 6, 18, undefined, { x: s * (d.l / 2 + 0.55), ry: Math.PI / 2 });
      torus(b, 'hull', DARK, d.r * 0.42, 0.1, 6, 14, undefined, { x: s * (d.l / 2 + 0.55), ry: Math.PI / 2 });
    }
    ribBands(b, 'hull', DARK, { r: d.r + 0.06, tube: 0.2, from: -d.l / 2 + 1.6, to: d.l / 2 - 1.6, count: 5, axis: 'x', tseg: 18 });
    // Longitudinal seams break the smooth barrel up.
    for (const a of [0.5, 2.1, 3.9, 5.4]) {
      box(b, 'hull', DARK, d.l - 1.2, 0.16, 0.5, { x: 0, y: Math.sin(a) * (d.r + 0.05), z: Math.cos(a) * (d.r + 0.05), rz: 0, ry: 0 });
    }
    // Two dense window rows down the flanks plus a lit end port.
    windowRow(b, 'glow', LIT, { count: d.win, spacing: 1.25, w: 1.0, h: 0.66, d: 0.5, x: 0, y: d.r * 0.52, z: d.r * 0.86, axis: 'x' });
    windowRow(b, 'glow', LIT_WARM, { count: d.win - 1, spacing: 1.35, w: 0.9, h: 0.6, d: 0.5, x: 0, y: -d.r * 0.34, z: -d.r * 0.94, axis: 'x' });
    windowRow(b, 'glow', LIT_DIM, { count: 3, spacing: 1.1, w: 0.7, h: 0.5, d: 0.4, x: -d.l / 2 - 0.4, y: 0.4, z: 0, axis: 'z' });
    panelPatches(b, 'hull', [RED, CREAM, BLUE, BROWN], { r: d.r, from: -d.l / 2 + 1.4, to: d.l / 2 - 1.4, count: 7, seed: 4310 + i, w: 2.4, h: 1.7, t: 0.24, axis: 'x' });
    // Roof spine, catwalk and access ladder.
    box(b, 'hull', d.roof, d.l * 0.86, 0.5, 2.2, { y: d.r + 0.2 });
    railing(b, 'hull', DARK, { ax: -d.l / 2 + 1, ay: d.r + 0.45, az: 0, bx: d.l / 2 - 1, by: d.r + 0.45, bz: 0, height: 0.8, posts: 7, rail: 0.09 });
    ladder(b, 'hull', DARK, { x: d.l / 2 - 1.6, y: -d.r, z: d.r * 0.55, h: d.r * 1.9, w: 0.6, rungs: 6 });
    for (let v = 0; v < 3; v++) { // roof vents
      box(b, 'hull', DARK, 0.7, 0.8, 0.7, { x: -d.l / 3 + v * (d.l / 3), y: d.r + 0.9, z: 0.9 });
    }
    b.pop();
  });

  // ----------------------------------------------------------- centre dome ---
  // The image's barn-red centrepiece: a drum collar, a ribbed red dome, a
  // lantern cupola and a ring of lit portholes.
  b.push(1, 4.5, -1, 0, 0, 0);
  cyl(b, 'hull', CREAM, 7.2, 7.6, 3.0, 24);
  ribBands(b, 'hull', DARK, { r: 7.35, tube: 0.22, from: -1.2, to: 1.2, count: 3, axis: 'y', tseg: 24 });
  hemi(b, 'hull', RED, 7.0, 24, 14, { y: 1.5 });
  for (let i = 0; i < 8; i++) { // meridian ribs over the dome
    const rib = 7.06;
    torus(b, 'hull', DARK, rib, 0.13, 6, 20, Math.PI, { y: 1.5, ry: (i * Math.PI) / 8, rx: 0 });
  }
  portholeRing(b, 'glow', LIT_WARM, { r: 7.3, count: 14, size: 0.42, y: 0.6, tilt: 0 });
  portholeRing(b, 'glow', LIT, { r: 5.6, count: 10, size: 0.34, y: 5.6, tilt: 0.5 });
  cyl(b, 'hull', CREAM, 1.9, 2.2, 2.2, 14, { y: 8.4 }); // cupola drum
  portholeRing(b, 'glow', LIT, { r: 2.1, count: 8, size: 0.3, y: 8.6, tilt: 0 });
  hemi(b, 'hull', RED, 2.1, 14, 8, { y: 9.5 });
  cyl(b, 'hull', DARK, 0.28, 0.28, 15.5, 8, { y: 17.5 }); // beacon mast to y=25
  ribBands(b, 'hull', CREAM, { r: 0.4, tube: 0.1, from: 12, to: 24, count: 4, axis: 'y', tseg: 8 });
  ladder(b, 'hull', DARK, { x: 6.6, y: 0, z: 1.2, h: 8, w: 0.6, rungs: 7, ry: 0.5 });
  b.pop();

  // ------------------------------------------------------- greenhouse vault --
  // Glazed barrel vault over a planter deck: a dark mullion frame with 13
  // separate glazing panes, so it reads as glass-and-frame rather than a solid
  // green mass. Interior amber spills out along the base.
  b.push(-8, 9.5, 7.5, 0, 0, 0);
  box(b, 'hull', DARK, 17.5, 0.7, 7.6, { y: -3.7 }); // planter deck
  box(b, 'hull', BROWN, 17.5, 1.1, 0.7, { y: -2.9, z: 3.6 });
  box(b, 'hull', BROWN, 17.5, 1.1, 0.7, { y: -2.9, z: -3.6 });
  for (let i = 0; i < 13; i++) { // glazing panes between mullions
    const px = -8 + i * 1.33;
    cyl(b, 'glaze', GROW, 3.5, 3.5, 0.72, 14, { x: px, rz: Math.PI / 2 });
  }
  for (let i = 0; i <= 13; i++) { // mullion ribs
    torus(b, 'hull', DARK, 3.62, 0.2, 6, 18, undefined, { x: -8.66 + i * 1.33, ry: Math.PI / 2 });
  }
  box(b, 'hull', DARK, 17.8, 0.5, 0.5, { y: 3.6 }); // ridge beam
  windowRow(b, 'glow', LIT_WARM, { count: 13, spacing: 1.33, w: 0.8, h: 0.5, d: 0.4, x: 0, y: -2.8, z: 3.9, axis: 'x' });
  windowRow(b, 'glow', LIT_DIM, { count: 11, spacing: 1.55, w: 0.7, h: 0.45, d: 0.4, x: 0, y: -2.8, z: -3.9, axis: 'x' });
  b.pop();

  // -------------------------------------------------------- domed habitats ---
  // Three donated pressure vessels on collar drums, each with bolt rings,
  // portholes and a vent stack. Deliberately different sizes and colours.
  const habs = [
    { x: -24, y: 7.5, z: 8, r: 3.4, skin: CREAM, cap: RED },
    { x: 13, y: 8.5, z: -11, r: 3.9, skin: BROWN, cap: CREAM },
    { x: 22, y: 6.5, z: 10, r: 2.9, skin: BLUE, cap: BROWN },
  ];
  habs.forEach((h, i) => {
    b.push(h.x, h.y, h.z, 0, rand() * 0.5 - 0.25, 0);
    cyl(b, 'hull', h.skin, h.r * 0.92, h.r, 2.2, 18, { y: -h.r * 0.9 });
    sphere(b, 'hull', h.skin, h.r, 18, 12);
    hemi(b, 'hull', h.cap, h.r * 0.98, 18, 8, { y: h.r * 0.22 });
    ribBands(b, 'hull', DARK, { r: h.r * 1.01, tube: 0.16, from: -h.r * 0.5, to: h.r * 0.5, count: 3, axis: 'y', tseg: 18 });
    portholeRing(b, 'glow', LIT, { r: h.r * 1.0, count: 8 + i, size: 0.36, y: h.r * 0.15, tilt: 0 });
    portholeRing(b, 'glow', LIT_DIM, { r: h.r * 0.86, count: 6, size: 0.28, y: -h.r * 0.5, tilt: -0.3 });
    cyl(b, 'hull', DARK, 0.4, 0.5, 2.4, 8, { y: h.r + 1.0 }); // vent stack
    torus(b, 'hull', CREAM, 0.55, 0.13, 6, 10, undefined, { y: h.r + 2.1, rx: Math.PI / 2 });
    ladder(b, 'hull', DARK, { x: h.r * 0.9, y: -h.r * 1.9, z: 0, h: h.r * 2.0, w: 0.5, rungs: 5, ry: Math.PI / 2 });
    b.pop();
  });

  // ------------------------------------------------------------ tank farm ----
  // Spherical water and slurry tanks strapped to the -X end, piped to the drums.
  const tanks = [[-26, 3.5, -9, 2.6, CREAM], [-22, 2.6, -12, 2.1, RED], [-19, 4.2, -8, 1.8, BROWN]];
  for (const [tx, ty, tz, tr, col] of tanks) {
    sphere(b, 'hull', col, tr, 16, 12, { x: tx, y: ty, z: tz });
    b.push(tx, ty, tz, 0, 0, 0);
    ribBands(b, 'hull', DARK, { r: tr * 1.01, tube: 0.13, from: -tr * 0.4, to: tr * 0.4, count: 2, axis: 'y', tseg: 16 });
    cyl(b, 'hull', DARK, 0.34, 0.34, tr * 1.4, 8, { y: -tr * 1.1 }); // stand
    b.pop();
    pipeRun(b, 'hull', CREAM, { ax: tx, ay: ty - tr, az: tz, bx: tx + 4, by: ty - 3, bz: tz + 3, r: 0.18, seg: 8, collars: 3 });
  }

  // -------------------------------------------------------- lighthouse mast --
  // The image's tall slim tower on the +X flank: tapered stack, collar bands,
  // a gallery ring, a lit lantern room and a short needle. Tops out at y=+22.
  b.push(27, 2, -10, 0, 0, 0);
  cyl(b, 'hull', CREAM, 0.85, 1.5, 15, 12);
  ribBands(b, 'hull', DARK, { r: 1.3, tube: 0.16, from: -6, to: 6, count: 5, axis: 'y', tseg: 12 });
  panelPatches(b, 'hull', [BROWN, CREAM], { r: 1.2, from: -6, to: 6, count: 5, seed: 4321, w: 1.0, h: 1.2, t: 0.16, axis: 'y' });
  torus(b, 'hull', DARK, 1.9, 0.18, 6, 16, undefined, { y: 7.4, rx: Math.PI / 2 }); // gallery
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(b, 'hull', DARK, 0.12, 0.9, 0.12, { x: Math.cos(a) * 1.85, y: 7.9, z: Math.sin(a) * 1.85 });
  }
  cyl(b, 'glow', LIT, 1.15, 1.15, 1.7, 12, { y: 9.2 }); // lantern room
  cyl(b, 'hull', RED, 1.35, 1.35, 0.3, 12, { y: 10.2 });
  hemi(b, 'hull', DARK, 1.3, 12, 8, { y: 10.4 });
  cone(b, 'hull', DARK, 0.16, 2.6, 6, { y: 12.9 });
  ladder(b, 'hull', DARK, { x: 1.35, y: -7, z: 0, h: 15, w: 0.5, rungs: 11, ry: Math.PI / 2 });
  lampString(b, 'glow', LIT_DIM, { ax: 1.5, ay: -6, az: 0, bx: 1.5, by: 6.6, bz: 0, count: 6, size: 0.3 });
  b.pop();

  // ------------------------------------------------------------- upper deck --
  // Catwalks tying the modules together, with a lamp string down the spine.
  box(b, 'hull', CREAM, 46, 0.4, 2.6, { y: 5.2, z: 0.5 });
  railing(b, 'hull', DARK, { ax: -22, ay: 5.4, az: 1.6, bx: 22, by: 5.4, bz: 1.6, height: 0.85, posts: 20, rail: 0.08 });
  railing(b, 'hull', DARK, { ax: -22, ay: 5.4, az: -0.6, bx: 22, by: 5.4, bz: -0.6, height: 0.85, posts: 20, rail: 0.08 });
  lampString(b, 'glow', LIT, { ax: -21, ay: 6.4, az: 0.5, bx: 21, by: 6.4, bz: 0.5, count: 15, size: 0.34 });
  for (const [sx, sz, ex, ez] of [[-16, 2, -22, 8], [-4, -4, -2, -10], [10, 3, 13, -9], [18, -3, 22, 9]]) {
    box(b, 'hull', BROWN, Math.hypot(ex - sx, ez - sz), 0.35, 1.6,
      { x: (sx + ex) / 2, y: 4.2, z: (sz + ez) / 2, ry: -Math.atan2(ez - sz, ex - sx) });
  }

  // ---------------------------------------------------------- radiator wings -
  // Faded-blue fin panels on short outriggers, canted off the -Z flank.
  for (const [rx0, rz0, ry0] of [[-14, -13, 0.5], [4, -14, -0.35], [16, 13, 0.9]]) {
    b.push(rx0, 2.5, rz0, 0, 0, 0);
    box(b, 'hull', DARK, 3.4, 0.4, 0.4, { x: 1.7 });
    radiatorPanel(b, 'hull', DARK, BLUE, { x: 5.2, y: 1.5, z: 0, w: 5.5, h: 7.5, fins: 8, ry: ry0, thick: 0.16 });
    b.pop();
  }

  // -------------------------------------------------------- mooring gantries -
  // Two spars under the raft with clamp jaws, slung cargo drums and lamp lanes.
  for (const side of [-1, 1]) {
    b.push(2, -9, side * 6, 0, 0, 0);
    truss(b, 'hull', DARK, { ax: 0, ay: 0, az: 0, bx: 0, by: -1.5, bz: side * 13, bays: 5, thickness: 0.28, spread: 0.9 });
    box(b, 'hull', CREAM, 2.4, 1.0, 1.4, { y: -1.6, z: side * 13 }); // clamp body
    box(b, 'hull', DARK, 0.5, 2.4, 1.2, { x: 1.2, y: -1.6, z: side * 13.6 });
    box(b, 'hull', DARK, 0.5, 2.4, 1.2, { x: -1.2, y: -1.6, z: side * 13.6 });
    for (let i = 0; i < 3; i++) { // slung cargo drums
      b.push(0, -3.4, side * (3.5 + i * 3.4), 0, 0, 0);
      cyl(b, 'hull', [RED, CREAM, BLUE][i], 1.35, 1.35, 3.0, 12, { rx: Math.PI / 2 });
      ribBands(b, 'hull', DARK, { r: 1.4, tube: 0.12, from: -1.0, to: 1.0, count: 3, axis: 'x', tseg: 12 });
      box(b, 'hull', DARK, 0.16, 2.0, 0.16, { y: 2.2 });
      b.pop();
    }
    lampString(b, 'glow', LIT, { ax: 0.9, ay: 0.4, az: side * 1.5, bx: 0.9, by: -1.1, bz: side * 12.5, count: 7, size: 0.26 });
    b.pop();
  }

  // ------------------------------------------------------------ cargo yard ---
  // A railed deck of stacked crates at the -X end, bands mismatched.
  b.push(-24, -6.5, 0, 0, 0.2, 0);
  box(b, 'hull', DARK, 10, 0.7, 11);
  railing(b, 'hull', CREAM, { ax: -4.6, ay: 0.35, az: -5.2, bx: 4.6, by: 0.35, bz: -5.2, height: 0.7, posts: 7, rail: 0.07 });
  railing(b, 'hull', CREAM, { ax: -4.6, ay: 0.35, az: 5.2, bx: 4.6, by: 0.35, bz: 5.2, height: 0.7, posts: 7, rail: 0.07 });
  const yard = [[-2.6, 1.3, -2.6, 1.9, RED], [0.6, 1.1, -2.2, 1.5, CREAM], [2.8, 1.2, 0.4, 1.7, BLUE],
    [-2.2, 1.1, 2.4, 1.5, BROWN], [0.4, 3.0, -2.4, 1.5, CREAM], [-2.4, 2.9, -2.6, 1.4, BLUE],
    [2.6, 1.2, 3.4, 1.6, RED], [-0.4, 1.2, 4.0, 1.4, BROWN]];
  yard.forEach(([cx, cy, cz, cs, col], i) => {
    crate(b, 'hull', col, { x: cx, y: cy, z: cz, s: cs, ry: rand() * 1.2 - 0.6, bands: 2, bandHex: DARK });
  });
  lampString(b, 'glow', LIT_DIM, { ax: -4, ay: 1.6, az: -4.6, bx: 4, by: 1.6, bz: -4.6, count: 5, size: 0.26 });
  b.pop();

  // -------------------------------------------------------- antenna thicket --
  for (const [ax0, az0, ah, adish] of [[-27, 4, 9, 0], [-13, -15, 12, 1.5], [6, 16, 8, 0],
    [15, -16, 11, 1.8], [26, 6, 9, 0], [-6, 15, 7, 0]]) {
    antenna(b, 'hull', DARK, CREAM, { x: ax0, y: 2.5, z: az0, h: ah, r: 0.14, tip: 0.34, dish: adish });
  }

  // ------------------------------------------------------------ pipe runs ----
  for (const [px0, py0, pz0, px1, py1, pz1] of [
    [-18, 2.5, 4, -10, 3.5, 8], [-6, 3, -6, 2, 4.5, -8], [8, 2.5, 5, 16, 3.5, 3],
    [18, 2, -4, 24, 2.5, 3], [-10, 5.5, 8, -2, 6, 2], [12, 4, -9, 20, 3.5, -4]]) {
    pipeRun(b, 'hull', CREAM, { ax: px0, ay: py0, az: pz0, bx: px1, by: py1, bz: pz1, r: 0.16, seg: 8, collars: 3 });
  }

  // -------------------------------------------------------- surface greebles -
  // Hatches, junction boxes and small vents scattered over the raft, with an
  // occasional lit inspection port. Deterministic: rng(4303) only.
  for (let i = 0; i < 34; i++) {
    const gx = -26 + rand() * 52;
    const gz = -13 + rand() * 26;
    const gy = -2 + rand() * 8;
    box(b, 'hull', i % 4 === 0 ? CREAM : DARK,
      0.7 + rand() * 0.7, 0.5 + rand() * 0.5, 0.5 + rand() * 0.6,
      { x: gx, y: gy, z: gz, ry: rand() * Math.PI });
    if (i % 3 === 0) box(b, 'glow', LIT_DIM, 0.4, 0.3, 0.28, { x: gx + 0.55, y: gy + 0.35, z: gz });
  }

  // -------------------------------------------------------- agri carousel ----
  // The Freehold farm ring, hung beneath the raft and turning: a boxed keel,
  // six spokes to a hub, twelve glazed growing pods and a lamp-lined rim.
  const ringGroup = new THREE.Group();
  ringGroup.position.y = -15;
  const ringB = detailBuilder();
  const R = 24;
  torus(ringB, 'ringHull', BROWN, R, 1.5, 10, 48, undefined, { rx: Math.PI / 2 });
  torus(ringB, 'ringHull', DARK, R, 0.4, 6, 48, undefined, { y: 1.3, rx: Math.PI / 2 });
  torus(ringB, 'ringHull', DARK, R, 0.4, 6, 48, undefined, { y: -1.3, rx: Math.PI / 2 });
  cyl(ringB, 'ringHull', CREAM, 2.6, 3.0, 1.6, 16); // hub collar
  ribBands(ringB, 'ringHull', DARK, { r: 3.1, tube: 0.16, from: -0.6, to: 0.6, count: 2, axis: 'y', tseg: 16 });
  for (let i = 0; i < 6; i++) { // spokes
    const a = (i / 6) * Math.PI * 2;
    box(ringB, 'ringHull', DARK, R - 2.4, 0.4, 0.36, { x: Math.cos(a) * (R / 2), z: Math.sin(a) * (R / 2), ry: -a });
    box(ringB, 'ringHull', CREAM, 1.6, 0.9, 1.2, { x: Math.cos(a) * (R - 1.6), z: Math.sin(a) * (R - 1.6), ry: -a });
  }
  for (let i = 0; i < 12; i++) { // glazed growing pods
    const a = (i / 12) * Math.PI * 2;
    ringB.push(Math.cos(a) * R, 0, Math.sin(a) * R, -a, 0, 0);
    box(ringB, 'ringHull', CREAM, 2.6, 0.4, 4.6, { y: 0.6 });
    cyl(ringB, 'ringGlaze', GROW, 0.92, 0.92, 3.6, 12, { y: 1.5, rx: Math.PI / 2 });
    for (let r2 = 0; r2 < 4; r2++) {
      torus(ringB, 'ringHull', DARK, 0.99, 0.11, 5, 12, undefined, { y: 1.5, x: 0, z: -1.5 + r2 * 1.0, ry: 0 });
    }
    box(ringB, 'ringGlow', LIT_WARM, 0.42, 0.3, 0.3, { y: 0.35, z: 1.4 });
    box(ringB, 'ringGlow', LIT_WARM, 0.42, 0.3, 0.3, { y: 0.35, z: -1.4 });
    ringB.pop();
  }
  for (let i = 0; i < 24; i++) { // rim lamps
    const a = (i / 24) * Math.PI * 2 + Math.PI / 24;
    box(ringB, 'ringGlow', LIT, 0.36, 0.36, 0.28, { x: Math.cos(a) * (R + 1.3), z: Math.sin(a) * (R + 1.3), ry: -a });
  }
  const ringGeos = ringB.build();
  if (ringGeos.ringHull) ringGroup.add(new THREE.Mesh(ringGeos.ringHull, hullMat));
  if (ringGeos.ringGlow) ringGroup.add(new THREE.Mesh(ringGeos.ringGlow, lightMat));
  if (ringGeos.ringGlaze) ringGroup.add(new THREE.Mesh(ringGeos.ringGlaze, glazeMat));
  group.add(ringGroup);

  const geos = b.build();
  group.add(new THREE.Mesh(geos.hull, hullMat));
  group.add(new THREE.Mesh(geos.glow, lightMat));
  group.add(new THREE.Mesh(geos.glaze, glazeMat));

  return stationRecord(ctx, { scheme, group, lightMat, beaconMat }, ringGroup, 31);
}

/** Veridian Combine — hex extraction complex, assay towers, docking spokes. */
function buildVeridianStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, trimMat, patchMats, lightMat, accentMat } = kit;
  put(group, new THREE.CylinderGeometry(9, 11, 30, 6), hullMat, 0, 0, 0); // faceted graphite core
  put(group, new THREE.CylinderGeometry(6.5, 8, 10, 6), darkMat, 0, 19, 0);
  put(group, new THREE.CylinderGeometry(0.5, 0.9, 10, 6), darkMat, 0, 28, 0); // beacon mast
  // Hexagonal extraction ring (spins) with docking spokes + emerald lamps.
  const ringGroup = new THREE.Group();
  const hex = put(ringGroup, new THREE.TorusGeometry(22, 2, 6, 6), darkMat, 0, -2, 0);
  hex.rotation.x = Math.PI / 2;
  const lampGeo = new THREE.SphereGeometry(0.9, 8, 6);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    put(ringGroup, new THREE.BoxGeometry(3, 2.4, 9), trimMat, Math.cos(a) * 26.5, -2, Math.sin(a) * 26.5, -a + Math.PI / 2);
    put(ringGroup, lampGeo, lightMat, Math.cos(a) * 22, 0.6, Math.sin(a) * 22);
  }
  group.add(ringGroup);
  // Assay towers: slim hex stacks with emerald lamp crowns.
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const h = 26 + i * 6;
    put(group, new THREE.CylinderGeometry(1.6, 2.2, h, 6), patchMats[i % patchMats.length], Math.cos(a) * 13, h / 2 - 8, Math.sin(a) * 13);
    put(group, lampGeo, lightMat, Math.cos(a) * 13, h - 8, Math.sin(a) * 13);
  }
  for (let i = 0; i < 4; i++) { // sensor fins
    const a = (i * Math.PI) / 2;
    put(group, new THREE.BoxGeometry(0.5, 12, 4.5), darkMat, Math.cos(a) * 9.5, 6, Math.sin(a) * 9.5, -a);
  }
  const collar = put(group, new THREE.TorusGeometry(9.6, 0.5, 6, 6), accentMat, 0, 12, 0); // emerald claim collar
  collar.rotation.x = Math.PI / 2;
  return stationRecord(ctx, kit, ringGroup, 33.5);
}

/** Ferrous Hegemony — fortress-bastion, radial batteries, command tower. */
function buildFerrousStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, patchMats, lightMat, accentMat } = kit;
  put(group, new THREE.CylinderGeometry(22, 26, 12, 8), darkMat, 0, -6, 0); // bastion skirt
  put(group, new THREE.CylinderGeometry(16, 20, 10, 8), hullMat, 0, 4, 0); // upper tier
  put(group, new THREE.CylinderGeometry(5, 8, 30, 8), hullMat, 0, 22, 0); // command tower
  put(group, new THREE.BoxGeometry(3, 6, 3), patchMats[1 % patchMats.length], 0, 38, 0); // brass cap
  for (let i = 0; i < 4; i++) { // crimson banner strips stand off the tower taper
    const a = (i * Math.PI) / 2;
    put(group, new THREE.BoxGeometry(0.3, 16, 2.4), accentMat, Math.cos(a) * 7.4, 24, Math.sin(a) * 7.4, -a);
  }
  // Rotating battery ring: eight turrets with twin barrels + crimson markers.
  const ringGroup = new THREE.Group();
  const ring = put(ringGroup, new THREE.TorusGeometry(24, 2.2, 8, 8), hullMat, 0, 0, 0);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const tx = Math.cos(a) * 24, tz = Math.sin(a) * 24;
    put(ringGroup, new THREE.CylinderGeometry(2.6, 3, 2.6, 8), darkMat, tx, 1.6, tz);
    put(ringGroup, new THREE.BoxGeometry(1.1, 1.1, 7), darkMat, Math.cos(a) * 27.5, 2.6, Math.sin(a) * 27.5, -a + Math.PI / 2);
    put(ringGroup, new THREE.SphereGeometry(0.7, 8, 6), accentMat, tx, 3.6, tz);
  }
  group.add(ringGroup);
  const lampGeo = new THREE.SphereGeometry(0.6, 8, 6);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    put(group, lampGeo, lightMat, Math.cos(a) * 25, -1, Math.sin(a) * 25);
  }
  return stationRecord(ctx, kit, ringGroup, 42);
}

/** Red Ledger — captured refinery core, tribute vault, toll-keeper gantry. */
function buildRedledgerStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, patchMats, lightMat, accentMat } = kit;
  put(group, new THREE.CylinderGeometry(11, 13, 24, 12), hullMat, 0, 2, 0); // refinery drum
  for (const y of [-7, 3, 11]) { // tarnished copper bands
    const band = put(group, new THREE.TorusGeometry(12.6 - y * 0.04, 0.55, 6, 24), patchMats[1 % patchMats.length], 0, y, 0);
    band.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 4; i++) { // flare stacks; one tip burns amber
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const h = 8 + (i % 2) * 5;
    put(group, new THREE.CylinderGeometry(0.9, 1.3, h, 6), darkMat, Math.cos(a) * 6, 14 + h / 2, Math.sin(a) * 6);
    if (i === 0) put(group, new THREE.SphereGeometry(1.1, 8, 6), lightMat, Math.cos(a) * 6, 14 + h, Math.sin(a) * 6);
  }
  // Repair-scar plates over the old wounds.
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + 0.4;
    put(group, new THREE.BoxGeometry(5, 3.4, 0.8), patchMats[i % patchMats.length], Math.cos(a) * 12.4, -8 + i * 5, Math.sin(a) * 12.4, -a + Math.PI / 2);
  }
  // Tribute vault: an armored sphere chained beneath the drum.
  put(group, new THREE.CylinderGeometry(2.5, 3.5, 6, 8), darkMat, 0, -12, 0);
  put(group, new THREE.SphereGeometry(7, 14, 10), darkMat, 0, -20, 0);
  const vaultBand = put(group, new THREE.TorusGeometry(7.1, 0.5, 6, 24), accentMat, 0, -20, 0); // dried-blood seal
  vaultBand.rotation.x = Math.PI / 2;
  // Toll gantry: a long arm with amber utility lamps and a boarding claw.
  put(group, new THREE.BoxGeometry(2, 2, 26), hullMat, 0, 2, 22);
  for (let i = 0; i < 4; i++) put(group, new THREE.SphereGeometry(0.6, 8, 6), lightMat, 1.2, 3.2, 12 + i * 6);
  put(group, new THREE.BoxGeometry(1, 5, 4), darkMat, 1.8, -1, 34);
  put(group, new THREE.BoxGeometry(1, 5, 4), darkMat, -1.8, -1, 34);
  // Tally collar (spins): lamps and two trophy hull plates.
  const ringGroup = new THREE.Group();
  const collar = put(ringGroup, new THREE.TorusGeometry(16, 1, 6, 24), patchMats[1 % patchMats.length], 0, 6, 0);
  collar.rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    put(ringGroup, new THREE.SphereGeometry(0.65, 8, 6), lightMat, Math.cos(a) * 16, 6, Math.sin(a) * 16);
  }
  for (let i = 0; i < 2; i++) {
    const a = i * Math.PI + 0.8;
    put(ringGroup, new THREE.BoxGeometry(6, 4, 0.9), patchMats[0], Math.cos(a) * 16, 6, Math.sin(a) * 16, -a + Math.PI / 2);
  }
  group.add(ringGroup);
  return stationRecord(ctx, kit, ringGroup, 28.5);
}

/** Gilded Chain — auction pavilion + observation rotunda, ivory/gold on black. */
function buildGildedStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, patchMats, lightMat } = kit;
  const gold = patchMats[0], ivory = patchMats[1 % patchMats.length];
  put(group, new THREE.CylinderGeometry(24, 27, 6, 24), hullMat, 0, 0, 0); // black ceramic disc
  const rim = put(group, new THREE.TorusGeometry(25.4, 0.7, 6, 48), gold, 0, 2.8, 0);
  rim.rotation.x = Math.PI / 2;
  put(group, new THREE.SphereGeometry(15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), darkMat, 0, 3, 0); // grand dome
  const domeRim = put(group, new THREE.TorusGeometry(15.2, 0.6, 6, 40), gold, 0, 3.2, 0);
  domeRim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) { // gold ribs arching over the dome
    const rib = put(group, new THREE.TorusGeometry(15.1, 0.45, 5, 24, Math.PI), gold, 0, 3, 0);
    rib.rotation.y = (i * Math.PI) / 4;
  }
  // Observation rotunda + spire.
  put(group, new THREE.CylinderGeometry(5, 6, 4, 12), ivory, 0, 19.5, 0);
  put(group, new THREE.SphereGeometry(4.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 21.5, 0);
  put(group, new THREE.CylinderGeometry(0.4, 0.7, 8, 6), gold, 0, 28, 0);
  // Scale cladding: overlapping plates leaning on the disc edge.
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI) / 7;
    const plate = put(group, new THREE.BoxGeometry(6.5, 0.7, 4), hullMat, Math.cos(a) * 23.5, 3.6, Math.sin(a) * 23.5, -a + Math.PI / 2);
    plate.rotation.x = 0.22;
  }
  // Ivory gallery arms (spin as the observation carousel) with turquoise tips.
  const ringGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    put(ringGroup, new THREE.BoxGeometry(3.4, 2.4, 12), ivory, Math.cos(a) * 30, -0.5, Math.sin(a) * 30, -a + Math.PI / 2);
    put(ringGroup, new THREE.SphereGeometry(0.8, 8, 6), lightMat, Math.cos(a) * 36, -0.5, Math.sin(a) * 36);
  }
  group.add(ringGroup);
  for (let i = 0; i < 12; i++) { // turquoise gallery lights at the dome base
    const a = (i * Math.PI) / 6;
    put(group, new THREE.SphereGeometry(0.55, 8, 6), lightMat, Math.cos(a) * 15.4, 3.4, Math.sin(a) * 15.4);
  }
  return stationRecord(ctx, kit, ringGroup, 32.5);
}

/** Congregation — outward-facing nave, sect bays, folded-sail shrines. */
function buildCongregationStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, trimMat, patchMats, lightMat } = kit;
  const wakeglass = patchMats[0]; // violet
  put(group, new THREE.CylinderGeometry(4.5, 6.5, 30, 8), hullMat, 0, 0, 0); // central keep
  // Observation nave reaching rimward (+Z) with a faceted prow.
  put(group, new THREE.BoxGeometry(7, 6, 26), hullMat, 0, 0, 16);
  const prow = put(group, new THREE.CylinderGeometry(0.8, 4.2, 8, 4), trimMat, 0, 0, 33);
  prow.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) { // candle-amber window strips along the nave
    for (let i = 0; i < 5; i++) put(group, new THREE.BoxGeometry(0.4, 1.1, 2.2), lightMat, side * 3.6, 0.8, 6 + i * 4.6);
  }
  for (let i = 0; i < 6; i++) { // rose-window lamps at the prow base
    const a = (i * Math.PI) / 3;
    put(group, new THREE.SphereGeometry(0.6, 8, 6), lightMat, Math.cos(a) * 3, Math.sin(a) * 3, 29.2);
  }
  // Sect bays (spin in slow procession around the keep).
  const ringGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    put(ringGroup, new THREE.CylinderGeometry(2.4, 2.8, 7, 6), patchMats[1 % patchMats.length], Math.cos(a) * 11, -2, Math.sin(a) * 11);
    put(ringGroup, new THREE.SphereGeometry(0.7, 8, 6), lightMat, Math.cos(a) * 11, 2.2, Math.sin(a) * 11);
  }
  group.add(ringGroup);
  // Folded-sail shrines: violet Wakeglass vanes cupped toward the keep.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    for (const fold of [-1, 1]) {
      const sail = put(group, new THREE.ConeGeometry(2.4, 10, 4), wakeglass, Math.cos(a + fold * 0.14) * 9, 15, Math.sin(a + fold * 0.14) * 9, -a);
      sail.scale.z = 0.22;
      sail.rotation.z = Math.cos(a) * fold * 0.3;
      sail.rotation.x = -Math.sin(a) * fold * 0.3;
    }
  }
  put(group, new THREE.SphereGeometry(2.2, 12, 10), lightMat, 0, 17, 0); // sanctuary lantern
  return stationRecord(ctx, kit, ringGroup, 21);
}

/** Assembly — repeating foundry cells, antenna forest, ancient core. */
function buildAssemblyStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, trimMat, patchMats, lightMat } = kit;
  put(group, new THREE.SphereGeometry(11, 16, 12), hullMat, 0, 4, 0); // ancient off-white core
  const equator = put(group, new THREE.TorusGeometry(11.1, 0.6, 6, 32), patchMats[0], 0, 4, 0); // faded-orange band
  equator.rotation.x = Math.PI / 2;
  const cellGeo = new THREE.BoxGeometry(8, 6, 8);
  // Foundry cells: identical charcoal boxes in a ring — two duplicated with
  // copy-error offsets (the Assembly's imperfect self-similarity).
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    put(group, cellGeo, darkMat, Math.cos(a) * 17, -6, Math.sin(a) * 17, -a);
    if (i % 3 === 0) put(group, cellGeo, trimMat, Math.cos(a) * 17.8, -5.2, Math.sin(a) * 17.8, -a);
  }
  // Rotating sub-ring of four more cells (a daughter print in progress).
  const ringGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    put(ringGroup, cellGeo, darkMat, Math.cos(a) * 17, 10, Math.sin(a) * 17, -a);
    put(ringGroup, new THREE.SphereGeometry(0.6, 8, 6), lightMat, Math.cos(a) * 17, 13.6, Math.sin(a) * 17);
  }
  group.add(ringGroup);
  // Antenna forest with teal optics.
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4;
    const r = i < 6 ? 15.5 : 8 + (i % 3) * 2;
    const h = 8 + (i % 4) * 3;
    const base = i < 6 ? -3 : 10;
    put(group, new THREE.CylinderGeometry(0.18, 0.3, h, 4), trimMat, Math.cos(a) * r, base + h / 2, Math.sin(a) * r);
    put(group, new THREE.SphereGeometry(0.45, 6, 5), lightMat, Math.cos(a) * r, base + h, Math.sin(a) * r);
  }
  // Daughter probes on docking arms.
  for (const side of [-1, 1]) {
    put(group, new THREE.BoxGeometry(1, 1, 12), trimMat, side * 4, -10, 12);
    put(group, new THREE.BoxGeometry(3, 2.4, 3.6), patchMats[0], side * 4, -10, 19);
  }
  return stationRecord(ctx, kit, ringGroup, 28.5);
}

/** Lamplighter Guild — gate-service depot: ring yard, spare segments, cranes. */
function buildLamplighterStation(ctx, systemId, def) {
  const kit = factionKit(ctx, def);
  const { group, hullMat, darkMat, trimMat, patchMats, lightMat } = kit;
  const yellow = patchMats[0], cobalt = patchMats[1 % patchMats.length];
  put(group, new THREE.CylinderGeometry(7, 8, 18, 10), darkMat, 0, 0, 0); // depot hub
  put(group, new THREE.CylinderGeometry(0.6, 1, 12, 6), trimMat, 0, 14, 0); // beacon mast
  // Service ring (spins): soot segments with yellow replacement panels and
  // warm guide lamps at every joint.
  const ringGroup = new THREE.Group();
  const ring = put(ringGroup, new THREE.TorusGeometry(26, 3, 8, 36), hullMat, 0, 0, 0);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    put(ringGroup, new THREE.BoxGeometry(7, 4.4, 5.5), i % 2 ? yellow : hullMat, Math.cos(a) * 26, 0, Math.sin(a) * 26, -a + Math.PI / 2);
  }
  const lampGeo = new THREE.SphereGeometry(0.65, 8, 6);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    put(ringGroup, lampGeo, lightMat, Math.cos(a) * 26, 3.2, Math.sin(a) * 26);
  }
  group.add(ringGroup);
  for (let i = 0; i < 4; i++) { // spokes tying ring to hub
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    put(group, new THREE.BoxGeometry(1.4, 1.4, 20), darkMat, Math.cos(a) * 13, 0, Math.sin(a) * 13, -a + Math.PI / 2);
  }
  // Parts yard: flat deck with crate rows and spare ring segments.
  put(group, new THREE.BoxGeometry(30, 2, 26), hullMat, 0, -16, 0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      put(group, new THREE.BoxGeometry(3, 2.4, 3), (r + c) % 3 === 0 ? cobalt : ((r + c) % 2 ? yellow : darkMat), -10.5 + c * 7, -13.8, -8 + r * 8);
    }
  }
  for (const x of [-8, 8]) { // spare gate-ring segments staged on the deck
    const arc = put(group, new THREE.TorusGeometry(9, 1.5, 6, 14, 1.6), trimMat, x, -12.5, 0);
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = x > 0 ? 0.4 : 2.2;
  }
  // Two yard cranes: column, jib, cable, hook.
  for (const side of [-1, 1]) {
    put(group, new THREE.CylinderGeometry(1, 1.4, 22, 6), darkMat, side * 18, -5, -10);
    put(group, new THREE.BoxGeometry(14, 1.2, 1.2), yellow, side * 12, 6, -10);
    put(group, new THREE.BoxGeometry(0.3, 7, 0.3), darkMat, side * 7, 2.5, -10);
    put(group, new THREE.BoxGeometry(1.4, 1.4, 1.4), cobalt, side * 7, -1.2, -10);
    put(group, lampGeo, lightMat, side * 5.2, 6, -10); // jib-tip work lamp
  }
  return stationRecord(ctx, kit, ringGroup, 21);
}

const STATION_BUILDERS = {
  freehold: buildFreeholdStation,
  veridian: buildVeridianStation,
  ferrous: buildFerrousStation,
  redledger: buildRedledgerStation,
  gilded: buildGildedStation,
  congregation: buildCongregationStation,
  assembly: buildAssemblyStation,
  lamplighter: buildLamplighterStation,
};

/**
 * Wave 27: 'The Bloom' — a Beautiful Ones station, grown not built. A
 * flower–starfish hybrid: an OPAQUE deep-flesh body (the ship.js living-
 * hull recipe — no translucency) with mint+crimson veins glowing from
 * emissiveMaps and breathing via pulsed emissiveIntensity, five starfish
 * arms in perpetual two-axis undulation (0.09/0.13 Hz incommensurate
 * sways — the tips trace a slow Lissajous sweep that never dwells), and
 * translucent membrane web-fans breathing in the gaps between arms (the
 * one delicate translucent note). The orchid-petal crown (the rotating
 * ringGroup) is rooted at the arm-ring center so the flower grows OUT of
 * the starfish disc; a small pearl beacon lantern blinks at the flower's
 * throat (update() drives beaconMat/beaconGlowMat as on every station);
 * mint chandelier clusters hang tight beneath the body; spore-lantern
 * motes drift on slow sway. Dock logic is position-only
 * (ctx.station.position) — no docking-arm silhouette is needed. Envelope
 * stays ~30u radius, −15…+18 vertical so arrival framing holds.
 *
 * Shared cached organic materials (flesh/membrane/gilt/veinGlow) are used
 * directly for sculpted parts and NEVER disposed or pulse-tagged
 * (teardownMesh skips userData.shared). The translucent skin/web/heart and
 * per-arm vein materials are PER-BUILD (pulse params live on
 * material.userData, so pulsing requires a per-assembly material); their
 * .map references the shared cached textures, which teardown skips while
 * disposing the materials themselves. Light/beacon/glow materials and the
 * organic glow textures are per-build too, disposing with the mesh exactly
 * as the stock station's do. update() spins ringGroup and pulses lightMat/
 * beaconMat/glowMat/beaconGlowMat unchanged; organicParts rides the same
 * record.
 */
// The Bloom's vein texture: mint family plus a CRIMSON accent every 6th
// vein (user-directed contrast). Count 16 (vs the toolkit default 42):
// the station's surfaces are huge and fill the screen, so the default
// density reads as a glowing lattice instead of branching veins on dark
// flesh. Module-cached and userData.shared-marked like the
// organicMaterials() caches — NEVER disposed (teardownMesh only disposes
// maps lacking the shared mark).
let _bloomVeinTex = null;
function bloomVeinTexture() {
  if (_bloomVeinTex) return _bloomVeinTex;
  // Wave 33: teal veins with a warm amber thread — the v2 lagoon/gold look.
  _bloomVeinTex = makeOrganicVeinTexture({ seed: 7331, colors: ['#5fe0c8', '#a8f0e0', '#e0a048'], count: 16 });
  _bloomVeinTex.userData.shared = true;
  return _bloomVeinTex;
}

function buildBeautifulStation(ctx, systemId, def) {  const mats = organicMaterials(); // cached shared set — never disposed, never pulse-tagged
  const group = new THREE.Group();
  group.name = 'beautiful-station';
  group.userData.organic = true;
  group.position.fromArray(def.station.position);

  const lightMat = new THREE.MeshBasicMaterial({ color: 0x7fe0a8 }); // chandeliers
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfdf6ec }); // opal-white

  // --- per-build flesh materials (dispose with the mesh; the emissiveMap
  // is the module-cached bloom vein texture, which teardown skips via
  // userData.shared). Wave 33: the skin is SEA-GLASS — a translucent
  // lagoon-teal MeshPhysicalMaterial (transparent, depthWrite off so the
  // golden hearths glow through, clearcoat wet sheen so the fill light and
  // sun catch glossy highlights) with the vein network still glowing softly
  // UNDER it (emissive 0xffffff × vein texture). tagPulse rides
  // emissiveIntensity: the vein network slowly brightens and dims.
  // Wave 36: emissive is distance-independent while the lit fill is not, so
  // past ~150u only the lattice read (wave-33 review P3) — opacity rises
  // 0.58 → 0.72 and the vein pulse drops (base 0.6 → 0.42, amp 0.18 → 0.10)
  // to rebalance skin vs lattice, and roughness 0.3 → 0.55 broadens the
  // diffuse lobe so the sun's directional term shows on the fill.
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: ORGANIC.lagoon, // glassy deep-teal epidermis — translucent
    transparent: true, opacity: 0.72, depthWrite: false, // hearths show through
    roughness: 0.55, metalness: 0,
    clearcoat: 0.6, clearcoatRoughness: 0.3, // wet-glass sheen
    emissive: 0xffffff, emissiveMap: bloomVeinTexture(), emissiveIntensity: 0.42,
  });
  tagPulse(skinMat, { base: 0.42, amp: 0.10, hz: 0.07 }); // veins breathe
  const webMat = new THREE.MeshStandardMaterial({
    color: 0x1f4a46, // deep teal membrane — translucent, the delicate contrast
    transparent: true, opacity: 0.5,
    roughness: 0.5, metalness: 0,
    emissive: 0xffffff, emissiveMap: bloomVeinTexture(), emissiveIntensity: 0.5,
    side: THREE.DoubleSide, depthWrite: false,
  });
  tagPulse(webMat, { base: 0.5, amp: 0.15, hz: 0.075, phase: 2.1 }); // offset from skin — never syncs

  // --- wave 33 golden interior: ONE per-build warm-amber basic material
  // carries every lit chamber (the five arm hearths and the five pad
  // centers). MeshBasicMaterial has no emissiveIntensity, so tagPulse rides
  // opacity — the golden chambers softly breathe (intended).
  const hearthMat = new THREE.MeshBasicMaterial({
    color: ORGANIC.amber, // warm gold — reads as a lit room through the glass
    transparent: true, opacity: 0.92,
  });
  tagPulse(hearthMat, { base: 0.88, amp: 0.1, hz: 0.11 });
  // Pad deck plate: dark gunmetal-teal so the gilt rings and amber center pop.
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x14262b, metalness: 0.6, roughness: 0.45,
  });

  // --- core body: a squashed glass sphere, breathing as one. The squash
  // lives on the mesh; tagBreath sits on a holder group because breath
  // drives scale.setScalar (uniform) around its base. The bell shares
  // skinMat — the same translucent lagoon sea-glass as the arms, with the
  // crown heart glowing through it.
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 4;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), skinMat);
  body.scale.set(2.2, 1.5, 2.2); // quarter of the original pod (user: 50% smaller again)
  bodyGroup.add(body);
  tagBreath(bodyGroup, { depth: 0.02, hz: 0.18 });
  group.add(bodyGroup);

  // --- bioluminescent fill: a soft teal point light at the body center so
  // the translucent flesh READS as volume (the ship carries underLight for
  // the same reason). Without it, far from the sun, only the emissive veins
  // show and the body collapses to a glowing lattice. Wave 36: 300 → 60 —
  // at 300/decay-2 it delivered ~1.2-13x the flat decay-0 sun's irradiance
  // (2.5) at skin distances (3-10u), swamping all sunward/anti-sun shading;
  // 60 puts it at parity (~2.4 at 5u) so the sun now shapes the bell and
  // arms (wave-33 review P3).
  const fleshLight = new THREE.PointLight(0x7fe0d0, 60, 140, 2);
  fleshLight.position.set(0, 6, 0);
  group.add(fleshLight);

  // --- five starfish arms: one shared tapered/drooping geometry. The veins
  // live in skinMat's emissiveMap (no overlay cage); the translucent skin
  // now reveals each arm's golden hearth chamber. Nested flex group = the
  // second sway axis (incommensurate frequencies never dwell). Every arm
  // carries its hearth, its dorsal landing pad, and its root node orb
  // INSIDE the holder/flex chain so they ride the sway.
  const armGeo = makeStarfishArmGeometry({ length: 20, rootRadius: 3.4, tipRadius: 0.4, droop: 6.5 });
  // Arm spine (see makeStarfishArmGeometry): at parameter t the center is
  // (2.4·sin πt, −6.5·t², 20·t), radius (3.4−3t)(1+0.15·sin πt) — the
  // hearth/pad/node placements below are read straight off that curve.
  const bulbGeo = new THREE.SphereGeometry(1, 10, 8);
  const hearthGeo = new THREE.SphereGeometry(1, 12, 10);
  const nodeGeo = new THREE.SphereGeometry(1.2, 14, 10);
  const padDiscGeo = new THREE.CylinderGeometry(3, 3.2, 0.35, 24);
  const padRingGeo = new THREE.TorusGeometry(2.15, 0.1, 8, 28);
  const padRingGeo2 = new THREE.TorusGeometry(1.35, 0.08, 8, 24);
  const padCenterGeo = new THREE.CircleGeometry(1.0, 20);
  // Shared per-build additive glow for the five node orbs (like the halo,
  // but teal and small); not pulse-tagged — the orb cores pulse instead.
  const nodeGlowMat = new THREE.SpriteMaterial({
    map: makeOrganicGlowTexture('rgba(140,240,220,0.9)', 'rgba(46,143,134,0)'),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7,
  });
  for (let i = 0; i < 5; i++) {
    const holder = new THREE.Group();
    holder.rotation.y = (i * Math.PI * 2) / 5 + (i % 2 ? 0.05 : -0.04); // grown, never machined
    // Inner flex group: a SECOND sway axis at an incommensurate frequency.
    // A single-axis sinusoid dwells motionless near each extremum for
    // seconds (reads as "stopped"); two axes at 0.09/0.13 Hz never stall
    // together — the tip traces a slow Lissajous sweep, always drifting.
    const flex = new THREE.Group();
    holder.add(flex);
    const armMesh = new THREE.Mesh(armGeo, skinMat);
    flex.add(armMesh);

    // Golden hearth: the lit chamber inside the arm — an elongated amber
    // core (~54% of arm length, slim radius) nested along the spine's mid
    // reach and pitched with the droop, reading through the glass skin.
    // Wave 34: scale.z 6.3 → 5.4. The wave-33 review flagged a ~0.41u tip
    // breach near spine t≈0.72 (droop slope 0.47 vs the hearth's fixed 0.27
    // pitch); wave-34 re-derivation shows 6.3 was in fact contained (+0.434u
    // worst margin — the breach figure was the margin, sign-flipped). 5.4
    // still taken: worst margin rises to +0.782u (tip at t≈0.68, 0.51u
    // off-axis vs a 1.53u skin radius), and the boot test wave-34 leg c now
    // pins the envelope so any future length/droop change trips it.
    const hearth = new THREE.Mesh(hearthGeo, hearthMat);
    hearth.name = 'beautiful-hearth';
    hearth.scale.set(1.05, 1.05, 5.4);
    hearth.position.set(2.32, -1.15, 8.4); // spine at t≈0.42
    hearth.rotation.x = 0.27; // droop slope at mid-arm
    flex.add(hearth);

    // Landing pad: a circular deck embedded in the dorsal mid-bulge — dark
    // disc, two concentric gilt rings, six mint rim lamps (lightMat, so
    // update() pulses them with the chandeliers), warm amber center. ONE
    // named group per arm; userData.pad is the arm index.
    const pad = new THREE.Group();
    pad.name = 'beautiful-pad';
    pad.userData.pad = i;
    pad.position.set(2.4, 0.6, 10.6); // dorsal surface at the mid bulge (t≈0.5)
    pad.rotation.x = 0.32; // pad top faces up/out of the arm silhouette
    const padDisc = new THREE.Mesh(padDiscGeo, padMat);
    pad.add(padDisc);
    const padRing = new THREE.Mesh(padRingGeo, mats.gilt);
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.22;
    pad.add(padRing);
    const padRing2 = new THREE.Mesh(padRingGeo2, mats.gilt);
    padRing2.rotation.x = Math.PI / 2;
    padRing2.position.y = 0.24;
    pad.add(padRing2);
    const padCenter = new THREE.Mesh(padCenterGeo, hearthMat);
    padCenter.rotation.x = -Math.PI / 2; // face up
    padCenter.position.y = 0.26;
    pad.add(padCenter);
    for (let k = 0; k < 6; k++) {
      const lamp = new THREE.Mesh(bulbGeo, lightMat);
      lamp.scale.setScalar(0.3);
      const la = (k * Math.PI * 2) / 6 + (i % 2 ? 0.06 : -0.05);
      lamp.position.set(Math.cos(la) * 2.65, 0.3, Math.sin(la) * 2.65);
      pad.add(lamp);
    }
    flex.add(pad);

    // Node orb: a glowing teal sphere nested on the arm root where the arm
    // meets the body disc. Per-node material so tagPulse phases the five
    // orbs around the ring; the shared additive sprite sells the glow.
    const nodeMat = new THREE.MeshBasicMaterial({
      color: ORGANIC.lagoonHot, transparent: true, opacity: 0.95,
    });
    tagPulse(nodeMat, { base: 0.9, amp: 0.1, hz: 0.15, phase: i * 1.256 });
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.name = 'beautiful-node';
    node.position.set(0, 2.6, 4.0); // dorsal side of the root, beside the bell
    holder.add(node);
    const nodeGlow = new THREE.Sprite(nodeGlowMat);
    nodeGlow.scale.setScalar(6);
    nodeGlow.position.copy(node.position);
    holder.add(nodeGlow);

    tagSway(holder, { axis: 'x', amp: 0.09, hz: 0.09, phase: i * 1.1 }); // vertical sweep: ±1.8u at the tip
    tagSway(flex, { axis: 'z', amp: 0.06, hz: 0.13, phase: i * 1.7 + 0.9 }); // lateral roll: ±1.2u, off-beat
    group.add(holder);
  }

  // --- five membrane webs fanning between adjacent arms, breathing against
  // them: the flower-skirt / starfish-webbing hybrid. One shared fan
  // geometry, each rotated to bisect its gap.
  const webGeo = makeWebGeometry({ inner: 3.5, outer: 16, spread: (Math.PI * 2 / 5) * 0.92, droop: 2.5, ruffle: 0.7 });
  for (let i = 0; i < 5; i++) {
    const web = new THREE.Mesh(webGeo, webMat);
    web.rotation.y = ((i + 0.5) * Math.PI * 2) / 5;
    web.position.y = 0.5;
    tagBreath(web, { depth: 0.03, hz: 0.13, phase: i * 0.7 });
    group.add(web);
  }

  // --- petal crown: THREE whorls rooted at the arm-ring center (y 4, inside
  // the bell pod) so the flower grows OUT of the starfish disc — seven
  // large outer petals, seven smaller inner sepals offset a half-step, and
  // (wave 33) five steep, nearly-closed bud petals at the heart offset a
  // quarter-step, raising the crown into the tall layered bud of the
  // reference. Deterministic per-petal jitter (sin-hash walk) in angle,
  // openness, and size: grown, never machined. petalMat is per-build
  // glassy lagoon-pale flesh carrying the bloom vein emissiveMap — the
  // flower shares the body's living veins. Activity: every petal flexes
  // open/closed on its OWN incommensurate frequency, the whole crown
  // breathes and slowly nods; update() spins it as always (RING_SPIN).
  const petalMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fd0c8, // pale glassy lagoon petal flesh (harmonized with the skin)
    roughness: 0.45, metalness: 0,
    clearcoat: 0.4, clearcoatRoughness: 0.4,
    emissive: 0xffffff, emissiveMap: bloomVeinTexture(), emissiveIntensity: 0.35,
    transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false,
  });
  tagPulse(petalMat, { base: 0.35, amp: 0.12, hz: 0.09, phase: 1.1 }); // petal veins breathe, offset from skin/web
  const ringGroup = new THREE.Group();
  ringGroup.position.y = 4;
  const outerGeo = makePetalGeometry({ length: 26, width: 11, curl: 8, cup: 3.2, segs: 14 });
  const innerGeo = makePetalGeometry({ length: 17, width: 8, curl: 10, cup: 4.5, segs: 12 });
  const PETALS = 7;
  for (let i = 0; i < PETALS; i++) {
    // Deterministic 0..1 jitter per petal (no RNG import; stable per index).
    const j1 = Math.sin(i * 12.9898) * 0.5 + 0.5;
    const j2 = Math.sin(i * 78.233) * 0.5 + 0.5;
    // Outer whorl.
    const tilt = new THREE.Group();
    tilt.rotation.y = (i * Math.PI * 2) / PETALS + (j1 - 0.5) * 0.14;
    const petal = new THREE.Mesh(outerGeo, petalMat);
    petal.rotation.x = -0.55 - j1 * 0.18; // uneven openness
    petal.scale.set(1 + (j2 - 0.5) * 0.24, 1, 1 + (j1 - 0.5) * 0.2);
    tagSway(petal, { axis: 'x', amp: 0.11 + j1 * 0.06, hz: 0.09 + j2 * 0.09, phase: i * 0.9 }); // deeper, slower flex
    tilt.add(petal);
    ringGroup.add(tilt);
    // Inner whorl — half-step offset, steeper, smaller.
    const tilt2 = new THREE.Group();
    tilt2.rotation.y = ((i + 0.5) * Math.PI * 2) / PETALS + (j2 - 0.5) * 0.12;
    const sepal = new THREE.Mesh(innerGeo, petalMat);
    sepal.rotation.x = -0.95 - j2 * 0.15;
    sepal.scale.setScalar(0.9 + j1 * 0.2);
    tagSway(sepal, { axis: 'x', amp: 0.09 + j2 * 0.05, hz: 0.11 + j1 * 0.07, phase: i * 1.3 + 0.6 });
    tilt2.add(sepal);
    ringGroup.add(tilt2);
  }
  // Innermost bud whorl (wave 33): five steep, nearly-closed petals cupped
  // tight around the crown heart — taller curl/cup, smaller scale, offset a
  // quarter-step from the inner whorl. 7 outer + 7 inner + 5 bud = 19.
  const budGeo = makePetalGeometry({ length: 15, width: 6, curl: 12, cup: 5.5, segs: 12 });
  const BUDS = 5;
  for (let i = 0; i < BUDS; i++) {
    const j1 = Math.sin(i * 12.9898 + 4.7) * 0.5 + 0.5; // same sin-hash, own salt
    const j2 = Math.sin(i * 78.233 + 2.3) * 0.5 + 0.5;
    const tilt3 = new THREE.Group();
    tilt3.rotation.y = ((i + 0.25) * Math.PI * 2) / BUDS + (j1 - 0.5) * 0.1; // quarter-step offset
    const bud = new THREE.Mesh(budGeo, petalMat);
    bud.rotation.x = -1.2 - j2 * 0.15; // nearly closed: -1.20..-1.35
    bud.scale.setScalar(0.85 + j1 * 0.2);
    tagSway(bud, { axis: 'x', amp: 0.07 + j1 * 0.04, hz: 0.13 + j2 * 0.06, phase: i * 1.9 + 0.3 });
    tilt3.add(bud);
    ringGroup.add(tilt3);
  }
  tagBreath(ringGroup, { depth: 0.04, hz: 0.07 }); // the whole bloom slowly opens/closes
  tagSway(ringGroup, { axis: 'x', amp: 0.06, hz: 0.04 }); // …and nods (rotation.y spin is +=, unaffected)
  const crownHeart = new THREE.Mesh(new THREE.SphereGeometry(2.5, 14, 10), mats.gilt);
  ringGroup.add(crownHeart);
  group.add(ringGroup);

  // --- no docking arm: the bloom is a single unified creature (dock logic
  // is position-only — ctx.station.position — so no silhouette is needed).
  // (bulbGeo is declared with the arm geometries above.)

  // --- chandelier light clusters hanging tight beneath the body underside
  // (lightMat — update() pulses its color toward lightColor, as on every
  // station). Kept close to the bell so they read as hanging FROM it, not
  // floating mid-air.
  for (let c = 0; c < 3; c++) {
    const ca = (c * Math.PI * 2) / 3 + 0.5;
    const cx = Math.cos(ca) * 3;
    const cz = Math.sin(ca) * 3;
    const cy = -1.5 - c * 1.2;
    for (let i = 0; i < 5; i++) {
      const bulb = new THREE.Mesh(bulbGeo, lightMat);
      const s = 0.55 + ((i + c) % 3) * 0.22;
      bulb.scale.setScalar(s);
      bulb.position.set(
        cx + Math.cos(i * 2.4) * 1.6,
        cy - i * 1.0,
        cz + Math.sin(i * 2.4) * 1.6,
      );
      group.add(bulb);
    }
  }

  // --- beacon: a small pearl lantern nestled at the flower's throat (where
  // the petals converge), modest glow — update() blinks it as always. No
  // floating ball above the silhouette.
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), beaconMat);
  beacon.position.set(0, 11, 0);
  group.add(beacon);
  const beaconGlowMat = new THREE.SpriteMaterial({
    map: makeOrganicGlowTexture('rgba(215,255,235,0.95)', 'rgba(127,224,168,0)'),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8,
  });
  const beaconGlow = new THREE.Sprite(beaconGlowMat);
  beaconGlow.scale.setScalar(12);
  beaconGlow.position.set(0, 11, 0);
  group.add(beaconGlow);

  // --- halo: big mint-tinted additive glow (update() breathes its opacity).
  const glowMat = new THREE.SpriteMaterial({
    map: makeOrganicGlowTexture('rgba(165,240,205,0.8)', 'rgba(55,175,120,0)'),
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(150);
  group.add(glow);

  // --- spore lantern motes: tiny bioluminescent bulbs drifting on slow
  // sway around the bloom. Solid lightMat bulbs — mats.veinGlow on a sphere
  // reads as a wireframe ball.
  for (let i = 0; i < 8; i++) {
    const orbit = new THREE.Group();
    orbit.rotation.y = i * 2.4; // golden-ish spread
    const mote = new THREE.Mesh(bulbGeo, lightMat);
    mote.scale.setScalar(0.5 + (i % 3) * 0.18);
    mote.position.set(20 + (i % 3) * 4, -14 + i * 4, 0);
    orbit.add(mote);
    tagSway(orbit, { axis: 'y', amp: 0.6, hz: 0.07, phase: i * 0.8 });
    group.add(orbit);
  }

  ctx.scene.add(group);
  return {
    group, ringGroup, lightMat, beaconMat, glowMat, beaconGlowMat,
    lightColor: new THREE.Color(0x7fe0a8),
    organicParts: collectOrganic(group),
  };
}

/** Remove the station mesh and release every GPU resource it holds. */
function teardownMesh(ctx, mesh) {
  ctx.scene.remove(mesh.group);
  mesh.group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mat = obj.material;
    if (mat) {
      // Wave 27: cached shared organic materials (and their maps) are
      // never disposed — they outlive any single station build.
      if (mat.userData.shared) return;
      if (mat.map && !mat.map.userData.shared) mat.map.dispose();
      mat.dispose();
    }
  });
}

// ------------------------------------------------------------- helpers ----

function holdUnits(ctx, commodity) {
  let n = 0;
  for (const c of ctx.cargo) if (c.commodity === commodity) n += c.units;
  return n;
}
function cargoUsed(ctx) {
  let n = 0;
  for (const c of ctx.cargo) n += c.units;
  return n;
}
function addCargo(ctx, commodity, units) {
  for (const c of ctx.cargo) {
    if (c.commodity === commodity) { c.units += units; return; }
  }
  ctx.cargo.push({ commodity, units });
}
function removeCargo(ctx, commodity, units) {
  for (let i = 0; i < ctx.cargo.length; i++) {
    const c = ctx.cargo[i];
    if (c.commodity !== commodity) continue;
    c.units -= units;
    if (c.units <= 0) ctx.cargo.splice(i, 1);
    return;
  }
}
function priceOf(ctx, key) {
  return ctx.world.prices[key] ?? COMMODITIES[key].base;
}
function findAceRecord(ctx) {
  const recs = ctx.world.records || [];
  for (const r of recs) if (r.role === 'ace' || r.classKey === 'ace') return r;
  for (const r of recs) if (r.name === DEFAULT_ACE_NAME || r.bounty > 0) return r;
  return null;
}
/** A system whose def flies tradesRestricted sells patent stock openly (§16). */
function stationAlwaysTradesRestricted(ctx) {
  return ctx.systems?.[ctx.world.currentSystem]?.tradesRestricted === true;
}
function restrictedAllowed(ctx, fenceUnlocked = false) {
  if (stationAlwaysTradesRestricted(ctx)) return true;
  if (fenceUnlocked) return true; // the fence called ahead — locker opens this session
  return ctx.world.fear >= ECON.fear.tributeOpensAt || ctx.world.reputation.freehold < RESTRICTED_REP_GATE;
}
/** The system on the other side of the primary gate (haul jobs §10.1). */
function otherSystemId(ctx, id) {
  return ctx.systems?.[id]?.gates?.[0]?.to ?? id;
}
/** Home system of the bounty ace (world.js keeps him there; §15 cast). */
function aceHomeSystem(ctx) {
  for (const key of Object.keys(ctx.systems ?? {})) {
    if (ctx.systems[key].cast?.ace) return key;
  }
  return 'freehold';
}

// ---------------------------------------------------------------- jobs ----

function makeJobs(ctx) {
  const ace = findAceRecord(ctx);
  const aceName = ace?.name ?? DEFAULT_ACE_NAME;
  const aceBounty = ace?.bounty ?? DEFAULT_ACE_BOUNTY;
  const aceHome = ctx.systems?.[aceHomeSystem(ctx)]?.name ?? 'Freehold Drift';
  return [
    {
      id: 'bounty-ace', kind: 'bounty', target: aceName,
      title: `Bounty: ${aceName}`,
      detail: `${aceName} flies an ace frame and bleeds the lanes of ${aceHome} dry. The Compact pays on confirmation of the kill or capture — your guns, your name on the claim.`,
      reward: aceBounty, state: 'offered', progress: 0, need: 1,
    },
    {
      id: 'patrol-lane', kind: 'patrol',
      title: 'Patrol the lane',
      detail: `Pirates have been working the approach. Kill or drive off ${PATROL_NEED} of them and the dockmaster posts ${PATROL_REWARD} UU plus the Compact's thanks.`,
      reward: PATROL_REWARD, state: 'offered', progress: 0, need: PATROL_NEED,
    },
    {
      id: 'haul-provisions', kind: 'haul',
      title: 'Haul provisions',
      detail: `Provisions are worth more a gate away. Accept here, buy ${HAUL_UNITS} Provisions, and dock at the other system's station — paid at ${Math.round(HAUL_MARGIN * 100)}% of your buy cost on delivery.`,
      reward: 0, state: 'offered', progress: 0, need: HAUL_UNITS,
      originSystem: null, originPrice: 0, // stamped on accept (JSON-plain)
    },
    {
      id: 'ferry-consignment', kind: 'ferry',
      title: 'Ferry a consignment',
      detail: `A dockside factor fronts you ${FERRY_UNITS} Provisions — no buy-in, no questions — and pays ${FERRY_REWARD} UU when the consignment crosses the gate and lands intact at the far station. The manifest is watched: deliver short and the deal is off.`,
      reward: FERRY_REWARD, state: 'offered', progress: 0, need: FERRY_UNITS,
      originSystem: null, destSystem: null, // stamped on accept (JSON-plain)
    },
  ];
}

function ensureJobs(ctx) {
  if (!Array.isArray(ctx.world.jobs)) ctx.world.jobs = [];
  if (ctx.world.jobs.length === 0) ctx.world.jobs = makeJobs(ctx);
}

/** Keep the ace contract pointed at the living ace record (name/reward drift). */
function refreshBountyJob(ctx) {
  for (const j of ctx.world.jobs) {
    if (j.id !== 'bounty-ace' || j.state === 'done') continue;
    const ace = findAceRecord(ctx);
    if (ace) {
      j.target = ace.name;
      j.reward = ace.bounty ?? j.reward;
      j.title = `Bounty: ${ace.name}`;
    }
  }
}

function pirateBountyId(name) {
  return `bounty-pirate-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Post a bounty card for each live, priced pirate of the current system
 * (cap PIRATE_BOUNTY_CAP). Offered cards for quarries already dead or
 * captured are pulled. Claims follow the same witness rule as the ace (§8.7).
 */
function syncPirateBounties(ctx, sysId) {
  const jobs = ctx.world.jobs;
  const recs = ctx.world.records || [];
  for (let i = jobs.length - 1; i >= 0; i--) {
    const j = jobs[i];
    if (j.kind !== 'bounty' || !j.id.startsWith('bounty-pirate-') || j.state !== 'offered') continue;
    let live = false;
    for (const r of recs) {
      if (r.role === 'pirate' && pirateBountyId(r.name) === j.id
        && r.state !== 'dead' && r.state !== 'captured') { live = true; break; }
    }
    if (!live) jobs.splice(i, 1);
  }
  let posted = 0;
  for (const j of jobs) {
    if (j.kind === 'bounty' && j.id.startsWith('bounty-pirate-')
      && j.system === sysId && j.state !== 'done') posted++;
  }
  const sysName = ctx.systems?.[sysId]?.name ?? sysId;
  for (const r of recs) {
    if (posted >= PIRATE_BOUNTY_CAP) break;
    if (r.system !== sysId || r.role !== 'pirate' || !(r.bounty > 0)) continue;
    if (r.state === 'dead' || r.state === 'captured') continue;
    const id = pirateBountyId(r.name);
    if (jobs.some((j) => j.id === id)) continue;
    jobs.push({
      id, kind: 'bounty', target: r.name, system: sysId, // home board (JSON-plain)
      title: `Bounty: ${r.name}`,
      detail: `${r.name} runs with a reaver crew and bleeds the lanes of ${sysName} dry. The Compact pays on confirmation of the kill or capture — your guns, your name on the claim.`,
      reward: r.bounty || PIRATE_BOUNTY_FALLBACK,
      state: 'offered', progress: 0, need: 1,
    });
    posted++;
  }
}

/**
 * Post a recovery card while an unexpired wreck of the CURRENT system drifts
 * unsalvaged (§12.x). Same render-time sync pattern as syncPirateBounties:
 * offered cards whose wreck expired (or was never real — Witness Rule §8.7,
 * wrecks only stage from real kills) are pulled. Never posts twice for one
 * wreck id.
 */
function syncRecoveryJob(ctx, sysId) {
  const jobs = ctx.world.jobs;
  const aftermath = ctx.world.aftermath || [];
  // Pull offered cards whose wreck is gone or expired.
  for (let i = jobs.length - 1; i >= 0; i--) {
    const j = jobs[i];
    if (j.kind !== 'recovery' || j.state !== 'offered') continue;
    let live = false;
    for (const a of aftermath) {
      if (a.id === j.wreckId && a.kind === 'wreck' && a.expiresAt > ctx.world.time) { live = true; break; }
    }
    if (!live) jobs.splice(i, 1);
  }
  // Post for the first in-system wreck with no job yet (one card at a time).
  for (const a of aftermath) {
    if (a.kind !== 'wreck' || a.system !== sysId || !(a.expiresAt > ctx.world.time)) continue;
    const id = `recovery-${a.id}`;
    if (jobs.some((j) => j.id === id)) continue;
    jobs.push({
      id, kind: 'recovery', wreckId: a.id,
      title: 'Recovery: wreck salvage',
      detail: `A wreck drifts in the lanes and the yard wants its metallics back before the hulk goes cold. Accept and a salvage marker pod is cut loose at the site — scoop it, dock back here, collect ${RECOVERY_REWARD} UU.`,
      reward: RECOVERY_REWARD, state: 'offered', progress: 0, need: 1,
      originSystem: sysId, collected: false, // JSON-plain
    });
    break;
  }
}

/** Board-visible jobs: offered pirate bounties post only at their home system. */
function boardJobs(ctx, sysId) {
  const out = [];
  for (const j of ctx.world.jobs) {
    if (j.kind === 'bounty' && j.id.startsWith('bounty-pirate-')
      && j.state === 'offered' && j.system !== sysId) continue;
    if (j.kind === 'recovery' && j.state === 'offered' && j.originSystem !== sysId) continue;
    out.push(j);
  }
  return out;
}

/**
 * Epic standing (wave 6): job payouts scale by the current system faction's
 * achieved jobPayMult. Called only at payout/render time, never per frame.
 * Wave 26: jobPayFor takes the system id so ferry/haul quotes and snapshots
 * price the DESTINATION dock; jobPay keeps the current-system shorthand.
 */
function jobPayFor(ctx, sysId, base) {
  const faction = ctx.systems?.[sysId]?.faction;
  const mult = epicEffects(ctx, faction).jobPayMult ?? 1;
  // Wave 24: the faction service modifier composes multiplicatively AFTER the
  // epic multiplier (epic first, faction second); the authored six are guarded
  // by id — they hold no FACTION_SERVICES application.
  const svcMult = AUTHORED_SYSTEMS[sysId] ? 1 : (FACTION_SERVICES[faction]?.jobPayMult ?? 1);
  return Math.round(base * mult * svcMult);
}
function jobPay(ctx, base) {
  return jobPayFor(ctx, ctx.world.currentSystem, base);
}

/** Rank name for a ladder tier (epic requirement hints: 'Rank: Trusted'). */
function rankNameForTier(tier) {
  for (const rung of RANK_LADDER) if (rung.tier === tier) return rung.name;
  return `tier ${tier}`;
}

/** Signed percent from a multiplier: 1.15 → '+15%', 0.9 → '-10%'. */
function pctOf(mult) {
  const pct = Math.round((mult - 1) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

/** Plain-terms line for one epic effect entry (Standing service). */
function epicEffectLine(key, value) {
  switch (key) {
    case 'sellMult': return `Sales ${pctOf(value)}`;
    case 'buyMult': return `Buy prices ${pctOf(value)}`;
    case 'repairMult': return `Repairs ${pctOf(value)}`;
    case 'jobPayMult': return `Jobs ${pctOf(value)}`;
    case 'restrictedSellMult': return `Patent stock sales ${pctOf(value)}`;
    case 'pirateResolveMod': return `Their pirates yield sooner (resolve ${value >= 0 ? '+' : ''}${value})`;
    default: return null;
  }
}

function completeJob(ctx, job, notice) {
  job.state = 'done';
  // Dockmaster trust grows with every finished contract; a bounty claim also
  // earns the local fence's favor where one works the dock (§12.x).
  for (const c of contactsForSystem(ctx, ctx.world.currentSystem)) {
    if (c.role === 'dockmaster') bumpTrust(ctx, c, DOCKMASTER_TRUST_PER_JOB);
    // Wave 26: a generated-system dockmaster banks +1 favor per finished
    // contract once the post-bump trust reads known (GENERATED_KNOWN_TRUST);
    // the authored six fall through by id.
    if (c.role === 'dockmaster' && !AUTHORED_SYSTEMS[ctx.world.currentSystem] && c.trust >= GENERATED_KNOWN_TRUST) addFavor(ctx, c);
    if (job.kind === 'bounty' && c.role === 'fence') addFavor(ctx, c);
  }
  if (notice) ctx.emit('commLine', { text: notice });
}

/**
 * Every-frame event scan for active recovery contracts: lastEvents lives one
 * frame, so the podCollected watch CANNOT sit in the throttled delivery tick.
 * Any scooped pod counts while the recovery is active — pods carry no job
 * tags (shared pods.js contract), so the abstraction is temporal.
 */
function tickRecoveryCollect(ctx) {
  for (const job of ctx.world.jobs) {
    if (job.kind !== 'recovery' || job.state !== 'accepted' || job.collected) continue;
    for (const ev of ctx.lastEvents) {
      if (ev.type === 'podCollected') { job.collected = true; break; }
    }
  }
}

/** Every-frame event scan for the patrol contract (cheap: few events). */
function tickPatrolJob(ctx) {
  for (const job of ctx.world.jobs) {
    if (job.kind !== 'patrol' || job.state !== 'accepted') continue;
    for (const ev of ctx.lastEvents) {
      if (ev.type !== 'npcDestroyed' && ev.type !== 'npcSurrendered' && ev.type !== 'npcDisabled') continue;
      const role = ev.ship?.role ?? ev.ship?.record?.role;
      if (role !== 'pirate') continue;
      job.progress += 1;
      if (job.progress >= job.need) {
        ctx.world.reputation.freehold += PATROL_REP;
        const pay = jobPay(ctx, PATROL_REWARD);
        ctx.world.credits += pay;
        completeJob(ctx, job, `Patrol contract fulfilled — ${pay} UU posted.`);
        break; // one payout per contract, even for a multi-kill frame
      }
    }
  }
}

/** Throttled checks: bounty claim + cross-system provisions delivery. */
function tickDeliveryJobs(ctx, ui) {
  for (const job of ctx.world.jobs) {
    if (job.state !== 'accepted') continue;
    if (job.kind === 'bounty') {
      if (job.id === 'bounty-ace') {
        const ace = findAceRecord(ctx);
        if (!ace || (ace.state !== 'dead' && ace.state !== 'captured')) continue;
        // The claim is only yours if the record says your guns did it (§8.7).
        const claimed = (ctx.world.incidents || []).some(
          (i) => i.name === ace.name && i.causer === 'player',
        );
        if (!claimed) continue;
        const acePay = jobPay(ctx, job.reward);
        ctx.world.credits += acePay;
        completeJob(ctx, job, `Bounty confirmed: ${job.target} — ${acePay} UU posted.`);
      } else {
        // Pirate bounty: a witnessed, player-caused kill of the named reaver.
        const claimed = (ctx.world.incidents || []).some(
          (i) => i.kind === 'destroyed' && i.name === job.target && i.causer === 'player',
        );
        if (!claimed) continue;
        const bountyPay = jobPay(ctx, job.reward);
        ctx.world.credits += bountyPay;
        completeJob(ctx, job, `Bounty confirmed: ${job.target} — ${bountyPay} UU posted.`);
      }
    } else if (job.kind === 'haul' && ctx.flags.docked) {
      // Wave 35: delivery binds the NAMED destination, closing the wave-26
      // review MEDIUM — a payQuoted-stamped chain paid at ANY non-origin
      // dock. otherSystemId names the primary-gate destination, the same id
      // the board UI and the accept-time quote resolve (the ferry precedent:
      // only the named far station pays). Side-gate arrivals in multi-gate
      // origins no longer pay. Old saves need no migration: originSystem +
      // payQuoted were stamped at accept, and this gate recomputes the same
      // destination at delivery time.
      const origin = job.originSystem ?? 'freehold';
      const dest = otherSystemId(ctx, origin);
      // Gates-less fallback (otherSystemId returns the origin itself): the
      // job stays undeliverable — it can never pay at origin.
      if (ctx.world.currentSystem !== dest || dest === origin) continue;
      if (holdUnits(ctx, 'provisions') < HAUL_UNITS) continue;
      removeCargo(ctx, 'provisions', HAUL_UNITS);
      const unitCost = job.originPrice || priceOf(ctx, 'provisions');
      const reward = job.payQuoted ?? jobPay(ctx, Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN));
      ctx.world.credits += reward;
      // The gate above makes this dock the named destination, so the line's
      // station is always the one the quote was priced off.
      const destName = ctx.systems?.[ctx.world.currentSystem]?.station?.name ?? 'the far station';
      completeJob(ctx, job, `Provisions delivered — ${reward} UU paid at 140% of buy cost by ${destName}.`);
    } else if (job.kind === 'ferry' && ctx.flags.docked) {
      if (ctx.world.currentSystem !== job.destSystem) continue; // only the named far station pays
      if (holdUnits(ctx, 'provisions') >= FERRY_UNITS) {
        removeCargo(ctx, 'provisions', FERRY_UNITS);
        const ferryPay = job.payQuoted ?? jobPay(ctx, job.reward);
        ctx.world.credits += ferryPay;
        const destName = ctx.systems?.[job.destSystem]?.station?.name ?? 'the far station';
        completeJob(ctx, job, `Consignment landed intact — ${ferryPay} UU from the factor at ${destName}.`);
      } else if (ui) {
        // Fronted goods came up short: the contract stays open but unpaid.
        ui.notice = 'Consignment short — the manifest is watched.';
      }
    } else if (job.kind === 'recovery') {
      // job.collected is set per frame by tickRecoveryCollect (lastEvents is
      // single-frame; this throttled tick would miss it ~29 frames in 30).
      if (job.collected && ctx.flags.docked && ctx.world.currentSystem === job.originSystem) {
        const salvagePay = jobPay(ctx, job.reward);
        ctx.world.credits += salvagePay;
        completeJob(ctx, job, `Salvage accounted — ${salvagePay} UU from the yard.`);
      }
    }
  }
}

// ---------------------------------------------------------------- main ----

export function initStation(ctx) {
  let currentId = ctx.world.currentSystem;
  let currentDef = ctx.systems[currentId];
  // Wave 24: this dock's faction service entry (FACTION_SERVICES, state.js),
  // resolved once per station like currentDef — never per frame. The authored
  // six are guarded by id, so authored-system pricing is byte-identical.
  let currentService = AUTHORED_SYSTEMS[currentId] ? null : (FACTION_SERVICES[currentDef.faction] ?? null);
  let mesh = buildStationMesh(ctx, currentId, currentDef);
  // One stable Vector3 for the station's life — hud.js may hold the ref.
  const stationPos = new THREE.Vector3().fromArray(currentDef.station.position);

  // World fields this system owns.
  ensureJobs(ctx);
  ctx.world.scanner ??= 0;

  // Exposed for hud.js every frame (dock prompt; we emit nothing for it).
  ctx.station = {
    position: stationPos,
    name: currentDef.station.name,
    systemName: currentDef.name,
    inZone: false,
    fenceUnlocked: false, // mirror of ui.fenceUnlocked for external readers/tests
    keeperComp: false, // mirror of ui.keeperComp (wave 11)
  };

  /** Tear down and rebuild the station for a freshly loaded system. */
  function rebuild(newId) {
    if (!ctx.systems?.[newId]?.station) return; // unknown system id: keep current
    currentId = newId;
    currentDef = ctx.systems[newId];
    currentService = AUTHORED_SYSTEMS[newId] ? null : (FACTION_SERVICES[currentDef.faction] ?? null);
    teardownMesh(ctx, mesh);
    mesh = buildStationMesh(ctx, currentId, currentDef);
    stationPos.fromArray(currentDef.station.position);
    ctx.station.name = currentDef.station.name;
    ctx.station.systemName = currentDef.name;
    if (ui.open) render();
  }

  // ----------------------------------------------------------- overlay ----

  const overlay = document.createElement('div');
  overlay.className = 'screen-overlay station-overlay';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  const ui = {
    open: false,
    level: 1, // 1 = services, 2 = service detail (never deeper, §12.1)
    service: null,
    marketSel: 0,
    barRound: 0,
    notice: '',
    fenceUnlocked: false, // session-scoped: a called-in favor opens the locker
    keeperComp: false, // session-scoped (wave 11): a keeper's marker comps the yard
    compNote: null, // session-scoped (wave 26): the repair screen note a comp speaks
  };

  function h(tag, cls, parent, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  function btn(parent, label, onClick, cls = 'screen-btn') {
    const b = h('button', cls, parent, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  const COMMODITY_KEYS = Object.keys(COMMODITIES);

  // ---- shared actions (clicked buttons and hotkeys both land here) ----
  const act = {
    buyRound() {
      if (ctx.world.credits < ROUND_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= ROUND_COST;
      ui.barRound += 1;
      ui.notice = 'The bar loosens up.';
      render();
    },
    feedBiomass() {
      if (ctx.bio.hunger <= 0) { ui.notice = 'She is sated; she noses the berth lights instead.'; render(); return; }
      if (ctx.world.credits < FEED_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= FEED_COST;
      ctx.bio.hunger = 0;
      ctx.bio.bond = Math.min(1, ctx.bio.bond + 0.05);
      ui.notice = 'She feeds slowly, and the berth lights dim with contentment.';
      render();
    },
    feedRock() {
      if (holdUnits(ctx, 'livingRock') < 1) { ui.notice = 'No living rock in the hold.'; render(); return; }
      removeCargo(ctx, 'livingRock', 1);
      ctx.bio.hunger = 0;
      ctx.bio.bond = Math.min(1, ctx.bio.bond + 0.2);
      ui.notice = 'She takes the living rock gently. The song through the hull runs warm for hours.';
      render();
    },
    tendWounds() {
      if (ctx.bio.wounds <= 0) { ui.notice = 'No wounds to tend.'; render(); return; }
      if (ctx.world.credits < TEND_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= TEND_COST;
      ctx.bio.wounds = Math.max(0, ctx.bio.wounds - 0.4);
      ctx.bio.bond = Math.min(1, ctx.bio.bond + 0.03);
      ui.notice = 'You work the membrane seams by hand. She leans into it.';
      render();
    },
    repairAll() {
      const { missing, cost, corrupt } = repairCost();
      if ((missing < 1 && !corrupt) || ctx.world.credits < cost) {
        ui.notice = missing < 1 && !corrupt ? 'She reads whole on every channel.' : 'Not enough UU for the yard.';
        render();
        return;
      }
      ctx.world.credits -= cost;
      const p = ctx.player;
      // Re-true scrambled channels against the class baseline, then make her
      // whole. Without this a NaN channel would be copied right back by the
      // repair that was meant to fix it.
      const fresh = createShipState(SHIP_CLASSES[p.classKey] ? p.classKey : 'light', { name: p.name, faction: p.faction });
      for (const key of Object.keys(REPAIR_RATES)) {
        const maxKey = key + 'Max';
        if (!Number.isFinite(p[maxKey])) p[maxKey] = fresh[maxKey];
        p[key] = p[maxKey];
      }
      p.engineOut = false; p.disabled = false;
      ui.notice = 'Yard crews make her whole.';
      render();
    },
    buyCargoRack() {
      const used = Math.round((ctx.cargoCapacity - 20) / CARGO_UPGRADE_STEP);
      if (used >= CARGO_UPGRADE_MAX) { ui.notice = 'Hold racks are maxed out.'; render(); return; }
      if (ctx.world.credits < CARGO_UPGRADE_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= CARGO_UPGRADE_COST;
      ctx.cargoCapacity += CARGO_UPGRADE_STEP;
      ui.notice = `Hold racks extended — capacity ${ctx.cargoCapacity}.`;
      render();
    },
    buyScanner() {
      if (ctx.world.scanner >= 1) { ui.notice = 'Wolfeye Mk I already installed.'; render(); return; }
      if (ctx.world.credits < SCANNER_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= SCANNER_COST;
      ctx.world.scanner = 1;
      ui.notice = 'Wolfeye Mk I bolted in. Their nerve reads as numbers now.';
      render();
    },
    buyScanner2() {
      if (ctx.world.scanner >= 2) { ui.notice = 'Wolfeye Mk II already installed.'; render(); return; }
      if (ctx.world.scanner < 1) { ui.notice = 'The Mk II lattice bolts onto a Mk I eye. Buy that first.'; render(); return; }
      if (ctx.world.credits < SCANNER2_COST) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= SCANNER2_COST;
      ctx.world.scanner = 2;
      ui.notice = 'Wolfeye Mk II bolted in. Their guns show through their skins.';
      render();
    },
    // Wave 30: Q-ship path (§29) — guns that don't show on a manifest.
    buyConcealedMounts() {
      if (ctx.world.concealedMounts === true) { ui.notice = 'Concealed mounts already fitted.'; render(); return; }
      if (ctx.world.credits < HIDDEN_MOUNTS.cost) { ui.notice = 'Not enough UU.'; render(); return; }
      ctx.world.credits -= HIDDEN_MOUNTS.cost;
      ctx.world.concealedMounts = true;
      ui.notice = 'The yard keeps it off the books. Her guns sleep where a manifest can\'t see them.';
      render();
    },
  };

  // ---- market ----
  // Wave 11: deep-rim keepers (the two-column ledger family, contacts.js).
  function isKeeper(contact) {
    return contact.role === 'dockmaster'
      && (contact.system === 'hollowreach' || contact.system === 'hush' || contact.system === 'verge');
  }
  /** Trust of this dock's dockmaster (0 when nobody here knows you). */
  function keeperTrustHere() {
    const dm = contactsForSystem(ctx, currentId).find((c) => c.role === 'dockmaster');
    return dm ? dm.trust : 0;
  }
  // Wave 9/11: hermit scarcity markup, waived once the local keeper trusts
  // the pilot. One helper so the PRICE cell and the charge in tryTrade can
  // never disagree.
  function hermitBuyMult() {
    return currentDef.hermit && keeperTrustHere() < KEEPER_COMP_TRUST ? HERMIT.buyMult : 1;
  }
  function tryTrade(key, qty, buying) {
    const com = COMMODITIES[key];
    const price = priceOf(ctx, key);
    const fx = epicEffects(ctx, currentDef.faction); // wave-6 epic standing
    if (!com.legal && !restrictedAllowed(ctx, ui.fenceUnlocked)) {
      ui.notice = '“Not while the Compact watches,” the dockmaster says. “Come back when the right people notice you.”';
      return;
    }
    if (buying) {
      // Wave 9: hermit stations charge scarcity prices (HERMIT.buyMult).
      // Wave 11: a keeper who trusts the pilot (60+) waives the markup.
      // Wave 24: the faction service modifier composes multiplicatively AFTER
      // the epic multiplier (epic first, faction second); hermit applies last
      // and is authored-only, so the two never stack. The PRICE cell in
      // renderMarket uses this exact chain (wave-11 agreement precedent).
      const unit = Math.round(price * (fx.buyMult ?? 1) * (currentService?.buyMult ?? 1) * hermitBuyMult());
      const cost = unit * qty;
      if (ctx.world.credits < cost) { ui.notice = 'Not enough UU.'; return; }
      if (cargoUsed(ctx) + qty > ctx.cargoCapacity) { ui.notice = 'Hold is full.'; return; }
      ctx.world.credits -= cost;
      addCargo(ctx, key, qty);
      ui.notice = `Bought ${qty} ${com.name} for ${cost} UU.`;
    } else {
      if (holdUnits(ctx, key) < qty) { ui.notice = `No ${com.name} in the hold.`; return; }
      // Sell-only goodwill: a positive faction rank pays +2%/tier here (§12.x).
      const tier = rankFor(ctx.world.reputation[currentDef.faction] ?? 0).tier;
      let unit = price * (fx.sellMult ?? 1) * (tier > 0 ? 1 + 0.02 * tier : 1);
      // Wave 24: the faction service modifier composes multiplicatively AFTER
      // the epic multiplier (epic first, faction second) — generated systems
      // only; the authored six are guarded out of currentService.
      if (currentService) unit *= currentService.sellMult ?? 1;
      // Wave 9: hermit stations pay a premium for anything hauled out this far.
      if (currentDef.hermit) unit *= HERMIT.sellMult;
      // Epic standing on patent stock stacks with the fixer's brokered rate.
      if (key === 'restrictedComponents') unit *= fx.restrictedSellMult ?? 1;
      // Fixer brokered: at tradesRestricted stations a trusted fixer (30+)
      // skims a better rate on patent stock, and every sale buys trust (§12.x).
      let fixer = null;
      if (key === 'restrictedComponents' && stationAlwaysTradesRestricted(ctx)) {
        for (const c of contactsForSystem(ctx, currentId)) {
          if (c.role === 'fixer') { fixer = c; break; }
        }
        if (fixer && fixer.trust >= FIXER_CUT_TRUST) unit *= FIXER_MARKUP;
      }
      const payout = Math.round(unit * qty);
      removeCargo(ctx, key, qty);
      ctx.world.credits += payout;
      if (fixer) bumpTrust(ctx, fixer, FIXER_TRUST_PER_SALE);
      ui.notice = `Sold ${qty} ${com.name} for ${payout} UU.`;
    }
    // Wave 9: first real trade at a hermit station is a milestone. Replicates
    // world.js fireMilestone semantics — world.milestones is the shared
    // persisted list, hud.js consumes the 'milestone' event. Early returns
    // above mean only a successful trade (credits moved) reaches this.
    if (currentDef.hermit && !ctx.world.milestones.includes('hermitMarket')) {
      ctx.world.milestones.push('hermitMarket');
      ctx.emit('milestone', { id: 'hermitMarket', line: HERMIT.line });
    }
  }

  function renderMarket(panel) {
    h('div', 'screen-sub', panel, 'MARKET — posted prices, no spread');
    const fx = epicEffects(ctx, currentDef.faction); // wave-6 epic standing
    const buyMult = hermitBuyMult(); // wave 11: same waived price the charge uses
    const table = h('div', 'market-table', panel);
    h('div', 'market-head', table, 'COMMODITY');
    h('div', 'market-head', table, 'STATUS');
    h('div', 'market-head', table, 'PRICE');
    h('div', 'market-head', table, 'HOLD');
    h('div', 'market-head market-head-actions', table, 'TRADE  (↑/↓ select · Q/W buy 1/5 · A/S sell 1/5)');
    COMMODITY_KEYS.forEach((key, i) => {
      const com = COMMODITIES[key];
      const sel = i === ui.marketSel ? ' market-row-sel' : '';
      h('div', 'market-cell' + sel, table, com.name);
      h('div', 'market-cell' + (com.legal ? '' : ' market-illegal') + sel, table, com.legal ? 'Legal' : 'RESTRICTED');
      h('div', 'market-cell' + sel, table, `${Math.round(priceOf(ctx, key) * (fx.buyMult ?? 1) * (currentService?.buyMult ?? 1) * buyMult)} UU`);
      h('div', 'market-cell' + sel, table, String(holdUnits(ctx, key)));
      const actions = h('div', 'market-cell market-actions' + sel, table);
      if (!com.legal && !restrictedAllowed(ctx, ui.fenceUnlocked)) {
        h('span', 'market-refusal', actions, 'trade refused');
      } else {
        btn(actions, '+1', () => { tryTrade(key, 1, true); render(); });
        btn(actions, '+5', () => { tryTrade(key, 5, true); render(); });
        btn(actions, '−1', () => { tryTrade(key, 1, false); render(); });
        btn(actions, '−5', () => { tryTrade(key, 5, false); render(); });
      }
    });
    if (stationAlwaysTradesRestricted(ctx)) {
      h('div', 'screen-note', panel,
        'Restricted components move openly here — Combine patent stock, licensed at the counter. No lockers, no questions.');
    } else if (!restrictedAllowed(ctx, ui.fenceUnlocked)) {
      h('div', 'screen-note', panel,
        `The dockmaster keeps the restricted locker closed. Fear ${ECON.fear.tributeOpensAt}+ or a burned Compact name opens it.`);
    }
    // Wave 24: the faction's market line, surfaced the way keeper-comp notes
    // are — one note line, not a new service.
    if (currentService?.buyMult || currentService?.sellMult) {
      h('div', 'screen-note', panel, currentService.line);
    }
  }

  // ---- jobs ----
  function acceptJob(job) {
    if (job.kind === 'ferry') {
      // The consignment is fronted FREE on accept — but only if it fits.
      if (cargoUsed(ctx) + FERRY_UNITS > ctx.cargoCapacity) {
        ui.notice = `No room for the consignment — free ${FERRY_UNITS} units of hold first.`;
        render();
        return;
      }
      job.originSystem = ctx.world.currentSystem;
      job.destSystem = otherSystemId(ctx, job.originSystem);
      // Wave 26: the quote becomes the agreement — stamped with the
      // destination dock's rates, JSON-plain on the job entry.
      job.payQuoted = jobPayFor(ctx, job.destSystem, job.reward);
      addCargo(ctx, 'provisions', FERRY_UNITS);
    } else if (job.kind === 'recovery') {
      // Cut the salvage pod loose at the wreck site (world.js keeps aftermath
      // positions JSON-plain; tolerate {x,y,z} or [x,y,z] here — live only).
      const entry = (ctx.world.aftermath || []).find((a) => a.id === job.wreckId);
      if (!entry) { ui.notice = 'The wreck has gone cold — nothing left to recover.'; render(); return; }
      const p = entry.position;
      _podPos.set(p.x ?? p[0] ?? 0, p.y ?? p[1] ?? 0, p.z ?? p[2] ?? 0);
      spawnPod(ctx, [{ commodity: 'refinedMetals', units: 2 }], _podPos);
      job.collected = false;
    }
    job.state = 'accepted';
    if (job.kind === 'haul') {
      // Cross-system contract: stamp where (and at what price) it was taken.
      job.originSystem = ctx.world.currentSystem;
      job.originPrice = priceOf(ctx, 'provisions');
      // Wave 26: the quote becomes the agreement — stamped with the
      // destination dock's rates, JSON-plain on the job entry.
      job.payQuoted = jobPayFor(ctx, otherSystemId(ctx, job.originSystem), Math.round(HAUL_UNITS * job.originPrice * HAUL_MARGIN));
    }
    ui.notice = `Accepted: ${job.title}`;
    render();
  }

  function renderJobs(panel) {
    h('div', 'screen-sub', panel, `JOBS BOARD — ${currentDef.station.name} postings`);
    // Wave 24: the faction's jobs line (same note-line precedent as the market).
    if (currentService?.jobPayMult) h('div', 'screen-note', panel, currentService.line);
    refreshBountyJob(ctx);
    syncPirateBounties(ctx, currentId);
    syncRecoveryJob(ctx, currentId);
    const aceHomeId = aceHomeSystem(ctx);
    boardJobs(ctx, currentId).forEach((job, i) => {
      const card = h('div', 'job-card', panel);
      h('div', 'job-title', card, `${i + 1}. ${job.title}`);
      h('div', 'job-detail', card, job.detail);
      let rewardLine;
      if (job.kind === 'haul') {
        const originId = job.state === 'accepted' ? (job.originSystem ?? currentId) : currentId;
        const destId = otherSystemId(ctx, originId);
        const destName = ctx.systems?.[destId]?.station?.name ?? 'the far station';
        const unitCost = job.state === 'accepted' && job.originPrice
          ? job.originPrice
          : priceOf(ctx, 'provisions');
        // Wave 26: offered cards quote the DESTINATION dock's rates; accepted
        // cards show the agreed snapshot (old saves fall back to the old math).
        const est = job.state === 'accepted'
          ? (job.payQuoted ?? jobPay(ctx, Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN)))
          : jobPayFor(ctx, destId, Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN));
        rewardLine = `Haul ${HAUL_UNITS} Provisions to ${destName} — pays ${est} UU (140% of buy cost)`;
      } else if (job.kind === 'ferry') {
        const destId = job.state === 'accepted' ? job.destSystem : otherSystemId(ctx, currentId);
        const destName = ctx.systems?.[destId]?.station?.name ?? 'the far station';
        // Wave 26: same quote/snapshot split as the haul line above.
        const ferryEst = job.state === 'accepted'
          ? (job.payQuoted ?? jobPay(ctx, job.reward))
          : jobPayFor(ctx, destId, job.reward);
        rewardLine = `Ferry ${FERRY_UNITS} fronted Provisions to ${destName} — pays ${ferryEst} UU, no buy-in`;
      } else if (job.kind === 'recovery') {
        rewardLine = `Scoop the salvage pod, redock here — pays ${jobPay(ctx, job.reward)} UU`;
      } else {
        rewardLine = `Reward: ${jobPay(ctx, job.reward)} UU${job.kind === 'patrol' ? ` · +${PATROL_REP} Freehold rep` : ''}`;
      }
      h('div', 'job-reward', card, rewardLine);
      if (job.id === 'bounty-ace' && job.state !== 'done' && currentId !== aceHomeId) {
        h('div', 'job-state', card,
          `He hunts in ${ctx.systems?.[aceHomeId]?.name ?? 'Freehold Drift'} — take the gate.`);
      }
      if (job.state === 'offered') {
        btn(card, `Accept (${i + 1})`, () => acceptJob(job));
      } else if (job.state === 'accepted') {
        let stateLine;
        if (job.kind === 'patrol') {
          stateLine = `ACCEPTED — ${job.progress}/${job.need}`;
        } else if (job.kind === 'haul') {
          const destName = ctx.systems?.[otherSystemId(ctx, job.originSystem ?? currentId)]?.station?.name ?? 'the far station';
          stateLine = `ACCEPTED — deliver to ${destName}`;
        } else if (job.kind === 'ferry') {
          const destName = ctx.systems?.[job.destSystem]?.station?.name ?? 'the far station';
          stateLine = `ACCEPTED — consignment to ${destName} (${holdUnits(ctx, 'provisions')}/${FERRY_UNITS} aboard)`;
        } else if (job.kind === 'recovery') {
          stateLine = job.collected
            ? 'ACCEPTED — salvage aboard, redock here'
            : 'ACCEPTED — pod adrift at the wreck site';
        } else {
          stateLine = 'ACCEPTED';
        }
        h('div', 'job-state job-accepted', card, stateLine);
      } else {
        h('div', 'job-state job-done', card, 'DONE');
      }
    });
  }

  // ---- bar (rumors: real incidents only — Witness Rule §8.7) ----
  function rumorLines() {
    const lines = [];
    const incidents = ctx.world.incidents || [];
    for (let i = incidents.length - 1; i >= 0 && lines.length < 3 + ui.barRound; i--) {
      const inc = incidents[i];
      const who = inc.name || 'a ship';
      const fac = inc.faction && inc.faction !== 'independent' ? ` ${inc.faction}` : '';
      if (inc.kind === 'destroyed') {
        lines.push(inc.causer === 'player'
          ? `Word in the bar: ${who} came apart in the lanes. They say a local did it — your name is starting to carry weight.`
          : `${who}${fac} got torn open out there. Dock crews pulled the beacon records; nobody flies that stretch casual anymore.`);
      } else if (inc.kind === 'surrendered') {
        lines.push(inc.causer === 'player'
          ? `They say ${who} struck colors and paid rather than fight you. The bar noticed.`
          : `${who}${fac} struck colors in the lane — ${inc.outcome ?? 'paid to walk away'}. Cheaper than dying, the dockmaster says.`);
      }
    }
    const ev = ctx.world.activeEvent;
    if (ev) {
      if (ev.kind === 'pirateBlockade') lines.push('Red Ledger crews are choking the approach lane. Traffic is thin and insurance is up.');
      else if (ev.kind === 'strikeRush') lines.push('A strike rush — every hold in the belt is full of ore and the refineries can’t keep pace.');
      else if (ev.kind === 'laborStrike') lines.push('Dockhands are on strike. Cargo moves slow and nobody talks fast.');
      else if (ev.kind === 'commodityGlut') lines.push('Glut on the market floor — prices are soft everywhere you look.');
    }
    if (lines.length === 0) {
      lines.push('Quiet night. The dock crews say the lanes have been calm — too calm, maybe.');
    }
    return lines;
  }

  function renderBar(panel) {
    const barName = currentId === 'veridian' ? 'THE GLASS CONCOURSE' : 'THE SODIUM LAMP';
    h('div', 'screen-sub', panel, `${barName} — dockside bar`);
    for (const line of rumorLines()) h('div', 'bar-rumor', panel, `“${line}”`);
    if (stationAlwaysTradesRestricted(ctx)) {
      h('div', 'bar-hint', panel,
        'A quiet word from the bartender: patent stock sells at the counter here, clean and licensed. The Combine asks nothing because the Combine already knows.');
    } else {
      h('div', 'bar-hint', panel,
        'A quiet word from the bartender: if the hold ever carries goods the Compact frowns on, ask for Mara at the repair bays. She knows a fence who pays 55–70% of book and asks nothing. Doors like that open when the right people notice you.');
    }
    btn(panel, `1 — Buy a round (${ROUND_COST} UU)`, act.buyRound);
  }

  // ---- feed & tend (bio.js agreed: station writes hunger/bond on purchase) ----
  function renderFeed(panel) {
    h('div', 'screen-sub', panel, 'FEED & TEND — the living ship');
    h('div', 'screen-note', panel,
      `Hunger ${Math.round(ctx.bio.hunger * 100)}% · Wounds ${Math.round(ctx.bio.wounds * 100)}% · Bond ${Math.round(ctx.bio.bond * 100)}%. She heals faster berthed here.`);
    const row = h('div', 'screen-btnrow', panel);
    btn(row, `1 — Feed biomass (${FEED_COST} UU)`, act.feedBiomass);
    btn(row, '2 — Feed living rock (from hold)', act.feedRock);
    btn(row, `3 — Tend wounds (${TEND_COST} UU)`, act.tendWounds);
  }

  // ---- repair ----
  function repairCost() {
    const p = ctx.player;
    // Wave 24: the faction yard rate composes multiplicatively AFTER the epic
    // multiplier (epic first, faction second); a keeper comp still zeroes the
    // itemized total below, and the authored six hold no faction entry.
    const repairMult = (epicEffects(ctx, currentDef.faction).repairMult ?? 1) // wave-6 epic standing
      * (currentService?.repairMult ?? 1);
    const parts = [];
    let missing = 0;
    let cost = 0;
    let corrupt = false;
    if (p) {
      for (const key of Object.keys(REPAIR_RATES)) {
        const max = p[key + 'Max'];
        const cur = p[key];
        // Non-finite reads mark a corrupt record (e.g. a save whose NaNs JSON
        // stored as null). Corruption is not billable — repairAll re-trues
        // those channels against the class baseline instead.
        if (!Number.isFinite(max) || !Number.isFinite(cur)) { corrupt = true; continue; }
        const lack = Math.max(0, max - cur);
        if (lack < 1) continue;
        const c = Math.ceil(lack * REPAIR_RATES[key] * repairMult);
        parts.push({ key, lack: Math.round(lack), cost: c });
        missing += lack;
        cost += c;
      }
    }
    // Wave 11: a keeper's called-in favor comps the yard for this berth
    // visit — the itemized lines zero out and repairAll deducts nothing.
    const comped = !!ctx.station.keeperComp;
    if (comped) {
      for (const part of parts) part.cost = 0;
      cost = 0;
    }
    return { missing, cost, parts, corrupt, comped };
  }
  function renderRepair(panel) {
    h('div', 'screen-sub', panel, 'REPAIR BAYS — hull & systems');
    // Wave 24: the faction's yard line (the 'Comped by the keepers' precedent).
    if (currentService?.repairMult) h('div', 'screen-note', panel, currentService.line);
    const { missing, cost, parts, corrupt, comped } = repairCost();
    if (missing < 1 && !corrupt) {
      h('div', 'screen-note', panel, 'She reads whole on every channel. Nothing to fix.');
      return;
    }
    for (const part of parts) {
      h('div', 'screen-note', panel, `${part.key} — ${part.lack} integrity down · ${part.cost} UU`);
    }
    if (comped) h('div', 'screen-note', panel, ui.compNote ?? 'Comped by the keepers');
    if (corrupt) {
      h('div', 'screen-note', panel, 'Yard diagnostic flags scrambled channels — the refit will re-true them, no charge.');
    }
    h('div', 'screen-note', panel, `Yard total: ${cost} UU.`);
    btn(panel, `1 — Repair all (${cost} UU)`, act.repairAll);
  }

  // ---- outfitting ----
  function renderOutfitting(panel) {
    h('div', 'screen-sub', panel, 'OUTFITTING — hull work & instruments');
    const used = Math.round((ctx.cargoCapacity - 20) / CARGO_UPGRADE_STEP);
    const row1 = h('div', 'screen-btnrow', panel);
    if (used >= CARGO_UPGRADE_MAX) {
      h('div', 'screen-note', row1, `Hold racks maxed out at ${ctx.cargoCapacity} units.`);
    } else {
      btn(row1, `1 — Expand hold +${CARGO_UPGRADE_STEP} (${CARGO_UPGRADE_COST} UU) [${used}/${CARGO_UPGRADE_MAX}]`, act.buyCargoRack);
    }
    const row2 = h('div', 'screen-btnrow', panel);
    if (ctx.world.scanner >= 1) {
      h('div', 'screen-note', row2, 'Wolfeye Mk I installed — target resolve reads numerically on the HUD.');
    } else {
      btn(row2, `2 — Wolfeye Mk I scanner (${SCANNER_COST} UU)`, act.buyScanner);
    }
    // Wave 30: concealed mounts (§29) — the Q-ship bluff enabler, bought once.
    const row3 = h('div', 'screen-btnrow', panel);
    if (ctx.world.concealedMounts === true) {
      h('div', 'screen-note', row3, 'Concealed mounts fitted — her guns sleep where a manifest can\'t see them.');
    } else {
      btn(row3, `3 — Concealed mounts — guns that don't show on a manifest (${HIDDEN_MOUNTS.cost} UU)`, act.buyConcealedMounts);
    }
    // Wave 31: Mk II eye (§30) — reads the masks back, needs the Mk I socket.
    const row4 = h('div', 'screen-btnrow', panel);
    if (ctx.world.scanner >= 2) {
      h('div', 'screen-note', row4, 'Wolfeye Mk II installed — hidden gunports read on the target bracket.');
    } else if (ctx.world.scanner === 1) {
      btn(row4, `4 — Wolfeye Mk II scanner (${SCANNER2_COST} UU)`, act.buyScanner2);
    } else {
      h('div', 'screen-note', row4, 'Wolfeye Mk II needs the Mk I eye in the socket first.');
    }
  }

  // ---- people (contacts: dockmaster/fence/fixer of this dock, §12.x) ----
  function renderPeople(panel) {
    h('div', 'screen-sub', panel, 'PEOPLE — who runs this dock');
    const people = contactsForSystem(ctx, currentId);
    if (people.length === 0) {
      h('div', 'screen-note', panel, 'Faces blur past the berth lights. Nobody here knows you yet.');
      return;
    }
    // Wave 16: the pilot's own recorded chart marks (wave 14), surfaced
    // once per dock on keeper cards only — computed once for the loop.
    const chartNotes = chartedMarkNotes(ctx);
    // Wave 41: two studies per faction, up to three contacts per dock — a
    // roster must never show one face twice. The first claim on a variant
    // keeps it; a collider takes the free study. Roster order is stable
    // (buildRoster), so each face stays put across sessions.
    const facesTaken = new Set();
    for (const contact of people) {
      const card = h('div', 'people-card', panel);
      // Wave 41: faction portrait in a shared head row (img + text).
      const head = h('div', 'people-head', card);
      let portrait = portraitFor(currentDef.faction, contact.id);
      if (portrait && facesTaken.has(portrait.variant)) {
        const free = portrait.variant === 'a' ? 'b' : 'a';
        if (!facesTaken.has(free)) portrait = portraitVariant(currentDef.faction, free);
      }
      if (portrait) facesTaken.add(portrait.variant);
      if (portrait) {
        const img = h('img', 'people-portrait', head);
        img.src = portrait.src;
        img.alt = `${contact.name}, ${contact.role}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 64;
        img.height = 64;
      }
      const headtext = h('div', 'people-headtext', head);
      h('div', 'people-name', headtext, contact.name);
      h('div', 'people-meta', headtext,
        `${contact.role} · trust ${Math.round(contact.trust)} · favors ${contact.favors}`);
      const recognition = recognitionLine(ctx, contact);
      if (recognition) h('div', 'people-recognition', card, `“${recognition}”`);
      // Wave 11: at a hermit keep a trusted pilot sees the comp honored.
      if (currentDef.hermit && isKeeper(contact) && contact.trust >= KEEPER_COMP_TRUST) {
        h('div', 'people-note', card, 'The keepers comp a trusted pilot — no scarcity markup at this dock.');
      }
      // Wave 16: keeper cards only, regardless of trust — the pilot
      // reviewing their own recorded marks at dock, never a clue id/text.
      if (isKeeper(contact) && chartNotes.length > 0) {
        const chart = h('div', 'people-chart', card);
        h('div', 'people-chart-title', chart, 'CHART MARKS — pages still waiting');
        for (const note of chartNotes) {
          h('div', 'people-chart-line', chart, `◇ ${note.lmName} — ${note.systemName}`);
        }
      }
      const row = h('div', 'screen-btnrow people-actions', card);
      btn(row, 'Ask around', () => {
        // Wave 11: a keeper reads the ledger first — a recorded reading of
        // what still waits, before any rumor.
        ui.notice = (isKeeper(contact) ? keeperLedgerLine(ctx, contact) : null)
          ?? rumorFor(ctx, contact)
          ?? 'Nothing new reaches the bar.';
        render();
      });
      if (isKeeper(contact)) {
        // Wave 11: a keeper's marker comps the yard — same session lifecycle
        // as the fence's locker call (reset in undock()).
        btn(row, 'Call in a favor', () => {
          if (contact.favors <= 0) {
            ui.notice = `${contact.name} spreads their hands. “You hold no marker with me.”`;
          } else if (spendFavor(ctx, contact)) {
            ui.keeperComp = true;
            ctx.station.keeperComp = true;
            ui.compNote = 'Comped by the keepers';
            ui.notice = `${contact.name} waves the yard off. “The keepers comp this dock. Mend your ship.”`;
          }
          render();
        });
      }
      if (contact.role === 'fence') {
        btn(row, 'Call in a favor', () => {
          if (contact.favors <= 0) {
            ui.notice = `${contact.name} spreads their hands. “You hold no marker with me.”`;
          } else if (spendFavor(ctx, contact)) {
            ui.fenceUnlocked = true;
            ctx.station.fenceUnlocked = true;
            ui.notice = `${contact.name} makes one call. The restricted locker will be... open to you, this visit.`;
          }
          render();
        });
      }
      // Wave 26: a generated-system dockmaster's marker comps the yard — the
      // same session lifecycle as the keeper comp (reset in undock()), spoken
      // in the faction's FACTION_COMP voice. Keepers keep their own branch
      // above; the authored six fall through by id.
      if (!isKeeper(contact) && contact.role === 'dockmaster' && !AUTHORED_SYSTEMS[currentId]) {
        btn(row, 'Call in a favor', () => {
          if (contact.favors <= 0) {
            ui.notice = `${contact.name} spreads their hands. “You hold no marker with me.”`;
          } else if (spendFavor(ctx, contact)) {
            ui.keeperComp = true;
            ctx.station.keeperComp = true;
            ui.compNote = FACTION_COMP[currentDef.faction];
            ui.notice = `${contact.name} waves the yard off. “${ui.compNote}”`;
          }
          render();
        });
      }
    }
  }

  // ---- standing (faction epic progress for this dock's flag, wave 6) ----
  function renderEpics(panel) {
    const epic = EPICS[currentDef.faction];
    h('div', 'screen-sub', panel, epic ? `STANDING — ${epic.name}` : 'STANDING');
    if (!epic) { // independents keep no epic — guard anyway
      h('div', 'screen-note', panel, 'No standing here.');
      return;
    }
    const achieved = ctx.world.epics?.[currentDef.faction] ?? 0;
    const clues = ctx.world.mystery?.found?.length ?? 0;
    epic.stages.forEach((stage, i) => {
      const n = i + 1;
      if (n <= achieved) {
        h('div', 'screen-note', panel, `✓ ${stage.line}`);
      } else if (n === achieved + 1) {
        // Hint names the first UNMET requirement — capstones (wave 7) gate on
        // landmarks, mystery flags, credits, or fear, not just rank/echoes.
        const req = stage.requires;
        const rep = ctx.world.reputation?.[currentDef.faction] ?? 0;
        const mystery = ctx.world.mystery;
        let hint = 'Within reach';
        if (req.rankTier != null && rankFor(rep).tier < req.rankTier) hint = `Rank: ${rankNameForTier(req.rankTier)}`;
        else if (req.cluesFound != null && clues < req.cluesFound) hint = `Echoes found: ${clues}/${req.cluesFound}`;
        else if (req.landmarkVisited != null && (mystery?.visited?.indexOf(req.landmarkVisited) ?? -1) < 0) hint = 'A landmark waits to be witnessed';
        else if (req.converged === true && mystery?.converged !== true) hint = 'The mystery still calls';
        else if (req.deepened === true && mystery?.deepened !== true) hint = 'The mystery has a further rung';
        else if (req.credits != null && (ctx.world.credits ?? 0) < req.credits) hint = `Holdings: ${Math.floor(ctx.world.credits ?? 0)}/${req.credits} UU`;
        else if (req.fear != null && (ctx.world.fear ?? 0) < req.fear) hint = `Fear: ${ctx.world.fear ?? 0}/${req.fear}`;
        h('div', 'screen-note', panel, `→ NEXT — ${hint}`);
      } else {
        h('div', 'screen-note', panel, '··· locked');
      }
    });
    const fx = epicEffects(ctx, currentDef.faction);
    const keys = Object.keys(fx);
    if (keys.length === 0) {
      h('div', 'screen-note', panel, 'No standing yet. The first stage is closer than it looks.');
    } else {
      h('div', 'screen-sub', panel, 'ACTIVE STANDING');
      for (const key of keys) {
        const line = epicEffectLine(key, fx[key]);
        if (line) h('div', 'screen-note', panel, line);
      }
    }
  }

  function renderLaunch(panel) {
    h('div', 'screen-sub', panel, 'LAUNCH');
    h('div', 'screen-note', panel, 'Berth clamps release on your word. The lane is yours.');
    btn(panel, '1 — Launch', () => undock(), 'screen-btn screen-btn-warm');
  }

  const RENDERERS = {
    market: renderMarket,
    jobs: renderJobs,
    bar: renderBar,
    feed: renderFeed,
    repair: renderRepair,
    outfitting: renderOutfitting,
    people: renderPeople,
    launch: renderLaunch,
    epics: renderEpics,
  };

  let renderedView = null; // 'level:service' of the last render
  function render() {
    // The panel is the scroller (screens.css .screen-panel overflow-y:auto)
    // and the 1 s docked refresh rebuilds it from scratch — carry scrollTop
    // across the rebuild or the board snaps to the top mid-scroll. Only
    // same-view rebuilds restore: navigation (Back / service select) resets
    // to the top as expected.
    const view = `${ui.level}:${ui.service}`;
    const oldPanel = overlay.firstElementChild;
    const scrollY = oldPanel && renderedView === view ? oldPanel.scrollTop : 0;
    overlay.textContent = '';
    const panel = h('div', 'screen-panel station-panel', overlay);

    const factionName = FACTIONS[currentDef.faction]?.name ?? currentDef.faction;
    const head = h('div', 'station-head', panel);
    h('div', 'station-title', head, currentDef.station.name.toUpperCase());
    h('div', 'station-faction', head, `${factionName.toUpperCase()} · BERTH 7`);
    h('div', 'station-ship', head,
      ctx.world.shipName ? `“${ctx.world.shipName}” made fast` : 'ship made fast');
    h('div', 'station-credits', head,
      `CREDITS ${ctx.world.credits} UU · HOLD ${cargoUsed(ctx)}/${ctx.cargoCapacity}`);

    if (ui.level === 1) {
      const menu = h('div', 'station-menu', panel);
      const labels = ['Market', 'Jobs board', 'Bar', 'Feed & tend', 'Repair', 'Outfitting', 'People', 'Launch', 'Standing'];
      DOCK_KEY_SERVICES.forEach((key, i) => {
        btn(menu, `${i + 1} — ${labels[i]}`, () => selectService(key),
          key === 'launch' ? 'screen-btn screen-btn-warm' : 'screen-btn');
      });
      // Rank surface: how this dock's faction reads you right now (§12.x).
      const rep = ctx.world.reputation[currentDef.faction] ?? 0;
      h('div', 'station-rank', panel,
        `${factionName}: ${rankFor(rep).name} (${rep >= 0 ? '+' : ''}${Math.round(rep)} rep)`);
      h('div', 'screen-legend', panel, '1-9 select service · Esc/B launch');
    } else {
      const back = h('div', 'station-back', panel);
      btn(back, '← Back (Esc)', () => { ui.level = 1; ui.service = null; ui.notice = ''; render(); });
      RENDERERS[ui.service](panel);
      h('div', 'screen-legend', panel, 'Esc back · Esc again / B launch');
    }

    if (ui.notice) h('div', 'station-notice', panel, ui.notice);
    panel.scrollTop = scrollY; // after content: clamped against the new scrollHeight
    renderedView = view;
  }

  function selectService(key) {
    if (key === 'launch') { undock(); return; }
    ui.level = 2;
    ui.service = key;
    ui.notice = '';
    render();
  }

  function dock() {
    ctx.flags.docked = true;
    ui.open = true;
    ui.level = 1;
    ui.service = null;
    ui.notice = '';
    overlay.style.display = 'flex';
    ctx.emit('docked');
    render();
  }

  function undock() {
    ctx.flags.docked = false;
    ui.open = false;
    ui.fenceUnlocked = false; // the fence's call only covers this berth visit
    ctx.station.fenceUnlocked = false;
    ui.keeperComp = false; // the keepers' comp only covers this berth visit
    ctx.station.keeperComp = false;
    ui.compNote = null; // the comp's voice only covers this berth visit (wave 26)
    overlay.style.display = 'none';
    ctx.emit('undocked');
  }

  // UI-level keyboard (menu chrome — never writes ctx.input).
  window.addEventListener('keydown', (e) => {
    if (!ui.open) return;
    const code = e.code;
    if (ui.level === 1) {
      if (code === 'Escape' || code === 'KeyB') { undock(); return; }
      if (code.startsWith('Digit')) {
        const i = Number(code.slice(5)) - 1;
        if (i >= 0 && i < DOCK_KEY_SERVICES.length) selectService(DOCK_KEY_SERVICES[i]);
      }
      return;
    }
    // level 2
    if (code === 'Escape') { ui.level = 1; ui.service = null; ui.notice = ''; render(); return; }
    if (code === 'KeyB') { undock(); return; }
    if (ui.service === 'market') {
      if (code === 'ArrowUp') { ui.marketSel = (ui.marketSel + COMMODITY_KEYS.length - 1) % COMMODITY_KEYS.length; render(); }
      else if (code === 'ArrowDown') { ui.marketSel = (ui.marketSel + 1) % COMMODITY_KEYS.length; render(); }
      else if (code === 'KeyQ' || code === 'KeyW' || code === 'KeyA' || code === 'KeyS') {
        const qty = code === 'KeyQ' || code === 'KeyA' ? 1 : 5;
        tryTrade(COMMODITY_KEYS[ui.marketSel], qty, code === 'KeyQ' || code === 'KeyW');
        render();
      }
      return;
    }
    if (!code.startsWith('Digit')) return;
    const n = Number(code.slice(5));
    if (ui.service === 'jobs') {
      const job = boardJobs(ctx, ctx.world.currentSystem)[n - 1];
      if (job && job.state === 'offered') acceptJob(job);
    } else if (ui.service === 'bar') {
      if (n === 1) act.buyRound();
    } else if (ui.service === 'feed') {
      if (n === 1) act.feedBiomass();
      else if (n === 2) act.feedRock();
      else if (n === 3) act.tendWounds();
    } else if (ui.service === 'repair') {
      if (n === 1) act.repairAll();
    } else if (ui.service === 'outfitting') {
      if (n === 1) act.buyCargoRack();
      else if (n === 2) act.buyScanner();
      else if (n === 3) act.buyConcealedMounts();
      else if (n === 4) act.buyScanner2();
    } else if (ui.service === 'launch') {
      if (n === 1) undock();
    }
  });

  // ------------------------------------------------------------ update ----

  let jobTick = 0;
  let refreshTick = 0;

  return {
    update(dt) {
      // System swap: rebuild identity/mesh when a jump (or a save restore in
      // another system) lands. Consumed via lastEvents like every module.
      let loadedTo = null;
      for (const ev of ctx.lastEvents) {
        if (ev.type === 'systemLoaded' && ev.to && ev.to !== currentId) loadedTo = ev.to;
      }
      if (loadedTo) rebuild(loadedTo);

      const reducedMotion = ctx.settings?.reducedMotion === true;



      // Mesh life: ring spin, running-light pulse, beacon blink, glow breathe.
      // Frozen at rest pose under reducedMotion (angle kept, pulses at base,
      // beacon lit) — lightColor is the un-pulsed base, stashed at build.
      if (!reducedMotion) {
        mesh.ringGroup.rotation.y += RING_SPIN * dt;
        _pulse.copy(mesh.lightColor).multiplyScalar(0.72 + 0.28 * Math.sin(ctx.elapsed * 2));
        mesh.lightMat.color.copy(_pulse);
        mesh.beaconMat.visible = (ctx.elapsed % 1.6) < 1.05;
        mesh.glowMat.opacity = 0.3 + 0.12 * Math.sin(ctx.elapsed * 0.8);
        mesh.beaconGlowMat.opacity = mesh.beaconMat.visible ? 0.85 : 0.1;
      } else {
        mesh.lightMat.color.copy(mesh.lightColor);
        mesh.beaconMat.visible = true;
        mesh.glowMat.opacity = 0.3;
        mesh.beaconGlowMat.opacity = 0.85;
      }
      if (mesh.organicParts) animateOrganic(mesh.organicParts, ctx.elapsed, ctx.settings.reducedMotion); // wave 27

      // Docking zone (hud.js reads ctx.station; we emit nothing for prompts).
      const shipObj = ctx.ship.object;
      const inZone = shipObj ? shipObj.position.distanceTo(stationPos) <= U.DOCK_RANGE : false;
      ctx.station.inZone = inZone;

      if (!ctx.flags.docked) {
        if (inZone && ctx.input.dockPressed) dock();
      } else {
        // Periodic refresh so prices/jobs/credits stay live behind the panel.
        refreshTick += dt;
        if (refreshTick >= 1) { refreshTick = 0; render(); }
      }

      // Job tracking runs docked or not.
      tickPatrolJob(ctx);
      tickRecoveryCollect(ctx);
      jobTick += dt;
      if (jobTick >= 0.5) { jobTick = 0; tickDeliveryJobs(ctx, ui); }
    },
  };
}
