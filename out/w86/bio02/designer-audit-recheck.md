# UI Audit recheck: BIO-02 Beautiful Hangar training papers (Wave 86)

**Auditor:** `[designer]` (independent of `out/w86/bio02/ui-audit.md` — do not rubber-stamp)
**Scope:** Recheck of later Hangar **Train hull** papers after the prior designer Majors. Digit 0 Shipyard. Hangar Digit 1. Graft-pattern offer. Confirm papers. Cargo-keep line. No new dock Digit. `textContent` only.
**Review file:** `out/w86/bio02/designer-audit-recheck.md`
**Prior audit:** `out/w86/bio02/designer-audit.md` (2 majors: hangar matrix; `trainPending` cancel sites)
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live Hangar / Digit 0 / graft-confirm baseline. No Playwright. [NO BROWSER COVERAGE].
**Stance:** accessibility, theming, responsive layout, states, visual hierarchy.
**Date:** 2026-08-22
**Product source:** review only (no `src/` edits, no brief edits). Wave 86 does not ship UI.

Sources: `docs/Bio02EvolutionDesign.md`, `out/w86/bio02/shared-contract.md` (merge law), `out/w86/bio02/ui-audit.md` (worker self-audit), prior `out/w86/bio02/designer-audit.md`, live `src/systems/shipyard-desk.js`, `src/systems/station.js`, `src/ui/screens.css`.

Do not reopen accepted Owner-UU omit. Do not require Playwright.

---

## Stance (checked)

| Area | What this pass checked |
| --- | --- |
| Accessibility | Real `btn()` Confirm / Cancel, visible labels, Digit map, Esc cancel, no mute Train control, dest as text `heavy`, `textContent` / no `innerHTML` |
| Theming | Reuse `.shipyard-buy-row.shipyard-confirm` and station tokens; no dest-only hue badge; no new overlay z-index |
| Responsive | Offer **under** hull list (not a side column); pending **replaces** the list; live panel `min-width` family |
| States | Beautiful Hangar matrix: eligible, hostile, short credits, hull refuse, Owner UU omit; pending cancel on chrome; busy / double-confirm |
| Hierarchy | Hangar Digit 1 vs Yard Digit 2; Confirm papers (warm) before Esc — Cancel; cargo-keep as its own `screen-note` |

---

## UI Audit: BIO-02 training desk (recheck)

### Summary
Merge law now writes the two prior designer Majors: Beautiful Hangar **paint** is a matrix (hostile `No sale.` note, short-credits Offer, no `graftOfferVisible` hide), and `ui.trainPending` dies on the live graft chrome sites. Mutate gates stay fail-closed. This recheck finds no new Blocker or Major. Owner UU omit stays accepted until PR4.

### Verdict
**CLEAN.** 0 blockers, **0 majors**. Prior Major 1 and Major 2 are closed in merge law.

Live `src/` is unchanged (Wave 86 markdown only). Missing live `trainPending` is the later serial, not a remaining freeze hole.

### What's done well
- Digit **0** stays Shipyard. Live map is `DOCK_KEY_SERVICES` last key + `KeyY` (`station.js:174, 5612–5616, 5708–5717`). Freeze still forbids a new dock service and a Digit 3 Train tab (`shared-contract.md:20, 207–217`; `Bio02EvolutionDesign.md:125–128, 254`).
- Hangar Digit **1** / Yard Digit **2** stay pane tabs (`shipyard-desk.js:14–16, 284–298`). Offer is a full-width Hangar row **after** `hulls.forEach` (`shared-contract.md:201–205`; live graft `shipyard-desk.js:254–275`).
- Two-step papers: arm pending, then **Confirm papers** as `btn()` `type="button"` (`shipyard-desk.js:196–210, 237–241`; `station.js:4237–4241`). Digit 3+ while pending no-ops like graft (`handleShipyardDigit` `324`; freeze `shared-contract.md:239`).
- Cargo-keep is a mandatory pending `screen-note`: `Hold stays with this hull. The yard does not dump cargo.` `reducedMotion` must **keep** that sentence (`shared-contract.md:225, 247`).
- Non-Beautiful docks **hide** Train chrome. Beautiful ineligible hulls use one Echo line. Forbidden: `not available`, `N/A`, `unavailable` (`shared-contract.md:107, 128, 241–257`).
- Hostile copy reuses live yard **`No sale.`** Short credits reuses **`Not enough credits.`** (`shipyard-desk.js:29–37, 58`; `shared-contract.md:135–136, 190–193, 254–255`).
- Confirm name is the class hop in text (`light → heavy` / `cutter → heavy`). Dest class is the word `heavy`. Never print `mountedId` (`shared-contract.md:223–224`).
- World strings go through live `h()` `textContent` (`station.js:4230–4235`). Overlay clear is `overlay.textContent = ''` (`station.js:5598`). HOLD stays in the station head (`station.js:5607–5608`).
- Hit targets: freeze requires `btn()`, not a clickable `div`. Live `.screen-btn` is full panel width with hover + `focus-visible` outline (`screens.css:74–100`).
- Confirm cyan is a left border on `.shipyard-confirm` (`screens.css:409–411`). No new overlay. `.screen-overlay` stays the chrome (`z-index` unchanged).
- Graft and Train do not share a banner. Closed door: do not copy `graftOfferVisible` reputation hide onto Train (`shared-contract.md:335`; live hide `shipyard-desk.js:142–144`).

