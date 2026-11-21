/**
 * Issue #339 — coupling-cap audit + exact save-size delta (system scale/population
 * Phase 2).
 *
 * Phase 2 grows every system's abstract record bank to 25-50 records. That is
 * content-only, but several systems still assume a small population and must not
 * be silently outgrown:
 *   - pirate bounty board: PIRATE_BOUNTY_CAP 2/system (station.js)
 *   - HUD contact arc: CONTACT_SLOTS 24 / CONTACT_MK1_CAP 16 (hud.js)
 *   - agent nearby rows: NEARBY_CAP 12 (agent-schema.js)
 *   - market random walk: SHIFT_INTERVAL 30 s (market.js)
 *   - hangar: HANGAR_CAP 8 (hangar.js)
 *   - hail: ONE card at a time, live hulls only (mid/far proxies are
 *     presentation-only and never hailable)
 *
 * This script pins those constants (source-level) and checks the real booted
 * state (real station Jobs board, real HUD, real agent observe, real hangar,
 * real hail DOM) so the caps still bound what Phase 2 produces.
 *
 * It also measures the save-size delta exactly: it generates all 101 record
 * banks with a fresh ctx, asserts every bank is 25-50 records and JSON-plain
 * with no new persistent record fields, then reports the UTF-8 byte size of
 * the full banks, the legacy prefix (the pre-Phase-2 549-record galaxy) and the
 * crowd-only remainder. The baseline is reconstructed with the pre-Phase-2
 * sequential record ids so the delta includes any id growth the crowd records
 * cause. Evidence is written to out/issue-339-coupling/result.json (untracked).
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-339-coupling-test.mjs
 */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { seedBootRandom, installDomStubs, bootGameSystems, makeTick } from './lib/boot-harness.mjs';
import { SYSTEMS } from '../src/game/state.js';
import { ensureBank, minerCountForCast } from '../src/game/world.js';

const checks = [];
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push(name);
  } catch (e) {
    failures.push({ name, error: String(e.message ?? e) });
  }
};

// ---------------------------------------------------------------------------
// A. Coupling caps: source-level constants that must stay unchanged.
// ---------------------------------------------------------------------------
const readSource = async (rel) => {
  try {
    return await readFile(new URL(rel, import.meta.url), 'utf8');
  } catch {
    return null;
  }
};
const sourceConst = (src, re, label) => {
  assert.ok(src, label + ': source readable');
  const m = src.match(re);
  assert.ok(m, label + ': declaration present (' + re + ')');
  return Number(m[1]);
};

const caps = {};
const stationSrc = await readSource('../src/systems/station.js');
const hudSrc = await readSource('../src/systems/hud.js');
const marketSrc = await readSource('../src/game/market.js');
const agentSchemaSrc = await readSource('../src/game/agent-schema.js');
const hangarSrc = await readSource('../src/game/hangar.js');
const trafficTiersSrc = await readSource('../src/game/traffic-tiers.js');
const trafficSrc = await readSource('../src/game/traffic.js');

