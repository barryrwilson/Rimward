/** Issue 61 DIAGNOSTIC production bytes and cold browser-cache startup.
 * Never an npm build PASS or an independent QA verdict. No game/policy edits.
 * Prepare/run separately under Root's named gate:
 *   node scripts/issue-61-production-live.mjs --mode candidate --name NAME
 *   node scripts/issue-61-production-live.mjs --mode startup --name NAME --candidate NAME
 * Evidence: out/issue-61-live/NAME/. Five serial visible fresh Chrome profiles.
 */
import { build, loadConfigFromFile } from 'vite';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, readdir, mkdtemp, rm, stat, access } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { auditBrowserModules, BUNDLE_BUDGET, measureJavaScript } from './bundle-policy.mjs';
import { repo, identity, sleep, assert } from './issue-61-live-harness.mjs';

const argv = process.argv.slice(2);
const option = (key, fallback) => { const i = argv.indexOf('--' + key); return i < 0 ? fallback : argv[i + 1]; };
const mode = option('mode'), name = option('name'), candidateName = option('candidate');
const count = Number(option('count', '5'));
assert(Number.isInteger(count) && count >= 1 && count <= 5, '--count must be 1..5; final compliance requires five');
assert(['candidate', 'startup'].includes(mode), 'Explicit --mode candidate|startup required');
assert(/^[a-z0-9-]+$/.test(name || ''), 'Explicit safe --name required');
const evidenceRoot = join(repo, 'out', 'issue-61-live'), folder = join(evidenceRoot, name);
const sha = data => createHash('sha256').update(data).digest('hex');
const within = (root, path) => { const rel = relative(resolve(root), resolve(path)); return rel && !rel.startsWith('..') && !isAbsolute(rel); };
assert(!(await access(join(folder, 'result.json')).then(() => true).catch(() => false)), 'Do not overwrite existing evidence');
await mkdir(folder, { recursive: true });
const scriptPath = fileURLToPath(import.meta.url);
const result = { name, mode, diagnosticOnly: true, npmBuildPassClaimed: false, independentQa: false, started: new Date().toISOString(), identityStart: await identity(), scriptHash: sha(await readFile(scriptPath)) };
const save = () => writeFile(join(folder, 'result.json'), JSON.stringify(result, null, 2));
await save();

async function artifactManifest(root) {
  const files = [];
  async function visit(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      assert(!ent.isSymbolicLink(), 'Candidate contains an unexpected symbolic link');
      if (ent.isDirectory()) await visit(p);
      else if (ent.isFile()) { const data = await readFile(p); files.push({ path: relative(root, p).replaceAll('\\', '/'), bytes: data.byteLength, sha256: sha(data) }); }
    }
  }
  await visit(root); files.sort((a, b) => a.path.localeCompare(b.path));
  return { files, sha256: sha(JSON.stringify(files)), count: files.length, bytes: files.reduce((sum, f) => sum + f.bytes, 0) };
}

