## Security Review: Outfitting Digit 8/9 papers (Wave 68 PR3a)

**Scope:** `src/systems/station.js` (outfit helpers, `renderOutfitting` rows, level-2 Digit 8/9, Esc cancel), `out/w68/pr3-desk/probe.mjs`.
**Mode:** Deep audit (desk debit, save/console tamper, XSS, Digit-8 Launch steal, blob price, class seat).
**Pass:** 2 (post-fix).
**Personas:** security-auditor + orchestrator `security-review.md`.

### Risk Level: Low

### Summary
New launcher and turret SKUs use Confirm papers. Digit 8/9 bind only after the level-1 return, inside `ui.service === 'outfitting'`, and `armOutfitPapers` / `confirmOutfitPapers` also require `ui.level === 2 && ui.service === 'outfitting'`. Price is authored catalog. Live `canSeat` and live credits are re-read on confirm. Names use `h()` `textContent`. No HIGH or CRITICAL on this pass.

### Findings

#### 🟢 LOW: Restock at ammo 7 still charges full `restockCost`
**Location:** `src/systems/station.js` `applyOutfitPending` restock path
**Issue:** Contract says add `restockUnit` then heal. 7 + 2 heals to 8. The purse still pays 400 UU.
**Impact:** Player overpays one dart. No free ammo. No negative purse.
**Status:** open
**Justification:** Same heal law as persist. Changing price by remainder would invent a desk ledger.

#### 🟢 LOW: Console can set `ui.level` / `ui.service` and call `confirmOutfitPapers`
**Location:** `src/systems/station.js` `confirmOutfitPapers`
**Issue:** The gate is the ui flags, not `ctx.flags.docked`. A console caller who forges those flags can debit.
**Impact:** Same class as Digit 1–7 outfitter one-shots (already callable if UI is open).
**Status:** open
**Justification:** Local single-player desk. Forged ui is already a god mode.

### Resolved this pass
- Inherited `outfitPending` proto fields (`Object.create({ slot, kind, id })`) no longer debit. Own-key read only.
- Level-1 Digit 8 cannot arm or confirm (Launch stays on `DOCK_KEY_SERVICES[7]`).

### Passed Checks
- [x] No secrets in the station / probe diff
- [x] No `innerHTML` / `eval` / function hydrate
- [x] Catalog `name` / `line` reach the DOM only via `h()` `textContent`
- [x] Digit 8 on a fake level-1 table still indexes `DOCK_KEY_SERVICES` (`launch`)
- [x] One `keydown` listener; 8/9 sit in the existing outfitting `else if`
- [x] Pending stores `slot` / `kind` / `id` only; `cost: 0` on pending is ignored
- [x] Confirm re-reads authored `LAUNCHER_IDS` / `TURRET_IDS` integer cost
- [x] Confirm re-reads live `canSeat` and live hangar row
- [x] Light + dart papers: no debit, launcher stays `''`
- [x] `__proto__` / `constructor` ids fail closed
- [x] `writeMountedGear` runs before debit; failed seat does not debit
- [x] Integer UU; `nextCredits >= 0`; exact 6500 → 0
- [x] `outfitBuyInFlight` one debit in flight
- [x] `hullKind` not written; living heavy may buy dart / auto
- [x] No eleventh dock service; Yard pane still has no launcher SKU
- [x] No new `localStorage` / `sessionStorage` weapon key

### Recommendations
1. Later browser verifier: Digit 6 Outfitting, then Digit 8/9, Esc cancel, Confirm papers.
2. Keep Digit 1–7 as one-shots (contract).
