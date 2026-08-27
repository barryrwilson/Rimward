import { ECON, FACTIONS, U, ransomFor, CALLOW, HIDDEN_MOUNTS, SYSTEMS } from '../game/state.js';
import { cargoValueSafe } from '../game/data-trade.js';
import { bumpTrust, addFavor } from '../game/contacts.js';
import { portraitFor } from '../game/portraits.js';
import { stampWakeSite, spillShipCargo } from './npc.js';
import {
  berthHeld,
  canOpenPlayCard,
  canShowHail,
  deferIncomingHail,
  dropDeferredHail,
  hailCalmOk,
  hailDigitsAllowed,
  overlayIsOpen,
  playSurfaceBlocked,
  settingsOwnsScreen,
  takeDeferredHail,
} from './overlay-policy.js';
import { decodeKeyCode } from './key-code.js';

/**
 * Combat hail UI (doc §7.6, §12.3): a lower-left card above the aux stack.
 * The world stays live — nothing here touches ctx.flags.paused, and the
 * container is pointer-events: none except the card itself, so the combat
 * HUD is never blocked. Bottom-center stays empty for the future contacts arc.
 * Wave 41: the card carries a faction portrait when the faction has reference
 * art; speaker seed is record.pilot ?? state.name.
 *
 * Opens on 'hailOpened' { ship, intents[], line?, demand?, salvage? } (emitted by
 * npc.js when a ship's resolve hits the bargaining band, or when a hunting
 * pirate closes on the player with a tribute demand — wave 30, or by this
 * module when the player presses H on a targeted disabled hull). Intents are
 * verbs with real mechanics only ("no verb without a system" §12.3):
 *   demandCargo   → target jettisons its manifest as pods (fear +2). On a
 *                   disabled hulk this is salvage: dump cargo only — no flee,
 *                   no fear, no npcSurrendered.
 *   demandRansom  → credits += ransomFor(state) (fear +3)
 *   acceptTribute → credits += ECON.tributeRate × cargo value (no fear)
 *   letGo         → target flees, no fear. On a disabled hulk: close + 30 s session calm.
 *   respect       → a Named Gun (ace) stands down; flee + 60 s calm, no econ
 *   callowVouch   → Old Callow sells a word in the keepers' second ledger column (credits, trust, favors; no econ fear)
 *   keepFiring    → close the card, nothing else changes
 *   payTribute    → demand-hail: finite credits -= finite demand only; else skip debit, still close. pirate flees + 60 s calm
 *   showTeeth     → hidden-mounts bluff (offered only with concealedMounts): success → pirate flees + 90 s calm, fear +1; failure → pirate resolve +20 and it presses the attack
 *   refuseFight   → wave the demand off; the card closes and the pirate attacks
 * Demand hails carry ev.demand (integer UU rolled once at emit time — the
 * offer is stable). Salvage hails carry ev.salvage === true. Every resolution
 * emits 'hailClosed'. If the hail ship is destroyed or despawned while the
 * card is open, the card closes. A salvage hail stays open on a disabled
 * hull. A bargaining or demand hail that is still open when the target
 * becomes disabled converts in place to salvage verbs (least surprising:
 * the card does not vanish). Buttons carry number-key shortcuts (1..n).
 */

// NOTE: 'callowVouch' must precede 'keepFiring' — card buttons follow this
// order, and the vouch hail offers the purchase as intent [1]. Combat hails
// never include 'callowVouch', so their button order is unchanged.
// Wave 30: the demand-hail intents ('payTribute','showTeeth','refuseFight')
// are appended AFTER every existing entry so combat-hail button numbering is
// unchanged; demand hails offer only these three ([1] pay, [2] teeth,
// [3] refuse).
const INTENT_ORDER = ['demandCargo', 'demandRansom', 'acceptTribute', 'letGo', 'callowVouch', 'keepFiring', 'respect', 'payTribute', 'showTeeth', 'refuseFight'];

const DEMAND_SECONDS = 20;

function demandSpeaker(live) {
  try {
    const name = (live && live.record && live.record.pilot) || (live && live.state && live.state.name);
    return typeof name === 'string' && name ? name : 'Pirate';
  } catch {
    return 'Pirate';
  }
}

/** Floor at demandMin. Non-finite → demandMin. Never NaN. */
export function finiteDemandAmount(raw) {
  const floor = HIDDEN_MOUNTS.demandMin;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= floor) return Math.round(raw);
  return floor;
}

function isDemandHail(ev) {
  if (!ev) return false;
  if (ev.demandHail === true) return true;
  const intents = ev.intents;
  if (intents && intents.includes('payTribute')) return true;
  return typeof ev.demand === 'number' && Number.isFinite(ev.demand);
}

