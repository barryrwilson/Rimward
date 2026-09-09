/** Shared issue #74 live-browser runner. Disposable loopback-only Chrome. */
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {createServer} from 'node:net';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const out=resolve(process.env.ISSUE74_OUT||join(repo,'out','issue-74-live'));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function sourceHash(){const files=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','src'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim().split(/\r?\n/).filter(Boolean).sort();const hash=createHash('sha256');for(const f of [...new Set(files)]){hash.update(f);hash.update(await readFile(join(repo,f)));}return hash.digest('hex');}
async function port(){const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function stop(p){if(!p?.pid)return {started:false};if(p.exitCode!==null)return {pid:p.pid,exitCode:p.exitCode,exited:true};let error=null;try{p.kill('SIGTERM');}catch(e){error=String(e);}for(let i=0;i<50&&p.exitCode===null&&p.signalCode===null;i++)await sleep(100);return {pid:p.pid,exitCode:p.exitCode,signal:p.signalCode,exited:p.exitCode!==null||p.signalCode!==null,error};}
class CDP{
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.console=[];this.exceptions=[];this.ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(m.id){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}if(m.method==='Runtime.consoleAPICalled')this.console.push({type:m.params.type,text:m.params.args.map(a=>a.value??a.description??'').join(' ')});if(m.method==='Runtime.exceptionThrown')this.exceptions.push(m.params.exceptionDetails);});}
  ready(){return new Promise((r,j)=>{this.ws.addEventListener('open',r,{once:true});this.ws.addEventListener('error',j,{once:true});});}
  send(method,params={}){const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},Number(process.env.ISSUE74_CDP_TIMEOUT||120000));this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
}
export async function runLive(name,fn){
  await mkdir(out,{recursive:true});const folder=join(out,name);await mkdir(folder,{recursive:true});
  const resumed=process.env.ISSUE74_RESUME_PROFILE?resolve(process.env.ISSUE74_RESUME_PROFILE):null;
  if(resumed&&!resumed.toLowerCase().startsWith((out+sep).toLowerCase()))throw Error('Resume profile must be inside the named issue evidence output');
  const profile=resumed||await mkdtemp(join(folder,'profile-')),cache=join(folder,'vite-cache');
  const config=join(repo,`out/issue74-vite-${name}-${process.pid}.mjs`);await mkdir(dirname(config),{recursive:true});
  await writeFile(config,`export default {root:${JSON.stringify(repo)},cacheDir:${JSON.stringify(cache)}};`);
  const p=process.env.ISSUE74_PORT?Number(process.env.ISSUE74_PORT):await port();if(!Number.isInteger(p)||p<1024||p>65535)throw Error('Invalid loopback port');let vite,chrome,c;
  const result={name,profile,started:new Date().toISOString(),fixture:false,actions:[],checkpoints:[],samples:[],consoleErrors:[],exceptions:[]};
  result.rendererConfig=process.env.ISSUE74_RENDERER||'platform';
  result.resumedProfile=!!resumed;
  result.sourceHashStart=await sourceHash();result.commit=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true}).stdout.trim();
  const save=()=>writeFile(join(folder,'result.json'),JSON.stringify(result,null,2));
  try{
    vite=spawn(process.execPath,[fileURLToPath(new URL('../../bin/vite.js',import.meta.resolve('vite'))),'--config',config,'--host','127.0.0.1','--port',String(p),'--strictPort'],{cwd:repo,windowsHide:true,stdio:['ignore','pipe','pipe']});
    result.vitePid=vite.pid;result.port=p;
    vite.stderr.on('data',b=>console.log('VITE',String(b).trim()));
    for(let i=0;i<100;i++){if(await fetch(`http://127.0.0.1:${p}`).then(r=>r.ok).catch(()=>false))break;if(vite.exitCode!==null)throw Error('Vite exited');await sleep(250);}
    chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check',...(result.rendererConfig==='swiftshader'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]),'--ignore-gpu-blocklist','--enable-webgl','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--window-size=1440,900','--headless=new','--disable-background-timer-throttling','--disable-renderer-backgrounding','--no-sandbox','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
    result.chromePid=chrome.pid;await save();
    const errors=[];chrome.stderr.on('data',b=>errors.push(String(b).slice(0,250)));
    let pages;for(let i=0;i<120;i++){try{const cp=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/)[0]);pages=await fetch(`http://127.0.0.1:${cp}/json/list`).then(r=>r.json());if(pages.some(p=>p.type==='page')){result.cdpPort=cp;break;}}catch{}if(chrome.exitCode!==null)throw Error('Chrome exited '+errors.slice(-3));await sleep(250);}
    c=new CDP(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await c.ready();await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Page.navigate',{url:`http://127.0.0.1:${p}/?agent=1`});
    const observe=()=>c.eval('window.rimward.observe()');
    const act=async(name,args={},must=true)=>{const r=await c.eval(`window.rimward.act(${JSON.stringify({v:2,name,args})})`);result.actions.push({at:Date.now(),name,args,result:r});if(must&&!r.ok)throw Error(name+' refused '+JSON.stringify(r));return r;};
    const shot=async name=>{const s=await c.send('Page.captureScreenshot',{format:'png'});await writeFile(join(folder,name+'.png'),Buffer.from(s.data,'base64'));};
    const checkpoint=async name=>{const observation=await observe();const panel=await c.eval(`(()=>{const p=document.querySelector('.station-panel');return p?{text:p.innerText,rect:p.getBoundingClientRect().toJSON(),scrollWidth:document.documentElement.scrollWidth,width:innerWidth}:null})()`);result.checkpoints.push({name,at:Date.now(),observation,panel});console.log('CHECKPOINT',name,observation.t,observation.world.currentSystem,observation.world.credits);await save();await shot(name);return observation;};
    // Limits are simulation seconds, with a separate 4x wall cap for software
    // rendering. Neither bound becomes an active-search-time measurement.
    const wait=async(pred,seconds,label,sample)=>{const began=Date.now(),end=began+Math.max(60000,seconds*4000);let s,startT;while(Date.now()<end){s=await observe();startT??=s.t;if(sample)await sample(s);if(pred(s))return s;if(s.t-startT>=seconds)break;await sleep(300);}throw Error('timeout '+label+' '+JSON.stringify({t:s?.t,worldElapsed:s?.t-startT,wallElapsed:(Date.now()-began)/1000,flags:s?.flags,ap:s?.autopilot}));};
    for(let i=0;i<160;i++){if(await c.eval('!!window.rimward'))break;await sleep(300);}
    let s=await observe();if(s.session.phase==='title')await act('startGame');s=await observe();if(s.session.phase==='origin')await act('chooseOrigin',{id:'greenhand'});await wait(s=>s.session.phase==='playing',25,'playing');
    result.graphics=await c.eval(`(()=>{const canvas=document.querySelector('canvas'),g=canvas?.getContext('webgl2');if(!g)return null;const e=g.getExtension('WEBGL_debug_renderer_info');return {renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),vendor:e?g.getParameter(e.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR)};})()`);console.log('BOOT',name,JSON.stringify(result.graphics));
    await fn({c,result,save,observe,act,shot,checkpoint,wait,folder});
    result.consoleErrors=c.console.filter(e=>['error','assert'].includes(e.type));result.exceptions=c.exceptions;
    if(result.consoleErrors.length||result.exceptions.length)throw Error('Browser console errors or exceptions');
    result.verdict='PASS';
  }catch(e){result.error=e.stack;result.verdict='FAIL';console.error(e.stack);process.exitCode=1;}
  finally{if(c){result.consoleErrors=c.console.filter(e=>['error','assert'].includes(e.type));result.exceptions=c.exceptions;try{await c.send('Browser.close');result.browserCloseRequested=true;}catch(e){result.browserCloseError=String(e);}c.ws.close();for(let i=0;i<80&&chrome?.exitCode===null;i++)await sleep(100);}result.cleanup={chrome:await stop(chrome),vite:await stop(vite)};
    const responds=async port=>port?fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(1500)}).then(()=>true).catch(()=>false):false;
    result.closedPorts={vite:!(await responds(result.port)),cdp:!(await responds(result.cdpPort))};
    if(Object.values(result.cleanup).some(p=>p.started!==false&&!p.exited)||Object.values(result.closedPorts).some(closed=>!closed)){result.verdict='FAIL';result.cleanupFailed=true;process.exitCode=1;}result.finished=new Date().toISOString();result.sourceHashEnd=await sourceHash();result.sourceStable=result.sourceHashStart===result.sourceHashEnd;if(!result.sourceStable){result.verdict='FAIL';result.sourceChanged=true;process.exitCode=1;}await save();console.log(name,result.verdict);}
  return result;
}
