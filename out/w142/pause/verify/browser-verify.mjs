/**
 * Ctl05 PR1 pause-menu ACCESS live verify. Evidence only. Does not touch src/.
 * Chrome CDP 9476, profile out/w142/pause/verify/chrome-profile/.
 */
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const puppeteer = (await import(pathToFileURL(
  'C:\\Projects\\WebSim\\out\\hud-research\\tools\\node_modules\\puppeteer-core\\lib\\puppeteer\\puppeteer-core.js',
).href)).default;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://127.0.0.1:5176/';
const OUT = 'C:\\Projects\\WebSim\\out\\w142\\pause\\verify';
const PROFILE = join(OUT, 'chrome-profile');
mkdirSync(PROFILE, { recursive: true });

const log = [];
const findings = [];
const say = (...a) => {
  const line = a.map(String).join(' ');
  log.push(line);
  console.log(line);
};
const bug = (id, msg) => {
  findings.push({ kind: 'bug', id, msg });
  say('BUG', id, msg);
};
const note = (id, msg) => {
  findings.push({ kind: 'note', id, msg });
  say('NOTE', id, msg);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  dumpio: true,
  protocolTimeout: 180000,
  userDataDir: PROFILE,
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: [
    '--remote-debugging-port=9476',
    '--remote-allow-origins=*',
    '--use-angle=swiftshader',
    '--use-gl=angle',
    '--enable-unsafe-swiftshader',
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
const pageErrors = [];
const navEvents = [];
page.on('pageerror', (err) => {
  pageErrors.push(err.message);
  say('PAGEERR', err.message);
});
page.on('console', (msg) => {
  const t = msg.type();
  if (t === 'error' || t === 'warning') say(t.toUpperCase(), msg.text());
});
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) {
    navEvents.push({ url: frame.url(), t: Date.now() });
    say('NAV', frame.url());
  }
});

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false }).catch((err) => say('SHOT-ERR', name, err.message));
  say('SHOT', name);
  return path;
}

