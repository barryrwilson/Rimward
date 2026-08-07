/**
 * Contacts — named station NPCs with trust + favors (doc §12.9).
 *
 * Pure simulation module: no three.js, no scene. One contact per
 * (system, role): a dockmaster at every station including the deep-rim
 * keeps (hush's Threshold, verge's Vigil — keepers, same family as Voss),
 * a fence at Freehold (restricted-locker access via favors), a fixer at
 * Veridian and Redmarch (better restricted prices at high trust). Deep-rim
 * keepers acknowledge the mystery arc once per rung (converged, deepened),
 * and (wave 11) open the two-column ledger at trust >= KEEPER_LEDGER_TRUST —
 * a rotating, witness-rule-safe reading of undiscovered landmarks derived
 * from mystery.visited (recorded state, never invented) — and (wave 12),
 * once every landmark is witnessed, name the system of an unfound clue as
 * a page left open (§25: the system's name only, never the clue's text) —
 * and comp a trusted pilot's dock at trust >= 60 (station.js applies the
 * waive/comp). Wave 13: the two keepers Callow's vouch writes to (hush,
 * verge) acknowledge his word once each (contact.vouchAck) before the
 * ship line resumes, and at the comp tier an open ledger page narrows to
 * the landmark nearest the unfound clue — still never the clue itself.
 * station.js reads the roster and applies the mechanics; world.trust/favors
 * persist via save.js.
 *
 * WITNESS RULE (§8.7): rumorFor voices ONLY what ctx.world.incidents
 * records — contacts never invent events. recognitionLine keys off
 * accumulated trust, not scripted beats.
 *
 * All entries are JSON-plain. update() allocates nothing per frame.
 */

import { SYSTEMS } from './state.js'; // landmark tables for the keeper ledger (wave 11)

// Fixed per-system name table (same convention as world.js record pools).
// Freehold frontier-warm, Veridian corporate-cool, Redmarch outlaw.
const CONTACT_NAMES = {
  freehold: { dockmaster: 'Mother Tarn', fence: 'Quiet Hollis' },
  veridian: { dockmaster: 'Adjutant Vey', fixer: 'Lias Corrow' },
  redmarch: { dockmaster: 'Dockhand Sorrow', fixer: 'Six-Finger Brack' },
  hollowreach: { dockmaster: 'Keeper Voss' },
  hush: { dockmaster: 'Keeper Ond' },
  verge: { dockmaster: 'Keeper Leth' },
};

// Roster: dockmaster everywhere; fence at freehold; fixer off-freehold.
const CONTACT_ROLES = {
  freehold: ['dockmaster', 'fence'],
  veridian: ['dockmaster', 'fixer'],
  redmarch: ['dockmaster', 'fixer'],
  hollowreach: ['dockmaster'],
  hush: ['dockmaster'],
  verge: ['dockmaster'],
};

function buildRoster() {
  const roster = [];
  for (const system of Object.keys(CONTACT_ROLES)) {
    for (const role of CONTACT_ROLES[system]) {
      roster.push({
        id: `contact-${system}-${role}`,
        name: CONTACT_NAMES[system][role],
        role,
        system,
        trust: 0,
        favors: 0,
        metAt: null,
        rumorIdx: 0,
        ledgerIdx: 0, // wave 11: rotation cursor for keeperLedgerLine
      });
    }
  }
  return roster;
}

/** Contacts stationed in the given system (live refs — UI-time call). */
export function contactsForSystem(ctx, sysId) {
  return ctx.world.contacts.filter((c) => c.system === sysId);
}

/** Adjust trust, clamped 0..100. */
export function bumpTrust(ctx, contact, delta) {
  contact.trust = Math.max(0, Math.min(100, contact.trust + delta));
}

/** Grant n favors (default 1). */
export function addFavor(ctx, contact, n = 1) {
  contact.favors += n;
}

/** Spend one favor if any are banked; true when the call went through. */
export function spendFavor(ctx, contact) {
  if (contact.favors <= 0) return false;
  contact.favors -= 1;
  return true;
}

/**
 * A voiced one-liner drawn ONLY from recorded incidents (Witness Rule §8.7),
 * rotating through the log via contact.rumorIdx. null when nothing has
 * happened yet.
 */
