## Security Review: NAV-10 docking approach leftover integrator

### Risk Level: Medium (later PR1) / Low (this markdown wave)

### Summary

Wave 130 lands markdown only. Trust boundary is later HUD copy plus any governor/Agent/persist cheat on dock. HIGH/CRITICAL items are frozen in merge law: `textContent` only, no Agent `act dock`, no persist mute, no pause, no bounce-off, no teleport past 2× snap. No HIGH/CRITICAL remain open in this pack.

### Findings

#### 🔴 CRITICAL

None after freeze.

#### 🟠 HIGH: XSS via cue HTML — **resolved in freeze**

**Location:** later `hud.js` prompt / SPD lamp; live prompt `hud.js` **2591–2594** `textContent`; grep `innerHTML` in `hud.js` = 0  
**Issue:** A later SLOW line that used `innerHTML` / `insertAdjacentHTML` (especially if a station name were interpolated) would execute a tampered save name.  
**Impact:** script in the HUD prompt.  
**Fix (frozen):** contract §0.4 / §0.14: `innerHTML` forbidden; authored literals; `textContent` / `el()` only. PR1 copy does **not** require a station name.

#### 🟠 HIGH: Agent cheat dock — **resolved in freeze**

**Location:** live `agent-api.js` **129–150** unknown; `docs/AgentApiDesign.md` dock = in-range pulse  
**Issue:** A NAV-10 PR that implemented `act({ name: 'dock' })` without `U.DOCK_RANGE` / 2× snap would warp to the pad.  
**Impact:** off-keyboard teleport; range cheat.  
**Fix (frozen):** contract §0.12: do not claim `agent-api.js`; do not add `act dock`. Existing human snap only.

#### 🟠 HIGH: Persist god-mode bounce-off / SLOW mute — **resolved in freeze**

**Location:** `state.js` WORLD_FIELDS (read-only honor); `save.js` **80**  
**Issue:** Persisting “no station bounce while approaching” or “never show SLOW” would let a hostile save hush or ram-invuln.  
**Impact:** owner-looking mute / collision cheat.  
**Fix (frozen):** persist **none**. No new WORLD_FIELDS. PHY-01 stays. No localStorage key.

#### 🟠 HIGH: Overlay pause / unknown overlay — **resolved in freeze**

**Location:** `overlay-policy.js` **4**  
**Issue:** Cue handling that wrote `flags.paused` would freeze the sim (CTL-02).  
**Impact:** pause desync; berthHold confusion.  
**Fix (frozen):** never write `paused`; missing pose skip extra SLOW; title/settings already skip KeyJ pulse.

#### 🟠 HIGH: Teleport past 2× snap / bounce-off — **resolved in freeze**

**Location:** `station.js` **6323–6328**; `ship.js` **907–939**  
**Issue:** Extending snap, skipping `resolveMover` whenever `inZone`, or warping to the pad would be a position cheat.  
**Impact:** skip PHY damage and ram economy.  
**Fix (frozen):** snap stays 2×. Bounce stays. PR1 is HUD only.

### Passed Checks

- [x] No secrets in this pack (markdown only)
- [x] No new persist / localStorage
- [x] No `innerHTML` freeze
- [x] No Agent dock pulse
- [x] No credit / position writers claimed in PR1
- [x] Authored literals; prototype-safe
- [x] Fail-closed never-throw
- [x] PHY-01 not claimed
- [x] REDMARCH flake not “fixed”
- [x] Browser workflow not executed (owner: no Vite / Chrome / CDP)

### 🟡 MEDIUM: Inbox 20 u/s vs live creep 30

**Location:** `state.js` **38**; contract §0.1  
**Issue:** Cue says under 20; light creep is 30. A later author might write `state.js` to “make the cue honest.”  
**Fix applied:** `state.js` READ-ONLY; fullStop already zeros; cue is a warn. Documented, not a persist/credit path.

### 🟡 MEDIUM: Optional PR2 tap-clamp as silent speed cheat

**Location:** contract §3 optional PR2  
**Issue:** A clamp that also skipped bounce without docking would be invuln.  
**Fix applied:** PR2 (if ever) clamps **then docks** on existing KeyJ tap; must not rewrite PHY-01. Default skip.

### 🟢 LOW: MATCH token overwrite is a false state, not XSS

**Location:** `hud.js` **386** `textContent` `MATCH`  
**Issue:** Reusing the MATCH node for SLOW would lie about match-speed. Authored literals, not save strings.  
**Justification:** Frozen as a **code/UI Major**, not XSS. Contract forbids MATCH reuse.

### 🟢 LOW: Station name not in PR1 copy

**Location:** live prompt `'Dock'`  
**Issue:** Inbox example is speed, not a named pad. HOME already names the station (HUD-06).  
**Justification:** avoid interpolating save-backed names into a new string. Subject of this leftover is speed.

### Recommendations

1. PR1: authored literals; `textContent`; write-on-change.
2. PR1: grep `innerHTML` / `act({ name: 'dock'` in the write-set before merge.
3. Do not persist approach preference. Do not skip bounce.
