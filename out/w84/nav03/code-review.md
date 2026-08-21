## Code Review: NAV-03 full-route autopilot design (Wave 84, post designer patch)

### Summary

The freeze now matches live HUD/chart occupancy: refuse cannot hide under `z-index` 30, chart clicks cannot steer-break, next hop is `path[1]`, and player English is a closed table. Writer split, restore, MATCH, and hub law still match live ownership.

### What's done well

- NAV-01 persist consumed as `{ dest, path, remaining, status }` plus `autopilot`. Next hop `path[1]`.
- `flags.galaxyChart` has a single writer (`galaxychart.js`). Not persist.
- Steer-break grace after chart close (hypot below 0.65 for one frame) prevents a one-frame drop.
- Sole `jumpRequested` emitter unchanged.
- Tests name the two designer blockers.

### Findings

No 🔴 Blocker or 🟠 Major.

#### 🟡 Minor: `flags.galaxyChart` is a new ctx flag

**Location:** contract §3.4; live `galaxychart.js` 230–236 (local `open` only)  
**Issue:** Later `ctx.js` freeze must list the writer. A missed write leaves steer-break armed on the open chart.  
**Fix:** PR6 sets the flag in `setOpen`. Boot pin: open chart → `galaxyChart === true`.

#### 🟡 Minor: `wantJump` latch vs gate-first tick

**Location:** contract §3.1 / §4.3; `main.js` 105–114  
**Issue:** Same as the prior pass. Impl must not emit from `autopilot.js`.  
**Fix:** Already frozen.

#### 💡 Suggestion: Tick comment in `main.js`

`initAutopilot` after controls, before ship. Keep gate first.

### Contract drift check

| Law | Brief |
|---|---|
| Markdown only / no `src/` | Yes |
| `state.js` READ-ONLY | Yes |
| Persist on `world.nav` only | Yes (`autopilot` + NAV-01 fields) |
| Restore no auto-resume | Yes |
| No teleport / sole zone emit | Yes |
| Interrupt table + English | Yes (§5 / §8.3) |
| Single writer + MATCH refuse | Yes; chart-visible |
| PHY-02 bias only | Yes |
| No lock steal / KeyV | Yes |
| Chart / hub / digits / KeyM | Yes |
| Designer blockers | Closed (§3.3–3.4, §5 `input`, §8) |

### Recommendations

1. Keep `docs/Nav03AutopilotDesign.md` subordinate to the contract.
2. Land PR6 only after §8.1 live region exists; do not ship Autopilot click with HUD-toast-only refuse.