export function rumorFor(ctx, contact) {
  const incidents = ctx.world.incidents;
  if (incidents.length === 0) return null;
  const inc = incidents[contact.rumorIdx % incidents.length];
  contact.rumorIdx = (contact.rumorIdx + 1) % incidents.length;
  if (inc.kind === 'destroyed') {
    return inc.causer === 'player'
      ? `Everyone saw what became of ${inc.name}. The ${inc.faction} won't forget it.`
      : `${inc.name} came apart out in the drift. Happens more than it should.`;
  }
  // 'surrendered'
  return `${inc.name} struck colors and paid to walk away. Smart, that one.`;
}

// Wave 11: trust threshold at which a deep-rim keeper opens the second
// column of the ledger to a pilot (wave 12: and reads its open pages —
// systems holding unfound clues — once the landmark column balances).
export const KEEPER_LEDGER_TRUST = 30;

/**
 * Waves 11–12: a keeper (hollowreach/hush/verge dockmaster) reads from the
 * two-column ledger at trust >= KEEPER_LEDGER_TRUST, in three tiers.
 * Witness-rule safe (§8.7): every tier derives from recorded discovery
 * state (ctx.world.mystery.visited / .found), never invented events;
 * §25 — an unfound clue is named by its SYSTEM only, never its text.
 *   1. Landmarks await → rotates through authored landmarks NOT yet in
 *      mystery.visited ('The second column holds: ...').
 *   2. Landmarks all witnessed but unfound clues remain → rotates through
 *      the SYSTEMS holding at least one unfound clue; the line names only
 *      the system display name, a page left open. Wave 13: at the comp
 *      tier (station.js KEEPER_COMP_TRUST) the keeper narrows the open
 *      page to a landmark pairing — the landmark nearest that system's
 *      first unfound clue (§25: still never the clue's text or id; the
 *      landmark name is authored, already-spoken state from tier 1).
 *   3. Everything witnessed and found → the closing line; both columns
 *      balance.
 * One cursor (contact.ledgerIdx, ??= 0 for old saves, same discipline as
 * rumorIdx) serves all tiers — the tier list length changes as discoveries
 * land, and the modulo keeps it in range. null for non-keepers or below
 * the threshold.
 */
export function keeperLedgerLine(ctx, contact) {
  if (contact.role !== 'dockmaster') return null;
  if (contact.system !== 'hollowreach' && contact.system !== 'hush' && contact.system !== 'verge') return null;
  if (contact.trust < KEEPER_LEDGER_TRUST) return null;
  const visited = ctx.world.mystery?.visited ?? [];
  const found = ctx.world.mystery?.found ?? [];
  const awaiting = [];
  const openPages = []; // wave 13: { systemName, lmName } per system holding an unfound clue
  for (const sysId of Object.keys(SYSTEMS)) {
    const def = ctx.systems?.[sysId] ?? SYSTEMS[sysId];
    for (const lm of def.landmarks ?? []) {
      if (!visited.includes(lm.id)) awaiting.push({ lm, systemName: def.name });
    }
    for (const clue of def.clues ?? []) {
      if (!found.includes(clue.id)) {
        // Wave 13: pair the open page with the landmark nearest the first
        // unfound clue (squared distances over position [x,y,z] arrays);
        // null when the system has no landmarks (guard kept — every
        // clue-holding system currently has at least one).
        let lmName = null;
        let bestD2 = Infinity;
        for (const lm of def.landmarks ?? []) {
          const dx = lm.position[0] - clue.position[0];
          const dy = lm.position[1] - clue.position[1];
          const dz = lm.position[2] - clue.position[2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < bestD2) { bestD2 = d2; lmName = lm.name; }
        }
        openPages.push({ systemName: def.name, lmName });
        break;
      }
    }
  }
  contact.ledgerIdx ??= 0;
  if (awaiting.length > 0) {
    const entry = awaiting[contact.ledgerIdx % awaiting.length];
    contact.ledgerIdx = (contact.ledgerIdx + 1) % awaiting.length;
    return `The second column holds: ${entry.lm.name}, in ${entry.systemName}. Marked awaiting.`;
  }
  if (openPages.length > 0) {
    const entry = openPages[contact.ledgerIdx % openPages.length];
    contact.ledgerIdx = (contact.ledgerIdx + 1) % openPages.length;
    // Wave 13: at the comp tier (station.js KEEPER_COMP_TRUST — literal
    // 60, matching recognitionLine's convention) and with a landmark to
    // pair, the keeper narrows the open page. §25: the landmark name is
    // authored, already-spoken state from tier 1 — still never the
    // clue's text or id.
    if (contact.trust >= 60 && entry.lmName !== null) {
      return `The second column balances. A page stays open in ${entry.systemName} — the page near ${entry.lmName} waits to be read.`;
    }
    return `The second column balances. A page stays open in ${entry.systemName} — something there waits to be read.`;
  }
  return 'Both columns balance at last — nothing waits, and nothing stays unread.';
}

