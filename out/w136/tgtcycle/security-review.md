## Security Review: TGT-07 PR1 KeyT hostiles-first cycle

### Risk Level: Low

### Summary

PR1 changes in-envelope KeyT sort order only. Hostile bit is `ai.intent === true` on a live ship cand. No Agent cheat lock, no persist auto-lock, no Q-ship class pierce, no `for-in` on `ctx.ships`, `cycleTarget` never throws. No HIGH/CRITICAL remain open.

Persona: security-auditor + orchestrator `security-review.md` (self-applied; no spawn). Mode: quick scan of input-order code.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None open.

#### 🟡 MEDIUM

None.

#### 🟢 LOW

None that need a code change. Wrap-from-friendly still follows the sorted list (law a). That is not skip-to-attacker (law b).

### Task-focus checks

- **Agent cheat lock:** `agent-api.js` unclaimed. `agentSelectTarget` still pulses KeyT or matches an in-range cand by id. No `act({name:'target'})`. Observe may still read `targets.current`.
- **Persist auto-lock:** `state.js` unclaimed. No WORLD_FIELDS. No localStorage. Cycle mode is not saved.
- **Q-ship class pierce:** `isCycleHostile` reads `object`, `lockKind`, `state.destroyed`, `ai.intent` only. No `classKey` / `coverClass` / reveal.
- **Never throw:** `isCycleHostile` try/catch returns false. `cycleTarget` try/catch. Missing `ai` is not hostile.
- **Prototype-safe:** ships walk is `for (const s of ships)`. Gate walk is index. No `for-in` on `ctx.ships`. Reserved proto tokens on kind locks stay TGT-05.

### Passed Checks

- [x] No secrets in code
- [x] No new persist / localStorage
- [x] No `innerHTML`
- [x] No Agent `act({name:'target'})`
- [x] No `flags.combat` as the only gate (envelope is `U.TARGET_RANGE`)
- [x] No `flags.paused` write
- [x] Q-ship cover not a sort key
- [x] TGT-03 Incoming toast not a lock writer
- [x] TRACKED keys unchanged

### Recommendations

1. Later boot harvest may add the synthetic sort probe in `out/w136/tgtcycle/boot-pins.md`.
2. Do not add a skip-to-attacker path on top of this sort.
