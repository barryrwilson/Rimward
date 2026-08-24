import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SYSTEMS } from '../../../src/game/state.js';
import { WORLD_FIELDS as w85Fields, snapshot as w85Snapshot, restore as w85Restore } from '../../../src/game/save.js';
import { sanitizeNav as w85SanitizeNav, plotRoute as w85Plot, clearRoute as w85Clear } from '../../../src/game/nav.js';

const here85 = dirname(fileURLToPath(import.meta.url));
const root = join(here85, '..', '..', '..');
const src85 = (rel) => readFileSync(join(root, rel), 'utf8');
const nav85src = src85('src/game/nav.js');
const save85src = src85('src/game/save.js');
const state85src = src85('src/game/state.js');
const ctx85src = src85('src/core/ctx.js');

function stub85(systemId = 'freehold') {
  return {
    flags: { saveRestored: false },
    systems: SYSTEMS,
    world: {
      time: 0,
      credits: 350,
      fear: 0,
      reputation: {},
      currentSystem: systemId,
    },
    cargo: [],
    cargoCapacity: 20,
    bio: {
      mood: 'serene', hunger: 0.15, wounds: 0, bond: 0.1,
      growth: 0, fedCount: 0, speedFactor: 1, turnFactor: 1, songEvent: null,
    },
    player: null,
    ship: { object: null, velocity: { set() {} }, speed: 0 },
    ships: [],
    events: [],
    emit(type, data = {}) {
      this.events.push({ type, t: this.world.time, ...(data && typeof data === 'object' ? data : {}) });
    },
  };
}
function bag85(dest, path, remaining, status, extra) {
  return { dest, path, remaining, status, ...(extra && typeof extra === 'object' ? extra : {}) };
}

const fieldsNav = w85Fields.includes('nav')
  && w85Fields.filter((k) => k === 'nav').length === 1
  && !w85Fields.includes('route')
  && !w85Fields.includes('autopilot')
  && !w85Fields.includes('guidance')
  && w85Fields.indexOf('nav') > w85Fields.indexOf('fieldOre');

const omitCtx = stub85();
omitCtx.world.nav = bag85('veridian', ['freehold', 'veridian'], 1, 'plotted', { autopilot: false });
w85Restore(omitCtx, { v: 1, world: { currentSystem: 'freehold', credits: 350 } });
const omitDelete = omitCtx.world.nav === undefined;

const protoCtx = stub85();
protoCtx.world.nav = bag85('__proto__', ['freehold', 'veridian'], 1, 'plotted');
w85SanitizeNav(protoCtx);
const protoDestDrop = protoCtx.world.nav === undefined;

const reservedCtx = stub85();
reservedCtx.world.nav = bag85('constructor', ['freehold', 'veridian'], 1, 'plotted');
w85SanitizeNav(reservedCtx);
const reservedDrop = reservedCtx.world.nav === undefined;

const stuffedCtx = stub85();
stuffedCtx.world.nav = bag85('veridian', ['freehold', 'veridian'], 1, 'active', { hopIndex: 1, cursor: 1 });
w85SanitizeNav(stuffedCtx);
const stuffedDrop = stuffedCtx.world.nav === undefined;

const blockedEmptyCtx = stub85();
blockedEmptyCtx.world.nav = bag85('veridian', [], 0, 'blocked');
w85SanitizeNav(blockedEmptyCtx);
const blockedEmptyKeep = !!blockedEmptyCtx.world.nav
  && blockedEmptyCtx.world.nav.status === 'blocked'
  && blockedEmptyCtx.world.nav.dest === 'veridian'
  && Array.isArray(blockedEmptyCtx.world.nav.path)
  && blockedEmptyCtx.world.nav.path.length === 0
  && blockedEmptyCtx.world.nav.remaining === 0
  && blockedEmptyCtx.world.nav.autopilot === false;

const midCtx = stub85('redmarch');
midCtx.world.nav = bag85(
  'hollowreach',
  ['freehold', 'veridian', 'redmarch', 'hollowreach'],
  3,
  'plotted',
);
w85SanitizeNav(midCtx);
const mid = midCtx.world.nav;
const midSlice = !!mid
  && mid.status === 'plotted'
  && mid.dest === 'hollowreach'
  && Array.isArray(mid.path)
  && mid.path[0] === 'redmarch'
  && mid.path[mid.path.length - 1] === 'hollowreach'
  && mid.path[0] === midCtx.world.currentSystem
  && mid.remaining === mid.path.length - 1
  && mid.remaining === 1
  && mid.autopilot === false;

const offCtx = stub85('hush');
offCtx.world.nav = bag85(
  'hollowreach',
  ['freehold', 'veridian', 'redmarch', 'hollowreach'],
  3,
  'plotted',
);
w85SanitizeNav(offCtx);
const off = offCtx.world.nav;
const offPathBlocked = !!off
  && off.status === 'blocked'
  && off.dest === 'hollowreach'
  && Array.isArray(off.path)
  && off.path.length === 0
  && off.remaining === 0
  && off.autopilot === false;

const arrivedCtx = stub85('freehold');
arrivedCtx.world.nav = bag85('freehold', ['freehold', 'veridian'], 1, 'arrived');
w85SanitizeNav(arrivedCtx);
const arrived = arrivedCtx.world.nav;
const arrivedOk = !!arrived
  && arrived.status === 'arrived'
  && arrived.dest === 'freehold'
  && Array.isArray(arrived.path)
  && arrived.path.length === 1
  && arrived.path[0] === 'freehold'
  && arrived.remaining === 0
  && arrived.autopilot === false;

