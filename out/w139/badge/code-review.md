# Code Review: Agent play badge layout + a11y tokens leftover integrator

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `top: 16px` over Manifest `top: 14px` (`style.css` **39–43**; `hud.css` **1172–1176**), 280 px width crossing toast `right: 168px` (`style.css` **48**; `hud.css` **710–713**), and missing `body.rw-colorblind` / `body.rw-contrast` badge rules. Contract forbids CONSUME, HUD child, z-index drop, bottom-right pin, `hud.css` / `hud.js` / `agent-api.js` claims, persist geometry, and `innerHTML`. No Blocker/Major remain after offset + Manifest-column width + PWR-safe max-height + token mirrors in **one** `src/style.css` PR.

### What's done well

- Code-wins inventory with file:line for pin, mount, Manifest meters, toasts, PWR, RANGE, z-stack, Okabe-Ito `#hud` overrides.
- CONSUME path documented and rejected: PWR/RANGE clear is the previous pin, not this leftover.
- Two inbox items combined into one write-set (`style.css` only).
- Deputize both offset **and** width: inbox “or” is not enough to clear **both** Manifest and toasts.
- Partial merge named: offset without width leaves toasts; width without offset leaves Manifest; old max-height with new `top` can cover PWR.
- Fail-closed missing Manifest named before impl.
- PR5 body child explicitly kept. `docs/AgentApiDesign.md` not claimed.

### Findings

#### 🔴 Blocker: CONSUME would be wrong — **resolved in freeze**

**Location:** `style.css` **39–48** vs `hud.css` **1172–1176**, **710–713**; no badge palette selectors  
**Issue:** Previous DONE cleared PWR/RANGE. Manifest/toasts and a11y tokens still hole. Frozen **REAL** / **PR1**.

#### 🔴 Blocker: Top-right card still covers Manifest — **resolved in freeze**

**Location:** badge `top: 16px` `style.css` **39**; Manifest `top: 14px` `hud.css` **1173**  
**Issue:** Same corner; z-index 40 over HUD 10. Frozen: `top: 140px` (XL Manifest + gap).

#### 🟠 Major: 280 px width still covers toasts after offset — **resolved in freeze**

**Location:** `style.css` **48**; toasts `right: 168px` `hud.css` **713**  
**Issue:** A card from `right: 16px` that is 280 px wide occupies past `right: 168px`. Frozen: `max-width: min(148px, calc(100vw - 32px))`.

#### 🟠 Major: Raised `top` + old max-height can cover PWR — **resolved in freeze**

**Location:** live `max-height: calc(100vh - 32px)` `style.css` **49**; PWR bottom strip `hud.css` **1021–1025**  
**Issue:** `top: 140px` plus `100vh - 32px` overflows the viewport into the bottom HUD. Frozen: `max-height: calc(100vh - 156px)`.

#### 🟠 Major: Palette only on `#hud` — **resolved in freeze**

**Location:** `hud.css` **1234–1248**; badge local tokens `style.css` **33–37**  
**Issue:** Body-child does not inherit `#hud` custom properties. Frozen: `body.rw-colorblind .rw-agent-badge` and `body.rw-contrast .rw-agent-badge` with the live HUD values. Do not move the node under `#hud`.

#### 🟠 Major: Claiming `hud.css` / `hud.js` / `agent-api.js` — **resolved in freeze**

**Location:** honor later write-set  
**Issue:** Moving Manifest, adding a class, or remounting is HUD/Agent theft. Census: CSS offset is enough. Frozen: `src/style.css` only.

#### 🟠 Major: z-index drop or HUD child as “easy inherit” — **resolved in freeze**

**Location:** `style.css` **43**; mount `agent-api.js` **566**  
**Issue:** Easy steal. Frozen: z-index 40; body child stays.

### 🟡 Minor: Authored `140px` vs live `--rw-text-scale`

**Location:** `settings.js` **25**, **73**; Manifest type multiplies on `#hud` only  
**Issue:** XL Manifest is ~111 px tall plus `top: 14px`. 140 px includes gap. If a later HUD padding change grows Manifest, CSS will not auto-follow.  
**Justification:** No JS measure. No settings.js claim. Owner question #2: raise after still.

### 🟡 Minor: `initAgentApi` always mounts the card

**Location:** `agent-api.js` **706** vs `queryOptIn` **640**  
**Issue:** Query gates **optIn**, not DOM insert. Overlap can exist without `?agent=1`.  
**Justification:** Not this leftover. Do not reopen PR5. Inbox is layout + tokens.

### 🟡 Minor: `--rw-text-scale` does not multiply badge type

**Location:** `settings.js` **73**; Wave 134 ui-audit suggestion  
**Issue:** Large HUD type leaves badge at 12 px.  
**Justification:** Inbox P3 is palette. Do not steal text-scale into PR1.

### 💡 Suggestion: Optional PR2 still

One still: `?agent=1` flight, Manifest three meters readable, a toast at `right: 168px` readable, PWR and RANGE clear, colorblind title `#56B4E9`, contrast panel more opaque, z-index 40, buttons 44 px, hub empty, no pause.

### 💡 Suggestion: Keep two 44 px buttons wrapping

`flex-wrap` + `gap: 8px` already live (`style.css` **99–108**). 148 px inner width after padding still fits `44+8+44`. Do not drop min 44 px.

### Re-review (after freeze)

Offset + width + PWR-safe max-height + both palettes still land in one `src/style.css` PR. HUD-06 named cite-only (do not steal). No new Blocker/Major. Minor `140px` vs textScale and always-mount stay justified. No `src/` this wave.
