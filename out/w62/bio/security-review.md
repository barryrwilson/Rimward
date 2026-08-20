# Security Review: HUD-02 PR3 living (bio) skin + AGEZ hide

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.  
**Scope:** `src/ui/hud.css` bio block, `src/systems/hud.js` AGEZ helpers + transform/5 Hz writers, `scripts/boot-test.mjs` WAVE62 pins, `out/w62/bio/probe.mjs`.  
**Mode:** Quick scan (client overlay; no auth, no network, no persist).  
**Pass:** 2 (re-apply after period whitelist + no per-frame closure).

## Security Review: HUD-02 PR3 bio / AGEZ

### Risk Level: Low

### Summary

Authored CSS plus numeric AGEZ math. No HTML injection path, no new persist keys, no `hullKind` write. Mood period is a closed enum. Residual risk is the pre-existing mood `className` concat, which this PR does not enlarge.

### Findings

#### 🟢 LOW: Mood still concatenates into `className`

**Location:** `src/systems/hud.js:1416`  
**Issue:** `moodIcon.className = 'rw-bio-icon m-' + mood` is the shipped 5 Hz writer. `--rw-bio-period` now uses `bioPeriodSec` (equality on `serene|pained|keen|anxious|feral` only). The class string is unchanged.  
**Impact:** A tampered `ctx.bio.mood` can still add extra classes on the icon node. It cannot write HTML.  
**Fix:** Not required for PR3. A later owner may allowlist the class the same way as the period.  
**Status:** documented — pre-existing; period path is closed

#### 🟢 LOW: Session debug override unchanged

**Location:** `src/systems/hud.js:76-82`  
**Issue:** `sessionStorage['rw-hud-family']` remains session-only. PR3 does not persist it or write it from settings.  
**Impact:** None new.  
**Status:** accepted

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write`
- [x] World strings stay on `textContent` / `Text` nodes
- [x] Family CSS is authored; not interpolated from names or factions
- [x] No new `localStorage` / `rimward-settings-v1` / `WORLD_FIELDS` keys
- [x] HUD does not write `hullKind` (`hullKind =` grep still clean)
- [x] HUD does not write `ctx.input.throttle`
- [x] `--rw-bio-period` is a number + `s` from a closed mood list
- [x] AGEZ helpers take numeric overlay px only
- [x] Contacts extra length = 0 (round cap only); no SVG `d` from world strings
- [x] No second HUD tree

### Recommendations

1. Keep world strings on `textContent`.
2. Keep period writes on the 5 Hz path only.
