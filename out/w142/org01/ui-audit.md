## UI Audit: Org01 origin consequence preview (Wave 142 PR1)

### Summary

The origin card keeps the live title, Digit labels, click rows, and permanence footer. Compact ~10 px dimmer sublines carry hull, money, standings, danger, and experience before confirm. Backup overflow lives on `.rw-origin-list` only. Title and footer stay outside that scroller. No Blocker or Major findings remain.

### What's done well

- Flavor title stays `[n] name — line` at 12 px. Digit labels are not shrunk.
- Preview uses labeled words, not color-only danger. Hover is extra.
- `text-transform: none` on `.rw-origin-preview` so `Mk I`, `UU`, and living-ship words stay readable under the uppercase card.
- Five kinds wrap (`overflow-wrap: break-word`). Card stays 620 px / 92 vw.
- List `max-height: min(72vh, calc(92vh - 5.5rem))` + `overflow-y: auto` is backup only. No new scroll key. No `tabindex` trap. No animation (`reducedMotion` safe).
- Dedicated `.rw-origin-*` only. `.screen-panel`, `.screen-overlay`, `.screen-btn`, pause, and HUD are untouched.
- High-contrast body class brightens origin row and preview text.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: overflow still mouse/trackpad if a short viewport clips

**Location:** `src/ui/screens.css` `.rw-origin-list`  
**Issue:** Digit users do not get a scroll key. Contract forbids a new scroll key and a tabindex trap. Compact type is the primary fit; overflow is backup.  
**Fix:** keep compact first. Do not bind a scroll Digit.

#### 💡 Suggestion: row `:focus` style

**Location:** `.rw-origin-row:hover`  
**Issue:** Click rows have hover, not a Tab focus ring. Keyboard confirm is Digit1–5, not Tab.  
**Fix:** none required this PR. Do not add a tabindex trap.

### A11y / layout checks

- [x] Color is not the only cue (Digit + name + labeled preview words)
- [x] Keyboard Digit1–5 and click still confirm once
- [x] No new animation
- [x] Title + footer outside the list scroller
- [x] No station/pause class steal
