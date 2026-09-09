/** Supplemental live evidence for #62; independent QA remains a separate gate.
 * node scripts/issue-62-live-probe.mjs --mode controlled --encounter aft --defense evade --delay 15 --pair aft15
 * node scripts/issue-62-live-probe.mjs --mode natural --defense evade --delay 30
 * node scripts/issue-62-live-probe.mjs --mode compare --off PATH/result.json --enabled PATH/result.json
 * Controlled fixtures alter INITIAL setup only. Measurement uses public APIs,
 * live ordinary NPC fire/physics and no injected hits, damage or movement.
 * Each trial owns a fresh browser/profile; inherited transport always tears down.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { runLive, sleep, assert, eventCounter, measurements, repo } from './issue-61-live-harness.mjs';

const argv = process.argv.slice(2);
const option = (key, fallback) => { const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1]; };
const mode = option('mode', 'natural'), defense = option('defense', 'evade');
const encounter = option('encounter', 'ahead'), delay = Number(option('delay', '30'));
const name = option('name', `issue62-${mode}-${encounter}-${defense}-${delay}-${Date.now()}`);
const scriptHash = async () => createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const condition = s => Object.fromEntries(['hull', 'engine', 'screen', 'shell'].map(k => [k, s.ship[k]]));
const loss = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]));

function responseKind(response) {
  if (['evading', 'break-off'].includes(response)) return 'defensive-response';
  if (response === 'obstructed') return 'collision-safety-response';
  return 'acknowledgement-only';
}

/** Independent cue evidence comes from the public event ring, never defense.
 * A strict world-time increase is essential: a cue can predate the last
 * sample that lacked defense telemetry while waiting for the next controls
 * frame. Coalesced hits can corroborate their common production frame, not
 * uniquely identify a shot or a shooter. No frame bracket is inferred from
 * an event's absence alone.
 */
