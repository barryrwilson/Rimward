/**
 * Issue #234 — headless arrival census. Diagnosis only; edits no product
 * source and places no fixture. Flies real public plotRoute / engageAutopilot /
 * queued approachDock legs around the authored lane with traffic, collision
 * damage and the sim clock intact, and records for every leg:
 *
 *  - the arrival pose when collision checks resume (gate.jumping goes false),
 *    the nose's alignment with the system centre, and live hulls within 120u
 *    with their escape phase;
 *  - every player contact in the destination system (kind, speed, damage,
 *    dock phase, nearest hulls, nearest gate/hub ring);
 *  - every dock cancellation with the same scene. Retries are explicit public
 *    approachDock commands, at most three per leg.
 *
 * Usage: node --import ./scripts/with-css-stub.mjs scripts/issue-234-gate-arrival-census.mjs
 * Env: ISSUE234_SEED (default 7), ISSUE234_LEGS (default 12),
 *      ISSUE234_TRACE_LEG / ISSUE234_TRACE_SECONDS (optional per-tick trace),
 *      ISSUE234_OUT (optional JSON report path).
 */
import { writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

const SEED = Number(process.env.ISSUE234_SEED || 7) >>> 0;
let seed = SEED;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const { SYSTEMS } = binds;
const { readEscape } = await import('../src/game/npc-escape.js');

const DT = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}
for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.agent.optIn = true;
const act = (name, args = {}) => globalThis.window.rimward.act({ v: 2, name, args });

const LANE = ['veridian', 'redmarch', 'hollowreach', 'redmarch', 'veridian', 'freehold'];
const LEGS = Number(process.env.ISSUE234_LEGS || 12);
// Optional per-tick trace of one leg's first seconds after arrival.
const TRACE_LEG = process.env.ISSUE234_TRACE_LEG === undefined ? -1 : Number(process.env.ISSUE234_TRACE_LEG);
const TRACE_SECONDS = Number(process.env.ISSUE234_TRACE_SECONDS || 10);
const r1 = (v) => +v.toFixed(1);
const fwd = new THREE.Vector3();

function nearby(radius) {
  const p = ctx.ship.object.position;
  const out = [];
  for (const live of ctx.ships) {
    if (!live?.object || live.state?.destroyed) continue;
    const d = live.object.position.distanceTo(p);
    if (d > radius) continue;
    const plan = readEscape(live.record);
    out.push({
      name: live.record?.name ?? null, role: live.role, cls: live.state?.classKey ?? null,
      dist: r1(d), speed: r1(live.ai?.velocity?.length?.() ?? NaN),
      escape: plan ? `${plan.kind}:${plan.phase}` : null,
    });
  }
  return out.sort((a, b) => a.dist - b.dist).slice(0, 4);
}
function nearestRing() {
  const def = SYSTEMS[ctx.world.currentSystem];
  const p = ctx.ship.object.position;
  const rings = (def.gates ?? []).map(g => ({ ring: `gate:${g.to}`, at: g.position }));
  if (def.hub?.routes?.length) rings.push({ ring: 'hub', at: def.hub.position });
  let best = null;
  for (const r of rings) {
    const d = Math.hypot(p.x - r.at[0], p.y - r.at[1], p.z - r.at[2]);
    if (!best || d < best.dist) best = { ring: r.ring, dist: r1(d) };
  }
  return best;
}
function scene() {
  const p = ctx.ship.object.position;
  return {
    phase: ctx.autopilot.phase, mode: ctx.autopilot.mode, speed: r1(ctx.ship.velocity.length()),
    pos: [p.x, p.y, p.z].map(r1), ring: nearestRing(), near: nearby(150),
  };
}

