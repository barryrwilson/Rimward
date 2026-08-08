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
 * and comp a trusted pilot's dock at trust >= KEEPER_COMP_TRUST (station.js
 * applies the
 * Wave 13: the two keepers Callow's vouch writes to (hush,
 * verge) acknowledge his word once each (contact.vouchAck) before the
 * ship line resumes, and at the comp tier an open ledger page narrows to
 * the landmark nearest the unfound clue — still never the clue itself.
 * Wave 14: the acknowledgment carries the arrival comms too — a changed
 * 'systemLoaded' to the hush or verge voices Callow's word once, so a
 * fly-through hears it without docking (the same vouchAck flag: once per
 * keeper across both surfaces) — and a docked comp-tier keeper marks the
 * narrowed page's landmark on the pilot's charts (mystery.charted,
 * recorded state only): the hint becomes a heading, still never the clue.
 * station.js reads the roster and applies the mechanics; world.trust/favors
 * persist via save.js.
 *
 * Wave 24: the roster grows 12 → 103 — the 12 authored/hub contacts above
 * plus one plain dockmaster per generated non-hub system, appended by
 * buildRoster from SYSTEMS[id].contacts (generate-galaxy.mjs data).
 * Generated dockmasters are plain dockmasters: every authored-id gate
 * (keeper ledger/vouch/chart-mark, deep-rim and ace recognitionLine
 * tiers) keys on authored system id strings, so a generated id falls
 * through every one. The trust-only comp-tier ship-recognition line is
 * shared by all dockmasters, as with the wave-23 hub three. §25
 * holds: generated systems never gain clues, and the ledger lane stays
 * authored-only. No migration: old saves restore their persisted
 * 12-contact roster over the fresh roster (save.js, the waves 10/23
 * pattern), so generated dockmasters appear on fresh runs only.
 * Wave 25: generated dockmasters gain voice. recognitionLine's final
 * tier greets a known pilot (trust >= GENERATED_KNOWN_TRUST) with the
 * FACTION_RECOGNITION line of their system's faction, and rumorFor
 * prefaces the incident body with the FACTION_RUMOR framing — voice
 * only, never an invented event. Both gates are AUTHORED_SYSTEMS
 * by-id guards, so the authored six stay byte-identical; the wave-23
 * hub three (ferrous/gilded/independent) ride the same tables. §25
 * holds: neither table references the authored mystery.
 * Wave 26: generated dockmasters hold a favor economy. station.js banks
 * +1 favor per finished contract once the post-bump trust reads
 * GENERATED_KNOWN_TRUST, and a spent marker comps the yard
 * session-scoped (the keeper-comp precedent), spoken in the faction's
 * FACTION_COMP line (state.js). The earn gate is an AUTHORED_SYSTEMS
 * by-id guard like the wave-24/25 ones, so the authored six stay
 * byte-identical — Mother Tarn stays favor-less — and every authored-id
 * gate (keeper ledger/vouch/chart-mark, deep-rim and ace tiers) still
 * falls through for generated ids. contact.favors already defaults 0,
 * so old saves need no migration. §25 holds: the comp lines voice no
 * authored-mystery reference.
 *
 * WITNESS RULE (§8.7): rumorFor voices ONLY what ctx.world.incidents
 * records — contacts never invent events. recognitionLine keys off
 * accumulated trust, not scripted beats.
 *
 * All entries are JSON-plain. update() allocates nothing per frame.
 */

import { SYSTEMS, FACTION_RECOGNITION, FACTION_RUMOR } from './state.js'; // landmark tables for the keeper ledger (wave 11); generated contacts table for buildRoster (wave 24); faction voice tables (wave 25)
// Wave 23: the ledger is the authored mystery lane only (§25) — it reads
// the authored six's landmark/clue tables, never the generated systems'.
import { AUTHORED_SYSTEMS } from './authored-systems.js';

