# UI Audit: REP-03 remaining remedial missions (Wave 110 Digit 9 / hub freeze)

**Auditor:** `[designer]` (independent of `out/w110/rep03/ui-audit.md`)
**Scope:** Markdown-only Digit 9 copy spec vs live Standing / restitution desk. HUD-01 empty 80 px hub. Digit 0 / 2 / 8 / 9 freeze. No `src/` UI this wave.
**Review file:** `out/w110/designer/rep03-ui-audit.md`
**Method:** `orchestrator/references/ui-audit.md`. Spec + live Digit 9 / HUD cites. No Playwright. No Vite. [NO BROWSER COVERAGE].
**Date:** 2026-08-24
**Product source:** review only (no `src/` edits; brief and contract not edited)

Merge law: `out/w110/rep03/shared-contract.md` wins over `docs/Rep03RemedialDesign.md`. Later serials obey the contract. Pack self-audit: `out/w110/rep03/ui-audit.md`.

## UI Audit: Digit 9 Standing / restitution desk (design-only)

### Summary

No product chrome ships this wave. The leftover is **Standing text that names the climb after restitution-to-0**, using live +2 job writers. The spec does **not** put a wanted meter on the hub, steal Digit 0/2/8/9, claim jobs lock until pay, or use `innerHTML`. Picture is Digit 9 notes, not a HUD widget. 0 blockers. 0 majors.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 3 minors, 2 suggestions remaining. Approve the spec for later Digit 9 copy **if** PR1 stays on `h()` `textContent` notes outside the `< 0` RESTITUTION gate.

### What's done well