function demandRemainS(live, now) {
  try {
    const ai = live && live.ai;
    const exp = ai && ai.demandExpiresAt;
    if (typeof exp === 'number' && Number.isFinite(exp) && exp > 0) {
      const left = Math.ceil(exp - now);
      if (!Number.isFinite(left)) return 0;
      return left > 0 ? left : 0;
    }
    const start = ai && ai.demandPeaceAt;
    if (typeof start !== 'number' || !Number.isFinite(start) || start <= 0) return DEMAND_SECONDS;
    const left = Math.ceil(start + DEMAND_SECONDS - now);
    if (!Number.isFinite(left)) return 0;
    return left > 0 ? left : 0;
  } catch {
    return 0;
  }
}

function emitDemandClosed(ctx2, live, outcome, name, n) {
  try {
    ctx2.emit('hailClosed', {
      ship: live,
      demandHail: true,
      demandOutcome: outcome,
      speaker: name,
      demand: n,
    });
  } catch {
    /* never throw out of demand close */
  }
}

function demandLineText(name, n, t) {
  return `${name} heaves to — ${n} UU or hull. ${t}s.`;
}

/** True when the live manifest still holds at least one unit. */
export function shipHasCargo(st) {
  const cargo = st && st.cargo;
  if (!cargo || cargo.length === 0) return false;
  for (let i = 0; i < cargo.length; i++) {
    if ((cargo[i].units | 0) > 0) return true;
  }
  return false;
}

/** Salvage-hail verbs for a disabled hull. demandCargo only if holds are not empty. */
export function salvageIntentsFor(ctx, live) {
  const intents = [];
  if (shipHasCargo(live && live.state)) intents.push('demandCargo');
  intents.push('letGo', 'keepFiring');
  return intents;
}

export function salvageLine(live) {
  return shipHasCargo(live && live.state)
    ? 'Hull is dead in space. Holds still sealed.'
    : 'Hull is dead in space. Holds are empty.';
}

/** Player-initiated salvage hail: targeted, disabled, in range, still live. */
export function canHailDisabled(ctx, live, range = U.TARGET_RANGE) {
  if (!live || live.lockKind) return false;
  if (!live.state || !live.object) return false;
  if (!live.state.disabled || live.state.destroyed) return false;
  if (!ctx.ships || !ctx.ships.includes(live)) return false;
  const player = ctx.ship && ctx.ship.object;
  if (!player) return false;
  return live.object.position.distanceTo(player.position) <= range;
}

/** Emit hailOpened for the current disabled target. Does not open the DOM card. */
export function tryOpenDisabledHail(ctx) {
  const live = ctx.targets && ctx.targets.current;
  if (!canHailDisabled(ctx, live)) return null;
  const ev = {
    ship: live,
    intents: salvageIntentsFor(ctx, live),
    line: salvageLine(live),
    salvage: true,
  };
  ctx.emit('hailOpened', ev);
  return ev;
}

const HAIL_MISS_VERBS = Object.freeze(['salvage', 'hail', 'dock', 'jump']);
const HAIL_MISS_REASONS = Object.freeze([
  'none',
  'range',
  'overlay-chart',
  'overlay-berth',
  'calm',
  'no-hail',
  'dock-range',
  'jump-zone',
]);

/** Primitive miss event. Never throws. Never includes `ship`. */
export function emitHailMiss(ctx, raw) {
  try {
    if (!ctx || typeof ctx.emit !== 'function') return;
    const verb = raw && typeof raw.verb === 'string' ? raw.verb : '';
    const reason = raw && typeof raw.reason === 'string' ? raw.reason : '';
    if (HAIL_MISS_VERBS.indexOf(verb) < 0) return;
    if (HAIL_MISS_REASONS.indexOf(reason) < 0) return;
    let name = raw && typeof raw.name === 'string' ? raw.name : '';
    if (!name) {
      if (reason === 'none') name = 'No lock';
      else if (verb === 'dock') name = 'Station';
      else if (verb === 'jump') name = 'Gate';
      else name = 'No lock';
    }
    const payload = { name, verb, reason };
    const dist = raw && typeof raw.dist === 'number' ? raw.dist : NaN;
    if (Number.isFinite(dist)) payload.dist = Math.round(dist);
    ctx.emit('hailMiss', payload);
  } catch {
    /* never throw from miss emit */
  }
}

