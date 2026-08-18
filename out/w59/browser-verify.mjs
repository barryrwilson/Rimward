/**
 * Wave 59 live check. Does not touch src/. Uses the Vite server already on :5173.
 */
import puppeteer from '../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5173/';
const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--hide-scrollbars',
    '--no-first-run',
  ],
});

const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (err) => {
  pageErrors.push(err.message);
  say('PAGEERR', err.message);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') say('ERROR', msg.text());
});

await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
    localStorage.removeItem('rimward-save-v1');
  } catch {}
});

await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 30000 });
await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  if (neu) {
    neu.click();
    if (neu.textContent.includes('CONFIRM')) neu.click();
  }
});
await page.keyboard.press('Digit1');
await new Promise((r) => setTimeout(r, 1600));

const ready = await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
}, { timeout: 30000 }).catch(() => null);

if (!ready) {
  await page.screenshot({ path: join(OUT, 'browser-not-ready.png') });
  writeFileSync(join(OUT, 'browser-notes.txt'), log.concat('NOT READY').join('\n'));
  await browser.close();
  process.exit(1);
}

const recoil = await page.evaluate(async () => {
  const ctx = window.__ctx;
  const root = ctx.ship.object;
  const flesh = root.children.find((c) => c.name === 'flesh') || root.children[0];
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  ctx.settings.reducedMotion = false;
  ctx.flags.docked = false;
  ctx.input.fullStop = true;
  ctx.input.throttle = 0.35;
  if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
  await waitFrames(12);

  const sample = () => ({
    fy: flesh.position.y,
    fz: flesh.position.z,
    cx: ctx.camera.position.x,
    cy: ctx.camera.position.y,
    cz: ctx.camera.position.z,
  });
  const rest = sample();
  ctx.emit('playerFire', { weapon: 'cannon' });
  let maxFlesh = 0;
  let maxCam = 0;
  for (let i = 0; i < 24; i++) {
    await waitFrames(1);
    const s = sample();
    maxFlesh = Math.max(maxFlesh, Math.hypot(s.fy - rest.fy, s.fz - rest.fz));
    maxCam = Math.max(maxCam, Math.hypot(s.cx - rest.cx, s.cy - rest.cy, s.cz - rest.cz));
  }

  ctx.settings.reducedMotion = true;
  await waitFrames(20);
  const restR = sample();
  ctx.emit('playerFire', { weapon: 'disruptor' });
  let maxFleshR = 0;
  let maxCamR = 0;
  for (let i = 0; i < 16; i++) {
    await waitFrames(1);
    const s = sample();
    maxFleshR = Math.max(maxFleshR, Math.hypot(s.fy - restR.fy, s.fz - restR.fz));
    maxCamR = Math.max(maxCamR, Math.hypot(s.cx - restR.cx, s.cy - restR.cy, s.cz - restR.cz));
  }
  ctx.settings.reducedMotion = false;

  const throttleBefore = ctx.input.throttle;
  const matchBefore = !!ctx.flags.matchSpeed;
  ctx.flags.matchSpeed = true;
  ctx.emit('playerFire', { weapon: 'cannon' });
  await waitFrames(8);
  const throttleAfter = ctx.input.throttle;
  const matchAfter = !!ctx.flags.matchSpeed;
  ctx.flags.matchSpeed = matchBefore;

  return {
    maxFlesh, maxCam, maxFleshR, maxCamR,
    throttleBefore, throttleAfter, matchBefore, matchAfter,
    throttleHeld: ctx.input.throttle,
  };
});

say('recoil', JSON.stringify(recoil));

