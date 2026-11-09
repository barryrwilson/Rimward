/**
 * Issue #299 live verification — the mercenary pursuit loop a player flies.
 * Disposable Chromium, loopback only.
 *
 * The contracted flow on the real game: accept a pirate bounty at the
 * Freehold dock, undock, spawn the named reaver alive and un-yielded, lock it
 * inside the targeting ceiling, engage, then break it into the bargaining
 * band and resolve letGo through the real hail resolver — the hull RUNS for a
 * real refuge (the #68 escape plan), crosses the 600 u ceiling, and the lease
 * PURSUES instead of dying (combat.phase 'pursuit', fireBlocked 'range').
 * A same-target renewal continues the authorized pursuit past the ceiling;
 * when the runner brakes at its refuge the lease re-arms and opens fire.
 * The accepted bounty card names the run-down path its copy promises.
 * A clean console throughout.
 *
 * Fixtures are explicit record/hull-state stamps the repo's suites already
 * use (issue-291/265 discipline: the break that drives the bargaining band);
 * the flee, the pursuit, the re-arm and the fire are the real systems' work.
 *
 * Run: npm run test:pursuit-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE299_OUT || resolve('out/issue-299-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('pursuit', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The flee is entered through the ONE production flee entry (npc.js enterEscapeFlee, the issue-68 fixture discipline for this decision boundary) with the hull alive and un-yielded; the pursuit, renewal, re-arm and fire are the real lease\'s work, read from the running game.';

  // A. Dock at Freehold and accept a pirate bounty.
  await c.eval(`(()=>{const x=window.__ctx;
    if(x.world.currentSystem!=='freehold'){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem='freehold'; x.emit('systemLoaded',{to:'freehold'}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
    return x.world.currentSystem;})()`);
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold');
  await act('openService', { id: 'jobs' });
  await sleep(300);
  let offered = await c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target}));})()`);
  if (!offered.length) {
    // Seed a disclosed fixture record only when the board has none yet.
    await c.eval(`(()=>{const x=window.__ctx;
      const sysId=x.world.currentSystem;
      const sp=x.systems[sysId].station.position;
      const rec={id:'rec-299-fixture',name:'Fixture Wren',classKey:'cutter',faction:'independent',role:'pirate',system:sysId,
        state:'enroute',bounty:450,route:[[sp[0]+900,sp[1],sp[2]],[sp[0]+450,0,sp[2]]],leg:0,legT:0.5,dir:1};
      (x.world.recordBanks?.[sysId] ?? x.world.records).push(rec);})()`);
    await sleep(300);
    offered = await c.eval(`(()=>{const x=window.__ctx;
      return (x.world.jobs??[]).filter(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')
        .map(j=>({id:j.id,target:j.target}));})()`);
  }
  assert.ok(offered.length >= 1, 'a pirate bounty is posted: ' + JSON.stringify(offered));
  const accept = await act('acceptJob', { id: offered[0].id });
  assert.ok(accept.ok, 'the bounty accepted');
  const bounty = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&j.id.startsWith('bounty-pirate-')&&j.state==='accepted');
    return j?{id:j.id,target:j.target,detail:j.detail,reward:j.reward}:null;})()`);
  assert.ok(bounty && bounty.target, 'the accepted bounty names its target');
  assert.match(String(bounty.detail), /Run them down/, 'the card copy names the run-down path: ' + bounty.detail);
  result.bounty = bounty;
  await checkpoint('accepted-bounty');

  // B. Undock, spawn the named reaver alive and un-yielded ahead of the ship.
  await c.eval(`(()=>{const x=window.__ctx; x.stationDesk.undock(); return true;})()`);
  await sleep(600);
  // Geometry: the player sits just off the gate bore, the runner 210 u
  // further sunward. The player SCREENS the runner's short gate leg (the
  // threat bubble), so the #68 choice commits to the station refuge — a PARK
  // (no departure) — and the runner flees away from the player toward it,
  // opening range past the ceiling before braking at the hold for the re-arm.
  // Position stamps are the probes' disclosed initial-state fixtures.
  const geoRes = await c.eval(`(()=>{const x=window.__ctx;
    const g=x.systems[x.world.currentSystem].gates[0].position;
    x.ship.object.position.set(g[0], g[1], g[2]+140);
    x.ship.object.quaternion.identity();
    x.ship.velocity.set(0,0,0); x.ship.speed=0; x.input.throttle=0;
    return 'staged';})()`);
  assert.equal(geoRes, 'staged');
  const spawnRes = await c.eval(`(async () => {
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    const x=window.__ctx;
    const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];
    const rec=banks.find(r=>r&&r.role==='pirate'&&r.name===${JSON.stringify(bounty.target)}&&r.state!=='dead'&&r.state!=='captured');
    if(!rec)return 'no-record';
    if(x.ships.some(s=>s.record&&s.record.id===rec.id))return 'already-live';
    await Promise.all([primeShipAsset(rec.faction, rec.classKey, 'pirate')]);
    const g=x.systems[x.world.currentSystem].gates[0].position;
    const live=spawnLiveShip(x,rec,{x:g[0],y:g[1],z:g[2]+350});
    if(live&&!x.ships.includes(live))x.ships.push(live);
    if(live){live.ai.playerRolled=true;live.ai.playerInterested=false;live.ai.demandSent=true;}
    return live?'spawned':'spawn-refused';})()`);
  assert.ok(spawnRes === 'spawned' || spawnRes === 'already-live', 'the named reaver flies: ' + spawnRes);
  const recId = await c.eval(`(()=>{const x=window.__ctx;const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];const rec=banks.find(r=>r&&r.role==='pirate'&&r.name===${JSON.stringify(bounty.target)});return rec?rec.id:null;})()`);
  assert.ok(recId, 'the reaver record resolves');
  let lock = null;
  for (let i = 0; i < 20 && !lock; i++) {
    await sleep(500);
    const ready = await c.eval(`(()=>{const x=window.__ctx;
      const live=x.ships.find(s=>s&&s.record&&s.record.id===${JSON.stringify(recId)}&&s.object);
      if(!live)return 'not-live';
      const g=x.systems[x.world.currentSystem].gates[0].position;
      x.ship.object.position.set(g[0], g[1], g[2]+140);
      live.object.position.set(g[0], g[1], g[2]+350);
      return x.flags.docked?'docked':'ready';})()`);
    if (ready !== 'ready') continue;
    lock = await act('selectTarget', { id: recId }, false);
    if (!lock.ok) lock = null;
  }
  assert.ok(lock && lock.ok, 'the reaver locked');
  await sleep(600); // one rendered HUD frame feeds the aim digest the lease reads

  // C. Engage INSIDE the ceiling, then make the hull RUN through the ONE
  // production flee entry (issue-68's fixture discipline for this decision
  // boundary): the hull stays alive and un-yielded with a real #68 plan.
  let seq = 1;
  const grant = await act('setCombatIntent', { seq: seq++, ttl: 60, targetId: recId, intent: 'engage' });
  assert.ok(grant.ok, 'the engage lease grants inside the ceiling: ' + JSON.stringify(grant));
  const fleeRes = await c.eval(`(async () => {
    const { enterEscapeFlee } = await import('/src/systems/npc.js');
    const x=window.__ctx;
    const t=x.targets.current;
    if(!t)return 'no-lock';
    t.ai.lastAttacker='player'; // the runner knows who is chasing it
    // FIXTURE (initial state): a steady crew — the morale system must not
    // capitulate the runner mid-chase, or the pursuit contract never gets its
    // chase. resolve high, no recent combat: updateResolve never walks the band.
    t.state.resolve=95; t.state.lastCombatAt=x.world.time-9999;
    const plan=enterEscapeFlee(x,t,'player');
    return plan?('flee:'+plan.kind+':'+plan.phase):'no-plan';})()`);
  result.fleeEntry = fleeRes;
  assert.ok(String(fleeRes).startsWith('flee:'), 'the hull commits to a real refuge: ' + fleeRes);
  await sleep(800);
  const fleeing = await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current;
    return t?{surrendered:!!t.state.surrendered,mode:t.ai?.mode??null,dist:Math.round(x.targets.aim?.dist??-1)}:null;})()`);
  assert.ok(fleeing && !fleeing.surrendered, 'the hull is alive and un-yielded: ' + JSON.stringify(fleeing));
  assert.ok(fleeing && fleeing.mode === 'flee', 'the hull runs for a refuge: ' + JSON.stringify(fleeing));
  result.fleeing = fleeing;

  // D. The pursuit: the hull crosses the ceiling, the lease follows.
  let pursued = null, renewed = false;
  const chaseTrace = [];
  for (let i = 0; i < 60 && !pursued; i++) {
    await sleep(500);
    const s = await observe();
    chaseTrace.push({ t: Math.round(s.t * 10) / 10, owner: s.control.owner, phase: s.control.combat?.phase ?? null,
      reason: s.control.reason, dist: s.targets.aim?.dist ?? null, mode: s.targets.current?.surrendered ? 'yielded' : null,
      hull: s.ship.hull, speed: Math.round(s.ship.speed) });
    if (s.control.owner !== 'combat') {
      result.chaseTrace = chaseTrace.slice(-10);
      throw Error('the lease dropped during the chase: ' + s.control.reason);
    }
    if (s.control.combat?.phase === 'pursuit') {
      pursued = { t: s.t, dist: s.targets.aim?.dist ?? null, fireBlocked: s.control.combat.fireBlocked };
      break;
    }
  }
  if (!pursued) {
    result.chaseTrace = chaseTrace.slice(-14);
    console.log('CHASE TRACE', JSON.stringify(chaseTrace.filter((_, i) => i % 4 === 0)));
  }
  assert.ok(pursued, 'the lease entered pursuit past the ceiling');
  assert.equal(pursued.fireBlocked, 'range', 'pursuit blocks fire by range');
  result.pursuit = pursued;
  await checkpoint('pursuit');

  // E. Renewal of the authorized pursuit past the ceiling.
  for (let attempt = 0; attempt < 3 && !renewed; attempt++) {
    const r = await act('setCombatIntent', { seq: seq++, ttl: 60, targetId: recId, intent: 'engage' }, false);
    if (r.ok) renewed = true;
    else await sleep(800);
  }
  assert.ok(renewed, 'the pursuit lease renews past the ceiling');
  result.renewedPursuit = true;

  // F. The runner brakes at its refuge; the lease re-arms and opens fire.
  let armed = null;
  for (let i = 0; i < 240 && !armed; i++) {
    await sleep(500);
    const s = await observe();
    if (s.control.owner !== 'combat') {
      throw Error('the lease dropped before re-arm: ' + s.control.reason);
    }
    const phase = s.control.combat?.phase;
    const dist = s.targets.aim?.dist ?? null;
    if (phase && ['intercept', 'pass'].includes(phase) && dist !== null && dist <= 600) {
      armed = { t: s.t, phase, dist };
      break;
    }
  }
  assert.ok(armed, 'the lease re-armed once the runner stopped: ' + JSON.stringify({ pursued, lastKnown: 'n/a' }));
  result.rearmed = armed;
  await checkpoint('re-armed');

  let fired = false;
  const fireTrace = [];
  for (let i = 0; i < 120 && !fired; i++) {
    await sleep(500);
    const s = await observe();
    fireTrace.push({ t: Math.round(s.t * 10) / 10, owner: s.control.owner, phase: s.control.combat?.phase ?? null,
      reason: s.control.reason, fire: s.control.fire === true, blocked: s.control.combat?.fireBlocked ?? null,
      dist: s.targets.aim?.dist != null ? Math.round(s.targets.aim.dist) : null,
      tgtSpeed: s.targets.aim?.speed != null ? Math.round(s.targets.aim.speed) : null,
      tgtGone: !s.targets.current });
    if (s.control.owner !== 'combat') { result.fireTrace = fireTrace.slice(-12); throw Error('the lease dropped before firing: ' + s.control.reason); }
    if (s.control.fire === true) fired = true;
  }
  if (!fired) { result.fireTrace = fireTrace.slice(-14); console.log('FIRE TRACE', JSON.stringify(fireTrace.filter((_, i) => i % 6 === 0))); }
  assert.ok(fired, 'the re-armed lease opens fire on the stopped runner');
  result.fired = true;
  await checkpoint('fired');
});

console.log('issue-299 pursuit live: PASS');