// Fixed per-system name table (same convention as world.js record pools).
// Freehold frontier-warm, Veridian corporate-cool, Redmarch outlaw.
// Wave 23: the three generated hubs gain a dockmaster apiece — fx_bastion
// martial (ferrous), gc_auction mercantile (guild), blackstation drift
// (unclaimed). They are not keepers: no ledger, no deep-rim gates.
// Wave 24: the roster grows 12 → 103. The 91 generated non-hub systems
// carry their dockmaster name on the generated record itself
// (SYSTEMS[id].contacts, written by generate-galaxy.mjs) — faction-true
// per-system names that live in data, not this table — and buildRoster
// appends them below. They are plain dockmasters, exactly like the wave-23
// hub three: NOT keepers (no ledger/vouch/chart-mark gates — those key on
// the authored system id strings hollowreach/hush/verge), and the
// recognitionLine tiers (deep-rim and ace acknowledgments, waves 6/10)
// key on authored ids too. Wave 25: they gain the
// faction greeting (GENERATED_KNOWN_TRUST) and rumorFor's faction preface,
// both AUTHORED_SYSTEMS-guarded, so the authored six stay untouched.
const CONTACT_NAMES = {
  freehold: { dockmaster: 'Mother Tarn', fence: 'Quiet Hollis' },
  veridian: { dockmaster: 'Adjutant Vey', fixer: 'Lias Corrow' },
  redmarch: { dockmaster: 'Dockhand Sorrow', fixer: 'Six-Finger Brack' },
  hollowreach: { dockmaster: 'Keeper Voss' },
  hush: { dockmaster: 'Keeper Ond' },
  verge: { dockmaster: 'Keeper Leth' },
  fx_bastion: { dockmaster: 'Warden Korrh' },
  gc_auction: { dockmaster: 'Auctioneer Mavra' },
  blackstation: { dockmaster: 'Driftcaller Oss' },
};

// Roster: dockmaster everywhere; fence at freehold; fixer off-freehold.
// Wave 23: a plain dockmaster at each generated hub (fx_bastion,
// gc_auction, blackstation) — they fall through the keeper/vouch/ace
// gates untouched, which key on authored system id strings.
const CONTACT_ROLES = {
  freehold: ['dockmaster', 'fence'],
  veridian: ['dockmaster', 'fixer'],
  redmarch: ['dockmaster', 'fixer'],
  hollowreach: ['dockmaster'],
  hush: ['dockmaster'],
  verge: ['dockmaster'],
  fx_bastion: ['dockmaster'],
  gc_auction: ['dockmaster'],
  blackstation: ['dockmaster'],
};

