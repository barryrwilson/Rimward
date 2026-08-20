/**
 * Wave 68 live desk + HUD check. Does not touch src/.
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

function overlayDump() {
  return page.evaluate(() => {
    const ov = document.querySelector('.station-overlay');
    const ctx = window.__ctx;
    return {
      docked: !!ctx?.flags?.docked,
      classKey: ctx?.player?.classKey,
      hullKind: ctx?.player?.hullKind,
      credits: ctx?.world?.credits,
      launcher: ctx?.world?.launcher,
      missileAmmo: ctx?.world?.missileAmmo,
      turret: ctx?.world?.turret,
      notice: ov?.querySelector('.station-notice')?.textContent ?? '',
      overlay: ov ? ov.textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      wpn: document.querySelector('.rw-weapon, #rw-weapon, [data-hud="weapon"]')?.textContent
        ?? [...document.querySelectorAll('#hud *')].map((el) => el.textContent).find((t) => /^[1-4] · /.test(t || ''))
        ?? '',
    };
  });
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

  await page.keyboard.press('Digit4');
  await sleep(300);
  const flightEmpty = await page.evaluate(() => {
    const ctx = window.__ctx;
    const texts = [...document.querySelectorAll('#hud *')].map((el) => el.textContent?.trim()).filter(Boolean);
    return {
      group: ctx.input.weaponGroup,
      launcher: ctx.world.launcher,
      wpn: texts.find((t) => /^4 · /.test(t)) || texts.find((t) => /Dart|—/.test(t) && t.includes('·')) || '',
      family: document.getElementById('hud')?.className || '',
    };
  });
  say('flightEmpty', JSON.stringify(flightEmpty));
  await shot('01-flight-empty-g4.png');
  if (flightEmpty.group !== 4) { say('FAIL group4'); fail++; }
  if (!/^4 · —$/.test(flightEmpty.wpn)) { say('FAIL empty WPN', flightEmpty.wpn); fail++; }

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const def = ctx.systems.freehold;
    const p = def.station?.position;
    ctx.flags.combat = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(p[0], p[1], p[2]);
    ctx.world.credits = 20000;
    ctx.input.dockPressed = true;
  });
  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 10000 });
  await shot('02-docked.png');

  await page.keyboard.press('Digit6');
  await sleep(500);
  const lightOutfit = await overlayDump();
  say('lightOutfit', JSON.stringify({
    classKey: lightOutfit.classKey,
    buttons: lightOutfit.buttons,
    hasNoSeat: /no launcher hardpoint/i.test(lightOutfit.overlay || ''),
    hasDigit8: /8 —/.test(lightOutfit.overlay || ''),
    hasDigit9: /no turret|9 —/i.test(lightOutfit.overlay || ''),
    slice: (lightOutfit.overlay || '').slice(0, 900),
  }));
  await shot('03-outfitting-light.png');
  if (!/no launcher hardpoint/i.test(lightOutfit.overlay || '')) {
    say('FAIL light should refuse dart seat');
    fail++;
  }

  const mounted = await page.evaluate(async () => {
    const { addPurchasedHull, switchTo } = await import('/src/game/hangar.js');
    const ctx = window.__ctx;
    const add = addPurchasedHull(ctx, {
      id: 'hull_heavy_1',
      hullKind: 'living',
      faction: 'independent',
      classKey: 'heavy',
      name: 'heavy',
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
      cargoCapacity: 20,
      cargo: [],
    });
    const sw = switchTo(ctx, 'hull_heavy_1');
    return { addOk: add.ok, switchOk: sw.ok, classKey: ctx.player.classKey, mounted: ctx.world.hangar.mountedId };
  });
  say('mountedHeavy', JSON.stringify(mounted));
  if (!mounted.switchOk || mounted.classKey !== 'heavy') {
    say('FAIL switch heavy');
    fail++;
  }

  await page.keyboard.press('Escape');
  await sleep(200);
  await page.keyboard.press('Digit6');
  await sleep(400);
  const heavyOutfit = await overlayDump();
  say('heavyOutfit', JSON.stringify({
    classKey: heavyOutfit.classKey,
    credits: heavyOutfit.credits,
    buttons: heavyOutfit.buttons,
    slice: (heavyOutfit.overlay || '').slice(0, 700),
  }));
  await shot('04-outfitting-heavy.png');

  await page.keyboard.press('Digit8');
  await sleep(400);
  const pending = await overlayDump();
  say('pendingDart', JSON.stringify({
    credits: pending.credits,
    buttons: pending.buttons,
    launcher: pending.launcher,
  }));
  await shot('05-dart-papers.png');
  if (pending.credits !== 20000) { say('FAIL digit8 debit'); fail++; }
  if (!pending.buttons.includes('Confirm papers')) { say('FAIL confirm button'); fail++; }

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (btn) btn.click();
  });
  await sleep(400);
  const bought = await overlayDump();
  say('boughtDart', JSON.stringify({
    credits: bought.credits,
    launcher: bought.launcher,
    ammo: bought.missileAmmo,
    notice: bought.notice,
  }));
  await shot('06-dart-bought.png');
  if (bought.launcher !== 'dart') { say('FAIL launcher not seated'); fail++; }
  if (bought.credits !== 20000 - 6500) { say('FAIL dart price', bought.credits); fail++; }

  await page.keyboard.press('Digit9');
  await sleep(300);
  const turretPend = await overlayDump();
  say('pendingTurret', JSON.stringify({ credits: turretPend.credits, buttons: turretPend.buttons }));
  await shot('07-turret-papers.png');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (btn) btn.click();
  });
  await sleep(400);
  const turret = await overlayDump();
  say('boughtTurret', JSON.stringify({ turret: turret.turret, credits: turret.credits }));
  await shot('08-turret-bought.png');
  if (turret.turret !== 'auto') { say('FAIL turret not seated'); fail++; }

  await page.keyboard.press('Escape');
  await sleep(200);
  await page.keyboard.press('Escape');
  await sleep(200);
  await page.keyboard.press('Digit8');
  await sleep(300);
  await page.keyboard.press('Digit1');
  await sleep(800);
  await page.keyboard.press('Digit4');
  await sleep(300);
  const flightSeated = await page.evaluate(() => {
    const ctx = window.__ctx;
    const texts = [...document.querySelectorAll('#hud *')].map((el) => el.textContent?.trim()).filter(Boolean);
    return {
      docked: ctx.flags.docked,
      group: ctx.input.weaponGroup,
      launcher: ctx.world.launcher,
      ammo: ctx.world.missileAmmo,
      wpn: texts.find((t) => /^4 · /.test(t)) || '',
      family: document.getElementById('hud')?.className || '',
      hullKind: ctx.player.hullKind,
    };
  });
  say('flightSeated', JSON.stringify(flightSeated));
  await shot('09-flight-seated-g4.png');
  if (flightSeated.docked) { say('FAIL still docked'); fail++; }
  if (flightSeated.group !== 4) { say('FAIL group4 after undock'); fail++; }
  if (!/^4 · Dart rack · \d+$/.test(flightSeated.wpn)) {
    say('FAIL seated WPN', flightSeated.wpn);
    fail++;
  }
  if (flightSeated.hullKind === 'living' && !/bio/.test(flightSeated.family) && flightSeated.family !== '') {
    say('NOTE hud class', flightSeated.family);
  }

  say(fail ? `LIVE FAIL ${fail}` : 'LIVE PASS 0');
} catch (err) {
  say('THROW', err.message);
  fail++;
  try { await shot('99-throw.png'); } catch {}
} finally {
  writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n') + '\n');
  await browser.close();
  process.exit(fail ? 1 : 0);
}
