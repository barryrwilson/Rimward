/**
 * Issue #272 live verification — the hunt supply the player reads on a real
 * station Jobs board. Disposable Chromium, loopback only.
 *
 * Fixtures are explicit record-state flips (a kill is a combat result). The
 * board cards, the empty-board line, the replenish pick and the tier row are
 * read from the running game. Console errors and exceptions fail the run.
 *
 * Run: npm run test:hunt-supply-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE272_OUT || resolve('out/issue-272-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('hunt-supply', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Kills are disclosed record-state flips (a combat result, not a board rule); the board cards, the empty-board line, the replenish pick and the tier row are read from the running game.';

  const dockFreehold = async () => {
    await c.eval(`(()=>{const x=window.__ctx;
      if(x.world.currentSystem!=='freehold'){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem='freehold'; x.emit('systemLoaded',{to:'freehold'}); }
      const p=x.systems[x.world.currentSystem].station.position;
      for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
      x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
      return x.world.currentSystem;})()`);
    await sleep(250);
    await act('dock');
    await wait((s) => s.flags.docked && s.world.currentSystem === 'freehold', 15, 'dock at freehold');
  };

  const killLocalPirates = () => c.eval(`(()=>{const x=window.__ctx;
    const bank=x.world.recordBanks?.freehold??[];
    let n=0;
    for(const r of bank){ if(r&&r.role==='pirate'&&r.state!=='dead'&&r.state!=='captured'&&r.state!=='derelict'){ r.state='dead'; n++; } }
    return n;})()`);

  const boardText = async () => {
    const s = await observe();
    const panel = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
    return { s, panel };
  };

  const huntRows = () => c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='hunt'&&j.originSystem==='freehold'&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target,reward:j.reward,recordId:j.recordId}));})()`);

  // A. The fresh Freehold board posts hunts and the player can read them.
  await dockFreehold();
  await act('openService', { id: 'jobs' });
  await sleep(300);
  let rows = await huntRows();
  assert.ok(rows.length >= 1 && rows.length <= 2, 'fresh board posts 1-2 hunts: ' + JSON.stringify(rows));
  let view = await boardText();
  assert.match(view.panel, /Hunt /, 'the board shows hunt cards');
  await checkpoint('fresh-board');

  // B. Kill the supply: the board empties and tells the player it refills.
  const killed = await killLocalPirates();
  assert.ok(killed >= 1, 'local pirates to break: ' + killed);
  await sleep(700);
  rows = await huntRows();
  assert.equal(rows.length, 0, 'no hunt cards without a quarry');
  view = await boardText();
  assert.match(view.panel, /Every local reaver is dead or gone/, 'the empty board names the state');
  assert.match(view.panel, /refills as they arrive/, 'the empty board promises the refill');
  await checkpoint('empty-board');

  // C. The world refills: step the clock past the pick and watch the board.
  await c.eval(`(()=>{const x=window.__ctx; x.world.time += 200; return x.world.time;})()`);
  // The shared wait() takes a sync predicate; poll the rows directly here.
  let refilled = false;
  for (let i = 0; i < 80 && !refilled; i++) {
    await sleep(250);
    refilled = (await huntRows()).length >= 1;
  }
  assert.ok(refilled, 'replenish pick refilled the board');
  rows = await huntRows();
  assert.ok(rows.length >= 1, 'a hunt card returned');
  view = await boardText();
  assert.match(view.panel, /Hunt /, 'the refilled board shows the new card');
  await checkpoint('refilled-board');

  // D. A hardened quarry carries its warn row when one is on the board.
  const hardened = await c.eval(`(()=>{const x=window.__ctx;
    const bank=x.world.recordBanks?.freehold??[];
    const vet=bank.find(r=>r&&r.role==='pirate'&&r.reaverTier==='veteran'&&r.state!=='dead');
    return vet?{name:vet.name,bounty:vet.bounty,resolve:vet.resolve}:null;})()`);
  if (hardened) {
    view = await boardText();
    assert.match(view.panel, /HARDENED QUARRY/, 'the hardened row reads on the card');
  }
  result.hardenedSeen = hardened ?? null;
  result.finalBoard = view.panel;
});

console.log('issue-272 live: PASS');
