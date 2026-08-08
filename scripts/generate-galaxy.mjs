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
 *
 * Wave 23: every generated system gains exactly one landmark (id
 * '<sysId>_lm'). Landmarks draw from a SECOND rng stream seeded SEED + 1,
 * consumed only by the landmark loop, which runs AFTER the flavor loop has
 * finished with the main stream. The main sequence is untouched, so the
 * generated diff from this pass is purely additive: one new landmarks key
 * per record, nothing else.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AUTHORED_SYSTEMS } from '../src/game/authored-systems.js';

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
// Wave 23 landmark stream: separate seed, separate helpers, consumed ONLY by
// the landmark loop after the flavor loop. The main rng sequence above is
// never advanced by landmark generation.
const lmRng = mulberry32(SEED + 1);
const lmRint = (lo, hi) => lo + Math.floor(lmRng() * (hi - lo + 1));
const lmRf = (lo, hi) => lo + lmRng() * (hi - lo);
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
// Stubs of the 6 authored systems — DERIVED from src/game/authored-systems.js
// (the same records state.js merges into SYSTEMS), so there is no
// hand-maintained duplicate to drift. Only what validation, connectivity, hop
// math, and chart separation need: gates are the gates[].to lists, routes are
// the authored-hub routes ([] when a system has no hub gate).
// Key order follows AUTHORED_SYSTEMS insertion order (Object.fromEntries
// preserves it), keeping AUTHORED_IDS and every downstream RNG-consuming
// iteration identical to the pre-derivation generator.
const AUTHORED = Object.fromEntries(Object.entries(AUTHORED_SYSTEMS).map(([id, s]) => [id, { faction: s.faction, band: s.band, chart: s.chart.slice(), gates: s.gates.map((g) => g.to), routes: s.hub?.routes ? s.hub.routes.slice() : [] }]));
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
// Wave 23: landmarks are NOT part of this loop. They are generated in their
// own pass below, off the lmRng (SEED + 1) stream, so every draw below keeps
// its pre-landmark value and the generated diff stays purely additive.
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

