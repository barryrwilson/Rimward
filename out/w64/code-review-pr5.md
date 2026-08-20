## Code Review: Wave 64 PR5 flat equipment on hangar rows

**Scope:** outfitter writers, hangar `writeMountedGear`, WAVE64 equipment boot pins.
**Pass:** first pass after WAVE64 equipment pins.

### Summary
PR5 matches ShpDesign §7 and shared-contract §5. Outfitter writes the mounted row, then mirrors to world. Swap isolation holds. WAVE64 persist + remount + desk + buy + equipment pins are true. WAVE62 stays true. No blocker or major.

### What's done well
- Source of truth is the mounted hangar row. World keys remain write-through mirrors on `WORLD_FIELDS`.
- `writeMountedGear` allowlists four fields and heals each value.
- Park still copies live mirrors onto the outgoing row. Load copies the incoming row onto world.
- First hangar create copies world gear onto the mounted starter only. Other hulls stay stock zeros.
- Sanitize still heals every restore. There is no migrate-once skip flag.
- Living hulls and Unknowables `'living'` rows accept these parts. Cannon / disruptor are untouched.
- Digit 1–7 stay hold / Mk I / concealed / Mk II / mining heads. Outfitter UI still reads the world mirror.
- Nested `loadout` is dropped on sanitize. Write ignores missiles.
- Boot pins cover migrate, heal, write-then-mirror, swap isolation, live Digit buys, and yard stock rows.

### Findings

#### 🟡 Minor: live `ctx.cargo` is not trimmed on a capacity shrink
**Location:** `src/game/hangar.js:363-367`
**Issue:** `writeMountedGear` trims `row.cargo` when capacity drops. The live hold is left as-is.
**Fix:** Clip `ctx.cargo` the same way if a later writer can shrink the hold.
**Status:** accept — cargo rack only expands.

#### 💡 Suggestion: `save.js` comment still names world as the only mining writer
**Location:** `src/game/save.js:87-89`
**Issue:** Comment says `ctx.world.miningLaser` is the only writer target. Outfitter now writes the row first.
**Fix:** Update the comment on a later save.js touch.
**Status:** keep — PR5 must not edit `save.js` unless migrate needs a hook. PR1 already migrates.

### Resolved this pass
None. No HIGH/CRITICAL.

### Verdict
Approve for PR5 flat equipment. WAVE62 still true. Known WAVE4/26/35 FAILs unchanged. WAVE64 persist + remount + desk + buy + equipment pins all true.

### Re-review
No blocker or major. Station header comment now lists hangar gear. Minor hold-trim note stays documented.
