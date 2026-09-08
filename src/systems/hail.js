import { ECON, FACTIONS, U, ransomFor, CALLOW, HIDDEN_MOUNTS, SYSTEMS } from '../game/state.js';
import { cargoValueSafe } from '../game/data-trade.js';
import { bumpTrust, addFavor } from '../game/contacts.js';
import { portraitFor } from '../game/portraits.js';
import { enterEscapeFlee, spillShipCargo } from './npc.js';
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
import { coverHoldsFor, hailOffer } from '../game/hail-offer.js';

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
 *
 * Issue #66: ctx.hailApi.peek() also publishes the open card's identity —
 * an opaque session-scoped conversationId, the speaker named in the header,
 * the hail family, and the terms the player can read — and
 * ctx.hailApi.resolve(intent, expectedConversationId?) compares that token
 * against the live card before any effect runs.
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

/**
 * Issue #66 — public conversation identity.
 *
 * The open card is the single source of truth for who is talking, what family
 * of hail it is, and which terms the player can actually see. Nothing below
 * reads the selected target, private NPC state, or the agent event ring: a
 * hull that OFFERS its cargo, a ransom, or tribute has struck, and that is
 * what 'surrender' names. Families are 'demand' (a pirate's tribute demand),
 * 'surrender' (a broken hull naming terms), 'salvage' (a dead hulk), and
 * 'conversation' (everything else the card can carry — Old Callow's vouch, a
 * Named Gun standing down).
 */
const SURRENDER_VERBS = Object.freeze(['demandCargo', 'demandRansom', 'acceptTribute']);

function hailKindOf(h) {
  if (!h) return '';
  if (h.salvage === true) return 'salvage';
  if (h.demandHail === true) return 'demand';
  const list = Array.isArray(h.intents) ? h.intents : [];
  for (let i = 0; i < SURRENDER_VERBS.length; i++) {
    if (list.indexOf(SURRENDER_VERBS[i]) >= 0) return 'surrender';
  }
  return 'conversation';
}

/**
 * An id the card may publish: an own string, or an own FINITE number. A NaN or
 * an Infinity is no id at all, so it is dropped rather than printed.
 */
function ownIdPrimitive(obj) {
  if (!Object.hasOwn(obj, 'id')) return null;
  const id = obj.id;
  if (typeof id === 'string') return id;
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  return null;
}

/** Primitive ship id for the speaker block. Never the ship object. */
function speakerIdOf(live) {
  try {
    if (live && typeof live === 'object') {
      const direct = ownIdPrimitive(live);
      if (direct !== null) return direct;
      const rec = live.record;
      if (rec && typeof rec === 'object') {
        const fromRecord = ownIdPrimitive(rec);
        if (fromRecord !== null) return fromRecord;
      }
    }
  } catch {
    /* identity is best-effort; a nameless hull still hails */
  }
  return null;
}

/**
 * The name printed in the card header, and nothing else. A record that carries
 * an object or a function where a pilot name belongs falls back to the hull
 * name, so no live thing rides out on the header; a hostile string such as
 * '__proto__' is ordinary display data and is kept verbatim.
 */
function speakerNameOf(live, st) {
  const pilot = live && live.record && typeof live.record === 'object'
    ? live.record.pilot
    : undefined;
  if (typeof pilot === 'string' && pilot) return pilot;
  const name = st && typeof st === 'object' ? st.name : undefined;
  return typeof name === 'string' ? name : '';
}

/**
 * Only the money the card actually prints. A ransom the player was never
 * offered, or a tribute the card does not list, stays private: each amount
 * rides its own button label, so it ships only when that button exists.
 */
function termAmounts(h) {
  const out = {};
  const list = h && Array.isArray(h.intents) ? h.intents : [];
  if (list.indexOf('demandRansom') >= 0 && Number.isFinite(h.ransom)) out.ransom = h.ransom;
  if (list.indexOf('acceptTribute') >= 0 && Number.isFinite(h.tribute)) out.tribute = h.tribute;
  if (list.indexOf('payTribute') >= 0) {
    out.demand = Number.isFinite(h.demand) ? h.demand : HIDDEN_MOUNTS.demandMin;
  }
  if (list.indexOf('callowVouch') >= 0) out.vouchCost = CALLOW.vouchCost;
  return out;
}

/**
 * Identity signature for one open card. Deliberately excludes the demand
 * countdown: a ticking deadline is the SAME conversation. Everything the
 * player can READ is identity — the speaker, the family, the offered verb set,
 * the opening line, and every monetary figure the card actually prints. A
 * re-rolled ransom or tribute on a redraw is therefore a NEW conversation,
 * while a quote the card keeps to itself (a ransom with no ransom button on
 * the card) never moves the token. Structured JSON, so no field can spell
 * another field's value.
 */
