# UI Audit: remaining REP leftover CONSUME (Wave 122) — designer

**Reviewer:** `[designer]` (independent of `out/w122/represt/ui-audit.md`).  
**Scope:** leftover **CONSUME** markdown. Specified later UI = **none**. Live Digit 9 Standing, hail leave **card absent**, covering / `No passage.` / restitution already paint.  
**Not in scope:** product `src/` edits; integrator docs edits; Playwright; Vite; Chrome.  
**Pack read (cite only):** `docs/Rep06RemainingRepDesign.md`; `out/w122/represt/current-rep-remaining-inventory.md`; `out/w122/represt/shared-contract.md`; `out/w122/represt/ui-audit.md`; live `station.js` Digit 9 / hail / commLine as needed.

### Summary

This pack freezes **CONSUME** and named serial **none**. It does **not** schedule a new Digit, a wanted meter, hail-leave chrome, or `patrol-employer-faction` UI. Live Digit 9 Standing plus `commLine` leave / covering / jump refuse already carry the player-facing law. CONSUME does **not** hide a real Standing or hail accessibility hole.

**Verdict: CLEAN** (0 Blocker, 0 Major).

### What's done well

- Digit 9 stays Standing. Dock root maps Digit 9 → `epics`, Digit 8 → `launch`, Digit 0 → `shipyard` (`station.js` **188**, **6034–6038**, keyboard **6169–6176**). No Law Digit is proposed.
- Standing pane is `renderEpics`: rank, ladder, restitution, move notes, climb notes, live consequences (`station.js` **5887–5945**). Copy is `h()` `textContent` (**4464–4468**). `innerHTML` in `station.js`: **none**.
- Live law copy is authored constants, not player HTML: leave `POLICE_LEAVE_LINE` (`police-leave.js` **5**, Digit 9 **1181**); covering `COVERING_LINE` (`police-cover.js` **6**, **1184**); jump `JUMP_REFUSE_LINE` (`jump.js` **7**, **1191**).
- Restitution states are explicit: Pay when offered; two-step Confirm + Esc cancel; “Not enough UU.” when short; RESTITUTION block hidden at standing ≥ 0 (`station.js` **5903–5924**, **5866–5885**, Esc **6186**). Real `<button type="button">` via `btn()` (**4471–4473**).
- Climb copy still paints after pay (`standingRemedialNotes` **1195–1203**, **5929–5938**). Path from 0 is readable without a new penance `kind`.
- Dock notice uses `aria-live="polite"` (`station.js` **6066–6068**). HUD toasts that carry `commLine` already use `role="status"` + `aria-live="polite"` (`hud.js` **843–847**). Leave / covering / `No passage.` therefore announce on the existing toast channel.
- Screen buttons have hover + `focus-visible` outline (`screens.css` **88–100**). Empty hub stays 80 px (`src/ui/hud.css` **184–189**). No wanted pip.
- Hail has **no** leave verb (`hail.js` `INTENT_ORDER` **58**). Wave 93 channel freeze matches CONSUME: no hail leave card.
- Patrol Compact +5 is named on Digit 9 and the jobs board (`station.js` **1156**, **1202**, **2113**, **3852**, **5130**, **5332**). That is unique-four honesty, not leftover police chrome.
- Freeze text forbids Digit steal, hub steal, wanted, hail leave, and `innerHTML` if an owner ever re-opens after a true missing-law census (`docs/Rep06RemainingRepDesign.md` **153–156**; `shared-contract.md` **§0.3–10**, **§3**).

### CONSUME vs a11y (Standing / hail)

Question: does CONSUME hide a real Standing or hail hole by refusing new chrome?

| Surface | Live channel | A11y now | Leftover hole? |
|---|---|---|---|
| Digit 9 Standing | Dock Digit 9 → `renderEpics` | Keyboard Digit 9; real buttons; `textContent`; polite notice | **No.** Pane already explains leave / covering / jump / restitution / climb. |
| Restitution Pay / Confirm | Digit 9 buttons + Esc | Visible labels; two-step; busy latch; short copy | **No.** Click + Tab + Enter reach the buttons. Esc cancels confirm. |
| `Leave this space.` | `commLine` once/visit (`police-leave.js` **121–124**) | Toast `aria-live="polite"` (`hud.js` **845–847**) | **No.** Missing hail card is Wave 93, not mute law. |
| `Patrol covering.` | `commLine` (`police-cover.js` **171–172**) | Same toast live region | **No.** |
| `No passage.` | `commLine` (`jump.js` **104–109**) | Same toast live region | **No.** Dock stays open (`station.js` `dock()` **6100–6116**, no standing gate). |
| Hail leave card | **Absent** (`hail.js` **58**) | Combat/salvage hail is a different family | **No.** Adding a police hail would be new chrome. CONSUME forbids it. |

A hail leave card would add numbered buttons, not repair a mute channel. Toasts already announce the three law lines. Digit 9 already lists the same lines for docked reading. That is enough for leftover CONSUME.

### Digit theft / wanted meter (Blocker test)

