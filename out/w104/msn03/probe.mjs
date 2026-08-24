/**
 * Wave 104 PR1 — unique DONE board hide pins. Static + tiny board replica.
 * Does not import station.js (full dock ctx is heavy). Does not edit boot-test.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const station = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const save = readFileSync(join(root, 'src/game/save.js'), 'utf8');

let fails = 0;
function pin(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) fails++;
  return ok;
}

const UNIQUE_IDS = [
  'bounty-ace',
  'patrol-lane',
  'haul-provisions',
  'ferry-consignment',
];

const uniqueDoneSkip = `if (j.state === 'done' && (
      j.id === 'bounty-ace' || j.id === 'patrol-lane'
      || j.id === 'haul-provisions' || j.id === 'ferry-consignment'
    )) continue;`;

const chainSkip = "if (j.kind === 'chain' && j.state === 'done') continue;";

const boardFn = station.match(/function boardJobs\(ctx, sysId\) \{[\s\S]*?\n\}/);
pin('boardJobs function present', !!boardFn);
const boardSrc = boardFn ? boardFn[0] : '';
pin('chain done skip stays in boardJobs', boardSrc.includes(chainSkip));
pin('unique done skip next to chain skip', boardSrc.includes(`${chainSkip}
    // Hide unique DONE on the board; keep the persist row (hide ≠ splice).
    ${uniqueDoneSkip}`));
pin('unique skip uses exact ids not in-operator', boardSrc.includes(uniqueDoneSkip)
  && !/UNIQUE_JOB_KIND/.test(boardSrc)
  && !/\bin\b/.test(boardSrc.split(chainSkip)[1]?.slice(0, 400) || ''));

const completeFn = station.match(/function completeJob\(ctx, job, notice\) \{[\s\S]*?\n\}/);
pin('completeJob present', !!completeFn);
pin('completeJob has no splice', !!(completeFn && !completeFn[0].includes('splice')));
pin('completeJob stamps done', !!(completeFn && completeFn[0].includes("job.state = 'done'")));

pin('uniqueRetry source in renderJobs', station.includes("const uniqueRetry = job.state === 'done'")
  && station.includes("job.id === 'ferry-consignment' || job.id === 'haul-provisions'"));
pin('uniqueRetry Accept branch', station.includes('if (job.state === \'offered\' || uniqueRetry)'));
pin('ferry DONE accept reset still in acceptJob',
  station.includes("if (job.id === 'ferry-consignment' && job.state === 'done')")
  && station.includes("job.state = 'offered'"));

pin('Digit 2 Jobs (DOCK_KEY_SERVICES[1])',
  /export const DOCK_KEY_SERVICES = Object\.freeze\(\['market', 'jobs'/.test(station));
pin('Digit 0 shipyard (last service)',
  /export const DOCK_KEY_SERVICES = Object\.freeze\(\[[^\]]*'shipyard'\]\)/.test(station));
pin('Digit 0 selects last service',
  station.includes('selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])'));
pin('JOBS BOARD header stays',
  station.includes('JOBS BOARD — ${currentDef.station.name} postings'));
pin('no innerHTML in station.js', !/innerHTML/.test(station));

const uniqueMap = save.match(/const UNIQUE_JOB_KIND = \{[\s\S]*?\};/);
pin('UNIQUE_JOB_KIND present', !!uniqueMap);
for (const id of UNIQUE_IDS) {
  pin(`UNIQUE map has ${id}`, !!(uniqueMap && uniqueMap[0].includes(`'${id}'`)));
}
pin('uniqueJobId is Object.hasOwn', save.includes('return Object.hasOwn(UNIQUE_JOB_KIND, id)'));
pin('uniqueJobId not exported', !/export function uniqueJobId/.test(save)
  && !/export \{[^}]*uniqueJobId/.test(save));

const fields = save.match(/export const WORLD_FIELDS = \[[\s\S]*?\];/);
pin('WORLD_FIELDS present', !!fields);
pin('WORLD_FIELDS has no uniqueDone key', !!(fields && !/uniqueDone/.test(fields[0])));
pin('WORLD_FIELDS still lists jobs', !!(fields && fields[0].includes("'jobs'")));

function replicaBoard(jobs, sysId) {
  const out = [];
  for (const j of jobs) {
    if (j.kind === 'bounty' && j.id.startsWith('bounty-pirate-')
      && j.state === 'offered' && j.system !== sysId) continue;
    if (j.kind === 'chain' && j.state === 'done') continue;
    if (j.state === 'done' && (
      j.id === 'bounty-ace' || j.id === 'patrol-lane'
      || j.id === 'haul-provisions' || j.id === 'ferry-consignment'
    )) continue;
    out.push(j);
  }
  return out;
}

const jobs = [
  { id: 'bounty-ace', kind: 'bounty', state: 'done' },
  { id: 'patrol-lane', kind: 'patrol', state: 'done' },
  { id: 'haul-provisions', kind: 'haul', state: 'done' },
  { id: 'ferry-consignment', kind: 'ferry', state: 'done' },
  { id: 'bounty-ace', kind: 'bounty', state: 'offered' },
  { id: 'patrol-lane', kind: 'patrol', state: 'accepted' },
  { id: 'haul-provisions', kind: 'haul', state: 'offered' },
  { id: 'ferry-consignment', kind: 'ferry', state: 'accepted' },
  { id: 'chain-freehold-3', kind: 'chain', state: 'done' },
  { id: 'chain-freehold-1', kind: 'chain', state: 'offered' },
  { id: 'bounty-pirate-1', kind: 'bounty', state: 'done', system: 'freehold' },
  { id: 'mining-freehold-1', kind: 'mining', state: 'offered', originSystem: 'freehold' },
];
const persist = jobs.slice(0, 4);
const board = replicaBoard(jobs, 'freehold');
const boardKeys = board.map((j) => `${j.id}:${j.state}`);

pin('unique done hidden on board',
  UNIQUE_IDS.every((id) => !boardKeys.includes(`${id}:done`)));
pin('unique offered still on board',
  boardKeys.includes('bounty-ace:offered') && boardKeys.includes('haul-provisions:offered'));
pin('unique accepted still on board',
  boardKeys.includes('patrol-lane:accepted') && boardKeys.includes('ferry-consignment:accepted'));
pin('persist still holds unique done rows', persist.length === 4 && persist.every((j) => j.state === 'done'));
pin('chain done still hidden', !boardKeys.includes('chain-freehold-3:done'));
pin('chain offered still visible', boardKeys.includes('chain-freehold-1:offered'));
pin('overlay pirate DONE not hidden', boardKeys.includes('bounty-pirate-1:done'));
pin('family offered not hidden', boardKeys.includes('mining-freehold-1:offered'));

const protoJobs = [{ id: '__proto__', kind: 'bounty', state: 'done' }];
pin('proto id is not unique-done hide',
  replicaBoard(protoJobs, 'freehold').some((j) => j.id === '__proto__'));

if (fails) {
  console.log(`FAIL  ${fails} pin(s)`);
  process.exit(1);
}
console.log('PASS  all pins');
process.exit(0);
