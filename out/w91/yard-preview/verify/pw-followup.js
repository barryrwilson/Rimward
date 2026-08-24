async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/yard-preview/verify';

  const saveCanvases = async (prefix) => {
    const meta = await page.evaluate(() =>
      [...document.querySelectorAll('.shipyard-buy-row')].map((row, i) => ({
        i,
        name: (row.querySelector('.shipyard-buy-name')?.textContent || 'row').trim(),
        confirm: row.classList.contains('shipyard-confirm'),
        hasCanvas: !!row.querySelector('.shipyard-preview-canvas'),
      })),
    );
    const written = [];
    const locators = page.locator('.shipyard-buy-row .shipyard-preview-canvas');
    const n = await locators.count();
    for (let i = 0; i < n; i++) {
      const row = meta[i] || { name: 'row' + i };
      const safe = String(row.name).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
        + (row.confirm ? '-confirm' : '');
      const file = `${prefix}-${safe}.png`;
      await locators.nth(i).screenshot({ path: OUT + '/' + file, type: 'png' });
      written.push(file);
    }
    return { meta, written };
  };

  const platedCrops = await saveCanvases('crop-plated');

  const before = await page.evaluate(() => {
    const ctx = window.__ctx;
    return {
      system: ctx.world.currentSystem,
      docked: !!ctx.flags.docked,
      mountedId: ctx.world?.hangar?.mountedId,
      credits: ctx.world?.credits,
      classKey: ctx.player?.classKey,
      hullKind: ctx.player?.hullKind,
      hulls: (ctx.world?.hangar?.hulls ?? []).map((h) => ({ id: h.id, classKey: h.classKey })),
    };
  });

  if (!before.docked) {
    return { error: 'not-docked', before, platedCrops };
  }

  const pane = await page.evaluate(() =>
    (document.querySelector('.station-overlay')?.textContent || '').includes('YARD'),
  );
  if (!pane) {
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(300);
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(400);
  }

  await page.keyboard.press('Digit5');
  await page.waitForTimeout(400);
  const papers = await page.evaluate(() => ({
    name: document.querySelector('.shipyard-confirm .shipyard-buy-name')?.textContent || '',
    hasConfirm: !!document.querySelector('.shipyard-confirm'),
    buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
  }));
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => {
    const ctx = window.__ctx;
    const ov = document.querySelector('.station-overlay');
    return {
      mountedId: ctx.world?.hangar?.mountedId,
      credits: ctx.world?.credits,
      classKey: ctx.player?.classKey,
      hullKind: ctx.player?.hullKind,
      hulls: (ctx.world?.hangar?.hulls ?? []).map((h) => ({
        id: h.id, classKey: h.classKey, hullKind: h.hullKind,
      })),
      overlaySlice: (ov?.textContent || '').slice(0, 500),
    };
  });
  await page.screenshot({ path: OUT + '/08-after-buy.png', type: 'png' });

  await page.evaluate(() => window.__ctx.emit('jumpRequested', { to: 'bt_cradle' }));
  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return ctx.world.currentSystem === 'bt_cradle' && !ctx.gate?.jumping;
  }, { timeout: 20000 });
  await page.evaluate(() => {
    const ctx = window.__ctx;
    const p = ctx.systems.bt_cradle.station.position;
    ctx.flags.combat = false;
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
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(350);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__ctx.settings.reducedMotion = true; });
  await page.waitForTimeout(150);
  const livingCrops = await saveCanvases('crop-living');
  await page.screenshot({ path: OUT + '/09-living-frozen.png', type: 'png' });
  await page.evaluate(() => { window.__ctx.settings.reducedMotion = false; });

  return {
    papers,
    clicked,
    before,
    after,
    buyDidNotRemount: before.mountedId === after.mountedId && before.classKey === after.classKey,
    hullCountGrew: after.hulls.length > before.hulls.length,
    creditsDropped: after.credits < before.credits,
    platedCrops,
    livingCrops,
  };
}
