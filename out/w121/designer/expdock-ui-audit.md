# UI Audit: EXP remaining Unknowables dock leftover (Wave 121 CONSUME)

**Auditor:** `[designer]` (independent of `out/w121/expdock/ui-audit.md`)
**Scope:** Wave 121 leftover census. Markdown only. Worker did **not** change live UI. Freeze leftover **CONSUME**: origin dock `veil` / The Quiet and Market Archive own 400 / rival 900 already live. Specified later UI is **none**. Confirm CONSUME does **not** hide a real Archive a11y hole and does **not** schedule new chrome, a new Digit, Digit theft, hub theft, or a second Unknowables dock.
**Review file:** `out/w121/designer/expdock-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Exp04RemainingDockDesign.md`, inventory `out/w121/expdock/current-exp-dock-inventory.md`, worker self-audit `out/w121/expdock/ui-audit.md` (read, not copied). Live Archive desk in `src/systems/station.js` only as needed. No Playwright. No Vite. No Chrome. Did not spawn children. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only (no `src/` / `scripts/` / integrator-doc edits)

Merge law: `out/w121/expdock/shared-contract.md` wins if the brief forks. This wave does not ship dock chrome. Findings bind **later workers**: do not invent Archive chrome while The Quiet Market desk already files.

## UI Audit: Unknowables origin dock / Market Archive two-way (CONSUME)

### Summary

No product UI ships this wave. The pack freezes leftover as **CONSUME**: authored `veil` / The Quiet, dedicated builder, Digit 1 Market Archive, own crystal 400 UU, rival cube 900 UU, hostile `No sale.`, illegal-origin refuse. Named remaining serial is **none**. Specified later UI is **none**. Live Archive is already a real `<button>` desk with confirm papers, `textContent`, polite notice, hover/focus-visible, empty and hostile copy. CONSUME does **not** hide a missing two-way desk or an unusable keyboard path. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors (accepted; not leftover holes), 2 suggestions. CONSUME freeze holds.

### What's done well

- Player-facing origin dock is **already live**. Census + brief + inventory agree: `veil` / The Quiet / `archiveDeskAllowed('unknowables')` / `archivePriceAtDesk` 400/900. EXP-02 two-way is the live Market Archive at Assembly **and** Unknowables, not a second Digit.
- Archive is a Market pane, not a stolen Digit. `renderArchiveDesk` returns unless `ui.level === 2 && ui.service === 'market'` (`station.js` 1419–1420). Market renderer calls it (`4784`). Dock root Digit 1 still opens Market (`DOCK_KEY_SERVICES[0]` = `market`, `188`; Digit handler `6169–6176`).
- Controls are real buttons. `btn()` builds `<button type="button">` with visible `textContent` (`4471–4476`). Buy: `File a legal crystal` / reduced `File buy` (`1474`). Sell: `File from the hold` / reduced `File sell` (`1514`). Confirm: `Confirm filing` (`1460–1463`). Cancel: `Esc — Cancel` (`1464–1467`) plus Esc on Market (`6184`).
- Copy uses `h()` `textContent` (`4464–4469`). Lot labels go through `dataCommodityLabel` / authored UU (`1453–1457`, `1488–1513`). `station.js` `innerHTML` is none. Confirm meta is not raw player HTML.
- States exist on the live desk: hostile paints `No sale.` and returns with no buy buttons (`1438–1440`); empty hold `No crystal or cube in the hold.` (`1482–1484`); illegal origin notice (`1328–1330`, `1495–1497`); refused lots stay as notes (`1499–1509`); Unknowables do not buy cubes (`1479`); credit / hold fail-closed notices (`1352–1367`).
- Reduced-motion short copy keeps numbers (`1424–1436`, `1474`, `1514`). Desk stays visible.
- `ui.notice` uses `aria-live="polite"` when present (`6066–6068`). Pending is session-only: cleared on service change (`6087`), dock (`6107`), undock (`6138`), back (`6052`), Esc (`6184`).
- Focus chrome already exists on dock buttons: `.screen-btn:hover` / `:focus-visible` plus 2px `--rw-accent` outline (`src/ui/screens.css` 88–100). Confirm uses `screen-btn-warm` (`station.js` 1463; `screens.css` 102–112). Contrast mode overrides live (`screens.css` 579+). No new hardcoded Archive color.
- Digit 0 stays shipyard; Digit 8/9 stay launch / epics (`188`, `6034–6038`). Empty 80 px hub stays empty. Aim-glass gauges stay off. Dedicated Unknowables sculpt is presence in space, not a new overlay card.
- Worker self-audit correctly names later UI **none** and does not schedule an Archive Digit.

