## UI Audit: Wave 107 REP-05 PR3 Digit 9 LIVE CONSEQUENCES

### Summary
Standing (Digit 9 epics pane) still lists LIVE CONSEQUENCES as `screen-note` lines. Three new authored lines name leave, covering, and inbound refuse. No hub child, no Digit steal, no new CSS, no color-only meaning.

### What's done well
- Same heading `LIVE CONSEQUENCES` and same `h('div', 'screen-note', panel, lives[i])` loop.
- Copy uses short commLine strings the player already hears: `Leave this space.`, `Patrol covering.`, `No passage.`
- Lines stay distinct (leave vs covering vs jump vs `No sale.`).
- Digit 0 stays shipyard. Digit 9 stays Standing / epics. No new Digit or hail card.
- HUD-01 empty 80 px hub is untouched (no ally pip).
- Meaning is in words and numbers, not a new color.

### Findings

No Blocker or Major UI issues.

#### 🟡 Minor: Inbound jump note is long
**Location:** `src/systems/station.js:1191`
**Issue:** One `screen-note` holds Marked exclusive, skip names, dock-open, and `No passage.` `.screen-note` wraps (`screens.css` 55–58). The locker line is already this long.
**Fix:** None this PR. Task asked for three consequence lines. Prefer no new CSS.

#### 💡 Suggestion: Three extra notes lengthen the pane
**Location:** Digit 9 Standing LIVE CONSEQUENCES
**Issue:** The list is twelve lines. A short dock panel may scroll.
**Fix:** Accept. Do not hide live facts.

### Passed
- [x] LIVE CONSEQUENCES is still a list of `screen-note` lines
- [x] No hub child / ally pip / lock box
- [x] Digit 0 shipyard; Digit 9 epics / Standing
- [x] `textContent` / `h()` only; no `innerHTML`
- [x] No new CSS class
- [x] No color-only meaning
- [x] Keyboard Digit map unchanged
- [x] Contrast class `body.rw-contrast .screen-note` still applies

### Method
Self-applied `orchestrator/references/ui-audit.md`. Did not spawn [designer]. No Vite / Chrome (parent verifier does Digit 9 browser).
