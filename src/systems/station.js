import * as THREE from 'three';
import '../ui/screens.css';
import { U, COMMODITIES, ECON, FACTIONS, EPICS, RANK_LADDER, rankFor, createShipState, SHIP_CLASSES, HERMIT } from '../game/state.js';
import { contactsForSystem, bumpTrust, addFavor, spendFavor, rumorFor, recognitionLine, keeperLedgerLine, chartedMarkNotes, KEEPER_COMP_TRUST } from '../game/contacts.js';
import { spawnPod } from '../game/pods.js';
import { epicEffects } from '../game/epics.js';

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
 * Per-system material schemes (§18.2). Freehold: rust hulls, sodium running
 * lights, warm amber glow. Veridian: white composite hulls, cyan corporate
 * strips, cool glow. Unknown systems derive a neutral scheme from
 * def.station.palette.
 */
const SCHEMES = {
  freehold: {
    hull: 0x8a5a34, hullEmissive: 0x140a04, hullMetalness: 0.55, hullRoughness: 0.6,
    dark: 0x3a2e24, darkEmissive: 0x0a0603, darkMetalness: 0.6, darkRoughness: 0.7,
    light: 0xffb454, beacon: 0xffdca0,
    glowInner: 'rgba(255,190,110,0.85)', glowOuter: 'rgba(255,140,40,0)',
    beaconGlowInner: 'rgba(255,230,180,0.95)', beaconGlowOuter: 'rgba(255,170,60,0)',
  },
  veridian: {
    hull: 0xdfe7ee, hullEmissive: 0x0a0f12, hullMetalness: 0.3, hullRoughness: 0.35,
    dark: 0x55646f, darkEmissive: 0x060a0d, darkMetalness: 0.5, darkRoughness: 0.5,
    light: 0x6fd0e0, beacon: 0xd8f6ff,
    glowInner: 'rgba(150,225,245,0.8)', glowOuter: 'rgba(60,160,200,0)',
    beaconGlowInner: 'rgba(220,250,255,0.95)', beaconGlowOuter: 'rgba(110,210,235,0)',
  },
};

