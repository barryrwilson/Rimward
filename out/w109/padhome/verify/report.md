## Status
CLEAN

## What I tested
Design-only PHY-05 remaining patrol pad-home pack. No `src/` edit by this verifier. No Vite.

Read `docs/Phy05PadHomeDesign.md` and `out/w109/padhome/shared-contract.md` first. Contract is MERGE LAW. Compared inventory line cites to live `src/` and to `HEAD` where PHY-04 sibling moved `npc.js` / `station.js`.

Checked git: this worker did not need `src/`. Did not flag sibling `npc.js` / MSN files. Confirmed the Phy05 pack did not edit `docs/Phy04AvoidDesign.md`, wishlist, `PROGRESS.md`, `OwnerDecisions*`, `src/systems/station.js`, or `src/game/jobs-chains.js`.

Spot-checked: Digit 0/8/9 freeze, no new `WORLD_FIELDS`, no navmesh, no `planApPath` in NPC, no hub pip, no UU/SKU invent, fail-closed never freeze hulls, PHY-04 not restated as this leftover.

Serial plan is named only (PR1 persist heal, PR2 pins, optional PR3 census). No pad-home JS landed.

## Bugs found
None.

Brief and contract agree on leftover (authorship / persist heal, not lookahead). Both files say the contract wins if they disagree.

Live leftover still matches the pack:
- Patrol `route[0]` is `station.clone()` (`src/game/world.js` 381).
- `healPadHome` returns unless role is `trader` or `miner` (`world.js` 705).
- `holdClassFor` falls unknown / heavy to `'light'` (`world.js` 668–673).
- Persist rewrite can live on existing `record.route`; `WORLD_FIELDS` (`save.js` 76–101) has no `padHome` / `holds` key.
- PHY-04 sibling `writeFrameHold` (`npc.js` 762–797) does not assign `record.route`.

Not bugs (sibling / HEAD census):
- Inventory `npc.js` minerHold / tickPatrol / updateLoiter / `_phyOn` cites match `HEAD` (900, 1275, 1500, 2261, 749). Live lines moved after PHY-04 `npc.js` impl. Task: do not flag that sibling.
- Digit 0 handler cite `station.js` 6041–6043 matches `HEAD`. Live handler is 6075–6078 after sibling `station.js` edits. Semantics still Digit 0 shipyard, Digit 8 launch, Digit 9 epics (`DOCK_KEY_SERVICES` 188).

Spec nits (do not fail the pack): contract PR1 writes `writeStationHold(..., holdClassFor, fromPos)`. Live third arg is a class string. Deputize table still says patrol known `classKey` else `'heavy'`. Brief deputize fromPos omits “authored from dest gate”; contract §0.1 has it and wins.

## Environmental issues
`graph_resolve` with `codex/agent-codex` and no namespace returned `blocked_ambiguous` (research / spreadsheet / PDF, coverage ≤ 0.10). A second resolve with namespace `omp` returned `proceed_unmodeled`. Local code is the source of truth. No calendar, CRM, spreadsheet, or PDF tools.

Dirty tree is other workers: `src/systems/npc.js` (PHY-04), `src/systems/station.js` + `scripts/boot-test.mjs` (MSN), `src/systems/ship.js` / `ship-assets.js` (BIO gait), `PROGRESS.md`, wishlist. Not this pack.

No Vite. No browser.

## Evidence
- Merge law: brief field **Merge law** and contract header both say `out/w109/padhome/shared-contract.md` wins.
- Git: `docs/Phy05PadHomeDesign.md` and `out/w109/padhome/*` untracked. `src/game/world.js` / `traffic-feel.js` / `save.js` not in `git status`. `git diff` of wishlist / `PROGRESS.md` / `station.js` / `jobs-chains.js` has no PHY-05 / `healPadHome` / `padHome` hunks. No `docs/OwnerDecisionsWave109.md`.
- Patrol author: `world.js` 374–385, one `station.clone()` in `src/` at 381. Pirate/ace homes are jittered gate.
- Heal skip: `healPadHome` 702–726; role gate 705. Callers `normalizeTraderRecord` 752, `normalizeMinerRecord` 761; `rebuildTransitRegistry` 455–456 trader/miner only; `tickBank` 831–833 trader/miner only.
- Holds: `traffic-feel.js` `STATION_HOLD_PAD` 14, `writeStationHold` 71–102. `PAD_HOME_EPS` 0.5 at `world.js` 666. Cylinder `physics.js` 8–10 r=32.
- Heavy hull: `ship-scale.js` `heavy.target` 17.0 at 131; `hullRadiusFor` = target/2 → 8.5. Authored patrol `classKey: 'heavy'` at `world.js` 378. `CLASS_ORDER` 258 matches contract known-class list.
- Spawn: `recordPosition` 629–643; `traffic.js` 99 `state !== 'enroute'`, 105/117/155 `recordPosition`. `spawnBlocked` is hull-vs-hull (`traffic-feel.js` 128+).
- Live dest: `npc.js` `makeAi` 210–215 loiter for patrol; ring 80–150 at 259. `tickPatrolJob` live 1348 (HEAD 1275). Loiter dest already outside D5; leftover is persist/spawn.
- Persist: `save.js` `WORLD_FIELDS` 76–101 includes `recordBanks`/`records` only. Snapshot 979. Restore 1186–1187 + `healLiveRecords` 1151–1180, 1210 (no pad heal). Autosave `rimward-save-v1` line 66.
- HUD/Digit: `src/systems/hud.js` 709–712 RANGE on `.rw-reticle`; `src/ui/hud.css` 184–193 80 px. Digit 0 = last `DOCK_KEY_SERVICES` (`station.js` 188, HEAD 6041–6043). Outfitting Digit 8/9 comments live 1633–1711.
- Pins: `out/w58/routes/probe.mjs` 95 `src.patrolCenter`; `out/w58/routes/verifier.mjs` 126; `out/w59/routes/verifier.mjs` 199 `leave.patrol.pad`. `scripts/boot-test.mjs` has no `station.clone` grep. WAVE58 `srcHold` 11812; WAVE59 trader/miner 11831–11868. Cast: `authored-systems.js` Freehold 2, Veridian 3, Redmarch 1, Hollowreach/Hush/Verge 0.
- Freeze scan of pack: Digit 0/8/9 must not be stolen; no new Digit; no `state.js` write; no new `WORLD_FIELDS`; no navmesh; no `planApPath` in NPC; no hub pip; no UU/SKU; fail-closed live dest, never `speed = 0`. Serial table names PR1/PR2/PR3 only.
- PHY-04 vs PHY-05: inventory §8 and contract §0.11. Live `writeFrameHold` comment 759–760: “Does not write record.route.”
- `npc.js` grep `planApPath` = 0. `save.js` grep `padHome` = 0.
