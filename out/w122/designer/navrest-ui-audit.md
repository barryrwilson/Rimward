# UI Audit: remaining NAV leftover after NAV-07 (Wave 122 designer)

**Auditor:** parent `[designer]` (independent of `out/w122/navrest/ui-audit.md`).  
**Wave:** 122 remaining NAV leftover census.  
**Domain:** leftover **CONSUME** markdown. Specified later UI is the **existing** Galaxy Chart / Autopilot. CONSUME means **do not add chrome**.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Coverage:** markdown pack + live hub cites. **No Playwright. No Vite. No Chrome.** `[NO BROWSER COVERAGE]`  
**Review only.** Did not edit product UI, honor docs, or worker pack files.

Pack cited (not edited): `docs/Nav08RemainingNavDesign.md`; `out/w122/navrest/current-nav-remaining-inventory.md`; `out/w122/navrest/shared-contract.md`; `out/w122/navrest/ui-audit.md`. Live hub: `src/systems/galaxychart.js`, `src/ui/hud.css` (plus MATCH/cite-only `hud.js` / `autopilot.js` / `nav.js` / `gate.js` / `station.js` as needed).

---

### Summary

No product UI ships this wave. The freeze is leftover **CONSUME**, named serial **none**. Live NAV-01..07 already give plot, guidance, Autopilot, hover, handoff, button close, and labels. This audit finds **0 Blocker** and **0 Major**.

CONSUME does **not** hide a real chart/AP accessibility hole that this leftover would have to ship. Keyboard plot already uses `#rw-galaxy-dest`. Autopilot refuse already uses polite English on `#rw-galaxy-ap-live`. HUD Cancel is a real labeled button. The freeze does **not** schedule teleport, hub PPI, Digit theft, persist-resume flying AP, or new chart chrome.

**Verdict: CLEAN.**

---

### What's done well

- Integrator brief Status is leftover **CONSUME** (`docs/Nav08RemainingNavDesign.md` **8–9**, **43**, **109–110**). Contract merge law matches (`out/w122/navrest/shared-contract.md` **4–7**, **67–74**). Inventory names **no remaining NAV leftover** (`out/w122/navrest/current-nav-remaining-inventory.md` **27–28**).
- Specified later UI is reuse, not a new surface (`docs/Nav08RemainingNavDesign.md` **236–241**, **229–233**). Contract additive punch is **None** (`out/w122/navrest/shared-contract.md` **63–71**).
- Chart root is `role=dialog`, `aria-modal=false` (flight continues), labelled and described (`galaxychart.js` **129–136**).
- Clear route, Autopilot, and Close are real `<button type="button">`. Close has `aria-label`. Autopilot has `aria-label` + `aria-describedby` the live region (`galaxychart.js` **152–178**).
- Destination is a visible `<label>` + `<select id="rw-galaxy-dest">`. Options use `textContent` after `sanitizeSystemId` (`galaxychart.js` **194–227**).
- Labels use `textContent` and `data-system-id`. CSS gives `pointer-events: all` and `cursor: pointer` (`galaxychart.js` **340–350**; `hud.css` **2165–2171**). Shared `activateSystem` on disc, label, and dest change (`galaxychart.js` **726–751**). `innerHTML` in `galaxychart.js`: **none**.
- Hover strip is reserved under the SVG (`role=status`, `aria-live=polite`). Hover does not plot (`galaxychart.js` **31–33**, **374–387**, **754–758**; `chart-hover.js` **6–8**, **28**). Idle hover stays in-flow (`hud.css` **2250–2253**) so SVG scale does not jump.
- `#rw-galaxy-ap-live` is polite `textContent` (`galaxychart.js` **157–162**, **644–647**). MATCH refuse English is explicit (`autopilot.js` **22**, **184**). Autopilot **button** success `setOpen(false)` then prefers HUD Cancel focus (`galaxychart.js` **704–719**). HUD Cancel is a real button (`hud.js` **1072–1076**).
- KeyM skips typing/`SELECT`; Escape still closes (`galaxychart.js` **764–787**; `overlay-policy.js` **72–80**).
- Chart buttons and dest list have hover and `:focus-visible` rings (`hud.css` **2003–2013**, **2052–2057**). HUD Cancel matches (`hud.css` **707–714**). Hit discs stay **24 CSS px** (`galaxychart.js` **48**, **513**).
- HUD NEXT/DEST/JUMPS live in a polite block; GATE distance stays visual (`hud.js` **1008–1026**). Off-glass cue is `aria-hidden` shape (`hud.js` **818–822**; `hud.css` **1014–1016**). In-world ring consumes `path[1]` (`nav-guidance.js` **1–12**).
- Empty 80 px hub stays empty (`hud.css` **183–193**). Digit 0 is shipyard; 8 is launch; 9 is epics (`station.js` **188**, **6033–6038**).
- Color is not the only chart cue (dash vs solid, hub ring, dest square). Contrast / colorblind / reduced-motion overrides exist (`hud.css` **1891–1897**, **2274–2308**).
- Restore never resumes flying AP: `writeNav` always `autopilot: false` (`nav.js` **48–55**, **191–192**). `ctx.autopilot` is live-only (`ctx.js` **96–105**). `flags.chartOpen` is session (`ctx.js` **208**). Jump emit stays `gate.js` `{ to: near.to }` (`gate.js` **672–678**). Autopilot compares dest; it does not assign `currentSystem` (`autopilot.js` **396**).

