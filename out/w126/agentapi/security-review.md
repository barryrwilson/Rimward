## Security Review: Wave 126 Agent API leftover freeze (markdown)

### Risk Level: Low (after freeze edits)

### Summary
This wave is design-only. No `src/` lands. Census: `window.__ctx` is already a god-handle (`src/main.js` **79**); empty `e.code` never reaches `TRACKED` (`src/systems/controls.js` **315–316**); no `window.rimward`. HIGH items (LAN bind, prefix token compare, ctx dump, teleport, key in bundle) are frozen closed in [`shared-contract.md`](./shared-contract.md). No remaining CRITICAL or HIGH.

Method: self-applied `security-auditor.md` + orchestrator `security-review.md` against live `src/` cites and the freeze (not a hypothetical future diff). Mode: deep audit of the planned trust boundary.

### Findings

None open at CRITICAL or HIGH.

#### 🟠 HIGH (resolved in freeze): Prefix or throwing `timingSafeEqual`

**Location:** `out/w126/agentapi/shared-contract.md` law 9; `docs/AgentApiDesign.md` §9  
**Issue:** Node `crypto.timingSafeEqual` throws when buffer lengths differ. A naive `timingSafeEqual(token, secret)` leaks length or fails open in a catch. A prefix compare would accept truncated tokens.  
**Impact:** A LAN-local client could brute a short token or crash the bridge.  
**Fix (frozen):** Convert both sides to `Buffer`. If lengths differ, dummy equal-length compare then return false. If lengths match, full-buffer `timingSafeEqual`. Never prefix. Never throw.  
**Status:** resolved in freeze.

#### 🟠 HIGH (resolved in freeze): Observe as a ctx dump

**Location:** contract law 10, 21; §0.2.1; `src/core/ctx.js` **270–271** (`emit` spreads payloads; `hailOpened` includes `ship`)  
**Issue:** Copying `ctx` or `lastEvents` would serialize functions, THREE, hail ships, and AI guts.  
**Impact:** Cheat console + XSS amplification beyond HUD-visible numbers.  
**Fix (frozen):** Authored snapshot keys only. Never `JSON.stringify(ctx)`. `hailOpened` `{ type, t, intents, salvage }` only. Cap nearby 12.  
**Status:** resolved in freeze.

#### 🟠 HIGH (resolved in freeze): Remote bind / page WebSocket / key in bundle

**Location:** contract law 9, 11; PR6 table  
**Issue:** `0.0.0.0` or unauthenticated `ws://127.0.0.1` from the page would remote-control the ship. `import.meta.env` would ship `XAI_API_KEY`.  
**Impact:** LAN CSRF / leaked key.  
**Fix (frozen):** No HTTP in PR1–PR5. PR6 binds `127.0.0.1` (optional `::1`). Refuse `0.0.0.0` / `::`. Node CDP `evaluate`. No page WS. Key never in the Vite bundle. Never in-repo LLM.  
**Status:** resolved in freeze.

#### 🟠 HIGH (resolved in freeze): Teleport / credit writers as intents

**Location:** contract law 5; forbidden names in §0.2; `station.js` **6323–6328** (human snap already exists)  
**Issue:** Wishlist “steer to / approach and dock” could be implemented as a warp.  
**Impact:** God-mode.  
**Fix (frozen):** Forbidden names `teleport|setCredits|setHull|setCargo|god|win` → `token:'forbidden'`. Dock is KeyJ in zone. Pad approach is v1 non-goal. Boot pins must call those names.  
**Status:** resolved in freeze.

#### 🟡 MEDIUM: `?agent=1` is not a remote-threat boundary

**Location:** `docs/AgentApiDesign.md` §9; contract §0.1.1; `src/main.js` **79**  
**Issue:** XSS can reload with `?agent=1` or poke `__ctx` today. Opt-in does not shrink observe.  
**Impact:** Same class as current debug handle. Does not add teleport.  
**Fix:** Keep as a **product** gate so a normal tab does not `act`. Do not advertise it as auth. Enable still requires `isTrusted`.  
**Status:** open, accepted. Same as live `__ctx`.

#### 🟡 MEDIUM: Observe always includes HUD credits

**Location:** contract §0.2.1 `world.credits`; law 10  
**Issue:** Origin-public JSON includes credits, hull, cargo counts.  
**Impact:** Same numbers a screenshot or `__ctx` already shows.  
**Fix:** Do not log snapshots. Do not add hidden AI rolls.  
**Status:** open, accepted.

#### 🟢 LOW: Restore must not resume agent drive

**Location:** `src/game/save.js` **80–105** (no agent key); `src/game/nav.js` **54**  
**Issue:** A hostile save could theoretically persist `optIn` if WORLD_FIELDS grew.  
**Fix (frozen):** No new WORLD_FIELDS. `ctx.agent` session only.  
**Status:** resolved in freeze.

#### 🟢 LOW: `innerHTML` badge

**Location:** contract §0.1.2; `hud.css` is `textContent` culture  
**Issue:** Last-intent interpolation into HTML is XSS.  
**Fix (frozen):** `textContent` only. Dest/id never into HTML.  
**Status:** resolved in freeze.

### Passed Checks
- [x] No secrets in this pack
- [x] No `src/` mutation this wave
- [x] `window.rimward` absent in live `src/`
- [x] `__ctx` stays debug (`main.js` **79**)
- [x] TRACKED drops empty `e.code` (`controls.js` **316**)
- [x] HTTP forbidden in PR1
- [x] `0.0.0.0` bind refused
- [x] No page WebSocket
- [x] Equal-length `timingSafeEqual` frozen
- [x] Forbidden teleport/credit names frozen
- [x] Observe allowlist frozen; not a dump
- [x] No in-repo LLM / no `XAI_API_KEY` in bundle
- [x] `state.js` READ-ONLY; no new WORLD_FIELDS
- [x] `berthHold` not impersonated as `paused` (LOAD / CTL-02)
- [x] Overlay-policy paused write still absent (`overlay-policy.js` **1–4**, **196–203**)

### Recommendations
1. Later PR1 boot pins: `act({ name:'teleport' })` → `forbidden`; no-ctx observe `ok:false`; ring survives 30 frames.
2. Later PR6 tests: bind host literal `127.0.0.1`; reject `0.0.0.0`; length-mismatch token returns false without throw.

### Re-review
After contract laws 9, 20, 21 and §0.1.2: no remaining CRITICAL/HIGH.
