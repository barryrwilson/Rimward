/**
 * Contacts — named station NPCs with trust + favors (doc §12.9).
 *
 * Pure simulation module: no three.js, no scene. One contact per
 * (system, role): a dockmaster at every station including the deep-rim
 * keeps (hush's Threshold, verge's Vigil — keepers, same family as Voss),
 * a fence at Freehold (restricted-locker access via favors), a fixer at
 * Veridian and Redmarch (better restricted prices at high trust). Deep-rim
 * keepers acknowledge the mystery arc once per rung (converged, deepened).
 * station.js reads the roster and applies the mechanics; world.trust/favors
 * persist via save.js.
 *
 * WITNESS RULE (§8.7): rumorFor voices ONLY what ctx.world.incidents
 * records — contacts never invent events. recognitionLine keys off
 * accumulated trust, not scripted beats.
 *
 * All entries are JSON-plain. update() allocates nothing per frame.
 */

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

/**
 * A recognition line once trust >= 60: the contact knows the ship. Uses the
 * player-set shipName when present, else refers to the living hull (§12.5).
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