### CONSUME steal check (Blocker if the brief scheduled these)

| Forbidden later work | Brief / freeze | Live honor | Result |
|---|---|---|---|
| New Archive chrome / second dock / generated SYSTEM | Serial **none**; brief §7 later UI none; Goals 2–3 | `veil` / The Quiet already dock; Market already files | **Pass.** Not scheduled. |
| Archive Digit / Digit 0/8/9 theft | Honor; Digit 0 shipyard | `DOCK_KEY_SERVICES` last = `shipyard` (`188`); menu 0/8/9 (`6034–6037`) | **Pass.** Archive stays Market pane. |
| HUD-01 hub child / aim-glass gauge | Honor HUD-01 | Empty 80 px hub; gauges off | **Pass.** Not this leftover. |
| `DETAIL_STATIONS.unknowables` / D3 reverse | Honor D3 | Table still 10 keys, no `unknowables` | **Pass.** Dedicated builder stays. |
| Invented UU / third SKU | Wave 82/94 copy 400/900 | `archivePriceAtDesk` 400/900 (`1226–1238`) | **Pass.** |
| Persist `dataPending` | Session only | Init `4447`; not `WORLD_FIELDS` | **Pass.** |
| `innerHTML` lot labels | Forbidden | `h()` `textContent` (`4464–4469`) | **Pass.** |
| Chart-label a11y write | Sibling owns `galaxychart.js` | Cite `veil` id only | **Pass.** Not this leftover. |

If a later worker adds an Archive Digit, a second Unknowables dock, hub chrome, or `innerHTML` lot names, that **violates this freeze** and is a Blocker then. This pack does not schedule that work.

### Does CONSUME hide a real a11y hole?

**No.** Keyboard reach to Archive is: dock → Digit 1 Market (or tab to `1 — Market`) → tab to Archive buttons → Confirm → Esc cancel. Native tab order on real `<button>`s works. Hostile and empty states are explicit text, not a blank pane. Fail notices use the existing polite live region. Full overlay rebuild drops focus (station-wide, see Minor). That is friction, not an Unknowables two-way death and not a reason to invent leftover chrome.

Wishlist “Unknowables dock still waits” is **stale vs code**. Treating that line as a missing player-facing desk would be invented work. Code wins.

### Freeze confirmation (later serial)

| Surface | Live | Spec freeze | Later serial |
|---|---|---|---|
| Origin dock | `veil` / The Quiet | CONSUME | **Must not** add a second site |
| Archive host | Market pane `4784` | Later UI **none** | **Must not** add Archive chrome or Digit |
| Digit 0 | shipyard `188` | Honor | **Must not steal** |
| Digit 8 / 9 | launch / epics | Honor | **Must not steal** |
| Own / rival UU | crystal 400 / cube 900 | Wave 82/94 | **Must not invent** |
| Confirm papers | `Confirm filing` / `Esc — Cancel` | Keep | **Must not** drop two-step |
| `h()` / XSS | `textContent` | Forbidden `innerHTML` | **Must not** HTML names |
| Notice | `aria-live` polite `6066–6068` | Keep | **Must not** silent-fail |
| HUD-01 hub | empty 80 px | Honor | **Must not** add Archive pip |
| Overlay z | station overlay `z-index: 20` | Honor | **Must not** raise z |
| Chart labels | sibling | Honor | **Must not** write `galaxychart.js` |

### Accessibility / theming / states (live desk, static)

