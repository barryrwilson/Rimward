/**
 * Issue #61 supplemental live evidence (Codex implementation, Claude final QA).
 *   node scripts/issue-61-live-probe.mjs --mode natural --delay 30
 *   node scripts/issue-61-live-probe.mjs --mode controlled --pilot assisted --delay 30
 *   node scripts/issue-61-live-probe.mjs --mode controlled --pilot baseline --delay 30
 * ISSUE61_OUT controls evidence directory; each invocation starts a fresh profile.
 * Natural mode uses public APIs only, native RNG, ordinary stock Greenhand.
 * Controlled mode stages an isolated seeded combat setup, then uses public API
 * inputs only during measurement. It is never reported as natural gameplay.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { runLive, sleep, assert, eventCounter, measurements } from './issue-61-live-harness.mjs';

const argv = process.argv.slice(2);
function option(key, fallback) { const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1]; }
const mode = option('mode', 'natural'), pilot = option('pilot', 'assisted'), delay = Number(option('delay', '30'));
const scenario = option('scenario', 'combat');
const encounter = option('encounter', 'crossing');
const duration = Number(option('duration', '180'));
assert(['natural', 'controlled'].includes(mode), 'Mode must be natural or controlled');
assert(['assisted', 'baseline'].includes(pilot), 'Pilot must be assisted or baseline');
assert([5, 15, 30].includes(delay), 'Delay must be 5, 15, or 30');
assert(mode === 'controlled' || pilot === 'assisted', 'Natural mode currently exercises assisted intent; comparator is separately controlled');
assert(['combat', 'lifecycle'].includes(scenario) && (scenario !== 'lifecycle' || mode === 'controlled'), 'Lifecycle mode requires controlled profile');
assert(process.env.ISSUE61_TRANSPORT !== 'iab' || scenario === 'combat', 'IAB comparison transport does not synthesize human lifecycle input');
assert(['crossing', 'close'].includes(encounter), 'Encounter must be crossing or close');
assert(Number.isFinite(duration) && duration >= 180 && duration <= 300, 'Natural duration must be 180–300 wall seconds');
const name = option('name', `${mode}-${pilot}-${delay}-${Date.now()}`);

// Historical owner-recorded algorithm, unchanged gains/gates/close-pass policy.
function simpleControl(s) {
  const target = s.targets.current, aim = s.targets.aim;
  const bearing = aim?.lead?.bearing ?? aim?.bearing ?? s.targets.nearby.find(t => t.id === target?.id)?.bearing;
  if (!Array.isArray(bearing) || bearing.length !== 3 || !bearing.every(Number.isFinite)) return null;
  const [x, y, z] = bearing, yaw = Math.atan2(x, -z), pitch = Math.atan2(y, Math.hypot(x, z));
  const angle = Math.hypot(yaw, pitch), ahead = z < 0, range = Number(target.range), closing = Number(aim?.closing ?? 0);
  let throttle = range > 420 ? .85 : range > 270 ? .55 : range > 160 ? .3 : .1;
  if (!ahead || angle > .65) throttle = .15;
  if (range < 200 && closing < -20) throttle = 0;
  if (range < 70) throttle = 0;
  return { ttl: .65, steerX: Math.max(-1, Math.min(1, yaw * 2.2)), steerY: Math.max(-1, Math.min(1, pitch * 2.2)), throttle,
    fireHeld: ahead && angle < .07 && range < 480 && range > 25 && !s.ship.overheated && s.ship.heat < 75 };
}

const fixture = `(async()=>{
  const c=window.__ctx;
  const {spawnLiveShip}=await import(new URL('/src/systems/npc.js',location.origin).href);
  const {primeShipAsset,isShipAssetReady}=await import(new URL('/src/systems/ship-assets.js',location.origin).href);
  await Promise.resolve(primeShipAsset('redledger','cutter','pirate'));
  const end=Date.now()+20000;
  while(!isShipAssetReady('redledger','cutter','pirate')&&Date.now()<end)await new Promise(r=>setTimeout(r,100));
  if(!isShipAssetReady('redledger','cutter','pirate'))throw Error('Controlled asset not ready');
  // Controlled INITIAL state. Ambient records/hulls are moved coherently,
  // never removed or made invulnerable; target and player receive stock stats.
  const park=[80000,80000,80000],banks=new Set([c.world.records,...Object.values(c.world.recordBanks||{})]);
  let parked=0;
  for(const bank of banks)for(const r of bank||[]){
    if(!r.route?.length)continue;const p=r.route[0],dx=park[0]-p.x,dy=park[1]-p.y,dz=park[2]-p.z;
    for(const w of r.route){w.x+=dx;w.y+=dy;w.z+=dz;}parked++;
  }
  for(const s of c.ships)s.object.position.set(...park);
  const station=c.station.position,player=[station.x,station.y+2400,station.z],close=${encounter === 'close'},at=[player[0]+(close?40:130),player[1]+(close?15:25),player[2]-(close?90:300)];
  c.ship.object.position.set(...player);c.ship.object.quaternion.identity();c.ship.velocity.set(0,0,close?-45:0);c.ship.speed=close?45:0;
  c.input.throttle=close?.4:0;c.input.fullStop=!close;c.input.fireHeld=false;
  c.world.time=120;window.__issue61Seed=6101;
  const rec={id:'issue61-controlled',name:'Controlled Corsair',classKey:'cutter',faction:'redledger',role:'pirate',cargo:[],bounty:300,
    system:c.world.currentSystem,state:'enroute',live:true,route:[{x:at[0],y:at[1],z:at[2]},{x:at[0]+500,y:at[1],z:at[2]-200}],legLens:[538.516],leg:0,legT:0,dir:1,dwellUntil:0,resolveSeed:.95,personality:0};
  const live=spawnLiveShip(c,rec,new (c.ship.object.position.constructor)(...at));
  if(!live)throw Error('Controlled spawn refused');c.world.records.push(rec);c.ships.push(live);
  // Stage a fight already agreed to, avoiding an initial tribute card during
  // the delay. Later bargaining/surrender remain ordinary live NPC outcomes.
  Object.assign(live.ai,{intent:true,target:'player',playerRolled:true,playerInterested:true,demandSent:true,demandOutcome:'refused',hailed:false,mode:'hunt'});
  live.object.lookAt(c.ship.object.position);live.object.rotateY(Math.PI);
  return {id:live.id,at,player,parked,seed:6101,rngStateAfterSpawn:window.__issue61Seed,t:c.world.time,initialPlayer:{classKey:c.player.classKey,hull:c.player.hull,screen:c.player.screen,shell:c.player.shell,engine:c.player.engine,power:c.player.power,heat:c.player.heat,overheated:c.player.overheated,weaponGroup:c.input.weaponGroup,velocity:c.ship.velocity.toArray(),quaternion:c.ship.object.quaternion.toArray()},initialTarget:{classKey:live.state.classKey,hull:live.state.hull,screen:live.state.screen,shell:live.state.shell,engine:live.state.engine,heat:live.state.heat,resolve:live.state.resolve},fixture:'Fresh page/stock player; seeded RNG, initial world time/player pose, coherent ambient parking, spawned stock cutter and refused-demand history. No subsequent pose/state/damage injection during measurements; variable real frame cadence prevents identical trajectories. Lexical weapon cooldowns are fresh from page initialization, not reset by fixture.'};
})()`;

await runLive(name, mode, async h => {
  const { result, act, observe, wait, checkpoint, save } = h;
  result.requested = { mode, pilot, scenario, encounter, delayWallSeconds: delay, naturalDurationWallSeconds: duration, authorizationSimulationSeconds: 45 };
  result.method = mode === 'natural' ? 'Fresh stock Greenhand. Public start/launch/Jobs/target/controls/hail only; native RNG. No game state inspection via __ctx, state injection, fixture save, or seeded RNG.' : 'Separately labeled seeded initial fixture; live ordinary NPC/ship/combat loop and public pilot thereafter. Not natural gameplay or independent QA.';
  result.hitAttribution = 'npcHit does not identify shooter. Target hit activity is uncredited; net condition changes include recharge and other damage. playerFire increments are recorded separately.';
  let seq = 0, targetId = null;
  const counter = eventCounter();
  const resetCounter = s => { counter(s); };
  const sample = s => ({ wall: Date.now(), observation: s, delta: counter(s) });
  const terminal = s => s.session.phase !== 'playing' || s.ship.hull <= 0 || s.targets.current?.id !== targetId || s.targets.current?.disabled || s.targets.current?.surrendered;
  const clear = async () => { await act('clearControl', {}, false); };
  async function neutral() {
    for (let attempt = 0; attempt < 2; attempt++) {
      await clear(); let s = await observe();
      if (s.gate.jumping) s = await wait(s => !s.gate.jumping || s.session.phase !== 'playing', 30, 'ordinary jump finished before neutral control');
      if (s.session.phase === 'playing' && !s.flags.docked && !s.flags.paused && !s.hail.open && !s.autopilot.engaged && !s.ship.fleeEngaged) {
        const receipt = await act('setControl', { seq: ++seq, ttl: .3, throttle: 0, fireHeld: false }, false);
        if (!receipt.ok && receipt.token === 'jumping') continue;
        if (!receipt.ok && ['phase', 'overlay', 'docked', 'paused'].includes(receipt.token)) return;
        assert(receipt.ok, `Neutral control refused: ${receipt.token}`);
        await sleep(50); await clear();
      }
      return;
    }
    throw Error('Jump transition repeatedly preempted neutral control');
  }
  async function resolveCombatHail(s) {
    if (!s.hail.open) return s;
    const intents = s.hail.intents || [], speaker = s.hail.speaker?.id;
    const isTarget = speaker === targetId;
    const yielded = isTarget && (s.targets.current?.disabled || s.targets.current?.surrendered);
    const choice = yielded && intents.includes('letGo') ? 'letGo' : isTarget && !yielded && intents.includes('keepFiring') ? 'keepFiring' : intents.includes('refuseFight') ? 'refuseFight' : intents.includes('letGo') ? 'letGo' : null;
    if (!choice) { result.unresolvedHail = s.hail; throw Error('Hail needs an unsupported decision'); }
    await clear(); await act('hailResolve', { intent: choice, expectedConversationId: s.hail.conversationId });
    return wait(s => !s.hail.open, 3, 'hail resolved');
  }
  async function select(id) {
    await clear(); await act('selectTarget', { id });
    return wait(s => s.targets.current?.id === id && s.targets.aim?.targetId === id && Array.isArray(s.targets.aim?.bearing), 5, 'fresh identity-bound aim');
  }
  async function gap(label, seconds, expectedCombat) {
    const before = await observe(); resetCounter(before);
    const trial = { label, targetId, requestedWallSeconds: seconds, authorizationAtStart: before.control, actionsAtStart: result.actions.length, samples: [] };
    result.trials.push(trial); const start = Date.now(); trial.samples.push(sample(before));
    while (Date.now() - start < seconds * 1000) {
      await sleep(Math.min(200, Math.max(1, seconds * 1000 - (Date.now() - start))));
      const s = await observe(); trial.samples.push(sample(s));
      if (s.session.phase !== 'playing' || s.flags.paused) { trial.earlyReason = 'session-interrupted'; break; }
      if (expectedCombat && s.control.owner !== 'combat') { trial.earlyReason = s.control.reason || 'owner-released'; break; }
    }
    trial.observedWallSeconds = (Date.now() - start) / 1000; trial.actionsAtEnd = result.actions.length;
    trial.noOuterActions = trial.actionsAtStart === trial.actionsAtEnd;
    trial.completeGap = trial.observedWallSeconds >= seconds && (!expectedCombat || trial.samples.every(s => s.observation.control.owner === 'combat' && s.observation.control.expiresIn > 0));
    trial.metrics = measurements(trial.samples, targetId); await save(); await h.shot(label);
    console.log('TRIAL', label, JSON.stringify({ complete: trial.completeGap, metrics: trial.metrics }));
    assert(trial.noOuterActions, 'Outer control request occurred during observation-only gap');
    assert(!trial.samples.some(s => s.delta.epochReset), 'Recovery/reset invalidated measurement interval');
    return trial;
  }
  async function baselineWarmup(seconds) {
    const first = await observe(); resetCounter(first); const trial = { label: 'baseline-active', targetId, samples: [sample(first)] }; result.trials.push(trial);
    const start = Date.now();
    while (Date.now() - start < seconds * 1000) {
      const s = await observe(); trial.samples.push(sample(s)); if (terminal(s) || s.hail.open) { trial.earlyReason = 'terminal-or-overlay'; break; }
      const control = simpleControl(s); assert(control, 'Baseline lacks public bearing');
      await act('setControl', { seq: ++seq, ...control }); trial.samples.push(sample(await observe())); await sleep(150);
    }
    // Historical segment end explicitly brakes then releases before thinking.
    await act('setControl', { seq: ++seq, ttl: .3, throttle: 0, fireHeld: false }, false); await sleep(50); await clear();
    trial.activeWallSeconds = (Date.now() - start) / 1000;
    trial.completeWarmup = !trial.earlyReason && trial.activeWallSeconds >= seconds;
    trial.metrics = measurements(trial.samples, targetId); await save();
  }

  const fresh = await checkpoint('01-fresh');
  result.initialSession = {
    freshOriginChosen: result.actions.some(a => a.request.name === 'chooseOrigin' && a.request.args.id === 'greenhand' && a.value.ok),
    priorActiveJobs: fresh.jobs.active.length,
    observedTime: fresh.t,
  };
  assert(result.initialSession.freshOriginChosen && result.initialSession.priorActiveJobs === 0, 'Setup failure: resumed save or reused origin; a fresh origin and this-run Greenhand choice are required');
  assert(fresh.world.credits === 350 && fresh.world.scanner === 0, 'Expected untouched stock Greenhand');
  if (mode === 'controlled') {
    assert(fresh.ship.hull === fresh.ship.hullMax && fresh.ship.engine === fresh.ship.engineMax && fresh.ship.screen === fresh.ship.screenMax && fresh.ship.shell === fresh.ship.shellMax && fresh.ship.heat === 0 && !fresh.ship.overheated, 'Controlled pairing requires fresh stock condition');
    assert(!fresh.events.some(e => e.type === 'playerFire') && fresh.control.owner === 'none', 'Controlled pairing requires no prior combat or held grant');
    result.comparison = { pairId: option('pair', 'unpaired'), pilot, initialPublicShip: fresh.ship, initialControl: fresh.control, baselineSource: 'C:/Projects/WebSim/out/role-playtests-2026-09-07/harness/combat.mjs', baselinePolicy: { gain: 2.2, leaseSeconds: .65, postActionSleepMs: 150, fireAngleRadians: .07, fireRange: [25, 480], maxHeat: 75 }, adaptation: 'Same aim/throttle/fire math and 150ms post-action sleep; explicit shared sequence supplied by transport. Whole historical mission/surrender/safety planner is not reproduced; scenario stops on real terminal/overlay.' };
    result.comparison.baselineSourceHash = createHash('sha256').update(await readFile(result.comparison.baselineSource)).digest('hex');
    if (fresh.flags.docked) await act('undock');
    result.fixtureDetails = h.setupFixture ? await h.setupFixture() : await h.c.eval(fixture); targetId = result.fixtureDetails.id; await select(targetId); await checkpoint('02-controlled-setup');
    const f = result.fixtureDetails;
    result.comparison.initialFixtureHash = createHash('sha256').update(JSON.stringify({ player: f.initialPlayer, target: f.initialTarget, playerPosition: f.player, targetPosition: f.at, rngState: f.rngStateAfterSpawn, seed: f.seed, t: f.t })).digest('hex');
  } else {
    let s = await observe();
    if (!s.flags.docked) { await act(s.station.inZone ? 'dock' : 'approachDock'); await wait(s => s.flags.docked, 150, 'initial dock'); }
    await act('openService', { id: 'jobs' }); s = await checkpoint('02-jobs');
    result.jobOffers = s.jobs.offers;
    const patrol = s.jobs.offers.find(j => j.kind === 'patrol' && j.state === 'offered');
    const bounties = s.jobs.offers.filter(j => j.kind === 'bounty' && j.state === 'offered' && j.id !== 'bounty-ace').slice(0, 2);
    if (!bounties.length) { const fallback = s.jobs.offers.find(j => ['bounty', 'hunt'].includes(j.kind) && j.state === 'offered'); if (fallback) bounties.push(fallback); }
    result.acceptedJobReceipts = [];
    for (const job of [patrol, ...bounties].filter(Boolean)) result.acceptedJobReceipts.push({ id: job.id, receipt: await act('acceptJob', { id: job.id }) });
    result.acceptedJobs = (await observe()).jobs.active; result.creditsBeforeCombat = (await observe()).world.credits;
    const bountyNames = new Set(bounties.map(j => j.target));
    const searchDestination = s.jobs.offers.find(j => j.destSystem && j.destSystem !== s.world.currentSystem)?.destSystem;
    result.searchDestination = searchDestination;
    const searchSystem = s.world.currentSystem;
    await act('undock'); await wait(s => !s.flags.docked && !s.flags.berthHold, 10, 'public launch');
    const searchEnd = Date.now() + 120000; let routeStarted = false, laneReached = false;
    while (Date.now() < searchEnd) {
      s = await observe(); if (s.hail.open) s = await resolveCombatHail(s);
      const match = s.targets.nearby.find(t => t.kind === 'ship' && bountyNames.has(t.name))
        || s.targets.nearby.find(t => t.kind === 'ship' && t.hostile);
      if (match) { targetId = match.id; break; }
      // Search the public outbound lane, rather than circling the station.
      // The destination is learned from the visible Jobs board, not a private
      // record. Stop before a jump; no hidden NPC position is read.
      if (s.world.currentSystem !== searchSystem || s.gate.jumping) break;
      if (s.ship.hull < 50 || s.ship.engine < 40) throw Error('Natural search safety threshold reached');
      if (searchDestination && !routeStarted) { await clear(); await act('plotRoute', { dest: searchDestination }); await act('engageAutopilot'); routeStarted = true; }
      else if (routeStarted && !laneReached && (s.station.range > 1100 || s.gate.inZone)) { await act('cancelAutopilot'); await neutral(); laneReached = true; }
      else if (!routeStarted || laneReached || !s.autopilot.engaged) await act('setControl', { seq: ++seq, ttl: 1, throttle: .2, steerX: .2, fireHeld: false });
      await sleep(350);
    }
    assert(targetId, 'No eligible natural moving opponent in bounded public search'); await act('cancelAutopilot'); await neutral(); await select(targetId); await checkpoint('03-natural-target');
  }
  await act('setWeaponGroup', { n: 1 }); await sleep(100);
  let s = await observe(); if (s.hail.open) s = await resolveCombatHail(s);
  assert(!terminal(s), 'Target became terminal before measurement');
  if (mode === 'natural') {
    const required = [5, 15, 30], covered = new Set(), spent = new Set();
    const startWall = Date.now(), endWall = startWall + duration * 1000;
    result.sustained = { start: s, startedWall: startWall, requestedWallSeconds: duration, grants: [], decisions: [], requiredGaps: required, coveredGaps: [] };
    let windowNumber = 0, searchingRoute = false;
    const matchingJobEvents = () => result.jobEvents.filter(e => result.acceptedJobReceipts.some(j => j.id === e.id && e.t >= j.receipt.t));
    const completedJob = id => matchingJobEvents().some(e => e.id === id && ['done', 'delivered'].includes(e.outcome));
    while (Date.now() < endWall) {
      s = await observe();
      if (s.session.phase !== 'playing' || s.ship.hull <= 0) { result.sustained.stopReason = 'player-defeated'; break; }
      if (s.flags.paused || s.control.reason === 'player-override') { result.sustained.stopReason = 'human-interruption'; break; }
      if (required.every(n => covered.has(n)) && result.acceptedJobs.some(j => completedJob(j.id))) { result.sustained.stopReason = 'required-combat-and-career-evidence-complete'; break; }
      if (result.acceptedJobs.length && result.acceptedJobs.every(j => completedJob(j.id))) { result.sustained.stopReason = 'accepted-career-goals-complete'; break; }
      if (s.ship.hull < 35 || s.ship.engine < 25) {
        result.sustained.stopReason = 'condition-retreat';
        if (!terminal(s) && !s.hail.open) {
          const receipt = await act('setCombatIntent', { seq: ++seq, ttl: 45, targetId, intent: 'retreat' }, false);
          result.sustained.decisions.push({ t: s.t, reason: 'condition-retreat', receipt });
          if (receipt.ok) await gap('natural-condition-retreat', 10, true);
        }
        break;
      }
      if (s.targets.current?.disabled || s.targets.current?.surrendered) spent.add(s.targets.current.id);
      if (s.hail.open) {
        result.sustained.decisions.push({ t: s.t, reason: 'read-offered-terms', speaker: s.hail.speaker, conversationId: s.hail.conversationId });
        s = await resolveCombatHail(s); continue;
      }
      if (terminal(s) || spent.has(targetId)) {
        const outstandingNames = new Set(result.acceptedJobs.filter(j => j.target && !completedJob(j.id)).map(j => j.target));
        const candidate = s.targets.nearby.find(t => t.kind === 'ship' && !spent.has(t.id) && outstandingNames.has(t.name))
          || s.targets.nearby.find(t => t.kind === 'ship' && !spent.has(t.id) && t.hostile);
        if (candidate) {
          await act('cancelAutopilot'); await neutral(); targetId = candidate.id; await select(targetId);
          result.sustained.decisions.push({ t: s.t, reason: 'select-next-public-opponent', targetId, name: candidate.name }); searchingRoute = false;
        } else {
          await clear();
          if (!searchingRoute && result.searchDestination) {
            await act('plotRoute', { dest: result.searchDestination }); const ap = await act('engageAutopilot', {}, false); searchingRoute = ap.ok;
          } else if (s.gate.inZone || s.station.range > 1200) { await act('cancelAutopilot'); await neutral(); searchingRoute = false; }
          else if (!s.autopilot.engaged) await act('setControl', { seq: ++seq, ttl: 1, throttle: .2, steerX: .2, fireHeld: false });
          await sleep(350); continue;
        }
      }
      const requested = required.find(n => !covered.has(n)) || 15;
      const seconds = Math.min(requested, Math.max(1, Math.ceil((endWall - Date.now()) / 1000)));
      // Renew deliberately at an outer decision boundary. There is no clear,
      // full stop or optional lifecycle experiment between valid same-target
      // windows; the controller continues moving throughout that decision.
      const grant = await act('setCombatIntent', { seq: ++seq, ttl: 60, targetId, intent: 'engage' }, false);
      result.sustained.grants.push({ targetId, requestedGap: requested, receipt: grant });
      if (!grant.ok) {
        if (grant.token === 'overlay') continue;
        if (['target-disabled', 'target-surrendered', 'target-destroyed', 'target-lost', 'target-changed'].includes(grant.token)) { await sleep(100); continue; }
        throw Error(`Sustained combat intent refused: ${grant.token}`);
      }
      const trial = await gap(`natural-gap-${requested}-${++windowNumber}`, seconds, true);
      trial.requiredGap = requested; trial.fullRequirement = seconds === requested && trial.completeGap;
      if (trial.fullRequirement) covered.add(requested);
      result.sustained.coveredGaps = [...covered].filter(n => required.includes(n));
      if (trial.earlyReason === 'player-override') { result.sustained.stopReason = 'human-interruption'; break; }
      if (trial.earlyReason && !['overlay', 'target-disabled', 'target-surrendered', 'target-destroyed', 'target-lost', 'target-changed', 'session-interrupted'].includes(trial.earlyReason)) throw Error(`Unexpected sustained release: ${trial.earlyReason}`);
      await save();
    }
    result.sustained.stopReason ||= 'bounded-career-window-ended';
    result.sustained.endedWall = Date.now(); result.sustained.observedWallSeconds = (Date.now() - startWall) / 1000;
    result.careerAttempt = { start: result.sustained.start, afterFight: await observe(), completions: matchingJobEvents() };
    await clear(); s = await observe();
    if (s.hail.open && result.sustained.stopReason !== 'human-interruption') s = await resolveCombatHail(s);
    if (s.session.phase === 'playing' && !s.flags.paused && !s.flags.docked && !s.hail.open && result.sustained.stopReason !== 'human-interruption') {
      await act('cancelAutopilot'); await neutral(); const dock = await act('approachDock', {}, false);
      result.sustained.dockReceipt = dock;
      if (dock.ok) { await wait(s => s.flags.docked || s.session.phase !== 'playing', 150, 'safe career dock'); if ((await observe()).flags.docked) await act('openService', { id: 'jobs' }); }
    }
    const final = await checkpoint('natural-career-final');
    result.careerAttempt.final = final; result.careerAttempt.completions = matchingJobEvents();
    result.careerAttempt.completed = result.careerAttempt.completions.some(e => ['done', 'delivered'].includes(e.outcome));
    result.careerAttempt.creditsDelta = final.world.credits - result.creditsBeforeCombat;
    result.delayCovered = required.every(n => covered.has(n));
    result.firingObserved = result.trials.some(t => t.metrics?.playerShots > 0);
    result.passObserved = result.trials.some(t => t.metrics?.approachThenSeparationObserved);
    result.coverageGaps = [...required.filter(n => !covered.has(n)).map(n => `no complete ${n}s valid-authorization window`), !result.firingObserved && 'no actual player shots', !result.passObserved && 'no approach-pass-separation cycle', !result.careerAttempt.completed && 'no accepted bounty/patrol completion'].filter(Boolean);
    result.acceptance = {
      scope: 'Supplemental natural combat coverage; not independent QA or a guaranteed-win criterion',
      pass: result.delayCovered && result.firingObserved && result.passObserved,
      failures: result.coverageGaps.filter(reason => reason !== 'no accepted bounty/patrol completion'),
      careerCompletionObserved: result.careerAttempt.completed,
    };
    await writeFile(join(h.folder, 'measurements.json'), JSON.stringify({ mode, duration, coverage: result.sustained.coveredGaps, coverageGaps: result.coverageGaps, stopReason: result.sustained.stopReason, trials: result.trials.map(({ samples, ...trial }) => trial), career: result.careerAttempt }, null, 2));
    await save(); return;
  }
  if (scenario === 'lifecycle') {
    result.lifecycle = [];
    const start = ttl => act('setCombatIntent', { seq: ++seq, ttl, targetId, intent: 'retreat' });
    await start(45); await sleep(100);
    const conflict = await act('setControl', { seq: seq + 1, ttl: 1, throttle: .5 }, false);
    assert(!conflict.ok && conflict.token === 'helm', 'Raw/combat ownership conflict was not refused');
    result.lifecycle.push({ case: 'raw-owner-conflict', receipt: conflict, observation: await observe() });
    await clear(); s = await wait(s => s.control.owner === 'none', 2, 'explicit cancellation');
    assert(!s.ship.fireHeld && s.ship.throttle === 0, 'Clear left combat output');
    result.lifecycle.push({ case: 'explicit-clear', observation: s });
    await start(1); s = await wait(s => s.control.owner !== 'combat', 3, 'short expiry');
    assert(s.control.reason === 'expired' && !s.ship.fireHeld && s.ship.throttle === 0, 'Short authorization did not expire safely');
    result.lifecycle.push({ case: 'expiry', observation: s });
    // One visible Chrome window: switch its tab to exercise real blur/hidden
    // without treating either event as a human flight-control takeover.
    await start(45); await sleep(100);
    const other = await h.c.send('Target.createTarget', { url: 'about:blank' });
    await h.c.send('Target.activateTarget', { targetId: other.targetId }); await sleep(1500);
    s = await observe();
    const hidden = await h.c.eval('({visibility:document.visibilityState,focused:document.hasFocus()})');
    assert(s.control.owner === 'combat' && s.control.expiresIn > 0, 'Blur/hidden canceled valid combat authorization');
    result.lifecycle.push({ case: 'blur-hidden-continues', document: hidden, observation: s });
    await h.c.send('Target.closeTarget', { targetId: other.targetId }); await h.c.send('Page.bringToFront');
    await clear(); await start(1);
    const expiredTab = await h.c.send('Target.createTarget', { url: 'about:blank' });
    await h.c.send('Target.activateTarget', { targetId: expiredTab.targetId }); await sleep(1400);
    await h.c.send('Target.closeTarget', { targetId: expiredTab.targetId }); await h.c.send('Page.bringToFront');
    s = await observe();
    assert(s.control.owner === 'none' && s.control.reason === 'expired' && !s.ship.fireHeld, 'Returning from hidden tab revived expired authority');
    result.lifecycle.push({ case: 'hidden-expiry', observation: s });
    await start(45); await sleep(100);
    await h.c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 760, y: 440 });
    s = await wait(s => s.control.owner !== 'combat', 2, 'human mouse takeover');
    assert(s.control.reason === 'player-override' && !s.ship.fireHeld, 'Mouse did not take control');
    result.lifecycle.push({ case: 'mouse-takeover', observation: s });
    await start(45); await sleep(100);
    const key = async type => h.c.send('Input.dispatchKeyEvent', { type, key: 'p', code: 'KeyP', windowsVirtualKeyCode: 80, nativeVirtualKeyCode: 80 });
    await key('keyDown'); await key('keyUp');
    s = await wait(s => s.flags.paused, 2, 'physical pause');
    const pausedReason = s.control.reason;
    const stopped = await act('clearControl'); s = await observe();
    assert(s.control.owner === 'none' && !s.ship.fireHeld && s.ship.throttle === 0, 'Frozen-loop cancellation retained control');
    assert(s.control.reason === pausedReason, 'Idempotent clear erased pause cancellation reason');
    result.lifecycle.push({ case: 'paused-clear', receipt: stopped, observation: s });
    await key('keyDown'); await key('keyUp'); s = await wait(s => !s.flags.paused, 2, 'resume');
    assert(s.control.owner === 'none' && !s.ship.fireHeld, 'Resume revived combat authority');
    result.lifecycle.push({ case: 'resume', observation: s });
    await neutral(); await checkpoint('lifecycle-final'); await save(); return;
  }
  if (pilot === 'baseline') {
    await baselineWarmup(8); const trial = await gap('baseline-delay', delay, false); result.delayCovered = trial.completeGap;
    result.baselinePolicy = 'Historic gain2.2/ttl0.65 controller for 8 wall seconds then historic explicit full-stop/clear while outer agent waits. No refresh during delay. Seeded controlled comparator only.';
  } else {
    // Bounded retries are NEW authorizations after an observed interruption;
    // no hail decision, retarget, renewal or raw input occurs inside a gap.
    for (let attempt = 1; attempt <= (mode === 'natural' ? 3 : 1); attempt++) {
      s = await observe(); if (s.hail.open) s = await resolveCombatHail(s);
      if (terminal(s)) break;
      await clear(); await act('setCombatIntent', { seq: ++seq, ttl: 45, targetId, intent: 'engage' });
      await wait(s => s.control.owner === 'combat' || s.control.state !== 'active', 2, 'combat acquisition');
      if (mode === 'controlled') {
        const warmup = await gap('assisted-active', 8, true);
        if (!warmup.completeGap) { result.delayCovered = false; break; }
      }
      const trial = await gap(`assisted-delay-${attempt}`, delay, true);
      if (trial.completeGap) { result.delayCovered = true; break; }
      result.delayCovered = false;
      if (trial.earlyReason && !['overlay', 'target-surrendered', 'target-disabled', 'target-destroyed', 'target-lost'].includes(trial.earlyReason)) throw Error(`Unexpected combat release: ${trial.earlyReason}`);
      if (mode === 'controlled') break;
    }
  }
  await checkpoint('04-delay-end');
  // Cancellation is tested even after a short/incomplete combat interval.
  const cancelAt = await observe(); await clear(); s = await wait(s => s.control.owner !== 'combat' && !s.ship.fireHeld, 3, 'clear cease-fire');
  result.cancel = { at: cancelAt.t, after: s.control, fireHeld: s.ship.fireHeld, throttle: s.ship.throttle };
  assert(s.ship.throttle === 0, 'Combat cancellation retained throttle');
  // Natural combat proceeds to its career outcome without inserting optional
  // lifecycle restarts that can race a freshly opening negotiation. The
  // dedicated controlled lifecycle scenario already covers these transitions.
  if (mode === 'controlled' && h.c && pilot === 'assisted' && !terminal(s) && !s.hail.open) {
    await act('setCombatIntent', { seq: ++seq, ttl: 1, targetId, intent: 'engage' });
    s = await wait(s => s.control.owner !== 'combat', 3, 'authorization expiry');
    result.expiry = { control: s.control, ship: s.ship };
    if (s.control.reason === 'expired') assert(!s.ship.fireHeld && s.ship.throttle === 0, 'Expiry did not release safely');
    else result.expiry.interrupted = 'A live terminal/overlay preempted the expiry scenario; expiry coverage remains in the separate lifecycle profile.';
    if (!terminal(s) && !s.hail.open) {
      await act('setCombatIntent', { seq: ++seq, ttl: 45, targetId, intent: 'engage' });
      await sleep(100); await h.c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 760, y: 440 });
      s = await wait(s => s.control.owner !== 'combat', 3, 'human mouse takeover');
      result.humanTakeover = { control: s.control, ship: s.ship };
      assert(s.control.reason === 'player-override' && !s.ship.fireHeld, 'Mouse takeover failed');
    }
  }
  if (mode === 'natural') {
    // Career attempt continues only through deliberate new API decisions.
    const end = Date.now() + 90000; result.careerAttempt = { start: await observe(), completions: [] };
    while (Date.now() < end) {
      s = await observe();
      result.careerAttempt.completions = result.jobEvents.filter(e => result.acceptedJobReceipts.some(j => j.id === e.id && e.t >= j.receipt.t));
      if (terminal(s) || s.ship.hull < 50 || s.ship.engine < 40) break;
      if (s.hail.open) { await resolveCombatHail(s); continue; }
      if (s.control.owner !== 'combat' || s.control.expiresIn < 10) {
        const receipt = await act('setCombatIntent', { seq: ++seq, ttl: 45, targetId, intent: 'engage' }, false);
        if (!receipt.ok && receipt.token !== 'overlay') throw Error(`Career combat intent refused: ${receipt.token}`);
        if (!receipt.ok) { result.careerAttempt.overlayRaces = (result.careerAttempt.overlayRaces || 0) + 1; continue; }
      }
      await sleep(500);
    }
    await neutral(); s = await observe(); if (s.hail.open) s = await resolveCombatHail(s);
    result.careerAttempt.afterFight = s;
    if (s.session.phase === 'playing' && !s.hail.open && !s.flags.docked) {
      const receipt = await act('approachDock', {}, false);
      if (receipt.ok) { await wait(s => s.flags.docked, 180, 'safe public dock'); await act('openService', { id: 'jobs' }); }
    }
    result.careerAttempt.final = await checkpoint('05-career-final');
    const final = result.careerAttempt.final;
    result.careerAttempt.completions = result.jobEvents.filter(e => result.acceptedJobReceipts.some(j => j.id === e.id && e.t >= j.receipt.t));
    result.careerAttempt.creditsDelta = final.world.credits - result.creditsBeforeCombat;
    result.careerAttempt.completed = result.careerAttempt.completions.some(e => ['done', 'delivered'].includes(e.outcome));
  }
  await neutral(); await checkpoint('06-final-safe');
  result.acceptance = { scope: 'Supplemental controlled coverage; not natural gameplay or independent QA', pass: Boolean(result.delayCovered), failures: result.delayCovered ? [] : [`Required ${delay}s delay not covered`] };
  await writeFile(join(h.folder, 'measurements.json'), JSON.stringify({ mode, pilot, delay, coverage: result.delayCovered, trials: result.trials.map(({ samples, ...trial }) => trial), career: result.careerAttempt?.completed ?? null }, null, 2));
  assert(result.delayCovered, `Required ${delay}-second uninterrupted valid-authorization interval not demonstrated; evidence retained`);
  if (pilot === 'assisted') {
    const trial = result.trials.find(t => t.completeGap && t.label.startsWith('assisted-delay'));
    assert(trial.metrics.sampledDistance > Math.max(2, trial.metrics.simulationSeconds), 'Valid authority did not produce sustained movement');
    assert(trial.metrics.targetMovingObserved, 'Required moving-target encounter not demonstrated');
    // Firing/pass coverage is explicit, not inferred from phase strings alone.
    result.firingObserved = result.trials.some(t => t.metrics?.playerShots > 0);
    result.passObserved = result.trials.some(t => t.metrics?.approachThenSeparationObserved);
    result.coverageGaps = [!result.firingObserved && 'no shots in recorded combat window', !result.passObserved && 'no sampled approach-pass-separation cycle'].filter(Boolean);
    await save();
  }
}, mode === 'controlled' ? { fixtureSource: fixture } : {});