---

### Freeze schedule check (must stay false)

| Forbidden leftover | Freeze schedules it? | Cite |
|---|---|---|
| Teleport dest | **No** | contract **8**, **14**; brief **119**, **143**; inventory **196** |
| Persist-resume flying AP | **No** | contract **6**, **14**; `nav.js` **48–55** |
| Hub PPI / HUD-01 child | **No** | contract **2**, **14**; brief **233**; `hud.css` **184–193** |
| New Digit / steal 0/8/9 | **No** | contract **3**; brief **12**, **168**; `station.js` **188**, **6036** |
| New chart chrome | **No** | brief **236–241**; contract **63–71** “Additive PR1 **None**” |
| Dest-select hover leftover | **No** | contract **12**; brief **120** |
| `innerHTML` names | **No** | contract **4**; live grep 0 |

Blocker rule from parent: freeze would be Blocker if it scheduled hub theft, a new Digit, or new chart chrome while NAV-01..07 exist. **It does not.**

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Hover inspect is pointer-only; dest `<select>` does not paint Control/Standing

**Location:** `src/systems/galaxychart.js:742-746` vs `439-460`; dest change vs `754-758`  
**Issue:** Keyboard plot via Destination does not call `applyHoverId`. A keyboard user gets plot (NAV-07) and dest name in the list, not the hover Control/Standing lines.  
**Suggestion:** Do not invent leftover chrome. NAV-04 hover is pointer inspect. NAV-07 dest is the keyboard **plot** path. CONSUME forbids a dest-hover inspect UI (`docs/Nav08RemainingNavDesign.md` **120**; `out/w122/navrest/shared-contract.md` **12**).  
**Status:** accepted — not a missing NAV-01..07 hole. CONSUME stands. Does **not** hide an unusable control: plot, Autopilot, and Cancel remain reachable.

#### 🟡 Minor: SVG name glyphs exist only for authored ∪ pinned ∪ hub

**Location:** `src/systems/galaxychart.js:340-350` vs dest options `209-227` (all charted)  
**Issue:** Generated systems have 24 px hit discs and dest `<select>` names, but no SVG label glyph.  
**Suggestion:** Do not require 101 SVG labels as leftover PR1. NAV-07 already chose dest list for generated dests. CONSUME forbids extra label chrome (`docs/Nav08RemainingNavDesign.md` **120**).  
**Status:** accepted — dest list covers keyboard names. CONSUME stands.

#### 🟡 Minor: Chart header does not wrap Autopilot + Close on a narrow panel

