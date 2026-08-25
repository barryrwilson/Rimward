# Security Review: Wave 121 HUD remaining-feedback leftover (hudrest)

**Scope:** markdown pack `docs/Hud05RemainingFeedbackDesign.md` + `out/w121/hudrest/**`. No `src/` in write-set.  
**Mode:** Quick scan (design freeze, no runtime change) plus live-path trace of toast / banner / hint / `aria-live` because the leftover is player-facing copy.  
**Personas:** `security-auditor.md` + orchestrator `security-review.md`.  
**Date:** 2026-08-25. Second pass: still 0 HIGH/CRITICAL after inventory honor-cite tighten (no security change).

## Security Review: remaining HUD feedback leftover

### Risk Level: Low

### Summary

This wave writes **markdown only**. Live toast / banner / hint paths already use `textContent`. Toast expire already sets `aria-hidden`. There is **no** `aria-live=assertive` under `src/`. The freeze **forbids** a later second live region and **forbids** `innerHTML`. No HIGH or CRITICAL findings.

### Findings

None open at critical / high / medium.

#### 🟢 LOW: Banner fade does not set `aria-hidden` (not leftover; do not invent)

**Location:** `src/systems/hud.js:1262-1264` (live, cite only)  
**Issue:** Arrival banner removes `.show` and leaves system-name `textContent` inside a polite region. Toast PR1 already hid **chips** with `aria-hidden`. Banner is one 4 s arrival card, not a flood stack.  
**Impact:** Theoretical AT re-read of a faded arrival name. Not XSS. Not privilege. Not a flood leftover.  
**Fix:** **Do not** name a serial. Contract §0.11 forbids adding a region or treating this as HUD-05 PR1.  
**Status:** documented — not leftover. **Justification:** CONSUME freeze; not exploitable.

### Passed Checks

- [x] No secrets in leftover markdown
- [x] No `src/` write (HUD copy, save emit, persist untouched this wave)
- [x] Live `hud.js` / `onboarding.js` `innerHTML`: **none** (grep)
- [x] Live toast/banner/hint/prompt: `textContent` / `el()` (`hud.js` 283–288, 1210, 1256–1257; `onboarding.js` 102)
- [x] Toast expire `aria-hidden="true"` already live (`hud.js` 1243)
- [x] Real show unhides **then** writes text (`hud.js` 1209–1210)
- [x] Boot chips `aria-hidden=true` (`hud.js` 852)
- [x] No `aria-live=assertive` under `src/`
- [x] Contract forbids later `assertive` and forbids a **new** live region as leftover
- [x] Authored `saveBlocked.source` tokens only (`autosave` / `berth`)
- [x] No new persist key; linger stays session
- [x] Fail-closed never pause the sim
- [x] Prototype-safe: no `for-in` blob → copy (freeze)
- [x] Overlay z not raised (click-steal / Digit context)

### Recommendations

1. Keep CONSUME. Do not add a sixth toast or a hint live region “for a11y leftover.”
2. If a later true flood census appears, re-open **HUD-04** for toast regression; do not invent HTML.

### Severity counts

| Severity | Open | Resolved this pack |
|---|---|---|
| critical | 0 | — |
| high | 0 | — |
| medium | 0 | — |
| low | 0 leftover (1 documented live cite) | n/a |
| informational | 0 | — |

### Positive Observations

- HUD-04 already closed the XSS-adjacent expire-in-live-region hole on chips.
- Integrator freeze repeats `innerHTML` forbidden and `textContent` only.
- Autosave copy is authored, not concatenated hostile reason (reduces reason-string injection into a second sentence).
- Storage catch in `save.js` stays silent (no leak of quota errors into HUD).
