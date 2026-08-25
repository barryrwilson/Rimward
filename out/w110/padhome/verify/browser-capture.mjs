/**
 * WAVE110 pad-home browser stills. Evidence only. Does not touch src/.
 * Chrome CDP 9401, profile out/w110/padhome/verify/chrome-profile/.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5174/';
const OUT = 'C:\\Projects\\WebSim\\out\\w110\\padhome\\verify';
const PROFILE = join(OUT, 'chrome-profile');
mkdirSync(PROFILE, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  dumpio: false,
  userDataDir: PROFILE,
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--remote-debugging-port=9401',
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

await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
  } catch {}
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
  if (cont) cont.click();
  else if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  }
});

await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player);
}, { timeout: 45000 }).catch((err) => say('ship-wait-err', err.message));

await page.evaluate(() => {
  try { window.__ctx.flags.paused = false; } catch {}
});
await new Promise((r) => setTimeout(r, 900));

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
  const padHomeChild = kids.some((c) => /padHome|pad-home|hold-pip|station-ring/i.test(c.className));
  const ctx = window.__ctx;
  const records = ctx?.world?.records ?? [];
  const patrols = records.filter((r) => r.role === 'patrol').map((r) => {
    const wp0 = r.route && r.route[0];
    const st = ctx.systems?.[r.system]?.station?.position;
    const sx = Array.isArray(st) ? st[0] : st?.x;
    const sz = Array.isArray(st) ? st[2] : st?.z;
    const xz = wp0 && Number.isFinite(sx) ? Math.hypot(wp0.x - sx, wp0.z - sz) : null;
    return { name: r.name, classKey: r.classKey, speed: r.speed, xz, n: r.route?.length ?? 0 };
  });
  return {
    reticle: rect ? { w: rect.width, h: rect.height } : null,
    kids,
    padHomeChild,
    rangeText: reticle?.querySelector('.rw-reticle-range')?.textContent ?? null,
    docked: !!ctx?.flags?.docked,
    service: ctx?.stationUi?.service ?? ctx?.station?.service ?? null,
    patrols,
  };
});
say('hub', JSON.stringify(hub));
await page.screenshot({ path: join(OUT, '01-hub.png') });

const digit = await page.evaluate(() => {
  const ctx = window.__ctx;
  const overlay = document.getElementById('station-overlay')
    || document.querySelector('.station-overlay')
    || document.querySelector('[data-service]');
  const visible = overlay ? getComputedStyle(overlay).display !== 'none' : false;
  return {
    docked: !!ctx?.flags?.docked,
    overlayPresent: !!overlay,
    overlayVisible: visible,
    overlayText: overlay ? (overlay.textContent || '').slice(0, 120) : '',
  };
});
say('pre-digit', JSON.stringify(digit));
await page.keyboard.press('Digit0');
await new Promise((r) => setTimeout(r, 400));
const after0 = await page.evaluate(() => {
  const ctx = window.__ctx;
  const body = (document.body.innerText || '').slice(0, 400);
  const shipyard = /shipyard/i.test(body);
  const overlay = document.querySelector('#station-root, .rw-station, .station-panel, [class*="station"]');
  return {
    docked: !!ctx?.flags?.docked,
    shipyardOnPage: shipyard,
    overlayClass: overlay ? String(overlay.className || overlay.id || '') : null,
  };
});
say('after-digit0-undocked', JSON.stringify(after0));
await page.screenshot({ path: join(OUT, '02-digit0-undocked.png') });

await page.evaluate(() => {
  const ctx = window.__ctx;
  const st = ctx?.systems?.[ctx.world.currentSystem]?.station?.position;
  if (!ctx?.ship?.object || !st) return;
  const sx = Array.isArray(st) ? st[0] : st.x;
  const sy = Array.isArray(st) ? st[1] : st.y;
  const sz = Array.isArray(st) ? st[2] : st.z;
  ctx.ship.object.position.set(sx + 20, sy, sz);
  if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
  ctx.input.dockPressed = true;
  ctx.flags.paused = false;
});
await new Promise((r) => setTimeout(r, 700));
const docked = await page.evaluate(() => {
  const ctx = window.__ctx;
  const overlay = document.getElementById('station-overlay')
    || document.querySelector('.station-overlay');
  return {
    docked: !!ctx?.flags?.docked,
    inZone: !!ctx?.station?.inZone,
    overlayDisplay: overlay ? getComputedStyle(overlay).display : null,
  };
});
say('docked', JSON.stringify(docked));
await page.screenshot({ path: join(OUT, '03-dock.png') });
await page.keyboard.press('Digit0');
await new Promise((r) => setTimeout(r, 500));
const shipyard = await page.evaluate(() => {
  const ctx = window.__ctx;
  const overlay = document.getElementById('station-overlay')
    || document.querySelector('.station-overlay')
    || document.body;
  const text = (overlay.textContent || '').replace(/\s+/g, ' ').trim();
  const service = ctx?.stationUi?.service
    || ctx?.station?.service
    || ctx?.ui?.service
    || null;
  return {
    docked: !!ctx?.flags?.docked,
    service,
    hasShipyard: /shipyard/i.test(text),
    hasPadHome: /pad[- ]?home/i.test(text),
    snippet: text.slice(0, 240),
  };
});
say('digit0-docked', JSON.stringify(shipyard));
await page.screenshot({ path: join(OUT, '04-digit0-shipyard.png') });

writeFileSync(join(OUT, 'browser-states.json'), JSON.stringify({ hub, digit, after0, docked, shipyard }, null, 2));
writeFileSync(join(OUT, 'browser-log.txt'), log.join('\n'));
say('done');
await browser.close();
process.exit(0);
