# UI Audit: remaining NAV leftover after NAV-07 brief (Wave 122)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live Galaxy Chart + Autopilot chip + HUD nav readout already meet NAV-01..07. Digit theft is **not** proposed (Blocker if a later serial adds a NAV Digit). Hub theft is **not** proposed. Specified later UI is the **existing** chart / AP — CONSUME means **do not add chrome**.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Reuses live Galaxy Chart dialog (`role=dialog`, `aria-modal=false` so flight continues) (`galaxychart.js` **129–136**).
- Real `<button>`s: Clear route, Autopilot, Close (`150–178`). HUD Cancel is a real button (`hud.js` **1072–1076**).
- Dest path is a labeled `<select id="rw-galaxy-dest">` with visible `<label htmlFor>` (`galaxychart.js` **194–203**). Keyboard plot does not need SVG tabindex (NAV-07 freeze).
- Labels are `textContent` names with `data-system-id`; CSS `pointer-events: all` (`340–350`; `hud.css` **2165–2171**).
- Hover strip is reserved under the SVG, `role=status` `aria-live=polite`, inspect only (`galaxychart.js` **374–387**, **754–758**).
- AP live region `#rw-galaxy-ap-live` polite `textContent` (`157–162`, **644–647**). Refuse English stays on the open chart.
- Autopilot **button** success closes the map and prefers HUD Cancel focus (`704–719`) — NAV-06 product path.
- KeyM skips typing/`SELECT`; Escape still closes (`764–787`).
- MATCH refuse is explicit English, not a silent dim-only fail (`autopilot.js` **22**, **184**).
- Empty 80 px hub stays empty (`hud.css` **184–193**). Aim-glass gauges stay off.
- Digit 0 stays shipyard; 8/9 stay launch/epics (`station.js` **188`). NAV is not a Digit.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Hover strip is pointer-only; dest `<select>` does not announce Control/Standing

**Location:** `galaxychart.js` **742–746** vs **439–460**

**Issue:** Keyboard plot via Destination does not paint `.rw-galaxy-hover`. A keyboard user gets plot, not the hover inspect lines.

**Fix:** Do not invent leftover chrome. NAV-07 named dest as the keyboard **plot** path. Hover remains pointer inspect (NAV-04). CONSUME forbids new inspect UI. Owner may later ask dest-change to call `applyHoverId`; that is **not** this freeze.

**Status:** accepted — not a missing NAV-01..07 hole; CONSUME stands.

#### 🟡 Minor: Chart labels exist only for authored ∪ pinned ∪ hub

**Location:** `galaxychart.js` **340** vs dest options **209–227** (all charted)

**Issue:** Generated systems have hit discs + dest `<select>` but no SVG name glyph.

**Fix:** Do not require 101 SVG labels as leftover PR1. NAV-07 already chose dest list for generated dests. CONSUME forbids extra label chrome.

**Status:** accepted — dest list covers keyboard names; CONSUME stands.

#### 💡 Suggestion: Autopilot button `aria-disabled` vs `disabled`

**Location:** `galaxychart.js` **662–688**

**Issue:** No-route uses real `disabled`. Refuse-token uses `aria-disabled` + `is-dim` so click can still show live English. That split is live NAV-03/05 chrome, not a remaining hole.

**Fix:** Do not retune as leftover. Cite only.

**Status:** accepted — out of scope.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true missing-NAV census, PR1 (named only then) must:

- Keep real buttons, dest `<select>` + visible label, `textContent`, polite AP live region, KeyM typing skip, Escape close, HUD Cancel, empty hub
- Must not steal Digit 0/8/9, must not `innerHTML` names, must not autofocus trap the sim, must not raise overlay z, must not add hub chrome or a PPI

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