const legs = [];
let from = ctx.world.currentSystem;
for (let leg = 0; leg < LEGS; leg++) {
  const dest = LANE[leg % LANE.length];
  if (dest === ctx.world.currentSystem) continue;
  if (ctx.flags.docked) { act('undock'); tick(60); }
  const rec = { leg, from, dest, result: 'timeout', retries: 0, contacts: [], cancels: [] };
  const a = act('plotRoute', { dest }), b = act('engageAutopilot'), c = act('approachDock');
  rec.accepted = [a.ok, b.ok, c.status ?? c.ok];
  if (!a.ok || !b.ok) { rec.result = 'refused'; legs.push(rec); break; }
  let loadedAt = null;
  const hull0 = ctx.player?.hull ?? null;
  for (let f = 0; f < 240 * 60; f++) {
    const wasJumping = ctx.gate.jumping;
    tick(1);
    for (const e of ctx.lastEvents) {
      if (e.type === 'systemLoaded' && e.to === dest) loadedAt = ctx.world.time;
      if (loadedAt !== null && e.type === 'bodyHit') {
        rec.contacts.push({ dt: r1(ctx.world.time - loadedAt), kind: e.kind, speed: r1(Math.abs(e.speed ?? 0)), ...scene() });
      }
      if (loadedAt !== null && e.type === 'playerHit' && e.family === 'impact' && rec.contacts.length) {
        rec.contacts.at(-1).damage = r1(e.damage ?? 0);
      }
    }
    if (loadedAt !== null && wasJumping && !ctx.gate.jumping) {
      fwd.set(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion);
      const p = ctx.ship.object.position;
      const tc = p.clone().negate().normalize();
      rec.resume = { dt: r1(ctx.world.time - loadedAt), noseToCentre: +fwd.dot(tc).toFixed(3), ...scene() };
    }
    if (TRACE_LEG === leg && loadedAt !== null && ctx.world.time - loadedAt < TRACE_SECONDS) {
      const p = ctx.ship.object.position;
      fwd.set(0, 0, -1).applyQuaternion(ctx.ship.object.quaternion);
      const ap = ctx.autopilot;
      console.log('TRACE', r1(ctx.world.time - loadedAt), ap.mode, ap.phase, `idle=${ap.idle}`,
        `thr=${Number(ap.throttle).toFixed(2)}`, `spd=${r1(ctx.ship.velocity.length())}`,
        `pos=${[p.x, p.y, p.z].map(r1)}`, `fwd=${[fwd.x, fwd.y, fwd.z].map(v => v.toFixed(2))}`,
        `ring=${JSON.stringify(nearestRing())}`, `near=${JSON.stringify(nearby(120).slice(0, 2).map(n => [n.name, n.dist]))}`);
    }
    if (loadedAt !== null && ctx.autopilot.phase === 'failed') {
      rec.cancels.push({ reason: ctx.autopilot.reason, dt: r1(ctx.world.time - loadedAt), ...scene() });
      if (rec.retries >= 3) { rec.result = 'failed'; break; }
      rec.retries++;
      act('approachDock');
    }
    if (ctx.flags.docked && ctx.world.currentSystem === dest) { rec.result = 'docked'; break; }
    if (ctx.flags.destroyed) { rec.result = 'destroyed'; break; }
  }
  rec.seconds = loadedAt === null ? null : r1(ctx.world.time - loadedAt);
  rec.hullLost = hull0 === null ? null : r1(hull0 - (ctx.player?.hull ?? hull0));
  legs.push(rec);
  from = ctx.world.currentSystem;
  if (rec.result === 'destroyed') break;
}

const summary = {
  seed: SEED, legs: legs.length,
  docked: legs.filter(l => l.result === 'docked').length,
  firstAttempt: legs.filter(l => l.result === 'docked' && l.retries === 0).length,
  cancels: legs.reduce((n, l) => n + l.cancels.length, 0),
  impact: legs.reduce((n, l) => n + l.cancels.filter(c => c.reason === 'impact').length, 0),
  blocked: legs.reduce((n, l) => n + l.cancels.filter(c => c.reason === 'blocked').length, 0),
  contacts: legs.reduce((n, l) => n + l.contacts.length, 0),
  damagingContacts: legs.reduce((n, l) => n + l.contacts.filter(c => c.damage > 0).length, 0),
  ringContacts: legs.reduce((n, l) => n + l.contacts.filter(c => c.kind === 'gate').length, 0),
  resumeNearGate: legs.filter(l => l.resume && l.resume.ring && l.resume.ring.dist < 60).length,
};
console.log('SUMMARY', JSON.stringify(summary));
for (const l of legs) {
  console.log(`LEG ${l.leg} ${l.from}->${l.dest} ${l.result} retries=${l.retries} t=${l.seconds} hullLost=${l.hullLost}`
    + ` resume{nose=${l.resume?.noseToCentre} ring=${JSON.stringify(l.resume?.ring)}}`);
  for (const c of l.contacts) console.log('  contact', JSON.stringify(c));
  for (const c of l.cancels) console.log('  cancel ', JSON.stringify(c));
}
if (process.env.ISSUE234_OUT) await writeFile(process.env.ISSUE234_OUT, JSON.stringify({ summary, legs }, null, 1));
process.exit(0);
