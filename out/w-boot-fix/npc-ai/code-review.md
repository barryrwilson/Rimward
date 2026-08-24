## Code Review: npc.js `live.ai` skip

### Summary
The update loop now skips non-NPC `ctx.ships` entries. WAVE74 KeyT ticks no longer throw on `velocity`. Destroyed handling still runs when `ai` exists.

### What's done well
- Same `continue` shape as `st.destroyed`.
- Destroyed path no longer reads `live.ai.deathHandled` when `ai` is missing.
- `animateShipMesh` uses the local `ai` after the skip.
- No leak in npc.js (`ctx.ships.push` lives in traffic.js / boot-test only).

### Findings

#### 💡 Suggestion: Guard missing `state`
**Location:** `src/systems/npc.js` update loop (`const st = live.state`)
**Issue:** `st.destroyed` still throws if an entry has no `state`.
**Fix:** Not required. WAVE74 dummy has `state`. Player hull is not in `ctx.ships`.

### Notes
Leak source: `scripts/boot-test.mjs` `fakeShip74` (WAVE74). Task forbids boot-test edit unless npc.js cannot guard. The skip is enough.
