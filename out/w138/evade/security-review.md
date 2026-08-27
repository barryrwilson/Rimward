## Security Review: Wave 138 PR1 named afterburner act

### Risk Level: Low

### Summary
The new verb queues the live Space afterburner edge. It does not teleport, grant power, persist opt-in, or write pose/credits. Act stays fail-closed and never throws to the caller.

### Findings

None at CRITICAL or HIGH.

#### 🟡 MEDIUM: Outer pulse may queue while inner burn no-ops
**Location:** `src/systems/agent-api.js` dispatchLive `afterburner`; `src/systems/ship.js` burn gate
**Issue:** Cooldown, low power, and already-burning still return `queued`. The hull does not cheat-ready.
**Impact:** An opted-in agent can spam the name. The inner machine still no-ops. No god-mode.
**Fix:** Deputize off. Do not add token `cooldown`. Optional observe `burnerReadyAt` is the wait clock.

### Passed Checks
- [x] Never throw from `act` (`dispatchAct` + handle `try/catch` → `refuse`)
- [x] `teleport` / `warp` / `god` stay `forbidden`; `evade` / `flee` stay `unknown`
- [x] No write to `ship.object.position`, credits, hull, cargo, or `flags.paused`
- [x] No persist of `optIn` or burner state
- [x] Command names via `Object.hasOwn` / `Set`; no `for-in` on act payload
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write`
- [x] No `XAI_API_KEY` in the bundle; no page WebSocket
- [x] Prototype-safe observe: `finiteOrNull` omit; no `npc.ai`
- [x] Missing `ctx.input` → `no-service`; docked → `docked`; paused / held / opt-in tokens kept
- [x] Public `PULSE_EDGES` in `agent-api.js` still four (no afterburner alias)

### Recommendations
1. Keep public pulse fail-closed on unknown edges.
2. Do not add a cooldown cheat in the act.
