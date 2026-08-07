import * as THREE from 'three';
import { SYSTEMS, JUMP, FACTIONS } from '../game/state.js';
import { removeLiveShip } from '../systems/npc.js';

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
 *      'systemLoaded' { to } and a band-aware arrival 'commLine' (§13.5 +
 *      designed silence: band 0 warm, band 1 sparse, band 2 near-silent).
 *      Gate-network arrival rule: the arrival gate is the one in
 *      SYSTEMS[to].gates whose `to` points back at the origin system
 *      (captured before the swap); fallback is gates[0] (the primary).
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
    if (!SYSTEMS[to]) return; // unknown destination: ignore the request
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
    // gate), offset toward the system center.
    const gates = SYSTEMS[to].gates;
    let gate = gates[0];
    for (let i = 0; i < gates.length; i++) {
      if (gates[i].to === origin) { gate = gates[i]; break; }
    }
    const gp = gate.position;
    gatePos.set(gp[0], gp[1], gp[2]);
    towardCenter.copy(gatePos).negate().normalize(); // origin - gatePos
    const shipObj = ctx.ship.object;
    if (shipObj) {
      shipObj.position.copy(gatePos).addScaledVector(towardCenter, JUMP.arrivalOffset);
      shipObj.lookAt(0, 0, 0); // face into the new system
    }
    ctx.ship.velocity.set(0, 0, 0);

    ctx.world.jumpGraceUntil = ctx.world.time + JUMP.graceSeconds;

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
  }

  function update(dt) {
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

    timer += dt;
    const p = timer / JUMP.chargeTime;

    if (!swapped && p >= 0.5) {
      swapped = true;
      midpointSwap(ctx.gate.destination);
    }

    if (p >= 1) {
      ctx.gate.jumping = false;
      ctx.gate.progress = 0;
      ctx.gate.destination = null;
      return;
    }
    ctx.gate.progress = p;
  }

  return { update };
}
