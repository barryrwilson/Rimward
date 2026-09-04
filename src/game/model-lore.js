/**
 * Model lore — read-only strings transcribed from docs/FactionShipDesignBible.md.
 *
 * RW-010 (RW-003 PR3). This module is DATA ONLY: frozen objects, plain
 * strings, no functions, no colours, no tuning numbers. Nothing here is
 * persisted, so `save.js` WORLD_FIELDS is untouched and `state.js` stays
 * READ-ONLY. Charter numbers are NEVER copied here — scale text is computed
 * from `SHIP_SCALE` / `ship-scale.js` at render time so the size charter
 * remains the single source of truth.
 *
 * Provenance, per block:
 * - FACTION_LORE — the `**First read:**` lines of bible §4.1-§4.10 (the Ten
 *   Banners), plus §5.1 and §5.2 section-heading subtitles
 *   ("Independent — every ship has a previous life", "Hollow Reach — the last
 *   watch in the dark"), which are authored and read the same way. 12 entries.
 * - SHIP_ROLE_NAME — the role name after the em dash in the §4.1-§4.10 class
 *   bullets (`- **Light — claim scout:** …`). §5.1/§5.2 bullets carry no role
 *   name, so Independent and Hollow Reach have none and the summary card
 *   omits that line for them (design §5.2: never an empty labelled line).
 *   10 factions x 6 classes = 60 entries.
 * - CLASS_GRAMMAR — bible §3 "Shared class grammar", one string per class.
 *   6 entries. Reference-surface dataset; the §5.2 card does not render it.
 *
 * Every read site guards with `Object.hasOwn` and falls back to `''`, so a
 * missing key renders a shorter card and never throws.
 */

export const FACTION_LORE = Object.freeze({
  // §4.3 Freehold Compact
  freehold: Object.freeze({
    firstRead: 'maintained by neighbors, repaired for decades, useful before beautiful, warm without being quaint.',
  }),
  // §4.1 Veridian Combine
  veridian: Object.freeze({
    firstRead: 'calm corporate authority, survey precision, modular extraction hardware.',
  }),
  // §4.4 Red Ledger
  redledger: Object.freeze({
    firstRead: 'captured hardware reorganized into a deliberate predatory machine.',
  }),
  // §4.2 Ferrous Hegemony
  ferrous: Object.freeze({
    firstRead: 'disciplined military mass, exact symmetry, protected citizens behind a hard line.',
  }),
  // §4.5 Gilded Chain
  gilded: Object.freeze({
    firstRead: 'reptilian auction-house elegance, sealed and controlled.',
  }),
  // §4.9 Congregation of the Further Shore
  congregation: Object.freeze({
    firstRead: 'practical frontier vessel shaped by sacred orientation and disciplined ritual.',
  }),
  // §4.8 The Assembly
  assembly: Object.freeze({
    firstRead: 'ancient survey machinery, recursive self-similarity, copy errors that accumulated into lineage.',
  }),
  // §4.10 Lamplighter Guild
  lamplighter: Object.freeze({
    firstRead: 'rugged infrastructure, replaceable parts, access to everything, tools before weapons.',
  }),
  // §5.1 Independent — section-heading subtitle (no `First read:` line)
  independent: Object.freeze({
    firstRead: 'every ship has a previous life',
  }),
  // §5.2 Hollow Reach — section-heading subtitle (no `First read:` line)
  hollow: Object.freeze({
    firstRead: 'the last watch in the dark',
  }),
  // §4.6 The Beautiful Ones
  beautiful: Object.freeze({
    firstRead: 'majestic animal intelligence, tenderness, breath, and self-directed motion.',
  }),
  // §4.7 The Unknowables
  unknowables: Object.freeze({
    firstRead: 'a coherent traveling energy configuration carrying real physical energy cells.',
  }),
});