**Location:** `src/ui/hud.css:1933-1947` (header `display:flex` without wrap); panel `1924-1925` `min(1100px, 92vw)`  
**Issue:** Title, `#rw-galaxy-ap-live`, Clear route, Autopilot, and Close share one row. At a small viewport the live English can compress. Buttons stay 24 px min-height (`1974-1987`). This is **live NAV-03/06 chrome**, not a leftover hole.  
**Suggestion:** Do not retune header layout as remaining-NAV PR1. CONSUME forbids new chrome.  
**Status:** accepted — out of leftover scope.

#### 💡 Suggestion: Autopilot `disabled` vs `aria-disabled`

**Location:** `src/systems/galaxychart.js:662-688`, click `691-702`  
**Issue:** No-route uses real `disabled`. Refuse-token uses `aria-disabled` + `is-dim` so click can still paint `#rw-galaxy-ap-live` English. That split is live NAV-03/05, not a remaining hole.  
**Suggestion:** Do not retune as leftover. Cite only.  
**Status:** accepted — out of scope.

#### 💡 Suggestion: Space on Autopilot buttons is swallowed

**Location:** `src/game/autopilot.js:225-228`; `galaxychart.js:173`; `hud.js:1075`  
**Issue:** `guardAutopilotSpace` `preventDefault`s Space so flight thrust is not stolen. Enter still activates the real buttons. Product split, not leftover.  
**Suggestion:** Do not add a leftover control. CONSUME forbids new chrome.  
**Status:** accepted — cite only.

#### 💡 Suggestion: Off-glass gate cue is `aria-hidden`

**Location:** `src/systems/hud.js:818-822`; names live at `1008-1026`  
**Issue:** Cue is a visual chevron (`hud.css:1014-1016`). NEXT/DEST/JUMPS already announce in a polite region. GATE distance sits outside that live block.  
**Suggestion:** Do not add a leftover ARIA name on the cue. TGT owns combat arrows; do not reuse `.rw-nav-gate-cue` (`docs/Nav08RemainingNavDesign.md` **256**).  
**Status:** accepted — NAV-02 already ships the named readout.

---

### CONSUME vs hidden a11y hole

Question: does CONSUME hide a real chart/AP hole that a remaining-NAV serial must fix?

| Surface | Live path | Hole? |
|---|---|---|
| Keyboard plot | labelled dest `<select>` | **No** — NAV-07 |
| Pointer plot | 24 px discs + clickable labels | **No** — NAV-01/07 |
| Autopilot refuse | polite English, not silent dim-only | **No** — NAV-03 |
| Autopilot stop | chart Cancel while open; HUD Cancel after button close | **No** — NAV-06 |
| Chart close | Close button, Escape, KeyM (not while typing) | **No** |
| Focus trap | none; `aria-modal=false`; blur on close | **No** — contract forbids autofocus trap (`out/w122/navrest/ui-audit.md` worker note; brief **48**) |
| Hover inspect for keyboard | dest does not paint hover | **Known split** — not leftover PR1 |
| Hub PPI | empty 80 px reticle | **Must not invent** |
| Digit NAV binding | 0/8/9 stay shipyard/launch/epics | **Must not invent** |

Worker self-audit (`out/w122/navrest/ui-audit.md`) also reports 0 Blocker / 0 Major. This pass agrees. It does not copy that file.

---

### Specified later UI (CONSUME)

**Later UI = none.** Reuse live Galaxy Chart + HUD nav readout + Autopilot chip.

If an owner re-opens after a **true** missing-NAV census, named PR1 then must:

- Keep real buttons, dest `<select>` + visible label, `textContent`, polite AP live region, KeyM typing skip, Escape close, HUD Cancel, empty hub
- Must **not** steal Digit 0/8/9
- Must **not** `innerHTML` names
- Must **not** autofocus-trap the sim
- Must **not** raise overlay z
- Must **not** add hub chrome, a PPI, teleport, or persist-resume flying AP

This pack must **not** land that PR1. Census did not prove a hole.

---

### Verdict

**CLEAN** — 0 🔴 Blocker, 0 🟠 Major.

Leftover **CONSUME**. Named serial **none**. Do not add chart chrome. Do not schedule hub theft, a new Digit, teleport, or persist-resume flying Autopilot.
