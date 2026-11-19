/**
 * Issue #325 live verification — the war strike a player actually flies.
 * Disposable Chromium, loopback only.
 *
 * The #250 playtest shape on the real game: load the war dest bank, accept a
 * real offered war row at the Freehold dock, spawn its bound dest-faction
 * patrol (the disclosed fixture: that patrol flies into Freehold space), lock
 * it and grant an ENGAGE combat lease. Stamp the break the guns land (hull
 * low, disabled, npcDisabled) and prove the lease keeps firing through it
 * instead of ending target-disabled. Then run the real combat.js witness shape
 * (npcHit then destroyed + npcDestroyed) so world.js attributes the kill to
 * the player, and read the aftermath: the lease ends target-destroyed, the
 * record is dead, no feral rage, no killedSurrendered fear spike, and the
 * accepted war contract pays its quoted strike inside the delivery tick.
 *
 * Fixtures are disclosed: the dest bank is loaded through the systemLoaded
 * event contract, the bound patrol is instantiated near the ship by the real
 * spawnLiveShip (it is a dest-bank record, not the current system's traffic),
 * and the break is a hull-state stamp. The finishing blow runs the real
 * destroyed path; the board, lease, fear, bio mood and standing are read from
 * the running game. Kill-standing's existing -5 for a player-broken patrol may
 * stack on the war settlement's own -2; the settlement's -2 is read from the
 * strike confirmation line and the standing bag is reported exactly.
 *
 * Run: npm run test:war-quarry-overkill-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE325_OUT || resolve('out/issue-325-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('war-quarry-overkill', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The war dest bank is loaded through the systemLoaded event contract (disclosed harness staging, not a natural jump); the bound patrol is a dest-bank record instantiated near the ship with the real spawnLiveShip (the disclosed dest-faction patrol flying into Freehold space); the break is a hull-state stamp (hull low, disabled, npcDisabled) and the finishing blow runs the real combat.js witness shape (npcHit then destroyed + npcDestroyed). Kill-standing may add its existing -5 on a player-broken patrol; the war settlement pay and employer/target writes are read from the running game.';

  const place = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);

  // ---- A. Load the war dest bank, then the Freehold origin bank.
  const dest = await c.eval(`(()=>{const x=window.__ctx,f=x.systems.freehold.faction;
    const d=(x.systems.freehold.gates??[]).find(g=>g&&g.to&&g.to!=='freehold'&&x.systems[g.to]&&x.systems[g.to].station&&x.systems[g.to].faction&&x.systems[g.to].faction!==f);
    return d?d.to:null;})()`);
  assert.ok(dest, 'freehold has a war dest bind');
  result.warDest = dest;
  await c.eval(`(()=>{const x=window.__ctx;if(x.flags.docked)x.stationDesk.undock();x.world.currentSystem=${JSON.stringify(dest)};x.emit('systemLoaded',{to:${JSON.stringify(dest)}});return true;})()`);
  await wait((s) => s.world.currentSystem === dest, 15, 'dest bank load');
  await sleep(800);
  await c.eval(`(()=>{const x=window.__ctx;x.world.currentSystem='freehold';x.emit('systemLoaded',{to:'freehold'});return true;})()`);
  await wait((s) => s.world.currentSystem === 'freehold', 15, 'origin bank load');
  await sleep(800);
  const banks = await c.eval('Object.keys(window.__ctx.world.recordBanks??{})');
  result.recordBanks = banks;
  assert.ok(banks.includes(dest), 'the war dest bank exists: ' + JSON.stringify(banks));

  // ---- B. Dock at Freehold and accept a real offered war row.
  await place(); await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold');
  await act('openService', { id: 'jobs' });
  await sleep(400);
  const offered = await c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='war'&&j.originSystem==='freehold'&&j.state==='offered')
      .map(j=>({id:j.id,recordId:j.recordId,target:j.target,title:j.title}));})()`);
  assert.ok(offered.length >= 1, 'a war row is posted: ' + JSON.stringify(offered));
  const accept = await act('acceptJob', { id: offered[0].id });
  assert.ok(accept.ok, 'the war row accepted: ' + JSON.stringify(accept));
  const bound = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.kind==='war'&&j.state==='accepted');
    return j?{id:j.id,recordId:j.recordId,target:j.target,title:j.title,payQuoted:j.payQuoted,slot:j.slot,originSystem:j.originSystem}:null;})()`);
  assert.ok(bound && bound.recordId, 'the accepted war row binds a record: ' + JSON.stringify(bound));
  assert.ok(Number.isFinite(bound.payQuoted) && bound.payQuoted > 0, 'the agreement stamps payQuoted: ' + bound.payQuoted);
  result.bound = bound;
  await checkpoint('01-accepted-war');

  // ---- C. Undock, spawn the bound patrol near the ship, lock it, engage.
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
    const banks=[...(x.world.recordBanks?.[${JSON.stringify(dest)}]??[]),...(x.world.records??[])];
    const rec=banks.find(r=>r&&r.id===${JSON.stringify(bound.recordId)});
    if(!rec)return 'no-record';
    if(x.ships.some(s=>s.record&&s.record.id===rec.id))return 'already-live';
    await primeShipAsset(rec.faction, rec.classKey, rec.role);
    const p=x.ship.object.position;
    const live=spawnLiveShip(x,rec,{x:p.x+140,y:p.y,z:p.z});
    if(live&&!x.ships.includes(live))x.ships.push(live);
    if(live){live.ai.playerRolled=true;live.ai.playerInterested=false;}
    return live?'spawned':'spawn-refused';})()`);
  assert.ok(spawnRes === 'spawned' || spawnRes === 'already-live', 'the bound patrol flies: ' + spawnRes);
  const lock = await act('selectTarget', { id: bound.recordId });
  assert.ok(lock.ok, 'the bound patrol locked: ' + JSON.stringify(lock));
  await sleep(600); // one rendered HUD frame feeds the aim digest the lease reads
  const intent = await act('setCombatIntent', { seq: 1, ttl: 30, targetId: bound.recordId, intent: 'engage' });
  assert.ok(intent.ok, 'the engage lease grants: ' + JSON.stringify(intent));
  result.leaseGrant = intent;

  // ---- D. Stamp the break the guns land; the lease must keep firing.
  const broke = await c.eval(`(()=>{const x=window.__ctx;const t=x.targets.current;
    if(!t||!t.state)return 'no-lock';
    t.state.hull=Math.max(1,t.state.hullMax*0.15);t.state.disabled=true;x.emit('npcDisabled',{ship:t});
    return 'broken';})()`);
  assert.equal(broke, 'broken', 'the break is stamped on the locked hull');
  await sleep(600);
  const throughBreak = await observe();
  result.throughBreak = { owner: throughBreak.control.owner, state: throughBreak.control.state,
    reason: throughBreak.control.reason, fireBlocked: throughBreak.control.combat?.fireBlocked ?? null,
    fire: throughBreak.control.fire === true, hull: throughBreak.targets.current?.hull ?? null };
  assert.equal(throughBreak.control.owner, 'combat', 'the lease stays owner combat through the break: '
    + JSON.stringify(result.throughBreak));
  assert.equal(throughBreak.control.state, 'active', 'the lease stays active through the break');
  assert.equal(throughBreak.control.reason, '', 'no terminal reason at the break');
  assert.notEqual(throughBreak.control.combat?.fireBlocked, 'target-disabled', 'fire is not blocked by the break');
  await checkpoint('02-through-break');

  // ---- E. The finishing blow: the real combat.js witness shape.
  const fearBefore = await c.eval('window.__ctx.world.fear');
  const moodBefore = await c.eval('window.__ctx.bio.mood');
  const before = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bound.id)});
    return { credits:x.world.credits, fear:x.world.fear,
      employer:x.world.reputation?.[x.systems.freehold.faction]??0,
      target:x.world.reputation?.[x.systems[${JSON.stringify(dest)}].faction]??0,
      payQuoted:j?j.payQuoted:null };})()`);
  result.before = before;
  const finished = await c.eval(`(()=>{const x=window.__ctx;const t=x.targets.current;
    if(!t||!t.state)return 'no-lock';
    x.emit('npcHit',{ship:t,damage:t.state.hull});
    t.state.destroyed=true;x.emit('npcDestroyed',{ship:t});
    return 'fired';})()`);
  assert.equal(finished, 'fired', 'the finishing blow fired');
  result.finish = finished;
  await sleep(1200);
  const leaseAfter = await observe();
  result.leaseTerminal = { owner: leaseAfter.control.owner, state: leaseAfter.control.state,
    reason: leaseAfter.control.reason };
  assert.equal(leaseAfter.control.owner, 'none', 'the lease released after the kill');
  assert.equal(leaseAfter.control.reason, 'target-destroyed', 'the lease ends target-destroyed: '
    + JSON.stringify(result.leaseTerminal));

  // ---- F. Aftermath: lawful kill and the war settlement.
  const after = await c.eval(`(()=>{const x=window.__ctx;return {
    fear:x.world.fear, mood:x.bio.mood,
    record:(x.world.recordBanks?.[${JSON.stringify(dest)}]??[]).find(r=>r&&r.id===${JSON.stringify(bound.recordId)})?.state??null,
    recordName:(x.world.recordBanks?.[${JSON.stringify(dest)}]??[]).find(r=>r&&r.id===${JSON.stringify(bound.recordId)})?.name??null,
    incidents:(x.world.incidents??[]).filter(i=>i&&i.kind==='destroyed'&&i.name===${JSON.stringify(bound.target)}).map(i=>({causer:i.causer})),
    credits:x.world.credits,
    employer:x.world.reputation?.[x.systems.freehold.faction]??0,
    target:x.world.reputation?.[x.systems[${JSON.stringify(dest)}].faction]??0 };})()`);
  result.aftermath = after;
  assert.notEqual(after.mood, 'feral', 'the companion does not rage at the bound contract kill');
  assert.ok(after.fear <= fearBefore + 2, 'no killedSurrendered spike (capitulation +2 at most): '
    + fearBefore + ' -> ' + after.fear);
  assert.equal(after.record, 'dead', 'the bound patrol record settles dead');
  assert.ok(after.incidents.some((i) => i.causer === 'player'), 'a player-caused destroyed incident is recorded: '
    + JSON.stringify(after.incidents));

  // The accepted war row pays payQuoted, employer +2, target -2 (the settlement
  // write; kill-standing's existing -5 may stack, so the target delta is read
  // exactly and asserted at least the settlement's -2).
  let paid = false;
  let paidState = null;
  for (let i = 0; i < 30 && !paid; i++) {
    await sleep(500);
    paidState = await c.eval(`(()=>{const x=window.__ctx;
      const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bound.id)});
      return { credits:x.world.credits, state:j?j.state:'gone',
        employer:x.world.reputation?.[x.systems.freehold.faction]??0,
        target:x.world.reputation?.[x.systems[${JSON.stringify(dest)}].faction]??0 };})()`);
    paid = paidState.state !== 'accepted'
      && paidState.credits >= before.credits + (before.payQuoted ?? 0)
      && (before.payQuoted ?? 0) > 0
      && paidState.employer >= before.employer + 2
      && paidState.target <= before.target - 2;
  }
  result.paid = paidState;
  assert.ok(paid, 'the strike paid payQuoted, employer +2, target at least -2 within the delivery tick: '
    + JSON.stringify({ before, paid: paidState }));
  assert.equal(paidState.credits, before.credits + before.payQuoted, 'credits rise by exactly payQuoted');
  assert.equal(paidState.employer, before.employer + 2, 'employer standing +2');
  assert.ok(paidState.target <= before.target - 2, 'target standing takes the settlement -2 (kill-standing may stack): '
    + before.target + ' -> ' + paidState.target);
  assert.notEqual(paidState.state, 'accepted', 'the accepted row left the board');
  await checkpoint('03-war-paid');
});

console.log('issue-325 live: PASS');
