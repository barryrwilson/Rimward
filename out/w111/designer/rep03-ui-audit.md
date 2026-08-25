# UI Audit: Wave 111 REP-03 Digit 9 climb copy

**Auditor:** `[designer]` (independent of `out/w111/rep03/ui-audit.md`)
**Scope:** PR1 Digit 9 Standing climb copy (`standingRemedialNotes` + `renderEpics`). HUD-01 empty 80 px hub. Digit 0 / 2 / 8 / 9 honor. No wanted pip. `innerHTML` freeze.
**Review file:** `out/w111/designer/rep03-ui-audit.md`
**Method:** `orchestrator/assets/designer-persona.md` + `orchestrator/references/ui-audit.md`. Live `src/` + `out/w110/rep03/shared-contract.md` HUD/Digit freeze. Worker pack `out/w111/rep03/ui-audit.md` read, not copied. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` / `scripts/` / `docs/` edits)

Merge law: `out/w110/rep03/shared-contract.md` wins. Later serials already landed here as copy-only Digit 9 notes.

## UI Audit: Digit 9 Standing climb copy (`standingRemedialNotes`)

### Summary

Digit 9 Standing prints two extra `.screen-note` rows under **HOW STANDING MOVES**. Those rows name the post-restitution climb with live +2 families, Jobs board (words only), Known 10, Beautiful Ones graft cap, and Freehold Compact patrol. The RESTITUTION desk still paints only when offended standing is `< 0`. Climb notes stay outside that gate, so they remain at standing `>= 0`. No hub child, no wanted pip, no Digit steal, no `innerHTML`. 0 blockers. 0 majors.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions remaining. Climb copy is usable. Do not hold the wave for wrap or note duplication.

### What's done well

- Climb copy uses live `h('div', 'screen-note', panel, …)` and `h()` `textContent` (`src/systems/station.js` 4398–4404, 5862–5865). Same type, color, and 8 px rhythm as move notes. No new CSS class. No new token.
- Preferred placement: under **HOW STANDING MOVES** (`station.js` 5855–5871), not a new AFTER RESTITUTION subhead, and **not** nested in RESTITUTION (`station.js` 5830–5854). After pay, RESTITUTION hides; climb lines still print.
- Copy names **Jobs board** without a Digit hotkey (`station.js` 1201). Digit 9 stays Standing. Digit 2 stays Jobs. Digit 0 stays shipyard. Digit 8 dock root stays launch. Outfitting Digit 8/9 stay launcher / turret papers.
- Honesty: 0 (Stranger via `ladderNameAt(-10)`), +2 families via `MINING_REP`, Known 10, Beautiful Ones graft cap, Freehold Compact patrol only. Does not say jobs lock until pay. Does not say patrol rebuilds every dock flag.
- Fail closed: `typeof standingRemedialNotes === 'function'` plus try/catch (`station.js` 5858–5871). Missing or throwing helper keeps Pay restitution, move notes, live notes, ladder, epics. Standing never blanks.
- HUD-01: `.rw-reticle` is still 80×80 (`src/ui/hud.css` 184–193). `initHud` children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No wanted / standing / remedial pip. RANGE stays TGT-01.
- No `@keyframes` on the new copy. Overlay still `max-height: 82vh; overflow-y: auto` (`src/ui/screens.css` 26–31). Keyboard: Digit 9 opens Standing; restitution buttons stay `screen-btn` / `screen-btn-warm` with focus ring (`screens.css` 88–100).

### Checklist (Wave 111 REP-03)

| Check | Result | Cite |
|---|---|---|
| Two extra `screen-note` rows, readable | **Pass.** Two strings, both painted as `.screen-note`. First wraps (~3 lines on 560 px min panel). Still readable. | `station.js` 1195–1204, 5862–5865; `screens.css` 26–31, 55–58 |
| Climb notes visible at standing `>= 0` | **Pass.** Helper runs after HOW STANDING MOVES, outside the `< 0` gate. | `station.js` 5855–5871 vs 5832 |
| Not nested in RESTITUTION | **Pass.** RESTITUTION block ends at 5854. Climb loop starts at 5858. | `station.js` 5832–5871 |
| No hub child | **Pass.** Reticle children unchanged. No climb DOM on `#hud`. | `hud.js` 709–712; `hud.css` 184–193 |
| Digit 0/2/8/9 not stolen | **Pass.** `DOCK_KEY_SERVICES` and menu labels unchanged. Standing pane has no Digit branch. | `station.js` 188, 5963–5967, 6098–6106, 6159–6190 |
| No `innerHTML` | **Pass.** Zero matches in `station.js`. `h()` uses `textContent`. Overlay clear uses `textContent`. | `station.js` 4398–4404, 5949, 6082 |
| Contrast: screen-note vs Standing | **Pass.** Notes `#9fb2c6` on panel `#101826` ≈ **8.1:1**. Standing subhead `#6fd2e0` ≈ **10.1:1**. Contrast mode notes `#c3d4e6`. Hierarchy is cyan heading vs muted body. | `screens.css` 26–58, 595–608 |
| No wanted pip | **Pass.** No `wanted` in `station.js`. No hub pip. Copy is text only. | `station.js` grep; `hud.js` 709–712 |
| Jobs board named, no fake Digit binding | **Pass.** String says “Jobs board”. Does not say “press 2”. Digit 2 on Standing is unbound. | `station.js` 1201, 6157–6190 |

