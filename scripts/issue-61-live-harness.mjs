/** Issue #61 supplemental live verification. Never an independent QA verdict.
 * Disposable platform-GPU Chrome, dynamic loopback Vite/CDP, serialized API.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, appendFile, mkdtemp, rm, access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function assert(ok, message) { if (!ok) throw Error(message); }

export async function identity() {
  const git = args => {
    const run = spawnSync('git', args, { cwd: repo, encoding: 'utf8', windowsHide: true });
    assert(run.status === 0, `git failed: ${args[0]} ${run.stderr}`);
    return run.stdout.trim();
  };
  const files = [...new Set(git(['ls-files', '--cached', '--others', '--exclude-standard', 'src']).split(/\r?\n/).filter(Boolean))].sort();
  const hash = createHash('sha256');
  for (const file of files) { hash.update(file); hash.update(await readFile(join(repo, file))); }
  const toolsHash = createHash('sha256');
  for (const file of ['scripts/issue-61-live-harness.mjs', 'scripts/issue-61-live-probe.mjs', 'scripts/issue-61-live-iab.mjs']) {
    toolsHash.update(file); toolsHash.update(await readFile(join(repo, file)));
  }
  return { commit: git(['rev-parse', 'HEAD']), sourceHash: hash.digest('hex'), harnessHash: toolsHash.digest('hex'), status: git(['status', '--porcelain']), sourceFiles: files.length };
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function stop(child) {
  if (!child?.pid) return { started: false };
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  for (let i = 0; i < 60 && child.exitCode === null && child.signalCode === null; i++) await sleep(100);
  return { pid: child.pid, exitCode: child.exitCode, signal: child.signalCode, exited: child.exitCode !== null || child.signalCode !== null };
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url); this.next = 0; this.pending = new Map(); this.console = []; this.exceptions = [];
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const item = this.pending.get(message.id);
        if (item) { this.pending.delete(message.id); clearTimeout(item.timer); message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result); }
      }
      if (message.method === 'Runtime.consoleAPICalled') this.console.push({ type: message.params.type, text: message.params.args.map(a => a.value ?? a.description ?? '').join(' ') });
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails);
    });
    this.ws.addEventListener('close', () => { for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(Error('CDP closed')); } this.pending.clear(); });
  }
  ready() { return new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); }); }
  send(method, params = {}) {
    if (this.ws.readyState !== WebSocket.OPEN) return Promise.reject(Error(`CDP unavailable: ${method}`));
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
      this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const value = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
    return value.result?.value;
  }
}

/** Count increments in the authored coalescing ring, not repeated observations.
 * Damage on a collapsed row is only the newest hit's damage: never sum it as
 * cumulative damage. Missing/evicted rows and cadence are recorded separately.
 */
export function eventCounter() {
  let lastT = null;
  const counts = new Map(), seen = new Set();
  return snapshot => {
    const delta = { playerFire: 0, targetHits: [], playerHits: 0, bodyHits: 0, outcomes: [], epochReset: false };
    if (lastT !== null && snapshot.t < lastT) { counts.clear(); seen.clear(); delta.epochReset = true; }
    lastT = snapshot.t;
    for (const event of snapshot.events || []) {
      const keyField = ({ playerFire: 'weapon', npcHit: 'targetId', playerHit: 'family', bodyHit: 'kind' })[event.type];
      if (keyField && event[keyField] !== undefined) {
        const key = `${event.type}:${event[keyField]}`, n = Number(event.count || 1), prior = counts.get(key);
        // A lower count is a ring reset/eviction, not a negative event count.
        const increment = prior === undefined || n < prior ? n : n - prior;
        counts.set(key, n);
        if (event.type === 'playerFire') delta.playerFire += increment;
        if (event.type === 'npcHit' && increment) delta.targetHits.push({ targetId: event.targetId, count: increment, latestDamageOnly: event.damage });
        if (event.type === 'playerHit') delta.playerHits += increment;
        if (event.type === 'bodyHit') delta.bodyHits += increment;
      } else {
        const key = JSON.stringify(event);
        if (!seen.has(key)) { seen.add(key); if (['npcDisabled', 'npcSurrendered', 'npcDestroyed', 'npcEscaped', 'npcSheltered', 'jobState', 'playerDestroyed', 'recovered'].includes(event.type)) delta.outcomes.push(event); }
      }
    }
    return delta;
  };
}

