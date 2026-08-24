## Security Review: police leave (`src/game/police-leave.js`, `src/systems/npc.js`)

### Risk Level: Low

### Summary
Leave is a live-only `commLine` with a literal string. Standing uses `standingRead` (NaN / reserved / missing → 0). No persist key, no new frozen event, no innerHTML. Proto-owned role/faction/combat fields are ignored.

### Findings

No 🔴 CRITICAL or 🟠 HIGH findings.

#### 🟡 MEDIUM: Process-global visit latch
**Location:** `src/game/police-leave.js:12-16`, `76-84`
**Issue:** `firedThisVisit` is module-scoped, not keyed to `ctx`. A second `ctx` in the same process shares the latch.
**Impact:** A prior visit in another harness could suppress a leave, or the reverse.
**Fix:** Not required for the live game (one ctx). Optional: store the latch on `ctx.flags` (live-only, not `WORLD_FIELDS`).
**Status:** documented; owner allowed module or flags latch.

### Passed Checks
- [x] No secrets in code
- [x] No persist key (`wanted`, `crimeScore`, `WORLD_FIELDS`, localStorage)
- [x] Standing NaN / non-finite / missing fail closed via `standingRead` → 0 (no leave)
- [x] Reserved ids (`__proto__` and friends) fail closed in `standingRead`
- [x] `currentSystem` indexed with `Object.hasOwn(SYSTEMS, id)`
- [x] System faction indexed with `Object.hasOwn(FACTIONS, fac)`
- [x] Role / faction strings read with `Object.hasOwn` (no proto role = patrol)
- [x] Combat flags (`lastAttacker`, `target`, `intent`) own-property only
- [x] Copy is the frozen literal `Leave this space.` — `ctx.emit('commLine', { text })` only
- [x] HUD toast uses `textContent` (`src/systems/hud.js` `pushToast`); this change does not add innerHTML
- [x] No new frozen event; `src/core/ctx.js` unedited
- [x] Hunt band `<= -10` still uses existing `mayHuntPlayer` / `HOSTILE_STANDING`

### Recommendations
1. Keep the visit latch live-only. Do not add a save key.
2. If a later serial needs multi-ctx isolation, move the latch to `ctx.flags`.

### Re-review
Own-property role / combat reads landed. Probe `live.protoRoleIgnored` and `live.protoFailClosed` PASS. No new HIGH/CRITICAL. Latch remains the documented MEDIUM.