function publicHitEvidence(samples, seq) {
  const seen = new Set(), hits = [];
  for (let i = 0; i < samples.length; i++) {
    const row = samples[i];
    for (const event of row.observation.events || []) {
      if (event.type !== 'playerHit' || !(event.damage > 0) || event.family === 'impact') continue;
      const key = JSON.stringify([event.t, event.family, event.count || 1, event.fromAft]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (row.observation.control.seq !== seq) continue;
      const prior = samples.slice(0, i).findLast(s => s.observation.control.seq === seq && s.observation.t < event.t);
      hits.push({ event, firstSeenSampleIndex: i, firstSeenBrowserMs: row.browserMs,
        productionAfterBrowserMs: prior?.browserMs ?? null,
        productionByBrowserMs: row.browserMs,
        bracketBasis: prior ? 'Prior same-grant public observation has simulation t strictly less than this new playerHit row t; production occurs in a later synchronous game frame.' : 'No strictly earlier same-grant simulation sample: production lower bound unavailable.' });
    }
  }
  return hits;
}

function corroborateHit(samples, independentHits, cue, appliedIndex, kind) {
  const appliedSample = samples[appliedIndex];
  const result = { source: null, status: 'not-independently-corroborated',
    reportedApplicationNoLaterThanObservation: Number.isFinite(cue.appliedWallMs) ? cue.appliedWallMs <= appliedSample.browserMs : null,
    reportedStampOrdering: Number.isFinite(cue.cueWallMs) && Number.isFinite(cue.appliedWallMs) ? cue.cueWallMs <= cue.appliedWallMs : null };
  if (cue.trigger !== 'hit') return { ...result, reason: 'No independent production timestamp for this warning/contact in the public API; controller timestamps are self-reported.' };
  const matches = independentHits.filter(h => h.event.t === cue.t
    && (cue.direction === 'unknown' || cue.direction === (h.event.fromAft === true ? 'aft' : h.event.fromAft === false ? 'fore' : 'unknown')));
  const match = matches[0];
  if (!match) return { ...result, reason: 'No matching public playerHit production-frame/direction row survived observation; coalescing may hide a hit.' };
  Object.assign(result, { source: 'public-playerHit-event-ring', event: match.event,
    firstPublicEventSeenBrowserMs: match.firstSeenBrowserMs,
    productionAfterBrowserMs: match.productionAfterBrowserMs, productionByBrowserMs: match.productionByBrowserMs,
    applicationTelemetryObservedByBrowserMs: appliedSample.browserMs,
    publicThrottleAtObservation: appliedSample.observation.ship.throttle,
    publicSpeedAtObservation: appliedSample.observation.ship.speed,
    publicFireHeldAtObservation: appliedSample.observation.ship.fireHeld });
  if (match.productionAfterBrowserMs === null) return { ...result, reason: match.bracketBasis };
  // The independent lower bound is a sample from a strictly earlier game
  // frame, NOT merely the last sample without a defense reaction. The upper
  // bound ends when applied telemetry/public output was observed, so it
  // includes sampling delay and never substitutes the sampler period.
  const upper = appliedSample.browserMs - match.productionAfterBrowserMs;
  const cueInsideBracket = cue.cueWallMs > match.productionAfterBrowserMs && cue.cueWallMs <= match.productionByBrowserMs;
  const consistent = upper >= 0 && cueInsideBracket && result.reportedStampOrdering && result.reportedApplicationNoLaterThanObservation;
  return { ...result, status: consistent ? 'public-hit-frame-corroborated' : 'stamp-or-bracket-inconsistent',
    reportedCueInsidePublicProductionBracket: cueInsideBracket,
    publicCueToApplicationTelemetryObservedUpperBoundMs: upper >= 0 ? upper : null,
    corroborates250msDefensiveResponse: kind === 'defensive-response' && consistent && upper <= 250,
    limitation: 'Independent public hit-frame timing corroborates the cue. Application is still identified by controller telemetry; public throttle/speed/fire corroborate output state, but steering/strafe assignment is not exposed. This is not an independently instrumented input write.' };
}

function summarize(samples, targetId, seq) {
  const metrics = measurements(samples, targetId), first = samples[0];
  const independentHits = publicHitEvidence(samples, seq);
  const reactions = [], cues = [], episodes = new Set(), cueKeys = new Set();
  for (let i = 0; i < samples.length; i++) {
    const row = samples[i], d = row.observation.control.combat?.defense;
    if (row.observation.control.seq !== seq) continue;
    const latest = d?.latestCue;
    if (latest && Number.isFinite(latest.cueWallMs) && Number.isFinite(latest.appliedWallMs)) {
      const key = `${latest.trigger}:${latest.cueWallMs}`;
      if (!cueKeys.has(key)) {
        cueKeys.add(key);
        const classification = responseKind(latest.response), latency = latest.appliedWallMs - latest.cueWallMs;
        cues.push({ ...latest, classification,
          reportedResponseLatencyMs: classification !== 'acknowledgement-only' ? latency : null,
          reportedAcknowledgementLatencyMs: classification === 'acknowledgement-only' ? latency : null,
          firstApplicationTelemetryObservedBrowserMs: row.browserMs,
          samplerIntervalMs: i ? row.browserMs - samples[i - 1].browserMs : null,
          actualIncoming: ['hit', 'incoming-fire', 'incoming-dart'].includes(latest.trigger),
          publicThrottleAtObservation: row.observation.ship.throttle, speedAtObservation: row.observation.ship.speed,
          corroboration: corroborateHit(samples, independentHits, latest, i, classification) });
      }
    }
    if (!Number.isFinite(d?.reactedAt) || episodes.has(d.reactedAt)) continue;
    episodes.add(d.reactedAt);
    const response = row.observation.control.combat.movementBlocked || d.phase;
    const classification = responseKind(response);
    reactions.push({ trigger: d.trigger, direction: d.direction, attackerId: d.attackerId,
      response, classification,
      triggeredAtSimulation: d.triggeredAt, reactedAtSimulation: d.reactedAt,
      cueWallMs: d.cueWallMs ?? null, appliedWallMs: d.appliedWallMs ?? null,
      reportedResponseLatencyMs: Number.isFinite(d.cueWallMs) && Number.isFinite(d.appliedWallMs) ? d.appliedWallMs - d.cueWallMs : null,
      reportedSimulationLatencyMs: (d.reactedAt - d.triggeredAt) * 1000,
      firstEpisodeApplicationTelemetryObservedBrowserMs: row.browserMs,
      samplerIntervalMs: i ? row.browserMs - samples[i - 1].browserMs : null,
      reactionHorizonWallMs: row.browserMs - first.browserMs,
      damageNetBeforeReaction: loss(condition(first.observation), condition(row.observation)),
      publicThrottleAtObservation: row.observation.ship.throttle,
      corroboration: corroborateHit(samples, independentHits, { ...d, t: d.triggeredAt }, i, classification) });
  }
  let maxMonotonicSampleGapMs = 0, incomingHitEvents = 0, requestedMovementSeconds = 0;
  for (let i = 0; i < samples.length; i++) {
    incomingHitEvents += samples[i].delta.playerHits;
    if (i) {
      maxMonotonicSampleGapMs = Math.max(maxMonotonicSampleGapMs, samples[i].browserMs - samples[i - 1].browserMs);
      if (samples[i - 1].observation.ship.throttle > 0) requestedMovementSeconds += samples[i].observation.t - samples[i - 1].observation.t;
    }
  }
  return { ...metrics, reactions, cues, independentHits, incomingHitEvents, maxMonotonicSampleGapMs, requestedMovementSeconds,
    defensiveResponses: cues.filter(c => c.classification === 'defensive-response'),
    collisionSafetyResponses: cues.filter(c => c.classification === 'collision-safety-response'),
    cueAcknowledgements: cues.filter(c => c.classification === 'acknowledgement-only'),
    reactionMeasurement: 'Controller cue/application timestamps are self-reported. Separately sampled public playerHit rows can corroborate production-frame bounds only when an earlier same-grant sample has strict simulation t < hit.t. Incoming-warning/contact production is not independently exposed. samplerIntervalMs measures cadence only, never cue-to-response latency. All latency/horizon/cadence calculations use performance.now. Screenshots inside the window may perturb frame cadence; actual gaps are retained.',
    incomingEvidence: 'Real playerHit deltas and defense incoming-fire/incoming-dart triggers. nearby-threat alone is not proof of an actual shot.',
    damageMeaning: 'Net stock condition difference, including shield recharge; coalesced event damage is NOT summed.' };
}

async function compare() {
  const paths = [option('off'), option('enabled')];
  assert(paths.every(Boolean), '--off and --enabled result paths required');
  const [off, enabled] = await Promise.all(paths.map(p => readFile(p, 'utf8').then(JSON.parse)));
  assert(off.requested.defense === 'off' && enabled.requested.defense !== 'off', 'Wrong comparator policies');
  assert(off.fixtureDetails?.pairHash === enabled.fixtureDetails?.pairHash && off.fixtureDetails?.pairHash, 'Fixture pairing differs');
  assert(off.requested.delayWallSeconds === enabled.requested.delayWallSeconds, 'Pair delays differ');
  assert(off.requested.pair === enabled.requested.pair && off.requested.encounter === enabled.requested.encounter, 'Pair labels/cases differ');
  assert(off.identityStart.sourceHash === enabled.identityStart.sourceHash && off.sourceStable && enabled.sourceStable, 'Pair source differs');
  assert(off.identityStart.harnessHash === enabled.identityStart.harnessHash && off.measurementHarnessStable && enabled.measurementHarnessStable, 'Shared transport differs or changed during a run');
  assert(off.probeHashStart === enabled.probeHashStart && off.probeHashStart === off.probeHashEnd && enabled.probeHashStart === enabled.probeHashEnd, 'Pair probe differs or changed during a run');
  const a = off.trials[0], b = enabled.trials[0], horizon = b.metrics.reactions[0]?.reactionHorizonWallMs;
  const atHorizon = Number.isFinite(horizon) ? a.samples.find(s => s.browserMs - a.samples[0].browserMs >= horizon) : null;
  const value = { mode: 'controlled-comparison', paths, pair: enabled.requested.pair, encounter: enabled.requested.encounter,
    delay: enabled.requested.delayWallSeconds, sourceHash: enabled.identityStart.sourceHash,
    completeDelays: a.completeGap && b.completeGap, reactionHorizonWallMs: horizon ?? null, reactionHorizonClock: 'performance.now',
    offReactionAbsent: a.metrics.reactions.length === 0,
    offDamageAtEnabledReactionHorizon: atHorizon ? loss(condition(a.samples[0].observation), condition(atHorizon.observation)) : null,
    enabledDamageBeforeReaction: b.metrics.reactions[0]?.damageNetBeforeReaction ?? null,
    off: a.metrics, enabled: b.metrics,
    stationaryThreatSecondsDifference: b.metrics.estimatedStationaryThreatSeconds - a.metrics.estimatedStationaryThreatSeconds,
    limitation: 'Identical seeded initial fixture, variable frame cadence and ordinary autonomous NPC trajectories. Every result retained, including incomplete gaps and worse outcomes; no guaranteed damage reduction inferred.' };
  const output = option('output'); if (output) await writeFile(output, JSON.stringify(value, null, 2));
  console.log(JSON.stringify(value, null, 2));
}

// This function is serialized for controlled setup only; it is never called in natural mode.
async function stageFixture(encounter) {
  const c = window.__ctx;
  const { spawnLiveShip } = await import('/src/systems/npc.js');
  const { primeShipAsset, isShipAssetReady } = await import('/src/systems/ship-assets.js');
  const THREE = encounter === 'obstruction' ? await import('/node_modules/three/build/three.module.js') : null;
  await Promise.resolve(primeShipAsset('redledger', 'cutter', 'pirate'));
  const end = Date.now() + 15000;
  while (!isShipAssetReady('redledger', 'cutter', 'pirate') && Date.now() < end) await new Promise(r => setTimeout(r, 100));
  if (!isShipAssetReady('redledger', 'cutter', 'pirate')) throw Error('Fixture ship asset unavailable');
  const park = [80000, 80000, 80000], banks = new Set([c.world.records, ...Object.values(c.world.recordBanks || {})]);
  for (const bank of banks) for (const r of bank || []) {
    if (!r.route?.length) continue;
    const origin = r.route[0], delta = park.map((v, i) => v - [origin.x, origin.y, origin.z][i]);
    for (const p of r.route) { p.x += delta[0]; p.y += delta[1]; p.z += delta[2]; }
  }
  for (const s of c.ships) s.object.position.set(...park);
  c.world.time = 120; window.__issue61Seed = 6201;
  let rock = null;
  const player = [c.station.position.x, c.station.position.y + 2400, c.station.position.z];
  if (encounter === 'obstruction') {
    // A visible static fixture body gives paired runs identical clearance;
    // native orbital asteroids would have frame-dependent initial positions.
    const position = new THREE.Vector3(player[0], player[1], player[2] - 60), radius = 16;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshStandardMaterial({ color: 0x857368, roughness: 1 }));
    mesh.position.copy(position); mesh.name = 'issue62-controlled-obstruction'; c.scene.add(mesh);
    rock = { id: c.asteroids.list.length, position, radius, ore: 0, commodity: 'iron', oreKey: 'iron', hardness: 1 };
    c.asteroids.list.push(rock); // Preserve id === array index; no authored rock is removed.
  }
  c.ship.object.position.set(...player); c.ship.object.quaternion.identity(); c.ship.velocity.set(0, 0, 0); c.ship.speed = 0;
  c.input.throttle = 0; c.input.fullStop = true; c.input.fireHeld = false;
  const offsets = encounter === 'aft' ? [[0, 0, 220]] : encounter === 'multiple' ? [[15, 0, -230], [-70, 35, 200], [85, -25, -260]] : [[encounter === 'obstruction' ? 70 : 0, 0, -230]];
  const targets = [];
  for (let i = 0; i < offsets.length; i++) {
    const at = player.map((v, j) => v + offsets[i][j]);
    const rec = { id: `issue62-${i}`, name: `Controlled Corsair ${i + 1}`, classKey: 'cutter', faction: 'redledger', role: 'pirate', cargo: [], bounty: 300,
      system: c.world.currentSystem, state: 'enroute', live: true,
      route: [{ x: at[0], y: at[1], z: at[2] }, { x: at[0] + 500, y: at[1], z: at[2] - 200 }], legLens: [538.516], leg: 0, legT: 0, dir: 1, dwellUntil: 0, resolveSeed: .95, personality: 0 };
    const live = spawnLiveShip(c, rec, new (c.ship.object.position.constructor)(...at));
    if (!live) throw Error('Fixture spawn refused');
    c.world.records.push(rec); c.ships.push(live);
    Object.assign(live.ai, { intent: true, target: 'player', playerRolled: true, playerInterested: true, demandSent: true, demandOutcome: 'refused', hailed: false, mode: 'hunt', phase: 'attack', fireAt: 120.6 + i * .15, dartSpent: true });
    live.object.lookAt(c.ship.object.position); live.object.rotateY(Math.PI);
    targets.push({ id: live.id, at, initialCondition: { hull: live.state.hull, screen: live.state.screen, shell: live.state.shell, engine: live.state.engine } });
  }
  return { id: targets[0].id, seed: 6201, rngState: window.__issue61Seed, targets, player, t: c.world.time,
    obstruction: rock ? { id: rock.id, radius: rock.radius, position: rock.position.toArray() } : null,
    initialPlayer: { classKey: c.player.classKey, hull: c.player.hull, engine: c.player.engine, screen: c.player.screen, shell: c.player.shell, heat: c.player.heat, power: c.player.power, weaponGroup: c.input.weaponGroup },
    fixture: 'Initial stock character/stock cutters; seeded RNG and initial time/pose; coherent ambient parking; refused demand and cannon-ready AI setup. Obstruction case adds one visible static sphere to the collision asteroid list; native asteroid lifecycle is not under test. Ordinary NPC cannon bursts, collisions, damage, motion and surrender thereafter. No measurement state injection.' };
}