export function measurements(samples, targetId) {
  if (!samples.length) return null;
  let distance = 0, stationaryThreat = 0, threatened = 0, maxGap = 0, shots = 0, hits = 0, bodyHits = 0;
  let targetMoving = false, minimumAt = -1, minRange = Infinity, approachSeen = false, separationAfterPass = false;
  const ranges = [], phases = new Set();
  for (let i = 0; i < samples.length; i++) {
    const row = samples[i], s = row.observation, prev = samples[i - 1];
    const dt = prev ? Math.max(0, s.t - prev.observation.t) : 0;
    maxGap = Math.max(maxGap, dt);
    const r = s.targets.current?.id === targetId ? s.targets.current.range : null;
    if (Number.isFinite(r)) { ranges.push(r); if (r < minRange) { minRange = r; minimumAt = i; } }
    if (s.targets.aim?.speed > 1) targetMoving = true;
    phases.add(s.control.combat?.phase || s.control.state);
    shots += row.delta.playerFire; hits += row.delta.targetHits.filter(e => e.targetId === targetId).reduce((n, e) => n + e.count, 0); bodyHits += row.delta.bodyHits;
    if (prev) {
      const a = prev.observation.ship.pos, b = s.ship.pos;
      if (a && b) distance += Math.hypot(...a.map((x, i) => b[i] - x));
      const was = prev.observation;
      const threat = was.flags.combat || (was.targets.current?.hostile && was.targets.current.range <= 500) || prev.delta.playerHits > 0;
      if (threat) { threatened += dt; if (was.ship.speed < 1) stationaryThreat += dt; }
    }
  }
  const first = samples[0].observation, last = samples.at(-1).observation;
  if (minimumAt > 0) {
    approachSeen = samples.slice(0, minimumAt).some(row => row.observation.targets.current?.id === targetId && row.observation.targets.current.range > minRange + 20);
    separationAfterPass = samples.slice(minimumAt + 1).some(row => row.observation.targets.current?.id === targetId && row.observation.targets.current.range > minRange + 20);
  }
  ranges.sort((a, b) => a - b);
  return { wallSeconds: (samples.at(-1).wall - samples[0].wall) / 1000, simulationSeconds: last.t - first.t, sampledDistance: distance, maxSampleGapSimulation: maxGap,
    separation: ranges.length ? { min: ranges[0], median: ranges[Math.floor(ranges.length / 2)], max: ranges.at(-1) } : null,
    playerShots: shots, targetHitActivityUnattributed: hits, confirmedPlayerHits: null, bodyHitEvents: bodyHits, estimatedThreatenedSeconds: threatened, estimatedStationaryThreatSeconds: stationaryThreat,
    stationaryDefinition: 'speed <1 u/s; previous sample held over each interval', threatDefinition: 'public combat flag, or selected hostile within 500u, or playerHit delta in previous sample',
    damageNet: Object.fromEntries(['hull', 'engine', 'screen', 'shell'].map(k => [k, first.ship[k] - last.ship[k]])),
    targetMovingObserved: targetMoving, approachThenSeparationObserved: approachSeen && separationAfterPass,
    survival: last.session.phase === 'playing' && last.ship.hull > 0, phases: [...phases], completion: last.control, outcomes: samples.flatMap(s => s.delta.outcomes) };
}