const setupDecals = await page.evaluate(async () => {
  const ctx = window.__ctx;
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const countMarks = (host) => {
    let n = 0;
    if (!host) return 0;
    host.traverse((o) => {
      if (o.isSprite && o.visible && o.parent === host) n += 1;
    });
    return n;
  };
  ctx.player.screen = 0;
  ctx.player.shell = 0;
  ctx.player.overheated = false;
  ctx.player.heat = 0;
  ctx.flags.firstPerson = true;
  ctx.flags.camera = 'first';
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  if (ctx.targets) ctx.targets.reticleScreen = { x: 0, y: 0 };
  const npc = (ctx.ships || []).find((s) => s?.object && s.state && !s.state.destroyed && s.record?.faction !== 'unknowables');
  if (!npc) return { ok: false, error: 'no live npc', shipN: (ctx.ships || []).length };
  npc.state.screen = 0;
  npc.state.shell = 0;
  npc.state.hull = 400;
  npc.state.destroyed = false;
  window.__w59Npc = npc;
  await waitFrames(8);
  const cam = ctx.camera;
  const dir = cam.position.clone();
  cam.getWorldDirection(dir);
  npc.object.position.set(
    cam.position.x + dir.x * 28,
    cam.position.y + dir.y * 28,
    cam.position.z + dir.z * 28,
  );
  ctx.targets.current = npc;
  ctx.input.weaponGroup = 1;
  ctx.__w59hits = 0;
  ctx.__w59fires = 0;
  if (!ctx.__w59hooked) {
    ctx.__w59hooked = true;
    const orig = ctx.emit.bind(ctx);
    ctx.emit = (type, payload) => {
      if (type === 'npcHit') ctx.__w59hits += 1;
      if (type === 'playerFire') ctx.__w59fires += 1;
      return orig(type, payload);
    };
  }
  return { ok: true, beforeNpc: countMarks(npc.object), beforePlayer: countMarks(ctx.ship.object) };
});
say('setupDecals', JSON.stringify(setupDecals));

await page.mouse.move(800, 450);
await page.mouse.down();
await new Promise((r) => setTimeout(r, 1800));
const afterUnshielded = await page.evaluate(() => {
  const npc = window.__w59Npc;
  const countMarks = (host) => {
    let n = 0;
    if (!host) return 0;
    host.traverse((o) => {
      if (o.isSprite && o.visible && o.parent === host) n += 1;
    });
    return n;
  };
  if (npc) {
    npc.state.screen = 80;
    npc.state.shell = 80;
  }
  return {
    afterNpc: countMarks(npc && npc.object),
    hits: window.__ctx.__w59hits,
    fires: window.__ctx.__w59fires,
    hull: npc && npc.state.hull,
    destroyed: !!(npc && npc.state.destroyed),
  };
});
say('afterUnshielded', JSON.stringify(afterUnshielded));
const midNpc = afterUnshielded.afterNpc;
await new Promise((r) => setTimeout(r, 900));
await page.mouse.up();
await new Promise((r) => setTimeout(r, 200));

const decals = await page.evaluate(async () => {
  const ctx = window.__ctx;
  const npc = window.__w59Npc;
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const countMarks = (host) => {
    let n = 0;
    if (!host) return 0;
    host.traverse((o) => {
      if (o.isSprite && o.visible && o.parent === host) n += 1;
    });
    return n;
  };
  const shieldedNpc = countMarks(npc && npc.object);
  let threw = false;
  try {
    ctx.emit('npcDestroyed', { ship: npc });
    await waitFrames(4);
  } catch (err) {
    threw = true;
  }
  return {
    ok: true,
    shieldedNpc,
    afterKill: countMarks(npc && npc.object),
    hits: ctx.__w59hits,
    fires: ctx.__w59fires,
    hull: npc && npc.state.hull,
    destroyed: !!(npc && npc.state.destroyed),
    threw,
  };
});
decals.beforeNpc = setupDecals.beforeNpc || 0;
decals.afterNpc = afterUnshielded.afterNpc || 0;
decals.midNpc = midNpc || 0;

say('decals', JSON.stringify(decals));
await page.screenshot({ path: join(OUT, 'browser-live.png'), type: 'png' });

const recoilOk = recoil
  && recoil.maxFlesh > 0.05
  && recoil.maxCam > 0.01
  && recoil.maxCamR < 0.01
  && recoil.throttleBefore === recoil.throttleAfter;
const decalsOk = decals && decals.ok
  && decals.afterNpc > decals.beforeNpc
  && decals.shieldedNpc === decals.midNpc
  && decals.afterKill === 0
  && decals.threw === false;

say('recoilOk', recoilOk);
say('decalsOk', decalsOk);
say('pageErrors', pageErrors.length);
writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n'));

await browser.close();
process.exit(recoilOk && decalsOk && pageErrors.length === 0 ? 0 : 1);
