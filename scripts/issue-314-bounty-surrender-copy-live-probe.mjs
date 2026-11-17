/**
 * Issue #314 live verification — pirate-bounty surrender card copy.
 * Disposable Chromium, loopback only.
 *
 * The contracted flow on the real game: dock at Freehold, accept two offered
 * pirate bounties, then fly each quarry's live hull. The break and the
 * willingness are disclosed hull-state stamps (combat results the resolver
 * leaves); the surrender card is opened by the real hailOpened path and every
 * verb runs the real hailApi resolver.
 *
 * Target A: a surrender card on an accepted bounty quarry must carry the exact
 * Compact-claim note and bounty-aware verb labels; demandRansom pays the
 * ransom, and the bounty row must stay accepted with progress 0 across a real
 * delivery tick (a ransom leaves the claim open).
 *
 * Target B: the same card, then demandCargo empties the hold and yields the
 * hull. A real hail edge on the yielded hull takes the surrender: a
 * player-caused 'captured' incident, the record settles captured, and the
 * bounty pays done inside the delivery tick.
 *
 * Board: the rendered Jobs desk ace card detail states the Named Gun
 * exception ("only a kill closes this claim"; a surrender is never a capture),
 * while an ordinary pirate bounty card still says "kill or capture".
 *
 * Evidence (result.json + screenshots) is written under out/issue-314-live/.
 * The harness fails the run on any browser console error or exception.
 *
 * Run: npm run test:bounty-surrender-copy-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE314_OUT || resolve('out/issue-314-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const PIRATE_NOTE = 'Compact claim: a ransom, cargo demand, tribute or letting them go leaves the bounty open. Only a kill or a capture closes it — a capture takes a hail on the yielded hull (take its cargo to yield it first).';
const ACE_NOTE = "Named Gun bounty: only a kill closes it. A ransom, cargo demand, tribute or letting them go leaves the claim open — a Named Gun's surrender is not taken as a capture.";

const outcome = await runLive('bounty-surrender-copy', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Disclosed record/state stamps: the break (hull lowered, npcDisabled) and the willingness (resolve pinned to the bargaining band, ai.band matched, lastAttacker=player, lastCombatAt cleared) are combat results the resolver leaves; an empty seeded hold is stamped with 2 Provisions so the cargo-demand path exists. The surrender cards are opened by the real hailOpened path and every verb runs the real hailApi resolver; the two accepted pirate bounties are real board offers (any disclosed fixture record/row is named below).';

  // ---- helpers -------------------------------------------------------------
  const ctxEval = (expr) => c.eval(expr);
  const jobOf = (id) => ctxEval(`(()=>{const x=window.__ctx;const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(id)});return j?{id:j.id,target:j.target,reward:j.reward,state:j.state,progress:j.progress,need:j.need}:null;})()`);

  async function dockAtFreehold() {
    for (let i = 0; i < 25; i++) {
      await act('dock', {}, false);
      await sleep(400);
      const d = await ctxEval('window.__ctx.flags.docked');
      if (d === true) return;
    }
    throw new Error('dock refused: berth never took the ship');
  }
  async function undockFreehold() {
    for (let i = 0; i < 25; i++) {
      await act('undock', {}, false);
      await sleep(400);
      const d = await ctxEval('window.__ctx.flags.docked');
      if (d === false) return;
    }
    throw new Error('undock refused: berth still held');
  }
  async function parkOtherShips() {
    await ctxEval(`(()=>{const x=window.__ctx;const p=x.systems[x.world.currentSystem].station.position;
      for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
      return true;})()`);
  }

  // ---- A. Dock at Freehold, accept two pirate bounties ---------------------
  await ctxEval(`(()=>{const x=window.__ctx;
    if(x.world.currentSystem!=='freehold'){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem='freehold'; x.emit('systemLoaded',{to:'freehold'}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
    return x.world.currentSystem;})()`);
  await sleep(250);
  await dockAtFreehold();
  await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold');
  await act('openService', { id: 'jobs' });
  await sleep(400);

  let offered = await ctxEval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target,reward:j.reward}));})()`);
  if (offered.length < 2) {
    const before = offered.length;
    for (let k = before; k < 2; k++) {
      const fixture = await ctxEval(`(()=>{const x=window.__ctx;
        const n=${k}+1;
        const name='Fixture Reaver '+n;
        const recId='fixture-reaver-314-'+n;
        const jobId='bounty-pirate-fixture-reaver-'+n+'-314';
        if(!(x.world.records??[]).some(r=>r&&r.id===recId)){
          const rec={id:recId,name,classKey:'cutter',faction:'redledger',role:'pirate',system:'freehold',bounty:300,resolve:50,state:'enroute'};
          (x.world.records??=[]).push(rec);
          if(x.world.recordBanks?.freehold) x.world.recordBanks.freehold.push(rec);
        }
        if(!(x.world.jobs??[]).some(j=>j&&j.id===jobId)){
          x.world.jobs.push({id:jobId,kind:'bounty',target:name,system:'freehold',title:'Bounty: '+name,
            detail:name+' runs with a reaver crew and bleeds the lanes of Freehold Drift dry. The Compact pays on confirmation of the kill or capture — your guns, your name on the claim. Run them down: a fleeing hull leads somewhere real, and the fight waits where it stops.',
            reward:300,state:'offered',progress:0,need:1});
        }
        return {id:jobId,target:name,reward:300};})()`);
      offered = offered.concat([fixture]);
      result.fixtureNote += ' The seed posted fewer than two pirate bounties; one disclosed fixture pirate record and its board row ("' + fixture.target + '", 300 UU) were added to reach two.';
    }
    await ctxEval(`(()=>{window.__ctx.stationDesk.selectService('jobs');return true;})()`);
    await sleep(300);
  }
  assert.ok(offered.length >= 2, 'two pirate bounties are offered: ' + JSON.stringify(offered));
  const picks = offered.slice(0, 2);
  const accepted = [];
  for (const pick of picks) {
    const r = await act('acceptJob', { id: pick.id });
    assert.ok(r.ok, 'the bounty accepted: ' + pick.id + ' ' + JSON.stringify(r));
    accepted.push(pick);
  }
  await sleep(300);
  const rows = [];
  for (const pick of accepted) rows.push(await jobOf(pick.id));
  for (const row of rows) {
    assert.ok(row, 'accepted row exists: ' + JSON.stringify(row));
    assert.equal(row.state, 'accepted', 'row is accepted: ' + JSON.stringify(row));
    assert.equal(row.progress, 0, 'row starts at progress 0');
    assert.ok(row.target && typeof row.target === 'string', 'row names its quarry');
  }
  const [bountyA, bountyB] = rows;
  result.bounties = rows;
  await checkpoint('accepted-bounties');

  // ---- shared quarry flight ------------------------------------------------
  async function spawnQuarry(target) {
    const res = await ctxEval(`(async () => {
      const { spawnLiveShip } = await import('/src/systems/npc.js');
      const { primeShipAsset } = await import('/src/systems/ship-assets.js');
      const x=window.__ctx;
      const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];
      const rec=banks.find(r=>r&&r.role==='pirate'&&r.name===${JSON.stringify(target)}&&r.state!=='dead'&&r.state!=='captured');
      if(!rec)return {ok:false,reason:'no-record'};
      if(x.ships.some(s=>s.record&&s.record.id===rec.id))return {ok:true,reason:'already-live',recId:rec.id,present:x.ships.filter(s=>s&&s.record&&s.record.id===rec.id).length};
      await Promise.all([primeShipAsset(rec.faction, rec.classKey, 'pirate')]);
      const p=x.ship.object.position;
      const live=spawnLiveShip(x,rec,{x:p.x+140,y:p.y,z:p.z});
      if(live&&!x.ships.includes(live))x.ships.push(live);
      if(live){live.ai.playerRolled=true;live.ai.playerInterested=false;}
      const present=x.ships.filter(s=>s&&s.record&&s.record.id===rec.id).length;
      return live?{ok:true,reason:'spawned',recId:rec.id,present}:{ok:false,reason:'spawn-refused'};})()`);
    assert.ok(res.ok, 'the quarry flies: ' + JSON.stringify(res));
    return res.recId;
  }
  async function lockQuarry(recId, target) {
    let lock = null;
    const fails = [];
    for (let i = 0; i < 30 && !lock; i++) {
      await sleep(500);
      const ready = await ctxEval(`(()=>{const x=window.__ctx;
        const live=x.ships.find(s=>s&&s.record&&s.record.id===${JSON.stringify(recId)}&&s.object);
        if(!live)return {ready:'not-live',ships:x.ships.map((s)=>({id:s&&s.id,rec:s&&s.record&&s.record.id}))};
        const p=x.ship.object.position;
        live.object.position.set(p.x+140,p.y,p.z);
        if(live.ai&&live.ai.velocity)live.ai.velocity.set(0,0,0);
        if(x.flags.docked)return 'docked';
        return {ready:'ready',id:live.id,recordId:live.record&&live.record.id,destroyed:!!(live.state&&live.state.destroyed),d2:live.object.position.distanceToSquared(p)};})()`);
      if (ready !== 'ready' && ready.ready !== 'ready') {
        fails.push(ready);
        // A hull traffic folded away is re-spawned from its live record.
        if (ready.ready === 'not-live' && i >= 1) await spawnQuarry(target);
        continue;
      }
      lock = await act('selectTarget', { id: recId }, false);
      if (!lock.ok) { fails.push({ token: lock.token, error: lock.error, d2: ready.d2 }); lock = null; }
    }
    assert.ok(lock && lock.ok, 'the quarry locked: ' + JSON.stringify({ recId, fails: fails.slice(-4) }));
    await sleep(400);
  }
  async function breakAndYield(recId) {
    const lease = await act('setCombatIntent', { seq: 1, ttl: 20, targetId: recId, intent: 'disable' }, false);
    result.lease = lease;
    const broken = await ctxEval(`(()=>{const x=window.__ctx;
      const t=x.targets.current; if(!t||!t.state)return 'no-lock';
      t.state.hull=Math.max(1,t.state.hullMax*0.2); t.state.disabled=true; x.emit('npcDisabled',{ship:t});
      return 'broken';})()`);
    assert.equal(broken, 'broken');
    await sleep(400);
    const intents = await ctxEval(`(async()=>{const x=window.__ctx;
      const shipHasCargoNow=(c)=>Array.isArray(c)&&c.some((r)=>r&&(r.units|0)>0);
      const t=x.targets.current; if(!t||!t.state)return null;
      t.state.disabled=false;
      t.ai.lastAttacker='player';
      // Disclosed fixture: pin the willingness band and clear the combat
      // threat so npc.js updateResolve cannot capitulate the hull out from
      // under the card we are about to read.
      t.state.resolve=45;
      t.ai.band='bargaining';
      t.ai.hailed=false;
      t.ai.surrenderDone=false;
      t.state.surrendered=false;
      t.ai.intent=false;
      t.ai.mode='drift';
      t.state.lastCombatAt=-999;
      const { cargoValueSafe } = await import('/src/game/data-trade.js');
      // Disclosed fixture: a priced hold must exist for the cargo-demand and
      // tribute paths. Live ship cargo is an array of {commodity, units}.
      const cargo = t.state.cargo;
      if(!Array.isArray(cargo)||!cargo.some(r=>r&&(r.units|0)>0)||cargoValueSafe(cargo,x.world.prices)<=0){
        t.state.cargo=[{commodity:'provisions',units:2}];
      }
      const list=[];
      if(shipHasCargoNow(t.state.cargo))list.push('demandCargo');
      list.push('demandRansom');
      if(cargoValueSafe(t.state.cargo,x.world.prices)>0)list.push('acceptTribute');
      list.push('letGo','keepFiring');
      // Close any foreign card that traffic may have opened this frame.
      if(x.hailApi.peek().open)x.emit('hailClosed',{});
      x.emit('hailOpened',{ship:t,intents:list,line:'They are breaking.'});
      return list;})()`);
    assert.ok(Array.isArray(intents) && intents.length >= 3, 'surrender card verbs: ' + JSON.stringify(intents));
    await sleep(500);
    return intents;
  }
  async function readBountyCard(label) {
    const s = await observe();
    const hail = s.hail;
    assert.ok(hail && hail.open === true, label + ': the surrender card is open ' + JSON.stringify(hail));
    assert.equal(hail.kind, 'surrender', label + ': the card is the surrender family');
    assert.ok(hail.terms && typeof hail.terms.line === 'string', label + ': the card publishes terms');
    assert.ok(hail.terms.line.includes(PIRATE_NOTE), label + ': terms.line carries the exact Compact-claim note: ' + JSON.stringify(hail.terms.line));
    const labels = Array.isArray(hail.terms.options) ? hail.terms.options.map((o) => o.label) : [];
    const amounts = hail.terms.amounts || {};
    const want = [
      'Demand cargo (bounty stays open)',
      'Demand ransom — ' + amounts.ransom + ' UU (bounty stays open)',
      'Accept tribute — ' + amounts.tribute + ' UU (bounty stays open)',
      'Let them go (bounty stays open)',
      'Keep firing — a kill pays the bounty',
    ];
    for (const copy of want) {
      assert.ok(labels.some((l) => l.includes(copy)), label + ': option label "' + copy + '" present: ' + JSON.stringify(labels));
    }
    const domText = await ctxEval(`(()=>{const el=document.querySelector('.rw-hail-card');
      if(!el)return null;
      const note=Array.from(el.querySelectorAll('div')).map((d)=>d.textContent||'');
      return {text:el.textContent||'',inner:el.innerText||'',note};})()`);
    assert.ok(domText && (domText.text.includes(PIRATE_NOTE) || domText.inner.includes(PIRATE_NOTE)),
      label + ': the player-visible card carries the note: ' + JSON.stringify(domText));
    return hail;
  }

  // ---- B. Target A: break, yield, read the card, take the ransom ----------
  await undockFreehold();
  await sleep(500);
  await parkOtherShips();
  const recA = await spawnQuarry(bountyA.target);
  await lockQuarry(recA, bountyA.target);
  await breakAndYield(recA);
  const hailA = await readBountyCard('target A');
  const ransom = hailA.terms.amounts.ransom;
  const creditsBeforeA = await ctxEval('window.__ctx.world.credits');
  const resolveA = await act('hailResolve', { intent: 'demandRansom', expectedConversationId: hailA.conversationId });
  assert.ok(resolveA.ok, 'target A: demandRansom resolved ' + JSON.stringify(resolveA));
  await sleep(400);
  const afterRansom = await ctxEval(`(()=>{const x=window.__ctx;return {credits:x.world.credits,time:x.world.time};})()`);
  assert.equal(afterRansom.credits - creditsBeforeA, ransom, 'target A: the ransom paid exactly ' + ransom + ' UU');
  const rowA = await jobOf(bountyA.id);
  assert.equal(rowA.state, 'accepted', 'target A: the bounty stays accepted after the ransom');
  assert.equal(rowA.progress, 0, 'target A: progress stays 0 after the ransom');
  result.targetA = {
    id: bountyA.id, target: bountyA.target, card: hailA, ransom,
    creditsBefore: creditsBeforeA, creditsAfter: afterRansom.credits,
  };
  await checkpoint('target-a-ransom');

  // A real delivery tick runs every 0.5 s of world time, docked or not.
  const tickSamples = [];
  for (let i = 0; i < 8; i++) {
    await sleep(500);
    tickSamples.push(await ctxEval(`(()=>{const x=window.__ctx;const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bountyA.id)});return {time:x.world.time,credits:x.world.credits,job:j?{state:j.state,progress:j.progress}:null};})()`));
  }
  assert.ok(tickSamples[tickSamples.length - 1].time - tickSamples[0].time >= 0.5, 'a delivery tick elapsed while the claim stayed open');
  for (const sample of tickSamples) {
    assert.ok(sample.job, 'target A: the row is still on the ledger');
    assert.equal(sample.job.state, 'accepted', 'target A: accepted across the delivery tick');
    assert.equal(sample.job.progress, 0, 'target A: progress 0 across the delivery tick');
    assert.equal(sample.credits, afterRansom.credits, 'target A: no bounty payout for a ransom');
  }
  result.targetADeliverySamples = tickSamples;

  // ---- C. Target B: break, yield, take the cargo, then the surrender ------
  await parkOtherShips();
  const recB = await spawnQuarry(bountyB.target);
  await lockQuarry(recB, bountyB.target);
  await breakAndYield(recB);
  const hailB = await readBountyCard('target B');
  const resolveB = await act('hailResolve', { intent: 'demandCargo', expectedConversationId: hailB.conversationId });
  assert.ok(resolveB.ok, 'target B: demandCargo resolved ' + JSON.stringify(resolveB));
  await sleep(400);
  const yieldedB = await ctxEval(`(()=>{const x=window.__ctx;const t=x.targets.current;
    const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bountyB.id)});
    return {locked:!!t,surrendered:t?t.state.surrendered:null,disabled:t?t.state.disabled:null,
      shipHasCargo:!!(t&&Array.isArray(t.state.cargo)&&t.state.cargo.length>0),
      job:j?{state:j.state,progress:j.progress}:null};})()`);
  assert.equal(yieldedB.surrendered, true, 'target B: the hull yielded to the cargo demand');
  assert.equal(yieldedB.shipHasCargo, false, 'target B: the hold was emptied');
  assert.equal(yieldedB.job.state, 'accepted', 'target B: the bounty stays accepted after the cargo demand');
  result.targetB = { id: bountyB.id, target: bountyB.target, card: hailB, yield: yieldedB };
  await checkpoint('target-b-cargo');

  // Park the yielded hull in hail range and take the surrender with the real
  // hail edge: no card opens, so hail.js runs tryCaptureYieldedTarget.
  const parked = await ctxEval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.object)return 'no-lock';
    const p=x.ship.object.position;
    t.object.position.set(p.x+60,p.y,p.z);
    if(t.ai&&t.ai.velocity)t.ai.velocity.set(0,0,0);
    if(t.ai&&t.ai.driftVel)t.ai.driftVel.set(0,0,0);
    return {recId:t.record?t.record.id:null,dist:t.object.position.distanceTo(p)};})()`);
  assert.notEqual(parked, 'no-lock', 'target B: the yielded hull is still the lock');
  await sleep(300);
  const relock = await act('selectTarget', { id: recB }, false);
  result.captureRelock = relock;
  await sleep(200);
  const creditsBeforeB = await ctxEval('window.__ctx.world.credits');
  const hailPress = await act('hail');
  result.hailPress = hailPress;
  await sleep(1200);
  const afterCapture = await ctxEval(`(()=>{const x=window.__ctx;
    const name=${JSON.stringify(bountyB.target)};
    const rec=(x.world.recordBanks?.freehold??[]).find(r=>r&&r.name===name) ?? (x.world.records??[]).find(r=>r&&r.name===name);
    const incs=(x.world.incidents??[]).filter(i=>i&&i.name===name);
    return {recState:rec?rec.state:null, lastIncident:incs.length?incs[incs.length-1]:null,
      destroyedIncident:(x.world.incidents??[]).some(i=>i&&i.kind==='destroyed'&&i.name===name),
      credits:x.world.credits};})()`);
  result.capture = afterCapture;
  assert.equal(afterCapture.lastIncident && afterCapture.lastIncident.kind, 'surrendered', 'target B: a surrendered incident was recorded: ' + JSON.stringify(afterCapture.lastIncident));
  assert.equal(afterCapture.lastIncident && afterCapture.lastIncident.outcome, 'captured', 'target B: the incident outcome is captured');
  assert.equal(afterCapture.lastIncident && afterCapture.lastIncident.causer, 'player', 'target B: the capture is player-caused');
  assert.equal(afterCapture.recState, 'captured', 'target B: the record settles captured');
  assert.equal(afterCapture.destroyedIncident, false, 'target B: a capture is not a kill');
  await checkpoint('target-b-captured');

  // The bounty pays done inside the delivery tick.
  let paid = null;
  for (let i = 0; i < 30 && !paid; i++) {
    await sleep(500);
    const sample = await ctxEval(`(()=>{const x=window.__ctx;const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bountyB.id)});return {time:x.world.time,credits:x.world.credits,job:j?{state:j.state,progress:j.progress}:null};})()`);
    if (sample.job && sample.job.state === 'done' && sample.credits > creditsBeforeB) paid = sample;
  }
  assert.ok(paid, 'target B: the captured bounty paid within the delivery tick: ' + JSON.stringify({ creditsBeforeB, paid }));
  assert.equal(paid.job.state, 'done', 'target B: the accepted row completes done');
  assert.ok(paid.credits > creditsBeforeB, 'target B: credits rose on the capture');
  result.bountyPaid = { creditsBefore: creditsBeforeB, creditsAfter: paid.credits, delta: paid.credits - creditsBeforeB, job: paid.job };
  await checkpoint('bounty-paid');

  // ---- D. Dock and read the rendered Jobs desk copy -----------------------
  // Park on the Freehold dock shell (the same +36 offset issue #291 uses) so
  // the berth takes the ship after the fight.
  await parkOtherShips();
  await ctxEval(`(()=>{const x=window.__ctx;const st=x.systems.freehold.station.position;
    x.flags.combat=false;x.ship.object.position.set(st[0]+36,st[1],st[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
    return true;})()`);
  await sleep(300);
  await dockAtFreehold();
  await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold again');
  await act('openService', { id: 'jobs' });
  await sleep(600);
  const cards = await ctxEval(`(()=>{const out=[];
    document.querySelectorAll('.job-card').forEach((card)=>{const t=card.querySelector('.job-title');const d=card.querySelector('.job-detail');out.push({title:t?t.textContent:'',detail:d?d.textContent:''});});
    return out;})()`);
  assert.ok(cards.length > 0, 'the Jobs desk rendered cards');
  const aceInfo = await ctxEval(`(()=>{const x=window.__ctx;const j=(x.world.jobs??[]).find(j=>j&&j.id==='bounty-ace');
    const banks=[...(x.world.recordBanks?.freehold??[]),...(x.world.records??[])];
    const rec=banks.find(r=>r&&r.role==='ace'&&r.name===(j?j.target:''));
    const homeId=rec&&rec.system?rec.system:Object.keys(x.systems??{}).find(k=>x.systems[k].cast?.ace);
    const homeName=homeId&&x.systems?.[homeId]?x.systems[homeId].name:null;
    return {target:j?j.target:null,homeId,homeName,detail:j?j.detail:null};})()`);
  assert.ok(aceInfo.target, 'an ace posting exists on the board: ' + JSON.stringify(aceInfo));
  const aceCard = cards.find((card) => card.title.includes('Bounty: ' + aceInfo.target));
  assert.ok(aceCard, 'the rendered ace card is drawn: ' + JSON.stringify(cards.map((x) => x.title)));
  const aceExpected = aceInfo.homeName
    ? aceInfo.target + ' flies an ace frame and bleeds the lanes of ' + aceInfo.homeName + ' dry. The Compact pays on confirmation of the kill — a Named Gun' + "'s surrender is never taken as a capture, so only a kill closes this claim."
    : null;
  assert.ok(aceCard.detail.includes('only a kill closes this claim'), 'ace card: only a kill closes this claim: ' + JSON.stringify(aceCard.detail));
  assert.ok(aceCard.detail.includes("Named Gun's surrender is never taken as a capture"), 'ace card: the Named Gun exception is stated');
  assert.equal(aceCard.detail.includes('kill or capture'), false, 'ace card: no longer promises a capture');
  if (aceExpected) assert.equal(aceCard.detail.trim(), aceExpected, 'ace card detail matches the exact copy contract');
  const pirateCard = cards.find((card) => card.title.includes('Bounty: ' + bountyA.target));
  assert.ok(pirateCard, 'the ordinary pirate bounty card is drawn: ' + JSON.stringify(cards.map((x) => x.title)));
  assert.ok(pirateCard.detail.includes('kill or capture'), 'ordinary pirate bounty card still says kill or capture: ' + JSON.stringify(pirateCard.detail));
  result.board = {
    ace: { target: aceInfo.target, homeName: aceInfo.homeName, detail: aceCard.detail, expected: aceExpected },
    pirate: { target: bountyA.target, detail: pirateCard.detail },
  };
  await checkpoint('board-copy');

  result.aceNote = ACE_NOTE; // the ace surrender-card copy contract, covered by the boot pin
  result.verdictDetail = 'PASS';
});

console.log('issue-314 live: ' + outcome.verdict);
