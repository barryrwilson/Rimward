# Code Review: Hail01 demand lifecycle design pack (Wave 126)

### Summary

Design-doc review of leftover census + merge law. Leftover **REAL** is correct vs live `hail.js` / `npc.js` / `hud.js` / `jump.js`. Contract correctly forbids CONSUME, overlay pause, Illyx tribute, Agent cheat, HUD layout steal, Hail02 steal, and persist clocks. No Blocker/Major remain after NaN clamp, demanding-without-surface, and jump-outcome locks.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. **Did not** edit `src/`.

### What's done well

- Inventory file:line cites match live code (telegraph **1688**, demand emit **2036**, silent `closeCard` **497–500**, jump ships empty **121–126**, Illyx ace **408–414**, HUD no `hailOpened` toast **677–678**, overlay never paused **4**).
- Two-channel model (telegraph vs Wave 30 card) explains playtest HEAVE-TO vs Ninth Tooth card without inventing a missing string in `src/`.
- CTL-02 collision is explicit: mutex/defer live, pause still forbidden.
- Write-set is `hail.js` + `npc.js`; `hud.js` listeners only; `controls.js` / `agent-api.js` excluded.
- CONSUME path documented as unexpected and **not** taken. Knobs deputized (20 s, dock close, jump `jumped`, Illyx duel). Do not park.

### Findings

#### 🔴 Blocker: Jump close has no `hailClosed` (census hole)

**Location:** `hail.js:497-500`; `jump.js:121-126`; `main.js:122-129`  
**Issue:** Midpoint clears `ctx.ships`, then hail `update` hides the card without `hailClosed` or `demandOutcome`. Inbox mid-choice close.  
**Fix:** Contract §0.1 Jump row + §0.14: named `jumped` before silent hide; drop deferred hail. Write-set hail.js + npc.js, not a second jump path.  
**Status:** **resolved** in `shared-contract.md` / `Hail01DemandLifecycleDesign.md`

#### 🔴 Blocker: NaN demand → NaN credits

**Location:** `state.js:1134-1136`; `npc.js:2032-2035`; `hail.js:253`  
**Issue:** Economy integrity. A later PR that copies live debit without a finite clamp ships NaN wallet.  
**Fix:** Contract §0.14 fail-closed clamp.  
**Status:** **resolved**

#### 🟠 Major: Other-hail `continue` drops demand (no surface)

**Location:** `hail.js:459`; `canShowHail` false path **470**  
**Issue:** Pirate stays `demanding` (weapons cold) with no card if another hail is open or calm refuses without defer. Inbox “compliance path” fails closed to a hidden parley.  
**Fix:** Defer when busy; if cannot open or defer, skip emit or named fail-close. Contract Overlay row + §0.14.  
**Status:** **resolved** this freeze (re-review after contract edit)

#### 🟠 Major: Nameless telegraph is a second unpaid demand channel

**Location:** `npc.js:1686-1688`; `hud.js:568`  
**Issue:** HEAVE-TO toast at 800 u has no source, timer, or verbs. Demand card is 600 u later. Jump/dock let the toast die at 4 s.  
**Fix:** Contract HEAVE-TO row: suppress or named pending; card is compliance.  
**Status:** **resolved** in contract §0.1

#### 🟠 Major: Illyx tribute would steal ace duel if “fixed” naively

**Location:** `world.js:408-414`; `npc.js:230-232`, `updateDuel` **2042+**  
**Issue:** Playtest asked for an Illyx card. Census: Illyx never emits demand. Bolting `payTribute` onto duel is a different game. Parking the knob is forbidden.  
**Fix:** Deputize **no** Illyx tribute. Ace telegraph is not pirate demand.  
**Status:** **resolved** — contract Illyx row

#### 🟡 Minor: Live pay `commLine` plus new outcome toast can double-speak

**Location:** `hail.js:261`, **277**, **290**; contract toast table  
**Issue:** Same-frame flavour + keyed toast can flood (HUD-04).  
**Fix:** Contract already: do not dual-stack identical sentences; HUD-04 same key / `frameLines`.  
**Status:** accepted — locked in contract; not a census bug.

#### 🟡 Minor: `h.demand` in button label can print `null`

**Location:** `hail.js:330-331`  
**Issue:** `Pay tribute — null UU` if emit omits demand. Clamp makes the label an integer.  
**Fix:** PR1 uses finite `demandMin` floor.  
**Status:** accepted — PR1 clamp.

#### 💡 Suggestion: Demand announce event vs tagged `commLine`

**Location:** `hud.js:557-678`  
**Issue:** Extending all `commLine` toasts with `from` would change every gate/arrival line (HUD-04 / HUD-05).  
**Fix:** Contract already prefers a demand-specific `toastForEvent` branch.  
**Status:** optional; already the freeze.

### Verdict

Pack is implementation-ready as **data**. Leftover **REAL**, serial **PR1**. Do not implement in Wave 126.
