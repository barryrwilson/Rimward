# Wave 127 — Agent API PR1 (observe handle)

**Status:** implemented. Serial PR1 of Wave 126 leftover freeze.
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.

## Landed

- `src/game/agent-schema.js` — VERSION 1, authored/forbidden names, event types, JSON-plain helpers. `Object.hasOwn` / `Set`. No `for-in`.
- `src/game/agent-observe.js` — frozen §0.2.1 snapshot into a fresh object. Missing ctx omits the rest. No `JSON.stringify(ctx)`. No THREE import.
- `src/systems/agent-api.js` — `initAgentApi(ctx)` installs frozen `window.rimward` `{ version, observe, act, enable, disable }`. Harvests `ctx.events` → `ctx.agent.events` (cap 16). Fail closed.
- `src/core/ctx.js` — ownership header + session `ctx.agent = { optIn, lastIntent, events }`. No new WORLD_FIELDS. No new frozen event types.
- `src/main.js` — init after hail/save/chart/models, **before HUD**. `window.__ctx` stays debug.
- `scripts/boot-test.mjs` — named WAVE127 pins before the final `if (errors === 0)` block.

## Act PR1

- Signature `act({ v, name, args })` → `{ v, ok, error, name, token }`.
- `?agent=1` at boot sets `optIn` (no badge).
- Forbidden first (`teleport`, `setCredits`, `setHull`, `setCargo`, `god`, `win`, cheat-shaped names) → `token:'forbidden'` even without opt-in.
- No opt-in → `token:'opt-in'` (except observe).
- `ping` / `disable` ok while paused or `berthHold`. Later names → `paused` / `held`. Never write `berthHold`. Never map hold onto pause.
- Other names → `unknown`.
- `disable` clears optIn only; does not cancel AP/AM.
- `enable(ev)` requires `ev.isTrusted === true`.
- Does not assign `ctx.input`, `ctx.ship.object.position`, or `ctx.world.credits`.

## Not this PR

HTTP, LLM, helm, HUD hub child, persist, `agentHelm`, page WebSocket, badge, PR2 desk attach, PR3 pulse/latch.

## Graph

`graph_resolve` → `proceed_unmodeled` (`r-mt9ibjrs-dda6ef04`). No binding workflow. Did not mutate the graph.

## Nested-ctx fix (WAVE127 pins)

`bootFreshHarness` re-inits the full graph and used to replace `window.rimward` with a closure over the nested ctx. WAVE127 mutates the original `ctx.agent.optIn` then calls `window.rimward.act` → stale `opt-in`.

Product fix in `agent-api.js`:
- Keep the **first** public handle (`version === 1` + observe/act). Nested inits still harvest their own ctx in `update`.
- `observe` / `act` / `enable` / `disable` resolve `window.__ctx` when it is an object, else the first-install ctx.

## Verify

Node nested-init stub: first ctx ping/unknown; `__ctx` rebind follows the live bag. `npm run test:boot`: WAVE127 pins all true; `BOOT TEST PASS`. Did **not** start Vite/Chrome.
