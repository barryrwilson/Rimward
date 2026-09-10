/** Issue #10 diagnostic, not a balance assertion or natural incidence estimate.
 * node --import ./scripts/with-css-stub.mjs scripts/issue-10-starter-pacing-probe.mjs --out <directory>
 * Each seed/origin/path boots in a fresh process, with an empty harness save.
 * Seeded RNG is installed before importing the game. Full system updates run
 * at 60 Hz, including NPC movement, real projectiles/collision and damage.
 * DOM/rendering are stubbed: live browser evidence remains a separate gate.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const out = resolve(arg('--out') ?? 'out/issue-10-evidence');
const scenarios = ['idle', 'depart', 'dock-return', 'outside-watch'];
const seeds = [0x5eed1234, 1, 42, 20260910];
mkdirSync(out, { recursive: true });

if (!arg('--case')) {
  const results = [];
  for (const origin of ['greenhand', 'beautiful']) for (const seed of seeds) for (const scenario of scenarios) {
    const id = `${origin}-${seed}-${scenario}`;
    const child = spawnSync(process.execPath, ['--import', './scripts/with-css-stub.mjs', fileURLToPath(import.meta.url), '--case', id, '--origin', origin, '--seed', String(seed), '--scenario', scenario, '--out', out], { cwd: root, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
    writeFileSync(resolve(out, `${id}.log`), child.stdout + child.stderr);
    assert.equal(child.status, 0, `${id}: ${child.error ?? child.stderr}\n${child.stdout.slice(-2000)}`);
    const r = JSON.parse(readFileSync(resolve(out, `${id}.json`), 'utf8'));
    results.push(r);
    console.log(JSON.stringify({ id, seconds: r.final.t, firstMinute: r.firstMinute, total: r.counts, maxStationRange: r.maxStationRange, stages: r.stages }));
  }
  writeFileSync(resolve(out, 'starter-pacing-summary.json'), JSON.stringify({ method: 'Reproducible seeded full-system simulation samples; not native browser RNG incidence or a proof of universal safety.', seeds, scenarios, results }, null, 2));
  process.exit(0);
}

const seed = Number(arg('--seed')), origin = arg('--origin'), scenario = arg('--scenario'), id = arg('--case');
assert.ok(seeds.includes(seed) && ['greenhand', 'beautiful'].includes(origin) && scenarios.includes(scenario));
let randomState = seed >>> 0;
Math.random = () => { randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0; return randomState / 0x100000000; };
const { installDomStubs, bootGameSystems } = await import('./lib/boot-harness.mjs');
installDomStubs(); window.location.search = '?agent=1';
const { ctx, systems } = await bootGameSystems();
// Isolated policy inputs: these are boundary contracts, not observed trips.
const { starterGraceBlocksAcquire } = await import('../src/systems/npc.js');
const contracts = [];
for (const o of ['greenhand', 'beautiful']) for (const [time, system, expected] of [[179.99, 'freehold', true], [180, 'freehold', false], [180.01, 'freehold', false], [60, 'veridian', false], [60, 'freehold', true], [181, 'veridian', false], [181, 'freehold', false]]) {
  const input = { world: { origin: o, currentSystem: system, time, jumpGraceUntil: 0 } };
  const actual = starterGraceBlocksAcquire(input, { record: {} }, time);
  assert.equal(actual, expected, `grace ${o} ${system} ${time}`);
  contracts.push({ origin: o, time, system, expected, actual });
}
const api = window.rimward;
const DT = 1 / 60;
let seq = 0, stage = 'fresh', launchAt = null, departedAt = null;
const emptyCounts = () => ({ intentFrames: 0, playerShots: 0, npcShots: 0, playerHits: 0, weaponHits: 0, impactHits: 0, weaponDamage: 0, impactDamage: 0, demands: 0, deaths: 0, sunHeatCues: 0, sunKills: 0 });
const result = { id, seed, origin, scenario, method: 'Fresh-process seeded world; stock origin; public start/origin/dock/launch/control actions. Navigation dismisses ambient surrender hails with letGo; incoming demands remain unresolved. Idle means untouched default controls, including normal creep. No NPC/position/defense/clock injection. Range-based path staging reads station distance as diagnostic telemetry.', contracts, dt: DT, initial: null, final: null, counts: emptyCounts(), firstMinute: emptyCounts(), first: {}, stages: [], transitions: [], events: [], samples: [], dismissals: [], maxStationRange: 0 };
function act(name, args = {}) {
  const r = api.act({ v: 2, name, args });
  if (!r.ok) assert.fail(`${name}: ${JSON.stringify(r)} ${JSON.stringify({ flags: api.observe().flags, hail: api.observe().hail, stages: result.stages, events: result.events })}`);
  return r;
}
function range() { return ctx.ship.object.position.distanceTo(ctx.config.world.stationPosition); }
function changeStage(next) { stage = next; result.stages.push({ stage, t: ctx.world.time, stationRange: range() }); }
function sample() {
  return { t: ctx.world.time, stage, origin: ctx.world.origin, system: ctx.world.currentSystem, stationRange: range(), docked: ctx.flags.docked, position: ctx.ship.object.position.toArray(), screen: ctx.player.screen, shell: ctx.player.shell, hull: ctx.player.hull, destroyed: ctx.player.destroyed, activeIntents: ctx.ships.filter(l => l.ai?.intent && l.ai?.target === 'player').map(l => l.id), ships: ctx.ships.length, firstScare: ctx.world.milestones.includes('firstScare') };
}
function count(key, n = 1) { result.counts[key] += n; if (ctx.world.time <= 60 + DT / 2) result.firstMinute[key] += n; }
act('startGame'); act('chooseOrigin', { id: origin });
assert.equal(ctx.world.origin, origin); assert.equal(ctx.player.classKey, 'light');
result.initial = sample();
const seenIntents = new Set();
const duration = scenario === 'outside-watch' ? 240 : scenario === 'dock-return' ? 120 : 60;
for (let frame = 0; frame < duration * 60; frame++) {
  // Script controls use ordinary API leases. No clock jumping, teleporting,
  // forced intent, target removal, invulnerability, or forced damage.
  const hail = frame % 30 === 0 ? api.observe().hail : null;
  if (hail?.open && scenario !== 'idle' && hail.intents.includes('letGo')) {
    result.dismissals.push({ t: ctx.world.time, kind: hail.kind, speaker: hail.speaker });
    act('hailResolve', { intent: 'letGo', expectedConversationId: hail.conversationId });
  }
  if (frame % 30 === 0 && !hail?.open && !ctx.player.destroyed) {
    if (scenario === 'depart') act('setControl', { seq: ++seq, ttl: 1, throttle: 0.5, steerX: 0, steerY: 0 });
    if (scenario === 'dock-return' || scenario === 'outside-watch') {
      if (stage === 'fresh') { act('approachDock'); changeStage('docking'); }
      if (stage === 'docking' && ctx.flags.docked) { act('undock'); launchAt = ctx.world.time; changeStage('outbound'); }
      if (stage === 'outbound' && ctx.world.time > launchAt) {
        act('setControl', { seq: ++seq, ttl: 1, throttle: 0.5, steerX: 0, steerY: 0 });
        if (range() > 650) { departedAt = ctx.world.time; act('clearControl'); changeStage('outside'); }
      }
      if (stage === 'outside') {
        act('setControl', { seq: ++seq, ttl: 1, throttle: 0, steerX: 0, steerY: 0 });
        if (scenario === 'dock-return' && ctx.world.time - departedAt >= 10) { act('clearControl'); act('approachDock'); changeStage('returning'); }
      }
      if (stage === 'returning' && ctx.flags.docked) changeStage('returned');
    }
  }
  assert.equal(ctx.flags.paused, false, `Unexpected paused simulation at ${ctx.world.time}`);
  ctx.elapsed += DT; ctx.world.time += DT;
  for (const [, system] of systems) system.update?.(DT, ctx);
  result.maxStationRange = Math.max(result.maxStationRange, range());
  const intents = ctx.ships.filter(l => l.ai?.intent && l.ai?.target === 'player');
  if (intents.length) count('intentFrames');
  for (const live of intents) if (!seenIntents.has(live.id)) {
    seenIntents.add(live.id);
    const row = { t: ctx.world.time, stationRange: range(), id: live.id, role: live.ai.role, mode: live.ai.mode, phase: live.ai.phase, alwaysHuntsPlayer: live.record?.alwaysHuntsPlayer === true };
    result.transitions.push(row); result.first.intent ??= row;
  }
  for (const e of ctx.events) {
    if (e.type === 'npcFire') count(e.target === 'player' || (!e.target && e.ship?.ai?.target === 'player') ? 'playerShots' : 'npcShots');
    if (e.type === 'playerHit') {
      count('playerHits'); const weapon = e.family !== 'impact';
      count(weapon ? 'weaponHits' : 'impactHits'); count(weapon ? 'weaponDamage' : 'impactDamage', e.damage ?? 0);
    }
    if (e.type === 'hailOpened' && e.ship?.ai?.demanding) count('demands');
    if (e.type === 'playerDestroyed') count('deaths');
    if (e.type === 'sunHeat') count('sunHeatCues');
    if (e.type === 'sunKill') count('sunKills');
    if (['playerHit', 'playerDestroyed', 'hailOpened', 'milestone', 'sunHeat', 'sunKill', 'bodyHit'].includes(e.type) || (e.type === 'npcFire' && (e.target === 'player' || (!e.target && e.ship?.ai?.target === 'player')))) {
      const row = { t: ctx.world.time, type: e.type, stationRange: range(), shipId: e.ship?.id, weapon: e.weapon, family: e.family, damage: e.damage, id: e.id, line: e.line };
      result.events.push(row); result.first[e.type] ??= row;
    }
  }
  if (frame % 60 === 59) result.samples.push(sample());
  ctx.lastEvents = ctx.events; ctx.events = [];
}
result.final = sample(); result.launchAt = launchAt;
result.aliveSeconds = result.first.playerDestroyed?.t ?? result.final.t;
result.firstMinuteAliveSeconds = Math.min(60, result.aliveSeconds);
assert.equal(result.final.firstScare, false, 'Passive/no-fire paths must not earn First Scare');
if (scenario === 'dock-return') assert.equal(stage, 'returned', 'The return path must actually redock');
if (scenario === 'outside-watch') assert.ok(departedAt !== null && result.final.stationRange > 300, 'Outside watch must leave station law radius');
writeFileSync(resolve(out, `${id}.json`), JSON.stringify(result, null, 2));
console.log('RESULT', JSON.stringify({ id, firstMinute: result.firstMinute, counts: result.counts, final: result.final }));
