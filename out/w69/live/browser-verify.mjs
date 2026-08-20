/**
 * Wave 69 live belt + mining-cue check. Does not touch src/.
 */
import puppeteer from '../../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://localhost:5173/';
const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 1 },
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

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path });
  say('SHOT', name);
}

let fail = 0;
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!window.__ctx, { timeout: 30000 });
  await page.evaluate(() => {
    const neu = document.getElementById('rw-title-new');
    if (neu) {
      neu.click();
      if (neu.textContent.includes('CONFIRM')) neu.click();
    }
  });
  await sleep(400);
  await page.keyboard.press('Digit1');
  await sleep(1600);

  const ready = await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
  }, { timeout: 30000 }).catch(() => null);
  if (!ready) {
    await shot('00-not-ready.png');
    throw new Error('sim not ready');
  }

  const field = await page.evaluate(() => {
    const ctx = window.__ctx;
    const list = ctx.asteroids?.list || [];
    const def = ctx.systems[ctx.world.currentSystem];
    const c = def.field.center;
    const R = Math.hypot(c[0], c[2]);
    const az0 = Math.atan2(c[2], c[0]);
    let sum = 0;
    let sector = 0;
    let idOk = true;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.id !== i) idOk = false;
      const hx = Math.hypot(a.position.x, a.position.z);
      sum += hx;
      let d = Math.atan2(a.position.z, a.position.x) - az0;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (Math.abs(d) <= 0.7) sector++;
    }
    const meanR = list.length ? sum / list.length : 0;
    return {
      sys: ctx.world.currentSystem,
      n: list.length,
      R,
      meanR,
      sectorFrac: list.length ? sector / list.length : 0,
      idOk,
      time: ctx.world.time,
    };
  });
  say('field', JSON.stringify(field));
  if (field.sys !== 'freehold') { say('FAIL sys', field.sys); fail++; }
  if (!field.idOk) { say('FAIL id'); fail++; }
  if (field.n !== 130) { say('FAIL count', field.n); fail++; }
  if (!(field.meanR > 0.6 * field.R)) { say('FAIL clump', field.meanR); fail++; }
  if (!(field.sectorFrac >= 0.6)) { say('FAIL sector', field.sectorFrac); fail++; }

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const def = ctx.systems.freehold;
    const c = def.field.center;
    ctx.flags.combat = false;
    ctx.flags.docked = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    ctx.input.weaponGroup = 3;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    // Park on the far side of the sun, away from station traffic and miners
    // that still fly to field.center.
    ctx.ships.length = 0;
    ctx.ship.object.position.set(0, 1800, 0);
    ctx.targets.current = null;
    ctx.gate.inZone = false;
    if (ctx.station) ctx.station.inZone = false;
  });
  await page.keyboard.press('Digit3');
  await sleep(120);
  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.ships.length = 0;
    ctx.targets.current = null;
    ctx.input.weaponGroup = 3;
  });
  await sleep(80);

  const cue = await page.evaluate(() => {
    const ctx = window.__ctx;
    const hud = document.getElementById('hud');
    const texts = [...(hud ? hud.querySelectorAll('*') : [])]
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
    const prompt = (document.querySelector('.rw-prompt-verb')?.textContent || '').trim()
      || texts.find((t) => /Mine/.test(t)) || '';
    let nearest = Infinity;
    let nShips = 0;
    const p = ctx.ship.object.position;
    for (const s of ctx.ships || []) {
      if (!s?.object) continue;
      nShips++;
      const d = s.object.position.distanceTo(p);
      if (d < nearest) nearest = d;
    }
    return {
      group: ctx.input.weaponGroup,
      docked: !!ctx.flags.docked,
      prompt,
      nShips,
      nearest,
      target: !!(ctx.targets && ctx.targets.current),
      pos: [p.x, p.y, p.z].map((n) => Math.round(n)),
      texts: texts.filter((t) => /Mine|belt|Dock|Jump|Target/.test(t)).slice(0, 8),
    };
  });
  say('cue', JSON.stringify(cue));
  await shot('01-mine-cue.png');
  if (cue.group !== 3) { say('FAIL group3', cue.group); fail++; }
  if (!/Mine/.test(cue.prompt) && !cue.texts.some((t) => /Mine/.test(t))) {
    say('FAIL mine cue');
    fail++;
  }

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const list = ctx.asteroids.list;
    const t0 = ctx.world.time;
    const x0 = list[0].position.x;
    const z0 = list[0].position.z;
    window.__astSnap = { t0, x0, z0, sameObj: true };
  });
  await sleep(1200);
  const moved = await page.evaluate(() => {
    const ctx = window.__ctx;
    const a = ctx.asteroids.list[0];
    const s = window.__astSnap;
    return {
      dt: ctx.world.time - s.t0,
      dx: a.position.x - s.x0,
      dz: a.position.z - s.z0,
      moved: Math.hypot(a.position.x - s.x0, a.position.z - s.z0) > 0.5,
    };
  });
  say('moved', JSON.stringify(moved));
  await shot('02-belt.png');
  if (!moved.moved) { say('FAIL no slide'); fail++; }

  say(fail === 0 ? 'LIVE PASS' : `LIVE FAIL ${fail}`);
} catch (err) {
  say('THROW', err && err.stack ? err.stack : String(err));
  fail++;
  try { await shot('99-throw.png'); } catch {}
} finally {
  writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n') + '\n');
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
