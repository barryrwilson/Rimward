# Security Review: HUD-02 PR2 conventional (mech) skin

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Mode:** Quick scan (authored CSS skin; no auth, no payments, no persist, no new JS writers).  
**Scope:** `src/ui/hud.css` mech block, `scripts/boot-test.mjs` WAVE62 source pins, `out/w62/mech/probe.mjs`.  
**Pass:** 1 (implement) → 2 (re-apply after review; no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary

PR2 is authored CSS under `#hud[data-family="mech"]`. It does not interpolate names, does not write `innerHTML`, and does not touch `hudFamily` or persist. No CRITICAL or HIGH.

## Security Audit: HUD-02 PR2 mech skin

### Summary

Overall risk: **low**. Static selectors only. Family token stays `'mech' | 'bio'`.

### Finding 1: CSS interpolated from faction or player names

- **Severity**: informational
- **Category**: Injection (CSS)
- **Location**: `src/ui/hud.css` 980–1150
- **Description**: Every new rule is a literal `#hud[data-family="mech"]` selector. No `style` string is built from `faction`, `coverName`, or session text.
- **Impact**: None. A later template string would be XSS/style injection.
- **Reproduction**: Grep the new block for `` `${ `` / `innerHTML` — none.
- **Remediation**: Keep authored CSS. Do not set `el.style` from world strings.
- **Status**: resolved (not present)

### Finding 2: `innerHTML` / second HUD tree

- **Severity**: high (if added) → **not present**
- **Category**: DOM XSS
- **Location**: `src/systems/hud.js` (unchanged this PR)
- **Description**: CSS ticks use `.rw-reticle::after`. No tick spans. No `#hud-mech` sibling.
- **Impact**: None in this PR.
- **Reproduction**: `hud.js` has no `innerHTML`. CSS has no `#hud-mech`.
- **Remediation**: If CSS ticks ever fail, add spans once in `initHud` with `createElement`, never `innerHTML`.
- **Status**: resolved

### Finding 3: HUD write of `hullKind` or family persist

- **Severity**: high (if written) → **not present**
- **Category**: Client persistence
- **Location**: `src/systems/hud.js` (PR1 only; this PR does not edit it)
- **Description**: PR2 does not write `hullKind`, `sessionStorage`, or settings.
- **Impact**: None.
- **Reproduction**: Diff has no `hud.js` / `save.js` / `settings.js`.
- **Status**: resolved

### Finding 4: Dataset token `live`

- **Severity**: informational
- **Category**: Contract / unsafe token
- **Location**: `src/ui/hud.css` 980
- **Description**: Selectors use `data-family="mech"` only. Probe rejects `["']live["']` in the mech section.
- **Impact**: A `live` token would miss the skin or fork the switch.
- **Status**: resolved

### Finding 5: Secrets / logging

- **Severity**: informational
- **Category**: Data exposure
- **Location**: `out/w62/mech/probe.mjs`
- **Description**: Probe reads source files and prints PASS/FAIL names. No player, save, or session dump.
- **Status**: resolved

### Passed Checks

- [x] No secrets in code
- [x] Authored CSS only; no interpolated names
- [x] No `innerHTML` / `insertAdjacentHTML`
- [x] No `hullKind` write
- [x] No new persist / settings keys
- [x] Tokens stay `'mech' | 'bio'`
- [x] World strings stay on existing `textContent` path (JS unchanged)

### Recommendations

1. Keep PR3 bio CSS in the same authored-selector style.
2. Do not add a settings checkbox or persist the session override.
