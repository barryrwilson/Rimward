/** Issue #218: executable supply pricing, surplus persistence and no local flip profit.
 * Controlled fixtures use real station trades and public observations. */
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
check('full-row sales preserve surplus, lower executable bids, and settle the quoted order', () => {
  for (const [key, qty] of [['rawOre',99], ['livingRock',65], ['wakeglass',14]]) {
    fixture();
    ctx.cargo.push({commodity:key,units:qty});
    const before = row(key);
    const cash = ctx.world.credits;
    assert.equal(act(key,qty,'sell').ok,true);
    const after = row(key);
    assert.equal(after.available,before.available+qty);
    assert.ok(after.fillSell < before.fillSell);
    assert.equal(ctx.world.credits,cash+qty*before.fillSell);
    assert.ok(after.fillSell <= Math.floor(after.fillBuy*.95));
    const snap = snapshot(ctx);
    restore(ctx,snap);
    assert.equal(row(key).available,after.available);
    assert.equal(row(key).fillSell,after.fillSell);
    ctx.world.time += 1200*qty/after.capacity;
    assert.equal(row(key).available,after.capacity);
    assert.equal(row(key).fillSell,before.fillSell);
    console.log('EVIDENCE full-row sale',JSON.stringify({key,qty,before,after}));
  }
});
check('depletion raises asks without raising resale bids; recovery restores the neutral quote', () => {
  fixture();
  const full = row();
  assert.equal(act('provisions',99).ok,true);
  const depleted = row();
  assert.equal(depleted.available,61);
  assert.ok(depleted.fillBuy>full.fillBuy);
  assert.equal(depleted.fillSell,full.fillSell);
  assert.equal(act('provisions',37).ok,true);
  assert.equal(row().available,24);
  assert.ok(row().fillBuy>depleted.fillBuy);
  ctx.world.time += 1200;
  assert.equal(row().fillBuy,full.fillBuy);
  assert.equal(row().available,160);
});
check('surplus remains read-only, independent and bounded through saved-time recovery', () => {
  const w={time:100,marketSupply:{freehold:{wakeglass:{units:119,updatedAt:100}}}};
  const before=copy(w);
  for(let i=0;i<5;i++) assert.equal(stock(w,'wakeglass').available,119);
  assert.deepEqual(w,before);
  w.time+=1200;
  assert.equal(stock(w,'wakeglass').available,99);
  assert.equal(stock(w,'wakeglass','veridian').available,20);
  w.time+=100000;
  assert.equal(stock(w,'wakeglass').available,20);
  w.time=0;
  assert.equal(stock(w,'wakeglass').available,119);
});
check('no local buy/sell or sell/buy loop yields profit across supply levels', () => {
  for(const units of [0,24,61,160,200,320,1000]) {
    for(const sellFirst of [false,true]) {
      fixture();
      ctx.world.marketSupply={freehold:{provisions:{units,updatedAt:100}}};
      ctx.cargo.push({commodity:'provisions',units:5});
      const cash=ctx.world.credits;
      const qty=sellFirst?5:Math.min(5,units);
      if(!qty) continue;
      const first=sellFirst?'sell':'buy';
      const second=sellFirst?'buy':'sell';
      assert.equal(act('provisions',qty,first).ok,true);
      assert.equal(act('provisions',qty,second).ok,true);
      assert.ok(ctx.world.credits<cash);
      assert.equal(row().available,units);
    }
  }
});
console.log('ISSUE-218 SUPPLY PRICING PASS');
