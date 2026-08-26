# UI Audit: Hail01 pirate demand card / toast copy (Wave 126 leftover)

**Auditor:** `[designer]` (parent scratch; not product source)  
**Scope:** leftover freeze copy + live hail/demand surfaces. Review only. Did not edit `docs/Hail01DemandLifecycleDesign.md`, `out/w126/demand/**`, or `src/`. Did not start Vite/Chrome.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md`, `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.

**Verdict:** **OPEN**

Live leftover is **REAL**. Freeze later copy is named and rail-legal. Product UI still ships nameless HEAVE-TO, silent jump/dock/timeout close, and no demand clock. Worker `out/w126/demand/ui-audit.md` marked those holes **resolved in contract** — that is spec, not DONE. Serial **PR1** must land copy + close together.

---

## UI Audit: pirate demand hail card + keyed toasts

### Summary

Wave 30 demand **card** already names the speaker and pay/teeth/refuse verbs when it opens. Hunt telegraph toast does not. Jump/dock/expire hide or linger with no named outcome. Freeze card line `{name} heaves to — {n} UU or hull. {t}s.` plus keyed `{name}` toasts close that copy hole **if** PR1 writes them with `textContent` and does not pause the sim. Until then, findings stay **OPEN**.

### What's done well

- Freeze card line names speaker, UU, and seconds (`out/w126/demand/shared-contract.md` **97**). Matches parent freeze: `{name} heaves to — {n} UU or hull. {t}s.`
- Freeze outcome toasts all include `{name}` (`shared-contract.md` **100–112**): announce, paid, bluffed, failed, refused, expired, docked, jumped, voided.
- Freeze forbids `innerHTML` / `insertAdjacentHTML` / `document.write` (`shared-contract.md` **24**; design doc **119**). Live hail already uses `textContent` / `el()` (`hail.js` **364–375**, **412**; `hud.js` **1210**).
- Freeze forbids overlay pause (`shared-contract.md` **7**, **88**; `hail.js` **18–20**; `overlay-policy.js` **4**). Demand close is not Pause. Copy must not say Pause (`shared-contract.md` **114**).
- HUD-01 empty hub stays empty. No demand pip on the aim glass (`shared-contract.md` **22**; design doc **13**).
- Digit 1..n on an open demand card stay hail resolution (`hail.js` **431–447**; `overlay-policy.js` **175–185**; contract **22**). No new Digit. No Enter bind.
- Wave 30 button verbs stay: Pay tribute / Show teeth / Refuse (`hail.js` **330–335**; `npc.js` **1478–1482**).
- Illyx freeze does **not** lie: ace duel, no `payTribute` card, do not reuse pirate HEAVE-TO on ace (`shared-contract.md` **80**; `world.js` **408–414**; `npc.js` **2042–2186**).
- Hail root `pointer-events:none` except the card (`hail.js` **118–125**). Canvas around the card is not a hidden hit target.
- Toasts: `role=status` `aria-live=polite`; expire `aria-hidden` (`hud.js` **846–847**, **1243**). HUD-04 8 s identical-key linger stays (`hud.js` **66**, **1189**).
- Timer later is text on an existing line node, not animation (`shared-contract.md` **15**, **17**). `reducedMotion` is not a pulse clock.

### Findings

#### 🔴 Blocker: Nameless HEAVE-TO toast is not a demand

**Location:** `src/systems/npc.js:1688` `'Heave to. Cargo or hull.'`; `src/systems/npc.js:354–355` `say` emits `from` then HUD drops it; `src/systems/hud.js:560–568` `commLine` toasts `e.text` only  
**Issue:** Telegraph chip names no ship, no UU, no deadline, no comply verb. Screen-reader status is a sentence with no actor. Player cannot pay from the chip. Toast dies at 4 s (`hud.js` **64**, **1237–1244**) with no outcome. This is the inbox hole. Live Wave 30 card is a **second** channel after 600 u (`npc.js` **2036**); HUD does **not** toast `hailOpened` (`hud.js` **677–678**). Freeze later announce `{name} — heave to. Pay {n} UU or fight. {t}s.` is specified (`shared-contract.md` **103**) but **not live**.  
**Fix:** PR1: suppress nameless HEAVE-TO as unpaid demand **or** replace with named demand-pending that is not a second compliance path. Card is compliance. One keyed announce toast. `textContent` only. Do not rewrite all `commLine` toasts (HUD-04).  
**Status:** **OPEN** (leftover REAL). Spec authored; `src/` unchanged.

#### 🟠 Major: Jump / dock / timeout have no named close

