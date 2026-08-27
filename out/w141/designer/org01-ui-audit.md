# UI Audit RECHECK: Org01 overflow Major fold (Wave 141 designer)

**Auditor:** designer (Wave 141 recheck after worker fold)  
**Prior pass:** `out/w141/designer/org01-ui-audit.md` (later-mint freeze + live origin overlay). That file is overwritten by this recheck.  
**Review only.** No product `src/` edits. No design-doc edits. Vite/Chrome not started.  
**Sources:** `docs/Org01OriginPreviewDesign.md`; merge law `out/w141/org01/shared-contract.md` (contract wins); worker `out/w141/org01/ui-audit.md` (not a substitute); notes `out/w141/org01/notes.md`.  
**Live re-census (code wins):** overlay `src/game/origins.js` **94–170**, `applyEffects` **52–85**, Digit **153–157**; `ORIGINS` `src/game/state.js` **742–768**; ranks **714–724**; `SHIP_CLASSES.light` **38**; Onb01 chip `src/systems/onboarding.js` **81–87**; WPN skip `src/systems/controls.js` **548–562**; station panel `src/ui/screens.css` **26–41**, **574–587**; HUD contrast `src/ui/hud.css` **9–33**, **1241–1277**.  
**Open Major under recheck:** origin-card overflow has no keyboard read path. Worker now deputizes compact sublines first; `overflow-y` as backup on a dedicated origin list; no stolen station/pause classes.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`.  
**Graph:** `graph_resolve` returned `blocked_ambiguous` on unrelated Drive / training / slides workflows (low coverage). Owner task is local markdown. Did not call `graph_propose` / `graph_approve`. Did not bind Drive.

### Summary

The prior designer **Major** is **closed in freeze**. Compact sublines are the primary keyboard read path. `overflow-y: auto` is fail-closed backup on a dedicated origin list, not on stolen `.screen-panel`. Live flavor-only remains leftover **REAL** until PR1. That live hole is **not** an open freeze Blocker. No new Blocker. No 🔴/🟠 stay open in the freeze.

### What's done well

- Live rows already pair Digit index **and** name **and** flavor line (`origins.js` **141**). Selection is not color-only. Hover only raises background alpha (**142–143**).
- All live overlay copy uses `textContent` (`origins.js` **121**, **141**, **150**). No `innerHTML`. Contract §0.4 still forbids those later.
- Footer already states permanence in words (`origins.js` **150**). Keyboard Digit1–5 **and** click both call `choose` (**144**, **153–157**). No second Confirm screen (contract §0.1).
- Digit 0 / 8 / 9 are ignored (`n` out of range, **156**). After pick the listener removes itself (**126**). Digit1–5 then stay WPN (`controls.js` **548–562**).
- Overlay is full-screen, 620 px card, `max-width: 92vw` (**114–116**). Title 14 px, rows 12 px, footer 10 px. Hierarchy exists today.
- Freeze keeps origin overlay pause (`origins.js` **100**, **132**). It does not steal KeyP Ctl05 chrome or Onb01 `.rw-onboard-hint` (`onboarding.js` **81–87**).
- Deputized experience is **words**, not pips: `New player` / `New player — living-ship care` / `Experienced`. Color is extra.
- Deputized numbers match live derive: 350 / −1150 / 600 UU; shared hull light 100 · Mk I · hold 20; ranks via `rankFor` (`state.js` **714–724**). No invented UU. No kit mutate.
- Fail-closed paint: skip unknown id; omit missing effect part; never throw (contract §0.12). Skip does not reindex Digit labels.
- Greenhand danger omits invented `fear 0` (contract §0.1 table + omit sentence). Omit wins.
- `reducedMotion`: live overlay has no animation. Freeze forbids new animation that ignores reduced motion (contract §0.13).
- Partial merge now requires compact sublines **with** the five consequence kinds (contract §2). Overflow-only without compact is forbidden.
- Worker correctly refused CONSUME on flavor-well, two-step confirm, color-only danger, and Onb01 copy on this card.

### Recheck: prior Major vs freeze

#### 🟠 Major (CLOSED in freeze): Card overflow has no keyboard read path

**Prior location:** live card `origins.js:114-116` (no `max-height`, no `overflow`); prior freeze “may overflow”.  
**Prior issue:** Five origins × five consequence kinds at 12 px uppercase can hide Digit4–5 and the footer. Digit1–5 still confirm. The card is an unfocusable `div`. Mouse wheel is not a keyboard read path. Overflow-only is mouse-only informed choice. Reuse of `.screen-panel` would steal station/pause chrome (`screens.css:26-41`).  
**Fold (named now):**

| Law | Where |
|---|---|
| Compact first (primary) | contract §0.21, §0.1 Layout (primary); design Honor + Goals non-goal; acceptance 1 |
| Preview sublines ≈10 px, dimmer, wrap | contract §0.1; design deputize table |
| Digit labels stay full size | contract §0.21 / §0.1 |
| Five Digit rows + preview in view at live 620 px / 92vw without mouse-only scroll as the primary path | contract §0.14, §0.21; player outcome; acceptance 1 |
| `overflow-y: auto` **backup only** on a **dedicated origin list region** | contract §0.1 Layout (backup); design alternatives / regression table |
| Title + footer stay outside the scroller when possible | contract §0.1 backup; design regression “title + footer stay” |
| Wheel/trackpad enough; **no** new scroll key; **no** tabindex trap; **no** animation | contract §0.1 backup |
| Do **not** steal `.screen-panel`, `.screen-overlay`, `.screen-btn`, pause-menu classes | contract §0.1 Layout (do not); write-set; design non-goals |
| Dedicated `.rw-origin-*` in `screens.css` allowed | contract §1; design ownership |
| Overflow-only without compact fails partial merge | contract §2; mermaid `overflowOnly` forbidden |

**Status:** **closed in freeze.** Worker mark matches. Prior “may overflow” is gone. Compact is the keyboard read path. Backup overflow is not the informed-choice law.

**Residual (not a freeze Blocker):** If compact still clips (short viewport or `--rw-text-scale` 1.5 on `#hud` only, `hud.css:29-31`), the backup list remains an unfocusable `div`. Wheel is the named backup. Do **not** reopen this as Major. Do **not** bind a new scroll key. Do **not** steal a pause focus trap. Optional later: `tabindex="0"` on the list region is a scroll container, not a trap — **not required PR1**. See Minor below.

