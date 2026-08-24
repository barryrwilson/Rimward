# UI Audit: Wave 92 BIO-02 Beautiful Hangar train papers

**Auditor:** `[designer]` (independent of `out/w92/bio02/ui-audit.md` — do not rubber-stamp)
**Scope:** Live Beautiful Hangar **Train hull** papers (Offer / Confirm / No sale / short credits). `trainPending` cancel. Digit **0** Shipyard unchanged. Gift papers on **People** still present.
**Review file:** `out/w92/bio02/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Live `src/` + merge law. No Playwright. [NO BROWSER COVERAGE].
**Stance:** accessibility, theming, responsive layout, states, visual hierarchy.
**Date:** 2026-08-22
**Product source:** review only (no `src/` edits).

Sources: `src/systems/shipyard-desk.js`, `src/systems/station.js`, `src/ui/screens.css`, `src/game/shipyard.js`, `src/game/bio-seed.js`, `out/w86/bio02/shared-contract.md`, `out/w92/bio02/ui-audit.md`, `docs/Bio02EvolutionDesign.md`.

Wave 86 designer majors (hostile/short-credits matrix; `trainPending` chrome sites) are **closed in live code**. This pass does not reopen them.

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Real `btn()` Offer / Confirm / Cancel; visible labels; Digit 0 Shipyard at dock menu; Digit 1 Hangar / Digit 2 Yard; Digit 3+ no-op while pending; Esc cancel; dest hop as text; `textContent` / no `innerHTML`; People gift Digit 1 still lives |
| Theming | Reuse `.shipyard-buy-row.shipyard-confirm` and station tokens; no dest-only hue badge; no new overlay z-index |
| Responsive | Offer **under** hull list (not a side column); pending **replaces** the list; panel `min-width: 560px` family |
| States | Eligible Offer; hostile `No sale.`; short-credits Offer + Confirm refuse; hull refuse notes; hide off Beautiful; pending cancel on chrome; busy flag |
| Hierarchy | Confirm papers (warm) before Esc — Cancel; cargo-keep as its own `screen-note`; Digit 0 still Shipyard, not Train |

---

## UI Audit: Hangar train papers (live)

### Summary
Beautiful Hangar ships the Wave 86 matrix as live chrome: `Train hull` + UU when eligible or short of credits, `No sale.` with no button when hostile, one hull note otherwise, two-step Confirm papers, cargo-keep as a fact. Digit 0 is still Shipyard. Gift papers still sit on People. This pass finds no Blocker and no Major.

### Verdict
**CLEAN.** 0 blockers, **0 majors**, 2 minors, 3 suggestions.

Worker residual “No Blocker or Major” is **correct** for this serial. Prior freeze majors are implemented.

### What's done well
- Digit **0** at the dock menu still opens Shipyard (`DOCK_KEY_SERVICES` last key). Labels include Shipyard. `KeyY` still selects shipyard. Hangar Digit **1** / Yard Digit **2** stay pane tabs (`station.js:180`, `5677–5681`, `5783–5789`; `shipyard-desk.js:17–19`, `431–440`, `454–465`). No new `DOCK_KEY_SERVICES` key. Train is not a Digit 3 tab.
- Eligible / short credits: full-width `shipyard-buy-row` **under** the hull loop, `Train hull` `btn()` plus `{price} UU`. Hostile `rep < 0`: note `No sale.`, **no** Train button. Does **not** copy `graftOfferVisible` hide (`shipyard-desk.js:206–226`, `409–421`; merge law §4.2).
- Short credits keep the Offer so papers can show dest + cargo-keep. Confirm refuses with `Not enough credits.` (`shipyard-desk.js:86`, `257–258`; `hangar.js` debit gate). No mute Train control. Never “not available.”
- Ineligible hulls: one note, first match, no stack — Unknowables → living/grafted → already-heavy / off-ladder → hostile (`shipyard-desk.js:210–222`, `411–413`; §4.3). Non-Beautiful docks `kind: 'hide'` (`206–207`).
- Papers reuse `.shipyard-buy-row.shipyard-confirm` and **replace** the hull list (`365–384`). Hop name is `light → heavy` / `cutter → heavy` via `classLabel` + `hasOwn` (`367–373`). Meta `{price} UU · Confirm papers`. Cargo-keep is a sibling `screen-note` with `TRAIN_CARGO_NOTE` (`375`). Always, including `reducedMotion` (no graft-style shorten). Confirm papers (warm) **before** Esc — Cancel (`376–383`).
- `h()` / `btn()` / `textContent` only. `btn()` sets `type="button"` (`station.js:4239–4250`). `shipyard-desk.js` has no `innerHTML`. Overlay clear is `overlay.textContent = ''` (`station.js:5663`).
- Hit targets: `.screen-btn` is full panel width, padding `7px 12px`, hover + `focus-visible` outline (`screens.css:74–100`). Warm confirm vs default Cancel matches yard/graft (`screens.css:102–112`).
- `ui.trainPending` lives next to `graftPending` (`station.js:4231–4232`). `cancelTrainPending` shares the Esc gate with graft/yard (`5797–5798`). Null with **no** debit on Back (`5693–5702`), `selectService` (`5718–5725`), `dock` (`5743–5744`), `undock` / KeyB (`5768–5770`, `5813`), leave Hangar pane (`shipyard-desk.js:107–110`), Esc fallthrough (`5807–5808`). Digit 3+ while pending no-ops (`473`). Confirm re-reads `mountedId` (`247–250`) and calls `redraw()` (`377–378`) so CREDITS / HOLD update (`station.js:5672–5673`).
- Beautiful Hangar legend appends `Train on Hangar · Esc cancels papers` (`shipyard-desk.js:443–447`). No Train Digit. Hull 3+ / 0 last row stay.
- Gift papers on People are still present and still Digit **1** on that service: `renderPeople` → `renderGiftPapers`, `1 — Papers` / Confirm papers, Esc cancel (`station.js:5373–5406`, `5799`, `5852–5856`; `bio-seed.js:35–40`). Train does not steal People Digit 1. `selectService` still clears `giftPending` (`5725`) the same way it clears `trainPending`.
- Success copy is `The hull takes the heavy form.` (`shipyard-desk.js:91`). Dest identity is the word hop, not a hue-only badge. `.shipyard-confirm` left stripe is extra, not the only cue (`screens.css:409–411`).

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None.

#### 🟡 Minor: Mounted-id header remains on papers

**Location:** `src/systems/shipyard-desk.js:347–348`, `365–384`
**Severity:** minor
**Status:** open (pre-existing Hangar chrome; graft does the same at `349–363`)

**Issue:** `HANGAR` and `Mounted id ${mountedId}` always paint before the pending box. Confirm papers then **replace** the hull list, so the raw save id is still on screen next to `light → heavy`. Merge law §7.2 forbids `mountedId` in the confirm **name**. The header is not that name, but it is the only hull id the player sees while papers are up.

**Fix:** Out of first-impl scope if graft keeps the same header. A later Hangar polish can hide `shipyard-mounted` while `graftPending` or `trainPending` is armed, or print a sanitized hull **name** instead of the id.

#### 🟡 Minor: Corrupt pending dest paints `→ light`

**Location:** `src/systems/shipyard-desk.js:367–370`
**Severity:** minor
**Status:** open (fail-closed confirm already refuses; paint is the hole)

**Issue:** If `pending.destClass` is not `'heavy'` (or fails `hasOwn`), the hop uses `classLabel('light')` as dest. The pane can read `cutter → light` while Confirm still refuses `class`. A money pane that names the wrong hop is a trust break even when debit does not fire.

**Fix:** If dest is not a safe `'heavy'`, skip the confirm box and `cancelTrainPending` (same as a missing pending). Do not substitute `light`.

#### 💡 Suggestion: Confirm stripe is a hardcoded cyan, not `--rw-accent`

**Location:** `src/ui/screens.css:409–411` vs tokens at `11–13`, colorblind at `561–565`
**Issue:** `.shipyard-confirm { border-left-color: #6fd2e0; }` does not follow `body.rw-colorblind` / contrast `--rw-accent`. Train papers have **no** hull preview (yard confirm does), so the stripe is the only pending color cue beside type.
**Fix:** Optional later token: `border-left-color: var(--rw-accent)`. Do not invent overlay CSS. Hop text already carries dest.

#### 💡 Suggestion: Notice is not a live region; busy has no extra chrome

**Location:** `src/systems/station.js:5708`; `src/systems/shipyard-desk.js:241–262`; `.station-notice` `src/ui/screens.css:170–176`
**Issue:** Short-credits and success copy land in `ui.notice` as a text node. `.station-notice` has no `aria-live`. `trainBusy` is a re-entry flag with no disabled style (same as graft).
**Fix:** Keep `textContent`. Do not invent a spinner overlay. Optional later a11y pass: `aria-live="polite"` on `.station-notice`. Double-click already no-ops via `trainBusy`.

#### 💡 Suggestion: One-second docked rebuild drops keyboard focus on Confirm

**Location:** `src/systems/station.js:5905–5907`, `5654–5664`
**Issue:** Docked refresh rebuilds the overlay from scratch every 1 s. Confirm papers is a real `btn()` in tab order, but the node dies each rebuild. Pre-existing station chrome, not Train-specific. Do **not** autofocus Confirm on each rebuild (that would steal focus every second).
**Fix:** Out of BIO-02. A later station a11y pass can restore focus by a stable control id. Train must not add autofocus.

### Keyboard
- Level 1 Digit **0** / `KeyY` → Shipyard (unchanged).
- Digit **1** Hangar, Digit **2** Yard.
- Digit **3+** (and Hangar **0** last row) no-op while `trainPending` (same as `graftPending`).
- Esc cancels papers without debit, then Esc / Back leaves Hangar.
- KeyB undock nulls `trainPending` in `undock()` (does not use the Esc cancel branch).
- People Digit **1** still arms sworn gift papers when that offer is visible.
- No Train Digit. Undocked weapon digits stay behind `ui.open`.

### Checks
- [x] Focus visible on Confirm / Cancel / Train hull (shared `.screen-btn:focus-visible`)
- [x] Confirm before Cancel
- [x] Hostile: note, no mute button
- [x] Short credits: Offer stays; Confirm refuses
- [x] Cargo-keep `screen-note` always
- [x] Digit 0 Shipyard unchanged
- [x] Digit 1 Hangar / Digit 2 Yard unchanged
- [x] Gift papers still on People
- [x] `trainPending` cleared on Esc / Back / select / dock / undock / leave Hangar
- [x] No `innerHTML`
- [x] No new overlay / z-index

### Closed vs Wave 86 designer majors
- **Major 1** Hangar matrix (hostile `No sale.`, short-credits Offer, no graft hide) — **closed** in `trainPaint` + Hangar paint (`shipyard-desk.js:206–226`, `409–421`).
- **Major 2** `trainPending` on graft cancel sites — **closed** in `station.js` + `setShipyardPane` / `cancelTrainPending`.

### Residual after this audit
Two minors (mounted-id header on papers; dest fallback hop). Three suggestions (confirm token, notice live region, 1 s focus drop). None block DONE for first-impl papers.
