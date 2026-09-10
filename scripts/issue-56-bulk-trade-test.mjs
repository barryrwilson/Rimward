/** Issue #56: real station DOM closures and captured actions, with disclosed
 * deterministic cash/cargo/price/service fixtures. Not campaign progression. */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { COMMODITIES, FACTION_SERVICES, SYSTEMS } from '../src/game/state.js';
import { contactsForSystem } from '../src/game/contacts.js';
import { buildObservation } from '../src/game/agent-observe.js';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const find = id => [...dom.walkDom(document.body)].find(n => n.id === id);
for (const n of dom.walkDom(document.body)) if (n.dataset?.titleAction === 'new') { n.click(); break; }
dom.dispatchKey('Digit1');
ctx.agent.optIn = true;
ctx.flags.combat = false;
const SERVICE = FACTION_SERVICES.redledger;
const originalService = { ...SERVICE };
const KEY = 'rimward-save-v1';
const copy = value => JSON.parse(JSON.stringify(value));
const state = () => copy({ cash: ctx.world.credits, cargo: ctx.cargo, stock: ctx.world.marketSupply, contacts: ctx.world.contacts });
const held = key => ctx.cargo.filter(c => c.commodity === key).reduce((n,c) => n + c.units, 0);
const check = (label, fn) => { fn(); console.log('PASS', label); };
const click = id => { const n = find(id); assert.ok(n, id); assert.ok(!n.disabled, `${id} enabled`); n.click(); };
const edit = text => {
  const input = find('market-bulk-quantity');
  input.value = text;
  for (const fn of input._listeners.input) fn({ target: input });
};
const select = key => {
  const input = find('market-bulk-commodity');
  input.value = key;
  for (const fn of input._listeners.change) fn({ target: input });
};
const action = prefix => ctx.stationDesk.peekView().actions.find(a => a.label.startsWith(prefix));
const perform = prefix => { const a = action(prefix); assert.ok(a, prefix); return ctx.stationDesk.perform({ n:a.n, expect:a.label }); };
function dock(id = 'rl_toll') {
  if (ctx.flags.docked) assert.equal(ctx.stationDesk.undock().ok, true);
  ctx.world.currentSystem = id;
  const p = SYSTEMS[id].station.position;
  ctx.ship.object.position.set(p[0]+36,p[1],p[2]);
  ctx.ship.velocity.set(0,0,0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  for (let i=0;i<3;i++) { station.update(1/60); ctx.lastEvents=ctx.events; ctx.events=[]; }
  ctx.input.dockPressed = false;
  ctx.lastEvents = [];
  assert.equal(ctx.flags.docked, true);
  ctx.stationDesk.selectService('market');
}
dock();
function fixture() {
  ctx.world.time = 100;
  ctx.world.credits = 20000;
  ctx.cargoCapacity = 160;
  ctx.cargo.length = 0;
  ctx.world.marketSupply = {};
  ctx.world.prices.provisions = 100;
  ctx.world.prices.restrictedComponents = 100;
  ctx.world.reputation.redledger = 0;
  ctx.world.reputation.freehold = 0;
  ctx.world.epics.redledger = 0;
  ctx.world.fear = 0;
  SERVICE.buyMult = 1;
  SERVICE.sellMult = .9;
  ctx.stationDesk.selectService('market');
  select('provisions');
}
const save = localStorage.setItem;
let fills = [];
let afterFill = null;
localStorage.setItem = (key, value) => {
  save(key, value);
  if (key !== KEY) return;
  const row = JSON.parse(value);
  fills.push({ cash:row.world.credits, cargo:row.cargo });
  afterFill?.(fills.length);
};
check('B1 fixed 100/90 quotes, four activations and exact 99+61 autosaves each way', () => {
  fixture(); fills = [];
  assert.equal(ctx.stationDesk.peekFillUnit('provisions',true),100);
  assert.equal(ctx.stationDesk.peekFillUnit('provisions',false),90);
  click('market-bulk-buy-max');
  assert.equal(find('market-bulk-quantity').value,'160');
  assert.match(find('market-bulk-buy').textContent,/Buy 160 Provisions · 16000 UU/);
  assert.equal(ctx.world.credits,20000);
  click('market-bulk-buy');
  assert.equal(ctx.world.credits,4000);
  assert.equal(held('provisions'),160);
  assert.deepEqual(fills.map(r=>r.cargo.reduce((n,c)=>n+c.units,0)),[99,160]);
  assert.match(ctx.stationDesk.peekView().notice,/Bought 160 Provisions for 16000 UU \(2 orders\)/);
  assert.equal(find('market-bulk-buy').disabled,true);
  fills = [];
  click('market-bulk-sell-all'); click('market-bulk-sell');
  assert.equal(ctx.world.credits,18400);
  assert.equal(held('provisions'),0);
  assert.deepEqual(fills.map(r=>r.cargo.reduce((n,c)=>n+c.units,0)),[61,0]);
});
check('B2/B3 cash, room, stock, equality and zero maxima; sale at full retail stock', () => {
  for (const [setup,expected] of [
    [()=>{ctx.world.credits=2550;},25],
    [()=>{ctx.cargo.push({commodity:'rawOre',units:153});},7],
    [()=>{ctx.world.marketSupply={rl_toll:{provisions:{units:3,updatedAt:100}}};},3],
  ]) {
    fixture(); setup(); click('market-bulk-buy-max');
    assert.equal(find('market-bulk-quantity').value,String(expected));
    click('market-bulk-buy'); assert.equal(held('provisions'),expected);
  }
  fixture(); ctx.world.credits=16000; click('market-bulk-buy-max'); click('market-bulk-buy');
  assert.equal(ctx.world.credits,0);
  click('market-bulk-buy-max'); assert.equal(find('market-bulk-buy').disabled,true);
  fixture(); click('market-bulk-sell-all'); assert.equal(find('market-bulk-sell').disabled,true);
  fixture(); ctx.cargo.push({commodity:'provisions',units:160});
  click('market-bulk-sell-all'); click('market-bulk-sell');
  assert.equal(ctx.world.credits,34400);
  assert.equal(ctx.stationDesk.peekTradeAvailability('provisions').available,160);
});
check('B4 exact quantities, no input clamping and ordinary order ceiling', () => {
  for (const qty of [1,5,99,100,160]) {
    fixture(); fills=[]; edit(String(qty)); click('market-bulk-buy');
    assert.equal(held('provisions'),qty);
    assert.equal(fills.length,Math.ceil(qty/99));
  }
  for (const text of ['', '0','-1','1.5','1e2','Infinity','NaN','9007199254740992',' 1 ','161']) {
    fixture(); const before=state(); edit(text);
    assert.equal(find('market-bulk-quantity').value,text);
    assert.equal(find('market-bulk-buy').disabled,true,text);
    assert.equal(perform('Buy Provisions').ok,false,text);
    assert.deepEqual(state(),before,text);
  }
  fixture(); const before=state();
  assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:100,side:'buy'}).ok,false);
  assert.equal(window.rimward.act({v:2,name:'trade',args:{commodity:'provisions',qty:100,side:'buy'}}).ok,false);
  assert.deepEqual(state(),before);
  ctx.cargoCapacity=7;
  assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:8,side:'buy'}).ok,false);
  assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:5,side:'buy'}).ok,true);
});
check('B6/B9 displayed intent remains immutable through observation and periodic render', () => {
  for (const change of [
    ()=>{ctx.world.prices.provisions=101;},
    ()=>{ctx.world.credits+=1;},
    ()=>{ctx.cargo.push({commodity:'rawOre',units:1});},
    ()=>{ctx.world.marketSupply={rl_toll:{provisions:{units:159,updatedAt:100}}};},
    ()=>{ctx.cargoCapacity=159;},
  ]) {
    fixture(); edit('100');
    const label=action('Buy 100').label;
    change(); const before=state();
    for(let i=0;i<5;i++) { buildObservation(ctx); ctx.stationDesk.peekView(); }
    station.update(1.1);
    assert.equal(action('Buy 100').label,label);
    assert.deepEqual(state(),before);
    assert.equal(perform('Buy 100').ok,false);
    assert.deepEqual(state(),before);
    assert.match(ctx.stationDesk.peekView().notice,/state changed/);
  }
});
check('B7 old DOM confirmation cannot replay after completion or selection change', () => {
  fixture(); edit('100'); const old=find('market-bulk-buy'); old.click();
  const after=state(); old.click(); assert.deepEqual(state(),after);
  fixture(); edit('100'); const another=find('market-bulk-buy'); select('rawOre');
  const selected=state(); another.click(); assert.deepEqual(state(),selected);
  fixture(); edit('100'); ctx.world.prices.provisions=101;
  find('market-bulk-buy').click(); // Refresh the stale preview without a fill.
  const refreshed=state();
  for(const fn of find('market-bulk-buy')._listeners.click) fn({ detail:2 });
  assert.deepEqual(state(),refreshed,'second double-click cannot accept refreshed quote');
  let prevented=false;
  const target=find('market-bulk-buy');
  for(const fn of dom.winListeners.keydown) fn({code:'Enter',repeat:true,target,preventDefault(){prevented=true;}});
  assert.equal(prevented,true,'held Enter cannot advance preset focus into confirmation');
});
check('B7 second-chunk refusal and context loss preserve first fill and partial receipt', () => {
  for (const stop of [()=>{ctx.world.marketSupply.rl_toll.provisions.units=0;},()=>{ctx.stationDesk.selectService('jobs');}]) {
    fixture(); click('market-bulk-buy-max'); fills=[];
    afterFill = n => { if(n===1) stop(); };
    click('market-bulk-buy'); afterFill=null;
    assert.equal(held('provisions'),99);
    assert.equal(ctx.world.credits,10100);
    assert.equal(fills.length,1);
    assert.match(ctx.stationDesk.peekView().notice,/Bought 99 of 160 Provisions for 9900 UU\. 61 remain/);
  }
});
check('B5 fixer threshold stops before changed quote; explicit review requires new confirmation', () => {
  fixture(); SERVICE.buyMult=1.15; SERVICE.sellMult=1;
  // Disclosed contact fixture: put the authored fixer at this generated dock
  // so its ordinary buy premium leaves room for an observable sale markup.
  const fixer={...contactsForSystem(ctx,'redmarch').find(c=>c.role==='fixer'), id:'issue56-fixer', system:'rl_toll', trust:29};
  assert.equal(fixer.role,'fixer'); ctx.world.contacts.push(fixer);
  ctx.cargo.push({commodity:'restrictedComponents',units:160});
  select('restrictedComponents'); click('market-bulk-sell-all'); fills=[];
  assert.equal(perform('Sell 160').ok,true);
  assert.equal(held('restrictedComponents'),61);
  assert.equal(fixer.trust,31);
  assert.equal(ctx.world.credits,29900);
  assert.match(ctx.stationDesk.peekView().notice,/Sold 99 of 160 Restricted components for 9900 UU\. 61 remain: quote changed/);
  const before=state(); for(let i=0;i<5;i++) buildObservation(ctx); assert.deepEqual(state(),before);
  click('market-bulk-review'); assert.deepEqual(state(),before);
  assert.match(find('market-bulk-sell').textContent,/Sell 61/);
  click('market-bulk-sell'); assert.equal(held('restrictedComponents'),0);
  assert.equal(fixer.trust,33);
  ctx.world.contacts.splice(ctx.world.contacts.indexOf(fixer),1);
});
check('oversized saved holdings and invalid economic values refuse without unbounded work', () => {
  fixture(); ctx.cargo.push({commodity:'provisions',units:Number.MAX_SAFE_INTEGER});
  ctx.world.prices.provisions=0; const before=state();
  click('market-bulk-sell-all');
  assert.equal(find('market-bulk-sell').disabled,true);
  assert.match(find('market-bulk-preview').children.map(n=>n.textContent).join(' '),/1024-order safety limit/);
  assert.equal(perform('Sell Provisions').ok,false);
  assert.deepEqual(state(),before);
  for(const price of [-1,Infinity,NaN]) {
    fixture(); ctx.world.prices.provisions=price; edit('1'); const prior=state();
    assert.equal(find('market-bulk-buy').disabled,true);
    assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'buy'}).ok,false);
    assert.deepEqual(state(),prior);
  }
  fixture(); ctx.world.prices.provisions=0; ctx.world.credits=0;
  click('market-bulk-buy-max'); click('market-bulk-buy');
  assert.equal(held('provisions'),160); assert.equal(ctx.world.credits,0);
});
check('B8 ordinary 99+61 equals human effects; public maxima stay capped', () => {
  fixture(); click('market-bulk-buy-max'); click('market-bulk-buy'); const human=state();
  fixture();
  for(const qty of [99,61]) assert.equal(window.rimward.act({v:2,name:'trade',args:{commodity:'provisions',qty,side:'buy'}}).ok,true);
  assert.deepEqual(state(),human);
  assert.equal(ctx.stationDesk.peekTradeAvailability('provisions').sellMax,99);
});
check('B5 closed locker and B9 no new intent by captured reads', () => {
  dock('freehold'); fixture(); select('restrictedComponents'); edit('1');
  const before=state();
  assert.equal(find('market-bulk-buy').disabled,true);
  assert.equal(find('market-bulk-sell').disabled,true);
  assert.equal(perform('Buy Restricted').ok,false);
  assert.deepEqual(state(),before);
});
Object.keys(SERVICE).forEach(key=>{if(!Object.hasOwn(originalService,key)) delete SERVICE[key];});
Object.assign(SERVICE,originalService);
localStorage.setItem=save;
console.log('ISSUE-56 BULK TRADE PASS');