**Location:** `src/systems/hail.js:497–500` silent `closeCard` when `!ctx.ships.includes`; `src/game/jump.js:124–126` empties `ctx.ships` at midpoint (before hail `update`, `src/main.js` **123–129**); hail has **no** `systemLoaded` / `flags.docked` listener; demand has **no** `{t}s` line (`npc.js` **2036**; `hail.js` **375**)  
**Issue:** Gate jump removes the card mid-choice with no `hailClosed` and no toast. Dock can leave the card up (`npc.js` **1913–1915** `breakOff` does not clear `demanding`; hail does not hide on pad). Timer does not exist, so “expired silently” is the 4 s telegraph chip, not a demand clock. Keyboard users lose Digit 1..n verbs with no replacement name. Void-on-hit closes the card with no named `voided` toast (`npc.js` **2525–2530`). `refuseFight` stamps outcome but emits no `commLine` (`hail.js` **294–298**). Freeze table names `jumped` / `docked` / `expired` / `voided` (`shared-contract.md` **109–112**) but **partial merge is forbidden** (`shared-contract.md` **146**).  
**Fix:** PR1 together: card line `{name} heaves to — {n} UU or hull. {t}s.`; dock/jump/expire/void keyed toasts; emit `hailClosed` (or equal named toast if hull already gone); drop deferred hail on jump. Color is not the only cue. Do not write `flags.paused`.  
**Status:** **OPEN**.

#### 🟠 Major: Other-card steal drops a demand with no player name

**Location:** `src/systems/hail.js:459` `if (open) continue`  
**Issue:** A demand `hailOpened` while another hail is up is dropped, not deferred. Player never sees source, timer, or close. Contract says defer, do not `continue`-drop (`shared-contract.md` **88**). Calm skip can also leave `ai.demanding === true` with no card (`hail.js` **460–470**; contract **39**).  
**Fix:** Defer the demand. If the card cannot open or defer this frame, fail closed to a named outcome; do not leave demanding-without-surface.  
**Status:** **OPEN** (PR1 with lifecycle; not a separate Digit).

#### 🟡 Minor: Button can show `null UU`

**Location:** `src/systems/hail.js:331` ``Pay tribute — ${h.demand} UU``; debit `hail.js:253` `h.demand ?? 0` (NaN still poisons credits if demand is NaN)  
**Issue:** Unreadable / untrustworthy if `ev.demand` is null/NaN. Accessibility: the primary verb must name a finite amount.  
**Fix:** Finite integer from clamp; `demandMin` floor (`shared-contract.md` **36**).  
**Status:** **OPEN** (accepted as PR1 clamp; still live).

#### 🟡 Minor: Live demand card line still omits UU and seconds

**Location:** `src/systems/npc.js:2036` `'Your cargo or your hull.'`; `src/systems/hail.js:369` `HAIL — ${speaker}`; `hail.js:375` quoted line only  
**Issue:** Open card **does** name the speaker in the header. Inbox still asked for deadline and amount **in the demand line**. Buttons carry UU; the quote does not. No `{t}s`. Freeze replaces the quote with `{name} heaves to — {n} UU or hull. {t}s.`  
**Fix:** PR1 `textContent` on the existing line node; refresh remaining whole seconds; no flash.  
**Status:** **OPEN** (header is a partial save; line is not complete).

#### 💡 Suggestion: Do not print range on the hub

**Location:** inbox asked for range; freeze deputize omits `{range} u` (`shared-contract.md` **84–85**; design **63–67**)  
**Issue:** 20 s timer + named ship can carry urgency. A hub range pip fights HUD-01 / HUD-06.  
**Fix:** Keep timer + name + UU. Do not add an aim-glass pip. Owner may add range in copy later without HUD layout.  
**Status:** optional; not required PR1.

#### 💡 Suggestion: Card “or hull” vs toast “or fight”

**Location:** `shared-contract.md:97` vs **103**  
**Issue:** Two lawful strings. Not nameless. Slight verb split is readable (card = cargo/hull beat; toast = pay or fight). Do not dual-stack identical sentences in one frame (`shared-contract.md` **116**).  
**Fix:** Keep both if HUD-04 `frameLines` / same-key linger still apply. Do not invent a third HEAVE-TO channel.  
**Status:** optional.

### Explicit rails (no finding)

| Rail | Live / freeze | Cite |
|---|---|---|
| `innerHTML` allowed? | **No.** Forbidden later. Live hail/hud/npc demand path: none. | contract **24**; `hail.js` **364–412**; `hud.js` **1210** |
| Overlay would pause sim? | **No.** Never write `flags.paused`. | contract **7**; `overlay-policy.js` **4**; `hail.js` **18–20** |
| Illyx copy lie (tribute demand)? | **No** in freeze. Ace `'Run if you like.'` is duel telegraph, not pirate demand. | contract **80**; `npc.js` **2158**; `world.js` **411–414** |
| HUD-01 empty hub | Honored. No demand pip. | contract **22** |
| Digit 1..n hail resolve | Stays on open card. | `hail.js` **431–447**; `hailDigitsAllowed` **175–185** |
| Hail02 KeyH-on-friendly | Not this pack. | contract **11** |

### Accessibility checklist (later PR1)

- [ ] Source ship named in text on **telegraph/announce** (live: fail; freeze: specified)
- [ ] Deadline named in text (`{t}s`) (live: fail)
- [x] Source ship named on **open Wave 30 card** (`hail.js` **369**)
- [x] Pay / teeth / refuse named buttons; Digit 1..n stay hail resolve
- [ ] Dock/jump/expire/void named outcomes (live: fail)
- [x] No new Digit
- [x] No Enter bind
- [x] Freeze: `textContent` / `el()` only; innerHTML forbidden
- [x] Toasts stay `role=status`; expire `aria-hidden`
- [x] Hail/chart/berth not paused
- [x] Aim-glass gauges stay off; no hub pip
- [x] Hail02 KeyH-on-friendly copy not added
- [x] Illyx not labeled as tribute demand

### Severity mapping

🔴/🟠 = fix in **PR1** before reporting demand lifecycle DONE. 🟡 = PR1 clamp + card line. 💡 = document; do not block.

### Verdict

**OPEN.** Freeze copy is named, `textContent`-only, no overlay pause, no Illyx tribute lie, HUD-01 empty, Digit 1..n stay hail resolve. Live nameless HEAVE-TO and silent jump/dock/timeout remain **Blocker/Major**. Do not mark the leftover CONSUME. Serial **PR1**.
