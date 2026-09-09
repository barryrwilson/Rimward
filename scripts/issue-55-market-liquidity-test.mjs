/** Issue #55: supply math, actual station/API fills, UI, and save boundaries.
 * Controlled fixtures pin time, prices, cash, cargo, and berth position; these
 * are contract tests, not evidence of ordinary campaign progression.
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COMMODITIES, SYSTEMS } from '../src/game/state.js';
import { marketSupplyAt, commitMarketSupply, normalizeMarketSupply, supplyCapacity } from '../src/game/market-supply.js';
import { snapshot, restore } from '../src/game/save.js';
import { buildObservation } from '../src/game/agent-observe.js';

const copy = (v) => JSON.parse(JSON.stringify(v));
const stock = (world, key = 'provisions', id = 'freehold') => marketSupplyAt(world, id, key);
const plainWorld = (key = 'provisions', units = 0, updatedAt = 0) => ({ time: 0, marketSupply: { freehold: { [key]: { units, updatedAt } } } });
function check(name, fn) { fn(); console.log('PASS', name); }

check('capacities cover exactly four bulk and eight other commodities', () => {
  assert.equal(Object.keys(COMMODITIES).filter(k => supplyCapacity(k) === 160).length, 4);
  assert.equal(Object.keys(COMMODITIES).filter(k => supplyCapacity(k) === 20).length, 8);
  assert.equal(supplyCapacity('__proto__'), 0);
});
check('read-only full defaults, exact half/full refill, saturation and independent markets', () => {
  const fresh = { time: 700 };
  assert.equal(stock(fresh).available, 160);
  assert.deepEqual(fresh, { time: 700 });
  for (const [key, half, full] of [['provisions',80,160], ['wakeglass',10,20], ['restrictedComponents',10,20]]) {
    const w = plainWorld(key);
    w.time = 600;
    assert.equal(stock(w,key).units, half);
    assert.equal(stock(w,key,'veridian').available, full);
    w.time = 1200;
    assert.equal(stock(w,key).units, full);
    w.time = 1e20;
    assert.equal(stock(w,key).units, full);
    assert.deepEqual(w.marketSupply.freehold[key], { units: 0, updatedAt: 0 });
  }
});
check('fractional stock survives trades; full time is not banked; backward time never refills', () => {
  const w = plainWorld();
  w.time = 3.75;
  assert.equal(stock(w).units, 0.5);
  assert.equal(stock(w).available, 0);
  w.time = 11.25;
  commitMarketSupply(w,'freehold','provisions',stock(w),-1);
  assert.deepEqual(w.marketSupply.freehold.provisions, { units: 0.5, updatedAt: 11.25 });
  w.time = 15;
  assert.equal(stock(w).available, 1);
  w.time = 10000;
  commitMarketSupply(w,'freehold','provisions',stock(w),-160);
  assert.equal(stock(w).available, 0);
  w.time += 600;
  assert.equal(stock(w).available, 80);
  w.time = 9900;
  assert.equal(stock(w).available, 0);
  commitMarketSupply(w,'freehold','provisions',stock(w),1);
  assert.equal(w.marketSupply.freehold.provisions.updatedAt, 10000);
  w.time = 10000;
  assert.equal(stock(w).available, 1);
});
check('malformed containers and rows fail closed; bounded own keys and future time', () => {
  assert.deepEqual(normalizeMarketSupply(undefined,100,false), {});
  for (const bad of [null, [], 'bad', 42, undefined]) {
    const clean = normalizeMarketSupply(bad,100,true);
    assert.equal(Object.keys(clean).length,Object.keys(SYSTEMS).length);
    assert.deepEqual(clean.freehold.provisions,{ units:0, updatedAt:100 });
  }
  for (const bad of [null, [], 'bad', {units:-1,updatedAt:0}, {units:161,updatedAt:0},
    {units:NaN,updatedAt:0}, {units:1,updatedAt:Infinity}, {units:1,updatedAt:-1}, {units:'1',updatedAt:0}]) {
    assert.deepEqual(normalizeMarketSupply({freehold:{provisions:bad}},100).freehold.provisions,{ units:0, updatedAt:100 });
  }
  const malformedSystem = normalizeMarketSupply({freehold:[]},100);
  assert.equal(Object.keys(malformedSystem.freehold).length,12);
  assert.deepEqual(malformedSystem.freehold.wakeglass,{units:0,updatedAt:100});
  const poison = JSON.parse('{"__proto__":{"polluted":true},"constructor":{},"alien":{},"freehold":{"__proto__":{"polluted":true},"alien":{},"provisions":{"units":7.5,"updatedAt":99999}}}');
  const clean = normalizeMarketSupply(poison,100);
  assert.deepEqual(clean,{freehold:{provisions:{units:7.5,updatedAt:100}}});
  assert.equal({}.polluted,undefined);
  assert.equal(stock({time:100,marketSupply:clean}).units,7.5);
  const getter = {};
  Object.defineProperty(getter,'freehold',{get(){throw new Error('must not invoke accessor');}});
  assert.deepEqual(normalizeMarketSupply(getter,100).freehold.provisions,{units:0,updatedAt:100});
  const inherited = Object.create({freehold:{provisions:{units:160,updatedAt:0}}});
  assert.deepEqual(normalizeMarketSupply(inherited,100).freehold.provisions,{units:0,updatedAt:100});
  assert.equal(stock({time:100,marketSupply:poison},'__proto__').available,0);
  assert.equal(stock({time:100},'provisions','__proto__').available,0);
});

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
ctx.flags.combat = false;
const KEY = 'rimward-save-v1';
function dock(id = 'freehold') {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.world.currentSystem = id;
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0]+36,p[1],p[2]);
  ctx.ship.velocity.set(0,0,0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  for (let i=0;i<3;i++) { station.update(1/60); ctx.lastEvents=ctx.events; ctx.events=[]; }
  ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked,true);
  ctx.stationDesk.selectService('market');
}
dock();
function fixture() {
  ctx.world.time = 100;
  ctx.world.credits = 1_000_000;
  ctx.cargoCapacity = 160;
  ctx.cargo.length = 0;
  ctx.world.marketSupply = {};
  ctx.world.prices.provisions = 200;
  ctx.world.prices.wakeglass = 1000;
  ctx.world.reputation.freehold = 0;
  ctx.world.fear = 0;
  ctx.stationDesk.selectService('market');
}
const act = (key,qty,side='buy') => window.rimward.act({v:2,name:'trade',args:{commodity:key,qty,side}});
const state = () => copy({cash:ctx.world.credits,cargo:ctx.cargo,supply:ctx.world.marketSupply});
const row = (key='provisions') => buildObservation(ctx).market.rows.find(r=>r.commodity===key);
const saved = () => JSON.parse(localStorage.getItem(KEY));
function reject(label, key, qty, side='buy') {
  const before = state();
  const priorSave = localStorage.getItem(KEY);
  assert.equal(act(key,qty,side).ok,false,label);
  assert.deepEqual(state(),before,label+' state');
  assert.equal(localStorage.getItem(KEY),priorSave,label+' checkpoint');
}
check('public observations are read-only and expose executable stock/hold/cash limits', () => {
  fixture();
  const before = state();
  const r = row();
  assert.equal(r.available,160);
  assert.equal(r.capacity,160);
  assert.equal(r.buyMax,99);
  assert.equal(r.sellMax,0);
  assert.equal(r.tradeAllowed,true);
  assert.equal(row('restrictedComponents').tradeAllowed,false);
  assert.equal(row('restrictedComponents').buyMax,0);
  assert.equal(row('wakeglass').available,20);
  for (let i=0;i<10;i++) buildObservation(ctx);
  assert.deepEqual(state(),before);
  ctx.world.credits = r.fillBuy*3;
  assert.equal(row().buyMax,3);
  ctx.cargoCapacity = 2;
  assert.equal(row().buyMax,2);
});
check('1/5/99/160 partitions have identical fixed-time flat totals and stock', () => {
  const results = [];
  for (const parts of [[99,61],Array(32).fill(5),Array(160).fill(1)]) {
    fixture();
    const q = row();
    for (const n of parts) assert.equal(act('provisions',n).ok,true);
    assert.equal(ctx.world.credits,1_000_000-q.fillBuy*160);
    assert.equal(row().available,0);
    assert.equal(row().hold,160);
    assert.equal(row().buyMax,0);
    results.push(state());
    assert.equal(saved().world.marketSupply.freehold.provisions.units,0);
    assert.equal(saved().world.credits,ctx.world.credits);
    assert.deepEqual(saved().cargo,ctx.cargo);
    reject('depleted stock','provisions',1);
    assert.match(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'buy'}).notice,/Only 0 Provisions available/);
    for (const n of parts) assert.equal(act('provisions',n,'sell').ok,true);
    assert.equal(row().available,160);
    assert.equal(row().hold,0);
    assert.ok(ctx.world.credits<=1_000_000);
  }
  assert.deepEqual(results[0],results[1]);
  assert.deepEqual(results[1],results[2]);
});
check('cash, hold, illegal goods, unknown keys and API quantities refuse atomically', () => {
  fixture();
  ctx.world.credits = 0;
  reject('cash','provisions',1);
  ctx.world.credits = 1_000_000;
  ctx.cargoCapacity = 0;
  reject('hold','provisions',1);
  ctx.cargoCapacity = 160;
  reject('access','restrictedComponents',1);
  reject('no held cargo','provisions',1,'sell');
  for (const qty of [0,-1,100,1.5,'5',null]) reject('invalid quantity','provisions',qty);
  for (const key of ['__proto__','constructor','unknown','survivor','data']) reject('commodity',key,1);
  reject('exotic stock','wakeglass',21);
  assert.equal(act('wakeglass',20).ok,true);
  reject('exotic depletion','wakeglass',1);
});
check('sells beyond capacity pay in full; sell/buy reversal never increases cash', () => {
  fixture();
  ctx.cargo.push({commodity:'wakeglass',units:99});
  const before = ctx.world.credits;
  const q = row('wakeglass');
  assert.equal(act('wakeglass',99,'sell').ok,true);
  assert.equal(ctx.world.credits-before,q.fillSell*99);
  assert.equal(row('wakeglass').available,20);
  assert.equal(row('wakeglass').hold,0);
  fixture();
  ctx.cargo.push({commodity:'provisions',units:160});
  const cash = ctx.world.credits;
  assert.equal(act('provisions',99,'sell').ok,true);
  assert.equal(act('provisions',61,'sell').ok,true);
  assert.equal(act('provisions',99).ok,true);
  assert.equal(act('provisions',61).ok,true);
  assert.ok(ctx.world.credits<=cash);
  assert.equal(row().hold,160);
});
check('UI buttons, stock text and periodic refresh use effective supply', () => {
  fixture();
  dom.dispatchKey('KeyQ');
  dom.dispatchKey('KeyW');
  assert.equal(row().hold,6);
  assert.equal(row().available,154);
  assert.ok([...dom.walkDom(document.body)].some(n=>n.className==='market-stock'&&n.textContent==='154/160'));
  ctx.world.time += 45;
  station.update(1.1);
  assert.equal(row().available,160);
  assert.ok([...dom.walkDom(document.body)].some(n=>n.className==='market-stock'&&n.textContent==='160/160'));
});
check('saved fractional depletion survives snapshots, reload, redock and away catchup', () => {
  fixture();
  ctx.world.marketSupply = {freehold:{provisions:{units:10.5,updatedAt:100}}};
  assert.equal(act('provisions',5).ok,true);
  const snap = snapshot(ctx);
  assert.equal(snap.world.marketSupply.freehold.provisions.units,5.5);
  assert.notEqual(snap.world.marketSupply,ctx.world.marketSupply);
  assert.notEqual(snap.world.marketSupply.freehold.provisions,ctx.world.marketSupply.freehold.provisions);
  assert.equal(act('provisions',1).ok,true);
  assert.equal(snap.world.marketSupply.freehold.provisions.units,5.5);
  restore(ctx,snap);
  assert.equal(stock(ctx.world).units,5.5);
  assert.notEqual(snap.world.marketSupply.freehold.provisions,ctx.world.marketSupply.freehold.provisions);
  dock();
  assert.equal(row().available,5);
  ctx.world.currentSystem = 'veridian';
  ctx.world.time += 600;
  assert.equal(stock(ctx.world).units,85.5);
  assert.equal(stock(ctx.world,'provisions','veridian').units,160);
  const away = snapshot(ctx);
  ctx.world.time += 10000;
  restore(ctx,away);
  assert.equal(stock(ctx.world).units,85.5,'offline wall time/abandoned future cannot refill');
  dock();
  assert.equal(row().available,85);
});
check('restores distinguish absent legacy envelope from malformed presence and clamp future times', () => {
  fixture();
  const snap = copy(snapshot(ctx));
  delete snap.world.marketSupply;
  ctx.world.marketSupply = {freehold:{provisions:{units:0,updatedAt:100}}};
  restore(ctx,copy(snap));
  assert.equal(stock(ctx.world).units,160);
  for (const bad of [null,[],42,undefined]) {
    const corrupt = copy(snap);
    corrupt.world.marketSupply = bad;
    restore(ctx,corrupt);
    assert.equal(stock(ctx.world).units,0);
    assert.equal(stock(ctx.world,'wakeglass','veridian').units,0);
  }
  const future = copy(snap);
  future.world.marketSupply = {freehold:{provisions:{units:7.5,updatedAt:99999}}};
  restore(ctx,future);
  assert.deepEqual(ctx.world.marketSupply.freehold.provisions,{units:7.5,updatedAt:100});
  ctx.world.time = 107.5;
  assert.equal(stock(ctx.world).units,8.5);
  ctx.world.marketSupply = undefined;
  const invalidSnapshot = snapshot(ctx);
  assert.equal(invalidSnapshot.world.marketSupply.freehold.provisions.units,0);
});

console.log('ISSUE-55 MARKET LIQUIDITY PASS');
