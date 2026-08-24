import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import {
  plotRoute, clearRoute, recalcOnLoad, initNav, sanitizeNav,
} from '../../../src/game/nav.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');
const chartSrc = src('src/systems/galaxychart.js');
const navSrc = src('src/game/nav.js');
const ctrlSrc = src('src/systems/controls.js');
const ctxSrc = src('src/core/ctx.js');
const hudCss = src('src/ui/hud.css');
const mainSrc = src('src/main.js');
const stationSrc = src('src/systems/station.js');
const saveSrc = src('src/game/save.js');

function stub(systemId = 'freehold') {
  return {
    flags: { saveRestored: false, chartOpen: false },
    world: { time: 0, currentSystem: systemId },
    events: [],
    emit(type, data = {}) {
      this.events.push({ type, t: this.world.time, ...(data && typeof data === 'object' ? data : {}) });
    },
  };
}

SYSTEMS.w85iso_from = {
  id: 'w85iso_from', name: 'IsoFrom', chart: [0, 0],
  gates: [{ to: 'w85iso_dest', position: [0, 0, 0] }],
};
SYSTEMS.w85iso_dest = {
  id: 'w85iso_dest', name: 'IsoDest', chart: [1, 0],
  gates: [{ to: 'w85iso_from', position: [0, 0, 0] }],
};
SYSTEMS.w85iso_side = {
  id: 'w85iso_side', name: 'IsoSide', chart: [2, 0], gates: [],
};

const off = stub('w85iso_from');
off.world.nav = {
  dest: 'w85iso_dest',
  path: ['w85iso_from', 'w85iso_dest'],
  remaining: 1,
  status: 'plotted',
  autopilot: false,
};
const offApi = initNav(off);
offApi.update();
off.world.currentSystem = 'w85iso_side';
off.events = [{ type: 'systemLoaded', t: 0, to: 'w85iso_side' }];
offApi.update();

const arr = stub('freehold');
arr.world.nav = {
  dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: false,
};
const arrApi = initNav(arr);
arrApi.update();
arr.world.currentSystem = 'veridian';
arr.events = [{ type: 'systemLoaded', t: 0, to: 'veridian' }];
arrApi.update();

const first = stub('freehold');
first.world.nav = { dest: 'veridian', path: [], remaining: 0, status: 'blocked', autopilot: false };
initNav(first).update();

const p = stub('freehold');
plotRoute(p, 'veridian');
const hops = p.world.nav && p.world.nav.remaining;
const plotName = SYSTEMS.veridian.name;
const plotComm = p.events.find((e) => e.type === 'commLine');

const c = stub('freehold');
plotRoute(c, 'veridian');
c.events = [];
clearRoute(c);
const clrComm = c.events.find((e) => e.type === 'commLine');

const b = stub('w85iso_side');
b.world.nav = {
  dest: 'w85iso_dest',
  path: ['w85iso_from', 'w85iso_dest'],
  remaining: 1,
  status: 'plotted',
  autopilot: false,
};
recalcOnLoad(b, { to: 'w85iso_side' });
const blkComm = b.events.find((e) => e.type === 'commLine');

const u = stub('veridian');
u.world.nav = {
  dest: 'hollowreach',
  path: ['freehold', 'veridian', 'redmarch', 'hollowreach'],
  remaining: 3,
  status: 'plotted',
  autopilot: false,
};
recalcOnLoad(u, { to: 'veridian' });
const updHops = u.world.nav && u.world.nav.remaining;
const updComm = u.events.find((e) => e.type === 'commLine');

const a = stub('veridian');
a.world.nav = {
  dest: 'veridian', path: ['freehold', 'veridian'], remaining: 1, status: 'plotted', autopilot: false,
};
recalcOnLoad(a, { to: 'veridian' });
const arrComm = a.events.find((e) => e.type === 'commLine');

delete SYSTEMS.w85iso_from;
delete SYSTEMS.w85iso_dest;
delete SYSTEMS.w85iso_side;

const pins = {
  chartOpenDefault: /\bchartOpen:\s*false\b/.test(ctxSrc),
  setOpenWrites: /function setOpen\(next\)[\s\S]{0,240}flags\.chartOpen\s*=/.test(chartSrc),
  fireHeldGate: /fireHeld\s*=\s*fireDown\s*&&\s*ctx\.flags\.chartOpen\s*!==\s*true/.test(ctrlSrc),
  noPrevent: !chartSrc.includes('preventDefault(') && !chartSrc.includes('stopPropagation('),
  noInnerHTML: !chartSrc.includes('innerHTML') && !navSrc.includes('innerHTML'),
  hitDisc: chartSrc.includes('rw-galaxy-hit') && chartSrc.includes("fill: 'transparent'"),
  hubRingNone: /rw-galaxy-hub-ring[\s\S]{0,220}pointer-events:\s*none/.test(hudCss),
  plotClass: chartSrc.includes('rw-galaxy-plot') && hudCss.includes('.rw-galaxy-plot'),
  clearButton: chartSrc.includes("clearBtn.type = 'button'"),
  noMystery: !chartSrc.includes('mystery') && !navSrc.includes('mystery'),
  noLock: !chartSrc.includes('targets.current') && !navSrc.includes('targets.current'),
  keyM: chartSrc.includes("e.code === 'KeyM'"),
  digit0: stationSrc.includes('d === 0') && stationSrc.includes('shipyard'),
  initOrder: /initJump[\s\S]{0,120}initNav/.test(mainSrc),
  noJumpListen: !navSrc.includes("type === 'jumpRequested'") && !navSrc.includes("type === 'dockPressed'"),
  fieldsNav: saveSrc.includes("'nav'"),
  offPathBlocked: off.world.nav && off.world.nav.status === 'blocked' && off.world.nav.dest === 'w85iso_dest',
  destArrival: arr.world.nav && arr.world.nav.status === 'arrived' && arr.world.nav.dest === 'veridian',
  firstRecalc: first.world.nav && first.world.nav.status === 'plotted' && first.world.nav.dest === 'veridian',
  plotEcho: plotComm && plotComm.from === 'Echo' && plotComm.text === (hops === 1
    ? `Route plotted: 1 jump to ${plotName}.`
    : `Route plotted: ${hops} jumps to ${plotName}.`),
  clearEcho: clrComm && clrComm.from === 'Echo' && clrComm.text === 'Route cleared.',
  blockedEcho: blkComm && blkComm.text === 'No route to IsoDest from here.',
  updatedEcho: updComm && typeof updHops === 'number' && updComm.text === (updHops === 1
    ? `Route updated: 1 jump to ${SYSTEMS.hollowreach.name}.`
    : `Route updated: ${updHops} jumps to ${SYSTEMS.hollowreach.name}.`),
  arrivedEcho: arrComm && arrComm.text === `Arrived at ${SYSTEMS.veridian.name}.`,
  noAutopilotChannel: !ctxSrc.includes('ctx.autopilot'),
  sanitizeStill: typeof sanitizeNav === 'function',
};

console.log('wave85 chart probe:', JSON.stringify(pins, null, 2));
const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('WAVE85 CHART PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('WAVE85 CHART PROBE PASS');
