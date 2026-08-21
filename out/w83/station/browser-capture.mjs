/**
 * Wave 83 station live capture. Evidence only. Does not touch src/.
 * Playwright MCP was locked (mcp-chrome-7d372dc). Uses Chrome + puppeteer-core.
 */
import puppeteer from 'file:///C:/Projects/WebSim/out/hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = process.env.WEBSIM_URL || 'http://localhost:5184/';
const OUT = dirname(fileURLToPath(import.meta.url));
mkdirSync(OUT, { recursive: true });

const log = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
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

say('goto', APP);
await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });

await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  }
});
await page.keyboard.press('Digit1');
await wait(2000);

const ready = await page.waitForFunction(() => {
  const ctx = window.__ctx;
  return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
}, { timeout: 45000 }).catch(() => null);

if (!ready) {
  await page.screenshot({ path: join(OUT, 'browser-not-ready.png') });
  writeFileSync(join(OUT, 'browser-notes.txt'), log.concat('NOT READY').join('\n'));
  await browser.close();
  process.exit(1);
}

const docked = await page.evaluate(async () => {
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const ctx = window.__ctx;
  const sys = ctx.world.currentSystem;
  const pos = ctx.systems?.[sys]?.station?.position;
  if (!pos || !ctx.ship?.object) return { ok: false, reason: 'no-station' };
  ctx.ship.object.position.fromArray(pos);
  ctx.flags.paused = false;
  ctx.flags.docked = false;
  for (let i = 0; i < 90 && !ctx.flags.docked; i++) {
    ctx.input.dockPressed = true;
    await waitFrames(1);
  }
  ctx.input.dockPressed = false;
  return {
    ok: !!ctx.flags.docked,
    sys,
    credits: ctx.world.credits,
    overlay: !!document.querySelector('.station-overlay'),
  };
});
say('dock', JSON.stringify(docked));
if (!docked.ok) {
  await page.screenshot({ path: join(OUT, 'dock-fail.png') });
  writeFileSync(join(OUT, 'browser-notes.txt'), log.concat('DOCK FAIL').join('\n'));
  await browser.close();
  process.exit(1);
}

await page.screenshot({ path: join(OUT, 'dock-menu.png') });

await page.evaluate(() => {
  const ctx = window.__ctx;
  if (!ctx.world.reputation || typeof ctx.world.reputation !== 'object') ctx.world.reputation = {};
  ctx.world.reputation.freehold = -6;
  ctx.world.credits = 2000;
});
await page.keyboard.press('Digit9');
await wait(400);
await page.screenshot({ path: join(OUT, 'standing-negative.png') });

const payClicked = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')];
  const pay = buttons.find((b) => b.textContent === 'Pay restitution');
  if (pay) pay.click();
  return !!pay;
});
say('payClick', String(payClicked));
await wait(300);
await page.screenshot({ path: join(OUT, 'restitution-pending.png') });

const pendingSnap = await page.evaluate(() => {
  const text = document.querySelector('.station-overlay')?.innerText || '';
  return {
    hasConfirm: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Confirm restitution'),
    hasPay: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pay restitution'),
    credits: window.__ctx.world.credits,
    standing: window.__ctx.world.reputation.freehold,
    textHasConfirm: text.includes('Confirm restitution'),
  };
});
say('pending', JSON.stringify(pendingSnap));

await page.keyboard.press('Escape');
await wait(300);
const afterEsc = await page.evaluate(() => ({
  credits: window.__ctx.world.credits,
  standing: window.__ctx.world.reputation.freehold,
  hasConfirm: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Confirm restitution'),
  hasPay: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pay restitution'),
}));
say('afterEsc', JSON.stringify(afterEsc));
await page.screenshot({ path: join(OUT, 'restitution-esc.png') });

await page.evaluate(() => {
  const pay = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Pay restitution');
  if (pay) pay.click();
});
await wait(250);
const dbl = await page.evaluate(() => {
  const confirm = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Confirm restitution');
  if (!confirm) return { found: false };
  confirm.click();
  confirm.click();
  return {
    found: true,
    credits: window.__ctx.world.credits,
    standing: window.__ctx.world.reputation.freehold,
    beautiful: window.__ctx.world.reputation.beautiful,
  };
});
say('doubleConfirm', JSON.stringify(dbl));
await wait(300);
await page.screenshot({ path: join(OUT, 'restitution-confirm.png') });

const afterPay = await page.evaluate(() => ({
  credits: window.__ctx.world.credits,
  standing: window.__ctx.world.reputation.freehold,
  hasPay: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pay restitution'),
  hasConfirm: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Confirm restitution'),
}));
say('afterPay', JSON.stringify(afterPay));

await page.evaluate(() => {
  const ctx = window.__ctx;
  ctx.world.credits = 100;
  ctx.world.reputation.freehold = -4;
});
await page.keyboard.press('Escape');
await wait(200);
await page.keyboard.press('Digit9');
await wait(400);
const shortSnap = await page.evaluate(() => {
  const text = document.querySelector('.station-overlay')?.innerText || '';
  return {
    credits: window.__ctx.world.credits,
    standing: window.__ctx.world.reputation.freehold,
    hasPay: [...document.querySelectorAll('button')].some((b) => b.textContent === 'Pay restitution'),
    hasNotEnough: text.includes('Not enough UU'),
  };
});
say('short', JSON.stringify(shortSnap));
await page.screenshot({ path: join(OUT, 'restitution-short.png') });

await page.keyboard.press('Escape');
await wait(200);
await page.evaluate(() => {
  window.__ctx.world.reputation.freehold = 0;
  window.__ctx.world.credits = 2000;
});
await page.keyboard.press('Digit2');
await wait(400);
const stranger = await page.evaluate(() => {
  const text = document.querySelector('.station-overlay')?.innerText || '';
  const jobs = (window.__ctx.world.jobs || []).filter((j) => j.kind === 'chain');
  return {
    hasBrief: text.includes('File the Freehold Compact brief'),
    chainIds: jobs.map((j) => `${j.id}:${j.state}`),
  };
});
say('stranger', JSON.stringify(stranger));
await page.screenshot({ path: join(OUT, 'jobs-stranger.png') });

await page.keyboard.press('Escape');
await wait(200);
await page.evaluate(() => {
  window.__ctx.world.reputation.freehold = 12;
});
await page.keyboard.press('Digit2');
await wait(500);
const known = await page.evaluate(() => {
  const text = document.querySelector('.station-overlay')?.innerText || '';
  const jobs = (window.__ctx.world.jobs || []).filter((j) => j.kind === 'chain');
  return {
    hasBrief: text.includes('File the Freehold Compact brief'),
    chainIds: jobs.map((j) => `${j.id}:${j.state}`),
  };
});
say('known', JSON.stringify(known));
await page.screenshot({ path: join(OUT, 'jobs-chain-known.png') });

writeFileSync(join(OUT, 'browser-notes.txt'), log.join('\n') + '\n');
await browser.close();
say('done');
process.exit(0);
