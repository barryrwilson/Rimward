# Security Review: AI-05 PR1 death remaining countdown (`src/systems/npc.js`)

### Risk Level: Low

### Summary

Death calm is session remaining `deathCalmLeft`, ticked by finite `dt`. It does not compare to `world.time`. A save restore that rewinds time cannot stretch calm. Hop tamper still fail-closes remaining > 180 s to 0. No CRITICAL or HIGH.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Mode: deep on timer tamper, persist, rewind, prototype maps, XSS.

## Security Audit: `src/systems/npc.js` starter grace

### Summary

Overall risk: **low**. Death remaining is module session state. It is not a persist key. Hop read still uses `graceUntilOrZero`.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟡 MEDIUM: Patrol hop reads stay unclamped

- **Severity**: medium (pre-existing on patrol path; PR1 did not extend clamp)
- **Category**: persist tamper
- **Location:** `src/systems/npc.js` patrol acquire `now >= (ctx.world.jumpGraceUntil ?? 0)`
- **Description:** Pirate hunt / demand / duel use `hopGraceUntilNow` → `graceUntilOrZero`. Patrol player-hunt still uses raw `?? 0`. A huge `jumpGraceUntil` still mutes patrol acquire.
- **Impact:** Hostile save can still mute standing-based patrol hunt. Not Greenhand playtest. Pirates/aces resume immediately on hop tamper (fail closed).
- **Reproduction:** Save `jumpGraceUntil` = `1e20`. Patrol with standing ≤ −10 will not acquire. Pirate/ace helper is false at now 200 / 380 / 10000 (probe).
- **Remediation:** Out of PR1 write-set. Do not widen helper to patrols in this pack.
- **Status:** accepted — call-site list frozen; document only

#### 🟢 LOW: `world.time` rewind re-opens Greenhand extra

- **Severity**: informational
- **Category**: persist tamper
- **Location:** helper `time < extra`; snapshot `time`
- **Description:** Extra window still reads existing `world.time` + `world.origin` (contract). A full snapshot rewind to 0 re-opens Greenhand 180 s with the rest of the career. Death remaining does **not** stretch on that rewind.
- **Impact:** Extra re-open is a snapshot rewind, not a grace-only god-mode. Death countdown is independent.
- **Reproduction:** Load a snapshot with `time: 0` and `origin: 'greenhand'`. Death remaining still expires after 90 s of `dt`.
- **Remediation:** Keep no new persist key.
- **Status:** accepted — contract tradeoff for extra; death clock is remaining

#### 🟢 LOW: Non-finite or `> 180` remaining fail-closes

- **Severity**: informational
- **Category**: session tamper
- **Location:** `tickDeathCalm` / `deathCalmBlocks` / `clampDeathCalmLeft`
- **Description:** Set path clamps 0..180. Tick path zeros NaN and remaining > 180. Block path requires finite remaining in (0, 180].
- **Impact:** A corrupted module remaining cannot grant forever-safe.
- **Status:** accepted — fail closed toward live AI-04

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `npc.js`
- [x] No new `WORLD_FIELDS` (`deathCalmUntil` / `deathCalmLeft` / `starterGrace` absent from `save.js`)
- [x] Hop `jumpGraceUntil` NaN / Infinity → 0; huge finite (`1e15`) → 0 at now 200, 380, and 10000
- [x] No sliding `Math.min(hopUntil, now + 180)` on read
- [x] Death remaining is not an absolute `world.time` stamp
- [x] Restore rewind still blocks until 90 s of `dt` elapses; then helper is false
- [x] Origin maps: authored keys, `Object.hasOwn` only; no `for-in` on a save blob
- [x] Helper catch → `false`; death apply catch swallows
- [x] `alwaysHuntsPlayer === true` bypasses extra starter only; hop + death remaining still block Dresk
- [x] Scratch path does not call the helper (`playerInterested = true` unchanged)
- [x] `JUMP.graceSeconds` still 60 (`state.js` read-only)

### Positive Observations

- Death calm is session module remaining. A hostile save cannot freeze hunters forever **or** grant forever-safe via a huge hop clock.
- `world.time` rewind cannot stretch death remaining.
- Dresk flag stays a record boolean. No save-authored `starterGraceUntil: Infinity`.
- Telegraph still uses `say` → `commLine` (`textContent` HUD path). PR1 adds no toast chrome.

### Recommendations

1. Keep persist none if PR2 home-berth bubble ships later.
2. Patrol hop fail-closed remains a later optional harden, not this leftover.
