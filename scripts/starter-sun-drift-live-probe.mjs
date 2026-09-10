/** Fresh untouched starts in real rendered time. DRIFT_OUT=<evidence> node
 * scripts/starter-sun-drift-live-probe.mjs --expected original|safe
 * Default untouched scenario has RNG seed 1 only and no controls/hail clearing.
 * DRIFT_SCENARIO=forward sends public .5 throttle; neither injects transforms/time.
 * Launcher adapted from issue-10-live-probe.mjs; each run owns its profile. */
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {createServer} from 'node:net';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const out=resolve(process.env.DRIFT_OUT||join(repo,'out','starter-sun-drift-live'));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function git(args){const r=spawnSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error('Git capture failed: '+args.join(' '));return r.stdout.trim();}
async function sourceHash(){const files=git(['ls-files','--cached','--others','--exclude-standard','src']).split(/\r?\n/).filter(Boolean).sort();if(!files.length)throw Error('Empty runtime file list');const hash=createHash('sha256');for(const f of [...new Set(files)]){hash.update(f);hash.update(await readFile(join(repo,f)));}return hash.digest('hex');}
async function port(){const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function stop(p){if(!p?.pid)return {started:false};if(p.exitCode!==null)return {pid:p.pid,exitCode:p.exitCode,exited:true};let error=null;try{p.kill('SIGTERM');}catch(e){error=String(e);}for(let i=0;i<50&&p.exitCode===null&&p.signalCode===null;i++)await sleep(100);return {pid:p.pid,exitCode:p.exitCode,signal:p.signalCode,exited:p.exitCode!==null||p.signalCode!==null,error};}
class CDP{
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.console=[];this.exceptions=[];this.ws.addEventListener('close',()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('CDP socket closed'));}this.pending.clear();});this.ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}if(m.method==='Runtime.consoleAPICalled')this.console.push({type:m.params.type,text:m.params.args.map(a=>a.value??a.description??'').join(' ')});if(m.method==='Runtime.exceptionThrown')this.exceptions.push(m.params.exceptionDetails);});}
  ready(){return new Promise((r,j)=>{this.ws.addEventListener('open',r,{once:true});this.ws.addEventListener('error',j,{once:true});});}
  send(method,params={}){if(this.ws.readyState!==WebSocket.OPEN)return Promise.reject(Error('CDP socket not open'));const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},Number(process.env.DRIFT_CDP_TIMEOUT||30000));this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
}
async function runLive(name,origin,seed,fn){
  await mkdir(out,{recursive:true});const folder=join(out,name);await mkdir(folder);
  const profile=await mkdtemp(join(folder,'profile-')),cache=join(folder,'vite-cache');
  const config=join(folder,'vite.config.mjs');await mkdir(dirname(config),{recursive:true});
  await writeFile(config,`export default {root:${JSON.stringify(repo)},cacheDir:${JSON.stringify(cache)}};`);
  const p=process.env.DRIFT_PORT?Number(process.env.DRIFT_PORT):await port();if(!Number.isInteger(p)||p<1024||p>65535)throw Error('Invalid loopback port');let vite,chrome,c;
  const result={probeSha256:createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),name,origin,seed,profile,started:new Date().toISOString(),fixture:false,actions:[],checkpoints:[],samples:[],consoleErrors:[],exceptions:[]};
  result.rendererConfig=process.env.DRIFT_RENDERER||'platform';
  result.sourceHashStart=await sourceHash();result.headCommit=git(['rev-parse','HEAD']);result.workingTreeDirty=!!git(['status','--porcelain']);result.runtimeSourceDirty=!!git(['status','--porcelain','--','src']);
  const save=()=>writeFile(join(folder,'result.json'),JSON.stringify(result,null,2));
  try{
    vite=spawn(process.execPath,[fileURLToPath(new URL('../../bin/vite.js',import.meta.resolve('vite'))),'--config',config,'--host','127.0.0.1','--port',String(p),'--strictPort'],{cwd:repo,windowsHide:true,stdio:['ignore','pipe','pipe']});
    result.vitePid=vite.pid;result.port=p;
    vite.stderr.on('data',b=>console.log('VITE',String(b).trim()));
    for(let i=0;i<100;i++){if(await fetch(`http://127.0.0.1:${p}`).then(r=>r.ok).catch(()=>false))break;if(vite.exitCode!==null)throw Error('Vite exited');await sleep(250);}
    chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check',...(result.rendererConfig==='swiftshader'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]),'--ignore-gpu-blocklist','--enable-webgl','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--window-size=1440,900','--headless=new','--disable-background-timer-throttling','--disable-renderer-backgrounding','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    result.chromePid=chrome.pid;await save();
    const errors=[];chrome.stderr.on('data',b=>{errors.push(String(b).slice(0,500));result.chromeStderr=errors;});
    let pages;for(let i=0;i<120;i++){try{const cp=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0]);pages=await fetch(`http://127.0.0.1:${cp}/json/list`).then(r=>r.json());if(pages.some(p=>p.type==='page')){result.cdpPort=cp;break;}}catch{}if(chrome.exitCode!==null)throw Error('Chrome exited '+errors.slice(-3));await sleep(250);}
    c=new CDP(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await c.ready();await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Page.addScriptToEvaluateOnNewDocument',{source:'let driftSeed='+seed+';Math.random=()=>{driftSeed=(Math.imul(driftSeed,1664525)+1013904223)>>>0;return driftSeed/4294967296;};'});await c.send('Page.navigate',{url:`http://127.0.0.1:${p}/?agent=1`});
    const observe=()=>c.eval('window.rimward.observe()');
    const act=async(name,args={},must=true)=>{const r=await c.eval(`(()=>{const receipt=window.rimward.act(${JSON.stringify({v:2,name,args})});if(receipt.ok&&${JSON.stringify(name)}==='chooseOrigin'){(${installDiagnostic.toString()})();}return receipt;})()`);result.actions.push({at:Date.now(),name,args,result:r});if(must&&!r.ok)throw Error(name+' refused '+JSON.stringify(r));return r;};
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
  finally{if(c){try{result.partialMeasurements=await c.eval('window.__drift || null');}catch{}result.consoleErrors=c.console.filter(e=>['error','assert'].includes(e.type));result.exceptions=c.exceptions;try{await c.send('Browser.close');result.browserCloseRequested=true;}catch(e){result.browserCloseError=String(e);}c.ws.close();for(let i=0;i<80&&chrome?.exitCode===null;i++)await sleep(100);}result.cleanup={chrome:await stop(chrome),vite:await stop(vite)};
    const responds=async port=>port?fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(1500)}).then(()=>true).catch(()=>false):false;
    result.closedPorts={vite:!(await responds(result.port)),cdp:!(await responds(result.cdpPort))};
    if(Object.values(result.cleanup).some(p=>p.started!==false&&!p.exited)||Object.values(result.closedPorts).some(closed=>!closed)){result.verdict='FAIL';result.cleanupFailed=true;process.exitCode=1;}result.finished=new Date().toISOString();result.sourceHashEnd=await sourceHash();result.sourceStable=result.sourceHashStart===result.sourceHashEnd;if(!result.sourceStable){result.verdict='FAIL';result.sourceChanged=true;process.exitCode=1;}await save();console.log(name,result.verdict);}
  return result;
}

