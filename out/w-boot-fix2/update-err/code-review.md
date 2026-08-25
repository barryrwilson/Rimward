## Code Review: src/systems/npc.js (updateDuel / updateFlee unknown classKey)

### Summary
`shipClassOf` is the single own-property `SHIP_CLASSES` lookup on the npc update path. `updateDuel` and `updateFlee` use `classBurn` / `classCruise` (finite `0` when the class is missing). Known cutter still flees at authored burn (`210`) and still duels. Known-class envelope math is unchanged.

### What's done well
- Same `hasOwn` + string-key gate as the prior `speedCap` fix; `__proto__` / `constructor` do not walk `Object.prototype`.
- `Number.isFinite` else `0` for both `cruise` and `burn`; no invented class keys.
- `speedCap` now shares the helpers, so loiter/route/hunt and duel/flee cannot drift.
- Probe covers wave116 trader+hunter, miner+hunter, hail/capitulate pirate/ace flee, ace fury, and known cutter flee/duel.

### Findings

#### 💡 Suggestion: spawn-time `SHIP_CLASSES[record.classKey]?.role` is still unguarded `hasOwn`
**Location:** `src/systems/npc.js:280`, `320`, `389`
**Issue:** Optional chaining avoids a throw. A `__proto__` key could still read `Object.prototype.role` if present. Not on the per-frame update path.
**Fix:** Not required this pass. Update-path lookups are closed. Spawn is out of the reported throw sites.
**Status:** accepted

#### 💡 Suggestion: exported `hunterHasWork` still assumes `other` is an object
**Location:** `src/systems/npc.js:1243-1255`
**Issue:** Production walks skip holes before the call.
**Fix:** Not required.
**Status:** accepted

### Passed
- Unknown `classKey` live trader + hunter: no throw; prey `mode` becomes `flee`; speed finite `0` (`wave116-trader-unknown-plus-hunter`).
- Miner + hunter: no throw; `mode` becomes `flee`.
- Hail/capitulate pirate and ace flee: no throw; speed `0`.
- Ace fury (`acePhase` 3) unknown class: no throw; speed `0`.
- Known cutter flee: `mode` stays `flee`; speed `210` (authored `SHIP_CLASSES.cutter.burn`).
- Known cutter duel: `mode` stays `duel`; speed finite and non-zero (`73.5` = cruise `105` × `0.70` extend, envelope unchanged).
- Worker `speedCap` / hole probes stay green (`PROBE PASS`, `EXTRA PROBE PASS`).

### Re-check
No Blocker / Major. Spawn-role and `hunterHasWork` leftovers remain accepted with one-line justification above. Prior Minor (`updateDuel` / `updateFlee` unguarded index) is resolved.