### Recheck: other prior findings vs freeze

#### 🔴 Blocker (closed as later mint): Flavor-only permanent choice

**Location:** live row `origins.js:141`; footer **150**; apply **52–85** inside `choose` **127**  
**Issue:** The player confirms a career from `[n] name — line`. Hull, money/debt, standings, danger, and experience apply **after** `ctx.world.origin` writes.  
**Fix (frozen):** PR1 labeled `textContent` rows on each origin before Digit/click. Derive from `ORIGINS.effects` + live defaults. Do not CONSUME. Do not move `applyEffects` before confirm.  
**Status:** **closed in freeze.** Live hole remains until PR1 (expected). Leftover **REAL**. Serial **PR1**, not none. **Not** an open freeze Blocker.

#### 🟠 Major (closed in freeze): Color-only danger / experience

**Location:** honor a11y; live hover extra (`origins.js:142-143`); contract §0.13–§0.14  
**Fix (frozen):** Words: `Money −1150 UU (debt)`, faction **name** + signed delta + `rankFor` name, `Experienced`. Color optional extra, not PR1. Digit index stays on the title row.  
**Status:** **closed in freeze.** Unchanged.

#### 🟠 Major (closed in freeze): Two-step / pause chrome / flight lesson on the card

**Location:** Digit confirm `origins.js:153-157`; Onb01 chip `onboarding.js:81-87`; Ctl05 sibling  
**Fix (frozen):** Keep one-press. Keep the origin card. Do not delay the overlay. Do not put `.rw-onboard-hint`, CONTROLS dump, or lesson rail on this card. Origin pause stays live overlay pause.  
**Status:** **closed in freeze.** Unchanged.

