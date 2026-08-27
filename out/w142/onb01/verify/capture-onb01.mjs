/**
 * Wave 142 Onb01 PR1 verifier capture. Evidence only. Does not touch src/.
 * Chrome CDP 9474, profile out/w142/onb01/verify/chrome-profile/.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5174/';
const OUT = 'C:\\Projects\\WebSim\\out\\w142\\onb01\\verify';
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

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false }).catch((err) => say('SHOT-ERR', name, err.message));
  say('SHOT', name);
  return path;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  dumpio: false,
  userDataDir: PROFILE,
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--remote-debugging-port=9474',
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
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 });
  say('committed', page.url());
} catch (err) {
  say('goto-err', err.message);
  await shot(page, '00-goto-fail.png');
}

try {
  await page.waitForSelector('[data-title-action="new"]', { timeout: 90000 });
  say('title-new-visible');
} catch (err) {
  say('title-wait-err', err.message);
  await shot(page, '00-title-wait-fail.png');
}

await page.waitForFunction(() => !!window.__ctx, { timeout: 30000 }).catch((err) => {
  say('ctx-wait-err', err.message);
});

await page.evaluate(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
  try { sessionStorage.removeItem('rimward-title-skip'); } catch { /* ignore */ }
});
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch((err) => say('reload-err', err.message));
try {
  await page.waitForSelector('[data-title-action="new"]', { timeout: 90000 });
  say('title-new-visible-after-clear');
} catch (err) {
  say('title-wait-after-clear-err', err.message);
}

await sleep(500);
await shot(page, '01-title.png');

await page.evaluate(() => {
  const neu = document.querySelector('[data-title-action="new"]');
  if (!neu) return;
  neu.click();
  if ((neu.textContent || '').includes('CONFIRM')) neu.click();
});

await page.waitForFunction(() => {
  const title = document.getElementById('rw-title');
  const origin = document.querySelector('.rw-origin-title');
  return (!title || getComputedStyle(title).display === 'none') && !!origin;
}, { timeout: 25000 }).catch((err) => say('origin-wait-err', err.message));

await sleep(400);
await shot(page, '02-origin-overlay.png');

const overlay = await page.evaluate(() => ({
  title: document.querySelector('.rw-origin-title')?.textContent || '',
  origin: window.__ctx?.world?.origin ?? null,
  paused: !!window.__ctx?.flags?.paused,
}));
say('overlay', JSON.stringify(overlay));
check('origin overlay open', /who are you/i.test(overlay.title || ''), overlay.title);

await page.keyboard.press('Digit1');

await page.waitForFunction(() => {
  const ctx = window.__ctx;
  const origin = ctx && ctx.world && ctx.world.origin;
  const overlayGone = !document.querySelector('.rw-origin-title');
  return origin === 'greenhand' && overlayGone && ctx.flags && ctx.flags.paused === false;
}, { timeout: 20000 }).catch((err) => say('origin-pick-wait-err', err.message));

await page.waitForFunction(() => {
  const el = document.querySelector('.rw-onboard-hint');
  return !!(el && getComputedStyle(el).display !== 'none' && (el.textContent || '').includes('look and turn'));
}, { timeout: 15000 }).catch((err) => say('look-hint-wait-err', err.message));

await sleep(400);
await shot(page, '03-hint-look-controls-collapsed.png');

