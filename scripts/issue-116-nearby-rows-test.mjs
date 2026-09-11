/**
 * Issue #116 — nearby rows a pirate can pick a prize with; station and gate
 * bearings on the public surface.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real npc, gate, nav, pods and
 * agent-api systems over one ctx, the real observe() builder. No copied row
 * logic.
 *
 * Covered:
 *   1  every nearby SHIP row carries faction/factionName, resolveBand,
 *      surrendered, disabled and a hailState verdict — the same words the
 *      locked bracket prints — without touching the real lock
 *   2  tier rules hold: a masked Q-ship publishes its cover name and cover
 *      faction until the Mk II eye pierces it; numeric resolve, the
 *      concealed-mounts mark, the hail object and vitals stay on the locked
 *      (extended) row only; no cargo / ai / record leaks
 *   3  the extended (locked) row is unchanged in shape and agrees with the
 *      nearby row for the same hull
 *   4  pod rows keep a stable id and units (issue #115 contract)
 *   5  station.bearing is a ship-local unit vector (x right, y up, nose -z)
 *      that points at the station; null with no ship geometry
 *   6  gate.to / kind / source / range / bearing: nearest live gate with no
 *      plotted route; the plotted next hop once a route exists; cleared
 *      again after clearRoute; never an authored ghost
 *   7  every new field is JSON-plain
 *
 * Run: npm run test:nearby-rows
 */
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { spawnPod } = await import('../src/game/pods.js');
const { buildObservation } = await import('../src/game/agent-observe.js');
const { plotRoute, clearRoute } = await import('../src/game/nav.js');
const { lookupNearestLiveGate, lookupLiveNavGate } = await import('../src/systems/gate.js');

const DT = 1 / 60;
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const QUIET = only('gate', 'nav', 'agentapi');
const jsonPlain = (v) => JSON.parse(JSON.stringify(v));
const isUnit = (b) => Array.isArray(b) && b.length === 3 && b.every(Number.isFinite)
  && Math.abs(Math.hypot(b[0], b[1], b[2]) - 1) < 1e-6;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// New game from the title screen, then clear the lane and park in open space.
for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
ctx.pods.length = 0;
ctx.flags.docked = false;
ctx.targets.current = null;
ctx.ship.object.position.set(6000, 6000, 6000);
ctx.ship.object.quaternion.identity();
ctx.ship.velocity.set(0, 0, 0);
ctx.world.scanner = 0;
ctx.agent.optIn = true;
pin('fixture: freehold, flying, no lock, no eye', ctx.world.currentSystem === 'freehold' && !ctx.flags.docked && ctx.targets.current === null && ctx.world.scanner === 0);

const here = () => ctx.ship.object.position.clone();
const at = (dx, dy, dz) => here().add(new THREE.Vector3(dx, dy, dz));
function spawn(rec, pos) {
  const live = binds.spawnLiveShip(ctx, rec, pos);
  if (!live) throw new Error(`spawn failed for ${rec.id}`);
  ctx.ships.push(live);
  return live;
}
const shipRows = (obs) => (obs.targets.nearby || []).filter((r) => r && r.kind === 'ship');
const rowFor = (obs, id) => shipRows(obs).find((r) => r.id === id);

// 1 — five hulls with distinct verdicts, none locked.
const trader = spawn({ id: 'i116-trader', name: 'Cartwheel Ann', classKey: 'freighter', faction: 'independent', role: 'trader', resolve: 25 }, at(150, 0, 0));
const stout = spawn({ id: 'i116-stout', name: 'Watchful Apt', classKey: 'cutter', faction: 'veridian', role: 'trader', resolve: 85 }, at(0, 200, 0));
const yielded = spawn({ id: 'i116-yielded', name: 'Claim Wren', classKey: 'freighter', faction: 'freehold', role: 'trader', resolve: 10 }, at(0, 0, 250));
yielded.state.surrendered = true; // privilegedFixture: a completed yield
const dead = spawn({ id: 'i116-dead', name: 'Slow Orison', classKey: 'freighter', faction: 'hollow', role: 'trader', resolve: 30 }, at(-300, 0, 0));
dead.state.disabled = true; // privilegedFixture: dead in space
const qship = spawn({
  id: 'i116-qship', name: 'Gallows Wren', classKey: 'cutter', faction: 'redledger', role: 'pirate', resolve: 60,
  qship: true, coverClass: 'freighter', coverName: 'Tallow Hauler', coverFaction: 'freehold',
}, at(0, -350, 0));
pin('fixture: five live hulls, still no lock', ctx.ships.length === 5 && ctx.targets.current === null);

