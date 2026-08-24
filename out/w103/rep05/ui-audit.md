## UI Audit: REP-05 remaining consequences brief (Wave 103)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec** for later covering toasts, jump-refuse toasts, and Digit 9 copy — measured against HUD-01 empty 80 px hub, live `commLine` toasts, and the dock Digit map. Picture is **no new chrome** on the aim glass. Hub theft is **not** proposed (Blocker if a later serial adds an ally pip or lock box). Police leave copy stays `Leave this space.`

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`.

### What's done well

- Empty hub freeze is explicit: no ally pip, cover pip, or lock disc on `.rw-reticle` (`hud.css` 184–191; `hud.js` 709–712 RANGE stays TGT-01).
- Channel reuses live `commLine` → `pushToast` `textContent` (`hud.js` 494–502, 1112–1131). Same toast slots, same lifetime, same keyboard-irrelevant glance.
- Authored strings are short, one sentence, STE-like: `Patrol covering.` / `No passage.` Distinct from `Leave this space.` and `No sale.`
- Once-per-visit latches copy police leave, so the toast stack is not a covering klaxon.
- Digit 0/8/9 stay shipyard / launch / Standing. First serial has **no** new dock control. Digit 9 copy is PR3 `screen-note` via `h()` `textContent` (`station.js` 4350–4355, 5795–5797).
- Chart grows no lock box. Hover already shows rank (`chart-hover.js` 63–65). NAV `blocked` is not reused.
- Both HUD families keep the same glance set. HUD never writes `hullKind`.
- Fail-closed missing standing → no covering toast, no jump toast (read 0). Player is not shown a lying “locked” widget.
- `reducedMotion` already applies to HUD anim; toasts are text, not a new pulse `@keyframes`.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Covering and leave can never share a visit band, but jump refuse can toast after a leave visit elsewhere

**Location:** spec player outcome; live leave band `< 0` and `> −10`; jump refuse dest `< −25`.

**Issue:** Different systems, different visits. Toast vocabulary stays three authored lines. Player must tell them apart. Copy is already XOR (`Leave this space.` / `Patrol covering.` / `No passage.`).

**Fix:** None this wave. Do not merge strings. Do not add icons on the hub to “explain.”

**Status:** accept.

#### 🟡 Minor: Digit 9 will lag live police leave until PR3

**Location:** `station.js` 1160–1179; contract §8.

**Issue:** Standing pane still omits leave. First serial must not steal Digit 9 to paper over that.

**Fix:** PR3 after PR1/PR2. Use `h()` notes, not a new Digit.

**Status:** frozen.

#### 💡 Suggestion: Keep jump HUD `JUMP — name` unused on refuse

**Location:** live `hud.js` 1188–1202 shows jump box only when `ctx.gate.jumping`.

**Issue:** Contract refuses **before** `beginJump`, so the jump fill never appears. That is the correct fail-closed picture (no fake charge).

**Fix:** Later PR2 must not set `jumping` true then cancel. Do not paint a lock glyph in `jumpLabel`.

**Status:** contract §2.3 already forbids setting `jumping`.

### HUD-01 / Digit / a11y checklist

| Check | Spec | Result |
|---|---|---|
| 80 px hub empty of new children | contract §0.2 | Pass |
| No lock box on glass | contract §0.2 | Pass |
| RANGE stays | `hud.js` 709–712 | Pass |
| Toast `textContent` | `hud.js` 1130 | Pass |
| No `innerHTML` | contract §0.4 | Pass |
| Digit 0 shipyard | `station.js` 6023–6025 | Pass |
| Digit 8/9 unstolen | contract §0.3 | Pass |
| Color not the only cue | authored English toasts | Pass (no color-only lock lamp) |
| Keyboard | KeyG still jump; refuse is no-op + toast | Pass |
| Contrast / tokens | no new HUD color | Pass (reuse toast classes `comm`) |
| Focus / hit targets | no new dock button in PR1/PR2 | Pass |
| Disabled/error | fail-closed skip vs lying widget | Pass |
| `hullKind` write | forbidden | Pass |
| Police leave chrome | unchanged `commLine` | Pass |

### Verdict

Approve UI spec. Later serial must not put covering or lock chrome on the 80 px hub, must not steal Digit 0/8/9, and must keep refuse from lighting the jump fill.
