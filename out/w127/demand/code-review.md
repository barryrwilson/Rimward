## Code Review: Hail01 pirate demand lifecycle (Wave 127 PR1)

### Summary
PR1 lands named source, 20 s deadline, Wave 30 verbs, dock/jump/expire/void close, HEAVE-TO gate, and finite debit. Re-dispatch: announce toast look-ahead requires demand-tagged same-ship close; Heave-to suppress uses bubble + target, not telegraph-after-lock only.

### What's done well
- `demandPeaceAt` still stamps emit time for void-on-hit; `demandExpiresAt` is the deadline.
- Busy hail defers a demand instead of `continue`-drop. Overwritten defer fail-closes the previous demand.
- Calm skip does not leave `demanding === true` with no card.
- HUD toasts only demand-tagged `hailOpened` / `hailClosed`. Bargain and salvage stay silent.
- Same-frame `hailClosed` with `demandOutcome` skips the announce toast.
- Ace duel still has no tribute card.

### Findings

#### 🟡 Minor: Empty `ctx.ships` always maps to `jumped`
**Location:** `src/systems/hail.js` `update` empty-list branch
**Issue:** Traffic-empty despawn of the last hull with an open demand also stamps `jumped`.
**Why it stays:** Contract names empty `ctx.ships` as jump/despawn close with a named outcome. Fail closed to `jumped` rather than silent `closeCard`.
**Status:** accepted

#### 💡 Suggestion: Flavour `commLine` still toasts beside outcome
**Location:** `src/systems/hail.js` pay / teeth `commLine`
**Issue:** Player may see `Smart. Run along.` and `{name} — tribute taken. They run.` in one close.
**Why it stays:** Contract allows card flavour; sentences are not identical. HUD-04 `frameLines` skips only exact matches.
**Status:** accepted

### Passed
- Finite demand clamp at emit and on the pay button.
- Timer text refreshes the existing line node (`textContent`).
- `hailDigitsAllowed` and Digit 1–9 unchanged.
- No `controls.js` / `agent-api.js` / `state.js` / overlay-policy rewrite.
- HUD-06 home mark, POS HOME, `HOME_EDGE_INSET` untouched.
