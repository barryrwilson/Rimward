# Security Review: CTL-04 PR1 Digit1–5 weapon-group skip (Wave 125)

### Risk Level: Low

### Summary

PR1 adds a boolean skip in front of existing Digit1–5 `input.weaponGroup` assigns. Authored `e.code` literals stay. No new persist key, no HTML parse, no bind remap, no `innerHTML`, no event-stop wars. Helper throws stay inside try/catch. No CRITICAL or HIGH.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. Did not spawn `[security-auditor]` (no spawn tool in this worker).

Mode: Deep audit of the keydown trust boundary in `src/systems/controls.js`. Overlay helpers **read** only.

Graph: `claude/workflow-security-review` binding for this task (`r-mt9a2ngz-30c051c2`). This file is the required technical report.

---

## Security Audit: CTL-04 PR1 menu-input skip

### Summary

Overall risk assessment: **low risk**. Trust boundary is keyboard `e.code` already gated by `TRACKED`. New code only **omits** a write when live flags / helpers say a menu owns Digit1–5. Prototype-safe: no `for-in` on save blobs.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟡 MEDIUM: Outer catch re-reads `ctx.flags` (documented, contract-mandated)

- **Severity**: medium (theoretical; contract formula)
- **Category**: Fail-closed / unexpected throw
- **Location:** `src/systems/controls.js` **108–110**
- **Description:** Outer catch returns `!!(ctx && ctx.flags && ctx.flags.docked === true)`. If `flags` is a throwing getter, the catch body can throw. Contract MERGE LAW requires this exact formula. Live `ctx.flags` is a plain object.
- **Impact:** A hostile flags proxy could throw out of the skip helper into the keydown listener. Existing listener has no outer try. Same class of risk as other flag reads in this file.
- **Reproduction:** Replace `ctx.flags` with a getter that throws. Press Digit1.
- **Remediation:** Do not change the frozen formula. Live ctx is not a proxy.
- **Status:** accepted. Contract wins. Not exploitable on live ctx.

#### 🟢 LOW: Settings / title helper walks body children on Digit keydown

- **Severity**: low
- **Category**: Client-side work on input
- **Location:** `overlay-policy.js` **49–70**, **35–46**; called from `controls.js` **97–104**
- **Description:** `hailDigitsAllowed` and `settingsOwnsScreen` walk `document.body.children`. Keydown only, not per-frame. Contract forbids walking the **station** DOM; these are existing overlay helpers.
- **Impact:** None for XSS. Hostile DOM could make Settings look open and skip WPN (fail closed for the weapon write).
- **Reproduction:** Inject a body child with inner `aria-label="Settings"`; press Digit5 in space.
- **Remediation:** None in PR1. Do not write overlay-policy.js.
- **Status:** accepted.

#### 🟢 LOW: Hail Digit resolve still uses fail-open on helper throw

- **Severity**: informational
- **Category**: Overlay dual-bind
- **Location:** `hail.js` **439–442** (unchanged); `controls.js` **95–96**
- **Description:** Hail catch sets `digitsOk = true`. Controls skip uses `hailOpen === true` first, so WPN still does not write while the card is open even if hailDigitsAllowed throws.
- **Impact:** Hail may still resolve a Digit; WPN does not change. Desired.
- **Reproduction:** Hail card open; Digit1. Hail resolve path independent of weaponGroup write.
- **Remediation:** None. Do not edit hail.js.
- **Status:** closed for WPN leak.

### Positive Observations

- Authored `Digit1`–`Digit5` cases only. `TRACKED` unchanged.
- `=== true` tests. Missing flags treat as not-docked.
- No `stopImmediatePropagation` (avoids title/models/hail listener wars).
- No `innerHTML` / `insertAdjacentHTML` / `document.write`.
- No new `localStorage` key. `state.js` untouched.
- Input writer remains `controls.js` (`ctx.js` law 15).
- Direct `ctx.input.weaponGroup = n` still works for combat pins.

### Passed Checks

- [x] No secrets in code
- [x] No SQL / command injection
- [x] No new persist / bind schema (hostile save cannot remap digits)
- [x] No XSS sink added
- [x] Typing / title / models skip via `playSurfaceBlocked` + `shouldSkipDockPulse`
- [x] Station services still receive the event (no stop)
- [x] Overlay-policy.js not written

### Recommendations

1. Keep PR2 `fireHeld` out of this switch (already named).
2. Optional later: refresh hail.js overlap comment (other worker).