async function live() {
  assert(['natural', 'controlled'].includes(mode), 'Mode must be natural, controlled or compare');
  assert(['off', 'evade', 'break-off'].includes(defense), 'Invalid defense');
  assert(['ahead', 'aft', 'multiple', 'obstruction'].includes(encounter), 'Invalid encounter');
  assert([5, 15, 30].includes(delay), 'Delay must be 5/15/30');
  assert(process.env.ISSUE61_TRANSPORT !== 'iab', 'This probe requires its isolated, automatically closed CDP browser');
  process.env.ISSUE61_KEEP_OPEN = '0';
  process.env.ISSUE61_OUT = process.env.ISSUE62_OUT || join(repo, 'out', 'issue-62-live');
  await runLive(name, mode, async h => {
    const { result, observe, act, wait, save } = h;
    result.transportEvents = [];
    h.c.ws.addEventListener('close', event => result.transportEvents.push({ type: 'close', wall: Date.now(), code: event.code, reason: event.reason, wasClean: event.wasClean }));
    h.c.ws.addEventListener('error', event => result.transportEvents.push({ type: 'error', wall: Date.now(), message: String(event.message || 'WebSocket error') }));
    result.foreground = { requestedAt: Date.now(), activation: await h.c.send('Page.bringToFront') };
    const frameStart = await observe();
    // A launched browser is not proof of a rendering/simulation loop. These
    // observer-owned markers count real animation callbacks without touching
    // game state. Fail before staging anything if foreground activation fails.
    await h.c.eval('(()=>{window.__issue62ReadyFrames=0;requestAnimationFrame(function frame(){window.__issue62ReadyFrames++;if(window.__issue62ReadyFrames<3)requestAnimationFrame(frame);});})()');
    const frameDeadline = Date.now() + 10000;
    let rendering;
    while (Date.now() < frameDeadline) {
      rendering = await h.c.eval('({visibility:document.visibilityState,focused:document.hasFocus(),animationFrames:window.__issue62ReadyFrames,t:window.rimward.observe().t})');
      if (rendering.visibility === 'visible' && rendering.animationFrames >= 3 && rendering.t > frameStart.t) break;
      await sleep(100);
    }
    result.foreground.verified = rendering;
    result.foreground.simulationStart = frameStart.t;
    result.foreground.waitedWallMs = Date.now() - result.foreground.requestedAt;
    await save();
    assert(rendering?.visibility === 'visible' && rendering.animationFrames >= 3 && rendering.t > frameStart.t, `Foreground/live frames unavailable before fixture: ${JSON.stringify(rendering)}`);
    result.probeHashStart = await scriptHash();
    result.requested = { mode, defense, encounter, delayWallSeconds: delay, pair: option('pair', 'unpaired'), ttlSeconds: 45 };
    result.method = mode === 'natural' ? 'Native RNG, fresh stock Greenhand, public Jobs/patrol/launch/navigation/target/combat actions only; no private game-state inspection or injection.' : 'Controlled initial fixture, ordinary live simulation and public observation/actions during measurement; never natural evidence.';
    let seq = 0, targetId;
    const fresh = await h.checkpoint('fresh');
    assert(result.actions.some(a => a.request.name === 'chooseOrigin' && a.request.args.id === 'greenhand') && fresh.world.credits === 350 && fresh.world.scanner === 0, 'Fresh stock Greenhand required');
    async function resolveHail(s) {
      if (!s.hail.open) return s;
      const choices = s.hail.intents || [], choice = ['refuseFight', 'keepFiring', 'letGo'].find(x => choices.includes(x));
      assert(choice, 'No supported public hail response');
      await act('clearControl'); await act('hailResolve', { intent: choice, expectedConversationId: s.hail.conversationId });
      return wait(s => !s.hail.open, 5, 'hail closed');
    }
    if (mode === 'controlled') {
      assert(['hull', 'engine', 'screen', 'shell'].every(k => fresh.ship[k] === fresh.ship[`${k}Max`]) && fresh.ship.heat === 0, 'Pair requires untouched stock condition');
      if (fresh.flags.docked) await act('undock');
      result.fixtureDetails = await h.c.eval(`(${stageFixture.toString()})(${JSON.stringify(encounter)})`);
      result.fixtureDetails.pairHash = createHash('sha256').update(JSON.stringify(result.fixtureDetails)).digest('hex');
      targetId = result.fixtureDetails.id;
    } else {
      let s = await observe();
      if (!s.flags.docked) { await act(s.station.inZone ? 'dock' : 'approachDock'); await wait(s => s.flags.docked, 150, 'initial dock'); }
      await act('openService', { id: 'jobs' }); s = await h.checkpoint('jobs');
      result.jobOffers = s.jobs.offers;
      const patrol = s.jobs.offers.find(j => j.kind === 'patrol' && j.state === 'offered');
      assert(patrol, 'No public patrol offer'); await act('acceptJob', { id: patrol.id });
      const bounty = s.jobs.offers.find(j => j.kind === 'bounty' && j.state === 'offered' && j.id !== 'bounty-ace');
      if (bounty) await act('acceptJob', { id: bounty.id });
      result.acceptedJobs = (await observe()).jobs.active;
      const dest = s.jobs.offers.find(j => j.destSystem && j.destSystem !== s.world.currentSystem)?.destSystem;
      const system = s.world.currentSystem;
      await act('undock'); await wait(s => !s.flags.docked && !s.flags.berthHold, 10, 'launch');
      const end = Date.now() + 120000; let routeStarted = false, laneReached = false;
      while (Date.now() < end) {
        s = await resolveHail(await observe());
        const match = s.targets.nearby.find(t => t.kind === 'ship' && t.name === bounty?.target) || s.targets.nearby.find(t => t.kind === 'ship' && t.hostile);
        if (match) { targetId = match.id; break; }
        if (s.world.currentSystem !== system || s.gate.jumping) break;
        assert(s.ship.hull > 50 && s.ship.engine > 40, 'Natural search safety threshold');
        if (dest && !routeStarted) { await act('clearControl'); await act('plotRoute', { dest }); await act('engageAutopilot'); routeStarted = true; }
        else if (routeStarted && !laneReached && (s.station.range > 1100 || s.gate.inZone)) { await act('cancelAutopilot'); laneReached = true; }
        else if (!routeStarted || laneReached || !s.autopilot.engaged) await act('setControl', { seq: ++seq, ttl: 1, throttle: .2, steerX: .2, fireHeld: false });
        await sleep(350);
      }
      assert(targetId, 'No natural pirate found during bounded public search');
      await act('cancelAutopilot'); await act('clearControl');
    }
    await act('selectTarget', { id: targetId });
    await wait(s => s.targets.aim?.targetId === targetId && Array.isArray(s.targets.aim?.bearing), 5, 'public target aim');
    await act('setWeaponGroup', { n: 1 }); await resolveHail(await observe());
    await h.checkpoint('encounter');
    // A browser-local public observer avoids transport latency masking short reactions.
    // It neither touches __ctx nor sends any action; the cap bounds retained data.
    let scenarioError;
    try {
      const spent = new Set(), encounterEnd = Date.now() + 180000;
      let trial;
      for (let attempt = 1; attempt <= (mode === 'natural' ? 4 : 1); attempt++) {
      await h.c.eval(`(()=>{window.__issue62Samples=[];window.__issue62Sample=()=>{const observation=window.rimward.observe();if(window.__issue62Samples.length<2000)window.__issue62Samples.push({wall:Date.now(),browserMs:performance.now(),observation});};window.__issue62Sample();window.__issue62Timer=setInterval(window.__issue62Sample,50);})()`);
      const grantSeq = ++seq;
      const grant = await act('setCombatIntent', { seq: grantSeq, ttl: 45, targetId, intent: 'engage', defense }, false);
      assert(mode === 'natural' || grant.ok, `Controlled grant refused: ${grant.token}`);
      const actionsAtStart = result.actions.length, started = Date.now();
      console.log('OBSERVATION ONLY', JSON.stringify({ name, delay, defense, targetId }));
      let reactionShot = false, incomingShot = false, earlyReason;
      while (Date.now() - started < delay * 1000) {
        await sleep(Math.max(1, Math.min(200, delay * 1000 - (Date.now() - started))));
        const s = await observe();
        if (!reactionShot && Number.isFinite(s.control.combat?.defense?.reactedAt)) { await h.shot(`reaction-${attempt}`); reactionShot = true; }
        if (!incomingShot && ['hit', 'incoming-fire', 'incoming-dart'].includes(s.control.combat?.defense?.latestCue?.trigger)) { await h.shot(`incoming-reaction-${attempt}`); incomingShot = true; }
        if (s.control.owner !== 'combat' || s.session.phase !== 'playing' || s.flags.paused) { earlyReason = s.control.reason || s.session.phase; break; }
      }
      // The full public observation contains capability/discovery data. A 30s
      // buffer can exceed one CDP WebSocket message even while Chrome is fine.
      // Freeze the observer first, then copy bounded chunks without extending
      // the measured interval or touching the game/authorization state.
      const transfer = await h.c.eval('(()=>{clearInterval(window.__issue62Timer);window.__issue62Sample();return {count:window.__issue62Samples.length,stoppedWall:Date.now()};})()');
      assert(Number.isInteger(transfer.count) && transfer.count > 0 && transfer.count <= 2000, 'Invalid bounded observer buffer');
      Object.assign(transfer, { attempt, chunkSize: 10, received: 0, startedWall: Date.now() });
      (result.observerTransfers ||= []).push(transfer);
      const raw = [];
      try {
        for (let offset = 0; offset < transfer.count; offset += transfer.chunkSize) {
          const chunk = await h.c.eval(`window.__issue62Samples.slice(${offset},${Math.min(offset + transfer.chunkSize, transfer.count)})`);
          assert(Array.isArray(chunk) && chunk.length === Math.min(transfer.chunkSize, transfer.count - offset), 'Incomplete observer transfer chunk');
          raw.push(...chunk); transfer.received = raw.length;
        }
        transfer.finishedWall = Date.now();
      } catch (error) {
        transfer.error = error.stack || String(error);
        result.partialObserverSamples = raw;
        throw error;
      }
      const counter = eventCounter(); counter(raw[0].observation);
      const samples = raw.map(s => ({ ...s, delta: counter(s.observation) }));
      trial = { label: `${mode}-${encounter}-${defense}-${delay}-${attempt}`, targetId, grant, earlyReason,
        requestedWallSeconds: delay, actionsAtStart, actionsAtEnd: result.actions.length,
        noOuterActions: actionsAtStart === result.actions.length, samples };
      trial.observedWallSeconds = (transfer.stoppedWall - started) / 1000;
      const afterGrant = samples.filter(s => s.wall >= started);
      trial.completeGap = trial.observedWallSeconds >= delay && afterGrant.length > 0 && afterGrant.every(s => s.observation.control.owner === 'combat' && s.observation.control.expiresIn > 0);
      trial.metrics = summarize(samples, targetId, grantSeq); result.trials.push(trial);
      await writeFile(join(h.folder, `defense-trace-${attempt}.jsonl`), samples.map(s => JSON.stringify(s)).join('\n') + '\n');
      await save(); await h.shot(`after-delay-${attempt}`);
      assert(trial.noOuterActions && !samples.some(s => s.delta.epochReset), 'Measurement interrupted or mutated by outer control');
      trial.actualIncomingObserved = trial.metrics.incomingHitEvents > 0 || trial.metrics.cues.some(r => r.actualIncoming) || trial.metrics.reactions.some(r => ['incoming-fire', 'incoming-dart', 'hit'].includes(r.trigger));
      console.log('TRIAL', JSON.stringify({ label: trial.label, completeGap: trial.completeGap, actualIncomingObserved: trial.actualIncomingObserved, metrics: trial.metrics }));
      if (mode !== 'natural' || (trial.completeGap && trial.actualIncomingObserved) || Date.now() >= encounterEnd) break;
      // Real terminal/overlay ends a gap. Retargeting and new authorization are
      // outer decisions between trials, never counted inside a complete delay.
      await act('clearControl'); spent.add(targetId);
      let next = null;
      const searchEnd = Math.min(encounterEnd, Date.now() + 30000);
      while (Date.now() < searchEnd) {
        let s = await observe();
        if (s.session.phase !== 'playing' || s.ship.hull <= 40 || s.ship.engine <= 30 || s.gate.jumping) break;
        s = await resolveHail(s);
        next = s.targets.nearby.find(t => t.kind === 'ship' && t.hostile && !spent.has(t.id) && !t.disabled && !t.surrendered);
        if (next) break;
        await act('setControl', { seq: ++seq, ttl: 1, throttle: .2, steerX: .15, fireHeld: false }); await sleep(350);
      }
      await act('clearControl');
      if (!next) { result.nextOpponentUnavailable = true; break; }
      targetId = next.id; await act('selectTarget', { id: targetId });
      await wait(s => s.targets.aim?.targetId === targetId && Array.isArray(s.targets.aim?.bearing), 5, 'next public target aim');
      }
      result.actualIncomingObserved = result.trials.some(t => t.actualIncomingObserved);
      result.delayCovered = result.trials.some(t => t.completeGap && (mode === 'controlled' || t.actualIncomingObserved));
      result.coverageGaps = [!result.delayCovered && 'No complete requested delay with required incoming evidence', !result.actualIncomingObserved && 'No actual incoming shot/hit confirmed by public evidence', defense !== 'off' && !result.trials.some(t => t.metrics.reactions.length) && 'No defensive reaction observed'].filter(Boolean);
      // Cancellation and a new short grant are outside the observation-only window.
      await act('clearControl');
      const cleared = await observe();
      assert(cleared.control.owner === 'none' && !cleared.ship.fireHeld && cleared.ship.throttle === 0, 'Clear did not stop requested output');
      result.lifecycle = [{ case: 'clear', observation: cleared }];
      const receipt = await act('setCombatIntent', { seq: ++seq, ttl: 1, targetId, intent: 'engage', defense }, false);
      if (receipt.ok) {
        const expired = await wait(s => s.control.owner !== 'combat', 3, 'short lease ends');
        assert(!expired.ship.fireHeld && expired.ship.throttle === 0, 'Short grant release left output');
        const terminal = JSON.stringify(expired.control); await sleep(600);
        const later = await observe();
        assert(later.control.owner === 'none' && !later.ship.fireHeld && later.ship.throttle === 0, 'Later threat revived stopped authorization');
        assert(terminal === JSON.stringify(later.control), 'Terminal telemetry changed after later cues');
        result.lifecycle.push({ case: 'short-grant', receipt, observation: expired, expiryObserved: expired.control.reason === 'expired', stableTerminal: terminal === JSON.stringify(later.control), later });
      } else result.lifecycle.push({ case: 'short-grant-unavailable', receipt });
      result.probeHashEnd = await scriptHash(); assert(result.probeHashStart === result.probeHashEnd, 'Probe changed during measurement');
      await save(); console.log('DEFENSE METRICS', JSON.stringify({ metrics: trial.metrics, coverageGaps: result.coverageGaps }));
    } catch (error) {
      scenarioError = error;
      result.probeError = error.stack || String(error);
      throw error;
    } finally {
      result.probeCleanup = [];
      for (const [action, fn] of [
        ['stop-observer', () => h.c.eval('clearInterval(window.__issue62Timer)')],
        ['clear-control', () => act('clearControl', {}, false)],
      ]) {
        try { result.probeCleanup.push({ action, result: await fn() }); }
        catch (error) { result.probeCleanup.push({ action, error: error.stack || String(error) }); }
      }
      // Transport teardown belongs to runLive. Preserve the original failure
      // if its socket is already closed; cleanup must not replace its cause.
      if (!scenarioError && result.probeCleanup.some(row => row.error)) throw Error('Probe cleanup failed; see probeCleanup');
    }
  });
}

if (mode === 'compare') await compare(); else await live();
