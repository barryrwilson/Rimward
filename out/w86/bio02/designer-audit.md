# UI Audit: BIO-02 Beautiful Hangar training papers (Wave 86 later UI)

**Auditor:** `[designer]` (independent of `out/w86/bio02/ui-audit.md` — do not rubber-stamp)
**Scope:** Later Hangar **Train hull** papers. Digit 0 Shipyard. Hangar Digit 1. Graft-pattern offer. Confirm papers. Cargo-keep line. No new dock Digit. `textContent` only.
**Review file:** `out/w86/bio02/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Markdown freeze + live Hangar / Digit 0 / graft-confirm baseline. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-22
**Product source:** review only (no `src/` edits, no brief edits). Wave 86 does not ship UI.

Sources: `docs/Bio02EvolutionDesign.md`, `out/w86/bio02/shared-contract.md` (merge law), `out/w86/bio02/ui-audit.md` (worker self-audit), live `src/systems/shipyard-desk.js`, `src/systems/station.js`, `src/ui/screens.css`.

Later UI freeze under review:

- Digit 0 stays Shipyard
- Training is a Beautiful Hangar-pane offer (graft pattern), Hangar Digit 1, Confirm papers
- Cargo-keep line: `Hold stays with this hull. The yard does not dump cargo.`
- No new dock Digit
- `textContent`, no `innerHTML`

## UI Audit: BIO-02 training desk (later serial)

### Summary
The freeze keeps training on the live Shipyard Hangar pane and copies Gilded graft papers: hide on the wrong banner, two-step confirm, cargo-keep as a fact, no Digit steal. It is not CLEAN. Merge law still fights itself on hostile / short-credits visibility, and it does not name the live `graftPending` cancel sites on Back / service change / dock / undock. A later Hangar confirm can reappear after B-launch or hide `No sale.` with no reason.

### Verdict
**NOT CLEAN.** 0 blockers, **2 majors**, 5 minors, 3 suggestions.

Worker B1–B3 (generic “not available”, new Digit / Digit 3 tab, one-click debit / silent cargo dump) are fail-closed in merge law. Worker residual “None at Blocker/Major” is **wrong**. M1–M2 below are still open in the freeze.

### What's done well
- Digit **0** stays Shipyard. Live map is `DOCK_KEY_SERVICES` last key + `KeyY` (`station.js:174, 5612–5616, 5708–5717`). Freeze forbids a new dock service and a Digit 3 Train tab (`shared-contract.md:20, 170–179`; `Bio02EvolutionDesign.md:124–128, 243–248`).
- Hangar Digit **1** / Yard Digit **2** stay pane tabs, not train verbs (`shipyard-desk.js:14–16, 284–298`). Offer is a Hangar **row**, same family as **Graft tissue** (`shipyard-desk.js:268–275`).
- Two-step papers match yard buy: arm pending, then **Confirm papers** as a real `btn()` with `type="button"` (`shipyard-desk.js:196–210`; `station.js:4237–4241`). Digit 3+ while pending no-ops (`handleShipyardDigit` `graftPending` / `yardPending` at `306–324`). Hotkey must not one-click debit (`shared-contract.md:181–190`).
- Cargo-keep is a **mandatory pending-pane sentence**, not a later toast (`shared-contract.md:198`; `ui-audit.md:35–47`). Exact line: `Hold stays with this hull. The yard does not dump cargo.` `reducedMotion` must **keep** that sentence (`shared-contract.md:209`) — unlike `GRAFT_WARN_REDUCED` (`shipyard-desk.js:63–65, 238–243`).
- Non-Beautiful docks **hide** the offer (no dead control). Beautiful ineligible hulls use specific Echo lines. Forbidden: `not available`, `N/A`, `unavailable` (`shared-contract.md:119, 192–207`).
- Hostile copy reuses live yard **`No sale.`** Short credits reuses **`Not enough credits.`** (`shipyard-desk.js:29–37, 58`).
- Confirm uses dest class **token** `heavy` via `textContent` / `classLabel`, not a hue-only “trained” badge (`shipyard-desk.js:100–102, 201`; `ui-audit.md:86–88`). Success copy is `The hull takes the heavy form.` — not `SHIP_CLASSES.heavy.role` (`combat`).
- World strings go through live `h()` `textContent` (`station.js:4230–4235`). `shipyard-desk.js` has no `innerHTML`. Overlay clear is `overlay.textContent = ''` (`station.js:5598`). HOLD stays in the station head (`station.js:5607–5608`) so cargo-keep is checkable after redraw.
- Hit targets: freeze requires `btn()`, not a clickable `div`. Live `.screen-btn` is full panel width, padding `7px 12px`, hover + `focus-visible` outline (`screens.css:74–100`). Warm confirm vs default Cancel matches yard/graft (`shipyard-desk.js:203–210, 244–251`).
- Graft and Train do not share a banner (Gilded vs Beautiful). No dual-offer collision (`ui-audit.md:30`; `shipyard-desk.js:142–151`).
- Feed Digit 4 stays feed (`station.js:174, 5754–5757`). Training is optional. Undocked Digit 1–4 weapons stay with `ui.open` (`station.js:5704–5705`).

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major: Hostile / short-credits hide the offer, but the copy table still needs those lines

**Location:** `out/w86/bio02/shared-contract.md:107–119, 157, 192–207`; `out/w86/bio02/ui-audit.md:49–61`; live graft hide `shipyard-desk.js:142–151`; live yard hostile note `shipyard-desk.js:214–216`
**Severity:** major
**Status:** open (must tighten PR2 hangar states before CLEAN)

**Issue:** Contract §4 says the Train offer is visible only when **all** gates hold, including Beautiful standing `>= 0` and credits `>=` the owner debit. The else-clause then splits:

- non-Beautiful → **hide**
- Beautiful Hangar, ineligible **hull** → **specific** refuse line

Hostile standing and short credits are **not** hull cases. A later worker who copies `graftOfferVisible` will hide Train at a hostile Bloom and never paint `No sale.` A worker who follows the copy table / worker ui-audit will show those lines. Merge law does not pick the hangar layout.

Live patterns already disagree:

- Graft: `dockReputation < 0` → **hide** the offer (`shipyard-desk.js:144`).
- Yard: `rep < 0` → note **`No sale.`** and still list papers (`214–227`).

Owner UI law is: never a mute control, never “not available,” always say **why** on a Beautiful Hangar. Hiding Train when standing is bad or UU is short fails that law. Showing a disabled Train button also fails it.

**Fix:** Freeze one hangar matrix for PR2 (Beautiful banner only):

| State | Control | Copy |
|---|---|---|
| Eligible + owner UU | `Train hull` button + price | none extra |
| Hostile `rep < 0` | **no** Train button | note `No sale.` (yard, not graft hide) |
| Short credits | keep **Offer** so papers can show dest + cargo-keep; Confirm refuses | confirm / notice `Not enough credits.` |
| Already `heavy` | **no** Train button | `This hull is already as large as this dock trains.` |
| Built / grafted | **no** Train button | `Training is for living hulls.` |
| Unknowables | **no** Train button | `The Unknowables do not train here.` |
| Ace / freighter / frigate living | **no** Train button | `This dock does not train that class.` |
| Owner UU still open | **omit** offer (no mute button) | do not invent a price |

Do not copy `graftOfferVisible`’s reputation early-return for Train. Credits are a confirm refuse, not a hidden desk.

#### 🟠 Major: Train pending is not named on live graft cancel sites

**Location:** `out/w86/bio02/shared-contract.md:170–188, 223`; `out/w86/bio02/ui-audit.md:41`; `docs/Bio02EvolutionDesign.md:187`; live `station.js:4225, 5628–5635, 5655, 5674, 5697, 5722–5732`; `shipyard-desk.js:75–79, 89–94, 165–167`
**Severity:** major
**Status:** open (PR2 must list station chrome, not only `shipyard-desk.js`)

**Issue:** Graft papers are safe because `ui.graftPending` dies on every chrome path:

- leave Hangar pane (`setShipyardPane` `78–79`)
- Esc first (`cancelGraftPending` at `station.js:5723`)
- Esc fallthrough to level 1 (`5732`)
- ← Back (`5633`)
- `selectService` (`5655`)
- `dock` / `undock` (`5674`, `5697`)
- confirm also checks `pending.mountedId` still matches the mounted row (`shipyard-desk.js:165–167`)

Contract §7.2 only says Esc / Cancel clear pending. Worker ui-audit only cites `station.js:5723`. `KeyB` undock from level 2 (`5736`) never hits that Esc cancel branch; it relies on `undock()` nulling `graftPending`.

If PR2 adds `trainPending` in the desk and forgets those station sites, Beautiful Hangar can reopen on **Confirm papers** after B-launch, after Back, or after a Yard tab — with cargo-keep and a debit still armed. That is a trust break on a money verb. Digit 3+ no-op while pending does not save this.

**Fix:** PR2 freeze (markdown now, code later) must name all of:

1. `ui.trainPending` next to `ui.graftPending` (`station.js:4225`).
2. `cancelTrainPending` in the same Esc gate as `cancelGraftPending || cancelYardPending` (`5723`).
3. Null `trainPending` on Back, `selectService`, `dock`, `undock`, and `setShipyardPane` when the pane is not Hangar.
4. Confirm re-reads `mountedId` (graft `165–167`). Mismatch → refuse, no debit.
5. Confirm callback `redraw()` so CREDITS / HOLD in the head update (`station.js:5607–5608`).

Do not add a new overlay or z-index.

#### 🟡 Minor: “Beside hull cards” can spawn a side column

**Location:** `shared-contract.md:170`; live offer is **after** the hull loop `shipyard-desk.js:254–275`; panel `min-width: 560px` `screens.css:26–31`
**Severity:** minor
**Status:** open for PR2 layout note

**Issue:** Contract says the offer sits **beside** hull cards. Live graft is a full-width `shipyard-buy-row` **under** the hull list. A two-column “beside” would fight the 560–780 px panel and the stacked `.screen-btn` column.

**Fix:** PR2 copies graft: after `hulls.forEach`, one `shipyard-buy-row` (pending: `shipyard-buy-row shipyard-confirm`). No side column. Pending pane **replaces** the hull list (graft `238–252`), so Digit 3+ has nothing to mount.

#### 🟡 Minor: Confirm pane never shows from-class or a safe hull name

**Location:** `shared-contract.md:185–186, 211`; `ui-audit.md:99–102`; live hangar `Mounted id ${mountedId}` `shipyard-desk.js:237`; graft confirm name is only `Graft tissue` `241`
**Severity:** minor
**Status:** open (worker m1 still open)

**Issue:** Papers arm `{ fromClass, destClass: 'heavy', mountedId }` but the pane freeze only requires dest token + debit + cargo-keep. Live hangar already leaks raw ids (`Mounted id hull_starter`). If pending replaces the list, the player can see only `heavy` and a UU figure. Proto ids must not join the confirm box.

**Fix:** Confirm `shipyard-buy-name` is a class hop in **text**: `light → heavy` or `cutter → heavy` (`classLabel` / `hasOwn`). Hull display name through existing `sanitizeName` / `stripControlChars` only. Do not print `mountedId`.

#### 🟡 Minor: Shipyard legend still omits the Hangar money offer

**Location:** `shipyard-desk.js:297–298`; graft also absent from that legend; `ui-audit.md:114–116`
**Severity:** minor
**Status:** open for PR2 copy

**Issue:** Legend is `1 Hangar · 2 Yard · 3+ hull on Hangar · 3+ papers on Yard · 0 last row · Esc back`. Graft is already click-only and unlisted. Train is a second paid Hangar verb. Keyboard users who never hover will not learn that Confirm papers exists, or that Esc cancels **train** pending.

**Fix:** On Beautiful Hangar only, extend the legend with `Train on Hangar · Esc cancels papers`. Do not add a Digit for Train. Do not steal hull 3+ / 0.

#### 🟡 Minor: Refuse-line priority is unspecified

**Location:** `shared-contract.md:107–119, 194–207`
**Severity:** minor
**Status:** open

**Issue:** A built Unknowables row (or grafted + off-ladder) can match more than one Echo line. Later impl could flicker copy or concatenate two reasons.

**Fix:** First match, one note, **no** Train button: Unknowables → built/grafted → off-ladder / already-heavy → hostile `No sale.` Never stack.

#### 🟡 Minor: Owner UU still open leaves a silent Beautiful Hangar

**Location:** `shared-contract.md:118, 162`; `ui-audit.md:61, 120`; `Bio02EvolutionDesign.md:219–224`
**Severity:** minor
**Status:** accepted until PR4; do not paper over with fake UU

**Issue:** Fail-closed “omit the offer” is correct (no mute “not available”, no invented price). Eligible living `light` / `cutter` at a Bloom then looks like today’s Hangar: no training at all. That is an empty state with no explanation.

**Fix:** Keep omit until OwnerDecisions. Do not ship a dead button. After PR4, use the matrix in Major 1.

#### 💡 Suggestion: Reuse `.shipyard-confirm`; do not invent overlay CSS

**Location:** `screens.css:386–411, 531–570`; `ui-audit.md:108–110`
**Issue:** Confirm cyan is a left border on a row that **replaces** the list, plus a warm button — not color-only. High-contrast already wraps `.shipyard-buy-meta`. New z-index would fight `.screen-overlay` (`z-index: 20`).
**Fix:** Reuse `.shipyard-buy-row.shipyard-confirm`. No new overlay. No dest-only green name.

#### 💡 Suggestion: Cargo-keep is its own `screen-note`, not graft-style meta

**Location:** graft meta `shipyard-desk.js:242–243`; cargo-keep `shared-contract.md:198, 209`; `.shipyard-buy-meta` `screens.css:402–407`
**Issue:** Graft packs UU + warn on one meta line and **shortens** under `reducedMotion`. Train must not copy that pack: the cargo-keep sentence is long and must survive reduced motion.
**Fix:** Name: dest hop. Meta: `{price} UU · Confirm papers` once owner UU exists. Next sibling: `h('div', 'screen-note', box, 'Hold stays with this hull. The yard does not dump cargo.')`. Always. Then Confirm papers (warm) / Esc — Cancel, Confirm first.

#### 💡 Suggestion: Notice stays a text node; busy has no extra chrome

**Location:** `station.js:5641`; graft `ui.graftBusy` `shipyard-desk.js:159–178`; security-review in-flight double confirm
**Issue:** Live `.station-notice` is not `aria-live`. Graft busy is a re-entry flag with no disabled style. Do not invent a spinner overlay.
**Fix:** Keep `ui.notice` via `h(..., ui.notice)` / `textContent`. Optional: `aria-live="polite"` on `.station-notice` if a later a11y pass owns station chrome. In-flight / busy: reuse graft’s flag so double-click does not debit twice; do not grey the whole desk.

### Accessibility (later impl)
- Controls are real `<button type="button">` with visible labels (`1 — Hangar`, `Confirm papers`, `Esc — Cancel`).
- Focus ring already exists on `.screen-btn:focus-visible` (`screens.css:95–100`). Pending pane: Confirm **before** Cancel (worker m2; live graft/yard already do this).
- Keyboard: Digit 0 opens Shipyard at the dock menu; Digit 1 Hangar; Digit 2 Yard; Digit 3+ mount or no-op while pending; Esc cancels pending then Back. Do not bind Train to a Digit. Do not steal undocked weapon digits (`ui.open` already consumes dock keys).
- Offer graft today is click-only (`Offer graft` has no Digit). Train may match that **if** the legend names it (Minor above) and the control is `btn()`.
- Station render rebuilds the overlay (including a 1 s docked refresh, `station.js:5590–5598`). Do not autofocus Confirm every rebuild (that would steal focus each second).
- Colorblind / contrast: reuse station tokens; class identity is the word `heavy`.

### Closed in freeze (agree with worker; not residual)
- **B1** Generic disabled Train / “not available” — banned; hide vs Echo lines.
- **B2** New `DOCK_KEY_SERVICES` key / Digit 3 Train tab — forbidden; Digit 0 Shipyard; Hangar offer only.
- **B3** One-click debit / silent cargo dump — two-step papers + mandatory cargo-keep sentence.
- **M1 (worker)** Hue-only dest cue — dest is text `heavy`.
- **M2 (worker)** Confirm must be `btn()` — freeze requires it.
- **M3 (worker)** `reducedMotion` dropping cargo-keep — forbidden.
- `innerHTML` — forbidden; live `h()` is `textContent`.
- Feed Digit 4 is not training.

### Residual after this audit
Two majors (hostile/credits hangar matrix; `trainPending` chrome wiring). Five minors (layout “beside”, confirm from-class, legend, refuse priority, UU-open silence). Do not report the later UI freeze DONE until the two majors are written into merge law or PR2 notes.
