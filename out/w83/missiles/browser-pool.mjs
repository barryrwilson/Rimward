import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:5183/';
const OUT = 'C:\\Projects\\WebSim\\out\\w83\\missiles';
mkdirSync(OUT, { recursive: true });
const log = [];
const say = (...a) => { const line = a.map(String).join(' '); log.push(line); console.log(line); };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: ['--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars', '--no-first-run'],
});
const page = await browser.newPage();
page.on('pageerror', (err) => say('PAGEERR', err.message));

await page.evaluateOnNewDocument(() => {
  try { sessionStorage.setItem('rimward-title-skip', '1'); localStorage.removeItem('rimward-save-v1'); } catch {}
});
await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });
await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  if (neu) { neu.click(); if ((neu.textContent || '').includes('CONFIRM')) neu.click(); }
});
await page.keyboard.press('Digit1');
await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
}, { timeout: 45000 });

const result = await page.evaluate(async () => {
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const count = (tag, visOnly) => {
    let n = 0;
    window.__ctx.scene.traverse((o) => {
      if (o.userData && o.userData.pool === tag && (!visOnly || o.visible)) n++;
    });
    return n;
  };
  const ctx = window.__ctx;
  ctx.flags.docked = false;
  ctx.flags.paused = false;
  ctx.world.launcher = 'dart';
  ctx.world.missileAmmo = 8;
  const Ctor = ctx.ship.object.constructor;
  const obj = new Ctor();
  obj.position.copy(ctx.ship.object.position);
  obj.position.z += 400;
  ctx.scene.add(obj);
  const ship = { object: obj, state: { faction: 'redledger', destroyed: false, disabled: false } };
  for (let i = 0; i < 5; i++) ctx.emit('npcFire', { ship, weapon: 'missile', target: 'player' });
  await waitFrames(2);
  const after5 = {
    visNpc: count('npcMissile', true),
    allNpc: count('npcMissile', false),
    visPlayer: count('playerMissile', true),
    allPlayer: count('playerMissile', false),
    ammo: ctx.world.missileAmmo,
  };
  const lockShip = (ctx.ships || []).find((s) => s?.object && s.state && !s.state.destroyed);
  let playerFired = null;
  if (lockShip) {
    ctx.targets.current = lockShip;
    ctx.input.weaponGroup = 4;
    ctx.input.fireHeld = true;
    await waitFrames(12);
    ctx.input.fireHeld = false;
    playerFired = {
      visPlayer: count('playerMissile', true),
      allPlayer: count('playerMissile', false),
      ammo: ctx.world.missileAmmo,
    };
  }
  const toast = [...document.querySelectorAll('#hud .rw-toast')].map((n) => ({
    text: n.textContent, className: n.className,
  }));
  const inbound = [...document.querySelectorAll('#hud *')].some((n) =>
    /incoming|inbound|aspect-ring|lock-box|lockbox|missile-gauge/i.test(n.className || ''));
  return { after5, playerFired, toast, inbound, launcher: ctx.world.launcher };
});
say('result', JSON.stringify(result));

const toastEl = await page.$('#hud .rw-toast.show.warn');
if (toastEl) await toastEl.screenshot({ path: join(OUT, 'toast-crop.png') });
await page.screenshot({ path: join(OUT, 'toast-after-pool.png') });
writeFileSync(join(OUT, 'browser-pool.txt'), `${log.join('\n')}\n`);
await browser.close();
process.exit(0);
