/** #207 real station owner, rendered DOM, and v2 receipts regression.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-207-job-abandon-test.mjs
 * Relocation is a fixture; launch and desk decisions use real owners.
 */
import assert from 'node:assert/strict';
import { snapshot as saveSnapshot, restore } from '../src/game/save.js';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const station = systems.find(([n]) => n === 'station')[1];
const world = systems.find(([n]) => n === 'world')[1];
for (const el of dom.walkDom(document.body)) if (el.dataset?.titleAction === 'new') { el.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
ctx.flags.combat = false;
ctx.agent.optIn = true;
const rw = window.rimward;
function tick() { station.update(1 / 60); ctx.lastEvents = ctx.events; ctx.events = []; }
function dock(id) {
  if (ctx.flags.docked) ctx.stationDesk.undock();
  ctx.flags.docked = false;
  ctx.world.currentSystem = id;
  ctx.lastEvents = [{ type: 'systemLoaded', to: id }]; world.update(0);
  const p = ctx.systems[id].station.position;
  ctx.ship.object.position.set(p[0] + 36, p[1], p[2]);
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.input.dockPressed = true; tick(); tick(); ctx.input.dockPressed = false;
  assert.equal(ctx.flags.docked, true);
  assert.equal(ctx.world.currentSystem, id);
}
const act = (name, args = {}) => rw.act({ v: 2, name, args });
function refused(r, token) {
  assert.equal(r.ok, false, JSON.stringify(r));
  assert.ok(r.token && r.error, JSON.stringify(r));
  if (token) assert.equal(r.token, token);
}
dock('freehold');
ctx.stationDesk.selectService('jobs');
const snapshot = () => JSON.stringify({jobs:ctx.world.jobs,cargo:ctx.cargo,credits:ctx.world.credits,reputation:ctx.world.reputation});
function noChange(handle) {
  const before = snapshot();
  assert.equal(ctx.stationDesk.abandonJob(handle).ok, false);
  assert.equal(snapshot(), before);
}
for (const kind of ['mining','trade','hunt','passenger','explore','espionage','war']) {
  dock('freehold'); ctx.stationDesk.selectService('jobs');
  let job=ctx.world.jobs.find(j=>j.kind===kind && j.state==='offered' && j.originSystem==='freehold');
  if (!job) {
    // Hunt/war can require an eligible roster. The action validates the live contract, not roster eligibility.
    job={id:`${kind}-freehold-99999`,kind,slot:0,originSystem:'freehold',state:'offered',title:'Fixture',detail:'Accepted contract fixture',reward:777,need:1,progress:0};
    ctx.world.jobs.push(job);
  }
  assert.equal(ctx.stationDesk.acceptJob(job.id).ok,true,'accept '+kind);
  job.deadline=ctx.world.time+1000;
  dock('veridian'); ctx.stationDesk.selectService('jobs');
  const credit=ctx.world.credits, cargo=JSON.stringify(ctx.cargo), rep=ctx.world.reputation.freehold || 0;
  const progress=job.progress, contacts=JSON.stringify(ctx.world.contacts), equipment=JSON.stringify(ctx.ship.kit);
  const remoteRep=ctx.world.reputation.veridian;
  const result=kind==='mining' ? ctx.stationDesk.abandonJob({id:job.id,kind:'ferry',originSystem:'veridian',state:'offered'}) : act('abandonJob',{id:job.id});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(job.state,'failed');
  assert.equal(ctx.world.jobs.includes(job),false);
  assert.equal(ctx.agent.events.filter(e=>e.type==='jobState'&&e.id===job.id&&e.outcome==='abandoned').length,1);
  assert.equal(rw.observe().jobs.active.some(j=>j.id===job.id),false);
  assert.equal(ctx.world.reputation.freehold,rep-1);
  assert.equal(ctx.world.reputation.veridian,remoteRep);
  assert.equal(ctx.world.credits,credit);
  assert.equal(JSON.stringify(ctx.cargo),cargo);
  assert.equal(job.progress,progress);
  assert.equal(JSON.stringify(ctx.world.contacts),contacts);
  assert.equal(JSON.stringify(ctx.ship.kit),equipment);
  noChange(job.id); noChange({...job,kind:'trade',state:'accepted'});
  tick();
  assert.equal(ctx.world.credits,credit);
  assert.equal(ctx.world.jobs.some(j=>j.id===job.id),false);
  assert.equal(ctx.agent.events.filter(e=>e.type==='jobState'&&e.id===job.id).length,1,'terminal recorded once');
  if (job.recordId) {
    const banks=[ctx.world.records,...Object.values(ctx.world.recordBanks||{})].filter(Array.isArray);
    const quarry=banks.flat().find(r=>r.id===job.recordId);
    assert.ok(quarry,'quarry fixture exists');
    quarry.state='dead';
    ctx.world.incidents.push({kind:'destroyed',name:quarry.name,causer:'player'});
  }
  if (job.destSystem) dock(job.destSystem);
  tick();
  assert.equal(ctx.world.credits,credit,'former destination/quarry cannot pay abandoned contract');
  assert.equal(ctx.agent.events.filter(e=>e.type==='jobState'&&e.id===job.id).length,1);
  const snap=JSON.parse(JSON.stringify(saveSnapshot(ctx)));
  restore(ctx,snap);
  assert.equal(ctx.world.jobs.some(j=>j.id===job.id),false,'save/load cannot restore abandoned contract');
  assert.equal(ctx.world.credits,credit);
  console.log('PASS abandonment',kind);
}
dock('freehold'); ctx.stationDesk.selectService('jobs');
for(const kind of ['ferry','haul','recovery','chain','bounty','patrol']) {
  const job={id:'excluded-'+kind,kind,state:'accepted',originSystem:'freehold'};
  ctx.world.jobs.push(job); noChange(job); ctx.world.jobs.splice(ctx.world.jobs.indexOf(job),1);
}
for(const state of ['offered','done','failed']) {
  const job={id:'state-'+state,kind:'trade',state,originSystem:'freehold'};
  ctx.world.jobs.push(job);noChange(job);ctx.world.jobs.splice(ctx.world.jobs.indexOf(job),1);
}
for(const originSystem of ['missing','__proto__',null]) {
  const job={id:'invalid-origin',kind:'trade',state:'accepted',originSystem};
  ctx.world.jobs.push(job);noChange(job);ctx.world.jobs.splice(ctx.world.jobs.indexOf(job),1);
}
for(const id of ['missing','__proto__',null,{},42]) noChange({id,kind:'trade',state:'accepted'});
const job=ctx.world.jobs.find(j=>j.kind==='passenger'&&j.state==='offered'&&j.originSystem==='freehold');
assert.ok(job); job.state='accepted';
ctx.stationDesk.selectService('market'); noChange(job.id); assert.equal(act('abandonJob',{id:job.id}).ok,false);
ctx.stationDesk.selectService('jobs'); ctx.flags.docked=false; noChange(job.id); assert.equal(act('abandonJob',{id:job.id}).ok,false);ctx.flags.docked=true;
ctx.stationDesk.selectService('jobs');
const staleButton=[...dom.walkDom(document.body)].find(e=>e.textContent?.startsWith('Abandon (-1'));
assert.ok(staleButton,'visible abandonment action');
assert.equal(ctx.stationDesk.abandonJob(job.id).ok,true);
const replacement=ctx.world.jobs.find(j=>j.kind==='passenger'&&j.originSystem==='freehold'&&j.slot===job.slot&&j.state==='offered');
assert.ok(replacement); assert.notEqual(replacement.id,job.id); replacement.state='accepted';
noChange(job.id);
const before=snapshot(); staleButton.click();assert.equal(snapshot(),before,'stale DOM action cannot mutate replacement');
console.log('PASS exclusions, invalid IDs/origins/states, service/dock gates, stale replacement');