### Digit / HUD freeze (live)

| Surface | Live | Honor |
|---|---|---|
| HUD-01 80 px hub | `.rw-reticle` 80×80 (`hud.css` 184–193); pupil + 3 cilia + RANGE (`hud.js` 709–712) | Unchanged. No new child. |
| RANGE | TGT-01 label (`hud.js` 712) | Unchanged. Climb math not on glass. |
| Digit 0 | shipyard (`station.js` 188, 6100–6102, 5963) | Unchanged. |
| Digit 2 | Jobs board (`station.js` 188, 5963) | Named in copy only. Not rebound. |
| Digit 8 dock root | launch | Unchanged. |
| Digit 9 dock root | epics / Standing (`station.js` 188, 1644–1645, 5931, 5963) | Notes only. Pane not stolen. |
| Outfitting 8/9 | launcher / turret papers (`station.js` 6177–6180) | Unchanged. |
| Wanted meter | absent | Unchanged. |

### Paint order (`renderEpics`)

**Location:** `src/systems/station.js:5816–5914`

1. `STANDING — {epic}` + current rank line + Next rung
2. `LADDER`
3. `RESTITUTION` only if offended standing `< 0`: Pay / Confirm two-step, or “Not enough UU.”
4. `HOW STANDING MOVES` (always): five live move notes, **then** two climb notes
5. `LIVE CONSEQUENCES` (always)
6. Epic stages / ACTIVE STANDING

Climb notes sit in step 4. They are not parented to step 3.

### Copy vs sim (must not lie)

Live strings (`station.js` 1195–1204), with `MINING_REP` 2 and `PATROL_REP` 5:

1. `After restitution, this dock is 0 (Stranger) unless Beautiful Ones graft cap holds. Jobs board mining, trade, hunt, passenger, explore, spy, and war add +2 to this dock's flag.`
2. `That is how standing climbs from 0. Five such jobs reach Known 10. Patrol adds +5 Freehold Compact only.`

Matches contract formulas plus the graft caveat (contract §0.20). Families named match the leftover table. Unique four are not named as rebuild except patrol, and patrol is Freehold only. Rank names come from `RANK_LADDER` (`state.js` 714–721): Stranger min is `-10`, and `rankFor(0)` is still Stranger. `ladderNameAt(-10)` is the correct lookup.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Two extra notes wrap and add scroll on the 560 px desk