export const SHIP_ROLE_NAME = Object.freeze({
  // §4.3 Freehold Compact
  freehold: Object.freeze({
    light: 'family runabout',
    ace: 'local legend',
    cutter: 'lane-keeper',
    heavy: 'militia monitor',
    frigate: 'convoy keeper',
    freighter: 'mobile homestead',
  }),
  // §4.1 Veridian Combine
  veridian: Object.freeze({
    light: 'claim scout',
    ace: 'patent demonstrator',
    cutter: 'inspection launch',
    heavy: 'claim-enforcement ship',
    frigate: 'survey command frigate',
    freighter: 'extraction carrier',
  }),
  // §4.4 Red Ledger
  redledger: Object.freeze({
    light: 'account runner',
    ace: 'collector',
    cutter: 'boarding talon',
    heavy: 'tribute raider',
    frigate: 'clan command ship',
    freighter: 'tribute barge',
  }),
  // §4.2 Ferrous Hegemony
  ferrous: Object.freeze({
    light: 'picket',
    ace: 'honor interceptor',
    cutter: 'patrol launch',
    heavy: 'bastion gunship',
    frigate: 'line escort',
    freighter: 'fleet logistics carrier',
  }),
  // §4.5 Gilded Chain
  gilded: Object.freeze({
    light: 'catalog courier',
    ace: 'acquisition duelist',
    cutter: 'customs acquisitor',
    heavy: 'collection hunter',
    frigate: 'pavilion escort',
    freighter: 'catalog ark',
  }),
  // §4.9 Congregation of the Further Shore
  congregation: Object.freeze({
    light: 'pilgrim courier',
    ace: 'visionary pathfinder',
    cutter: 'refuge launch',
    heavy: 'wardship',
    frigate: 'pilgrimage escort',
    freighter: 'wandering basilica',
  }),
  // §4.8 The Assembly
  assembly: Object.freeze({
    light: 'daughter probe',
    ace: 'divergent surveyor',
    cutter: 'contact probe',
    heavy: 'replication defender',
    frigate: 'archive surveyor',
    freighter: 'foundry lineage',
  }),
  // §4.10 Lamplighter Guild
  lamplighter: Object.freeze({
    light: 'service skiff',
    ace: 'outage runner',
    cutter: 'relay tender',
    heavy: 'gate tug',
    frigate: 'network repair ship',
    freighter: 'mobile gate yard',
  }),
  // §5.1 Independent — bullets carry no role name; the card omits the line.
  // §5.2 Hollow Reach — bullets carry no role name; the card omits the line.
  // §4.6 The Beautiful Ones
  beautiful: Object.freeze({
    light: 'young wayfinder',
    ace: 'swift-bonded hunter',
    cutter: 'guardian',
    heavy: 'shieldback',
    frigate: 'elder guardian',
    freighter: 'gardenback migration vessel',
  }),
  // §4.7 The Unknowables
  unknowables: Object.freeze({
    light: 'mote',
    ace: 'fast knot',
    cutter: 'exchange lattice',
    heavy: 'compression manifold',
    frigate: 'chorus field',
    freighter: 'energy procession',
  }),
});

export const CLASS_GRAMMAR = Object.freeze({
  // §3 "### Light"
  light: 'One- to small-crew vessel. Minimal duplicated systems, one obvious cockpit/sensor focus, and no fake capital-ship decks. It should feel nimble even when parked.',
  // §3 "### Ace"
  ace: 'A named pilot\u2019s or exceptional lineage\u2019s craft. Use a cleaner profile, larger propulsion or control surfaces, tighter panel fit, and one memorable signature feature. Avoid random spikes and avoid simply adding more guns everywhere.',
  // §3 "### Cutter"
  cutter: 'A working ship that can catch and interact with small traffic. Its boarding collar, tractor gear, rescue lock, inspection bay, or faction-equivalent must be visible near the bow or midships.',
  // §3 "### Heavy"
  heavy: 'A dense, durable escort or specialist combat ship. Concentrate armor and weapons around a compact core. It should look capable of taking hits without becoming a scaled-down frigate.',
  // §3 "### Frigate"
  frigate: 'The smallest true command/capital silhouette: bridge or command sensor focus, redundant systems, point-defense coverage, and one small craft or rescue capacity. It is long enough to have decks and operational zones, but still much smaller than a freighter.',
  // §3 "### Freighter"
  freighter: 'A bulk-moving machine or organism. Cargo volume dominates propulsion and crew volume. Give it several independently readable sections and exterior berthing geometry. It should look unable to enter a station because of both size and awkward service structures\u2014not because a label says so.',
});