#### 🟠 Major (closed in freeze): `innerHTML` / raw clue id as the only cue

**Location:** later clue `rm_c_tally`; live paint `origins.js:121,141,150`  
**Fix (frozen):** `textContent` only. Drifter clue uses authored tally-board words. Missing commodity/system/clue → omit that part, not crash.  
**Status:** **closed in freeze.** Unchanged.

### Findings (designer extras, recheck)

#### 🟡 Minor: Whole-card `text-transform:uppercase` vs deputized mixed-case experience

**Location:** card `text-transform:uppercase` `origins.js:116`; deputize table (`New player — living-ship care`)  
**Issue:** PR1 standings and experience become shouty and wrap more. Compact type is the height valve; uppercase wrap can still push backup overflow. Experience stays **words**.  
**Fix:** Keep uppercase on the title row if live flavor stays that way. Optional `text-transform: none` on preview sublines only. Not required PR1.  
**Status:** open; not a Blocker.

#### 🟡 Minor: Inline hex ignores contrast / text-scale (do not steal screen chrome)

**Location:** overlay inline `#6ff2e0`, `#d7e4ea`, `rgba(4,18,22,.9)` `origins.js:105-116,120,139,149`; contrast hooks live on `.screen-overlay` (`screens.css:574-582`) and `#hud` (`hud.css:1241-1277`); `--rw-text-scale` is `#hud` only (`hud.css:29-31`)  
**Issue:** A returning player with `body.rw-contrast` or text scale still sees the origin card at hardcoded 12 px cyan. Adopting `.screen-overlay` / `.screen-panel` would steal station/pause look. Freeze already names text scale as a clip reason for backup overflow (contract §0.21).  
**Fix (optional PR1):** Dedicated `.rw-origin-*` in `screens.css` for compact sublines, backup list overflow, **and** `body.rw-contrast` / colorblind accents. Do not restyle HUD. Do not reuse pause/station panel classes. Pair text-scale with the overflow valve so 1.5× type still scrolls.  
**Status:** open; not required to close leftover REAL.

#### 🟡 Minor: Backup list still has no keyboard scroll (accepted backup)

**Location:** contract §0.1 Layout (backup) “wheel/trackpad is enough”; “no tabindex trap”; live rows are unfocusable `div`s (`origins.js:137-144`)  
**Issue:** When compact still clips, keyboard Digit users can confirm Digit4–5 without seeing clipped sublines unless they use a pointer wheel. That is the residual of the closed Major.  
**Fix:** Do **not** add a new scroll key. Do **not** steal pause focus trap. Compact remains the primary law. Optional later `tabindex="0"` + `:focus-visible` on the **list region only** is a scroll container, not a trap — **not required PR1**.  
**Status:** accepted backup; do not reopen Major.

#### 🟡 Minor: Clickable `div` rows have no focus ring

**Location:** row `div` + `cursor:pointer` `origins.js:137-144`; no `role`, `tabindex`, or `:focus-visible`  
**Issue:** Tab users never land on a row. Digit1–5 is the frozen keyboard path (contract §0.14). Hover tint is mouse-only.  
**Fix:** Do **not** convert rows to Ctl05 `<button class="screen-btn">`. Optional later `role="button"` + Digit still confirms — not required PR1.  
**Status:** accepted live pattern; do not steal pause buttons.

#### 🟡 Minor: Skip-unknown must not reindex Digit labels — **closed in freeze**

**Location:** live `[${i + 1}]` from `ORIGIN_IDS.forEach` `origins.js:136-141`; contract §0.7, §0.12  
**Fix (frozen):** Authored index is the Digit. Skipped id omits that row; remaining rows keep 1–5. Digit on a skipped id no-ops (`hasOwn`).  
**Status:** **closed in freeze.**

