# Designer audit: Wave 94 Unknowables dock chrome

| Field | Value |
|---|---|
| **Scope** | Archive papers at dock faction `unknowables`; People `portraitFor('unknowables', id)`; Models Browser `station:unknowables`; hostile `No sale.` |
| **Reviewer** | UI/UX auditor (review only; product source not edited) |
| **Date** | 2026-08-23 |
| **Verdict** | **clean** — no Blocker, no Major |

Owner law (`docs/OwnerDecisionsWave94.md` §5; Wave 92 contract §5): Archive on Market papers, not a new Digit. Own crystal **400**. Rival cube **900**. Hostile `standingRead(unknowables) < 0` → `No sale.` Digit 0 shipyard. People `portraitFor('unknowables', id)`. Real `<button>`s. `aria-live` polite on `ui.notice`. Labels `textContent`. Reduced-motion: same prices and No-sale copy.

---

## UI Audit: Unknowables dock chrome

### Summary
The Quiet reuses Assembly Market confirm-papers for Archive, Wave 41 People portraits for Voice-Without, and the Models Browser Stations list for a dedicated `station:unknowables` row. Hostile Archive paints `No sale.` and hides File arms. No Blocker. No Major.

### Spec checklist

| Check | Result | Evidence |
|---|---|---|
| Archive when dock faction is `unknowables` | **Pass** | `archiveDeskAllowed` is true when `UNKNOWABLES_STATION_PATH` is true (`station.js:1188–1191`). `renderMarket` calls `renderArchiveDesk` with `currentDef.faction` (`station.js:4616`). |
| Confirm papers, not one-click UU | **Pass** | File arms set `ui.dataPending`; Confirm calls `confirmArchivePending` (`station.js:1421–1445`, `1450–1500`). |
| Own crystal 400 / rival cube 900 as numbers | **Pass** | Header and buy row write `ARCHIVE_OWN_UU` / `ARCHIVE_RIVAL_UU` (`station.js:1407–1414`, `1451`). |
| Reduced-motion keeps UU in text | **Pass** | Short header still names both amounts (`station.js:1408–1411`). |
| Hostile Archive `No sale.` hides File arms | **Pass** | `archiveHostile` → note then `return` (`station.js:1416–1418`). Probe: `ui.unk.noSale`. Confirm also writes `No sale.` (`station.js:1301–1303`). |
| Hostile gate is Unknowables standing, not Assembly | **Pass** | `standingRead(..., dockFaction)` (`station.js:1194–1196`). |
| Digit 0 stays Shipyard | **Pass** | `DOCK_KEY_SERVICES` last key is `shipyard`; Digit 0 selects it (`station.js:186`, `5919–5922`, `5801–5805`). |
| `textContent` / no `innerHTML` on dock | **Pass** | `h()` assigns `textContent` (`station.js:4302–4307`). |
| Real `<button>` + focus ring | **Pass** | `btn()` sets `type="button"` (`station.js:4309–4313`). `.screen-btn:focus-visible` outline (`screens.css:95–99`). |
| `aria-live` polite on notice | **Pass** | `station.js:5833–5835`. |
| People `portraitFor('unknowables', id)` | **Pass** | `renderPeople` uses dock faction + `contact.id` (`station.js:5548`). Roster id `contact-veil-dockmaster` (`contacts.js:125–126`, `97`). Files `unknowables-a.webp` / `b.webp` exist. |
| Models Browser `station:unknowables` | **Pass** | Catalog row after Beautiful, before placeholder (`model-catalog.js:139–146`). `buildStationModel('unknowables')` uses the dedicated builder (`station.js:974–975`). |
| Yard hostile paints `No sale.` | **Pass (paint)** | `shipyard-desk.js:334–336`. Confirm refuse copy is `No sale.` (`shipyard-desk.js:36`, `shipyard.js:219`). Offers still list Papers (Minor). |