function hailMissLockName(ctx) {
  try {
    const live = ctx && ctx.targets && ctx.targets.current;
    if (!live) return 'No lock';
    if (live.lockKind === 'rock') return 'Rock';
    const list = ctx.asteroids && ctx.asteroids.list;
    if (list && list.indexOf(live) >= 0 && (live.lockKind === 'rock' || (!live.object && !live.state))) {
      return 'Rock';
    }
    const n = (live.record && live.record.pilot) || (live.state && live.state.name);
    if (typeof n === 'string' && n) return n;
    if (live.lockKind === 'station') {
      const sn = ctx.station && ctx.station.name;
      return typeof sn === 'string' && sn ? sn : 'Station';
    }
    if (live.lockKind === 'gate') return 'Gate';
    return 'No lock';
  } catch {
    return 'No lock';
  }
}

function hailMissLockDist(ctx) {
  try {
    const player = ctx && ctx.ship && ctx.ship.object;
    const live = ctx && ctx.targets && ctx.targets.current;
    if (!player || !live) return NaN;
    if (live.object && live.object.position) return player.position.distanceTo(live.object.position);
    if (live.position && typeof live.position.distanceTo === 'function') {
      return player.position.distanceTo(live.position);
    }
    return NaN;
  } catch {
    return NaN;
  }
}

function classifyLockHailMiss(ctx) {
  const live = ctx && ctx.targets && ctx.targets.current;
  const name = hailMissLockName(ctx);
  const dist = hailMissLockDist(ctx);
  if (!live) return { name: 'No lock', verb: 'hail', reason: 'none', dist };
  try {
    if (
      live.lockKind
      || !live.state
      || !live.object
      || live.state.destroyed
      || !ctx.ships
      || !ctx.ships.includes(live)
    ) {
      return { name, verb: 'hail', reason: 'no-hail', dist };
    }
    if (live.state.disabled) return { name, verb: 'salvage', reason: 'range', dist };
    return { name, verb: 'hail', reason: 'no-hail', dist };
  } catch {
    return { name, verb: 'hail', reason: 'no-hail', dist };
  }
}

function hailMissSkipSurface(ctx) {
  try {
    if (playSurfaceBlocked(ctx)) return true;
  } catch {
    /* missing helper → do not pause; still toast */
  }
  try {
    if (settingsOwnsScreen()) return true;
  } catch {
    /* skip settings helper */
  }
  return false;
}

