// One-off Wave 78 Jobs pane capture. Evidence only. Do not import from src/.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const APP = 'http://127.0.0.1:5173/';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.sessionId = null;
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const inner = msg.method === 'Target.dispatchMessageToTarget' || msg.sessionId
        ? (msg.params?.message ? JSON.parse(msg.params.message) : msg)
        : msg;
      const payload = inner.sessionId && inner.result === undefined && inner.error === undefined && inner.params
        ? inner
        : inner;
      const id = payload.id ?? msg.id;
      const p = this.pending.get(id);
      if (!p) return;
      this.pending.delete(id);
      if (payload.error) p.reject(new Error(JSON.stringify(payload.error)));
      else p.resolve(payload.result);
    });
  }
  ready() {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res(), { once: true });
      this.ws.addEventListener('error', (e) => rej(e), { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    const body = { id, method, params };
    if (this.sessionId) body.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('cdp timeout ' + method));
        }
      }, 15000);
      this.ws.send(JSON.stringify(body));
    });
  }
  eval(expression, awaitPromise = false) {
    return this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
  }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(path, Buffer.from(r.data, 'base64'));
  }
  close() { this.ws.close(); }
}

async function waitJson(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error('CDP JSON not ready: ' + url);
}

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(here, 'chrome-profile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--headless=new',
  '--window-size=1280,800',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
], { stdio: 'ignore' });

