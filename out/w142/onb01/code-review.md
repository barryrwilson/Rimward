## Code Review: Onb01 PR1 first-minute flight lesson

### Summary

PR1 lands collapse + six-step origin-gated lesson + fail-closed skip + live region + tokens + WAVE6 onboarding retarget together. No Blocker/Major remain in the owned write-set. WAVE6 save-fields still names `move` outside the allowed block.

### What's done well

- HINTS order is look → throttle → target → hail → dock → chart, then live `gate`/`combat`/`mine`/`feed`/`repair`/`saved`.
- Id `move` is gone. `dock` is reused with origin `when` (not range-gated).
- CONTROLS starts collapsed; `applyControlsCollapse` sets class, label, and `aria-expanded` on init, click, and combat.
- One `.rw-onboard-hint` node; HUD reparents onto `#hud`, not the reticle; missing `#hud` copies `--rw-text-scale`.
- Paint is `textContent`. Unknown ids skip. `when` throw skips the row.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None open in the write-set.

#### 🟡 Minor: WAVE6 save-fields still asserts `move`

**Location:** `scripts/boot-test.mjs` **1930–1931**  
**Issue:** Section a banks `look`. Section g still requires `move` in the dock autosave snapshot.  
**Fix:** Orchestrator retarget `includes('move')` → `includes('look')`. This worker did not edit section g (scope).

#### 🟡 Minor: After the onboarding block, later WAVE6 ticks can advance the lesson

**Location:** `scripts/boot-test.mjs` **1743** restores `hints = true`; epics ticks follow  
**Issue:** Next unseen origin-gated card (`target` after throttle already shown) can paint during epics. Live pre-PR1 already advanced to range-gated `dock` after restore.  
**Justification:** Same one-at-a-time rail. Epics asserts do not key on hint copy.

#### 💡 Suggestion: Copy textScale on settings change for a body-child hint

**Location:** `src/systems/onboarding.js` init; `settings.js` writes `--rw-text-scale` on `#hud`  
**Issue:** If `#hud` is missing for the session, scale is stamped once at onboarding init.  
**Justification:** HUD present in live `index.html`. Reparent path inherits live scale from `#hud`. Fail-closed stamp is enough.

### Passed

- Partial merge: collapse, lesson, retire `move`, tokens, live region, `aria-expanded`, WAVE6 block a.
- Keys / Digit / pause / `origins.js` / `state.js` writes not stolen.
- 8 s dismiss, any-keydown, docked/jumping, `settings.hints` kept.
