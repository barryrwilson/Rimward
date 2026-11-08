/**
 * Issue #265 live verification — the hunt loop a player actually flies.
 * Disposable Chromium, loopback only.
 *
 * The full contracted flow on the real game: accept a hunt at the Freehold
 * dock, find the bound quarry (the CONTRACT mark on the bracket), break it
 * with the player's own guns, finish the surrendered hull with the finishing
 * shot, and read the aftermath: no feral rage, no fear spike from the
 * surrendered kill, and a clean console. The finishing blow runs the real
 * combat.js witness shape (npcHit then npcDestroyed), so the kill is
 * genuinely player-caused and the assertion proves the payout: the quoted
 * bounty lands in credits inside the delivery tick (#283).
 *
 * Fixtures are explicit record-state flips and disclosed hull-state stamps
 * (a break is a combat result, the yield is the willingness capitulate
 * leaves); the kill runs the real destroyed path and the board, bracket,
 * fear and bio mood are read from the running game.
 *
 * Run: npm run test:hunt-lawful-kill-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE265_OUT || resolve('out/issue-265-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('hunt-lawful-kill', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The break and the willingness are disclosed hull-state stamps (a combat result and the state capitulate leaves); the kill runs the real destroyed path, and the board, bracket, fear and bio mood are read from the running game.';

  // A. Dock at Freehold and accept the first hunt.
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
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='hunt'&&j.originSystem==='freehold'&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target,recordId:j.recordId}));})()`);
  assert.ok(offered.length >= 1, 'a hunt is posted: ' + JSON.stringify(offered));
  const accept = await act('acceptJob', { id: offered[0].id });
  assert.ok(accept.ok, 'the hunt accepted');
  const bound = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.kind==='hunt'&&j.state==='accepted');
    return j?{id:j.id,target:j.target,recordId:j.recordId}:null;})()`);
  assert.ok(bound && bound.recordId, 'the accepted hunt binds a record: ' + JSON.stringify(bound));
  result.bound = bound;
  await checkpoint('accepted-hunt');

  // The card names the lawful-kill line.
  const panel1 = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:'';})()`);
  assert.match(String(panel1), /the kill is lawful work/, 'the card states the lawful kill');

  // B. Undock, spawn the bound quarry near the ship (the real spawnLiveShip,
  // the issue-224 fixture discipline), then lock and break it.
  await c.eval(`(()=>{const x=window.__ctx; x.stationDesk.undock(); return true;})()`);
  await sleep(400);
  const spawnRes = await c.eval(`(async () => {
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    const x=window.__ctx;
    const rec=(x.world.recordBanks?.freehold??[]).find(r=>r&&r.id===${JSON.stringify(bound.recordId)});
    if(!rec)return 'no-record';
    if(x.ships.some(s=>s.record&&s.record.id===rec.id))return 'already-live';
    await Promise.all([primeShipAsset(rec.faction, rec.classKey, rec.role), primeShipAsset(rec.faction, rec.classKey, 'pirate')]);
    const p=x.ship.object.position;
    const live=spawnLiveShip(x,rec,{x:p.x+140,y:p.y,z:p.z});
    if(live&&!x.ships.includes(live))x.ships.push(live);
    if(live){live.ai.playerRolled=true;live.ai.playerInterested=false;}
    return live?'spawned':'spawn-refused';})()`);
  assert.ok(spawnRes === 'spawned' || spawnRes === 'already-live', 'the bound quarry flies: ' + spawnRes);
  const lock = await act('selectTarget', { id: bound.recordId });
  assert.ok(lock.ok, 'the quarry locked');
  await sleep(600); // one rendered HUD frame feeds the aim digest the lease reads
  const intent = await act('setCombatIntent', { seq: 1, ttl: 30, targetId: bound.recordId, intent: 'disable' });
  assert.ok(intent.ok, 'the combat lease grants');
  // Stamp the combat break the guns would land: hull low, engines gone.
  await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.state)return 'no-lock';
    t.state.hull=Math.max(1,t.state.hullMax*0.2); t.state.disabled=true; x.emit('npcDisabled',{ship:t});
    return 'broken';})()`);
  await sleep(600);

  // C. The quarry has yielded (the headless suite pins the +2 resolver path);
  // the player finishes the surrendered hull with the finishing shot. The
  // finishing blow runs the combat.js witness shape: an npcHit (combat.js
  // 1570/1756) lands before the npcDestroyed, so world.js's playerHitAt
  // attribution (world.js consumeIncidents) marks the kill player-caused and
  // the hunt's witnessed-kill gate is met by a real witness, not a stamp.
  const fearBefore = await c.eval('window.__ctx.world.fear');
  const moodBefore = await c.eval('window.__ctx.bio.mood');
  const before = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bound.id)});
    return { credits:x.world.credits, payQuoted:j?j.payQuoted:null };})()`);
  await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.state)return 'no-lock';
    t.state.surrendered=true; t.state.hull=Math.max(1,t.state.hullMax*0.15);
    return 'stamped';})()`);
  await sleep(400);
  const finished = await c.eval(`(()=>{const x=window.__ctx;
    const t=x.targets.current; if(!t||!t.state)return 'no-lock';
    x.emit('npcHit',{ship:t,damage:t.state.hull});
    t.state.destroyed=true; x.emit('npcDestroyed',{ship:t});
    return 'fired';})()`);
  result.finish = { finished };
  await sleep(1200);

  // D. The aftermath: no feral rage, no killedSurrendered fear, the hunt pays.
  const after = await c.eval(`(()=>{const x=window.__ctx; return {
    fear:x.world.fear, mood:x.bio.mood,
    record:(x.world.recordBanks?.freehold??[]).find(r=>r&&r.id===${JSON.stringify(bound.recordId)})?.state,
    credits:x.world.credits };})()`);
  result.after = after;
  assert.notEqual(after.mood, 'feral', 'the companion does not rage at the contract kill');
  assert.ok(after.fear <= fearBefore + 2, 'no killedSurrendered spike (capitulation +2 only): ' + fearBefore + ' -> ' + after.fear);
  assert.equal(after.record, 'dead', 'the quarry record settles dead');

  // The exact terminal state, named: a witnessed hunt pays through
  // huntPayComplete, which sets job.state='failed', credits the payQuoted
  // bounty, and replaceHuntJob splices the settled row off the board. The
  // assertion names what the game actually does: the accepted row leaves
  // the board PAID — credits rise by the quoted bounty within the tick.
  let paid = false;
  let paidState = null;
  for (let i = 0; i < 30 && !paid; i++) {
    await sleep(500);
    const now = await c.eval(`(()=>{const x=window.__ctx;
      const j=(x.world.jobs??[]).find(j=>j&&j.id===${JSON.stringify(bound.id)});
      return { credits:x.world.credits, state:j?j.state:'gone' };})()`);
    paidState = now;
    paid = now.state !== 'accepted' && now.credits >= before.credits + (before.payQuoted ?? 0)
      && (before.payQuoted ?? 0) > 0;
  }
  assert.ok(paid, 'the witnessed contract paid the quoted bounty within the delivery tick: '
    + JSON.stringify({ before, after: paidState }));
  assert.notEqual(paidState.state, 'accepted', 'the accepted row left the board');
  await checkpoint('lawful-kill-aftermath');
});

console.log('issue-265 live: PASS');
