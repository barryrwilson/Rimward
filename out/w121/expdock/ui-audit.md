# UI Audit: EXP remaining Unknowables dock / Archive two-way brief (Wave 121)

### Summary

No product UI ships this wave. This audit treats the pack as a **UI-spec freeze**: live The Quiet + Market Archive already meet Wave 94 / EXP-02 two-way. Digit theft is **not** proposed (Blocker if a later serial adds an Archive Digit). Hub theft is **not** proposed. Specified later UI is the **existing** Archive desk — CONSUME means **do not add chrome**.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. No Vite. No Chrome.

### What's done well

- Reuses live Market pane: `renderArchiveDesk` only when `ui.level === 2 && ui.service === 'market'` (`station.js` 1419–1420, 4784). Keyboard Digit 1 still opens Market; no new service row.
- Real `<button>`s via `btn()` (`station.js` 4471–4473). Confirm / cancel papers (`1460–1467`). Esc cancel already wired (`6184`).
- Copy is authored `textContent` (`h()` 4464–4469): “File a legal crystal”, “The archive does not buy cubes.”, rival 400/900 lines (`1474–1479`, `1434–1436`).
- Hostile state is explicit **No sale.** with no buy buttons (`1438–1440`). Empty hold: “No crystal or cube in the hold.” (`1482–1484`).
- Reduced motion short copy (`1424–1436`, `1474`, `1514`) keeps numbers; does not hide the desk.
- `aria-live="polite"` on `ui.notice` (`6066–6068`).
- Confirm meta uses `dataCommodityLabel` + authored UU, not raw player strings interpolated into HTML.
- Digit 0 stays shipyard; 8/9 stay launch/epics (`DOCK_KEY_SERVICES` 188). Archive is not a Digit.
- Dedicated sculpt is presence in space (lenses / void core), not a new overlay card. Models Browser already lists `station:unknowables`.
- Empty 80 px hub stays empty. Aim-glass gauges stay off.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Archive lives on Market, not a named landmark in the dock root list

**Location:** `station.js` 188 vs 4784

**Issue:** Dock root buttons say Market, not Archive. A new player may not know Digit 1 holds the filing desk.

**Fix:** Do not invent a Digit or extra dock button as leftover PR1. Wave 74/94 already chose Market pane. CONSUME forbids new chrome. Owner may later ask a Market subtitle; that is **not** this freeze.

**Status:** accepted — not a missing two-way hole; CONSUME stands.

#### 🟡 Minor: Station overlays do not use `--rw-text-scale`

**Location:** settings apply `--rw-text-scale` on `#hud` only; dock uses `screens.css`

**Issue:** XL HUD text does not scale The Quiet Archive. Wishlist HUD-03 is HUD families, not this leftover.

**Fix:** Do not invent an EXP-04 leftover PR for dock type size. Not Unknowables two-way.

**Status:** accepted — sibling/HUD; CONSUME stands.

#### 💡 Suggestion: Confirm filing is mouse/click; Digit does not arm Archive rows

**Location:** `station.js` 1472–1523 vs Digit handlers 6228+

**Issue:** Archive buy/sell is click-on-button, then Confirm. Market commodities have ±1/±5. Keyboard-only Archive is tab-to-button (native) plus Esc cancel.

**Fix:** Do not add Digit bindings on Archive as this leftover. That would fight Market Digit 1 seed (`6200`) and Digit 0 shipyard. Out of scope.

**Status:** accepted — not EXP-02 two-way death.

### Specified later UI (CONSUME)

**Later UI = none.** If an owner re-opens after a true missing-desk census, PR1 (named only then) must:

- Keep Market pane, confirm papers, `textContent`, polite live region, reduced-motion numbers, hostile `No sale.`
- Must not steal Digit 0/8/9, must not `innerHTML` names, must not autofocus trap the sim, must not raise overlay z, must not add hub chrome.

**Re-audit after markdown lock:** still no Blocker/Major. CONSUME stands.
