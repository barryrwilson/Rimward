## Code Review: police leave

### Summary
The leave order matches Wave 93 owner law: local-system-faction patrols, standing (−10, 0), 300 u law zone, once per `systemLoaded`, no persist. Hunt at ≤ −10 is unchanged. Probe `out/w95/police/probe.mjs` covers the acceptance table.

### What's done well
- Logic lives in `src/game/police-leave.js`; `npc.js` only imports and calls `tickPoliceLeave` at the end of `initNpc` update.
- Standing comes from `SYSTEMS[currentSystem].faction` + `standingRead`, not the hull table `standingOf`.
- Mismatched `record.faction` / `state.faction` is ignored.
- Combat skip is per patrol; a second idle local patrol can still warn.
- Channel is one existing `commLine`; HUD already toasts that type.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 🟡 Minor: Docked skip is extra vs the owner table
**Location:** `src/game/police-leave.js:108`
**Issue:** The owner table does not list a docked skip. `flags.docked === true` returns before range/patrol checks.
**Why it matters:** A docked player in the 300 u zone with standing −5 will not hear the line until undock.
**Suggestion:** Keep it. Live flow is undock then fly. It avoids a toast over station UI. Documented, not a contract break.

#### 💡 Suggestion: Dual 300 constant
**Location:** `src/game/police-leave.js:8` and `src/systems/npc.js` `LAW_ZONE_RADIUS`
**Issue:** Radius is duplicated to avoid a circular import (`npc.js` → `police-leave.js`).
**Suggestion:** Probe pins both at 300. Do not export hunt radius from npc into this module.

### Test coverage
- standing −1 / −9 fire once; 0 / −10 / −11 do not
- `mayHuntPlayer` true at −10 / −11, false at −1 / −9
- pirate / ace / trader / miner / Beautiful / Unknowable never
- foreign patrol and state-faction mismatch never
- combat skip; second idle patrol still warns
- `systemLoaded` on `lastEvents` allows a new visit
- save `WORLD_FIELDS` has no new key; restitution 1200 untouched

### Re-review
No Blocker/Major. Docked skip and dual radius stay documented. `node out/w95/police/probe.mjs` PASS.
