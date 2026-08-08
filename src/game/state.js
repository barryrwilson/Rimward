/**
 * RIMWARD web — shared simulation core. Pure data + math, no three.js, no DOM.
 * Every gameplay constant traces to docs/rimward-game-elements-omp.md (noted
 * as §). Numbers scaled ×1.5 from doc m/s to our world units (player cruise
 * 120 u/s = doc 80 m/s).
 *
 * This file is READ-ONLY for feature workers: import, don't modify. If a
 * worker needs a change here, it must report back instead.
 */

// Wave 19 (100-system rim): authored systems live in authored-systems.js,
// generated systems in galaxy.generated.js (scripts/generate-galaxy.mjs —
// deterministic, seeded; it also derives its authored stubs from
// authored-systems.js so the two never drift). The SYSTEMS spread below lists
// the authored six first so their key order leads; generator validation
// rejects generated/authored id collisions, so no authored record is ever
// overwritten by the merge.
import { GENERATED_SYSTEMS } from './galaxy.generated.js';
import { AUTHORED_SYSTEMS } from './authored-systems.js';

// ---------- Ranges (units) ----------
export const U = {
  ENCOUNTER_BUBBLE: 800, // §6.8 "8 km" scaled
  INSTANTIATE_RANGE: 900, // §8.6 records become live ships
  DEINSTANTIATE_RANGE: 1400, // hysteresis on removal
  DOCK_RANGE: 45, // one-key docking approach zone §12.1
  SCOOP_RANGE: 10,
  TARGET_RANGE: 600, // §6.2 ~4 km scaled
  WEAPON_EXCHANGE: 500, // effective exchanges 300–800 m scaled
};

// ---------- Ship classes (§5.3, ×1.5) ----------
export const SHIP_CLASSES = {
  light: { cruise: 120, burn: 240, creep: 30, stopTime: 2.0, turn: 1.6, hull: 100, shield: 100, engine: 100, role: 'player' },
  heavy: { cruise: 90, burn: 180, creep: 22, stopTime: 2.5, turn: 1.1, hull: 160, shield: 140, engine: 120, role: 'combat' },
  freighter: { cruise: 60, burn: 120, creep: 15, stopTime: 3.5, turn: 0.7, hull: 220, shield: 120, engine: 140, role: 'trade' },
  ace: { cruise: 135, burn: 270, creep: 30, stopTime: 1.8, turn: 2.0, hull: 140, shield: 160, engine: 120, role: 'ace' },
  cutter: { cruise: 105, burn: 210, creep: 25, stopTime: 2.2, turn: 1.5, hull: 80, shield: 80, engine: 90, role: 'pirate' },
  frigate: { cruise: 22, burn: 45, creep: 8, stopTime: 5.0, turn: 0.35, hull: 900, shield: 600, engine: 300, role: 'capital' },
};

// ---------- Weapons (§6.3, ×1.5 on speeds/ranges) ----------
export const WEAPONS = {
  cannon: { name: 'Energy cannon', damage: 8, rof: 6, speed: 900, range: 500, heatPerShot: 4, family: 'energy' },
  disruptor: { name: 'Disruptor', damage: 10, rof: 2.5, speed: 700, range: 350, heatPerShot: 6, family: 'disruptor', shieldMult: 2, engineMult: 2, hullMult: 0.25 },
  mining: { name: 'Mining laser', damage: 4, rof: 4, speed: 0, range: 90, heatPerShot: 2, family: 'mining', beam: true, extractPerSec: 1.2 },
};
export const HEAT = { max: 100, coolPerSec: 12, overheatUnlockAt: 40 }; // §6.3 heat-limited

// ---------- Defense model (§6.4/§6.5) ----------
export const DEFENSE = {
  screenFraction: 0.4, // outer layer share of total shield
  screenRechargeDelay: 3, // s after last hit
  screenRechargeTime: 12, // s to full
  shellRechargeDelay: 15, // s clean out-of-combat interval
  shellRechargeTime: 20, // s to full — inner layer recovers slower than screen
  engineOutAt: 0.3, // engine integrity fraction
  aftEngineMult: 2, // aft hits ×2 engine damage
  disableAtHull: 0.15, // non-boss ships disable instead of exploding
  overkillSeconds: 2, // continued fire destroys a disabled ship
  playerHitPadding: 1.25, // player projectiles vs NPCs §6.1
};

/**
 * Create a ship state record (player or NPC).
 * Screen = outer 40% of shield, Shell = inner 60% (§6.4).
 */
export function createShipState(classKey, opts = {}) {
  const cls = SHIP_CLASSES[classKey];
  const screenMax = Math.round(cls.shield * DEFENSE.screenFraction);
  return {
    classKey,
    name: opts.name ?? cls.role,
    faction: opts.faction ?? 'independent',
    hull: cls.hull, hullMax: cls.hull,
    screen: screenMax, screenMax,
    shell: cls.shield - screenMax, shellMax: cls.shield - screenMax,
    engine: cls.engine, engineMax: cls.engine,
    heat: 0, overheated: false,
    lastHitAt: -1e9, lastCombatAt: -1e9,
    engineOut: false, disabled: false, destroyed: false, surrendered: false,
    disabledDamage: 0, disabledSince: null,
    cargo: opts.cargo ?? [], // [{ commodity, units }]
    bookValue: cls.hull * 12, // UU, for ransom/prize math §7.8
    bounty: opts.bounty ?? 0,
    resolve: opts.resolve ?? 70, // NPC willingness §7.2
    personality: opts.personality ?? (Math.random() * 20 - 10), // ±10 modest adjust
  };
}

/**
 * Apply a hit. Returns an array of event descriptors (may be empty).
 * facet: 'fore'|'aft' — determined by attacker geometry at call site.
 */