check('station PIRATE_BOUNTY_CAP pinned at 2', () => {
  caps.pirateBountyCap = sourceConst(stationSrc, /const PIRATE_BOUNTY_CAP = (\d+);/, 'station.js');
  assert.equal(caps.pirateBountyCap, 2, 'pirate bounty board cap');
});
check('hud CONTACT_SLOTS pinned at 24', () => {
  caps.contactSlots = sourceConst(hudSrc, /const CONTACT_SLOTS = (\d+);/, 'hud.js');
  assert.equal(caps.contactSlots, 24, 'HUD contact slots');
});
check('hud CONTACT_MK1_CAP pinned at 16', () => {
  caps.contactMk1Cap = sourceConst(hudSrc, /const CONTACT_MK1_CAP = (\d+);/, 'hud.js');
  assert.equal(caps.contactMk1Cap, 16, 'Mk1 scanner contact cap');
});
check('agent NEARBY_CAP pinned at 12', () => {
  caps.nearbyCap = sourceConst(agentSchemaSrc, /export const NEARBY_CAP = (\d+);/, 'agent-schema.js');
  assert.equal(caps.nearbyCap, 12, 'agent nearby rows');
});
check('market SHIFT_INTERVAL pinned at 30 s', () => {
  caps.marketShiftInterval = sourceConst(marketSrc, /const SHIFT_INTERVAL = (\d+);/, 'market.js');
  assert.equal(caps.marketShiftInterval, 30, 'market random-walk cadence');
});
check('hangar HANGAR_CAP pinned at 8', () => {
  caps.hangarCap = sourceConst(hangarSrc, /export const HANGAR_CAP = (\d+);/, 'hangar.js');
  assert.equal(caps.hangarCap, 8, 'hangar hull cap');
});
// Tier caps are task-4's surface, but the near full-sim cap is the coupling
// that matters here: near hulls are the only contact/hail candidates and must
// stay below the Mk1 contact cap. Audit them when traffic-tiers.js exists.
if (trafficTiersSrc) {
  check('near/mid/far tier caps match the issue envelope', () => {
    caps.nearCap = sourceConst(trafficTiersSrc, /export const NEAR_CAP = (\d+);/, 'traffic-tiers.js');
    caps.midCap = sourceConst(trafficTiersSrc, /export const MID_CAP = (\d+);/, 'traffic-tiers.js');
    caps.farCap = sourceConst(trafficTiersSrc, /export const FAR_CAP = (\d+);/, 'traffic-tiers.js');
    assert.ok(caps.nearCap >= 10 && caps.nearCap <= 14, 'near full-sim cap 10-14');
    assert.ok(caps.midCap >= 30 && caps.midCap <= 40, 'mid proxy cap 30-40');
    assert.ok(caps.farCap >= 150 && caps.farCap <= 300, 'far impostor cap 150-300');
  });
  check('traffic MAX_LIVE is the shared near cap', () => {
    assert.ok(trafficSrc, 'traffic.js readable');
    assert.ok(/const MAX_LIVE = NEAR_CAP;/.test(trafficSrc), 'MAX_LIVE derives from NEAR_CAP');
    assert.ok(caps.nearCap <= caps.contactMk1Cap, 'near live hulls fit the Mk1 contact cap ('
      + caps.nearCap + ' <= ' + caps.contactMk1Cap + ')');
  });
} else {
  caps.nearCap = null;
  caps.midCap = null;
  caps.farCap = null;
}

// ---------------------------------------------------------------------------
// B. Record banks: 25-50/system, JSON-plain, no new persistent record fields.
// ---------------------------------------------------------------------------
const BASE_RECORD_KEYS = [
  'id', 'name', 'classKey', 'faction', 'cargo', 'route', 'legLens', 'leg', 'legT',
  'dir', 'dwellUntil', 'role', 'personality', 'resolveSeed', 'bounty', 'system',
  'anchor', 'state', 'live', 'outboundTo', 'gateLinger',
];
// Wave-31 Q-ship disguise fields are part of the pre-Phase-2 record shape.
const QSHIP_RECORD_KEYS = ['qship', 'coverClass', 'coverName', 'coverFaction'];
// Runtime fields the abstract tick already writes on pre-existing records
// (miners, revealed Q-ships); they are not Phase 2 additions.
const RUNTIME_RECORD_KEYS = ['mineAt', 'mineHold', 'revealed'];
const ALLOWED_RECORD_KEYS = new Set([...BASE_RECORD_KEYS, ...QSHIP_RECORD_KEYS, ...RUNTIME_RECORD_KEYS]);
const CROWD_ROLES = { traders: 'trader', pirates: 'pirate', patrols: 'patrol', miners: 'miner' };

