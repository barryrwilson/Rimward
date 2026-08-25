# Code Review: FX-01 remaining combat punch brief (Wave 110)

Design-only. Inventory cites live `spawnRipple` world-space (`combat.js` 1026–1043), `spawnHitFx` XOR (1045–1053), `stampHullMark` host parent (1073–1097), shake (`ship.js` 121–137, 1207–1279), recoil WAVE59, `HULL_MARK_POOL` 12 (`hull-marks.js` 7), `WORLD_FIELDS` without an FX key (`save.js` 76–101). MERGE LAW deputizes hull-local ripple without `state.js` write, without shake retune, without recoil rewrite. First-person player-host parent was a 🟠; **fixed** this pass. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Design-doc checklist folded in. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is **hull-local shield ripple**, not shake, not recoil, not marks pool; fail closed is world-space ring; smallest additive reuses `RIPPLE_POOL` + `worldHitToLocal`; PR plan is named-only; Digit/hub/`state.js`/no-new-key/reducedMotion freezes sit in MERGE LAW. Inventory line numbers match Wave 110 live `src/`. Recoil and marks named **LIVE consume**.

### What's done well

- Code-wins census: drops muzzle, bolts, world-space ripple *pool*, sparks, shake, audio, recoil, marks from “remaining.”
- Correctly separates **world-space ring** (LIVE) from **hull-local ride** (ABSENT) so WAVE54 `spawnRipple` pins are not inverted.
- Shake not picked as PR1 even though the owner example allowed it *if missing* — census shows it is not missing.
- Fail-closed table matches live dry-pool / bad-host returns and never-zero-speed.
- First serial named **PR1 hull-local shield ripple**; Digit 0/8/9 and `state.js` forbidden on that PR.
- WAVE54/59 boot pins fenced as honor, not invert.

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | hull-local ripple | §0 feel/readability; §0.1 parent | Match |
| Fail closed | world-space; never stop | §0.16 / §2 | Match |
| Smallest additive | parent `RIPPLE_POOL` | §0.1 | Match |
| New persist key | no | §0.6 | Match |
| Recoil / marks | consume | §0.8–0.9 | Match |
| Required shake PR1 | no | §0.10 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no punch pip | §0.2 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| First serial | PR1 | §3 PR1; no Digit; no state.js | Match |
| `reducedMotion` | snap | §0.19 | Match |
| FP player host | no full-size parent | §0.1 / §2 | Match (fix this pass) |

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (fixed): First-person player-host parent could fill the glass

**Location:** live muzzle glass law `combat.js` 998–1021; `FIRST_PERSON_NOSE` `ship.js` 84; ripple scale 2.2→9.4 (`combat.js` 1962–1963). First draft parented every host.

**Issue:** A scale-9 additive sprite parented to the living hull in first person sits on the camera. That is center-view spam and fights HUD-01 empty glass. Live muzzle already shrinks and steps off the nose for this reason.

**Fix:** Contract §0.1 item 6 and §2: first-person + player host stays world-space or FP-small. NPC hosts still parent. Chase/third player host may parent.

**Status:** fixed this pass in contract, brief, inventory.

#### 🟡 Minor: `spawnFlash` remains an untextured square

**Location:** `combat.js` 588–596, 984–996. Mining forbids squares (76–77).

**Issue:** Hits still pop a hard quad. Punch leftover is hull-local ripple, not the flash map.

**Fix:** Optional PR2 after playtest. Not required PR1.

**Status:** accepted; contract §3 PR2 skippable.

#### 🟡 Minor: `npcHit` audio is still a light tick

**Location:** `song.js` 55.

**Issue:** Enemy hits can still sound thin. FX-02 first pass is DONE; music/radio stay closed.

**Fix:** Do not retune CUES as this leftover. Playtest may ask a later audio tick; not PR1.

**Status:** documented; consume FX-02.

#### 💡 Suggestion: Later PR2 add a WAVE boot pin `rippleHostOnShield`

**Location:** `boot-test.mjs` WAVE54 11657–11658 already greps `spawnRipple` / `spawnHitFx`.

**Issue:** Boot will still pass if parent never lands. WAVE54 must **not** invert.

**Fix:** Later optional pin: shielded spawn sets `slot.host === object` except first-person player. Do not edit boot in Wave 110 markdown worker.

**Status:** frozen as named-only.

### Cite spot-check (live)

| Claim | Live |
|---|---|
| `RIPPLE_POOL = 16` | `combat.js` 181 |
| `spawnRipple` world copy | 1039 |
| XOR hit | 1048–1052 |
| `HULL_MARK_POOL = 12` | `hull-marks.js` 7 |
| Recoil cannon/disruptor | `ship.js` 1237–1247 |
| Shake caps | 129–130 |
| Hub 80 px | `hud.css` 184–189 |
| Digit 0 shipyard | `station.js` 188, 6075–6076 |
| No FX in `WORLD_FIELDS` | `save.js` 76–101 |

Cites match live lines at census.