**Location:** `src/systems/station.js:1200–1203` (strings); `src/systems/station.js:5862–5865` (`renderEpics`); `src/ui/screens.css:26–31` (`.screen-panel` min-width 560 px, max-height 82 vh); `src/ui/screens.css:55–58` (`.screen-note`)

**Issue:** Digit 9 already lists ladder, five move notes, live consequences, and epic stages. The first climb string is ~175 characters (Beautiful Ones + family list). On a 560 px panel with 14 px mono, that row wraps to about three lines. The second row wraps to about two. Overlay still scrolls. The notes remain readable. This is not an unusable defect.

**Fix:** Keep two lines (contract one-or-two). Do not add a third subhead this PR. Honor live `.screen-note`. Owner may shorten the first sentence after playtest.

**Status:** accepted; not a hold.

#### 💡 Suggestion: Climb copy repeats mining +2 already in move notes

**Location:** `src/systems/station.js:1155` vs `src/systems/station.js:1201`

**Issue:** HOW STANDING MOVES already says mining jobs add +2 to the dock flag. Climb notes then name the same +2 plus the family list, Jobs board, Known 10, graft, and patrol-Freehold-only. Same `.screen-note` class, so the new “then” is not a separate visual rung.

**Fix:** None this PR. Contract wants the after-0 loop named, not a move-notes rewrite, and prefers no extra subhead.

**Status:** optional.

#### 💡 Suggestion: Do not paint climb progress on RANGE or bind Digit 2 from Standing

**Location:** `src/systems/hud.js:709–712`; `src/systems/station.js:6157–6190`

**Issue:** Remaining-rep-to-Known on RANGE would smash TGT-01. Binding Digit 2 on the Standing pane to jump to Jobs would steal Digit 2. Live code does neither. Copy names Jobs board in words only.

**Fix:** Contract forbids both. Keep.

**Status:** frozen.

### Accessibility / theming / layout / states

- **Contrast:** `.screen-note` `#9fb2c6` on `.screen-panel` `#101826` ≈ 8.1:1 (WCAG AA for body). Standing `.screen-sub` `#6fd2e0` ≈ 10.1:1. Rank line and climb notes share the note color on purpose; heading vs body is the hierarchy. `body.rw-contrast` already restyles `.screen-note` to `#c3d4e6` (`screens.css` 595–608).
- **Theming:** No hardcoded new climb color. Reuse `.screen-note` / `.screen-sub`. No new CSS file.
- **Focus / keyboard:** No new control. Pay restitution / Confirm restitution / Esc — Cancel stay live buttons with `:focus-visible` ring. Digit 9 still opens Standing. Digit 2 still opens Jobs from dock root only.
- **Responsive:** Panel min 560 px, max 780 px, 82 vh scroll. Long notes wrap; they do not overflow sideways in the live CSS model.
- **States:** Loading N/A (static copy). Empty: missing helper omits climb rows only. Error: try/catch fail closed. Disabled N/A. Hover N/A on notes.
- **Semantic markup:** Same `div.screen-note` as the rest of Digit 9. Climb text is not a control, so no name gap.
- **`aria-live`:** Unchanged on `ui.notice` (`station.js` 5995–5998). Climb notes are static, same as other Standing notes.
- **Reduced motion:** New copy has no animation.

### Worker self-audit

`out/w111/rep03/ui-audit.md` also reports CLEAN with the wrap minor and a RANGE suggestion. Independent read of live `renderEpics` and `standingRemedialNotes` agrees on placement, Digit/HUD freeze, `innerHTML`, and contrast class reuse. This file does not copy that audit’s wording.

### Method

Designer pass. Digit 9 is frontend station UI. Checklist applied to live `src/systems/station.js`, `src/ui/screens.css`, `src/ui/hud.css`, `src/systems/hud.js`, and the Wave 110 HUD/Digit contract. No product UI edit.
