/**
 * Wave 103 HUD-03 browser capture. Evidence only. Does not touch src/.
 * Playwright MCP tools were not listed; uses Chrome + puppeteer-core.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://127.0.0.1:5178/';
const OUT = 'C:\\Projects\\WebSim\\out\\w103\\hud03\\verify';
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
  dumpio: true,
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-gpu',
  ],
});

const page = await browser.newPage();
const consoleLines = [];
page.on('pageerror', (err) => say('PAGEERR', err.message));
page.on('console', (msg) => {
  const t = msg.type();
  const text = msg.text();
  if (t === 'error' || t === 'warning') {
    consoleLines.push(`${t}: ${text}`);
    say(t.toUpperCase(), text);
  }
});

await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
    localStorage.removeItem('rimward-settings-v1');
  } catch {}
});

say('goto', APP);
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 45000 });
  say('domcontentloaded', page.url());
} catch (err) {
  say('goto-err', err.message);
  const html = await page.content().catch(() => '');
  writeFileSync(join(OUT, 'goto-fail.html'), html.slice(0, 4000));
  await page.screenshot({ path: join(OUT, '00-goto-fail.png') }).catch(() => {});
}
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });

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
}, { timeout: 45000 }).catch(() => null);

await page.evaluate(() => {
  try { window.__ctx.flags.paused = false; } catch {}
});
await new Promise((r) => setTimeout(r, 800));

await page.keyboard.press('KeyO');
await new Promise((r) => setTimeout(r, 400));

const panel = await page.evaluate(() => {
  const labels = [...document.querySelectorAll('label')].map((el) => ({
    text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    checked: !!el.querySelector('input[type="checkbox"]')?.checked,
    type: el.querySelector('input')?.type || null,
  }));
  const hudRow = labels.find((l) => l.text === 'HUD audio alerts');
  const reducedI = labels.findIndex((l) => l.text === 'Reduced motion');
  const hudI = labels.findIndex((l) => l.text === 'HUD audio alerts');
  const muteI = labels.findIndex((l) => l.text === 'Mute all audio');
  const dialog = [...document.querySelectorAll('[role="dialog"]')].find((el) =>
    (el.getAttribute('aria-label') || '') === 'Settings'
      || (el.textContent || '').includes('HUD audio alerts'));
  const settingsTitle = [...document.querySelectorAll('div')].some((n) => n.textContent === 'SETTINGS'
    && n.parentElement && (n.parentElement.textContent || '').includes('HUD audio alerts'));
  const reticle = document.querySelector('.rw-reticle');
  const rect = reticle ? reticle.getBoundingClientRect() : null;
  const reticleKids = reticle
    ? [...reticle.children].map((c) => ({
      tag: c.tagName,
      className: String(c.className || ''),
      text: (c.textContent || '').trim().slice(0, 40),
    }))
    : [];
  const alertChild = reticleKids.some((c) =>
    /hud-alert|klaxon|alert-pip|alert-gauge/i.test(c.className)
    || c.text === 'HUD audio alerts');
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('rimward-settings-v1') ?? 'null'); } catch { stored = 'parse-fail'; }
  return {
    labels,
    hudRow,
    reducedI,
    hudI,
    muteI,
    dialogDisplay: dialog ? getComputedStyle(dialog.parentElement || dialog).display : null,
    settingsTitle,
    hudAlertsLive: window.__ctx?.settings?.hudAlerts,
    mutedLive: window.__ctx?.settings?.muted,
    reticle: rect ? { w: rect.width, h: rect.height } : null,
    reticleKids,
    alertChild,
    stored,
    bodyClass: document.body.className,
    innerHtmlSettings: !!(dialog && /innerHTML/.test(dialog.innerHTML) && false),
    keyOStillSettings: !!(hudRow && settingsTitle),
  };
});

await page.screenshot({ path: join(OUT, '01-settings-default-off.png') });
say('panel', JSON.stringify(panel));

// Toggle HUD audio alerts on, confirm persist.
const toggled = await page.evaluate(() => {
  const row = [...document.querySelectorAll('label')].find((el) =>
    (el.textContent || '').replace(/\s+/g, ' ').trim() === 'HUD audio alerts');
  const input = row?.querySelector('input[type="checkbox"]');
  if (input) input.click();
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('rimward-settings-v1') ?? 'null'); } catch { stored = 'parse-fail'; }
  return {
    checked: !!input?.checked,
    live: window.__ctx?.settings?.hudAlerts,
    storedHud: stored && typeof stored === 'object' ? stored.hudAlerts : stored,
  };
});
say('toggled', JSON.stringify(toggled));
await page.screenshot({ path: join(OUT, '02-settings-toggled-on.png') });

// Digit0 while settings open should not steal KeyO. Close with KeyO, press Digit0, KeyO again.
await page.keyboard.press('KeyO');
await new Promise((r) => setTimeout(r, 200));
await page.keyboard.press('Digit0');
await new Promise((r) => setTimeout(r, 200));
await page.keyboard.press('KeyO');
await new Promise((r) => setTimeout(r, 300));
const afterDigit = await page.evaluate(() => {
  const dialogs = [...document.querySelectorAll('[aria-label="Settings"]')];
  const root = dialogs[0]?.parentElement;
  const hudRow = [...document.querySelectorAll('label')].some((el) =>
    (el.textContent || '').includes('HUD audio alerts')
    && getComputedStyle(el.closest('[role="dialog"]')?.parentElement || el).display === 'flex');
  const shipyard = [...document.querySelectorAll('*')].some((n) => {
    const t = n.childNodes.length === 1 && n.childNodes[0].nodeType === 3
      ? (n.textContent || '')
      : '';
    return t === 'SHIPYARD' || (typeof n.className === 'string' && n.className.includes('shipyard'));
  });
  return {
    settingsVisible: hudRow,
    display: root ? getComputedStyle(root).display : null,
    shipyardHint: shipyard,
    docked: !!window.__ctx?.flags?.docked,
  };
});
say('afterDigit0', JSON.stringify(afterDigit));
await page.screenshot({ path: join(OUT, '03-keyo-after-digit0.png') });

// Proto / corrupt blob: write inherited-style blob, reload, expect default false.
await page.evaluate(() => {
  localStorage.setItem('rimward-settings-v1', '{"__proto__":{"hudAlerts":true},"constructor":true,"prototype":true}');
  sessionStorage.setItem('rimward-title-skip', '1');
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });
await page.evaluate(() => {
  const cont = document.getElementById('rw-title-continue');
  if (cont) cont.click();
  try { window.__ctx.flags.paused = false; } catch {}
});
await new Promise((r) => setTimeout(r, 600));
await page.keyboard.press('KeyO');
await new Promise((r) => setTimeout(r, 300));
const protoReload = await page.evaluate(() => {
  const hudRow = [...document.querySelectorAll('label')].find((el) =>
    (el.textContent || '').replace(/\s+/g, ' ').trim() === 'HUD audio alerts');
  const protoPollute = Object.prototype.hudAlerts === true;
  return {
    live: window.__ctx?.settings?.hudAlerts,
    checked: !!hudRow?.querySelector('input[type="checkbox"]')?.checked,
    protoPollute,
    ownOnPrototype: Object.prototype.hasOwnProperty.call(Object.prototype, 'hudAlerts'),
  };
});
say('protoReload', JSON.stringify(protoReload));
await page.screenshot({ path: join(OUT, '04-proto-blob-default-off.png') });

// Type-wrong blob
await page.evaluate(() => {
  localStorage.setItem('rimward-settings-v1', '{"hudAlerts":"true","muted":1}');
  sessionStorage.setItem('rimward-title-skip', '1');
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });
await page.evaluate(() => {
  const cont = document.getElementById('rw-title-continue');
  if (cont) cont.click();
  try { window.__ctx.flags.paused = false; } catch {}
});
await new Promise((r) => setTimeout(r, 600));
const badType = await page.evaluate(() => ({
  live: window.__ctx?.settings?.hudAlerts,
  muted: window.__ctx?.settings?.muted,
}));
say('badType', JSON.stringify(badType));

const summary = {
  url: APP,
  console: consoleLines,
  panel,
  toggled,
  afterDigit,
  protoReload,
  badType,
};
writeFileSync(join(OUT, 'browser-states.json'), JSON.stringify(summary, null, 2));
writeFileSync(join(OUT, 'browser-log.txt'), log.join('\n'));

await browser.close();
say('browser closed');
process.exit(0);
