/** #269 live verification: the ace bounty row as the player reads it on a real
 * station Jobs board. Disposable Chromium; dock, system swap and the dead-ace
 * withdrawal checkpoint are explicit fixtures, so no natural-flight claim is
 * made. Console errors are enforced by the shared harness.
 * node scripts/issue-269-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE269_OUT || resolve('out/issue-269-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

const strip = (s) => s.replace(/^\d+\.\s*/, '');

await runLive('ace-bounty', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Dock and system swap are explicit fixtures; the dead-ace withdrawal checkpoint flips the ace record state to dead and back (a kill result, not a board rule).';
  const placeAtBerth = (sysId) => c.eval(`(()=>{const x=window.__ctx;
    if(x.world.currentSystem!==${JSON.stringify(sysId)}){ if(x.flags.docked) x.stationDesk.undock(); x.world.currentSystem=${JSON.stringify(sysId)}; x.emit('systemLoaded',{to:${JSON.stringify(sysId)}}); }
    const p=x.systems[x.world.currentSystem].station.position;
    for(const sh of x.ships)if(sh?.object)sh.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
    x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;
    return x.world.currentSystem;})()`);
  const readBoard = () => c.eval(`(()=>{const cards=Array.from(document.querySelectorAll('.job-card')).map(card=>({title:card.querySelector('.job-title')?.textContent??'',reward:card.querySelector('.job-reward')?.textContent??'',note:card.querySelector('.job-state')?.textContent??''}));const o=window.rimward.observe();const offer=o.jobs.offers.find(j=>j.id==='bounty-ace')??null;return {cards,offer,system:o.world.currentSystem};})()`);
  const aceTitle = 'Bounty: Carver Illyx';
  const hasAceCard = (board) => board.cards.some((card) => strip(card.title) === aceTitle);
  const setIllyxState = (state) => c.eval(`(()=>{const x=window.__ctx;let n=0;
    for(const bank of Object.values(x.world.recordBanks??{})){for(const r of bank){
      if(r&&r.role==='ace'&&r.name==='Carver Illyx'){r.state=${JSON.stringify(state)};n++;}}}
    return n;})()`);
  const waitBoard = async (pred, label) => {
    for (let i = 0; i < 24; i++) {
      const board = await readBoard();
      if (pred(board)) return board;
      await sleep(250);
    }
    throw Error('timeout ' + label);
  };
  const dockAndOpenJobs = async (sysId) => {
    await placeAtBerth(sysId);
    await sleep(250);
    await act('dock');
    await wait((s) => s.flags.docked && s.world.currentSystem === sysId, 15, 'dock at ' + sysId);
    await act('openService', { id: 'jobs' });
    await sleep(250);
    return readBoard();
  };

  // A. Fresh Freehold: the cast ace owns the row at his authored bounty.
  const freehold = await dockAndOpenJobs('freehold');
  const freeholdAce = freehold.cards.find((card) => strip(card.title).startsWith('Bounty:'));
  assert.ok(freeholdAce, 'Freehold board renders a bounty card');
  assert.equal(strip(freeholdAce.title), 'Bounty: Carver Illyx');
  assert.ok(freeholdAce.reward.includes('2500 UU'), 'Freehold ace reward is 2500 UU: ' + freeholdAce.reward);
  assert.ok(!/Copper Vane/.test(freeholdAce.title), 'no ordinary pirate on the ace row');
  assert.ok(!freeholdAce.note, 'no gate note on the ace home board');
  assert.equal(freehold.offer?.target, 'Carver Illyx');
  assert.equal(freehold.offer?.reward, 2500);
  result.freehold = { card: freeholdAce, offer: freehold.offer };
  await checkpoint('freehold-jobs');

  // B. Veridian has no authored ace cast: the row must still name a real ace at
  // its own bounty, never the local 300 UU pirate, and must say where it hunts.
  const veridian = await dockAndOpenJobs('veridian');
  const veridianAce = veridian.cards.find((card) => strip(card.title).startsWith('Bounty:'));
  assert.ok(veridianAce, 'Veridian board renders a bounty card');
  assert.equal(strip(veridianAce.title), 'Bounty: Carver Illyx');
  assert.ok(veridianAce.reward.includes('2500 UU'), 'Veridian ace reward is the ace bounty: ' + veridianAce.reward);
  assert.ok(!/Copper Vane/.test(veridianAce.title), 'Veridian ace row never names an ordinary pirate');
  assert.ok(!/300 UU/.test(veridianAce.reward), 'Veridian ace reward is never an ordinary 300 UU bounty');
  assert.match(veridianAce.note, /Hunts in Freehold/, 'gate note names the ace home: ' + veridianAce.note);
  assert.ok(!/Redmarch/.test(veridianAce.note), 'gate note does not contradict the named ace');
  assert.equal(veridian.offer?.target, 'Carver Illyx');
  assert.equal(veridian.offer?.reward, 2500);
  result.veridian = { card: veridianAce, offer: veridian.offer };
  await checkpoint('veridian-jobs');

  // C. Criterion 2: a dead ace leaves the offered row instead of staying on it.
  // Fixture: the record's state is flipped to dead and back — a kill result, not
  // a board rule; the dock/system swaps above are explicit fixtures too.
  assert.equal(await setIllyxState('dead'), 1, 'exactly one Carver Illyx record');
  const withdrawn = await waitBoard((board) => !board.offer && !hasAceCard(board),
    'dead ace withdrawal');
  result.withdrawn = { offer: withdrawn.offer, aceCardPresent: hasAceCard(withdrawn) };
  assert.equal(withdrawn.offer, null, 'dead ace leaves the agent offer list');
  assert.equal(hasAceCard(withdrawn), false, 'dead ace card is withdrawn from the DOM');
  await checkpoint('veridian-dead-withdrawn');
  assert.equal(await setIllyxState('enroute'), 1, 'the living bearer returns for the accept step');
  const revived = await waitBoard((board) => board.offer?.target === 'Carver Illyx' && hasAceCard(board),
    'living ace re-offer');
  result.revived = { offer: revived.offer, aceCardPresent: hasAceCard(revived) };
  assert.equal(revived.offer?.target, 'Carver Illyx');
  assert.equal(hasAceCard(revived), true, 'living ace card returns');

  // D. The card the player accepts quotes the same reward the row posted.
  const accept = await act('acceptJob', { id: 'bounty-ace' });
  assert.ok(accept.ok, 'ace posting is acceptable');
  assert.ok(accept.notice.includes('Carver Illyx'), 'accept receipt names the ace: ' + accept.notice);
  const accepted = await observe();
  const acceptedJob = accepted.jobs.active.find((j) => j.id === 'bounty-ace');
  assert.equal(acceptedJob?.target, 'Carver Illyx');
  assert.equal(acceptedJob?.reward, 2500);
  assert.ok(!accepted.jobs.offers.some((j) => j.id === 'bounty-ace'), 'accepted row leaves the offer list');
  result.accepted = { receipt: accept.notice, job: acceptedJob };
  await checkpoint('veridian-accepted');

  result.method = 'Disposable Chromium; dock, system swap and the dead-ace state flip are explicit fixtures; the DOM card, the agent offer, the withdrawal, and the accept receipt are read from the running game.';
});