{
  const obs = buildObservation(ctx);
  const rows = shipRows(obs);
  pin('all five hulls are nearby ship rows', rows.length === 5, rows.map((r) => r.id));
  pin('lock untouched by observe()', ctx.targets.current === null && obs.targets.current === null);
  const t = rowFor(obs, 'i116-trader');
  pin('trader row: faction, name, band, verdict', !!t && t.faction === 'independent' && t.factionName === 'Independent'
    && t.resolveBand === 'bargaining' && t.surrendered === false && t.disabled === false && t.hailState === 'willing', t);
  const s = rowFor(obs, 'i116-stout');
  pin('stout row: veridian, defiant, no-hail', !!s && s.faction === 'veridian' && s.factionName === 'Veridian Combine'
    && s.resolveBand === 'defiant' && s.surrendered === false && s.hailState === 'no-hail', s);
  const y = rowFor(obs, 'i116-yielded');
  pin('yielded row: surrendered true, verdict yielded', !!y && y.surrendered === true && y.hailState === 'yielded' && y.resolveBand === 'capitulate', y);
  const d = rowFor(obs, 'i116-dead');
  pin('disabled row: disabled true, verdict salvage', !!d && d.disabled === true && d.hailState === 'salvage', d);
  pin('rows carry range, bearing and hostile', rows.every((r) => Number.isFinite(r.range) && isUnit(r.bearing) && typeof r.hostile === 'boolean'), rows);
  pin('rows are sorted nearest first', rows.every((r, i) => i === 0 || rows[i - 1].range <= r.range), rows.map((r) => r.range));
  // 2 — what the unlocked row must NOT carry.
  const leak = ['resolve', 'concealedMounts', 'hail', 'hull', 'screen', 'shell', 'engine', 'escape', 'cargo', 'ai', 'record', 'state', 'object'];
  pin('unlocked rows carry no locked-only or private fields', rows.every((r) => leak.every((k) => !Object.hasOwn(r, k))), rows.map((r) => Object.keys(r)));
  // Q-ship cover with no eye.
  const q = rowFor(obs, 'i116-qship');
  pin('masked Q-ship row prints its cover name and cover faction', !!q && q.name === 'Tallow Hauler' && q.faction === 'freehold' && q.factionName === 'Freehold Compact', q);
  pin('masked Q-ship row still reads its real band', !!q && q.resolveBand === 'shaken' && q.hailState === 'no-hail', q);
  // 7 — JSON-plain.
  pin('nearby rows are JSON-plain', JSON.stringify(jsonPlain(rows)) === JSON.stringify(rows));
}

// Mk I eye: numeric resolve stays off the unlocked row. Mk II: the cover falls.
ctx.world.scanner = 1;
{
  const q = rowFor(buildObservation(ctx), 'i116-qship');
  pin('Mk I eye adds no numeric resolve to unlocked rows', !!q && !Object.hasOwn(q, 'resolve') && q.name === 'Tallow Hauler', q);
}
ctx.world.scanner = 2;
{
  const obs = buildObservation(ctx);
  const q = rowFor(obs, 'i116-qship');
  pin('Mk II eye pierces the cover on the nearby row', !!q && q.name === 'Gallows Wren' && q.faction === 'redledger' && q.factionName === 'Red Ledger', q);
  pin('Mk II eye still keeps concealedMounts off the unlocked row', !!q && !Object.hasOwn(q, 'concealedMounts'), q);
}
ctx.world.scanner = 0;

// 3 — the locked row is the extended shape and agrees with the nearby row.
ctx.targets.current = trader;
{
  const obs = buildObservation(ctx);
  const cur = obs.targets.current;
  const row = rowFor(obs, 'i116-trader');
  pin('locked row keeps the extended shape', !!cur && cur.id === 'i116-trader' && cur.hail && typeof cur.hail === 'object'
    && cur.hail.state === 'willing' && Number.isFinite(cur.hull) && !Object.hasOwn(cur, 'resolve'), cur);
  pin('locked row and nearby row agree on the shared words', !!cur && !!row && ['faction', 'factionName', 'resolveBand', 'surrendered', 'disabled', 'hailState', 'hostile', 'name']
    .every((k) => cur[k] === row[k]), { cur, row });
  ctx.world.scanner = 1;
  const cur1 = buildObservation(ctx).targets.current;
  pin('Mk I eye adds numeric resolve to the locked row only', !!cur1 && cur1.resolve === 25 && !Object.hasOwn(rowFor(buildObservation(ctx), 'i116-stout'), 'resolve'), cur1);
  ctx.world.scanner = 0;
}
ctx.targets.current = null;

// 4 — pod rows keep the #115 identity contract.
{
  const pod = spawnPod(ctx, [{ commodity: 'rawOre', units: 5 }], at(90, 0, 0), new THREE.Vector3(0, 0, 0));
  const row = (buildObservation(ctx).targets.nearby || []).find((r) => r.kind === 'pod');
  pin('pod row carries the pod id and units', !!row && row.id === pod.id && row.units === 5 && isUnit(row.bearing), row);
  ctx.pods.length = 0;
}

