## Security Review: NAV-03 full-route autopilot (Wave 84 design)

### Risk Level: Medium

### Summary

Wave 84 is markdown only. The contract fails closed on the named threats (teleport, stuffed `jumpRequested.to` / `path[1]` mismatch, restore `autopilot: true`, cancel-proof input grab, proto dest ids). Designer UI blockers (hidden MATCH toast, chart-click steer-break) are UX, not new threat classes. Residual risk is impl drift: later PRs must keep `gate.js` as the sole emitter and the restore healer as mandatory.

### Findings

#### 🟡 MEDIUM: `wantJump` latch can fire a frame late into a new zone

**Location:** `out/w84/nav03/shared-contract.md` §4.3; live `gate.js` 558–560 vs tick order `main.js` 105–114  
**Issue:** `dockPressed` is already previous-frame. A latched `wantJump` is the same. If the player (or AP) leaves the routed zone the same frame gate emits, `inZone` is still last position. Live D already has this window.  
**Impact:** At most one extra legitimate jump attempt at zone edge, not a stuffed dest (payload remains `near.to`).  
**Fix:** Keep `inZone && nearTo === nextHop && world.nav.autopilot` on the emit predicate. Do not let `autopilot.js` emit. Impl pins: emit `to` equals live `near.to`.

#### 🟡 MEDIUM: Pause disengage is a cross-module hook

**Location:** contract §5 `pause`; `main.js` 140–167; `title.js` / `origins.js` / `modelsbrowser.js`  
**Issue:** AP cannot observe pause rising from `update()` because the loop is frozen. Missing a `disengage('pause')` call site would resume a flyer after origin/title.  
**Impact:** Surprise stick grab after overlay, not a network exploit. Fail-closed restore still covers save.  
**Fix:** PR3 exports `disengage`; PR list names every `paused = true` writer. Boot pin: set paused with AP on → `autopilot === false`.

#### 🟢 LOW: `commLine` copies dest names from `SYSTEMS`

**Location:** contract §8.3  
**Issue:** Names are authored data, not user HTML. `textContent` only.  
**Impact:** None if impl does not use `innerHTML`.  
**Fix:** Keep `textContent`. Do not print raw save keys that failed `Object.hasOwn(SYSTEMS)`.

No 🔴/🟠 findings in this design pass.

### Passed Checks

- [x] No secrets in design markdown
- [x] No `src/` / `WORLD_FIELDS` second key
- [x] Teleport forbidden; only `jump.js` midpoint moves the ship across systems
- [x] `jumpRequested.to` frozen to live `near.to` (not save dest)
- [x] Restore forces `world.nav.autopilot = false` (owner-confirm default)
- [x] Cancel / input break table required every frame while engaged
- [x] Proto / `RESERVED_IDS` / `Object.hasOwn(SYSTEMS)` on dest ids
- [x] Events primitives only (`emit` spread documented)
- [x] MATCH refuse; no `input.throttle` write
- [x] No `targets.current` write
- [x] AP is not immunity (combat, sun, impact still apply)

### Named threats (task)

| Threat | Disposition |
|---|---|
| Teleport cheat | **Closed.** No AP position write; no `currentSystem` write; jump only via `jump.js` |
| `jumpRequested` from stuffed dest | **Closed.** Sole emitter `gate.js`; `to: near.to`; `nearTo === path[1]` |
| Persist `autopilot: true` smuggle on restore | **Closed.** Healer always false; omit-key = false |
| Input grab that ignores cancel | **Closed.** Break table §5. Chart-open **suppresses steer-break only**. WASD / throttle / afterburner / Cancel still disengage. |
| Proto dest ids | **Closed.** `RESERVED_IDS` + `Object.hasOwn(SYSTEMS)` on `dest` / `path[i]`; never `for…in` merge |

### Recommendations

1. Impl PR1 healer is the security gate for restore smuggle — land it before any flying PR.
2. Impl PR5 must not add a second `emit('jumpRequested')` in `autopilot.js`.
3. Pin stuffed dest / proto id / restore-true in boot tests as named in contract §12.
