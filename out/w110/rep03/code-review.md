# Code Review: REP-03 remaining remedial-missions brief (Wave 110)

Design-only. Inventory cites live restitution (`restitution.js` 5, 45–66), Digit 9 desk (`station.js` 5820–5842), `RANK_LADDER` (`state.js` 714–721), renewable +2 writers (`station.js` 3902 and siblings), chain Known gate (`jobs-chains.js` 84–86), police leave (`police-leave.js` 5, 117), covering (`police-cover.js` 9), jump refuse (`jump.js` 10, 104–111), `WORLD_FIELDS` without wanted (`save.js` 76–101), HUD 80 px (`hud.css` 184–193; `hud.js` 709–712). MERGE LAW deputizes Digit 9 copy without `state.js` write, without new `kind`, without Digit steal. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Design-doc checklist folded in. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is **Digit 9 framing** of live +2 dock-flag job writers after restitution-to-0, not a new career; fail closed is live Digit 9; smallest additive reuses `MINING_REP` writers; PR plan is named-only; Digit/hub/`state.js`/no-new-key/no-new-kind freezes sit in MERGE LAW. Inventory line numbers match Wave 110 live `src/`.

### What's done well

- Code-wins inventory: renewable families already +2 with **no standing gate**; chain gate is the exception (Known).
- Correctly separates **writer exists** from **loop copy missing** — a new `kind` is not required.
- Restitution 1200 / leave / dock-open / POD-01 / covering / jump cited as **consume**, not reopen.
- Patrol Freehold-only called out so copy cannot lie.
- Fail-closed table matches live `renderEpics` (restitution block independent of extra notes).
- First serial named **PR1 Digit 9 copy**; Digit 0/2/8/9 and `state.js` forbidden on that PR.
- REP-05 sibling fenced (`docs/Rep05ConsequencesDesign.md` not edited).

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | Digit 9 copy | §0 copy / framing | Match |
| Fail closed | live Digit 9; never blank | §0.16 / §2 | Match |
| Smallest additive | notes naming +2 families | §0.1 | Match |
| New persist key | no | §0.6 | Match |
| New job `kind` | forbidden | §0.10 | Match |
| Digit 0/2/8/9 | freeze | §0.3 | Match |
| Hub | no wanted pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| First serial | PR1 copy | §3 PR1; no Digit; no state.js | Match |
| Copy honesty | jobs not locked until pay | §0.19 | Match |
| Climb math | 5 × 2 = Known 10 | §0.1 | Match |

### Inventory cite check (live `src/` vs pack)

| Claim | Pack cite | Live | Result |
|---|---|---|---|
| `RESTITUTION_UU` 1200 | `restitution.js` 5 | 5 | Match |
| Set key to 0 | `restitution.js` 62 | 62 | Match |
| Digit 9 restitution UI | `station.js` 5820–5842 | 5820–5842 | Match |
| `RANK_LADDER` | `state.js` 714–721 | 714–721 | Match |
| `standingRead` | `data-trade.js` 73–80 | 73–80 | Match |
| `MINING_REP` 2 | `station.js` 232 | 232 | Match |
| Mining +2 write | `station.js` 3902 | 3900–3903 | Match |
| Chain gate | `jobs-chains.js` 84–86 | 84–86 | Match |
| Unique four | `save.js` 152–157 | 152–157 | Match |
| `DOCK_KEY_SERVICES` | `station.js` 188 | 188 | Match |
| Digit 0 handler | `station.js` 6075–6077 | 6075–6077 | Match |
| Leave line / band | `police-leave.js` 5, 117 | 5, 117 | Match |
| Covering min 10 | `police-cover.js` 9 | 9 | Match |
| Jump `< −25` | `jump.js` 10, 104–111 | 9–10, 104–111 | Match |
| Kill −5 | `kill-standing.js` 6 | 6 | Match |
| `WORLD_FIELDS` | `save.js` 76–101 | 76–101 | Match |
| Hub 80 px | `hud.css` 184–193 | 184–193 | Match |
| RANGE | `hud.js` 709–712 | 709–712 | Match |
| Dock no standing | `station.js` 6222–6233 | 6222–6233 | Match |
| `h()` textContent | `station.js` 4387–4392 | 4387–4392 | Match |
| Graft cap | `hangar.js` 152–167 | 152–167 | Match |
| `RESCUE` | `state.js` 331–336 | 331–336 | Match |

No stale Wave 103 Digit-9 line (that pack cited ~6023). Live labels are `station.js` 5938.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Hunt/trade/passenger/explore use `bag[faction] +=` not `writeFactionStanding`

**Location:** `station.js` 3617–3620, 3900–3903, 3950–3953, 3998–4001, 4063–4066 vs `writeFactionStanding` 1110–1121.

**Issue:** Spy/war/chain create the bag. Mining-style paths assume `world.reputation` exists. After restitution the bag exists. A later “unify writers” PR is **not** this leftover and could smash payouts.

**Fix:** None this leftover. Reuse live deltas. Do not “fix” bag +=.

**Status:** documented; contract §0.17 consume.

#### 🟡 Minor (spec freeze): Climb notes must not sit in the `< 0` RESTITUTION block

**Location:** `station.js` 5821; UI audit; contract §0.1 Shape / §0.19.

**Issue:** After pay, RESTITUTION hides. Notes nested there would vanish exactly when the player needs the “then.”

**Fix:** HOW STANDING MOVES (always on). Contract now normative. Not a remaining Major.

**Status:** frozen this pass.

#### 🟡 Minor: Digit 9 already lists mining +2 without saying “after 0”

**Location:** `standingMoveNotes` `station.js` 1155; `standingLiveNotes` 1189.

**Issue:** Players who read HOW STANDING MOVES already see mining +2. The leftover is the **reset-then-climb** sentence, not a new mechanic. A duplicate generic +2 line would noise the panel.

**Fix:** PR1 add the after-restitution climb sentence; do not duplicate the generic mining line unless replacing it carefully. Fail closed keeps both live arrays.

**Status:** frozen in deputize “one or two lines.”

#### 💡 Suggestion: PR2 grep `kind: 'remedial'` and `WORLD_FIELDS`

**Location:** contract §3 PR2.

**Issue:** `npm run test:boot` will not fail a new persist key unless a pin exists.

**Fix:** Later PR2. Do not edit boot in Wave 110.

**Status:** named only.

### Verdict

**Approve** as design freeze. Inventory matches live lines. Contract wins. No Blocker/Major.
