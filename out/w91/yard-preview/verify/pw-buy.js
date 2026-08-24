async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/yard-preview/verify';
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

  await page.keyboard.press('Digit2');
  await page.waitForTimeout(250);
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
    return {
      mountedId: ctx.world?.hangar?.mountedId,
      credits: ctx.world?.credits,
      classKey: ctx.player?.classKey,
      hullKind: ctx.player?.hullKind,
      hulls: (ctx.world?.hangar?.hulls ?? []).map((h) => ({
        id: h.id, classKey: h.classKey, hullKind: h.hullKind,
      })),
      overlaySlice: (document.querySelector('.station-overlay')?.textContent || '').slice(0, 600),
    };
  });
  await page.screenshot({ path: OUT + '/08-after-buy.png', type: 'png' });
  return {
    papers,
    clicked,
    before,
    after,
    buyDidNotRemount: before.mountedId === after.mountedId && before.classKey === after.classKey,
    hullCountGrew: after.hulls.length > before.hulls.length,
    creditsDropped: after.credits < before.credits,
  };
}
