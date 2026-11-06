/**
 * Issue #271 live verification — the tracking phase the player reads on a real
 * run: the card's "Last seen" lane phrase, the People desk's fresher Ask
 * around answer, and the CONTRACT word on a locked quarry's bracket.
 * Disposable Chromium, loopback only. Console errors fail the run.
 *
 * Run: npm run test:hunt-tracking-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE271_OUT || resolve('out/issue-271-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('hunt-tracking', async ({ c, result, act, observe, wait, checkpoint }) => {
  result.fixture = true;
  result.fixtureNote = 'The quarry is instantiated beside the ship by hand (the wave-30 harness discipline) so the bracket can be locked; every read is the running game.';

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

  // A. The card carries the Last seen phrase.
  await dockFreehold();
  await act('openService', { id: 'jobs' });
  await sleep(300);
  const rows = await c.eval(`(()=>{const x=window.__ctx;
    return (x.world.jobs??[]).filter(j=>j&&j.kind==='hunt'&&j.originSystem==='freehold'&&j.state==='offered')
      .map(j=>({id:j.id,target:j.target,recordId:j.recordId}));})()`);
  assert.ok(rows.length >= 1, 'a hunt card is posted');
  let panel = await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?p.innerText:null;})()`);
  assert.match(panel, /Last seen: /, 'the card carries the Last seen line');
  assert.ok(!/rec-/.test(panel), 'no record id on the board');
  await checkpoint('last-seen-card');

  // B. Ask around answers the sighting on the People desk.
  await act('openService', { id: 'people' });
  await sleep(300);
  await c.eval(`(()=>{const btns=[...document.querySelectorAll('button')];const b=btns.find(x=>x.textContent==='Ask around');if(b)b.click();return !!b;})()`);
  await sleep(300);
  const notice = await c.eval(`(()=>{const n=document.querySelector('.station-notice');return n?n.innerText:null;})()`);
  const postedNames = rows.map((r) => r.target);
  assert.ok(postedNames.some((t) => (notice ?? '').includes(t)), 'the sighting names a posted quarry: ' + notice);
  await checkpoint('ask-around-sighting');

  // C. The locked bracket marks the bound quarry CONTRACT.
  const target = rows[0];
  result.spawnRet = await c.eval(`(async()=>{const x=window.__ctx;
    const bank=x.world.recordBanks?.freehold??[];
    const rec=bank.find(r=>r&&r.id==='${target.recordId}');
    if(!rec)return 'no-record';
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { isShipAssetReady, primeShipAsset } = await import('/src/systems/ship-assets.js');
    const tries=[{faction:'redledger',classKey:'cutter',role:'pirate'},{faction:'independent',classKey:'cutter',role:'pirate'}];
    for(const t of tries){ try{ await Promise.resolve(primeShipAsset(t.faction,t.classKey,t.role)); }catch(err){} }
    const readyOf=(t)=>{ try{ return isShipAssetReady(t.faction,t.classKey,t.role)===true; }catch(err){ return false; } };
    const deadline=Date.now()+15000;
    while(!tries.some(readyOf)&&Date.now()<deadline) await new Promise((r)=>setTimeout(r,200));
    if(!tries.some(readyOf)) return 'assets-never-ready';
    const THREE=await import('/node_modules/three/build/three.module.js').catch(()=>null);
    const p=x.ship.object.position;
    const at=THREE?new THREE.Vector3(p.x+240,p.y,p.z):{x:p.x+240,y:p.y,z:p.z};
    const live=spawnLiveShip(x,rec,at);
    if(!live)return 'spawn-refused';
    if(!x.ships.includes(live))x.ships.push(live);
    x.stationDesk.undock();
    x.targets.current=live;
    return 'locked-'+(live.record&&live.record.id===rec.id?'ok':'id-mismatch');})()`);
  await sleep(300);
  const spawnState = await c.eval(`(()=>{const x=window.__ctx;return {docked:x.flags.docked,ships:x.ships.length,lock:!!x.targets.current};})()`);
  result.spawnState = spawnState;
  const bracket = await c.eval(`(()=>{const hud=document.getElementById('hud');
    if(!hud)return {shown:false};
    let live=null;
    for(const n of hud.querySelectorAll('.rw-target')){
      if(n.classList.contains('is-hidden'))continue;
      const m=n.querySelector('.rw-target-name')?.textContent??'';
      if(String(m).trim()) { live=n; break; }
    }
    if(!live)return {shown:false};
    const name=live.querySelector('.rw-target-name')?.textContent??null;
    const meta=live.querySelector('.rw-target-meta')?.textContent??null;
    return {shown:true,name,meta};})()`);
  const observed = await c.eval(`(()=>{const x=window.__ctx;const row=window.rimward?.observe?.().targets?.current;return row?{contract:row.contract===true,name:row.name??null}:null;})()`);
  result.observed = observed;
  assert.ok(bracket.shown, 'the bracket is shown for the locked quarry: ' + JSON.stringify({ bracket, spawnRet: result.spawnRet, spawnState: result.spawnState }));
  assert.match(String(bracket.meta ?? ''), /CONTRACT/, 'the bracket meta carries CONTRACT: ' + JSON.stringify({ bracket, observed, spawnRet: result.spawnRet, spawnState: result.spawnState }));
  assert.equal(observed?.contract, true, 'observe() agrees on the contract mark');
  await checkpoint('contract-bracket');
  result.contractBracket = bracket;
});

console.log('issue-271 live: PASS');