async function dump(name) {
  return page.evaluate(() => {
    const ctx = window.__ctx;
    const pauseEl = [...document.querySelectorAll('[role="dialog"]')].find(
      (el) => el.getAttribute('aria-label') === 'Paused',
    );
    const settingsDlg = [...document.querySelectorAll('[role="dialog"]')].find(
      (el) => el.getAttribute('aria-label') === 'Settings',
    );
    const settingsRoot = settingsDlg ? settingsDlg.parentElement : null;
    const title = document.getElementById('rw-title');
    const pauseBtns = pauseEl
      ? [...pauseEl.querySelectorAll('button')].map((b) => ({
        action: b.getAttribute('data-pause-action'),
        text: (b.textContent || '').trim(),
        pe: getComputedStyle(b).pointerEvents,
      }))
      : [];
    const loadBtns = [...document.querySelectorAll('.rw-berth-load')].map((b) => ({
      text: (b.textContent || '').trim(),
      disabled: !!b.disabled,
    }));
    const saveBtns = [...document.querySelectorAll('.rw-berth-save')].map((b) => ({
      text: (b.textContent || '').trim(),
      disabled: !!b.disabled,
    }));
    const settingsText = settingsDlg ? (settingsDlg.textContent || '').slice(0, 800) : '';
    const zOf = (el) => (el ? getComputedStyle(el).zIndex : null);
    const disp = (el) => (el ? el.style.display || getComputedStyle(el).display : null);
    return {
      url: location.href,
      paused: !!(ctx && ctx.flags && ctx.flags.paused),
      berthHold: !!(ctx && ctx.flags && ctx.flags.berthHold),
      berthOpen: !!(ctx && ctx.flags && ctx.flags.berthOpen),
      origin: ctx && ctx.world ? ctx.world.origin : null,
      credits: ctx && ctx.world ? ctx.world.credits : null,
      titleSkip: sessionStorage.getItem('rimward-title-skip'),
      titleOn: !!title,
      titleText: title ? (title.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : null,
      pauseDisplay: disp(pauseEl),
      pauseZ: zOf(pauseEl),
      pausePe: pauseEl ? pauseEl.style.pointerEvents : null,
      pausePanelPe: pauseEl && pauseEl.firstElementChild
        ? pauseEl.firstElementChild.style.pointerEvents
        : null,
      pauseBtns,
      pauseText: pauseEl ? (pauseEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400) : null,
      settingsOn: !!(settingsRoot && getComputedStyle(settingsRoot).display !== 'none'),
      settingsZ: zOf(settingsRoot),
      settingsText,
      settingsHasInvert: /invert/i.test(settingsText),
      settingsHasRebind: /rebind|key bind/i.test(settingsText),
      settingsHasSplitVol: /music|effects|voice/i.test(settingsText) && /volume/i.test(settingsText),
      loadBtns,
      saveBtns,
      berthTitle: document.querySelector('[class*="berth"]')
        ? (document.body.innerText || '').includes('BERTH RECORDS')
        : null,
      navType: performance.navigation ? performance.navigation.type : null,
      navEntries: performance.getEntriesByType('navigation').map((n) => ({
        type: n.type,
        start: n.startTime,
      })),
      modelsOpen: !!(ctx && ctx.models && ctx.models.isOpen && ctx.models.isOpen()),
      originsOpen: !!(ctx && ctx.originsApi && ctx.originsApi.isOpen && ctx.originsApi.isOpen()),
      activeTag: document.activeElement ? document.activeElement.tagName : null,
    };
  });
}

try {
  say('goto', APP);
  try {
    await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 120000 });
    say('domcontentloaded', page.url());
  } catch (err) {
    say('goto-err', err.message, page.url());
    await shot('00-goto-fail.png');
  }
  try {
    await page.waitForSelector('[data-title-action="new"]', { timeout: 90000 });
    say('title-new-visible');
  } catch (err) {
    say('title-wait-err', err.message);
    const pageDump = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      ready: document.readyState,
      body: ((document.body && document.body.innerText) || '').slice(0, 400),
      fatal: document.getElementById('fatal')?.textContent || '',
    })).catch((e) => ({ evalErr: e.message }));
    say('page-dump', JSON.stringify(pageDump));
    await shot('00-title-wait-fail.png');
  }
  try {
    await page.waitForFunction(() => !!window.__ctx, { timeout: 60000 });
    say('ctx-ready');
  } catch (err) {
    say('ctx-wait-err', err.message);
    const html = await page.evaluate(() => document.documentElement.innerHTML.slice(0, 400)).catch(() => '');
    say('html-snip', html);
    throw err;
  }
  await sleep(800);

  const boot = await dump('boot');
  say('BOOT', JSON.stringify({
    titleOn: boot.titleOn,
    paused: boot.paused,
    titleText: boot.titleText,
  }));
  await shot('01-boot-title.png');

  const newBtn = await page.$('#rw-title-new');
  if (!newBtn) bug('boot-new', 'NEW GAME button missing');
  else {
    await newBtn.click();
    await sleep(200);
    const after = await page.evaluate(() => {
      const b = document.getElementById('rw-title-new');
      return b ? (b.textContent || '') : '';
    });
    if (/CONFIRM/i.test(after)) {
      say('NEW GAME confirm armed — click again');
      await page.click('#rw-title-new');
      await sleep(1200);
    }
  }
  await sleep(500);
  await shot('02-after-new-game.png');

  const afterNew = await dump('after-new');
  say('AFTER-NEW', JSON.stringify({
    titleOn: afterNew.titleOn,
    originsOpen: afterNew.originsOpen,
    origin: afterNew.origin,
    skip: afterNew.titleSkip,
  }));

  // Digit1 origin pick (greenhand)
  await page.keyboard.press('Digit1');
  await sleep(600);
  const inRun = await dump('in-run');
  say('IN-RUN', JSON.stringify({
    origin: inRun.origin,
    paused: inRun.paused,
    titleOn: inRun.titleOn,
    originsOpen: inRun.originsOpen,
    pauseDisplay: inRun.pauseDisplay,
  }));
  if (!inRun.origin) bug('origin', 'Digit1 did not set origin');
  if (inRun.titleOn) bug('title-still-on', 'Title still open after origin pick');
  if (inRun.paused) note('paused-after-origin', 'paused still true after origin pick; will try CONTINUE/unpause');
  if (inRun.paused && document) {
    // origins should clear pause; if not, fail later cases
  }
  await shot('03-in-run.png');

  if (inRun.paused && !inRun.titleOn) {
    // Do not use skip. If still paused without title, press P to unpause first.
    await page.keyboard.press('KeyP');
    await sleep(200);
  }

  const preP = await dump('pre-p');
  if (preP.paused) {
    // still paused: force helper if title/origin leftover
    await page.evaluate(() => {
      try {
        if (window.__ctx && typeof window.__ctx.setPaused === 'function') {
          window.__ctx.setPaused(false);
        }
      } catch {}
    });
    await sleep(100);
  }

  const liveBeforePause = await dump('live-before-pause');
  say('LIVE-BEFORE-PAUSE', JSON.stringify({
    paused: liveBeforePause.paused,
    origin: liveBeforePause.origin,
    titleOn: liveBeforePause.titleOn,
  }));
  if (liveBeforePause.paused) bug('cannot-unpause', 'Could not enter live unpaused in-run before KeyP');

  // 4. Press P. Screenshot. Named buttons.
  await page.keyboard.press('KeyP');
  await sleep(250);
  const pausedMenu = await dump('paused-menu');
  await shot('04-pause-menu.png');
  say('PAUSE-MENU', JSON.stringify({
    paused: pausedMenu.paused,
    display: pausedMenu.pauseDisplay,
    z: pausedMenu.pauseZ,
    pe: pausedMenu.pausePe,
    btns: pausedMenu.pauseBtns,
    text: pausedMenu.pauseText,
  }));
  if (!pausedMenu.paused) bug('p-toggle', 'KeyP did not set flags.paused true');
  if (pausedMenu.pauseDisplay === 'none') bug('pause-hidden', 'pauseEl display none while paused');
  const labels = (pausedMenu.pauseBtns || []).map((b) => b.text);
  const need = ['RESUME', 'SETTINGS', 'BERTH RECORDS', 'TITLE'];
  for (const n of need) {
    if (!labels.includes(n)) bug('menu-label', 'Missing pause button ' + n + '; got ' + JSON.stringify(labels));
  }
  if (pausedMenu.pauseText === 'PAUSED — P to resume') {
    bug('copy-only', 'Pause still copy-only banner');
  }
  if (String(pausedMenu.pauseZ) !== '50') note('pause-z', 'pause z-index is ' + pausedMenu.pauseZ + ' expected 50');

  // 5. SETTINGS
  const settingsBtn = await page.$('[data-pause-action="settings"]');
  if (!settingsBtn) bug('settings-btn', 'SETTINGS pause button missing');
  else await settingsBtn.click();
  await sleep(300);
  const settingsOpen = await dump('settings-open');
  await shot('05-settings-from-pause.png');
  say('SETTINGS', JSON.stringify({
    paused: settingsOpen.paused,
    settingsOn: settingsOpen.settingsOn,
    z: settingsOpen.settingsZ,
    pe: settingsOpen.pausePe,
    invert: settingsOpen.settingsHasInvert,
    rebind: settingsOpen.settingsHasRebind,
    split: settingsOpen.settingsHasSplitVol,
  }));
  if (!settingsOpen.settingsOn) bug('settings-open', 'SETTINGS click did not open settings panel');
  if (!settingsOpen.paused) bug('settings-unpause', 'SETTINGS unpaused the run');
  if (String(settingsOpen.settingsZ) !== '80') note('settings-z', 'settings z is ' + settingsOpen.settingsZ + ' expected 80');
  if (settingsOpen.pausePe !== 'none') bug('settings-pe', 'pauseEl pointer-events should be none while settings cover; got ' + settingsOpen.pausePe);
  if (settingsOpen.settingsHasInvert) bug('knob-invert', 'Settings shows invert knob');
  if (settingsOpen.settingsHasRebind) bug('knob-rebind', 'Settings shows rebind knob');
  if (settingsOpen.settingsHasSplitVol) bug('knob-split', 'Settings shows split volume knobs');

  // Click dim ring (top-left, outside panel)
  await page.mouse.click(16, 16);
  await sleep(200);
  const afterDim = await dump('dim-click');
  say('DIM-CLICK', JSON.stringify({ paused: afterDim.paused, settingsOn: afterDim.settingsOn, pauseDisplay: afterDim.pauseDisplay }));
  if (!afterDim.paused) bug('click-through', 'Dim-ring click resumed (paused false)');
  if (!afterDim.settingsOn) note('dim-closed-settings', 'Dim click closed settings (unexpected if root pe none)');

  // O or Esc closes settings
  await page.keyboard.press('Escape');
  await sleep(200);
  const afterEsc = await dump('esc-settings');
  say('ESC-SETTINGS', JSON.stringify({ paused: afterEsc.paused, settingsOn: afterEsc.settingsOn }));
  if (afterEsc.settingsOn) {
    await page.keyboard.press('KeyO');
    await sleep(200);
  }
  const settingsClosed = await dump('settings-closed');
  if (settingsClosed.settingsOn) bug('settings-close', 'O/Esc did not close settings');
  if (!settingsClosed.paused) bug('settings-close-unpause', 'Closing settings unpaused');

  // Reopen settings, KeyP while settings (still pause)
  const sBtn2 = await page.$('[data-pause-action="settings"]');
  if (sBtn2) await sBtn2.click();
  await sleep(200);
  const beforeKeyPSettings = await dump('before-keyp-settings');
  await page.keyboard.press('KeyP');
  await sleep(200);
  const keyPSettings = await dump('keyp-settings');
  say('KEYP-WHILE-SETTINGS', JSON.stringify({
    beforePaused: beforeKeyPSettings.paused,
    afterPaused: keyPSettings.paused,
    settingsOn: keyPSettings.settingsOn,
    pauseDisplay: keyPSettings.pauseDisplay,
  }));
  // Contract: KeyP while settings opened from pause is still pause (toggle).
  if (beforeKeyPSettings.paused === true && keyPSettings.paused === true && keyPSettings.settingsOn) {
    bug('keyp-settings-swallowed', 'KeyP did not toggle pause while settings open (settings swallowed KeyP?)');
  } else if (beforeKeyPSettings.paused === true && keyPSettings.paused === false) {
    note('keyp-settings-toggles', 'KeyP while settings (from pause) still toggles pause — matches contract item 20');
  }
  await shot('06-keyp-while-settings.png');

  // Restore paused with settings closed
  if (keyPSettings.settingsOn) {
    await page.keyboard.press('Escape');
    await sleep(150);
  }
  const mid = await dump('mid');
  if (!mid.paused) {
    await page.keyboard.press('KeyP');
    await sleep(200);
  }
  const pausedAgain = await dump('paused-again');
  if (!pausedAgain.paused) bug('re-pause', 'Could not re-enter pause after settings KeyP');

  // 6. BERTH
  const berthBtn = await page.$('[data-pause-action="berth"]');
  if (!berthBtn) bug('berth-btn', 'BERTH RECORDS button missing');
  else await berthBtn.click();
  await sleep(400);
  const berthOpen = await dump('berth-open');
  await shot('07-berth-from-pause.png');
  say('BERTH', JSON.stringify({
    paused: berthOpen.paused,
    berthOpen: berthOpen.berthOpen,
    berthHold: berthOpen.berthHold,
    pe: berthOpen.pausePe,
    load: berthOpen.loadBtns,
    save: berthOpen.saveBtns,
  }));
  if (!berthOpen.berthOpen) bug('berth-open', 'BERTH RECORDS did not open while paused');
  if (!berthOpen.paused) bug('berth-unpause', 'Opening berth from pause set paused false');
  if (berthOpen.berthHold === berthOpen.paused && berthOpen.paused === true) {
    note('berthHold-eq', 'berthHold true while paused (hold may set on open; must not be the same flag)');
  }
  const holdVsPause = await page.evaluate(() => {
    const f = window.__ctx && window.__ctx.flags;
    return {
      sameRef: false,
      paused: !!(f && f.paused),
      berthHold: !!(f && f.berthHold),
      keys: f ? Object.keys(f).filter((k) => /pause|berth/i.test(k)) : [],
    };
  });
  say('HOLD-VS-PAUSE', JSON.stringify(holdVsPause));
  if (holdVsPause.paused === holdVsPause.berthHold) {
    // they can both be true at once; check they are distinct properties
    const distinct = await page.evaluate(() => {
      const f = window.__ctx.flags;
      f.berthHold = !f.berthHold;
      const pausedStill = f.paused === true;
      f.berthHold = !f.berthHold;
      return pausedStill;
    });
    if (!distinct) bug('berthHold-aliased', 'berthHold appears aliased to paused');
    else note('berthHold-distinct', 'berthHold is a distinct flag (toggling hold left paused true)');
  }

  // SAVE slot 1
  const saveHandle = await page.$('.rw-berth-save');
  if (!saveHandle) bug('save-btn', 'SAVE button missing on berth');
  else {
    await saveHandle.click();
    await sleep(400);
  }
  const afterSave = await dump('after-save');
  const slotRaw = await page.evaluate(() => localStorage.getItem('rimward-save-v1-slot-1'));
  say('SAVE', JSON.stringify({
    paused: afterSave.paused,
    load: afterSave.loadBtns,
    slotLen: slotRaw ? slotRaw.length : 0,
  }));
  if (!slotRaw) bug('save-write', 'SAVE while paused did not write slot 1');
  const loadNamed = (afterSave.loadBtns || []).some((b) => /resume first/i.test(b.text) && b.disabled);
  const anyLoadEnabled = (afterSave.loadBtns || []).some((b) => !b.disabled && /^LOAD$/i.test(b.text.trim()));
  if (slotRaw && !loadNamed) bug('load-label', 'LOAD not named-disabled; got ' + JSON.stringify(afterSave.loadBtns));
  if (anyLoadEnabled) bug('load-enabled', 'A LOAD button is enabled while paused');

  const creditsBeforeMut = await page.evaluate(() => window.__ctx.world.credits);
  await page.evaluate(() => { window.__ctx.world.credits = 424242; });
  const loadBtn = await page.$('.rw-berth-load');
  if (loadBtn) {
    await loadBtn.click({ force: true }).catch(async () => {
      await page.evaluate(() => {
        const b = document.querySelector('.rw-berth-load');
        if (b) b.click();
      });
    });
    await sleep(300);
  }
  const afterLoadClick = await page.evaluate(() => ({
    credits: window.__ctx.world.credits,
    paused: window.__ctx.flags.paused,
    load: [...document.querySelectorAll('.rw-berth-load')].map((b) => ({
      text: b.textContent, disabled: b.disabled,
    })),
  }));
  say('LOAD-CLICK', JSON.stringify(afterLoadClick));
  if (afterLoadClick.credits !== 424242) {
    bug('load-while-paused', 'LOAD restored while paused; credits ' + afterLoadClick.credits + ' (mutated 424242, pre-save ' + creditsBeforeMut + ')');
  }
  await shot('08-berth-load-disabled.png');

  // Close berth; pause menu remains
  await page.keyboard.press('Escape');
  await sleep(250);
  const afterBerthClose = await dump('berth-closed');
  say('BERTH-CLOSE', JSON.stringify({
    berthOpen: afterBerthClose.berthOpen,
    paused: afterBerthClose.paused,
    pauseDisplay: afterBerthClose.pauseDisplay,
    pausePe: afterBerthClose.pausePe,
    btns: afterBerthClose.pauseBtns,
  }));
  if (afterBerthClose.berthOpen) {
    await page.keyboard.press('KeyL');
    await sleep(200);
  }
  const berthGone = await dump('berth-gone');
  if (berthGone.berthOpen) bug('berth-close', 'Berth did not close');
  if (!berthGone.paused) bug('berth-close-unpause', 'Closing berth unpaused');
  if (berthGone.pauseDisplay === 'none') bug('pause-gone-after-berth', 'Pause menu hidden after berth close');
  await shot('09-pause-after-berth-close.png');

  // 7. TITLE remount
  const navBefore = navEvents.length;
  const skipBefore = await page.evaluate(() => sessionStorage.getItem('rimward-title-skip'));
  const titleBtn = await page.$('[data-pause-action="title"]');
  if (!titleBtn) bug('title-btn', 'TITLE pause button missing');
  else await titleBtn.click();
  await sleep(500);
  const titleOpen = await dump('title-open');
  await shot('10-title-from-pause.png');
  say('TITLE', JSON.stringify({
    titleOn: titleOpen.titleOn,
    paused: titleOpen.paused,
    skip: titleOpen.titleSkip,
    pauseDisplay: titleOpen.pauseDisplay,
    navDelta: navEvents.length - navBefore,
    url: titleOpen.url,
    titleText: titleOpen.titleText,
  }));
  if (!titleOpen.titleOn) bug('title-remount', 'TITLE did not remount #rw-title');
  if (titleOpen.titleSkip === '1') bug('title-skip', 'TITLE path set rimward-title-skip');
  if (navEvents.length !== navBefore) bug('title-reload', 'Document navigation on TITLE click: ' + JSON.stringify(navEvents.slice(navBefore)));
  if (titleOpen.pauseDisplay !== 'none') bug('pause-over-title', 'pauseEl still shown while title owns');
  if (!titleOpen.paused) bug('title-unpause', 'TITLE remount set paused false');
  if (skipBefore === '1') note('skip-already', 'skip was already set before TITLE click');

  // CONTINUE
  const cont = await page.$('#rw-title-continue');
  if (!cont) bug('continue-missing', 'CONTINUE missing on remounted title');
  else await cont.click();
  await sleep(400);
  const afterCont = await dump('after-continue');
  await shot('11-after-continue.png');
  say('CONTINUE', JSON.stringify({
    titleOn: afterCont.titleOn,
    paused: afterCont.paused,
    pauseDisplay: afterCont.pauseDisplay,
    skip: afterCont.titleSkip,
  }));
  if (afterCont.titleOn) bug('continue-title', 'CONTINUE left title open');
  if (afterCont.paused) bug('continue-paused', 'CONTINUE left flags.paused true');
  if (afterCont.pauseDisplay && afterCont.pauseDisplay !== 'none') {
    bug('continue-banner', 'CONTINUE left pause banner visible: ' + afterCont.pauseDisplay);
  }

  // 8. Guards: INPUT focused, KeyP must not toggle
  const guard = await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'rw-verify-p-guard';
    input.style.cssText = 'position:fixed;left:8px;top:8px;z-index:90;';
    document.body.appendChild(input);
    input.focus();
    return document.activeElement && document.activeElement.id === 'rw-verify-p-guard';
  });
  if (!guard) note('input-focus', 'Could not focus synthetic INPUT');
  const pausedBeforeType = await page.evaluate(() => !!(window.__ctx.flags && window.__ctx.flags.paused));
  await page.keyboard.press('KeyP');
  await sleep(200);
  const pausedAfterType = await page.evaluate(() => !!(window.__ctx.flags && window.__ctx.flags.paused));
  say('TYPING-GUARD', JSON.stringify({ guard, pausedBeforeType, pausedAfterType }));
  if (pausedBeforeType !== pausedAfterType) bug('typing-guard', 'KeyP toggled pause while INPUT focused');
  await page.evaluate(() => {
    const el = document.getElementById('rw-verify-p-guard');
    if (el) el.remove();
  });

  // models filter if easy
  const modelsTried = await page.evaluate(() => {
    try {
      window.__ctx.models?.open?.();
      return !!(window.__ctx.models && window.__ctx.models.isOpen && window.__ctx.models.isOpen());
    } catch (e) {
      return false;
    }
  });
  await sleep(300);
  let modelsFilter = { tried: modelsTried };
  if (modelsTried) {
    modelsFilter = await page.evaluate(() => {
      const inp = document.querySelector('#rw-models input, .rw-models input, input[placeholder], input[type="search"], input[type="text"]');
      if (inp) inp.focus();
      return {
        tried: true,
        open: !!(window.__ctx.models && window.__ctx.models.isOpen && window.__ctx.models.isOpen()),
        paused: !!(window.__ctx.flags && window.__ctx.flags.paused),
        tag: document.activeElement ? document.activeElement.tagName : null,
      };
    });
    const before = modelsFilter.paused;
    await page.keyboard.press('KeyP');
    await sleep(200);
    const after = await page.evaluate(() => !!(window.__ctx.flags && window.__ctx.flags.paused));
    modelsFilter.afterP = after;
    say('MODELS-GUARD', JSON.stringify(modelsFilter));
    if (modelsFilter.open && before !== after) bug('models-guard', 'KeyP toggled pause while models open');
    await page.evaluate(() => { try { window.__ctx.models?.close?.(); } catch {} });
    await sleep(150);
    // models close may restore prior paused; ensure unpaused for cleanliness
    await page.evaluate(() => {
      try { if (window.__ctx.setPaused) window.__ctx.setPaused(false); } catch {}
    });
  } else {
    say('MODELS-GUARD skip', JSON.stringify(modelsFilter));
  }

  // overlay-policy never writes paused (static cite from page? skip — grepped in host)
  const overlaySrc = await page.evaluate(async () => {
    try {
      const r = await fetch('/src/systems/overlay-policy.js');
      const t = await r.text();
      return {
        assignPaused: (t.match(/flags\.paused\s*=/g) || []).length,
        neverWrite: t.includes('Never writes ctx.flags.paused'),
      };
    } catch (e) {
      return { err: String(e) };
    }
  });
  say('OVERLAY-POLICY', JSON.stringify(overlaySrc));
  if (overlaySrc.assignPaused > 0) bug('overlay-write', 'overlay-policy.js assigns flags.paused');

  const settingsFields = await page.evaluate(async () => {
    try {
      const r = await fetch('/src/systems/settings.js');
      const t = await r.text();
      return {
        invert: /invert/i.test(t),
        rebind: /rebind/i.test(t),
        split: /music\/effects|effects volume|voice volume/i.test(t),
      };
    } catch (e) {
      return { err: String(e) };
    }
  });
  say('SETTINGS-SRC', JSON.stringify(settingsFields));

  const final = await dump('final');
  say('FINAL', JSON.stringify(final));
  say('PAGE-ERRORS', JSON.stringify(pageErrors));
  say('NAV-EVENTS', JSON.stringify(navEvents));
  say('FINDINGS', JSON.stringify(findings, null, 2));
} catch (err) {
  say('FATAL', err && err.stack ? err.stack : String(err));
  findings.push({ kind: 'env', id: 'fatal', msg: String(err && err.message ? err.message : err) });
  await shot('00-fatal.png').catch(() => {});
} finally {
  writeFileSync(join(OUT, 'browser-log.json'), JSON.stringify({ log, findings, pageErrors, navEvents }, null, 2));
  writeFileSync(join(OUT, 'browser-log.txt'), log.join('\n') + '\n');
  try { await browser.close(); } catch {}
}

const bugs = findings.filter((f) => f.kind === 'bug');
if (bugs.length) process.exitCode = 2;