// Serialized into the page and invoked in the same JS task as chooseOrigin.
function installDiagnostic() {
  const x=window.__ctx;
  if(!x?.ship?.object||!Number.isFinite(x.world.time))throw Error('Missing live ctx');
  const seen=new WeakSet(), began=performance.now();
  const p=window.__drift={samples:[],events:[],frames:0,running:true};
  function dom(selector){return [...document.querySelectorAll(selector)].map(e=>{const visible=!!e.getClientRects().length;return {text:visible?e.textContent:null,display:getComputedStyle(e).display,visible};});}
  function snapshot(){
    const pos=x.ship.object.position,q=x.ship.object.quaternion;
    const fwd=pos.clone().set(0,0,-1).applyQuaternion(q);
    return {t:x.world.time,wallSeconds:(performance.now()-began)/1000,position:pos.toArray(),fwd:fwd.toArray(),velocity:x.ship.velocity.toArray(),speed:x.ship.speed,
      throttle:x.input.throttle,fullStop:x.input.fullStop,hull:x.player.hull,screen:x.player.screen,shell:x.player.shell,
      sun:{position:x.config.world.sunPosition.toArray(),radius:x.config.world.sunRadius,distance:pos.distanceTo(x.config.world.sunPosition)},
      stationDistance:pos.distanceTo(x.config.world.stationPosition),phase:window.rimward.observe().session.phase,
      flags:{paused:x.flags.paused,docked:x.flags.docked,berthHold:x.flags.berthHold},
      onboarding:{seen:[...(x.world.onboarding?.seen||[])],hint:dom('.rw-onboard-hint')},
      hail:window.rimward.observe().hail,
      overlays:dom('#rw-title,#rw-pause,.rw-hail-card,.rw-origin-card,.station-panel,[role="dialog"]')};
  }
  p.initial=snapshot();p.samples.push(p.initial);p.current=p.initial;
  let last=p.initial.t;
  function tick(){
    if(!p.running)return;p.frames++;
    for(const e of [...x.lastEvents,...x.events]){
      if(!e||typeof e!=='object'||seen.has(e))continue;seen.add(e);
      if(['sunHeat','sunKill','playerDestroyed','hailOpened','playerHit'].includes(e.type))
        p.events.push({type:e.type,payloadTime:e.t,observedWorldTime:x.world.time,wallSeconds:(performance.now()-began)/1000,reason:e.reason,dps:e.dps,damage:e.damage});
    }
    p.current=snapshot();
    if(p.current.t-last>=1){last=p.current.t;p.samples.push(p.current);}
    if(p.current.hull<=0||p.current.phase==='dead'){p.death=p.current;p.running=false;}
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const expected=process.argv[process.argv.indexOf('--expected')+1];
if(!['original','safe'].includes(expected))throw Error('Specify --expected original|safe');
const origins=process.env.DRIFT_ORIGIN?[process.env.DRIFT_ORIGIN]:['greenhand','beautiful'];
if(origins.some(o=>!['greenhand','beautiful'].includes(o)))throw Error('Unsupported origin');
const seed=Number(process.env.DRIFT_SEED||1);
if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid seed');
const scenario=process.env.DRIFT_SCENARIO||'untouched';
if(!['untouched','forward','flight'].includes(scenario))throw Error('Unsupported scenario');
for(const origin of origins){
const completed=await runLive(scenario+'-'+origin,origin,seed,async(h)=>{
  const {c,result,checkpoint,save,act}=h;
  if(scenario==='flight'){await flight(h);return;}
  result.expected=expected;
  result.scenario=scenario;
  result.method='Fresh public startGame/chooseOrigin; '+(scenario==='untouched'?'no controls':'public setControl throttle .5, centered steering, renewed every .5 wall seconds')+'; no hail dismissal. Read-only ctx samples, real requestAnimationFrame time. Seed is LCG a1664525 c1013904223 modulus2^32; frame ordering may change random consumption.';
  result.fixture='RNG only';
  result.assertionScope='PASS means the requested original/safe outcome was observed with valid time, stable source, clean browser console and cleanup; this is builder verification, not independent QA.';
  await checkpoint('01-stock-start');
  const began=Date.now();let latest,seq=0;
  while(Date.now()-began<300000){
    latest=await c.eval('window.__drift');result.measurements=latest;await save();
    if(!latest||!Number.isFinite(latest.current?.t))throw Error('Missing live measurements/time');
    if(latest.death||latest.current.t-latest.initial.t>=60)break;
    if(scenario==='forward')await act('setControl',{seq:++seq,ttl:2,throttle:.5,steerX:0,steerY:0});
    await sleep(500);
  }
  await checkpoint('02-terminal');
  result.measurements=await c.eval('(()=>{window.__drift.running=false;return window.__drift;})()');
  const m=result.measurements;
  result.elapsedWorldSeconds=m.current.t-m.initial.t;
  result.elapsedWallSeconds=m.current.wallSeconds;
  result.outcome=m.death?'observed-death':'survived-window';
  result.measurementVerdict=m.death||result.elapsedWorldSeconds>=60?'PASS':'FAIL';
  if(result.measurementVerdict!=='PASS')throw Error('World-time window incomplete (possible pause)');
  const solar=m.events.filter(e=>['sunHeat','sunKill'].includes(e.type));
  if(expected==='original'&&(!m.death||!solar.some(e=>e.type==='sunKill')))throw Error('Original sun-core death not reproduced');
  if(expected==='safe'&&(m.death||solar.length||result.elapsedWorldSeconds<60))throw Error('Safe start acceptance failed');
  await save();
});
if(completed.verdict!=='PASS')break;
}

async function flight({c,result,checkpoint,save,act,observe}){
  result.scenario='flight';result.expected='safe';result.fixture='RNG only';
  result.method='Fresh start; actual CDP keyboard R/F and mouse steering toward the station, actual J docking; native autosave then same-profile page reload. No transform/clock/state fixtures or hail clearing.';
  result.assertionScope='Builder verification of manual helm, docking and exact saved transform restore; not independent QA.';
  const key=async(code,type)=>{await c.send('Input.dispatchKeyEvent',{type,key:code.slice(3).toLowerCase(),code,windowsVirtualKeyCode:code.charCodeAt(3)});result.actions.push({at:Date.now(),name:'keyboard',code,type});};
  const tap=async(code)=>{await key(code,'keyDown');await key(code,'keyUp');};
  const view=await c.eval('({width:innerWidth,height:innerHeight})');
  const mouse=async(x,y)=>{await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});};
  const state=()=>c.eval(`(()=>{const x=window.__ctx,p=x.ship.object.position;return {t:x.world.time,throttle:x.input.throttle,fullStop:x.input.fullStop,speed:x.ship.speed,hull:x.player.hull,docked:x.flags.docked,paused:x.flags.paused,range:p.distanceTo(x.config.world.stationPosition),bearing:x.config.world.stationPosition.clone().sub(p).normalize().applyQuaternion(x.ship.object.quaternion.clone().invert()).toArray(),position:p.toArray(),quaternion:x.ship.object.quaternion.toArray()};})()`);
  async function until(label,predicate,step,wallLimit=60000){const began=Date.now();while(Date.now()-began<wallLimit){const s=await state();if(s.hull<=0||s.paused)throw Error(label+' interrupted '+JSON.stringify(s));if(predicate(s))return s;if(step)await step(s);await sleep(100);}throw Error('Flight timeout '+label);}
  const steer=async(s)=>{const [x,y,z]=s.bearing,r=Math.min(view.width,view.height)*.35;await mouse(view.width/2+Math.max(-1,Math.min(1,Math.atan2(x,-z)*1.5))*r,view.height/2-Math.max(-1,Math.min(1,Math.atan2(y,Math.hypot(x,z))*1.5))*r);};
  await checkpoint('01-manual-start');
  await tap('KeyF');await tap('KeyF');
  result.stopped=await until('full stop',s=>s.fullStop&&s.speed<.01);
  result.turnStart=await state();
  result.turned=await until('mouse turn toward station',s=>s.bearing[2]<-.998,steer);
  await mouse(view.width/2,view.height/2);
  const dot=result.turnStart.quaternion.reduce((n,v,i)=>n+v*result.turned.quaternion[i],0);
  if(Math.abs(dot)>.9)throw Error('Manual turn did not substantially change heading');
  await key('KeyR','keyDown');
  try{result.throttled=await until('keyboard throttle',s=>s.throttle>=.15,null,10000);}finally{await key('KeyR','keyUp');}
  await checkpoint('02-turned-throttled');
  result.approached=await until('manual station approach',s=>s.range<42,steer);
  await mouse(view.width/2,view.height/2);await tap('KeyJ');
  result.docked=await until('keyboard J dock',s=>s.docked,null,10000);
  await checkpoint('03-keyboard-docked');
  result.measurements=await c.eval('(()=>{window.__drift.running=false;return window.__drift;})()');
  const saveWait=Date.now();let saved;
  while(Date.now()-saveWait<10000){saved=await c.eval('JSON.parse(localStorage.getItem("rimward-save-v1"))');if(saved?.ship&&saved.world?.time>=result.docked.t-2)break;await sleep(200);}
  if(!saved?.ship||saved.world.time<result.docked.t-2)throw Error('Dock autosave not captured');
  result.saved={ship:saved.ship,worldTime:saved.world.time,origin:saved.world.origin};
  await save();await c.send('Page.reload');
  const reloadAt=Date.now();let booted=false;
  while(Date.now()-reloadAt<60000){booted=await c.eval('!!window.__rimwardBooted&&!!window.rimward&&!!window.__ctx?.flags.saveRestored');if(booted)break;await sleep(250);}
  if(!booted)throw Error('Saved reload did not boot/restore');
  result.restored=await state();
  for(const field of ['position','quaternion'])if(JSON.stringify(result.restored[field])!==JSON.stringify(saved.ship[field]))throw Error('Reload changed saved '+field);
  result.reloadObservation=await observe();
  if(result.reloadObservation.session.phase!=='title')throw Error('Reload title unavailable');
  await act('startGame');
  if((await observe()).session.phase!=='playing')throw Error('Saved continue did not resume play');
  await checkpoint('04-saved-reload');
  if(result.measurements.events.some(e=>['sunHeat','sunKill','playerDestroyed'].includes(e.type)))throw Error('Solar/death event during manual flight');
  result.outcome='manual-flight-dock-and-saved-pose-restored';await save();
}


