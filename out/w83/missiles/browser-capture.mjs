/**
 * Wave 83 NPC missiles live capture. Evidence only. Does not touch src/.
 * Playwright MCP was locked (mcp-chrome-7d372dc). Uses Chrome + puppeteer-core.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://localhost:5183/';
const OUT = 'C:\\Projects\\WebSim\\out\\w83\\missiles';
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
page.on('pageerror', (err) => say('PAGEERR', err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') say('ERROR', msg.text());
});

await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
    localStorage.removeItem('rimward-save-v1');
  } catch {}
});

say('goto', APP);
await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });

await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  }
  const cont = document.getElementById('rw-title-continue');
  if (cont && !neu) cont.click();
});
await page.keyboard.press('Digit1');
await new Promise((r) => setTimeout(r, 2000));

const ready = await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
}, { timeout: 45000 }).catch(() => null);

if (!ready) {
  await page.screenshot({ path: join(OUT, 'browser-not-ready.png') });
  writeFileSync(join(OUT, 'browser-notes.txt'), log.concat('NOT READY').join('\n'));
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => {
  const ctx = window.__ctx;
  ctx.flags.camera = 'first';
  ctx.flags.firstPerson = true;
  ctx.flags.paused = false;
  ctx.flags.docked = false;
});
await new Promise((r) => setTimeout(r, 400));

await page.screenshot({ path: join(OUT, 'hud-hub.png') });

const hudInspect = await page.evaluate(() => {
  const hud = document.getElementById('hud');
  const kids = [...(hud?.children ?? [])].map((n) => n.className || n.id || n.tagName);
  const inbound = [...hud.querySelectorAll('*')].filter((n) =>
    /incoming|inbound|aspect-ring|lock-box|lockbox|missile-gauge/i.test(n.className || ''));
  return {
    kidCount: kids.length,
    kids,
    inboundClasses: inbound.map((n) => n.className),
    facingClass: document.querySelector('.rw-facing')?.className || null,
  };
});
say('hudInspect', JSON.stringify(hudInspect));
await page.screenshot({ path: join(OUT, 'hud-hub-close.png'), clip: { x: 720, y: 320, width: 160, height: 160 } });

const toastProbe = await page.evaluate(async () => {
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const ctx = window.__ctx;
  const ammoBefore = ctx.world.missileAmmo;
  ctx.emit('npcFire', { weapon: 'missile', target: 'player' });
  await waitFrames(8);
  const shown = [...document.querySelectorAll('#hud .rw-toast')].map((n) => ({
    text: n.textContent,
    className: n.className,
  }));
  const dart = shown.filter((n) => n.className.includes('show') && n.textContent === 'Incoming dart.');
  const facingFlash = document.querySelector('.rw-facing')?.className || '';
  ctx.emit('npcFire', { weapon: 'cannon', target: 'player' });
  await waitFrames(6);
  const shownAfterCannon = [...document.querySelectorAll('#hud .rw-toast.show')].map((n) => n.textContent);
  return {
    ammoBefore,
    ammoAfter: ctx.world.missileAmmo,
    dartCount: dart.length,
    dartText: dart[0]?.textContent || null,
    shown,
    shownAfterCannon,
    facingFlash,
    paused: ctx.flags.paused,
    docked: ctx.flags.docked,
  };
});
say('toastProbe', JSON.stringify(toastProbe));
await page.screenshot({ path: join(OUT, 'toast-incoming-dart.png') });

const poolProbe = await page.evaluate(async () => {
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const ctx = window.__ctx;
  const Ctor = ctx.ship.object.constructor;
  const obj = new Ctor();
  obj.position.copy(ctx.ship.object.position);
  obj.position.z += 40;
  ctx.scene.add(obj);
  const ship = {
    object: obj,
    state: { faction: 'redledger', destroyed: false, disabled: false },
  };
  const ammo0 = ctx.world.missileAmmo;
  for (let i = 0; i < 5; i++) {
    ctx.emit('npcFire', { ship, weapon: 'missile', target: 'player' });
  }
  await waitFrames(10);
  let visNpc = 0;
  let allNpc = 0;
  let allPlayer = 0;
  let visPlayer = 0;
  ctx.scene.traverse((o) => {
    const tag = o.userData && o.userData.pool;
    if (tag === 'npcMissile') {
      allNpc++;
      if (o.visible) visNpc++;
    }
    if (tag === 'playerMissile') {
      allPlayer++;
      if (o.visible) visPlayer++;
    }
  });
  ctx.emit('npcFire', {
    ship: { object: obj, state: { faction: 'unknowables', destroyed: false, disabled: false } },
    weapon: 'missile',
    target: 'player',
  });
  await waitFrames(4);
  let visAfterUnk = 0;
  ctx.scene.traverse((o) => {
    if (o.userData && o.userData.pool === 'npcMissile' && o.visible) visAfterUnk++;
  });
  ctx.emit('npcFire', { ship, weapon: 'missile' });
  await waitFrames(4);
  let visAfterMissing = 0;
  ctx.scene.traverse((o) => {
    if (o.userData && o.userData.pool === 'npcMissile' && o.visible) visAfterMissing++;
  });
  const lives = (ctx.ships || []).map((s) => ({
    role: s.ai?.role, faction: s.state?.faction, dartSpent: s.ai?.dartSpent, mode: s.ai?.mode,
  }));
  return {
    ammo0,
    ammo1: ctx.world.missileAmmo,
    visNpc,
    allNpc,
    allPlayer,
    visPlayer,
    visAfterUnk,
    visAfterMissing,
    lives,
  };
});
say('poolProbe', JSON.stringify(poolProbe));

const roles = await page.evaluate(() => {
  const ctx = window.__ctx;
  const byRole = {};
  for (const s of ctx.ships || []) {
    const r = s.ai?.role || 'none';
    byRole[r] = (byRole[r] || 0) + 1;
  }
  return byRole;
});
say('liveRoles', JSON.stringify(roles));

writeFileSync(join(OUT, 'browser-notes.txt'), `${log.join('\n')}\n`);
await browser.close();
say('done');
process.exit(0);
