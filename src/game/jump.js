import * as THREE from 'three';
import { SYSTEMS, JUMP, FACTIONS } from '../game/state.js';
import { removeLiveShip } from '../systems/npc.js';
import { standingRead } from './data-trade.js';

/** Exact commLine / toast copy (Wave 104 REP-05). */
export const JUMP_REFUSE_LINE = 'No passage.';

/** Copy locker Marked exclusive (RESTRICTED_REP_GATE). Refuse when standing < this. */
export const JUMP_REFUSE_STANDING = -25;

/** Dest flags that never inbound-lock. Beautiful dest may lock. */
export const JUMP_REFUSE_SKIP = new Set(['unknowables', 'hollow', 'independent']);

const refusedDestThisVisit = new Set();

export function resetJumpRefuseVisit() {
  refusedDestThisVisit.clear();
}

/**
 * Inbound dest standing gate. Missing dest / reserved / skip flags → false (do not lock).
 * standingRead miss / proto / non-finite → 0 → no refuse.
 */
export function destJumpRefused(to, reputation) {
  if (typeof to !== 'string' || !to) return false;
  if (!Object.hasOwn(SYSTEMS, to)) return false;
  const def = SYSTEMS[to];
  const fac = def && def.faction;
  if (typeof fac !== 'string' || !fac) return false;
  if (!Object.hasOwn(FACTIONS, fac)) return false;
  if (JUMP_REFUSE_SKIP.has(fac)) return false;
  return standingRead(reputation, fac) < JUMP_REFUSE_STANDING;
}

// Arrival hails by distance band (§13.5 + designed silence): band 0
// warm/busy, band 1 sparse, band 2 near-silent. One line per band, chosen
// at arrival from SYSTEMS[to].band.
const ARRIVAL_LINES = [
  (name, factionName) => name + '. ' + factionName + ' space. Welcome home, traffic control has you on scope.',
  (name, factionName) => name + '. ' + factionName + ' space. Light traffic out this far.',
  (name) => name + '. …no traffic on scope.',
  (name) => name + '. No one answers. The gate logs your arrival for no one.',
  (name) => name + '. No hail. No echo of a hail. Out here even the quiet has stopped listening.',
];

/** Sun-relative belt range for the arrival find-aid. Finite integer u. */
export function arrivalBeltLine(def) {
  const center = def && def.field && def.field.center;
  let n = 0;
  if (center) {
    const r = Math.round(Math.hypot(center[0], center[2]));
    if (Number.isFinite(r)) n = r;
  }
  return {
    text: 'Belt lies ' + n + ' u sun-relative, off the station.',
    from: 'Echo',
  };
}

/**
 * Jump — the system-swap orchestrator. No meshes.
 *
 * Consumes 'jumpRequested' { to } from ctx.events the same frame gate.js
 * emits it (jump inits after gate in main.js). Runs the frozen sequence:
 *
 *   1. ctx.gate.jumping = true; progress 0→1 over JUMP.chargeTime seconds;
 *      ctx.gate.destination = to.
 *   2. Midpoint: despawn every live ship via removeLiveShip (mesh) AND
 *      empty ctx.ships (traffic.js owns membership but is rebuilding from
 *      the new cast anyway); set ctx.world.currentSystem = to; relocate the
 *      player to the destination gate + JUMP.arrivalOffset toward the
 *      system center (origin); zero ctx.ship.velocity; set
 *      ctx.world.jumpGraceUntil = time + JUMP.graceSeconds; emit
 *      'systemLoaded' { to }, a band-aware arrival 'commLine' (§13.5 +
 *      designed silence: band 0 warm, band 1 sparse, band 2 near-silent),
 *      and a spare belt find-aid 'commLine' (AST-02; all bands).
 *      Gate-network arrival rule: the arrival gate is the one in
 *      SYSTEMS[to].gates whose `to` points back at the origin system
 *      (captured before the swap); fallback is gates[0] (the primary).
 *      Junction arrival rule: when SYSTEMS[to].hub.routes contains the
 *      origin, the player came home via a route target's back-gate — arrive
 *      at hub.position instead of any gate.
 *   3. End: jumping = false, progress/destination reset.
 *
 * Ownership: writes ctx.gate.{jumping,progress,destination},
 * ctx.world.currentSystem, ctx.world.jumpGraceUntil, ctx.ship.object
 * position, ctx.ship.velocity. Everything else is read-only.
 *
 * Per-frame cost is a scalar advance; Vector3 scratch is preallocated. The
 * midpoint allocations (the ctx.ships copy) happen once per jump.
 */
