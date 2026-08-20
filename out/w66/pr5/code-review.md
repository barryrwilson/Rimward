# Code Review: Wave 66 PR5 desk/boot pins + wave closeout

**Scope:** `scripts/boot-test.mjs` WAVE66 DESK, `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `docs/Pod02TraffickingDesign.md` status. No product `src/` fix.
**Pass:** final (no Blocker/Major open).

### Summary
WAVE66 DESK runs after WAVE66 SAVE PINS and before the harness PASS/FAIL. All 13 desk contracts are all-true on `npm run test:boot`. Save pins stay all-true. Closeout docs match Wave 65 style. No src regression.

### What's done well
- Reuses WAVE64 overlay helpers: `walkDom`, `stationOverlay`, `dispatchKey`, `travelTo('gc_auction')`, `dockAtCurrentStation`, button `click()`.
- Forces a real `dock()` when `flags.docked` is a leftover from WAVE64 remount (`ui.open` false). Digit 7 then opens People.
- Mixed lots: two Offer rows, Confirm one (320 UU), other remains at 240 UU, oversize 99 stays.
- Return at Gilded (click, credits unchanged, +8 rep) and Freehold (Return, no Offer).
- Source pins: `ctx.js` `'survivorSold'`, `tryTrade` refuse, `DOCK_KEY_SERVICES.length === 10`.

### Findings

#### 💡 Suggestion: `goPeople` redocks every time
**Location:** `scripts/boot-test.mjs` `goPeople`
**Issue:** Each pin undocks and docks again. That is slower than Escape + Digit 7 on an already-open overlay.
**Fix:** None required. The leftover `flags.docked` / `ui.open` split made a cheap Escape loop lie (menu DOM, keys dead).
**Status:** open
**Justification:** Live Digit 7 must hit `selectService('people')` with `ui.open === true`.

### Test coverage
`npm run test:boot` → `wave66 desk:` all-true; `wave66 save pins:` all-true.

| Pin | Field |
|---|---|
| 1 empty hold | `emptyNoOffer`, `emptyNoConfirm` |
| 2 mixed lots | `mixedTwoOffers`, `mixedConfirmOne`, `mixedOtherRemains`, `mixedOtherUu` |
| 3 Unknowables | `unkNoOffer`, `unkRefuse` |
| 4 `__proto__` | `protoNoOffer`, `protoNoThrow` |
| 5 oversize | `oversizeNoSale`, `oversizeRowKept` |
| 6 double Confirm | `doubleNoSecondPay` |
| 7 Freehold no Offer | `fhNoOffer`, `fhReturn` |
| 8 Return | `returnWorks` |
| 9 market / A/S / priceOf | `marketNoSurvivor`, `asNoSellPeople`, `priceOfZero` |
| 10 digits / 10 keys | `key.*`, `digit7People`, `digit0Shipyard` |
| 11 Digit pending | `digitPendingNoDebit` |
| 12 milestone | `milestoneOnce`, `noWorldPeople` |
| 13 ctx comment | `src.ctxSurvivorSold` |

Known 8 FAILs remain (WAVE4 fence, WAVE26 ferry/haul, WAVE30 payTribute, WAVE35 haul gate). Not this object.

### Verdict
Approve. Wave 66 POD-02 first slice is closed. No src fix in PR5.
