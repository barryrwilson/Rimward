# UI Audit: HUD-06 persistent home-station marker (Wave 126)

### Summary

Player-facing leftover is a HUD pad cue: POS `HOME` distance + on-glass square pip + off-screen home chevron. Live HUD leaves 8,900 u drifters with XYZ only. PR1 must not occupy the 80 px hub, must not look like the amber threat arrow, and must keep distance **text**. Color is not the only cue.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` and `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`. Did **not** skip: the marker is player-facing HUD. Did not spawn a designer agent. Did not start Vite/Chrome.

### What's done well (live neighbours to match)

- Reticle hub is 80 px, RANGE only (`hud.css` **184-218**). Combat rails sit off center (`hud.js` **916-917**).
- Chartmarks already pair **shape + name + distance** and skip animation (`hud.css` **597-598**; `hud.js` **1847-1858**).
- NAV-02 gate cue uses **two ticks + notch**, not a triangle (`hud.css` **1014-1050**).
- TGT off-screen arrow is amber triangle (`hud.css` **576-594**) — reserved threat language.
- Dock prompt is named `J` / `Dock` in zone (`hud.js` **2169-2170**).
- `#hud` is `pointer-events:none` except AP/AM/controls (`hud.css` **5-7**). Home mark must stay inert.
- Color always pairs with text/shape (`hud.css` **1-4**).
- Toasts sit `right:168px` off the aim column (`hud.css` **635-638**).

### Findings

#### 🔴 Blocker: Empty 80 px aim glass must stay empty
**Location:** `hud.css:184-193`; HUD-01 honor  
**Issue:** A compass, range ring, or HOME glyph in `.rw-reticle` is an aim-glass gauge. Inbox is “where is the pad,” not a reticle child.  
**Fix:** POS `HOME` row + world-projected pip/chevron. No hub child.  
**Status:** **resolved** in contract §0.2 (live stays until PR1 — expected).

#### 🟠 Major: Threat triangle is the wrong glyph
**Location:** `hud.css:585-594` `.rw-edge-arrow::before` amber  
**Issue:** Playtest: “Threats get an edge arrow; the station does not.” Recoloring that triangle still reads as incoming danger, especially in color-blind / combat.  
**Fix:** New square beacon + distinct chevron. Cyan/dim tokens, not threat amber. Shape carries meaning.  
**Status:** **resolved** in deputize on-screen/off-screen rows.

#### 🟠 Major: Distance must be text, not color/position only
**Location:** inbox 8,900 u; POS today XYZ `hud.js:1986`  
**Issue:** An edge pip without numbers returns the player to mental trig on XYZ. Color-only bearing fails color-blind.  
**Fix:** Mandatory POS `HOME` + `Nu`/`N.Nk`. Pip label may repeat dist. `aria-hidden` on the decorative chevron **only if** POS HOME is visible.  
**Status:** **resolved** in contract §0.14, §2 partial-merge forbidden.

#### 🟠 Major: Overlay cards must not fight the pip
**Location:** hail z 40 `hail.js:118`; chart z 30; berth z 60; demand copy sibling  
**Issue:** A world-projected mark will paint through/around hail demand and berth desk. Inbox did not ask to decorate those cards.  
**Fix:** Hide on `hailOpen` / `chartOpen` / `berthOpen` / docked / jumping.  
**Status:** **resolved** in hide table.

#### 🟠 Major: Do not stack on HUD-01 empty glass or combat rails
**Location:** rails `hud.js:916-938`; hair-off **1438-1454**  
**Issue:** A large labeled diamond at center-screen competes with bracket/lead.  
**Fix:** Small square; edge inset 108 off TGT/NAV-02 seat; hide on-glass when station is the lock (bracket already has name+dist).  
**Status:** **resolved**

#### 🟡 Minor: Combat fade
**Location:** `#hud.in-combat .rw-chartmark { opacity: 0.14 }`  
**Issue:** Far-pad nav during combat will dim. Consistent with non-critical set.  
**Fix:** Same 0.14 on `.rw-home-mark`. POS already `rw-fade`. Do not promote HOME onto tgt DIST rail.  
**Status:** accepted.

#### 🟡 Minor: Long station names
**Location:** `ctx.station.name`  
**Issue:** POS row can overflow `sideCol`.  
**Fix:** `stripHudText`; CSS `ellipsis` like nav dest (`hud.css:1005-1009` pattern). `textContent` only.  
**Status:** accepted — PR1 CSS; not a live hole.

#### 🟡 Minor: `reducedMotion`
**Location:** contacts pulse skip `hud.js:1617`; chartmarks already static  
**Issue:** A pulse on HOME would fight KeyO reduced motion.  
**Fix:** No `@keyframes`. No `is-enter`. Transform only.  
**Status:** **resolved** in contract §0.13.

#### 💡 Suggestion: Do not add a sixth toast
**Location:** HUD-04 five slots `hud.js:63-66`  
**Issue:** “You are 8.9k from home” as a toast floods the channel.  
**Fix:** Instrument only. Contract §0.11.  
**Status:** locked.

### Accessibility checklist (later PR1)

- [x] Distance named in text (`HOME` + `u`/`k`)
- [x] Color is not the only cue (square vs triangle vs gate ticks)
- [x] On-glass mark `pointer-events: none`
- [x] Chevron `aria-hidden` only with POS HOME visible
- [x] No new Digit
- [x] No pulse when `reducedMotion`
- [x] `textContent` / `el()` only
- [x] Aim-glass gauges stay off; no hub child
- [x] Hide under hail/chart/berth/dock/jump
- [x] Do not steal NAV-02 GATE copy or TGT TARGET copy
- [x] Do not steal Agent API badge seat

### Verdict

**Approve freeze** as the UI contract for later PR1. Live hole remains until that serial. Do not implement in Wave 126.

### Re-review (after freeze)

No remaining Blocker/Major in the **design**. Live HUD still lacks the mark (expected). Glyph, text cue, hub, overlay hide, and lock de-stack are locked in merge law.