export function applyHit(state, { damage, family = 'energy', facet = 'fore', now }) {
  const w = WEAPONS[family] ?? {};
  const events = [];
  state.lastHitAt = now;
  state.lastCombatAt = now;

  let remaining = damage;
  // Disruptor: strong vs shields/engines, weak vs hull (§6.3).
  const shieldMult = w.shieldMult ?? 1;
  const hullMult = w.hullMult ?? 1;

  if (state.screen > 0) {
    const absorbed = Math.min(state.screen, remaining * shieldMult);
    state.screen -= absorbed;
    remaining -= absorbed / shieldMult;
    if (state.screen <= 0) { state.screen = 0; events.push({ type: 'shieldDown', layer: 'screen' }); }
  }
  if (remaining > 0 && state.shell > 0) {
    const absorbed = Math.min(state.shell, remaining * shieldMult);
    state.shell -= absorbed;
    remaining -= absorbed / shieldMult;
    if (state.shell <= 0) { state.shell = 0; events.push({ type: 'shieldDown', layer: 'shell' }); }
  }
  if (remaining > 0) {
    // Aft hits pressure engines first (§6.5).
    if (facet === 'aft' && !state.engineOut) {
      const engineDmg = remaining * (w.engineMult ?? 1) * DEFENSE.aftEngineMult;
      state.engine = Math.max(0, state.engine - engineDmg);
      if (state.engine / state.engineMax <= DEFENSE.engineOutAt) {
        state.engineOut = true;
        events.push({ type: 'engineOut' });
      }
    }
    state.hull = Math.max(0, state.hull - remaining * hullMult);
  }

  // Disabled vs destroyed (§6.5): disabled at 15% hull; overkill destroys.
  if (!state.disabled && !state.destroyed && state.hull / state.hullMax <= DEFENSE.disableAtHull && state.hull > 0) {
    state.disabled = true;
    state.disabledSince = now;
    state.disabledDamage = 0;
    events.push({ type: 'disabled' });
  }
  if (state.disabled && !state.destroyed) {
    state.disabledDamage += damage;
    // ~2 s of sustained overkill: approximate via accumulated damage.
    if (state.disabledDamage > state.hullMax * 0.12 || state.hull <= 0) {
      state.destroyed = true;
      events.push({ type: 'destroyed' });
    }
  }
  if (state.hull <= 0 && !state.destroyed) {
    state.destroyed = true;
    events.push({ type: 'destroyed' });
  }
  return events;
}

/** Shield recharge + heat cooling. Call once per frame per live ship. */
export function tickShipState(state, now, dt) {
  if (state.destroyed) return;
  if (state.screen < state.screenMax && now - state.lastHitAt >= DEFENSE.screenRechargeDelay) {
    state.screen = Math.min(state.screenMax, state.screen + (state.screenMax / DEFENSE.screenRechargeTime) * dt);
  }
  if (state.shell < state.shellMax && now - state.lastCombatAt >= DEFENSE.shellRechargeDelay) {
    state.shell = Math.min(state.shellMax, state.shell + (state.shellMax / DEFENSE.shellRechargeTime) * dt);
  }
  if (state.heat > 0) {
    state.heat = Math.max(0, state.heat - HEAT.coolPerSec * dt);
    if (state.overheated && state.heat <= HEAT.overheatUnlockAt) state.overheated = false;
  }
  // Engine-out ships limp back slowly when left alone (no hard lockout §4.4).
  if (state.engineOut && now - state.lastCombatAt >= 30 && state.engine / state.engineMax < DEFENSE.engineOutAt + 0.05) {
    state.engine = Math.min(state.engineMax, state.engine + state.engineMax * 0.02 * dt);
    if (state.engine / state.engineMax > DEFENSE.engineOutAt) state.engineOut = false;
  }
}

// ---------- Resolve & the fear economy (§7) ----------
export const RESOLVE_WEIGHTS = { defense: 0.35, force: 0.25, fear: 0.2, cargo: 0.1, doctrine: 0.1 }; // §7.2
export const RESOLVE_BANDS = [
  { min: 70, band: 'defiant' },
  { min: 40, band: 'shaken' },
  { min: 20, band: 'bargaining' },
  { min: 0, band: 'capitulate' },
];

/**
 * inputs: { defense 0..1, force 0..1 (player advantage), fear 0..1,
 *           cargoAtStake 0..1, doctrine 0..1 (willingness to yield) }
 * Returns 0..100. Personality nudges ±10 (§7.2).
 */
export function computeResolve(inputs, personality = 0) {
  const r =
    inputs.defense * RESOLVE_WEIGHTS.defense * 100 +
    (1 - inputs.force) * RESOLVE_WEIGHTS.force * 100 -
    inputs.fear * RESOLVE_WEIGHTS.fear * 100 -
    inputs.cargoAtStake * RESOLVE_WEIGHTS.cargo * 100 * 0.5 +
    (1 - inputs.doctrine) * RESOLVE_WEIGHTS.doctrine * 100 +
    personality;
  return Math.max(0, Math.min(100, Math.round(r)));
}
export function resolveBand(resolve) {
  for (const { min, band } of RESOLVE_BANDS) if (resolve >= min) return band;
  return 'capitulate';
}