let cdp;
try {
  await mkdir(here, { recursive: true });
  const ver = await waitJson(`http://127.0.0.1:${PORT}/json/version`);
  cdp = new Cdp(ver.webSocketDebuggerUrl);
  await cdp.ready();
  const created = await cdp.send('Target.createTarget', { url: APP });
  const targetId = created.targetId;
  const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  cdp.sessionId = attached.sessionId;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await sleep(4000);
  const href = await cdp.eval('location.href + " :: " + document.title + " :: " + document.body.children.length');
  await writeFile(join(here, 'browser-href.json'), JSON.stringify(href.result ?? href, null, 2));

  const boot = await cdp.eval(`(function(){
    const title = document.getElementById('rw-title');
    const newBtn = document.getElementById('rw-title-new');
    return {
      title: !!title,
      newLabel: newBtn ? newBtn.textContent : null,
      fatal: document.body.innerText.slice(0, 400),
      hasCtx: typeof window.__ctx === 'object' && window.__ctx != null,
    };
  })()`);
  await writeFile(join(here, 'browser-boot.json'), JSON.stringify(boot.result?.value ?? boot, null, 2));
  await cdp.screenshot(join(here, 'jobs-00-title.png'));

  const label = boot.result?.value?.newLabel || '';
  await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
  await sleep(400);
  if (/CONFIRM/i.test(label)) {
    await cdp.eval(`document.getElementById('rw-title-new')?.click()`);
    await sleep(2500);
  }
  await sleep(600);

  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '1', code: 'Digit1', windowsVirtualKeyCode: 49 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '1', code: 'Digit1', windowsVirtualKeyCode: 49 });
  await sleep(800);

  const afterOrigin = await cdp.eval(`(function(){
    const t = document.body.innerText;
    return {
      hasTitle: !!document.getElementById('rw-title'),
      who: /who are you/i.test(t),
      hasCtx: typeof window.__ctx === 'object' && window.__ctx != null,
      sys: window.__ctx?.world?.currentSystem ?? null,
      docked: !!window.__ctx?.flags?.docked,
    };
  })()`);
  await writeFile(join(here, 'browser-origin.json'), JSON.stringify(afterOrigin.result?.value ?? afterOrigin, null, 2));

  const docked = await cdp.eval(`(function(){
    const ctx = window.__ctx;
    if (!ctx) return { ok:false, why:'no ctx' };
    const sys = ctx.world.currentSystem;
    const st = ctx.systems[sys]?.station?.position;
    if (!st || !ctx.ship?.object) return { ok:false, why:'no station/ship', sys };
    ctx.ship.object.position.set(st[0] + 36, st[1], st[2]);
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0,0,0);
    ctx.ship.speed = 0;
    ctx.input.dockPressed = true;
    return { ok:true, sys, pos:[st[0]+36, st[1], st[2]] };
  })()`);
  await sleep(500);
  await cdp.eval(`window.__ctx && (window.__ctx.input.dockPressed = false)`);
  await sleep(400);

  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '2', code: 'Digit2', windowsVirtualKeyCode: 50 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '2', code: 'Digit2', windowsVirtualKeyCode: 50 });
  await sleep(400);

  const jobs = await cdp.eval(`(function(){
    const cards = [...document.querySelectorAll('.job-card')];
    const overlay = document.querySelector('.screen-overlay:not(.title-overlay)');
    const info = cards.map((c) => ({
      text: c.innerText,
      html: c.innerHTML,
      usesInnerHtmlApi: false,
      title: c.querySelector('.job-title')?.textContent ?? '',
      detail: c.querySelector('.job-detail')?.textContent ?? '',
      reward: c.querySelector('.job-reward')?.textContent ?? '',
      accept: [...c.querySelectorAll('button')].map((b) => b.textContent),
    }));
    const hunt = info.filter((x) => /^\\d+\\. Hunt /.test(x.title) || /\\bHunt /.test(x.title));
    const bounty = info.filter((x) => /Bounty:/i.test(x.title) || /Hunt /.test(x.title) === false && /pirate|reaver|bounty/i.test(x.text));
    const recLeak = info.some((x) => /\\brec-\\d+/.test(x.text));
    const imgInject = cards.some((c) => c.querySelector('img,script,iframe'));
    const huntJobs = (window.__ctx?.world?.jobs || []).filter((j) => j.kind === 'hunt'
      && (j.state === 'offered' || j.state === 'accepted') && j.originSystem === window.__ctx.world.currentSystem);
    return {
      docked: !!window.__ctx?.flags?.docked,
      sys: window.__ctx?.world?.currentSystem ?? null,
      overlayDisplay: overlay ? getComputedStyle(overlay).display : null,
      cardCount: cards.length,
      huntCardCount: hunt.length,
      titles: info.map((x) => x.title),
      huntTitles: hunt.map((x) => x.title),
      huntDetails: hunt.map((x) => x.detail),
      acceptButtons: info.flatMap((x) => x.accept),
      recLeak,
      imgInject,
      huntJobCount: huntJobs.length,
      huntNames: huntJobs.map((j) => j.target),
      huntRecordIds: huntJobs.map((j) => j.recordId),
      overlayPirates: (window.__ctx?.world?.jobs || []).filter((j) => j.kind === 'bounty'
        && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-') && j.state !== 'done')
        .map((j) => ({ id:j.id, target:j.target, state:j.state })),
    };
  })()`);
  await writeFile(join(here, 'browser-jobs.json'), JSON.stringify(jobs.result?.value ?? jobs, null, 2));
  await cdp.screenshot(join(here, 'jobs-pane.png'));

  const huntAccept = await cdp.eval(`(function(){
    const cards = [...document.querySelectorAll('.job-card')];
    const hunt = cards.find((c) => /Hunt /.test(c.querySelector('.job-title')?.textContent || ''));
    const btn = hunt && [...hunt.querySelectorAll('button')].find((b) => /Accept/.test(b.textContent));
    if (!btn) return { clicked:false };
    btn.click();
    return { clicked:true, label: btn.textContent };
  })()`);
  await sleep(300);
  const afterAccept = await cdp.eval(`(function(){
    const cards = [...document.querySelectorAll('.job-card')];
    const accepted = [...document.querySelectorAll('.job-accepted')].map((n) => n.textContent);
    const hunts = (window.__ctx?.world?.jobs || []).filter((j) => j.kind === 'hunt');
    return {
      acceptedLines: accepted,
      huntStates: hunts.filter((j) => j.originSystem === window.__ctx.world.currentSystem)
        .map((j) => ({ id:j.id, state:j.state, target:j.target, recordId:j.recordId })),
      notice: document.body.innerText.match(/Accepted:.*/)?.[0] ?? null,
    };
  })()`);
  await writeFile(join(here, 'browser-accept.json'), JSON.stringify({
    click: huntAccept.result?.value ?? huntAccept,
    after: afterAccept.result?.value ?? afterAccept,
  }, null, 2));
  await cdp.screenshot(join(here, 'jobs-accept.png'));

  console.log('CDP jobs capture done');
} catch (err) {
  await writeFile(join(here, 'browser-error.txt'), String(err && err.stack || err));
  console.error(err);
  process.exitCode = 1;
} finally {
  try { cdp?.close(); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { process.kill(chrome.pid, 'SIGKILL'); } catch {}
}
