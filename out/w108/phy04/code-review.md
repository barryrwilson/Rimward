# Code Review: PHY-04 remaining NPC avoid brief (Wave 108)

Design-only. Inventory cites live `npc.js` lookahead (`applyAvoidBias` 608–658, comments 59–60 / 603–607), Wave 58 station keep-out / gate torus, `collision.js` collect/resolve, `physics.js` 40 / 1.4, player bounce without lookahead, AP reuse + gate skip. MERGE LAW deputizes two-sample bias without `state.js` write, without navmesh, without replacing bounce. Mermaid `_phyOn` inversion was a 🔴; **fixed** this re-dispatch. No open 🔴/🟠.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + persona `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn a reviewer agent (no spawn tool). Did **not** run project-wide formatters or the full test suite.

### Summary

Brief and contract agree: leftover is NPC avoid quality; fail closed is live 40 u bias; smallest additive is a mid sample at 20 u; PR plan is named-only; Digit/hub/`state.js`/persist/no-navmesh freezes sit in MERGE LAW. Inventory line numbers match Wave 108 live `src/`. Re-review after mermaid fix: `_phyOn?` **yes** → `applyAvoidBias`; **no jumping** → dest. Matches `npc.js` 2261 / 749 and contract §2.

### What's done well

- Code-wins inventory: one probe, station path test already path-like, torus shipped, player FLT has no `applyAvoidBias`.
- Wave 58 `out/w58/avoid/probe.log` cited as shape-clean, not “no routine collisions.”
- Patrol pad-center dest is inventoried; PR2 is frame-only so AI authorship is not stolen.
- AP `planApPath` explicitly not imported into NPC (NAV fence).
- Fail-closed table matches live `_phyOn` / empty bag / missing object.
- CPU cap (≤2 extra probes, no extra bag alloc) is numeric, not a slogan.
- Export `applyAvoidBias` stays for AP + boot pins.

### Contract vs brief consistency

| Topic | Brief | Contract | Result |
|---|---|---|---|
| Merge winner | contract wins | this file wins | Match |
| Leftover owner | NPC avoid | §0.11 NPC | Match |
| Fail closed | live 40 u; never stop | §0.16 / §2 | Match |
| Mermaid `_phyOn` | yes → bias; no jumping → dest | §2 jumping / `!_phyOn` dest | Match (re-dispatch fix) |
| Smallest additive | two-sample 40+20 | §0.1 | Match |
| Lookahead / gain | honor 40 / 1.4 | §0.1 | Match |
| Navmesh | forbidden | §0.15 | Match |
| `planApPath` | no NPC import | §0.10 | Match |
| Bounce | honor | §0.8 | Match |
| Sun radii | honor | §0.9 | Match |
| Digit 0/8/9 | freeze | §0.3 | Match |
| Hub | no avoid pip | §0.2 | Match |
| Persist | none | §0.6 | Match |
| `state.js` | READ-ONLY | §0.5 | Match |
| First serial | PR1 | §3 PR1; no Digit; no state.js | Match |
| Player FLT | no lookahead | inventory + §0.11 | Match |

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🔴 Blocker (fixed): Brief mermaid inverted jump fail-closed

**Location:** `docs/Phy04AvoidDesign.md` mermaid (was ~167–168). Live `npc.js` 2261 `_phyOn = !ctx.gate.jumping`; `steerLive` 749.

**Issue:** Diamond `_phyOn?` sent `|no jump|` to `aim = dest` and `|yes|` to `applyAvoidBias`. Label **no jump** on the dest-only arm contradicted live: no jump means `_phyOn` true and **must** bias.

**Fix:** Relabel. `_phyOn? not jumping` → **yes** `applyAvoidBias`; **no jumping** dest. Bag miss also goes to dest-only, not back into dest. Contract §2 was already correct; no contract edit.

**Status:** fixed this re-dispatch.

#### 🟡 Minor: Mid sample still heading-based, not dest-chord

**Location:** contract §0.1 formulas; `npc.js` 618–621 live probe uses `_fwd`, not dest.

**Issue:** A ship aimed 30° off its waypoint still samples along the **nose**. A dest-chord sample would read more as “path.” The leftover asked for smallest additive, not a rewrite. Dest-chord is a larger change (and closer to `planApPath`).

**Fix:** Keep deputize (heading mid-sample). Documented as remaining bias. PR2 hold retarget covers dest-through-station. Do not silently swap to dest-chord in PR1.

**Status:** accepted; matches “not a planner.”

#### 🟡 Minor: Patrol pad-center dest remains in `record.route`

**Location:** `world.js` 374–381; contract PR2.

**Issue:** Saves still store pad-center for patrols. Frame retarget does not heal authorship. Players who inspect records still see a pad waypoint.

**Fix:** Out of PHY-04 persist. PR2 must not write `record.route`. Owner may open an AI serial later.

**Status:** frozen.

#### 💡 Suggestion: PR4 pin `applyAvoidBias` export + player-gate skip

**Location:** `npc.js` 425–428, 608; `autopilot.js` 10, 275.

**Issue:** A later “cleanup” that un-exports avoid or skips gates for NPC would break AP and Wave 58 probes.

**Fix:** PR4 source pins already named. Keep.

**Status:** documented.

### Verdict

Approve the design pack for orchestrator merge. Implementer must treat `out/w108/phy04/shared-contract.md` as law.