// ------------------------------------------------- wave 23: generated landmarks
// Every generated system gains exactly ONE landmark: { id: '<sysId>_lm', name,
// kind, position, line }. Determinism discipline: this section draws ONLY from
// lmRng (mulberry32(SEED + 1)), in GENERATED_IDS order, AFTER the flavor loop
// above has finished with the main rng stream — the generated diff is a purely
// additive landmarks key per record.
//
// Flavor: per-faction tone pools (mods, per-kind nouns, per-kind lines) plus a
// band>=3 'deep' pool, so landmarks read faction-true and get sparser and
// stranger the farther out they sit. Names are unique across all 94 (redrawn
// from lmRng on collision; validate() re-checks).
const LM_KINDS = ['wreck', 'beacon', 'monument', 'anomaly'];
// Kind weights per band: deeper band = sparser, stranger (anomalies rise).
const LM_KIND_WEIGHTS = [
  { wreck: 4, beacon: 4, monument: 3, anomaly: 1 },
  { wreck: 4, beacon: 3, monument: 3, anomaly: 2 },
  { wreck: 3, beacon: 3, monument: 2, anomaly: 3 },
  { wreck: 3, beacon: 2, monument: 2, anomaly: 5 },
  { wreck: 2, beacon: 1, monument: 1, anomaly: 8 },
];
const LM_TONE = {
  freehold: { // frontier-warm: mourned wrecks, neighbor-kept lights
    mods: ['Harvest', 'Hearth', 'Kinward', 'Tallow', 'Grange', 'Orchard', 'Sweetwater', 'Homeward'],
    nouns: {
      wreck: ['Wain', 'Ark', 'Cart', 'Hauler'],
      beacon: ['Bell', 'Lamp', 'Candle', 'Lantern'],
      monument: ['Table', 'Stone', 'Cairn', 'Marker'],
      anomaly: ['Warm Patch', 'Humming Field', 'Glow', 'Murmur'],
    },
    lines: {
      wreck: [
        'A grain-hauler that missed its lane and never found another. The parish still says its name at harvest.',
        'A family ark, stripped to the ribs. Somebody\'s grandmother was born on it, and they\'ll tell you so.',
        'Broke up hauling seed stock inward. The field around it gets left alone, out of respect.',
      ],
      beacon: [
        'A lane-light the neighbors keep fueled out of their own holds. It marks a turn nobody uses anymore.',
        'A homestead beacon, older than the landing. It still counts the ships that come home.',
        'Tended by whoever passes closest. The log of keepers goes back eleven names.',
      ],
      monument: [
        'A stone for the first field broken this far out. The names on it are still farmed by their grandchildren.',
        'A cairn of ballast rock, one stone per family that stayed. It gets taller every year.',
        'A marker for a well that ran dry. People leave offerings anyway.',
      ],
      anomaly: [
        'A warm patch in the black where instruments drift kind. The old hands call it a good omen and don\'t say why.',
        'The stars here look nearer than they should. Kids dare each other to fly through it.',
        'A slow shimmer, like heat off a summer field. Nothing grows there, but nothing dies there either.',
      ],
    },
    deep: [
      'Out this far the beacon\'s answer comes back late, and slightly wrong.',
      'The last freeholder out this way left the porch light on. It\'s still on.',
    ],
  },
  veridian: { // corporate-cold: filings, write-offs, sealed reports
    mods: ['Claimed', 'Assay', 'Charter', 'Ledgerline', 'Survey', 'Margin', 'Prospect', 'Vested'],
    nouns: {
      wreck: ['Write-Off', 'Hull', 'Tow', 'Barge'],
      beacon: ['Marker', 'Transponder', 'Beacon', 'Relay'],
      monument: ['Cornerstone', 'Plaque', 'Pylon', 'Survey Stone'],
      anomaly: ['Discrepancy', 'Reading', 'Drift Entry', 'Anomaly File'],
    },
    lines: {
      wreck: [
        'A survey hull written off mid-contract. The crew\'s severance is still in arbitration.',
        'An assay barge, stripped the same quarter it sank. The insurance paid out in full and on time.',
        'A company tow, listed as lost, listed again as recovered. Both filings are accurate. Neither is true.',
      ],
      beacon: [
        'A nav beacon broadcasting claim coordinates to a claim that lapsed decades ago.',
        'Corporate lane-marker, proprietary cipher. It does not acknowledge unlicensed hulls.',
        'A beacon placed to hold a filing open. The filing is all that\'s left.',
      ],
      monument: [
        'A cornerstone for an office that was never built. The plaque lists projections.',
        'A memorial plaque for a profitable quarter. The company does not mark its losses.',
        'A survey marker, first of a planned thousand. It remains first.',
      ],
      anomaly: [
        'An unregistered mass reading, flagged for follow-up in a budget cycle that never came.',
        'Sensor ghosts, consistent enough to bill against. The report is sealed.',
        'A drift in the charts that the charts deny. Survey has flown through it twice and filed nothing.',
      ],
    },
    deep: [
      'The beacon\'s corporate cipher still resolves. What it resolves to is no longer on any ledger.',
      'Out here the audit trail ends mid-entry, and the ink looks recent.',
    ],
  },
  ferrous: { // martial: musters, oaths, standing orders
    mods: ['Iron', 'Muster', 'Oathbound', 'Slag', 'Garrison', 'Cohort', 'Foundry', 'Perimeter'],
    nouns: {
      wreck: ['Gunboat', 'Hauler', 'Scow', 'Hulk'],
      beacon: ['Watchlight', 'Range Marker', 'Muster Beacon', 'Perimeter Buoy'],
      monument: ['Oath-Stone', 'Column', 'Slab', 'Roll'],
      anomaly: ['Dead Zone', 'Held Breath', 'Blind Spot', 'Null Reading'],
    },
    lines: {
      wreck: [
        'A troop-hauler holed at her moorings. The muster roll inside was never recovered.',
        'A gunboat that lost its war before the war started. The garrison salutes it on passing.',
        'A foundry scow, scuttled rather than surrendered. Some say the slag in her holds is still warm.',
      ],
      beacon: [
        'A perimeter beacon marking a line the Bastion no longer holds. The watch still logs it.',
        'A muster beacon, dark since the last call-up. Nobody stood down the watch that lit it.',
        'A range marker for guns that were scrapped. It keeps perfect time.',
      ],
      monument: [
        'An oath-stone for a cohort that did not come back. The names are punched, not carved — iron doesn\'t take sentiment.',
        'A victory column for a battle the histories don\'t mention. The garrison maintains it anyway.',
        'A slab of armor plate listing the fallen of a single shift. The foundry paid for it without being asked.',
      ],
      anomaly: [
        'A dead zone where comms fall flat. Patrols file around it and call the habit tradition.',
        'A reading like a held breath. Gunnery used it for calibration once; they don\'t anymore.',
        'Something out there reflects ranging pulses a half-second late. The Bastion has standing orders not to ping it.',
      ],
    },
    deep: [
      'The perimeter light at the edge of the map still answers roll call. No one remembers who it answers to.',
      'A watch-post buoy beyond the last patrol route. Its log shows one visitor, years apart, always the same hull.',
    ],
  },
  redledger: { // outlaw-ledger: tolls, tallies, debts that outlive people
    mods: ['Tollward', 'Tally', 'Marked', 'Debtor\'s', 'Cutthroat', 'Posted', 'Ledger', 'Due'],
    nouns: {
      wreck: ['Hulk', 'Courier', 'Dodger', 'Hollow Hull'],
      beacon: ['Lane-Marker', 'Guide-Light', 'Toll-Beacon', 'Marker Buoy'],
      monument: ['Tally-Stone', 'Pillar', 'Marker', 'Reminder'],
      anomaly: ['Echo', 'Gravity Tick', 'Blind Toll', 'Black Stretch'],
    },
    lines: {
      wreck: [
        'A toll-dodger, holed and stripped. The ledger keeps it listed as an example, not a loss.',
        'A courier that carried the wrong debt. What\'s left is exactly what was owed.',
        'A hulk the cutters use for practice. Its former owner is still paying it off.',
      ],
      beacon: [
        'A private lane-marker. The toll for its route is posted nowhere and collected always.',
        'A beacon that changes its code when a ship without marker credit comes close.',
        'A guide-light for a route that isn\'t on any chart you can buy.',
      ],
      monument: [
        'A tally-stone for debts settled in full. It is very small.',
        'A marker where a ledger war ended. Both sides claim it; both sides pay for its upkeep.',
        'A pillar of fused credit chips. It is not a memorial. It is a reminder.',
      ],
      anomaly: [
        'A stretch of black where the toll-beacons don\'t answer. The ledger charges extra to cross it, and can\'t say why.',
        'Something here echoes back your own transponder, a day later, from somewhere else.',
        'An unmarked gravity tick the pilots feel in their teeth. It isn\'t in the ledger, which worries the ledger.',
      ],
    },
    deep: [
      'The farthest toll-light the ledger ever hung. Its account is still open, and something keeps paying it.',
      'Out past the last marker, a buoy that bills nobody. The ledger leaves it alone.',
    ],
  },
  gilded: { // guild mercantile: auctions, lots, commissions
    mods: ['Gilded', 'Catalog', 'Reserve', 'Gavel', 'Consignment', 'Patron\'s', 'Saleroom', 'Lot'],
    nouns: {
      wreck: ['Galleon', 'Yacht', 'Lot', 'Salvage'],
      beacon: ['Lane-Light', 'Auction Beacon', 'Commission Marker', 'Guide'],
      monument: ['Gavel', 'Plinth', 'Monument', 'Pedestal'],
      anomaly: ['Shimmer', 'Echo', 'Gallery', 'Acoustic'],
    },
    lines: {
      wreck: [
        'A galleon that went down with the season\'s catalog. The auction of its salvage rights outlasted the salvage.',
        'A buyer\'s yacht, scuttled for the insurance and then, embarrassingly, found.',
        'A lot that failed to sell: one ship, slightly used, reserve not met. It\'s still on the block.',
      ],
      beacon: [
        'A lane-light gilded beyond function. It marks the approach to a market that moved inward years ago.',
        'An auction beacon still calling lot numbers to an empty reach.',
        'A commission marker: a patron paid for a light here, so a light there is.',
      ],
      monument: [
        'A golden gavel, ten meters tall, struck against nothing. It commemorates a record sale nobody attended.',
        'A plinth for a statue the guild voted not to afford. The plinth was already paid for.',
        'A monument to the guild\'s founding bid. The runner-up is commemorated nowhere.',
      ],
      anomaly: [
        'A shimmer the guild certified as art and now charges to view.',
        'An echo in the deep band that sounds, if you\'re selling, exactly like applause.',
        'A patch of space with excellent acoustics. Recitals are held there. Attendance is declining.',
      ],
    },
    deep: [
      'The guild\'s farthest showroom: one spotlight, one pedestal, nothing on it. Offers are accepted.',
      'A catalog beacon past the last buyer. The lots it lists were beautiful, once.',
    ],
  },
  beautiful: { // faded glamor: beauty kept past its usefulness
    mods: ['Mirror', 'Gilt', 'Velvet', 'Fallen', 'Opal', 'Faded', 'Chandelier', 'Last Season\'s'],
    nouns: {
      wreck: ['Barge', 'Salon Ship', 'Hull', 'Ballroom'],
      beacon: ['Lantern', 'Waltz Beacon', 'Light', 'Candle'],
      monument: ['Muse', 'Obelisk', 'Statue', 'Monument'],
      anomaly: ['Bloom', 'Silence', 'Arrangement', 'Composition'],
    },
    lines: {
      wreck: [
        'A pleasure barge sunk at anchor. The mirrors in her ballroom still catch the sun.',
        'A salon ship that burned rather than age. The Beautiful speak of it the way others speak of saints.',
        'A chandelier hull, adrift. It is more beautiful broken, and everyone here knows it.',
      ],
      beacon: [
        'A beacon tuned to a frequency only the Beautiful use. It is broadcasting a waltz.',
        'A light placed so the wreck field sparkles at approach. Function was a secondary concern.',
        'A lantern of blown glass and hard vacuum. It should not still be lit. It is.',
      ],
      monument: [
        'A statue of a muse the artist later denied sculpting. Both are famous now.',
        'A mirror-polished obelisk. It shows you the stars behind you, slightly improved.',
        'A monument to a season, not a person. The Beautiful agree it was the best season.',
      ],
      anomaly: [
        'A bloom of color with no source. The Beautiful hold viewings. The instruments hold their peace.',
        'Something here makes every hull line look deliberate. Pilots linger and don\'t say why.',
        'A silence so well-composed it has admirers.',
      ],
    },
    deep: [
      'The farthest salon: a ring of seats facing the void. The void, reportedly, has taste.',
      'A light out past everything, arranged just so. No one admits to arranging it.',
    ],
  },
  congregation: { // penitent: vows, psalms, tended absences
    mods: ['Penitent\'s', 'Psalm', 'Votive', 'Chapel', 'Pilgrim', 'Unshriven', 'Vigil', 'Choir'],
    nouns: {
      wreck: ['Barge', 'Chapel Ship', 'Skiff', 'Pilgrim Hull'],
      beacon: ['Lamp', 'Sung Note', 'Waypoint', 'Vigil Light'],
      monument: ['Vow-Stone', 'Bell Frame', 'Cairn', 'Shrine'],
      anomaly: ['Hush', 'Answer', 'Dark Patch', 'Reverence'],
    },
    lines: {
      wreck: [
        'A pilgrim barge that broke apart mid-psalm. The congregation finishes the verse when they pass.',
        'A chapel ship, holed and cold. The bell was salvaged; the silence was left.',
        'A penitent\'s skiff, abandoned mid-vow. The vow is considered binding.',
      ],
      beacon: [
        'A lamp lit for travelers who died before reaching it. It is relit every cycle without fail.',
        'A beacon that broadcasts nothing but a single sung note. The faithful call it enough.',
        'A waypoint on a pilgrimage route that ends at a gate with no other side.',
      ],
      monument: [
        'A vow-stone, carved by hands that never saw it placed. That was the vow.',
        'A bell frame without a bell. The congregation hears it anyway.',
        'A cairn for the unrepentant. It is the only cairn here, and it is tended.',
      ],
      anomaly: [
        'A hush in the band where even static goes reverent. The congregation holds services at its edge.',
        'An answer comes back to prayers broadcast here. It is one word. The word is not comfort.',
        'A patch of dark the faithful cross themselves against. Their instruments see nothing. Their instruments are not faithful.',
      ],
    },
    deep: [
      'The last chapel lamp before the quiet. The psalm sung here is shorter than it used to be.',
      'A listening post with no listener. The congregation calls that faith.',
    ],
  },
  assembly: { // bureaucratic: case numbers, standing orders, authoritative charts
    mods: ['Registered', 'Filed', 'Pending', 'Quorum', 'Indexed', 'Standing', 'Corrected', 'Bureau'],
    nouns: {
      wreck: ['Tug', 'Census Barge', 'Courier Hull', 'File'],
      beacon: ['Aid', 'Reference Marker', 'Beacon', 'Notice Buoy'],
      monument: ['Plaque', 'Obelisk', 'Memorial', 'Archive'],
      anomaly: ['Case Number', 'Discrepancy', 'Unregistered Region', 'Flag'],
    },
    lines: {
      wreck: [
        'A registry tug lost with the only copy of a form. The form cannot be reissued. The wreck cannot be removed.',
        'A census barge, sunk by paperwork in the literal end. Its crew are listed as present.',
        'A courier hull carrying corrected records. The correction was never filed. Nothing was ever wrong.',
      ],
      beacon: [
        'A beacon maintained under a standing order no one has read. Compliance is total.',
        'A navigational aid, class four, subsection pending. It has been pending for sixty years.',
        'A reference marker for a grid the rest of the rim declined to adopt.',
      ],
      monument: [
        'A memorial to the Bureau\'s founding quorum. Attendance is recorded as unanimous.',
        'A plaque listing every regulation ever passed here. It is load-bearing.',
        'An archive obelisk, indexed, cross-indexed, and unread.',
      ],
      anomaly: [
        'A sensor phenomenon with a case number. The case number has a case number.',
        'An unregistered region, flagged for registration. Registration keeps not happening.',
        'A discrepancy between the chart and the sky. The chart is considered authoritative.',
      ],
    },
    deep: [
      'The last office: one desk buoy, one lamp, one inbox. The inbox is not empty.',
      'A filing beacon past the rim\'s edge. It acknowledges receipt of nothing, promptly.',
    ],
  },
  independent: { // unclaimed drift: hand-built lights, shared secrets, no flags
    mods: ['Drift', 'Bootleg', 'Hand-Built', 'Nameless', 'Salvage', 'Wayward', 'Unclaimed', 'Scratch'],
    nouns: {
      wreck: ['Hull', 'Barge', 'Road Sign', 'Hulk'],
      beacon: ['Lane-Light', 'Beacon', 'Lamp', 'Signal'],
      monument: ['Bell Pile', 'Marker', 'Slab', 'Census'],
      anomaly: ['Drift-Current', 'Black Patch', 'Hum', 'Blind Spot'],
    },
    lines: {
      wreck: [
        'A drifter\'s hull, patched past patching. Whoever left it didn\'t look back, and neither does anyone else.',
        'A claim-jumper\'s barge, dead between claims. Nobody filed. Nobody files out here.',
        'A nameless hulk the drifters use as a road sign. Turn inward at the wreck, they say, and you\'ll find water.',
      ],
      beacon: [
        'A bootleg beacon running on salvage cells. It marks a camp that moves when the law drifts close.',
        'A hand-built lane-light. The drift keeps it lit for the next ones through.',
        'A beacon with no registry code and a very loyal following.',
      ],
      monument: [
        'A pile of engine bells, one for every drifter who didn\'t make the crossing. Ringing one is bad luck. Not ringing is worse.',
        'A marker for a well found by accident and lost on purpose. The coordinates are a shared secret.',
        'A slab of hull plate with names scratched in a dozen hands. It is the only census the unclaimed have.',
      ],
      anomaly: [
        'A drift-current with no mass behind it. The unclaimed ride it inward and pay nothing.',
        'A patch of black that swallows transponder codes. The drift considers that a feature.',
        'Something out here hums under the engine note. The drifters hum back.',
      ],
    },
    deep: [
      'The last light nobody owns. Past it, even the ledger gives up.',
      'A beacon at the edge of everything, kept by whoever\'s closest. Tonight that\'s you.',
    ],
  },
  lamplighter: { // wayfinding elegy: the lane carried outward past its end
    mods: ['Outward', 'Keeper\'s', 'Way', 'Interval', 'Last-Lit', 'Lens', 'Far', 'Unlit'],
    nouns: {
      wreck: ['Tender', 'Way-Ship', 'Hull', 'Lantern Room'],
      beacon: ['Lamp', 'Way-Light', 'Beacon', 'Light'],
      monument: ['Keeper Stone', 'Waymark', 'Lantern-Post', 'Marker'],
      anomaly: ['Sourceless Light', 'Echo', 'Dark Interval', 'Wrong-Direction Signal'],
    },
    lines: {
      wreck: [
        'A lamp-tender\'s tender, run down by its own route. The lamps it served are still lit.',
        'A way-ship that carried the light farther than the light was meant to go. It is dark now. The route is not.',
        'A hull the lamplighters stripped for lenses. They left the lantern room out of respect.',
      ],
      beacon: [
        'A lamp in a chain of lamps, most of them gone. It keeps the interval anyway.',
        'The second-to-last beacon on the outward lane. It knows what\'s next.',
        'A way-light older than the route it marks. The route changed; the light didn\'t.',
      ],
      monument: [
        'A stone for the keepers who walked the lane and didn\'t come back. The list is longer than the lane.',
        'A waymark pointing at a destination the maps call speculative.',
        'A lantern-post with no lamp, kept polished. It is a promise, not a memorial.',
      ],
      anomaly: [
        'A light with no source, holding station off the lane. The lamplighters log it as one of theirs.',
        'An echo of the Last Beacon\'s signal, arriving from the wrong direction.',
        'A stretch of lane where the stars go out in order, one by one, and then relight.',
      ],
    },
    deep: [
      'The last lamp before the lane gives out. Its keeper left a note: still lit when I left.',
      'Past the Last Beacon, a light that should not exist, keeping a schedule no one set.',
    ],
  },
};

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// Separation invariants (re-checked in validate()): >=400u from the station,
// >=300u from every gate and (when present) the hub gate, beyond field
// radius + 200, and within 1000u of the origin.
function lmPositionOk(sys, pos) {
  if (Math.hypot(pos[0], pos[1], pos[2]) > 1000) return false;
  if (dist3(pos, sys.station.position) < 400) return false;
  for (const g of sys.gates) if (dist3(pos, g.position) < 300) return false;
  if (dist3(pos, sys.field.center) < sys.field.radius + 200) return false;
  if (sys.hub && dist3(pos, sys.hub.position) < 300) return false;
  return true;
}
function lmPosition(sys) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const ang = lmRf(0, Math.PI * 2);
    const d = lmRf(500, 900);
    const pos = [Math.round(Math.cos(ang) * d), lmRint(-120, 160), Math.round(Math.sin(ang) * d)];
    if (lmPositionOk(sys, pos)) return pos;
  }
  fail(`${sys.id} landmark position: no valid candidate in 40 attempts`);
  return [0, 0, 0]; // validate() bails before output on any error
}
function lmKindPick(band) {
  const w = LM_KIND_WEIGHTS[band];
  const total = LM_KINDS.reduce((n, k) => n + w[k], 0);
  let roll = lmRf(0, total);
  for (const k of LM_KINDS) { roll -= w[k]; if (roll < 0) return k; }
  return LM_KINDS[LM_KINDS.length - 1];
}
const lmNameTaken = new Set();
function lmNamePick(sys, tone, kind) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const mod = tone.mods[lmRint(0, tone.mods.length - 1)];
    const noun = tone.nouns[kind][lmRint(0, tone.nouns[kind].length - 1)];
    const style = lmRint(0, 2);
    const name = style === 0 ? `The ${noun}` : style === 1 ? `The ${mod} ${noun}` : `${mod} ${noun}`;
    if (!lmNameTaken.has(name)) { lmNameTaken.add(name); return name; }
  }
  fail(`${sys.id} landmark name: no unique candidate in 60 attempts`);
  return `Unnamed ${kind}`; // validate() bails before output on any error
}

