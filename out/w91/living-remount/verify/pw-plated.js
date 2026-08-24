async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/living-remount/verify';
  const log = [];
  const say = (...a) => { log.push(a.map(String).join(' ')); };
  const shot = async (name) => {
    await page.screenshot({ path: OUT + '/' + name, type: 'png' });
    say('SHOT', name);
  };

  const originVisible = await page.evaluate(() =>
    /who are you/i.test(document.body.innerText || '')
  );
  say('originVisible', originVisible);
  if (originVisible) {
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(600);
  }
  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return !!(ctx && ctx.ship?.object && ctx.player && !ctx.flags.paused);
  }, { timeout: 20000 });

  await page.evaluate(() => {
    const ctx = window.__ctx;
    if (ctx.world.currentSystem !== 'freehold') ctx.emit('jumpRequested', { to: 'freehold' });
  });
  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return ctx.world.currentSystem === 'freehold' && !ctx.gate?.jumping;
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const p = ctx.systems.freehold.station.position;
    ctx.world.credits = 100000;
    ctx.world.reputation = ctx.world.reputation || {};
    ctx.world.reputation.freehold = 25;
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
  await page.waitForTimeout(300);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(300);
  await page.keyboard.press('Digit3');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(300);

  const hangar = await page.evaluate(() => {
    const ctx = window.__ctx;
    return {
      mountedId: ctx.world.hangar.mountedId,
      hulls: ctx.world.hangar.hulls.map((h) => ({
        id: h.id, classKey: h.classKey, hullKind: h.hullKind, faction: h.faction,
      })),
      buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
    };
  });
  say('hangar', JSON.stringify(hangar));
  await shot('09-plated-hangar.png');

  const platedIdx = hangar.hulls.findIndex((h) => h.hullKind === 'built');
  say('platedIdx', platedIdx);
  if (platedIdx >= 0) {
    const digit = platedIdx === 7 ? 'Digit0' : ('Digit' + (platedIdx + 3));
    await page.keyboard.press(digit);
    await page.waitForTimeout(1200);
  }

  const after = await page.evaluate(() => {
    const ctx = window.__ctx;
    const rig = ctx.ship.hullRig;
    let meshNames = [];
    if (rig?.plated) {
      rig.plated.traverse((n) => {
        if (n.isMesh) meshNames.push(n.name || n.type);
      });
    }
    return {
      classKey: ctx.player.classKey,
      hullKind: ctx.player.hullKind,
      hullPath: ctx.ship.hullPath,
      kind: rig?.kind,
      platedIsAsset: !!rig?.platedIsAsset,
      platedFallback: !!rig?.plated?.userData?.platedFallback,
      platedName: rig?.plated?.name || null,
      living: ctx.ship.living,
      meshCount: meshNames.length,
      meshSample: meshNames.slice(0, 8),
    };
  });
  say('after', JSON.stringify(after));
  await shot('10-plated-after-mount.png');
  return { log, hangar, after };
}
