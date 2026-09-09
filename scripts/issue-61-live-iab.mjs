/** Test-only public-API queue for the owner's exact visible in-app game tab.
 * Natural routes have no CDP, arbitrary evaluation or private ctx/fixture hooks.
 * Explicit controlled routes embed one fixed INITIAL fixture only; measured
 * control and observations still use the public API. Fresh navigation per leg.
 * Generated HTML copies index.html and loads this narrow transport alongside
 * the unchanged game. The loopback token is ephemeral and never enters logs.
 */
import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile, access } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { repo, sleep, assert, identity } from './issue-61-live-harness.mjs';

const actions = ['startGame', 'chooseOrigin', 'openService', 'acceptJob', 'undock', 'dock', 'approachDock', 'plotRoute', 'engageAutopilot', 'cancelAutopilot', 'cancelAutomine', 'clearControl', 'selectTarget', 'setWeaponGroup', 'setControl', 'setCombatIntent', 'hailResolve'];

export async function runIab(name, mode, fn, options = {}) {
  const controlled = mode === 'controlled';
  assert(mode === 'natural' || (controlled && typeof options.fixtureSource === 'string'), 'Controlled IAB requires a fixed setup');
  const rngSource = 'window.__issue61Seed=6101; Math.random=()=>{let t=window.__issue61Seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};';
  const hash = text => createHash('sha256').update(text).digest('hex');
  assert(/^[a-z0-9-]+$/.test(name), 'Invalid run name');
  const origin = new URL(process.env.ISSUE61_PAGE_ORIGIN || 'http://127.0.0.1:60361').origin;
  assert(new URL(origin).hostname === '127.0.0.1', 'IAB source must be explicit loopback');
  const out = resolve(process.env.ISSUE61_OUT || join(repo, 'out', 'issue-61-live')), folder = join(out, name);
  await mkdir(folder, { recursive: true });
  const result = { name, mode, fixture: controlled, transport: 'owner-visible IAB public-API queue', started: new Date().toISOString(), actions: [], trials: [], checkpoints: [], jobEvents: [], consoleErrors: [], exceptions: [], keepOpen: true, browserOwnedByRoot: true };
  if (controlled) result.controlledSetupIdentity = { fixtureHash: hash(options.fixtureSource), rngHash: hash(rngSource), seed: 6101, freshNavigationRequired: true, freshOriginRequired: true, privateAccess: 'one fixed initial fixture only; no mutation during measured fight' };
  const save = () => writeFile(join(folder, 'result.json'), JSON.stringify(result, null, 2));
  const log = row => appendFile(join(folder, 'api.jsonl'), `${JSON.stringify(row)}\n`);
  const token = randomBytes(24).toString('hex');
  let port, requestId = 0, waitingPoll = null, delivered = null, lastClientAt = 0;
  const pending = new Map(), queue = [], jobSeen = new Set();
  const respond = (res, code, body) => { if (res.destroyed) return; res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
  const flush = () => { if (waitingPoll && queue.length && !delivered) { const res = waitingPoll; waitingPoll = null; delivered = queue.shift(); respond(res, 200, delivered); } };
  const clientSource = () => `
const base='http://127.0.0.1:${port}',token=${JSON.stringify(token)},allowed=new Set(${JSON.stringify(actions)});
const errors=[],exceptions=[];let stopped=false,fixtureUsed=false;
addEventListener('error',e=>{if(errors.length<50)errors.push({message:String(e.message||'error'),source:String(e.filename||'')});});
addEventListener('unhandledrejection',e=>{if(exceptions.length<50)exceptions.push(String(e.reason?.message||e.reason));});
const oldError=console.error.bind(console);console.error=(...a)=>{if(errors.length<50)errors.push({message:a.map(x=>typeof x==='string'?x:String(x)).join(' ')});oldError(...a);};
async function post(path,data){const r=await fetch(base+path,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error('test queue '+r.status);return r.json();}
while(!window.rimward)await new Promise(r=>setTimeout(r,100));
document.title=${JSON.stringify(controlled ? 'RIMWARD — CONTROLLED comparison fixture' : 'RIMWARD — sustained public-API test')};
while(!stopped){
  let cmd;try{cmd=await post('/poll',{});}catch{document.title='RIMWARD — test transport disconnected';break;}
  if(!cmd||cmd.kind==='idle')continue;
  let value,error=null;
  try{
    if(cmd.kind==='observe')value=window.rimward.observe();
    ${controlled ? `else if(cmd.kind==='fixture'){if(fixtureUsed)throw Error('Initial fixture already used; fresh navigation required');fixtureUsed=true;value=await ${options.fixtureSource};}` : ''}
    else if(cmd.kind==='act'){if(!allowed.has(cmd.name))throw Error('Unsupported public action');value=window.rimward.act({v:2,name:cmd.name,args:cmd.args||{}});}
    else if(cmd.kind==='metadata')value={visibility:document.visibilityState,focused:document.hasFocus(),url:location.href,errors,exceptions};
    else if(cmd.kind==='finish'){
      const r=window.rimward,receipts=[];for(const name of ['clearControl','cancelAutopilot','cancelAutomine'])receipts.push({name,result:r.act({v:2,name,args:{}})});
      let s=r.observe();if(s.session.phase==='playing'&&!s.flags.paused&&!s.flags.docked&&!s.hail.open){receipts.push({name:'setControl',result:r.act({v:2,name:'setControl',args:{seq:(s.control.seq||0)+1,ttl:.1,throttle:0,fireHeld:false}})});await new Promise(r=>setTimeout(r,50));receipts.push({name:'clearControl',result:r.act({v:2,name:'clearControl',args:{}})});}
      value={receipts,observation:r.observe(),errors,exceptions};document.title='RIMWARD — test finished; page kept open';stopped=true;
    }else throw Error('Unknown test transport operation');
  }catch(e){error=String(e.message||e);}
  await post('/result',{id:cmd.id,value,error});
}
`;
  const server = http.createServer(async (req, res) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && requestOrigin !== origin) { respond(res, 403, { error: 'origin' }); return; }
    if (req.method === 'OPTIONS') { respond(res, 200, {}); return; }
    if (req.url === '/client.js' && req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': origin }); res.end(clientSource()); return; }
    if (req.method !== 'POST' || req.headers.authorization !== 'Bearer ' + token || !['/poll', '/result'].includes(req.url)) { respond(res, 403, { error: 'refused' }); return; }
    let bytes = 0, chunks = [];
    try {
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 524288) throw Error('body limit'); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); lastClientAt = Date.now();
      if (req.url === '/poll') {
        if (waitingPoll || delivered) { respond(res, 409, { error: 'single-session queue busy' }); return; }
        waitingPoll = res;
        const timer = setTimeout(() => { if (waitingPoll === res) { waitingPoll = null; respond(res, 200, { kind: 'idle' }); } }, 20000);
        res.on('close', () => { clearTimeout(timer); if (waitingPoll === res) waitingPoll = null; }); flush();
      } else {
        if (!delivered || body.id !== delivered.id || !pending.has(body.id)) { respond(res, 409, { error: 'stale result' }); return; }
        const item = pending.get(body.id); pending.delete(body.id); delivered = null; clearTimeout(item.timer);
        body.error ? item.reject(Error(body.error)) : item.resolve(body.value); respond(res, 200, { ok: true }); flush();
      }
    } catch (e) { respond(res, 400, { error: String(e.message) }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  port = server.address().port; result.queuePort = port;
  result.identityStart = await identity();
  let html = (await readFile(join(repo, 'index.html'), 'utf8')).replace('</body>', `<script type="module" src="http://127.0.0.1:${port}/client.js"></script></body>`);
  if (controlled) html = html.replace('<head>', `<head><script>${rngSource}</script>`);
  await writeFile(join(folder, 'page.html'), html);
  result.pageUrl = origin + '/' + relative(repo, join(folder, 'page.html')).replaceAll('\\', '/') + '?agent=1';
  result.stopRequestPath = join(folder, 'stop-requested'); result.cleanupRequestPath = join(folder, 'close-requested');
  await save(); console.log('IAB READY', JSON.stringify({ pageUrl: result.pageUrl, queuePort: port, result: join(folder, 'result.json') }));
  let serialTail = Promise.resolve();
  function request(kind, extra = {}) {
    const run = serialTail.then(() => new Promise((resolve, reject) => {
      const id = ++requestId, timer = setTimeout(() => { pending.delete(id); reject(Error('IAB command timeout: ' + kind)); }, kind === 'observe' && !lastClientAt ? 300000 : 30000);
      pending.set(id, { resolve, reject, timer }); queue.push({ id, kind, ...extra }); flush();
    })); serialTail = run.catch(() => {}); return run;
  }
  const observe = async () => {
    if (await access(result.stopRequestPath).then(() => true).catch(() => false)) throw Error('Coordinator requested stop');
    const value = await request('observe'); assert(value?.ok && value.v === 2, 'Invalid public IAB observation');
    for (const event of value.events || []) if (event.type === 'jobState') { const key = JSON.stringify(event); if (!jobSeen.has(key)) { jobSeen.add(key); result.jobEvents.push(event); } }
    await log({ op: 'observe', wall: Date.now(), value }); return value;
  };
  const act = async (name, args = {}, must = true) => {
    assert(actions.includes(name), 'Action outside narrow test queue');
    const value = await request('act', { name, args }), row = { op: 'act', wall: Date.now(), request: { v: 2, name, args }, value };
    result.actions.push(row); await log(row); if (must) assert(value?.ok, `${name} refused: ${JSON.stringify(value)}`); return value;
  };
  const shot = async name => { (result.screenshotCheckpoints ||= []).push({ name, wall: Date.now(), capture: 'Root CUA screenshot of this exact IAB tab; no image fabricated by queue' }); console.log('IAB SCREENSHOT CHECKPOINT', name); };
  const checkpoint = async name => { const observation = await observe(); result.checkpoints.push({ name, wall: Date.now(), observation }); await save(); await shot(name); console.log('CHECKPOINT', name, observation.t); return observation; };
  const wait = async (predicate, seconds, label, sample) => { const wallEnd = Date.now() + Math.max(30000, seconds * 2500); let start, s; while (Date.now() < wallEnd) { s = await observe(); start ??= s.t; if (sample) await sample(s); if (predicate(s)) return s; if (s.t - start > seconds) break; await sleep(200); } throw Error(`Timeout ${label}: ${JSON.stringify({ t: s?.t, control: s?.control, flags: s?.flags })}`); };
  try {
    let s = await observe(); if (s.session.phase === 'title') await act('startGame'); s = await observe(); if (s.session.phase === 'origin') await act('chooseOrigin', { id: 'greenhand' }); await wait(s => s.session.phase === 'playing', 20, 'playing');
    result.pageMetadata = await request('metadata'); console.log('IAB CONNECTED', JSON.stringify(result.pageMetadata));
    const setupFixture = controlled ? async () => { const value = await request('fixture'); await log({ op: 'controlled-initial-fixture', wall: Date.now(), value }); return value; } : undefined;
    await fn({ result, save, observe, act, shot, checkpoint, wait, folder, setupFixture });
    result.checksCompleted = true;
  } catch (e) { result.error = e.stack; result.coordinatorInterrupted = e.message === 'Coordinator requested stop'; result.checksCompleted = false; process.exitCode = 1; console.error(e.stack); }
  finally {
    try {
      result.finalStop = await request('finish'); result.consoleErrors = result.finalStop.errors; result.exceptions = result.finalStop.exceptions;
      const final = result.finalStop.observation;
      result.requiresRootPauseOrDock = final.session.phase === 'playing' && !final.flags.paused && !final.flags.docked;
      result.retentionNote = 'Cleared authority and throttle zero do not imply zero physical speed; ordinary creep remains. Root pauses the actual IAB tab through its normal UI if it is not docked.';
      if (result.consoleErrors.length || result.exceptions.length) { result.checksCompleted = false; process.exitCode = 1; }
    } catch (e) { result.finalStopError = String(e); result.checksCompleted = false; process.exitCode = 1; }
    result.identityEnd = await identity(); result.sourceStable = result.identityStart.sourceHash === result.identityEnd.sourceHash; result.harnessStable = result.identityStart.harnessHash === result.identityEnd.harnessHash;
    if (!result.sourceStable || !result.harnessStable) { result.checksCompleted = false; process.exitCode = 1; }
    if (!result.checksCompleted) result.acceptance = { ...(result.acceptance || {}), scope: 'Supplemental checks only; not independent QA', pass: false, harnessFailure: true };
    result.finished = new Date().toISOString(); result.pageKeptOpen = true; await save();
    console.log('IAB FINISHED PAGE KEPT OPEN', JSON.stringify({ result: join(folder, 'result.json'), checksCompleted: result.checksCompleted, acceptance: result.acceptance, coverageGaps: result.coverageGaps, requiresRootPauseOrDock: result.requiresRootPauseOrDock, speed: result.finalStop?.observation?.ship.speed, observation: result.finalStop?.observation?.control }));
    // Queue owns no browser or Vite. End only this test transport; leave the
    // actual user's tab and root-owned preview server exactly where they are.
    if (waitingPoll) { respond(waitingPoll, 200, { kind: 'idle' }); waitingPoll = null; }
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('IAB transport ended')); }
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); result.queueClosed = true; await save();
  }
  return result;
}
