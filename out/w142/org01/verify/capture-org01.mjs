/**
 * Wave 142 Org01 PR1 verifier capture. Evidence only. Does not touch src/.
 * Chrome CDP 9475, profile out/w142/org01/verify/chrome-profile/.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';


const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5175/';
const OUT = 'C:\\Projects\\WebSim\\out\\w142\\org01\\verify';
const PROFILE = join(OUT, 'chrome-profile');
mkdirSync(PROFILE, { recursive: true });

const log = [];
const asserts = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function check(name, ok, detail) {
  asserts.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) });
  say(ok ? 'PASS' : 'FAIL', name, detail == null ? '' : detail);
}

let browser;
for (let i = 0; i < 12; i++) {
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      dumpio: false,
      userDataDir: PROFILE,
      defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
      args: [
        '--remote-debugging-port=9475',
        '--remote-allow-origins=*',
        '--use-angle=swiftshader',
        '--ignore-gpu-blocklist',
        '--enable-webgl',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--window-size=1600,900',
      ],
    });
    break;
  } catch (err) {
    say('launch-retry', i, err.message);
    await sleep(2000);
  }
}
if (!browser) {
  say('FAIL chrome launch');
  writeFileSync(join(OUT, 'capture-log.txt'), log.join('\n') + '\n');
  process.exit(2);
}
say('chrome-ws', browser.wsEndpoint());

const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });

const consoleLines = [];
page.on('pageerror', (err) => {
  const t = `PAGEERR ${err.message}`;
  consoleLines.push(t);
  say(t);
});
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error' || t === 'warning') {
    const line = `${t.toUpperCase()} ${msg.text()}`;
    consoleLines.push(line);
    say(line);
  }
});

say('goto', APP);
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 120000 });
  say('committed', page.url());
} catch (err) {
  say('goto-err', err.message);
  await page.screenshot({ path: join(OUT, '00-goto-fail.png') }).catch(() => {});
}

try {
  await page.waitForSelector('[data-title-action="new"]', { timeout: 90000 });
  say('title-new-visible');
} catch (err) {
  say('title-wait-err', err.message);
  const dump = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    ready: document.readyState,
    body: (document.body && document.body.innerText || '').slice(0, 400),
    fatal: document.getElementById('fatal')?.textContent || '',
  })).catch((e) => ({ evalErr: e.message }));
  say('page-dump', JSON.stringify(dump));
  await page.screenshot({ path: join(OUT, '00-title-wait-fail.png') }).catch(() => {});
}

await page.waitForFunction(() => !!window.__ctx, { timeout: 30000 }).catch((err) => {
  say('ctx-wait-err', err.message);
});

await sleep(400);
await page.screenshot({ path: join(OUT, '01-title.png') });

const titleState = await page.evaluate(() => {
  const neu = document.querySelector('[data-title-action="new"]');
  const title = document.getElementById('rw-title');
  return {
    hasNew: !!neu,
    newText: neu ? neu.textContent : '',
    titlePresent: !!title,
    originTitle: !!document.querySelector('.rw-origin-title'),
    paused: !!window.__ctx?.flags?.paused,
  };
});
say('titleState', JSON.stringify(titleState));
check('title New Game button', titleState.hasNew, titleState.newText);

await page.evaluate(() => {
  const neu = document.querySelector('[data-title-action="new"]');
  if (!neu) return;
  neu.click();
  if ((neu.textContent || '').includes('CONFIRM')) neu.click();
});

await page.waitForFunction(() => {
  const title = document.getElementById('rw-title');
  const origin = document.querySelector('.rw-origin-title');
  return !!origin && (!title || getComputedStyle(title).display === 'none');
}, { timeout: 60000 }).catch((err) => say('origin-wait-err', err.message));

await sleep(400);
await page.screenshot({ path: join(OUT, '02-overlay.png'), fullPage: true });

const overlay = await page.evaluate(() => {
  const titleEl = document.querySelector('.rw-origin-title');
  const footer = document.querySelector('.rw-origin-footer');
  const list = document.querySelector('.rw-origin-list');
  const rows = [...document.querySelectorAll('.rw-origin-row')].map((r, i) => {
    const choice = r.querySelector('.rw-origin-choice');
    const preview = r.querySelector('.rw-origin-preview');
    const lines = [...r.querySelectorAll('.rw-origin-preview-line')].map((l) => l.textContent);
    const csChoice = choice ? getComputedStyle(choice) : null;
    const csPrev = preview ? getComputedStyle(preview) : null;
    return {
      i,
      choice: choice ? choice.textContent : '',
      lines,
      previewHtml: preview ? preview.innerHTML : '',
      choiceHtml: choice ? choice.innerHTML : '',
      choiceFont: csChoice ? csChoice.fontSize : '',
      previewFont: csPrev ? csPrev.fontSize : '',
    };
  });
  const innerHtmlHits = [];
  for (const r of rows) {
    if (r.choiceHtml.includes('<') && /greenhand|ledger|beautiful|drifter|marked/i.test(r.choiceHtml)) {
      innerHtmlHits.push(r.choiceHtml);
    }
  }
  return {
    title: titleEl ? titleEl.textContent : '',
    footer: footer ? footer.textContent : '',
    rowCount: rows.length,
    rows,
    listOverflow: list ? getComputedStyle(list).overflowY : '',
    paused: !!window.__ctx?.flags?.paused,
    origin: window.__ctx?.world?.origin ?? null,
    originsOpen: typeof window.__ctx?.originsApi?.isOpen === 'function'
      ? window.__ctx.originsApi.isOpen()
      : null,
    weaponGroup: window.__ctx?.input?.weaponGroup ?? null,
  };
});
writeFileSync(join(OUT, 'overlay-dump.json'), JSON.stringify(overlay, null, 2));
say('overlay-title', overlay.title);
say('paused-before', overlay.paused);
check('origin overlay before confirm', /who are you/i.test(overlay.title || ''), overlay.title);
check('five origin rows', overlay.rowCount === 5, overlay.rowCount);
check('paused until pick', overlay.paused === true, overlay.paused);
check('origin not yet written', overlay.origin == null || overlay.origin === '', overlay.origin);

const r1 = overlay.rows[0] || { choice: '', lines: [] };
const r2 = overlay.rows[1] || { choice: '', lines: [] };
const r3 = overlay.rows[2] || { choice: '', lines: [] };
const r4 = overlay.rows[3] || { choice: '', lines: [] };
const r5 = overlay.rows[4] || { choice: '', lines: [] };
const blob1 = `${r1.choice}\n${r1.lines.join('\n')}`;
const blob2 = `${r2.choice}\n${r2.lines.join('\n')}`;
const blob4 = `${r4.choice}\n${r4.lines.join('\n')}`;
const blob5 = `${r5.choice}\n${r5.lines.join('\n')}`;

check('Digit1 label', /\[1\]/.test(r1.choice), r1.choice);
check('Digit2 label', /\[2\]/.test(r2.choice), r2.choice);
check('Digit3 label', /\[3\]/.test(r3.choice), r3.choice);
check('Digit4 label', /\[4\]/.test(r4.choice), r4.choice);
check('Digit5 label', /\[5\]/.test(r5.choice), r5.choice);
check('Digit1 Greenhand name', /Greenhand/i.test(r1.choice), r1.choice);

check('Digit1 hull', /Hull light 100/.test(blob1), blob1);
check('Digit1 money', /Money 350 UU/.test(blob1), blob1);
check('Digit1 standings even', /Standings even/i.test(blob1), blob1);
check('Digit1 start Freehold Drift', /Start Freehold Drift/i.test(blob1), blob1);
check('Digit1 New player', /New player/.test(blob1) && !/living-ship/i.test(blob1), blob1);
check('Digit1 omits fear 0', !/fear 0/.test(blob1), blob1);

check('Digit2 Ledger Debt', /Ledger Debt/i.test(r2.choice), r2.choice);
check('Digit2 money debt', /Money\s+[−\-]\s*1150 UU \(debt\)/.test(blob2) || /Money −1150 UU \(debt\)/.test(blob2), blob2);
check('Digit2 Red Ledger standing', /Red Ledger/.test(blob2), blob2);
check('Digit2 Freehold standing', /Freehold/.test(blob2), blob2);
check('Digit2 Experienced', /Experienced/.test(blob2), blob2);
check('Digit2 in debt', /in debt/i.test(blob2), blob2);

check('Digit4 Beautiful', /Beautiful/i.test(r4.choice), r4.choice);
check('Digit4 living-ship care', /living-ship care/i.test(blob4), blob4);
check('Digit4 Living rock', /Living rock/i.test(blob4), blob4);
check('Digit4 bond', /bond/i.test(blob4), blob4);
check('Digit4 hunger', /hunger/i.test(blob4), blob4);
check('Digit4 not kit mutate', !/mutate/i.test(blob4), blob4);

check('Digit5 Rim Drifter', /Rim Drifter/i.test(r5.choice), r5.choice);
check('Digit5 money 600', /Money 600 UU/.test(blob5), blob5);
check('Digit5 Start The Redmarch', /Start The Redmarch/i.test(blob5), blob5);
check('Digit5 fear 5', /fear 5/.test(blob5), blob5);
check('Digit5 tally-board', /tally-board/i.test(blob5), blob5);
check('Digit5 Experienced', /Experienced/.test(blob5), blob5);

check('compact sublines present', overlay.rows.every((r) => r.lines.length >= 4), overlay.rows.map((r) => r.lines.length).join(','));
check('preview ~10px', overlay.rows.every((r) => r.previewFont === '10px'), overlay.rows.map((r) => r.previewFont).join(','));
check('choice ~12px', overlay.rows.every((r) => r.choiceFont === '12px'), overlay.rows.map((r) => r.choiceFont).join(','));

const wgBefore = overlay.weaponGroup;
say('weaponGroup-before', wgBefore);
await page.evaluate(() => {
  try { window.__ctx.input.weaponGroup = 3; } catch {}
});
const wgArmed = await page.evaluate(() => window.__ctx?.input?.weaponGroup ?? null);
say('weaponGroup-armed', wgArmed);

await page.keyboard.press('Digit1');
await sleep(700);

const afterPick = await page.evaluate(() => {
  return {
    overlay: !!document.querySelector('.rw-origin-title'),
    rowCount: document.querySelectorAll('.rw-origin-row').length,
    paused: !!window.__ctx?.flags?.paused,
    origin: window.__ctx?.world?.origin ?? null,
    originsOpen: typeof window.__ctx?.originsApi?.isOpen === 'function'
      ? window.__ctx.originsApi.isOpen()
      : null,
    weaponGroup: window.__ctx?.input?.weaponGroup ?? null,
  };
});
await page.screenshot({ path: join(OUT, '03-after-digit1.png') });
say('afterPick', JSON.stringify(afterPick));
check('overlay gone after Digit1', afterPick.overlay === false && afterPick.rowCount === 0, JSON.stringify(afterPick));
check('origin is greenhand', afterPick.origin === 'greenhand', afterPick.origin);
check('unpaused after pick', afterPick.paused === false, afterPick.paused);
check('confirm Digit1 did not steal WPN', afterPick.weaponGroup === 3, `armed=3 after=${afterPick.weaponGroup}`);

await page.keyboard.press('Digit1');
await sleep(400);
const wpn = await page.evaluate(() => window.__ctx?.input?.weaponGroup ?? null);
say('weaponGroup-after-second-digit1', wpn);
check('Digit1 becomes WPN after pick', wpn === 1, wpn);

await page.screenshot({ path: join(OUT, '04-wpn-digit1.png') });

const knownFlakes = /WAVE127|WAVE132|REDMARCH|castMatches/i;
const packErrors = consoleLines.filter((l) => !knownFlakes.test(l) && /error|PAGEERR/i.test(l));
check('no new pack console errors', packErrors.length === 0, packErrors.join(' | '));

const failCount = asserts.filter((a) => !a.ok).length;
writeFileSync(join(OUT, 'asserts.json'), JSON.stringify({ failCount, asserts, consoleLines }, null, 2));
writeFileSync(join(OUT, 'capture-log.txt'), log.join('\n') + '\n');
say('DONE failCount', failCount);

try { await browser.close(); } catch {}
process.exit(failCount ? 1 : 0);