// 5 — station bearing.
{
  const sp = ctx.station.position;
  pin('fixture: station has a position', !!sp && Number.isFinite(sp.x));
  // Nose on the station, 500 u out along +z (identity quaternion: nose is -z).
  ctx.ship.object.position.set(sp.x, sp.y, sp.z + 500);
  ctx.ship.object.quaternion.identity();
  const obs = buildObservation(ctx);
  pin('station.range is 500', near(obs.station.range, 500, 1e-6), obs.station.range);
  pin('station.bearing is dead ahead [0,0,-1]', isUnit(obs.station.bearing) && near(obs.station.bearing[0], 0) && near(obs.station.bearing[1], 0) && near(obs.station.bearing[2], -1), obs.station.bearing);
  // Turn the nose 90° left about +y: the station is now off the right wing.
  ctx.ship.object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const turned = buildObservation(ctx).station.bearing;
  // Ship-local = the world direction carried into the ship frame (inverse rotation), as THREE computes it.
  const want = new THREE.Vector3(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion.clone().invert());
  pin('station.bearing follows the ship frame (off the wing, THREE inverse-rotation parity)', isUnit(turned)
    && near(Math.abs(turned[0]), 1) && near(turned[2], 0) && near(turned[0], want.x) && near(turned[2], want.z), [turned, want.toArray()]);
  ctx.ship.object.quaternion.identity();
  ctx.ship.object.position.set(6000, 6000, 6000);
}

// 6 — gate: nearest with no route, next hop with a route, nearest again.
{
  clearRoute(ctx);
  const origin = ctx.ship.object.position;
  const nearest = lookupNearestLiveGate(origin.x, origin.y, origin.z, 'freehold');
  pin('fixture: a live freehold gate exists', !!nearest && typeof nearest.to === 'string' && Object.hasOwn(binds.SYSTEMS, nearest.to), nearest);
  const obs = buildObservation(ctx);
  const g = obs.gate;
  pin('gate block keeps its legacy fields', g.inZone === false && g.jumping === false && g.nearTo === null && g.progress === 0 && g.destination === null, g);
  pin('gate.source is nearest with no plotted route', g.source === 'nearest' && g.to === nearest.to && (g.kind === 'ring' || g.kind === 'hub'), g);
  const d = Math.hypot(nearest.x - origin.x, nearest.y - origin.y, nearest.z - origin.z);
  pin('gate.range is the distance to that gate', near(g.range, d, 1e-6), [g.range, d]);
  pin('gate.bearing is a unit vector toward it', isUnit(g.bearing), g.bearing);
  // Expected bearing from identity quaternion: the world direction itself.
  const want = [(nearest.x - origin.x) / d, (nearest.y - origin.y) / d, (nearest.z - origin.z) / d];
  pin('gate.bearing matches the world direction in the identity frame', want.every((v, i) => near(v, g.bearing[i])), [want, g.bearing]);
  pin('gate block is JSON-plain', JSON.stringify(jsonPlain(g)) === JSON.stringify(g));

  // A plotted route: pick a charted neighbour so path[1] exists.
  const neighbours = Object.keys(binds.SYSTEMS).filter((id) => id !== 'freehold' && lookupLiveNavGate(id, 'freehold'));
  pin('fixture: a charted neighbour with a live gate exists', neighbours.length > 0, neighbours);
  let plotted = null;
  for (const id of neighbours) {
    plotRoute(ctx, id);
    if (ctx.world.nav && ctx.world.nav.status === 'plotted') { plotted = id; break; }
  }
  pin('fixture: a route is plotted', plotted !== null && ctx.world.nav.path[1] === plotted, ctx.world.nav);
  tick(1, QUIET);
  const g2 = buildObservation(ctx).gate;
  const hop = plotted ? lookupLiveNavGate(plotted, 'freehold') : null;
  pin('gate.source is nav once a route is plotted, to = next hop', !!hop && g2.source === 'nav' && g2.to === plotted, g2);
  const d2 = hop ? Math.hypot(hop.x - origin.x, hop.y - origin.y, hop.z - origin.z) : NaN;
  pin('gate.range/bearing now aim at the next-hop gate', !!hop && near(g2.range, d2, 1e-6) && isUnit(g2.bearing), [g2.range, d2]);
  clearRoute(ctx);
  tick(1, QUIET);
  const g3 = buildObservation(ctx).gate;
  pin('gate.source falls back to nearest after clearRoute', g3.source === 'nearest' && g3.to === nearest.to, g3);
}

// No ship geometry: bearings are null, nothing throws.
{
  const savedObj = ctx.ship.object;
  ctx.ship.object = null;
  let obs = null;
  try { obs = buildObservation(ctx); } catch (e) { obs = { threw: String(e) }; }
  pin('no ship object: station.bearing null, gate fields null, no throw', !!obs && obs.ok === true && obs.station.bearing === null && obs.gate.bearing === null && obs.gate.to === null, obs && obs.gate);
  ctx.ship.object = savedObj;
}

// Docked: bearings still publish (the ship object is still posed at the berth).
ctx.flags.docked = true;
{
  const obs = buildObservation(ctx);
  pin('docked observe() still carries station.bearing and gate.to', isUnit(obs.station.bearing) && typeof obs.gate.to === 'string');
}
ctx.flags.docked = false;

for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;

if (fails) { console.log(`ISSUE 116 NEARBY ROWS FAIL — ${fails} pin(s)`); process.exit(1); }
console.log('ISSUE 116 NEARBY ROWS PASS');
