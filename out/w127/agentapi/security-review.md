## Security Review: Agent API PR1 observe handle

### Risk Level: Low

### Summary
Same-origin `window.rimward` is a smaller, fail-closed surface than `window.__ctx`. Observe is origin-public HUD JSON by contract. `act` is gated by session `optIn`, refuses cheats, and never writes helm/credits/position. No HTTP, no page WebSocket, no bundled secrets.

### Method
Self-applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Spawn of `[security-auditor]` was not available in this worker. Re-read after the nested-ctx singleton + `window.__ctx` live resolve.

### Findings

#### 🟡 MEDIUM: Observe is always-on (by design)
**Location:** `src/systems/agent-api.js` `observe()`; `src/game/agent-observe.js`
**Issue:** Any same-origin script can call `observe()` without `optIn`. Snapshot includes credits, hull, cargo, system id.
**Impact:** Same class as existing `window.__ctx` (main.js debug handle). XSS already has god-access to ctx.
**Fix:** None in PR1. Contract law 10: opt-in does not gate observe. Do not log snapshots (code does not).

#### 🟡 MEDIUM: `act` is a same-origin control surface
**Location:** `src/systems/agent-api.js` `dispatchAct`
**Issue:** XSS or an extension can call `act` after `?agent=1` or if it can set `ctx.agent.optIn`.
**Impact:** PR1 only `ping`/`disable` succeed. Cheat names return `forbidden`. Credits/position are not writers here. Residual risk is later PR2/PR3 verbs, still weaker than `__ctx`.
**Fix:** Keep forbidden-first and no input/position/credit assigns. Playwright uses query, not `enable()`.

#### 🟢 LOW: `console.warn` on forbidden names
**Location:** `src/systems/agent-api.js` forbidden branch
**Issue:** Logs the command name. Does not log args, credits, or snapshots.
**Impact:** Negligible. Helps boot pins / operators.
**Fix:** Keep. Do not interpolate dest/id.

### Passed Checks
- [x] No secrets / API keys / `XAI_API_KEY` in these files
- [x] No HTTP server, no `0.0.0.0`, no page WebSocket
- [x] No `innerHTML`
- [x] Prototype-safe name maps (`Set` / `Object.hasOwn`); no `for-in` into ctx
- [x] `act` args never spread onto ctx
- [x] Forbidden names fail closed before unknown
- [x] `enable()` without `isTrusted` → `opt-in`
- [x] `hailOpened` sanitizer drops `ship` / `npc.ai`
- [x] Observe builder does not return functions, desks, `__ctx`, save slots
- [x] No new WORLD_FIELDS; restore cannot persist `optIn`
- [x] Fail closed: observe/act/update catch and do not throw into the loop
- [x] Never write `flags.berthHold`; hold is not mapped onto pause
- [x] Public handle is first-install only; later inits cannot swap a second act surface
- [x] `window.__ctx` follow is the existing debug handle, not a new privilege

### Recommendations
1. PR6 (not this wave) must bind `127.0.0.1` and equal-length `timingSafeEqual` if a bridge lands.
2. Keep public docs on `window.rimward`, not `__ctx`.
