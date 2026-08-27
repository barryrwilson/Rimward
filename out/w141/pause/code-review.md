# Code Review: CTL-05 pause menu leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live copy-only `pauseEl` (`main.js` **172**), KeyL open refuse while paused (`save.js` **1625**), and one-way `closeTitle` (`title.js` **251–256**). Contract forbids CONSUME, Settings expansion, overlay-policy pause write, `berthHold` merge, reload-to-title, `innerHTML`, and KeyP remap. No Blocker/Major remain after access-not-expansion, LOAD gate kept, and later write-set limited to `main.js` / title reopen / berth open-from-pause.

### What's done well

- Code-wins inventory with file:line for banner, z 50, KeyP guards, overlay never-write, WAVE118 digit skip, title capture, Settings FIELDS, berth LOAD/SAVE, `berthHold`.
- CONSUME path documented and rejected: live KeyO is not a pause menu.
- Settings expansion inbox **131–135** cited and unclaimed.
- Wave 28 LOAD gate and Wave 40 z ladder frozen before impl.
- CTL-02 / CTL-03 collisions named (never write pause; do not merge hold).
- Partial merge named: buttons that do not open live overlays are a lie.
- Fail-closed skip vs throw named before impl.
- Sibling Onb01 / Org01 / CTL-04 `fireHeld` / pad 2B explicitly unclaimed.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `main.js` **172** vs inbox **217–220**  
**Issue:** KeyO works in-run. That is not the CONSUME test. Pause must already offer Settings, save, **and** title **from the pause surface**. Banner is copy-only. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Copy-only pause — **resolved in freeze**

**Location:** `main.js` **169–187**  
**Issue:** No actions. Frozen: RESUME / SETTINGS / BERTH RECORDS / TITLE as access to **existing** overlays.

#### 🟠 Major: Hidden KeyO as the Settings path — **resolved in freeze**

**Location:** `settings.js` **228–234**; playtest “Settings exist only on the title menu”  
**Issue:** Code wins: KeyO is global. Inbox still wants a pause **menu**. Frozen: SETTINGS action opens live panel; do not CONSUME on KeyO-exists.

#### 🟠 Major: Berth unpause / LOAD while paused — **resolved in freeze**

**Location:** `save.js` **1502**, **1625**  
**Issue:** Opening berth by clearing pause first is a combat and `systemLoaded` hazard. Frozen: stay paused; SAVE writes; LOAD refuse + named-disable.

#### 🟠 Major: Title reload / skip — **resolved in freeze**

**Location:** `title.js` **59–63**, **107–111**, **251–256**  
**Issue:** Reload wipes the run. Skip marker skips title. Frozen: remount; no skip; CONTINUE uses `setPaused`.

#### 🟠 Major: Overlay-policy / berthHold / expansion scope — **resolved in freeze**

**Location:** `overlay-policy.js` **4**; `save.js` hold; wishlist **131–135**  
**Issue:** Easy steal. Frozen: never write `paused` from policy; do not merge hold; do not add Settings knobs.

#### 🟠 Major: KeyP remap / Digit / hub — **resolved in freeze**

**Location:** Honor; `main.js` **175–176**  
**Issue:** A new Digit or remapping P would steal pause and station maps. Frozen: KeyP stays. No new Digit. HUD-01 empty.

#### 🟠 Major: Dim-ring click-through to RESUME — **resolved in freeze**

**Location:** settings/berth `pointer-events:none` roots; pauseEl auto  
**Issue:** PR1 buttons would resume from a click that looks like a Settings/berth scrim. Frozen: pauseEl pointer-events none while covered.

#### 🟠 Major: Partial merge (banner buttons XOR live openers) — **resolved in freeze**

**Location:** contract §2  
**Issue:** Labels without openers lie. Openers without `setPaused` leave the banner after CONTINUE. Frozen: same PR.

### 🟡 Minor: Boot `paused` vs `pauseEl` desync

**Location:** `title.js` **67**; `main.js` **169–173**  
**Issue:** Boot title pauses without showing `pauseEl`. Intentional.  
**Justification:** TITLE-from-pause should reuse that pattern (hide banner while title owns). `setPaused` is for in-run display sync, not boot.

### 🟡 Minor: Settings `setOpen` is not exported

**Location:** `settings.js` **215–226**  
**Issue:** Pause SETTINGS may keep synthetic KeyO.  
**Justification:** Optional export only. Do not add FIELDS.

### 🟡 Minor: Origins also writes `paused`

**Location:** `origins.js` **100**, **132**  
**Issue:** Fifth writer exists.  
**Justification:** Cite only. Do not claim Org01. Later keep one **in-run display** owner; origins overlay stays its live path.

### 💡 Suggestion: Shared `setPaused` comment

Later `main.js`: one short comment that in-run pause is flag + `pauseEl.display`, and overlay-policy must not write the flag. Do not narrate the wave.

### 💡 Suggestion: Optional PR2 still

One still: in-run P, four named actions, Settings z 80, berth SAVE works / LOAD named-disabled, TITLE remounts, CONTINUE hides banner, models filter KeyP ignored.
