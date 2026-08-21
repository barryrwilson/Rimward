## Security Review: REP-04 kill attribution (`src/game/kill-standing.js`, `src/systems/npc.js`)

### Risk Level: Low

### Summary
Fail-closed helper. `KILL_STANDING_DELTA` is `null`, so the write and `commLine` paths do not run. Witness, faction, and bag keys use own-property checks. No new persist field. One `handleDestroyed` call site.

Audit method: self-applied `security-auditor` persona plus `security-review.md` checklist. Focus: proto keys, `reputation[userString]`, XSS via `commLine`, persist keys, double-write.

### Findings

No open CRITICAL or HIGH items after the own-key hardening.

#### 🟢 LOW: `commLine` template is dormant
**Location:** `src/game/kill-standing.js:69-77,125`
**Issue:** The write branch emits `commLine` with `FACTIONS[faction].name`. That branch is unreachable while the delta is `null`.
**Impact:** None today. After an owner integer, HUD still assigns toast text with `textContent` (`src/systems/hud.js:924`).
**Fix:** Keep Digit 9 silent until a real write. Do not add `innerHTML`.
**Status:** accepted — emit is gated on a finite delta and an allowlisted name; control chars in `name` abort the emit.

### Passed Checks
- [x] No `crimeScore` / `wanted` / `world.crimes` / `world.kills` persist field
- [x] `KILL_STANDING_DELTA` is a module const, not a `WORLD_FIELDS` key
- [x] No `reputation[userString]`; write uses allowlisted `faction` after `canWriteRep` + `Object.hasOwn(FACTIONS, key)` + `standingRead`
- [x] Reserved ids and `'__proto__'` skip; `'independent'` skips
- [x] Inherited `faction` / `role` / `classKey` / `lastAttacker` / `destroyed` do not count (`Object.hasOwn`)
- [x] No `'reputationChanged'`
- [x] No `innerHTML`
- [x] One `applyPlayerKillStanding(` call in `npc.js`; none in `combat.js`
- [x] `handleDestroyed` runs after `deathHandled = true` (loop and backstop), so combat emit + npc backstop cannot double-write
- [x] Restore proto bags still heal via live `sanitizeReputation` (not rewritten)
- [x] HUD `commLine` path is `textContent`

### Recommendations
1. When the owner sets a finite delta, keep `commLine` on the existing toast `textContent` path.
2. Do not add a Digit 9 kill sentence until that write is live.
