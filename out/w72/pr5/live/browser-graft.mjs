/**
 * WAVE72 PR5 live graft desk. Does not touch src/.
 * Vite on 127.0.0.1:5180. Writes stills next to this file.
 */
import puppeteer from '../../../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5180/';
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
    const row = ctx?.world?.hangar?.hulls?.find((h) => h.id === ctx?.world?.hangar?.mountedId);
    return {
      docked: !!ctx?.flags?.docked,
      system: sys,
      faction: fac,
      credits: ctx?.world?.credits,
      beautiful: ctx?.world?.reputation?.beautiful,
      gilded: ctx?.world?.reputation?.gilded,
      mountedId: ctx?.world?.hangar?.mountedId,
      hulls: (ctx?.world?.hangar?.hulls ?? []).map((h) => ({
        id: h.id,
        classKey: h.classKey,
        hullKind: h.hullKind,
        grafted: h.grafted === true,
        faction: h.faction,
      })),
      player: {
        classKey: ctx?.player?.classKey,
        hullKind: ctx?.player?.hullKind,
        grafted: ctx?.player?.grafted === true,
      },
      notice: ov?.querySelector('.station-notice')?.textContent ?? '',
      overlay: ov ? ov.textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      rowGrafted: row?.grafted === true,
    };
  });
}

