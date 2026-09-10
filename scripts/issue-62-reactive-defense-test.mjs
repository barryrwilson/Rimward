/** Issue #62 focused control/physics regression fixtures. */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as THREE from 'three';
import { createCtx } from '../src/core/ctx.js';
import { createShipState } from '../src/game/state.js';
import { localDir } from '../src/game/agent-schema.js';
import { installDomStubs } from './lib/boot-harness.mjs';
import { initControls, agentControlStatus } from '../src/systems/controls.js';
import { initAgentApi } from '../src/systems/agent-api.js';
import { initShip } from '../src/systems/ship.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }
function fixture() {
  const dom = installDomStubs(), docEvents = {};
  document.addEventListener = (name, fn) => (docEvents[name] ??= []).push(fn);
  window.location.search = '?agent=1';
  const ctx = createCtx({ scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(), renderer: {} });
  // Flight fixtures spawn at the origin facing -Z, away from this valid sun.
  ctx.config.world = { sunPosition: new THREE.Vector3(0, 0, 5000) };
  ctx.world.currentSystem = 'fixture'; ctx.world.time = 1;
  ctx.systems = {}; ctx.station = {}; ctx.asteroids = { list: [] }; ctx.flags.paused = false;
  ctx.ship.object = new THREE.Object3D(); ctx.ship.velocity = new THREE.Vector3();
  ctx.ship.speed = 80;
  ctx.player = createShipState('light');
  ctx.agent.optIn = true;
  const target = { id: 'combat-fixture', record: {}, object: new THREE.Object3D(), state: createShipState('light') };
  target.object.position.set(0, 0, -300); ctx.ships = [target]; ctx.targets.current = target;
  const controls = initControls(ctx); initAgentApi(ctx);
  const api = window.rimward;
  let seq = 0;
  function sample(extra = {}) {
    const p = target.object.position, o = ctx.ship.object.position;
    ctx.targets.aim = { targetId: target.id, system: ctx.world.currentSystem, t: ctx.world.time, weaponGroup: ctx.input.weaponGroup,
      dist: p.distanceTo(o), speed: 80, closing: 0,
      bearing: localDir(ctx.ship.object.quaternion, p.x-o.x, p.y-o.y, p.z-o.z), ...extra };
  }
  sample();
  const act = (name, args = {}) => api.act({ v: 2, name, args });
  const start = (args = {}) => act('setCombatIntent', { seq: ++seq, ttl: 45, targetId: target.id, intent: 'engage', ...args });
  const status = () => agentControlStatus(ctx);
  const tick = (seconds = 1/60, fresh = true, extra = {}) => {
    ctx.world.time += seconds;
    if (fresh) sample(extra);
    controls.update(seconds);
  };
  const emit = (name, args = {}) => {
    for (const fn of dom.winListeners[name] || []) fn({ preventDefault() {}, ...args });
  };
  return { ctx, target, act, start, status, tick, sample, emit, docEvents, api };
}

function cue(f,type='playerHit',data={damage:8,family:'energy',fromAft:true}) {
  f.ctx.emit(type,data); f.ctx.lastEvents=f.ctx.events; f.ctx.events=[];
}
function flightFixture() {
  const f=fixture(),ctx=f.ctx;
  ctx.config.world.shipSpawn=new THREE.Vector3();ctx.config.world.stationPosition=new THREE.Vector3(5000,5000,5000);
  const flight=initShip(ctx); f.sample();
  return {...f,flight};
}