function buildRoster() {
  const roster = [];
  for (const system of Object.keys(CONTACT_ROLES)) {
    for (const role of CONTACT_ROLES[system]) {
      roster.push({
        id: `contact-${system}-${role}`,
        // ?? fallback in the world.js poolName style: a role added to
        // CONTACT_ROLES without a matching name must never crash the roster.
        name: CONTACT_NAMES[system]?.[role] ?? `${role} ${system}`,
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
  // Wave 24: one plain dockmaster per generated non-hub system, read from
  // the generated record's contacts array (generate-galaxy.mjs). Iterated
  // in Object.keys(SYSTEMS) order (authored six, then generated insertion
  // order) so the roster is deterministic. Systems already covered by
  // CONTACT_NAMES (the authored six and the three generated hubs) are
  // skipped. Defensive in the wave-21 style: a missing/malformed contacts
  // array or entry is skipped via ?? / continue, never a crash — if the
  // generated data lacks contacts keys entirely the roster stays 12.
  // These are plain dockmasters only: the keeper/vouch/ace gates below key
  // on authored system id strings (hollowreach/hush/verge/freehold/
  // redmarch), so a generated id falls through every one of them, exactly
  // like the wave-23 hub dockmasters.
  for (const system of Object.keys(SYSTEMS)) {
    if (system in CONTACT_NAMES) continue;
    const entries = SYSTEMS[system]?.contacts ?? [];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (entry === null || typeof entry !== 'object') continue;
      const role = entry.role ?? 'dockmaster';
      roster.push({
        id: `contact-${system}-${role}`,
        name: entry.name ?? `${role} ${system}`,
        role,
        system,
        trust: 0,
        favors: 0,
        metAt: null,
        rumorIdx: 0,
        ledgerIdx: 0,
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
  let body;
  if (inc.kind === 'destroyed') {
    body = inc.causer === 'player'
      ? `Everyone saw what became of ${inc.name}. The ${inc.faction} won't forget it.`
      : `${inc.name} came apart out in the drift. Happens more than it should.`;
  } else {
    // 'surrendered'
    body = `${inc.name} struck colors and paid to walk away. Smart, that one.`;
  }
  // Wave 25: a generated-system dockmaster prefaces the rumor with the
  // faction voice (FACTION_RUMOR) — framing only, never an invented
  // event (Witness Rule §8.7). Generated-only by id, so the authored
  // six return the identical body strings as before. Faction resolved
  // with the wave-23 live-def fallback.
  if (contact.role === 'dockmaster' && !AUTHORED_SYSTEMS[contact.system]) {
    const faction = (ctx.systems?.[contact.system] ?? SYSTEMS[contact.system])?.faction;
    const preface = FACTION_RUMOR[faction];
    if (preface) return preface + ' ' + body;
  }
  return body;
}

// Wave 11: trust threshold at which a deep-rim keeper opens the second
// column of the ledger to a pilot (wave 12: and reads its open pages —
// systems holding unfound clues — once the landmark column balances).
export const KEEPER_LEDGER_TRUST = 30;

// Wave 18: keeper trust that comps a trusted pilot — recognitionLine's ship
// line, the vouch acknowledgment, the narrowed ledger page, the chart mark,
// and station.js's waived hermit markup / comp note all ride this one tier.
export const KEEPER_COMP_TRUST = 60;

// Wave 25: trust at which a generated-system dockmaster greets a known
// pilot with the faction line (FACTION_RECOGNITION, final recognitionLine
// tier). Below KEEPER_COMP_TRUST, so the comp ship line still dominates
// at >= 60.
export const GENERATED_KNOWN_TRUST = 30;

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
 *      tier (KEEPER_COMP_TRUST) the keeper narrows the open
 *      page to a landmark pairing — the landmark nearest that system's
 *      first unfound clue (§25: still never the clue's text or id; the
 *      landmark name is authored, already-spoken state from tier 1).
 *      Wave 15: a page already charted (its paired landmark rides
 *      mystery.charted, wave 14's mark) is acknowledged as the pilot's
 *      own — 'the mark is yours now' — at and below the comp tier; the
 *      uncharted lines stay byte-identical to waves 13/14.
 *   3. Everything witnessed and found → the closing line; both columns
 *      balance.
 * One cursor (contact.ledgerIdx, ??= 0 for old saves, same discipline as
 * rumorIdx) serves all tiers — the tier list length changes as discoveries
 * land, and the modulo keeps it in range. null for non-keepers or below
 * the threshold.
 * Wave 23: ledgerColumns reads the AUTHORED six's landmark/clue tables
 * only — the 94 generated systems' landmarks never enter the ledger, and
 * the generated-hub dockmasters (fx_bastion/gc_auction/blackstation) are
 * not keepers (the system id gate above excludes them).
 */
// Shared ledger columns (waves 11–14): awaiting = authored landmarks not
// yet in mystery.visited; openPages = one entry per system holding an
// unfound clue, paired with the landmark nearest its first unfound clue
// (squared distances over the position [x,y,z] arrays, first-wins on ties
// — the contacts.js order). lmId rides for wave 14's chart mark; lmName
// null-guards a landmark-less system (every clue-holding system currently
// has at least one). Wave 23: the iteration runs over AUTHORED_SYSTEMS
// only — the ledger is the authored mystery lane (§25), and the 94
// generated systems' landmarks never enter it. The per-key def read
// (ctx.systems?.[sysId] ?? SYSTEMS[sysId]) is unchanged.
function ledgerColumns(ctx) {
  const visited = ctx.world.mystery?.visited ?? [];
  const found = ctx.world.mystery?.found ?? [];
  const awaiting = [];
  const openPages = []; // { systemName, lmName, lmId } per system holding an unfound clue
  for (const sysId of Object.keys(AUTHORED_SYSTEMS)) {
    const def = ctx.systems?.[sysId] ?? SYSTEMS[sysId];
    for (const lm of def.landmarks ?? []) {
      if (!visited.includes(lm.id)) awaiting.push({ lm, systemName: def.name });
    }
    for (const clue of def.clues ?? []) {
      if (!found.includes(clue.id)) {
        let lmName = null;
        let lmId = null;
        let bestD2 = Infinity;
        for (const lm of def.landmarks ?? []) {
          const dx = lm.position[0] - clue.position[0];
          const dy = lm.position[1] - clue.position[1];
          const dz = lm.position[2] - clue.position[2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < bestD2) { bestD2 = d2; lmName = lm.name; lmId = lm.id; }
        }
        openPages.push({ systemName: def.name, lmName, lmId });
        break;
      }
    }
  }
  return { awaiting, openPages };
}

export function keeperLedgerLine(ctx, contact) {
  if (contact.role !== 'dockmaster') return null;
  if (contact.system !== 'hollowreach' && contact.system !== 'hush' && contact.system !== 'verge') return null;
  if (contact.trust < KEEPER_LEDGER_TRUST) return null;
  const { awaiting, openPages } = ledgerColumns(ctx);
  contact.ledgerIdx ??= 0;
  if (awaiting.length > 0) {
    const entry = awaiting[contact.ledgerIdx % awaiting.length];
    contact.ledgerIdx = (contact.ledgerIdx + 1) % awaiting.length;
    return `The second column holds: ${entry.lm.name}, in ${entry.systemName}. Marked awaiting.`;
  }
  if (openPages.length > 0) {
    const entry = openPages[contact.ledgerIdx % openPages.length];
    contact.ledgerIdx = (contact.ledgerIdx + 1) % openPages.length;
    // Wave 13: at the comp tier (KEEPER_COMP_TRUST) and with a landmark to
    // pair, the keeper narrows the open page. §25: the landmark name is
    // authored, already-spoken state from tier 1 — still never the
    // clue's text or id. Wave 15: a page whose paired landmark already
    // rides mystery.charted (wave 14's keeperChartMark; ?? [] for old
    // saves, lmId null falls through uncharted since charted holds only
    // real ids) is acknowledged as the pilot's own mark at and below
    // the comp tier — the uncharted lines stay byte-identical.
    const charted = ctx.world.mystery?.charted ?? [];
    if (charted.includes(entry.lmId)) {
      if (contact.trust >= KEEPER_COMP_TRUST && entry.lmName !== null) {
        return `The second column balances. A page stays open in ${entry.systemName} — the mark near ${entry.lmName} is yours now; the page waits to be read.`;
      }
      return `The second column balances. A page stays open in ${entry.systemName} — the mark on your charts is yours now; the page waits to be read.`;
    }
    if (contact.trust >= KEEPER_COMP_TRUST && entry.lmName !== null) {
      return `The second column balances. A page stays open in ${entry.systemName} — the page near ${entry.lmName} waits to be read.`;
    }
    return `The second column balances. A page stays open in ${entry.systemName} — something there waits to be read.`;
  }
  return 'Both columns balance at last — nothing waits, and nothing stays unread.';
}

// Wave 13/14: the single vouch-acknowledgment sentence, voiced from the
// people card (recognitionLine) or the arrival comms (keeperVouchArrival) —
// once per keeper across both surfaces via contact.vouchAck.
const VOUCH_ACK_LINE = "Callow's word arrived ahead of you — your name sits in our second column. The yard is yours.";

/**
 * Wave 14: the vouch acknowledgment on the arrival comms. Exactly the
 * gates of recognitionLine's vouch tier — a hush/verge dockmaster (the two
 * keepers hail.js's 'callowVouch' resolve writes to; Hollowreach's keeper
 * never got the letter), the 'callowVouched' milestone standing, the comp
 * tier (KEEPER_COMP_TRUST), and !contact.vouchAck — so a fly-through hears
 * Callow's word without ever docking. Sets contact.vouchAck, the SAME
 * flag the people card uses: once per keeper across both surfaces, and
 * undefined reads falsy on old saves (deepAck discipline). null otherwise.
 */
export function keeperVouchArrival(ctx, contact) {
  if (contact.role !== 'dockmaster') return null;
  if (contact.system !== 'hush' && contact.system !== 'verge') return null;
  if (contact.trust < KEEPER_COMP_TRUST) return null;
  if (!(ctx.world.milestones ?? []).includes('callowVouched')) return null;
  if (contact.vouchAck) return null;
  contact.vouchAck = true;
  return VOUCH_ACK_LINE;
}

/**
 * Wave 14: at the comp tier (KEEPER_COMP_TRUST) a docked keeper turns the
 * narrowed page into a heading — the page's paired
 * landmark is marked on the pilot's charts once (mystery.charted, a plain
 * id list riding the persisted mystery record; undefined reads empty on
 * old saves). Recorded state only: nothing is rendered or revealed, and
 * §25 holds — the line names the authored landmark and its system, never
 * the clue's text or id. Only while the ledger's tier 2 is open (every
 * landmark witnessed, unfound clues remain); one mark per call, the first
 * uncharted open page in authored-lane order (wave 23: ledgerColumns reads
 * the authored six only — see its comment). null for non-keepers, below the
 * comp tier, while landmarks still await, or with nothing left to mark.
 */
export function keeperChartMark(ctx, contact) {
  if (contact.role !== 'dockmaster') return null;
  if (contact.system !== 'hollowreach' && contact.system !== 'hush' && contact.system !== 'verge') return null;
  if (contact.trust < KEEPER_COMP_TRUST) return null;
  const mystery = ctx.world.mystery;
  const charted = mystery?.charted ?? [];
  const { awaiting, openPages } = ledgerColumns(ctx);
  if (awaiting.length > 0) return null;
  for (const page of openPages) {
    if (page.lmId === null || charted.includes(page.lmId)) continue;
    // awaiting empty implies every landmark is in mystery.visited — the
    // mystery record exists.
    (mystery.charted ??= []).push(page.lmId);
    return `A mark on your charts — ${page.lmName}, in ${page.systemName}. The page near it is yours to read.`;
  }
  return null;
}

// Wave 16: the pilot's own review of wave 14's chart marks at dock — one
// { lmName, systemName } per authored landmark whose id rides
// mystery.charted without yet being witnessed (mystery.visited). Iterated
// in AUTHORED_SYSTEMS order over the authored six's landmark tables, so
// stale/unknown ids fall out naturally and old saves read empty
// (?? [] throughout). Wave 23: generated systems' landmarks never enter
// this read — the ledger lane stays authored-only (§25). §25 holds:
// authored names only, never a clue id or text. Recorded state only —
// pure read, no mutation; UI-time only (station.js People card).
export function chartedMarkNotes(ctx) {
  const charted = ctx.world.mystery?.charted ?? [];
  const visited = ctx.world.mystery?.visited ?? [];
  const notes = [];
  for (const sysId of Object.keys(AUTHORED_SYSTEMS)) {
    const def = ctx.systems?.[sysId] ?? SYSTEMS[sysId];
    for (const lm of def.landmarks ?? []) {
      if (charted.includes(lm.id) && !visited.includes(lm.id)) {
        notes.push({ lmName: lm.name, systemName: def.name });
      }
    }
  }
  return notes;
}

/**
 * A recognition line once trust >= KEEPER_COMP_TRUST: the contact knows the
 * ship. Uses the
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
  if (contact.trust >= KEEPER_COMP_TRUST) {
    // Wave 13: closes the loop Callow's vouch opened — the two keepers
    // his word actually writes to (hush/verge dockmasters; hail.js
    // bumpTrust targets only them) acknowledge it once each, then the
    // ship line resumes. vouchAck rides the persisted contact record,
    // undefined reads falsy on old saves, same discipline as deepAck.
    // Hollowreach's keeper never got the letter (system gate). The line is
    // the shared VOUCH_ACK_LINE — the arrival comms (keeperVouchArrival,
    // wave 14) voice the same word through the same flag.
    if (
      contact.role === 'dockmaster' &&
      (contact.system === 'hush' || contact.system === 'verge') &&
      (ctx.world.milestones ?? []).includes('callowVouched') &&
      !contact.vouchAck
    ) {
      contact.vouchAck = true;
      return VOUCH_ACK_LINE;
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
  // Wave 25: a generated-system dockmaster greets a known pilot with the
  // faction line. Generated-only by id — the authored six fall through
  // untouched; the wave-23 hub three (ferrous/gilded/independent) ride
  // the same table. Faction resolved with the wave-23 live-def fallback.
  // No ship name — the comp tier owns ship recognition. Pure read, no
  // flags, no persistence.
  if (
    contact.role === 'dockmaster' &&
    !AUTHORED_SYSTEMS[contact.system] &&
    contact.trust >= GENERATED_KNOWN_TRUST
  ) {
    const faction = (ctx.systems?.[contact.system] ?? SYSTEMS[contact.system])?.faction;
    return FACTION_RECOGNITION[faction] ?? null;
  }
  return null;
}

/**
 * Populate ctx.world.contacts when empty (save.js restores over this roster
 * afterward, same pattern as world records). update() stamps metAt on the
 * current system's contacts when a 'docked' event lands. Wave 14: a docked
 * comp-tier keeper marks the narrowed ledger page's landmark on the pilot's
 * charts (one commLine per dock, recorded state only), and a changed
 * 'systemLoaded' to the hush or verge voices the vouch acknowledgment on
 * the arrival comms (once per keeper, shared vouchAck flag).
 */
export function initContacts(ctx) {
  if (ctx.world.contacts.length === 0) {
    ctx.world.contacts = buildRoster();
  }
  // Wave 14 arrival cursor: a same-system restore re-emits 'systemLoaded',
  // and that is no arrival (the wave-11 callowVisitArmed discipline).
  // initContacts runs before initSave, so a cross-system load's re-emit
  // reads as a changed arrival — a load IS an arrival here.
  let lastSystemId = ctx.world.currentSystem;
  return {
    update() {
      for (let i = 0; i < ctx.lastEvents.length; i++) {
        const ev = ctx.lastEvents[i];
        if (ev.type === 'systemLoaded') {
          const changed = ev.to !== lastSystemId;
          lastSystemId = ev.to;
          if (!changed) continue;
          if (ev.to !== 'hush' && ev.to !== 'verge') continue;
          const keeper = ctx.world.contacts.find(
            (c) => c.system === ev.to && c.role === 'dockmaster');
          const line = keeper ? keeperVouchArrival(ctx, keeper) : null;
          if (line) ctx.emit('commLine', { text: line, from: keeper.name });
          continue;
        }
        if (ev.type !== 'docked') continue;
        const sysId = ctx.world.currentSystem;
        const list = ctx.world.contacts;
        for (let j = 0; j < list.length; j++) {
          if (list[j].system === sysId && list[j].metAt === null) {
            list[j].metAt = ctx.world.time;
          }
        }
        // Wave 14: a docked comp-tier keeper turns the narrowed page into
        // a heading — one mark per dock, recorded state only.
        const keeper = list.find((c) => c.system === sysId && c.role === 'dockmaster');
        const mark = keeper ? keeperChartMark(ctx, keeper) : null;
        if (mark) ctx.emit('commLine', { text: mark, from: keeper.name });
      }
    },
  };
}
