# UI Audit: remaining REP leftover brief (Wave 122)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live Digit 9 Standing, live `commLine` leave / covering / jump refuse, and live patrol hulls already meet named REP slices. Digit theft is **not** proposed (Blocker if a later serial adds a Law Digit). Hub theft is **not** proposed. Hail leave card is **not** proposed. Specified later UI is the **existing** Standing pane + commLine — CONSUME means **do not add chrome**.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Reuses live Digit 9 Standing: `renderEpics` when dock-root Digit 9 selects `epics` (`station.js` **188**, **5887–5945**, **6034–6038**). Keyboard Digit 9 still opens Standing; no new service row.
- Real `<button>`s via `btn()` for restitution Pay / Confirm / Esc (`station.js` **4471–4473**, **5905–5921**, Esc **6186**).
- Copy is authored `textContent` (`h()` **4464–4468**): leave / covering / jump lines come from exported constants, not player strings in HTML.
- Hostile restitution empty/short states are explicit: Pay when offered; “Not enough UU.” when short; RESTITUTION subhead hidden at ≥ 0 (**5903–5924**).
- Climb copy still shows after pay so the path from 0 is readable (`standingRemedialNotes` **5929–5938**).
- `aria-live="polite"` on `ui.notice` (**6066–6068**).
- Leave / covering / jump are `commLine` (toast channel), not a second hail card. Wave 93 freeze: no police hail. `hail.js` **58** has no leave verb.
- Digit 0 stays shipyard; 8/9 stay launch/epics. Standing is not a new Digit.
- Empty 80 px hub stays empty (`hud.css` **184–189**). Aim-glass gauges stay off. No wanted pip.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: police leave is commLine, not a hail card

**Location:** `police-leave.js` 121–124 vs `hail.js` 58 vs wishlist REP-03 “order to stop or leave”

**Issue:** A new player does not get a numbered hail with Pay / Leave buttons. They hear **Leave this space.** once per visit.

**Fix:** Do not invent a hail leave card as leftover PR1. Wave 93 chose toast+commLine, no hail card. CONSUME forbids new chrome. Owner may later ask a hail; that is **not** this freeze.

**Status:** accepted — not a missing-law hole; CONSUME stands.

#### 🟡 Minor: Station overlays do not use `--rw-text-scale`

**Location:** settings apply `--rw-text-scale` on `#hud` only; dock uses `screens.css`

**Issue:** XL HUD text does not scale Digit 9 Standing. Wishlist HUD-03 is HUD families, not this leftover.

**Fix:** Do not invent a remaining-REP leftover PR for dock type size. Not leave/covering/jump.

**Status:** accepted — sibling/HUD; CONSUME stands.

#### 💡 Suggestion: Patrol Compact +5 is easy to misread as local police pay

**Location:** `station.js` 2113, 3852, 5332 vs Digit 9 1156 / 1202

**Issue:** Job title is “Patrol the lane” at every dock; payout is Freehold Compact. A player in Gilded space might expect Gilded standing.

**Fix:** Do not retarget the writer as leftover UI. Digit 9 and the jobs-board note already say Compact only. WAVE111 pins that honesty. Changing copy to hide Compact would **lie**. Changing the writer is `patrol-employer-faction`, which this leftover **consumes**.

**Status:** accepted — documented live truth; not a chrome hole.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true missing-law census, PR1 (named only then) must:

- Keep Digit 9 pane, `textContent`, polite live region, restitution confirm papers, `commLine` leave/covering/jump unless the owner names a hail
- Must not steal Digit 0/8/9, must not `innerHTML` rank names, must not autofocus trap the sim, must not raise overlay z, must not add hub chrome, must not add a wanted pip

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
