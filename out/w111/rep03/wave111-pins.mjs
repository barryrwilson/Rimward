// Isolated WAVE111 REP-03 pin extract. Does not boot the live game.
// node out/w111/rep03/wave111-pins.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src111 = (rel) => readFileSync(join(root, rel), 'utf8');

const {
  standingRemedialNotes: climb111,
  standingMoveNotes: move111,
  standingLiveNotes: live111,
  DOCK_KEY_SERVICES: keys111,
} = await import('../../../src/systems/station.js');
const { WORLD_FIELDS: fields111 } = await import('../../../src/game/save.js');

const st111 = src111('src/systems/station.js');
const save111 = src111('src/game/save.js');
const hud111 = src111('src/systems/hud.js');
const hudCss111 = src111('src/ui/hud.css');
const state111 = src111('src/game/state.js');
const helperStart111 = st111.indexOf('export function standingRemedialNotes()');
const helperEnd111 = st111.indexOf('function authoredUu(');
const helperSrc111 = helperStart111 >= 0 && helperEnd111 > helperStart111
  ? st111.slice(helperStart111, helperEnd111)
  : '';
const epicsStart111 = st111.indexOf('function renderEpics(panel)');
const epicsEnd111 = st111.indexOf('function renderLaunch(panel)');
const epicsSrc111 = epicsStart111 >= 0 && epicsEnd111 > epicsStart111
  ? st111.slice(epicsStart111, epicsEnd111)
  : '';
const restIf111 = epicsSrc111.indexOf('standingRead(ctx.world?.reputation, dockFac) < 0');
const restHead111 = epicsSrc111.indexOf("'RESTITUTION'");
const howHead111 = epicsSrc111.indexOf('HOW STANDING MOVES');
const climbCall111 = epicsSrc111.indexOf('standingRemedialNotes');
const liveHead111 = epicsSrc111.indexOf('LIVE CONSEQUENCES');
const restBlock111 = restIf111 >= 0 && howHead111 > restIf111
  ? epicsSrc111.slice(restIf111, howHead111)
  : '';
const worldFields111 = save111.slice(
  save111.indexOf('export const WORLD_FIELDS'),
  save111.indexOf('const SURVIVOR'),
);
const reticle111 = hud111.slice(
  hud111.indexOf("const reticle = el('div', 'rw-reticle', root);"),
  hud111.indexOf("const crosshair = el('div', 'rw-crosshair', root);"),
);
const notes111 = typeof climb111 === 'function' ? climb111() : null;
const notesText111 = Array.isArray(notes111) ? notes111.join(' ') : '';
const moves111 = typeof move111 === 'function' ? move111() : null;
const lives111 = typeof live111 === 'function' ? live111() : null;

const w111 = {
  helperExists: typeof climb111 === 'function' && helperSrc111.includes('export function standingRemedialNotes()'),
  climbAtStanding0: climbCall111 > howHead111
    && howHead111 > restHead111
    && !/standingRead\([^)]*\)\s*(>=|>)\s*0/.test(epicsSrc111.slice(howHead111, climbCall111 + 40)),
  climbAtStandingPositive: climbCall111 > howHead111
    && climbCall111 < liveHead111
    && !restBlock111.includes('standingRemedialNotes'),
  restitutionOnlyWhenNegative: restIf111 >= 0
    && restHead111 > restIf111
    && restHead111 < howHead111
    && restBlock111.includes("'RESTITUTION'")
    && !restBlock111.includes('standingRemedialNotes'),
  noRemedialKind: !/kind:\s*['"]remedial['"]/.test(st111),
  digit0Shipyard: keys111[keys111.length - 1] === 'shipyard'
    && st111.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
    && st111.includes("d === 0")
    && st111.includes("selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])"),
  digit2Jobs: keys111[1] === 'jobs'
    && st111.includes("'Jobs board'"),
  digit8Digit9: keys111[7] === 'launch'
    && keys111[8] === 'epics'
    && st111.includes("'launch', 'epics'"),
  hubEmpty: hudCss111.includes('80px')
    && reticle111.includes("el('div', 'rw-reticle-pupil', reticle)")
    && reticle111.includes("el('div', 'rw-reticle-range', reticle, 'RANGE')")
    && !/remedial|wanted|standing/.test(reticle111),
  noNewWorldFields: !/wanted|remedial/.test(worldFields111)
    && fields111.includes('reputation')
    && fields111.includes('jobs')
    && !fields111.includes('wanted')
    && !fields111.includes('remedial'),
  noInnerHtmlNotes: Array.isArray(notes111)
    && notes111.every((n) => typeof n === 'string' && n.length > 0 && !n.includes('innerHTML'))
    && !helperSrc111.includes('innerHTML')
    && !epicsSrc111.includes('innerHTML')
    && st111.includes('if (text !== undefined) node.textContent = text;'),
  failClosedMoveLive: typeof move111 === 'function'
    && typeof live111 === 'function'
    && Array.isArray(moves111) && moves111.length > 0
    && Array.isArray(lives111) && lives111.length > 0
    && epicsSrc111.includes('standingMoveNotes()')
    && epicsSrc111.includes('standingLiveNotes()')
    && epicsSrc111.includes("typeof standingRemedialNotes === 'function'"),
  copyHonesty: /After restitution/.test(notesText111)
    && /Jobs board/.test(notesText111)
    && /mining, trade, hunt, passenger, explore, spy, and war/.test(notesText111)
    && /\+2/.test(notesText111)
    && /climbs from 0/.test(notesText111)
    && /Known 10/.test(notesText111)
    && /Patrol adds \+5/.test(notesText111)
    && /Freehold Compact only/.test(notesText111)
    && /graft cap/.test(notesText111)
    && !/locked until restitution/i.test(notesText111)
    && !/jobs are locked/i.test(notesText111),
  knobsUntouched: st111.includes('const MINING_REP = 2')
    && st111.includes('const PATROL_REP = 5')
    && state111.includes("min: 10, name: 'Known'")
    && !/REMEDIAL_/.test(state111),
};

console.log('wave111 rep-03 climb:', JSON.stringify(w111));
const failed = Object.entries(w111).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('WAVE111 REP-03 FAIL', failed.join(','));
  process.exit(1);
}
console.log('WAVE111 REP-03 PASS');
process.exit(0);
