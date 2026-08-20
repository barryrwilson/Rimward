/**
 * Wave 67 live yard check. Does not touch src/. Uses Vite on :5173
 * and window.__ctx. Writes screenshots next to this file.
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

function overlayDump() {
  return page.evaluate(() => {
    const ov = document.querySelector('.station-overlay');
    const ctx = window.__ctx;
    const sys = ctx?.world?.currentSystem;
    const fac = ctx?.systems?.[sys]?.faction;
    return {
      docked: !!ctx?.flags?.docked,
      system: sys,
      faction: fac,
      credits: ctx?.world?.credits,
      rep: ctx?.world?.reputation?.[fac],
      mountedId: ctx?.world?.hangar?.mountedId,
      hulls: (ctx?.world?.hangar?.hulls ?? []).map((h) => ({
        id: h.id,
        classKey: h.classKey,
        hullKind: h.hullKind,
        cargoCapacity: h.cargoCapacity,
      })),
      player: { classKey: ctx?.player?.classKey, hullKind: ctx?.player?.hullKind },
      notice: ov?.querySelector('.station-notice')?.textContent ?? '',
      overlay: ov ? ov.textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    };
  });
}

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path });
  say('SHOT', name);
}

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
    await shot('browser-not-ready.png');
    throw new Error('sim not ready');
  }

  const setup = await page.evaluate(() => {
    const ctx = window.__ctx;
    if (ctx.world.currentSystem !== 'freehold') {
      ctx.emit('jumpRequested', { to: 'freehold' });
    }
    const def = ctx.systems.freehold || ctx.systems[ctx.world.currentSystem];
    const pos = def.station?.position
      ? { x: def.station.position[0], y: def.station.position[1], z: def.station.position[2] }
      : ctx.station.position;
    ctx.world.currentSystem = 'freehold';
    ctx.flags.docked = false;
    ctx.flags.combat = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(pos.x ?? pos[0], pos.y ?? pos[1], pos.z ?? pos[2]);
    ctx.world.credits = 100000;
    ctx.world.reputation = ctx.world.reputation ?? {};
    ctx.world.reputation.freehold = 0;
    ctx.input.dockPressed = true;
    return {
      system: ctx.world.currentSystem,
      faction: ctx.systems.freehold?.faction,
      credits: ctx.world.credits,
      rep: ctx.world.reputation.freehold,
    };
  });
  say('setup', JSON.stringify(setup));

  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 10000 }).catch(() => null);

  const home = await overlayDump();
  say('home', JSON.stringify({ docked: home.docked, faction: home.faction, system: home.system, menu: home.buttons }));
  await shot('01-freehold-dock.png');

  await page.keyboard.press('Digit0');
  await sleep(400);
  await page.keyboard.press('Digit2');
  await sleep(400);
  const yard = await overlayDump();
  say('yard', JSON.stringify({
    credits: yard.credits,
    rep: yard.rep,
    buttons: yard.buttons,
    overlaySlice: (yard.overlay || '').slice(0, 800),
  }));
  await shot('02-yard-rows.png');

  const hasFrigate = /frigate/i.test(yard.overlay || '') && yard.buttons.some((t) => t === '8 — Papers');
  const hasLight = /light/i.test(yard.overlay || '');
  say('pin.hasFrigate', hasFrigate);
  say('pin.hasLight', hasLight);

  await page.keyboard.press('Digit8');
  await sleep(400);
  const pending = await overlayDump();
  say('pending', JSON.stringify({
    credits: pending.credits,
    hulls: pending.hulls.length,
    mountedId: pending.mountedId,
    buttons: pending.buttons,
    notice: pending.notice,
    overlaySlice: (pending.overlay || '').slice(0, 500),
  }));
  await shot('03-frigate-papers.png');

  const strangerBefore = {
    credits: pending.credits,
    hulls: pending.hulls.length,
    mounted: pending.mountedId,
    player: pending.player,
  };
  const confirmShown = pending.buttons.includes('Confirm papers');
  const digit8NoDebit = pending.credits === 100000 && pending.hulls.length === strangerBefore.hulls;

  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await sleep(500);
  const strangerAfter = await overlayDump();
  say('strangerAfter', JSON.stringify({
    clicked,
    credits: strangerAfter.credits,
    hulls: strangerAfter.hulls,
    mountedId: strangerAfter.mountedId,
    player: strangerAfter.player,
    notice: strangerAfter.notice,
  }));
  await shot('04-stranger-refuse.png');

  await page.evaluate(() => {
    window.__ctx.world.reputation.freehold = 25;
  });
  await page.keyboard.press('Digit2');
  await sleep(300);
  await page.keyboard.press('Digit8');
  await sleep(300);
  const trustedPending = await overlayDump();
  say('trustedPending', JSON.stringify({
    credits: trustedPending.credits,
    rep: trustedPending.rep,
    buttons: trustedPending.buttons,
    overlaySlice: (trustedPending.overlay || '').slice(0, 400),
  }));
  await shot('05-trusted-pending.png');

  const trustedClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await sleep(500);
  const trustedAfter = await overlayDump();
  say('trustedAfter', JSON.stringify({
    clicked: trustedClicked,
    credits: trustedAfter.credits,
    hulls: trustedAfter.hulls,
    mountedId: trustedAfter.mountedId,
    player: trustedAfter.player,
    notice: trustedAfter.notice,
  }));
  await shot('06-trusted-bought.png');

  await page.keyboard.press('Digit1');
  await sleep(400);
  const hangar = await overlayDump();
  say('hangar', JSON.stringify({
    hulls: hangar.hulls,
    mountedId: hangar.mountedId,
    player: hangar.player,
    overlaySlice: (hangar.overlay || '').slice(0, 600),
  }));
  await shot('07-hangar-after-buy.png');

  const origFaction = await page.evaluate(() => {
    const ctx = window.__ctx;
    const sys = ctx.world.currentSystem;
    const orig = ctx.systems[sys].faction;
    ctx.systems[sys].faction = 'independent';
    return orig;
  });
  await page.keyboard.press('Digit2');
  await sleep(400);
  const indie = await overlayDump();
  say('indie', JSON.stringify({
    faction: indie.faction,
    overlaySlice: (indie.overlay || '').slice(0, 400),
    buttons: indie.buttons,
  }));
  await shot('08-independent-empty.png');

  await page.evaluate((orig) => {
    const ctx = window.__ctx;
    ctx.systems[ctx.world.currentSystem].faction = 'beautiful';
    void orig;
  }, origFaction);
  await page.keyboard.press('Digit2');
  await sleep(400);
  const beau = await overlayDump();
  say('beautiful', JSON.stringify({
    faction: beau.faction,
    overlaySlice: (beau.overlay || '').slice(0, 500),
    buttons: beau.buttons,
  }));
  await shot('09-beautiful-no-frigate.png');

  await page.evaluate((orig) => {
    window.__ctx.systems[window.__ctx.world.currentSystem].faction = orig;
  }, origFaction);

  const pins = {
    docked: home.docked === true && home.faction === 'freehold',
    yardHasFrigate: hasFrigate === true,
    yardHasLight: hasLight === true,
    digit8Pending: confirmShown === true,
    digit8NoDebit: digit8NoDebit === true,
    strangerRefuse: strangerAfter.credits === 100000
      && strangerAfter.hulls.length === 1
      && /no sale/i.test(strangerAfter.notice || strangerAfter.overlay || ''),
    trustedBuy: trustedAfter.credits === 100000 - 72000
      && trustedAfter.hulls.some((h) => h.classKey === 'frigate' && h.cargoCapacity === 20 && h.hullKind === 'built')
      && trustedAfter.mountedId === 'hull_starter'
      && trustedAfter.player.classKey === 'light'
      && trustedAfter.player.hullKind === 'living',
    indieEmpty: /no hull catalog/i.test(indie.overlay || '') && !/frigate/i.test(indie.overlay || ''),
    beautifulOmitsFrigate: !/frigate/i.test(beau.overlay || '') && /light/i.test(beau.overlay || ''),
  };
  say('PINS', JSON.stringify(pins, null, 2));
  const fails = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
  if (fails.length) {
    say('FAIL', fails.join('; '));
    process.exitCode = 1;
  } else {
    say('ALL BROWSER PINS TRUE');
  }
} catch (err) {
  say('CRASH', err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
} finally {
  writeFileSync(join(OUT, 'browser-verify.log'), log.join('\n') + '\n');
  await browser.close();
}
