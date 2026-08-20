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

function snapshotCargo(ctx) {
  return JSON.stringify(ctx.cargo);
}

const results = {};

results.tablesFrozen = TRAFFIC_LIST_UU.other === 160
  && TRAFFIC_LIST_UU.playerKill === 240
  && TRAFFIC_REP.victimOther === 0
  && TRAFFIC_REP.victimPlayerKill === -8
  && TRAFFIC_REP.gildedPerUnit === 2
  && TRAFFIC_FEAR.other === 1
  && TRAFFIC_FEAR.playerKill === 2;

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2, { name: '<img src=x onerror=alert(1)>' })],
    world: { credits: 10, fear: 0, reputation: { freehold: 5, gilded: 1 }, milestones: [] },
  });
  const lots = trafficLots(ctx);
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.priceOther160 = lots.length === 1
    && lots[0].unitPrice === 160
    && lots[0].total === 320
    && pay?.credits === 320
    && ctx.world.credits === 330;
  results.victimOther0 = pay?.repDelta === 0 && ctx.world.reputation.freehold === 5;
  results.gildedPlus2PerUnit = ctx.world.reputation.gilded === 5;
  results.fearOtherPlus1PerLot = ctx.world.fear === 1;
  results.xssNameNotInLine = typeof pay?.line === 'string'
    && !pay.line.includes('img')
    && !pay.line.includes('alert')
    && pay.line === 'The Chain takes them. 2 transferred. 320 UU.';
  results.noAtrocity = !ctx.events.some((e) => e.type === 'atrocity');
  results.soldEventShape = ctx.events.some((e) =>
    e.type === 'survivorSold'
    && e.payload.faction === 'freehold'
    && e.payload.source === 'other'
    && e.payload.count === 2
    && e.payload.credits === 320
    && e.payload.repDelta === 0
    && e.payload.line === pay.line);
  results.commLineStation = ctx.events.some((e) =>
    e.type === 'commLine' && e.payload.text === pay.line && e.payload.from === 'station');
}

{
  const ctx = makeCtx({
    cargo: [row('veridian', 'playerKill', 3)],
    world: { credits: 0, fear: 4, reputation: { veridian: 10, gilded: 0 }, milestones: [] },
  });
  const lots = trafficLots(ctx);
  const pay = applySurvivorSale(ctx, 'veridian', 'playerKill', 'gilded');
  results.pricePlayerKill240 = lots[0]?.unitPrice === 240
    && lots[0]?.total === 720
    && pay?.credits === 720
    && ctx.world.credits === 720;
  results.victimPlayerKillNeg8 = pay?.repDelta === -24 && ctx.world.reputation.veridian === -14;
  results.fearPlayerKillPlus2PerLot = ctx.world.fear === 6;
  results.gildedPlus2OnKill = ctx.world.reputation.gilded === 6;
}

{
  const other = makeCtx({
    cargo: [row('gilded', 'other', 1)],
    world: { credits: 0, fear: 0, reputation: { gilded: 0 }, milestones: [] },
  });
  const otherPay = applySurvivorSale(other, 'gilded', 'other', 'gilded');
  const kill = makeCtx({
    cargo: [row('gilded', 'playerKill', 1)],
    world: { credits: 0, fear: 0, reputation: { gilded: 0 }, milestones: [] },
  });
  const killPay = applySurvivorSale(kill, 'gilded', 'playerKill', 'gilded');
  results.gildedVictimNetOther = otherPay?.repDelta === 0 && other.world.reputation.gilded === 2;
  results.gildedVictimNetPlayerKill = killPay?.repDelta === -8 && kill.world.reputation.gilded === -6;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 5)],
    world: { credits: 0, fear: 99, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
  });
  applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.fearClamp100 = ctx.world.fear === 100;
  const low = makeCtx({
    cargo: [row('freehold', 'playerKill', 4)],
    world: { credits: 0, fear: -3, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
  });
  applySurvivorSale(low, 'freehold', 'playerKill', 'gilded');
  results.fearClamp0 = low.world.fear === 0;
}