// ---------- Economy (§7.7/§7.8, §9) ----------
export const ECON = {
  destroyedCargoYield: [0.1, 0.4], // fraction of manifest recoverable from a kill
  fenceRate: [0.55, 0.7], // fenced cargo return vs book
  ransomRate: [0.08, 0.15], // of target book value
  tributeRate: 0.02, // of route cargo value per pass
  hotHullFence: [0.3, 0.5], // claimed hull after laundering
  fear: { capitulation: 2, ransom: 3, aceDefeated: 5, killedSurrendered: 8, decayPerWeek: 1, tributeOpensAt: 40, lawfulClosesAt: 50 },
};
export const COMMODITIES = {
  provisions: { name: 'Provisions', base: 100, legal: true },
  refinedMetals: { name: 'Refined metals', base: 240, legal: true },
  restrictedComponents: { name: 'Restricted components', base: 550, legal: false },
  rawOre: { name: 'Raw ore', base: 140, legal: true },
  livingRock: { name: 'Living rock', base: 600, legal: true }, // premium bio food §10.3
};
export const REFINED_ORE_MULT = [1.6, 2.2]; // §10.3
export const PRICE_BAND = 0.4; // prices stay within ±40% of baseline §8.4

// ---------- Star systems (§15.1/§15.3) ----------
// Wave 19: merged galaxy — authored lane first (contacts.js ledger iteration
// rides SYSTEMS key order), then the 94 generated systems. Generator
// validation prevents id collisions, so the spread order here fixes key
// order, not collision precedence.
export const SYSTEMS = { ...AUTHORED_SYSTEMS, ...GENERATED_SYSTEMS };
export const JUMP = {
  zone: 60, // activation range from gate
  chargeTime: 2.5, // s of tunnel/fade before arrival
  arrivalOffset: 50, // u past the destination gate toward system center
  graceSeconds: 5, // no hostile intent on arrival
  saveOnJump: true, // like dock/undock autosave §4.4
};
export const FACTIONS = {
  freehold: { name: 'Freehold Compact', color: 0xb0703a, doctrine: 0.4 },
  redledger: { name: 'Red Ledger', color: 0xa03434, doctrine: 0.7 },
  veridian: { name: 'Veridian Combine', color: 0x6fd0e0, doctrine: 0.5 },
  hollow: { name: 'Hollow Reach', color: 0x7a6a8a, doctrine: 0.3 },
  independent: { name: 'Independent', color: 0x9aa7b8, doctrine: 0.5 },
  // Wave 19: the Ten Banners (docs/rimward-faction-lore-omp.md). 'hollow'
  // stays the deep-rim unclaimed key (EPICS.hollow depends on it).
  ferrous: { name: 'Ferrous Hegemony', color: 0x6e7b8a, doctrine: 0.9 },
  gilded: { name: 'Gilded Chain', color: 0xd4af37, doctrine: 0.6 },
  beautiful: { name: 'Beautiful Ones', color: 0x7fe0a8, doctrine: 0.2 },
  congregation: { name: 'Congregation of the Further Shore', color: 0xd8c690, doctrine: 0.3 },
  assembly: { name: 'The Assembly', color: 0xaac4d8, doctrine: 0.5 },
  lamplighter: { name: 'Lamplighter Guild', color: 0xffd27a, doctrine: 0.5 },
  unknowables: { name: 'Unknowables', color: 0xe8e8ff, doctrine: 0.0 },
};

// §15 bands: pacing multipliers moving rimward — farther out, longer silences
export const BANDS = {
  0: { eventGapMult: 1.0, chatterMult: 1.0, songGapMult: 1.0 },
  1: { eventGapMult: 1.4, chatterMult: 0.6, songGapMult: 1.5 },
  2: { eventGapMult: 2.2, chatterMult: 0.25, songGapMult: 2.5 },
  3: { eventGapMult: 3.5, chatterMult: 0.1, songGapMult: 4.0 }, // the Hush: near-total silence
  4: { eventGapMult: 5.0, chatterMult: 0.05, songGapMult: 6.0 }, // the Verge: past silence — events almost never come
};

// Wave 9: hermit economy (§15 band 4). SYSTEMS[id].hermit opts a station in.
// station.js prices trades with these multipliers, market.js slows the random
// walk by walkMult, and the first successful trade fires milestone
// 'hermitMarket' with this line.
export const HERMIT = {
  buyMult: 1.25, // scarcity markup on what the station sells
  sellMult: 1.25, // premium it pays for anything hauled out here
  walkMult: 0.25, // a market with no traffic barely drifts
  line: 'The Vigil trades without ceremony — weights, measures, payment. What you brought is the first new thing here in a long time.',
};

// Wave 24: generated-faction station services (generated-system depth, part 2).
// One distinctive modifier per faction flown by the 94 generated systems, each
// with a flavor line station.js surfaces in the matching service UI (the
// 'Comped by the keepers' precedent — a note line, never a new service).
// station.js applies each modifier in its own transaction path, composed
// multiplicatively AFTER the wave-6 epic multiplier: epic first, faction
// second. Ruling (wave 24): freehold/veridian/redledger entries apply ONLY at
// generated stations flying those flags — station.js guards the authored six
// by id, so authored-system pricing stays byte-identical; 'hollow' is
// authored-only and holds no entry. §25: no authored-mystery references.
export const FACTION_SERVICES = {
  freehold: { repairMult: 0.9, line: 'The grange keeps a yard crew — neighbors’ rates.' },
  veridian: { jobPayMult: 1.15, line: 'The Combine pays contract rates, on the dot, audited to the digit.' },
  redledger: { buyMult: 1.15, line: 'Every credit is counted twice — once by you, once by the Ledger.' },
  ferrous: { repairMult: 0.85, line: 'The yard owes the Bastion.' },
  gilded: { sellMult: 1.15, line: 'Everything has a price, and the Chain pays it on the fall of the gavel.' },
  beautiful: { sellMult: 0.85, line: 'They pay for beauty, not ballast — the offer is the offer.' },
  congregation: { jobPayMult: 1.2, line: 'The porters of the Further Shore are paid from the tithe chest.' },
  assembly: { repairMult: 1.1, line: 'Every rivet is stamped, logged, and billed.' },
  independent: { jobPayMult: 1.1, line: 'No tithe, no tariff — work pays what the hand that posted it can carry.' },
  lamplighter: { buyMult: 0.85, line: 'The Guild keeps the lights; no traveler pays full fare at the Last Beacon.' },
};