---

## Recheck of prior Major 1 — hangar matrix (closed)

**Prior issue:** Contract §4 said the Train offer is visible only when **all** mutate gates hold, including Beautiful standing `>= 0` and credits. Hostile standing and short credits are not hull cases. A worker who copied `graftOfferVisible` would hide Train at a hostile Bloom and never paint `No sale.` Merge law did not pick one Hangar layout.

**Now in merge law:** Mutate and paint are split. Do **not** copy `graftOfferVisible` (`shared-contract.md:105–107`). Beautiful Hangar matrix is §4.2.

| Freeze item | Where | Status |
| --- | --- | --- |
| Eligible + owner UU → `Train hull` + price | §4.2 table (`shared-contract.md:134`) | **Closed** |
| Hostile `rep < 0` → **no** button, note `No sale.` (yard, not graft hide) | §4.2 `:135`; §6 `:190`; brief `:138, :215, :261, :294` | **Closed** |
| Short credits → keep **Offer**; Confirm refuses `Not enough credits.` | §4.2 `:136`; §6 `:193`; brief `:139, :215, :295` | **Closed** |
| Already `heavy` / built-grafted / Unknowables / off-ladder | §4.2 `:137–140` | **Closed** |
| Owner UU still open → **omit** (no mute button, no invented price) | §4.2 `:141`; §6 `:195`; prior Minor accepted | **Accepted omit** — do not reopen |
| Non-Beautiful → hide all Train chrome | §4.2 `:128`; §7.3 `:257` | **Closed** |
| Hostile / short credits are desk states, not hull-hide | §4.2 `:143–144` | **Closed** |
| PR2 must land the matrix; must **not** graft-hide | §11 (`:315`) | **Closed** |
| Closed door: `graftOfferVisible` reputation hide | §12 (`:335`) | **Closed** |

Live patterns still disagree (graft hide `shipyard-desk.js:144` vs yard `No sale.` `214–216`). That is why the Train freeze names the **yard** hostile note. PR2 must follow §4.2, not graft.

Worker D1 claim matches this pass. Independent check: the §4.2 table is the same matrix the prior designer Major required.

---

## Recheck of prior Major 2 — `trainPending` cancel sites (closed)

**Prior issue:** Contract §7.2 only said Esc / Cancel clear pending. Live graft dies on pane leave, Esc first, Esc fallthrough, Back, `selectService`, `dock`, `undock`. `KeyB` from level 2 never hits the Esc cancel branch; it relies on `undock()`. If PR2 added `trainPending` in the desk and forgot those station sites, Confirm papers could reopen after B-launch / Back / Yard tab.

**Now in merge law:** §7.2 names `ui.trainPending` and every live graft chrome path.

