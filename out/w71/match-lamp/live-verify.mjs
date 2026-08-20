/**
 * Wave 71 live MATCH lamp: rock lock vs ship lock vs rail.
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

function hudState() {
  const ctx = window.__ctx;
  const t = ctx.targets.current;
  const lamp = document.querySelector('.rw-match-lamp');
  const rail = document.querySelector('.rw-combat-rail.rw-combat-target');
  const targetPos = t && (t.object ? t.object.position : t.position);
  const shipTgt = !!(t && t.state && !t.state.destroyed && targetPos);
  const rockLock = !!(t && t.position && !t.object && !t.state);
  return {
    match: !!ctx.flags.matchSpeed,
    docked: !!ctx.flags.docked,
    jumping: !!ctx.gate?.jumping,
    paused: !!ctx.flags.paused,
    throttleHeld: !!ctx.input.throttleHeld,
    group: ctx.input.weaponGroup,
    shipTgt,
    rockLock,
    hasTarget: !!t,
    lampExists: !!lamp,
    lampHidden: lamp ? lamp.classList.contains('is-hidden') : null,
    railHidden: rail ? rail.classList.contains('is-hidden') : null,
  };
}

async function waitHud(pred, ms, label) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < ms) {
    last = await page.evaluate(hudState);
    if (pred(last)) return last;
    await sleep(50);
  }
  say('TIMEOUT', label, JSON.stringify(last));
  return last;
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
    const rock = list.find((a) => a && a.position && a.ore > 0) || list[0];
    if (!rock) throw new Error('no rock');
    const p = rock.position;
    ctx.ship.object.position.set(p.x + 40, p.y + 8, p.z + 40);
    ctx.ship.object.quaternion.identity();
    ctx.targets.current = rock;
  });
  await page.keyboard.press('Digit3');
  await sleep(400);

  const pre = await page.evaluate(hudState);
  say('pre', JSON.stringify(pre));
  if (pre.group !== 3) { say('FAIL group3', pre.group); fail++; }
  if (!pre.rockLock) { say('FAIL rockLock'); fail++; }
  if (pre.match) { say('FAIL match already on'); fail++; }
  if (pre.lampHidden !== true) { say('FAIL lamp on before X'); fail++; }
  if (pre.railHidden !== true) { say('FAIL rail on before MATCH'); fail++; }

  await page.keyboard.press('KeyX');
  const rockArm = await waitHud((s) => s.match === true && s.lampHidden === false, 1500, 'rockArm');
  say('rockArm', JSON.stringify(rockArm));
  await shot('01-rock-match.png');
  if (!rockArm.match) { say('FAIL rock matchSpeed'); fail++; }
  if (!rockArm.lampExists) { say('FAIL lamp missing'); fail++; }
  if (rockArm.lampHidden !== false) { say('FAIL rock lamp hidden'); fail++; }
  if (rockArm.railHidden !== true) { say('FAIL rock combat rail visible'); fail++; }

  // Regression: MATCH on with no target must hide the lamp.
  await page.evaluate(() => {
    window.__ctx.targets.current = null;
  });
  const noTgt = await waitHud((s) => s.hasTarget === false && s.lampHidden === true, 1500, 'noTarget');
  say('noTarget', JSON.stringify(noTgt));
  await shot('02-no-target.png');
  if (noTgt.hasTarget) { say('FAIL target still set'); fail++; }
  if (noTgt.lampHidden !== true) { say('FAIL lamp stays on with no target'); fail++; }
  if (noTgt.railHidden !== true) { say('FAIL rail on with no target'); fail++; }
  if (noTgt.match) { say('FAIL matchSpeed stuck with no target'); fail++; }

  // Re-arm rock MATCH after the drop.
  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.flags.matchSpeed = false;
    ctx.input.throttleHeld = false;
    const list = ctx.asteroids?.list || [];
    const rock = list.find((a) => a && a.position) || list[0];
    ctx.targets.current = rock;
  });
  await sleep(250);
  await page.keyboard.press('KeyX');
  const rockArm2 = await waitHud((s) => s.match === true && s.lampHidden === false, 1500, 'rockArm2');
  say('rockArm2', JSON.stringify(rockArm2));
  if (!rockArm2.match || rockArm2.lampHidden !== false) {
    say('FAIL rock re-arm lamp');
    fail++;
  }
  if (rockArm2.railHidden !== true) { say('FAIL rock re-arm rail'); fail++; }

  // Live ship lock (stub like Wave 70; not in ctx.ships so npc.js stays quiet).
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
    const fake = { object: obj, state: { destroyed: false } };
    ctx.targets.current = fake;
    window.__w71ship = fake;
  });
  await sleep(250);
  await page.keyboard.press('KeyX');
  const shipArm = await waitHud((s) => s.match === true && s.lampHidden === false, 1500, 'shipArm');
  say('shipArm', JSON.stringify(shipArm));
  await shot('03-ship-match.png');
  if (!shipArm.match) { say('FAIL ship matchSpeed'); fail++; }
  if (shipArm.lampHidden !== false) { say('FAIL ship lamp hidden'); fail++; }
  if (!shipArm.shipTgt) { say('FAIL shipTgt false'); fail++; }

  // Cancel MATCH with throttle hold (R).
  await page.keyboard.down('KeyR');
  const cancelled = await waitHud((s) => s.match === false && s.lampHidden === true, 1500, 'cancel');
  await page.keyboard.up('KeyR');
  say('throttleCancel', JSON.stringify(cancelled));
  await shot('04-cancel.png');
  if (cancelled.match) { say('FAIL throttleHeld still match'); fail++; }
  if (cancelled.lampHidden !== true) { say('FAIL lamp on after cancel'); fail++; }

  // Stale flag with no lock: HUD must still hide lamp (sample after 5 Hz text).
  await page.evaluate(() => {
    const ctx = window.__ctx;
    ctx.targets.current = null;
    ctx.flags.matchSpeed = true;
  });
  await sleep(400);
  const stale = await page.evaluate(() => {
    const lamp = document.querySelector('.rw-match-lamp');
    return {
      match: !!window.__ctx.flags.matchSpeed,
      lampHidden: lamp ? lamp.classList.contains('is-hidden') : null,
      hasTarget: !!window.__ctx.targets.current,
    };
  });
  say('staleFlag', JSON.stringify(stale));
  if (stale.lampHidden !== true) { say('FAIL lamp on stale flag no target'); fail++; }

  say(fail === 0 ? 'LIVE PASS' : `LIVE FAIL ${fail}`);
} catch (err) {
  say('THROW', err && err.stack ? err.stack : String(err));
  fail++;
  try { await shot('99-throw.png'); } catch {}
} finally {
  writeFileSync(join(OUT, 'live-log.txt'), log.join('\n') + '\n');
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}
