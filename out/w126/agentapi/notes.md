# Wave 126 leftover — Agent API (inbox P2)

**Verdict:** Leftover **REAL**. Named serial **PR1** (observe handle). Not CONSUME. Not serial none.

## Method

- Graph resolve: `execute_workflows` on `omp/workflow-browser-assisted-work` (`resolution_id` `r-mt9gsojd-1b7b0b4b`). Match score 39.93, coverage 0.08, terms `real` + `ui`. Owner brief expected `proceed_unmodeled`. This is a **false bind** (not calendar/CRM/Activar). Did **not** follow the browser workflow. Did **not** `graph_propose` or `graph_approve`. Did **not** mutate CRM, calendar, or the graph. Started **no** Chrome, Vite, or boot-test.
- Merge law: `out/w126/agentapi/shared-contract.md` wins.
- This worker write-set: `docs/AgentApiDesign.md` + `out/w126/agentapi/**` except `verify/`.
- Wave 125 dirty `src/` is **read-only**.

## Census (code wins)

1. No `window.rimward` in `src/`, `scripts/*.mjs`, or `index.html`.
2. `window.__ctx = ctx` debug/harness (`src/main.js` **79**).
3. `TRACKED.has(e.code)` drops empty `code` (`src/systems/controls.js` **315–316**). Pause **168**, station **6159**, hail **435**, chart **766** also key off `code`.
4. Helm merge AP > AM > input (`src/systems/ship.js` **738–830**).
5. `writeNav` always `autopilot: false` (`src/game/nav.js` **54**).
6. Desk verbs are closures (`station.js` **4788**, **4616**, **6079**, **6129**; `hail.js` **144**). No `stationDesk` / `hailApi`.
7. Wave 125: `ctx.flags.berthHold` live (`ctx.js` **211**; overlay **187–204**; ship **754**; AP latch **153–177**; gate **678**). Automine hypot still chart-only (**169–171**).
8. Boot-test `dispatchKey` supplies `{ code }` only (**258–263**). Harness still writes `ctx.input` (**573**, **1137**).

If a versioned `window.rimward` with observe+intents had been live, leftover would be CONSUME / serial none. It is not.

## Freeze (deputize; owner knobs already locked)

Owner locks not reopened: opt-in A, pad 2A, bridge 3A, never in-repo LLM 4C, grok-4.5 external-only 5, pause A. No PR7/PR8.

Deputize added this freeze:

- `act` while `berthHold` → `token: 'held'` (not `paused`).
- PR3 hypot latch is **`optIn` only**. Do not add `berthHold` to automine.
- PR6 equal-length full-buffer `timingSafeEqual`.
- PR5 copy: `Agent play` / `on`/`off` / `Enable agent play` / `Stop agent play`. Not `AGENT DRIVE`. Not HUD hub.

Architecture kept: handle first, live WebGL watch after PR3, optional 127.0.0.1 CDP PR6, same schema.

## Coupling (cite only)

- Hail-demand sibling (`docs/Hail01DemandLifecycleDesign.md`): this leftover attaches `ctx.hailApi.resolve` to **live** intents. It does not redesign hail demand.
- Home-marker sibling (`docs/Hud06HomeMarkerDesign.md`): this leftover does not add a hub pip or home-berth bubble. AI-05 PR2 stays theirs.
- CTL-03 PR2 stills, CTL-04 PR2 `fireHeld`: not this pack.

## Processes

Started none. No Vite. No Chrome. No `npm run test:boot`. Domain is data.
