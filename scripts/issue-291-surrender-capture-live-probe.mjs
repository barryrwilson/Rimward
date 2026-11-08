/**
 * Issue #291 live verification — the mercenary capture loop a player flies.
 * Disposable Chromium, loopback only.
 *
 * The contracted flow on the real game: accept a pirate bounty at the
 * Freehold dock, spawn the named reaver, break it with the player's own guns
 * (the real combat witness shape), take the yield through the real hail
 * resolver, then take the SURRENDER with the hail key (the capture
 * conversion), and read the aftermath: the record settles 'captured', no
 * destroyed incident, no fear spike, and the bounty pays on the next
 * delivery tick — "confirmation of the kill or capture", now true to its
 * own card. A clean console throughout.
 *
 * Fixtures are explicit record-state flips and disclosed hull-state stamps
 * (the break and the willingness are combat results); the capture runs the
 * real KeyH edge, the record flip runs the real npcSurrendered path, and the
 * board, bracket, fear and credits are read from the running game.
 *
 * Run: npm run test:surrender-capture-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE291_OUT || resolve('out/issue-291-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('surrender-capture', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The break and the willingness are disclosed hull-state stamps (combat results the resolver leaves); the capture runs the real KeyH edge and the real npcSurrendered path, and the board, bracket, fear and credits are read from the running game.';

  // A. Dock at Freehold and accept the first pirate bounty.
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
  const offered = await c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target}));})()`);
  assert.ok(offered.length >= 1, 'a pirate bounty is posted: ' + JSON.stringify(offered));
  const accept = await act('acceptJob', { id: offered[0].id });
  assert.ok(accept.ok, 'the bounty accepted');
  const bounty = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&j.id.startsWith('bounty-pirate-')&&j.state==='accepted');
    return j?{id:j.id,target:j.target,reward:j.reward}:null;})()`);
  assert.ok(bounty && bounty.target, 'the accepted bounty names its target: ' + JSON.stringify(bounty));
  result.bounty = bounty;
  await checkpoint('accepted-bounty');

  // B. Undock, spawn the named reaver, break it as the player, yield it.
  await c.eval(`(()=>{const x=window.__ctx; x.stationDesk.undock(); return true;})()`);
  await sleep(600);
  const spawnRes = await c.eval(`(async () => {
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    const x=window.__ctx;
    const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];
    const rec=banks.find(r=>r&&r.role==='pirate'&&r.name===${JSON.stringify(bounty.target)}&&r.state!=='dead'&&r.state!=='captured');
    if(!rec)return 'no-record';
    if(x.ships.some(s=>s.record&&s.record.id===rec.id))return 'already-live';
    await Promise.all([primeShipAsset(rec.faction, rec.classKey, 'pirate')]);
    const p=x.ship.object.position;
    const live=spawnLiveShip(x,rec,{x:p.x+140,y:p.y,z:p.z});
    if(live&&!x.ships.includes(live))x.ships.push(live);
    if(live){live.ai.playerRolled=true;live.ai.playerInterested=false;}
    return live?'spawned':'spawn-refused';})()`);
  assert.ok(spawnRes === 'spawned' || spawnRes === 'already-live', 'the named reaver flies: ' + spawnRes);
  const recId = await c.eval(`(()=>{const x=window.__ctx;const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];const rec=banks.find(r=>r&&r.role==='pirate'&&r.name===${JSON.stringify(bounty.target)});return rec?rec.id:null;})()`);
  assert.ok(recId, 'the reaver record resolves: ' + bounty.target);
  // The hull must be live, in cycle range and past the launch clearance before
  // the lock; poll rather than sleep so the pad handoff never races the probe.
  let lock = null;
  for (let i = 0; i < 20 && !lock; i++) {
    await sleep(500);
    const ready = await c.eval(`(()=>{const x=window.__ctx;
      const live=x.ships.find(s=>s&&s.record&&s.record.id===${JSON.stringify(recId)}&&s.object);
      if(!live)return 'not-live';
      const p=x.ship.object.position;
      live.object.position.set(p.x+140,p.y,p.z);
      return x.flags.docked?'docked':'ready';})()`);
    if (ready !== 'ready') continue;
    lock = await act('selectTarget', { id: recId }, false);
    if (!lock.ok) lock = null;
  }
  assert.ok(lock && lock.ok, 'the reaver locked');
  await sleep(600);
  // The break: the real combat witness shape (npcHit lands, engines go), then
  // the willingness through the real resolver — the #98/#99 yield path. The
  // lease is flown for real when it grants; the stamped break is the fixture.
  const intent = await act('setCombatIntent', { seq: 1, ttl: 20, targetId: recId, intent: 'disable' }, false);
  result.lease = intent;
  await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.state)return 'no-lock';
    t.state.hull=Math.max(1,t.state.hullMax*0.2); t.state.disabled=true; x.emit('npcDisabled',{ship:t});
    return 'broken';})()`);
  await sleep(500);

  // C. The yield: the hull is willing and player-broken; the real resolver runs.
  const yieldRes = await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.state)return 'no-lock';
    t.state.disabled=false; // a yield keeps its crew flying; the disable was the break
    t.ai.lastAttacker='player';
    x.emit('hailOpened',{ship:t,intents:t.state.cargo&&t.state.cargo.length?['demandCargo','demandRansom','letGo','keepFiring']:['demandRansom','letGo','keepFiring']});
    return 'opened';})()`);
  await sleep(400);
  const peek1 = await c.eval('window.__ctx.hailApi.peek()');
  result.yieldCard = peek1;
  const resolved = await c.eval(`(()=>{const x=window.__ctx;
    const p=x.hailApi.peek();
    if(!p.open)return 'no-card';
    const verb=p.intents.includes('demandCargo')?'demandCargo':p.intents[0];
    return verb+':'+x.hailApi.resolve(verb);})()`);
  result.yieldResolve = resolved;
  await sleep(400);
  const yielded = await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; return t&&t.state?{surrendered:!!t.state.surrendered,bracket:null}:null;})()`);
  assert.ok(yielded && yielded.surrendered, 'the reaver yielded: ' + JSON.stringify({ resolved, yielded }));
  await checkpoint('yielded');

  // D. The capture: park the hull in hail range, press the hail key.
  await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.object)return 'no-lock';
    const p=x.ship.object.position;
    t.object.position.set(p.x+60,p.y,p.z);
    return 'parked';})()`);
  await sleep(300);
  const fearBefore = await c.eval('window.__ctx.world.fear');
  const creditsBefore = await c.eval('window.__ctx.world.credits');
  await act('hail'); // the real edge pulse: agent pulse -> controls -> pendingHail
  await sleep(1200);
  const after = await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current;
    const rec=(x.world.recordBanks?.freehold??[]).find(r=>r&&r.name===${JSON.stringify(bounty.target)}) ?? (x.world.records??[]).find(r=>r&&r.name===${JSON.stringify(bounty.target)});
    const incs=(x.world.incidents??[]).filter(i=>i&&i.name===${JSON.stringify(bounty.target)});
    return {
      recState: rec?rec.state:null,
      lockGone: !t,
      destroyedIncident: (x.world.incidents??[]).some(i=>i&&i.kind==='destroyed'&&i.name===${JSON.stringify(bounty.target)}),
      lastIncident: incs.length?incs[incs.length-1]:null,
      fear: x.world.fear,
      credits: x.world.credits,
    };})()`);
  result.afterCapture = after;
  assert.equal(after.lastIncident && after.lastIncident.outcome, 'captured', 'the capture incident flew: ' + JSON.stringify(after.lastIncident));
  assert.equal(after.lastIncident && after.lastIncident.causer, 'player', 'the capture is player-caused');
  assert.equal(after.recState, 'captured', 'the record settles captured');
  assert.equal(after.destroyedIncident, false, 'no destroyed incident: capture is not a kill');
  assert.ok(after.fear <= fearBefore + 2, 'no fear spike beyond the yield: ' + fearBefore + ' -> ' + after.fear);
  await checkpoint('captured');

  // E. The bounty pays on the kill-or-capture terms.
  let paid = false;
  let paidState = null;
  for (let i = 0; i < 30 && !paid; i++) {
    await sleep(500);
    paidState = await c.eval(`(()=>{const x=window.__ctx;
      const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bounty.id)});
      return { credits:x.world.credits, state:j?j.state:'gone' };})()`);
    paid = paidState.state !== 'accepted' && paidState.credits > creditsBefore;
  }
  assert.ok(paid, 'the captured bounty paid within the delivery tick: ' + JSON.stringify({ creditsBefore, after: paidState }));
  assert.equal(paidState.state, 'done', 'the accepted row completes done');
  await checkpoint('bounty-paid');
});

console.log('issue-291 live: PASS');