## Code Review: Wave 135 PR6 loopback CDP bridge

### Summary
`scripts/agent-bridge.mjs` matches the frozen HTTP/WS schema and CDP evaluate path. Self-test pins all true and exit 0. No Blocker/Major after close-socket, WS mask, and loopback `--game-url` fixes.

### What's done well
- Exports `tokenEqual`, `assertBindHost`, `startBridge`, `runSelfTest` for the mock path (no Chrome).
- Same observe/act envelopes as `window.rimward`.
- `act` forwards only `{ v, name, args }`.
- `package.json` adds `agent:bridge` only; no new deps.
- Header-only `docs/AgentApiDesign.md`; one PROGRESS bullet.

### Findings

None open at Blocker or Major.

#### 🟠 Major (resolved): Windows libuv abort on self-test close

**Location:** `runSelfTest` HTTP client  
**Issue:** `fetch` keep-alive + `server.close` aborted Node (`UV_HANDLE_CLOSING`). Exit was not 0.  
**Fix:** Self-test uses `http.request` with `Connection: close`. `close()` calls `closeAllConnections`.  
**Status:** resolved. Exit 0.

#### 🟠 Major (resolved): Unmasked WS frames

**Location:** WS `data` handler  
**Issue:** RFC6455 clients must mask. Accepting unmasked frames is a proxy-cache footgun.  
**Fix:** Close unless `frame.masked`.  
**Status:** resolved.

#### 🟠 Major (resolved): `--game-url` off-loopback navigate

**Location:** `assertGameUrl`  
**Issue:** CDP `Page.navigate` to a remote URL would evaluate attacker `window.rimward`.  
**Fix:** http(s) + loopback host only; append `agent=1`.  
**Status:** resolved.

#### 🟡 Minor: CDP attach may pick the first local page

**Location:** `pickPageWs`  
**Issue:** Several tabs on 9222: first `127.0.0.1` page may not be the game.  
**Justification:** Prefers `agent=1` and `--game-url` prefix. Operator owns the debug port.  
**Status:** open (accepted).

#### 💡 Suggestion: Dual listen on `::1` plus `127.0.0.1`

**Location:** `--host`  
**Issue:** Default is IPv4 loopback only.  
**Fix:** Optional later. Spec says optional `::1` via `--host`.  
**Status:** open (accepted).

### Verdict
Approve for Wave 135 PR6. Default verify is `--self-test`, not Vite.