#### 🟡 Minor: Greenhand `fear 0` vs omit — **closed in freeze**

**Location:** live `effects: {}` `state.js:746`; contract §0.1 table Digit1 danger = `Start Freehold Drift`; omit sentence forbids `fear 0`  
**Fix (frozen):** Omit `fear` unless `setFear` exists. Greenhand danger is start system only.  
**Status:** **closed in freeze.** Omit wins. Prior dual sentence is gone.

#### 🟡 Minor: Shared hull line is repetitive (keep)

**Location:** deputize hull string ×5; `SHIP_CLASSES.light` `state.js:38`; effects have no hull  
**Issue:** Five identical hull lines add height and can look like “no difference.” Inbox still asked to preview hull/equipment. Shared starter is the true fact.  
**Fix:** Keep the row. Compact type is the height valve. Overflow is backup only. Do not kit-mutate. Beautiful cargo stays an extra equipment/cargo part.  
**Status:** keep.

#### 💡 Suggestion: Empty list still shows title + footer

If every authored id fails `hasOwn`, the card would be title + permanence and no rows. Fail-closed: do not throw; do not invent a placeholder origin. Title + footer is an acceptable empty state.

#### 💡 Suggestion: No new row motion

Do not add CSS animation, iris, or lesson-chip slide. Hover background may stay. `reducedMotion` stays a no-op because nothing animates.

#### 💡 Suggestion: Optional PR2 still

One still: new game, overlay, all five consequence kinds visible on Ledger Debt **before** any Digit; Digit2 confirms; overlay gone; Digit2 is WPN; hub empty; Digit5 Drifter visible without mouse-only scroll as the primary path; no Onb01 chip; no pause-menu chrome; no `.screen-panel`.

### States checklist

| State | Live | Freeze |
|---|---|---|
| Default | Flavor rows + footer | Flavor + five labeled kinds before confirm, compact sublines |
| Hover | Background alpha (`origins.js:142-143`) | Stay extra, not the only cue |
| Focus | None on rows; Digit1–5 | Digit stay; do not steal pause focus trap |
| Disabled | Overlay removed on pick | Unchanged; listener removed |
| Loading | N/A (init paint) | No per-frame DOM (contract §0.15) |
| Empty | Always five keys today | Skip unknown; omit missing part; do not crash |
| Error | Digit out of range no-ops | Never throw from paint; `choose` `hasOwn` |
| Overflow | None (short flavor rows) | Compact primary; dedicated list `overflow-y` backup |

### Onb01 / Ctl05 steal (do not)

| Chrome | Live cite | Org01 |
|---|---|---|
| `.rw-onboard-hint` chip | `onboarding.js:81-87` | **Do not** put on origin card |
| CONTROLS encyclopedia | HUD sibling | **Do not** |
| Sequential look/throttle/hail | Onb01 PR1 | **Do not** delay overlay or paste lesson copy |
| Pause `screen-btn` menu | Ctl05 / `screens.css:74+` | **Do not**; origin pause stays overlay pause |
| Station `.screen-panel` | `screens.css:26-41` | **Do not**; dedicated `.rw-origin-*` only |
| Creditor `ORIGIN_ARCS.callLines` | `world.js` tick | **Do not** paste as danger |
| AI-05 extra grace seconds | `npc.js` | **Do not** name as danger |

### Verdict

Leftover **REAL**. Do not CONSUME. Digit1–5 stay. `textContent` stays. Color is not the only cue. Experience is readable words. Missing fields omit. Onb01 lesson chrome stays off this card. Compact sublines first. Overflow-y backup on a dedicated origin list. No station/pause class steal.

Open in freeze:

- none 🔴
- none 🟠

Closed this recheck:

- 🟠 **Major:** Card overflow has no keyboard read path — **closed in freeze** (compact first; overflow backup; no `.screen-panel`).

Live flavor-only stays until PR1. That is accepted leftover REAL. It is **not** an open freeze Blocker.

No 🔴 Blocker in the freeze.
