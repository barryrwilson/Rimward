# UI Audit: Wave 122 remaining TGT leftover (CONSUME freeze)

**Scope:** leftover freeze only. No product UI change this wave. Audit the census claims against live targeting HUD so a later worker does not “fix” CONSUME with extra chrome.  
**Method:** self-applied orchestrator `ui-audit.md` checklist. Do not spawn `[designer]`.  
**Date:** 2026-08-25. Second pass: still 0 Blocker/Major. Minors stay documented as not leftover.

## UI Audit: remaining TGT player-facing targeting

### Summary

Player-facing TGT leftover is **gone**. Contacts arc, lock edge-arrow, DIST/CLOS, MATCH, lead/RANGE, Incoming dart./fire. toasts, ENGINE bar, and KeyV lock already paint the jobs wishlist still names. Freeze CONSUME. Do not add a PPI, a hub gauge, or a second incoming live region. No Blocker. No Major.

### What's done well

- 80 px hub stays empty of radar/CLOS/ENGINE (`hud.css` 184–193 vs tgt rail 929–942).
- Color is not the only cue: MATCH **word**, RANGE **word**, CLOS **signed number**, contact **shape** (tick/chevron/diamond), FORE/AFT **words**, toast **copy**.
- Contacts sit bottom-center, not on the aim column (`hud.css` 787–796).
- Edge-arrow parks docked/jumping so jump chrome is not two triangles (`hud.js` 1418–1420).
- Incoming warnings reuse HUD-04 top-right polite chips, off the aim column.
- Scanner 0 still shows DIST/CLOS/lead/MATCH — core readouts are not upgrade-gated (TGT-01 override).
- Reduced-motion already kills HUD animation (`hud.css` 1186–1189). Mk II «/» is text, not a pulse leftover.
- KeyT/V/K/X remain distinct jobs (cycle / reticle / engine / MATCH).

### Findings

#### 🟡 Minor: Contacts arc and edge-arrow are `aria-hidden`

**Location:** `src/systems/hud.js` 816–817, 877–878  
**Issue:** Sighted players get bearing + off-glass lock. AT does not hear the arc or triangle.  
**Why it is not leftover:** Owner froze contacts as a picture, not a live region. Incoming fire already announces on the toast stack. Adding assertive radar speech would fight HUD-04 “no second live region.”  
**Fix:** **Do not** name TGT-06 PR1. Owner may file a later a11y idea in the inbox (other worker).  
**Status:** documented — not leftover.

#### 🟡 Minor: RANGE pop uses display none / border change

**Location:** `hud.css` 195–219  
**Issue:** In-range is ring weight + RANGE word. Color-blind still has the word.  
**Why it is not leftover:** TGT-01 already ships the word. HUD-03 KeyO color-blind remap is sibling CONSUME.  
**Fix:** Do not invent a hub gauge.  
**Status:** documented — not leftover.

#### 💡 Suggestion: Do not fold NAV-02 gate cue into lock arrow

**Location:** `hud.js` 818–822 vs 816  
**Issue:** Two chevrons exist (route vs lock). Merging them would mix jobs.  
**Fix:** Keep split. Inventory already walls this.  
**Status:** already frozen.

### Accessibility

- [x] Incoming dart/fire ride `role=status` `aria-live=polite` toast stack
- [x] No `aria-live=assertive` required for leftover
- [x] Freeze forbids a **new** live region and forbids incoming gauge
- [x] Contrast / scale / reduced-motion inherit HUD-03 KeyO (cite sibling)
- [x] Hit targets: contacts/edge/lead `pointer-events: none` (correct; not controls)
- [x] KeyT/V/K/X remain keyboard reach; Digit 0/8/9 not stolen
- [x] Chart labels out of scope (NAV-07)

### Theming

Live tokens via `#hud` CSS variables (`--cyan`, `--amber`, `--dim`). No new leftover chrome. HUD-02 `data-class-key` is sibling — do not restyle targeting leftover by class.

### Responsive / states

Contacts width `min(400px, 46vw)`. Rails sit off reticle. Jump/dock hide arc and lock arrow. Scanner 0 hides arc only. Combat dims non-critical panels; targeting set stays.

### Visual hierarchy

Hub empty → lead/RANGE on glass → rails DIST/CLOS/ENGINE off-column → contacts bottom → toasts top-right. CONSUME keeps that split. A PPI would flatten hierarchy onto the aim glass.

### Verdict

**CONSUME freeze is the UI-correct outcome.** Do not add a hub PPI, an incoming gauge, a lock box, or a second arrow class.