async function dumpHud(tag) {
  const dump = await page.evaluate(() => {
    const hints = [...document.querySelectorAll('.rw-onboard-hint')];
    const hint = hints[0] || null;
    const reticle = document.querySelector('.rw-reticle');
    const toggle = document.querySelector('.rw-controls-toggle');
    const controls = document.querySelector('.rw-controls');
    const body = document.querySelector('.rw-controls-body');
    const lis = body ? [...body.querySelectorAll('li')].map((li) => (li.textContent || '').trim()) : [];
    const bodyCs = body ? getComputedStyle(body) : null;
    const hintCs = hint ? getComputedStyle(hint) : null;
    const ctx = window.__ctx;
    return {
      origin: ctx && ctx.world ? ctx.world.origin : null,
      seen: ctx && ctx.world && ctx.world.onboarding ? ctx.world.onboarding.seen : null,
      paused: !!(ctx && ctx.flags && ctx.flags.paused),
      hintCount: hints.length,
      hintText: hint ? (hint.textContent || '') : '',
      hintDisplay: hint ? hint.style.display || hintCs.display : null,
      hintRole: hint ? hint.getAttribute('role') : null,
      hintLive: hint ? hint.getAttribute('aria-live') : null,
      hintAtomic: hint ? hint.getAttribute('aria-atomic') : null,
      hintPointer: hintCs ? hintCs.pointerEvents : null,
      hintParentId: hint && hint.parentElement ? hint.parentElement.id : null,
      hintInReticle: !!(reticle && hint && reticle.contains(hint)),
      reticleSize: reticle ? {
        w: reticle.getBoundingClientRect().width,
        h: reticle.getBoundingClientRect().height,
      } : null,
      toggleText: toggle ? (toggle.textContent || '').trim() : null,
      ariaExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
      controlsCollapsedClass: controls ? controls.classList.contains('collapsed') : null,
      bodyDisplay: bodyCs ? bodyCs.display : null,
      lineCount: lis.length,
      lines: lis,
      hintIdsMove: Array.isArray(ctx?.world?.onboarding?.seen)
        ? ctx.world.onboarding.seen.includes('move')
        : null,
    };
  });
  say('DUMP', tag, JSON.stringify({
    origin: dump.origin,
    seen: dump.seen,
    hintCount: dump.hintCount,
    hintText: dump.hintText,
    toggleText: dump.toggleText,
    ariaExpanded: dump.ariaExpanded,
    bodyDisplay: dump.bodyDisplay,
    lineCount: dump.lineCount,
  }));
  return dump;
}

const look = await dumpHud('look');
check('origin greenhand after Digit1', look.origin === 'greenhand', look.origin);
check('CONTROLS starts collapsed class', look.controlsCollapsedClass === true, look.controlsCollapsedClass);
check('CONTROLS body hidden', look.bodyDisplay === 'none', look.bodyDisplay);
check('toggle text CONTROLS ▸', look.toggleText === 'CONTROLS ▸', look.toggleText);
check('aria-expanded false', look.ariaExpanded === 'false', look.ariaExpanded);
check('first hint look/turn', look.hintText === 'Mouse — look and turn toward the reticle', look.hintText);
check('no 19-line dump while collapsed', look.lineCount === 0 || look.bodyDisplay === 'none', `${look.lineCount} ${look.bodyDisplay}`);
check('one hint node', look.hintCount === 1, look.hintCount);
check('hint role=status', look.hintRole === 'status', look.hintRole);
check('hint aria-live=polite', look.hintLive === 'polite', look.hintLive);
check('hint aria-atomic=true', look.hintAtomic === 'true', look.hintAtomic);
check('hint not inside reticle', look.hintInReticle === false, look.hintInReticle);
check('hint parent is hud not reticle', look.hintParentId !== 'reticle' && look.hintParentId !== '', look.hintParentId);
check('seen has look not move', Array.isArray(look.seen) && look.seen.includes('look') && !look.seen.includes('move'), JSON.stringify(look.seen));
check('pause unused (not paused after pick)', look.paused === false, look.paused);
check('hint pointer-events none', look.hintPointer === 'none', look.hintPointer);

const LESSON = [
  { id: 'look', frag: 'look and turn', shot: '03-hint-look-controls-collapsed.png' },
  { id: 'throttle', frag: 'R/F — throttle', shot: '04-hint-throttle.png' },
  { id: 'target', frag: 'T — cycle target', shot: '05-hint-target.png' },
  { id: 'hail', frag: 'H — hail the lock', shot: '06-hint-hail.png' },
  { id: 'dock', frag: 'J — dock when the station', shot: '07-hint-dock.png' },
  { id: 'chart', frag: 'M — galaxy chart', shot: '08-hint-chart.png' },
];

