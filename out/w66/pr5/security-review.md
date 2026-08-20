# Security Review: Wave 66 PR5 boot desk pins + closeout

**Scope:** `scripts/boot-test.mjs` (WAVE66 DESK), `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `docs/Pod02TraffickingDesign.md` status line. No product `src/` edit this PR.
**Mode:** Deep audit of the live desk path the pins exercise (Offer / Confirm / digits / market A/S / reserved faction).
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
PR5 is a harness and docs closeout. It does not add a debit path. Live pins at `gc_auction` check fail-closed Offer, one-lot Confirm, Unknowables refuse, reserved `__proto__`, oversize skip, double Confirm, Digit-while-pending, market `priceOf('survivor') === 0`, and Return. WAVE66 SAVE PINS stay all-true.

### Findings

#### 🟢 LOW: harness forces `ctx.flags.docked = false` before a real dock
**Location:** `scripts/boot-test.mjs` `clearDockFlags` / `goPeople`
**Issue:** WAVE64 remount can leave `flags.docked` true while station `ui.open` is false. Escape then no-ops. Digit 7 does not open People.
**Impact:** Test-only. The product dock path is unchanged. The pin now calls `dockAtCurrentStation` so `dock()` sets `ui.open`.
**Status:** open
**Justification:** Needed for a live Digit-7 pin after WAVE64. Not a product auth hole.

### Resolved this pass
Pins that close PR1–PR4 security contracts on the live overlay:

1. Reserved `__proto__` cargo: no Offer, no throw (`protoNoOffer`, `protoNoThrow`).
2. Unknowables-only: refuse copy, no Offer (`unkRefuse`, `unkNoOffer`).
3. Confirm is click-only. Digits 1/7/0/3 while pending do not debit (`digitPendingNoDebit`).
4. Second Confirm / stale click does not pay twice (`doubleNoSecondPay`).
5. Market has no survivor row. A/S does not sell people. `priceOf` stays 0 with stuffed `world.prices.survivor`.
6. No `world.peopleTrafficked` field. Milestone id appears once.

### Passed checks
- [x] No secrets in boot-test or closeout docs
- [x] No `innerHTML` / `eval` / `Function` in the new WAVE66 DESK block
- [x] Overlay clicks use stub `click()` on `textContent` buttons (WAVE64 buy pattern)
- [x] `__proto__` cargo does not crash the desk
- [x] Digit keys at People level 2 do not debit
- [x] `priceOf('survivor')` pin ignores stuffed `world.prices.survivor`
- [x] No new `WORLD_FIELDS`
- [x] WAVE66 SAVE PINS block is unchanged
- [x] No product `src/` change this PR

### Recommendations
1. Keep live desk pins on `gc_auction` (faction `gilded`). Do not warp `currentSystem` without `systemLoaded` if a later wave needs the same dock.