async function clickLabel(label) {
  return page.evaluate((want) => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === want);
    if (!btn) return false;
    btn.click();
    return true;
  }, label);
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
    await shot('00-not-ready.png');
    throw new Error('sim not ready');
  }

  const setup = await page.evaluate(async () => {
    const ctx = window.__ctx;
    const dest = 'gc_auction';
    const waitFrames = (n) => new Promise((resolve) => {
      let i = 0;
      const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    if (ctx.world.currentSystem !== dest) {
      ctx.emit('jumpRequested', { to: dest });
      for (let i = 0; i < 240; i++) {
        await waitFrames(1);
        if (ctx.world.currentSystem === dest && !ctx.gate?.jumping) break;
      }
    }
    const def = ctx.systems[dest] || ctx.systems[ctx.world.currentSystem];
    const st = def.station?.position;
    const sx = Array.isArray(st) ? st[0] : (st?.x ?? ctx.station.position.x);
    const sy = Array.isArray(st) ? st[1] : (st?.y ?? ctx.station.position.y);
    const sz = Array.isArray(st) ? st[2] : (st?.z ?? ctx.station.position.z);
    ctx.world.currentSystem = dest;
    ctx.flags.docked = false;
    ctx.flags.combat = false;
    ctx.flags.paused = false;
    if (ctx.player) ctx.player.destroyed = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    if (typeof ctx.ship.speed === 'number') ctx.ship.speed = 0;
    ctx.ship.object.position.set(sx + 36, sy, sz);
    ctx.emit('hailClosed');
    ctx.world.credits = 50000;
    ctx.world.reputation = ctx.world.reputation ?? {};
    ctx.world.reputation.gilded = Math.max(0, ctx.world.reputation.gilded ?? 0);
    ctx.world.reputation.beautiful = 4;
    await waitFrames(4);
    ctx.input.dockPressed = true;
    await waitFrames(8);
    ctx.input.dockPressed = false;
    await waitFrames(4);
    return {
      system: ctx.world.currentSystem,
      faction: ctx.systems[dest]?.faction,
      credits: ctx.world.credits,
      hullKind: ctx.player.hullKind,
      docked: !!ctx.flags.docked,
    };
  });
  say('setup', JSON.stringify(setup));

  if (!setup.docked) {
    await page.keyboard.press('KeyD');
    await sleep(800);
  }
  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 15000 }).catch(() => null);

  const home = await overlayDump();
  say('home', JSON.stringify({
    docked: home.docked,
    faction: home.faction,
    system: home.system,
    player: home.player,
    menu: home.buttons,
  }));
  await shot('01-gilded-dock.png');

  await page.keyboard.press('Digit0');
  await sleep(400);
  const shipyard = await overlayDump();
  say('shipyard', JSON.stringify({
    head: (shipyard.overlay || '').includes('SHIPYARD'),
    buttons: shipyard.buttons,
  }));
  await shot('02-shipyard.png');

  await page.keyboard.press('Digit2');
  await sleep(400);
  const yard = await overlayDump();
  say('yard', JSON.stringify({
    credits: yard.credits,
    buttons: yard.buttons,
    overlaySlice: (yard.overlay || '').slice(0, 700),
  }));
  await shot('03-yard-rows.png');

  await page.keyboard.press('Digit3');
  await sleep(400);
  const pending = await overlayDump();
  say('pending', JSON.stringify({
    credits: pending.credits,
    hulls: pending.hulls.length,
    buttons: pending.buttons,
  }));
  await shot('04-light-papers.png');

  const buyClicked = await clickLabel('Confirm papers');
  await sleep(500);
  const afterBuy = await overlayDump();
  say('afterBuy', JSON.stringify({
    clicked: buyClicked,
    credits: afterBuy.credits,
    hulls: afterBuy.hulls,
    mountedId: afterBuy.mountedId,
    player: afterBuy.player,
    notice: afterBuy.notice,
  }));
  await shot('05-after-buy.png');

  await page.keyboard.press('Digit1');
  await sleep(400);
  const hangar = await overlayDump();
  say('hangar', JSON.stringify({
    buttons: hangar.buttons,
    hulls: hangar.hulls,
    overlaySlice: (hangar.overlay || '').slice(0, 700),
  }));
  await shot('06-hangar.png');

  const plated = hangar.hulls.find((h) => h.hullKind === 'built' && h.id !== hangar.mountedId);
  if (plated) {
    await page.keyboard.press('Digit4');
    await sleep(400);
  }
  const mounted = await overlayDump();
  say('mounted', JSON.stringify({
    mountedId: mounted.mountedId,
    player: mounted.player,
    hulls: mounted.hulls,
    buttons: mounted.buttons,
  }));
  await shot('07-plated-mounted.png');

  const offer1 = await clickLabel('Offer graft');
  await sleep(400);
  const warn = await overlayDump();
  say('warn', JSON.stringify({
    clicked: offer1,
    credits: warn.credits,
    beautiful: warn.beautiful,
    player: warn.player,
    hulls: warn.hulls,
    buttons: warn.buttons,
    overlaySlice: (warn.overlay || '').slice(0, 900),
  }));
  await shot('08-graft-warning.png');

  await page.keyboard.press('Escape');
  await sleep(400);
  const afterEsc = await overlayDump();
  say('afterEsc', JSON.stringify({
    credits: afterEsc.credits,
    beautiful: afterEsc.beautiful,
    player: afterEsc.player,
    hulls: afterEsc.hulls,
    buttons: afterEsc.buttons,
  }));
  await shot('09-esc-cancel.png');

  const offer2 = await clickLabel('Offer graft');
  await sleep(400);
  const rearmed = await overlayDump();
  const confirmClicked = await clickLabel('Confirm graft');
  await sleep(500);
  const afterConfirm = await overlayDump();
  say('afterConfirm', JSON.stringify({
    offer2,
    confirmClicked,
    credits: afterConfirm.credits,
    beautiful: afterConfirm.beautiful,
    player: afterConfirm.player,
    hulls: afterConfirm.hulls,
    buttons: afterConfirm.buttons,
    notice: afterConfirm.notice,
  }));
  await shot('10-graft-confirm.png');

  const starter = afterConfirm.hulls.find((h) => h.hullKind === 'living');
  if (starter) {
    await page.keyboard.press('Digit3');
    await sleep(400);
  }
  const living = await overlayDump();
  say('living', JSON.stringify({
    mountedId: living.mountedId,
    player: living.player,
    buttons: living.buttons,
  }));
  await shot('11-living-no-offer.png');

  const warnText = 'Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.';
  const pins = {
    gildedDock: home.docked === true && home.faction === 'gilded' && home.system === 'gc_auction',
    digit0Shipyard: (shipyard.overlay || '').includes('SHIPYARD'),
    buyPlated: afterBuy.hulls.some((h) => h.hullKind === 'built') && afterBuy.player.hullKind === 'living',
    mountedPlated: mounted.player.hullKind === 'built',
    warnShown: offer1 && (warn.overlay || '').includes(warnText)
      && warn.buttons.includes('Confirm graft'),
    warnNoWrite: warn.player.grafted !== true && warn.hulls.every((h) => h.grafted !== true),
    warnNoDebit: warn.credits === afterBuy.credits,
    escClears: !afterEsc.buttons.includes('Confirm graft') && afterEsc.buttons.includes('Offer graft'),
    escNoGrafted: afterEsc.player.grafted !== true && afterEsc.hulls.every((h) => h.grafted !== true),
    escStanding: afterEsc.beautiful === warn.beautiful,
    confirmGrafted: afterConfirm.player.grafted === true
      && afterConfirm.hulls.some((h) => h.grafted === true && h.hullKind === 'built'),
    confirmKindBuilt: afterConfirm.player.hullKind === 'built',
    confirmNoDebit: afterConfirm.credits === warn.credits,
    confirmStanding: (afterConfirm.beautiful ?? 0) <= -10,
    livingNoOffer: living.player.hullKind === 'living' && !living.buttons.includes('Offer graft'),
    rearmed: rearmed.buttons.includes('Confirm graft'),
  };
  say('PINS', JSON.stringify(pins, null, 2));
  const fail = Object.entries(pins).filter(([, v]) => v !== true).map(([k]) => k);
  if (fail.length) say('LIVE FAIL', fail.join(','));
  else say('ALL LIVE PINS TRUE');
} catch (err) {
  say('LIVE ERROR', err?.stack || err?.message || String(err));
} finally {
  writeFileSync(join(OUT, 'browser-graft.log'), log.join('\n') + '\n');
  await browser.close();
}
