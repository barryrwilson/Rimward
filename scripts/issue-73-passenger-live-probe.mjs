/** Issue #73 fixture-based rendered headless Chrome probe.
 * Run: node scripts/issue-73-passenger-live-probe.mjs
 * Set ISSUE73_PROFILE to a writable isolated-profile parent when temp is blocked.
 * Uses --no-sandbox for this loopback-only, disposable controlled test page.
 */
import { isDeepStrictEqual } from 'node:util';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.ISSUE73_OUT || join(repo, 'out', 'issue-73', 'live');
const WIN = process.platform === 'win32';
const PINS = ['single', 'double', 'mixed'];

function findChrome() {
  const named = process.env.ISSUE73_CHROME || process.env.CHROME_PATH;
  if (named) return named;
  const candidates = WIN
    ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser', '/usr/bin/chromium', '/opt/google/chrome/chrome'];
  for (const c of candidates) if (existsSync(c)) return c;
  return WIN ? 'chrome.exe' : 'google-chrome';
}
const CHROME = findChrome();
const PROFILE_ROOT = resolvePath(process.env.ISSUE73_PROFILE || tmpdir());
const PROFILE_PREFIX = 'rw-issue73-passenger-';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const say = (...a) => { const line = a.map(String).join(' '); log.push(line); console.log(line); };

const results = {
  commit: process.env.ISSUE73_SHA || null,
  port: null, cdpPort: null, profile: null, cacheDir: null, boot: null,
  fixtureNote: 'Safe berth positions, jump requests, cash grant and parked traffic. Production public actions, settlement, save and restart. No natural travel costs or durations asserted.',
  pins: {}, consoleErrors: [], exceptions: [], restarts: [],
};
function record(key, pass, detail) {
  results.pins[key] = { pass, ...detail };
  say(pass ? 'PASS' : 'FAIL', key, JSON.stringify(detail).slice(0, 1100));
}

async function killTree(child) {
  if (!child?.pid) return;
  if (WIN) {
    const stopped = await new Promise((resolve) => {
      try {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'],
          { stdio: 'ignore', windowsHide: true });
        killer.once('error', () => resolve(false));
        killer.once('exit', (code) => resolve(code === 0 || child.exitCode != null));
      } catch { resolve(false); }
    });
    if (stopped) return;
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); return; } catch { /* gone */ }
  }
  try { child.kill('SIGKILL'); } catch { /* already gone */ }
}
async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  return port;
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0; this.pending = new Map(); this.console = []; this.exceptions = [];
  }
  ready() {
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.method === 'Runtime.consoleAPICalled') {
        this.console.push({
          type: msg.params?.type || 'log',
          text: (msg.params?.args || []).map((a) => a.value ?? a.description ?? '').join(' '),
        });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails;
        const text = d?.exception?.description || d?.text || 'exception';
        this.exceptions.push(String(text));
        say('EXC', String(text).slice(0, 300));
      }
      if (msg.id == null) return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      clearTimeout(p.timer); // release the timeout on success AND on rejection
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    });
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 45000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('cdp timeout ' + method)); }
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 45000) {
    const r = await this.send('Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
    }
    return r?.result?.value;
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' }, 30000);
    await writeFile(join(outDir, name), Buffer.from(r.data, 'base64'));
    say('SHOT', name);
  }
  close() { try { this.ws.close(); } catch { /* closed */ } }
}

const KEY = (code, key) => `(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${key}', bubbles: true, cancelable: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${key}', bubbles: true, cancelable: true }));
  return true;
})()`;

