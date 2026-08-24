## Security Review: Wave 97 NPC turrets design (markdown only)

### Risk Level: Low

### Summary
This wave writes design markdown. It does not ship `src/`. The freeze is fail-closed: default nobody fires, missing `target` drops, no hangar/persist key, no `innerHTML`, no invented percent/UU. No CRITICAL or HIGH remains after the missing-target and toast freezes.

### Findings

#### 🟡 MEDIUM: Shared player turret live-count would starve `auto`
**Location:** `src/systems/combat.js:1245-1250`; contract §4.2  
**Issue:** `countLiveTurretBolts` counts every `wkey === 'turret'` with no `fromPlayer` filter. A naive NPC emit through `spawnNpcShot('turret')` would compete with the player hose.  
**Impact:** Player `auto` (Wave 68, complete) could go silent while NPCs fill the cap.  
**Fix:** Already frozen: split NPC live cap by `fromPlayer`. Do not share the unfiltered counter. Status: **documented / closed in contract**.

#### 🟡 MEDIUM: Ace cannon omit-`target` must not apply to turret
**Location:** `src/systems/npc.js:1923`; `src/systems/combat.js:1787-1791`  
**Issue:** Ace vs player cannon may omit `target`; combat treats null as the player. Copying that for turret would add extra player DPS without an explicit aim.  
**Impact:** Fail-open player bruise; vsPlayer/vsNPC collapse by omission.  
**Fix:** Already frozen: turret emit without `target` **drops**. Status: **documented / closed in contract**.

#### 🟢 LOW: Prototype ids / hangar patch
**Location:** `src/game/weapon-fit.js:12-31`; `src/game/hangar.js:521-523`  
**Issue:** A later persist of NPC turret ids could smuggle `__proto__` if someone used `for-in` merge.  
**Impact:** Prototype pollution on a local save.  
**Fix:** Already frozen: no NPC rack key; own-key patch; `freezeIds` reserved skip. Status: **documented**.

### Passed Checks
- [x] No secrets in this write-set
- [x] No `src/` edits
- [x] No new `localStorage` / `WORLD_FIELDS`
- [x] No `innerHTML` path proposed
- [x] Authored literals only if toast ever exists; default **no turret toast**
- [x] `textContent` / `h()` / `el()` required
- [x] Unknowable non-beam miss
- [x] Wave 57 `vsPlayer` split
- [x] Digit 0/8/9 not stolen
- [x] No invented UU / standing / fire percent
- [x] NPC missiles Q1/Q2 not reopened
- [x] Default-off who subset

### Recommendations
1. Impl PR1 must pin missing-`target` drop before any emit.
2. Impl PR2 must pin NPC turret cap ≠ unfiltered `countLiveTurretBolts`.
3. Do not add an `Incoming turret.` toast (XSS + dart-channel theft).
