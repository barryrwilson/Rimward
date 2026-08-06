import * as THREE from 'three';
import '../ui/screens.css';
import { U, COMMODITIES, ECON, FACTIONS } from '../game/state.js';

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
 * ECON.fear.tributeOpensAt or rep.freehold < -25. Veridian Spire ALWAYS
 * trades them — corporate patents are their commodity (§16), flavor noted.
 *
 * Haul job (§10.1): cross-system. Accept at either station, buy 5 Provisions,
 * deliver at the OTHER system's station for 140% of the stamped origin buy
 * cost. Origin system/price are JSON-plain fields on the job entry.
 *
 * UI (§12.1: no more than two menu levels): full-screen dim + panel, world
 * keeps ticking behind. Keyboard: 1-7 service select, digit hotkeys inside
 * services, Esc/B launch (Esc backs out of a service first). Mouse: panel has
 * pointer-events auto. update() performs zero allocations.
 */

const RING_SPIN = 0.05; // rad/s
const DOCK_KEY_SERVICES = ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'launch'];

const RESTRICTED_REP_GATE = -25; // a burned Compact name opens the locker

const FEED_COST = 60;
const TEND_COST = 25;
const ROUND_COST = 5;
const REPAIR_RATE = 0.6; // UU per integrity point restored
const CARGO_UPGRADE_COST = 600;
const CARGO_UPGRADE_STEP = 10;
const CARGO_UPGRADE_MAX = 2;
const SCANNER_COST = 400;

const PATROL_REWARD = 300;
const PATROL_REP = 5;
const PATROL_NEED = 2;
const HAUL_UNITS = 5;
const HAUL_MARGIN = 1.4;
const DEFAULT_ACE_NAME = 'Carver Illyx';
const DEFAULT_ACE_BOUNTY = 2500;

const _pulse = new THREE.Color();

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
/** Veridian Spire trades restricted components openly — corporate patents §16. */
function stationAlwaysTradesRestricted(ctx) {
  return ctx.world.currentSystem === 'veridian';
}
function restrictedAllowed(ctx) {
  if (stationAlwaysTradesRestricted(ctx)) return true;
  return ctx.world.fear >= ECON.fear.tributeOpensAt || ctx.world.reputation.freehold < RESTRICTED_REP_GATE;
}
/** The system on the other side of the gate (two-system verse §15.1). */
function otherSystemId(ctx, id) {
  for (const key of Object.keys(ctx.systems ?? {})) if (key !== id) return key;
  return id;
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
  ];
}

function ensureJobs(ctx) {
  if (!Array.isArray(ctx.world.jobs)) ctx.world.jobs = [];
  if (ctx.world.jobs.length === 0) ctx.world.jobs = makeJobs(ctx);
}

/** Keep the bounty job pointed at the living ace record (name/reward drift). */
function refreshBountyJob(ctx) {
  for (const j of ctx.world.jobs) {
    if (j.kind !== 'bounty' || j.state === 'done') continue;
    const ace = findAceRecord(ctx);
    if (ace) {
      j.target = ace.name;
      j.reward = ace.bounty ?? j.reward;
      j.title = `Bounty: ${ace.name}`;
    }
  }
}

function completeJob(ctx, job, notice) {
  job.state = 'done';
  if (notice) ctx.emit('commLine', { text: notice });
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
        ctx.world.credits += PATROL_REWARD;
        ctx.world.reputation.freehold += PATROL_REP;
        completeJob(ctx, job, `Patrol contract fulfilled — ${PATROL_REWARD} UU posted.`);
        break; // one payout per contract, even for a multi-kill frame
      }
    }
  }
}

