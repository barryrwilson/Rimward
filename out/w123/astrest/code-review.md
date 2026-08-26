# Code Review: remaining AST leftover after AST-01/02 design pack (Wave 123)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining AST leftover.** Named serial has **no PR1**. Cites match today’s Kepler-lite belts, work sector, `fieldOre`, arrival line, group-3 cue, rock MATCH rest-frame, MATCH lamp. Hard freezes (Digit, `state.js`, persist, `innerHTML`, `id === index`, second belt) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- Named slices are split by wave with file:line cites; wishlist “single local cluster” is named stale, not treated as REAL.
- Example REAL holes from the owner (clump with no orbit; depletion identity lost) are checked and **absent**.
- Line cites use today’s files (`asteroids.js` pose **97–108** / update **2015–2027** / id **1898–1906**; `save.js` **99**; `jump.js` **48–58**; `hud.js` **2200–2206**, **1896**; `ship.js` **851–897**).
- Rejected invented work is explicit: second belt, Oort, chart rocks, UUID, Digit, persist key, MATCH rewrite.
- Sibling law: do not steal `out/w123/phyrest/**` / `out/w123/fxrest/**`.
- Serial plan names **no** implementation PR. Matches owner “do not invent remaining AST work if leftover is gone.”
- Contract-wins vs brief is explicit. Wave 123 deputize is in contract §0.1.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist Initiative AST still says “single local cluster”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1325–1327** vs live `asteroids.js` **2015–2027**; WAVE69 `notClump` `boot-test.mjs` **14284**

**Issue:** Player-problem prose is stale relative to Wave 69. A later worker could treat the sentence as a REAL leftover.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.15. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: Authored six do not set `field.kind`

**Location:** `asteroids.js` **88–95** vs `authored-systems.js` grep 0 on `field.kind`

**Issue:** AstOrbitsDesign allowed optional authored `field.kind`. Live uses band default only.

**Fix:** Do not freeze authored-kind PR1. Band default already yields belt/sparse/cloud. Owner omit / optional data. Contract §0.1.

**Status:** accepted — not a missing AST-01 hole; CONSUME stands.

#### 💡 Suggestion: MATCH velocity is finite-difference, not `writeOrbitVel`

**Location:** `ship.js` **708–723** vs `asteroids.js` **111–125** (`writeOrbitVel` used for pods **2136**)

**Issue:** Rock MATCH samples lock xyz. Pods inherit analytic orbit vel. Two sources.

**Fix:** Do not invent leftover PR1 to unify. Wave 70 already shipped rest-frame hold. Cite only.

**Status:** accepted — not a remaining AST hole; CONSUME stands.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / `id === index` / second-belt freezes repeat on purpose (merge law). No invented serial name.

### Test coverage

This pack does not add tests. Live WAVE69 / WAVE70 / WAVE71 pins already cover belt occupancy, `fieldOre`, mine cue, rock MATCH, MATCH lamp. Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
