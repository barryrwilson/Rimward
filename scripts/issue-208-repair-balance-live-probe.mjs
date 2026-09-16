/** #208 isolated Chromium: the real REPAIR BAYS pane and the real `1 — Repair
 * all` button. Rendered quote vs deducted credits, an unaffordable bill, a
 * keeper comp, a low-credit light pilot and a larger hull — then one controlled
 * trader leg whose earnings are ACTUAL market transactions, measured against a
 * disclosed damage fixture. Loopback only; disposable profile. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE208_OUT || resolve('out/issue-208/live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive, sleep } = await import('./issue-74-live-harness.mjs');
const seed = Number(process.env.ISSUE208_SEED ?? 208);

await runLive('repair-balance', async ({ c, result, act, wait, observe, checkpoint, shot }) => {
  result.fixture = true;
  result.method = [
    'Disposable Chromium, declared seed installed before page scripts.',
    'Repair sections: explicit berth placement, an explicit integrity fixture (62% hull / 70% engine)',
    'and an explicit credit fixture, then the REAL repair pane and the REAL repair button.',
    'Trader legs: REAL market buy, REAL plotted route and autopilot dock, REAL market sell —',
    'the earnings are actual transactions. Leg B declares a working-capital fixture so the hold fills;',
    'the revenue it produces is still real. The damage priced against those earnings is the same',
    'disclosed integrity fixture, NOT a natural pirate engagement, and two legs are not a campaign.',
  ].join(' ');
  result.limitations = [
    'Damage is applied as a disclosed integrity fixture; no pirate fought the player in this run.',
    'One measured leg on one seed is not longitudinal balance validation.',
    'Credit balances in the repair sections are fixtures chosen to sit on the affordability boundary.',
  ];

  const place = () => c.eval(`(()=>{const x=window.__ctx,p=x.systems[x.world.currentSystem].station.position;for(const s of x.ships)if(s?.object)s.object.position.set(p[0]+9000,p[1]+9000,p[2]+9000);x.flags.combat=false;x.ship.object.position.set(p[0]+36,p[1],p[2]);x.ship.velocity.set(0,0,0);x.ship.speed=0;return true;})()`);
  const panelText = () => c.eval("document.querySelector('.station-panel')?.innerText ?? ''");
  const credits = () => c.eval('window.__ctx.world.credits');
  const channels = () => c.eval("(()=>{const p=window.__ctx.player;return{classKey:p.classKey,hull:p.hull,hullMax:p.hullMax,screen:p.screen,screenMax:p.screenMax,shell:p.shell,shellMax:p.shellMax,engine:p.engine,engineMax:p.engineMax};})()");

  /** Disclosed fixture: authored class maxima, then a named fraction knocked off. */
  const damage = (classKey, hullFrac, engineFrac) => c.eval(`(async()=>{
    const { SHIP_CLASSES, DEFENSE } = await import('/src/game/state.js');
    const p = window.__ctx.player, cls = SHIP_CLASSES[${JSON.stringify(classKey)}];
    const screenMax = Math.round(cls.shield * DEFENSE.screenFraction);
    p.classKey = ${JSON.stringify(classKey)};
    p.hullMax = cls.hull; p.screenMax = screenMax; p.shellMax = cls.shield - screenMax; p.engineMax = cls.engine;
    p.hull = p.hullMax * (1 - ${hullFrac}); p.screen = p.screenMax; p.shell = p.shellMax;
    p.engine = p.engineMax * (1 - ${engineFrac});
    p.engineOut = false; p.disabled = false;
    return { hull: p.hull, engine: p.engine };
  })()`);

  /** Re-open REPAIR and read the rendered quote back out of the pane. */
  const quote = async () => {
    await act('openService', { id: 'repair' });
    const text = await panelText();
    const lines = text.split('\n');
    const parts = {};
    for (const line of lines) {
      const m = /^(hull|screen|shell|engine) — (\d+) integrity down · (\d+) UU$/.exec(line);
      if (m) parts[m[1]] = { lack: Number(m[2]), cost: Number(m[3]) };
    }
    const total = /^Yard total: (\d+) UU\.$/m.exec(text);
    const btn = await c.eval("(()=>{const n=[...document.querySelectorAll('.station-panel button')].find(b=>/^1 — Repair all/.test(b.textContent));return n?n.textContent:null;})()");
    return {
      text, parts,
      total: total ? Number(total[1]) : null,
      button: btn ? Number(/\((\d+) UU\)/.exec(btn)[1]) : null,
      comped: /Comped by the keepers/.test(text),
      whole: /She reads whole on every channel\./.test(text),
    };
  };
  /** Press the real button by trusted mouse input, not by calling the action. */
  const pressRepair = async () => {
    const box = await c.eval("(()=>{const n=[...document.querySelectorAll('.station-panel button')].find(b=>/^1 — Repair all/.test(b.textContent));if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
    assert.ok(box, 'the repair button is on screen');
    for (const type of ['mousePressed', 'mouseReleased']) {
      await c.send('Input.dispatchMouseEvent', { type, ...box, button: 'left', clickCount: 1 });
    }
    await sleep(200);
    return panelText();
  };

  await wait((s) => s.t > 0.2, 15, 'first simulation frame');
  await place();
  await sleep(250);
  await act('dock');
  await wait((s) => s.flags.docked, 15, 'first berth');
  result.startSystem = (await observe()).world.currentSystem;

  // ---- 1. controlled trader legs, with REAL transactions ---------------------
  // Buy the commodity the visible counter discounts most against its base, fly
  // a real plotted route, and sell the hold at the next dock. Every UU below
  // moved through the market desk: none of it is an earnings fixture.
  //
  // Two legs, because they answer different questions. Leg A is flown on the
  // purse the game actually hands a greenhand, so the hold is limited by money,
  // not by capacity — that is the starter's real earning rate. Leg B declares a
  // working-capital fixture so the hold fills, which is the earning rate of a
  // trader who already has stock money. The credits injected for leg B are a
  // disclosed fixture; the revenue they produce is not.
  const runLeg = async (label, dest, capitaliseTo) => {
    if (capitaliseTo !== null) await c.eval(`window.__ctx.world.credits = ${capitaliseTo}`);
    const purse0 = await credits();
    await act('openService', { id: 'market' });
    const pick = await c.eval(`(async()=>{
      const { COMMODITIES } = await import('/src/game/state.js');
      const x = window.__ctx, prices = x.world.prices ?? {};
      let best = null;
      for (const [key, row] of Object.entries(COMMODITIES)) {
        if (row.legal !== true) continue;
        const price = prices[key];
        if (!Number.isFinite(price)) continue;
        const discount = (row.base - price) / row.base;
        if (!best || discount > best.discount) best = { key, price, base: row.base, discount };
      }
      return { best, capacity: x.cargoCapacity, purse: x.world.credits };
    })()`);
    assert.ok(pick.best, label + ': the counter quotes at least one legal commodity');
    const qty = Math.max(1, Math.min(pick.capacity, Math.floor(pick.purse / pick.best.price)));
    await act('trade', { commodity: pick.best.key, side: 'buy', qty });
    const purseAfterBuy = await credits();
    const held = await c.eval('window.__ctx.cargo.reduce((n,r)=>n+r.units,0)');
    const leg = {
      label, origin: (await observe()).world.currentSystem, destination: dest,
      startingCapital: capitaliseTo === null ? 'the purse the game gave the pilot' : `declared fixture ${capitaliseTo} UU`,
      commodity: pick.best.key, unitBuyPrice: pick.best.price, base: pick.best.base,
      holdCapacity: pick.capacity, qtyRequested: qty, unitsHeld: held,
      purseBefore: purse0, purseAfterBuy, spent: purse0 - purseAfterBuy,
      boundBy: held < pick.capacity ? 'purse' : 'hold capacity',
    };
    assert.ok(held > 0, label + ': the hold actually took cargo');
    assert.ok(leg.spent > 0, label + ': the buy actually cost credits');
    await checkpoint(label + '-bought');

    await act('undock');
    await wait((s) => !s.flags.docked, 30, label + ': departure lane clears', async (s) => {
      if (s.flags.docked) await act('undock', {}, false);
    });
    const tDepart = (await observe()).t;
    await act('plotRoute', { dest });
    await act('engageAutopilot');
    assert.equal((await act('approachDock')).status, 'queued');
    await wait((s) => (s.flags.docked && s.world.currentSystem === dest) || s.autopilot.phase === 'failed', 260, label + ': destination berth');
    const arrived = await observe();
    leg.arrival = { docked: arrived.flags.docked, system: arrived.world.currentSystem, autopilot: arrived.autopilot };
    leg.simSecondsFlown = arrived.t - tDepart;
    assert.equal(arrived.flags.docked, true, label + ': the leg reaches a real berth');
    assert.equal(arrived.world.currentSystem, dest, label + ': at the destination dock');

    await act('openService', { id: 'market' });
    const sellQty = await c.eval('window.__ctx.cargo.reduce((n,r)=>n+r.units,0)');
    await act('trade', { commodity: pick.best.key, side: 'sell', qty: sellQty });
    const purseAfterSell = await credits();
    leg.unitsSold = sellQty;
    leg.purseAfterSell = purseAfterSell;
    leg.grossRevenue = purseAfterSell - purseAfterBuy;
    leg.netProfit = purseAfterSell - purse0;
    assert.ok(leg.grossRevenue > 0, label + ': the sale actually paid credits');
    await checkpoint(label + '-sold');
    (result.traderLegs ||= []).push(leg);
    return leg;
  };
  const starterLeg = await runLeg('legA-starter-purse', 'veridian', null);
  const capitalisedLeg = await runLeg('legB-working-capital', 'freehold', 20000);

  // ---- 2. the light pilot's bill against that leg ----------------------------
  // Same berth, the disclosed 62% hull / 70% engine strip the issue reported.
  // Veridian is one of the authored six, so no faction yard rate applies and no
  // epic stage is achieved: the modifier is exactly 1.
  {
    const mods = await c.eval(`(async()=>{
      const { epicEffects } = await import('/src/game/epics.js');
      const x = window.__ctx;
      return { epicRepairMult: epicEffects(x, x.systems[x.world.currentSystem].faction).repairMult ?? 1 };
    })()`);
    assert.equal(mods.epicRepairMult, 1, 'no epic discount is in play');
    result.modifiers = mods;

    await damage('light', 0.62, 0.70);
    const q = await quote();
    assert.equal(q.parts.hull?.lack, 62);
    assert.equal(q.parts.engine?.lack, 70);
    assert.equal(q.parts.hull?.cost, 168, 'hull: ceil(62 × 0.9 × 3)');
    assert.equal(q.parts.engine?.cost, 126, 'engine: ceil(70 × 0.6 × 3)');
    assert.equal(q.total, 294);
    assert.equal(q.button, 294, 'the button repeats the pane total');
    assert.equal(q.parts.screen, undefined, 'intact channels are not billed');
    assert.equal(q.parts.shell, undefined);
    result.lightQuote = { parts: q.parts, total: q.total, button: q.button };
    result.lightRepairShare = {
      starterLeg: {
        label: starterLeg.label, netProfit: starterLeg.netProfit, grossRevenue: starterLeg.grossRevenue,
        unitsHeld: starterLeg.unitsHeld, boundBy: starterLeg.boundBy,
        repairOverNetProfit: starterLeg.netProfit > 0 ? q.total / starterLeg.netProfit : null,
      },
      capitalisedLeg: {
        label: capitalisedLeg.label, netProfit: capitalisedLeg.netProfit, grossRevenue: capitalisedLeg.grossRevenue,
        unitsHeld: capitalisedLeg.unitsHeld, boundBy: capitalisedLeg.boundBy,
        repairOverNetProfit: capitalisedLeg.netProfit > 0 ? q.total / capitalisedLeg.netProfit : null,
      },
      note: 'Two real legs on one seed. Route, spread and stock are seed-specific; this is not a campaign-wide or longitudinal balance claim.',
    };
    await shot('light-quote');

    // 2a. a low-credit light pilot, one UU short
    await c.eval('window.__ctx.world.credits = 293');
    const before = await channels();
    const refusedText = await pressRepair();
    assert.match(refusedText, /Not enough UU for the yard\./);
    assert.equal(await credits(), 293, 'a refused refit takes nothing');
    assert.deepEqual(await channels(), before, 'and leaves her exactly as damaged');
    result.lowCreditRefusal = { credits: 293, quote: q.total, notice: 'Not enough UU for the yard.' };
    await shot('light-unaffordable');

    // 2b. exactly the quote is affordable, and exactly the quote is taken
    await c.eval('window.__ctx.world.credits = 294');
    await quote();
    const paidText = await pressRepair();
    assert.match(paidText, /Yard crews make her whole\./);
    assert.equal(await credits(), 0, 'the displayed total is what left the purse');
    const whole = await channels();
    assert.equal(whole.hull, whole.hullMax);
    assert.equal(whole.engine, whole.engineMax);
    result.lightPayment = { charged: 294, creditsAfter: 0, channels: whole };
    const after = await quote();
    assert.equal(after.whole, true, 'a whole hull is quoted nothing');
    assert.equal(after.total, null);
    await checkpoint('light-repaired');
  }

  // ---- 3. a keeper comp still zeroes the bill --------------------------------
  {
    await damage('light', 0.62, 0.70);
    // A non-zero purse, so 'takes nothing' is a real observation rather than a
    // vacuous one against an empty account.
    await c.eval('window.__ctx.world.credits = 1500');
    await c.eval('window.__ctx.station.keeperComp = true');
    const q = await quote();
    assert.equal(q.comped, true, 'the comp note is rendered');
    assert.equal(q.total, 0);
    assert.equal(q.button, 0);
    assert.equal(q.parts.hull.cost, 0);
    assert.equal(q.parts.engine.cost, 0);
    const purse = await credits();
    await pressRepair();
    assert.equal(purse, 1500, 'the comp is tested against a purse that could have paid');
    assert.equal(await credits(), purse, 'a comped refit takes nothing');
    const whole = await channels();
    assert.equal(whole.hull, whole.hullMax, 'and still makes her whole');
    result.keeperComp = { total: q.total, creditsBefore: purse, creditsAfter: await credits() };
    await shot('keeper-comped');
    await c.eval('window.__ctx.station.keeperComp = false');
  }

  // ---- 4. the larger hull pays the larger class rate -------------------------
  {
    await damage('freighter', 0.62, 0.70);
    const q = await quote();
    assert.equal(q.parts.hull?.cost, 737, 'hull: ceil(136.4 × 0.9 × 6)');
    assert.equal(q.parts.engine?.cost, 353, 'engine: ceil(98 × 0.6 × 6)');
    assert.equal(q.total, 1090);
    assert.equal(q.button, 1090);
    result.freighterQuote = { parts: q.parts, total: q.total };
    await shot('freighter-quote');

    await c.eval('window.__ctx.world.credits = 1089');
    assert.match(await pressRepair(), /Not enough UU for the yard\./);
    assert.equal(await credits(), 1089, 'the bigger bill is refused whole, not part-paid');

    await c.eval('window.__ctx.world.credits = 5000');
    await quote();
    assert.match(await pressRepair(), /Yard crews make her whole\./);
    assert.equal(await credits(), 5000 - 1090, 'exactly the displayed freighter total is taken');
    const whole = await channels();
    assert.equal(whole.hull, whole.hullMax);
    assert.equal(whole.engine, whole.engineMax);
    result.freighterPayment = { charged: 1090, creditsAfter: await credits(), channels: whole };
    await checkpoint('freighter-repaired');
  }

  // ---- 5. the same damage is dearer on the bigger hull -----------------------
  result.classComparison = {
    light: result.lightQuote.total,
    freighter: result.freighterQuote.total,
    ratio: result.freighterQuote.total / result.lightQuote.total,
    note: 'Same 62% hull / 70% engine strip, same modifier 1, same berth.',
  };
  assert.ok(result.freighterQuote.total > result.lightQuote.total * 3,
    'the freighter bill is far above the light bill for identical proportional damage');

  result.checks = [
    'two real trader legs: market buy, plotted route, autopilot dock, market sell',
    'leg A flown on the purse the game gave the pilot; leg B on a declared working-capital fixture',
    'rendered light quote 168 + 126 = 294 UU at 62% hull / 70% engine',
    'intact channels billed nothing',
    'low-credit light pilot one UU short: refused, nothing taken, still damaged',
    'quote/payment parity on the light hull, purse to zero, hull whole',
    'a repaired hull is quoted nothing again',
    'keeper comp zeroes every line and the total, and still makes her whole',
    'freighter quote 737 + 353 = 1090 UU, refused one UU short, paid exactly at 5000',
    'the freighter bill exceeds the light bill for identical proportional damage',
  ];
}, { seed });
