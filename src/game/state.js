/**
 * RIMWARD web — shared simulation core. Pure data + math, no three.js, no DOM.
 * Every gameplay constant traces to docs/rimward-game-elements-omp.md (noted
 * as §). Numbers scaled ×1.5 from doc m/s to our world units (player cruise
 * 120 u/s = doc 80 m/s).
 *
 * This file is READ-ONLY for feature workers: import, don't modify. If a
 * worker needs a change here, it must report back instead.
 */

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
/**
 * System definitions. Systems are SWAPPED IN PLACE: on gate jump, jump.js
 * emits 'systemLoaded' { to } and per-system modules (solarsystem, asteroids,
 * station) rebuild their content from SYSTEMS[ctx.world.currentSystem].
 * All positions are plain [x,y,z] arrays — JSON-serializable.
 *
 * Each system has a GATE NETWORK: gates[] lists every transit ring in the
 * system as { position, to }. gates[0] is the primary gate (the route anchor
 * world.js geography helpers use); jump.js arrives at the destination gate
 * whose `to` points back at the origin system (fallback gates[0]).
 * tradesRestricted marks stations that always trade restricted components
 * (station.js reads the flag; unflagged systems never do).
 *
 * priceBase multipliers set each system's market baseline vs COMMODITIES.base,
 * creating deliberate arbitrage spreads (Freehold grows food, Veridian refines
 * metal): buy low here, sell high there (§10.1).
 *
 * band indexes BANDS (§15): 0 = core, 2 = rim edge. Pacing modules read it
 * to stretch event/chatter/song gaps the farther out you fly.
 * landmarks[] are authored POIs { id, name, kind, position, line } discovered
 * at 100u; clues[] are mystery breadcrumbs { id, position, line } discovered
 * at 35u (mystery.js owns discovery; ctx.world.mystery tracks found/visited).
 * Both sit away from station/field/gates so finding them means traveling.
 */
