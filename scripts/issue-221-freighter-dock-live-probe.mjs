/** #221 live: actual rendered freighter arrival plus persistent HUD receipt. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT ||= resolve('out/issue-221/live');
const { runLive } = await import('./issue-74-live-harness.mjs');
await runLive('freighter', async ({c,result,act,wait,checkpoint}) => {
  result.fixture = true;
  result.method = 'Seed 7; disclosed dock/credit fixture for real Yard purchase + Hangar mount; initial arrival-gate pose only. Then one approachDock with real rendered flight/traffic/collision. Separate synthetic disengage fixture tests persistent HUD receipt and retry clearing.';
  result.mount = await c.eval(`(async()=>{
    const ctx=window.__ctx;
    const {purchaseYardHull}=await import('/src/game/shipyard.js');
    const {switchTo}=await import('/src/game/hangar.js');
    const {SYSTEMS}=await import('/src/game/state.js');
    ctx.flags.docked=true;ctx.world.credits=100000;
    const bought=purchaseYardHull(ctx,'freighter');
    if(!bought.ok)throw Error(JSON.stringify(bought));
    const mounted=switchTo(ctx,bought.row.id);
    if(!mounted.ok)throw Error(JSON.stringify(mounted));
    ctx.flags.docked=false;ctx.station.inZone=false;
    const gate=SYSTEMS.freehold.gates.find(g=>g.to==='veridian');
    ctx.ship.object.position.fromArray(gate.position);ctx.ship.object.quaternion.identity();
    ctx.ship.velocity.set(0,0,0);ctx.ship.speed=0;
    const evidence=window.__dock221={hits:[],phases:[],start:ctx.world.time};
    const emit=ctx.emit;
    ctx.emit=function(type,data){if(['bodyHit','sunHeat','playerDestroyed'].includes(type))evidence.hits.push({type,...data});return emit.call(this,type,data);};
    return {classKey:ctx.player.classKey,hull:ctx.player.hullMax,hold:ctx.cargoCapacity,start:evidence.start};
  })()`);
  assert.equal(result.mount.classKey,'freighter');assert.equal(result.mount.hull,220);assert.equal(result.mount.hold,160);
  await act('approachDock');
  await checkpoint('arrival-helm');
  await wait(s=>s.flags.docked || (s.autopilot?.mode==='dock' && !s.autopilot.engaged),95,'one freighter approach',async s=>{
    if(s.autopilot?.phase && !result.samples.some(r=>r.phase===s.autopilot.phase))result.samples.push({t:s.t,phase:s.autopilot.phase});
  });
  const docked=await checkpoint('freighter-berthed');
  result.flight=await c.eval('({ ...window.__dock221,elapsed:window.__ctx.world.time-window.__dock221.start,docked:window.__ctx.flags.docked,ap:{...window.__ctx.autopilot}})');
  assert.equal(docked.flags.docked,true);assert.deepEqual(result.flight.hits,[]);assert.ok(result.flight.elapsed<85);
  // Deliberate controller handback fixture, not a claim of a natural collision.
  await c.eval(`(async()=>{const ctx=window.__ctx;const {disengage}=await import('/src/game/autopilot.js');ctx.flags.docked=false;ctx.station.inZone=false;ctx.ship.object.position.set(ctx.station.position.x+700,ctx.station.position.y,ctx.station.position.z);ctx.ship.velocity.set(0,0,0);ctx.ship.speed=0;ctx.autopilot.engaged=true;ctx.autopilot.mode='dock';disengage(ctx,'blocked');})()`);
  const readReceipt = ()=>c.eval(`(()=>{const n=document.querySelector('[data-dock-failure]');const r=n?.getBoundingClientRect();return {text:n?.textContent,visible:!!n&&!n.classList.contains('is-hidden')&&r.width>0&&r.height>0,rect:r?.toJSON(),width:innerWidth,scroll:document.documentElement.scrollWidth};})()`);
  await new Promise(r=>setTimeout(r,400));
  result.receipt=await readReceipt();assert.equal(result.receipt.visible,true);assert.match(result.receipt.text,/route is blocked/);
  await checkpoint('blocked-receipt');
  await act('approachDock');
  await wait(s=>s.autopilot.engaged,2,'fresh approach accepted');
  await new Promise(r=>setTimeout(r,400));
  result.clearedReceipt=await readReceipt();assert.equal(result.clearedReceipt.visible,false);
  await act('cancelAutopilot');
  await checkpoint('manual-cancel');
},{seed:7});