function legacyCountForCast(cast) {
  const c = cast ?? {};
  return (c.traders | 0) + (c.pirates | 0) + (c.patrols | 0) + minerCountForCast(c) + (c.ace ? 1 : 0);
}
function crowdTotalForDef(def) {
  const c = def?.crowd;
  if (!c || typeof c !== 'object') return null;
  return (c.traders | 0) + (c.pirates | 0) + (c.patrols | 0) + (c.miners | 0);
}

seedBootRandom(); // deterministic legacy generation; crowd generation must consume no Math.random
const bankCtx = { world: { recordBanks: {} } };
const allBanks = {};
const legacyBanks = {};
const crowdBanks = {};
const perSystem = [];
let legacyTotal = 0;
let crowdTotal = 0;
let totalRecords = 0;
const countViolations = [];
const legacyRoleViolations = [];
const crowdDefViolations = [];
const nameViolations = [];
const shapeViolations = [];

for (const [sysId, def] of Object.entries(SYSTEMS)) {
  const legacy = legacyCountForCast(def.cast);
  const bank = ensureBank(bankCtx, sysId);
  assert.ok(Array.isArray(bank), sysId + ': bank is an array');
  const crowd = bank.length - legacy;
  if (crowd < 0) countViolations.push(sysId + ': bank shorter than legacy prefix (' + bank.length + ' < ' + legacy + ')');
  if (bank.length < 25 || bank.length > 50) countViolations.push(sysId + ': ' + bank.length + ' records (want 25-50)');

  const legacyPart = bank.slice(0, Math.max(0, legacy));
  const crowdPart = bank.slice(Math.max(0, legacy));

  // The legacy prefix must still be exactly the pre-Phase-2 cast, in order.
  const roles = { trader: 0, pirate: 0, patrol: 0, miner: 0, ace: 0 };
  for (const rec of legacyPart) {
    if (Object.hasOwn(roles, rec.role)) roles[rec.role]++;
  }
  const cast = def.cast ?? {};
  const expected = {
    trader: cast.traders | 0,
    pirate: cast.pirates | 0,
    patrol: cast.patrols | 0,
    miner: minerCountForCast(cast),
    ace: cast.ace ? 1 : 0,
  };
  for (const role of Object.keys(expected)) {
    if (roles[role] !== expected[role]) {
      legacyRoleViolations.push(sysId + ': ' + role + ' ' + roles[role] + ' != ' + expected[role]);
    }
  }

  const defCrowd = crowdTotalForDef(def);
  if (defCrowd === null) {
    if (crowd !== 0) crowdDefViolations.push(sysId + ': crowd ' + crowd + ' records but no def.crowd totals');
  } else if (defCrowd !== crowd) {
    crowdDefViolations.push(sysId + ': def.crowd totals ' + defCrowd + ' != appended records ' + crowd);
  }

  const names = new Set();
  for (const rec of bank) {
    if (typeof rec.name !== 'string' || !rec.name.trim()) nameViolations.push(sysId + '/' + rec.id + ': blank name');
    if (names.has(rec.name)) nameViolations.push(sysId + ': duplicate name ' + rec.name);
    names.add(rec.name);
    for (const key of Object.keys(rec)) {
      if (!ALLOWED_RECORD_KEYS.has(key)) shapeViolations.push(sysId + '/' + rec.id + ': unexpected record key ' + key);
    }
    // Save-plain means the persisted JSON round-trips byte-identically. Compare
    // serialized text, not deepEqual: Math.round can legitimately produce -0,
    // which JSON normalizes to 0 without changing the saved record.
    const serialized = JSON.stringify(rec);
    if (JSON.stringify(JSON.parse(serialized)) !== serialized) {
      shapeViolations.push(sysId + '/' + rec.id + ': not JSON-plain (round-trip differs)');
    }
    if (rec.route !== null && typeof rec.route !== 'object') shapeViolations.push(sysId + '/' + rec.id + ': route not JSON-plain');
  }

  allBanks[sysId] = bank;
  legacyBanks[sysId] = legacyPart;
  crowdBanks[sysId] = crowdPart;
  legacyTotal += legacyPart.length;
  crowdTotal += crowdPart.length;
  totalRecords += bank.length;
  perSystem.push({ system: sysId, records: bank.length, legacy: legacyPart.length, crowd: crowdPart.length });
}

