## Security Review: Wave 117 NAV-05 PR1 autopilot gate handoff

### Risk Level: Low

### Summary

PR1 keeps `jumpRequested.to` on live `near.to`, paints frozen `AP_LINES` literals only, and does not add persist keys. No HIGH or CRITICAL issue. Dest stuffing, proto ids, teleport, and XSS paths stay fail-closed.

### Findings

No 🔴 CRITICAL or 🟠 HIGH findings.

#### 🟡 MEDIUM: Listed-hub check reads authored `ctx.systems[].hub.routes`

**Location:** `src/game/autopilot.js` (hub `listed` loop)

**Issue:** Fly `missingHub` uses the authored hub route list, not `zoneHub.routes`. A desync could fire `missingHub` while live lookup still classified the hop as `'hub'`.

**Impact:** Cancel without emit. Route bag stays. Sim does not freeze.

**Justification (accept):** Live rebuild copies authored `hub.routes` onto the assembly. Kind `'hub'` already required `hubListsHop` on a live hub. Fail-closed cancel is the contract.

#### 🟢 LOW: `lookupLiveNavGate` still returns a small `{x,y,z}` object

**Location:** `src/systems/gate.js` `lookupLiveNavGate`

**Issue:** Same per-call object as Wave 85. Scratch `_liveHopKind` is a module-owned record, not a save merge.

**Justification:** WAVE85 `liveMatch` depends on the return shape. No `for-in` onto `ctx.autopilot` or `world.nav`.

### Passed Checks

- [x] Sole emit `gate.js` `{ to: near.to }` — AP has no `jumpRequested`
- [x] Reserved / proto hop: `reservedNavId` → kind `''`, pos null → `missingLookup` / `lookupFail`, no emit
- [x] `wantJump` still nearest identity; no distance-only jump; no skip `JUMP.zone` / `JUMP.chargeTime`
- [x] Wrap / cycle counters are module locals; not `WORLD_FIELDS`; restore still `autopilot: false`
- [x] Chart live uses `textContent` + `apLine(reason)` literals; never hop/dest ids; never `innerHTML`
- [x] `restore` stays silent; missing `#rw-galaxy-ap-live` cannot throw (node is created at init)
- [x] Channel bind still strips unknown keys via `CHANNEL_KEYS` (no `for-in` save merge)
- [x] Fail-closed: no emit, keep route, no throw, no teleport
- [x] No secrets, no new persist key, `state.js` unread for writes

### Recommendations

1. Keep later playtest on deputized English only (PR2). Do not emit `path[1]`.
2. Verifier live: overlapping hub+ring still must not dest-stuff a hub spoke.
