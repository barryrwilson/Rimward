// Wave 111 REP-03 PR1 — Digit 9 climb copy after restitution-to-0 (no Vite, no dock).
// node out/w111/rep03/probe.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const stationSrc = src('src/systems/station.js');
const saveSrc = src('src/game/save.js');
const hudSrc = src('src/systems/hud.js');
const hudCss = src('src/ui/hud.css');
const stateSrc = src('src/game/state.js');

const {
  standingRemedialNotes,
  standingMoveNotes,
  standingLiveNotes,
  DOCK_KEY_SERVICES,
} = await import('../../../src/systems/station.js');
const { WORLD_FIELDS } = await import('../../../src/game/save.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const helperStart = stationSrc.indexOf('export function standingRemedialNotes()');
const helperEnd = stationSrc.indexOf('function authoredUu(');
const helperSrc = helperStart >= 0 && helperEnd > helperStart
  ? stationSrc.slice(helperStart, helperEnd)
  : '';
const epicsStart = stationSrc.indexOf('function renderEpics(panel)');
const epicsEnd = stationSrc.indexOf('function renderLaunch(panel)');
const epicsSrc = epicsStart >= 0 && epicsEnd > epicsStart
  ? stationSrc.slice(epicsStart, epicsEnd)
  : '';
const restIf = epicsSrc.indexOf('standingRead(ctx.world?.reputation, dockFac) < 0');
const restHead = epicsSrc.indexOf("'RESTITUTION'");
const howHead = epicsSrc.indexOf('HOW STANDING MOVES');
const climbCall = epicsSrc.indexOf('standingRemedialNotes');
const liveHead = epicsSrc.indexOf('LIVE CONSEQUENCES');
const restBlock = restIf >= 0 && howHead > restIf ? epicsSrc.slice(restIf, howHead) : '';
const worldFieldsSrc = saveSrc.slice(
  saveSrc.indexOf('export const WORLD_FIELDS'),
  saveSrc.indexOf('const SURVIVOR'),
);
const reticleSrc = hudSrc.slice(
  hudSrc.indexOf("const reticle = el('div', 'rw-reticle', root);"),
  hudSrc.indexOf("const crosshair = el('div', 'rw-crosshair', root);"),
);

pin('helper.exists', typeof standingRemedialNotes === 'function'
  && helperSrc.includes('export function standingRemedialNotes()'));

const notes = typeof standingRemedialNotes === 'function' ? standingRemedialNotes() : null;
pin('helper.array', Array.isArray(notes) && notes.length >= 1);
pin('helper.strings', Array.isArray(notes) && notes.every((n) => typeof n === 'string' && n.length > 0));
const blob = Array.isArray(notes) ? notes.join(' ') : '';

pin('copy.afterRestitution0', /After restitution/.test(blob) && /0 \(Stranger\)/.test(blob));
pin('copy.graftCap', /graft cap/.test(blob) && /Beautiful/.test(blob));
pin('copy.jobsBoard', /Jobs board/.test(blob));
pin('copy.families', /mining, trade, hunt, passenger, explore, spy, and war/.test(blob));
pin('copy.plus2', /\+2/.test(blob) && helperSrc.includes('MINING_REP'));
pin('copy.climbFrom0', /climbs from 0/.test(blob) && /Five such jobs/.test(blob));
pin('copy.known10', /Known 10/.test(blob) && helperSrc.includes('ladderNameAt(10)'));
pin('copy.patrolFreeholdOnly', /Patrol adds \+5/.test(blob) && /Freehold Compact only/.test(blob)
  && helperSrc.includes('PATROL_REP'));
pin('copy.noJobLockLie', !/locked until restitution/i.test(blob) && !/jobs are locked/i.test(blob));
pin('copy.noPatrolEveryFlag', !/patrol rebuilds/i.test(blob) && !/every offended/i.test(blob));

pin('render.climbAfterHowMoves', climbCall > howHead && howHead > restHead && climbCall < liveHead);
pin('render.climbAtStanding0', climbCall > howHead
  && !/standingRead\([^)]*\)\s*(>=|>)\s*0/.test(epicsSrc.slice(howHead, climbCall + 40)));
pin('render.climbAtStandingPositive', climbCall > howHead && climbCall < liveHead
  && !restBlock.includes('standingRemedialNotes'));
pin('render.restitutionOnlyWhenNegative', restIf >= 0
  && restHead > restIf
  && restHead < howHead
  && restBlock.includes("'RESTITUTION'")
  && !restBlock.includes('standingRemedialNotes'));
pin('render.hTextContent', epicsSrc.includes("h('div', 'screen-note', panel, climb[i])")
  && stationSrc.includes('if (text !== undefined) node.textContent = text;'));
pin('render.failClosedTry', epicsSrc.includes("typeof standingRemedialNotes === 'function'")
  && epicsSrc.includes('catch {')
  && epicsSrc.includes('standingMoveNotes()')
  && epicsSrc.includes('standingLiveNotes()'));

const moves = standingMoveNotes();
const lives = standingLiveNotes();
pin('failClosed.moveNotesPresent', typeof standingMoveNotes === 'function'
  && Array.isArray(moves) && moves.length > 0);
pin('failClosed.liveNotesPresent', typeof standingLiveNotes === 'function'
  && Array.isArray(lives) && lives.length > 0);

pin('no.kindRemedial', !/kind:\s*['"]remedial['"]/.test(stationSrc));
pin('digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard'
  && stationSrc.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
  && stationSrc.includes("d === 0")
  && stationSrc.includes("selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])"));
pin('digit2.jobs', DOCK_KEY_SERVICES[1] === 'jobs' && stationSrc.includes("'Jobs board'"));
pin('digit8.launch', DOCK_KEY_SERVICES[7] === 'launch');
pin('digit9.epics', DOCK_KEY_SERVICES[8] === 'epics' && stationSrc.includes("'launch', 'epics'"));
pin('hub.empty', hudCss.includes('80px')
  && reticleSrc.includes("el('div', 'rw-reticle-pupil', reticle)")
  && reticleSrc.includes("el('div', 'rw-reticle-range', reticle, 'RANGE')")
  && !/remedial|wanted/.test(reticleSrc));
pin('persist.noNewWorldFields', !/wanted|remedial/.test(worldFieldsSrc)
  && WORLD_FIELDS.includes('reputation')
  && WORLD_FIELDS.includes('jobs')
  && !WORLD_FIELDS.includes('wanted')
  && !WORLD_FIELDS.includes('remedial'));
pin('notes.noInnerHTML', Array.isArray(notes)
  && notes.every((n) => !n.includes('innerHTML'))
  && !helperSrc.includes('innerHTML')
  && !epicsSrc.includes('innerHTML'));
pin('notes.noProtoIndex', !helperSrc.includes('__proto__')
  && !helperSrc.includes("['constructor']")
  && !helperSrc.includes("['prototype']")
  && helperSrc.includes("factionDisplayName('beautiful')")
  && helperSrc.includes("factionDisplayName('freehold')"));
pin('state.noWrite', !/REMEDIAL_/.test(stateSrc)
  && stateSrc.includes("min: 10, name: 'Known'")
  && stateSrc.includes("name: 'Stranger'"));
pin('knobs.live', stationSrc.includes('const MINING_REP = 2')
  && stationSrc.includes('const PATROL_REP = 5')
  && /RESTITUTION_UU/.test(stationSrc));

if (fails.length) {
  console.log('PROBE FAIL', fails.join('; '));
  process.exit(1);
}
console.log('PROBE PASS', fails.length === 0);
process.exit(0);