async function main() {
  await mkdir(PROFILE_ROOT, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const port = await availablePort();
  const profile = await mkdtemp(join(PROFILE_ROOT, PROFILE_PREFIX));
  // Per-run Vite cacheDir: this worktree's node_modules is a junction into the
  // parent checkout, so the default node_modules/.vite would be shared.
  const cacheDir = join(outDir, `.vite-cache-${process.pid}`);
  const probeConfig = join(outDir, `vite.probe.${process.pid}.mjs`);
  await writeFile(probeConfig,
    'import { defineConfig } from \'vite\';\n'
    + `export default defineConfig({ root: ${JSON.stringify(repo)}, `
    + `cacheDir: ${JSON.stringify(cacheDir)}, server: { host: '127.0.0.1' } });\n`, 'utf8');
  const app = `http://127.0.0.1:${port}/?agent=1`;
  results.port = port; results.profile = profile; results.cacheDir = cacheDir;
  let vite = null; let chrome = null; let cdp = null;

  try {
    vite = spawn(process.execPath, [
      fileURLToPath(new URL('../../bin/vite.js', import.meta.resolve('vite'))),
      '--config', probeConfig,
      '--host', '127.0.0.1', '--port', String(port), '--strictPort',
    ], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
    vite.stdout.on('data', (b) => say('vite', String(b).trim().slice(0, 160)));
    vite.stderr.on('data', (b) => say('vite!', String(b).trim().slice(0, 160)));
    let up = false;
    for (let i = 0; i < 100; i++) {
      up = await fetch(`http://127.0.0.1:${port}/`).then((r) => r.ok).catch(() => false);
      if (up || vite.exitCode != null) break;
      await sleep(300);
    }
    if (!up) throw new Error(`vite ${port} not serving`);
    say('vite up', port, 'cacheDir', cacheDir);

    const priorConsole = [], priorExceptions = [];
    const launchBrowser = async () => {
    chrome = spawn(CHROME, [
      '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist', '--enable-webgl',
      '--disable-extensions', '--window-size=1440,900', '--headless=new',
      '--hide-crash-restore-bubble', '--disable-session-crashed-bubble',
      '--no-sandbox', '--disable-dev-shm-usage',
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'], detached: !WIN, windowsHide: true });
    const chromeErr = [];
    chrome.stderr.on('data', (b) => chromeErr.push(String(b).trim().slice(0, 200)));
    say('chrome', CHROME, 'pid', chrome.pid);

    let browserWs = null; let cdpPort = null;
    for (let i = 0; i < 120; i++) {
      try {
        const active = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
        const parsed = Number(active.split(/\r?\n/, 1)[0]);
        if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('bad DevToolsActivePort');
        cdpPort = parsed;
        const ver = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (ver.ok) { browserWs = (await ver.json()).webSocketDebuggerUrl; if (browserWs) break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null) break;
      await sleep(200);
    }
    results.cdpPort = cdpPort;
    if (!browserWs) throw new Error(`CDP not ready: ${chromeErr.slice(-3).join(' | ')}`);

    cdp = new Cdp(browserWs);
    await cdp.ready();
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const targetId = created?.targetId || null;
    cdp.close();

    let pageWs = null;
    for (let i = 0; i < 60; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
        const page = list.find((t) => t.type === 'page' && t.id === targetId);
        if (page?.webSocketDebuggerUrl) { pageWs = page.webSocketDebuggerUrl; break; }
      } catch { /* not up yet */ }
      if (chrome.exitCode != null) break;
      await sleep(200);
    }
    if (!pageWs) throw new Error('page ws missing');
    cdp = new Cdp(pageWs);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: app });
    };
    await launchBrowser();

    const waitUntil = async (expr, pred, ms = 8000, step = 150) => {
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < ms) {
        try { last = await cdp.eval(expr); } catch (err) { last = { evalError: String(err?.message || err) }; }
        try { if (pred(last)) return last; } catch { /* keep polling */ }
        await sleep(step);
      }
      return last;
    };

    // ---- Boot into flight (the hail66 front-door sequence) ----------------
    await waitUntil(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`,
      (v) => !!(v && (v.ctx || v.title)), 40000, 300);
    await cdp.eval(`(() => {
      try { localStorage.removeItem('rimward-save-v1'); } catch {}
      try { sessionStorage.setItem('rimward-title-skip', '1'); } catch {}
      location.reload();
      return true;
    })()`);
    await sleep(1500);
    await waitUntil(`({ ctx: !!window.__ctx, title: !!document.getElementById('rw-title') })`,
      (v) => !!(v && (v.ctx || v.title)), 40000, 300);
    for (let i = 0; i < 12; i++) {
      if (await cdp.eval('!!window.__ctx?.world?.origin')) break;
      const click = await cdp.eval(`(() => {
        const row = [...document.querySelectorAll('.rw-origin-row')].find((el) =>
          /Freehold Greenhand/.test(el.textContent || ''));
        if (row) { row.click(); return 'origin'; }
        const neu = document.getElementById('rw-title-new')
          || document.querySelector('[data-title-action="new"]');
        if (neu) { neu.click(); return 'new'; }
        return 'none';
      })()`);
      say('click', click);
      await sleep(800);
    }
    await waitUntil(`(() => {
      const c = window.__ctx;
      return !!(c?.ship?.object && c.world.origin && c.flags.paused === false && (c.world.time || 0) > 1);
    })()`, (v) => v === true, 25000, 300);
    results.boot = await cdp.eval(`(() => {
      const c = window.__ctx;
      return { hasCtx: !!c, origin: c?.world?.origin || null, sys: c?.world?.currentSystem || null,
        docked: !!c?.flags?.docked, agentOptIn: !!c?.agent?.optIn };
    })()`);
    say('flight', JSON.stringify(results.boot));
    if (!results.boot?.hasCtx) throw new Error('no ctx after new game');
    if (results.boot.docked) { await cdp.eval(KEY('Digit8', '8')); await sleep(1500); }


    const act = (name,args={}) => cdp.eval(`window.rimward.act(${JSON.stringify({v:2,name,args})})`);
    const state = (requirePanel=true) => cdp.eval(`(() => { const c=window.__ctx;
      const panel=document.querySelector('.station-panel');
      if(${requirePanel}&&!panel) throw new Error('Expected station panel for UI parity');
      return {
      credits:c.world.credits,cargo:JSON.parse(JSON.stringify(c.cargo)),
      accepted:c.world.jobs.filter(j=>j.kind==='passenger'&&j.state==='accepted'),
      observation:window.rimward.observe(),saved:JSON.parse(localStorage.getItem('rimward-save-v1')),
      text:panel?.innerText??null,uiScope:panel?'.station-panel':null }; })()`);
    const park = () => cdp.eval(`(() => {const c=window.__ctx;const p=c.systems[c.world.currentSystem].station.position;
      for(const s of c.ships) if(s?.object) s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);
      c.flags.combat=false;c.ship.object.position.set(p[0]+36,p[1],p[2]);c.ship.velocity.set(0,0,0);c.ship.speed=0;return true;})()`);
    async function berth(destination) {
      if(await cdp.eval('window.__ctx.flags.docked')) await act('undock');
      if(await cdp.eval('window.__ctx.world.currentSystem')!==destination) {
        await cdp.eval(`window.__ctx.emit('jumpRequested',{to:${JSON.stringify(destination)}})`);
        if(await waitUntil(`window.__ctx.world.currentSystem===${JSON.stringify(destination)}&&!window.__ctx.gate.jumping`,v=>v===true,40000,250)!==true) throw new Error('fixture jump failed');
      }
      await park();await cdp.eval(KEY('KeyJ','j'));
      if(await waitUntil('window.__ctx.flags.docked',v=>v===true,10000)!==true) throw new Error('berth failed');
      await act('openService',{id:'jobs'});await sleep(900);
    }
    async function reloadSaved(fullRestart=false,stage='') {
      if(fullRestart) {
        const oldPid=chrome.pid;
        priorConsole.push(...cdp.console);priorExceptions.push(...cdp.exceptions);
        await cdp.send('Browser.close');cdp.close();
        for(let i=0;i<50&&chrome.exitCode===null;i++) await sleep(200);
        if(chrome.exitCode!==0) throw new Error('graceful Browser.close did not exit cleanly: '+chrome.exitCode);
        const exitCode=chrome.exitCode;
        await launchBrowser();
        results.restarts.push({scenario:'mixed',stage,method:'Browser.close',sameProfile:profile,oldPid,exitCode,newPid:chrome.pid});
        say('RESTART',stage,'oldPid',oldPid,'exit',exitCode,'newPid',chrome.pid);
      } else {
        await cdp.eval(`sessionStorage.setItem('rimward-title-skip','1');location.reload();true`);
      }
      await sleep(1300);
      await waitUntil('!!window.__ctx?.ship?.object',v=>v===true,40000);
      await cdp.eval(`(() => {const b=document.getElementById('rw-title-continue')||document.querySelector('[data-title-action="continue"]');if(b)b.click();return true;})()`);
      await waitUntil('!!window.__ctx?.world?.origin&&!window.__ctx.flags.paused',v=>v===true,20000);
    }
    const hasTerms = s => /No buy-in/.test(s)&&/no cargo hold/.test(s)&&/10 min/.test(s)&&/Expiry pays nothing/.test(s);
    const scrollPassenger = () => cdp.eval(`(() => {const card=[...document.querySelectorAll('.job-card')].find(el=>/Escort passengers/.test(el.textContent));card?.scrollIntoView({block:'center'});return !!card;})()`);
    for(const scenario of PINS) {
      if(scenario!=='single') {
        await cdp.eval(`localStorage.removeItem('rimward-save-v1');sessionStorage.setItem('rimward-title-skip','1');location.reload();true`);
        await sleep(1500);await waitUntil('!!window.__ctx',v=>v===true,40000);
        for(let i=0;i<8;i++) {
          if(await cdp.eval('!!window.__ctx?.world?.origin')) break;
          await cdp.eval(`(() => {const row=[...document.querySelectorAll('.rw-origin-row')].find(e=>/Freehold Greenhand/.test(e.textContent));if(row)row.click();else (document.getElementById('rw-title-new')||document.querySelector('[data-title-action="new"]'))?.click();return true;})()`);await sleep(600);
        }
      }
      await cdp.eval(`(() => {const c=window.__ctx;c.agent.optIn=true;c.world.credits=5000;return true;})()`);
      await berth('freehold');
      let capital=0;
      if(scenario==='mixed') {
        await act('openService',{id:'market'});
        const bought=await act('trade',{commodity:'provisions',qty:20,side:'buy'});
        if(!bought.ok) throw new Error('full hold buy refused '+JSON.stringify(bought));
        capital=5000-(await state()).credits;await act('openService',{id:'jobs'});
      }
      const before=await state();
      const ids=await cdp.eval(`window.__ctx.world.jobs.filter(j=>j.kind==='passenger'&&j.originSystem==='freehold'&&j.state==='offered').map(j=>j.id)`);
      const picked=ids.slice(0,scenario==='single'?1:2);
      await scrollPassenger();await sleep(200);await cdp.shot(scenario+'-before-wide.png');
      if(scenario==='single') {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await scrollPassenger();await sleep(250);await cdp.shot('single-before-390.png');
        results.narrow=await cdp.eval(`(() => {const panel=document.querySelector('.station-panel');
          if(!panel) throw new Error('Expected station panel for narrow geometry');
          return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,station:panel.getBoundingClientRect().toJSON()};})()`);
        await cdp.send('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:1,mobile:false});await scrollPassenger();await sleep(250);await cdp.shot('single-before-1024.png');
        await cdp.send('Emulation.clearDeviceMetricsOverride');await sleep(200);
      }
      const receipts=[];
      for(const id of picked) receipts.push(await act('acceptJob',{id}));
      const accepted=await state();await scrollPassenger();await sleep(200);await cdp.shot(scenario+'-accepted.png');
      const duplicate=await act('acceptJob',{id:picked[0]});
      const ferry=scenario==='mixed'?await act('acceptJob',{id:'ferry-consignment'}):null;
      const destination=accepted.accepted[0]?.destSystem,pay=accepted.accepted.reduce((n,j)=>n+j.payQuoted,0);
      // Restored agreements are read before reopening a dock; no UI assertion
      // is made at this intermediate stage where no panel exists.
      await reloadSaved(scenario==='mixed','accepted');const restored=await state(false);
      await berth(destination);const delivered=await state();await cdp.shot(scenario+'-delivered.png');
      await reloadSaved(scenario==='mixed','delivered');await berth(destination);const restarted=await state();
      let tradeProceeds=0;
      if(scenario==='mixed') {
        await act('openService',{id:'market'});const sold=await act('trade',{commodity:'provisions',qty:20,side:'sell'});
        if(!sold.ok) throw new Error('commodity sale failed');tradeProceeds=(await state()).credits-restarted.credits;
      }
      const terms=before.observation.station?.view?.rows||[];
      const checks={receipts:receipts.every(r=>r.ok),count:accepted.accepted.length===picked.length,
        quote:pay===350*picked.length,noBuyIn:accepted.credits===before.credits,
        noHold:JSON.stringify(before.cargo)===JSON.stringify(accepted.cargo),duplicateRefused:!duplicate.ok&&duplicate.token==='not-offered'&&/already aboard/.test(duplicate.error),
        ferryRefused:!ferry||(!ferry.ok&&ferry.token==='hold'),
        acceptanceRestored:isDeepStrictEqual(restored.accepted,accepted.accepted),
        exactPayment:delivered.credits===accepted.credits+pay,
        cargoRetained:JSON.stringify(delivered.cargo)===JSON.stringify(accepted.cargo),
        deliverySaved:delivered.saved.world.credits===delivered.credits,noRepeat:restarted.credits===delivered.credits,
        uiTerms:hasTerms(before.text),apiTerms:hasTerms(JSON.stringify(terms)),receiptTerms:receipts.every(r=>hasTerms(r.notice||''))};
      record(scenario,Object.values(checks).every(Boolean),{checks,receipts,duplicate,ferry,
        passengerPayments:pay,passengerCapital:0,passengerHold:0,commodityCapital:capital,
        commodityOccupied:before.cargo.reduce((n,c)=>n+c.units,0),tradeProceeds,
        tradingContribution:scenario==='mixed'?tradeProceeds-capital:0,flightCosts:null,travelSeconds:null,
        before,accepted,restored,delivered,restarted,terms});
      await writeFile(join(outDir,scenario+'-results.json'),JSON.stringify(results.pins[scenario],null,2),'utf8');
    }
    const allConsole=[...priorConsole,...cdp.console], allExceptions=[...priorExceptions,...cdp.exceptions];
    results.consoleErrors = allConsole.filter((c) => c.type === 'error' || c.type === 'assert');
    results.exceptions = allExceptions;
    await writeFile(join(outDir, 'console.txt'),
      allConsole.map((c) => `[${c.type}] ${c.text}`).join('\n')
      + '\n\n--- exceptions ---\n' + allExceptions.join('\n') + '\n', 'utf8');
  } catch (err) {
    say('ERROR', err?.stack || String(err));
    results.error = String(err?.message || err);
  } finally {
    if (cdp) cdp.close();
    await killTree(chrome);
    await killTree(vite);
    // Remove only paths this run created, checked against their own roots.
    try {
      if (profile) {
        const target = resolvePath(profile);
        const leaf = basename(target);
        if (relative(PROFILE_ROOT, target) === leaf && leaf.startsWith(PROFILE_PREFIX)) {
          await rm(target, { recursive: true, force: true, maxRetries: 5 });
        }
      }
    } catch { /* profile may hold locks */ }
    try {
      const target = resolvePath(cacheDir);
      if (relative(outDir, target) === basename(target) && basename(target).startsWith('.vite-cache-')) {
        await rm(target, { recursive: true, force: true, maxRetries: 5 });
      }
    } catch { /* cache may hold locks */ }
    try {
      const target = resolvePath(probeConfig);
      if (relative(outDir, target) === basename(target) && basename(target).startsWith('vite.probe.')) {
        await rm(target, { force: true });
      }
    } catch { /* ignore */ }
    await writeFile(join(outDir, 'run.log'), log.join('\n') + '\n', 'utf8');
    const entries = Object.entries(results.pins);
    console.log('\n' + entries.map(([k, v]) => `${v.pass ? 'PASS' : 'FAIL'}  ${k}`).join('\n'));
    console.log('console errors:', results.consoleErrors.length, 'exceptions:', results.exceptions.length);
    const failed = entries.filter(([, v]) => !v.pass).map(([k]) => k);
    const missing = PINS.filter((k) => !results.pins[k]);
    const reasons = [];
    if (results.error) reasons.push(`harness error: ${results.error}`);
    if (missing.length) reasons.push(`pin not reached: ${missing.join(', ')}`);
    if (failed.length) reasons.push(`pin failed: ${failed.join(', ')}`);
    if (results.consoleErrors.length) reasons.push(`console errors: ${results.consoleErrors.length}`);
    if (results.exceptions.length) reasons.push(`uncaught exceptions: ${results.exceptions.length}`);
    results.verdict = reasons.length ? 'FAIL' : 'PASS';
    results.reasons = reasons;
    await writeFile(join(outDir, 'probes.json'), JSON.stringify(results, null, 2), 'utf8');
    if (reasons.length) {
      console.log('\nISSUE-73 LIVE FAIL');
      for (const r of reasons) console.log(' -', r);
      process.exitCode = 1;
    } else {
      console.log(`\nISSUE-73 LIVE PASS — ${PINS.length}/${PINS.length} pins (clean console), no exceptions`);
    }
  }
}

main();
