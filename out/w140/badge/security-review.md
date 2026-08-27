## Security Review: Agent play badge layout + a11y tokens (Wave 140 PR1)

### Risk Level: Low

### Summary

CSS-only change on `.rw-agent-badge`. No JS, no persist, no `innerHTML`, no z-index drop. Click-jack, XSS, geometry save, and PWR cover were the scoped threats. None are open at HIGH/CRITICAL.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Checklist: `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Mode: quick scan (styling; no auth, no crypto).

### Findings

No CRITICAL. No HIGH.

#### 🟡 MEDIUM: Dock credits can still sit under z-index 40

**Location:** `src/style.css:43`
**Issue:** Badge z-index stays 40. Station overlay is 20 (`screens.css` **16**; `hud.css` **1996** comment). Dock credit copy can sit under the card.
**Impact:** Overlap of non-control text on dock. Enable/Stop stay clickable above scrim 20.
**Fix:** Do not drop z-index. Contract forbids below 20. Accepted overlap; owner stills later.
**Status:** documented, not expanded
**Justification:** Click-jack fix is keep z-index 40, not lower it.

#### 🟢 LOW: Unused colorblind state tokens on the badge

**Location:** `src/style.css:137–139`
**Issue:** `--rw-warn`, `--rw-bad`, `--rw-good` are set. Badge paint does not read them yet. Accent, panel, and ON/OFF cues do.
**Impact:** None exploitable. Palette is ready if later copy uses those vars.
**Fix:** None in PR1. Contract requires the HUD Okabe-Ito set.
**Status:** documented
**Justification:** Mirror the HUD token block; do not invent badge uses.

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in this write-set
- [x] Badge copy stays `textContent` in live `agent-api.js` (cite **535**, **571–581**; not edited)
- [x] z-index stays **40** (above HUD 10 and scrim 20, below pause 50)
- [x] Node stays `document.body` child (`agent-api.js` **566**; CSS does not reparent)
- [x] No persist of top/right/width/z-index (no JS, no `localStorage`)
- [x] `max-height: calc(100vh - 156px)` with `top: 140px` keeps the same 16 px bottom inset as the old `100vh - 32px` at `top: 16px` (does not grow into PWR)
- [x] No write to `flags.paused`
- [x] Missing Manifest cannot throw from CSS
- [x] `?agent=1` opt-in gate unchanged (no `agent-api.js` write)
- [x] Buttons stay `type="button"` min 44 px (CSS unchanged; JS cite only)

### Recommendations

1. Keep z-index 40 in later stills. Do not drop under the scrim.
2. Do not parent the badge under `#hud` to inherit tokens.

### Re-review

First pass found no HIGH/CRITICAL. No product CSS change after the audit. This report is the final security review.