- Player-facing change is copy on the live Digit 9 panel. No new Digit. No required toast. Job `commLine` already speaks `standing +2` (`station.js` 3905–3907 and siblings).
- HUD-01 freeze is explicit and matches live chrome: `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–193). `initHud` children are pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). Contract §0.2 forbids a wanted / standing / remedial pip and any new hub DOM. RANGE stays TGT-01.
- Digit map freeze matches live dock root: `DOCK_KEY_SERVICES` is market…launch, epics, shipyard (`station.js` 188). Menu labels are Market, Jobs board, … Launch, Standing, Shipyard (`station.js` 5938). Digit 1–9 map `d - 1`; Digit 0 maps last key = shipyard (`station.js` 6073–6080). Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 6152–6154). Contract §0.3: do not steal Digit 0/2/8/9; no new Digit; copy may **name** Jobs board.
- Live restitution desk is two-step and stays the control: RESTITUTION only when offended standing `< 0` (`station.js` 5820–5842). Labels are **Pay restitution** / **Confirm restitution** / **Esc — Cancel**. Short credits get a note, not a fake Pay. `h()` writes `textContent` (`station.js` 4387–4392). No `innerHTML` in `station.js`. Contract §0.4 forbids `innerHTML` later.
- Fail-closed empty/error state is the live Digit 9 panel: if the notes helper is missing, Pay restitution / move notes / live notes / ladder / epics still paint. Never blank Standing. Never hide restitution when standing `< 0` (contract §0.16, §2; brief Acceptance 4).
- Copy honesty freeze matches sim: renewable families already post with **no standing gate**. Restitution is reset to 0. Climb is +2 from 0. Do not say jobs lock until pay (contract §0.19). Do not say patrol rebuilds every dock flag (Freehold only, `station.js` 1156). Do not promise Known while Beautiful graft caps −10 (`station.js` 1159, 1188).
- Visual hierarchy freeze: climb notes **must not** nest in the RESTITUTION block. That block hides at standing `>= 0` (`station.js` 5821). HOW STANDING MOVES is always printed (`station.js` 5844–5846). That is the correct home so the “then” remains after pay.
- Primary vs secondary on the live desk is already right: Confirm uses `screen-btn-warm`; Cancel is default `screen-btn`; Pay is a full-width `screen-btn`. Focus ring exists (`screens.css` 88–100). Spec adds no new control class.
- Reduced motion: copy has no `@keyframes`. Do not invent a wanted pulse on the hub.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| HUD-01 80 px hub | `.rw-reticle` 80×80; pupil + 3 cilia + RANGE (`hud.css` 184–193; `hud.js` 709–712) | Contract §0.2; brief Honor / Picture | **Must not** add a child, wanted pip, standing pip, or law-ring |
| RANGE | TGT-01 label inside reticle (`hud.js` 712) | RANGE stays TGT-01 | **Must not** paint remaining-rep-to-Known |
| Wanted / remedial meter | absent (`WORLD_FIELDS` has no wanted) | §0.2, §0.6; non-pick | **Forbidden** |
| Toast | not required; job `commLine` + Digit 9 notes exist | No toast required; no “you are wanted” | **Must not** add a wanted toast |
| Digit 0 | shipyard (`station.js` 188, 6075–6077) | §0.3 | **Must not steal** |
| Digit 2 | Jobs board (`station.js` 188, 5938, 6080) | §0.3; copy may name it; no new hotkey | **Must not steal**; **must not** bind Digit 2 from Standing |
| Digit 8 dock root | launch | §0.3 | **Must not steal** |
| Digit 9 dock root | epics / Standing (`station.js` 1634, 5938) | §0.3; leftover **is** a Digit 9 note | **Must not** steal the pane; add notes only |
| Outfitting 8/9 | launcher / turret papers (`station.js` 6152–6154) | §0.3 | **Must not steal** |
| Pay restitution | Digit 9, standing `< 0` (`station.js` 5820–5842) | Keep live desk; never hide when `< 0` | **Must not** gate Jobs on this button |
| `innerHTML` | none in `station.js`; `h()` `textContent` 4387–4392 | §0.4 | **Forbidden** on touched paths |
| Jobs lock-until-pay | **false** — families post below 0 | §0.19 forbidden | Copy **must not** claim a lock |

If later PR1 only adds fail-closed `screen-note` lines via `h(..., textContent)` under HOW STANDING MOVES (or an ungated AFTER RESTITUTION subhead), and PR2 greps no hub child, no Digit steal, no `kind: 'remedial'`, no `innerHTML`, this freeze holds.

### Live Digit 9 desk (baseline the copy must not break)

**Location:** `src/systems/station.js:5805–5888` (`renderEpics`)

Paint order today:

1. `STANDING — {epic}` + current rank line + Next rung
2. `LADDER`
3. `RESTITUTION` only if offended standing `< 0`: Pay / Confirm two-step, or “Not enough UU.”
4. `HOW STANDING MOVES` (always): mining +2 dock flag; patrol Freehold; rescue; sale; graft cap
5. `LIVE CONSEQUENCES` (always): hunt −10, leave, yards, covering Known 10, restitution 1200, jump −25, …
6. Epic stages / ACTIVE STANDING

States the spec correctly consumes:

- **Offered:** Pay restitution button (`station.js` 5832–5839). Click arms `restitutionPending`.
- **Confirm:** `shipyard-confirm` row; Confirm restitution (warm); Esc — Cancel (`station.js` 5823–5831). Escape on Digit 9 cancels pending (`station.js` 6090).
- **Busy:** `restitutionBusy` click-guards `confirmRestitutionPay` (`station.js` 5784–5801). No extra spinner. Spec must not add one.
- **Short:** note only (`station.js` 5840–5841). No disabled Pay chrome. Correct empty-credits state.
- **Success:** notice + `aria-live="polite"` on `ui.notice` (`station.js` 5970–5972). RESTITUTION hides when standing `>= 0`.
- **Graft:** `applyRestitution` sets 0 then `applyAbominationStanding` (`restitution.js` 62–63). Beautiful can stay `< 0`. RESTITUTION **remains**. Live move/live notes already name the cap.

Keyboard: dock-root Digit 9 opens Standing. On the Standing pane, Digit keys are **unbound** (no `epics` branch at `station.js` 6132–6165). Pay / Confirm are pointer + focusable `button` only. Esc cancels confirm, then back. Spec correctly refuses a new Digit binding for Pay.

Theming: live notes use `.screen-note` (`screens.css` 55–58, `#9fb2c6`). Buttons use `--rw-accent` / `--rw-warm`. Contrast mode brightens notes (`screens.css` 595–608). Spec: no new CSS. Inherit live tokens/classes.