check('every bank is 25-50 records', () => assert.deepEqual(countViolations, []));
check('every legacy prefix still matches cast + minerCountForCast', () => assert.deepEqual(legacyRoleViolations, []));
check('every appended crowd block matches def.crowd totals', () => assert.deepEqual(crowdDefViolations, []));
check('record names are unique per system', () => assert.deepEqual(nameViolations, []));
check('records are JSON-plain with no new persistent fields', () => assert.deepEqual(shapeViolations, []));
check('pre-Phase-2 legacy galaxy is still 549 records', () => assert.equal(legacyTotal, 549));
check('crowd growth is non-zero galaxy-wide', () => assert.ok(crowdTotal > 0, 'crowd records appended: ' + crowdTotal));

// Legacy generation must stay byte-identical: the seeded Math.random stream is
// the boot harness contract (issue #338 precedent). Rebuild every bank after
// re-seeding; the legacy prefix must match field-for-field (ids advance by the
// module counter, so compare everything except id). If crowd records consumed
// global Math.random draws, the legacy routes/cargo/personality would drift and
// the pre-Phase-2 baseline below would not be honest.
seedBootRandom();
const secondCtx = { world: { recordBanks: {} } };
const streamViolations = [];
const withoutId = (rec) => {
  const copy = { ...rec };
  delete copy.id;
  return JSON.stringify(copy);
};
for (const [sysId, bank] of Object.entries(allBanks)) {
  const legacy = legacyCountForCast(SYSTEMS[sysId].cast);
  const rebuilt = ensureBank(secondCtx, sysId).slice(0, legacy);
  const before = bank.slice(0, legacy).map(withoutId);
  const after = rebuilt.map(withoutId);
  if (JSON.stringify(before) !== JSON.stringify(after)) streamViolations.push(sysId);
}
check('legacy generation stream is preserved (crowd consumes no global Math.random)', () => assert.deepEqual(streamViolations, []));

const jsonBytes = (value) => Buffer.byteLength(JSON.stringify(value), 'utf8');
const legacyBytes = jsonBytes(legacyBanks);
const crowdBytes = jsonBytes(crowdBanks);
const totalBytes = jsonBytes(allBanks);

// Reconstruct the exact pre-Phase-2 baseline: same legacy records, sequential
// rec-1..rec-549 ids as a crowd-free boot would have assigned them. If crowd
// records consumed ids in the live bank, the measured legacy ids are shifted;
// the reconstructed baseline is the honest pre-Phase-2 save size.
let seq = 1;
const baselineBanks = {};
let legacyIdsShifted = false;
for (const [sysId, bank] of Object.entries(legacyBanks)) {
  baselineBanks[sysId] = bank.map((rec) => {
    const baselineId = 'rec-' + seq++;
    if (rec.id !== baselineId) legacyIdsShifted = true;
    return { ...rec, id: baselineId };
  });
}
const baselineBytes = jsonBytes(baselineBanks);
const deltaBytes = totalBytes - baselineBytes;
const deltaVsLegacySubset = totalBytes - legacyBytes;

