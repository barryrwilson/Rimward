# UI Audit: TGT-03 radar jump-park (Wave 99)

**Scope:** HUD contacts arc hide/show. No `hud.css` edit. Worker applied `ui-audit.md`. Did **not** spawn `[designer]`.  
**Pass:** 1.

### Summary

No new widget. `.rw-contacts` parks with existing `is-hidden` while jumping (and still while docked). Empty 80 px hub. Three classes stay distinct. No new `@keyframes`. No Blocker/Major.

### What's done well

- Reuse `.rw-contacts` + `#hud .is-hidden`.
- `.rw-edge-arrow` and `.rw-nav-gate-cue` unchanged.
- Enter pulse still `rw-contact-enter`; `body.rw-reduced-motion` still kills `#hud *` animation; extra kill on `.is-enter` remains.
- Friend/foe still shape (tick / chevron / hollow diamond). Contrast/colorblind vars untouched.
- Arc stays `aria-hidden="true"` (decorative). `pointer-events: none`.

### Findings

None at Blocker / Major.

#### 💡 Suggestion: Jump hide is class toggle, not a new motion
**Location:** `src/systems/hud.js` contacts `classList.toggle('is-hidden', !showArc)`
**Issue:** Instant hide. Correct for park. Do not add a sweep.
**Status:** accepted

### Checklist

- [x] Empty hub (`cx - 44` / 80 px) untouched
- [x] No PPI disc / no hub pip / no `.rw-radar`
- [x] No new `@keyframes`
- [x] Reduced-motion kill remains
- [x] Three classes may still show together when relevant (arc only if scanner ≥ 1 and not docked/jumping)
- [x] FORE/AFT, Incoming dart/fire copy, lock arrow, NAV-02 cue untouched
