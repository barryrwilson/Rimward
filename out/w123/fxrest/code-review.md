# Code Review: remaining FX leftover after named FX slices design pack (Wave 123)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining FX leftover.** Named serial has **no PR1**. Cites match today’s muzzle / bolts / WAVE111 parent / scrape `spawnHitFx` / recoil / marks / shake / song / wreck. Hard freezes (Digit, `state.js`, persist, `innerHTML`, hub pip, hitscan, muzzle REAL reopen) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- Named slices are split by wave with file:line cites; wishlist FX-01 bullets are named stale, not treated as REAL.
- Muzzle leftover is explicitly kept **CONSUME**. Contract forbids reopen as REAL.
- Line cites use today’s files (`spawnMuzzle` **1008–1029**; WAVE111 **1050–1106**; scrape **1858–1860**; `HULL_MARK_POOL` `hull-marks.js` **7**; recoil `ship.js` **1237–1263**; IMPACT `physics.js` **11–12**; RANGE `hud.js` **781**; Digit `station.js` **188**).
- Rejected invented work is explicit: hub pip, Digit, persist key, hitscan beam, user shaders, second incoming-fire region, IMPACT retune, scrape steal, WAVE111 parent steal.
- Sibling law: do not steal `out/w123/phyrest/**` / `out/w123/astrest/**`.
- Serial plan names **no** implementation PR. Matches owner “do not invent remaining FX work if leftover is gone.”
- Contract-wins vs brief is explicit.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist FX-01 still lists muzzle / bolts / ripples / sparks / shake / sounds / recoil / marks

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1405–1414** vs live `combat.js` / `ship.js` / `song.js`

**Issue:** Initiative body still lists the full FX-01 stack as bullets. A later worker could treat the list as a REAL leftover and reopen muzzle CONSUME.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.19 / §0.21. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: Named WAVE111 FX `console.log` string absent from `boot-test.mjs`

**Location:** `scripts/boot-test.mjs` WAVE111 at **22872** is REP-03; live ripple parent is `combat.js` **1086** `host.add`

**Issue:** Brief asked to confirm WAVE111 hull-local ripple. The named boot log is sibling REP-03. Ripple parent is live without a WAVE111 FX log.

**Fix:** Do not add boot-test pins from this leftover. Inventory §5 / §10 records absence as **not** a player-facing hole. `out/w111/fx01/` probe exists.

**Status:** accepted — out of write-set; CONSUME stands.

#### 💡 Suggestion: Untextured hit `spawnFlash` remains skippable

**Location:** `combat.js` **990–1001** (no `map`)

**Issue:** Hit squares can still look cheap next to mapped muzzle dots. That is **hit-side** flash map, skippable, not remaining leftover.

**Fix:** None in this pack. Contract §0.11.

**Status:** accepted — skippable omit; not PR1.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / muzzle CONSUME / WAVE111 / scrape freezes repeat on purpose (merge law). No invented serial name.

### Test coverage

This pack does not add tests. Live WAVE54 / WAVE55 / WAVE59 pins already cover muzzle, bolts, lance, sparks, song, shake, recoil, marks. Optional later census is grep, not a new probe.

**Re-review after markdown lock (backtick cite repair):** still no Blocker/Major. CONSUME stands. Muzzle leftover stays CONSUME.
