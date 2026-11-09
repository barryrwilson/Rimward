/**
 * Issue #301 live verification — a disposable-Chromium Jobs board read: the
 * offered pirate-bounty cards and the patrol row quote the derived lane read
 * BEFORE acceptance; the accepted rows keep it (#292/#294). Console errors
 * and exceptions fail the run (harness discipline).
 *
 * Run: node scripts/issue-301-bounty-board-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE301_OUT || resolve('out/issue-301-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('bounty-board-location', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'A disclosed fixture record seeds a priced pirate when the board has none; wake/station state is real. Board cards, the patrol row and the agent row are read from the running game.';

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

  // Seed a priced fixture pirate only when the natural bank has none posted.
  const seedIfNeeded = () => c.eval(`(()=>{const x=window.__ctx;
    const sysId=x.world.currentSystem;
    const posted=(x.world.jobs??[]).some(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered');
    if(posted) return 'natural';
    const bank=x.world.recordBanks?.[sysId]??x.world.records;
    if(!Array.isArray(bank)) return 'no-bank';
    const p=x.systems[sysId].station.position;
    bank.push({id:'rec-301-live',name:'Live Fixture Reaver',classKey:'cutter',faction:'independent',role:'pirate',system:sysId,state:'enroute',bounty:450,
      route:[[p[0]+900,p[1],p[2]],[p[0]+450,0,p[2]]],leg:0,legT:0.5,dir:1});
    return 'seeded';})()`);

  const bountyRow = () => c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')||null;})()`);

  // A. The offered board carries the lane read on the bounty card and the patrol row.
  await dockFreehold();
  const seed = await seedIfNeeded();
  await act('openService', { id: 'jobs' });
  await sleep(400);
  let row = await bountyRow();
  assert.ok(row, 'an offered pirate bounty is posted (seed=' + seed + ')');
  let panel = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
  assert.ok(panel, 'the station panel rendered');
  const panelLines = panel.split(String.fromCharCode(10)).map((l) => l.trim());
  const titleIdx = panelLines.findIndex((l) => l.includes(String(row.target)));
  const bountyCard = titleIdx >= 0 ? panelLines.slice(titleIdx, titleIdx + 3).join(' ') : null;
  assert.ok(bountyCard && /Last seen: /.test(bountyCard), 'the offered bounty card quotes the lane read: ' + bountyCard);
  const laneLine = panel.split(String.fromCharCode(10)).find((l) => l.startsWith('Lane read: '));
  assert.ok(laneLine, 'the patrol row prints a Lane read line');
  const phrase = await c.eval(`window.__ctx.stationDesk.peekPirateLanePhrase()`);
  assert.ok(laneLine.includes(phrase), 'the Lane read line quotes the desk phrase verbatim');
  await checkpoint('offered-board-lane-read');

  // B. Accept through the desk: the accepted rows keep their reads.
  await c.eval(`window.__ctx.stationDesk.acceptJob({id:${JSON.stringify(row.id)}})`);
  // The unique patrol is a separate row: accept it too so its accepted state
  // line is exercised (it may still be offered on a fresh career).
  const patrolId = await c.eval(`(()=>{const j=(window.__ctx.world.jobs??[]).find(j=>j&&j.kind==='patrol');return j&&j.state==='offered'?j.id:null;})()`);
  if (patrolId) await c.eval(`window.__ctx.stationDesk.acceptJob({id:${JSON.stringify(patrolId)}})`);
  await sleep(300);
  panel = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
  const accLines = panel.split(String.fromCharCode(10)).map((l) => l.trim());
  const accIdx = accLines.findIndex((l) => l.includes('bounty on ' + row.target));
  const acceptedLine = accIdx >= 0 ? accLines[accIdx] : null;
  assert.ok(acceptedLine && /Last seen: /.test(acceptedLine), 'the accepted bounty row keeps the read: ' + acceptedLine);
  const panelLines2 = panel.split(String.fromCharCode(10)).map((l) => l.trim());
  const acceptedPatrol = panelLines2.find((l) => l.startsWith('ACCEPTED') && l.includes('Lane read: '));
  assert.ok(acceptedPatrol, 'the accepted patrol row keeps the Lane read: ' + (acceptedPatrol||''));
  // The agent row quotes the same read.
  const agentRow = await c.eval(`(()=>{const o=window.rimward.observe();return [...o.jobs.offers,...o.jobs.active].find(j=>j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-'))||null;})()`);
  assert.ok(agentRow, 'the agent observes a pirate-bounty row');
  const agentPhrase = await c.eval(`window.__ctx.stationDesk.bountyLastSeenPhrase((window.__ctx.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')))`);
  assert.ok(agentPhrase, 'the desk derives a pirate-bounty read');
  assert.equal(agentRow.lastSeen, agentPhrase, 'the agent row quotes the same read');
  await checkpoint('accepted-rows-keep-read');

  result.boardEvidence = { seed, bountyCard, laneLine, acceptedLine, acceptedPatrol };
  console.log('issue-301 live: PASS');
});
