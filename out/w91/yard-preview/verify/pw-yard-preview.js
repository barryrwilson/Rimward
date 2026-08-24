async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/yard-preview/verify';
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

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('rimward-title-skip', '1');
      localStorage.removeItem('rimward-save-v1');
    } catch {}
  });
  await page.goto('http://127.0.0.1:5176/', { waitUntil: 'domcontentloaded', timeout: 60000 });
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

  const goCradle = await page.evaluate(() => {
    const ctx = window.__ctx;
    if (ctx.world.currentSystem !== 'bt_cradle') {
      ctx.emit('jumpRequested', { to: 'bt_cradle' });
    }
    return { from: ctx.world.currentSystem, jumping: !!ctx.gate?.jumping };
  });
  say('goCradle', goCradle);
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
  await page.waitForTimeout(600);
  await shot('02-yard-living.png');

  const yardDump = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.shipyard-buy-row')].map((row) => {
      const host = row.querySelector('.shipyard-preview');
      const canvas = row.querySelector('.shipyard-preview-canvas');
      const name = row.querySelector('.shipyard-buy-name')?.textContent || '';
      let sample = null;
      if (canvas) {
        try {
          const c2 = canvas.getContext('2d');
          const w = canvas.width;
          const h = canvas.height;
          const img = c2.getImageData(0, 0, w, h).data;
          let r = 0, g = 0, b = 0, n = 0;
          let minL = 255, maxL = 0;
          const step = Math.max(1, Math.floor(img.length / 4 / 400));
          for (let i = 0; i < img.length; i += 4 * step) {
            r += img[i]; g += img[i + 1]; b += img[i + 2]; n++;
            const L = (img[i] + img[i + 1] + img[i + 2]) / 3;
            if (L < minL) minL = L;
            if (L > maxL) maxL = L;
          }
          sample = {
            w, h, n,
            avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
            minL: Math.round(minL),
            maxL: Math.round(maxL),
            contrast: Math.round(maxL - minL),
          };
        } catch (e) {
          sample = { err: String(e) };
        }
      }
      return {
        name,
        hasPreview: !!host,
        hasCanvas: !!canvas,
        canvasClass: canvas?.className || '',
        sample,
      };
    });
    const glCanvases = [...document.querySelectorAll('canvas')].map((c) => ({
      className: c.className,
      w: c.width,
      h: c.height,
      parent: c.parentElement?.tagName,
      hidden: c.getAttribute('aria-hidden'),
      left: c.style.left,
    }));
    return {
      overlay: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 900),
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      previewHosts: document.querySelectorAll('.shipyard-preview').length,
      previewCanvases: document.querySelectorAll('.shipyard-preview-canvas').length,
      rows,
      glCanvases,
    };
  });
  say('yardLiving', {
    previewHosts: yardDump.previewHosts,
    previewCanvases: yardDump.previewCanvases,
    rows: yardDump.rows,
    buttons: yardDump.buttons,
    glCanvases: yardDump.glCanvases,
  });

  const pairwise = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('.shipyard-buy-row .shipyard-preview-canvas')];
    const names = [...document.querySelectorAll('.shipyard-buy-row .shipyard-buy-name')].map((n) => n.textContent);
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
    const downs = canvases.map(down);
    const out = [];
    for (let i = 0; i < downs.length; i++) {
      for (let j = i + 1; j < downs.length; j++) {
        out.push({ a: names[i], b: names[j], rmse: rmse(downs[i], downs[j]) });
      }
    }
    return out;
  });
  say('livingPairwise', pairwise);

  const rowCanvases = yardDump.rows.filter((r) => r.hasCanvas);
  const allHaveCanvas = yardDump.previewHosts >= 3 && yardDump.previewCanvases >= 3
    && yardDump.rows.length >= 3 && yardDump.rows.every((r) => r.hasPreview && r.hasCanvas);
  const livingDistinct = pairwise.length >= 3 && pairwise.every((p) => p.rmse > 8);

  await page.keyboard.press('Digit5');
  await page.waitForTimeout(500);
  await shot('03-confirm-heavy.png');

  const confirmDump = await page.evaluate(() => {
    const confirm = document.querySelector('.shipyard-confirm');
    const host = confirm?.querySelector('.shipyard-preview');
    const canvas = confirm?.querySelector('.shipyard-preview-canvas');
    const name = confirm?.querySelector('.shipyard-buy-name')?.textContent || '';
    const meta = confirm?.querySelector('.shipyard-buy-meta')?.textContent || '';
    let sample = null;
    let grid = null;
    if (canvas) {
      const c2 = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const img = c2.getImageData(0, 0, w, h).data;
      let r = 0, g = 0, b = 0, n = 0;
      const step = Math.max(1, Math.floor(img.length / 4 / 400));
      for (let i = 0; i < img.length; i += 4 * step) {
        r += img[i]; g += img[i + 1]; b += img[i + 2]; n++;
      }
      sample = { w, h, avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)] };
      const tmp = document.createElement('canvas');
      tmp.width = 16; tmp.height = 10;
      const t = tmp.getContext('2d');
      t.drawImage(canvas, 0, 0, 16, 10);
      grid = Array.from(t.getImageData(0, 0, 16, 10).data);
    }
    return {
      name,
      meta,
      hasPreview: !!host,
      hasCanvas: !!canvas,
      sample,
      grid,
      overlay: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 600),
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    };
  });
  say('confirmHeavy', {
    name: confirmDump.name,
    meta: confirmDump.meta,
    hasPreview: confirmDump.hasPreview,
    hasCanvas: confirmDump.hasCanvas,
    sample: confirmDump.sample,
    buttons: confirmDump.buttons,
  });

  const confirmIsHeavy = /heavy/i.test(confirmDump.name || '') && confirmDump.hasCanvas;

  const motion = await page.evaluate(async () => {
    const ctx = window.__ctx;
    const prev = ctx.settings.reducedMotion;
    ctx.settings.reducedMotion = true;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas = document.querySelector('.shipyard-preview-canvas');
    if (!canvas) return { ok: false, reason: 'no-canvas', prev };
    const grab = () => canvas.toDataURL('image/png');
    const a = grab();
    await new Promise((r) => setTimeout(r, 850));
    const b = grab();
    ctx.settings.reducedMotion = prev;
    return { ok: true, same: a === b, aLen: a.length, bLen: b.length, prev };
  });
  say('reducedMotion', { same: motion.same, ok: motion.ok, prev: motion.prev });
  await shot('04-reduced-a.png');
  await page.waitForTimeout(850);
  await shot('04-reduced-b.png');

  const restoreMotion = await page.evaluate(() => {
    window.__ctx.settings.reducedMotion = false;
    return window.__ctx.settings.reducedMotion;
  });
  say('restoredMotion', restoreMotion);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await shot('05-after-cancel.png');

  const afterCancel = await page.evaluate(() => ({
    buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    hasConfirm: !!document.querySelector('.shipyard-confirm'),
    previewCanvases: document.querySelectorAll('.shipyard-preview-canvas').length,
  }));
  say('afterCancel', afterCancel);

  await page.keyboard.press('Digit3');
  await page.waitForTimeout(350);
  const papers3 = await page.evaluate(() => ({
    name: document.querySelector('.shipyard-confirm .shipyard-buy-name')?.textContent || '',
    hasConfirm: !!document.querySelector('.shipyard-confirm'),
    buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
  }));
  say('digit3Papers', papers3);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  await page.keyboard.press('Digit1');
  await page.waitForTimeout(300);
  const hangarPane = await page.evaluate(() => ({
    overlay: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 400),
    buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    previews: document.querySelectorAll('.shipyard-preview-canvas').length,
    glOffscreen: [...document.querySelectorAll('canvas')].filter((c) => c.style.left === '-4096px').length,
  }));
  say('digit1Hangar', hangarPane);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(400);
  const yardPane = await page.evaluate(() => ({
    overlay: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 400),
    buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    previews: document.querySelectorAll('.shipyard-preview-canvas').length,
  }));
  say('digit2Yard', yardPane);

  const switchCounts = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i % 2 === 0 ? 'Digit1' : 'Digit2');
    await page.waitForTimeout(180);
    const c = await page.evaluate(() => ({
      i: 0,
      pane: /YARD/.test(document.querySelector('.station-overlay')?.textContent || '') ? 'yard' : 'hangar',
      preview: document.querySelectorAll('.shipyard-preview-canvas').length,
      glOffscreen: [...document.querySelectorAll('canvas')].filter((c) => c.style.left === '-4096px').length,
      allCanvas: document.querySelectorAll('canvas').length,
    }));
    c.i = i;
    switchCounts.push(c);
  }
  say('rapidSwitch', switchCounts);

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
  await page.waitForTimeout(250);
  await shot('06-plated-early.png');
  const platedEarly = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.shipyard-buy-row')].map((row) => {
      const canvas = row.querySelector('.shipyard-preview-canvas');
      const name = row.querySelector('.shipyard-buy-name')?.textContent || '';
      if (!canvas) return { name, hasCanvas: false };
      const c2 = canvas.getContext('2d');
      const img = c2.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, n = 0, greyish = 0;
      const step = Math.max(1, Math.floor(img.length / 4 / 500));
      for (let i = 0; i < img.length; i += 4 * step) {
        r += img[i]; g += img[i + 1]; b += img[i + 2]; n++;
        const dr = Math.abs(img[i] - 106);
        const dg = Math.abs(img[i + 1] - 115);
        const db = Math.abs(img[i + 2] - 128);
        if (dr < 40 && dg < 40 && db < 40) greyish++;
      }
      return {
        name,
        hasCanvas: true,
        avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
        greyFrac: greyish / n,
      };
    });
    return {
      faction: document.querySelector('.shipyard-buy-flag')?.textContent || '',
      previewCanvases: document.querySelectorAll('.shipyard-preview-canvas').length,
      rows,
    };
  });
  say('platedEarly', platedEarly);

  await page.waitForTimeout(4500);
  await shot('07-plated-ready.png');
  const platedReady = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.shipyard-buy-row')].map((row) => {
      const canvas = row.querySelector('.shipyard-preview-canvas');
      const name = row.querySelector('.shipyard-buy-name')?.textContent || '';
      if (!canvas) return { name, hasCanvas: false };
      const c2 = canvas.getContext('2d');
      const img = c2.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, n = 0, greyish = 0;
      let minL = 255, maxL = 0;
      const step = Math.max(1, Math.floor(img.length / 4 / 500));
      for (let i = 0; i < img.length; i += 4 * step) {
        r += img[i]; g += img[i + 1]; b += img[i + 2]; n++;
        const L = (img[i] + img[i + 1] + img[i + 2]) / 3;
        if (L < minL) minL = L;
        if (L > maxL) maxL = L;
        const dr = Math.abs(img[i] - 106);
        const dg = Math.abs(img[i + 1] - 115);
        const db = Math.abs(img[i + 2] - 128);
        if (dr < 40 && dg < 40 && db < 40) greyish++;
      }
      return {
        name,
        hasCanvas: true,
        avg: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
        greyFrac: +(greyish / n).toFixed(3),
        contrast: Math.round(maxL - minL),
      };
    });
    function down(c) {
      const tmp = document.createElement('canvas');
      tmp.width = 16; tmp.height = 10;
      const t = tmp.getContext('2d');
      t.drawImage(c, 0, 0, 16, 10);
      return t.getImageData(0, 0, 16, 10).data;
    }
    function rmse(a, b) {
      let s = 0;
      for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        s += d * d;
      }
      return Math.sqrt(s / a.length);
    }
    const canvases = [...document.querySelectorAll('.shipyard-buy-row .shipyard-preview-canvas')];
    const names = [...document.querySelectorAll('.shipyard-buy-row .shipyard-buy-name')].map((n) => n.textContent);
    const downs = canvases.map(down);
    const pairs = [];
    for (let i = 0; i < downs.length; i++) {
      for (let j = i + 1; j < downs.length; j++) {
        pairs.push({ a: names[i], b: names[j], rmse: rmse(downs[i], downs[j]) });
      }
    }
    return {
      faction: document.querySelector('.shipyard-buy-flag')?.textContent || '',
      system: window.__ctx.world.currentSystem,
      dockFaction: window.__ctx.systems[window.__ctx.world.currentSystem]?.faction,
      previewCanvases: document.querySelectorAll('.shipyard-preview-canvas').length,
      rows,
      pairs,
    };
  });
  say('platedReady', platedReady);

  const platedLooksLikeShip = platedReady.rows.every((r) => r.hasCanvas && r.greyFrac < 0.55 && r.contrast > 20);
  const platedDistinct = platedReady.pairs.length >= 3 && platedReady.pairs.every((p) => p.rmse > 6);

  const maxPreviewDuringSwitch = Math.max(...switchCounts.map((s) => s.preview), 0);
  const maxGlOff = Math.max(...switchCounts.map((s) => s.glOffscreen), 0);
  const hangarHadPreview = switchCounts.some((s) => s.pane === 'hangar' && s.preview > 0);
  const hangarHadGl = switchCounts.some((s) => s.pane === 'hangar' && s.glOffscreen > 0);

  const yardPreviewErrors = errors.filter((e) => /yard-preview|WebGL|THREE|shipyard-preview/i.test(e));
  const ignored = errors.filter((e) => /PMREM|reflection rig/i.test(e));
  const otherErrors = errors.filter((e) => !/PMREM|reflection rig/i.test(e));

  const result = {
    boot,
    allHaveCanvas,
    livingDistinct,
    pairwise,
    confirmIsHeavy,
    confirmName: confirmDump.name,
    reducedMotionFrozen: !!motion.same,
    papers3Armed: papers3.hasConfirm,
    hangarWorks: /HANGAR/i.test(hangarPane.overlay || '') || hangarPane.buttons.some((b) => /Hangar/i.test(b || '')),
    yardWorks: yardPane.previews >= 3,
    platedLooksLikeShip,
    platedDistinct,
    platedFaction: platedReady.faction,
    platedSystem: platedReady.system,
    rapidSwitch: switchCounts,
    maxPreviewDuringSwitch,
    maxGlOff,
    hangarHadPreview,
    hangarHadGl,
    errors,
    warnings: warnings.slice(0, 40),
    yardPreviewErrors,
    ignored,
    otherErrors,
    log,
  };
  return result;
}
