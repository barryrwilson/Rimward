## Code Review: Wave 83 NPC missiles

### Summary
Pirates and aces fire one dart after telegraph, then cannon. Combat uses a separate seeker pool (cap 4). Probe pins pass.

### What's done well
- Spawn path is `spawnNpcMissile`, not `spawnNpcShot('missile')`.
- `canNpcDart` is fail closed on role and Unknowable faction.
- Missile tick reuses the bolt `vsPlayer` split.
- Ace cannon still omits `target`; darts always set `target: 'player'`.

### Findings

No Blocker or Major issues.

#### 🟡 Minor: Module-scope player lock
**Location:** `src/systems/combat.js` `_npcPlayerLock`
**Issue:** All NPC darts share one lock wrapper.
**Fix:** Later vs-NPC slice should store lock on the slot.
**Status:** documented

#### 💡 Suggestion: Hunt fire helper
**Location:** `src/systems/npc.js` hunt and duel emit sites
**Issue:** Two copies of the dart-then-cannon branch.
**Fix:** Optional helper later. Two sites keep ace cannon omit-target intact.

### pirateOneDart boot pin (follow-up)
**Root cause:** `updateResolve` runs on the first hunt frame (`resolveAt` starts at 0). Late-boot fear + `rimWithoutGuns` + Ledger `pirateResolveMod` drop a pirate into `bargaining` (no fire). An ace often stays `shaken` and still darts.
**Fix:** WAVE83 `w83spawn` pins personality/resolve and sets `resolveAt` in the future. Cadence law in `npc.js` is unchanged.
**Evidence:** `out/w83/missiles/pirate-cadence.mjs` late-boot-bootspawn: missile then cannon. Probe PASS.

### Verdict
Ready. `out/w83/missiles/probe.mjs` reports WAVE83 PROBE PASS.
