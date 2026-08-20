import {
  TRAFFIC_LIST_UU,
  TRAFFIC_REP,
  TRAFFIC_FEAR,
  isTrafficEligible,
  trafficLots,
  applySurvivorSale,
} from '../../../src/game/trafficking.js';

function row(faction, source, units, extra = {}) {
  return { commodity: 'survivor', faction, source, units, ...extra };
}

function makeCtx(opts = {}) {
  const events = [];
  const world = {
    credits: 100,
    fear: 0,
    reputation: { freehold: 0, gilded: 0, veridian: 0 },
    milestones: [],
    hangar: { hulls: [] },
    prices: {},
    ...(opts.world ?? {}),
  };
  if (opts.reputation) world.reputation = opts.reputation;
  return {
    cargo: opts.cargo ?? [],
    cargoCapacity: opts.cargoCapacity ?? 20,
    settings: opts.settings ?? {},
    world,
    emit(type, payload) { events.push({ type, payload }); },
    events,
  };
}

const results = {};

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const before = JSON.stringify(ctx.cargo);
  const credits = ctx.world.credits;
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'independent');
  results.saleWithoutGildedDock = pay === null
    && ctx.world.credits === credits
    && JSON.stringify(ctx.cargo) === before
    && ctx.events.length === 0;
}

{
  const missing = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const before = JSON.stringify(missing.cargo);
  results.saleWithoutDockArg = applySurvivorSale(missing, 'freehold', 'other') === null
    && JSON.stringify(missing.cargo) === before;
  const titled = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  results.saleGildedWrongCase = applySurvivorSale(titled, 'freehold', 'other', 'Gilded') === null
    && titled.cargo.length === 1;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2), row('veridian', 'other', 1)],
    world: { credits: 0, fear: 0, reputation: { freehold: 0, veridian: 0, gilded: 0 }, milestones: [] },
  });
  let reentered = 'unset';
  const ev = ctx.events;
  ctx.emit = (type, payload) => {
    ev.push({ type, payload });
    if (reentered === 'unset') {
      reentered = applySurvivorSale(ctx, 'veridian', 'other', 'gilded');
    }
  };
  const first = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const secondSame = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.doubleApplyBusyAndReplay = first?.count === 2
    && reentered === null
    && secondSame === null
    && ctx.cargo.some((c) => c.faction === 'veridian')
    && ctx.world.credits === 320;
}

