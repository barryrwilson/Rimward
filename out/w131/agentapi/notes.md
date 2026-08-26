# Wave 131 — Agent API PR2 (command intents)

**Status:** implemented. Serial PR2 of Wave 126 leftover freeze.
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.
**Graph:** prior `graph_resolve` → `proceed_unmodeled` (`r-mta8nqdx-e1f55e3b`). Did not write the graph.

## Landed

- `src/systems/station.js` — `initStation` assigns `ctx.stationDesk` before return. Helpers only. No overlay CSS/HTML. No functions on `ctx.station`.
- `src/systems/hail.js` — `initHail` assigns `ctx.hailApi = { resolve, peek }` before return. `resolve` only forwards intents that are on the open card (1-based index). Closed card is a no-op.
- `src/game/agent-schema.js` — PR2 names added to the live set via `isLiveCommand`. `isPr1LiveCommand` still ping/disable. PR3 names stay authored but not live. Forbidden list unchanged.
- `src/systems/agent-api.js` — PR2 `act` dispatch. Call-only into nav/AP/AM. Reads `hailDigitsAllowed` from overlay-policy. Imports `COMMODITIES` for `Object.hasOwn` only. Never assigns `ctx.input`, ship position, credits, or `flags.berthHold`.
- `scripts/boot-test.mjs` — WAVE127 unknown probe is now `notACommand`. Named WAVE131 block before `if (errors === 0)`.
- Docs: AgentApiDesign status/wave header; PROGRESS Wave 131 bullet.

Zero edits to `nav.js` / `autopilot.js` / `automine.js` / `overlay-policy.js` / `state.js` (import only) / `ctx.js`.

## Act PR2

Gate order unchanged: forbidden → opt-in → ping/disable → paused → held → live dispatch.

Refuse tokens:

| Case | token |
|---|---|
| uncharted / proto / empty dest | `noDest` |
| missing desk/hail attach, not docked, unknown service id, service mismatch | `no-service` |
| further desk acts on bar / outfitting / people / epics / shipyard | `v1-observe-only` |
| trade qty not integer `1..min(99, cargoCapacity)` or side not buy/sell | `bad-qty` |
| commodity not `Object.hasOwn(COMMODITIES)` | `bad-commodity` |
| feed kind not biomass/rock/tend | `no-service` |
| hail closed, unknown intent, `hailDigitsAllowed === false` | `no-service` |
| AP/AM refuse | live `AP_LINES` / `AM_LINES` keys (`noRock`, `noDest`, …) |
| PR3 names | `unknown` |
| teleport / cheats | `forbidden` |

`hailResolve` never calls `payTribute` unless that intent is on the open card.

`disable` still clears `optIn` only and does not cancel AP/AM.

## Iter 2 — desk fail-closed

Root cause: `tryTrade` / `acceptJob` / `act.repairAll` / `act.feed*` return `undefined` on both success and refuse (they only set `ui.notice`). Wrappers then discarded that, and `dispatchLive` always `return ok(...)`. Notice-before/after cannot distinguish success because success also writes notice.

Fix:
- Live `tryTrade` returns `false` on refuse, `true` after a real debit/credit.
- Feed/repair `act.*` return `false`/`true` the same way.
- `acceptJob` returns `true` only after `state = 'accepted'`; early returns stay falsy.
- Desk helpers return `{ ok, notice }`.
- `afterDesk` maps refuse → `fail` with `error` = live English. Tokens: `uu`, `hold`, `not-offered`, else `notice`.

WAVE131 pins added: `tradeNoUu`, `acceptMissingJob`, `repairRefuse`, `feedRefuse`.

## WAVE127 pin

`act({ name:'plotRoute' })` is live in PR2. Unknown probe is `notACommand`. Other WAVE127 pins unchanged.

## Not this PR

Pulse (`dock`/`hail`/`selectTarget`/`pulse`/`setWeaponGroup`), hypot latch, key-code, badge, HTTP/CDP, LLM runner, pad approach, `agentHelm`.

## Verify

`npm run test:boot`: WAVE127 agent-observe all true; WAVE131 agent-intents all true; `BOOT TEST PASS`. Did not start Vite/Chrome/Playwright.
