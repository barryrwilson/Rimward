## Security Review: Wave 104 REP-05 covering + inbound jump refuse

### Risk Level: Low

### Summary
Covering and jump refuse stay fail-closed on proto keys, reserved ids, and missing standing. Authored `commLine` strings only. No new persist field. No `innerHTML`. vsPlayer covering does not lock the player.

### Findings

#### 🟡 MEDIUM: Exported jump skip Set is mutable
**Location:** `src/game/jump.js:13`
**Issue:** `JUMP_REFUSE_SKIP` is a live `Set`. Same-process code can `.add` or `.delete` flags.
**Impact:** A later module could drop `independent` from the skip set and lock hush dests. This is not a user-input path today.
**Fix:** Treat the set as contract data. Do not mutate it. A frozen map with `Object.hasOwn` is optional later.
**Status:** open (documented; no user-facing exploit)

#### 🟢 LOW: Arrival hail still indexes `FACTIONS[def.faction]` without `hasOwn`
**Location:** `src/game/jump.js:170`
**Issue:** Pre-existing arrival path. Wave 104 refuse path uses `Object.hasOwn(FACTIONS, fac)` first.
**Impact:** None on the refuse gate.
**Fix:** Out of scope. Do not retouch arrival copy this wave.
**Status:** open (pre-existing)

### Passed Checks
- [x] No secrets in code
- [x] `standingRead` for covering and jump refuse (never `standingOf`)
- [x] `Object.hasOwn(SYSTEMS, to)` / `Object.hasOwn(SYSTEMS, id)` before dest/current faction read
- [x] `Object.hasOwn(FACTIONS, fac)` before lock/cover
- [x] Reserved / proto bag → standing 0 → no covering, no refuse
- [x] No `innerHTML` on covering, jump refuse, or npc hooks
- [x] `commLine` text is authored literals (`Patrol covering.`, `No passage.`)
- [x] Covering latch and jump-refuse latch are module memory; reset on `systemLoaded`; not `WORLD_FIELDS`
- [x] No `wanted` / `crimeScore` / `world.locks` / `world.allies`
- [x] vsPlayer: covering targets pirate/ace only; patrols already hunting the player are skipped
- [x] Independent / hollow / unknowables dests do not lock
- [x] Independent / hollow / beautiful / unknowables current flags do not cover
- [x] HUD toast path remains `textContent` (`hud.js` 1130)
- [x] No new `ctx.emit` type

### Recommendations
1. Keep skip flags as contract constants. Do not mutate `JUMP_REFUSE_SKIP`.
2. Digit 9 copy (PR3) must use `textContent` / `h()` if it later prints these lines.

### Method
Self-applied `orchestrator/references/security-review.md` and `shared/personas/security-auditor.md`. Focus: proto keys, standingRead vs standingOf, innerHTML, dest hasOwn, no persist latch, vsPlayer never.