export function initJump(ctx) {
  // Scratch for the arrival position math — never allocated per frame.
  const gatePos = new THREE.Vector3();
  const towardCenter = new THREE.Vector3();

  let timer = 0;
  let swapped = false;

  function beginJump(to) {
    if (typeof to !== 'string' || !to) return;
    if (!Object.hasOwn(SYSTEMS, to)) return;
    if (destJumpRefused(to, ctx.world?.reputation)) {
      if (!refusedDestThisVisit.has(to)) {
        refusedDestThisVisit.add(to);
        if (typeof ctx.emit === 'function') {
          ctx.emit('commLine', { text: JUMP_REFUSE_LINE });
        }
      }
      return;
    }
    ctx.gate.jumping = true;
    ctx.gate.progress = 0;
    ctx.gate.destination = to;
    timer = 0;
    swapped = false;
  }

  function midpointSwap(to) {
    // Despawn all live NPC ships. Iterate a copy; removeLiveShip removes the
    // mesh, then we clear traffic's membership list in one cut.
    const live = ctx.ships.slice();
    for (let i = 0; i < live.length; i++) removeLiveShip(ctx, live[i]);
    ctx.ships.length = 0;
    // The old system's target (ship or asteroid entry) no longer exists —
    // clear it so combat/hud never chase a phantom.
    ctx.targets.current = null;

    // Capture the origin before the swap — the gate-network arrival rule
    // picks the destination gate that points back here.
    const origin = ctx.world.currentSystem;
    ctx.world.currentSystem = to;

    // Arrive just past the return-pointing gate (fallback: the primary
    // gate), offset toward the system center. Junction arrival rule: when
    // the destination is a Lamplighter hub whose routes include the origin
    // (the player rode a route target's physical back-gate home), arrive at
    // the hub junction position instead.
    const def0 = SYSTEMS[to];
    const hub = def0.hub;
    let gp;
    if (hub && hub.routes && hub.routes.indexOf(origin) !== -1) {
      gp = hub.position;
    } else {
      const gates = def0.gates;
      let gate = gates[0];
      for (let i = 0; i < gates.length; i++) {
        if (gates[i].to === origin) { gate = gates[i]; break; }
      }
      gp = gate.position;
    }
    gatePos.set(gp[0], gp[1], gp[2]);
    towardCenter.copy(gatePos).negate().normalize(); // origin - gatePos
    const shipObj = ctx.ship.object;
    if (shipObj) {
      shipObj.position.copy(gatePos).addScaledVector(towardCenter, JUMP.arrivalOffset);
      shipObj.lookAt(0, 0, 0); // face into the new system
    }
    ctx.ship.velocity.set(0, 0, 0);

    ctx.world.jumpGraceUntil = ctx.world.time + JUMP.graceSeconds;

    refusedDestThisVisit.clear();
    ctx.emit('systemLoaded', { to });

    // Arrival hail (§13.5), band-aware (designed silence — the rim greets
    // you with quiet). One line per band, chosen from SYSTEMS[to].band.
    const def = SYSTEMS[to];
    const faction = FACTIONS[def.faction];
    const band = def.band ?? 0;
    ctx.emit('commLine', {
      text: (ARRIVAL_LINES[band] ?? ARRIVAL_LINES[0])(def.name, faction ? faction.name : 'Independent'),
      from: 'gate',
    });

    // Mining find-aid: always, including silent high bands.
    ctx.emit('commLine', arrivalBeltLine(def));
  }

  function endJump() {
    ctx.gate.jumping = false;
    ctx.gate.progress = 0;
    ctx.gate.destination = null;
    timer = 0;
    swapped = false;
  }

  function consumeVisitReset() {
    const evs = ctx.lastEvents;
    if (!Array.isArray(evs)) return;
    for (let i = 0; i < evs.length; i++) {
      if (evs[i] && evs[i].type === 'systemLoaded') {
        refusedDestThisVisit.clear();
        return;
      }
    }
  }

  function update(dt) {
    consumeVisitReset();
    if (!ctx.gate.jumping) {
      // Same-frame consumption of gate.js's request.
      for (let i = 0; i < ctx.events.length; i++) {
        const e = ctx.events[i];
        if (e.type === 'jumpRequested') {
          beginJump(e.to);
          break;
        }
      }
      if (!ctx.gate.jumping) return;
    }

    // Flag without a live dest is not in-flight. Do not finish leftover timer.
    if (!ctx.gate.destination) {
      timer = 0;
      swapped = false;
      return;
    }

    timer += dt;
    const p = timer / JUMP.chargeTime;

    if (!swapped && p >= 0.5) {
      swapped = true;
      midpointSwap(ctx.gate.destination);
    }

    if (p >= 1) {
      endJump();
      return;
    }
    ctx.gate.progress = p;
  }

  return { update };
}
