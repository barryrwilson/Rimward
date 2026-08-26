# Code Review: remaining PHY leftover after PHY-05 design pack (Wave 123)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **CONSUME** — **no remaining PHY leftover.** Named serial has **no PR1**. Cites match today’s bounce / keep-out / two-sample / sun / pad-home. Hard freezes (Digit, `state.js`, persist, `innerHTML`, navmesh, 80 u leftover, hub pip) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0 table, contract header, brief Status row all say CONSUME / serial **none**.
- PHY-01..05 are split with file:line cites; PHY lives in `src/game/physics.js` (not assumed `src/systems/physics.js`).
- Example REAL holes (pad-center after save; sun lethal missing) are tested against live author/heal/`sunKill` and closed.
- PHY-04 PR3 80 u is named skippable, not frozen as PR1.
- Line cites use today’s files (`npc.js` mid **657**, `writeFrameHold` **781–817**, `world.js` patrol **381**, `healPadHome` **709–735**, `combat.js` **1873–1898**, `ship.js` **905–937**).
- Rejected invented work is explicit: navmesh, hub pip, persist keys, impact retune.
- Sibling law: do not steal `out/w123/astrest/**` / `out/w123/fxrest/**`. Not NAV / TGT / FX / AST / AP / MATCH.
- Serial plan names **no** implementation PR. Matches owner “do not invent work.”
- Contract-wins vs brief is explicit. Wave 123 deputize: do not invent remaining PHY work if leftover is gone.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Wishlist PHY-02 / AI-01 still say “not full path planning”

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **1081**, **1296–1299** vs live `npc.js` **643–703**

**Issue:** Initiative body still names lookahead, not a planner. A later worker could treat that honesty line as REAL leftover and ship a navmesh.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.10 / §0.16. No pack fix required.

**Status:** accepted — CONSUME named; wishlist edit is other worker.

#### 🟡 Minor: Named WAVE109 PHY-04 `console.log` absent from `boot-test.mjs`

**Location:** `scripts/boot-test.mjs` **22478** (WAVE109 is MSN-03) vs live `addMidChordHit` `npc.js` **605**

**Issue:** Brief asked to census live code. Two-sample is live without a WAVE109 PHY-04 log. Kernel-pins still check `phy04.midSample` (`out/phy-verify/kernel-pins.mjs` **181–184**). WAVE110 pad-home is pinned.

**Fix:** Do not add boot-test pins from this leftover. Contract §0.14. Inventory §5 records absence as **not** a player-facing hole.

**Status:** accepted — out of write-set; CONSUME stands.

#### 💡 Suggestion: Player AP still calls `applyAvoidBias` after `planApPath`

**Location:** `autopilot.js` **268**, **291**

**Issue:** Avoid helper is shared. A leftover worker could steal AP detour into NPC.

**Fix:** Contract §0.13: cite only. NPC must not call `planApPath`. Not a remaining PHY hole.

**Status:** accepted — sibling AP; CONSUME stands.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / navmesh / 80 u freezes repeat on purpose (merge law). No invented serial name. RANGE cite uses live `hud.js` **781** (Phy04 brief’s 709–712 is stale; this pack does not edit Phy04).

### Test coverage

This pack does not add tests. Live WAVE53 / WAVE58 / WAVE110 pins plus kernel-pins already cover bounce, torus, sunZone, holds, pad-home, mid-sample. Optional later census is grep, not a new probe.

**Re-review after markdown lock:** still no Blocker/Major. CONSUME stands.