// Wave 25: generated-faction dockmaster voice (generated-system depth, part 3).
// One recognition greeting + one rumor preface per faction flown by the 94
// generated systems — contacts.js reads them behind AUTHORED_SYSTEMS by-id
// guards (the wave-24 ruling, same as FACTION_SERVICES), so the authored six
// stay byte-identical; 'hollow' is authored-only and holds no entry. The
// greeting carries no ship name — the trust-60 comp line owns ship
// recognition — and the preface adds voice only, never an event (Witness
// Rule §8.7): each one reads naturally before a space + any of rumorFor's
// three bodies. Voices follow generate-galaxy.mjs's CT_TONE tones. §25: no
// authored-mystery references.
export const FACTION_RECOGNITION = {
  freehold: 'Back on the porch already? There’s always a berth for a neighbor.',
  veridian: 'Your charter reads clean. The Combine notes a returning account.',
  redledger: 'You again. Your tally holds — the Ledger counts a pilot who pays.',
  ferrous: 'The watch logged your last pass. Standing orders: you’re cleared to berth.',
  gilded: 'A returning consignor — the Chain remembers a good account.',
  beautiful: 'Back beneath the chandeliers — the salon remembers every lovely silhouette.',
  congregation: 'The vigil kept your lamp lit. Welcome back to the fold, traveler.',
  assembly: 'Your berth filing is current — welcome back, registered pilot.',
  independent: 'Look who drifted back. No flag, no paperwork — just glad you made it.',
  lamplighter: 'The lamps held the lane for you. The Guild lights the way home.',
};
export const FACTION_RUMOR = {
  freehold: 'Word travels porch to porch.',
  veridian: 'The filings record it plainly.',
  redledger: 'The Ledger counted it twice, so it happened.',
  ferrous: 'The muster saw it. The Bastion doesn’t repeat hearsay.',
  gilded: 'It came under the gavel’s notice, certified and cataloged.',
  beautiful: 'The salon whispered it before the mirrors did.',
  congregation: 'It was sung at vigil; the psalms do not lie.',
  assembly: 'The log has it, stamped and filed.',
  independent: 'The drift talks, if you know how to listen.',
  lamplighter: 'The lights carried the word down the lane.',
};

// Wave 26: generated-faction comp voice (generated-system depth, part 4).
// One line per faction flown by the 94 generated systems — what a generated
// dockmaster's spent favor says when it comps the yard. station.js uses each
// line DUAL-USE: spoken in the people-card notice and shown verbatim as the
// repair screen's note (the 'Comped by the keepers' precedent), so every
// line is plain recorded speech, never an invented event. Same wave-24
// ruling: the authored six are guarded by id, so they stay byte-identical;
// 'hollow' is authored-only and holds no entry. Voices follow
// generate-galaxy.mjs's CT_TONE tones. §25: no authored-mystery references.
export const FACTION_COMP = {
  freehold: 'The grange covers a neighbor’s yard bill — mend her and sit a spell.',
  veridian: 'This berth’s yard work posts to the Combine’s account — waived, audited to the digit.',
  redledger: 'Your marker covers the yard tally; the Ledger calls the account even.',
  ferrous: 'Standing orders: the Bastion’s yard crews mend you — no charge logged.',
  gilded: 'The gavel falls — the Chain buys out the yard’s bill, certified and cataloged.',
  beautiful: 'The salon insists — a lovely hull mends on the house, beneath the chandeliers.',
  congregation: 'The tithe chest opens for a traveler — the yard’s labor is this vigil’s offering.',
  assembly: 'Yard charges waived — form-stamped, filed, and read into the record as paid.',
  independent: 'No flag, no bill — the drift fixes its own, and the yard owes you one.',
  lamplighter: 'The lamps keep the lane; the Guild keeps the yard bill — mend and travel lit.',
};

// ---------- Faction ranks (§12.x station depth) ----------
/**
 * Reputation → named rank. First rung whose min <= rep wins, so the ladder
 * is ordered best-to-worst. tier > 0 grants sell-price goodwill at stations
 * flying that faction's flag (station.js applies the bonus).
 */
export const RANK_LADDER = [
  { min: 50, name: 'Sworn', tier: 3 },
  { min: 25, name: 'Trusted', tier: 2 },
  { min: 10, name: 'Known', tier: 1 },
  { min: -10, name: 'Stranger', tier: 0 },
  { min: -25, name: 'Suspect', tier: -1 },
  { min: -1000, name: 'Marked', tier: -2 },
];
export function rankFor(rep) {
  for (const rung of RANK_LADDER) if (rep >= rung.min) return rung;
  return RANK_LADDER[RANK_LADDER.length - 1];
}

// ---------- Wave 6: origins, faction epics, named aces, mystery convergence ----------

/**
 * ORIGINS (§25 narrative & agency: "origins create situations without imposing
 * personalities"). Chosen once on a fresh boot (origins.js, only when no save
 * was restored); the choice adjusts starting conditions only and is remembered
 * in ctx.world.origin. Effects vocabulary:
 *   setCredits/setFear — absolute set; addCredits — delta on the 350 default;
 *   reputation — deltas merged into ctx.world.reputation;
 *   setBond/setHunger — ctx.bio overrides; addCargo — pushed into ctx.cargo;
 *   startSystem — restore-style rebind to another system (origins.js mirrors
 *     save.js's restore path: currentSystem, prices rebind, ship placement at
 *     that system's station, 'systemLoaded' emit);
 *   cluesFound — ids pre-pushed into ctx.world.mystery.found.
 */
