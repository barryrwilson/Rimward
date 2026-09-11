/**
 * Issue #115 — scoop receipts a pirate can observe.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real pods and agent-api
 * systems over one ctx, the real observe() builder. No copied scoop logic.
 *
 * Covered:
 *   1  every pod carries a session-unique string id, and targets.nearby pod
 *      rows publish that id plus the pod's total units
 *   2  a real proximity scoop emits podCollected { pod, units, commodity } and
 *      the session ring row keeps podId/units/commodity with no pod object
 *   3  the ring row survives a ring saturated with combat/mine rows (the
 *      pirate case) instead of being evicted on arrival
 *   4  a pod that does not fit is refused with ONE podBlocked { podId, units,
 *      free } per pod per free-space value — not one per frame — the pod stays
 *      in the world, the hold is untouched, and a second blocked pod earns its
 *      own receipt
 *   5  making room changes `free`: each still-blocked pod earns one fresh
 *      receipt, then both scoop normally once they fit
 *   6  survivor pods report commodity 'survivor'; an empty pod reports units 0
 *      and no commodity
 *   7  no scoop or refusal is produced while docked
 *
 * Fixture honesty: the hold is filled by writing ctx.cargo directly and said
 * so (privilegedFixture); pods are spawned through the real spawnPod /
 * spawnSurvivorPod. Every receipt and cargo change asserted is produced by the
 * real pods system.
 *
 * Run: npm run test:pod-receipts
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { spawnPod, spawnSurvivorPod, podUnits } = await import('../src/game/pods.js');
const { buildObservation } = await import('../src/game/agent-observe.js');
const { EVENT_CAP, pushRing } = await import('../src/game/agent-schema.js');

const DT = 1 / 60;
const allEvents = [];
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const SCOOP = only('pods', 'agentapi');
const mark = () => allEvents.length;
const since = (m, type) => allEvents.slice(m).filter((e) => e.type === type);
const ringRows = (type) => (ctx.agent && Array.isArray(ctx.agent.events) ? ctx.agent.events : []).filter((e) => e && e.type === type);
const nearbyPods = () => (buildObservation(ctx).targets.nearby || []).filter((r) => r && r.kind === 'pod');
const held = () => ctx.cargo.reduce((n, c) => n + c.units, 0);

// New game from the title screen, then clear the lane and park in open space.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.flags.docked = false;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.velocity.set(0, 0, 0);
ctx.pods.length = 0;
ctx.cargo.length = 0; // privilegedFixture: empty hold
ctx.agent.optIn = true;
ctx.agent.events.length = 0;
const here = () => ctx.ship.object.position.clone();
const away = (d) => here().add(new THREE.Vector3(d, 0, 0));
const still = new THREE.Vector3(0, 0, 0);
const cap = ctx.cargoCapacity;
pin('fixture: cargo capacity known', typeof cap === 'number' && cap >= 20, cap);

// 1 — identity and units in nearby rows.
const podA = spawnPod(ctx, [{ commodity: 'rawOre', units: 4 }, { commodity: 'refinedMetals', units: 2 }], away(80), still);
const podB = spawnPod(ctx, [{ commodity: 'rawOre', units: 3 }], away(120), still);
pin('pods carry string ids', typeof podA.id === 'string' && /^pod-\d+$/.test(podA.id) && typeof podB.id === 'string', [podA.id, podB.id]);
pin('pod ids distinct', podA.id !== podB.id);
pin('podUnits sums contents', podUnits(podA) === 6 && podUnits(podB) === 3);
{
  const rows = nearbyPods();
  const a = rows.find((r) => r.id === podA.id);
  const b = rows.find((r) => r.id === podB.id);
  pin('nearby pod rows publish id and units', !!a && !!b && a.units === 6 && b.units === 3, rows);
  pin('nearby pod row name is the commodity bracket name', !!a && a.name === binds.COMMODITIES.rawOre.name, a);
  pin('nearby pod row is JSON-plain', !!a && Object.values(a).every((v) => typeof v !== 'object' || Array.isArray(v)));
}

// 2 — a real scoop with room in the hold.
let m = mark();
ctx.ship.object.position.copy(podA.mesh.position);
tick(2, SCOOP);
{
  const raw = since(m, 'podCollected');
  pin('scoop emits one podCollected', raw.length === 1, raw.length);
  pin('raw podCollected carries pod, units, commodity', raw.length === 1 && raw[0].pod === podA && raw[0].units === 6 && raw[0].commodity === 'rawOre', raw[0] && { units: raw[0].units, commodity: raw[0].commodity });
  pin('pod removed and cargo merged', !ctx.pods.includes(podA) && held() === 6);
  const row = ringRows('podCollected');
  pin('ring podCollected row has podId/units/commodity, no pod', row.length === 1 && row[0].podId === podA.id
    && row[0].units === 6 && row[0].commodity === 'rawOre' && !Object.hasOwn(row[0], 'pod'), row);
  const obs = buildObservation(ctx);
  pin('observe() events include the scoop', (obs.events || []).some((e) => e.type === 'podCollected' && e.podId === podA.id));
  pin('observe() nearby no longer lists the scooped pod', !nearbyPods().some((r) => r.id === podA.id));
}

// 3 — the pirate case: ring saturated with combat/mine rows before the scoop.
ctx.agent.events.length = 0;
for (let i = 0; i < EVENT_CAP; i++) pushRing(ctx.agent.events, { type: 'mineHit', t: i, asteroidId: `rock-${i}` });
for (let i = 0; i < 4; i++) pushRing(ctx.agent.events, { type: 'npcHit', t: 20 + i, targetId: `foe-${i}`, damage: 5 });
pushRing(ctx.agent.events, { type: 'shieldDown', t: 25, layer: 'screen', targetId: 'foe-1' });
pin('fixture: ring saturated with keep rows', ctx.agent.events.length === EVENT_CAP && ringRows('podCollected').length === 0);
ctx.ship.object.position.copy(podB.mesh.position);
tick(2, SCOOP);
pin('podCollected survives a saturated ring', ringRows('podCollected').length === 1 && ringRows('podCollected')[0].podId === podB.id, ctx.agent.events.map((e) => e.type));
pin('ring stays capped', ctx.agent.events.length === EVENT_CAP);

// 4 — refusal receipt, once per pod per free-space value.
ctx.cargo.length = 0;
ctx.cargo.push({ commodity: 'rawOre', units: cap - 4 }); // privilegedFixture: 4 free
ctx.agent.events.length = 0;
const podC = spawnPod(ctx, [{ commodity: 'refinedMetals', units: 12 }], away(60), still);
ctx.ship.object.position.copy(podC.mesh.position);
m = mark();
tick(120, SCOOP); // two seconds inside scoop range
{
  const raw = since(m, 'podBlocked');
  pin('blocked scoop emits exactly one podBlocked over 120 frames', raw.length === 1, raw.length);
  pin('raw podBlocked names pod, units and free', raw.length === 1 && raw[0].pod === podC && raw[0].units === 12 && raw[0].free === 4, raw[0] && { units: raw[0].units, free: raw[0].free });
  pin('no podCollected on refusal', since(m, 'podCollected').length === 0);
  pin('blocked pod stays in the world', ctx.pods.includes(podC));
  pin('hold untouched on refusal', ctx.cargo.length === 1 && ctx.cargo[0].units === cap - 4);
  const row = ringRows('podBlocked');
  pin('ring podBlocked row has podId/units/free, no pod', row.length === 1 && row[0].podId === podC.id
    && row[0].units === 12 && row[0].free === 4 && !Object.hasOwn(row[0], 'pod'), row);
  const near = nearbyPods().find((r) => r.id === podC.id);
  pin('nearby row lets the runner see it will not fit', !!near && near.units === 12 && near.units > cap - held(), near);
}
// A second oversized pod earns its own receipt at the same free value.
const podD = spawnPod(ctx, [{ commodity: 'rawOre', units: 7 }], here(), still);
m = mark();
tick(60, SCOOP);
{
  const raw = since(m, 'podBlocked');
  pin('second blocked pod earns its own single receipt', raw.length === 1 && raw[0].pod === podD && raw[0].units === 7 && raw[0].free === 4, raw.map((e) => e.pod && e.pod.id));
  pin('ring keeps both blocked receipts distinct', ringRows('podBlocked').length === 2
    && new Set(ringRows('podBlocked').map((e) => e.podId)).size === 2);
}

// 5 — making room changes free: one fresh receipt each, then a normal scoop.
ctx.cargo[0].units = cap - 6; // privilegedFixture: sold two units, 6 free (12 and 7 still do not fit)
m = mark();
tick(60, SCOOP);
{
  const raw = since(m, 'podBlocked');
  pin('free change earns one fresh receipt per still-blocked pod', raw.length === 2
    && raw.every((e) => e.free === 6) && new Set(raw.map((e) => e.pod)).size === 2, raw.map((e) => [e.pod && e.pod.id, e.free]));
  pin('still no scoop while it does not fit', since(m, 'podCollected').length === 0 && ctx.pods.includes(podC) && ctx.pods.includes(podD));
}
ctx.cargo.length = 0; // privilegedFixture: jettisoned everything; 12 + 7 fits in 20
m = mark();
tick(2, SCOOP);
{
  const got = since(m, 'podCollected');
  pin('both pods scoop once they fit', got.length === 2 && !ctx.pods.includes(podC) && !ctx.pods.includes(podD) && held() === 19, got.map((e) => e.units));
  pin('no podBlocked once scooped', since(m, 'podBlocked').length === 0);
}

// 6 — survivor and empty pods.
ctx.cargo.length = 0;
const podS = spawnSurvivorPod(ctx, here(), { faction: 'freehold', source: 'other' });
const podE = spawnPod(ctx, [], here(), still);
m = mark();
tick(2, SCOOP);
{
  const got = since(m, 'podCollected');
  const s = got.find((e) => e.pod === podS);
  const e0 = got.find((e) => e.pod === podE);
  pin('survivor pod reports commodity survivor', !!s && s.commodity === 'survivor' && s.units === 1, s && { c: s.commodity, u: s.units });
  pin('empty pod reports units 0 and no commodity', !!e0 && e0.units === 0 && !Object.hasOwn(e0, 'commodity'));
  pin('survivor ring row keeps commodity', ringRows('podCollected').some((e) => e.podId === podS.id && e.commodity === 'survivor'));
}

// 7 — docked: pods drift, nothing is scooped or refused.
ctx.cargo.length = 0;
ctx.cargo.push({ commodity: 'rawOre', units: cap }); // privilegedFixture: full hold
ctx.flags.docked = true;
const podF = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], here(), still);
m = mark();
tick(30, SCOOP);
pin('docked: no scoop and no refusal receipt', since(m, 'podCollected').length === 0 && since(m, 'podBlocked').length === 0 && ctx.pods.includes(podF));
ctx.flags.docked = false;

if (fails) {
  console.log(`ISSUE 115 POD RECEIPTS FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE 115 POD RECEIPTS PASS');