const bankSummary = {
  systems: perSystem.length,
  records: { min: Math.min(...perSystem.map((p) => p.records)), max: Math.max(...perSystem.map((p) => p.records)), total: totalRecords },
  legacyRecords: legacyTotal,
  crowdRecords: crowdTotal,
  crowdPerSystem: { min: Math.min(...perSystem.map((p) => p.crowd)), max: Math.max(...perSystem.map((p) => p.crowd)) },
  perSystem,
};
const saveSummary = {
  byteUnit: 'UTF-8 bytes of JSON.stringify(recordBanks)',
  prePhase2BaselineBytes: baselineBytes,
  phase2TotalBytes: totalBytes,
  legacySubsetBytes: legacyBytes,
  crowdOnlyBytes: crowdBytes,
  deltaBytes,
  deltaVsLegacySubsetBytes: deltaVsLegacySubset,
  deltaKiB: Number((deltaBytes / 1024).toFixed(2)),
  deltaPercent: Number(((deltaBytes / baselineBytes) * 100).toFixed(1)),
  baselineRecordCount: legacyTotal,
  phase2RecordCount: totalRecords,
  legacyIdsShifted,
};

check('save delta is measured and finite', () => {
  assert.ok(Number.isFinite(deltaBytes) && deltaBytes > 0, 'delta > 0');
  assert.ok(baselineBytes > 0 && totalBytes > baselineBytes, 'phase-2 save is larger');
});
check('save-format record shape unchanged (no new persistent record fields)', () => {
  const unexpected = new Set();
  for (const bank of Object.values(allBanks)) {
    for (const rec of bank) for (const key of Object.keys(rec)) if (!ALLOWED_RECORD_KEYS.has(key)) unexpected.add(key);
  }
  assert.deepEqual([...unexpected], []);
});

