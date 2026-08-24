/**
 * Wave 100 TGT-03 engine-select pins. No DOM.
 */
import { applyHit, createShipState, DEFENSE } from '../../../src/game/state.js';
import {
  healSubsysPart,
  lockIsShip,
  dropPartIfNotShip,
  toggleEnginePart,
  prefersEngine,
  SUBSYS_PART_ENGINE,
} from '../../../src/game/subsys-aim.js';

let fails = 0;
function pin(name, got, expect) {
  const pass = got === expect;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)} expect ${JSON.stringify(expect)}`);
  if (!pass) fails++;
  return pass;
}

function shipCtx(lock) {
  return {
    flags: { docked: false, chartOpen: false },
    gate: { jumping: false },
    targets: { current: lock, part: null },
  };
}

const live = { object: {}, state: createShipState('light'), lockKind: undefined };
const rock = { position: { x: 0, y: 0, z: 0 }, lockKind: 'rock' };

pin('heal engine', healSubsysPart('engine'), 'engine');
pin('heal garbage', healSubsysPart('hull'), null);
pin('heal proto', healSubsysPart('__proto__'), null);
pin('lock ship', lockIsShip(live), true);
pin('lock rock', lockIsShip(rock), false);

const ctx = shipCtx(live);
pin('toggle on', toggleEnginePart(ctx), 'engine');
pin('prefers', prefersEngine(ctx, live), true);
pin('prefers other', prefersEngine(ctx, { object: {}, state: {} }), false);
pin('toggle off', toggleEnginePart(ctx), null);

ctx.targets.part = 'engine';
ctx.targets.current = rock;
dropPartIfNotShip(ctx);
pin('drop on rock', ctx.targets.part, null);

const docked = shipCtx(live);
docked.flags.docked = true;
docked.targets.part = 'engine';
pin('docked no toggle', toggleEnginePart(docked), 'engine');

const s = createShipState('light');
const hull0 = s.hull;
const eng0 = s.engine;
const scr0 = s.screen;
applyHit(s, { damage: 8, family: 'cannon', facet: 'fore', now: 1, preferEngine: true });
pin('peel still screens first', s.screen < scr0, true);
pin('peel hull while screened', s.hull, hull0);
pin('peel engine while screened', s.engine, eng0);

const b = createShipState('light');
b.screen = 0;
b.shell = 0;
const hullB = b.hull;
const engB = b.engine;
applyHit(b, { damage: 12, family: 'cannon', facet: 'fore', now: 2, preferEngine: true });
pin('engine after shields', b.engine < engB, true);
pin('hull skipped while engine', b.hull, hullB);

const c = createShipState('light');
c.screen = 0;
c.shell = 0;
const hullC = c.hull;
const engC = c.engine;
applyHit(c, { damage: 12, family: 'cannon', facet: 'fore', now: 3, preferEngine: false });
pin('fore hull unselected', c.hull < hullC, true);
pin('fore engine unselected', c.engine, engC);

const d = createShipState('light');
d.screen = 0;
d.shell = 0;
const hullD = d.hull;
const engD = d.engine;
applyHit(d, { damage: 6, family: 'cannon', facet: 'aft', now: 4, preferEngine: false });
pin('aft engine unselected', d.engine < engD, true);
pin('aft hull unselected', d.hull < hullD, true);
pin('aftEngineMult live', DEFENSE.aftEngineMult, 2);

if (fails === 0) {
  console.log('WAVE100 subsys PASS');
  process.exit(0);
}
console.log(`WAVE100 subsys FAIL — ${fails}`);
process.exit(1);
