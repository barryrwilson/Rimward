/**
 * WAVE111 REP-03 Digit 9 climb-copy stills. Evidence only. Does not touch src/.
 * Chrome CDP 9413, profile out/w111/rep03/verify/chrome-profile/.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5173/';
const OUT = 'C:\\Projects\\WebSim\\out\\w111\\rep03\\verify';
const PROFILE = join(OUT, 'chrome-profile');
mkdirSync(PROFILE, { recursive: true });

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
  dumpio: false,
  userDataDir: PROFILE,
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--remote-debugging-port=9413',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-gpu',
    '--no-default-browser-check',
  ],
});

const page = await browser.newPage();
page.on('pageerror', (err) => say('PAGEERR', err.message));
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error' || t === 'warning') say(t.toUpperCase(), msg.text());
});

say('goto', APP);
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 45000 });
  say('domcontentloaded', page.url());
} catch (err) {
  say('goto-err', err.message);
  await page.screenshot({ path: join(OUT, '00-goto-fail.png') }).catch(() => {});
}

await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 }).catch((err) => {
  say('ctx-wait-err', err.message);
});

await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  const cont = document.getElementById('rw-title-continue');
  if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  } else if (cont) cont.click();
});

await page.waitForFunction(() => {
  const title = document.getElementById('rw-title');
  return !title || getComputedStyle(title).display === 'none';
}, { timeout: 20000 }).catch((err) => say('title-wait-err', err.message));

await sleep(400);
const originVisible = await page.evaluate(() => {
  const body = document.body.innerText || '';
  return /who are you/i.test(body);
});
say('originVisible', originVisible);
if (originVisible) {
  await page.keyboard.press('Digit1');
  await sleep(500);
}

await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player);
}, { timeout: 45000 }).catch((err) => say('ship-wait-err', err.message));

await page.evaluate(() => {
  try { window.__ctx.flags.paused = false; } catch {}
});
await sleep(800);

const hub = await page.evaluate(() => {
  const reticle = document.querySelector('.rw-reticle');
  const rect = reticle ? reticle.getBoundingClientRect() : null;
  const kids = reticle
    ? [...reticle.children].map((c) => ({
      tag: c.tagName,
      className: String(c.className || ''),
      text: (c.textContent || '').trim().slice(0, 40),
    }))
    : [];
  const extra = kids.filter((c) => !/rw-reticle-(pupil|cilia|range)/.test(c.className));
  return {
    reticle: rect ? { w: rect.width, h: rect.height } : null,
    kids,
    extra,
    rangeText: reticle?.querySelector('.rw-reticle-range')?.textContent ?? null,
    origin: window.__ctx?.world?.origin ?? null,
    docked: !!window.__ctx?.flags?.docked,
  };
});
say('hub', JSON.stringify(hub));
await page.screenshot({ path: join(OUT, '05-hub.png') });

await page.evaluate(() => {
  const ctx = window.__ctx;
  const sys = ctx?.world?.currentSystem;
  const st = ctx?.systems?.[sys]?.station?.position;
  if (!ctx?.ship?.object || !st) return;
  const sx = Array.isArray(st) ? st[0] : st.x;
  const sy = Array.isArray(st) ? st[1] : st.y;
  const sz = Array.isArray(st) ? st[2] : st.z;
  ctx.ship.object.position.set(sx + 20, sy, sz);
  if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
  ctx.input.dockPressed = true;
  ctx.flags.paused = false;
});
await sleep(900);

const docked = await page.evaluate(() => {
  const ctx = window.__ctx;
  const overlay = document.getElementById('station-overlay');
  return {
    docked: !!ctx?.flags?.docked,
    overlayDisplay: overlay ? getComputedStyle(overlay).display : null,
    system: ctx?.world?.currentSystem ?? null,
    faction: ctx?.systems?.[ctx?.world?.currentSystem]?.faction
      ?? ctx?.world?.systems?.[ctx?.world?.currentSystem]?.faction
      ?? null,
  };
});
say('docked', JSON.stringify(docked));

await page.keyboard.press('Digit9');
await sleep(500);

const standing0 = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    service: window.__ctx?.stationUi?.service ?? window.__ctx?.station?.ui?.service ?? null,
    hasRestitution: /RESTITUTION/.test(text) && /Pay restitution/.test(text),
    hasClimb: /After restitution/.test(text) && /climbs from 0/.test(text),
    hasFamilies: /mining, trade, hunt, passenger, explore, spy, and war/.test(text),
    hasKnown: /Known 10/.test(text),
    hasPlus2: /\+2/.test(text),
    snippet: text.slice(0, 900),
  };
});
say('digit9-default', JSON.stringify(standing0));
await page.screenshot({ path: join(OUT, '02-digit9-at-0-default.png') });

const harness = await page.evaluate(() => {
  const ctx = window.__ctx;
  const sys = ctx.world.currentSystem;
  const fac = ctx.systems?.[sys]?.faction
    || ctx.world?.currentFaction
    || null;
  const bag = (ctx.world.reputation ??= {});
  if (typeof fac === 'string') bag[fac] = -8;
  ctx.world.credits = Math.max(ctx.world.credits || 0, 2500);
  return {
    fac,
    standing: bag[fac],
    credits: ctx.world.credits,
  };
});
say('harness-neg', JSON.stringify(harness));

await page.keyboard.press('Escape');
await sleep(250);
await page.keyboard.press('Digit9');
await sleep(500);

const below0 = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  const notes = [...overlay.querySelectorAll('.screen-note')].map((n) => n.textContent);
  const subs = [...overlay.querySelectorAll('.screen-sub')].map((n) => n.textContent);
  const btns = [...overlay.querySelectorAll('button')].map((n) => n.textContent.trim());
  return {
    hasRestitutionHead: subs.includes('RESTITUTION'),
    hasHowMoves: subs.includes('HOW STANDING MOVES'),
    hasPay: btns.some((t) => /Pay restitution/i.test(t)),
    hasClimb: notes.some((t) => /After restitution/.test(t)),
    hasFamilies: /mining, trade, hunt, passenger, explore, spy, and war/.test(text),
    hasKnown: /Known 10/.test(text),
    hasPlus2: /\+2/.test(text),
    innerHTMLOnNotes: notes.some((t) => t.includes('innerHTML')),
    subs,
    btns,
    climbNotes: notes.filter((t) => /After restitution|climbs from 0|Jobs board/.test(t)),
    snippet: text.slice(0, 1200),
  };
});
say('digit9-below0', JSON.stringify(below0));
await page.screenshot({ path: join(OUT, '01-digit9-below0.png') });

const payClicked = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay');
  const btn = [...(overlay?.querySelectorAll('button') || [])]
    .find((b) => /Pay restitution/i.test(b.textContent || ''));
  if (btn) { btn.click(); return 'pay'; }
  return 'missing';
});
say('pay-click', payClicked);
await sleep(350);
const confirmClicked = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay');
  const btn = [...(overlay?.querySelectorAll('button') || [])]
    .find((b) => /Confirm restitution/i.test(b.textContent || ''));
  if (btn) { btn.click(); return 'confirm'; }
  return 'missing';
});
say('confirm-click', confirmClicked);
await sleep(600);

const at0 = await page.evaluate(() => {
  const ctx = window.__ctx;
  const sys = ctx.world.currentSystem;
  const fac = ctx.systems?.[sys]?.faction;
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  const subs = [...overlay.querySelectorAll('.screen-sub')].map((n) => n.textContent);
  const notes = [...overlay.querySelectorAll('.screen-note')].map((n) => n.textContent);
  return {
    standing: fac ? ctx.world.reputation?.[fac] : null,
    credits: ctx.world.credits,
    hasRestitutionHead: subs.includes('RESTITUTION'),
    hasPayCopy: /Pay restitution/.test(text),
    hasHowMoves: subs.includes('HOW STANDING MOVES'),
    hasClimb: notes.some((t) => /After restitution/.test(t)),
    hasFamilies: /mining, trade, hunt, passenger, explore, spy, and war/.test(text),
    hasKnown: /Known 10/.test(text),
    hasPlus2: /\+2/.test(text),
    subs,
    climbNotes: notes.filter((t) => /After restitution|climbs from 0|Jobs board/.test(t)),
    snippet: text.slice(0, 1200),
  };
});
say('digit9-after-pay', JSON.stringify(at0));
await page.screenshot({ path: join(OUT, '02-digit9-at-0.png') });

await page.keyboard.press('Escape');
await sleep(250);
await page.keyboard.press('Digit2');
await sleep(400);
const jobs = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    hasJobs: /Jobs board|JOBS/i.test(text),
    snippet: text.slice(0, 400),
  };
});
say('digit2', JSON.stringify(jobs));
await page.screenshot({ path: join(OUT, '04-digit2-jobs.png') });

await page.keyboard.press('Escape');
await sleep(250);
await page.keyboard.press('Digit0');
await sleep(400);
const yard = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    hasShipyard: /SHIPYARD|Hangar|hull/i.test(text),
    snippet: text.slice(0, 400),
  };
});
say('digit0', JSON.stringify(yard));
await page.screenshot({ path: join(OUT, '03-digit0-shipyard.png') });

await page.keyboard.press('Escape');
await sleep(250);
await page.keyboard.press('Digit8');
await sleep(400);
const launch = await page.evaluate(() => {
  const overlay = document.getElementById('station-overlay') || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    hasLaunch: /LAUNCH|Undock|Leave berth/i.test(text),
    snippet: text.slice(0, 400),
  };
});
say('digit8', JSON.stringify(launch));
await page.screenshot({ path: join(OUT, '06-digit8-launch.png') });

await page.keyboard.press('Escape');
await sleep(200);
await page.keyboard.press('KeyB');
await sleep(500);

const hub2 = await page.evaluate(() => {
  const reticle = document.querySelector('.rw-reticle');
  const rect = reticle ? reticle.getBoundingClientRect() : null;
  const kids = reticle
    ? [...reticle.children].map((c) => ({
      tag: c.tagName,
      className: String(c.className || ''),
      text: (c.textContent || '').trim().slice(0, 40),
    }))
    : [];
  return {
    docked: !!window.__ctx?.flags?.docked,
    reticle: rect ? { w: rect.width, h: rect.height } : null,
    kids,
    extra: kids.filter((c) => !/rw-reticle-(pupil|cilia|range)/.test(c.className)),
  };
});
say('hub-undock', JSON.stringify(hub2));
await page.screenshot({ path: join(OUT, '05-hub-undock.png') });

writeFileSync(join(OUT, 'browser-states.json'), JSON.stringify({
  hub, docked, standing0, harness, below0, at0, jobs, yard, launch, hub2,
}, null, 2));
writeFileSync(join(OUT, 'browser-log.txt'), log.join('\n') + '\n');
say('done');

try {
  await browser.close();
} catch (err) {
  say('close-err', err.message);
}
process.exit(0);
