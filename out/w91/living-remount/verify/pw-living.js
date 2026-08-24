async (page) => {
  const OUT = 'C:/Projects/WebSim/out/w91/living-remount/verify';
  const log = [];
  const say = (...a) => { const line = a.map(String).join(' '); log.push(line); };
  const shot = async (name) => {
    await page.screenshot({ path: OUT + '/' + name, type: 'png' });
    say('SHOT', name);
  };
  const errors = [];
  page.on('pageerror', (err) => { errors.push('PAGEERR ' + err.message); say('PAGEERR', err.message); });
  page.on('console', (msg) => {
    if (msg.type() === 'error') { errors.push('ERROR ' + msg.text()); say('ERROR', msg.text()); }
  });

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('rimward-title-skip', '1');
      localStorage.removeItem('rimward-save-v1');
    } catch {}
  });
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!window.__ctx, { timeout: 45000 });

  await page.evaluate(() => {
    const neu = document.getElementById('rw-title-new');
    if (neu) {
      neu.click();
      if (neu.textContent.includes('CONFIRM')) neu.click();
    }
  });
  await page.waitForTimeout(400);

  const originVisible = await page.evaluate(() =>
    !!document.body && /who are you/i.test(document.body.innerText || '')
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

  const goCradle = await page.evaluate(() => {
    const ctx = window.__ctx;
    if (ctx.world.currentSystem !== 'bt_cradle') {
      ctx.emit('jumpRequested', { to: 'bt_cradle' });
    }
    return { from: ctx.world.currentSystem, jumping: !!ctx.gate?.jumping };
  });
  say('goCradle', JSON.stringify(goCradle));
  await page.waitForFunction(() => {
    const ctx = window.__ctx;
    return ctx.world.currentSystem === 'bt_cradle' && !ctx.gate?.jumping;
  }, { timeout: 15000 });

  const pose = async (tag) => {
    return page.evaluate((label) => {
      const ctx = window.__ctx;
      const def = ctx.systems.bt_cradle;
      const p = def.station.position;
      ctx.flags.docked = false;
      ctx.flags.combat = false;
      ctx.flags.camera = 'chase';
      ctx.flags.firstPerson = false;
      ctx.input.fullStop = true;
      ctx.input.throttle = 0;
      ctx.input.dockPressed = false;
      if (ctx.ship.velocity?.set) ctx.ship.velocity.set(0, 0, 0);
      ctx.ship.object.position.set(p[0] + 70, p[1] + 18, p[2] + 70);
      ctx.ship.object.quaternion.identity();
      const geo = ctx.ship.hullRig?.geo;
      if (geo) geo.computeBoundingBox();
      const b = geo?.boundingBox;
      const spanX = b ? b.max.x - b.min.x : null;
      const spanY = b ? b.max.y - b.min.y : null;
      const spanZ = b ? b.max.z - b.min.z : null;
      return {
        label,
        system: ctx.world.currentSystem,
        faction: ctx.systems.bt_cradle?.faction,
        classKey: ctx.player.classKey,
        hullKind: ctx.player.hullKind,
        hullPath: ctx.ship.hullPath,
        kind: ctx.ship.hullRig?.kind,
        restScale: ctx.ship.hullRig?.restScale,
        spanX, spanY, spanZ,
        max: spanX == null ? null : Math.max(spanX, spanY, spanZ),
        living: {
          swim: !!ctx.ship.living?.swim,
          breath: !!ctx.ship.living?.breath,
          heartbeat: !!ctx.ship.living?.heartbeat,
        },
      };
    }, tag);
  };

  const lightPose = await pose('light-before-buy');
  say('lightPose', JSON.stringify(lightPose));
  await page.waitForTimeout(700);
  await shot('01-chase-light.png');

  await page.evaluate(() => {
    const ctx = window.__ctx;
    const def = ctx.systems.bt_cradle;
    const p = def.station.position;
    ctx.world.credits = 100000;
    ctx.world.reputation = ctx.world.reputation || {};
    ctx.world.reputation.beautiful = 0;
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
  await shot('02-dock-cradle.png');

  const dump = async (tag) => {
    const d = await page.evaluate(() => {
      const ov = document.querySelector('.station-overlay');
      const ctx = window.__ctx;
      return {
        docked: !!ctx?.flags?.docked,
        system: ctx?.world?.currentSystem,
        credits: ctx?.world?.credits,
        mountedId: ctx?.world?.hangar?.mountedId,
        hulls: (ctx?.world?.hangar?.hulls ?? []).map((h) => ({
          id: h.id, classKey: h.classKey, hullKind: h.hullKind,
        })),
        player: { classKey: ctx?.player?.classKey, hullKind: ctx?.player?.hullKind },
        notice: ov?.querySelector('.station-notice')?.textContent ?? '',
        overlay: ov ? ov.textContent : '',
        buttons: [...document.querySelectorAll('.station-overlay button')].map((b) => b.textContent),
      };
    });
    say(tag, JSON.stringify({
      docked: d.docked, system: d.system, credits: d.credits,
      mountedId: d.mountedId, hulls: d.hulls, player: d.player,
      notice: d.notice, buttons: d.buttons,
      overlaySlice: (d.overlay || '').slice(0, 700),
    }));
    return d;
  };

  await dump('menu');
  await page.keyboard.press('Digit0');
  await page.waitForTimeout(350);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(350);
  await dump('yard');
  await shot('03-yard.png');

  await page.keyboard.press('Digit5');
  await page.waitForTimeout(350);
  const pending = await dump('heavy-papers');
  await shot('04-heavy-papers.png');

  const mountedBefore = pending.mountedId;
  const playerBefore = pending.player;
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.station-overlay button')]
      .find((b) => b.textContent === 'Confirm papers');
    if (!btn) return false;
    btn.click();
    return true;
  });
  await page.waitForTimeout(500);
  const afterBuy = await dump('after-buy');
  await shot('05-after-buy.png');
  const buyDidNotRemount = afterBuy.mountedId === mountedBefore
    && afterBuy.player.classKey === playerBefore.classKey;
  say('buyDidNotRemount', buyDidNotRemount, 'clicked', clicked);

  await page.keyboard.press('Digit1');
  await page.waitForTimeout(350);
  await dump('hangar');
  await shot('06-hangar.png');
  await page.keyboard.press('Digit4');
  await page.waitForTimeout(500);
  const afterMount = await dump('after-mount');
  await shot('07-after-mount.png');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  await page.keyboard.press('Digit8');
  await page.waitForTimeout(600);
  let undocked = await page.evaluate(() => !window.__ctx.flags.docked);
  say('undocked', undocked);
  if (!undocked) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.station-overlay button')]
        .find((b) => /Launch/i.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
    undocked = await page.evaluate(() => !window.__ctx.flags.docked);
    say('undocked2', undocked);
  }

  const heavyPose = await pose('heavy-after-mount');
  say('heavyPose', JSON.stringify(heavyPose));
  await page.waitForTimeout(700);
  await shot('08-chase-heavy.png');

  const swimA = await page.evaluate(() => {
    const arr = window.__ctx.ship?.hullRig?.arr;
    return arr ? Array.from(arr.slice(0, 24)) : null;
  });
  await page.waitForTimeout(1600);
  const swimB = await page.evaluate(() => {
    const arr = window.__ctx.ship?.hullRig?.arr;
    return arr ? Array.from(arr.slice(0, 24)) : null;
  });
  let swimMoved = false;
  let swimMaxDelta = 0;
  if (swimA && swimB) {
    for (let i = 0; i < swimA.length; i++) swimMaxDelta = Math.max(swimMaxDelta, Math.abs(swimA[i] - swimB[i]));
    swimMoved = swimMaxDelta > 1e-4;
    say('swimMaxDelta', swimMaxDelta, 'swimMoved', swimMoved);
  } else {
    say('swimMissing', !swimA);
  }

  let plated = null;
  let platedSkip = null;
  try {
    await page.evaluate(() => window.__ctx.emit('jumpRequested', { to: 'freehold' }));
    await page.waitForFunction(() => {
      const ctx = window.__ctx;
      return ctx.world.currentSystem === 'freehold' && !ctx.gate?.jumping;
    }, { timeout: 15000 });
    await page.evaluate(() => {
      const ctx = window.__ctx;
      const def = ctx.systems.freehold;
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
    const platedHangar = await dump('plated-hangar');
    const platedIdx = platedHangar.hulls.findIndex((h) => h.hullKind === 'built');
    say('platedIdx', platedIdx);
    if (platedIdx >= 0) {
      const digit = platedIdx === 7 ? 'Digit0' : ('Digit' + (platedIdx + 3));
      await page.keyboard.press(digit);
      await page.waitForTimeout(800);
    }
    plated = await page.evaluate(() => {
      const ctx = window.__ctx;
      const rig = ctx.ship.hullRig;
      return {
        classKey: ctx.player.classKey,
        hullKind: ctx.player.hullKind,
        hullPath: ctx.ship.hullPath,
        kind: rig?.kind,
        platedIsAsset: !!rig?.platedIsAsset,
        platedFallback: !!rig?.plated?.userData?.platedFallback,
        livingNull: ctx.ship.living == null,
      };
    });
    say('plated', JSON.stringify(plated));
    await shot('09-plated-mount.png');
  } catch (e) {
    platedSkip = String(e && e.message ? e.message : e);
    say('platedSkip', platedSkip);
  }

  return {
    log,
    lightPose,
    heavyPose,
    buyDidNotRemount,
    clicked,
    mountedBefore,
    afterBuyMounted: afterBuy.mountedId,
    afterMount,
    swimMoved,
    swimMaxDelta,
    plated,
    platedSkip,
    visiblyLarger: !!(lightPose?.max && heavyPose?.max && heavyPose.max > lightPose.max * 1.5),
    heavyIsLiving: heavyPose?.kind === 'living',
    errors,
  };
}