test('defense validation is strict, atomic, discoverable and defaults to evade',()=>{
  const f=fixture();assert.equal(f.start().ok,true);assert.equal(f.status().combat.defense.stance,'evade');
  const before=f.status(), input={...f.ctx.input};
  for(const defense of [undefined,null,'',false,1,{},'retreat','__proto__']) {
    assert.equal(f.act('setCombatIntent',{seq:2,ttl:45,targetId:f.target.id,intent:'engage',defense}).token,'bad-args');
    assert.deepEqual({...f.status(),expiresIn:before.expiresIn},before);assert.deepEqual(f.ctx.input,input);
  }
  assert.match(JSON.stringify(f.api.observe().capabilities),/evade/);
  assert.equal(f.start({defense:'off'}).ok,true);assert.equal(f.status().combat.defense.stance,'off');
});
test('fore/aft and unknown incoming warnings apply ordinary control in one tick without leaking emitter',()=>{
  for(const aft of [true,false]) {
    const f=fixture();f.start();cue(f,'playerHit',{damage:8,family:'energy',fromAft:aft});f.tick();
    const d=f.status().combat.defense;
    assert.equal(d.trigger,'hit');assert.equal(d.direction,aft?'aft':'fore');assert.equal(d.attackerId,null);
    // This synchronous fixture checks timestamp pairing/order only. It has no
    // frame scheduling; the live probe must establish the 250 ms wall budget.
    assert.equal(d.phase,'evading');assert(d.appliedWallMs>=d.cueWallMs);assert(d.appliedWallMs-d.cueWallMs<250);
    assert.equal(f.ctx.input.fireHeld,false);assert(Math.abs(f.ctx.input.strafeX)>0);assert(f.ctx.input.throttle>0);
  }
  for(const weapon of ['cannon','turret','missile']) {
    const f=fixture();f.start();cue(f,'npcFire',{weapon,target:'player',ship:{id:'PRIVATE-EMITTER',ai:{position:[100,2,3]}}});f.tick();
    const d=f.status().combat.defense;assert.equal(d.trigger,weapon==='missile'?'incoming-dart':'incoming-fire');
    assert.equal(d.attackerId,null);assert.equal(d.direction,'unknown');assert(!JSON.stringify(d).includes('PRIVATE'));
  }
});
test('no threat, pregrant/stale replay, NPC combat and environmental impacts add no weave',()=>{
  const f=fixture();cue(f);f.start();f.tick();assert.equal(f.status().combat.defense.phase,'idle');
  for(const [type,data] of [['playerHit',{damage:4,family:'impact'}],['playerHit',{damage:NaN,family:'energy'}],
    ['npcFire',{weapon:'turret'}],['npcFire',{weapon:'missile'}],['npcFire',{weapon:'bogus',target:'player'}],
    ['npcFire',{weapon:'cannon',target:{id:'npc'}}]]) {
    cue(f,type,data);f.tick();assert.equal(f.status().combat.defense.phase,'idle');
  }
  cue(f);f.ctx.lastEvents[0].t-=1;f.tick();assert.equal(f.status().combat.defense.phase,'idle');
  cue(f);f.tick();const first=f.status().combat.defense;const side=f.ctx.input.strafeX;
  for(let n=0;n<80;n++) f.tick(); // same event object cannot prolong/retrigger
  assert.equal(f.status().combat.defense.phase,'reengaging');assert.equal(f.status().combat.defense.triggeredAt,first.triggeredAt);
  assert(side!==0);
});
test('bursts have stable side, simultaneous hit priority and coherent first/latest telemetry',()=>{
  const f=fixture();f.start();f.ctx.flags.combat=true;f.tick();const first=f.status().combat.defense;
  const side=f.ctx.input.strafeX;
  for(let n=0;n<10;n++) {
    f.ctx.emit('npcFire',{weapon:'cannon',target:'player'});f.ctx.emit('hostileEnter',{id:'public-contact'});
    f.ctx.emit('playerHit',{damage:4,family:'disruptor',fromAft:n%2===0});f.ctx.lastEvents=f.ctx.events;f.ctx.events=[];f.tick();
    const d=f.status().combat.defense;assert.equal(f.ctx.input.strafeX,side);assert.equal(d.trigger,first.trigger);
    assert.equal(d.cueWallMs,first.cueWallMs);assert.equal(d.latestCue.trigger,'hit');assert.equal(d.latestCue.attackerId,null);
    assert(d.latestCue.appliedWallMs>=d.latestCue.cueWallMs);
  }
  for(let n=0;n<250;n++) f.tick();assert.equal(f.status().combat.defense.phase,'reengaging');
});
test('each critical fraction and explicit defensive stance latch withdrawal without changing intent',()=>{
  for(const [reason,modify] of [['hull',p=>p.hull=p.hullMax*.4],['engine',p=>p.engine=p.engineMax*.3],
    ['engine',p=>p.engineOut=true],['defenses',p=>{p.screen=0;p.shell=(p.screenMax+p.shellMax)*.1;}],
    ['hull',p=>p.hullMax=0],['hull',p=>p.hull=NaN],['stance',()=>{}]]) {
    const f=fixture();modify(f.ctx.player);f.start({defense:reason==='stance'?'break-off':'evade'});cue(f);f.tick();
    assert.equal(f.status().combat.intent,'engage');assert.equal(f.status().combat.phase,'break-off');
    assert.equal(f.status().combat.defense.reason,reason);assert.equal(f.ctx.input.fireHeld,false);
    f.ctx.player=createShipState('light');for(let n=0;n<250;n++){cue(f);f.tick();}
    assert.equal(f.status().combat.phase,'break-off');assert.equal(f.ctx.input.fireHeld,false);
  }
});
test('heat suppresses fire with hysteresis but does not latch permanent withdrawal',()=>{
  const f=fixture();f.start();f.ctx.player.heat=90;cue(f);f.tick();assert.equal(f.status().combat.fireBlocked,'heat');
  for(let n=0;n<200;n++)f.tick();f.ctx.player.heat=80;f.tick();assert.equal(f.ctx.input.fireHeld,false);
  f.ctx.player.heat=74;f.tick();assert.equal(f.ctx.input.fireHeld,true);assert.equal(f.status().combat.defense.phase,'reengaging');
});
test('visible side/aft obstacles and selected frontal hull override defense and never fire',()=>{
  for(const position of [[50,0,0],[0,0,50],[0,0,-50]]) {
    const f=fixture();f.ctx.asteroids.list=[{id:0,position:new THREE.Vector3(...position),radius:30}];f.start();cue(f);f.tick();
    assert.equal(f.status().combat.movementBlocked,'obstructed');assert.equal(f.ctx.input.fireHeld,false);
    assert.equal(f.ctx.input.fullStop,true);assert.equal(f.ctx.input.strafeX,0);
  }
  const f=fixture();f.target.object.position.z=-10;f.sample();f.start();cue(f);f.tick();
  assert.equal(f.status().combat.movementBlocked,'obstructed');assert.equal(f.ctx.input.fireHeld,false);
});
test('grant cancellation, dock/hold/lifecycle gates cannot be revived by new cues',()=>{
  for(const reason of ['docked','held','paused','dead','overlay','opt-in','jumping','explicit']) {
    const f=fixture();f.start();cue(f);f.tick();
    if(reason==='explicit')f.act('clearControl');else if(reason==='held')f.ctx.flags.berthHold=true;
    else if(reason==='dead')f.ctx.player.destroyed=true;else if(reason==='overlay')f.ctx.flags.chartOpen=true;
    else if(reason==='opt-in')f.ctx.agent.optIn=false;else if(reason==='jumping')f.ctx.gate.jumping=true;else f.ctx.flags[reason]=true;
    cue(f);f.tick();assert.equal(f.status().reason,reason);assert.equal(f.status().owner,'none');
    assert.equal(f.ctx.input.fireHeld,false);assert.equal(f.ctx.input.driftHeld,false);assert.equal(f.ctx.input.agentBurnerHeld,false);
    const terminal=f.status().combat;cue(f);f.tick();assert.deepEqual(f.status().combat,terminal);
  }
  for(const flag of ['docked','berthHold']) {const f=fixture();f.ctx.flags[flag]=true;cue(f);assert.equal(f.start().ok,false);f.tick();assert.equal(f.ctx.input.throttle,0);}
});
test('physical takeover is synchronous, held controls refuse renewal, and focus preserves wall-bounded defense',()=>{
  const f=fixture();f.start();cue(f);f.tick();f.emit('keydown',{code:'KeyR',repeat:false});
  assert.equal(f.status().reason,'player-override');assert.equal(f.ctx.input.agentBurnerHeld,false);assert.equal(f.start().token,'player-override');
  let now=performance.now();const clock=mock.method(performance,'now',()=>now);
  try {const g=fixture();g.start({ttl:2});cue(g);g.tick();g.emit('blur');assert.equal(g.status().owner,'combat');
    now+=2001;assert.equal(g.api.observe().control.reason,'expired');cue(g);g.tick();assert.equal(g.ctx.input.fullStop,true);
  } finally {clock.mock.restore();}
});
test('same stance renewal preserves episode; different stance resets and off supplies baseline',()=>{
  const f=fixture();f.start();cue(f);f.tick();const first=f.status().combat.defense;
  f.start();assert.deepEqual(f.status().combat.defense,first);f.start({defense:'off'});cue(f);f.tick();
  assert.equal(f.status().combat.defense.phase,'idle');assert.equal(f.ctx.input.fireHeld,true);
  f.start();f.tick();assert.equal(f.status().combat.defense.phase,'idle');
});
test('five/fifteen/thirty second external gaps react locally without renewing either deadline',()=>{
  for(const delay of [5,15,30]) {
    const f=fixture();f.start({ttl:45});
    for(let n=0;n<delay*60;n++){if(n===60||n===delay*60-2)cue(f);f.tick();}
    assert.equal(f.status().seq,1);assert(Math.abs(f.status().expiresIn-(45-delay))<1e-6);
    assert.equal(f.status().combat.defense.latestCue.trigger,'hit');assert.equal(f.ctx.input.fireHeld,false);
  }
});
test('defensive completion leaves real physics deceleration and stable full-stop',()=>{
  const f=flightFixture();f.target.object.position.z=500;f.ctx.ship.velocity.set(0,0,-90);f.ctx.ship.speed=90;f.sample({closing:90});
  f.start({defense:'break-off'});cue(f);f.tick(1/60,true,{closing:90});
  for(let n=0;n<125;n++){f.tick(1/60,true,{closing:90});}
  assert.equal(f.status().reason,'disengaged');assert.equal(f.ctx.input.fullStop,true);assert(f.ctx.ship.speed>0);
  const speed=f.ctx.ship.speed,terminal=f.status().combat;cue(f);f.tick();f.flight.update(1/60);
  assert(f.ctx.ship.speed<speed);assert.deepEqual(f.status().combat,terminal);
  for(let n=0;n<120;n++){f.tick();f.flight.update(1/60);}assert(f.ctx.ship.speed<1);
});
test('ordinary drift has bounded hold, cooldown and grant cancellation through real ship physics',()=>{
  const f=flightFixture();f.target.object.position.z=550;f.ctx.ship.velocity.set(0,0,-80);f.ctx.ship.speed=80;f.sample();
  f.start();cue(f);f.tick();assert.equal(f.ctx.input.driftHeld,true);f.flight.update(1/60);assert.equal(f.ctx.ship.driftActive,true);
  assert.equal(f.start().ok,true,'same grant may renew its own active drift');
  const original=f.ctx.ship.velocity.clone();for(let n=0;n<10;n++){f.tick();f.flight.update(1/60);}
  assert(f.ctx.ship.velocity.distanceTo(original)<1e-8,'ordinary vector hold preserves velocity');
  for(let n=0;n<20;n++){f.tick();f.flight.update(1/60);}assert.equal(f.ctx.input.driftHeld,false);assert.equal(f.ctx.ship.driftActive,false);
  assert(f.ctx.ship.driftReadyAt>f.ctx.world.time);
  f.act('clearControl');f.tick();f.flight.update(1/60);assert.equal(f.ctx.input.fullStop,true);
});
test('owned burner uses ordinary gates, bounded hold, renewal and cancellation without affecting human burns',()=>{
  const f=flightFixture();f.target.object.position.z=550;f.ctx.ship.velocity.set(0,0,-90);f.ctx.ship.speed=90;f.sample({closing:90});
  f.start({defense:'break-off'});cue(f);f.tick(1/60,true,{closing:90});assert.equal(f.ctx.input.agentBurnerHeld,true);
  f.flight.update(1/60);assert.equal(f.ctx.ship.burnerActive,true);const power=f.ctx.player.power;
  assert(power<100);assert.equal(f.start({defense:'break-off'}).ok,true);
  assert.equal(f.start({defense:'off'}).token,'helm','replacement cannot adopt existing active mode');
  f.act('clearControl');assert.equal(f.ctx.input.agentBurnerHeld,false);f.flight.update(1/60);
  assert.equal(f.ctx.ship.burnerActive,false);assert(f.ctx.ship.burnerReadyAt>f.ctx.world.time);
  const human=flightFixture();assert.equal(human.ctx.input.agentBurnerHeld,false);human.emit('keydown',{code:'Space',repeat:false});
  human.tick();human.flight.update(1/60);assert.equal(human.ctx.ship.burnerActive,true);
  human.emit('keyup',{code:'Space'});human.tick();human.flight.update(1/60);assert.equal(human.ctx.ship.burnerActive,true);
  const humanReadyAt=human.ctx.ship.burnerReadyAt;
  // Inject a stale ownership hold into an already human-origin burn. Neither
  // asserting nor releasing it may retroactively adopt or cancel that burn.
  for(const held of [true,false]) {
    human.ctx.input.agentBurnerHeld=held;human.flight.update(1/60);
    assert.equal(human.ctx.ship.burnerActive,true);assert.equal(human.ctx.ship.burnerReadyAt,humanReadyAt);
  }
  assert.equal(human.start().token,'helm');
  for(const gate of ['power','cooldown']) {
    const g=flightFixture();g.target.object.position.z=550;g.ctx.ship.velocity.set(0,0,-90);g.ctx.ship.speed=90;g.sample();
    if(gate==='power')g.ctx.player.power=0;else g.ctx.ship.burnerReadyAt=100;
    g.start({defense:'break-off'});cue(g);g.tick();g.flight.update(1/60);
    assert.equal(g.ctx.input.agentBurnerHeld,false);assert.equal(g.ctx.ship.burnerActive,false);
  }
});

