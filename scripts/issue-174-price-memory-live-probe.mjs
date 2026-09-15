/** #174 isolated Chromium: actual market views, historical quotes and chart UI. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE174_OUT || resolve('out/issue-174-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const {runLive,sleep}=await import('./issue-74-live-harness.mjs');
await runLive('price-memory',async({c,result,act,wait,observe,checkpoint,shot})=>{
 result.fixture=true;
 result.method='Disposable Chromium; explicit berth placement and cross-system event fixture. Actual Market and chart UI, trusted mouse and keyboard inputs; no natural flight claim.';
 const place=()=>c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);
 const click=async selector=>{const box=await c.eval(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);assert.ok(box);for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,...box,button:'left',clickCount:1});await sleep(100);};
 const key=async(key,code)=>{for(const type of ['keyDown','keyUp'])await c.send('Input.dispatchKeyEvent',{type,key,code,text:type==='keyDown'&&code==='Enter'?'\r':'',windowsVirtualKeyCode:code==='Enter'?13:code==='KeyM'?77:0,nativeVirtualKeyCode:code==='Enter'?13:code==='KeyM'?77:0});await sleep(100);};
 await wait(s=>s.t>0.2,15,'first simulation frame');await place();await sleep(250);await act('dock');await wait(s=>s.flags.docked,15,'first dock');
 await act('openService',{id:'market'});
 const origin=(await observe()).world.currentSystem;
 await click('#market-memory-toggle');
 assert.match(await c.eval("document.getElementById('market-memory').innerText"),/No remembered price elsewhere/);
 await checkpoint('first-market');
 await place();await act('undock');await wait(s=>!s.flags.docked,15,'undock');
 const captured=await c.eval(`window.__ctx.world.priceMemory[${JSON.stringify(origin)}]`);
 assert.ok(captured.prices.provisions>0);
 // Load a second system through the normal subsystem event contract.
 const dest=origin==='veridian'?'freehold':'veridian';
 await c.eval(`(()=>{const x=window.__ctx;x.world.currentSystem=${JSON.stringify(dest)};x.emit('systemLoaded',{to:${JSON.stringify(dest)}});return true;})()`);
 await wait(s=>s.world.currentSystem===dest,15,'system swap');
 for(let i=0;i<100;i++){if(await c.eval(`(()=>{const x=window.__ctx,p=x.systems[${JSON.stringify(dest)}].station.position;return x.station.position.distanceTo({x:p[0],y:p[1],z:p[2]})<1;})()`))break;await sleep(200);}
 await place();await sleep(300);await act('dock');await wait(s=>s.flags.docked,15,'second dock');
 await c.eval(`window.__ctx.world.time=${captured.at+720}`);
 await act('openService',{id:'market'});
 let row=(await observe()).market.rows.find(r=>r.commodity==='provisions').remembered;
 assert.equal(row.sell,captured.prices.provisions);assert.equal(row.systemId,origin);assert.match(row.age,/12 min ago/);
 await c.eval(`window.__ctx.world.markets[${JSON.stringify(origin)}].provisions=999999`);
 assert.equal((await observe()).market.rows.find(r=>r.commodity==='provisions').remembered.sell,row.sell);
 if(!await c.eval("!!document.getElementById('market-memory')"))await click('#market-memory-toggle');
 assert.ok((await c.eval("document.getElementById('market-memory').innerText")).includes(`${row.sell} UU · ${row.station}, ${row.age}`));
 await checkpoint('remembered-market');
 // Native keyboard activation and focus survive the normal one-second refresh.
 await c.eval("document.getElementById('market-memory-toggle').focus()");await key('Enter','Enter');
 assert.equal(await c.eval("document.getElementById('market-memory-toggle').getAttribute('aria-expanded')"),'false');
 await key('Enter','Enter');await sleep(1400);
 assert.equal(await c.eval('document.activeElement?.id'),'market-memory-toggle');
 await c.send('Emulation.setDeviceMetricsOverride',{width:800,height:700,deviceScaleFactor:1,mobile:false});
 await click('#market-memory-toggle');await click('#market-memory-toggle');
 const layout=await c.eval("(()=>{const e=document.getElementById('market-memory'),r=e.getBoundingClientRect();return{width:innerWidth,left:r.left,right:r.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};})()");
 assert.ok(layout.left>=0&&layout.right<=layout.width&&layout.scrollWidth<=layout.clientWidth+1);result.narrowLayout=layout;
 await shot('remembered-market-800');
 await place();await act('undock');await wait(s=>!s.flags.docked,15,'chart undock');await key('m','KeyM');
 assert.equal((await observe()).flags.chartOpen,true);
 // Dispatch the native select's change path; toggle above uses trusted keyboard events.
 await c.eval(`(()=>{const e=document.getElementById('rw-galaxy-dest');e.focus();e.value=${JSON.stringify(origin)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const chart=await c.eval("document.querySelector('.rw-galaxy-hover-prices').innerText");
 assert.ok(chart.includes(`Provisions ${row.sell} UU`));assert.ok(chart.includes(row.station));assert.match(chart,/Remembered SELL/);result.chartRemembered=chart;
 await shot('remembered-chart-800');
 const unseen=await c.eval("(()=>{const e=document.getElementById('rw-galaxy-dest');const option=Array.from(e.options).find(o=>o.value&&!Object.hasOwn(window.__ctx.world.priceMemory,o.value));if(!option)return null;e.value=option.value;e.dispatchEvent(new Event('change',{bubbles:true}));return option.value;})()");
 assert.ok(unseen,'an actual chart option has no market visit');result.unseenSystem=unseen;
 assert.equal(await c.eval("document.querySelector('.rw-galaxy-hover-prices').innerText"),'No remembered market prices.');
 result.checks=['actual view capture','unseen empty state','second dock best historical quote','remote mutation isolation','pane/API parity','keyboard toggle','refresh focus','800px wrapping','chart remembered selection','unvisited chart'];
});