export const ORIGINS = {
  greenhand: {
    name: 'Freehold Greenhand',
    line: 'A berth, a living ship, and no story yet.',
    effects: {},
  },
  ledgerDebt: {
    name: 'Ledger Debt',
    line: 'The Red Ledger owns your hull papers. Fly it off.',
    effects: { addCredits: -1500, reputation: { redledger: -10, freehold: 10 } },
  },
  marked: {
    name: 'Marked',
    line: 'Veridian space has your face on a board. Someone downstream taught them to be careful.',
    effects: { setFear: 15, reputation: { veridian: -15, redledger: 10 } },
  },
  beautiful: {
    name: 'Beautiful Ones Initiate',
    line: 'You were raised among grown ships. Yours chose you back.',
    effects: { setBond: 0.35, setHunger: 0.4, addCargo: [{ commodity: 'livingRock', units: 2 }] },
  },
  drifter: {
    name: 'Rim Drifter',
    line: 'You came in from the Redmarch with more questions than money.',
    effects: { setCredits: 600, setFear: 5, startSystem: 'redmarch', cluesFound: ['rm_c_tally'] },
  },
};

/**
 * EPICS (ladder #10 faction epics, derived from §29 + glossary — the §1-24
 * epic specs are truncated). One systemic arc per faction: three rank/clue
 * stages (wave 6) plus a fourth CAPSTONE stage (wave 7) gated on a systemic
 * condition, not a scripted quest. epics.js advances a stage the moment its
 * requirements hold, emits 'epicStage', and records progress in
 * ctx.world.epics = { [faction]: stageCount }.
 * Requirement vocabulary (stageHolds, epics.js):
 *   rankTier — rankFor(ctx.world.reputation[faction]).tier >= value
 *   cluesFound — ctx.world.mystery.found.length >= value
 *   landmarkVisited — id present in ctx.world.mystery.visited
 *   converged / deepened — ctx.world.mystery flags true
 *   credits — ctx.world.credits >= value (multiples of 500 only: the
 *     watched-value cache quantizes credits to 500-UU buckets)
 *   fear — ctx.world.fear >= value
 * Effect vocabulary (all read live at transaction/AI time; nothing here is
 * applied by mutating other modules' state). Effects MERGE by Object.assign
 * across achieved stages — a later stage's value REPLACES an earlier one
 * under the same key; capstone values below are totals, not deltas:
 *   sellMult/buyMult — station.js trade prices at stations of this faction
 *   repairMult — station.js refit pricing at this faction's station
 *   jobPayMult — station.js job payouts at this faction's station
 *   restrictedSellMult — station.js restricted-components sales (stacks with
 *     the wave-4 fixer markup)
 *   pirateResolveMod — npc.js adds this to computeResolve's personality arg
 *     for pirates of this faction (negative = they yield sooner)
 */
export const EPICS = {
  freehold: {
    faction: 'freehold',
    name: "The Shepherd's Lane",
    stages: [
      { requires: { rankTier: 1 }, effect: { repairMult: 0.9 },
        line: "The Compact posts your name under the Shepherd's old lane. Nobody has flown it in years; they are glad someone might." },
      { requires: { rankTier: 2 }, effect: { jobPayMult: 1.15 },
        line: 'Dock crews wave you into the short queue. The Shepherd blinks a little brighter when you pass. Nobody admits to maintaining it.' },
      { requires: { rankTier: 3 }, effect: { sellMult: 1.1 },
        line: 'The lane the Shepherd still broadcasts ends somewhere past the rim charts. The Compact swears you to it: when you find what is there, come home and tell them.' },
      // Capstone (wave 7): the lane's end exists — a second beacon in the Hush.
      { requires: { rankTier: 3, landmarkVisited: 'th_lanes_end' }, effect: { sellMult: 1.15 },
        line: 'You have flown the Shepherd\'s lane to its end and come home to say so. The Compact keeps no higher standing than a witness.' },
    ],
  },
  redledger: {
    faction: 'redledger',
    name: 'The Unfinished Column',
    stages: [
      { requires: { rankTier: 1 }, effect: { restrictedSellMult: 1.1 },
        line: "A Ledger clerk notes your name in a fresh column. 'Accounts in good standing,' she says, and doesn't smile." },
      { requires: { rankTier: 2 }, effect: { buyMult: 0.9 },
        line: "The Tithe Stone's unfinished column — a clerk asks, casual, what you would carve there. Every answer is written down." },
      { requires: { rankTier: 3 }, effect: { pirateResolveMod: -10 },
        line: "The Ledger strikes your tithe. Their pirates are told your hull is bad luck. The column stays unfinished, and now you know they are afraid to finish it." },
      // Capstone (wave 7): the column stays unfinished by your choice now.
      { requires: { rankTier: 3, credits: 8000 }, effect: { buyMult: 0.85 },
        line: "You could carve the column's last name a hundred times over. You don't. The Ledger respects an account that chooses to stay open." },
    ],
  },
  veridian: {
    faction: 'veridian',
    name: 'The Sixth Berth',
    stages: [
      { requires: { rankTier: 1 }, effect: { sellMult: 1.1 },
        line: "The Combine opens Hulk Row's manifests to you. Five hulls, no distress logs, and one berth scrubbed from every copy." },
      { requires: { rankTier: 2 }, effect: { repairMult: 0.85 },
        line: "Refinery crews leave a sixth bracket empty on the Row. 'Tradition,' they say. They won't say whose." },
      { requires: { rankTier: 3 }, effect: { jobPayMult: 1.25 },
        line: 'The Combine names you a partner of the Reach — and quietly asks you to stop asking about the sixth berth. The price of silence is excellent.' },
      // Capstone (wave 7): stand on the Row as Sworn and the berth answers.
      { requires: { rankTier: 3, landmarkVisited: 'vd_hulk_row' }, effect: { repairMult: 0.75 },
        line: 'Standing on the Row, you finally see it: the sixth bracket is not empty. It is reserved. The crews meet your eyes and say nothing at all.' },
    ],
  },
  hollow: {
    faction: 'hollow',
    name: 'What the Beacon Repeats',
    stages: [
      { requires: { cluesFound: 1 }, effect: { buyMult: 0.9 },
        line: "The anchorage has no ranks to give. The keeper logs your name beside the Quiet Beacon's one-word message, like you are part of the answer." },
      { requires: { cluesFound: 3 }, effect: { sellMult: 1.15 },
        line: "Out here your ship's song carries further than it should. The keeper says the Beacon changed its interval the day you arrived." },
      { requires: { cluesFound: 4 }, effect: { repairMult: 0.8 },
        line: "Whatever the Beacon repeats, your ship has started harmonizing with it. The keeper won't translate. She says you are closer than the colonies ever got." },
      // Capstone (wave 7): the mystery's second rung, witnessed.
      { requires: { deepened: true }, effect: { repairMult: 0.7 },
        line: 'The keeper closes her log. "It has your voice now," she says. "Whatever it becomes, it began with you." Her care costs you less; some debts the anchorage will not name.' },
    ],
  },
};