### Copy vs sim (must not lie)

| Sentence | Sim today | Spec |
|---|---|---|
| Restitution returns this dock to 0 | `bag[faction] = 0` then graft cap (`restitution.js` 62–63) | allowed; name graft if Beautiful |
| Jobs board mining… add +2 to this dock's flag | live writers, no standing gate (`station.js` 3902 and siblings) | allowed |
| Five such jobs reach Known 10 | 5 × `MINING_REP` 2; Known min 10 | allowed unless graft |
| Spy is the player name for `kind: 'espionage'` | job title `Spy at …` (`station.js` 3109–3113) | allowed as “spy” |
| Jobs locked until you pay | **false** | **forbidden** §0.19 |
| Patrol rebuilds this dock's flag | Freehold only (`station.js` 1156, 3784) | **forbidden** as generic |
| New remedial family on the board | no such `kind` | **forbidden** |
| Wanted meter / hub pip | absent | **forbidden** |

### Findings

None at 🔴 Blocker / 🟠 Major.

Parent tripwires checked:

- Wanted meter on hub — **not** in spec (contract §0.2).
- Steal Digit 0/2/8/9 — **not** in spec (contract §0.3; first serial named copy-only).
- Jobs lock until pay — **forbidden** (contract §0.19; alternatives table).
- `innerHTML` — **forbidden** (contract §0.4; live `h()` `textContent`).

#### 🟡 Minor: Digit 9 is already long; extra climb copy can wrap

**Location:** `src/systems/station.js:5805–5849`; `src/ui/screens.css:26–31` (`max-height: 82vh; overflow-y: auto`); contract §0.1 Shape; `docs/Rep03RemedialDesign.md:217–219`
**Severity:** minor
**Status:** frozen; owner may override wrap after playtest
**Issue:** Live Digit 9 already stacks ladder + restitution + five move notes + twelve live-consequence notes + epics. `.screen-panel` min-width 560px and scrolls at 82vh. Contract formula is four sentences; Shape allows **one or two** `screen-note` lines. A later PR that dumps the formula as four nodes (or adds AFTER RESTITUTION plus HOW STANDING MOVES) forces more scroll. After pay, `aria-live` notice sits at the **bottom** of the panel (`station.js` 5970–5972) and can fall below the fold.
**Fix:** Keep deputize copy to one or two `.screen-note` nodes. Prefer HOW STANDING MOVES. Do not add a third heading unless playtest needs it. Honor live `screen-note` class. No new CSS.

#### 🟡 Minor: Sample “this dock is 0” is state-specific; always-on HOW STANDING MOVES cannot use present tense

**Location:** `out/w110/rep03/shared-contract.md:100–104` (formula); `docs/Rep03RemedialDesign.md:229`; live rank line `station.js:5812–5813`; RESTITUTION gate `station.js:5821`; graft notes `station.js:1159, 1188`
**Severity:** minor
**Status:** open for PR1 copy craft (law already says do not lie; do not edit the brief from this audit)
**Issue:** Formula line 1 reads “After restitution, this dock is 0 (Stranger).” HOW STANDING MOVES is **always** visible. At standing +6 that sentence contradicts the rank line. At Beautiful graft −10 after pay, RESTITUTION **does not** hide (`station.js` 5821 still true), and “is 0” contradicts the live graft cap. Brief player outcome also says “RESTITUTION hides” as a separate sentence after the graft unless — too strong for Beautiful docks.
**Fix:** Write always-on copy as path language, not current-state language. Example shape: restitution **returns** this dock to 0 (Stranger) unless graft caps Beautiful; from 0, Jobs board mining / trade / hunt / passenger / explore / spy / war add +2 to this dock’s flag; five such jobs reach Known 10. Do not nest that line in RESTITUTION. Do not hide Pay while standing `< 0` to make the player-outcome sentence true.

