# Code Review: remaining NAV leftover after NAV-07 design pack (Wave 122)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining NAV leftover.** Named serial has **no PR1**. Cites match today’s plot / guidance / AP / hover / handoff / button close / labels. Hard freezes (Digit, `state.js`, persist, `innerHTML`, teleport, persist-resume AP, overlay steal) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- NAV-01..07 are split by wave with file:line cites; wishlist “impl later” is named stale, not treated as REAL.
- Direct `tryEngage` vs Autopilot **button** close is kept as NAV-05/NAV-06 split, not a hole.
- Line cites use today’s files (`galaxychart.js` dest **202**, button **704–706**; `autopilot.js` hub skip **335–337**; `gate.js` **672–678**; `nav.js` **48–55**; `save.js` **100–101**).
- Rejected invented work is explicit: teleport, persist-resume AP, hub PPI, dest-select hover leftover.
- Sibling law: do not steal `out/w122/tgtrest/**` / `out/w122/represt/**`.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”
- Contract-wins vs brief is explicit.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist NAV-03 still says “Remaining zone handoff leftover … impl later”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1165–1169** vs live `autopilot.js` **21–38**, **335–337**; `gate.js` **501–505**; `boot-test.mjs` **23439–23730**

**Issue:** Initiative body is stale relative to Wave 117. A later worker could treat the sentence as a REAL leftover.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.11 / §0.15. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: Named WAVE96 / WAVE120 / WAVE121 `console.log` strings absent from `boot-test.mjs`

**Location:** `scripts/boot-test.mjs` grep 0 vs live hover / button close / dest select

**Issue:** Brief asked to read WAVE96 / WAVE120 / WAVE121 pins. Hover is live without a WAVE96 log. Chart-close is folded into WAVE117 `chartEngageStay` (**23659–23664**). Chart-label has `out/w121/chartlabel/` probe, no WAVE121 log.

**Fix:** Do not add boot-test pins from this leftover. Contract §0.13. Inventory §11 records absence as **not** a player-facing hole.

**Status:** accepted — out of write-set; CONSUME stands.

#### 💡 Suggestion: Dest `<select>` does not call `applyHoverId`

**Location:** `galaxychart.js` **742–746** vs pointer hover **754–758**

**Issue:** NAV-04 acceptance mentioned keyboard exposing hover if non-mouse nav exists. Dest list plots, it does not paint the hover strip.

**Fix:** Do not invent dest-hover leftover PR1. Contract §0.12. Hover strip remains pointer inspect; dest is the keyboard **plot** path (NAV-07).

**Status:** accepted — not a missing NAV-01..07 hole; CONSUME stands.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / teleport / overlay freezes repeat on purpose (merge law). No invented serial name.

### Test coverage

This pack does not add tests. Live WAVE85 / WAVE117 pins already cover persist, chart, guidance, AP, handoff, and button close. Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
