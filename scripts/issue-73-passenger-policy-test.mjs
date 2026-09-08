/** Issue #73: real passenger acceptance, settlement and save/restart.
 * Controlled safe-berth fixtures bypass navigation and encounters; elapsed
 * fixture time and zero fixture costs are NOT evidence of natural trip profit.
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-73-passenger-policy-test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

const script = fileURLToPath(import.meta.url), KEY = 'rimward-save-v1';
const mode = process.argv[2];
function child(args, input) {
  const r = spawnSync(process.execPath, ['--import','./scripts/with-css-stub.mjs',script,...args],
    {input:input ? JSON.stringify(input) : undefined,encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
  return r.stdout;
}
if (!mode) {
  const runs = ['single','double','mixed'].map(s => JSON.parse(child([s]).trim().split('\n').at(-1)));
  mkdirSync('out/issue-73',{recursive:true});
  writeFileSync('out/issue-73/focused-results.json', JSON.stringify({
    fixture:'Safe berth positions/system changes and station/save ticks; production transactions. No flight or encounter costs measured.', runs,
  },null,2)+'\n');
  console.log('PASS issue #73 single, double, full-hold double, refusals, acceptance restart and delivery restart');
  process.exit(0);
}
seedBootRandom();
const dom = installDomStubs();
const restore = mode === 'restore' ? JSON.parse(readFileSync(0,'utf8')) : null;
if (restore) localStorage.setItem(KEY,restore.blob);
const {ctx,systems} = await bootGameSystems();
const station = systems.find(([n])=>n==='station')[1], save = systems.find(([n])=>n==='save')[1];
const clone = x => JSON.parse(JSON.stringify(x));
const state = () => ({credits:ctx.world.credits,cargo:clone(ctx.cargo),jobs:ctx.world.jobs.filter(j=>j.kind==='passenger'&&j.state==='accepted').map(clone)});
function step(n=1) { for(let i=0;i<n;i++) { ctx.world.time+=1/60;ctx.elapsed+=1/60;station.update(1/60);save.update(1/60);ctx.lastEvents=ctx.events;ctx.events=[]; } }
function dock(system) {
  if(ctx.flags.docked) ctx.stationDesk.undock();
  ctx.world.currentSystem=system;
  const p=ctx.systems[system].station.position;
  ctx.ship.object.position.set(p[0]+36,p[1],p[2]);ctx.ship.velocity.set(0,0,0);ctx.ship.speed=0;
  ctx.input.dockPressed=true;step(3);ctx.input.dockPressed=false;
  assert.equal(ctx.flags.docked,true);
}
function persisted(label) {
  const s=JSON.parse(localStorage.getItem(KEY));
  assert.equal(s.world.credits,ctx.world.credits,label+' credits');
  assert.deepEqual(s.cargo,ctx.cargo,label+' cargo');
  assert.deepEqual(s.world.jobs.filter(j=>j.kind==='passenger'&&j.state==='accepted'),state().jobs,label+' accepted agreements');
}
function restart(stage,destination,pay) {
  child(['restore'],{blob:localStorage.getItem(KEY),expected:state(),stage,destination,pay});
}
if (restore) {
  assert.deepEqual(state(),restore.expected,'fresh process restores credits, cargo and agreements');
  ctx.flags.paused=false;
  dock(restore.destination);step(90);
  assert.equal(ctx.world.credits,restore.expected.credits+(restore.stage==='accepted'?restore.pay:0));
  assert.deepEqual(ctx.cargo,restore.expected.cargo,'delivery retains commodity cargo');
  persisted('restart settlement');
  const paid=ctx.world.credits;dock(restore.destination);step(90);assert.equal(ctx.world.credits,paid,'redock pays no duplicate');
  console.log('PASS restart '+restore.stage);process.exit(0);
}
for(const node of dom.walkDom(document.body)) if(node.dataset?.titleAction==='new'){node.click();break;}
dom.dispatchKey('Digit1');assert.equal(ctx.world.origin,'greenhand');ctx.flags.combat=false;
dock('freehold');ctx.stationDesk.selectService('jobs');
const offers=ctx.world.jobs.filter(j=>j.kind==='passenger'&&j.originSystem==='freehold'&&j.state==='offered');
assert.equal(offers.length,2,'two valid distinct origin slots');
const initialCash=ctx.world.credits;
let capital=0;
if(mode==='mixed') {
  // Funding fixture enables a full hold in a fresh Greenhand game. Record the
  // real commodity purchase separately; the grant is not earned income.
  ctx.world.credits=5000;
  const purchaseCash=ctx.world.credits;
  const units=ctx.cargoCapacity-ctx.cargo.reduce((n,c)=>n+c.units,0);
  assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:units,side:'buy'}).ok,true);
  capital=purchaseCash-ctx.world.credits;
  assert.equal(ctx.cargo.reduce((n,c)=>n+c.units,0),ctx.cargoCapacity);
}
const before=state(), selected=offers.slice(0,mode==='single'?1:2), refusals=[];
function refused(label,fn) {
  const s=state(), blob=localStorage.getItem(KEY), r=fn();
  assert.equal(r.ok,false,label);assert.deepEqual(state(),s,label+' atomic live state');
  assert.equal(localStorage.getItem(KEY),blob,label+' atomic save');
  refusals.push({label,receipt:r});
}
for(const j of selected) {
  assert.equal(ctx.stationDesk.acceptJob(j.id).ok,true);
  assert.equal(j.payQuoted,350);assert.equal(j.deadline,ctx.world.time+600);
  refused('duplicate '+j.id,()=>ctx.stationDesk.acceptJob(j.id));
}
assert.equal(ctx.world.credits,before.credits,'no passenger buy-in');assert.deepEqual(ctx.cargo,before.cargo,'no passenger hold occupancy');
if(mode==='mixed') refused('ferry at full hold',()=>ctx.stationDesk.acceptJob('ferry-consignment'));
refused('unknown passenger posting',()=>ctx.stationDesk.acceptJob('passenger-not-a-real-id'));
persisted('acceptance');
const pay=selected.reduce((n,j)=>n+j.payQuoted,0),destination=selected[0].destSystem;
assert.ok(selected.every(j=>j.destSystem===destination));
restart('accepted',destination,pay);
// Earned-standing fixture changes the live offer multiplier after acceptance.
// Existing agreements must keep their original fare; one remaining offer in
// the single-party case must reflect the current multiplier before acceptance.
ctx.world.epics.freehold=3;
ctx.stationDesk.selectService('jobs');
if(mode==='single') {
  const rows=ctx.stationDesk.peekView().rows;
  assert.ok(rows.some(r=>/Escort to Veridian Spire.*402 UU/.test(r.text)),'unaccepted fare uses current standing');
  assert.ok(rows.some(r=>/Escort to Veridian Spire.*350 UU/.test(r.text)),'accepted fare remains locked');
}
step(90);assert.equal(ctx.world.credits,before.credits,'origin docking does not pay');
dock(destination);step(90);
assert.equal(ctx.world.credits,before.credits+pay,'each accepted quote pays exactly once');
assert.deepEqual(ctx.cargo,before.cargo,'all commodities retained on passenger delivery');
assert.ok(selected.every(j=>!ctx.world.jobs.some(l=>l.id===j.id&&l.state==='accepted')));
persisted('delivery');restart('delivered',destination,pay);
const wrongOrigin=ctx.world.jobs.find(j=>j.kind==='passenger'&&j.originSystem==='freehold'&&j.state==='offered');
assert.ok(wrongOrigin);
refused('wrong posting dock',()=>ctx.stationDesk.acceptJob(wrongOrigin.id));
const after=ctx.world.credits;step(180);dock(destination);step(90);assert.equal(ctx.world.credits,after,'repeated ticks/redock cannot pay again');
const deliveryCash=ctx.world.credits;
let tradeProceeds=0;
if(mode==='mixed') {
  const units=ctx.cargo.filter(c=>c.commodity==='provisions').reduce((n,c)=>n+c.units,0);
  assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:units,side:'sell'}).ok,true);
  tradeProceeds=ctx.world.credits-deliveryCash;
}
console.log(JSON.stringify({scenario:mode,parties:selected.map(j=>({id:j.id,quote:j.payQuoted})),destination,
  passengerPayments:pay,passengerCapital:0,passengerHold:0,commodityCapital:capital,
  fixtureCashGrant:mode==='mixed'?5000-initialCash:0,
  commodityOccupied:before.cargo.reduce((n,c)=>n+c.units,0),cargoAtDelivery:before.cargo,
  tradeProceeds,tradingContribution:mode==='mixed'?tradeProceeds-capital:0,
  flightCosts:null,travelSeconds:null,refusals,acceptanceRestart:true,deliveryRestart:true,pass:true}));
