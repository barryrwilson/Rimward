# RIMWARD Web — Cross-Session Progress Tracker

Source of truth for what is built vs. planned. Update at the end of every wave.
Goal doc: `rimward-game-elements-omp.md` (NOTE: file on disk is TRUNCATED — only
§25–29 survived; §26 priority ladder and §29 product test are the steering inputs).

## Priority ladder (goal doc §26) — status

| # | Harness | Status |
|---|---------|--------|
| 1 | Flight toy (steer/throttle/strafe/drag/chase cam/afterburner/drift) | DONE (wave 1) |
| 2 | Readable duel (projectiles, lead, screen/shell, disable, one hostile) | DONE (wave 1) |
| 3 | Fear encounter (resolve, telegraphs, surrender, jettison, scoop, restraint econ) | DONE (wave 1: hail.js, npc.js resolve bands, ransom/tribute) |
| 4 | Small living system (traffic identities/routes, market, incidents, persistence, aftermath) | DONE (wave 1: world.js, save.js, witness rule) |
| 5 | Sandbox in miniature (trade, mine, pirate, hunt, serve, dock, buy/sell, rep/fear) | DONE (wave 1: mining, bounty/patrol/haul jobs, restricted locker) |
| 6 | Neighborhood (one authored system worth learning) | DONE (wave 2: freehold + veridian, jump gates, migration) |
| 7 | Broader world (more systems, factions, contacts, jobs, event variety) | DONE (waves 3-4: 3 systems, gate network, contacts/ranks, 5 job kinds, 6 event kinds) |
| 8 | Rimward journey (distance bands, sparse travel, mystery clues, landmarks, silence) | NOT STARTED |
| 9 | Living companion (visual/emotional/parity targets) | PARTIAL (bio.js mood/wounds/song exist wave 1; parity pass pending) |
| 10 | Content and polish (faction epics, origins, audio, visuals, accessibility, onboarding) | NOT STARTED |

## Wave 3 scope (this round)

- Gate network: `SYSTEMS[id].gates = [{position, to}]` replaces single `.gate`.
- Third system: `redmarch` ("The Redmarch"), home of the Red Ledger faction,
  connected veridian ↔ redmarch. Open restricted-component trade, pirate-heavy cast.
- Job variety: bounty on named pirates (reuses witness-rule incident claim).
- World-event variety: 2 new event kinds with market pressure.
- Boot test: third-system jump chain + new content checks.

## Architecture contracts (do not break)

- `src/core/ctx.js` header = ownership rules + frozen event vocabulary.
- `src/game/state.js` = all tuning/data; positions plain `[x,y,z]` (JSON-safe).
- world records/incidents/aftermath/markets must stay JSON-plain (save.js).
- Per-system content rebuilds on `'systemLoaded'` (solarsystem, asteroids, station, gate).
- Verify with `npm run test:boot` (headless harness, must end BOOT TEST PASS).
- Systems init order in main.js is load-bearing (comment explains).

## Wave history

- Wave 1 (commit f472903): full baseline — flight, combat, resolve/fear, traffic,
  market, jobs, bio companion, save, HUD. Boot test passing.
- Wave 2 (in f472903): second system, gate/jump, migration, per-system rebuilds.
- Wave 3 (commit 4d9c3af): gate network (SYSTEMS.gates[]), third system The Redmarch
  (Red Ledger home, open restricted trade), bounty-pirate jobs, pirate record
  bounties, convoySurge + oreRush events, migration over random gate. Boot test
  extended to 3-system jump chain. PASS.
- Wave 4 (commit e8b7342): contacts (src/game/contacts.js — 6 named station NPCs,
  trust/favors/witness-rule rumors/recognition lines, persisted via WORLD_FIELDS),
  RANK_LADDER + rankFor, station 'people' service, fence favor opens freehold
  restricted locker per-session, fixer markup on restricted sales, ferry job
  (350, fronted consignment) + recovery job (300, wreck salvage pod).
  Boot test wave-4 section drives real dock/UI/DOM paths. PASS.

## Next round candidates (wave 5)

- Ladder #8 Rimward journey: distance bands, sparse travel, mystery clues,
  landmarks, designed silence. NOTE: goal doc §1-24 truncated — band/mystery
  specs must be derived from glossary + §29 product test or a restored doc.
- Ladder #9 bio companion parity pass (visual/emotional targets vs mechanical ships).
- Polish debt: none known; boot test is the gate.
