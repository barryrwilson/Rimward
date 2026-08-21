## Security Review: Wave 82 TGT-05 lock categories + 12 px cone

### Risk Level: Low

### Summary
Lock refs are fresh allowlisted wrappers. HUD copy uses `textContent` and strips control chars. `reticleLock` still emits `{ hit }` literals only. Prototype keys on `lockKind` / gate `to` / landmark `id` fail closed. No persist of `targets.current`. No HIGH/CRITICAL findings.

### Findings

None open.

### Passed Checks
- [x] No secrets in code
- [x] Prototype keys fail closed (`__proto__` / `constructor` / `prototype`; `Object.hasOwn(SYSTEMS, to)` before dest lookup)
- [x] HUD bracket / names use `textContent` only (no `innerHTML` in the write-set)
- [x] Control chars stripped on copied world strings (`stripHudText`)
- [x] `ctx.emit('reticleLock', { hit: true|false })` literals only — lock wrappers are never spread into the event queue
- [x] Miss line is a module literal (`Nothing under the reticle.`) — not built from record/clue/save strings
- [x] Landmark HUD looks up authored `landmarks[].id` only; clues are not a pick source
- [x] Pod wrapper is not stamped onto the live `ctx.pods[]` member (`podCollected` cannot leak `lockKind`)
- [x] Station wrapper is not stamped onto `ctx.station`
- [x] No `targets` persist; no new frozen event
- [x] Rock consumers require list membership + `!lockKind` (untagged `{position,name}` cannot MATCH / mining-pull / paint `ASTEROID`)
- [x] `COMMODITIES` name lookup uses `Object.hasOwn`

### Recommendations
1. Keep lock payloads as `{ hit }` literals if later events grow.
2. Do not add `type` or `t` onto wrappers (`emit` spreads `data`).