function cardSignature(h, baseLine) {
  return JSON.stringify({
    kind: hailKindOf(h),
    intents: Array.isArray(h.intents) ? h.intents.slice() : [],
    speakerId: String(h.speakerId),
    speaker: String(h.speaker),
    amounts: termAmounts(h),
    line: String(baseLine),
  });
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
  // Issue #67: an intact hull that answers nothing is not all one case. The
  // player-visible split comes from hail-offer.js, never from ai internals.
  'yielded',
  'no-answer',
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
    // Issue #67 fires this feedback far more often than the old generic
    // miss, so the name obeys the wave-31 cover rule and the Mk II scanner
    // tier exactly like the HUD bracket: a masked Q-ship keeps its cover.
    if (coverHoldsFor(ctx, live)) {
      const cover = live.record && live.record.coverName;
      if (typeof cover === 'string' && cover) return cover;
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

/**
 * Why the H press opened nothing. Issue #67: the verdict is the shared
 * hail-offer.js classifier the bracket and the public API read, so the toast
 * can never disagree with what the HUD shows or with observe().
 */
function classifyLockHailMiss(ctx) {
  const live = ctx && ctx.targets && ctx.targets.current;
  const name = hailMissLockName(ctx);
  const dist = hailMissLockDist(ctx);
  if (!live) return { name: 'No lock', verb: 'hail', reason: 'none', dist };
  const offer = hailOffer(ctx, live);
  // 'salvage' means the card DID open, so this path never sees it; fall back
  // to the historical generic token rather than claim an available hail.
  const reason = offer.reason || 'no-hail';
  return { name, verb: offer.verb, reason, dist };
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

  // { ship, intents, ransom, tribute, salvage, buttons, demandHail?, speaker?,
  //   speakerId?, conversationId, signature, line, lineEl? }
  let open = null;
  let deferredDemand = null; // { ship, name, n } — hail.js copy of the one overlay defer slot when it is a demand
  // Issue #66 conversation tokens. Session-scoped: the counter lives in this
  // initHail closure, so it starts at 1 for a fresh page/session and is never
  // persisted, never restored from a save, and never reused within a session.
  // A card that closes and reopens — even for the same speaker — gets a new
  // token, so an expected id can never bind to a later conversation.
  let conversationSeq = 0;

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
          ai.target = null;
          bumpFear(ctx2, ECON.fear.capitulation);
          // Issue #68: the shared plan sets flee, picks a real refuge and
          // stamps the truthful trail (wave 30 stamp is role-guarded inside).
          enterEscapeFlee(ctx2, live, 'player');
          ctx2.emit('commLine', { text: 'Cargo loose.', from: st.name });
          ctx2.emit('npcSurrendered', { ship: live, outcome: 'jettison' });
        }
        break;
      }
      case 'demandRansom': {
        ctx2.world.credits += h.ransom;
        st.surrendered = true;
        ai.target = null;
        bumpFear(ctx2, ECON.fear.ransom);
        enterEscapeFlee(ctx2, live, 'player'); // issue #68: shared refuge + trail
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
          ai.target = null;
          enterEscapeFlee(ctx2, live, 'player'); // issue #68: shared refuge + trail
          ctx2.emit('commLine', { text: 'Running.', from: st.name });
        }
        ai.calmUntil = ctx2.world.time + 30;
        break;
      }
      case 'respect': {
        // Mutual respect: the Named Gun stands down. No fear, no econ — only
        // a long calm so the encounter truly ends.
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        enterEscapeFlee(ctx2, live, 'player'); // issue #68: shared refuge + trail
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
        ai.target = null;
        ai.calmUntil = ctx2.world.time + 60;
        ai.demandOutcome = 'paid';
        enterEscapeFlee(ctx2, live, 'player'); // issue #68: shared refuge + trail
        ctx2.emit('commLine', { text: 'Smart. Run along.', from: st.name });
        break;
      }
      case 'showTeeth': {
        // Wave 30 hidden-mounts bluff (§29 Q-ship): success odds scale with
        // fear — the whisper does the work before the guns have to.
        const bluffP = HIDDEN_MOUNTS.bluffBase + ctx2.world.fear * HIDDEN_MOUNTS.bluffPerFear;
        if (Math.random() < bluffP) {
          ai.target = null;
          ai.calmUntil = ctx2.world.time + HIDDEN_MOUNTS.calmSeconds;
          ai.demandOutcome = 'bluffed';
          bumpFear(ctx2, 1); // the Q-ship sighting spreads
          enterEscapeFlee(ctx2, live, 'player'); // issue #68: shared refuge + trail
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
    const speaker = speakerNameOf(live, st);
    const now = ctx.world && typeof ctx.world.time === 'number' ? ctx.world.time : 0;
    const next = {
      ship: live,
      intents,
      ransom: ransomFor(st), // rolled once so the offer is stable
      tribute: Math.round(ECON.tributeRate * cargoValueSafe(st.cargo, ctx.world.prices)),
      demand: demandN, // wave 30: pirate demand-hail amount, rolled at emit time
      salvage: ev.salvage === true || !!st.disabled,
      buttons: null,
      demandHail,
      speaker,
      speakerId: speakerIdOf(live),
      conversationId: '', // issue #66: minted below
      signature: '',
      line: '', // the text the player is reading, filled with the DOM below
      lineEl: null,
    };
    // A redraw of the still-open card (a repeat hailOpened for the same hull,
    // a ticking deadline) keeps its token. Any change the player can read — a
    // converted salvage card, different verbs, a different speaker, a re-rolled
    // ransom or tribute that the card prints — mints a new one.
    const signature = cardSignature(next, demandHail ? '' : String(ev.line ?? ''));
    const prior = open;
    next.conversationId = prior && prior.ship === live && prior.signature === signature
      ? prior.conversationId
      : `hail-${++conversationSeq}`;
    next.signature = signature;
    open = next;

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
    open.line = line.textContent;
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

  /**
   * The ONE authoritative snapshot of the open card (issue #66). Every public
   * reader copies primitives out of here: no card object, no live ship, no DOM
   * node and no live array ever leaves, so an observation cannot mutate the
   * conversation it describes. When no card is open the snapshot is empty —
   * identity is never reconstructed from a historical event.
   */
  function cardSnapshot() {
    if (!open) {
      return { open: false, conversationId: '', kind: '', speaker: null, intents: [], terms: null };
    }
    const intents = [];
    const list = open.intents;
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        if (typeof list[i] === 'string') intents.push(list[i]);
      }
    }
    const buttons = Array.isArray(open.buttons) ? open.buttons : null;
    const options = [];
    for (let i = 0; i < intents.length; i++) {
      // The button's own text is the player-visible label; compose the same
      // string when the card has no DOM yet (headless open).
      let label = '';
      try {
        const btn = buttons ? buttons[i] : null;
        const text = btn && typeof btn.textContent === 'string' ? btn.textContent : '';
        label = text || `[${i + 1}] ${intentLabel(open, intents[i])}`;
      } catch {
        label = `[${i + 1}] ${intents[i]}`;
      }
      options.push({ index: i + 1, intent: intents[i], label });
    }
    // Read the live line node so a counting-down demand reports what is on
    // screen this instant, not the text it opened with.
    let line = typeof open.line === 'string' ? open.line : '';
    try {
      const el = open.lineEl;
      const text = el && typeof el.textContent === 'string' ? el.textContent : '';
      if (text) line = text;
    } catch {
      /* keep the stored line */
    }
    return {
      open: true,
      conversationId: open.conversationId,
      kind: hailKindOf(open),
      speaker: { id: open.speakerId, name: open.speaker },
      intents,
      terms: { line, options, amounts: termAmounts(open) },
    };
  }

  function peek() {
    const snap = cardSnapshot();
    return {
      open: snap.open,
      intents: snap.intents,
      conversationId: snap.conversationId,
      kind: snap.kind,
      speaker: snap.speaker,
      terms: snap.terms,
    };
  }

  /**
   * Resolve one listed intent. The second argument is OPTIONAL, and the two
   * cases are told apart by arity, not by value: a caller that omits it makes
   * the legacy call, while a caller that PASSES something malformed (an empty
   * string, a number, `undefined`, a prototype-poisoning name, anything longer
   * than 64 characters) is refused with 'bad-args' and touches nothing. A
   * guarded call is never quietly downgraded to an unguarded one.
   *
   * A well-formed token is compared against the LIVE open card here, at the
   * last authoritative instant before any effect. A card that closed or was
   * replaced between the caller's peek and this call answers 'stale' and
   * changes nothing — no credits, no cargo, no surrender, no AI write, no
   * event. That check runs BEFORE the intent lookup: a caller holding a
   * replaced card is told the card moved, even when the verb it remembers has
   * since disappeared from the new card.
   * Returns '' on success, else a refusal token.
   */
  function resolve(intentOrIndex, expectedConversationId) {
    const bound = arguments.length > 1;
    if (!open) return 'closed';
    if (bound) {
      const want = expectedConversationId;
      if (typeof want !== 'string' || want === '' || want.length > 64
        || want === '__proto__' || want === 'constructor' || want === 'prototype') {
        return 'bad-args';
      }
      if (open.conversationId !== want) return 'stale';
    }
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
    if (!intent) return 'no-service';
    // Last look before anything moves: the card must still be the one the
    // caller named.
    if (bound && (!open || open.conversationId !== expectedConversationId)) return 'stale';
    resolveIntent(ctx, intent);
    return '';
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
            // An open overlay really is the blocker; it outranks the lock.
            emitHailMiss(ctx, { name: lock.name, verb: 'hail', reason: overlayToken });
          } else {
            // Issue #67: session calm only explains the miss when a card was
            // otherwise available. It must not hide an already-yielded hull or
            // a hull that is simply out of salvage range.
            // Issue #67: the shared classifier already knows this branch is
            // the calm gate, and it answers with the SAME precedence the key
            // just applied — 'calm' for a salvage hull whose card the calm
            // window is holding shut, but the hull's own specific reason for
            // an already-yielded or merely willing hull, which never had a
            // card for calm to take away. Calm can no longer conceal a yield.
            const offer = hailOffer(ctx, ctx.targets && ctx.targets.current);
            emitHailMiss(ctx, {
              name: lock.name,
              verb: offer.verb,
              reason: offer.reason || 'calm',
              dist: lock.dist,
            });
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