function schemeFor(systemId, def) {
  const known = SCHEMES[systemId];
  if (known) return known;
  const c = new THREE.Color(def.station?.palette ?? 0x9aa7b8);
  const r = Math.round(c.r * 255), g = Math.round(c.g * 255), b = Math.round(c.b * 255);
  return {
    hull: 0x8a8f96, hullEmissive: 0x0a0a0c, hullMetalness: 0.5, hullRoughness: 0.55,
    dark: 0x3a3f45, darkEmissive: 0x060608, darkMetalness: 0.55, darkRoughness: 0.65,
    light: c.getHex(), beacon: 0xffffff,
    glowInner: `rgba(${r},${g},${b},0.8)`, glowOuter: `rgba(${r},${g},${b},0)`,
    beaconGlowInner: 'rgba(255,255,255,0.95)', beaconGlowOuter: `rgba(${r},${g},${b},0)`,
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
  const scheme = schemeFor(systemId, def);
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

  // Central spindle.
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.4, 84, 12), rustMat);
  group.add(spindle);
  const dockingArm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 22), darkMat);
  dockingArm.position.set(0, -6, 14);
  group.add(dockingArm);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), beaconMat);
  beacon.position.set(0, 45, 0);
  group.add(beacon);

  // Rotating habitat ring (spins about the spindle axis).
  const ringGroup = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(30, 2.6, 10, 56), rustMat);
  ring.rotation.x = Math.PI / 2;
  ringGroup.add(ring);
  const habGeo = new THREE.BoxGeometry(9, 5, 5.5);
  const lightGeo = new THREE.SphereGeometry(0.85, 8, 6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const hab = new THREE.Mesh(habGeo, darkMat);
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

  // Habitat drums on the spindle with window bands.
  const drumGeo = new THREE.CylinderGeometry(6, 6, 13, 14);
  const bandGeo = new THREE.TorusGeometry(6.05, 0.18, 6, 28);
  for (const y of [-19, 15]) {
    const drum = new THREE.Mesh(drumGeo, rustMat);
    drum.position.y = y;
    group.add(drum);
    const band = new THREE.Mesh(bandGeo, lightMat);
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

/** Remove the station mesh and release every GPU resource it holds. */
function teardownMesh(ctx, mesh) {
  ctx.scene.remove(mesh.group);
  mesh.group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mat = obj.material;
    if (mat) {
      if (mat.map) mat.map.dispose();
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
 */
function jobPay(ctx, base) {
  const faction = ctx.systems?.[ctx.world.currentSystem]?.faction;
  const mult = epicEffects(ctx, faction).jobPayMult ?? 1;
  return Math.round(base * mult);
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
      const origin = job.originSystem ?? 'freehold';
      if (ctx.world.currentSystem === origin) continue; // must reach the OTHER system
      if (holdUnits(ctx, 'provisions') < HAUL_UNITS) continue;
      removeCargo(ctx, 'provisions', HAUL_UNITS);
      const unitCost = job.originPrice || priceOf(ctx, 'provisions');
      const reward = jobPay(ctx, Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN));
      ctx.world.credits += reward;
      const destName = ctx.systems?.[ctx.world.currentSystem]?.station?.name ?? 'the far station';
      completeJob(ctx, job, `Provisions delivered — ${reward} UU paid at 140% of buy cost by ${destName}.`);
    } else if (job.kind === 'ferry' && ctx.flags.docked) {
      if (ctx.world.currentSystem !== job.destSystem) continue; // only the named far station pays
      if (holdUnits(ctx, 'provisions') >= FERRY_UNITS) {
        removeCargo(ctx, 'provisions', FERRY_UNITS);
        const ferryPay = jobPay(ctx, job.reward);
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
      const unit = Math.round(price * (fx.buyMult ?? 1) * hermitBuyMult());
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
      h('div', 'market-cell' + sel, table, `${Math.round(priceOf(ctx, key) * (fx.buyMult ?? 1) * buyMult)} UU`);
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
    }
    ui.notice = `Accepted: ${job.title}`;
    render();
  }

  function renderJobs(panel) {
    h('div', 'screen-sub', panel, `JOBS BOARD — ${currentDef.station.name} postings`);
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
        const est = jobPay(ctx, Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN));
        rewardLine = `Haul ${HAUL_UNITS} Provisions to ${destName} — pays ${est} UU (140% of buy cost)`;
      } else if (job.kind === 'ferry') {
        const destId = job.state === 'accepted' ? job.destSystem : otherSystemId(ctx, currentId);
        const destName = ctx.systems?.[destId]?.station?.name ?? 'the far station';
        rewardLine = `Ferry ${FERRY_UNITS} fronted Provisions to ${destName} — pays ${jobPay(ctx, job.reward)} UU, no buy-in`;
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
    const repairMult = epicEffects(ctx, currentDef.faction).repairMult ?? 1; // wave-6 epic standing
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
    const { missing, cost, parts, corrupt, comped } = repairCost();
    if (missing < 1 && !corrupt) {
      h('div', 'screen-note', panel, 'She reads whole on every channel. Nothing to fix.');
      return;
    }
    for (const part of parts) {
      h('div', 'screen-note', panel, `${part.key} — ${part.lack} integrity down · ${part.cost} UU`);
    }
    if (comped) h('div', 'screen-note', panel, 'Comped by the keepers');
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
    for (const contact of people) {
      const card = h('div', 'people-card', panel);
      h('div', 'people-name', card, contact.name);
      h('div', 'people-meta', card,
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

  function render() {
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

      // Mesh life: ring spin, running-light pulse, beacon blink, glow breathe.
      mesh.ringGroup.rotation.y += RING_SPIN * dt;
      _pulse.copy(mesh.lightColor).multiplyScalar(0.72 + 0.28 * Math.sin(ctx.elapsed * 2));
      mesh.lightMat.color.copy(_pulse);
      mesh.beaconMat.visible = (ctx.elapsed % 1.6) < 1.05;
      mesh.glowMat.opacity = 0.3 + 0.12 * Math.sin(ctx.elapsed * 0.8);
      mesh.beaconGlowMat.opacity = mesh.beaconMat.visible ? 0.85 : 0.1;

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
