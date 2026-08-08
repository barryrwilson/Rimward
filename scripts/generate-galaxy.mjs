#!/usr/bin/env node
/**
 * generate-galaxy.mjs — deterministic galaxy generator for RIMWARD.
 *
 * Emits src/game/galaxy.generated.js: 94 generated systems that, with the 6
 * authored systems in state.js, make the 100-system rim. Pure data output —
 * no imports, no functions — spread by state.js AFTER the authored systems.
 *
 * Deterministic: SEED = 20260808, mulberry32. Same input, same bytes.
 *
 * Topology rules (per project contract):
 *  - Physical gates are symmetric (A->B and B->A), degree <= 3 per system.
 *  - Exception: hub-route back-gates. If hub H routes to X, X has a physical
 *    gate X->H, and H reaches X via its hub.routes menu instead of a gate.
 *  - Inter-cluster links only via hub routes + the pinned route lists.
 *  - band = cluster base + hops from own hub, clamped 0..4 (unclaimed:
 *    1 + hops from nearest hub). Pinned: stolenwomb 2, lastbeacon 3,
 *    blackstation 3.
 *
 * NOTE: the contract's faction totals sum to 101 but the binding total is
 * 100. Ferrous is trimmed 18 -> 17 (approved by orchestrator).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SEED = 20260808;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const rint = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const rf = (lo, hi) => lo + rng() * (hi - lo);
const round2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------- factions
const FACTION_COLOR = {
  freehold: 0xb0703a, veridian: 0x6fd0e0, redledger: 0xa03434,
  hollow: 0x7a6a8a, independent: 0x9aa7b8, ferrous: 0x6e7b8a,
  gilded: 0xd4af37, beautiful: 0x7fe0a8, congregation: 0xd8c690,
  assembly: 0xaac4d8, lamplighter: 0xffd27a,
};

const PRICE_PROFILES = {
  freehold:     { provisions: 0.95, refinedMetals: 1.10, restrictedComponents: 1.00, rawOre: 1.00, livingRock: 0.90 },
  veridian:     { provisions: 1.30, refinedMetals: 0.75, restrictedComponents: 1.20, rawOre: 0.85, livingRock: 1.25 },
  redledger:    { provisions: 1.30, refinedMetals: 0.95, restrictedComponents: 0.68, rawOre: 1.10, livingRock: 1.15 },
  ferrous:      { provisions: 1.35, refinedMetals: 0.90, restrictedComponents: 1.05, rawOre: 0.80, livingRock: 1.10 },
  gilded:       { provisions: 1.50, refinedMetals: 1.15, restrictedComponents: 0.70, rawOre: 1.05, livingRock: 1.00 },
  beautiful:    { provisions: 1.20, refinedMetals: 1.25, restrictedComponents: 0.95, rawOre: 1.00, livingRock: 0.58 },
  congregation: { provisions: 1.60, refinedMetals: 1.20, restrictedComponents: 0.72, rawOre: 0.90, livingRock: 0.80 },
  assembly:     { provisions: 1.55, refinedMetals: 1.10, restrictedComponents: 0.80, rawOre: 0.95, livingRock: 1.00 },
  independent:  { provisions: 1.50, refinedMetals: 1.20, restrictedComponents: 0.80, rawOre: 0.90, livingRock: 0.90 },
  lamplighter:  { provisions: 1.80, refinedMetals: 1.30, restrictedComponents: 0.60, rawOre: 0.90, livingRock: 0.80 },
};

const STATION_PATTERNS = {
  freehold:     [(n) => `${n} Landing`, (n) => `${n} Grange`, (n) => `${n} Homestead`],
  veridian:     [(n) => `${n} Spire`, (n) => `${n} Assay Office`, (n) => `${n} Refinery`, (n) => `${n} Claim Office`],
  ferrous:      [(n) => `${n} Foundry`, (n) => `${n} Garrison`, (n) => `${n} Armory`],
  redledger:    [(n) => `${n} Countinghouse`, (n) => `Ledger Annex ${n}`, (n) => `The Till at ${n}`],
  gilded:       [(n) => `${n} Exchange`, (n) => `The Gilded Gavel at ${n}`, (n) => `${n} Auction House`],
  beautiful:    [(n) => `The ${n}`],
  congregation: [(n) => `${n} Chapel`],
  assembly:     [(n) => `${n} Registry`, (n) => `${n} Bureau`],
  independent:  [(n) => `${n} Camp`, (n) => `${n} Anchorage`, (n) => `${n} Landing`],
  lamplighter:  [(n) => n],
};

const CAST_BY_BAND = [
  { t: [6, 8], p: [2, 4], pa: [2, 3], ace: 0.35 },
  { t: [5, 7], p: [3, 5], pa: [1, 2], ace: 0.20 },
  { t: [3, 5], p: [3, 5], pa: [0, 1], ace: 0.10 },
  { t: [1, 2], p: [2, 3], pa: [0, 0], ace: 0 },
  { t: [0, 1], p: [0, 1], pa: [0, 0], ace: 0 },
];

// ---------------------------------------------------------------- authored
// Stubs of the 6 authored systems (state.js) — only what validation,
// connectivity, hop math, and chart separation need. Gate lists mirror
// state.js; route lists are the contract's authored-hub routes.
const AUTHORED = {
  freehold:    { faction: 'freehold',  band: 0, chart: [1620, 760], gates: ['veridian'],               routes: ['fh_hearth', 'fh_haven', 'fh_meridian', 'fx_bastion'] },
  veridian:    { faction: 'veridian',  band: 0, chart: [1470, 830], gates: ['freehold', 'redmarch'],   routes: ['vd_survey', 'vd_prospect', 'vd_canaan', 'gc_auction'] },
  redmarch:    { faction: 'redledger', band: 1, chart: [1300, 780], gates: ['veridian', 'hollowreach'], routes: ['rl_toll', 'rl_reckoning', 'rl_cutter', 'blackstation'] },
  hollowreach: { faction: 'hollow',    band: 2, chart: [1130, 840], gates: ['redmarch', 'hush'],       routes: ['lastbeacon', 'uc_drift', 'uc_sorrow'] },
  hush:        { faction: 'hollow',    band: 3, chart: [980, 800],  gates: ['hollowreach', 'verge'],   routes: [] },
  verge:       { faction: 'hollow',    band: 4, chart: [850, 830],  gates: ['hush'],                   routes: [] },
};
const AUTHORED_IDS = Object.keys(AUTHORED);

// ---------------------------------------------------------------- clusters
// systems: pinned entries first. backGateTo = physical gate to a hub whose
// routes include this system. links = explicit intra-cluster mutual gates.
const CLUSTERS = [
  {
    key: 'compact', faction: 'freehold', base: 0, region: [1500, 500, 1850, 1000],
    hubId: 'freehold', cycles: 3, treeStart: 'fh_hearth',
    systems: [
      { id: 'fh_hearth', name: 'Hearth', backGateTo: 'freehold' },
      { id: 'fh_haven', name: 'Haven', backGateTo: 'freehold' },
      { id: 'fh_meridian', name: 'Meridian', backGateTo: 'freehold' },
      { id: 'fh_alder', name: "Alder's Rest" }, { id: 'fh_mercy', name: 'Mercy' },
      { id: 'fh_longtable', name: 'Longtable' }, { id: 'fh_sweetwater', name: 'Sweetwater' },
      { id: 'fh_granary', name: 'Granary' }, { id: 'fh_kinhold', name: 'Kinhold' },
      { id: 'fh_tallow', name: 'Tallow' }, { id: 'fh_tamsin', name: "Tamsin's Rest" },
      { id: 'fh_cloverfield', name: 'Cloverfield' }, { id: 'fh_bramblehome', name: 'Bramblehome' },
      { id: 'fh_meadowlark', name: 'Meadowlark' }, { id: 'fh_harvest', name: 'Harvest Home' },
      { id: 'fh_wellspring', name: 'Wellspring' }, { id: 'fh_saltbox', name: 'Saltbox' },
      { id: 'fh_applebough', name: 'Applebough' }, { id: 'fh_goodrest', name: 'Goodrest' },
    ],
  },
  {
    key: 'combine', faction: 'veridian', base: 0, region: [1250, 880, 1550, 1150],
    hubId: 'veridian', cycles: 3, treeStart: 'vd_survey',
    systems: [
      { id: 'vd_survey', name: 'Survey', backGateTo: 'veridian' },
      { id: 'vd_prospect', name: 'Prospect', backGateTo: 'veridian' },
      { id: 'vd_canaan', name: 'Canaan', backGateTo: 'veridian' },
      { id: 'vd_claim9', name: 'Claim Nine' }, { id: 'vd_filing7', name: 'Filing Seven' },
      { id: 'vd_stakedown', name: 'Stakedown' }, { id: 'vd_assay', name: 'Assay' },
      { id: 'vd_gridmark', name: 'Gridmark' }, { id: 'vd_plat12', name: 'Plat Twelve' },
      { id: 'vd_motherlode', name: 'Motherlode' }, { id: 'vd_claim44', name: 'Claim 44' },
      { id: 'vd_surveyd', name: 'Survey Delta' }, { id: 'vd_filing12c', name: 'Filing 12-C' },
      { id: 'vd_coresample', name: 'Core Sample' }, { id: 'vd_paydirt', name: 'Paydirt' },
      { id: 'vd_stakeside', name: 'Stakeside' }, { id: 'vd_annexclaim', name: 'Annex Claim' },
    ],
  },
  {
    key: 'hegemony', faction: 'ferrous', base: 1, region: [1450, 1000, 1750, 1300],
    hubId: 'fx_bastion', cycles: 4, treeStart: 'fx_bastion', hubRoutePick: 3,
    systems: [
      { id: 'fx_bastion', name: 'Bastion', backGateTo: 'freehold', isHub: true },
      { id: 'fx_liron', name: 'Fort Liron' }, { id: 'fx_shieldwall', name: 'Shieldwall' },
      { id: 'fx_honorhold', name: 'Honorhold' }, { id: 'fx_rampart', name: 'Rampart' },
      { id: 'fx_aegis', name: 'Aegis' }, { id: 'fx_ironhold', name: 'Ironhold' },
      { id: 'fx_ward', name: 'The Ward' }, { id: 'fx_palisade', name: 'Palisade' },
      { id: 'fx_vanguard', name: 'Vanguard' }, { id: 'fx_bulwark', name: 'Bulwark' },
      { id: 'fx_garrison9', name: 'Garrison Nine' }, { id: 'fx_citadel', name: 'Citadel' },
      { id: 'fx_sentry', name: 'Sentry' }, { id: 'fx_oathkeep', name: 'Oathkeep' },
      { id: 'fx_merit', name: 'Fort Merit' }, { id: 'fx_steelhaven', name: 'Steelhaven' },
    ],
  },
  {
    key: 'ledger', faction: 'redledger', base: 1, region: [1120, 560, 1380, 800],
    hubId: 'redmarch', cycles: 2, treeStart: 'rl_toll',
    systems: [
      { id: 'rl_toll', name: 'Toll', backGateTo: 'redmarch' },
      { id: 'rl_reckoning', name: 'Reckoning', backGateTo: 'redmarch' },
      { id: 'rl_cutter', name: 'Cutter', backGateTo: 'redmarch' },
      { id: 'rl_interest', name: 'Interest' }, { id: 'rl_due', name: 'Due' },
      { id: 'rl_arrears', name: 'Arrears' }, { id: 'rl_principal', name: 'Principal' },
      { id: 'rl_tithemark', name: 'Tithemark' }, { id: 'rl_default', name: 'Default' },
      { id: 'rl_margin', name: 'Margin Call' }, { id: 'rl_compound', name: 'Compound' },
    ],
  },
  {
    key: 'gilded', faction: 'gilded', base: 2, region: [980, 500, 1240, 700],
    hubId: 'gc_auction', cycles: 2, treeStart: 'gc_auction', hubRoutePick: 2,
    extraRoutes: ['bt_cradle'],
    systems: [
      { id: 'gc_auction', name: 'The Auction', stationName: 'The Grand Auction', backGateTo: 'veridian', isHub: true },
      { id: 'gc_gavel', name: 'Gavel' }, { id: 'gc_lot7', name: 'Lot Seven' },
      { id: 'gc_appraisal', name: 'Appraisal' }, { id: 'gc_reserve', name: 'Reserve' },
      { id: 'gc_provenance', name: 'Provenance' }, { id: 'gc_hammerfall', name: 'Hammerfall' },
      { id: 'gc_showcase', name: 'Showcase' },
    ],
  },
  {
    key: 'beautiful', faction: 'beautiful', base: 1, region: [1040, 420, 1200, 580],
    anchor: 'bt_cradle',
    links: [['bt_cradle', 'stolenwomb'], ['stolenwomb', 'bt_moss']],
    systems: [
      { id: 'bt_cradle', name: 'Cradle', backGateTo: 'gc_auction' },
      { id: 'stolenwomb', name: 'The Stolen Womb', stationName: 'The Stolen Womb', pinnedBand: 2 },
      { id: 'bt_moss', name: 'Moss' },
    ],
  },
  {
    key: 'congregation', faction: 'congregation', base: 2, region: [1000, 900, 1180, 1080],
    anchor: 'cg_vigil',
    links: [['cg_vigil', 'cg_psalm'], ['cg_psalm', 'cg_shore']],
    systems: [
      { id: 'cg_vigil', name: 'Vigil' },
      { id: 'cg_psalm', name: 'Psalm' },
      { id: 'cg_shore', name: 'The Further Shore' },
    ],
  },
  {
    key: 'assembly', faction: 'assembly', base: 3, region: [720, 580, 900, 760],
    anchor: 'as_census',
    links: [['as_census', 'as_archive']],
    systems: [
      { id: 'as_census', name: 'Census', backGateTo: 'blackstation' },
      { id: 'as_archive', name: 'Archive' },
    ],
  },
  {
    key: 'unclaimed', faction: 'independent', base: null, region: [700, 650, 1200, 1100],
    hubId: 'blackstation', cycles: 3, treeStart: 'blackstation', hubRoutePick: 3,
    extraRoutes: ['as_census'],
    systems: [
      { id: 'blackstation', name: 'The Black Station', stationName: 'The Black Station',
        backGateTo: 'redmarch', isHub: true, pinnedBand: 3, pinnedChart: [950, 620] },
      { id: 'uc_drift', name: 'Drift', backGateTo: 'hollowreach' },
      { id: 'uc_sorrow', name: 'Sorrow', backGateTo: 'hollowreach' },
      { id: 'uc_ashfall', name: 'Ashfall' }, { id: 'uc_tumble', name: 'Tumble' },
      { id: 'uc_nowhere', name: 'Nowhere' }, { id: 'uc_faint', name: 'Faint' },
      { id: 'uc_wisp', name: 'Wisp' }, { id: 'uc_cinder', name: 'Cinder' },
      { id: 'uc_stray', name: 'Stray' }, { id: 'uc_husk', name: 'Husk' },
      { id: 'uc_gone', name: 'Gone' }, { id: 'uc_ember', name: 'Ember' },
    ],
  },
  {
    key: 'lamplighter', faction: 'lamplighter', base: null, region: [1040, 860, 1130, 950],
    anchor: 'lastbeacon',
    systems: [
      { id: 'lastbeacon', name: 'The Last Beacon', stationName: 'The Last Beacon',
        backGateTo: 'hollowreach', pinnedBand: 3, pinnedChart: [1080, 900] },
    ],
  },
];

// Expected faction totals (authored + generated). Ferrous 17: contract totals
// sum to 101; trimmed to hit the binding 100 (approved by orchestrator).
const EXPECTED_FACTION_TOTALS = {
  freehold: 20, veridian: 18, ferrous: 17, redledger: 12, gilded: 8,
  beautiful: 3, congregation: 3, assembly: 2, independent: 13,
  hollow: 3, lamplighter: 1,
};

// ------------------------------------------------------------- build records
const systems = new Map(); // id -> working record
const errors = [];
const fail = (msg) => errors.push(msg);
// Report collected errors and stop. Called before phases that assume prior
// phases fully succeeded (e.g. flavor math needs s.band on every record), and
// again after final validation.
const bailIfErrors = () => {
  if (!errors.length) return;
  console.error(`VALIDATION FAILED (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
};

for (const cluster of CLUSTERS) {
  for (let i = 0; i < cluster.systems.length; i++) {
    const spec = cluster.systems[i];
    if (AUTHORED_IDS.includes(spec.id)) fail(`generated id collides with authored: ${spec.id}`);
    if (systems.has(spec.id)) fail(`duplicate generated id: ${spec.id}`);
    const patterns = STATION_PATTERNS[cluster.faction];
    systems.set(spec.id, {
      id: spec.id,
      name: spec.name,
      faction: cluster.faction,
      cluster: cluster.key,
      stationName: spec.stationName ?? patterns[i % patterns.length](spec.name),
      backGateTo: spec.backGateTo ?? null,
      isHub: !!spec.isHub,
      pinnedBand: spec.pinnedBand ?? null,
      pinnedChart: spec.pinnedChart ?? null,
      gatesTo: [], // neighbor ids, order preserved for output
    });
  }
}
const GENERATED_IDS = [...systems.keys()];
const ALL_IDS = [...AUTHORED_IDS, ...GENERATED_IDS];
if (GENERATED_IDS.length !== 94) fail(`expected 94 generated systems, got ${GENERATED_IDS.length}`);

// ------------------------------------------------------------- chart placing
const chartOf = new Map(); // id -> [x, y]
for (const id of AUTHORED_IDS) chartOf.set(id, AUTHORED[id].chart.slice());
// pinned chart positions reserve their spots first
for (const id of GENERATED_IDS) {
  const s = systems.get(id);
  if (s.pinnedChart) chartOf.set(id, s.pinnedChart.slice());
}

function minChartDist(x, y) {
  let best = Infinity;
  for (const [cx, cy] of chartOf.values()) {
    const d = Math.hypot(cx - x, cy - y);
    if (d < best) best = d;
  }
  return best;
}

for (const cluster of CLUSTERS) {
  const [x0, y0, x1, y1] = cluster.region;
  for (const spec of cluster.systems) {
    if (chartOf.has(spec.id)) continue;
    let placed = false;
    for (const floor of [40, 36]) {
      for (let attempt = 0; attempt < 400 && !placed; attempt++) {
        const x = rint(x0, x1), y = rint(y0, y1);
        if (minChartDist(x, y) >= floor) {
          chartOf.set(spec.id, [x, y]);
          placed = true;
        }
      }
      if (placed) break;
    }
    if (!placed) fail(`could not place ${spec.id} in ${cluster.key} region with chart separation`);
  }
}

// ------------------------------------------------------------------ graphing
// edges: unique physical pairs "a|b" (a<b). backGates: X->hub one-way gates
// covered by hub routes. routes: hubId -> [targets].
const edges = new Set();
const routes = new Map(); // hubId -> [targetIds]
for (const [id, a] of Object.entries(AUTHORED)) routes.set(id, a.routes.slice());
const deg = new Map(ALL_IDS.map((id) => [id, 0]));
for (const id of AUTHORED_IDS) deg.set(id, AUTHORED[id].gates.length);

function adjacent(a, b) {
  return systems.get(a)?.gatesTo.includes(b) || systems.get(b)?.gatesTo.includes(a) ||
    edges.has(a < b ? `${a}|${b}` : `${b}|${a}`);
}
function addEdge(a, b) {
  if (a === b) { fail(`self gate ${a}`); return; }
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  if (edges.has(key)) return;
  if (deg.get(a) >= 3 || deg.get(b) >= 3) { fail(`degree cap exceeded adding ${a}<->${b}`); return; }
  edges.add(key);
  if (systems.has(a)) systems.get(a).gatesTo.push(b);
  if (systems.has(b)) systems.get(b).gatesTo.push(a);
  deg.set(a, deg.get(a) + 1);
  deg.set(b, deg.get(b) + 1);
}
function addBackGate(x, h) {
  // X lists a physical gate to H; H reaches X via hub.routes (no gate on H).
  if (!routes.has(h)) routes.set(h, []);
  if (!routes.get(h).includes(x)) routes.get(h).push(x);
  if (systems.get(x).gatesTo.includes(h)) return;
  if (deg.get(x) >= 3) { fail(`degree cap exceeded adding back-gate ${x}->${h}`); return; }
  systems.get(x).gatesTo.push(h);
  deg.set(x, deg.get(x) + 1);
}

// 1. spec'd back-gates (authored-hub routes + pinned cross-cluster links)
for (const s of systems.values()) if (s.backGateTo) addBackGate(s.id, s.backGateTo);
// authored route lists must reference real generated systems
for (const [h, a] of Object.entries(AUTHORED)) {
  for (const t of a.routes) if (!systems.has(t)) fail(`authored hub ${h} routes to unknown id ${t}`);
}
// 2. spec'd explicit links (small clusters)
for (const cluster of CLUSTERS) {
  for (const [a, b] of cluster.links ?? []) addEdge(a, b);
}
// 3. cross-cluster pinned mutual link: cg_vigil <-> lastbeacon
addEdge('cg_vigil', 'lastbeacon');

// 4. intra-cluster trees + cycles for clusters with treeStart
function growTree(cluster) {
  const ids = cluster.systems.map((s) => s.id);
  const start = cluster.treeStart;
  const inTree = new Set([start]);
  // hub systems get 1-2 normal physical gates first (contract)
  const hubKids = systems.get(start)?.isHub ? rint(1, 2) : 0;
  for (let k = 0; k < hubKids; k++) {
    const outside = ids.filter((id) => !inTree.has(id) && deg.get(id) < 3);
    if (!outside.length) break;
    const cand = outside[rint(0, outside.length - 1)];
    addEdge(start, cand);
    inTree.add(cand);
  }
  let guard = 0;
  while (inTree.size < ids.length) {
    if (++guard > 500) { fail(`tree growth stalled in ${cluster.key}`); break; }
    const outside = ids.filter((id) => !inTree.has(id));
    const cand = outside[rint(0, outside.length - 1)];
    const attachable = [...inTree].filter((id) => deg.get(id) < 3 && deg.get(cand) < 3 && !adjacent(id, cand));
    if (!attachable.length) continue;
    const parent = attachable[rint(0, attachable.length - 1)];
    addEdge(parent, cand);
    inTree.add(cand);
  }
  // cycle edges (hubs keep their 1-2 normal physical gates: no cycle edges)
  for (let c = 0; c < (cluster.cycles ?? 0); c++) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const a = ids[rint(0, ids.length - 1)], b = ids[rint(0, ids.length - 1)];
      if (a !== b && !adjacent(a, b) && deg.get(a) < 3 && deg.get(b) < 3 &&
          !systems.get(a)?.isHub && !systems.get(b)?.isHub) {
        addEdge(a, b);
        break;
      }
    }
  }
}
for (const cluster of CLUSTERS) if (cluster.treeStart) growTree(cluster);

// 5. lastbeacon <-> one unclaimed neighbor (nearest by chart, degree-aware)
{
  const [lx, ly] = chartOf.get('lastbeacon');
  const candidates = CLUSTERS.find((c) => c.key === 'unclaimed').systems
    .map((s) => s.id)
    .filter((id) => id !== 'blackstation' && deg.get(id) < 3 && !adjacent(id, 'lastbeacon'))
    .map((id) => ({ id, d: Math.hypot(chartOf.get(id)[0] - lx, chartOf.get(id)[1] - ly) }))
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : 1));
  if (candidates.length && deg.get('lastbeacon') < 3) addEdge('lastbeacon', candidates[0].id);
  else fail('lastbeacon found no unclaimed neighbor gate');
}

// 6. generated-hub route picks: farthest (hops) cluster nodes with degree room
function clusterHops(cluster, fromId) {
  const allowed = new Set(cluster.systems.map((s) => s.id));
  allowed.add(fromId);
  const dist = new Map([[fromId, 0]]);
  const queue = [fromId];
  while (queue.length) {
    const cur = queue.shift();
    const nbrs = new Set();
    for (const key of edges) {
      const [a, b] = key.split('|');
      if (a === cur) nbrs.add(b);
      if (b === cur) nbrs.add(a);
    }
    for (const s of systems.values()) if (s.gatesTo.includes(cur)) nbrs.add(s.id);
    for (const n of nbrs) {
      if (!allowed.has(n) || dist.has(n)) continue;
      dist.set(n, dist.get(cur) + 1);
      queue.push(n);
    }
  }
  return dist;
}
for (const cluster of CLUSTERS) {
  if (!cluster.hubRoutePick) continue;
  const hubId = cluster.hubId;
  const hops = clusterHops(cluster, hubId);
  const picks = cluster.systems.map((s) => s.id)
    .filter((id) => id !== hubId && deg.get(id) < 3)
    .sort((a, b) => (hops.get(b) ?? -1) - (hops.get(a) ?? -1) || (a < b ? -1 : 1))
    .slice(0, cluster.hubRoutePick);
  for (const id of picks) addBackGate(id, hubId);
  for (const extra of cluster.extraRoutes ?? []) {
    if (!routes.get(hubId)?.includes(extra)) fail(`${hubId} missing required route ${extra}`);
  }
  // keep contract-required extras first in the route list
  const req = (cluster.extraRoutes ?? []).filter((e) => routes.get(hubId)?.includes(e));
  const rest = routes.get(hubId).filter((r) => !req.includes(r));
  routes.set(hubId, [...req, ...rest]);
}

// --------------------------------------------------------------------- bands
// Global undirected adjacency: physical edges + back-gates + hub routes.
const adjGlobal = new Map(ALL_IDS.map((id) => [id, new Set()]));
function linkGlobal(a, b) { adjGlobal.get(a)?.add(b); adjGlobal.get(b)?.add(a); }
for (const key of edges) { const [a, b] = key.split('|'); linkGlobal(a, b); }
for (const s of systems.values()) for (const g of s.gatesTo) linkGlobal(s.id, g);
for (const [h, list] of routes) for (const t of list) linkGlobal(h, t);
for (const [id, a] of Object.entries(AUTHORED)) for (const g of a.gates) linkGlobal(id, g);

function bfsFrom(starts, allowed = null) {
  const dist = new Map();
  const queue = [];
  for (const s of starts) { dist.set(s, 0); queue.push(s); }
  while (queue.length) {
    const cur = queue.shift();
    for (const n of adjGlobal.get(cur) ?? []) {
      if (dist.has(n)) continue;
      if (allowed && !allowed.has(n)) continue;
      dist.set(n, dist.get(cur) + 1);
      queue.push(n);
    }
  }
  return dist;
}

const HUB_IDS = ['freehold', 'veridian', 'redmarch', 'hollowreach', 'fx_bastion', 'gc_auction', 'blackstation'];
const nearestHubDist = bfsFrom(HUB_IDS);

for (const cluster of CLUSTERS) {
  for (const spec of cluster.systems) {
    const s = systems.get(spec.id);
    let band;
    if (s.pinnedBand != null) {
      band = s.pinnedBand;
    } else if (cluster.key === 'unclaimed') {
      band = clamp(1 + (nearestHubDist.get(spec.id) ?? 99), 0, 4);
    } else {
      const anchor = cluster.hubId ?? cluster.anchor;
      const allowed = new Set(cluster.systems.map((x) => x.id));
      allowed.add(anchor);
      const hops = bfsFrom([anchor], allowed).get(spec.id);
      if (hops == null) { fail(`no hop path ${anchor} -> ${spec.id}`); continue; }
      band = clamp(cluster.base + hops, 0, 4);
    }
    s.band = band;
  }
}

// ------------------------------------------------------------ flavor fields
// Band assignment above fails soft (fail + continue leaves s.band unset); the
// flavor math below assumes every record resolved (CAST_BY_BAND[s.band] etc.).
// Bail here so a 'no hop path' failure reports as a validation error instead
// of crashing the flavor loop.
bailIfErrors();

function blendColor(c1, c2, t) {
  const r = Math.round(((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t);
  const g = Math.round(((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t);
  const b = Math.round((c1 & 255) * (1 - t) + ((c2 & 255) * t));
  return (r << 16) | (g << 8) | b;
}

const out = {};
for (const cluster of CLUSTERS) {
  for (const spec of cluster.systems) {
    const s = systems.get(spec.id);
    const band = s.band;
    const factionColor = FACTION_COLOR[s.faction];

    const castCfg = CAST_BY_BAND[band];
    const cast = {
      traders: rint(castCfg.t[0], castCfg.t[1]),
      pirates: rint(castCfg.p[0], castCfg.p[1]),
      patrols: rint(castCfg.pa[0], castCfg.pa[1]),
      ace: rng() < castCfg.ace,
    };

    const profile = PRICE_PROFILES[s.faction];
    const priceBase = {};
    for (const [k, v] of Object.entries(profile)) {
      const val = v + (k === 'provisions' ? band * 0.08 : 0) + rf(-0.08, 0.08);
      priceBase[k] = round2(clamp(val, 0.5, 2.2));
    }

    const stationPos = [rint(-650, 650), rint(15, 45), rint(-650, 650)];
    const gates = s.gatesTo.map((to, i) => {
      const angle = i * 2.399963 + rf(0, 0.8);
      const r = rf(850, 1200);
      return {
        position: [Math.round(Math.cos(angle) * r), rint(40, 90), Math.round(Math.sin(angle) * r)],
        to,
      };
    });

    const sys = {
      id: s.id,
      name: s.name,
      faction: s.faction,
      band,
      chart: chartOf.get(s.id),
      sunColor: blendColor(factionColor, 0x4a3a5a, clamp(band * 0.12 + rf(-0.05, 0.05), 0, 0.6)),
      sunRadius: Math.max(26, 62 - band * 7 + rint(-4, 4)),
      planetCount: clamp(rint(1, 6 - band), 1, 6),
      worldSeed: rint(1000, 99999),
      station: { name: s.stationName, position: stationPos, palette: factionColor },
      field: {
        center: [rint(-550, 550), rint(-70, -20), rint(-550, 550)],
        radius: rint(85, 160),
        count: clamp(Math.round(130 - band * 25 + rint(-10, 10)), 25, 140),
        oreMult: round2(clamp(1 + band * 0.5 + rf(-0.1, 0.15), 0.5, 3.5)),
      },
      gates,
      cast,
      priceBase,
    };
    if (s.isHub) {
      sys.hub = {
        position: [
          stationPos[0] + rint(150, 280),
          clamp(stationPos[1] + rint(60, 110), -80, 120),
          stationPos[2] + rint(-260, -120),
        ],
        routes: routes.get(s.id).slice(),
      };
    }
    const restricted =
      s.faction === 'redledger' || s.faction === 'gilded' ||
      (s.faction === 'independent' && band >= 2);
    if (restricted) sys.tradesRestricted = true;
    out[s.id] = sys;
  }
}

// ---------------------------------------------------------------- validation
function validate() {
  // count + authored collision
  if (Object.keys(out).length !== 94) fail(`output has ${Object.keys(out).length} systems, expected 94`);

  // per-system shape
  for (const sys of Object.values(out)) {
    for (const key of ['id', 'name', 'faction', 'band', 'chart', 'sunColor', 'sunRadius', 'planetCount', 'worldSeed', 'station', 'field', 'gates', 'cast', 'priceBase']) {
      if (!(key in sys)) fail(`${sys.id} missing key ${key}`);
    }
    if ('landmarks' in sys || 'clues' in sys) fail(`${sys.id} must omit landmarks/clues`);
    if (!(sys.band >= 0 && sys.band <= 4)) fail(`${sys.id} band out of bounds: ${sys.band}`);
    if (sys.station.palette !== FACTION_COLOR[sys.faction]) fail(`${sys.id} palette mismatch`);
    for (const k of ['provisions', 'refinedMetals', 'restrictedComponents', 'rawOre', 'livingRock']) {
      if (!(k in sys.priceBase)) fail(`${sys.id} priceBase missing ${k}`);
    }
    if (sys.gates.length > 3) fail(`${sys.id} degree ${sys.gates.length} > 3`);
    const seen = new Set();
    for (const g of sys.gates) {
      if (g.to === sys.id) fail(`${sys.id} self gate`);
      if (seen.has(g.to)) fail(`${sys.id} duplicate gate to ${g.to}`);
      seen.add(g.to);
      // gate.to resolves
      if (!ALL_IDS.includes(g.to)) { fail(`${sys.id} gate.to unknown: ${g.to}`); continue; }
      // symmetry: physical pair OR hub-route back-gate
      const t = out[g.to];
      if (t) {
        const backGate = t.hub?.routes.includes(sys.id);
        if (!t.gates.some((gg) => gg.to === sys.id) && !backGate) {
          fail(`gate symmetry: ${sys.id} -> ${g.to} has no return gate/route`);
        }
      } else {
        const a = AUTHORED[g.to];
        if (!a.gates.includes(sys.id) && !a.routes.includes(sys.id)) {
          fail(`gate symmetry: ${sys.id} -> authored ${g.to} has no return gate/route`);
        }
      }
    }
  }

  // hub routes: targets exist, have back-gates, hub has routes array
  for (const [h, list] of routes) {
    const hubSys = out[h];
    if (hubSys && !hubSys.hub) fail(`generated hub ${h} missing hub field`);
    if (hubSys && JSON.stringify(hubSys.hub.routes) !== JSON.stringify(list)) fail(`hub ${h} routes mismatch`);
    for (const t of list) {
      const ts = out[t];
      if (!ts) { fail(`hub ${h} routes to unknown ${t}`); continue; }
      if (!ts.gates.some((g) => g.to === h)) fail(`route back-gate missing: ${t} -> ${h}`);
    }
  }
  // contract-required routes
  const requiredRoutes = {
    freehold: ['fh_hearth', 'fh_haven', 'fh_meridian', 'fx_bastion'],
    veridian: ['vd_survey', 'vd_prospect', 'vd_canaan', 'gc_auction'],
    redmarch: ['rl_toll', 'rl_reckoning', 'rl_cutter', 'blackstation'],
    hollowreach: ['lastbeacon', 'uc_drift', 'uc_sorrow'],
    gc_auction: ['bt_cradle'],
    blackstation: ['as_census'],
  };
  for (const [h, list] of Object.entries(requiredRoutes)) {
    for (const t of list) if (!routes.get(h)?.includes(t)) fail(`required route ${h} -> ${t} missing`);
  }
  // blackstation mid-rim route count: as_census + 2-3 others
  const bsRoutes = routes.get('blackstation') ?? [];
  if (bsRoutes.length < 3 || bsRoutes.length > 4) fail(`blackstation routes ${bsRoutes.length} not in 3..4`);

  // pinned ids / bands / charts
  const pinnedIds = ['fh_hearth', 'fh_haven', 'fh_meridian', 'vd_survey', 'vd_prospect', 'vd_canaan',
    'rl_toll', 'rl_reckoning', 'rl_cutter', 'uc_drift', 'uc_sorrow', 'bt_cradle', 'cg_vigil',
    'as_census', 'fx_bastion', 'gc_auction', 'stolenwomb', 'lastbeacon', 'blackstation'];
  for (const id of pinnedIds) if (!out[id]) fail(`pinned id missing: ${id}`);
  if (out.stolenwomb?.band !== 2) fail('stolenwomb band != 2');
  if (out.lastbeacon?.band !== 3) fail('lastbeacon band != 3');
  if (out.blackstation?.band !== 3) fail('blackstation band != 3');
  for (const [id, target] of [['lastbeacon', [1080, 900]], ['blackstation', [950, 620]]]) {
    const c = out[id]?.chart;
    if (!c || Math.hypot(c[0] - target[0], c[1] - target[1]) > 30) fail(`${id} chart not near ${target}`);
  }
  if (out.stolenwomb?.station.name !== 'The Stolen Womb') fail('stolenwomb station name wrong');
  if (out.lastbeacon?.station.name !== 'The Last Beacon') fail('lastbeacon station name wrong');
  if (out.blackstation?.station.name !== 'The Black Station') fail('blackstation station name wrong');

  // faction totals (authored + generated)
  const totals = {};
  for (const a of Object.values(AUTHORED)) totals[a.faction] = (totals[a.faction] ?? 0) + 1;
  for (const sys of Object.values(out)) totals[sys.faction] = (totals[sys.faction] ?? 0) + 1;
  for (const [f, n] of Object.entries(EXPECTED_FACTION_TOTALS)) {
    if ((totals[f] ?? 0) !== n) fail(`faction ${f} total ${totals[f] ?? 0} != ${n}`);
  }

  // full connectivity from freehold (physical gates + hub routes traversable)
  const reached = bfsFrom(['freehold']);
  if (reached.size !== 100) {
    const missing = ALL_IDS.filter((id) => !reached.has(id));
    fail(`connectivity: reached ${reached.size}/100 from freehold; missing: ${missing.join(', ')}`);
  }

  // chart bounds + separation
  for (const [id, [x, y]] of chartOf) {
    if (x < 0 || x > 2000 || y < 0 || y > 1400) fail(`${id} chart out of bounds [${x},${y}]`);
  }
  let minSep = Infinity;
  const ids = [...chartOf.keys()];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [ax, ay] = chartOf.get(ids[i]);
      const [bx, by] = chartOf.get(ids[j]);
      minSep = Math.min(minSep, Math.hypot(ax - bx, ay - by));
    }
  }
  if (minSep < 36) fail(`chart min separation ${minSep.toFixed(1)} < 36`);
  return minSep;
}

const minSep = validate();

bailIfErrors();

// -------------------------------------------------------------------- output
const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'src', 'game', 'galaxy.generated.js');
const header = `// GENERATED by scripts/generate-galaxy.mjs — do not edit
// 94 systems, deterministic (SEED = ${SEED}). Authored systems live in state.js;
// state.js spreads this AFTER them so authored key order leads. The generator
// validates that no generated id collides with an authored id, so the spread
// never overwrites an authored record.
`;
writeFileSync(outPath, header + 'export const GENERATED_SYSTEMS = ' + JSON.stringify(out, null, 2) + ';\n');

// ------------------------------------------------------------------- summary
const totals = {};
for (const sys of Object.values(out)) totals[sys.faction] = (totals[sys.faction] ?? 0) + 1;
const bandHist = [0, 0, 0, 0, 0];
for (const sys of Object.values(out)) bandHist[sys.band]++;
const routeEdgeCount = [...routes.values()].reduce((n, l) => n + l.length, 0);
console.log('generate-galaxy: OK (seed ' + SEED + ')');
console.log('  systems: 94 generated + 6 authored = 100');
console.log('  generated per faction:', JSON.stringify(totals));
console.log('  NOTE: contract faction totals sum to 101; ferrous trimmed 18 -> 17 to hit 100.');
console.log(`  physical gate pairs: ${edges.size}, hub route edges: ${routeEdgeCount}`);
console.log(`  hubs: ${HUB_IDS.map((h) => `${h}[${(routes.get(h) ?? []).join(',')}]`).join('  ')}`);
console.log(`  band histogram: ${JSON.stringify(bandHist)}`);
console.log(`  chart min separation: ${minSep.toFixed(1)} units`);
console.log(`  wrote ${outPath}`);
