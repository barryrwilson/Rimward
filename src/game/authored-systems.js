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
 * band indexes BANDS (§15): 0 = core, 3 = the deepest rim, 4 = past the rim
 * (the Verge). Pacing modules read it
 * to stretch event/chatter/song gaps the farther out you fly.
 * landmarks[] are authored POIs { id, name, kind, position, line } discovered
 * at 100u; clues[] are mystery breadcrumbs { id, position, line } discovered
 * at 35u (mystery.js owns discovery; ctx.world.mystery tracks found/visited).
 * Both sit away from station/field/gates so finding them means traveling.
 *
 * This module is pure data with zero imports: state.js merges it into SYSTEMS
 * and scripts/generate-galaxy.mjs derives its authored stubs from it, so the
 * two can never drift apart.
 */
export const AUTHORED_SYSTEMS = {
  freehold: {
    id: 'freehold',
    name: 'Freehold Drift',
    faction: 'freehold',
    worldSeed: 11,
    chart: [1620, 760], // galactic map coords (2000x1400 box, x decreases rimward)
    // Lamplighter junction: routes served from the hub gate (galaxy-map pick)
    hub: { position: [120, 70, -820], routes: ['fh_hearth', 'fh_haven', 'fh_meridian', 'fx_bastion'] },
    sunColor: 0xffe0b0,
    sunRadius: 60,
    planetCount: 5,
    station: { name: 'Freehold Landing', position: [120, 20, 620], palette: 0xb0703a },
    field: { center: [-450, -30, -250], radius: 160, count: 130, oreMult: 1 },
    gates: [{ position: [0, 60, -900], to: 'veridian' }],
    // Wave 51: exotic-ore spread. A system pays MORE for ore its own band
    // cannot produce and LESS for what its field is full of, so hauling
    // hard ore coreward is the paying direction. Generated systems carry no
    // exotic entries and fall through to ×1.0 (market.js baselineFor).
    priceBase: {
      provisions: 1.0, refinedMetals: 1.1, restrictedComponents: 1.0, rawOre: 1.0, livingRock: 0.9,
      slagIron: 0.85, brineIce: 0.90, chromeSalt: 1.15, gildvein: 1.25,
      emberglass: 1.20, voidPlatinum: 1.35, wakeglass: 1.40,
    },
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
    chart: [1470, 830],
    hub: { position: [-120, 55, 820], routes: ['vd_survey', 'vd_prospect', 'vd_canaan', 'gc_auction'] },
    sunColor: 0xcfe8ff,
    sunRadius: 55,
    planetCount: 3,
    station: { name: 'Veridian Spire', position: [-140, 30, -550], palette: 0x58c49a }, // wave 37: emerald (D1)
    field: { center: [500, -40, 300], radius: 120, count: 90, oreMult: 1.5 },
    gates: [
      { position: [0, 50, 900], to: 'freehold' },
      { position: [850, 45, 100], to: 'redmarch' },
    ],
    // Combine refineries bid up smeltable feedstock and dump what they finish.
    priceBase: {
      provisions: 1.35, refinedMetals: 0.75, restrictedComponents: 1.2, rawOre: 0.8, livingRock: 1.3,
      slagIron: 1.20, brineIce: 1.05, chromeSalt: 1.30, gildvein: 1.10,
      emberglass: 0.95, voidPlatinum: 1.15, wakeglass: 0.85,
    },
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
    chart: [1300, 780],
    hub: { position: [140, 60, -720], routes: ['rl_toll', 'rl_reckoning', 'rl_cutter', 'blackstation'] },
    sunColor: 0xff9a8a,
    sunRadius: 50,
    planetCount: 4,
    station: { name: 'Ledger Anchorage', position: [200, 40, -480], palette: 0xa03434 },
    field: { center: [-380, -50, 380], radius: 140, count: 110, oreMult: 1.2 },
    gates: [
      { position: [0, 55, -850], to: 'veridian' },
      { position: [-800, 50, -200], to: 'hollowreach' },
    ],
    // The Ledger settles in gildvein more often than in UU.
    priceBase: {
      provisions: 1.3, refinedMetals: 0.9, restrictedComponents: 0.7, rawOre: 1.1, livingRock: 1.2,
      slagIron: 1.05, brineIce: 1.10, chromeSalt: 1.00, gildvein: 1.35,
      emberglass: 1.10, voidPlatinum: 1.20, wakeglass: 0.90,
    },
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
    chart: [1130, 840],
    hub: { position: [-80, 65, 950], routes: ['lastbeacon', 'uc_drift', 'uc_sorrow'] },
    sunColor: 0x8a7a9a,
    sunRadius: 40,
    planetCount: 2,
    station: { name: 'Hollow Anchorage', position: [-300, 30, 500], palette: 0x7a6a8a },
    field: { center: [420, -60, -320], radius: 100, count: 60, oreMult: 2.0 },
    gates: [
      { position: [0, 70, 1100], to: 'redmarch' },
      { position: [650, 60, -700], to: 'hush' },
    ],
    // oreMult 2.0: the Reach is knee-deep in rock and short of everything else.
    priceBase: {
      provisions: 1.6, refinedMetals: 1.2, restrictedComponents: 0.6, rawOre: 0.9, livingRock: 0.7,
      slagIron: 0.80, brineIce: 0.75, chromeSalt: 0.85, gildvein: 0.90,
      emberglass: 0.85, voidPlatinum: 0.95, wakeglass: 1.00,
    },
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
  // Wave 7: band 3. The convergence heading ends here. One keeper, no patrols,
  // the sparsest cast in the rim — the Hush is where the silence was going.
  hush: {
    id: 'hush',
    name: 'The Hush',
    faction: 'hollow',
    worldSeed: 131,
    chart: [980, 800],
    sunColor: 0x6a5a7a,
    sunRadius: 34,
    planetCount: 1,
    station: { name: 'Threshold', position: [260, 40, 420], palette: 0x5a4a6a },
    field: { center: [-350, -50, -280], radius: 90, count: 45, oreMult: 2.5 },
    gates: [
      { position: [0, 80, -1150], to: 'hollowreach' },
      { position: [750, 90, -350], to: 'verge' },
      { position: [-780, 85, 180], to: 'veil' },
    ],
    // Band 3: hard ore underfoot, and emberglass keeps the lamps lit.
    priceBase: {
      provisions: 1.9, refinedMetals: 1.3, restrictedComponents: 0.55, rawOre: 0.85, livingRock: 0.6,
      slagIron: 0.75, brineIce: 0.70, chromeSalt: 0.80, gildvein: 0.85,
      emberglass: 1.15, voidPlatinum: 0.80, wakeglass: 0.85,
    },
    cast: { traders: 1, pirates: 2, patrols: 0, ace: false },
    tradesRestricted: true,
    band: 3,
    landmarks: [
      { id: 'th_lanes_end', name: "The Lane's End", kind: 'beacon', position: [-650, 120, 300], line: "The Shepherd's broadcast ends here, at a second beacon answering it across everything between. Someone built a lane to nowhere — or to this." },
      { id: 'th_first_garden', name: 'The First Garden', kind: 'monument', position: [500, -140, -500], line: 'The stones from Hollow Reach were not taken rimward. They were brought home. The garden here is older — and it is not empty.' },
      { id: 'th_veil', name: 'The Veil', kind: 'anomaly', position: [680, 70, 780], line: 'A lens hangs in the hush that is not a gate. It does not open. It waits for a heading no chart yet carries.' },
    ],
    clues: [
      { id: 'th_c_keeper', position: [100, -60, -150], line: "The Threshold's keeper logs every arrival in two columns. The second column is arrivals that have not happened yet." },
      { id: 'th_c_song', position: [-250, 180, 550], line: 'Out here the answer is louder than the song. She has stopped leading the duet.' },
    ],
  },
  // Wave 8: band 4. Past the Hush, the authored space ends in a place, not
  // an answer. One keeper gone quiet, one pirate, no one else.
  verge: {
    id: 'verge',
    name: 'The Verge',
    faction: 'hollow',
    worldSeed: 151,
    chart: [850, 830],
    sunColor: 0x4a3a5a,
    sunRadius: 28,
    planetCount: 1,
    station: { name: 'The Vigil', position: [180, 30, 360], palette: 0x4a3a5a },
    field: { center: [-300, -40, -240], radius: 80, count: 35, oreMult: 3.0 },
    gates: [{ position: [0, 90, -1250], to: 'hush' }],
    // The terminus. Wakeglass is native here, so it is worth least where it
    // grows — HERMIT's ×1.25 scarcity multipliers ride on top of these.
    priceBase: {
      provisions: 2.2, refinedMetals: 1.4, restrictedComponents: 0.5, rawOre: 0.8, livingRock: 0.5,
      slagIron: 0.70, brineIce: 0.65, chromeSalt: 0.75, gildvein: 0.80,
      emberglass: 1.05, voidPlatinum: 0.70, wakeglass: 0.70,
    },
    cast: { traders: 0, pirates: 1, patrols: 0, ace: false },
    tradesRestricted: true,
    // Wave 9: hermit economy — no traders ever come; see HERMIT.
    hermit: true,
    band: 4,
    landmarks: [
      { id: 'vg_choir_stones', name: 'The Choir Stones', kind: 'monument', position: [600, 110, -400], line: 'When your ship sings, the stones answer — a half-beat late, in a chord with more notes than there are stones.' },
      { id: 'vg_unfinished', name: 'The Unfinished', kind: 'anomaly', position: [-550, -200, 500], line: 'Not a wreck, not a station, not a song. Whatever the correspondence was building toward, it has not finished becoming it — or it has, and this is what it looks like from outside.' },
    ],
    // MANDATORY empty: keeps the authored clue count at 6 so CONVERGENCE
    // (cluesNeeded 3) and DEEPENING (cluesNeeded 5) math and the wave-7
    // comments stay true. The mystery chain stops at 'The Answer' — the
    // Verge is the non-verbal continuation, a place, not an explanation.
    clues: [],
  },
  // Wave 94: Unknowables origin. Band 3, gated from the Hush. Empty clues
  // so the authored mystery count stays 6 (verge precedent).
  veil: {
    id: 'veil',
    name: 'The Veil',
    faction: 'unknowables',
    worldSeed: 173,
    chart: [890, 640],
    sunColor: 0x4a5a8a,
    sunRadius: 30,
    planetCount: 1,
    station: { name: 'The Quiet', position: [220, 24, 380], palette: 0x404c77 },
    field: { center: [-320, -40, -260], radius: 80, count: 40, oreMult: 2.2 },
    gates: [{ position: [0, 80, -1100], to: 'hush' }],
    priceBase: {
      provisions: 1.9, refinedMetals: 1.3, restrictedComponents: 0.55, rawOre: 0.85, livingRock: 0.6,
      slagIron: 0.75, brineIce: 0.70, chromeSalt: 0.80, gildvein: 0.85,
      emberglass: 1.15, voidPlatinum: 0.80, wakeglass: 0.85,
    },
    cast: { traders: 0, pirates: 0, patrols: 0, ace: false },
    band: 3,
    landmarks: [],
    clues: [],
  },
};