### What's done well
- Archive is an additive Market block. It does not steal Digit 0 or add a Digit.
- Unknowables copy mirrors Assembly: legal crystals / does not buy cubes. Assembly copy stays legal cubes / does not buy crystals (`station.js:1407–1414`, `1452–1457`).
- Confirm is `.screen-btn-warm` primary. Cancel is the default button with `Esc — Cancel` (`station.js:1438–1445`).
- Illegal captured origin is a note only. No Confirm on that row (`station.js:1473–1475`).
- Empty hold has a line: `No crystal or cube in the hold.` (`station.js:1460–1462`).
- Hostile Archive still shows the price header, then `No sale.`, then returns. Price is not a color-only cue.
- `h()` writes `textContent`. Buttons are real `<button type="button">`.
- People uses existing `.people-head` / `.people-portrait` 64×64. `alt` is `${contact.name}, ${contact.role}` (`station.js:5555–5561`). Face-spread avoids two copies of one study on one roster (`station.js:5543–5553`).
- Voice-Without is one dockmaster. One portrait. No duplicate-face case on this dock.
- Models Browser row is a `<button class="rw-models-entry">` with `textContent` label `Unknowables Station` (`modelsbrowser.js:373–379`; `model-catalog.js:141–142`).
- Catalog order is VC kit → Beautiful dedicated → Unknowables dedicated → placeholder. Reviewers can compare the dedicated sculpt with the fallback.
- Models `update` freezes ring spin and pulse when `reducedMotion` is true (`station.js:990–1002`).
- Dock notice uses `aria-live="polite"` after each paint.
- Train Offers stay off this dock. Beautiful Hangar already paints `The Unknowables do not train here.` for Unknowables-faction hulls (`shipyard-desk.js:211–213`).

---

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: Hostile yard paints `No sale.` and still lists Papers
**Severity:** Minor  
**Location:** `src/systems/shipyard-desk.js:334–349`; confirm `src/game/shipyard.js:219`  
**Issue:** Digit 2 Yard writes `No sale.` when `rep < 0`, then still loops Offers with `N — Papers`. Archive at the same dock hides File arms after `No sale.` (`station.js:1416–1418`). Confirm still refuse-closes with `No sale.`  
**Why it matters:** A player can arm Confirm papers on a closed yard. The second step then repeats the same line. Archive already shows the tighter fail-closed chrome.  
**Suggestion:** Optional later: `return` after the hostile note, matching Archive. Do not change owner copy. This yard pattern is shared with Beautiful.  
**Status:** open (no fix required this wave)

#### 🟡 Minor: Archive File has no digit; overlay rebuild drops focus
**Severity:** Minor  
**Location:** `src/systems/station.js:1450–1456`, `5778–5788`, `5833–5835`; keys `5948–5961`  
**Issue:** Market Digit 1 arms Beautiful seed only. Archive File is click / Tab. After click, `redraw()` rebuilds the overlay. Focus is not restored. A 1 s dock refresh also rebuilds. Esc still cancels pending (`station.js:5933`).  
**Why it matters:** Keyboard reach to Confirm is Tab onto a button the rebuild can drop. Mouse Confirm still works. Spec forbids a new Digit.  
**Suggestion:** Optional: focus the Confirm filing control after arming. Do not steal Digit 0 or Digit 1.  
**Status:** open (Assembly precedent)

#### 🟡 Minor: Archive Confirm does not lock Market
**Severity:** Minor  
**Location:** `src/systems/station.js:1421–1446` and `4588–4616`; keys `5956–5959`  
**Issue:** Pending Archive paints Confirm, then returns from `renderArchiveDesk`. The commodity table already rendered above. Q/W/A/S still trade.  
**Why it matters:** Two live action families sit on one Market. Esc cancels seed first, then Archive. Unknowables has no seed, so Esc cancels Archive first.  
**Suggestion:** None required this wave. Same family as Assembly Archive and Beautiful seed.  
**Status:** open (precedent)

#### 💡 Suggestion: Hostile Archive `No sale.` has no desk name
**Severity:** Suggestion  
**Location:** `src/systems/station.js:1416–1418`  
**Issue:** Hostile Quiet Market still shows the commodity table, then ARCHIVE header with 400/900, then only `No sale.` Yard uses the same three words.  
**Why it matters:** A reader can read the whole Market as closed. Trade buttons still work.  
**Suggestion:** Optional: `Archive · No sale.` Owner copy is `No sale.` — do not change unless the owner asks.  
**Status:** deferred (spec-compliant)