const sequence = [{ id: 'look', text: look.hintText, seen: look.seen && look.seen.slice() }];

for (let i = 1; i < LESSON.length; i++) {
  await page.keyboard.press('KeyZ');
  const want = LESSON[i];
  try {
    await page.waitForFunction((frag) => {
      const el = document.querySelector('.rw-onboard-hint');
      return !!(el && getComputedStyle(el).display !== 'none' && (el.textContent || '').includes(frag));
    }, { timeout: 8000 }, want.frag);
  } catch (err) {
    say('hint-wait-err', want.id, err.message);
  }
  await sleep(250);
  await shot(page, want.shot);
  const d = await dumpHud(want.id);
  sequence.push({ id: want.id, text: d.hintText, seen: d.seen && d.seen.slice() });
  check(`hint ${want.id} one at a time`, (d.hintText || '').includes(want.frag), d.hintText);
  check(`hint ${want.id} still one node`, d.hintCount === 1, d.hintCount);
  check(`hint ${want.id} CONTROLS still collapsed`, d.toggleText === 'CONTROLS ▸' && d.ariaExpanded === 'false', `${d.toggleText} ${d.ariaExpanded}`);
}

check('sequence order look-throttle-target-hail-dock-chart',
  sequence.map((s) => s.id).join(',') === 'look,throttle,target,hail,dock,chart',
  sequence.map((s) => s.id).join(','));

await page.click('.rw-controls-toggle');
await sleep(200);
const expanded = await dumpHud('expanded');
await shot(page, '09-controls-expanded.png');
check('CONTROLS expanded label', expanded.toggleText === 'CONTROLS ▾', expanded.toggleText);
check('aria-expanded true', expanded.ariaExpanded === 'true', expanded.ariaExpanded);
check('19 control lines', expanded.lineCount === 19, expanded.lineCount);
check('body visible when expanded', expanded.bodyDisplay !== 'none', expanded.bodyDisplay);

const blob = (expanded.lines || []).join('\n');
check('KeyH hail in encyclopedia', /H — hail/.test(blob), blob.slice(0, 400));
check('KeyJ dock in encyclopedia', /J — dock/.test(blob), '');
check('KeyL berth in encyclopedia', /L — berth records/.test(blob), '');
check('KeyM chart in encyclopedia', /M — galaxy chart/.test(blob), '');
check('KeyP pause in encyclopedia', /P — pause/.test(blob), '');
check('KeyD strafe in encyclopedia', /A\/D — lateral strafe \(D = right\)/.test(blob), '');

await page.click('.rw-controls-toggle');
await sleep(200);
const recollapsed = await dumpHud('recollapsed');
await shot(page, '10-controls-collapsed-again.png');
check('CONTROLS hide again', recollapsed.toggleText === 'CONTROLS ▸' && recollapsed.ariaExpanded === 'false' && recollapsed.bodyDisplay === 'none',
  `${recollapsed.toggleText} ${recollapsed.ariaExpanded} ${recollapsed.bodyDisplay}`);

const keyBindings = await page.evaluate(() => {
  const src = {
    hail: 'KeyH pendingHail',
    dock: 'KeyJ pendingDock',
    strafe: 'KeyD strafeX',
  };
  return {
    encyclopedia: true,
    flagsPausedWritesFromOnboarding: false,
    src,
  };
});
say('keyBindings-spot', JSON.stringify(keyBindings));

writeFileSync(join(OUT, 'asserts.json'), JSON.stringify({ asserts, sequence, look, expanded, recollapsed, consoleLines }, null, 2));
writeFileSync(join(OUT, 'browser-log.txt'), log.concat(consoleLines).join('\n'));

const failed = asserts.filter((a) => !a.ok);
say('SUMMARY', `pass=${asserts.length - failed.length} fail=${failed.length} total=${asserts.length}`);

await browser.close().catch(() => {});
process.exit(failed.length ? 1 : 0);
