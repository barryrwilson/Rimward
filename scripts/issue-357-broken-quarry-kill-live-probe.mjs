/**
 * Issue #357 live verification — the broken bounty the lease actually finishes.
 * Disposable Chromium, loopback only.
 *
 * The #331 playtest shape on the real game: accept the offered bounty-ace row
 * at the Freehold dock, undock, spawn the named ace near the ship with the
 * real spawnLiveShip, lock it and grant an ENGAGE combat lease. The quarry is
 * stamped exactly as the playtest observed it: hull 1, NOT disabled, NOT
 * surrendered — so no state ending applies and only the kill converts. The
 * hull is held off the nose inside the documented cone, where the strict gate
 * reads fireBlocked 'alignment'; the fix's bounded dwell must arm fire instead
 * of stalling. Then the real combat.js witness shape (npcHit then destroyed +
 * npcDestroyed) attributes the kill, the lease ends target-destroyed, and the
 * accepted bounty pays its posted reward inside the delivery tick.
 *
 * Fixtures are disclosed: the ace is a freehold bank record instantiated near
 * the ship (spawnLiveShip), its AI is parked (intent off, hold waypoint) and
 * its position is clamped inside the envelope each beat so the probe measures
 * the lease's fire conversion, not a second dogfight; the finishing blow runs
 * the real destroyed path. Board, lease and settlement are read from the
 * running game.
 *
 * Run: npm run test:broken-quarry-kill-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE357_OUT || resolve('out/issue-357-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('broken-quarry-kill', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The bounty-ace row is accepted at the real Freehold board; the named ace is a freehold bank record instantiated near the ship with the real spawnLiveShip, AI parked and position clamped inside the envelope each beat (the probe measures the lease fire conversion, not a dogfight); the broken state is a hull stamp matching the #331 observation (hull 1, not disabled, not surrendered); the finishing blow runs the real combat.js witness shape.';

  const place = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);

  // ---- A. Dock at Freehold and accept the offered bounty-ace row.
  await place(); await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold');
  await act('openService', { id: 'jobs' });
  await sleep(400);
  const offered = await c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='bounty'&&j.id==='bounty-ace'&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target,reward:j.reward}));})()`);
  assert.ok(offered.length === 1, 'the ace bounty is posted: ' + JSON.stringify(offered));
  const accept = await act('acceptJob', { id: 'bounty-ace' });
  assert.ok(accept.ok, 'the ace bounty accepted: ' + JSON.stringify(accept));
  const bound = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.id==='bounty-ace');
    return j?{id:j.id,kind:j.kind,target:j.target,state:j.state,reward:j.reward}:null;})()`);
  assert.ok(bound && bound.state === 'accepted', 'the accepted row binds: ' + JSON.stringify(bound));
  result.bound = bound;
  await checkpoint('01-accepted-bounty');

  // ---- B. Undock, spawn the named ace near the ship, lock it, engage.
  for (let i = 0; i < 30; i++) {
    const r = await act('undock', {}, false);
    if (r.ok) break;
    if (r.token !== 'blocked') throw Error('undock refused ' + JSON.stringify(r));
    await sleep(750);
  }
  await wait((s) => !s.flags.docked, 15, 'undock at freehold');
  const spawnRes = await c.eval(`(async () => {
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    const x=window.__ctx;
    const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];
    const rec=banks.find(r=>r&&r.name===${JSON.stringify(bound.target)});
    if(!rec)return 'no-record';
    if(x.ships.some(s=>s.record&&s.record.id===rec.id))return 'already-live';
    await primeShipAsset(rec.faction, rec.classKey, rec.role);
    const p=x.ship.object.position;
    const live=spawnLiveShip(x,rec,{x:p.x+180,y:p.y,z:p.z-40});
    if(live&&!x.ships.includes(live))x.ships.push(live);
    if(live){
      live.ai.playerRolled=true;live.ai.playerInterested=false;
      live.ai.target=null;live.ai.intent=false;live.ai.mode='loiter';
      live.ai.waypoints=[live.object.position.clone()];
      // The observed broken quarry: hull 1, NOT disabled, NOT surrendered.
      live.state.hull=1;live.state.disabled=false;live.state.surrendered=false;
    }
    return live?('id:'+live.id):'spawn-refused';})()`);
  assert.ok(spawnRes === 'already-live' || spawnRes.startsWith('id:'), 'the named ace flies: ' + spawnRes);
  const spawnRet = spawnRes.startsWith('id:') ? spawnRes.slice(3) : null;
  const aceId = spawnRet ?? await c.eval(`(x.ships.find(s=>s.record&&s.record.name===${JSON.stringify(bound.target)})||{}).id??null`);
  assert.ok(aceId, 'the ace hull id is known: ' + JSON.stringify({ spawnRes, aceId }));
  result.aceId = aceId;
  const lock = await act('selectTarget', { id: aceId });
  assert.ok(lock.ok, 'the ace locked by name: ' + JSON.stringify(lock));
  await sleep(600); // one rendered HUD frame feeds the aim digest the lease reads
  const intent = await act('setCombatIntent', { seq: 1, ttl: 30, targetId: aceId, intent: 'engage' });
  assert.ok(intent.ok, 'the engage lease grants on the broken non-surrendered quarry: ' + JSON.stringify(intent));
  result.leaseGrant = intent;

  // ---- C. Hold the quarry off the nose inside the envelope; the dwell must arm fire.
  let armed = null; let longest = 0; let run = 0; let lastBlocked = null;
  const holdBeat = async () => {
    await c.eval(`(()=>{const x=window.__ctx,t=x.targets.current;
      if(!t||!t.object)return 'no-lock';
      // Clamp the quarry to a ~260 u standoff off the starboard bow.
      const q=x.ship.object.quaternion,off=new (Object.getPrototypeOf(q).constructor)();
      const p=x.ship.object.position;
      const side=[Math.cos(0.5),0,-Math.sin(0.5)];
      const dir=new (Object.getPrototypeOf(p).constructor)(side[0],side[1],side[2]).applyQuaternion(q);
      t.object.position.copy(p).addScaledVector(dir,260);
      t.object.position.y=p.y+30;
      if(t.ai){t.ai.intent=false;t.ai.target=null;}
      if(t.state){t.state.hull=Math.max(1,t.state.hull);t.state.disabled=false;t.state.surrendered=false;}
      return 'held';})()`);
  };
  for (let i = 0; i < 60 && armed === null; i++) { // up to ~30 s
    await holdBeat();
    await sleep(500);
    // renew the lease before its ttl runs out
    if (i % 20 === 19) await act('setCombatIntent', { seq: i + 10, ttl: 30, targetId: aceId, intent: 'engage' });
    const s = await observe();
    const fb = s.control.combat?.fireBlocked ?? null;
    if (fb === 'alignment') { run++; longest = Math.max(longest, run); } else run = 0;
    lastBlocked = fb;
    if (s.control.fire === true) armed = i * 0.5;
  }
  result.dwell = { armedAtS: armed, longestAlignmentStretchS: longest * 0.5, lastBlocked };
  assert.ok(armed !== null, 'fire arms under the persistent alignment block: ' + JSON.stringify(result.dwell));
  assert.ok(longest * 0.5 <= 12, 'the alignment stretch stays bounded: ' + longest * 0.5 + ' s');
  await checkpoint('02-fire-armed');

  // ---- D. The finishing blow: the real combat.js witness shape.
  const before = await c.eval(`(()=>{const x=window.__ctx;
    return { credits:x.world.credits, target:x.world.reputation?.freehold??0 };})()`);
  const finished = await c.eval(`(()=>{const x=window.__ctx;const t=x.targets.current;
    if(!t||!t.state)return 'no-lock';
    x.emit('npcHit',{ship:t,damage:t.state.hull,attackerId:'player'});
    t.state.destroyed=true;x.emit('npcDestroyed',{ship:t});
    return 'fired';})()`);
  assert.equal(finished, 'fired', 'the finishing blow fired');
  await sleep(1200);
  const leaseAfter = await observe();
  result.leaseTerminal = { owner: leaseAfter.control.owner, reason: leaseAfter.control.reason };
  assert.equal(leaseAfter.control.owner, 'none', 'the lease released after the kill');
  assert.equal(leaseAfter.control.reason, 'target-destroyed', 'the lease ends target-destroyed: '
    + JSON.stringify(result.leaseTerminal));

  // ---- E. The accepted bounty pays its posted reward.
  let paid = false; let paidState = null;
  for (let i = 0; i < 30 && !paid; i++) {
    await sleep(500);
    paidState = await c.eval(`(()=>{const x=window.__ctx;
      const j=(x.world.jobs??[]).find(j=>j&&j.id==='bounty-ace');
      return { credits:x.world.credits, state:j?j.state:'gone' };})()`);
    paid = paidState.state !== 'accepted'
      && paidState.credits >= before.credits + (bound.reward ?? 0)
      && (bound.reward ?? 0) > 0;
  }
  result.paid = paidState;
  assert.ok(paid, 'the bounty paid its posted reward inside the delivery tick: '
    + JSON.stringify({ before, paid: paidState, reward: bound.reward }));
  await checkpoint('03-bounty-paid');
}).then(() => console.log('issue-357 live: PASS'))
.catch((e) => { console.log('issue-357 live: FAIL', e && e.message); process.exitCode = 1; });
