#!/usr/bin/env node
/**
 * Wave 136 PR1 mining-identity replica.
 * Loads pick/sync/replace helpers from live src/systems/station.js.
 * Does not import the browser module.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const STATION = path.join(ROOT, 'src/systems/station.js');
const OUT = path.join(__dirname, 'probe-results.json');

const COMMODITIES = {
  provisions: { name: 'Provisions', base: 100 },
  refinedMetals: { name: 'Refined metals', base: 240 },
  rawOre: { name: 'Raw ore', base: 140 },
  livingRock: { name: 'Living rock', base: 600 },
};
const ORE_TYPES = {
  rawOre: { hardness: 1 },
  livingRock: { hardness: 1 },
  slagIron: { hardness: 2 },
};
const SYSTEMS = {
  freehold: { name: 'Freehold Drift', station: { name: 'Freehold Drift' } },
};
const MINING_ORE_KEYS = [];
for (const oreKey of Object.keys(ORE_TYPES)) {
  if (ORE_TYPES[oreKey].hardness <= 1 && Object.hasOwn(COMMODITIES, oreKey)) {
    MINING_ORE_KEYS.push(oreKey);
  }
}

const FERRY_UNITS = 4;
const HAUL_MARGIN = 1.4;
const MINING_DEADLINE = 600;
const MINING_SLOTS_PER_SYSTEM = 2;

function priceOf(_ctx, key) {
  return COMMODITIES[key]?.base ?? 0;
}

function uniqueFour() {
  return [
    { id: 'bounty-ace', kind: 'bounty', state: 'offered' },
    { id: 'patrol-lane', kind: 'patrol', state: 'offered' },
    { id: 'haul-provisions', kind: 'haul', state: 'offered' },
    { id: 'ferry-consignment', kind: 'ferry', state: 'offered' },
  ];
}

function mineCard(id, slot, commodity, state) {
  return {
    id,
    kind: 'mining',
    slot,
    originSystem: 'freehold',
    commodity,
    title: `Mine ${COMMODITIES[commodity]?.name ?? 'ore'}`,
    need: FERRY_UNITS,
    progress: 0,
    state,
    deadline: 600,
  };
}

function liveMining(jobs) {
  return jobs.filter((j) => j && j.kind === 'mining' && j.originSystem === 'freehold'
    && (j.state === 'offered' || j.state === 'accepted'));
}

function loadHelpers(opts = {}) {
  const src = fs.readFileSync(STATION, 'utf8');
  const start = src.indexOf('function pickMiningCommodityExcluding');
  const end = src.indexOf('function miningOreName');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('could not slice mining helpers from station.js');
  }
  const slice = src.slice(start, end);
  const oreKeys = opts.oreKeys ?? MINING_ORE_KEYS.slice();
  const commodities = opts.commodities ?? { ...COMMODITIES };
  const factory = new Function(
    'MINING_ORE_KEYS',
    'COMMODITIES',
    'SYSTEMS',
    'FERRY_UNITS',
    'MINING_DEADLINE',
    'MINING_SLOTS_PER_SYSTEM',
    'HAUL_MARGIN',
    'priceOf',
    `'use strict';
     let miningSeq = 0;
     ${slice}
     return {
       pickMiningCommodityExcluding,
       pickMiningCommodity,
       makeMiningJob,
       healOfferedMiningTwins,
       syncMiningJobs,
       replaceMiningJob,
       nextMiningId,
       setMiningSeq(n) { miningSeq = n; },
       getMiningSeq() { return miningSeq; },
     };`,
  );
  return factory(
    oreKeys,
    commodities,
    SYSTEMS,
    FERRY_UNITS,
    MINING_DEADLINE,
    MINING_SLOTS_PER_SYSTEM,
    HAUL_MARGIN,
    priceOf,
  );
}

function sourcePins(src) {
  const start = src.indexOf('function pickMiningCommodityExcluding');
  const end = src.indexOf('function miningOreName');
  const miningRegion = start >= 0 && end > start ? src.slice(start, end) : '';
  const pickFn = src.match(/function pickMiningCommodityExcluding\([\s\S]*?\nfunction pickMiningCommodity/)?.[0] ?? '';
  return {
    'src.mining.excludeHelper': /function pickMiningCommodityExcluding\(usedSet\)/.test(src),
    'src.mining.boundedAttempts': /const attempts = n \+ 2/.test(src)
      && /for \(let i = 0; i < n && i < attempts; i\+\+\)/.test(src),
    'src.mining.noWhileTruePick': !/function pickMiningCommodityExcluding[\s\S]*?while\s*\(\s*true\s*\)/.test(pickFn + '\n'),
    'src.mining.failClosedCommodities': /function makeMiningJob[\s\S]*?if \(!commodity \|\| !Object\.hasOwn\(COMMODITIES, commodity\)\) return null/.test(src),
    'src.mining.needUntouched': /function makeMiningJob[\s\S]*?const need = FERRY_UNITS/.test(src),
    'src.mining.slotsCap': /const MINING_SLOTS_PER_SYSTEM = 2/.test(src),
    'src.mining.syncOmitBreak': /function syncMiningJobs[\s\S]*?if \(!job\) break/.test(src),
    'src.mining.healOffered': /function healOfferedMiningTwins/.test(src)
      && (/prefer slot 1/.test(src) || /ja\.slot === 1/.test(src)),
    'src.mining.nextIdKept': /function nextMiningId/.test(src)
      && /const id = nextMiningId\(jobs, sysId\)/.test(src),
    'src.mining.noInnerHTML': !/innerHTML|insertAdjacentHTML|document\.write/.test(miningRegion),
    'src.uniqueFour.untouched': /id: 'bounty-ace'/.test(src)
      && /id: 'patrol-lane'/.test(src)
      && /id: 'haul-provisions'/.test(src)
      && /id: 'ferry-consignment'/.test(src),
    'src.digit2.jobs': (() => {
      const m = src.match(/export const DOCK_KEY_SERVICES = Object\.freeze\(\[([^\]]+)\]\)/);
      if (!m) return false;
      const keys = m[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
      return keys[1] === 'jobs';
    })(),
    'src.jobs.paintTextContent': /function h\(tag, cls, parent, text\)[\s\S]*?node\.textContent = text/.test(src),
    'src.mining.noWhileTrueFilePickRegion': !/while\s*\(\s*true\s*\)/.test(miningRegion),
    'src.pay.miningPayBase': /return Math\.round\(need \* priceOf\(ctx, commodity\) \* HAUL_MARGIN\)/.test(src),
    authoredKeysOnly: /MINING_ORE_KEYS\[i\]/.test(pickFn),
  };
}

function assert(cond, msg, failures) {
  if (!cond) failures.push(msg);
}

function runProbeA() {
  const h = loadHelpers();
  const jobs = uniqueFour();
  jobs.push(mineCard('mine-freehold-8', 0, 'rawOre', 'offered'));
  jobs.push(mineCard('mine-freehold-9', 1, 'rawOre', 'offered'));
  const ctx = { world: { jobs, time: 0 } };
  h.setMiningSeq(20);
  h.syncMiningJobs(ctx, 'freehold');
  const live = liveMining(jobs);
  const commodities = live.map((j) => j.commodity);
  const unique = new Set(commodities);
  const slot0 = live.find((j) => j.slot === 0);
  const slot1 = live.find((j) => j.slot === 1);
  const ids = live.map((j) => j.id);
  const failures = [];
  assert(live.length === 1 || live.length === 2, `A live count ${live.length}`, failures);
  assert(unique.size === live.length, `A shared commodity ${commodities.join(',')}`, failures);
  assert(!(live.length === 2 && commodities.every((c) => c === 'rawOre')), 'A two offered rawOre remain', failures);
  if (live.length === 2 && slot0 && slot1) {
    assert(slot0.commodity === 'rawOre', `A prefer slot0 stay rawOre got ${slot0.commodity}`, failures);
    assert(slot1.commodity !== 'rawOre', `A slot1 still ${slot1.commodity}`, failures);
    assert(slot0.id === 'mine-freehold-8', `A slot0 id mutated ${slot0.id}`, failures);
    assert(slot1.id !== 'mine-freehold-9', `A reused spliced id ${slot1.id} while miningSeq past suffix`, failures);
    assert(!ids.includes('mine-freehold-9'), `A spliced id still live ${ids.join(',')}`, failures);
  }
  for (const id of ['bounty-ace', 'patrol-lane', 'haul-provisions', 'ferry-consignment']) {
    assert(jobs.some((j) => j.id === id), `A unique-four missing ${id}`, failures);
  }
  return {
    name: 'A-offered-twins-heal',
    pass: failures.length === 0,
    failures,
    live: live.map((j) => ({ id: j.id, slot: j.slot, commodity: j.commodity, state: j.state })),
  };
}

function runProbeB() {
  const failures = [];
  const samples = [];
  for (let t = 0; t < 80; t++) {
    const h = loadHelpers();
    const jobs = uniqueFour();
    const ctx = { world: { jobs, time: 0 } };
    h.syncMiningJobs(ctx, 'freehold');
    const live = liveMining(jobs);
    const commodities = live.map((j) => j.commodity);
    const unique = new Set(commodities);
    if (live.length < 0 || live.length > 2) failures.push(`B count ${live.length} trial ${t}`);
    if (unique.size !== live.length) failures.push(`B twin ${commodities.join(',')} trial ${t}`);
    samples.push(commodities.slice().sort().join('+'));
  }
  return {
    name: 'B-empty-origin-fill',
    pass: failures.length === 0,
    failures: failures.slice(0, 8),
    sampleSet: [...new Set(samples)],
  };
}

function runProbeC() {
  const h = loadHelpers();
  const jobs = uniqueFour();
  jobs.push(mineCard('mine-freehold-8', 0, 'rawOre', 'accepted'));
  jobs.push(mineCard('mine-freehold-9', 1, 'rawOre', 'accepted'));
  const ctx = { world: { jobs, time: 0 } };
  h.syncMiningJobs(ctx, 'freehold');
  const live = liveMining(jobs);
  const failures = [];
  assert(live.length === 2, `C count ${live.length}`, failures);
  assert(live.every((j) => j.commodity === 'rawOre' && j.state === 'accepted'), 'C rewritten', failures);
  assert(live.some((j) => j.id === 'mine-freehold-8') && live.some((j) => j.id === 'mine-freehold-9'), 'C ids spliced', failures);
  return {
    name: 'C-accepted-twins-stay',
    pass: failures.length === 0,
    failures,
    live: live.map((j) => ({ id: j.id, slot: j.slot, commodity: j.commodity, state: j.state })),
  };
}

function runProbeD() {
  const h = loadHelpers();
  const jobs = uniqueFour();
  const slot0 = mineCard('mine-freehold-8', 0, 'rawOre', 'accepted');
  const slot1 = mineCard('mine-freehold-9', 1, 'livingRock', 'offered');
  jobs.push(slot0, slot1);
  const ctx = { world: { jobs, time: 0 } };
  h.setMiningSeq(20);
  h.replaceMiningJob(ctx, slot1);
  const live = liveMining(jobs);
  const failures = [];
  const next1 = live.find((j) => j.slot === 1);
  assert(live.some((j) => j.id === 'mine-freehold-8' && j.commodity === 'rawOre'), 'D slot0 lost', failures);
  if (next1) {
    assert(next1.commodity !== 'rawOre', `D replacement ${next1.commodity}`, failures);
    assert(next1.id !== 'mine-freehold-9', `D reused spliced id ${next1.id}`, failures);
  } else {
    // omit is pass when table cannot supply a different key
    assert(live.length === 1, `D omit but count ${live.length}`, failures);
  }
  return {
    name: 'D-replace-excludes-sibling',
    pass: failures.length === 0,
    failures,
    live: live.map((j) => ({ id: j.id, slot: j.slot, commodity: j.commodity, state: j.state })),
  };
}

function runOmitTable() {
  const h = loadHelpers({ oreKeys: ['rawOre'] });
  const jobs = uniqueFour();
  const ctx = { world: { jobs, time: 0 } };
  h.syncMiningJobs(ctx, 'freehold');
  const live = liveMining(jobs);
  const failures = [];
  assert(live.length <= 1, `omit filled ${live.length}`, failures);
  if (live[0]) assert(live[0].commodity === 'rawOre', `omit got ${live[0].commodity}`, failures);
  return { name: 'omit-size-1-table', pass: failures.length === 0, failures, count: live.length };
}

function runFailClosed() {
  const commodities = { livingRock: { name: 'Living rock', base: 600 } };
  const h = loadHelpers({ oreKeys: ['rawOre'], commodities });
  const ctx = { world: { jobs: uniqueFour(), time: 0 } };
  const job = h.makeMiningJob(ctx, 'freehold', 0);
  const pick = h.pickMiningCommodityExcluding(new Set());
  return {
    name: 'fail-closed-missing-COMMODITIES',
    pass: job === null && pick === null,
    failures: job === null && pick === null ? [] : [`job=${job && job.commodity} pick=${pick}`],
  };
}

function runAuthoredOnly() {
  const h = loadHelpers();
  const used = new Set(['rawOre', 'attackerKey', 'slagIron']);
  const picks = new Set();
  for (let i = 0; i < 40; i++) {
    picks.add(h.pickMiningCommodityExcluding(used));
  }
  const failures = [];
  assert([...picks].every((k) => k === 'livingRock'), `authored pick set ${[...picks]}`, failures);
  const emptyUsedPicks = new Set();
  for (let i = 0; i < 40; i++) emptyUsedPicks.add(h.pickMiningCommodityExcluding(new Set()));
  assert(!emptyUsedPicks.has('slagIron') && !emptyUsedPicks.has('attackerKey'),
    `leaked ${[...emptyUsedPicks]}`, failures);
  return { name: 'authored-keys-only', pass: failures.length === 0, failures, picks: [...picks] };
}

function runOtherFamilyUntouched() {
  const h = loadHelpers();
  const jobs = uniqueFour();
  jobs.push({ id: 'trade-freehold-1', kind: 'trade', originSystem: 'freehold', slot: 0, commodity: 'provisions', state: 'offered' });
  jobs.push({ id: 'trade-freehold-2', kind: 'trade', originSystem: 'freehold', slot: 1, commodity: 'provisions', state: 'offered' });
  const ctx = { world: { jobs, time: 0 } };
  h.syncMiningJobs(ctx, 'freehold');
  const trades = jobs.filter((j) => j.kind === 'trade');
  const failures = [];
  assert(trades.length === 2 && trades.every((j) => j.commodity === 'provisions'), 'trade twins mutated', failures);
  return { name: 'other-family-untouched', pass: failures.length === 0, failures };
}

function runPayFormula() {
  const h = loadHelpers();
  const ctx = { world: { jobs: uniqueFour(), time: 0 } };
  const job = h.makeMiningJob(ctx, 'freehold', 0);
  const failures = [];
  assert(job && job.need === FERRY_UNITS, `need ${job && job.need}`, failures);
  const expect = Math.round(FERRY_UNITS * COMMODITIES[job.commodity].base * HAUL_MARGIN);
  assert(job.reward === expect, `pay ${job.reward} != ${expect}`, failures);
  return { name: 'pay-formula', pass: failures.length === 0, failures, need: job?.need, reward: job?.reward, commodity: job?.commodity };
}

const src = fs.readFileSync(STATION, 'utf8');
const pins = sourcePins(src);
const pinFailures = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);

const probes = [
  runProbeA(),
  runProbeB(),
  runProbeC(),
  runProbeD(),
  runOmitTable(),
  runFailClosed(),
  runAuthoredOnly(),
  runOtherFamilyUntouched(),
  runPayFormula(),
];

const result = {
  ok: pinFailures.length === 0 && probes.every((p) => p.pass),
  miningOreKeys: MINING_ORE_KEYS,
  pins,
  pinFailures,
  probes,
};

fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
