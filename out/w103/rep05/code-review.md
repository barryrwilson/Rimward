## Code Review: REP-05 remaining consequences design pack (Wave 103)

### Summary

Design-only. Inventory cites live police leave (`police-leave.js`; `npc.js` 2378), open dock (`station.js` 6181), open jump (`jump.js` 70–76), locker `< −25` (`station.js` 187, 2058), Known 10 (`state.js` 714–721; `shipyard.js` 69; `jobs-chains.js` 84–86), and ungated pirate-work hunt (`npc.js` 1274–1280). MERGE LAW deputizes covering + inbound refuse without wanted, dock reverse, or Digit theft. No 🔴/🟠 remain.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Self-applied (no `src/` diff). Design-doc review also applied (completeness, live cites, alternatives, serial named only).

### What's done well

- Stale `RepStandingDesign.md` police-defer is treated as **wrong**; inventory records leave as **LIVE**.
- Pirate-work hunt stays **ungated law**. Covering is additive Known+, not a retcon of `findPirateWork`.
- Risky run is named: dock stays open. Jump lock is inbound-only so the player is not trapped.
- Numbers are copied: Known 10, Marked exclusive `< −25`, law 300, restitution 1200, kill −5. No invented UU.
- `standingRead` is required; `standingOf` is called out as unsafe to copy.
- First remaining serial (PR1) does not steal Digit 0/8/9. Digit 9 copy is PR3 after sim exists.
- Police leave copy `Leave this space.` is XOR with `Patrol covering.` / `No passage.`

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Digit 9 Standing comment is stale vs shipyard Digit 0 and is correctly treated as non-binding

**Location:** `station.js` 1620–1621 vs `DOCK_KEY_SERVICES` `station.js` 185.

**Issue:** Comment says Digit 9 is Standing and Digit 8 Launch. Live Digit 0 is shipyard. Digit 9 dock root is `epics`.

**Fix:** None this wave. Do not edit `station.js`.

**Status:** documented in inventory §3.

#### 🟡 Minor: `standingLiveNotes` still omits live police leave

**Location:** `station.js` 1160–1179; contract §8 PR3.

**Issue:** Leave shipped Wave 95. Digit 9 still does not list it. PR3 waits until covering/jump exist, so leave copy stays stale until then.

**Fix:** PR3 is named to add the **live** leave line plus new consequences **after** PR1/PR2. Do not lie in PR3 before sim. Do not steal Digit 9 in PR1.

**Status:** frozen; acceptable lag.

#### 🟡 Minor: Autopilot will keep requesting a refused hop

**Location:** `gate.js` 643–649; `jump.js` 70–76; contract §2.3.

**Issue:** After inbound refuse, `beginJump` no-ops. Autopilot `wantJump` can stay true. Player sits in the zone after one `No passage.` toast. NAV `blocked` must not be reused.

**Fix:** Later PR2 keeps the refuse + throttle. Do not write `world.nav`. Owner may add a NAV line later. Do not park REP-05 on it.

**Status:** documented deputize.

#### 💡 Suggestion: Prefer a small helper next to `police-leave.js` over editing `hail.js`

**Location:** contract §1.1, §8 PR1.

**Fix:** Later serial. Named-only this wave.

**Status:** frozen.

### Inventory cite check (live code)

| Claim | Live | Result |
|---|---|---|
| `RANK_LADDER` 714–721 | `state.js` 714–721 | OK |
| `rankFor` 722–725 | `state.js` 722–725 | OK |
| Default bag four keys | `ctx.js` 153 | OK |
| `WORLD_FIELDS` `'reputation'`, no wanted | `save.js` 76–101 | OK |
| `sanitizeReputation` | `save.js` 919–938 | OK |
| `standingRead` | `data-trade.js` 73–81 | OK |
| Police leave LIVE | `police-leave.js`; `npc.js` 2378 | OK |
| Leave copy / 300 / band | `police-leave.js` 5, 8, 116–117 | OK |
| `HOSTILE_STANDING` −10 | `npc.js` 96 | OK |
| Pirate-work hunt | `npc.js` 1274–1280 | OK |
| Dock no standing | `station.js` 5951–5978, 6181 | OK |
| `U.DOCK_RANGE` 45 | `state.js` 30 | OK |
| Jump no standing | `jump.js` 70–76 | OK |
| `MIN_REP` ace 10 / frigate 25 | `shipyard.js` 64–71 | OK |
| Locker `< −25` / fear 40 | `station.js` 187, 2058; `state.js` 326 | OK |
| Unique chain Known | `jobs-chains.js` 84–86 | OK |
| Restitution 1200 | `restitution.js` 5 | OK |
| Kill −5 | `kill-standing.js` 6 | OK |
| Digit 0 shipyard | `station.js` 185, 6023–6025 | OK |
| Digit 8/9 launch/epics | `station.js` 185, 6027–6028 | OK |
| Outfit 8/9 papers | `station.js` 6100–6102 | OK |
| Hub 80 px | `hud.css` 184–191; `hud.js` 709–712 | OK |
| HUD reads `hullKind` | `hud.js` 80–87 | OK |
| `commLine` toast `textContent` | `hud.js` 494–502, 1130 | OK |
| `innerHTML` station/hud/police/jump | grep 0 (modelsbrowser only) | OK |
| Wishlist REP-02 | `PLAYER-EXPERIENCE-WISHLIST.md` 672–681 | OK (read only) |

### Verdict

Approve design pack. Later serial must not weaken `shared-contract.md` §0 dock-open, police-leave live, no-wanted, Digit/hub/`innerHTML` freeze, or Known+ covering XOR vs ungated pirate-work hunt.
