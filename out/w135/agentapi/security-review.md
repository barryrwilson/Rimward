## Security Review: Wave 135 PR6 `scripts/agent-bridge.mjs`

### Risk Level: Low (after bind/token/CORS/CDP URL fixes)

### Summary
Loopback Node bridge. Agents talk HTTP/WS to Node. Node drives the tab with CDP `Runtime.evaluate`. Token stays in Node. Bind allow-list is `127.0.0.1` / `::1`. Token compare is equal-length `timingSafeEqual`. No CORS star. No page WebSocket. No provider key on this socket.

Method: self-applied `security-auditor.md` + orchestrator `security-review.md`. Mode: deep audit (auth, bind, CSRF/CORS, crypto compare, log leak, CDP evaluate). Re-ran after mask/`--game-url` loopback fixes.

### Findings

None open at CRITICAL or HIGH.

#### 🟠 HIGH (resolved): Bind all interfaces

**Location:** `scripts/agent-bridge.mjs` `assertBindHost`  
**Issue:** `server.listen` with `0.0.0.0` / `::` / empty host would expose act/observe on the LAN.  
**Impact:** Any LAN client could try the token or CSRF the ship.  
**Fix:** Allow only `127.0.0.1` and `::1` (localhost maps to `127.0.0.1`). Refuse `0.0.0.0` and `::` before listen. Exit 1.  
**Status:** resolved.

#### 🟠 HIGH (resolved): `timingSafeEqual` length throw / prefix

**Location:** `tokenEqual`  
**Issue:** Node throws on length mismatch. Prefix compare would accept truncated tokens.  
**Impact:** Auth oracle or crash.  
**Fix:** Buffer both sides. Length mismatch: dummy 32-byte `timingSafeEqual`, return false. Equal length: full buffers. No throw.  
**Status:** resolved. Self-test pins `tokenLenMismatchFalse`, `tokenMatchTrue`, `tokenWrongSameLenFalse`.

#### 🟠 HIGH (resolved): Localhost CSRF / CORS star

**Location:** HTTP handler; WS upgrade  
**Issue:** Browser JS on another origin can hit `http://127.0.0.1:8765` if CORS allows `*` or if auth is in a simple GET.  
**Impact:** Observe credits leak or act from a web page.  
**Fix:** No `Access-Control-Allow-Origin`. OPTIONS 405. Bearer header required (not query). WS first JSON token, else close. Origin/Referer must be loopback when present.  
**Status:** resolved. Pin `noCorsStar`.

#### 🟠 HIGH (resolved): Token or snapshot logs / provider key on socket

**Location:** log paths; env reads  
**Issue:** Logging observe JSON leaks credits. Logging Authorization leaks the token. Reading a model key into this process would put it next to the bridge socket.  
**Impact:** Credit/session leak; key theft.  
**Fix:** Operational logs are bind/cdp only. Token printed once to stderr when generated (`AGENT_TOKEN=<hex>`), never again. Self-test fixture and snapshot credits must not appear in logs. Source does not read a model-provider key env.  
**Status:** resolved. Pin `noTokenOrSnapshotLogs`.

#### 🟠 HIGH (resolved): Page WebSocket / `enable()` via evaluate

**Location:** evaluate expressions  
**Issue:** A page WS would skip Node auth. `enable()` from evaluate is not a trusted click.  
**Impact:** Unauthenticated act, or fake opt-in.  
**Fix:** No edit to `src/systems/agent-api.js`. Evaluate only `observe` / `act`. Fail closed with `no-ctx` if `window.rimward` is missing. `--game-url` forces `agent=1`.  
**Status:** resolved.

#### 🟡 MEDIUM: No rate limit

**Location:** HTTP/WS handlers  
**Issue:** A local process can flood observe/act.  
**Impact:** CPU on CDP evaluate.  
**Justification:** Bind is loopback. Token is required. Accept as local-operator DoS.  
**Status:** open (accepted).

#### 🟢 LOW: Unauthenticated `GET /health`

**Location:** `/health`  
**Issue:** Confirms the bridge is up without a token.  
**Impact:** Local port scan only. Spec allows `{ ok:true }`.  
**Status:** open (spec).

#### 🟢 LOW: Spawned Chrome `--remote-allow-origins=*`

**Location:** `launchChrome`  
**Issue:** Chrome CDP handshake allows any DevTools origin.  
**Impact:** Only if `--launch-chrome` and CDP port is reachable. CDP address is `127.0.0.1`. Not the agent HTTP CORS.  
**Status:** open (needed for Node CDP client; accepted).

### Passed Checks
- [x] No secrets hardcoded
- [x] Auth on `/observe` and `/act`
- [x] No token in HTTP query
- [x] Equal-length full-buffer `timingSafeEqual`
- [x] Bind allow-list; refuse all-interfaces
- [x] No CORS `*`
- [x] Origin/Referer loopback when present
- [x] WS clients must mask; bad token closes
- [x] `--game-url` loopback http(s) only
- [x] Fail closed without `window.rimward`
- [x] No `src/` page WS
- [x] Logs omit token and snapshots
- [x] `npm run dev` does not start the bridge

### Recommendations
1. Keep PR6 optional: humans use `npm run dev` only.
2. External LLM clients stay out of repo (owner 4C).