{
  const ctx = makeCtx({ cargo: [row('unknowables', 'other', 2)] });
  const before = snapshotCargo(ctx);
  const credits = ctx.world.credits;
  const pay = applySurvivorSale(ctx, 'unknowables', 'other', 'gilded');
  results.unknowablesNoSale = pay === null
    && trafficLots(ctx).length === 0
    && snapshotCargo(ctx) === before
    && ctx.world.credits === credits
    && ctx.events.length === 0;
}

{
  const bag = { freehold: 0, gilded: 0 };
  const ctx = makeCtx({
    cargo: [row('__proto__', 'other', 2)],
    reputation: bag,
  });
  const pay = applySurvivorSale(ctx, '__proto__', 'other', 'gilded');
  results.protoNoSale = pay === null
    && trafficLots(ctx).length === 0
    && ctx.cargo.length === 1
    && ctx.world.credits === 100
    && ctx.events.length === 0
    && !Object.hasOwn(bag, '__proto__')
    && Object.prototype.polluted !== true;
}

{
  const bag = Object.create(null);
  bag.gilded = 0;
  const ctx = makeCtx({
    cargo: [row('constructor', 'other', 1), row('prototype', 'playerKill', 1)],
    reputation: bag,
  });
  const a = applySurvivorSale(ctx, 'constructor', 'other', 'gilded');
  const b = applySurvivorSale(ctx, 'prototype', 'playerKill', 'gilded');
  results.reservedFactionNoProtoRepWrite = a === null && b === null
    && !Object.hasOwn(bag, 'constructor')
    && !Object.hasOwn(bag, 'prototype')
    && !Object.hasOwn(bag, '__proto__')
    && !isTrafficEligible(row('toString', 'other', 1), 20);
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 21)],
    cargoCapacity: 20,
  });
  const before = snapshotCargo(ctx);
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.oversizeNoSale = pay === null
    && !isTrafficEligible(ctx.cargo[0], 20)
    && snapshotCargo(ctx) === before
    && ctx.world.credits === 100
    && ctx.events.length === 0;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const before = snapshotCargo(ctx);
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'independent');
  results.nonGildedDockNoSale = pay === null
    && snapshotCargo(ctx) === before
    && ctx.world.credits === 100
    && ctx.events.length === 0;
}

{
  const cases = [NaN, Infinity, -Infinity];
  let all = true;
  for (const bad of cases) {
    const ctx = makeCtx({
      cargo: [row('freehold', 'other', 2)],
      world: { credits: bad, fear: 0, reputation: { freehold: 0, gilded: 0 }, milestones: [] },
    });
    const before = snapshotCargo(ctx);
    const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
    if (pay !== null || snapshotCargo(ctx) !== before || ctx.events.length !== 0) all = false;
  }
  const missing = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  delete missing.world.credits;
  const before = snapshotCargo(missing);
  const pay = applySurvivorSale(missing, 'freehold', 'other', 'gilded');
  results.nonFiniteCreditsNoSale = all && pay === null && snapshotCargo(missing) === before;
  results.nonFiniteCreditsCargoUnchanged = results.nonFiniteCreditsNoSale;
}

{
  const ctx = makeCtx({
    cargo: [
      row('freehold', 'other', 2),
      row('veridian', 'playerKill', 1),
      { commodity: 'rawOre', units: 3 },
    ],
  });
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.mixedLotsSellOneOnly = pay?.count === 2
    && pay?.credits === 320
    && ctx.cargo.some((c) => c.faction === 'veridian' && c.units === 1)
    && ctx.cargo.some((c) => c.commodity === 'rawOre')
    && !ctx.cargo.some((c) => c.faction === 'freehold')
    && trafficLots(ctx).length === 1
    && trafficLots(ctx)[0].faction === 'veridian';
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2), row('veridian', 'other', 1)],
  });
  let reentered = 'unset';
  const innerEvents = ctx.events;
  ctx.emit = (type, payload) => {
    innerEvents.push({ type, payload });
    if (reentered === 'unset') {
      reentered = applySurvivorSale(ctx, 'veridian', 'other', 'gilded');
    }
  };
  const first = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const afterBusy = ctx.cargo.some((c) => c.faction === 'veridian');
  const secondSame = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const laterOther = applySurvivorSale(ctx, 'veridian', 'other', 'gilded');
  results.doubleApplySecondNull = first != null
    && first.count === 2
    && reentered === null
    && afterBusy
    && secondSame === null
    && laterOther != null
    && laterOther.count === 1
    && ctx.world.credits === 580
    && ctx.cargo.length === 0;
}