async function makeCandidate() {
  const configPath = join(repo, 'vite.config.js'), policyPath = join(repo, 'scripts', 'bundle-policy.mjs');
  result.configuration = { path: configPath, sha256: sha(await readFile(configPath)), policySha256: sha(await readFile(policyPath)), packageSha256: sha(await readFile(join(repo, 'package.json'))), lockSha256: sha(await readFile(join(repo, 'package-lock.json'))) };
  const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, configPath, repo);
  assert(loaded?.config && Array.isArray(loaded.config.plugins), 'Expected current production config');
  const policyName = 'rimward-production-bundle-policy';
  assert(loaded.config.plugins.filter(p => p?.name === policyName).length === 1, 'Production policy shape changed; inspect before diagnostic build');
  const diagnosticPolicy = {
    name: 'issue-61-diagnostic-production-policy', apply: 'build',
    async generateBundle(_options, bundle) {
      const measured = measureJavaScript(bundle), boundary = auditBrowserModules(measured.chunks);
      const modules = measured.chunks.flatMap(chunk => Object.entries(chunk.modules).map(([id, detail]) => ({ chunk: chunk.fileName, module: id.replaceAll('\\', '/'), renderedBytes: detail.renderedLength }))).sort((a, b) => a.module.localeCompare(b.module));
      result.audit = {
        budgets: BUNDLE_BUDGET,
        totals: { minifiedBytes: measured.minifiedBytes, gzipBytes: measured.gzipBytes, chunks: measured.chunks.length },
        minifiedPass: measured.minifiedBytes <= BUNDLE_BUDGET.minifiedBytes,
        gzipPass: measured.gzipBytes <= BUNDLE_BUDGET.gzipBytes,
        browserBoundary: boundary, modules,
      };
      result.audit.byteAuditPass = result.audit.minifiedPass && result.audit.gzipPass;
      result.audit.productionPolicyEquivalent = result.audit.byteAuditPass && boundary.pass ? 'PASS' : 'FAIL';
      result.audit.note = 'Diagnostic candidate only: exact production measurement and complete module boundary audit. Byte failure is recorded instead of throwing so startup can be measured. This is not npm build.';
      await save();
      // Unlike a byte diagnostic, a dependency-boundary failure does not get
      // a runnable browser candidate. Keep the original allowlist unchanged.
      if (!boundary.pass) this.error('Diagnostic candidate blocked by production browser dependency-boundary audit');
      if (!result.audit.byteAuditPass) this.warn('DIAGNOSTIC ONLY: byte audit FAIL; npm build has not passed');
    },
  };
  result.candidatePath = join(folder, 'candidate');
  result.configDifference = 'Only the named audit hook is replaced with a diagnostic hook using the same measurements/limits/boundary audit; output directory is an isolated evidence folder. Production transforms, minification and chunking options remain unchanged.';
  await build({ ...loaded.config, root: repo, configFile: false, mode: 'production', plugins: loaded.config.plugins.map(p => p?.name === policyName ? diagnosticPolicy : p), build: { ...loaded.config.build, outDir: result.candidatePath, emptyOutDir: false } });
  result.artifact = await artifactManifest(result.candidatePath);
  await writeFile(join(folder, 'artifact-manifest.json'), JSON.stringify(result.artifact, null, 2));
  result.candidateEmitted = true;
  if (!result.audit.byteAuditPass) process.exitCode = 1;
  console.log('DIAGNOSTIC CANDIDATE', JSON.stringify({ path: result.candidatePath, byteAudit: result.audit.byteAuditPass ? 'PASS' : 'FAIL', boundary: result.audit.browserBoundary.pass, npmBuildPassClaimed: false, artifactHash: result.artifact.sha256 }));
}

class CDP {
  constructor(url, events) {
    this.ws = new WebSocket(url); this.n = 0; this.pending = new Map(); this.events = events;
    this.ws.addEventListener('message', e => {
      const m = JSON.parse(String(e.data));
      if (m.id) { const p = this.pending.get(m.id); if (p) { this.pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); } }
      else if (['Runtime.consoleAPICalled', 'Runtime.exceptionThrown', 'Log.entryAdded', 'Network.loadingFailed', 'Network.responseReceived', 'Network.requestServedFromCache'].includes(m.method)) this.events.push({ method: m.method, params: m.params });
    });
    this.ws.addEventListener('close', () => { for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(Error('CDP closed')); } this.pending.clear(); });
  }
  ready() { return new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); }); }
  send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++this.n, timer = setTimeout(() => { this.pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 20000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value; }
}

const startupStatus = `(() => {
  const controls=['rw-title-models','rw-title-settings','rw-title-new'].map(id=>{const el=document.getElementById(id);return {id,exists:!!el,enabled:!!el&&!el.disabled};});
  return {ms:performance.now(),navigationStart:performance.timeOrigin,ctxExists:!!window.__ctx,documentState:document.readyState,controls,
    contractReady:!!window.__ctx&&document.readyState==='complete'&&controls.every(b=>b.enabled),
    bootFlag:!!window.__rimwardBooted,visibility:document.visibilityState,focused:document.hasFocus(),navigation:performance.getEntriesByType('navigation')[0]?.toJSON()||null};
})()`;
const readyProbe = `(() => {
  const stages=[];let lastKey='',timer;
  function probe(){const s=${startupStatus};const key=JSON.stringify([s.ctxExists,s.documentState,s.controls,s.bootFlag,s.visibility,s.focused]);
    if(key!==lastKey){lastKey=key;if(stages.length<100)stages.push(s);}
    if(s.contractReady&&!window.__issue61TitleReady){window.__issue61TitleReady=s;clearInterval(timer);}
    window.__issue61StartupStages=stages;return s;
  }
  window.__issue61StartupSnapshot=probe;timer=setInterval(probe,20);probe();
  document.addEventListener('readystatechange',probe);addEventListener('load',probe);
})()`;

