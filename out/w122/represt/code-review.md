# Code Review: remaining REP leftover design pack (Wave 122)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining REP leftover.** Named serial has **no PR1**. Cites match today’s Digit 9 / leave / covering / jump refuse / kill −5 / restitution 1200 / spy-war −2 / patrol spawn `def.faction`. Hard freezes (Digit, `state.js`, persist, `innerHTML`, wanted, patrol-employer, hail leave) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` (reviewer persona path not present under orchestrator/references; used that command reference). Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- Police spawn vs patrol **job** is split: NPC patrols fly the system flag; Compact +5 is unique-four honesty, not the example hole.
- Line cites use today’s files (`station.js` 188, 1151–1203, 3852, 5887–5945; `world.js` 374–385; `police-leave.js` 5–8, 117; `police-cover.js` 6–9; `jump.js` 7–10, 104–111; `kill-standing.js` 6; `restitution.js` 5, 62; `save.js` 77–101, 919–940).
- REP-02 local police is checked as player-facing behavior, not as “patrol job employer helper completeness.”
- Sibling law: do not steal `out/w122/navrest/**` or `out/w122/tgtrest/**`.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”
- Contract-wins vs brief is explicit.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: `RepStandingDesign.md` still names later serial `patrol-employer-faction`

**Location:** `docs/RepStandingDesign.md` 123, 216, 244 vs live `world.js` 379 and `station.js` 3852

**Issue:** Parent freeze still says “Patrol remains Freehold until a named serial.” A later worker could treat that sentence as a REAL leftover and retarget unique-four.

**Fix:** This pack already says code wins and does **not** edit `RepStandingDesign.md` (owner freeze). Contract §0.9. No pack fix required.

**Status:** accepted — CONSUME named; parent-doc edit is other worker.

#### 🟡 Minor: WAVE95 labeled boot block is absent

**Location:** `scripts/boot-test.mjs` grep WAVE95 = 0 vs live `police-leave.js`

**Issue:** Owner task listed WAVE95 pins. Leave is live; WAVE104 still asserts `POLICE_LEAVE_LINE === 'Leave this space.'`. A later worker could call WAVE95 “missing” and re-ship leave.

**Fix:** Inventory §7 records the missing label and the live helper + WAVE104 pin. Do not add a boot block in this leftover. Out of write-set.

**Status:** accepted — not a player-facing hole; CONSUME stands.

#### 🟡 Minor: WAVE107 labeled block is BIO-06, not Digit 9 copy

**Location:** `boot-test.mjs` 22272 vs `station.js` `standingLiveNotes` 1181–1191

**Issue:** Owner task named Wave 107 Digit 9 copy. Consequence copy is live on Digit 9; WAVE111 still pins `standingLiveNotes()`. WAVE107 print is BIO-06.

**Fix:** Inventory §13 names both. Do not invent a WAVE107 REP pin here.

**Status:** accepted — copy is live; pin label is historical.

#### 💡 Suggestion: `standingOf` still raw-index

**Location:** `npc.js` 1138–1142 vs `standingRead` `data-trade.js` 73–81

**Issue:** Hunt does not drop reserved ids the way Digit 9 / leave / covering do.

**Fix:** Do not schedule a leftover PR1. Census §9.2 / §12. Not police-Freehold.

**Status:** accepted — not remaining REP leftover.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / wanted / patrol-job freezes repeat on purpose (merge law). No invented wanted field.

### Test coverage

This pack does not add tests. Live WAVE74/82/83/104/111 already pin sanitize, kill −5, restitution 1200, covering/jump/leave strings, climb copy, Compact-only honesty. Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
