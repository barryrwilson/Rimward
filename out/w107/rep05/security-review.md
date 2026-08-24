## Security Review: Wave 107 REP-05 PR3 Digit 9 copy

### Risk Level: Low

### Summary
Digit 9 LIVE CONSEQUENCES now prints three authored live-sim lines through existing `h()` / `textContent`. Faction display names still go through `Object.hasOwn(FACTIONS, key)`. No `innerHTML`. No new persist key, emit type, or Digit bind.

### Findings

No CRITICAL or HIGH issues.

#### 🟢 LOW: Skip-set iteration trusts `JUMP_REFUSE_SKIP` membership
**Location:** `src/systems/station.js:1173-1177`
**Issue:** Notes walk the live `Set` and print `factionDisplayName(key)` only when `hasOwn` succeeds. A same-process mutate of `JUMP_REFUSE_SKIP` could add extra skip names to the pane.
**Impact:** Explain-screen copy drift only. Not a user-input path. `textContent` still blocks markup.
**Fix:** Do not mutate `JUMP_REFUSE_SKIP`. Optional freeze later (out of this PR).
**Status:** open (documented; no user-facing exploit)

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in `station.js` (new notes or renderer)
- [x] `h('div', 'screen-note', panel, lives[i])` uses `node.textContent = text`
- [x] `factionDisplayName` uses `Object.hasOwn(FACTIONS, key)` before `.name`
- [x] Skip keys: empty / non-string skipped; missing FACTIONS name not interpolated as a raw key
- [x] Literal faction keys only (`'freehold'`, `'beautiful'`) plus skip-set values after `hasOwn`
- [x] `__proto__` / `constructor` / `prototype` not used as faction keys in `standingLiveNotes`
- [x] Copy strings are exported authored constants (`POLICE_LEAVE_LINE`, `COVERING_LINE`, `JUMP_REFUSE_LINE`)
- [x] No new `WORLD_FIELDS`, `wanted`, `crimeScore`, persist latch, or `ctx.emit` type
- [x] Digit 0/8/9 bind untouched
- [x] Police-leave / covering / jump **behavior** untouched (copy only)

### Recommendations
1. Keep skip flags as contract data. Do not mutate `JUMP_REFUSE_SKIP`.
2. Keep Standing notes on `textContent` / `h()` / `el()`.

### Method
Self-applied `orchestrator/references/security-review.md` and `shared/personas/security-auditor.md`. Focus: XSS, proto keys, innerHTML, interpolated faction names.
