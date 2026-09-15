import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, COMMODITIES } from '../src/game/state.js';
import { normalizePriceMemory, rememberedPrices, bestRememberedPrices, rememberMarket } from '../src/game/price-memory.js';
import { snapshot, restore } from '../src/game/save.js';
import { buildObservation } from '../src/game/agent-observe.js';
const copy = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS', name); }
check('normalization drops unknown, inherited, malformed and unsafe data', () => {
  for (const raw of [null, [], 5, undefined]) assert.deepEqual(normalizePriceMemory(raw, 100), {});
  assert.deepEqual(normalizePriceMemory({ freehold: {at: 200, prices: { provisions: 30, refinedMetals: -1, wakeglass: NaN, bad: 42 }}, unknown: {at: 1, prices:{provisions:99}} },100), {freehold:{at:100,prices:{provisions:30}}});
  assert.deepEqual(normalizePriceMemory(Object.create({freehold:{at:0,prices:{provisions:30}}}),100),{});
  assert.deepEqual(rememberedPrices({priceMemory:{}},'__proto__'),[]);
});
check('best historical sell excludes current, prefers newer ties, and ages in sim time', () => {
  const world={time:780,currentSystem:'freehold', priceMemory:{freehold:{at:0,prices:{provisions:999}},veridian:{at:60,prices:{provisions:80}},redmarch:{at:30,prices:{provisions:80}}}};
  const row=bestRememberedPrices(world).provisions;
  assert.equal(row.systemId,'veridian'); assert.equal(row.age,'12 min ago'); assert.equal(row.ageSeconds,720);
  assert.equal(row.station,SYSTEMS.veridian.station.name);
  assert.deepEqual(rememberedPrices(world,'hollowreach'),[]);
});
seedBootRandom(174);
const dom=installDomStubs();
const {ctx,systems}=await bootGameSystems();
const station=systems.find(([name])=>name==='station')[1];
for(const n of dom.walkDom(document.body)) if(n.dataset?.titleAction==='new'){n.click();break;}
dom.dispatchKey('Digit1'); ctx.agent.optIn=true; ctx.flags.combat=false;
function dock(id){
 if(ctx.flags.docked) ctx.stationDesk.undock();
 ctx.world.currentSystem=id;
 const p=SYSTEMS[id].station.position;
 ctx.ship.object.position.set(p[0]+36,p[1],p[2]);ctx.ship.velocity.set(0,0,0);ctx.ship.speed=0;
 ctx.input.dockPressed=true;
 for(let i=0;i<3;i++){station.update(1/60);ctx.lastEvents=ctx.events;ctx.events=[];}
 ctx.input.dockPressed=false;assert.equal(ctx.flags.docked,true);
}
check('undocked capture and observation do not discover markets',()=>{
 ctx.world.priceMemory={};ctx.flags.docked=false;
 rememberMarket(ctx,{provisions:99});buildObservation(ctx);assert.deepEqual(ctx.world.priceMemory,{});
});
dock('freehold'); ctx.world.time=100;ctx.world.prices.provisions=100;
check('only market view captures exact SELL fill including counter spread',()=>{
 ctx.world.priceMemory={};ctx.stationDesk.selectService('jobs');buildObservation(ctx);assert.deepEqual(ctx.world.priceMemory,{});
 ctx.stationDesk.selectService('market');
 const observed=buildObservation(ctx);const row=observed.market.rows.find(r=>r.commodity==='provisions');
 assert.equal(ctx.world.priceMemory.freehold.prices.provisions,row.fillSell);
 assert.ok(row.fillSell<row.fillBuy);assert.equal(row.remembered,null);
 assert.equal(ctx.world.priceMemory.freehold.at,100);
 assert.equal(Object.keys(ctx.world.priceMemory.freehold.prices).length,Object.keys(COMMODITIES).length);
 const before=copy(ctx.world.priceMemory);ctx.world.prices.provisions=999;ctx.world.time=220;buildObservation(ctx);
 assert.deepEqual(ctx.world.priceMemory,before,'observer does not refresh the viewed record');
});
const first=copy(ctx.world.priceMemory.freehold);
dock('veridian');ctx.world.time=820;ctx.stationDesk.selectService('market');
check('pane and API share the captured remote quote, station and age',()=>{
 ctx.world.markets.freehold={provisions:123456};ctx.world.reputation.freehold=999;
 const row=buildObservation(ctx).market.rows.find(r=>r.commodity==='provisions').remembered;
 assert.equal(row.sell,first.prices.provisions);assert.equal(row.age,'12 min ago');assert.equal(row.at,100);
 const toggle=[...dom.walkDom(document.body)].find(n=>n.id==='market-memory-toggle');toggle.click();
 assert.ok([...dom.walkDom(document.body)].some(n=>n.className==='market-memory-row'&&n.textContent===`Provisions: ${row.sell} UU · ${row.station}, ${row.age}`));
});
check('snapshots clone and restores retain history but legacy clears prior timeline',()=>{
 const saved=snapshot(ctx);const expected=copy(saved.world.priceMemory);
 ctx.world.priceMemory.freehold.prices.provisions=9000;assert.deepEqual(saved.world.priceMemory,expected);
 restore(ctx,copy(saved));assert.deepEqual(ctx.world.priceMemory,expected);
 ctx.world.priceMemory.freehold.prices.provisions=42;assert.deepEqual(saved.world.priceMemory,expected);
 const legacy=copy(saved);delete legacy.world.priceMemory;restore(ctx,legacy);assert.deepEqual(ctx.world.priceMemory,{});
 for(const bad of [null,[],42,{freehold:{at:-1,prices:{provisions:5}}}]){const blob=copy(saved);blob.world.priceMemory=bad;restore(ctx,blob);assert.deepEqual(ctx.world.priceMemory,{});}
});
console.log(`ISSUE-174 PRICE MEMORY PASS (${checks} scenarios)`);
