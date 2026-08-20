/**
 * Wave 70 live MATCH: rock vector hold vs ship along-nose.
 * Does not touch src/.
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

  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.flags.combat = false;
    ctx.flags.docked = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    ctx.input.throttleHeld = false;
    ctx.input.weaponGroup = 3;
    ctx.input.steerX = 0;
    ctx.input.steerY = 0;
    ctx.input.strafeX = 0;
    ctx.input.strafeY = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ships.length = 0;
    ctx.targets.current = null;
    ctx.gate.inZone = false;
    if (ctx.station) ctx.station.inZone = false;
    ctx.flags.matchSpeed = false;
    const list = ctx.asteroids?.list || [];
    const rock = list[0] || list.find((a) => a && a.position);
    if (!rock) throw new Error('no rock');
    const p = rock.position;
    ctx.ship.object.position.set(p.x + 40, p.y + 8, p.z + 40);
    ctx.ship.object.quaternion.identity();
    ctx.targets.current = rock;
  });
  await page.keyboard.press('Digit3');
  await sleep(80);

  const pre = await page.evaluate(() => {
    const ctx = window.__ctx;
    const t = ctx.targets.current;
    const rockLock = !!(t && t.position && !t.object && !t.state);
    return {
      sys: ctx.world.currentSystem,
      group: ctx.input.weaponGroup,
      rockLock,
      match: !!ctx.flags.matchSpeed,
      nRocks: (ctx.asteroids?.list || []).length,
    };
  });
  say('pre', JSON.stringify(pre));
  if (pre.sys !== 'freehold') { say('FAIL sys', pre.sys); fail++; }
  if (pre.group !== 3) { say('FAIL group3', pre.group); fail++; }
  if (!pre.rockLock) { say('FAIL rockLock'); fail++; }

  await page.keyboard.press('KeyX');
  await sleep(50);
  const armed = await page.evaluate(() => {
    const ctx = window.__ctx;
    return {
      match: !!ctx.flags.matchSpeed,
      throttle: ctx.input.throttle,
      q: ctx.ship.object.quaternion.toArray(),
      lampHidden: document.querySelector('.rw-match-lamp')?.classList.contains('is-hidden') ?? null,
    };
  });
  say('armed', JSON.stringify(armed));
  if (!armed.match) { say('FAIL rock arm'); fail++; }
  if (armed.throttle !== 0) { say('FAIL throttle write', armed.throttle); fail++; }
  say('rockLampHidden', armed.lampHidden);

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const rock = ctx.targets.current;
    window.__w70 = {
      t0: ctx.world.time,
      q0: ctx.ship.object.quaternion.toArray(),
      rp0: [rock.position.x, rock.position.y, rock.position.z],
      sp0: ctx.ship.object.position.toArray(),
    };
  });
  await sleep(1800);
  const hold = await page.evaluate(() => {
    const ctx = window.__ctx;
    const rock = ctx.targets.current;
    const s = window.__w70;
    const dt = ctx.world.time - s.t0;
    const rv = [
      (rock.position.x - s.rp0[0]) / dt,
      (rock.position.y - s.rp0[1]) / dt,
      (rock.position.z - s.rp0[2]) / dt,
    ];
    const sv = [ctx.ship.velocity.x, ctx.ship.velocity.y, ctx.ship.velocity.z];
    const rel = [sv[0] - rv[0], sv[1] - rv[1], sv[2] - rv[2]];
    const relLen = Math.hypot(...rel);
    const rockSpeed = Math.hypot(...rv);
    const q = ctx.ship.object.quaternion.toArray();
    const qDelta = Math.hypot(q[0] - s.q0[0], q[1] - s.q0[1], q[2] - s.q0[2], q[3] - s.q0[3]);
    return {
      match: !!ctx.flags.matchSpeed,
      dt,
      rockSpeed,
      shipSpeed: ctx.ship.speed,
      relLen,
      rel,
      rv,
      sv,
      qDelta,
      rockLock: !!(rock && rock.position && !rock.object && !rock.state),
    };
  });
  const holdLamp = await page.evaluate(() => {
    const lamp = document.querySelector('.rw-match-lamp');
    return {
      match: !!window.__ctx.flags.matchSpeed,
      lampHidden: lamp ? lamp.classList.contains('is-hidden') : null,
    };
  });
  say('hold', JSON.stringify(hold));
  say('holdLamp', JSON.stringify(holdLamp));
  await shot('01-rock-match.png');
  if (!hold.match) { say('FAIL hold match off'); fail++; }
  if (!(hold.rockSpeed > 1)) { say('FAIL rock still'); fail++; }
  if (!(hold.relLen < 18)) { say('FAIL rel hold', hold.relLen); fail++; }
  if (!(hold.qDelta < 0.02)) { say('FAIL auto-steer', hold.qDelta); fail++; }

  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.flags.matchSpeed = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    ctx.input.throttleHeld = false;
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.quaternion.identity();
    const origin = ctx.ship.object.position.clone();
    const obj = { position: origin.clone().add({ x: 50, y: 0, z: -20 }) };
    // Not in ctx.ships — npc.js would read .ai.demanding on a stub.
    const fake = { object: obj, state: { destroyed: false } };
    ctx.targets.current = fake;
    window.__w70ship = fake;
  });
  await sleep(80);
  await page.keyboard.press('KeyX');
  await sleep(400);
  const shipArm = await page.evaluate(() => {
    const ctx = window.__ctx;
    const lamp = document.querySelector('.rw-match-lamp');
    return {
      match: !!ctx.flags.matchSpeed,
      liveLock: !!(ctx.targets.current && ctx.targets.current.object && ctx.targets.current.state),
      lampHidden: lamp ? lamp.classList.contains('is-hidden') : null,
    };
  });
  say('shipArm', JSON.stringify(shipArm));
  await shot('02-ship-match.png');
  if (!shipArm.match) { say('FAIL ship arm'); fail++; }
  if (shipArm.lampHidden === true) { say('FAIL ship lamp off'); fail++; }

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const fake = window.__w70ship;
    window.__w70s = { t0: ctx.world.time, x0: fake.object.position.x };
  });
  for (let i = 0; i < 45; i++) {
    await page.evaluate(() => {
      const fake = window.__w70ship;
      fake.object.position.x += 48 * (1 / 60);
    });
    await sleep(16);
  }
  const shipSlide = await page.evaluate(() => {
    const ctx = window.__ctx;
    const sv = [ctx.ship.velocity.x, ctx.ship.velocity.y, ctx.ship.velocity.z];
    return {
      match: !!ctx.flags.matchSpeed,
      sv,
      alongNose: sv[2] < -8 && Math.abs(sv[0]) < Math.abs(sv[2]),
      copiedSlideX: sv[0] > 20 && Math.abs(sv[0]) > Math.abs(sv[2]),
      speed: ctx.ship.speed,
    };
  });
  say('shipSlide', JSON.stringify(shipSlide));
  if (!shipSlide.match) { say('FAIL ship hold'); fail++; }
  if (shipSlide.copiedSlideX) { say('FAIL ship copied world X'); fail++; }

  await page.keyboard.down('KeyR');
  await sleep(120);
  const cancelled = await page.evaluate(() => !!window.__ctx.flags.matchSpeed);
  await page.keyboard.up('KeyR');
  say('throttleCancel', cancelled);
  if (cancelled) { say('FAIL throttleHeld cancel'); fail++; }

  const rockLamp = await page.evaluate(() => {
    const lamp = document.querySelector('.rw-match-lamp');
    return lamp ? lamp.classList.contains('is-hidden') : null;
  });
  say('rockLampHiddenAtEnd', rockLamp);

  say(fail === 0 ? 'LIVE PASS' : `LIVE FAIL ${fail}`);
} catch (err) {
  say('THROW', err && err.stack ? err.stack : String(err));
  fail++;
  try { await shot('99-throw.png'); } catch {}
} finally {
  writeFileSync(join(OUT, 'live-notes.txt'), log.join('\n') + '\n');
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
