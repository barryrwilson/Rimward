# Code Review: Wave 121 HUD remaining-feedback leftover (design pack)

**Scope:** `docs/Hud05RemainingFeedbackDesign.md`, `out/w121/hudrest/current-hud-feedback-inventory.md`, `out/w121/hudrest/shared-contract.md`. No `src/` diff.  
**Personas:** `reviewer.md` + orchestrator `code-review.md`.  
**Date:** 2026-08-25. Second pass after inventory §7 hub-cite tighten.

## Code Review: Hud05 remaining feedback leftover

### Summary

Pack matches the owner census: leftover **CONSUME**, named serial **none**, name **no remaining HUD feedback leftover.** Live cites match `hud.js` / `save.js` / `onboarding.js` at Wave 121. Contract wins vs the brief. HUD-04 is cite-only. No Blocker or Major.

### What's done well

- Inventory §0.1 verdict table separates toast (HUD-04 landed), banner (not flood), commLine (same channel), onboarding (one teaching line), and siblings.
- Line numbers were re-censused. Wave 118 toast inventory is marked historical.
- MERGE LAW forbids sixth slot, linger retune, `assertive`, new persist, Digit steal, chart-label steal, overlay z raise.
- Serial table names **PR1 remaining HUD feedback** as **does not exist** — same CONSUME pattern as `docs/Hud03RemainingVisualDesign.md`.
- Honor list matches the worker brief (empty hub, Digit 0/8/9, KeyO, `state.js` READ-ONLY, kit omit, gauges off).

### Findings

#### 🟡 Minor: Inventory honor row cited RANGE hide as the hub honor

**Location:** `out/w121/hudrest/current-hud-feedback-inventory.md` §7  
**Issue:** First pass used `hud.css` 207–208 RANGE hide as the gauges-off cite. Empty hub honor is `.rw-reticle` 80×80 (`hud.css` 184–193).  
**Fix:** Inventory §7 now cites 184–193 as hub and 207–208 as RANGE hide only.  
**Status:** resolved (inventory edit).

#### 💡 Suggestion: Optional later census grep list is enough; do not add a probe this wave

**Location:** contract §3 PR-census  
**Issue:** HUD-04 Wave 120 had `out/w120/toast/probe.mjs`. CONSUME leftover does not need a probe.  
**Fix:** Keep markdown-only.  
**Status:** already frozen (no probe in write-set).

### Verdict

**Approve CONSUME freeze.** No Blocker. No Major.

Correctness: live `TOAST_DEDUP_WINDOW = 8` (`hud.js` 66), linger helpers (`530–555`), `saveBlocked` copy (`596–600`), expire `aria-hidden` (`1243`), unique `pushToast` (`1186`, call `1235`), one banner (`858–863`), one hint (`onboarding.js` 81–105), `source: 'autosave'|'berth'` in `save.js`. Banner/commLine/onboarding are not a second flood ring.

Maintainability: contract §0 says this file wins on conflict with the brief. Deputize copies match.

Test coverage: none required (no `src/`).
