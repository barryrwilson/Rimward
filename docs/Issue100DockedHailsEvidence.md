# Issue #100 — Docked hails stay off the station desk

[Issue #100](https://github.com/barryrwilson/Rimward/issues/100).

**Status: not done — build hold.** The runtime change is implemented. The
focused, boot, hail-identity and agent-hardening suites pass locally, and the
live browser probe now passes **7/7 pins on 2026-09-10** with a clean console.
`npm run build` and `npm run bundle:report` still **FAIL** under the unchanged
byte policy, and no new exception is authorized. Independent QA review is
**pending**. Nothing here claims a merged, released or deployed state.

## Outcome

While `ctx.flags.docked` is true the berth owns the screen. No hail is drawn
over the station panel, none survives the docking frame, and no path resolves
one:

- An incoming surrender or bargaining hail does not open. `canShowHail`
  refuses outright rather than deferring, so the single defer slot is not held.
- A card that is already up is closed on the docking frame, and the deferred
  slot is emptied, so a swallowed call cannot reappear at launch.
- Every resolution path refuses and moves nothing — no credits, cargo, fear or
  NPC state: the card button, the number key, `ctx.hailApi.resolve` and the
  public `hailResolve`.
- The public `hailResolve` and `observe().availability.hailResolve` both report
  the stable token `docked`, the token `selectTarget` already uses. The token
  does not race the frame's dock close, so a planner never sees `closed` for
  one frame and `docked` for the next.
- A demand keeps its existing close semantics: the `docked` outcome and the
  demand-shaped `hailClosed` the HUD already narrates ("demand broken. You
  docked."). A demand that *arrives* at the desk fail-closes as `docked`, not
  `voided`.

Undocked behaviour is unchanged, including issue #66 conversation identity,
`stale` / `closed` precedence, the button and digit paths, and the miss toast.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/overlay-policy.js` | New `dockedAtBerth(ctx)` session-flag helper. `canShowHail` refuses while docked, `takeDeferredHail` returns null, `hailDigitsAllowed` is false. |
| `src/systems/hail.js` | One card boundary in `openCard`, one resolution boundary in `resolveIntent`, a `docked` answer in `resolve`, `closeForDock()` on the docking frame, an arriving demand fail-closes as `docked`, and the KeyH press is swallowed without a miss toast. |
| `src/systems/agent-api.js` | `hailResolve` refuses with `docked` before the overlay gate, so a docked planner reads the real reason instead of `no-service`. |
| `src/game/agent-observe.js` | `availability.hailResolve` reports `docked`, agreeing with `act()`. |
| `package.json` | Adds `test:docked-hails` and `test:docked-hails-live`. |

No change to NPC hail attribution ([#99](https://github.com/barryrwilson/Rimward/issues/99))
or to the persisted throttle and control-expiry work
([#103](https://github.com/barryrwilson/Rimward/issues/103)).
No new persisted field, event type, key, gauge or schema version; the public
API stays at `VERSION` 2. See the
[public API contract](AgentApiDesign.md#issue-100--docked-hails) and the
[demand lifecycle brief](Hail01DemandLifecycleDesign.md).

## Verification — automated, local

- `npm run test:docked-hails` (`node scripts/issue-100-docked-hails-test.mjs`):
  **PASS, 37 checks**. Covers the refused incoming card, the card closed by
  docking with nothing granted, the transition window across all four
  resolution paths, availability agreeing with `act()`, the dropped deferred
  hail before and after launch, unchanged demand close semantics, the demand
  arriving at the desk, and undocked parity including stale identity, bound
  resolve, button and digit paths.
- `npm run test:boot`: PASS. Not edited or weakened.
- `npm run test:hail-identity`: PASS. Issue #66 identity is intact.
- `npm run test:agent-hardening`: PASS.

Raw output is local and untracked: `out/issue-100/focused-test-restored.log`
and the harness log `out/issue-100/claude-finish.log`.

## Build and bundle — FAIL, on hold

`npm run build` and `npm run bundle:report` fail the unchanged production byte
policy. Logs: `out/issue-100/build.log`, `out/issue-100/bundle-report.log`,
`out/issue-100/bundle-measurement-restored.json`.

| Field | Measured |
|---|---|
| JavaScript chunk | `assets/index-CY-oCepC.js` |
| Chunk SHA256 | `31e00966d7d17708ab99d0f81a31488bd3e45c4e0a998f062c09e9433ea36eb1` |
| Minified bytes | 1,835,953 (limit 1,800,000; +321 versus the previous exact exception) |
| Gzip bytes | 549,263 (limit 537,600; +94 versus the previous exact exception) |

The existing exact byte exception names only the previous SHA, so it does not
cover this artifact. **No new exception or budget change is authorized or
activated.** See the
[performance contract](ProductionPerformanceBudget.md) and the
[measured decision record](releases/issue-56-measured-decision.md). The
browser dependency boundary check passes: the bundle's only dependency is
Three.js, and no forbidden module is present. That check is not a passing
build.

## Verification — live browser, PASS

`npm run test:docked-hails-live` (`scripts/issue-100-live-probe.mjs`):
**PASS on 2026-09-10, 7/7 pins, 0 console errors, 0 uncaught exceptions.**
Headless Chrome over CDP, platform GPU (ANGLE / Intel UHD, D3D11).

| Pin | Result | Read from the live page |
|---|---|---|
| D1 ordinary docking | PASS | The real station panel is up, `berthOpen` false, no card. |
| D2 incoming surrender | PASS | No card painted at the desk; credits, fear, cargo and NPC state all unmoved. |
| D3 card closes on dock | PASS | A surrender open in flight is gone after docking, with nothing granted. |
| D4 attempts after real docking | PASS | The card had already closed (`stillUp: false`, `dockedNow: true`). A click on the retained button (`clicked: true`), a digit key, `ctx.hailApi.resolve` and public `hailResolve` all have no hail effect; nothing moves. |
| D5 stable `docked` token | PASS | `hailResolve`, bound `hailResolve`, `selectTarget` and `availability` all answer `docked`. |
| D6 deferred hail dropped | PASS | A hail deferred behind the chart is discarded on docking and never returns at launch. |
| D7 undocked unchanged | PASS | The same hull is heard again; a bound resolve pays the printed 120 UU demand. |

What live D4 does and does not prove. The final `probes.json` records
`stillUp: false`, `clicked: true`, `dockedNow: true`: by the first instant the
berth held the ship the card had already closed, so the battery fired against a
retained button and a live digit handler. Live D4 therefore proves that button
and digit attempts *after* a real docking, plus the direct `ctx.hailApi.resolve`
and public `hailResolve` paths, produce no hail effect and move nothing, and
that the two API paths answer `docked`. The human handlers simply ignore the
input — only the direct and public APIs return a `docked` token, so no token is
asserted for the click or the key. The true pre-update, still-visible transition
race — a card painted on screen at the moment the berth takes the ship — is
proven by the focused regression suite above, not by this live sample.

Docking and launching go through the real station panel; the probe never
writes `ctx.flags.docked`. Screenshots: `out/issue-100/live/`
(`02-d2-incoming-refused.png` shows the station desk alone under an emitted
surrender; `03-d3-card-in-flight.png` shows the real four-intent hail card in
flight; `04-d4-transition-refused.png` shows the digit key driving the station
menu instead of the card, with credits unchanged). Ledger and console:
`out/issue-100/live/probes.json`, `console.txt`, `run.log`.

Two limitations belong on the record:

- **Dev-server workaround.** The probe starts Vite through `createServer` with
  `server: { watch: null }` and `optimizeDeps: { noDiscovery: true,
  include: [] }`. On this workspace the cold dependency scan holds
  `/src/main.js` and `/src/core/ctx.js` open, and the chokidar watcher startup
  separately consumes about 1.2 GB and 80 CPU seconds and starves the server
  (independent CPU profile: `out/issue-100/quinn-vite-profile.json`). The
  dependency scan is not the sole cause. This is a harness-only override for a
  one-shot run that needs no HMR. `vite.config.js`, the production build and
  the bundle budget are unchanged.
- **Rare-fixture staging.** A surrender or demand card cannot be waited for in
  a live session, so a labelled fixture (`privilegedFixture`) spawns the hull,
  parks ambient traffic, pins the player hull and emits the ordinary
  `hailOpened` the game itself emits. The fixture stages only the rare hail. It
  never sets `ctx.flags.docked`, and every assertion reads the rendered DOM or
  the public `window.rimward` handle.

## Remaining before done

Live acceptance now passes, so criterion 4 of the `AGENTS.md` definition of
done is met. Criterion 2 still fails: the build and bundle budget are on hold
above. Independent QA review is pending. No pull request, approval or commit
identity is claimed.