const remainCtx = stub85();
remainCtx.world.nav = bag85('veridian', ['freehold', 'veridian'], 99, 'plotted');
w85SanitizeNav(remainCtx);
const remainingOk = !!remainCtx.world.nav
  && remainCtx.world.nav.status === 'plotted'
  && remainCtx.world.nav.remaining === 1
  && remainCtx.world.nav.remaining === remainCtx.world.nav.path.length - 1;

const apSan = stub85();
apSan.world.nav = bag85('veridian', ['freehold', 'veridian'], 1, 'plotted', { autopilot: true });
w85SanitizeNav(apSan);
const apSanitizeFalse = apSan.world.nav && apSan.world.nav.autopilot === false;

const apSnapCtx = stub85();
apSnapCtx.world.nav = bag85('veridian', ['freehold', 'veridian'], 1, 'plotted', { autopilot: true });
const apSnap = w85Snapshot(apSnapCtx);
const apSnapFalse = apSnap.world.nav && apSnap.world.nav.autopilot === false;
const apRtCtx = stub85();
apRtCtx.world.nav = bag85('veridian', ['freehold', 'veridian'], 1, 'plotted', { autopilot: true });
w85Restore(apRtCtx, apSnap);
const apRestoreFalse = apRtCtx.world.nav && apRtCtx.world.nav.autopilot === false;
const apNoRoundtrip = apSanitizeFalse && apSnapFalse && apRestoreFalse
  && JSON.stringify(apSnap.world.nav).indexOf('"autopilot":true') < 0;

const hopCtx = stub85('freehold');
hopCtx.events = [];
w85Plot(hopCtx, 'veridian');
const hop = hopCtx.world.nav;
const twoWayPlot = !!hop
  && hop.status === 'plotted'
  && hop.dest === 'veridian'
  && hop.path[0] === 'freehold'
  && hop.path[hop.path.length - 1] === 'veridian'
  && hop.path.includes('veridian')
  && hop.remaining === hop.path.length - 1
  && hop.remaining >= 1;

const hubCtx = stub85('freehold');
w85Plot(hubCtx, 'fh_hearth');
const hub = hubCtx.world.nav;
const hubOneWay = !!hub
  && hub.status === 'plotted'
  && hub.dest === 'fh_hearth'
  && hub.path[0] === 'freehold'
  && hub.path[hub.path.length - 1] === 'fh_hearth';

const unkCtx = stub85('freehold');
unkCtx.world.nav = undefined;
w85Plot(unkCtx, 'no_such_system_w85');
const unknownFail = unkCtx.world.nav === undefined;

const unchartedId = 'w85_uncharted';
SYSTEMS[unchartedId] = {
  id: unchartedId,
  gates: [{ position: [0, 0, 0], to: 'freehold' }],
};
const unchartedCtx = stub85('freehold');
w85Plot(unchartedCtx, unchartedId);
const unchartedFail = unchartedCtx.world.nav === undefined;
delete SYSTEMS[unchartedId];

const plotEv = hopCtx.events.filter((e) => e.type === 'navRoute');
const plotFresh = plotEv.length >= 1
  && plotEv.every((e) => !Object.hasOwn(e, 'path')
    && !Object.hasOwn(e, 'remaining')
    && !Object.hasOwn(e, 'autopilot')
    && typeof e.dest === 'string'
    && typeof e.hops === 'number'
    && typeof e.status === 'string');
const clrCtx = stub85();
w85Plot(clrCtx, 'veridian');
clrCtx.events = [];
w85Clear(clrCtx);
const clrEv = clrCtx.events.find((e) => e.type === 'navRoute');
const clearFresh = clrCtx.world.nav === undefined
  && !!clrEv
  && clrEv.dest === ''
  && clrEv.hops === 0
  && clrEv.status === 'idle'
  && !Object.hasOwn(clrEv, 'path');

const emitSrc = !nav85src.includes("emit('navRoute', world.nav")
  && !nav85src.includes('emit("navRoute", world.nav')
  && !nav85src.includes('emit(\'navRoute\', ctx.world.nav')
  && !nav85src.includes('...world.nav')
  && !nav85src.includes('...ctx.world.nav');
const noInner = !nav85src.includes('innerHTML');
const stateNoNav = !state85src.includes('world.nav')
  && !/export const NAV\b/.test(state85src);
const ctxFreeze = ctx85src.includes("'navRoute'") && ctx85src.includes('dest, hops, status');
const autosaveKey = save85src.includes("const KEY = 'rimward-save-v1'");
const noChartFlag = !ctx85src.includes('chartOpen') && !ctx85src.includes('ctx.autopilot');

const w85 = {
  fieldsNav,
  omitDelete,
  protoDestDrop,
  reservedDrop,
  stuffedDrop,
  blockedEmptyKeep,
  midSlice,
  offPathBlocked,
  arrivedOk,
  remainingOk,
  apNoRoundtrip,
  twoWayPlot,
  hubOneWay,
  unknownFail,
  unchartedFail,
  plotFresh,
  clearFresh,
  emitSrc,
  noInner,
  stateNoNav,
  ctxFreeze,
  autosaveKey,
  noChartFlag,
};
console.log('wave85 nav persist:', JSON.stringify(w85, null, 2));
const failed = Object.entries(w85).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('WAVE85 NAV PERSIST FAIL', failed.join(','));
  process.exit(1);
}
console.log('WAVE85 NAV PERSIST PASS');
