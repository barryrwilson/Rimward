# Code Review: Onb01 first-minute flight-lesson leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live expanded CONTROLS (`hud.js` **1290**), `move` at `world.time > 20` (`onboarding.js` **37–39**), and missing hail/chart/look steps. Contract forbids CONSUME, pause write, Org01 `origins.js`, Ctl05 encyclopedia move, new WORLD_FIELDS, `innerHTML`, and auto-open overlays. No Blocker/Major remain after collapse + six-step lesson + fail-closed skip, persist reuse `seen`, and later write-set limited to `onboarding.js` + HUD collapse + WAVE6 retarget.

### What's done well

- Code-wins inventory with file:line for HINTS table, 8 s dismiss, docked/jumping/`hints` suppression, encyclopedia 19 lines, origin toast, park vs `DOCK_RANGE`, `WORLD_FIELDS` `'onboarding'`.
- CONSUME path documented and rejected: one-at-a-time rail **exists**; post-pick sequence and on-demand default **do not**.
- Teaching-surface count after `originChosen` is explicit (encyclopedia + toast + HUD chrome; `move` at t > 20).
- Smaller freeze deputized (hint rail + collapse) over a new overlay or pause tutorial.
- Partial merge named: collapse without lesson leaves no teaching.
- Org01 / Ctl05 / AI-05 / CTL-04 fences named before impl.
- WAVE6 `move` harness called out as later retarget, not ignored.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `hud.js` **1290** vs `onboarding.js` **37–39**  
**Issue:** Hints are already one-at-a-time **and** a CONTROLS toggle exists. That is half of a careless CONSUME. Post-pick sequence is missing. Encyclopedia default is expanded. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: First-minute dump still live — **resolved in freeze**

**Location:** encyclopedia **1276–1295**; toast **662–663**; `move` **37–39**  
**Issue:** Overlay-up shows 19 lines + origin sting + full HUD. Frozen: default collapse + six-step origin-gated lesson; retire `move`.

#### 🟠 Major: `move` four-bind dump as “the lesson” — **resolved in freeze**

**Location:** `onboarding.js` **37–39**  
**Issue:** Inbox wants look/turn then throttle separately, immediately after pick, not at t > 20. Frozen: split; first card look/turn; `move` retired.

#### 🟠 Major: Collapse without lesson (or lesson without collapse) — **resolved in freeze**

**Location:** contract §2  
**Issue:** Either half leaves the dump or leaves no teaching. Frozen: partial merge forbidden. PR1 lands both.

#### 🟠 Major: Claiming `origins.js` / pause / auto-open — **resolved in freeze**

**Location:** honor; `origins.js` **100–133**; `overlay-policy.js` **4**  
**Issue:** Easy steal of Org01, Ctl05, CTL-02. Frozen: later write-set `onboarding.js` + `hud.js` collapse only. Never `paused`. Never auto-open hail/chart.

#### 🟠 Major: New WORLD_FIELDS or `state.js` ORIGINS retune — **resolved in freeze**

**Location:** `save.js` **90–91**; `state.js` **742–767**  
**Issue:** `seen` already persists. Frozen: reuse `seen`. `state.js` READ-ONLY.

#### 🟠 Major: WAVE6 harness left on `move` — **resolved in freeze**

**Location:** `scripts/boot-test.mjs` **1729–1744**  
**Issue:** Retiring `move` without harness retarget fails WAVE6. Frozen: harness retarget is part of PR1 partial merge. Not this wave’s edit.

### 🟡 Minor: `combat` hint still names T and H

**Location:** `onboarding.js` **54–56**  
**Issue:** After the lesson, combat can repeat target/hail plus surrender.  
**Justification:** Contextual, not first-minute dump. Keep. Do not CONSUME the leftover because combat exists.

### 🟡 Minor: `dock` lesson before in-zone

**Location:** park `origins.js` **46**; `U.DOCK_RANGE` **45**  
**Issue:** Step 5 teaches J while dist ≈ 73 u. Copy frozen: `J — dock when the station is in range`. Reuses id `dock` so the range-gated row does not fire twice.  
**Justification:** Inbox asked for dock in the post-pick sequence. Honest range words. Do not teleport.

### 🟡 Minor: Restore with origin set replays unseen new ids

**Location:** contract lesson gate  
**Issue:** Old saves have `move` in `seen` but not `look`. Veterans get the new lesson once.  
**Justification:** They never had the sequential lesson. Do not auto-complete from `move`.

#### 🟠 Major: `hud.css` “none required” left the chip off tokens — **resolved in freeze**

**Location:** old neighbours row; live `onboarding.js` **81–88**; `hud.css` **1271–1277**  
**Issue:** Designer Major. Sequential rail would ignore text scale, contrast, and reduced-motion.  
**Fix:** PR1 writes `.rw-onboard-hint` in `hud.css`. HUD may reparent the same node onto `#hud` (not the reticle). Init order: onboarding before HUD (`main.js` **98–99**).

#### 🟠 Major: Lesson rail silent for AT — **resolved in freeze**

**Location:** `onboarding.js` **81–108** vs `hud.js` **1236–1240**  
**Issue:** Designer Major. No `role` / `aria-live` on the teacher.  
**Fix:** same node `role="status"` `aria-live="polite"` `aria-atomic="true"`. No second live region. Not a modal.

### 💡 Suggestion: Keep encyclopedia lines unchanged

`controls.js` **590–608** stay the on-demand reference. Do not shorten the list as the PR1 “fix”. Collapse is the law.

### Re-review (Wave 141 pass 3)

Designer Majors folded. Partial merge now includes tokens + live region + `aria-expanded` on init/click/combat. Leftover **REAL** / **PR1** unchanged. No new Blocker. Markdown only.
