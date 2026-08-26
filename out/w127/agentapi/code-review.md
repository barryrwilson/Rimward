## Code Review: Agent API PR1 observe handle

### Summary
PR1 matches the Wave 126 contract: versioned handle, authored snapshot, session ring, opt-in query, fail-closed `act`. Init order keeps HUD as last live-queue consumer. No helm steal.

### Method
Self-applied `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` and `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`. Spawn of `[reviewer]` was not available. Re-read after the nested-ctx fix.

### What's done well
- Snapshot is field-authored, not a ctx dump; missing ctx omits `ship`/`world`.
- Event ring harvests `ctx.events` (not `lastEvents`); cap 16; unknown types dropped.
- `act` order: forbidden → opt-in → ping/disable → paused → held → unknown.
- `ctx.agent` seeded in `createCtx` and owned in header comments; not WORLD_FIELDS.
- Boot pins cover JSON-plain / no THREE / no-ctx / forbidden / ping / unknown / ring-after-30.

### Findings

#### 🟡 Minor: `DOCK_KEY_SERVICES` duplicated in schema
**Location:** `src/game/agent-schema.js`
**Issue:** Observe cannot import `station.js` (THREE). The frozen list is copied.
**Fix:** PR2 may peek `stationDesk` for the live service id; keep the authored list in schema unless a THREE-free export exists.

#### 🟡 Minor: `enable` is a handle method, not an `act` name
**Location:** `src/systems/agent-api.js`
**Issue:** `act({ name:'enable' })` is `unknown` (or `opt-in`/`paused`). Contract authored table has no `enable` command; Playwright uses `?agent=1`.
**Fix:** None required. PR5 badge should call `rimward.enable(event)`.

#### 💡 Suggestion: later names while paused return `paused` already
**Location:** `dispatchAct`
**Issue:** PR1 pins assert `plotRoute` → `unknown` with pause cleared. Pause/hold paths were stub-tested in Node, not in boot pins.
**Fix:** Optional WAVE127 pin if the integrator wants it; not required by the brief.

### No blockers
- Does not assign `ctx.input` / ship position / credits.
- Does not write `berthHold`.
- Does not add HUD badge or hub child.
- `state.js` untouched.
- First `window.rimward` is kept; observe/act read `window.__ctx` if present. Nested `update` still harvests its own ctx. WAVE127 pins all true on `npm run test:boot`.
