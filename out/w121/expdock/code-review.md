# Code Review: EXP remaining Unknowables dock / Archive two-way design pack (Wave 121)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining Unknowables dock / Archive two-way leftover.** Named serial has **no PR1**. Cites match today’s `veil` / The Quiet / dedicated builder / `archiveDeskAllowed` / `archivePriceAtDesk` 400/900 / Market pane. Hard freezes (D3, Digit, `state.js`, persist, `innerHTML`, invented UU, generated SYSTEM, chart-label steal) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` (reviewer persona path not present under orchestrator/references; used that command reference). Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- Presence vs dock is split: hush `th_veil` is not The Quiet; dock is `veil`.
- Line cites use today’s files (`authored-systems.js` 234–255; `station.js` 188, 308–321, 567–578, 1210–1238, 1419–1525, 4784; `data-trade.js` 7–24, 187–201; `save.js` 77–101).
- EXP-02 two-way is checked as player-facing, not as `archiveFilePrice` helper completeness.
- D3 honor: dedicated module LIVE; `DETAIL_STATIONS` still has no `unknowables`.
- Sibling law: do not steal `out/w121/chartlabel/**` or rewrite `galaxychart.js`.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”
- Contract-wins vs brief is explicit.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist initiative line still says “Unknowables dock still waits”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` 1446 vs live `authored-systems.js` 234–243

**Issue:** Initiative status is stale relative to Wave 94 and live `veil`. A later worker could treat the initiative sentence as a REAL leftover.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.15. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: `archiveFilePrice` still Assembly-only

**Location:** `data-trade.js` 187–201 vs `station.js` `archivePriceAtDesk` 1226–1240

**Issue:** A later worker could “fix” Unknowables into `archiveFilePrice` and double-price or drift UU.

**Fix:** Contract §0.12 forbids treating that helper as a leftover hole. Desk path is load-bearing. Do not invent a mirror PR1.

**Status:** accepted — not player-facing; CONSUME stands.

#### 💡 Suggestion: WAVE94 boot pin is bundled with POWER/stock/seed

**Location:** `scripts/boot-test.mjs` 20708–20741

**Issue:** One object `w94` ANDs power, living stock, seed, and veil. A power fail would also print WAVE94 OPEN-OUTS FAIL. Not a dock hole.

**Fix:** Do not split boot-test in this leftover. `out/w94/unk/probe.mjs` already isolates dock pins. Cite only.

**Status:** accepted — out of write-set.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / D3 / persist / UU freezes repeat on purpose (merge law). No invented SYSTEM id.

### Test coverage

This pack does not add tests. Live Wave 94 probe already pins `unk.buy.own400`, `unk.sell.own400`, `unk.rival.900`, `unk.hostile`, `ui.unk.buyBtn`. Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