{
  const parked = [row('freehold', 'other', 4)];
  const ctx = makeCtx({
    cargo: [{ commodity: 'rawOre', units: 1 }],
    world: {
      credits: 50,
      fear: 0,
      reputation: { freehold: 0, gilded: 0 },
      milestones: [],
      hangar: { hulls: [{ id: 'parked', cargo: parked }] },
    },
  });
  const lots = trafficLots(ctx);
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.parkedHangarIgnored = lots.length === 0
    && pay === null
    && ctx.world.credits === 50
    && ctx.world.hangar.hulls[0].cargo[0].units === 4
    && ctx.cargo[0].commodity === 'rawOre';
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 1), row('veridian', 'other', 1)],
    world: { credits: 0, fear: 0, reputation: { freehold: 0, veridian: 0, gilded: 0 }, milestones: [] },
  });
  const first = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const marks = ctx.events.filter((e) => e.type === 'milestone');
  const second = applySurvivorSale(ctx, 'veridian', 'other', 'gilded');
  const marks2 = ctx.events.filter((e) => e.type === 'milestone');
  results.milestoneOnce = first != null
    && second != null
    && ctx.world.milestones.filter((id) => id === 'peopleTrafficked').length === 1
    && marks.length === 1
    && marks2.length === 1
    && marks[0].payload.id === 'peopleTrafficked'
    && marks[0].payload.line === 'The Chain recorded a transfer.';
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 1), row('veridian', 'playerKill', 1)],
    world: {
      credits: 0,
      fear: 0,
      reputation: { freehold: 0, veridian: 0, gilded: 0 },
      milestones: [],
      prices: { survivor: 9999, other: 1, playerKill: 2, freehold: 3 },
    },
  });
  const lots = trafficLots(ctx);
  const a = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  const b = applySurvivorSale(ctx, 'veridian', 'playerKill', 'gilded');
  results.pricesNotFromWorld = lots[0].unitPrice === 160
    && lots[1].unitPrice === 240
    && a?.credits === 160
    && b?.credits === 240
    && ctx.world.credits === 400;
}

{
  const ctx = makeCtx({ cargo: [] });
  results.emptyHoldNoSale = trafficLots(ctx).length === 0
    && applySurvivorSale(ctx, 'freehold', 'other', 'gilded') === null
    && ctx.events.length === 0;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2), row('freehold', 'other', 99)],
    cargoCapacity: 20,
  });
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.oversizeSameLotStays = pay?.count === 2
    && ctx.cargo.length === 1
    && ctx.cargo[0].units === 99
    && ctx.world.credits === 420;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'weird', 1)],
  });
  const lots = trafficLots(ctx);
  const pay = applySurvivorSale(ctx, 'freehold', 'weird', 'gilded');
  results.unknownSourceIsOther = lots[0]?.source === 'other'
    && lots[0]?.unitPrice === 160
    && pay?.source === 'other'
    && pay?.credits === 160;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 1)],
    settings: { reducedMotion: true },
  });
  const pay = applySurvivorSale(ctx, 'freehold', 'other', 'gilded');
  results.reducedLine = pay?.line === 'Transferred. 160 UU.';
}

console.log(JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, v]) => v !== true).map(([k]) => k);
if (failed.length) {
  console.log('PROBE FAIL', failed.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
