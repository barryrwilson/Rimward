## UI Audit: Org01 origin consequence preview (Wave 142 PR1)

**Persona:** designer (parent pass). Review only. Did not edit product source. Did not edit `out/w142/org01/**` except this read. Did not start Vite or Chrome.
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `references\ui-audit.md`. Merge law: `out/w142/org01/shared-contract.md` wins over `docs/Org01OriginPreviewDesign.md`. Worker self-audit `out/w142/org01/ui-audit.md` checked, not rubber-stamped. Live overlay paint cited from `src/game/origins.js` + dedicated `.rw-origin-*` in `src/ui/screens.css`. No stills. [NO BROWSER COVERAGE].
**Graph:** `graph_resolve` → `execute_workflows` (`r-mtbwtq5p-d6fd5c7e`), primary `claude/workflow-code-review`. This pass is the named designer write-file. No product edit. No Drive. No graph write.
**Scope:** Wave 142 Org01 PR1 consequence rows on the origin overlay before Digit/click confirm.

### Summary

PR1 paints five labeled compact sublines on each origin row before one-press Digit1–5 or click confirm. Title, Digit labels, `textContent`, pause, and permanence footer stay. Backup overflow sits on `.rw-origin-list` only. No Blocker. No Major. Two Minors remain: short-viewport list clip under the `72vh` cap, and hover fill that is color-only.

### What's done well

- Flavor title stays `[n] name — line` at 12 px (`origins.js` **402**; `screens.css` **644–647**). Digit labels are not shrunk.
- Preview is five `textContent` sublines (~10 px, dimmer, wrap) under the title (`origins.js` **327–337**; `screens.css` **649–662**). Compact is the primary fit.
- `text-transform: none` on `.rw-origin-preview` so `Mk I`, `UU`, and living-ship words stay mixed case under the uppercase card (`screens.css` **655**; card `text-transform:uppercase` at `origins.js` **362**).
- Color is extra. Danger uses words (`fear`, `in debt`, `clue tally-board`, cargo names). All five preview kinds share one dim ink (`screens.css` **654**).
- Digit1–5 and click still call `choose(id)` once (`origins.js` **376–390**, **405**, **421–428**). No second confirm. No new Digit. Authored order `greenhand` … `drifter` (`origins.js` **37**).
- List is a dedicated origin region. Title and footer are siblings outside that scroller (`origins.js` **365–373**, **415–419**). No `.screen-panel` / `.screen-overlay` / `.screen-btn` / pause class steal.
- No new animation. No `requestAnimationFrame` / resize observer. `reducedMotion` is not ignored.
- High-contrast body class brightens row and preview (`screens.css` **664–671**).
- Derive copy matches the compact deputize table (hull / money / standings / danger / experience). Greenhand omits `fear 0`. Ledger debt uses U+2212. Beautiful cargo is labeled, not a kit mutate.

### Honor

| Check | Result | Cite |
|---|---|---|
| Compact sublines first | Pass | `.rw-origin-preview` 10 px / dimmer / wrap (`screens.css` **649–658**); choice stays 12 px (**644–647**); hull compact `Hull light 100 · Mk I · hold 20` (`origins.js` **164–175**) |
| Overflow backup only | Pass, with residual | `.rw-origin-list` `overflow-y: auto` (`screens.css` **625–627**) is CSS backup. `min(72vh, …)` can clip before the title/footer budget. See Minor. |
| Digit1–5 still confirm once | Pass | `onKey` → `choose(id)` (`origins.js` **421–428**); click same (`origins.js` **405**); listener removed on pick (`origins.js` **383**) |
| `textContent` | Pass | title **368**, choice **402**, preview **333**, footer **418**. No `innerHTML` / `insertAdjacentHTML` |
| Color not the only cue | Pass (preview). Hover extra is color-only | Digit index + name + labeled words (`origins.js` **402**, **316–325**). Hover only changes fill (`screens.css` **640–642**). See Minor |
| No `.screen-panel` steal | Pass | dedicated `.rw-origin-*` (`screens.css` **624–671**; `origins.js` **359**, **372**, **399**). Station panel stays **27–41** |
| No animation that ignores `reducedMotion` | Pass | no `@keyframes`, transition, or tween on `.rw-origin-*` |
| Keyboard Digit path informs without mouse-only scroll | Pass at typical 1080p height. Residual on short / 720p | five rows ~100 px each + wrap; list cap `72vh` (`screens.css` **626**). No new scroll key (contract forbids). See Minor |
| Title + footer outside scroller | Pass | `card` → `title`, `list`, `footer` (`origins.js` **365–419**) |
| No kit mutate / no new UU / `state.js` read-only | Pass | hull from `SHIP_CLASSES.light` + `MINING_LASERS[0]` (`origins.js` **164–175**; `state.js` **38**, **83–88**). Credits derive 350 / set / add (`origins.js` **41**, **151–156**) |

### Copy map (player-facing, derived)

| Digit | Id | Title (live, keep) | Compact preview (code) |
|---|---|---|---|
| 1 | `greenhand` | `[1] Freehold Greenhand — …` | Hull light 100 · Mk I · hold 20 / Money 350 UU / Standings even / Start Freehold Drift / New player |
| 2 | `ledgerDebt` | `[2] Ledger Debt — …` | same hull / Money −1150 UU (debt) / Red Ledger −10 (Stranger) · Freehold +10 (Known) / Start Freehold Drift · in debt / Experienced |
| 3 | `marked` | `[3] Marked — …` | same hull / Money 350 UU / Veridian Combine −15 (Suspect) · Red Ledger +10 (Known) / Start Freehold Drift · fear 15 / Experienced |
| 4 | `beautiful` | `[4] Beautiful Ones Initiate — …` | same hull / Money 350 UU / Standings even / Start Freehold Drift · bond 0.35 · hunger 0.4 + cargo Living rock ×2 / New player — living-ship care |
| 5 | `drifter` | `[5] Rim Drifter — …` | same hull / Money 600 UU / Standings even / Start The Redmarch · fear 5 · clue tally-board / Experienced |