test('terminal observation is deeply isolated and stale actions cannot mutate retained cue evidence',()=>{
  const f=fixture();f.start();cue(f);f.tick();f.act('clearControl');const original=f.status();
  const tampered=f.status();tampered.combat.defense.reason='tampered';tampered.combat.defense.latestCue.trigger='tampered';
  assert.deepEqual(f.status(),original);assert.equal(f.start({seq:1}).token,'stale');assert.deepEqual(f.status(),original);
  cue(f);f.tick();assert.deepEqual(f.status().combat,original.combat);
});
test('mode telemetry reports ordinary constraints and clears stale obstruction reason',()=>{
  const f=fixture();f.ctx.asteroids.list=[{id:0,position:new THREE.Vector3(50,0,0),radius:20}];f.start();cue(f);f.tick();
  assert.equal(f.status().combat.defense.modeBlocked,'obstructed');
  f.ctx.asteroids.list=[];f.tick();assert.equal(f.status().combat.defense.reason,'threat');
  assert.equal(f.status().combat.defense.maneuver,'strafe');assert.equal(f.status().combat.defense.modeBlocked,'alignment');
  const g=flightFixture();g.target.object.position.z=550;g.ctx.ship.velocity.set(0,0,-90);g.ctx.ship.speed=90;g.sample();
  g.ctx.player.engineOut=true;g.start();cue(g);g.tick();assert.equal(g.status().combat.movementBlocked,'engine');
  assert.equal(g.status().combat.defense.modeBlocked,'engine');assert.equal(g.ctx.input.agentBurnerHeld,false);
});
test('burner duration releases ownership, and newly obstructed boost corridor requests full stop',()=>{
  for(const obstacle of [false,true]) {
    const f=flightFixture();f.target.object.position.z=550;f.ctx.ship.velocity.set(0,0,-90);f.ctx.ship.speed=90;f.sample();
    f.start({defense:'break-off'});cue(f);f.tick();f.flight.update(1/60);assert.equal(f.ctx.ship.burnerActive,true);
    if(obstacle) f.ctx.asteroids.list=[{id:0,position:new THREE.Vector3(0,0,-400),radius:20}];
    for(let n=0;n<(obstacle?1:35);n++){f.tick();f.flight.update(1/60);}
    assert.equal(f.ctx.ship.burnerActive,false);assert.equal(f.ctx.input.agentBurnerHeld,false);
    if(obstacle){assert.equal(f.ctx.input.fullStop,true);assert.equal(f.status().combat.movementBlocked,'obstructed');}
    else assert.equal(f.status().combat.defense.modeBlocked,'cooldown');
  }
});
test('explicit retreat and break-off retain their separation timers under repeated hits',()=>{
  for(const intent of ['retreat','break-off']) {
    const f=fixture();f.target.object.position.z=500;f.sample({closing:5});f.start({intent});
    for(let n=0;n<(intent==='retreat'?310:130);n++){cue(f);f.tick(1/60,true,{closing:5});}
    assert.equal(f.status().reason,intent==='retreat'?'retreated':'disengaged');assert.equal(f.ctx.input.fullStop,true);
  }
});
test('manual raw lease and dead acquisition cannot obtain reactive authority',()=>{
  const f=fixture();f.act('setControl',{seq:1,ttl:5,steerX:.2});cue(f);f.tick();
  assert.equal(f.status().owner,'manual');assert.equal(f.ctx.input.strafeX,0);assert.equal(f.ctx.input.agentBurnerHeld,false);
  assert.equal(f.act('setControl',{seq:2,ttl:5,agentBurnerHeld:true}).token,'bad-args');
  const g=fixture();g.ctx.player.destroyed=true;cue(g);assert.equal(g.start().token,'dead');
});
console.log(`PASS ${checks} reactive-defense groups`);