for (const id of GENERATED_IDS) {
  const sys = out[id];
  const tone = LM_TONE[sys.faction];
  if (!tone) { fail(`${id} has no landmark tone for faction ${sys.faction}`); continue; }
  const kind = lmKindPick(sys.band);
  const name = lmNamePick(sys, tone, kind);
  const linePool = sys.band >= 3 ? tone.lines[kind].concat(tone.deep) : tone.lines[kind];
  const line = linePool[lmRint(0, linePool.length - 1)];
  const position = lmPosition(sys);
  // Rebuild the record with landmarks right after chart: inserting the new key
  // anywhere but the record's end keeps the generated diff purely additive
  // (JSON's trailing-comma rule would otherwise touch the old last line).
  const { id: _id, name: _name, faction: _faction, band: _band, chart: _chart, ...rest } = sys;
  out[id] = { id: _id, name: _name, faction: _faction, band: _band, chart: _chart, landmarks: [{ id: `${id}_lm`, name, kind, position, line }], ...rest };
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
    if (!Array.isArray(sys.landmarks) || sys.landmarks.length !== 1) fail(`${sys.id} must have exactly one landmark`);
    if ('clues' in sys) fail(`${sys.id} must omit clues`);
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

  // wave 23: landmark shape, id scheme '<sysId>_lm', id/name uniqueness
  // (ids unique against authored landmark ids too), separation invariants
  const authoredLmIds = new Set();
  for (const a of Object.values(AUTHORED_SYSTEMS)) for (const lm of a.landmarks ?? []) authoredLmIds.add(lm.id);
  const seenLmIds = new Set();
  const seenLmNames = new Set();
  for (const sys of Object.values(out)) {
    const lm = sys.landmarks?.[0];
    if (!lm) continue; // count check above already failed for this record
    if (lm.id !== `${sys.id}_lm`) fail(`${sys.id} landmark id ${lm.id} != ${sys.id}_lm`);
    if (authoredLmIds.has(lm.id) || seenLmIds.has(lm.id)) fail(`${sys.id} landmark id collision: ${lm.id}`);
    seenLmIds.add(lm.id);
    if (!['wreck', 'beacon', 'monument', 'anomaly'].includes(lm.kind)) fail(`${sys.id} landmark kind invalid: ${lm.kind}`);
    if (!lm.name || !lm.line) fail(`${sys.id} landmark missing name/line`);
    if (seenLmNames.has(lm.name)) fail(`${sys.id} landmark name collision: ${lm.name}`);
    seenLmNames.add(lm.name);
    const p = lm.position;
    if (!Array.isArray(p) || p.length !== 3 || p.some((v) => typeof v !== 'number')) {
      fail(`${sys.id} landmark position malformed`);
      continue;
    }
    if (Math.hypot(p[0], p[1], p[2]) > 1000) fail(`${sys.id} landmark beyond 1000u from origin`);
    if (dist3(p, sys.station.position) < 400) fail(`${sys.id} landmark <400u from station`);
    for (const g of sys.gates) if (dist3(p, g.position) < 300) fail(`${sys.id} landmark <300u from gate to ${g.to}`);
    if (dist3(p, sys.field.center) < sys.field.radius + 200) fail(`${sys.id} landmark inside field buffer`);
    if (sys.hub && dist3(p, sys.hub.position) < 300) fail(`${sys.id} landmark <300u from hub`);
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
// 94 systems, deterministic (SEED = ${SEED}). Authored systems live in
// authored-systems.js; state.js spreads this AFTER them so authored key order
// leads. The generator validates that no generated id collides with an
// authored id, so the spread never overwrites an authored record.
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
const lmCount = Object.values(out).reduce((n, s) => n + (s.landmarks?.length ?? 0), 0);
console.log(`  landmarks: ${lmCount} (1 per generated system)`);
console.log(`  wrote ${outPath}`);