function hailMissFrameHas(ctx, type, text) {
  try {
    const evs = ctx && ctx.events;
    if (!evs) return false;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (!e || e.type !== type) continue;
      if (text !== undefined && e.text !== text) continue;
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function emitDockJumpMiss(ctx) {
  try {
    if (!ctx || !ctx.input || !ctx.input.dockPressed) return;
    if (hailMissSkipSurface(ctx)) return;
    if (ctx.flags && ctx.flags.docked === true) return;
    if (ctx.gate && ctx.gate.jumping) return;
    try {
      if (berthHeld(ctx)) return;
    } catch {
      /* skip hold; do not pause */
    }
    if (hailMissFrameHas(ctx, 'hailOpened')) return;
    if (hailMissFrameHas(ctx, 'docked')) return;
    if (hailMissFrameHas(ctx, 'jumpRequested')) return;
    if (hailMissFrameHas(ctx, 'commLine', 'No passage.')) return;
    if (hailMissFrameHas(ctx, 'hailMiss')) return;

    const player = ctx.ship && ctx.ship.object && ctx.ship.object.position;
    let stationDist = NaN;
    try {
      const st = ctx.station && ctx.station.position;
      if (player && st && typeof st.distanceTo === 'function') stationDist = player.distanceTo(st);
    } catch {
      stationDist = NaN;
    }
    let gateDist = NaN;
    let gateTo = null;
    try {
      const sysId = ctx.world && ctx.world.currentSystem;
      const bag = ctx.systems || SYSTEMS;
      const def = typeof sysId === 'string' && sysId && Object.hasOwn(bag, sysId) ? bag[sysId] : null;
      const gates = def && def.gates;
      if (player && Array.isArray(gates)) {
        for (let i = 0; i < gates.length; i++) {
          const g = gates[i];
          const pos = g && g.position;
          if (!pos || pos.length < 3) continue;
          const d = Math.hypot(player.x - pos[0], player.y - pos[1], player.z - pos[2]);
          if (!Number.isFinite(d)) continue;
          if (!Number.isFinite(gateDist) || d < gateDist) {
            gateDist = d;
            if (typeof g.to === 'string' && g.to) gateTo = g.to;
          }
        }
      }
    } catch {
      gateDist = NaN;
    }
    const useJump = Number.isFinite(gateDist) && (!Number.isFinite(stationDist) || gateDist < stationDist);
    if (useJump) {
      let destName = 'Gate';
      try {
        const bag = ctx.systems || SYSTEMS;
        const dest = typeof gateTo === 'string' && gateTo && Object.hasOwn(bag, gateTo) ? bag[gateTo] : null;
        if (dest && typeof dest.name === 'string' && dest.name) destName = dest.name;
      } catch {
        destName = 'Gate';
      }
      emitHailMiss(ctx, { name: destName, verb: 'jump', reason: 'jump-zone' });
      return;
    }
    let stName = 'Station';
    try {
      const n = ctx.station && ctx.station.name;
      if (typeof n === 'string' && n) stName = n;
    } catch {
      stName = 'Station';
    }
    emitHailMiss(ctx, { name: stName, verb: 'dock', reason: 'dock-range', dist: stationDist });
  } catch {
    /* never throw from miss emit */
  }
}

function bumpFear(ctx, delta) {
  ctx.world.fear = Math.max(0, Math.min(100, ctx.world.fear + delta));
  ctx.emit('fearChanged', { fear: ctx.world.fear });
}

export function initHail(ctx) {
  // --- DOM: built once; text/buttons are rewritten per hail ---
  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:none;pointer-events:none;z-index:40;' +
    "font-family:'Consolas','Menlo','Courier New',monospace;";
  const card = document.createElement('div');
  card.className = 'rw-hail-card';
  card.style.cssText =
    'position:absolute;left:14px;bottom:22%;transform:none;width:360px;max-width:min(360px,calc(100vw - 28px));' +
    'padding:12px 16px;background:rgba(4,18,22,.82);border:1px solid rgba(111,242,224,.35);' +
    'border-radius:2px;pointer-events:auto;text-transform:uppercase;';
  // Clicks on the card must not reach the canvas (fire input).
  card.addEventListener('mousedown', (e) => e.stopPropagation());
  card.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(card);
  document.body.appendChild(root);

  let open = null; // { ship, intents, ransom, tribute, salvage, buttons, demandHail?, speaker?, lineEl? }
  let deferredDemand = null; // { ship, name, n } — hail.js copy of the one overlay defer slot when it is a demand

  function closeCard() {
    open = null;
    root.style.display = 'none';
    try {
      if (ctx.flags) ctx.flags.hailOpen = false;
    } catch {
      /* session flag is optional */
    }
  }

  function rememberDeferredDemand(ev) {
    const nextShip = ev && ev.ship;
    if (deferredDemand && deferredDemand.ship && deferredDemand.ship !== nextShip) {
      closeDeferredDemand('voided');
    }
    deferredDemand = {
      ship: nextShip,
      name: demandSpeaker(nextShip),
      n: finiteDemandAmount(ev && ev.demand),
    };
  }

  function clearDeferredDemand(ship) {
    if (!deferredDemand) return;
    if (!ship || deferredDemand.ship === ship) deferredDemand = null;
  }

  function failCloseDemand(ev, outcome) {
    const live = ev && ev.ship;
    const ai = live && live.ai;
    if (ai) {
      ai.demandOutcome = outcome;
      ai.demanding = false;
    }
    emitDemandClosed(ctx, live, outcome, demandSpeaker(live), finiteDemandAmount(ev && ev.demand));
  }

  function resolveOpenDemand(outcome) {
    if (!open || !open.demandHail) return false;
    const live = open.ship;
    const ai = live && live.ai;
    if (ai && !ai.demanding && ai.demandOutcome) {
      closeCard();
      return false;
    }
    if (ai) {
      ai.demandOutcome = outcome;
      ai.demanding = false;
    }
    emitDemandClosed(ctx, live, outcome, open.speaker || demandSpeaker(live), open.demand);
    closeCard();
    return true;
  }

  function closeDeferredDemand(outcome) {
    if (!deferredDemand) return;
    const live = deferredDemand.ship;
    const ai = live && live.ai;
    const already = !!(ai && !ai.demanding && ai.demandOutcome);
    if (ai && ai.demanding) {
      ai.demandOutcome = outcome;
      ai.demanding = false;
    }
    if (!already) {
      emitDemandClosed(ctx, live, outcome, deferredDemand.name, deferredDemand.n);
    }
    deferredDemand = null;
    try {
      dropDeferredHail();
    } catch {
      /* skip mutex */
    }
  }

  function jumpDemandClose() {
    resolveOpenDemand('jumped');
    closeDeferredDemand('jumped');
  }

  function frameHas(type) {
    try {
      const evs = ctx.events;
      for (let i = 0; i < evs.length; i++) {
        if (evs[i] && evs[i].type === type) return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function resolveIntent(ctx2, intent) {
    const h = open;
    if (!h) return;
    const live = h.ship;
    const st = live && live.state;
    const ai = live && live.ai;
    if (!st || !ai || st.destroyed || !live.object) {
      if (live) ctx2.emit('hailClosed', { ship: live });
      closeCard();
      return;
    }
    const salvage = !!h.salvage || !!st.disabled;
    switch (intent) {
      case 'demandCargo': {
        spillShipCargo(ctx2, live);
        if (salvage) {
          // Dead hulk: dump cargo only. Do not flee, do not stamp a wake,
          // do not mark a witnessed surrender (destroying them is still
          // an atrocity via the existing disabled flag).
          ctx2.emit('commLine', { text: 'Cargo loose.', from: st.name });
        } else {
          st.surrendered = true;
          ai.mode = 'flee';
          ai.phase = null;
          ai.intent = false;
          ai.target = null;
          bumpFear(ctx2, ECON.fear.capitulation);
          stampWakeSite(live); // wave 30: every pirate/ace flee entry stamps (role-guarded)
          ctx2.emit('commLine', { text: 'Cargo loose.', from: st.name });
          ctx2.emit('npcSurrendered', { ship: live, outcome: 'jettison' });
        }
        break;
      }
      case 'demandRansom': {
        ctx2.world.credits += h.ransom;
        st.surrendered = true;
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        bumpFear(ctx2, ECON.fear.ransom);
        stampWakeSite(live); // wave 30: every pirate/ace flee entry stamps (role-guarded)
        ctx2.emit('commLine', { text: 'Paid. Go.', from: st.name });
        ctx2.emit('npcSurrendered', { ship: live, outcome: 'ransom' });
        break;
      }
      case 'acceptTribute': {
        ctx2.world.credits += h.tribute;
        ai.calmUntil = ctx2.world.time + 30; // paid passage: no immediate re-hail
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ctx2.emit('commLine', { text: 'Tribute paid.', from: st.name });
        break;
      }
      case 'letGo': {
        if (salvage) {
          ctx2.emit('commLine', { text: 'Leaving the hulk.', from: st.name });
        } else {
          ai.mode = 'flee';
          ai.phase = null;
          ai.intent = false;
          ai.target = null;
          stampWakeSite(live); // wave 30: pirate/ace wake-trailing contract
          ctx2.emit('commLine', { text: 'Running.', from: st.name });
        }
        ai.calmUntil = ctx2.world.time + 30;
        break;
      }
      case 'respect': {
        // Mutual respect: the Named Gun stands down. No fear, no econ — only
        // a long calm so the encounter truly ends.
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        stampWakeSite(live); // wave 30: a standing-down Named Gun leaves a trail
        ctx2.emit('commLine', { text: 'Another time, then.', from: st.name });
        break;
      }
      case 'callowVouch': {
        // Wave 11: Old Callow sells a word in the keepers' two-column ledger.
        // He was never bargaining, so NO fear change, NO surrender flag, NO ai
        // mutation — the encounter is a purchase, not a capitulation. The vouch
        // is witnessed by rec.vouched + keeper trust/favors + the milestone
        // (§8.7: nothing is pushed to world.incidents).
        ctx2.world.credits -= CALLOW.vouchCost;
        live.record.vouched = true;
        for (const c of ctx2.world.contacts) {
          if (c.role === 'dockmaster' && (c.system === 'hush' || c.system === 'verge')) {
            bumpTrust(ctx2, c, CALLOW.vouchTrust);
            addFavor(ctx2, c);
          }
        }
        if (!ctx2.world.milestones.includes('callowVouched')) {
          ctx2.world.milestones.push('callowVouched');
          ctx2.emit('milestone', { id: 'callowVouched', line: CALLOW.vouchMilestoneLine });
        }
        ctx2.emit('commLine', { text: CALLOW.vouchLine, from: st.name });
        break;
      }
      case 'keepFiring':
        break; // close only; the fight continues
      case 'payTribute': {
        // Wave 30 demand-hail: buy the pirate off. Debit only when both
        // credits and demand are finite; else skip debit and still close.
        const credits = ctx2.world.credits;
        const demand = h.demand;
        if (Number.isFinite(credits) && Number.isFinite(demand)) {
          ctx2.world.credits = Math.max(0, credits - demand);
        }
        ai.mode = 'flee';
        ai.phase = null;
        ai.intent = false;
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        ai.demandOutcome = 'paid';
        stampWakeSite(live);
        ctx2.emit('commLine', { text: 'Smart. Run along.', from: st.name });
        break;
      }
      case 'showTeeth': {
        // Wave 30 hidden-mounts bluff (§29 Q-ship): success odds scale with
        // fear — the whisper does the work before the guns have to.
        const bluffP = HIDDEN_MOUNTS.bluffBase + ctx2.world.fear * HIDDEN_MOUNTS.bluffPerFear;
        if (Math.random() < bluffP) {
          ai.mode = 'flee';
          ai.phase = null;
          ai.intent = false;
          ai.target = null;
          ai.calmUntil = ctx2.world.time + HIDDEN_MOUNTS.calmSeconds;
          ai.demandOutcome = 'bluffed';
          bumpFear(ctx2, 1); // the Q-ship sighting spreads
          stampWakeSite(live);
          ctx2.emit('commLine', { text: 'Guns where none should be. Breaking off.', from: st.name });
        } else {
          // Called bluff: the pirate steadies (resolve bump) and presses the
          // attack — intent stays true, and the hold releases here rather
          // than waiting on npc.js's hailClosed scan. Two writes: st.resolve
          // bumps now for instant HUD feedback, and ai.resolveBoost carries
          // the same sting past npc.js updateResolve's 1s recompute (which
          // would otherwise overwrite st.resolve wholesale). The boost is
          // instance-scoped and cleared on stand-down — see updateResolve.
          st.resolve = Math.min(95, st.resolve + HIDDEN_MOUNTS.failResolveBump);
          ai.resolveBoost = HIDDEN_MOUNTS.failResolveBump;
          ai.demandOutcome = 'failed';
          ai.demanding = false;
          ctx2.emit('commLine', { text: 'Nice plating. Burn them.', from: st.name });
        }
        break;
      }
      case 'refuseFight': {
        // No parley: the card closes and the pirate attacks.
        ai.demandOutcome = 'refused';
        ai.demanding = false;
        break;
      }
      default:
        break;
    }
    const dOut = ai.demandOutcome;
    if (h.demandHail && (dOut === 'paid' || dOut === 'bluffed' || dOut === 'failed' || dOut === 'refused')) {
      emitDemandClosed(ctx2, live, dOut, h.speaker || demandSpeaker(live), h.demand);
    } else {
      ctx2.emit('hailClosed', { ship: live });
    }
    closeCard();
  }

  function intentLabel(h, intent) {
    const salvage = !!(h && (h.salvage || h.ship?.state?.disabled));
    switch (intent) {
      case 'demandCargo':
        return salvage ? 'Salvage cargo' : 'Demand cargo';
      case 'demandRansom':
        return `Demand ransom — ${h.ransom} UU`;
      case 'acceptTribute':
        return `Accept tribute — ${h.tribute} UU`;
      case 'letGo':
        return salvage ? 'Leave the hulk' : 'Let them go';
      case 'respect':
        return 'Mutual respect — stand down';
      case 'callowVouch':
        return `Buy his vouch — ${CALLOW.vouchCost} UU`;
      case 'keepFiring':
        return salvage ? 'Keep firing — finish them' : 'Keep firing';
      case 'payTribute':
        return `Pay tribute — ${Number.isFinite(h.demand) ? h.demand : HIDDEN_MOUNTS.demandMin} UU`;
      case 'showTeeth':
        return 'Show teeth — reveal the hidden mounts';
      case 'refuseFight':
        return 'Refuse — and fight';
      default:
        return intent;
    }
  }

  function openCard(ev) {
    const live = ev.ship;
    if (!live || !live.state) return;
    const same = !!(open && open.ship === live);
    try {
      if (!same && hailCalmOk(ctx, live) === false) return;
    } catch {
      /* missing helper: skip calm gate */
    }
    const st = live.state;
    const intents = INTENT_ORDER.filter((i) => ev.intents && ev.intents.includes(i));
    if (intents.length === 0) return;
    const demandHail = isDemandHail(ev);
    const demandN = demandHail ? finiteDemandAmount(ev.demand) : (ev.demand ?? null);
    const speaker = live.record?.pilot ?? st.name;
    const now = ctx.world && typeof ctx.world.time === 'number' ? ctx.world.time : 0;
    open = {
      ship: live,
      intents,
      ransom: ransomFor(st), // rolled once so the offer is stable
      tribute: Math.round(ECON.tributeRate * cargoValueSafe(st.cargo, ctx.world.prices)),
      demand: demandN, // wave 30: pirate demand-hail amount, rolled at emit time
      salvage: ev.salvage === true || !!st.disabled,
      buttons: null,
      demandHail,
      speaker,
      lineEl: null,
    };

    // Rebuild card contents (hail-time allocation only).
    const kids = card.children;
    if (kids && kids.length) {
      while (kids.length) card.removeChild(kids[kids.length - 1]);
    }
    card.textContent = '';
    const factionName = FACTIONS[st.faction]?.name ?? st.faction;
    const header = document.createElement('div');
    header.style.cssText = 'font-size:13px;letter-spacing:.12em;color:#6ff2e0;';
    header.textContent = `HAIL — ${speaker}`;
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:10px;letter-spacing:.1em;color:rgba(111,242,224,.6);margin-top:2px;';
    sub.textContent = `${factionName} · ${st.name}`;
    const line = document.createElement('div');
    line.style.cssText = 'font-size:12px;color:#d7e4ea;margin:8px 0 10px;';
    line.textContent = demandHail
      ? demandLineText(speaker, demandN, demandRemainS(live, now))
      : `“${ev.line ?? 'They are breaking.'}”`;
    open.lineEl = line;
    // Wave 41: faction portrait (when available) in a flex row.
    const portrait = portraitFor(st.faction, speaker);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;align-items:flex-start;';

    if (portrait) {
      const img = document.createElement('img');
      img.className = 'rw-hail-portrait';
      img.src = portrait.src;
      img.alt = `${speaker} — ${factionName}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 72;
      img.height = 72;
      img.style.cssText =
        'width:72px;height:72px;object-fit:cover;' +
        'border:1px solid rgba(111,242,224,.35);' +
        'border-radius:2px;' +
        'background:rgba(4,18,22,.9);' +
        'flex:0 0 auto;';
      row.appendChild(img);
    }

    const textCol = document.createElement('div');
    textCol.appendChild(header);
    textCol.appendChild(sub);
    textCol.appendChild(line);
    row.appendChild(textCol);
    card.appendChild(row);

    open.buttons = intents.map((intent, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText =
        'display:block;width:100%;text-align:left;margin-top:4px;padding:6px 10px;' +
        'background:rgba(111,242,224,.06);border:1px solid rgba(111,242,224,.3);' +
        'color:#6ff2e0;font:inherit;font-size:11px;letter-spacing:.1em;cursor:pointer;';
      btn.textContent = `[${idx + 1}] ${intentLabel(open, intent)}`;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(111,242,224,.18)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(111,242,224,.06)';
      });
      btn.addEventListener('click', () => resolveIntent(ctx, intent));
      card.appendChild(btn);
      return btn;
    });
    root.style.display = 'block';
    try {
      if (ctx.flags) ctx.flags.hailOpen = true;
    } catch {
      /* session flag is optional */
    }
  }

  // Number-key shortcuts while the card is open. NOTE: Digit1–3 also switch
  // player weapon groups (controls.js) — known overlap, flagged to orchestrator.
  window.addEventListener('keydown', (e) => {
    if (!open || !open.buttons) return;
    const code = decodeKeyCode(e);
    const m = /^Digit([1-9])$/.exec(code);
    if (!m) return;
    let digitsOk = true;
    try {
      if (typeof hailDigitsAllowed === 'function') digitsOk = hailDigitsAllowed(ctx) !== false;
    } catch {
      digitsOk = true;
    }
    if (!digitsOk) return;
    const idx = Number(m[1]) - 1;
    if (idx < open.intents.length) {
      e.preventDefault();
      resolveIntent(ctx, open.intents[idx]);
    }
  });

  function peek() {
    if (!open) return { intents: [], open: false };
    const intents = [];
    const list = open.intents;
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        if (typeof list[i] === 'string') intents.push(list[i]);
      }
    }
    return { intents, open: true };
  }

  function resolve(intentOrIndex) {
    if (!open) return;
    let intent = '';
    if (typeof intentOrIndex === 'number' && Number.isFinite(intentOrIndex)) {
      const idx = (intentOrIndex | 0) - 1;
      if (idx >= 0 && Array.isArray(open.intents) && idx < open.intents.length) {
        intent = open.intents[idx];
      }
    } else if (typeof intentOrIndex === 'string') {
      const list = open.intents;
      if (Array.isArray(list)) {
        for (let i = 0; i < list.length; i++) {
          if (list[i] === intentOrIndex) {
            intent = intentOrIndex;
            break;
          }
        }
      }
    }
    if (!intent) return;
    resolveIntent(ctx, intent);
  }

  ctx.hailApi = { resolve, peek };

  return {
    update() {
      for (const ev of ctx.events) {
        if (ev.type === 'systemLoaded') {
          jumpDemandClose();
        } else if (ev.type === 'hailOpened') {
          const demandHail = isDemandHail(ev);
          if (open && open.ship === ev.ship) {
            openCard(ev);
            continue;
          }
          if (open) {
            if (demandHail) {
              try { deferIncomingHail(ev); } catch { /* skip mutex */ }
              rememberDeferredDemand(ev);
            }
            continue;
          }
          let verdict = true;
          try {
            verdict = canShowHail(ctx, ev.ship);
          } catch {
            verdict = true;
          }
          if (verdict === 'defer') {
            try { deferIncomingHail(ev); } catch { /* skip mutex */ }
            if (demandHail) rememberDeferredDemand(ev);
            continue;
          }
          if (verdict === true) {
            openCard(ev);
            continue;
          }
          if (demandHail) failCloseDemand(ev, 'voided');
        } else if (ev.type === 'hailClosed') {
          if (open && (!ev.ship || ev.ship === open.ship)) closeCard();
          try { dropDeferredHail(ev.ship); } catch { /* skip mutex */ }
          clearDeferredDemand(ev.ship);
        }
      }
      // Player-initiated salvage hail (H). World.js may already have opened
      // a Callow card this frame; do not steal an open card.
      if (ctx.input.hailPressed && !open) {
        let allow = true;
        let skipMiss = hailMissSkipSurface(ctx);
        let overlayToken = '';
        try {
          if (playSurfaceBlocked(ctx)) { allow = false; skipMiss = true; }
        } catch { /* skip surface gate */ }
        try {
          if (allow && canOpenPlayCard(ctx, 'hail') === false) {
            allow = false;
            try {
              if (overlayIsOpen(ctx, 'chart')) overlayToken = 'overlay-chart';
              else if (overlayIsOpen(ctx, 'berth')) overlayToken = 'overlay-berth';
              else skipMiss = true;
            } catch {
              skipMiss = true;
            }
          }
        } catch { /* skip mutex */ }
        try {
          const live = ctx.targets && ctx.targets.current;
          if (allow && live && live.state && !live.state.destroyed && hailCalmOk(ctx, live) === false) {
            allow = false;
          }
        } catch { /* skip calm gate */ }
        if (hailMissFrameHas(ctx, 'hailOpened')) skipMiss = true;
        if (allow) {
          const ev = tryOpenDisabledHail(ctx);
          if (ev) openCard(ev);
          else if (!skipMiss) emitHailMiss(ctx, classifyLockHailMiss(ctx));
        } else if (!skipMiss) {
          const lock = classifyLockHailMiss(ctx);
          if (overlayToken) {
            emitHailMiss(ctx, { name: lock.name, verb: 'hail', reason: overlayToken });
          } else {
            emitHailMiss(ctx, { name: lock.name, verb: 'hail', reason: 'calm' });
          }
        }
      }
      try {
        if (!open) emitDockJumpMiss(ctx);
      } catch {
        /* leftover KeyJ miss must not throw */
      }
      try {
        if (open && open.demandHail && open.lineEl) {
          const now = ctx.world && typeof ctx.world.time === 'number' ? ctx.world.time : 0;
          const t = demandRemainS(open.ship, now);
          open.lineEl.textContent = demandLineText(open.speaker, open.demand, t);
          if (t <= 0) resolveOpenDemand('expired');
        }
      } catch {
        /* timer text must not throw */
      }
      try {
        if (ctx.flags && ctx.flags.docked === true) {
          resolveOpenDemand('docked');
          closeDeferredDemand('docked');
        }
      } catch {
        /* dock close must not throw */
      }
      try {
        if (!ctx.ships || ctx.ships.length === 0) jumpDemandClose();
      } catch {
        /* jump close must not throw */
      }
      // Destroyed / despawned still closes. An open salvage hail stays up
      // on a disabled hull. A live bargaining or demand hail converts.
      if (open) {
        const st = open.ship && open.ship.state;
        if (!st || st.destroyed || !ctx.ships.includes(open.ship)) {
          if (open.demandHail) {
            const jumped = frameHas('systemLoaded') || !!(ctx.gate && ctx.gate.jumping);
            if (st && st.destroyed && !jumped) {
              const ai = open.ship && open.ship.ai;
              if (ai) ai.demanding = false;
              closeCard();
            } else {
              resolveOpenDemand(jumped ? 'jumped' : 'voided');
            }
          } else {
            closeCard();
          }
        } else if (st.disabled && !open.salvage) {
          const ev = {
            ship: open.ship,
            intents: salvageIntentsFor(ctx, open.ship),
            line: salvageLine(open.ship),
            salvage: true,
          };
          ctx.emit('hailOpened', ev);
          openCard(ev);
        }
      }
      if (!open) {
        try {
          const slot = takeDeferredHail(ctx);
          if (slot) {
            openCard(slot);
            clearDeferredDemand(slot.ship);
          }
        } catch { /* skip mutex */ }
      }
    },
  };
}