| Temptation | Freeze | Cite |
|---|---|---|
| New Law Digit | **No.** Digit 9 stays Standing. PR1 remaining REP **does not exist.** | `Rep06RemainingRepDesign.md` **27**, **138–139**, **165–166**; contract **§0.3**, **§3** |
| Steal Digit 0/8 | **No.** | contract **§0.3**; `station.js` **188** |
| `world.wanted` / crimeScore pip | **Forbidden** | contract **§0.5–8**; inventory **§0**, **§3** |
| Hub wanted pip | **No.** HUD-01 80 px empty | `src/ui/hud.css` **184–189**; brief **85** |
| Hail leave card | **No.** | contract **§0.10**; `hail.js` **58** |
| Patrol-employer chrome | **No.** Compact +5 is cite-only honesty | `station.js` **1156**, **1202**; brief **149–150** |

Blocker condition (“freeze schedules Digit theft or a wanted meter”) is **false**.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: police leave is toast, not a hail card

**Severity:** Minor  
**Location:** `src/game/police-leave.js:121-124`; `src/systems/hail.js:58`; `src/systems/hud.js:560-568`, `843-847`  
**Description:** The player in the hostile band hears **Leave this space.** once per visit on the comm toast. There is no numbered hail with Leave / Pay. Wishlist REP-03 still names an “order to stop or leave.” That is stale vs Wave 93. The toast live region already announces the line. Digit 9 **1181** still names the band and the copy.  
**Suggestion:** Do **not** add a hail leave card as leftover PR1. CONSUME forbids new chrome. Owner may name a hail later; this freeze must not.  
**Status:** accepted — not a missing-law or a11y hole; CONSUME stands.

#### 🟡 Minor: restitution Pay / Confirm have no Digit hotkey on the epics pane

**Severity:** Minor  
**Location:** `src/systems/station.js:5905-5921`, `6181-6186`  
**Description:** Market seeds Digit 1 (`station.js` **6200**). Restitution uses clickable buttons plus Esc to cancel confirm. Keyboard users Tab to the button. Mouse-only is not forced. This is live Standing UX, not leftover chrome.  
**Suggestion:** Do not invent a remaining-REP serial to number Pay restitution. Keep Esc cancel. Do not steal Digit 1 from other dock panes.  
**Status:** accepted — reachable; CONSUME stands.

#### 💡 Suggestion: hail card inline styles lack `focus-visible` (not leftover)

**Severity:** Suggestion  
**Location:** `src/systems/hail.js:407-419` vs `src/ui/screens.css:88-100`  
**Description:** Combat/salvage hail buttons use inline hover colors and Digit 1–9 shortcuts (`hail.js` **431–448**). They are real `<button>`s. They do not use `.screen-btn:focus-visible`. Police leave is **not** on this card. Adding a leave intent here would copy this style onto a new law channel.  
**Suggestion:** Do not add leave to `INTENT_ORDER`. If an owner later names a hail, require tokenized focus rings. That is not this leftover.  
**Status:** accepted — existing hail family; CONSUME stands.

#### 💡 Suggestion: Patrol Compact +5 can read as local police pay

**Severity:** Suggestion  
**Location:** `src/systems/station.js:2113`, `3852`, `5130`, `5332` vs Digit 9 `1156`, `1202`  
**Description:** Job title is “Patrol the lane” at every dock. Payout writes `reputation.freehold += 5`. Digit 9 and the jobs-board note already say Freehold Compact only. WAVE111 pins that sentence. Hiding Compact would lie. Retargeting the writer is `patrol-employer-faction`, which this leftover **consumes**.  
**Suggestion:** Keep the honesty copy. Do not add patrol-employer chrome.  
**Status:** accepted — documented live truth; not leftover UI.

### Specified later UI (CONSUME)

**Later UI = none.** Live Standing pane, live `commLine` leave / covering / `No passage.`, live restitution papers, live patrol hulls already paint.

If an owner re-opens after a **true** missing-law census (leave / covering / jump / Digit 9 mute, or spawn forced `freehold`), PR1 (named only then) must:

- Keep Digit 9 pane, `textContent` / `h()`, polite live region, restitution confirm papers
- Keep `commLine` leave / covering / jump unless the owner names a hail
- Must not steal Digit 0 / 8 / 9
- Must not `innerHTML` rank names
- Must not add a wanted meter or hub pip
- Must not autofocus-trap the sim or raise overlay z
- Must not add patrol-employer chrome while spawn already uses `def.faction` (`world.js` **374–385**)

### Method

- Read pack + live Digit 9 / hail / leave / covering / jump / restitution / toast live region.
- Did **not** run Playwright, Vite, or Chrome.
- Did **not** edit `src/` or integrator docs.
- Worker self-audit (`out/w122/represt/ui-audit.md`) also CLEAN. This pass independently confirms CONSUME does not hide a Standing/hail a11y hole and does not schedule Digit theft or a wanted meter.

**Re-audit after markdown lock:** CLEAN. CONSUME stands.
