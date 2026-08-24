## Security Review: Wave 98 NPC turrets owner close (markdown only)

### Risk Level: Low

### Summary
This wave writes owner markdown and an integrator pack. It does not ship `src/`. The freeze stays fail-closed on emit, persist, and HTML. Q1/Q2 are named gates, not a fire percent. No CRITICAL or HIGH remains after the missing-target, no-toast, and no-persist freezes.

**Persona:** security-auditor (`bundled/skills/shared/personas/security-auditor.md`).  
**Method:** self-applied `orchestrator/references/security-review.md` (quick scan: markdown-only, no auth/payments).  
**Date:** 2026-08-23.

### Findings

#### 🟡 MEDIUM: Shared player turret live-count would starve `auto`
**Location:** `src/systems/combat.js:1245-1250`; contract §4.2  
**Issue:** `countLiveTurretBolts` counts every `wkey === 'turret'` with no `fromPlayer` filter. A naive later emit through `spawnNpcShot('turret')` would compete with the player hose.  
**Impact:** Player `auto` (Wave 68, complete) could go silent while NPCs fill the cap.  
**Fix:** Already frozen: split NPC live cap by `fromPlayer`. Copy pin global **4**. Status: **documented / closed in contract**. Not a Wave 98 `src/` defect.

#### 🟡 MEDIUM: Ace cannon omit-`target` must not apply to turret
**Location:** `src/systems/npc.js:1923`; `src/systems/combat.js:1787-1791`  
**Issue:** Ace vs player cannon may omit `target`; combat treats null as the player. Copying that for turret would add extra player DPS without an explicit aim.  
**Impact:** Fail-open player bruise; vsPlayer/vsNPC collapse by omission.  
**Fix:** Q2 closed: turret emit without `target` **drops**. Status: **documented / closed in contract**.

#### 🟢 LOW: Prototype ids / hangar patch
**Location:** `src/game/weapon-fit.js:12-31`; `src/game/hangar.js:521-523`  
**Issue:** A later persist of NPC turret ids could smuggle `__proto__` if someone used `for-in` merge.  
**Impact:** Prototype pollution on a local save.  
**Fix:** Already frozen: no NPC rack key; no new `WORLD_FIELDS`; own-key patch; `freezeIds` reserved skip. Status: **documented**.

### Passed Checks
- [x] No secrets in this write-set
- [x] No `src/` edits
- [x] No new `localStorage` / `WORLD_FIELDS`
- [x] No `innerHTML` path proposed (`hud.js` / `combat.js` / `npc.js` grep 0)
- [x] Authored literals only if toast ever exists; this pack **no turret toast**
- [x] Does not author `Incoming fire.` (sibling TGT-03)
- [x] `textContent` / `h()` / `el()` required
- [x] Unknowable non-beam miss
- [x] Wave 57 `vsPlayer` split
- [x] Digit 0/8/9 not stolen
- [x] No invented UU / standing / fire percent
- [x] NPC missiles Q1/Q2 not reopened
- [x] Named who / vsPlayer gate (Q1/Q2 closed); live emit still zero until serial

### Recommendations
1. Impl PR1 must pin missing-`target` drop before any emit.
2. Impl PR2 must pin NPC turret cap ≠ unfiltered `countLiveTurretBolts`.
3. Do not add an `Incoming turret.` toast (XSS + dart-channel theft). Do not author `Incoming fire.` in this pack.