#### 💡 Suggestion: Models Browser label is faction kit, not berth name
**Severity:** Suggestion  
**Location:** `src/game/model-catalog.js:141–145`; info bar `src/systems/modelsbrowser.js:597–607`  
**Issue:** List label is `Unknowables Station`. Live dock name is The Quiet. Info faction line is the raw id `unknowables`. Beautiful uses the same faction-kit label pattern.  
**Why it matters:** Reviewers find the sculpt under Stations. They do not see the authored berth name in the list.  
**Suggestion:** Keep the kit label. Optional later: info subline `The Quiet` without renaming the catalog id.  
**Status:** deferred (matches Beautiful)

#### 💡 Suggestion: Galaxy chart still has no authored name for The Veil
**Severity:** Suggestion  
**Location:** `src/systems/galaxychart.js` `AUTHORED_IDS` (outside this chrome write-set)  
**Issue:** `SYSTEMS.veil` draws a node. Authored labels skip it. Players still reach The Quiet through the hush gate.  
**Suggestion:** Later write-set: add `veil` to `AUTHORED_IDS`.  
**Status:** deferred (outside write-set)

---

### Contrast / motion / theming

| Topic | Notes | Status |
|---|---|---|
| Archive copy | `.screen-sub` cyan. Notes `#9fb2c6`. Confirm warm. UU is in the string. | pass |
| Hostile `No sale.` | Same `.screen-note` as other refuse lines. Not color-only. | pass |
| Notice | `.station-notice` warm border + `#ffd28a` on dark panel. `aria-live="polite"`. | pass |
| Portrait | 64×64, `object-fit: cover`, border `#31445c`. High-contrast lifts border (`screens.css:614–616`). Name is also text. | pass |
| Focus | Dock `.screen-btn:focus-visible` 2px cyan outline. Models entries use box-shadow rings (`models.css:158–160`, `207–209`). | pass |
| Colorblind | Overlay remaps `--rw-accent` / `--rw-warm` (`screens.css:560–565`). Archive does not add a hue-only File state. | pass |
| Reduced-motion | Archive short header still names 400 and 900. No extra pulse class on papers. Models station `update` freezes spin/pulse. | pass |
| Tokens vs hex | New Unknowables chrome reuses `.screen-*` / `.people-*` / `.rw-models-entry`. No new hardcoded Archive color. | pass |
| Hit target | Full-row File buttons inherit `.people-actions .screen-btn` padding 4×10 (`screens.css:376–378`). Height still ≥ 24 CSS px. Models close is 32×32 (`models.css:41–43`). | pass |

### Keyboard

- Dock Digit 0: Shipyard. Unchanged.
- Market Digit 1: Beautiful seed only. Archive File is Tab / click (spec: no new Digit).
- People Digit 1: sworn gift (Beautiful). Voice-Without Ask around is Tab / click.
- Esc on Market: cancel seed, then Archive pending, then back.
- Esc on Confirm filing: `Esc — Cancel` button plus key handler.
- Models: filter, category tabs, list buttons, ↑↓, R reset, Esc close. Station row is a normal entry button.

### Reduced-motion
- Archive keeps both UU amounts in the short header.
- Illegal / No-sale / does-not-buy lines stay the same.
- No `@keyframes` on Archive papers.
- Models Browser already freezes turntable; Unknowables station `update` also freezes ring and beacon pulse.

### Hierarchy
- Confirm filing is the warm primary. File buy / File from the hold are default. Cancel is default.
- Archive sits under the commodity table. Digit 0 is not involved.
- People portrait is secondary to name + role. Color is not the only identity cue.
- Models list selected state is cyan border plus `rw-selected`, and the info bar repeats the label.

### Non-goals (must stay off)

| Forbidden | Observed |
|---|---|
| New dock Digit / train desk | Not added. Digit 0 remains Shipyard. |
| `DETAIL_STATIONS.unknowables` | Catalog uses dedicated `build()`, not the VC map. |
| Placeholder as origin desk | `isUnknowable` dispatch before placeholder (`station.js:317–319`, `974–979`). |
| `innerHTML` on dock papers | `h()` / `textContent` only. |
| One-click UU | Two-step `dataPending` / Confirm. |
| Color-only price | UU in header, buy row, and Confirm meta. |
| Pulse on reduced-motion | None on Archive. Station browser pulse off when reduced. |

---

## Verdict

**clean.** Unknowables dock chrome meets Wave 94 §5: Archive confirm papers at The Quiet, People portrait for Voice-Without, Models Browser `station:unknowables`, hostile `No sale.` with File arms hidden. Digit 0 stays Shipyard. Remaining items are inherited focus/yard-list nits, not blockers.