#### 🟡 Minor: “Jobs board (Digit 2)” is dock-root language; Digit 2 on Standing is unbound

**Location:** contract §0.1 “Point at Jobs board (Digit 2) without binding a new hotkey”; live `station.js:6132–6165` (no `epics` Digit branch); menu `station.js:5938, 6073–6080`
**Severity:** minor
**Status:** frozen as no new hotkey; copy must not imply an in-pane Digit 2
**Issue:** On the Standing pane, Digit 2 does nothing. Binding Digit 2 from epics would **steal Digit 2** (jobs accept on the board uses Digit n). Copy that says “press 2 now” would lie. Copy that names the dock-root Jobs board is honest if the player Escapes first.
**Fix:** Name **Jobs board**. Do not bind Digit 2 from Standing. Do not write “press 2” as an in-pane control. Do not steal Digit 1 for Pay restitution either (Confirm stays click + Esc, matching live).

#### 💡 Suggestion: Do not reuse RANGE or galaxy hover-standing for “wanted”

**Location:** `src/systems/hud.js:712` RANGE; `src/ui/hud.css:184–220` reticle + RANGE; `src/ui/hud.css:1954` `.rw-galaxy-hover-standing`
**Severity:** suggestion
**Status:** optional (contract §0.2 already forbids hub chrome)
**Issue:** Painting remaining-rep-to-Known on RANGE would smash TGT-01. Reusing galaxy hover-standing as a hub wanted pip would smash HUD-01 and REP-04 local standing.
**Fix:** Contract already forbids hub children. PR2 grep RANGE / `.rw-reticle` / `wanted`. Leave `.rw-galaxy-hover-standing` on the galaxy map.

#### 💡 Suggestion: Do not add disabled/loading chrome to Pay restitution in the copy PR

**Location:** `station.js:5784–5842`; `screens.css:74–112` (hover / focus-visible; no `:disabled` on station buttons)
**Severity:** suggestion
**Status:** optional (leftover is copy-only; restitution desk is consume)
**Issue:** Live busy is a boolean guard, not `disabled` / spinner. Short credits are a note, not a grey Pay. A “polish” pass that adds disabled Pay, a wanted badge, or a lock icon would steal the desk and could read as jobs-locked-until-pay.
**Fix:** PR1 does not touch Pay / Confirm markup. Keep two-step labels. Keep `screen-btn` / `screen-btn-warm`. Keep Esc cancel.

### Accessibility / theming / layout / states

- **Accessibility:** No new controls required. Extra `div.screen-note` does not change keyboard reach. Digit 9 still opens Standing. Restitution buttons stay real `button` nodes with `type="button"` (`station.js` 4394–4398) and `:focus-visible` rings (`screens.css` 95–100). Do not replace notes with non-focusable fake meters. `aria-live` on `ui.notice` already exists; do not add a second live region for “wanted.”
- **Theming:** No new CSS tokens. Use live `.screen-note` / `.screen-sub`. Do not hardcode a threat-red wanted pip. Contrast mode already lifts `.screen-note` (`screens.css` 595–608).
- **Responsive:** Panel already scrolls. Hit targets are full-width `screen-btn` (padding 7px 12px). Do not shrink Pay to an icon on the hub.
- **States:** Loading = none required (copy PR). Empty helper = live Digit 9. Error = live notices (“Not enough UU.” / “Restitution is not on offer.”). Disabled = do not invent. Hover/focus = inherit `.screen-btn`. Climb copy visible at standing `>= 0` (contract §0.19).
- **Hierarchy:** HOW STANDING MOVES names the climb. RESTITUTION stays the pay verb. Jobs board stays Digit 2. Hub stays empty.

### Pack self-audit vs this pass

`out/w110/rep03/ui-audit.md` already approved the spec: no hub pip, Digit freeze, fail-closed live Digit 9, climb copy outside the `< 0` gate. This designer pass agrees. Extra nits here are copy-tense at always-on HOW STANDING MOVES, Digit 2 in-pane unbound, and panel length. None reopen HUD-01 or Digit law.
)
