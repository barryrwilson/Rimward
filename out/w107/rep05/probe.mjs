// Wave 107 REP-05 PR3 — Digit 9 standingLiveNotes copy (no Vite).
// node out/w107/rep05/probe.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const stationSrc = src('src/systems/station.js');
const leaveSrc = src('src/game/police-leave.js');
const coverSrc = src('src/game/police-cover.js');
const jumpSrc = src('src/game/jump.js');

const {
  standingLiveNotes,
  DOCK_KEY_SERVICES,
} = await import('../../../src/systems/station.js');
const { POLICE_LEAVE_LINE, POLICE_LEAVE_RADIUS } = await import('../../../src/game/police-leave.js');
const { COVERING_LINE, COVERING_STANDING_MIN } = await import('../../../src/game/police-cover.js');
const { JUMP_REFUSE_LINE, JUMP_REFUSE_STANDING, JUMP_REFUSE_SKIP } = await import('../../../src/game/jump.js');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const notes = standingLiveNotes();
pin('notes.array', Array.isArray(notes));
pin('notes.strings', Array.isArray(notes) && notes.every((n) => typeof n === 'string' && n.length > 0));
pin('notes.leaveLine', notes.some((n) => n.includes(POLICE_LEAVE_LINE)));
pin('notes.coverLine', notes.some((n) => n.includes(COVERING_LINE)));
pin('notes.jumpLine', notes.some((n) => n.includes(JUMP_REFUSE_LINE)));
pin('notes.huntMinus10', notes.some((n) => n.includes('standing -10') && n.toLowerCase().includes('hunt')));
pin('notes.yardsBelow0', notes.some((n) => n.toLowerCase().includes('yards') && n.includes('below 0')));
pin('notes.restitution', notes.some((n) => n.toLowerCase().includes('restitution') && n.includes('1200')));
pin('notes.locker', notes.some((n) => n.toLowerCase().includes('locker') && n.includes('fear')));
pin('notes.graft', notes.some((n) => n.toLowerCase().includes('graft')));
pin('notes.aceKnown', notes.some((n) => n.includes('Ace') && n.includes('Known') && n.includes('10')));
pin('notes.frigateTrusted', notes.some((n) => n.includes('Frigate') && n.includes('Trusted') && n.includes('25')));
pin('notes.leaveBand', notes.some((n) => n.includes('below 0') && n.includes('above -10') && n.includes(`${POLICE_LEAVE_RADIUS} u`)));
pin('notes.coverKnown', notes.some((n) => n.includes(`Known ${COVERING_STANDING_MIN}`) && n.includes(COVERING_LINE)));
pin('notes.jumpMarked', notes.some((n) => n.includes(`below ${JUMP_REFUSE_STANDING}`) && n.includes('Marked') && n.includes('Suspect does not lock')));
pin('notes.jumpSkip', notes.some((n) => n.includes('Skip') && n.includes('Unknowables') && n.includes('Hollow Reach') && n.includes('Independent')));
pin('notes.dockOpen', notes.some((n) => n.includes('Dock stays open') && n.includes(JUMP_REFUSE_LINE)));
pin('notes.noInnerHTML', notes.every((n) => !n.includes('innerHTML')));
pin('notes.noProtoKey', notes.every((n) => !n.includes('__proto__')));

pin('copy.leave', POLICE_LEAVE_LINE === 'Leave this space.');
pin('copy.cover', COVERING_LINE === 'Patrol covering.');
pin('copy.jump', JUMP_REFUSE_LINE === 'No passage.');
pin('copy.leaveRadius', POLICE_LEAVE_RADIUS === 300);
pin('copy.coverMin', COVERING_STANDING_MIN === 10);
pin('copy.jumpStanding', JUMP_REFUSE_STANDING === -25);
pin('copy.jumpSkip', JUMP_REFUSE_SKIP.has('unknowables') && JUMP_REFUSE_SKIP.has('hollow') && JUMP_REFUSE_SKIP.has('independent'));

const notesFn = stationSrc.slice(
  stationSrc.indexOf('export function standingLiveNotes()'),
  stationSrc.indexOf('function authoredUu('),
);
pin('src.usesLeaveConst', notesFn.includes('POLICE_LEAVE_LINE') && notesFn.includes('POLICE_LEAVE_RADIUS'));
pin('src.usesCoverConst', notesFn.includes('COVERING_LINE') && notesFn.includes('COVERING_STANDING_MIN'));
pin('src.usesJumpConst', notesFn.includes('JUMP_REFUSE_LINE') && notesFn.includes('JUMP_REFUSE_STANDING') && notesFn.includes('JUMP_REFUSE_SKIP'));
pin('src.notesNoInnerHTML', !notesFn.includes('innerHTML'));
pin('src.notesNoProtoFaction', !notesFn.includes('__proto__') && !notesFn.includes("['constructor']") && !notesFn.includes("['prototype']"));
pin('src.renderTextContent', stationSrc.includes("h('div', 'screen-note', panel, lives[i])"));
pin('src.hUsesTextContent', stationSrc.includes('if (text !== undefined) node.textContent = text;'));
pin('src.noStandingInnerHTML', !/standingLiveNotes[\s\S]{0,800}innerHTML/.test(stationSrc));

pin('digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard'
  && stationSrc.includes("i === DOCK_KEY_SERVICES.length - 1 ? 0")
  && stationSrc.includes("d === 0")
  && stationSrc.includes("selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])"));
pin('digit9.epics', DOCK_KEY_SERVICES[8] === 'epics'
  && DOCK_KEY_SERVICES.indexOf('epics') === 8);
pin('digit0.notThisPane', !notes.some((n) => /digit 0/i.test(n) && /standing/i.test(n))
  && !notes.some((n) => /shipyard/i.test(n)));
pin('src.digitBindUntouched', stationSrc.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'])"));

pin('src.leaveUntouched', leaveSrc.includes("export const POLICE_LEAVE_LINE = 'Leave this space.'")
  && leaveSrc.includes('standing < 0 && standing > -10'));
pin('src.coverUntouched', coverSrc.includes("export const COVERING_LINE = 'Patrol covering.'")
  && coverSrc.includes('export const COVERING_STANDING_MIN = 10'));
pin('src.jumpUntouched', jumpSrc.includes("export const JUMP_REFUSE_LINE = 'No passage.'")
  && jumpSrc.includes('export const JUMP_REFUSE_STANDING = -25'));

if (fails.length) {
  console.log('PROBE FAIL', fails.join('; '));
  process.exit(1);
}
console.log('PROBE PASS', fails.length === 0);
process.exit(0);