Sources: `ORIGINS` (`state.js` **742–768**); systems `Freehold Drift` / `The Redmarch` (`authored-systems.js` **33**, **95**); clue line tally-board (`authored-systems.js` **122**); `rankFor` (`state.js` **714–725**); `FACTIONS` names (`state.js` **591–593**); `COMMODITIES.livingRock.name` (`state.js` **355**). Compact hull omits “Mining laser” / “no launcher” / “no turret” as the compact deputize (`shared-contract.md` compact paint). Beautiful cargo is a danger suffix, not a hull kit mutate.

### Findings

#### 🔴 Blocker

None.

#### 🟠 Major

None.

#### 🟡 Minor: `72vh` list cap can hide Digit5 behind overflow

**Location:** `src/ui/screens.css:625-627`; list node `src/game/origins.js:371-373`; row chrome `screens.css:630-662`
**Issue:** Compact sublines are ~10 px with five kinds per origin. Five rows plus title wrap (Marked / Beautiful / Drifter flavor lines are long at 12 px uppercase) sit near ~540–560 px. `.rw-origin-list` uses `max-height: min(72vh, calc(92vh - 5.5rem))`. On a 720 px-tall window, `72vh` is ~518 px, so the list scrolls. Digit1–5 confirm without a scroll key. Wheel/trackpad is then the only way to read Digit5 (Rim Drifter) before the one-press confirm. Contract: overflow is backup, not the informed-choice path; Digit path must inform without mouse-only scroll. Typical 1080p (`72vh` ~777 px) still shows all five.
**Fix:** Drop the extra `72vh` cap and keep `max-height: calc(92vh - 5.5rem)` so title + footer stay and the list uses the reserved budget. If playtest still clips, tighten row `padding` / `margin` (`screens.css` **633–634**) before any new key. Do not bind a scroll Digit. Do not add a `tabindex` trap.
**Status:** open (layout residual). Worker self-audit already named overflow as mouse/trackpad backup.

#### 🟡 Minor: row hover is fill-only

**Location:** `src/ui/screens.css:640-642`; rows are clickable `div`s (`origins.js:398-405`)
**Issue:** Contract: focus / hover must not be color-only. `:hover` only raises `background` teal alpha (0.06 → 0.18). Border, type, and Digit label do not change. Keyboard confirm is Digit, not Tab, so missing `:focus` is acceptable. Mouse hover still has no non-color companion (border brighten, inset mark, or underline).
**Fix:** On `:hover` (and optional `:focus-visible` if a later PR adds focusables), also raise `border-color` or add a 1 px left edge. Keep Digit + name + preview words as the choice identity. Do not add a `tabindex` trap this PR.
**Status:** open. Not a confirm-path blocker.

#### 💡 Suggestion: cargo joiner is not the DOT rhythm

**Location:** `src/game/origins.js:262` (` + cargo …`) vs danger `parts.join(DOT)` at **290**
**Issue:** Beautiful danger reads `Start Freehold Drift · bond 0.35 · hunger 0.4 + cargo Living rock ×2`. The plus-space joiner is still labeled words (not color-only). It breaks the compact ` · ` scan line.
**Fix:** Join cargo with `DOT` (`cargo Living rock ×2`) if playtest wants one rhythm. Do not move cargo onto hull (kit mutate omit).

#### 💡 Suggestion: colorblind tokens do not reach this overlay

**Location:** `src/ui/screens.css:566-569` (`body.rw-colorblind .screen-overlay`); origin overlay is a bare `position:fixed` root (`origins.js:349-353`), not `.screen-overlay`
**Issue:** Okabe-Ito accent remap never applies to origin chrome. Preview ink is already gray-cyan words, so consequence kinds stay readable. Hover/border teal is extra.
**Fix:** optional later: `body.rw-colorblind .rw-origin-row` border/ink, or leave as live (overlay predates PR1). Do not steal `.screen-overlay` to inherit tokens.

#### 💡 Suggestion: row `:focus` style

**Location:** `.rw-origin-row:hover` (`screens.css:640-642`)
**Issue:** Click rows have hover, not a Tab focus ring. Keyboard confirm is Digit1–5, not Tab. Contract forbids a `tabindex` trap.
**Fix:** none required this PR. Same as worker self-audit.

### A11y / layout checks

- [x] Color is not the only cue (Digit + name + labeled preview words)
- [x] Keyboard Digit1–5 and click still confirm once
- [x] `textContent` only for name, line, preview, footer
- [x] No new animation (`reducedMotion` safe)
- [x] Title + footer outside the list scroller
- [x] No station/pause class steal
- [x] Compact ~10 px sublines primary; overflow is CSS backup
- [ ] Short viewport: Digit5 may sit behind overflow (Minor)
- [ ] Hover fill is color-only (Minor)

### Worker self-audit

`out/w142/org01/ui-audit.md` matches live structure (compact type, list overflow, no animation, no class steal). This parent pass keeps 0 Blocker / 0 Major, names the `72vh` cap as the clip mechanism, and raises hover color-only to Minor because the contract says so.

### Verdict

**Pass with Minors.** PR1 may ship for Digit-informed choice at desktop height. Tighten list `max-height` if 720p playtest hides Rim Drifter. Do not add a scroll key. Do not steal `.screen-panel`.