// ---------------------------------------------------------------------------
// C. Booted state: the caps still bound what the live game produces.
// ---------------------------------------------------------------------------
const boot = { started: false, maxLive: 0, nearbyMax: 0, bountyRows: 0, contactPips: 0, hailCards: 0, errors: [] };
try {
  seedBootRandom();
  const dom = installDomStubs();
  const { ctx, systems } = await bootGameSystems();
  const nodes = () => [...dom.walkDom(document.body)];
  for (const el of nodes()) if (el.dataset?.titleAction === 'new') { el.click(); break; }
  dom.dispatchKey('Digit1');
  ctx.flags.paused = false;
  ctx.flags.combat = false;
  ctx.agent.optIn = true;
  ctx.world.credits = 200000;

  const counters = { frame: 0 };
  const tick = makeTick(ctx, systems, counters, 1 / 60, (e, frame, label) => {
    boot.errors.push({ frame, label, message: String(e.message ?? e) });
  });

  const dock = (id) => {
    if (ctx.flags.docked) {
      ctx.stationDesk.undock();
      tick(2, 'undock before dock');
    }
    ctx.flags.docked = false;
    ctx.world.currentSystem = id;
    ctx.lastEvents = [{ type: 'systemLoaded', to: id }];
    tick(1, 'systemLoaded');
    const p = ctx.systems[id].station.position;
    ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    ctx.input.dockPressed = true;
    tick(1, 'dock press');
    ctx.input.dockPressed = false;
    tick(2, 'dock settle');
    assert.equal(ctx.flags.docked, true, 'docked at ' + id);
  };

  tick(3, 'fresh start settle');
  dock('freehold');
  boot.started = true;

  // Pirate bounty board: render the real Jobs board and count offered pirate
  // bounty cards. Crowd pirates carry bounty 0 (ambient) and must not post.
  ctx.stationDesk.selectService('jobs');
  tick(2, 'jobs render');
  const bountyRows = (ctx.world.jobs ?? []).filter((j) => j
    && j.kind === 'bounty'
    && typeof j.id === 'string'
    && j.id.startsWith('bounty-pirate-')
    && j.system === ctx.world.currentSystem
    && j.state === 'offered');
  boot.bountyRows = bountyRows.length;
  check('pirate bounty board posts at most PIRATE_BOUNTY_CAP cards', () => {
    assert.ok(bountyRows.length <= caps.pirateBountyCap, 'offered pirate bounty rows ' + bountyRows.length
      + ' <= ' + caps.pirateBountyCap);
  });
  check('only priced (non-crowd) pirates reach the bounty board', () => {
    for (const row of bountyRows) {
      const rec = (ctx.world.records ?? []).find((r) => r && r.name === row.target);
      assert.ok(rec, 'posted bounty target exists in the bank: ' + row.target);
      assert.ok(rec.bounty > 0, 'posted bounty target is priced: ' + row.target + ' bounty ' + rec.bounty);
    }
  });

  // HUD contact arc: 24 slots mounted; the near live cap must fit the Mk1 cap.
  boot.contactPips = nodes().filter((n) => String(n.className).split(' ').includes('rw-contact-pip')).length;
  check('HUD contact arc mounts exactly CONTACT_SLOTS pips', () => {
    assert.equal(boot.contactPips, caps.contactSlots, 'contact pips mounted ' + boot.contactPips);
  });
  check('near live cap fits the Mk1 contact cap', () => {
    assert.ok(caps.nearCap !== null && caps.nearCap <= caps.contactMk1Cap, 'near ' + caps.nearCap + ' <= Mk1 ' + caps.contactMk1Cap);
  });

  // Undock and fly for 10 s so traffic spawns; track the live hull count and
  // agent nearby rows. Mid/far proxies must never enter ctx.ships (they are
  // presentation-only, so hail/contact/hangar caps cannot be outgrown by them).
  const undock = () => {
    for (let i = 0; ctx.flags.docked && i < 20; i++) {
      ctx.stationDesk.undock();
      tick(2, 'undock');
      if (ctx.flags.docked) tick(30, 'undock lane wait');
    }
    assert.equal(ctx.flags.docked, false, 'undocked for traffic soak');
  };
  undock();
  const observe = () => {
    const api = globalThis.window?.rimward;
    return api && typeof api.observe === 'function' ? api.observe() : null;
  };
  let nearbySamples = 0;
  for (let i = 0; i < 600; i++) {
    tick(1, 'traffic soak');
    boot.maxLive = Math.max(boot.maxLive, ctx.ships?.length ?? 0);
    if (i % 60 === 0) {
      const obs = observe();
      const rows = obs?.targets?.nearby;
      if (Array.isArray(rows)) {
        boot.nearbyMax = Math.max(boot.nearbyMax, rows.length);
        nearbySamples++;
      }
    }
  }
  check('near live hulls stay at or below the near cap', () => {
    assert.ok(caps.nearCap !== null && boot.maxLive <= caps.nearCap, 'max live ' + boot.maxLive + ' <= ' + caps.nearCap);
  });
  check('every live hull is a real record-bearing ship (proxies are not live hulls)', () => {
    for (const live of ctx.ships ?? []) {
      assert.ok(live && typeof live === 'object', 'live hull object');
      assert.ok(live.record && typeof live.record.id === 'string', 'live hull carries a record');
      assert.ok(live.object && typeof live.object === 'object', 'live hull carries an object');
    }
  });
  check('agent nearby rows stay at or below NEARBY_CAP', () => {
    assert.ok(nearbySamples > 0, 'agent observe sampled during soak');
    assert.ok(boot.nearbyMax <= caps.nearbyCap, 'max nearby rows ' + boot.nearbyMax + ' <= ' + caps.nearbyCap);
  });

  // Mid/far presentation layers: if wired into this boot, they are instanced
  // scene layers (never ctx.ships) with bounded capacities.
  const scene = ctx.scene;
  const mid = scene?.children?.find((o) => o.name === 'mid-traffic-proxies');
  const far = scene?.children?.find((o) => o.name === 'far-traffic-impostors');
  boot.proxyLayers = {
    mid: mid ? { capacity: mid.userData?.capacity ?? mid.count ?? null, visibleCount: mid.userData?.visibleCount ?? null } : null,
    far: far ? { capacity: far.userData?.capacity ?? far.count ?? null, visibleCount: far.userData?.visibleCount ?? null } : null,
  };
  check('mid/far presentation layers are bounded instanced layers, not live hulls', () => {
    for (const [name, layer, cap] of [['mid', mid, caps.midCap], ['far', far, caps.farCap]]) {
      if (!layer) continue;
      assert.ok(layer.isInstancedMesh === true, name + ' proxy layer is an InstancedMesh');
      const capacity = layer.userData?.capacity ?? layer.count ?? null;
      assert.ok(Number.isFinite(capacity) && capacity <= cap, name + ' capacity ' + capacity + ' <= ' + cap);
      assert.ok(!(ctx.ships ?? []).includes(layer), name + ' layer is not in ctx.ships');
    }
  });

  // Hangar cap on the booted save state (fresh game: starter hulls only).
  check('booted hangar stays within HANGAR_CAP', () => {
    assert.equal(caps.hangarCap, 8);
    const hangar = ctx.world?.hangar;
    if (!hangar || !Array.isArray(hangar.hulls)) {
      boot.hangarHulls = null;
      return; // no hangar row yet on this fresh boot
    }
    boot.hangarHulls = hangar.hulls.length;
    assert.ok(hangar.hulls.length <= caps.hangarCap, 'hangar hulls ' + hangar.hulls.length + ' <= ' + caps.hangarCap);
  });

  // Market: the walk cadence is pinned in source; the booted table must be a
  // finite per-system price map (no missing/NaN commodity that could starve).
  check('booted market prices are finite and complete', () => {
    assert.equal(caps.marketShiftInterval, 30);
    const prices = ctx.world?.prices;
    assert.ok(prices && typeof prices === 'object', 'world.prices exists');
    const keys = Object.keys(prices);
    assert.ok(keys.length > 0, 'price table is populated');
    for (const key of keys) assert.ok(Number.isFinite(prices[key]), 'finite price for ' + key);
  });

  // Hail: one card at a time and only live hulls are hailable. The card DOM
  // must never exceed one element; flags.hailOpen is a boolean; hailApi.peek()
  // is null or a single conversation object.
  boot.hailCards = nodes().filter((n) => String(n.className).split(' ').includes('rw-hail-card')).length;
  check('hail opens at most one card (no hail spam surface)', () => {
    assert.ok(boot.hailCards <= 1, 'hail card elements ' + boot.hailCards + ' <= 1');
    assert.equal(typeof ctx.flags?.hailOpen, 'boolean', 'flags.hailOpen is boolean');
    const peek = typeof ctx.hailApi?.peek === 'function' ? ctx.hailApi.peek() : null;
    assert.ok(peek === null || typeof peek === 'object', 'hailApi.peek is null or one card object');
  });
  check('no boot errors during the coupling soak', () => assert.deepEqual(boot.errors, []));
} catch (e) {
  failures.push({ name: 'booted-state coupling audit', error: String(e.stack ?? e) });
}

// ---------------------------------------------------------------------------
// Machine-readable summary + evidence.
// ---------------------------------------------------------------------------
const summary = {
  issue: 339,
  probe: 'scripts/issue-339-coupling-test.mjs',
  generatedAt: new Date().toISOString(),
  caps,
  banks: bankSummary,
  save: saveSummary,
  boot,
  checksPassed: checks.length,
  failures,
  verdict: failures.length === 0 ? 'PASS' : 'FAIL',
};
console.log('SUMMARY', JSON.stringify(summary));
console.log('CHECKS', checks.length, 'FAILURES', failures.length);
for (const f of failures) console.log('FAIL', f.name, '—', f.error);

const folder = resolve('out/issue-339-coupling');
await mkdir(folder, { recursive: true });
const evidencePath = join(folder, 'result.json');
await writeFile(evidencePath, JSON.stringify(summary, null, 2));
console.log('EVIDENCE', evidencePath);
if (failures.length) process.exitCode = 1;
