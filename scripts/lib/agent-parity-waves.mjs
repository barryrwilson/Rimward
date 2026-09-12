// Agent play-parity gameplay waves (mission 43b34db25ae32972).
// The wave-141/142 scenario bodies live here EXACTLY once:
// scripts/agent-gameplay-test.mjs boots a fresh greenhand session and runs
// them, and scripts/boot-test.mjs invokes that runner as a checked fresh child
// process at its wave-141/142 slot (full aggregate coverage unchanged — the
// scenarios declare a fresh-session baseline the aggregate cannot provide
// in-process). Harness services (ctx, tick, nav) are injected; combat fixtures
// and calm pins come from the shared ./boot-harness.mjs conventions.
import * as THREE from 'three';
import { makeCombatFixtures, makeCalmPins } from './boot-harness.mjs';

// ---- Wave 141: agent play parity v2 (mission 43b34db25ae32972) --------------
// Screenshot-free role scenarios through the v2 handle. Staging that no player
// can do (spawn placement, hull pinning, credit seeding) is marked
// privilegedFixture in the ledger; every transition of record rides legal
// window.rimward acts or ordinary game systems. Deterministic: tick-driven,
// no wall-clock waits, no browser.
export async function runAgentParityWave141(deps) {
  const { ctx, tick, winListeners, undockStation, dockAtCurrentStation } = deps;
  const { dropDeferredHail: w30dropDeferredHail } = await import('../../src/systems/overlay-policy.js');
  const { expireSessionDeathCalm, spawnLiveShip, removeLiveShip } = await import('../../src/systems/npc.js');
  const {
    spawnPirate: w30spawnPirate, demandEvs: w30demandEvs,
    parkHostiles: w30parkHostiles, removeShip: w30removeShip,
  } = makeCombatFixtures({ ctx, tick, spawnLiveShip, removeLiveShip });
  const w125ExpireAi05 = makeCalmPins({ ctx, expireSessionDeathCalm });
  const rw141 = globalThis.window?.rimward;
  const { spawnSurvivorPod } = await import('../../src/game/pods.js');
  const ledger141 = [];
  const step141 = (scenario, name, res, note) => {
    ledger141.push({
      scenario, act: name,
      ok: !!(res && res.ok === true),
      token: res && typeof res.token === 'string' ? res.token : '',
      status: res && typeof res.status === 'string' ? res.status : '',
      reqId: res && typeof res.reqId === 'string' ? res.reqId : '',
      t: res && Number.isFinite(res.t) ? res.t : null,
      note: note || '',
    });
  };
  const obsEvents = (snap, type) => (snap && Array.isArray(snap.events) ? snap.events : []).filter((e) => e && e.type === type);
  const w141 = {};
  const saved = {
    optIn: ctx.agent?.optIn === true,
    paused: ctx.flags.paused === true,
    berthHold: ctx.flags.berthHold === true,
    docked: ctx.flags.docked === true,
    sys: ctx.world.currentSystem,
    pos: ctx.ship?.object?.position?.clone?.() || null,
    quat: ctx.ship?.object?.quaternion?.clone?.() || null,
    vel: ctx.ship?.velocity?.clone?.() || null,
    speed: ctx.ship?.speed,
    credits: ctx.world.credits,
    hull: ctx.player?.hull, hullMax: ctx.player?.hullMax,
    screen: ctx.player?.screen, screenMax: ctx.player?.screenMax,
    shell: ctx.player?.shell, shellMax: ctx.player?.shellMax,
    wpn: ctx.input.weaponGroup,
    throttle: ctx.input.throttle,
    fullStop: ctx.input.fullStop === true,
    ships: Array.isArray(ctx.ships) ? ctx.ships.slice() : [],
    pods: Array.isArray(ctx.pods) ? ctx.pods.slice() : [],
    jobs: Array.isArray(ctx.world.jobs) ? ctx.world.jobs.map((j) => ({ ...j })) : [],
    cargo: Array.isArray(ctx.cargo) ? ctx.cargo.map((c) => ({ ...c })) : [],
    rep: ctx.world.reputation && typeof ctx.world.reputation === 'object' ? { ...ctx.world.reputation } : {},
  };
  let seq141 = 91000;
  let threw141 = false;
  const ensureUndocked141 = (label) => {
    // A demand card or a desk level can eat the first Escape; resolve the card
    // like a player and press again, then fall back to the v2 undock act.
    for (let tries = 0; tries < 3 && ctx.flags.docked; tries++) {
      undockStation();
      if (!ctx.flags.docked) break;
      const hs = rw141.observe();
      const intents = hs && hs.hail && Array.isArray(hs.hail.intents) ? hs.hail.intents : [];
      if (hs && hs.hail && hs.hail.open === true && intents.length) {
        rw141.act({ v: 2, name: 'hailResolve', args: { intent: intents.includes('refuseFight') ? 'refuseFight' : intents[0] } });
        tick(1, `${label} hail clear`);
        continue;
      }
      rw141.act({ v: 2, name: 'undock', args: {} });
      tick(2, label);
    }
    return !ctx.flags.docked;
  };
  try {
    // ---- baseline: flying, unpaused, helms off, lease cleared ---------------
    if (ctx.flags.docked) undockStation();
    ctx.flags.paused = false;
    ctx.flags.berthHold = false;
    ctx.agent.optIn = true;
    ctx.input.fullStop = false;
    try { rw141.act({ v: 2, name: 'cancelAutopilot', args: {} }); } catch { /* none */ }
    try { rw141.act({ v: 2, name: 'cancelAutomine', args: {} }); } catch { /* none */ }
    if (ctx.flee) ctx.flee.engaged = false;
    rw141.act({ v: 2, name: 'clearControl', args: {} });
    tick(2, 'w141 baseline');

    // ---- 1. contract surface -------------------------------------------------
    const snapC = rw141.observe();
    w141.contract = !!(
      rw141 && rw141.version === 2
      && snapC && snapC.v === 2 && snapC.ok === true
      && snapC.capabilities && snapC.capabilities.version === 2
      && Object.keys(snapC.capabilities.roles).length === 10
      && Object.values(snapC.capabilities.roles).every((r) => r && r.status === 'supported')
      && Object.values(snapC.capabilities.services).every((s) => s && s.status === 'supported')
      && snapC.availability && snapC.availability.setControl && snapC.availability.stationAction
      && snapC.control && typeof snapC.control.state === 'string'
      && snapC.jobs && Array.isArray(snapC.jobs.offers) && Array.isArray(snapC.jobs.active)
      && snapC.station && snapC.station.view === null
    );
    let plain141 = false;
    try { JSON.stringify(snapC); plain141 = true; } catch { plain141 = false; }
    w141.contractJsonPlain = plain141;

    // ---- 2. control lease lifecycle ------------------------------------------
    const leaseSet = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 0.6, steerX: 0.5, fireHeld: false } });
    step141('lease', 'setControl', leaseSet);
    tick(2, 'w141 lease apply');
    const leaseApplied = ctx.input.steerX === 0.5 && rw141.observe().control.state === 'active';
    tick(60, 'w141 lease expiry'); // 1 sim-second > 0.6 ttl
    const obsExp = rw141.observe();
    const leaseExpired = obsExp.control.state === 'expired' && obsExp.control.reason === 'expired'
      && ctx.input.steerX !== 0.5;
    w141.leaseApplyExpire = !!(leaseSet.ok === true && leaseSet.status === 'active' && leaseApplied && leaseExpired);

    ctx.flags.paused = true;
    const pauseRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 1 } });
    ctx.flags.paused = false;
    ctx.flags.berthHold = true;
    const holdRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 1 } });
    ctx.flags.berthHold = false;
    const staleRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: 1, ttl: 1 } });
    const axisRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 1, steerX: 1.5 } });
    const ttlRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 0.001 } });
    w141.leaseGates = !!(
      pauseRefuse.ok === false && pauseRefuse.token === 'paused'
      && holdRefuse.ok === false && holdRefuse.token === 'held'
      && staleRefuse.ok === false && staleRefuse.token === 'stale'
      && axisRefuse.ok === false && axisRefuse.token === 'bad-axis'
      && ttlRefuse.ok === false && ttlRefuse.token === 'bad-ttl'
    );

    // Player emergency input wins: a held physical key drops the lease.
    rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 3, steerY: -0.4 } });
    tick(1, 'w141 override arm');
    for (const fn of winListeners.keydown ?? []) fn({ code: 'KeyD', repeat: false, preventDefault() {} });
    tick(1, 'w141 override tick');
    const overrideObs = rw141.observe();
    for (const fn of winListeners.keyup ?? []) fn({ code: 'KeyD', preventDefault() {} });
    tick(1, 'w141 override cleanup');
    w141.leasePlayerOverride = overrideObs.control.state === 'cleared' && overrideObs.control.reason === 'player-override';

    // Helm conflict: refuse, never steal.
    rw141.act({ v: 2, name: 'plotRoute', args: { dest: ctx.world.currentSystem === 'veridian' ? 'freehold' : 'veridian' } });
    const apOn = rw141.act({ v: 2, name: 'engageAutopilot', args: {} });
    const helmRefuse = rw141.act({ v: 2, name: 'setControl', args: { seq: ++seq141, ttl: 1 } });
    rw141.act({ v: 2, name: 'cancelAutopilot', args: {} });
    w141.leaseHelmRefuse = !!(apOn.ok === true && helmRefuse.ok === false && helmRefuse.token === 'helm');

    // ---- 3. hail role: demand card resolves by listed intent -----------------
    // privilegedFixture: credits seeded so tribute is legal; spawned hostile.
    w30parkHostiles('w141 park');
    ctx.world.credits = 4000;
    // Demand inputs pinned (the RW-006/wave-127 discipline): jump grace and
    // session death-calm expired, cargo aboard. A leftover deferred hail is
    // NOT dropped here: overlay-policy's slot is only one of the three places
    // a queued demand lives (hail.js keeps its own deferredDemand copy and the
    // hull keeps ai.demanding), so dropping the slot strands the queued card
    // instead of clearing it. The isolation loop below lets prior cards
    // surface through ordinary ticks and drains them through the hail API.
    if (ctx.world.time < (ctx.world.jumpGraceUntil ?? 0)) ctx.world.jumpGraceUntil = 0;
    w125ExpireAi05('w141 demand setup');
    ctx.cargo.length = 0;
    ctx.cargo.push({ commodity: 'provisions', units: 10 });
    // Fixture placement: outside the 300u station law zone (npc.js demand
    // guard requires hull AND pirate clear of it — the wave-30 law precedent).
    ctx.ship.object.position.set(400, 0, -300);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    tick(2, 'w141 law-zone stage');
    // ---- fixture isolation (hosted-boot repair) -----------------------------
    // The staging ticks above run the ordinary traffic systems, so an ambient
    // hostile can arrive AFTER the first park and hold a demand of its own:
    // either an open card or a deferred slot that opens on a later tick. The
    // pay act below resolves whichever card is open, so on the hosted boot the
    // paid receipt belonged to an ambient pirate while the fixture stayed
    // demanding. Park the late arrivals; the park ticks let a queued card
    // surface on its own, and it is drained through the ordinary hailResolve
    // path BEFORE the fixture spawns. Bounded, and a failure to settle is
    // reported (never suppressed) in the predicate below.
    let isolated141 = false;
    let isoRounds141 = 0;
    let isoDrains141 = 0;
    let isoNoSafeIntent141 = false;
    for (let round = 0; round < 6 && !isolated141; round++) {
      isoRounds141 = round + 1;
      w30parkHostiles('w141 isolate park');
      const snapIso = rw141.observe();
      const isoOpen = !!(snapIso && snapIso.hail && snapIso.hail.open === true);
      const isoIntents = snapIso && snapIso.hail && Array.isArray(snapIso.hail.intents) ? snapIso.hail.intents : [];
      if (isoOpen) {
        // Only plain close actions: never tribute, ransom, cargo or bluff, so
        // isolation cannot spend the seeded credits or move the fixture economy.
        const isoPick = ['refuseFight', 'keepFiring', 'letGo'].find((i) => isoIntents.includes(i));
        if (!isoPick) { isoNoSafeIntent141 = true; break; }
        rw141.act({ v: 2, name: 'hailResolve', args: { intent: isoPick } });
        isoDrains141++;
        tick(1, 'w141 isolate drain');
        continue;
      }
      const isoDemanding = (Array.isArray(ctx.ships) ? ctx.ships : [])
        .filter((s) => s && s.ai && s.ai.demanding === true).length;
      isolated141 = isoDemanding === 0;
    }
    const pDemand = w30spawnPirate('w141-demand', 95, [250, 0, 0]);
    // Authored identity of the fixture, read with the same precedence as the
    // demand speaker (npc.js demandSpeaker): record pilot, else state name.
    const speaker141 = (pDemand && pDemand.record && typeof pDemand.record.pilot === 'string' && pDemand.record.pilot)
      || (pDemand && pDemand.state && typeof pDemand.state.name === 'string' && pDemand.state.name)
      || '';
    // A paid close for THIS hull. Raw rows still carry the live ship ref, so
    // identity is exact; paying any other ship can never satisfy it.
    const paidForFoe141 = (rows) => (Array.isArray(rows) ? rows : [])
      .some((e) => e && e.type === 'hailClosed' && e.demandOutcome === 'paid' && e.ship === pDemand);
    // ---- hail diagnostics (read-only; ledger row emitted only on failure) ----
    // The hosted Ubuntu/Node20 boot reported hailDemand=false while the pay act
    // itself reported ok; the cause is now proven: an ambient pirate's card was
    // the open one, so the paid receipt named that hull (Gallows Wren) while
    // the fixture stayed demanding. The isolation above removes the competing
    // card and the identity terms below prove the fixture itself was paid.
    // These helpers copy scalars only: no live ship/context is stringified, no
    // emit/tick is patched, and observe() neither drains the ring nor advances
    // the sim, so every predicate, fixture act, tick(2) call and their order
    // below are byte-for-byte the originals.
    const dRows141 = (rows) => (Array.isArray(rows) ? rows : [])
      .filter((e) => e && e.type === 'hailClosed')
      .slice(-6)
      .map((e) => ({
        t: Number.isFinite(e.t) ? e.t : null,
        demandHail: typeof e.demandHail === 'boolean' ? e.demandHail : null,
        demandOutcome: typeof e.demandOutcome === 'string' ? e.demandOutcome : null,
        speaker: typeof e.speaker === 'string' ? e.speaker : null,
        demand: Number.isFinite(e.demand) ? e.demand : null,
        targetId: typeof e.targetId === 'string' || typeof e.targetId === 'number' ? e.targetId : null,
        targetName: typeof e.targetName === 'string' ? e.targetName : null,
        // Raw queue rows still hold the ship ref; report identity only.
        shipId: e.ship && (typeof e.ship.id === 'string' || typeof e.ship.id === 'number') ? e.ship.id : null,
        isDemandShip: e.ship ? e.ship === pDemand : null,
      }));
    const dTypes141 = (rows) => {
      const counts = {};
      for (const e of Array.isArray(rows) ? rows : []) {
        const ty = e && typeof e.type === 'string' ? e.type : '?';
        counts[ty] = (counts[ty] || 0) + 1;
      }
      return counts;
    };
    const dHail141 = (snap) => ({
      open: snap && snap.hail ? snap.hail.open === true : null,
      intents: snap && snap.hail && Array.isArray(snap.hail.intents) ? snap.hail.intents.slice(0, 8) : null,
      ringTypes: dTypes141(snap && Array.isArray(snap.events) ? snap.events : []),
      hailClosed: dRows141(snap && Array.isArray(snap.events) ? snap.events : []),
    });
    const dFoe141 = () => {
      const st = pDemand && pDemand.state ? pDemand.state : null;
      const ai = pDemand && pDemand.ai ? pDemand.ai : null;
      return {
        id: pDemand && (typeof pDemand.id === 'string' || typeof pDemand.id === 'number') ? pDemand.id : null,
        inShips: Array.isArray(ctx.ships) ? ctx.ships.includes(pDemand) : null,
        hasObject: pDemand ? !!pDemand.object : null,
        destroyed: st ? st.destroyed === true : null,
        disabled: st ? st.disabled === true : null,
        surrendered: st ? st.surrendered === true : null,
        hull: st && Number.isFinite(st.hull) ? st.hull : null,
        demanding: ai ? ai.demanding === true : null,
        demandSent: ai ? ai.demandSent === true : null,
        demandOutcome: ai && typeof ai.demandOutcome === 'string' ? ai.demandOutcome : null,
        demandAmount: ai && Number.isFinite(ai.demandAmount) ? ai.demandAmount : null,
        phase: ai && typeof ai.phase === 'string' ? ai.phase : null,
        band: ai && typeof ai.band === 'string' ? ai.band : null,
        mode: ai && typeof ai.mode === 'string' ? ai.mode : null,
      };
    };
    const dAct141 = (res) => ({
      ok: res ? res.ok === true : null,
      token: res && typeof res.token === 'string' ? res.token : null,
      error: res && typeof res.error === 'string' ? res.error : null,
      name: res && typeof res.name === 'string' ? res.name : null,
      status: res && typeof res.status === 'string' ? res.status : null,
      t: res && Number.isFinite(res.t) ? res.t : null,
    });
    // The fixture call, args and order are unchanged; only its return is kept.
    const openEvs141 = w30demandEvs(pDemand, 'w141 demand open');
    const diagOpen141 = {
      hailOpenedForFoe: (Array.isArray(openEvs141) ? openEvs141 : [])
        .some((e) => e && e.type === 'hailOpened' && e.ship === pDemand),
      hailOpenedAny: (Array.isArray(openEvs141) ? openEvs141 : []).some((e) => e && e.type === 'hailOpened'),
      types: dTypes141(openEvs141),
      flagHailOpen: ctx.flags ? ctx.flags.hailOpen === true : null,
      foe: dFoe141(),
    };
    const snapHail = rw141.observe();
    const intents = snapHail && snapHail.hail && Array.isArray(snapHail.hail.intents) ? snapHail.hail.intents : [];
    const diagBefore141 = { hail: dHail141(snapHail), foe: dFoe141(), credits: ctx.world.credits };
    const payRes = intents.includes('payTribute')
      ? rw141.act({ v: 2, name: 'hailResolve', args: { intent: 'payTribute' } })
      : { ok: false, token: 'no-intent' };
    // Read the LIVE frame queue before the tick below rotates and clears it.
    const diagActed141 = {
      pay: dAct141(payRes),
      hail: dHail141(rw141.observe()),
      rawQueueTypes: dTypes141(ctx.events),
      rawQueueHailClosed: dRows141(ctx.events),
      foe: dFoe141(),
      credits: ctx.world.credits,
    };
    // Raw identity of the paid close, read before the tick rotates the queue.
    const rawPaidAtAct141 = paidForFoe141(ctx.events);
    step141('hail', 'hailResolve', payRes);
    tick(2, 'w141 demand resolve');
    const snapHailAfter = rw141.observe();
    const paidRows141 = obsEvents(snapHailAfter, 'hailClosed').filter((e) => e.demandOutcome === 'paid');
    const hailOutcome = paidRows141.length > 0;
    // Identity: the paid receipt must name the authored fixture speaker, and a
    // raw paid close must carry the fixture hull itself (act frame or tick).
    const rawPaidForFoe141 = rawPaidAtAct141 || paidForFoe141(ctx.lastEvents) || paidForFoe141(ctx.events);
    const paidSpeakerMatch141 = speaker141 !== '' && paidRows141.some((e) => e.speaker === speaker141);
    w141.hailDemand = !!(isolated141 && intents.includes('payTribute') && payRes.ok === true && hailOutcome
      && rawPaidForFoe141 && paidSpeakerMatch141
      && snapHailAfter.hail.open === false);
    const badIntent = rw141.act({ v: 2, name: 'hailResolve', args: { intent: 'not-an-intent' } });
    w141.hailStaleClosed = badIntent.ok === false && (badIntent.token === 'closed' || badIntent.token === 'no-service');
    if (w141.hailDemand === false) {
      // Reads each predicate term separately so the ledger says WHICH one
      // failed: unsettled fixture isolation (a competing ambient card), no
      // listed payTribute (wrong/absent fixture hail), a refused pay act, a
      // card left open, a paid receipt that never reached the ring (lost
      // terminal event) versus an outcome-less plain close, or — the hosted
      // PR57 cause — a paid receipt that belongs to another hull.
      const afterRows141 = dRows141(snapHailAfter && Array.isArray(snapHailAfter.events) ? snapHailAfter.events : []);
      const diag141 = {
        node: process.version,
        platform: process.platform,
        predicate: {
          isolated: isolated141,
          listedPayTribute: intents.includes('payTribute'),
          payOk: payRes ? payRes.ok === true : null,
          hailOutcomePaid: hailOutcome,
          rawPaidForFoe: rawPaidForFoe141,
          paidSpeakerMatch: paidSpeakerMatch141,
          closedAfterTick: snapHailAfter && snapHailAfter.hail ? snapHailAfter.hail.open === false : null,
        },
        isolation: {
          rounds: isoRounds141, drains: isoDrains141, settled: isolated141,
          noSafeIntent: isoNoSafeIntent141,
        },
        identity: {
          fixtureSpeaker: speaker141,
          paidSpeakers: paidRows141.map((e) => (typeof e.speaker === 'string' ? e.speaker : null)),
          rawPaidAtAct: rawPaidAtAct141,
        },
        creditsSeeded: 4000,
        creditsDelta: {
          openToActed: diagActed141.credits - diagBefore141.credits,
          actedToAfterTick: ctx.world.credits - diagActed141.credits,
        },
        staleProbe: dAct141(badIntent),
        atOpen: diagOpen141,
        beforeAct: diagBefore141,
        afterAct: diagActed141,
        afterTick: {
          hail: dHail141(snapHailAfter),
          hailClosedOutcomes: afterRows141.map((r) => r.demandOutcome),
          foe: dFoe141(),
          credits: ctx.world.credits,
        },
        // Shape read: a demand close carries demandHail+demandOutcome; a plain
        // close carries neither. Both after tick(2) and in the raw frame queue.
        closeShape: {
          rawDemandCloses: diagActed141.rawQueueHailClosed.filter((r) => r.demandOutcome).length,
          rawPlainCloses: diagActed141.rawQueueHailClosed.filter((r) => !r.demandOutcome).length,
          ringDemandCloses: afterRows141.filter((r) => r.demandOutcome).length,
          ringPlainCloses: afterRows141.filter((r) => !r.demandOutcome).length,
        },
      };
      let note141 = '';
      try { note141 = JSON.stringify(diag141); } catch { note141 = 'diag-not-json-safe'; }
      ledger141.push({ scenario: 'hail', act: 'diag:hailDemand', note: note141 });
    }
    w30removeShip(pDemand);

    // ---- 4. combat + patrol terminal (mission family: patrol) ---------------
    // privilegedFixture: hull pinned so the agent cannot lose the fixture fight;
    // all fire/aim/kill transitions ride the real combat system via the lease.
    ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
    ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
    ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
    let kills = 0;
    let fireSeen141 = false;
    let hitSeen141 = false;
    let destroyedSeen141 = false;
    let fightDiag141 = ''; // last fightOnce exit diagnostics (ledger evidence)
    const fightOnce = (suffix) => {
      // The observation ring is JSON-plain: kill events carry targetId /
      // targetName derived from the victim (agent-schema SHIP_DERIVE), never
      // the live object. The merc kill's event lingers in the ring through
      // the patrol fights, so match THIS foe by its unique fixture identity —
      // the wave30 spawn names the record `Wave30 ${suffix}`.
      const foe = w30spawnPirate(suffix, 95, [220, 0, 0]);
      const foeName = `Wave30 ${suffix}`;
      const foeIds = new Set([foe.id, foe.record && foe.record.id].filter((v) => typeof v === 'string' || typeof v === 'number'));
      const isFoeEvent = (e) => e.ship === foe || e.targetName === foeName || foeIds.has(e.targetId);
      if (ctx.world.time < (ctx.world.jumpGraceUntil ?? 0)) ctx.world.jumpGraceUntil = 0;
      w30dropDeferredHail(foe);
      w125ExpireAi05(`w141 ${suffix} calm`);
      w30demandEvs(foe, `w141 ${suffix} demand`);
      rw141.act({ v: 2, name: 'hailResolve', args: { intent: 'refuseFight' } });
      tick(2, `w141 ${suffix} hostile`);
      const sel = rw141.act({ v: 2, name: 'selectTarget', args: { id: foe.id } });
      step141('combat', 'selectTarget', sel);
      if (!(sel && sel.ok === true)) {
        // Live rows spawned by the harness may carry no cycle id; fall back to
        // the ordinary cycle edge (foe is the only candidate after parking).
        rw141.act({ v: 2, name: 'selectTarget', args: {} });
        tick(1, `w141 ${suffix} cycle`);
        ctx.targets.current = ctx.targets.current || foe;
      }
      rw141.act({ v: 2, name: 'setWeaponGroup', args: { n: 1 } });
      let done = false;
      // The fire/hit/destroyed evidence flags are shared across every fight
      // (combatMercenary reads them), but the kill that ENDS this fight must
      // be this foe's: after the merc kill the shared destroyed flag is
      // already true, and breaking on it here would end every patrol fight
      // on iteration 0 with the quarry untouched.
      let foeDown = false;
      let iters = 0;
      let breakWhy = 'loop-end';
      let lastCur = 'none';
      const seenTypes = new Set();
      for (let i = 0; i < 60 * 90 && !done; i++) {
        iters += 1;
        const s = rw141.observe();
        const cur = s && s.targets && s.targets.current;
        const aim = s && s.targets && s.targets.aim;
        lastCur = cur && typeof cur.kind === 'string' ? cur.kind : 'none';
        if (!cur || cur.kind !== 'ship') { breakWhy = `lock-lost cur=${lastCur}`; break; } // lock lost: destroyed or despawned
        if (!aim || !Array.isArray(aim.bearing)) { tick(1, `w141 ${suffix} aim wait`); continue; } // the HUD publishes the digest the frame after a new lock
        const evs = s.events || [];
        for (const e of evs) {
          if (!e) continue;
          seenTypes.add(e.type);
          if (e.type === 'playerFire') fireSeen141 = true;
          if (e.type === 'npcHit') hitSeen141 = true;
          if (e.type === 'npcDestroyed' || e.type === 'npcDisabled') {
            destroyedSeen141 = true;
            if (isFoeEvent(e)) foeDown = true;
          }
        }
        if (foeDown) { breakWhy = 'foe-down'; done = true; break; }
        const aimPt = (aim.lead && Array.isArray(aim.lead.bearing)) ? aim.lead.bearing : aim.bearing;
        const sx = Math.max(-1, Math.min(1, aimPt[0] * 2.5));
        const sy = Math.max(-1, Math.min(1, aimPt[1] * 2.5));
        const aligned = aimPt[2] < -0.75 && Math.abs(aimPt[0]) < 0.3 && Math.abs(aimPt[1]) < 0.3;
        const ctl141f = rw141.act({
          v: 2, name: 'setControl',
          args: { seq: ++seq141, ttl: 0.5, steerX: sx, steerY: sy, fireHeld: aligned, throttle: 0.4 },
        });
        if (ctl141f && ctl141f.ok === false && ctl141f.token === 'overlay') {
          const hs141 = rw141.observe();
          const hi141 = hs141 && hs141.hail && Array.isArray(hs141.hail.intents) ? hs141.hail.intents : [];
          if (hs141 && hs141.hail && hs141.hail.open === true && hi141.length) {
            rw141.act({ v: 2, name: 'hailResolve', args: { intent: hi141.includes('refuseFight') ? 'refuseFight' : hi141[0] } });
          }
        }
        tick(3, `w141 ${suffix} fight`);
      }
      rw141.act({ v: 2, name: 'clearControl', args: {} });
      const dead = !!(foe.state && (foe.state.destroyed || foe.state.disabled));
      fightDiag141 = `iters=${iters} why=${breakWhy} cur=${lastCur} ai=${foe.ai && foe.ai.mode ? foe.ai.mode : '?'} destroyed=${!!(foe.state && foe.state.destroyed)} disabled=${!!(foe.state && foe.state.disabled)} surrendered=${!!(foe.state && foe.state.surrendered)} evs=${[...seenTypes].join(',')}`;
      w30removeShip(foe);
      return dead;
    };
    // Fixture placement: same law-zone-clear stage for the fixture fights.
    ctx.ship.object.position.set(400, 0, -300);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
    tick(2, 'w141 combat stage');
    if (fightOnce('w141-merc')) kills += 1;
    ledger141.push({ scenario: 'combat', act: 'terminal', note: `merc fire=${fireSeen141} hit=${hitSeen141} destroyed=${destroyedSeen141} kills=${kills} fight{${fightDiag141}}` });
    w141.combatMercenary = !!(fireSeen141 && hitSeen141 && destroyedSeen141 && kills >= 1);
    // Patrol contract: accept at the board, then a second real kill completes
    // via the existing tickPatrolJob path — terminal jobState must land.
    dockAtCurrentStation('w141 dock patrol');
    rw141.act({ v: 2, name: 'openService', args: { id: 'jobs' } });
    tick(1, 'w141 jobs open');
    const snapJobs = rw141.observe();
    const patrolOffer = (snapJobs.jobs.offers || []).find((j) => j && j.id === 'patrol-lane' && j.state === 'offered');
    let patrolDone = false;
    let patrolNote = '';
    if (patrolOffer) {
      const acc = rw141.act({ v: 2, name: 'acceptJob', args: { id: 'patrol-lane' } });
      step141('missions', 'acceptJob', acc);
      const inFlight = rw141.observe().jobs.active.some((j) => j && j.id === 'patrol-lane' && j.state === 'accepted');
      ensureUndocked141('w141 patrol undock');
      tick(2, 'w141 patrol undock');
      // Fixture placement: law-zone clear so the quarry presses the attack
      // instead of breaking off and outrunning the chase.
      ctx.ship.object.position.set(400, 0, -300);
      ctx.ship.velocity.set(0, 0, 0);
      ctx.ship.speed = 0;
      tick(2, 'w141 patrol stage');
      const inFlightUndocked = rw141.observe().jobs.active.some((j) => j && j.id === 'patrol-lane');
      w141.jobInFlight = !!(acc.ok === true && inFlight && inFlightUndocked);
      const need = Number.isFinite(patrolOffer.need) ? patrolOffer.need : 2;
      // tickPatrolJob (station.js) counts only kills while the contract is
      // accepted — the pre-acceptance merc kill above must NOT count toward
      // `need` here. Track the live contract's progress and stop as soon as
      // the terminal lands; stall twice without progress and fail promptly
      // with the last observed state instead of ticking on blindly.
      const patrolJob = () => (ctx.world.jobs || []).find((j) => j && j.id === 'patrol-lane') || null;
      let progress = Number.isFinite(patrolJob()?.progress) ? patrolJob().progress : 0;
      let fights = 0;
      let stalls = 0;
      while (progress < need && fights < need + 2 && stalls < 2) {
        if (!fightOnce(`w141-patrol-${fights}`)) { stalls += 1; continue; }
        fights += 1;
        tick(10, 'w141 patrol progress');
        const now = patrolJob();
        const seen = now && Number.isFinite(now.progress) ? now.progress : progress;
        stalls = seen > progress ? 0 : stalls + 1;
        progress = seen;
        if (patrolJob()?.state === 'done') break;
      }
      tick(40, 'w141 patrol tick');
      const snapPatrol = rw141.observe();
      patrolDone = obsEvents(snapPatrol, 'jobState').some((e) => e.id === 'patrol-lane' && e.outcome === 'done');
      patrolNote = patrolDone ? 'terminal jobState done' : `terminal missing progress=${progress}/${need} fights=${fights} stalls=${stalls} lastFight{${fightDiag141}}`;
    } else {
      patrolNote = 'fixture-gap: patrol-lane not offered';
      w141.jobInFlight = false;
    }
    ledger141.push({ scenario: 'missions', act: 'terminal', note: patrolNote });
    w141.missionPatrolTerminal = patrolDone;

    // ---- 5. rescue role: scoop a survivor pod, return at People --------------
    // privilegedFixture: pod placement; the scoop, dock, and People-desk return
    // are ordinary player systems.
    ensureUndocked141('w141 rescue undock');
    // privilegedFixture: clear the hold (the wave-127 cargo-pin convention) —
    // the scoop refuses silently when used + incoming > cargoCapacity
    // (pods.js), and the fights above leave the demand-staging provisions plus
    // any magneted ore aboard.
    ctx.cargo.length = 0;
    // privilegedFixture: the pod sits 25 u off the NOSE, not 25 u along world
    // +X. The hull leaves the patrol fight above at ~60 u/s on whatever
    // heading that seeded fight ended on; a world-axis drop can land the pod
    // abeam, inside the hull's turn radius, and the bearing chase below then
    // orbits it for the whole window without ever closing (seen when an
    // unrelated change shifted the seeded RNG stream). The scoop, the bearing
    // steer, the dock and the People-desk return are unchanged.
    const pp = ctx.ship.object.position;
    const nose141 = new THREE.Vector3(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion);
    const pod141 = spawnSurvivorPod(ctx, new THREE.Vector3(pp.x, pp.y, pp.z).addScaledVector(nose141, 25), { faction: 'freehold', source: 'other' });
    tick(2, 'w141 pod spawn');
    let scooped = false;
    for (let i = 0; i < 60 * 20 && !scooped; i++) {
      const s = rw141.observe();
      const podRow = (s.targets.nearby || []).find((r) => r && r.kind === 'pod');
      if (obsEvents(s, 'podCollected').length > 0) { scooped = true; break; }
      // State backstop (the wave-142 recovery convention): the pod is gone
      // and the survivor sits in the hold — only the real proximity scoop
      // merges survivor cargo, but the 16-row ring can evict podCollected
      // before the next observe.
      if (!ctx.pods.includes(pod141) && ctx.cargo.some((c) => c && c.commodity === 'survivor')) { scooped = true; break; }
      if (!podRow || !Array.isArray(podRow.bearing)) break;
      const b = podRow.bearing;
      const ctl141p = rw141.act({
        v: 2, name: 'setControl',
        args: { seq: ++seq141, ttl: 0.5, steerX: Math.max(-1, Math.min(1, b[0] * 2.5)), steerY: Math.max(-1, Math.min(1, b[1] * 2.5)), throttle: Math.max(0.05, Math.min(0.5, (Number.isFinite(podRow.range) ? podRow.range : 999) / 120)) },
      });
      if (ctl141p && ctl141p.ok === false && ctl141p.token === 'overlay') {
        const hp141 = rw141.observe();
        const pi141 = hp141 && hp141.hail && Array.isArray(hp141.hail.intents) ? hp141.hail.intents : [];
        if (hp141 && hp141.hail && hp141.hail.open === true && pi141.length) {
          rw141.act({ v: 2, name: 'hailResolve', args: { intent: pi141.includes('refuseFight') ? 'refuseFight' : pi141[0] } });
        }
      }
      tick(3, 'w141 pod approach');
    }
    rw141.act({ v: 2, name: 'clearControl', args: {} });
    const survivorAboard = ctx.cargo.some((c) => c && c.commodity === 'survivor');
    dockAtCurrentStation('w141 dock rescue');
    rw141.act({ v: 2, name: 'openService', args: { id: 'people' } });
    tick(1, 'w141 people open');
    const snapPeople = rw141.observe();
    const peopleView = snapPeople && snapPeople.station && snapPeople.station.view;
    const rescueAction = peopleView && Array.isArray(peopleView.actions)
      ? peopleView.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Return survivors'))
      : null;
    let rescueRes = null;
    if (rescueAction) rescueRes = rw141.act({ v: 2, name: 'stationAction', args: { n: rescueAction.n, expect: rescueAction.label } });
    step141('rescue', 'stationAction', rescueRes || { ok: false, token: 'not-offered' }, `scooped=${scooped} aboard=${survivorAboard} hold=${ctx.cargo.reduce((n, c) => n + (c && Number.isFinite(c.units) ? c.units : 0), 0)}/${ctx.cargoCapacity} action=${rescueAction ? 'listed' : 'missing'}`);
    tick(2, 'w141 rescue settle');
    const snapRescue = rw141.observe();
    const rescueEv = obsEvents(snapRescue, 'survivorRescued').length > 0
      || (snapRescue.events || []).some((e) => e && e.type === 'commLine' && typeof e.text === 'string' && e.text.includes('Standing +'));
    w141.rescueRole = !!(pod141 && scooped && survivorAboard && rescueAction && rescueRes && rescueRes.ok === true && rescueEv);

    // ---- 6. station services sweep (bar/outfitting/people/epics/shipyard) ----
    // Every desk: structured rows + actions visible; real closures exercised
    // where free or cheap; two-step papers proved by arm→cancel.
    const svcOk = {};
    const svcSweep = ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'epics', 'shipyard'];
    for (const svc of svcSweep) {
      rw141.act({ v: 2, name: 'openService', args: { id: svc } });
      tick(1, `w141 svc ${svc}`);
      const v = rw141.observe().station.view;
      svcOk[svc] = !!(v && v.service === svc && Array.isArray(v.rows) && v.rows.length > 0);
    }
    w141.serviceViews = svcSweep.every((s) => svcOk[s]);
    // Bar: buy a round through the player closure; credits must drop.
    rw141.act({ v: 2, name: 'openService', args: { id: 'bar' } });
    tick(1, 'w141 bar open');
    const barView = rw141.observe().station.view;
    const roundBtn = barView.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Buy a round'));
    const credBeforeBar = ctx.world.credits;
    const roundRes = roundBtn ? rw141.act({ v: 2, name: 'stationAction', args: { n: roundBtn.n, expect: roundBtn.label } }) : null;
    step141('services', 'stationAction:buyRound', roundRes || { ok: false, token: 'not-offered' });
    w141.barRound = !!(roundBtn && roundRes && roundRes.ok === true && ctx.world.credits < credBeforeBar);
    // Outfitting: papers are a two-step flow — arm then cancel, no debit.
    rw141.act({ v: 2, name: 'openService', args: { id: 'outfitting' } });
    tick(1, 'w141 outfit open');
    const outView = rw141.observe().station.view;
    const armBtn = outView.actions.find((a) => a && typeof a.label === 'string' && / — .+\(\d+ UU\)$/.test(a.label) && a.label.startsWith('8'));
    let papersOk = false;
    if (armBtn) {
      rw141.act({ v: 2, name: 'stationAction', args: { n: armBtn.n, expect: armBtn.label } });
      const armed = rw141.observe().station.view;
      const cancelBtn = armed && Array.isArray(armed.actions)
        ? armed.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Cancel'))
        : null;
      const credArmed = ctx.world.credits;
      if (armed && armed.pending === true && cancelBtn) {
        rw141.act({ v: 2, name: 'stationAction', args: { n: cancelBtn.n, expect: cancelBtn.label } });
        const after = rw141.observe().station.view;
        papersOk = after && after.pending === false && ctx.world.credits === credArmed;
      }
    } else {
      // No launcher seat on this hull: a note row is the player-visible answer.
      papersOk = outView.rows.some((r) => r && typeof r.text === 'string' && r.text.includes('no launcher hardpoint'));
    }
    w141.outfitPapersLifecycle = papersOk;
    // Shipyard: pane tabs and a free mount of the already-mounted hull.
    rw141.act({ v: 2, name: 'openService', args: { id: 'shipyard' } });
    tick(1, 'w141 yard open');
    const yardView = rw141.observe().station.view;
    const hangarTab = yardView.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Hangar'));
    const yardTab = yardView.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Yard'));
    let yardOk = !!(hangarTab && yardTab);
    if (yardOk) {
      rw141.act({ v: 2, name: 'stationAction', args: { n: yardTab.n, expect: yardTab.label } });
      const buyPane = rw141.observe().station.view;
      const backBtn = buyPane.actions.find((a) => a && typeof a.label === 'string' && a.label.includes('Back'));
      yardOk = !!(buyPane && buyPane.rows.some((r) => r && typeof r.text === 'string' && r.text === 'YARD'));
      if (backBtn) rw141.act({ v: 2, name: 'stationAction', args: { n: backBtn.n, expect: backBtn.label } });
    }
    w141.shipyardPanes = yardOk;
    // Stale expect refuses: a re-planned index with the wrong label clicks nothing.
    const staleBar = roundBtn
      ? rw141.act({ v: 2, name: 'openService', args: { id: 'bar' } })
      : null;
    void staleBar;
    tick(1, 'w141 bar reopen');
    const staleProbe = roundBtn
      ? rw141.act({ v: 2, name: 'stationAction', args: { n: roundBtn.n, expect: 'deliberately wrong' } })
      : { ok: true };
    w141.staleExpectRefused = !roundBtn || (staleProbe.ok === false && staleProbe.token === 'stale');
    undockStation();

    // ---- 7. death / recovery --------------------------------------------------
    // privilegedFixture: the destroy event itself is staged; the phase
    // observation and recover() ride the real overlay path (Enter/click/timer).
    ctx.emit('playerDestroyed', {});
    tick(2, 'w141 death consume');
    const snapDead = rw141.observe();
    const deadPhase = snapDead.session && snapDead.session.phase === 'dead';
    const deadEv = obsEvents(snapDead, 'playerDestroyed').length > 0;
    const recRes = rw141.act({ v: 2, name: 'recover', args: {} });
    step141('session', 'recover', recRes);
    tick(3, 'w141 recover');
    const snapRec = rw141.observe();
    w141.deathRecovery = !!(
      deadPhase && deadEv && recRes.ok === true
      && snapRec.session && snapRec.session.phase === 'playing'
      && obsEvents(snapRec, 'recovered').length > 0
      && snapRec.control && snapRec.control.state !== 'active'
    );
  } catch (e) {
    threw141 = true;
    console.log('WAVE141 ERR', e && e.message ? e.message : e);
  } finally {
    try { rw141.act({ v: 2, name: 'clearControl', args: {} }); } catch { /* ignore */ }
    if (ctx.flee) ctx.flee.engaged = false;
    try { rw141.act({ v: 2, name: 'cancelAutopilot', args: {} }); } catch { /* ignore */ }
    try { rw141.act({ v: 2, name: 'cancelAutomine', args: {} }); } catch { /* ignore */ }
    ctx.agent.optIn = saved.optIn;
    ctx.flags.paused = saved.paused;
    ctx.flags.berthHold = saved.berthHold;
    ctx.input.weaponGroup = saved.wpn;
    ctx.input.throttle = saved.throttle;
    ctx.input.fullStop = saved.fullStop;
    if (Number.isFinite(saved.credits)) ctx.world.credits = saved.credits;
    if (ctx.player && Number.isFinite(saved.hullMax)) {
      ctx.player.hullMax = saved.hullMax;
      ctx.player.hull = saved.hull;
      ctx.player.screenMax = saved.screenMax;
      ctx.player.screen = saved.screen;
      ctx.player.shellMax = saved.shellMax;
      ctx.player.shell = saved.shell;
    }
    if (Array.isArray(ctx.ships)) {
      ctx.ships.length = 0;
      for (const s of saved.ships) ctx.ships.push(s);
    }
    if (Array.isArray(ctx.pods)) {
      for (const p of saved.pods) if (!ctx.pods.includes(p)) ctx.pods.push(p);
    }
    if (Array.isArray(ctx.world.jobs) && saved.jobs.length) {
      const liveIds = new Set(ctx.world.jobs.map((j) => j && j.id));
      for (const j of saved.jobs) {
        if (!j || !j.id) continue;
        const live = ctx.world.jobs.find((x) => x && x.id === j.id);
        if (live) Object.assign(live, j);
        else if (!liveIds.has(j.id)) ctx.world.jobs.push(j);
      }
    }
    if (Array.isArray(ctx.cargo)) {
      ctx.cargo.length = 0;
      for (const c of saved.cargo) ctx.cargo.push(c);
    }
    if (saved.rep && ctx.world.reputation) Object.assign(ctx.world.reputation, saved.rep);
    if (saved.pos && ctx.ship?.object?.position) ctx.ship.object.position.copy(saved.pos);
    if (saved.quat && ctx.ship?.object?.quaternion) ctx.ship.object.quaternion.copy(saved.quat);
    if (typeof saved.sys === 'string' && saved.sys && ctx.world.currentSystem !== saved.sys) {
      ctx.world.currentSystem = saved.sys;
      ctx.emit('systemLoaded', { to: saved.sys });
      tick(2, 'w141 restore sys');
    }
    if (saved.docked) {
      if (!ctx.flags.docked) dockAtCurrentStation('w141 restore dock');
    } else if (ctx.flags.docked) {
      undockStation();
    }
    tick(1, 'w141 restore');
  }
  w141.noThrow = threw141 === false;
  console.log('wave141 ledger:', JSON.stringify(ledger141));
  console.log('wave141 agent-parity:', JSON.stringify(w141));
  return { flags: w141, ledger: ledger141, ok: Object.values(w141).every(Boolean) };
}

