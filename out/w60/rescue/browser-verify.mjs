/**
 * Wave 60 live dock check. Does not touch src/. Uses Vite on :5173
 * and the existing window.__ctx debug handle.
 */
import puppeteer from '../../hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
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
  await page.keyboard.press('Digit1');
  await new Promise((r) => setTimeout(r, 1600));

  const ready = await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
  }, { timeout: 30000 }).catch(() => null);

  if (!ready) {
    await page.screenshot({ path: join(OUT, 'browser-not-ready.png') });
    throw new Error('sim not ready');
  }

  const setup = await page.evaluate(() => {
    const ctx = window.__ctx;
    const def = ctx.systems[ctx.world.currentSystem];
    const faction = def.faction;
    const pos = ctx.station.position;
    ctx.flags.docked = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(pos.x, pos.y, pos.z);
    ctx.cargo.length = 0;
    ctx.cargo.push({ commodity: 'survivor', units: 2, faction, source: 'other' });
    ctx.cargo.push({ commodity: 'survivor', units: 1, faction: 'veridian', source: 'playerKill' });
    ctx.cargo.push({ commodity: 'provisions', units: 3 });
    ctx.world.reputation[faction] = 10;
    ctx.world.reputation.veridian = 3;
    ctx.input.dockPressed = true;
    return {
      faction,
      factionName: def.station?.name,
      system: ctx.world.currentSystem,
      rep: ctx.world.reputation[faction],
    };
  });
  say('setup', JSON.stringify(setup));

  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 8000 }).catch(() => null);

  const home = await page.evaluate(() => {
    const ov = document.querySelector('.station-overlay');
    const text = ov ? ov.textContent : '';
    const btns = [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent);
    return {
      docked: !!window.__ctx.flags.docked,
      display: ov && ov.style.display,
      hasReturn: btns.includes('Return survivors'),
      hasAboard: /aboard belong/.test(text),
      hasWrong: /Some aboard belong/.test(text),
      menu: btns.filter((t) => /^\d — /.test(t)),
      hasRescueDigit: btns.some((t) => /rescue/i.test(t) && /^\d/.test(t)),
    };
  });
  say('home', JSON.stringify(home));
  await page.screenshot({ path: join(OUT, 'browser-dock-home.png') });

  // Market: digit 1 from home.
  await page.keyboard.press('Digit1');
  await new Promise((r) => setTimeout(r, 300));
  const market = await page.evaluate(() => {
    const ov = document.querySelector('.station-overlay');
    const text = ov ? ov.textContent : '';
    return {
      isMarket: /MARKET/.test(text),
      listsSurvivor: /survivor/i.test(text),
      listsProvisions: /Provisions/.test(text),
    };
  });
  say('market', JSON.stringify(market));
  await page.screenshot({ path: join(OUT, 'browser-market.png') });

  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 200));
  await page.keyboard.press('Digit7');
  await new Promise((r) => setTimeout(r, 300));
  const people = await page.evaluate(() => {
    const ov = document.querySelector('.station-overlay');
    const text = ov ? ov.textContent : '';
    const btns = [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent);
    return {
      isPeople: /PEOPLE/.test(text),
      hasReturn: btns.includes('Return survivors'),
      returnHasDigit: btns.some((t) => /^[0-9] — Return/.test(t)),
    };
  });
  say('people', JSON.stringify(people));
  await page.screenshot({ path: join(OUT, 'browser-people.png') });

  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Return survivors');
    if (!btn) return { ok: false };
    btn.click();
    return { ok: true };
  });
  say('click', JSON.stringify(clicked));
  await new Promise((r) => setTimeout(r, 250));

  const after = await page.evaluate(() => {
    const ctx = window.__ctx;
    const fac = ctx.systems[ctx.world.currentSystem].faction;
    const ov = document.querySelector('.station-overlay');
    const toast = [...document.querySelectorAll('.rw-toast')].map((n) => n.textContent);
    return {
      cargo: ctx.cargo.map((c) => ({ commodity: c.commodity, units: c.units, faction: c.faction, source: c.source })),
      repHere: ctx.world.reputation[fac],
      repVeridian: ctx.world.reputation.veridian,
      notice: ov && ov.querySelector('.station-notice')?.textContent,
      overlayText: ov ? ov.textContent.slice(0, 400) : '',
      toasts: toast,
      events: (ctx.lastEvents || []).map((e) => e.type).concat((ctx.events || []).map((e) => e.type)),
    };
  });
  say('after', JSON.stringify(after));
  await page.screenshot({ path: join(OUT, 'browser-after-return.png') });

  const checks = {
    'browser.docked': home.docked === true,
    'browser.homeReturn': home.hasReturn === true,
    'browser.homeWrongFactionNote': home.hasWrong === true,
    'browser.noRescueDigit': home.hasRescueDigit === false,
    'browser.nineMenu': home.menu.length === 9,
    'browser.marketNoSurvivor': market.isMarket && market.listsSurvivor === false,
    'browser.marketHasProvisions': market.listsProvisions === true,
    'browser.peopleReturn': people.isPeople && people.hasReturn === true,
    'browser.peopleNoDigit': people.returnHasDigit === false,
    'browser.clicked': clicked.ok === true,
    'browser.keptWrongFaction': after.cargo.some((c) => c.commodity === 'survivor' && c.faction === 'veridian' && c.units === 1),
    'browser.removedMatch': !after.cargo.some((c) => c.commodity === 'survivor' && c.faction === setup.faction),
    'browser.keptProvisions': after.cargo.some((c) => c.commodity === 'provisions' && c.units === 3),
    'browser.otherRep': after.repHere === 10 + 4 * 2,
    'browser.veridianUntouched': after.repVeridian === 3,
  };
  const fails = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  for (const [k, v] of Object.entries(checks)) say(v ? `PASS ${k}` : `FAIL ${k}`);
  if (fails.length) {
    say('BROWSER FAIL');
    say(fails.join('\n'));
    writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n'));
    process.exitCode = 1;
  } else {
    say('BROWSER CLEAN');
    writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n'));
  }
} catch (err) {
  say('BROWSER ERROR', err && err.message ? err.message : String(err));
  try { await page.screenshot({ path: join(OUT, 'browser-error.png') }); } catch {}
  writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
