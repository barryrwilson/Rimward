## Code Review: AP pathing

### Summary
Directed BFS hops now match live hardware. Guidance and autopilot aim at the live zone origin. Hub cycle stops on the routed hop so `wantJump` can fire.

### What's done well
- `neighborsOf` stays `gates[].to` ∪ `hub.routes` (no reverse chart edges)
- `sanitizeNav` heals stuffed phantom `path[1]` via BFS
- `resolveAuthoredNavGate` still returns authored numbers (WAVE85 `physPos`)
- Live lookup copies `{x,y,z}` and does not leak meshes
- Gate still requires `world.nav.autopilot && wantJump && near.to === nextHop`
- Probe covers Freehold→Veridian zone jump and hub cycle→Hearth/Haven

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Live lookup is not keyed by system id

**Location:** `src/systems/gate.js` `lookupLiveNavGate`  
**Issue:** Callers must run after `rebuild()`. A call between systems without rebuild could be stale. Gate rebuilds on `systemLoaded` before AP in the next frame.  
**Fix:** None this pass. Tick order already rebuilds first.

#### 💡 Suggestion: `hubWrap` is still a frame counter

**Location:** `src/game/autopilot.js` hub cycle  
**Issue:** Cap is a safety net. Same-frame `nearTo` publish makes a full wrap unlikely.  
**Fix:** Optional: count actual `routeIndex` changes.

### Recheck
Headless probe PASS: `node --import ./scripts/with-css-stub.mjs out/w87/ap-path/probe.mjs`