export async function runLive(name, mode, fn, options = {}) {
  if (process.env.ISSUE61_TRANSPORT === 'iab') {
    const { runIab } = await import('./issue-61-live-iab.mjs');
    return runIab(name, mode, fn, options);
  }
  assert(/^[a-z0-9-]+$/.test(name), 'Invalid run name');
  const out = resolve(process.env.ISSUE61_OUT || join(repo, 'out', 'issue-61-live'));
  const folder = join(out, name); await mkdir(folder, { recursive: true });
  const profileRoot = await mkdtemp(join(folder, 'temporary-profile-'));
  const profile = join(profileRoot, 'chrome'), cacheDir = join(profileRoot, 'vite');
  const config = join(repo, 'out', `issue61-vite-${process.pid}.mjs`);
  await mkdir(dirname(config), { recursive: true });
  await writeFile(config, `export default {root:${JSON.stringify(repo)},cacheDir:${JSON.stringify(cacheDir)}};`);
  const keepOpen = process.env.ISSUE61_KEEP_OPEN === '1' || (mode === 'natural' && process.env.ISSUE61_KEEP_OPEN !== '0');
  const result = { name, mode, fixture: mode === 'controlled', browserVisible: true, keepOpen, role: 'supplemental Codex verification; Claude owns independent QA', started: new Date().toISOString(), profile, actions: [], checkpoints: [], trials: [], jobEvents: [], consoleErrors: [], exceptions: [], processLogs: [] };
  const save = () => writeFile(join(folder, 'result.json'), JSON.stringify(result, null, 2));
  let vite, chrome, c, tail = Promise.resolve();
  const serial = fn => { const pending = tail.then(fn); tail = pending.catch(() => {}); return pending; };
  const log = value => appendFile(join(folder, 'api.jsonl'), `${JSON.stringify(value)}\n`);
  try {
    result.identityStart = await identity(); result.port = await availablePort();
    vite = spawn(process.execPath, [fileURLToPath(new URL('../../bin/vite.js', import.meta.resolve('vite'))), '--config', config, '--host', '127.0.0.1', '--port', String(result.port), '--strictPort'], { cwd: repo, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    result.vitePid = vite.pid; vite.on('error', e => result.processLogs.push(String(e)));
    vite.stdout.on('data', b => result.processLogs.push(String(b))); vite.stderr.on('data', b => result.processLogs.push(String(b)));
    let ready = false;
    for (let i = 0; i < 100; i++) { if (await fetch(`http://127.0.0.1:${result.port}`).then(r => r.ok).catch(() => false)) { ready = true; break; } assert(vite.exitCode === null, 'Vite exited'); await sleep(200); }
    assert(ready, 'Loopback Vite unavailable');
    chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--enable-webgl', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--window-size=1440,900', '--window-position=50,50', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { windowsHide: false, stdio: ['ignore', 'ignore', 'pipe'] });
    result.chromePid = chrome.pid; chrome.on('error', e => result.processLogs.push(String(e))); chrome.stderr.on('data', b => result.processLogs.push(String(b).slice(0, 500)));
    let page;
    for (let i = 0; i < 120; i++) {
      try { result.cdpPort = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); page = (await fetch(`http://127.0.0.1:${result.cdpPort}/json/list`).then(r => r.json())).find(p => p.type === 'page'); if (page) break; } catch {}
      assert(chrome.exitCode === null, 'Chrome exited'); await sleep(200);
    }
    assert(page, 'CDP unavailable'); c = new CDP(page.webSocketDebuggerUrl); c.pageId = page.id; await c.ready(); await c.send('Runtime.enable'); await c.send('Page.enable');
    // Only controlled trials replace RNG; natural mode never injects game state.
    if (mode === 'controlled') await c.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__issue61Seed=6101; Math.random=()=>{let t=window.__issue61Seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};' });
    await c.send('Page.navigate', { url: `http://127.0.0.1:${result.port}/?agent=1` });
    for (let i = 0; i < 160; i++) { if (await c.eval('!!window.rimward')) break; await sleep(200); }
    const jobEventsSeen = new Set();
    const observe = () => serial(async () => {
      const value = await c.eval('window.rimward.observe()'); assert(value?.ok && value.v === 2, 'Invalid public observation');
      for (const event of value.events || []) if (event.type === 'jobState') {
        const key = JSON.stringify(event); if (!jobEventsSeen.has(key)) { jobEventsSeen.add(key); result.jobEvents.push(event); }
      }
      await log({ op: 'observe', wall: Date.now(), value }); return value;
    });
    const act = (name, args = {}, must = true) => serial(async () => {
      const request = { v: 2, name, args }, value = await c.eval(`window.rimward.act(${JSON.stringify(request)})`), row = { op: 'act', wall: Date.now(), request, value };
      result.actions.push(row); await log(row); if (must) assert(value?.ok === true, `${name} refused: ${JSON.stringify(value)}`); return value;
    });
    const shot = async name => { assert(/^[a-z0-9-]+$/.test(name), 'Invalid screenshot name'); const image = await c.send('Page.captureScreenshot', { format: 'png' }); await writeFile(join(folder, `${name}.png`), Buffer.from(image.data, 'base64')); };
    const checkpoint = async name => { const observation = await observe(); result.checkpoints.push({ name, wall: Date.now(), observation }); await save(); await shot(name); console.log('CHECKPOINT', name, observation.t, observation.control.reason); return observation; };
    const wait = async (predicate, seconds, label, sample) => {
      const wallEnd = Date.now() + Math.max(30000, seconds * 2500); let start, value;
      while (Date.now() < wallEnd) { value = await observe(); start ??= value.t; if (sample) await sample(value); if (predicate(value)) return value; if (value.t - start > seconds) break; await sleep(200); }
      throw Error(`Timeout ${label}: ${JSON.stringify({ t: value?.t, control: value?.control, flags: value?.flags })}`);
    };
    let s = await observe(); if (s.session.phase === 'title') await act('startGame'); s = await observe(); if (s.session.phase === 'origin') await act('chooseOrigin', { id: 'greenhand' }); await wait(s => s.session.phase === 'playing', 20, 'playing');
    result.graphics = await c.eval(`(()=>{const g=document.querySelector('canvas')?.getContext('webgl2');const e=g?.getExtension('WEBGL_debug_renderer_info');return {visibility:document.visibilityState,renderer:g?(e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)):null};})()`);
    console.log('BOOT', name, JSON.stringify(result.graphics)); await save();
    await fn({ c, result, save, observe, act, shot, checkpoint, wait, folder });
    assert(!c.console.some(e => ['error', 'assert'].includes(e.type)) && c.exceptions.length === 0, 'Browser errors/exceptions');
    result.checksCompleted = true;
  } catch (error) { result.error = error.stack; result.checksCompleted = false; console.error(error.stack); process.exitCode = 1; }
  finally {
    result.identityAfterScenario = await identity();
    result.measurementSourceStable = result.identityStart?.sourceHash === result.identityAfterScenario.sourceHash;
    result.measurementHarnessStable = result.identityStart?.harnessHash === result.identityAfterScenario.harnessHash;
    if (!result.measurementSourceStable || !result.measurementHarnessStable) { result.checksCompleted = false; process.exitCode = 1; }
    if (keepOpen && c?.ws.readyState === WebSocket.OPEN) {
      // Preserve the exact tested browser for the owner. Public stop/pause
      // actions make retention bounded and inert, including exception paths.
      try {
        result.retentionStops = await c.eval(`(()=>{const r=window.rimward;if(!r)return null;return ['clearControl','cancelAutopilot','cancelAutomine'].map(name=>({name,result:r.act({v:2,name,args:{}})}));})()`);
        const s = await c.eval('window.rimward.observe()');
        if (s?.session?.phase === 'playing' && !s.flags.paused && !s.flags.docked) {
          for (const type of ['keyDown', 'keyUp']) await c.send('Input.dispatchKeyEvent', { type, key: 'p', code: 'KeyP', windowsVirtualKeyCode: 80, nativeVirtualKeyCode: 80 });
        }
        result.retainedObservation = await c.eval('window.rimward.observe()');
      } catch (e) { result.retentionSafetyError = String(e); result.checksCompleted = false; process.exitCode = 1; }
      result.consoleErrors = c.console.filter(e => ['error', 'assert'].includes(e.type)); result.exceptions = c.exceptions;
      result.retainedAt = new Date().toISOString(); result.cleanupRequestPath = join(folder, 'close-requested');
      result.retained = true; await save();
      console.log('RETAINED FOR OWNER', JSON.stringify({ name, result: join(folder, 'result.json'), chromePid: result.chromePid, vitePid: result.vitePid, port: result.port, cdpPort: result.cdpPort, cleanupRequestPath: result.cleanupRequestPath, checksCompleted: result.checksCompleted }));
      while (c.ws.readyState === WebSocket.OPEN) {
        if (await access(result.cleanupRequestPath).then(() => true).catch(() => false)) { result.cleanupRequestedByRoot = true; break; }
        await sleep(500);
      }
      result.retained = false;
    }
    if (c) { result.consoleErrors = c.console.filter(e => ['error', 'assert'].includes(e.type)); result.exceptions = c.exceptions; try { await c.send('Browser.close'); } catch (e) { result.browserCloseError = String(e); } c.ws.close(); await sleep(300); }
    result.cleanup = { chrome: await stop(chrome), vite: await stop(vite) };
    const responds = port => port ? fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1500) }).then(() => true).catch(() => false) : false;
    result.closedPorts = { vite: !(await responds(result.port)), cdp: !(await responds(result.cdpPort)) };
    result.identityEnd = await identity(); result.sourceStable = result.measurementSourceStable;
    result.sourceChangedWhileRetained = result.identityAfterScenario.sourceHash !== result.identityEnd.sourceHash;
    if (!result.sourceStable || Object.values(result.cleanup).some(p => p.started !== false && !p.exited) || Object.values(result.closedPorts).some(v => !v)) { result.checksCompleted = false; process.exitCode = 1; }
    // Only remove this process's freshly generated absolute temp directory.
    const rel = relative(resolve(folder), resolve(profileRoot));
    if (Object.values(result.cleanup).every(p => p.started === false || p.exited) && rel && !rel.startsWith('..') && !isAbsolute(rel)) { try { await rm(profileRoot, { recursive: true, force: true }); result.profileRemoved = true; } catch (e) { result.profileCleanupError = String(e); } }
    try { await rm(config, { force: true }); } catch {}
    result.finished = new Date().toISOString(); await save(); console.log('SUPPLEMENTAL', name, result.checksCompleted ? 'checks completed' : 'failed/incomplete');
  }
  return result;
}
