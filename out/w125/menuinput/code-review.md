# Code Review: CTL-04 PR1 Digit1–5 weapon-group skip (Wave 125)

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus orchestrator `code-review.md`. Self-applied. Did not spawn `[reviewer]`.

## Code Review: `src/systems/controls.js`

### Summary

PR1 matches MERGE LAW. Digit1–5 assign `weaponGroup` only when `shouldSkipWeaponGroupDigits` is false. Open space still writes. Dock / hail / pause / chart / berth / settings / title / models / typing skip. No Blocker or Major.

### What's done well

- Formula in `shouldSkipWeaponGroupDigits` matches `out/w124/menuinput/shared-contract.md` including helper-miss tries and outer docked fallback.
- Read-only import of existing overlay helpers. `overlay-policy.js` not written.
- TRACKED still lists Digit1–5. Digit6–9/0 not added.
- KeyJ still uses `shouldSkipDockPulse` only. KeyD untouched.
- `fireHeld` still `chartOpen !== true` only (PR2 not stuffed).
- Digit4 missiles comment kept.
- Fail-closed `=== true`. No throw to caller on helper miss.
- `station.js` still maps Digit4 Feed / Digit5 Repair without stop (required).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Hail overlap comment in hail.js is now stale

**Location:** `src/systems/hail.js` **431–432** (out of write-set)

**Issue:** Comment still says Digit1–3 also switch weapon groups. After PR1, hailOpen skips the WPN write.

**Fix:** Later hail.js owner can shorten the comment. This pack must not edit hail.js.

**Status:** accepted. Documented in notes.

#### 🟡 Minor: Skip helper runs five times per Digit case

**Location:** `src/systems/controls.js` **357–372**

**Issue:** Each case calls `shouldSkipWeaponGroupDigits(ctx)`. Keydown is rare. Contract shows this form.

**Fix:** None. Do not hoist if it drifts from the frozen cases.

**Status:** accepted. Contract form.

#### 💡 Suggestion: Empty catch comments

**Location:** `src/systems/controls.js` **99–104**

**Issue:** `/* helper miss */` and `/* */` come from the contract. They do not explain a non-obvious constraint beyond helper miss.

**Fix:** Keep. MERGE LAW.

**Status:** accepted.

### Verdict

Approve PR1. Open-space Digit1–5 still set WPN. Direct `ctx.input.weaponGroup = n` unchanged. Re-review after notes: still clean.