/** Throttled checks: bounty claim + cross-system provisions delivery. */
function tickDeliveryJobs(ctx) {
  for (const job of ctx.world.jobs) {
    if (job.state !== 'accepted') continue;
    if (job.kind === 'bounty') {
      const ace = findAceRecord(ctx);
      if (!ace || (ace.state !== 'dead' && ace.state !== 'captured')) continue;
      // The claim is only yours if the record says your guns did it (§8.7).
      const claimed = (ctx.world.incidents || []).some(
        (i) => i.name === ace.name && i.causer === 'player',
      );
      if (!claimed) continue;
      ctx.world.credits += job.reward;
      completeJob(ctx, job, `Bounty confirmed: ${job.target} — ${job.reward} UU posted.`);
    } else if (job.kind === 'haul' && ctx.flags.docked) {
      const origin = job.originSystem ?? 'freehold';
      if (ctx.world.currentSystem === origin) continue; // must reach the OTHER system
      if (holdUnits(ctx, 'provisions') < HAUL_UNITS) continue;
      removeCargo(ctx, 'provisions', HAUL_UNITS);
      const unitCost = job.originPrice || priceOf(ctx, 'provisions');
      const reward = Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN);
      ctx.world.credits += reward;
      const destName = ctx.systems?.[ctx.world.currentSystem]?.station?.name ?? 'the far station';
      completeJob(ctx, job, `Provisions delivered — ${reward} UU paid at 140% of buy cost by ${destName}.`);
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
      const { missing, cost } = repairCost();
      if (missing < 1 || ctx.world.credits < cost) {
        ui.notice = missing < 1 ? 'She reads whole on every channel.' : 'Not enough UU for the yard.';
        render();
        return;
      }
      ctx.world.credits -= cost;
      const p = ctx.player;
      p.hull = p.hullMax; p.screen = p.screenMax; p.shell = p.shellMax; p.engine = p.engineMax;
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
  function tryTrade(key, qty, buying) {
    const com = COMMODITIES[key];
    const price = priceOf(ctx, key);
    if (!com.legal && !restrictedAllowed(ctx)) {
      ui.notice = '“Not while the Compact watches,” the dockmaster says. “Come back when the right people notice you.”';
      return;
    }
    if (buying) {
      const cost = price * qty;
      if (ctx.world.credits < cost) { ui.notice = 'Not enough UU.'; return; }
      if (cargoUsed(ctx) + qty > ctx.cargoCapacity) { ui.notice = 'Hold is full.'; return; }
      ctx.world.credits -= cost;
      addCargo(ctx, key, qty);
      ui.notice = `Bought ${qty} ${com.name} for ${cost} UU.`;
    } else {
      if (holdUnits(ctx, key) < qty) { ui.notice = `No ${com.name} in the hold.`; return; }
      removeCargo(ctx, key, qty);
      ctx.world.credits += price * qty;
      ui.notice = `Sold ${qty} ${com.name} for ${price * qty} UU.`;
    }
  }

  function renderMarket(panel) {
    h('div', 'screen-sub', panel, 'MARKET — posted prices, no spread');
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
      h('div', 'market-cell' + sel, table, `${priceOf(ctx, key)} UU`);
      h('div', 'market-cell' + sel, table, String(holdUnits(ctx, key)));
      const actions = h('div', 'market-cell market-actions' + sel, table);
      if (!com.legal && !restrictedAllowed(ctx)) {
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
    } else if (!restrictedAllowed(ctx)) {
      h('div', 'screen-note', panel,
        `The dockmaster keeps the restricted locker closed. Fear ${ECON.fear.tributeOpensAt}+ or a burned Compact name opens it.`);
    }
  }

  // ---- jobs ----
  function acceptJob(job) {
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
    const aceHomeId = aceHomeSystem(ctx);
    ctx.world.jobs.forEach((job, i) => {
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
        const est = Math.round(HAUL_UNITS * unitCost * HAUL_MARGIN);
        rewardLine = `Haul ${HAUL_UNITS} Provisions to ${destName} — pays ${est} UU (140% of buy cost)`;
      } else {
        rewardLine = `Reward: ${job.reward} UU${job.kind === 'patrol' ? ` · +${PATROL_REP} Freehold rep` : ''}`;
      }
      h('div', 'job-reward', card, rewardLine);
      if (job.kind === 'bounty' && job.state !== 'done' && currentId !== aceHomeId) {
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
    if (!p) return { missing: 0, cost: 0 };
    const missing =
      (p.hullMax - p.hull) + (p.screenMax - p.screen) +
      (p.shellMax - p.shell) + (p.engineMax - p.engine);
    return { missing, cost: Math.ceil(missing * REPAIR_RATE) };
  }
  function renderRepair(panel) {
    h('div', 'screen-sub', panel, 'REPAIR BAYS — hull & systems');
    const { missing, cost } = repairCost();
    if (missing < 1) {
      h('div', 'screen-note', panel, 'She reads whole on every channel. Nothing to fix.');
      return;
    }
    h('div', 'screen-note', panel, `${Math.round(missing)} integrity points down across hull, screens, shell, and engine. Yard rate: ${cost} UU.`);
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
    launch: renderLaunch,
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
      const labels = ['Market', 'Jobs board', 'Bar', 'Feed & tend', 'Repair', 'Outfitting', 'Launch'];
      DOCK_KEY_SERVICES.forEach((key, i) => {
        btn(menu, `${i + 1} — ${labels[i]}`, () => selectService(key),
          key === 'launch' ? 'screen-btn screen-btn-warm' : 'screen-btn');
      });
      h('div', 'screen-legend', panel, '1-7 select service · Esc/B launch');
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
      const job = ctx.world.jobs[n - 1];
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
      jobTick += dt;
      if (jobTick >= 0.5) { jobTick = 0; tickDeliveryJobs(ctx); }
    },
  };
}