/**
 * A recognition line once trust >= 60: the contact knows the ship. Uses the
 * player-set shipName when present, else refers to the living hull (§12.5).
 * Wave 13: at the top of that tier, the two keepers Callow's vouch writes
 * to (hush/verge dockmasters) acknowledge the word once each
 * (contact.vouchAck) before the ship line resumes — the flag rides the
 * persisted contact record, undefined reads falsy on old saves, same
 * discipline as deepAck.
 * Below the trust threshold, tiers in order: deep-rim keepers (hollowreach,
 * hush, verge) acknowledge the mystery arc once each — the deepened tier
 * (contact.deepAck2, which also marks deepAck1: the deeper word covers the
 * shallower) before the converged tier (contact.deepAck1) — then
 * freehold/redmarch contacts acknowledge the player's first Named-ace
 * defeat once each (contact.aceAck). Flags ride the persisted contact
 * record, same discipline as bumpTrust; undefined reads falsy on old
 * saves, so no normalization. null otherwise.
 */
export function recognitionLine(ctx, contact) {
  if (contact.trust >= 60) {
    // Wave 13: closes the loop Callow's vouch opened — the two keepers
    // his word actually writes to (hush/verge dockmasters; hail.js
    // bumpTrust targets only them) acknowledge it once each, then the
    // ship line resumes. vouchAck rides the persisted contact record,
    // undefined reads falsy on old saves, same discipline as deepAck.
    // Hollowreach's keeper never got the letter (system gate).
    if (
      contact.role === 'dockmaster' &&
      (contact.system === 'hush' || contact.system === 'verge') &&
      (ctx.world.milestones ?? []).includes('callowVouched') &&
      !contact.vouchAck
    ) {
      contact.vouchAck = true;
      return "Callow's word arrived ahead of you — your name sits in our second column. The yard is yours.";
    }
    const ship = ctx.world.shipName;
    return ship
      ? `${ship}, back on my pad. Good to see her in one piece.`
      : `The living hull — we'd know that ship anywhere. Welcome back.`;
  }
  const mys = ctx.world.mystery;
  const deepRim = contact.system === 'hollowreach' || contact.system === 'hush' || contact.system === 'verge';
  if (deepRim && mys?.deepened && !contact.deepAck2) {
    contact.deepAck2 = true;
    contact.deepAck1 = true;
    return 'You stood in the Answer and came back. We do not ask what it said.';
  }
  if (deepRim && mys?.converged && !contact.deepAck1) {
    contact.deepAck1 = true;
    return 'Two columns, always — arrivals, and arrivals that have not happened yet. Your return goes in neither.';
  }
  if (
    (ctx.world.aceRivalry?.defeats ?? 0) > 0 &&
    !contact.aceAck &&
    (contact.system === 'freehold' || contact.system === 'redmarch')
  ) {
    contact.aceAck = true;
    return "Carver Illyx speaks your ship's name carefully now. Coming from him, that's a crown.";
  }
  return null;
}

/**
 * Populate ctx.world.contacts when empty (save.js restores over this roster
 * afterward, same pattern as world records). update() stamps metAt on the
 * current system's contacts when a 'docked' event lands.
 */
export function initContacts(ctx) {
  if (ctx.world.contacts.length === 0) {
    ctx.world.contacts = buildRoster();
  }
  return {
    update() {
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        if (ctx.lastEvents[i].type !== 'docked') continue;
        const sysId = ctx.world.currentSystem;
        const list = ctx.world.contacts;
        for (let j = 0; j < list.length; j++) {
          if (list[j].system === sysId && list[j].metAt === null) {
            list[j].metAt = ctx.world.time;
          }
        }
      }
    },
  };
}
