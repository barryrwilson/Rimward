async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/yard-preview/verify-iter2';

  const log = [];
  const say = (...a) => {
    const line = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
    log.push(line);
  };
  const errors = [];
  const warnings = [];
  page.on('pageerror', (err) => {
    errors.push('PAGEERR ' + err.message);
    say('PAGEERR', err.message);
  });
  page.on('console', (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (t === 'error') {
      errors.push('ERROR ' + text);
      say('ERROR', text);
    } else if (t === 'warning') {
      warnings.push(text);
      say('WARN', text);
    }
  });

  const shot = async (name) => {
    await page.screenshot({ path: OUT + '/' + name, type: 'png' });
    say('SHOT', name);
  };

  const occupancyFn = () => {
    const BG = [7, 12, 20];
    const THRESH = 18;
    function measure(canvas) {
      if (!canvas) return null;
      const w = canvas.width;
      const h = canvas.height;
      let img;
      try {
        img = canvas.getContext('2d').getImageData(0, 0, w, h).data;
      } catch (e) {
        return { err: String(e), w, h };
      }
      let occ = 0;
      let minX = w, minY = h, maxX = -1, maxY = -1;
      let r = 0, g = 0, b = 0, n = 0;
      let minL = 255, maxL = 0;
      let greyish = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const dr = Math.abs(img[i] - BG[0]);
          const dg = Math.abs(img[i + 1] - BG[1]);
          const db = Math.abs(img[i + 2] - BG[2]);
          const L = (img[i] + img[i + 1] + img[i + 2]) / 3;
          if (L < minL) minL = L;
          if (L > maxL) maxL = L;
          r += img[i]; g += img[i + 1]; b += img[i + 2]; n++;
          if (Math.abs(img[i] - 106) < 40 && Math.abs(img[i + 1] - 115) < 40 && Math.abs(img[i + 2] - 128) < 40) {
            greyish++;
          }
          if (dr > THRESH || dg > THRESH || db > THRESH) {
            occ++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      const bboxW = maxX >= 0 ? maxX - minX + 1 : 0;
      const bboxH = maxY >= 0 ? maxY - minY + 1 : 0;
      return {
        w, h, occ,
        occFrac: +(occ / (w * h)).toFixed(4),
        bbox: maxX >= 0 ? { minX, minY, maxX, maxY, w: bboxW, h: bboxH, area: bboxW * bboxH } : null,
        bboxFrac: maxX >= 0 ? +((bboxW * bboxH) / (w * h)).toFixed(4) : 0,
        avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
        contrast: Math.round(maxL - minL),
        greyFrac: +(greyish / n).toFixed(3),
      };
    }
    function down(c) {
      const tw = 16, th = 10;
      const tmp = document.createElement('canvas');
      tmp.width = tw; tmp.height = th;
      const t = tmp.getContext('2d');
      t.drawImage(c, 0, 0, tw, th);
      return t.getImageData(0, 0, tw, th).data;
    }
    function rmse(a, b) {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        s += d * d;
      }
      return Math.sqrt(s / a.length);
    }
    const rows = [...document.querySelectorAll('.shipyard-buy-row')].map((row) => {
      const canvas = row.querySelector('.shipyard-preview-canvas');
      const name = (row.querySelector('.shipyard-buy-name')?.textContent || '').trim();
      const confirm = row.classList.contains('shipyard-confirm') || !!row.closest?.('.shipyard-confirm');
      return {
        name,
        confirm,
        hasPreview: !!row.querySelector('.shipyard-preview'),
        hasCanvas: !!canvas,
        css: canvas ? { w: canvas.clientWidth, h: canvas.clientHeight } : null,
        occ: measure(canvas),
      };
    });
    const canvases = [...document.querySelectorAll('.shipyard-buy-row .shipyard-preview-canvas')];
    const names = rows.map((r) => r.name);
    const downs = canvases.map(down);
    const pairs = [];
    for (let i = 0; i < downs.length; i++) {
      for (let j = i + 1; j < downs.length; j++) {
        pairs.push({ a: names[i], b: names[j], rmse: +rmse(downs[i], downs[j]).toFixed(3) });
      }
    }
    const confirm = document.querySelector('.shipyard-confirm');
    const confirmCanvas = confirm?.querySelector('.shipyard-preview-canvas');
    return {
      overlayHead: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 700),
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      previewHosts: document.querySelectorAll('.shipyard-preview').length,
      previewCanvases: document.querySelectorAll('.shipyard-preview-canvas').length,
      rows,
      pairs,
      confirm: confirm ? {
        name: (confirm.querySelector('.shipyard-buy-name')?.textContent || '').trim(),
        meta: confirm.querySelector('.shipyard-buy-meta')?.textContent || '',
        hasCanvas: !!confirmCanvas,
        css: confirmCanvas ? { w: confirmCanvas.clientWidth, h: confirmCanvas.clientHeight } : null,
        occ: measure(confirmCanvas),
      } : null,
    };
  };

  const saveCrops = async (prefix, extraSelector) => {
    const written = [];
    const locators = page.locator('.shipyard-buy-row .shipyard-preview-canvas');
    const n = await locators.count();
    const meta = await page.evaluate(() =>
      [...document.querySelectorAll('.shipyard-buy-row')].map((row) => ({
        name: (row.querySelector('.shipyard-buy-name')?.textContent || 'row').trim(),
        confirm: !!(row.closest('.shipyard-confirm') || row.classList.contains('shipyard-confirm')),
      })),
    );
    for (let i = 0; i < n; i++) {
      const row = meta[i] || { name: 'row' + i };
      const safe = String(row.name).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
        + (row.confirm ? '-confirm' : '');
      const file = `${prefix}-${safe}.png`;
      await locators.nth(i).screenshot({ path: OUT + '/' + file, type: 'png' });
      written.push(file);
    }
    if (extraSelector) {
      const extra = page.locator(extraSelector);
      if (await extra.count()) {
        const file = `${prefix}-confirm-well.png`;
        await extra.first().screenshot({ path: OUT + '/' + file, type: 'png' });
        written.push(file);
      }
    }
    return written;
  };

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('rimward-title-skip', '1');
      localStorage.removeItem('rimward-save-v1');
    } catch {}
  });
  await page.goto('http://127.0.0.1:5177/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });

  await page.evaluate(() => {
    const neu = document.getElementById('rw-title-new');
    if (neu) {
      neu.click();
      if ((neu.textContent || '').includes('CONFIRM')) neu.click();
    }
  });
  await page.waitForTimeout(400);

  const originVisible = await page.evaluate(
    () => !!document.body && /who are you/i.test(document.body.innerText || ''),
  );
  say('originVisible', originVisible);
  if (originVisible) {
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(500);
  }

  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
  }, { timeout: 30000 });

  const boot = await page.evaluate(() => ({
    system: window.__ctx.world.currentSystem,
    faction: window.__ctx.systems[window.__ctx.world.currentSystem]?.faction,
    classKey: window.__ctx.player.classKey,
    hullKind: window.__ctx.player.hullKind,
  }));
  say('boot', boot);

  await page.evaluate(() => {
    const ctx = window.__ctx;
    if (ctx.world.currentSystem !== 'bt_cradle') {
      ctx.emit('jumpRequested', { to: 'bt_cradle' });
    }
  });
  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return ctx.world.currentSystem === 'bt_cradle' && !ctx.gate?.jumping;
  }, { timeout: 20000 });

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const def = ctx.systems.bt_cradle;
    const p = def.station.position;
    ctx.world.credits = 100000;
    ctx.world.reputation = ctx.world.reputation || {};
    ctx.world.reputation.beautiful = 0;
    ctx.flags.combat = false;
    ctx.flags.camera = 'chase';
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(p[0], p[1], p[2]);
    ctx.input.dockPressed = true;
  });
  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 12000 });
  await shot('01-dock-cradle.png');

  await page.keyboard.press('Digit0');
  await page.waitForTimeout(400);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(700);
  await shot('02-yard-living.png');

  const livingDump = await page.evaluate(occupancyFn);
  say('yardLiving', {
    previewHosts: livingDump.previewHosts,
    previewCanvases: livingDump.previewCanvases,
    rows: livingDump.rows,
    pairs: livingDump.pairs,
    buttons: livingDump.buttons,
  });
  const livingCrops = await saveCrops('crop-living');
  say('livingCrops', livingCrops);

  const findRow = (dump, key) => dump.rows.find((r) => r.name.toLowerCase() === key);
  const livingLight = findRow(livingDump, 'light');
  const livingCutter = findRow(livingDump, 'cutter');
  const livingHeavy = findRow(livingDump, 'heavy');
  const lightOcc = livingLight?.occ?.occFrac || 0;
  const cutterOcc = livingCutter?.occ?.occFrac || 0;
  const heavyOcc = livingHeavy?.occ?.occFrac || 0;
  const lightBox = livingLight?.occ?.bbox;
  const cutterBox = livingCutter?.occ?.bbox;
  const heavyBox = livingHeavy?.occ?.bbox;
  const occRatioHL = lightOcc > 0 ? +(heavyOcc / lightOcc).toFixed(3) : 0;
  const bboxAreaRatioHL = (lightBox?.area > 0) ? +((heavyBox?.area || 0) / lightBox.area).toFixed(3) : 0;
  const cutterLonger =
    (cutterBox?.w || 0) > (lightBox?.w || 0) * 1.08
    || (cutterBox?.h || 0) > (lightBox?.h || 0) * 1.08;
  const livingPairwise = livingDump.pairs;
  const rmseLH = livingPairwise.find((p) =>
    (p.a === 'light' && p.b === 'heavy') || (p.a === 'heavy' && p.b === 'light'),
  )?.rmse ?? 0;

  const allHaveCanvas = livingDump.previewHosts >= 3 && livingDump.previewCanvases >= 3
    && livingDump.rows.length >= 3 && livingDump.rows.every((r) => r.hasPreview && r.hasCanvas);
  const heavyClearlyLarger = occRatioHL >= 1.45 && bboxAreaRatioHL >= 1.45;
  const sameSizeBug = occRatioHL > 0 && occRatioHL < 1.25 && bboxAreaRatioHL < 1.25;

  await page.keyboard.press('Digit5');
  await page.waitForTimeout(500);
  await shot('03-confirm-heavy.png');
  const confirmDump = await page.evaluate(occupancyFn);
  say('confirmHeavy', confirmDump.confirm);
  const confirmCrops = await saveCrops('crop-confirm', '.shipyard-confirm .shipyard-preview-canvas');
  say('confirmCrops', confirmCrops);
  const confirmIsHeavy = /heavy/i.test(confirmDump.confirm?.name || '') && !!confirmDump.confirm?.hasCanvas;
  const confirmOcc = confirmDump.confirm?.occ?.occFrac || 0;
  const confirmBox = confirmDump.confirm?.occ?.bbox;
  const confirmVsLight = lightOcc > 0 ? +(confirmOcc / lightOcc).toFixed(3) : 0;
  const confirmLooksZoomedLight = confirmOcc > 0 && Math.abs(confirmOcc - lightOcc) < 0.04 && occRatioHL < 1.25;

  const motion = await page.evaluate(async () => {
    const ctx = window.__ctx;
    const prev = ctx.settings.reducedMotion;
    ctx.settings.reducedMotion = true;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = document.querySelector('.shipyard-confirm .shipyard-preview-canvas')
      || document.querySelector('.shipyard-preview-canvas');
    if (!canvas) return { ok: false, reason: 'no-canvas', prev };
    const grab = () => canvas.toDataURL('image/png');
    const a = grab();
    await new Promise((r) => setTimeout(r, 900));
    const b = grab();
    return { ok: true, same: a === b, aLen: a.length, bLen: b.length, prev };
  });
  say('reducedMotion', { same: motion.same, ok: motion.ok, prev: motion.prev });
  await shot('04-reduced-a.png');
  await page.waitForTimeout(900);
  await shot('04-reduced-b.png');

  const restoreMotion = await page.evaluate(() => {
    window.__ctx.settings.reducedMotion = false;
    return window.__ctx.settings.reducedMotion;
  });
  say('restoredMotion', restoreMotion);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await shot('05-after-cancel.png');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Digit8');
  await page.waitForTimeout(600);
  let undocked = await page.evaluate(() => !window.__ctx.flags.docked);
  if (!undocked) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.station-overlay button')]
        .find((b) => /Launch/i.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
    undocked = await page.evaluate(() => !window.__ctx.flags.docked);
  }
  say('undocked', undocked);

  const startSys = boot.system || 'freehold';
  await page.evaluate((sys) => {
    window.__ctx.emit('jumpRequested', { to: sys });
  }, startSys);
  await page.waitForFunction((sys) => {
    const ctx = window.__ctx;
    return ctx.world.currentSystem === sys && !ctx.gate?.jumping;
  }, startSys, { timeout: 20000 });

  await page.evaluate((sys) => {
    const ctx = window.__ctx;
    const def = ctx.systems[sys];
    const p = def.station.position;
    ctx.world.credits = 100000;
    ctx.world.reputation = ctx.world.reputation || {};
    ctx.world.reputation.freehold = 25;
    ctx.flags.combat = false;
    ctx.input.fullStop = true;
    ctx.input.throttle = 0;
    if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.object.position.set(p[0], p[1], p[2]);
    ctx.input.dockPressed = true;
  }, startSys);
  await page.waitForFunction(() => {
    const ov = document.querySelector('.station-overlay');
    return !!(window.__ctx.flags.docked && ov && ov.style.display !== 'none');
  }, { timeout: 12000 });
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(350);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(400);
  await shot('06-plated-early.png');

  await page.waitForTimeout(5000);
  await shot('07-plated-ready.png');
  const platedReady = await page.evaluate(occupancyFn);
  say('platedReady', {
    faction: platedReady.overlayHead.slice(0, 120),
    previewCanvases: platedReady.previewCanvases,
    rows: platedReady.rows,
    pairs: platedReady.pairs,
  });
  const platedCrops = await saveCrops('crop-plated');
  say('platedCrops', platedCrops);

  const platedLight = findRow(platedReady, 'light');
  const platedHeavy = findRow(platedReady, 'heavy');
  const platedCutter = findRow(platedReady, 'cutter');
  const platedFrigate = findRow(platedReady, 'frigate');
  const platedFreighter = findRow(platedReady, 'freighter');
  const pLightOcc = platedLight?.occ?.occFrac || 0;
  const pHeavyOcc = platedHeavy?.occ?.occFrac || 0;
  const pLightBox = platedLight?.occ?.bbox;
  const pHeavyBox = platedHeavy?.occ?.bbox;
  const platedOccRatioHL = pLightOcc > 0 ? +(pHeavyOcc / pLightOcc).toFixed(3) : 0;
  const platedBboxRatioHL = (pLightBox?.area > 0) ? +((pHeavyBox?.area || 0) / pLightBox.area).toFixed(3) : 0;
  const platedLooksLikeShip = platedReady.rows.every((r) => r.hasCanvas && r.occ && r.occ.greyFrac < 0.55 && r.occ.contrast > 20);
  const platedDistinct = platedReady.pairs.length >= 3 && platedReady.pairs.every((p) => p.rmse > 6);
  const platedSameSizeBug = platedOccRatioHL > 0 && platedOccRatioHL < 1.25 && platedBboxRatioHL < 1.25;
  const platedHeavyLarger = platedOccRatioHL >= 1.35 && platedBboxRatioHL >= 1.35;
  const platedBlob = platedReady.rows.some((r) => !r.hasCanvas || (r.occ && (r.occ.greyFrac >= 0.55 || r.occ.contrast <= 20)));

  const yardPreviewErrors = errors.filter((e) => /yard-preview|WebGL|THREE|shipyard-preview/i.test(e));
  const ignored = errors.filter((e) => /PMREM|reflection rig/i.test(e));
  const otherErrors = errors.filter((e) => !/PMREM|reflection rig/i.test(e));

  const result = {
    boot,
    living: {
      allHaveCanvas,
      previewHosts: livingDump.previewHosts,
      previewCanvases: livingDump.previewCanvases,
      rows: livingDump.rows,
      pairs: livingPairwise,
      lightOcc, cutterOcc, heavyOcc,
      occRatioHL,
      bboxAreaRatioHL,
      cutterLonger,
      heavyClearlyLarger,
      sameSizeBug,
      rmseLH,
      lightBox, cutterBox, heavyBox,
    },
    confirmHeavy: {
      name: confirmDump.confirm?.name,
      hasCanvas: !!confirmDump.confirm?.hasCanvas,
      css: confirmDump.confirm?.css,
      occ: confirmDump.confirm?.occ,
      confirmOcc,
      confirmVsLight,
      confirmLooksZoomedLight,
      confirmIsHeavy,
    },
    reducedMotionFrozen: !!motion.same,
    reducedMotion: { ok: motion.ok, same: motion.same },
    plated: {
      system: startSys,
      previewCanvases: platedReady.previewCanvases,
      rows: platedReady.rows,
      pairs: platedReady.pairs,
      looksLikeShip: platedLooksLikeShip,
      distinct: platedDistinct,
      pLightOcc, pHeavyOcc,
      platedOccRatioHL,
      platedBboxRatioHL,
      platedHeavyLarger,
      platedSameSizeBug,
      platedBlob,
      hasFrigate: !!platedFrigate,
      hasFreighter: !!platedFreighter,
      hasCutter: !!platedCutter,
    },
    errors,
    warnings: warnings.slice(0, 40),
    yardPreviewErrors,
    ignored,
    otherErrors,
    log,
  };

  return result;
}