/**
 * Named aces with world.js-managed lineages (glossary: Named ace / Named
 * Gun). The hunter ace is NOT in any system's cast: world.js injects her
 * record into the redmarch record bank once ctx.world.fear crosses
 * fearThreshold (tracked in ctx.world.aceRivalry.hunterSpawned so the
 * injection happens exactly once, persisted). She hunts the player like an
 * ace and never migrates. Carver Illyx IS authored in the Freehold cast
 * (createRecords); his entry here exists so world.js can spawn his kin.
 */
export const ACES = {
  hunter: {
    name: 'Sister Vane',
    system: 'redmarch',
    faction: 'redledger',
    classKey: 'ace',
    bounty: 4000,
    cargo: [{ commodity: 'restrictedComponents', units: 6 }],
    fearThreshold: 25,
    // Named-Gun lineage (wave 7): the name is a mantle, not a person. Each
    // time the hunter is defeated, a successor takes up the name after
    // lineage.respawnDelay world-seconds — same name, new pilot, harder
    // (record.resolve seeded base + resolvePerGeneration × generation, bounty
    // scaled by bountyGrowth^generation). The line ends at maxGenerations;
    // defeating the last bearer fires milestone 'namedGunBroken'. Progress
    // lives on ctx.world.aceRivalry { hunterGeneration, hunterDownAt }.
    lineage: { maxGenerations: 3, respawnDelay: 90, resolvePerGeneration: 12, bountyGrowth: 1.5 },
  },
  illyx: {
    name: 'Carver Illyx',
    system: 'freehold',
    faction: 'redledger',
    classKey: 'ace',
    bounty: 2500,
    // Freehold lineage (wave 8): where the Ledger's Vane is an institutional
    // mantle, Illyx's name is carried by kin. Each defeat lets the next
    // bearer take up the name after lineage.respawnDelay world-seconds —
    // same name, harder (record.resolve seeded base + resolvePerGeneration ×
    // generation, bounty scaled by bountyGrowth^generation). maxGenerations
    // 2 means exactly TWO bearers: Carver himself plus one successor —
    // defeating the successor breaks the line (milestone 'illyxLineBroken').
    // Progress lives on ctx.world.aceRivalry { illyxGeneration,
    // illyxDownAt }. No cargo field: the successor copies the Freehold
    // cast ace's restrictedComponents load in world.js.
    lineage: { maxGenerations: 2, respawnDelay: 120, resolvePerGeneration: 10, bountyGrowth: 1.4 },
  },
};

/**
 * NAMED_GUNS (wave 9): the rim reacts to having no Named Guns left. When
 * BOTH broken-line milestones ('namedGunBroken' + 'illyxLineBroken') sit in
 * ctx.world.milestones, world.js fires 'rimWithoutGuns' once and bumps
 * ctx.world.fear by fearBonus — the wave-7/8 lines were the Ledger's long
 * arm, and the lanes notice when the arm is gone. npc.js folds
 * brokenResolveMod into every pirate's resolve while the milestone stands
 * (systemic §7.2 shift, additive like the epic pirateResolveMod).
 *
 * Wave 10 — ASPIRANTS: once 'rimWithoutGuns' stands and fear sits at the top
 * of the economy (ECON.fear.lawfulClosesAt is 50, hence fearThreshold 50),
 * the rim grows NEW Named Guns. Aspirants are new names, not mantles — no
 * lineage, no Ledger contract — and each rises exactly once, in order,
 * while fear stays maxed. One flies at a time (aceRivalry.aspirantFlying);
 * the next rises aspirants.respawnDelay world-seconds after the last fell
 * (aspirantDownAt). When the third name is spent, no more rise. world.js
 * emits 'gunRisen' on each rise and fires milestone 'aspirantBroken' on the
 * first aspirant defeat. Progress lives on ctx.world.aceRivalry
 * { aspirantRisen, aspirantDownAt, aspirantFlying }.
 * Wave 11: when the third name falls the rim gets a final word — milestone
 * 'rimAnswered' + 'songShift' { reason: 'aftermath' } — not an ending (§25).
 */
