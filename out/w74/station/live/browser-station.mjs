/**
 * WAVE74 station live dock. Digit 9 Standing + Archive desk. Does not touch src/.
 * Vite: WEBSIM_URL or http://127.0.0.1:5182/
 */
import puppeteer from '../../../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5182/';
const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const errors = [];
const pageErrors = [];
const stationErrors = [];

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
page.on('pageerror', (err) => {
  const msg = err?.message || String(err);
  pageErrors.push(msg);
  say('PAGEERR', msg);
  if (/station\.js/i.test(msg) || /station/i.test(err?.stack || '')) {
    stationErrors.push(msg);
  }
});
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  errors.push(text);
  say('ERROR', text);
  if (/station\.js/i.test(text)) stationErrors.push(text);
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
    const def = ctx?.systems?.[sys];
    const cargo = Array.isArray(ctx?.cargo)
      ? ctx.cargo.map((r) => ({
        commodity: r?.commodity,
        units: r?.units,
        source: r?.source,
        originFaction: r?.originFaction,
      }))
      : [];
    return {
      docked: !!ctx?.flags?.docked,
      system: sys,
      faction: def?.faction ?? null,
      stationName: def?.station?.name ?? '',
      credits: ctx?.world?.credits,
      cargo,
      cargoJson: JSON.stringify(ctx?.cargo ?? []),
      notice: ov?.querySelector('.station-notice')?.textContent ?? '',
      overlay: ov ? ov.textContent : '',
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      overlayDisplay: ov ? ov.style.display : '',
    };
  });
}