| Freeze item | Live graft cite (still valid) | Train freeze | Status |
| --- | --- | --- | --- |
| `ui.trainPending` next to `ui.graftPending` | `station.js:4225` | §7.2.1 (`shared-contract.md:223`) | **Closed** |
| Leave Hangar pane | `setShipyardPane` `78–79` | Null when pane is not Hangar (`:231`) | **Closed** |
| Esc first (level 2 shipyard) | `station.js:5723` | `cancelTrainPending` in the same gate as `cancelGraftPending \|\| cancelYardPending` (`:232`) | **Closed** |
| Esc fallthrough to level 1 | `5732` | Null with the other pendings (`:233`) | **Closed** |
| ← Back | `5628–5635` | Null (`:234`) | **Closed** |
| `selectService` | `5655` | Null (`:235`) | **Closed** |
| `dock` | `5674` | Null (`:236`) | **Closed** |
| `undock` (incl. KeyB `5736`) | `5697` | Null; KeyB does not hit Esc cancel (`:237`) | **Closed** |
| Confirm re-reads `mountedId` | desk `165–167` | Mismatch → refuse, no debit (`:117, :226`) | **Closed** |
| Confirm `redraw()` | graft `244–246` | CREDITS / HOLD head (`station.js:5607–5608`; freeze cites `5607–5609`) | **Closed** |
| Export `cancelTrainPending` | `cancelGraftPending` `89–94` | Next to graft (`:239`) | **Closed** |
| Digit 3+ no-op while pending | `handleShipyardDigit` `324` | Same (`:239`) | **Closed** |
| No new overlay / z-index | `.shipyard-confirm` `screens.css:409–411` | Reuse row (`:213, :219`) | **Closed** |
| Closed door: pending after Back / Yard / B-launch | — | §12 (`:336`); brief `:141, :152, :194–195, :261, :297, :324` | **Closed** |
| PR2 lands cancel sites | — | §11 (`:315`) | **Closed** |

Desk ownership also lists station keydown / Back / dock / undock / pane as readers (`shared-contract.md:301`).

Worker D2 claim matches this pass. Independent check: the §7.2 table lists every site the prior designer Major named.

---

## Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None remaining. Prior hangar-matrix Major and prior `trainPending` chrome Major are written into merge law.

#### 🟡 Minor
None new. Prior layout / hop-name / legend / refuse-priority minors are now freeze law (§7.1, §7.2.2, §4.3). They do not reopen.

Owner UU omit (prior Minor) stays **accepted** until PR4. Eligible living `light` / `cutter` at a Bloom with no owner integer still looks like today’s Hangar. Fail-closed omit is correct. Do not invent a price. Do not ship a mute button.

#### 💡 Suggestion
None new. Prior suggestions (reuse `.shipyard-confirm`, cargo-keep as its own `screen-note`, notice as a text node / graft busy flag) are already named in §7.1–§7.2. Later a11y may add `aria-live="polite"` on `.station-notice` (`station.js:5641`); that is optional and not this freeze.

### Accessibility (later impl — unchanged)
- Controls are real `<button type="button">` with visible labels (`1 — Hangar`, `Confirm papers`, `Esc — Cancel`).
- Focus ring already exists on `.screen-btn:focus-visible` (`screens.css:95–100`). Pending pane: Confirm **before** Cancel.
- Keyboard: Digit 0 opens Shipyard; Digit 1 Hangar; Digit 2 Yard; Digit 3+ mount or no-op while pending; Esc cancels pending then Back. Do not bind Train to a Digit. Do not steal undocked weapon digits (`ui.open` already consumes dock keys, `station.js:5704–5705`).
- Station render rebuilds the overlay (including a 1 s docked refresh, `station.js:5590–5598`). Do not autofocus Confirm every rebuild.
- Colorblind / contrast: reuse station tokens; class identity is the word `heavy`.

### Closed in freeze (agree with worker; not residual)
- **B1** Generic disabled Train / “not available” — banned; hide vs Echo lines.
- **B2** New `DOCK_KEY_SERVICES` key / Digit 3 Train tab — forbidden.
- **B3** One-click debit / silent cargo dump — two-step papers + mandatory cargo-keep.
- **D1 / Major 1** Hostile / short-credits hangar matrix — §4.2.
- **D2 / Major 2** `trainPending` chrome wiring — §7.2 table.
- **M1 (worker)** Hue-only dest cue — dest is text `heavy`.
- **M2 (worker)** Confirm must be `btn()` — freeze requires it.
- **M3 (worker)** `reducedMotion` dropping cargo-keep — forbidden.
- Prior designer minors: “beside” layout, confirm hop name, Beautiful Hangar legend, refuse-line priority.
- `innerHTML` — forbidden; live `h()` is `textContent`.
- Feed Digit 4 is not training.

### Residual after this recheck
None at Blocker/Major. Later UI freeze may report the two prior Majors **closed**. Owner UU still gates whether Eligible shows a price (omit until PR4 — accepted). Implementation remains a later serial; this wave does not ship UI.
