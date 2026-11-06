/**
 * Issue #267 live verification — combat feel and the named overlay refusal on
 * a real run: an engage lease keeps firing against a quarry that shoots back
 * (no 'evading' starvation), a typing-focus overlay refusal carries the
 * surface detail, and observe().availability agrees. Disposable Chromium,
 * loopback only. Console errors fail the run.
 *
 * Run: npm run test:issue267-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE267_OUT || resolve('out/issue-267-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');

await runLive('issue267', async ({ c, result, act, observe, wait, checkpoint }) => {
  let seq = 0;
  const nextSeq = () => ++seq;
  result.fixture = true;
  result.fixtureNote = 'The hostile is spawned beside the ship by hand (wave-30 harness discipline); fire-time reads are the running game.';

  // Lift the ship clear of traffic in the home system and spawn a cutter nearby.
  await c.eval(`(()=>{const x=window.__ctx;
    if(x.flags.docked) x.stationDesk.undock();
    x.flags.combat=false;
    x.ship.object.position.set(x.systems[x.world.currentSystem].station.position[0]+900,x.systems[x.world.currentSystem].station.position[1]+900,x.systems[x.world.currentSystem].station.position[2]+900);
    x.ship.velocity.set(0,0,0); x.ship.speed=0;
    return x.world.currentSystem;})()`);
  await sleep(300);

  const spawnRet = await c.eval(`(async()=>{const x=window.__ctx;
    const bank=x.world.recordBanks?.[x.world.currentSystem]??[];
    let rec=bank.find(r=>r&&r.role==='pirate'&&r.faction);
    if(!rec){
      const mk={ id:'issue267-hostile', name:'Reaver cutter', faction:'veridian', classKey:'cutter', role:'pirate', resolveSeed:0.7 };
      bank.push ? bank.push(mk) : null;
      rec=mk;
    }
    const { spawnLiveShip } = await import('/src/systems/npc.js');
    const { isShipAssetReady, primeShipAsset } = await import('/src/systems/ship-assets.js');
    const tries=[{faction:'redledger',classKey:'cutter',role:'pirate'},{faction:'veridian',classKey:'cutter',role:'pirate'},{faction:'independent',classKey:'cutter',role:'pirate'}];
    for(const tr of tries){ try{ await Promise.resolve(primeShipAsset(tr.faction,tr.classKey,tr.role)); }catch(err){} }
    const readyOf=(tr)=>{ try{ return isShipAssetReady(tr.faction,tr.classKey,tr.role)===true; }catch(err){ return false; } };
    const deadline=Date.now()+15000;
    while(!tries.some(readyOf)&&Date.now()<deadline) await new Promise((r)=>setTimeout(r,200));
    for(const tr of tries){
      if(!readyOf(tr)) continue;
      const THREE=await import('/node_modules/three/build/three.module.js').catch(()=>null);
      const p=x.ship.object.position;
      const at=THREE?new THREE.Vector3(p.x,p.y,p.z-260):{x:p.x,y:p.y,z:p.z-260};
      const useRec=rec&&rec.faction?rec:{ ...bank[0]||{}, faction:tr.faction, classKey:tr.classKey, role:tr.role, id:'issue267-hostile', name:'Reaver cutter', resolveSeed:0.7 };
      const live=spawnLiveShip(x,useRec,at);
      if(live){ if(!x.ships.includes(live))x.ships.push(live); x.targets.current=live; return { ok:true, id:live.id, faction:tr.faction }; }
    }
    return { ok:false };
  })()`);
  result.spawn = spawnRet;
  assert.ok(spawnRet && spawnRet.ok, 'spawned a hostile cutter: ' + JSON.stringify(spawnRet));

  // Lock it through the public API and grant engage.
  await sleep(300);
  await act('selectTarget', { id: spawnRet.id });
  await sleep(250);
  await wait((s) => s.targets.current && s.targets.current.id === spawnRet.id, 10, 'lock the hostile');
  result.grant = await act('setCombatIntent', { seq: nextSeq(), ttl: 45, targetId: spawnRet.id, intent: 'engage' });
  assert.equal(result.grant.ok, true, JSON.stringify(result.grant));
  await wait((s) => s.control && s.control.owner === 'combat', 10, 'combat lease active');

  // Sample the lease over 30 s of real game time; the game loop runs itself.
  const fire = await c.eval(`(async()=>{
    const x=window.__ctx, dt=1/60, span=30;
    let fireTime=0, evadeTime=0, hits=0, samples=0;
    const start=x.world.time;
    const end=start+span;
    let nextHit=start+1.0;
    const { agentControlStatus } = await import('/src/systems/controls.js');
    while(x.world.time<end){
      if(x.world.time>=nextHit){ nextHit+=0.9; hits++;
        x.emit('playerHit',{damage:6,family:'energy',fromAft:false,t:x.world.time});
        x.lastEvents=x.events; x.events=[]; }
      const st0=agentControlStatus(x);
      if(st0.combat){
        samples++;
        if(st0.combat.defense.phase==='evading')evadeTime+=dt;
        if(!st0.combat.fireBlocked)fireTime+=dt;
      }
      await new Promise((r)=>setTimeout(r,dt*1000*0.5));
    }
    return { fireTime:+fireTime.toFixed(1), evadeTime:+evadeTime.toFixed(1), hits, samples, span };
  })()`);
  result.combatFeel = fire;
  console.log('combat feel:', JSON.stringify(fire));
  assert.ok(fire.samples > 100, 'the lease was sampled while active: ' + JSON.stringify(fire));
  assert.ok(fire.fireTime >= 3, 'fire time recovers against a shooting quarry (>=3s of sampled time, got ' + fire.fireTime + 's; the #267 stall pinned this near 0-1s)');
  await checkpoint('combat-feel');

  // Overlay naming: close any open card first, then focus a text field.
  await c.eval(`(()=>{const x=window.__ctx;
    if(x.flags.hailOpen && x.hailApi && typeof x.hailApi.resolve==='function'){ try{ x.hailApi.resolve('dismiss'); }catch(err){} }
    x.flags.hailOpen=false; x.flags.chartOpen=false; x.flags.berthOpen=false;
    return { hailOpen:x.flags.hailOpen };})()`);
  await sleep(300);
  const overlay = await c.eval(`(async()=>{
    const input=document.createElement('input');
    input.style.position='fixed'; input.style.opacity='0';
    document.body.appendChild(input); input.focus();
    const api=window.rimward;
    const r=api.act({v:2,name:'setControl',args:{seq:9001,ttl:1}});
    const obs=api.observe().availability.setControl;
    input.blur(); input.remove();
    return { act:{ok:r.ok,token:r.token,detail:r.detail||''}, observe:{ok:obs.ok,reason:obs.reason,detail:obs.detail||''} };
  })()`);
  result.overlay = overlay;
  console.log('overlay refusal:', JSON.stringify(overlay));
  assert.equal(overlay.act.ok, false);
  assert.equal(overlay.act.token, 'overlay');
  assert.match(overlay.act.detail, /typing/);
  assert.equal(overlay.observe.reason, 'overlay');
  assert.match(overlay.observe.detail, /typing/);
  await checkpoint('overlay-named');

  // Clean lease release so the profile ends neutral.
  await act('clearControl'); // seq-free idempotent release
});

console.log('issue-267 live verification passed');