| Check | Result |
|---|---|
| Contrast / tokens | No new color. Reuse `--rw-accent` / `--rw-warm` / `.screen-note` / `.screen-btn`. Archive heading uses `.screen-sub` cyan. |
| Keyboard | Digit 1 opens Market. Archive rows are tab-to-`<button>`. Esc cancels pending then backs out. Market Digit 1 still seeds when seed visible (`6200`) — do not bind Digit 1 to Archive. |
| Names | Visible English on every Archive button. Confirm / Cancel named. Hostile / empty / refuse are text, not icon-only. |
| Focus | Live `.screen-btn:focus-visible` outline. Overlay rebuild (`6018–6021`) drops focus (accepted Minor; station-wide). |
| Semantic HTML | Real `<button type="button">`. Heading `ARCHIVE` is a `div.screen-sub`, not `h2` (Suggestion; do not restyle as leftover). Overlay has no `role="dialog"` (station-wide; not this leftover). |
| Empty | `No crystal or cube in the hold.` |
| Error | `No sale.` / `Not enough UU.` / `Hold is full.` / illegal-origin / `The archive will not file.` |
| Disabled | Hostile returns before buy/sell buttons. Refused lots have no button. |
| Loading | `ui.dataBusy` re-entry guard (`1310–1311`, `1415`). No Archive spinner. Do not add one. |
| Hover | `.screen-btn:hover` live. |
| Reduced motion | Short ARCHIVE copy; numbers stay. |
| Responsive | No new overlay. Live `.screen-panel` `min-width: 560px` is station-wide, not an Unknowables hole. |
| Hub | 80 px stays empty of Archive chrome. |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Full overlay rebuild drops keyboard focus after arm / confirm

**Location:** `src/systems/station.js:6018–6021`, `1460–1467`, `1474–1477`

**Issue:** Each Archive click calls `redraw()`, which clears `overlay.textContent` and rebuilds the panel. Focus returns to the document, not to `Confirm filing` or the next lot. Keyboard users must tab from the top of the dock overlay again. This is the live station overlay pattern (Market, People, yard papers), not a missing Unknowables desk.

**Fix:** Do **not** invent leftover PR1 focus restore. A later dock-wide focus owner may restore focus after rebuild. Out of scope for EXP-04 CONSUME.

**Status:** accepted — not a two-way hole; CONSUME stands.

#### 🟡 Minor: Archive is not named on the dock root list

**Location:** `src/systems/station.js:188`, `6034–6038` vs `4784`

**Issue:** Dock root buttons say `1 — Market`, not Archive. A new player may not know Digit 1 holds the filing desk. Worker self-audit already recorded this.

**Fix:** Do not invent a Digit or extra dock button. Wave 74/94 chose Market pane. Owner may later ask a Market subtitle; that is **not** this freeze.

**Status:** accepted — discoverability, not inaccessibility; CONSUME stands.

#### 💡 Suggestion: Duplicate sell button names when several lots file

**Location:** `src/systems/station.js:1511–1523`

**Issue:** Every legal sell row uses the same visible name `File from the hold` (or reduced `File sell`). Distinguishing SKU / source / origin lives in the sibling `.screen-note`, not on the button. Sequential reading still hits the note first in each `screen-btnrow`.

**Fix:** Do not add unique `aria-label`s as leftover chrome. If a later dock a11y serial exists, name the button with SKU + UU. Not EXP-02 death.

**Status:** accepted — out of scope.

#### 💡 Suggestion: Confirm filing is click; Enter does not arm Archive

**Location:** `src/systems/station.js:1458–1467` vs Digit handlers `6199–6226`

**Issue:** Papers confirm is a click on `Confirm filing`. Esc cancels. Digit 1 on Market still arms seed when visible. Arrow/QWAS still trade commodities. Keyboard-only Archive is tab + click-equivalent activate on the focused button (native) plus Esc.

**Fix:** Do not bind Digit or Enter to Archive rows as this leftover. That would fight Market Digit 1 seed (`6200`) and Digit 0 shipyard.

**Status:** accepted — native button activate is enough; not a hole.

### Specified later UI (CONSUME)

**Later UI = none.** Do not add Archive chrome. If an owner re-opens after a true missing-desk census, PR1 (named only then) must:

- Keep Market pane, confirm papers, `textContent`, polite live region, reduced-motion numbers, hostile `No sale.`, empty-hold copy.
- Must not steal Digit 0/8/9, must not `innerHTML` names, must not autofocus trap the sim, must not raise overlay z, must not add hub chrome, must not add `DETAIL_STATIONS.unknowables`.

**Re-audit after markdown lock:** still no Blocker / Major. CONSUME stands.
