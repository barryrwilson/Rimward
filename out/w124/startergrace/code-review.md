# Code Review: AI-05 starter grace design pack (Wave 124)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **REAL** — **PR1 starter-grace**. Cites match today’s hop 60 s, Illyx-on-bubble, death live-NPC keep, and AI-04 who. Hard freezes (Digit, `state.js`, persist, `innerHTML`, hail cards, Dresk delete, PHY/mix retune) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §0, contract header, brief Status row all say REAL / **PR1 starter-grace** / not CONSUME.
- AI-04 who vs AI-05 when is split with file:line cites.
- Playtest ~1 minute maps to live `JUMP.graceSeconds` **60**, not a missing timer.
- Geography cites (field ≈ 1041 u from pad; ≈ 796 u from Illyx gate vs bubble 800) explain why law zone 300 u is not the inbox bubble.
- Death hole cites `healLiveRecords` “keeps NPCs running” (`save.js` **1139–1180**) instead of inventing a time reset.
- Origin difficulty is explicit: Greenhand 180 / danger origins 0 extra. Dresk bypasses extra.
- Death tool pick is frozen (`calmUntil` + re-roll), not parked.
- Write-set is `npc.js` first; `world.js` default none; forbidden list includes hail/save/controls/station.
- Sibling law: do not steal berthfreeze / menuinput / hail cards / encyclopedia.
- Contract-wins vs brief is explicit.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Helper catch “fail closed toward live AI-04” can skip hop clamp if the helper owns hop too

**Location:** brief §3 helper bullet; contract §0.13 / formulas

**Issue:** If later impl wraps hop + extra + death in one try/catch that returns `false` on throw, a helper bug would **skip hop grace** as well as extra. That is fail-open for the 60 s hop.

**Fix:** Contract already says hop uses live `?? 0` then clamp at the call site. Keep hop clamp **outside** the extra helper, or catch → treat extra off but still apply hop clamp. Brief §3 now states hop clamp at the call site. No pack invert.

**Status:** accepted — call-site hop clamp specified

#### 🟡 Minor: Docked shopping burns `world.time`

**Location:** contract §4; `main.js` **149–150** (time advances when not paused; station does not pause)

**Issue:** A Greenhand who sits in the market for 180 s spends the extra window at the pad (already inside law zone). They then undock into a live rim. That is a tradeoff, not a hole.

**Fix:** Do not switch to “time outside law zone” in PR1 (more state, more tamper). Owner may override after playtest.

**Status:** accepted — documented tradeoff

#### 💡 Suggestion: Optional PR2 bubble could be misread as enlarging PHY keep-out

**Location:** contract §0.1 home-berth bubble; `npc.js` **97** `LAW_ZONE_RADIUS`

**Issue:** A later worker could “help” by editing PHY station cylinder.

**Fix:** PR2 is acquire-only. PHY-02 rewrite forbidden. PR2 not required.

**Status:** accepted — named optional; PHY steal locked

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit / persist / hail / Dresk freezes repeat on purpose (merge law). Serial name is **PR1 starter-grace**, not none.

### Test coverage

This pack does not add tests. Later PR1 should pin: Greenhand t=10 no unsolicited acquire; t=181 legal; Marked extra off; Dresk extra bypass; death calm 90; scratch still hunts; hop 60 unchanged; no new WORLD_FIELDS. Optional. Do not add boot-test pins from this leftover wave.

**Re-review after markdown lock:** still no Blocker/Major. REAL + PR1 stand.