export const SYSTEMS = {
  freehold: {
    id: 'freehold',
    name: 'Freehold Drift',
    faction: 'freehold',
    worldSeed: 11,
    sunColor: 0xffe0b0,
    sunRadius: 60,
    planetCount: 5,
    station: { name: 'Freehold Landing', position: [120, 20, 620], palette: 0xb0703a },
    field: { center: [-450, -30, -250], radius: 160, count: 130, oreMult: 1 },
    gates: [{ position: [0, 60, -900], to: 'veridian' }],
    priceBase: { provisions: 1.0, refinedMetals: 1.1, restrictedComponents: 1.0, rawOre: 1.0, livingRock: 0.9 },
    cast: { traders: 8, pirates: 4, patrols: 2, ace: true },
    band: 0,
    landmarks: [
      { id: 'fh_shepherd', name: 'The Shepherd', kind: 'beacon', position: [750, 90, -100], line: 'A navigation beacon, older than the charts that cite it. Still broadcasting a lane nobody flies.' },
    ],
    clues: [],
  },
  veridian: {
    id: 'veridian',
    name: 'Veridian Reach',
    faction: 'veridian',
    worldSeed: 47,
    sunColor: 0xcfe8ff,
    sunRadius: 55,
    planetCount: 3,
    station: { name: 'Veridian Spire', position: [-140, 30, -550], palette: 0x6fd0e0 },
    field: { center: [500, -40, 300], radius: 120, count: 90, oreMult: 1.5 },
    gates: [
      { position: [0, 50, 900], to: 'freehold' },
      { position: [850, 45, 100], to: 'redmarch' },
    ],
    priceBase: { provisions: 1.35, refinedMetals: 0.75, restrictedComponents: 1.2, rawOre: 0.8, livingRock: 1.3 },
    cast: { traders: 7, pirates: 3, patrols: 3, ace: false },
    tradesRestricted: true,
    band: 0,
    landmarks: [
      { id: 'vd_hulk_row', name: 'Hulk Row', kind: 'wreck', position: [-700, -60, 350], line: 'Five refinery hulls parked in a perfect line. No distress log on file for any of them.' },
    ],
    clues: [
      { id: 'vd_c_shanty', position: [-600, 100, -100], line: 'A hull plate etched with a work-song verse. The last line was scratched out by hand.' },
    ],
  },
  redmarch: {
    id: 'redmarch',
    name: 'The Redmarch',
    faction: 'redledger',
    worldSeed: 73,
    sunColor: 0xff9a8a,
    sunRadius: 50,
    planetCount: 4,
    station: { name: 'Ledger Anchorage', position: [200, 40, -480], palette: 0xa03434 },
    field: { center: [-380, -50, 380], radius: 140, count: 110, oreMult: 1.2 },
    gates: [
      { position: [0, 55, -850], to: 'veridian' },
      { position: [-800, 50, -200], to: 'hollowreach' },
    ],
    priceBase: { provisions: 1.3, refinedMetals: 0.9, restrictedComponents: 0.7, rawOre: 1.1, livingRock: 1.2 },
    cast: { traders: 5, pirates: 7, patrols: 1, ace: false },
    tradesRestricted: true,
    band: 1,
    landmarks: [
      { id: 'rm_tithe_stone', name: 'The Tithe Stone', kind: 'monument', position: [600, -80, 500], line: 'A ledger carved in rock ten decks tall. The names stop mid-column, chisel marks still fresh.' },
    ],
    clues: [
      { id: 'rm_c_tally', position: [-100, 140, 100], line: 'A drifter\'s tally-board, counting something in sevens. The count ends at a number no one round here will say aloud.' },
    ],
  },
  hollowreach: {
    id: 'hollowreach',
    name: 'Hollow Reach',
    faction: 'hollow',
    worldSeed: 99,
    sunColor: 0x8a7a9a,
    sunRadius: 40,
    planetCount: 2,
    station: { name: 'Hollow Anchorage', position: [-300, 30, 500], palette: 0x7a6a8a },
    field: { center: [420, -60, -320], radius: 100, count: 60, oreMult: 2.0 },
    gates: [{ position: [0, 70, 1100], to: 'redmarch' }],
    priceBase: { provisions: 1.6, refinedMetals: 1.2, restrictedComponents: 0.6, rawOre: 0.9, livingRock: 0.7 },
    cast: { traders: 2, pirates: 3, patrols: 0, ace: false },
    tradesRestricted: true,
    band: 2,
    landmarks: [
      { id: 'hr_quiet_beacon', name: 'The Quiet Beacon', kind: 'beacon', position: [550, 150, 400], line: 'A beacon still transmitting to no one. Its message is one word, repeated, in a cipher the colonies never used.' },
      { id: 'hr_first_wreck', name: 'The First Wreck', kind: 'wreck', position: [-550, -100, -450], line: 'A wreck field older than the colonies. The hull alloy doesn\'t match any foundry in the rim.' },
    ],
    clues: [
      { id: 'hr_c_answer', position: [150, -20, 150], line: 'Your ship\'s song went out ahead of you — and something here answered in the same key.' },
      { id: 'hr_c_garden', position: [-150, 200, -600], line: 'A ring of stones arranged like a garden. Whatever was planted here was dug up and taken rimward.' },
    ],
  },
};
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
};

// §15 bands: pacing multipliers moving rimward — farther out, longer silences
export const BANDS = {
  0: { eventGapMult: 1.0, chatterMult: 1.0, songGapMult: 1.0 },
  1: { eventGapMult: 1.4, chatterMult: 0.6, songGapMult: 1.5 },
  2: { eventGapMult: 2.2, chatterMult: 0.25, songGapMult: 2.5 },
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
 * epic specs are truncated). One three-stage systemic arc per faction. Stages
 * are NOT scripted quests: epics.js advances a stage the moment its
 * requirements hold (rankTier via rankFor on ctx.world.reputation[faction],
 * or cluesFound via ctx.world.mystery.found.length), emits 'epicStage', and
 * records progress in ctx.world.epics = { [faction]: stageCount }.
 * Effect vocabulary (all read live at transaction/AI time; nothing here is
 * applied by mutating other modules' state):
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
    ],
  },
};

/**
 * Named aces beyond Carver Illyx (glossary: Named ace / Named Gun). The hunter
 * ace is NOT in any system's cast: world.js injects her record into the
 * redmarch record bank once ctx.world.fear crosses fearThreshold (tracked in
 * ctx.world.aceRivalry.hunterSpawned so the injection happens exactly once,
 * persisted). She hunts the player like an ace and never migrates.
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
  },
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

/** Ransom offer for a disabled/bargaining target (§7.8). */
export function ransomFor(state) {
  const [lo, hi] = ECON.ransomRate;
  return Math.round(state.bookValue * (lo + Math.random() * (hi - lo)));
}
/** Cargo value at current prices. */
export function cargoValue(cargo, prices) {
  return cargo.reduce((sum, c) => sum + (prices[c.commodity] ?? COMMODITIES[c.commodity]?.base ?? 0) * c.units, 0);
}
