# Code Review: PHY-05 pad-home PR1+PR2 (Wave 110)

### Summary

PR1 reuses `writeStationHold` / `healPadHome`. Patrol author writes wp0 only and keeps 3 legs. Heal callers match miner (rebuild + tickBank). No third helper. No `state.js`. No `npc.js`. Pins invert leftover pad-center snapshots. No Blocker or Major.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` + orchestrator `code-review.md`. Self-applied.

### What's done well

- Author string matches miner: `writeStationHold(new THREE.Vector3(), station, 'heavy', gate)`.
- `holdClassFor` keeps trader `freighter` and miner `light`/`cutter` else `light`. Patrol uses known scale class else `heavy`.
- Persist heal is idempotent via `PAD_HOME_EPS` (0.5).
- Fail closed: missing helper / NaN / unknown system leaves rec unchanged.
- Pirate/ace factories stay gate jitter.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: Live hypot pin uses 1 u rounding slack

**Location:** `scripts/boot-test.mjs` WAVE110 `livePatrolOffPad`; `out/w110/padhome/probe.mjs` `author.roundedHold`.

**Issue:** `plainRoute` rounds wp0. Freehold hypot after round can sit ~0.35 u under `cyl + heavy hull + pad`. Unrounded `writeStationHold` still meets the formula. Slack is test-only.

**Status:** accepted. Heal path is unrounded and meets `holdMin`.

#### 💡 Suggestion: `typeof writeStationHold` never fails after static import

**Location:** `src/game/world.js` `healPadHome`.

**Fix:** Keep as fail-closed documentation. Do not add a third helper.

**Status:** open nit.

### Passed Checks

- [x] Correctness: 3 waypoints; wp0 only; gate/planet legs stay
- [x] `fromPos` dest gate (author) / `holdFromPos` (heal)
- [x] No navmesh / `planApPath` / `applyAvoidBias`
- [x] No loiter retune
- [x] WAVE58/59 leftover pins inverted; WAVE4/26/35 untouched
- [x] Probe PASS; isolated WAVE110 all true
