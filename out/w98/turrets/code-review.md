## Code Review: Wave 98 NPC turrets owner close

### Summary
Markdown-only owner close. Inventory re-grepped live post-Wave-83 code. Contract replaces Wave 97 default-off with the named Q1/Q2 gate. Wave 68 player `auto` and Wave 83 darts stay complete. Live `src/` still has zero turret `npcFire`. That is correct. No Blocker / Major.

**Persona:** reviewer (`bundled/skills/shared/personas/reviewer.md`).  
**Method:** self-applied `orchestrator/references/code-review.md` (design-doc review: contract vs live code, no fanfic).  
**Date:** 2026-08-23.

### What's done well
- Code wins: `WEAPONS.turret` reuse is proven (`state.js` 135–138; `combat.js` 1298–1320). No new catalog invention.
- Q1 matches live `MOUNT_TABLE` + `mayHuntPlayer` (`state.js` 66–72; `npc.js` 1083–1091). Cutter-pirate seat 0 is live, not fanfic.
- Q2 matches Wave 83 dart slice: explicit `target: 'player'`; missing target drops (unlike ace cannon omit at `npc.js` 1923).
- Hangar `ctx.world.turret` cites re-grepped (`hangar.js` 458, 523, 637, 684). Wave 97 `hangar.js` 271 is stale; this pack does not copy it.
- Sibling TGT-03 / radar paths are out of write-set. No `Incoming fire.` copy here.
- Digit 0/8/9, hangar, HUD glass, chaff, power ledger, `state.js` READ-ONLY, no UU/standing/fire-percent are frozen.

### Findings

#### 🟡 Minor: Cadence is a named pin, not live code
**Location:** `out/w98/turrets/shared-contract.md` §3.2; `docs/OwnerDecisionsWave98.md` cadence table  
**Issue:** Independent clock at 0.5× turret ROF is a named pin for a later serial. Live `src/` has only `NPC_FIRE_INTERVAL` from cannon ROF (`npc.js` 89).  
**Suggestion:** Impl PR1 must not fire turrets from the cannon clock. Status: **already no live turret clock**. Justification: copy Wave 97 pin; do not invent a percent.

#### 💡 Suggestion: Face cone
**Location:** contract §4.2 step 7  
**Issue:** NPC cannon uses `FIRE_FACE_DOT` 0.92 (`npc.js` 96). Player turret uses `CONVERGE_DOT` 0.72 (`combat.js` 182).  
**Suggestion:** Later impl uses the NPC face pin already named. Do not mix both in the same PR.

### Passed
- [x] Owner file + merge law + inventory exist
- [x] Q1/Q2 no longer unpicked
- [x] Default-off replaced by named who / vsPlayer gate
- [x] No `src/` in write-set
- [x] Freeze: no aim-glass gauge, Digit 0/8/9 player-only, no invented percent/UU/standing
- [x] Explicitly supersedes NpcMissiles “no NPC auto turret” for a later serial only
- [x] Does not edit `docs/NpcMissilesDesign.md` / `docs/Shp03WeaponsDesign.md`
- [x] Does not reopen missile Q1/Q2
- [x] `state.js` unread as write this wave; later default no write
- [x] Inventory does not claim fire shipped
