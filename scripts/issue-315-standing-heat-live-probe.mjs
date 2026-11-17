/**
 * Issue #315 live verification — a disposable-Chromium run of the real game:
 * observe() publishes the faction standing map the Standing desk prints, and a
 * bounty heat read ({bounty, tier}) on offered/accepted bounty rows derived
 * from the living quarry record. Standing and one record price are staged with
 * disclosed live writes; the board, desk and observation are the running game.
 * Console errors and exceptions fail the run (harness discipline).
 *
 * Run: node scripts/issue-315-standing-heat-live-probe.mjs
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE315_OUT || resolve('out/issue-315-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('standing-heat', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'Faction standing is staged on the live ctx.world.reputation bag (disclosed write) and a fixture pirate record seeds a priced bounty only when the board has none; the Standing desk, Jobs board and observation are the running game.';

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

  const panelText = () => c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
  const standingLine = async () => {
    const panel = await panelText();
    assert.ok(panel, 'the station panel rendered');
    const line = panel.split(String.fromCharCode(10)).map((l) => l.trim())
      .find((l) => /^Freehold Compact: \w+ \([+-]?\d+\)$/.test(l));
    assert.ok(line, 'the Standing desk prints the dock faction line: ' + panel.slice(0, 240));
    const m = /^Freehold Compact: (\w+) \(([+-]?\d+)\)$/.exec(line);
    return { line, rank: m[1], standing: Number(m[2]) };
  };
  const pirateRow = () => c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered')||null;})()`);
  const livingPirate = (name) => c.eval(`(()=>{const x=window.__ctx;
    const banks=[x.world.records??[],...Object.values(x.world.recordBanks??{})];
    for(const b of banks){if(!Array.isArray(b))continue;
      for(let i=b.length-1;i>=0;i--){const r=b[i];
        if(r&&r.role==='pirate'&&r.name===${JSON.stringify(name)}&&r.state!=='dead'&&r.state!=='captured')return r;}}
    return null;})()`);

  // -------------------------------------------------------------------------
  // A. Standing: the observation mirrors the rendered Standing desk.
  // -------------------------------------------------------------------------
  await dockFreehold();
  const naturalObs = await observe();
  assert.equal(naturalObs.v, 2, 'API VERSION stays 2');
  assert.ok(naturalObs.world?.reputation && typeof naturalObs.world.reputation === 'object',
    'world.reputation is published');
  const factionKeys = Object.keys(naturalObs.world.reputation);
  assert.ok(factionKeys.length >= 12, 'every authored faction is published: ' + factionKeys.join(','));
  for (const key of factionKeys) {
    const row = naturalObs.world.reputation[key];
    assert.ok(row && typeof row.name === 'string' && row.name
      && typeof row.rank === 'string' && row.rank
      && Number.isFinite(row.standing), 'standing row is well-formed: ' + key);
  }
  await act('openService', { id: 'epics' });
  await sleep(350);
  const naturalLine = await standingLine();
  assert.equal(naturalObs.world.reputation.freehold.rank, naturalLine.rank,
    'the observed rank matches the desk rank word');
  assert.equal(naturalObs.world.reputation.freehold.standing, naturalLine.standing,
    'the observed standing matches the desk number');
  await checkpoint('standing-desk-parity');

  // Disclosed write: move the live standing bag, then re-read both surfaces.
  const staged = await c.eval(`(()=>{const x=window.__ctx;
    x.world.reputation.freehold=30;x.world.reputation.veridian=12;x.world.reputation.hollow=-12;
    return {freehold:x.world.reputation.freehold,veridian:x.world.reputation.veridian,hollow:x.world.reputation.hollow};})()`);
  await sleep(250);
  await act('openService', { id: 'epics' });
  await sleep(350);
  const stagedLine = await standingLine();
  assert.equal(stagedLine.rank, 'Trusted', 'the desk prints the moved rank: ' + stagedLine.line);
  assert.equal(stagedLine.standing, 30, 'the desk prints the moved standing');
  const stagedObs = await observe();
  assert.equal(stagedObs.world.reputation.freehold.rank, 'Trusted', 'the observation follows the move');
  assert.equal(stagedObs.world.reputation.freehold.standing, 30);
  assert.equal(stagedObs.world.reputation.veridian.rank, 'Known');
  assert.equal(stagedObs.world.reputation.hollow.rank, 'Suspect');
  await checkpoint('standing-moved');

  // -------------------------------------------------------------------------
  // B. Bounty heat: offered and accepted rows quote the living record.
  // -------------------------------------------------------------------------
  await act('openService', { id: 'jobs' });
  await sleep(400);
  const seeded = await c.eval(`(()=>{const x=window.__ctx;
    const sysId=x.world.currentSystem;
    const posted=(x.world.jobs??[]).some(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered');
    if(posted) return 'natural';
    const bank=x.world.recordBanks?.[sysId]??x.world.records;
    if(!Array.isArray(bank)) return 'no-bank';
    const p=x.systems[sysId].station.position;
    bank.push({id:'rec-315-live',name:'Live Fixture Reaver',classKey:'cutter',faction:'independent',role:'pirate',system:sysId,state:'enroute',bounty:450,
      route:[[p[0]+900,p[1],p[2]],[p[0]+450,0,p[2]]],leg:0,legT:0.5,dir:1});
    x.stationDesk.selectService('jobs');
    return 'seeded';})()`);
  await sleep(300);
  const row = await pirateRow();
  assert.ok(row, 'an offered pirate bounty is posted (seed=' + seeded + ')');
  const rec = await livingPirate(row.target);
  assert.ok(rec, 'the offered row binds a living quarry');
  const offeredObs = await observe();
  const offeredAgent = [...offeredObs.jobs.offers, ...offeredObs.jobs.active]
    .find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.ok(offeredAgent && offeredAgent.heat, 'the agent bounty row carries heat');
  assert.equal(offeredAgent.heat.bounty, Math.round(rec.bounty), 'heat quotes the record bounty');
  assert.equal(offeredAgent.heat.tier, (rec.reaverTier === 'veteran' || rec.bounty >= 700) ? 'hard' : 'standard',
    'heat quotes #272 danger tier');
  const deskHeat = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.kind==='bounty'&&typeof j.id==='string'&&j.id.startsWith('bounty-pirate-')&&j.state==='offered');
    return x.stationDesk.peekBountyHeat(j);})()`);
  assert.deepEqual(offeredAgent.heat, deskHeat, 'the agent row quotes the desk evaluator');
  const panel = await panelText();
  assert.ok(panel, 'the Jobs panel rendered');
  assert.ok(panel.includes('bounty on ' + row.target) || panel.includes(String(row.target)),
    'the board renders the bounty row');
  await checkpoint('offered-bounty-heat');

  // Accept through the desk: the active row keeps the same heat.
  await c.eval(`window.__ctx.stationDesk.acceptJob({id:${JSON.stringify(row.id)}})`);
  await sleep(300);
  const acceptedObs = await observe();
  const acceptedAgent = acceptedObs.jobs.active.find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.ok(acceptedAgent, 'the accepted bounty row is observed');
  assert.deepEqual(acceptedAgent.heat, { bounty: Math.round(rec.bounty), tier: deskHeat.tier },
    'the accepted row keeps the heat read');
  await checkpoint('accepted-bounty-heat');

  // Disclosed fixture: a harder price posts hard tier; restore afterwards.
  const originalBounty = rec.bounty;
  await c.eval(`(()=>{const x=window.__ctx;
    const banks=[x.world.records??[],...Object.values(x.world.recordBanks??{})];
    for(const b of banks){if(!Array.isArray(b))continue;
      for(let i=b.length-1;i>=0;i--){const r=b[i];
        if(r&&r.role==='pirate'&&r.name===${JSON.stringify(row.target)}&&r.state!=='dead'&&r.state!=='captured'){r.bounty=900;return r.bounty;}}}
    return null;})()`);
  await sleep(250);
  const hardObs = await observe();
  const hardAgent = hardObs.jobs.active.find((j) => j.kind === 'bounty' && j.target === row.target);
  assert.equal(hardAgent.heat.bounty, 900, 'the heat follows the staged price');
  assert.equal(hardAgent.heat.tier, 'hard', 'a 900 bounty posts hard tier');
  await c.eval(`(()=>{const x=window.__ctx;
    const banks=[x.world.records??[],...Object.values(x.world.recordBanks??{})];
    for(const b of banks){if(!Array.isArray(b))continue;
      for(let i=b.length-1;i>=0;i--){const r=b[i];
        if(r&&r.role==='pirate'&&r.name===${JSON.stringify(row.target)}&&r.state!=='dead'&&r.state!=='captured'){r.bounty=${JSON.stringify(originalBounty)};return;}}}})()`);
  await sleep(200);
  await checkpoint('hard-bounty-heat');

  // The ace contract publishes the live ace bounty and its #272 tier.
  const aceHeat = await c.eval(`(()=>{const x=window.__ctx;
    const j=(x.world.jobs??[]).find(j=>j&&j.id==='bounty-ace');
    return j?x.stationDesk.peekBountyHeat(j):null;})()`);
  assert.ok(aceHeat, 'the ace contract binds a live ace');
  assert.equal(aceHeat.bounty, 2500, 'the live ace bounty is published');
  assert.equal(aceHeat.tier, 'hard', 'the ace contract is hard tier');

  // -------------------------------------------------------------------------
  // C. Honesty: no persisted field, no ctx.world write, JSON-plain.
  // -------------------------------------------------------------------------
  const before = await c.eval(`(()=>{const x=window.__ctx;
    return {jobs:JSON.stringify(x.world.jobs),rep:JSON.stringify(x.world.reputation)};})()`);
  const finalObs = await observe();
  const after = await c.eval(`(()=>{const x=window.__ctx;
    return {jobs:JSON.stringify(x.world.jobs),rep:JSON.stringify(x.world.reputation)};})()`);
  assert.equal(after.jobs, before.jobs, 'observe never writes the jobs list');
  assert.equal(after.rep, before.rep, 'observe never writes the standing bag');
  assert.equal(JSON.stringify(JSON.parse(JSON.stringify(finalObs.world.reputation))),
    JSON.stringify(finalObs.world.reputation), 'the standing map is JSON-plain');
  for (const j of await c.eval('window.__ctx.world.jobs')) {
    assert.ok(!Object.hasOwn(j, 'heat'), 'no heat field persisted on jobs: ' + j.id);
  }
  const heatRows = [...finalObs.jobs.offers, ...finalObs.jobs.active].filter((j) => j.heat);
  assert.ok(heatRows.length >= 1, 'the observation still carries a heat read');
  for (const j of heatRows) {
    assert.deepEqual(Object.keys(j.heat).sort(), ['bounty', 'tier'], 'heat is only price and tier');
    assert.ok(!JSON.stringify(j.heat).includes('rec-'), 'no record id leaks in heat');
  }
  await checkpoint('honesty-boundary');

  result.standingEvidence = {
    naturalLine: naturalLine.line,
    stagedLine: stagedLine.line,
    staged,
    factionCount: factionKeys.length,
    seeded,
    offeredHeat: offeredAgent.heat,
    acceptedHeat: acceptedAgent.heat,
    hardHeat: hardAgent.heat,
    aceHeat,
  };
  console.log('issue-315 live: PASS');
});