{
  const cases = [NaN, Infinity, -Infinity];
  let all = true;
  for (const bad of cases) {
    const ctx = makeCtx({
      cargo: [row('freehold', 'other', 3)],
      world: { credits: bad, fear: 0, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
    });
    const before = JSON.stringify(ctx.cargo);
    const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
    if (pay !== null || JSON.stringify(ctx.cargo) !== before || ctx.events.length !== 0) {
      all = false;
    }
  }
  const missing = makeCtx({ cargo: [row('freehold', 'other', 3)] });
  delete missing.world.credits;
  const before = JSON.stringify(missing.cargo);
  const pay = applySurvivorSale(missing, 'freehold', 'other', 'gilded');
  results.removeThenRefuseNo = all
    && pay === null
    && JSON.stringify(missing.cargo) === before
    && missing.world.credits === undefined
    && missing.events.length === 0;
}

{
  const bag = { freehold: 1, gilded: 0 };
  const protoRow = makeCtx({
    cargo: [row('__proto__', 'other', 2)],
    reputation: bag,
  });
  applySurvivorSale(protoRow, '__proto__', 'other', 'gilded');
  applySurvivorSale(protoRow, 'freehold', 'other', 'gilded');
  results.protoKeyNotWritten = !Object.hasOwn(bag, '__proto__')
    && !Object.hasOwn(Object.prototype, 'polluted')
    && protoRow.cargo.length === 1
    && protoRow.world.credits === 100;
}

{
  const ctx = makeCtx({
    cargo: [
      row('unknowables', 'other', 2),
      row('unknowables', 'playerKill', 1),
    ],
  });
  const lots = trafficLots(ctx);
  const a = applySurvivorSale(ctx, 'unknowables', 'other', 'gilded');
  const b = applySurvivorSale(ctx, 'unknowables', 'playerKill', 'gilded');
  results.unknowablesNotSold = lots.length === 0
    && a === null
    && b === null
    && ctx.cargo.length === 2
    && ctx.world.credits === 100
    && !isTrafficEligible(ctx.cargo[0], 20);
}

{
  const parked = [row('freehold', 'other', 4), row('veridian', 'playerKill', 2)];
  const live = [row('freehold', 'other', 1)];
  const ctx = makeCtx({
    cargo: live,
    world: {
      credits: 10,
      fear: 0,
      reputation: { freehold: 0, gilded: 0 },
      milestones: [],
      hangar: { hulls: [{ id: 'parked', cargo: parked }] },
    },
  });
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.hangarParkedIgnoredWithLive = pay?.count === 1
    && pay?.credits === 160
    && ctx.world.credits === 170
    && ctx.cargo.length === 0
    && ctx.world.hangar.hulls[0].cargo === parked
    && parked[0].units === 4
    && parked[1].units === 2;
}

{
  const onlyParked = makeCtx({
    cargo: [{ commodity: 'rawOre', units: 1 }],
    world: {
      credits: 10,
      fear: 0,
      reputation: { freehold: 0, gilded: 0 },
      milestones: [],
      hangar: { hulls: [{ cargo: [row('freehold', 'other', 8)] }] },
    },
  });
  const pay = applySurvivorSale(onlyParked, 'freehold', 'other', 'gilded');
  results.hangarOnlyNotConsumed = pay === null
    && onlyParked.world.credits === 10
    && onlyParked.world.hangar.hulls[0].cargo[0].units === 8;
}

{
  const ten = makeCtx({
    cargo: [row('freehold', 'other', 10)],
    world: { credits: 0, fear: 3, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
  });
  applySurvivorSale(ten, 'freehold', 'other', 'gilded');
  const kill = makeCtx({
    cargo: [row('veridian', 'playerKill', 7)],
    world: { credits: 0, fear: 10, reputation: { veridian: 0, gilded: 0 }, milestones: [] },
  });
  applySurvivorSale(kill, 'veridian', 'playerKill', 'gilded');
  results.fearPerLotNotPerUnit = ten.world.fear === 4
    && kill.world.fear === 12
    && TRAFFIC_FEAR.other === 1
    && TRAFFIC_FEAR.playerKill === 2;
  const hi = makeCtx({
    cargo: [row('freehold', 'playerKill', 3)],
    world: { credits: 0, fear: 99, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
  });
  applySurvivorSale(hi, 'freehold', 'playerKill', 'gilded');
  results.fearClamped100 = hi.world.fear === 100;
}

{
  const ctx = makeCtx({
    cargo: [row('gilded', 'playerKill', 2)],
    world: { credits: 0, fear: 0, reputation: { gilded: 10 }, milestones: [] },
  });
  const pay = applySurvivorSale(ctx, 'gilded', 'playerKill', 'gilded');
  results.gildedVictimNet = pay?.repDelta === -16
    && ctx.world.reputation.gilded === 10 + (-8 * 2) + (2 * 2);
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 1), row('veridian', 'other', 1)],
    world: {
      credits: 0,
      fear: 0,
      reputation: { freehold: 0, veridian: 0, gilded: 0 },
      milestones: ['peopleTrafficked'],
    },
  });
  applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  applySurvivorSale(ctx, 'veridian', 'other', 'gilded');
  results.milestoneOnceNoRewrite = ctx.world.milestones.filter((id) => id === 'peopleTrafficked').length === 1
    && !ctx.events.some((e) => e.type === 'milestone')
    && ctx.world.peopleTrafficked === undefined;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 1, { name: 'slave meat stock' })],
  });
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const blob = JSON.stringify(ctx.events) + (pay?.line ?? '');
  results.noAtrocityNoNameInCopy = pay != null
    && !ctx.events.some((e) => e.type === 'atrocity')
    && !blob.includes('slave meat')
    && !pay.line.includes('name')
    && pay.line === 'The Chain takes them. 1 transferred. 160 UU.';
}

{
  results.tablesMatchContract = TRAFFIC_LIST_UU.other === 160
    && TRAFFIC_LIST_UU.playerKill === 240
    && TRAFFIC_REP.victimOther === 0
    && TRAFFIC_REP.victimPlayerKill === -8
    && TRAFFIC_REP.gildedPerUnit === 2
    && Object.isFrozen(TRAFFIC_LIST_UU)
    && Object.isFrozen(TRAFFIC_REP)
    && Object.isFrozen(TRAFFIC_FEAR);
}

console.log(JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('VERIFY FAIL', failed.join(','));
  process.exit(1);
}
console.log('VERIFY PASS');
