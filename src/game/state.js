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
    gates: [{ position: [0, 55, -850], to: 'veridian' }],
    priceBase: { provisions: 1.3, refinedMetals: 0.9, restrictedComponents: 0.7, rawOre: 1.1, livingRock: 1.2 },
    cast: { traders: 5, pirates: 7, patrols: 1, ace: false },
    tradesRestricted: true,
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
  independent: { name: 'Independent', color: 0x9aa7b8, doctrine: 0.5 },
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
