# UI Audit: REP-03 remaining remedial-missions brief (Wave 110)

### Summary

No product chrome ships this wave. This audit treats the pack as a **Digit 9 copy spec** for later serial — measured against live restitution desk, HUD-01 empty 80 px hub, and Digit 0/2/8/9. Picture is **Standing text that names the climb after 0**, not a new HUD widget. Hub theft is **not** proposed (Blocker if a later serial adds a wanted pip). Digit theft is **not** proposed. Fail-closed missing helper keeps Pay restitution / live notes. Copy frozen here does **not** lie: live sim already writes +2 on Digit 2 families with no standing gate.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page.

### What's done well

- Player-facing change is **one Digit 9 note path**: after restitution, take existing Jobs board work. No new Digit, no required toast.
- Empty hub freeze is explicit: no wanted pip, standing pip, or law-ring on `.rw-reticle` (`src/ui/hud.css` 184–193; `hud.js` 709–712 RANGE stays TGT-01).
- Job `commLine` already speaks `standing +2` (`station.js` 3905–3907 and siblings). Remedial does not add “you are wanted.”
- Digit 0/2/8/9 stay shipyard / Jobs / launch / Standing. Outfitting 8/9 stay papers.
- Restitution two-step labels stay **Pay restitution** / **Confirm restitution** (`station.js` 5825–5827). Fail closed does not hide them.
- Copy honesty freeze: do not say jobs are locked until pay; do not say patrol rebuilds every dock flag; do not promise Known while Beautiful graft caps −10.
- reducedMotion: copy has no `@keyframes`. Do not invent a wanted pulse.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Digit 9 is already long; one extra note can wrap

**Location:** `renderEpics` `station.js` 5805–5848 already prints ladder + move notes + live notes + epics.

**Issue:** Wave 107 live-consequence copy is dense. A later PR that dumps a paragraph would force scroll on small overlays. Contract allows **one or two** `screen-note` lines.

**Fix:** Keep the deputize string short. Prefer HOW STANDING MOVES, not a third heading unless needed. Honor live `screen-note` class (no new CSS).

**Status:** frozen; owner may override wrap after playtest.

#### 🟡 Minor: RESTITUTION block hides at 0; climb copy must remain visible

**Location:** `station.js` 5821 standing `< 0` gate; contract §0.19.

**Issue:** After pay, the restitution subhead disappears. If the climb sentence lives **only** inside RESTITUTION, the player never sees the “then.”

**Fix:** Print remedial notes in **HOW STANDING MOVES** (always) or a short AFTER RESTITUTION subhead that is **not** gated on standing `< 0`. Do not gate the climb line on the Pay button.

**Status:** promoted to contract §0.1 Shape / §0.19 (normative). Not an open Major.

#### 💡 Suggestion: Do not reuse RANGE for “standing to Known”

**Location:** `hud.js` 712 RANGE.

**Issue:** Painting remaining-rep-to-Known on RANGE would smash TGT-01.

**Fix:** Contract already forbids. PR2 grep RANGE / `.rw-reticle`.

**Status:** frozen.

### Accessibility / theming / layout

- No new controls required. If PR1 only adds `div.screen-note` text, keyboard reach is unchanged (Digit 9 still opens Standing).
- Restitution buttons stay existing `screen-btn` / `screen-btn-warm` hit targets.
- No new CSS tokens.
- Empty / error: fail closed is **keep live Digit 9**, which is the correct missing-helper state (Pay restitution still shows when standing `< 0`).
- `aria-live` on `ui.notice` already exists (`station.js` 5970–5972). Do not require a second live region.

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Wanted / remedial pip | none | forbidden |
| Digit 0 | shipyard | do not steal |
| Digit 2 | Jobs board | do not steal; copy may **name** it |
| Digit 8/9 dock | launch / Standing | do not steal |
| Outfitting 8/9 | papers | do not steal |
| Toast | not required | do not add “wanted” |
| Copy vs sim | +2 writers live | do not claim a new family; do not claim lock-until-pay |

### Copy must not lie (before sim)

| Sentence | Sim today | Spec |
|---|---|---|
| Restitution returns this dock to 0 | `bag[faction] = 0` then graft cap | allowed; name graft if Beautiful |
| Jobs board mining… add +2 to this dock's flag | live writers, no standing gate | allowed |
| Five such jobs reach Known 10 | 5 × 2 = 10; `RANK_LADDER` Known min 10 | allowed unless graft |
| Jobs locked until you pay | **false** | **forbidden** |
| Patrol rebuilds this dock's flag | only if flag is Freehold | **forbidden** as generic |
| New remedial family on the board | **no such kind** | **forbidden** |

### Verdict

**Approve** as spec audit. No hub pip. Digit freeze present. Fail-closed empty-helper state is live Digit 9. Climb copy placed outside the `< 0` restitution gate so it remains after pay. Did not spawn `[designer]`.
