import puppeteer from 'file:///C:/Projects/WebSim/out/hud-research/tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: ['--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars', '--no-first-run'],
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem('rimward-title-skip', '1');
    localStorage.removeItem('rimward-save-v1');
  } catch {}
});
await page.goto('http://localhost:5184/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });
await page.evaluate(() => {
  const neu = document.getElementById('rw-title-new');
  if (neu) {
    neu.click();
    if ((neu.textContent || '').includes('CONFIRM')) neu.click();
  }
});
await page.keyboard.press('Digit1');
await page.waitForFunction(() => window.__ctx?.ship?.object && !window.__ctx.flags.paused, { timeout: 45000 });
await page.evaluate(async () => {
  const waitFrames = (n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { if (++i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const ctx = window.__ctx;
  const pos = ctx.systems[ctx.world.currentSystem].station.position;
  ctx.ship.object.position.fromArray(pos);
  for (let i = 0; i < 90 && !ctx.flags.docked; i++) {
    ctx.input.dockPressed = true;
    await waitFrames(1);
  }
  ctx.input.dockPressed = false;
  ctx.world.reputation.freehold = 12;
});
await page.keyboard.press('Digit2');
await new Promise((r) => setTimeout(r, 600));
const box = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.station-overlay *')];
  const title = nodes.find((n) => (n.textContent || '').includes('File the Freehold Compact brief') && n.children.length === 0);
  if (!title) return null;
  title.scrollIntoView({ block: 'center' });
  const card = title.closest('.job-card') || title.parentElement;
  const r = (card || title).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height, text: title.textContent };
});
console.log('box', JSON.stringify(box));
await page.screenshot({ path: join(OUT, 'jobs-chain-known-full.png'), fullPage: false });
if (box && box.width > 10 && box.height > 10) {
  const clip = {
    x: Math.max(0, Math.floor(box.x) - 8),
    y: Math.max(0, Math.floor(box.y) - 8),
    width: Math.min(1200, Math.ceil(box.width) + 16),
    height: Math.min(600, Math.ceil(box.height) + 16),
  };
  await page.screenshot({ path: join(OUT, 'jobs-chain-card.png'), clip });
}
await browser.close().catch(() => {});
process.exit(0);