export const NAMED_GUNS = {
  brokenResolveMod: -5, // pirates rim-wide yield sooner once no Named Gun flies
  fearBonus: 5, // one-time fear bump when the second line breaks
  aspirants: {
    fearThreshold: 50, // fear must be maxed (ECON.fear.lawfulClosesAt)
    respawnDelay: 150, // world-seconds after a defeat before the next name rises
    resolve: 75, // aspirants start hard — they studied two broken lines
    bounty: 4000,
    names: ['Harrow Quist', 'Saint Ruvic', 'Ash Bell'],
    lines: [
      'No line bought this one. Harrow Quist rides the lanes to see what broke the Guns.',
      'Saint Ruvic carries no mantle. He carries a heading — yours.',
      'Ash Bell learned your shape from two broken lines. The lanes have a third name now.',
    ],
  },
};

/**
 * CALLOW (wave 11): Old Callow sells what memory is worth — ONE vouch into
 * the keepers' second column, witness-rule safe (§8.7: nothing enters
 * world.incidents; the record's `vouched` flag, keeper trust/favors, and
 * milestone 'callowVouched' carry the witness). returnLines are his memory
 * of the lane — one per verge visit, rotating via rec.callowReturns on the
 * verge pirate record (persisted free through recordBanks). hailRange gates
 * the vouch OFFER: his live ship must be near, not just the record route.
 * The purchase itself lives in hail.js ('callowVouch' intent).
 * Wave 12: he keeps books on the player too. Once the record's `vouched`
 * flag stands (witness-rule safe §8.7 — recorded state, nothing invented),
 * his return lines come from vouchedReturnLines instead (same
 * rec.callowReturns cursor; he never asks how the word was spent, §25), and
 * a second sale is refused — refuseLines rotate via rec.callowRefusals, one
 * refusal per verge visit, no hail card, no price ('I sell it once').
 */
export const CALLOW = {
  hailRange: 800, // vouch offer range (u) — his live ship must be near
  vouchCost: 600,
  vouchTrust: 15, // trust granted to each deep-rim keeper on a vouch
  offerLine: "Back for more quiet? I can put your name in the keepers' second column. 600, and I sell it once.",
  vouchLine: "Done. The keepers write their own columns — but they'll write you in.",
  vouchMilestoneLine: 'Old Callow sold you a word in the two-column ledger. The keepers will honor it.',
  returnLines: [
    'Back again. The lane remembers you now — I keep its books.',
    "Nothing comes through here that I don't count. You're counted twice over.",
    "The quiet out here isn't empty. You know that better than most.",
  ],
  vouchedReturnLines: [
    'Your name is in their column now. I keep the books that say so.',
    'Back again. Some entries I balance in one column. Yours I balance in two.',
    "The keepers hold a column for owed words. You're written in it — I checked the sum.",
  ],
  refuseLines: [
    'One word is what I sold. The column doesn\'t take seconds.',
    "It's entered. It's balanced. Books like mine don't sell the same line twice.",
  ],
};

/**
 * Mystery next rung (§25: "the mystery increases curiosity before it increases
 * explanation" — this NEVER restates the buried truth). Once the player holds
 * cluesNeeded clues, mystery.js voices hintLine once and the site becomes
 * discoverable in its system (landmarks.js renders it only after the hint).
 * Proximity discovery at radius fires milestone 'convergence', the site line,
 * and 'songShift' — the §29 bio-path payoff: her song changes from here.
 * Progress persists inside ctx.world.mystery {convergeHinted, converged}.
 */
export const CONVERGENCE = {
  cluesNeeded: 3,
  hintLine: 'The clues you carry pull the same way — rimward, and down. The ship keeps singing one note longer than she used to.',
  site: {
    id: 'convergence',
    name: 'The Convergence',
    system: 'hollowreach',
    kind: 'anomaly',
    position: [-400, 250, -150],
    radius: 60,
    line: 'The tally, the shanty, the garden — they were never scattered. They were a heading. Your ship hums the last note of it, and something in the dark hums back in the same key.',
  },
};

/**
 * Mystery rung AFTER convergence (wave 7; §25 curiosity-before-explanation,
 * §27 — reference, never restate the buried truth). Once the player has
 * converged AND holds cluesNeeded clues (5 of the 6 authored — the last two
 * live in the Hush, so the chain pulls rimward), Echo voices hintLine once
 * (mystery.deepHinted); approaching the site then fires milestone
 * 'deepening', a 'deepening' event, and a second 'songShift'
 * { reason: 'deepening' } once ever (mystery.deepened).
 */
export const DEEPENING = {
  cluesNeeded: 5,
  hintLine: 'Since the dark first answered, her song has become a question asked twice. The second asking points past Hollow Reach — to the place the lane was always going.',
  site: {
    id: 'deepening',
    name: 'The Answer',
    system: 'hush',
    kind: 'anomaly',
    position: [-100, 320, -80],
    radius: 60,
    line: 'It was never a place. It was a correspondence, and you have flown the whole length of it. Her song and the dark are one voice now — and it is not finished becoming.',
  },
};