async function startups() {
  assert(/^[a-z0-9-]+$/.test(candidateName || ''), 'Explicit --candidate NAME required');
  const candidateResultPath = join(evidenceRoot, candidateName, 'result.json');
  const candidate = JSON.parse(await readFile(candidateResultPath, 'utf8'));
  assert(candidate.mode === 'candidate' && candidate.candidateEmitted && candidate.audit?.browserBoundary.pass && candidate.sourceStable, 'Need emitted, source-stable, boundary-approved diagnostic candidate');
  const root = resolve(candidate.candidatePath);
  assert(within(join(evidenceRoot, candidateName), root), 'Candidate must remain inside named evidence directory');
  const before = await artifactManifest(root);
  assert(before.sha256 === candidate.artifact.sha256, 'Candidate differs from its recorded artifact');
  result.candidate = { resultPath: candidateResultPath, path: root, artifactHash: before.sha256, sourceHash: candidate.identityStart.sourceHash, byteAuditPass: candidate.audit.byteAuditPass, boundaryPass: candidate.audit.browserBoundary.pass, productionPolicyEquivalent: candidate.audit.productionPolicyEquivalent };
  result.machine = { platform: os.platform(), release: os.release(), arch: os.arch(), cpuModel: os.cpus()[0]?.model, logicalCpus: os.cpus().length, totalMemoryBytes: os.totalmem(), node: process.version };
  result.method = { count, finalComplianceRequires: 5, thresholdMs: 8000, metric: 'Exact ProductionPerformanceBudget.md contract: __ctx exists, document.complete, Models/Settings/New Game controls exist and are enabled; early 20ms interval plus DOM lifecycle and read-only polling. No focus/canvas/rAF gate.', cache: 'fresh Chrome profile for every run + Network.setCacheDisabled(true) + Network.setBypassServiceWorker(true); static server Cache-Control:no-store', caveat: 'Cold browser cache; OS filesystem cache is not flushed. Navigation metric excludes launching Chrome; launch-to-ready also recorded.', visibility: 'Separate visible external Chrome window, serial one browser/tab per run; not the user IAB surface', graphics: 'Platform GPU, browser sandbox enabled; no headless/software-renderer switches' };
  result.runs = [];
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.ktx2': 'image/ktx2' };
  const server = createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname), p = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!within(root, p) || !(await stat(p)).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': mime[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(req.method === 'HEAD' ? undefined : await readFile(p));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  result.staticPort = server.address().port;
  try {
    for (let n = 1; n <= count; n++) {
      const run = { n, events: [], processLog: [], start: new Date().toISOString() }; result.runs.push(run);
      const profile = await mkdtemp(join(folder, `cold-${n}-profile-`)); run.profile = profile;
      let chrome, c;
      const launchAt = Date.now();
      try {
        chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--window-size=1440,900', '--window-position=50,50', 'about:blank'], { windowsHide: false, stdio: ['ignore', 'ignore', 'pipe'] });
        run.pid = chrome.pid; chrome.stderr.on('data', d => { if (run.processLog.length < 50) run.processLog.push(String(d).slice(0, 1000)); });
        let launchError; chrome.on('error', e => { launchError = e; });
        let page;
        for (let i = 0; i < 150; i++) {
          if (launchError) throw launchError;
          try { run.cdpPort = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0]); page = (await fetch(`http://127.0.0.1:${run.cdpPort}/json/list`).then(r => r.json())).find(p => p.type === 'page'); if (page) break; } catch {}
          assert(chrome.exitCode === null, 'Chrome exited before CDP'); await sleep(100);
        }
        assert(page, 'Chrome CDP unavailable'); c = new CDP(page.webSocketDebuggerUrl, run.events); await c.ready();
        run.browser = await c.send('Browser.getVersion');
        await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable'); await c.send('Network.enable');
        await c.send('Network.setCacheDisabled', { cacheDisabled: true }); await c.send('Network.setBypassServiceWorker', { bypass: true });
        await c.send('Page.addScriptToEvaluateOnNewDocument', { source: readyProbe });
        run.navigationWall = Date.now();
        await c.send('Page.navigate', { url: `http://127.0.0.1:${result.staticPort}/?issue61startup=${n}` });
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          try { run.ready = await c.eval('(window.__issue61StartupSnapshot?.(), window.__issue61TitleReady || null)'); }
          catch (e) { (run.evaluationErrors ||= []).push(String(e)); }
          if (run.ready) break; await sleep(50);
        }
        run.finalDomStatus = await c.eval(startupStatus);
        run.stages = await c.eval('window.__issue61StartupStages || []');
        run.launchToReadyWallMs = Date.now() - launchAt;
        run.navigationToReadyMs = run.ready?.ms ?? null;
        run.renderer = await c.eval(`(()=>{const c=document.querySelector('canvas'),g=c?.getContext('webgl2');if(!g)return null;const x=g.getExtension('WEBGL_debug_renderer_info');return {vendor:x?g.getParameter(x.UNMASKED_VENDOR_WEBGL):null,renderer:x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):null};})()`);
        const screenshot = await c.send('Page.captureScreenshot', { format: 'png' }); await writeFile(join(folder, `cold-${n}-title.png`), Buffer.from(screenshot.data, 'base64'));
        await sleep(200); // Capture immediate post-ready errors without changing the timed metric.
        run.errors = run.events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') || e.method === 'Network.loadingFailed');
        run.cacheEvidence = { servedFromCacheEvents: run.events.filter(e => e.method === 'Network.requestServedFromCache').length, cachedResponses: run.events.filter(e => e.method === 'Network.responseReceived' && (e.params.response.fromDiskCache || e.params.response.fromServiceWorker || e.params.response.fromPrefetchCache)).length };
        run.pass = !!run.ready && run.ready.contractReady && run.ready.ms <= 8000 && run.errors.length === 0 && run.cacheEvidence.servedFromCacheEvents === 0 && run.cacheEvidence.cachedResponses === 0;
      } catch (e) { run.error = e.stack; run.pass = false; }
      finally {
        if (c) { try { await c.send('Browser.close'); } catch {} try { c.ws.close(); } catch {} }
        if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
          for (let i = 0; i < 50 && chrome.exitCode === null && chrome.signalCode === null; i++) await sleep(100);
          if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGTERM');
          for (let i = 0; i < 30 && chrome.exitCode === null && chrome.signalCode === null; i++) await sleep(100);
        }
        run.processExited = !chrome || chrome.exitCode !== null || chrome.signalCode !== null;
        run.cdpPortClosed = !run.cdpPort || !(await fetch(`http://127.0.0.1:${run.cdpPort}/json/version`, { signal: AbortSignal.timeout(1000) }).then(() => true).catch(() => false));
        if (run.processExited) {
          assert(within(folder, profile), 'Profile cleanup escaped evidence folder');
          try { await rm(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 300 }); run.profileRemoved = true; } catch (e) { run.cleanupError = String(e); }
        }
        await save(); console.log('COLD START', JSON.stringify({ n, ms: run.navigationToReadyMs, pass: run.pass, processExited: run.processExited, result: join(folder, 'result.json') }));
      }
      assert(run.processExited && run.cdpPortClosed, 'Prior browser did not exit; refuse parallel next startup');
    }
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); result.staticServerClosed = true; }
  const times = result.runs.map(r => r.navigationToReadyMs).filter(Number.isFinite).sort((a, b) => a - b);
  const requestedRunsPass = result.runs.length === count && result.runs.every(r => r.pass && r.processExited && r.cdpPortClosed && r.profileRemoved);
  result.summary = { required: 5, requested: count, measured: times.length, medianMs: times.length === 5 ? times[2] : null, maxMs: times.length ? Math.max(...times) : null, thresholdMs: 8000, diagnosticOnlyCount: count !== 5, requestedRunsPass, pass: count === 5 && requestedRunsPass };
  result.artifactStable = (await artifactManifest(root)).sha256 === before.sha256;
  if (!result.artifactStable) result.summary.pass = false;
  if (!requestedRunsPass || !result.artifactStable) process.exitCode = 1;
}

try { if (mode === 'candidate') await makeCandidate(); else await startups(); }
catch (e) { result.error = e.stack; process.exitCode = 1; console.error(e.stack); }
finally {
  result.identityEnd = await identity(); result.sourceStable = result.identityStart.sourceHash === result.identityEnd.sourceHash;
  result.scriptStable = result.scriptHash === sha(await readFile(scriptPath));
  if (!result.sourceStable || !result.scriptStable) { process.exitCode = 1; if (result.summary) result.summary.pass = false; }
  result.finished = new Date().toISOString(); await save();
  console.log('DIAGNOSTIC RESULT', JSON.stringify({ result: join(folder, 'result.json'), summary: result.summary, npmBuildPassClaimed: false, sourceStable: result.sourceStable }));
}
