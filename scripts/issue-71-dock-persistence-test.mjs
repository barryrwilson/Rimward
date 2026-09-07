/** Issue #71: actual station transactions + save system, with controlled berth
 * fixtures. No traffic/flight simulation is needed for these ordering checks;
 * the full boot and live browser runs cover the complete runtime separately.
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-71-dock-persistence-test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { requestAutosave } from '../src/game/save.js';

seedBootRandom();
const dom = installDomStubs();
const KEY = 'rimward-save-v1';
const reboot = process.argv.includes('--reboot');
const input = reboot ? JSON.parse(readFileSync(0, 'utf8')) : null;
if (input) localStorage.setItem(KEY, input.saved);
const { ctx, systems, binds } = await bootGameSystems();
const station = systems.find(([name]) => name === 'station')[1];
const save = systems.find(([name]) => name === 'save')[1];
const state = () => ({
  credits: ctx.world.credits,
  cargo: JSON.parse(JSON.stringify(ctx.cargo)),
  jobs: ctx.world.jobs.filter(j => j.state === 'accepted' || j.id === 'ferry-consignment')
    .map(j => ({ id:j.id, state:j.state, originSystem:j.originSystem, destSystem:j.destSystem, payQuoted:j.payQuoted }))
    .sort((a,b) => a.id.localeCompare(b.id)),
});
function step(count = 1) {
  for (let i=0; i<count; i++) {
    ctx.world.time += 1/60;
    ctx.elapsed += 1/60;
    station.update(1/60);
    save.update(1/60);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
function dock(system = ctx.world.currentSystem) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  // Fixture: put the vessel at the safe berth; actual station dock and delayed
  // job tick remain in charge of all transaction mutations.
  ctx.world.currentSystem = system;
  const p = ctx.systems[system].station.position;
  ctx.ship.object.position.set(p[0]+36,p[1],p[2]);
  ctx.ship.velocity.set(0,0,0);
  ctx.ship.speed = 0;
  ctx.input.dockPressed = true;
  step(3);
  ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
}
const saved = () => JSON.parse(localStorage.getItem(KEY));
function matchesSave(label) {
  const s = saved();
  assert.equal(s.world.credits, ctx.world.credits, label+' credits');
  assert.deepEqual(s.cargo, ctx.cargo, label+' cargo');
  for (const job of ctx.world.jobs.filter(j => j.state === 'accepted' || j.id === 'ferry-consignment')) {
    const row = s.world.jobs.find(j => j.id === job.id);
    for (const key of ['state','originSystem','destSystem','payQuoted']) assert.equal(row?.[key],job[key],label+' '+job.id+' '+key);
  }
  console.log('PASS',label);
}
function freshProcess(label) {
  const result = spawnSync(process.execPath, ['--import','./scripts/with-css-stub.mjs', fileURLToPath(import.meta.url),'--reboot'], {
    input:JSON.stringify({ saved:localStorage.getItem(KEY), expected:state() }), encoding:'utf8',maxBuffer:4*1024*1024,
  });
  assert.equal(result.status,0,label+'\n'+result.stdout+'\n'+result.stderr);
  console.log('PASS',label);
}
if (reboot) {
  assert.deepEqual(state(), input.expected, 'fresh module graph restores full agreement');
  const credits = ctx.world.credits;
  ctx.flags.paused = false;
  dock();
  step(90);
  assert.equal(ctx.world.credits, credits, 'completed delivery cannot pay twice after fresh boot');
  console.log('PASS fresh boot and redock have no repeated payment');
  process.exit(0);
}

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
assert.equal(ctx.world.origin,'greenhand');
ctx.flags.combat = false;
dock('freehold');
ctx.stationDesk.selectService('jobs');
const accept = id => ctx.stationDesk.acceptJob(id);
assert.equal(accept('ferry-consignment').ok,true);
const passenger = ctx.world.jobs.find(j=>j.kind==='passenger'&&j.originSystem==='freehold'&&j.state==='offered');
assert.ok(passenger,'real passenger posting exists');
assert.equal(accept(passenger.id).ok,true);
matchesSave('acceptance persists fronted cargo, passenger and agreed quotes immediately');
const agreement = ctx.world.jobs.find(j=>j.id==='ferry-consignment');
const quote = agreement.payQuoted + ctx.world.jobs.find(j=>j.id===passenger.id).payQuoted;
const destination = agreement.destSystem;
const beforePay = ctx.world.credits;
dock(destination);
assert.equal(saved().world.credits,beforePay,'arrival snapshot precedes delayed payment');
assert.equal(saved().world.jobs.find(j=>j.id==='ferry-consignment').state,'accepted');
step(40);
assert.equal(ctx.world.credits,beforePay+quote,'ferry and passenger both settle');
assert.equal(ctx.world.jobs.find(j=>j.id==='ferry-consignment').state,'done');
assert.ok(!ctx.world.jobs.some(j=>j.id===passenger.id&&j.state==='accepted'));
matchesSave('delayed settlement replaces arrival snapshot after both complete payouts');
freshProcess('settled delivery survives fresh process and cannot pay again');
assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'buy'}).ok,true);
matchesSave('post-arrival market buy');
assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'sell'}).ok,true);
matchesSave('post-arrival market sell');
const doneAgreement = state(), doneBlob = localStorage.getItem(KEY), capacityBeforeReoffer = ctx.cargoCapacity;
ctx.cargoCapacity = 0;
assert.equal(accept('ferry-consignment').ok,false,'full hold refuses completed ferry reoffer');
assert.deepEqual(state(),doneAgreement,'full hold preserves completed agreement');
assert.equal(localStorage.getItem(KEY),doneBlob,'full hold reoffer refusal does not save');
ctx.cargoCapacity = capacityBeforeReoffer;
console.log('PASS full hold return-ferry refusal preserves saved completed agreement');
assert.equal(accept('ferry-consignment').ok,true);
matchesSave('legitimate return ferry persists its new destination and quote');
freshProcess('trade and next agreement survive fresh process');

// Refusal paths must leave both live business state and last save unchanged.
function refused(label, fn) {
  const before = state(), blob = localStorage.getItem(KEY);
  assert.equal(fn().ok,false,label);
  assert.deepEqual(state(),before,label+' live state');
  assert.equal(localStorage.getItem(KEY),blob,label+' no write');
  console.log('PASS',label);
}
refused('duplicate accepted ferry refused atomically',()=>accept('ferry-consignment'));
refused('insufficient cargo sale refused atomically',()=>ctx.stationDesk.trade({commodity:'provisions',qty:999,side:'sell'}));
refused('insufficient funds buy refused atomically',()=>ctx.stationDesk.trade({commodity:'provisions',qty:999,side:'buy'}));
const priorCapacity = ctx.cargoCapacity;
ctx.cargoCapacity = 0;
refused('full hold buy refused atomically',()=>ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'buy'}));
ctx.cargoCapacity = priorCapacity;

// Repair/feed fixtures alter only their input need; the production handlers
// must save both payment and the healed/fed state after completing the action.
ctx.player.hull -= 1;
assert.equal(ctx.stationDesk.repairAll().ok,true);
assert.equal(saved().player.hull,ctx.player.hull);
matchesSave('successful yard repair persists payment and restored hull');
ctx.bio.hunger = 0.5;
assert.equal(ctx.stationDesk.feed({kind:'biomass'}).ok,true);
assert.equal(saved().bio.hunger,0);
matchesSave('successful feeding persists payment and companion state');
refused('unneeded feeding refused without a checkpoint',()=>ctx.stationDesk.feed({kind:'biomass'}));

// Real storage failure: completed transaction stays coherent in memory, prior
// snapshot intact, warning emitted, then retry succeeds while still docked.
const setItem = localStorage.setItem;
const priorBlob = localStorage.getItem(KEY);
localStorage.setItem = () => { throw new Error('quota fixture'); };
assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'sell'}).ok,true);
assert.equal(localStorage.getItem(KEY),priorBlob);
assert.ok(ctx.events.some(e=>e.type==='saveBlocked'&&/Storage unavailable/.test(e.reason)));
const warningCount = ctx.events.filter(e=>e.type==='saveBlocked').length;
requestAutosave(ctx);
requestAutosave(ctx);
assert.equal(ctx.events.filter(e=>e.type==='saveBlocked').length,warningCount,'same storage failure warning is not spammed');
localStorage.setItem = setItem;
step(310);
matchesSave('failed storage retries completed transaction at same berth');

// Use the same guards as production, with a controlled hostile fixture.
const originalShips = ctx.ships;
ctx.ships = [{role:'pirate',object:ctx.ship.object,state:{destroyed:false}}];
ctx.flags.combat = true;
const heldBlob = localStorage.getItem(KEY);
assert.equal(ctx.stationDesk.trade({commodity:'provisions',qty:1,side:'sell'}).ok,true);
assert.equal(localStorage.getItem(KEY),heldBlob,'encounter gate retains last safe save');
step(310);
assert.equal(localStorage.getItem(KEY),heldBlob,'dock retry never bypasses encounter gate');
ctx.flags.combat = false;
ctx.ships = originalShips;
step(310);
matchesSave('held encounter checkpoint retries after berth is safe');
ctx.gate.jumping = true;
const jumpBlob = localStorage.getItem(KEY);
assert.equal(requestAutosave(ctx),false);
step(310);
assert.equal(localStorage.getItem(KEY),jumpBlob,'mid-jump retry never writes incoherent state');
ctx.gate.jumping = false;
step(310);
assert.notEqual(localStorage.getItem(KEY),jumpBlob,'post-jump retry resumes');
console.log('PASS mid-jump restriction and retry');

// An explicit restore cancels a failed request from the abandoned timeline.
localStorage.setItem = () => { throw new Error('quota fixture'); };
requestAutosave(ctx);
localStorage.setItem = setItem;
binds.restore(ctx, JSON.parse(jumpBlob));
const restoredBlob = localStorage.getItem(KEY);
ctx.lastEvents=[]; ctx.events=[];
step(310);
assert.equal(localStorage.getItem(KEY),restoredBlob,'restore discards abandoned pending write');
console.log('PASS restore clears pending transaction retry');

// Arriving short is a delivery refusal, not a completed transaction. Preserve
// the accepted agreement and hold, and do not create a delayed partial save.
dock('freehold');
const shortState = state(), shortBlob = localStorage.getItem(KEY);
assert.ok(ctx.cargo.filter(c=>c.commodity==='provisions').reduce((n,c)=>n+c.units,0)<4);
step(40);
assert.deepEqual(state(),shortState,'short manifest cannot pay or consume cargo');
assert.equal(localStorage.getItem(KEY),shortBlob,'short manifest cannot save a partial settlement');
console.log('PASS short manifest delivery refused without partial mutation or save');
