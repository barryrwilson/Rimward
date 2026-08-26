# UI Audit: Hail01 pirate demand card / toast copy (Wave 126)

### Summary

Player-facing leftover is the incoming **demand hail card** plus keyed **outcome/announce toasts**. Live HEAVE-TO toast names no ship, no range, no deadline, no verb. Live Wave 30 card already names the speaker and pay/refuse verbs **when it opens**. PR1 must make every pirate demand show source + timer + compliance + a close that the player can read. No new Digit. Color is not the only cue.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` and `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`. Did **not** skip: demand copy is UI. Did not spawn a designer agent. Did not start Vite/Chrome.

### What's done well

- Live card header `HAIL — ${speaker}` via `textContent` (`hail.js` **369**).
- Buttons are real `<button>` elements with `[n]` + verb (`hail.js` **406–421**).
- Digit 1..n already resolve while the card is open (`hail.js` **431–447**; `hailDigitsAllowed`).
- Hail root `pointer-events:none` except the card (`hail.js` **118–125**) so the canvas is not a hidden hit target around the card.
- Toasts: `role=status` `aria-live=polite`; expire `aria-hidden` (`hud.js` **846–847**, **1243**); `textContent` (**1210**).
- Overlay mutex already prevents hail Digit resolve under chart/berth (`hailDigitsAllowed`).
- Wave 30 numbering kept: pay / teeth / refuse — PR1 does not invent a fourth Digit.

### Findings

#### 🔴 Blocker: HEAVE-TO toast is unusable as a demand

**Location:** `npc.js:1688` `'Heave to. Cargo or hull.'`; `hud.js:568` toasts `e.text` only  
**Issue:** Inbox: toast names no ship, range, deadline, or way to comply. Screen-reader/status chip is a sentence with no actor. Player cannot comply from the chip. It dies at 4 s with no outcome (`hud.js` **64**, **1237–1244**).  
**Fix:** PR1 authored announce: `{name} — heave to. Pay {n} UU or fight. {t}s.` Card is the compliance path. Suppress nameless HEAVE-TO as a second channel. `textContent` only.  
**Status:** **resolved** in contract §0.1 later copy (live string stays until PR1 — expected).

#### 🟠 Major: Jump/dock/timeout have no named close

**Location:** `hail.js:497-500` silent `closeCard`; no dock listener; no deadline UI  
**Issue:** Gate jump removes the card mid-choice with no resolution copy. Dock can leave the card up. Timer does not exist, so “expired silently” is the 4 s toast, not a demand clock. Keyboard users lose the only verbs (the buttons) with no replacement name.  
**Fix:** Authored outcome toasts (`docked` / `jumped` / `expired` / `voided` / paid/refuse). Card line includes `{t}s`. Color is not the only cue.  
**Status:** **resolved** in contract toast table + card line.

#### 🟠 Major: Illyx “demand” has no tribute card — copy must not lie

**Location:** Illyx `updateDuel` telegraph `npc.js:2158` `'Run if you like.'`  
**Issue:** Playtest expected a pay-or-fight card. Census: ace is not a pirate demand. If PR1 reuses pirate HEAVE-TO on Illyx, the player will look for Pay tribute that does not exist.  
**Fix:** Deputize: no Illyx tribute card; do not reuse pirate HEAVE-TO on ace. Ace recognition lines already differ.  
**Status:** **resolved** in contract Illyx row.

#### 🟡 Minor: Button can show `null UU`

**Location:** `hail.js:331` ``Pay tribute — ${h.demand} UU``  
**Issue:** Unreadable / untrustworthy if demand is null/NaN.  
**Fix:** Finite integer from clamp.  
**Status:** accepted — PR1 clamp (security + copy).

#### 🟡 Minor: Card timer refresh vs `reducedMotion`

**Location:** later card line `textContent`  
**Issue:** A flashing timer would fight `reducedMotion`. Inbox needs a visible deadline, not a pulse.  
**Fix:** Contract: timer is text; no demand animation. Refresh the existing line node.  
**Status:** accepted — PR1 acceptance.

#### 🟡 Minor: Toast contrast / linger

**Location:** HUD-04 8 s linger; 4 s visible (`hud.js` **64–66**)  
**Issue:** Outcome toast must be readable once. Do not add slots or raise z. Same-key linger must not hide a **different** outcome (key includes outcome text).  
**Fix:** Stable key per copy row (`cls + '|' + text` live). Different outcomes are different text. Do not reopen flood.  
**Status:** accepted — HUD-04 stay.

#### 💡 Suggestion: Range in announce

**Location:** inbox asked for range  
**Issue:** 20 s timer + named ship may be enough; printing `{range} u` can fight HUD-06 / targeting readouts.  
**Fix:** Deputize: timer + name + UU; do **not** add a hub range pip. Optional `{t}s` is the urgency. Owner may add range in copy later without HUD layout.  
**Status:** optional; not required PR1.

### Accessibility checklist (later PR1)

- [x] Source ship named in text (card + toast)
- [x] Deadline named in text (`{t}s`)
- [x] Pay / teeth / refuse named buttons; Digit 1..n stay hail resolve
- [x] Dock/jump/expire/void named outcomes (not color-only)
- [x] No new Digit
- [x] No Enter bind
- [x] `textContent` / `el()` only
- [x] Toasts stay `role=status`; expire `aria-hidden`
- [x] Hail/chart/berth not paused
- [x] Aim-glass gauges stay off; no hub pip
- [x] Hail02 KeyH-on-friendly copy not added

### Verdict

UI freeze is rail-legal. Later copy is specified. Live card is the right chassis. Live HEAVE-TO chip is **not** a complete demand UI. Serial **PR1**.
