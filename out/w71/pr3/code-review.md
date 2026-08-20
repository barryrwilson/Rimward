## Code Review: `src/systems/station.js` mining replace + expire (WAVE 71 PR3)

### Summary

PR3 lands one-in-one-out for mining: complete and expire splice the card and push a new offered job for the same `originSystem`+`slot`. Unique four still use `completeJob` → `done`. Probe pins pass. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- Complete keeps PR2 pay (cargo, clamped `payQuoted`, +2 employer faction, dockmaster path) and does **not** set `state = 'done'`.
- `state = 'failed'` is set before pay; leftover `failed` rows splice with no second pay.
- Expire runs on the same 0.5 s `tickDeliveryJobs` cadence while undocked. Offered → posting withdrawn. Accepted → contract lapsed. No cargo/credits/rep/favor.
- Deadline is 600 s, cited as live `WRECK_TTL` (`world.js` line 811). Offered cards stamp post time + 600. Accept restarts `world.time + 600`.
- Replacement is a new object from `makeMiningJob`. Ids are monotonic so the spliced id is not reused.
- Reverse index walk avoids skipped jobs after splice. Jobs-pane `render()` runs only when the overlay is on Jobs.
- Digit accept still indexes `boardJobs` and mutates by identity.

### Findings

#### 🟡 Minor: `miningSlotOf` maps any non-`1` slot to `0` (applied)

**Location:** `src/systems/station.js:1669-1694`

**Issue:** A tampered `slot: 2` would have replaced into slot 0.

**Fix applied:** `miningSlotOf` returns `0`, `1`, or `null`. A null slot splices the bad row and does not push.

**Status:** resolved

#### 💡 Suggestion: `nextMiningId` walks the jobs array per allocation

**Location:** `src/systems/station.js:1597-1616`

**Issue:** Worst case is linear in the live jobs array (cap 220) plus `jobs.some` on collision. Replace adds one row per tick.

**Fix:** None required. A `Set` of ids is optional later.

**Status:** open (accepted)

### Test coverage

`out/w71/pr3/probe.mjs` boots `initStation`, docks, opens Digit 2:

- complete mining: old job gone (not `done`), replacement offered same origin+slot, new object, new id
- credits / cargo / +2 Freehold rep still move (no PR2 pay regress)
- double-tick after complete does not pay twice
- expire offered (undocked): no pay, no rep, no cargo change, replacement, `posting withdrawn`
- expire accepted (undocked): no pay, no rep, cargo kept, replacement, `contract lapsed`
- no `failed`/`done` mining left on the board
- unique four still present; ferry still goes `done` via `completeJob` and pays
- Digit accept still mutates by identity
- no `innerHTML`; deadline 600 cited as `WRECK_TTL`

### Contract drift

- Remaining-time copy on cards: not landed (PR4).
- WAVE71 boot-test pins: not landed (PR5).
- Unique haul/ferry/ace/patrol: not migrated (correct).
- `state.js` / `save.js` / `hud.js` / `world.js`: untouched.