async function clickLabel(label) {
  return page.evaluate((want) => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => (b.textContent || '').trim() === want || (b.textContent || '').includes(want));
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

async function dockAt(dest) {
  return page.evaluate(async (dest) => {
    const ctx = window.__ctx;
    const waitFrames = (n) => new Promise((resolve) => {
      let i = 0;
      const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    const hasDest = !!(ctx.systems && ctx.systems[dest]);
    if (ctx.flags?.docked) {
      ctx.emit('undocked');
      ctx.flags.docked = false;
      await waitFrames(8);
    }
    if (ctx.world.currentSystem !== dest) {
      try { ctx.emit('jumpRequested', { to: dest }); } catch {}
      for (let i = 0; i < 240; i++) {
        await waitFrames(1);
        if (ctx.world.currentSystem === dest && !ctx.gate?.jumping) break;
      }
    }
    if (ctx.world.currentSystem !== dest && hasDest) {
      ctx.world.currentSystem = dest;
      try { ctx.emit('systemLoaded', { id: dest }); } catch {}
      await waitFrames(12);
    }
    const sys = ctx.world.currentSystem;
    const def = ctx.systems[dest] || ctx.systems[sys];
    const st = def?.station?.position;
    const sx = Array.isArray(st) ? st[0] : (st?.x ?? ctx.station?.position?.x ?? 0);
    const sy = Array.isArray(st) ? st[1] : (st?.y ?? ctx.station?.position?.y ?? 0);
    const sz = Array.isArray(st) ? st[2] : (st?.z ?? ctx.station?.position?.z ?? 0);
    ctx.flags.docked = false;
    ctx.flags.combat = false;
    ctx.flags.paused = false;
    if (ctx.player) ctx.player.destroyed = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    if (typeof ctx.ship.speed === 'number') ctx.ship.speed = 0;
    if (ctx.ship.object?.position?.set) ctx.ship.object.position.set(sx + 36, sy, sz);
    try { ctx.emit('hailClosed'); } catch {}
    await waitFrames(4);
    ctx.input.dockPressed = true;
    await waitFrames(8);
    ctx.input.dockPressed = false;
    await waitFrames(6);
    return {
      requested: dest,
      hasDest,
      system: ctx.world.currentSystem,
      faction: ctx.systems[ctx.world.currentSystem]?.faction ?? null,
      docked: !!ctx.flags.docked,
    };
  }, dest);
}

const pins = {};
const pin = (name, cond) => {
  pins[name] = !!cond;
  say(cond ? 'PIN PASS' : 'PIN FAIL', name);
};

let assemblyReached = false;

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

  const sysKeys = await page.evaluate(() => {
    const ctx = window.__ctx;
    return {
      current: ctx.world.currentSystem,
      hasFreehold: !!ctx.systems?.freehold,
      hasCensus: !!ctx.systems?.as_census,
      hasArchive: !!ctx.systems?.as_archive,
      factions: {
        freehold: ctx.systems?.freehold?.faction,
        as_census: ctx.systems?.as_census?.faction,
        as_archive: ctx.systems?.as_archive?.faction,
      },
    };
  });
  say('systems', JSON.stringify(sysKeys));

  const fhSetup = await dockAt('freehold');
  say('freehold.setup', JSON.stringify(fhSetup));
  if (!fhSetup.docked) {
    await page.keyboard.press('KeyD');
    await sleep(800);
  }
  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx?.flags?.docked && ov && ov.style.display !== 'none');
  }, { timeout: 15000 }).catch(() => null);

  const fhHome = await overlayDump();
  say('freehold.home', JSON.stringify({
    docked: fhHome.docked,
    system: fhHome.system,
    faction: fhHome.faction,
    buttons: fhHome.buttons,
    overlaySlice: (fhHome.overlay || '').slice(0, 500),
  }));
  await shot('01-freehold-home.png');
  pin('fh.docked', fhHome.docked === true && fhHome.faction === 'freehold');
  pin('fh.digit0.menu', (fhHome.buttons || []).some((b) => /0\s*—\s*Shipyard/i.test(b)));
  pin('fh.digit9.menu', (fhHome.buttons || []).some((b) => /9\s*—\s*Standing/i.test(b)));

  await page.keyboard.press('Digit0');
  await sleep(500);
  const fhYard = await overlayDump();
  say('freehold.digit0', JSON.stringify({
    buttons: fhYard.buttons,
    overlaySlice: (fhYard.overlay || '').slice(0, 700),
  }));
  await shot('02-freehold-shipyard.png');
  pin('fh.digit0.shipyard', /SHIPYARD/i.test(fhYard.overlay || ''));

  await page.keyboard.press('Escape');
  await sleep(400);

  await page.keyboard.press('Digit9');
  await sleep(500);
  const fhStand = await overlayDump();
  const stText = fhStand.overlay || '';
  say('freehold.digit9', JSON.stringify({
    buttons: fhStand.buttons,
    overlaySlice: stText.slice(0, 1400),
  }));
  await shot('03-freehold-standing.png');
  pin('fh.standing.head', /STANDING/i.test(stText));
  pin('fh.standing.ladderHead', /LADDER/.test(stText));
  pin('fh.standing.sworn', /Sworn\s+50/.test(stText));
  pin('fh.standing.trusted', /Trusted\s+25/.test(stText));
  pin('fh.standing.known', /Known\s+10/.test(stText));
  pin('fh.standing.stranger', /Stranger\s+-10/.test(stText));
  pin('fh.standing.suspect', /Suspect\s+-25/.test(stText));
  pin('fh.standing.marked', /Marked\s+-1000/.test(stText));
  pin('fh.standing.currentRank', /Stranger|Known|Trusted|Sworn|Suspect|Marked/.test(stText));
  pin('fh.standing.howMoves', /HOW STANDING MOVES/.test(stText));
  pin('fh.standing.hunt', /hunt/i.test(stText) && /-10/.test(stText));
  pin('fh.standing.yard', /Yards refuse/i.test(stText) && /below 0/.test(stText));
  pin('fh.standing.locker', /locker/i.test(stText) && /Marked/.test(stText));
  pin('fh.standing.graft', /Graft/i.test(stText) && /min\(current, -10\)/.test(stText));
  pin('fh.standing.noPolice', !/police/i.test(stText) && !/restitution/i.test(stText));

  await page.keyboard.press('Escape');
  await sleep(400);
  await page.keyboard.press('Digit1');
  await sleep(500);
  const fhMkt = await overlayDump();
  const fhMktText = fhMkt.overlay || '';
  say('freehold.market', JSON.stringify({
    buttons: fhMkt.buttons,
    overlaySlice: fhMktText.slice(0, 900),
  }));
  await shot('04-freehold-market.png');
  pin('fh.market.head', /MARKET/.test(fhMktText));
  pin('fh.market.commodities', /Provisions/.test(fhMktText) && /Living rock/.test(fhMktText));
  pin('fh.market.noArchive', !/ARCHIVE/.test(fhMktText) && !/File a legal cube/.test(fhMktText)
    && !/filing desk/i.test(fhMktText));

  await page.keyboard.press('Escape');
  await sleep(400);
  await page.keyboard.press('Digit8');
  await sleep(800);

  const asmIds = [];
  if (sysKeys.hasCensus) asmIds.push('as_census');
  if (sysKeys.hasArchive) asmIds.push('as_archive');
  let asmSetup = null;
  for (const id of asmIds) {
    asmSetup = await dockAt(id);
    say('assembly.setup', JSON.stringify(asmSetup));
    if (!asmSetup.docked) {
      await page.keyboard.press('KeyD');
      await sleep(900);
    }
    const ok = await page.waitForFunction(() => {
      const ov = document.querySelector('.station-overlay');
      const ctx = window.__ctx;
      return !!(ctx?.flags?.docked && ctx?.systems?.[ctx.world.currentSystem]?.faction === 'assembly'
        && ov && ov.style.display !== 'none');
    }, { timeout: 12000 }).catch(() => null);
    if (ok) {
      assemblyReached = true;
      break;
    }
  }

  if (!assemblyReached) {
    await shot('05-assembly-undocked.png');
    say('ASSEMBLY DOCK FAILED', JSON.stringify(asmSetup));
    pin('as.docked', false);
  } else {
    const asHome = await overlayDump();
    say('assembly.home', JSON.stringify({
      docked: asHome.docked,
      system: asHome.system,
      faction: asHome.faction,
      buttons: asHome.buttons,
    }));
    await shot('05-assembly-home.png');
    pin('as.docked', asHome.docked === true && asHome.faction === 'assembly');

    await page.keyboard.press('Digit9');
    await sleep(500);
    const asStand = await overlayDump();
    await shot('06-assembly-standing.png');
    pin('as.standing.head', /STANDING/i.test(asStand.overlay || ''));
    pin('as.standing.ladder', /Sworn\s+50/.test(asStand.overlay || '') && /Marked\s+-1000/.test(asStand.overlay || ''));
    await page.keyboard.press('Escape');
    await sleep(400);

    await page.keyboard.press('Digit1');
    await sleep(500);
    const asMkt = await overlayDump();
    const asText = asMkt.overlay || '';
    say('assembly.market', JSON.stringify({
      credits: asMkt.credits,
      buttons: asMkt.buttons,
      overlaySlice: asText.slice(0, 1600),
    }));
    await shot('07-assembly-market.png');
    const archiveIdx = asText.indexOf('ARCHIVE');
    const provisionsIdx = asText.indexOf('Provisions');
    pin('as.market.commodities', /MARKET/.test(asText) && /Provisions/.test(asText));
    pin('as.market.archive', /ARCHIVE/.test(asText) && /UU unset/.test(asText));
    pin('as.market.archiveAfter', archiveIdx > 0 && provisionsIdx >= 0 && archiveIdx > provisionsIdx);
    pin('as.market.fileBuy', (asMkt.buttons || []).some((b) => /File a legal cube|File buy/.test(b)));

    const creditsBeforeArm = asMkt.credits;
    const cargoBeforeArm = asMkt.cargoJson;
    const armed = await clickLabel('File a legal cube') || await clickLabel('File buy');
    await sleep(400);
    const asArmed = await overlayDump();
    say('assembly.armed', JSON.stringify({
      clicked: armed,
      credits: asArmed.credits,
      buttons: asArmed.buttons,
      notice: asArmed.notice,
      overlaySlice: (asArmed.overlay || '').slice(0, 900),
    }));
    await shot('08-assembly-archive-armed.png');
    pin('as.archive.armed', armed === true && (asArmed.buttons || []).some((b) => /Confirm filing/.test(b)));
    pin('as.archive.armNoWrite', asArmed.credits === creditsBeforeArm && asArmed.cargoJson === cargoBeforeArm);
    pin('as.archive.escBtn', (asArmed.buttons || []).some((b) => /Esc/.test(b) && /Cancel/.test(b)));

    await page.keyboard.press('Escape');
    await sleep(400);
    const asEsc = await overlayDump();
    say('assembly.esc', JSON.stringify({
      credits: asEsc.credits,
      buttons: asEsc.buttons,
      notice: asEsc.notice,
    }));
    await shot('09-assembly-archive-esc.png');
    pin('as.archive.escClears', !(asEsc.buttons || []).some((b) => /Confirm filing/.test(b))
      && (asEsc.buttons || []).some((b) => /File a legal cube|File buy/.test(b)));
    pin('as.archive.escNoWrite', asEsc.credits === creditsBeforeArm && asEsc.cargoJson === cargoBeforeArm);

    const armed2 = await clickLabel('File a legal cube') || await clickLabel('File buy');
    await sleep(350);
    const asRearm = await overlayDump();
    const creditsBefore = asRearm.credits;
    const cargoBefore = asRearm.cargoJson;
    const confirmed = await clickLabel('Confirm filing');
    await sleep(500);
    const asConf = await overlayDump();
    say('assembly.confirm', JSON.stringify({
      armed2,
      confirmed,
      creditsBefore,
      creditsAfter: asConf.credits,
      cargoBefore,
      cargoAfter: asConf.cargoJson,
      notice: asConf.notice,
      buttons: asConf.buttons,
    }));
    await shot('10-assembly-archive-confirm.png');
    pin('as.archive.confirmClicked', confirmed === true);
    pin('as.archive.confirmNoCredit', asConf.credits === creditsBefore);
    pin('as.archive.confirmNoCargo', asConf.cargoJson === cargoBefore);
    pin('as.archive.uuNotice', typeof asConf.notice === 'string' && /UU unset/.test(asConf.notice));
  }

  pin('console.noStationJsError', stationErrors.length === 0);
  say('stationErrors', JSON.stringify(stationErrors));
  say('pageErrors', JSON.stringify(pageErrors.slice(0, 20)));
  say('consoleErrors', JSON.stringify(errors.slice(0, 30)));
  say('PINS', JSON.stringify(pins, null, 2));
  const fail = Object.entries(pins).filter(([, v]) => v !== true).map(([k]) => k);
  if (fail.length) say('LIVE FAIL', fail.join(','));
  else say('ALL LIVE PINS TRUE');
  say('assemblyReached', String(assemblyReached));
} catch (err) {
  say('LIVE ERROR', err?.stack || err?.message || String(err));
} finally {
  writeFileSync(join(OUT, 'browser-station.log'), log.join('\n') + '\n');
  writeFileSync(join(OUT, 'pins.json'), JSON.stringify({ pins, assemblyReached, errors, pageErrors, stationErrors }, null, 2));
  await browser.close();
}