/**
 * Origin payoff arcs (wave 7). Origins set situations; these close them.
 * world.js owns the checks; progress persists in ctx.world.originArc
 * (WORLD_FIELDS 'originArc'), a flat JSON-plain record:
 *   { calls, lastCallAt, debtCleared, collectorSent,
 *     calls2, lastCallAt2, collectorSent2, reenteredDebt, debtClearedAgain,
 *     marked, beautiful, drifter, greenhand,
 *     beautiful1, beautiful2, marked1, marked2,
 *     drifter1, drifter2, greenhand1, greenhand2 }
 * ledgerDebt is the deep arc, in two rounds. Round 1: while credits < 0 the
 * Ledger calls every callInterval world-seconds (escalating lines,
 * 'creditorCall' {stage,line}); the maxCalls-th call also injects the
 * collector (a named cutter, role 'pirate', hunts the player) into the
 * CURRENT system's record bank, once. Reaching credits >= 0 closes it:
 * milestone 'debtCleared', redledger rep +clearRepBonus. Round 2 (repeat
 * debtor): after debtCleared, dipping negative again sets reenteredDebt and
 * re-arms the arc — round2.maxCalls colder calls on round2.callInterval
 * ('creditorCall' stage 4/5), the last re-injecting Dresk once plus a
 * Whisper 'commLine'; climbing back to >= 0 fires milestone
 * 'debtClearedAgain' + round2.clearRepBonus. There is no third round. The
 * other four arcs fire one-time payoffs ('originPayoff' {id, line}) on
 * their condition; all four also grow two mid-beats each ('originBeat'
 * {id,line}, lines in beats) ahead of the payoff — beautiful/marked since
 * wave 8, drifter/greenhand added wave 9:
 *   marked — beats at fear 25 (veridian rep < 0) and veridian rep >= -5;
 *     payoff at veridian reputation >= 0 (the board comes down)
 *   beautiful — beats at growth 0.4 and 0.75; payoff at growth 1 (she
 *     finishes becoming)
 *   drifter — beats at the first EARNED clue (mystery.found reaches 2 —
 *     the origin grants rm_c_tally at pick) and at mystery.convergeHinted;
 *     payoff at mystery.converged (the tally's question, stood inside)
 *   greenhand — beats when any faction |reputation| or fear first reaches
 *     10 (the rim learns the name) and when any faction reputation first
 *     reaches 25 (a berth that is yours); payoff at any epic stage
 *     recorded (no story yet → a story)
 */
export const ORIGIN_ARCS = {
  ledgerDebt: {
    callInterval: 240, // world-seconds between come-due calls while in debt
    maxCalls: 3,
    repPerCall: -3, // each unanswered call costs redledger standing
    clearRepBonus: 10,
    callLines: [
      'Ledger hail: your account is past due, pilot. Fly it off faster.',
      'Ledger hail: the Column does not forget a name. Yours is written in red.',
      'Ledger hail: enough. A collector has your vector. Pay, or be collected.',
    ],
    collector: {
      name: 'Collector Dresk',
      classKey: 'cutter',
      faction: 'redledger',
      cargo: [{ commodity: 'restrictedComponents', units: 4 }],
      bounty: 0,
    },
    clearLine: 'Ledger hail: account closed. The Column strikes your name in black. The clerk almost smiles.',
    // Round 2 (repeat debtor): re-armed by dipping negative after
    // debtCleared. Colder, shorter — and Dresk never lost the vector.
    round2: {
      callInterval: 180,
      maxCalls: 2,
      repPerCall: -5,
      clearRepBonus: 5,
      callLines: [
        'Ledger hail: again. The Column noted the black ink; it notes the red twice as fast.',
        'Ledger hail: no patience this time. Collector Dresk kept your vector — and your name.',
      ],
      clearLine: 'Ledger hail: account closed a second time. The clerk does not almost-smile. The Column does not extend a third.',
    },
  },
  beats: {
    beautiful: [
      { id: 'beautiful1', line: 'She molts for the first time under your care — a slow hush of shed hull-skin drifting loose, and new growth beneath, soft and bright as morning.' },
      { id: 'beautiful2', line: 'Her new growth has begun to answer the dark on its own — small chords, unsolicited, curious. She is listening to something out there, and learning its shape.' },
    ],
    marked: [
      { id: 'marked1', line: 'The board in Veridian spacedock has a second sketch under your face now. Someone is paying to keep it current.' },
      { id: 'marked2', line: "A Combine clerk quietly misfiles your dossier. The board's copy of your face has begun to blur." },
    ],
    // Wave 9 mid-beats: drifter/greenhand grow two 'originBeat' steps each
    // ahead of their payoffs, same shape as beautiful/marked.
    drifter: [
      { id: 'drifter1', line: 'You found a second count the colonies stopped keeping. The tally-board was never alone — the rim keeps its own ledger of questions, and yours is not the longest.' },
      { id: 'drifter2', line: 'The pull rimward is not new to you. You have been following it since before you knew it had a direction.' },
    ],
    greenhand: [
      { id: 'greenhand1', line: "A dockhand you have never met uses your ship's name. Word travels the lanes faster than you do." },
      { id: 'greenhand2', line: 'You know which berth is yours, which clerk skims, which lane runs quiet. The Drift has stopped feeling like a question.' },
    ],
  },
  payoffs: {
    marked: 'The board in Veridian spacedock comes down. No announcement; one morning your face simply is not there. The Combine does not apologize — it un-remembers.',
    beautiful: 'She stretches the whole length of her new growth against the dark and hums, content. Whatever she is becoming, she is becoming it with you.',
    drifter: 'The tally ends where you are standing. You came in with more questions than money; you leave this one answered, and the rest no longer feel like debts.',
    greenhand: 'A berth, a living ship — and now a story. The Drift will want to hear it.',
  },
};

/** Ransom offer for a disabled/bargaining target (§7.8). */
export function ransomFor(state) {
  const [lo, hi] = ECON.ransomRate;
  return Math.round(state.bookValue * (lo + Math.random() * (hi - lo)));
}
/** Cargo value at current prices. */
export function cargoValue(cargo, prices) {
  return cargo.reduce((sum, c) => sum + (prices[c.commodity] ?? COMMODITIES[c.commodity]?.base ?? 0) * c.units, 0);
}
