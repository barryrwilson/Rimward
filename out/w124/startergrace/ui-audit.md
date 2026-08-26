# UI Audit: AI-05 starter grace brief (Wave 124)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: PR1 has **no new chrome**. “No HUD pip” is **correct**. Grace is the **absence** of unsolicited acquire, not a status widget. Existing origin toast and telegraph `commLine` stay. Digit theft is **not** proposed (Blocker if a later serial adds a grace Digit). Hub theft is **not** proposed.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome. Did **not** skip because a designer agent type is unavailable.

### What's done well

- Empty 80 px hub stays empty (`hud.css` **184–193**). No SAFE pip, countdown ring, or law-zone gauge inside `.rw-reticle`.
- Origin confirm already toasts via existing HUD: `✦ ` + origin line (`hud.js` **577–578**). PR1 does not add a second first-minute dump (P2 encyclopedia is a different inbox item).
- Telegraph copy is live `textContent` through `commLine`: `Heave to. Cargo or hull.` / `Run if you like.` (`npc.js` **1669**, **335–337**; `hud.js` **560–568`). PR1 gates acquire so those toasts should **not** start during extra/death windows.
- Digit 0 stays shipyard; Digit 8/9 stay launch/epics (`station.js` **188**). Death overlay Digit1 skip stays (`save.js` **1342**) and is not a new Digit.
- Reduced-motion: leftover adds no motion chrome. Existing telegraph glow already respects `reducedMotion` (`npc.js` **1671**).
- `innerHTML` absent on proposed later UI. No later toast in PR1.
- Collector inbound toast is **explicitly not this pack** (hail-card / extra chrome steal).

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Players get no explicit “you are in grace” cue

**Location:** HUD-01 hub `hud.css` **184–193**; deputize PR1 no chrome

**Issue:** A Greenhand may not know why Illyx is quiet for 180 s. A later worker could “help” with a hub SAFE pip or a countdown.

**Fix:** Do not invent leftover chrome. Quiet rim is the cue. A pip would steal HUD-01 and compete with the P2 encyclopedia dump. Owner may add a one-line toast in another pack; color must not be the only cue.

**Status:** accepted — no-pip is the freeze; not a missing HUD-01 hole

#### 🟡 Minor: Sibling hail toast can still name no ship if acquire is not gated

**Location:** inbox P1 (`PLAYER-EXPERIENCE-WISHLIST.md` **140–147**); `npc.js` **1669** vs `hail.js` **454–470**

**Issue:** If a later impl delays acquire but still `say()`s the heave-to line, the playtest toast-without-card returns during grace.

**Fix:** PR1 gates acquire/demand/duel **before** telegraph. Remaining toast-without-card after grace is P1 hail lifecycle — call out, do not design cards here.

**Status:** accepted — sibling; acquire gate is the AI-05 fix

#### 💡 Suggestion: Optional later Dresk inbound toast

**Location:** task honor; `world.js` **957** inject

**Issue:** Ledger Debt players may want a line that the collector is inbound. That is allowed **later**, not this pack’s hail card.

**Fix:** If another pack adds it: one `commLine`, `textContent`, name “Collector Dresk”, no hub pip, no Digit.

**Status:** accepted — out of PR1

### Specified later UI (PR1)

**Later UI = none.** PR1 must:

- Keep empty 80 px hub, existing `originChosen` / `commLine` toasts, `textContent`, Digit 0/8/9
- Must not steal Digit 0/8/9, must not `innerHTML` names, must not add hub chrome or a grace gauge, must not add hail cards, must not add encyclopedia slides

Accessibility of “no pip”: the player’s cue is **combat not starting** (no telegraph flash, no heave-to toast, no hail card). That is perceptible without color. Keyboard reach unchanged (no new control). Focus rings n/a.

**Re-audit after markdown lock:** still no Blocker/Major. No-pip freeze stands.
