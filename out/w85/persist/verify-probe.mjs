import { SYSTEMS } from '../../../src/game/state.js';
import { snapshot, restore } from '../../../src/game/save.js';
import { sanitizeNav, plotRoute, clearRoute } from '../../../src/game/nav.js';

function stub(systemId = 'freehold') {
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

const results = {};

const hopKeep = stub();
hopKeep.world.nav = {
  dest: 'veridian',
  path: ['freehold', 'veridian'],
  remaining: 1,
  status: 'plotted',
  hopIndex: 7,
  cursor: 2,
  next: 'veridian',
  active: true,
};
sanitizeNav(hopKeep);
const bag = hopKeep.world.nav;
results.hopIndexDroppedOnKeep = !!bag
  && bag.status === 'plotted'
  && bag.dest === 'veridian'
  && bag.hopIndex === undefined
  && bag.cursor === undefined
  && bag.next === undefined
  && bag.active === undefined
  && !Object.hasOwn(bag, 'hopIndex');

const rawAp = stub();
restore(rawAp, {
  v: 1,
  world: {
    currentSystem: 'freehold',
    credits: 350,
    nav: {
      dest: 'veridian',
      path: ['freehold', 'veridian'],
      remaining: 1,
      status: 'plotted',
      autopilot: true,
    },
  },
});
results.restoreRawAutopilotFalse = !!rawAp.world.nav
  && rawAp.world.nav.autopilot === false
  && rawAp.world.nav.status === 'plotted';

const protoRestore = stub();
protoRestore.world.nav = {
  dest: 'veridian',
  path: ['freehold', 'veridian'],
  remaining: 1,
  status: 'plotted',
};
restore(protoRestore, {
  v: 1,
  world: {
    currentSystem: 'freehold',
    credits: 350,
    nav: {
      dest: '__proto__',
      path: ['freehold', 'veridian'],
      remaining: 1,
      status: 'plotted',
    },
  },
});
results.restoreProtoDestDrop = protoRestore.world.nav === undefined;

const same = stub('freehold');
same.world.nav = {
  dest: 'veridian',
  path: ['freehold', 'veridian'],
  remaining: 1,
  status: 'plotted',
  autopilot: false,
};
same.events = [];
plotRoute(same, 'freehold');
const idleEv = same.events.find((e) => e.type === 'navRoute');
results.sameSystemClears = same.world.nav === undefined
  && !!idleEv
  && idleEv.status === 'idle'
  && idleEv.dest === ''
  && idleEv.hops === 0
  && !Object.hasOwn(idleEv, 'path');

const hub = stub('freehold');
plotRoute(hub, 'fh_hearth');
results.hubFromFreehold = !!hub.world.nav
  && hub.world.nav.status === 'plotted'
  && Array.isArray(hub.world.nav.path)
  && hub.world.nav.path[0] === 'freehold'
  && hub.world.nav.path[hub.world.nav.path.length - 1] === 'fh_hearth'
  && hub.world.nav.path.length === 2;

const ids = {
  a: 'w85p_dir_a',
  b: 'w85p_dir_b',
  h: 'w85p_hub_h',
  s: 'w85p_hub_s',
  u: 'w85p_uncharted',
};
function add(id, def) {
  SYSTEMS[id] = { id, name: id, chart: [0, 0], gates: [], ...def };
}
try {
  add(ids.a, { gates: [{ position: [0, 0, 0], to: ids.b }] });
  add(ids.b, { gates: [] });
  add(ids.h, { gates: [], hub: { position: [0, 0, 0], routes: [ids.s] } });
  add(ids.s, { gates: [] });
  SYSTEMS[ids.u] = { id: ids.u, gates: [{ position: [0, 0, 0], to: 'freehold' }] };

  const dirFwd = stub(ids.a);
  plotRoute(dirFwd, ids.b);
  results.directedGateFwd = !!dirFwd.world.nav
    && dirFwd.world.nav.status === 'plotted'
    && dirFwd.world.nav.path.join(',') === `${ids.a},${ids.b}`;

  const dirRev = stub(ids.b);
  plotRoute(dirRev, ids.a);
  results.directedGateNoReverse = !!dirRev.world.nav
    && dirRev.world.nav.status === 'blocked'
    && dirRev.world.nav.dest === ids.a
    && dirRev.world.nav.path.length === 0
    && dirRev.world.nav.remaining === 0;

  const hubFwd = stub(ids.h);
  plotRoute(hubFwd, ids.s);
  results.hubFwd = !!hubFwd.world.nav
    && hubFwd.world.nav.status === 'plotted'
    && hubFwd.world.nav.path.join(',') === `${ids.h},${ids.s}`;

  const hubRev = stub(ids.s);
  plotRoute(hubRev, ids.h);
  results.hubNoReverse = !!hubRev.world.nav
    && hubRev.world.nav.status === 'blocked'
    && hubRev.world.nav.dest === ids.h
    && hubRev.world.nav.path.length === 0;

  const unch = stub('freehold');
  plotRoute(unch, ids.u);
  results.unchartedNoWrite = unch.world.nav === undefined;
} finally {
  for (const id of Object.values(ids)) delete SYSTEMS[id];
}

const omitRem = stub();
omitRem.world.nav = { dest: 'veridian', path: ['freehold', 'veridian'], status: 'plotted' };
sanitizeNav(omitRem);
results.omitRemainingDrops = omitRem.world.nav === undefined;

const idleStored = stub();
idleStored.world.nav = {
  dest: 'veridian',
  path: ['freehold', 'veridian'],
  remaining: 1,
  status: 'idle',
};
sanitizeNav(idleStored);
results.idleStoredDrops = idleStored.world.nav === undefined;

const smash = stub();
smash.events = [];
plotRoute(smash, 'veridian');
const ev = smash.events.find((e) => e.type === 'navRoute');
results.emitFreshLiteral = !!ev
  && ev.type === 'navRoute'
  && !Object.hasOwn(ev, 'path')
  && !Object.hasOwn(ev, 'remaining')
  && typeof ev.dest === 'string'
  && typeof ev.hops === 'number';

const snapCtx = stub();
snapCtx.world.nav = {
  dest: 'veridian',
  path: ['freehold', 'veridian'],
  remaining: 1,
  status: 'plotted',
  hopIndex: 3,
  autopilot: true,
};
const snap = snapshot(snapCtx);
results.snapshotHeals = !!snap.world.nav
  && snap.world.nav.autopilot === false
  && snap.world.nav.hopIndex === undefined
  && JSON.stringify(snap.world.nav).indexOf('hopIndex') < 0
  && JSON.stringify(snap.world.nav).indexOf('"autopilot":true') < 0;

clearRoute(stub());

console.log('wave85 verify-probe:', JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) {
  console.log('VERIFY PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('VERIFY PROBE PASS');
