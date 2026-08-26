# Wave 123 remaining PHY leftover after PHY-05 notes

**Verdict:** leftover **CONSUME**. Name: **no remaining PHY leftover.** Named serial: **none**.

## Method

- Graph resolve (`graph-engineering__graph_resolve`): `proceed_unmodeled` (`r-mt93mj1s-24baf0c0`). Did **not** `graph_approve` / `graph_propose`. Draft workflows non-binding.
- Read live `src/game/physics.js` PHY table (not `src/systems/physics.js`).
- Read `collision.js` bag / torus / sunZone / `resolveMover`.
- Read `ship.js` player bounce + sun strip.
- Read `npc.js` two-sample, frame hold, bounce, appendSun, loiter ring.
- Read `world.js` patrol author / `healPadHome` / `holdClassFor` / `recordPosition`.
- Read `traffic-feel.js` `writeStationHold`; `traffic.js` spawn.
- Read `combat.js` impact + sun heat/kill; `hud.js` toasts.
- Read `save.js` `WORLD_FIELDS`; `state.js` no PHY keys.
- Cite boot WAVE53 / WAVE58 / WAVE110. WAVE109 PHY-04 named log **absent**; kernel-pins still pin mid-sample.
- Honor: Phy04 / Phy05 briefs, wishlist Initiative PHY, Owner Wave 112 collision curve — cite, do not edit.
- Code wins over stale “not full path planning” as leftover.
- Domain is **data**. Did **not** start Vite or Chrome. Did **not** claim ports. Did **not** run `npm run test:boot`.

## Why CONSUME

Named slices already live:

- PHY-01 bounce/slide (`resolveMover`, `bounceLive`, player integrate).
- PHY-02 Wave 58 station/gate keep-out + authored holds.
- PHY-04 two-sample 20 u mid + frame hold; no navmesh.
- PHY-03 sun heat then lethal `sunKill`.
- PHY-05 patrol heavy hold + persist heal on existing `record.route`.

Owner-omitted / skippable (not leftover):

- Navmesh / A* / NPC `planApPath`.
- PHY-04 PR3 far 80 u.

Example REAL holes are **false**:

- Pad-center after save: `station.clone()` gone; `healPadHome` includes patrol; WAVE110 `oldPadHeals`.
- Sun lethal missing: `combat.js` zone 2 + `sunKill`.

Rejected as invented work: hub collision pip, PHY keys on `state.js`, new persist key, impact/sun retune, pirate/ace pad rewrite, WAVE109 PHY-04 boot-log invention.

## This pack

Markdown only:

- `docs/Phy06RemainingPhyDesign.md`
- `out/w123/phyrest/**`

No `src/`. No `scripts/`. No `PROGRESS.md`. No wishlist edit. No sibling docs. No `docs/OwnerDecisionsWave123.md`. Did not steal `out/w123/astrest/**`, `out/w123/fxrest/**`, `out/w122/**`.

## Reviews

- Security: self-applied auditor + security-review.md. No CRITICAL/HIGH. Re-review after lock: clean.
- Code/design-doc: self-applied code-review.md + reviewer persona. No Blocker/Major. Minors accepted (stale wishlist “not full path planning”; missing named WAVE109 PHY-04 boot log).
- UI: self-applied ui-audit.md. No Blocker/Major. Specified later UI is live bounce/heat/avoid; CONSUME adds none.

## Processes

Started none. No Vite. No Chrome. No CDP.

## Coupling for orchestrator

Do **not** implement. Sibling AST/FX own other leftover packs. NAV/TGT/AP/MATCH are cite-only. Serial PR1 does not exist. Graph resolution id `r-mt93mj1s-24baf0c0`.
