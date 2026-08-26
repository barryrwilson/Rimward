# UI Audit: remaining PHY leftover after PHY-05 brief (Wave 123)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live bounce, star-heat toasts, and NPC avoid already meet PHY-01..05. Digit theft is **not** proposed (Blocker if a later serial adds a PHY Digit). Hub theft is **not** proposed. Specified later UI is the **existing** bounce / heat / avoid — CONSUME means **do not add chrome**.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Empty 80 px hub stays empty (`hud.css` **184–193**). RANGE remains the TGT-01 token (`hud.js` **781`). No collision pip, keep-out ring, or heat gauge inside `.rw-reticle`.
- Star danger uses existing HUD toasts, not a new live region: `▲ STAR HEAT — turn away.` and `✕ The star took the ship.` (`hud.js` **656–659**). Heat is throttled 2.5 s (`combat.js` **164**, **1886–1888**).
- Bounce scrape does not spam: `bodyHit` toast only when `damage > 0` (`hud.js` **660–662**); low-speed slide emits damage 0 (`ship.js` **933–936**; `combat.js` **1848**).
- Digit 0 stays shipyard; Digit 8/9 stay launch/epics (`station.js` **188**, **6171–6176**). PHY is not a dock verb.
- Avoid / pad-home add **no** DOM. Frame hold and two-sample are steering math (`npc.js` **605–703**, **781–839**).
- Reduced-motion: NPC death chips skip when `reducedMotion` (`npc.js` **2232**); this leftover does not add motion chrome.
- `innerHTML` absent on PHY surfaces. Toasts go through existing HUD `text` mapping.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Star heat is toast, not an aim-glass gauge

**Location:** `hud.js` **656–657** vs empty hub `hud.css` **184–193**

**Issue:** Wishlist PHY-03 wants danger telegraphed clearly enough to escape. Live telegraph is a throttled toast, not a hub heat pip.

**Fix:** Do not invent leftover chrome. HUD-01 empty hub and “aim-glass gauges stay off” forbid a heat gauge. Toast + lethal packet already telegraph. CONSUME forbids new inspect UI.

**Status:** accepted — not a missing PHY-03 hole; CONSUME stands.

#### 🟡 Minor: Avoid has no visible keep-out ring

**Location:** `npc.js` **643–703**; hub `hud.css` **184–193**

**Issue:** A later worker could “help” traffic by drawing station cylinders on the glass.

**Fix:** Do not add a keep-out overlay as leftover. Collision is the safety net; avoid is steering. HUD-01 forbids the pip.

**Status:** accepted — CONSUME stands.

#### 💡 Suggestion: `bodyHit` with damage 0 stays silent

**Location:** `hud.js` **660–662**; `ship.js` **933–936**

**Issue:** Low-speed slides have no toast. That is live PHY-01 “slide only below 8”.

**Fix:** Do not add a scrape pip as leftover. Wave 112 keeps the linear curve.

**Status:** accepted — out of scope.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true missing-PHY census, PR1 (named only then) must:

- Keep empty 80 px hub, existing sunHeat/sunKill toasts, `textContent`, Digit 0/8/9
- Must not steal Digit 0/8/9, must not `innerHTML` names, must not add hub chrome or a collision pip, must not add an aim-glass heat gauge

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