// ---- Wave 142: mission-family parity scenarios (mission 43b34db25ae32972) --
// One executable scenario per generated job family, plus a genuinely
// unprivileged combat path (normal hull/resources, real observed outcome).
// Staging no player can do (position sets, fixture records, credit seeding,
// contract-kill hull pinning, asset priming) is marked privilegedFixture in
// the ledger and never counts as the transition of record; every terminal
// rides legal window.rimward acts and ordinary game systems (tickDeliveryJobs
// / tickRecoveryCollect / mystery proximity discovery / real combat kills).
export async function runAgentParityWave142(deps) {
  const { ctx, tick, winListeners, undockStation, dockAtCurrentStation, travelTo, SYSTEMS } = deps;
  const { dropDeferredHail: w30dropDeferredHail } = await import('../../src/systems/overlay-policy.js');
  const { expireSessionDeathCalm, spawnLiveShip, removeLiveShip } = await import('../../src/systems/npc.js');
  const { primeShipAsset } = await import('../../src/systems/ship-assets.js');
  const {
    spawnPirate: w30spawnPirate, demandEvs: w30demandEvs,
    parkHostiles: w30parkHostiles, removeShip: w30removeShip,
  } = makeCombatFixtures({ ctx, tick, spawnLiveShip, removeLiveShip });
  const w125ExpireAi05 = makeCalmPins({ ctx, expireSessionDeathCalm });
  const rw142 = globalThis.window?.rimward;
  const ledger142 = [];
  const step142 = (scenario, name, res, note) => {
    ledger142.push({
      scenario, act: name,
      ok: !!(res && res.ok === true),
      token: res && typeof res.token === 'string' ? res.token : '',
      status: res && typeof res.status === 'string' ? res.status : '',
      reqId: res && typeof res.reqId === 'string' ? res.reqId : '',
      t: res && Number.isFinite(res.t) ? res.t : null,
      note: note || '',
    });
  };
  const term142 = (scenario, ok, note) => {
    ledger142.push({ scenario, act: 'terminal', ok: ok === true, token: '', status: '', reqId: '', t: null, note: note || '' });
  };
  const obsEvents142 = (snap, type) => (snap && Array.isArray(snap.events) ? snap.events : []).filter((e) => e && e.type === type);
  const hold142 = (key) => {
    let n = 0;
    for (const c of ctx.cargo || []) {
      if (c && c.commodity === key && Number.isFinite(c.units)) n += c.units;
    }
    return n;
  };
  const clamp142 = (v) => Math.max(-1, Math.min(1, v));
  const w142 = {
    combatUnprivileged: false,
    missionExplore: false,
    missionMining: false,
    missionTrade: false,
    missionPassenger: false,
    missionEspionage: false,
    missionHunt: false,
    missionWar: false,
    missionBounty: false,
    missionRecovery: false,
    noThrow: false,
  };
  const fixtureRecs = []; // {arr, rec} pushed by fixtures; removed in finally
  const movedShips = []; // {ship, pos} pre-existing ships re-positioned
  const killedRecs = []; // {rec, state} real records whose state is restored
  const spawned142 = new Set(); // live ships instantiated by fixtures
  let pinned142 = false;
  const saved142 = {
    optIn: ctx.agent?.optIn === true,
    paused: ctx.flags.paused === true,
    berthHold: ctx.flags.berthHold === true,
    docked: ctx.flags.docked === true,
    sys: ctx.world.currentSystem,
    pos: ctx.ship?.object?.position?.clone?.() || null,
    quat: ctx.ship?.object?.quaternion?.clone?.() || null,
    vel: ctx.ship?.velocity?.clone?.() || null,
    speed: ctx.ship?.speed,
    credits: ctx.world.credits,
    hull: ctx.player?.hull, hullMax: ctx.player?.hullMax,
    screen: ctx.player?.screen, screenMax: ctx.player?.screenMax,
    shell: ctx.player?.shell, shellMax: ctx.player?.shellMax,
    wpn: ctx.input.weaponGroup,
    throttle: ctx.input.throttle,
    fullStop: ctx.input.fullStop === true,
    ships: Array.isArray(ctx.ships) ? ctx.ships.slice() : [],
    pods: Array.isArray(ctx.pods) ? ctx.pods.slice() : [],
    jobs: Array.isArray(ctx.world.jobs) ? ctx.world.jobs.map((j) => ({ ...j })) : [],
    cargo: Array.isArray(ctx.cargo) ? ctx.cargo.map((c) => ({ ...c })) : [],
    rep: ctx.world.reputation && typeof ctx.world.reputation === 'object' ? { ...ctx.world.reputation } : {},
    aftermath: Array.isArray(ctx.world.aftermath) ? ctx.world.aftermath.slice() : [],
    incidents: Array.isArray(ctx.world.incidents) ? ctx.world.incidents.slice() : [],
    visited: Array.isArray(ctx.world.mystery?.visited) ? ctx.world.mystery.visited.slice() : [],
    fear: ctx.world.fear,
  };
  let seq142 = 97000;
  let threw142 = false;
  const pinHull142 = (on) => {
    // privilegedFixture: contract-kill invulnerability. Never asserted as
    // survival/skill evidence — only the kill and jobState terminal count.
    if (on) {
      ctx.player.hullMax = 1e9; ctx.player.hull = 1e9;
      ctx.player.screenMax = 1e9; ctx.player.screen = 1e9;
      ctx.player.shellMax = 1e9; ctx.player.shell = 1e9;
      pinned142 = true;
    } else if (pinned142) {
      ctx.player.hullMax = saved142.hullMax; ctx.player.hull = saved142.hull;
      ctx.player.screenMax = saved142.screenMax; ctx.player.screen = saved142.screen;
      ctx.player.shellMax = saved142.shellMax; ctx.player.shell = saved142.shell;
      pinned142 = false;
    }
  };
  try {
    // ---- baseline: flying, unpaused, helms off, lease cleared, freehold ----
    if (ctx.flags.docked) undockStation();
    ctx.flags.paused = false;
    ctx.flags.berthHold = false;
    ctx.agent.optIn = true;
    ctx.input.fullStop = false;
    try { rw142.act({ v: 2, name: 'cancelAutopilot', args: {} }); } catch { /* none */ }
    try { rw142.act({ v: 2, name: 'cancelAutomine', args: {} }); } catch { /* none */ }
    if (ctx.flee) ctx.flee.engaged = false;
    rw142.act({ v: 2, name: 'clearControl', args: {} });
    if (ctx.world.currentSystem !== 'freehold') {
      // Harness staging (wave-restore convention): the family scenarios run
      // off the freehold board. No transition of record.
      ctx.world.currentSystem = 'freehold';
      ctx.emit('systemLoaded', { to: 'freehold' });
    }
    tick(2, 'w142 baseline');

    const stageAt142 = (x, y, z, label) => {
      // privilegedFixture staging: position/velocity set, nothing else.
      ctx.ship.object.position.set(x, y, z);
      ctx.ship.velocity.set(0, 0, 0);
      ctx.ship.speed = 0;
      tick(2, label);
    };
    const ensureDocked142 = (label) => {
      if (!ctx.flags.docked) dockAtCurrentStation(label);
    };
    const ensureUndocked142 = (label) => {
      // A demand card or a desk level eats the first Escape; resolve the card
      // like a player and press again, then fall back to the v2 undock act.
      for (let tries = 0; tries < 3 && ctx.flags.docked; tries++) {
        undockStation();
        if (!ctx.flags.docked) break;
        const hs = rw142.observe();
        const intents = hs && hs.hail && Array.isArray(hs.hail.intents) ? hs.hail.intents : [];
        if (hs && hs.hail && hs.hail.open === true && intents.length) {
          rw142.act({ v: 2, name: 'hailResolve', args: { intent: intents.includes('refuseFight') ? 'refuseFight' : intents[0] } });
          tick(1, `${label} hail clear`);
          continue;
        }
        rw142.act({ v: 2, name: 'undock', args: {} });
        tick(2, label);
      }
      return !ctx.flags.docked;
    };
    const recoverIfDead142 = (label) => {
      // A stranded death overlay poisons every later act; ride the real
      // recovery path (berth restore) before continuing the wave.
      const sp = rw142.observe();
      if (!(sp && sp.session && sp.session.phase === 'dead')) return false;
      rw142.act({ v: 2, name: 'recover', args: {} });
      tick(3, label);
      return true;
    };
    const openJobs142 = (label) => {
      rw142.act({ v: 2, name: 'openService', args: { id: 'jobs' } });
      tick(1, label);
      rw142.observe(); // station.view capture renders the board — syncs run
    };
    const offers142 = (kind) => {
      const snap = rw142.observe();
      const list = snap && snap.jobs && Array.isArray(snap.jobs.offers) ? snap.jobs.offers : [];
      return list.filter((j) => j && j.kind === kind && j.state === 'offered'
        && (typeof j.originSystem !== 'string' || j.originSystem === ctx.world.currentSystem));
    };
    const accept142 = (scenario, id) => {
      const res = rw142.act({ v: 2, name: 'acceptJob', args: { id } });
      step142(scenario, 'acceptJob', res);
      tick(1, `w142 ${scenario} accept`);
      return res;
    };
    const liveJob142 = (id) => (ctx.world.jobs || []).find((j) => j && j.id === id) || null;
    const awaitJobState142 = (id, outcomes, capTicks, label) => {
      const want = Array.isArray(outcomes) ? outcomes : [outcomes];
      for (let i = 0; i < capTicks; i += 10) {
        tick(10, label);
        const snap = rw142.observe();
        if (obsEvents142(snap, 'jobState').some((e) => e && e.id === id && want.includes(e.outcome))) return true;
      }
      return false;
    };
    const findRec142 = (recId) => {
      if (typeof recId !== 'string' || !recId) return null;
      const banks = ctx.world.recordBanks;
      const pools = [];
      if (banks && typeof banks === 'object' && !Array.isArray(banks)) {
        if (Array.isArray(banks.freehold)) pools.push(banks.freehold);
        if (Array.isArray(banks.veridian)) pools.push(banks.veridian);
      }
      if (Array.isArray(ctx.world.records)) pools.push(ctx.world.records);
      for (const arr of pools) {
        const rec = arr.find((r) => r && r.id === recId);
        if (rec) return rec;
      }
      return null;
    };
    const liveForRec142 = (rec, offset, label) => {
      // privilegedFixture placement: re-position the record's live ship when
      // one exists (w30parkHostiles precedent), else instantiate from the
      // record at the staged offset. The fight itself is the real combat loop.
      const p = ctx.ship.object.position;
      const cur = ctx.ships.find((s) => s && s.record && s.record.id === rec.id
        && !(s.state && s.state.destroyed === true));
      if (cur) {
        if (!movedShips.some((m) => m.ship === cur)) {
          movedShips.push({ ship: cur, pos: cur.object.position.clone() });
        }
        cur.object.position.set(p.x + offset[0], p.y + offset[1], p.z + offset[2]);
        tick(2, label);
        return cur;
      }
      const live = spawnLiveShip(ctx, rec, new THREE.Vector3(p.x + offset[0], p.y + offset[1], p.z + offset[2]));
      if (!live) return null;
      ctx.ships.push(live); // traffic owns this list in production; the harness drives by hand
      spawned142.add(live);
      tick(2, label);
      return live;
    };
    const fight142 = (scenario, live, recName, terminals) => {
      // Resolve an open demand card first (the lease refuses while the
      // overlay owns input), then close and fire through the control lease.
      if (ctx.world.time < (ctx.world.jumpGraceUntil ?? 0)) ctx.world.jumpGraceUntil = 0;
      w30dropDeferredHail(live);
      w125ExpireAi05(`w142 ${scenario} calm`);
      w30demandEvs(live, `w142 ${scenario} demand`);
      rw142.act({ v: 2, name: 'hailResolve', args: { intent: 'refuseFight' } });
      tick(2, `w142 ${scenario} hostile`);
      const sel = rw142.act({ v: 2, name: 'selectTarget', args: { id: live.id } });
      step142(scenario, 'selectTarget', sel);
      if (!(sel && sel.ok === true)) {
        // Harness-spawned rows may carry no cycle id; fall back to the
        // ordinary cycle edge (the foe is the only candidate after parking).
        rw142.act({ v: 2, name: 'selectTarget', args: {} });
        tick(1, `w142 ${scenario} cycle`);
        if (!ctx.targets.current) ctx.targets.current = live; // fixture lock fallback
      }
      rw142.act({ v: 2, name: 'setWeaponGroup', args: { n: 1 } });
      let fire = false;
      let hit = false;
      let out = 'timeout';
      // Diagnostics for the terminal note: ring identity can differ from the
      // record name (the ring derives state.name first), so capture what the
      // fight actually saw. The foe id set covers live + record ids.
      const foeIds142 = new Set([live.id, live.record && live.record.id].filter((v) => typeof v === 'string' || typeof v === 'number'));
      const isFoe142 = (e) => e.targetName === recName || foeIds142.has(e.targetId);
      const seen142 = new Set();
      const names142 = new Set();
      let iters142 = 0;
      let why142 = 'loop-end';
      for (let i = 0; i < 60 * 90; i++) {
        iters142 += 1;
        const s = rw142.observe();
        if (s && s.session && s.session.phase === 'dead') { out = 'died'; why142 = 'died'; break; }
        // Scan events BEFORE the lock check: a killing blow clears the target
        // lock in the same frame the npcDestroyed event lands in the ring, so
        // a lock-first break would report a real kill as 'lock-lost'.
        for (const e of s.events || []) {
          if (!e) continue;
          seen142.add(e.type);
          if ((e.type === 'npcHit' || e.type === 'npcDestroyed' || e.type === 'npcDisabled' || e.type === 'npcSurrendered') && e.targetName) names142.add(String(e.targetName));
          if (e.type === 'playerFire') fire = true;
          if (e.type === 'npcHit' && isFoe142(e)) hit = true;
          if (terminals.includes(e.type) && isFoe142(e)) out = 'resolved';
        }
        if (out === 'resolved') { why142 = 'resolved'; break; }
        const cur = s && s.targets && s.targets.current;
        const aim = s && s.targets && s.targets.aim;
        if (!cur || cur.kind !== 'ship') { why142 = `lock-lost cur=${cur && cur.kind ? cur.kind : 'none'}`; break; } // lock lost: destroyed or despawned
        if (!aim || !Array.isArray(aim.bearing)) { tick(1, `w142 ${scenario} aim wait`); continue; } // the HUD publishes the digest the frame after a new lock
        const aimPt = (aim.lead && Array.isArray(aim.lead.bearing)) ? aim.lead.bearing : aim.bearing;
        const sx = clamp142(aimPt[0] * 2.5);
        const sy = clamp142(aimPt[1] * 2.5);
        const aligned = aimPt[2] < -0.75 && Math.abs(aimPt[0]) < 0.3 && Math.abs(aimPt[1]) < 0.3;
        // Throttle is a turn-rate control, not just a closing control. The
        // shared flight law (flight-feel.js turnRateFor) is speed-linked —
        // omega = min(TURN_MAX, max(speed, 8) / TURN_MIN_RADIUS) — so a
        // constant 0.4 throttle held the player light near omega ~0.5 rad/s
        // while a hunting cutter orbits at up to 0.9. The chase settled into
        // a stable pursuit lag (bearing parked ~0.37 off the nose, just
        // outside the 0.3 fire gate), fireHeld never latched, and the foe's
        // screen recharged between the stray hits — a 5400-iteration
        // stalemate with fire=true hit=true and no terminal. Fly the merge:
        // full power while the nose is off the foe, so the player turns at
        // the class cap and the lag closes; ease off only once the shot is
        // lined up inside gun range, where a slower pass keeps it there.
        const aimDist142 = Number.isFinite(aim.dist) ? aim.dist : 0;
        const throttle142 = (aligned && aimDist142 > 0 && aimDist142 < 260) ? 0.25 : 1;
        const ctl142 = rw142.act({
          v: 2, name: 'setControl',
          args: { seq: ++seq142, ttl: 0.5, steerX: sx, steerY: sy, fireHeld: aligned, throttle: throttle142 },
        });
        if (ctl142 && ctl142.ok === false && ctl142.token === 'overlay') {
          const hs142 = rw142.observe();
          const hi142 = hs142 && hs142.hail && Array.isArray(hs142.hail.intents) ? hs142.hail.intents : [];
          if (hs142 && hs142.hail && hs142.hail.open === true && hi142.length) {
            rw142.act({ v: 2, name: 'hailResolve', args: { intent: hi142.includes('refuseFight') ? 'refuseFight' : hi142[0] } });
          }
        }
        tick(1, `w142 ${scenario} fight`); // per-frame observe: concurrent NPC battles overflow the 16-row ring within 3 frames and evict playerFire/npcHit
      }
      rw142.act({ v: 2, name: 'clearControl', args: {} });
      const foeState = live && live.state ? live.state : {};
      const diag = `iters=${iters142} why=${why142} fire=${fire} hit=${hit} ai=${live.ai && live.ai.mode ? live.ai.mode : '?'} destroyed=${!!foeState.destroyed} disabled=${!!foeState.disabled} surrendered=${!!foeState.surrendered} evs=${[...seen142].join(',')} names=${[...names142].join(',')}`;
      return { out, fire, hit, diag };
    };

    // ---- 1. combat, unprivileged: normal hull/resources, real outcome ------
    // No hull pinning, no credit seeding, no attacker deletion. The terminal
    // is whatever the real combat system produces: target resolution, or
    // ordinary player death followed by the real recovery path.
    {
      // Fixture teardown: harness hull pins from earlier waves are live
      // (1e9). The unprivileged path needs the honest class baseline.
      const { createShipState: mkBaseline142 } = await import('../../src/game/state.js');
      const base142 = mkBaseline142((ctx.player && ctx.player.classKey) || 'light', { name: ctx.player && ctx.player.name, faction: ctx.player && ctx.player.faction });
      for (const k of ['hull', 'hullMax', 'screen', 'screenMax', 'shell', 'shellMax', 'engine', 'engineMax', 'power']) {
        if (ctx.player && Number.isFinite(base142[k])) ctx.player[k] = base142[k];
      }
    }
    stageAt142(400, 0, -300, 'w142 merc stage'); // fixture placement; outside the 300u station law zone
    w30parkHostiles('w142 merc park'); // fixture: clears interfering hostiles
    const mercHullBefore = ctx.player.hull;
    const merc = liveForRec142(
      { id: 'wave142-merc', name: 'Wave142 Merc', classKey: 'cutter', faction: 'redledger', role: 'pirate', resolve: 50, personality: 95, alwaysHuntsPlayer: true },
      [220, 0, 0], 'w142 merc spawn');
    let mercFight = { out: 'timeout', fire: false, hit: false };
    let mercRecovered = false;
    if (merc) {
      mercFight = fight142('combat-unprivileged', merc, 'Wave142 Merc', ['npcDestroyed', 'npcDisabled', 'npcSurrendered']);
      if (mercFight.out === 'died') {
        for (let i = 0; i < 60 * 8; i++) {
          const sd = rw142.observe();
          if (!sd || !sd.session || sd.session.phase !== 'dead') break;
          const rr = rw142.act({ v: 2, name: 'recover', args: {} });
          if (rr && rr.ok === true) { step142('combat-unprivileged', 'recover', rr, 'ordinary combat death recovery'); break; }
          tick(10, 'w142 merc recover wait');
        }
        tick(3, 'w142 merc recovered');
        const sp = rw142.observe();
        mercRecovered = !!(sp && sp.session && sp.session.phase === 'playing');
      }
      if (spawned142.has(merc)) { w30removeShip(merc); spawned142.delete(merc); }
    }
    term142('combat-unprivileged',
      mercFight.out === 'resolved' || (mercFight.out === 'died' && mercRecovered),
      `result=${mercFight.out} fire=${mercFight.fire} hit=${mercFight.hit} hull ${mercHullBefore}->${ctx.player.hull} (unpinned) recovered=${mercRecovered} f{${mercFight.diag}}`);
    w142.combatUnprivileged = !!(mercFight.fire && mercFight.hit
      && (mercFight.out === 'resolved' || (mercFight.out === 'died' && mercRecovered)));
    // Re-baseline after a possible death/recovery (recovery may dock/relocate).
    if (ctx.flags.docked) undockStation();
    if (ctx.world.currentSystem !== 'freehold') {
      ctx.world.currentSystem = 'freehold';
      ctx.emit('systemLoaded', { to: 'freehold' });
      tick(2, 'w142 rebase sys');
    }

    // ---- 2. exploration: survey contract + real landmark discovery ---------
    ensureDocked142('w142 dock explore');
    openJobs142('w142 explore board');
    const exOffer = offers142('explore')[0] || null;
    let exploreOk = false;
    let exNote = 'no explore offer at the freehold board';
    if (exOffer) {
      const acc = accept142('exploration', exOffer.id);
      ensureUndocked142('w142 explore undock');
      const lm = SYSTEMS.freehold.landmarks[0];
      const alreadyVisited = !!(ctx.world.mystery && Array.isArray(ctx.world.mystery.visited)
        && ctx.world.mystery.visited.includes(lm.id));
      // privilegedFixture staging: park 90u off the landmark (the wave-30 site
      // precedent). The discovery is the real mystery proximity system.
      stageAt142(lm.position[0], lm.position[1], lm.position[2] + 90, 'w142 landmark stage');
      let found = alreadyVisited;
      for (let i = 0; i < 60 * 5 && !found; i += 10) {
        tick(10, 'w142 landmark wait');
        found = obsEvents142(rw142.observe(), 'landmarkFound').some((e) => e && e.id === lm.id);
      }
      ensureDocked142('w142 dock explore file');
      const filed = awaitJobState142(exOffer.id, ['delivered'], 60 * 5, 'w142 explore terminal');
      const exLive = liveJob142(exOffer.id);
      const exVisited = !!(ctx.world.mystery && Array.isArray(ctx.world.mystery.visited) && ctx.world.mystery.visited.includes(lm.id));
      exploreOk = !!(acc && acc.ok === true && found && filed);
      exNote = `offer=${exOffer.id} ${alreadyVisited ? 'landmark already charted; progress recognized' : 'landmarkFound observed'} terminal=${filed} found=${found} visited=${exVisited} jobState=${exLive ? exLive.state : 'gone'} progress=${exLive && Number.isFinite(exLive.progress) ? exLive.progress : '?'} docked=${ctx.flags.docked} sys=${ctx.world.currentSystem}`;
    }
    term142('exploration', exploreOk, exNote);
    w142.missionExplore = exploreOk;

    // ---- 3. mining: board contract, automine channel, dock delivery --------
    ensureDocked142('w142 dock mining');
    openJobs142('w142 mining board');
    const mineOffer = offers142('mining')[0] || null;
    let mineOk = false;
    let mineNote = 'no mining offer at the freehold board';
    if (mineOffer) {
      const commodity = typeof mineOffer.commodity === 'string' ? mineOffer.commodity : 'rawOre';
      const need = Number.isFinite(mineOffer.need) ? mineOffer.need : 4;
      const acc = accept142('mining', mineOffer.id);
      const inFlight = rw142.observe().jobs.active.some((j) => j && j.id === mineOffer.id);
      ensureUndocked142('w142 mining undock');
      // privilegedFixture staging: park inside the freehold field envelope.
      stageAt142(-450, -30, -250, 'w142 field stage');
      rw142.act({ v: 2, name: 'setWeaponGroup', args: { n: 3 } });
      // privilegedFixture: clear the hold (the wave-127 cargo-pin
      // convention) — automine refuses 'cargo' on a full hold.
      ctx.cargo.length = 0;
      // privilegedFixture staging: when the field holds the contract ore,
      // park beside a matching rock so the group-3 cycle locks it (the
      // cycle prefers the accepted contract ore only when one is in range).
      {
        const field142 = (ctx.asteroids && ctx.asteroids.list) || [];
        const matchRock = field142.find((a) => a && a.commodity === commodity && a.position && a.ore > 0) || null;
        if (matchRock) {
          stageAt142(matchRock.position.x + 40, matchRock.position.y, matchRock.position.z, 'w142 ore stage');
        }
      }
      const holdBefore = hold142(commodity);
      let mined = false;
      let mineBlockedSeen = '';
      let mineLastCur = 'none';
      let mineEngaged = false;
      for (let i = 0; i < 60 * 150 && !mined; i++) {
        const s = rw142.observe();
        for (const e of (s && s.events) || []) {
          if (e && e.type === 'mineBlocked') mineBlockedSeen = `${e.oreKey ?? '?'} hardness=${e.hardness ?? '?'} needs=${e.needs ?? '?'}`;
        }
        const cur = s && s.targets && s.targets.current;
        mineLastCur = cur && typeof cur.kind === 'string' ? cur.kind : 'none';
        if (!(cur && cur.kind === 'rock')) {
          // KeyT cycle; weapon group 3 prefers the accepted contract's ore.
          rw142.act({ v: 2, name: 'selectTarget', args: {} });
          tick(1, 'w142 rock cycle');
          continue;
        }
        {
          const lockedRock142 = ctx.targets && ctx.targets.current;
          const lockOre = lockedRock142 && typeof lockedRock142.commodity === 'string' ? lockedRock142.commodity : '';
          if (lockOre && lockOre !== commodity) {
            ctx.targets.current = null; // wrong ore: release and let the cycle find the contract rock
            tick(1, 'w142 ore release');
            continue;
          }
        }
        if (!(ctx.automine && ctx.automine.engaged === true)) {
          rw142.act({ v: 2, name: 'engageAutomine', args: {} });
        }
        mineEngaged = !!(ctx.automine && ctx.automine.engaged === true);
        tick(30, 'w142 automine');
        mined = hold142(commodity) - holdBefore >= need;
      }
      rw142.act({ v: 2, name: 'cancelAutomine', args: {} });
      const oreDelta = hold142(commodity) - holdBefore;
      ensureDocked142('w142 dock mining deliver');
      const delivered = awaitJobState142(mineOffer.id, ['delivered'], 60 * 5, 'w142 mining terminal');
      mineOk = !!(acc && acc.ok === true && inFlight && mined && delivered);
      mineNote = `offer=${mineOffer.id} commodity=${commodity} oreDelta=${oreDelta} need=${need} terminal=${delivered} hold=${hold142(commodity)}/${ctx.cargoCapacity} cap engaged=${mineEngaged} cur=${mineLastCur} blocked=[${mineBlockedSeen}]`;
    }
    term142('mining', mineOk, mineNote);
    w142.missionMining = mineOk;

    // ---- 4. trade + espionage + passenger: real cross-system legs ----------
    // Travel legs use the harness gate flight (jumpToward places the ship on
    // the gate ring; the real jump.js pipeline performs the system swap). The
    // agent plotRoute receipts are recorded alongside.
    recoverIfDead142('w142 dock trade pre');
    ensureDocked142('w142 dock trade');
    openJobs142('w142 trade board');
    const tradeOffer = offers142('trade')[0] || null;
    const spyOffer = offers142('espionage')[0] || null;
    let tradeOk = false;
    let spyOk = false;
    let paxOk = false;
    let tradeNote = 'no trade offer at the freehold board';
    let spyNote = 'no espionage offer at the freehold board';
    let paxNote = 'no passenger offer at the veridian board';
    let spyAcc = null;
    if (spyOffer) spyAcc = accept142('espionage', spyOffer.id); // dest resolves to veridian
    if (tradeOffer) {
      const commodity = typeof tradeOffer.commodity === 'string' ? tradeOffer.commodity : 'provisions';
      const need = Number.isFinite(tradeOffer.need) ? tradeOffer.need : 5;
      const acc = accept142('trade', tradeOffer.id);
      if (!(ctx.world.credits >= 4000)) ctx.world.credits = 4000; // privilegedFixture: buy-in stake
      rw142.act({ v: 2, name: 'openService', args: { id: 'market' } });
      tick(1, 'w142 market open');
      const buy = rw142.act({ v: 2, name: 'trade', args: { commodity, qty: need, side: 'buy' } });
      step142('trade', 'trade:buy', buy, `buy ${need} ${commodity} through the desk closure`);
      tick(1, 'w142 buy settle');
      const stocked = hold142(commodity) >= need;
      const plotV = rw142.act({ v: 2, name: 'plotRoute', args: { dest: 'veridian' } });
      step142('navigation', 'plotRoute', plotV, 'freehold->veridian');
      ensureUndocked142('w142 trade undock');
      const arrivedV = travelTo('veridian', 'w142 to veridian');
      if (arrivedV) {
        ensureDocked142('w142 dock veridian');
        const tradeDelivered = stocked && awaitJobState142(tradeOffer.id, ['delivered'], 60 * 5, 'w142 trade terminal');
        tradeOk = !!(acc && acc.ok === true && tradeDelivered);
        tradeNote = `offer=${tradeOffer.id} commodity=${commodity} stocked=${stocked} terminal=${tradeDelivered}`;
      } else {
        tradeNote = `offer=${tradeOffer.id} commodity=${commodity} stocked=${stocked} travel failed`;
      }
    }
    let spyProgress = false;
    if (spyOffer && !tradeOffer) {
      // Espionage still needs the veridian leg when no trade ran it.
      const plotV2 = rw142.act({ v: 2, name: 'plotRoute', args: { dest: 'veridian' } });
      step142('navigation', 'plotRoute', plotV2, 'freehold->veridian (spy)');
      undockStation();
      ensureUndocked142('w142 spy undock');
      if (travelTo('veridian', 'w142 spy to veridian')) ensureDocked142('w142 dock veridian spy');
    }
    if (spyOffer && ctx.flags.docked && ctx.world.currentSystem === 'veridian') {
      tick(40, 'w142 spy dest stamp'); // throttled delivery tick sets progress=1
      const spyLive = liveJob142(spyOffer.id);
      spyProgress = !!(spyLive && spyLive.progress === 1);
    }
    if (ctx.flags.docked && ctx.world.currentSystem === 'veridian') {
      openJobs142('w142 veridian board');
      const paxOffer = offers142('passenger')[0] || null;
      let paxAcc = null;
      if (paxOffer) paxAcc = accept142('passenger', paxOffer.id);
      const plotF = rw142.act({ v: 2, name: 'plotRoute', args: { dest: 'freehold' } });
      step142('navigation', 'plotRoute', plotF, 'veridian->freehold');
      ensureUndocked142('w142 return undock');
      if (travelTo('freehold', 'w142 to freehold')) {
        ensureDocked142('w142 dock freehold return');
        if (paxOffer && paxAcc) {
          paxOk = paxAcc.ok === true && awaitJobState142(paxOffer.id, ['delivered'], 60 * 5, 'w142 passenger terminal');
          paxNote = `offer=${paxOffer.id} terminal=${paxOk}`;
        } else {
          paxNote = paxOffer ? `offer=${paxOffer.id} accept refused` : 'no passenger offer at the veridian board';
        }
        if (spyOffer && spyAcc) {
          const spyDelivered = awaitJobState142(spyOffer.id, ['delivered'], 60 * 5, 'w142 espionage terminal');
          spyOk = !!(spyAcc.ok === true && spyProgress && spyDelivered);
          spyNote = `offer=${spyOffer.id} progressAtDest=${spyProgress} terminal=${spyDelivered}`;
        }
      }
    } else if (spyOffer) {
      spyNote = `offer=${spyOffer.id} never reached the dest dock`;
    }
    term142('trade', tradeOk, tradeNote);
    term142('espionage', spyOk, spyNote);
    term142('passenger', paxOk, paxNote);
    w142.missionTrade = tradeOk;
    w142.missionEspionage = spyOk;
    w142.missionPassenger = paxOk;

    // ---- 5. local hunt: board contract on a pirate record, witnessed kill --
    recoverIfDead142('w142 dock hunt pre');
    ensureDocked142('w142 dock hunt');
    // Bounded recorded fixture installed BEFORE the board read (spec: fixture
    // selection is recorded, never silently skipped): the labelled
    // high-personality quarry (personality 95 → permanently 'defiant', never
    // capitulates) makes the kill-required contract deterministic. The
    // fixture's own generated offer is preferred; real board offers remain
    // the fallback. The accept→combat→incident→claim path is unchanged.
    const huntFixtureRec = {
      id: 'rec-9001', name: 'Wave142 Hunt Quarry', classKey: 'cutter',
      faction: 'redledger', role: 'pirate', system: 'freehold', state: 'enroute',
      bounty: 520, resolve: 50, personality: 95, alwaysHuntsPlayer: true,
    };
    const huntBank = (ctx.world.recordBanks && Array.isArray(ctx.world.recordBanks.freehold)) ? ctx.world.recordBanks.freehold
      : (Array.isArray(ctx.world.records) ? ctx.world.records : null);
    if (huntBank) { huntBank.unshift(huntFixtureRec); fixtureRecs.push({ arr: huntBank, rec: huntFixtureRec }); }
    // privilegedFixture board reset: the hunt board fills both slots with real
    // offers at dock, which would leave no room for the fixture card. Pull
    // the OFFERED hunt cards so the real syncHuntJobs reposts from the bank
    // with the labelled fixture first; saved142.jobs restores them in finally.
    if (Array.isArray(ctx.world.jobs)) {
      for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
        const j = ctx.world.jobs[i];
        if (j && j.kind === 'hunt' && j.originSystem === 'freehold' && j.state === 'offered') ctx.world.jobs.splice(i, 1);
      }
    }
    openJobs142('w142 hunt board');
    let huntOffer = offers142('hunt').find((j) => typeof j.title === 'string' && j.title.includes(huntFixtureRec.name)) || null;
    let huntFixture = !!huntOffer;
    if (!huntOffer) huntOffer = offers142('hunt')[0] || null;
    let huntOk = false;
    let huntNote = 'no hunt offer (fixture attempted)';
    if (huntOffer) {
      const acc = accept142('hunt', huntOffer.id);
      const liveJob = liveJob142(huntOffer.id);
      const rec = findRec142(liveJob && liveJob.recordId);
      ensureUndocked142('w142 hunt undock');
      stageAt142(400, 0, -300, 'w142 hunt stage');
      w30parkHostiles('w142 hunt park');
      let live = null;
      if (rec) {
        killedRecs.push({ rec, state: rec.state });
        live = liveForRec142(rec, [220, 0, 0], 'w142 hunt quarry stage');
      }
      if (live) {
        pinHull142(true); // privilegedFixture: contract-kill only, not survival evidence
        const f = fight142('hunt', live, rec.name, ['npcDestroyed']); // kill-required: surrender is not resolution
        pinHull142(false);
        if (spawned142.has(live)) { w30removeShip(live); spawned142.delete(live); }
        const done = awaitJobState142(huntOffer.id, ['done', 'delivered'], 60 * 5, 'w142 hunt terminal');
        huntOk = !!(acc && acc.ok === true && f.out === 'resolved' && f.fire && f.hit && done);
        huntNote = `offer=${huntOffer.id} fixture=${huntFixture} result=${f.out} terminal=${done} f{${f.diag}}`;
      } else {
        huntNote = `offer=${huntOffer.id} fixture=${huntFixture} quarry unavailable`;
      }
    }
    term142('hunt', huntOk, huntNote);
    w142.missionHunt = huntOk;

    // ---- 6. faction war: strike on a flagged patrol record ------------------
    recoverIfDead142('w142 dock war pre');
    ensureDocked142('w142 dock war');
    // Bounded recorded fixture installed BEFORE the board read: the labelled
    // high-personality patrol record (personality 95 → never capitulates)
    // makes the kill-required contract deterministic. The fixture's own
    // generated offer is preferred; real board offers remain the fallback.
    const warFixtureRec = {
      id: 'rec-9002', name: 'Wave142 War Quarry', classKey: 'cutter',
      faction: 'veridian', role: 'patrol', system: 'freehold', state: 'enroute',
      resolve: 50, personality: 95,
    };
    const warBank = (ctx.world.recordBanks && Array.isArray(ctx.world.recordBanks.freehold)) ? ctx.world.recordBanks.freehold
      : (Array.isArray(ctx.world.records) ? ctx.world.records : null);
    if (warBank) { warBank.unshift(warFixtureRec); fixtureRecs.push({ arr: warBank, rec: warFixtureRec }); }
    // privilegedFixture board reset: pull existing OFFERED war cards so the
    // real syncWarJobs reposts from the bank with the labelled fixture first;
    // saved142.jobs restores them in finally.
    if (Array.isArray(ctx.world.jobs)) {
      for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
        const j = ctx.world.jobs[i];
        if (j && j.kind === 'war' && j.originSystem === 'freehold' && j.state === 'offered') ctx.world.jobs.splice(i, 1);
      }
    }
    openJobs142('w142 war board');
    let warOffer = offers142('war').find((j) => typeof j.title === 'string' && j.title.includes(warFixtureRec.name)) || null;
    let warFixture = !!warOffer;
    if (!warOffer) warOffer = offers142('war')[0] || null;
    let warOk = false;
    let warNote = 'no war offer (fixture attempted)';
    if (warOffer) {
      const acc = accept142('war', warOffer.id);
      const liveJob = liveJob142(warOffer.id);
      const rec = findRec142(liveJob && liveJob.recordId);
      ensureUndocked142('w142 war undock');
      stageAt142(400, 0, -300, 'w142 war stage');
      w30parkHostiles('w142 war park');
      let live = null;
      if (rec) {
        // Harness asset priming: boot primes only trader/pirate materials.
        await primeShipAsset(rec.faction, typeof rec.classKey === 'string' ? rec.classKey : 'cutter', 'patrol');
        killedRecs.push({ rec, state: rec.state });
        live = liveForRec142(rec, [220, 0, 0], 'w142 war quarry stage');
      }
      if (live) {
        pinHull142(true); // privilegedFixture: contract-kill only
        const f = fight142('war', live, rec.name, ['npcDestroyed']); // kill-required: surrender is not resolution
        pinHull142(false);
        if (spawned142.has(live)) { w30removeShip(live); spawned142.delete(live); }
        const done = awaitJobState142(warOffer.id, ['done', 'delivered'], 60 * 5, 'w142 war terminal');
        warOk = !!(acc && acc.ok === true && f.out === 'resolved' && f.fire && f.hit && done);
        warNote = `offer=${warOffer.id} fixture=${warFixture} result=${f.out} terminal=${done} f{${f.diag}}`;
      } else {
        warNote = `offer=${warOffer.id} fixture=${warFixture} quarry unavailable`;
      }
    }
    term142('war', warOk, warNote);
    w142.missionWar = warOk;

    // ---- 7. faction hunt: posted bounty on a named pirate, witnessed kill ---
    recoverIfDead142('w142 dock bounty pre');
    ensureDocked142('w142 dock bounty');
    // Bounded recorded fixture installed BEFORE the board read: the labelled
    // priced pirate record (personality 95 → never capitulates, so it fights
    // to destruction instead of fleeing) in the live registry so
    // syncPirateBounties posts the faction bounty card. The fixture's own
    // generated offer is preferred; real board offers remain the fallback.
    const bountyFixtureRec = {
      id: 'rec-9003', name: 'Wave142 Bounty Quarry', classKey: 'cutter',
      faction: 'redledger', role: 'pirate', system: 'freehold', state: 'enroute',
      bounty: 640, resolve: 50, personality: 95, alwaysHuntsPlayer: true,
    };
    if (Array.isArray(ctx.world.records)) {
      ctx.world.records.unshift(bountyFixtureRec);
      fixtureRecs.push({ arr: ctx.world.records, rec: bountyFixtureRec });
    }
    // privilegedFixture board reset: the pirate bounty board caps at 2 cards
    // and real pirates fill it, which would leave no room for the fixture
    // card. Pull the OFFERED pirate bounty cards so the real
    // syncPirateBounties reposts from the registry with the labelled fixture
    // first; saved142.jobs restores them in finally.
    if (Array.isArray(ctx.world.jobs)) {
      for (let i = ctx.world.jobs.length - 1; i >= 0; i--) {
        const j = ctx.world.jobs[i];
        if (j && j.kind === 'bounty' && typeof j.id === 'string' && j.id.startsWith('bounty-pirate-') && j.state === 'offered') ctx.world.jobs.splice(i, 1);
      }
    }
    openJobs142('w142 bounty board');
    const bountyOffers = () => {
      const snap = rw142.observe();
      return (snap && snap.jobs && Array.isArray(snap.jobs.offers) ? snap.jobs.offers : [])
        .filter((j) => j && j.kind === 'bounty' && typeof j.id === 'string'
          && j.id.startsWith('bounty-pirate-') && j.state === 'offered');
    };
    let bountyOffer = bountyOffers().find((j) => typeof j.title === 'string' && j.title.includes(bountyFixtureRec.name)) || null;
    let bountyFixture = !!bountyOffer;
    if (!bountyOffer) bountyOffer = bountyOffers()[0] || null;
    let bountyOk = false;
    let bountyNote = 'no pirate bounty offer (fixture attempted)';
    if (bountyOffer) {
      const acc = accept142('bounty', bountyOffer.id);
      const rec = (ctx.world.records || []).find((r) => r && r.role === 'pirate'
        && r.name === bountyOffer.target) || null;
      ensureUndocked142('w142 bounty undock');
      stageAt142(400, 0, -300, 'w142 bounty stage');
      w30parkHostiles('w142 bounty park');
      let live = null;
      if (rec) {
        killedRecs.push({ rec, state: rec.state });
        live = liveForRec142(rec, [220, 0, 0], 'w142 bounty quarry stage');
      }
      if (live) {
        pinHull142(true); // privilegedFixture: contract-kill only
        // The bounty claims only on a DESTROYED incident — surrender does not pay.
        const f = fight142('bounty', live, rec.name, ['npcDestroyed']);
        pinHull142(false);
        if (spawned142.has(live)) { w30removeShip(live); spawned142.delete(live); }
        const done = awaitJobState142(bountyOffer.id, ['done'], 60 * 5, 'w142 bounty terminal');
        bountyOk = !!(acc && acc.ok === true && f.out === 'resolved' && f.fire && f.hit && done);
        bountyNote = `offer=${bountyOffer.id} fixture=${bountyFixture} result=${f.out} terminal=${done} f{${f.diag}}`;
      } else {
        bountyNote = `offer=${bountyOffer.id} fixture=${bountyFixture} quarry unavailable`;
      }
    }
    term142('bounty', bountyOk, bountyNote);
    w142.missionBounty = bountyOk;

    // ---- 8. recovery: wreck salvage card, pod scoop, dock delivery ----------
    // The wrecks behind the card stage from the real kills above.
    recoverIfDead142('w142 dock recovery pre');
    ensureDocked142('w142 dock recovery');
    openJobs142('w142 recovery board');
    const recOffer = offers142('recovery')[0] || null;
    let recoveryOk = false;
    let recNote = 'no recovery offer (no live wreck in system)';
    if (recOffer) {
      const acc = accept142('recovery', recOffer.id); // cuts the salvage pod loose at the wreck (real system)
      const liveJob = liveJob142(recOffer.id);
      const accepted = !!(liveJob && liveJob.state === 'accepted');
      const wreck = (ctx.world.aftermath || []).find((a) => a && liveJob && a.id === liveJob.wreckId) || null;
      ensureUndocked142('w142 recovery undock');
      let scooped = false;
      let metalsDelta = 0;
      if (accepted && wreck) {
        const wp = wreck.position;
        const wx = Array.isArray(wp) ? wp[0] : (wp && wp.x) || 0;
        const wy = Array.isArray(wp) ? wp[1] : (wp && wp.y) || 0;
        const wz = Array.isArray(wp) ? wp[2] : (wp && wp.z) || 0;
        // privilegedFixture staging: park 30u off the salvage pod site.
        stageAt142(wx + 30, wy, wz, 'w142 salvage stage');
        const metalsBefore = hold142('refinedMetals');
        for (let i = 0; i < 60 * 30 && !scooped; i++) {
          const s = rw142.observe();
          if (liveJob.collected === true) { scooped = true; break; }
          // Follow this agreement's public marker, not a nearer ambient pod.
          // Staging preserves the inherited heading, so the marker can be
          // directly aft. Turn toward it before applying approach throttle,
          // using the same bearing policy as the recovery live probe.
          const objective = s?.jobs?.active?.find((j) => j.id === recOffer.id)?.objective;
          if (objective?.status !== 'available' || !Array.isArray(objective.bearing)) {
            tick(6, 'w142 salvage scan'); continue;
          }
          const [x, y, z] = objective.bearing;
          const desiredSpeed = Math.max(2, Math.min(50, (objective.range - 4) * 0.18));
          const throttle = z < -0.92 && s.ship.speed < desiredSpeed + 2
            ? Math.max(0.005, Math.min(0.2, (objective.range - 4) / 1800)) : 0;
          const ctl142p = rw142.act({
            v: 2, name: 'setControl',
            args: { seq: ++seq142, ttl: 0.5,
              steerX: clamp142(Math.atan2(x, -z) * 1.5),
              steerY: clamp142(Math.atan2(y, Math.hypot(x, z)) * 1.5), throttle },
          });
          if (ctl142p && ctl142p.ok === false && ctl142p.token === 'overlay') {
            const hp142 = rw142.observe();
            const pi142 = hp142 && hp142.hail && Array.isArray(hp142.hail.intents) ? hp142.hail.intents : [];
            if (hp142 && hp142.hail && hp142.hail.open === true && pi142.length) {
              rw142.act({ v: 2, name: 'hailResolve', args: { intent: pi142.includes('refuseFight') ? 'refuseFight' : pi142[0] } });
            }
          }
          tick(3, 'w142 salvage approach');
        }
        rw142.act({ v: 2, name: 'clearControl', args: {} });
        scooped = scooped || liveJob.collected === true;
        metalsDelta = hold142('refinedMetals') - metalsBefore;
      }
      ensureDocked142('w142 dock salvage');
      const done = accepted && awaitJobState142(recOffer.id, ['done'], 60 * 5, 'w142 recovery terminal');
      recoveryOk = !!(accepted && scooped && done);
      recNote = `offer=${recOffer.id} accepted=${accepted} scooped=${scooped} metalsDelta=${metalsDelta} terminal=${done}`;
      void acc;
    }
    term142('recovery', recoveryOk, recNote);
    w142.missionRecovery = recoveryOk;
  } catch (e) {
    threw142 = true;
    console.log('WAVE142 ERR', e && e.message ? e.message : e);
  } finally {
    try { rw142.act({ v: 2, name: 'clearControl', args: {} }); } catch { /* ignore */ }
    pinHull142(false);
    if (ctx.flee) ctx.flee.engaged = false;
    try { rw142.act({ v: 2, name: 'cancelAutopilot', args: {} }); } catch { /* ignore */ }
    try { rw142.act({ v: 2, name: 'cancelAutomine', args: {} }); } catch { /* ignore */ }
    // A stranded death overlay would poison the restore below; ride the real
    // recovery path once more before touching state.
    try {
      const sp = rw142.observe();
      if (sp && sp.session && sp.session.phase === 'dead') {
        rw142.act({ v: 2, name: 'recover', args: {} });
        tick(3, 'w142 finally recover');
      }
    } catch { /* ignore */ }
    ctx.agent.optIn = saved142.optIn;
    ctx.flags.paused = saved142.paused;
    ctx.flags.berthHold = saved142.berthHold;
    ctx.input.weaponGroup = saved142.wpn;
    ctx.input.throttle = saved142.throttle;
    ctx.input.fullStop = saved142.fullStop;
    if (Number.isFinite(saved142.credits)) ctx.world.credits = saved142.credits;
    if (ctx.player && Number.isFinite(saved142.hullMax)) {
      ctx.player.hullMax = saved142.hullMax;
      ctx.player.hull = saved142.hull;
      ctx.player.screenMax = saved142.screenMax;
      ctx.player.screen = saved142.screen;
      ctx.player.shellMax = saved142.shellMax;
      ctx.player.shell = saved142.shell;
    }
    for (const { arr, rec } of fixtureRecs) {
      const i = arr.indexOf(rec);
      if (i >= 0) arr.splice(i, 1);
    }
    for (const { rec, state } of killedRecs) rec.state = state;
    for (const { ship, pos } of movedShips) {
      if (ship && ship.object && ship.object.position) ship.object.position.copy(pos);
    }
    if (Array.isArray(ctx.ships)) {
      ctx.ships.length = 0;
      for (const s of saved142.ships) ctx.ships.push(s);
    }
    if (Array.isArray(ctx.pods)) {
      for (const p of saved142.pods) if (!ctx.pods.includes(p)) ctx.pods.push(p);
    }
    if (Array.isArray(ctx.world.jobs) && saved142.jobs.length) {
      const liveIds = new Set(ctx.world.jobs.map((j) => j && j.id));
      for (const j of saved142.jobs) {
        if (!j || !j.id) continue;
        const live = ctx.world.jobs.find((x) => x && x.id === j.id);
        if (live) Object.assign(live, j);
        else if (!liveIds.has(j.id)) ctx.world.jobs.push(j);
      }
    }
    if (Array.isArray(ctx.cargo)) {
      ctx.cargo.length = 0;
      for (const c of saved142.cargo) ctx.cargo.push(c);
    }
    if (saved142.rep && ctx.world.reputation) Object.assign(ctx.world.reputation, saved142.rep);
    if (Array.isArray(ctx.world.aftermath)) {
      ctx.world.aftermath.length = 0;
      for (const a of saved142.aftermath) ctx.world.aftermath.push(a);
    }
    if (Array.isArray(ctx.world.incidents)) {
      ctx.world.incidents.length = 0;
      for (const ev of saved142.incidents) ctx.world.incidents.push(ev);
    }
    if (ctx.world.mystery && Array.isArray(ctx.world.mystery.visited)) {
      // In-place restore: landmarks.js change-detects on array length.
      ctx.world.mystery.visited.length = 0;
      ctx.world.mystery.visited.push(...saved142.visited);
    }
    if (Number.isFinite(saved142.fear)) ctx.world.fear = saved142.fear;
    if (saved142.vel && ctx.ship?.velocity) ctx.ship.velocity.copy(saved142.vel);
    if (Number.isFinite(saved142.speed)) ctx.ship.speed = saved142.speed;
    if (saved142.pos && ctx.ship?.object?.position) ctx.ship.object.position.copy(saved142.pos);
    if (saved142.quat && ctx.ship?.object?.quaternion) ctx.ship.object.quaternion.copy(saved142.quat);
    if (typeof saved142.sys === 'string' && saved142.sys && ctx.world.currentSystem !== saved142.sys) {
      ctx.world.currentSystem = saved142.sys;
      ctx.emit('systemLoaded', { to: saved142.sys });
      tick(2, 'w142 restore sys');
    }
    if (saved142.docked) {
      if (!ctx.flags.docked) dockAtCurrentStation('w142 restore dock');
    } else if (ctx.flags.docked) {
      undockStation();
    }
    tick(1, 'w142 restore');
  }
  w142.noThrow = threw142 === false;
  console.log('wave142 ledger:', JSON.stringify(ledger142));
  console.log('wave142 mission-families:', JSON.stringify(w142));
  return { flags: w142, ledger: ledger142, ok: Object.values(w142).every(Boolean) };
}
