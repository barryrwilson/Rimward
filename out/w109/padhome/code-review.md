# Code Review: PHY-05 remaining pad-home brief (Wave 109)

Design-only. Inventory cites live patrol `station.clone()` (`world.js` 374–381), `healPadHome` trader/miner gate (702–726), `holdClassFor` light fallback (668–673), `recordPosition` spawn (629–643), live loiter ring (`npc.js` 210–214, 257–258), `WORLD_FIELDS` without a holds key (`save.js` 76–101). MERGE LAW deputizes persist heal without `state.js` write, without navmesh, without changing `applyAvoidBias`. Pin-cite (WAVE58 clone lives in `out/w58`, not `boot-test.mjs`) was a 🟠; **fixed** this pass. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Design-doc checklist from `design-doc-reviewer.md` folded in. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is patrol **authorship / persist**, not PHY-04 lookahead; fail closed is live dest; smallest additive reuses `writeStationHold` / `healPadHome` and fixes `holdClassFor` for heavy; PR plan is named-only; Digit/hub/`state.js`/no-new-key/no-navmesh freezes sit in MERGE LAW. Inventory line numbers match Wave 109 live `src/`. Re-review after pin-cite: PR2 inverts `out/w58` / `out/w59` leftover probes; WAVE58 **boot** does not grep the clone.

### What's done well

- Code-wins inventory: only one `station.clone()` in `src/`; pirate/ace are gate homes; live patrol dest is already a 80–150 ring.
- Correctly separates **spawn via `recordPosition`** from **live loiter dest** — PHY-04 frame retarget cannot close save/load.
- `holdClassFor` light-for-heavy called out before a naive role-gate PR.
- Reuse Wave 59 healer instead of a third helper; `minerHoldFromStation` stays live scratch.
- Fail-closed table matches live no-throw heal and never-zero-speed.
- First serial named **PR1 persist heal**; Digit 0/8/9 and `state.js` forbidden on that PR.
- PHY-04 sibling fenced (`applyAvoidBias` not this leftover).

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | persist / author | §0 authorship heal | Match |
| Fail closed | live dest; never stop | §0.16 / §2 | Match |
| Smallest additive | author + heal + holdClassFor | §0.1 | Match |
| New persist key | no | §0.6 | Match |
| Navmesh / `planApPath` | forbidden | §0.10 / §0.15 | Match |
| `applyAvoidBias` | none | §0.11 | Match |
| Bounce / sun | honor | §0.8 / §0.9 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no pad-home pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| First serial | PR1 | §3 PR1; no Digit; no state.js | Match |
| `holdClassFor` | known classKey else heavy | §0.1 | Match |
| Pin invert | `out/w58` / `out/w59` | §0.14 / §3 | Match (re-dispatch fix) |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟠 Major (fixed): WAVE58 patrol pin cited as `boot-test.mjs`

**Location:** inventory §0 / §9 (was); contract §3 PR2 (was); brief serial table (was). Live: `out/w58/routes/probe.mjs` 95; `out/w58/routes/verifier.mjs` 126. `scripts/boot-test.mjs` WAVE58 has **no** `station.clone` grep.

**Issue:** An implementer would hunt a missing boot pin and might “fix” unrelated WAVE58 boot keys. Known boot FAILs must stay untouched.

**Fix:** Cite `out/w58` / `out/w59` leftover probes. Optional **new** WAVE boot pin in later PR2. Do not claim WAVE58 boot already encodes patrol clone.

**Status:** fixed this pass.

#### 🟡 Minor: Live loiter still ignores healed `route[0]`

**Location:** `npc.js` 257–258; brief §2 live patrol.

**Issue:** After persist heal, live patrols still loiter on a ring, not the hold. Abstract dock is at the hold; live mesh does not “park” there. Wishlist wanted no tunnel, not a dock animation. Players may still see patrols orbit, not sit on a pad.

**Fix:** None this leftover. Do not retune the ring as the fix (contract §0.19). Do not copy `record.route` into loiter waypoints (that would re-introduce pad dest if heal missed).

**Status:** accepted; leftover is spawn/persist.

#### 🟡 Minor: `rebuildTransitRegistry` uses `for (const sysId in banks)`

**Location:** `world.js` 451. Contract §0.7 forbids new `for-in` from save waypoints, not this existing bank walk.

**Issue:** Pre-existing. `save.js` already walks banks this way. PHY-05 must not add a second `for-in` on route objects.

**Fix:** Call `healPadHome` inside the existing record loop. Do not `for-in` `rec.route[0]`.

**Status:** documented; later PR1 honor.

#### 💡 Suggestion: PR2 add a WAVE boot pin `patrolHoldOffPad`

**Location:** `boot-test.mjs` WAVE59 trader/miner block 11831–11868.

**Issue:** Boot currently does not fail if patrol stays on the pad. `out/w58` probes will fail when author changes, but `npm run test:boot` might still pass without a new pin.

**Fix:** Later PR2: `healPadHome` on a pad patrol; assert XZ ≥ cyl + heavy hull + pad. Do not edit boot in Wave 109.

**Status:** named in contract PR2.

### Design completeness

Required integrator sections present (overview, inventory, goals, deputize, neighbours, serial PRs, security, acceptance, alternatives, risks, ownership). Feasible on existing `world.js` tick/rebuild. No infra growth. Rollback = leave role gate as trader/miner (fail closed).

### Verdict

Approve for a later serial after the pin-cite fix. Implementer can land PR1 in `world.js` without `state.js`, without a new persist key, and without touching `applyAvoidBias`.
