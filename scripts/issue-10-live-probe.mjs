/** Issue #10 live pacing observation. Run: ISSUE10_OUT=<evidence> node scripts/issue-10-live-probe.mjs. ISSUE10_ORIGIN=greenhand|beautiful selects one natural run; ISSUE10_PURSUIT=1 selects the synthetic pursuit flow. Uses a fresh disposable loopback Chrome profile per origin and normal rendered animation time. Seeded Math.random is the only natural-scenario fixture; no game state or clock injection. */
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {createServer} from 'node:net';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const out=resolve(process.env.ISSUE10_OUT||join(repo,'out','issue-10-live'));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// Hail payloads may overwrite event.t with a countdown. Only the capture's
// independent world clock may classify an event into a pacing window.
export function pacingEventWindows(events) {
  if(events.some(e=>!Number.isFinite(e.observedWorldTime)))throw Error('Pacing event lacks observed world time');
  return {
    firstMinuteEvents:events.filter(e=>e.observedWorldTime>=0&&e.observedWorldTime<=60),
    afterGraceEvents:events.filter(e=>e.observedWorldTime>=180),
  };
}
export function requireAccepted(receipt,label) {
  if(receipt?.ok!==true)throw Error(label+' refused '+JSON.stringify(receipt));
}
const NATURAL_CHECKPOINTS=['01-stock-start','02-first-minute','03-docked','04-launched','05-left-law-zone','06-after-starter-grace','07-return-outcome','08-return-launch','09-extended-window'];
export function requirePacingComplete(result) {
  requireAccepted(result.initialDock?.receipt,'Initial dock');
  requireAccepted(result.returnAttempt?.receipt,'Return dock');
  if(result.initialDock.completed!==true||result.returnAttempt.completed!==true)throw Error('Natural pacing did not complete both docks');
  const checkpoints=result.checkpoints??[];
  if(checkpoints.length!==NATURAL_CHECKPOINTS.length||checkpoints.some((c,i)=>c.name!==NATURAL_CHECKPOINTS[i]))throw Error('Natural pacing skipped or reordered a required checkpoint');
  for(const c of checkpoints){
    if(c.observation?.session?.phase!=='playing')throw Error('Natural pacing left play at '+c.name);
    if(['03-docked','07-return-outcome'].includes(c.name)&&c.observation.flags?.docked!==true)throw Error('Not docked at '+c.name);
    if(['04-launched','05-left-law-zone','08-return-launch'].includes(c.name)&&c.observation.flags?.docked!==false)throw Error('Not launched at '+c.name);
  }
  const outside=checkpoints[4].observation.station?.range;
  if(!Number.isFinite(outside)||outside<=300)throw Error('Natural pacing never crossed outside the 300u law zone');
  for(const [i,time] of [[1,60],[5,190],[8,240]])if(!(checkpoints[i].observation.t>=time))throw Error('Pacing time window not reached at '+checkpoints[i].name);
}
async function sourceHash(){const files=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','src'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim().split(/\r?\n/).filter(Boolean).sort();const hash=createHash('sha256');for(const f of [...new Set(files)]){hash.update(f);hash.update(await readFile(join(repo,f)));}return hash.digest('hex');}
async function port(){const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function stop(p){if(!p?.pid)return {started:false};if(p.exitCode!==null)return {pid:p.pid,exitCode:p.exitCode,exited:true};let error=null;try{p.kill('SIGTERM');}catch(e){error=String(e);}for(let i=0;i<50&&p.exitCode===null&&p.signalCode===null;i++)await sleep(100);return {pid:p.pid,exitCode:p.exitCode,signal:p.signalCode,exited:p.exitCode!==null||p.signalCode!==null,error};}
class CDP{
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.console=[];this.exceptions=[];this.ws.addEventListener('close',()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('CDP socket closed'));}this.pending.clear();});this.ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}if(m.method==='Runtime.consoleAPICalled')this.console.push({type:m.params.type,text:m.params.args.map(a=>a.value??a.description??'').join(' ')});if(m.method==='Runtime.exceptionThrown')this.exceptions.push(m.params.exceptionDetails);});}
  ready(){return new Promise((r,j)=>{this.ws.addEventListener('open',r,{once:true});this.ws.addEventListener('error',j,{once:true});});}
  send(method,params={}){const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},Number(process.env.ISSUE10_CDP_TIMEOUT||30000));this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
}
async function runLive(name,origin,seed,fn){
  await mkdir(out,{recursive:true});const folder=join(out,name);await mkdir(folder,{recursive:true});
  const resumed=process.env.ISSUE10_RESUME_PROFILE?resolve(process.env.ISSUE10_RESUME_PROFILE):null;
  if(resumed&&!resumed.toLowerCase().startsWith((out+sep).toLowerCase()))throw Error('Resume profile must be inside the named issue evidence output');
  const profile=resumed||await mkdtemp(join(folder,'profile-')),cache=join(folder,'vite-cache');
  const config=join(folder,'vite.config.mjs');await mkdir(dirname(config),{recursive:true});
  await writeFile(config,`export default {root:${JSON.stringify(repo)},cacheDir:${JSON.stringify(cache)}};`);
  const p=process.env.ISSUE10_PORT?Number(process.env.ISSUE10_PORT):await port();if(!Number.isInteger(p)||p<1024||p>65535)throw Error('Invalid loopback port');let vite,chrome,c;
  const result={probeSha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),name,origin,seed,profile,started:new Date().toISOString(),fixture:false,actions:[],checkpoints:[],samples:[],consoleErrors:[],exceptions:[]};
  result.rendererConfig=process.env.ISSUE10_RENDERER||'platform';
  result.resumedProfile=!!resumed;
  result.sourceHashStart=await sourceHash();result.headCommit=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim();result.workingTreeDirty=!!spawnSync('git',['status','--porcelain'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim();result.runtimeSourceDirty=!!spawnSync('git',['status','--porcelain','--','src'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim();
  const save=()=>writeFile(join(folder,'result.json'),JSON.stringify(result,null,2));
  try{
    vite=spawn(process.execPath,[fileURLToPath(new URL('../../bin/vite.js',import.meta.resolve('vite'))),'--config',config,'--host','127.0.0.1','--port',String(p),'--strictPort'],{cwd:repo,windowsHide:true,stdio:['ignore','pipe','pipe']});
    result.vitePid=vite.pid;result.port=p;
    vite.stderr.on('data',b=>console.log('VITE',String(b).trim()));
    for(let i=0;i<100;i++){if(await fetch(`http://127.0.0.1:${p}`).then(r=>r.ok).catch(()=>false))break;if(vite.exitCode!==null)throw Error('Vite exited');await sleep(250);}
    chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check',...(result.rendererConfig==='swiftshader'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]),'--ignore-gpu-blocklist','--enable-webgl','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--window-size=1440,900','--headless=new','--disable-background-timer-throttling','--disable-renderer-backgrounding','--no-sandbox','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    result.chromePid=chrome.pid;await save();
    const errors=[];chrome.stderr.on('data',b=>{errors.push(String(b).slice(0,500));result.chromeStderr=errors;});
    let pages;for(let i=0;i<120;i++){try{const cp=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0]);pages=await fetch(`http://127.0.0.1:${cp}/json/list`).then(r=>r.json());if(pages.some(p=>p.type==='page')){result.cdpPort=cp;break;}}catch{}if(chrome.exitCode!==null)throw Error('Chrome exited '+errors.slice(-3));await sleep(250);}
    c=new CDP(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await c.ready();await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Page.addScriptToEvaluateOnNewDocument',{source:'let issue10Seed='+seed+';Math.random=()=>{issue10Seed=(Math.imul(issue10Seed,1664525)+1013904223)>>>0;return issue10Seed/4294967296;};'});await c.send('Page.navigate',{url:`http://127.0.0.1:${p}/?agent=1`});
    const observe=()=>c.eval('window.rimward.observe()');
    const act=async(name,args={},must=true)=>{const r=await c.eval(`window.rimward.act(${JSON.stringify({v:2,name,args})})`);result.actions.push({at:Date.now(),name,args,result:r});if(must&&!r.ok)throw Error(name+' refused '+JSON.stringify(r));return r;};
    const shot=async name=>{const s=await c.send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,name+'.png'),Buffer.from(s.data,'base64'));};
    const checkpoint=async name=>{const observation=await observe();const panel=await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?{text:p.innerText,rect:p.getBoundingClientRect().toJSON(),scrollWidth:document.documentElement.scrollWidth,width:innerWidth}:null})()`);result.checkpoints.push({name,at:Date.now(),observation,panel});console.log('CHECKPOINT',name,observation.t,observation.world.currentSystem,observation.world.credits);await save();await shot(name);return observation;};
    // Limits are simulation seconds, with a separate 4x wall cap for software
    // rendering. Neither bound becomes an active-search-time measurement.
    const wait=async(pred,seconds,label,sample)=>{const began=Date.now(),end=began+Math.max(60000,seconds*4000);let s,startT;while(Date.now()<end){s=await observe();startT??=s.t;if(sample)await sample(s);if(pred(s))return s;if(s.t-startT>=seconds)break;await sleep(300);}throw Error('timeout '+label+' '+JSON.stringify({t:s?.t,worldElapsed:s?.t-startT,wallElapsed:(Date.now()-began)/1000,flags:s?.flags,ap:s?.autopilot}));};
    for(let i=0;i<160;i++){if(await c.eval('!!window.rimward'))break;await sleep(300);}
    let s=await observe();if(s.session.phase==='title')await act('startGame');s=await observe();if(s.session.phase==='origin')await act('chooseOrigin',{id:origin});await wait(s=>s.session.phase==='playing',25,'playing');
    result.graphics=await c.eval(`(()=>{const canvas=document.querySelector('canvas'),g=canvas?.getContext('webgl2');if(!g)return null;const e=g.getExtension('WEBGL_debug_renderer_info');return {renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),vendor:e?g.getParameter(e.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR)};})()`);console.log('BOOT',name,JSON.stringify(result.graphics));
    await fn({c,result,save,observe,act,shot,checkpoint,wait,folder});
    result.consoleErrors=c.console.filter(e=>['error','assert'].includes(e.type));result.exceptions=c.exceptions;
    if(result.consoleErrors.length||result.exceptions.length)throw Error('Browser console errors or exceptions');
    result.verdict='PASS';
  }catch(e){result.error=e.stack;result.verdict='FAIL';console.error(e.stack);process.exitCode=1;}
  finally{if(c){try{result.partialMeasurements=await c.eval('window.__issue10Pursuit || window.__issue10 || null');}catch{}result.consoleErrors=c.console.filter(e=>['error','assert'].includes(e.type));result.exceptions=c.exceptions;try{await c.send('Browser.close');result.browserCloseRequested=true;}catch(e){result.browserCloseError=String(e);}c.ws.close();for(let i=0;i<80&&chrome?.exitCode===null;i++)await sleep(100);}result.cleanup={chrome:await stop(chrome),vite:await stop(vite)};
    const responds=async port=>port?fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(1500)}).then(()=>true).catch(()=>false):false;
    result.closedPorts={vite:!(await responds(result.port)),cdp:!(await responds(result.cdpPort))};
    if(Object.values(result.cleanup).some(p=>p.started!==false&&!p.exited)||Object.values(result.closedPorts).some(closed=>!closed)){result.verdict='FAIL';result.cleanupFailed=true;process.exitCode=1;}result.finished=new Date().toISOString();result.sourceHashEnd=await sourceHash();result.sourceStable=result.sourceHashStart===result.sourceHashEnd;if(!result.sourceStable){result.verdict='FAIL';result.sourceChanged=true;process.exitCode=1;}await save();console.log(name,result.verdict);}
  return result;
}

async function pacing(h) {
  const {c,result,act,observe,checkpoint,save}=h;
  result.method='Seeded Math.random before boot, stock origin through public actions; real requestAnimationFrame time with no clock acceleration, NPC injection, transform injection or defensive-stat mutation. Both issue the public full-stop command and read controls for their first minute. Both dock, launch, leave station law space, wait beyond world.time 180, and attempt a public autopilot return.';
  result.fixture='RNG only: LCG a=1664525 c=1013904223 modulus=2^32. Frame cadence can alter random call ordering, so seeds identify samples rather than exact replay trajectories.';
  result.assertionScope='PASS means this measurement run completed with clean browser console and stable runtime source; it is not independent QA of this probe or proof of global encounter frequency.';
  await c.eval(`(()=>{
    const ctx=window.__ctx,seen=new WeakSet();
    const p=window.__issue10={samples:[],events:[],began:performance.now(),firstTarget:null,firstIntent:null,frames:0,minHull:ctx.player.hull,minScreen:ctx.player.screen,minShell:ctx.player.shell,running:true};
    let last=-Infinity;
    function tick(){if(!p.running)return;p.frames++;const now=ctx.world.time,station=ctx.config.world.stationPosition,dist=ctx.ship.object.position.distanceTo(station);
      const targets=ctx.ships.filter(s=>s.ai?.target==='player').map(s=>({id:s.id,role:s.ai.role,mode:s.ai.mode,intent:!!s.ai.intent,phase:s.ai.phase,distance:s.object.position.distanceTo(ctx.ship.object.position)}));
      if(targets.length&&!p.firstTarget)p.firstTarget={t:now,dist,targets};
      if(targets.some(s=>s.intent)&&!p.firstIntent)p.firstIntent={t:now,dist,targets};
      p.minHull=Math.min(p.minHull,ctx.player.hull);p.minScreen=Math.min(p.minScreen,ctx.player.screen);p.minShell=Math.min(p.minShell,ctx.player.shell);
      for(const e of [...ctx.lastEvents,...ctx.events]){if(seen.has(e))continue;seen.add(e);if(['playerHit','pirateDemand','hostileEnter','playerDestroyed','hailOpened','sunKill','sunHeat'].includes(e.type)||(e.type==='npcFire'&&e.target==='player'))p.events.push({type:e.type,t:e.t,observedWorldTime:now,wallSeconds:(performance.now()-p.began)/1000,damage:e.damage,family:e.family,weapon:e.weapon,shipId:e.ship?.id,stationDistance:dist});}
      if(now-last>=1){last=now;p.samples.push({t:now,wallSeconds:(performance.now()-p.began)/1000,stationDistance:dist,position:ctx.ship.object.position.toArray(),speed:ctx.ship.speed,hull:ctx.player.hull,screen:ctx.player.screen,shell:ctx.player.shell,docked:ctx.flags.docked,combat:ctx.flags.combat,shipCount:ctx.ships.length,targets});}
      requestAnimationFrame(tick);
    }requestAnimationFrame(tick);return true;
  })()`);
  const start=await checkpoint('01-stock-start');
  result.initial=start;result.wallStart=Date.now();
  let seq=0;
  const controls=async(throttle)=>{
    let s=await observe();
    if(s.hail.open&&s.hail.intents.includes('letGo')){
      (result.ambientHailResolutions??=[]).push({t:s.t,hail:s.hail,receipt:await act('hailResolve',{intent:'letGo',expectedConversationId:s.hail.conversationId})});
    }
    return act('setControl',{seq:++seq,ttl:2,throttle,steerX:0,steerY:0});
  };
  async function launch(){
    const began=(await observe()).t,wall=Date.now();
    while(true){const r=await act('undock',{},false);if(r.ok)return r;
      if(r.token!=='blocked'||r.t-began>60||Date.now()-wall>180000)throw Error('Bounded launch unavailable '+JSON.stringify(r));
      (result.launchHolds??=[]).push(r);await sleep(750);
    }
  }
  async function until(targetT,{throttle}={}){
    const cap=Date.now()+Math.max(60000,(targetT-(await observe()).t)*5000);
    let s;
    while((s=await observe()).t<targetT){if(Date.now()>cap)throw Error('World-time progress timeout '+targetT);if(s.session.phase!=='playing')throw Error('Left play: '+s.session.phase);if(throttle!==undefined)await controls(throttle);await sleep(400);}
    return s;
  }
  await until(60,{throttle:0});await act('clearControl');
  await checkpoint('02-first-minute');
  const dock=await act('approachDock',{},false);
  result.initialDock={receipt:dock,requestedAt:(await observe()).t};
  requireAccepted(dock,'Initial dock');
  let cap=Date.now()+180000,s;
  while(!(s=await observe()).flags.docked&&Date.now()<cap){await sleep(300);}
  result.initialDock.completed=s.flags.docked;
  if(!s.flags.docked)throw Error('Initial dock timed out');
  await checkpoint('03-docked');await launch();
  if((await checkpoint('04-launched')).flags.docked)throw Error('Initial launch did not leave the dock');
  const leaveAt=(await observe()).t;await until(leaveAt+12,{throttle:.35});await until(leaveAt+18,{throttle:0});await act('clearControl');
  const outside=await checkpoint('05-left-law-zone');
  if(outside.flags.docked||!(outside.station.range>300))throw Error('Departure did not cross outside the 300u law zone');
  await until(190);await checkpoint('06-after-starter-grace');
  result.returnAttempt={requestedAt:(await observe()).t,receipt:await act('approachDock',{},false)};
  requireAccepted(result.returnAttempt.receipt,'Return dock');
  const began=(await observe()).t;cap=Date.now()+180000;
  while(!(s=await observe()).flags.docked&&s.t-began<120&&Date.now()<cap){await sleep(300);}
  result.returnAttempt.completed=s.flags.docked;result.returnAttempt.finishedAt=s.t;
  if(!s.flags.docked)throw Error('Return dock timed out');
  await checkpoint('07-return-outcome');await launch();
  if((await checkpoint('08-return-launch')).flags.docked)throw Error('Return launch did not leave the dock');
  await until(240);await checkpoint('09-extended-window');
  requirePacingComplete(result);
  result.measurements=await c.eval('(()=>{window.__issue10.running=false;return window.__issue10;})()');
  result.wallElapsedSeconds=(Date.now()-result.wallStart)/1000;
  result.worldElapsedSeconds=(await observe()).t-start.t;
  result.summary={frames:result.measurements.frames,firstTarget:result.measurements.firstTarget,firstIntent:result.measurements.firstIntent,minHull:result.measurements.minHull,minScreen:result.measurements.minScreen,minShell:result.measurements.minShell,events:result.measurements.events.reduce((n,e)=>(n[e.type]=(n[e.type]||0)+1,n),{}),...pacingEventWindows(result.measurements.events)};
  await save();
}
async function pursuit(h){
  const {c,result,act,observe,checkpoint,save}=h;let seq=0;
  result.method='Controlled hostile boundary scenario, not a natural encounter-frequency sample. One existing healthy pirate is placed with player outside station law at world.time200, with forced player interest and high pirate personality/resolve to sustain this adversarial control. Native update, native hail refusal, public manual steering and unmodified player defenses thereafter.';
  await act('setControl',{seq:++seq,ttl:2,throttle:0});await sleep(2500);
  result.fixture=await c.eval(`(async()=>{const x=window.__ctx,station=x.config.world.stationPosition;let s=x.ships.find(s=>s.ai?.role==='pirate'&&!s.state.destroyed&&!s.state.disabled&&!s.state.surrendered);let instantiated=false;if(!s){const r=x.world.records.find(r=>r.role==='pirate'&&r.state==='enroute'&&!r.live&&!r.qship&&!r.escape);if(!r)throw Error('No eligible native pirate record');await (await import('/src/systems/ship-assets.js')).primeShipAsset(r.faction,r.classKey,r.role);s=(await import('/src/systems/npc.js')).spawnLiveShip(x,r,station.clone().add(station.clone().set(740,0,0)));if(!s)throw Error('Native pirate asset not ready');x.ships.push(s);r.live=true;instantiated=true;}x.world.time=200;x.world.jumpGraceUntil=0;x.ship.object.position.copy(station).add(x.ship.object.position.clone().set(600,0,0));x.ship.velocity.set(0,0,0);x.ship.speed=0;const from=station.clone().set(0,0,-1);x.ship.object.quaternion.setFromUnitVectors(from,station.clone().set(-1,0,0));s.object.position.copy(station).add(station.clone().set(740,0,0));s.object.quaternion.setFromUnitVectors(from,station.clone().set(-1,0,0));s.velocity?.set(0,0,0);s.state.personality=50;s.state.resolve=95;Object.assign(s.ai,{mode:'hunt',target:null,intent:false,phase:null,playerRolled:true,playerInterested:true,calmUntil:0});window.__issue10Hunter=s;const p=window.__issue10Pursuit={events:[],samples:[],running:true,began:performance.now()},seen=new WeakSet();let last=-Infinity;function tick(){if(!p.running)return;const d=x.ship.object.position.distanceTo(station);for(const e of [...x.lastEvents,...x.events]){if(seen.has(e))continue;seen.add(e);if(['playerHit','playerDestroyed','pirateDemand','hailOpened','sunKill','sunHeat'].includes(e.type)||(e.type==='npcFire'&&e.target==='player'))p.events.push({type:e.type,t:e.t,observedWorldTime:x.world.time,weapon:e.weapon,shipId:e.ship?.id,damage:e.damage,family:e.family,stationDistance:d});}if(x.world.time-last>=.1){last=x.world.time;p.samples.push({t:x.world.time,stationDistance:d,hunterStationDistance:s.object.position.distanceTo(station),target:s.ai.target==='player'?'player':null,intent:s.ai.intent,phase:s.ai.phase,mode:s.ai.mode,hull:x.player.hull,screen:x.player.screen,shell:x.player.shell});}requestAnimationFrame(tick);}requestAnimationFrame(tick);return {instantiatedFromNativeRecord:instantiated,hunterId:s.id,hunterRole:s.ai.role,hunterClass:s.state.classKey,worldTime:200,playerStationDistance:600,hunterStationDistance:740,forcedInterest:true,forcedHunterPersonality:50,forcedHunterResolve:95,playerDefenseMutation:false};})()`);
  const read=()=>c.eval('(()=>{const x=window.__ctx,s=window.__issue10Hunter;return {t:x.world.time,stationDistance:x.ship.object.position.distanceTo(x.config.world.stationPosition),hunterStationDistance:s.object.position.distanceTo(x.config.world.stationPosition),target:s.ai.target==="player"?"player":null,intent:s.ai.intent,phase:s.ai.phase,fireCount:window.__issue10Pursuit.events.filter(e=>e.type==="npcFire"&&e.shipId===s.id).length};})()');
  const control=(throttle,steerX=0)=>act('setControl',{seq:++seq,ttl:2,throttle,steerX,steerY:0});
  async function bounded(label,predicate,step,maxSeconds=30){const start=(await read()).t,wall=Date.now();let s;while(!(predicate(s=await read()))){if(s.t-start>maxSeconds||Date.now()-wall>maxSeconds*4000)throw Error('Pursuit timeout '+label+' '+JSON.stringify(s));const o=await observe();if(o.hail.open){const intent=o.hail.intents.includes('refuseFight')?'refuseFight':o.hail.intents.includes('letGo')?'letGo':null;if(intent)(result.hailResponses??=[]).push({t:o.t,hail:o.hail,receipt:await act('hailResolve',{intent,expectedConversationId:o.hail.conversationId})});}if(step)await step(s);await sleep(150);}return s;}
  await checkpoint('01-forced-outside');
  result.pursuit=await bounded('native hostile shots',s=>s.fireCount>=2,()=>control(0));await checkpoint('02-hostile-pursuit');
  result.lawEntry=await bounded('ordinary flight into law',s=>s.stationDistance<240,()=>control(.55));await control(0);await sleep(400);await act('clearControl');
  result.entrySnapshot=await checkpoint('03-return-inside-law');
  const entry=(await read()).t;await bounded('settled law suppression',s=>s.t>=entry+5);
  result.inside=await read();if(result.inside.intent)throw Error('Hostile intent continued inside law');
  const o=await observe();let facing=o.ship.fwd[0];
  const turnStart=(await read()).t;
  while(facing<.95){if((await read()).t-turnStart>15)throw Error('Public outward turn timeout');await control(0,1);await sleep(120);facing=(await observe()).ship.fwd[0];}
  await control(0,0);
  result.departure=await bounded('ordinary departure beyond law',s=>s.stationDistance>450,()=>control(.45));await control(0);
  result.reacquisition=await bounded('native reacquisition',s=>s.intent&&s.target==='player',()=>control(0),60);await checkpoint('04-departure-reacquisition');await act('clearControl');
  result.measurements=await c.eval('(()=>{window.__issue10Pursuit.running=false;return window.__issue10Pursuit;})()');
  result.insideLawShots=result.measurements.events.filter(e=>e.type==='npcFire'&&e.shipId===result.fixture.hunterId&&e.t>result.lawEntry.t&&e.t<result.departure.t&&e.stationDistance<300);
  if(result.insideLawShots.length)throw Error('Hunter fired while player inside law');await save();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.env.ISSUE10_PURSUIT==='1')await runLive('controlled-pursuit','greenhand',303,pursuit);
  else{
    const origins=process.env.ISSUE10_ORIGIN?[process.env.ISSUE10_ORIGIN]:['greenhand','beautiful'];
    if(origins.some(o=>!['greenhand','beautiful'].includes(o)))throw Error('Unsupported origin');
    await Promise.all(origins.map(origin=>runLive('natural-'+origin,origin,origin==='greenhand'?101:202,pacing)));
  }
}
